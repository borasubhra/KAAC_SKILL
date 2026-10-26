<?php
// End-to-end check of the API: one application from student sign-up to signed OJT letter, following the
// CR-01 to CR-10 workflow, plus permission checks.
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

echo "Student account (CR-01)\n";
$email = 'student' . getmypid() . '@example.com';
check('applying needs a student account', req('anon', 'POST', 'apply', ['pref1' => 'SKL-IT-01'], true)['code'] === 401);
check('weak student passwords are refused', req('stu', 'POST', 'student_signup', ['name' => 'Test Student', 'email' => $email, 'mobile' => '9876543210', 'password' => 'short'])['code'] === 400);
$r = req('stu', 'POST', 'student_signup', ['name' => 'Test Student', 'email' => $email, 'mobile' => '9876543210', 'password' => 'Stud3ntPass']);
check('student creates an account and is logged in', $r['code'] === 200 && $r['json']['me']['email'] === $email, $r['json']);
check('the same email cannot sign up twice', req('anon', 'POST', 'student_signup', ['name' => 'X', 'email' => strtoupper($email), 'mobile' => '9876543210', 'password' => 'Stud3ntPass'])['code'] === 409);
$r = req('stu', 'GET', 'student_me');
check('dashboard shows no applications yet', $r['code'] === 200 && $r['json']['students'] === []);
check('a student session cannot reach staff data', req('stu', 'GET', 'staff_data')['code'] === 401);
check('student logs out and back in', req('stu', 'POST', 'logout')['code'] === 200 && req('stu', 'POST', 'student_login', ['email' => $email, 'password' => 'Stud3ntPass'])['code'] === 200);

echo "Application (CR-02)\n";
$aad = aadhaar();
$form = ['aadhaar' => $aad, 'mobile' => '9876543210', 'name' => 'Test Student', 'father' => 'Test Father',
  'dob' => '2000-05-10', 'gender' => 'Female', 'category' => 'ST (Hills)', 'village' => 'Diphu', 'district' => 'Karbi Anglong', 'pin' => '782460',
  'qual' => 'Class 12', 'pref1' => 'SKL-IT-01', 'prefCentre' => 'KAAC-C-001', 'declare' => '1', 'photo_thumb' => $thumb,
  'religion' => 'Christian', 'employmentStatus' => 'Unemployed', 'sidhId' => 'SID123456789',
  'doc_photo' => $jpg(), 'doc_aadhaar' => $pdf(), 'doc_edu' => $jpg(), 'doc_prc' => $jpg()];
$bad = $form; $bad['doc_edu'] = new CURLFile("$TMP/evil.jpg", 'image/jpeg', 'evil.jpg');
check('a fake image is refused', req('stu', 'POST', 'apply', $bad, true)['code'] === 400);
$bad = $form; $bad['aadhaar'] = '234567890123';
check('an invalid Aadhaar number is refused', req('stu', 'POST', 'apply', $bad, true)['code'] === 422);
$bad = $form; unset($bad['religion']);
check('religion is required (SIDH parameter)', req('stu', 'POST', 'apply', $bad, true)['code'] === 422);
$bad = $form; $bad['sidhId'] = 'bad id <x>';
check('a malformed SIDH ID is refused', req('stu', 'POST', 'apply', $bad, true)['code'] === 422);
$r = req('stu', 'POST', 'apply', $form, true);
check('application is submitted', $r['code'] === 200 && preg_match('/^KAAC-SDE-\d{4}-\d{5}$/', $r['json']['student']['id'] ?? ''), $r['json']);
$sid = $r['json']['student']['id'] ?? '';
check('the application uses the account email', ($r['json']['student']['email'] ?? '') === $email);
check('SIDH parameters are saved', ($r['json']['student']['sidhId'] ?? '') === 'SID123456789' && $r['json']['student']['religion'] === 'Christian' && $r['json']['student']['employmentStatus'] === 'Unemployed');
check('no Aadhaar number or hash is returned', !str_contains($r['body'], 'hmac') && !str_contains($r['body'], $aad));
$form2 = $form; foreach (['photo' => $jpg, 'aadhaar' => $pdf, 'edu' => $jpg, 'prc' => $jpg] as $k => $f) $form2["doc_$k"] = $f();
$form2['aadhaar'] = aadhaar();
check('a second open application from the same account is refused', req('stu', 'POST', 'apply', $form2, true)['code'] === 409);
$r = req('stu', 'GET', 'student_me');
check('dashboard lists the application', count($r['json']['students']) === 1 && $r['json']['students'][0]['status'] === 'submitted');
check('ID + date of birth tracking still works', req('anon', 'POST', 'track', ['id' => $sid, 'dob' => '2000-05-10'])['json']['student']['status'] === 'submitted');

// A second applicant, used for the "not approved" path and the batch-size rule.
req('stu2', 'POST', 'student_signup', ['name' => 'Second Student', 'email' => "two$email", 'mobile' => '9876500000', 'password' => 'Stud3ntPass']);
$form3 = $form; foreach (['photo' => $jpg, 'aadhaar' => $pdf, 'edu' => $jpg, 'prc' => $jpg] as $k => $f) $form3["doc_$k"] = $f();
$form3['aadhaar'] = aadhaar(); $form3['name'] = 'Second Student';
$sid2 = req('stu2', 'POST', 'apply', $form3, true)['json']['student']['id'] ?? '';
check('second applicant applies', $sid2 !== '');

echo "Acknowledgement email (CR-02)\n";
req('sm', 'POST', 'login', ['u' => 'supervising', 'p' => 'Super@123']);
$notifs = req('sm', 'GET', 'staff_data')['json']['notifs'] ?? [];
$ack = array_values(array_filter($notifs, fn($n) => $n['channel'] === 'Email' && $n['studentId'] === $sid && $n['event'] === 'submitted'))[0] ?? null;
check('acknowledgement email carries the application number', $ack && str_contains($ack['body'], $sid) && str_contains($ack['subject'], $sid), $ack);

echo "Dealing Assistant (CR-03)\n";
check('staff data needs login', req('anon', 'GET', 'staff_data')['code'] === 401);
check('wrong password is refused', req('dealing', 'POST', 'login', ['u' => 'dealing', 'p' => 'nope'])['code'] === 401);
$r = req('dealing', 'POST', 'login', ['u' => 'dealing', 'p' => 'Deal@123']);
check('Dealing Assistant logs in', $r['code'] === 200 && $r['json']['me']['role'] === 'dealing', $r['json']);
check('session cookie is HttpOnly and SameSite=Strict', (bool)preg_match('/Set-Cookie: kaac_sess=[^\r\n]*HttpOnly[^\r\n]*SameSite=Strict/i', $r['headers']));
$r = req('dealing', 'GET', 'staff_data');
$st = array_values(array_filter($r['json']['students'] ?? [], fn($s) => $s['id'] === $sid))[0] ?? null;
check('Dealing Assistant sees the application', $st !== null);
check('staff list sends a photo link, not the image', str_starts_with($st['photo'] ?? '', 'api.php?r=photo'));
check('Dealing Assistant does not get the user list', !isset($r['json']['users']));
$aadDoc = array_values(array_filter($st['docs'], fn($d) => $d['key'] === 'aadhaar'))[0];
check('documents are not public', req('anon', 'GET', 'doc', ['id' => $aadDoc['docId']])['code'] === 401);
$r = req('dealing', 'GET', 'doc', ['id' => $aadDoc['docId']]);
check('Dealing Assistant opens a document', $r['code'] === 200 && str_starts_with($r['body'], '%PDF'));
req('dealing', 'POST', 'mark_doc', ['kind' => 'student', 'id' => $sid, 'key' => 'aadhaar', 'status' => 'rejected']);
check('forwarding with an incorrect document is refused', req('dealing', 'POST', 'app_action', ['id' => $sid, 'act' => 'verify'])['code'] === 400);
check('returning needs a remark', req('dealing', 'POST', 'app_action', ['id' => $sid, 'act' => 'return'])['code'] === 400);
check('returned to applicant for re-upload', req('dealing', 'POST', 'app_action', ['id' => $sid, 'act' => 'return', 'remark' => 'Aadhaar copy unclear'])['code'] === 200);
$r = req('stu', 'POST', 'resubmit', ['id' => $sid, 'doc_aadhaar' => $pdf()], true);
check('student re-uploads from their account', $r['code'] === 200 && $r['json']['student']['status'] === 'submitted', $r['json']);
check('another student cannot resubmit it', req('stu2', 'POST', 'resubmit', ['id' => $sid, 'doc_aadhaar' => $pdf()], true)['code'] === 404);
check('S&M Officer cannot do the Dealing Assistant’s step', req('sm', 'POST', 'app_action', ['id' => $sid, 'act' => 'verify'])['code'] === 403);
$r = req('dealing', 'POST', 'bulk_action', ['act' => 'verify', 'ids' => [$sid, $sid2]]);
check('Dealing Assistant forwards both to the S&M Officer', $r['code'] === 200 && $r['json']['done'] === 2, $r['json']);
check('a second forward is refused (already moved on)', req('dealing', 'POST', 'app_action', ['id' => $sid, 'act' => 'verify'])['code'] === 409);

echo "S&M Officer shortlist (CR-04)\n";
check('the old Monitoring Officer account no longer exists', req('anon', 'POST', 'login', ['u' => 'monitoring', 'p' => 'Monitor@123'])['code'] === 401);
check('Joint Secretary cannot approve before shortlisting', req('jts', 'POST', 'login', ['u' => 'jtsecy', 'p' => 'Jts@123'])['code'] === 200
  && req('jts', 'POST', 'app_action', ['id' => $sid, 'act' => 'approve'])['code'] === 409);
$r = req('sm', 'POST', 'bulk_action', ['act' => 'shortlist', 'ids' => [$sid, $sid2]]);
check('S&M Officer shortlists and forwards to the Joint Secretary', $r['code'] === 200 && $r['json']['done'] === 2, $r['json']);

echo "Joint Secretary approval (CR-05)\n";
check('not approving needs a remark', req('jts', 'POST', 'app_action', ['id' => $sid2, 'act' => 'notapprove'])['code'] === 400);
check('Joint Secretary does not approve one candidate', req('jts', 'POST', 'app_action', ['id' => $sid2, 'act' => 'notapprove', 'remark' => 'Seats filled'])['code'] === 200);
$r = req('jts', 'POST', 'bulk_action', ['act' => 'approve', 'ids' => [$sid, $sid2]]);
check('Joint Secretary approves the shortlist; finished ones are skipped', $r['code'] === 200 && $r['json']['done'] === 1 && $r['json']['skipped'] === [$sid2], $r['json']);
$r = req('sm', 'GET', 'staff_data');
$st = array_values(array_filter($r['json']['students'], fn($s) => $s['id'] === $sid))[0] ?? [];
check('S&M Officer sees the approved status', ($st['status'] ?? '') === 'approved' && ($st['skillId'] ?? '') === 'SKL-IT-01');

echo "Selection email (CR-06)\n";
$sel = array_values(array_filter($r['json']['notifs'], fn($n) => $n['channel'] === 'Email' && $n['studentId'] === $sid && $n['event'] === 'approved'))[0] ?? null;
check('a selection email is queued for the candidate', $sel && str_contains($sel['body'], 'selected'), $sel);

echo "Centre Manager allocation and batches (CR-07)\n";
req('centre', 'POST', 'login', ['u' => 'centre', 'p' => 'Centre@123']);
$r = req('centre', 'GET', 'staff_data');
$ids = array_column($r['json']['students'], 'id');
check('Centre Manager sees the approved candidate', in_array($sid, $ids, true));
check('Centre Manager does not see candidates still under review', !in_array($sid2, $ids, true));
check('a centre without the trade is refused', req('centre', 'POST', 'allocate', ['ids' => [$sid], 'centre' => 'KAAC-C-003'])['code'] === 400);
check('Centre Manager allots the candidate to Diphu', req('centre', 'POST', 'allocate', ['ids' => [$sid], 'centre' => 'KAAC-C-001'])['json']['done'] === 1);
check('Centre Manager moves the candidate to Donka', req('centre', 'POST', 'allocate', ['ids' => [$sid], 'centre' => 'KAAC-C-005'])['json']['done'] === 1);
$start = date('Y-m-d', strtotime('+14 days')); $end = date('Y-m-d', strtotime('+120 days'));
$many = array_map(fn($i) => sprintf('KAAC-SDE-2026-%05d', 90000 + $i), range(1, 26));
$r = req('centre', 'POST', 'create_batch', ['course' => 'SKL-IT-01', 'centre' => 'KAAC-C-005', 'start' => $start, 'end' => $end, 'ids' => $many]);
check('a batch larger than the centre can hold (25) is refused', $r['code'] === 400 && str_contains($r['json']['error'] ?? '', '25'), $r['json']);
check('a candidate allotted elsewhere cannot join the batch', req('centre', 'POST', 'create_batch', ['course' => 'SKL-IT-01', 'centre' => 'KAAC-C-001', 'start' => $start, 'end' => $end, 'ids' => [$sid]])['code'] === 409);
$r = req('centre', 'POST', 'create_batch', ['course' => 'SKL-IT-01', 'centre' => 'KAAC-C-005', 'start' => $start, 'end' => $end, 'ids' => [$sid]]);
check('Centre Manager forms the batch', $r['code'] === 200 && str_starts_with($r['json']['id'] ?? '', 'BAT-'), $r['json']);
$bid = $r['json']['id'] ?? '';
check('Centre Manager records the SIDH batch ID', req('centre', 'POST', 'set_sidh_id', ['kind' => 'batch', 'id' => $bid, 'sidhId' => 'SIDH-BATCH-778'])['code'] === 200);
check('the Dealing Assistant cannot set a batch ID', req('dealing', 'POST', 'set_sidh_id', ['kind' => 'batch', 'id' => $bid, 'sidhId' => 'X1'])['code'] === 403);
check('Training Manager cannot form batches any more', req('training', 'POST', 'login', ['u' => 'training', 'p' => 'Train@123'])['code'] === 200
  && req('training', 'POST', 'create_batch', ['course' => 'SKL-IT-01', 'centre' => 'KAAC-C-005', 'start' => $start, 'end' => $end, 'ids' => [$sid]])['code'] === 403);

echo "Trainer registration and Training Manager (CR-08)\n";
echo "Trainer recruitment\n";
$pub = req('anon', 'GET', 'public')['json'];
$rec = array_values(array_filter($pub['recruitments'], fn($x) => $x['id'] === 'REC-2026-01'))[0] ?? null;
check('the trainer advertisement is published and open', $rec && $rec['open'] === true && $rec['minAge'] === 25 && $rec['maxAge'] === 40 && $rec['vacancies'] === 40, $rec);
$r = req('anon', 'GET', 'doc', ['id' => $rec['attachDocId'] ?? '']);
check('the advertisement PDF can be downloaded by anyone', $r['code'] === 200 && str_starts_with($r['body'], '%PDF'));
$tdocs = fn() => ['photo_thumb' => $thumb, 'doc_photo' => $jpg(), 'doc_aadhaar' => $pdf(), 'doc_qual' => $pdf(), 'doc_caste' => $pdf(), 'doc_prc' => $pdf()];
$tbase = ['recruitmentId' => 'REC-2026-01', 'mobile' => '9123456780', 'email' => 'trainer@example.com', 'name' => 'Test Trainer', 'father' => 'TF',
  'dob' => '1990-01-01', 'gender' => 'Male', 'address' => 'Diphu', 'district' => 'Karbi Anglong', 'pin' => '782460', 'qual' => 'Graduate',
  'specialisation' => 'Computer applications', 'indExp' => '5', 'trnExp' => '3', 'skill[0]' => 'SKL-IT-01', 'pc[0]' => 'KAAC-C-005', 'declare' => '1'];
$t = $tbase + $tdocs(); $t['aadhaar'] = aadhaar(); unset($t['recruitmentId']);
check('trainers must apply against a recruitment', req('anon', 'POST', 'trainer_register', $t, true)['code'] === 400);
$t = $tbase + $tdocs(); $t['aadhaar'] = aadhaar(); $t['dob'] = '1984-01-01';
$r = req('anon', 'POST', 'trainer_register', $t, true);
check('a candidate over 40 is refused', $r['code'] === 422 && str_contains($r['json']['error'] ?? '', '25 to 40'), $r['json']);
$t = $tbase + $tdocs(); $t['aadhaar'] = aadhaar(); $t['qual'] = 'Class 10';
check('below Class 12 is refused', req('anon', 'POST', 'trainer_register', $t, true)['code'] === 422);
$t = $tbase + $tdocs(); $t['aadhaar'] = aadhaar(); unset($t['doc_caste']);
check('the tribe/caste certificate is required', req('anon', 'POST', 'trainer_register', $t, true)['code'] === 422);
$r = req('training', 'POST', 'save_recruitment', ['title' => 'Old recruitment', 'lastDate' => date('Y-m-d', strtotime('-1 day')), 'minAge' => 21, 'maxAge' => 45, 'minQual' => 'Class 12', 'active' => '1'], true);
check('Training Manager posts a recruitment', $r['code'] === 200 && str_starts_with($r['json']['id'] ?? '', 'REC-'), $r['json']);
$old = $r['json']['id'] ?? '';
$t = $tbase + $tdocs(); $t['aadhaar'] = aadhaar(); $t['recruitmentId'] = $old;
check('applications after the last date are refused', req('anon', 'POST', 'trainer_register', $t, true)['code'] === 409);
check('the Dealing Assistant cannot post recruitments', req('dealing', 'POST', 'save_recruitment', ['title' => 'X', 'lastDate' => date('Y-m-d'), 'minAge' => 21, 'maxAge' => 45, 'minQual' => 'Class 12'], true)['code'] === 403);
check('an unused recruitment can be deleted', req('training', 'POST', 'delete_recruitment', ['id' => $old])['code'] === 200);
$tform = $tbase + $tdocs(); $tform['aadhaar'] = aadhaar();
$r = req('anon', 'POST', 'trainer_register', $tform, true);
check('an eligible trainer applies', $r['code'] === 200 && str_starts_with($r['json']['trainer']['id'] ?? '', 'KAAC-SDE-TR-') && $r['json']['trainer']['recruitmentId'] === 'REC-2026-01', $r['json']);
$tid = $r['json']['trainer']['id'] ?? '';
check('Dealing Assistant verifies the trainer', req('dealing', 'POST', 'trainer_action', ['id' => $tid, 'act' => 'verify'])['code'] === 200);
check('Training Manager empanels the trainer', req('training', 'POST', 'trainer_action', ['id' => $tid, 'act' => 'empanel'])['code'] === 200);
check('a recruitment with applicants cannot be deleted', req('training', 'POST', 'delete_recruitment', ['id' => 'REC-2026-01'])['code'] === 400);
$r = req('training', 'GET', 'staff_data');
check('Training Manager sees the batch', in_array($bid, array_column($r['json']['batches'], 'id'), true));
check('Training Manager sees only candidates in batches', array_column($r['json']['students'], 'id') === [$sid]);
check('Training Manager assigns the trainer', req('training', 'POST', 'assign_trainer', ['bid' => $bid, 'tid' => $tid])['code'] === 200);
check('Centre Manager starts training', req('centre', 'POST', 'start_batch', ['id' => $bid])['code'] === 200);
check('Centre Manager records results', req('centre', 'POST', 'save_results', ['bid' => $bid, 'rows' => [['sid' => $sid, 'att' => 90, 'marks' => 80]]])['code'] === 200);

echo "Certificate and verification\n";
$r = req('training', 'POST', 'issue_certs', ['ids' => [$sid]]);
check('Training Manager generates the certificate', $r['code'] === 200 && $r['json']['issued'] === 1);
$cert = req('stu', 'GET', 'student_me')['json']['students'][0]['cert']['no'] ?? '';
$r = req('anon', 'GET', 'verify', ['no' => $cert]);
check('employer verifies the certificate', $r['json']['valid'] === true && $r['json']['name'] === 'Test Student', $r['json']);
check('an unknown certificate is not valid', req('anon', 'GET', 'verify', ['no' => 'KAAC-SDE-CERT-2026-99999'])['json']['valid'] === false);

echo "OJT letter\n";
$r = req('training', 'POST', 'create_ojt', ['sid' => $sid, 'employer' => 'Example Ltd', 'address' => 'Guwahati', 'role' => 'Data entry trainee', 'start' => date('Y-m-d', strtotime('+30 days')), 'duration' => '3 months']);
check('OJT letter is drafted', $r['code'] === 200, $r['json']);
$oid = $r['json']['id'] ?? '';
check('signing with a wrong password is refused', req('jts', 'POST', 'sign_ojt', ['id' => $oid, 'password' => 'wrong'])['code'] === 400);
check('Training Manager cannot sign', req('training', 'POST', 'sign_ojt', ['id' => $oid, 'password' => 'Train@123'])['code'] === 403);
check('Joint Secretary signs', req('jts', 'POST', 'sign_ojt', ['id' => $oid, 'password' => 'Jts@123'])['code'] === 200);
$r = req('stu', 'GET', 'student_me');
check('signed letter appears on the student dashboard', count($r['json']['ojt']) === 1 && strlen($r['json']['ojt'][0]['sigRef']) === 20);
$form4 = $form; foreach (['photo' => $jpg, 'aadhaar' => $pdf, 'edu' => $jpg, 'prc' => $jpg] as $k => $f) $form4["doc_$k"] = $f();
$form4['pref1'] = 'SKL-IT-02';
check('after certification the student may apply for another trade', req('stu', 'POST', 'apply', $form4, true)['code'] === 200);

echo "Password reset\n";
req('anon', 'POST', 'forgot_password', ['email' => $email, 'base' => 'http://localhost:8080/']);
$notifs = req('sm', 'GET', 'staff_data')['json']['notifs'] ?? [];
$mail = array_values(array_filter($notifs, fn($n) => $n['event'] === 'password-reset'))[0] ?? null;
preg_match('/#reset\/([0-9a-f]{48})/', $mail['body'] ?? '', $m);
check('a reset link is emailed', !empty($m[1]), $mail);
check('a bad token is refused', req('anon', 'POST', 'reset_password', ['token' => str_repeat('0', 48), 'password' => 'N3wPassword'])['code'] === 400);
check('the reset link sets a new password', req('anon', 'POST', 'reset_password', ['token' => $m[1] ?? '', 'password' => 'N3wPassword'])['code'] === 200);
check('the link works only once', req('anon', 'POST', 'reset_password', ['token' => $m[1] ?? '', 'password' => 'An0therPass'])['code'] === 400);
check('student logs in with the new password', req('stu3', 'POST', 'student_login', ['email' => $email, 'password' => 'N3wPassword'])['code'] === 200);

echo "Administration (CR-09, CR-10)\n";
req('admin', 'POST', 'login', ['u' => 'admin', 'p' => 'Admin@123']);
$centre = ['id' => 'KAAC-C-006', 'name' => 'Baithalangso Skill Centre', 'district' => 'West Karbi Anglong', 'address' => 'Baithalangso', 'phone' => '',
  'capacity' => 30, 'active' => true, 'sectors' => ['IT', 'AGR'], 'type' => 'Government institute', 'hod' => '', 'nearbyTown' => 'Hamren', 'facilities' => 'Computer lab'];
check('a Government institute needs a Head of Department', req('admin', 'POST', 'save_master', ['coll' => 'centres', 'isNew' => true, 'data' => $centre])['code'] === 400);
$centre['hod'] = 'Principal, Baithalangso ITI';
$centre['sidhTcId'] = 'TC123456';
check('admin adds an upcoming centre', req('admin', 'POST', 'save_master', ['coll' => 'centres', 'isNew' => true, 'data' => $centre])['code'] === 200);
$course = array_values(array_filter(req('admin', 'GET', 'staff_data')['json']['courses'], fn($c) => $c['id'] === 'SKL-ELE-01'))[0];
$course += []; $course['qpCode'] = 'sgj/q0101'; $course['jobRole'] = 'Solar PV Installer (Suryamitra)'; $course['ssc'] = 'Skill Council for Green Jobs';
check('admin records the job role, QP code and Sector Skill Council', req('admin', 'POST', 'save_master', ['coll' => 'courses', 'isNew' => false, 'data' => $course])['code'] === 200);
$c2 = array_values(array_filter(req('anon', 'GET', 'public')['json']['courses'], fn($c) => $c['id'] === 'SKL-ELE-01'))[0];
check('QP code is stored in capitals', $c2['qpCode'] === 'SGJ/Q0101' && $c2['ssc'] === 'Skill Council for Green Jobs');
check('admin saves the SIDH Training Partner ID', req('admin', 'POST', 'save_settings', ['sidhTpId' => 'TP000123', 'sidhProjectId' => 'PRJ-KAAC-01', 'sidhScheme' => 'KAAC Skill Development Scheme'])['code'] === 200
  && (req('admin', 'GET', 'staff_data')['json']['settings']['sidhTpId'] ?? '') === 'TP000123');
$c6 = array_values(array_filter(req('anon', 'GET', 'public')['json']['centres'], fn($c) => $c['id'] === 'KAAC-C-006'))[0] ?? [];
check('centre details are saved', ($c6['type'] ?? '') === 'Government institute' && ($c6['hod'] ?? '') === 'Principal, Baithalangso ITI' && ($c6['nearbyTown'] ?? '') === 'Hamren');
check('the Monitoring role can no longer be given', req('admin', 'POST', 'save_user', ['isNew' => true, 'id' => 'mon2', 'name' => 'M', 'role' => 'monitoring', 'pw' => 'Str0ngPassword', 'active' => true])['code'] === 400);
check('weak passwords are refused', req('admin', 'POST', 'save_user', ['isNew' => true, 'id' => 'newuser', 'name' => 'N', 'role' => 'dealing', 'pw' => 'short', 'active' => true])['code'] === 400);
check('admin creates a user', req('admin', 'POST', 'save_user', ['isNew' => true, 'id' => 'newuser', 'name' => 'New User', 'role' => 'dealing', 'pw' => 'Str0ngPassword', 'active' => true])['code'] === 200);
check('new user logs in', req('newuser', 'POST', 'login', ['u' => 'newuser', 'p' => 'Str0ngPassword'])['code'] === 200);
req('admin', 'POST', 'save_user', ['id' => 'newuser', 'name' => 'New User', 'role' => 'dealing', 'active' => false]);
check('a disabled user is logged out at once', req('newuser', 'GET', 'staff_data')['code'] === 401);
check('admin creates a Centre Manager for one centre', req('admin', 'POST', 'save_user', ['isNew' => true, 'id' => 'hamren', 'name' => 'Hamren Manager', 'role' => 'centre', 'centreId' => 'KAAC-C-002', 'pw' => 'Str0ngPassword', 'active' => true])['code'] === 200);
req('hamren', 'POST', 'login', ['u' => 'hamren', 'p' => 'Str0ngPassword']);
check('a one-centre manager cannot form batches at another centre', req('hamren', 'POST', 'create_batch', ['course' => 'SKL-IT-01', 'centre' => 'KAAC-C-005', 'start' => $start, 'end' => $end, 'ids' => [$sid]])['code'] === 403);
check('non-admin cannot manage users', req('training', 'POST', 'save_user', ['isNew' => true, 'id' => 'x2', 'name' => 'X', 'role' => 'admin', 'pw' => 'Str0ngPassword1', 'active' => true])['code'] === 403);
$r = req('training', 'POST', 'save_notice', ['title' => 'Test notice', 'category' => 'Circular', 'date' => date('Y-m-d'), 'body' => 'Body', 'active' => '1', 'file' => $pdf()], true);
check('Training Manager publishes a notice with attachment', $r['code'] === 200, $r['json']);
$n = array_values(array_filter(req('anon', 'GET', 'public')['json']['notices'], fn($x) => $x['title'] === 'Test notice'))[0] ?? null;
check('notice attachment is public', $n && req('anon', 'GET', 'doc', ['id' => $n['attachDocId']])['code'] === 200);
check('javascript: links are refused', req('training', 'POST', 'save_ext', ['kind' => 'jobs', 'data' => ['title' => 'X', 'url' => 'javascript:alert(1)']])['code'] === 400);

echo "Login rate limit\n";
for ($i = 0; $i < 5; $i++) req('anon', 'POST', 'login', ['u' => 'supervising', 'p' => 'wrong']);
check('repeated wrong passwords lock the account for a while', req('anon', 'POST', 'login', ['u' => 'supervising', 'p' => 'Super@123'])['code'] === 429);

array_map('unlink', glob("$TMP/*")); @rmdir($TMP);
echo $failures ? "\n$failures check(s) failed.\n" : "\nAll checks passed.\n";
exit($failures ? 1 : 0);
