<?php
// Uploaded documents: checked, stored outside the web root, and served only to people allowed to see them.
declare(strict_types=1);

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_PDF_BYTES = 2 * 1024 * 1024;

function storage_dir(): string { return rtrim(env('STORAGE_DIR', '/var/www/storage'), '/'); }

/** The uploaded file for form field $field, or null when none was chosen. Fails on upload errors. */
function upload_in(string $field): ?array {
  $f = $_FILES[$field] ?? null;
  if (!$f || ($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
  if ($f['error'] !== UPLOAD_ERR_OK) {
    fail(in_array($f['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 'A file is too large.' : 'A file could not be uploaded. Try again.');
  }
  return $f;
}

/** Checks an upload's real type and size. Returns [mime, extension]. */
function check_upload(array $f, bool $imageOnly): array {
  if (!is_uploaded_file($f['tmp_name']) && PHP_SAPI !== 'cli') fail('Invalid upload.');
  $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
  $name = basename((string)$f['name']);
  if ($mime === 'image/jpeg' || $mime === 'image/png') {
    if ($f['size'] > MAX_IMAGE_BYTES) fail("$name is larger than 3 MB.");
    if (@getimagesize($f['tmp_name']) === false) fail("$name is not a valid image.");
    return [$mime, $mime === 'image/png' ? 'png' : 'jpg'];
  }
  if ($mime === 'application/pdf' && !$imageOnly) {
    if ($f['size'] > MAX_PDF_BYTES) fail("$name is larger than 2 MB. Compress the PDF or upload a photo of it instead.");
    return [$mime, 'pdf'];
  }
  fail($imageOnly ? "$name must be a JPG or PNG image." : "$name is not a JPG, PNG or PDF file.");
}

/**
 * Stores an upload and records it in `documents`. Call inside a transaction; on rollback, call
 * discard_new_files() to remove what was written. Returns the document row as stored.
 */
function store_upload(array $f, string $ownerType, string $ownerId, string $key, bool $imageOnly): array {
  [$mime, $ext] = check_upload($f, $imageOnly);
  $id = $ownerId . '-' . $key . '-' . bin2hex(random_bytes(6));  // unguessable
  $rel = $ownerType . '/' . preg_replace('/[^A-Za-z0-9-]/', '', $ownerId) . '/' . $id . '.' . $ext;
  $abs = storage_dir() . '/' . $rel;
  if (!is_dir(dirname($abs)) && !mkdir(dirname($abs), 0750, true)) throw new RuntimeException('Cannot create upload folder.');
  $moved = PHP_SAPI === 'cli' ? copy($f['tmp_name'], $abs) : move_uploaded_file($f['tmp_name'], $abs);
  if (!$moved) throw new RuntimeException('Cannot store upload.');
  $GLOBALS['__new_files'][] = $abs;
  $name = mb_substr(basename((string)$f['name']), 0, 150);
  q('INSERT INTO documents(id, owner_type, owner_id, doc_key, name, mime, size, path) VALUES (:id,:ot,:oi,:k,:n,:m,:s,:p)',
    [':id' => $id, ':ot' => $ownerType, ':oi' => $ownerId, ':k' => $key, ':n' => $name, ':m' => $mime, ':s' => (int)$f['size'], ':p' => $rel]);
  return ['id' => $id, 'name' => $name, 'mime' => $mime];
}

/** Removes files written during a request whose transaction was rolled back. */
function discard_new_files(): void {
  foreach ($GLOBALS['__new_files'] ?? [] as $abs) @unlink($abs);
  $GLOBALS['__new_files'] = [];
}

function delete_document(string $id): void {
  $d = one('SELECT path FROM documents WHERE id = :id', [':id' => $id]);
  if (!$d) return;
  q('DELETE FROM documents WHERE id = :id', [':id' => $id]);
  $path = storage_dir() . '/' . $d['path'];
  register_shutdown_function(fn() => @unlink($path));  // after the transaction commits
}

/** Validates a small JPEG thumbnail sent as a data URL (made in the browser). Returns it, or '' when absent. */
function thumb_in(array $in, string $key = 'photo_thumb'): string {
  $v = $in[$key] ?? '';
  if (!is_string($v) || $v === '') return '';
  if (strlen($v) > 80000 || !preg_match('#^data:image/jpeg;base64,[A-Za-z0-9+/=]+$#', $v)) fail('The photo could not be processed. Choose another photo.');
  $bin = base64_decode(substr($v, 23), true);
  if ($bin === false || @getimagesizefromstring($bin) === false) fail('The photo could not be processed. Choose another photo.');
  return $v;
}

function send_file(string $abs, string $mime, string $name, bool $download = false): never {
  if (!is_file($abs)) fail('This file is not available.', 404);
  header('Content-Type: ' . $mime);
  header('Content-Length: ' . filesize($abs));
  header('X-Content-Type-Options: nosniff');
  header('Cache-Control: private, max-age=300');
  $safe = preg_replace('/[^A-Za-z0-9._ -]/', '_', $name);
  header(($download ? 'Content-Disposition: attachment' : 'Content-Disposition: inline') . '; filename="' . $safe . '"');
  readfile($abs);
  exit;
}
