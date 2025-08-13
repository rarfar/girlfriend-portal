const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const SECRET = "supersecretkey"; // Change this in production!

app.use(cors());
app.use(express.json());

// ====== DATABASE INITIALIZATION ======
const dbInit = new sqlite3.Database('grievances.db');

dbInit.serialize(() => {
  // Create users table
  dbInit.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  // Create grievances table
  dbInit.run(`CREATE TABLE IF NOT EXISTS grievances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    title TEXT,
    description TEXT,
    severity INTEGER,
    mood TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Create replies table
  dbInit.run(`CREATE TABLE IF NOT EXISTS replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grievance_id INTEGER NOT NULL,
    reply TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(grievance_id) REFERENCES grievances(id)
  )`);

  // Insert default users if not exist
  const defaultUsers = [
    { username: 'kyra<3', password: 'stinky123' },
    { username: 'ryan<3', password: 'poopy123' }
  ];

  defaultUsers.forEach(user => {
    dbInit.get("SELECT * FROM users WHERE username = ?", [user.username], (err, row) => {
      if (err) {
        console.error("DB check error:", err);
        return;
      }
      if (!row) {
        bcrypt.hash(user.password, 10, (err, hash) => {
          if (err) {
            console.error("Password hash error:", err);
            return;
          }
          dbInit.run("INSERT INTO users (username, password) VALUES (?, ?)", [user.username, hash], (err) => {
            if (err) {
              console.error(`Error adding user ${user.username}:`, err.message);
            } else {
              console.log(`Default user added: ${user.username}`);
            }
          });
        });
      }
    });
  });
});

dbInit.close();
console.log("Database initialized and default users ensured.");

// ========== AUTH MIDDLEWARE ==========
function auth(req, res, next) {
  console.log(`Auth middleware checking token for path: ${req.path}`);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('No authorization header provided');
    return res.status(401).json({ error: "No token" });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    console.log(`Token verified for userId: ${req.user.userId}`);
    next();
  } catch (e) {
    console.log('Invalid token:', e.message);
    res.status(401).json({ error: "Invalid token" });
  }
}

// ========== LOGIN ==========
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for username: ${username}`);
  const db = new sqlite3.Database('grievances.db');
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error('DB error on login:', err);
      return res.status(500).json({ error: "DB error" });
    }
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error('bcrypt error:', err);
        return res.status(500).json({ error: "Server error" });
      }
      if (result) {
        const token = jwt.sign({ userId: user.id, username: user.username }, SECRET, { expiresIn: "1h" });
        console.log(`Login success for user: ${username}`);
        res.json({ token, username: user.username });
      } else {
        console.log(`Incorrect password for user: ${username}`);
        res.status(401).json({ error: "Invalid credentials" });
      }
    });
    db.close();
  });
});

// ========== SUBMIT A GRIEVANCE ==========
app.post('/api/grievances', auth, (req, res) => {
  console.log(`Submit grievance by userId: ${req.user.userId}`);
  const db = new sqlite3.Database('grievances.db');
  const { title, description, severity, mood } = req.body;
  if (!title || !description || !severity || !mood) {
    console.log('Missing fields in grievance submission');
    return res.status(400).json({ error: "All fields required" });
  }

  const created_at = new Date().toISOString();

  db.run(
    `INSERT INTO grievances (user_id, title, description, severity, mood, content, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.userId, title, description, severity, mood, description, created_at],
    function (err) {
      db.close();
      if (err) {
        console.error('DB error inserting grievance:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Grievance inserted with ID: ${this.lastID}`);
      res.json({ success: true, id: this.lastID });
    }
  );
});

// ========== LIST GRIEVANCES ==========
app.get('/api/grievances', auth, (req, res) => {
  console.log(`List grievances requested by userId: ${req.user.userId}`);
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
        console.error('DB error fetching grievances:', err.message);
        return res.status(500).json({ error: err.message });
      }

      const ids = grievances.map(g => g.id);
      if (ids.length === 0) {
        db.close();
        console.log('No grievances found');
        return res.json([]);
      }

      db.all(
        `SELECT * FROM replies WHERE grievance_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at ASC`,
        ids,
        (err2, replies) => {
          db.close();
          if (err2) {
            console.error('DB error fetching replies:', err2.message);
            return res.status(500).json({ error: err2.message });
          }

          grievances.forEach(grievance => {
            grievance.replies = replies.filter(r => r.grievance_id === grievance.id);
          });

          console.log(`Returning ${grievances.length} grievances with replies`);
          res.json(grievances);
        }
      );
    }
  );
});

// ========== ADD REPLY ==========
app.post('/api/grievances/:id/reply', auth, (req, res) => {
  console.log(`Add reply to grievance ID: ${req.params.id} by userId: ${req.user.userId}`);
  const db = new sqlite3.Database('grievances.db');
  const grievance_id = req.params.id;
  const { reply, author } = req.body;
  if (!reply || !author) {
    console.log('Missing reply or author in request body');
    return res.status(400).json({ error: "Reply and author required" });
  }

  const created_at = new Date().toISOString();

  db.run(
    `INSERT INTO replies (grievance_id, reply, author, created_at) VALUES (?, ?, ?, ?)`,
    [grievance_id, reply, author, created_at],
    function (err) {
      db.close();
      if (err) {
        console.error('DB error inserting reply:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Reply inserted with ID: ${this.lastID}`);
      res.json({ success: true, id: this.lastID });
    }
  );
});

// ========== DELETE GRIEVANCE ==========
app.delete('/api/grievances/:id', auth, (req, res) => {
  console.log(`Delete grievance ID: ${req.params.id} requested by userId: ${req.user.userId}`);
  const grievance_id = req.params.id;
  const db = new sqlite3.Database('grievances.db');

  db.serialize(() => {
    db.run("DELETE FROM replies WHERE grievance_id = ?", [grievance_id], function(err) {
      if (err) {
        db.close();
        console.error('DB error deleting replies:', err.message);
        return res.status(500).json({ error: err.message });
      }

      db.run("DELETE FROM grievances WHERE id = ?", [grievance_id], function(err2) {
        db.close();
        if (err2) {
          console.error('DB error deleting grievance:', err2.message);
          return res.status(500).json({ error: err2.message });
        }

        if (this.changes === 0) {
          console.log('Grievance not found to delete');
          return res.status(404).json({ error: "Grievance not found" });
        }

        console.log(`Grievance ID: ${grievance_id} deleted`);
        res.json({ success: true });
      });
    });
  });
});

// ========== GET REPLIES ==========
app.get('/api/grievances/:id/replies', auth, (req, res) => {
  console.log(`Get replies for grievance ID: ${req.params.id} requested by userId: ${req.user.userId}`);
  const db = new sqlite3.Database('grievances.db');
  db.all(
    `SELECT * FROM replies WHERE grievance_id = ? ORDER BY created_at ASC`,
    [req.params.id],
    (err, rows) => {
      db.close();
      if (err) {
        console.error('DB error fetching replies:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// ========== Serve React build in production ==========
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

// ========== Start server ==========
const PORT = process.env.PORT || 6969;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
