<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class MpesaService
{
    protected string $baseUrl;
    protected string $env;

    protected string $shortcode;
    protected string $passkey;
    protected string $consumerKey;
    protected string $consumerSecret;

    protected string $initiatorName;
    protected string $initiatorPassword;
    protected string $b2cShortcode;

    protected string $callbackUrl;
    protected string $resultUrl;
    protected string $queueTimeoutUrl;

    protected string $c2bValidationUrl;
    protected string $c2bConfirmationUrl;

    protected ?string $securityCredential = null;
    protected ?string $certificatePath = null;

    public function __construct()
    {
        $this->env = (string) config('services.mpesa.env', 'sandbox');

        $this->baseUrl = $this->env === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';

        $this->shortcode = (string) config('services.mpesa.shortcode', '');
        $this->passkey = (string) config('services.mpesa.passkey', '');

        $this->consumerKey = (string) config('services.mpesa.consumer_key', '');
        $this->consumerSecret = (string) config('services.mpesa.consumer_secret', '');

        $this->initiatorName = (string) config('services.mpesa.initiator_name', '');
        $this->initiatorPassword = (string) config('services.mpesa.initiator_password', '');
        $this->b2cShortcode = (string) config('services.mpesa.b2c_shortcode', '');

        $this->callbackUrl = (string) config('services.mpesa.callback_url', '');
        $this->resultUrl = (string) config('services.mpesa.result_url', '');
        $this->queueTimeoutUrl = (string) config('services.mpesa.queue_timeout_url', '');

        $this->c2bValidationUrl = (string) config('services.mpesa.validation_url', '');
        $this->c2bConfirmationUrl = (string) config('services.mpesa.confirmation_url', '');

        $this->certificatePath = config('services.mpesa.certificate_path');

        if (!$this->certificatePath) {
            $this->certificatePath = $this->env === 'production'
                ? storage_path('app/certs/ProductionCertificate.cer')
                : storage_path('app/certs/SandboxCertificate.cer');
        }

        if ($this->initiatorPassword !== '') {
            $this->securityCredential = $this->generateCredential($this->initiatorPassword);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Configuration
    |--------------------------------------------------------------------------
    */

    public function isStkConfigured(): bool
    {
        return $this->shortcode !== ''
            && $this->passkey !== ''
            && $this->consumerKey !== ''
            && $this->consumerSecret !== ''
            && $this->callbackUrl !== '';
    }

    public function isB2cConfigured(): bool
    {
        return $this->consumerKey !== ''
            && $this->consumerSecret !== ''
            && $this->securityCredential !== null
            && $this->initiatorName !== ''
            && $this->b2cShortcode !== ''
            && $this->resultUrl !== ''
            && $this->queueTimeoutUrl !== '';
    }

    public function isC2bConfigured(): bool
    {
        return $this->shortcode !== ''
            && $this->consumerKey !== ''
            && $this->consumerSecret !== ''
            && $this->c2bValidationUrl !== ''
            && $this->c2bConfirmationUrl !== '';
    }

    /*
    |--------------------------------------------------------------------------
    | Shared Payment Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique payment reference.
     */
    public function generateReference(string $prefix, User $user): string
    {
        return strtoupper($prefix)
            . '-'
            . $user->id
            . '-'
            . Str::upper(Str::random(10));
    }

    /**
     * Validate a Kenyan M-PESA phone number.
     */
    public function validPhone(string $phone): bool
    {
        return $this->formatPhone($phone) !== null;
    }

    /*
    |--------------------------------------------------------------------------
    | B2C Security Credential
    |--------------------------------------------------------------------------
    */

    protected function generateCredential(string $password): ?string
    {
        if (!$this->certificatePath || !is_file($this->certificatePath)) {
            Log::error('M-PESA certificate file not found.', [
                'certificate_path' => $this->certificatePath,
            ]);

            return null;
        }

        try {
            $certificate = file_get_contents($this->certificatePath);

            if ($certificate === false) {
                return null;
            }

            $publicKey = openssl_pkey_get_public($certificate);

            if (!$publicKey) {
                Log::error('Unable to load M-PESA public certificate.');

                return null;
            }

            $encrypted = '';

            $success = openssl_public_encrypt(
                $password,
                $encrypted,
                $publicKey,
                OPENSSL_PKCS1_PADDING
            );

            openssl_pkey_free($publicKey);

            if (!$success) {
                Log::error('Unable to encrypt M-PESA security credential.');

                return null;
            }

            return base64_encode($encrypted);
        } catch (Throwable $e) {
            Log::error('M-PESA credential generation failed.', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | OAuth Access Token
    |--------------------------------------------------------------------------
    */

    protected function generateToken(): ?string
    {
        if ($this->consumerKey === '' || $this->consumerSecret === '') {
            return null;
        }

        $cacheKey = 'mpesa.access_token.' . hash('sha256', $this->consumerKey);

        try {
            $cachedToken = Cache::get($cacheKey);

            if (is_string($cachedToken) && $cachedToken !== '') {
                return $cachedToken;
            }

            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                ->acceptJson()
                ->connectTimeout(10)
                ->timeout(20)
                ->get($this->baseUrl . '/oauth/v1/generate', [
                    'grant_type' => 'client_credentials',
                ]);

            if (!$response->successful()) {
                Log::error('M-PESA OAuth request failed.', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);

                return null;
            }

            $token = $response->json('access_token');

            if (!is_string($token) || $token === '') {
                Log::error('M-PESA OAuth response did not contain an access token.', [
                    'body' => $response->json(),
                ]);

                return null;
            }

            Cache::put($cacheKey, $token, now()->addSeconds(3500));

            return $token;
        } catch (Throwable $e) {
            Log::error('M-PESA OAuth exception.', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STK Push
    |--------------------------------------------------------------------------
    */

    public function stkPush(
        string $phone,
        int $amount,
        string $accountReference,
        string $transactionDesc
    ): array {
        if (!$this->isStkConfigured()) {
            return [
                'success' => false,
                'uncertain' => false,
                'message' => 'M-PESA STK configuration is incomplete.',
            ];
        }

        if ($amount <= 0) {
            return [
                'success' => false,
                'uncertain' => false,
                'message' => 'Invalid payment amount.',
            ];
        }

        $phone = $this->formatPhone($phone);

        if (!$phone) {
            return [
                'success' => false,
                'uncertain' => false,
                'message' => 'Invalid M-PESA phone number.',
            ];
        }

        $token = $this->generateToken();

        if (!$token) {
            return [
                'success' => false,
                'uncertain' => false,
                'message' => 'Unable to authenticate with M-PESA. Please try again.',
            ];
        }

        $timestamp = now()->format('YmdHis');

        $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => $amount,
            'PartyA' => $phone,
            'PartyB' => $this->shortcode,
            'PhoneNumber' => $phone,
            'CallBackURL' => $this->callbackUrl,
            'AccountReference' => $accountReference,
            'TransactionDesc' => $transactionDesc,
        ];

        try {
            $response = Http::withToken($token)
                ->acceptJson()
                ->asJson()
                ->connectTimeout(10)
                ->timeout(30)
                ->post($this->baseUrl . '/mpesa/stkpush/v1/processrequest', $payload);

            $body = $response->json() ?? [];

            if (!$response->successful()) {
                $uncertain = $response->serverError()
                    || in_array($response->status(), [408, 429], true);

                Log::error('M-PESA STK HTTP error.', [
                    'status' => $response->status(),
                    'body' => $body,
                    'uncertain' => $uncertain,
                ]);

                return [
                    'success' => false,
                    'uncertain' => $uncertain,
                    'message' => $body['errorMessage']
                        ?? 'M-PESA could not confirm the STK request.',
                    'raw' => $body,
                ];
            }

            $responseCode = $body['ResponseCode'] ?? null;

            if ($responseCode === null || $responseCode === '') {
                Log::warning('M-PESA STK response did not contain ResponseCode.', [
                    'body' => $body,
                ]);

                return [
                    'success' => false,
                    'uncertain' => true,
                    'message' => 'M-PESA returned an incomplete response. Payment status must be verified.',
                    'raw' => $body,
                ];
            }

            if ((string) $responseCode !== '0') {
                return [
                    'success' => false,
                    'uncertain' => false,
                    'message' => $body['ResponseDescription']
                        ?? $body['errorMessage']
                        ?? 'M-PESA rejected the STK request.',
                    'raw' => $body,
                ];
            }

            $checkoutRequestId = $body['CheckoutRequestID'] ?? null;

            if (!is_string($checkoutRequestId) || $checkoutRequestId === '') {
                Log::warning('M-PESA accepted STK request without CheckoutRequestID.', [
                    'body' => $body,
                ]);

                return [
                    'success' => false,
                    'uncertain' => true,
                    'message' => 'M-PESA accepted the request but did not return a checkout ID. Payment status must be verified.',
                    'raw' => $body,
                ];
            }

            return [
                'success' => true,
                'uncertain' => false,
                'checkout_request_id' => $checkoutRequestId,
                'merchant_request_id' => $body['MerchantRequestID'] ?? null,
                'customer_message' => $body['CustomerMessage'] ?? null,
                'message' => $body['CustomerMessage']
                    ?? $body['ResponseDescription']
                    ?? 'STK Push request accepted.',
                'raw' => $body,
            ];
        } catch (Throwable $e) {
            Log::error('M-PESA STK request exception.', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'uncertain' => true,
                'message' => 'The STK request outcome is uncertain. Please wait while its status is verified.',
            ];
        }
    }

    public function initiateStk(
        string $phone,
        int $amountKes,
        string $reference,
        string $description
    ): array {
        $raw = $this->stkPush($phone, $amountKes, $reference, $description);

        $checkoutRequestId = $raw['checkout_request_id'] ?? null;
        $merchantRequestId = $raw['merchant_request_id'] ?? null;

        $success = (bool) ($raw['success'] ?? false);
        $uncertain = (bool) ($raw['uncertain'] ?? false);

        if ($success && blank($checkoutRequestId)) {
            $success = false;
            $uncertain = true;
        }

        return [
            'success' => $success,
            'uncertain' => $uncertain,
            'checkout_request_id' => $checkoutRequestId,
            'merchant_request_id' => $merchantRequestId,
            'message' => $raw['message']
                ?? $raw['customer_message']
                ?? 'M-PESA did not provide a response message.',
            'raw' => $raw,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | STK Query
    |--------------------------------------------------------------------------
    */

    public function stkQuery(string $checkoutRequestId): array
    {
        if (
            $this->shortcode === ''
            || $this->passkey === ''
            || trim($checkoutRequestId) === ''
        ) {
            return [
                'success' => false,
                'message' => 'STK query configuration or checkout ID is missing.',
            ];
        }

        $token = $this->generateToken();

        if (!$token) {
            return [
                'success' => false,
                'message' => 'Unable to authenticate with M-PESA.',
            ];
        }

        $timestamp = now()->format('YmdHis');

        $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'CheckoutRequestID' => trim($checkoutRequestId),
        ];

        try {
            $response = Http::withToken($token)
                ->acceptJson()
                ->asJson()
                ->connectTimeout(10)
                ->timeout(30)
                ->post($this->baseUrl . '/mpesa/stkpushquery/v1/query', $payload);

            $body = $response->json();

            if (!$response->successful()) {
                $body = is_array($body)
                    ? $body
                    : ['response_body' => $response->body()];

                Log::error('M-PESA STK Query HTTP failure.', [
                    'environment' => $this->env,
                    'http_status' => $response->status(),
                    'checkout_request_id' => $checkoutRequestId,
                    'response' => $body,
                ]);

                return [
                    'success' => false,
                    'message' => 'M-PESA STK query HTTP request failed. HTTP ' . $response->status(),
                    'http_status' => $response->status(),
                    'raw' => $body,
                ];
            }

            $body = is_array($body) ? $body : [];

            if ((string) ($body['ResponseCode'] ?? '') !== '0') {
                $message = $body['ResponseDescription']
                    ?? $body['errorMessage']
                    ?? 'M-PESA could not process the STK query.';

                Log::warning('M-PESA STK Query rejected.', [
                    'checkout_request_id' => $checkoutRequestId,
                    'response' => $body,
                ]);

                return [
                    'success' => false,
                    'message' => $message,
                    'raw' => $body,
                ];
            }

            $resultCode = $body['ResultCode'] ?? null;

            return [
                'success' => true,
                'result_code' => $resultCode !== null && $resultCode !== ''
                    ? (int) $resultCode
                    : null,
                'result_desc' => $body['ResultDesc'] ?? '',
                'receipt' => $body['MpesaReceiptNumber'] ?? null,
                'raw' => $body,
            ];
        } catch (Throwable $e) {
            Log::error('M-PESA STK Query exception.', [
                'checkout_request_id' => $checkoutRequestId,
                'environment' => $this->env,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Unable to query M-PESA: ' . $e->getMessage(),
            ];
        }
    }

    public function queryStk(string $checkoutRequestId): array
    {
        $raw = $this->stkQuery($checkoutRequestId);

        $resultCode = $raw['result_code'] ?? null;
        $resultDescription = $raw['result_desc']
            ?? $raw['message']
            ?? null;
        $receipt = $raw['receipt'] ?? null;

        return [
            'success' => (bool) ($raw['success'] ?? false),
            'result_code' => $resultCode,
            'result_desc' => $resultDescription,
            'receipt' => $receipt,
            'message' => $raw['message']
                ?? $resultDescription
                ?? 'Payment status is not yet confirmed.',
            'raw' => $raw,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | B2C Payment
    |--------------------------------------------------------------------------
    */

    public function processB2C(
        string $phone,
        int $amount,
        string $commandId = 'BusinessPayment',
        string $remarks = 'Mingle payment',
        string $occasion = ''
    ): array {
        if (!$this->isB2cConfigured()) {
            return [
                'success' => false,
                'uncertain' => false,
                'message' => 'M-PESA B2C configuration is incomplete.',
            ];
        }

        if ($amount <= 0) {
            return [
                'success' => false,
                'uncertain' => false,
                'message' => 'Invalid B2C amount.',
            ];
        }

        $phone = $this->formatPhone($phone);

        if (!$phone) {
            return [
                'success' => false,
                'uncertain' => false,
                'message' => 'Invalid B2C phone number.',
            ];
        }

        $token = $this->generateToken();

        if (!$token) {
            return [
                'success' => false,
                'uncertain' => false,
                'message' => 'Unable to authenticate with M-PESA.',
            ];
        }

        try {
            $response = Http::withToken($token)
                ->acceptJson()
                ->asJson()
                ->connectTimeout(10)
                ->timeout(30)
                ->post($this->baseUrl . '/mpesa/b2c/v3/paymentrequest', [
                    'InitiatorName' => $this->initiatorName,
                    'SecurityCredential' => $this->securityCredential,
                    'CommandID' => $commandId,
                    'Amount' => $amount,
                    'PartyA' => $this->b2cShortcode,
                    'PartyB' => $phone,
                    'Remarks' => $remarks,
                    'QueueTimeOutURL' => $this->queueTimeoutUrl,
                    'ResultURL' => $this->resultUrl,
                    'Occasion' => $occasion,
                ]);

            $body = $response->json() ?? [];

            if (!$response->successful()) {
                $uncertain = $response->serverError()
                    || in_array($response->status(), [408, 429], true);

                Log::error('M-PESA B2C HTTP error.', [
                    'status' => $response->status(),
                    'body' => $body,
                    'uncertain' => $uncertain,
                ]);

                return [
                    'success' => false,
                    'uncertain' => $uncertain,
                    'message' => $body['errorMessage']
                        ?? 'M-PESA B2C request failed.',
                    'raw' => $body,
                ];
            }

            $responseCode = $body['ResponseCode'] ?? null;

            if ($responseCode === null || $responseCode === '') {
                return [
                    'success' => false,
                    'uncertain' => true,
                    'message' => 'M-PESA returned an incomplete B2C response. Verify the request status.',
                    'raw' => $body,
                ];
            }

            if ((string) $responseCode !== '0') {
                return [
                    'success' => false,
                    'uncertain' => false,
                    'message' => $body['ResponseDescription']
                        ?? $body['errorMessage']
                        ?? 'M-PESA rejected the B2C request.',
                    'raw' => $body,
                ];
            }

            return [
                'success' => true,
                'uncertain' => false,
                'conversation_id' => $body['ConversationID'] ?? null,
                'originator_conversation_id' => $body['OriginatorConversationID'] ?? null,
                'message' => $body['ResponseDescription'] ?? 'B2C request accepted.',
                'raw' => $body,
            ];
        } catch (Throwable $e) {
            Log::error('M-PESA B2C exception.', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'uncertain' => true,
                'message' => 'The B2C request outcome is uncertain. Verify its status before retrying.',
            ];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | C2B URL Registration
    |--------------------------------------------------------------------------
    */

    public function registerC2bUrls(): array
    {
        if (!$this->isC2bConfigured()) {
            return [
                'success' => false,
                'message' => 'M-PESA C2B configuration is incomplete.',
            ];
        }

        $token = $this->generateToken();

        if (!$token) {
            return [
                'success' => false,
                'message' => 'Unable to authenticate with M-PESA.',
            ];
        }

        try {
            $response = Http::withToken($token)
                ->acceptJson()
                ->asJson()
                ->connectTimeout(10)
                ->timeout(30)
                ->post($this->baseUrl . '/mpesa/c2b/v1/registerurl', [
                    'ShortCode' => $this->shortcode,
                    'ResponseType' => 'Completed',
                    'ConfirmationURL' => $this->c2bConfirmationUrl,
                    'ValidationURL' => $this->c2bValidationUrl,
                ]);

            $body = $response->json() ?? [];

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'message' => $body['errorMessage']
                        ?? 'Unable to register C2B URLs.',
                    'raw' => $body,
                ];
            }

            $success = (string) ($body['ResponseCode'] ?? '') === '0';

            return [
                'success' => $success,
                'message' => $body['ResponseDescription']
                    ?? ($success
                        ? 'C2B URLs registered successfully.'
                        : 'M-PESA did not confirm C2B URL registration.'),
                'raw' => $body,
            ];
        } catch (Throwable $e) {
            Log::error('M-PESA C2B URL registration exception.', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'C2B URL registration failed.',
            ];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Phone Formatting
    |--------------------------------------------------------------------------
    */

    protected function formatPhone(string $phone): ?string
    {
        $phone = preg_replace('/\D+/', '', trim($phone));

        if (!$phone) {
            return null;
        }

        if (str_starts_with($phone, '0')) {
            $phone = '254' . substr($phone, 1);
        } elseif (str_starts_with($phone, '7') || str_starts_with($phone, '1')) {
            $phone = '254' . $phone;
        }

        return preg_match('/^254[17]\d{8}$/', $phone)
            ? $phone
            : null;
    }
}