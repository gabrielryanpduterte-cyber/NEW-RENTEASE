FROM php:8.2-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        default-mysql-client \
        git \
        unzip \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install gd mysqli pdo_mysql \
    && a2enmod headers rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

CMD ["bash", "-lc", "composer install --no-interaction && mkdir -p storage/uploads storage/private/proofs storage/private/ids storage/public/rooms storage/public/boarding_houses storage/profiles && chown -R www-data:www-data storage || true; apache2-foreground"]
