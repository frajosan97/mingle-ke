<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeviceStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && !$this->user()->trashed();
    }

    public function rules(): array
    {
        return [
            'is_online' => ['required', 'boolean'],
        ];
    }

    public function isOnline(): bool
    {
        return (bool) $this->validated('is_online');
    }
}