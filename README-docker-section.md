## Run the whole stack with Docker (BE-04)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) to be running.

```bash
cp .env.example .env      # .env is gitignored; .env.example is committed
docker compose up --build
```

The API is then on **http://localhost:3000** (Swagger at `/docs`), same as before. Stop it with `Ctrl+C`, or run in the background with `docker compose up -d --build`.

**How it's wired**

| File | Role |
|------|------|
| `Dockerfile` | Builds the app image (Node 22, installs dependencies inside the Linux image) |
| `docker-compose.yml` | Starts the app, loads `.env`, and mounts the named volume `task-data` at `/data` |
| `.env` / `.env.example` | `DB_PATH=/data/tasks.db` — where the SQLite file lives inside the container |
| `.dockerignore` | Keeps the host's `node_modules` out of the image (a Windows build of `better-sqlite3` would break on Linux) |

**Why no separate database container:** SQLite is a single file, not a server, so there is nothing to run "next to" the app. The database lives on a Docker **volume** instead, which is what makes the data outlive the container. (Q&A confirmed SQLite is acceptable for this assignment; the brief's Postgres container would be the equivalent step for a client/server database.)

**What changed vs. Assignment 2 (honest version):** only `db.js`, which now reads the file path from `DB_PATH` instead of hard-coding `tasks.db`. `index.js` — every route and all validation — is untouched. The "swap the in-memory store for a real repository" step was already done in Assignment 2, when the array was replaced by SQLite behind the same API.

### Proving persistence across app + container restarts

```bash
docker compose up -d --build
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Survives Docker"}'
curl http://localhost:3000/tasks                 # note the new task

docker compose restart                           # restart the app container
curl http://localhost:3000/tasks                 # still there

docker compose down                              # remove the container entirely
docker compose up -d                             # brand-new container, same volume
curl http://localhost:3000/tasks                 # still there
```

The task survives because it is stored in the `task-data` volume, not in the container's own filesystem. (`docker compose down -v` would delete the volume and wipe the data — that is the one command that resets it.)

_(Paste your own terminal output / screenshot of this check here.)_

