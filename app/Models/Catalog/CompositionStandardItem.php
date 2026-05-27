<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompositionStandardItem extends Model
{
    use HasFactory;

    protected $table = 'catalog_composition_standard_items';

    protected $fillable = [
        'catalog_composition_standard_id',
        'catalog_chemical_element_id',
        'display_label',
        'min_percent',
        'max_percent',
        'nominal_percent',
        'display_percent',
        'sort_order',
        'display_row',
        'is_balance',
    ];

    protected function casts(): array
    {
        return [
            'min_percent' => 'decimal:4',
            'max_percent' => 'decimal:4',
            'nominal_percent' => 'decimal:4',
            'display_percent' => 'decimal:4',
            'sort_order' => 'integer',
            'display_row' => 'integer',
            'is_balance' => 'boolean',
        ];
    }

    public function standard(): BelongsTo
    {
        return $this->belongsTo(CompositionStandard::class, 'catalog_composition_standard_id');
    }

    public function element(): BelongsTo
    {
        return $this->belongsTo(ChemicalElement::class, 'catalog_chemical_element_id');
    }
}
