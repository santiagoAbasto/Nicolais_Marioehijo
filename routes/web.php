<?php

use App\Http\Controllers\Admin\CatalogImportBatchController;
use App\Http\Controllers\Admin\CatalogCompositionController;
use App\Http\Controllers\Admin\CatalogHubController;
use App\Http\Controllers\Admin\CatalogNormasAdminController;
use App\Http\Controllers\Admin\CatalogTechnicalContentController;
use App\Http\Controllers\Admin\ContactAdminController;
use App\Http\Controllers\Admin\ClientZoneController as AdminClientZoneController;
use App\Http\Controllers\Admin\MediaAssetController;
use App\Http\Controllers\Admin\AboutPageController;
use App\Http\Controllers\Admin\ApplicationsAdminController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FooterSettingsController;
use App\Http\Controllers\Admin\HomeAdminController;
use App\Http\Controllers\Admin\HomeHeroSlideController;
use App\Http\Controllers\Admin\NewsAdminController;
use App\Http\Controllers\Admin\NewsletterAdminController;
use App\Http\Controllers\Admin\OfferAdminController;
use App\Http\Controllers\Admin\PostCategoryController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\ProductApiController;
use App\Http\Controllers\Admin\ProductCatalogAdminController;
use App\Http\Controllers\Admin\ProductFamilyApiController;
use App\Http\Controllers\Admin\ProductImportController;
use App\Http\Controllers\Admin\ProductSubfamilyApiController;
use App\Http\Controllers\Admin\QuoteAdminController;
use App\Http\Controllers\Admin\QualityAdminController;
use App\Http\Controllers\Admin\SeoController;
use App\Http\Controllers\Admin\SiteSectionController;
use App\Http\Controllers\Admin\SocialLinksController;
use App\Http\Controllers\Admin\UserAdminController;
use App\Http\Controllers\Admin\WeightCalculatorAdminController;
use App\Http\Controllers\Admin\WhatsAppController;
use App\Http\Controllers\Admin\WorkspaceController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProtectedMediaController;
use App\Http\Controllers\Web\AboutController;
use App\Http\Controllers\Web\ApplicationsController;
use App\Http\Controllers\Web\CatalogController;
use App\Http\Controllers\Web\ClientController;
use App\Http\Controllers\Web\ClientZoneController;
use App\Http\Controllers\Web\ContactController;
use App\Http\Controllers\Web\HomeController;
use App\Http\Controllers\Web\NewsController;
use App\Http\Controllers\Web\NewsletterController;
use App\Http\Controllers\Web\OffersController;
use App\Http\Controllers\Web\PartnerController;
use App\Http\Controllers\Web\ProductCatalogController;
use App\Http\Controllers\Web\QualityController;
use App\Http\Controllers\Web\QuoteController;
use App\Http\Controllers\Web\SearchController;
use App\Http\Controllers\Web\SiteIndexController;
use App\Http\Controllers\Web\SitePresenceController;
use App\Http\Controllers\Web\WeightCalculatorController;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/site.webmanifest', function () {
    $manifestPath = public_path('site.webmanifest');

    if (File::exists($manifestPath)) {
        return response()->file($manifestPath, [
            'Content-Type' => 'application/manifest+json',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    return response()->json([
        'name' => config('app.name', 'Nicolais Mario e Hijo'),
        'short_name' => 'Nicolais',
        'start_url' => '/',
        'display' => 'standalone',
        'background_color' => '#ffffff',
        'theme_color' => '#000000',
        'icons' => [
            [
                'src' => '/favicon/web-app-manifest-192x192.png',
                'sizes' => '192x192',
                'type' => 'image/png',
            ],
            [
                'src' => '/favicon/web-app-manifest-512x512.png',
                'sizes' => '512x512',
                'type' => 'image/png',
            ],
        ],
    ], 200, [
        'Content-Type' => 'application/manifest+json',
        'Cache-Control' => 'public, max-age=3600',
    ]);
})->name('web.manifest');

Route::get('/robots.txt', [SiteIndexController::class, 'robots'])->name('web.robots');
Route::get('/sitemap.xml', [SiteIndexController::class, 'sitemap'])->name('web.sitemap');

Route::get('/', [HomeController::class, 'index'])->name('web.home');
Route::get('/inicio', fn () => redirect('/'));

Route::get('/dashboard', fn () => redirect('/admin/dashboard'))
    ->middleware('auth:admin')
    ->name('dashboard');

Route::get('/media/{path}', [ProtectedMediaController::class, 'show'])
    ->where('path', '.*')
    ->name('media.show');
Route::get('/media-assets/{mediaAsset}/{slug?}', [ProtectedMediaController::class, 'showAsset'])
    ->where('slug', '.*')
    ->name('media.assets.show');

Route::get('/nosotros', [AboutController::class, 'show'])->name('web.about');
Route::get('/aplicaciones', [ApplicationsController::class, 'show'])->name('web.applications');
Route::get('/aplicaciones/{applicationSlug}', [ApplicationsController::class, 'detail'])->name('web.applications.detail');
Route::get('/calculadora', fn () => redirect()->route('web.calculator.index'));
Route::get('/calculadora-de-pesos', [WeightCalculatorController::class, 'index'])->name('web.calculator.index');
Route::post('/calculadora-de-pesos/uso', [WeightCalculatorController::class, 'storeUsage'])
    ->middleware('throttle:60,1')
    ->name('web.calculator.usage');
Route::get('/productos', [ProductCatalogController::class, 'index'])->name('web.products.index');
Route::get('/productos/todos-los-productos', [ProductCatalogController::class, 'all'])->name('web.products.all');
Route::get('/productos/{lineSlug}', [ProductCatalogController::class, 'line'])->name('web.products.line');
Route::get('/productos/{lineSlug}/{seriesSlug}', [ProductCatalogController::class, 'series'])->name('web.products.series');
Route::get('/productos/{lineSlug}/{seriesSlug}/{gradeSlug}', [ProductCatalogController::class, 'grade'])->name('web.products.grade');
Route::get('/productos/{lineSlug}/{seriesSlug}/{gradeSlug}/ficha-tecnica', [ProductCatalogController::class, 'technicalSheet'])->name('web.products.technical-sheet');
Route::get('/calidad', [QualityController::class, 'show'])->name('web.quality');
Route::get('/ofertas', [OffersController::class, 'index'])->name('web.offers.index');
Route::get('/novedades', [NewsController::class, 'index'])->name('web.news.index');
Route::get('/novedades/{slug}', [NewsController::class, 'show'])->name('web.news.show');
Route::get('/catalogo', [CatalogController::class, 'show'])->name('web.catalog.show');
Route::post('/catalogo', [CatalogController::class, 'store'])
    ->middleware(['throttle:5,1', 'public.form.protection'])
    ->name('web.catalog.store');
Route::get('/representadas', [PartnerController::class, 'index'])->name('web.partners.index');
Route::get('/clientes', [ClientController::class, 'index'])->name('web.clients.index');
Route::post('/clientes/login', [ClientController::class, 'login'])
    ->middleware(app()->isLocal() ? 'throttle:120,1' : 'throttle:10,1')
    ->name('web.clients.login');
Route::post('/clientes/solicitud', [ClientController::class, 'store'])
    ->middleware(['throttle:5,1', 'public.form.protection'])
    ->name('web.clients.store');
Route::get('/zona-clientes/lista-de-precios/{priceListFile}/office-file', [ClientZoneController::class, 'officePriceListFile'])
    ->middleware('signed')
    ->name('web.client-zone.price-lists.office-file');
Route::middleware('client.zone.access')->prefix('zona-clientes')->name('web.client-zone.')->group(function () {
    Route::get('/', [ClientZoneController::class, 'index'])->name('index');
    Route::get('/buscar/sugerencias', [ClientZoneController::class, 'suggest'])->middleware('throttle:180,1')->name('suggest');
    Route::post('/carrito/agregar/{product}', [ClientZoneController::class, 'addToCart'])->name('cart.add');
    Route::patch('/carrito/{product}', [ClientZoneController::class, 'updateCart'])->name('cart.update');
    Route::delete('/carrito/{product}', [ClientZoneController::class, 'removeFromCart'])->name('cart.remove');
    Route::post('/carrito/pedido', [ClientZoneController::class, 'placeOrder'])->name('cart.order');
    Route::post('/presupuesto/agregar/{product}', [ClientZoneController::class, 'addToBudget'])->name('budget.add');
    Route::post('/presupuesto/servicios', [ClientZoneController::class, 'storeBudgetService'])->name('budget.services.store');
    Route::delete('/presupuesto/servicios/{serviceKey}', [ClientZoneController::class, 'removeBudgetService'])->name('budget.services.remove');
    Route::post('/presupuesto/guardar', [ClientZoneController::class, 'saveBudget'])->name('budget.save');
    Route::patch('/presupuesto/{product}', [ClientZoneController::class, 'updateBudget'])->name('budget.update');
    Route::delete('/presupuesto/{product}', [ClientZoneController::class, 'removeFromBudget'])->name('budget.remove');
    Route::get('/lista-de-precios/{priceListFile}/ver', [ClientZoneController::class, 'viewPriceList'])->name('price-lists.view');
    Route::get('/lista-de-precios/{priceListFile}/archivo', [ClientZoneController::class, 'streamPriceList'])->name('price-lists.file');
    Route::get('/lista-de-precios/{priceListFile}/descargar', [ClientZoneController::class, 'downloadPriceList'])->name('price-lists.download');
    Route::post('/info-de-pagos', [ClientZoneController::class, 'storePaymentReceipt'])->name('payments.store');
    Route::get('/pedidos/{clientOrder}', [ClientZoneController::class, 'showOrder'])->name('orders.show');
    Route::get('/pedidos/{clientOrder}/pdf', [ClientZoneController::class, 'downloadOrder'])->name('orders.pdf');
    Route::post('/margenes', [ClientZoneController::class, 'updateMargins'])->name('margins.update');
    Route::post('/salir', [ClientZoneController::class, 'logout'])->name('logout');
    Route::get('/{section}', [ClientZoneController::class, 'index'])->name('section');
});
Route::get('/presupuesto', [QuoteController::class, 'show'])->name('web.quote.show');
Route::post('/presupuesto', [QuoteController::class, 'store'])
    ->middleware(['throttle:5,1', 'public.form.protection'])
    ->name('web.quote.store');
Route::get('/contacto', [ContactController::class, 'show'])->name('web.contact.show');
Route::post('/contacto', [ContactController::class, 'store'])
    ->middleware([app()->isLocal() ? 'throttle:120,1' : 'throttle:5,1', 'public.form.protection'])
    ->name('web.contact.store');
Route::post('/newsletter', [NewsletterController::class, 'store'])
    ->middleware([app()->isLocal() ? 'throttle:120,1' : 'throttle:10,1', 'public.form.protection'])
    ->name('web.newsletter.store');
Route::get('/newsletter/desuscribirse/{subscriber}/{token}', [NewsletterController::class, 'unsubscribe'])
    ->middleware('throttle:20,1')
    ->name('web.newsletter.unsubscribe');
Route::post('/newsletter/desuscribirse/{subscriber}/{token}', [NewsletterController::class, 'unsubscribeOneClick'])
    ->middleware('throttle:20,1')
    ->name('web.newsletter.unsubscribe.one-click');
Route::get('/buscar', [SearchController::class, 'index'])->middleware('throttle:120,1')->name('web.search.index');
Route::get('/buscar/sugerencias', [SearchController::class, 'suggest'])->middleware('throttle:180,1')->name('web.search.suggest');
Route::post('/presencia/heartbeat', [SitePresenceController::class, 'heartbeat'])->middleware('throttle:180,1')->name('web.presence.heartbeat');
Route::post('/presencia/salir', [SitePresenceController::class, 'leave'])->middleware('throttle:180,1')->name('web.presence.leave');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware(['auth:admin', 'admin.access'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::get('/home', [HomeAdminController::class, 'index'])->name('home.index');
        Route::get('/home/sliders', [HomeAdminController::class, 'sliders'])->name('home.sliders');
        Route::get('/home/about', [HomeAdminController::class, 'about'])->name('home.about');
        Route::get('/home/presupuesto', [HomeAdminController::class, 'quote'])->name('home.quote');
        Route::get('/nosotros', [AboutPageController::class, 'index'])->name('about.index');
        Route::get('/presupuesto', [QuoteAdminController::class, 'index'])->name('quote.index');
        Route::get('/presupuesto/consultas', [QuoteAdminController::class, 'requests'])->name('quote.requests');
        Route::get('/productos', [ProductCatalogAdminController::class, 'index'])->name('products.index');
        Route::get('/productos/template', [ProductCatalogAdminController::class, 'template'])->name('products.import-template');
        
        Route::get('/productos/taxonomia', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'index'])->name('products.taxonomy');
        Route::post('/productos/taxonomia/familias', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'storeFamily'])->name('products.taxonomy.families.store');
        Route::put('/productos/taxonomia/familias/{family}', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'updateFamily'])->name('products.taxonomy.families.update');
        Route::delete('/productos/taxonomia/familias/{family}', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'destroyFamily'])->name('products.taxonomy.families.destroy');
        Route::post('/productos/taxonomia/familias/{family}/lineas', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'storeLine'])->name('products.taxonomy.lines.store');
        Route::put('/productos/taxonomia/lineas/{line}', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'updateLine'])->name('products.taxonomy.lines.update');
        Route::delete('/productos/taxonomia/lineas/{line}', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'destroyLine'])->name('products.taxonomy.lines.destroy');

        // Series CRUD (under a Line)
        Route::get('/productos/taxonomia/lineas/{line}/series', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'lineSeriesIndex'])->name('products.taxonomy.lines.series');
        Route::post('/productos/taxonomia/lineas/{line}/series', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'storeSeries'])->name('products.taxonomy.series.store');
        Route::put('/productos/taxonomia/series/{series}', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'updateSeries'])->name('products.taxonomy.series.update');
        Route::delete('/productos/taxonomia/series/{series}', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'destroySeries'])->name('products.taxonomy.series.destroy');

        // Grade CRUD (under a Series)
        Route::post('/productos/taxonomia/series/{series}/grados', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'storeGrade'])->name('products.taxonomy.grades.store');
        Route::put('/productos/taxonomia/grados/{grade}', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'updateGrade'])->name('products.taxonomy.grades.update');
        Route::delete('/productos/taxonomia/grados/{grade}', [\App\Http\Controllers\Admin\CatalogTaxonomyController::class, 'destroyGrade'])->name('products.taxonomy.grades.destroy');

        Route::get('/productos/contenido-tecnico', [CatalogTechnicalContentController::class, 'index'])->name('products.technical-content');
        Route::put('/productos/contenido-tecnico/lineas/{line}', [CatalogTechnicalContentController::class, 'updateLine'])->name('products.technical-content.lines.update');
        Route::put('/productos/contenido-tecnico/series/{series}', [CatalogTechnicalContentController::class, 'updateSeries'])->name('products.technical-content.series.update');
        Route::put('/productos/contenido-tecnico/grados/{grade}', [CatalogTechnicalContentController::class, 'updateGrade'])->name('products.technical-content.grades.update');

        Route::get('/productos/composicion-quimica', [CatalogCompositionController::class, 'index'])->name('products.composition');
        Route::put('/productos/composicion-quimica/lineas/{line}', [CatalogCompositionController::class, 'updateLine'])->name('products.composition.lines.update');
        Route::put('/productos/composicion-quimica/series/{series}', [CatalogCompositionController::class, 'updateSeries'])->name('products.composition.series.update');
        Route::put('/productos/composicion-quimica/grados/{grade}', [CatalogCompositionController::class, 'updateGrade'])->name('products.composition.grades.update');
        Route::post('/productos/composicion-quimica/elementos', [CatalogCompositionController::class, 'storeElement'])->name('products.composition.elements.store');
        Route::put('/productos/composicion-quimica/elementos/{element}', [CatalogCompositionController::class, 'updateElement'])->name('products.composition.elements.update');
        Route::delete('/productos/composicion-quimica/elementos/{element}', [CatalogCompositionController::class, 'destroyElement'])->name('products.composition.elements.destroy');
        Route::get('/productos/normas', [CatalogNormasAdminController::class, 'index'])->name('products.normas.index');
        Route::post('/productos/normas', [CatalogNormasAdminController::class, 'store'])->name('products.normas.store');
        Route::post('/productos/normas/preview', [CatalogNormasAdminController::class, 'preview'])->name('products.normas.preview');
        Route::post('/productos/normas/importar', [CatalogNormasAdminController::class, 'import'])->name('products.normas.import');
        Route::get('/productos/normas/exportar', [CatalogNormasAdminController::class, 'export'])->name('products.normas.export');
        Route::delete('/productos/normas/importadas', [CatalogNormasAdminController::class, 'destroyImported'])->name('products.normas.destroy-imported');
        Route::put('/productos/normas/{norma}', [CatalogNormasAdminController::class, 'update'])->name('products.normas.update');
        Route::delete('/productos/normas/{norma}', [CatalogNormasAdminController::class, 'destroy'])->name('products.normas.destroy');
        Route::put('/productos/normas/{norma}/grados', [CatalogNormasAdminController::class, 'syncGrades'])->name('products.normas.sync-grades');
        Route::get('/productos/excel-stock', [\App\Http\Controllers\Admin\CatalogStockImportController::class, 'index'])->name('products.stock-importer');
        Route::post('/productos/excel-stock/preview', [\App\Http\Controllers\Admin\CatalogStockImportController::class, 'preview'])->name('products.stock-importer.preview');
        Route::post('/productos/excel-stock', [\App\Http\Controllers\Admin\CatalogStockImportController::class, 'store'])->name('products.stock-importer.store');
        Route::get('/productos/excel-stock/exportar', [\App\Http\Controllers\Admin\CatalogStockImportController::class, 'export'])->name('products.stock-importer.export');
        Route::post('/productos/excel-stock/reprocesar-ultimo', [\App\Http\Controllers\Admin\CatalogStockImportController::class, 'reprocessLatest'])->name('products.stock-importer.reprocess-latest');
        Route::delete('/productos/excel-stock/historial', [\App\Http\Controllers\Admin\CatalogStockImportController::class, 'destroyHistory'])->name('products.stock-importer.destroy-history');
        Route::delete('/productos/publicado', [\App\Http\Controllers\Admin\CatalogPublicResetController::class, 'destroy'])->name('products.public-reset.destroy');

        Route::get('/productos/importador', [\App\Http\Controllers\Admin\CatalogReferenceImportController::class, 'index'])->name('products.reference-importer');
        Route::post('/productos/importador/preview', [\App\Http\Controllers\Admin\CatalogReferenceImportController::class, 'preview'])->name('products.reference-importer.preview');
        Route::post('/productos/importador', [\App\Http\Controllers\Admin\CatalogReferenceImportController::class, 'store'])->name('products.reference-importer.store');
        Route::get('/productos/importador/exportar', [\App\Http\Controllers\Admin\CatalogReferenceImportController::class, 'export'])->name('products.reference-importer.export');
        Route::delete('/productos/importador/importados', [\App\Http\Controllers\Admin\CatalogReferenceImportController::class, 'destroyImported'])->name('products.reference-importer.destroy-imported');
        Route::delete('/productos/importador/historial', [\App\Http\Controllers\Admin\CatalogReferenceImportController::class, 'destroyHistory'])->name('products.reference-importer.destroy-history');
        Route::get('/productos/mappings', [WorkspaceController::class, 'productsMappings'])->name('products.mappings');
        Route::get('/productos/importaciones', [WorkspaceController::class, 'productsImports'])->name('products.imports');
        Route::get('/catalog', [CatalogHubController::class, 'index'])->name('catalog.index');
        Route::get('/aplicaciones', [ApplicationsAdminController::class, 'index'])->name('applications.index');
        Route::get('/calidad', [QualityAdminController::class, 'index'])->name('quality.index');
        Route::get('/ofertas', [OfferAdminController::class, 'index'])->name('offers.index');
        Route::post('/ofertas', [OfferAdminController::class, 'store'])->name('offers.store');
        Route::put('/ofertas/{offerCard}', [OfferAdminController::class, 'update'])->name('offers.update');
        Route::delete('/ofertas/{offerCard}', [OfferAdminController::class, 'destroy'])->name('offers.destroy');
        Route::get('/novedades', [NewsAdminController::class, 'index'])->name('news.index');
        Route::get('/novedades/create', [NewsAdminController::class, 'create'])->name('news.create');
        Route::get('/novedades/{post}/edit', [NewsAdminController::class, 'edit'])->name('news.edit');
        Route::get('/newsletter', [NewsletterAdminController::class, 'index'])->name('newsletter.index');
        Route::get('/contact', [ContactAdminController::class, 'redirectLegacy'])->name('contact.legacy');
        Route::get('/contacto', [ContactAdminController::class, 'index'])->name('contact.index');
        Route::get('/zona-cliente/usuarios', [AdminClientZoneController::class, 'users'])->name('client-zone.users');
        Route::post('/zona-cliente/usuarios/{clientAccessRequest}/aprobar', [AdminClientZoneController::class, 'approve'])->name('client-zone.users.approve');
        Route::post('/zona-cliente/usuarios/{clientAccessRequest}/rechazar', [AdminClientZoneController::class, 'reject'])->name('client-zone.users.reject');
        Route::post('/zona-cliente/usuarios/{clientAccessRequest}/restablecer', [AdminClientZoneController::class, 'resetPassword'])->name('client-zone.users.reset-password');
        Route::post('/zona-cliente/usuarios/{clientAccessRequest}/actualizar-clave', [AdminClientZoneController::class, 'updatePassword'])->name('client-zone.users.update-password');
        Route::post('/zona-cliente/usuarios/{clientAccessRequest}/baja', [AdminClientZoneController::class, 'deactivate'])->name('client-zone.users.deactivate');
        Route::get('/zona-cliente/productos', [AdminClientZoneController::class, 'products'])->name('client-zone.products');
        Route::patch('/zona-cliente/productos/descuento-global', [AdminClientZoneController::class, 'updateGlobalProductDiscount'])->name('client-zone.products.discount-global');
        Route::patch('/zona-cliente/productos/{product}/descuento', [AdminClientZoneController::class, 'updateProductDiscount'])->name('client-zone.products.discount');
        Route::get('/zona-cliente/carrito', [AdminClientZoneController::class, 'orders'])->name('client-zone.orders');
        Route::get('/zona-cliente/presupuesto', [AdminClientZoneController::class, 'budgets'])->name('client-zone.budgets');
        Route::get('/zona-cliente/presupuesto/{clientOrder}', [AdminClientZoneController::class, 'showBudget'])->name('client-zone.budgets.show');
        Route::get('/zona-cliente/presupuesto/{clientOrder}/pdf', [AdminClientZoneController::class, 'downloadBudget'])->name('client-zone.budgets.pdf');
        Route::get('/zona-cliente/pedidos', [AdminClientZoneController::class, 'orders'])->name('client-zone.orders.index');
        Route::patch('/zona-cliente/pedidos/{clientOrder}', [AdminClientZoneController::class, 'updateOrder'])->name('client-zone.orders.update');
        Route::get('/zona-cliente/pedidos/{clientOrder}', [AdminClientZoneController::class, 'showOrder'])->name('client-zone.orders.show');
        Route::get('/zona-cliente/pedidos/{clientOrder}/pdf', [AdminClientZoneController::class, 'downloadOrder'])->name('client-zone.orders.pdf');
        Route::get('/zona-cliente/lista-de-precios', [AdminClientZoneController::class, 'priceLists'])->name('client-zone.price-lists');
        Route::post('/zona-cliente/lista-de-precios', [AdminClientZoneController::class, 'storePriceList'])->name('client-zone.price-lists.store');
        Route::get('/zona-cliente/lista-de-precios/{priceListFile}/ver', [AdminClientZoneController::class, 'viewPriceList'])->name('client-zone.price-lists.view');
        Route::get('/zona-cliente/lista-de-precios/{priceListFile}/archivo', [AdminClientZoneController::class, 'streamPriceList'])->name('client-zone.price-lists.file');
        Route::get('/zona-cliente/lista-de-precios/{priceListFile}/descargar', [AdminClientZoneController::class, 'downloadPriceList'])->name('client-zone.price-lists.download');
        Route::put('/zona-cliente/lista-de-precios/{priceListFile}', [AdminClientZoneController::class, 'updatePriceList'])->name('client-zone.price-lists.update');
        Route::delete('/zona-cliente/lista-de-precios/{priceListFile}', [AdminClientZoneController::class, 'destroyPriceList'])->name('client-zone.price-lists.destroy');
        Route::get('/zona-cliente/info-de-pagos', [AdminClientZoneController::class, 'paymentInfo'])->name('client-zone.payments');
        Route::put('/zona-cliente/info-de-pagos/configuracion', [AdminClientZoneController::class, 'updatePaymentInfo'])->name('client-zone.payments.settings');
        Route::patch('/zona-cliente/info-de-pagos/comprobantes/{paymentReceipt}', [AdminClientZoneController::class, 'updatePaymentReceipt'])->name('client-zone.payments.update');
        Route::get('/zona-cliente/info-de-pagos/comprobantes/{paymentReceipt}/archivo', [AdminClientZoneController::class, 'downloadPaymentReceipt'])->name('client-zone.payments.download');
        Route::get('/zona-cliente/{module}', [AdminClientZoneController::class, 'template'])->name('client-zone.template');
        Route::get('/calculadora', [WeightCalculatorAdminController::class, 'index'])->name('calculator.index');
        Route::post('/calculadora/importar', [WeightCalculatorAdminController::class, 'import'])->name('calculator.import');
        Route::post('/calculadora/materiales', [WeightCalculatorAdminController::class, 'storeMaterial'])->name('calculator.materials.store');
        Route::put('/calculadora/materiales/{material}', [WeightCalculatorAdminController::class, 'updateMaterial'])->name('calculator.materials.update');
        Route::delete('/calculadora/materiales/{material}', [WeightCalculatorAdminController::class, 'destroyMaterial'])->name('calculator.materials.destroy');
        Route::post('/calculadora/canos', [WeightCalculatorAdminController::class, 'storePipeStandard'])->name('calculator.pipe-standards.store');
        Route::put('/calculadora/canos/{pipeStandard}', [WeightCalculatorAdminController::class, 'updatePipeStandard'])->name('calculator.pipe-standards.update');
        Route::delete('/calculadora/canos/{pipeStandard}', [WeightCalculatorAdminController::class, 'destroyPipeStandard'])->name('calculator.pipe-standards.destroy');
        Route::post('/calculadora/formulas', [WeightCalculatorAdminController::class, 'storeShape'])->name('calculator.shapes.store');
        Route::put('/calculadora/formulas/{shape}', [WeightCalculatorAdminController::class, 'updateShape'])->name('calculator.shapes.update');
        Route::delete('/calculadora/formulas/{shape}', [WeightCalculatorAdminController::class, 'destroyShape'])->name('calculator.shapes.destroy');
        Route::post('/calculadora/formulas-base', [WeightCalculatorAdminController::class, 'syncDefaultShapes'])->name('calculator.shapes.sync-defaults');
        Route::get('/whatsapp', [WhatsAppController::class, 'index'])->name('whatsapp.index');
        Route::get('/footer', [FooterSettingsController::class, 'index'])->name('footer.index');
        Route::get('/redes-sociales', [SocialLinksController::class, 'index'])->name('social-links.index');

        Route::get('/metadatos', [SeoController::class, 'index'])->name('seo.index');
        Route::post('/metadatos', [SeoController::class, 'upsert'])->name('seo.upsert');

        Route::get('/users', [UserAdminController::class, 'index'])->name('users.index');
        Route::post('/users', [UserAdminController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserAdminController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserAdminController::class, 'destroy'])->name('users.destroy');

        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

        Route::prefix('api')->name('api.')->middleware(app()->isLocal() ? 'throttle:240,1' : 'throttle:120,1')->group(function () {
            Route::post('/catalog-imports', [CatalogImportBatchController::class, 'store'])->name('catalog-imports.store');
            Route::get('/catalog-imports/{batch}', [CatalogImportBatchController::class, 'show'])->name('catalog-imports.show');
            Route::get('/catalog-imports/{batch}/errors', [CatalogImportBatchController::class, 'errors'])->name('catalog-imports.errors');
            Route::post('/catalog-imports/{batch}/resolve-mappings', [CatalogImportBatchController::class, 'resolveMappings'])->name('catalog-imports.resolve-mappings');
            Route::post('/catalog-imports/{batch}/publish', [CatalogImportBatchController::class, 'publish'])->name('catalog-imports.publish');
            Route::post('/media-assets', [MediaAssetController::class, 'store'])->name('media-assets.store');
            Route::post('/product-families', [ProductFamilyApiController::class, 'store'])->name('product-families.store');
            Route::put('/product-families/{productFamily}', [ProductFamilyApiController::class, 'update'])->name('product-families.update');
            Route::delete('/product-families/{productFamily}', [ProductFamilyApiController::class, 'destroy'])->name('product-families.destroy');
            Route::post('/product-subfamilies', [ProductSubfamilyApiController::class, 'store'])->name('product-subfamilies.store');
            Route::put('/product-subfamilies/{productSubfamily}', [ProductSubfamilyApiController::class, 'update'])->name('product-subfamilies.update');
            Route::delete('/product-subfamilies/{productSubfamily}', [ProductSubfamilyApiController::class, 'destroy'])->name('product-subfamilies.destroy');
            Route::get('/products/{product}', [ProductApiController::class, 'show'])->name('products.show');
            Route::post('/products', [ProductApiController::class, 'store'])->name('products.store');
            Route::put('/products/{product}', [ProductApiController::class, 'update'])->name('products.update');
            Route::delete('/products/{product}', [ProductApiController::class, 'destroy'])->name('products.destroy');
            Route::post('/product-brand-images', [ProductCatalogAdminController::class, 'updateBrandImage'])->name('product-brand-images.update');
            Route::post('/product-import', [ProductImportController::class, 'store'])->name('product-import.store');
            Route::get('/home-hero-slides', [HomeHeroSlideController::class, 'index'])->name('home-hero-slides.index');
            Route::post('/home-hero-slides', [HomeHeroSlideController::class, 'store'])->name('home-hero-slides.store');
            Route::put('/home-hero-slides/{homeHeroSlide}', [HomeHeroSlideController::class, 'update'])->name('home-hero-slides.update');
            Route::delete('/home-hero-slides/{homeHeroSlide}', [HomeHeroSlideController::class, 'destroy'])->name('home-hero-slides.destroy');
            Route::put('/site-sections/{siteSection}', [SiteSectionController::class, 'update'])->name('site-sections.update');
            Route::post('/post-categories', [PostCategoryController::class, 'store'])->name('post-categories.store');
            Route::put('/post-categories/{postCategory}', [PostCategoryController::class, 'update'])->name('post-categories.update');
            Route::delete('/post-categories/{postCategory}', [PostCategoryController::class, 'destroy'])->name('post-categories.destroy');
            Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
            Route::patch('/posts/{post}/home', [PostController::class, 'updateHomeVisibility'])->name('posts.home');
            Route::put('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
            Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
            Route::put('/quote-page-settings', [QuoteAdminController::class, 'updateSettings'])->name('quote-page-settings.update');
            Route::put('/quote-requests/{quoteRequest}', [QuoteAdminController::class, 'updateRequest'])->name('quote-requests.update');
            Route::delete('/quote-requests/{quoteRequest}', [QuoteAdminController::class, 'destroyRequest'])->name('quote-requests.destroy');
            Route::put('/contact-page-settings', [ContactAdminController::class, 'updateSettings'])->name('contact-page-settings.update');
            Route::post('/contact-page-items', [ContactAdminController::class, 'storeItem'])->name('contact-page-items.store');
            Route::put('/contact-page-items/{contactPageItem}', [ContactAdminController::class, 'updateItem'])->name('contact-page-items.update');
            Route::delete('/contact-page-items/{contactPageItem}', [ContactAdminController::class, 'destroyItem'])->name('contact-page-items.destroy');
            Route::put('/contact-requests/{contactRequest}', [ContactAdminController::class, 'updateRequest'])->name('contact-requests.update');
            Route::delete('/contact-requests/{contactRequest}', [ContactAdminController::class, 'destroyRequest'])->name('contact-requests.destroy');
            Route::post('/newsletter-subscribers', [NewsletterAdminController::class, 'storeSubscriber'])->name('newsletter-subscribers.store');
            Route::put('/newsletter-subscribers/{newsletterSubscriber}', [NewsletterAdminController::class, 'updateSubscriber'])->name('newsletter-subscribers.update');
            Route::delete('/newsletter-subscribers/{newsletterSubscriber}', [NewsletterAdminController::class, 'destroySubscriber'])->name('newsletter-subscribers.destroy');
            Route::post('/newsletter/send', [NewsletterAdminController::class, 'send'])->name('newsletter.send');
            Route::put('/footer-settings/whatsapp', [WhatsAppController::class, 'update'])->name('footer-settings.whatsapp.update');
            Route::put('/footer-settings', [FooterSettingsController::class, 'update'])->name('footer-settings.update');
            Route::post('/footer-contact-items', [FooterSettingsController::class, 'storeContactItem'])->name('footer-contact-items.store');
            Route::put('/footer-contact-items/{footerContactItem}', [FooterSettingsController::class, 'updateContactItem'])->name('footer-contact-items.update');
            Route::post('/social-links', [SocialLinksController::class, 'store'])->name('social-links.store');
            Route::put('/social-links/{socialLink}', [SocialLinksController::class, 'update'])->name('social-links.update');
        });
    });
});

require __DIR__.'/auth.php';
