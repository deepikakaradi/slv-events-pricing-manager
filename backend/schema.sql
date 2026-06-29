-- Drop tables if they exist (for clean initialization)
-- Note: Order is important due to foreign keys

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'sales')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: services
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  standard_price REAL NOT NULL,
  gst_rate REAL DEFAULT 18.0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: packages
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  package_id INTEGER NOT NULL,
  guest_min INTEGER NOT NULL,
  guest_max INTEGER NOT NULL,
  price_multiplier REAL DEFAULT 1.0,
  description TEXT,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);

-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: quotes
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0, -- 0 = false, 1 = true
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default event types
INSERT INTO events (id, name, description, status) VALUES
(1, 'Wedding', 'Elegant wedding ceremony and grand reception package services', 'active'),
(2, 'Birthday', 'Vibrant decorations, catering, and audio-visual setups for birthdays', 'active'),
(3, 'Corporate', 'Professional business seminars, conferences, and formal corporate functions', 'active'),
(4, 'Engagement', 'Sophisticated family gatherings and ring ceremony celebrations', 'active'),
(5, 'Reception', 'Splendid post-wedding dining and entertainment evenings', 'active'),
(6, 'Custom Event', 'Tailored event management with custom selected services', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert default service catalog
INSERT INTO services (id, name, category, standard_price, gst_rate, description) VALUES
(1, 'Wedding Catering (Per Guest)', 'Catering', 1500.0, 5.0, 'Premium multicourse buffet options'),
(2, 'Birthday Catering (Per Guest)', 'Catering', 800.0, 5.0, 'Classic buffet service with essential food'),
(3, 'Corporate Catering (Per Guest)', 'Catering', 1200.0, 5.0, 'Professional catering for business events'),
(4, 'Anniversary Catering (Per Guest)', 'Catering', 1000.0, 5.0, 'Elegant catering for anniversaries'),
(5, 'Royal Stage Decoration', 'Decoration', 150000.0, 12.0, 'Handcrafted floral stage arrangements'),
(6, 'Minimalist Decoration', 'Decoration', 30000.0, 12.0, 'Simple floral accents and clean styling'),
(7, 'Premium Sound & DJ Set', 'Audio/Visual', 45000.0, 18.0, 'Top-tier sound systems and professional DJ'),
(8, 'Standard Sound System', 'Audio/Visual', 10000.0, 18.0, 'Microphones and ambient music setup'),
(9, 'HD Photography & Video', 'Photography', 100000.0, 18.0, 'Full-day event coverage and highlight video'),
(10, 'Basic Photography', 'Photography', 35000.0, 18.0, '4-hour event photoshoot'),
(11, 'Luxury Suite Room', 'Venue Support', 15000.0, 12.0, 'Air-conditioned room with vanity mirrors'),
(12, 'Live Musical Band', 'Entertainment', 120000.0, 18.0, '4-piece live band performance'),
(13, 'Event Coordinator Services', 'Management', 25000.0, 18.0, 'On-site supervisor to manage timelines'),
(14, 'Professional Anchor/Host', 'Entertainment', 20000.0, 18.0, 'Dynamic event host/anchor'),
(15, 'Bridal/Groom Makeup', 'Venue Support', 25000.0, 12.0, 'Premium makeup and styling'),
(16, 'Custom Invitation Cards', 'Management', 10000.0, 18.0, 'Custom invitation cards design and printing'),
(17, 'Venue Lighting Setup', 'Audio/Visual', 35000.0, 18.0, 'Thematic event lighting arrangements'),
(18, 'Thematic Flower Decoration', 'Decoration', 75000.0, 12.0, 'Exotic floral setup and entryways'),
(19, 'Security Staff (Per Person)', 'Venue Support', 1800.0, 12.0, 'Security staff members per day'),
(20, 'Housekeeping Staff (Per Person)', 'Venue Support', 1200.0, 12.0, 'Housekeeping staff members per day'),
(21, 'Event Transportation', 'Venue Support', 25000.0, 12.0, 'Passenger transport and logistics coordination'),
(22, 'Generator Power Backup', 'Venue Support', 15000.0, 12.0, 'Uninterrupted power supply support'),
(23, 'Premium Event Venue Charges', 'Venue Support', 300000.0, 12.0, 'Premium venue booking and charges')
ON CONFLICT (id) DO NOTHING;

-- Reset serial sequences in PostgreSQL
SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE(max(id), 1));
SELECT setval(pg_get_serial_sequence('services', 'id'), COALESCE(max(id), 1));
