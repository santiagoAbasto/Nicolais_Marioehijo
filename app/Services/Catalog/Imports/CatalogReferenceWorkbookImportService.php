<?php

namespace App\Services\Catalog\Imports;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogMaterialMapping;
use App\Models\Catalog\CatalogNorma;
use App\Models\Catalog\CatalogReferenceImportRecord;
use App\Models\Catalog\CatalogReferenceImportRun;
use App\Models\Catalog\CatalogReferenceImportRow;
use App\Models\Catalog\CatalogSeries;
use App\Models\Catalog\ChemicalElement;
use App\Models\Catalog\CompositionProfile;
use App\Models\Catalog\GradeContentSection;
use App\Models\Catalog\GradeStandard;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use RuntimeException;
use Throwable;

class CatalogReferenceWorkbookImportService
{
    private const MATERIALS_SHEET = 'materiales';
    private const IMPORTED_PROFILE_SUBTITLE = 'Importada desde Excel de referencia';
    private const IMPORTED_STANDARD_TITLE = 'Fuente / Norma utilizada';
    private const DIAGNOSTIC_SAMPLE_LIMIT = 12;
    private const DEFAULT_EXPORT_HEADINGS = [
        'IDMater',
        'Cod_Int',
        'Familia',
        'Subfamilia',
        'Producto',
        'Densidad',
        'UNS',
        'Incluye Comp',
        'Resto del material',
        'Comentarios',
        'Fuente / Norma utilizada',
        'Normas',
        'Copete',
        'Texto 1',
        'Titulo 2',
        'Texto 2',
    ];

    private const FAMILY_CONFIGS = [
        'aceros aleados y especiales' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'aceros-aleados-y-especiales',
            'line_name' => 'Aceros aleados y especiales',
        ],
        'aceros antidesgaste' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'aceros-antidesgaste',
            'line_name' => 'Aceros antidesgaste',
        ],
        'aceros duplex y superduplex' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'aceros-duplex-y-superduplex',
            'line_name' => 'Aceros duplex y superduplex',
        ],
        'aceros inoxidables' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'aceros-inoxidables',
            'line_name' => 'Aceros inoxidables',
        ],
        'aleaciones fusibles y bismuto y sus aleaciones' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'bismuto-y-aleaciones-fusibles',
            'line_name' => 'Aleaciones fusibles y bismuto y sus aleaciones',
        ],
        'cobre y sus aleaciones' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'cobre',
            'line_name' => 'Cobre y sus aleaciones',
        ],
        'ceramicas de uso quirurgico' => [
            'catalog_family_slug' => 'no-metalicos',
            'catalog_family_name' => 'No metálicos',
            'catalog_family_sort_order' => 2,
            'line_slug' => 'zirconia',
            'line_name' => 'Cerámicas de uso quirúrgico',
        ],
        'molibdeno y sus aleaciones' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'molibdeno-y-sus-aleaciones',
            'line_name' => 'Molibdeno y sus aleaciones',
        ],
        'otros metales' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'otros-productos-metalicos',
            'line_name' => 'Otros metales',
        ],
        'plasticos de uso quirurgico' => [
            'catalog_family_slug' => 'no-metalicos',
            'catalog_family_name' => 'No metálicos',
            'catalog_family_sort_order' => 2,
            'line_slug' => 'plasticos-de-uso-quirurgico',
            'line_name' => 'Plásticos de uso quirúrgico',
        ],
        'siliconas' => [
            'catalog_family_slug' => 'no-metalicos',
            'catalog_family_name' => 'No metálicos',
            'catalog_family_sort_order' => 2,
            'line_slug' => 'fluido-de-siliconas-para-bomba-difusora',
            'line_name' => 'Siliconas',
        ],
        'tantalio y sus aleaciones' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'tantalio-y-sus-aleaciones',
            'line_name' => 'Tantalio y sus aleaciones',
        ],
        'tungsteno y sus aleaciones' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'tungsteno-y-sus-aleaciones',
            'line_name' => 'Tungsteno y sus aleaciones',
        ],
        'zirconio y sus aleaciones' => [
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'zirconio-y-sus-aleaciones',
            'line_name' => 'Zirconio y sus aleaciones',
        ],
        'niquel y aleaciones base niquel' => [
            'token' => 'niquel',
            'source_family_name' => 'NIQUEL Y ALEACIONES BASE NIQUEL',
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'niquel-y-sus-aleaciones',
            'line_name' => 'Níquel y aleaciones base níquel',
            'sort_order' => 3,
        ],
        'titanio y sus aleaciones' => [
            'token' => 'titanio',
            'source_family_name' => 'TITANIO y sus aleaciones',
            'catalog_family_slug' => 'metalicos',
            'catalog_family_name' => 'Metálicos',
            'catalog_family_sort_order' => 1,
            'line_slug' => 'titanio-y-sus-aleaciones',
            'line_name' => 'Titanio y sus aleaciones',
            'sort_order' => 1,
        ],
    ];

    private const NON_METALLIC_FAMILY_KEYWORDS = [
        'plastico',
        'plasticos',
        'ceramica',
        'ceramicas',
        'silicona',
        'siliconas',
        'no metalico',
        'no metalicos',
    ];

    private const LEGACY_LINE_REPLACEMENTS = [
        'aceros' => [
            'aceros-aleados-y-especiales',
            'aceros-antidesgaste',
            'aceros-duplex-y-superduplex',
            'aceros-inoxidables',
        ],
    ];

    private const ELEMENT_META = [
        'Al' => ['name' => 'Aluminio', 'color' => '#5B8DEF', 'base' => true],
        'B' => ['name' => 'Boro', 'color' => '#D97706', 'base' => false],
        'C' => ['name' => 'Carbono', 'color' => '#334155', 'base' => false],
        'Ce' => ['name' => 'Cerio', 'color' => '#14B8A6', 'base' => false],
        'Co' => ['name' => 'Cobalto', 'color' => '#7C3AED', 'base' => true],
        'Cr' => ['name' => 'Cromo', 'color' => '#0F766E', 'base' => true],
        'Cu' => ['name' => 'Cobre', 'color' => '#B45309', 'base' => true],
        'Fe' => ['name' => 'Hierro', 'color' => '#64748B', 'base' => true],
        'H' => ['name' => 'Hidrógeno', 'color' => '#38BDF8', 'base' => false],
        'La' => ['name' => 'Lantano', 'color' => '#10B981', 'base' => false],
        'Mg' => ['name' => 'Magnesio', 'color' => '#22C55E', 'base' => false],
        'Mn' => ['name' => 'Manganeso', 'color' => '#A855F7', 'base' => false],
        'Mo' => ['name' => 'Molibdeno', 'color' => '#0284C7', 'base' => true],
        'N' => ['name' => 'Nitrógeno', 'color' => '#06B6D4', 'base' => false],
        'Nb' => ['name' => 'Niobio', 'color' => '#9333EA', 'base' => true],
        'Ni' => ['name' => 'Níquel', 'color' => '#EAB308', 'base' => true],
        'O' => ['name' => 'Oxígeno', 'color' => '#EF4444', 'base' => false],
        'P' => ['name' => 'Fósforo', 'color' => '#F97316', 'base' => false],
        'Pb' => ['name' => 'Plomo', 'color' => '#6B7280', 'base' => false],
        'Pd' => ['name' => 'Paladio', 'color' => '#EC4899', 'base' => true],
        'Ru' => ['name' => 'Rutenio', 'color' => '#DB2777', 'base' => true],
        'S' => ['name' => 'Azufre', 'color' => '#EAB308', 'base' => false],
        'Si' => ['name' => 'Silicio', 'color' => '#14B8A6', 'base' => false],
        'Sn' => ['name' => 'Estaño', 'color' => '#94A3B8', 'base' => false],
        'Ta' => ['name' => 'Tántalo', 'color' => '#8B5CF6', 'base' => true],
        'Ti' => ['name' => 'Titanio', 'color' => '#2563EB', 'base' => true],
        'V' => ['name' => 'Vanadio', 'color' => '#16A34A', 'base' => true],
        'W' => ['name' => 'Wolframio', 'color' => '#0F172A', 'base' => true],
        'Y' => ['name' => 'Itrio', 'color' => '#10B981', 'base' => false],
        'Zr' => ['name' => 'Circonio', 'color' => '#0891B2', 'base' => true],
    ];

    private const EXCEL_ELEMENT_ORDER = [
        'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
        'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar',
        'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
        'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
        'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd',
        'In', 'Sn', 'Sb', 'Te', 'I', 'Xe',
        'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
        'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
        'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn',
        'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr',
        'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
    ];

    public function __construct(
        private readonly CatalogImportNormalizer $normalizer,
    ) {
    }

    public function import(
        string $path,
        array $families = [],
        ?string $originalFileName = null,
        ?int $userId = null,
    ): array {
        if (! is_file($path)) {
            throw new RuntimeException("No se encontró el archivo: {$path}");
        }

        $run = CatalogReferenceImportRun::query()->create([
            'file_name' => $originalFileName ?: basename($path),
            'file_path' => $path,
            'status' => CatalogReferenceImportRun::STATUS_PROCESSING,
            'families_json' => $families,
            'started_at' => now(),
            'created_by' => $userId,
        ]);

        try {
            $summary = $this->processImport($path, $families, $run);

            $run->update([
                'status' => CatalogReferenceImportRun::STATUS_COMPLETED,
                'summary_json' => $summary,
                'finished_at' => now(),
            ]);

            return [
                ...$summary,
                'run_id' => $run->id,
            ];
        } catch (Throwable $exception) {
            $run->update([
                'status' => CatalogReferenceImportRun::STATUS_FAILED,
                'summary_json' => [
                    'exception' => $exception->getMessage(),
                ],
                'finished_at' => now(),
            ]);

            throw $exception;
        }
    }

    public function preview(string $path, array $families = []): array
    {
        if (! is_file($path)) {
            throw new RuntimeException("No se encontró el archivo: {$path}");
        }

        $spreadsheet = IOFactory::load($path);
        $sheet = $this->resolveMaterialsSheet($spreadsheet);
        $rows = $sheet->toArray(null, true, true, false);

        if ($rows === []) {
            throw new RuntimeException('La hoja de materiales está vacía.');
        }

        $headingRow = array_shift($rows) ?? [];
        $headingMap = $this->buildHeadingMap($headingRow);
        $elementSymbols = $this->extractElementSymbols($headingRow);
        $familyTokens = collect($families)
            ->map(fn ($value) => $this->normalizer->normalizeText((string) $value))
            ->filter()
            ->values()
            ->all();

        $existingFamilies = CatalogFamily::query()->where('is_active', true)->get()->keyBy('slug');
        $existingLines = CatalogLine::query()->where('is_active', true)->get()->keyBy(fn (CatalogLine $line) => $line->catalog_family_id.'|'.$line->slug);
        $existingSeries = CatalogSeries::query()->where('is_active', true)->get()->keyBy(fn (CatalogSeries $series) => $series->catalog_line_id.'|'.$series->slug);
        $existingGrades = CatalogGrade::query()->where('is_active', true)->get()->keyBy(fn (CatalogGrade $grade) => $grade->catalog_series_id.'|'.$grade->slug);
        $existingMappings = CatalogMaterialMapping::query()
            ->whereNotNull('external_material_id')
            ->where('is_active', true)
            ->get()
            ->keyBy(fn (CatalogMaterialMapping $mapping) => $this->normalizer->normalizeText($mapping->external_material_id) ?? '');
        $normaLookup = $this->buildNormaLookup();

        $summary = [
            'processed_rows' => 0,
            'missing_required_rows' => 0,
            'ignored_family_rows' => 0,
            'duplicate_rows_in_file_count' => 0,
            'new_lines_count' => 0,
            'new_series_count' => 0,
            'new_grades_count' => 0,
            'new_material_mappings_count' => 0,
            'existing_lines_count' => 0,
            'existing_series_count' => 0,
            'existing_grades_count' => 0,
            'existing_material_mappings_count' => 0,
            'norma_unmatched_rows_count' => 0,
            'composition_skipped_rows' => 0,
            'new_lines' => [],
            'new_series' => [],
            'new_grades' => [],
            'new_material_mappings' => [],
            'existing_lines' => [],
            'existing_series' => [],
            'existing_grades' => [],
            'existing_material_mappings' => [],
            'norma_unmatched_samples' => [],
            'composition_skipped_samples' => [],
            'duplicate_rows_in_file' => [],
            'missing_required_samples' => [],
            'ignored_family_samples' => [],
        ];
        $seenRows = [];

        foreach ($rows as $index => $row) {
            $preview = $this->extractRowPreview($row, $headingMap);
            $data = $this->extractRow($row, $headingMap, $elementSymbols);

            if ($data === null) {
                $summary['missing_required_rows']++;
                $this->pushDiagnosticSample($summary['missing_required_samples'], [
                    'row_number' => $index + 2,
                    'family' => $preview['family'] ?? 'Sin familia',
                    'series' => $preview['subfamily'] ?? 'Sin serie',
                    'grade' => $preview['product'] ?? 'Sin grado',
                    'composition' => 'No evaluada',
                    'reason' => 'Faltan Familia, Subfamilia o Producto para poder importar la fila.',
                ]);

                continue;
            }

            $familyConfig = $this->resolveFamilyConfig($data['family_raw']);

            if ($familyConfig === null || ! $this->shouldImportFamily($familyConfig['token'], $familyTokens)) {
                $summary['ignored_family_rows']++;
                $this->pushDiagnosticSample($summary['ignored_family_samples'], [
                    'row_number' => $index + 2,
                    'family' => $data['family_raw'],
                    'series' => $data['subfamily'],
                    'grade' => $data['product'],
                    'composition' => $data['include_composition'] ? 'Marcada para importar' : 'No incluida por Excel',
                    'reason' => $familyConfig === null
                        ? 'La familia no tiene mapeo a una familia/línea visible en la web.'
                        : 'La familia quedó fuera del alcance de esta corrida del importador.',
                ]);

                continue;
            }

            $summary['processed_rows']++;
            $rowIdentity = $this->buildReferenceRowIdentity($familyConfig['token'], $data);

            if (isset($seenRows[$rowIdentity])) {
                $summary['duplicate_rows_in_file_count']++;
                $this->pushDiagnosticSample($summary['duplicate_rows_in_file'], [
                    'row_number' => $index + 2,
                    'family' => $data['family_raw'],
                    'series' => $data['subfamily'],
                    'grade' => $data['product'],
                    'composition' => $data['include_composition'] ? 'Marcada para importar' : 'No incluida por Excel',
                    'reason' => 'La misma fila técnica ya apareció antes en este archivo.',
                ]);

                continue;
            }

            $seenRows[$rowIdentity] = true;
            $family = $existingFamilies[$familyConfig['catalog_family_slug']] ?? null;
            $familyId = $family?->id ?? ('new:'.$familyConfig['catalog_family_slug']);
            $lineKey = $familyId.'|'.$familyConfig['line_slug'];
            $line = is_int($familyId) ? ($existingLines[$lineKey] ?? null) : null;

            if (! $line) {
                $summary['new_lines_count']++;
                $existingLines[$lineKey] = (object) ['id' => null, 'name' => $familyConfig['line_name']];
                $this->pushDiagnosticSample($summary['new_lines'], [
                    'row_number' => $index + 2,
                    'family' => $familyConfig['catalog_family_name'],
                    'series' => null,
                    'grade' => $familyConfig['line_name'],
                    'composition' => null,
                    'reason' => 'Se creará una línea nueva desde esta familia importada.',
                ]);
            } else {
                $this->pushUniquePreviewSample($summary, 'existing_lines', $lineKey, [
                    'row_number' => $index + 2,
                    'family' => $familyConfig['catalog_family_name'],
                    'series' => null,
                    'grade' => $line->name,
                    'composition' => null,
                    'reason' => 'La línea ya existe en el catálogo y se reutilizará.',
                ]);
            }

            $lineId = $line?->id ?? ('new-line:'.$lineKey);
            $seriesSlug = Str::slug($data['subfamily']);
            $seriesKey = $lineId.'|'.$seriesSlug;
            $series = is_int($lineId) ? ($existingSeries[$seriesKey] ?? null) : null;

            if (! $series) {
                $summary['new_series_count']++;
                $existingSeries[$seriesKey] = (object) ['id' => null, 'name' => $data['subfamily']];
                $this->pushDiagnosticSample($summary['new_series'], [
                    'row_number' => $index + 2,
                    'family' => $familyConfig['line_name'],
                    'series' => $data['subfamily'],
                    'grade' => null,
                    'composition' => null,
                    'reason' => 'Se creará una serie nueva para esta subfamilia.',
                ]);
            } else {
                $this->pushUniquePreviewSample($summary, 'existing_series', $seriesKey, [
                    'row_number' => $index + 2,
                    'family' => $familyConfig['line_name'],
                    'series' => $series->name,
                    'grade' => null,
                    'composition' => null,
                    'reason' => 'La serie ya existe y se actualizará si el Excel trae cambios.',
                ]);
            }

            $seriesId = $series?->id ?? ('new-series:'.$seriesKey);
            $gradeSlug = $data['product_slug'] ?: Str::slug($data['product']);
            $gradeKey = $seriesId.'|'.$gradeSlug;
            $grade = is_int($seriesId) ? ($existingGrades[$gradeKey] ?? null) : null;

            if (! $grade) {
                $summary['new_grades_count']++;
                $existingGrades[$gradeKey] = (object) ['id' => null, 'name' => $data['product']];
                $this->pushDiagnosticSample($summary['new_grades'], [
                    'row_number' => $index + 2,
                    'family' => $familyConfig['line_name'],
                    'series' => $data['subfamily'],
                    'grade' => $data['product'],
                    'composition' => $data['include_composition'] ? 'Con composición' : 'Sin composición',
                    'reason' => 'Entrará como grado nuevo al catálogo.',
                ]);
            } else {
                $this->pushUniquePreviewSample($summary, 'existing_grades', $gradeKey, [
                    'row_number' => $index + 2,
                    'family' => $familyConfig['line_name'],
                    'series' => $data['subfamily'],
                    'grade' => $grade->name,
                    'composition' => $data['include_composition'] ? 'Con composición' : 'Sin composición',
                    'reason' => 'El grado ya existe y se actualizará si este Excel trae cambios.',
                ]);
            }

            $materialKey = $this->normalizer->normalizeText($data['material_id'] ?? null) ?? '';

            if ($materialKey !== '' && ! isset($existingMappings[$materialKey])) {
                $summary['new_material_mappings_count']++;
                $existingMappings[$materialKey] = true;
                $this->pushDiagnosticSample($summary['new_material_mappings'], [
                    'row_number' => $index + 2,
                    'family' => $familyConfig['line_name'],
                    'series' => $data['subfamily'],
                    'grade' => $data['product'],
                    'composition' => null,
                    'reason' => 'Se creará un vínculo nuevo entre IDMater y grado.',
                ]);
            } elseif ($materialKey !== '') {
                $this->pushUniquePreviewSample($summary, 'existing_material_mappings', $materialKey, [
                    'row_number' => $index + 2,
                    'family' => $familyConfig['line_name'],
                    'series' => $data['subfamily'],
                    'grade' => $data['product'],
                    'composition' => null,
                    'reason' => 'El vínculo entre IDMater y grado ya existe.',
                ]);
            }

            $normaResolution = $this->resolveNormaCodes(
                $data['source'],
                $data['additional_standards'],
                $normaLookup
            );

            if ($normaResolution['unmatched_codes'] !== []) {
                $summary['norma_unmatched_rows_count']++;
                $this->pushDiagnosticSample($summary['norma_unmatched_samples'], [
                    'row_number' => $index + 2,
                    'family' => $familyConfig['line_name'],
                    'series' => $data['subfamily'],
                    'grade' => $data['product'],
                    'composition' => null,
                    'reason' => 'Estas normas no encontraron match: '.implode(', ', $normaResolution['unmatched_codes']).'.',
                ]);
            }

            $compositionReason = $this->resolveCompositionSkipReason($data);

            if ($compositionReason !== null) {
                $summary['composition_skipped_rows']++;
                $this->pushDiagnosticSample($summary['composition_skipped_samples'], [
                    'row_number' => $index + 2,
                    'family' => $familyConfig['line_name'],
                    'series' => $data['subfamily'],
                    'grade' => $data['product'],
                    'composition' => 'No importada',
                    'reason' => $compositionReason,
                ]);
            }
        }

        return [
            'processed_rows' => $summary['processed_rows'],
            'missing_required_rows' => $summary['missing_required_rows'],
            'ignored_family_rows' => $summary['ignored_family_rows'],
            'duplicate_rows_in_file_count' => $summary['duplicate_rows_in_file_count'],
            'new_lines_count' => $summary['new_lines_count'],
            'new_series_count' => $summary['new_series_count'],
            'new_grades_count' => $summary['new_grades_count'],
            'new_material_mappings_count' => $summary['new_material_mappings_count'],
            'existing_lines_count' => $summary['existing_lines_count'],
            'existing_series_count' => $summary['existing_series_count'],
            'existing_grades_count' => $summary['existing_grades_count'],
            'existing_material_mappings_count' => $summary['existing_material_mappings_count'],
            'norma_unmatched_rows_count' => $summary['norma_unmatched_rows_count'],
            'composition_skipped_rows' => $summary['composition_skipped_rows'],
            'new_lines' => $summary['new_lines'],
            'new_series' => $summary['new_series'],
            'new_grades' => $summary['new_grades'],
            'new_material_mappings' => $summary['new_material_mappings'],
            'existing_lines' => $summary['existing_lines'],
            'existing_series' => $summary['existing_series'],
            'existing_grades' => $summary['existing_grades'],
            'existing_material_mappings' => $summary['existing_material_mappings'],
            'norma_unmatched_samples' => $summary['norma_unmatched_samples'],
            'composition_skipped_samples' => $summary['composition_skipped_samples'],
            'duplicate_rows_in_file' => $summary['duplicate_rows_in_file'],
            'missing_required_samples' => $summary['missing_required_samples'],
            'ignored_family_samples' => $summary['ignored_family_samples'],
        ];
    }

    public function buildExportSpreadsheet(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Materiales');

        $latestRun = CatalogReferenceImportRun::query()
            ->where('status', CatalogReferenceImportRun::STATUS_COMPLETED)
            ->whereNull('rolled_back_at')
            ->latest('id')
            ->with(['rows' => fn ($query) => $query->orderBy('row_number')])
            ->first();

        $headings = $latestRun?->headings_json ?: self::DEFAULT_EXPORT_HEADINGS;

        $sheet->fromArray($headings, null, 'A1');

        $rowNumber = 2;

        if (! $latestRun) {
            return $spreadsheet;
        }

        foreach ($latestRun->rows as $row) {
            $payload = collect($row->row_payload ?? [])
                ->sortBy('index')
                ->map(fn (array $item) => $item['value'] ?? null)
                ->values()
                ->all();

            $sheet->fromArray($payload, null, 'A'.$rowNumber);
            $rowNumber++;
        }

        return $spreadsheet;
    }

    public function relinkNormasFromActiveImports(): int
    {
        $normaLookup = $this->buildNormaLookup();

        if (
            ($normaLookup['pair'] ?? []) === []
            && ($normaLookup['pair_compact'] ?? []) === []
            && ($normaLookup['by_code'] ?? []) === []
        ) {
            return 0;
        }

        $runs = CatalogReferenceImportRun::query()
            ->where('status', CatalogReferenceImportRun::STATUS_COMPLETED)
            ->whereNull('rolled_back_at')
            ->with(['rows' => fn ($query) => $query->orderBy('row_number')])
            ->orderBy('id')
            ->get();

        $nextSortOrderByGrade = [];
        $attached = 0;

        foreach ($runs as $run) {
            foreach ($run->rows as $row) {
                $grade = $this->resolveGradeFromImportedRow($row);

                if (! $grade) {
                    continue;
                }

                $payloadLookup = collect($row->row_payload ?? [])
                    ->mapWithKeys(fn (array $item) => [
                        (string) ($item['normalized_heading'] ?? '') => $item['value'] ?? null,
                    ]);

                $normaResolution = $this->resolveNormaCodes(
                    $this->cleanString($payloadLookup->get('fuente_norma_utilizada')),
                    $this->cleanString($payloadLookup->get('normas')),
                    $normaLookup
                );

                $attached += $this->syncNormas(
                    $grade,
                    $normaResolution,
                    $nextSortOrderByGrade
                );
            }
        }

        return $attached;
    }

    public function rollbackImported(): array
    {
        $runs = CatalogReferenceImportRun::query()
            ->where('status', CatalogReferenceImportRun::STATUS_COMPLETED)
            ->whereNull('rolled_back_at')
            ->orderByDesc('id')
            ->with(['records' => fn ($query) => $query->orderByDesc('id')])
            ->get();

        if ($runs->isEmpty()) {
            return [
                'runs' => 0,
                'deleted_records' => 0,
                'restored_records' => 0,
                'skipped_records' => 0,
            ];
        }

        $summary = [
            'runs' => $runs->count(),
            'deleted_records' => 0,
            'restored_records' => 0,
            'skipped_records' => 0,
        ];

        DB::transaction(function () use ($runs, &$summary): void {
            foreach ($runs as $run) {
                $runDeleted = 0;
                $runRestored = 0;
                $runSkipped = 0;

                foreach ($run->records as $record) {
                    $result = $this->rollbackRecord($record);

                    $summary[$result]++;

                    if ($result === 'deleted_records') {
                        $runDeleted++;
                    } elseif ($result === 'restored_records') {
                        $runRestored++;
                    } else {
                        $runSkipped++;
                    }
                }

                $run->update([
                    'status' => CatalogReferenceImportRun::STATUS_ROLLED_BACK,
                    'rolled_back_at' => now(),
                    'summary_json' => [
                        ...($run->summary_json ?? []),
                        'rollback' => [
                            'deleted_records' => $runDeleted,
                            'restored_records' => $runRestored,
                            'skipped_records' => $runSkipped,
                        ],
                    ],
                ]);
            }
        });

        return $summary;
    }

    private function processImport(string $path, array $families, CatalogReferenceImportRun $run): array
    {
        $spreadsheet = IOFactory::load($path);
        $sheet = $this->resolveMaterialsSheet($spreadsheet);
        $rows = $sheet->toArray(null, true, true, false);

        if ($rows === []) {
            throw new RuntimeException('La hoja de materiales está vacía.');
        }

        $headingRow = array_shift($rows) ?? [];
        $headingMap = $this->buildHeadingMap($headingRow);
        $elementSymbols = $this->extractElementSymbols($headingRow);
        $familyTokens = collect($families)
            ->map(fn ($value) => $this->normalizer->normalizeText((string) $value))
            ->filter()
            ->values()
            ->all();

        $run->update([
            'headings_json' => array_values($headingRow),
        ]);

        $summary = [
            'processed_rows' => 0,
            'lines' => [],
            'series' => [],
            'grades' => [],
            'composition_profiles' => 0,
            'material_mappings' => 0,
            'skipped_rows' => 0,
            'ignored_rows' => 0,
            'raw_rows_saved' => 0,
            'accepted_families' => [],
            'missing_required_rows' => 0,
            'ignored_family_rows' => 0,
            'composition_skipped_rows' => 0,
            'duplicate_rows_in_file_count' => 0,
            'norma_unmatched_rows' => 0,
            'missing_required_samples' => [],
            'ignored_family_samples' => [],
            'composition_skipped_samples' => [],
            'norma_unmatched_samples' => [],
            'duplicate_rows_in_file' => [],
        ];

        $lineOrder = [];
        $seriesOrder = [];
        $gradeOrder = [];
        $elementCache = [];
        $importedLineSlugs = [];
        $normaLookup = $this->buildNormaLookup();
        $nextNormaSortOrderByGrade = [];
        $seenRows = [];

        DB::transaction(function () use (
            $rows,
            $headingRow,
            $headingMap,
            $elementSymbols,
            $familyTokens,
            $run,
            &$summary,
            &$lineOrder,
            &$seriesOrder,
            &$gradeOrder,
            &$elementCache,
            &$importedLineSlugs,
            $normaLookup,
            &$nextNormaSortOrderByGrade,
            &$seenRows,
        ): void {
            foreach ($rows as $index => $row) {
                $preview = $this->extractRowPreview($row, $headingMap);
                $data = $this->extractRow($row, $headingMap, $elementSymbols);

                if ($data === null) {
                    $summary['skipped_rows']++;
                    $summary['missing_required_rows']++;
                    $this->pushDiagnosticSample($summary['missing_required_samples'], [
                        'row_number' => $index + 2,
                        'family' => $preview['family'] ?? 'Sin familia',
                        'series' => $preview['subfamily'] ?? 'Sin serie',
                        'grade' => $preview['product'] ?? 'Sin grado',
                        'composition' => 'No evaluada',
                        'reason' => 'Faltan Familia, Subfamilia o Producto para poder importar la fila.',
                    ]);
                    continue;
                }

                $familyConfig = $this->resolveFamilyConfig($data['family_raw']);

                if ($familyConfig === null || ! $this->shouldImportFamily($familyConfig['token'], $familyTokens)) {
                    $summary['ignored_rows']++;
                    $summary['ignored_family_rows']++;
                    $this->pushDiagnosticSample($summary['ignored_family_samples'], [
                        'row_number' => $index + 2,
                        'family' => $data['family_raw'],
                        'series' => $data['subfamily'],
                        'grade' => $data['product'],
                        'composition' => $data['include_composition']
                            ? 'Marcada para importar'
                            : 'No incluida por Excel',
                        'reason' => $familyConfig === null
                            ? 'La familia no tiene mapeo a una familia/línea visible en la web.'
                            : 'La familia quedó fuera del alcance de esta corrida del importador.',
                    ]);
                    continue;
                }

                $rowIdentity = $this->buildReferenceRowIdentity($familyConfig['token'], $data);

                if (isset($seenRows[$rowIdentity])) {
                    $summary['duplicate_rows_in_file_count']++;
                    $this->pushDiagnosticSample($summary['duplicate_rows_in_file'], [
                        'row_number' => $index + 2,
                        'family' => $data['family_raw'],
                        'series' => $data['subfamily'],
                        'grade' => $data['product'],
                        'composition' => $data['include_composition']
                            ? 'Marcada para importar'
                            : 'No incluida por Excel',
                        'reason' => 'La misma fila técnica ya apareció antes en este archivo y se omitió para no duplicar la carga.',
                    ]);
                    continue;
                }

                $seenRows[$rowIdentity] = true;

                $summary['processed_rows']++;
                $this->storeImportedRowSnapshot($run, $index + 2, $row, $headingRow, $data);
                $summary['raw_rows_saved']++;

                $catalogFamily = $this->resolveCatalogFamily($familyConfig, $run);
                $line = $this->upsertLine($catalogFamily, $familyConfig, $data, $lineOrder, $run);
                $importedLineSlugs[$line->slug] = $line->slug;
                $series = $this->upsertSeries($line, $data, $seriesOrder, $run);
                $grade = $this->upsertGrade($series, $data, $gradeOrder, $run);
                $this->syncGradeContentSections($grade, $data, $run);

                if ($data['material_id']) {
                    $this->syncMaterialMapping($catalogFamily, $line, $series, $grade, $data, $run);
                    $summary['material_mappings']++;
                }

                $normaResolution = $this->resolveNormaCodes(
                    $data['source'],
                    $data['additional_standards'],
                    $normaLookup
                );

                $this->syncNormas(
                    $grade,
                    $normaResolution,
                    $nextNormaSortOrderByGrade
                );

                if ($normaResolution['unmatched_codes'] !== []) {
                    $summary['norma_unmatched_rows']++;
                    $this->pushDiagnosticSample($summary['norma_unmatched_samples'], [
                        'row_number' => $index + 2,
                        'family' => $data['family_raw'],
                        'series' => $data['subfamily'],
                        'grade' => $data['product'],
                        'composition' => null,
                        'reason' => 'Estas normas no encontraron match: '.implode(', ', $normaResolution['unmatched_codes']).'.',
                    ]);
                }

                $compositionImported = $this->syncComposition($grade, $data, $elementCache, $run);

                if ($compositionImported > 0) {
                    $summary['composition_profiles']++;
                } else {
                    $compositionReason = $this->resolveCompositionSkipReason($data);

                    if ($compositionReason !== null) {
                        $summary['composition_skipped_rows']++;
                        $this->pushDiagnosticSample($summary['composition_skipped_samples'], [
                            'row_number' => $index + 2,
                            'family' => $data['family_raw'],
                            'series' => $data['subfamily'],
                            'grade' => $data['product'],
                            'composition' => 'No importada',
                            'reason' => $compositionReason,
                        ]);
                    }
                }

                $summary['lines'][$line->id] = $line->name;
                $summary['series'][$series->id] = $series->name;
                $summary['grades'][$grade->id] = $grade->name;
                $summary['accepted_families'][$familyConfig['source_family_name']] = $familyConfig['source_family_name'];
            }

            $this->deactivateLegacyLines(array_values($importedLineSlugs), $familyTokens, $run);
        });

        return [
            'processed_rows' => $summary['processed_rows'],
            'lines' => count($summary['lines']),
            'series' => count($summary['series']),
            'grades' => count($summary['grades']),
            'composition_profiles' => $summary['composition_profiles'],
            'material_mappings' => $summary['material_mappings'],
            'skipped_rows' => $summary['skipped_rows'],
            'ignored_rows' => $summary['ignored_rows'],
            'raw_rows_saved' => $summary['raw_rows_saved'],
            'accepted_families' => array_values($summary['accepted_families']),
            'missing_required_rows' => $summary['missing_required_rows'],
            'ignored_family_rows' => $summary['ignored_family_rows'],
            'composition_skipped_rows' => $summary['composition_skipped_rows'],
            'duplicate_rows_in_file_count' => $summary['duplicate_rows_in_file_count'],
            'norma_unmatched_rows' => $summary['norma_unmatched_rows'],
            'missing_required_samples' => $summary['missing_required_samples'],
            'ignored_family_samples' => $summary['ignored_family_samples'],
            'composition_skipped_samples' => $summary['composition_skipped_samples'],
            'norma_unmatched_samples' => $summary['norma_unmatched_samples'],
            'duplicate_rows_in_file' => $summary['duplicate_rows_in_file'],
        ];
    }

    private function resolveMaterialsSheet(Spreadsheet $spreadsheet)
    {
        foreach ($spreadsheet->getWorksheetIterator() as $sheet) {
            $normalized = $this->normalizer->normalizeText($sheet->getTitle());

            if ($normalized === self::MATERIALS_SHEET) {
                return $sheet;
            }
        }

        throw new RuntimeException('No se encontró una hoja "Materiales" en el Excel.');
    }

    private function buildHeadingMap(array $headingRow): array
    {
        $map = [];

        foreach ($headingRow as $index => $heading) {
            $normalized = $this->normalizer->normalizeHeading((string) $heading);

            if ($normalized !== '') {
                $map[$normalized] = $index;
            }
        }

        return $map;
    }

    private function extractElementSymbols(array $headingRow): array
    {
        $symbols = [];

        foreach ($headingRow as $heading) {
            if (! is_string($heading)) {
                continue;
            }

            if (preg_match('/^([A-Z][a-z]?)\s+(Mín|Min)$/u', trim($heading), $matches)) {
                $symbols[] = $matches[1];
            }
        }

        return array_values(array_unique($symbols));
    }

    private function extractRow(array $row, array $headingMap, array $elementSymbols): ?array
    {
        $family = $this->cleanString($row[$headingMap['familia'] ?? -1] ?? null);
        $subfamily = $this->cleanString($row[$headingMap['subfamilia'] ?? -1] ?? null);
        $product = $this->cleanString($row[$headingMap['producto'] ?? -1] ?? null);

        if (! $family || ! $subfamily || ! $product) {
            return null;
        }

        $elements = [];

        foreach ($elementSymbols as $symbol) {
            $minIndex = $headingMap[$this->normalizer->normalizeHeading("{$symbol} Mín")] ?? $headingMap[$this->normalizer->normalizeHeading("{$symbol} Min")] ?? null;
            $maxIndex = $headingMap[$this->normalizer->normalizeHeading("{$symbol} Máx")] ?? $headingMap[$this->normalizer->normalizeHeading("{$symbol} Max")] ?? null;

            $min = $minIndex !== null ? $this->normalizer->toDecimal($row[$minIndex] ?? null) : null;
            $max = $maxIndex !== null ? $this->normalizer->toDecimal($row[$maxIndex] ?? null) : null;

            if ($min === null && $max === null) {
                continue;
            }

            $elements[$symbol] = [
                'min' => $min,
                'max' => $max,
            ];
        }

        $text2Index = $headingMap['texto_2'] ?? null;
        $text2Body = null;

        if ($text2Index !== null) {
            $candidate = $row[$text2Index + 1] ?? null;
            $text2Body = $this->cleanString($candidate);
        }

        return [
            'family_raw' => $family,
            'family_text' => $this->cleanString($row[$headingMap['familia_texto'] ?? -1] ?? null),
            'family_order' => $this->cleanString($row[$headingMap['familia_orden'] ?? -1] ?? null),
            'subfamily' => $subfamily,
            'subfamily_text' => $this->cleanString($row[$headingMap['subfamilia_texto'] ?? -1] ?? null),
            'subfamily_order' => $this->cleanString($row[$headingMap['subfamilia_orden'] ?? -1] ?? null),
            'product' => $product,
            'product_slug' => Str::slug($product),
            'product_order' => $this->cleanString($row[$headingMap['producto_orden'] ?? -1] ?? null),
            'material_id' => $this->cleanString($row[$headingMap['idmater'] ?? -1] ?? null),
            'external_code' => $this->cleanString($row[$headingMap['cod_int'] ?? -1] ?? null),
            'density' => $this->normalizer->toDecimal($row[$headingMap['densidad'] ?? -1] ?? null),
            'uns' => $this->cleanString($row[$headingMap['uns'] ?? -1] ?? null),
            'include_composition' => $this->normalizer->toBool($row[$headingMap['incluye_comp'] ?? -1] ?? null),
            'balance_symbol' => $this->cleanString($row[$headingMap['resto_del_material'] ?? -1] ?? null),
            'comments' => $this->cleanString($row[$headingMap['comentarios'] ?? -1] ?? null),
            'source' => $this->cleanString($row[$headingMap['fuente_norma_utilizada'] ?? -1] ?? null),
            'additional_standards' => $this->cleanString($row[$headingMap['normas'] ?? -1] ?? null),
            'copete' => $this->cleanString($row[$headingMap['copete'] ?? -1] ?? null),
            'text_1' => $this->cleanString($row[$headingMap['texto_1'] ?? -1] ?? null),
            'title_2' => $this->cleanString($row[$headingMap['titulo_2'] ?? -1] ?? null),
            'text_2' => $this->cleanString($row[$headingMap['texto_2'] ?? -1] ?? null),
            'text_2_body' => $text2Body,
            'elements' => $elements,
        ];
    }

    private function extractRowPreview(array $row, array $headingMap): array
    {
        return [
            'family' => $this->cleanString($row[$headingMap['familia'] ?? -1] ?? null),
            'subfamily' => $this->cleanString($row[$headingMap['subfamilia'] ?? -1] ?? null),
            'product' => $this->cleanString($row[$headingMap['producto'] ?? -1] ?? null),
        ];
    }

    private function buildReferenceRowIdentity(string $familyToken, array $data): string
    {
        return implode('|', [
            $familyToken,
            $this->normalizer->normalizeText($data['subfamily']) ?? '',
            $this->normalizer->normalizeText($data['product']) ?? '',
            $this->normalizer->normalizeText($data['material_id'] ?? null) ?? '',
        ]);
    }

    private function resolveCatalogFamily(array $config, CatalogReferenceImportRun $run): CatalogFamily
    {
        $family = CatalogFamily::query()->firstOrNew(['slug' => $config['catalog_family_slug']]);

        return $this->persistTrackedModel($family, [
            'name' => $family->name ?: $config['catalog_family_name'],
            'intro_title' => $family->intro_title ?: 'Nuestros productos',
            'intro_text' => $family->intro_text ?: $config['catalog_family_intro_text'],
            'sort_order' => $family->sort_order ?: $config['catalog_family_sort_order'],
            'is_active' => true,
        ], $run);
    }

    private function resolveFamilyConfig(string $family): ?array
    {
        $normalized = $this->normalizer->normalizeText($family);

        if (! $normalized) {
            return null;
        }

        $configured = self::FAMILY_CONFIGS[$normalized] ?? [];
        $isNonMetallic = $this->isNonMetallicFamily($normalized);

        return [
            'token' => $configured['token'] ?? $normalized,
            'source_family_name' => $configured['source_family_name'] ?? $family,
            'catalog_family_slug' => $configured['catalog_family_slug'] ?? ($isNonMetallic ? 'no-metalicos' : 'metalicos'),
            'catalog_family_name' => $configured['catalog_family_name'] ?? ($isNonMetallic ? 'No metálicos' : 'Metálicos'),
            'catalog_family_intro_text' => $configured['catalog_family_intro_text'] ?? (
                $isNonMetallic
                    ? 'Líneas de materiales no metálicos disponibles para aplicaciones técnicas y quirúrgicas.'
                    : 'Líneas de materiales y aleaciones especiales disponibles para la industria.'
            ),
            'catalog_family_sort_order' => $configured['catalog_family_sort_order'] ?? ($isNonMetallic ? 2 : 1),
            'line_slug' => $configured['line_slug'] ?? (Str::slug($family) ?: $normalized),
            'line_name' => $family,
            'sort_order' => $configured['sort_order'] ?? null,
        ];
    }

    private function shouldImportFamily(string $token, array $requestedTokens): bool
    {
        if ($requestedTokens === []) {
            return true;
        }

        return in_array('todo', $requestedTokens, true)
            || in_array('all', $requestedTokens, true)
            || in_array($token, $requestedTokens, true);
    }

    private function isFullCatalogImport(array $requestedTokens): bool
    {
        return $requestedTokens === []
            || in_array('todo', $requestedTokens, true)
            || in_array('all', $requestedTokens, true);
    }

    private function upsertLine(
        CatalogFamily $family,
        array $config,
        array $data,
        array &$lineOrder,
        CatalogReferenceImportRun $run
    ): CatalogLine
    {
        $lineKey = $family->id.'|'.$config['line_slug'];
        $lineOrder[$lineKey] ??= count($lineOrder) + 10;

        $line = CatalogLine::query()->firstOrNew([
            'catalog_family_id' => $family->id,
            'slug' => $config['line_slug'],
        ]);

        return $this->persistTrackedModel($line, [
            'name' => $data['family_raw'],
            'intro_title' => $data['family_raw'],
            'intro_text' => $data['family_text'] ?: ($line->intro_text ?: 'Línea importada desde el Excel de referencia técnico-comercial.'),
            'sort_order' => $data['family_order'] ?: ($line->sort_order ?: ($config['sort_order'] ?? $lineOrder[$lineKey])),
            'is_active' => true,
        ], $run);
    }

    private function deactivateLegacyLines(
        array $importedLineSlugs,
        array $requestedTokens,
        CatalogReferenceImportRun $run
    ): void {
        if (! $this->isFullCatalogImport($requestedTokens)) {
            return;
        }

        foreach (self::LEGACY_LINE_REPLACEMENTS as $legacySlug => $replacementSlugs) {
            if (array_intersect($replacementSlugs, $importedLineSlugs) === []) {
                continue;
            }

            $legacyLine = CatalogLine::query()->where('slug', $legacySlug)->first();

            if (! $legacyLine) {
                continue;
            }

            $this->persistTrackedModel($legacyLine, [
                'is_active' => false,
            ], $run);

            $legacySeries = CatalogSeries::query()
                ->where('catalog_line_id', $legacyLine->id)
                ->get();

            foreach ($legacySeries as $series) {
                $this->persistTrackedModel($series, [
                    'is_active' => false,
                ], $run);
            }

            $legacyGrades = CatalogGrade::query()
                ->whereIn('catalog_series_id', $legacySeries->pluck('id'))
                ->get();

            foreach ($legacyGrades as $grade) {
                $this->persistTrackedModel($grade, [
                    'is_active' => false,
                ], $run);
            }

            $legacyMappings = CatalogMaterialMapping::query()
                ->where('catalog_line_id', $legacyLine->id)
                ->get();

            foreach ($legacyMappings as $mapping) {
                $this->persistTrackedModel($mapping, [
                    'is_active' => false,
                ], $run);
            }
        }
    }

    private function isNonMetallicFamily(string $normalizedFamily): bool
    {
        return Str::contains($normalizedFamily, self::NON_METALLIC_FAMILY_KEYWORDS);
    }

    private function upsertSeries(
        CatalogLine $line,
        array $data,
        array &$seriesOrder,
        CatalogReferenceImportRun $run
    ): CatalogSeries {
        $subfamily = $data['subfamily'];
        $slug = Str::slug($subfamily);

        $seriesOrder[$line->id] ??= [];
        $seriesOrder[$line->id][$slug] ??= count($seriesOrder[$line->id]) + 1;

        $series = CatalogSeries::query()->firstOrNew([
            'catalog_line_id' => $line->id,
            'slug' => $slug,
        ]);

        return $this->persistTrackedModel($series, [
            'name' => $subfamily,
            'intro_title' => $subfamily,
            'intro_text' => $data['subfamily_text'] ?: ($series->intro_text ?: 'Serie importada desde el Excel de referencia del catálogo.'),
            'sort_order' => $data['subfamily_order'] ?: ($series->sort_order ?: $seriesOrder[$line->id][$slug]),
            'is_active' => true,
        ], $run);
    }

    private function upsertGrade(
        CatalogSeries $series,
        array $data,
        array &$gradeOrder,
        CatalogReferenceImportRun $run
    ): CatalogGrade {
        $slug = $data['product_slug'] ?: Str::slug($data['product']);

        $gradeOrder[$series->id] ??= [];
        $gradeOrder[$series->id][$slug] ??= count($gradeOrder[$series->id]) + 1;

        $grade = CatalogGrade::query()->firstOrNew([
            'catalog_series_id' => $series->id,
            'slug' => $slug,
        ]);

        $attributes = [
            'name' => $data['product'],
            'short_title' => $data['product'],
            'intro_title' => $data['product'],
            'sort_order' => $data['product_order'] ?: ($grade->sort_order ?: $gradeOrder[$series->id][$slug]),
            'request_quote_enabled' => true,
            'show_in_calculator' => true,
            'is_active' => true,
        ];

        if ($data['copete']) {
            $attributes['intro_text'] = $data['copete'];
        }

        if ($data['density'] !== null) {
            $attributes['density_value'] = $data['density'];
            $attributes['density_unit'] = 'g/cm³';
        }

        if ($data['uns']) {
            $attributes['uns'] = $data['uns'];
        }

        return $this->persistTrackedModel($grade, $attributes, $run);
    }

    private function syncGradeContentSections(
        CatalogGrade $grade,
        array $data,
        CatalogReferenceImportRun $run
    ): void {
        $sections = $this->buildImportedGradeSections($data);
        $existing = GradeContentSection::query()
            ->where('catalog_grade_id', $grade->id)
            ->whereIn('section_key', ['excel-import-primary', 'excel-import-secondary', 'excel-import-notes'])
            ->get()
            ->keyBy('section_key');

        foreach ($sections as $index => $sectionData) {
            $section = $existing->get($sectionData['section_key']) ?? new GradeContentSection([
                'catalog_grade_id' => $grade->id,
                'section_key' => $sectionData['section_key'],
            ]);

            $this->persistTrackedModel($section, [
                'catalog_grade_id' => $grade->id,
                'section_key' => $sectionData['section_key'],
                'title' => $sectionData['title'],
                'content' => $sectionData['content'],
                'sort_order' => $index + 1,
                'is_active' => true,
            ], $run);
        }

        foreach ($existing as $sectionKey => $section) {
            if (collect($sections)->contains(fn (array $item) => $item['section_key'] === $sectionKey)) {
                continue;
            }

            $this->persistTrackedModel($section, [
                'is_active' => false,
            ], $run);
        }
    }

    private function syncMaterialMapping(
        CatalogFamily $family,
        CatalogLine $line,
        CatalogSeries $series,
        CatalogGrade $grade,
        array $data,
        CatalogReferenceImportRun $run
    ): void {
        $mapping = CatalogMaterialMapping::query()->firstOrNew([
            'external_material_id' => $data['material_id'],
        ]);

        $this->persistTrackedModel($mapping, [
            'raw_material_name' => $data['product'],
            'normalized_material_name' => $this->normalizer->normalizeText($data['product']),
            'catalog_family_id' => $family->id,
            'catalog_line_id' => $line->id,
            'catalog_series_id' => $series->id,
            'catalog_grade_id' => $grade->id,
            'is_active' => true,
            'notes' => $data['external_code']
                ? 'cod int: '.$data['external_code']
                : 'Importado desde Excel de referencia',
        ], $run);
    }

    private function syncNormas(
        CatalogGrade $grade,
        array $normaResolution,
        array &$nextSortOrderByGrade
    ): int
    {
        GradeStandard::query()
            ->where('catalog_grade_id', $grade->id)
            ->where('title', self::IMPORTED_STANDARD_TITLE)
            ->delete();

        $normaIds = $normaResolution['matched_ids'] ?? [];

        if ($normaIds === []) {
            return 0;
        }

        $existingNormaIds = $grade->normas()
            ->whereIn('catalog_normas.id', $normaIds)
            ->pluck('catalog_normas.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $existingLookup = array_fill_keys($existingNormaIds, true);
        $nextSortOrderByGrade[$grade->id] ??= $this->resolveNextNormaSortOrder($grade);
        $attach = [];

        foreach ($normaIds as $normaId) {
            if (isset($existingLookup[$normaId])) {
                continue;
            }

            $attach[$normaId] = [
                'sort_order' => $nextSortOrderByGrade[$grade->id],
            ];

            $nextSortOrderByGrade[$grade->id]++;
        }

        if ($attach !== []) {
            $grade->normas()->attach($attach);
        }

        return count($attach);
    }

    private function resolveNormaCodes(
        ?string $source,
        ?string $additionalStandards,
        array $normaLookup
    ): array {
        $codes = collect([
            ...($source ? $this->splitSourceCodes($source) : []),
            ...($additionalStandards ? $this->splitSourceCodes($additionalStandards) : []),
        ])->filter()->unique()->values()->all();

        if ($codes === []) {
            return [
                'codes' => [],
                'matched_ids' => [],
                'matched_codes' => [],
                'unmatched_codes' => [],
            ];
        }

        $matchedIds = [];
        $matchedCodes = [];
        $unmatchedCodes = [];

        foreach ($codes as $code) {
            $normaId = $this->resolveNormaIdFromCode($code, $normaLookup);

            if ($normaId) {
                $matchedIds[] = $normaId;
                $matchedCodes[] = $code;
            } else {
                $unmatchedCodes[] = $code;
            }
        }

        return [
            'codes' => $codes,
            'matched_ids' => array_values(array_unique($matchedIds)),
            'matched_codes' => array_values(array_unique($matchedCodes)),
            'unmatched_codes' => array_values(array_unique($unmatchedCodes)),
        ];
    }

    private function syncComposition(
        CatalogGrade $grade,
        array $data,
        array &$elementCache,
        CatalogReferenceImportRun $run
    ): int {
        CompositionProfile::query()
            ->where('catalog_grade_id', $grade->id)
            ->where('subtitle', self::IMPORTED_PROFILE_SUBTITLE)
            ->delete();

        if (! $data['include_composition'] || $data['elements'] === []) {
            return 0;
        }

        $items = $this->buildCompositionItems($data['elements'], $data['balance_symbol']);

        if ($items === []) {
            return 0;
        }

        $profile = $grade->compositionProfiles()->create([
            'title' => 'Composición química',
            'subtitle' => self::IMPORTED_PROFILE_SUBTITLE,
            'sort_order' => 1,
            'is_active' => true,
        ]);
        $this->recordChange($run, $profile, CatalogReferenceImportRecord::ACTION_CREATED);

        $standard = $profile->standards()->create([
            'label' => $data['source'] ?: 'Excel de referencia',
            'subtitle' => $data['uns'] ? 'UNS '.$data['uns'] : null,
            'sort_order' => 1,
            'is_active' => true,
        ]);
        $this->recordChange($run, $standard, CatalogReferenceImportRecord::ACTION_CREATED);

        foreach ($items as $index => $item) {
            $element = $this->resolveChemicalElement($item['symbol'], $elementCache, $run);

            $compositionItem = $standard->items()->create([
                'catalog_chemical_element_id' => $element->id,
                'display_label' => $item['symbol'],
                'min_percent' => $item['min'],
                'max_percent' => $item['max'],
                'nominal_percent' => $item['nominal'],
                'display_percent' => $item['display_percent'],
                'sort_order' => $index + 1,
                'display_row' => $item['display_row'],
                'is_balance' => $item['is_balance'] ?? false,
            ]);

            $this->recordChange($run, $compositionItem, CatalogReferenceImportRecord::ACTION_CREATED);
        }

        return 1;
    }

    private function buildCompositionItems(array $elements, ?string $balanceSymbol): array
    {
        $items = [];
        $sum = 0.0;
        $elementOrderMap = array_flip(self::EXCEL_ELEMENT_ORDER);

        foreach ($elements as $symbol => $range) {
            $displayPercent = $this->resolveDisplayPercent($range['min'], $range['max']);

            $items[$symbol] = [
                'symbol' => $symbol,
                'min' => $range['min'],
                'max' => $range['max'],
                'nominal' => $range['min'] !== null && $range['max'] !== null
                    ? round(($range['min'] + $range['max']) / 2, 4)
                    : ($range['min'] ?? $range['max']),
                'display_percent' => $displayPercent,
                'excel_order' => $elementOrderMap[$symbol] ?? 9999,
                'is_balance' => false,
            ];

            $sum += $displayPercent;
        }

        $balanceSymbol = $this->cleanString($balanceSymbol);

        if ($balanceSymbol) {
            $remainder = round(max(0, 100 - $sum), 4);

            if (isset($items[$balanceSymbol])) {
                $items[$balanceSymbol]['is_balance'] = true;

                $hasExplicitValue = $items[$balanceSymbol]['min'] !== null
                    || $items[$balanceSymbol]['max'] !== null
                    || $items[$balanceSymbol]['nominal'] !== null
                    || $items[$balanceSymbol]['display_percent'] > 0;

                if (! $hasExplicitValue && $remainder > 0) {
                    $items[$balanceSymbol]['display_percent'] = $remainder;
                }
            } elseif ($remainder > 0) {
                $items[$balanceSymbol] = [
                    'symbol' => $balanceSymbol,
                    'min' => null,
                    'max' => null,
                    'nominal' => $remainder,
                    'display_percent' => $remainder,
                    'excel_order' => 10000,
                    'is_balance' => true,
                ];
            }
        }

        foreach ($items as $symbol => &$item) {
            $item['display_row'] = $this->resolveDisplayRow(
                $symbol,
                $item['display_percent'],
                $balanceSymbol
            );
        }
        unset($item);

        return collect($items)
            ->sortBy([
                ['is_balance', 'asc'],
                ['excel_order', 'asc'],
                ['symbol', 'asc'],
            ])
            ->values()
            ->map(function (array $item): array {
                unset($item['excel_order']);

                return $item;
            })
            ->all();
    }

    private function resolveDisplayPercent(?float $min, ?float $max): float
    {
        if ($min !== null && $max !== null) {
            return round(($min + $max) / 2, 4);
        }

        if ($min !== null) {
            return round($min, 4);
        }

        if ($max !== null) {
            return round($max, 4);
        }

        return 0.0;
    }

    private function resolveDisplayRow(string $symbol, float $displayPercent, ?string $balanceSymbol): int
    {
        if ($balanceSymbol && $symbol === $balanceSymbol) {
            return 1;
        }

        if ($displayPercent >= 3) {
            return 1;
        }

        if ($displayPercent >= 0.5) {
            return 2;
        }

        return 3;
    }

    private function resolveChemicalElement(
        string $symbol,
        array &$elementCache,
        CatalogReferenceImportRun $run
    ): ChemicalElement {
        if (isset($elementCache[$symbol])) {
            return $elementCache[$symbol];
        }

        $meta = self::ELEMENT_META[$symbol] ?? [
            'name' => $symbol,
            'color' => $this->fallbackColorForSymbol($symbol),
            'base' => false,
        ];

        $element = ChemicalElement::query()->firstOrNew(['symbol' => $symbol]);

        $element = $this->persistTrackedModel($element, [
            'name' => $element->name ?: $meta['name'],
            'display_color' => $element->display_color ?: $meta['color'],
            'is_base_element' => $element->exists
                ? ($element->is_base_element || $meta['base'])
                : $meta['base'],
            'sort_order' => $element->sort_order ?: (count($elementCache) + 10),
        ], $run);

        return $elementCache[$symbol] = $element;
    }

    private function persistTrackedModel(Model $model, array $attributes, CatalogReferenceImportRun $run): Model
    {
        $isNew = ! $model->exists;

        $model->fill($attributes);

        if (! $isNew && ! $model->isDirty()) {
            return $model;
        }

        $originalAttributes = $isNew
            ? null
            : collect(array_keys($model->getDirty()))
                ->mapWithKeys(fn ($field) => [$field => $model->getOriginal($field)])
                ->all();

        $model->save();

        $this->recordChange(
            $run,
            $model,
            $isNew ? CatalogReferenceImportRecord::ACTION_CREATED : CatalogReferenceImportRecord::ACTION_UPDATED,
            $originalAttributes
        );

        return $model;
    }

    private function storeImportedRowSnapshot(
        CatalogReferenceImportRun $run,
        int $rowNumber,
        array $row,
        array $headingRow,
        array $data
    ): void {
        CatalogReferenceImportRow::query()->create([
            'catalog_reference_import_run_id' => $run->id,
            'row_number' => $rowNumber,
            'family_name' => $data['family_raw'],
            'subfamily_name' => $data['subfamily'],
            'product_name' => $data['product'],
            'row_payload' => $this->buildRawColumnsPayload($row, $headingRow),
        ]);
    }

    private function recordChange(
        CatalogReferenceImportRun $run,
        Model $model,
        string $action,
        ?array $originalAttributes = null
    ): void {
        $record = CatalogReferenceImportRecord::query()->firstOrNew([
            'catalog_reference_import_run_id' => $run->id,
            'model_type' => $model::class,
            'model_id' => $model->getKey(),
        ]);

        if ($record->exists && $record->action === CatalogReferenceImportRecord::ACTION_CREATED) {
            return;
        }

        $record->action = $record->action ?: $action;
        $record->original_attributes = $record->original_attributes ?: $originalAttributes;
        $record->save();
    }

    private function rollbackRecord(CatalogReferenceImportRecord $record): string
    {
        $modelClass = $record->model_type;

        if (! class_exists($modelClass)) {
            return 'skipped_records';
        }

        /** @var \Illuminate\Database\Eloquent\Model|null $model */
        $model = $modelClass::query()->find($record->model_id);

        if (! $model) {
            return 'skipped_records';
        }

        if ($record->action === CatalogReferenceImportRecord::ACTION_CREATED) {
            if ($model instanceof ChemicalElement && $model->compositionItems()->exists()) {
                return 'skipped_records';
            }

            $model->delete();

            return 'deleted_records';
        }

        if ($record->action === CatalogReferenceImportRecord::ACTION_UPDATED && $record->original_attributes) {
            $model->forceFill($record->original_attributes);
            $model->save();

            return 'restored_records';
        }

        return 'skipped_records';
    }

    private function buildRawColumnsPayload(array $row, array $headingRow): array
    {
        $payload = [];

        foreach ($headingRow as $index => $heading) {
            $payload[] = [
                'index' => $index + 1,
                'heading' => is_string($heading) && trim($heading) !== ''
                    ? trim($heading)
                    : 'COLUMN_'.($index + 1),
                'normalized_heading' => $this->normalizer->normalizeHeading((string) $heading),
                'value' => $row[$index] ?? null,
            ];
        }

        return $payload;
    }

    private function splitSourceCodes(string $source): array
    {
        $parts = preg_split('/\R+|\s+\/\s+|\s*;\s*/', $source) ?: [];

        return collect($parts)
            ->flatMap(fn ($value) => $this->expandSourceCodeChunk($this->cleanString($value)))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function expandSourceCodeChunk(?string $value): array
    {
        $value = $this->cleanString($value);

        if (! $value) {
            return [];
        }

        if (! str_contains($value, '/')) {
            return [$value];
        }

        if (! preg_match('/^(?<issuer>[A-Za-z\s]+)\s+(?<codes>[A-Za-z0-9.\-\/]+)(?<suffix>\s*\([^)]*\))?$/u', $value, $matches)) {
            return [$value];
        }

        $issuer = $this->cleanString($matches['issuer'] ?? null);
        $suffix = $this->cleanString($matches['suffix'] ?? null);
        $segments = array_values(array_filter(array_map(
            fn ($segment) => $this->cleanString($segment),
            explode('/', $matches['codes'] ?? '')
        )));

        if (! $issuer || count($segments) < 2) {
            return [$value];
        }

        $expanded = [];
        $lastPrefix = null;

        foreach ($segments as $segment) {
            if (preg_match('/^[A-Za-z.\-]+/u', $segment, $prefixMatch)) {
                $lastPrefix = $prefixMatch[0];
                $resolvedCode = $segment;
            } elseif ($lastPrefix) {
                $resolvedCode = $lastPrefix.$segment;
            } else {
                $resolvedCode = $segment;
            }

            $expanded[] = trim($issuer.' '.$resolvedCode.($suffix ? ' '.$suffix : ''));
        }

        return $expanded !== [] ? $expanded : [$value];
    }

    private function buildNormaLookup(): array
    {
        $pair = [];
        $pairCompact = [];
        $full = [];
        $issuers = [];
        $byCode = [];
        $byCodeCompact = [];

        CatalogNorma::query()
            ->select(['id', 'nombre_emisor', 'norma'])
            ->where('is_active', true)
            ->get()
            ->each(function (CatalogNorma $norma) use (&$pair, &$pairCompact, &$full, &$issuers, &$byCode, &$byCodeCompact): void {
                $issuer = $this->normalizer->normalizeText($norma->nombre_emisor);
                $code = $this->normalizer->normalizeText($norma->norma);
                $compactCode = $this->compactNormaCode($norma->norma);

                if (! $issuer || ! $code) {
                    return;
                }

                $pair[$issuer.'|'.$code] ??= (int) $norma->id;
                if ($compactCode) {
                    $pairCompact[$issuer.'|'.$compactCode] ??= (int) $norma->id;
                }
                $full[trim($issuer.' '.$code)] ??= (int) $norma->id;
                $issuers[$issuer] = $issuer;
                $byCode[$code] ??= [];
                $byCode[$code][] = (int) $norma->id;
                if ($compactCode) {
                    $byCodeCompact[$compactCode] ??= [];
                    $byCodeCompact[$compactCode][] = (int) $norma->id;
                }
            });

        uasort($issuers, fn (string $a, string $b) => strlen($b) <=> strlen($a));

        return [
            'pair' => $pair,
            'pair_compact' => $pairCompact,
            'full' => $full,
            'issuers' => array_values($issuers),
            'by_code' => $byCode,
            'by_code_compact' => $byCodeCompact,
        ];
    }

    private function resolveNormaIdFromCode(string $code, array $normaLookup): ?int
    {
        foreach ($this->buildNormaCodeCandidates($code) as $candidate) {
            $normalizedCode = $this->normalizer->normalizeText($candidate);

            if (! $normalizedCode) {
                continue;
            }

            if (isset($normaLookup['full'][$normalizedCode])) {
                return $normaLookup['full'][$normalizedCode];
            }

            foreach ($normaLookup['issuers'] as $issuer) {
                if (! str_starts_with($normalizedCode, $issuer.' ')) {
                    continue;
                }

                $normaCode = trim(substr($normalizedCode, strlen($issuer)));

                if ($normaCode === '') {
                    continue;
                }

                $pairKey = $issuer.'|'.$normaCode;

                if (isset($normaLookup['pair'][$pairKey])) {
                    return $normaLookup['pair'][$pairKey];
                }

                $compactPairKey = $issuer.'|'.$this->compactNormaCode($normaCode);

                if (isset($normaLookup['pair_compact'][$compactPairKey])) {
                    return $normaLookup['pair_compact'][$compactPairKey];
                }
            }

            $tokens = preg_split('/\s+/', $normalizedCode) ?: [];

            for ($index = 1; $index < count($tokens); $index++) {
                $suffix = implode(' ', array_slice($tokens, $index));
                $resolvedId = $this->resolveUniqueNormaIdByCode($suffix, $normaLookup);

                if ($resolvedId !== null) {
                    return $resolvedId;
                }
            }

            $resolvedId = $this->resolveUniqueNormaIdByCode($normalizedCode, $normaLookup);

            if ($resolvedId !== null) {
                return $resolvedId;
            }
        }

        return null;
    }

    private function resolveUniqueNormaIdByCode(string $code, array $normaLookup): ?int
    {
        $normalizedCode = $this->normalizer->normalizeText($code);

        if (! $normalizedCode) {
            return null;
        }

        $matches = array_values(array_unique($normaLookup['by_code'][$normalizedCode] ?? []));

        if (count($matches) === 1) {
            return $matches[0];
        }

        $compactCode = $this->compactNormaCode($code);

        if (! $compactCode) {
            return null;
        }

        $matches = array_values(array_unique($normaLookup['by_code_compact'][$compactCode] ?? []));

        return count($matches) === 1 ? $matches[0] : null;
    }

    private function buildNormaCodeCandidates(string $code): array
    {
        $raw = $this->cleanString($code);

        if (! $raw) {
            return [];
        }

        $withoutParentheses = trim((string) preg_replace('/\s*\([^)]*\)/u', '', $raw));
        $withoutBrackets = trim((string) preg_replace('/\s*\[[^\]]*\]/u', '', $withoutParentheses));

        return collect([
            $raw,
            $withoutParentheses,
            $withoutBrackets,
        ])->map(fn ($value) => $this->cleanString($value))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function compactNormaCode(?string $code): ?string
    {
        $normalized = $this->normalizer->normalizeText($code);

        if (! $normalized) {
            return null;
        }

        $compact = preg_replace('/[^a-z0-9]+/u', '', $normalized);

        return $compact !== '' ? $compact : null;
    }

    private function resolveNextNormaSortOrder(CatalogGrade $grade): int
    {
        return ((int) DB::table('catalog_grade_norma')
            ->where('catalog_grade_id', $grade->id)
            ->max('sort_order')) + 1;
    }

    private function buildImportedGradeSections(array $data): array
    {
        $primaryTitle = null;
        $primaryContent = $this->cleanString($data['text_1'] ?? null);

        $secondaryTitle = $this->cleanString($data['title_2'] ?? null);
        $secondaryContent = $this->cleanString($data['text_2'] ?? null)
            ?: $this->cleanString($data['text_2_body'] ?? null);

        if ($secondaryTitle && ! $secondaryContent) {
            $secondaryContent = $this->cleanString($data['comments'] ?? null);
        }

        $comments = $this->cleanString($data['comments'] ?? null);

        $sections = [];

        if ($primaryTitle || $primaryContent) {
            $sections[] = [
                'section_key' => 'excel-import-primary',
                'title' => $primaryTitle,
                'content' => $primaryContent,
            ];
        }

        if ($secondaryTitle || $secondaryContent) {
            $sections[] = [
                'section_key' => 'excel-import-secondary',
                'title' => $secondaryTitle,
                'content' => $secondaryContent,
            ];
        }

        if ($comments && $comments !== $secondaryContent) {
            $sections[] = [
                'section_key' => 'excel-import-notes',
                'title' => null,
                'content' => $comments,
            ];
        }

        return $sections;
    }

    private function resolveGradeFromImportedRow(CatalogReferenceImportRow $row): ?CatalogGrade
    {
        $familyConfig = $this->resolveFamilyConfig($row->family_name ?? '');

        if (! $familyConfig) {
            return null;
        }

        $lineSlug = $familyConfig['line_slug'] ?? null;
        $seriesSlug = Str::slug((string) ($row->subfamily_name ?? ''));
        $gradeSlug = Str::slug((string) ($row->product_name ?? ''));

        if (! $lineSlug || $seriesSlug === '' || $gradeSlug === '') {
            return null;
        }

        return CatalogGrade::query()
            ->where('slug', $gradeSlug)
            ->where('is_active', true)
            ->whereHas('series', fn ($seriesQuery) => $seriesQuery
                ->where('slug', $seriesSlug)
                ->where('is_active', true)
                ->whereHas('line', fn ($lineQuery) => $lineQuery
                    ->where('slug', $lineSlug)
                    ->where('is_active', true)))
            ->first();
    }

    private function fallbackColorForSymbol(string $symbol): string
    {
        $palette = ['#2563EB', '#0891B2', '#16A34A', '#CA8A04', '#DC2626', '#9333EA', '#EA580C', '#475569'];
        $index = crc32($symbol) % count($palette);

        return $palette[$index];
    }

    private function resolveCompositionSkipReason(array $data): ?string
    {
        if (! $data['include_composition']) {
            return 'El Excel indica que la composición química no debe publicarse para este grado.';
        }

        if ($data['elements'] === []) {
            return 'No se encontraron columnas de composición química con valores cargados.';
        }

        if ($this->buildCompositionItems($data['elements'], $data['balance_symbol']) === []) {
            return 'No se pudo construir una composición química válida con los datos de la fila.';
        }

        return null;
    }

    private function pushDiagnosticSample(array &$samples, array $sample): void
    {
        if (count($samples) >= self::DIAGNOSTIC_SAMPLE_LIMIT) {
            return;
        }

        $samples[] = $sample;
    }

    private function pushUniquePreviewSample(array &$summary, string $bucket, string $key, array $sample): void
    {
        $keysBucket = $bucket.'_keys';

        $summary[$keysBucket] ??= [];

        if (isset($summary[$keysBucket][$key])) {
            return;
        }

        $summary[$keysBucket][$key] = true;
        $summary[$bucket][] = $sample;
        $summary[$bucket.'_count'] = count($summary[$keysBucket]);
    }

    private function cleanString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $cleaned = trim(preg_replace('/\s+/', ' ', (string) $value) ?? '');

        return $cleaned !== '' ? $cleaned : null;
    }
}
