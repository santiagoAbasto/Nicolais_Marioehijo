<?php

namespace App\Services;

use App\Models\WeightCalculatorMaterial;
use App\Models\WeightCalculatorPipeStandard;
use App\Models\WeightCalculatorShape;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class WeightCalculatorImportService
{
    public function syncDefaultShapes(): int
    {
        $count = 0;

        foreach ($this->defaultShapes() as $shape) {
            WeightCalculatorShape::query()->updateOrCreate(
                ['key' => $shape['key']],
                [
                    'name' => $shape['name'],
                    'fields_json' => $shape['fields_json'],
                    'formula_expression' => $shape['formula_expression'],
                    'formula_label' => 'Volumen (cm3)',
                    'uses_pipe' => $shape['uses_pipe'] ?? false,
                    'sort_order' => $shape['sort_order'],
                    'is_active' => true,
                ]
            );

            $count++;
        }

        return $count;
    }

    public function import(?string $materialsPath = null, ?string $pipesPath = null): array
    {
        $summary = [
            'materials' => 0,
            'pipe_standards' => 0,
        ];

        DB::transaction(function () use ($materialsPath, $pipesPath, &$summary): void {
            if ($materialsPath) {
                $summary['materials'] = $this->importMaterials($materialsPath);
            }

            if ($pipesPath) {
                $summary['pipe_standards'] = $this->importPipeStandards($pipesPath);
            }
        });

        return $summary;
    }

    public function importUploaded(?UploadedFile $materialsFile, ?UploadedFile $pipesFile): array
    {
        if (! $materialsFile && ! $pipesFile) {
            throw new RuntimeException('Subí al menos un archivo para importar.');
        }

        return $this->import(
            materialsPath: $materialsFile?->getRealPath() ?: null,
            pipesPath: $pipesFile?->getRealPath() ?: null,
        );
    }

    private function importMaterials(string $path): int
    {
        $rows = $this->readTabFile($path);
        if (count($rows) <= 1) {
            return 0;
        }

        WeightCalculatorMaterial::query()->delete();

        $count = 0;
        foreach (array_slice($rows, 1) as $index => $row) {
            $name = trim((string) ($row[0] ?? ''));
            $densityKgM3 = $this->number($row[1] ?? null);

            if ($name === '' || $densityKgM3 <= 0) {
                continue;
            }

            WeightCalculatorMaterial::query()->create([
                'name' => $name,
                'density_kg_m3' => $densityKgM3,
                'density_g_cm3' => $densityKgM3 / 1000,
                'uns' => $this->nullable($row[2] ?? null),
                'w_nr' => $this->nullable($row[3] ?? null),
                'sort_order' => $index + 1,
                'is_active' => true,
            ]);

            $count++;
        }

        return $count;
    }

    private function importPipeStandards(string $path): int
    {
        $rows = $this->readTabFile($path);
        if (count($rows) <= 1) {
            return 0;
        }

        WeightCalculatorPipeStandard::query()->delete();

        $count = 0;
        foreach (array_slice($rows, 1) as $row) {
            $orderIndex = (int) $this->number($row[0] ?? 0);
            $name = trim((string) ($row[1] ?? ''));
            $diameterThousandIn = $this->number($row[2] ?? null);
            $wallHundredthMm = $this->number($row[6] ?? null);
            $aliases = collect([$row[3] ?? null, $row[4] ?? null, $row[5] ?? null])
                ->map(fn ($value) => trim((string) $value))
                ->filter()
                ->unique()
                ->values()
                ->all();

            if ($name === '' || $diameterThousandIn <= 0 || $wallHundredthMm <= 0 || $aliases === []) {
                continue;
            }

            $diameterIn = $diameterThousandIn / 1000;
            $wallMm = $wallHundredthMm / 100;
            $wallIn = $wallMm / 25.4;

            WeightCalculatorPipeStandard::query()->create([
                'order_index' => $orderIndex,
                'name' => $this->formatPipeName($name),
                'diameter_in' => $diameterIn,
                'diameter_mm' => $diameterIn * 25.4,
                'schedule_label' => $aliases[0],
                'schedule_aliases' => $aliases,
                'wall_in' => $wallIn,
                'wall_mm' => $wallMm,
                'is_active' => true,
            ]);

            $count++;
        }

        return $count;
    }

    private function readTabFile(string $path): array
    {
        if (! is_file($path)) {
            throw new RuntimeException("No se encontró el archivo: {$path}");
        }

        $content = file_get_contents($path);
        if ($content === false) {
            throw new RuntimeException("No se pudo leer el archivo: {$path}");
        }

        if (function_exists('mb_check_encoding') && ! mb_check_encoding($content, 'UTF-8')) {
            if (function_exists('mb_convert_encoding')) {
                $content = mb_convert_encoding($content, 'UTF-8', 'ISO-8859-1');
            } elseif (function_exists('iconv')) {
                $content = iconv('ISO-8859-1', 'UTF-8//IGNORE', $content) ?: $content;
            }
        }

        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content) ?? $content;

        return collect(preg_split('/\R/', $content) ?: [])
            ->map(fn ($line) => str_getcsv($line, "\t"))
            ->filter(fn ($row) => collect($row)->filter(fn ($value) => trim((string) $value) !== '')->isNotEmpty())
            ->values()
            ->all();
    }

    private function number(mixed $value): float
    {
        $value = trim((string) $value);
        if ($value === '') {
            return 0.0;
        }

        return (float) str_replace(',', '.', $value);
    }

    private function nullable(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function formatPipeName(string $value): string
    {
        return preg_replace('/(?<=\d)p\b/u', '"', $value) ?? $value;
    }

    private function defaultShapes(): array
    {
        return [
            [
                'key' => 'round_bar',
                'name' => 'Barra redonda',
                'fields_json' => [
                    ['key' => 'diameter', 'label' => 'Diámetro'],
                    ['key' => 'length', 'label' => 'Largo'],
                ],
                'formula_expression' => '(pi * pow(diameter, 2) / 4 * length) / 1000',
                'sort_order' => 1,
            ],
            [
                'key' => 'square_bar',
                'name' => 'Barra cuadrada',
                'fields_json' => [
                    ['key' => 'side', 'label' => 'Lado'],
                    ['key' => 'length', 'label' => 'Largo'],
                ],
                'formula_expression' => '(pow(side, 2) * length) / 1000',
                'sort_order' => 2,
            ],
            [
                'key' => 'rectangular_bar',
                'name' => 'Barra rectangular',
                'fields_json' => [
                    ['key' => 'width', 'label' => 'Ancho'],
                    ['key' => 'height', 'label' => 'Espesor'],
                    ['key' => 'length', 'label' => 'Largo'],
                ],
                'formula_expression' => '(width * height * length) / 1000',
                'sort_order' => 3,
            ],
            [
                'key' => 'sheet',
                'name' => 'Chapa / Planchuela',
                'fields_json' => [
                    ['key' => 'width', 'label' => 'Ancho'],
                    ['key' => 'height', 'label' => 'Espesor'],
                    ['key' => 'length', 'label' => 'Largo'],
                ],
                'formula_expression' => '(width * height * length) / 1000',
                'sort_order' => 4,
            ],
            [
                'key' => 'disc',
                'name' => 'Disco',
                'fields_json' => [
                    ['key' => 'diameter', 'label' => 'Diámetro'],
                    ['key' => 'height', 'label' => 'Espesor'],
                ],
                'formula_expression' => '(pi * pow(diameter, 2) / 4 * height) / 1000',
                'sort_order' => 5,
            ],
            [
                'key' => 'ring',
                'name' => 'Aro / Anillo',
                'fields_json' => [
                    ['key' => 'outer', 'label' => 'Diámetro exterior'],
                    ['key' => 'inner', 'label' => 'Diámetro interior'],
                    ['key' => 'height', 'label' => 'Espesor'],
                ],
                'formula_expression' => '(pi * (pow(outer, 2) - pow(inner, 2)) / 4 * height) / 1000',
                'sort_order' => 6,
            ],
            [
                'key' => 'tube',
                'name' => 'Tubo',
                'fields_json' => [
                    ['key' => 'outer', 'label' => 'Diámetro exterior'],
                    ['key' => 'wall', 'label' => 'Espesor de pared'],
                    ['key' => 'length', 'label' => 'Largo'],
                ],
                'formula_expression' => '(pi * wall * (outer - wall) * length) / 1000',
                'sort_order' => 7,
            ],
            [
                'key' => 'standard_pipe',
                'name' => 'Caño estándar',
                'fields_json' => [
                    ['key' => 'length', 'label' => 'Largo'],
                ],
                'formula_expression' => '(pi * wall * (outer - wall) * length) / 1000',
                'uses_pipe' => true,
                'sort_order' => 8,
            ],
            [
                'key' => 'hex_bar',
                'name' => 'Barra hexagonal',
                'fields_json' => [
                    ['key' => 'across', 'label' => 'Distancia entre caras'],
                    ['key' => 'length', 'label' => 'Largo'],
                ],
                'formula_expression' => '(1.5 * 0.57735 * pow(across, 2) * length) / 1000',
                'sort_order' => 9,
            ],
            [
                'key' => 'oct_bar',
                'name' => 'Barra octogonal',
                'fields_json' => [
                    ['key' => 'across', 'label' => 'Distancia entre caras'],
                    ['key' => 'length', 'label' => 'Largo'],
                ],
                'formula_expression' => '(2 * 0.41421356 * pow(across, 2) * length) / 1000',
                'sort_order' => 10,
            ],
            [
                'key' => 'sphere',
                'name' => 'Esfera',
                'fields_json' => [
                    ['key' => 'diameter', 'label' => 'Diámetro'],
                ],
                'formula_expression' => '(pi * pow(diameter, 3) / 6) / 1000',
                'sort_order' => 11,
            ],
            [
                'key' => 'wire',
                'name' => 'Alambre',
                'fields_json' => [
                    ['key' => 'diameter', 'label' => 'Diámetro'],
                    ['key' => 'length', 'label' => 'Largo'],
                ],
                'formula_expression' => '(pi * pow(diameter, 2) / 4 * length) / 1000',
                'sort_order' => 12,
            ],
        ];
    }
}
