<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ClientAccessRequest;
use App\Models\Catalog\CatalogGrade;
use App\Models\ClientOrder;
use App\Models\ClientPaymentReceipt;
use App\Models\ClientPaymentSetting;
use App\Models\ClientPriceListFile;
use App\Models\Product;
use App\Models\ProductFamily;
use App\Models\ProductSubfamily;
use App\Support\CmsSecurity;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\URL;

class ClientZoneController extends Controller
{
    public function index(Request $request, string $section = 'productos'): View|RedirectResponse
    {
        $clientRequest = $this->approvedClientRequest($request);

        $sections = $this->sections();
        abort_unless(isset($sections[$section]), 404);

        $query = trim((string) $request->query('q', ''));
        $results = collect();

        if ($query !== '') {
            $results = CatalogGrade::query()
                ->with(['series.line'])
                ->where('is_active', true)
                ->where(function ($builder) use ($query) {
                    $builder->where('name', 'like', "%{$query}%")
                        ->orWhere('slug', 'like', "%{$query}%")
                        ->orWhere('short_title', 'like', "%{$query}%");
                })
                ->limit(12)
                ->get();
        }

        return view('web.clients.zone', [
            'section' => $section,
            'sections' => $sections,
            'current' => $sections[$section],
            'query' => $query,
            'results' => $results,
            'clientRequest' => $clientRequest,
            'cart' => $this->cartPayload($request, $clientRequest),
            'budget' => $this->budgetPayload($request, $clientRequest),
            'orders' => $this->ordersPayload($clientRequest),
            'priceLists' => $this->priceListsPayload($clientRequest),
            'paymentInfo' => $this->paymentInfoPayload($clientRequest),
            ...$this->productsPayload($request, $section, $clientRequest),
        ]);
    }

    public function storePaymentReceipt(Request $request): RedirectResponse
    {
        $clientRequest = $this->approvedClientRequest($request);
        $rawAmount = trim((string) $request->input('amount', ''));
        $normalizedAmount = str_contains($rawAmount, ',')
            ? str_replace(',', '.', str_replace('.', '', $rawAmount))
            : str_replace(',', '', $rawAmount);

        $request->merge(['amount' => $normalizedAmount]);

        $data = $request->validate([
            'paid_at' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999'],
            'bank' => ['required', 'string', 'max:120'],
            'branch' => ['required', 'string', 'max:120'],
            'invoices' => ['nullable', 'string', 'max:180'],
            'observations' => ['nullable', 'string', 'max:2000'],
            'attachment' => $this->clientAttachmentRules(required: true, maxKilobytes: 20480),
        ]);

        $file = $request->file('attachment');
        $path = $file->storeAs(
            'client-payment-receipts/'.$clientRequest->id,
            CmsSecurity::safeStoredFilename($file),
            'public'
        );

        ClientPaymentReceipt::query()->create([
            'client_access_request_id' => $clientRequest->id,
            'paid_at' => $data['paid_at'],
            'amount' => round((float) $data['amount'], 2),
            'bank' => $data['bank'],
            'branch' => $data['branch'],
            'invoices' => $data['invoices'] ?? null,
            'observations' => $data['observations'] ?? null,
            'disk' => 'public',
            'attachment_path' => $path,
            'attachment_original_name' => $file->getClientOriginalName(),
            'attachment_mime' => $file->getMimeType(),
            'attachment_size' => $file->getSize() ?: 0,
            'status' => ClientPaymentReceipt::STATUS_PENDING,
        ]);

        return redirect()
            ->route('web.client-zone.section', 'info-de-pagos')
            ->with('status', 'Comprobante enviado correctamente. Administración revisará el pago.')
            ->with('toast_title', 'Comprobante enviado');
    }

    public function updateMargins(Request $request): RedirectResponse
    {
        $clientRequest = $this->approvedClientRequest($request);
        $data = $request->validate([
            'price_list_margin' => ['required', 'numeric', 'min:0', 'max:200'],
        ]);

        $clientRequest->forceFill([
            'margins' => [
                ...($clientRequest->margins ?? []),
                'price_list_margin' => round((float) $data['price_list_margin'], 2),
            ],
        ])->save();

        return redirect()
            ->route('web.client-zone.section', 'margenes')
            ->with('status', 'Margen actualizado correctamente.');
    }

    public function addToCart(Request $request, Product $product): RedirectResponse
    {
        return $this->addProductToSession($request, $product, 'client_zone_cart', 'carrito', 'Producto agregado al carrito.');
    }

    public function addToBudget(Request $request, Product $product): RedirectResponse
    {
        return $this->addProductToSession($request, $product, 'client_zone_budget', 'presupuesto', 'Producto agregado al presupuesto.');
    }

    public function updateCart(Request $request, Product $product): RedirectResponse
    {
        return $this->updateProductInSession($request, $product, 'client_zone_cart', 'Carrito actualizado.');
    }

    public function updateBudget(Request $request, Product $product): RedirectResponse
    {
        return $this->updateProductInSession($request, $product, 'client_zone_budget', 'Presupuesto actualizado.');
    }

    public function removeFromCart(Request $request, Product $product): RedirectResponse
    {
        return $this->removeProductFromSession($request, $product, 'client_zone_cart', 'Producto eliminado del carrito.');
    }

    public function removeFromBudget(Request $request, Product $product): RedirectResponse
    {
        return $this->removeProductFromSession($request, $product, 'client_zone_budget', 'Producto eliminado del presupuesto.');
    }

    public function storeBudgetService(Request $request): RedirectResponse
    {
        $this->approvedClientRequest($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'quantity' => ['required', 'integer', 'min:1', 'max:99999'],
            'price' => ['required', 'numeric', 'min:0', 'max:999999999'],
            'discount_price' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
        ]);

        $services = $request->session()->get('client_zone_budget_services', []);
        $serviceId = (string) Str::uuid();
        $price = round((float) $data['price'], 2);
        $discountedPrice = $data['discount_price'] === null || $data['discount_price'] === ''
            ? $price
            : round((float) $data['discount_price'], 2);

        $services[$serviceId] = [
            'id' => $serviceId,
            'name' => $data['name'],
            'quantity' => max(1, (int) $data['quantity']),
            'price' => $price,
            'discounted_price' => $discountedPrice,
        ];
        $request->session()->put('client_zone_budget_services', $services);

        return redirect()
            ->route('web.client-zone.section', 'presupuesto')
            ->with('status', 'Servicio creado y agregado al presupuesto.')
            ->with('toast_title', 'Presupuesto actualizado');
    }

    public function removeBudgetService(Request $request, string $serviceKey): RedirectResponse
    {
        $this->approvedClientRequest($request);

        $services = $request->session()->get('client_zone_budget_services', []);
        unset($services[$serviceKey]);
        $request->session()->put('client_zone_budget_services', $services);

        return back()
            ->with('status', 'Servicio eliminado del presupuesto.')
            ->with('toast_title', 'Presupuesto actualizado');
    }

    public function saveBudget(Request $request): JsonResponse
    {
        $clientRequest = $this->approvedClientRequest($request);
        $budget = $this->budgetPayload($request, $clientRequest);

        if ($budget['items']->isEmpty() && $budget['services']->isEmpty()) {
            return response()->json([
                'message' => 'Agregá productos o servicios antes de guardar el presupuesto.',
            ], 422);
        }

        $data = $request->validate([
            'delivery_method' => ['nullable', 'string', 'max:120'],
            'message' => ['nullable', 'string', 'max:3000'],
            'attachment' => $this->clientAttachmentRules(required: false, maxKilobytes: 10240),
        ]);

        $savedBudget = DB::transaction(function () use ($request, $clientRequest, $budget, $data): ClientOrder {
            $existingId = $request->session()->get('client_zone_budget_saved_order_id');
            $savedBudget = $existingId
                ? ClientOrder::query()
                    ->where('id', $existingId)
                    ->where('document_type', ClientOrder::TYPE_BUDGET)
                    ->where('client_access_request_id', $clientRequest->id)
                    ->first()
                : null;

            if (! $savedBudget) {
                $savedBudget = new ClientOrder([
                    'client_access_request_id' => $clientRequest->id,
                    'user_id' => $request->user()?->id,
                    'order_number' => $this->nextBudgetNumber(),
                    'document_type' => ClientOrder::TYPE_BUDGET,
                    'draft_key' => (string) Str::uuid(),
                    'status' => ClientOrder::STATUS_PENDING,
                ]);
            }

            $savedBudget->fill([
                'delivery_method' => $data['delivery_method'] ?? 'Retiro cliente',
                'message' => $data['message'] ?? null,
                'subtotal_list' => $budget['subtotal_list'],
                'discount_total' => $budget['discount_total'],
                'subtotal_discount' => $budget['subtotal_discount'],
                'iva' => $budget['iva'],
                'total' => $budget['total'],
            ])->save();

            if ($request->hasFile('attachment')) {
                if ($savedBudget->attachment_path) {
                    Storage::disk('public')->delete($savedBudget->attachment_path);
                }

                $file = $request->file('attachment');
                $savedBudget->forceFill([
                    'attachment_path' => $file->storeAs(
                        'client-budgets/'.$savedBudget->id,
                        CmsSecurity::safeStoredFilename($file),
                        'public'
                    ),
                    'attachment_name' => $file->getClientOriginalName(),
                ])->save();
            }

            $savedBudget->items()->delete();

            foreach ($budget['items'] as $item) {
                $product = $item['product'];
                $savedBudget->items()->create([
                    'product_id' => $product->id,
                    'family' => $product->family?->name,
                    'code' => $product->sku ?? $product->original_code,
                    'description' => $product->name,
                    'type' => $product->brand ?: ($product->subfamily?->name ?? null),
                    'quantity' => $item['quantity'],
                    'list_price' => $item['list_price'],
                    'discounted_price' => $item['discounted_price'],
                    'discount_percent' => $item['discount_percent'],
                    'sale_price' => $item['sale_price'],
                    'margin_percent' => $this->clientMargin($clientRequest),
                    'subtotal' => $item['sale_price'] * $item['quantity'],
                ]);
            }

            foreach ($budget['services'] as $service) {
                $savedBudget->items()->create([
                    'product_id' => null,
                    'family' => 'Servicio',
                    'code' => null,
                    'description' => $service['name'],
                    'type' => 'Servicio',
                    'quantity' => $service['quantity'],
                    'list_price' => $service['price'],
                    'discounted_price' => $service['discounted_price'],
                    'discount_percent' => $service['price'] > 0
                        ? max(0, (1 - ($service['discounted_price'] / $service['price'])) * 100)
                        : 0,
                    'sale_price' => $service['discounted_price'],
                    'margin_percent' => 0,
                    'subtotal' => $service['subtotal_discount'],
                ]);
            }

            $request->session()->put('client_zone_budget_saved_order_id', $savedBudget->id);

            return $savedBudget;
        });

        return response()->json([
            'message' => 'Presupuesto guardado correctamente.',
            'budget_id' => $savedBudget->id,
            'number' => $savedBudget->order_number,
        ]);
    }

    public function placeOrder(Request $request): RedirectResponse
    {
        $clientRequest = $this->approvedClientRequest($request);
        $cart = $this->cartPayload($request, $clientRequest);

        if ($cart['items']->isEmpty()) {
            return back()->withErrors(['cart' => 'Agregá productos antes de realizar el pedido.']);
        }

        $data = $request->validate([
            'delivery_method' => ['required', 'string', 'max:120'],
            'message' => ['nullable', 'string', 'max:3000'],
            'attachment' => $this->clientAttachmentRules(required: false, maxKilobytes: 10240),
        ]);

        $order = DB::transaction(function () use ($request, $clientRequest, $cart, $data): ClientOrder {
            $order = ClientOrder::query()->create([
                'client_access_request_id' => $clientRequest->id,
                'user_id' => $request->user()?->id,
                'order_number' => $this->nextOrderNumber(),
                'document_type' => ClientOrder::TYPE_ORDER,
                'status' => ClientOrder::STATUS_PENDING,
                'delivery_method' => $data['delivery_method'],
                'message' => $data['message'] ?? null,
                'subtotal_list' => $cart['subtotal_list'],
                'discount_total' => $cart['discount_total'],
                'subtotal_discount' => $cart['subtotal_discount'],
                'iva' => $cart['iva'],
                'total' => $cart['total'],
            ]);

            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $order->forceFill([
                    'attachment_path' => $file->storeAs(
                        'client-orders/'.$order->id,
                        CmsSecurity::safeStoredFilename($file),
                        'public'
                    ),
                    'attachment_name' => $file->getClientOriginalName(),
                ])->save();
            }

            foreach ($cart['items'] as $item) {
                $product = $item['product'];
                $order->items()->create([
                    'product_id' => $product->id,
                    'family' => $product->family?->name,
                    'code' => $product->sku ?? $product->original_code,
                    'description' => $product->name,
                    'type' => $product->brand ?: ($product->subfamily?->name ?? null),
                    'quantity' => $item['quantity'],
                    'list_price' => $item['list_price'],
                    'discounted_price' => $item['discounted_price'],
                    'discount_percent' => $item['discount_percent'],
                    'sale_price' => $item['sale_price'],
                    'margin_percent' => $this->clientMargin($clientRequest),
                    'subtotal' => $item['sale_price'] * $item['quantity'],
                ]);
            }

            return $order;
        });

        $request->session()->forget('client_zone_cart');

        return redirect()
            ->route('web.client-zone.section', 'mis-pedidos')
            ->with('status', "Pedido {$order->order_number} generado correctamente.");
    }

    public function showOrder(Request $request, ClientOrder $clientOrder): View
    {
        $clientRequest = $this->approvedClientRequest($request);
        $this->authorizeClientOrder($clientOrder, $clientRequest);

        return view('web.clients.order-show', [
            'order' => $clientOrder->load(['items', 'clientRequest']),
            'logoDataUri' => $this->logoDataUri(),
            'attachment' => $this->orderAttachmentPayload($clientOrder),
        ]);
    }

    public function downloadOrder(Request $request, ClientOrder $clientOrder)
    {
        $clientRequest = $this->approvedClientRequest($request);
        $this->authorizeClientOrder($clientOrder, $clientRequest);

        $pdf = Pdf::loadView('pdf.client-order', [
            'order' => $clientOrder->load(['items', 'clientRequest']),
            'logoDataUri' => $this->logoDataUri(),
            'attachment' => $this->orderAttachmentPayload($clientOrder),
            'isPdf' => true,
        ])->setPaper('a4', 'landscape');

        return $pdf->download("pedido-{$clientOrder->order_number}.pdf");
    }

    public function viewPriceList(Request $request, ClientPriceListFile $priceListFile)
    {
        $this->authorizedPriceListFile($request, $priceListFile);

        return view('web.clients.price-list-view', [
            'title' => $priceListFile->name,
            'fileName' => $this->safeDownloadName($priceListFile),
            'fileFormat' => $priceListFile->format,
            'fileUrl' => $this->priceListViewerUrl($request, $priceListFile, route('web.client-zone.price-lists.file', $priceListFile)),
            'rawFileUrl' => route('web.client-zone.price-lists.file', $priceListFile),
            'downloadUrl' => route('web.client-zone.price-lists.download', $priceListFile),
            'usesOfficeViewer' => $this->shouldUseOfficeViewer($request, $priceListFile),
        ]);
    }

    public function streamPriceList(Request $request, ClientPriceListFile $priceListFile)
    {
        $this->authorizedPriceListFile($request, $priceListFile);

        return response()->file(Storage::disk($priceListFile->disk)->path($priceListFile->path), [
            'Content-Type' => $priceListFile->mime_type ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="'.$this->safeDownloadName($priceListFile).'"',
        ]);
    }

    public function downloadPriceList(Request $request, ClientPriceListFile $priceListFile)
    {
        $this->authorizedPriceListFile($request, $priceListFile);

        return Storage::disk($priceListFile->disk)->download($priceListFile->path, $this->safeDownloadName($priceListFile));
    }

    public function officePriceListFile(ClientPriceListFile $priceListFile)
    {
        abort_unless(Storage::disk($priceListFile->disk)->exists($priceListFile->path), 404);

        return response()->file(Storage::disk($priceListFile->disk)->path($priceListFile->path), [
            'Content-Type' => $priceListFile->mime_type ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="'.$this->safeDownloadName($priceListFile).'"',
            'Cache-Control' => 'private, max-age=1800',
        ]);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->regenerateToken();

        return redirect()->route('web.home');
    }

    public function suggest(Request $request): JsonResponse
    {
        if ($request->user()?->can_access_admin) {
            Auth::guard('web')->logout();
            $request->session()->regenerateToken();

            return response()->json(['message' => 'Este acceso es solo para clientes.'], 403);
        }

        abort_unless(
            ClientAccessRequest::query()
                ->where('email', $request->user()->email)
                ->where('user_id', $request->user()->id)
                ->where('status', ClientAccessRequest::STATUS_APPROVED)
                ->exists(),
            403,
            'Tu usuario no está aprobado o fue dado de baja.'
        );

        $query = Str::of((string) $request->query('q', ''))->squish()->limit(80, '')->toString();

        if ($query === '') {
            return response()->json([
                'query' => '',
                'groups' => [],
                'insight' => [
                    'headline' => 'Buscador exclusivo de Zona Clientes.',
                    'description' => 'Las sugerencias y resultados se alimentan únicamente de los módulos privados habilitados para clientes.',
                ],
            ]);
        }

        $sections = collect($this->sections())
            ->map(function (string $label, string $slug) use ($query) {
                $haystack = Str::lower($label.' '.$slug);
                $needle = Str::lower($query);

                if (! Str::contains($haystack, $needle)) {
                    return null;
                }

                return [
                    'title' => $label,
                    'url' => $slug === 'productos' ? route('web.client-zone.index') : route('web.client-zone.section', $slug),
                    'context' => 'Zona Clientes',
                    'meta' => 'Sección privada',
                    'match_reason' => 'Disponible dentro de Zona Clientes',
                ];
            })
            ->filter()
            ->values();

        $products = CatalogGrade::query()
            ->with(['series.line'])
            ->where('is_active', true)
            ->where(function ($builder) use ($query) {
                $builder->where('name', 'like', "%{$query}%")
                    ->orWhere('slug', 'like', "%{$query}%")
                    ->orWhere('short_title', 'like', "%{$query}%");
            })
            ->limit(8)
            ->get()
            ->map(fn (CatalogGrade $grade) => [
                'title' => $grade->name,
                'url' => route('web.products.grade', [$grade->series?->line?->slug, $grade->series?->slug, $grade->slug]),
                'context' => 'Productos Zona Clientes',
                'meta' => collect([$grade->series?->line?->name, $grade->series?->name])->filter()->join(' · '),
                'match_reason' => 'Coincide con productos privados',
            ]);

        $groups = collect([
            $sections->isNotEmpty() ? ['title' => 'Secciones Zona Clientes', 'items' => $sections->all()] : null,
            $products->isNotEmpty() ? ['title' => 'Productos Zona Clientes', 'items' => $products->all()] : null,
        ])->filter()->values()->all();

        return response()->json([
            'query' => $query,
            'groups' => $groups,
            'insight' => [
                'headline' => 'Estoy buscando solo dentro de Zona Clientes.',
                'description' => 'Este buscador no consulta la web pública: usa únicamente contenido privado del cliente.',
            ],
        ]);
    }

    protected function sections(): array
    {
        return [
            'productos' => 'Productos',
            'carrito' => 'Carrito',
            'presupuesto' => 'Presupuesto',
            'mis-pedidos' => 'Mis pedidos',
            'lista-de-precios' => 'Lista de precios',
            'info-de-pagos' => 'Info de pagos',
            'margenes' => 'Márgenes',
        ];
    }

    private function approvedClientRequest(Request $request): ClientAccessRequest
    {
        return ClientAccessRequest::query()
            ->where('email', $request->user()->email)
            ->where('user_id', $request->user()->id)
            ->where('status', ClientAccessRequest::STATUS_APPROVED)
            ->firstOrFail();
    }

    private function clientAttachmentRules(bool $required, int $maxKilobytes): array
    {
        return [
            $required ? 'required' : 'nullable',
            'file',
            'max:'.$maxKilobytes,
            'mimes:'.implode(',', CmsSecurity::publicAttachmentExtensions()),
            'mimetypes:'.implode(',', CmsSecurity::publicAttachmentMimeTypes()),
        ];
    }

    private function ordersPayload(ClientAccessRequest $clientRequest)
    {
        return ClientOrder::query()
            ->where('client_access_request_id', $clientRequest->id)
            ->latest()
            ->get();
    }

    private function productsPayload(Request $request, string $section, ClientAccessRequest $clientRequest): array
    {
        $families = ProductFamily::query()
            ->where('is_active', true)
            ->where('show_on_products_page', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $brands = Product::query()
            ->where('is_active', true)
            ->whereNotNull('brand')
            ->distinct()
            ->orderBy('brand')
            ->pluck('brand');

        $models = ProductSubfamily::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->limit(120)
            ->pluck('name');

        if ($section !== 'productos') {
            return [
                'products' => collect(),
                'families' => $families,
                'brands' => $brands,
                'models' => $models,
                'clientMargin' => $this->clientMargin($clientRequest),
                'clientDiscount' => 5,
            ];
        }

        $products = Product::query()
            ->with(['family', 'subfamily'])
            ->where('is_active', true);

        if ($request->filled('q')) {
            $needle = '%'.$request->string('q')->trim().'%';
            $products->where(function ($inner) use ($needle): void {
                $inner->where('name', 'like', $needle)
                    ->orWhere('sku', 'like', $needle)
                    ->orWhere('original_code', 'like', $needle)
                    ->orWhere('equivalence_code', 'like', $needle)
                    ->orWhere('oem_code', 'like', $needle);
            });
        }

        if ($request->filled('codigo')) {
            $products->where('sku', 'like', '%'.$request->string('codigo')->trim().'%');
        }

        if ($request->filled('equivalencia')) {
            $needle = '%'.$request->string('equivalencia')->trim().'%';
            $products->where(function ($inner) use ($needle): void {
                $inner->where('original_code', 'like', $needle)
                    ->orWhere('equivalence_code', 'like', $needle)
                    ->orWhere('oem_code', 'like', $needle);
            });
        }

        if ($request->filled('oem')) {
            $products->where('oem_code', 'like', '%'.$request->string('oem')->trim().'%');
        }

        if ($request->filled('model')) {
            $products->whereHas('subfamily', function ($inner) use ($request): void {
                $inner->where('name', $request->query('model'));
            });
        }

        foreach (['family' => 'product_family_id', 'brand' => 'brand'] as $param => $column) {
            if ($request->filled($param)) {
                $products->where($column, $request->query($param));
            }
        }

        return [
            'products' => $products
                ->orderBy('sort_order')
                ->orderBy('name')
                ->paginate(12)
                ->withQueryString(),
            'families' => $families,
            'brands' => $brands,
            'models' => $models,
            'clientMargin' => $this->clientMargin($clientRequest),
            'clientDiscount' => 5,
        ];
    }

    private function clientMargin(ClientAccessRequest $clientRequest): float
    {
        return (float) data_get($clientRequest->margins, 'price_list_margin', 10);
    }

    private function addProductToSession(Request $request, Product $product, string $sessionKey, string $section, string $message): RedirectResponse
    {
        $this->approvedClientRequest($request);
        abort_unless($product->is_active, 404);

        $data = $request->validate([
            'quantity' => ['nullable', 'integer', 'min:1', 'max:99999'],
        ]);

        $quantity = max(1, (int) ($data['quantity'] ?? 1));
        $cart = $request->session()->get($sessionKey, []);
        $productId = (string) $product->id;
        $cart[$productId] = min(99999, max(0, (int) ($cart[$productId] ?? 0)) + $quantity);
        $request->session()->put($sessionKey, $cart);

        return redirect()
            ->route('web.client-zone.section', $section)
            ->with('status', $message)
            ->with('toast_title', $section === 'presupuesto' ? 'Presupuesto actualizado' : 'Carrito actualizado');
    }

    private function updateProductInSession(Request $request, Product $product, string $sessionKey, string $message): RedirectResponse
    {
        $this->approvedClientRequest($request);

        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:99999'],
        ]);

        $cart = $request->session()->get($sessionKey, []);
        $cart[(string) $product->id] = (int) $data['quantity'];
        $request->session()->put($sessionKey, $cart);

        return back()
            ->with('status', $message)
            ->with('toast_title', str_contains(Str::lower($message), 'presupuesto') ? 'Presupuesto actualizado' : 'Carrito actualizado');
    }

    private function removeProductFromSession(Request $request, Product $product, string $sessionKey, string $message): RedirectResponse
    {
        $this->approvedClientRequest($request);

        $cart = $request->session()->get($sessionKey, []);
        unset($cart[(string) $product->id]);
        $request->session()->put($sessionKey, $cart);

        return back()
            ->with('status', $message)
            ->with('toast_title', str_contains(Str::lower($message), 'presupuesto') ? 'Presupuesto actualizado' : 'Carrito actualizado');
    }

    private function cartPayload(Request $request, ClientAccessRequest $clientRequest, string $sessionKey = 'client_zone_cart'): array
    {
        $cart = collect($request->session()->get($sessionKey, []))
            ->mapWithKeys(fn ($quantity, $productId) => [(int) $productId => max(1, (int) $quantity)])
            ->filter(fn ($quantity, $productId) => $productId > 0);

        if ($cart->isEmpty()) {
            return [
                'items' => collect(),
                'subtotal_list' => 0.0,
                'discount_total' => 0.0,
                'subtotal_discount' => 0.0,
                'iva' => 0.0,
                'total' => 0.0,
            ];
        }

        $clientMargin = $this->clientMargin($clientRequest);

        $items = Product::query()
            ->with(['family', 'subfamily'])
            ->whereIn('id', $cart->keys())
            ->where('is_active', true)
            ->get()
            ->map(function (Product $product) use ($cart, $clientMargin): array {
                $quantity = (int) $cart->get($product->id, 1);
                $listPrice = (float) ($product->price ?? 0);
                $discountedPrice = (float) ($product->discount_price ?? $listPrice);
                $discountPercent = $listPrice > 0 ? max(0, (1 - ($discountedPrice / $listPrice)) * 100) : 0;
                $salePrice = $discountedPrice * (1 + ($clientMargin / 100));
                $subtotalList = $listPrice * $quantity;
                $subtotalDiscount = $discountedPrice * $quantity;

                return [
                    'product' => $product,
                    'quantity' => $quantity,
                    'list_price' => $listPrice,
                    'discounted_price' => $discountedPrice,
                    'discount_percent' => $discountPercent,
                    'sale_price' => $salePrice,
                    'subtotal_list' => $subtotalList,
                    'discount_total' => max(0, $subtotalList - $subtotalDiscount),
                    'subtotal_discount' => $subtotalDiscount,
                ];
            })
            ->values();

        $subtotalList = (float) $items->sum('subtotal_list');
        $subtotalDiscount = (float) $items->sum('subtotal_discount');
        $discountTotal = (float) $items->sum('discount_total');
        $iva = $subtotalDiscount * 0.21;

        return [
            'items' => $items,
            'subtotal_list' => $subtotalList,
            'discount_total' => $discountTotal,
            'subtotal_discount' => $subtotalDiscount,
            'iva' => $iva,
            'total' => $subtotalDiscount + $iva,
        ];
    }

    private function budgetPayload(Request $request, ClientAccessRequest $clientRequest): array
    {
        $products = $this->cartPayload($request, $clientRequest, 'client_zone_budget');
        $services = $this->selectedBudgetServicesPayload($request);

        $subtotalList = (float) $products['subtotal_list'] + (float) $services->sum('subtotal_list');
        $subtotalDiscount = (float) $products['subtotal_discount'] + (float) $services->sum('subtotal_discount');
        $discountTotal = (float) $products['discount_total'] + (float) $services->sum('discount_total');
        $iva = $subtotalDiscount * 0.21;

        return [
            ...$products,
            'services' => $services,
            'subtotal_list' => $subtotalList,
            'discount_total' => $discountTotal,
            'subtotal_discount' => $subtotalDiscount,
            'iva' => $iva,
            'total' => $subtotalDiscount + $iva,
        ];
    }

    private function selectedBudgetServicesPayload(Request $request)
    {
        return collect($request->session()->get('client_zone_budget_services', []))
            ->map(function ($service, $serviceId): ?array {
                if (! is_array($service)) {
                    return null;
                }

                $quantity = max(1, (int) ($service['quantity'] ?? 1));
                $price = round((float) ($service['price'] ?? 0), 2);
                $discountedPrice = round((float) ($service['discounted_price'] ?? $service['discount_price'] ?? $price), 2);
                $subtotalList = $price * $quantity;
                $subtotalDiscount = $discountedPrice * $quantity;

                return [
                    'id' => (string) ($service['id'] ?? $serviceId),
                    'name' => (string) ($service['name'] ?? 'Servicio'),
                    'quantity' => $quantity,
                    'price' => $price,
                    'discounted_price' => $discountedPrice,
                    'subtotal_list' => $subtotalList,
                    'discount_total' => max(0, $subtotalList - $subtotalDiscount),
                    'subtotal_discount' => $subtotalDiscount,
                ];
            })
            ->filter()
            ->values();
    }

    private function priceListsPayload(ClientAccessRequest $clientRequest)
    {
        return ClientPriceListFile::query()
            ->where('is_active', true)
            ->whereHas('clients', fn ($query) => $query->whereKey($clientRequest->id))
            ->orderBy('sort_code')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ClientPriceListFile $file): array => [
                'id' => $file->id,
                'name' => $file->name,
                'format' => $file->format,
                'size' => $this->humanFileSize($file->size_bytes),
                'view_url' => route('web.client-zone.price-lists.view', $file),
                'download_url' => route('web.client-zone.price-lists.download', $file),
            ]);
    }

    private function paymentInfoPayload(ClientAccessRequest $clientRequest): array
    {
        $settings = ClientPaymentSetting::current();

        return [
            'settings' => [
                'bank_title' => $settings->bank_title,
                'bank_details' => $settings->bank_details,
                'terms_title' => $settings->terms_title,
                'terms_details' => $settings->terms_details,
                'receipt_note' => $settings->receipt_note,
            ],
            'receipts' => ClientPaymentReceipt::query()
                ->where('client_access_request_id', $clientRequest->id)
                ->latest()
                ->get()
                ->map(fn (ClientPaymentReceipt $receipt): array => [
                    'id' => $receipt->id,
                    'paid_at' => optional($receipt->paid_at)->format('d/m/Y'),
                    'amount' => '$'.number_format((float) $receipt->amount, 2, ',', '.'),
                    'bank' => $receipt->bank,
                    'branch' => $receipt->branch,
                    'invoices' => $receipt->invoices ?: '-',
                    'observations' => $receipt->observations,
                    'status' => $receipt->status,
                    'status_label' => ClientPaymentReceipt::statuses()[$receipt->status] ?? $receipt->status,
                    'admin_notes' => $receipt->admin_notes,
                    'reviewed_at' => optional($receipt->reviewed_at)->format('d/m/Y H:i'),
                    'created_at' => optional($receipt->created_at)->format('d/m/Y H:i'),
                ]),
        ];
    }

    private function humanFileSize(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            return number_format($bytes / 1024 / 1024, 1, ',', '.').'mb';
        }

        return max(1, (int) ceil($bytes / 1024)).'kb';
    }

    private function safeDownloadName(ClientPriceListFile $file): string
    {
        $extension = strtolower(pathinfo($file->original_name, PATHINFO_EXTENSION) ?: $file->format);
        $name = Str::slug($file->name) ?: 'lista-de-precios';

        return $name.'.'.$extension;
    }

    private function authorizedPriceListFile(Request $request, ClientPriceListFile $priceListFile): void
    {
        $clientRequest = $this->approvedClientRequest($request);

        abort_unless($priceListFile->is_active, 404);
        abort_unless($priceListFile->clients()->whereKey($clientRequest->id)->exists(), 404);
        abort_unless(Storage::disk($priceListFile->disk)->exists($priceListFile->path), 404);
    }

    private function priceListViewerUrl(Request $request, ClientPriceListFile $file, string $fallbackUrl): string
    {
        if (! $this->shouldUseOfficeViewer($request, $file)) {
            return $fallbackUrl;
        }

        $sourceUrl = URL::temporarySignedRoute(
            'web.client-zone.price-lists.office-file',
            now()->addMinutes(30),
            $file,
        );

        return 'https://view.officeapps.live.com/op/embed.aspx?src='.rawurlencode($sourceUrl);
    }

    private function shouldUseOfficeViewer(Request $request, ClientPriceListFile $file): bool
    {
        if ($file->format !== 'EXCEL' || app()->environment(['local', 'testing'])) {
            return false;
        }

        $host = $request->getHost();

        return ! in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    }

    private function nextOrderNumber(): string
    {
        $nextId = ((int) ClientOrder::query()
            ->where('document_type', ClientOrder::TYPE_ORDER)
            ->max('order_number')) + 1;

        return str_pad((string) $nextId, 7, '0', STR_PAD_LEFT);
    }

    private function nextBudgetNumber(): string
    {
        $nextId = ((int) ClientOrder::query()->where('document_type', ClientOrder::TYPE_BUDGET)->count()) + 1;

        return 'PRES-'.str_pad((string) $nextId, 7, '0', STR_PAD_LEFT);
    }

    private function authorizeClientOrder(ClientOrder $order, ClientAccessRequest $clientRequest): void
    {
        abort_unless((int) $order->client_access_request_id === (int) $clientRequest->id, 403);
    }

    private function logoDataUri(): string
    {
        $path = public_path('storage/brand/logo.svg');

        if (! is_file($path)) {
            return '';
        }

        return 'data:image/svg+xml;base64,'.base64_encode((string) file_get_contents($path));
    }

    private function orderAttachmentPayload(ClientOrder $order): ?array
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
}
