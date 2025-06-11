// Import the necessary libraries
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const SECRET = "supersecretkey"; // Change this for production!

app.use(cors());
app.use(express.json());

// ========== LOGIN ROUTE ==========
// POST /api/login -- expects { username, password } in the body
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = new sqlite3.Database('grievances.db');
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ userId: user.id, username: user.username }, SECRET, { expiresIn: "1h" });
        res.json({ token });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    });
    db.close();
  });
});

// ========== AUTH MIDDLEWARE ==========
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ========== SUBMIT A GRIEVANCE ==========
// POST /api/grievances -- expects { title, description, severity, mood } in the body
app.post('/api/grievances', auth, (req, res) => {
  const db = new sqlite3.Database('grievances.db');
  const { title, description, severity, mood } = req.body;
  if (!title || !description || !severity || !mood)
    return res.status(400).json({ error: "All fields required" });
  const created_at = new Date().toISOString();

  db.run(
    `INSERT INTO grievances (user_id, title, description, severity, mood, content, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.userId, title, description, severity, mood, description, created_at],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
      db.close();
    }
  );
});

// ========== LIST GRIEVANCES (with replies) ==========
// GET /api/grievances -- returns all grievances for the logged-in user, each with .replies array
app.get('/api/grievances', auth, (req, res) => {
  const db = new sqlite3.Database('grievances.db');
  db.all(
    `SELECT id, title, description, severity, mood, created_at FROM grievances
     WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const grievanceIds = rows.map(g => g.id);
      if (grievanceIds.length === 0) {
        db.close();
        return res.json([]);
      }

      db.all(
        `SELECT * FROM replies WHERE grievance_id IN (${grievanceIds.map(() => '?').join(',')}) ORDER BY created_at ASC`,
        grievanceIds,
        (err2, replies) => {
          db.close();
          if (err2) return res.status(500).json({ error: err2.message });

          rows.forEach(grievance => {
            grievance.replies = replies.filter(r => r.grievance_id === grievance.id);
          });

          res.json(rows);
        }
      );
    }
  );
});

// ========== ADD A REPLY TO A GRIEVANCE ==========
// POST /api/grievances/:id/reply -- expects { reply, author } in the body
app.post('/api/grievances/:id/reply', auth, (req, res) => {
  const db = new sqlite3.Database('grievances.db');
  const grievance_id = req.params.id;
  const { reply, author } = req.body;
  if (!reply || !author) return res.status(400).json({ error: "Reply and author required" });
  const created_at = new Date().toISOString();

  db.run(
    `INSERT INTO replies (grievance_id, reply, author, created_at) VALUES (?, ?, ?, ?)`,
    [grievance_id, reply, author, created_at],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// ========== (OPTIONAL) GET REPLIES FOR ONE GRIEVANCE ==========
app.get('/api/grievances/:id/replies', auth, (req, res) => {
  const db = new sqlite3.Database('grievances.db');
  db.all(
    `SELECT * FROM replies WHERE grievance_id = ? ORDER BY created_at ASC`,
    [req.params.id],
    (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ========== START THE SERVER ==========
const PORT = 6969;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
