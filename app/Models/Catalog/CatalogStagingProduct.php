<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogStagingProduct extends Model
{
    use HasFactory;

    public const MAPPING_PENDING = 'pending';
    public const MAPPING_RESOLVED = 'resolved';
    public const MAPPING_UNMAPPED = 'unmapped';
    public const MAPPING_PARTIAL = 'partial';
    public const MAPPING_PUBLISHED = 'published';

    public const VALIDATION_PENDING = 'pending';
    public const VALIDATION_VALID = 'valid';
    public const VALIDATION_INVALID = 'invalid';

    protected $table = 'catalog_staging_products';

    protected $fillable = [
        'catalog_import_batch_id',
        'row_number',
        'id_producto',
        'id_material',
        'cod_num',
        'id_familia_forma',
        'id_forma',
        'familia_forma',
        'dimension',
        'nombre_material',
        'forma',
        'dimensiones',
        'a_pedido',
        'descripcion',
        'oferta',
        'no_publicar',
        'discontinuo',
        'tipo',
        'precio_lista',
        'precio_con_descuento',
        'precio_venta',
        'cantidad',
        'subtotal',
        'vista_publico',
        'normalized_material_name',
        'normalized_shape_name',
        'mapped_catalog_family_id',
        'mapped_catalog_line_id',
        'mapped_catalog_series_id',
        'mapped_catalog_grade_id',
        'mapped_catalog_shape_family_id',
        'mapped_catalog_shape_id',
        'mapping_status',
        'validation_status',
        'mapping_notes',
        'validation_notes',
        'raw_payload',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'row_number' => 'integer',
            'raw_payload' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(CatalogImportBatch::class, 'catalog_import_batch_id');
    }

    public function mappedFamily(): BelongsTo
    {
        return $this->belongsTo(CatalogFamily::class, 'mapped_catalog_family_id');
    }

    public function mappedLine(): BelongsTo
    {
        return $this->belongsTo(CatalogLine::class, 'mapped_catalog_line_id');
    }

    public function mappedSeries(): BelongsTo
    {
        return $this->belongsTo(CatalogSeries::class, 'mapped_catalog_series_id');
    }

    public function mappedGrade(): BelongsTo
    {
        return $this->belongsTo(CatalogGrade::class, 'mapped_catalog_grade_id');
    }

    public function mappedShapeFamily(): BelongsTo
    {
        return $this->belongsTo(ShapeFamily::class, 'mapped_catalog_shape_family_id');
    }

    public function mappedShape(): BelongsTo
    {
        return $this->belongsTo(Shape::class, 'mapped_catalog_shape_id');
    }
}
