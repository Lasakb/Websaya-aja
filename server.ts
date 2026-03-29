import express from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Database setup
const db = new Database('app.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    profile_image TEXT,
    balance REAL DEFAULT 0,
    is_banned INTEGER DEFAULT 0,
    device_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS qris_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    merchant_name TEXT UNIQUE NOT NULL,
    nmid TEXT,
    status TEXT DEFAULT 'pending',
    qris_image_url TEXT,
    custom_link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'success',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ticket_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    sender_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
  );
`);

// Try to add nmid column if it doesn't exist
try {
  db.exec("ALTER TABLE qris_applications ADD COLUMN nmid TEXT;");
} catch (e) {
  // Column might already exist, ignore error
}

// Add new location and business fields
try { db.exec("ALTER TABLE users ADD COLUMN provinsi TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN kota TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN kecamatan TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN kelurahan TEXT;"); } catch (e) {}

try { db.exec("ALTER TABLE qris_applications ADD COLUMN business_type TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE qris_applications ADD COLUMN store_name TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE qris_applications ADD COLUMN business_photo TEXT;"); } catch (e) {}

// Generate NMID for existing applications that don't have one
const appsWithoutNmid = db.prepare('SELECT id FROM qris_applications WHERE nmid IS NULL').all();
const updateNmid = db.prepare('UPDATE qris_applications SET nmid = ? WHERE id = ?');
db.transaction(() => {
  for (const app of appsWithoutNmid) {
    const nmid = 'ID' + Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    updateNmid.run(nmid, app.id);
  }
})();

// Default admin
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@qris.com', hash, 'admin');
} else {
  db.prepare('UPDATE users SET email = ? WHERE role = ?').run('admin@qris.com', 'admin');
}

// Default settings
const defaultSettings = [
  ['logo', ''],
  ['copyright', '© 2026 QRIS Merchant Maker'],
  ['copyright_bg_color', '#ffffff'],
  ['bg_type', 'color'],
  ['bg_value', '#f3f4f6'],
  ['contact_wa', '6281234567890'],
  ['contact_email', 'admin@qris.com'],
  ['footer_location', 'Jakarta, Indonesia'],
  ['favicon', ''],
  ['header_title', 'QRIS Merchant Maker'],
  ['page_description', 'Buat QRIS Merchant Anda dengan mudah dan cepat.'],
  ['qris_template_url', ''],
  ['qris_text_y_pos', '18'],
  ['qris_text_size', '20'],
  ['qris_text_color', '#000000'],
  ['qris_text_width', '90'],
  ['qris_nmid_y_pos', '22'],
  ['qris_nmid_size', '14'],
  ['qris_nmid_color', '#666666'],
  ['qris_nmid_width', '90'],
  ['tutorial_video', ''],
  ['hero_image', ''],
  ['hero_bg_image', ''],
  ['hero_bg_image_size', '128'],
  ['logo_bi', ''],
  ['logo_kominfo', ''],
  ['hero_badge_text', 'Resmi & Terpercaya'],
  ['hero_feature_1', 'Proses Otomatis'],
  ['hero_feature_2', 'Tanpa Biaya Tersembunyi'],
  ['hero_feature_3', 'Support 24/7'],
  ['trust_title', 'Diawasi & Terdaftar Resmi Oleh'],
  ['trust_item_1', 'Toko Retail'],
  ['trust_item_2', 'F&B Cafe'],
  ['trust_item_3', 'Jasa Online'],
  ['trust_item_4', 'Minimarket'],
  ['features_title', 'Kenapa Memilih Kami?'],
  ['features_subtitle', 'Kami memberikan layanan pembuatan QRIS terbaik dengan proses yang cepat dan aman.'],
  ['feature_1_title', 'Proses Cepat'],
  ['feature_1_desc', 'Daftar hari ini, QRIS Anda akan otomatis jadi besok jam 13:00 siang.'],
  ['feature_2_title', 'Aman & Terpercaya'],
  ['feature_2_desc', 'Data Anda dijamin keamanannya. Kami menggunakan sistem enkripsi tingkat tinggi.'],
  ['feature_3_title', 'Otomatis'],
  ['feature_3_desc', 'Sistem kami berjalan secara otomatis tanpa perlu campur tangan manual yang lama.'],
  ['steps_title', 'Cara Membuat QRIS Merchant'],
  ['steps_subtitle', 'Ikuti langkah mudah berikut untuk mendapatkan QRIS Merchant Anda.'],
  ['step_1_title', 'Daftar Akun'],
  ['step_1_desc', 'Buat akun baru dengan mengisi data diri yang valid.'],
  ['step_2_title', 'Isi Data Merchant'],
  ['step_2_desc', 'Masuk ke dashboard dan isi nama merchant yang Anda inginkan.'],
  ['step_3_title', 'Tunggu 1 Hari Kerja'],
  ['step_3_desc', 'Sistem akan memproses pengajuan Anda. QRIS akan jadi besok jam 13:00 siang.'],
  ['step_4_title', 'QRIS Siap Digunakan'],
  ['step_4_desc', 'QRIS otomatis muncul di dashboard Anda dan siap menerima pembayaran.'],
  ['news_content', 'Selamat datang di QRIS Merchant Maker. Saat ini belum ada pengumuman terbaru.'],
  ['enable_topup', 'true'],
  ['popup_enabled', 'false'],
  ['popup_image', ''],
  ['popup_link', ''],
  ['popup_duration', '0'],
  ['popup_frequency', 'once_session'],
  ['popup_closable', 'true'],
  ['footer_logo_image', ''],
  ['footer_logo_name', ''],
  ['social_youtube', 'https://youtube.com'],
  ['social_instagram', 'https://instagram.com'],
  ['social_facebook', 'https://facebook.com'],
  ['footer_layout_style', 'left_right']
];

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
defaultSettings.forEach(([key, value]) => insertSetting.run(key, value));

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads dir exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  next();
};

// --- API Routes ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, device_id, provinsi, kota, kecamatan, kelurahan } = req.body;
  
  // Check if device_id has registered multiple times
  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE device_id = ?').get(device_id) as any;
  if (deviceCount.count >= 2) { // Ban if more than 1 account
    return res.status(403).json({ error: 'Device banned due to multiple registrations.' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password, device_id, provinsi, kota, kecamatan, kelurahan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      name, email, hash, device_id || 'unknown',
      provinsi || null, kota || null, kecamatan || null, kelurahan || null
    );
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  
  if (!user) return res.status(400).json({ error: 'User not found' });
  if (user.is_banned) return res.status(403).json({ error: 'User is banned' });
  
  if (bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, profile_image: user.profile_image, balance: user.balance } });
  } else {
    res.status(400).json({ error: 'Invalid password' });
  }
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const user = db.prepare('SELECT id, name, email, role, profile_image, balance, is_banned FROM users WHERE id = ?').get(req.user.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.is_banned) return res.status(403).json({ error: 'User is banned' });
  res.json(user);
});

// Settings
app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all() as any[];
  const settingsObj = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
  res.json(settingsObj);
});

app.post('/api/settings', authenticateToken, isAdmin, (req, res) => {
  const updates = req.body;
  const updateStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  
  db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      updateStmt.run(key, value !== null && value !== undefined ? String(value) : '');
    }
  })();
  
  res.json({ success: true });
});

// Uploads
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// User Profile Update
app.put('/api/users/profile', authenticateToken, (req: any, res) => {
  const { name, profile_image } = req.body;
  db.prepare('UPDATE users SET name = ?, profile_image = ? WHERE id = ?').run(name, profile_image, req.user.id);
  res.json({ success: true });
});

// Admin Users
app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, balance, is_banned, created_at, provinsi, kota, kecamatan, kelurahan FROM users').all();
  res.json(users);
});

app.post('/api/admin/users/:id/ban', authenticateToken, isAdmin, (req, res) => {
  const { is_banned } = req.body;
  db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(is_banned ? 1 : 0, req.params.id);
  res.json({ success: true });
});

// QRIS Applications
app.post('/api/qris', authenticateToken, (req: any, res) => {
  const { merchant_name, business_type, store_name, business_photo } = req.body;
  
  // Check if already applied
  const existingApp = db.prepare('SELECT * FROM qris_applications WHERE user_id = ?').get(req.user.id);
  if (existingApp) return res.status(400).json({ error: 'Anda sudah mengajukan QRIS sebelumnya.' });

  // Check if merchant name already exists
  const existingName = db.prepare('SELECT * FROM qris_applications WHERE merchant_name = ?').get(merchant_name);
  if (existingName) return res.status(400).json({ error: 'Nama merchant sudah ada dan tidak bisa digunakan.' });

  try {
    const status = req.user.role === 'admin' ? 'approved' : 'pending';
    const approvedAt = req.user.role === 'admin' ? new Date().toISOString() : null;
    const nmid = 'ID' + Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    
    db.prepare('INSERT INTO qris_applications (user_id, merchant_name, nmid, status, approved_at, business_type, store_name, business_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      req.user.id, merchant_name, nmid, status, approvedAt,
      business_type || null, store_name || null, business_photo || null
    );
    
    const message = req.user.role === 'admin' ? 'QRIS berhasil dibuat dan langsung aktif.' : 'Data dikirim. QRIS akan jadi besok jam 13:00 siang.';
    res.json({ success: true, message });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/qris/my', authenticateToken, (req: any, res) => {
  const app = db.prepare('SELECT * FROM qris_applications WHERE user_id = ?').get(req.user.id) as any;
  if (!app) return res.json(null);

  // Generate NMID if missing
  if (!app.nmid) {
    const nmid = 'ID' + Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    db.prepare('UPDATE qris_applications SET nmid = ? WHERE id = ?').run(nmid, app.id);
    app.nmid = nmid;
  }

  // Auto approve logic: 1 day later at 1 PM
  if (app.status === 'pending') {
    const createdAt = new Date(app.created_at);
    const now = new Date();
    
    // Calculate next day 1 PM
    const nextDay1PM = new Date(createdAt);
    nextDay1PM.setDate(nextDay1PM.getDate() + 1);
    nextDay1PM.setHours(13, 0, 0, 0);

    // For testing purposes, we can uncomment this to auto-approve immediately
    // if (true) {
    if (now >= nextDay1PM) {
      db.prepare('UPDATE qris_applications SET status = ?, approved_at = ? WHERE id = ?').run('approved', now.toISOString(), app.id);
      app.status = 'approved';
      app.approved_at = now.toISOString();
    }
  }

  res.json(app);
});

app.get('/api/admin/qris', authenticateToken, isAdmin, (req, res) => {
  const apps = db.prepare(`
    SELECT q.*, u.name as user_name, u.email 
    FROM qris_applications q 
    JOIN users u ON q.user_id = u.id
  `).all();
  res.json(apps);
});

app.put('/api/admin/qris/:id', authenticateToken, isAdmin, (req, res) => {
  const { custom_link, status, merchant_name, nmid } = req.body;
  
  try {
    // Check if merchant name already exists for another application
    if (merchant_name) {
      const existingName = db.prepare('SELECT id FROM qris_applications WHERE merchant_name = ? AND id != ?').get(merchant_name, req.params.id);
      if (existingName) {
        return res.status(400).json({ error: 'Nama merchant sudah ada dan tidak bisa digunakan.' });
      }
    }

    db.prepare('UPDATE qris_applications SET custom_link = ?, status = ?, merchant_name = ?, nmid = ? WHERE id = ?').run(custom_link, status, merchant_name, nmid, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, (req: any, res) => {
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  
  const totalIncome = transactions
    .filter((t: any) => t.type === 'income' && t.status === 'success')
    .reduce((sum: number, t: any) => sum + t.amount, 0);
    
  const totalTransactions = transactions.length;
  const recentTransactions = transactions.slice(0, 5); // top 5
  
  res.json({
    totalIncome,
    totalTransactions,
    recentTransactions
  });
});

// Top Up
app.post('/api/topup', authenticateToken, (req: any, res) => {
  const { amount } = req.body;
  if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  
  db.transaction(() => {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user.id);
    db.prepare('INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(req.user.id, amount, 'income', 'Top Up Saldo');
  })();
  
  res.json({ success: true });
});

// Transactions
app.get('/api/transactions/my', authenticateToken, (req: any, res) => {
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(transactions);
});

// Withdrawals
app.get('/api/withdrawals/my', authenticateToken, (req: any, res) => {
  const withdrawals = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(withdrawals);
});

app.post('/api/withdrawals', authenticateToken, (req: any, res) => {
  const { amount, bank_name, account_number, account_name } = req.body;
  if (amount <= 0) return res.status(400).json({ error: 'Jumlah penarikan tidak valid' });

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id) as any;
  if (user.balance < amount) return res.status(400).json({ error: 'Saldo tidak mencukupi' });

  try {
    db.transaction(() => {
      // Deduct balance
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, req.user.id);
      // Create withdrawal record
      db.prepare('INSERT INTO withdrawals (user_id, amount, bank_name, account_number, account_name) VALUES (?, ?, ?, ?, ?)').run(req.user.id, amount, bank_name, account_number, account_name);
      // Create transaction record
      db.prepare('INSERT INTO transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)').run(req.user.id, amount, 'withdraw', `Penarikan ke ${bank_name} - ${account_number}`);
    })();
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Ticket routes
app.get('/api/tickets', authenticateToken, (req: any, res) => {
  try {
    let tickets;
    if (req.user.role === 'admin') {
      tickets = db.prepare(`
        SELECT t.*, u.name as user_name, u.email as user_email 
        FROM tickets t 
        JOIN users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC
      `).all();
    } else {
      tickets = db.prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    }
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', authenticateToken, (req: any, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

    const result = db.prepare('INSERT INTO tickets (user_id, subject) VALUES (?, ?)').run(req.user.id, subject);
    const ticketId = result.lastInsertRowid;

    db.prepare('INSERT INTO ticket_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)').run(ticketId, 'user', message);

    res.json({ success: true, ticketId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tickets/:id', authenticateToken, (req: any, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any;
    
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').all(ticketId);
    res.json({ ticket, messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets/:id/messages', authenticateToken, (req: any, res) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any;
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const senderType = req.user.role === 'admin' ? 'admin' : 'user';
    db.prepare('INSERT INTO ticket_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)').run(ticketId, senderType, message);
    
    if (req.user.role === 'admin' && (ticket.status === 'open' || ticket.status === 'closed')) {
      db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run('answered', ticketId);
    } else if (req.user.role === 'user' && (ticket.status === 'answered' || ticket.status === 'closed')) {
      db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run('open', ticketId);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tickets/:id/status', authenticateToken, isAdmin, (req: any, res) => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body;
    if (!['open', 'answered', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run(status, ticketId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
