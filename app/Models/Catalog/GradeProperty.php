<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeProperty extends Model
{
    use HasFactory;

    protected $table = 'catalog_grade_properties';

    protected $fillable = [
        'catalog_grade_id',
        'group_name',
        'name',
        'value_text',
        'unit',
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

    public function grade(): BelongsTo
    {
        return $this->belongsTo(CatalogGrade::class, 'catalog_grade_id');
    }
}
