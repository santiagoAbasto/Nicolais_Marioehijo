<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\ClientAccessApproved;
use App\Mail\ClientAccessRejected;
use App\Mail\ClientPasswordResetByAdmin;
use App\Models\ClientAccessRequest;
use App\Models\ClientOrder;
use App\Models\ClientOrderItem;
use App\Models\ClientPaymentReceipt;
use App\Models\ClientPaymentSetting;
use App\Models\ClientPriceListFile;
use App\Models\Product;
use App\Support\CmsSecurity;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ClientZoneController extends Controller
{
    public function users(Request $request): Response
    {
        $status = $request->string('status')->toString();

        $requests = ClientAccessRequest::query()
            ->with(['user:id,name,email', 'reviewer:id,name,email'])
            ->when(in_array($status, ['pending', 'approved', 'rejected', 'deactivated'], true), fn ($query) => $query->where('status', $status))
            ->latest()
            ->get()
            ->map(fn (ClientAccessRequest $clientRequest): array => $this->payload($clientRequest));

        return Inertia::render('Admin/ClientZone/Users', [
            'requests' => $requests,
            'filters' => ['status' => $status ?: 'all'],
            'stats' => [
                'total' => ClientAccessRequest::query()->count(),
                'pending' => ClientAccessRequest::query()->where('status', ClientAccessRequest::STATUS_PENDING)->count(),
                'approved' => ClientAccessRequest::query()->where('status', ClientAccessRequest::STATUS_APPROVED)->count(),
                'rejected' => ClientAccessRequest::query()->where('status', ClientAccessRequest::STATUS_REJECTED)->count(),
                'deactivated' => ClientAccessRequest::query()->where('status', ClientAccessRequest::STATUS_DEACTIVATED)->count(),
            ],
        ]);
    }

    public function approve(Request $request, ClientAccessRequest $clientAccessRequest): RedirectResponse
    {
        if ($clientAccessRequest->status === ClientAccessRequest::STATUS_APPROVED && $clientAccessRequest->user) {
            return back()->with('info', 'La solicitud ya estaba aprobada.');
        }

        $temporaryPassword = Str::password(12, true, true, false, false);
        $name = trim($clientAccessRequest->first_name.' '.$clientAccessRequest->last_name);

        $user = User::query()->where('email', $clientAccessRequest->email)->first();

        if ($user && $user->can_access_admin) {
            return back()->withErrors([
                'client' => 'Ese correo pertenece a un usuario administrador.',
            ]);
        }

        if (! $user) {
            $user = new User();
            $user->email = $clientAccessRequest->email;
        }

        $user->forceFill([
            'name' => $name !== '' ? $name : $clientAccessRequest->email,
            'password' => $temporaryPassword,
            'can_access_admin' => false,
            'email_verified_at' => now(),
            'remember_token' => Str::random(60),
        ])->save();

        $clientAccessRequest->fill([
            'user_id' => $user->id,
            'status' => ClientAccessRequest::STATUS_APPROVED,
            'approved_at' => now(),
            'rejected_at' => null,
            'deactivated_at' => null,
            'reviewed_by' => $request->user()?->id,
            'last_credentials_sent_at' => now(),
            'last_plain_password' => $temporaryPassword,
        ])->save();

        try {
            Mail::to($clientAccessRequest->email)->send(new ClientAccessApproved(
                $clientAccessRequest->fresh('user'),
                $temporaryPassword,
                route('web.clients.index'),
            ));
        } catch (Throwable $exception) {
            $this->logMailFailure($clientAccessRequest, $exception, 'approve');

            return back()->withErrors([
                'client' => 'El usuario quedó aprobado, pero no se pudo enviar el correo por Mailtrap. Revisá SMTP y reenviá credenciales.',
            ]);
        }

        return back()->with('success', 'Cliente aprobado y credenciales enviadas.');
    }

    public function reject(Request $request, ClientAccessRequest $clientAccessRequest): RedirectResponse
    {
        $clientAccessRequest->fill([
            'status' => ClientAccessRequest::STATUS_REJECTED,
            'rejected_at' => now(),
            'reviewed_by' => $request->user()?->id,
            'admin_notes' => $request->input('admin_notes', $clientAccessRequest->admin_notes),
        ])->save();

        try {
            Mail::to($clientAccessRequest->email)->send(new ClientAccessRejected($clientAccessRequest));
        } catch (Throwable $exception) {
            $this->logMailFailure($clientAccessRequest, $exception, 'reject');

            return back()->withErrors([
                'client' => 'La solicitud fue rechazada, pero no se pudo enviar el correo por Mailtrap.',
            ]);
        }

        return back()->with('success', 'Solicitud rechazada y correo enviado.');
    }

    public function resetPassword(ClientAccessRequest $clientAccessRequest): RedirectResponse
    {
        $user = $clientAccessRequest->user;

        if (! $user) {
            return back()->withErrors(['client' => 'La solicitud todavía no tiene usuario aprobado.']);
        }

        if ($user->can_access_admin) {
            return back()->withErrors(['client' => 'No se puede restablecer desde Zona Cliente a un usuario administrador.']);
        }

        $temporaryPassword = Str::password(12, true, true, false, false);

        try {
            Mail::to($clientAccessRequest->email)->send(new ClientPasswordResetByAdmin(
                $clientAccessRequest->fresh('user'),
                $temporaryPassword,
                route('web.clients.index'),
            ));
        } catch (Throwable $exception) {
            $this->logMailFailure($clientAccessRequest, $exception, 'reset-password');

            return back()->withErrors([
                'client' => 'No se pudo enviar el correo por Mailtrap. La contraseña no fue cambiada.',
            ]);
        }

        $user->forceFill([
            'password' => $temporaryPassword,
            'remember_token' => Str::random(60),
        ])->save();

        $clientAccessRequest->forceFill([
            'status' => ClientAccessRequest::STATUS_APPROVED,
            'deactivated_at' => null,
            'last_credentials_sent_at' => now(),
            'last_plain_password' => $temporaryPassword,
        ])->save();

        return back()->with('success', 'Contraseña restablecida y enviada al cliente.');
    }

    public function updatePassword(Request $request, ClientAccessRequest $clientAccessRequest): RedirectResponse
    {
        $user = $clientAccessRequest->user;

        if (! $user) {
            return back()->withErrors(['client' => 'La solicitud todavía no tiene usuario aprobado.']);
        }

        if ($user->can_access_admin) {
            return back()->withErrors(['client' => 'No se puede actualizar desde Zona Cliente a un usuario administrador.']);
        }

        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $password = $data['password'];

        try {
            Mail::to($clientAccessRequest->email)->send(new ClientPasswordResetByAdmin(
                $clientAccessRequest->fresh('user'),
                $password,
                route('web.clients.index'),
            ));
        } catch (Throwable $exception) {
            $this->logMailFailure($clientAccessRequest, $exception, 'update-password');

            return back()->withErrors([
                'client' => 'No se pudo enviar el correo por Mailtrap. La contraseña no fue cambiada.',
            ]);
        }

        $user->forceFill([
            'password' => $password,
            'remember_token' => Str::random(60),
        ])->save();

        $clientAccessRequest->forceFill([
            'status' => ClientAccessRequest::STATUS_APPROVED,
            'deactivated_at' => null,
            'last_credentials_sent_at' => now(),
            'last_plain_password' => $password,
        ])->save();

        return back()->with('success', 'Contraseña actualizada y enviada al cliente.');
    }

    public function deactivate(Request $request, ClientAccessRequest $clientAccessRequest): RedirectResponse
    {
        $user = $clientAccessRequest->user;

        if ($user?->can_access_admin) {
            return back()->withErrors(['client' => 'No se puede dar de baja desde Zona Cliente a un usuario administrador.']);
        }

        if ($user) {
            $user->forceFill([
                'password' => Str::password(32, true, true, true, false),
                'remember_token' => Str::random(60),
            ])->save();

            DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        $clientAccessRequest->fill([
            'status' => ClientAccessRequest::STATUS_DEACTIVATED,
            'deactivated_at' => now(),
            'reviewed_by' => $request->user()?->id,
            'last_plain_password' => null,
        ])->save();

        return back()->with('success', 'Usuario dado de baja correctamente.');
    }

    public function products(): Response
    {
        $products = Product::query()
            ->with(['family', 'subfamily'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product): array => $this->productPayload($product));

        return Inertia::render('Admin/ClientZone/Products', [
            'products' => $products,
            'soldProducts' => $this->soldProductsPayload(),
            'stats' => [
                'total' => $products->count(),
                'active' => $products->where('is_active', true)->count(),
                'with_discount' => $products->filter(fn (array $product): bool => $this->hasProductDiscount($product))->count(),
            ],
            'catalogUrl' => route('admin.products.index'),
            'catalogImportUrl' => route('admin.products.index', ['tab' => 'import']),
        ]);
    }

    public function priceLists(): Response
    {
        $files = ClientPriceListFile::query()
            ->with('clients:id,first_name,last_name,company,email')
            ->orderBy('sort_code')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ClientPriceListFile $file): array => $this->priceListPayload($file));

        $clients = ClientAccessRequest::query()
            ->where('status', ClientAccessRequest::STATUS_APPROVED)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'company', 'email'])
            ->map(fn (ClientAccessRequest $clientRequest): array => $this->priceListClientPayload($clientRequest));

        return Inertia::render('Admin/ClientZone/PriceLists', [
            'files' => $files,
            'clients' => $clients,
            'storeUrl' => route('admin.client-zone.price-lists.store'),
            'stats' => [
                'total' => $files->count(),
                'active' => $files->where('is_active', true)->count(),
                'pdf' => $files->where('format', 'PDF')->count(),
                'excel' => $files->where('format', 'EXCEL')->count(),
            ],
        ]);
    }

    public function paymentInfo(): Response
    {
        $settings = ClientPaymentSetting::current();
        $receipts = ClientPaymentReceipt::query()
            ->with(['clientRequest:id,first_name,last_name,email,company', 'reviewer:id,name,email'])
            ->latest()
            ->get()
            ->map(fn (ClientPaymentReceipt $receipt): array => $this->paymentReceiptPayload($receipt));

        return Inertia::render('Admin/ClientZone/PaymentInfo', [
            'settings' => [
                'bank_title' => $settings->bank_title,
                'bank_details' => $settings->bank_details,
                'terms_title' => $settings->terms_title,
                'terms_details' => $settings->terms_details,
                'receipt_note' => $settings->receipt_note,
            ],
            'receipts' => $receipts,
            'statuses' => collect(ClientPaymentReceipt::statuses())
                ->map(fn (string $label, string $value): array => ['value' => $value, 'label' => $label])
                ->values(),
            'stats' => [
                'total' => $receipts->count(),
                'pending' => $receipts->where('status', ClientPaymentReceipt::STATUS_PENDING)->count(),
                'verified' => $receipts->where('status', ClientPaymentReceipt::STATUS_VERIFIED)->count(),
                'paid' => $receipts->where('status', ClientPaymentReceipt::STATUS_PAID)->count(),
            ],
            'settingsUrl' => route('admin.client-zone.payments.settings'),
        ]);
    }

    public function updatePaymentInfo(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'bank_title' => ['required', 'string', 'max:180'],
            'bank_details' => ['required', 'string', 'max:2000'],
            'terms_title' => ['required', 'string', 'max:180'],
            'terms_details' => ['required', 'string', 'max:2000'],
            'receipt_note' => ['nullable', 'string', 'max:1000'],
        ]);

        ClientPaymentSetting::current()->update($data);

        return back()->with('success', 'Información de pagos actualizada correctamente.');
    }

    public function updatePaymentReceipt(Request $request, ClientPaymentReceipt $paymentReceipt): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', array_keys(ClientPaymentReceipt::statuses()))],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $paymentReceipt->fill([
            'status' => $data['status'],
            'admin_notes' => $data['admin_notes'] ?? null,
            'reviewed_by' => $request->user()?->id,
            'reviewed_at' => now(),
        ])->save();

        return back()->with('success', 'Comprobante actualizado correctamente.');
    }

    public function downloadPaymentReceipt(ClientPaymentReceipt $paymentReceipt)
    {
        abort_unless(Storage::disk($paymentReceipt->disk)->exists($paymentReceipt->attachment_path), 404);

        return Storage::disk($paymentReceipt->disk)->download(
            $paymentReceipt->attachment_path,
            $paymentReceipt->attachment_original_name,
            ['Content-Type' => $paymentReceipt->attachment_mime ?: 'application/octet-stream'],
        );
    }

    public function storePriceList(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'file' => $this->priceListFileRules(),
            'sort_code' => ['nullable', 'string', 'max:20', 'regex:/^[A-Za-z]+$/'],
            'is_active' => ['nullable', 'boolean'],
            'client_ids' => ['required', 'array', 'min:1'],
            'client_ids.*' => ['integer', 'exists:client_access_requests,id'],
        ]);

        $file = $request->file('file');
        $path = $file->storeAs('client-price-lists', CmsSecurity::safeStoredFilename($file), 'public');

        $priceListFile = ClientPriceListFile::query()->create([
            'name' => $data['name'],
            'format' => $this->priceListFormat($file->getClientOriginalExtension()),
            'disk' => 'public',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize() ?: 0,
            'sort_code' => Str::upper($data['sort_code'] ?? 'A'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        $priceListFile->clients()->sync($data['client_ids']);

        return back()->with('success', 'Lista de precios cargada correctamente.');
    }

    public function viewPriceList(ClientPriceListFile $priceListFile)
    {
        abort_unless(Storage::disk($priceListFile->disk)->exists($priceListFile->path), 404);

        return view('web.clients.price-list-view', [
            'title' => $priceListFile->name,
            'fileName' => $this->safePriceListName($priceListFile),
            'fileFormat' => $priceListFile->format,
            'fileUrl' => $this->priceListViewerUrl($priceListFile, route('admin.client-zone.price-lists.file', $priceListFile)),
            'rawFileUrl' => route('admin.client-zone.price-lists.file', $priceListFile),
            'downloadUrl' => route('admin.client-zone.price-lists.download', $priceListFile),
            'usesOfficeViewer' => $this->shouldUseOfficeViewer($priceListFile),
        ]);
    }

    public function streamPriceList(ClientPriceListFile $priceListFile)
    {
        abort_unless(Storage::disk($priceListFile->disk)->exists($priceListFile->path), 404);

        return response()->file(Storage::disk($priceListFile->disk)->path($priceListFile->path), [
            'Content-Type' => $priceListFile->mime_type ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="'.$this->safePriceListName($priceListFile).'"',
        ]);
    }

    public function downloadPriceList(ClientPriceListFile $priceListFile)
    {
        abort_unless(Storage::disk($priceListFile->disk)->exists($priceListFile->path), 404);

        return Storage::disk($priceListFile->disk)->download(
            $priceListFile->path,
            $this->safePriceListName($priceListFile),
            ['Content-Type' => $priceListFile->mime_type ?: 'application/octet-stream'],
        );
    }

    public function updatePriceList(Request $request, ClientPriceListFile $priceListFile): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'sort_code' => ['nullable', 'string', 'max:20', 'regex:/^[A-Za-z]+$/'],
            'is_active' => ['nullable', 'boolean'],
            'client_ids' => ['required', 'array', 'min:1'],
            'client_ids.*' => ['integer', 'exists:client_access_requests,id'],
        ]);

        $priceListFile->fill([
            'name' => $data['name'],
            'sort_code' => Str::upper($data['sort_code'] ?? 'A'),
            'is_active' => $request->boolean('is_active'),
        ])->save();
        $priceListFile->clients()->sync($data['client_ids']);

        return back()->with('success', 'Lista de precios actualizada correctamente.');
    }

    protected function priceListFileRules(): array
    {
        return [
            'required',
            'file',
            'mimes:'.implode(',', CmsSecurity::priceListExtensions()),
            'mimetypes:'.implode(',', CmsSecurity::priceListMimeTypes()),
            'max:51200',
        ];
    }

    public function destroyPriceList(ClientPriceListFile $priceListFile): RedirectResponse
    {
        if ($priceListFile->path) {
            Storage::disk($priceListFile->disk)->delete($priceListFile->path);
        }

        $priceListFile->delete();

        return back()->with('success', 'Lista de precios eliminada correctamente.');
    }

    public function orders(): Response
    {
        $orders = ClientOrder::query()
            ->with(['clientRequest:id,first_name,last_name,email,company', 'items'])
            ->where('document_type', ClientOrder::TYPE_ORDER)
            ->latest()
            ->get()
            ->map(fn (ClientOrder $order): array => $this->orderPayload($order));

        return Inertia::render('Admin/ClientZone/Orders', [
            'orders' => $orders,
            'stats' => [
                'total' => $orders->count(),
                'pending' => $orders->where('status', ClientOrder::STATUS_PENDING)->count(),
                'invoiced' => $orders->where('status', ClientOrder::STATUS_INVOICED)->count(),
                'delivered' => $orders->where('status', ClientOrder::STATUS_DELIVERED)->count(),
            ],
        ]);
    }

    public function budgets(): Response
    {
        $budgets = ClientOrder::query()
            ->with(['clientRequest:id,first_name,last_name,email,company', 'items'])
            ->where('document_type', ClientOrder::TYPE_BUDGET)
            ->latest()
            ->get()
            ->map(fn (ClientOrder $budget): array => $this->budgetPayload($budget));

        return Inertia::render('Admin/ClientZone/Budgets', [
            'budgets' => $budgets,
            'stats' => [
                'total' => $budgets->count(),
                'products' => $budgets->sum('products_count'),
                'services' => $budgets->sum('services_count'),
                'amount' => $budgets->sum('total'),
            ],
        ]);
    }

    public function showOrder(ClientOrder $clientOrder): \Illuminate\Contracts\View\View
    {
        return view('web.clients.order-show', [
            'order' => $clientOrder->load(['items', 'clientRequest']),
            'logoDataUri' => $this->logoDataUri(),
            'attachment' => $this->orderAttachmentPayload($clientOrder),
        ]);
    }

    public function updateOrder(Request $request, ClientOrder $clientOrder): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', [
                ClientOrder::STATUS_PENDING,
                ClientOrder::STATUS_INVOICED,
                ClientOrder::STATUS_DISPATCHED,
                ClientOrder::STATUS_DELIVERED,
            ])],
            'delivered_at' => ['nullable', 'date'],
        ]);

        $clientOrder->forceFill([
            'status' => $data['status'],
            'delivered_at' => $data['delivered_at'] ?? null,
        ])->save();

        return back()->with('success', 'Pedido actualizado correctamente.');
    }

    public function downloadOrder(ClientOrder $clientOrder)
    {
        $pdf = Pdf::loadView('pdf.client-order', [
            'order' => $clientOrder->load(['items', 'clientRequest']),
            'logoDataUri' => $this->logoDataUri(),
            'attachment' => $this->orderAttachmentPayload($clientOrder),
            'isPdf' => true,
        ])->setPaper('a4', 'landscape');

        return $pdf->download("pedido-{$clientOrder->order_number}.pdf");
    }

    public function showBudget(ClientOrder $clientOrder): \Illuminate\Contracts\View\View
    {
        abort_unless($clientOrder->document_type === ClientOrder::TYPE_BUDGET, 404);

        return view('web.clients.budget-show', [
            'budget' => $clientOrder->load(['items', 'clientRequest']),
            'logoDataUri' => $this->logoDataUri(),
            'attachment' => $this->orderAttachmentPayload($clientOrder),
            'isPdf' => false,
        ]);
    }

    public function downloadBudget(ClientOrder $clientOrder)
    {
        abort_unless($clientOrder->document_type === ClientOrder::TYPE_BUDGET, 404);

        $pdf = Pdf::loadView('pdf.client-budget', [
            'budget' => $clientOrder->load(['items', 'clientRequest']),
            'logoDataUri' => $this->logoDataUri(),
            'attachment' => $this->orderAttachmentPayload($clientOrder),
            'isPdf' => true,
        ])->setPaper('a4', 'landscape');

        return $pdf->download("presupuesto-{$clientOrder->order_number}.pdf");
    }

    public function updateProductDiscount(Request $request, Product $product): array
    {
        $data = $request->validate([
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $this->applyProductDiscount($product, $data['discount_percent'] ?? null);

        return [
            'product' => $this->productPayload($product->fresh(['family', 'subfamily'])),
        ];
    }

    public function updateGlobalProductDiscount(Request $request): array
    {
        $data = $request->validate([
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        Product::query()
            ->select(['id', 'price', 'discount_price'])
            ->chunkById(250, function ($products) use ($data): void {
                $products->each(fn (Product $product) => $this->applyProductDiscount($product, $data['discount_percent'] ?? null));
            });

        $products = Product::query()
            ->with(['family', 'subfamily'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product): array => $this->productPayload($product));

        return [
            'products' => $products,
            'stats' => [
                'total' => $products->count(),
                'active' => $products->where('is_active', true)->count(),
                'with_discount' => $products->filter(fn (array $product): bool => $this->hasProductDiscount($product))->count(),
            ],
        ];
    }

    public function template(string $module): Response
    {
        $labels = [
            'productos' => 'Productos',
            'carrito' => 'Carrito',
            'presupuesto' => 'Presupuesto',
            'pedidos' => 'Pedidos',
            'lista-de-precios' => 'Lista de precios',
            'info-de-pagos' => 'Info de pagos',
            'margenes' => 'Márgenes',
        ];

        abort_unless(isset($labels[$module]), 404);

        return Inertia::render('Admin/ClientZone/Template', [
            'module' => $module,
            'title' => $labels[$module],
        ]);
    }

    protected function payload(ClientAccessRequest $clientRequest): array
    {
        return [
            'id' => $clientRequest->id,
            'status' => $clientRequest->status,
            'full_name' => $clientRequest->full_name,
            'first_name' => $clientRequest->first_name,
            'last_name' => $clientRequest->last_name,
            'company' => $clientRequest->company,
            'tax_id' => $clientRequest->tax_id,
            'email' => $clientRequest->email,
            'phone' => $clientRequest->phone,
            'address' => $clientRequest->address,
            'city' => $clientRequest->city,
            'province' => $clientRequest->province,
            'postal_code' => $clientRequest->postal_code,
            'business_type' => $clientRequest->business_type,
            'message' => $clientRequest->message,
            'payment_info' => $clientRequest->payment_info ?? [],
            'margins' => $clientRequest->margins ?? [],
            'admin_notes' => $clientRequest->admin_notes,
            'created_at' => optional($clientRequest->created_at)->toISOString(),
            'approved_at' => optional($clientRequest->approved_at)->toISOString(),
            'rejected_at' => optional($clientRequest->rejected_at)->toISOString(),
            'deactivated_at' => optional($clientRequest->deactivated_at)->toISOString(),
            'last_credentials_sent_at' => optional($clientRequest->last_credentials_sent_at)->toISOString(),
            'last_plain_password' => $clientRequest->last_plain_password,
            'reviewer' => $clientRequest->reviewer?->only(['id', 'name', 'email']),
            'user' => $clientRequest->user?->only(['id', 'name', 'email']),
        ];
    }

    protected function productPayload(Product $product): array
    {
        $listPrice = (float) ($product->price ?? 0);
        $discountPrice = $product->discount_price === null ? null : (float) $product->discount_price;

        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'brand' => $product->brand,
            'family_name' => $product->family?->name,
            'subfamily_name' => $product->subfamily?->name,
            'original_code' => $product->original_code,
            'equivalence_code' => $product->equivalence_code,
            'oem_code' => $product->oem_code,
            'price' => $product->price,
            'discount_price' => $product->discount_price,
            'discount_percent' => $listPrice > 0 && $discountPrice !== null
                ? max(0, (1 - ($discountPrice / $listPrice)) * 100)
                : null,
            'is_active' => $product->is_active,
        ];
    }

    protected function soldProductsPayload(): array
    {
        return ClientOrderItem::query()
            ->select([
                'product_id',
                'family',
                'code',
                'description',
                'type',
            ])
            ->selectRaw('SUM(quantity) as total_quantity')
            ->selectRaw('COUNT(DISTINCT client_order_id) as orders_count')
            ->selectRaw('SUM(subtotal) as total_amount')
            ->groupBy('product_id', 'family', 'code', 'description', 'type')
            ->orderByDesc('total_quantity')
            ->limit(12)
            ->get()
            ->map(fn (ClientOrderItem $item): array => [
                'product_id' => $item->product_id,
                'family' => $item->family,
                'code' => $item->code,
                'description' => $item->description,
                'type' => $item->type,
                'total_quantity' => (int) $item->total_quantity,
                'orders_count' => (int) $item->orders_count,
                'total_amount' => (float) $item->total_amount,
            ])
            ->all();
    }

    protected function hasProductDiscount(array $product): bool
    {
        $price = $product['price'] === null ? null : (float) $product['price'];
        $discountPrice = $product['discount_price'] === null ? null : (float) $product['discount_price'];

        return $price !== null && $price > 0 && $discountPrice !== null && $discountPrice < $price;
    }

    protected function orderPayload(ClientOrder $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'client' => $order->clientRequest?->full_name,
            'company' => $order->clientRequest?->company,
            'email' => $order->clientRequest?->email,
            'items_count' => $order->items->count(),
            'total' => $order->total,
            'created_at' => optional($order->created_at)->toISOString(),
            'delivered_at' => optional($order->delivered_at)->toISOString(),
            'delivered_date' => optional($order->delivered_at)->format('Y-m-d'),
            'update_url' => route('admin.client-zone.orders.update', $order),
            'show_url' => route('admin.client-zone.orders.show', $order),
            'pdf_url' => route('admin.client-zone.orders.pdf', $order),
        ];
    }

    protected function budgetPayload(ClientOrder $budget): array
    {
        $productsCount = $budget->items->whereNotNull('product_id')->count();
        $servicesCount = $budget->items->whereNull('product_id')->count();

        return [
            'id' => $budget->id,
            'number' => $budget->order_number,
            'status' => $budget->status,
            'client' => $budget->clientRequest?->full_name,
            'company' => $budget->clientRequest?->company,
            'email' => $budget->clientRequest?->email,
            'products_count' => $productsCount,
            'services_count' => $servicesCount,
            'items_count' => $budget->items->count(),
            'total' => $budget->total,
            'created_at' => optional($budget->created_at)->toISOString(),
            'updated_at' => optional($budget->updated_at)->toISOString(),
            'show_url' => route('admin.client-zone.budgets.show', $budget),
            'pdf_url' => route('admin.client-zone.budgets.pdf', $budget),
        ];
    }

    protected function priceListPayload(ClientPriceListFile $file): array
    {
        return [
            'id' => $file->id,
            'name' => $file->name,
            'format' => $file->format,
            'size' => $this->humanFileSize($file->size_bytes),
            'sort_code' => $file->sort_code ?: 'A',
            'is_active' => $file->is_active,
            'original_name' => $file->original_name,
            'clients' => $file->clients
                ->map(fn (ClientAccessRequest $clientRequest): array => $this->priceListClientPayload($clientRequest))
                ->values(),
            'client_ids' => $file->clients->pluck('id')->values(),
            'created_at' => optional($file->created_at)->toISOString(),
            'view_url' => route('admin.client-zone.price-lists.view', $file),
            'download_url' => route('admin.client-zone.price-lists.download', $file),
            'update_url' => route('admin.client-zone.price-lists.update', $file),
            'delete_url' => route('admin.client-zone.price-lists.destroy', $file),
        ];
    }

    protected function priceListClientPayload(ClientAccessRequest $clientRequest): array
    {
        return [
            'id' => $clientRequest->id,
            'name' => $clientRequest->full_name ?: $clientRequest->email,
            'company' => $clientRequest->company,
            'email' => $clientRequest->email,
        ];
    }

    protected function paymentReceiptPayload(ClientPaymentReceipt $receipt): array
    {
        return [
            'id' => $receipt->id,
            'client' => $receipt->clientRequest?->full_name ?: $receipt->clientRequest?->email,
            'company' => $receipt->clientRequest?->company,
            'email' => $receipt->clientRequest?->email,
            'paid_at' => optional($receipt->paid_at)->format('Y-m-d'),
            'paid_at_label' => optional($receipt->paid_at)->format('d/m/Y'),
            'amount' => (float) $receipt->amount,
            'bank' => $receipt->bank,
            'branch' => $receipt->branch,
            'invoices' => $receipt->invoices,
            'observations' => $receipt->observations,
            'status' => $receipt->status,
            'status_label' => ClientPaymentReceipt::statuses()[$receipt->status] ?? $receipt->status,
            'admin_notes' => $receipt->admin_notes,
            'attachment_name' => $receipt->attachment_original_name,
            'attachment_size' => $this->humanFileSize((int) $receipt->attachment_size),
            'created_at' => optional($receipt->created_at)->toISOString(),
            'reviewed_at' => optional($receipt->reviewed_at)->toISOString(),
            'reviewer' => $receipt->reviewer?->name,
            'update_url' => route('admin.client-zone.payments.update', $receipt),
            'download_url' => route('admin.client-zone.payments.download', $receipt),
        ];
    }

    protected function safePriceListName(ClientPriceListFile $file): string
    {
        $extension = strtolower(pathinfo($file->original_name, PATHINFO_EXTENSION) ?: $file->format);
        $name = Str::slug($file->name) ?: 'lista-de-precios';

        return $name.'.'.$extension;
    }

    protected function priceListViewerUrl(ClientPriceListFile $file, string $fallbackUrl): string
    {
        if (! $this->shouldUseOfficeViewer($file)) {
            return $fallbackUrl;
        }

        $sourceUrl = URL::temporarySignedRoute(
            'web.client-zone.price-lists.office-file',
            now()->addMinutes(30),
            $file,
        );

        return 'https://view.officeapps.live.com/op/embed.aspx?src='.rawurlencode($sourceUrl);
    }

    protected function shouldUseOfficeViewer(ClientPriceListFile $file): bool
    {
        if ($file->format !== 'EXCEL' || app()->environment(['local', 'testing'])) {
            return false;
        }

        $host = request()->getHost();

        return ! in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    }

    protected function priceListFormat(?string $extension): string
    {
        return match (strtolower((string) $extension)) {
            'xlsx', 'xls', 'csv' => 'EXCEL',
            default => 'PDF',
        };
    }

    protected function humanFileSize(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            return number_format($bytes / 1024 / 1024, 1, ',', '.').'mb';
        }

        return max(1, (int) ceil($bytes / 1024)).'kb';
    }

    protected function logoDataUri(): string
    {
        $path = public_path('storage/brand/logo.svg');

        if (! is_file($path)) {
            return '';
        }

        return 'data:image/svg+xml;base64,'.base64_encode((string) file_get_contents($path));
    }

    protected function orderAttachmentPayload(ClientOrder $order): ?array
    {
        if (! $order->attachment_path || ! Storage::disk('public')->exists($order->attachment_path)) {
            return null;
        }

        $path = Storage::disk('public')->path($order->attachment_path);
        $mime = Storage::disk('public')->mimeType($order->attachment_path) ?: 'application/octet-stream';
        $isImage = Str::startsWith($mime, 'image/');

        return [
            'name' => $order->attachment_name ?: basename($order->attachment_path),
            'mime' => $mime,
            'url' => asset('storage/'.$order->attachment_path),
            'is_image' => $isImage,
            'data_uri' => $isImage && is_file($path)
                ? 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($path))
                : null,
        ];
    }

    protected function applyProductDiscount(Product $product, mixed $percent): void
    {
        $listPrice = (float) ($product->price ?? 0);

        $product->forceFill([
            'discount_price' => $percent === null || $listPrice <= 0
                ? null
                : round($listPrice * (1 - ((float) $percent / 100)), 2),
        ])->save();
    }

    protected function logMailFailure(ClientAccessRequest $clientRequest, Throwable $exception, string $action): void
    {
        Log::error('Client zone credentials mail could not be sent.', [
            'action' => $action,
            'client_request_id' => $clientRequest->id,
            'email' => $clientRequest->email,
            'mail_host' => config('mail.mailers.smtp.host'),
            'mail_port' => config('mail.mailers.smtp.port'),
            'error' => $exception->getMessage(),
        ]);
    }
}
