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
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'isEscort' => $user->profile()->exists(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Profile updated.'),
        ]);

        return to_route('profile.edit');
    }

    /**
     * Show the escort onboarding form.
     *
     * If the user already has a UserProfile, this doubles as the
     * "manage listing" page (pre-filled + editing existing row).
     */
    public function escortOnboarding(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->profile()->first();

        return Inertia::render('settings/escort-onboarding', [
            'profile' => $profile ? [
                'orientation' => $profile->orientation,
                'height_cm' => $profile->height_cm,
                'weight_kg' => $profile->weight_kg,
                'body_type' => $profile->body_type,
                'hair_color' => $profile->hair_color,
                'eye_color' => $profile->eye_color,
                'ethnicity' => $profile->ethnicity,
                'services' => $profile->services ?? [],
                'smoking' => (bool) $profile->smoking,
                'drinking' => (bool) $profile->drinking,
                'rate_15min' => $profile->rate_15min,
                'rate_30min' => $profile->rate_30min,
                'rate_1hour' => $profile->rate_1hour,
                'rate_night' => $profile->rate_night,
                'currency' => $profile->currency ?? 'KES',
                'is_available' => (bool) $profile->is_available,
                'availability_status' => $profile->availability_status ?? 'offline',
                'incall' => (bool) $profile->incall,
                'outcall' => (bool) $profile->outcall,
                'cover_image_url' => $profile->cover_image
                    ? Storage::url($profile->cover_image)
                    : null,
                'gallery_urls' => collect($profile->gallery ?? [])
                    ->map(fn($path) => Storage::url($path))
                    ->all(),
                'is_approved' => (bool) $profile->is_approved,
                'is_featured' => (bool) $profile->is_featured,
            ] : null,
        ]);
    }

    /**
     * Store or update the user's escort profile.
     *
     * New listings are created with is_approved = false and must be
     * reviewed before they appear on Discover.
     */
    public function storeEscortOnboarding(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'orientation' => ['nullable', 'string', 'max:50'],
            'height_cm' => ['nullable', 'integer', 'min:100', 'max:250'],
            'weight_kg' => ['nullable', 'integer', 'min:30', 'max:200'],
            'body_type' => ['nullable', 'string', 'max:50'],
            'hair_color' => ['nullable', 'string', 'max:50'],
            'eye_color' => ['nullable', 'string', 'max:50'],
            'ethnicity' => ['nullable', 'string', 'max:50'],
            'services' => ['nullable', 'array'],
            'services.*' => ['string', 'max:100'],
            'smoking' => ['boolean'],
            'drinking' => ['boolean'],
            'rate_15min' => ['nullable', 'integer', 'min:0'],
            'rate_30min' => ['nullable', 'integer', 'min:0'],
            'rate_1hour' => ['nullable', 'integer', 'min:0'],
            'rate_night' => ['nullable', 'integer', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'incall' => ['boolean'],
            'outcall' => ['boolean'],
            'is_available' => ['boolean'],
            'availability_status' => [
                'required',
                Rule::in(['online', 'incall', 'outcall', 'offline']),
            ],
            'cover_image' => ['nullable', 'image', 'max:5120'],
            'gallery' => ['nullable', 'array', 'max:8'],
            'gallery.*' => ['image', 'max:5120'],
            'removed_gallery' => ['nullable', 'array'],
            'removed_gallery.*' => ['string'],
        ]);

        $profile = $user->profile()->first();

        // ── Cover image ──────────────────────────────────────
        if ($request->hasFile('cover_image')) {
            if ($profile?->cover_image) {
                Storage::disk('public')->delete($profile->cover_image);
            }
            $data['cover_image'] = $request
                ->file('cover_image')
                ->store('profiles/covers', 'public');
        }

        // ── Gallery ──────────────────────────────────────────
        // Start from the existing gallery, drop the ones the user
        // marked for removal, then append new uploads (max 8 total).
        $existingGallery = $profile?->gallery ?? [];

        $removedUrls = $request->input('removed_gallery', []);
        $removedPaths = array_map(
            fn(string $url) => $this->storagePathFromUrl($url),
            $removedUrls,
        );

        $keptGallery = array_values(
            array_filter(
                $existingGallery,
                fn(string $path) => !in_array($path, $removedPaths, true),
            ),
        );

        // Delete removed files from disk
        foreach ($removedPaths as $path) {
            if ($path && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }

        $newPaths = [];
        if ($request->hasFile('gallery')) {
            foreach ($request->file('gallery') as $file) {
                $newPaths[] = $file->store('profiles/gallery', 'public');
            }
        }

        $data['gallery'] = array_slice(
            array_merge($keptGallery, $newPaths),
            0,
            8,
        );

        // ── Approval state ───────────────────────────────────
        // New profiles need approval. Existing profiles preserve
        // their approval status — edits do not un-approve someone.
        if (!$profile) {
            $data['is_approved'] = false;
        }

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $data,
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $profile
                ? __('Escort profile updated.')
                : __('Escort profile submitted for review.'),
        ]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Convert a Storage::url() back to the disk-relative path.
     *
     * e.g. "/storage/profiles/gallery/abc.jpg" → "profiles/gallery/abc.jpg"
     */
    private function storagePathFromUrl(string $url): ?string
    {
        $prefix = '/storage/';

        if (!str_starts_with($url, $prefix)) {
            return null;
        }

        return ltrim(substr($url, strlen($prefix)), '/');
    }
}