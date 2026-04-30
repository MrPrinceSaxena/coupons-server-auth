require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ---------- DATABASE ---------- */
const db = new sqlite3.Database("./users.db");

db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
)
`);

/* ---------- TEST ROUTE ---------- */
app.get("/", (req,res)=>{
  res.send("Auth API Running 🚀");
});

/* ---------- SIGNUP ---------- */
app.post("/signup",(req,res)=>{
  const {name,email,password} = req.body;
  console.log("Signup:",req.body);

  db.run(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [name,email,password],
    function(err){
      if(err) return res.status(400).json({error:"User already exists"});
      res.json({message:"User created",id:this.lastID});
    }
  );
});

/* ---------- LOGIN ---------- */
app.post("/login",(req,res)=>{
  const {email,password} = req.body;

  db.get(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email,password],
    (err,user)=>{
      if(!user) return res.status(401).json({error:"Invalid credentials"});
      res.json({message:"Login success",user});
    }
  );
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log("Server running on port",PORT));