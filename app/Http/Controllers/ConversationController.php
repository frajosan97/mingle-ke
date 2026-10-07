<?php

namespace App\Http\Controllers;

use App\Events\ConversationRead;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\User;
use App\Services\ConversationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConversationController extends Controller
{
    public function __construct(private ConversationService $conversations)
    {
    }

    /** GET /conversations */
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Conversation/Index', [
            'conversations' => ConversationResource::collection(
                $this->conversations->query($request, $user)
            ),
            'activeConversation' => null,
            'messages' => [],
            'filters' => $this->filters($request),
        ]);
    }

    /** POST /conversations */
    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $me = $request->user();

        if ((int) $data['user_id'] === $me->id) {
            return back()->withErrors([
                'user_id' => 'Cannot start a conversation with yourself.',
            ]);
        }

        $other = User::findOrFail($data['user_id']);
        $conversation = $this->conversations->startBetween($me, $other);

        return redirect()->route('conversations.show', $conversation);
    }

    /** GET /conversations/{conversation} */
    public function show(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        abort_unless($conversation->hasUser($user), 403, 'Not a participant.');

        $conversation->load([
            'userOne:id,name,avatar,tier,is_verified,last_active_at,bio,area',
            'userTwo:id,name,avatar,tier,is_verified,last_active_at,bio,area',
            'latestMessage',
        ]);

        $conversation->markReadFor($user);

        broadcast(new ConversationRead($conversation, $user))->toOthers();

        $other = $conversation->otherUser($user);

        return Inertia::render('Conversation/Index', [
            'conversations' => ConversationResource::collection(
                $this->conversations->query($request, $user)
            ),
            'activeConversation' => [
                'id' => $conversation->id,
                'name' => $other?->name,
                'avatar' => $other?->avatar,
                'other_user' => $other ? [
                    'id' => $other->id,
                    'name' => $other->name,
                    'avatar' => $other->avatar,
                    'tier' => $other->tier,
                    'is_verified' => (bool) $other->is_verified,
                    'last_active_at' => optional($other->last_active_at)->toISOString(),
                    'bio' => $other->bio,
                    'area' => $other->area,
                    'is_online' => method_exists($other, 'isOnline') ? $other->isOnline() : false,
                ] : null,
                'raw' => $conversation,
            ],
            'messages' => $this->conversations->latestMessages($conversation),
            'participant' => $conversation->participantFor($user),
            'filters' => $this->filters($request),
        ]);
    }

    /** PATCH /conversations/{conversation} */
    public function update(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        abort_unless($conversation->hasUser($user), 403);

        $data = $request->validate([
            'is_muted' => ['sometimes', 'boolean'],
            'is_archived' => ['sometimes', 'boolean'],
        ]);

        $participant = $conversation->participants()
            ->firstOrCreate(['user_id' => $user->id]);

        $participant->update($data);

        return back();
    }

    /** DELETE /conversations/{conversation} */
    public function destroy(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->hasUser($request->user()), 403);

        $this->conversations->delete($conversation);

        return redirect()
            ->route('conversations.index')
            ->with('success', 'Conversation deleted.');
    }

    private function filters(Request $request): array
    {
        return [
            'search' => $request->string('search')->toString(),
            'archived' => $request->has('archived') ? $request->boolean('archived') : null,
            'muted' => $request->has('muted') ? $request->boolean('muted') : null,
        ];
    }
}