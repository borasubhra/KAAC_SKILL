<?php
// Maps api.php?r=<route> to handlers. GET routes only read; every POST must carry the X-KAAC header,
// which browsers will not send cross-site without permission, so other websites cannot submit on a user's behalf.
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/handlers/public.php';
require __DIR__ . '/handlers/staff.php';
require __DIR__ . '/handlers/admin.php';

const ROUTES = [
  'GET' => [
    'public' => 'h_public', 'me' => 'h_me', 'student_me' => 'h_student_me', 'verify' => 'h_verify', 'doc' => 'h_doc', 'photo' => 'h_photo',
    'staff_data' => 'h_staff_data', 'student' => 'h_student',
  ],
  'POST' => [
    'login' => 'h_login', 'logout' => 'h_logout', 'trainer_register' => 'h_trainer_register',
    'student_signup' => 'h_student_signup', 'student_login' => 'h_student_login', 'forgot_password' => 'h_forgot_password',
    'reset_password' => 'h_reset_password', 'apply' => 'h_apply', 'track' => 'h_track', 'resubmit' => 'h_resubmit',
    'app_action' => 'h_app_action', 'bulk_action' => 'h_bulk_action', 'mark_doc' => 'h_mark_doc', 'allocate' => 'h_allocate',
    'create_batch' => 'h_create_batch', 'start_batch' => 'h_start_batch', 'assign_trainer' => 'h_assign_trainer',
    'unassign_trainer' => 'h_unassign_trainer', 'trainer_action' => 'h_trainer_action', 'save_results' => 'h_save_results',
    'issue_certs' => 'h_issue_certs', 'create_ojt' => 'h_create_ojt', 'sign_ojt' => 'h_sign_ojt',
    'save_master' => 'h_save_master', 'remove_master' => 'h_remove_master', 'save_user' => 'h_save_user',
    'change_password' => 'h_change_password', 'save_settings' => 'h_save_settings', 'save_notice' => 'h_save_notice',
    'delete_notice' => 'h_delete_notice', 'save_ext' => 'h_save_ext', 'remove_ext' => 'h_remove_ext',
  ],
];

function request_input(): array {
  if ($_SERVER['REQUEST_METHOD'] === 'GET') return $_GET;
  $type = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
  if (str_starts_with($type, 'application/json')) {
    $data = json_decode((string)file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
  }
  return $_POST;
}

function run_api(): never {
  header('X-Content-Type-Options: nosniff');
  header('Referrer-Policy: same-origin');
  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
  $route = (string)($_GET['r'] ?? '');
  try {
    $handler = ROUTES[$method][$route] ?? null;
    if (!$handler) fail('Not found.', 404);
    if ($method === 'POST' && ($_SERVER['HTTP_X_KAAC'] ?? '') !== '1') fail('Request blocked.', 403);
    // A POST larger than post_max_size arrives with empty $_POST and $_FILES.
    if ($method === 'POST' && empty($_POST) && empty($_FILES) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0
      && !str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
      fail('The files are too large. Upload smaller files.', 413);
    }
    start_session();
    json_out($handler(request_input()));
  } catch (ApiError $e) {
    json_out(['error' => $e->getMessage()], $e->status);
  } catch (Throwable $e) {
    error_log('[kaac] ' . $e::class . ': ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
    json_out(['error' => is_dev() ? $e->getMessage() : 'Something went wrong. Please try again.'], 500);
  }
}
