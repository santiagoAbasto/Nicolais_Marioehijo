<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user = Auth::guard('admin')->user();

        if ($user) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate('admin');

        $request->session()->regenerate();

        $user = Auth::guard('admin')->user();

        if ($user && array_key_exists('can_access_admin', $user->getAttributes()) && ! $user->can_access_admin) {
            cms_security_log('warning', 'Blocked admin login for user without panel access.', [], $request);

            Auth::guard('admin')->logout();
            $request->session()->regenerateToken();

            return back()->withErrors([
                'email' => 'No tienes permisos para acceder al panel de administracion.',
            ]);
        }

        cms_security_log('info', 'Admin login succeeded.', [], $request);

        return redirect()->route('admin.dashboard');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        cms_security_log('info', 'Admin logout succeeded.', [], $request);

        Auth::guard('admin')->logout();
        $request->session()->regenerateToken();

        return Inertia::location(route('web.home', absolute: false));
    }
}
