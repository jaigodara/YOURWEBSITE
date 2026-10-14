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
  window.switchTab = function (id) {
    const raw = String(id || '').replace(/^tab-/, '');
    const aliases = { sahitya: 'library', pariksha: 'quiz' };
    const key = aliases[raw] || raw;
    const target = 'tab-' + key;
    const panels = document.querySelectorAll('main [id^="tab-"]');
    let found = false;
    panels.forEach(panel => {
      const active = panel.id === target ||
        (key === 'library' && panel.id === 'tab-sahitya') ||
        (key === 'quiz' && panel.id === 'tab-pariksha');
      panel.hidden = !active;
      panel.classList.toggle('hidden', !active);
      panel.setAttribute('aria-hidden', String(!active));
      if (active) found = true;
    });
    if (!found) {
      console.warn('Navigation panel not found:', id, 'expected', target);
      return false;
    }
    document.querySelectorAll('[id^="bnav-"]').forEach(button => {
      const active = button.id === 'bnav-' + key ||
        (key === 'library' && button.id === 'bnav-sahitya') ||
        (key === 'quiz' && button.id === 'bnav-pariksha');
      button.classList.toggle('bnav-active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  };
  window.switchPortalTab = window.switchTab;
  window.BishnoiPortal = window.BishnoiPortal || {};
  window.BishnoiPortal.switchTab = window.switchTab;
  window.Bishnoi = window.Bishnoi || window.BishnoiPortal;
  window.Bishnoi.switchTab = window.switchTab;
  window.BishnoiApp = window.BishnoiApp || {};
  window.BishnoiApp.switchTab = window.switchTab;
})();;

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
    ownerEmailAllowlist: [],
    ownerUid: "rdP0ZXzSP9fGzmJshEVvbOfb31g2",
    legacyOwnerUid: "8YRBWWMKG2OUW6cmzZkGbFgOqyp2"
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
    maintenance: { globalMode: 'off', message: '', sections: {} },
    historyItems: [],
    myResults: [],
    mala: { count: 0, laps: 0 },
    fontSize: 16,
    quizQuestions: [],
    initialized: false,
    publicNotificationsUnsubscribe: null
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

  function timestampMillis(value) {
    if (!value) return 0;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

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
    if (!el) return;
    const shouldHide = !visible;
    el.hidden = shouldHide;
    // Keep the HTML hidden attribute and Tailwind's .hidden utility in sync.
    // Otherwise an element can remain invisible after the owner turns it on.
    el.classList.toggle('hidden', shouldHide);
    el.setAttribute('aria-hidden', String(shouldHide));
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
    pariksha: 'tab-quiz',
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
    state.profile = {};
    try {
      const profileRef = collection('users').doc(user.uid);
      const snap = await profileRef.get();
      if (snap.exists) {
        state.profile = snap.data();
        if (!state.profile.verificationStatus) {
          await profileRef.set({
            verificationStatus: 'unverified',
            displayName: state.profile.displayName || user.displayName || '',
            email: user.email || null,
            phone: state.profile.phone || user.phoneNumber || '',
            updatedAt: serverTimestamp()
          }, { merge: true });
          state.profile = { ...state.profile, verificationStatus: 'unverified' };
        }
      } else {
        state.profile = {
          displayName: user.displayName || '',
          email: user.email || null,
          phone: user.phoneNumber || '',
          phoneVerified: !!user.phoneNumber,
          verificationStatus: 'unverified',
          authProvider: user.providerData?.[0]?.providerId || 'unknown',
          createdAt: serverTimestamp()
        };
        await profileRef.set(state.profile, { merge: true });
      }
    } catch (profileError) {
      console.warn('User profile could not be created/read; check users Firestore rules:', profileError);
    }
    let roleData = {};
    try {
      const roleSnap = await collection('roles').doc(user.uid).get();
      roleData = roleSnap.exists ? roleSnap.data() : {};
    } catch (roleError) {
      console.warn('Owner role could not be read; owner-only access remains disabled.', roleError);
    }
    // Roles are read from Firestore, never from browser storage or URL parameters.
    state.roles = [
      ...asArray(state.profile.roles),
      ...(typeof roleData.role === 'string' ? [roleData.role] : []),
      ...(Array.isArray(roleData.roles) ? roleData.roles : [])
    ];
   state.isOwner = user.uid === CONFIG.ownerUid ||
  user.uid === CONFIG.legacyOwnerUid ||
  state.profile.role === 'owner' ||
  state.profile.isOwner === true ||
  state.roles.includes('owner') ||
  roleData.role === 'owner';

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
    setVisible('ownerStudioPortalBtn', state.isOwner || state.roles.includes('admin'));
    setVisible('profileOwnerStudioLink', state.isOwner || state.roles.includes('admin'));

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

    // Google sign-in uses signInWithPopup now. The auth-state observer below
    // remains the single source of truth for the active Firebase session.
    state.auth.onAuthStateChanged(async user => {
      clearSubscriptions();
      state.user = user;
      state.profile = null;
      state.myResults = [];
      renderMyResults();
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
          if (state.profile?.mala && typeof state.profile.mala === 'object') {
            state.mala.count = Math.min(107, Math.max(0, Number(state.profile.mala.count) || 0));
            state.mala.laps = Math.max(0, Number(state.profile.mala.laps) || 0);
            try { localStorage.setItem('bishnoi_mala_v2', JSON.stringify({ ...state.mala, date: localDateKey() })); } catch (_) {}
            renderMala();
          }
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
        setVisible('ownerStudioPortalBtn', false);
        setVisible('profileOwnerStudioLink', false);
      }

      renderAuthState();
    });
  }

  function renderAuthState() {
    const label = state.user
      ? (state.profile?.displayName || state.user.displayName || state.user.email || 'Account')
      : 'लॉगिन करें';

    ['authButton', 'profileButton', 'loginBtn', 'authLoginButton'].forEach(id => {
      const el = byId(id);
      if (!el) return;
      el.textContent = label;
      if (id === 'authLoginButton') {
        // Keep the existing visual design but make the button reflect the real
        // Firebase session and open the profile after successful sign-in.
        el.onclick = state.user
          ? () => window.BishnoiAuth?.openProfileOrAuth?.()
          : () => window.BishnoiAuth?.openAuthModal?.();
        el.setAttribute('aria-label', state.user ? 'खाता और प्रोफ़ाइल खोलें' : 'लॉगिन करें');
      }
    });

    setText('bnavProfileLabel', state.user ? 'खाता' : 'प्रोफ़ाइल');

    // Community posting follows the same Firebase session as the rest of the site.
    // Guests see the login prompt; signed-in users see the message composer.
    setVisible('postAuthPrompt', !state.user);
    setVisible('postEditor', !!state.user);
    refreshEnrollmentStatus();

    setVisible('ownerStudioPortalBtn', !!state.isOwner);
    setVisible('profileOwnerStudioLink', !!state.isOwner);

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

    // Owner Studio's existing banner editor writes settings/dailySandesh.
    // Listen to that same document so its published text appears on the live homepage.
    subscribe(
      collection('settings').doc('dailySandesh'),
      snap => {
        const text = snap.exists ? (snap.data().text || '') : '';
        if (text) setText('dailyBannerText', text);
      },
      'Daily banner message'
    );

    subscribe(
      collection('settings').doc('maintenance'),
      snap => {
        state.maintenance = snap.exists ? snap.data() : { globalMode: 'off', message: '', sections: {} };
        applyMaintenanceSettings();
      },
      'Maintenance settings'
    );

    subscribe(
      collection('historyItems').orderBy('createdAt', 'desc').limit(100),
      snap => {
        state.historyItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderHistoryItems();
      },
      'History and culture updates'
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

    if (state.user) {
      Object.entries(CONFIG.submissionCollections).forEach(([mode, collectionName]) => {
        subscribe(
          collection(collectionName).where('uid', '==', state.user.uid).limit(50),
          snap => {
            const others = state.myResults.filter(x => x.mode !== mode);
            const rows = snap.docs.map(d => ({ id: d.id, mode, collectionName, ...d.data() }));
            state.myResults = [...others, ...rows].sort((a,b) => timestampMillis(b.submittedAt) - timestampMillis(a.submittedAt));
            renderMyResults();
          },
          'My exam results'
        );
      });
    }
  }

  function applyPortalSettings() {
    const s = state.settings || {};
    const banner = s.dailySandesh || 'जीव दया पालणी, रूंख लीलो नी घावै';
    setText('dailySandesh', banner);
    if (byId('dailyBannerText') && !byId('dailyBannerText').textContent.trim()) setText('dailyBannerText', banner);
    const progress = Math.max(0, Math.min(100, Number(s.maintenanceProgress) || 0));
    setText('maintenanceProgress', `${progress}%`);
    const bar = byId('maintenanceProgressBar');
    if (bar) bar.style.width = `${progress}%`;
    renderExamVisibility();
  }

  function applyMaintenanceSettings() {
    const m = state.maintenance || {};
    const mode = m.globalMode || 'off';
    const message = m.message || 'इस भाग में नए अपडेट जोड़े जा रहे हैं। कृपया कुछ समय बाद फिर देखें।';
    const banner = byId('maintenanceBanner');
    if (banner) {
      const active = mode !== 'off';
      banner.hidden = !active;
      banner.classList.toggle('hidden', !active);
      setText('maintenanceMessage', message);
      setText('maintenanceModeLabel', mode === 'both' ? 'पूरे मंच पर रखरखाव' : mode === 'web_only' ? 'वेबसाइट रखरखाव' : mode === 'phone_only' ? 'मोबाइल/ऐप रखरखाव' : '');
    }
    const sectionLabels = {
      mala: ['tab-mala', '📿 डिजिटल जप माला'],
      library: ['tab-library', '📚 साहित्य'],
      quiz: ['tab-quiz', '🏆 परीक्षा'],
      community: ['tab-community', '💬 संवाद'],
      history: ['tab-history', '📜 इतिहास व संस्कार']
    };
    Object.entries(sectionLabels).forEach(([key, [sectionId, label]]) => {
      const section = byId(sectionId);
      if (!section) return;
      let notice = byId(`maintenance-notice-${key}`);
      const locked = (m.sections || {})[key] === 'both' && !(m.vipBypass !== false && state.isOwner);
      if (!notice) {
        notice = document.createElement('div');
        notice.id = `maintenance-notice-${key}`;
        notice.className = 'mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950';
        section.prepend(notice);
      }
      notice.hidden = !locked;
      notice.classList.toggle('hidden', !locked);
      notice.innerHTML = locked ? `<strong>${escapeHtml(label)} — नए अपडेट आ रहे हैं</strong><p class="mt-1 text-xs leading-relaxed">${escapeHtml(message)}</p>` : '';
      Array.from(section.children).forEach(child => {
        if (child === notice) return;
        if (locked) {
          if (!child.hasAttribute('data-maintenance-was-hidden')) {
            child.setAttribute('data-maintenance-was-hidden', (child.hidden || child.classList.contains('hidden')) ? 'yes' : 'no');
          }
          child.hidden = true;
          child.classList.add('hidden');
        } else if (child.hasAttribute('data-maintenance-was-hidden')) {
          const wasHidden = child.getAttribute('data-maintenance-was-hidden') === 'yes';
          child.hidden = wasHidden;
          child.classList.toggle('hidden', wasHidden);
          child.removeAttribute('data-maintenance-was-hidden');
        }
      });
    });
    const globalOverlay = byId('globalMaintenanceOverlay');
    if (globalOverlay) {
      const blockWebsite = (mode === 'web_only' || mode === 'both') && !(m.vipBypass !== false && state.isOwner);
      globalOverlay.hidden = !blockWebsite;
      globalOverlay.classList.toggle('hidden', !blockWebsite);
      setText('globalMaintenanceMessage', message);
    }
  }

  // Enrollment and student-side admit-card workflow.
  function ensureEnrollmentStatusHost() {
    const form = byId('examEnrollmentForm');
    if (!form) return null;
    let host = byId('enrollmentStudentStatus');
    if (!host) {
      host = document.createElement('div');
      host.id = 'enrollmentStudentStatus';
      host.className = 'sm:col-span-2 mt-3 rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-700 space-y-2';
      form.insertAdjacentElement('afterend', host);
    }
    return host;
  }

  function renderEnrollmentStatus(record) {
    const host = ensureEnrollmentStatusHost();
    const notice = byId('enrollmentAccountNotice');
    if (!host) return;
    if (!state.user) {
      if (notice) notice.textContent = 'पंजीकरण और प्रवेश-पत्र देखने के लिए पहले लॉगिन करें।';
      host.innerHTML = '<p>पंजीकरण की स्थिति देखने के लिए अपने खाते से लॉगिन करें।</p>';
      return;
    }
    if (notice) notice.textContent = 'लॉगिन खाता: ' + (state.profile?.displayName || state.user.displayName || state.user.email || 'सदस्य');
    if (record === undefined) {
      host.textContent = 'आपका पंजीकरण रिकॉर्ड जाँचा जा रहा है…';
      return;
    }
    if (!record) {
      host.innerHTML = '<p>अभी इस खाते से कोई परीक्षा पंजीकरण नहीं मिला। ऊपर फॉर्म भरकर पंजीकरण भेजें।</p>';
      return;
    }
    const status = record.verificationStatus || 'pending';
    const statusText = status === 'confirmed' ? 'पंजीकरण स्वीकृत' : status === 'rejected' ? 'पंजीकरण अस्वीकृत' : 'पंजीकरण समीक्षा की प्रतीक्षा में';
    const roll = record.rollNumber || '';
    host.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = 'आपका पंजीकरण: ' + statusText;
    host.appendChild(heading);
    const detail = document.createElement('p');
    detail.textContent = 'परीक्षा: ' + (record.examName || record.examTitle || 'मुख्य परीक्षा') + ' · रोल नंबर: ' + (roll || 'अभी आवंटित नहीं');
    host.appendChild(detail);
    if (status === 'confirmed' && roll) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rounded-lg bg-forest px-4 py-2 font-bold text-white';
      button.textContent = '🎟️ प्रवेश-पत्र डाउनलोड / PDF में सेव करें';
      button.addEventListener('click', () => printStudentAdmitCard(record));
      host.appendChild(button);
      const hint = document.createElement('p');
      hint.className = 'text-stone-500';
      hint.textContent = 'खुलने वाली विंडो में “प्रिंट / PDF में सेव करें” चुनें।';
      host.appendChild(hint);
    } else if (status === 'rejected') {
      const hint = document.createElement('p');
      hint.textContent = 'यदि आपको लगता है कि यह गलती है, तो व्यवस्थापक से संपर्क करें।';
      host.appendChild(hint);
    } else {
      const hint = document.createElement('p');
      hint.textContent = 'व्यवस्थापक द्वारा पुष्टि और रोल नंबर आवंटित होने के बाद यहीं प्रवेश-पत्र का बटन दिखेगा।';
      host.appendChild(hint);
    }
  }

  async function refreshEnrollmentStatus() {
    if (!state.user || !state.db) {
      renderEnrollmentStatus(null);
      return;
    }
    const uid = state.user.uid;
    renderEnrollmentStatus(undefined);
    try {
      const snap = await state.db.collection('examEnrolledStudents').doc(uid).get();
      if (state.user?.uid !== uid) return;
      renderEnrollmentStatus(snap.exists ? snap.data() : null);
    } catch (error) {
      console.warn('Enrollment status could not be loaded:', error);
      if (state.user?.uid === uid) {
        const host = ensureEnrollmentStatusHost();
        if (host) host.textContent = 'पंजीकरण की स्थिति लोड नहीं हुई। Firestore permissions जाँचें और फिर रिफ्रेश करें।';
      }
    }
  }

  function printStudentAdmitCard(record) {
    if (!state.user || !record || record.uid !== state.user.uid) {
      notify('अपने खाते का वैध पंजीकरण उपलब्ध नहीं है।', 'error');
      return;
    }
    if (record.verificationStatus !== 'confirmed' || !record.rollNumber) {
      notify('प्रवेश-पत्र के लिए व्यवस्थापक की पुष्टि और रोल नंबर आवश्यक हैं।', 'error');
      return;
    }
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) {
      notify('प्रवेश-पत्र खोलने के लिए इस वेबसाइट के pop-ups की अनुमति दें।', 'error');
      return;
    }
    const esc = escapeHtml;
    const name = esc(record.fullName || record.name || state.profile?.displayName || state.user.displayName || 'विद्यार्थी');
    const roll = esc(record.rollNumber);
    const exam = esc(record.examName || record.examTitle || 'मुख्य परीक्षा');
    const date = esc(record.examDate || record.date || 'आधिकारिक सूचना के अनुसार');
    const venue = esc(record.examCenter || record.center || 'ऑनलाइन परीक्षा पोर्टल');
    const regId = esc(record.registrationNumber || record.uid || state.user.uid);
    popup.document.open();
    popup.document.write('<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>परीक्षा प्रवेश-पत्र</title><style>body{font-family:Arial,sans-serif;background:#f4efe5;color:#173b29;padding:24px}.card{max-width:780px;margin:auto;background:#fff;border:3px solid #173b29;border-radius:18px;overflow:hidden}.head{background:#173b29;color:white;padding:24px;text-align:center}.head h1{margin:0}.body{padding:24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}.field{border:1px solid #ddd;border-radius:10px;padding:12px}.label{font-size:10px;color:#68766b}.value{font-weight:bold;margin-top:5px;overflow-wrap:anywhere}.notice{margin-top:20px;padding:12px;background:#fff8dc;border-radius:10px;font-size:12px;line-height:1.7}.print{display:block;margin:20px auto;padding:12px 20px;background:#173b29;color:white;border:0;border-radius:9px;font-weight:bold}@media(max-width:540px){.grid{grid-template-columns:1fr}}@media print{body{padding:0;background:#fff}.print{display:none}.card{border-radius:0}}</style></head><body><article class="card"><header class="head"><div style="font-size:32px">🌳</div><h1>बिश्नोई समाज डिजिटल मंच</h1><p>परीक्षा प्रवेश-पत्र • ADMIT CARD</p></header><main class="body"><strong>पंजीकरण सत्यापित</strong><div class="grid"><div class="field"><div class="label">विद्यार्थी का नाम</div><div class="value">'+name+'</div></div><div class="field"><div class="label">रोल नंबर</div><div class="value">'+roll+'</div></div><div class="field"><div class="label">परीक्षा</div><div class="value">'+exam+'</div></div><div class="field"><div class="label">परीक्षा दिनांक</div><div class="value">'+date+'</div></div><div class="field"><div class="label">परीक्षा केंद्र / माध्यम</div><div class="value">'+venue+'</div></div><div class="field"><div class="label">पंजीकरण ID</div><div class="value">'+regId+'</div></div></div><div class="notice"><strong>महत्वपूर्ण निर्देश</strong><br>1. प्रवेश-पत्र सुरक्षित रखें।<br>2. आधिकारिक परीक्षा समय और निर्देशों का पालन करें।<br>3. विवरण गलत होने पर परीक्षा से पहले व्यवस्थापक से संपर्क करें।</div></main></article><button class="print" onclick="window.print()">प्रिंट / PDF में सेव करें</button></body></html>');
    popup.document.close();
  }

  function initPublicNotifications() {
    const host = byId('publicNotificationsList');
    const section = byId('publicNotificationsSection');
    if (!host || !section || !state.db || state.publicNotificationsUnsubscribe) return;
    state.publicNotificationsUnsubscribe = state.db.collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot(snapshot => {
        host.replaceChildren();
        const activeDocs = snapshot.docs.filter(doc => (doc.data() || {}).active === true).slice(0, 5);
        if (!activeDocs.length) {
          section.hidden = true;
          section.classList.add('hidden');
          return;
        }
        section.hidden = false;
        section.classList.remove('hidden');
        activeDocs.forEach(doc => {
          const item = doc.data() || {};
          const card = document.createElement('article');
          card.className = 'rounded-xl border border-amber-200 bg-white p-3';
          const title = document.createElement('h3');
          title.className = 'font-bold text-forest text-sm';
          title.textContent = item.title || 'नई सूचना';
          const body = document.createElement('p');
          body.className = 'mt-1 text-xs leading-relaxed text-stone-700 whitespace-pre-wrap';
          body.textContent = item.message || '';
          card.append(title, body);
          if (item.createdAt && typeof item.createdAt.toDate === 'function') {
            const time = document.createElement('p');
            time.className = 'mt-2 text-[10px] text-stone-400';
            time.textContent = item.createdAt.toDate().toLocaleString('hi-IN');
            card.appendChild(time);
          }
          host.appendChild(card);
        });
      }, error => {
        console.warn('Public notifications could not load:', error);
        // Keep the rest of the website usable when notification rules are not deployed yet.
        section.hidden = true;
        section.classList.add('hidden');
      });
    state.unsubscribers.push(() => {
      if (state.publicNotificationsUnsubscribe) state.publicNotificationsUnsubscribe();
      state.publicNotificationsUnsubscribe = null;
    });
  }

  function initEnrollmentUI() {
    const form = byId('examEnrollmentForm');
    const login = byId('enrollmentLoginButton');
    if (login && !login.dataset.bound) {
      login.dataset.bound = '1';
      login.addEventListener('click', () => window.BishnoiAuth?.openAuthModal?.());
    }
    if (form && !form.dataset.bound) {
      form.dataset.bound = '1';
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const status = byId('enrollmentSubmitStatus');
        const button = byId('enrollmentSubmitButton');
        if (!state.user || !state.db) {
          if (status) status.textContent = 'पहले लॉगिन करें, फिर पंजीकरण भेजें।';
          window.BishnoiAuth?.openAuthModal?.();
          return;
        }
        const fullName = (byId('enrollmentName')?.value || '').trim();
        const phone = (byId('enrollmentPhone')?.value || '').trim();
        const examName = (byId('enrollmentExam')?.value || 'मुख्य परीक्षा').trim();
        const location = (byId('enrollmentLocation')?.value || '').trim();
        if (fullName.length < 2 || !/^[+()\d\s-]{10,20}$/.test(phone)) {
          if (status) status.textContent = 'कृपया सही पूरा नाम और मोबाइल नंबर दर्ज करें।';
          return;
        }
        if (button) button.disabled = true;
        if (status) status.textContent = 'पंजीकरण सहेजा जा रहा है…';
        try {
          const ref = state.db.collection('examEnrolledStudents').doc(state.user.uid);
          const existing = await ref.get();
          const old = existing.exists ? existing.data() : {};
          const data = {
            uid: state.user.uid,
            fullName,
            name: fullName,
            phone,
            examName,
            location,
            verificationStatus: old.verificationStatus || 'pending',
            // Firebase Auth UIDs are unique; preserving the full UID makes this
            // generated roll number unique without a manual counter or race.
            rollNumber: 'BIS-' + state.user.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          if (!existing.exists) data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await ref.set(data, { merge: true });
          if (status) status.textContent = 'पंजीकरण भेज दिया गया। आपका यूनिक रोल नंबर अपने-आप बन गया है; व्यवस्थापक की पुष्टि के बाद प्रवेश-पत्र यहीं मिलेगा।';
          await refreshEnrollmentStatus();
          notify('परीक्षा पंजीकरण सहेज दिया गया।', 'success');
        } catch (error) {
          console.error('Enrollment submit failed:', error);
          if (status) status.textContent = 'पंजीकरण सहेजा नहीं जा सका। Firebase Firestore rules में examEnrolledStudents की अनुमति जाँचें।';
          notify('पंजीकरण सहेजने में समस्या आई।', 'error');
        } finally {
          if (button) button.disabled = false;
        }
      });
    }
    ensureEnrollmentStatusHost();
    renderEnrollmentStatus(state.user ? undefined : null);
  }

  function renderMyResults() {
    const host = byId('myResultsList');
    if (!host) return;
    const rows = state.myResults || [];
    if (!rows.length) {
      host.innerHTML = '<p class="text-xs text-stone-500">आपके जमा किए गए परीक्षा प्रयास यहाँ दिखाई देंगे।</p>';
      return;
    }
    const modeNames = { quiz: 'दैनिक ज्ञान परीक्षा', mock1: 'Mock Exam 1', mock2: 'Mock Exam 2', main: 'Main Exam' };
    host.innerHTML = rows.map(row => {
      const published = row.resultPublished === true || row.manualReviewStatus === 'published' || (row.mode === 'quiz' && row.resultPublished !== false);
      const held = row.manualReviewStatus === 'held';
      const cancelled = row.manualReviewStatus === 'cancelled';
      const score = row.finalScore ?? row.manualScore ?? row.score;
      const status = published ? 'परिणाम घोषित' : held ? 'जाँच के लिए रोका गया' : cancelled ? 'परिणाम रद्द' : 'जाँच जारी है';
      return '<article class="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-1"><div class="flex items-center justify-between gap-2"><strong class="text-xs text-forest">' + escapeHtml(modeNames[row.mode] || row.mode || 'परीक्षा') + '</strong><span class="text-[10px] font-bold ' + (published ? 'text-emerald-700' : 'text-amber-700') + '">' + status + '</span></div><p class="text-[11px] text-stone-600">' + (published ? 'अंतिम अंक: ' + escapeHtml(score ?? '—') + '/' + escapeHtml(row.total ?? row.totalQuestions ?? '—') : 'अंतिम अंक परिणाम घोषित होने पर दिखेंगे।') + '</p><p class="text-[10px] text-stone-400">' + escapeHtml(row.rollNumber ? 'रोल नंबर: ' + row.rollNumber + ' · ' : '') + escapeHtml(row.submittedAt?.toDate ? row.submittedAt.toDate().toLocaleString('hi-IN') : '') + '</p></article>';
    }).join('');
  }

  function renderHistoryItems() {
    const historyHost = byId('historySubView');
    const kidsHost = byId('kidsSubView');
    const history = (state.historyItems || []).filter(x => x.category !== 'kids');
    const kids = (state.historyItems || []).filter(x => x.category === 'kids');
    const card = x => `<article class="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-2"><h3 class="font-yatra text-base text-forest">${escapeHtml(x.title || 'इतिहास व संस्कार')}</h3><p class="text-xs leading-relaxed text-stone-700 whitespace-pre-wrap">${escapeHtml(x.content || '')}</p><p class="text-[10px] text-stone-400">${escapeHtml(x.dateLabel || '')}</p></article>`;
    if (historyHost) historyHost.innerHTML = history.length ? history.map(card).join('') : '<div class="rounded-2xl border border-dashed border-stone-300 p-5 text-center text-xs text-stone-500">इतिहास की नई जानकारी Owner Studio से जोड़ी जा सकती है।</div>';
    if (kidsHost) kidsHost.innerHTML = kids.length ? kids.map(card).join('') : '<div class="rounded-2xl border border-dashed border-stone-300 p-5 text-center text-xs text-stone-500">बाल संस्कार की सामग्री जल्द यहाँ दिखाई जाएगी।</div>';
  }


function renderExamVisibility() {
  const c = state.examConfig || {};

  // Use real container IDs. The daily quiz container includes both
  // its introduction and active attempt UI; results have their own panel.
  const features = [
    ['enrollmentSection', c.enrollmentVisible !== false],
    ['mockHub', c.mockVisible !== false],
    ['mockExam1Card', c.mock1Visible !== false],
    ['mockExam2Card', c.mock2Visible !== false],
    ['mainExamSection', c.mainExamVisible !== false],
    ['dailyQuizSection', c.dailyQuizVisible !== false],
    ['myResultsPanel', c.resultsVisible !== false]
  ];

  features.forEach(([id, visible]) => setVisible(id, visible));

  // Exam visibility is not maintenance mode.
  // Do not show year-round update announcements just because
  // an owner has hidden an exam or its results.
  const notice = byId('examFeatureNotice');
  if (notice) {
    notice.hidden = true;
    notice.classList.add('hidden');
    notice.textContent = '';
  }

  renderExamCountdowns();
}


  const EXAM_SCHEDULES = [
    { mode: 'quiz', field: 'quizStartAtMs', element: 'quizCountdown', label: 'दैनिक ज्ञान परीक्षा' },
    { mode: 'mock1', field: 'mock1StartAtMs', element: 'mock1Countdown', label: 'मॉक परीक्षा 1' },
    { mode: 'mock2', field: 'mock2StartAtMs', element: 'mock2Countdown', label: 'मॉक परीक्षा 2' },
    { mode: 'main', field: 'mainStartAtMs', element: 'mainExamCountdown', label: 'मुख्य परीक्षा' }
  ];

  function getExamStartAt(mode) {
    const entry = EXAM_SCHEDULES.find(item => item.mode === mode);
    const value = entry ? Number(state.examConfig?.[entry.field]) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function renderExamCountdowns() {
    const now = Date.now();
    EXAM_SCHEDULES.forEach(item => {
      const el = byId(item.element);
      if (!el) return;
      const startAt = getExamStartAt(item.mode);
      if (!startAt) {
        el.textContent = '🟢 अभी उपलब्ध • समय निर्धारित नहीं';
        el.className = 'rounded-xl bg-white/90 border border-emerald-200 p-3 text-xs font-bold text-emerald-900';
        return;
      }
      const remaining = startAt - now;
      if (remaining <= 0) {
        el.textContent = '🟢 परीक्षा शुरू हो चुकी है • आप प्रवेश कर सकते हैं';
        el.className = 'rounded-xl bg-white/90 border border-emerald-200 p-3 text-xs font-bold text-emerald-900';
        return;
      }
      const totalSeconds = Math.floor(remaining / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const countdown = days ? `${days} दिन ${hours} घंटे ${minutes} मिनट` : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      el.textContent = `⏳ ${item.label} शुरू होने में: ${countdown}`;
      el.className = 'rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-extrabold text-amber-900';
    });
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
    setText('currentBeadDisplay', state.mala.count);
    setText('malaTotalDisplay', state.mala.laps * 108 + state.mala.count);
    setText('malaLapsDisplay', state.mala.laps);
    const p = byId('malaProgressBar');
    if (p) p.style.width = `${state.mala.count / 108 * 100}%`;
    $$('.mala-bead').forEach((b, i) => b.classList.toggle('bead-done', i < state.mala.count));
  }

  window.tapHomeMalaBead = function () {
    state.mala.count++;
    if (state.mala.count >= 108) {
      state.mala.count = 0;
      state.mala.laps++;
      notify('एक माला पूरी हुई! साधना के लिए धन्यवाद।', 'success');
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
    const host = byId('audioList') || byId('audioPlayerTrackList');
    if (!host) return;

    host.innerHTML = items.map(a => {
      const audioUrl = a.audioUrl || a.link || a.url || '';
      return `
        <button type="button" class="audio-item" data-audio-id="${escapeHtml(a.id)}">
          ${escapeHtml(a.title || 'Bhajan')} ${audioUrl ? '▶' : ''}
        </button>
      `;
    }).join('');

    host.querySelectorAll('[data-audio-id]').forEach(btn => {
      btn.onclick = () => {
        const a = items.find(x => x.id === btn.dataset.audioId);
        const audioUrl = a?.audioUrl || a?.link || a?.url;

        if (!audioUrl) return notify('Audio URL has not been uploaded yet.');

        const audio = byId('audioElement') || byId('karaokeAudio') || byId('bhajanAudio');

        if (audio) {
          audio.src = audioUrl;
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
    const host = byId('pdfLibrary') || byId('literatureFiles') || byId('pdfGrid');
    if (!host) return;

    host.innerHTML = items.map(x => {
      const url = x.url || x.link || x.pdfUrl || '';
      return `
        <article class="library-file rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <strong>${escapeHtml(x.title || x.name || 'Document')}</strong>
          ${x.tag ? `<p class="text-xs text-stone-500 mt-1">${escapeHtml(x.tag)}</p>` : ''}
          ${url ? `<p class="mt-3"><a class="text-emerald-800 underline font-semibold" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">📄 PDF खोलें</a></p>` : '<p class="text-xs text-stone-500 mt-2">लिंक उपलब्ध नहीं है।</p>'}
        </article>
      `;
    }).join('');
  }
    // Community chat: keep the current HTML IDs and Firestore rules in sync.
  let communityPostsCache = [];
  let communityTopicFilter = 'all';

  function renderCommunity(posts) {
    communityPostsCache = Array.isArray(posts) ? posts : [];
    const host = byId('communityFeed') || byId('communityPosts') || byId('postsList');
    if (!host) return;

    const filtered = communityTopicFilter === 'all'
      ? communityPostsCache
      : communityPostsCache.filter(post => (post.topic || 'सामान्य चर्चा') === communityTopicFilter);

    if (!filtered.length) {
      host.innerHTML = '<div class="rounded-xl bg-white p-4 text-center text-xs text-stone-500">अभी कोई संदेश नहीं है। चर्चा की शुरुआत आप कर सकते हैं।</div>';
      return;
    }

    host.innerHTML = filtered.map(post => {
      const body = post.body || post.text || post.content || '';
      const author = post.displayName || post.authorName || 'समाज का सदस्य';
      const topic = post.topic || 'सामान्य चर्चा';
      const when = post.createdAt && typeof post.createdAt.toDate === 'function'
        ? post.createdAt.toDate().toLocaleString('hi-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : '';
      return `
        <article class="rounded-xl bg-white border border-stone-200 p-3.5 shadow-sm space-y-2" data-post-id="${escapeHtml(post.id || '')}">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 rounded-full px-2 py-1">${escapeHtml(topic)}</span>
            <span class="text-[10px] text-stone-400">${escapeHtml(when)}</span>
          </div>
          <p class="text-sm text-stone-800 whitespace-pre-wrap break-words">${escapeHtml(body)}</p>
          <div class="text-[10px] text-stone-500">— ${escapeHtml(author)}</div>
        </article>
      `;
    }).join('');
  }

  window.BishnoiCommunity = window.BishnoiCommunity || {};
  window.BishnoiCommunity.filterTopic = function (topic) {
    communityTopicFilter = topic || 'all';
    renderCommunity(communityPostsCache);
  };
  window.BishnoiCommunity.submitPost = async function () {
    if (!requireUser()) return;

    const input = byId('postText');
    const body = (input?.value || '').trim();
    if (!body) {
      notify('संदेश लिखकर भेजें।');
      input?.focus();
      return;
    }
    if (body.length > 300) {
      notify('संदेश 300 अक्षरों से छोटा रखें।', 'error');
      return;
    }

    const topic = byId('chatTopicFilter')?.value || 'सामान्य चर्चा';
    try {
      // These fields match the current Firestore rule:
      // request.resource.data.uid == request.auth.uid and body is a string.
      await collection('posts').add({
        uid: state.user.uid,
        body,
        topic,
        displayName: state.profile?.displayName || state.user.displayName || 'समाज का सदस्य',
        createdAt: serverTimestamp()
      });
      if (input) input.value = '';
      notify('आपका संदेश प्रकाशित हो गया।', 'success');
    } catch (e) {
      console.error('Community post failed:', e);
      notify('संदेश नहीं भेजा जा सका। Firestore permissions जाँचें।', 'error');
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
    if (exam.visibilityHandler) {
      document.removeEventListener('visibilitychange', exam.visibilityHandler);
    }

    exam.beforeUnload = null;
    exam.visibilityHandler = null;
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
      : Array.isArray(question.opts)
        ? question.opts
        : [question.optionA, question.optionB, question.optionC, question.optionD].filter(Boolean);

    host.innerHTML = `
      <p>Question ${exam.index + 1} of ${exam.questions.length}</p>
      <h3>${escapeHtml(question.question || question.text || question.q || 'Question')}</h3>
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

    // Match the visible cards with the actual start handlers, so hidden exams
    // cannot still be launched by an old button or a direct JavaScript call.
    const config = state.examConfig || {};
    const visibilityField = ({
      quiz: 'dailyQuizVisible',
      mock1: 'mock1Visible',
      mock2: 'mock2Visible',
      main: 'mainExamVisible'
    })[mode];
    if (visibilityField && config[visibilityField] === false) {
      notify('यह परीक्षा अभी Owner Studio में बंद है।', 'error');
      return;
    }
    if ((mode === 'mock1' || mode === 'mock2') && config.mockVisible === false) {
      notify('मॉक परीक्षाएँ अभी Owner Studio में बंद हैं।', 'error');
      return;
    }

    const scheduledStart = getExamStartAt(mode);
    if (scheduledStart && Date.now() < scheduledStart) {
      const startText = new Date(scheduledStart).toLocaleString('hi-IN', { dateStyle: 'medium', timeStyle: 'short' });
      notify(`यह परीक्षा ${startText} पर शुरू होगी। काउंटडाउन पूरा होने तक प्रवेश बंद है।`, 'error');
      switchTab('quiz');
      renderExamCountdowns();
      return;
    }

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
        endAt: Date.now() + Math.max(1, Number(state.examConfig?.durationMinutes) || CONFIG.defaultExamMinutes) * 60 * 1000,
        durationMinutes: Math.max(1, Number(state.examConfig?.durationMinutes) || CONFIG.defaultExamMinutes),
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

      // Visibility-change monitoring: this is a deterrent, not tamper-proof proctoring.
      state.exam.visibilityHandler = () => {
        if (!state.exam.active || document.visibilityState !== 'hidden') return;
        state.exam.tabSwitches = (state.exam.tabSwitches || 0) + 1;
        notify(`Exam tab change ${state.exam.tabSwitches}/${CONFIG.maxTabSwitches}.`, 'error');
        if (state.exam.tabSwitches >= CONFIG.maxTabSwitches) {
          notify('Maximum tab changes reached. Submitting the exam.', 'error');
          window.submitPortalExam(true);
        }
      };
      document.addEventListener('visibilitychange', state.exam.visibilityHandler);

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

        const correctAnswer = question.correctAnswer ?? question.answerIndex ?? question.ans;

        if (String(answer) === String(correctAnswer)) correct++;
      }
    });

    const result = {
      uid: state.user.uid,
      name: state.profile?.displayName || state.user.displayName || state.user.email || 'प्रतिभागी',
      email: state.user.email || null,
      mode: exam.mode,
      total: exam.questions.length,
      totalQuestions: exam.questions.length,
      rollNumber: state.profile?.rollNumber || null,
      attempted,
      correct,
      score: correct,
      finalScore: exam.mode === 'quiz' ? correct : null,
      resultPublished: exam.mode === 'quiz',
      answers: { ...exam.answers },
      review: { ...exam.review },
      submittedAt: serverTimestamp(),
      automatic,
      manualReviewStatus: 'pending'
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
    initEnrollmentUI();
    renderPanchangEstimate();
    renderExamCountdowns();
    window.setInterval(renderExamCountdowns, 1000);
    initMalaState();
    initKaraokePlayer();
    renderNiyamsList();
    bindOptionalButtons();

    if (initFirebase()) {
      initAuthUI();
      initPublicNotifications();
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
      const modal = byId('userProfileModal');
      if (modal) {
        const profile = state.profile || {};
        const displayName = profile.displayName || state.user.displayName || '';
        const email = state.user.email || state.user.phoneNumber || 'Google / अन्य लॉगिन खाता';
        const nameInput = byId('profEditName');
        const locationInput = byId('profEditLocation');
        const phoneInput = byId('profEditPhone');
        if (nameInput) nameInput.value = displayName;
        if (locationInput) locationInput.value = profile.location || '';
        if (phoneInput) phoneInput.value = profile.phone || state.user.phoneNumber || '';
        setText('profHeaderNameDisplay', displayName || 'मेरी प्रोफ़ाइल');
        setText('profileEmailDisplay', email);
        const verification = profile.verificationStatus || 'unverified';
        const verificationLabel = verification === 'confirmed' ? 'व्यवस्थापक द्वारा सत्यापित' : verification === 'rejected' ? 'सत्यापन अस्वीकृत' : 'सत्यापन लंबित';
        setText('profileAccountStatus', (state.isOwner ? 'ओनर खाता • प्रबंधन अधिकार सक्रिय' : 'सदस्य खाता') + ' • ' + verificationLabel);
        setText('profileRoleBadge', state.isOwner ? 'OWNER' : 'सदस्य');
        setText('statMalaTotal', state.mala.count || 0);
        setText('statMalaLaps', state.mala.laps || 0);
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';
      } else {
        notify('प्रोफ़ाइल पैनल नहीं मिला। पेज को रिफ्रेश करें।', 'error');
      }
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
  app.tapMalaBead = window.tapHomeMalaBead;
  app.tapHomeMalaBead = window.tapHomeMalaBead;
  app.resetMala = function () {
    state.mala.count = 0;
    saveMala();
    renderMala();
  };
  app.switchHistorySubTab = function (name) {
    const isKids = name === 'kids-corner';
    const historyPanel = byId('historySubView');
    const kidsPanel = byId('kidsSubView');
    if (historyPanel) historyPanel.classList.toggle('hidden', isKids);
    if (kidsPanel) kidsPanel.classList.toggle('hidden', !isKids);
    const historyButton = byId('sub-history-btn');
    const kidsButton = byId('sub-kids-btn');
    if (historyButton) { historyButton.classList.toggle('bg-forest', !isKids); historyButton.classList.toggle('text-white', !isKids); }
    if (kidsButton) { kidsButton.classList.toggle('bg-forest', isKids); kidsButton.classList.toggle('text-white', isKids); }
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
      modal.classList.remove('flex');
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
        const displayName = (byId('loginName')?.value || '').trim();
        const phone = (byId('registerPhone')?.value || '').trim();
        if (!displayName) return notify('पंजीकरण के लिए अपना पूरा नाम दर्ज करें।', 'error');
        if (!/^\+?[0-9\s()-]{10,16}$/.test(phone)) return notify('सही मोबाइल नंबर दर्ज करें। उदाहरण: +91 9876543210', 'error');
        const credential = await state.auth.createUserWithEmailAndPassword(email, password);
        if (credential.user && displayName) await credential.user.updateProfile({ displayName });
        await state.db.collection('users').doc(credential.user.uid).set({
          displayName, phone, phoneVerified: false, email,
          verificationStatus: 'unverified',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
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
    const phone = (byId('phoneLoginNumber')?.value || '').replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
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
    if (!/^\d{6}$/.test(code)) return notify('6 अंकों का OTP दर्ज करें।', 'error');
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
      // A popup avoids the redirect round-trip that can lose auth state in
      // browsers with strict third-party storage/privacy protections.
      await state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await state.auth.signInWithPopup(provider);
      if (result && result.user) {
        authApi.closeAuthModal();
        notify('Google sign-in successful.', 'success');
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      if (error.code === 'auth/popup-blocked') {
        notify('Google login popup was blocked. Allow popups for this website and try again.', 'error');
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        notify('Google login was cancelled. Click Google login and finish selecting your account.', 'info');
      } else {
        notify(authErrorMessage(error), 'error');
      }
    }
  };
  authApi.toggleAuthMode = function () {
    const row = byId('nameRow');
    const title = byId('authTitle');
    const toggle = byId('authToggleBtn');
    const phoneRow = byId('registerPhoneRow');
    const register = !!row && row.classList.contains('hidden');
    if (row) row.classList.toggle('hidden', !register);
    if (phoneRow) phoneRow.classList.toggle('hidden', !register);
    const phoneInput = byId('registerPhone');
    if (phoneInput) phoneInput.required = register;
    const nameInput = byId('loginName');
    if (nameInput) nameInput.required = register;
    if (title) title.textContent = register ? 'पंजीकरण (Sign Up)' : 'लॉगिन (Sign In)';
    if (toggle) toggle.textContent = register ? 'पहले से सदस्य हैं? लॉगिन करें' : 'नए सदस्य हैं? पंजीकरण करें';
  };
  authApi.saveProfile = async function () {
    if (!state.user || !state.db) return notify('पहले लॉगिन करें।', 'error');
    const name = (byId('profEditName')?.value || '').trim();
    const location = (byId('profEditLocation')?.value || '').trim();
    const phone = (byId('profEditPhone')?.value || '').trim();
    try {
      const displayName = name || state.profile?.displayName || state.user.displayName || '';
      await state.db.collection('users').doc(state.user.uid).set({
        displayName, location, phone,
        phoneVerified: state.profile?.phoneVerified === true,
        email: state.user.email || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      state.profile = { ...(state.profile || {}), displayName, location, phone };
      setText('profHeaderNameDisplay', displayName || 'मेरी प्रोफ़ाइल');
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
