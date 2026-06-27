const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const pricingEngine = require('./pricingEngine');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'slv-events-pricing-secret-key-2026';

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper for logging database activity
async function logActivity(userId, action) {
  try {
    await db.query('INSERT INTO activity_logs (user_id, action) VALUES ($1, $2)', [userId, action]);
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
}

// Helper to create notifications
async function createNotification(userId, message) {
  try {
    await db.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [userId, message]);
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

// ----------------------------------------------------------------
// Middlewares
// ----------------------------------------------------------------

// Authentication middleware
function authenticateToken(req, res, next) {
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
}

// Admin validation middleware
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin permissions required' });
  }
}

// ----------------------------------------------------------------
// Authentication Endpoints
// ----------------------------------------------------------------

app.post('/api/v1/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (role !== 'admin' && role !== 'sales') {
    return res.status(400).json({ error: 'Invalid user role specified' });
  }

  try {
    const checkUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const isPostgres = db.getDbType() === 'postgres';
    const insertRes = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hash, role]
    );
    const userId = isPostgres ? insertRes.rows[0].id : insertRes.insertId;

    const token = jwt.sign({ id: userId, name, email, role }, JWT_SECRET, { expiresIn: '24h' });
    
    await logActivity(userId, `Registered user account for ${name} (${role})`);

    res.status(201).json({
      token,
      user: { id: userId, name, email, role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logActivity(user.id, `User logged in`);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/auth/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

// ----------------------------------------------------------------
// Event Types Endpoints
// ----------------------------------------------------------------

app.get('/api/v1/events', authenticateToken, async (req, res) => {
  try {
    const eventsRes = await db.query('SELECT * FROM events ORDER BY name ASC');
    res.json(eventsRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/events', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Event name is required' });
  }

  try {
    const isPostgres = db.getDbType() === 'postgres';
    const insertRes = await db.query(
      'INSERT INTO events (name, description, status) VALUES ($1, $2, $3) RETURNING id',
      [name, description || '', 'active']
    );
    const eventId = isPostgres ? insertRes.rows[0].id : insertRes.insertId;

    await logActivity(req.user.id, `Created event type: ${name}`);

    res.status(201).json({ id: eventId, name, description, status: 'active' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, status } = req.body;
  const { id } = req.params;

  try {
    await db.query(
      'UPDATE events SET name = $1, description = $2, status = $3 WHERE id = $4',
      [name, description, status, id]
    );
    await logActivity(req.user.id, `Updated event type ID ${id}: ${name}`);
    res.json({ message: 'Event type updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------
// Services Catalog Endpoints
// ----------------------------------------------------------------

app.get('/api/v1/services', authenticateToken, async (req, res) => {
  try {
    const servicesRes = await db.query('SELECT * FROM services ORDER BY category, name ASC');
    res.json(servicesRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/services', authenticateToken, requireAdmin, async (req, res) => {
  const { name, category, standard_price, description } = req.body;

  if (!name || !category || standard_price === undefined) {
    return res.status(400).json({ error: 'Name, Category and Standard Price are required' });
  }

  try {
    const isPostgres = db.getDbType() === 'postgres';
    const insertRes = await db.query(
      'INSERT INTO services (name, category, standard_price, description) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, category, parseFloat(standard_price), description || '']
    );
    const serviceId = isPostgres ? insertRes.rows[0].id : insertRes.insertId;

    await logActivity(req.user.id, `Added service: ${name} to category ${category}`);

    res.status(201).json({ id: serviceId, name, category, standard_price, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------
// Package CRUD Endpoints
// ----------------------------------------------------------------

app.get('/api/v1/packages', authenticateToken, async (req, res) => {
  try {
    const packagesRes = await db.query(`
      SELECT p.*, e.name as event_name 
      FROM packages p
      JOIN events e ON p.event_id = e.id
      ORDER BY e.name, p.tier ASC
    `);

    // Attach service lists to each package row dynamically
    const packages = packagesRes.rows;
    for (const p of packages) {
      const svcs = await db.query(`
        SELECT s.* FROM services s
        JOIN package_services ps ON s.id = ps.service_id
        WHERE ps.package_id = $1
      `, [p.id]);
      p.services = svcs.rows;

      const rules = await db.query(`
        SELECT * FROM pricing_rules WHERE package_id = $1
      `, [p.id]);
      p.pricing_rules = rules.rows;
    }

    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/packages/:id', authenticateToken, async (req, res) => {
  try {
    const pkgRes = await db.query('SELECT * FROM packages WHERE id = $1', [req.params.id]);
    if (pkgRes.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    const pkg = pkgRes.rows[0];

    const svcs = await db.query(`
      SELECT s.* FROM services s
      JOIN package_services ps ON s.id = ps.service_id
      WHERE ps.package_id = $1
    `, [pkg.id]);
    pkg.services = svcs.rows;

    const rules = await db.query(`
      SELECT * FROM pricing_rules WHERE package_id = $1 ORDER BY guest_min ASC
    `, [pkg.id]);
    pkg.pricing_rules = rules.rows;

    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/packages', authenticateToken, requireAdmin, async (req, res) => {
  const { name, event_id, tier, base_price, services = [], pricing_rules = [] } = req.body;

  if (!name || !event_id || !tier || base_price === undefined) {
    return res.status(400).json({ error: 'Name, event_id, tier, and base_price are required' });
  }

  try {
    const isPostgres = db.getDbType() === 'postgres';
    const insertRes = await db.query(
      'INSERT INTO packages (name, event_id, tier, base_price, is_published) VALUES ($1, $2, $3, $4, 1) RETURNING id',
      [name, event_id, tier, parseFloat(base_price)]
    );
    const packageId = isPostgres ? insertRes.rows[0].id : insertRes.insertId;

    // Link Services
    for (const serviceId of services) {
      await db.query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [packageId, serviceId]);
    }

    // Create default/provided pricing rules
    if (pricing_rules.length > 0) {
      for (const rule of pricing_rules) {
        await db.query(
          'INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, $2, $3, $4, $5)',
          [packageId, rule.guest_min, rule.guest_max, parseFloat(rule.price_multiplier), rule.description || '']
        );
      }
    } else {
      // Add default slabs
      const defaultRules = [
        [packageId, 0, 75, 0.8, 'Small Gathering (<75 guests)'],
        [packageId, 76, 150, 1.0, 'Standard Size (76-150 guests)'],
        [packageId, 151, 300, 1.4, 'Large Gathering (151-300 guests)'],
        [packageId, 301, 9999, 2.0, 'Grand Gala (300+ guests)']
      ];
      for (const r of defaultRules) {
        await db.query('INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, $2, $3, $4, $5)', r);
      }
    }

    await logActivity(req.user.id, `Created Package: ${name} (${tier})`);
    res.status(201).json({ id: packageId, name, tier, base_price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/packages/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { name, base_price, is_published, services = [], pricing_rules = [] } = req.body;
  const { id } = req.params;

  try {
    await db.query(
      'UPDATE packages SET name = $1, base_price = $2, is_published = $3 WHERE id = $4',
      [name, parseFloat(base_price), is_published ? 1 : 0, id]
    );

    // Re-link services: clear old ones and insert current
    await db.query('DELETE FROM package_services WHERE package_id = $1', [id]);
    for (const serviceId of services) {
      await db.query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [id, serviceId]);
    }

    // Re-link pricing rules: clear and insert
    await db.query('DELETE FROM pricing_rules WHERE package_id = $1', [id]);
    for (const rule of pricing_rules) {
      await db.query(
        'INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, $2, $3, $4, $5)',
        [id, rule.guest_min, rule.guest_max, parseFloat(rule.price_multiplier), rule.description || '']
      );
    }

    await logActivity(req.user.id, `Updated Package: ${name}`);
    res.json({ message: 'Package updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/packages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM packages WHERE id = $1', [req.params.id]);
    await logActivity(req.user.id, `Deleted Package ID ${req.params.id}`);
    res.json({ message: 'Package deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/packages/:id/clone', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pkgRes = await db.query('SELECT * FROM packages WHERE id = $1', [req.params.id]);
    if (pkgRes.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    const oldPkg = pkgRes.rows[0];

    const isPostgres = db.getDbType() === 'postgres';
    const insertRes = await db.query(
      'INSERT INTO packages (name, event_id, tier, base_price, is_published) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [`Copy of ${oldPkg.name}`, oldPkg.event_id, oldPkg.tier, oldPkg.base_price, 0]
    );
    const newPkgId = isPostgres ? insertRes.rows[0].id : insertRes.insertId;

    // Clone services
    const servicesRes = await db.query('SELECT service_id FROM package_services WHERE package_id = $1', [oldPkg.id]);
    for (const row of servicesRes.rows) {
      await db.query('INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)', [newPkgId, row.service_id]);
    }

    // Clone pricing rules
    const rulesRes = await db.query('SELECT * FROM pricing_rules WHERE package_id = $1', [oldPkg.id]);
    for (const rule of rulesRes.rows) {
      await db.query(
        'INSERT INTO pricing_rules (package_id, guest_min, guest_max, price_multiplier, description) VALUES ($1, $2, $3, $4, $5)',
        [newPkgId, rule.guest_min, rule.guest_max, rule.price_multiplier, rule.description]
      );
    }

    await logActivity(req.user.id, `Cloned Package ID ${oldPkg.id} to new ID ${newPkgId}`);
    res.status(201).json({ id: newPkgId, message: 'Package cloned successfully as unpublished' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------
// Quotes and Pricing Engine Integration Endpoints
// ----------------------------------------------------------------

app.post('/api/v1/quotes/calculate', authenticateToken, async (req, res) => {
  const { packageId, guestCount, additionalServices, discountPercent, budget } = req.body;
  
  if (!packageId || !guestCount) {
    return res.status(400).json({ error: 'packageId and guestCount are required' });
  }

  try {
    const quoteCalculations = await pricingEngine.calculateQuote({
      packageId: parseInt(packageId),
      guestCount: parseInt(guestCount),
      additionalServices: additionalServices || [],
      discountPercent: parseFloat(discountPercent) || 0,
      budget: parseFloat(budget) || 0
    });

    res.json(quoteCalculations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/quotes', authenticateToken, async (req, res) => {
  const { 
    clientName, clientEmail, clientPhone, clientCompany,
    eventId, packageId, guestCount, subtotal, discount, tax, finalPrice,
    additionalServices = [], summary 
  } = req.body;

  if (!clientName || !clientEmail || !eventId || !packageId || !guestCount || finalPrice === undefined) {
    return res.status(400).json({ error: 'Required fields missing for saving quote' });
  }

  try {
    const isPostgres = db.getDbType() === 'postgres';
    
    // 1. Create client or find existing
    let clientId;
    const clientCheck = await db.query('SELECT id FROM clients WHERE email = $1', [clientEmail]);
    if (clientCheck.rows.length > 0) {
      clientId = clientCheck.rows[0].id;
    } else {
      const clientInsert = await db.query(
        'INSERT INTO clients (name, email, phone, company) VALUES ($1, $2, $3, $4) RETURNING id',
        [clientName, clientEmail, clientPhone || '', clientCompany || '']
      );
      clientId = isPostgres ? clientInsert.rows[0].id : clientInsert.insertId;
    }

    // 2. Insert Quote
    const quoteInsert = await db.query(`
      INSERT INTO quotes 
        (client_id, event_id, package_id, guest_count, subtotal, discount, tax, final_price, status, summary, created_by)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', $9, $10)
      RETURNING id`,
      [
        clientId, parseInt(eventId), parseInt(packageId), parseInt(guestCount),
        parseFloat(subtotal), parseFloat(discount), parseFloat(tax), parseFloat(finalPrice),
        summary || '', req.user.id
      ]
    );
    const quoteId = isPostgres ? quoteInsert.rows[0].id : quoteInsert.insertId;

    // 3. Insert Quote Items (custom line items)
    for (const item of additionalServices) {
      await db.query(
        'INSERT INTO quote_items (quote_id, service_id, name, custom_price, quantity) VALUES ($1, $2, $3, $4, $5)',
        [quoteId, item.id, item.name, parseFloat(item.custom_price), parseInt(item.quantity) || 1]
      );
    }

    await logActivity(req.user.id, `Created quotation ID ${quoteId} for client ${clientName}`);
    
    // Notify admin of a new pending quote
    await createNotification(null, `New pending quotation generated for ${clientName} (Total: ₹${finalPrice.toLocaleString('en-IN')})`);

    res.status(201).json({ id: quoteId, message: 'Quotation created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/quotes', authenticateToken, async (req, res) => {
  try {
    const quotesRes = await db.query(`
      SELECT q.*, c.name as client_name, c.email as client_email, e.name as event_name, p.name as package_name, p.tier as package_tier, u.name as creator_name
      FROM quotes q
      JOIN clients c ON q.client_id = c.id
      JOIN events e ON q.event_id = e.id
      JOIN packages p ON q.package_id = p.id
      JOIN users u ON q.created_by = u.id
      ORDER BY q.created_at DESC
    `);

    res.json(quotesRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/quotes/:id', authenticateToken, async (req, res) => {
  try {
    const quoteRes = await db.query(`
      SELECT q.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.company as client_company,
             e.name as event_name, p.name as package_name, p.tier as package_tier, u.name as creator_name
      FROM quotes q
      JOIN clients c ON q.client_id = c.id
      JOIN events e ON q.event_id = e.id
      JOIN packages p ON q.package_id = p.id
      JOIN users u ON q.created_by = u.id
      WHERE q.id = $1
    `, [req.params.id]);

    if (quoteRes.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    const quote = quoteRes.rows[0];

    const itemsRes = await db.query(`
      SELECT qi.*, s.category FROM quote_items qi
      LEFT JOIN services s ON qi.service_id = s.id
      WHERE qi.quote_id = $1
    `, [quote.id]);
    quote.items = itemsRes.rows;

    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/quotes/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
    return res.status(400).json({ error: 'Valid status required' });
  }

  try {
    await db.query('UPDATE quotes SET status = $1 WHERE id = $2', [status, req.params.id]);
    await logActivity(req.user.id, `Updated quotation status for ID ${req.params.id} to ${status}`);
    
    // Generate notification for quotation creator
    const quoteCreator = await db.query('SELECT created_by, client_id FROM quotes WHERE id = $1', [req.params.id]);
    if (quoteCreator.rows.length > 0) {
      const creatorId = quoteCreator.rows[0].created_by;
      await createNotification(creatorId, `Your quotation ID ${req.params.id} has been ${status.toLowerCase()}.`);
    }

    res.json({ message: `Quotation status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------
// Analytics & Dashboard Endpoints
// ----------------------------------------------------------------

app.get('/api/v1/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    // 1. Overall stats
    const totalEventsRes = await db.query('SELECT COUNT(*) as count FROM events WHERE status = $1', ['active']);
    const totalPackagesRes = await db.query('SELECT COUNT(*) as count FROM packages WHERE is_published = 1');
    const quotesCountRes = await db.query('SELECT COUNT(*) as count FROM quotes');
    
    // Revenue is sum of final_price for approved quotes
    const approvedRevenueRes = await db.query('SELECT SUM(final_price) as sum FROM quotes WHERE status = $1', ['Approved']);
    const pendingRevenueRes = await db.query('SELECT SUM(final_price) as sum FROM quotes WHERE status = $1', ['Pending']);
    
    const approvedRevenue = parseFloat(approvedRevenueRes.rows[0].sum) || 0;
    const pendingRevenue = parseFloat(pendingRevenueRes.rows[0].sum) || 0;

    // 2. Revenue Trends (Grouped by Month)
    const revenueTrendsRes = await db.query(`
      SELECT strftime('%Y-%m', created_at) as month, SUM(final_price) as revenue
      FROM quotes
      WHERE status = 'Approved'
      GROUP BY month
      ORDER BY month ASC
      LIMIT 12
    `);
    // PostgreSQL uses date_trunc or to_char instead of strftime. We provide dynamic JS formatting if SQLite vs Pg:
    let revenueTrends = revenueTrendsRes.rows;
    if (db.getDbType() === 'postgres') {
      const pgTrends = await db.query(`
        SELECT to_char(created_at, 'YYYY-MM') as month, SUM(final_price) as revenue
        FROM quotes
        WHERE status = 'Approved'
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
      `);
      revenueTrends = pgTrends.rows;
    }

    // 3. Package Popularity
    const packagePopularityRes = await db.query(`
      SELECT p.name, p.tier, COUNT(q.id) as count
      FROM quotes q
      JOIN packages p ON q.package_id = p.id
      GROUP BY p.id, p.name, p.tier
      ORDER BY count DESC
    `);

    // 4. Event Types Distribution
    const eventDistributionRes = await db.query(`
      SELECT e.name, COUNT(q.id) as count
      FROM quotes q
      JOIN events e ON q.event_id = e.id
      GROUP BY e.id, e.name
      ORDER BY count DESC
    `);

    // 5. Recent Activity logs
    const recentActivityRes = await db.query(`
      SELECT al.*, u.name as user_name, u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT 10
    `);

    res.json({
      metrics: {
        activeEvents: parseInt(totalEventsRes.rows[0].count),
        activePackages: parseInt(totalPackagesRes.rows[0].count),
        totalQuotes: parseInt(quotesCountRes.rows[0].count),
        revenue: approvedRevenue,
        pendingRevenue: pendingRevenue
      },
      charts: {
        revenueTrends,
        packagePopularity: packagePopularityRes.rows,
        eventDistribution: eventDistributionRes.rows
      },
      recentActivity: recentActivityRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------
// Notifications Center Endpoints
// ----------------------------------------------------------------

app.get('/api/v1/notifications', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    let queryText = 'SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 20';
    if (userRole === 'admin') {
      // Admins get everything
      queryText = 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 30';
    }

    const notificationsRes = await db.query(queryText, userRole === 'admin' ? [] : [req.user.id]);
    res.json(notificationsRes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------
// Bootstrap Server & DB
// ----------------------------------------------------------------

app.listen(PORT, async () => {
  console.log(`Express server listening on http://localhost:${PORT}`);
  try {
    await db.initializeDatabase();
  } catch (dbErr) {
    console.error('Failed to initialize database rules on startup:', dbErr.message);
  }
});
