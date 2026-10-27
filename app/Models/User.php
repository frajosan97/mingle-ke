<?php

namespace App\Models;

use audunru\SocialAccounts\Traits\HasSocialAccounts;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $avatar
 * @property Carbon|null $email_verified_at
 * @property string|null $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $phone
 * @property int|null $age
 * @property string|null $gender
 * @property string|null $bio
 * @property string $tier
 * @property string|null $subscription_plan
 * @property Carbon|null $subscription_started_at
 * @property Carbon|null $subscription_expires_at
 * @property bool $auto_renew
 * @property int $coins
 * @property float|null $lat
 * @property float|null $lng
 * @property string|null $area
 * @property bool $is_verified
 * @property Carbon|null $last_active_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property-read string|null $avatar_url
 * @property-read UserProfile|null $profile
 * @property-read \Illuminate\Database\Eloquent\Collection<int, UserReview> $reviewsWritten
 * @property-read \Illuminate\Database\Eloquent\Collection<int, UserReview> $reviewsReceived
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $blockedUsers
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $blockedBy
 * @property-read \Illuminate\Database\Eloquent\Collection<int, UserReport> $reportsFiled
 * @property-read \Illuminate\Database\Eloquent\Collection<int, UserReport> $reportsReceived
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Conversation> $conversationsAsOne
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Conversation> $conversationsAsTwo
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ConversationParticipant> $conversationParticipants
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Message> $messages
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MessageAttachment> $messageAttachments
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MessageRead> $messageReads
 * @property-read \Illuminate\Database\Eloquent\Collection<int, CoinTransaction> $coinTransactions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, CoinTransaction> $coinPurchases
 * @property-read \Illuminate\Database\Eloquent\Collection<int, CoinTransaction> $completedCoinPurchases
 * @property-read \Illuminate\Database\Eloquent\Collection<int, CoinTransaction> $pendingCoinPurchases
 */
#[Fillable([
    'name',
    'email',
    'avatar',
    'password',
    'phone',
    'age',
    'gender',
    'bio',
    'tier',
    'subscription_plan',
    'subscription_started_at',
    'subscription_expires_at',
    'auto_renew',
    'coins',
    'lat',
    'lng',
    'area',
    'is_verified',
    'last_active_at',
])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;
    use HasSocialAccounts;
    use HasPushSubscriptions;
    use SoftDeletes;

    /**
     * Coins granted once on account creation (direct, Google, Facebook, etc.).
     */
    public const WELCOME_COINS = 5;

    /**
     * Attributes automatically appended to the model's array/JSON form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'avatar_url',
    ];

    // ==================================================================
    // BOOT HOOKS
    // ==================================================================

    protected static function booted(): void
    {
        static::created(function (User $user): void {
            // Grant the welcome bonus only when coins were not explicitly set.
            // The DB default is 0, so this covers direct + social registrations
            // while preserving any intentional value (seeds, factories, admin).
            if ((int) $user->coins === 0) {
                $user->forceFill([
                    'coins' => self::WELCOME_COINS,
                ])->saveQuietly();
            }
        });
    }

    // ==================================================================
    // CASTS & ACCESSORS
    // ==================================================================

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'subscription_started_at' => 'datetime',
            'subscription_expires_at' => 'datetime',
            'last_active_at' => 'datetime',
            'auto_renew' => 'boolean',
            'is_verified' => 'boolean',
            'age' => 'integer',
            'coins' => 'integer',
            'lat' => 'float',
            'lng' => 'float',
        ];
    }

    /**
     * Public URL for the stored avatar path, or null if no avatar.
     * Appended automatically (see $appends) so Inertia props include it.
     */
    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->avatar
                ? Storage::url($this->avatar)
                : null,
        );
    }

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

    public function county(): BelongsTo
    {
        return $this->belongsTo(County::class);
    }

    public function town(): BelongsTo
    {
        return $this->belongsTo(Town::class);
    }

    /** 1:1 — optional escort listing. Null if user is only social/dating. */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /** Reviews this user wrote about escorts. */
    public function reviewsWritten(): HasMany
    {
        return $this->hasMany(UserReview::class, 'reviewer_id');
    }

    /** Reviews other users wrote about this user (escort role). */
    public function reviewsReceived(): HasMany
    {
        return $this->hasMany(UserReview::class, 'escort_id');
    }

    /** Users this user blocked. */
    public function blockedUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'user_blocks',
            'blocker_id',
            'blocked_id'
        )->withTimestamps();
    }

    /** Users who blocked this user. */
    public function blockedBy(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'user_blocks',
            'blocked_id',
            'blocker_id'
        )->withTimestamps();
    }

    /** Reports this user filed. */
    public function reportsFiled(): HasMany
    {
        return $this->hasMany(UserReport::class, 'reporter_id');
    }

    /** Reports filed against this user. */
    public function reportsReceived(): HasMany
    {
        return $this->hasMany(UserReport::class, 'reported_id');
    }

    /** Conversations where this user is side A (lower id). */
    public function conversationsAsOne(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_one_id');
    }

    /** Conversations where this user is side B (higher id). */
    public function conversationsAsTwo(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_two_id');
    }

    /** Participant rows (per-conversation state). */
    public function conversationParticipants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    /** Messages this user sent. */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /** Read receipts this user generated. */
    public function messageReads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }

    /**
     * Attachments on messages this user sent.
     * Convenience only — most code will go through Message::attachments().
     */
    public function messageAttachments(): HasManyThrough
    {
        return $this->hasManyThrough(
            MessageAttachment::class,
            Message::class,
            'sender_id',   // FK on messages → users.id
            'message_id',  // FK on message_attachments → messages.id
            'id',
            'id'
        );
    }

    /** Every coin ledger entry for this user (purchases, bonuses, spends, refunds). */
    public function coinTransactions(): HasMany
    {
        return $this->hasMany(CoinTransaction::class);
    }

    /** Only purchase rows — useful for summaries and history filters. */
    public function coinPurchases(): HasMany
    {
        return $this->hasMany(CoinTransaction::class)
            ->where('type', CoinTransaction::TYPE_PURCHASE);
    }

    /** Completed purchases only — the ones that actually moved coins. */
    public function completedCoinPurchases(): HasMany
    {
        return $this->coinPurchases()
            ->where('status', CoinTransaction::STATUS_COMPLETED);
    }

    /** Pending/processing purchases — used to prevent duplicate STK pushes. */
    public function pendingCoinPurchases(): HasMany
    {
        return $this->coinPurchases()
            ->whereIn('status', [
                CoinTransaction::STATUS_PENDING,
                CoinTransaction::STATUS_PROCESSING,
            ]);
    }

    // ==================================================================
    // HELPERS / SCOPES
    // ==================================================================

    public function isPremium(): bool
    {
        return $this->tier === 'premium'
            && $this->subscription_expires_at
            && $this->subscription_expires_at->isFuture();
    }

    /** Whether this user has an escort profile (runs a query). */
    public function isEscort(): bool
    {
        return $this->profile()->exists();
    }

    public function hasBlocked(User $other): bool
    {
        return $this->blockedUsers()->whereKey($other->id)->exists();
    }

    public function isBlockedBy(User $other): bool
    {
        return $this->blockedBy()->whereKey($other->id)->exists();
    }

    /** Whether any coin payment is currently in flight (STK or C2B). */
    public function hasPendingCoinPurchase(): bool
    {
        return $this->pendingCoinPurchases()->exists();
    }

    /** Total KES this user has spent on coins (completed purchases only). */
    public function totalSpentOnCoins(): int
    {
        return (int) $this->completedCoinPurchases()->sum('amount_kes');
    }

    /** Total coins this user has bought (completed purchases only). */
    public function totalCoinsPurchased(): int
    {
        return (int) $this->completedCoinPurchases()->sum('coins');
    }

    public function scopeActive($query)
    {
        return $query->where('last_active_at', '>=', now()->subMinutes(5));
    }

    public function scopeEscorts($query)
    {
        return $query->whereHas('profile');
    }
}