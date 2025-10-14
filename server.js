const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

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

function readUsers(){
  try{ return JSON.parse(fs.readFileSync(USERS_FILE,'utf8')||'[]'); }catch(e){ return []; }
}
function writeUsers(u){ fs.writeFileSync(USERS_FILE, JSON.stringify(u,null,2)); }

app.post('/api/register', async (req,res)=>{
  const { name, email, password } = req.body;
  if(!email || !password || !name) return res.status(400).json({error:'Missing fields'});
  const users = readUsers();
  if(users.find(u=>u.email===email)) return res.status(409).json({error:'Email already registered'});
  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), name, email, passwordHash: hash };
  users.push(user);
  writeUsers(users);
  const token = jwt.sign({ id:user.id, email:user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id:user.id, name:user.name, email:user.email } });
});

app.post('/api/login', async (req,res)=>{
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({error:'Missing fields'});
  const users = readUsers();
  const user = users.find(u=>u.email===email);
  if(!user) return res.status(401).json({error:'Invalid credentials'});
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(401).json({error:'Invalid credentials'});
  const token = jwt.sign({ id:user.id, email:user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id:user.id, name:user.name, email:user.email } });
});

app.get('/api/me', (req,res)=>{
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer (.+)$/);
  if(!m) return res.status(401).json({error:'Missing token'});
  try{
    const payload = jwt.verify(m[1], JWT_SECRET);
    const users = readUsers();
    const user = users.find(u=>u.id === payload.id);
    if(!user) return res.status(404).json({error:'User not found'});
    res.json({ user: { id:user.id, name:user.name, email:user.email } });
  }catch(e){ return res.status(401).json({error:'Invalid token'}); }
});

// Contact endpoint: store messages to messages.json
app.post('/api/contact', (req,res)=>{
  const { name, email, message } = req.body || {};
  if(!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
  const messages = readMessages();
  const msg = { id: Date.now(), name, email, message, createdAt: new Date().toISOString() };
  messages.push(msg);
  writeMessages(messages);
  res.json({ ok:true });
});

app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT} (serving frontend & auth API)`));
