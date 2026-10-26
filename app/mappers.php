<?php
// Database rows -> the JSON shapes the front end (public/assets/app.js) works with.
declare(strict_types=1);

function jd(?string $json, mixed $default = null): mixed { return $json === null ? $default : json_decode($json, true); }
function num(mixed $v): int|float|null { return $v === null ? null : $v + 0; }

function map_sector(array $r): array { return ['id' => $r['id'], 'name' => $r['name'], 'desc' => $r['descr']]; }

function map_course(array $r): array {
  return [
    'id' => $r['id'], 'sectorId' => $r['sector_id'], 'name' => $r['name'], 'nsqf' => (int)$r['nsqf'], 'hours' => (int)$r['hours'],
    'minQual' => $r['min_qual'], 'minAge' => (int)$r['min_age'], 'maxAge' => (int)$r['max_age'], 'seats' => (int)$r['seats'],
    'fee' => 'Free', 'active' => (bool)$r['active'], 'updatedAt' => iso($r['updated_at']),
    'jobRole' => $r['job_role'], 'qpCode' => $r['qp_code'], 'ssc' => $r['ssc'],
  ];
}

function map_centre(array $r): array {
  return [
    'id' => $r['id'], 'name' => $r['name'], 'address' => $r['address'], 'district' => $r['district'], 'sectors' => pg_arr($r['sectors']),
    'capacity' => (int)$r['capacity'], 'phone' => $r['phone'], 'active' => (bool)$r['active'],
    'type' => $r['centre_type'], 'hod' => $r['hod'], 'nearbyTown' => $r['nearby_town'], 'facilities' => $r['facilities'],
    'sidhTcId' => $r['sidh_tc_id'],
  ];
}

function map_user(array $r): array {
  return ['id' => $r['id'], 'name' => $r['name'], 'role' => $r['role'], 'centreId' => $r['centre_id'] ?? '', 'active' => (bool)$r['active'],
    'lastLogin' => iso($r['last_login'] ?? null)];
}

/**
 * $photo: 'inline' sends the thumbnail itself (single-record views such as Track status);
 * 'url' sends a link to it, so staff lists stay small.
 */
function map_student(array $r, string $photo = 'url'): array {
  return [
    'id' => $r['id'], 'name' => $r['name'], 'father' => $r['father'], 'mother' => $r['mother'], 'dob' => $r['dob'],
    'gender' => $r['gender'], 'category' => $r['category'], 'pwd' => $r['pwd'], 'aadhaarLast4' => trim($r['aadhaar_last4']),
    'mobile' => $r['mobile'], 'email' => $r['email'], 'village' => $r['village'], 'block' => $r['block'], 'district' => $r['district'],
    'pin' => $r['pin'], 'qual' => $r['qual'], 'board' => $r['board'], 'year' => $r['pass_year'], 'pct' => $r['pct'],
    'pref1' => $r['pref1'], 'pref2' => $r['pref2'] ?? '', 'prefCentre' => $r['pref_centre'] ?? '', 'status' => $r['status'],
    'skillId' => $r['skill_id'] ?? '', 'centreId' => $r['centre_id'] ?? '', 'batchId' => $r['batch_id'] ?? '', 'score' => num($r['score']),
    'admitNo' => $r['admit_no'], 'admit' => jd($r['admit']), 'result' => jd($r['result']), 'certNo' => $r['cert_no'], 'cert' => jd($r['cert']),
    'photo' => photo_value('student', $r['id'], $r['photo_thumb'], $photo, $r['updated_at']),
    'docs' => jd($r['docs'], []), 'history' => jd($r['history'], []), 'createdAt' => iso($r['created_at']),
    'sidhId' => $r['sidh_id'], 'religion' => $r['religion'], 'employmentStatus' => $r['employment_status'],
  ];
}

function map_trainer(array $r, string $photo = 'url'): array {
  return [
    'id' => $r['id'], 'kind' => 'trainer', 'empanelNo' => $r['empanel_no'], 'name' => $r['name'], 'father' => $r['father'], 'dob' => $r['dob'],
    'gender' => $r['gender'], 'aadhaarLast4' => trim($r['aadhaar_last4']), 'mobile' => $r['mobile'], 'email' => $r['email'],
    'address' => $r['address'], 'district' => $r['district'], 'pin' => $r['pin'], 'qual' => $r['qual'], 'specialisation' => $r['specialisation'],
    'indExp' => num($r['ind_exp']), 'trnExp' => num($r['trn_exp']), 'totNo' => $r['tot_no'], 'totBody' => $r['tot_body'],
    'courses' => pg_arr($r['courses']), 'sectors' => pg_arr($r['sectors']), 'prefCentres' => pg_arr($r['pref_centres']), 'status' => $r['status'],
    'recruitmentId' => $r['recruitment_id'] ?? '', 'sidhId' => $r['sidh_id'],
    'photo' => photo_value('trainer', $r['id'], $r['photo_thumb'], $photo, $r['updated_at']),
    'docs' => jd($r['docs'], []), 'history' => jd($r['history'], []), 'empanelledAt' => iso($r['empanelled_at']), 'createdAt' => iso($r['created_at']),
  ];
}

function photo_value(string $kind, string $id, string $thumb, string $mode, ?string $updated): string {
  if ($thumb === '') return '';
  if ($mode === 'inline') return $thumb;
  return 'api.php?r=photo&kind=' . $kind . '&id=' . rawurlencode($id) . '&v=' . substr(md5((string)$updated), 0, 8);
}

function map_batch(array $r, array $studentIds): array {
  return [
    'id' => $r['id'], 'courseId' => $r['course_id'], 'centreId' => $r['centre_id'], 'start' => $r['start_date'], 'end' => $r['end_date'],
    'trainerId' => $r['trainer_id'] ?? '', 'trainer' => '', 'capacity' => (int)$r['capacity'], 'students' => $studentIds,
    'status' => $r['status'], 'trainerLog' => jd($r['trainer_log'], []), 'createdAt' => iso($r['created_at']), 'createdBy' => $r['created_by'],
    'startedAt' => iso($r['started_at']), 'completedAt' => iso($r['completed_at']), 'sidhBatchId' => $r['sidh_batch_id'],
  ];
}

/** All batches matching $where, with their trainee IDs. */
function load_batches(string $where = 'true', array $params = []): array {
  $rows = all("SELECT b.*, coalesce((SELECT string_agg(s.id, ',' ORDER BY s.id) FROM students s WHERE s.batch_id = b.id), '') AS sids
               FROM batches b WHERE $where ORDER BY b.created_at DESC", $params);
  return array_map(fn($r) => map_batch($r, $r['sids'] === '' ? [] : explode(',', $r['sids'])), $rows);
}

function map_ojt(array $r): array {
  return [
    'id' => $r['id'], 'letterNo' => $r['letter_no'], 'studentId' => $r['student_id'], 'employer' => $r['employer'], 'address' => $r['address'],
    'role' => $r['role'], 'start' => $r['start_date'], 'duration' => $r['duration'], 'status' => $r['status'], 'createdAt' => iso($r['created_at']),
    'requestedBy' => $r['requested_by'], 'requestedRole' => $r['requested_role'], 'signedAt' => iso($r['signed_at']),
    'signedBy' => $r['signed_by'], 'signedById' => $r['signed_by_id'], 'sigRef' => $r['sig_ref'],
  ];
}

function map_notif(array $r): array {
  return ['id' => 'N' . $r['id'], 'at' => iso($r['at']), 'studentId' => $r['ref_id'], 'channel' => $r['channel'], 'to' => $r['to_addr'],
    'subject' => $r['subject'], 'body' => $r['body'], 'status' => $r['status'], 'event' => $r['event']];
}

function map_notice(array $r): array {
  return [
    'id' => $r['id'], 'title' => $r['title'], 'category' => $r['category'], 'date' => $r['notice_date'], 'body' => $r['body'],
    'active' => (bool)$r['active'], 'attachDocId' => $r['attach_doc_id'] ?? '', 'attachName' => $r['attach_name'] ?? '',
    'attachType' => $r['attach_type'] ?? '', 'createdAt' => iso($r['created_at']), 'updatedAt' => iso($r['updated_at']), 'by' => $r['created_by'],
  ];
}
/** A recruitment is open until the end of its last date (Indian time). */
function map_recruitment(array $r): array {
  return [
    'id' => $r['id'], 'title' => $r['title'], 'post' => $r['post'], 'vacancies' => $r['vacancies'] === null ? null : (int)$r['vacancies'],
    'engagement' => $r['engagement'], 'description' => $r['description'], 'minQual' => $r['min_qual'], 'minAge' => (int)$r['min_age'],
    'maxAge' => (int)$r['max_age'], 'remuneration' => $r['remuneration'], 'selection' => $r['selection'], 'instructions' => $r['instructions'],
    'lastDate' => $r['last_date'], 'open' => (bool)$r['active'] && $r['last_date'] >= today(), 'active' => (bool)$r['active'],
    'attachDocId' => $r['attach_doc_id'] ?? '', 'attachName' => $r['attach_name'] ?? '', 'updatedAt' => iso($r['updated_at']),
    'docs' => array_map(fn($k, $d) => ['key' => $k, 'label' => $d['label'], 'req' => $d['req']], array_keys(TRAINER_DOCS), TRAINER_DOCS),
  ];
}
const RECRUITMENT_SQL = 'SELECT r.*, d.name AS attach_name FROM recruitments r LEFT JOIN documents d ON d.id = r.attach_doc_id';

const NOTICE_SQL = 'SELECT n.*, d.name AS attach_name, d.mime AS attach_type FROM notices n LEFT JOIN documents d ON d.id = n.attach_doc_id';

/** Settings anyone may see. Gateway details stay with staff. */
function public_settings(): array {
  $s = settings_all();
  unset($s['smsGateway'], $s['smsSender'], $s['emailFrom']);
  return $s;
}
