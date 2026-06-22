<?php
require_once __DIR__ . '/../config/bootstrap.php';

db()->exec("CREATE TABLE IF NOT EXISTS pages (
    page_key   VARCHAR(50) PRIMARY KEY,
    content    TEXT        NOT NULL DEFAULT '{}',
    updated_at DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Image fields that are managed separately from text fields
const IMAGE_FIELDS = [
    'home'  => ['hero_image'],
    'about' => ['banner_image'],
];

$DEFAULTS = [
    'home' => [
        'eyebrow'     => 'Photogrammetric menu studio · est. MMXXVI',
        'heading'     => 'Every dish, sculpted',
        'heading_em'  => 'in three dimensions.',
        'lead'        => 'DishCraft turns flat food photographs into rotating volumetric models — luminance becomes elevation, and your menu becomes a study in form. Browse, favorite, review.',
        'step1_num'   => '01', 'step1_title' => 'Upload', 'step1_desc' => 'Hotel owners upload a single food photograph.',
        'step2_num'   => '02', 'step2_title' => 'Sculpt',  'step2_desc' => 'Pixel luminance becomes vertex displacement.',
        'step3_num'   => '03', 'step3_title' => 'Serve',   'step3_desc' => 'Customers explore each dish in three dimensions.',
        'hero_image'  => '',
    ],
    'about' => [
        'heading'        => 'About Dish',
        'heading_em'     => 'Craft.',
        'intro'          => 'We are building the future of restaurant menus — one dish at a time.',
        'mission'        => 'Our mission is to transform the way people discover and experience food, by bringing every dish to life in three dimensions.',
        'feature1_title' => '3D Visualization',
        'feature1_text'  => 'Every dish is rendered as a volumetric model using photogrammetric displacement techniques.',
        'feature2_title' => 'Hotel Owners',
        'feature2_text'  => 'Empower restaurants to showcase their entire menu in an entirely new dimension.',
        'feature3_title' => 'For Customers',
        'feature3_text'  => 'Browse, favorite, and review dishes with an immersive three-dimensional experience.',
        'banner_image'   => '',
    ],
    'banners' => [
        'slides' => [],
    ],
];

$action = $_GET['action'] ?? '';
switch ($action) {
    case 'get':          handle_get($DEFAULTS);          break;
    case 'update':       handle_update($DEFAULTS);       break;
    case 'upload_image': handle_upload_image($DEFAULTS); break;
    default:             fail('Unknown action', 404);
}

function handle_get(array $defaults): void {
    $key = $_GET['key'] ?? '';
    if (!array_key_exists($key, $defaults)) fail('Unknown page key', 404);

    $stmt = db()->prepare('SELECT content FROM pages WHERE page_key = ?');
    $stmt->execute([$key]);
    $row   = $stmt->fetch();
    $saved = $row ? (json_decode($row['content'], true) ?? []) : [];

    send_json(['key' => $key, 'content' => array_merge($defaults[$key], $saved)]);
}

function handle_update(array $defaults): void {
    require_role('admin', 'sub_admin');
    if (method() !== 'POST') fail('POST required', 405);

    $data = json_input();
    $key  = $data['key'] ?? '';
    if (!array_key_exists($key, $defaults)) fail('Unknown page key', 404);

    // Load current saved content so we don't wipe image fields
    $stmt = db()->prepare('SELECT content FROM pages WHERE page_key = ?');
    $stmt->execute([$key]);
    $row     = $stmt->fetch();
    $current = $row ? (json_decode($row['content'], true) ?? []) : [];

    // Overwrite only text fields; preserve image fields from current saved content
    $imageFields = IMAGE_FIELDS[$key] ?? [];
    foreach (array_keys($defaults[$key]) as $field) {
        if (in_array($field, $imageFields, true)) continue; // don't overwrite images
        if (isset($data[$field])) {
            $val = $data[$field];
            $current[$field] = is_string($val) ? trim($val) : $val;
        }
    }

    db()->prepare("
        INSERT INTO pages (page_key, content) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = NOW()
    ")->execute([$key, json_encode($current, JSON_UNESCAPED_UNICODE)]);

    write_log("Updated page: {$key}", 'page', 0, "Key: {$key}");
    send_json(['message' => 'Page saved successfully.']);
}

function handle_upload_image(array $defaults): void {
    require_role('admin', 'sub_admin');

    $key   = $_GET['key']   ?? '';
    $field = $_GET['field'] ?? '';

    if (!array_key_exists($key, $defaults)) fail('Unknown page key', 404);
    $allowed_fields = IMAGE_FIELDS[$key] ?? [];
    if (!in_array($field, $allowed_fields, true)) fail('Unknown image field', 400);

    if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        fail('No image uploaded', 400);
    }

    // Page hero/banner images: 1400 px wide maximum, converted to WebP.
    $name = save_image_as_webp($_FILES['image'], 'page_', 1400, 900, 82, 8 * 1024 * 1024);

    // Load current content and update the image field
    $stmt = db()->prepare('SELECT content FROM pages WHERE page_key = ?');
    $stmt->execute([$key]);
    $row     = $stmt->fetch();
    $content = $row ? (json_decode($row['content'], true) ?? []) : [];

    // Delete old image file if it exists
    if (!empty($content[$field])) {
        @unlink(__DIR__ . '/../uploads/' . basename($content[$field]));
    }

    $content[$field] = $name;

    db()->prepare("
        INSERT INTO pages (page_key, content) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = NOW()
    ")->execute([$key, json_encode($content, JSON_UNESCAPED_UNICODE)]);

    send_json(['message' => 'Image uploaded successfully.', 'path' => $name]);
}
