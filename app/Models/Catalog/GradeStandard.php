<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeStandard extends Model
{
    use HasFactory;

    protected $table = 'catalog_grade_standards';

    protected $fillable = [
        'catalog_grade_id',
        'code',
        'title',
        'description',
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
