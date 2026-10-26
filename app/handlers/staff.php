<?php
// Staff endpoints: login, the data officers work with, and every step of the application workflow.
// Each handler checks the officer's role and the record's current status before changing anything.
declare(strict_types=1);

function h_login(array $in): array { return ['me' => login(str_in($in, 'u', 60), (string)($in['p'] ?? ''))]; }
function h_logout(array $in): array { logout(); return ['ok' => true]; }
function h_me(array $in): array { return ['me' => me()]; }

/** Everything an officer's screens need, limited to their centre for Centre Managers. */
function h_staff_data(array $in): array {
  $me = require_staff();
  $centre = $me['role'] === 'centre' ? $me['centreId'] : null;
  $sw = $centre ? 'WHERE centre_id = :c' : '';
  $p = $centre ? [':c' => $centre] : [];
  $out = [
    'me' => $me,
    'students' => array_map('map_student', all("SELECT * FROM students $sw ORDER BY created_at DESC", $p)),
    'batches' => $centre ? load_batches('b.centre_id = :c', $p) : load_batches(),
    'trainers' => array_map('map_trainer', all($centre
      ? 'SELECT * FROM trainers WHERE id IN (SELECT trainer_id FROM batches WHERE centre_id = :c) ORDER BY created_at DESC'
      : 'SELECT * FROM trainers ORDER BY created_at DESC', $p)),
    'ojt' => array_map('map_ojt', all($centre
      ? 'SELECT o.* FROM ojt_letters o JOIN students s ON s.id = o.student_id WHERE s.centre_id = :c ORDER BY o.created_at DESC'
      : 'SELECT * FROM ojt_letters ORDER BY created_at DESC', $p)),
    'notices' => array_map('map_notice', all(NOTICE_SQL . ' ORDER BY n.notice_date DESC, n.created_at DESC')),
    'courses' => array_map('map_course', all('SELECT * FROM courses ORDER BY id')),
    'sectors' => array_map('map_sector', all('SELECT * FROM sectors ORDER BY id')),
    'centres' => array_map('map_centre', all('SELECT * FROM centres ORDER BY id')),
    'ext' => ext_items(),
  ];
  if (can($me, 'monitoring')) $out['notifs'] = array_map('map_notif', all('SELECT * FROM notifications ORDER BY at DESC LIMIT 300'));
  if ($me['role'] === 'admin') {
    $out['users'] = array_map('map_user', all('SELECT * FROM users ORDER BY role, id'));
    $out['settings'] = settings_all();
  }
  return $out;
}

/** Student IDs from a request, checked for format. */
function ids_in(array $in, string $key = 'ids'): array {
  $ids = array_values(array_unique(array_filter((array)($in[$key] ?? []), fn($x) => is_string($x) && valid_id($x))));
  if (!$ids) fail('Select at least one candidate.');
  return $ids;
}

/* ---------- Applications ---------- */

function h_app_action(array $in): array {
  $act = str_in($in, 'act');
  $remark = str_in($in, 'remark', 500);
  if (in_array($act, ['reject', 'return', 'notselect'], true) && $remark === '') fail('Add a remark explaining the reason.');
  tx(function () use ($in, $act, $remark) {
    $s = student_row(str_in($in, 'id', 60));
    $me = me();
    $docs = jd($s['docs'], []);
    $score = isset($in['score']) && $in['score'] !== '' && $in['score'] !== null ? (float)$in['score'] : null;
    if ($score !== null && ($score < 0 || $score > 100)) fail('The aptitude score must be between 0 and 100.');
    switch ($act) {
      case 'verify':
        require_staff('dealing'); need_status($s, 'submitted');
        if (in_array('rejected', array_column($docs, 'status'), true)) fail('A document is marked incorrect. Return the application instead.');
        set_student_status($s, 'verified', 'Documents verified', $remark, ['docs' => array_map(fn($d) => ['status' => 'ok'] + $d, $docs)]);
        break;
      case 'return':
        require_staff('dealing'); need_status($s, 'submitted');
        set_student_status($s, 'returned', 'Returned for correction', $remark);
        break;
      case 'reject':
        if (!(can($me, 'dealing') && $s['status'] === 'submitted') && !(can($me, 'supervising') && $s['status'] === 'verified')) {
          fail('This application cannot be rejected at its current stage by your role.', 403);
        }
        set_student_status($s, 'rejected', 'Application rejected', $remark);
        break;
      case 'select':
        require_staff('training'); need_status($s, 'admit');
        set_student_status($s, 'selected', 'Selected after aptitude test', $remark, ['score' => $score, 'skill_id' => $s['pref1']]);
        break;
      case 'notselect':
        require_staff('training'); need_status($s, 'admit');
        set_student_status($s, 'notselected', 'Not selected', $remark, ['score' => $score]);
        break;
      default:
        fail('Unknown action.');
    }
  });
  return ['ok' => true];
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

function h_issue_admit(array $in): array {
  $me = require_staff('supervising');
  $ids = ids_in($in);
  $date = str_in($in, 'date', 10);
  $time = str_in($in, 'time', 40);
  $venue = str_in($in, 'venue', 200);
  if (!valid_date($date) || $date < today()) fail('Choose a test date from today onwards.');
  if ($time === '' || $venue === '') fail('Fill in the reporting time and venue.');
  $n = tx(function () use ($ids, $date, $time, $venue, $me) {
    $n = 0;
    foreach ($ids as $id) {
      $s = student_row($id);
      if ($s['status'] !== 'verified') continue;
      $no = 'ADM-' . year() . '-' . pad(next_number('admit-' . year()));
      set_student_status($s, 'admit', 'Admit card issued', 'Test on ' . fmt_d($date) . " at $venue",
        ['admit_no' => $no, 'admit' => ['no' => $no, 'date' => $date, 'time' => $time, 'venue' => $venue, 'issuedAt' => now_iso(), 'by' => $me['name']]]);
      $n++;
    }
    return $n;
  });
  return ['issued' => $n];
}

/* ---------- Batches ---------- */

function trainer_clash(string $tid, string $start, string $end, ?string $except = null): ?array {
  return one("SELECT id, end_date FROM batches WHERE trainer_id = :t AND status <> 'completed' AND start_date <= :e AND :s <= end_date AND id <> :x LIMIT 1",
    [':t' => $tid, ':s' => $start, ':e' => $end, ':x' => $except ?? '']);
}
function eligible_trainer(string $tid, string $courseId): array {
  $t = trainer_row($tid);
  if ($t['status'] !== 'empanelled' || !in_array($courseId, pg_arr($t['courses']), true)) fail('Only empanelled trainers for this skill can be assigned.');
  return $t;
}

function h_create_batch(array $in): array {
  $me = require_staff('training');
  $course = require_course(str_in($in, 'course', 40));
  $centre = one('SELECT * FROM centres WHERE id = :id AND active', [':id' => str_in($in, 'centre', 40)]);
  if (!$centre) fail('Choose a training centre.');
  if (!in_array($course['sector_id'], pg_arr($centre['sectors']), true)) fail('This centre does not offer the course’s sector.');
  $cap = (int)($in['cap'] ?? 0);
  $start = str_in($in, 'start', 10);
  $end = str_in($in, 'end', 10);
  $ids = ids_in($in);
  if ($cap < 1 || $cap > 500) fail('Enter a capacity between 1 and 500.');
  if (count($ids) > $cap) fail('You picked ' . count($ids) . " trainees but capacity is $cap.");
  if (!valid_date($start) || !valid_date($end) || $end <= $start) fail('End date must be after the start date.');
  $tid = str_in($in, 'trainerId', 60);

  $id = tx(function () use ($me, $course, $centre, $cap, $start, $end, $ids, $tid) {
    $trainer = null;
    if ($tid !== '') {
      $trainer = eligible_trainer($tid, $course['id']);
      if ($c = trainer_clash($tid, $start, $end)) fail("The chosen trainer is busy with {$c['id']} on those dates. Pick another or assign later.");
    }
    $code = preg_replace('/^SKL-/', '', $course['id']);
    $id = 'BAT-' . year() . '-' . $code . '-' . pad(next_number('batch-' . year() . '-' . $code), 3);
    $log = $trainer ? [['at' => now_iso(), 'by' => $me['name'], 'trainerId' => $tid, 'action' => 'Trainer assigned']] : [];
    q('INSERT INTO batches(id, course_id, centre_id, start_date, end_date, trainer_id, capacity, trainer_log, created_by)
       VALUES (:id,:co,:ce,:s,:e,:t,:cap,:log,:by)', [':id' => $id, ':co' => $course['id'], ':ce' => $centre['id'], ':s' => $start, ':e' => $end,
      ':t' => $trainer ? $tid : null, ':cap' => $cap, ':log' => json_encode($log, JSON_UNESCAPED_UNICODE), ':by' => $me['name']]);
    $batch = ['id' => $id, 'courseId' => $course['id'], 'centreId' => $centre['id'], 'start' => $start, 'end' => $end];
    if ($trainer) notify(map_trainer($trainer), 'assigned', ['batch' => $batch, 'subject' => 'Batch assignment']);
    foreach ($ids as $sid) {
      $s = student_row($sid);
      if ($s['status'] !== 'selected' || $s['skill_id'] !== $course['id']) fail("$sid is not a selected candidate for this course.", 409);
      set_student_status($s, 'batched', "Allotted to batch $id", "{$centre['name']} ({$centre['id']})",
        ['batch_id' => $id, 'centre_id' => $centre['id'], 'skill_id' => $course['id']], 'same', ['batchStart' => $start]);
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
function own_centre_only(array $me, array $batch): void {
  if ($me['role'] === 'centre' && $batch['centre_id'] !== $me['centreId']) fail('This batch belongs to another centre.', 403);
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
    if ($me['role'] === 'centre' && $s['centre_id'] !== $me['centreId']) fail('This trainee belongs to another centre.', 403);
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
    notify(map_student($s), 'ojt', ['letterNo' => $o['letter_no'], 'employer' => $o['employer']]);
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
