<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChemicalElement extends Model
{
    use HasFactory;

    protected $table = 'catalog_chemical_elements';

    protected $fillable = [
        'symbol',
        'name',
        'display_color',
        'is_base_element',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order'      => 'integer',
            'is_base_element' => 'boolean',
        ];
    }

    public function compositionItems(): HasMany
    {
        return $this->hasMany(CompositionStandardItem::class, 'catalog_chemical_element_id');
    }
}
