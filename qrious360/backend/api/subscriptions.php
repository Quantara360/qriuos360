<?php
require_once __DIR__ . '/../config/bootstrap.php';

// Ensure payment_method column exists
try { db()->exec("ALTER TABLE subscriptions ADD COLUMN payment_method VARCHAR(20) DEFAULT 'manual'"); } catch (\Exception $e) {}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'my_list':     handle_my_list();     break;
    case 'request':     handle_request();     break;
    case 'pay':         handle_pay();         break;
    case 'admin_list':  handle_admin_list();  break;
    case 'decide':         handle_decide();         break;
    case 'monthly_income': handle_monthly_income(); break;
    default:               fail('Unknown action', 404);
}

// Owner: list own subscription requests
function handle_my_list(): void {
    $user = require_role('owner', 'admin');
    $stmt = db()->prepare("
        SELECT s.*, u.name AS approved_by_name
        FROM subscriptions s
        LEFT JOIN users u ON u.id = s.approved_by
        WHERE s.owner_id = ?
        ORDER BY s.created_at DESC
    ");
    $stmt->execute([$user['id']]);

    $quota = (int)db()->prepare('SELECT dish_quota FROM users WHERE id = ?')
        ->execute([$user['id']]) ?: 0;
    // re-fetch properly
    $qs = db()->prepare('SELECT dish_quota FROM users WHERE id = ?');
    $qs->execute([$user['id']]);
    $quota = (int)$qs->fetchColumn();

    $cs = db()->prepare('SELECT COUNT(*) FROM dishes WHERE owner_id = ?');
    $cs->execute([$user['id']]);
    $used = (int)$cs->fetchColumn();

    send_json([
        'subscriptions' => $stmt->fetchAll(),
        'quota'         => $quota,
        'used'          => $used,
    ]);
}

// Owner: submit a new request for more dish quota
function handle_request(): void {
    $user = require_role('owner');
    if (method() !== 'POST') fail('POST required', 405);

    $data  = json_input();
    $packs = max(1, (int)($data['packs'] ?? 1));       // number of 10-dish packs
    $dishes_requested = $packs * 10;
    $amount_lkr       = $packs * 500;

    // Prevent spamming — only one pending request at a time
    $chk = db()->prepare("SELECT id FROM subscriptions WHERE owner_id = ? AND status = 'pending'");
    $chk->execute([$user['id']]);
    if ($chk->fetch()) fail('You already have a pending subscription request. Wait for admin approval.', 409);

    $stmt = db()->prepare("
        INSERT INTO subscriptions (owner_id, dishes_requested, amount_lkr)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$user['id'], $dishes_requested, $amount_lkr]);

    send_json(['message' => 'Request submitted — waiting for admin approval.'], 201);
}

// Owner: pay with card — auto-approve, no admin needed
function handle_pay(): void {
    $user = require_role('owner');
    if (method() !== 'POST') fail('POST required', 405);

    $data  = json_input();
    $packs = max(1, (int)($data['packs'] ?? 1));
    $dishes_requested = $packs * 10;
    $amount_lkr       = $packs * 500;

    // Basic card validation (format only — no real processing)
    $card_number = preg_replace('/\s+/', '', $data['card_number'] ?? '');
    $card_name   = trim($data['card_name'] ?? '');
    $card_expiry = trim($data['card_expiry'] ?? '');
    $card_cvv    = trim($data['card_cvv'] ?? '');

    if (!preg_match('/^\d{13,19}$/', $card_number)) fail('Invalid card number');
    if (!$card_name)                                 fail('Cardholder name required');
    if (!preg_match('/^(0[1-9]|1[0-2])\/\d{2}$/', $card_expiry)) fail('Invalid expiry — use MM/YY');
    if (!preg_match('/^\d{3,4}$/', $card_cvv))      fail('Invalid CVV');

    // Check expiry not in the past
    [$m, $y] = explode('/', $card_expiry);
    if (mktime(0, 0, 0, (int)$m + 1, 1, (int)('20' . $y)) < time()) fail('Card has expired');

    db()->beginTransaction();
    try {
        db()->prepare("
            INSERT INTO subscriptions (owner_id, dishes_requested, amount_lkr, status, payment_method, approved_at)
            VALUES (?, ?, ?, 'approved', 'card', NOW())
        ")->execute([$user['id'], $dishes_requested, $amount_lkr]);

        db()->prepare("UPDATE users SET dish_quota = dish_quota + ? WHERE id = ?")
            ->execute([$dishes_requested, $user['id']]);

        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        fail('Payment failed: ' . $e->getMessage(), 500);
    }

    send_json(['message' => "Payment successful! $dishes_requested dishes added to your quota."]);
}

// Admin: list all subscriptions (optionally filter by status)
function handle_admin_list(): void {
    require_role('admin', 'sub_admin');
    $status = $_GET['status'] ?? '';   // 'pending' | '' = all

    if ($status) {
        $stmt = db()->prepare("
            SELECT s.*, o.name AS owner_name, o.hotel_name, o.email AS owner_email
            FROM subscriptions s
            JOIN users o ON o.id = s.owner_id
            WHERE s.status = ?
            ORDER BY s.created_at DESC
        ");
        $stmt->execute([$status]);
    } else {
        $stmt = db()->query("
            SELECT s.*, o.name AS owner_name, o.hotel_name, o.email AS owner_email
            FROM subscriptions s
            JOIN users o ON o.id = s.owner_id
            ORDER BY s.created_at DESC
        ");
    }

    send_json(['subscriptions' => $stmt->fetchAll()]);
}

// Admin: approve or reject a subscription request
function handle_decide(): void {
    $admin = require_role('admin', 'sub_admin');
    if (method() !== 'POST') fail('POST required', 405);

    $data   = json_input();
    $subId  = (int)($data['sub_id'] ?? 0);
    $action = $data['action'] ?? '';  // 'approve' | 'reject'
    $note   = trim($data['note'] ?? '');

    if (!$subId) fail('sub_id required');
    if (!in_array($action, ['approve', 'reject'], true)) fail('action must be approve or reject');

    $stmt = db()->prepare('SELECT * FROM subscriptions WHERE id = ?');
    $stmt->execute([$subId]);
    $sub = $stmt->fetch();
    if (!$sub) fail('Subscription not found', 404);
    if ($sub['status'] !== 'pending') fail('Already decided', 409);

    $newStatus = $action === 'approve' ? 'approved' : 'rejected';

    db()->beginTransaction();
    try {
        db()->prepare("
            UPDATE subscriptions
            SET status = ?, note = ?, approved_at = NOW(), approved_by = ?
            WHERE id = ?
        ")->execute([$newStatus, $note ?: null, $admin['id'], $subId]);

        if ($action === 'approve') {
            db()->prepare("
                UPDATE users SET dish_quota = dish_quota + ? WHERE id = ?
            ")->execute([$sub['dishes_requested'], $sub['owner_id']]);
        }
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        fail('Failed: ' . $e->getMessage(), 500);
    }

    write_log("Subscription {$newStatus}", 'subscription', $subId, "Owner ID: {$sub['owner_id']}");
    send_json(['message' => $action === 'approve' ? 'Subscription approved and quota added.' : 'Subscription rejected.']);
}

// Admin: monthly income totals from approved subscriptions (last 12 months)
function handle_monthly_income(): void {
    require_role('admin', 'sub_admin');
    $stmt = db()->query("
        SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
               DATE_FORMAT(created_at, '%b %Y')  AS label,
               COALESCE(SUM(amount_lkr), 0)      AS total
        FROM subscriptions
        WHERE status = 'approved'
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
        LIMIT 12
    ");
    send_json(['months' => $stmt->fetchAll()]);
}
