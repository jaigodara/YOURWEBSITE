/* Small bilingual UI toggle for the main navigation and Owner Studio menu. */
(function () {
  'use strict';
  const STORAGE_KEY = 'bishnoism_ui_language_v1';
  const labels = {
    'nav-home': { hi: 'मुखपृष्ठ', en: 'Home' },
    'nav-library': { hi: 'साहित्य', en: 'Literature' },
    'nav-exam': { hi: 'परीक्षा', en: 'Exams' },
    'nav-community': { hi: 'संवाद', en: 'Community' },
    'nav-profile': { hi: 'प्रोफ़ाइल', en: 'Profile' },
    'login': { hi: 'लॉगिन करें', en: 'Log in' },
    'owner-studio': { hi: '🛡️ ओनर स्टूडियो', en: '🛡️ Owner Studio' }
  };
  const ownerLabels = {
    dashboard: { hi: '📊 डैशबोर्ड', en: '📊 Dashboard' },
    questions: { hi: '📝 प्रश्न बैंक', en: '📝 Question Bank' },
    checking: { hi: '✅ उत्तर पुस्तिकाएँ जाँचें', en: '✅ Check Answer Sheets' },
    admit: { hi: '🎟️ प्रवेश-पत्र', en: '🎟️ Admit Cards' },
    notifications: { hi: '🔔 सूचनाएँ', en: '🔔 Notifications' },
    settings: { hi: '⚙️ सेटिंग्स', en: '⚙️ Settings' },
    exports: { hi: '📊 रिपोर्ट और एक्सपोर्ट', en: '📊 Reports & Exports' },
    media: { hi: '📚 साहित्य / मीडिया संपादन', en: '📚 Literature / Media' }
  };
  function applyLanguage(language) {
    const lang = language === 'en' ? 'en' : 'hi';
    document.documentElement.lang = lang === 'en' ? 'en' : 'hi';
    document.querySelectorAll('[data-lang-key]').forEach(element => {
      const item = labels[element.dataset.langKey];
      if (item) element.textContent = item[lang];
    });
    document.querySelectorAll('[data-studio-page]').forEach(element => {
      const item = ownerLabels[element.dataset.studioPage];
      if (item) element.textContent = item[lang];
    });
    document.querySelectorAll('[data-language-toggle]').forEach(button => {
      button.textContent = lang === 'hi' ? 'हिं / ENG' : 'ENG / हिं';
      button.setAttribute('aria-label', lang === 'hi' ? 'Switch interface to English' : 'इंटरफ़ेस हिंदी में बदलें');
      button.setAttribute('aria-pressed', String(lang === 'en'));
    });
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    window.BishnoismLanguage = { current: lang, set: applyLanguage };
  }
  function boot() {
    let initial = 'hi';
    try { initial = localStorage.getItem(STORAGE_KEY) || 'hi'; } catch (_) {}
    document.querySelectorAll('[data-language-toggle]').forEach(button => {
      if (button.dataset.languageBound === 'true') return;
      button.dataset.languageBound = 'true';
      button.addEventListener('click', () => {
        const current = document.documentElement.lang === 'en' ? 'en' : 'hi';
        applyLanguage(current === 'hi' ? 'en' : 'hi');
      });
    });
    applyLanguage(initial);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();