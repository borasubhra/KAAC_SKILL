<?php
// Single entry point for the portal's API. With Docker the application code sits outside the web root
// in ../app; in the cPanel package it sits next to this file, protected by .htaccess.
require (is_dir(__DIR__ . '/app') ? __DIR__ . '/app' : __DIR__ . '/../app') . '/router.php';
run_api();
