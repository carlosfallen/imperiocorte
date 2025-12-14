// FILE: scripts/test-admin.js
import bcrypt from 'bcryptjs';

async function testAdmin() {
  const password = 'admin123';
  const hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  
  console.log('Testing password verification...');
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('Is Valid:', isValid);
  
  if (!isValid) {
    console.log('\nGenerating new hash...');
    const newHash = await bcrypt.hash(password, 10);
    console.log('New Hash:', newHash);
    console.log('\nTest new hash:');
    const testNew = await bcrypt.compare(password, newHash);
    console.log('New hash valid:', testNew);
  }
}

testAdmin();