<?php
/**
 * One-time migration: convert existing JPG/PNG uploads to WebP and update all DB references.
 *
 * Usage (CLI):  php tools/migrate_images_to_webp.php
 * Usage (web):  /tools/migrate_images_to_webp.php?key=<MIGRATE_KEY>
 *               Set MIGRATE_KEY env var on the server for the web path.
 *
 * The script is non-destructive: it converts files and updates the DB, then
 * deletes the originals. If a conversion fails the original is kept untouched.
 *
 * DRY_RUN=1 php tools/migrate_images_to_webp.php
 * prints what it would do without writing anything.
 */

// ── Auth guard (web path only) ────────────────────────────────────────────────
if (php_sapi_name() !== 'cli') {
    $envKey = getenv('MIGRATE_KEY') ?: '';
    $reqKey = $_GET['key'] ?? '';
    if (!$envKey || !hash_equals($envKey, $reqKey)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}

require_once __DIR__ . '/../config/db.php';

$uploadDir = realpath(__DIR__ . '/../uploads') . DIRECTORY_SEPARATOR;
$dryRun    = (getenv('DRY_RUN') === '1') || (($_GET['dry'] ?? '0') === '1');
$maxW      = 1400;
$maxH      = 1400;
$quality   = 82;

if (!function_exists('imagewebp')) {
    exit_msg('ERROR: GD with WebP support is not available. Rebuild the container first.');
}

$results = ['converted' => [], 'skipped' => [], 'failed' => []];

// ── 1. Collect all image files ────────────────────────────────────────────────
$files = glob($uploadDir . '*.{jpg,jpeg,png}', GLOB_BRACE);
if (!$files) exit_msg('No JPG/PNG files found in uploads/. Nothing to do.');

foreach ($files as $srcPath) {
    $srcName = basename($srcPath);
    $mime    = mime_content_type($srcPath);
    $loader  = match($mime) {
        'image/jpeg' => 'imagecreatefromjpeg',
        'image/png'  => 'imagecreatefrompng',
        default      => null,
    };
    if (!$loader) { $results['skipped'][] = $srcName; continue; }

    $src = @$loader($srcPath);
    if (!$src) { $results['failed'][] = "$srcName (could not decode)"; continue; }

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

    // Derive new filename (same base, .webp extension)
    $newName = preg_replace('/\.(jpg|jpeg|png)$/i', '.webp', $srcName);
    $dstPath = $uploadDir . $newName;

    if (!$dryRun) {
        if (!imagewebp($dst, $dstPath, $quality)) {
            imagedestroy($src); imagedestroy($dst);
            $results['failed'][] = "$srcName (imagewebp failed)";
            continue;
        }
        // Update every DB column that might hold this filename
        update_db_references($srcName, $newName);
        @unlink($srcPath);
    }

    imagedestroy($src);
    imagedestroy($dst);

    $origKB = round(filesize($srcPath) / 1024);
    $newKB  = $dryRun ? '?' : round(filesize($dstPath) / 1024);
    $results['converted'][] = "$srcName → $newName  ({$origKB} KB → {$newKB} KB)";
}

// ── Output ────────────────────────────────────────────────────────────────────
$out = [
    'dry_run'   => $dryRun,
    'converted' => $results['converted'],
    'skipped'   => $results['skipped'],
    'failed'    => $results['failed'],
];

if (php_sapi_name() === 'cli') {
    echo ($dryRun ? "[DRY RUN] " : "") . "Migration complete.\n";
    foreach (['converted','skipped','failed'] as $k) {
        echo strtoupper($k) . " (" . count($results[$k]) . "):\n";
        foreach ($results[$k] as $line) echo "  $line\n";
    }
} else {
    header('Content-Type: application/json');
    echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// ── DB reference updater ──────────────────────────────────────────────────────
function update_db_references(string $oldName, string $newName): void {
    $pdo = db();

    // users table: logo_path, banner_path
    $pdo->prepare("UPDATE users SET logo_path   = ? WHERE logo_path   = ?")->execute([$newName, $oldName]);
    $pdo->prepare("UPDATE users SET banner_path  = ? WHERE banner_path  = ?")->execute([$newName, $oldName]);

    // dishes table: image_path (and image_path_2/3 if they exist)
    $cols = ['image_path', 'image_path_2', 'image_path_3'];
    foreach ($cols as $col) {
        try {
            $pdo->prepare("UPDATE dishes SET $col = ? WHERE $col = ?")->execute([$newName, $oldName]);
        } catch (\Throwable) {}
    }

    // pages table: content is JSON — do a string replace inside the JSON blob
    $stmt = $pdo->query("SELECT page_key, content FROM pages");
    foreach ($stmt->fetchAll() as $row) {
        if (!str_contains($row['content'], $oldName)) continue;
        $updated = str_replace($oldName, $newName, $row['content']);
        $pdo->prepare("UPDATE pages SET content = ? WHERE page_key = ?")->execute([$updated, $row['page_key']]);
    }
}

function exit_msg(string $msg): void {
    if (php_sapi_name() === 'cli') { echo $msg . "\n"; }
    else { header('Content-Type: application/json'); echo json_encode(['message' => $msg]); }
    exit;
}
