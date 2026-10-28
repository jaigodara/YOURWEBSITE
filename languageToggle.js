/* Small bilingual UI toggle and profile accordion for Bishnoism. */
(function () {
  'use strict';
  const STORAGE_KEY = 'bishnoism_ui_language_v1';
  const labels = {
    'nav-home': { hi: 'मुखपृष्ठ', en: 'Home' },
    'nav-library': { hi: 'साहित्य', en: 'Literature' },
    'nav-exam': { hi: 'परीक्षा', en: 'Exams' },
    'nav-community': { hi: 'संवाद', en: 'Community' },
    'nav-profile': { hi: 'प्रोफ़ाइल', en: 'Profile' },
    login: { hi: 'लॉगिन करें', en: 'Log in' },
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
    document.documentElement.lang = lang;
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
    document.dispatchEvent(new CustomEvent('bishnoism:languagechange', { detail: { language: lang } }));
  }

  function organizeProfileAccordion() {
    const modal = document.getElementById('userProfileModal');
    const content = modal && modal.querySelector('.p-5.space-y-4.text-xs');
    if (!content || content.dataset.accordionBound === 'true') return;
    content.dataset.accordionBound = 'true';
    const makeSection = (title, open) => {
      const details = document.createElement('details');
      details.className = 'profile-accordion';
      if (open) details.open = true;
      const summary = document.createElement('summary');
      summary.textContent = title;
      details.append(summary);
      return details;
    };
    const personal = makeSection('👤 व्यक्तिगत जानकारी / Personal Information', true);
    const security = makeSection('🔐 खाता सुरक्षा / Account Security', false);
    const exams = makeSection('🎟️ मेरी परीक्षाएँ / My Exams', false);
    const actions = makeSection('⚙️ खाता विकल्प / Account Actions', false);
    const moved = new Set();

    [
      { section: personal, ids: ['profileEmailDisplay', 'statMalaTotal', 'profEditName', 'profEditLocation'] },
      { section: security, ids: ['profEditPhone', 'profileMobileCurrentPassword', 'profileCurrentPassword'] },
      { section: actions, ids: ['profileOwnerStudioLink'] }
    ].forEach(group => group.ids.forEach(id => {
      const target = document.getElementById(id);
      const child = target && Array.from(content.children).find(element => element === target || element.contains(target));
      if (child && !moved.has(child)) { group.section.append(child); moved.add(child); }
    }));

    Array.from(content.children).forEach(child => {
      if (moved.has(child)) return;
      if (child.matches('button[onclick*="saveProfile"]')) { personal.append(child); moved.add(child); }
      else if (child.matches('button[onclick*="logout"]')) { actions.append(child); moved.add(child); }
    });

    const note = document.createElement('p');
    note.className = 'text-xs leading-6 text-stone-600';
    note.textContent = 'अपनी परीक्षाएँ, प्रवेश-पत्र और प्रकाशित परिणाम देखने के लिए परीक्षा पोर्टल खोलें।';
    const portal = document.createElement('a');
    portal.href = './exam-portal.html';
    portal.className = 'profile-accordion-link';
    portal.textContent = '🛡️ परीक्षा पोर्टल खोलें';
    const results = document.createElement('button');
    results.type = 'button';
    results.className = 'profile-accordion-link';
    results.textContent = '📊 मेरे परिणाम देखें';
    results.addEventListener('click', () => {
      if (typeof window.switchTab === 'function') window.switchTab('quiz');
      window.setTimeout(() => document.getElementById('myResultsPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      if (typeof window.BishnoiAuth?.closeProfileModal === 'function') window.BishnoiAuth.closeProfileModal();
    });
    exams.append(note, portal, results);

    content.prepend(personal, exams, security, actions);
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
    organizeProfileAccordion();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();