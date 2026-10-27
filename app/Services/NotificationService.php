<?php

namespace App\Services;

use App\Models\CoinTransaction;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function __construct(protected SmsService $sms)
    {
    }

    /* =================================================================
     | CORE
     | ================================================================= */

    public function notify(?string $mobile, string $smsBody): void
    {
        if (!$mobile) {
            Log::warning('Notification skipped: no mobile number', ['body' => $smsBody]);
            return;
        }

        $this->safe(fn() => $this->sms->sendSms($mobile, $smsBody), 'sms', $mobile);
    }

    /* =================================================================
     | COINS / WALLET
     | ================================================================= */

    public function coinsPurchaseCompleted(string $mobile, CoinTransaction $tx): void
    {
        $this->notify(
            $mobile,
            "Payment received! {$tx->coins} coins have been added to your MingleKE wallet. "
            . ($tx->mpesa_receipt ? "Receipt: {$tx->mpesa_receipt}." : '')
        );
    }

    public function coinsLowBalance(string $mobile, int $balance, int $threshold = 20): void
    {
        $this->notify(
            $mobile,
            "Heads up — your MingleKE wallet is down to {$balance} coins. "
            . "Top up in the app to keep chatting and unlocking gifts."
        );
    }

    /* =================================================================
     | INVITES / REFERRALS
     | ================================================================= */

    public function inviteReward(string $mobile, string $inviterName, int $coins): void
    {
        $this->notify(
            $mobile,
            "{$inviterName} joined MingleKE using your invite. "
            . "You earned {$coins} coins. Keep inviting to earn more!"
        );
    }

    public function inviteWelcome(string $mobile, string $inviterName, int $bonusCoins): void
    {
        $this->notify(
            $mobile,
            "Welcome to MingleKE! {$inviterName} invited you. "
            . "{$bonusCoins} bonus coins have been added to your wallet to get you started."
        );
    }

    /* =================================================================
     | ACCOUNTS
     | ================================================================= */

    public function userCreated(string $mobile, string $name, string $password, string $role): void
    {
        $this->notify(
            $mobile,
            "Welcome {$name}! Your {$role} account on MingleKE has been created. "
            . "Login with this phone number (or your email) and password: {$password}. "
            . "Please change your password after your first login."
        );
    }

    public function userCreatedNoPhone(string $name, string $email, string $password, string $role): void
    {
        Log::info('User created without phone — deliver credentials manually', [
            'name' => $name,
            'email' => $email,
            'role' => $role,
        ]);
    }

    public function welcomeNewUser(User $user): void
    {
        $phone = $user->phone ?? null;
        if (!$phone) {
            return;
        }

        $name = $user->name ?: 'there';

        $this->notify(
            $phone,
            "Hi {$name}, welcome to MingleKE. Complete your profile to start "
            . "chatting, exchanging gifts and meeting people across Kenya."
        );
    }

    public function verificationApproved(string $mobile, string $name): void
    {
        $this->notify(
            $mobile,
            "Good news {$name} — your MingleKE profile has been verified. "
            . "Your verified badge is now visible to everyone."
        );
    }

    public function verificationRejected(string $mobile, string $name, string $reason): void
    {
        $this->notify(
            $mobile,
            "Hi {$name}, your MingleKE verification was not approved. Reason: {$reason}. "
            . "You can re-submit clear photos from your profile."
        );
    }

    /* =================================================================
     | MESSAGES & GIFTS
     | ================================================================= */

    public function newMessage(string $mobile, string $senderName): void
    {
        $this->notify(
            $mobile,
            "{$senderName} sent you a message on MingleKE. "
            . "Open the app to read and reply."
        );
    }

    public function giftReceived(string $mobile, string $senderName, string $giftName, int $coins): void
    {
        $this->notify(
            $mobile,
            "{$senderName} sent you {$giftName} worth {$coins} coins on MingleKE. "
            . "Open the app to view it."
        );
    }

    public function giftSent(string $mobile, string $recipientName, string $giftName, int $coins): void
    {
        $this->notify(
            $mobile,
            "Your {$giftName} worth {$coins} coins was delivered to {$recipientName}. "
            . "Thanks for spreading the love on MingleKE."
        );
    }

    /* =================================================================
     | MODERATION / SAFETY
     | ================================================================= */

    public function accountSuspended(string $mobile, string $name, string $reason): void
    {
        $this->notify(
            $mobile,
            "Hi {$name}, your MingleKE account has been suspended. Reason: {$reason}. "
            . "Contact support if you believe this is a mistake."
        );
    }

    public function accountRestored(string $mobile, string $name): void
    {
        $this->notify(
            $mobile,
            "Hi {$name}, your MingleKE account has been restored. "
            . "You can log in and continue where you left off."
        );
    }

    /* =================================================================
     | HELPERS
     | ================================================================= */

    protected function safe(callable $fn, string $channel, string $mobile): void
    {
        try {
            $fn();
        } catch (\Throwable $e) {
            Log::warning("Notification failed on {$channel}", [
                'mobile' => $mobile,
                'error' => $e->getMessage(),
            ]);
        }
    }
}