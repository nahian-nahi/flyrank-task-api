// ---------------------------------------------------------------
// Task API — a small CRUD API for managing a to-do list.
// Data lives only in memory (no database yet — that's next week).
// ---------------------------------------------------------------

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiDocument = require("./openapi.json");

const app = express();
const PORT = 3000;

// Lets Express automatically parse JSON request bodies into req.body
app.use(express.json());

// -----------------------------------------------------------------
// Stage 2: our "database" — just a list living in memory.
// Restarting the server wipes this back to the 3 seed tasks.
// -----------------------------------------------------------------
let tasks = [
  { id: 1, title: "Buy milk", done: false },
  { id: 2, title: "Walk the dog", done: false },
  { id: 3, title: "Finish assignment", done: true },
];

// Keeps track of the next id to hand out when a task is created.
let nextId = 4;

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
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});

// -----------------------------------------------------------------
// Stage 3: Create — POST a new task, with validation
// -----------------------------------------------------------------

app.post("/tasks", (req, res) => {
  const { title } = req.body;

  // The server never trusts the client: check the input before using it.
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Field 'title' is required and cannot be empty" });
  }

  const newTask = {
    id: nextId,
    title: title.trim(),
    done: false,
  };

  nextId += 1;
  tasks.push(newTask);

  res.status(201).json(newTask);
});

// -----------------------------------------------------------------
// Stage 4: Update & Delete
// -----------------------------------------------------------------

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const { title, done } = req.body;

  // Reject a body that has nothing usable in it.
  if (title === undefined && done === undefined) {
    return res.status(400).json({ error: "Provide at least 'title' or 'done' to update" });
  }

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Field 'title' cannot be empty" });
    }
    task.title = title.trim();
  }

  if (done !== undefined) {
    if (typeof done !== "boolean") {
      return res.status(400).json({ error: "Field 'done' must be true or false" });
    }
    task.done = done;
  }

  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  tasks.splice(index, 1);

  res.status(204).send();
});

// -----------------------------------------------------------------
// ★ Extras (optional): filtering, search, stats, reset
// -----------------------------------------------------------------

app.get("/stats", (req, res) => {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  res.json({ total, done, open: total - done });
});

app.post("/reset", (req, res) => {
  tasks = [
    { id: 1, title: "Buy milk", done: false },
    { id: 2, title: "Walk the dog", done: false },
    { id: 3, title: "Finish assignment", done: true },
  ];
  nextId = 4;
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