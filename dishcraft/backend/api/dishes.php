<?php
require_once __DIR__ . '/../config/bootstrap.php';

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':   handle_list();   break;
    case 'get':    handle_get();    break;
    case 'create': handle_create(); break;
    case 'update': handle_update(); break;
    case 'delete': handle_delete(); break;
    case 'mine':   handle_mine();   break;
    default:       fail('Unknown action', 404);
}

// ----------------------------------------------------------
// Public: list all available dishes (for customers & home page)
// ----------------------------------------------------------
function handle_list(): void {
    $sql = "
        SELECT d.*, u.hotel_name, u.name AS owner_name,
            (SELECT AVG(rating) FROM reviews WHERE dish_id = d.id) AS avg_rating,
            (SELECT COUNT(*)    FROM reviews WHERE dish_id = d.id) AS review_count
        FROM dishes d
        JOIN users u ON u.id = d.owner_id
        WHERE d.available = 1
        ORDER BY d.created_at DESC
    ";
    $dishes = db()->query($sql)->fetchAll();
    foreach ($dishes as &$d) {
        $d['ingredients'] = fetch_ingredients((int)$d['id']);
        $d['images']      = decode_images($d);
        $d['avg_rating']  = $d['avg_rating'] !== null ? round((float)$d['avg_rating'], 1) : null;
    }
    send_json(['dishes' => $dishes]);
}

// ----------------------------------------------------------
// Public: get one dish with reviews
// ----------------------------------------------------------
function handle_get(): void {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) fail('Dish id required');

    $stmt = db()->prepare("
        SELECT d.*, u.hotel_name, u.name AS owner_name
        FROM dishes d JOIN users u ON u.id = d.owner_id
        WHERE d.id = ?
    ");
    $stmt->execute([$id]);
    $dish = $stmt->fetch();
    if (!$dish) fail('Dish not found', 404);

    $dish['ingredients'] = fetch_ingredients($id);
    $dish['images']      = decode_images($dish);

    $rs = db()->prepare("
        SELECT r.*, u.name AS user_name
        FROM reviews r JOIN users u ON u.id = r.user_id
        WHERE r.dish_id = ?
        ORDER BY r.created_at DESC
    ");
    $rs->execute([$id]);
    $dish['reviews'] = $rs->fetchAll();

    $avg = db()->prepare('SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE dish_id = ?');
    $avg->execute([$id]);
    $stats = $avg->fetch();
    $dish['avg_rating']   = $stats['avg'] !== null ? round((float)$stats['avg'], 1) : null;
    $dish['review_count'] = (int)$stats['cnt'];

    send_json(['dish' => $dish]);
}

// ----------------------------------------------------------
// Owner / Admin: list dishes that belong to me
// ----------------------------------------------------------
function handle_mine(): void {
    $user = require_role('owner', 'admin');
    if ($user['role'] === 'admin') {
        $stmt = db()->query("
            SELECT d.*, u.hotel_name, u.name AS owner_name
            FROM dishes d JOIN users u ON u.id = d.owner_id
            ORDER BY d.created_at DESC
        ");
        $dishes = $stmt->fetchAll();
    } else {
        $stmt = db()->prepare('SELECT * FROM dishes WHERE owner_id = ? ORDER BY created_at DESC');
        $stmt->execute([$user['id']]);
        $dishes = $stmt->fetchAll();
    }
    foreach ($dishes as &$d) {
        $d['ingredients'] = fetch_ingredients((int)$d['id']);
        $d['images']      = decode_images($d);
    }
    send_json(['dishes' => $dishes]);
}

// ----------------------------------------------------------
// Owner / Admin: create a dish (multipart upload)
// ----------------------------------------------------------
function handle_create(): void {
    $user = require_role('owner', 'admin');
    if (method() !== 'POST') fail('Method not allowed', 405);

    $name        = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $portion     = trim($_POST['portion_size'] ?? '');
    $price       = (float)($_POST['price'] ?? 0);
    $ingredients = json_decode($_POST['ingredients'] ?? '[]', true) ?: [];
    $depth       = (float)($_POST['relief_depth'] ?? 0.8);
    $detail      = (int)($_POST['relief_detail'] ?? 200);
    $smoothing   = (int)($_POST['relief_smoothing'] ?? 1);

    if (!$name) fail('Dish name required');

    // Accept 'image' (primary) or 'image_0' (legacy multi-slot)
    $uploaded = [];
    $imgFile  = null;
    foreach (['image', 'image_0'] as $key) {
        if (!empty($_FILES[$key]) && $_FILES[$key]['error'] === UPLOAD_ERR_OK) {
            $imgFile = save_upload($_FILES[$key]);
            $uploaded[] = $imgFile;
            break;
        }
    }

    if (!$imgFile) {
        fail('A dish photo is required');
    }

    $paths = [$imgFile, null, null, null];

    $imagePath  = $paths[0];
    $imagesJson = json_encode($paths);   // keeps null slots so positions are preserved

    $dishId = 0;
    db()->beginTransaction();
    try {
        $stmt = db()->prepare("
            INSERT INTO dishes
              (owner_id, name, description, portion_size, price, image_path, images_json,
               relief_depth, relief_detail, relief_smoothing)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['id'], $name, $description, $portion, $price,
            $imagePath, $imagesJson,
            $depth, $detail, $smoothing
        ]);
        $dishId = (int)db()->lastInsertId();
        save_ingredients($dishId, $ingredients);
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        foreach ($uploaded as $p) @unlink(__DIR__ . '/../uploads/' . basename($p));
        fail('Failed to create dish: ' . $e->getMessage(), 500);
    }

    send_json(['message' => 'Dish created', 'dish_id' => $dishId], 201);
}

// ----------------------------------------------------------
// Owner / Admin: update a dish (multipart, image optional)
// ----------------------------------------------------------
function handle_update(): void {
    $user = require_role('owner', 'admin');
    if (method() !== 'POST') fail('Method not allowed', 405);

    $id = (int)($_POST['id'] ?? 0);
    if (!$id) fail('Dish id required');

    $stmt = db()->prepare('SELECT * FROM dishes WHERE id = ?');
    $stmt->execute([$id]);
    $dish = $stmt->fetch();
    if (!$dish) fail('Dish not found', 404);
    if ($user['role'] !== 'admin' && $dish['owner_id'] != $user['id']) {
        fail('You cannot edit this dish', 403);
    }

    $name        = trim($_POST['name'] ?? $dish['name']);
    $description = trim($_POST['description'] ?? $dish['description']);
    $portion     = trim($_POST['portion_size'] ?? $dish['portion_size']);
    $price       = isset($_POST['price']) ? (float)$_POST['price'] : (float)$dish['price'];
    $available   = isset($_POST['available']) ? (int)(bool)$_POST['available'] : (int)$dish['available'];
    $depth       = isset($_POST['relief_depth'])     ? (float)$_POST['relief_depth']     : (float)$dish['relief_depth'];
    $detail      = isset($_POST['relief_detail'])    ? (int)$_POST['relief_detail']      : (int)$dish['relief_detail'];
    $smoothing   = isset($_POST['relief_smoothing']) ? (int)$_POST['relief_smoothing']   : (int)$dish['relief_smoothing'];

    // Replace photo if a new one was uploaded ('image' primary, 'image_0' legacy)
    $imagePath = $dish['image_path'];
    foreach (['image', 'image_0'] as $key) {
        if (!empty($_FILES[$key]) && $_FILES[$key]['error'] === UPLOAD_ERR_OK) {
            if ($imagePath) @unlink(__DIR__ . '/../uploads/' . basename($imagePath));
            $imagePath = save_upload($_FILES[$key]);
            break;
        }
    }
    $imagesJson = json_encode([$imagePath, null, null, null]);

    db()->beginTransaction();
    try {
        $stmt = db()->prepare("
            UPDATE dishes SET
              name = ?, description = ?, portion_size = ?, price = ?,
              image_path = ?, images_json = ?, available = ?,
              relief_depth = ?, relief_detail = ?, relief_smoothing = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $name, $description, $portion, $price,
            $imagePath, $imagesJson, $available,
            $depth, $detail, $smoothing, $id
        ]);

        if (isset($_POST['ingredients'])) {
            $ingredients = json_decode($_POST['ingredients'], true) ?: [];
            db()->prepare('DELETE FROM dish_ingredients WHERE dish_id = ?')->execute([$id]);
            save_ingredients($id, $ingredients);
        }
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        fail('Update failed: ' . $e->getMessage(), 500);
    }

    send_json(['message' => 'Dish updated']);
}

// ----------------------------------------------------------
// Owner / Admin: delete a dish
// ----------------------------------------------------------
function handle_delete(): void {
    $user = require_role('owner', 'admin');
    $data = json_input();
    $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
    if (!$id) fail('Dish id required');

    $stmt = db()->prepare('SELECT * FROM dishes WHERE id = ?');
    $stmt->execute([$id]);
    $dish = $stmt->fetch();
    if (!$dish) fail('Dish not found', 404);
    if ($user['role'] !== 'admin' && $dish['owner_id'] != $user['id']) {
        fail('You cannot delete this dish', 403);
    }

    db()->prepare('DELETE FROM dishes WHERE id = ?')->execute([$id]);
    if ($dish['image_path']) @unlink(__DIR__ . '/../uploads/' . basename($dish['image_path']));

    send_json(['message' => 'Dish deleted']);
}

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------
// Decode images_json into a clean array of non-null paths.
// Falls back to [image_path] for dishes that pre-date the multi-image feature.
function decode_images(array $dish): array {
    if (!empty($dish['images_json'])) {
        $decoded = json_decode($dish['images_json'], true);
        if (is_array($decoded)) {
            return array_values(array_filter($decoded, fn($p) => $p !== null));
        }
    }
    return $dish['image_path'] ? [$dish['image_path']] : [];
}

function fetch_ingredients(int $dishId): array {
    $s = db()->prepare('SELECT ingredient FROM dish_ingredients WHERE dish_id = ? ORDER BY id');
    $s->execute([$dishId]);
    return array_column($s->fetchAll(), 'ingredient');
}

function save_ingredients(int $dishId, array $ingredients): void {
    $stmt = db()->prepare('INSERT INTO dish_ingredients (dish_id, ingredient) VALUES (?, ?)');
    foreach ($ingredients as $ing) {
        $ing = trim((string)$ing);
        if ($ing !== '') $stmt->execute([$dishId, $ing]);
    }
}

function save_upload(array $file): string {
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $mime = mime_content_type($file['tmp_name']);
    if (!isset($allowed[$mime])) fail('Only JPG, PNG and WebP images are allowed', 415);
    if ($file['size'] > 8 * 1024 * 1024) fail('Image must be smaller than 8 MB', 413);

    $ext  = $allowed[$mime];
    $name = bin2hex(random_bytes(8)) . '.' . $ext;
    $dest = __DIR__ . '/../uploads/' . $name;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        fail('Failed to save uploaded image', 500);
    }
    // path stored relative — served via /api-uploads/<name>
    return $name;
}
