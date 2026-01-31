require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

// Import models
const User = require('./models/User');
const Grievance = require('./models/Grievance');
const Reply = require('./models/Reply');

const app = express();
const SECRET = process.env.JWT_SECRET || "supersecretkey";

app.use(cors());
app.use(express.json());

// ====== DATABASE CONNECTION ======
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Ensure default users exist
    const defaultUsers = [
      { username: 'kyra<3', password: 'stinky123' },
      { username: 'ryan<3', password: 'poopy123' }
    ];

    for (const user of defaultUsers) {
      const exists = await User.findOne({ username: user.username });
      if (!exists) {
        const hash = await bcrypt.hash(user.password, 10);
        await User.create({ username: user.username, password: hash });
        console.log(`Default user added: ${user.username}`);
      }
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

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
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for username: ${username}`);

    const user = await User.findOne({ username });
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        SECRET,
        { expiresIn: "1h" }
      );
      console.log(`Login success for user: ${username}`);
      res.json({ token, username: user.username });
    } else {
      console.log(`Incorrect password for user: ${username}`);
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== SUBMIT A GRIEVANCE ==========
app.post('/api/grievances', auth, async (req, res) => {
  try {
    console.log(`Submit grievance by userId: ${req.user.userId}`);
    const { title, description, severity, mood } = req.body;

    if (!title || !description || !severity || !mood) {
      console.log('Missing fields in grievance submission');
      return res.status(400).json({ error: "All fields required" });
    }

    const grievance = await Grievance.create({
      user: req.user.userId,
      title,
      description,
      content: description,
      severity,
      mood
    });

    console.log(`Grievance inserted with ID: ${grievance._id}`);
    res.json({ success: true, id: grievance._id });
  } catch (err) {
    console.error('Error inserting grievance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========== LIST GRIEVANCES ==========
app.get('/api/grievances', auth, async (req, res) => {
  try {
    console.log(`List grievances requested by userId: ${req.user.userId}`);

    const grievances = await Grievance.find()
      .populate('user', 'username')
      .sort({ created_at: -1 })
      .lean();

    // Get all replies for these grievances
    const grievanceIds = grievances.map(g => g._id);
    const replies = await Reply.find({ grievance: { $in: grievanceIds } })
      .sort({ created_at: 1 })
      .lean();

    // Attach replies to grievances and format for frontend compatibility
    const result = grievances.map(g => ({
      id: g._id,
      title: g.title,
      description: g.description,
      severity: g.severity,
      mood: g.mood,
      created_at: g.created_at,
      user_id: g.user._id,
      username: g.user.username,
      replies: replies
        .filter(r => r.grievance.toString() === g._id.toString())
        .map(r => ({
          id: r._id,
          grievance_id: r.grievance,
          reply: r.reply,
          author: r.author,
          created_at: r.created_at
        }))
    }));

    console.log(`Returning ${result.length} grievances with replies`);
    res.json(result);
  } catch (err) {
    console.error('Error fetching grievances:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========== ADD REPLY ==========
app.post('/api/grievances/:id/reply', auth, async (req, res) => {
  try {
    console.log(`Add reply to grievance ID: ${req.params.id} by userId: ${req.user.userId}`);
    const { reply, author } = req.body;

    if (!reply || !author) {
      console.log('Missing reply or author in request body');
      return res.status(400).json({ error: "Reply and author required" });
    }

    const newReply = await Reply.create({
      grievance: req.params.id,
      reply,
      author
    });

    console.log(`Reply inserted with ID: ${newReply._id}`);
    res.json({ success: true, id: newReply._id });
  } catch (err) {
    console.error('Error inserting reply:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========== DELETE GRIEVANCE ==========
app.delete('/api/grievances/:id', auth, async (req, res) => {
  try {
    console.log(`Delete grievance ID: ${req.params.id} requested by userId: ${req.user.userId}`);

    // Delete all replies first
    await Reply.deleteMany({ grievance: req.params.id });

    // Delete the grievance
    const result = await Grievance.findByIdAndDelete(req.params.id);

    if (!result) {
      console.log('Grievance not found to delete');
      return res.status(404).json({ error: "Grievance not found" });
    }

    console.log(`Grievance ID: ${req.params.id} deleted`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting grievance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========== GET REPLIES ==========
app.get('/api/grievances/:id/replies', auth, async (req, res) => {
  try {
    console.log(`Get replies for grievance ID: ${req.params.id} requested by userId: ${req.user.userId}`);

    const replies = await Reply.find({ grievance: req.params.id })
      .sort({ created_at: 1 })
      .lean();

    const result = replies.map(r => ({
      id: r._id,
      grievance_id: r.grievance,
      reply: r.reply,
      author: r.author,
      created_at: r.created_at
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching replies:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========== Serve React build in production ==========
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

// ========== Start server ==========
const PORT = process.env.PORT || 6969;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
