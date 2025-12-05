// controllers/pilotesController.js - ULTRA-COMPLET avec SQL direct
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const GenericController = require('./genericController.cjs');

class PilotesController extends GenericController {
  constructor() {
    // Chemin absolu vers la DB
    const dbPath = path.join(__dirname, '..', 'database.db');
    super('pilotes', dbPath);
    
    console.log('🏫 [BOOT] PilotesController chargé');
    console.log('📂 [BOOT] DB Path:', dbPath);
    
    // Vérifier que la DB existe
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      console.error('❌ [BOOT] database.db INTROUVABLE à:', dbPath);
    } else {
      console.log('✅ [BOOT] database.db trouvée');
    }
  }

  // 📋 INDEX - Liste tous les pilotes
  async index(req, res) {
    console.log('\n🏫 [PILOTES.INDEX] ←←← APPEL DÉTECTÉ');
    console.log('   Query params:', req.query);
    
    try {
      // 1. Test connexion DB
      console.log('🔌 [DB] Test connexion...');
      const dbTest = await this.queryRow('SELECT COUNT(*) as count FROM Pilote');
      console.log('✅ [DB] Connexion OK -', dbTest?.count || 0, 'pilotes en DB');
      
      // 2. Récupérer les stats
      console.log('📊 [STATS] Calcul statistiques...');
      const stats = await this.getStats();
      console.log('✅ [STATS] Récupérées:', stats);
      
      // 3. Récupérer les pilotes avec pagination
      console.log('📄 [PAGINATE] Récupération pilotes...');
      const paginated = await this.getPaginated({
        search: req.query.search,
        limit: parseInt(req.query.limit || 20),
        offset: parseInt(req.query.offset || 0),
        sort: 'nom',
        order: 'ASC'
      });
      
      console.log('✅ [PAGINATE]', paginated.items.length, '/', paginated.total, 'pilotes');
      
      // 4. Rendu
      console.log('🎨 [RENDER] views/pilotes.ejs');
      res.render('pilotes', {
        title: 'Pilotes NIRD - Établissements expérimentaux 2025/2026',
        items: paginated.items,
        total: paginated.total,
        pagination: paginated.pagination,
        filters: req.query,
        stats,
        forumUrl: 'https://edurl.fr/tchap-laforgeedu-nird',
        currentMenu: 'pilotes',
        showHeader: true,
        showFooter: true
      });
      
      console.log('✅ [PILOTES.INDEX] Rendu terminé\n');
      
    } catch (err) {
      console.error('❌ [PILOTES.INDEX] ERREUR:', err.message);
      console.error('   Stack:', err.stack);
      
      // FALLBACK mode dégradé
      console.log('🔄 [FALLBACK] Mode dégradé activé');
      res.render('pilotes', {
        title: 'Pilotes NIRD (mode dégradé)',
        items: this.getFallbackData(),
        total: 18,
        stats: { ecoles: 1, colleges: 6, lycees: 11, total: 18, actifs: 18 },
        pagination: { limit: 20, offset: 0, pages: 1, current: 1 },
        filters: {},
        error: 'Connexion DB échouée - Données statiques',
        forumUrl: 'https://edurl.fr/tchap-laforgeedu-nird',
        showHeader: true,
        showFooter: true
      });
    }
  }

  // 📊 STATS - Calcul statistiques
  async getStats() {
    console.log('📊 [STATS] Début calcul...');
    
    try {
      // Requêtes SQL parallèles
      const [ecoles, colleges, lycees, total, actifs] = await Promise.all([
        this.queryRow("SELECT COUNT(*) as count FROM Pilote WHERE type = 'ecole'"),
        this.queryRow("SELECT COUNT(*) as count FROM Pilote WHERE type = 'college'"),
        this.queryRow("SELECT COUNT(*) as count FROM Pilote WHERE type = 'lycee'"),
        this.queryRow("SELECT COUNT(*) as count FROM Pilote"),
        this.queryRow("SELECT COUNT(*) as count FROM Pilote WHERE status = 'actif'")
      ]);

      const stats = {
        ecoles: ecoles?.count || 0,
        colleges: colleges?.count || 0,
        lycees: lycees?.count || 0,
        total: total?.count || 0,
        actifs: actifs?.count || 0
      };
      
      console.log('✅ [STATS] Calculées:', stats);
      return stats;
      
    } catch (err) {
      console.error('❌ [STATS] ERREUR:', err.message);
      return { ecoles: 1, colleges: 6, lycees: 11, total: 18, actifs: 18 };
    }
  }

  // 📄 PAGINATION - Récupère pilotes avec filtres
  async getPaginated({ search, limit = 20, offset = 0, sort = 'nom', order = 'ASC' }) {
    console.log('📄 [PAGINATE] Params:', { search, limit, offset, sort, order });
    
    try {
      let whereClause = '1=1';
      let params = [];

      // Filtre recherche
      if (search) {
        whereClause += ' AND (nom LIKE ? OR ville LIKE ? OR academie LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Requêtes SQL
      const countSQL = `SELECT COUNT(*) as count FROM Pilote WHERE ${whereClause}`;
      const listSQL = `SELECT * FROM Pilote WHERE ${whereClause} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;

      console.log('🔍 [SQL COUNT]', countSQL);
      console.log('🔍 [SQL LIST]', listSQL);

      const [countRow, rows] = await Promise.all([
        this.queryRow(countSQL, params),
        this.queryAll(listSQL, [...params, limit, offset])
      ]);

      const result = {
        items: rows || [],
        total: countRow?.count || 0,
        pagination: {
          limit,
          offset,
          pages: Math.ceil((countRow?.count || 0) / limit),
          current: Math.floor(offset / limit) + 1
        }
      };
      
      console.log('✅ [PAGINATE] Résultat:', result.items.length, '/', result.total);
      return result;
      
    } catch (err) {
      console.error('❌ [PAGINATE] ERREUR:', err.message);
      return {
        items: this.getFallbackData(),
        total: 18,
        pagination: { limit, offset, pages: 1, current: 1 }
      };
    }
  }

  // 🗺️ MAP - Données géolocalisées pour Leaflet
  async map(req, res) {
    console.log('🗺️ [MAP] Demande coordonnées GPS');
    
    try {
      const pilotes = await this.queryAll(`
        SELECT 
          nom, ville, latitude, longitude, academie, 
          type, url, code, status
        FROM Pilote 
        WHERE latitude IS NOT NULL 
          AND longitude IS NOT NULL
        ORDER BY nom ASC
      `);
      
      console.log('✅ [MAP]', pilotes.length, 'pilotes géolocalisés');
      
      res.json({
        success: true,
        count: pilotes.length,
        data: pilotes
      });
      
    } catch (err) {
      console.error('❌ [MAP] ERREUR:', err.message);
      res.status(500).json({
        success: false,
        error: err.message,
        data: []
      });
    }
  }

  // 🔍 SEARCH - Recherche avancée
  async search(req, res) {
    console.log('🔍 [SEARCH] Critères:', req.query);
    
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

      const pilotes = await this.queryAll(
        `SELECT * FROM Pilote WHERE ${whereClause} ORDER BY nom ASC LIMIT 100`,
        params
      );

      console.log('✅ [SEARCH]', pilotes.length, 'résultats');
      
      res.json({
        success: true,
        count: pilotes.length,
        data: pilotes
      });
      
    } catch (err) {
      console.error('❌ [SEARCH] ERREUR:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // 👁️ SHOW - Détail d'un pilote
  async show(req, res) {
    console.log('👁️ [SHOW] Code:', req.params.code);
    
    try {
      const pilote = await this.queryRow(
        'SELECT * FROM Pilote WHERE code = ?',
        [req.params.code]
      );
      
      if (pilote) {
        console.log('✅ [SHOW] Pilote trouvé:', pilote.nom);
        res.render('pilotes/show', {
          pilote,
          title: `${pilote.nom} - Pilote NIRD`,
          showHeader: true,
          showFooter: true
        });
      } else {
        console.log('❌ [SHOW] Pilote introuvable:', req.params.code);
        res.status(404).render('error', {
          message: 'Établissement pilote non trouvé',
          code: 404
        });
      }
    } catch (err) {
      console.error('❌ [SHOW] ERREUR:', err.message);
      res.status(500).render('error', {
        message: 'Erreur lors de la récupération du pilote'
      });
    }
  }

  // 📦 FALLBACK - Données statiques
  getFallbackData() {
    return [
      {
        nom: 'Cité scolaire Bellevue',
        code: '0810005r',
        type: 'lycee',
        ville: 'Albi',
        academie: 'Toulouse',
        status: 'actif'
      },
      {
        nom: 'Collège Coat Mez',
        code: '0290033d',
        type: 'college',
        ville: 'Daoulas',
        academie: 'Rennes',
        status: 'actif'
      },
      {
        nom: 'Lycée Condorcet',
        code: '0750652a',
        type: 'lycee',
        ville: 'Paris',
        academie: 'Paris',
        status: 'actif'
      }
    ];
  }
}

module.exports = new PilotesController();
