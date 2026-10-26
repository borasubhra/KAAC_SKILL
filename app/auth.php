<?php
// Staff sessions and role checks. All permission decisions are made here, on the server.
declare(strict_types=1);

function is_https(): bool {
  return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

function start_session(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;
  session_name('kaac_sess');
  session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict', 'secure' => is_https(),
  ]);
  ini_set('session.use_strict_mode', '1');
  ini_set('session.gc_maxlifetime', '28800');
  session_start();
}

/** The logged-in officer, re-read from the database on every request so disabled accounts and role changes apply at once. */
function me(): ?array {
  static $cached = false;
  if ($cached !== false) return $cached;
  $uid = $_SESSION['uid'] ?? null;
  $u = $uid ? one('SELECT id, name, role, centre_id FROM users WHERE id = :id AND active', [':id' => $uid]) : null;
  if ($uid && !$u) unset($_SESSION['uid']);
  return $cached = $u ? ['id' => $u['id'], 'name' => $u['name'], 'role' => $u['role'], 'centreId' => $u['centre_id'] ?? ''] : null;
}

/** True when the officer has one of $roles. Administrators may do everything. */
function can(?array $me, string ...$roles): bool {
  return $me !== null && ($me['role'] === 'admin' || in_array($me['role'], $roles, true));
}

/** Returns the logged-in officer, or fails with 401/403. With no roles given, any officer passes. */
function require_staff(string ...$roles): array {
  $me = me();
  if (!$me) fail('Please log in again.', 401);
  if ($roles && !can($me, ...$roles)) fail('Your role does not allow this action.', 403);
  return $me;
}

function login(string $username, string $password): array {
  $username = strtolower(trim($username));
  $ip = client_ip();
  rate_check("login-ip:$ip", 20, 900);
  rate_check("login-user:$username", 5, 900, 'Too many failed attempts for this account. Try again in 15 minutes.');
  $u = one('SELECT id, pw_hash, active FROM users WHERE id = :id', [':id' => $username]);
  // Verify against a dummy hash for unknown users so response time does not reveal which usernames exist.
  $ok = password_verify($password, $u['pw_hash'] ?? '$2y$10$lL2nkvsyU9XmXzqZmfhrT.lfvqGTKBP7Bg4NbIE98GM5DZYaz3DBe');
  if (!$u || !$ok || !$u['active']) {
    rate_add("login-ip:$ip");
    rate_add("login-user:$username");
    fail('Username or password is incorrect, or the account is disabled.', 401);
  }
  if (password_needs_rehash($u['pw_hash'], PASSWORD_DEFAULT)) {
    q('UPDATE users SET pw_hash = :h WHERE id = :id', [':h' => password_hash($password, PASSWORD_DEFAULT), ':id' => $u['id']]);
  }
  session_regenerate_id(true);
  unset($_SESSION['aid']);  // one kind of session at a time
  $_SESSION['uid'] = $u['id'];
  q('UPDATE users SET last_login = now() WHERE id = :id', [':id' => $u['id']]);
  audit('login', $u['id']);
  return me();
}

/** Ends a staff or student session. */
function logout(): void {
  if (isset($_SESSION['uid'])) audit('logout', $_SESSION['uid']);
  $_SESSION = [];
  session_regenerate_id(true);
}

function check_password(string $uid, string $password): bool {
  $h = val('SELECT pw_hash FROM users WHERE id = :id AND active', [':id' => $uid]);
  return is_string($h) && password_verify($password, $h);
}

/* ---------- Student accounts (CR-01) ----------
   Kept separate from staff sessions: a student session can never reach staff endpoints. */

/** The logged-in student account, re-read on every request. */
function applicant(): ?array {
  static $cached = false;
  if ($cached !== false) return $cached;
  $aid = $_SESSION['aid'] ?? null;
  $a = $aid ? one('SELECT id, name, email, mobile FROM applicants WHERE id = :id AND active', [':id' => $aid]) : null;
  if ($aid && !$a) unset($_SESSION['aid']);
  return $cached = $a ? ['id' => (int)$a['id'], 'name' => $a['name'], 'email' => $a['email'], 'mobile' => $a['mobile']] : null;
}

function require_applicant(): array {
  $a = applicant();
  if (!$a) fail('Please log in to your student account again.', 401);
  return $a;
}

function applicant_login(string $email, string $password): array {
  $email = strtolower(trim($email));
  $ip = client_ip();
  rate_check("slogin-ip:$ip", 30, 900);
  rate_check("slogin-user:$email", 5, 900, 'Too many failed attempts for this account. Try again in 15 minutes.');
  $a = one('SELECT id, pw_hash, active FROM applicants WHERE lower(email) = :e', [':e' => $email]);
  $ok = password_verify($password, $a['pw_hash'] ?? '$2y$10$lL2nkvsyU9XmXzqZmfhrT.lfvqGTKBP7Bg4NbIE98GM5DZYaz3DBe');
  if (!$a || !$ok || !$a['active']) {
    rate_add("slogin-ip:$ip");
    rate_add("slogin-user:$email");
    fail('Email or password is incorrect.', 401);
  }
  session_regenerate_id(true);
  unset($_SESSION['uid']);  // one kind of session at a time
  $_SESSION['aid'] = (int)$a['id'];
  q('UPDATE applicants SET last_login = now() WHERE id = :id', [':id' => $a['id']]);
  return applicant();
}
