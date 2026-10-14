/*
 * Corrected copy based on the original uploaded script.js.
 * Static syntax and targeted regression fixes have been applied.
 * This has not been end-to-end tested against the live Firebase project,
 * your current HTML/CSS, Firestore rules, or Cloudflare Worker.
 */
/* ============================================================================
 * BISHNOISM DIGITAL PLATFORM — script.js
 * Compatible with Firebase v10 COMPAT SDK and the existing forest/cream UI.
 *
 * SECURITY NOTE: browser JavaScript is never a security boundary. Configure
 * Firestore/Storage rules and the Cloudflare Worker before production. This
 * file deliberately contains no owner password, Gemini key, or Cloudflare
 * secret. AI and proctor uploads must go through your own authenticated server.
 * ========================================================================== */
"use strict";

// Publish navigation immediately so existing HTML inline onclick handlers such
// as BishnoiPortal.switchTab('home') never see an undefined namespace.
(function exposeEarlyNavigation() {
  const fallbackSwitchTab = function (id) {
    const raw = String(id || '').replace(/^tab-/, '');
    const target = raw.startsWith('tab-') ? raw : `tab-${raw}`;
    const panels = document.querySelectorAll('[id^="tab-"]');
    let found = false;
    panels.forEach(panel => {
      const active = panel.id === target ||
        (raw === 'sahitya' && panel.id === 'tab-library') ||
        (raw === 'pariksha' && panel.id === 'tab-quiz');
      panel.hidden = !active;
      panel.setAttribute('aria-hidden', String(!active));
      if (active) found = true;
    });
    if (!found) console.warn('Navigation panel not found for tab:', id);
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  window.switchTab = window.switchTab || fallbackSwitchTab;
  window.switchPortalTab = window.switchPortalTab || window.switchTab;
  window.BishnoiPortal = window.BishnoiPortal || {};
  window.BishnoiPortal.switchTab = window.switchTab;
  window.Bishnoi = window.Bishnoi || window.BishnoiPortal;
  window.Bishnoi.switchTab = window.switchTab;
})();

(() => {
  const CONFIG = Object.freeze({
    firebase: {
      apiKey: "AIzaSyDD58ybmm1bmmc5k5AwsxiaDiOXxlp7APA",
      authDomain: "bishnoi-platform.firebaseapp.com",
      projectId: "bishnoi-platform",
      storageBucket: "bishnoi-platform.firebasestorage.app",
      messagingSenderId: "1001226124051",
      appId: "1:1001226124051:web:ad4dc69e04e6701024f8e6",
      measurementId: "G-2RB41Z0JNK"
    },
    // Deploy an authenticated Cloudflare Worker and set its URL here.
    workerBaseUrl: "",
    examCollections: {
      main: "mainExamQuestions",
      mock1: "mockExam_1",
      mock2: "mockExam_2",
      quiz: "quiz"
    },
    submissionCollections: {
      main: "mainExamSubmissions",
      mock1: "mockExamSubmissions",
      mock2: "mockExamSubmissions",
      quiz: "quizAttempts"
    },
    defaultExamMinutes: 120,
    lateEntryMinutes: 5,
    maxTabSwitches: 3,
    proctorSnapshotSeconds: 60,
    ownerEmailAllowlist: []
  });

  const state = {
    db: null,
    auth: null,
    storage: null,
    user: null,
    profile: null,
    isOwner: false,
    roles: [],
    unsubscribers: [],
    exam: {
      active: false,
      mode: null,
      questions: [],
      index: 0,
      answers: {},
      review: {},
      endAt: 0,
      durationMinutes: 0,
      timer: null,
      tabSwitches: 0,
      submitted: false,
      stream: null,
      proctorTimer: null,
      beforeUnload: null
    },
    settings: {},
    mala: { count: 0, laps: 0 },
    fontSize: 16,
    quizQuestions: [],
    initialized: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const byId = id => document.getElementById(id);
  const safeText = value => String(value ?? '');

  const escapeHtml = value => safeText(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  const now = () => Date.now();

  const localDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const randomId = (n = 10) =>
    Array.from(crypto.getRandomValues(new Uint8Array(n)), x => (x % 36).toString(36)).join('').toUpperCase();

  const notify = (message, type = 'info') => {
    let box = byId('portalToast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'portalToast';
      box.setAttribute('role', 'status');
      box.style.cssText = 'position:fixed;z-index:99999;right:16px;bottom:90px;max-width:min(92vw,420px);padding:12px 16px;border-radius:12px;background:#143622;color:#fff;box-shadow:0 8px 30px #0002;font:500 14px system-ui';
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.style.background = type === 'error' ? '#9f2d20' : type === 'success' ? '#245b3e' : '#143622';
    box.hidden = false;
    clearTimeout(box._hideTimer);
    box._hideTimer = setTimeout(() => { box.hidden = true; }, 4500);
  };

  const setText = (id, value) => {
    const el = byId(id);
    if (el) el.textContent = safeText(value);
  };

  const setHTML = (id, value) => {
    const el = byId(id);
    if (el) el.innerHTML = value;
  };

  const setVisible = (id, visible) => {
    const el = byId(id);
    if (el) el.hidden = !visible;
  };

  const collection = name => {
    if (!state.db) throw new Error('Firebase is not ready.');
    return state.db.collection(name);
  };

  const getDocData = async (name, id) => {
    const snap = await collection(name).doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  };

  const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
  const deleteField = () => firebase.firestore.FieldValue.delete();
  const asArray = v => Array.isArray(v) ? v : [];
  const currentUid = () => state.user?.uid || null;

  const requireUser = () => {
    if (!state.user) {
      notify('Please sign in first.');
      promptUserLogin();
      return false;
    }
    return true;
  };

  const requireOwner = () => {
    if (!state.isOwner) {
      notify('This action requires Owner permission.', 'error');
      return false;
    }
    return true;
  };

  function initFirebase() {
    if (!window.firebase) {
      console.error('Firebase compat SDK missing. Load firebase-app-compat, auth-compat, firestore-compat and storage-compat before script.js.');
      notify('Firebase SDK is missing. Check script tags.', 'error');
      return false;
    }

    if (!firebase.apps.length) firebase.initializeApp(CONFIG.firebase);

    state.auth = firebase.auth();
    state.db = firebase.firestore();

    try {
      state.storage = firebase.storage();
    } catch (_) {
      state.storage = null;
    }

    return true;
  }

  // Navigation supports both the old IDs and the five-tab portal naming.
  const TAB_ALIASES = {
    home: 'tab-home',
    mala: 'tab-mala',
    niyams: 'tab-niyams',
    library: 'tab-library',
    sahitya: 'tab-library',
    community: 'tab-community',
    quiz: 'tab-quiz',
    pariksha: 'tab-pariksha',
    history: 'tab-history',
    admin: 'tab-admin',
    profile: 'tab-profile'
  };

  window.switchTab = function (id) {
    const raw = String(id || '').replace(/^tab-/, '');
    const target = TAB_ALIASES[raw] || (String(id).startsWith('tab-') ? id : `tab-${raw}`);
    const aliases = new Set([target, `tab-${raw}`]);

    const tabs = $$('[id^="tab-"]');

    tabs.forEach(el => {
      const active = aliases.has(el.id) ||
        (raw === 'sahitya' && el.id === 'tab-library') ||
        (raw === 'pariksha' && el.id === 'tab-quiz');

      el.hidden = !active;
      el.classList.toggle('active', active);
      el.setAttribute('aria-hidden', String(!active));
    });

    $$('.nav-btn, [data-tab]').forEach(btn => {
      const key = (btn.dataset.tab || btn.getAttribute('onclick') || '')
        .replace(/.*switchTab\(['"]?([^'")]+).*/, '$1')
        .replace(/^tab-/, '');

      const active = key === raw ||
        (raw === 'library' && key === 'sahitya') ||
        (raw === 'quiz' && key === 'pariksha');

      btn.classList.toggle('nav-btn-active', active);

      if (btn.hasAttribute('aria-current')) {
        btn.setAttribute('aria-current', active ? 'page' : 'false');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (['admin', 'profile'].includes(raw)) renderOwnerStudio();
  };

  window.switchPortalTab = window.switchTab;
  window.BishnoiPortal = window.BishnoiPortal || {};
  window.BishnoiPortal.switchTab = window.switchTab;
  window.Bishnoi = window.Bishnoi || window.BishnoiPortal;
  window.Bishnoi.switchTab = window.switchTab;

  function subscribe(ref, next, errorLabel = 'Live data') {
    const unsub = ref.onSnapshot(next, err => {
      console.error(errorLabel, err);
      if (err.code === 'permission-denied') {
        notify(`${errorLabel}: permission denied. Check Firestore rules.`, 'error');
      }
    });
    state.unsubscribers.push(unsub);
    return unsub;
  }

  function clearSubscriptions() {
    state.unsubscribers.forEach(fn => {
      try { fn(); } catch (_) {}
    });
    state.unsubscribers = [];
  }
    async function loadUserProfile(user) {
    const snap = await collection('users').doc(user.uid).get();
    state.profile = snap.exists ? snap.data() : {};
    // Do not accept localStorage, query params, or client-provided role as authority.
    state.roles = asArray(state.profile.roles);
    state.isOwner = state.profile.role === 'owner' ||
      state.profile.isOwner === true ||
      state.roles.includes('owner');

    if (CONFIG.ownerEmailAllowlist.length &&
        CONFIG.ownerEmailAllowlist.includes((user.email || '').toLowerCase())) {
      state.isOwner = true;
    }

    if (state.profile.role === 'owner' && !state.profile.isOwner) {
      console.warn('Owner UI enabled by Firestore role; protect all writes in rules/backend.');
    }

    setText('userDisplayName', state.profile.displayName || user.displayName || user.email || 'Account');
    setText('profileName', state.profile.displayName || user.displayName || 'Student');
    setVisible('tab-admin', state.isOwner || state.roles.includes('admin'));
    setVisible('ownerStudio', state.isOwner || state.roles.includes('admin'));

    const loginBtn = byId('authButton') || byId('profileButton');
    if (loginBtn) loginBtn.textContent = state.profile.displayName || 'Profile';

    await writeAccessLog();
  }

  async function writeAccessLog() {
    if (!state.user) return;

    try {
      await collection('userAccessLogs').add({
        uid: state.user.uid,
        email: state.user.email || null,
        deviceCategory: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        userAgent: navigator.userAgent.slice(0, 240),
        createdAt: serverTimestamp(),
        dateKey: localDateKey()
      });
    } catch (e) {
      if (e.code !== 'permission-denied') console.warn('Access log not saved', e);
    }
  }

  function initAuthUI() {
    if (!state.auth) return;

    state.auth.onAuthStateChanged(async user => {
      clearSubscriptions();
      state.user = user;
      state.profile = null;
      state.isOwner = false;
      state.roles = [];

      if (user) {
        try {
          await loadUserProfile(user);
          startLiveListeners();
          notify(`Welcome${state.profile?.displayName ? ' ' + state.profile.displayName : ''}!`, 'success');
        } catch (e) {
          console.error(e);
          notify('Signed in, but your profile could not load.', 'error');
        }
      } else {
        setText('userDisplayName', 'Sign in');
        setText('profileName', 'Guest');
        setVisible('tab-admin', false);
        setVisible('ownerStudio', false);
      }

      renderAuthState();
    });
  }

  function renderAuthState() {
    const label = state.user
      ? (state.profile?.displayName || state.user.email || 'Account')
      : 'Sign in';

    ['authButton', 'profileButton', 'loginBtn'].forEach(id => {
      const el = byId(id);
      if (el) el.textContent = label;
    });

    $$('[data-owner-only]').forEach(el => {
      el.hidden = !state.isOwner;
    });
  }

  window.promptUserLogin = async function () {
    if (!state.auth) return notify('Authentication is unavailable.', 'error');

    if (state.user) {
      switchTab('profile');
      return;
    }

    const email = prompt('Enter your email address:');
    if (!email) return;

    const password = prompt('Enter your password:');
    if (!password) return;

    try {
      await state.auth.signInWithEmailAndPassword(email.trim(), password);
      notify('Signed in successfully.', 'success');
    } catch (e) {
      console.error(e);
      notify(authErrorMessage(e), 'error');
    }
  };

  window.logoutPortalUser = async function () {
    try {
      stopExamResources();
      if (state.auth) await state.auth.signOut();
      notify('Signed out.', 'success');
    } catch (e) {
      notify('Could not sign out.', 'error');
    }
  };

  function authErrorMessage(e) {
    return ({
      'auth/invalid-email': 'Please enter a valid email.',
      'auth/user-not-found': 'Account not found.',
      'auth/wrong-password': 'Incorrect email or password.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/too-many-requests': 'Too many attempts. Try again later.'
    })[e.code] || 'Sign-in failed. Check your details and try again.';
  }

  function startLiveListeners() {
    if (!state.db) return;

    // Settings are read from Firestore, never silently overwritten by stale local settings.
    subscribe(
      collection('settings').doc('portal'),
      snap => {
        state.settings = snap.exists ? snap.data() : {};
        applyPortalSettings();
      },
      'Portal settings'
    );

    subscribe(
      collection('posts').orderBy('createdAt', 'desc').limit(50),
      snap => renderCommunity(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      'Community'
    );

    subscribe(
      collection('audios').orderBy('order', 'asc'),
      snap => renderAudioList(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      'Audio library'
    );

    subscribe(
      collection('pdfs').orderBy('createdAt', 'desc').limit(100),
      snap => renderPdfLibrary(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      'PDF library'
    );

    subscribe(
      collection('examConfig').doc('current'),
      snap => {
        state.examConfig = snap.exists ? snap.data() : {};
        renderExamVisibility();
      },
      'Exam configuration'
    );
  }

  function applyPortalSettings() {
    const s = state.settings || {};

    setText('dailySandesh', s.dailySandesh || 'जीव दया पालणी, रूंख लीलो नी घावै');
    setVisible('maintenanceBanner', !!s.maintenanceMode);

    const progress = Math.max(0, Math.min(100, Number(s.maintenanceProgress) || 0));
    setText('maintenanceProgress', `${progress}%`);

    const bar = byId('maintenanceProgressBar');
    if (bar) bar.style.width = `${progress}%`;

    // Maintenance is a banner, not a blanket block: other portal tabs remain usable.
    renderExamVisibility();
  }

  function renderExamVisibility() {
    const c = state.examConfig || {};

    const map = [
      ['enrollmentSection', c.enrollmentVisible !== false],
      ['mockHub', c.mockVisible !== false],
      ['mainExamSection', c.mainExamVisible !== false],
      ['dailyQuizSection', c.dailyQuizVisible !== false],
      ['resultsDesk', c.resultsVisible !== false]
    ];

    map.forEach(([id, visible]) => setVisible(id, visible));
  }

  // 29 Niyam cards: use authored content if present in HTML or Firestore;
  // never invent scripture.
  const NIYAMS_FALLBACK = [
    ['जीव दया पालणी', 'जीवों के प्रति दया और करुणा रखें।'],
    ['रूंख लीलो नी घावै', 'हरे वृक्षों की रक्षा करें।'],
    ['अजर पाळणो', 'अहिंसा और जीव रक्षा को जीवन में अपनाएँ।']
  ];

  async function renderNiyamsList() {
    const host = byId('niyamsList') || byId('niyamsGrid');
    if (!host) return;

    try {
      const snap = await collection('settings').doc('niyams').get();
      const items = snap.exists ? asArray(snap.data().items) : NIYAMS_FALLBACK;

      host.innerHTML = items.map((x, i) => `
        <article class="niyam-card">
          <h3>${escapeHtml(x.title || x.name || `नियम ${i + 1}`)}</h3>
          <p>${escapeHtml(x.meaning || x.description || x.text || '')}</p>
        </article>
      `).join('');
    } catch (e) {
      host.innerHTML = NIYAMS_FALLBACK.map((x, i) => `
        <article class="niyam-card">
          <h3>${i + 1}. ${escapeHtml(x[0])}</h3>
          <p>${escapeHtml(x[1])}</p>
        </article>
      `).join('');
    }
  }

  // Jaap Mala: local counters are personal convenience; signed-in sync is best-effort.
  function initMalaState() {
    try {
      const saved = JSON.parse(localStorage.getItem('bishnoi_mala_v2') || '{}');
      state.mala.count = Math.min(108, Math.max(0, Number(saved.count) || 0));
      state.mala.laps = Math.max(0, Number(saved.laps) || 0);
    } catch (_) {}

    renderMala();
  }

  function saveMala() {
    localStorage.setItem('bishnoi_mala_v2', JSON.stringify({
      ...state.mala,
      date: localDateKey()
    }));

    if (state.user && state.db) {
      collection('users').doc(state.user.uid).set({
        mala: {
          ...state.mala,
          dateKey: localDateKey(),
          updatedAt: serverTimestamp()
        }
      }, { merge: true }).catch(() => {});
    }
  }

  function renderMala() {
    setText('malaCount', state.mala.count);
    setText('malaLapCount', state.mala.laps);
    setText('malaProgress', `${Math.round(state.mala.count / 108 * 100)}%`);

    const p = byId('malaProgressBar');
    if (p) p.style.width = `${state.mala.count / 108 * 100}%`;

    $$('.mala-bead').forEach((b, i) => {
      b.classList.toggle('bead-done', i < state.mala.count);
    });
  }

  window.tapHomeMalaBead = function () {
    state.mala.count++;

    if (state.mala.count >= 108) {
      state.mala.count = 0;
      state.mala.laps++;
      notify(`One mala complete! Total laps: ${state.mala.laps}`, 'success');
    }

    if (navigator.vibrate && byId('hapticToggle')?.checked) navigator.vibrate(25);

    saveMala();
    renderMala();
  };

  window.resetMala = function () {
    if (!confirm('Reset this mala count?')) return;
    state.mala.count = 0;
    saveMala();
    renderMala();
  };

  window.pledgeTree = async function () {
    if (!requireUser()) return;

    try {
      const ref = collection('treePledges').doc(state.user.uid);

      await state.db.runTransaction(async tx => {
        const s = await tx.get(ref);

        if (s.exists && s.data().dateKey === localDateKey()) {
          throw new Error('already');
        }

        tx.set(ref, {
          uid: state.user.uid,
          displayName: state.profile?.displayName || 'Community member',
          dateKey: localDateKey(),
          createdAt: serverTimestamp()
        }, { merge: true });
      });

      notify('Thank you for pledging to plant and protect a tree.', 'success');
    } catch (e) {
      notify(
        e.message === 'already'
          ? 'You have already pledged today.'
          : 'Could not save your pledge.',
        'error'
      );
    }
  };

  window.shareBannerWhatsApp = function () {
    const text = 'जीव दया पालणी, रूंख लीलो नी घावै — जीवों और वृक्षों की रक्षा करें।';
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Literature repository expects actual content in Firestore collection "shabadwani".
  async function loadShabadRepository() {
    const host = byId('shabadGrid') || byId('shabadRepo') || byId('libraryGrid');
    if (!host || !state.db) return;

    try {
      const snap = await collection('shabadwani').orderBy('num', 'asc').limit(200).get();
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderShabadCards(rows);
    } catch (e) {
      console.warn('Shabad repository not available', e);
    }
  }

  window.renderShabadCards = function (items) {
    const host = byId('shabadGrid') || byId('shabadRepo') || byId('libraryGrid');
    if (!host) return;

    host.innerHTML = asArray(items).map(s => `
      <article class="shabad-card"
        data-search="${escapeHtml(`${s.title || ''} ${s.desc || ''} ${s.fullText || ''}`.toLowerCase())}">
        <h3>${escapeHtml(s.title || 'शब्दवाणी')}</h3>
        <p>${escapeHtml(s.desc || '')}</p>
        <button type="button" data-open-shabad="${escapeHtml(s.id || s.num || '')}">पढ़ें</button>
      </article>
    `).join('');

    host.querySelectorAll('[data-open-shabad]').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = asArray(items).find(x => String(x.id || x.num) === btn.dataset.openShabad);
        if (s) window.openShabadModal(s);
      });
    });
  };

  window.filterShabadRepo = function (value) {
    const q = String(value ?? ($('#shabadSearch')?.value || '')).toLowerCase().trim();
    $$('.shabad-card').forEach(el => {
      el.hidden = !el.dataset.search.includes(q);
    });
  };

  window.openShabadModal = function (item) {
    let modal = byId('shabadReaderModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'shabadReaderModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.style.cssText = 'position:fixed;inset:0;z-index:99990;background:#0008;display:grid;place-items:center;padding:16px';

    modal.innerHTML = `
      <section style="background:#fffdf7;color:#143622;border-radius:18px;padding:22px;max-width:720px;width:100%;max-height:85vh;overflow:auto">
        <button type="button" id="closeShabad" style="float:right">✕ Close</button>
        <h2>${escapeHtml(item.title || 'शब्दवाणी')}</h2>
        <p style="white-space:pre-wrap;line-height:1.9">${escapeHtml(item.fullText || item.text || item.desc || 'Text not yet uploaded.')}</p>
      </section>
    `;

    document.body.appendChild(modal);
    $('#closeShabad', modal).onclick = () => modal.remove();
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
  };

  window.changeLiteratureFont = function (delta) {
    state.fontSize = Math.max(12, Math.min(32, state.fontSize + Number(delta || 0)));
    const reader = byId('shabadReaderModal') || byId('literatureReader');
    if (reader) reader.style.fontSize = `${state.fontSize}px`;
  };

  // Karaoke: audio records can provide audioUrl and timed lyrics [{time,text}].
  let karaokeFrame = null;

  async function initKaraokePlayer() {
    const audio = byId('karaokeAudio') || byId('bhajanAudio');
    if (!audio) return;

    audio.addEventListener('timeupdate', () => {
      const lines = asArray(window.activeKaraokeLyrics);
      let active = -1;

      lines.forEach((l, i) => {
        if (Number(l.time || 0) <= audio.currentTime) active = i;
      });

      const host = byId('karaokeLyrics');

      if (host && active >= 0) {
        const line = host.children[active];

        if (line) {
          $$('.karaoke-line', host).forEach(x => x.classList.remove('karaoke-active'));
          line.classList.add('karaoke-active');
          line.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    });
  }

  window.toggleKaraokePlayback = function () {
    const audio = byId('karaokeAudio') || byId('bhajanAudio');
    if (!audio) return notify('Audio player is not on this page.');

    if (audio.paused) {
      audio.play().catch(() => notify('Tap play again to allow audio playback.'));
    } else {
      audio.pause();
    }
  };

  function renderAudioList(items) {
    const host = byId('audioList');
    if (!host) return;

    host.innerHTML = items.map(a => `
      <button type="button" class="audio-item" data-audio-id="${escapeHtml(a.id)}">
        ${escapeHtml(a.title || 'Bhajan')} ${a.audioUrl ? '▶' : ''}
      </button>
    `).join('');

    host.querySelectorAll('[data-audio-id]').forEach(btn => {
      btn.onclick = () => {
        const a = items.find(x => x.id === btn.dataset.audioId);

        if (!a?.audioUrl) return notify('Audio URL has not been uploaded yet.');

        const audio = byId('karaokeAudio') || byId('bhajanAudio');

        if (audio) {
          audio.src = a.audioUrl;
          window.activeKaraokeLyrics = asArray(a.lyrics);

          const lines = byId('karaokeLyrics');
          if (lines) {
            lines.innerHTML = window.activeKaraokeLyrics
              .map(l => `<p class="karaoke-line">${escapeHtml(l.text || l)}</p>`)
              .join('');
          }

          audio.play().catch(() => {});
        }
      };
    });
  }

  function renderPdfLibrary(items) {
    const host = byId('pdfLibrary') || byId('literatureFiles');
    if (!host) return;

    host.innerHTML = items.map(x => `
      <article class="library-file">
        <strong>${escapeHtml(x.title || x.name || 'Document')}</strong>
        ${x.url ? ` <a href="${escapeHtml(x.url)}" target="_blank" rel="noopener noreferrer">Open</a>` : ''}
      </article>
    `).join('');
  }
    // Community posts
  function renderCommunity(posts) {
    const host = byId('communityPosts') || byId('postsList');
    if (!host) return;

    host.innerHTML = posts.map(post => `
      <article class="community-post" data-post-id="${escapeHtml(post.id)}">
        <h3>${escapeHtml(post.title || 'Community update')}</h3>
        <p>${escapeHtml(post.text || post.content || '')}</p>
        <small>${escapeHtml(post.authorName || 'Community member')}</small>
        <button type="button" data-upvote="${escapeHtml(post.id)}">
          👍 ${Number(post.upvotes) || 0}
        </button>
      </article>
    `).join('');

    host.querySelectorAll('[data-upvote]').forEach(button => {
      button.addEventListener('click', () => window.upvoteCommunityPost(button.dataset.upvote));
    });
  }

  window.createCommunityPost = async function () {
    if (!requireUser()) return;

    const title = (byId('postTitle')?.value || '').trim();
    const content = (byId('postContent')?.value || '').trim();

    if (!content) {
      notify('Please write something before posting.');
      return;
    }

    if (content.length > 5000 || title.length > 200) {
      notify('Your post is too long.', 'error');
      return;
    }

    try {
      await collection('posts').add({
        title,
        text: content,
        authorUid: state.user.uid,
        authorName: state.profile?.displayName || state.user.displayName || 'Community member',
        upvotes: 0,
        createdAt: serverTimestamp()
      });

      if (byId('postTitle')) byId('postTitle').value = '';
      if (byId('postContent')) byId('postContent').value = '';

      notify('Your post has been published.', 'success');
    } catch (e) {
      console.error(e);
      notify('Could not publish the post. Check your Firestore permissions.', 'error');
    }
  };

  window.upvoteCommunityPost = async function (postId) {
    if (!requireUser()) return;

    try {
      const postRef = collection('posts').doc(postId);
      const voteRef = postRef.collection('votes').doc(state.user.uid);

      await state.db.runTransaction(async transaction => {
        const vote = await transaction.get(voteRef);
        if (vote.exists) throw new Error('already-voted');

        transaction.set(voteRef, {
          uid: state.user.uid,
          createdAt: serverTimestamp()
        });

        transaction.update(postRef, {
          upvotes: firebase.firestore.FieldValue.increment(1)
        });
      });

      notify('Vote recorded.', 'success');
    } catch (e) {
      notify(
        e.message === 'already-voted'
          ? 'You have already voted on this post.'
          : 'Could not record your vote.',
        'error'
      );
    }
  };

  // Owner Studio
  function renderOwnerStudio() {
    const host = byId('ownerStudioContent') || byId('ownerStudio');
    if (!host || !state.isOwner) return;

    const title = document.createElement('p');
    title.textContent = 'Owner Studio';
    title.className = 'owner-studio-status';

    const status = document.createElement('p');
    status.textContent = state.user
      ? `Signed in as ${state.user.email || state.user.uid}`
      : 'Not signed in';

    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.textContent = 'Refresh portal data';
    refresh.addEventListener('click', () => {
      clearSubscriptions();
      startLiveListeners();
      notify('Portal listeners refreshed.', 'success');
    });

    host.append(title, status, refresh);
  }

  window.savePortalSetting = async function (key, value) {
    if (!requireOwner()) return;

    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(String(key))) {
      notify('Invalid setting name.', 'error');
      return;
    }

    try {
      await collection('settings').doc('portal').set({
        [key]: value,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      }, { merge: true });

      notify('Setting saved.', 'success');
    } catch (e) {
      console.error(e);
      notify('Could not save the setting. Check Firestore rules.', 'error');
    }
  };

  window.addAudioRecord = async function () {
    if (!requireOwner()) return;

    const title = (byId('newAudioTitle')?.value || '').trim();
    const url = (byId('newAudioUrl')?.value || '').trim();

    if (!title || !url) {
      notify('Enter both an audio title and its URL.');
      return;
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') throw new Error('https-required');

      await collection('audios').add({
        title,
        audioUrl: parsed.href,
        order: Date.now(),
        createdAt: serverTimestamp(),
        createdBy: state.user.uid
      });

      if (byId('newAudioTitle')) byId('newAudioTitle').value = '';
      if (byId('newAudioUrl')) byId('newAudioUrl').value = '';

      notify('Audio record added.', 'success');
    } catch (e) {
      console.error(e);
      notify('Could not add audio. Check the URL and Firestore rules.', 'error');
    }
  };

  // Exam utilities
  function stopExamResources() {
    const exam = state.exam;

    if (exam.timer) clearInterval(exam.timer);
    if (exam.proctorTimer) clearInterval(exam.proctorTimer);

    exam.timer = null;
    exam.proctorTimer = null;

    if (exam.stream) {
      exam.stream.getTracks().forEach(track => track.stop());
    }

    exam.stream = null;

    if (exam.beforeUnload) {
      window.removeEventListener('beforeunload', exam.beforeUnload);
    }

    exam.beforeUnload = null;
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safe / 60);
    const remainder = safe % 60;

    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  function renderExamQuestion() {
    const exam = state.exam;
    const question = exam.questions[exam.index];
    const host = byId('examQuestion');

    if (!host || !question) return;

    const options = Array.isArray(question.options)
      ? question.options
      : [question.optionA, question.optionB, question.optionC, question.optionD].filter(Boolean);

    host.innerHTML = `
      <p>Question ${exam.index + 1} of ${exam.questions.length}</p>
      <h3>${escapeHtml(question.question || question.text || 'Question')}</h3>
      <div class="exam-options">
        ${options.map((option, index) => `
          <label>
            <input type="radio" name="examAnswer"
              value="${index}"
              ${String(exam.answers[question.id || exam.index]) === String(index) ? 'checked' : ''}>
            ${escapeHtml(option)}
          </label>
        `).join('')}
      </div>
    `;

    host.querySelectorAll('input[name="examAnswer"]').forEach(input => {
      input.addEventListener('change', () => {
        exam.answers[question.id || exam.index] = Number(input.value);
      });
    });

    setText('examQuestionNumber', `${exam.index + 1}/${exam.questions.length}`);
  }

  window.startPortalExam = async function (mode = 'quiz') {
    if (!requireUser()) return;

    const collectionName = CONFIG.examCollections[mode];
    if (!collectionName) {
      notify('Unknown exam type.', 'error');
      return;
    }

    try {
      const snapshot = await collection(collectionName).get();
      const questions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (!questions.length) {
        notify('No questions have been added to this exam yet.');
        return;
      }

      stopExamResources();

      state.exam = {
        active: true,
        mode,
        questions,
        index: 0,
        answers: {},
        review: {},
        endAt: Date.now() + CONFIG.defaultExamMinutes * 60 * 1000,
        durationMinutes: CONFIG.defaultExamMinutes,
        timer: null,
        tabSwitches: 0,
        submitted: false,
        stream: null,
        proctorTimer: null,
        beforeUnload: null
      };

      switchTab(mode === 'quiz' ? 'quiz' : 'pariksha');
      renderExamQuestion();

      state.exam.timer = setInterval(() => {
        const remaining = Math.ceil((state.exam.endAt - Date.now()) / 1000);
        setText('examTimer', formatTime(remaining));

        if (remaining <= 0) {
          window.submitPortalExam(true);
        }
      }, 1000);

      state.exam.beforeUnload = event => {
        if (!state.exam.active || state.exam.submitted) return;
        event.preventDefault();
        event.returnValue = '';
      };

      window.addEventListener('beforeunload', state.exam.beforeUnload);

      notify('Exam started.', 'success');
    } catch (e) {
      console.error(e);
      notify('Could not load exam questions. Check Firestore permissions.', 'error');
    }
  };

  window.nextExamQuestion = function () {
    if (!state.exam.active) return;
    state.exam.index = Math.min(state.exam.index + 1, state.exam.questions.length - 1);
    renderExamQuestion();
  };

  window.previousExamQuestion = function () {
    if (!state.exam.active) return;
    state.exam.index = Math.max(0, state.exam.index - 1);
    renderExamQuestion();
  };

  window.submitPortalExam = async function (automatic = false) {
    const exam = state.exam;

    if (!exam.active || exam.submitted) return;

    if (!automatic && !confirm('Submit your answers now?')) return;

    exam.submitted = true;
    exam.active = false;
    stopExamResources();

    let correct = 0;
    let attempted = 0;

    exam.questions.forEach((question, index) => {
      const key = question.id || index;
      const answer = exam.answers[key];

      if (answer !== undefined && answer !== null) {
        attempted++;

        const correctAnswer = question.correctAnswer ?? question.answerIndex;

        if (String(answer) === String(correctAnswer)) correct++;
      }
    });

    const result = {
      uid: state.user.uid,
      mode: exam.mode,
      totalQuestions: exam.questions.length,
      attempted,
      correct,
      score: correct,
      submittedAt: serverTimestamp(),
      automatic
    };

    try {
      await collection(CONFIG.submissionCollections[exam.mode]).add(result);
      setText('examResult', `Result: ${correct}/${exam.questions.length}. Attempted: ${attempted}.`);
      notify('Exam submitted successfully.', 'success');
    } catch (e) {
      console.error(e);
      setText('examResult', `Exam ended. Score calculated locally: ${correct}/${exam.questions.length}. Saving failed.`);
      notify('Exam ended, but the result could not be saved.', 'error');
    }
  };

  // Quiz aliases for existing HTML controls.
  window.startQuiz = () => window.startPortalExam('quiz');
  window.startMockExam1 = () => window.startPortalExam('mock1');
  window.startMockExam2 = () => window.startPortalExam('mock2');
  window.startMainExam = () => window.startPortalExam('main');

  // Basic date and daily-message fallback.
  function renderDailyMessage() {
    const el = byId('dailyDate');
    if (el) {
      el.textContent = new Date().toLocaleDateString('hi-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  // Bind buttons only when they exist. This prevents errors on pages that
  // do not include every optional feature.
  function bindOptionalButtons() {
    const bindings = [
      ['createPostBtn', window.createCommunityPost],
      ['pledgeTreeBtn', window.pledgeTree],
      ['resetMalaBtn', window.resetMala],
      ['logoutButton', window.logoutPortalUser],
      ['addAudioBtn', window.addAudioRecord],
      ['startQuizBtn', window.startQuiz],
      ['startMock1Btn', window.startMockExam1],
      ['startMock2Btn', window.startMockExam2],
      ['startMainExamBtn', window.startMainExam],
      ['nextQuestionBtn', window.nextExamQuestion],
      ['previousQuestionBtn', window.previousExamQuestion],
      ['submitExamBtn', () => window.submitPortalExam(false)]
    ];

    bindings.forEach(([id, handler]) => {
      const el = byId(id);
      if (el && typeof handler === 'function') {
        el.addEventListener('click', handler);
      }
    });
  }

  function initPortal() {
    if (state.initialized) return;
    state.initialized = true;

    renderDailyMessage();
    initMalaState();
    initKaraokePlayer();
    renderNiyamsList();
    bindOptionalButtons();

    if (initFirebase()) {
      initAuthUI();
      loadShabadRepository();
    }

    // The navigation function is now exposed globally.
    window.BishnoiPortal = window.BishnoiPortal || {};
    window.BishnoiPortal.switchTab = window.switchTab;
    window.Bishnoi = window.Bishnoi || window.BishnoiPortal;
    window.Bishnoi.switchTab = window.switchTab;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortal, { once: true });
  } else {
    initPortal();
  }

  // Export selected helpers for debugging without exposing privileged actions.
  window.BishnoiPortal = window.BishnoiPortal || {};
  window.BishnoiPortal.version = '1.0.1';
  window.BishnoiPortal.switchTab = window.switchTab;
  window.BishnoiPortal.getSignedInUser = () => state.user
    ? { uid: state.user.uid, email: state.user.email || null }
    : null;

})();
```javascript
/* =========================================================
   PART 4 — WEBSITE COMPATIBILITY & RECOVERY PATCH
   Place this AFTER Part 3 in script.js, or in a separate
   JavaScript file loaded after Part 3.
   ========================================================= */

(function () {
  'use strict';

  const portal = window.BishnoiPortal =
    window.BishnoiPortal || {};

  // -------------------------------------------------------
  // 1. Safe element helpers
  // -------------------------------------------------------

  function getElement(id) {
    return document.getElementById(id);
  }

  function showElement(id) {
    const element = getElement(id);
    if (element) element.style.display = '';
    return element;
  }

  function hideElement(id) {
    const element = getElement(id);
    if (element) element.style.display = 'none';
    return element;
  }

  function showNotice(message) {
    if (typeof window.notify === 'function') {
      window.notify(message, 'info');
    } else {
      console.info('[Bishnoi Portal]', message);
    }
  }

  // -------------------------------------------------------
  // 2. Navigation recovery
  // -------------------------------------------------------

  function findTabTarget(tabName) {
    if (!tabName) return null;

    const name = String(tabName).trim();
    const candidates = [
      name,
      name + 'Tab',
      name + '-tab',
      name + '-section'
    ];

    for (const id of candidates) {
      const element = getElement(id);
      if (element) return element;
    }

    return null;
  }

  function fallbackSwitchTab(tabName) {
    const target = findTabTarget(tabName);

    if (!target) {
      console.warn(
        'Navigation target not found:',
        tabName
      );
      return false;
    }

    const panels = document.querySelectorAll(
      '[data-tab-panel], .tab-content, .tab-pane'
    );

    panels.forEach(function (panel) {
      panel.style.display = 'none';
      panel.classList.remove('active');
    });

    target.style.display = '';
    target.classList.add('active');

    document.querySelectorAll(
      '[data-tab], [data-tab-target], .tab-button'
    ).forEach(function (button) {
      const buttonTarget =
        button.getAttribute('data-tab') ||
        button.getAttribute('data-tab-target');

      button.classList.toggle(
        'active',
        buttonTarget === tabName
      );
    });

    return true;
  }

  // Preserve the existing switchTab implementation when present.
  if (typeof window.switchTab !== 'function') {
    window.switchTab = fallbackSwitchTab;
  }

  portal.switchTab = function (tabName) {
    try {
      return window.switchTab(tabName);
    } catch (error) {
      console.error('Navigation error:', error);
      return fallbackSwitchTab(tabName);
    }
  };

  // Compatibility with HTML onclick attributes.
  window.Bishnoi = window.Bishnoi || portal;
  window.Bishnoi.switchTab = portal.switchTab;

  // -------------------------------------------------------
  // 3. Navigation button compatibility
  // -------------------------------------------------------

  function bindNavigationButtons() {
    document.querySelectorAll(
      '[data-tab], [data-tab-target]'
    ).forEach(function (button) {
      if (button.dataset.portalNavigationBound === 'true') {
        return;
      }

      button.dataset.portalNavigationBound = 'true';

      button.addEventListener('click', function (event) {
        const tabName =
          button.getAttribute('data-tab') ||
          button.getAttribute('data-tab-target');

        if (!tabName) return;

        event.preventDefault();
        portal.switchTab(tabName);
      });
    });
  }

  // -------------------------------------------------------
  // 4. Audio recovery
  // -------------------------------------------------------

  function repairAudioPlayers() {
    document.querySelectorAll('audio').forEach(function (audio) {
      audio.addEventListener('error', function () {
        console.warn(
          'Audio could not be loaded:',
          audio.currentSrc || audio.src
        );
      });

      // Do not assign a made-up audio URL. Audio records should
      // receive their real URL when uploaded through Owner Studio.
      if (
        audio.getAttribute('src') === 'bhajan1.mp3' ||
        audio.getAttribute('src') === '/bhajan1.mp3'
      ) {
        audio.removeAttribute('src');
        audio.load();
      }
    });

    document.querySelectorAll(
      'source[src="bhajan1.mp3"], source[src="/bhajan1.mp3"]'
    ).forEach(function (source) {
      source.removeAttribute('src');
      const audio = source.closest('audio');
      if (audio) audio.load();
    });
  }

  // -------------------------------------------------------
  // 5. Existing feature aliases
  // -------------------------------------------------------

  const aliases = {
    startQuiz: 'startPortalExam',
    logout: 'logoutPortalUser',
    createPost: 'createCommunityPost',
    treePledge: 'pledgeTree',
    resetMalaCounter: 'resetMala'
  };

  Object.entries(aliases).forEach(function (entry) {
    const aliasName = entry[0];
    const originalName = entry[1];

    if (
      typeof window[aliasName] !== 'function' &&
      typeof window[originalName] === 'function'
    ) {
      window[aliasName] = function () {
        return window[originalName].apply(window, arguments);
      };
    }
  });

  // -------------------------------------------------------
  // 6. Prevent optional missing-button errors
  // -------------------------------------------------------

  function bindSafeButton(id, handlerName) {
    const button = getElement(id);
    const handler = window[handlerName];

    if (
      !button ||
      typeof handler !== 'function' ||
      button.dataset.portalSafeBound === 'true'
    ) {
      return;
    }

    button.dataset.portalSafeBound = 'true';

    button.addEventListener('click', function (event) {
      try {
        const result = handler.call(window, event);

        if (result && typeof result.catch === 'function') {
          result.catch(function (error) {
            console.error(
              'Button action failed:',
              handlerName,
              error
            );
            showNotice('This action could not be completed.');
          });
        }
      } catch (error) {
        console.error(
          'Button action failed:',
          handlerName,
          error
        );
        showNotice('This action could not be completed.');
      }
    });
  }

  function bindFeatureButtons() {
    [
      ['createPostBtn', 'createCommunityPost'],
      ['pledgeTreeBtn', 'pledgeTree'],
      ['resetMalaBtn', 'resetMala'],
      ['logoutButton', 'logoutPortalUser'],
      ['addAudioBtn', 'addAudioRecord'],
      ['startQuizBtn', 'startQuiz'],
      ['startMock1Btn', 'startMockExam1'],
      ['startMock2Btn', 'startMockExam2'],
      ['startMainExamBtn', 'startMainExam'],
      ['nextQuestionBtn', 'nextExamQuestion'],
      ['previousQuestionBtn', 'previousExamQuestion']
    ].forEach(function (binding) {
      bindSafeButton(binding[0], binding[1]);
    });
  }

  // -------------------------------------------------------
  // 7. Startup
  // -------------------------------------------------------

  function runCompatibilityPatch() {
    bindNavigationButtons();
    repairAudioPlayers();
    bindFeatureButtons();

    portal.version = portal.version || '1.0.1';

    console.info(
      'Bishnoi Portal Part 4 compatibility patch loaded.'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      runCompatibilityPatch,
      { once: true }
    );
  } else {
    runCompatibilityPatch();
  }

})();
```
