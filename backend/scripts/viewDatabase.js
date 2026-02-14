const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../signingportal.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to database:', dbPath);
  console.log('\n=== Database Contents ===\n');
  
  // List all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err);
      db.close();
      return;
    }
    
    console.log('Tables found:', tables.map(t => t.name).join(', '));
    console.log('\n');
    
    // View each table
    let tablesProcessed = 0;
    tables.forEach((table) => {
      const tableName = table.name;
      db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
        if (err) {
          console.error(`Error reading ${tableName}:`, err);
        } else {
          console.log(`\n--- ${tableName.toUpperCase()} (${rows.length} rows) ---`);
          if (rows.length > 0) {
            console.table(rows);
          } else {
            console.log('(No data)');
          }
        }
        
        tablesProcessed++;
        if (tablesProcessed === tables.length) {
          console.log('\n=== End of Database Contents ===\n');
          db.close();
        }
      });
    });
  });
});
