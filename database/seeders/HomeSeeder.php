<?php

namespace Database\Seeders;

use App\Models\Catalog\CatalogFamily;
use App\Models\Catalog\CatalogGrade;
use App\Models\Catalog\CatalogLine;
use App\Models\Catalog\CatalogSeries;
use App\Models\FooterSetting;
use App\Models\HomeHeroSlide;
use App\Models\MediaAsset;
use App\Models\Post;
use App\Models\PostCategory;
use App\Models\SectionItem;
use App\Models\SiteSection;
use App\Models\SocialLink;
use App\Support\SortOrder;
use Illuminate\Database\Seeder;

class HomeSeeder extends Seeder
{
    public function run(): void
    {
        $media = $this->seedMedia();
        $this->seedCatalog($media);
        $this->seedHero($media);
        $this->seedSections($media);
        $this->seedNews($media);
        $this->seedFooter($media);
    }

    protected function seedMedia(): array
    {
        $items = [
            // Hero histórico del catálogo (CatalogFamily) — se mantiene para no romper datos ya vinculados.
            'hero_banner' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1600&q=80',
                'title' => 'Hero imagen Nicolais',
                'alt_text' => 'Bobinas y tubos metálicos',
            ],
            // Hero actual del home (HomeHeroSlide)
            'home_hero_banner' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/hero/home-banner.png',
                'title' => 'Banner Home',
                'alt_text' => 'Banner principal Nicolais Mario e Hijo',
            ],
            'about_image' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/about/about-home.png',
                'title' => 'Nosotros home',
                'alt_text' => 'Barras y materiales especiales',
            ],
            'line_titanio' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/products/titanio-y-sus-aleaciones.png',
                'title' => 'titanio-y-sus-aleaciones',
                'alt_text' => 'titanio-y-sus-aleaciones',
            ],
            'line_aceros' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/products/aceros.png',
                'title' => 'aceros',
                'alt_text' => 'aceros',
            ],
            'line_niquel' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/products/niquel-y-sus-aleaciones.png',
                'title' => 'niquel-y-sus-aleaciones',
                'alt_text' => 'niquel-y-sus-aleaciones',
            ],
            'line_bismuto' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/products/bismuto-y-aleaciones-fusibles.png',
                'title' => 'bismuto-y-aleaciones-fusibles',
                'alt_text' => 'bismuto-y-aleaciones-fusibles',
            ],
            'line_cobre' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/products/cobre.png',
                'title' => 'cobre',
                'alt_text' => 'cobre',
            ],
            'line_molibdeno' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/products/molibdeno-y-sus-aleaciones.png',
                'title' => 'molibdeno-y-sus-aleaciones',
                'alt_text' => 'molibdeno-y-sus-aleaciones',
            ],
            'application_quimica' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/aplicaciones/quimica.png',
                'title' => 'Química',
                'alt_text' => null,
                'mime_type' => 'image/png',
            ],
            'application_petroleo' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/aplicaciones/gas-y-petroleo.png',
                'title' => 'Gas y petróleo',
                'alt_text' => null,
                'mime_type' => 'image/png',
            ],
            'application_termico' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/aplicaciones/terminoaltatemperatura.png',
                'title' => 'Procesamiento térmico alta temperatura',
                'alt_text' => null,
                'mime_type' => 'image/png',
            ],
            'application_naval' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/aplicaciones/naval.png',
                'title' => 'Naval - Procesamiento de agua marina',
                'alt_text' => null,
                'mime_type' => 'image/png',
            ],
            // Medios históricos usados por los Posts (novedades legacy).
            'post_asesoramiento' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80',
                'title' => 'Asesoramiento técnico',
                'alt_text' => 'Asesoramiento técnico especializado',
            ],
            'post_biomateriales' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
                'title' => 'Biomateriales',
                'alt_text' => 'Biomateriales de alta calidad',
            ],
            'post_calidad' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=900&q=80',
                'title' => 'Comprometidos con la calidad',
                'alt_text' => 'Comprometidos con la calidad',
            ],
            // Novedades actuales que se muestran en el home (SectionItem)
            'news_nov1' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/news/nov1.png',
                'title' => 'Novedad 11',
                'alt_text' => 'Novedad 11',
            ],
            'news_nov2' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/news/nov2.png',
                'title' => 'Novedad 12',
                'alt_text' => 'Novedad 12',
            ],
            'news_nov3' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/news/nov3.png',
                'title' => 'Novedad 13',
                'alt_text' => 'Novedad 13',
            ],
            'quote_cta' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'home/quote/quote-cta.png',
                'title' => 'Solicitud de presupuesto',
                'alt_text' => 'Solicitud de presupuesto',
                'mime_type' => 'image/png',
            ],
            'footer_logo' => [
                'type' => 'image',
                'disk' => 'public',
                'path' => 'brand/nicolais-logo.svg',
                'title' => 'Logo Nicolais Mario e Hijo',
                'alt_text' => 'Logo Nicolais Mario e Hijo',
            ],
        ];

        $media = [];

        foreach ($items as $key => $item) {
            $media[$key] = MediaAsset::query()->updateOrCreate(
                ['path' => $item['path']],
                [
                    'type' => $item['type'],
                    'disk' => $item['disk'] ?? 'public',
                    'path' => $item['path'],
                    'title' => $item['title'],
                    'alt_text' => array_key_exists('alt_text', $item)
                        ? $item['alt_text']
                        : $item['title'],
                    'mime_type' => $item['mime_type'] ?? null,
                    'meta_json' => $item['meta_json'] ?? null,
                ]
            );
        }

        return $media;
    }

    protected function seedCatalog(array $media): void
    {
        $metalicos = CatalogFamily::query()->updateOrCreate(
            ['slug' => 'metalicos'],
            [
                'name' => 'Metálicos',
                'intro_title' => 'Nuestros productos',
                'intro_text' => 'Líneas de materiales y aleaciones especiales disponibles para la industria.',
                'hero_media_id' => $media['hero_banner']->id,
                'sort_order' => 1,
                'is_active' => true,
            ]
        );

        $lineDefinitions = [
            ['slug' => 'titanio-y-sus-aleaciones', 'name' => 'Titanio y sus aleaciones', 'media' => 'line_titanio'],
            ['slug' => 'aceros', 'name' => 'Aceros', 'media' => 'line_aceros'],
            ['slug' => 'niquel-y-sus-aleaciones', 'name' => 'Níquel y sus aleaciones', 'media' => 'line_niquel'],
            ['slug' => 'bismuto-y-aleaciones-fusibles', 'name' => 'Bismuto y aleaciones fusibles', 'media' => 'line_bismuto'],
            ['slug' => 'cobre', 'name' => 'Cobre', 'media' => 'line_cobre'],
            ['slug' => 'molibdeno-y-sus-aleaciones', 'name' => 'Molibdeno y sus aleaciones (TZM, MLR)', 'media' => 'line_molibdeno'],
        ];

        foreach ($lineDefinitions as $index => $lineDefinition) {
            $line = CatalogLine::query()->updateOrCreate(
                [
                    'catalog_family_id' => $metalicos->id,
                    'slug' => $lineDefinition['slug'],
                ],
                [
                    'name' => $lineDefinition['name'],
                    'intro_text' => 'Línea técnica y comercial disponible para navegación pública.',
                    'hero_media_id' => $media[$lineDefinition['media']]->id,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                    'show_on_home' => true,
                ]
            );

            $series = CatalogSeries::query()->updateOrCreate(
                [
                    'catalog_line_id' => $line->id,
                    'slug' => str($lineDefinition['slug'])->after('-y-sus-aleaciones')->trim('-')->value() ?: str($lineDefinition['name'])->slug()->value(),
                ],
                [
                    'name' => str($lineDefinition['name'])->before(' y sus aleaciones')->value() ?: $lineDefinition['name'],
                    'intro_text' => 'Serie base creada para mantener la jerarquía uniforme del catálogo.',
                    'hero_media_id' => $media[$lineDefinition['media']]->id,
                    'sort_order' => 1,
                    'is_active' => true,
                ]
            );

            CatalogGrade::query()->updateOrCreate(
                [
                    'catalog_series_id' => $series->id,
                    'slug' => 'grado-referencia',
                ],
                [
                    'name' => 'Grado referencia',
                    'intro_text' => 'Grado semilla para la evolución inicial del catálogo.',
                    'hero_media_id' => $media[$lineDefinition['media']]->id,
                    'density_unit' => 'g/cm3',
                    'sort_order' => 1,
                    'is_active' => true,
                ]
            );
        }
    }

    protected function seedHero(array $media): void
    {
        $slides = [[
            'sort_order' => SortOrder::fromPosition(1),
            'title' => 'Desde 1938 al servicio de la industria',
            'subtitle' => null,
            'description' => null,
            'button_text' => 'Más info',
            'button_url' => '/#nosotros',
            'media_type' => 'image',
            'desktop_media_id' => $media['home_hero_banner']->id,
            'mobile_media_id' => $media['home_hero_banner']->id,
            'alt_text' => 'Hero principal Nicolais Mario e Hijo',
            'autoplay_override_seconds' => 8,
            'is_active' => true,
        ]];

        foreach ($slides as $slide) {
            HomeHeroSlide::query()->updateOrCreate(
                ['sort_order' => $slide['sort_order']],
                $slide
            );
        }

        HomeHeroSlide::query()
            ->whereNotIn('sort_order', array_column($slides, 'sort_order'))
            ->delete();

        MediaAsset::query()
            ->whereIn('path', [
                'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
                'https://cdn.coverr.co/videos/coverr-shiny-metal-pipes-1567663509936?download=1080p',
            ])
            ->delete();
    }

    protected function seedSections(array $media): void
    {
        $about = SiteSection::query()->updateOrCreate(
            ['page_key' => 'home', 'section_key' => 'about_preview'],
            [
                'title' => 'Somos una empresa Argentina que desde 1938 se dedica a la provisión de Materiales y Aleaciones Especiales',
                'description' => "Nuestro depósito en Capital Federal cuenta en la actualidad con más de 1000 artículos distintos (barras, alambres, chapas, caños y tubos, tornillería y bulonería, etc.), lo que nos permite satisfacer gran parte de los requerimientos con entrega inmediata.\n\nNuestro objetivo es brindar un servicio de excelencia en el suministro de materiales especiales.\n\nAsimismo, nuestro departamento de importaciones le ofrece su experiencia para una ágil y rápida localización e importación de aquellos materiales que no estén en nuestro inventario.",
                'media_id' => $media['about_image']->id,
                'button_text' => 'Más info',
                'button_url' => '/#nosotros',
                'sort_order' => SortOrder::fromPosition(2),
                'is_active' => true,
            ]
        );

        $applications = SiteSection::query()->updateOrCreate(
            ['page_key' => 'home', 'section_key' => 'applications'],
            [
                'subtitle' => 'APLICACIONES',
                'title' => 'Un equipo experto y calidad garantizada',
                'description' => 'Aplicaciones automotores destacadas donde Nicolais Mario e Hijo acompaña necesidades criticas.',
                'button_text' => 'Ver todas',
                'button_url' => '/#aplicaciones',
                'sort_order' => SortOrder::fromPosition(3),
                'is_active' => true,
            ]
        );

        $applicationItems = [
            ['key' => 'quimica', 'title' => 'Química', 'media' => 'application_quimica', 'url' => '/#aplicaciones'],
            ['key' => 'gas-petroleo', 'title' => 'Gas y petróleo', 'media' => 'application_petroleo', 'url' => '/#aplicaciones'],
            ['key' => 'termico', 'title' => 'Procesamiento térmico alta temperatura', 'media' => 'application_termico', 'url' => '/#aplicaciones'],
            ['key' => 'naval', 'title' => 'Naval - Procesamiento de agua marina', 'media' => 'application_naval', 'url' => '/#aplicaciones'],
        ];

        foreach ($applicationItems as $index => $item) {
            SectionItem::query()->updateOrCreate(
                ['site_section_id' => $applications->id, 'item_key' => $item['key']],
                [
                    'title' => $item['title'],
                    'media_id' => $media[$item['media']]->id,
                    'link_url' => $item['url'],
                    'sort_order' => SortOrder::fromPosition($index + 1),
                    'is_active' => true,
                ]
            );
        }

        $newsSection = SiteSection::query()->updateOrCreate(
            ['page_key' => 'home', 'section_key' => 'news_section'],
            [
                'title' => 'Enterate de las últimas novedades',
                'button_text' => 'Ver todas',
                'button_url' => '/#novedades',
                'sort_order' => SortOrder::fromPosition(4),
                'is_active' => true,
            ]
        );

        $newsItems = [
            [
                'key' => 'asesoramiento-tecnico',
                'title' => 'Asesoramiento técnico especializado',
                'description' => 'Incorporamos un servicio de asesoramiento técnico personalizado para acompañar aplicaciones críticas en tus procesos industriales.',
                'media' => 'news_nov1',
            ],
            [
                'key' => 'ampliamos-biomateriales',
                'title' => 'Ampliamos nuestra línea de biomateriales de alta calidad',
                'description' => 'Seguimos creciendo en soluciones para el sector médico e industrial, incorporando nuevas referencias y aleaciones especiales.',
                'media' => 'news_nov2',
            ],
            [
                'key' => 'comprometidos-calidad',
                'title' => 'Comprometidos con la calidad',
                'description' => 'Trabajamos bajo estrictos estándares de calidad, garantizando la trazabilidad y confiabilidad en cada entrega.',
                'media' => 'news_nov3',
            ],
        ];

        foreach ($newsItems as $index => $item) {
            SectionItem::query()->updateOrCreate(
                ['site_section_id' => $newsSection->id, 'item_key' => $item['key']],
                [
                    'title' => $item['title'],
                    'description' => $item['description'],
                    'media_id' => $media[$item['media']]->id,
                    'link_url' => '/#novedades',
                    'sort_order' => SortOrder::fromPosition($index + 1),
                    'is_active' => true,
                ]
            );
        }

        SiteSection::query()->updateOrCreate(
            ['page_key' => 'home', 'section_key' => 'quote_cta'],
            [
                'subtitle' => 'SOLICITUD DE PRESUPUESTO',
                'title' => 'Metales, aleaciones especiales y biomateriales para la industria',
                'description' => 'Nuestro experimentado equipo está a su disposición para conseguirle el material más indicado para su aplicación.',
                'media_id' => $media['quote_cta']->id,
                'button_text' => 'Solicitar presupuesto',
                'button_url' => '/#presupuesto',
                'sort_order' => SortOrder::fromPosition(5),
                'is_active' => true,
            ]
        );

        SiteSection::query()->updateOrCreate(
            ['page_key' => 'home', 'section_key' => 'products_home'],
            [
                'title' => 'Nuestros productos',
                'description' => 'Líneas de materiales y aleaciones especiales para abastecimiento industrial.',
                'button_text' => 'Ver todos',
                'button_url' => '/#productos',
                'sort_order' => SortOrder::fromPosition(1),
                'is_active' => true,
            ]
        );

        SiteSection::query()->updateOrCreate(
            ['page_key' => 'home', 'section_key' => 'footer_cta'],
            [
                'title' => 'Consultas',
                'description' => 'Estamos listos para asistirlo en la elección del material adecuado.',
                'button_text' => 'Consultanos',
                'button_url' => '/#presupuesto',
                'sort_order' => SortOrder::fromPosition(6),
                'is_active' => false,
            ]
        );

        SectionItem::query()->where('site_section_id', $about->id)->delete();
    }

    protected function seedNews(array $media): void
    {
        $category = PostCategory::query()->updateOrCreate(
            ['slug' => 'novedades'],
            [
                'name' => 'Novedades',
                'color' => '#1680c3',
                'sort_order' => SortOrder::fromPosition(1),
                'is_active' => true,
            ]
        );

        $posts = [
            [
                'slug' => 'asesoramiento-tecnico-especializado',
                'title' => 'Asesoramiento técnico especializado',
                'excerpt' => 'Incorporamos un servicio de asesoramiento técnico personalizado para acompañar aplicaciones críticas.',
                'content' => 'Contenido semilla de asesoramiento técnico especializado.',
                'media' => 'post_asesoramiento',
                'date' => now()->subDays(6),
            ],
            [
                'slug' => 'ampliamos-linea-biomateriales-alta-calidad',
                'title' => 'Ampliamos nuestra línea de biomateriales de alta calidad',
                'excerpt' => 'Seguimos creciendo en soluciones para el sector médico e industrial, incorporando nuevas referencias.',
                'content' => 'Contenido semilla de biomateriales.',
                'media' => 'post_biomateriales',
                'date' => now()->subDays(4),
            ],
            [
                'slug' => 'comprometidos-con-la-calidad',
                'title' => 'Comprometidos con la calidad',
                'excerpt' => 'Trabajamos bajo estrictos estándares de calidad, garantizando trazabilidad y soporte técnico.',
                'content' => 'Contenido semilla de calidad.',
                'media' => 'post_calidad',
                'date' => now()->subDays(2),
            ],
        ];

        foreach ($posts as $index => $post) {
            Post::query()->updateOrCreate(
                ['slug' => $post['slug']],
                [
                    'post_category_id' => $category->id,
                    'title' => $post['title'],
                    'excerpt' => $post['excerpt'],
                    'content' => $post['content'],
                    'cover_media_id' => $media[$post['media']]->id,
                    'author_name' => 'Nicolais Mario e Hijo',
                    'published_at' => $post['date'],
                    'sort_order' => SortOrder::fromPosition($index + 1),
                    'is_active' => true,
                    'show_on_home' => true,
                    'is_featured' => true,
                    'seo_title' => $post['title'].' | Nicolais Mario e Hijo',
                    'seo_description' => $post['excerpt'],
                ]
            );
        }
    }

    protected function seedFooter(array $media): void
    {
        FooterSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'logo_media_id' => $media['footer_logo']->id,
                'brand_name' => 'Nicolais Mario e Hijo',
                'newsletter_title' => 'Recibí novedades técnicas y comerciales',
                'newsletter_placeholder' => 'Tu email',
                'contact_title' => 'Contacto',
                'contact_address' => 'Palpa 3551, CABA (C1427EBA), Argentina.',
                'phone_primary' => '(54 11) 5032 0033',
                'phone_secondary' => '(54 9 11) 1234-5678',
                'phone_tertiary' => null,
                'email_primary' => 'contacto@nicolaismarioehijo.com',
                'email_secondary' => 'ventas@nicolaismarioehijo.com',
                'whatsapp_url' => 'https://wa.me/5491112345678',
                'copyright_text' => '© Copyright 2026 Nicolais Mario e Hijo. Todos los derechos reservados',
            ]
        );

        $socialItems = [
            ['platform' => 'instagram', 'label' => 'Instagram', 'url' => 'https://instagram.com/nicolaismarioehijo', 'icon' => 'instagram'],
            ['platform' => 'linkedin', 'label' => 'LinkedIn', 'url' => 'https://linkedin.com/company/nicolais-mario-e-hijo', 'icon' => 'linkedin'],
            ['platform' => 'youtube', 'label' => 'YouTube', 'url' => 'https://youtube.com/@nicolaismarioehijo', 'icon' => 'youtube'],
        ];

        foreach ($socialItems as $index => $item) {
            SocialLink::query()->updateOrCreate(
                ['platform' => $item['platform'], 'location' => 'footer'],
                [
                    'label' => $item['label'],
                    'url' => $item['url'],
                    'icon' => $item['icon'],
                    'sort_order' => SortOrder::fromPosition($index + 1),
                    'is_active' => true,
                ]
            );
        }
    }
}
