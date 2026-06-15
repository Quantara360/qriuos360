<?php
require_once __DIR__ . '/config/bootstrap.php';
send_json([
    'name' => 'DishCraft API',
    'version' => '1.0',
    'endpoints' => [
        'auth.php?action=login|register|logout|me',
        'api/dishes.php?action=list|get|mine|create|update|delete',
        'api/social.php?action=list|toggle|review_add|review_del',
        'api/admin.php?action=users|approve|set_role|delete_user|stats',
        'uploads/<filename>'
    ]
]);
