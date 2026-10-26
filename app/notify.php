<?php
// SMS/email messages for every status change, and the helpers that apply those changes.
// Messages are logged in `notifications`; sending needs a DLT-registered SMS gateway and a mail server (see README).
declare(strict_types=1);

function course_name(?string $id): string {
  static $c = null;
  $c ??= array_column(all('SELECT id, name FROM courses'), 'name', 'id');
  return $c[$id] ?? ($id ?: '—');
}
function centre_name(?string $id): string {
  static $c = null;
  $c ??= array_column(all('SELECT id, name FROM centres'), 'name', 'id');
  return $c[$id] ?? ($id ?: '—');
}

/** Message text for a student event, mirroring the wording staff see in the SMS log. */
function student_message(array $s, string $key, array $x): ?string {
  $n = $s['name'];
  return match ($key) {
    'submitted' => "Dear $n, your application {$s['id']} for " . course_name($s['pref1']) . ' has been received by SDE Dept, KAAC. Track it on the portal with your date of birth.',
    'returned' => "Dear $n, application {$s['id']} needs correction: " . ($x['remark'] ?: 'see portal') . '. Please re-upload documents on the portal.',
    'verified' => "Dear $n, documents for application {$s['id']} have been verified. Your admit card will be issued shortly.",
    'admit' => "Dear $n, admit card {$s['admit']['no']} is issued. Aptitude test on " . fmt_d($s['admit']['date']) . " at {$s['admit']['time']}, {$s['admit']['venue']}. Download it from the portal.",
    'selected' => "Congratulations $n! You are selected for " . course_name($s['skillId'] ?: $s['pref1']) . '. Batch details will follow.',
    'notselected' => "Dear $n, you were not selected for " . course_name($s['pref1']) . ' this session. You may apply again in the next session.',
    'batched' => "Dear $n, you are allotted batch {$s['batchId']} (" . course_name($s['skillId']) . ') at ' . centre_name($s['centreId']) . " [{$s['centreId']}], starting " . fmt_d($x['batchStart'] ?? null) . '.',
    'training' => "Dear $n, your training in batch {$s['batchId']} has started at " . centre_name($s['centreId']) . '.',
    'passed' => "Dear $n, you have passed the assessment for " . course_name($s['skillId']) . '. Your certificate will be issued soon.',
    'failed' => "Dear $n, you did not clear the assessment for " . course_name($s['skillId']) . '. Contact your centre for re-assessment.',
    'certified' => "Dear $n, certificate {$s['cert']['no']} for " . course_name($s['skillId']) . ' is issued. Download it from the portal.',
    'rejected' => "Dear $n, application {$s['id']} was not accepted. Reason: " . ($x['remark'] ?: 'see portal') . '.',
    'ojt' => "Dear $n, your OJT recommendation letter {$x['letterNo']} for {$x['employer']} has been signed by the Joint Secretary. Download it from the portal.",
    default => null,
  };
}

function trainer_message(array $t, string $key, array $x): ?string {
  $n = $t['name'];
  $b = $x['batch'] ?? null;
  return match ($key) {
    'submitted' => "Dear $n, your trainer registration {$t['id']} has been received by SDE Dept, KAAC. Track it on the portal with your date of birth.",
    'returned' => "Dear $n, trainer registration {$t['id']} needs correction: " . ($x['remark'] ?: 'see portal') . '. Please re-upload documents on the portal.',
    'verified' => "Dear $n, documents for trainer registration {$t['id']} are verified. Your empanelment is under review.",
    'empanelled' => "Dear $n, you are empanelled as a trainer of SDE Dept, KAAC (No. {$t['empanelNo']}) for " . count($t['courses']) . ' skill(s). You will be informed when assigned to a batch.',
    'rejected' => "Dear $n, trainer registration {$t['id']} was not accepted. Reason: " . ($x['remark'] ?: 'see portal') . '.',
    'inactive' => "Dear $n, your trainer empanelment {$t['empanelNo']} is marked inactive. Contact the Training Manager for details.",
    'assigned' => "Dear $n, you are assigned as trainer for batch {$b['id']} (" . course_name($b['courseId']) . ') at ' . centre_name($b['centreId']) . " [{$b['centreId']}], " . fmt_d($b['start']) . ' to ' . fmt_d($b['end']) . '.',
    'released' => "Dear $n, you are no longer assigned to batch {$b['id']}. Contact the Training Manager for details.",
    default => null,
  };
}

/** Logs the SMS (and email, when the person gave one) for an event. $p is a mapped student or trainer. */
function notify(array $p, string $key, array $x = []): void {
  $isTrainer = ($p['kind'] ?? '') === 'trainer';
  $body = $isTrainer ? trainer_message($p, $key, $x) : student_message($p, $key, $x);
  if ($body === null) return;
  $st = settings_all();
  $sms = !empty($st['smsGateway']) ? 'Queued for gateway' : 'Logged (no SMS gateway connected)';
  $mail = !empty($st['emailFrom']) ? 'Queued for mail server' : 'Logged (no mail server connected)';
  $ins = 'INSERT INTO notifications(ref_id, channel, to_addr, subject, body, status, event) VALUES (:r, :c, :t, :sub, :b, :st, :e)';
  q($ins, [':r' => $p['id'], ':c' => 'SMS', ':t' => '+91 ' . $p['mobile'], ':sub' => '', ':b' => $body, ':st' => $sms, ':e' => $key]);
  if (!empty($p['email'])) {
    $label = ($isTrainer ? TSTATUS_LABELS : STATUS_LABELS)[$key] ?? 'Update';
    q($ins, [':r' => $p['id'], ':c' => 'Email', ':t' => $p['email'], ':sub' => 'SDE Dept, KAAC: ' . ($x['subject'] ?? $label), ':b' => $body, ':st' => $mail, ':e' => $key]);
  }
}

/* ---------- Status changes ---------- */

/** Loads a student row for update (locks it for the rest of the transaction). */
function student_row(string $id, bool $lock = true): array {
  $r = one('SELECT * FROM students WHERE id = :id' . ($lock ? ' FOR UPDATE' : ''), [':id' => $id]);
  if (!$r) fail('Application not found.', 404);
  return $r;
}
function trainer_row(string $id, bool $lock = true): array {
  $r = one('SELECT * FROM trainers WHERE id = :id' . ($lock ? ' FOR UPDATE' : ''), [':id' => $id]);
  if (!$r) fail('Trainer registration not found.', 404);
  return $r;
}

function history_entry(?array $me, string $action, string $remark, string $applicantName, string $applicantRole = 'Applicant'): array {
  return ['at' => now_iso(), 'by' => $me ? $me['name'] : $applicantName, 'role' => $me ? ROLES[$me['role']] : $applicantRole,
    'action' => $action, 'remark' => $remark];
}

/** Column => value updates allowed through set_student_status(). */
const STUDENT_PATCH_COLS = ['status', 'skill_id', 'centre_id', 'batch_id', 'score', 'admit_no', 'admit', 'result', 'cert_no', 'cert', 'docs', 'photo_thumb'];

/**
 * Applies a status change to a student, appends to the history and logs the notification.
 * $patch uses database column names; arrays are stored as JSON.
 */
function set_student_status(array $row, string $status, string $action, string $remark = '', array $patch = [], ?string $notifyKey = 'same', array $extra = []): array {
  $me = me();
  $history = jd($row['history'], []);
  $history[] = history_entry($me, $action, $remark, $row['name']);
  $patch['status'] = $status;
  $sets = ['history = :history', 'updated_at = now()'];
  $params = [':history' => json_encode($history, JSON_UNESCAPED_UNICODE), ':id' => $row['id']];
  foreach ($patch as $col => $v) {
    if (!in_array($col, STUDENT_PATCH_COLS, true)) throw new LogicException("Unexpected column $col");
    $sets[] = "$col = :$col";
    $params[":$col"] = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v;
  }
  $updated = one('UPDATE students SET ' . implode(', ', $sets) . ' WHERE id = :id RETURNING *', $params);
  $mapped = map_student($updated);
  $key = $notifyKey === 'same' ? $status : $notifyKey;
  if ($key !== null) notify($mapped, $key, ['remark' => $remark] + $extra);
  audit('student:' . $action, $row['id'], ['status' => $status, 'remark' => $remark]);
  return $updated;
}

const TRAINER_PATCH_COLS = ['status', 'empanel_no', 'empanelled_at', 'docs', 'photo_thumb'];

function set_trainer_status(array $row, string $status, string $action, string $remark = '', array $patch = [], ?string $notifyKey = 'same'): array {
  $me = me();
  $history = jd($row['history'], []);
  $history[] = history_entry($me, $action, $remark, $row['name'], 'Trainer');
  $patch['status'] = $status;
  $sets = ['history = :history', 'updated_at = now()'];
  $params = [':history' => json_encode($history, JSON_UNESCAPED_UNICODE), ':id' => $row['id']];
  foreach ($patch as $col => $v) {
    if (!in_array($col, TRAINER_PATCH_COLS, true)) throw new LogicException("Unexpected column $col");
    $sets[] = "$col = :$col";
    $params[":$col"] = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v;
  }
  $updated = one('UPDATE trainers SET ' . implode(', ', $sets) . ' WHERE id = :id RETURNING *', $params);
  $key = $notifyKey === 'same' ? $status : $notifyKey;
  if ($key !== null) notify(map_trainer($updated), $key, ['remark' => $remark]);
  audit('trainer:' . $action, $row['id'], ['status' => $status, 'remark' => $remark]);
  return $updated;
}
