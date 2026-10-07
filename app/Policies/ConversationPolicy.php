<?php

namespace App\Policies;

use App\Models\User;

class ConversationPolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {
        //
    }

    public function view(User $user, Conversation $conversation): bool
    {
        return $conversation->hasUser($user);
    }

    public function update(User $user, Conversation $conversation): bool
    {
        return $conversation->hasUser($user);
    }
}
