// controllers/pilotesController.js - COMPLET + LOGS ULTRA-DÉTAILLÉS 👇
const sqlite3 = require('sqlite3').verbose();
const GenericController = require('./genericController.cjs');

class PilotesController extends GenericController {
  constructor() {
    super('pilotes', '../database.db');
    console.log('🏫 [BOOT] PilotesController chargé (18 établissements)');
  }

  // 📋 Page d'index principale → views/pilotes.ejs
  async index(req, res) {
    console.log('🏫 [PILOTES.INDEX] ←←← APPEL DÉTECTÉ');
    console.log('   Query:', { limit: req.query.limit, search: req.query.search, type: req.query.type });
    
    try {
      console.log('🏫 [PILOTES] Test DB connexion...');
      const dbTest = await this.queryRow('SELECT COUNT(*) as count FROM Pilote');
      console.log('🏫 [DB] Test OK:', dbTest?.count || 0, 'pilotes');
      
      console.log('🏫 [PILOTES] Chargement stats...');
      const stats = await this.getStats();
      console.log('🏫 [PILOTES] Stats OK:', stats);

      console.log('🏫 [PILOTES] Pagination/filtres...');
      const paginated = await this.getPaginated({
        search: req.query.search, 
        limit: parseInt(req.query.limit || 20), 
        offset: parseInt(req.query.offset || 0),
        sort: 'nom', 
        order: 'ASC'
      });
      
      console.log('🏫 [PILOTES] Résultats:', paginated.items.length, '/', paginated.total);
      
      // ✅ FIX : 'pilotes' → PAS 'pilotes/index'
      console.log('🏫 [PILOTES.INDEX] → Render views/pilotes.ejs');
      res.render('pilotes', {  // ← SIMPLE 'pilotes'
        title: 'Pilotes NIRD - Établissements expérimentaux 2025/2026',
        items: paginated.items,
        total: paginated.total,
        pagination: paginated.pagination,
        filters: req.query,
        stats,
        forumUrl: 'https://edurl.fr/tchap-laforgeedu-nird',
        currentMenu: 'pilotes',
        layout: 'layouts/main'
      });
      
      console.log('🏫 [PILOTES.INDEX] ✅ RENDER OK');
      
    } catch (err) {
      console.error('🏫 [PILOTES.INDEX] 💥 ERREUR:', err.message);
      console.error('   Stack:', err.stack);
      
      // FALLBACK avec données statiques
      console.log('🏫 [FALLBACK] Données statiques');
      res.render('pilotes', {
        title: 'Pilotes NIRD (mode dégradé)',
        items: [
          { nom: 'Cité scolaire Bellevue', code: '0810005r', type: 'lycee', academie: 'Reims' },
          { nom: 'Collège Coat Mez', code: '0290033d', type: 'college', academie: 'Rennes' }
        ],
        total: 18,
        stats: { ecoles: 1, colleges: 6, lycees: 11, total: 18 },
        error: 'Mode dégradé',
        forumUrl: 'https://edurl.fr/tchap-laforgeedu-nird'
      });
    }
  }

  // 🗺️ Carte JSON Leaflet
  async map(req, res) {
    console.log('🗺️ [PILOTES.MAP] Coordonnées GPS demandées');
    
    try {
      const pilotes = await this.queryAll(`
        SELECT nom, ville, latitude, longitude, academie, type, url, code, status
        FROM Pilote 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      `);
      
      console.log('🗺️ [PILOTES.MAP] OK:', pilotes.length, 'pilotes géolocalisés');
      res.json({
        success: true,
        count: pilotes.length,
        data: pilotes
      });
      
    } catch (err) {
      console.error('🗺️ [PILOTES.MAP] ERREUR:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // 📊 Statistiques rapides
  async getStats() {
    console.log('📊 [PILOTES.STATS] Calcul stats par type...');
    
    try {
      const queries = {
        ecoles: this.queryRow("SELECT COUNT(*) as count FROM Pilote WHERE type = 'ecole'"),
        colleges: this.queryRow("SELECT COUNT(*) as count FROM Pilote WHERE type = 'college'"),
        lycees: this.queryRow("SELECT COUNT(*) as count FROM Pilote WHERE type = 'lycee'"),
        total: this.queryRow("SELECT COUNT(*) as count FROM Pilote"),
        actifs: this.queryRow("SELECT COUNT(*) as count FROM Pilote WHERE status = 'actif'")
      };

      const [ecoles, colleges, lycees, total, actifs] = await Promise.all([
        queries.ecoles, queries.colleges, queries.lycees, queries.total, queries.actifs
      ]);

      const stats = {
        ecoles: ecoles?.count || 0,
        colleges: colleges?.count || 0,
        lycees: lycees?.count || 0,
        total: total?.count || 0,
        actifs: actifs?.count || 0
      };
      
      console.log('📊 [PILOTES.STATS] Résultat:', stats);
      return stats;
      
    } catch (err) {
      console.error('📊 [PILOTES.STATS] ERREUR:', err.message);
      console.log('📊 [FALLBACK] Stats statiques');
      return { ecoles: 1, colleges: 6, lycees: 11, total: 18, actifs: 18 };
    }
  }

  // 🔍 Recherche avancée
  async search(req, res) {
    console.log('🔍 [PILOTES.SEARCH] Critères:', req.query);
    
    try {
      const { q, academie, type, status } = req.query;
      let whereClause = '1=1';
      let params = [];

      if (q) {
        whereClause += ' AND (nom LIKE ? OR ville LIKE ?)';
        params.push(`%${q}%`, `%${q}%`);
      }
      if (academie && academie !== 'all') {
        whereClause += ' AND academie = ?';
        params.push(academie);
      }
      if (type && type !== 'all') {
        whereClause += ' AND type = ?';
        params.push(type);
      }
      if (status && status !== 'all') {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      console.log('🔍 [PILOTES.SEARCH] Query:', whereClause.slice(0, 80) + '...');

      const pilotes = await this.queryAll(
        `SELECT * FROM Pilote WHERE ${whereClause} ORDER BY nom ASC LIMIT 100`,
        params
      );

      console.log('🔍 [PILOTES.SEARCH] OK:', pilotes.length, 'résultats');
      res.json({
        success: true,
        count: pilotes.length,
        data: pilotes
      });
      
    } catch (err) {
      console.error('🔍 [PILOTES.SEARCH] ERREUR:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // ➕ Ajout pilote (admin)
  async create(req, res) {
    console.log('➕ [PILOTES.CREATE] Nouvel établissement:', req.body.nom);
    
    try {
      const { nom, ville, academie, type, contact, email, status, latitude, longitude, url, code } = req.body;
      
      const result = await this.queryRow(`
        INSERT INTO Pilote (nom, ville, academie, type, contact, email, status, latitude, longitude, url, code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING rowid
      `, [nom, ville, academie, type, contact, email, status, latitude, longitude, url, code]);

      console.log('➕ [PILOTES.CREATE] OK - ID:', result.rowid);
      res.json({ success: true, id: result.rowid, message: 'Pilote ajouté' });
      
    } catch (err) {
      console.error('➕ [PILOTES.CREATE] ERREUR:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // 📈 Dashboard
  async dashboard(req, res) {
    console.log('📈 [PILOTES.DASHBOARD] Admin dashboard appelé');
    
    try {
      const stats = await this.getStats();
      console.log('📈 [DASHBOARD] Stats:', stats);
      
      res.render('pilotes/dashboard', {
        title: 'Dashboard Pilotes NIRD',
        stats,
        tableName: 'pilotes',
        layout: 'layouts/main'
      });
      
    } catch (err) {
      console.error('📈 [PILOTES.DASHBOARD] ERREUR:', err.message);
      res.status(500).render('error', { message: 'Erreur dashboard' });
    }
  }

  // 📄 Pagination SAFE
  async getPaginated({ search, limit = 20, offset = 0, sort = 'nom', order = 'ASC', whereClause = '1=1', params = [] }) {
    console.log('📄 [PILOTES.PAGINATE] limit:', limit, 'offset:', offset);
    
    try {
      const countQuery = `SELECT COUNT(*) as count FROM Pilote WHERE ${whereClause}`;
      const listQuery = `SELECT * FROM Pilote WHERE ${whereClause} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;

      const [countRow, rows] = await Promise.all([
        this.queryRow(countQuery, params),
        this.queryAll(listQuery, [...params, limit, offset])
      ]);

      const result = {
        items: rows,
        total: countRow?.count || 0,
        pagination: {
          limit, 
          offset,
          pages: Math.ceil((countRow?.count || 0) / limit),
          current: Math.floor(offset / limit) + 1
        }
      };
      
      console.log('📄 [PILOTES.PAGINATE] OK:', result.items.length, '/', result.total);
      return result;
      
    } catch (err) {
      console.error('📄 [PILOTES.PAGINATE] ERREUR:', err.message);
      return { items: [], total: 0, pagination: { limit, offset, pages: 1, current: 1 } };
    }
  }

  // 🔗 Détail pilote
  async show(req, res) {
    console.log('👁️ [PILOTES.SHOW] Code:', req.params.code);
    
    try {
      const pilote = await this.queryRow(
        'SELECT * FROM Pilote WHERE code = ?',
        [req.params.code]
      );
      
      if (pilote) {
        console.log('👁️ [PILOTES.SHOW] OK:', pilote.nom);
        res.render('pilotes/show', { pilote, layout: 'layouts/main' });
      } else {
        console.log('👁️ [PILOTES.SHOW] 404:', req.params.code);
        res.status(404).render('error', { message: 'Pilote non trouvé' });
      }
    } catch (err) {
      console.error('👁️ [PILOTES.SHOW] ERREUR:', err.message);
      res.status(500).render('error', { message: 'Erreur pilote' });
    }
  }
}

module.exports = new PilotesController();
