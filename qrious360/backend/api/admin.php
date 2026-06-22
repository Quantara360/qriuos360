<?php
require_once __DIR__ . '/../config/bootstrap.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'users':         handle_list_users();      break;
    case 'approve':       handle_approve_owner();   break;
    case 'set_role':      handle_set_role();        break;
    case 'delete_user':   handle_delete_user();     break;
    case 'stats':         handle_stats();           break;
    default:              fail('Unknown action', 404);
}

function handle_list_users(): void {
    require_role('admin', 'sub_admin');
    $stmt = db()->query("
        SELECT id, name, email, role, hotel_name, approved, created_at,
            (SELECT COUNT(*) FROM dishes WHERE owner_id = users.id) AS dish_count
        FROM users
        ORDER BY created_at DESC
    ");
    send_json(['users' => $stmt->fetchAll()]);
}

function handle_approve_owner(): void {
    require_role('admin', 'sub_admin');
    $data = json_input();
    $userId   = (int)($data['user_id'] ?? 0);
    $approved = (int)(bool)($data['approved'] ?? 1);
    if (!$userId) fail('User id required');
    db()->prepare('UPDATE users SET approved = ? WHERE id = ?')->execute([$approved, $userId]);
    write_log($approved ? 'Approved owner' : 'Suspended owner', 'user', $userId);
    send_json(['message' => $approved ? 'Owner approved' : 'Owner suspended']);
}

function handle_set_role(): void {
    require_role('admin'); // super admin only
    $data = json_input();
    $userId = (int)($data['user_id'] ?? 0);
    $role   = $data['role'] ?? '';
    if (!$userId) fail('User id required');
    if (!in_array($role, ['admin', 'sub_admin', 'owner', 'customer'], true)) fail('Invalid role');
    // Promoting to admin or sub_admin auto-approves the account
    if (in_array($role, ['admin', 'sub_admin'], true)) {
        db()->prepare('UPDATE users SET role = ?, approved = 1 WHERE id = ?')->execute([$role, $userId]);
    } else {
        db()->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$role, $userId]);
    }
    write_log("Set role to {$role}", 'user', $userId);
    send_json(['message' => 'Role updated']);
}

function handle_delete_user(): void {
    $admin = require_role('admin'); // super admin only
    $data = json_input();
    $userId = (int)($data['user_id'] ?? 0);
    if (!$userId) fail('User id required');
    if ($userId === (int)$admin['id']) fail('You cannot delete yourself', 400);
    db()->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
    write_log('Deleted user', 'user', $userId);
    send_json(['message' => 'User deleted']);
}

function handle_stats(): void {
    require_role('admin', 'sub_admin');
    $stats = [
        'users'     => (int)db()->query('SELECT COUNT(*) FROM users')->fetchColumn(),
        'owners'    => (int)db()->query("SELECT COUNT(*) FROM users WHERE role = 'owner'")->fetchColumn(),
        'customers' => (int)db()->query("SELECT COUNT(*) FROM users WHERE role = 'customer'")->fetchColumn(),
        'dishes'    => (int)db()->query('SELECT COUNT(*) FROM dishes')->fetchColumn(),
        'reviews'   => (int)db()->query('SELECT COUNT(*) FROM reviews')->fetchColumn(),
        'pending_owners' => (int)db()->query("SELECT COUNT(*) FROM users WHERE role = 'owner' AND approved = 0")->fetchColumn(),
        'pending_subscriptions' => (int)db()->query("SELECT COUNT(*) FROM subscriptions WHERE status = 'pending'")->fetchColumn(),
    ];
    send_json(['stats' => $stats]);
}
