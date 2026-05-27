<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogReferenceImportRecord extends Model
{
    use HasFactory;

    public const ACTION_CREATED = 'created';
    public const ACTION_UPDATED = 'updated';

    protected $table = 'catalog_reference_import_records';

    protected $fillable = [
        'catalog_reference_import_run_id',
        'model_type',
        'model_id',
        'action',
        'original_attributes',
    ];

    protected function casts(): array
    {
        return [
            'original_attributes' => 'array',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(CatalogReferenceImportRun::class, 'catalog_reference_import_run_id');
    }
}
