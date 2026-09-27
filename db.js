// ---------------------------------------------------------------
// db.js — sets up the SQLite database and exports the connection.
// This is the ONLY file that knows SQL exists; index.js just calls
// plain functions and doesn't care that there's a database behind them.
// ---------------------------------------------------------------

const Database = require("better-sqlite3");

// This creates tasks.db in the project folder if it doesn't exist yet,
// and opens it if it does. Nothing here wipes existing data.
const db = new Database("tasks.db");

// Create the table if it doesn't already exist.
// - id is the primary key, and AUTOINCREMENT makes SQLite hand out
//   ever-increasing ids, same behavior as our old nextId counter.
// - done is stored as an INTEGER (0 or 1) because SQLite has no
//   native boolean type; we convert it to true/false in JS when we
//   read rows back out (see toTaskObject in index.js).
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

// Seed the table with the same 3 example tasks as Assignment 1 —
// but only if the table is currently empty, so restarting the server
// never duplicates or resets real data.
const row = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();
if (row.count === 0) {
  const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  insert.run("Buy milk", 0);
  insert.run("Walk the dog", 0);
  insert.run("Finish assignment", 1);
}

module.exports = db;
