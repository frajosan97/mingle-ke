<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\CoinsPurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Throwable;

class MpesaCallbackController extends Controller
{
    public function __construct(
        protected CoinsPurchaseService $CoinsPurchaseService
    ) {
    }

    /**
     * M-PESA STK Push callback.
     */
    public function stk(Request $request): Response
    {
        $stk = $request->input('Body.stkCallback');

        if (!is_array($stk)) {
            Log::warning('Invalid M-PESA STK callback payload.');

            return response('OK');
        }

        $checkoutId = $stk['CheckoutRequestID'] ?? null;
        $merchantId = $stk['MerchantRequestID'] ?? null;
        $resultCode = $stk['ResultCode'] ?? null;
        $resultDesc = (string) ($stk['ResultDesc'] ?? 'Unknown M-PESA result');

        if (!$checkoutId || !is_numeric($resultCode)) {
            Log::warning('M-PESA STK callback missing required fields.', [
                'checkout_request_id' => $checkoutId,
                'merchant_request_id' => $merchantId,
                'result_code' => $resultCode,
            ]);

            return response('OK');
        }

        $transaction = $this->CoinsPurchaseService->findByCheckoutRequestId(
            (string) $checkoutId
        );

        if (!$transaction) {
            Log::warning('STK callback received for unknown transaction.', [
                'checkout_request_id' => $checkoutId,
                'merchant_request_id' => $merchantId,
            ]);

            return response('OK');
        }

        $resultCode = (int) $resultCode;

        try {
            if ($resultCode === 0) {
                $items = data_get($stk, 'CallbackMetadata.Item', []);

                $receipt = collect(is_array($items) ? $items : [])
                    ->firstWhere('Name', 'MpesaReceiptNumber');

                $receiptNumber = data_get($receipt, 'Value');

                if (!$receiptNumber) {
                    // A reported success without a receipt must not be
                    // converted into a failed transaction.
                    Log::warning('Successful STK callback has no receipt number.', [
                        'transaction_id' => $transaction->id,
                        'checkout_request_id' => $checkoutId,
                    ]);

                    return response('OK');
                }

                $this->CoinsPurchaseService->confirmPayment(
                    $transaction,
                    (string) $receiptNumber
                );

                Log::info('STK payment confirmation processed.', [
                    'transaction_id' => $transaction->id,
                    'receipt' => $receiptNumber,
                ]);
            } else {
                $this->CoinsPurchaseService->failPayment(
                    $transaction,
                    $resultDesc
                );

                Log::info('STK payment reported as unsuccessful.', [
                    'transaction_id' => $transaction->id,
                    'result_code' => $resultCode,
                    'result_desc' => $resultDesc,
                ]);
            }
        } catch (Throwable $e) {
            Log::error('Failed to process M-PESA STK callback.', [
                'transaction_id' => $transaction->id,
                'checkout_request_id' => $checkoutId,
                'error' => $e->getMessage(),
            ]);
        }

        return response('OK');
    }

    /**
     * M-PESA C2B validation callback.
     */
    public function c2bValidation(Request $request): JsonResponse
    {
        $billRef = trim((string) $request->input('BillRefNumber', ''));

        $accept = preg_match('/^COINS\d+$/i', $billRef) === 1;

        Log::info('M-PESA C2B validation received.', [
            'bill_ref' => $billRef,
            'accepted' => $accept,
        ]);

        return response()->json([
            'ResultCode' => $accept ? 0 : 'C2B00012',
            'ResultDesc' => $accept
                ? 'Accepted'
                : 'Invalid reference',
        ]);
    }

    /**
     * M-PESA C2B confirmation callback.
     */
    public function c2bConfirmation(Request $request): Response
    {
        $billRef = trim((string) $request->input('BillRefNumber', ''));
        $transId = trim((string) $request->input('TransID', ''));
        $amount = $request->input('TransAmount');
        $phone = trim((string) $request->input('MSISDN', ''));

        if (
            $billRef === '' ||
            $transId === '' ||
            !is_numeric($amount) ||
            (float) $amount <= 0
        ) {
            Log::warning('Invalid M-PESA C2B confirmation.', [
                'bill_ref' => $billRef,
                'trans_id' => $transId,
            ]);

            return response('OK');
        }

        // Coin packages currently use whole-KES amounts.
        if ((float) $amount !== (float) (int) $amount) {
            Log::warning('C2B confirmation has a fractional amount.', [
                'bill_ref' => $billRef,
                'trans_id' => $transId,
                'amount' => $amount,
            ]);

            return response('OK');
        }

        try {
            $transaction = $this->CoinsPurchaseService->confirmDirectPayment(
                $billRef,
                $transId,
                (int) $amount,
                $phone
            );

            if (!$transaction) {
                Log::warning('C2B payment could not be matched.', [
                    'bill_ref' => $billRef,
                    'trans_id' => $transId,
                ]);

                return response('OK');
            }

            Log::info('C2B confirmation processed.', [
                'transaction_id' => $transaction->id,
                'trans_id' => $transId,
                'bill_ref' => $billRef,
            ]);
        } catch (Throwable $e) {
            Log::error('Failed to process M-PESA C2B confirmation.', [
                'bill_ref' => $billRef,
                'trans_id' => $transId,
                'error' => $e->getMessage(),
            ]);
        }

        return response('OK');
    }
}
