<?php
// =====================================================
// Bootstrap — included by every endpoint.
// Handles CORS, session, JSON I/O, and role guards.
// =====================================================

// --- CORS ---
// In Docker: ALLOWED_ORIGINS env var (comma-separated, e.g. "https://example.com").
// In XAMPP dev: falls back to Vite dev server origins.
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$rawOrigins = getenv('ALLOWED_ORIGINS') ?: 'http://localhost:5173,http://127.0.0.1:5173';
$allowed = array_values(array_filter(array_map('trim', explode(',', $rawOrigins))));
// Auto-include www. variants so https://www.example.com is allowed when https://example.com is listed.
foreach ($allowed as $o) {
    if (str_starts_with($o, 'https://') && !str_starts_with($o, 'https://www.')) {
        $allowed[] = 'https://www.' . substr($o, 8);
    }
}
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
header('Access-Control-Max-Age: 86400');   // cache preflight 24 h — eliminates the extra round-trip on every mobile request
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

// --- Bootstrap tables (idempotent) ---
try { db()->exec("CREATE TABLE IF NOT EXISTS activity_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT,
    user_name   VARCHAR(100),
    user_role   VARCHAR(20),
    action      VARCHAR(150) NOT NULL,
    target_type VARCHAR(50),
    target_id   INT,
    details     TEXT,
    ip          VARCHAR(45),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
)"); } catch (\Exception $e) {}

try { db()->exec("CREATE TABLE IF NOT EXISTS hotel_views (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    owner_id  INT NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_owner (owner_id)
)"); } catch (\Exception $e) {}

// --- JSON helpers ---
function json_input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function send_json(mixed $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function fail(string $message, int $status = 400): void {
    send_json(['error' => $message], $status);
}

// --- Auth guards ---
function current_user(): ?array {
    if (empty($_SESSION['user_id'])) return null;
    $stmt = db()->prepare('SELECT id, name, email, role, hotel_name, logo_path, banner_path, qr_token, approved, dish_quota FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    return $user ?: null;
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

// --- Image upload helper ---
// Saves an uploaded image as WebP (resized to fit maxW × maxH) using GD.
// Falls back to saving the original format unchanged when GD is unavailable.
function save_image_as_webp(
    array  $file,
    string $prefix   = '',
    int    $maxW     = 1200,
    int    $maxH     = 1200,
    int    $quality  = 82,
    int    $maxBytes = 8 * 1024 * 1024
): string {
    static $mimeMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];

    if ($file['error'] !== UPLOAD_ERR_OK) fail('Upload error code ' . $file['error'], 400);
    $mime = mime_content_type($file['tmp_name']);
    if (!array_key_exists($mime, $mimeMap)) fail('Only JPG, PNG, WebP or GIF images are allowed', 415);
    if ($file['size'] > $maxBytes) fail('Image must be under ' . round($maxBytes / 1048576) . ' MB', 413);

    $uploadDir = __DIR__ . '/../uploads/';

    // GD path — converts and resizes to WebP
    if (function_exists('imagewebp')) {
        $src = match($mime) {
            'image/jpeg' => @imagecreatefromjpeg($file['tmp_name']),
            'image/png'  => @imagecreatefrompng($file['tmp_name']),
            'image/webp' => @imagecreatefromwebp($file['tmp_name']),
            'image/gif'  => @imagecreatefromgif($file['tmp_name']),
            default      => null,
        };

        if ($src !== null && $src !== false) {
            $origW = imagesx($src);
            $origH = imagesy($src);
            $scale = min(1.0, $maxW / $origW, $maxH / $origH);
            $newW  = max(1, (int)round($origW * $scale));
            $newH  = max(1, (int)round($origH * $scale));

            $dst = imagecreatetruecolor($newW, $newH);
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            imagefilledrectangle($dst, 0, 0, $newW - 1, $newH - 1,
                imagecolorallocatealpha($dst, 0, 0, 0, 127));
            imagealphablending($dst, true);
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);

            $name = $prefix . bin2hex(random_bytes(8)) . '.webp';
            imagewebp($dst, $uploadDir . $name, $quality);
            imagedestroy($src);
            imagedestroy($dst);
            return $name;
        }
    }

    // Fallback: store original format without conversion
    $name = $prefix . bin2hex(random_bytes(8)) . '.' . $mimeMap[$mime];
    if (!move_uploaded_file($file['tmp_name'], $uploadDir . $name)) fail('Failed to save image', 500);
    return $name;
}

// --- Activity log writer (never throws) ---
function write_log(string $action, string $targetType = '', int $targetId = 0, string $details = ''): void {
    $user = current_user();
    try {
        db()->prepare("
            INSERT INTO activity_logs (user_id, user_name, user_role, action, target_type, target_id, details, ip)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ")->execute([
            $user['id']   ?? null,
            $user['name'] ?? 'System',
            $user['role'] ?? null,
            $action,
            $targetType ?: null,
            $targetId   ?: null,
            $details    ?: null,
            $_SERVER['REMOTE_ADDR'] ?? null,
        ]);
    } catch (\Throwable) {}
}
