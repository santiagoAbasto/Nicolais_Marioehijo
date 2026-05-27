<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogReferenceImportRun extends Model
{
    use HasFactory;

    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_ROLLED_BACK = 'rolled_back';

    protected $table = 'catalog_reference_import_runs';

    protected $fillable = [
        'file_name',
        'file_path',
        'status',
        'families_json',
        'headings_json',
        'summary_json',
        'started_at',
        'finished_at',
        'rolled_back_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'families_json' => 'array',
            'headings_json' => 'array',
            'summary_json' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'rolled_back_at' => 'datetime',
        ];
    }

    public function records(): HasMany
    {
        return $this->hasMany(CatalogReferenceImportRecord::class, 'catalog_reference_import_run_id');
    }

    public function rows(): HasMany
    {
        return $this->hasMany(CatalogReferenceImportRow::class, 'catalog_reference_import_run_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
