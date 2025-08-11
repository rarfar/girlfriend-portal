const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const SECRET = "supersecretkey"; // Change this in production!

app.use(cors());
app.use(express.json());

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

// ========== LOGIN ==========
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = new sqlite3.Database('grievances.db');
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ userId: user.id, username: user.username }, SECRET, { expiresIn: "1h" });
        res.json({ token, username: user.username });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    });
    db.close();
  });
});

// ========== SUBMIT A GRIEVANCE ==========
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
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// ========== LIST GRIEVANCES (with replies) ==========
app.get('/api/grievances', auth, (req, res) => {
  const db = new sqlite3.Database('grievances.db');
  db.all(
    `SELECT grievances.id, grievances.title, grievances.description, grievances.severity, grievances.mood, grievances.created_at, grievances.user_id, users.username
     FROM grievances
     JOIN users ON grievances.user_id = users.id
     ORDER BY grievances.created_at DESC`,
    [],
    (err, grievances) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      const ids = grievances.map(g => g.id);
      if (ids.length === 0) {
        db.close();
        return res.json([]);
      }

      db.all(
        `SELECT * FROM replies WHERE grievance_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at ASC`,
        ids,
        (err2, replies) => {
          db.close();
          if (err2) return res.status(500).json({ error: err2.message });

          grievances.forEach(grievance => {
            grievance.replies = replies.filter(r => r.grievance_id === grievance.id);
          });

          res.json(grievances);
        }
      );
    }
  );
});

// ========== ADD REPLY ==========
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

// ========== DELETE GRIEVANCE (any user can delete) ==========
app.delete('/api/grievances/:id', auth, (req, res) => {
  const grievance_id = req.params.id;
  const db = new sqlite3.Database('grievances.db');

  db.serialize(() => {
    // Delete replies first
    db.run("DELETE FROM replies WHERE grievance_id = ?", [grievance_id], function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }

      // Then delete the grievance itself (no user check)
      db.run("DELETE FROM grievances WHERE id = ?", [grievance_id], function(err2) {
        db.close();
        if (err2) return res.status(500).json({ error: err2.message });

        if (this.changes === 0) {
          return res.status(404).json({ error: "Grievance not found" });
        }

        res.json({ success: true });
      });
    });
  });
});

// ========== GET REPLIES FOR A GRIEVANCE ==========
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

// ========== RAILWAY ==========
const path = require('path');

// Serve React build in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  
  // For any other route, serve index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}


// ========== START SERVER ==========
const PORT = process.env.PORT || 6969;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
