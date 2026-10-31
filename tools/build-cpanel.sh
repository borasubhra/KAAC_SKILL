#!/bin/sh
# Builds the shared-hosting (cPanel) package: dist/kaac-skill-cpanel.zip, which unzips to a folder "skill"
# holding the page, api.php and the application. Usage: sh tools/build-cpanel.sh
set -eu
cd "$(dirname "$0")/.."
out=dist/skill
rm -rf dist && mkdir -p "$out"
cp -R public/. "$out/"
cp -R app db "$out/"
cp cpanel/.htaccess cpanel/.user.ini "$out/"
cp cpanel/deny.htaccess "$out/app/.htaccess"
cp cpanel/deny.htaccess "$out/db/.htaccess"
cp .env.example "$out/.env.example"
(cd dist && zip -qr -X kaac-skill-cpanel.zip skill)
echo "Built dist/kaac-skill-cpanel.zip ($(du -h dist/kaac-skill-cpanel.zip | cut -f1))"
