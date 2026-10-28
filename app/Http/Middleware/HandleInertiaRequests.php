<?php

namespace App\Http\Middleware;

use App\Services\ConversationService;
use App\Services\LocationService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(
        private readonly ConversationService $conversations,
        private readonly LocationService $location,
    ) {
    }

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => !$request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',
            'location' => fn() => $this->location->resolve($request),
            'conversations' => fn() => $request->user()
                ? $this->conversations->forUser($request->user())
                : [],
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'checkout_request_id' => fn() => $request->session()->get('checkout_request_id'),
        ];
    }
}