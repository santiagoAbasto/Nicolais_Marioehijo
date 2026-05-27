<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('admin');

        if (! $user) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Unauthenticated.'], 401)
                : redirect()->guest(route('login'));
        }

        $attributes = $user->getAttributes();

        if (array_key_exists('can_access_admin', $attributes)) {
            if (! $user->can_access_admin) {
                cms_security_log('warning', 'Denied admin panel access.', [
                    'type' => 'admin_bypass_attempt',
                ], $request);

                abort(403, 'No tienes permisos para acceder al panel de administracion.');
            }

            return $next($request);
        }

        $allowedEmails = config('security.admin_allowed_emails', []);

        if (! in_array(strtolower($user->email), $allowedEmails, true)) {
            cms_security_log('warning', 'Denied admin panel access.', [
                'type' => 'admin_bypass_attempt',
            ], $request);

            abort(403, 'No tienes permisos para acceder al panel de administracion.');
        }

        return $next($request);
    }
}
