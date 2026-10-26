# KAAC Skill Development & Entrepreneurship portal

Web portal for the Skill Development & Entrepreneurship Department, Karbi Anglong Autonomous Council:
student accounts and online applications, a four-stage approval chain, centre allocation, batches,
trainer assignment, results, certificates that employers can verify, and on-the-job training (OJT) letters.

- **Front end:** `public/` (HTML, CSS, JavaScript; no build step)
- **Back end:** PHP 8.3 (`app/`, plain PHP with PDO, no framework)
- **Database:** PostgreSQL 16 (`db/schema.sql`)
- **Runs in:** Docker (Apache + PHP, PostgreSQL, a mail worker, and a test mailbox)

## Run it on Windows (Docker Desktop)

1. Start **Docker Desktop** and wait until it says it is running.
2. Open **PowerShell** and run:

   ```powershell
   cd C:\Users\<you>\Desktop\Projects
   git clone https://github.com/borasubhra/KAAC_SKILL.git
   cd KAAC_SKILL
   docker compose up -d --build
   ```

   No Git? Download the ZIP from GitHub (green **Code** button → **Download ZIP**), extract it, and run the
   last command in the extracted folder. The first build takes a few minutes; later starts take seconds.
   If you still have the old `kaac-portal` container on port 8080, remove it first: `docker rm -f kaac-portal`.

3. Open **http://localhost:8080** for the portal and **http://localhost:8025** for the test mailbox
   (Mailpit), where every email the portal sends appears.

Without a `.env` file the portal runs in **development mode**: demo officer accounts are created and the
login page lists them. The application forms show a *Fill a test number* link for a valid test Aadhaar number.

| Role | Username | Password |
|---|---|---|
| System Administrator | `admin` | `Admin@123` |
| Dealing Assistant | `dealing` | `Deal@123` |
| Supervising & Monitoring Officer | `supervising` | `Super@123` |
| Joint Secretary | `jtsecy` | `Jts@123` |
| Centre Manager (all centres) | `centre` | `Centre@123` |
| Training Manager | `training` | `Train@123` |

Students create their own accounts on the portal (**Apply online**).

Useful commands (run in the `KAAC_SKILL` folder):

| What | Command |
|---|---|
| Stop | `docker compose down` |
| Start again | `docker compose up -d` |
| After getting new code | `docker compose up -d --build` |
| See logs | `docker compose logs -f app` (or `worker` for email) |
| Delete all data and start fresh | `docker compose down -v` |
| Run the API test suite (on a fresh database) | `docker compose down -v; docker compose up -d --build`, then `php tests/smoke_test.php http://localhost:8080` (needs PHP on your PC) |

### Looking at the database

PostgreSQL is reachable from your own computer only, on port **5433** (host `localhost`, database `kaac`,
user `kaac`, password `kaac-local-dev-password` in development). Use pgAdmin, DBeaver, or
`docker compose exec db psql -U kaac kaac`.

## The application workflow (change requests CR-01 to CR-10)

```
Student ──► Dealing Assistant ──► S&M Officer ──► Joint Secretary ──► Centre Manager ──► Training Manager
 applies     verifies documents    shortlists       approves            allots centre,     assigns trainer
             │                                      (bulk email:        forms batches      to each batch
             └─ returns for re-upload / rejects       "selected")
```

| CR | What the portal does |
|---|---|
| 01 | Students create an account and log in to a dashboard listing the trades. An account is not an application. |
| 02 | Choosing a trade opens the application form with document upload. On submission the student is emailed the application number plus the message set in **Settings**. |
| 03 | The **Dealing Assistant** checks every document, then forwards the application to the S&M Officer, returns it for re-upload (the student is emailed and re-uploads from their dashboard), or rejects it. |
| 04 | **Supervising & Monitoring Officer** is one role and one account. They shortlist eligible candidates and forward them to the Joint Secretary. |
| 05 | The **Joint Secretary** approves the shortlist — all ticked candidates at once, or one at a time with a remark for those not approved. |
| 06 | Approved candidates get a "you have been selected" email. The S&M Officer (and Joint Secretary) see the **Selected list** and download it as **Excel** or **PDF** for file noting and newspaper publication. |
| 07 | The **Centre Manager** sees only selected candidates, allots them to centres offering their trade, and forms batches of one trade: at most 45 (changeable in Settings) and never more than the centre's capacity. |
| 08 | The **Training Manager** sees only the batches and assigns empanelled trainers. |
| 09 | The **System Administrator** adds existing and upcoming centres with capacity per batch, facilities, nearby town, type (Government institute or Private) and, for Government institutes, the Head of Department. |
| 10 | The administrator creates accounts for each role. A Centre Manager can cover all centres or be limited to one. |

After a batch is formed the earlier steps continue unchanged: the Centre Manager starts training and records
results, the Training Manager issues certificates, and the Joint Secretary signs OJT recommendation letters.

### Decisions taken on the open questions

The change document lists questions still to confirm with the client. Until then the portal does this;
each is a small change if the answer differs.

| Question | What the portal does now |
|---|---|
| Physical-file approval upload, or approval in the system? | Approval in the system sends the list straight to the Centre Manager. No upload step. |
| Approve the whole shortlist, or individual candidates? | Both: tick all (or some) and approve together, or open one candidate to approve or not approve with a remark. |
| Eligibility criteria for shortlisting | Each application shows whether the student meets the trade's minimum qualification and age. The officer decides; nothing is rejected automatically. |
| Mandatory documents, file types and sizes | Photo, Aadhaar, qualification certificate and residence proof are required; caste, income and bank documents are optional. JPG, PNG or PDF; 3 MB per image, 2 MB per PDF. |
| Deadline for re-upload; email the student? | The student is emailed with the Dealing Assistant's remark. There is no deadline yet. |
| Is 45 fixed or a maximum? Several batches per centre? | 45 is a maximum, adjustable in Settings, and further limited by each centre's capacity. A centre can run several batches, of the same or different trades. |
| Notify Centre/Training Managers; email students their centre, batch and trainer? | Students are emailed at every step, including centre allotment and batch. Trainers are emailed when assigned. Officers see their pending work as counts on their dashboard and menu. |

## Email

Emails are queued in the database and sent by the **worker** container, so a bulk "selected" email never
slows down the Joint Secretary's screen. Failed sends are retried up to five times.

- **Development:** emails go to **Mailpit** (http://localhost:8025). Nothing leaves your computer.
- **Production:** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM` in `.env`
  (for example the NIC mail relay or the department's mail server).
- **Staff area → SMS & email log** shows every message and whether it was sent.

## How it fits together

```
Browser ──► Apache ──► public/index.html, assets/           (static files)
                   └─► public/api.php ──► app/router.php     (every data request)
                                           ├─ app/auth.php        staff and student sessions, roles
                                           ├─ app/handlers/*.php  public, staff, admin endpoints
                                           ├─ app/notify.php      status changes + message queue
                                           ├─ app/files.php       uploads (stored outside the web root)
                                           └─ app/mail.php        SMTP client used by app/cli/worker.php
                                                     │
                                                     ▼
                                              PostgreSQL (db container)
```

- The browser never sees data it is not entitled to. Visitors get courses, centres and notices; a student gets
  only their own applications; each officer gets only the applications at their stage.
- Every workflow step is a server endpoint that checks the officer's role **and** the record's current status.
- Application, certificate, batch and letter numbers come from PostgreSQL counters, so two people submitting
  at the same moment never get the same number.
- `app/cli/migrate.php` runs on every container start. It creates or upgrades tables (an existing database from
  an earlier version is upgraded in place), and on an empty database loads the courses, sectors, centres and
  settings from `db/seed.json` and creates the `admin` account.

### Main tables

| Table | Holds |
|---|---|
| `applicants` | Student accounts (bcrypt password hashes); `password_resets` holds one-hour reset links |
| `students`, `trainers` | Applications. Aadhaar is stored as the last 4 digits plus a keyed hash (for duplicate checks) — never the full number. |
| `documents` | Uploaded file details. The files are in the `uploads` Docker volume, outside the web root. |
| `batches`, `ojt_letters` | Training batches and recommendation letters |
| `courses`, `sectors`, `centres`, `settings` | Master data, editable by the administrator |
| `users` | Officer accounts (bcrypt password hashes) |
| `notices`, `ext_items` | Website notices, online courses and job openings |
| `notifications` | Every SMS and email, with sending status |
| `audit_log` | Every staff action and document view, with user and IP |
| `counters`, `rate_events` | Number sequences and rate limiting |

## Security

- Staff and students log in with server-side sessions (HttpOnly, SameSite=Strict cookie); the two kinds of
  session are kept apart. Passwords are bcrypt-hashed. Accounts lock for 15 minutes after 5 wrong passwords.
- Disabling an account or changing a role takes effect on the officer's next click.
- Every change request must carry a custom header, which blocks cross-site request forgery.
- Uploads are checked by their real content, renamed to unguessable IDs, and served only to officers allowed
  to see them.
- Logins, sign-ups, applications, password resets, lookups and certificate checks are rate-limited per IP
  address, generously enough for a Common Service Centre registering many people from one connection.
- Apache serves only `public/`; app code, the database and uploads are not reachable from the web.
  Security headers (Content-Security-Policy, X-Frame-Options and others) are set in `docker/apache.conf`.
- OJT signature references are keyed hashes that only the server can produce.

## Going live (production checklist)

1. Copy `.env.example` to `.env` and fill in every value:
   - `APP_ENV=production`
   - `APP_SECRET` — 64 random characters (`openssl rand -hex 32`). **Never change it** once real data exists.
   - `DB_PASS` — a strong database password
   - `ADMIN_PASSWORD` — the first administrator password (change it after first login)
   - `DEMO_USERS=false`
   - `SMTP_*` — the real mail server

   The app refuses to start in production with development values.
2. Put the portal behind **HTTPS** (for example nginx or Caddy with a certificate, or the State Data Centre's
   load balancer). Set `TRUSTED_PROXIES` in `.env` to the proxy's address so rate limits count each visitor.
3. Remove the `mailpit` service, and the `ports:` entry of the `db` service, from `docker-compose.yml`.
4. Log in as `admin`, add the centres, create one account per officer under **Users & roles**, and fill in
   **Settings** (including the two email messages and the maximum batch size).
5. Back up both volumes regularly:

   ```bash
   docker compose exec db pg_dump -U kaac kaac > backup-$(date +%F).sql
   docker run --rm -v kaac_skill_uploads:/data -v "$PWD":/backup alpine tar czf /backup/uploads-$(date +%F).tgz -C /data .
   ```

### Still to do before real use

- **SMS delivery.** SMS messages are generated and logged but not sent. Sending needs a DLT-registered SMS
  gateway; add it in `app/cli/worker.php` alongside email, with the API keys in `.env`.
- **Aadhaar compliance.** Copies of Aadhaar cards are uploaded as documents. Under UIDAI rules these should be
  encrypted at rest (for example an encrypted disk for the uploads volume) and access-logged (already done in
  `audit_log`). Confirm the department's obligations before collecting real Aadhaar copies.
- **Hosting review.** A government deployment usually needs a security audit (for example by a CERT-In
  empanelled auditor) before going live.
