<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use RuntimeException;

class InsufficientCoinsException extends RuntimeException
{
    public function __construct(
        public readonly int $required,
        public readonly int $available,
    ) {
        parent::__construct(
            "Insufficient coins: need {$required}, have {$available}.",
        );
    }

    /**
     * Laravel calls this automatically when the exception is thrown —
     * no registration in bootstrap/app.php or Handler.php required.
     */
    public function render(Request $request): JsonResponse|RedirectResponse
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'You do not have enough coins to send this message.',
                'code' => 'INSUFFICIENT_COINS',
                'required' => $this->required,
                'available' => $this->available,
            ], 402);
        }

        return back()->withErrors([
            'coins' => "This message costs {$this->required} coins, you only have {$this->available}.",
        ]);
    }
}