// FILE: scripts/create-admin.js
import bcrypt from 'bcryptjs';

async function createAdminHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('='.repeat(60));
  console.log('ADMIN CREDENTIALS');
  console.log('='.repeat(60));
  console.log('Email: admin@imperiocorte.com');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('='.repeat(60));
  console.log('\nExecute este comando para criar o admin:\n');
  
  const command = `wrangler d1 execute imperio-corte-db --local --command="INSERT OR REPLACE INTO admins (id, email, password_hash, name, role, created_at, updated_at) VALUES ('admin_default', 'admin@imperiocorte.com', '${hash}', 'Administrador', 'admin', strftime('%s', 'now'), strftime('%s', 'now'));"`;
  
  console.log(command);
  console.log('\n' + '='.repeat(60));
}

createAdminHash();