<?php

namespace App\Listeners;

use audunru\SocialAccounts\Events\SocialUserCreated;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AddUserAvatar
{
    public function handle(SocialUserCreated $event): void
    {
        $providerUser = $event->providerUser;
        $avatarUrl = $providerUser->getAvatar();

        if (empty($avatarUrl)) {
            return;
        }

        $user = $event->user;

        try {
            $response = Http::timeout(10)->get($avatarUrl);

            if (!$response->successful()) {
                Log::warning('Failed to download social avatar', [
                    'user_id' => $user->id,
                    'url' => $avatarUrl,
                    'status' => $response->status(),
                ]);

                return;
            }

            // Determine the file extension from the response content type, fallback to jpg
            $extension = match ($response->header('Content-Type')) {
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
                default => 'jpg',
            };

            $filename = Str::uuid() . '.' . $extension;
            $path = 'avatars/' . $filename;

            Storage::disk('public')->put($path, $response->body());

            $user->avatar = $path;
            $user->save();
        } catch (\Throwable $e) {
            Log::error('Exception while saving social avatar', [
                'user_id' => $user->id,
                'url' => $avatarUrl,
                'error' => $e->getMessage(),
            ]);
        }
    }
}