<?php
require_once __DIR__ . '/../config/bootstrap.php';

// Action determined by ?action= query param
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':    handle_login();    break;
    case 'register': handle_register(); break;
    case 'logout':   handle_logout();   break;
    case 'me':       handle_me();       break;
    default:         fail('Unknown auth action', 404);
}

function handle_login(): void {
    if (method() !== 'POST') fail('Method not allowed', 405);
    $data = json_input();
    $email = trim($data['email'] ?? '');
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
    $token = generate_token($user['id']);
    unset($user['password_hash']);
    send_json(['user' => $user, 'token' => $token]);
}

function handle_register(): void {
    if (method() !== 'POST') fail('Method not allowed', 405);
    $data = json_input();

    $name     = trim($data['name'] ?? '');
    $email    = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $role     = $data['role'] ?? 'customer';
    $hotel    = trim($data['hotel_name'] ?? '');

    if (!$name || !$email || !$password) fail('Name, email and password required');
    if (strlen($password) < 6) fail('Password must be at least 6 characters');
    if (!in_array($role, ['customer', 'owner'], true)) fail('Invalid role');
    if ($role === 'owner' && !$hotel) fail('Hotel name required for owner');

    $stmt = db()->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) fail('Email already registered', 409);

    // Owners must be approved by admin before they can log in.
    $approved = $role === 'owner' ? 0 : 1;

    $stmt = db()->prepare(
        'INSERT INTO users (name, email, password_hash, role, hotel_name, approved)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $name,
        $email,
        password_hash($password, PASSWORD_BCRYPT),
        $role,
        $role === 'owner' ? $hotel : null,
        $approved,
    ]);

    send_json([
        'message' => $approved
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
