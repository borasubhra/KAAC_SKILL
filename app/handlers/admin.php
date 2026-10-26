<?php
// Administration: master data, users, settings, notices, and the online courses / jobs lists.
declare(strict_types=1);

function h_save_master(array $in): array {
  require_staff();  // administrators only, checked below
  if (me()['role'] !== 'admin') fail('Only the administrator can change courses, sectors and centres.', 403);
  $coll = str_in($in, 'coll');
  $d = is_array($in['data'] ?? null) ? $in['data'] : [];
  $id = strtoupper(str_in($d, 'id', 40));
  $isNew = !empty($in['isNew']);
  if (!preg_match('/^[A-Z0-9-]+$/', $id)) fail('IDs can use letters, numbers and hyphens only.');
  $name = str_in($d, 'name', 200);
  if ($name === '') fail('Fill in the name.');
  $table = ['courses' => 'courses', 'sectors' => 'sectors', 'centres' => 'centres'][$coll] ?? fail('Unknown list.');
  $exists = (bool)val("SELECT 1 FROM $table WHERE id = :id", [':id' => $id]);
  if ($isNew && $exists) fail('That ID already exists.');
  if (!$isNew && !$exists) fail('Record not found.', 404);

  if ($coll === 'sectors') {
    q('INSERT INTO sectors(id, name, descr) VALUES (:id,:n,:d) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, descr = EXCLUDED.descr',
      [':id' => $id, ':n' => $name, ':d' => str_in($d, 'desc', 500)]);
  } elseif ($coll === 'courses') {
    if (!val('SELECT 1 FROM sectors WHERE id = :id', [':id' => str_in($d, 'sectorId')])) fail('Choose a sector.');
    if (!in_array(str_in($d, 'minQual'), QUALS, true)) fail('Choose a minimum qualification.');
    $ints = [];
    foreach (['nsqf' => [1, 10], 'hours' => [1, 5000], 'minAge' => [14, 70], 'maxAge' => [14, 70], 'seats' => [1, 1000]] as $k => [$lo, $hi]) {
      $v = $d[$k] ?? null;
      if (!is_numeric($v) || (int)$v < $lo || (int)$v > $hi) fail("Enter a value between $lo and $hi for $k.");
      $ints[$k] = (int)$v;
    }
    if ($ints['minAge'] > $ints['maxAge']) fail('Minimum age must not be more than maximum age.');
    $qp = strtoupper(str_in($d, 'qpCode', 30));
    if ($qp !== '' && !preg_match('#^[A-Z0-9/ .-]+$#', $qp)) fail('Enter the QP code as shown on SIDH, for example ELE/Q3101.');
    q('INSERT INTO courses(id, sector_id, name, nsqf, hours, min_qual, min_age, max_age, seats, active, job_role, qp_code, ssc)
       VALUES (:id,:s,:n,:nsqf,:h,:q,:mina,:maxa,:seats,:a,:jr,:qp,:ssc)
       ON CONFLICT (id) DO UPDATE SET sector_id = EXCLUDED.sector_id, name = EXCLUDED.name, nsqf = EXCLUDED.nsqf, hours = EXCLUDED.hours,
         min_qual = EXCLUDED.min_qual, min_age = EXCLUDED.min_age, max_age = EXCLUDED.max_age, seats = EXCLUDED.seats, active = EXCLUDED.active,
         job_role = EXCLUDED.job_role, qp_code = EXCLUDED.qp_code, ssc = EXCLUDED.ssc, updated_at = now()',
      [':id' => $id, ':s' => str_in($d, 'sectorId'), ':n' => $name, ':nsqf' => $ints['nsqf'], ':h' => $ints['hours'], ':q' => str_in($d, 'minQual'),
        ':mina' => $ints['minAge'], ':maxa' => $ints['maxAge'], ':seats' => $ints['seats'], ':a' => !empty($d['active']) ? 'true' : 'false',
        ':jr' => str_in($d, 'jobRole', 200), ':qp' => $qp, ':ssc' => str_in($d, 'ssc', 200)]);
  } else {
    $sectors = array_values(array_filter((array)($d['sectors'] ?? []), fn($s) => is_string($s) && val('SELECT 1 FROM sectors WHERE id = :id', [':id' => $s])));
    if (!in_array(str_in($d, 'district'), ['Karbi Anglong', 'West Karbi Anglong'], true)) fail('Choose a district.');
    // CR-09: type, Head of Department (Government institutes), nearby town, facilities, and batch capacity.
    $type = str_in($d, 'type');
    if (!in_array($type, ['Government institute', 'Private'], true)) fail('Choose whether the centre is a Government institute or Private.');
    $hod = $type === 'Government institute' ? str_in($d, 'hod', 150) : '';
    if ($type === 'Government institute' && $hod === '') fail('Enter the Head of Department of the Government institute.');
    if (!valid_sidh_id(str_in($d, 'sidhTcId', 60))) fail('Check the SIDH Training Centre ID: use letters, numbers, / _ . - only.');
    $capacity = (int)($d['capacity'] ?? 0);
    if ($capacity < 1 || $capacity > 500) fail('Enter how many trainees one batch at this centre can hold (1–500).');
    q('INSERT INTO centres(id, name, address, district, sectors, capacity, phone, active, centre_type, hod, nearby_town, facilities, sidh_tc_id)
       VALUES (:id,:n,:a,:d,:s,:c,:p,:act,:t,:h,:town,:f,:tc)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, district = EXCLUDED.district, sectors = EXCLUDED.sectors,
         capacity = EXCLUDED.capacity, phone = EXCLUDED.phone, active = EXCLUDED.active, centre_type = EXCLUDED.centre_type, hod = EXCLUDED.hod,
         nearby_town = EXCLUDED.nearby_town, facilities = EXCLUDED.facilities, sidh_tc_id = EXCLUDED.sidh_tc_id',
      [':id' => $id, ':n' => $name, ':a' => str_in($d, 'address', 300), ':d' => str_in($d, 'district'), ':s' => to_pg_arr($sectors),
        ':c' => $capacity, ':p' => str_in($d, 'phone', 30), ':act' => !empty($d['active']) ? 'true' : 'false', ':t' => $type, ':h' => $hod,
        ':town' => str_in($d, 'nearbyTown', 120), ':f' => str_in($d, 'facilities', 1000), ':tc' => str_in($d, 'sidhTcId', 40)]);
  }
  audit("master:save:$coll", $id);
  return ['ok' => true];
}

function h_remove_master(array $in): array {
  if ((require_staff())['role'] !== 'admin') fail('Only the administrator can delete these records.', 403);
  $coll = str_in($in, 'coll');
  $id = str_in($in, 'id', 40);
  if ($coll === 'sectors') {
    if (val('SELECT 1 FROM courses WHERE sector_id = :id', [':id' => $id])) fail('Move or delete this sector’s courses first.');
    q('DELETE FROM sectors WHERE id = :id', [':id' => $id]);
  } elseif ($coll === 'courses') {
    if (val('SELECT 1 FROM students WHERE pref1 = :id OR pref2 = :id OR skill_id = :id', [':id' => $id])
      || val('SELECT 1 FROM batches WHERE course_id = :id', [':id' => $id])) fail('Students are linked to this course. Mark it inactive instead.');
    q('DELETE FROM courses WHERE id = :id', [':id' => $id]);
  } else {
    fail('Centres cannot be deleted. Mark the centre inactive instead.');
  }
  audit("master:delete:$coll", $id);
  return ['ok' => true];
}

function h_save_user(array $in): array {
  $me = require_staff();
  if ($me['role'] !== 'admin') fail('Only the administrator can manage users.', 403);
  $id = strtolower(str_in($in, 'id', 40));
  $isNew = !empty($in['isNew']);
  if (!preg_match('/^[a-z0-9._-]+$/', $id)) fail('Username can use lowercase letters, numbers, dot, dash and underscore.');
  $role = str_in($in, 'role');
  if (!isset(ROLES[$role])) fail('Choose a role.');
  $centre = $role === 'centre' ? str_in($in, 'centreId', 40) : '';
  if ($role === 'centre' && !val('SELECT 1 FROM centres WHERE id = :id', [':id' => $centre])) fail('Choose a centre for the Centre Manager.');
  $name = str_in($in, 'name', 120);
  if ($name === '') fail('Fill in the full name.');
  $active = !empty($in['active']);
  if ($id === $me['id'] && (!$active || $role !== 'admin')) fail('You cannot disable your own account or remove your own administrator role.');
  $pw = (string)($in['pw'] ?? '');
  if ($pw !== '' || $isNew) check_new_password($pw);
  $exists = (bool)val('SELECT 1 FROM users WHERE id = :id', [':id' => $id]);
  if ($isNew && $exists) fail('That username is taken.');
  if (!$isNew && !$exists) fail('User not found.', 404);
  if ($isNew) {
    q('INSERT INTO users(id, name, role, centre_id, active, pw_hash) VALUES (:id,:n,:r,:c,:a,:h)',
      [':id' => $id, ':n' => $name, ':r' => $role, ':c' => $centre ?: null, ':a' => $active ? 'true' : 'false', ':h' => password_hash($pw, PASSWORD_DEFAULT)]);
  } else {
    q('UPDATE users SET name = :n, role = :r, centre_id = :c, active = :a WHERE id = :id',
      [':id' => $id, ':n' => $name, ':r' => $role, ':c' => $centre ?: null, ':a' => $active ? 'true' : 'false']);
    if ($pw !== '') q('UPDATE users SET pw_hash = :h WHERE id = :id', [':h' => password_hash($pw, PASSWORD_DEFAULT), ':id' => $id]);
  }
  audit('user:save', $id, ['role' => $role, 'active' => $active, 'passwordChanged' => $pw !== '']);
  return ['ok' => true];
}

function check_new_password(string $pw): void {
  if (strlen($pw) < 10 || !preg_match('/[A-Za-z]/', $pw) || !preg_match('/\d/', $pw)) {
    fail('Passwords need at least 10 characters, including letters and numbers.');
  }
}

/** Lets any officer change their own password. */
function h_change_password(array $in): array {
  $me = require_staff();
  rate_check('pwchange:' . $me['id'], 5, 900);
  if (!check_password($me['id'], (string)($in['current'] ?? ''))) { rate_add('pwchange:' . $me['id']); fail('Your current password is incorrect.'); }
  $pw = (string)($in['pw'] ?? '');
  check_new_password($pw);
  q('UPDATE users SET pw_hash = :h WHERE id = :id', [':h' => password_hash($pw, PASSWORD_DEFAULT), ':id' => $me['id']]);
  audit('user:change-password', $me['id']);
  return ['ok' => true];
}

const SETTINGS_FIELDS = ['deptName', 'council', 'address', 'jtsName', 'jtsDesignation', 'phone', 'email', 'officeHours', 'aboutText',
  'smsSender', 'smsGateway', 'notices', 'ackEmailText', 'selectionEmailText', 'maxBatchSize', 'sidhTpId', 'sidhProjectId', 'sidhScheme'];

function h_save_settings(array $in): array {
  if ((require_staff())['role'] !== 'admin') fail('Only the administrator can change settings.', 403);
  $s = settings_all();
  foreach (SETTINGS_FIELDS as $k) if (array_key_exists($k, $in)) $s[$k] = str_in($in, $k, 5000);
  if (isset($s['maxBatchSize']) && ((int)$s['maxBatchSize'] < 1 || (int)$s['maxBatchSize'] > 200)) fail('Enter a maximum batch size between 1 and 200.');
  $logo = $in['logo'] ?? null;
  if (!empty($in['logoRemove'])) $s['logo'] = '';
  elseif (is_string($logo) && $logo !== '') {
    if (strlen($logo) > 400000 || !preg_match('#^data:image/png;base64,[A-Za-z0-9+/=]+$#', $logo)
      || @getimagesizefromstring((string)base64_decode(substr($logo, 22), true)) === false) fail('Could not read the logo image.');
    $s['logo'] = $logo;
  }
  q("INSERT INTO settings(id, data) VALUES ('main', :d) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data", [':d' => json_encode($s, JSON_UNESCAPED_UNICODE)]);
  audit('settings:save');
  return ['ok' => true];
}

const NOTICE_CATS = ['Notification', 'Admission', 'Result', 'Advertisement', 'Office order', 'Circular', 'Tender'];

function h_save_notice(array $in): array {
  $me = require_staff('training');
  $id = str_in($in, 'id', 40);
  $title = str_in($in, 'title', 300);
  $date = str_in($in, 'date', 10);
  $cat = str_in($in, 'category');
  if ($title === '') fail('Add a title for the notice.');
  if (!valid_date($date)) fail('Choose a date.');
  if (!in_array($cat, NOTICE_CATS, true)) fail('Choose a category.');
  try {
    $id = tx(function () use ($in, $me, $id, $title, $date, $cat) {
      $old = $id !== '' ? one('SELECT * FROM notices WHERE id = :id FOR UPDATE', [':id' => $id]) : null;
      if ($id !== '' && !$old) fail('Notice not found.', 404);
      $id = $old['id'] ?? 'NT' . bin2hex(random_bytes(5));
      if (!$old) q("INSERT INTO notices(id, title, category, notice_date, created_by) VALUES (:id, '', 'Notification', :d, :by)",
        [':id' => $id, ':d' => $date, ':by' => $me['name']]);
      $attach = $old['attach_doc_id'] ?? null;
      if ($f = upload_in('file')) {
        if ($attach) delete_document($attach);
        $attach = store_upload($f, 'notice', $id, 'file', false)['id'];
      } elseif (!empty($in['removeFile']) && $attach) {
        q('UPDATE notices SET attach_doc_id = NULL WHERE id = :id', [':id' => $id]);
        delete_document($attach);
        $attach = null;
      }
      q('UPDATE notices SET title = :t, category = :c, notice_date = :d, body = :b, active = :a, attach_doc_id = :f, updated_at = now() WHERE id = :id',
        [':t' => $title, ':c' => $cat, ':d' => $date, ':b' => str_in($in, 'body', 10000), ':a' => str_in($in, 'active') === '0' ? 'false' : 'true',
          ':f' => $attach, ':id' => $id]);
      audit('notice:save', $id);
      return $id;
    });
  } catch (Throwable $e) { discard_new_files(); throw $e; }
  return ['id' => $id];
}

function h_delete_notice(array $in): array {
  require_staff('training');
  tx(function () use ($in) {
    $n = one('SELECT * FROM notices WHERE id = :id FOR UPDATE', [':id' => str_in($in, 'id', 40)]);
    if (!$n) fail('Notice not found.', 404);
    q('DELETE FROM notices WHERE id = :id', [':id' => $n['id']]);
    if ($n['attach_doc_id']) delete_document($n['attach_doc_id']);
    audit('notice:delete', $n['id']);
  });
  return ['ok' => true];
}

function h_save_ext(array $in): array {
  require_staff('training');
  $kind = str_in($in, 'kind') === 'jobs' ? 'jobs' : 'courses';
  $d = is_array($in['data'] ?? null) ? $in['data'] : [];
  $id = str_in($in, 'id', 40);
  if ($id !== '' && !preg_match('/^[A-Za-z0-9_-]+$/', $id)) fail('Invalid item.');
  $id = $id ?: ($kind === 'jobs' ? 'J' : 'X') . bin2hex(random_bytes(5));
  if (str_in($d, 'title') === '') fail('Add a title.');
  $url = str_in($d, 'url', 500);
  if (!preg_match('#^https://[^\s"<>]+$#', $url)) fail('Add a full link starting with https://');
  $fields = $kind === 'jobs'
    ? ['title', 'employer', 'location', 'pay', 'req', 'posted', 'source', 'course']
    : ['title', 'provider', 'topic', 'by', 'level', 'duration', 'cost'];
  $o = ['id' => $id, 'url' => $url, 'featured' => !empty($d['featured'])];
  foreach ($fields as $f) $o[$f] = str_in($d, $f, 300);
  if ($kind === 'jobs') $o['source'] = $o['source'] ?: 'Job site';
  else {
    $o['provider'] = $o['provider'] ?: 'Other';
    $o['topic'] = $o['topic'] ?: 'General';
    $o['points'] = array_values(array_slice(array_filter(array_map(fn($p) => is_string($p) ? mb_substr(trim($p), 0, 300) : '', (array)($d['points'] ?? []))), 0, 12));
  }
  q('INSERT INTO ext_items(kind, id, data) VALUES (:k,:id,:d) ON CONFLICT (kind, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()',
    [':k' => $kind, ':id' => $id, ':d' => json_encode($o, JSON_UNESCAPED_UNICODE)]);
  audit("ext:save:$kind", $id);
  return ['id' => $id];
}

/** Removes an item. Built-in defaults (defined in app.js) are hidden with a marker row instead. */
function h_remove_ext(array $in): array {
  require_staff('training');
  $kind = str_in($in, 'kind') === 'jobs' ? 'jobs' : 'courses';
  $id = str_in($in, 'id', 40);
  if (!preg_match('/^[A-Za-z0-9_-]+$/', $id)) fail('Invalid item.');
  if (!empty($in['isDefault'])) {
    q('INSERT INTO ext_items(kind, id, data) VALUES (:k,:id,:d) ON CONFLICT (kind, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()',
      [':k' => $kind, ':id' => $id, ':d' => json_encode(['id' => $id, 'hidden' => true])]);
  } else {
    q('DELETE FROM ext_items WHERE kind = :k AND id = :id', [':k' => $kind, ':id' => $id]);
  }
  audit("ext:remove:$kind", $id);
  return ['ok' => true];
}

/* ---------- Recruitment advertisements ---------- */

function h_save_recruitment(array $in): array {
  $me = require_staff('training');
  $id = str_in($in, 'id', 40);
  $title = str_in($in, 'title', 200);
  $last = str_in($in, 'lastDate', 10);
  $minAge = (int)($in['minAge'] ?? 0);
  $maxAge = (int)($in['maxAge'] ?? 0);
  $minQual = str_in($in, 'minQual');
  if ($title === '') fail('Add a title, for example “Engagement of 40 Trainers”.');
  if (!valid_date($last)) fail('Choose the last date for applications.');
  if ($minAge < 18 || $maxAge > 70 || $minAge > $maxAge) fail('Enter an age range between 18 and 70, with the minimum not above the maximum.');
  if (!in_array($minQual, QUALS, true)) fail('Choose the minimum qualification.');
  $vac = trim((string)($in['vacancies'] ?? ''));
  if ($vac !== '' && (!ctype_digit($vac) || (int)$vac < 1)) fail('Enter the number of posts, or leave it blank.');
  try {
    $id = tx(function () use ($in, $me, $id, $title, $last, $minAge, $maxAge, $minQual, $vac) {
      $old = $id !== '' ? one('SELECT * FROM recruitments WHERE id = :id FOR UPDATE', [':id' => $id]) : null;
      if ($id !== '' && !$old) fail('Recruitment not found.', 404);
      if (!$old) {
        // Skip numbers already used (the advertisement shipped with the portal is REC-2026-01).
        do { $id = 'REC-' . year() . '-' . pad(next_number('recruitment-' . year()), 2); }
        while (val('SELECT 1 FROM recruitments WHERE id = :id', [':id' => $id]));
      }
      if (!$old) q("INSERT INTO recruitments(id, title, last_date, created_by) VALUES (:id, '', :d, :by)", [':id' => $id, ':d' => $last, ':by' => $me['name']]);
      $attach = $old['attach_doc_id'] ?? null;
      if ($f = upload_in('file')) {
        if ($attach) delete_document($attach);
        $attach = store_upload($f, 'recruitment', $id, 'advert', false)['id'];
      } elseif (!empty($in['removeFile']) && $attach) {
        q('UPDATE recruitments SET attach_doc_id = NULL WHERE id = :id', [':id' => $id]);
        delete_document($attach);
        $attach = null;
      }
      q('UPDATE recruitments SET title = :t, post = :post, vacancies = :v, engagement = :e, description = :d, min_qual = :q, min_age = :mina,
           max_age = :maxa, remuneration = :rem, selection = :sel, instructions = :ins, last_date = :ld, attach_doc_id = :doc, active = :a, updated_at = now()
         WHERE id = :id', [
        ':t' => $title, ':post' => str_in($in, 'post', 100) ?: 'Trainer', ':v' => $vac === '' ? null : (int)$vac, ':e' => str_in($in, 'engagement', 500),
        ':d' => str_in($in, 'description', 5000), ':q' => $minQual, ':mina' => $minAge, ':maxa' => $maxAge, ':rem' => str_in($in, 'remuneration', 200),
        ':sel' => str_in($in, 'selection', 3000), ':ins' => str_in($in, 'instructions', 5000), ':ld' => $last, ':doc' => $attach,
        ':a' => str_in($in, 'active') === '0' ? 'false' : 'true', ':id' => $id]);
      audit('recruitment:save', $id);
      return $id;
    });
  } catch (Throwable $e) { discard_new_files(); throw $e; }
  return ['id' => $id];
}

/** Recruitments with applications are hidden rather than deleted, so the applications keep their link. */
function h_delete_recruitment(array $in): array {
  require_staff('training');
  tx(function () use ($in) {
    $r = one('SELECT * FROM recruitments WHERE id = :id FOR UPDATE', [':id' => str_in($in, 'id', 40)]);
    if (!$r) fail('Recruitment not found.', 404);
    if (val('SELECT 1 FROM trainers WHERE recruitment_id = :id', [':id' => $r['id']])) {
      fail('Trainers have applied against this recruitment. Set it to Hidden instead of deleting it.');
    }
    q('DELETE FROM recruitments WHERE id = :id', [':id' => $r['id']]);
    if ($r['attach_doc_id']) delete_document($r['attach_doc_id']);
    audit('recruitment:delete', $r['id']);
  });
  return ['ok' => true];
}
