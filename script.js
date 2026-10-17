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
window.BishnoiAuth = window.BishnoiAuth || {};
window.BishnoiApp = window.BishnoiApp || {};

function showEarlyHindiToast() {
  try {
    let toast = document.getElementById('earlyHindiToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'earlyHindiToast';
      toast.setAttribute('role', 'status');
      toast.textContent = 'पेज लोड हो रहा है, कृपया दोबारा दबाएँ';
      toast.style.cssText = 'position:fixed;z-index:99999;left:50%;bottom:24px;transform:translateX(-50%);max-width:90vw;padding:12px 18px;border-radius:12px;background:#143622;color:#fff;font:600 14px sans-serif';
      (document.body || document.documentElement).appendChild(toast);
    }
    toast.hidden = false;
  } catch (error) { console.error('हिंदी सूचना नहीं दिख सकी:', error); }
}

function firebaseReady() {
  return typeof firebase !== 'undefined' && !!firebase.apps && firebase.apps.length > 0;
}

function openEarlyAuthOrToast() {
  try {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.hidden = false;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    } else {
      showEarlyHindiToast();
    }
  } catch (error) {
    console.error('प्रारंभिक लॉगिन पैनल नहीं खुला:', error);
    showEarlyHindiToast();
  }
}

// The dispatcher is deliberately top-level: the early navigation wrapper and
// the later portal initializer must share the same implementation binding.
let portalSwitchTabImplementationImpl = null;
window.__tabChangeHooks = window.__tabChangeHooks || [];

function portalSwitchTabImplementation(id) {
  let result;
  if (typeof portalSwitchTabImplementationImpl === 'function') {
    result = portalSwitchTabImplementationImpl(id);
  } else {
    const raw = String(id || '').replace(/^tab-/, '');
    const aliases = { sahitya: 'library', pariksha: 'quiz' };
    const key = aliases[raw] || raw;
    const target = 'tab-' + key;
    let found = false;
    document.querySelectorAll('main [id^="tab-"]').forEach(panel => {
      const active = panel.id === target ||
        (key === 'library' && panel.id === 'tab-sahitya') ||
        (key === 'quiz' && panel.id === 'tab-pariksha');
      panel.hidden = !active;
      panel.classList.toggle('hidden', !active);
      panel.setAttribute('aria-hidden', String(!active));
      if (active) found = true;
    });
    document.querySelectorAll('[id^="bnav-"]').forEach(button => {
      const active = button.id === 'bnav-' + key ||
        (key === 'library' && button.id === 'bnav-sahitya') ||
        (key === 'quiz' && button.id === 'bnav-pariksha');
      button.classList.toggle('bnav-active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    result = found;
    if (!found) console.warn('Navigation panel not found:', target);
  }
  const raw = String(id || '').replace(/^tab-/, '');
  const aliases = { sahitya: 'library', pariksha: 'quiz' };
  const key = aliases[raw] || raw;
  (window.__tabChangeHooks || []).forEach(fn => {
    try { fn(key); } catch (error) { console.error('tab hook failed:', error); }
  });
  return result;
}

// Publish navigation immediately so existing HTML inline onclick handlers such
// as BishnoiPortal.switchTab('home') never see an undefined namespace.
(function exposeEarlyNavigation() {
  window.switchTab = function (id) {
    return portalSwitchTabImplementation(id);
  };
  window.switchPortalTab = window.switchTab;
  window.BishnoiPortal = window.BishnoiPortal || {};
  window.BishnoiPortal.switchTab = window.switchTab;
  window.Bishnoi = window.Bishnoi || window.BishnoiPortal;
  window.Bishnoi.switchTab = window.switchTab;
  window.BishnoiApp.switchTab = window.switchTab;

  // Early handlers remain useful while the full modules initialize.
  if (typeof window.BishnoiAuth.openAuthModal !== 'function') {
    window.BishnoiAuth.openAuthModal = function () {
      try {
        const modal = document.getElementById('authModal');
        if (modal) {
          modal.hidden = false;
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          modal.style.display = 'flex';
          modal.setAttribute('aria-hidden', 'false');
          return;
        }
        showEarlyHindiToast();
      } catch (error) {
        console.error('प्रारंभिक लॉगिन पैनल नहीं खुला:', error);
        showEarlyHindiToast();
      }
    };
  }
  if (typeof window.BishnoiAuth.signInWithGoogle !== 'function') {
    window.BishnoiAuth.signInWithGoogle = function earlyGoogleSignInPlaceholder() {
      openEarlyAuthOrToast();
    };
  }
  if (typeof window.BishnoiApp.openProfileOrAuth !== 'function') {
    window.BishnoiApp.openProfileOrAuth = function earlyProfilePlaceholder() {
      try {
        if (!firebaseReady()) {
          openEarlyAuthOrToast();
          return;
        }
        const loggedIn = !!firebase.auth().currentUser;
        const target = document.getElementById(loggedIn ? 'userProfileModal' : 'authModal');
        if (!target) {
          showEarlyHindiToast();
          return;
        }
        target.hidden = false;
        target.classList.remove('hidden');
        target.classList.add('flex');
        target.style.display = 'flex';
        target.setAttribute('aria-hidden', 'false');
      } catch (error) {
        console.error('प्रारंभिक प्रोफ़ाइल पैनल नहीं खुला:', error);
        showEarlyHindiToast();
      }
    };
  }
})();;

try {
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
      beforeUnload: null,
      kicked: false,
      sessionUnsubscribe: null,
      sessionId: null
    },
    settings: {},
    maintenance: { globalMode: 'off', message: '', sections: {} },
    historyItems: [],
    myResults: [],
    mala: { count: 0, laps: 0 },
    fontSize: 16,
    quizQuestions: [],
    initialized: false,
    publicNotificationsUnsubscribe: null,
    personalNotificationsUnsubscribe: null,
    notificationReadsUnsubscribe: null,
    flatNotificationsUnsubscribe: null,
    flatNotificationReadsUnsubscribe: null,
    notificationReadKeys: [],
    notifications: [],
    personalNotifications: [],
    notificationVisibleLimit: 20
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
      window.promptUserLogin();
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

  portalSwitchTabImplementationImpl = function (id) {
    const raw = String(id || '').replace(/^tab-/, '');
    const target = TAB_ALIASES[raw] || (String(id).startsWith('tab-') ? id : `tab-${raw}`);
    const restrictedTabs = new Set(['quiz', 'pariksha', 'community', 'profile']);
    if (!state.user && restrictedTabs.has(raw)) {
      // Keep navigation usable; data-changing actions still enforce requireUser().
      window.BishnoiAuth?.openAuthModal?.();
      notify('इस अनुभाग की सुविधाओं के लिए पहले लॉगिन करें।', 'error');
    }
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

    try { sessionStorage.setItem('bishnoi_active_tab_v1', raw); } catch (_) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return true;
  };

  window.BishnoiPortal = window.BishnoiPortal || {};
  window.BishnoiPortal.switchTab = window.switchTab;
  window.Bishnoi = window.Bishnoi || window.BishnoiPortal;

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
      if (state.presenceHeartbeat) {
        clearInterval(state.presenceHeartbeat);
        state.presenceHeartbeat = null;
      }
      state.user = user;
      state.profile = null;
      state.resultsIdentityVerified = false;
      initPersonalNotificationsForUser();
      initPublicNotifications();
      renderNotificationCenter();
      try {
        const savedTab = sessionStorage.getItem('bishnoi_active_tab_v1');
        if (savedTab) window.switchTab(savedTab);
      } catch (_) {}
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
        // Best-effort login presence for the Owner Studio. Firestore rules must
        // allow each authenticated user to update only their own users/{uid} document.
        try {
          const presenceRef = state.db.collection('users').doc(user.uid);
          await presenceRef.set({
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || null,
            presenceStatus: 'online',
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSeenAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          if (state.presenceHeartbeat) clearInterval(state.presenceHeartbeat);
          state.presenceHeartbeat = window.setInterval(() => {
            if (!state.user || state.user.uid !== user.uid) return;
            presenceRef.set({
              presenceStatus: 'online',
              lastSeenAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(error => console.debug('Presence heartbeat unavailable:', error.code || error.message));
          }, 60000);
        } catch (presenceError) {
          console.debug('Login presence could not be recorded; check users/{uid} Firestore rules:', presenceError.code || presenceError.message);
        }
        try {
          await loadUserProfile(user);
          restoreActiveExamForUser();
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
      window.switchTab('profile');
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

    // Start the public counter at zero and update it from actual Firestore records.
    // Each document represents a unique account that has recorded a pledge.
    subscribe(
      collection('treePledges').limit(5000),
      snap => setText('treeCounterDisplay', snap.size.toLocaleString('hi-IN')),
      'Tree pledge counter'
    );

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
      // Student results come only from the dedicated publishedResults collection.
      // Submission documents may contain answers and must not be the results API.
      subscribe(
        collection('publishedResults').where('uid', '==', state.user.uid).limit(100),
        snap => {
          state.myResults = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(row => row.status === 'published')
            .sort((a, b) => timestampMillis(b.publishedAt) - timestampMillis(a.publishedAt));
          renderMyResults();
        },
        'Published student results'
      );
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
    const storedRoll = String(record.rollNumber || '').trim();
    const roll = /^JAMBH-2026-\d{4,}$/.test(storedRoll) ? storedRoll : '';
    host.replaceChildren();
    renderProfileAdmitCard(record);
    const heading = document.createElement('strong');
    heading.textContent = 'आपका पंजीकरण: ' + statusText;
    host.appendChild(heading);
    const detail = document.createElement('p');
    detail.textContent = 'परीक्षा: ' + (record.examName || record.examTitle || 'मुख्य परीक्षा') + ' · रोल नंबर: ' + (roll || 'जारी होना बाकी');
    host.appendChild(detail);
    if (status === 'confirmed' && roll) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rounded-lg bg-forest px-4 py-2 font-bold text-white';
      button.textContent = '🎟️ प्रवेश-पत्र डाउनलोड करें';
      button.addEventListener('click', () => printStudentAdmitCard(record));
      host.appendChild(button);
      const hint = document.createElement('p');
      hint.className = 'text-stone-500';
      hint.textContent = 'प्रवेश-पत्र सीधे PDF में डाउनलोड होगा।';
      host.appendChild(hint);
    } else if (status === 'confirmed' && roll) {
      const hint = document.createElement('p');
      hint.className = 'text-amber-800';
      hint.textContent = 'आपका पंजीकरण स्वीकृत है। प्रवेश-पत्र Owner द्वारा रिलीज़ किए जाने पर यहीं उपलब्ध होगा।';
      host.appendChild(hint);
    } else if (status === 'confirmed' && !roll) {
      const hint = document.createElement('p');
      hint.className = 'text-amber-800';
      hint.textContent = 'पंजीकरण स्वीकृत है, लेकिन JAMBH-2026 रोल नंबर अभी आवंटित नहीं हुआ। कृपया व्यवस्थापक से संपर्क करें।';
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

  async function printStudentAdmitCard(record) {
    const released = record?.admitCardReleased === true ||
      (state.examConfig?.admitCardReleased === true && !record?.admitCardExamType);

    if (!released) {
      notify('प्रवेश-पत्र अभी जारी नहीं हुआ है।', 'error');
      return;
    }

    if (!state.user || !record ||
        (record.uid && record.uid !== state.user.uid)) {
      notify('अपने खाते का वैध पंजीकरण उपलब्ध नहीं है।', 'error');
      return;
    }

    if (record.verificationStatus !== 'confirmed' ||
        !/^JAMBH-2026-\d{5}$/.test(String(record.rollNumber || ''))) {
      notify('प्रवेश-पत्र के लिए स्वीकृत पंजीकरण और वैध रोल नंबर आवश्यक हैं।', 'error');
      return;
    }

    if (typeof window.html2canvas !== 'function' ||
        !(window.jspdf?.jsPDF || window.jsPDF)) {
      notify('PDF सुविधा लोड नहीं हुई। पेज रीफ्रेश करके फिर प्रयास करें।', 'error');
      return;
    }

    let surface;

    try {
      notify('प्रवेश-पत्र PDF तैयार हो रही है…', 'info');

      surface = document.createElement('div');
      surface.style.cssText =
        'position:fixed;left:-10000px;top:0;width:794px;padding:30px;background:#fffdf7;color:#143622;font-family:Arial,sans-serif;box-sizing:border-box;';

      const cfg = record.admitCardSettings || state.examConfig || {};
      const esc = escapeHtml;

      const fields = [
        ['विद्यार्थी का नाम', record.fullName || record.name ||
          state.profile?.displayName || state.user.displayName || 'विद्यार्थी'],
        ['रोल नंबर', record.rollNumber],
        ['जन्म तिथि', record.dateOfBirth || record.dob || '—'],
        ['मोबाइल नंबर', record.phone || record.mobile ||
          state.profile?.phone || '—'],
        ['परीक्षा', cfg.admitCardTitle || record.examName || 'मुख्य परीक्षा'],
        ['दिनांक / समय', [
          cfg.admitCardDate || 'आधिकारिक सूचना के अनुसार',
          cfg.admitCardTime
        ].filter(Boolean).join(' · ')],
        ['परीक्षा केंद्र', cfg.admitCardCenter || 'ऑनलाइन परीक्षा पोर्टल'],
        ['पंजीकरण ID', record.uid || state.user.uid]
      ];

      const fieldHtml = fields.map(field =>
        '<div style="border:1px solid #d9dfd8;border-radius:10px;padding:14px;min-height:52px">' +
        '<div style="font-size:12px;color:#68766b">' + esc(field[0]) + '</div>' +
        '<div style="font-size:17px;font-weight:bold;margin-top:8px;overflow-wrap:anywhere">' +
        esc(String(field[1] ?? '—')) + '</div></div>'
      ).join('');

      surface.innerHTML =
        '<article style="border:5px solid #143622;border-radius:18px;overflow:hidden">' +
        '<header style="background:#143622;color:white;padding:28px;text-align:center;border-bottom:6px solid #d6a43a">' +
        '<div style="font-size:42px">🌳</div>' +
        '<h1 style="font-size:30px;margin:8px 0">बिश्नोइज़्म डिजिटल मंच</h1>' +
        '<p style="font-size:17px;margin:0;color:#ffe8a3">परीक्षा प्रवेश-पत्र</p></header>' +
        '<main style="padding:28px"><h2 style="font-size:22px">परीक्षार्थी विवरण</h2>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:20px">' +
        fieldHtml + '</div>' +
        '<section style="margin-top:24px;padding:18px;background:#fff4cf;border:1px solid #e6ce85;border-radius:12px;line-height:1.8">' +
        '<strong>महत्वपूर्ण निर्देश</strong><p style="white-space:pre-wrap">' +
        esc(cfg.admitCardInstructions ||
          'प्रवेश-पत्र सुरक्षित रखें और निर्धारित समय पर परीक्षा में प्रवेश करें।') +
        '</p></section>' +
        '<p style="margin-top:32px;font-size:12px;text-align:center;color:#68766b">' +
        'यह प्रवेश-पत्र वेबसाइट के पंजीकरण रिकॉर्ड के आधार पर बनाया गया है।' +
        '</p></main></article>';

      document.body.appendChild(surface);

      await new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      if (document.fonts?.ready) await document.fonts.ready;

      const canvas = await window.html2canvas(surface, {
        scale: 2,
        backgroundColor: '#fffdf7',
        useCORS: true,
        logging: false
      });

      if (!canvas.width || !canvas.height) {
        throw new Error('PDF canvas खाली है।');
      }

      const JsPDF = window.jspdf?.jsPDF || window.jsPDF;
      const pdf = new JsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      const imageHeight = canvas.height * pageWidth / canvas.width;
      const image = canvas.toDataURL('image/jpeg', 0.95);

      let offset = 0;
      let page = 0;

      while (offset < imageHeight) {
        if (page > 0) pdf.addPage();

        pdf.addImage(
          image, 'JPEG',
          margin, margin - offset,
          pageWidth, imageHeight,
          undefined, 'FAST'
        );

        offset += pageHeight;
        page++;
      }

      const safeRoll = String(record.rollNumber)
        .replace(/[^A-Za-z0-9-]/g, '_');

      const blob = pdf.output('blob');

      if (!(blob instanceof Blob) || blob.size < 1000) {
        throw new Error('PDF फ़ाइल खाली है।');
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Admit-Card-' + safeRoll + '.pdf';
      anchor.style.display = 'none';

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      notify('प्रवेश-पत्र PDF डाउनलोड शुरू हुआ।', 'success');

    } catch (error) {
      console.error('Admit-card PDF generation failed:', error);
      notify('PDF नहीं बनी: ' + (error?.message || 'अज्ञात त्रुटि'), 'error');
    } finally {
      if (surface) surface.remove();
    }
  }

  function downloadStudentAdmitCard(record) {
    return printStudentAdmitCard(record);
  }

  function renderProfileAdmitCard(record) {
    const profilePanel = byId('tab-profile');
    if (!profilePanel || !record) return;

    let host = byId('profileAdmitCardHost');

    if (!host) {
      host = document.createElement('section');
      host.id = 'profileAdmitCardHost';
      host.className =
        'mx-3 my-3 rounded-xl border border-stone-200 bg-white p-4 space-y-2';
      profilePanel.appendChild(host);
    }

    host.replaceChildren();

    const released = record.admitCardReleased === true ||
      (state.examConfig?.admitCardReleased === true &&
       !record.admitCardExamType);

    const heading = document.createElement('strong');
    heading.textContent = '🎟️ प्रवेश-पत्र';

    const message = document.createElement('p');
    message.textContent = released
      ? 'आपका प्रवेश-पत्र जारी हो चुका है।'
      : 'अभी जारी नहीं हुआ।';

    host.append(heading, message);

    if (released) {
    const title = document.createElement('strong');
    title.textContent = '🎟️ प्रवेश-पत्र';
    const text = document.createElement('p');
    const hasValidRoll = record.verificationStatus === 'confirmed' && /^JAMBH-2026-\d{4,}$/.test(String(record.rollNumber || '').trim());
    const isReleased = hasValidRoll;
    text.textContent = isReleased ? 'पंजीकरण स्वीकृत है। आपका प्रवेश-पत्र PDF डाउनलोड के लिए उपलब्ध है।' : 'पंजीकरण स्वीकृत होने और JAMBH-2026 रोल नंबर आवंटित होने के बाद प्रवेश-पत्र उपलब्ध होगा।';
    host.append(title, text);
    if (hasValidRoll) {
      const button = document.createElement('button');
      button.id = 'downloadAdmitCardButton';
      button.type = 'button';
      button.className =
        'rounded-lg bg-forest px-4 py-2 font-bold text-white';
      button.textContent = '🎟️ प्रवेश-पत्र PDF डाउनलोड करें';
      button.addEventListener('click', () => printStudentAdmitCard(record));
      host.appendChild(button);
    }
  }
  window.downloadPortalAdmitCard = printStudentAdmitCard;

  window.pushNotification = async function pushNotification(uid, data = {}) {
    if (!state.db) throw new Error('Firestore उपलब्ध नहीं है।');
    const recipientUid = uid || state.user?.uid;
    if (!recipientUid) throw new Error('सूचना पाने वाला खाता निर्धारित नहीं है।');
    return state.db.collection('userNotifications').doc(recipientUid).collection('items').add({
      title: String(data.title || 'नई सूचना'),
      message: String(data.body || data.message || ''),
      type: String(data.type || 'announcement'),
      important: data.important === true,
      pinnedByOwner: data.pinnedByOwner === true,
      recipientUid, audience: 'private', active: true,
      createdBy: state.user?.uid || null, createdAt: serverTimestamp()
    });
  };

  function notificationTime(item) {
    return timestampMillis(item?.createdAt) || Number(item?.createdAtMs) || 0;
  }

  function renderNotificationCards(host, items) {
    if (!host) return;
    host.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'rounded-xl bg-white p-4 text-xs text-stone-500';
      empty.textContent = 'अभी कोई नई सूचना नहीं है।';
      host.appendChild(empty);
      return;
    }
    items.forEach(item => {
      const card = document.createElement('article');
      card.className = item._isRead
        ? 'rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2 opacity-70'
        : 'rounded-xl border border-amber-200 bg-white p-3 space-y-2';
      const title = document.createElement('h3');
      title.className = 'font-bold text-forest text-sm';
      title.textContent = ((item.pinnedByOwner || item.important) ? '📌 ' : '') + (item.title || 'नई सूचना');
      const body = document.createElement('p');
      body.className = 'text-xs leading-relaxed text-stone-700 whitespace-pre-wrap';
      body.textContent = item.message || '';
      card.append(title, body);
      if ((item.fileUrl || item.filePath) && item.fileType?.startsWith('image/')) {
        const image = document.createElement('img');
        if (item.fileUrl) image.src = item.fileUrl;
        else if (item.filePath && state.storage && state.user) {
          state.storage.ref().child(item.filePath).getDownloadURL()
            .then(url => { if (state.user && image.isConnected) image.src = url; })
            .catch(error => console.warn('Private notification image unavailable; check Storage rules.', error));
        }
        image.alt = item.fileName || item.title || 'सूचना फोटो';
        image.loading = 'lazy';
        image.className = 'max-h-64 w-full rounded-lg border border-stone-200 object-contain bg-stone-50';
        card.appendChild(image);
      }
      if (item.fileUrl || item.filePath) {
        const link = document.createElement('a');
        link.href = item.fileUrl || '#';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'inline-flex rounded-lg bg-forest px-3 py-2 text-xs font-bold text-white';
        link.textContent = item.fileType === 'application/pdf' ? '📄 PDF खोलें / डाउनलोड करें' : item.fileName ? '📎 संलग्न फ़ाइल खोलें' : '📎 फ़ाइल खोलें';
        if (item.filePath && !item.fileUrl) {
          link.addEventListener('click', async event => {
            event.preventDefault();
            try {
              if (!state.user || !state.storage) throw new Error('लॉगिन/Storage उपलब्ध नहीं है।');
              const url = await state.storage.ref().child(item.filePath).getDownloadURL();
              window.open(url, '_blank', 'noopener,noreferrer');
            } catch (error) {
              notify('फ़ाइल नहीं खुली। Storage rules और लॉगिन जाँचें।', 'error');
              console.warn('Private notification file unavailable:', error);
            }
          });
        }
        card.appendChild(link);
      }
      if (item.type === 'admit-card' || item.type === 'exam-result' || item.type === 'quiz-result') {
        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900';
        action.textContent = item.type === 'admit-card'
          ? '🎟️ प्रवेश-पत्र PDF डाउनलोड करें'
          : '📊 परिणाम देखें';

        action.addEventListener('click', async () => {
          if (item.type === 'admit-card') {
            try {
              if (!state.user || !state.db) {
                throw new Error('पहले लॉगिन करें।');
              }

              const snap = await state.db
                .collection('examEnrolledStudents')
                .doc(state.user.uid)
                .get();

              if (!snap.exists) {
                throw new Error('आपका नामांकन रिकॉर्ड नहीं मिला।');
              }

              setVisible('notificationPopup', false);
              setVisible('publicNotificationsSection', false);

              await printStudentAdmitCard({
                uid: state.user.uid,
                ...snap.data()
              });
            } catch (error) {
              notify(
                'प्रवेश-पत्र डाउनलोड नहीं हुआ: ' + error.message,
                'error'
              );
            }
            return;
          }

          // Keep the existing result-viewing logic here.
          setVisible('notificationPopup', false);
          if (item.type === 'admit-card') {
            try {
              if (!state.user || !state.db) throw new Error('पहले विद्यार्थी खाते में लॉगिन करें।');
              const snap = await state.db.collection('examEnrolledStudents').doc(state.user.uid).get();
              if (!snap.exists) throw new Error('आपका पंजीकरण रिकॉर्ड नहीं मिला।');
              await downloadStudentAdmitCard(snap.data());
            } catch (error) {
              notify('प्रवेश-पत्र डाउनलोड नहीं हुआ: ' + (error?.message || error), 'error');
            }
            return;
          }
          setVisible('publicNotificationsSection', false);
          window.switchTab('quiz');
          window.setTimeout(() => byId('myResultsPanel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
        });
        card.appendChild(action);
      }
      if (item.createdAt && typeof item.createdAt.toDate === 'function') {
        const time = document.createElement('p');
        time.className = 'text-[10px] text-stone-400';
        time.textContent = item.createdAt.toDate().toLocaleString('hi-IN');
        card.appendChild(time);
      }
      if (item._key && !item._isRead) {
        const readButton = document.createElement('button');
        readButton.type = 'button';
        readButton.className = 'rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-700';
        readButton.textContent = '✓ पढ़ लिया';
        readButton.addEventListener('click', () => markNotificationsRead([item]));
        card.appendChild(readButton);
      } else if (item._isRead) {
        const readLabel = document.createElement('p');
        readLabel.className = 'text-[10px] font-semibold text-stone-500';
        readLabel.textContent = '✓ पढ़ा गया';
        card.appendChild(readLabel);
      }
      host.appendChild(card);
    });
  }

  function renderNotificationCenter() {
    const bell = byId('notificationBellButton');
    const section = byId('publicNotificationsSection');
    const popup = byId('notificationPopup');
    const list = byId('publicNotificationsList');
    const popupList = byId('notificationPopupList');
    if (!state.user) {
      setVisible('notificationBellButton', false);
      setVisible('publicNotificationsSection', false);
      setVisible('notificationPopup', false);
      if (list) list.replaceChildren();
      if (popupList) popupList.replaceChildren();
      return;
    }

    setVisible('notificationBellButton', true);
    const globalItems = (state.notifications || [])
      .filter(item => item.active === true && (item.audience === 'all' || !item.audience))
      .map(item => ({ ...item, _key: 'global:' + item.id }));
    const personalItems = (state.personalNotifications || [])
      .filter(item => item.active !== false)
      .map(item => ({ ...item, _key: 'private:' + item.id }));
    const flatItems = (state.flatNotifications || []).filter(item => item.uid === 'ALL' || item.uid === state.user.uid).map(item => ({ ...item, message: item.body || item.message || '', _key: 'flat:' + item.id, _flat: true }));
    const items = [...personalItems, ...flatItems, ...globalItems].sort((a, b) => Number(!!(b.pinnedByOwner || b.important)) - Number(!!(a.pinnedByOwner || a.important)) || notificationTime(b) - notificationTime(a));
    const seenKey = 'bishnoi_seen_notifications_v2_' + state.user.uid;
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch (_) { seen = []; }
    if (!Array.isArray(seen)) seen = [];
    seen = [...new Set([...seen, ...(state.notificationReadKeys || [])])];
    const unseen = items.filter(item => !seen.includes(item._key));
    const badge = byId('notificationUnreadCount');
    if (badge) {
      badge.textContent = unseen.length > 99 ? '99+' : String(unseen.length);
      setVisible('notificationUnreadCount', unseen.length > 0);
    }
    // No repeated reminder popup or bell animation: the badge alone shows unread count.
    if (bell) bell.classList.remove('animate-bounce', 'notification-bell-arrival');
    if (popup) setVisible('notificationPopup', false);
    if (popupList) popupList.replaceChildren();
    // Keep read notifications as history, dimmed; badge count remains unread-only.
    const visibleLimit = state.notificationVisibleLimit || 20;

    renderNotificationCards(
      list,
      items.slice(0, visibleLimit).map(item => ({
        ...item,
        _isRead: seen.includes(item._key)
      }))
    );

    let moreButton = byId('loadMoreNotifications');

    if (!moreButton) {
      moreButton = document.createElement('button');
      moreButton.id = 'loadMoreNotifications';
      moreButton.type = 'button';
      moreButton.className =
        'mt-3 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-xs font-bold text-forest';
      moreButton.textContent = 'और दिखाएँ';

      moreButton.addEventListener('click', () => {
        state.notificationVisibleLimit =
          (state.notificationVisibleLimit || 20) + 20;
        renderNotificationCenter();
      });

      if (list) {
        list.insertAdjacentElement('afterend', moreButton);
      }
    }

       if (moreButton) {
      moreButton.hidden = items.length <= visibleLimit;
      moreButton.textContent =
        'और दिखाएँ (' + Math.max(0, items.length - visibleLimit) + ' बाकी)';
    }

    let readAll = byId('markAllNotificationsRead');
    if (section && !readAll) {
      readAll = document.createElement('button');
      readAll.id = 'markAllNotificationsRead';
      readAll.type = 'button';
      readAll.className = 'mb-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900';
      readAll.textContent = '✓ सभी सूचनाएँ पढ़ी हुई चिह्नित करें';
      readAll.addEventListener('click', () => {
        const current = [
          ...(state.personalNotifications || []).filter(item => item.active !== false).map(item => ({ ...item, _key: 'private:' + item.id })),
          ...(state.flatNotifications || []).filter(item => item.uid === 'ALL' || item.uid === state.user.uid).map(item => ({ ...item, _key: 'flat:' + item.id, _flat: true })),
          ...(state.notifications || []).filter(item => item.active === true && (item.audience === 'all' || !item.audience)).map(item => ({ ...item, _key: 'global:' + item.id }))
        ];
        markNotificationsRead(current);
      });
      section.insertBefore(readAll, list || section.firstChild);
    }
    if (readAll) setVisible(readAll.id, unseen.length > 0);
  }

  function markNotificationsRead(itemsToMark) {
    if (!state.user) return;
    const uid = state.user.uid, key = 'bishnoi_seen_notifications_v2_' + uid;
    const selected = (itemsToMark || []).filter(item => item && item._key);
    const keysToMark = selected.map(item => item._key);
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
    if (!Array.isArray(seen)) seen = [];
    const merged = [...new Set([
      ...seen,
      ...(state.notificationReadKeys || []),
      ...keysToMark
    ])];

    try {
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (_) {}

    // Persist read state to Firestore so it follows the signed-in student across devices.
    if (state.db && keysToMark.length) {
      const batch = state.db.batch();
      selected.forEach(item => {
        if (item._flat) batch.set(state.db.collection('notificationReads').doc(uid + '_' + item.id), { uid, notificationId: item.id, read: true, readAt: serverTimestamp() }, { merge: true });
        else batch.set(state.db.collection('userNotificationReads').doc(uid).collection('items').doc(item._key.replace(/[^A-Za-z0-9_-]/g, '_')), { key: item._key, readAt: serverTimestamp() }, { merge: true });
      });
      batch.commit().catch(error => { console.error('Notification read-marker sync failed:', error.code || error.message, error); notify('पढ़ी हुई स्थिति सिंक नहीं हुई (' + (error.code || 'unknown') + ')।', 'error'); });
    }
    state.notificationReadKeys = [...new Set([...(state.notificationReadKeys || []), ...keysToMark])];
    renderNotificationCenter();
  }

  window.toggleNotificationPanel = function (forceOpen) {
    if (!state.user) {
      window.BishnoiAuth?.openAuthModal?.();
      return;
    }
    const section = byId('publicNotificationsSection');
    if (!section) return;
    const shouldOpen = typeof forceOpen === 'boolean'
      ? forceOpen
      : section.hidden || section.classList.contains('hidden');
    setVisible('publicNotificationsSection', shouldOpen);
    // Opening the center does not silently mark messages read; use Mark all as read.
  };

  // Compatibility handler only: closing the legacy dialog must not mark messages read.
  window.dismissNotificationPopup = function () {
    setVisible('notificationPopup', false);
  };

  function initPersonalNotificationsForUser() {
    if (state.personalNotificationsUnsubscribe) {
      state.personalNotificationsUnsubscribe();
      state.personalNotificationsUnsubscribe = null;
    }
    if (state.notificationReadsUnsubscribe) {
      state.notificationReadsUnsubscribe();
      state.notificationReadsUnsubscribe = null;
    }
    if (state.flatNotificationsUnsubscribe) { state.flatNotificationsUnsubscribe(); state.flatNotificationsUnsubscribe = null; }
    if (state.flatNotificationReadsUnsubscribe) { state.flatNotificationReadsUnsubscribe(); state.flatNotificationReadsUnsubscribe = null; }
    state.personalNotifications = []; state.flatNotifications = []; state.notificationReadKeys = [];
    if (!state.user || !state.db) { renderNotificationCenter(); return; }
    const uid = state.user.uid;
    state.notificationReadsUnsubscribe = state.db.collection('userNotificationReads').doc(uid).collection('items').onSnapshot(snapshot => {
      if (state.user?.uid !== uid) return;
      const legacyKeys = snapshot.docs.map(doc => doc.data()?.key).filter(Boolean);
      state.notificationReadKeys = [...new Set([...(state.notificationReadKeys || []).filter(k => k.startsWith('flat:')), ...legacyKeys])];
      renderNotificationCenter();
    }, error => console.error('Legacy notification read-marker listener failed:', error.code || error.message, error));
    state.flatNotificationReadsUnsubscribe = state.db.collection('notificationReads').where('uid', '==', uid).onSnapshot(snapshot => {
      if (state.user?.uid !== uid) return;
      const flatKeys = snapshot.docs.filter(doc => doc.data()?.read === true).map(doc => 'flat:' + doc.data().notificationId);
      state.notificationReadKeys = [...new Set([...(state.notificationReadKeys || []).filter(k => !k.startsWith('flat:')), ...flatKeys])];
      renderNotificationCenter();
    }, error => console.error('Flat notification read-marker listener failed:', error.code || error.message, error));
    state.personalNotificationsUnsubscribe = state.db.collection('userNotifications').doc(uid).collection('items').onSnapshot(snapshot => {
      if (state.user?.uid !== uid) return;
      state.personalNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _scope: 'private' }));
      renderNotificationCenter();
    }, error => { console.error('Legacy private notification listener failed:', error.code || error.message, error); state.personalNotifications = []; renderNotificationCenter(); });
    state.flatNotificationsUnsubscribe = state.db.collection('userNotifications').where('uid', 'in', [uid, 'ALL']).onSnapshot(snapshot => {
      if (state.user?.uid !== uid) return;
      state.flatNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _scope: 'flat' }));
      renderNotificationCenter();
    }, error => { console.error('Flat notification listener failed:', error.code || error.message, error); notify('सूचनाएँ लोड नहीं हुईं (' + (error.code || 'unknown') + ')।', 'error'); });
  }

  function initPublicNotifications() {
    if (!state.db || state.publicNotificationsUnsubscribe) return;
    state.publicNotificationsUnsubscribe = state.db.collection('notifications')
      .onSnapshot(snapshot => {
        state.notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _scope: 'global' }));
        renderNotificationCenter();
      }, error => {
        console.warn('Notifications could not load:', error);
        state.notifications = [];
        renderNotificationCenter();
      });
    state.unsubscribers.push(() => {
      if (state.publicNotificationsUnsubscribe) state.publicNotificationsUnsubscribe();
      state.publicNotificationsUnsubscribe = null;
      if (state.personalNotificationsUnsubscribe) state.personalNotificationsUnsubscribe();
      state.personalNotificationsUnsubscribe = null;
      if (state.flatNotificationsUnsubscribe) state.flatNotificationsUnsubscribe();
      state.flatNotificationsUnsubscribe = null;
      if (state.flatNotificationReadsUnsubscribe) state.flatNotificationReadsUnsubscribe();
      state.flatNotificationReadsUnsubscribe = null;
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
        const dateOfBirth = (byId('enrollmentDob')?.value || '').trim();
        const examName = (byId('enrollmentExam')?.value || 'मुख्य परीक्षा').trim();
        const location = (byId('enrollmentLocation')?.value || '').trim();
        if (fullName.length < 2 || !/^[+()\d\s-]{10,20}$/.test(phone) || !dateOfBirth || new Date(dateOfBirth).getTime() > Date.now()) {
          if (status) status.textContent = 'कृपया सही पूरा नाम और मोबाइल नंबर दर्ज करें।';
          return;
        }
        if (button) button.disabled = true;
        if (status) status.textContent = 'पंजीकरण सहेजा जा रहा है…';
        try {
          const ref = state.db.collection('examEnrolledStudents').doc(state.user.uid);
          const existing = await ref.get();
          const old = existing.exists ? existing.data() : {};
          // Students may edit only their own enrollment details. Roll numbers and
          // approval state are assigned by an owner and must never be client-controlled.
          const editable = {
            uid: state.user.uid,
            fullName,
            name: fullName,
            phone,
            dateOfBirth,
            examName,
            location,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          if (state.user.email) editable.email = state.user.email;
          if (!existing.exists) {
            await ref.set({
              ...editable,
              verificationStatus: 'pending',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          } else {
            await ref.update(editable);
          }
          if (status) status.textContent = 'पंजीकरण सहेज दिया गया है। रोल नंबर Owner की स्वीकृति के बाद जारी होगा।';
          await refreshEnrollmentStatus();
          notify('परीक्षा पंजीकरण सहेज दिया गया।', 'success');
        } catch (error) {
          console.error('Enrollment submit failed:', error);
          if (status) status.textContent = 'पंजीकरण सहेजा नहीं जा सका: ' + (error?.code || error?.message || 'अज्ञात Firestore त्रुटि') + '। Firestore Rules और आवश्यक फ़ील्ड जाँचें।';
          notify('पंजीकरण सहेजा नहीं जा सका: ' + (error?.code || error?.message || 'अज्ञात Firestore त्रुटि'), 'error');
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
      host.innerHTML = '<p class="text-xs text-stone-500">आपके लिए परिणाम प्रकाशित होने पर वे यहाँ दिखाई देंगे। जाँच के दौरान अंक इस सूची में उपलब्ध नहीं होंगे।</p>';
      return;
    }
    const modeNames = { quiz: 'दैनिक ज्ञान परीक्षा', mock1: 'Mock Exam 1', mock2: 'Mock Exam 2', main: 'Main Exam' };
    host.innerHTML = rows.map(row => {
      const score = row.score;
      const scoreVisible = row.mode === 'quiz' || state.resultsIdentityVerified === true;
      const scoreText = scoreVisible
        ? 'अंतिम अंक: ' + escapeHtml(score ?? '—') + '/' + escapeHtml(row.total ?? '—')
        : 'अंक देखने के लिए ऊपर रोल नंबर, पूरा नाम और जन्म तिथि सत्यापित करें।';
      const feedback = scoreVisible && row.feedback
        ? '<p class="text-[11px] text-stone-600">टिप्पणी: ' + escapeHtml(row.feedback) + '</p>'
        : '';
      const publishedAt = row.publishedAt?.toDate ? row.publishedAt.toDate().toLocaleString('hi-IN') : '';
      return '<article class="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-1"><div class="flex items-center justify-between gap-2"><strong class="text-xs text-forest">' + escapeHtml(modeNames[row.mode] || row.mode || 'परीक्षा') + '</strong><span class="text-[10px] font-bold text-emerald-700">परिणाम घोषित</span></div><p class="text-[11px] text-stone-600">' + scoreText + '</p>' + feedback + '<p class="text-[10px] text-stone-400">' + escapeHtml(row.rollNumber ? 'रोल नंबर: ' + row.rollNumber + ' · ' : '') + escapeHtml(publishedAt) + '</p></article>';
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
      window.renderShabadCards(rows);
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
  const ACTIVE_EXAM_STORAGE_KEY = 'bishnoi_active_exam_v1';

  function persistActiveExam() {
    const exam = state.exam;
    if (!state.user || !exam?.active || exam.submitted) return;
    try {
      sessionStorage.setItem(ACTIVE_EXAM_STORAGE_KEY, JSON.stringify({
        uid: state.user.uid,
        mode: exam.mode,
        questions: exam.questions,
        index: exam.index,
        answers: exam.answers,
        review: exam.review,
        endAt: exam.endAt,
        durationMinutes: exam.durationMinutes,
        tabSwitches: exam.tabSwitches || 0,
        kicked: exam.kicked === true
      }));
    } catch (error) {
      console.warn('Active exam progress could not be stored in this tab.', error);
    }
  }

  function clearPersistedExam() {
    try { sessionStorage.removeItem(ACTIVE_EXAM_STORAGE_KEY); } catch (_) {}
  }

  function restoreActiveExamForUser() {
    if (!state.user) return;
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem(ACTIVE_EXAM_STORAGE_KEY) || 'null'); } catch (_) { saved = null; }
    if (!saved) return;
    if (saved.uid !== state.user.uid) {
      clearPersistedExam();
      return;
    }
    if (!saved.mode || !Array.isArray(saved.questions) || !saved.questions.length || !Number(saved.endAt)) {
      clearPersistedExam();
      return;
    }

    stopExamResources();
    state.exam = {
      active: true,
      mode: saved.mode,
      questions: saved.questions,
      index: Math.max(0, Math.min(Number(saved.index) || 0, saved.questions.length - 1)),
      answers: saved.answers && typeof saved.answers === 'object' ? saved.answers : {},
      review: saved.review && typeof saved.review === 'object' ? saved.review : {},
      endAt: Number(saved.endAt),
      durationMinutes: Math.max(1, Number(saved.durationMinutes) || CONFIG.defaultExamMinutes),
      timer: null,
      tabSwitches: Math.max(0, Number(saved.tabSwitches) || 0),
      submitted: false,
      stream: null,
      proctorTimer: null,
      beforeUnload: null,
      kicked: saved.kicked === true,
      sessionUnsubscribe: null,
      sessionId: null
    };

    ensureExamWorkspace(state.exam.mode);
    attachExamSessionListener();
    setVisible('portalExamWorkspace', true);
    ['enrollmentSection', 'myResultsPanel', 'dailyQuizSection', 'mockHub', 'mainExamSection']
      .forEach(id => setVisible(id, false));
    setVisible('previousQuestionBtn', true);
    setVisible('nextQuestionBtn', true);
    setVisible('submitExamBtn', true);
    setText('examResult', 'आपकी पिछली परीक्षा उसी प्रश्न और सुरक्षित किए गए उत्तरों से फिर शुरू की गई है।');
    window.switchTab('quiz');
    renderExamQuestion();

    state.exam.timer = setInterval(() => {
      const remaining = Math.ceil((state.exam.endAt - Date.now()) / 1000);
      setText('examTimer', formatTime(remaining));
      persistActiveExam();
      if (remaining <= 0 && Date.now() >= (state.exam.nextSubmissionRetryAt || 0)) window.submitPortalExam(true);
    }, 1000);
    state.exam.beforeUnload = event => {
      if (!state.exam.active || state.exam.submitted) return;
      persistActiveExam();
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', state.exam.beforeUnload);
    state.exam.visibilityHandler = () => {
      if (!state.exam.active || document.visibilityState !== 'hidden') return;
      state.exam.tabSwitches = (state.exam.tabSwitches || 0) + 1;
      persistActiveExam();
      notify('परीक्षा टैब बदला गया: ' + state.exam.tabSwitches + '/' + CONFIG.maxTabSwitches, 'error');
      if (state.exam.tabSwitches >= CONFIG.maxTabSwitches) {
        notify('टैब बदलने की सीमा पूरी हुई। उत्तर सुरक्षित हैं; दोबारा प्रवेश के लिए व्यवस्थापक से संपर्क करें।', 'error');
        state.exam.active = false;
        updateExamSession('kicked', { kickedAt: serverTimestamp(), reason: 'tab_switch_limit' });
        stopExamResources();
        setText('examResult', 'परीक्षा अस्थायी रूप से लॉक की गई है। आपके उत्तर इसी टैब में सुरक्षित हैं; व्यवस्थापक से अनुमति लें।');
        setVisible('submitExamBtn', false);
        setVisible('nextQuestionBtn', false);
        setVisible('previousQuestionBtn', false);
        setVisible('exitExamWorkspace', true);
      }
    };
    document.addEventListener('visibilitychange', state.exam.visibilityHandler);
    if (state.exam.kicked) setText('examResult', 'परीक्षा अस्थायी रूप से लॉक है। Owner से पुनः प्रवेश की अनुमति की प्रतीक्षा करें।');
    if (state.exam.endAt <= Date.now()) window.submitPortalExam(true);
    else notify('आपकी परीक्षा पिछली स्थिति से फिर शुरू हुई है।', 'success');
  }

  function examSessionDocumentRef() {
    const exam = state.exam;
    if (!state.user || !exam?.mode) return null;
    const id = state.user.uid + '_' + exam.mode;
    exam.sessionId = id;
    return collection('examSessions').doc(id);
  }

  function updateExamSession(status, extra = {}) {
    const ref = examSessionDocumentRef();
    if (!ref || !state.user) return Promise.resolve();
    const exam = state.exam;
    return ref.set({
      uid: state.user.uid,
      name: state.profile?.displayName || state.user.displayName || state.user.email || 'विद्यार्थी',
      mode: exam.mode,
      status,
      currentQuestion: Number(exam.index || 0) + 1,
      totalQuestions: exam.questions?.length || 0,
      tabSwitches: Number(exam.tabSwitches || 0),
      endAtMs: Number(exam.endAt || 0),
      endAt: Number(exam.endAt) > 0 ? firebase.firestore.Timestamp.fromMillis(Number(exam.endAt)) : null,
      updatedAt: serverTimestamp(),
      ...extra
    }, { merge: true }).catch(error => {
      console.warn('Exam session status could not be saved. Check examSessions rules.', error);
    });
  }

  function attachExamSessionListener() {
    const ref = examSessionDocumentRef();
    if (!ref) return;
    if (state.exam.sessionUnsubscribe) state.exam.sessionUnsubscribe();
    state.exam.sessionUnsubscribe = ref.onSnapshot(snapshot => {
      if (!snapshot.exists || !state.exam.active || state.exam.submitted) return;
      const sessionData = snapshot.data() || {};
      const status = sessionData.status;
      if (status === 'kicked' && !state.exam.kicked) {
        state.exam.kicked = true;
        persistActiveExam();
        renderExamQuestion();
        setText('examResult', 'बार-बार टैब बदलने के कारण परीक्षा अस्थायी रूप से लॉक है। उत्तर सुरक्षित हैं; Owner पुनः प्रवेश दे सकता है।');
      } else if (
        status === 'active' &&
        state.exam.kicked &&
        sessionData.reentryGrantedAt &&
        timestampMillis(sessionData.reentryGrantedAt) > timestampMillis(sessionData.reentryGrantConsumedAt)
      ) {
        state.exam.kicked = false;
        persistActiveExam();
        renderExamQuestion();
        setText('examResult', 'Owner ने पुनः प्रवेश की अनुमति दे दी है। जारी रखें।');
        notify('परीक्षा में पुनः प्रवेश की अनुमति मिल गई।', 'success');
        updateExamSession('active', { reentryGrantConsumedAt: serverTimestamp() });
      } else if (status === 'denied' && state.exam.kicked) {
        setText('examResult', 'Owner ने पुनः प्रवेश की अनुमति नहीं दी है। समय पूरा होने पर ही प्रयास जमा होगा।');
      }
    }, error => console.warn('Exam session listener failed:', error));
  }

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
    if (exam.sessionUnsubscribe) {
      exam.sessionUnsubscribe();
      exam.sessionUnsubscribe = null;
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

  function ensureExamWorkspace(mode) {
    const tab = byId('tab-quiz');
    if (!tab) throw new Error('परीक्षा स्क्रीन नहीं मिली (tab-quiz).');

    let workspace = byId('portalExamWorkspace');
    if (!workspace) {
      workspace = document.createElement('section');
      workspace.id = 'portalExamWorkspace';
      workspace.className = 'hidden rounded-3xl border border-emerald-200 bg-white p-4 sm:p-6 shadow-lg space-y-4';
      workspace.hidden = true;
      workspace.setAttribute('role', 'region');
      workspace.setAttribute('aria-label', 'परीक्षा प्रश्न-पत्र');
      workspace.innerHTML = `
        <div class="flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
          <div class="min-w-0">
            <p class="text-[10px] uppercase tracking-widest font-extrabold text-emerald-800">EXAM IN PROGRESS</p>
            <h2 id="portalExamTitle" class="font-yatra text-xl sm:text-2xl text-forest">परीक्षा</h2>
            <p id="examQuestionNumber" class="mt-1 text-xs font-semibold text-stone-500" aria-live="polite">प्रश्न 0/0</p>
          </div>
          <div class="shrink-0 rounded-xl bg-forest px-3 py-2 text-center text-white">
            <span class="block text-[9px] uppercase tracking-wide text-emerald-100">शेष समय</span>
            <strong id="examTimer" class="font-mono text-lg">--:--</strong>
          </div>
        </div>
        <div id="examQuestion" class="space-y-4 text-sm text-stone-800"></div>
        <p id="examResult" class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-semibold text-emerald-900" role="status" aria-live="polite"></p>
        <div class="grid grid-cols-2 gap-2">
          <button id="previousQuestionBtn" type="button" class="rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-700">← पिछला प्रश्न</button>
          <button id="nextQuestionBtn" type="button" class="rounded-xl bg-forest px-4 py-3 text-sm font-bold text-white">अगला प्रश्न →</button>
        </div>
        <button id="submitExamBtn" type="button" class="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-stone-950">उत्तर जमा करें</button>
        <button id="exitExamWorkspace" type="button" class="hidden w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-bold text-stone-700">परीक्षा सूची पर वापस जाएँ</button>
      `;

      const anchor = byId('enrollmentSection') || byId('dailyQuizSection') || tab.firstElementChild;
      if (anchor) tab.insertBefore(workspace, anchor);
      else tab.appendChild(workspace);

      byId('previousQuestionBtn').addEventListener('click', () => window.previousExamQuestion());
      byId('nextQuestionBtn').addEventListener('click', () => window.nextExamQuestion());
      byId('submitExamBtn').addEventListener('click', () => window.submitPortalExam(false));
      byId('exitExamWorkspace').addEventListener('click', () => {
        setVisible('portalExamWorkspace', false);
        renderExamVisibility();
        window.switchTab('quiz');
      });
    }

    const labels = {
      quiz: 'दैनिक ज्ञान परीक्षा',
      mock1: 'मॉक परीक्षा 1',
      mock2: 'मॉक परीक्षा 2',
      main: 'मुख्य परीक्षा'
    };
    setText('portalExamTitle', labels[mode] || 'परीक्षा');
    setText('examResult', '');
    setVisible('exitExamWorkspace', false);
    return workspace;
  }

  function renderExamQuestion() {
    const exam = state.exam;
    const question = exam.questions[exam.index];
    const workspace = ensureExamWorkspace(exam.mode);
    const host = byId('examQuestion');

    if (!host || !question) return;

    const options = Array.isArray(question.options)
      ? question.options
      : Array.isArray(question.opts)
        ? question.opts
        : [question.optionA, question.optionB, question.optionC, question.optionD].filter(value => value !== undefined && value !== null && value !== '');

    const answerKey = question.id || exam.index;
    const selectedAnswer = exam.answers[answerKey];

    host.innerHTML = `
      <article class="space-y-4">
        <h3 class="text-base sm:text-lg font-bold leading-relaxed text-stone-900">${exam.index + 1}. ${escapeHtml(question.question || question.text || question.q || question.title || 'प्रश्न')}</h3>
        ${options.length ? `
          <div class="space-y-2">
            ${options.map((option, index) => `
              <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 hover:border-emerald-500 hover:bg-emerald-50">
                <input class="mt-1 shrink-0 accent-emerald-800" type="radio" name="examAnswer" value="${index}" ${String(selectedAnswer) === String(index) ? 'checked' : ''} ${(exam.kicked || exam.lockedAtDeadline) ? 'disabled' : ''}>
                <span>${escapeHtml(typeof option === 'object' ? (option.text || option.label || option.value || JSON.stringify(option)) : option)}</span>
              </label>
            `).join('')}
          </div>
        ` : '<p class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">इस प्रश्न में विकल्प नहीं मिले। Owner Studio में प्रश्न के options की जाँच करें।</p>'}
      </article>
    `;

    host.querySelectorAll('input[name="examAnswer"]').forEach(input => {
      input.addEventListener('change', () => {
        exam.answers[answerKey] = Number(input.value);
        persistActiveExam();
      });
    });

    setText('examQuestionNumber', `प्रश्न ${exam.index + 1}/${exam.questions.length}`);
    const previous = byId('previousQuestionBtn');
    const next = byId('nextQuestionBtn');
    if (previous) previous.disabled = exam.kicked || exam.lockedAtDeadline || exam.index <= 0;
    if (next) next.disabled = exam.kicked || exam.lockedAtDeadline || exam.index >= exam.questions.length - 1;
    const submitButton = byId('submitExamBtn');
    if (submitButton) submitButton.disabled = exam.kicked || exam.lockedAtDeadline;
    if (previous) previous.classList.toggle('opacity-40', previous.disabled);
    if (next) next.classList.toggle('opacity-40', next.disabled);
    if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.startPortalExam = async function (mode = 'quiz') {
    if (!requireUser()) return;

    // Every exam mode requires an existing, owner-confirmed enrollment.
    // Firestore Rules must enforce the same check to prevent direct API bypasses.
    if (['quiz', 'mock1', 'mock2', 'main'].includes(mode)) {
      try {
        const enrollmentSnap = await collection('examEnrolledStudents').doc(state.user.uid).get();
        const enrollment = enrollmentSnap.exists ? enrollmentSnap.data() || {} : null;
        if (!enrollment || enrollment.verificationStatus !== 'confirmed') {
          notify('क्विज़/मॉक/मुख्य परीक्षा देने के लिए पहले पंजीकरण कराएँ और Owner से पुष्टि करवाएँ।', 'error');
          window.switchTab('quiz');
          const enrollmentSection = byId('enrollmentSection');
          if (enrollmentSection) enrollmentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      } catch (eligibilityError) {
        console.error('Exam eligibility check failed:', eligibilityError);
        notify('पंजीकरण की पुष्टि नहीं हो सकी। कृपया दोबारा प्रयास करें।', 'error');
        return;
      }
    }

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
    if (!scheduledStart) {
      notify('इस परीक्षा का आधिकारिक शुरू होने का समय Owner Studio में सेट नहीं है।', 'error');
      return;
    }
    if (Date.now() < scheduledStart) {
      const startText = new Date(scheduledStart).toLocaleString('hi-IN', { dateStyle: 'medium', timeStyle: 'short' });
      notify(`यह परीक्षा ${startText} पर शुरू होगी। काउंटडाउन पूरा होने तक प्रवेश बंद है।`, 'error');
      window.switchTab('quiz');
      renderExamCountdowns();
      return;
    }

    const durationMinutes = Math.max(1, Number(state.examConfig?.durationMinutes) || CONFIG.defaultExamMinutes);
    const scheduledEndAt = scheduledStart + durationMinutes * 60 * 1000;
    let lateEntryGranted = false;
    let ownerGrantedEndAt = null;
    if (Date.now() >= scheduledEndAt) {
      const sessionRef = collection('examSessions').doc(state.user.uid + '_' + mode);
      try {
        const sessionSnap = await sessionRef.get();
        const session = sessionSnap.exists ? sessionSnap.data() || {} : {};
        if (session.lateEntryRequested && session.status === 'denied') {
          notify('Owner ने देर से प्रवेश का अनुरोध अस्वीकार कर दिया है।', 'error');
          return;
        }
        ownerGrantedEndAt = timestampMillis(session.endAt) || Number(session.endAtMs) || null;
        lateEntryGranted = session.status === 'active' &&
          session.lateEntryRequested === true &&
          !!session.reentryGrantedAt &&
          !!ownerGrantedEndAt &&
          ownerGrantedEndAt > Date.now();
        if (!lateEntryGranted) {
          await sessionRef.set({
            uid: state.user.uid,
            name: state.profile?.displayName || state.user.displayName || state.user.email || 'विद्यार्थी',
            mode,
            status: 'late_request',
            lateEntryRequested: true,
            requestedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            endAtMs: scheduledEndAt
          }, { merge: true });
          notify('परीक्षा का निर्धारित समय निकल गया है। देर से प्रवेश का अनुरोध Owner को भेज दिया गया है; अनुमति मिलने पर फिर से शुरू करें।', 'error');
          return;
        }
      } catch (lateError) {
        console.error('Late-entry request failed:', lateError);
        notify('देर से प्रवेश का अनुरोध नहीं भेजा जा सका। Firestore examSessions rules जाँचें।', 'error');
        return;
      }
    }
    if (typeof window.pushNotification === 'function') {
      window.pushNotification(state.user.uid, {
        title: 'परीक्षा शुरू हुई',
        body: 'आपने ' + ({ quiz: 'दैनिक ज्ञान क्विज़', mock1: 'मॉक परीक्षा 1', mock2: 'मॉक परीक्षा 2', main: 'मुख्य परीक्षा' }[mode] || mode) + ' शुरू की है।',
        type: 'exam-start'
      }).catch(error => console.warn('परीक्षा शुरू होने की सूचना सहेजी नहीं गई:', error));
    }
    const attemptEndAt = lateEntryGranted ? ownerGrantedEndAt : scheduledEndAt;

    const collectionName = CONFIG.examCollections[mode];
    if (!collectionName) {
      notify('Unknown exam type.', 'error');
      return;
    }

    try {
      // Fetch only explicitly published questions. Old/unmarked records must
      // be reviewed and published in Owner Studio before they enter an exam.
      const snapshot = await collection(collectionName).where('published', '==', true).get();
      const questions = snapshot.docs
        .filter(doc => {
          const data = doc.data() || {};
          return data.published === true && data.status !== 'draft';
        })
        .map(doc => ({ id: doc.id, ...doc.data() }));

      // Give each attempt its own randomized question order. Do not mutate the
      // Firestore order, so different devices/attempts need not see the same series.
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }

      if (!questions.length) {
        const message = 'अभी mainExamQuestions संग्रह में कोई प्रश्न उपलब्ध नहीं है। Owner Studio में प्रश्न जोड़ें।';
        setText('mainExamCountdown', '⚠️ ' + message);
        notify(message, 'error');
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
        endAt: attemptEndAt,
        durationMinutes,
        timer: null,
        tabSwitches: 0,
        submitted: false,
        stream: null,
        proctorTimer: null,
        beforeUnload: null,
        kicked: false,
        sessionUnsubscribe: null,
        sessionId: null
      };
      persistActiveExam();
      attachExamSessionListener();
      updateExamSession('active', {
        startedAt: serverTimestamp(),
        reentryGrantConsumedAt: serverTimestamp(),
        lateEntryRequested: false
      });

      ensureExamWorkspace(mode);
      setVisible('portalExamWorkspace', true);
      ['enrollmentSection', 'myResultsPanel', 'dailyQuizSection', 'mockHub', 'mainExamSection']
        .forEach(id => setVisible(id, false));
      setVisible('previousQuestionBtn', true);
      setVisible('nextQuestionBtn', true);
      setVisible('submitExamBtn', true);
      window.switchTab('pariksha');
      renderExamQuestion();

      state.exam.timer = setInterval(() => {
        const remaining = Math.ceil((state.exam.endAt - Date.now()) / 1000);
        setText('examTimer', formatTime(remaining));
        persistActiveExam();

        if (remaining <= 0 && Date.now() >= (state.exam.nextSubmissionRetryAt || 0)) {
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
        persistActiveExam();
        notify(`Exam tab change ${state.exam.tabSwitches}/${CONFIG.maxTabSwitches}.`, 'error');
        if (state.exam.tabSwitches >= CONFIG.maxTabSwitches && !state.exam.kicked) {
          // Lock the attempt without submitting it or stopping the deadline timer.
          // The owner can re-enable the same session from Owner Studio.
          state.exam.kicked = true;
          persistActiveExam();
          renderExamQuestion();
          setText('examResult', 'बार-बार टैब बदलने के कारण परीक्षा अस्थायी रूप से लॉक है। उत्तर सुरक्षित हैं; Owner पुनः प्रवेश दे सकता है। समय पूरा होने पर प्रयास जमा होगा।');
          updateExamSession('kicked');
        } else {
          updateExamSession(state.exam.kicked ? 'kicked' : 'active');
        }
      };
      document.addEventListener('visibilitychange', state.exam.visibilityHandler);

      notify('Exam started.', 'success');
    } catch (e) {
      console.error('Exam question loading failed:', e);
      const message = e && e.code === 'permission-denied'
        ? 'प्रश्न पढ़ने की अनुमति नहीं मिली। Firestore Rules में mainExamQuestions के read access की जाँच करें।'
        : 'प्रश्न लोड नहीं हो सके। इंटरनेट कनेक्शन और Firestore Console जाँचें।';
      setText('mainExamCountdown', '⚠️ ' + message);
      notify(message, 'error');
    }
  };

  window.nextExamQuestion = function () {
    if (!state.exam.active || state.exam.kicked || state.exam.lockedAtDeadline) return;
    state.exam.index = Math.min(state.exam.index + 1, state.exam.questions.length - 1);
    persistActiveExam();
    renderExamQuestion();
  };

  window.previousExamQuestion = function () {
    if (!state.exam.active || state.exam.kicked) return;
    state.exam.index = Math.max(0, state.exam.index - 1);
    persistActiveExam();
    renderExamQuestion();
  };

  window.submitPortalExam = async function (automatic = false) {
    const exam = state.exam;

    if (!exam.active || exam.submitted || exam.submitting) return;
    if (exam.kicked && !automatic) {
      notify('यह प्रयास Owner की अनुमति तक लॉक है।', 'error');
      return;
    }
    if (!automatic && ['main', 'mock1', 'mock2'].includes(exam.mode) && Date.now() < exam.endAt) {
      notify('मुख्य/मॉक परीक्षा का उत्तर-पत्र निर्धारित समय पूरा होने पर ही जमा होगा। आपके उत्तर सुरक्षित हैं।', 'error');
      return;
    }

    if (!automatic && !confirm('Submit your answers now?')) return;

    exam.submitting = true;

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

    const instantResult = exam.mode === 'quiz';
    const result = {
      uid: state.user.uid,
      name: state.profile?.displayName || state.user.displayName || state.user.email || 'प्रतिभागी',
      email: state.user.email || null,
      mode: exam.mode,
      total: exam.questions.length,
      totalQuestions: exam.questions.length,
      rollNumber: state.profile?.rollNumber || null,
      attempted,
      // Keep all attempts free of result/mark fields. The student-visible score,
      // when available, is written to publishedResults in the same atomic batch.
      answers: { ...exam.answers },
      review: { ...exam.review },
      questionSetKey: CONFIG.examCollections[exam.mode] || exam.mode,
      questionOrder: exam.questions.map((question, index) => String(question.id || index)),
      questionSnapshots: exam.questions.map((question, index) => ({
        id: String(question.id || index),
        question: question.question || question.text || question.q || '',
        options: (Array.isArray(question.options) ? question.options : Array.isArray(question.opts) ? question.opts : [question.optionA, question.optionB, question.optionC, question.optionD].filter(value => value !== undefined && value !== null && value !== '')).map(option => typeof option === 'object' ? { text: option.text || option.label || option.value || '' } : String(option)),
        marks: Number(question.marks || question.points || 1)
      })),
      submittedAt: serverTimestamp(),
      automatic
    };

    try {
      const submissionRef = collection(CONFIG.submissionCollections[exam.mode]).doc();
      const writeBatch = state.db.batch();
      writeBatch.set(submissionRef, result);
      if (instantResult) {
        writeBatch.set(collection('publishedResults').doc('quizAttempts_' + submissionRef.id), {
          uid: state.user.uid,
          sourceCollection: CONFIG.submissionCollections[exam.mode],
          sourceSubmissionId: submissionRef.id,
          mode: exam.mode,
          name: result.name,
          rollNumber: result.rollNumber,
          score: correct,
          total: exam.questions.length,
          status: 'published',
          feedback: '',
          publishedAt: serverTimestamp(),
          publishedBy: 'system'
        });
      }
      await writeBatch.commit();
      exam.submitting = false;
      exam.submitted = true;
      exam.active = false;
      clearPersistedExam();
      stopExamResources();
      updateExamSession('submitted', { submittedAt: serverTimestamp() });
      if (instantResult) {
        collection('userNotifications').doc(state.user.uid).collection('items').add({
          title: '🏆 दैनिक क्विज़ परिणाम',
          message: 'आपके अंक: ' + correct + '/' + exam.questions.length + ' · हल किए गए प्रश्न: ' + attempted + '।',
          type: 'quiz-result',
          resultScore: correct,
          resultTotal: exam.questions.length,
          recipientUid: state.user.uid,
          active: true,
          audience: 'private',
          createdAt: serverTimestamp()
        }).catch(error => console.warn('Quiz result notification was not saved; check private notification rules.', error));
      }
      setText('examResult', instantResult
        ? `दैनिक क्विज़ परिणाम: ${correct}/${exam.questions.length}. Attempted: ${attempted}.`
        : 'आपके उत्तर जमा हो गए हैं। परिणाम Owner द्वारा जाँच और घोषित किए जाने के बाद ही दिखेगा।');
      notify('Exam submitted successfully.', 'success');
      setVisible('previousQuestionBtn', false);
      setVisible('nextQuestionBtn', false);
      setVisible('submitExamBtn', false);
      setVisible('exitExamWorkspace', true);
    } catch (e) {
      console.error(e);
      exam.submitting = false;
      exam.active = true;
      exam.lockedAtDeadline = Date.now() >= exam.endAt;
      exam.nextSubmissionRetryAt = Date.now() + 15000;
      persistActiveExam();
      if (exam.lockedAtDeadline) renderExamQuestion();
      setText('examResult', instantResult
        ? 'समय पूरा हुआ, लेकिन परिणाम सर्वर पर सहेजा नहीं जा सका। आपके उत्तर सुरक्षित हैं; सिस्टम पुनः प्रयास करेगा।'
        : 'समय पूरा हुआ, लेकिन उत्तर-पत्र सर्वर ने अभी स्वीकार नहीं किया। आपके उत्तर सुरक्षित हैं; सिस्टम पुनः प्रयास करेगा।');
      notify('Submission was not accepted yet. Your answers are preserved and will retry.', 'error');
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

  function safeStep(name, callback) {
    try {
      return callback();
    } catch (error) {
      console.error('[' + name + '] आरंभ नहीं हो सका:', error);
      try { notify('कुछ सुविधाएँ अभी लोड नहीं हुईं (' + name + ')। कृपया दोबारा प्रयास करें।', 'error'); }
      catch (_) { showEarlyHindiToast(); }
      return undefined;
    }
  }

    window.__tabChangeHooks.push(key => {
      if (['admin', 'profile'].includes(key)) safeStep('ओनर स्टूडियो', renderOwnerStudio);
    });

  function initPortal() {
    if (state.initialized) return;
    state.initialized = true;

    // Firebase is initialized before any module that may use Auth or Firestore.
    const firebaseInitialized = safeStep('Firebase', () => {
      if (!firebaseReady()) {
        if (typeof firebase === 'undefined' || typeof firebase.initializeApp !== 'function') {
          throw new Error('Firebase compat SDK is not available.');
        }
        firebase.initializeApp(CONFIG.firebase);
      }
      if (!firebaseReady()) throw new Error('Firebase initialization did not create a default app.');
      state.auth = firebase.auth();
      state.db = firebase.firestore();
      try { state.storage = firebase.storage(); } catch (_) { state.storage = null; }
      return true;
    }) === true;

    // Public handlers were attached to the existing namespace objects before
    // initPortal is invoked, so module failures cannot prevent their exposure.
    window.__bishnoiReady = firebaseReady();

    safeStep('दैनिक संदेश', renderDailyMessage);
    safeStep('नामांकन', initEnrollmentUI);
    safeStep('पंचांग', renderPanchangEstimate);
    safeStep('परीक्षा काउंटडाउन', () => {
      renderExamCountdowns();
      window.setInterval(() => safeStep('परीक्षा काउंटडाउन', renderExamCountdowns), 1000);
    });
    safeStep('जपमाला', initMalaState);
    safeStep('भजन प्लेयर', initKaraokePlayer);
    safeStep('२९ नियम', renderNiyamsList);
    safeStep('वैकल्पिक बटन', bindOptionalButtons);

    if (firebaseInitialized) {
      safeStep('प्रमाणीकरण UI', initAuthUI);
      safeStep('सार्वजनिक सूचनाएँ', initPublicNotifications);
      safeStep('शब्दवाणी', loadShabadRepository);
    }

    window.BishnoiPortal = window.BishnoiPortal || {};
    window.BishnoiPortal.switchTab = window.switchTab;
    window.Bishnoi = window.Bishnoi || window.BishnoiPortal;
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

  window.BishnoiApp.verifyMyResultIdentity = async function () {
    const status = byId('resultLookupStatus');
    if (!requireUser()) {
      if (status) status.textContent = 'पहले लॉगिन करें।';
      return;
    }
    const roll = (byId('resultLookupRoll')?.value || '').trim().toLowerCase();
    const name = (byId('resultLookupName')?.value || '').trim().toLowerCase().split(' ').filter(Boolean).join(' ');
    const dob = (byId('resultLookupDob')?.value || '').trim();
    if (!roll || !name || !dob) {
      if (status) status.textContent = 'रोल नंबर, पूरा नाम और जन्म तिथि तीनों भरें।';
      return;
    }
    try {
      const snap = await collection('examEnrolledStudents').doc(state.user.uid).get();
      const record = snap.exists ? snap.data() || {} : {};
      const expectedRoll = String(record.rollNumber || '').trim().toLowerCase();
      const expectedName = String(record.fullName || record.name || '').trim().toLowerCase().split(' ').filter(Boolean).join(' ');
      const expectedDob = String(record.dateOfBirth || '').trim();
      if (!expectedRoll || roll !== expectedRoll || name !== expectedName || dob !== expectedDob) {
        state.resultsIdentityVerified = false;
        renderMyResults();
        if (status) status.textContent = 'दर्ज विवरण पंजीकरण रिकॉर्ड से मेल नहीं खाते। कृपया सही जानकारी भरें।';
        return;
      }
      state.resultsIdentityVerified = true;
      renderMyResults();
      if (status) status.textContent = 'पहचान सत्यापित। घोषित मुख्य/मॉक परिणाम नीचे दिखेंगे।';
      byId('myResultsList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      if (status) status.textContent = 'पहचान सत्यापित नहीं हो सकी। Firestore rules जाँचें।';
      console.warn('Result identity verification failed:', error);
    }
  };

  app.switchTab = window.switchTab;
  app.downloadMyAdmitCard = async function () {
    if (!state.user || !state.db) return notify('पहले लॉगिन करें।', 'error');
    try {
      const snap = await state.db.collection('examEnrolledStudents').doc(state.user.uid).get();
      if (!snap.exists) throw new Error('आपका नामांकन रिकॉर्ड नहीं मिला।');
      await printStudentAdmitCard({ uid: state.user.uid, ...snap.data() });
    } catch (error) { notify('प्रवेश-पत्र डाउनलोड नहीं हुआ: ' + error.message, 'error'); }
  };
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
        const profileAdmitButton = byId('profileAdmitCardButton');
        if (profileAdmitButton) profileAdmitButton.classList.add('hidden');
        if (state.db) state.db.collection('examEnrolledStudents').doc(state.user.uid).get().then(snap => {
          const enrollment = snap.exists ? snap.data() || {} : {};
          const available = enrollment.verificationStatus === 'confirmed' && !!enrollment.rollNumber &&
            enrollment.admitCardReleased === true;
          if (profileAdmitButton) profileAdmitButton.classList.toggle('hidden', !available);
        }).catch(error => console.warn('प्रोफ़ाइल प्रवेश-पत्र स्थिति नहीं पढ़ी गई:', error));
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

  // Start only after all real public API methods have been attached.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortal, { once: true });
  } else {
    initPortal();
  }

  }
})();
} catch (error) {
  console.error('मुख्य पेज आरंभ नहीं हो सका:', error);
  showEarlyHindiToast();
}
