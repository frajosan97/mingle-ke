<?php

namespace App\Http\Requests;

use App\Services\Chat\AttachmentClassifier;
use App\Services\Chat\AttachmentTypeRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Validator;

class StoreMessageRequest extends FormRequest
{
    private const MAX_FILES = 10;

    // 20 MB per file (KB).
    private const MAX_FILE_SIZE_KB = 20 * 1024;

    private ?AttachmentClassifier $classifier = null;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string', 'max:5000'],

            'attachments' => ['sometimes', 'array', 'max:' . self::MAX_FILES],

            'attachments.*' => [
                'bail',
                'required',
                'file',
                'max:' . self::MAX_FILE_SIZE_KB,
                'mimetypes:' . implode(',', AttachmentTypeRegistry::ALLOWED_MIMES),
                'extensions:' . implode(',', AttachmentTypeRegistry::ALLOWED_EXTENSIONS),
            ],

            'attachment_categories' => ['sometimes', 'array'],
            'attachment_categories.*' => [
                'nullable',
                'string',
                'in:' . implode(',', AttachmentTypeRegistry::CATEGORIES),
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $files = $this->uploadedFiles();

                if (!filled($this->input('body')) && $files === []) {
                    $validator->errors()->add(
                        'body',
                        'Enter a message or attach at least one file.',
                    );
                    return;
                }

                $classifier = $this->classifier();

                foreach ($files as $index => $file) {
                    $category = $classifier->classify($file, $this->clientHintFor($index));

                    if ($category === AttachmentTypeRegistry::CATEGORY_UNKNOWN) {
                        \Log::warning('Attachment could not be classified', [
                            'name' => $file->getClientOriginalName(),
                            'ext' => $file->getClientOriginalExtension(),
                            'sniffed' => $file->getMimeType(),
                            'client' => $file->getClientMimeType(),
                            'size' => $file->getSize(),
                            'error' => $file->getError(),
                            'hint' => $this->clientHintFor($index),
                        ]);

                        $validator->errors()->add(
                            "attachments.{$index}",
                            sprintf(
                                'The file "%s" could not be identified as a supported image, video, audio, document, or archive.',
                                $file->getClientOriginalName(),
                            ),
                        );
                    }
                }
            },
        ];
    }

    /** @return array<int, UploadedFile> */
    public function uploadedFiles(): array
    {
        $files = $this->file('attachments', []);

        if ($files instanceof UploadedFile) {
            $files = [$files];
        }

        if (!is_array($files)) {
            return [];
        }

        return array_values(array_filter(
            $files,
            static fn($file): bool => $file instanceof UploadedFile && $file->isValid(),
        ));
    }

    /**
     * @return array<int, array{file: UploadedFile, category: string, mime: string}>
     */
    public function classifiedFiles(): array
    {
        $classifier = $this->classifier();
        $classified = [];

        foreach ($this->uploadedFiles() as $index => $file) {
            $classified[] = [
                'file' => $file,
                'category' => $classifier->classify($file, $this->clientHintFor($index)),
                'mime' => $classifier->resolveMime($file),
            ];
        }

        return $classified;
    }

    private function classifier(): AttachmentClassifier
    {
        return $this->classifier ??= app(AttachmentClassifier::class);
    }

    private function clientHintFor(int $index): ?string
    {
        $hints = $this->input('attachment_categories', []);
        if (!is_array($hints)) {
            return null;
        }

        $hint = $hints[$index] ?? null;

        return is_string($hint) && in_array($hint, AttachmentTypeRegistry::CATEGORIES, true)
            ? $hint
            : null;
    }
}