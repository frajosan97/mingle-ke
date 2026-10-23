<?php

namespace App\Services\Chat;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class AttachmentService
{
    private const DISK = 'public';

    public const CATEGORY_IMAGE = AttachmentTypeRegistry::CATEGORY_IMAGE;
    public const CATEGORY_VIDEO = AttachmentTypeRegistry::CATEGORY_VIDEO;
    public const CATEGORY_AUDIO = AttachmentTypeRegistry::CATEGORY_AUDIO;
    public const CATEGORY_DOCUMENT = AttachmentTypeRegistry::CATEGORY_DOCUMENT;
    public const CATEGORY_ARCHIVE = AttachmentTypeRegistry::CATEGORY_ARCHIVE;

    public function __construct(
        private readonly AttachmentTypeRegistry $registry,
    ) {
    }

    /**
     * @param array<int, UploadedFile|array{file: UploadedFile, category?: string, mime?: string}> $files
     * @return array<int, array{
     *     type: string, disk: string, path: string, url: string,
     *     original_name: string, mime_type: string, size_bytes: int, position: int
     * }>
     */
    public function store(int $conversationId, array $files): array
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk(self::DISK);
        $stored = [];

        try {
            foreach (array_values($files) as $position => $entry) {
                [$file, $category, $mime] = $this->normaliseEntry($entry);

                $path = $file->store(
                    "messages/{$conversationId}",
                    self::DISK,
                );

                if (!is_string($path) || $path === '') {
                    throw new RuntimeException(
                        'The attachment could not be stored.',
                    );
                }

                $stored[] = [
                    'type' => $category,
                    'disk' => self::DISK,
                    'path' => $path,
                    'url' => $disk->url($path),
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $mime,
                    'size_bytes' => (int) ($file->getSize() ?: 0),
                    'position' => $position,
                ];
            }

            return $stored;
        } catch (Throwable $e) {
            $this->deleteStored($stored);
            throw $e;
        }
    }

    /**
     * @param array<int, array{disk?: string, path?: string}> $attachments
     */
    public function deleteStored(array $attachments): void
    {
        foreach ($attachments as $attachment) {
            $path = $attachment['path'] ?? null;
            if (!is_string($path) || $path === '') {
                continue;
            }

            try {
                Storage::disk($attachment['disk'] ?? self::DISK)->delete($path);
            } catch (Throwable $e) {
                report($e);
            }
        }
    }

    /**
     * @param array<int, array{type?: string, mime_type?: string}> $attachments
     */
    public function determineMessageType(array $attachments, bool $hasBody = false): string
    {
        if ($attachments === []) {
            return 'text';
        }

        $types = array_values(array_unique(array_map(
            fn(array $attachment): string => $attachment['type']
                ?? $this->typeForMime((string) ($attachment['mime_type'] ?? '')),
            $attachments,
        )));

        if ($hasBody || count($types) > 1) {
            return 'mixed';
        }

        return $types[0];
    }

    /**
     * @param array<int, array{type?: string}> $attachments
     */
    public function preview(array $attachments, string $type): string
    {
        $count = count($attachments);

        if ($count === 0) {
            return 'Message';
        }

        if ($count > 1) {
            return match ($type) {
                self::CATEGORY_IMAGE => "📷 {$count} photos",
                self::CATEGORY_VIDEO => "🎥 {$count} videos",
                self::CATEGORY_AUDIO => "🎤 {$count} audio files",
                self::CATEGORY_DOCUMENT => "📄 {$count} files",
                self::CATEGORY_ARCHIVE => "🗜️ {$count} archives",
                default => "📎 {$count} attachments",
            };
        }

        return match ($type) {
            self::CATEGORY_IMAGE => '📷 Photo',
            self::CATEGORY_VIDEO => '🎥 Video',
            self::CATEGORY_AUDIO => '🎤 Audio',
            self::CATEGORY_DOCUMENT => '📄 File',
            self::CATEGORY_ARCHIVE => '🗜️ Archive',
            'mixed' => '📎 Attachment',
            default => 'Message',
        };
    }

    /**
     * @param UploadedFile|array{file: UploadedFile, category?: string, mime?: string} $entry
     * @return array{0: UploadedFile, 1: string, 2: string}
     */
    private function normaliseEntry(UploadedFile|array $entry): array
    {
        if ($entry instanceof UploadedFile) {
            $file = $entry;
            $category = null;
            $mime = null;
        } elseif (is_array($entry) && ($entry['file'] ?? null) instanceof UploadedFile) {
            $file = $entry['file'];
            $category = $entry['category'] ?? null;
            $mime = $entry['mime'] ?? null;
        } else {
            throw new InvalidArgumentException(
                'Each attachment entry must be an UploadedFile or an array with a "file" key.',
            );
        }

        if (!$file->isValid()) {
            throw new RuntimeException(
                'One of the uploaded attachments is invalid.',
            );
        }

        $mime = strtolower(trim(
            is_string($mime) && $mime !== ''
            ? $mime
            : (string) ($file->getMimeType()
                ?: $file->getClientMimeType()
                ?: 'application/octet-stream'),
        ));

        $category = is_string($category) && $category !== ''
            ? $category
            : $this->typeForMime($mime);

        if (!$this->registry->isKnownCategory($category)) {
            throw new RuntimeException(
                "Unsupported attachment category: {$category}.",
            );
        }

        return [$file, $category, $mime];
    }

    private function typeForMime(string $mime): string
    {
        return $this->registry->categoryForMime($mime)
            ?? AttachmentTypeRegistry::CATEGORY_DOCUMENT;
    }
}