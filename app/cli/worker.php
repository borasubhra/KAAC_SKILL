<?php
// Sends queued emails. Runs as its own container (see docker-compose.yml): php app/cli/worker.php
// Pass --once to send what is queued and exit (useful for testing).
declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

const BATCH = 50;
const MAX_ATTEMPTS = 5;

$once = in_array('--once', $argv, true);
// Emails left half-sent by a worker that stopped are retried.
q("UPDATE notifications SET status = 'Queued' WHERE status = 'Sending'");
fwrite(STDOUT, '[worker] Mail worker started' . (mail_configured() ? ' (SMTP ' . env('SMTP_HOST') . ')' : ' (no SMTP_HOST: emails stay logged only)') . "\n");

while (true) {
  try {
    $sent = send_queued();
  } catch (Throwable $e) {
    fwrite(STDERR, '[worker] ' . $e->getMessage() . "\n");
    $sent = 0;
    sleep(10);
  }
  if ($once) break;
  if ($sent === 0) sleep(5);
}

/** Sends up to BATCH queued emails. Returns how many were attempted. */
function send_queued(): int {
  if (!mail_configured()) return 0;
  // SKIP LOCKED lets several workers run side by side without sending the same email twice.
  $rows = tx(function () {
    $rows = all("SELECT id, to_addr, subject, body, attempts FROM notifications
                 WHERE status = 'Queued' AND channel = 'Email' ORDER BY id LIMIT " . BATCH . ' FOR UPDATE SKIP LOCKED');
    foreach ($rows as $r) q("UPDATE notifications SET status = 'Sending', attempts = attempts + 1 WHERE id = :id", [':id' => $r['id']]);
    return $rows;
  });
  foreach ($rows as $r) {
    try {
      smtp_send($r['to_addr'], $r['subject'], $r['body'] . "\n\n— Skill Development & Entrepreneurship Department, KAAC\nThis is an automated message. Please do not reply.");
      q("UPDATE notifications SET status = 'Sent', sent_at = now(), last_error = NULL WHERE id = :id", [':id' => $r['id']]);
    } catch (Throwable $e) {
      $final = $r['attempts'] + 1 >= MAX_ATTEMPTS;
      q('UPDATE notifications SET status = :s, last_error = :e WHERE id = :id',
        [':s' => $final ? 'Failed' : 'Queued', ':e' => mb_substr($e->getMessage(), 0, 500), ':id' => $r['id']]);
      fwrite(STDERR, "[worker] Email {$r['id']} to {$r['to_addr']}: {$e->getMessage()}\n");
      if (!$final) sleep(2);
    }
  }
  return count($rows);
}
