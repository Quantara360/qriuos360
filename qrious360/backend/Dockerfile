FROM php:8.2-apache

# Install system deps + PHP extensions
RUN apt-get update && apt-get install -y \
        libcurl4-openssl-dev \
        libzip-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libwebp-dev \
        zlib1g-dev \
        zip \
        unzip \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install pdo pdo_mysql curl zip gd

# Allow .htaccess overrides and enable required modules
RUN a2enmod rewrite headers expires
RUN echo '<Directory /var/www/html>\n\
    AllowOverride All\n\
    Options -Indexes +FollowSymLinks\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

# PHP runtime settings
COPY docker-php.ini /usr/local/etc/php/conf.d/docker-custom.ini

WORKDIR /var/www/html

COPY . .

# Mount point for the shared uploads volume.
# Symlink /var/www/html/uploads → /uploads so existing PHP paths
# (using __DIR__.'/../uploads/') still resolve correctly.
RUN mkdir -p /uploads /uploads/jobs \
    && rm -rf /var/www/html/uploads \
    && ln -s /uploads /var/www/html/uploads \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 80

# ── Traefik CORS fix ─────────────────────────────────────────────────────────
# Dokploy's auto-generated Traefik middleware sets Access-Control-Max-Age:0,
# forcing a CORS preflight before every cross-origin request. This higher-priority
# router (1000 vs Dokploy default) replaces those CORS headers with correct values
# so browsers cache the preflight for 24 hours — halving round-trips on mobile.
# The existing Let's Encrypt cert in Traefik's ACME store is reused (tls:true
# without certresolver picks it up automatically from Traefik's cert store).
LABEL traefik.enable=true
LABEL traefik.http.routers.phpapi-cors.rule=Host(`api.qrious360.cloud`)
LABEL traefik.http.routers.phpapi-cors.entrypoints=websecure
LABEL traefik.http.routers.phpapi-cors.tls=true
LABEL traefik.http.routers.phpapi-cors.priority=1000
LABEL traefik.http.routers.phpapi-cors.service=phpapi-cors-svc
LABEL traefik.http.services.phpapi-cors-svc.loadbalancer.server.port=80
LABEL traefik.http.middlewares.phpapi-cors-mw.headers.accessControlAllowOriginList=https://qrious360.cloud
LABEL traefik.http.middlewares.phpapi-cors-mw.headers.accessControlAllowMethods=GET,POST,PUT,DELETE,OPTIONS
LABEL traefik.http.middlewares.phpapi-cors-mw.headers.accessControlAllowHeaders=Content-Type,Authorization,Accept
LABEL traefik.http.middlewares.phpapi-cors-mw.headers.accessControlAllowCredentials=true
LABEL traefik.http.middlewares.phpapi-cors-mw.headers.accessControlMaxAge=86400
LABEL traefik.http.routers.phpapi-cors.middlewares=phpapi-cors-mw
