require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Set up PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render connections
  }
});

// Create table on startup
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Postgres Database table 'users' is ready");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  }
};
initDB();

app.get("/", (req, res) => {
  res.send("Auth server running with Postgres 🚀");
});

// Signup/Login endpoint
app.post("/login", async (req, res) => {
  const { email, name } = req.body;
  const time = new Date().toISOString();

  try {
    // Postgres uses $1, $2, $3 for secure query parameters
    await pool.query(
      "INSERT INTO users (email, name, created_at) VALUES ($1, $2, $3)",
      [email, name, time]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get users (for testing)
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    // Postgres returns rows inside a 'rows' object
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));