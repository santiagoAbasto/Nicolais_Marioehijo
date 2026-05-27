<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Mail\ContactRequestNotification;
use App\Models\ContactPageItem;
use App\Models\ContactPageSetting;
use App\Models\ContactRequest;
use App\Models\FooterSetting;
use App\Models\Product;
use App\Models\SiteSection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\View\View;

class ContactController extends Controller
{
    public function show(Request $request): View
    {
        $product = null;

        if ($request->filled('producto')) {
            $product = Product::query()
                ->with(['family', 'mainMedia'])
                ->where('slug', (string) $request->string('producto'))
                ->where('is_active', true)
                ->first();
        }

        $contentSection = SiteSection::query()
            ->where('page_key', 'contacto')
            ->where('section_key', 'contacto_content')
            ->where('is_active', true)
            ->first();

        return view('web.contact.show', [
            'product' => $product,
            'settings' => ContactPageSetting::query()->first(),
            'contactItems' => ContactPageItem::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(),
            'footerSettings' => FooterSetting::query()->first(),
            'contentSection' => $contentSection,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180'],
            'phone' => ['nullable', 'string', 'max:80'],
            'message' => ['nullable', 'string', 'max:4000'],
            'product_slug' => ['nullable', 'string', 'max:255'],
        ]);

        $product = null;

        if (! empty($data['product_slug'])) {
            $product = Product::query()
                ->with('family')
                ->where('slug', $data['product_slug'])
                ->where('is_active', true)
                ->first();
        }

        $message = trim((string) ($data['message'] ?? ''));

        if ($product) {
            $productLines = array_filter([
                'Producto consultado:',
                'Familia: '.$product->family?->name,
                'Codigo: '.$product->sku,
                'Descripcion: '.$product->name,
                'Tipo: '.($product->brand ?: 'Importado'),
            ]);

            $message = implode("\n", $productLines).($message !== '' ? "\n\nMensaje:\n".$message : '');
        }

        $contactRequest = ContactRequest::query()->create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'message' => $message,
            'is_read' => false,
            'status' => 'pendiente',
        ]);

        $contactSettings = ContactPageSetting::query()->first();
        $recipient = config('mail.contact_request.to')
            ?: $contactSettings?->email_primary
            ?: config('mail.from.address');
        $ccRecipients = collect(explode(',', (string) config('mail.contact_request.cc')))
            ->map(fn (string $email) => trim($email))
            ->filter()
            ->values()
            ->all();

        if ($recipient) {
            try {
                $pendingMail = Mail::to($recipient);

                if ($ccRecipients !== []) {
                    $pendingMail->cc($ccRecipients);
                }

                $pendingMail->send(new ContactRequestNotification(
                    $contactRequest,
                    route('admin.contact.index', ['tab' => 'requests'])
                ));
            } catch (\Throwable $exception) {
                Log::warning('Contact request notification could not be sent.', [
                    'contact_request_id' => $contactRequest->id,
                    'recipient' => $recipient,
                    'cc' => $ccRecipients,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return redirect()
            ->route('web.contact.show', $product ? ['producto' => $product->slug] : [])
            ->with('status', 'Recibimos tu consulta. Te vamos a responder a la brevedad.');
    }
}
