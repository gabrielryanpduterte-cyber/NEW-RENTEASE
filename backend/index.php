<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

echo json_encode([
    'success' => true,
    'message' => 'RentEase backend is running.',
    'data' => [
        'service' => 'backend',
        'environment' => app_env(),
        'health' => '/ping.php',
        'frontend' => config_value('RENTEASE_FRONTEND_URL', 'http://localhost:5173'),
        'timestamp' => date(DATE_ATOM),
    ],
], JSON_UNESCAPED_SLASHES);
