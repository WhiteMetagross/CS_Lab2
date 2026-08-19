const express = require('express');
const router = express.Router();
const { getDB } = require('../database');
const { authenticate } = require('./auth');

// Get recent chat messages
router.get('/', (req, res) => {
  const db = getDB();
  const messages = db.prepare(`
    SELECT 
      m.id, 
      m.user_id, 
      m.message, 
      m.created_at,
      u.username, 
      u.full_name, 
      u.role
    FROM chat_messages m
    JOIN users u ON m.user_id = u.id
    ORDER BY m.created_at ASC
    LIMIT 100
  `).all();

  return res.json({ messages });
});

// Post a chat message
router.post('/', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to chat.' });
  }

  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const db = getDB();
  const result = db.prepare(`
    INSERT INTO chat_messages (user_id, message)
    VALUES (?, ?)
  `).run(req.user.id, message);

  const newId = Number(result.lastInsertRowid);
  const createdMsg = db.prepare(`
    SELECT 
      m.id, 
      m.user_id, 
      m.message, 
      m.created_at,
      u.username, 
      u.full_name, 
      u.role
    FROM chat_messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `).get(newId);

  return res.status(201).json({ message: 'Message sent', chat: createdMsg });
});

// Clear chat history
router.delete('/clear', authenticate, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM chat_messages').run();
  return res.json({ message: 'Chat cleared' });
});

module.exports = router;
