// src/app.js - VERSION ULTRA-COMPLÈTE avec i18next
const express = require('express');
const cors = require('cors');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const indexRouter = require('./routes/index');
const fs = require('fs');

const i18next = require('i18next');
const i18nextBackend = require('i18next-fs-backend');
const i18nextMiddleware = require('i18next-http-middleware');

const app = express();
const PORT = 3000;

console.log('🚀 [BOOT] Initialisation Express NIRD');
console.log('🔧 [BOOT] NODE_ENV =', process.env.NODE_ENV || 'development');
console.log('📂 [BOOT] Working directory:', __dirname);

// 🔥 1. VIEW ENGINE EN 1ER (CRITIQUE)
console.log('🎨 [BOOT] EJS + Layouts');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// 🔥 1.5 CONFIGURATION i18next
console.log('🌍 [BOOT] Configuration i18next...');

i18next
  .use(i18nextBackend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'fr',
    // Only preload languages for which we have files
    supportedLngs: ['fr', 'en'],
    preload: ['fr', 'en'],
    backend: {
      // Load translation files from src/locales (we created fr.json/en.json there)
      loadPath: path.join(__dirname, 'locales', '{{lng}}.json')
    },
    detection: {
      order: ['querystring', 'cookie', 'header'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      caches: ['cookie']
    },
    interpolation: {
      escapeValue: false // EJS échappe déjà
    }
  }, (err, t) => {
    if (err) {
      // err may not be an Error object; print it safely
      try {
        console.error('❌ [i18n] Erreur initialisation:', err && err.message ? err.message : JSON.stringify(err));
      } catch (e) {
        console.error('❌ [i18n] Erreur initialisation (non-serializable):', err);
      }
      if (err && err.stack) console.error(err.stack);
    } else {
      console.log('✅ [i18n] Langues chargées: fr, en');
    }
  });

// Middleware i18next
app.use(i18nextMiddleware.handle(i18next));

// Helper EJS pour i18n
app.use((req, res, next) => {
    // Fonction de traduction disponible dans toutes les vues
    res.locals.t = req.t.bind(req);
    res.locals.i18n = req.i18n;
    res.locals.lng = req.language || req.i18n.language || 'fr';
    
    // Fallback pour compatibilité ancienne syntaxe
    res.locals.__ = (key, defaultValue = '') => {
        try {
            const translation = req.t(key);
            return translation !== key ? translation : (defaultValue || key);
        } catch (error) {
            return defaultValue || key;
        }
    };
    
    next();
});

console.log('✅ [i18n] Middleware actif - t() et __() disponibles');

// Option to temporarily disable translations globally.
// Set environment variable I18N_DISABLED=1 to turn off translations (useful for debugging).
if (process.env.I18N_DISABLED === '1') {
  console.log('⚠️ [i18n] Translations are DISABLED via I18N_DISABLED=1');
  app.use((req, res, next) => {
    // override translation helpers with no-op / identity functions
    res.locals.t = (key) => (typeof key === 'string' ? key : '');
    res.locals.__ = (key, defaultValue = '') => (defaultValue || key);
    res.locals.i18n = { language: req.query.lng || 'fr' };
    next();
  });
}

// 🔥 2. PARSING MIDDLEWARE
console.log('🔐 [BOOT] JSON + URLencoded + CORS');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 3. LOGGING ULTRA-DÉTAILLÉ
app.use((req, res, next) => {
    const start = Date.now();
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = (req.ip || '::ffff:127.0.0.1').padEnd(15);
    const method = req.method.padEnd(7);
    
    console.log(`\n🔵 [REQ] ${new Date().toISOString().slice(11, 23)} ${ip} ${method} ${req.originalUrl}`);
    console.log(`   👤 UA: ${userAgent.slice(0, 60)}${userAgent.length > 60 ? '...' : ''}`);
    console.log(`   🌍 Langue: ${req.language || 'fr'}`);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const size = (res.get('Content-Length') || 0).toString().padEnd(6);
        const status = res.statusCode.toString().padStart(3);
        const durationStr = duration.toString().padStart(4) + 'ms';
        
        const statusIcon = res.statusCode < 300 ? '🟢' : res.statusCode < 400 ? '🟡' : '🔴';
        console.log(`   ${statusIcon} [RES] ${status} ${size} ${durationStr}`);
    });
    
    next();
});

// 🔥 4. STATIC FILES
console.log('📁 [BOOT] Static /public');
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));
console.log('📂 [BOOT] Public path:', publicPath);

// 🔥 5. LAYOUT GLOBAL + VARIABLES
app.use((req, res, next) => {
    res.locals.layout = 'layouts/main';
    res.locals.currentMenu = req.path.split('/')[1] || 'accueil';
    res.locals.currentPath = req.path;
    res.locals.query = req.query;
    next();
});

// 🔥 6. ROUTES PRINCIPALES
console.log('🛤️  [BOOT] Routes principales');
app.use('/', indexRouter);

// 🔥 7. ERROR HANDLER
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`\n💥 [ERROR] ${timestamp} ${req.method} ${req.originalUrl}`);
    console.error('   Message:', err.message);
    console.error('   Stack:', err.stack);
    
    if (!res.headersSent) {
        res.status(err.status || 500).render('error', { 
            message: err.message || 'Erreur serveur',
            status: err.status || 500,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            showHeader: true,
            showFooter: true
        });
    }
});

// 🔥 8. 404 HANDLER
app.use((req, res) => {
    console.log(`🔴 [404] ${req.method} ${req.originalUrl}`);
    res.status(404).render('error', { 
        message: `Page non trouvée: ${req.originalUrl}`,
        status: 404,
        showHeader: true,
        showFooter: true
    });
});

console.log('🗄️  [BOOT] DB controllers chargés (pilotes, linux, users...)');

// 🔥 9. DÉMARRAGE SERVEUR
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log(`🎉 [SERVEUR] Démarré sur http://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('\n📱 Pages disponibles:');
    console.log('   / - Accueil');
    console.log('   /pilotes - Établissements pilotes');
    console.log('   /linux - Distributions Linux');
    console.log('   /demarche - La démarche NIRD');
    console.log('   /utilisateurs - Gestion utilisateurs');
    console.log('   /reconditionnement - Reconditionnement');
    console.log('   /pourquoi - Pourquoi NIRD');
    
    console.log('\n🔍 APIs disponibles:');
    console.log('   /api/pilotes/map - Carte GPS');
    console.log('   /api/linux/distributions - Liste distributions');
    
    console.log('\n💾 Base de données:');
    console.log('   pilotes (18 établissements)');
    console.log('   utilisateurs');
    console.log('   logiciels');
    console.log('   categories');
    
    console.log('\n🌍 Internationalisation:');
    console.log('   ?lng=fr - Français (défaut)');
    console.log('   ?lng=en - English');
    console.log('   ?lng=es - Español');
    console.log('   Fonctions: t() et __() disponibles partout');
    
    console.log('\n✅ Serveur prêt - Logs ACTIVÉS');
    console.log('='.repeat(60) + '\n');
});

// 💓 HEARTBEAT (optionnel - commenter si logs trop verbeux)
setInterval(() => {
    const time = new Date().toLocaleTimeString('fr-FR');
    console.log(`💓 [ALIVE] ${time} - Serveur actif`);
}, 60000); // Toutes les minutes

// 🔄 GRACEFUL SHUTDOWN
process.on('SIGINT', () => {
    console.log('\n\n🛑 [SHUTDOWN] Arrêt gracieux du serveur...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 [SHUTDOWN] Signal SIGTERM reçu...');
    process.exit(0);
});

module.exports = app;
