<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- CSRF meta tag — Inertia/axios reads XSRF-TOKEN cookie automatically,
    but this meta is a reliable fallback for raw fetch() calls. --}}
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Auth globals for real-time chat — must run before Inertia hydrates.
    Read by conversation-list.tsx / show.tsx for sender-side dedupe. --}}
    <script>
        window.__authUserId = {{ auth()->id() ?? 'null' }};
        window.__authUserName = @json(auth()->user()?->name);
    </script>

    {{-- Detect system dark-mode preference and apply immediately (avoids flash) --}}
    <script>
        (function () {
            const appearance = '{{ $appearance ?? "system" }}';
            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Theme background before CSS loads --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    @fonts

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])

    <x-inertia::head>
        <title>{{ config('app.name', 'Laravel') }}</title>
    </x-inertia::head>
</head>

<body class="font-sans antialiased">
    <x-inertia::app />
</body>

</html>