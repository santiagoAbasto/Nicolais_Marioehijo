<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogReferenceImportRow extends Model
{
    use HasFactory;

    protected $table = 'catalog_reference_import_rows';

    protected $fillable = [
        'catalog_reference_import_run_id',
        'row_number',
        'family_name',
        'subfamily_name',
        'product_name',
        'row_payload',
    ];

    protected function casts(): array
    {
        return [
            'row_number' => 'integer',
            'row_payload' => 'array',
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(CatalogReferenceImportRun::class, 'catalog_reference_import_run_id');
    }
}
