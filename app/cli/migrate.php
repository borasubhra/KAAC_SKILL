<?php
// Creates or updates the database schema and loads the starting data. Safe to run on every start.
// Usage: php app/cli/migrate.php
declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

const DEV_SECRET = 'dev-only-secret-change-me-0123456789abcdef';

function say(string $m): void { fwrite(STDOUT, "[migrate] $m\n"); }

if (!is_dev()) {
  if (env('APP_SECRET') === DEV_SECRET) { fwrite(STDERR, "[migrate] APP_SECRET is still the development value. Set a new random secret in .env.\n"); exit(1); }
  if (env('DB_PASS') === 'kaac-local-dev-password') { fwrite(STDERR, "[migrate] DB_PASS is still the development value. Set a strong database password in .env.\n"); exit(1); }
  if (env('DEMO_USERS') === 'true') { fwrite(STDERR, "[migrate] DEMO_USERS must be false in production.\n"); exit(1); }
}
app_secret();  // fails early when missing or too short

for ($i = 1; ; $i++) {
  try { db(); break; }
  catch (PDOException $e) {
    if ($i >= 30) { fwrite(STDERR, '[migrate] Database not reachable: ' . $e->getMessage() . "\n"); exit(1); }
    say('Waiting for the database...');
    sleep(2);
  }
}

db()->exec(file_get_contents(__DIR__ . '/../../db/schema.sql'));
say('Schema is up to date.');

// Some hosting databases lose the automatic numbering of these ID columns when tables are copied
// across. Put it back, and keep it ahead of IDs already in use (including any handed out by hand).
foreach (['applicants', 'notifications', 'audit_log'] as $table) {
  $seq = "{$table}_id_seq";
  if (!val("SELECT column_default FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = :t AND column_name = 'id'", [':t' => $table])) {
    db()->exec("CREATE SEQUENCE IF NOT EXISTS $seq OWNED BY $table.id");
    db()->exec("ALTER TABLE $table ALTER COLUMN id SET DEFAULT nextval('$seq')");
    say("Restored automatic numbering of $table.");
  }
  $seq = val('SELECT pg_get_serial_sequence(:t, \'id\')', [':t' => $table]) ?: $seq;
  $max = (int)val("SELECT COALESCE(MAX(id), 0) FROM $table");
  if ($max > 0 && $max >= (int)val("SELECT last_value FROM $seq")) q('SELECT setval(:s, :n)', [':s' => $seq, ':n' => $max]);
}

$seed = json_decode(file_get_contents(__DIR__ . '/../../db/seed.json'), true);

tx(function () use ($seed) {
  if (!val('SELECT 1 FROM sectors LIMIT 1')) {
    foreach ($seed['sectors'] as $s) q('INSERT INTO sectors(id, name, descr) VALUES (:id,:n,:d)', [':id' => $s['id'], ':n' => $s['name'], ':d' => $s['desc']]);
    foreach ($seed['courses'] as $c) {
      q('INSERT INTO courses(id, sector_id, name, nsqf, hours, min_qual, min_age, max_age, seats, active) VALUES (:id,:s,:n,:nsqf,:h,:q,:mina,:maxa,:seats,true)',
        [':id' => $c['id'], ':s' => $c['sectorId'], ':n' => $c['name'], ':nsqf' => $c['nsqf'], ':h' => $c['hours'], ':q' => $c['minQual'],
          ':mina' => $c['minAge'], ':maxa' => $c['maxAge'], ':seats' => $c['seats']]);
    }
    foreach ($seed['centres'] as $c) {
      q('INSERT INTO centres(id, name, address, district, sectors, capacity, phone, active, centre_type, hod, nearby_town, facilities)
         VALUES (:id,:n,:a,:d,:s,:c,:p,true,:t,:h,:town,:f)',
        [':id' => $c['id'], ':n' => $c['name'], ':a' => $c['address'], ':d' => $c['district'], ':s' => to_pg_arr($c['sectors']),
          ':c' => $c['capacity'], ':p' => $c['phone'], ':t' => $c['type'], ':h' => $c['hod'], ':town' => $c['nearbyTown'], ':f' => $c['facilities']]);
    }
    q("INSERT INTO notices(id, title, category, notice_date, body, created_by) VALUES ('NT-welcome', :t, 'Admission', CURRENT_DATE, :b, 'System')", [
      ':t' => 'Registration open for skill training courses, session ' . year(),
      ':b' => 'Online registration is open for all courses. Apply with your Aadhaar number and scanned documents. Training is free.',
    ]);
    say('Loaded sectors, courses, centres and the welcome notice.');
  }
  $settings = $seed['settings'];
  unset($settings['id']);
  q("INSERT INTO settings(id, data) VALUES ('main', :d) ON CONFLICT (id) DO NOTHING", [':d' => json_encode($settings, JSON_UNESCAPED_UNICODE)]);
  // Settings added in later versions are filled in without touching values the administrator has changed.
  q("UPDATE settings SET data = :d::jsonb || data WHERE id = 'main'", [':d' => json_encode($settings, JSON_UNESCAPED_UNICODE)]);

  if (!val('SELECT 1 FROM users LIMIT 1')) {
    $adminPw = env('ADMIN_PASSWORD', '');
    if ($adminPw === '') {
      if (!is_dev()) { fwrite(STDERR, "[migrate] Set ADMIN_PASSWORD for the first administrator account.\n"); exit(1); }
      $adminPw = 'Admin@123';
    }
    q("INSERT INTO users(id, name, role, pw_hash) VALUES ('admin', 'System Administrator', 'admin', :h)", [':h' => password_hash($adminPw, PASSWORD_DEFAULT)]);
    say("Created the administrator account 'admin'.");
    if (env('DEMO_USERS', 'false') === 'true') {
      foreach ($seed['demoUsers'] as $u) {
        if ($u['id'] === 'admin') continue;
        q('INSERT INTO users(id, name, role, centre_id, pw_hash) VALUES (:id,:n,:r,:c,:h)',
          [':id' => $u['id'], ':n' => $u['name'], ':r' => $u['role'], ':c' => $u['centreId'] ?: null, ':h' => password_hash($u['pw'], PASSWORD_DEFAULT)]);
      }
      say('Created the demo officer accounts (DEMO_USERS=true).');
    }
  }
});

if (!is_dir(storage_dir()) && !mkdir(storage_dir(), 0750, true)) { fwrite(STDERR, "[migrate] Cannot create " . storage_dir() . "\n"); exit(1); }

/** Copies a PDF shipped in db/seed into storage and records it. Returns the document ID, or null when the file is missing. */
function seed_pdf(string $ownerType, string $ownerId, string $key, string $attachment, string $name): ?string {
  $src = __DIR__ . '/../../' . $attachment;
  if (!is_file($src)) return null;
  $docId = $ownerId . '-' . $key . '-' . bin2hex(random_bytes(6));
  $rel = "$ownerType/$ownerId/$docId.pdf";
  @mkdir(storage_dir() . "/$ownerType/$ownerId", 0750, true);
  if (!copy($src, storage_dir() . "/$rel")) throw new RuntimeException("Cannot copy $src");
  q('INSERT INTO documents(id, owner_type, owner_id, doc_key, name, mime, size, path) VALUES (:id, :t, :o, :k, :n, \'application/pdf\', :s, :p)',
    [':id' => $docId, ':t' => $ownerType, ':o' => $ownerId, ':k' => $key, ':n' => $name, ':s' => filesize($src), ':p' => $rel]);
  return $docId;
}

// Recruitment advertisements published with this version, with their PDF.
tx(function () use ($seed) {
  foreach ($seed['recruitments'] ?? [] as $r) {
    $have = one('SELECT r.id, d.id AS doc_id, d.path FROM recruitments r LEFT JOIN documents d ON d.id = r.attach_doc_id WHERE r.id = :id', [':id' => $r['id']]);
    if ($have) {
      // A revised advertisement replaces the copy published earlier, but never a PDF the department uploaded itself.
      $old = $have['path'] ? storage_dir() . '/' . $have['path'] : '';
      if ($have['doc_id'] && is_file($old) && in_array(hash_file('sha256', $old), $r['replacesAttachmentSha256'] ?? [], true)) {
        $docId = seed_pdf('recruitment', $r['id'], 'advert', $r['attachment'], $r['attachmentName']);
        if ($docId) {
          q('UPDATE recruitments SET attach_doc_id = :d, updated_at = now() WHERE id = :id', [':d' => $docId, ':id' => $r['id']]);
          delete_document($have['doc_id']);
          say("Updated the advertisement PDF of recruitment {$r['id']}.");
        }
      }
      continue;
    }
    $docId = seed_pdf('recruitment', $r['id'], 'advert', $r['attachment'], $r['attachmentName']);
    q('INSERT INTO recruitments(id, title, post, vacancies, engagement, description, min_qual, min_age, max_age, remuneration, selection, instructions, last_date, attach_doc_id, created_by)
       VALUES (:id,:t,:post,:v,:e,:d,:q,:mina,:maxa,:rem,:sel,:ins,:ld,:doc,\'System\')', [
      ':id' => $r['id'], ':t' => $r['title'], ':post' => $r['post'], ':v' => $r['vacancies'], ':e' => $r['engagement'], ':d' => $r['description'],
      ':q' => $r['minQual'], ':mina' => $r['minAge'], ':maxa' => $r['maxAge'], ':rem' => $r['remuneration'], ':sel' => $r['selection'],
      ':ins' => $r['instructions'], ':ld' => $r['lastDate'], ':doc' => $docId]);
    say("Published recruitment {$r['id']}: {$r['title']}.");
  }

  // Notices published with this version. Once added, the department may edit or remove them.
  foreach ($seed['notices'] ?? [] as $n) {
    if (val('SELECT 1 FROM notices WHERE id = :id', [':id' => $n['id']]) || val('SELECT 1 FROM audit_log WHERE action = \'seed-notice\' AND target = :id', [':id' => $n['id']])) continue;
    q("INSERT INTO notices(id, title, category, notice_date, body, created_by) VALUES (:id, :t, :c, :d, :b, 'System')",
      [':id' => $n['id'], ':t' => $n['title'], ':c' => $n['category'], ':d' => $n['date'], ':b' => $n['body']]);
    $docId = seed_pdf('notice', $n['id'], 'file', $n['attachment'], $n['attachmentName']);
    if ($docId) q('UPDATE notices SET attach_doc_id = :d WHERE id = :id', [':d' => $docId, ':id' => $n['id']]);
    q("INSERT INTO audit_log(action, target) VALUES ('seed-notice', :id)", [':id' => $n['id']]);
    say("Published notice: {$n['title']}.");
  }
});
say('Done.');
