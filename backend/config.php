<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Manila');

function load_backend_env(): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }
    $loaded = true;

    $envPath = __DIR__ . '/.env';
    if (!is_file($envPath) || !is_readable($envPath)) {
        return;
    }

    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }

        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        if ($name === '' || getenv($name) !== false) {
            continue;
        }

        $value = trim($value);
        if (
            strlen($value) >= 2
            && (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === "'" && substr($value, -1) === "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        putenv("{$name}={$value}");
        $_ENV[$name] = $value;
    }
}

load_backend_env();

function config_value(string $name, string $defaultValue = '', array $aliases = []): string
{
    foreach (array_merge([$name], $aliases) as $candidate) {
        $value = getenv($candidate);
        if ($value !== false && $value !== '') {
            return $value;
        }
    }

    return $defaultValue;
}

function app_env(): string
{
    return config_value('RENTEASE_APP_ENV', 'local', ['RAILWAY_ENVIRONMENT_NAME']);
}

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

function cors_origin_allowed(string $origin, array $allowedOrigins): bool
{
    foreach ($allowedOrigins as $allowedOrigin) {
        if ($origin === $allowedOrigin) {
            return true;
        }

        if (strpos($allowedOrigin, '*') !== false) {
            $pattern = '#^' . str_replace('\*', '[^/]+', preg_quote($allowedOrigin, '#')) . '$#i';
            if (preg_match($pattern, $origin) === 1) {
                return true;
            }
        }
    }

    return false;
}

function request_is_secure(): bool
{
    $https = strtolower((string)($_SERVER['HTTPS'] ?? ''));
    $forwardedProto = strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
    $forwardedSsl = strtolower((string)($_SERVER['HTTP_X_FORWARDED_SSL'] ?? ''));

    return ($https !== '' && $https !== 'off')
        || $forwardedProto === 'https'
        || $forwardedSsl === 'on'
        || (int)($_SERVER['SERVER_PORT'] ?? 0) === 443;
}

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Max-Age: 600');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');

    $requestOrigin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    $allowedOrigins = cors_allowed_origins();

    if ($requestOrigin !== '' && cors_origin_allowed($requestOrigin, $allowedOrigins)) {
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
    $isSecure = request_is_secure();
    $sameSite = ucfirst(strtolower(config_value('RENTEASE_COOKIE_SAMESITE', 'Lax')));
    if (!in_array($sameSite, ['Lax', 'Strict', 'None'], true)) {
        $sameSite = 'Lax';
    }
    if ($sameSite === 'None' && !$isSecure) {
        $sameSite = 'Lax';
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => config_value('RENTEASE_COOKIE_DOMAIN', ''),
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => $sameSite,
    ]);
    session_start();
}

function db_config(string $name, string $defaultValue, array $aliases = []): string
{
    return config_value($name, $defaultValue, $aliases);
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

    $host = db_config('RENTEASE_DB_HOST', 'localhost', ['MYSQLHOST', 'MYSQL_HOST']);
    $port = db_config('RENTEASE_DB_PORT', '3307', ['MYSQLPORT', 'MYSQL_PORT']);
    $name = db_config('RENTEASE_DB_NAME', 'rentease_db', ['MYSQLDATABASE', 'MYSQL_DATABASE']);
    $user = db_config('RENTEASE_DB_USER', 'root', ['MYSQLUSER', 'MYSQL_USER']);
    $pass = db_config('RENTEASE_DB_PASS', '', ['MYSQLPASSWORD', 'MYSQL_PASSWORD']);
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
