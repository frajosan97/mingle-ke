<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\User;
use App\Services\ConversationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    public function __construct(
        private readonly ConversationService $conversations,
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('conversations/index');
    }

    /**
     * Find or create a conversation with a target user, then redirect to it.
     */
    public function create(Request $request)
    {
        $request->validate([
            'to' => ['required', 'integer', 'exists:users,id']
        ]);

        $targetUserId = $request->query('to');
        $me = $request->user();

        abort_if($targetUserId == $me->id, 422, 'You cannot message yourself.');

        // Fetch the target user model (our service requires models, not IDs)
        $targetUser = User::findOrFail($targetUserId);

        // Call the correct method from your ConversationService
        $conversation = $this->conversations->findOrCreateBetween($me, $targetUser);

        // Redirect to the actual chat page
        return redirect()->route('conversations.show', $conversation);
    }

    public function show(Request $request, Conversation $conversation): Response
    {
        return Inertia::render(
            'conversations/show',
            $this->conversations->openFor($conversation, $request->user()),
        );
    }
}