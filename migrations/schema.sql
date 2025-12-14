-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  preferences TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_admins_email ON admins(email);

-- Service categories
CREATE TABLE IF NOT EXISTS service_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_categories_slug ON service_categories(slug);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price REAL NOT NULL,
  cover_image TEXT,
  notes TEXT,
  is_featured INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_featured ON services(is_featured, is_active);

-- Professionals table
CREATE TABLE IF NOT EXISTS professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_professionals_slug ON professionals(slug);
CREATE INDEX idx_professionals_active ON professionals(is_active);

-- Professional services (many-to-many)
CREATE TABLE IF NOT EXISTS professional_services (
  professional_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  PRIMARY KEY (professional_id, service_id),
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Working hours
CREATE TABLE IF NOT EXISTS working_hours (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);

CREATE INDEX idx_working_hours_professional ON working_hours(professional_id, day_of_week);

-- Breaks (lunch, pauses)
CREATE TABLE IF NOT EXISTS breaks (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);

CREATE INDEX idx_breaks_professional ON breaks(professional_id, day_of_week);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  professional_id TEXT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  total_duration INTEGER NOT NULL,
  total_price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  source TEXT NOT NULL DEFAULT 'direto',
  client_notes TEXT,
  admin_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL
);

CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id);
CREATE INDEX idx_appointments_date ON appointments(date, start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_source ON appointments(source);

-- Appointment items (services in appointment)
CREATE TABLE IF NOT EXISTS appointment_items (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price REAL NOT NULL,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
);

CREATE INDEX idx_appointment_items_appointment ON appointment_items(appointment_id);

-- Media assets
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_media_entity ON media_assets(entity_type, entity_id);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
  ('salon_name', 'Império Corte', strftime('%s', 'now')),
  ('salon_address', 'Rua Exemplo, 123 - São Paulo, SP', strftime('%s', 'now')),
  ('whatsapp_number', '5511999999999', strftime('%s', 'now')),
  ('instagram_url', 'https://instagram.com/imperiocorte', strftime('%s', 'now')),
  ('business_hours_start', '09:00', strftime('%s', 'now')),
  ('business_hours_end', '19:00', strftime('%s', 'now')),
  ('buffer_time_minutes', '15', strftime('%s', 'now')),
  ('min_advance_hours', '2', strftime('%s', 'now')),
  ('max_cancel_hours', '24', strftime('%s', 'now')),
  ('auto_confirm', '0', strftime('%s', 'now')),
  ('max_daily_bookings', '50', strftime('%s', 'now'));

-- Insert default categories
INSERT OR IGNORE INTO service_categories (id, name, slug, description, display_order, created_at, updated_at) VALUES
  ('cat_feminino', 'Feminino', 'feminino', 'Serviços de corte, coloração e tratamentos para cabelos femininos', 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cat_masculino', 'Masculino', 'masculino', 'Cortes e serviços para cabelos masculinos', 2, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cat_barbearia', 'Barbearia', 'barbearia', 'Barba, bigode e serviços completos de barbearia', 3, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cat_unhas', 'Unhas', 'unhas', 'Manicure, pedicure e nail art', 4, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cat_sobrancelha', 'Sobrancelha', 'sobrancelha', 'Design de sobrancelhas e cílios', 5, strftime('%s', 'now'), strftime('%s', 'now')),
  ('cat_tratamentos', 'Tratamentos', 'tratamentos', 'Tratamentos capilares e estéticos', 6, strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert sample services
INSERT OR IGNORE INTO services (id, category_id, name, slug, description, duration_minutes, price, is_featured, created_at, updated_at) VALUES
  ('srv_corte_fem', 'cat_feminino', 'Corte Feminino', 'corte-feminino', 'Corte personalizado com lavagem e finalização', 60, 120.00, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('srv_corte_masc', 'cat_masculino', 'Corte Masculino', 'corte-masculino', 'Corte moderno com máquina e tesoura', 45, 60.00, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('srv_barba', 'cat_barbearia', 'Barba Completa', 'barba-completa', 'Aparo, desenho e hidratação da barba', 30, 45.00, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('srv_manicure', 'cat_unhas', 'Manicure', 'manicure', 'Cuidados completos para as unhas das mãos', 40, 35.00, 1, strftime('%s', 'now'), strftime('%s', 'now')),
  ('srv_sobrancelha', 'cat_sobrancelha', 'Design de Sobrancelhas', 'design-sobrancelhas', 'Modelagem e design profissional', 30, 40.00, 1, strftime('%s', 'now'), strftime('%s', 'now'));
