<?php

namespace App\Http\Controllers;

use App\Services\HomeFeedService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private readonly HomeFeedService $feed,
    ) {
    }

    public function __invoke(): Response
    {
        return Inertia::render('welcome', $this->feed->payload());
    }
}