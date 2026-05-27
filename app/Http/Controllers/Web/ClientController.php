<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ClientAccessRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ClientController extends Controller
{
    public function index()
    {
        if (Auth::check() && ! Auth::user()->can_access_admin) {
            return redirect()->route('web.client-zone.index');
        }

        return redirect()->route('web.home')->with('client_modal', true);
    }

    public function login(Request $request): JsonResponse|RedirectResponse
    {
        $rateKey = 'client-login:'.Str::lower((string) $request->input('email')).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($rateKey, 20)) {
            cms_security_log('warning', 'Client login rate limit triggered.', [
                'type' => 'rate_limit_exceeded',
                'attempted_email' => cms_email((string) $request->input('email')),
            ], $request);

            throw ValidationException::withMessages([
                'email' => 'Demasiados intentos. Esperá un minuto y volvé a probar.',
            ]);
        }

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $this->repairApprovedClientUserIfMissing($credentials);

        if (! Auth::attempt($credentials, true)) {
            RateLimiter::hit($rateKey, 60);
            cms_security_log('warning', 'Client login rejected by invalid credentials.', [
                'type' => 'login_failed',
                'attempted_email' => cms_email((string) ($credentials['email'] ?? null)),
            ], $request);

            throw ValidationException::withMessages([
                'email' => 'Los datos ingresados no son correctos.',
            ]);
        }

        RateLimiter::clear($rateKey);

        $request->session()->regenerate();

        if ($request->user()?->can_access_admin) {
            Auth::guard('web')->logout();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Este acceso es solo para clientes.',
            ]);
        }

        $approvedClient = ClientAccessRequest::query()
            ->where('email', $request->user()->email)
            ->where('user_id', $request->user()->id)
            ->where('status', ClientAccessRequest::STATUS_APPROVED)
            ->exists();

        if (! $approvedClient) {
            Auth::guard('web')->logout();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Tu usuario no está aprobado o fue dado de baja.',
            ]);
        }

        if ($request->expectsJson()) {
            return response()->json(['redirect' => route('web.client-zone.index')]);
        }

        return redirect()->route('web.client-zone.index');
    }

    private function repairApprovedClientUserIfMissing(array $credentials): void
    {
        $email = Str::lower((string) ($credentials['email'] ?? ''));
        $password = (string) ($credentials['password'] ?? '');

        if ($email === '' || $password === '' || User::query()->where('email', $email)->exists()) {
            return;
        }

        $clientRequest = ClientAccessRequest::query()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->where('status', ClientAccessRequest::STATUS_APPROVED)
            ->whereNull('user_id')
            ->latest()
            ->first();

        if (! $clientRequest || ! $clientRequest->last_plain_password || ! hash_equals((string) $clientRequest->last_plain_password, $password)) {
            return;
        }

        $name = trim($clientRequest->first_name.' '.$clientRequest->last_name);

        $user = new User();
        $user->forceFill([
            'name' => $name !== '' ? $name : $clientRequest->email,
            'email' => $clientRequest->email,
            'password' => $password,
            'can_access_admin' => false,
            'email_verified_at' => now(),
            'remember_token' => Str::random(60),
        ])->save();

        $clientRequest->forceFill([
            'user_id' => $user->id,
            'deactivated_at' => null,
        ])->save();
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'company' => ['nullable', 'string', 'max:160'],
            'tax_id' => ['nullable', 'string', 'max:40'],
            'email' => ['required', 'email', 'max:160'],
            'phone' => ['required', 'string', 'max:60'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $validator->after(function ($validator) use ($request) {
            $exists = ClientAccessRequest::query()
                ->where('email', $request->input('email'))
                ->whereIn('status', [ClientAccessRequest::STATUS_PENDING, ClientAccessRequest::STATUS_APPROVED])
                ->exists();

            if ($exists) {
                $validator->errors()->add('email', 'Ya existe una solicitud activa con este correo.');
            }
        });

        $data = $validator->validate();

        ClientAccessRequest::query()->create([
            ...$data,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Solicitud enviada correctamente. Te avisaremos por correo cuando sea revisada.',
            ]);
        }

        return back()->with('success', 'Solicitud enviada correctamente.');
    }
}
