const GenericController = require('./genericController.cjs'); // import relatif et correct

class HomeController extends GenericController {
  constructor() {
    super('Home'); // Initialise le parent avec nom de table
  }

  home(req, res) {
    console.log('[home] render start -', new Date().toISOString(), req.method, req.originalUrl);
    console.log('[home] res.locals.layout =', res.locals?.layout);

    // ✅ UTILISE res.render() directement (méthode Express native)
    res.render('home/index', {
      title: 'DIRD',
      mainText: 'Bienvenue sur le site de la Démarche NIRD',
      layout: 'layouts/main'  // Layout explicite
    });
  }

  apiTest(req, res) {
    console.log('[apiTest] called -', new Date().toISOString(), req.method, req.originalUrl);
    res.json({ status: 'OK', message: 'API DIRD OK' });
  }

  debugRender(req, res) {
    console.log('[debugRender] start -', new Date().toISOString());
    res.render('home/index', { 
      title: 'DIRD (debug)', 
      layout: 'layouts/main',
      mainText: 'Mode debug actif'
    }, (err, html) => {
      if (err) {
        console.error('[debugRender] Error rendering view:', err.stack || err);
        return res.status(500).send('Erreur de rendu : ' + err.message);
      }
      console.log('[debugRender] Success - HTML length:', html?.length || 0);
      res.set('Content-Type', 'text/html');
      res.send(html);
    });
  }
}

module.exports = new HomeController();
