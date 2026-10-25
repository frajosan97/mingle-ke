<?php

namespace App\Services\Chat;

class MessagePricing
{
    /**
     * Flat cost for an attachment-only message (no text body).
     */
    public const ATTACHMENT_ONLY_COST = 1;

    /**
     * Minimum cost for any text message, even a single character.
     */
    public const MIN_TEXT_COST = 1;

    /**
     * Maximum a single message can ever cost. Guards against a user
     * pasting 50k characters and draining their balance in one hit
     * (or, conversely, an accidental runaway cost).
     */
    public const MAX_COST = 25;

    /**
     * Cost per text message, as a function of body character length.
     *
     * Tiers (adjust freely — this is the only place they live):
     *   1   – 100 chars  → 1 coin
     *   101 – 250 chars  → 2 coins
     *   251 – 500 chars  → 3 coins
     *   501 – 1000 chars → 5 coins
     *   1001+            → 8 coins (capped at MAX_COST)
     *
     * Attachment-only messages cost ATTACHMENT_ONLY_COST.
     */
    public static function costFor(?string $body, bool $hasAttachments): int
    {
        $length = $body !== null ? mb_strlen(trim($body)) : 0;

        if ($length === 0) {
            // Attachment-only. If there are no attachments either, the
            // caller should have rejected the message already.
            return $hasAttachments ? self::ATTACHMENT_ONLY_COST : 0;
        }

        $cost = match (true) {
            $length <= 100 => 1,
            $length <= 250 => 2,
            $length <= 500 => 3,
            $length <= 1000 => 5,
            default => 8,
        };

        return max(self::MIN_TEXT_COST, min($cost, self::MAX_COST));
    }
}