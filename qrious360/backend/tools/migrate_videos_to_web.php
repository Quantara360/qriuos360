<?php
/**
 * One-time migration: re-encode existing dish 360 videos to web-optimised MP4.
 *
 * What it does per video:
 *   - H.264 CRF26, preset fast  (good quality, ~1–3 MB for a 30s clip)
 *   - -movflags +faststart       (moov atom at front — browser seeks before full download)
 *   - scale to max 960×540       (matches frame-extraction canvas in Dish360Viewer)
 *   - strip audio (-an)          (360 dish videos are always muted)
 *
 * Usage (CLI):
 *   php tools/migrate_videos_to_web.php
 *   DRY_RUN=1 php tools/migrate_videos_to_web.php     (print plan, no changes)
 *
 * Usage (web — requires MIGRATE_KEY env var on the server):
 *   /tools/migrate_videos_to_web.php?key=<MIGRATE_KEY>
 *   /tools/migrate_videos_to_web.php?key=<MIGRATE_KEY>&dry=1
 */

// ── Auth guard ────────────────────────────────────────────────────────────────
if (php_sapi_name() !== 'cli') {
    $envKey = getenv('MIGRATE_KEY') ?: '';
    $reqKey = $_GET['key'] ?? '';
    if (!$envKey || !hash_equals($envKey, $reqKey)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}

$uploadDir = realpath(__DIR__ . '/../uploads') . DIRECTORY_SEPARATOR;
$dryRun    = (getenv('DRY_RUN') === '1') || (($_GET['dry'] ?? '0') === '1');

// ── Find FFmpeg ───────────────────────────────────────────────────────────────
function find_ffmpeg(): string {
    $candidates = [
        getenv('FFMPEG_PATH') ?: '',
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
    ];
    foreach ($candidates as $p) {
        if ($p && is_executable($p)) return $p;
    }
    // Search PATH — Unix and Windows
    $isWin = DIRECTORY_SEPARATOR === '\\';
    $out   = $isWin
        ? trim((string) shell_exec('where ffmpeg 2>NUL'))
        : trim((string) shell_exec('which ffmpeg 2>/dev/null'));
    // 'where' can return multiple lines; take the first executable one
    foreach (explode("\n", $out) as $line) {
        $line = trim($line);
        if ($line && (is_executable($line) || $isWin)) return $line;
    }
    return '';
}

$ffmpeg = find_ffmpeg();
if (!$ffmpeg) {
    exit_msg('ERROR: FFmpeg not found. Install it on the server first (apt-get install ffmpeg).');
}

// ── Collect video files ───────────────────────────────────────────────────────
$files = glob($uploadDir . 'video_*.mp4');
$files = array_merge($files ?: [], glob($uploadDir . 'video_*.webm') ?: [], glob($uploadDir . 'video_*.mov') ?: []);

if (!$files) exit_msg('No video_* files found in uploads/. Nothing to do.');

$results = ['optimised' => [], 'skipped' => [], 'failed' => []];

foreach ($files as $srcPath) {
    $srcName  = basename($srcPath);
    $origSize = filesize($srcPath);

    // Always output as .mp4 (even if source is .webm or .mov)
    $outName = preg_replace('/\.(webm|mov)$/i', '.mp4', $srcName);
    $outPath = $uploadDir . $outName;
    $tmpPath = $uploadDir . 'tmp_' . $outName;

    if ($dryRun) {
        $results['optimised'][] = sprintf('%s  (%s) → would re-encode', $srcName, fmt_size($origSize));
        continue;
    }

    // Build FFmpeg command
    $cmd = sprintf(
        '%s -i %s'
        . ' -c:v libx264 -crf 26 -preset fast'
        . ' -vf "scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2:black"'
        . ' -an -movflags +faststart'
        . ' -y %s 2>&1',
        escapeshellarg($ffmpeg),
        escapeshellarg($srcPath),
        escapeshellarg($tmpPath)
    );

    exec($cmd, $cmdOut, $code);

    if ($code !== 0 || !file_exists($tmpPath) || filesize($tmpPath) < 1000) {
        @unlink($tmpPath);
        $results['failed'][] = sprintf('%s — FFmpeg error (exit %d)', $srcName, $code);
        continue;
    }

    $newSize = filesize($tmpPath);

    // Only replace if the re-encoded file is actually smaller (safety guard)
    if ($newSize >= $origSize) {
        @unlink($tmpPath);
        $results['skipped'][] = sprintf('%s — already optimised (%s)', $srcName, fmt_size($origSize));
        continue;
    }

    // Atomic replace: rename tmp → dest, delete original if name changed
    rename($tmpPath, $outPath);
    if ($outPath !== $srcPath) @unlink($srcPath);

    $results['optimised'][] = sprintf(
        '%s → %s   %s → %s  (%d%% smaller)',
        $srcName, $outName,
        fmt_size($origSize), fmt_size($newSize),
        round((1 - $newSize / $origSize) * 100)
    );
}

// ── Output ────────────────────────────────────────────────────────────────────
if (php_sapi_name() === 'cli') {
    echo ($dryRun ? "[DRY RUN] " : "") . "Video migration complete.\n\n";
    foreach (['optimised', 'skipped', 'failed'] as $k) {
        echo strtoupper($k) . ' (' . count($results[$k]) . "):\n";
        foreach ($results[$k] as $line) echo "  $line\n";
        echo "\n";
    }
} else {
    header('Content-Type: application/json');
    echo json_encode(['dry_run' => $dryRun] + $results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt_size(int $bytes): string {
    if ($bytes >= 1024 * 1024) return round($bytes / 1024 / 1024, 1) . ' MB';
    return round($bytes / 1024) . ' KB';
}

function exit_msg(string $msg): void {
    if (php_sapi_name() === 'cli') {
        echo $msg . "\n";
    } else {
        header('Content-Type: application/json');
        echo json_encode(['message' => $msg]);
    }
    exit;
}
