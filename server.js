const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite Database
const db = new Database('invoices.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    business_name TEXT,
    business_address TEXT,
    business_phone TEXT,
    business_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_address TEXT,
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT DEFAULT 'unpaid',
    subtotal REAL NOT NULL,
    tax_rate REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    total REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, businessName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare('INSERT INTO users (email, password, business_name) VALUES (?, ?, ?)');
    const result = stmt.run(email, hashedPassword, businessName || '');

    const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: result.lastInsertRowid, email, businessName }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name,
        businessAddress: user.business_address,
        businessPhone: user.business_phone,
        businessEmail: user.business_email
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, business_name, business_address, business_phone, business_email FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, user });
});

// Update user profile
app.patch('/api/auth/profile', authenticateToken, (req, res) => {
  const { businessName, businessAddress, businessPhone, businessEmail } = req.body;

  const stmt = db.prepare(`
    UPDATE users 
    SET business_name = ?, business_address = ?, business_phone = ?, business_email = ?
    WHERE id = ?
  `);

  stmt.run(businessName, businessAddress, businessPhone, businessEmail, req.user.id);

  res.json({ success: true, message: 'Profile updated' });
});

// ============================================
// INVOICE ROUTES
// ============================================

// Create invoice
app.post('/api/invoices', authenticateToken, (req, res) => {
  try {
    const {
      invoiceNumber,
      clientName,
      clientEmail,
      clientAddress,
      issueDate,
      dueDate,
      items,
      taxRate,
      notes
    } = req.body;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Insert invoice
    const invoiceStmt = db.prepare(`
      INSERT INTO invoices (
        user_id, invoice_number, client_name, client_email, client_address,
        issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const invoiceResult = invoiceStmt.run(
      req.user.id, invoiceNumber, clientName, clientEmail, clientAddress,
      issueDate, dueDate, subtotal, taxRate, taxAmount, total, notes
    );

    const invoiceId = invoiceResult.lastInsertRowid;

    // Insert invoice items
    const itemStmt = db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      itemStmt.run(invoiceId, item.description, item.quantity, item.rate, item.quantity * item.rate);
    }

    res.json({
      success: true,
      invoiceId,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Get all invoices
app.get('/api/invoices', authenticateToken, (req, res) => {
  const invoices = db.prepare(`
    SELECT id, invoice_number, client_name, issue_date, due_date, total, status, created_at
    FROM invoices
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);

  res.json({ success: true, invoices });
});

// Get single invoice
app.get('/api/invoices/:id', authenticateToken, (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);

  res.json({ success: true, invoice: { ...invoice, items } });
});

// Update invoice status
app.patch('/api/invoices/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;

  const stmt = db.prepare('UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?');
  const result = stmt.run(status, req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  res.json({ success: true, message: 'Invoice status updated' });
});

// Delete invoice
app.delete('/api/invoices/:id', authenticateToken, (req, res) => {
  const stmt = db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?');
  const result = stmt.run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  res.json({ success: true, message: 'Invoice deleted' });
});

// Generate PDF
app.get('/api/invoices/:id/pdf', authenticateToken, (req, res) => {
  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(24).text('INVOICE', { align: 'right' });
    doc.moveDown();

    // Business info
    doc.fontSize(10);
    if (user.business_name) {
      doc.text(user.business_name, { align: 'left' });
    }
    if (user.business_address) {
      doc.text(user.business_address);
    }
    if (user.business_phone) {
      doc.text(user.business_phone);
    }
    if (user.business_email) {
      doc.text(user.business_email);
    }

    doc.moveDown();

    // Invoice details
    doc.text(`Invoice #: ${invoice.invoice_number}`, { align: 'right' });
    doc.text(`Issue Date: ${invoice.issue_date}`, { align: 'right' });
    doc.text(`Due Date: ${invoice.due_date}`, { align: 'right' });

    doc.moveDown();

    // Client info
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10);
    doc.text(invoice.client_name);
    if (invoice.client_email) {
      doc.text(invoice.client_email);
    }
    if (invoice.client_address) {
      doc.text(invoice.client_address);
    }

    doc.moveDown(2);

    // Items table
    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 300;
    const rateX = 370;
    const amountX = 470;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', itemX, tableTop);
    doc.text('Qty', qtyX, tableTop);
    doc.text('Rate', rateX, tableTop);
    doc.text('Amount', amountX, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    doc.font('Helvetica');
    let y = tableTop + 25;

    items.forEach(item => {
      doc.text(item.description, itemX, y, { width: 240 });
      doc.text(item.quantity.toString(), qtyX, y);
      doc.text(`$${item.rate.toFixed(2)}`, rateX, y);
      doc.text(`$${item.amount.toFixed(2)}`, amountX, y);
      y += 25;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();

    // Totals
    y += 15;
    doc.text('Subtotal:', 400, y);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, amountX, y);

    if (invoice.tax_rate > 0) {
      y += 20;
      doc.text(`Tax (${invoice.tax_rate}%):`, 400, y);
      doc.text(`$${invoice.tax_amount.toFixed(2)}`, amountX, y);
    }

    y += 20;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', 400, y);
    doc.text(`$${invoice.total.toFixed(2)}`, amountX, y);

    // Notes
    if (invoice.notes) {
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica');
      doc.text('Notes:', { underline: true });
      doc.text(invoice.notes);
    }

    // Footer
    doc.fontSize(8).text(
      'Thank you for your business!',
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ============================================
// DASHBOARD STATS
// ============================================

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const totalInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ?').get(req.user.id).count;
  const paidInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = "paid"').get(req.user.id).count;
  const unpaidInvoices = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = "unpaid"').get(req.user.id).count;
  const totalRevenue = db.prepare('SELECT SUM(total) as sum FROM invoices WHERE user_id = ? AND status = "paid"').get(req.user.id).sum || 0;
  const pendingRevenue = db.prepare('SELECT SUM(total) as sum FROM invoices WHERE user_id = ? AND status = "unpaid"').get(req.user.id).sum || 0;

  res.json({
    success: true,
    stats: {
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      totalRevenue: totalRevenue.toFixed(2),
      pendingRevenue: pendingRevenue.toFixed(2)
    }
  });
});

// ============================================
// CLIENTS ROUTES
// ============================================

app.post('/api/clients', authenticateToken, (req, res) => {
  const { name, email, address, phone } = req.body;

  const stmt = db.prepare('INSERT INTO clients (user_id, name, email, address, phone) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(req.user.id, name, email, address, phone);

  res.json({ success: true, clientId: result.lastInsertRowid });
});

app.get('/api/clients', authenticateToken, (req, res) => {
  const clients = db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY name').all(req.user.id);
  res.json({ success: true, clients });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Invoice Generator running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
});