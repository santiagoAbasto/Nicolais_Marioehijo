<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shape extends Model
{
    use HasFactory;

    protected $table = 'catalog_shapes';

    protected $fillable = [
        'catalog_shape_family_id',
        'name',
        'slug',
        'description',
        'formula_type',
        'is_calculable',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_calculable' => 'boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(ShapeFamily::class, 'catalog_shape_family_id');
    }

    public function formulaFields(): HasMany
    {
        return $this->hasMany(ShapeFormulaField::class, 'catalog_shape_id')->orderBy('sort_order');
    }

    public function formulaRules(): HasMany
    {
        return $this->hasMany(ShapeFormulaRule::class, 'catalog_shape_id');
    }

    public function gradeProducts(): HasMany
    {
        return $this->hasMany(GradeProduct::class, 'catalog_shape_id')->orderBy('sort_order');
    }
}
