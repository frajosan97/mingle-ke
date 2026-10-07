<?php

namespace App\Policies;

use App\Models\User;

class MessagePolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {
        //
    }

    public function view(User $user, Message $message): bool
    {
        return $message->conversation->hasUser($user);
    }

    public function update(User $user, Message $message): bool
    {
        return $message->isOwnedBy($user);
    }

    public function delete(User $user, Message $message): bool
    {
        return $message->isOwnedBy($user);
    }
}
