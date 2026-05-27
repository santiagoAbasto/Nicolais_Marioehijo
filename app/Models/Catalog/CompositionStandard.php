<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompositionStandard extends Model
{
    use HasFactory;

    protected $table = 'catalog_composition_standards';

    protected $fillable = [
        'catalog_composition_profile_id',
        'label',
        'subtitle',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(CompositionProfile::class, 'catalog_composition_profile_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(CompositionStandardItem::class, 'catalog_composition_standard_id')->orderBy('sort_order');
    }
}
