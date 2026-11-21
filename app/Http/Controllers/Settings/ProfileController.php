<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ProfileController extends Controller
{
    public function __construct()
    {
    }

    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'isEscort' => $user->profile()->exists(),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validated();

        // Extract avatar separately so it is not mass-assigned as a file.
        $avatar = $request->file('avatar');

        unset($validated['avatar']);

        // Update normal profile fields.
        $user->fill($validated);

        // Reset email verification when email changes.
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Upload and replace avatar only when a new image is provided.
        if ($avatar) {
            $oldAvatar = $user->avatar;

            $newAvatar = $avatar->store('avatars', 'public');

            if (!$newAvatar) {
                throw new RuntimeException('Unable to store profile avatar.');
            }

            $user->avatar = $newAvatar;
        }

        $user->save();

        // Delete the previous avatar only after successfully saving the user.
        if (
            $avatar &&
            !empty($oldAvatar) &&
            $oldAvatar !== $newAvatar
        ) {
            Storage::disk('public')->delete($oldAvatar);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Profile updated.'),
        ]);

        return to_route('profile.edit');
    }

    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
