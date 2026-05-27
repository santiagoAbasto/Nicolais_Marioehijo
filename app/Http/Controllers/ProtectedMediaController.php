<?php

namespace App\Http\Controllers;

use App\Models\MediaAsset;
use App\Support\CmsSecurity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProtectedMediaController extends Controller
{
    public function show(Request $request, string $path)
    {
        abort_if(str_contains($path, '..'), 404);
        return $this->streamMedia($path);
    }

    public function showAsset(Request $request, MediaAsset $mediaAsset, ?string $slug = null)
    {
        return $this->streamMedia(
            $mediaAsset->path,
            $mediaAsset->disk ?: 'public',
            $this->downloadFilename($mediaAsset),
            $request->boolean('download'),
        );
    }

    protected function streamMedia(string $path, string $disk = 'public', ?string $filename = null, bool $forceDownload = false)
    {
        abort_if(str_contains($path, '..'), 404);
        abort_unless(Storage::disk($disk)->exists($path), 404);

        $mimeType = $this->resolveMediaMimeType($path, $disk);
        $stream = Storage::disk($disk)->readStream($path);
        $filename = $filename ?: basename($path);
        $disposition = (! $forceDownload && CmsSecurity::isSafeInlineMime($mimeType)) ? 'inline' : 'attachment';
        $headers = [
            'Content-Type' => $mimeType,
            'Content-Disposition' => $disposition.'; filename="' . $filename . '"',
            'Cache-Control' => 'public, max-age=3600, stale-while-revalidate=86400',
            'X-Content-Type-Options' => 'nosniff',
            'X-Download-Options' => 'noopen',
            'Cross-Origin-Resource-Policy' => $disposition === 'inline' ? 'cross-origin' : 'same-origin',
        ];

        if ($disposition === 'attachment') {
            $headers['Content-Security-Policy'] = "default-src 'none'; sandbox";
        }

        return Response::stream(function () use ($stream): void {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, $headers);
    }

    protected function downloadFilename(MediaAsset $mediaAsset): string
    {
        $extension = strtolower((string) ($mediaAsset->extension ?: pathinfo($mediaAsset->path, PATHINFO_EXTENSION)));
        $name = Str::slug((string) ($mediaAsset->title ?: pathinfo($mediaAsset->path, PATHINFO_FILENAME))) ?: 'catalogo';

        return $extension ? "{$name}.{$extension}" : $name;
    }

    protected function resolveMediaMimeType(string $path, string $disk = 'public'): string
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $extensionMap = [
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'avif' => 'image/avif',
            'pdf' => 'application/pdf',
            'mp4' => 'video/mp4',
            'webm' => 'video/webm',
            'mov' => 'video/quicktime',
            'mp3' => 'audio/mpeg',
            'wav' => 'audio/wav',
        ];

        if (isset($extensionMap[$extension])) {
            return $extensionMap[$extension];
        }

        try {
            return Storage::disk($disk)->mimeType($path) ?: 'application/octet-stream';
        } catch (\Throwable) {
            return 'application/octet-stream';
        }
    }
}
