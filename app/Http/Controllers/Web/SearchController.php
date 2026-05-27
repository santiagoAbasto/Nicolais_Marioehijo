<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Product;
use App\Models\ProductFamily;
use App\Models\ProductSubfamily;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SearchController extends Controller
{
    public function index(Request $request): View
    {
        $query = $this->normalizeQuery($request->query('q', ''));
        $payload = $query !== '' ? $this->buildPayload($query, false) : $this->emptyPayload();

        return view('web.search.index', [
            'query' => $query,
            'groups' => $payload['groups'],
            'insight' => $payload['insight'],
            'totalResults' => collect($payload['groups'])->sum(fn (array $group) => count($group['items'] ?? [])),
        ]);
    }

    public function suggest(Request $request): JsonResponse
    {
        $query = $this->normalizeQuery($request->query('q', ''));

        if ($query === '') {
            return response()->json($this->emptyPayload());
        }

        return response()->json($this->buildPayload($query, true));
    }

    protected function buildPayload(string $query, bool $compact): array
    {
        $groups = collect([
            $this->sectionGroup($query),
            $this->productGroup($query, $compact ? 6 : 12),
            $this->familyGroup($query, $compact ? 4 : 8),
            $this->subfamilyGroup($query, $compact ? 4 : 8),
            $this->newsGroup($query, $compact ? 4 : 8),
        ])->filter(fn (?array $group) => $group && count($group['items']) > 0)->values()->all();

        return [
            'query' => $query,
            'groups' => $groups,
            'insight' => $this->assistantInsight($query, $groups),
        ];
    }

    protected function emptyPayload(): array
    {
        return [
            'query' => '',
            'groups' => [],
            'insight' => [
                'headline' => 'Hola, soy el asistente de búsqueda.',
                'description' => 'Puedo encontrar productos, secciones, novedades y responder consultas rápidas sobre contacto, catálogos o presupuestos.',
                'supporting_groups' => [
                    [
                        'title' => 'Atajos inteligentes',
                        'items' => [
                            ['title' => 'Ver productos', 'url' => route('web.products.index')],
                            ['title' => 'Pedir presupuesto', 'url' => route('web.quote.show')],
                            ['title' => 'Contactar a Nicolais', 'url' => route('web.contact.show')],
                        ],
                    ],
                ],
            ],
        ];
    }

    protected function sectionGroup(string $query): ?array
    {
        $sections = collect($this->sections())
            ->map(function (array $section) use ($query) {
                $score = $this->score($query, [$section['title'], $section['context'], $section['keywords']]);

                if ($score <= 0) {
                    return null;
                }

                return [
                    'title' => $section['title'],
                    'url' => $section['url'],
                    'context' => $section['context'],
                    'meta' => $section['meta'],
                    'match_reason' => 'Coincide con tu consulta',
                    '_score' => $score,
                ];
            })
            ->filter()
            ->sortByDesc('_score')
            ->take(6)
            ->map(fn (array $item) => collect($item)->except('_score')->all())
            ->values();

        return $sections->isEmpty() ? null : [
            'title' => 'Secciones',
            'items' => $sections->all(),
        ];
    }

    protected function productGroup(string $query, int $limit): ?array
    {
        $terms = $this->terms($query);

        $products = Product::query()
            ->with(['family', 'subfamily'])
            ->where('is_active', true)
            ->where(function ($builder) use ($terms, $query): void {
                $builder->where('name', 'like', '%'.$query.'%')
                    ->orWhere('sku', 'like', '%'.$query.'%')
                    ->orWhere('brand', 'like', '%'.$query.'%')
                    ->orWhere('original_code', 'like', '%'.$query.'%')
                    ->orWhere('equivalence_code', 'like', '%'.$query.'%')
                    ->orWhere('oem_code', 'like', '%'.$query.'%')
                    ->orWhere('short_description', 'like', '%'.$query.'%');

                foreach ($terms as $term) {
                    $builder->orWhere('name', 'like', '%'.$term.'%')
                        ->orWhere('sku', 'like', '%'.$term.'%')
                        ->orWhere('brand', 'like', '%'.$term.'%')
                        ->orWhere('original_code', 'like', '%'.$term.'%')
                        ->orWhere('equivalence_code', 'like', '%'.$term.'%')
                        ->orWhere('oem_code', 'like', '%'.$term.'%')
                        ->orWhere('short_description', 'like', '%'.$term.'%');
                }
            })
            ->orderBy('sort_order')
            ->orderBy('name')
            ->limit(max($limit * 8, 48))
            ->get()
            ->map(function (Product $product) use ($query) {
                return [
                    'title' => $product->name,
                    'url' => route('web.products.line', $product->slug),
                    'context' => 'Producto',
                    'meta' => $this->productMeta($product),
                    'match_reason' => $this->productReason($product, $query),
                    '_score' => $this->productScore($product, $query),
                ];
            })
            ->sortByDesc('_score')
            ->take($limit)
            ->map(fn (array $item) => collect($item)->except('_score')->all())
            ->values();

        return $products->isEmpty() ? null : [
            'title' => 'Productos',
            'items' => $products->all(),
        ];
    }

    protected function familyGroup(string $query, int $limit): ?array
    {
        $families = ProductFamily::query()
            ->where('is_active', true)
            ->where(function ($builder) use ($query): void {
                $builder->where('name', 'like', '%'.$query.'%')
                    ->orWhere('description', 'like', '%'.$query.'%');
            })
            ->orderBy('sort_order')
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(fn (ProductFamily $family) => [
                'title' => $family->name,
                'url' => route('web.products.line', $family->slug),
                'context' => 'Familia',
                'meta' => Str::limit(strip_tags((string) $family->description), 120),
                'match_reason' => 'Categoría de productos',
            ]);

        return $families->isEmpty() ? null : [
            'title' => 'Familias',
            'items' => $families->all(),
        ];
    }

    protected function subfamilyGroup(string $query, int $limit): ?array
    {
        $subfamilies = ProductSubfamily::query()
            ->with('family')
            ->where('is_active', true)
            ->where(function ($builder) use ($query): void {
                $builder->where('name', 'like', '%'.$query.'%')
                    ->orWhere('short_description', 'like', '%'.$query.'%')
                    ->orWhere('description', 'like', '%'.$query.'%');
            })
            ->orderBy('sort_order')
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(fn (ProductSubfamily $subfamily) => [
                'title' => $subfamily->name,
                'url' => route('web.products.index', ['model' => $subfamily->name]),
                'context' => 'Modelo',
                'meta' => $subfamily->family?->name,
                'match_reason' => 'Modelo dentro del catálogo',
            ]);

        return $subfamilies->isEmpty() ? null : [
            'title' => 'Modelos',
            'items' => $subfamilies->all(),
        ];
    }

    protected function newsGroup(string $query, int $limit): ?array
    {
        $posts = Post::query()
            ->with('category')
            ->where('is_active', true)
            ->where(function ($builder) use ($query): void {
                $builder->where('title', 'like', '%'.$query.'%')
                    ->orWhere('excerpt', 'like', '%'.$query.'%')
                    ->orWhere('content', 'like', '%'.$query.'%');
            })
            ->orderBy('sort_order')
            ->orderByDesc('published_at')
            ->limit($limit)
            ->get()
            ->map(fn (Post $post) => [
                'title' => $post->title,
                'url' => route('web.news.show', $post->slug),
                'context' => 'Novedad',
                'meta' => $post->category?->name ?: optional($post->published_at)->format('d/m/Y'),
                'match_reason' => 'Contenido editorial',
            ]);

        return $posts->isEmpty() ? null : [
            'title' => 'Novedades',
            'items' => $posts->all(),
        ];
    }

    protected function assistantInsight(string $query, array $groups): array
    {
        $lower = Str::lower($query);
        $matched = collect($groups)->flatMap(fn (array $group) => $group['items'] ?? [])->take(4);

        $intent = match (true) {
            Str::contains($lower, ['telefono', 'teléfono', 'whatsapp', 'mail', 'email', 'direccion', 'dirección', 'contacto']) => [
                'headline' => 'Parece una consulta de contacto.',
                'description' => 'Te llevo directo a la información de contacto, WhatsApp, teléfonos, email y ubicación.',
                'items' => [
                    ['title' => 'Abrir contacto', 'url' => route('web.contact.show')],
                    ['title' => 'Pedir presupuesto', 'url' => route('web.quote.show')],
                ],
            ],
            Str::contains($lower, ['presupuesto', 'cotizar', 'consulta', 'consultar', 'precio', 'comprar']) => [
                'headline' => 'Parece que querés consultar o cotizar.',
                'description' => 'Podés avanzar por presupuesto o abrir un producto si ya sabés qué repuesto necesitás.',
                'items' => [
                    ['title' => 'Pedir presupuesto', 'url' => route('web.quote.show')],
                    ['title' => 'Ver productos', 'url' => route('web.products.index')],
                ],
            ],
            Str::contains($lower, ['catalogo', 'catálogo', 'pdf', 'ficha', 'norma', 'tecnica', 'técnica']) => [
                'headline' => 'Parece una búsqueda técnica o de catálogo.',
                'description' => 'Encontré caminos hacia catálogo, fichas y productos relacionados.',
                'items' => [
                    ['title' => 'Abrir catálogo', 'url' => route('web.catalog.show')],
                    ['title' => 'Explorar productos', 'url' => route('web.products.index')],
                ],
            ],
            Str::contains($lower, ['producto', 'repuesto', 'codigo', 'código', 'oem', 'equivalencia', 'engranaje', 'rodamiento']) => [
                'headline' => 'Estoy buscando dentro del catálogo de productos.',
                'description' => 'Prioricé códigos, equivalencias, OEM, marcas, familias y descripciones.',
                'items' => [
                    ['title' => 'Ver todos los productos', 'url' => route('web.products.index', ['q' => $query])],
                    ['title' => 'Pedir ayuda comercial', 'url' => route('web.contact.show')],
                ],
            ],
            Str::contains($lower, ['cliente', 'login', 'ingresar', 'panel']) => [
                'headline' => 'Parece que buscás el acceso de clientes.',
                'description' => 'Te dejo el ingreso al panel y secciones útiles del sitio.',
                'items' => [
                    ['title' => 'Ingresar a clientes', 'url' => route('web.clients.index')],
                    ['title' => 'Contacto', 'url' => route('web.contact.show')],
                ],
            ],
            default => [
                'headline' => $matched->isNotEmpty()
                    ? 'Encontré coincidencias útiles para tu búsqueda.'
                    : 'No veo una coincidencia exacta, pero puedo orientarte.',
                'description' => $matched->isNotEmpty()
                    ? 'Te muestro primero los resultados más cercanos y atajos relacionados.'
                    : 'Probá con nombre de producto, código, marca, familia, teléfono, catálogo o presupuesto.',
                'items' => [
                    ['title' => 'Productos', 'url' => route('web.products.index')],
                    ['title' => 'Contacto', 'url' => route('web.contact.show')],
                ],
            ],
        };

        return [
            'headline' => $intent['headline'],
            'description' => $intent['description'],
            'supporting_groups' => [
                [
                    'title' => 'Coincidencias con toda la web',
                    'items' => $matched->isNotEmpty()
                        ? $matched->map(fn (array $item) => ['title' => $item['title'], 'url' => $item['url']])->values()->all()
                        : $intent['items'],
                ],
            ],
        ];
    }

    protected function sections(): array
    {
        return [
            ['title' => 'Inicio', 'url' => route('web.home'), 'context' => 'Sección', 'meta' => 'Portada y buscador principal', 'keywords' => 'home inicio principal portada buscar'],
            ['title' => 'Nosotros', 'url' => route('web.about'), 'context' => 'Sección', 'meta' => 'Historia y empresa', 'keywords' => 'empresa nosotros historia quienes somos'],
            ['title' => 'Productos', 'url' => route('web.products.index'), 'context' => 'Sección', 'meta' => 'Catálogo de repuestos', 'keywords' => 'productos repuestos codigo equivalencia oem marca familia modelo'],
            ['title' => 'Catálogos', 'url' => route('web.catalog.show'), 'context' => 'Sección', 'meta' => 'Catálogo técnico y solicitud', 'keywords' => 'catalogo catálogo pdf ficha tecnica normas'],
            ['title' => 'Novedades', 'url' => route('web.news.index'), 'context' => 'Sección', 'meta' => 'Noticias y publicaciones', 'keywords' => 'novedades noticias blog publicaciones'],
            ['title' => 'Contacto', 'url' => route('web.contact.show'), 'context' => 'Sección', 'meta' => 'Dirección, teléfonos, email y mapa', 'keywords' => 'contacto telefono teléfono whatsapp mail email direccion dirección mapa'],
            ['title' => 'Presupuesto', 'url' => route('web.quote.show'), 'context' => 'Sección', 'meta' => 'Solicitar cotización', 'keywords' => 'presupuesto cotizar consulta consultar precio'],
            ['title' => 'Clientes', 'url' => route('web.clients.index'), 'context' => 'Acceso', 'meta' => 'Ingreso al panel de clientes', 'keywords' => 'clientes login ingresar acceso panel'],
        ];
    }

    protected function productReason(Product $product, string $query): string
    {
        $normalizedQuery = $this->searchable($query);
        $normalizedName = $this->searchable($product->name);

        if ($normalizedName === $normalizedQuery) {
            return 'Coincidencia exacta por nombre';
        }

        if (Str::contains($normalizedName, $normalizedQuery)) {
            return 'Coincidencia directa por nombre';
        }

        foreach ([
            'sku' => 'Código NM',
            'original_code' => 'Código original',
            'equivalence_code' => 'Equivalencia',
            'oem_code' => 'Código OEM',
            'brand' => 'Marca',
        ] as $field => $label) {
            if (filled($product->{$field}) && Str::contains($this->searchable((string) $product->{$field}), $normalizedQuery)) {
                return $label.' '.$product->{$field};
            }
        }

        return $product->family?->name ? 'Familia '.$product->family->name : 'Coincidencia de catálogo';
    }

    protected function productMeta(Product $product): string
    {
        return collect([
            $product->family?->name ? 'Familia '.$product->family->name : null,
            $product->brand ? 'Marca '.$product->brand : null,
            $product->sku ? 'Código NM '.$product->sku : null,
            $product->oem_code ? 'OEM '.$product->oem_code : null,
            $product->equivalence_code ? 'Equiv. '.$product->equivalence_code : null,
            $product->original_code ? 'Original '.$product->original_code : null,
        ])->filter()->unique()->join(' · ');
    }

    protected function productScore(Product $product, string $query): int
    {
        $needle = $this->searchable($query);
        $terms = $this->terms($query)->map(fn (string $term) => $this->searchable($term))->filter();
        $score = 0;

        $fields = [
            'name' => $this->searchable($product->name),
            'sku' => $this->searchable($product->sku),
            'oem_code' => $this->searchable($product->oem_code),
            'equivalence_code' => $this->searchable($product->equivalence_code),
            'original_code' => $this->searchable($product->original_code),
            'brand' => $this->searchable($product->brand),
            'family' => $this->searchable($product->family?->name),
            'subfamily' => $this->searchable($product->subfamily?->name),
            'short_description' => $this->searchable($product->short_description),
        ];

        if ($fields['name'] === $needle) {
            $score += 1200;
        } elseif (Str::startsWith($fields['name'], $needle)) {
            $score += 950;
        } elseif (Str::contains($fields['name'], $needle)) {
            $score += 820;
        }

        foreach (['sku', 'oem_code', 'equivalence_code', 'original_code'] as $field) {
            if ($fields[$field] === $needle) {
                $score += 780;
            } elseif ($fields[$field] !== '' && Str::contains($fields[$field], $needle)) {
                $score += 560;
            }
        }

        foreach ($terms as $term) {
            if ($term === '') {
                continue;
            }

            if (Str::contains($fields['name'], $term)) {
                $score += 90;
            }

            foreach (['sku', 'oem_code', 'equivalence_code', 'original_code'] as $field) {
                if ($fields[$field] !== '' && Str::contains($fields[$field], $term)) {
                    $score += 70;
                }
            }

            foreach (['brand', 'family', 'subfamily', 'short_description'] as $field) {
                if ($fields[$field] !== '' && Str::contains($fields[$field], $term)) {
                    $score += 24;
                }
            }
        }

        if ($terms->isNotEmpty() && $terms->every(fn (string $term) => Str::contains($fields['name'], $term))) {
            $score += 260;
        }

        return $score;
    }

    protected function score(string $query, array $values): int
    {
        $haystack = Str::lower(collect($values)->filter()->join(' '));
        $terms = $this->terms($query);
        $score = Str::contains($haystack, Str::lower($query)) ? 6 : 0;

        foreach ($terms as $term) {
            if (Str::contains($haystack, $term)) {
                $score += 2;
            }
        }

        return $score;
    }

    protected function terms(string $query): Collection
    {
        return Str::of($query)
            ->lower()
            ->replaceMatches('/[^\pL\pN]+/u', ' ')
            ->explode(' ')
            ->map(fn (string $term) => trim($term))
            ->filter(fn (string $term) => Str::length($term) >= 3)
            ->unique()
            ->values();
    }

    protected function normalizeQuery(mixed $query): string
    {
        return Str::of((string) $query)->squish()->limit(120, '')->toString();
    }

    protected function searchable(mixed $value): string
    {
        return Str::of((string) $value)
            ->lower()
            ->replace(['ª', 'º'], ['a', 'o'])
            ->replaceMatches('/[^\pL\pN]+/u', ' ')
            ->squish()
            ->toString();
    }
}
