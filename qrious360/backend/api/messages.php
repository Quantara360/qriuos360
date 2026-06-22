<?php
require_once __DIR__ . '/../config/bootstrap.php';

db()->exec("
    CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        body TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
");

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'conversations': handle_conversations(); break;
    case 'thread':        handle_thread();        break;
    case 'send':          handle_send();          break;
    case 'unread_count':  handle_unread_count();  break;
    default:              fail('Unknown action', 404);
}

function handle_conversations(): void {
    $user = require_login();
    $uid  = $user['id'];

    if (in_array($user['role'], ['admin', 'sub_admin'], true)) {
        $stmt = db()->prepare("
            SELECT
                u.id, u.name, u.hotel_name, u.email, u.logo_path,
                (SELECT body FROM messages
                 WHERE (sender_id = u.id AND receiver_id = ?)
                    OR (sender_id = ? AND receiver_id = u.id)
                 ORDER BY created_at DESC LIMIT 1) AS last_message,
                (SELECT created_at FROM messages
                 WHERE (sender_id = u.id AND receiver_id = ?)
                    OR (sender_id = ? AND receiver_id = u.id)
                 ORDER BY created_at DESC LIMIT 1) AS last_at,
                (SELECT COUNT(*) FROM messages
                 WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) AS unread
            FROM users u
            WHERE u.role = 'owner'
            ORDER BY last_at DESC, u.name ASC
        ");
        $stmt->execute([$uid, $uid, $uid, $uid, $uid]);
    } else {
        $stmt = db()->prepare("
            SELECT
                u.id, u.name, NULL AS hotel_name, u.email, NULL AS logo_path,
                (SELECT body FROM messages
                 WHERE (sender_id = u.id AND receiver_id = ?)
                    OR (sender_id = ? AND receiver_id = u.id)
                 ORDER BY created_at DESC LIMIT 1) AS last_message,
                (SELECT created_at FROM messages
                 WHERE (sender_id = u.id AND receiver_id = ?)
                    OR (sender_id = ? AND receiver_id = u.id)
                 ORDER BY created_at DESC LIMIT 1) AS last_at,
                (SELECT COUNT(*) FROM messages
                 WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) AS unread
            FROM users u
            WHERE u.role IN ('admin', 'sub_admin')
            LIMIT 1
        ");
        $stmt->execute([$uid, $uid, $uid, $uid, $uid]);
    }

    send_json(['conversations' => $stmt->fetchAll()]);
}

function handle_thread(): void {
    $user   = require_login();
    $withId = (int)($_GET['with'] ?? 0);
    if (!$withId) fail('with required');

    $other = db()->prepare('SELECT id FROM users WHERE id = ?');
    $other->execute([$withId]);
    if (!$other->fetch()) fail('User not found', 404);

    $stmt = db()->prepare("
        SELECT m.*, s.name AS sender_name, s.role AS sender_role
        FROM messages m
        JOIN users s ON s.id = m.sender_id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
    ");
    $stmt->execute([$user['id'], $withId, $withId, $user['id']]);

    db()->prepare("UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?")
        ->execute([$withId, $user['id']]);

    send_json(['messages' => $stmt->fetchAll()]);
}

function handle_send(): void {
    $user = require_login();
    if (method() !== 'POST') fail('POST required', 405);

    $data       = json_input();
    $receiverId = (int)($data['receiver_id'] ?? 0);
    $body       = trim($data['body'] ?? '');

    if (!$receiverId) fail('receiver_id required');
    if (!$body)       fail('Message body required');

    $stmt = db()->prepare('SELECT id, role FROM users WHERE id = ?');
    $stmt->execute([$receiverId]);
    $receiver = $stmt->fetch();
    if (!$receiver) fail('Receiver not found', 404);

    if ($user['role'] === 'owner' && !in_array($receiver['role'], ['admin', 'sub_admin'], true)) {
        fail('Owners can only message admins', 403);
    }

    db()->prepare("INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)")
        ->execute([$user['id'], $receiverId, $body]);

    send_json(['message' => 'Sent'], 201);
}

function handle_unread_count(): void {
    $user = require_login();
    $stmt = db()->prepare('SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = 0');
    $stmt->execute([$user['id']]);
    send_json(['unread_count' => (int)$stmt->fetchColumn()]);
}
