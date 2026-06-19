-- Drop tables if they exist (for clean initialization)
-- Note: Order is important due to foreign keys

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'sales')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: events
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: services
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  standard_price REAL NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: packages
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  event_id INTEGER NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('Silver', 'Gold', 'Platinum')),
  base_price REAL NOT NULL,
  is_published INTEGER DEFAULT 1, -- 1 = true, 0 = false
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Table: package_services
CREATE TABLE IF NOT EXISTS package_services (
  package_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  PRIMARY KEY (package_id, service_id),
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Table: pricing_rules
CREATE TABLE IF NOT EXISTS pricing_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER NOT NULL,
  guest_min INTEGER NOT NULL,
  guest_max INTEGER NOT NULL,
  price_multiplier REAL DEFAULT 1.0,
  description TEXT,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);

-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: quotes
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  package_id INTEGER NOT NULL,
  guest_count INTEGER NOT NULL,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0.0,
  tax REAL DEFAULT 0.0,
  final_price REAL NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
  summary TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (package_id) REFERENCES packages(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Table: quote_items
CREATE TABLE IF NOT EXISTS quote_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  service_id INTEGER,
  name TEXT NOT NULL,
  custom_price REAL NOT NULL,
  quantity INTEGER DEFAULT 1,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0, -- 0 = false, 1 = true
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default event types
INSERT OR IGNORE INTO events (id, name, description, status) VALUES
(1, 'Wedding', 'Elegant wedding ceremony and grand reception package services', 'active'),
(2, 'Birthday', 'Vibrant decorations, catering, and audio-visual setups for birthdays', 'active'),
(3, 'Corporate', 'Professional business seminars, conferences, and formal corporate functions', 'active'),
(4, 'Engagement', 'Sophisticated family gatherings and ring ceremony celebrations', 'active'),
(5, 'Reception', 'Splendid post-wedding dining and entertainment evenings', 'active'),
(6, 'Custom Event', 'Tailored event management with custom selected services', 'active');

-- Insert default service catalog
INSERT OR IGNORE INTO services (id, name, category, standard_price, description) VALUES
(1, 'Premium Catering (Per Guest)', 'Catering', 3735.0, 'Includes high-quality multicourse buffet options, beverages, and desserts'),
(2, 'Standard Catering (Per Guest)', 'Catering', 2075.0, 'Classic buffet service with essential food and soft drinks'),
(3, 'Royal Stage Decoration', 'Decoration', 124500.0, 'Handcrafted floral stage arrangements, thematic backdrops, and mood lighting'),
(4, 'Minimalist Decoration', 'Decoration', 41500.0, 'Simple floral accents, clean styling, and seating arrangements'),
(5, 'Premium Sound & DJ Set', 'Audio/Visual', 66400.0, 'Top-tier sound systems, party lighting rig, and professional event DJ'),
(6, 'Standard Sound System', 'Audio/Visual', 24900.0, 'Microphones, standard speakers, and ambient music setup'),
(7, 'HD Photography & Video', 'Photography', 99600.0, 'Full-day event coverage, edited high-resolution photos, and 5-min highlight video'),
(8, 'Basic Photography', 'Photography', 41500.0, '4-hour event photoshoot with digital photo delivery'),
(9, 'Luxury Bridal/Groom Suite', 'Venue Support', 33200.0, 'Air-conditioned green rooms with vanity mirrors, refreshments, and assistant'),
(10, 'Live Musical Band', 'Entertainment', 166000.0, '4-piece live band performance for cocktail hours or main show'),
(11, 'Event Coordinator Services', 'Management', 49800.0, 'On-site supervisor to manage timelines, vendors, and guest support');
