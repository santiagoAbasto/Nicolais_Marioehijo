<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('admin.profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();
        $principalId = \App\Models\User::query()->orderBy('id')->value('id');

        cms_security_log('warning', 'Blocked self-account deletion from profile.', [
            'target_user_id' => $user?->id,
            'is_principal' => (int) $user?->id === (int) $principalId,
        ], $request);

        return Redirect::route('admin.profile.edit')->with(
            'error',
            (int) $user?->id === (int) $principalId
                ? 'El usuario principal no puede eliminarse.'
                : 'No puedes eliminar tu propia cuenta desde esta sección.'
        );
    }
}
