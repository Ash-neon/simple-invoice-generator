# 📄 Simple Invoice Generator

**Free invoice generator for freelancers - Create professional PDF invoices without monthly fees**

🌐 **Live Demo:** Coming soon...

Stop paying $30/month for FreshBooks or Wave. Create unlimited professional invoices for free.

---

## 🎯 Problem We Solve

Based on Reddit feedback (1,500+ upvotes from r/freelance):
- Freelancers paying $30-50/month for invoice tools
- Only need basic invoicing, not complex accounting
- Occasional use doesn't justify monthly subscription
- Want professional-looking invoices without the cost

---

## 💡 Solution

Simple Invoice Generator provides:
- ✅ **Unlimited Invoices** - Create as many as you need
- ✅ **PDF Export** - Download professional PDF invoices
- ✅ **Payment Tracking** - Track paid/unpaid status
- ✅ **Client Management** - Save client details
- ✅ **Dashboard Analytics** - See revenue and stats
- ✅ **100% Free** - No monthly fees, no credit card required

---

## 🚀 Features

### Core Capabilities

**Invoice Creation**
- Professional invoice templates
- Customizable invoice numbers
- Multiple line items
- Tax calculations
- Notes and terms

**PDF Generation**
- High-quality PDF export
- Professional formatting
- Business branding
- Ready to send

**Client Management**
- Save client information
- Quick invoice creation
- Client history
- Contact details

**Payment Tracking**
- Mark invoices as paid/unpaid
- Track total revenue
- See pending payments
- Invoice status dashboard

**Dashboard**
- Total invoices count
- Revenue analytics
- Payment status overview
- Recent invoices list

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- SQLite (better-sqlite3)
- JWT authentication
- bcrypt password hashing
- PDFKit for PDF generation

**Frontend:**
- Vanilla JavaScript
- Modern CSS with gradients
- Responsive design
- Single-page application

**Database:**
- SQLite (zero configuration)
- 4 tables: users, invoices, invoice_items, clients
- Automatic migrations

---

## 📊 Database Schema

```sql
users
- id, email, password, business_name, business_address, 
  business_phone, business_email, created_at

invoices
- id, user_id, invoice_number, client_name, client_email,
  client_address, issue_date, due_date, status, subtotal,
  tax_rate, tax_amount, total, notes, created_at

invoice_items
- id, invoice_id, description, quantity, rate, amount

clients
- id, user_id, name, email, address, phone, created_at
```

---

## 🚀 Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/Ash-neon/simple-invoice-generator.git
cd simple-invoice-generator

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start server
npm start
```

Open browser to `http://localhost:3000`

### Environment Variables

```bash
PORT=3000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

---

## 📖 API Documentation

### Authentication

**Register:**
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "businessName": "My Business"
}
```

**Login:**
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Get Profile:**
```bash
GET /api/auth/profile
Authorization: Bearer <token>
```

**Update Profile:**
```bash
PATCH /api/auth/profile
Authorization: Bearer <token>
{
  "businessName": "Updated Business",
  "businessAddress": "123 Main St",
  "businessPhone": "555-1234",
  "businessEmail": "business@example.com"
}
```

### Invoices

**Create Invoice:**
```bash
POST /api/invoices
Authorization: Bearer <token>
{
  "invoiceNumber": "INV-001",
  "clientName": "Client Name",
  "clientEmail": "client@example.com",
  "clientAddress": "Client Address",
  "issueDate": "2026-01-02",
  "dueDate": "2026-02-01",
  "items": [
    {
      "description": "Web Design",
      "quantity": 1,
      "rate": 1000
    }
  ],
  "taxRate": 10,
  "notes": "Thank you for your business"
}
```

**List Invoices:**
```bash
GET /api/invoices
Authorization: Bearer <token>
```

**Get Invoice:**
```bash
GET /api/invoices/:id
Authorization: Bearer <token>
```

**Update Invoice Status:**
```bash
PATCH /api/invoices/:id/status
Authorization: Bearer <token>
{
  "status": "paid"
}
```

**Delete Invoice:**
```bash
DELETE /api/invoices/:id
Authorization: Bearer <token>
```

**Download PDF:**
```bash
GET /api/invoices/:id/pdf
Authorization: Bearer <token>
```

### Dashboard

**Get Stats:**
```bash
GET /api/dashboard/stats
Authorization: Bearer <token>
```

### Clients

**Create Client:**
```bash
POST /api/clients
Authorization: Bearer <token>
{
  "name": "Client Name",
  "email": "client@example.com",
  "address": "123 Main St",
  "phone": "555-1234"
}
```

**List Clients:**
```bash
GET /api/clients
Authorization: Bearer <token>
```

---

## 💰 Pricing

**Free Forever:**
- Unlimited invoices
- PDF export
- Client management
- Payment tracking
- Dashboard analytics
- No credit card required

**Pro (Coming Soon - $9/month):**
- Custom branding
- Recurring invoices
- Email reminders
- Priority support

**Enterprise (Custom):**
- Team accounts
- API access
- Custom integrations
- Dedicated support

---

## 🎯 Use Cases

### For Freelancers
- Create professional invoices quickly
- Track payments and revenue
- Manage multiple clients
- No monthly fees

### For Consultants
- Bill clients professionally
- Track project payments
- Export invoices as PDF
- Simple and fast

### For Small Agencies
- Generate client invoices
- Monitor cash flow
- Professional branding
- Free alternative to expensive tools

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production
npm start
```

---

## 🌐 Deployment

### Railway
```bash
# Connect GitHub repo
# Railway auto-detects and deploys
# Set JWT_SECRET environment variable
```

### Docker
```bash
docker build -t simple-invoice-generator .
docker run -p 3000:3000 simple-invoice-generator
```

### Manual
```bash
# On your server
git clone <repo>
npm install
npm start
```

---

## 📈 Roadmap

- [x] Invoice creation
- [x] PDF export
- [x] Payment tracking
- [x] Client management
- [x] Dashboard analytics
- [ ] Custom branding
- [ ] Recurring invoices
- [ ] Email reminders
- [ ] Payment gateway integration
- [ ] Multi-currency support
- [ ] Invoice templates
- [ ] Expense tracking
- [ ] Reports and analytics

---

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first.

---

## 📝 License

MIT

---

## 🔗 Links

- **GitHub:** https://github.com/Ash-neon/simple-invoice-generator
- **Live Demo:** Coming soon
- **Support:** GitHub Issues

---

## 🎉 Why Choose Simple Invoice Generator?

**vs FreshBooks ($30/month):**
- ✅ Free forever
- ✅ Simpler interface
- ✅ No feature bloat
- ✅ Just what you need

**vs Wave (Free but complex):**
- ✅ Easier to use
- ✅ Faster invoice creation
- ✅ Better UX
- ✅ No accounting complexity

**vs Invoicely ($10/month):**
- ✅ Completely free
- ✅ Unlimited invoices
- ✅ No limits
- ✅ Open source

---

**Built for freelancers who just want to create invoices without the hassle or cost.** 🚀

Start creating professional invoices today - completely free!