<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

abstract class AdminPlaceholderController extends Controller
{
    public function __call(string $method, array $parameters): RedirectResponse
    {
        return redirect()
            ->route('admin.dashboard')
            ->with('info', 'Esta seccion del panel todavia esta pendiente de conectar.');
    }
}
