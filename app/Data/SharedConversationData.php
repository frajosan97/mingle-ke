<?php

namespace App\Data;

final readonly class SharedConversationData
{
    public function __construct(
        public int $id,
        public string $name,
        public string $lastMessage,
        public ?string $lastMessageAt,
        public int|string|null $lastMessageSenderId,
        public ?string $lastMessageStatus,
        public string $time,
        public int $unread,
        public ?string $avatarUrl,
        public bool $online,
        public bool $verified,
        public int|string|null $otherUserId,
    ) {
    }

    public function toArray(): array
    {
        return get_object_vars($this);
    }
}