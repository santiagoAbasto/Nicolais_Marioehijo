<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\SectionItem;

class CatalogGrade extends Model
{
    use HasFactory;

    protected $table = 'catalog_grades';

    protected $fillable = [
        'catalog_series_id',
        'name',
        'slug',
        'short_title',
        'intro_title',
        'intro_text',
        'hero_media_id',
        'density_value',
        'density_unit',
        'specific_weight_value',
        'specific_weight_unit',
        'uns',
        'wk_nr',
        'request_quote_enabled',
        'show_in_calculator',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'density_value' => 'decimal:6',
            'specific_weight_value' => 'decimal:6',
            'request_quote_enabled' => 'boolean',
            'show_in_calculator' => 'boolean',
            'sort_order' => 'string',
            'is_active' => 'boolean',
        ];
    }

    public function series(): BelongsTo
    {
        return $this->belongsTo(CatalogSeries::class, 'catalog_series_id');
    }

    public function featureItems(): HasMany
    {
        return $this->hasMany(GradeFeatureItem::class, 'catalog_grade_id')->orderBy('sort_order');
    }

    public function contentSections(): HasMany
    {
        return $this->hasMany(GradeContentSection::class, 'catalog_grade_id')->orderBy('sort_order');
    }

    public function properties(): HasMany
    {
        return $this->hasMany(GradeProperty::class, 'catalog_grade_id')->orderBy('sort_order');
    }

    public function standards(): HasMany
    {
        return $this->hasMany(GradeStandard::class, 'catalog_grade_id')->orderBy('sort_order');
    }

    public function applications(): BelongsToMany
    {
        return $this->belongsToMany(SectionItem::class, 'catalog_grade_applications', 'catalog_grade_id', 'section_item_id')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderBy('catalog_grade_applications.sort_order');
    }

    public function normas(): BelongsToMany
    {
        return $this->belongsToMany(CatalogNorma::class, 'catalog_grade_norma', 'catalog_grade_id', 'catalog_norma_id')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderBy('catalog_grade_norma.sort_order');
    }

    public function compositionProfiles(): HasMany
    {
        return $this->hasMany(CompositionProfile::class, 'catalog_grade_id')->orderBy('sort_order');
    }

    public function gradeProducts(): HasMany
    {
        return $this->hasMany(GradeProduct::class, 'catalog_grade_id')->orderBy('sort_order');
    }

    public function heroMedia(): BelongsTo
    {
        return $this->belongsTo(\App\Models\MediaAsset::class, 'hero_media_id');
    }
}
