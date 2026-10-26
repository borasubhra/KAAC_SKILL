<?php
// End-to-end check of the API: one application from registration to signed OJT letter, plus permission checks.
// Needs a fresh database with DEMO_USERS=true. Usage: php tests/smoke_test.php [base URL, default http://localhost:8080]
declare(strict_types=1);

$BASE = rtrim($argv[1] ?? 'http://localhost:8080', '/') . '/api.php?r=';
$TMP = sys_get_temp_dir() . '/kaac-smoke-' . getmypid();
@mkdir($TMP);
$failures = 0;

function req(string $who, string $method, string $route, array $data = [], bool $multipart = false, array $headers = ['X-KAAC: 1']): array {
  global $BASE, $TMP;
  $ch = curl_init($BASE . $route . ($method === 'GET' && $data ? '&' . http_build_query($data) : ''));
  curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_COOKIEJAR => "$TMP/$who.cookies", CURLOPT_COOKIEFILE => "$TMP/$who.cookies",
    CURLOPT_HEADER => true]);
  if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    if ($multipart) curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    else { curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data)); $headers[] = 'Content-Type: application/json'; }
  }
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  $raw = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  $hs = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
  $body = substr($raw, $hs);
  return ['code' => $code, 'json' => json_decode($body, true), 'body' => $body, 'headers' => substr($raw, 0, $hs)];
}

function check(string $what, bool $ok, mixed $detail = null): void {
  global $failures;
  echo ($ok ? "  ok   " : "  FAIL ") . $what . ($ok || $detail === null ? '' : ' — ' . json_encode($detail)) . "\n";
  if (!$ok) $failures++;
}

function aadhaar(): string {
  $d = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
  $p = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,7,6,8,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
  $inv = [0,4,3,2,1,5,6,7,8,9];
  $n = (string)random_int(2, 9);
  for ($i = 0; $i < 10; $i++) $n .= random_int(0, 9);
  $c = 0;
  foreach (array_reverse(str_split($n)) as $i => $x) $c = $d[$c][$p[($i + 1) % 8][(int)$x]];
  return $n . $inv[$c];
}

// Test files: a real JPEG, a minimal PDF and a fake "image" that is really text.
$img = imagecreatetruecolor(120, 150);
imagefill($img, 0, 0, imagecolorallocate($img, 30, 120, 90));
imagejpeg($img, "$TMP/photo.jpg");
ob_start(); imagejpeg(imagescale($img, 60), null, 70); $thumb = 'data:image/jpeg;base64,' . base64_encode(ob_get_clean());
file_put_contents("$TMP/doc.pdf", "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
file_put_contents("$TMP/evil.jpg", '<script>alert(1)</script>');
$jpg = fn() => new CURLFile("$TMP/photo.jpg", 'image/jpeg', 'photo.jpg');
$pdf = fn() => new CURLFile("$TMP/doc.pdf", 'application/pdf', 'doc.pdf');

echo "Public\n";
$r = req('anon', 'GET', 'public');
check('public data loads', $r['code'] === 200 && count($r['json']['courses']) > 0, $r['code']);
check('public data has no applicants', !isset($r['json']['students']) && !isset($r['json']['trainers']));
check('POST without X-KAAC header is blocked', req('anon', 'POST', 'track', ['id' => 'x', 'dob' => '2000-01-01'], false, [])['code'] === 403);

echo "Student registration\n";
$aad = aadhaar();
$form = ['aadhaar' => $aad, 'mobile' => '9876543210', 'email' => 'student@example.com', 'name' => 'Test Student', 'father' => 'Test Father',
  'dob' => '2000-05-10', 'gender' => 'Female', 'category' => 'ST (Hills)', 'village' => 'Diphu', 'district' => 'Karbi Anglong', 'pin' => '782460',
  'qual' => 'Class 12', 'pref1' => 'SKL-IT-01', 'prefCentre' => 'KAAC-C-001', 'declare' => '1', 'photo_thumb' => $thumb,
  'doc_photo' => $jpg(), 'doc_aadhaar' => $pdf(), 'doc_edu' => $jpg(), 'doc_prc' => $jpg()];
$bad = $form; $bad['doc_edu'] = new CURLFile("$TMP/evil.jpg", 'image/jpeg', 'evil.jpg');
$r = req('anon', 'POST', 'register', $bad, true);
check('a fake image is refused', $r['code'] === 400, $r['json']);
$bad = $form; $bad['aadhaar'] = '234567890123';
check('an invalid Aadhaar number is refused', req('anon', 'POST', 'register', $bad, true)['code'] === 422);
$r = req('anon', 'POST', 'register', $form, true);
check('registration succeeds', $r['code'] === 200 && preg_match('/^KAAC-SDE-\d{4}-\d{5}$/', $r['json']['student']['id'] ?? ''), $r['json']);
$sid = $r['json']['student']['id'] ?? '';
check('registration returns no Aadhaar hash', !str_contains($r['body'], 'hmac') && !str_contains($r['body'], $aad));
$form2 = $form; $form2['doc_photo'] = $jpg(); $form2['doc_aadhaar'] = $pdf(); $form2['doc_edu'] = $jpg(); $form2['doc_prc'] = $jpg();
check('a second open application for the same Aadhaar is refused', req('anon', 'POST', 'register', $form2, true)['code'] === 409);

echo "Tracking\n";
check('wrong date of birth finds nothing', req('anon', 'POST', 'track', ['id' => $sid, 'dob' => '2000-05-11'])['code'] === 404);
$r = req('anon', 'POST', 'track', ['id' => $sid, 'dob' => '2000-05-10']);
check('ID + date of birth shows the application', $r['code'] === 200 && $r['json']['student']['status'] === 'submitted');
check('tracked application includes the photo', str_starts_with($r['json']['student']['photo'] ?? '', 'data:image/jpeg'));

echo "Staff login and permissions\n";
check('staff data needs login', req('anon', 'GET', 'staff_data')['code'] === 401);
check('wrong password is refused', req('dealing', 'POST', 'login', ['u' => 'dealing', 'p' => 'nope'])['code'] === 401);
$r = req('dealing', 'POST', 'login', ['u' => 'dealing', 'p' => 'Deal@123']);
check('dealing officer logs in', $r['code'] === 200 && $r['json']['me']['role'] === 'dealing', $r['json']);
check('session cookie is HttpOnly and SameSite=Strict', (bool)preg_match('/Set-Cookie: kaac_sess=[^\r\n]*HttpOnly[^\r\n]*SameSite=Strict/i', $r['headers']));
$r = req('dealing', 'GET', 'staff_data');
$st = array_values(array_filter($r['json']['students'] ?? [], fn($s) => $s['id'] === $sid))[0] ?? null;
check('dealing officer sees the application', $st !== null);
check('staff list sends a photo link, not the image', str_starts_with($st['photo'] ?? '', 'api.php?r=photo'));
check('dealing officer does not get the user list', !isset($r['json']['users']));
$aadDoc = array_values(array_filter($st['docs'], fn($d) => $d['key'] === 'aadhaar'))[0];
$r = req('anon', 'GET', 'doc', ['id' => $aadDoc['docId']]);
check('documents are not public', $r['code'] === 401);
$r = req('dealing', 'GET', 'doc', ['id' => $aadDoc['docId']]);
check('dealing officer can open a document', $r['code'] === 200 && str_starts_with($r['body'], '%PDF'));
check('dealing officer cannot issue admit cards', req('dealing', 'POST', 'issue_admit', ['ids' => [$sid], 'date' => date('Y-m-d', strtotime('+7 days')), 'time' => '10 AM', 'venue' => 'Diphu'])['code'] === 403);

echo "Return, resubmit, verify\n";
req('dealing', 'POST', 'mark_doc', ['kind' => 'student', 'id' => $sid, 'key' => 'aadhaar', 'status' => 'rejected']);
check('verifying with an incorrect document is refused', req('dealing', 'POST', 'app_action', ['id' => $sid, 'act' => 'verify'])['code'] === 400);
check('returning needs a remark', req('dealing', 'POST', 'app_action', ['id' => $sid, 'act' => 'return'])['code'] === 400);
check('return for correction', req('dealing', 'POST', 'app_action', ['id' => $sid, 'act' => 'return', 'remark' => 'Aadhaar copy unclear'])['code'] === 200);
$r = req('anon', 'POST', 'resubmit', ['id' => $sid, 'dob' => '2000-05-10', 'doc_aadhaar' => $pdf()], true);
check('applicant resubmits the corrected document', $r['code'] === 200 && $r['json']['student']['status'] === 'submitted', $r['json']);
check('verify documents', req('dealing', 'POST', 'app_action', ['id' => $sid, 'act' => 'verify'])['code'] === 200);
check('a second verify is refused (already moved on)', req('dealing', 'POST', 'app_action', ['id' => $sid, 'act' => 'verify'])['code'] === 409);

echo "Admit card and selection\n";
req('supervising', 'POST', 'login', ['u' => 'supervising', 'p' => 'Super@123']);
$r = req('supervising', 'POST', 'issue_admit', ['ids' => [$sid], 'date' => date('Y-m-d', strtotime('+7 days')), 'time' => '10:00 AM', 'venue' => 'Diphu Skill Centre']);
check('supervising officer issues the admit card', $r['code'] === 200 && $r['json']['issued'] === 1, $r['json']);
req('training', 'POST', 'login', ['u' => 'training', 'p' => 'Train@123']);
check('training manager selects the candidate', req('training', 'POST', 'app_action', ['id' => $sid, 'act' => 'select', 'score' => 72])['code'] === 200);

echo "Trainer registration and empanelment\n";
$tform = ['aadhaar' => aadhaar(), 'mobile' => '9123456780', 'email' => 'trainer@example.com', 'name' => 'Test Trainer', 'father' => 'TF',
  'dob' => '1985-01-01', 'gender' => 'Male', 'address' => 'Diphu', 'district' => 'Karbi Anglong', 'pin' => '782460', 'qual' => 'Graduate',
  'specialisation' => 'Computer applications', 'indExp' => '5', 'trnExp' => '3', 'skill[0]' => 'SKL-IT-01', 'pc[0]' => 'KAAC-C-001', 'declare' => '1',
  'photo_thumb' => $thumb, 'doc_photo' => $jpg(), 'doc_aadhaar' => $pdf(), 'doc_qual' => $pdf(), 'doc_exp' => $pdf()];
$r = req('anon', 'POST', 'trainer_register', $tform, true);
check('trainer registers', $r['code'] === 200 && str_starts_with($r['json']['trainer']['id'] ?? '', 'KAAC-SDE-TR-'), $r['json']);
$tid = $r['json']['trainer']['id'] ?? '';
check('trainer can track with ID + date of birth', req('anon', 'POST', 'track', ['id' => $tid, 'dob' => '1985-01-01'])['json']['kind'] === 'trainer');
check('dealing officer verifies the trainer', req('dealing', 'POST', 'trainer_action', ['id' => $tid, 'act' => 'verify'])['code'] === 200);
check('training manager empanels the trainer', req('training', 'POST', 'trainer_action', ['id' => $tid, 'act' => 'empanel'])['code'] === 200);

echo "Batch, training and results\n";
$start = date('Y-m-d', strtotime('+14 days')); $end = date('Y-m-d', strtotime('+120 days'));
check('a centre without the course sector is refused', req('training', 'POST', 'create_batch', ['course' => 'SKL-IT-01', 'centre' => 'KAAC-C-003',
  'cap' => 30, 'start' => $start, 'end' => $end, 'ids' => [$sid], 'trainerId' => $tid])['code'] === 400);
$r = req('training', 'POST', 'create_batch', ['course' => 'SKL-IT-01', 'centre' => 'KAAC-C-001', 'cap' => 30, 'start' => $start, 'end' => $end, 'ids' => [$sid], 'trainerId' => $tid]);
check('training manager forms a batch', $r['code'] === 200 && str_starts_with($r['json']['id'] ?? '', 'BAT-'), $r['json']);
$bid = $r['json']['id'] ?? '';
$r = req('training', 'POST', 'create_batch', ['course' => 'SKL-IT-01', 'centre' => 'KAAC-C-001', 'cap' => 30, 'start' => $start, 'end' => $end, 'ids' => [$sid]]);
check('a student cannot be put in two batches', $r['code'] === 409, $r['json']);
req('centre1', 'POST', 'login', ['u' => 'centre1', 'p' => 'Centre@123']);
req('centre2', 'POST', 'login', ['u' => 'centre2', 'p' => 'Centre@123']);
check('another centre cannot start the batch', req('centre2', 'POST', 'start_batch', ['id' => $bid])['code'] === 403);
check('centre manager starts the batch', req('centre1', 'POST', 'start_batch', ['id' => $bid])['code'] === 200);
$r = req('centre2', 'GET', 'staff_data');
check('another centre does not see these trainees', !in_array($sid, array_column($r['json']['students'], 'id'), true));
check('another centre cannot record results', req('centre2', 'POST', 'save_results', ['bid' => $bid, 'rows' => [['sid' => $sid, 'att' => 90, 'marks' => 80]]])['code'] === 403);
check('centre manager records results', req('centre1', 'POST', 'save_results', ['bid' => $bid, 'rows' => [['sid' => $sid, 'att' => 90, 'marks' => 80]]])['code'] === 200);

echo "Certificate and verification\n";
$r = req('training', 'POST', 'issue_certs', ['ids' => [$sid]]);
check('training manager generates the certificate', $r['code'] === 200 && $r['json']['issued'] === 1);
$cert = req('anon', 'POST', 'track', ['id' => $sid, 'dob' => '2000-05-10'])['json']['student']['cert']['no'] ?? '';
$r = req('anon', 'GET', 'verify', ['no' => $cert]);
check('employer verifies the certificate', $r['json']['valid'] === true && $r['json']['name'] === 'Test Student', $r['json']);
check('an unknown certificate is not valid', req('anon', 'GET', 'verify', ['no' => 'KAAC-SDE-CERT-2026-99999'])['json']['valid'] === false);

echo "OJT letter\n";
$r = req('training', 'POST', 'create_ojt', ['sid' => $sid, 'employer' => 'Example Ltd', 'address' => 'Guwahati', 'role' => 'Data entry trainee', 'start' => date('Y-m-d', strtotime('+30 days')), 'duration' => '3 months']);
check('OJT letter is drafted', $r['code'] === 200, $r['json']);
$oid = $r['json']['id'] ?? '';
req('jtsecy', 'POST', 'login', ['u' => 'jtsecy', 'p' => 'Jts@123']);
check('signing with a wrong password is refused', req('jtsecy', 'POST', 'sign_ojt', ['id' => $oid, 'password' => 'wrong'])['code'] === 400);
check('training manager cannot sign', req('training', 'POST', 'sign_ojt', ['id' => $oid, 'password' => 'Train@123'])['code'] === 403);
check('Joint Secretary signs', req('jtsecy', 'POST', 'sign_ojt', ['id' => $oid, 'password' => 'Jts@123'])['code'] === 200);
$r = req('anon', 'POST', 'track', ['id' => $sid, 'dob' => '2000-05-10']);
check('signed letter appears on Track status', count($r['json']['ojt']) === 1 && strlen($r['json']['ojt'][0]['sigRef']) === 20);

echo "Administration\n";
req('admin', 'POST', 'login', ['u' => 'admin', 'p' => 'Admin@123']);
check('weak passwords are refused', req('admin', 'POST', 'save_user', ['isNew' => true, 'id' => 'newuser', 'name' => 'N', 'role' => 'dealing', 'pw' => 'short', 'active' => true])['code'] === 400);
check('admin creates a user', req('admin', 'POST', 'save_user', ['isNew' => true, 'id' => 'newuser', 'name' => 'New User', 'role' => 'dealing', 'pw' => 'Str0ngPassword', 'active' => true])['code'] === 200);
check('new user logs in', req('newuser', 'POST', 'login', ['u' => 'newuser', 'p' => 'Str0ngPassword'])['code'] === 200);
req('admin', 'POST', 'save_user', ['id' => 'newuser', 'name' => 'New User', 'role' => 'dealing', 'active' => false]);
check('a disabled user is logged out at once', req('newuser', 'GET', 'staff_data')['code'] === 401);
check('non-admin cannot manage users', req('training', 'POST', 'save_user', ['isNew' => true, 'id' => 'x2', 'name' => 'X', 'role' => 'admin', 'pw' => 'Str0ngPassword1', 'active' => true])['code'] === 403);
$r = req('training', 'POST', 'save_notice', ['title' => 'Test notice', 'category' => 'Circular', 'date' => date('Y-m-d'), 'body' => 'Body', 'active' => '1', 'file' => $pdf()], true);
check('training manager publishes a notice with attachment', $r['code'] === 200, $r['json']);
$n = array_values(array_filter(req('anon', 'GET', 'public')['json']['notices'], fn($x) => $x['title'] === 'Test notice'))[0] ?? null;
check('notice attachment is public', $n && req('anon', 'GET', 'doc', ['id' => $n['attachDocId']])['code'] === 200);
check('javascript: links are refused', req('training', 'POST', 'save_ext', ['kind' => 'jobs', 'data' => ['title' => 'X', 'url' => 'javascript:alert(1)']])['code'] === 400);

echo "Login rate limit\n";
for ($i = 0; $i < 5; $i++) req('anon', 'POST', 'login', ['u' => 'monitoring', 'p' => 'wrong']);
check('repeated wrong passwords lock the account for a while', req('anon', 'POST', 'login', ['u' => 'monitoring', 'p' => 'Monitor@123'])['code'] === 429);

array_map('unlink', glob("$TMP/*")); @rmdir($TMP);
echo $failures ? "\n$failures check(s) failed.\n" : "\nAll checks passed.\n";
exit($failures ? 1 : 0);
