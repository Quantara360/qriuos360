<?php
require_once __DIR__ . '/../config/bootstrap.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':         handle_list_favorites();   break;
    case 'toggle':       handle_toggle_favorite();  break;
    case 'review_add':   handle_add_review();       break;
    case 'review_del':   handle_delete_review();    break;
    default:             fail('Unknown action', 404);
}

// ----------------------------------------------------------
// GET — list dishes the current customer has favorited
// ----------------------------------------------------------
function handle_list_favorites(): void {
    $user = require_role('customer');
    $stmt = db()->prepare("
        SELECT d.*, u.hotel_name, u.name AS owner_name,
            (SELECT AVG(rating) FROM reviews WHERE dish_id = d.id) AS avg_rating
        FROM favorites f
        JOIN dishes d ON d.id = f.dish_id
        JOIN users u  ON u.id = d.owner_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
    ");
    $stmt->execute([$user['id']]);
    $dishes = $stmt->fetchAll();
    foreach ($dishes as &$d) {
        $d['avg_rating'] = $d['avg_rating'] !== null ? round((float)$d['avg_rating'], 1) : null;
    }
    send_json(['favorites' => $dishes]);
}

// ----------------------------------------------------------
// POST — toggle favorite (add or remove)
// ----------------------------------------------------------
function handle_toggle_favorite(): void {
    $user = require_role('customer');
    $data = json_input();
    $dishId = (int)($data['dish_id'] ?? 0);
    if (!$dishId) fail('Dish id required');

    $stmt = db()->prepare('SELECT id FROM favorites WHERE user_id = ? AND dish_id = ?');
    $stmt->execute([$user['id'], $dishId]);
    $existing = $stmt->fetch();

    if ($existing) {
        db()->prepare('DELETE FROM favorites WHERE id = ?')->execute([$existing['id']]);
        send_json(['favorited' => false]);
    } else {
        db()->prepare('INSERT INTO favorites (user_id, dish_id) VALUES (?, ?)')
            ->execute([$user['id'], $dishId]);
        send_json(['favorited' => true]);
    }
}

// ----------------------------------------------------------
// POST — add or update a review
// ----------------------------------------------------------
function handle_add_review(): void {
    $user = require_role('customer');
    $data = json_input();
    $dishId  = (int)($data['dish_id'] ?? 0);
    $rating  = (int)($data['rating'] ?? 0);
    $comment = trim($data['comment'] ?? '');

    if (!$dishId) fail('Dish id required');
    if ($rating < 1 || $rating > 5) fail('Rating must be 1–5');

    // upsert
    $stmt = db()->prepare('SELECT id FROM reviews WHERE user_id = ? AND dish_id = ?');
    $stmt->execute([$user['id'], $dishId]);
    if ($stmt->fetch()) {
        db()->prepare('UPDATE reviews SET rating = ?, comment = ? WHERE user_id = ? AND dish_id = ?')
            ->execute([$rating, $comment, $user['id'], $dishId]);
    } else {
        db()->prepare('INSERT INTO reviews (user_id, dish_id, rating, comment) VALUES (?, ?, ?, ?)')
            ->execute([$user['id'], $dishId, $rating, $comment]);
    }

    send_json(['message' => 'Review saved']);
}

// ----------------------------------------------------------
// POST — delete own review (or admin can delete any)
// ----------------------------------------------------------
function handle_delete_review(): void {
    $user = require_login();
    $data = json_input();
    $reviewId = (int)($data['review_id'] ?? 0);
    if (!$reviewId) fail('Review id required');

    $stmt = db()->prepare('SELECT * FROM reviews WHERE id = ?');
    $stmt->execute([$reviewId]);
    $review = $stmt->fetch();
    if (!$review) fail('Review not found', 404);

    if ($user['role'] !== 'admin' && $review['user_id'] != $user['id']) {
        fail('You cannot delete this review', 403);
    }
    db()->prepare('DELETE FROM reviews WHERE id = ?')->execute([$reviewId]);
    send_json(['message' => 'Review deleted']);
}
