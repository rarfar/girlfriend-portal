const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('grievances.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grievance_id INTEGER NOT NULL,
      reply TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(grievance_id) REFERENCES grievances(id)
    )
  `);
});

db.close();
console.log("Replies table added!");
