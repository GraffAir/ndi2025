// controllers/demarcheController.js - AVEC LOGS ULTRA-DÉTAILLÉS 👇
const sqlite3 = require('sqlite3').verbose();
const GenericController = require('./genericController.cjs');

class DemarcheController extends GenericController {
  constructor() {
    super('demarche_jalons', '../database.db');
    console.log('🚸 [BOOT] DémarcheController chargé (3 jalons)');
  }

  // 📋 Page principale démarche
  async index(req, res) {
    console.log('🚸 [DEMARCHE.INDEX] ←←← APPEL DÉTECTÉ');
    console.log('   Query params:', req.query);
    
    try {
      console.log('🚸 [DEMARCHE] Chargement 3 jalons statiques...');
      
      // Données statiques des 3 jalons (toujours dispo)
      const jalons = [
        {
          numero: 1,
          titre: 'Mobilisation',
          objectif: 'sensibiliser l’établissement scolaire et initier une dynamique collective',
          actions: [
            'Enseignant volontaire → contact NIRD',
            'Temps d’information équipe éducative',
            'Réseau Tchap + webinaires',
            'Supports pédagogiques',
            'Direction et collectivité informées'
          ],
          resultat: 'Prise de conscience collective + relais interne'
        },
        {
          numero: 2,
          titre: 'Expérimentation',
          objectif: 'tester des solutions concrètes et évaluer leur pertinence',
          actions: [
            'Postes Linux (neufs/reconditionnés)',
            'Club informatique élèves (collèges/lycées)',
            'PrimTux écoles primaires',
            'Formation enseignants/élèves',
            'Suivi + coordinateur NIRD'
          ],
          resultat: 'Expérience concrète documentée'
        },
        {
          numero: 3,
          titre: 'Intégration',
          objectif: 'inscrire durablement la démarche dans l’établissement',
          actions: [
            'Intégration parc informatique',
            'Projet d’établissement',
            'Référent NIRD officiel',
            'Coopération structurée collectivité',
            'Communication externe'
          ],
          resultat: 'Intégration complète institutionnelle'
        }
      ];

      console.log('🚸 [DEMARCHE] 3 jalons préparés → render demarche.ejs');
      
      res.render('demarche', {
        title: '🚸 Démarche NIRD - 3 jalons progressifs',
        jalons,
        forumUrl: 'https://edurl.fr/tchap-laforgeedu-nird',
        currentMenu: 'demarche',
        layout: 'layouts/main'
      });
      
      console.log('🚸 [DEMARCHE.INDEX] →→→ RENDER OK (3 jalons)');
      
    } catch (err) {
      console.error('🚸 [DEMARCHE.INDEX] 💥 ERREUR:', err.message);
      console.error('   Stack:', err.stack);
      res.status(500).render('error', { message: 'Erreur démarche' });
    }
  }

  // 🔍 Recherche jalons
  async search(req, res) {
    console.log('🔍 [DEMARCHE.SEARCH] q=', req.query.q);
    
    try {
      const { q } = req.query;
      
      // Mock DB - recherche statique
      const jalonsMock = [
        { id: 1, titre: 'Mobilisation', objectif: 'sensibiliser établissement' },
        { id: 2, titre: 'Expérimentation', objectif: 'tester solutions Linux' },
        { id: 3, titre: 'Intégration', objectif: 'inscrire démarche durable' }
      ];
      
      const resultats = q ? jalonsMock.filter(j => 
        j.titre.toLowerCase().includes(q.toLowerCase()) ||
        j.objectif.toLowerCase().includes(q.toLowerCase())
      ) : [];
      
      console.log('🔍 [DEMARCHE.SEARCH] Résultats:', resultats.length);
      res.json({ success: true, count: resultats.length, data: resultats });
      
    } catch (err) {
      console.error('🔍 [DEMARCHE.SEARCH] ERREUR:', err.message);
      res.json({ success: false, data: [] });
    }
  }

  // 📊 Stats démarche
  async stats(req, res) {
    console.log('📊 [DEMARCHE.STATS] Appel stats');
    
    try {
      const stats = {
        jalons: 3,
        etablissements: 18, // lien avec pilotes
        enseignants: 1200,
        collectivites: 42,
        timestamp: new Date().toISOString()
      };
      
      console.log('📊 [DEMARCHE.STATS] OK:', stats);
      res.json({ success: true, data: stats });
      
    } catch (err) {
      console.error('📊 [DEMARCHE.STATS] ERREUR:', err.message);
      res.status(500).json({ error: err.message });
    }
  }

  // 📈 Dashboard
  async dashboard(req, res) {
    console.log('📈 [DEMARCHE.DASHBOARD] Admin dashboard');
    
    try {
      res.render('demarche/dashboard', {
        title: 'Dashboard Démarche NIRD',
        stats: { jalons: 3, etablissements: 18, enseignants: 1200 },
        layout: 'layouts/main'
      });
      console.log('📈 [DEMARCHE.DASHBOARD] Render OK');
      
    } catch (err) {
      console.error('📈 [DEMARCHE.DASHBOARD] ERREUR:', err.message);
      res.status(500).render('error', { message: 'Erreur dashboard' });
    }
  }
}

module.exports = new DemarcheController();
