<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

echo json_encode([
    'success' => true,
    'status' => 'ok',
    'env' => app_env(),
    'timestamp' => date(DATE_ATOM),
], JSON_UNESCAPED_SLASHES);
