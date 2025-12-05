// controllers/PourquoiController.js
const sqlite3 = require('sqlite3').verbose();
const GenericController = require('./genericController.cjs');

class PourquoiController extends GenericController {
    constructor() {
        super('pourquoi_nird', '../database.db');
    }

    // 📖 POURQUOI NIRD - Page principale avec stats
    async index(req, res) {
        try {
            const [totalReferences, recentVisits, stats] = await Promise.all([
                this.count(),
                this.recent(5),
                this.getPourquoiStats()
            ]);

            res.render('pourquoi', {
                title: 'Pourquoi la démarche NIRD ?',
                layout: 'layouts/main',
                stats: stats,
                totalReferences,
                recentVisits,
                navigation: {
                    collectivites: '/collectivites',
                    reconditionnement: '/reconditionnement',
                    tools: '/tools',
                    demarche: '/demarche'
                }
            });
        } catch (err) {
            console.error('Pourquoi index error:', err);
            res.status(500).render('error', {
                message: 'Erreur chargement page Pourquoi',
                layout: 'layouts/main'
            });
        }
    }

    // 📊 STATS SPÉCIFIQUES POURQUOI
    async getPourquoiStats() {
        try {
            const stats = await Promise.all([
                this.queryRow("SELECT COUNT(*) as references FROM pourquoi_nird WHERE type = 'officiel'"),
                this.queryRow("SELECT COUNT(*) as collectivites FROM pourquoi_nird WHERE type = 'collectivite'"),
                this.queryRow("SELECT AVG(impact) as avg_impact FROM pourquoi_nird")
            ]);

            return {
                referencesOfficielles: stats[0]?.references || 0,
                collectivitesEngagees: stats[1]?.collectivites || 0,
                impactMoyen: stats[2]?.avg_impact || 0,
                totalVisites: await this.count(),
                updated: new Date().toLocaleDateString('fr-FR')
            };
        } catch (err) {
            console.error('Pourquoi stats error:', err);
            return { referencesOfficielles: 0, collectivitesEngagees: 0, impactMoyen: 0, totalVisites: 0 };
        }
    }

    // 📈 DASHBOARD POURQUOI
    async dashboard(req, res) {
        try {
            const [total, recent, topReferences, stats] = await Promise.all([
                this.count(),
                this.recent(10),
                this.topByField('impact', 5),
                this.getPourquoiStats()
            ]);

            res.render('pourquoi/dashboard', {
                title: 'Dashboard Pourquoi NIRD',
                total, recent, topReferences, stats,
                tableName: this.tableName,
                layout: 'layouts/main'
            });
        } catch (err) {
            console.error('Pourquoi dashboard error:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // ➕ AJOUT RÉFÉRENCE (formulaire)
    async create(req, res) {
        try {
            res.render('pourquoi/create', {
                title: 'Ajouter une référence NIRD',
                item: {},
                layout: 'layouts/main'
            });
        } catch (err) {
            console.error('Pourquoi create error:', err);
            res.status(500).render('error', { message: 'Erreur formulaire' });
        }
    }

    // 💾 SAUVEGARDE RÉFÉRENCE
    async store(req, res) {
        try {
            const { titre, source, type, impact, annee, url } = req.body;

            await new Promise((resolve, reject) => {
                this.db.run(
                    `INSERT INTO pourquoi_nird (titre, source, type, impact, annee, url, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [titre, source, type, parseFloat(impact) || 0, annee, url, new Date()],
                    function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            res.redirect('/pourquoi');
        } catch (err) {
            console.error('Pourquoi store error:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // 🔍 RECHERCHE RÉFÉRENCES
    async search(req, res) {
        try {
            const { q, type, annee } = req.query;
            const result = await this.getPaginated({
                search: q,
                limit: 20,
                offset: 0,
                sort: 'annee',
                order: 'DESC'
            });

            res.render('pourquoi/search', {
                title: 'Recherche références NIRD',
                items: result.items,
                total: result.total,
                filters: req.query,
                layout: 'layouts/main'
            });
        } catch (err) {
            console.error('Pourquoi search error:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // API JSON - Références
    async apiReferences(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const references = await this.queryAll(
                `SELECT * FROM pourquoi_nird ORDER BY annee DESC LIMIT ?`, [limit]
            );
            res.json({ success: true, count: references.length, data: references });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new PourquoiController();
