<?php
require_once __DIR__ . '/../config/bootstrap.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':         handle_login();         break;
    case 'register':      handle_register();      break;
    case 'logout':        handle_logout();        break;
    case 'me':            handle_me();            break;
    case 'hotel_info':    handle_hotel_info();    break;
    case 'hotels':        handle_hotels();        break;
    case 'update_banner':         handle_update_banner();         break;
    case 'update_profile':        handle_update_profile();        break;
    case 'update_drone_footage':  handle_update_drone_footage();  break;
    default:                      fail('Unknown auth action', 404);
}

function handle_login(): void {
    if (method() !== 'POST') fail('Method not allowed', 405);
    $data = json_input();
    $email    = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    if (!$email || !$password) fail('Email and password required');

    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        fail('Invalid email or password', 401);
    }
    if (!$user['approved']) fail('Account pending admin approval', 403);

    $_SESSION['user_id'] = $user['id'];
    unset($user['password_hash']);
    send_json(['user' => $user]);
}

function handle_register(): void {
    if (method() !== 'POST') fail('Method not allowed', 405);

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($contentType, 'multipart/form-data')) {
        $name     = trim($_POST['name'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $role     = $_POST['role'] ?? 'customer';
        $hotel    = trim($_POST['hotel_name'] ?? '');
    } else {
        $data     = json_input();
        $name     = trim($data['name'] ?? '');
        $email    = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $role     = $data['role'] ?? 'customer';
        $hotel    = trim($data['hotel_name'] ?? '');
    }

    if (!$name || !$email || !$password) fail('Name, email and password required');
    if (strlen($password) < 6) fail('Password must be at least 6 characters');
    if (!in_array($role, ['customer', 'owner'], true)) fail('Invalid role');
    if ($role === 'owner' && !$hotel) fail('Hotel name required for owner');

    $stmt = db()->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) fail('Email already registered', 409);

    $logoPath = null;
    if ($role === 'owner' && !empty($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
        $logoPath = save_logo($_FILES['logo']);
    }

    $qrToken = null;
    if ($role === 'owner') {
        do {
            $qrToken = bin2hex(random_bytes(16));
            $check = db()->prepare('SELECT id FROM users WHERE qr_token = ?');
            $check->execute([$qrToken]);
        } while ($check->fetch());
    }

    $approved = $role === 'owner' ? 0 : 1;

    $stmt = db()->prepare(
        'INSERT INTO users (name, email, password_hash, role, hotel_name, logo_path, qr_token, approved)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $name,
        $email,
        password_hash($password, PASSWORD_BCRYPT),
        $role,
        $role === 'owner' ? $hotel : null,
        $logoPath,
        $qrToken,
        $approved,
    ]);

    send_json([
        'message'  => $approved
            ? 'Account created. You can log in now.'
            : 'Account created. Awaiting admin approval.',
        'approved' => (bool)$approved,
    ], 201);
}

function handle_logout(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    send_json(['message' => 'Logged out']);
}

function handle_me(): void {
    $user = current_user();
    send_json(['user' => $user]);
}

// Public: get hotel info by QR token
function handle_hotel_info(): void {
    $token = trim($_GET['token'] ?? '');
    if (!$token) fail('Token required');

    $stmt = db()->prepare('SELECT id, name, hotel_name, logo_path, banner_path, drone_footage_path FROM users WHERE qr_token = ? AND role = "owner"');
    $stmt->execute([$token]);
    $hotel = $stmt->fetch();
    if (!$hotel) fail('Hotel not found', 404);

    send_json(['hotel' => $hotel]);
}

// Public: list all approved hotels
function handle_hotels(): void {
    $stmt = db()->query("
        SELECT u.id, u.name, u.hotel_name, u.logo_path, u.banner_path, u.qr_token,
               COUNT(d.id) AS dish_count
        FROM users u
        LEFT JOIN dishes d ON d.owner_id = u.id AND d.available = 1
        WHERE u.role = 'owner' AND u.approved = 1 AND u.qr_token IS NOT NULL
        GROUP BY u.id
        ORDER BY u.hotel_name
    ");
    send_json(['hotels' => $stmt->fetchAll()]);
}

// Owner: upload or remove hotel banner
function handle_update_banner(): void {
    $user = require_role('owner');
    if (method() !== 'POST') fail('POST required', 405);

    // Fetch current banner so we can delete the old file
    $cur = db()->prepare('SELECT banner_path FROM users WHERE id = ?');
    $cur->execute([$user['id']]);
    $row = $cur->fetch();

    // Remove-only mode
    if (!empty($_POST['remove'])) {
        if ($row && $row['banner_path']) {
            @unlink(__DIR__ . '/../uploads/' . $row['banner_path']);
        }
        db()->prepare('UPDATE users SET banner_path = NULL WHERE id = ?')->execute([$user['id']]);
        send_json(['banner_path' => null]);
    }

    if (empty($_FILES['banner']) || $_FILES['banner']['error'] !== UPLOAD_ERR_OK) {
        fail('Banner image required');
    }

    if ($row && $row['banner_path']) {
        @unlink(__DIR__ . '/../uploads/' . $row['banner_path']);
    }

    $bannerPath = save_banner($_FILES['banner']);
    db()->prepare('UPDATE users SET banner_path = ? WHERE id = ?')->execute([$bannerPath, $user['id']]);
    send_json(['banner_path' => $bannerPath]);
}

// Owner or Admin: update display name, hotel name (owners only), logo (owners only), optional password
function handle_update_profile(): void {
    $user = require_role('owner', 'admin', 'sub_admin');
    if (method() !== 'POST') fail('POST required', 405);

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($contentType, 'multipart/form-data')) {
        $name  = trim($_POST['name'] ?? '');
        $hotel = trim($_POST['hotel_name'] ?? '');
        $oldPw = $_POST['old_password'] ?? '';
        $newPw = $_POST['new_password'] ?? '';
    } else {
        $data  = json_input();
        $name  = trim($data['name'] ?? '');
        $hotel = trim($data['hotel_name'] ?? '');
        $oldPw = $data['old_password'] ?? '';
        $newPw = $data['new_password'] ?? '';
    }

    if (!$name) fail('Name is required');
    if ($user['role'] === 'owner' && !$hotel) fail('Hotel name is required');
    $hotel = $hotel ?: ($user['hotel_name'] ?? '');

    $passwordHash = null;
    if ($newPw) {
        if (!$oldPw) fail('Current password required to change password');
        if (strlen($newPw) < 6) fail('New password must be at least 6 characters');
        $row = db()->prepare('SELECT password_hash FROM users WHERE id = ?');
        $row->execute([$user['id']]);
        $hash = $row->fetchColumn();
        if (!password_verify($oldPw, $hash)) fail('Current password is incorrect', 400);
        $passwordHash = password_hash($newPw, PASSWORD_BCRYPT);
    }

    $logoPath = $user['logo_path'] ?? null;

    if ($passwordHash) {
        db()->prepare('UPDATE users SET name = ?, hotel_name = ?, logo_path = ?, password_hash = ? WHERE id = ?')
           ->execute([$name, $hotel ?: null, $logoPath, $passwordHash, $user['id']]);
    } else {
        db()->prepare('UPDATE users SET name = ?, hotel_name = ?, logo_path = ? WHERE id = ?')
           ->execute([$name, $hotel ?: null, $logoPath, $user['id']]);
    }

    write_log('Updated profile', 'user', (int)$user['id'], "Name: {$name}");

    $stmt = db()->prepare('SELECT id, name, email, role, hotel_name, logo_path, banner_path, qr_token, approved, dish_quota FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $updated = $stmt->fetch();
    send_json(['user' => $updated, 'message' => 'Profile updated']);
}

function save_logo(array $file): string {
    // Logos render at ~90 px; 400 px gives 4× retina headroom.
    return save_image_as_webp($file, 'logo_', 400, 400, 85, 4 * 1024 * 1024);
}

function save_banner(array $file): string {
    // Banners span the hotel page header — cap at 1400 × 700.
    return save_image_as_webp($file, 'banner_', 1400, 700, 82, 8 * 1024 * 1024);
}

// Owner: upload or remove drone footage video
function handle_update_drone_footage(): void {
    $user = require_role('owner');
    if (method() !== 'POST') fail('POST required', 405);

    $cur = db()->prepare('SELECT drone_footage_path FROM users WHERE id = ?');
    $cur->execute([$user['id']]);
    $row = $cur->fetch();

    // Remove-only mode
    if (!empty($_POST['remove'])) {
        if ($row && $row['drone_footage_path']) {
            @unlink(__DIR__ . '/../uploads/' . $row['drone_footage_path']);
        }
        db()->prepare('UPDATE users SET drone_footage_path = NULL WHERE id = ?')->execute([$user['id']]);
        send_json(['drone_footage_path' => null]);
    }

    if (empty($_FILES['drone_footage']) || $_FILES['drone_footage']['error'] !== UPLOAD_ERR_OK) {
        fail('Drone footage video required');
    }

    $path = save_video($_FILES['drone_footage']);

    // Delete old file
    if ($row && $row['drone_footage_path']) {
        @unlink(__DIR__ . '/../uploads/' . $row['drone_footage_path']);
    }

    db()->prepare('UPDATE users SET drone_footage_path = ? WHERE id = ?')
       ->execute([$path, $user['id']]);

    write_log('Updated drone footage', 'user', (int)$user['id']);
    send_json(['drone_footage_path' => $path]);
}

function save_video(array $file): string {
    $allowed = [
        'video/mp4'       => 'mp4',
        'video/webm'      => 'webm',
        'video/quicktime' => 'mov',
        'video/x-msvideo' => 'avi',
    ];
    $mime = mime_content_type($file['tmp_name']);
    if (!isset($allowed[$mime])) fail('Video must be MP4, WebM, MOV or AVI', 415);
    if ($file['size'] > 300 * 1024 * 1024) fail('Video must be smaller than 300 MB', 413);

    $ext  = $allowed[$mime];
    $name = 'drone_' . bin2hex(random_bytes(8)) . '.' . $ext;
    $dest = __DIR__ . '/../uploads/' . $name;
    if (!move_uploaded_file($file['tmp_name'], $dest)) fail('Failed to save video', 500);
    return $name;
}
