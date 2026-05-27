<?php

namespace App\Http\Controllers\Web;

use Illuminate\Http\Response;

class SiteIndexController extends WebPlaceholderController
{
    public function robots(): Response
    {
        return $this->plain("User-agent: *\nAllow: /\nSitemap: ".url('/sitemap.xml')."\n");
    }

    public function sitemap(): Response
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>'
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            .'<url><loc>'.e(url('/')).'</loc></url>'
            .'</urlset>';

        return $this->plain($xml, 'application/xml');
    }
}
