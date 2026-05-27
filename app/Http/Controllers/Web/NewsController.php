<?php

namespace App\Http\Controllers\Web;

use App\Models\Post;
use Illuminate\Contracts\View\View;

class NewsController extends WebPlaceholderController
{
    public function index(): View
    {
        $posts = Post::query()
            ->with(['category', 'coverMedia'])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('published_at')
            ->paginate(12);

        return view('web.news.index', compact('posts'));
    }

    public function show(string $slug): View
    {
        $post = Post::query()
            ->with(['category', 'coverMedia'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        return view('web.news.show', compact('post'));
    }
}
