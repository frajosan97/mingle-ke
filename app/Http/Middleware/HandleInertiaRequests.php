<?php

namespace App\Http\Middleware;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root Blade template used by Inertia.
     */
    protected $rootView = 'app';

    /**
     * Return the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Share application data with Inertia pages.
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => !$request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',
            'location' => fn() => $this->shareLocation($request),
            'conversations' => fn() => $this->shareConversations($request),
        ];
    }

    /**
     * Share whether the user has location coordinates.
     */
    private function shareLocation(Request $request): array
    {
        $user = $request->user();

        return [
            'has_coords' => $user
                ? ($user->lat !== null && $user->lng !== null)
                : (
                    session()->has('guest_lat')
                    && session()->has('guest_lng')
                ),
        ];
    }

    /**
     * Share the authenticated user's active conversation list.
     */
    private function shareConversations(Request $request): array
    {
        $user = $request->user();

        if (!$user) {
            return [];
        }

        return Conversation::query()
            ->where(function ($query) use ($user) {
                $query
                    ->where('user_one_id', $user->id)
                    ->orWhere('user_two_id', $user->id);
            })
            ->whereHas('participants', function ($query) use ($user) {
                $query
                    ->where('user_id', $user->id)
                    ->where('is_archived', false);
            })
            ->with([
                'userOne:id,name,avatar,last_active_at,is_verified',
                'userTwo:id,name,avatar,last_active_at,is_verified',

                'participants',

                'messages' => function ($query) {
                    $query
                        ->latest('created_at')
                        ->limit(1);
                },
            ])
            ->orderByDesc('last_message_at')
            ->limit(50)
            ->get()
            ->map(function (Conversation $conversation) use ($user) {
                $otherUser = (string) $conversation->user_one_id
                    === (string) $user->id
                    ? $conversation->userTwo
                    : $conversation->userOne;
                $myParticipant = $conversation->participants
                    ->firstWhere('user_id', $user->id);
                $otherParticipant = $otherUser
                    ? $conversation->participants
                        ->firstWhere('user_id', $otherUser->id)
                    : null;
                $lastMessage = $conversation->messages->first();
                $lastMessageSenderId = $lastMessage?->sender_id;
                $lastMessageStatus = null;

                if (
                    $lastMessage
                    && (string) $lastMessageSenderId === (string) $user->id
                ) {
                    $lastMessageStatus = 'sent';

                    if ($otherParticipant && $lastMessage->created_at) {
                        $deliveredAt = $otherParticipant->last_delivered_at;
                        $readAt = $otherParticipant->last_read_at;

                        if (
                            $readAt
                            && $readAt >= $lastMessage->created_at
                        ) {
                            $lastMessageStatus = 'read';
                        } elseif (
                            $deliveredAt
                            && $deliveredAt >= $lastMessage->created_at
                        ) {
                            $lastMessageStatus = 'delivered';
                        }
                    }
                }

                return [
                    'id' => $conversation->id,
                    'name' => $otherUser?->name ?? 'Unknown',
                    'lastMessage' => $conversation->last_message_preview ?? '',
                    'lastMessageAt' => $conversation->last_message_at
                            ?->toISOString(),
                    'lastMessageSenderId' => $lastMessageSenderId,
                    'lastMessageStatus' => $lastMessageStatus,
                    'time' => $conversation->last_message_at
                            ?->diffForHumans(short: true) ?? '',
                    'unread' => $myParticipant?->unread_count ?? 0,
                    'avatarUrl' => $otherUser?->avatar,
                    'online' => $otherUser?->last_active_at
                            ?->gt(now()->subMinutes(5)) ?? false,
                    'verified' => (bool) $otherUser?->is_verified,
                    'otherUserId' => $otherUser?->id,
                ];
            })
            ->values()
            ->all();
    }
}