// src/controllers/genericController.cjs - VERSION ROBUSTE ✅ (FIX VUES + DB + PAGINATION)
const sqlite3 = require('sqlite3').verbose();

class GenericController {
  constructor(tableName, dbPath) {
    this.tableName = tableName;
    this.dbPath = dbPath || '../database.db';
    this.db = null;
    this.initDb().catch(console.error);
    console.log(`🗄️ ${tableName} Controller initialisé`);
  }

  async initDb() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error(`❌ Erreur DB ${this.tableName}:`, err.message);
      } else {
        console.log(`✅ DB ${this.tableName} connectée: ${this.dbPath}`);
      }
    });
  }

  closeDb() {
    if (this.db) {
      this.db.close((err) => {
        if (err) console.error('Erreur fermeture DB:', err);
      });
      this.db = null;
    }
  }

  // 🔢 COMPTEUR SÉCURISÉ
  count() {
    return this.queryRow(`SELECT COUNT(*) as count FROM ${this.tableName}`).catch(() => ({ count: 0 }));
  }

  // 🆕 RÉCENTS SÉCURISÉS
  recent(limit = 5) {
    return this.queryAll(`SELECT * FROM ${this.tableName} ORDER BY rowid DESC LIMIT ?`, [limit]).catch(() => []);
  }

  // 🏆 TOP SÉCURISÉ
  topByField(field = 'rowid', limit = 10) {
    return this.queryAll(`SELECT * FROM ${this.tableName} ORDER BY ${field} DESC LIMIT ?`, [limit]).catch(() => []);
  }

  // 🔍 RECHERCHE SÉCURISÉE
  findById(id) {
    return this.queryRow(`SELECT * FROM ${this.tableName} WHERE rowid = ?`, [id]).catch(() => null);
  }

  // 📊 DASHBOARD - ROBUSTE
  async dashboard(req, res) {
    try {
      const [total, recent, top] = await Promise.all([
        this.count(),
        this.recent(5),
        this.topByField('created_at', 10)
      ]);
      
      // ✅ Fallback si vue manquante
      try {
        res.render(`${this.tableName.toLowerCase()}/dashboard`, {
          title: `${this.tableName} Dashboard`,
          total, recent, top,
          tableName: this.tableName,
          layout: 'layouts/main'
        });
      } catch (viewErr) {
        res.render('error', {
          message: `Dashboard ${this.tableName} en construction`,
          layout: 'layouts/main'
        });
      }
    } catch (err) {
      console.error(`Dashboard ${this.tableName}:`, err);
      res.status(500).render('error', { message: err.message });
    }
  }

  // 📋 INDEX - ULTRA-ROBUSTE ✅
  async index(req, res) {
    try {
      const { limit = 20, offset = 0, search, sort = 'rowid', order = 'DESC' } = req.query;
      
      let result;
      try {
        result = await this.getPaginated({
          search, limit: parseInt(limit), offset: parseInt(offset), sort, order
        });
      } catch (dbErr) {
        console.error(`DB error ${this.tableName}:`, dbErr.message);
        // ✅ Fallback sans DB
        result = {
          items: await this.recent(parseInt(limit)),
          total: 0,
          pagination: { limit: parseInt(limit), offset: 0, pages: 1, current: 1 }
        };
      }

      // ✅ ESSAI VUE SPÉCIFIQUE → GÉNÉRIQUE → FALLBACK
      const viewPaths = [
        `${this.tableName.toLowerCase()}/index`,
        `${this.tableName.toLowerCase()}`,
        'generic/index'
      ];

      let rendered = false;
      for (const viewPath of viewPaths) {
        try {
          res.render(viewPath, { 
            title: `${this.tableName.charAt(0).toUpperCase() + this.tableName.slice(0).toLowerCase()}`,
            items: result.items,
            total: result.total,
            pagination: result.pagination,
            filters: { search, sort, order },
            tableName: this.tableName,
            layout: 'layouts/main'
          });
          rendered = true;
          break;
        } catch (viewErr) {
          console.log(`❌ Vue ${viewPath} manquante, essai suivant...`);
        }
      }

      // ✅ ULTIME FALLBACK
      if (!rendered) {
        res.render('error', {
          message: `Table ${this.tableName} (${result.items.length} éléments)`,
          layout: 'layouts/main'
        });
      }

    } catch (err) {
      console.error(`Index ${this.tableName}:`, err);
      res.status(500).render('error', { 
        message: `Erreur ${this.tableName}: ${err.message}`,
        layout: 'layouts/main'
      });
    }
  }

  // 👁️ SHOW - ROBUSTE
  async show(req, res) {
    try {
      const item = await this.findById(req.params.id);
      if (!item) {
        return res.status(404).render('error', { 
          message: 'Élément non trouvé',
          layout: 'layouts/main'
        });
      }
      
      // ✅ Essai vues multiples
      const viewPaths = [
        `${this.tableName.toLowerCase()}/show`,
        `${this.tableName.toLowerCase()}`,
        'generic/show'
      ];

      for (const viewPath of viewPaths) {
        try {
          res.render(viewPath, { 
            title: `${this.tableName} #${req.params.id}`,
            item,
            tableName: this.tableName,
            layout: 'layouts/main'
          });
          return;
        } catch (viewErr) {
          // Continue au suivant
        }
      }

      // Fallback JSON si aucune vue
      res.json({ success: true, data: item });
      
    } catch (err) {
      console.error(`Show ${this.tableName}:`, err);
      res.status(500).render('error', { message: err.message });
    }
  }

  // Pagination sécurisée
  async getPaginated({ search, limit, offset, sort, order }) {
    let whereClause = '1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (nom LIKE ? OR description LIKE ?)';
      params = [`%${search}%`, `%${search}%`];
    }

    const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`;
    const listQuery = `SELECT * FROM ${this.tableName} WHERE ${whereClause} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;

    const [countRow, rows] = await Promise.all([
      this.queryRow(countQuery, params),
      this.queryAll(listQuery, [...params, limit, offset])
    ]);

    return {
      items: rows || [],
      total: countRow?.count || 0,
      pagination: {
        limit, 
        offset,
        pages: Math.ceil((countRow?.count || 0) / limit),
        current: Math.floor(offset / limit) + 1
      }
    };
  }

  // 🛠️ Helpers DB - SÉCURISÉS
  queryRow(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve(null);
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  queryAll(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // 💾 API JSON - SÉCURISÉES
  apiIndex(req, res) {
    const limit = parseInt(req.query.limit) || 50;
    this.recent(limit)
      .then(rows => res.json({ success: true, count: rows.length, data: rows }))
      .catch(err => res.status(500).json({ error: err.message }));
  }

  apiShow(req, res) {
    this.findById(req.params.id)
      .then(row => row ? res.json({ success: true, data: row }) : res.status(404).json({ error: 'Non trouvé' }))
      .catch(err => res.status(500).json({ error: err.message }));
  }
}

module.exports = GenericController;
