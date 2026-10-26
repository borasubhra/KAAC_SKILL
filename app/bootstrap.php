<?php
// Shared setup for the API and the CLI scripts: configuration, database, errors and small helpers.
declare(strict_types=1);

date_default_timezone_set('Asia/Kolkata');
mb_internal_encoding('UTF-8');

const ROLES = [
  'admin' => 'System Administrator', 'dealing' => 'Dealing Assistant', 'supervising' => 'Supervising & Monitoring Officer',
  'jts' => 'Joint Secretary', 'centre' => 'Centre Manager', 'training' => 'Training Manager',
];
const QUALS = ['Class 5', 'Class 8', 'Class 10', 'Class 12', 'ITI', 'Diploma', 'Graduate', 'Post Graduate'];
// Application stages: Dealing Assistant -> S&M Officer -> Joint Secretary -> Centre Manager -> Training Manager.
const STATUS_LABELS = [
  'submitted' => 'Submitted', 'returned' => 'Returned for correction', 'rejected' => 'Rejected',
  'verified' => 'Documents verified', 'shortlisted' => 'Shortlisted', 'notshortlisted' => 'Not shortlisted',
  'approved' => 'Selected', 'notapproved' => 'Not selected', 'allocated' => 'Centre allotted',
  'batched' => 'Batch allotted', 'training' => 'In training', 'passed' => 'Passed assessment',
  'failed' => 'Not passed', 'certified' => 'Certified',
  // Earlier version only (aptitude test step), kept so old records still show a label.
  'admit' => 'Admit card issued', 'selected' => 'Selected', 'notselected' => 'Not selected',
];
/** An application in one of these states is finished; the person may apply again. */
const CLOSED_STATUSES = ['rejected', 'notshortlisted', 'notapproved', 'notselected', 'certified', 'failed'];
const TSTATUS_LABELS = [
  'submitted' => 'Submitted', 'returned' => 'Returned for correction', 'verified' => 'Documents verified',
  'empanelled' => 'Empanelled', 'rejected' => 'Rejected', 'inactive' => 'Inactive',
];
const STUDENT_DOCS = [
  'photo' => ['label' => 'Passport-size photograph', 'req' => true, 'img' => true],
  'aadhaar' => ['label' => 'Aadhaar card (copy)', 'req' => true, 'img' => false],
  'edu' => ['label' => 'Highest qualification certificate / marksheet', 'req' => true, 'img' => false],
  'prc' => ['label' => 'Residence proof (PRC / domicile)', 'req' => true, 'img' => false],
  'caste' => ['label' => 'Caste certificate (if applicable)', 'req' => false, 'img' => false],
  'income' => ['label' => 'Income certificate (if applicable)', 'req' => false, 'img' => false],
  'bank' => ['label' => 'Bank passbook first page', 'req' => false, 'img' => false],
];
// Documents required by the trainer recruitment advertisement (Nov 2026); the rest are optional.
const TRAINER_DOCS = [
  'photo' => ['label' => 'Passport-size photograph', 'req' => true, 'img' => true],
  'aadhaar' => ['label' => 'Aadhaar card (copy)', 'req' => true, 'img' => false],
  'qual' => ['label' => 'Educational qualification certificates (Class X onwards)', 'req' => true, 'img' => false],
  'caste' => ['label' => 'Tribe / caste certificate', 'req' => true, 'img' => false],
  'prc' => ['label' => 'Proof of residence in the KAAC area', 'req' => true, 'img' => false],
  'exp' => ['label' => 'Experience certificate(s), if any', 'req' => false, 'img' => false],
  'tot' => ['label' => 'Training of Trainers (ToT) certificate', 'req' => false, 'img' => false],
  'resume' => ['label' => 'Résumé / CV', 'req' => false, 'img' => false],
  'bank' => ['label' => 'Bank passbook first page (for honorarium)', 'req' => false, 'img' => false],
];

require __DIR__ . '/auth.php';
require __DIR__ . '/files.php';
require __DIR__ . '/mappers.php';
require __DIR__ . '/notify.php';
require __DIR__ . '/mail.php';

/* ---------- Configuration ---------- */

function env(string $key, ?string $default = null): ?string {
  $v = getenv($key);
  return ($v === false || $v === '') ? $default : $v;
}
function is_dev(): bool { return env('APP_ENV', 'production') === 'development'; }

function app_secret(): string {
  $s = env('APP_SECRET', '');
  if (strlen($s) < 32) throw new RuntimeException('APP_SECRET must be set to at least 32 random characters.');
  return $s;
}

/* ---------- Database ---------- */

function db(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', env('DB_HOST', 'db'), env('DB_PORT', '5432'), env('DB_NAME', 'kaac'));
    $pdo = new PDO($dsn, env('DB_USER', 'kaac'), env('DB_PASS', ''), [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec("SET TIME ZONE 'UTC'");
  }
  return $pdo;
}
function q(string $sql, array $params = []): PDOStatement {
  $st = db()->prepare($sql);
  $st->execute($params);
  return $st;
}
function one(string $sql, array $params = []): ?array { $r = q($sql, $params)->fetch(); return $r === false ? null : $r; }
function all(string $sql, array $params = []): array { return q($sql, $params)->fetchAll(); }
function val(string $sql, array $params = []): mixed { return q($sql, $params)->fetchColumn(); }

/** Runs $fn inside a transaction; rolls back and rethrows on any error. */
function tx(callable $fn): mixed {
  $pdo = db();
  if ($pdo->inTransaction()) return $fn();
  $pdo->beginTransaction();
  try { $r = $fn(); $pdo->commit(); return $r; }
  catch (Throwable $e) { $pdo->rollBack(); throw $e; }
}

/** Next value of a named counter, atomically. Rolled back with the surrounding transaction. */
function next_number(string $name): int {
  return (int)val('INSERT INTO counters(name, n) VALUES (:n, 1) ON CONFLICT (name) DO UPDATE SET n = counters.n + 1 RETURNING n', [':n' => $name]);
}
function pad(int $n, int $width = 5): string { return str_pad((string)$n, $width, '0', STR_PAD_LEFT); }
function year(): string { return date('Y'); }

/** Parses a PostgreSQL text[] value as returned by PDO. */
function pg_arr(?string $v): array {
  if ($v === null || $v === '{}' || $v === '') return [];
  return array_map(fn($x) => $x === 'NULL' ? null : $x, str_getcsv(substr($v, 1, -1), ',', '"', '\\'));
}
function to_pg_arr(array $items): string {
  return '{' . implode(',', array_map(fn($x) => '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], (string)$x) . '"', $items)) . '}';
}

/* ---------- Errors and responses ---------- */

final class ApiError extends Exception {
  public function __construct(string $message, public readonly int $status = 400) { parent::__construct($message); }
}
function fail(string $message, int $status = 400): never { throw new ApiError($message, $status); }

function json_out(mixed $data, int $status = 200): never {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
  exit;
}

/* ---------- Time ---------- */

function now_iso(): string { return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z'); }
/** Converts a PostgreSQL timestamptz string to the ISO-8601 UTC form the front end expects. */
function iso(?string $ts): ?string {
  if ($ts === null || $ts === '') return null;
  return (new DateTimeImmutable($ts))->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z');
}
function today(): string { return date('Y-m-d'); }
function fmt_d(?string $d): string { return $d ? date('d M Y', strtotime($d)) : '—'; }
function age_on(string $dob): int { return (new DateTimeImmutable($dob))->diff(new DateTimeImmutable('today'))->y; }

/* ---------- Validation ---------- */

function verhoeff_ok(string $n): bool {
  static $d = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
  static $p = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,7,6,8,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
  $c = 0;
  foreach (array_reverse(str_split($n)) as $i => $digit) $c = $d[$c][$p[$i % 8][(int)$digit]];
  return $c === 0;
}
function valid_aadhaar(string $a): bool { return (bool)preg_match('/^[2-9]\d{11}$/', $a) && verhoeff_ok($a); }
function aadhaar_hmac(string $a): string { return hash_hmac('sha256', 'aadhaar:' . $a, app_secret()); }
function valid_date(string $d): bool {
  $dt = DateTimeImmutable::createFromFormat('!Y-m-d', $d);
  return $dt !== false && $dt->format('Y-m-d') === $d;
}
/** Trimmed string field from the request, capped in length. */
function str_in(array $in, string $key, int $max = 200): string {
  $v = $in[$key] ?? '';
  if (!is_string($v) && !is_numeric($v)) return '';
  return mb_substr(trim((string)$v), 0, $max);
}
function valid_id(string $id): bool { return (bool)preg_match('/^[A-Za-z0-9-]{1,60}$/', $id); }

/* ---------- Rate limiting and audit ---------- */

/**
 * The visitor's IP address. Behind a reverse proxy listed in TRUSTED_PROXIES (IPs or CIDR ranges,
 * comma-separated), the address the proxy reports in X-Forwarded-For is used instead of the proxy's own.
 */
function client_ip(): string {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'cli';
  $trusted = array_filter(array_map('trim', explode(',', env('TRUSTED_PROXIES', ''))));
  if (!$trusted || !ip_in_any($ip, $trusted)) return $ip;
  $hops = array_reverse(array_map('trim', explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '')));
  foreach ($hops as $hop) {
    if (filter_var($hop, FILTER_VALIDATE_IP) === false) break;
    if (!ip_in_any($hop, $trusted)) return $hop;
  }
  return $ip;
}
function ip_in_any(string $ip, array $ranges): bool {
  $bin = @inet_pton($ip);
  if ($bin === false) return false;
  foreach ($ranges as $range) {
    [$net, $bits] = array_pad(explode('/', $range, 2), 2, null);
    $netBin = @inet_pton($net);
    if ($netBin === false || strlen($netBin) !== strlen($bin)) continue;
    $bits = $bits === null ? strlen($bin) * 8 : (int)$bits;
    $bytes = intdiv($bits, 8);
    $rem = $bits % 8;
    if (substr($bin, 0, $bytes) !== substr($netBin, 0, $bytes)) continue;
    if ($rem === 0 || ((ord($bin[$bytes]) ^ ord($netBin[$bytes])) & (0xFF << (8 - $rem)) & 0xFF) === 0) return true;
  }
  return false;
}

/** Fails with 429 when $bucket already has $max events in the last $window seconds. */
function rate_check(string $bucket, int $max, int $window, string $message = 'Too many attempts. Please wait a while and try again.'): void {
  if (random_int(1, 100) === 1) q("DELETE FROM rate_events WHERE at < now() - interval '1 day'");
  $n = (int)val("SELECT count(*) FROM rate_events WHERE bucket = :b AND at > now() - make_interval(secs => :w)", [':b' => $bucket, ':w' => $window]);
  if ($n >= $max) fail($message, 429);
}
function rate_add(string $bucket): void { q('INSERT INTO rate_events(bucket) VALUES (:b)', [':b' => $bucket]); }

function audit(string $action, string $target = '', array $detail = []): void {
  q('INSERT INTO audit_log(user_id, action, target, detail, ip) VALUES (:u, :a, :t, :d, :ip)', [
    ':u' => $_SESSION['uid'] ?? null, ':a' => $action, ':t' => $target,
    ':d' => json_encode($detail, JSON_UNESCAPED_UNICODE), ':ip' => client_ip(),
  ]);
}

function settings_all(): array {
  static $s = null;
  if ($s === null) {
    $row = one("SELECT data FROM settings WHERE id = 'main'");
    $s = $row ? json_decode($row['data'], true) : [];
  }
  return $s;
}
