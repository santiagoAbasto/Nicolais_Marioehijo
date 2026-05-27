<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogImportBatchError extends Model
{
    use HasFactory;

    protected $table = 'catalog_import_batch_errors';

    protected $fillable = [
        'catalog_import_batch_id',
        'row_number',
        'field_name',
        'error_message',
        'raw_payload',
    ];

    protected function casts(): array
    {
        return [
            'row_number' => 'integer',
            'raw_payload' => 'array',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(CatalogImportBatch::class, 'catalog_import_batch_id');
    }
}
