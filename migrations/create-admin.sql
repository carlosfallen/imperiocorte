-- FILE: migrations/create-admin.sql
DELETE FROM admins WHERE email = 'admin@imperiocorte.com';

INSERT INTO admins (id, email, password_hash, name, role, created_at, updated_at)
VALUES (
  'admin_default',
  'admin@imperiocorte.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Administrador',
  'admin',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);