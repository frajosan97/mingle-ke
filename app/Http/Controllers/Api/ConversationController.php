<?php

namespace App\Http\Controllers\Api;

use App\Events\ConversationRead;
use App\Events\ConversationTyping;
use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\User;
use App\Services\ConversationService;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function __construct(private ConversationService $conversations)
    {
    }

    /** GET /api/conversations */
    public function index(Request $request)
    {
        return ConversationResource::collection(
            $this->conversations->query($request, $request->user())
        );
    }

    /** POST /api/conversations */
    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $me = $request->user();

        if ((int) $data['user_id'] === $me->id) {
            return response()->json(
                ['message' => 'Cannot start a conversation with yourself.'],
                422
            );
        }

        $other = User::findOrFail($data['user_id']);
        $conversation = $this->conversations->startBetween($me, $other);

        $conversation->load([
            'userOne:id,name,avatar,tier,is_verified,last_active_at',
            'userTwo:id,name,avatar,tier,is_verified,last_active_at',
        ]);

        return (new ConversationResource($conversation))
            ->response()
            ->setStatusCode(201);
    }

    /** GET /api/conversations/{conversation} */
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

        $conversation->setAttribute(
            'messages',
            $this->conversations->latestMessages($conversation)
        );

        return new ConversationResource($conversation);
    }

    /** PATCH /api/conversations/{conversation} */
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

        return response()->json(['participant' => $participant->fresh()]);
    }

    /** DELETE /api/conversations/{conversation} */
    public function destroy(Request $request, Conversation $conversation)
    {
        abort_unless($conversation->hasUser($request->user()), 403);

        $this->conversations->delete($conversation);

        return response()->json(['message' => 'Conversation deleted.']);
    }

    /** POST /api/conversations/{conversation}/read */
    public function read(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        abort_unless($conversation->hasUser($user), 403);

        $conversation->markReadFor($user);

        broadcast(new ConversationRead($conversation, $user))->toOthers();

        return response()->json(['ok' => true]);
    }

    /** POST /api/conversations/{conversation}/delivered */
    public function delivered(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        abort_unless($conversation->hasUser($user), 403);

        $conversation->markDeliveredFor($user);

        return response()->json(['ok' => true]);
    }

    /** POST /api/conversations/{conversation}/typing */
    public function typing(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        abort_unless($conversation->hasUser($user), 403);

        $request->validate(['is_typing' => ['sometimes', 'boolean']]);

        broadcast(new ConversationTyping(
            $conversation,
            $user,
            $request->boolean('is_typing', true),
        ))->toOthers();

        return response()->noContent();
    }
}