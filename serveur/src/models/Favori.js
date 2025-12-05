// Model Favori (auto-généré depuis DB)
// ✅ Compatible TypeScript/VSCode - Utilisez @aliases dans CONTROLLERS seulement

const sqlite3 = require('sqlite3').verbose();

class FavoriModel {
  constructor(dbPath = 'C:/Users/maxim/Desktop/NDI/SITE/serveur/database.db') {
    this.tableName = 'Favori';
    this.db = new sqlite3.Database(dbPath);
    console.log(`🗄️ ${this.tableName} DB connectée`);
  }

  // 🔢 Compter
  count() {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT COUNT(*) as count FROM ${this.tableName}`, (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });
  }

  // 📋 Liste paginée
  findAll(limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // 🔍 Par ID
  findById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM ${this.tableName} WHERE favorite_id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // 🔎 Recherche
  search(query, limit = 20) {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ${this.tableName} WHERE nom LIKE ? OR description LIKE ? LIMIT ?`, 
        [`%${query}%`, `%${query}%`, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // ➕ Créer
  create(data) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => data[col]);
      
      this.db.run(
        `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ success: true, id: this.lastID });
        }
      );
    });
  }

  // ✏️ Update
  update(id, data) {
    return new Promise((resolve, reject) => {
      const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
      const values = Object.values(data).concat(id);
      
      this.db.run(
        `UPDATE ${this.tableName} SET ${setClause} WHERE rowid = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ success: true, changes: this.changes });
        }
      );
    });
  }

  // 🗑️ Delete
  delete(id) {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM ${this.tableName} WHERE rowid = ?`, [id], function(err) {
        if (err) reject(err);
        else resolve({ success: true, changes: this.changes });
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
};

module.exports = FavoriModel;
