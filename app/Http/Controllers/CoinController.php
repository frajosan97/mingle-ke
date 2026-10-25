<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class CoinController extends Controller
{
    public function index()
    {
        return Inertia::render('coin/index');
    }
}
