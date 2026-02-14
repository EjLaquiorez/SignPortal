const db = require('./database');
const fs = require('fs');
const path = require('path');
const { queryOne, execute } = require('../utils/dbHelper');

// Helper to run DDL statements (CREATE TABLE, CREATE INDEX, etc.)
const runDDL = (sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        // Only reject if it's not an "already exists" error
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          resolve(); // Table/index already exists, that's fine
        } else {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });
};

async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove comments
    schema = schema.replace(/--.*$/gm, '');
    
    // Split by semicolon and filter empty statements
    const statements = schema
      .split(';')
      .map(s => s.trim().replace(/\s+/g, ' '))
      .filter(s => s.length > 0 && s !== ';');
    
    console.log(`Found ${statements.length} statements to execute`);
    
    // Execute statements in order
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await runDDL(statement + ';');
          const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
          const indexMatch = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/i);
          if (tableMatch) {
            console.log(`✓ Created table: ${tableMatch[1]}`);
          } else if (indexMatch) {
            console.log(`✓ Created index: ${indexMatch[1]}`);
          }
        } catch (err) {
          // For indexes, if table doesn't exist yet, that's okay - we'll create them after
          if (statement.includes('CREATE INDEX') && err.message.includes('no such table')) {
            console.log(`⚠ Index creation deferred (table not yet created): ${statement.substring(0, 50)}...`);
          } else {
            console.error(`✗ Error on statement ${i + 1}:`, err.message);
            console.error(`  Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }
    
    // Now create indexes that might have failed (tables should exist now)
    console.log('\nCreating indexes...');
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && statement.includes('CREATE INDEX')) {
        try {
          await runDDL(statement + ';');
          const indexMatch = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/i);
          if (indexMatch) {
            console.log(`✓ Created index: ${indexMatch[1]}`);
          }
        } catch (err) {
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            console.warn(`⚠ Could not create index: ${err.message}`);
          }
        }
      }
    }
    
    console.log('\nDatabase schema initialized successfully');
    
    // Verify tables were created
    const tablesCheck = await queryOne("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('Tables in database:', tablesCheck.rows.map(r => r.name).join(', ') || 'none');
    
    // Create default admin user (password: admin123)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminCheck = await queryOne('SELECT id FROM users WHERE email = ?', ['admin@signingportal.com']);
    if (adminCheck.rows.length === 0) {
      await execute(
        'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)',
        ['admin@signingportal.com', hashedPassword, 'admin', 'Admin User']
      );
      console.log('\n✓ Default admin user created: admin@signingportal.com / admin123');
    } else {
      console.log('\n✓ Admin user already exists');
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
      } else {
        console.log('\n✓ Database initialization complete!');
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    db.close();
    process.exit(1);
  }
}

initDatabase();
