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
