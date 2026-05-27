<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactPageItem;
use App\Models\ContactPageSetting;
use App\Models\ContactRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $settings = ContactPageSetting::query()->first();

        if (! $settings) {
            $settings = ContactPageSetting::query()->create([
                'address' => 'José Melián 2137 (B1852) Burzaco Provincia de Buenos Aires',
                'phone_primary' => '(011) 6072 - 6008',
                'phone_secondary' => '+54 (911) 6094 - 8992',
                'phone_tertiary' => '(011) 6062 - 1347',
                'email_primary' => 'nicolaismario@yahoo.com.ar',
                'map_link' => 'https://maps.app.goo.gl/w6zFeoJnA8cKMvrZ9',
            ]);
        }

        $requests = ContactRequest::query()
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (ContactRequest $contactRequest): array => [
                'id' => $contactRequest->id,
                'first_name' => $contactRequest->first_name,
                'last_name' => $contactRequest->last_name,
                'email' => $contactRequest->email,
                'phone' => $contactRequest->phone,
                'message' => $contactRequest->message,
                'is_read' => $contactRequest->is_read,
                'status' => $contactRequest->status,
                'reply_url' => $contactRequest->reply_url,
                'created_at' => $contactRequest->created_at?->format('d/m/Y H:i'),
            ]);

        return Inertia::render('Admin/Contacts/Index', [
            'settings' => [
                'id' => $settings->id,
                'address' => $settings->address,
                'phone_primary' => $settings->phone_primary,
                'phone_secondary' => $settings->phone_secondary,
                'phone_tertiary' => $settings->phone_tertiary,
                'email_primary' => $settings->email_primary,
                'email_secondary' => $settings->email_secondary,
                'map_link' => $settings->map_link,
                'map_iframe' => $settings->map_iframe,
            ],
            'contactItems' => ContactPageItem::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map(fn (ContactPageItem $item): array => $this->itemPayload($item)),
            'requests' => $requests,
            'stats' => [
                'total' => ContactRequest::query()->count(),
                'unread' => ContactRequest::query()->where('is_read', false)->count(),
            ],
            'initialTab' => $request->query('tab', 'page'),
            'publicContactUrl' => route('web.contact.show'),
        ]);
    }

    public function redirectLegacy(): RedirectResponse
    {
        return redirect()->route('admin.contact.index');
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'address' => ['nullable', 'string', 'max:255'],
            'phone_primary' => ['nullable', 'string', 'max:120'],
            'phone_secondary' => ['nullable', 'string', 'max:120'],
            'phone_tertiary' => ['nullable', 'string', 'max:120'],
            'email_primary' => ['nullable', 'email', 'max:180'],
            'email_secondary' => ['nullable', 'email', 'max:180'],
            'map_link' => ['nullable', 'url', 'max:500'],
            'map_iframe' => ['nullable', 'string', 'max:4000'],
        ]);

        $settings = ContactPageSetting::query()->first() ?: new ContactPageSetting();
        $settings->fill($data);
        $settings->save();

        return response()->json($settings->fresh());
    }

    public function storeItem(Request $request): JsonResponse
    {
        $data = $this->validateItem($request);

        $item = ContactPageItem::query()->create($data);

        return response()->json($this->itemPayload($item), 201);
    }

    public function updateItem(Request $request, ContactPageItem $contactPageItem): JsonResponse
    {
        $data = $this->validateItem($request);

        $contactPageItem->update($data);

        return response()->json($this->itemPayload($contactPageItem->fresh()));
    }

    public function destroyItem(ContactPageItem $contactPageItem): JsonResponse
    {
        $contactPageItem->delete();

        return response()->json(['deleted' => true]);
    }

    public function updateRequest(Request $request, ContactRequest $contactRequest): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180'],
            'phone' => ['nullable', 'string', 'max:80'],
            'message' => ['nullable', 'string', 'max:4000'],
            'is_read' => ['boolean'],
            'status' => ['nullable', 'string', 'max:40'],
        ]);

        $contactRequest->update($data);

        return response()->json($contactRequest->fresh());
    }

    public function destroyRequest(ContactRequest $contactRequest): JsonResponse
    {
        $contactRequest->delete();

        return response()->json(['deleted' => true]);
    }

    protected function validateItem(Request $request): array
    {
        return $request->validate([
            'type' => ['required', 'string', 'max:40', 'in:address,phone,whatsapp,additional_phone,email'],
            'label' => ['nullable', 'string', 'max:120'],
            'value' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
        ]);
    }

    protected function itemPayload(ContactPageItem $item): array
    {
        return [
            'id' => $item->id,
            'type' => $item->type,
            'label' => $item->label,
            'value' => $item->value,
            'sort_order' => $item->sort_order,
            'is_active' => $item->is_active,
        ];
    }
}
