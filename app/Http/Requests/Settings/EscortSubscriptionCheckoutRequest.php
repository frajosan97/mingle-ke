<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class EscortSubscriptionCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->phone)) {
            $this->merge([
                'phone' => trim($this->phone),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'plan_id' => ['required', 'integer', 'min:1'],
            'days' => ['required', 'integer', 'min:1', 'max:3650'],
            'phone' => [
                'required',
                'string',
                'min:9',
                'max:20',
                'regex:/^\+?[0-9]{9,15}$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Enter the M-PESA phone number to receive the payment prompt.',
            'phone.regex' => 'Enter a valid phone number using digits, optionally starting with +.',
            'days.max' => 'The subscription cannot exceed 3650 days.',
        ];
    }
}
