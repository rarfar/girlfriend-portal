/**
 * Migration script: SQLite to MongoDB
 *
 * This script reads data from the existing SQLite database (grievances.db)
 * and migrates it to MongoDB Atlas.
 *
 * Usage:
 * 1. Create a .env file with MONGODB_URI
 * 2. Run: npm run migrate (or: node migrate.js)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Import Mongoose models
const User = require('./models/User');
const Grievance = require('./models/Grievance');
const Reply = require('./models/Reply');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found in environment variables.');
  console.error('Create a .env file with: MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

async function migrate() {
  console.log('Starting migration from SQLite to MongoDB...\n');

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // Connect to SQLite
  const sqliteDb = new sqlite3.Database('./grievances.db', (err) => {
    if (err) {
      console.error('Could not find grievances.db - make sure it exists in the server folder');
      process.exit(1);
    }
  });
  console.log('Connected to SQLite database\n');

  // Map old SQLite IDs to new MongoDB IDs
  const userIdMap = new Map();
  const grievanceIdMap = new Map();

  // 1. Migrate Users
  console.log('=== Migrating Users ===');
  const users = await new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM users', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  console.log(`Found ${users.length} users in SQLite`);

  for (const user of users) {
    // Check if user already exists in MongoDB
    const existing = await User.findOne({ username: user.username });
    if (existing) {
      console.log(`  User "${user.username}" already exists in MongoDB, skipping`);
      userIdMap.set(user.id, existing._id);
      continue;
    }

    const newUser = await User.create({
      username: user.username,
      password: user.password  // Already hashed in SQLite
    });
    userIdMap.set(user.id, newUser._id);
    console.log(`  Migrated user: ${user.username} (${user.id} -> ${newUser._id})`);
  }

  // If no users exist, create default users
  if (users.length === 0) {
    console.log('\nNo users found in SQLite, creating default users...');
    const defaultUsers = [
      { username: 'kyra<3', password: 'stinky123' },
      { username: 'ryan<3', password: 'poopy123' }
    ];
    for (const u of defaultUsers) {
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        const hash = await bcrypt.hash(u.password, 10);
        const newUser = await User.create({
          username: u.username,
          password: hash
        });
        console.log(`  Created default user: ${u.username}`);
      }
    }
  }

  // 2. Migrate Grievances
  console.log('\n=== Migrating Grievances ===');
  const grievances = await new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM grievances', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  console.log(`Found ${grievances.length} grievances in SQLite`);

  for (const g of grievances) {
    const userId = userIdMap.get(g.user_id);
    if (!userId) {
      console.log(`  Skipping grievance ${g.id} - user_id ${g.user_id} not found in map`);
      continue;
    }

    // Check if grievance might already exist (by title and user, rough check)
    const existingGrievance = await Grievance.findOne({
      user: userId,
      title: g.title || '',
      description: g.description || g.content || ''
    });

    if (existingGrievance) {
      console.log(`  Grievance "${g.title}" appears to already exist, skipping`);
      grievanceIdMap.set(g.id, existingGrievance._id);
      continue;
    }

    const newGrievance = await Grievance.create({
      user: userId,
      title: g.title || 'Untitled',
      description: g.description || g.content || '',
      content: g.content || '',
      severity: g.severity || 3,
      mood: g.mood || 'happy',
      created_at: g.created_at ? new Date(g.created_at) : new Date()
    });
    grievanceIdMap.set(g.id, newGrievance._id);
    console.log(`  Migrated grievance: "${g.title}" (${g.id} -> ${newGrievance._id})`);
  }

  // 3. Migrate Replies
  console.log('\n=== Migrating Replies ===');
  const replies = await new Promise((resolve, reject) => {
    sqliteDb.all('SELECT * FROM replies', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  console.log(`Found ${replies.length} replies in SQLite`);

  for (const r of replies) {
    const grievanceId = grievanceIdMap.get(r.grievance_id);
    if (!grievanceId) {
      console.log(`  Skipping reply ${r.id} - grievance_id ${r.grievance_id} not found in map`);
      continue;
    }

    // Check if reply might already exist
    const existingReply = await Reply.findOne({
      grievance: grievanceId,
      reply: r.reply,
      author: r.author
    });

    if (existingReply) {
      console.log(`  Reply by "${r.author}" appears to already exist, skipping`);
      continue;
    }

    await Reply.create({
      grievance: grievanceId,
      reply: r.reply,
      author: r.author,
      created_at: r.created_at ? new Date(r.created_at) : new Date()
    });
    console.log(`  Migrated reply by "${r.author}" on grievance ${r.grievance_id}`);
  }

  // Close connections
  sqliteDb.close();
  await mongoose.connection.close();

  console.log('\n=== Migration Complete ===');
  console.log(`Users migrated: ${userIdMap.size}`);
  console.log(`Grievances migrated: ${grievanceIdMap.size}`);
  console.log(`Replies processed: ${replies.length}`);
  console.log('\nYou can now start the server with: npm start');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
