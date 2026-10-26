# KAAC Skill Development & Entrepreneurship portal

Web portal for the Skill Development & Entrepreneurship Department, Karbi Anglong Autonomous Council:
student and trainer registration, document verification, admit cards, batches, results, certificates
that employers can verify, and on-the-job training (OJT) letters.

- **Front end:** `public/` (HTML, CSS, JavaScript; no build step)
- **Back end:** PHP 8.3 (`app/`, plain PHP with PDO, no framework)
- **Database:** PostgreSQL 16 (`db/schema.sql`)
- **Runs in:** Docker (Apache + PHP container, PostgreSQL container)

## Run it on Windows (Docker Desktop)

1. Start **Docker Desktop** and wait until it says it is running.
2. Open **PowerShell** and run:

   ```powershell
   cd C:\Users\<you>\Desktop\Projects
   git clone https://github.com/borasubhra/KAAC_SKILL.git
   cd KAAC_SKILL
   docker compose up -d --build
   ```

   The first build downloads PHP and PostgreSQL and takes a few minutes. Later starts take seconds.
   If you still have the old `kaac-portal` container on port 8080, remove it first: `docker rm -f kaac-portal`.

3. Open **http://localhost:8080**.

Without a `.env` file the portal runs in **development mode**: eight demo officer accounts are created,
and the login page lists them (for example `admin` / `Admin@123`, `dealing` / `Deal@123`).
The registration forms show a *Fill a test number* link that generates a valid test Aadhaar number.

Useful commands (run in the `KAAC_SKILL` folder):

| What | Command |
|---|---|
| Stop | `docker compose down` |
| Start again | `docker compose up -d` |
| After pulling new code | `docker compose up -d --build` |
| See logs | `docker compose logs -f app` |
| Delete all data and start fresh | `docker compose down -v` |
| Run the API test suite (on a fresh database) | `docker compose down -v; docker compose up -d --build`, then `php tests/smoke_test.php http://localhost:8080` (needs PHP on your PC) |

### Looking at the database

PostgreSQL is reachable from your own computer only, on port **5433**:

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `kaac` |
| User | `kaac` |
| Password | `kaac-local-dev-password` (development default) |

Use pgAdmin, DBeaver, or `docker compose exec db psql -U kaac kaac`.

## How it fits together

```
Browser ──► Apache ──► public/index.html, assets/           (static files)
                   └─► public/api.php ──► app/router.php     (every data request)
                                           ├─ app/auth.php       sessions, roles
                                           ├─ app/handlers/*.php  public, staff, admin endpoints
                                           ├─ app/notify.php      status changes + SMS/email log
                                           └─ app/files.php       uploads (stored outside the web root)
                                                     │
                                                     ▼
                                              PostgreSQL (db container)
```

- The browser never sees data it is not entitled to. Visitors get courses, centres and notices; an applicant
  gets only their own application (ID + date of birth); a Centre Manager gets only their centre's trainees.
- Every workflow step (verify, admit card, select, batch, results, certificate, OJT signature) is a server
  endpoint that checks the officer's role **and** the record's current status before changing anything.
- Application, admit card, certificate and letter numbers come from PostgreSQL counters, so two people
  submitting at the same moment can never get the same number.
- `app/cli/migrate.php` runs on every container start. It creates missing tables and, on an empty database,
  loads the courses, sectors, centres and settings from `db/seed.json` and creates the `admin` account.

### Main tables

| Table | Holds |
|---|---|
| `students`, `trainers` | Applications. Aadhaar is stored as the last 4 digits plus a keyed hash (for duplicate checks) — never the full number. |
| `documents` | Uploaded file details. The files themselves are in the `uploads` Docker volume, outside the web root. |
| `batches`, `ojt_letters` | Training batches and recommendation letters |
| `courses`, `sectors`, `centres`, `settings` | Master data, editable by the administrator |
| `users` | Officer accounts (bcrypt password hashes) |
| `notices`, `ext_items` | Website notices, online courses and job openings |
| `notifications` | Every SMS/email the portal generated |
| `audit_log` | Every staff action and document view, with user and IP |
| `counters`, `rate_events` | Number sequences and rate limiting |

## Security

- Staff log in with server-side sessions (HttpOnly, SameSite=Strict cookie). Passwords are bcrypt-hashed and
  never leave the server. Accounts lock for 15 minutes after 5 wrong passwords.
- Disabling an account or changing a role takes effect on the officer's next click.
- Every change request must carry a custom header, which blocks cross-site request forgery.
- Uploads are checked by their real content (JPG, PNG or PDF only, 3 MB per image, 2 MB per PDF), renamed to
  unguessable IDs, and served only to officers allowed to see them.
- Applicant lookups, registrations, logins and certificate checks are rate-limited per IP address. The limits
  are generous enough for a Common Service Centre registering many people from one connection.
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

   The app refuses to start in production with development values.
2. Put the portal behind **HTTPS** (for example a reverse proxy such as nginx or Caddy with a certificate,
   or the State Data Centre's load balancer). Session cookies become `Secure` automatically behind HTTPS
   when the proxy sends `X-Forwarded-Proto: https`. Set `TRUSTED_PROXIES` in `.env` to the proxy's address so
   rate limits count each visitor separately instead of treating all traffic as one.
3. Remove the `ports:` entry of the `db` service in `docker-compose.yml` unless you need direct access.
4. Log in as `admin`, create one account per officer under **Users & roles**, and fill in **Settings**.
5. Back up both volumes regularly:

   ```bash
   docker compose exec db pg_dump -U kaac kaac > backup-$(date +%F).sql
   docker run --rm -v kaac_skill_uploads:/data -v "$PWD":/backup alpine tar czf /backup/uploads-$(date +%F).tgz -C /data .
   ```

### Still to do before real use

- **SMS and email delivery.** Every message is generated and logged (Staff area → *SMS & email log*),
  but nothing is sent yet. Sending needs a DLT-registered SMS gateway account and a mail server; add the
  sending code where `notify()` in `app/notify.php` inserts into `notifications`, and keep the API keys in `.env`.
- **Aadhaar compliance.** Copies of Aadhaar cards are uploaded as documents. Under UIDAI rules these should be
  encrypted at rest (for example an encrypted disk for the uploads volume) and access-logged (already done in
  `audit_log`). Confirm the department's obligations before collecting real Aadhaar copies.
- **Hosting review.** A government deployment usually needs a security audit (for example by a CERT-In
  empanelled auditor) before going live.
