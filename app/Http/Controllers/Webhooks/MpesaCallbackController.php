<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\CoinsPurchaseService;
use App\Services\EscortPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Throwable;

class MpesaCallbackController extends Controller
{
    public function __construct(
        protected CoinsPurchaseService $coinsPurchaseService,
        protected EscortPaymentService $escortPaymentService,
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | STK PUSH CALLBACK
    |--------------------------------------------------------------------------
    */

    public function stk(Request $request): Response
    {
        $stk = $request->input('Body.stkCallback');

        if (!is_array($stk)) {
            Log::warning('Invalid M-PESA STK callback payload.');

            return response('OK', 200);
        }

        $checkoutId = trim((string) ($stk['CheckoutRequestID'] ?? ''));
        $merchantId = trim((string) ($stk['MerchantRequestID'] ?? ''));
        $resultCode = $stk['ResultCode'] ?? null;

        $resultDesc = (string) (
            $stk['ResultDesc'] ?? 'Unknown M-PESA result'
        );

        if ($checkoutId === '' || !is_numeric($resultCode)) {
            Log::warning('M-PESA STK callback missing required fields.', [
                'checkout_request_id' => $checkoutId,
                'merchant_request_id' => $merchantId,
                'result_code' => $resultCode,
            ]);

            return response('OK', 200);
        }

        try {
            $transaction = $this->coinsPurchaseService
                ->findByCheckoutRequestId($checkoutId);

            $paymentService = $this->coinsPurchaseService;

            if (!$transaction) {
                $transaction = $this->escortPaymentService
                    ->findByCheckoutRequestId($checkoutId);

                $paymentService = $this->escortPaymentService;
            }

            if (!$transaction) {
                Log::warning('STK callback received for unknown transaction.', [
                    'checkout_request_id' => $checkoutId,
                    'merchant_request_id' => $merchantId,
                ]);

                return response('OK', 200);
            }

            $resultCode = (int) $resultCode;

            if ($resultCode === 0) {
                $items = data_get($stk, 'CallbackMetadata.Item', []);
                $items = is_array($items) ? $items : [];

                $receipt = collect($items)
                    ->firstWhere('Name', 'MpesaReceiptNumber');

                $receiptNumber = data_get($receipt, 'Value');

                $amountItem = collect($items)
                    ->firstWhere('Name', 'Amount');

                $paidAmount = $this->wholeKesAmount(
                    data_get($amountItem, 'Value')
                );

                if (blank($receiptNumber)) {
                    Log::warning(
                        'Successful STK callback received without receipt.',
                        [
                            'transaction_id' => $transaction->id,
                            'checkout_request_id' => $checkoutId,
                        ]
                    );

                    return response('OK', 200);
                }

                if ($paidAmount === null) {
                    Log::warning(
                        'Successful STK callback received without valid amount.',
                        [
                            'transaction_id' => $transaction->id,
                            'checkout_request_id' => $checkoutId,
                        ]
                    );

                    return response('OK', 200);
                }

                $paymentService->confirmPayment(
                    $transaction,
                    (string) $receiptNumber,
                    true,
                    $paidAmount
                );

                Log::info('M-PESA STK confirmation processed.', [
                    'transaction_id' => $transaction->id,
                    'checkout_request_id' => $checkoutId,
                    'receipt' => $receiptNumber,
                    'amount' => $paidAmount,
                    'payment_type' => $transaction->type,
                ]);
            } else {
                $paymentService->failPayment(
                    $transaction,
                    $resultDesc
                );

                Log::info('M-PESA STK payment unsuccessful.', [
                    'transaction_id' => $transaction->id,
                    'checkout_request_id' => $checkoutId,
                    'result_code' => $resultCode,
                    'result_desc' => $resultDesc,
                ]);
            }
        } catch (Throwable $e) {
            Log::error('Failed to process M-PESA STK callback.', [
                'checkout_request_id' => $checkoutId,
                'merchant_request_id' => $merchantId,
                'error' => $e->getMessage(),
            ]);
        }

        // STK callback acknowledgement.
        return response('OK', 200);
    }

    /*
    |--------------------------------------------------------------------------
    | C2B VALIDATION CALLBACK
    |--------------------------------------------------------------------------
    */

    public function c2bValidation(Request $request): JsonResponse
    {
        $billRef = strtoupper(trim(
            (string) $request->input('BillRefNumber', '')
        ));

        $amount = $this->wholeKesAmount(
            $request->input('TransAmount')
        );

        $accepted = false;
        $reason = 'Invalid payment reference or amount.';

        if ($billRef !== '' && $amount !== null) {
            try {
                if (
                    preg_match(
                        '/^C-(\d+)-([A-Z0-9]{4,20})$/',
                        $billRef
                    ) === 1
                ) {
                    $accepted = $this->coinsPurchaseService
                        ->validateDirectPayment($billRef, $amount);

                } elseif (
                    preg_match(
                        '/^E-(\d+)-(\d+)-([A-Z0-9]{4,20})$/',
                        $billRef
                    ) === 1
                ) {
                    $accepted = $this->escortPaymentService
                        ->validateDirectPayment($billRef, $amount);
                }

                if ($accepted) {
                    $reason = 'Accepted';
                }
            } catch (Throwable $e) {
                Log::error('M-PESA C2B validation failed.', [
                    'bill_ref' => $billRef,
                    'amount' => $amount,
                    'error' => $e->getMessage(),
                ]);

                return $this->c2bResponse(
                    1,
                    'Unable to validate payment.'
                );
            }
        }

        Log::info('M-PESA C2B validation received.', [
            'bill_ref' => $billRef,
            'amount' => $amount,
            'accepted' => $accepted,
        ]);

        return $this->c2bResponse(
            $accepted ? 0 : 1,
            $reason
        );
    }

    /*
    |--------------------------------------------------------------------------
    | C2B CONFIRMATION CALLBACK
    |--------------------------------------------------------------------------
    */

    public function c2bConfirmation(Request $request): JsonResponse
    {
        $billRef = strtoupper(trim(
            (string) $request->input('BillRefNumber', '')
        ));

        $receipt = strtoupper(trim(
            (string) $request->input('TransID', '')
        ));

        $amount = $this->wholeKesAmount(
            $request->input('TransAmount')
        );

        $phone = trim(
            (string) $request->input('MSISDN', '')
        );

        if (
            $billRef === ''
            || $receipt === ''
            || $amount === null
        ) {
            Log::warning('Invalid M-PESA C2B confirmation.', [
                'bill_ref' => $billRef,
                'receipt' => $receipt,
                'amount' => $request->input('TransAmount'),
            ]);

            return $this->c2bResponse(
                1,
                'Invalid confirmation details.'
            );
        }

        try {
            $transaction = null;
            $paymentType = null;

            if (
                preg_match(
                    '/^C-(\d+)-([A-Z0-9]{4,20})$/',
                    $billRef
                ) === 1
            ) {
                $paymentType = 'coins';

                $transaction = $this->coinsPurchaseService
                    ->confirmDirectPayment(
                        $billRef,
                        $receipt,
                        $amount,
                        $phone
                    );

            } elseif (
                preg_match(
                    '/^E-(\d+)-(\d+)-([A-Z0-9]{4,20})$/',
                    $billRef
                ) === 1
            ) {
                $paymentType = 'escort';

                $transaction = $this->escortPaymentService
                    ->confirmDirectPayment(
                        $billRef,
                        $receipt,
                        $amount,
                        $phone
                    );

            } else {
                Log::warning(
                    'Unrecognized M-PESA C2B payment reference.',
                    [
                        'bill_ref' => $billRef,
                        'receipt' => $receipt,
                    ]
                );

                return $this->c2bResponse(
                    1,
                    'Unrecognized payment reference.'
                );
            }

            if (!$transaction) {
                Log::warning(
                    'M-PESA C2B payment could not be processed.',
                    [
                        'bill_ref' => $billRef,
                        'receipt' => $receipt,
                        'amount' => $amount,
                        'payment_type' => $paymentType,
                    ]
                );

                return $this->c2bResponse(
                    1,
                    'Payment could not be processed.'
                );
            }

            Log::info(
                'M-PESA C2B payment successfully processed.',
                [
                    'transaction_id' => $transaction->id,
                    'receipt' => $receipt,
                    'bill_ref' => $billRef,
                    'amount' => $amount,
                    'payment_type' => $paymentType,
                ]
            );

            return $this->c2bResponse(
                0,
                'Accepted'
            );

        } catch (Throwable $e) {
            Log::error(
                'Failed to process M-PESA C2B confirmation.',
                [
                    'bill_ref' => $billRef,
                    'receipt' => $receipt,
                    'amount' => $amount,
                    'error' => $e->getMessage(),
                ]
            );

            // Do not falsely acknowledge a payment that failed
            // during internal processing.
            return $this->c2bResponse(
                1,
                'Internal payment processing error.',
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Standard M-PESA C2B JSON response.
     */
    private function c2bResponse(
        int $resultCode,
        string $resultDesc,
        int $httpStatus = 200,
    ): JsonResponse {
        return response()->json([
            'ResultCode' => $resultCode,
            'ResultDesc' => $resultDesc,
        ], $httpStatus);
    }

    /**
     * Convert a valid whole-KES amount into an integer.
     */
    private function wholeKesAmount(mixed $amount): ?int
    {
        if (
            !is_numeric($amount)
            || !is_finite((float) $amount)
            || (float) $amount <= 0
            || floor((float) $amount) !== (float) $amount
            || (float) $amount > PHP_INT_MAX
        ) {
            return null;
        }

        return (int) $amount;
    }
}
