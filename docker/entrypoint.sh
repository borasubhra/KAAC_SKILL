#!/bin/sh
# Creates/updates the database tables and starting data, then starts Apache.
set -e

php /var/www/app/cli/migrate.php
chown -R www-data:www-data "${STORAGE_DIR:-/var/www/storage}"

exec docker-php-entrypoint "$@"
