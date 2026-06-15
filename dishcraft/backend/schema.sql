-- ============================================================
-- DishCraft Database Schema
-- Run this in phpMyAdmin or MySQL CLI before starting the API
-- ============================================================

CREATE DATABASE IF NOT EXISTS dishcraft CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dishcraft;

-- ============================================================
-- Drop tables in dependency order
-- ============================================================
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS dish_ingredients;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- ============================================================
-- USERS — three roles: admin, owner, customer
-- ============================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'owner', 'customer') NOT NULL DEFAULT 'customer',
    hotel_name VARCHAR(150) DEFAULT NULL,
    logo_path VARCHAR(255) DEFAULT NULL,
    qr_token CHAR(32) DEFAULT NULL UNIQUE,
    approved TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CATEGORIES — food categories per owner
-- ============================================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- DISHES — owned by a hotel owner
-- ============================================================
CREATE TABLE dishes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    category_id INT DEFAULT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    portion_size VARCHAR(80),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    image_path VARCHAR(255),
    images_json TEXT DEFAULT NULL,
    model_path VARCHAR(255) DEFAULT NULL,
    model_task_id VARCHAR(100) DEFAULT NULL,
    relief_depth FLOAT DEFAULT 0.8,
    relief_detail INT DEFAULT 200,
    relief_smoothing INT DEFAULT 1,
    available TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- INGREDIENTS per dish (one row per ingredient)
-- ============================================================
CREATE TABLE dish_ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dish_id INT NOT NULL,
    ingredient VARCHAR(150) NOT NULL,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

-- ============================================================
-- FAVORITES — customer ↔ dish
-- ============================================================
CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dish_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fav (user_id, dish_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

-- ============================================================
-- REVIEWS — customer leaves a rating + comment per dish
-- ============================================================
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dish_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_review (user_id, dish_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED — default accounts
-- email:    admin@dishcraft.local  / owner@dishcraft.local / customer@dishcraft.local
-- password: admin123
-- ============================================================
INSERT INTO users (name, email, password_hash, role, hotel_name, qr_token, approved) VALUES
('System Admin',  'admin@dishcraft.local',    '$2b$10$AJ/getRPclQY1ciKJE8aX.DdagimzcjQZ7xfJo5eHQzBQlGH3Qhk2', 'admin',    NULL,              NULL,                               1),
('Demo Hotel',    'owner@dishcraft.local',    '$2b$10$AJ/getRPclQY1ciKJE8aX.DdagimzcjQZ7xfJo5eHQzBQlGH3Qhk2', 'owner',    'The Demo Bistro', 'demo0000000000000000000000000001', 1),
('Demo Customer', 'customer@dishcraft.local', '$2b$10$AJ/getRPclQY1ciKJE8aX.DdagimzcjQZ7xfJo5eHQzBQlGH3Qhk2', 'customer', NULL,              NULL,                               1);
