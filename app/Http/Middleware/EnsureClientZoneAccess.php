<?php

namespace App\Http\Middleware;

use App\Models\ClientAccessRequest;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureClientZoneAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->deny($request, 'Iniciá sesión para acceder a Zona Cliente.', 401);
        }

        if ($user->can_access_admin) {
            Auth::guard('web')->logout();
            $request->session()->regenerateToken();
            cms_security_log('warning', 'Denied client zone access to admin user.', [
                'type' => 'unauthorized_access',
            ], $request);

            return $this->deny($request, 'Este acceso es solo para clientes.', 403);
        }

        $approvedClient = ClientAccessRequest::query()
            ->where('email', $user->email)
            ->where('user_id', $user->id)
            ->where('status', ClientAccessRequest::STATUS_APPROVED)
            ->exists();

        if (! $approvedClient) {
            Auth::guard('web')->logout();
            $request->session()->regenerateToken();
            cms_security_log('warning', 'Denied client zone access to non-approved user.', [
                'type' => 'unauthorized_access',
            ], $request);

            return $this->deny($request, 'Tu usuario no está aprobado o fue dado de baja.', 403);
        }

        return $next($request);
    }

    private function deny(Request $request, string $message, int $status): Response
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => $message], $status);
        }

        return redirect()->route('web.home')->with('client_modal', true);
    }
}
