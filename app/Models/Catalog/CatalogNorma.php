<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CatalogNorma extends Model
{
    use HasFactory;

    protected $table = 'catalog_normas';

    protected $fillable = [
        'nombre_emisor',
        'norma',
        'descripcion_corta',
        'descripcion_larga',
        'familia',
        'subfamilia',
        'tipo',
        'aplicacion_web_comercial',
        'keywords_seo',
        'fuente',
        'sort_order',
        'is_active',
        'is_imported',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'is_imported' => 'boolean',
        ];
    }

    public function grades(): BelongsToMany
    {
        return $this->belongsToMany(CatalogGrade::class, 'catalog_grade_norma', 'catalog_norma_id', 'catalog_grade_id')
            ->withPivot('sort_order')
            ->withTimestamps();
    }
}
