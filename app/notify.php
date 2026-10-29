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
  $trade = course_name($s['skillId'] ?: $s['pref1']);
  return match ($key) {
    'submitted' => "Dear $n, your application {$s['id']} for $trade has been received by SDE Dept, KAAC.",
    'returned' => "Dear $n, application {$s['id']} needs correction: " . ($x['remark'] ?: 'see portal') . '. Please log in and re-upload the documents.',
    'rejected' => "Dear $n, application {$s['id']} was not accepted. Reason: " . ($x['remark'] ?: 'see portal') . '.',
    'verified' => "Dear $n, the documents for application {$s['id']} have been verified and the application is under review.",
    'shortlisted' => "Dear $n, application {$s['id']} has been shortlisted and sent for final approval.",
    'notshortlisted' => "Dear $n, application {$s['id']} was not shortlisted this session" . ($x['remark'] ? ": {$x['remark']}" : '') . '. You may apply again in the next session.',
    'approved' => "Congratulations $n! You have been selected for training in $trade (application {$s['id']}).",
    'notapproved' => "Dear $n, application {$s['id']} was not selected this session" . ($x['remark'] ? ": {$x['remark']}" : '') . '. You may apply again in the next session.',
    'allocated' => "Dear $n, you have been allotted to " . centre_name($s['centreId']) . " [{$s['centreId']}] for training in $trade. Batch details will follow.",
    'batched' => "Dear $n, you are allotted batch {$s['batchId']} ($trade) at " . centre_name($s['centreId']) . " [{$s['centreId']}], starting " . fmt_d($x['batchStart'] ?? null) . '.',
    'training' => "Dear $n, your training in batch {$s['batchId']} has started at " . centre_name($s['centreId']) . '.',
    'passed' => "Dear $n, you have passed the assessment for $trade. Your certificate will be issued soon.",
    'failed' => "Dear $n, you did not clear the assessment for $trade. Contact your centre for re-assessment.",
    'certified' => "Dear $n, certificate {$s['cert']['no']} for $trade is issued. Download it from the portal.",
    'ojt' => "Dear $n, your OJT recommendation letter {$x['letterNo']} for {$x['employer']} has been signed by the Joint Secretary. Download it from the portal.",
    default => null,
  };
}

/** Extra paragraph the administrator sets in Settings, added to some emails (CR-02, CR-06). */
function email_extra(string $key): string {
  $st = settings_all();
  return match ($key) {
    'submitted' => trim($st['ackEmailText'] ?? ''),
    'approved' => trim($st['selectionEmailText'] ?? ''),
    default => '',
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

/** Logs the SMS and queues the email (when the person gave one) for an event. $p is a mapped student or trainer. */
function notify(array $p, string $key, array $x = []): void {
  $isTrainer = ($p['kind'] ?? '') === 'trainer';
  $body = $isTrainer ? trainer_message($p, $key, $x) : student_message($p, $key, $x);
  if ($body === null) return;
  $sms = !empty(settings_all()['smsGateway']) ? 'Queued for gateway' : 'Logged (no SMS gateway connected)';
  q('INSERT INTO notifications(ref_id, channel, to_addr, subject, body, status, event) VALUES (:r, :c, :t, :sub, :b, :st, :e)',
    [':r' => $p['id'], ':c' => 'SMS', ':t' => '+91 ' . $p['mobile'], ':sub' => '', ':b' => $body, ':st' => $sms, ':e' => $key]);
  if (!empty($p['email'])) {
    $label = ($isTrainer ? TSTATUS_LABELS : STATUS_LABELS)[$key] ?? 'Update';
    $extra = $isTrainer ? '' : email_extra($key);
    queue_email($p['id'], $p['email'], 'SDE Dept, KAAC: ' . ($x['subject'] ?? $label), $body . ($extra !== '' ? "\n\n$extra" : ''), $key);
  }
}

/** Queues an email for the mail worker, or just logs it when no mail server is configured. */
function queue_email(string $refId, string $to, string $subject, string $body, string $event): void {
  q('INSERT INTO notifications(ref_id, channel, to_addr, subject, body, status, event) VALUES (:r, :c, :t, :sub, :b, :st, :e)', [
    ':r' => $refId, ':c' => 'Email', ':t' => $to, ':sub' => $subject, ':b' => $body,
    ':st' => mail_configured() ? 'Queued' : 'Logged (no mail server configured)', ':e' => $event,
  ]);
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
const STUDENT_PATCH_COLS = ['status', 'skill_id', 'centre_id', 'batch_id', 'score', 'admit_no', 'admit', 'result', 'cert_no', 'cert', 'docs', 'photo_thumb', 'approved_at'];

/**
 * Applies a status change to a student, appends to the history and logs the notification.
 * $patch uses database column names; arrays are stored as JSON.
 */
function set_student_status(array $row, string $status, string $action, string $remark = '', array $patch = [], ?string $notifyKey = 'same', array $extra = [], bool $internal = false): array {
  $me = me();
  $history = jd($row['history'], []);
  $history[] = history_entry($me, $action, $remark, $row['name']) + ($internal ? ['internal' => true] : []);
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
