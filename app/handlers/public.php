<?php
// Endpoints anyone can call. Each returns only what that visitor is entitled to see.
declare(strict_types=1);

/** Reference data for the public website. Contains no applicant data. */
function h_public(array $in): array {
  // Names and roles of officers for the About page; usernames are not published.
  $people = [];
  foreach (all("SELECT name, role, centre_id FROM users WHERE active AND role <> 'admin' ORDER BY name") as $i => $u) {
    $people[] = ['id' => 'p' . $i, 'name' => $u['name'], 'role' => $u['role'], 'centreId' => $u['centre_id'] ?? '', 'active' => true];
  }
  return [
    'demo' => is_dev(),
    'sectors' => array_map('map_sector', all('SELECT * FROM sectors ORDER BY id')),
    'courses' => array_map('map_course', all('SELECT * FROM courses ORDER BY id')),
    'centres' => array_map('map_centre', all('SELECT * FROM centres ORDER BY id')),
    'notices' => array_map('map_notice', all(NOTICE_SQL . ' WHERE n.active ORDER BY n.notice_date DESC, n.created_at DESC')),
    'recruitments' => array_map('map_recruitment', all(RECRUITMENT_SQL . ' WHERE r.active ORDER BY r.last_date DESC, r.created_at DESC')),
    'ext' => ext_items(),
    'settings' => public_settings(),
    'users' => $people,
  ];
}

function ext_items(): array {
  $out = ['courses' => [], 'jobs' => []];
  foreach (all('SELECT kind, data FROM ext_items ORDER BY updated_at') as $r) $out[$r['kind']][] = json_decode($r['data'], true);
  return $out;
}

/* ---------- Shared form checks ---------- */

function require_course(string $id, bool $activeOnly = true): array {
  $c = one('SELECT * FROM courses WHERE id = :id', [':id' => $id]);
  if (!$c || ($activeOnly && !$c['active'])) fail('Choose a course from the list.');
  return $c;
}
function optional_centre(string $id): ?string {
  if ($id === '') return null;
  if (!val('SELECT 1 FROM centres WHERE id = :id AND active', [':id' => $id])) fail('Choose a centre from the list.');
  return $id;
}
function check_person_basics(array $in, array &$p): string {
  $aadhaar = preg_replace('/\s+/', '', str_in($in, 'aadhaar', 20));
  if (!valid_aadhaar($aadhaar)) $p[] = 'Enter a valid 12-digit Aadhaar number (the check digit does not match).';
  if (!preg_match('/^[6-9]\d{9}$/', str_in($in, 'mobile', 10))) $p[] = 'Enter a valid 10-digit mobile number starting with 6–9.';
  if (!preg_match('/^\d{6}$/', str_in($in, 'pin', 6))) $p[] = 'Enter a 6-digit PIN code.';
  $dob = str_in($in, 'dob', 10);
  if (!valid_date($dob) || $dob > today()) $p[] = 'Enter a valid date of birth.';
  if (!in_array(str_in($in, 'gender'), ['Female', 'Male', 'Transgender'], true)) $p[] = 'Fill in gender.';
  if (!in_array(str_in($in, 'district'), ['Karbi Anglong', 'West Karbi Anglong', 'Other'], true)) $p[] = 'Fill in district.';
  if (!in_array(str_in($in, 'qual'), QUALS, true)) $p[] = 'Fill in highest qualification.';
  return $aadhaar;
}

/** Stores the uploaded documents listed in $types for one owner. Returns the `docs` list. */
function store_docs(array $types, string $ownerType, string $ownerId, ?array $only = null): array {
  $docs = [];
  foreach ($types as $key => $t) {
    if ($only !== null && !in_array($key, $only, true)) continue;
    $f = upload_in('doc_' . $key);
    if (!$f) continue;
    $d = store_upload($f, $ownerType, $ownerId, $key, $t['img']);
    $docs[] = ['key' => $key, 'label' => $t['label'], 'name' => $d['name'], 'type' => $d['mime'], 'docId' => $d['id'], 'status' => 'pending'];
  }
  return $docs;
}

/* ---------- Student accounts (CR-01) ---------- */

function check_new_student_password(string $pw): void {
  if (strlen($pw) < 8 || !preg_match('/[A-Za-z]/', $pw) || !preg_match('/\d/', $pw)) fail('Use a password of at least 8 characters with letters and numbers.');
}

/** Creates a student account. This is not an application; the student applies for a trade afterwards. */
function h_student_signup(array $in): array {
  rate_check('signup:' . client_ip(), 60, 3600, 'Too many new accounts from this connection. Try again later.');
  $name = str_in($in, 'name', 120);
  $email = strtolower(str_in($in, 'email', 120));
  $mobile = str_in($in, 'mobile', 10);
  $pw = (string)($in['password'] ?? '');
  if ($name === '') fail('Fill in your full name.');
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Enter a valid email address. Your application number and updates are sent here.');
  if (!preg_match('/^[6-9]\d{9}$/', $mobile)) fail('Enter a valid 10-digit mobile number starting with 6–9.');
  check_new_student_password($pw);
  if (val('SELECT 1 FROM applicants WHERE lower(email) = :e', [':e' => $email])) fail('An account with this email already exists. Log in, or use “Forgot password”.', 409);
  rate_add('signup:' . client_ip());
  $id = (int)val('INSERT INTO applicants(name, email, mobile, pw_hash) VALUES (:n, :e, :m, :h) RETURNING id',
    [':n' => $name, ':e' => $email, ':m' => $mobile, ':h' => password_hash($pw, PASSWORD_DEFAULT)]);
  queue_email('A' . $id, $email, 'SDE Dept, KAAC: your student account',
    "Dear $name,\n\nYour student account on the Skill Development & Entrepreneurship portal has been created.\n"
    . "Log in with this email address to choose a trade and apply.", 'account');
  return ['me' => applicant_login($email, $pw)];
}

function h_student_login(array $in): array { return ['me' => applicant_login(str_in($in, 'email', 120), (string)($in['password'] ?? ''))]; }

/** The student's dashboard: account details and every application they have made. */
function h_student_me(array $in): array {
  $a = applicant();
  if (!$a) return ['me' => null];
  $apps = all('SELECT * FROM students WHERE applicant_id = :a ORDER BY created_at DESC', [':a' => $a['id']]);
  $batchIds = array_values(array_filter(array_column($apps, 'batch_id')));
  $ids = array_column($apps, 'id');
  return [
    'me' => $a,
    'students' => array_map(fn($r) => applicant_view(map_student($r, 'inline')), $apps),
    'batches' => $batchIds ? load_batches('b.id = ANY(:ids)', [':ids' => to_pg_arr($batchIds)]) : [],
    'ojt' => $ids ? array_map('map_ojt', all("SELECT * FROM ojt_letters WHERE student_id = ANY(:ids) AND status = 'signed'", [':ids' => to_pg_arr($ids)])) : [],
  ];
}

function h_forgot_password(array $in): array {
  rate_check('forgot:' . client_ip(), 10, 3600);
  rate_add('forgot:' . client_ip());
  $email = strtolower(str_in($in, 'email', 120));
  $a = one('SELECT id, name, email FROM applicants WHERE lower(email) = :e AND active', [':e' => $email]);
  if ($a) {
    $token = bin2hex(random_bytes(24));
    q("INSERT INTO password_resets(token_hash, applicant_id, expires_at) VALUES (:t, :a, now() + interval '1 hour')",
      [':t' => hash('sha256', $token), ':a' => $a['id']]);
    $base = rtrim((string)($in['base'] ?? ''), '/');
    $link = (preg_match('#^https?://[^\s"<>]+$#', $base) ? $base : '') . '#reset/' . $token;
    queue_email('A' . $a['id'], $a['email'], 'SDE Dept, KAAC: reset your password',
      "Dear {$a['name']},\n\nOpen this link within one hour to set a new password:\n$link\n\nIf you did not ask for this, ignore this email.", 'password-reset');
  }
  // The same answer either way, so the form does not reveal which emails have accounts.
  return ['ok' => true];
}

function h_reset_password(array $in): array {
  rate_check('reset:' . client_ip(), 20, 3600);
  rate_add('reset:' . client_ip());
  $pw = (string)($in['password'] ?? '');
  check_new_student_password($pw);
  $email = tx(function () use ($in, $pw) {
    $r = one("SELECT r.applicant_id, a.email FROM password_resets r JOIN applicants a ON a.id = r.applicant_id
              WHERE r.token_hash = :t AND r.used_at IS NULL AND r.expires_at > now() FOR UPDATE OF r", [':t' => hash('sha256', (string)($in['token'] ?? ''))]);
    if (!$r) fail('This link has expired or was already used. Ask for a new one.');
    q('UPDATE applicants SET pw_hash = :h WHERE id = :id', [':h' => password_hash($pw, PASSWORD_DEFAULT), ':id' => $r['applicant_id']]);
    q('UPDATE password_resets SET used_at = now() WHERE applicant_id = :id AND used_at IS NULL', [':id' => $r['applicant_id']]);
    return $r['email'];
  });
  return ['me' => applicant_login($email, $pw)];
}

/* ---------- Application for a trade (CR-02) ---------- */

function h_apply(array $in): array {
  $acc = require_applicant();
  rate_check('register:' . client_ip(), 120, 3600, 'Too many applications from this connection. Try again later.');
  $p = [];
  $aadhaar = check_person_basics($in, $p);
  foreach (['name' => 'full name', 'father' => 'father’s name', 'village' => 'village / town', 'category' => 'category', 'pref1' => 'trade'] as $k => $label) {
    if (str_in($in, $k) === '') $p[] = "Fill in $label.";
  }
  if (str_in($in, 'category') !== '' && !in_array(str_in($in, 'category'), ['ST (Hills)', 'ST (Plains)', 'SC', 'OBC/MOBC', 'General', 'EWS'], true)) $p[] = 'Choose a category from the list.';
  if (!in_array(str_in($in, 'religion'), RELIGIONS, true)) $p[] = 'Fill in religion.';
  if (!in_array(str_in($in, 'employmentStatus'), EMPLOYMENT_STATUSES, true)) $p[] = 'Fill in current employment status.';
  if (!valid_sidh_id(str_in($in, 'sidhId', 60))) $p[] = 'Check the Skill India Digital Hub ID: use letters, numbers, / _ . - only, or leave it blank.';
  foreach (STUDENT_DOCS as $k => $t) if ($t['req'] && !upload_in('doc_' . $k)) $p[] = 'Upload ' . mb_strtolower($t['label']) . '.';
  if (empty($in['declare'])) $p[] = 'Tick the declaration to continue.';
  if ($p) fail(implode("\n", $p), 422);

  $pref1 = require_course(str_in($in, 'pref1'))['id'];
  $prefCentre = optional_centre(str_in($in, 'prefCentre'));
  $hmac = aadhaar_hmac($aadhaar);
  $thumb = thumb_in($in);
  $closed = "'" . implode("','", CLOSED_STATUSES) . "'";

  try {
    $row = tx(function () use ($in, $acc, $aadhaar, $hmac, $pref1, $prefCentre, $thumb, $closed) {
      $open = one("SELECT id FROM students WHERE applicant_id = :a AND status NOT IN ($closed)", [':a' => $acc['id']]);
      if ($open) fail("You already have an open application ({$open['id']}). You can apply again once it is closed.", 409);
      $dup = one("SELECT id FROM students WHERE aadhaar_hmac = :h AND status NOT IN ($closed)", [':h' => $hmac]);
      if ($dup) fail("An open application ({$dup['id']}) already exists for this Aadhaar number.", 409);
      $id = 'KAAC-SDE-' . year() . '-' . pad(next_number('student-' . year()));
      $docs = store_docs(STUDENT_DOCS, 'student', $id);
      $name = str_in($in, 'name', 120);
      $history = [['at' => now_iso(), 'by' => $name, 'role' => 'Applicant', 'action' => 'Application submitted', 'remark' => '']];
      $row = one('INSERT INTO students(id, applicant_id, name, father, mother, dob, gender, category, pwd, aadhaar_last4, aadhaar_hmac, mobile, email,
          village, block, district, pin, qual, board, pass_year, pct, pref1, pref_centre, photo_thumb, docs, history, religion, employment_status, sidh_id)
        VALUES (:id,:acc,:name,:father,:mother,:dob,:gender,:category,:pwd,:l4,:hmac,:mobile,:email,:village,:block,:district,:pin,:qual,:board,:year,:pct,
          :pref1,:pc,:thumb,:docs,:history,:religion,:emp,:sidh) RETURNING *', [
        ':religion' => str_in($in, 'religion'), ':emp' => str_in($in, 'employmentStatus'), ':sidh' => str_in($in, 'sidhId', 40),
        ':id' => $id, ':acc' => $acc['id'], ':name' => $name, ':father' => str_in($in, 'father', 120), ':mother' => str_in($in, 'mother', 120),
        ':dob' => str_in($in, 'dob', 10), ':gender' => str_in($in, 'gender'), ':category' => str_in($in, 'category'),
        ':pwd' => str_in($in, 'pwd') === 'Yes' ? 'Yes' : 'No', ':l4' => substr($aadhaar, -4), ':hmac' => $hmac,
        ':mobile' => str_in($in, 'mobile', 10), ':email' => $acc['email'], ':village' => str_in($in, 'village', 120), ':block' => str_in($in, 'block', 120),
        ':district' => str_in($in, 'district'), ':pin' => str_in($in, 'pin', 6), ':qual' => str_in($in, 'qual'), ':board' => str_in($in, 'board', 120),
        ':year' => str_in($in, 'year', 4), ':pct' => str_in($in, 'pct', 20), ':pref1' => $pref1, ':pc' => $prefCentre,
        ':thumb' => $thumb, ':docs' => json_encode($docs, JSON_UNESCAPED_UNICODE), ':history' => json_encode($history, JSON_UNESCAPED_UNICODE),
      ]);
      notify(map_student($row), 'submitted', ['subject' => "Application $id received"]);
      return $row;
    });
  } catch (Throwable $e) {
    discard_new_files();
    if ($e instanceof PDOException && $e->getCode() === '23505') fail('An open application already exists for this account or Aadhaar number.', 409);
    throw $e;
  }
  rate_add('register:' . client_ip());
  return track_payload_student($row);
}

/* ---------- Trainer registration ---------- */

function h_trainer_register(array $in): array {
  rate_check('register:' . client_ip(), 120, 3600, 'Too many registrations from this connection. Try again later.');
  // Trainers apply against a recruitment advertisement, whose age, qualification and last date apply.
  $rec = one('SELECT * FROM recruitments WHERE id = :id AND active', [':id' => str_in($in, 'recruitmentId', 40)]);
  if (!$rec) fail('Choose the recruitment you are applying for.');
  if ($rec['last_date'] < today()) fail('Applications for this recruitment closed on ' . fmt_d($rec['last_date']) . '.', 409);
  $p = [];
  $aadhaar = check_person_basics($in, $p);
  $email = str_in($in, 'email', 120);
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $p[] = 'Enter a valid email address.';
  foreach (['name' => 'full name', 'father' => 'father’s / spouse’s name', 'address' => 'address', 'specialisation' => 'specialisation'] as $k => $label) {
    if (str_in($in, $k) === '') $p[] = "Fill in $label.";
  }
  $dob = str_in($in, 'dob', 10);
  if (valid_date($dob)) {
    // Age as on the last date of application.
    $age = (new DateTimeImmutable($dob))->diff(new DateTimeImmutable($rec['last_date']))->y;
    if ($age < (int)$rec['min_age'] || $age > (int)$rec['max_age']) $p[] = "Age must be {$rec['min_age']} to {$rec['max_age']} years as on " . fmt_d($rec['last_date']) . " (yours: $age).";
  }
  $qi = array_search(str_in($in, 'qual'), QUALS, true);
  if ($qi !== false && $qi < array_search($rec['min_qual'], QUALS, true)) $p[] = "The minimum qualification for this recruitment is {$rec['min_qual']} pass.";
  // Experience is optional; when given it must be a sensible number of years.
  foreach (['indExp' => 'industry', 'trnExp' => 'training'] as $k => $label) {
    $v = trim((string)($in[$k] ?? ''));
    if ($v !== '' && (!is_numeric($v) || $v < 0 || $v > 50)) $p[] = "Check the $label experience: enter years between 0 and 50, or leave it blank.";
  }
  if (!valid_sidh_id(str_in($in, 'sidhId', 60))) $p[] = 'Check the Skill India Digital Hub ID: use letters, numbers, / _ . - only, or leave it blank.';
  // The form no longer asks for skills or preferred centres; the Training Manager matches trainers to batches.
  $skills = array_values(array_unique(array_filter((array)($in['skill'] ?? []), 'is_string')));
  foreach (TRAINER_DOCS as $k => $t) if ($t['req'] && !upload_in('doc_' . $k)) $p[] = 'Upload ' . mb_strtolower($t['label']) . '.';
  if (empty($in['declare'])) $p[] = 'Tick the declaration to continue.';
  if ($p) fail(implode("\n", $p), 422);

  $sectors = [];
  foreach ($skills as $c) $sectors[] = require_course($c)['sector_id'];
  $pcs = [];
  $hmac = aadhaar_hmac($aadhaar);
  $thumb = thumb_in($in);

  try {
    $row = tx(function () use ($in, $rec, $aadhaar, $hmac, $email, $skills, $sectors, $pcs, $thumb) {
      $dup = one("SELECT id FROM trainers WHERE aadhaar_hmac = :h AND status <> 'rejected'", [':h' => $hmac]);
      if ($dup) fail("A trainer registration ({$dup['id']}) already exists for this Aadhaar number. Use Track application to check it.", 409);
      $id = 'KAAC-SDE-TR-' . year() . '-' . pad(next_number('trainer-' . year()));
      $docs = store_docs(TRAINER_DOCS, 'trainer', $id);
      $name = str_in($in, 'name', 120);
      $history = [['at' => now_iso(), 'by' => $name, 'role' => 'Trainer', 'action' => 'Trainer registration submitted', 'remark' => '']];
      $row = one('INSERT INTO trainers(id, name, father, dob, gender, aadhaar_last4, aadhaar_hmac, mobile, email, address, district, pin, qual,
          specialisation, ind_exp, trn_exp, tot_no, tot_body, courses, sectors, pref_centres, photo_thumb, docs, history, recruitment_id, sidh_id)
        VALUES (:id,:name,:father,:dob,:gender,:l4,:hmac,:mobile,:email,:address,:district,:pin,:qual,:spec,:ie,:te,:totno,:totbody,
          :courses,:sectors,:pcs,:thumb,:docs,:history,:rec,:sidh) RETURNING *', [
        ':sidh' => str_in($in, 'sidhId', 40),
        ':rec' => $rec['id'],
        ':id' => $id, ':name' => $name, ':father' => str_in($in, 'father', 120), ':dob' => str_in($in, 'dob', 10), ':gender' => str_in($in, 'gender'),
        ':l4' => substr($aadhaar, -4), ':hmac' => $hmac, ':mobile' => str_in($in, 'mobile', 10), ':email' => $email,
        ':address' => str_in($in, 'address', 200), ':district' => str_in($in, 'district'), ':pin' => str_in($in, 'pin', 6), ':qual' => str_in($in, 'qual'),
        ':spec' => str_in($in, 'specialisation', 120), ':ie' => (float)($in['indExp'] ?? 0), ':te' => (float)($in['trnExp'] ?? 0),
        ':totno' => str_in($in, 'totNo', 60), ':totbody' => str_in($in, 'totBody', 120), ':courses' => to_pg_arr($skills),
        ':sectors' => to_pg_arr(array_values(array_unique($sectors))), ':pcs' => to_pg_arr($pcs), ':thumb' => $thumb,
        ':docs' => json_encode($docs, JSON_UNESCAPED_UNICODE), ':history' => json_encode($history, JSON_UNESCAPED_UNICODE),
      ]);
      notify(map_trainer($row), 'submitted');
      return $row;
    });
  } catch (Throwable $e) {
    discard_new_files();
    if ($e instanceof PDOException && $e->getCode() === '23505') fail('A trainer registration already exists for this Aadhaar number. Use Track application to check it.', 409);
    throw $e;
  }
  rate_add('register:' . client_ip());
  return track_payload_trainer($row);
}

/* ---------- Track status ---------- */

function track_payload_student(array $row): array {
  $batch = $row['batch_id'] ? load_batches('b.id = :id', [':id' => $row['batch_id']]) : [];
  return [
    'kind' => 'student',
    'student' => applicant_view(map_student($row, 'inline')),
    'batches' => $batch,
    'ojt' => array_map('map_ojt', all("SELECT * FROM ojt_letters WHERE student_id = :id AND status = 'signed' ORDER BY created_at", [':id' => $row['id']])),
  ];
}
function track_payload_trainer(array $row): array {
  return ['kind' => 'trainer', 'trainer' => map_trainer($row, 'inline'), 'batches' => load_batches('b.trainer_id = :id', [':id' => $row['id']])];
}

/** Finds a student or trainer by ID and date of birth. Failed attempts are rate-limited. */
function find_by_id_dob(array $in): array {
  $bucket = 'track:' . client_ip();
  rate_check($bucket, 60, 3600, 'Too many unsuccessful attempts. Try again in an hour.');
  $id = strtoupper(str_in($in, 'id', 60));
  $dob = str_in($in, 'dob', 10);
  if (valid_id($id) && valid_date($dob)) {
    if (str_starts_with($id, 'KAAC-SDE-TR-')) {
      $t = one('SELECT * FROM trainers WHERE id = :id AND dob = :dob', [':id' => $id, ':dob' => $dob]);
      if ($t) return ['trainer', $t];
    } else {
      $s = one('SELECT * FROM students WHERE id = :id AND dob = :dob', [':id' => $id, ':dob' => $dob]);
      if ($s) return ['student', $s];
    }
  }
  rate_add($bucket);
  fail('No application matches that ID and date of birth. Check both and try again.', 404);
}

function h_track(array $in): array {
  [$kind, $row] = find_by_id_dob($in);
  return $kind === 'trainer' ? track_payload_trainer($row) : track_payload_student($row);
}

/** Re-upload of documents after an application was returned for correction. */
function h_resubmit(array $in): array {
  // A logged-in student resubmits their own application; anyone else needs the ID and date of birth.
  $acc = applicant();
  $own = $acc ? one('SELECT * FROM students WHERE id = :id AND applicant_id = :a', [':id' => strtoupper(str_in($in, 'id', 60)), ':a' => $acc['id']]) : null;
  [$kind, $found] = $own ? ['student', $own] : find_by_id_dob($in);
  $types = $kind === 'trainer' ? TRAINER_DOCS : STUDENT_DOCS;
  try {
    $row = tx(function () use ($kind, $found, $types, $in) {
      $row = $kind === 'trainer' ? trainer_row($found['id']) : student_row($found['id']);
      if ($row['status'] !== 'returned') fail('This application is not waiting for corrections.', 409);
      $docs = jd($row['docs'], []);
      $flagged = array_column(array_filter($docs, fn($d) => ($d['status'] ?? '') === 'rejected'), 'key');
      $new = store_docs($types, $kind, $row['id'], $flagged ?: array_keys($types));
      if (!$new) fail('Choose at least one corrected document.');
      foreach ($new as $d) {
        $i = array_search($d['key'], array_column($docs, 'key'), true);
        if ($i === false) $docs[] = $d; else $docs[$i] = $d;
      }
      $patch = ['docs' => $docs];
      if (in_array('photo', array_column($new, 'key'), true) && ($t = thumb_in($in)) !== '') $patch['photo_thumb'] = $t;
      return $kind === 'trainer'
        ? set_trainer_status($row, 'submitted', 'Resubmitted with corrected documents', '', $patch, null)
        : set_student_status($row, 'submitted', 'Resubmitted with corrected documents', '', $patch, null);
    });
  } catch (Throwable $e) { discard_new_files(); throw $e; }
  return $kind === 'trainer' ? track_payload_trainer($row) : track_payload_student($row);
}

/* ---------- Certificate verification ---------- */

function h_verify(array $in): array {
  rate_check('verify:' . client_ip(), 120, 3600);
  rate_add('verify:' . client_ip());
  $no = strtoupper(str_in($in, 'no', 60));
  $s = $no === '' ? null : one("SELECT s.*, b.start_date, b.end_date FROM students s LEFT JOIN batches b ON b.id = s.batch_id
    WHERE s.cert_no = :no AND s.status = 'certified'", [':no' => $no]);
  if (!$s) return ['valid' => false];
  $res = jd($s['result'], []);
  $cert = jd($s['cert'], []);
  return ['valid' => true, 'certNo' => $s['cert_no'], 'name' => $s['name'], 'id' => $s['id'], 'skillId' => $s['skill_id'],
    'course' => course_name($s['skill_id']), 'centreId' => $s['centre_id'], 'centre' => centre_name($s['centre_id']),
    'grade' => $res['grade'] ?? '—', 'issuedAt' => $cert['issuedAt'] ?? null];
}

/* ---------- Files ---------- */

/** Uploaded documents. Notice attachments are public; everything else is for staff with a reason to see it. */
function h_doc(array $in): never {
  $d = one('SELECT * FROM documents WHERE id = :id', [':id' => str_in($in, 'id', 120)]);
  if (!$d) fail('This file is not available.', 404);
  if ($d['owner_type'] === 'notice' || $d['owner_type'] === 'recruitment') {
    $table = $d['owner_type'] === 'notice' ? 'notices' : 'recruitments';
    if (!me() && !val("SELECT 1 FROM $table WHERE attach_doc_id = :id AND active", [':id' => $d['id']])) fail('This file is not available.', 404);
  } else {
    $me = require_staff();
    if (!staff_may_see_owner($me, $d['owner_type'], $d['owner_id'])) fail('Your role does not allow this file.', 403);
  }
  audit('view-document', $d['id']);
  send_file(storage_dir() . '/' . $d['path'], $d['mime'], $d['name'], !empty($in['download']));
}

/** Whether an officer may open a person's documents or photo. Follows the same limits as the lists they see. */
function staff_may_see_owner(array $me, string $type, string $id): bool {
  $centre = $me['centreId'];
  if ($type === 'student') {
    return match ($me['role']) {
      'centre' => (bool)val("SELECT 1 FROM students WHERE id = :id AND (status = 'approved' OR " . ($centre !== '' ? 'centre_id = :c' : 'centre_id IS NOT NULL') . ')',
        $centre !== '' ? [':id' => $id, ':c' => $centre] : [':id' => $id]),
      'training' => (bool)val('SELECT 1 FROM students WHERE id = :id AND batch_id IS NOT NULL', [':id' => $id]),
      default => true,
    };
  }
  if ($type === 'trainer') {
    if ($me['role'] !== 'centre' || $centre === '') return true;
    return (bool)val('SELECT 1 FROM batches WHERE trainer_id = :id AND centre_id = :c', [':id' => $id, ':c' => $centre]);
  }
  return false;
}

function h_photo(array $in): never {
  $me = require_staff();
  $kind = str_in($in, 'kind') === 'trainer' ? 'trainer' : 'student';
  $id = str_in($in, 'id', 60);
  if (!staff_may_see_owner($me, $kind, $id)) fail('Not allowed.', 403);
  $thumb = val("SELECT photo_thumb FROM {$kind}s WHERE id = :id", [':id' => $id]);
  if (!$thumb) fail('No photo.', 404);
  header('Content-Type: image/jpeg');
  header('X-Content-Type-Options: nosniff');
  header('Cache-Control: private, max-age=86400');
  echo base64_decode(substr($thumb, 23));
  exit;
}
