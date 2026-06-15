# ── Stage 1: Build React/Vite frontend ─────────────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /app

COPY dishcraft/frontend/package*.json ./
RUN npm ci --prefer-offline

COPY dishcraft/frontend .

# Build production bundle (HTTPS/basicSsl plugin is dev-only, ignored at build)
RUN npm run build

# ── Stage 2: Nginx serving static files ────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=frontend /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf.bak

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
