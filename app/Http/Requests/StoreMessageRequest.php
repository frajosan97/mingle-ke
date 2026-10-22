<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $mimes = 'jpg,jpeg,png,gif,webp,bmp,svg,mp4,mov,avi,webm,'
            . 'mp3,m4a,ogg,oga,wav,wave,aac,amr,3gp,'
            . 'pdf,txt,csv,doc,docx,xls,xlsx,ppt,pptx,zip';

        return [
            'body' => ['nullable', 'string', 'max:5000'],
            'type' => ['nullable', 'in:text,image,video,audio,file'],

            // Backward compatibility
            'attachment' => ['nullable', 'file', 'max:10240', "mimes:{$mimes}"],

            // Multiple attachments
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*' => ['required', 'file', 'max:10240', "mimes:{$mimes}"],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $hasBody = filled($this->input('body'));
                $hasFiles = $this->hasFile('attachment')
                    || count($this->file('attachments', [])) > 0;

                if (!$hasBody && !$hasFiles) {
                    $validator->errors()->add(
                        'body',
                        'Enter a message or attach a file.'
                    );
                }
            },
        ];
    }

    /**
     * Normalize single + multiple attachments into one array.
     *
     * @return \Illuminate\Http\UploadedFile[]
     */
    public function uploadedFiles(): array
    {
        $files = [];

        if ($this->hasFile('attachment')) {
            $files[] = $this->file('attachment');
        }

        foreach ($this->file('attachments', []) as $file) {
            if ($file instanceof \Illuminate\Http\UploadedFile) {
                $files[] = $file;
            }
        }

        return $files;
    }
}