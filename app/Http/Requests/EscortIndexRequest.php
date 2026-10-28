<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EscortIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Raw validation rules. Kept permissive so invalid values simply
     * fall back to null via the normalized accessor below.
     */
    public function rules(): array
    {
        return [
            'radius' => ['nullable', 'numeric', 'min:0'],
            'county' => ['nullable', 'string', 'max:64'],
            'town' => ['nullable', 'string', 'max:64'],
            'age_min' => ['nullable', 'integer', 'min:18', 'max:120'],
            'age_max' => ['nullable', 'integer', 'min:18', 'max:120'],
            'gender' => ['nullable', 'string', 'max:32'],
            'service' => ['nullable', 'string', 'max:64'],
            'ethnicity' => ['nullable', 'string', 'max:64'],
            'body_type' => ['nullable', 'string', 'max:64'],
            'tier' => ['nullable', 'in:premium,regular'],
            'incall' => ['boolean'],
            'outcall' => ['boolean'],
        ];
    }

    /**
     * Normalized filter array used by EscortSearchService.
     */
    public function filters(): array
    {
        return [
            'radius' => $this->filled('radius') && $this->input('radius') !== 'any'
                ? (float) $this->input('radius')
                : null,
            'county' => $this->input('county') ?: null,
            'town' => $this->input('town') ?: null,
            'age_min' => $this->filled('age_min') ? (int) $this->input('age_min') : null,
            'age_max' => $this->filled('age_max') ? (int) $this->input('age_max') : null,
            'gender' => $this->input('gender') ?: null,
            'service' => $this->input('service') ?: null,
            'ethnicity' => $this->input('ethnicity') ?: null,
            'body_type' => $this->input('body_type') ?: null,
            'tier' => $this->input('tier') ?: null,
            'incall' => $this->boolean('incall'),
            'outcall' => $this->boolean('outcall'),
        ];
    }
}