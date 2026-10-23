<?php

namespace App\Services\Chat;

final class AttachmentTypeRegistry
{
    public const CATEGORY_IMAGE = 'image';
    public const CATEGORY_VIDEO = 'video';
    public const CATEGORY_AUDIO = 'audio';
    public const CATEGORY_DOCUMENT = 'document';
    public const CATEGORY_ARCHIVE = 'archive';
    public const CATEGORY_UNKNOWN = 'unknown';

    public const CATEGORIES = [
        self::CATEGORY_IMAGE,
        self::CATEGORY_VIDEO,
        self::CATEGORY_AUDIO,
        self::CATEGORY_DOCUMENT,
        self::CATEGORY_ARCHIVE,
    ];

    // -------- Extensions --------

    public const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

    public const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'webm', '3gp', 'm4v', 'mkv'];

    public const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'ogg', 'oga', 'wav', 'wave', 'aac', 'amr'];

    public const DOCUMENT_EXTENSIONS = [
        'pdf',
        'txt',
        'csv',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'odt',
        'ods',
        'odp',
        'rtf',
    ];

    public const ARCHIVE_EXTENSIONS = ['zip'];

    // Office/ODF containers that sniff as zip/octet-stream.
    public const DOCUMENT_CONTAINER_EXTENSIONS = ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'];

    public const ALLOWED_EXTENSIONS = [
        ...self::IMAGE_EXTENSIONS,
        ...self::VIDEO_EXTENSIONS,
        ...self::AUDIO_EXTENSIONS,
        ...self::DOCUMENT_EXTENSIONS,
        ...self::ARCHIVE_EXTENSIONS,
    ];

    // -------- MIME types --------

    public const IMAGE_MIMES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/x-ms-bmp',
    ];

    public const VIDEO_MIMES = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/3gpp',
        'video/3gpp2',
        'video/x-msvideo',
        'video/x-m4v',
        'video/mpeg',
        'video/x-matroska',
        'video/ogg',
        'application/x-mpegURL',
        'video/MP2T',
    ];

    public const AUDIO_MIMES = [
        'audio/mpeg',
        'audio/mp4',
        'audio/x-m4a',
        'audio/ogg',
        'audio/x-ogg',
        'audio/wav',
        'audio/x-wav',
        'audio/wave',
        'audio/aac',
        'audio/amr',
        'audio/3gpp',
        'audio/3gpp2',
        'audio/webm',
    ];

    public const DOCUMENT_MIMES = [
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation',
        'application/rtf',
        'text/rtf',
    ];

    public const ARCHIVE_MIMES = [
        'application/zip',
        'application/x-zip-compressed',
    ];

    public const ALLOWED_MIMES = [
        ...self::IMAGE_MIMES,
        ...self::VIDEO_MIMES,
        ...self::AUDIO_MIMES,
        ...self::DOCUMENT_MIMES,
        ...self::ARCHIVE_MIMES,
        'application/octet-stream',
    ];

    // -------- Ambiguous container formats --------

    /** Containers that may carry audio-only OR video streams. */
    public const AMBIGUOUS_MIMES = [
        'video/webm',
        'video/mp4',
        'video/quicktime',
        'video/3gpp',
        'video/3gpp2',
        'application/octet-stream',
        'application/mp4',
        'audio/webm',
    ];

    public const AMBIGUOUS_EXTENSIONS = ['webm', 'mp4', 'mov', '3gp', '3gpp', '3gpp2', 'm4v'];

    // -------- Extension → category fallback --------

    private const EXTENSION_CATEGORY = [
        'jpg' => self::CATEGORY_IMAGE,
        'jpeg' => self::CATEGORY_IMAGE,
        'png' => self::CATEGORY_IMAGE,
        'gif' => self::CATEGORY_IMAGE,
        'webp' => self::CATEGORY_IMAGE,
        'bmp' => self::CATEGORY_IMAGE,
        'mp3' => self::CATEGORY_AUDIO,
        'm4a' => self::CATEGORY_AUDIO,
        'ogg' => self::CATEGORY_AUDIO,
        'oga' => self::CATEGORY_AUDIO,
        'wav' => self::CATEGORY_AUDIO,
        'wave' => self::CATEGORY_AUDIO,
        'aac' => self::CATEGORY_AUDIO,
        'amr' => self::CATEGORY_AUDIO,
        'pdf' => self::CATEGORY_DOCUMENT,
        'txt' => self::CATEGORY_DOCUMENT,
        'csv' => self::CATEGORY_DOCUMENT,
        'doc' => self::CATEGORY_DOCUMENT,
        'docx' => self::CATEGORY_DOCUMENT,
        'xls' => self::CATEGORY_DOCUMENT,
        'xlsx' => self::CATEGORY_DOCUMENT,
        'ppt' => self::CATEGORY_DOCUMENT,
        'pptx' => self::CATEGORY_DOCUMENT,
        'odt' => self::CATEGORY_DOCUMENT,
        'ods' => self::CATEGORY_DOCUMENT,
        'odp' => self::CATEGORY_DOCUMENT,
        'rtf' => self::CATEGORY_DOCUMENT,
        'zip' => self::CATEGORY_ARCHIVE,
        'mp4' => self::CATEGORY_VIDEO,
        'mov' => self::CATEGORY_VIDEO,
        'avi' => self::CATEGORY_VIDEO,
        'webm' => self::CATEGORY_VIDEO,
        '3gp' => self::CATEGORY_VIDEO,
        'm4v' => self::CATEGORY_VIDEO,
        'mkv' => self::CATEGORY_VIDEO,
    ];

    public function categoryForExtension(string $extension): ?string
    {
        return self::EXTENSION_CATEGORY[strtolower($extension)] ?? null;
    }

    public function categoryForMime(string $mime): ?string
    {
        $mime = strtolower(trim($mime));

        return match (true) {
            in_array($mime, self::IMAGE_MIMES, true) => self::CATEGORY_IMAGE,
            in_array($mime, self::VIDEO_MIMES, true) => self::CATEGORY_VIDEO,
            in_array($mime, self::AUDIO_MIMES, true) => self::CATEGORY_AUDIO,
            in_array($mime, self::DOCUMENT_MIMES, true) => self::CATEGORY_DOCUMENT,
            in_array($mime, self::ARCHIVE_MIMES, true) => self::CATEGORY_ARCHIVE,
            default => null,
        };
    }

    public function isAmbiguous(string $mime, string $extension): bool
    {
        return in_array(strtolower($mime), self::AMBIGUOUS_MIMES, true)
            || in_array(strtolower($extension), self::AMBIGUOUS_EXTENSIONS, true);
    }

    public function isKnownCategory(string $category): bool
    {
        return in_array($category, self::CATEGORIES, true);
    }
}