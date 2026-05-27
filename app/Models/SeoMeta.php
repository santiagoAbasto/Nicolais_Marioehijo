<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeoMeta extends Model
{
    use HasFactory;

    protected $fillable = [
        'page',
        'title',
        'description',
        'keywords',
        'og_image',
    ];

    public function getOgImageUrlAttribute(): ?string
    {
        return cms_media_url($this->og_image);
    }

    public static function seedProfessionalDefaults(): void
    {
        foreach (\App\Support\SeoPageResolver::pages() as $page => $settings) {
            $meta = self::query()->firstOrNew(['page' => $page]);

            foreach (['title', 'description', 'keywords'] as $field) {
                if (blank($meta->{$field}) && filled($settings[$field] ?? null)) {
                    $meta->{$field} = $settings[$field];
                }
            }

            if ($meta->isDirty()) {
                $meta->save();
            }
        }
    }
}
