<?php
require_once __DIR__ . '/../config/bootstrap.php';

try { db()->exec("ALTER TABLE dishes ADD COLUMN video_path VARCHAR(255) DEFAULT NULL"); } catch (\Exception $e) {}

$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':            handle_list();            break;
    case 'get':             handle_get();             break;
    case 'create':          handle_create();          break;
    case 'update':          handle_update();          break;
    case 'delete':          handle_delete();          break;
    case 'mine':            handle_mine();            break;
    case 'top_dishes':      handle_top_dishes();      break;
    case 'toggle_available': handle_toggle_available(); break;
    default:                fail('Unknown action', 404);
}

// ----------------------------------------------------------
// Public: list available dishes
// ?token=XXX filters to one hotel's menu (for QR scan)
// ----------------------------------------------------------
function handle_list(): void {
    $token = trim($_GET['token'] ?? '');

    if ($token) {
        // Resolve owner from QR token
        $u = db()->prepare('SELECT id FROM users WHERE qr_token = ? AND role = "owner"');
        $u->execute([$token]);
        $owner = $u->fetch();
        if (!$owner) fail('Hotel not found', 404);

        $sql = "
            SELECT d.*, u.hotel_name, u.logo_path AS owner_logo, u.name AS owner_name,
                   c.name AS category_name,
                   (SELECT AVG(rating) FROM reviews WHERE dish_id = d.id) AS avg_rating,
                   (SELECT COUNT(*)    FROM reviews WHERE dish_id = d.id) AS review_count
            FROM dishes d
            JOIN users u ON u.id = d.owner_id
            LEFT JOIN categories c ON c.id = d.category_id
            WHERE d.available = 1 AND d.owner_id = ?
            ORDER BY c.sort_order, c.id, d.created_at DESC
        ";
        $stmt = db()->prepare($sql);
        $stmt->execute([$owner['id']]);
    } else {
        $sql = "
            SELECT d.*, u.hotel_name, u.logo_path AS owner_logo, u.name AS owner_name,
                   c.name AS category_name,
                   (SELECT AVG(rating) FROM reviews WHERE dish_id = d.id) AS avg_rating,
                   (SELECT COUNT(*)    FROM reviews WHERE dish_id = d.id) AS review_count
            FROM dishes d
            JOIN users u ON u.id = d.owner_id
            LEFT JOIN categories c ON c.id = d.category_id
            WHERE d.available = 1
            ORDER BY d.created_at DESC
        ";
        $stmt = db()->query($sql);
    }

    $dishes = $stmt->fetchAll();
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
        SELECT d.*, u.hotel_name, u.logo_path AS owner_logo, u.name AS owner_name,
               c.name AS category_name
        FROM dishes d
        JOIN users u ON u.id = d.owner_id
        LEFT JOIN categories c ON c.id = d.category_id
        WHERE d.id = ?
    ");
    $stmt->execute([$id]);
    $dish = $stmt->fetch();
    if (!$dish) fail('Dish not found', 404);

    $dish['ingredients'] = fetch_ingredients($id);
    $dish['images']      = decode_images($dish);

    $rs = db()->prepare("
        SELECT r.id, r.user_id, r.rating, r.comment, r.created_at,
               r.owner_reply, r.replied_at,
               u.name AS user_name
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
            SELECT d.*, u.hotel_name, u.name AS owner_name, c.name AS category_name
            FROM dishes d
            JOIN users u ON u.id = d.owner_id
            LEFT JOIN categories c ON c.id = d.category_id
            ORDER BY d.created_at DESC
        ");
        $dishes = $stmt->fetchAll();
    } else {
        $stmt = db()->prepare("
            SELECT d.*, c.name AS category_name
            FROM dishes d
            LEFT JOIN categories c ON c.id = d.category_id
            WHERE d.owner_id = ?
            ORDER BY d.created_at DESC
        ");
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

    // Quota check — admins are exempt
    if ($user['role'] === 'owner') {
        $qs = db()->prepare('SELECT dish_quota FROM users WHERE id = ?');
        $qs->execute([$user['id']]);
        $quota = (int)$qs->fetchColumn();

        $cs = db()->prepare('SELECT COUNT(*) FROM dishes WHERE owner_id = ?');
        $cs->execute([$user['id']]);
        $used = (int)$cs->fetchColumn();

        if ($used >= $quota) {
            fail('Dish quota reached (' . $used . '/' . $quota . '). Purchase more quota from your dashboard.', 403);
        }
    }

    $name        = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $portion     = trim($_POST['portion_size'] ?? '');
    $price       = (float)($_POST['price'] ?? 0);
    $ingredients = json_decode($_POST['ingredients'] ?? '[]', true) ?: [];
    $depth       = (float)($_POST['relief_depth'] ?? 0.8);
    $detail      = (int)($_POST['relief_detail'] ?? 200);
    $smoothing   = (int)($_POST['relief_smoothing'] ?? 1);
    $categoryId  = $_POST['category_id'] ? (int)$_POST['category_id'] : null;

    if (!$name) fail('Dish name required');

    // Validate category belongs to this owner
    if ($categoryId) {
        $cs = db()->prepare('SELECT id FROM categories WHERE id = ? AND owner_id = ?');
        $cs->execute([$categoryId, $user['id']]);
        if (!$cs->fetch()) $categoryId = null;
    }

    $uploaded = [];
    $paths    = [null, null, null, null];

    for ($i = 0; $i < 4; $i++) {
        $key = "image_$i";
        if (!empty($_FILES[$key]) && $_FILES[$key]['error'] === UPLOAD_ERR_OK) {
            $paths[$i] = save_upload($_FILES[$key]);
            $uploaded[] = $paths[$i];
        }
    }
    // Legacy plain 'image' key → slot 0
    if (!$paths[0] && !empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $paths[0] = save_upload($_FILES['image']);
        $uploaded[] = $paths[0];
    }

    // Video upload (replaces image as the primary media)
    $videoPath = null;
    if (!empty($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
        $videoPath = save_video($_FILES['video']);
        $uploaded[] = $videoPath;
    }

    if (!$paths[0] && !$videoPath) fail('A dish photo or video is required');

    $imagePath  = $paths[0];
    $imagesJson = json_encode($paths);

    $dishId = 0;
    db()->beginTransaction();
    try {
        $stmt = db()->prepare("
            INSERT INTO dishes
              (owner_id, category_id, name, description, portion_size, price, image_path, images_json,
               relief_depth, relief_detail, relief_smoothing, video_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['id'], $categoryId, $name, $description, $portion, $price,
            $imagePath, $imagesJson,
            $depth, $detail, $smoothing, $videoPath
        ]);
        $dishId = (int)db()->lastInsertId();
        save_ingredients($dishId, $ingredients);
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        foreach ($uploaded as $p) @unlink(__DIR__ . '/../uploads/' . basename($p));
        fail('Failed to create dish: ' . $e->getMessage(), 500);
    }

    write_log("Created dish: {$name}", 'dish', $dishId);
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
    $depth       = isset($_POST['relief_depth'])     ? (float)$_POST['relief_depth']   : (float)$dish['relief_depth'];
    $detail      = isset($_POST['relief_detail'])    ? (int)$_POST['relief_detail']    : (int)$dish['relief_detail'];
    $smoothing   = isset($_POST['relief_smoothing']) ? (int)$_POST['relief_smoothing'] : (int)$dish['relief_smoothing'];

    // Handle category update (empty string = unset)
    if (array_key_exists('category_id', $_POST)) {
        $categoryId = $_POST['category_id'] !== '' ? (int)$_POST['category_id'] : null;
        if ($categoryId) {
            $cs = db()->prepare('SELECT id FROM categories WHERE id = ? AND owner_id = ?');
            $cs->execute([$categoryId, $dish['owner_id']]);
            if (!$cs->fetch()) $categoryId = null;
        }
    } else {
        $categoryId = $dish['category_id'];
    }

    // Load existing image slots
    $paths = json_decode($dish['images_json'] ?? 'null', true);
    if (!is_array($paths) || count($paths) < 4) {
        $paths = [$dish['image_path'], null, null, null];
    }

    $uploaded = [];
    for ($i = 0; $i < 4; $i++) {
        $key       = "image_$i";
        $removeKey = "remove_image_$i";
        if (!empty($_FILES[$key]) && $_FILES[$key]['error'] === UPLOAD_ERR_OK) {
            if ($paths[$i]) @unlink(__DIR__ . '/../uploads/' . basename($paths[$i]));
            $paths[$i] = save_upload($_FILES[$key]);
            $uploaded[] = $paths[$i];
        } elseif (!empty($_POST[$removeKey])) {
            if ($paths[$i]) @unlink(__DIR__ . '/../uploads/' . basename($paths[$i]));
            $paths[$i] = null;
        }
    }
    // Legacy plain 'image' key → slot 0
    if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        if ($paths[0]) @unlink(__DIR__ . '/../uploads/' . basename($paths[0]));
        $paths[0] = save_upload($_FILES['image']);
        $uploaded[] = $paths[0];
    }

    $imagePath  = $paths[0] ?? $dish['image_path'];
    $imagesJson = json_encode($paths);

    // Video upload
    $videoPath = $dish['video_path'] ?? null;
    if (!empty($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
        if ($videoPath) @unlink(__DIR__ . '/../uploads/' . basename($videoPath));
        $videoPath = save_video($_FILES['video']);
    } elseif (!empty($_POST['remove_video'])) {
        if ($videoPath) @unlink(__DIR__ . '/../uploads/' . basename($videoPath));
        $videoPath = null;
    }

    db()->beginTransaction();
    try {
        $stmt = db()->prepare("
            UPDATE dishes SET
              category_id = ?, name = ?, description = ?, portion_size = ?, price = ?,
              image_path = ?, images_json = ?, available = ?,
              relief_depth = ?, relief_detail = ?, relief_smoothing = ?,
              video_path = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $categoryId, $name, $description, $portion, $price,
            $imagePath, $imagesJson, $available,
            $depth, $detail, $smoothing,
            $videoPath, $id
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
    $id   = (int)($data['id'] ?? $_GET['id'] ?? 0);
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
    if ($dish['video_path']) @unlink(__DIR__ . '/../uploads/' . basename($dish['video_path']));
    write_log("Deleted dish: {$dish['name']}", 'dish', $id);
    send_json(['message' => 'Dish deleted']);
}

// ----------------------------------------------------------
// Owner: top 10 loved + top 10 hated dishes by avg rating
// ----------------------------------------------------------
function handle_top_dishes(): void {
    $user = require_role('owner', 'admin');
    $ownerId = $user['id'];

    $best = db()->prepare("
        SELECT d.id, d.name, d.image_path, d.price, d.available,
               ROUND(AVG(r.rating), 1) AS avg_rating,
               COUNT(r.id) AS review_count
        FROM dishes d
        JOIN reviews r ON r.dish_id = d.id
        WHERE d.owner_id = ?
        GROUP BY d.id
        ORDER BY avg_rating DESC, review_count DESC
        LIMIT 10
    ");
    $best->execute([$ownerId]);

    $worst = db()->prepare("
        SELECT d.id, d.name, d.image_path, d.price, d.available,
               ROUND(AVG(r.rating), 1) AS avg_rating,
               COUNT(r.id) AS review_count
        FROM dishes d
        JOIN reviews r ON r.dish_id = d.id
        WHERE d.owner_id = ?
        GROUP BY d.id
        ORDER BY avg_rating ASC, review_count DESC
        LIMIT 10
    ");
    $worst->execute([$ownerId]);

    send_json(['best' => $best->fetchAll(), 'worst' => $worst->fetchAll()]);
}

// ----------------------------------------------------------
// Owner / Admin: toggle dish availability (suspend / resume)
// ----------------------------------------------------------
function handle_toggle_available(): void {
    $user = require_role('owner', 'admin');
    if (method() !== 'POST') fail('Method not allowed', 405);

    $data = json_input();
    $id   = (int)($data['id'] ?? 0);
    if (!$id) fail('Dish id required');

    $stmt = db()->prepare('SELECT owner_id, available FROM dishes WHERE id = ?');
    $stmt->execute([$id]);
    $dish = $stmt->fetch();
    if (!$dish) fail('Dish not found', 404);
    if ($user['role'] !== 'admin' && $dish['owner_id'] != $user['id']) fail('Forbidden', 403);

    $newAvail = $dish['available'] ? 0 : 1;
    db()->prepare('UPDATE dishes SET available = ? WHERE id = ?')->execute([$newAvail, $id]);
    send_json(['available' => $newAvail]);
}

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------
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
    // Converts to WebP and caps at 900 px — dish cards never display wider than that.
    return save_image_as_webp($file, '', 900, 900, 82, 8 * 1024 * 1024);
}

function save_video(array $file): string {
    $allowed = ['video/mp4' => 'mp4', 'video/webm' => 'webm', 'video/quicktime' => 'mov'];
    $mime    = mime_content_type($file['tmp_name']);
    if (!isset($allowed[$mime])) fail('Only MP4, WebM and MOV videos are allowed', 415);
    if ($file['size'] > 200 * 1024 * 1024) fail('Video must be smaller than 200 MB', 413);

    $ext  = $allowed[$mime];
    $name = 'video_' . bin2hex(random_bytes(8)) . '.' . $ext;
    $dest = __DIR__ . '/../uploads/' . $name;
    if (!move_uploaded_file($file['tmp_name'], $dest)) fail('Failed to save video', 500);
    return $name;
}
