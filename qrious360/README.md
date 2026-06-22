# DishCraft — Hotel Menu Platform with 3D Dish Models

A multi-role web app for hotels: owners upload food photos that become rotating 3D relief models, customers browse the menu, favorite dishes, and leave reviews, and an admin oversees everything.

```
┌──────────────────────┐         ┌──────────────────────┐
│  React + Vite        │  HTTP   │  PHP + PDO + MySQL   │
│  (port 5173 in dev)  │ ──────▶ │  (XAMPP, port 80)    │
│                      │  CORS   │                      │
│  - Three.js relief   │ ◀────── │  - Sessions          │
│  - Role-based UI     │         │  - REST endpoints    │
└──────────────────────┘         └──────────────────────┘
```

## Three roles

| Role     | Can do                                                                       |
|----------|------------------------------------------------------------------------------|
| Admin    | Full CRUD on every dish · approve/suspend/delete users · change roles · stats|
| Owner    | CRUD on their own dishes · upload food photo → 3D relief · set price/portions/ingredients |
| Customer | Browse menu · view 3D models · favorite dishes · leave 1–5★ reviews          |

---

## Setup (XAMPP on Windows / Mac / Linux)

### 1. Start XAMPP
Open the XAMPP control panel and start **Apache** and **MySQL**.

### 2. Create the database
Open phpMyAdmin (`http://localhost/phpmyadmin`), click **SQL**, paste the contents of `backend/schema.sql`, and run it. This creates the `dishcraft` database, all tables, and three demo accounts.

(Or from a terminal: `mysql -u root < backend/schema.sql`)

### 3. Copy the backend into htdocs
Copy the **`backend/`** folder into your XAMPP `htdocs` folder and rename it `dishcraft-api`.

```
xampp/htdocs/dishcraft-api/
  ├── api/
  ├── config/
  ├── uploads/         ← must be writable
  ├── index.php
  └── schema.sql
```

Make sure the `uploads/` folder is writable (on Linux/Mac: `chmod 755 uploads`).

Verify the API is reachable: open `http://localhost/dishcraft-api/` — you should see a JSON response listing the endpoints.

### 4. Run the React frontend
From the `frontend/` folder:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Demo accounts (all password: `admin123`)

| Email                       | Role     |
|-----------------------------|----------|
| admin@dishcraft.local       | Admin    |
| owner@dishcraft.local       | Owner    |
| customer@dishcraft.local    | Customer |

After logging in as the owner, go to **My Dishes → New dish**, upload a food photograph, and watch it become a 3D relief in the live preview as you adjust the depth/detail/smoothing sliders.

---

## How the 3D model is generated

Each dish stores three relief parameters alongside its photo: `relief_depth`, `relief_detail`, `relief_smoothing`. When the dish is rendered:

1. The photograph is loaded as a Three.js texture.
2. A subdivided plane is created with `relief_detail × relief_detail` segments.
3. Each pixel's brightness (luminance) is sampled into a height map.
4. The height map is optionally box-blurred (`relief_smoothing` passes).
5. Each plane vertex is displaced along Z by its corresponding luminance value × `relief_depth`.
6. The original image is also applied as the surface texture.

The result is a sculpted bas-relief — bright areas push forward, dark areas recede. It's the same principle as a 3D-printed lithophane, but rendered live in WebGL with proper lighting and shadows. The owner can fine-tune the parameters per dish for the best visual effect (creamy soups need different settings than a textured pizza).

---

## API reference

All endpoints return JSON. Auth is session-based (cookies); the frontend sends `credentials: 'include'`.

### Auth (`/auth.php`)
- `POST ?action=login` — `{ email, password }` → `{ user }`
- `POST ?action=register` — `{ name, email, password, role, hotel_name? }`
- `POST ?action=logout`
- `GET  ?action=me` — current session user

### Dishes (`/api/dishes.php`)
- `GET  ?action=list` — public, all available dishes
- `GET  ?action=get&id=N` — single dish + reviews
- `GET  ?action=mine` — owner/admin only, my dishes (admin sees all)
- `POST ?action=create` — multipart, owner/admin
- `POST ?action=update` — multipart, owner/admin
- `POST ?action=delete` — `{ id }`, owner/admin

### Social (`/api/social.php`)
- `GET  ?action=list` — customer's favorites
- `POST ?action=toggle` — `{ dish_id }`
- `POST ?action=review_add` — `{ dish_id, rating, comment }`
- `POST ?action=review_del` — `{ review_id }`

### Admin (`/api/admin.php`)
- `GET  ?action=stats` — system counts
- `GET  ?action=users` — all users
- `POST ?action=approve` — `{ user_id, approved }`
- `POST ?action=set_role` — `{ user_id, role }`
- `POST ?action=delete_user` — `{ user_id }`

---

## Project layout

```
dishcraft/
├── backend/                    ← copies into htdocs/dishcraft-api/
│   ├── config/
│   │   ├── db.php              ← DB credentials (edit if needed)
│   │   └── bootstrap.php       ← CORS, session, JSON, auth guards
│   ├── api/
│   │   ├── auth.php            ← login / register / logout / me
│   │   ├── dishes.php          ← dish CRUD
│   │   ├── social.php          ← favorites + reviews
│   │   └── admin.php           ← user management + stats
│   ├── uploads/                ← uploaded food photos go here
│   ├── index.php
│   └── schema.sql              ← run once in phpMyAdmin
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx             ← routes + role-protected wrappers
        ├── index.css
        ├── api/
        │   └── client.js       ← single fetch wrapper, all endpoints
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   └── ReliefViewer.jsx ← Three.js relief renderer
        └── pages/
            ├── Home.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── Menu.jsx              ← customer browse
            ├── DishDetail.jsx        ← 3D + ingredients + reviews
            ├── Favorites.jsx
            ├── OwnerDashboard.jsx
            ├── OwnerDishForm.jsx     ← create/edit with live 3D preview
            └── AdminDashboard.jsx
```

---

## Customizing

**DB credentials** — edit `backend/config/db.php`. Default is XAMPP's `root` / empty password.

**API URL** — if you put the backend somewhere other than `http://localhost/dishcraft-api`, change `API_BASE` in `frontend/src/api/client.js`.

**CORS allowed origins** — edit the `$allowed` array in `backend/config/bootstrap.php` if you deploy the frontend somewhere else.

**Owner approval** — by default, new owner accounts must be approved by an admin before they can log in. To disable, set `$approved = 1` in `backend/api/auth.php` `handle_register()`.

---

## Going to production

1. Build the frontend: `npm run build` produces a `dist/` folder.
2. Copy `dist/*` into a folder served by Apache (e.g. `htdocs/dishcraft/`).
3. Update `API_BASE` in `client.js` before building, or use a Vite env variable.
4. Switch sessions to `samesite=None; Secure` if frontend and API are on different domains over HTTPS.
5. Restrict CORS origins in `bootstrap.php` to your real domain.
