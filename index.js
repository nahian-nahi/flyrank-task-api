// ---------------------------------------------------------------
// Task API — a small CRUD API for managing a to-do list.
// Data lives only in memory (no database yet — that's next week).
// ---------------------------------------------------------------

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiDocument = require("./openapi.json");
const db = require("./db");

const app = express();
const PORT = 3000;

// Lets Express automatically parse JSON request bodies into req.body
app.use(express.json());

// -----------------------------------------------------------------
// W3 · A1: storage is now SQLite (tasks.db) instead of an in-memory
// array. The API below doesn't know or care — it just calls these
// small helper functions. That's the whole point of this assignment:
// the storage layer changed, nothing above it did.
// -----------------------------------------------------------------

// SQLite has no boolean type, so `done` is stored as 0/1.
// This converts a raw database row into the same shape the API
// has always returned: { id, title, done: true/false }.
function toTaskObject(row) {
  return { id: row.id, title: row.title, done: Boolean(row.done) };
}

const statements = {
  getAll: db.prepare("SELECT * FROM tasks"),
  getById: db.prepare("SELECT * FROM tasks WHERE id = ?"),
  insert: db.prepare("INSERT INTO tasks (title, done) VALUES (?, 0)"),
  updateTitle: db.prepare("UPDATE tasks SET title = ? WHERE id = ?"),
  updateDone: db.prepare("UPDATE tasks SET done = ? WHERE id = ?"),
  delete: db.prepare("DELETE FROM tasks WHERE id = ?"),
  count: db.prepare("SELECT COUNT(*) AS total, SUM(done) AS done FROM tasks"),
};

// -----------------------------------------------------------------
// Stage 1: root and health endpoints
// -----------------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks", "/tasks/:id", "/health", "/docs"],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// -----------------------------------------------------------------
// Stage 2: Read — list all tasks, or get a single task by id
// -----------------------------------------------------------------

app.get("/tasks", (req, res) => {
  const rows = statements.getAll.all();
  res.json(rows.map(toTaskObject));
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = statements.getById.get(id);

  if (!row) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(toTaskObject(row));
});

// -----------------------------------------------------------------
// Stage 3: Create — POST a new task, with validation
// -----------------------------------------------------------------

app.post("/tasks", (req, res) => {
  const body = req.body || {};
  const { title } = body;

  // The server never trusts the client: check the input before using it.
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Field 'title' is required and cannot be empty" });
  }

  const result = statements.insert.run(title.trim());
  const newTask = statements.getById.get(result.lastInsertRowid);

  res.status(201).json(toTaskObject(newTask));
});

// -----------------------------------------------------------------
// Stage 4: Update & Delete
// -----------------------------------------------------------------

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = statements.getById.get(id);

  if (!existing) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const body = req.body || {};
  const { title, done } = body;

  // Reject a body that has nothing usable in it.
  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: "Provide at least 'title' or 'done' to update" });
  }

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Field 'title' cannot be empty" });
    }
    statements.updateTitle.run(title.trim(), id);
  }

  if (done !== undefined) {
    if (typeof done !== "boolean") {
      return res.status(400).json({ error: "Field 'done' must be true or false" });
    }
    statements.updateDone.run(done ? 1 : 0, id);
  }

  const updated = statements.getById.get(id);
  res.json(toTaskObject(updated));
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = statements.getById.get(id);

  if (!existing) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  statements.delete.run(id);

  res.status(204).send();
});

// -----------------------------------------------------------------
// ★ Extras (optional): filtering, search, stats, reset
// -----------------------------------------------------------------

app.get("/stats", (req, res) => {
  const row = statements.count.get();
  const total = row.total;
  const done = row.done || 0; // SUM() returns null when the table is empty
  res.json({ total, done, open: total - done });
});

app.post("/reset", (req, res) => {
  db.exec("DELETE FROM tasks");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'tasks'"); // restarts id numbering at 1
  statements.insert.run("Buy milk");
  statements.insert.run("Walk the dog");
  const lastId = statements.insert.run("Finish assignment").lastInsertRowid;
  statements.updateDone.run(1, lastId);
  res.json({ message: "Tasks reset to the 3 seed tasks" });
});

// Note: /tasks?done=true and /tasks?search=milk are handled by rewriting
// the GET /tasks handler above to check req.query — left as an extra
// for you to try, since it's optional and small (see the assignment's
// "Filtering with query parameters" idea).

// -----------------------------------------------------------------
// Stage 5: Swagger UI — interactive docs at /docs
// -----------------------------------------------------------------

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

// -----------------------------------------------------------------
// Start the server
// -----------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Task API listening on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
});
