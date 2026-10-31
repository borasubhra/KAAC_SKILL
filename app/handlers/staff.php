<?php
// Staff endpoints: login, the data officers work with, and every step of the application workflow.
// Each handler checks the officer's role and the record's current status before changing anything.
declare(strict_types=1);

function h_login(array $in): array { return ['me' => login(str_in($in, 'u', 60), (string)($in['p'] ?? ''))]; }
function h_logout(array $in): array { logout(); return ['ok' => true]; }
function h_me(array $in): array { return ['me' => me(), 'student' => applicant()]; }

/**
 * Everything an officer's screens need. Each role gets only the applications its stage deals with:
 * Centre Managers see selected candidates (CR-07), Training Managers only candidates in batches (CR-08).
 * A Centre Manager linked to one centre sees only that centre.
 */
function h_staff_data(array $in): array {
  $me = require_staff();
  $role = $me['role'];
  $centre = $role === 'centre' && $me['centreId'] !== '' ? $me['centreId'] : null;
  $p = $centre ? [':c' => $centre] : [];
  $studentWhere = match (true) {
    $role === 'centre' && $centre !== null => "status = 'approved' OR centre_id = :c",
    $role === 'centre' => "status IN ('approved','allocated','batched','training','passed','failed','certified')",
    $role === 'training' => 'batch_id IS NOT NULL',
    default => 'true',
  };
  $out = [
    'me' => $me,
    'students' => array_map('map_student', all("SELECT * FROM students WHERE $studentWhere ORDER BY created_at DESC", $p)),
    'batches' => $centre ? load_batches('b.centre_id = :c', $p) : load_batches(),
    'trainers' => array_map('map_trainer', all($centre
      ? 'SELECT * FROM trainers WHERE id IN (SELECT trainer_id FROM batches WHERE centre_id = :c) ORDER BY created_at DESC'
      : 'SELECT * FROM trainers ORDER BY created_at DESC', $p)),
    'ojt' => array_map('map_ojt', all($centre
      ? 'SELECT o.* FROM ojt_letters o JOIN students s ON s.id = o.student_id WHERE s.centre_id = :c ORDER BY o.created_at DESC'
      : 'SELECT * FROM ojt_letters ORDER BY created_at DESC', $p)),
    'notices' => array_map('map_notice', all(NOTICE_SQL . ' ORDER BY n.notice_date DESC, n.created_at DESC')),
    'recruitments' => array_map('map_recruitment', all(RECRUITMENT_SQL . ' ORDER BY r.last_date DESC, r.created_at DESC')),
    'courses' => array_map('map_course', all('SELECT * FROM courses ORDER BY id')),
    'sectors' => array_map('map_sector', all('SELECT * FROM sectors ORDER BY id')),
    'centres' => array_map('map_centre', all('SELECT * FROM centres ORDER BY id')),
    'ext' => ext_items(),
    'maxBatchSize' => max_batch_size(),
  ];
  if (can($me, 'supervising')) $out['notifs'] = array_map('map_notif', all('SELECT * FROM notifications ORDER BY at DESC LIMIT 300'));
  if ($role === 'admin') {
    $out['users'] = array_map('map_user', all('SELECT * FROM users ORDER BY role, id'));
    $out['settings'] = settings_all();
  }
  return $out;
}

/** Most trainees in one batch (CR-07): 45 unless the administrator changes it in Settings. */
function max_batch_size(): int {
  $n = (int)(settings_all()['maxBatchSize'] ?? 45);
  return $n > 0 ? $n : 45;
}

/** Student IDs from a request, checked for format. */
function ids_in(array $in, string $key = 'ids'): array {
  $ids = array_values(array_unique(array_filter((array)($in[$key] ?? []), fn($x) => is_string($x) && valid_id($x))));
  if (!$ids) fail('Select at least one candidate.');
  return $ids;
}

/* ---------- Applications: verify, shortlist, approve (CR-03 to CR-05) ---------- */

/** What each action needs: the role allowed, the status it starts from, the new status and the history text. */
const APP_ACTIONS = [
  'verify' => ['dealing', 'submitted', 'verified', 'Documents verified and forwarded to the S&M Officer'],
  'return' => ['dealing', 'submitted', 'returned', 'Returned to the applicant for correction'],
  'returnda' => ['supervising', 'verified', 'submitted', 'Returned to the Dealing Assistant by the S&M Officer'],
  'reject' => ['dealing', 'submitted', 'rejected', 'Application rejected'],
  'shortlist' => ['supervising', 'verified', 'shortlisted', 'Shortlisted and forwarded to the Joint Secretary'],
  'notshortlist' => ['supervising', 'verified', 'notshortlisted', 'Not shortlisted'],
  'returnsm' => ['jts', 'shortlisted', 'verified', 'Returned to the S&M Officer by the Joint Secretary'],
  'approve' => ['jts', 'shortlisted', 'approved', 'Approved by the Joint Secretary'],
  'notapprove' => ['jts', 'shortlisted', 'notapproved', 'Not approved by the Joint Secretary'],
];
const REMARK_REQUIRED = ['return', 'returnda', 'returnsm', 'reject', 'notshortlist', 'notapprove'];
// Sent back to an earlier officer: the applicant is not notified and does not see the remark.
const INTERNAL_RETURNS = ['returnda', 'returnsm'];

function app_action_on(array $s, string $act, string $remark): void {
  [$role, $from, $to, $text] = APP_ACTIONS[$act];
  require_staff($role);
  need_status($s, $from);
  $patch = [];
  if ($act === 'verify') {
    $docs = jd($s['docs'], []);
    if (in_array('rejected', array_column($docs, 'status'), true)) fail('A document is marked incorrect. Return the application instead.');
    $patch['docs'] = array_map(fn($d) => ['status' => 'ok'] + $d, $docs);
  }
  if ($act === 'approve') {
    $patch['skill_id'] = $s['pref1'];
    $patch['approved_at'] = now_iso();
  }
  if (in_array($act, INTERNAL_RETURNS, true)) {
    set_student_status($s, $to, $text, $remark, $patch, null, [], true);
    return;
  }
  set_student_status($s, $to, $text, $remark, $patch, 'same', $act === 'approve' ? ['subject' => 'You have been selected'] : []);
}

function h_app_action(array $in): array {
  $act = str_in($in, 'act');
  $remark = str_in($in, 'remark', 500);
  if (!isset(APP_ACTIONS[$act])) fail('Unknown action.');
  if (in_array($act, REMARK_REQUIRED, true) && $remark === '') fail('Add a remark explaining the reason.');
  tx(fn() => app_action_on(student_row(str_in($in, 'id', 60)), $act, $remark));
  return ['ok' => true];
}

/**
 * The same action on many applications at once, e.g. the Joint Secretary approving a whole shortlist.
 * Applications that have already moved on are skipped and counted.
 */
function h_bulk_action(array $in): array {
  $act = str_in($in, 'act');
  $remark = str_in($in, 'remark', 500);
  if (!in_array($act, ['verify', 'shortlist', 'approve'], true)) fail('This action cannot be done in bulk.');
  require_staff(APP_ACTIONS[$act][0]);
  $ids = ids_in($in);
  return tx(function () use ($ids, $act, $remark) {
    $done = 0;
    $skipped = [];
    foreach ($ids as $id) {
      $s = student_row($id);
      if ($s['status'] !== APP_ACTIONS[$act][1] || ($act === 'verify' && in_array('rejected', array_column(jd($s['docs'], []), 'status'), true))) {
        $skipped[] = $id;
        continue;
      }
      app_action_on($s, $act, $remark);
      $done++;
    }
    return ['done' => $done, 'skipped' => $skipped];
  });
}

function need_status(array $row, string ...$allowed): void {
  if (!in_array($row['status'], $allowed, true)) fail('This record has already moved on. Refresh to see its current status.', 409);
}

/** Marks one uploaded document OK or incorrect during verification. */
function h_mark_doc(array $in): array {
  require_staff('dealing');
  $status = str_in($in, 'status');
  if (!in_array($status, ['ok', 'rejected'], true)) fail('Unknown document status.');
  $kind = str_in($in, 'kind') === 'trainer' ? 'trainer' : 'student';
  tx(function () use ($in, $kind, $status) {
    $row = $kind === 'trainer' ? trainer_row(str_in($in, 'id', 60)) : student_row(str_in($in, 'id', 60));
    need_status($row, 'submitted');
    $key = str_in($in, 'key', 30);
    $docs = array_map(fn($d) => $d['key'] === $key ? ['status' => $status] + $d : $d, jd($row['docs'], []));
    q("UPDATE {$kind}s SET docs = :d, updated_at = now() WHERE id = :id", [':d' => json_encode($docs, JSON_UNESCAPED_UNICODE), ':id' => $row['id']]);
  });
  return ['ok' => true];
}

/* ---------- Centre allocation and batches (CR-07) ---------- */

function centre_row(string $id, ?array $me = null): array {
  $c = one('SELECT * FROM centres WHERE id = :id AND active', [':id' => $id]);
  if (!$c) fail('Choose a training centre.');
  if ($me && $me['role'] === 'centre' && $me['centreId'] !== '' && $me['centreId'] !== $c['id']) fail('You manage a different centre.', 403);
  return $c;
}

/** Allots selected candidates to a centre. Candidates not yet in a batch can be moved to another centre. */
function h_allocate(array $in): array {
  $me = require_staff('centre');
  $ids = ids_in($in);
  return tx(function () use ($in, $me, $ids) {
    $c = centre_row(str_in($in, 'centre', 40), $me);
    $sectors = pg_arr($c['sectors']);
    $done = 0;
    foreach ($ids as $id) {
      $s = student_row($id);
      need_status($s, 'approved', 'allocated');
      if ($s['centre_id'] === $c['id']) continue;
      $course = require_course($s['skill_id'], false);
      if (!in_array($course['sector_id'], $sectors, true)) fail("{$c['name']} does not offer {$course['name']} ($id).");
      set_student_status($s, 'allocated', "Allotted to {$c['name']} ({$c['id']})", '', ['centre_id' => $c['id']]);
      $done++;
    }
    return ['done' => $done];
  });
}

function trainer_clash(string $tid, string $start, string $end, ?string $except = null): ?array {
  return one("SELECT id, end_date FROM batches WHERE trainer_id = :t AND status <> 'completed' AND start_date <= :e AND :s <= end_date AND id <> :x LIMIT 1",
    [':t' => $tid, ':s' => $start, ':e' => $end, ':x' => $except ?? '']);
}
function eligible_trainer(string $tid, string $courseId): array {
  $t = trainer_row($tid);
  if ($t['status'] !== 'empanelled') fail('Only empanelled trainers can be assigned.');
  return $t;
}

/**
 * Forms a batch of candidates allotted to one centre for one trade.
 * Size is limited to the batch maximum (45) and to what the centre can hold.
 */
function h_create_batch(array $in): array {
  $me = require_staff('centre');
  $course = require_course(str_in($in, 'course', 40));
  $start = str_in($in, 'start', 10);
  $end = str_in($in, 'end', 10);
  $ids = ids_in($in);
  if (!valid_date($start) || !valid_date($end) || $end <= $start) fail('End date must be after the start date.');
  if ($start < today()) fail('Choose a start date from today onwards.');

  $id = tx(function () use ($in, $me, $course, $start, $end, $ids) {
    $centre = centre_row(str_in($in, 'centre', 40), $me);
    $limit = min(max_batch_size(), (int)$centre['capacity']);
    if ($limit < 1) fail("Set the capacity of {$centre['name']} in the centre master first.");
    if (count($ids) > $limit) fail('A batch at ' . $centre['name'] . " can take at most $limit trainees. You picked " . count($ids) . '.');
    $code = preg_replace('/^SKL-/', '', $course['id']);
    $id = 'BAT-' . year() . '-' . $code . '-' . pad(next_number('batch-' . year() . '-' . $code), 3);
    q('INSERT INTO batches(id, course_id, centre_id, start_date, end_date, capacity, created_by) VALUES (:id,:co,:ce,:s,:e,:cap,:by)',
      [':id' => $id, ':co' => $course['id'], ':ce' => $centre['id'], ':s' => $start, ':e' => $end, ':cap' => $limit, ':by' => $me['name']]);
    foreach ($ids as $sid) {
      $s = student_row($sid);
      if ($s['status'] !== 'allocated' || $s['centre_id'] !== $centre['id'] || $s['skill_id'] !== $course['id']) {
        fail("$sid is not a candidate allotted to this centre for this trade.", 409);
      }
      set_student_status($s, 'batched', "Placed in batch $id", "{$centre['name']} ({$centre['id']})", ['batch_id' => $id], 'same', ['batchStart' => $start]);
    }
    audit('batch:create', $id, ['students' => $ids]);
    return $id;
  });
  return ['id' => $id];
}

function batch_row(string $id): array {
  $b = one('SELECT * FROM batches WHERE id = :id FOR UPDATE', [':id' => $id]);
  if (!$b) fail('Batch not found.', 404);
  return $b;
}
/** A Centre Manager linked to one centre may act only on that centre; one with no centre manages all. */
function own_centre_only(array $me, array $batch): void {
  if ($me['role'] === 'centre' && $me['centreId'] !== '' && $batch['centre_id'] !== $me['centreId']) fail('This batch belongs to another centre.', 403);
}

function h_start_batch(array $in): array {
  $me = require_staff('training', 'centre');
  tx(function () use ($in, $me) {
    $b = batch_row(str_in($in, 'id', 60));
    own_centre_only($me, $b);
    if ($b['status'] !== 'planned') fail('This batch has already started.', 409);
    if (!$b['trainer_id']) fail('Assign a trainer before starting the batch.');
    q("UPDATE batches SET status = 'ongoing', started_at = now() WHERE id = :id", [':id' => $b['id']]);
    foreach (all("SELECT id FROM students WHERE batch_id = :b AND status = 'batched'", [':b' => $b['id']]) as $r) {
      set_student_status(student_row($r['id']), 'training', 'Training started', "Batch {$b['id']}");
    }
    audit('batch:start', $b['id']);
  });
  return ['ok' => true];
}

function batch_info(array $b): array {
  return ['id' => $b['id'], 'courseId' => $b['course_id'], 'centreId' => $b['centre_id'], 'start' => $b['start_date'], 'end' => $b['end_date']];
}

function h_assign_trainer(array $in): array {
  $me = require_staff('training');
  tx(function () use ($in, $me) {
    $b = batch_row(str_in($in, 'bid', 60));
    if ($b['status'] === 'completed') fail('This batch is already completed.', 409);
    $tid = str_in($in, 'tid', 60);
    if ($tid === $b['trainer_id']) return;
    $t = eligible_trainer($tid, $b['course_id']);
    if ($c = trainer_clash($tid, $b['start_date'], $b['end_date'], $b['id'])) fail("This trainer is busy with {$c['id']} on those dates.");
    $prev = $b['trainer_id'];
    $log = jd($b['trainer_log'], []);
    $log[] = ['at' => now_iso(), 'by' => $me['name'], 'trainerId' => $tid, 'action' => $prev ? 'Trainer changed' : 'Trainer assigned'];
    q('UPDATE batches SET trainer_id = :t, trainer_log = :l WHERE id = :id', [':t' => $tid, ':l' => json_encode($log, JSON_UNESCAPED_UNICODE), ':id' => $b['id']]);
    if ($prev) notify(map_trainer(trainer_row($prev, false)), 'released', ['batch' => batch_info($b), 'subject' => 'Batch assignment withdrawn']);
    notify(map_trainer($t), 'assigned', ['batch' => batch_info($b), 'subject' => 'Batch assignment']);
    audit('batch:assign-trainer', $b['id'], ['trainer' => $tid, 'previous' => $prev]);
  });
  return ['ok' => true];
}

function h_unassign_trainer(array $in): array {
  $me = require_staff('training');
  tx(function () use ($in, $me) {
    $b = batch_row(str_in($in, 'bid', 60));
    $prev = $b['trainer_id'];
    if (!$prev) return;
    if ($b['status'] === 'completed') fail('This batch is already completed.', 409);
    $log = jd($b['trainer_log'], []);
    $log[] = ['at' => now_iso(), 'by' => $me['name'], 'trainerId' => $prev, 'action' => 'Trainer removed'];
    q('UPDATE batches SET trainer_id = NULL, trainer_log = :l WHERE id = :id', [':l' => json_encode($log, JSON_UNESCAPED_UNICODE), ':id' => $b['id']]);
    notify(map_trainer(trainer_row($prev, false)), 'released', ['batch' => batch_info($b), 'subject' => 'Batch assignment withdrawn']);
    audit('batch:remove-trainer', $b['id'], ['trainer' => $prev]);
  });
  return ['ok' => true];
}

/* ---------- Trainers ---------- */

function h_trainer_action(array $in): array {
  $act = str_in($in, 'act');
  $remark = str_in($in, 'remark', 500);
  if (in_array($act, ['reject', 'return', 'inactive'], true) && $remark === '') fail('Add a remark explaining the reason.');
  tx(function () use ($in, $act, $remark) {
    $t = trainer_row(str_in($in, 'id', 60));
    $me = me();
    $docs = jd($t['docs'], []);
    switch ($act) {
      case 'verify':
        require_staff('dealing'); need_status($t, 'submitted');
        if (in_array('rejected', array_column($docs, 'status'), true)) fail('A document is marked incorrect. Return the registration instead.');
        set_trainer_status($t, 'verified', 'Documents verified', $remark, ['docs' => array_map(fn($d) => ['status' => 'ok'] + $d, $docs)]);
        break;
      case 'return':
        require_staff('dealing'); need_status($t, 'submitted');
        set_trainer_status($t, 'returned', 'Returned for correction', $remark);
        break;
      case 'reject':
        if (!(can($me, 'dealing') && $t['status'] === 'submitted') && !(can($me, 'training') && $t['status'] === 'verified')) {
          fail('This registration cannot be rejected at its current stage by your role.', 403);
        }
        set_trainer_status($t, 'rejected', 'Registration rejected', $remark);
        break;
      case 'empanel':
        require_staff('training'); need_status($t, 'verified');
        $no = $t['empanel_no'] ?: 'KAAC-SDE-EMP-' . year() . '-' . pad(next_number('empanel-' . year()));
        set_trainer_status($t, 'empanelled', 'Empanelled as trainer', $remark, ['empanel_no' => $no, 'empanelled_at' => now_iso()]);
        break;
      case 'inactive':
        require_staff('training'); need_status($t, 'empanelled');
        if (val("SELECT 1 FROM batches WHERE trainer_id = :t AND status <> 'completed'", [':t' => $t['id']])) fail('Reassign this trainer’s active batches first.');
        set_trainer_status($t, 'inactive', 'Marked inactive', $remark);
        break;
      case 'reactivate':
        require_staff('training'); need_status($t, 'inactive');
        set_trainer_status($t, 'empanelled', 'Reactivated', $remark);
        break;
      default:
        fail('Unknown action.');
    }
  });
  return ['ok' => true];
}

/* ---------- Results, certificates, OJT letters ---------- */

function h_save_results(array $in): array {
  $me = require_staff('centre');
  tx(function () use ($in, $me) {
    $b = batch_row(str_in($in, 'bid', 60));
    own_centre_only($me, $b);
    if ($b['status'] !== 'ongoing') fail('Results can only be recorded for a batch in training.', 409);
    $rows = [];
    foreach ((array)($in['rows'] ?? []) as $r) if (is_array($r) && isset($r['sid'])) $rows[(string)$r['sid']] = $r;
    $students = all('SELECT id FROM students WHERE batch_id = :b', [':b' => $b['id']]);
    foreach ($students as $s) {
      $r = $rows[$s['id']] ?? null;
      if (!$r || !is_numeric($r['att'] ?? null) || !is_numeric($r['marks'] ?? null)) fail('Enter attendance and marks for every trainee.');
      if ($r['att'] < 0 || $r['att'] > 100 || $r['marks'] < 0 || $r['marks'] > 100) fail('Attendance and marks must be between 0 and 100.');
    }
    foreach ($students as $s) {
      $a = (float)$rows[$s['id']]['att'];
      $m = (float)$rows[$s['id']]['marks'];
      $pass = $a >= 70 && $m >= 50;
      $grade = $m >= 85 ? 'A+' : ($m >= 70 ? 'A' : ($m >= 60 ? 'B' : ($m >= 50 ? 'C' : '—')));
      $row = student_row($s['id']);
      if ($row['status'] !== 'training') continue;
      set_student_status($row, $pass ? 'passed' : 'failed', $pass ? 'Passed final assessment' : 'Did not pass final assessment', "Attendance {$a}%, marks $m",
        ['result' => ['attendance' => $a, 'marks' => $m, 'grade' => $grade, 'result' => $pass ? 'Pass' : 'Fail', 'by' => $me['name'], 'at' => now_iso()]]);
    }
    q("UPDATE batches SET status = 'completed', completed_at = now() WHERE id = :id", [':id' => $b['id']]);
    audit('batch:results', $b['id']);
  });
  return ['ok' => true];
}

function h_issue_certs(array $in): array {
  $me = require_staff('training');
  $ids = ids_in($in);
  $n = tx(function () use ($ids, $me) {
    $n = 0;
    foreach ($ids as $id) {
      $s = student_row($id);
      if ($s['status'] !== 'passed') continue;
      $no = 'KAAC-SDE-CERT-' . year() . '-' . pad(next_number('cert-' . year()));
      set_student_status($s, 'certified', 'Certificate generated', $no, ['cert_no' => $no, 'cert' => ['no' => $no, 'issuedAt' => now_iso(), 'by' => $me['name']]]);
      $n++;
    }
    return $n;
  });
  return ['issued' => $n];
}

function h_create_ojt(array $in): array {
  $me = require_staff('training', 'centre');
  $sid = str_in($in, 'sid', 60);
  $start = str_in($in, 'start', 10);
  $duration = str_in($in, 'duration', 20);
  $f = ['employer' => str_in($in, 'employer', 200), 'address' => str_in($in, 'address', 300), 'role' => str_in($in, 'role', 120)];
  if (in_array('', $f, true)) fail('Fill in the employer, address and OJT role.');
  if (!valid_date($start) || $start < today()) fail('Choose a start date from today onwards.');
  if (!in_array($duration, ['1 month', '2 months', '3 months', '6 months'], true)) fail('Choose a duration from the list.');
  $id = tx(function () use ($me, $sid, $start, $duration, $f) {
    $s = student_row($sid, false);
    if ($s['status'] !== 'certified') fail('Only certified trainees can be recommended.');
    if ($me['role'] === 'centre' && $me['centreId'] !== '' && $s['centre_id'] !== $me['centreId']) fail('This trainee belongs to another centre.', 403);
    $id = 'OJT' . bin2hex(random_bytes(5));
    $no = 'KAAC-SDE-OJT-' . year() . '-' . pad(next_number('ojt-' . year()));
    q('INSERT INTO ojt_letters(id, letter_no, student_id, employer, address, role, start_date, duration, requested_by, requested_role)
       VALUES (:id,:no,:s,:e,:a,:r,:st,:d,:by,:br)', [':id' => $id, ':no' => $no, ':s' => $sid, ':e' => $f['employer'], ':a' => $f['address'],
      ':r' => $f['role'], ':st' => $start, ':d' => $duration, ':by' => $me['name'], ':br' => ROLES[$me['role']]]);
    audit('ojt:create', $id, ['student' => $sid]);
    return $id;
  });
  return ['id' => $id];
}

function h_sign_ojt(array $in): array {
  $me = require_staff('jts');
  rate_check('sign:' . $me['id'], 5, 900, 'Too many wrong passwords. Try again in 15 minutes.');
  if (!check_password($me['id'], (string)($in['password'] ?? ''))) { rate_add('sign:' . $me['id']); fail('Password is incorrect.'); }
  tx(function () use ($in, $me) {
    $o = one('SELECT * FROM ojt_letters WHERE id = :id FOR UPDATE', [':id' => str_in($in, 'id', 60)]);
    if (!$o) fail('Letter not found.', 404);
    if ($o['status'] !== 'pending') fail('This letter is already signed.', 409);
    $at = now_iso();
    // A keyed hash only the server can produce; it ties the reference to the letter's contents and signer.
    $sig = strtoupper(substr(hash_hmac('sha256', implode('|', [$o['letter_no'], $o['student_id'], $o['employer'], $o['start_date'], $me['id'], $at]), app_secret()), 0, 20));
    q("UPDATE ojt_letters SET status = 'signed', signed_at = :at, signed_by = :by, signed_by_id = :uid, sig_ref = :sig WHERE id = :id",
      [':at' => $at, ':by' => $me['name'], ':uid' => $me['id'], ':sig' => $sig, ':id' => $o['id']]);
    $s = student_row($o['student_id']);
    notify(map_student($s), 'ojt', ['letterNo' => $o['letter_no'], 'employer' => $o['employer'], 'subject' => 'Your OJT recommendation letter is ready']);
    $history = jd($s['history'], []);
    $history[] = ['at' => $at, 'by' => $me['name'], 'role' => ROLES[$me['role']], 'action' => 'OJT recommendation letter signed', 'remark' => "{$o['letter_no']} · {$o['employer']}"];
    q('UPDATE students SET history = :h, updated_at = now() WHERE id = :id', [':h' => json_encode($history, JSON_UNESCAPED_UNICODE), ':id' => $s['id']]);
    audit('ojt:sign', $o['id']);
  });
  return ['ok' => true];
}

/** One student with the photo inline, for printing admit cards and certificates. */
function h_student(array $in): array {
  $me = require_staff();
  $id = str_in($in, 'id', 60);
  if (!staff_may_see_owner($me, 'student', $id)) fail('Not allowed.', 403);
  return ['student' => map_student(student_row($id, false), 'inline')];
}

/* ---------- Skill India Digital Hub IDs ---------- */

/**
 * Records the ID that Skill India Digital Hub gave a candidate, trainer or batch, after the
 * record has been created there. Each is set by the officers who deal with that record.
 */
function h_set_sidh_id(array $in): array {
  $kind = str_in($in, 'kind');
  $id = str_in($in, 'id', 60);
  $sidh = str_in($in, 'sidhId', 60);
  if (!valid_sidh_id($sidh)) fail('Use letters, numbers, / _ . - only.');
  [$table, $col, $roles] = match ($kind) {
    'student' => ['students', 'sidh_id', ['dealing', 'supervising', 'centre', 'training']],
    'trainer' => ['trainers', 'sidh_id', ['dealing', 'training']],
    'batch' => ['batches', 'sidh_batch_id', ['centre', 'training']],
    default => fail('Unknown record type.'),
  };
  $me = require_staff(...$roles);
  if ($kind === 'batch') own_centre_only($me, one('SELECT centre_id FROM batches WHERE id = :id', [':id' => $id]) ?? fail('Batch not found.', 404));
  if ($kind === 'student' && !staff_may_see_owner($me, 'student', $id)) fail('Not allowed.', 403);
  if (q("UPDATE $table SET $col = :v WHERE id = :id", [':v' => $sidh, ':id' => $id])->rowCount() === 0) fail('Record not found.', 404);
  audit("sidh:$kind", $id, ['sidhId' => $sidh]);
  return ['ok' => true];
}
