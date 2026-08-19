const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDB } = require('../database');

// In-memory active session tokens map (token -> user)
const sessions = new Map();

// Generate secure random session token
function generateToken() {
  return 'iiita_sess_' + crypto.randomBytes(24).toString('hex');
}

// Generate cryptographically secure anti-CSRF synchronizer token
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
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

// Anti-CSRF Verification Middleware: Validates Origin, Referer, and Anti-CSRF Token
function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // 1. Origin and Referer Header Verification
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: 'CSRF Blocked: Cross-origin state modification rejected. Untrusted Origin: ' + origin
    });
  }

  if (referer) {
    const isAllowedReferer = allowedOrigins.some(allowed => referer.startsWith(allowed));
    if (!isAllowedReferer) {
      return res.status(403).json({
        error: 'CSRF Blocked: Cross-origin state modification rejected. Untrusted Referer: ' + referer
      });
    }
  }

  // 2. Anti-CSRF Synchronizer Token Verification
  const submittedToken = req.headers['x-csrf-token'] || req.body?.csrf_token || req.query?.csrf_token;
  const expectedToken = req.user?.csrfToken;

  if (!submittedToken || !expectedToken || submittedToken !== expectedToken) {
    return res.status(403).json({
      error: 'CSRF Protection: Missing or invalid anti-CSRF synchronizer token.'
    });
  }

  next();
}

// Endpoint to fetch Anti-CSRF Token for authenticated clients
router.get('/csrf-token', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required to obtain anti-CSRF token.' });
  }
  return res.json({ csrfToken: req.user.csrfToken });
});

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

    const csrfToken = generateCsrfToken();
    const user = {
      id: Number(result.lastInsertRowid),
      username: username.trim().toLowerCase(),
      full_name: full_name.trim(),
      role: 'Student',
      bio: bio || '',
      csrfToken
    };

    const token = generateToken();
    sessions.set(token, user);

    // Defense: Strict SameSite and HttpOnly session cookies
    res.cookie('session_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/'
    });

    return res.json({
      message: 'Registration successful',
      token,
      csrfToken,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        bio: user.bio
      }
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

  const csrfToken = generateCsrfToken();
  const userPayload = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    bio: user.bio,
    csrfToken
  };

  const token = generateToken();
  sessions.set(token, userPayload);

  // Defense: Strict SameSite and HttpOnly session cookies
  res.cookie('session_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/'
  });

  return res.json({
    message: 'Login successful',
    token,
    csrfToken,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      bio: user.bio
    }
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
  return res.json({
    user: {
      id: fresh.id,
      username: fresh.username,
      full_name: fresh.full_name,
      role: fresh.role,
      bio: fresh.bio
    },
    csrfToken: req.user.csrfToken
  });
});

// Update Bio / Profile (Protected by verifyCsrf middleware)
const handleProfileUpdate = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const fullName = req.body.fullName || req.body.full_name || req.user.full_name;
  const bio = req.body.bio !== undefined ? req.body.bio : req.user.bio;
  const db = getDB();

  db.prepare('UPDATE users SET full_name = ?, bio = ? WHERE id = ?').run(
    fullName,
    bio,
    req.user.id
  );

  const updated = db.prepare('SELECT id, username, full_name, role, bio FROM users WHERE id = ?').get(req.user.id);
  req.user.full_name = updated.full_name;
  req.user.bio = updated.bio;

  return res.json({ message: 'Profile updated successfully', user: updated });
};

router.put('/profile', authenticate, verifyCsrf, handleProfileUpdate);
router.post('/profile', authenticate, verifyCsrf, handleProfileUpdate);

// List Users for Member Directory
router.get('/users', (req, res) => {
  const db = getDB();
  const users = db.prepare('SELECT id, username, full_name, role, bio, created_at FROM users ORDER BY id ASC').all();
  return res.json({ users });
});

module.exports = {
  router,
  authenticate,
  verifyCsrf,
  sessions
};
