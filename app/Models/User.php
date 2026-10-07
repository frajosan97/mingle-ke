<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache;

#[Fillable([
    'name',
    'email',
    'password',
    'provider_name',
    'provider_id',
    'avatar',
    'phone',
    'tier',
    'coins',
    'lat',
    'lng',
    'area',
    'bio',
    'age',
    'gender',
    'is_verified',
    'subscription_expires_at',
    'last_active_at',
])]
#[Hidden([
    'password',
    'remember_token',
    'provider_name',
    'provider_id',
])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'subscription_expires_at' => 'datetime',
            'last_active_at' => 'datetime',
            'password' => 'hashed',
            'coins' => 'integer',
            'age' => 'integer',
            'is_verified' => 'boolean',
            'lat' => 'float',
            'lng' => 'float',
        ];
    }

    /* ──────────────────────────────────────────────
     |  Relationships
     ────────────────────────────────────────────── */

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /**
     * Conversations where this user is "user one" (direct column).
     * Kept for convenience / queries that need the raw side.
     */
    public function conversationsAsOne(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_one_id');
    }

    /**
     * Conversations where this user is "user two" (direct column).
     */
    public function conversationsAsTwo(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_two_id');
    }

    /**
     * The real pivot relationship — used everywhere in the app.
     * Returns a collection of App\Models\Conversation.
     *
     * `withPivot` exposes the per-user inbox state so a single query
     * can drive the inbox list without N+1 lookups.
     */
    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(
            Conversation::class,
            'conversation_participants',
            'user_id',
            'conversation_id'
        )
            ->withPivot([
                'unread_count',
                'last_read_at',
                'last_delivered_at',
                'is_muted',
                'is_archived',
            ])
            ->withTimestamps();
    }

    public function conversationParticipants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function messageReads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }

    /* ──────────────────────────────────────────────
     |  Chat helpers
     ────────────────────────────────────────────── */

    /**
     * Find (or create) the canonical 1:1 conversation with another user.
     */
    public function conversationWith(User|int $other): Conversation
    {
        return Conversation::between($this, $other);
    }

    /**
     * The participant row for a given conversation.
     */
    public function participantIn(Conversation|int $conversation): ?ConversationParticipant
    {
        $id = $conversation instanceof Conversation
            ? $conversation->id
            : $conversation;

        return $this->conversationParticipants()
            ->where('conversation_id', $id)
            ->first();
    }

    /* ──────────────────────────────────────────────
     |  Subscription / account helpers
     ────────────────────────────────────────────── */

    public function hasActiveSubscription(): bool
    {
        return $this->tier !== 'regular'
            && $this->subscription_expires_at
            && $this->subscription_expires_at->isFuture();
    }

    public function isVvip(): bool
    {
        return $this->tier === 'vvip' && $this->hasActiveSubscription();
    }

    public function isPremium(): bool
    {
        return $this->tier === 'premium' && $this->hasActiveSubscription();
    }

    public function isSocialUser(): bool
    {
        return !is_null($this->provider_name);
    }

    /**
     * Is this user currently online?
     */
    public function isOnline(): bool
    {
        return Cache::has("user.online.{$this->id}");
    }

    /**
     * Cached list of user IDs this user has an active conversation with.
     * Short TTL so newly created conversations are picked up quickly.
     */
    public function conversationPeerIds(): array
    {
        return Cache::remember(
            "user.{$this->id}.conversation_peer_ids",
            now()->addSeconds(30),           // ← was 5 minutes
            fn() => $this->conversations()
                ->get()
                ->map(fn($c) => $c->otherUser($this)->id)
                ->unique()
                ->values()
                ->all()
        );
    }
}