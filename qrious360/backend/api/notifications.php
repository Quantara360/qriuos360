<?php
require_once __DIR__ . '/../config/bootstrap.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':          handle_list();         break;
    case 'mark_read':     handle_mark_read();    break;
    case 'mark_all_read': handle_mark_all();     break;
    case 'unread_count':  handle_unread_count(); break;
    default:              fail('Unknown action', 404);
}

function handle_list(): void {
    $user = require_role('owner');
    $stmt = db()->prepare("
        SELECT n.*,
               CASE WHEN r.owner_reply IS NOT NULL THEN 1 ELSE 0 END AS owner_replied
        FROM notifications n
        LEFT JOIN reviews r ON r.id = n.review_id
        WHERE n.owner_id = ?
        ORDER BY n.is_read ASC, n.created_at DESC
        LIMIT 50
    ");
    $stmt->execute([$user['id']]);

    $uc = db()->prepare('SELECT COUNT(*) FROM notifications WHERE owner_id = ? AND is_read = 0');
    $uc->execute([$user['id']]);

    send_json([
        'notifications' => $stmt->fetchAll(),
        'unread_count'  => (int)$uc->fetchColumn(),
    ]);
}

function handle_unread_count(): void {
    $user = require_role('owner');
    $stmt = db()->prepare('SELECT COUNT(*) FROM notifications WHERE owner_id = ? AND is_read = 0');
    $stmt->execute([$user['id']]);
    send_json(['unread_count' => (int)$stmt->fetchColumn()]);
}

function handle_mark_read(): void {
    $user = require_role('owner');
    $data = json_input();
    $id   = (int)($data['id'] ?? 0);
    if (!$id) fail('id required');
    db()->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND owner_id = ?')
        ->execute([$id, $user['id']]);
    send_json(['message' => 'Marked read']);
}

function handle_mark_all(): void {
    $user = require_role('owner');
    db()->prepare('UPDATE notifications SET is_read = 1 WHERE owner_id = ?')
        ->execute([$user['id']]);
    send_json(['message' => 'All marked read']);
}
