<?php

namespace Tests\Feature;

use App\Models\FooterSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class WhatsAppFloatingControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_whatsapp_floating_screen(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        FooterSetting::query()->create([
            'whatsapp_url' => 'https://wa.me/5491112345678',
            'phone_secondary' => '(54 9 11) 7654-3210',
        ]);

        $this->actingAs($user)
            ->get(route('admin.whatsapp.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/WhatsApp/Index')
                ->where('whatsappNumber', '5491112345678')
            );
    }

    public function test_admin_can_update_only_whatsapp_floating_url(): void
    {
        $user = User::factory()->create([
            'can_access_admin' => true,
        ]);

        FooterSetting::query()->create([
            'phone_secondary' => '(54 9 11) 7654-3210',
            'contact_hours' => 'Lu a Vi de 09:00 - 18:00 hs',
        ]);

        $response = $this->actingAs($user)->putJson(route('admin.api.footer-settings.whatsapp.update'), [
            'whatsapp_number' => '5491112345678',
        ]);

        $response->assertOk()->assertJson([
            'ok' => true,
            'whatsapp_number' => '5491112345678',
            'whatsapp_url' => 'https://wa.me/5491112345678',
        ]);

        $this->assertDatabaseHas('footer_settings', [
            'phone_secondary' => '(54 9 11) 7654-3210',
            'contact_hours' => 'Lu a Vi de 09:00 - 18:00 hs',
            'whatsapp_url' => 'https://wa.me/5491112345678',
        ]);
    }
}
