<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class HomeHeroSlide extends Model
{
    use HasFactory;

    protected $appends = [
        'desktop_media_url',
        'mobile_media_url',
        'desktop_media_path',
        'mobile_media_path',
        'logo_one_media_url',
        'logo_two_media_url',
        'desktop_youtube_embed_url',
        'mobile_youtube_embed_url',
    ];

    protected $fillable = [
        'title',
        'subtitle',
        'description',
        'button_text',
        'button_url',
        'media_type',
        'desktop_media_id',
        'mobile_media_id',
        'logo_one_media_id',
        'logo_two_media_id',
        'alt_text',
        'sort_order',
        'autoplay_override_seconds',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'string',
            'autoplay_override_seconds' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function desktopMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'desktop_media_id');
    }

    public function mobileMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'mobile_media_id');
    }

    public function logoOneMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'logo_one_media_id');
    }

    public function logoTwoMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'logo_two_media_id');
    }

    public function desktopYoutubeEmbedUrl(): ?string
    {
        return $this->youtubeEmbedUrlFromMedia($this->desktopMedia);
    }

    public function mobileYoutubeEmbedUrl(): ?string
    {
        return $this->youtubeEmbedUrlFromMedia($this->mobileMedia);
    }

    public function getDesktopMediaUrlAttribute(): ?string
    {
        return media_asset_url($this->desktopMedia);
    }

    public function getMobileMediaUrlAttribute(): ?string
    {
        return media_asset_url($this->mobileMedia);
    }

    public function getDesktopMediaPathAttribute(): ?string
    {
        return $this->desktopMedia?->path;
    }

    public function getMobileMediaPathAttribute(): ?string
    {
        return $this->mobileMedia?->path;
    }

    public function getLogoOneMediaUrlAttribute(): ?string
    {
        return media_asset_url($this->logoOneMedia);
    }

    public function getLogoTwoMediaUrlAttribute(): ?string
    {
        return media_asset_url($this->logoTwoMedia);
    }

    public function getDesktopYoutubeEmbedUrlAttribute(): ?string
    {
        return $this->desktopYoutubeEmbedUrl();
    }

    public function getMobileYoutubeEmbedUrlAttribute(): ?string
    {
        return $this->mobileYoutubeEmbedUrl();
    }

    protected function youtubeEmbedUrlFromMedia(?MediaAsset $media): ?string
    {
        if (! $media) {
            return null;
        }

        $meta = is_array($media->meta_json ?? null) ? $media->meta_json : [];
        $embed = $meta['youtube_embed'] ?? null;
        $url = $embed ?: ($media->path ?? null);

        if (! $url) {
            return null;
        }

        $url = trim((string) $url);

        if (Str::contains($url, ['youtube.com/embed/', 'youtube-nocookie.com/embed/'])) {
            return $this->withYouTubePlaybackParams($url);
        }

        if (preg_match('~(?:youtube\.com/watch\?v=|youtu\.be/)([^&?/]+)~', $url, $matches)) {
            return $this->buildYouTubeEmbedUrl($matches[1]);
        }

        return null;
    }

    protected function withYouTubePlaybackParams(string $url): string
    {
        $parts = parse_url($url);
        $path = $parts['path'] ?? '';

        if (! preg_match('~/embed/([^/?&]+)~', $path, $matches)) {
            return $url;
        }

        $videoId = $matches[1];
        $query = [];

        if (! empty($parts['query'])) {
            parse_str($parts['query'], $query);
        }

        $query = array_merge($query, [
            'autoplay' => 1,
            'mute' => 1,
            'playsinline' => 1,
            'controls' => 0,
            'rel' => 0,
            'modestbranding' => 1,
            'loop' => 1,
            'playlist' => $videoId,
        ]);

        $scheme = $parts['scheme'] ?? 'https';
        $host = $parts['host'] ?? 'www.youtube-nocookie.com';

        return $scheme.'://'.$host.$path.'?'.http_build_query($query);
    }

    protected function buildYouTubeEmbedUrl(string $videoId): string
    {
        return 'https://www.youtube-nocookie.com/embed/'.$videoId.'?'.http_build_query([
            'autoplay' => 1,
            'mute' => 1,
            'playsinline' => 1,
            'controls' => 0,
            'rel' => 0,
            'modestbranding' => 1,
            'loop' => 1,
            'playlist' => $videoId,
        ]);
    }
}
