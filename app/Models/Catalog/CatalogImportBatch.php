<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogImportBatch extends Model
{
    use HasFactory;

    public const STATUS_UPLOADED = 'uploaded';
    public const STATUS_STAGED = 'staged';
    public const STATUS_NEEDS_MAPPING = 'needs_mapping';
    public const STATUS_NEEDS_REVIEW = 'needs_review';
    public const STATUS_READY_TO_PUBLISH = 'ready_to_publish';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_FAILED = 'failed';

    protected $table = 'catalog_import_batches';

    protected $fillable = [
        'type',
        'file_name',
        'file_path',
        'status',
        'total_rows',
        'processed_rows',
        'success_rows',
        'failed_rows',
        'summary_json',
        'started_at',
        'finished_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'total_rows' => 'integer',
            'processed_rows' => 'integer',
            'success_rows' => 'integer',
            'failed_rows' => 'integer',
            'summary_json' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function errors(): HasMany
    {
        return $this->hasMany(CatalogImportBatchError::class, 'catalog_import_batch_id');
    }

    public function stagingProducts(): HasMany
    {
        return $this->hasMany(CatalogStagingProduct::class, 'catalog_import_batch_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
