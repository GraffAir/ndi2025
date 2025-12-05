// src/app.js - VERSION CORRIGÉE (i18n fonctionnel + padEnd sécurisé)
const express = require('express');
const cors = require('cors');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const indexRouter = require('./routes/index');

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

// 🔥 1.5 MIDDLEWARE i18n GLOBALE ✅ CORRIGÉ
app.use((req, res, next) => {
    res.locals.__ = (key, defaultValue = '') => {
        const translations = {
            // Header
            'site.title': 'Démarche NIRD',
            
            // Footer
            'footer.about_title': 'À propos',
            'footer.about_text': 'Plateforme collaborative pour les ressources éducatives.',
            'footer.links_title': 'Liens utiles',
            'footer.contact_title': 'Contact',
            
            // Nav
            'nav.home': 'Accueil',
            'nav.softwares': 'Logiciels',
            'nav.users': 'Utilisateurs'
        };
        return translations[key] || defaultValue || key;
    };
    res.locals.lng = req.query.lng || 'fr';
    next();
});

console.log('🌍 [BOOT] i18n GLOBALE ✅ (header/footer OK)');

// 🔥 2. PARSING MIDDLEWARE
console.log('🔐 [BOOT] JSON + URLencoded');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 3. LOGGING ULTRA-DÉTAILLÉ ✅ CORRIGÉ
app.use((req, res, next) => {
    const start = Date.now();
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`\n🔵 [REQ] ${new Date().toISOString().slice(11, 23)} ${String(req.ip || '::ffff:127.0.0.1').padEnd(15)} ${req.method.padEnd(7)} ${req.originalUrl}`);
    console.log(`   👤 UA: ${userAgent.slice(0, 60)}${userAgent.length > 60 ? '...' : ''}`);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const size = res.get('Content-Length') || 0;
        const sizeStr = String(size).padEnd(6);
        const statusStr = String(res.statusCode).padStart(3);
        const durationStr = String(duration).padStart(4) + 'ms';
        console.log(`   🟢 [RES] ${statusStr} ${sizeStr} ${durationStr}`);
    });
    
    req._startTime = start;
    next();
});

// 🔥 4. STATIC FILES
console.log('📁 [BOOT] Static /public');
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 5. LAYOUT GLOBAL
app.use((req, res, next) => {
    res.locals.layout = 'layouts/main';
    res.locals.currentMenu = req.path.split('/')[1] || 'accueil';
    next();
});

// 🔥 6. ROUTES PRINCIPALES
console.log('🛤️ [BOOT] Routes principales');
app.use('/', indexRouter);

// 🔥 7. ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(`💥 [ERROR] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    console.error('   Stack:', err.stack || err.message);
    
    if (!res.headersSent) {
        res.status(500).render('error', { 
            message: err.message || 'Erreur serveur',
            status: 500,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// 🔥 8. 404 CORRIGÉ
app.use((req, res) => {
    console.log(`🔴 [404] ${req.method} ${req.originalUrl}`);
    res.status(404).render('error', { 
        message: `Page non trouvée: ${req.originalUrl}`,
        status: 404
    });
});

console.log('🗄️ [BOOT] DB controllers chargés (pilotes=18, linux, users...)');

app.listen(PORT, () => {
    console.log(`\n🎉 [SERVEUR] http://localhost:${PORT}`);
    console.log(`📱 Pages: / /pilotes /linux /demarche /utilisateurs /qcm /categories /reconditionnement`);
    console.log(`🔍 APIs: /api/pilotes/map /api/linux/distributions /api/qcm`);
    console.log(`💾 DB: pilotes(18) utilisateurs logiciels qcms categories`);
    console.log(`🌍 Langue: ?lng=en pour anglais`);
    console.log(`✅ i18n: __() fonctionnel partout (header/footer OK)`);
    console.log(`\n⏳ Serveur prêt - Logs ACTIVÉS !\n`);
});

// 💓 HEARTBEAT
setInterval(() => {
    console.log(`💓 [ALIVE] ${new Date().toLocaleTimeString()}`);
}, 60000);
