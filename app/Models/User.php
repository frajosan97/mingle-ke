<?php

namespace App\Models;

use audunru\SocialAccounts\Traits\HasSocialAccounts;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;
use Rappasoft\LaravelAuthenticationLog\Traits\AuthenticationLoggable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $avatar
 * @property string|null $avatar_url
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
 * @property int|null $county_id
 * @property int|null $town_id
 * @property string|null $area
 * @property bool $is_verified
 * @property bool $is_online
 * @property Carbon|null $last_active_at
 * @property Carbon|null $last_seen_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property-read UserProfile|null $profile
 * @property-read \Illuminate\Database\Eloquent\Collection<int, UserLike> $likes
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
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MpesaTransaction> $mpesaTransactions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MpesaTransaction> $coinPurchases
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MpesaTransaction> $completedCoinPurchases
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MpesaTransaction> $pendingCoinPurchases
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MpesaTransaction> $escortListingPayments
 * @property-read MpesaTransaction|null $latestEscortPayment
 */
#[Fillable([
    'name',
    'email',
    'avatar',
    'email_verified_at',
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
    'county_id',
    'town_id',
    'area',
    'is_verified',
    'is_online',
    'last_active_at',
    'last_seen_at',
])]
#[Hidden([
    'password',
    'two_factor_secret',
    'two_factor_recovery_codes',
    'remember_token',
])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;
    use SoftDeletes;
    use HasSocialAccounts;
    use PasskeyAuthenticatable;
    use TwoFactorAuthenticatable;
    use HasPushSubscriptions;
    use AuthenticationLoggable;

    /** Coins granted once on account creation. */
    public const WELCOME_COINS = 5;

    protected $appends = [
        'avatar_url',
    ];

    // ================================================================
    // BOOT HOOKS
    // ================================================================

    protected static function booted(): void
    {
        static::created(function (User $user): void {
            if ($user->coins > 0) {
                return;
            }

            DB::transaction(function () use ($user): void {
                $lockedUser = self::query()
                    ->whereKey($user->id)
                    ->lockForUpdate()
                    ->first();

                if (!$lockedUser || $lockedUser->coins > 0) {
                    return;
                }

                $lockedUser->increment(
                    'coins',
                    self::WELCOME_COINS
                );

                CoinTransaction::create([
                    'user_id' => $lockedUser->id,
                    'type' => CoinTransaction::TYPE_BONUS,
                    'coins' => self::WELCOME_COINS,
                    'reference' => 'WELCOME-' . $lockedUser->id,
                    'description' => 'Welcome bonus',
                    'meta' => [
                        'source' => 'registration',
                    ],
                ]);
            });
        });
    }

    // ================================================================
    // CASTS & ACCESSORS
    // ================================================================

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',

            'subscription_started_at' => 'datetime',
            'subscription_expires_at' => 'datetime',
            'last_active_at' => 'datetime',
            'last_seen_at' => 'datetime',

            'auto_renew' => 'boolean',
            'is_verified' => 'boolean',
            'is_online' => 'boolean',

            'age' => 'integer',
            'coins' => 'integer',

            'lat' => 'float',
            'lng' => 'float',
        ];
    }

    /**
     * Public URL for stored avatar path, or null.
     */
    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: function (): ?string {
                if (!$this->avatar) {
                    return null;
                }

                try {
                    return Storage::url($this->avatar);
                } catch (\Throwable) {
                    return null;
                }
            },
        );
    }

    // ================================================================
    // LOCATION RELATIONSHIPS
    // ================================================================

    public function county(): BelongsTo
    {
        return $this->belongsTo(County::class);
    }

    public function town(): BelongsTo
    {
        return $this->belongsTo(Town::class);
    }

    // ================================================================
    // PROFILE RELATIONSHIPS
    // ================================================================

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    // ================================================================
    // SOCIAL / LIKES / REVIEWS
    // ================================================================

    public function likes(): HasMany
    {
        return $this->hasMany(UserLike::class);
    }

    public function reviewsWritten(): HasMany
    {
        return $this->hasMany(UserReview::class, 'reviewer_id');
    }

    public function reviewsReceived(): HasMany
    {
        return $this->hasMany(UserReview::class, 'escort_id');
    }

    // ================================================================
    // BLOCKING / REPORTING
    // ================================================================

    public function blockedUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'user_blocks',
            'blocker_id',
            'blocked_id'
        )->withTimestamps();
    }

    public function blockedBy(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'user_blocks',
            'blocked_id',
            'blocker_id'
        )->withTimestamps();
    }

    public function reportsFiled(): HasMany
    {
        return $this->hasMany(UserReport::class, 'reporter_id');
    }

    public function reportsReceived(): HasMany
    {
        return $this->hasMany(UserReport::class, 'reported_id');
    }

    // ================================================================
    // CONVERSATIONS / MESSAGING
    // ================================================================

    public function conversationsAsOne(): HasMany
    {
        return $this->hasMany(
            Conversation::class,
            'user_one_id'
        );
    }

    public function conversationsAsTwo(): HasMany
    {
        return $this->hasMany(
            Conversation::class,
            'user_two_id'
        );
    }

    public function conversationParticipants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function messageAttachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    public function messageReads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }

    // ================================================================
    // COINS / TRANSACTIONS
    // ================================================================

    public function coinTransactions(): HasMany
    {
        return $this->hasMany(CoinTransaction::class);
    }

    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function getPointsBalanceAttribute(): int
    {
        $credits = $this->pointTransactions()
            ->where('direction', PointTransaction::DIRECTION_CREDIT)
            ->sum('points');

        $debits = $this->pointTransactions()
            ->where('direction', PointTransaction::DIRECTION_DEBIT)
            ->sum('points');

        return (int) $credits - (int) $debits;
    }

    public function mpesaTransactions(): HasMany
    {
        return $this->hasMany(MpesaTransaction::class);
    }

    /**
     * Coin purchases through M-Pesa.
     */
    public function coinPurchases(): HasMany
    {
        return $this->mpesaTransactions()
            ->where(
                'type',
                MpesaTransaction::TYPE_COINS_PURCHASE
            );
    }

    public function completedCoinPurchases(): HasMany
    {
        return $this->coinPurchases()
            ->where(
                'status',
                MpesaTransaction::STATUS_COMPLETED
            );
    }

    public function pendingCoinPurchases(): HasMany
    {
        return $this->coinPurchases()
            ->whereIn('status', [
                MpesaTransaction::STATUS_PENDING,
                MpesaTransaction::STATUS_PROCESSING,
                MpesaTransaction::STATUS_UNKNOWN,
            ]);
    }

    // ================================================================
    // ESCORT LISTING / PAYMENTS
    // ================================================================

    public function escortListingPayments(): HasMany
    {
        return $this->mpesaTransactions()
            ->where(
                'type',
                MpesaTransaction::TYPE_ESCORT_LISTING_FEES
            );
    }

    public function latestEscortPayment(): HasOne
    {
        return $this->hasOne(MpesaTransaction::class)
            ->where(
                'type',
                MpesaTransaction::TYPE_ESCORT_LISTING_FEES
            )
            ->latestOfMany();
    }

    public function pendingEscortPayments(): HasMany
    {
        return $this->escortListingPayments()
            ->whereIn('status', [
                MpesaTransaction::STATUS_PENDING,
                MpesaTransaction::STATUS_PROCESSING,
                MpesaTransaction::STATUS_UNKNOWN,
            ]);
    }

    // ================================================================
    // PAYMENT HELPERS
    // ================================================================

    public function hasPendingCoinPurchase(): bool
    {
        return $this->pendingCoinPurchases()->exists();
    }

    public function hasPendingEscortPayment(): bool
    {
        return $this->pendingEscortPayments()->exists();
    }

    public function totalSpentOnCoins(): float
    {
        return (float) $this->completedCoinPurchases()
            ->sum('amount');
    }

    public function totalCoinsPurchased(): int
    {
        return (int) $this->completedCoinPurchases()
            ->sum('coins');
    }

    public function totalCoinsSpent(): int
    {
        return (int) $this->coinTransactions()
            ->where('type', CoinTransaction::TYPE_SPEND)
            ->sum('coins');
    }

    // ================================================================
    // SOCIAL HELPERS
    // ================================================================

    public function hasBlocked(User $other): bool
    {
        return $this->blockedUsers()
            ->whereKey($other->id)
            ->exists();
    }

    public function isBlockedBy(User $other): bool
    {
        return $this->blockedBy()
            ->whereKey($other->id)
            ->exists();
    }

    public function hasLiked(User $other): bool
    {
        return $this->likes()
            ->where('liked_user_id', $other->id)
            ->exists();
    }

    // ================================================================
    // SUBSCRIPTION / ESCORT HELPERS
    // ================================================================

    public function isPremium(): bool
    {
        return $this->tier === 'premium'
            && $this->subscription_expires_at !== null
            && $this->subscription_expires_at->isFuture();
    }

    /**
     * Whether this user has an active escort listing.
     */
    public function isEscort(): bool
    {
        return $this->profile?->hasActiveListing() ?? false;
    }

    public function hasActiveEscortListing(): bool
    {
        return $this->profile?->hasActiveListing() ?? false;
    }

    // ================================================================
    // QUERY SCOPES
    // ================================================================

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_online', true);
    }

    public function scopeEscorts(Builder $query): Builder
    {
        return $query->whereHas('profile', function (Builder $profile) {
            $profile->where('listing_tier', 'escort')
                ->where('is_approved', true)
                ->where('is_available', true)
                ->whereNotNull('listing_expires_at')
                ->where('listing_expires_at', '>', now());
        });
    }

    public function scopeActiveEscorts(Builder $query): Builder
    {
        return $query->escorts()
            ->where('is_online', true);
    }
}
