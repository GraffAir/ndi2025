const GenericController = require('./genericController.cjs');
const sqlite3 = require('sqlite3').verbose();

class QCMController extends GenericController {
  constructor() {
    super('qcms', '../database.db'); // Hérite de la table 'qcms'
    console.log('🎯 QCM Controller étendu initialisé');
  }

  // 📊 Dashboard QCM spécifique
  async dashboard(req, res) {
    try {
      const [totalQCMs, totalQuestions, recentQCMs, topQCMs] = await Promise.all([
        this.count(),
        this.queryRow("SELECT COUNT(*) as count FROM questions"),
        this.recent(5),
        this.topByField('score_moyen', 10)
      ]);

      res.render('qcm/dashboard', {
        title: 'QCM Dashboard',
        stats: {
          totalQCMs: totalQCMs?.count || 0,
          totalQuestions: totalQuestions?.count || 0,
          avgScore: await this.getAverageScore()
        },
        recent: recentQCMs,
        top: topQCMs,
        tableName: this.tableName,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('QCM Dashboard:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // 🎯 Passer un QCM (affichage questions aléatoirement)
  async show(req, res) {
    try {
      const qcm = await this.findById(req.params.id);
      if (!qcm) return res.status(404).render('404', { layout: 'layouts/main' });

      // Charger les questions avec réponses mélangées
      const questions = await this.queryAll(`
        SELECT q.*, r.*
        FROM questions q 
        LEFT JOIN reponses r ON q.id = r.question_id 
        WHERE q.qcm_id = ? 
        ORDER BY q.id, RANDOM()
      `, [req.params.id]);

      // Regrouper questions + réponses
      const qcmWithQuestions = this.groupQuestions(questions, qcm);

      res.render('qcm/show', {
        title: `QCM: ${qcm.titre}`,
        qcm: qcmWithQuestions,
        tableName: this.tableName,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error(`QCM Show ${req.params.id}:`, err);
      res.status(500).json({ error: err.message });
    }
  }

  // ✅ Soumettre les réponses
  async submit(req, res) {
    try {
      const { reponses } = req.body; // [{question_id: 1, reponse_id: 5}, ...]
      
      if (!Array.isArray(reponses) || reponses.length === 0) {
        return res.status(400).json({ error: 'Aucune réponse fournie' });
      }

      const score = await this.calculateScore(req.params.id, reponses);
      
      // Optionnel : sauvegarder résultat utilisateur
      // await this.saveResult(req.user?.id, req.params.id, score);

      res.json({
        success: true,
        score,
        message: `Score: ${score.score}/${score.total} (${score.pourcentage}%)`,
        passed: score.pourcentage >= 70
      });
    } catch (err) {
      console.error('QCM Submit:', err);
      res.status(500).json({ error: err.message });
    }
  }

  // 📈 Calculer le score
  calculateScore(qcmId, reponsesUser) {
    return new Promise((resolve, reject) => {
      const placeholders = reponsesUser.map(() => '?').join(',');
      const params = [
        qcmId, 
        ...reponsesUser.flatMap(r => [r.question_id, r.reponse_id])
      ];

      this.db.all(`
        SELECT 
          q.id as question_id, 
          q.points,
          r.id as reponse_id,
          r.correcte
        FROM questions q
        LEFT JOIN reponses r ON q.id = r.question_id 
        WHERE q.qcm_id = ? AND 
          (q.id, r.id) IN (${placeholders})
      `, params, (err, results) => {
        if (err) return reject(err);

        let score = 0, total = 0;
        results.forEach(row => {
          total += row.points;
          if (row.correcte) score += row.points;
        });

        resolve({
          score,
          total,
          pourcentage: total > 0 ? Math.round((score / total) * 100) : 0
        });
      });
    });
  }

  // 📋 QCMs par catégorie
  async byCategory(req, res) {
    try {
      const { categorie } = req.params;
      const qcms = await this.queryAll(
        `SELECT * FROM qcms WHERE categorie = ? ORDER BY created_at DESC LIMIT 20`,
        [categorie]
      );

      res.render('qcm/by-category', {
        title: `QCM ${categorie}`,
        qcms,
        categorie,
        tableName: this.tableName,
        layout: 'layouts/main'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // 🆕 Créer QCM (API)
  async store(req, res) {
    try {
      const { titre, description, questions } = req.body;
      
      if (!titre || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Données invalides' });
      }

      const result = await this.queryRow(`
        INSERT INTO qcms (titre, description, categorie, created_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP) RETURNING id
      `, [titre, description || '', '']);

      const qcmId = result.id;

      // Insérer questions + réponses
      for (const question of questions) {
        const qResult = await this.queryRow(`
          INSERT INTO questions (qcm_id, libelle, points) 
          VALUES (?, ?, ?) RETURNING id
        `, [qcmId, question.libelle, question.points || 1]);

        for (const reponse of question.reponses) {
          await this.queryRow(`
            INSERT INTO reponses (question_id, libelle, correcte) 
            VALUES (?, ?, ?)
          `, [qResult.id, reponse.libelle, reponse.correcte || 0]);
        }
      }

      res.json({ success: true, id: qcmId, message: 'QCM créé !' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // Helpers privés
  groupQuestions(questionsRaw, qcm) {
    const grouped = {};
    questionsRaw.forEach(row => {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          libelle: row.libelle,
          points: row.points,
          reponses: []
        };
      }
      if (row.reponse_id) {
        grouped[row.id].reponses.push({
          id: row.reponse_id,
          libelle: row.libelle_reponse || row.libelle, // adapter selon schema
          correcte: row.correcte || 0
        });
      }
    });

    return {
      ...qcm,
      questions: Object.values(grouped)
    };
  }

  async getAverageScore() {
    const result = await this.queryRow(`
      SELECT 
        AVG((score_total::float / total_points) * 100) as avg_score
      FROM resultats 
      WHERE score_total > 0
    `);
    return Math.round(result?.avg_score || 0);
  }
}

module.exports = QCMController;
