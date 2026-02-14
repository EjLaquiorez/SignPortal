const db = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { queryOne, execute } = require('../src/utils/dbHelper');

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if admin user exists
    const adminCheck = await queryOne('SELECT id FROM users WHERE email = ?', ['admin@signingportal.com']);
    
    if (adminCheck.rows.length > 0) {
      // Update existing admin user
      await execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [hashedPassword, 'admin@signingportal.com']
      );
      console.log('✓ Admin password updated successfully');
      console.log('  Email: admin@signingportal.com');
      console.log('  Password: admin123');
    } else {
      // Create admin user if it doesn't exist
      await execute(
        'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)',
        ['admin@signingportal.com', hashedPassword, 'admin', 'Admin User']
      );
      console.log('✓ Admin user created successfully');
      console.log('  Email: admin@signingportal.com');
      console.log('  Password: admin123');
    }
    
    // Verify the password works
    const verifyCheck = await queryOne('SELECT password_hash FROM users WHERE email = ?', ['admin@signingportal.com']);
    if (verifyCheck.rows.length > 0) {
      const isValid = await bcrypt.compare('admin123', verifyCheck.rows[0].password_hash);
      console.log(`✓ Password verification: ${isValid ? 'PASSED' : 'FAILED'}`);
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
      } else {
        console.log('\n✓ Done!');
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Error resetting admin password:', error);
    db.close();
    process.exit(1);
  }
}

resetAdminPassword();
