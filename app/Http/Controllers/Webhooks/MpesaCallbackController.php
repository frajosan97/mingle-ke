<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\CoinPurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class MpesaCallbackController extends Controller
{
    public function __construct(protected CoinPurchaseService $purchases)
    {
    }

    /* =================================================================
     | STK PUSH CALLBACK
     | ================================================================= */

    public function stk(Request $request): Response
    {
        $payload = $request->all();
        Log::info('M-PESA STK callback', $payload);

        $stk = $payload['Body']['stkCallback'] ?? null;
        if (!$stk) {
            return response('OK');
        }

        $checkoutId = $stk['CheckoutRequestID'] ?? null;
        $resultCode = (int) ($stk['ResultCode'] ?? -1);
        $resultDesc = (string) ($stk['ResultDesc'] ?? 'Unknown');

        if (!$checkoutId) {
            return response('OK');
        }

        $tx = $this->purchases->findByCheckoutRequestId($checkoutId);
        if (!$tx) {
            Log::warning('STK callback for unknown checkout id', ['id' => $checkoutId]);
            return response('OK');
        }

        if ($resultCode === 0) {
            $meta = $stk['CallbackMetadata']['Item'] ?? [];
            $receipt = collect($meta)->firstWhere('Name', 'MpesaReceiptNumber')['Value'] ?? null;

            if ($receipt) {
                $this->purchases->confirmPayment($tx, (string) $receipt);
            } else {
                $this->purchases->failPayment($tx, 'Missing M-PESA receipt');
            }
        } else {
            $this->purchases->failPayment($tx, $resultDesc);
        }

        return response('OK');
    }

    /* =================================================================
     | C2B (DIRECT PAYBILL) CALLBACKS
     | ================================================================= */

    public function c2bValidation(Request $request): JsonResponse
    {
        $payload = $request->all();
        Log::info('M-PESA C2B validation', $payload);

        $billRef = (string) ($payload['BillRefNumber'] ?? '');
        $accept = preg_match('/^COINS\d+$/i', $billRef) === 1;

        return response()->json([
            'ResultCode' => $accept ? 0 : 'C2B00012',
            'ResultDesc' => $accept ? 'Accepted' : 'Invalid reference',
        ]);
    }

    public function c2bConfirmation(Request $request): Response
    {
        $payload = $request->all();
        Log::info('M-PESA C2B confirmation', $payload);

        $billRef = (string) ($payload['BillRefNumber'] ?? '');
        $transId = (string) ($payload['TransID'] ?? '');
        $amount = (int) ($payload['TransAmount'] ?? 0);
        $phone = (string) ($payload['MSISDN'] ?? '');

        if ($billRef === '' || $transId === '' || $amount <= 0) {
            Log::warning('C2B confirmation missing required fields', $payload);
            return response('OK');
        }

        $tx = $this->purchases->confirmDirectPayment($billRef, $transId, $amount, $phone);

        if (!$tx) {
            Log::warning('C2B confirmation: no matching user or pending tx', [
                'bill_ref' => $billRef,
                'trans_id' => $transId,
            ]);
        }

        return response('OK');
    }
}