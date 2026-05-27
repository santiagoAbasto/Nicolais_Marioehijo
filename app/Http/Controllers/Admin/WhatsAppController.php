<?php

namespace App\Http\Controllers\Admin;

use App\Models\FooterSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppController extends AdminPlaceholderController
{
    public function index(): Response
    {
        $settings = $this->settings();

        return Inertia::render('Admin/WhatsApp/Index', [
            'whatsappNumber' => $this->numberFromUrl($settings->whatsapp_url),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'whatsapp_number' => ['nullable', 'string', 'max:32'],
        ]);

        $number = preg_replace('/\D+/', '', (string) ($data['whatsapp_number'] ?? ''));
        $url = $number !== '' ? "https://wa.me/{$number}" : null;

        $settings = $this->settings();
        $settings->forceFill(['whatsapp_url' => $url])->save();

        return response()->json([
            'ok' => true,
            'whatsapp_number' => $number ?: null,
            'whatsapp_url' => $url,
        ]);
    }

    protected function settings(): FooterSetting
    {
        return FooterSetting::query()->firstOrCreate(['id' => 1]);
    }

    protected function numberFromUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH) ?: $url;
        $number = preg_replace('/\D+/', '', $path);

        return $number !== '' ? $number : null;
    }
}
