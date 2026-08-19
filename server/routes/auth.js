const express = require('express');
const router = express.Router();
const { getDB } = require('../database');

// In-memory active session tokens map (token -> user)
const sessions = new Map();

// Generate simple random token
function generateToken() {
  return 'iiita_sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Middleware to extract user from session cookie or Authorization header
function authenticate(req, res, next) {
  const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
  if (token && sessions.has(token)) {
    req.user = sessions.get(token);
  } else {
    req.user = null;
  }
  next();
}

// Register
router.post('/register', (req, res) => {
  const { username, password, full_name, bio } = req.body;
  if (!username || !password || !full_name) {
    return res.status(400).json({ error: 'Username, password, and full name are required.' });
  }

  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Username is already taken.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO users (username, password, full_name, role, bio)
      VALUES (?, ?, ?, ?, ?)
    `).run(username.trim().toLowerCase(), password, full_name.trim(), 'Student', bio || '');

    const user = {
      id: Number(result.lastInsertRowid),
      username: username.trim().toLowerCase(),
      full_name: full_name.trim(),
      role: 'Student',
      bio: bio || ''
    };

    const token = generateToken();
    sessions.set(token, user);

    res.cookie('session_token', token, {
      path: '/'
    });

    return res.json({
      message: 'Registration successful',
      token,
      user
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create user account: ' + err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const db = getDB();
  const user = db.prepare('SELECT id, username, password, full_name, role, bio FROM users WHERE username = ?').get(username.trim().toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const userPayload = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    bio: user.bio
  };

  const token = generateToken();
  sessions.set(token, userPayload);

  res.cookie('session_token', token, {
    path: '/'
  });

  return res.json({
    message: 'Login successful',
    token,
    user: userPayload
  });
});

// Logout
router.post('/logout', authenticate, (req, res) => {
  const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    sessions.delete(token);
  }
  res.clearCookie('session_token');
  return res.json({ message: 'Logged out successfully' });
});

// Current User Profile
router.get('/me', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const db = getDB();
  const fresh = db.prepare('SELECT id, username, full_name, role, bio FROM users WHERE id = ?').get(req.user.id);
  return res.json({ user: fresh || req.user });
});

// Update Bio / Profile
router.put('/profile', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const { full_name, bio } = req.body;
  const db = getDB();

  db.prepare('UPDATE users SET full_name = ?, bio = ? WHERE id = ?').run(
    full_name || req.user.full_name,
    bio !== undefined ? bio : req.user.bio,
    req.user.id
  );

  const updated = db.prepare('SELECT id, username, full_name, role, bio FROM users WHERE id = ?').get(req.user.id);
  return res.json({ message: 'Profile updated', user: updated });
});

// List Users for Member Directory
router.get('/users', (req, res) => {
  const db = getDB();
  const users = db.prepare('SELECT id, username, full_name, role, bio, created_at FROM users ORDER BY id ASC').all();
  return res.json({ users });
});

module.exports = {
  router,
  authenticate,
  sessions
};
