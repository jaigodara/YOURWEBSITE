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
      panel.classList.toggle('hidden', !active);
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

      // Both the HTML hidden attribute and Tailwind's .hidden class must be
      // updated. Changing only el.hidden leaves display:none applied by Tailwind.
      el.hidden = !active;
      el.classList.toggle('hidden', !active);
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

    // Resolve a completed Google redirect explicitly so any Firebase error is visible.
    // onAuthStateChanged remains the source of truth for the signed-in session.
    if (typeof state.auth.getRedirectResult === 'function') {
      state.auth.getRedirectResult().then(result => {
        if (result && result.user) {
          notify('Google sign-in successful.', 'success');
        }
      }).catch(error => {
        console.error('Google redirect result failed:', error);
        notify(authErrorMessage(error), 'error');
      });
    }

    state.auth.onAuthStateChanged(async user => {
      clearSubscriptions();
      state.user = user;
      state.profile = null;
      state.isOwner = false;
      state.roles = [];

      // These subscriptions only read portal content. Firestore rules must still
      // allow public reads for public collections and must deny guest writes.
      // Starting them for guests lets the literature/community/exam pages render
      // without making posting, exam submissions, or owner actions public.
      startLiveListeners();

      if (user) {
        try {
          await loadUserProfile(user);
          notify(`Welcome${state.profile?.displayName ? ' ' + state.profile.displayName : ''}!`, 'success');
        } catch (e) {
          console.error('Signed-in profile initialization failed:', e);
          notify('Signed in, but your profile could not load. Check Firestore permissions.', 'error');
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
      'auth/too-many-requests': 'Too many attempts. Try again later.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase.',
      'auth/unauthorized-domain': 'This website domain is not authorized in Firebase Authentication. Add the exact domain in Firebase Console.',
      'auth/network-request-failed': 'Network request failed. Check your connection and browser privacy settings, then try again.',
      'auth/popup-blocked': 'The sign-in popup was blocked. Allow popups for this website and try again.',
      'auth/invalid-phone-number': 'Please enter a valid phone number with country code.',
      'auth/invalid-verification-code': 'The SMS code is incorrect. Try again.',
      'auth/code-expired': 'The SMS code expired. Request a new code.'
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

  // Lightweight lunar-phase estimate for the homepage. This is an estimate,
  // not a location-specific traditional Panchang calculation.
  function renderPanchangEstimate() {
    const dateEl = byId('autoPanchangDate');
    const detailsEl = byId('autoPanchangDetails');
    const titleEl = byId('amavasyaTitleDisplay');
    const countdownEl = byId('amavasyaCountdownBox');
    if (!dateEl || !detailsEl || !titleEl || !countdownEl) return;

    const now = new Date();
    const synodicMonth = 29.530588853;
    const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
    const ageDays = ((now.getTime() - knownNewMoon) / 86400000 % synodicMonth + synodicMonth) % synodicMonth;
    const tithi = Math.min(30, Math.floor(ageDays / synodicMonth * 30) + 1);
    const paksha = tithi <= 15 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष';
    const pakshaTithi = tithi <= 15 ? tithi : tithi - 15;
    const tithiNames = ['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पञ्चमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पूर्णिमा'];
    const tithiName = tithi === 30 ? 'अमावस्या' : (tithi === 15 ? 'पूर्णिमा' : (tithiNames[pakshaTithi - 1] || 'तिथि'));
    const dateText = new Intl.DateTimeFormat('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    dateEl.textContent = dateText + ' • ' + paksha + ' ' + tithiName;
    detailsEl.textContent = 'चंद्र-चक्र पर आधारित अनुमानित तिथि। स्थानीय सूर्योदय और पंचांग परंपरा के अनुसार तिथि में अंतर हो सकता है।';

    const elapsedCycles = Math.floor((now.getTime() - knownNewMoon) / (synodicMonth * 86400000));
    let nextNewMoon = knownNewMoon + (elapsedCycles + 1) * synodicMonth * 86400000;
    while (nextNewMoon <= now.getTime()) nextNewMoon += synodicMonth * 86400000;
    const remainingMs = nextNewMoon - now.getTime();
    const totalMinutes = Math.floor(remainingMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    titleEl.textContent = 'आगामी अमावस्या (अनुमानित)';
    countdownEl.textContent = days + ' दिन, ' + hours + ' घंटे, ' + minutes + ' मिनट शेष';
  }

  function initPortal() {
    if (state.initialized) return;
    state.initialized = true;

    renderDailyMessage();
    renderPanchangEstimate();
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


  // Compatibility API for the current index.html markup.
  // Keep this bridge inside the main closure so it can use the
  // portal's private state and Firebase auth/database objects.
  window.BishnoiApp = window.BishnoiApp || {};
  const app = window.BishnoiApp;

  app.switchTab = window.switchTab;
  app.openProfileOrAuth = function () {
    if (state.user) {
      window.switchTab('profile');
      const profile = byId('userProfileModal');
      if (profile) profile.classList.remove('hidden');
      return;
    }
    const modal = byId('authModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      return;
    }
    window.promptUserLogin();
  };
  app.shareBannerWhatsApp = window.shareBannerWhatsApp || function () {
    const message = (byId('dailyBannerText')?.textContent || 'विश्नोई समाज डिजिटल मंच').trim();
    const url = 'https://wa.me/?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  app.closeConfirmModal = function (confirmed) {
    const modal = byId('customConfirmModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    if (typeof window.onPortalConfirm === 'function') {
      const callback = window.onPortalConfirm;
      window.onPortalConfirm = null;
      if (confirmed) callback();
    }
  };
  app.cycleAudioSpeed = function () {
    const audio = byId('audioElement');
    if (!audio) return;
    const speeds = [1, 1.25, 1.5, 1.75, 2, 0.75];
    const current = speeds.indexOf(Number(audio.playbackRate));
    audio.playbackRate = speeds[(current + 1) % speeds.length];
    const label = byId('audioSpeedBtn');
    if (label) label.textContent = audio.playbackRate + 'x';
  };
  app.seekAudio = function (seconds) {
    const audio = byId('audioElement');
    if (audio && Number.isFinite(audio.duration)) {
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + Number(seconds || 0)));
    }
  };
  app.toggleAudio = async function () {
    const audio = byId('audioElement');
    if (!audio || !audio.currentSrc && !audio.getAttribute('src')) {
      notify('अभी कोई भजन उपलब्ध नहीं है। ओनर स्टूडियो से भजन जोड़ें।', 'info');
      return;
    }
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
      const button = byId('audioPlayBtn');
      if (button) button.textContent = audio.paused ? '▶' : 'Ⅱ';
    } catch (error) {
      console.warn('Audio playback failed:', error);
      notify('भजन चल नहीं सका। कृपया उपलब्ध ऑडियो चुनें।', 'error');
    }
  };
  app.handleAudioSeek = function (value) {
    const audio = byId('audioElement');
    if (!audio || !Number.isFinite(audio.duration)) return;
    const percentage = Math.max(0, Math.min(100, Number(value) || 0));
    audio.currentTime = audio.duration * percentage / 100;
  };
  app.pledgeTree = window.pledgeTree;
  app.filterNiyams = function (query) {
    const term = String(query || '').trim().toLocaleLowerCase();
    const container = byId('niyamsList') || byId('niyamList') || byId('niyamsContainer');
    if (!container) return;
    container.querySelectorAll('[data-niyam], article, li, .niyam-card').forEach(function (item) {
      item.hidden = !!term && !item.textContent.toLocaleLowerCase().includes(term);
    });
  };
  app.tapMalaBead = function () {
    state.mala.count = Math.max(0, Number(state.mala.count || 0)) + 1;
    saveMala();
    renderMala();
  };
  app.resetMala = function () {
    state.mala.count = 0;
    saveMala();
    renderMala();
  };
  app.switchHistorySubTab = function (name) {
    const ids = ['full-history', 'kids-corner'];
    ids.forEach(function (id) {
      const panel = byId(id);
      if (panel) panel.classList.toggle('hidden', id !== name);
    });
    const historyButton = byId('sub-history-btn');
    const kidsButton = byId('sub-kids-btn');
    if (historyButton) historyButton.classList.toggle('bg-forest', name === 'full-history');
    if (kidsButton) kidsButton.classList.toggle('bg-forest', name === 'kids-corner');
  };
  app.closePdfViewer = function () {
    const modal = byId('inbuiltPdfModal');
    const frame = byId('pdfEmbedFrame');
    if (frame) frame.src = 'about:blank';
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };

  // The older HTML calls this namespace for its authentication modal.
  window.BishnoiAuth = window.BishnoiAuth || {};
  const authApi = window.BishnoiAuth;
  authApi.openAuthModal = function () {
    const modal = byId('authModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    } else {
      window.promptUserLogin();
    }
  };
  authApi.closeAuthModal = function () {
    const modal = byId('authModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };
  authApi.openProfileOrAuth = app.openProfileOrAuth;
  authApi.closeProfileModal = function () {
    const modal = byId('userProfileModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };
  let phoneConfirmation = null;
  let phoneRecaptcha = null;
  authApi.setLoginMethod = function (method) {
    const phone = method === 'phone';
    byId('emailLoginForm')?.classList.toggle('hidden', phone);
    byId('phoneLoginForm')?.classList.toggle('hidden', !phone);
    byId('emailLoginTab')?.classList.toggle('bg-forest', !phone);
    byId('emailLoginTab')?.classList.toggle('text-white', !phone);
    byId('emailLoginTab')?.classList.toggle('bg-stone-100', phone);
    byId('emailLoginTab')?.classList.toggle('text-stone-700', phone);
    byId('phoneLoginTab')?.classList.toggle('bg-forest', phone);
    byId('phoneLoginTab')?.classList.toggle('text-white', phone);
    byId('phoneLoginTab')?.classList.toggle('bg-stone-100', !phone);
    byId('phoneLoginTab')?.classList.toggle('text-stone-700', !phone);
    if (phone) {
      try {
        if (!phoneRecaptcha && window.firebase?.auth) {
          phoneRecaptcha = new firebase.auth.RecaptchaVerifier('phoneRecaptcha', { size: 'normal' });
          phoneRecaptcha.render().catch(error => console.warn('reCAPTCHA render:', error));
        }
      } catch (error) {
        console.warn('Phone reCAPTCHA initialization:', error);
      }
    }
  };
  authApi.handleAuthSubmit = async function (event) {
    if (event) event.preventDefault();
    const email = (byId('loginIdentifier')?.value || '').trim();
    const password = byId('loginPass')?.value || '';
    if (!state.auth) return notify('Authentication is unavailable.', 'error');
    if (!email || !password) return notify('ईमेल और पासवर्ड दर्ज करें।', 'error');
    try {
      const register = !!byId('nameRow') && !byId('nameRow').classList.contains('hidden');
      if (register) {
        await state.auth.createUserWithEmailAndPassword(email, password);
      } else {
        await state.auth.signInWithEmailAndPassword(email, password);
      }
      authApi.closeAuthModal();
    } catch (error) {
      console.error('Authentication failed:', error);
      notify(authErrorMessage(error), 'error');
    }
  };
  authApi.sendPhoneCode = async function () {
    if (!state.auth || !window.firebase?.auth) return notify('Authentication is unavailable.', 'error');
    const phone = (byId('phoneLoginNumber')?.value || '').replace(/[\\s()-]/g, '');
    if (!/^\\+[1-9]\\d{7,14}$/.test(phone)) {
      return notify('देश कोड सहित सही मोबाइल नंबर दर्ज करें, जैसे +919876543210।', 'error');
    }
    try {
      if (!phoneRecaptcha) {
        phoneRecaptcha = new firebase.auth.RecaptchaVerifier('phoneRecaptcha', { size: 'normal' });
      }
      phoneConfirmation = await state.auth.signInWithPhoneNumber(phone, phoneRecaptcha);
      byId('phoneCodeRow')?.classList.remove('hidden');
      notify('SMS OTP भेज दिया गया है।', 'success');
    } catch (error) {
      console.error('Phone sign-in failed:', error);
      try { await phoneRecaptcha?.clear(); } catch (_) {}
      phoneRecaptcha = null;
      notify(error.code === 'auth/operation-not-allowed'
        ? 'Firebase Console में Phone sign-in provider enable करना आवश्यक है.'
        : authErrorMessage(error), 'error');
    }
  };
  authApi.verifyPhoneCode = async function () {
    const code = (byId('phoneLoginCode')?.value || '').trim();
    if (!phoneConfirmation) return notify('पहले OTP भेजें।', 'error');
    if (!/^\\d{6}$/.test(code)) return notify('6 अंकों का OTP दर्ज करें।', 'error');
    try {
      await phoneConfirmation.confirm(code);
      phoneConfirmation = null;
      authApi.closeAuthModal();
      notify('मोबाइल नंबर सत्यापित हो गया।', 'success');
    } catch (error) {
      console.error('Phone OTP verification failed:', error);
      notify(authErrorMessage(error), 'error');
    }
  };
  authApi.signInWithGoogle = async function () {
    if (!state.auth || !window.firebase?.auth) {
      return notify('Google login is unavailable.', 'error');
    }
    try {
      // Persist the Firebase session across the provider round-trip.
      await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await state.auth.signInWithRedirect(provider);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      notify(authErrorMessage(error), 'error');
    }
  };
  authApi.toggleAuthMode = function () {
    const row = byId('nameRow');
    const title = byId('authTitle');
    const toggle = byId('authToggleBtn');
    const register = !!row && row.classList.contains('hidden');
    if (row) row.classList.toggle('hidden', !register);
    if (title) title.textContent = register ? 'पंजीकरण (Sign Up)' : 'लॉगिन (Sign In)';
    if (toggle) toggle.textContent = register ? 'पहले से सदस्य हैं? लॉगिन करें' : 'नए सदस्य हैं? पंजीकरण करें';
  };
  authApi.saveProfile = async function () {
    if (!state.user || !state.db) return notify('पहले लॉगिन करें।', 'error');
    const name = (byId('profEditName')?.value || '').trim();
    const location = (byId('profEditLocation')?.value || '').trim();
    try {
      await state.db.collection('users').doc(state.user.uid).set({
        displayName: name || state.profile?.displayName || '',
        location: location,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      notify('प्रोफ़ाइल सहेजी गई।', 'success');
    } catch (error) {
      console.error('Profile save failed:', error);
      notify('प्रोफ़ाइल सहेजी नहीं जा सकी।', 'error');
    }
  };
  authApi.logout = window.logoutPortalUser;

  // Keep the public aliases available to inline HTML event handlers.
  window.Bishnoi = window.Bishnoi || window.BishnoiPortal;
  window.Bishnoi.switchTab = window.switchTab;

})();
