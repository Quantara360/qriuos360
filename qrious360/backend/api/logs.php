<?php
require_once __DIR__ . '/../config/bootstrap.php';

$action = $_GET['action'] ?? '';
switch ($action) {
    case 'list':  handle_list();  break;
    case 'clear': handle_clear(); break;
    default:      fail('Unknown action', 404);
}

function handle_list(): void {
    require_role('admin', 'sub_admin');
    $limit  = min(200, (int)($_GET['limit']  ?? 100));
    $offset = (int)($_GET['offset'] ?? 0);

    $stmt = db()->prepare("
        SELECT * FROM activity_logs
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$limit, $offset]);
    $total = (int)db()->query('SELECT COUNT(*) FROM activity_logs')->fetchColumn();
    send_json(['logs' => $stmt->fetchAll(), 'total' => $total]);
}

function handle_clear(): void {
    require_role('admin');
    if (method() !== 'POST') fail('POST required', 405);
    db()->exec('DELETE FROM activity_logs');
    send_json(['message' => 'Logs cleared.']);
}
