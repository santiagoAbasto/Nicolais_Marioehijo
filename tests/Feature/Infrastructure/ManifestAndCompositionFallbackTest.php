<?php

namespace Tests\Feature\Infrastructure;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\ChemicalElement;
use App\Models\Catalog\CompositionProfile;
use App\Models\Catalog\CompositionStandard;
use App\Models\Catalog\CompositionStandardItem;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ManifestAndCompositionFallbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_manifest_route_returns_success(): void
    {
        $response = $this->get(route('web.manifest'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/manifest+json');
    }

    public function test_admin_composition_page_still_loads_if_is_base_element_column_is_missing(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        ChemicalElement::query()->create([
            'symbol' => 'Ti',
            'name' => 'Titanio',
            'display_color' => '#25A7CA',
            'is_base_element' => true,
            'sort_order' => 1,
        ]);

        Schema::table('catalog_chemical_elements', function (Blueprint $table): void {
            $table->dropColumn('is_base_element');
        });

        $response = $this->actingAs($user)->get(route('admin.products.composition'));

        $response->assertOk();
    }

    public function test_admin_composition_page_still_loads_when_item_table_has_no_is_active_column(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        $family = CatalogFamily::query()->create([
            'name' => 'Metales',
            'slug' => 'metales',
            'is_active' => true,
        ]);

        $line = CatalogLine::query()->create([
            'catalog_family_id' => $family->id,
            'name' => 'Titanio',
            'slug' => 'titanio',
            'is_active' => true,
        ]);

        $element = ChemicalElement::query()->create([
            'symbol' => 'Ti',
            'name' => 'Titanio',
            'display_color' => '#25A7CA',
            'is_base_element' => true,
            'sort_order' => 1,
        ]);

        $profile = CompositionProfile::query()->create([
            'catalog_line_id' => $line->id,
            'title' => 'Perfil Titanio',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $standard = CompositionStandard::query()->create([
            'catalog_composition_profile_id' => $profile->id,
            'label' => 'ASTM B265',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        CompositionStandardItem::query()->create([
            'catalog_composition_standard_id' => $standard->id,
            'catalog_chemical_element_id' => $element->id,
            'display_label' => 'Ti',
            'display_percent' => 99.5,
            'sort_order' => 1,
            'display_row' => 1,
            'is_balance' => false,
        ]);

        $response = $this->actingAs($user)->get(route('admin.products.composition'));

        $response->assertOk();
    }
}
