<?php

namespace App\Http\Resources;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Log;

/**
 * @mixin Message
 */
class MessageResource extends JsonResource
{
    public function __construct(Message $resource, private array $options = [])
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $viewerId = $this->options['viewerId'] ?? null;
        $recipientId = $this->options['recipientId'] ?? null;
        $recipientDeliveredAt = $this->options['recipientDeliveredAt'] ?? null;

        Log::info('check data', [
            'recipientId' => $recipientId,
            'recipientDeliveredAt' => $recipientDeliveredAt,
        ]);

        $isMine = $viewerId !== null
            ? (int) $this->sender_id === (int) $viewerId
            : true;

        $tickState = null;

        // Only the sender sees ticks, and only if we know who the recipient is.
        if ($isMine && $recipientId !== null) {
            $tickState = $this->tickStateFor(
                $recipientId,
                $recipientDeliveredAt
            );
        }

        // Deleted messages become tombstones: keep the envelope, drop the content.
        $isDeleted = $this->trashed();

        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id' => $this->sender_id,
            'sender_name' => $this->sender?->name ?? 'Unknown',
            'type' => $isDeleted ? 'deleted' : $this->type,
            'body' => $isDeleted ? null : $this->body,
            'attachments' => $isDeleted
                ? []
                : $this->whenLoaded(
                    'attachments',
                    fn() => $this->attachments->sortBy('position')->values()->map(fn($a) => [
                        'id' => $a->id,
                        'type' => $a->type,
                        'url' => $a->url,
                        'original_name' => $a->original_name,
                        'mime_type' => $a->mime_type,
                        'size_bytes' => $a->size_bytes,
                        'width' => $a->width,
                        'height' => $a->height,
                        'duration_seconds' => $a->duration_seconds,
                        'position' => $a->position,
                    ]),
                    [],
                ),
            'edited_at' => $this->edited_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
            'time' => $this->created_at?->format('H:i'),
            'mine' => $isMine,
            'read' => $tickState === 'read',
            'delivered' => in_array($tickState, ['delivered', 'read'], true),
            'tick' => $tickState,
            'deleted' => $isDeleted,
        ];
    }
}