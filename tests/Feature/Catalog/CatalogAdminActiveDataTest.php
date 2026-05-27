<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogNorma;
use App\Models\Catalog\CatalogSeries;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class CatalogAdminActiveDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_taxonomy_index_only_shows_active_catalog_tree(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        [$activeFamily] = $this->seedCatalogTree();

        $this->actingAs($user)
            ->get('/admin/productos/taxonomia')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Catalog/Taxonomy/Index')
                ->where('families', fn ($families) => count($families) === 1)
                ->where('families.0.name', $activeFamily->name)
                ->where('families.0.lines', fn ($lines) => count($lines) === 1)
                ->where('families.0.lines.0.name', 'Aceros aleados y especiales')
            );
    }

    public function test_technical_content_only_uses_active_catalog_and_active_normas(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        [$activeFamily] = $this->seedCatalogTree();

        CatalogNorma::query()->create([
            'nombre_emisor' => 'ISO',
            'norma' => '5832-3',
            'descripcion_corta' => 'Norma activa',
            'is_active' => true,
        ]);

        CatalogNorma::query()->create([
            'nombre_emisor' => 'ASTM',
            'norma' => 'B265',
            'descripcion_corta' => 'Norma vieja',
            'is_active' => false,
        ]);

        $this->actingAs($user)
            ->get('/admin/productos/contenido-tecnico')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Catalog/TechnicalContent')
                ->where('families', fn ($families) => count($families) === 1)
                ->where('families.0.name', $activeFamily->name)
                ->where('families.0.lines', fn ($lines) => count($lines) === 1)
                ->where('families.0.lines.0.series', fn ($series) => count($series) === 1)
                ->where('families.0.lines.0.series.0.grades', fn ($grades) => count($grades) === 1)
                ->where('catalogNormas', fn ($normas) => count($normas) === 1)
                ->where('catalogNormas.0.norma', '5832-3')
            );
    }

    public function test_composition_index_only_shows_active_catalog_tree(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        [$activeFamily] = $this->seedCatalogTree();

        $this->actingAs($user)
            ->get('/admin/productos/composicion-quimica')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Catalog/Composition')
                ->where('families', fn ($families) => count($families) === 1)
                ->where('families.0.name', $activeFamily->name)
                ->where('families.0.lines', fn ($lines) => count($lines) === 1)
                ->where('families.0.lines.0.series', fn ($series) => count($series) === 1)
                ->where('families.0.lines.0.series.0.grades', fn ($grades) => count($grades) === 1)
            );
    }

    /**
     * @return array{0: CatalogFamily, 1: CatalogLine, 2: CatalogSeries, 3: CatalogGrade}
     */
    private function seedCatalogTree(): array
    {
        $activeFamily = CatalogFamily::query()->create([
            'name' => 'Metálicos',
            'slug' => 'metalicos',
            'is_active' => true,
        ]);

        $activeLine = CatalogLine::query()->create([
            'catalog_family_id' => $activeFamily->id,
            'name' => 'Aceros aleados y especiales',
            'slug' => 'aceros-aleados-y-especiales',
            'is_active' => true,
        ]);

        $activeSeries = CatalogSeries::query()->create([
            'catalog_line_id' => $activeLine->id,
            'name' => 'Acero baja temperatura',
            'slug' => 'acero-baja-temperatura',
            'is_active' => true,
        ]);

        $activeGrade = CatalogGrade::query()->create([
            'catalog_series_id' => $activeSeries->id,
            'name' => 'Acero ASTM A333 Gr.3',
            'slug' => 'acero-astm-a333-gr3',
            'density_value' => 7.85,
            'density_unit' => 'g/cm3',
            'is_active' => true,
        ]);

        $inactiveFamily = CatalogFamily::query()->create([
            'name' => 'Metálicos legacy',
            'slug' => 'metalicos-legacy',
            'is_active' => false,
        ]);

        $inactiveLine = CatalogLine::query()->create([
            'catalog_family_id' => $inactiveFamily->id,
            'name' => 'Aceros',
            'slug' => 'aceros',
            'is_active' => false,
        ]);

        $inactiveSeries = CatalogSeries::query()->create([
            'catalog_line_id' => $inactiveLine->id,
            'name' => 'Acero baja temperatura legacy',
            'slug' => 'acero-baja-temperatura-legacy',
            'is_active' => false,
        ]);

        CatalogGrade::query()->create([
            'catalog_series_id' => $inactiveSeries->id,
            'name' => 'Acero ASTM A333 Gr.3 legacy',
            'slug' => 'acero-astm-a333-gr3-legacy',
            'density_value' => 7.85,
            'density_unit' => 'g/cm3',
            'is_active' => false,
        ]);

        return [$activeFamily, $activeLine, $activeSeries, $activeGrade];
    }
}
