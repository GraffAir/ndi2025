const GenericController = require('./genericController.cjs');

class CategorieController extends GenericController {
  constructor() {
    super('Categorie', '../database.db');
    console.log('🏷️ Catégorie Controller étendu initialisé');
  }

  // 📊 Dashboard catégories
  async dashboard(req, res) {
    try {
      const [total, totalQCMs, totalLogiciels, topCategories] = await Promise.all([
        this.count(),
        this.queryRow("SELECT COUNT(*) as count FROM qcms"),
        this.queryRow("SELECT COUNT(*) as count FROM logiciels"),
        this.topByField('qcm_count', 10)
      ]);

      res.render('categories/dashboard', {
        title: 'Catégories Dashboard',
        stats: {
          totalCategories: total?.count || 0,
          totalQCMs: totalQCMs?.count || 0,
          totalLogiciels: totalLogiciels?.count || 0
        },
        top: topCategories,
        tableName: this.tableName,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Catégories Dashboard:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // 📋 Catégories par type de contenu
  async byType(req, res) {
    try {
      const { type } = req.params; // 'qcm', 'logiciel', etc.
      const categories = await this.queryAll(`
        SELECT c.*, 
               COUNT(q.id) as qcm_count,
               COUNT(l.id) as logiciel_count
        FROM Categorie c
        LEFT JOIN qcms q ON c.nom = q.categorie
        LEFT JOIN logiciels l ON c.nom = l.categorie
        WHERE c.type = ? OR c.type = 'all'
        GROUP BY c.id, c.nom, c.couleur, c.description
        ORDER BY qcm_count DESC, logiciel_count DESC
        LIMIT 20
      `, [type]);

      res.render('categories/by-type', {
        title: `Catégories ${type}`,
        categories,
        type,
        tableName: this.tableName,
        layout: 'layouts/main'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = CategorieController;
