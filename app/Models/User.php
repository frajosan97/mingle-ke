<?php

namespace App\Models;

use audunru\SocialAccounts\Traits\HasSocialAccounts;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string|null $provider_name
 * @property string|null $provider_id
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
 *
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
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MessageRead> $messageReads
 */
#[Fillable([
    'provider_name',
    'provider_id',
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
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;
    use HasSocialAccounts;

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

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

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

    // ==================================================================
    // HELPERS / SCOPES
    // ==================================================================

    public function isPremium(): bool
    {
        return $this->tier === 'premium'
            && $this->subscription_expires_at
            && $this->subscription_expires_at->isFuture();
    }

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

    public function scopeActive($query)
    {
        return $query->where('last_active_at', '>=', now()->subMinutes(5));
    }

    public function scopeEscorts($query)
    {
        return $query->whereHas('profile');
    }
}