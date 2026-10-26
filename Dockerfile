# KAAC SDE portal: PHP 8.3 + Apache. The database runs in its own container (see docker-compose.yml).
FROM php:8.3-apache

RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq-dev \
 && docker-php-ext-install pdo_pgsql \
 && rm -rf /var/lib/apt/lists/* \
 && a2enmod headers rewrite \
 && printf 'ServerName localhost\nServerTokens Prod\nServerSignature Off\n' > /etc/apache2/conf-available/zz-kaac.conf \
 && a2enconf zz-kaac \
 && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php.ini "$PHP_INI_DIR/conf.d/kaac.ini"
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/kaac-entrypoint

# Only public/ is served. app/ and db/ sit outside the web root.
COPY app /var/www/app
COPY db /var/www/db
COPY public /var/www/public

# Windows checkouts may turn LF into CRLF, which breaks shell scripts.
RUN sed -i 's/\r$//' /usr/local/bin/kaac-entrypoint \
 && chmod +x /usr/local/bin/kaac-entrypoint \
 && mkdir -p /var/www/storage \
 && chown -R www-data:www-data /var/www/storage

ENV STORAGE_DIR=/var/www/storage
VOLUME /var/www/storage
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD php -r 'exit(@file_get_contents("http://127.0.0.1/api.php?r=me") === false ? 1 : 0);'

ENTRYPOINT ["kaac-entrypoint"]
CMD ["apache2-foreground"]
