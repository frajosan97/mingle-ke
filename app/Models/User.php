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
use Rappasoft\LaravelAuthenticationLog\Traits\AuthenticationLoggable;

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
 * @property-read string|null $avatar_url
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
 * @property-read \Illuminate\Database\Eloquent\Collection<int, CoinTransaction> $coinPurchases
 * @property-read \Illuminate\Database\Eloquent\Collection<int, CoinTransaction> $completedCoinPurchases
 * @property-read \Illuminate\Database\Eloquent\Collection<int, CoinTransaction> $pendingCoinPurchases
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EscortListingPayment> $escortListingPayments
 * @property-read EscortListingPayment|null $latestEscortPayment
 * @property-read \Illuminate\Database\Eloquent\Collection<int, PhoneReveal> $phoneReveals
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
    'county_id',
    'town_id',
    'area',
    'is_verified',
    'is_online',
    'last_active_at',
    'last_seen_at',
])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;
    use HasSocialAccounts;
    use AuthenticationLoggable;
    use HasPushSubscriptions;
    use SoftDeletes;

    /** Coins granted once on account creation. */
    public const WELCOME_COINS = 5;

    protected $appends = ['avatar_url'];

    // ==================================================================
    // BOOT HOOKS
    // ==================================================================

    protected static function booted(): void
    {
        static::created(function (User $user): void {
            if ((int) $user->coins === 0) {
                $user->forceFill(['coins' => self::WELCOME_COINS])->saveQuietly();
            }
        });
    }

    // ==================================================================
    // CASTS & ACCESSORS
    // ==================================================================

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

    /** Public URL for stored avatar path, or null. */
    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
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

    /** Optional escort listing. Null if user is only social/dating. */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(UserLike::class);
    }

    /** Reviews this user wrote about escorts. */
    public function reviewsWritten(): HasMany
    {
        return $this->hasMany(UserReview::class, 'reviewer_id');
    }

    /** Reviews others wrote about this user (escort role). */
    public function reviewsReceived(): HasMany
    {
        return $this->hasMany(UserReview::class, 'escort_id');
    }

    public function blockedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_blocks', 'blocker_id', 'blocked_id')
            ->withTimestamps();
    }

    public function blockedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_blocks', 'blocked_id', 'blocker_id')
            ->withTimestamps();
    }

    public function reportsFiled(): HasMany
    {
        return $this->hasMany(UserReport::class, 'reporter_id');
    }

    public function reportsReceived(): HasMany
    {
        return $this->hasMany(UserReport::class, 'reported_id');
    }

    public function conversationsAsOne(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_one_id');
    }

    public function conversationsAsTwo(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_two_id');
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

    public function coinTransactions(): HasMany
    {
        return $this->hasMany(CoinTransaction::class);
    }

    public function coinPurchases(): HasMany
    {
        return $this->hasMany(CoinTransaction::class)
            ->where('type', CoinTransaction::TYPE_PURCHASE);
    }

    public function completedCoinPurchases(): HasMany
    {
        return $this->coinPurchases()
            ->where('status', CoinTransaction::STATUS_COMPLETED);
    }

    public function pendingCoinPurchases(): HasMany
    {
        return $this->coinPurchases()
            ->whereIn('status', [
                CoinTransaction::STATUS_PENDING,
                CoinTransaction::STATUS_PROCESSING,
            ]);
    }

    // ==================================================================
    // ESCORT LISTING / PAYMENTS
    // ==================================================================

    public function escortListingPayments(): HasMany
    {
        return $this->hasMany(EscortListingPayment::class);
    }

    public function latestEscortPayment(): HasOne
    {
        return $this->hasOne(EscortListingPayment::class)->latestOfMany();
    }

    public function phoneReveals(): HasMany
    {
        return $this->hasMany(PhoneReveal::class, 'viewer_id');
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

    /** Paid escort tier is active and approved. */
    public function hasActiveEscortListing(): bool
    {
        $p = $this->profile;

        return $p
            && $p->listing_tier === 'escort'
            && $p->is_approved
            && $p->listing_expires_at
            && $p->listing_expires_at->isFuture();
    }

    /** Pending escort listing payment in flight. */
    public function hasPendingEscortPayment(): bool
    {
        return $this->escortListingPayments()
            ->where('status', 'pending')
            ->exists();
    }

    public function hasBlocked(User $other): bool
    {
        return $this->blockedUsers()->whereKey($other->id)->exists();
    }

    public function isBlockedBy(User $other): bool
    {
        return $this->blockedBy()->whereKey($other->id)->exists();
    }

    public function hasLiked(User $other): bool
    {
        return $this->likes()->where('liked_user_id', $other->id)->exists();
    }

    public function hasPendingCoinPurchase(): bool
    {
        return $this->pendingCoinPurchases()->exists();
    }

    public function totalSpentOnCoins(): int
    {
        return (int) $this->completedCoinPurchases()->sum('amount_kes');
    }

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

    /** Approved, unexpired escort-tier profiles only. */
    public function scopeActiveEscorts($query)
    {
        return $query->whereHas('profile', function ($q) {
            $q->where('listing_tier', 'escort')
                ->where('is_approved', true)
                ->where('listing_expires_at', '>', now());
        });
    }
}