<?php

namespace App\Providers;

use App\Listeners\AddUserAvatar;
use App\Models\Conversation;
use App\Policies\ConversationPolicy;
use audunru\SocialAccounts\Events\SocialUserCreated;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    protected array $policies = [
        Conversation::class => ConversationPolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerPolicies();
        $this->configureDefaults();
        $this->registerEventListeners();
    }

    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }

    protected function registerEventListeners(): void
    {
        Event::listen(
            SocialUserCreated::class,
            AddUserAvatar::class,
        );
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn(): ?Password => app()->isProduction()
                ? Password::min(12)
                    ->mixedCase()
                    ->letters()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
                : null,
        );
    }
}