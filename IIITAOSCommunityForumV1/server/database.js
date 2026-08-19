const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'forum.db');

let dbInstance = null;

function getDB() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db) {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'Student',
      bio TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Check if users exist, otherwise seed
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!userCount || userCount.count === 0) {
    seedData(db);
  }
}

function seedData(db) {
  // Clear existing records
  db.exec(`
    DELETE FROM chat_messages;
    DELETE FROM comments;
    DELETE FROM posts;
    DELETE FROM users;
  `);

  // Insert seed users with specified names
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, full_name, role, bio)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('mridankan', 'mridankan123', 'Mridankan Mandal', 'Administrator', 'Coordinator for IIIT Allahabad Open Source Society. Managing repository contributions and student mentorship.');
  insertUser.run('ankit', 'ankit123', 'Ankit Ekka', 'Contributor', 'Undergraduate student contributing to web applications and distributed systems projects.');
  insertUser.run('dhannu', 'dhannu123', 'Dhannu Meena', 'Contributor', 'Second-year student active in campus open source tooling and API development.');
  insertUser.run('aditya', 'aditya123', 'Aditya Pachauri', 'Student', 'Enthusiastic developer exploring backend systems, algorithms, and cloud infrastructure.');
  insertUser.run('sayan', 'sayan123', 'Sayan Samajpati', 'Student', 'Student working on developer tools and open source software integrations.');
  insertUser.run('lucky', 'lucky123', 'Lucky Raut', 'Student', 'Developer interested in Linux system administration, networking, and application security.');

  // Fetch IDs
  const mridankanId = db.prepare('SELECT id FROM users WHERE username = ?').get('mridankan').id;
  const ankitId = db.prepare('SELECT id FROM users WHERE username = ?').get('ankit').id;
  const dhannuId = db.prepare('SELECT id FROM users WHERE username = ?').get('dhannu').id;
  const adityaId = db.prepare('SELECT id FROM users WHERE username = ?').get('aditya').id;

  // Insert seed posts
  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, title, category, content)
    VALUES (?, ?, ?, ?)
  `);

  insertPost.run(
    mridankanId,
    'Welcome to the IIIT-A Open Source Community Forum',
    'Announcements',
    'Welcome everyone to the official discussion forum for IIIT Allahabad Open Source projects. Use this space to share repository updates, coordinate project contributions, and post technical queries.'
  );

  insertPost.run(
    ankitId,
    'Guidelines for Setting Up Local Project Environments',
    'Guides',
    'Here is a quick overview for configuring Node.js, SQLite, and Git across our community repositories. Ensure environment configurations and test cases pass before submitting pull requests.'
  );

  insertPost.run(
    dhannuId,
    'Discussion: Benchmarking Microservices Frameworks',
    'General Discussion',
    'We are evaluating different backend frameworks for campus intranet services. Please share your suggestions regarding performance, memory overhead, and ease of maintenance.'
  );

  // Insert seed comments
  const post1Id = db.prepare('SELECT id FROM posts WHERE user_id = ?').get(mridankanId).id;
  const post3Id = db.prepare('SELECT id FROM posts WHERE user_id = ?').get(dhannuId).id;

  const insertComment = db.prepare(`
    INSERT INTO comments (post_id, user_id, content)
    VALUES (?, ?, ?)
  `);

  insertComment.run(post1Id, ankitId, 'Glad to have this forum live. Looking forward to collaborating with everyone.');
  insertComment.run(post1Id, adityaId, 'Great initiative. Will be sharing my project ideas here soon.');
  insertComment.run(post3Id, ankitId, 'Node.js with Express works very well for lightweight API services on our local servers.');

  // Insert seed chat messages
  const insertChat = db.prepare(`
    INSERT INTO chat_messages (user_id, message)
    VALUES (?, ?)
  `);

  insertChat.run(mridankanId, 'Welcome to the IIIT-A live chat channel.');
  insertChat.run(ankitId, 'Hello everyone! Testing the community chat system.');
  insertChat.run(dhannuId, 'Hi team, let me know if any updates are needed on the repository.');
}

function resetDatabase() {
  const db = getDB();
  seedData(db);
}

module.exports = {
  getDB,
  resetDatabase,
};
