<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
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

    public function show(Request $request, Conversation $conversation): Response
    {
        return Inertia::render(
            'conversations/show',
            $this->conversations->openFor($conversation, $request->user()),
        );
    }
}