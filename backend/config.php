<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Manila');

function cors_allowed_origins(): array
{
    $raw = getenv('RENTEASE_ALLOWED_ORIGINS');
    if ($raw === false || trim($raw) === '') {
        return [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:4173',
            'http://127.0.0.1:4173',
        ];
    }

    $entries = array_map('trim', explode(',', $raw));
    return array_values(array_filter($entries, static fn($value) => $value !== ''));
}

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');

    $requestOrigin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    $allowedOrigins = cors_allowed_origins();

    if ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$requestOrigin}");
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    } elseif ($requestOrigin !== '') {
        header('Access-Control-Allow-Origin: null');
        header('Vary: Origin');
    } else {
        header('Access-Control-Allow-Origin: *');
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    $isSecure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function db_config(string $name, string $defaultValue): string
{
    $value = getenv($name);
    if ($value === false || $value === '') {
        return $defaultValue;
    }

    return $value;
}

function database_unavailable(): void
{
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.',
        'data' => new stdClass(),
        'errors' => ['Please verify database credentials and server status.'],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = db_config('RENTEASE_DB_HOST', 'localhost');
    $port = db_config('RENTEASE_DB_PORT', '3307');
    $name = db_config('RENTEASE_DB_NAME', 'rentease_db');
    $user = db_config('RENTEASE_DB_USER', 'root');
    $pass = db_config('RENTEASE_DB_PASS', '');
    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $exception) {
        database_unavailable();
    }

    return $pdo;
}
