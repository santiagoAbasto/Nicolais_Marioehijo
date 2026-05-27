<?php

namespace App\Providers;

use App\View\Composers\PublicSeoComposer;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (request()->headers->get('x-forwarded-proto') === 'https') {
            URL::forceScheme('https');
        }

        if (app()->isProduction()) {
            Vite::prefetch(concurrency: 3);
        }

        View::composer('web.*', PublicSeoComposer::class);
    }
}
