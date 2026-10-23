<?php

namespace App\Services\Chat;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class AttachmentClassifier
{
    public function __construct(
        private readonly AttachmentTypeRegistry $registry,
    ) {
    }

    /**
     * Resolve the category for an uploaded file. Returns 'unknown' when it
     * cannot be classified.
     */
    public function classify(UploadedFile $file, ?string $clientHint = null): string
    {
        $sniffedMime = $this->resolveMime($file);
        $clientMime = strtolower((string) ($file->getClientMimeType() ?? ''));
        $extension = strtolower($file->getClientOriginalExtension());
        $isAmbiguous = $this->registry->isAmbiguous($sniffedMime, $extension);

        // 1. ffprobe — authoritative for A/V.
        if (($probed = $this->probeCategory($file)) !== null) {
            return $probed;
        }

        // 2. Office/ODF containers sniffed as zip/octet-stream → document.
        if (
            in_array($extension, AttachmentTypeRegistry::DOCUMENT_CONTAINER_EXTENSIONS, true)
            && (
                in_array($sniffedMime, AttachmentTypeRegistry::ARCHIVE_MIMES, true)
                || $sniffedMime === 'application/octet-stream'
            )
        ) {
            return AttachmentTypeRegistry::CATEGORY_DOCUMENT;
        }

        // 3. Trusted client hint for ambiguous containers.
        if ($isAmbiguous && $clientHint !== null && $this->registry->isKnownCategory($clientHint)) {
            return $clientHint;
        }

        // 4. Explicit audio/* client MIME on ambiguous container = audio-only
        //    (browser MediaRecorder voice notes).
        if ($isAmbiguous && str_starts_with($clientMime, 'audio/')) {
            return AttachmentTypeRegistry::CATEGORY_AUDIO;
        }

        // 5. Unambiguous sniffed MIME.
        if (($byMime = $this->registry->categoryForMime($sniffedMime)) !== null) {
            return $byMime;
        }

        // 6. Extension fallback (trust extension for ambiguous containers
        //    unless step 4 already downgraded to audio).
        return $this->registry->categoryForExtension($extension)
            ?? AttachmentTypeRegistry::CATEGORY_UNKNOWN;
    }

    public function resolveMime(UploadedFile $file): string
    {
        $sniffed = $file->getMimeType();
        $client = $file->getClientMimeType();

        return strtolower(
            (is_string($sniffed) && $sniffed !== '' ? $sniffed : null)
            ?? (is_string($client) && $client !== '' ? $client : null)
            ?? 'application/octet-stream',
        );
    }

    private function probeCategory(UploadedFile $file): ?string
    {
        $binary = $this->ffprobeBinary();
        if ($binary === null) {
            return null;
        }

        $path = $file->getRealPath();
        if (!is_string($path) || $path === '' || !is_readable($path)) {
            return null;
        }

        try {
            $process = new Process([
                $binary,
                '-v',
                'quiet',
                '-print_format',
                'json',
                '-show_streams',
                $path,
            ]);
            $process->setTimeout(15);
            $process->run();

            if (!$process->isSuccessful()) {
                Log::warning('ffprobe failed to inspect attachment', [
                    'name' => $file->getClientOriginalName(),
                    'exit' => $process->getExitCode(),
                    'stderr' => mb_substr($process->getErrorOutput(), 0, 500),
                ]);
                return null;
            }

            $decoded = json_decode($process->getOutput(), true);
            if (!is_array($decoded['streams'] ?? null)) {
                Log::warning('ffprobe returned no streams for attachment', [
                    'name' => $file->getClientOriginalName(),
                    'output' => mb_substr($process->getOutput(), 0, 500),
                ]);
                return null;
            }

            $hasAudio = false;
            $hasRealVideo = false;

            foreach ($decoded['streams'] as $stream) {
                $codecType = (string) ($stream['codec_type'] ?? '');
                $isCoverArt = ((int) ($stream['disposition']['attached_pic'] ?? 0)) === 1;

                if ($codecType === 'audio') {
                    $hasAudio = true;
                } elseif ($codecType === 'video' && !$isCoverArt) {
                    $hasRealVideo = true;
                }
            }

            return match (true) {
                $hasRealVideo => AttachmentTypeRegistry::CATEGORY_VIDEO,
                $hasAudio => AttachmentTypeRegistry::CATEGORY_AUDIO,
                default => null,
            };
        } catch (\Throwable $e) {
            report($e);
            return null;
        }
    }

    private function ffprobeBinary(): ?string
    {
        static $resolved = false;
        static $binary = null;

        if ($resolved) {
            return $binary;
        }
        $resolved = true;

        $candidates = array_filter([
            config('services.ffprobe.path'),
            '/usr/bin/ffprobe',
            '/usr/local/bin/ffprobe',
            '/opt/homebrew/bin/ffprobe',
            'C:\\ffmpeg\\bin\\ffprobe.exe',
            'C:\\ffmpeg\\ffprobe.exe',
        ]);

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && is_executable($candidate)) {
                return $binary = $candidate;
            }
        }

        if (function_exists('shell_exec')) {
            $which = @shell_exec('command -v ffprobe 2>/dev/null');
            if (is_string($which) && ($which = trim($which)) !== '' && is_executable($which)) {
                return $binary = $which;
            }
        }

        Log::warning(
            'ffprobe binary not found; attachment audio/video classification falls back to MIME/extension heuristics. ' .
            'Install ffmpeg or set services.ffprobe.path in config.'
        );

        return null;
    }
}