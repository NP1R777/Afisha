# AGENTS.md

## Cursor Cloud specific instructions

### Repository layout (important)
The `main` branch is essentially empty (only `.gitignore`). The real application
lives in feature branches. The most complete, integrated branch is `test_branch`
(both services + the latest DB dump); the `frontend` and `backend` branches are
subsets. Do development work from the branch that actually contains the code.

This is **"Афиша Норильска"**, a Russian-language events/poster app:
- `backend/` — FastAPI + PostgreSQL (SQLAlchemy async, Alembic, `databases`).
- `frontend/` — React + TypeScript + Vite + Chakra UI.
- Optional/not required for the core app: MinIO (image storage), Milvus + Attu
  (vector search) and Mistral (AI assistant). The `/assistant/*` endpoints need a
  `MISTRAL_API_KEY` and a running Milvus; everything else works without them.

### Services overview
| Service  | Dir         | Dev command                                            | Port |
|----------|-------------|--------------------------------------------------------|------|
| Backend  | `backend/`  | run uvicorn from `backend/app` (see gotcha below)      | 8000 |
| Frontend | `frontend/` | `npm run dev -- --host 0.0.0.0 --port 5173`            | 5173 |
| Postgres | system      | `sudo pg_ctlcluster 17 main start`                     | 5432 |

### Non-obvious gotchas
- **Run uvicorn from `backend/app`, not `backend/`.** The README says
  `uvicorn app.main:app`, but the code imports top-level packages (`from src...`,
  `from core...`), so it only resolves when the working dir is `backend/app`:
  ```bash
  cd backend/app && ../venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
  ```
  Alembic, by contrast, must be run from `backend/` (its `env.py` does
  `from app.core...`): `cd backend && ./venv/bin/alembic upgrade head`.
- **PostgreSQL 17 is required.** The dumps are from PG 17.4 and contain
  `SET transaction_timeout` (a PG17 GUC) which older psql rejects under
  `ON_ERROR_STOP`.
- **Duplicate / legacy tables.** The DB has both singular and plural table names
  (`user`/`users`, `event`/`events`, `group_event`/`groups_event`, ...). The ORM
  models map to the **plural** tables (`users`, `events`, `news`, `roles`,
  `groups_event`, ...). When inspecting data, query `users`/`events`, not the
  singular legacy tables.
- **`.env` files are gitignored** and must exist for the apps to run:
  - `backend/.env`: copy `backend/.env.example`, then set `DB_NAME=hakaton`
    (to match the dump), `DB_USER=postgres`, `DB_PASSWORD=postgres`,
    `DB_ADDRESS=localhost:5432`.
  - `frontend/.env`: `VITE_API_URL=http://localhost:8000`.
- **Verbose SQL logs.** `backend/app/core/session.py` sets `echo=True`, so the
  backend prints every SQL statement; uvicorn access logs get buried in it.

### First-time DB setup (only when the `hakaton` DB is missing)
The dump declares `LOCALE = 'ru-RU'`, which is not a valid glibc locale name, so a
raw restore fails. Generate `ru_RU.UTF-8` and rewrite the locale on the fly
(this does **not** modify the committed dump):
```bash
sudo locale-gen ru_RU.UTF-8
cd backend
sed "s/LOCALE = 'ru-RU'/LOCALE = 'ru_RU.UTF-8'/" \
  db_dumps/hakaton_20260615_141544.sql \
  | PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -v ON_ERROR_STOP=on
cd backend && ./venv/bin/alembic upgrade head   # schema is already current; no-op if so
```
Use the newest `backend/db_dumps/*.sql` file.

### Lint / build (frontend)
- Lint: `cd frontend && npm run lint` (currently 0 errors, ~77 warnings).
- Build: `cd frontend && npm run build`.
- The backend has no test suite or linter configured.
