<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:4096'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(string $guard = 'web'): void
    {
        $this->ensureIsNotRateLimited();
        $this->ensureAccountIsNotRateLimited();

        $credentials = [
            'email' => cms_email((string) $this->string('email')),
            'password' => (string) $this->string('password'),
        ];

        if (! Auth::guard($guard)->attempt($credentials, $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());
            RateLimiter::hit($this->accountThrottleKey(), 900);
            cms_security_log('warning', 'Admin login rejected by invalid credentials.', [
                'type' => 'login_failed',
                'attempted_email' => $credentials['email'],
            ], $this);

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
        RateLimiter::clear($this->accountThrottleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 20)) {
            return;
        }

        event(new Lockout($this));
        cms_security_log('warning', 'Admin login rate limit triggered.', [
            'type' => 'rate_limit_exceeded',
            'attempted_email' => cms_email((string) $this->string('email')),
        ]);
        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Ensure the account-wide login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureAccountIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->accountThrottleKey(), 30)) {
            return;
        }

        event(new Lockout($this));
        cms_security_log('warning', 'Admin login account rate limit triggered.', [
            'type' => 'rate_limit_exceeded',
            'attempted_email' => cms_email((string) $this->string('email')),
        ]);

        $seconds = RateLimiter::availableIn($this->accountThrottleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }

    public function accountThrottleKey(): string
    {
        return 'login-account:'.Str::transliterate(Str::lower($this->string('email')));
    }
}
