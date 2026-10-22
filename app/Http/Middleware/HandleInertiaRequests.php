<?php

namespace App\Http\Middleware;

use App\Services\ConversationShareService;
use App\Services\LocationShareService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(
        private readonly ConversationShareService $conversations,
        private readonly LocationShareService $location,
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
            'location' => fn() => $this->location->forRequest($request),
            'conversations' => fn() => $request->user()
                ? $this->conversations->forUser($request->user())
                : [],
        ];
    }
}