<?php

namespace App\Services\Escort;

use App\Models\User;
use App\Models\UserImage;
use App\Models\UserProfile;
use App\Models\UserVideo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class EscortOnboardingService
{
    public function __construct(
        private readonly string $disk = 'public',
    ) {
    }

    /**
     * Create or update the user's escort profile and sync media.
     *
     * New profiles are created unapproved and require admin review.
     * Existing profiles keep their approval status on edit.
     */
    public function save(User $user, array $data, array $files): UserProfile
    {
        return DB::transaction(function () use ($user, $data, $files) {
            $profile = $user->profile()->first();
            $isNew = $profile === null;

            $profile = $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                $this->profileAttributes($data, $isNew),
            );

            $this->syncImages(
                $user,
                $files['gallery'] ?? [],
                $data['removed_images'] ?? [],
                $data['cover_index'] ?? null,
                $data['cover_existing_url'] ?? null,
            );

            $this->syncVideos(
                $user,
                $files['videos'] ?? [],
                $data['removed_videos'] ?? [],
            );

            return $profile->refresh();
        });
    }

    // -----------------------------------------------------------------
    // Profile
    // -----------------------------------------------------------------

    private function profileAttributes(array $data, bool $isNew): array
    {
        $attributes = [
            'orientation' => $data['orientation'] ?? null,
            'height_cm' => $data['height_cm'] ?? null,
            'weight_kg' => $data['weight_kg'] ?? null,
            'body_type' => $data['body_type'] ?? null,
            'hair_color' => $data['hair_color'] ?? null,
            'eye_color' => $data['eye_color'] ?? null,
            'ethnicity' => $data['ethnicity'] ?? null,
            'services' => $data['services'] ?? [],
            'smoking' => (bool) ($data['smoking'] ?? false),
            'drinking' => (bool) ($data['drinking'] ?? false),
            'rate_15min' => $data['rate_15min'] ?? null,
            'rate_30min' => $data['rate_30min'] ?? null,
            'rate_1hour' => $data['rate_1hour'] ?? null,
            'rate_night' => $data['rate_night'] ?? null,
            'currency' => $data['currency'] ?? 'KES',
            'is_available' => (bool) ($data['is_available'] ?? false),
            'availability_status' => $data['availability_status'] ?? 'offline',
            'incall' => (bool) ($data['incall'] ?? false),
            'outcall' => (bool) ($data['outcall'] ?? false),
        ];

        if ($isNew) {
            $attributes['is_approved'] = false;
            $attributes['approved_at'] = null;
        }

        return $attributes;
    }

    // -----------------------------------------------------------------
    // Images
    // -----------------------------------------------------------------

    /**
     * @param  UploadedFile[]  $newFiles
     * @param  string[]        $removedUrls
     */
    private function syncImages(
        User $user,
        array $newFiles,
        array $removedUrls,
        ?int $coverIndex,
        ?string $coverExistingUrl,
    ): void {
        // 1. Delete removed
        $removedPaths = $this->pathsFromUrls($removedUrls);
        if ($removedPaths) {
            $user->images()
                ->whereIn('path', $removedPaths)
                ->get()
                ->each(function (UserImage $img) {
                    $this->deleteImageFile($img);
                    $img->forceDelete();
                });
        }

        // 2. Store new uploads
        $created = [];
        foreach ($newFiles as $file) {
            $created[] = $user->images()->create([
                'path' => $file->store("users/{$user->id}/images", $this->disk),
                'disk' => $this->disk,
                'mime_type' => $file->getMimeType(),
                'size_bytes' => $file->getSize(),
                'status' => UserImage::STATUS_PENDING,
                'is_cover' => false,
                'sort_order' => $user->images()->max('sort_order') + 1,
            ]);
        }

        // 3. Resolve cover selection
        $cover = null;

        if (!empty($coverExistingUrl)) {
            $path = $this->pathFromUrl($coverExistingUrl);
            $cover = $user->images()->where('path', $path)->first();
        } elseif ($coverIndex !== null && isset($created[$coverIndex])) {
            $cover = $created[$coverIndex];
        }

        if ($cover) {
            $user->images()->update(['is_cover' => false]);
            $cover->update(['is_cover' => true]);
        }
    }

    // -----------------------------------------------------------------
    // Videos
    // -----------------------------------------------------------------

    /**
     * @param  UploadedFile[]  $newFiles
     * @param  string[]        $removedUrls
     */
    private function syncVideos(
        User $user,
        array $newFiles,
        array $removedUrls,
    ): void {
        $removedPaths = $this->pathsFromUrls($removedUrls);
        if ($removedPaths) {
            $user->videos()
                ->whereIn('path', $removedPaths)
                ->get()
                ->each(function (UserVideo $video) {
                    $this->deleteVideoFile($video);
                    $video->forceDelete();
                });
        }

        foreach ($newFiles as $file) {
            $user->videos()->create([
                'path' => $file->store("users/{$user->id}/videos", $this->disk),
                'disk' => $this->disk,
                'mime_type' => $file->getMimeType(),
                'size_bytes' => $file->getSize(),
                'status' => UserVideo::STATUS_PENDING,
                'processing_status' => UserVideo::PROCESSING_READY,
                'sort_order' => $user->videos()->max('sort_order') + 1,
            ]);
        }
    }

    // -----------------------------------------------------------------
    // File helpers
    // -----------------------------------------------------------------

    private function deleteImageFile(UserImage $image): void
    {
        try {
            Storage::disk($image->disk)->delete($image->path);
        } catch (Throwable) {
            // best-effort; don't block the transaction
        }
    }

    private function deleteVideoFile(UserVideo $video): void
    {
        try {
            Storage::disk($video->disk)->delete($video->path);

            if ($video->thumbnail_path) {
                Storage::disk($video->disk)->delete($video->thumbnail_path);
            }
        } catch (Throwable) {
            // best-effort
        }
    }

    /** @return string[] */
    private function pathsFromUrls(array $urls): array
    {
        return array_values(array_filter(array_map(
            fn(string $url) => $this->pathFromUrl($url),
            $urls,
        )));
    }

    /**
     * Convert "/storage/users/1/images/abc.jpg" → "users/1/images/abc.jpg".
     */
    private function pathFromUrl(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);
        if (!$path) {
            return null;
        }

        return ltrim(preg_replace('#^/storage/#', '', $path), '/');
    }
}