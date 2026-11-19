<?php

namespace App\Http\Requests\Settings;

use App\Models\UserImage;
use App\Models\UserVideo;
use Illuminate\Foundation\Http\FormRequest;

class EscortOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $maxGallery = UserImage::MAX_PER_USER;   // 8
        $maxVideos = UserVideo::MAX_PER_USER;   // 3

        return [
            // Appearance
            'orientation' => ['nullable', 'string', 'max:50'],
            'height_cm' => ['nullable', 'integer', 'min:100', 'max:250'],
            'weight_kg' => ['nullable', 'integer', 'min:30', 'max:200'],
            'body_type' => ['nullable', 'string', 'max:50'],
            'hair_color' => ['nullable', 'string', 'max:50'],
            'eye_color' => ['nullable', 'string', 'max:50'],
            'ethnicity' => ['nullable', 'string', 'max:50'],

            // Lifestyle
            'smoking' => ['boolean'],
            'drinking' => ['boolean'],

            // Services
            'services' => ['nullable', 'array'],
            'services.*' => ['string', 'max:100'],

            // Rates
            'rate_15min' => ['nullable', 'integer', 'min:0'],
            'rate_30min' => ['nullable', 'integer', 'min:0'],
            'rate_1hour' => ['nullable', 'integer', 'min:0'],
            'rate_night' => ['nullable', 'integer', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],

            // Availability
            'is_available' => ['boolean'],
            'availability_status' => ['required', 'string', 'in:online,busy,incall,outcall,offline'],
            'incall' => ['boolean'],
            'outcall' => ['boolean'],

            // Images
            'gallery' => ['nullable', 'array', "max:{$maxGallery}"],
            'gallery.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'removed_images' => ['nullable', 'array'],
            'removed_images.*' => ['string'],

            'cover_index' => ['nullable', 'integer', 'min:0'],
            'cover_existing_url' => ['nullable', 'string'],

            // Videos
            'videos' => ['nullable', 'array', "max:{$maxVideos}"],
            'videos.*' => [
                'file',
                'mimetypes:video/mp4,video/webm,video/quicktime',
                'max:51200', // 50 MB
            ],
            'removed_videos' => ['nullable', 'array'],
            'removed_videos.*' => ['string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'smoking' => $this->boolean('smoking'),
            'drinking' => $this->boolean('drinking'),
            'is_available' => $this->boolean('is_available'),
            'incall' => $this->boolean('incall'),
            'outcall' => $this->boolean('outcall'),
        ]);
    }
}