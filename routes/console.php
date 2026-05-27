<?php

use App\Services\Catalog\Imports\CatalogReferenceWorkbookImportService;
use App\Services\WeightCalculatorImportService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('catalog:import-reference {path : Ruta del Excel de referencia} {--families= : Familias a importar separadas por coma. Vacío importa todo el Excel}', function (CatalogReferenceWorkbookImportService $service): void {
    $families = collect(explode(',', (string) $this->option('families')))
        ->map(fn (string $value) => trim($value))
        ->filter()
        ->values()
        ->all();

    $summary = $service->import(
        path: (string) $this->argument('path'),
        families: $families,
    );

    $this->table(['Métrica', 'Valor'], [
        ['Filas procesadas', $summary['processed_rows']],
        ['Líneas importadas', $summary['lines']],
        ['Series importadas', $summary['series']],
        ['Grados importados', $summary['grades']],
        ['Perfiles de composición', $summary['composition_profiles']],
        ['Mappings de material', $summary['material_mappings']],
        ['Filas omitidas', $summary['skipped_rows']],
    ]);
})->purpose('Importa al catálogo el Excel ancho de referencia técnico-comercial.');

Artisan::command('calculator:import-data {materials? : Ruta de inicio.txt} {pipes? : Ruta de inicio2.txt}', function (WeightCalculatorImportService $service): void {
    $summary = $service->import(
        materialsPath: $this->argument('materials') ?: null,
        pipesPath: $this->argument('pipes') ?: null,
    );
    $shapes = $service->syncDefaultShapes();

    $this->table(['Métrica', 'Valor'], [
        ['Materiales', $summary['materials']],
        ['Caños estándar', $summary['pipe_standards']],
        ['Fórmulas de volumen', $shapes],
    ]);
})->purpose('Importa los TXT base de la calculadora de pesos.');

Artisan::command('calculator:sync-shapes', function (WeightCalculatorImportService $service): void {
    $this->info('Fórmulas sincronizadas: '.$service->syncDefaultShapes());
})->purpose('Sincroniza las fórmulas base de Volumen (cm3) para la calculadora.');
