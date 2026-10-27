<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpesaService
{
    protected string $baseUrl;
    protected string $shortcode;
    protected string $passkey;
    protected string $key;
    protected string $secret;
    protected string $initiator;
    protected string $initiatorPassword;
    protected string $b2cShortcode;
    protected string $stkCallbackUrl;
    protected string $b2cResultUrl;
    protected string $timeoutUrl;
    protected ?string $securityCredential = null;
    protected string $certificatePath;

    public function __construct()
    {
        $isProd = config('services.mpesa.env') === 'production';

        $this->certificatePath = $isProd
            ? database_path('certs/ProductionCertificate.cer')
            : database_path('certs/SandboxCertificate.cer');

        $this->baseUrl = $isProd
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';

        $this->shortcode = (string) config('services.mpesa.shortcode');
        $this->passkey = (string) config('services.mpesa.passkey');
        $this->key = (string) config('services.mpesa.consumer_key');
        $this->secret = (string) config('services.mpesa.consumer_secret');
        $this->initiator = (string) config('services.mpesa.initiator_name');
        $this->initiatorPassword = (string) config('services.mpesa.initiator_password');
        $this->b2cShortcode = (string) config('services.mpesa.b2c_shortcode');
        $this->stkCallbackUrl = (string) config('services.mpesa.callback_url');
        $this->b2cResultUrl = (string) config('services.mpesa.result_url');
        $this->timeoutUrl = (string) config('services.mpesa.queue_timeout_url');

        try {
            if ($this->initiatorPassword !== '') {
                $this->securityCredential = $this->generateCredential($this->initiatorPassword);
            }
        } catch (\Throwable $e) {
            Log::warning('M-PESA B2C credential generation failed (STK unaffected)', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function generateCredential(string $initiatorPassword): string
    {
        $cert = @file_get_contents($this->certificatePath);
        if (!$cert) {
            throw new Exception("Unable to read certificate at: {$this->certificatePath}");
        }

        $publicKey = openssl_pkey_get_public($cert);
        if (!$publicKey) {
            throw new Exception('Invalid public key in certificate.');
        }

        $encrypted = '';
        $ok = openssl_public_encrypt($initiatorPassword, $encrypted, $publicKey, OPENSSL_PKCS1_PADDING);
        if (!$ok) {
            throw new Exception('Failed to encrypt initiator password.');
        }

        return base64_encode($encrypted);
    }

    public function generateToken(): ?string
    {
        try {
            $credentials = base64_encode("{$this->key}:{$this->secret}");

            $res = Http::withHeaders(['Authorization' => "Basic {$credentials}"])
                ->timeout(15)
                ->get("{$this->baseUrl}/oauth/v1/generate", ['grant_type' => 'client_credentials']);

            return $res->successful() ? ($res->json()['access_token'] ?? null) : null;
        } catch (\Throwable $e) {
            Log::error('M-PESA token failed: ' . $e->getMessage());
            return null;
        }
    }

    public function stkPush(
        string $phone,
        float $amount,
        ?string $reference = null,
        ?string $description = null
    ): array {
        $token = $this->generateToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Failed to generate authentication token'];
        }

        $phone = formatPhoneNumber($phone);
        $timestamp = now()->format('YmdHis');
        $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

        $payload = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => (int) round($amount),
            'PartyA' => $phone,
            'PartyB' => $this->shortcode,
            'PhoneNumber' => $phone,
            'CallBackURL' => $this->stkCallbackUrl,
            'AccountReference' => $reference ?? substr($phone, -9),
            'TransactionDesc' => $description ?? 'MingleKE coins top-up',
        ];

        try {
            $res = Http::withToken($token)->timeout(30)
                ->post("{$this->baseUrl}/mpesa/stkpush/v1/processrequest", $payload);

            if (!$res->successful()) {
                Log::warning('STK push failed', ['status' => $res->status(), 'body' => $res->body()]);
                return ['success' => false, 'message' => 'M-PESA rejected the request. Try again.'];
            }

            $body = $res->json();

            if (($body['ResponseCode'] ?? null) !== '0') {
                return [
                    'success' => false,
                    'message' => $body['ResponseDescription'] ?? 'Request not accepted by M-PESA.',
                ];
            }

            return [
                'success' => true,
                'checkout_request_id' => $body['CheckoutRequestID'] ?? null,
                'merchant_request_id' => $body['MerchantRequestID'] ?? null,
                'raw' => $body,
            ];
        } catch (\Throwable $e) {
            Log::error('STK push exception: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Could not reach M-PESA. Try again.'];
        }
    }

    public function stkQuery(string $checkoutRequestId): array
    {
        $token = $this->generateToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Failed to generate authentication token'];
        }

        $timestamp = now()->format('YmdHis');
        $password = base64_encode($this->shortcode . $this->passkey . $timestamp);

        try {
            $res = Http::withToken($token)->timeout(15)->post(
                "{$this->baseUrl}/mpesa/stkpushquery/v1/query",
                [
                    'BusinessShortCode' => $this->shortcode,
                    'Password' => $password,
                    'Timestamp' => $timestamp,
                    'CheckoutRequestID' => $checkoutRequestId,
                ]
            );

            if (!$res->successful()) {
                return ['success' => false, 'message' => 'Query failed'];
            }

            $body = $res->json();
            return [
                'success' => true,
                'result_code' => (int) ($body['ResultCode'] ?? -1),
                'result_desc' => $body['ResultDesc'] ?? '',
                'raw' => $body,
            ];
        } catch (\Throwable $e) {
            Log::error('STK query failed: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Query exception'];
        }
    }

    /**
     * B2C payout (used later for escort/creator withdrawals).
     * The caller is responsible for persisting the result against
     * whatever ledger row tracks the payout (e.g. a Withdrawal model).
     */
    public function processB2C(
        string $phone,
        float $amount,
        ?string $remarks = 'B2C - Withdrawal',
        ?string $occasion = 'Payout'
    ): array {
        if (!$this->securityCredential) {
            return ['success' => false, 'message' => 'B2C security credential unavailable'];
        }

        $token = $this->generateToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Failed to generate authentication token'];
        }

        $payload = [
            'InitiatorName' => $this->initiator,
            'SecurityCredential' => $this->securityCredential,
            'CommandID' => config('mpesa.b2c_command_id', 'BusinessPayment'),
            'Amount' => round($amount, 2),
            'PartyA' => $this->b2cShortcode,
            'PartyB' => formatPhoneNumber($phone),
            'Remarks' => $remarks,
            'QueueTimeOutURL' => $this->timeoutUrl,
            'ResultURL' => $this->b2cResultUrl,
            'Occasion' => $occasion,
        ];

        try {
            $res = Http::withToken($token)->timeout(30)
                ->post("{$this->baseUrl}/mpesa/b2c/v1/paymentrequest", $payload);

            if (!$res->successful()) {
                return ['success' => false, 'message' => 'Error initiating B2C, try again.'];
            }

            $data = $res->json();

            return [
                'success' => true,
                'message' => 'B2C initiated successfully',
                'conversation_id' => $data['ConversationID'] ?? null,
                'originator_conversation_id' => $data['OriginatorConversationID'] ?? null,
                'raw' => $data,
            ];
        } catch (\Throwable $e) {
            Log::error('B2C exception: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Could not reach M-PESA.'];
        }
    }

    /**
     * Register C2B Validation + Confirmation URLs with Safaricom.
     * Call once per environment via `php artisan mpesa:register-c2b`.
     */
    public function registerC2bUrls(string $validationUrl, string $confirmationUrl): array
    {
        $token = $this->generateToken();
        if (!$token) {
            return ['success' => false, 'message' => 'Failed to generate authentication token'];
        }

        try {
            $res = Http::withToken($token)->timeout(20)->post(
                "{$this->baseUrl}/mpesa/c2b/v1/registerurl",
                [
                    'ShortCode' => $this->shortcode,
                    'ResponseType' => 'Completed',
                    'ConfirmationURL' => $confirmationUrl,
                    'ValidationURL' => $validationUrl,
                ]
            );

            if (!$res->successful()) {
                Log::warning('C2B URL registration failed', [
                    'status' => $res->status(),
                    'body' => $res->body(),
                ]);
                return [
                    'success' => false,
                    'message' => 'M-PESA rejected the registration.',
                    'raw' => $res->json(),
                ];
            }

            return ['success' => true, 'raw' => $res->json()];
        } catch (\Throwable $e) {
            Log::error('C2B URL registration exception: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Could not reach M-PESA.'];
        }
    }
}