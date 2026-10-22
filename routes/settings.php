<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Profile Settings
|--------------------------------------------------------------------------
|
| Allow authenticated users to view and update their profile.
| Redirect the settings root to the profile page.
|
*/
Route::middleware('auth')->group(function () {
    Route::redirect('/settings', '/settings/profile');

    Route::get('/settings/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');

    Route::patch('/settings/profile', [ProfileController::class, 'update'])
        ->name('profile.update');
});

/*
|--------------------------------------------------------------------------
| Verified User Settings
|--------------------------------------------------------------------------
|
| Allow verified users to delete their profile, manage security settings,
| update their password, and change the application's appearance.
|
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('/settings/profile', [ProfileController::class, 'destroy'])
        ->name('profile.destroy');

    Route::get('/settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('/settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('/settings/appearance', 'settings/appearance')
        ->name('appearance.edit');
});

/*
|--------------------------------------------------------------------------
| Passkey Discovery
|--------------------------------------------------------------------------
|
| Publish the endpoints used by clients to discover passkey enrollment
| and management pages.
|
*/
Route::get('/.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');