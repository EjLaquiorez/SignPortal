// Helper functions to make SQLite queries more similar to PostgreSQL patterns

const db = require('../config/database');

// Promisify database operations
const promisify = (method) => {
  return (sql, params = []) => {
    return new Promise((resolve, reject) => {
      method.call(db, sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
};

// Execute a query and return rows (for SELECT)
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve({ rows: rows || [] });
    });
  });
};

// Execute a query and return first row (for SELECT with single result)
const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve({ rows: row ? [row] : [] });
    });
  });
};

// Execute a query and return the result (for INSERT/UPDATE/DELETE)
const execute = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({
        rows: [{ id: this.lastID, changes: this.changes }],
        rowCount: this.changes,
        lastInsertRowid: this.lastID
      });
    });
  });
};

module.exports = {
  query,
  queryOne,
  execute,
  db // Export db for direct access when needed
};
