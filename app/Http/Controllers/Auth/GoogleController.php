<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GeocoderService;
use App\Support\UserLocation;
use Google\Client as GoogleClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function __construct(private GeocoderService $geocoderService)
    {
    }

    /* ------------------------------------------------------------------ */
    /*  OAuth redirect flow                                                */
    /* ------------------------------------------------------------------ */

    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // Resolve best available location:
            //   profile coords → X-User-Location header → IP fallback → null
            $coords = UserLocation::from(request());

            $user = $this->findOrCreateUser(
                [
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'provider_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ],
                $coords,
            );

            Auth::login($user, remember: true);

            return redirect()->intended(route('escort.index'));
        } catch (\Throwable $e) {
            Log::error('Google OAuth callback failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect('/')->with('error', 'Google authentication failed. Please try again.');
        }
    }

    /* ------------------------------------------------------------------ */
    /*  One-tap (GSI) token verification                                   */
    /* ------------------------------------------------------------------ */

    public function verifyToken(Request $request): JsonResponse
    {
        $request->validate(['credential' => 'required|string']);

        try {
            $client = new GoogleClient([
                'client_id' => config('services.google.client_id'),
            ]);

            $payload = $client->verifyIdToken($request->credential);

            if (!$payload || empty($payload['email'])) {
                return response()->json(['error' => 'Invalid token'], 401);
            }

            $coords = UserLocation::from($request);

            $user = $this->findOrCreateUser(
                [
                    'name' => $payload['name'] ?? $payload['email'],
                    'email' => $payload['email'],
                    'provider_id' => $payload['sub'],
                    'avatar' => $payload['picture'] ?? null,
                ],
                $coords,
            );

            Auth::login($user, remember: true);

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'area' => $user->profile?->area,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Google token verification failed', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Authentication failed'], 401);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  User creation / update                                             */
    /* ------------------------------------------------------------------ */

    /**
     * @param  array{name:string,email:string,provider_id:string,avatar:?string}  $data
     * @param  array{lat:float,lng:float,source:string}|null  $coords
     */
    private function findOrCreateUser(array $data, ?array $coords = null): User
    {
        $attributes = [
            'name' => $data['name'],
            'provider_name' => 'google',
            'provider_id' => $data['provider_id'],
            'avatar' => $data['avatar'],
            'email_verified_at' => now(),
        ];

        $user = User::where('email', $data['email'])->first();

        if ($user) {
            $user->update($attributes);
        } else {
            $user = User::create($attributes + [
                'email' => $data['email'],
                'password' => null,
                'coins' => 20,
            ]);
        }

        // Persist coords + reverse-geocoded area name on the profile.
        // Runs on both create and update, but only re-geocodes when coords
        // actually changed (see applyLocation).
        if ($coords) {
            $this->applyLocation($user, $coords);
        }

        return $user;
    }

    /**
     * Write lat/lng to the profile and refresh area only when the
     * coordinates differ from what's already stored.
     *
     * @param  array{lat:float,lng:float,source:string}  $coords
     */
    private function applyLocation(User $user, array $coords): void
    {
        $changed = (float) $user->lat !== (float) $coords['lat']
            || (float) $user->lng !== (float) $coords['lng'];

        $user->lat = $coords['lat'];
        $user->lng = $coords['lng'];

        if ($changed || !$user->area) {
            $user->area = $this->geocoderService->areaName(
                $coords['lat'],
                $coords['lng'],
            );
        }

        $user->save();
    }
}