<?php

namespace App\Http\Controllers\Admin;

use App\Models\FooterContactItem;
use App\Models\FooterSetting;
use App\Support\SortOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FooterSettingsController extends AdminPlaceholderController
{
    public function index(): Response
    {
        return Inertia::render('Admin/FooterSettings/Index', [
            'footerSettings' => $this->settings()->only([
                'phone_primary',
                'phone_secondary',
                'phone_tertiary',
                'contact_hours',
                'email_primary',
                'email_secondary',
                'contact_address',
                'copyright_text',
            ]),
            'contactItems' => FooterContactItem::query()
                ->orderBy('sort_order')
                ->get(['id', 'type', 'label', 'value', 'is_active'])
                ->values(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone_primary' => ['nullable', 'string', 'max:80'],
            'phone_secondary' => ['nullable', 'string', 'max:80'],
            'phone_tertiary' => ['nullable', 'string', 'max:80'],
            'contact_hours' => ['nullable', 'string', 'max:120'],
            'email_primary' => ['nullable', 'email', 'max:160'],
            'email_secondary' => ['nullable', 'email', 'max:160'],
            'contact_address' => ['nullable', 'string', 'max:500'],
            'copyright_text' => ['nullable', 'string', 'max:240'],
        ]);

        $settings = $this->settings();
        $settings->fill($data)->save();

        return response()->json([
            'ok' => true,
            ...$settings->only(array_keys($data)),
            'whatsapp_url' => $settings->whatsapp_url,
        ]);
    }

    public function storeContactItem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:whatsapp,phone,email'],
            'label' => ['nullable', 'string', 'max:80'],
            'value' => ['required', 'string', 'max:180'],
        ]);

        $item = FooterContactItem::query()->create([
            'type' => $data['type'],
            'label' => $data['label'] ?? null,
            'value' => $data['value'],
            'sort_order' => SortOrder::next(FooterContactItem::query()->pluck('sort_order')),
            'is_active' => true,
        ]);

        return response()->json([
            'ok' => true,
            'item' => $item->only(['id', 'type', 'label', 'value', 'is_active']),
        ], 201);
    }

    public function updateContactItem(Request $request, FooterContactItem $footerContactItem): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:whatsapp,phone,email'],
            'label' => ['nullable', 'string', 'max:80'],
            'value' => ['required', 'string', 'max:180'],
            'is_active' => ['boolean'],
        ]);

        $footerContactItem->fill([
            'type' => $data['type'],
            'label' => $data['label'] ?? null,
            'value' => $data['value'],
            'is_active' => (bool) ($data['is_active'] ?? true),
        ])->save();

        return response()->json([
            'ok' => true,
            'item' => $footerContactItem->fresh()->only(['id', 'type', 'label', 'value', 'is_active']),
        ]);
    }

    protected function settings(): FooterSetting
    {
        return FooterSetting::query()->firstOrCreate(['id' => 1]);
    }
}
