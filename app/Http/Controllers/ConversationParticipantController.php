<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use Illuminate\Http\Request;

class ConversationParticipantController extends Controller
{
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
}