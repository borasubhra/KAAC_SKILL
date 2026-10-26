-- KAAC Skill Development & Entrepreneurship portal: PostgreSQL schema.
-- Applied by app/cli/migrate.php on every container start; every statement is idempotent.

CREATE TABLE IF NOT EXISTS sectors (
  id          text PRIMARY KEY CHECK (id ~ '^[A-Z0-9-]+$'),
  name        text NOT NULL,
  descr       text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS courses (
  id          text PRIMARY KEY CHECK (id ~ '^[A-Z0-9-]+$'),
  sector_id   text NOT NULL REFERENCES sectors(id),
  name        text NOT NULL,
  nsqf        int  NOT NULL DEFAULT 4,
  hours       int  NOT NULL DEFAULT 300,
  min_qual    text NOT NULL,
  min_age     int  NOT NULL DEFAULT 18,
  max_age     int  NOT NULL DEFAULT 35,
  seats       int  NOT NULL DEFAULT 30,
  active      boolean NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS centres (
  id          text PRIMARY KEY CHECK (id ~ '^[A-Z0-9-]+$'),
  name        text NOT NULL,
  address     text NOT NULL DEFAULT '',
  district    text NOT NULL DEFAULT '',
  sectors     text[] NOT NULL DEFAULT '{}',
  capacity    int  NOT NULL DEFAULT 100,
  phone       text NOT NULL DEFAULT '',
  active      boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS users (
  id          text PRIMARY KEY CHECK (id ~ '^[a-z0-9._-]+$'),
  name        text NOT NULL,
  role        text NOT NULL,
  centre_id   text REFERENCES centres(id),
  active      boolean NOT NULL DEFAULT true,
  pw_hash     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_login  timestamptz
);

-- One row ('main') holding the portal settings as JSON.
CREATE TABLE IF NOT EXISTS settings (
  id          text PRIMARY KEY,
  data        jsonb NOT NULL
);

-- Uploaded files. The bytes live on disk under STORAGE_DIR; only metadata is here.
CREATE TABLE IF NOT EXISTS documents (
  id          text PRIMARY KEY,
  owner_type  text NOT NULL CHECK (owner_type IN ('student','trainer','notice')),
  owner_id    text NOT NULL,
  doc_key     text NOT NULL,
  name        text NOT NULL,
  mime        text NOT NULL,
  size        int  NOT NULL,
  path        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documents_owner ON documents(owner_type, owner_id);

CREATE TABLE IF NOT EXISTS batches (
  id           text PRIMARY KEY,
  course_id    text NOT NULL REFERENCES courses(id),
  centre_id    text NOT NULL REFERENCES centres(id),
  start_date   date NOT NULL,
  end_date     date NOT NULL CHECK (end_date > start_date),
  trainer_id   text,
  capacity     int  NOT NULL CHECK (capacity > 0),
  status       text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','ongoing','completed')),
  trainer_log  jsonb NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   text NOT NULL,
  started_at   timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS students (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  father        text NOT NULL,
  mother        text NOT NULL DEFAULT '',
  dob           date NOT NULL,
  gender        text NOT NULL,
  category      text NOT NULL,
  pwd           text NOT NULL DEFAULT 'No',
  aadhaar_last4 char(4) NOT NULL,
  aadhaar_hmac  text NOT NULL,          -- keyed hash for duplicate checks; the full number is never stored
  mobile        text NOT NULL,
  email         text NOT NULL DEFAULT '',
  village       text NOT NULL,
  block         text NOT NULL DEFAULT '',
  district      text NOT NULL,
  pin           text NOT NULL,
  qual          text NOT NULL,
  board         text NOT NULL DEFAULT '',
  pass_year     text NOT NULL DEFAULT '',
  pct           text NOT NULL DEFAULT '',
  pref1         text NOT NULL REFERENCES courses(id),
  pref2         text REFERENCES courses(id),
  pref_centre   text REFERENCES centres(id),
  status        text NOT NULL DEFAULT 'submitted',
  skill_id      text REFERENCES courses(id),
  centre_id     text REFERENCES centres(id),
  batch_id      text REFERENCES batches(id),
  score         numeric,
  admit_no      text UNIQUE,
  admit         jsonb,
  result        jsonb,
  cert_no       text UNIQUE,
  cert          jsonb,
  photo_thumb   text NOT NULL DEFAULT '',  -- small JPEG data URL shown on admit cards
  docs          jsonb NOT NULL DEFAULT '[]',
  history       jsonb NOT NULL DEFAULT '[]',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
-- Only one open application per Aadhaar number.
-- (the 'one open application per Aadhaar' index is defined in the CR changes section below)
CREATE INDEX IF NOT EXISTS students_status ON students(status);
CREATE INDEX IF NOT EXISTS students_centre ON students(centre_id);
CREATE INDEX IF NOT EXISTS students_batch ON students(batch_id);

CREATE TABLE IF NOT EXISTS trainers (
  id            text PRIMARY KEY,
  empanel_no    text UNIQUE,
  name          text NOT NULL,
  father        text NOT NULL,
  dob           date NOT NULL,
  gender        text NOT NULL,
  aadhaar_last4 char(4) NOT NULL,
  aadhaar_hmac  text NOT NULL,
  mobile        text NOT NULL,
  email         text NOT NULL,
  address       text NOT NULL,
  district      text NOT NULL,
  pin           text NOT NULL,
  qual          text NOT NULL,
  specialisation text NOT NULL,
  ind_exp       numeric NOT NULL DEFAULT 0,
  trn_exp       numeric NOT NULL DEFAULT 0,
  tot_no        text NOT NULL DEFAULT '',
  tot_body      text NOT NULL DEFAULT '',
  courses       text[] NOT NULL DEFAULT '{}',
  sectors       text[] NOT NULL DEFAULT '{}',
  pref_centres  text[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'submitted',
  photo_thumb   text NOT NULL DEFAULT '',
  docs          jsonb NOT NULL DEFAULT '[]',
  history       jsonb NOT NULL DEFAULT '[]',
  empanelled_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS trainers_one_per_aadhaar ON trainers(aadhaar_hmac) WHERE status <> 'rejected';

DO $$ BEGIN
  ALTER TABLE batches ADD CONSTRAINT batches_trainer_fk FOREIGN KEY (trainer_id) REFERENCES trainers(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS ojt_letters (
  id            text PRIMARY KEY,
  letter_no     text NOT NULL UNIQUE,
  student_id    text NOT NULL REFERENCES students(id),
  employer      text NOT NULL,
  address       text NOT NULL,
  role          text NOT NULL,
  start_date    date NOT NULL,
  duration      text NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed')),
  requested_by  text NOT NULL,
  requested_role text NOT NULL,
  signed_at     timestamptz,
  signed_by     text,
  signed_by_id  text,
  sig_ref       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  ref_id      text NOT NULL,
  channel     text NOT NULL CHECK (channel IN ('SMS','Email')),
  to_addr     text NOT NULL,
  subject     text NOT NULL DEFAULT '',
  body        text NOT NULL,
  status      text NOT NULL,
  event       text NOT NULL
);
CREATE INDEX IF NOT EXISTS notifications_at ON notifications(at DESC);

CREATE TABLE IF NOT EXISTS notices (
  id           text PRIMARY KEY,
  title        text NOT NULL,
  category     text NOT NULL,
  notice_date  date NOT NULL,
  body         text NOT NULL DEFAULT '',
  active       boolean NOT NULL DEFAULT true,
  attach_doc_id text REFERENCES documents(id) ON DELETE SET NULL,
  created_by   text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Online courses and job openings: rows override or extend the defaults built into app.js.
CREATE TABLE IF NOT EXISTS ext_items (
  kind        text NOT NULL CHECK (kind IN ('courses','jobs')),
  id          text NOT NULL,
  data        jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, id)
);

-- Atomic sequence numbers for application, admit card, certificate and letter numbers.
CREATE TABLE IF NOT EXISTS counters (
  name        text PRIMARY KEY,
  n           int NOT NULL
);

-- Sliding-window rate limiting for login, tracking and public submissions.
CREATE TABLE IF NOT EXISTS rate_events (
  bucket      text NOT NULL,
  at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_events_bucket ON rate_events(bucket, at);

-- Every staff action, for accountability.
CREATE TABLE IF NOT EXISTS audit_log (
  id          bigserial PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  user_id     text,
  action      text NOT NULL,
  target      text NOT NULL DEFAULT '',
  detail      jsonb NOT NULL DEFAULT '{}',
  ip          text NOT NULL DEFAULT ''
);

/* ---------- Change requirements CR-01 to CR-10 (26 Oct 2026) ----------
   Written so they also upgrade a database created by the earlier version. */

-- CR-01: student accounts. An account is not an application; students apply separately.
CREATE TABLE IF NOT EXISTS applicants (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  email       text NOT NULL,
  mobile      text NOT NULL,
  pw_hash     text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_login  timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS applicants_email ON applicants(lower(email));

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash   text PRIMARY KEY,
  applicant_id bigint NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  expires_at   timestamptz NOT NULL,
  used_at      timestamptz
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS applicant_id bigint REFERENCES applicants(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS approved_at timestamptz;
CREATE INDEX IF NOT EXISTS students_applicant ON students(applicant_id);

-- Only one open application per Aadhaar number, and per student account.
DROP INDEX IF EXISTS students_one_active_per_aadhaar;
CREATE UNIQUE INDEX IF NOT EXISTS students_one_open_per_aadhaar ON students(aadhaar_hmac)
  WHERE status NOT IN ('rejected','notshortlisted','notapproved','notselected','certified','failed');
CREATE UNIQUE INDEX IF NOT EXISTS students_one_open_per_applicant ON students(applicant_id)
  WHERE applicant_id IS NOT NULL AND status NOT IN ('rejected','notshortlisted','notapproved','notselected','certified','failed');

-- CR-04 / CR-10: the Supervising Officer and Monitoring Officer are one person and one account.
UPDATE users SET role = 'supervising' WHERE role = 'monitoring';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','dealing','supervising','jts','centre','training'));

-- CR-09: centre master details. `capacity` is the most trainees one batch at the centre can hold.
ALTER TABLE centres ADD COLUMN IF NOT EXISTS centre_type text NOT NULL DEFAULT 'Government institute';
ALTER TABLE centres ADD COLUMN IF NOT EXISTS hod text NOT NULL DEFAULT '';
ALTER TABLE centres ADD COLUMN IF NOT EXISTS nearby_town text NOT NULL DEFAULT '';
ALTER TABLE centres ADD COLUMN IF NOT EXISTS facilities text NOT NULL DEFAULT '';

-- CR-02 / CR-06: emails are queued here and sent by the mail worker (app/cli/worker.php).
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS attempts int NOT NULL DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS last_error text;
CREATE INDEX IF NOT EXISTS notifications_queue ON notifications(id) WHERE status = 'Queued';

/* ---------- Recruitment advertisements (trainer engagement, Nov 2026) ---------- */
CREATE TABLE IF NOT EXISTS recruitments (
  id            text PRIMARY KEY,
  title         text NOT NULL,
  post          text NOT NULL DEFAULT 'Trainer',
  vacancies     int,
  engagement    text NOT NULL DEFAULT '',
  description   text NOT NULL DEFAULT '',
  min_qual      text NOT NULL DEFAULT 'Class 12',
  min_age       int NOT NULL DEFAULT 21,
  max_age       int NOT NULL DEFAULT 60,
  remuneration  text NOT NULL DEFAULT '',
  selection     text NOT NULL DEFAULT '',
  instructions  text NOT NULL DEFAULT '',
  last_date     date NOT NULL,             -- applications are accepted up to the end of this day (IST)
  attach_doc_id text REFERENCES documents(id) ON DELETE SET NULL,
  active        boolean NOT NULL DEFAULT true,
  created_by    text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (min_age <= max_age)
);
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS recruitment_id text REFERENCES recruitments(id);
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_owner_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_owner_type_check CHECK (owner_type IN ('student','trainer','notice','recruitment'));

/* ---------- Skill India Digital Hub (SIDH) common parameters ----------
   Identifiers and fields SIDH records, so the portal's data can be uploaded to or reconciled with SIDH. */
ALTER TABLE courses  ADD COLUMN IF NOT EXISTS job_role      text NOT NULL DEFAULT '';  -- official job role name
ALTER TABLE courses  ADD COLUMN IF NOT EXISTS qp_code       text NOT NULL DEFAULT '';  -- Qualification Pack code, e.g. ELE/Q3101
ALTER TABLE courses  ADD COLUMN IF NOT EXISTS ssc           text NOT NULL DEFAULT '';  -- Sector Skill Council
ALTER TABLE centres  ADD COLUMN IF NOT EXISTS sidh_tc_id    text NOT NULL DEFAULT '';  -- Training Centre ID issued on SIDH
ALTER TABLE batches  ADD COLUMN IF NOT EXISTS sidh_batch_id text NOT NULL DEFAULT '';
ALTER TABLE students ADD COLUMN IF NOT EXISTS sidh_id       text NOT NULL DEFAULT '';  -- candidate ID on SIDH
ALTER TABLE students ADD COLUMN IF NOT EXISTS religion      text NOT NULL DEFAULT '';
ALTER TABLE students ADD COLUMN IF NOT EXISTS employment_status text NOT NULL DEFAULT '';
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS sidh_id       text NOT NULL DEFAULT '';  -- trainer ID on SIDH
