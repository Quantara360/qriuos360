<?php
// =====================================================
// Bootstrap — included by every endpoint.
// Handles CORS, tokens, session, JSON I/O, role guards.
// =====================================================

// --- CORS (so Vite dev server on :5173 can call us) ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Session (cross-origin needs SameSite=None + Secure on prod) ---
session_set_cookie_params([
    'lifetime' => 60 * 60 * 24 * 7,
    'path'     => '/',
    'samesite' => 'Lax',
]);
session_start();

require_once __DIR__ . '/db.php';

// --- Token secret (set APP_SECRET env var in production) ---
define('TOKEN_SECRET', getenv('APP_SECRET') ?: 'dishcraft-change-this-in-production');
define('TOKEN_TTL', 60 * 60 * 24 * 7); // 7 days

// --- JSON helpers ---
function json_input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function send_json($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function fail(string $message, int $status = 400): void {
    send_json(['error' => $message], $status);
}

// --- Token helpers ---

/** Create a signed Bearer token that encodes user ID + expiry. */
function generate_token(int $userId): string {
    $payload = $userId . '|' . (time() + TOKEN_TTL);
    $sig     = hash_hmac('sha256', $payload, TOKEN_SECRET);
    return base64_encode($payload . '|' . $sig);
}

/** Verify a Bearer token and return the user ID, or null if invalid/expired. */
function verify_token(string $token): ?int {
    $decoded = base64_decode($token, true);
    if ($decoded === false) return null;

    $parts = explode('|', $decoded, 3);
    if (count($parts) !== 3) return null;

    [$userId, $expiry, $sig] = $parts;
    $payload  = $userId . '|' . $expiry;
    $expected = hash_hmac('sha256', $payload, TOKEN_SECRET);

    if (!hash_equals($expected, $sig)) return null;
    if ((int)$expiry < time()) return null;

    return (int)$userId;
}

/** Extract the raw token string from the Authorization: Bearer header. */
function get_bearer_token(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
        return $m[1];
    }
    return null;
}

// --- Auth guards ---

/** Resolve the authenticated user from Bearer token (primary) or session (fallback). */
function current_user(): ?array {
    $userId = null;

    $token = get_bearer_token();
    if ($token !== null) {
        $userId = verify_token($token);
    }

    if ($userId === null && !empty($_SESSION['user_id'])) {
        $userId = (int)$_SESSION['user_id'];
    }

    if ($userId === null) return null;

    $stmt = db()->prepare('SELECT id, name, email, role, hotel_name, approved FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    return ($user && $user['approved']) ? $user : null;
}

function require_login(): array {
    $user = current_user();
    if (!$user) fail('Authentication required', 401);
    return $user;
}

function require_role(string ...$roles): array {
    $user = require_login();
    if (!in_array($user['role'], $roles, true)) fail('Forbidden', 403);
    return $user;
}

// --- Routing helper ---
function method(): string {
    return $_SERVER['REQUEST_METHOD'];
}
