// src/controllers/linuxController.js
const sqlite3 = require('sqlite3').verbose();
const GenericController = require('./genericController.cjs');

class LinuxController extends GenericController {
  constructor() {
    super('linux_distributions', '../database.db');
    console.log('🐧 LinuxController initialisé');
  }

  // Toutes les méthodes requises par les routes
  async index(req, res) {
    res.render('linux', { 
      title: '🐧 Linux NIRD',
      currentMenu: 'linux'
    });
  }

  async apiDistributions(req, res) {
    res.json({ success: true, data: [] }); // Mock pour test
  }

  async apiDistributionById(req, res) {
    res.json({ success: true, data: { id: req.params.id } });
  }

  async apiSearch(req, res) {
    res.json({ success: true, data: [] });
  }

  async dashboard(req, res) {
    res.render('error', { message: 'Dashboard Linux' });
  }

  // Héritées de GenericController (déjà présentes)
  async show(req, res) {}
  async apiIndex(req, res) {}
}

module.exports = new LinuxController(); // ✅ EXPORT SINGLTON
