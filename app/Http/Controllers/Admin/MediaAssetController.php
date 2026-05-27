<?php

namespace App\Http\Controllers\Admin;

use App\Models\MediaAsset;
use App\Support\CmsSecurity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaAssetController extends AdminPlaceholderController
{
    public function store(Request $request): JsonResponse
    {
        if ($request->input('type') === 'youtube') {
            $validated = $request->validate([
                'type' => ['required', 'in:youtube'],
                'path' => ['required', 'string', 'max:1000'],
                'title' => ['nullable', 'string', 'max:255'],
                'alt_text' => ['nullable', 'string', 'max:255'],
                'meta_json' => ['nullable', 'array'],
            ]);

            $asset = MediaAsset::query()->create([
                'type' => 'youtube',
                'disk' => 'external',
                'path' => $validated['path'],
                'title' => $validated['title'] ?? null,
                'alt_text' => $validated['alt_text'] ?? null,
                'mime_type' => 'text/youtube-url',
                'meta_json' => $validated['meta_json'] ?? null,
            ]);

            return response()->json($asset->fresh());
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:102400', 'mimetypes:image/jpeg,image/png,image/webp,image/svg+xml,application/pdf,video/mp4,video/quicktime,video/webm'],
            'title' => ['nullable', 'string', 'max:255'],
            'alt_text' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $validated['file'];
        $mime = (string) $file->getMimeType();
        $type = CmsSecurity::mediaAssetTypeForMime($mime);
        $extension = strtolower((string) ($file->extension() ?: $file->getClientOriginalExtension()));
        $path = $file->storeAs(
            'uploads/cms/'.now()->format('Y/m'),
            CmsSecurity::safeStoredFilename($file),
            'public'
        );

        $asset = MediaAsset::query()->create([
            'type' => $type,
            'disk' => 'public',
            'path' => $path,
            'title' => $validated['title'] ?? $file->getClientOriginalName(),
            'alt_text' => $validated['alt_text'] ?? null,
            'mime_type' => $mime,
            'extension' => $extension ?: null,
            'size_bytes' => Storage::disk('public')->size($path),
        ]);

        return response()->json([
            ...$asset->fresh()->toArray(),
            'url' => media_asset_url($asset),
        ]);
    }
}
