<?php
require_once __DIR__ . '/../config/bootstrap.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':        handle_list();        break;
    case 'list_public': handle_list_public(); break;
    case 'create':      handle_create();      break;
    case 'delete':      handle_delete();      break;
    default:            fail('Unknown action', 404);
}

// Owner: list own categories
function handle_list(): void {
    $user = require_role('owner', 'admin');
    $owner_id = $user['role'] === 'admin' ? (int)($_GET['owner_id'] ?? 0) : $user['id'];
    if (!$owner_id) fail('owner_id required for admin');

    $stmt = db()->prepare('SELECT * FROM categories WHERE owner_id = ? ORDER BY sort_order, id');
    $stmt->execute([$owner_id]);
    send_json(['categories' => $stmt->fetchAll()]);
}

// Public: list categories for a hotel by QR token
function handle_list_public(): void {
    $token = trim($_GET['token'] ?? '');
    if (!$token) fail('Token required');

    $u = db()->prepare('SELECT id FROM users WHERE qr_token = ? AND role = "owner"');
    $u->execute([$token]);
    $owner = $u->fetch();
    if (!$owner) fail('Hotel not found', 404);

    $stmt = db()->prepare('SELECT * FROM categories WHERE owner_id = ? ORDER BY sort_order, id');
    $stmt->execute([$owner['id']]);
    send_json(['categories' => $stmt->fetchAll()]);
}

// Owner: create a category
function handle_create(): void {
    $user = require_role('owner', 'admin');
    if (method() !== 'POST') fail('Method not allowed', 405);
    $data = json_input();

    $name  = trim($data['name'] ?? '');
    $order = (int)($data['sort_order'] ?? 0);
    if (!$name) fail('Category name required');

    $stmt = db()->prepare('INSERT INTO categories (owner_id, name, sort_order) VALUES (?, ?, ?)');
    $stmt->execute([$user['id'], $name, $order]);
    $id = (int)db()->lastInsertId();

    send_json(['category' => ['id' => $id, 'owner_id' => $user['id'], 'name' => $name, 'sort_order' => $order]], 201);
}

// Owner: delete a category
function handle_delete(): void {
    $user = require_role('owner', 'admin');
    if (method() !== 'POST') fail('Method not allowed', 405);
    $data = json_input();
    $id   = (int)($data['id'] ?? 0);
    if (!$id) fail('Category id required');

    $stmt = db()->prepare('SELECT * FROM categories WHERE id = ?');
    $stmt->execute([$id]);
    $cat = $stmt->fetch();
    if (!$cat) fail('Category not found', 404);
    if ($user['role'] !== 'admin' && $cat['owner_id'] != $user['id']) fail('Forbidden', 403);

    // Unlink dishes from this category before deleting
    db()->prepare('UPDATE dishes SET category_id = NULL WHERE category_id = ?')->execute([$id]);
    db()->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);

    send_json(['message' => 'Category deleted']);
}
