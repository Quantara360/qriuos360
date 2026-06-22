<?php
require_once __DIR__ . '/../config/bootstrap.php';

$action = $_GET['action'] ?? '';
switch ($action) {
    case 'track':       handle_track();       break;
    case 'hotel_stats': handle_hotel_stats(); break;
    default:            fail('Unknown action', 404);
}

// Public: record one hotel page view
function handle_track(): void {
    if (method() !== 'POST') fail('POST required', 405);
    $data    = json_input();
    $ownerId = (int)($data['owner_id'] ?? 0);
    if (!$ownerId) fail('owner_id required');

    $s = db()->prepare("SELECT id FROM users WHERE id = ? AND role = 'owner'");
    $s->execute([$ownerId]);
    if (!$s->fetch()) fail('Owner not found', 404);

    db()->prepare('INSERT INTO hotel_views (owner_id) VALUES (?)')->execute([$ownerId]);
    send_json(['tracked' => true]);
}

// Admin: top hotels by views + daily trend for the last 30 days
function handle_hotel_stats(): void {
    require_role('admin', 'sub_admin');

    $hotels = db()->query("
        SELECT u.id AS owner_id, u.hotel_name, u.name AS owner_name,
               COUNT(hv.id) AS view_count,
               MAX(hv.viewed_at) AS last_viewed
        FROM users u
        LEFT JOIN hotel_views hv ON hv.owner_id = u.id
        WHERE u.role = 'owner'
        GROUP BY u.id
        ORDER BY view_count DESC
        LIMIT 15
    ")->fetchAll();

    // Last 30 days daily totals (all hotels combined)
    $daily = db()->query("
        SELECT DATE(viewed_at) AS day, COUNT(*) AS total
        FROM hotel_views
        WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(viewed_at)
        ORDER BY day ASC
    ")->fetchAll();

    send_json(['hotels' => $hotels, 'daily' => $daily]);
}
