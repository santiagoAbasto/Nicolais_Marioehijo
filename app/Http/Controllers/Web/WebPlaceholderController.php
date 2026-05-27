<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;

abstract class WebPlaceholderController extends Controller
{
    public function __call(string $method, array $parameters): RedirectResponse
    {
        return redirect()->route('web.home');
    }

    protected function plain(string $content, string $type = 'text/plain'): Response
    {
        return response($content, 200)->header('Content-Type', $type);
    }
}
