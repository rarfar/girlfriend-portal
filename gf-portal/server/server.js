// Import the necessary libraries
const express = require('express');           // Web framework for handling HTTP requests
const sqlite3 = require('sqlite3').verbose(); // To interact with SQLite database
const bcrypt = require('bcryptjs');           // To hash and verify passwords
const jwt = require('jsonwebtoken');          // To create and verify login tokens
const cors = require('cors');                 // Allows cross-origin requests (for frontend/backend on different ports)

const app = express();
const SECRET = "supersecretkey"; // Change this to a secure, random value for production!

app.use(cors());            // Enable CORS
app.use(express.json());    // Parse incoming JSON requests

// ========== LOGIN ROUTE ==========
// POST /api/login -- expects { username, password } in the body
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = new sqlite3.Database('grievances.db');
  
  // Find the user by username
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Compare provided password with the hashed password in DB
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        // If password matches, create a token (JWT)
        const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });
        res.json({ token }); // Send token to client
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    });
    db.close();
  });
});

// ========== AUTH MIDDLEWARE ==========
// Checks if a request has a valid JWT token before letting it through
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET); // Sets req.user with decoded token info
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ========== SUBMIT A GRIEVANCE ==========
// POST /api/grievances -- expects { content } in the body, must be logged in
app.post('/api/grievances', auth, (req, res) => {
  const db = new sqlite3.Database('grievances.db');
  const content = req.body.content;
  db.run(
    "INSERT INTO grievances (user_id, content) VALUES (?, ?)",
    [req.user.userId, content],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID }); // Returns ID of new grievance
      db.close();
    }
  );
});

// ========== LIST GRIEVANCES ==========
// GET /api/grievances -- returns all grievances for the logged-in user
app.get('/api/grievances', auth, (req, res) => {
  const db = new sqlite3.Database('grievances.db');
  db.all(
    "SELECT content, created_at FROM grievances WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows); // Send all grievances for the user
      db.close();
    }
  );
});

// ========== START THE SERVER ==========
const PORT = 6969;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
