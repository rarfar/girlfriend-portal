// save as update_grievances_schema.js in your server folder
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('grievances.db');

db.serialize(() => {
  db.run('ALTER TABLE grievances ADD COLUMN title TEXT;', (e) => {});
  db.run('ALTER TABLE grievances ADD COLUMN description TEXT;', (e) => {});
  db.run('ALTER TABLE grievances ADD COLUMN severity INTEGER;', (e) => {});
  db.run('ALTER TABLE grievances ADD COLUMN mood TEXT;', (e) => {});
});

db.close();
console.log("Grievances table updated!");
