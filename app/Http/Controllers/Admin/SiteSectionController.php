<?php

namespace App\Http\Controllers\Admin;

use App\Models\SiteSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteSectionController extends AdminPlaceholderController
{
    public function update(Request $request, SiteSection $siteSection): JsonResponse
    {
        $data = $request->validate([
            'page_key' => ['required', 'string', 'max:50'],
            'section_key' => ['required', 'string', 'max:100'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'media_id' => ['nullable', 'exists:media_assets,id'],
            'secondary_media_id' => ['nullable', 'exists:media_assets,id'],
            'button_text' => ['nullable', 'string', 'max:255'],
            'button_url' => ['nullable', 'string', 'max:255'],
            'meta_json' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'field_values' => ['nullable', 'array'],
            'items' => ['nullable', 'array'],
        ]);

        $siteSection->update([
            'page_key' => $data['page_key'],
            'section_key' => $data['section_key'],
            'title' => cms_plain_text($data['title'] ?? null),
            'subtitle' => cms_plain_text($data['subtitle'] ?? null),
            'description' => cms_rich_text($data['description'] ?? null),
            'media_id' => $data['media_id'] ?? null,
            'secondary_media_id' => $data['secondary_media_id'] ?? null,
            'button_text' => cms_plain_text($data['button_text'] ?? null),
            'button_url' => cms_plain_text($data['button_url'] ?? null),
            'meta_json' => $data['meta_json'] ?? null,
            'sort_order' => trim((string) ($data['sort_order'] ?? '')) ?: 'A',
            'is_active' => (bool) ($data['is_active'] ?? false),
        ]);

        if (array_key_exists('field_values', $data)) {
            $siteSection->fieldValues()->delete();

            foreach ($data['field_values'] ?? [] as $index => $field) {
                if (! is_array($field) || ! filled($field['field_key'] ?? null)) {
                    continue;
                }

                $value = $field['field_value'] ?? null;

                $siteSection->fieldValues()->create([
                    'field_key' => cms_plain_text($field['field_key'] ?? null),
                    'field_label' => cms_plain_text($field['field_label'] ?? null),
                    'field_type' => cms_plain_text($field['field_type'] ?? 'text') ?: 'text',
                    'field_value' => is_array($value)
                        ? json_encode($value, JSON_UNESCAPED_UNICODE)
                        : cms_rich_text($value),
                    'sort_order' => trim((string) ($field['sort_order'] ?? '')) ?: chr(65 + $index),
                    'is_active' => (bool) ($field['is_active'] ?? true),
                ]);
            }
        }

        if (array_key_exists('items', $data)) {
            $siteSection->items()->delete();

            foreach ($data['items'] ?? [] as $index => $item) {
                if (! is_array($item)) {
                    continue;
                }

                $siteSection->items()->create([
                    'item_key' => cms_plain_text($item['item_key'] ?? null),
                    'title' => cms_plain_text($item['title'] ?? null),
                    'subtitle' => cms_plain_text($item['subtitle'] ?? null),
                    'description' => cms_rich_text($item['description'] ?? null),
                    'media_id' => $item['media_id'] ?? null,
                    'link_url' => cms_plain_text($item['link_url'] ?? null),
                    'accent_color' => cms_plain_text($item['accent_color'] ?? null),
                    'meta_json' => $item['meta_json'] ?? null,
                    'sort_order' => trim((string) ($item['sort_order'] ?? '')) ?: chr(65 + $index),
                    'is_active' => (bool) ($item['is_active'] ?? true),
                ]);
            }
        }

        $siteSection = $siteSection->fresh(['media', 'secondaryMedia', 'fieldValues', 'items.media']);

        return response()->json([
            'id' => $siteSection->id,
            'page_key' => $siteSection->page_key,
            'section_key' => $siteSection->section_key,
            'title' => $siteSection->title,
            'subtitle' => $siteSection->subtitle,
            'description' => $siteSection->description,
            'media_id' => $siteSection->media_id,
            'media_url' => media_asset_url($siteSection->media),
            'secondary_media_id' => $siteSection->secondary_media_id,
            'secondary_media_url' => media_asset_url($siteSection->secondaryMedia),
            'button_text' => $siteSection->button_text,
            'button_url' => $siteSection->button_url,
            'sort_order' => $siteSection->sort_order,
            'is_active' => $siteSection->is_active,
            'field_values' => $siteSection->fieldValues,
            'items' => $siteSection->items,
        ]);
    }
}
