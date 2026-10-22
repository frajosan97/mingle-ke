<?php

namespace App\Services\Chat;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AttachmentService
{
    /**
     * Store files and return attachment metadata.
     *
     * @param  UploadedFile[]  $files
     * @return array<int, array{name:string,path:string,mime:string,size:int,url:string}>
     *
     * @throws \RuntimeException
     */
    public function store(int $conversationId, array $files): array
    {
        $attachments = [];

        foreach ($files as $file) {
            $path = $file->store("messages/{$conversationId}", 'public');

            if (!$path) {
                throw new \RuntimeException('The attachment could not be stored.');
            }

            $mime = $file->getMimeType()
                ?: $file->getClientMimeType()
                ?: 'application/octet-stream';

            $attachments[] = [
                'name' => $file->getClientOriginalName(),
                'path' => $path,
                'mime' => $mime,
                'size' => $file->getSize(),
                'url' => asset('storage/' . $path),
            ];
        }

        return $attachments;
    }

    public function deleteStored(array $attachments): void
    {
        foreach ($attachments as $attachment) {
            if (!empty($attachment['path'])) {
                Storage::disk('public')->delete($attachment['path']);
            }
        }
    }

    /**
     * @param  array<int, array{mime:string}>  $attachments
     */
    public function determineMessageType(array $attachments): string
    {
        $types = array_map(function (array $attachment) {
            $mime = strtolower($attachment['mime'] ?? '');

            return match (true) {
                str_starts_with($mime, 'image/') => 'image',
                str_starts_with($mime, 'video/') => 'video',
                str_starts_with($mime, 'audio/') => 'audio',
                default => 'file',
            };
        }, $attachments);

        $unique = array_unique($types);

        return count($unique) === 1 ? $unique[0] : 'file';
    }

    public function preview(array $attachments, string $type): string
    {
        $count = count($attachments);

        if ($count > 1) {
            return match ($type) {
                'image' => "📷 {$count} photos",
                'video' => "🎥 {$count} videos",
                'audio' => "🎤 {$count} audio messages",
                default => "📎 {$count} attachments",
            };
        }

        return match ($type) {
            'image' => '📷 Photo',
            'video' => '🎥 Video',
            'audio' => '🎤 Voice message',
            'file' => '📎 File',
            default => 'Message',
        };
    }
}