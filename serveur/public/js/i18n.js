import i18next from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18next
  .use(Backend)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'fr',
    lng: 'fr',
    debug: true,
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' }
  })
  .then(() => {
    // Traduit tout au chargement
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = i18next.t(el.dataset.i18n);
    });
    
    // Interpolation dynamique
    document.querySelectorAll('[data-i18n-interp]').forEach(el => {
      const key = el.dataset.i18nInterp;
      const vars = el.dataset.vars ? JSON.parse(el.dataset.vars) : {};
      el.textContent = i18next.t(key, vars);
    });
  });

import i18next from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18next
  .use(Backend)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'fr',
    lng: 'fr',
    debug: true,
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' }
  })
  .then(() => {
    // Traduit tout au chargement
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = i18next.t(el.dataset.i18n);
    });
    
    // Interpolation dynamique
    document.querySelectorAll('[data-i18n-interp]').forEach(el => {
      const key = el.dataset.i18nInterp;
      const vars = el.dataset.vars ? JSON.parse(el.dataset.vars) : {};
      el.textContent = i18next.t(key, vars);
    });
  });
