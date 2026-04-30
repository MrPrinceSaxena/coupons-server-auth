require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3-offline").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// Create DB (file will auto-create on Render)
const db = new sqlite3.Database("./users.db");

// Create table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      name TEXT,
      created_at TEXT
    )
  `);
});

app.get("/", (req, res) => {
  res.send("Auth server running 🚀");
});

// Signup/Login endpoint
app.post("/login", (req, res) => {
  const { email, name } = req.body;

  const time = new Date().toISOString();

  db.run(
    "INSERT INTO users (email, name, created_at) VALUES (?, ?, ?)",
    [email, name, time],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ success: true });
    }
  );
});

// Get users (for testing)
app.get("/users", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    res.json(rows);
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));