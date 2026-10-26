<?php
// Sends email through the SMTP server set in the environment (SMTP_HOST etc.).
// Messages are queued in `notifications` and sent by app/cli/worker.php, so requests never wait on the mail server.
declare(strict_types=1);

function mail_configured(): bool { return env('SMTP_HOST', '') !== ''; }

/** Sends one plain-text email. Throws RuntimeException with the server's reply on failure. */
function smtp_send(string $to, string $subject, string $body): void {
  $host = env('SMTP_HOST', '');
  $port = (int)env('SMTP_PORT', '587');
  $secure = strtolower(env('SMTP_SECURE', 'tls'));   // tls (STARTTLS), ssl, or none
  $from = env('SMTP_FROM', 'no-reply@localhost');
  $fromName = env('SMTP_FROM_NAME', 'SDE Dept, KAAC');
  if (!filter_var($to, FILTER_VALIDATE_EMAIL)) throw new RuntimeException("Invalid address $to");

  $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true]]);
  $fp = @stream_socket_client(($secure === 'ssl' ? 'ssl://' : 'tcp://') . "$host:$port", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
  if (!$fp) throw new RuntimeException("Cannot connect to $host:$port ($errstr)");
  stream_set_timeout($fp, 20);
  try {
    smtp_expect($fp, 220);
    $me = gethostname() ?: 'localhost';
    smtp_cmd($fp, "EHLO $me", 250);
    if ($secure === 'tls') {
      smtp_cmd($fp, 'STARTTLS', 220);
      if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) throw new RuntimeException('STARTTLS failed');
      smtp_cmd($fp, "EHLO $me", 250);
    }
    if (env('SMTP_USER', '') !== '') {
      smtp_cmd($fp, 'AUTH LOGIN', 334);
      smtp_cmd($fp, base64_encode(env('SMTP_USER')), 334);
      smtp_cmd($fp, base64_encode(env('SMTP_PASS', '')), 235);
    }
    smtp_cmd($fp, "MAIL FROM:<$from>", 250);
    smtp_cmd($fp, "RCPT TO:<$to>", [250, 251]);
    smtp_cmd($fp, 'DATA', 354);
    $enc = fn($s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
    $headers = [
      'Date: ' . date('r'),
      'From: ' . $enc($fromName) . " <$from>",
      "To: <$to>",
      'Subject: ' . $enc($subject),
      'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . (substr(strrchr($from, '@'), 1) ?: 'localhost') . '>',
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
    ];
    // Base64 lines never start with '.', so no dot-stuffing is needed.
    fwrite($fp, implode("\r\n", $headers) . "\r\n\r\n" . rtrim(chunk_split(base64_encode($body), 76, "\r\n")) . "\r\n.\r\n");
    smtp_expect($fp, 250);
    smtp_cmd($fp, 'QUIT', 221);
  } finally {
    fclose($fp);
  }
}

function smtp_cmd($fp, string $line, int|array $expect): string {
  fwrite($fp, $line . "\r\n");
  return smtp_expect($fp, $expect);
}

function smtp_expect($fp, int|array $expect): string {
  $reply = '';
  while (($line = fgets($fp, 1024)) !== false) {
    $reply .= $line;
    if (strlen($line) < 4 || $line[3] !== '-') break;  // last line of a multi-line reply
  }
  $code = (int)substr($reply, 0, 3);
  if (!in_array($code, (array)$expect, true)) throw new RuntimeException('SMTP: ' . trim($reply ?: 'no reply'));
  return $reply;
}
