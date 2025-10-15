const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');

const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from the project root
const STATIC_DIR = path.join(__dirname);
app.use(express.static(STATIC_DIR));

const MESSAGES_FILE = path.join(__dirname, 'messages.json');
function readMessages(){ try{ return JSON.parse(fs.readFileSync(MESSAGES_FILE,'utf8')||'[]'); }catch(e){ return []; } }
function writeMessages(m){ fs.writeFileSync(MESSAGES_FILE, JSON.stringify(m,null,2)); }

// Optional Postgres connection (Netlify DATABASE URL or NETLIFY_DATABASE_URL)
const DB_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
let pool = null;
async function initDb(){
  if(!DB_URL) return;
  pool = new Pool({ connectionString: DB_URL, ssl: DB_URL.startsWith('postgres://') ? undefined : { rejectUnauthorized: false } });
  // create tables if missing
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS messages (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  )`);
}

// DB-backed helpers (fall back to file functions if no DB)
async function dbReadUsers(){
  if(!pool) return readUsers();
  const res = await pool.query('SELECT id, name, email FROM users ORDER BY id');
  return res.rows.map(r=>({ id:r.id, name:r.name, email:r.email }));
}

async function dbGetUserByEmail(email){
  if(!pool) return readUsers().find(u=>u.email===email);
  const res = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email=$1', [email]);
  return res.rows[0];
}

async function dbCreateUser(u){
  if(!pool){ const users = readUsers(); users.push(u); writeUsers(users); return u; }
  await pool.query('INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)', [u.id,u.name,u.email,u.passwordHash]);
  return u;
}

async function dbReadMessages(){
  if(!pool) return readMessages();
  const res = await pool.query('SELECT id, name, email, message, created_at FROM messages ORDER BY created_at DESC');
  return res.rows.map(r=>({ id:r.id, name:r.name, email:r.email, message:r.message, createdAt: r.created_at }));
}

async function dbCreateMessage(m){
  if(!pool){ const msgs = readMessages(); msgs.push(m); writeMessages(msgs); return m; }
  await pool.query('INSERT INTO messages(id,name,email,message,created_at) VALUES($1,$2,$3,$4,$5)', [m.id,m.name,m.email,m.message,m.createdAt]);
  return m;
}

function readUsers(){
  try{ return JSON.parse(fs.readFileSync(USERS_FILE,'utf8')||'[]'); }catch(e){ return []; }
}
function writeUsers(u){ fs.writeFileSync(USERS_FILE, JSON.stringify(u,null,2)); }

app.post('/api/register', async (req,res)=>{
  const { name, email, password } = req.body;
  if(!email || !password || !name) return res.status(400).json({error:'Missing fields'});
  try{
    const existing = await dbGetUserByEmail(email);
    if(existing) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = { id: Date.now(), name, email, passwordHash: hash };
    await dbCreateUser(user);
    const token = jwt.sign({ id:user.id, email:user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id:user.id, name:user.name, email:user.email } });
  }catch(err){ console.error('register error', err); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/login', async (req,res)=>{
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({error:'Missing fields'});
  try{
    const user = await dbGetUserByEmail(email);
    if(!user) return res.status(401).json({error:'Invalid credentials'});
    const ok = await bcrypt.compare(password, user.password_hash || user.passwordHash);
    if(!ok) return res.status(401).json({error:'Invalid credentials'});
    const token = jwt.sign({ id:user.id, email:user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id:user.id, name:user.name, email:user.email } });
  }catch(err){ console.error('login error', err); res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/me', async (req,res)=>{
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer (.+)$/);
  if(!m) return res.status(401).json({error:'Missing token'});
  try{
    const payload = jwt.verify(m[1], JWT_SECRET);
    // try DB lookup first
    if(pool){
      const r = await pool.query('SELECT id, name, email FROM users WHERE id=$1', [payload.id]);
      const user = r.rows[0];
      if(!user) return res.status(404).json({error:'User not found'});
      return res.json({ user: { id:user.id, name:user.name, email:user.email } });
    }
    const users = readUsers();
    const user = users.find(u=>u.id === payload.id);
    if(!user) return res.status(404).json({error:'User not found'});
    res.json({ user: { id:user.id, name:user.name, email:user.email } });
  }catch(e){ console.error('me error', e); return res.status(401).json({error:'Invalid token'}); }
});

// Contact endpoint: store messages to messages.json
app.post('/api/contact', async (req,res)=>{
  const { name, email, message } = req.body || {};
  if(!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
  try{
    const msg = { id: Date.now(), name, email, message, createdAt: new Date().toISOString() };
    await dbCreateMessage(msg);
    res.json({ ok:true });
  }catch(err){ console.error('contact error', err); res.status(500).json({ error:'Server error' }); }
});

// Initialize DB if needed then start
initDb().then(()=>{
  app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT} (serving frontend & auth API)`));
}).catch(err=>{ console.error('DB init failed', err); app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT} (serving frontend & auth API)`)); });
