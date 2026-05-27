<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $authUser = $request->user('admin');
        $principalId = $this->principalId();
        $isSuperAdmin = (int) $authUser?->id === (int) $principalId;

        $users = User::query()
            ->where('can_access_admin', true)
            ->when(! $isSuperAdmin, fn ($query) => $query->whereKey($authUser?->id))
            ->orderBy('id')
            ->get()
            ->map(fn (User $user) => $this->serializeUser($user, $principalId));

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'principalId' => $principalId,
            'isSuperAdmin' => $isSuperAdmin,
            'canManageUsers' => $isSuperAdmin,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'confirmed', 'min:8'],
            'avatar' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/svg+xml', 'max:5120'],
            'can_access_admin' => ['sometimes', 'boolean'],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
        ]);

        $user->forceFill([
            'password' => Hash::make($data['password']),
            'can_access_admin' => (bool) ($data['can_access_admin'] ?? true),
            'email_verified_at' => now(),
        ])->save();

        $this->syncAvatar($request, $user);

        return back()->with('success', 'Usuario administrador creado correctamente.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $authUser = $request->user('admin');
        $principalId = $this->principalId();
        $isSuperAdmin = (int) $authUser?->id === (int) $principalId;
        $isTargetPrincipal = (int) $user->id === (int) $principalId;

        if (! $user->can_access_admin) {
            abort(404);
        }

        if (! $isSuperAdmin && (int) $authUser?->id !== (int) $user->id) {
            abort(403, 'No tienes permisos para modificar este usuario.');
        }

        if (! $isSuperAdmin) {
            $data = $request->validate([
                'password' => ['required', 'confirmed', 'min:8'],
            ]);

            $user->forceFill([
                'password' => Hash::make($data['password']),
            ])->save();

            return back()->with('success', 'Contraseña actualizada correctamente.');
        }

        if ($isTargetPrincipal) {
            $data = $request->validate([
                'password' => ['nullable', 'confirmed', 'min:8'],
                'avatar' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/svg+xml', 'max:5120'],
                'remove_avatar' => ['sometimes', 'boolean'],
            ]);

            if (! empty($data['password'])) {
                $user->forceFill([
                    'password' => Hash::make($data['password']),
                ])->save();
            }

            $this->syncAvatar($request, $user);

            return back()->with('success', 'Superadmin actualizado correctamente.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'confirmed', 'min:8'],
            'avatar' => ['nullable', 'file', 'mimetypes:image/jpeg,image/png,image/webp,image/svg+xml', 'max:5120'],
            'remove_avatar' => ['sometimes', 'boolean'],
            'can_access_admin' => ['sometimes', 'boolean'],
        ]);

        $user->fill([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'can_access_admin' => (bool) ($data['can_access_admin'] ?? false),
        ]);

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();
        $this->syncAvatar($request, $user);

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorizeSuperAdmin($request);

        $principalId = $this->principalId();

        if (! $user->can_access_admin) {
            abort(404);
        }

        if ((int) $user->id === (int) $principalId) {
            return back()->withErrors(['user' => 'El superadmin no puede eliminarse.']);
        }

        if ((int) $request->user('admin')?->id === (int) $user->id) {
            return back()->withErrors(['user' => 'No puedes eliminar tu propio usuario.']);
        }

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->delete();

        return back()->with('success', 'Usuario eliminado correctamente.');
    }

    private function serializeUser(User $user, ?int $principalId): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
            'can_access_admin' => (bool) $user->can_access_admin,
            'is_principal' => (int) $user->id === (int) $principalId,
            'is_super_admin' => (int) $user->id === (int) $principalId,
            'created_at' => optional($user->created_at)->format('d/m/Y, H:i'),
        ];
    }

    private function principalId(): ?int
    {
        return User::query()->orderBy('id')->value('id');
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        if ((int) $request->user('admin')?->id !== (int) $this->principalId()) {
            abort(403, 'Solo el superadmin puede administrar usuarios.');
        }
    }

    private function syncAvatar(Request $request, User $user): void
    {
        if ($request->boolean('remove_avatar') && $user->avatar) {
            if (Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $user->forceFill(['avatar' => null])->save();
        }

        if (! $request->hasFile('avatar')) {
            return;
        }

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('uploads/admin-users/'.now()->format('Y/m'), 'public');

        $user->forceFill(['avatar' => $path])->save();
    }
}
