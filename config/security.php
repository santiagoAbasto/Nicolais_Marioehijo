<?php

$emails = array_filter(array_map(
    static fn (string $email): string => strtolower(trim($email)),
    explode(',', (string) env('ADMIN_ALLOWED_EMAILS', ''))
));

$trustedProxies = array_values(array_filter(array_map(
    static fn (string $proxy): string => trim($proxy),
    explode(',', (string) env('TRUSTED_PROXIES', ''))
)));

return [
    'admin_allowed_emails' => array_values($emails),
    'trusted_proxies' => $trustedProxies,
    'forms' => [
        'honeypot_field' => env('FORM_HONEYPOT_FIELD', 'nm_form_check'),
        'max_attempts' => (int) env('FORM_RATE_LIMIT_MAX_ATTEMPTS', env('APP_ENV') === 'local' ? 120 : 5),
        'decay_seconds' => (int) env('FORM_RATE_LIMIT_DECAY_SECONDS', 60),
        'minimum_seconds' => [
            'web.contact.store' => 0,
            'web.quote.store' => 3,
            'web.catalog.store' => 3,
            'web.clients.store' => 10,
            'web.newsletter.store' => 1,
            'contacto' => 0,
            'presupuesto' => 3,
            'catalogo' => 3,
            'clientes/solicitud' => 10,
            'newsletter' => 1,
        ],
    ],
    'uploads' => [
        'page_media' => [
            'image_max_kb' => (int) env('PAGE_MEDIA_IMAGE_MAX_KB', 10240),
            'video_max_kb' => (int) env('PAGE_MEDIA_VIDEO_MAX_KB', 20480),
            'image_mimes' => ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            'image_mimetypes' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            'document_mimes' => ['pdf'],
            'document_mimetypes' => ['application/pdf'],
            'office_mimes' => ['doc', 'docx', 'xls', 'xlsx', 'csv'],
            'office_mimetypes' => [
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/csv',
                'text/plain',
            ],
            'video_extensions' => ['mp4', 'webm', 'ogg', 'mov'],
            'video_mimetypes' => ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
        ],
    ],
];
