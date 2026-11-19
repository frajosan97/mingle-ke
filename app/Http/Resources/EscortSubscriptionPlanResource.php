<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EscortSubscriptionPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isCustom = $this->isCustom();
        $days = $this->days !== null ? (int) $this->days : null;

        return [
            'id' => $this->id,
            'key' => $this->key,
            'label' => $this->label,
            'days' => $days,
            'unitPrice' => (float) $this->unit_price,
            'totalPrice' => $isCustom
                ? null
                : $this->priceFor($days),
            'currency' => $this->currency ?: 'KES',
            'badge' => $this->badge,
            'discountPercent' => (float) $this->discount_percent,
            'savings' => $isCustom
                ? null
                : $this->discountFor($days),
            'isCustom' => $isCustom,
        ];
    }
}
