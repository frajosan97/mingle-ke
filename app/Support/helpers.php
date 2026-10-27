<?php

// app/Support/helpers.php

use Illuminate\Support\Str;

if (!function_exists('formatPhoneNumber')) {
    /**
     * Normalize a Kenyan (or international) phone number to the
     * 254XXXXXXXXX format that Safaricom M-PESA expects.
     *
     * Accepts:
     *   +254712345678
     *   254712345678
     *   0712345678
     *   712345678
     *   07 12 345 678   (spaces ignored)
     *   +254 (0) 712 345 678
     *
     * Returns null if the number can't be parsed.
     */
    function formatPhoneNumber(?string $phone): ?string
    {
        if ($phone === null || $phone === '') {
            return null;
        }

        // Strip everything that's not a digit
        $digits = preg_replace('/\D+/', '', $phone);

        if ($digits === '') {
            return null;
        }

        // Strip a leading "0" that follows an international prefix like "+254 (0)…"
        $digits = preg_replace('/^2540/', '254', $digits);

        // Normalize the four common shapes to 254XXXXXXXXX
        if (Str::startsWith($digits, '254') && strlen($digits) === 12) {
            return $digits;                       // already 254712345678
        }

        if (Str::startsWith($digits, '0') && strlen($digits) === 10) {
            return '254' . substr($digits, 1);    // 0712345678  → 254712345678
        }

        if (strlen($digits) === 9) {
            return '254' . $digits;               // 712345678   → 254712345678
        }

        // Non-Kenyan or unrecognised — return as-is if it looks like a full number
        return strlen($digits) >= 10 ? $digits : null;
    }
}

if (!function_exists('isKenyanPhone')) {
    function isKenyanPhone(?string $phone): bool
    {
        return (bool) preg_match('/^254(7|1)\d{8}$/', formatPhoneNumber($phone) ?? '');
    }
}