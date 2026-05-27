<?php

namespace Tests\Feature;

use App\Models\FooterSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class FooterSettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_footer_settings_screen(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        FooterSetting::query()->create([
            'phone_primary' => '(54 11) 5032 0033',
            'phone_secondary' => '(54 9 11) 1234-5678',
            'contact_hours' => 'Lu a Vi de 09:00 - 18:00 hs',
            'email_primary' => 'informes@cordes.ar',
            'contact_address' => 'Palpa 3551, CABA',
            'copyright_text' => '© Copyright 2026 Roberto Cordes SA. Todos los derechos reservados',
            'whatsapp_url' => 'https://wa.me/5491100000000',
        ]);

        $this->actingAs($user)
            ->get(route('admin.footer.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/FooterSettings/Index')
                ->where('footerSettings.phone_primary', '(54 11) 5032 0033')
                ->where('footerSettings.phone_secondary', '(54 9 11) 1234-5678')
                ->where('footerSettings.contact_hours', 'Lu a Vi de 09:00 - 18:00 hs')
                ->where('footerSettings.email_primary', 'informes@cordes.ar')
            );
    }

    public function test_admin_can_update_footer_settings_without_touching_floating_whatsapp_url(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        FooterSetting::query()->create([
            'whatsapp_url' => 'https://wa.me/5491100000000',
        ]);

        $response = $this->actingAs($user)->putJson(route('admin.api.footer-settings.update'), [
            'phone_primary' => '(54 11) 5032 0033',
            'phone_secondary' => '(54 9 11) 1234-5678',
            'contact_hours' => 'Lu a Vi de 09:00 - 18:00 hs',
            'email_primary' => 'informes@cordes.ar',
            'contact_address' => 'Palpa 3551, CABA',
            'copyright_text' => '© Copyright 2026 Roberto Cordes SA. Todos los derechos reservados',
        ]);

        $response->assertOk()->assertJson([
            'ok' => true,
            'phone_primary' => '(54 11) 5032 0033',
            'phone_secondary' => '(54 9 11) 1234-5678',
            'contact_hours' => 'Lu a Vi de 09:00 - 18:00 hs',
            'email_primary' => 'informes@cordes.ar',
            'contact_address' => 'Palpa 3551, CABA',
            'copyright_text' => '© Copyright 2026 Roberto Cordes SA. Todos los derechos reservados',
            'whatsapp_url' => 'https://wa.me/5491100000000',
        ]);

        $this->assertDatabaseHas('footer_settings', [
            'phone_primary' => '(54 11) 5032 0033',
            'phone_secondary' => '(54 9 11) 1234-5678',
            'contact_hours' => 'Lu a Vi de 09:00 - 18:00 hs',
            'email_primary' => 'informes@cordes.ar',
            'contact_address' => 'Palpa 3551, CABA',
            'copyright_text' => '© Copyright 2026 Roberto Cordes SA. Todos los derechos reservados',
            'whatsapp_url' => 'https://wa.me/5491100000000',
        ]);
    }
}
