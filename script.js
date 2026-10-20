window.__startupTrace = window.__startupTrace || [];
function traceStartup(step, extra) {
  try { window.__startupTrace.push(step + (extra ? ': ' + extra : '')); } catch (e) {}
}
traceStartup('script:enter');
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
    traceStartup('attach:auth:done');
  window.BishnoiAuth.signInWithGoogle = function earlyGoogleSignInPlaceholder() {
      openEarlyAuthOrToast();
    };
  }
  if (typeof window.BishnoiApp.openProfileOrAuth !== 'function') {
    traceStartup('attach:app:done');
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
  traceStartup('iife:enter');
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

  traceStartup(CONFIG && CONFIG.firebase ? 'config:found' : 'config:MISSING');
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
  function maskMobile(value) {
    const mobile = String(value || '').replace(/\D/g, '');
    return mobile.length === 10 ? mobile.slice(0, 2) + 'XXXXXX' + mobile.slice(-2) : '';
  }



async function claimPendingEditorInvitation(user) {
  if (!user || !user.uid) return null;
  // Only a verified Firebase Auth phone can discover or accept an invitation.
  const phoneDigits = String(user.phoneNumber || '').replace(/\D/g, '');
  const verifiedPhone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : '';
  if (!verifiedPhone) return null;
  const phoneE164 = '+91' + verifiedPhone;
  const invitationId = 'phone_' + phoneE164;
  const inviteRef = collection('pending_editors').doc(invitationId);
  const roleRef = collection('roles').doc(user.uid);
  try {
    const existingRole = await roleRef.get();
    if (existingRole.exists) return null;
    const inviteSnapshot = await inviteRef.get();
    if (!inviteSnapshot.exists) return null;
    const invitation = inviteSnapshot.data() || {};
    if (invitation.status !== 'pending' || String(invitation.phoneE164 || '') !== phoneE164 ||
        normalizeStudentPhone(invitation.phone || '') !== verifiedPhone ||
        !invitation.permissions || typeof invitation.permissions !== 'object') return null;
    const permissionLabels = [
      invitation.permissions.media === true ? 'Media/PDF/Audio' : '',
      invitation.permissions.quizDrafts === true ? 'Daily Quiz Drafts' : '',
      invitation.permissions.examReview === true ? 'Exam Checking & Results' : '',
      invitation.permissions.notifications === true ? 'Notifications' : ''
    ].filter(Boolean);
    const accepted = window.confirm(
      'Bishnoism Owner Studio invitation\n\n' +
      (invitation.fullName || 'Owner') + ' ने आपको Assistant Editor के रूप में आमंत्रित किया है।\n' +
      'Phone: ' + verifiedPhone + '\n' +
      'Permissions: ' + (permissionLabels.join(', ') || 'None') + '\n\n' +
      'क्या आप यह Editor भूमिका स्वीकार करते हैं?'
    );
    if (!accepted) {
      notify('Editor invitation अभी pending है। बाद में इसी verified phone से लॉगिन करके स्वीकार करें।', 'info');
      return null;
    }
    const roleData = {
      role: 'editor',
      fullName: String(invitation.fullName || '').slice(0, 100),
      phone: verifiedPhone,
      email: String(invitation.email || '').trim().toLowerCase(),
      permissions: {
        media: invitation.permissions.media === true,
        quizDrafts: invitation.permissions.quizDrafts === true,
        examReview: invitation.permissions.examReview === true,
        notifications: invitation.permissions.notifications === true
      },
      invitationId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await state.db.runTransaction(async transaction => {
      const freshInvite = await transaction.get(inviteRef);
      const freshRole = await transaction.get(roleRef);
      const freshData = freshInvite.exists ? (freshInvite.data() || {}) : {};
      if (freshRole.exists) throw new Error('ROLE_ALREADY_EXISTS');
      if (!freshInvite.exists || freshData.status !== 'pending' || freshData.phoneE164 !== phoneE164) {
        throw new Error('INVITATION_ALREADY_CLAIMED');
      }
      transaction.set(roleRef, roleData);
      transaction.update(inviteRef, {
        status: 'claimed',
        claimedUid: user.uid,
        claimedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    return { ...roleData, __justClaimed: true };
  } catch (error) {
    if (error.message !== 'ROLE_ALREADY_EXISTS' && error.message !== 'INVITATION_ALREADY_CLAIMED') {
      console.error('Editor invitation claim failed:', error);
      notify('Editor invitation जाँची नहीं जा सकी। Firestore rules/deployment जाँचें।', 'error');
    }
    return null;
  }
}

  async function loadUserProfile(user) {
    state.profile = {};
    try {
      const profileRef = collection('users').doc(user.uid);
      const snap = await profileRef.get();
      if (snap.exists) {
        state.profile = snap.data();
        if (!state.profile.verificationStatus) {
          const googleData = (user.providerData || []).find(item => item && item.providerId === 'google.com');
          await profileRef.set({
            verificationStatus: 'unverified',
            displayName: state.profile.displayName || state.profile.fullName || user.displayName || '',
            email: googleData?.email || state.profile.email || user.email || null,
            ...(googleData && state.profile.gmailVerified !== true ? { gmailVerified: true } : {}),
            updatedAt: serverTimestamp()
          }, { merge: true });
          state.profile = { ...state.profile, verificationStatus: 'unverified', ...(googleData ? { gmailVerified: true } : {}) };
        }
      } else {
        const googleData = (user.providerData || []).find(item => item && item.providerId === 'google.com');
        state.profile = {
          displayName: user.displayName || '',
          fullName: user.displayName || '',
          email: googleData?.email || user.email || null,
          gmailVerified: !!googleData,
          verificationStatus: 'unverified',
          authProvider: user.providerData?.[0]?.providerId || 'unknown',
          createdAt: serverTimestamp()
        };
        await profileRef.set(state.profile, { merge: true });
      }
    } catch (profileError) {
      console.warn('User profile could not be created/read; check users Firestore rules:', profileError);
    }
    const claimedEditorRole = await claimPendingEditorInvitation(user);
    if (claimedEditorRole?.__justClaimed) {
      notify('Editor भूमिका स्वीकार हो गई। आपकी चुनी हुई permissions लागू कर दी गई हैं।', 'success');
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
        state.editorPermissions = roleData.role === 'editor'
      ? (roleData.permissions || {})
      : {};
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

    const profileName = state.profile.displayName || state.profile.fullName || user.displayName || 'सदस्य';
    setText('userDisplayName', profileName);
    setText('profileName', profileName);
    const mobileInput = byId('enrollmentPhone');
    if (mobileInput) {
      mobileInput.value = state.profile.mobile || '';
      mobileInput.readOnly = true;
      mobileInput.setAttribute('aria-readonly', 'true');
    }
    const profileMobile = byId('profEditPhone');
    if (profileMobile) {
      profileMobile.value = maskMobile(state.profile.mobile || '');
      profileMobile.readOnly = true;
      profileMobile.setAttribute('aria-readonly', 'true');
    }
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
    let shouldOpenAuthFromQuery = new URLSearchParams(window.location.search).get('openAuth') === '1';

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
      if (shouldOpenAuthFromQuery) {
        shouldOpenAuthFromQuery = false;
        try {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        } catch (_) {}
        if (user) window.BishnoiApp?.openProfileOrAuth?.();
        else window.BishnoiAuth?.openAuthModal?.();
      }
      state.resultsIdentityVerified = false;
      window.initPersonalNotificationsForUser();
      window.initPublicNotifications();
      window.renderNotificationCenter();
      try {
        const routeTab = window.location.hash === '#tab-quiz' ? 'quiz' : '';
        const savedTab = routeTab || sessionStorage.getItem('bishnoi_active_tab_v1');
        if (savedTab) window.switchTab(savedTab);
      } catch (_) {}
      state.myResults = [];
      window.renderMyResults();
      state.isOwner = false;
      state.roles = [];

      // These subscriptions only read portal content. Firestore rules must still
      // allow public reads for public collections and must deny guest writes.
      // Starting them for guests lets the literature/community/exam pages render
      // without making posting, exam submissions, or owner actions public.
      startLiveListeners();

      if (user && !window.__bishnoiRegistrationInProgress) {
        // Presence updates are deliberately skipped while the three-step registration
        // is in progress, so an unverified account cannot get a premature profile.
        try {
          const presenceRef = state.db.collection('users').doc(user.uid);
          const googleData = (user.providerData || []).find(item => item && item.providerId === 'google.com');
          await presenceRef.set({
            uid: user.uid,
            email: googleData?.email || user.email || null,
            displayName: user.displayName || null,
            ...(googleData ? { gmailVerified: true } : {}),
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
          window.restoreActiveExamForUser();
          if (state.profile?.mala && typeof state.profile.mala === 'object') {
            state.mala.count = Math.min(107, Math.max(0, Number(state.profile.mala.count) || 0));
            state.mala.laps = Math.max(0, Number(state.profile.mala.laps) || 0);
            try { localStorage.setItem('bishnoi_mala_v2', JSON.stringify({ ...state.mala, date: localDateKey() })); } catch (_) {}
            window.renderMala();
          }
          notify(`Welcome${state.profile?.displayName ? ' ' + state.profile.displayName : ''}!`, 'success');
        } catch (e) {
          console.error('Signed-in profile initialization failed:', e);
          notify('Signed in, but your profile could not load. Check Firestore permissions.', 'error');
        }
      } else if (!user) {
        setText('userDisplayName', 'लॉगिन करें');
        setText('profileName', 'अतिथि');
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
      ? (state.profile?.displayName || state.profile?.fullName || state.user.displayName || state.user.email || 'सदस्य')
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
      window.stopExamResources();
      if (state.auth) await state.auth.signOut();
      notify('Signed out.', 'success');
    } catch (e) {
      notify('Could not sign out.', 'error');
    }
  };

  function authErrorMessage(e) {
    return ({
      'auth/invalid-email': 'ईमेल पता सही नहीं है।',
      'auth/user-not-found': 'इस मोबाइल नंबर से कोई खाता नहीं मिला।',
      'auth/wrong-password': 'पासवर्ड गलत है। दोबारा जाँचें।',
      'auth/invalid-credential': 'मोबाइल नंबर या पासवर्ड गलत है।',
      'auth/too-many-requests': 'बहुत अधिक प्रयास हुए हैं। कुछ देर बाद दोबारा प्रयास करें।',
      'auth/operation-not-allowed': 'यह लॉगिन तरीका Firebase में चालू नहीं है।',
      'auth/unauthorized-domain': 'Firebase Authentication में इस वेबसाइट का domain जोड़ें।',
      'auth/network-request-failed': 'इंटरनेट कनेक्शन जाँचकर फिर प्रयास करें।',
      'auth/popup-blocked': 'Google पॉप-अप ब्लॉक हुआ है। इस वेबसाइट के लिए अनुमति दें।',
      'auth/popup-closed-by-user': 'Google सत्यापन पूरा नहीं हुआ। दोबारा प्रयास करें।',
      'auth/credential-already-in-use': 'यह Google खाता किसी दूसरे खाते से जुड़ा है।',
      'auth/email-already-in-use': 'यह मोबाइल नंबर पहले से पंजीकृत है, कृपया लॉगिन करें',
      'auth/weak-password': 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।',
      'auth/requires-recent-login': 'सुरक्षा के लिए Google से दोबारा सत्यापन करें।'
    })[e?.code] || 'लॉगिन पूरा नहीं हुआ। अपनी जानकारी जाँचकर फिर प्रयास करें।';
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
        window.renderHistoryItems();
      },
      'History and culture updates'
    );

    subscribe(
      collection('posts').orderBy('createdAt', 'desc').limit(50),
      snap => window.renderCommunity(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      'Community'
    );

    subscribe(
      collection('audios').orderBy('order', 'asc'),
      snap => window.renderAudioList(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      'Audio library'
    );

    subscribe(
      collection('pdfs').orderBy('createdAt', 'desc').limit(100),
      snap => window.renderPdfLibrary(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      'PDF library'
    );

    subscribe(
      collection('examConfig').doc('current'),
      snap => {
        state.examConfig = snap.exists ? snap.data() : {};
        window.renderExamVisibility();
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
          window.renderMyResults();
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
    window.renderExamVisibility();
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
    if (!byId('enrollmentFatherName')) {
      const label = document.createElement('label');
      label.className = 'block text-sm font-semibold text-stone-700';
      label.textContent = "पिता का नाम / Father's Name";
      const input = document.createElement('input');
      input.id = 'enrollmentFatherName'; input.name = 'fatherName'; input.type = 'text';
      input.maxLength = 100; input.placeholder = 'पिता का पूरा नाम';
      input.className = 'mt-1 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm';
      label.appendChild(input);
      const dob = byId('enrollmentDob');
      if (dob?.parentElement) dob.parentElement.insertAdjacentElement('beforebegin', label);
      else form.prepend(label);
    }
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

    // Show the complete enrollment submission back to the student.
    const registeredAt = timestampMillis(record.createdAt);
    const updatedAt = timestampMillis(record.updatedAt);
    const registrationFields = [
      ['पूरा नाम', record.fullName || record.name],
      ['मोबाइल नंबर', state.profile?.mobile || '—'],
      ['जन्म तिथि', record.dateOfBirth || record.dob],
      ['परीक्षा', record.examName || record.examTitle || 'मुख्य परीक्षा'],
      ['गाँव / शहर / स्थान', record.location || record.village || record.city],
      ['ईमेल', record.email || state.user.email],
      ['रोल नंबर', roll || record.rollNumber || 'अभी आवंटित नहीं'],
      ['पंजीकरण स्थिति', statusText],
      ['पंजीकरण दिनांक', registeredAt ? new Date(registeredAt).toLocaleString('hi-IN') : '—'],
      ['अंतिम अपडेट', updatedAt ? new Date(updatedAt).toLocaleString('hi-IN') : '—'],
      ['पंजीकरण ID', record.uid || state.user.uid]
    ];
    const details = document.createElement('div');
    details.className = 'mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2';
    registrationFields.forEach(([label, value]) => {
      const item = document.createElement('div');
      item.className = 'rounded-lg border border-stone-200 bg-stone-50 p-3';
      const caption = document.createElement('div');
      caption.className = 'text-[11px] text-stone-500';
      caption.textContent = label;
      const content = document.createElement('div');
      content.className = 'mt-1 break-words text-sm font-semibold text-stone-800';
      content.textContent = String(value || '—');
      item.append(caption, content);
      details.appendChild(item);
    });
    host.appendChild(details);

    const cardReleased = record.admitCardReleased === true ||
      (state.examConfig?.admitCardReleased === true && !record.admitCardExamType);
    if (status === 'confirmed' && roll && cardReleased) {
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
    } else if (status === 'confirmed' && roll && !cardReleased) {
      const hint = document.createElement('p');
      hint.className = 'text-amber-800';
      hint.textContent = 'आपका पंजीकरण स्वीकृत है। प्रवेश-पत्र व्यवस्थापक द्वारा जारी होने पर यहीं डाउनलोड कर सकेंगे।';
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
    // Re-read the student's enrollment immediately before validating/downloading.
    // This avoids validating stale UI data after an owner approves/releases a card.
    if (!state.user || !state.db) {
      notify('कृपया पहले लॉगिन करें और फिर प्रयास करें।', 'error');
      return;
    }

    const studentUid = state.user.uid;
    try {
      const freshEnrollment = await state.db
        .collection('examEnrolledStudents')
        .doc(studentUid)
        .get();

      const profileSnapshot = await state.db.collection('users').doc(studentUid).get();
      const currentProfile = profileSnapshot.exists ? profileSnapshot.data() || {} : {};
      if (currentProfile.gmailVerified !== true) {
        notify('प्रवेश-पत्र के लिए Google सत्यापन आवश्यक है।', 'error');
        return;
      }
      state.profile = { ...(state.profile || {}), ...currentProfile };
      if (!freshEnrollment.exists) {
        notify('आपका पंजीकरण रिकॉर्ड नहीं मिला। कृपया व्यवस्थापक से संपर्क करें।', 'error');
        return;
      }

      record = freshEnrollment.data() || {};
      if (state.user?.uid !== studentUid) return;
    } catch (error) {
      console.error('Admit-card enrollment refresh failed:', {
        code: error?.code || 'unknown',
        message: error?.message || String(error)
      });
      notify('पंजीकरण की जानकारी लोड नहीं हुई। कृपया दोबारा लॉगिन करके प्रयास करें।', 'error');
      return;
    }

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
        !/^JAMBH-2026-\d{4,}$/.test(String(record.rollNumber || ''))) {
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
     surface.id = 'bishnoiAdmitCardCapture';
surface.style.setProperty('position', 'fixed', 'important');
surface.style.setProperty('left', '0', 'important');
surface.style.setProperty('top', '0', 'important');
surface.style.setProperty('width', '794px', 'important');
surface.style.setProperty('min-width', '794px', 'important');
surface.style.setProperty('display', 'block', 'important');
surface.style.setProperty('visibility', 'visible', 'important');
surface.style.setProperty('opacity', '1', 'important');
surface.style.setProperty('z-index', '2147483647', 'important');
surface.style.setProperty('padding', '30px', 'important');
surface.style.setProperty('background', '#fffdf7', 'important');
surface.style.setProperty('color', '#143622', 'important');
surface.style.setProperty('font-family', 'Arial, sans-serif', 'important');
surface.style.setProperty('box-sizing', 'border-box', 'important');
surface.style.setProperty('pointer-events', 'none', 'important');
      
      const cfg = record.admitCardSettings || state.examConfig || {};
      const esc = escapeHtml;

      const fields = [
        ['विद्यार्थी का नाम', record.fullName || record.name ||
          state.profile?.displayName || state.user.displayName || 'विद्यार्थी'],
        ['रोल नंबर', record.rollNumber],
        ['जन्म तिथि', record.dateOfBirth || record.dob || '—'],
        ['मोबाइल नंबर', state.profile?.mobile || '—'],
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
  '<article style="border:4px solid #143622;border-radius:14px;overflow:hidden;background:#fffdf7">' +
    '<header style="background:#143622;color:white;padding:18px 20px;text-align:center;border-bottom:5px solid #d6a43a">' +
      '<div style="font-size:34px">🌳</div>' +
      '<h1 style="font-size:25px;font-weight:bold;margin:5px 0">बिश्नोइज़्म डिजिटल मंच</h1>' +
      '<p style="font-size:16px;margin:0;color:#ffe8a3">परीक्षा प्रवेश-पत्र</p>' +
    '</header>' +
    '<main style="padding:20px">' +
      '<section style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px">' +
        '<div style="flex:1;min-width:0">' +
          '<h2 style="font-size:20px;font-weight:bold;color:#143622;margin:0 0 8px">परीक्षार्थी विवरण</h2>' +
          '<p style="font-size:12px;color:#68766b;line-height:1.6;margin:0">परीक्षा में प्रवेश के समय यह प्रवेश-पत्र सुरक्षित रखें।</p>' +
        '</div>' +
        '<aside style="width:112px;height:138px;flex-shrink:0;border:2px dashed #8b9a8c;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#68766b;padding:6px;box-sizing:border-box">' +
          '<div style="font-size:28px">📷</div>' +
          '<div style="font-size:11px;font-weight:bold;margin-top:6px">विद्यार्थी का फोटो</div>' +
          '<div style="font-size:9px;margin-top:4px">पासपोर्ट आकार</div>' +
        '</aside>' +
      '</section>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        fieldHtml +
      '</div>' +
      '<section style="margin-top:18px;padding:13px;background:#fff4cf;border:1px solid #e6ce85;border-radius:10px;line-height:1.65;overflow-wrap:anywhere">' +
        '<strong style="font-size:14px">महत्वपूर्ण निर्देश</strong>' +
        '<p style="font-size:12px;white-space:pre-wrap;margin:6px 0 0">' +
          esc(cfg.admitCardInstructions ||
            'प्रवेश-पत्र सुरक्षित रखें और निर्धारित समय पर परीक्षा में प्रवेश करें।') +
        '</p>' +
      '</section>' +
      '<p style="margin-top:18px;font-size:10px;text-align:center;color:#68766b">' +
        'यह प्रवेश-पत्र वेबसाइट के पंजीकरण रिकॉर्ड के आधार पर बनाया गया है।' +
      '</p>' +
    '</main>' +
  '</article>';


      document.body.appendChild(surface);
      const cardRect = surface.getBoundingClientRect();

console.log('Admit-card capture dimensions:', {
  width: cardRect.width,
  height: cardRect.height,
  scrollWidth: surface.scrollWidth,
  scrollHeight: surface.scrollHeight,
  display: getComputedStyle(surface).display,
  visibility: getComputedStyle(surface).visibility
});

if (cardRect.width === 0 || cardRect.height === 0) {
  throw new Error(
    'Admit-card element has zero dimensions: ' +
    cardRect.width + ' × ' + cardRect.height
  );
}

      await new Promise(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      if (document.fonts?.ready) await document.fonts.ready;

      // Load html2canvas on demand if the CDN script in index.html failed to load.
      if (typeof window.html2canvas !== 'function') {
        await new Promise((resolve, reject) => {
          const urls = [
            'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
            'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
          ];
          let index = 0;
          const tryNext = () => {
            if (index >= urls.length) {
              reject(new Error('html2canvas library could not be loaded. Check the browser Network tab or content blockers.'));
              return;
            }
            const script = document.createElement('script');
            script.src = urls[index++];
            script.onload = () => typeof window.html2canvas === 'function'
              ? resolve()
              : tryNext();
            script.onerror = tryNext;
            document.head.appendChild(script);
          };
          tryNext();
        });
      }

      const canvas = await window.html2canvas(surface, {
        scale: 2,
        backgroundColor: '#fffdf7',
        useCORS: true,
        logging: true,
        allowTaint: false,
        width: surface.scrollWidth,
        height: surface.scrollHeight,
        windowWidth: Math.max(window.innerWidth, surface.scrollWidth),
        windowHeight: Math.max(window.innerHeight, surface.scrollHeight),
        onclone: clonedDocument => {
          const clonedSurface = clonedDocument.getElementById('bishnoiAdmitCardCapture');
          if (!clonedSurface) throw new Error('Admit-card element missing from PDF clone.');

          // Keep the clone in normal document flow so text/layout are painted reliably.
          clonedSurface.style.setProperty('position', 'static', 'important');
          clonedSurface.style.setProperty('left', 'auto', 'important');
          clonedSurface.style.setProperty('top', 'auto', 'important');
          clonedSurface.style.setProperty('width', '794px', 'important');
          clonedSurface.style.setProperty('min-width', '794px', 'important');
          clonedSurface.style.setProperty('display', 'block', 'important');
          clonedSurface.style.setProperty('visibility', 'visible', 'important');
          clonedSurface.style.setProperty('opacity', '1', 'important');
          clonedSurface.style.setProperty('z-index', 'auto', 'important');
          clonedSurface.style.setProperty('transform', 'none', 'important');

          clonedSurface.querySelectorAll('*').forEach(element => {
            element.style.setProperty('visibility', 'visible', 'important');
            element.style.setProperty('opacity', '1', 'important');
            element.style.setProperty('text-shadow', 'none', 'important');
            element.style.setProperty('mix-blend-mode', 'normal', 'important');

            // Force a real text fill color in the cloned DOM. Some site-wide
            // styles can make -webkit-text-fill-color transparent, which causes
            // html2canvas to capture backgrounds while omitting all text.
            const computed = clonedDocument.defaultView.getComputedStyle(element);
            let textColor = computed.color;
            if (!textColor || textColor === 'transparent' ||
                textColor === 'rgba(0, 0, 0, 0)') {
              textColor = '#143622';
            }
            element.style.setProperty('color', textColor, 'important');
            element.style.setProperty('-webkit-text-fill-color', textColor, 'important');
            element.style.setProperty('font-family', 'Arial, sans-serif', 'important');
            element.style.setProperty('text-shadow', 'none', 'important');
          });
        }
      });

      if (!canvas.width || !canvas.height) {
        throw new Error(
          'PDF canvas is empty: ' + canvas.width + ' × ' + canvas.height +
          '. Card dimensions: ' + surface.scrollWidth + ' × ' + surface.scrollHeight
        );
      }

      // Verify the rendered canvas is not just a blank background.
      const sample = document.createElement('canvas');
      sample.width = Math.min(canvas.width, 200);
      sample.height = Math.min(canvas.height, 200);
      const sampleContext = sample.getContext('2d', { willReadFrequently: true });
      sampleContext.drawImage(canvas, 0, 0, sample.width, sample.height);
      console.log('Admit-card canvas ready:', {
        width: canvas.width,
        height: canvas.height,
        html2canvasLoaded: typeof window.html2canvas === 'function'
      });
      const JsPDF = window.jspdf?.jsPDF || window.jsPDF;
      const pdf = new JsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

     
const margin = 8;
const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
const image = canvas.toDataURL('image/jpeg', 0.95);

const naturalHeight = canvas.height * pageWidth / canvas.width;
const scale = Math.min(1, pageHeight / naturalHeight);
const renderWidth = pageWidth * scale;
const renderHeight = naturalHeight * scale;

const x = (pdf.internal.pageSize.getWidth() - renderWidth) / 2;
const y = (pdf.internal.pageSize.getHeight() - renderHeight) / 2;

pdf.addImage(
  image,
  'JPEG',
  x,
  y,
  renderWidth,
  renderHeight,
  undefined,
  'FAST'
);

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
  }
  window.downloadPortalAdmitCard = printStudentAdmitCard;

  window.pushNotification = async function pushNotification(uid, data = {}) {
    if (!state.db) throw new Error('Firestore उपलब्ध नहीं है।');
    if (!state.user) throw new Error('सूचना भेजने के लिए लॉगिन आवश्यक है।');
    const isOwnerForNotification = state.isOwner === true ||
      state.user.uid === CONFIG.ownerUid || state.user.uid === CONFIG.legacyOwnerUid;
    if (!isOwnerForNotification && !hasEditorPermission('notifications')) {
      throw new Error('सूचना भेजने के लिए Notifications permission आवश्यक है।');
    }
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

  window.renderNotificationCenter = function renderNotificationCenter() {
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
    // Sort first so duplicate legacy/flat notices keep the newest, highest-priority copy.
    const sortedItems = [...personalItems, ...flatItems, ...globalItems].sort((a, b) =>
      Number(!!(b.pinnedByOwner || b.important)) - Number(!!(a.pinnedByOwner || a.important)) ||
      notificationTime(b) - notificationTime(a)
    );
    const seenAdmitExamKeys = new Set();
    const items = sortedItems.filter(item => {
      const text = [item.type, item.title, item.message, item.body].filter(Boolean).join(' ');
      const isAdmitNotice = /admit-card|प्रवेश.?पत्र/i.test(text);
      if (!isAdmitNotice) return true;

      // Never show legacy internal BIS identifiers as a student's roll number.
      const validRoll = /JAMBH-2026-\d{4,}/i.test(text);
      if (/\bBIS-[A-Za-z0-9_-]+\b/i.test(text) && !validRoll) return false;

      // The same release may exist in legacy personal, flat and global feeds.
      // Keep only the newest copy per exam type.
      const examKey = /mock\s*2|मॉक\s*2/i.test(text) ? 'mock2'
        : /mock\s*1|मॉक\s*1/i.test(text) ? 'mock1' : 'main';
      if (seenAdmitExamKeys.has(examKey)) return false;
      seenAdmitExamKeys.add(examKey);
      return true;
    });
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
        window.renderNotificationCenter();
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
    window.renderNotificationCenter();
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

  window.initPersonalNotificationsForUser = function initPersonalNotificationsForUser() {
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
    if (!state.user || !state.db) { window.renderNotificationCenter(); return; }
    const uid = state.user.uid;
    state.notificationReadsUnsubscribe = state.db.collection('userNotificationReads').doc(uid).collection('items').onSnapshot(snapshot => {
      if (state.user?.uid !== uid) return;
      const legacyKeys = snapshot.docs.map(doc => doc.data()?.key).filter(Boolean);
      state.notificationReadKeys = [...new Set([...(state.notificationReadKeys || []).filter(k => k.startsWith('flat:')), ...legacyKeys])];
      window.renderNotificationCenter();
    }, error => console.error('Legacy notification read-marker listener failed:', error.code || error.message, error));
    state.flatNotificationReadsUnsubscribe = state.db.collection('notificationReads').where('uid', '==', uid).onSnapshot(snapshot => {
      if (state.user?.uid !== uid) return;
      const flatKeys = snapshot.docs.filter(doc => doc.data()?.read === true).map(doc => 'flat:' + doc.data().notificationId);
      state.notificationReadKeys = [...new Set([...(state.notificationReadKeys || []).filter(k => !k.startsWith('flat:')), ...flatKeys])];
      window.renderNotificationCenter();
    }, error => console.error('Flat notification read-marker listener failed. Verify Firebase project, signed-in UID, and published Firestore rules:', {
      code: error.code || 'unknown',
      projectId: state.db?.app?.options?.projectId || 'unknown',
      authUid: state.auth?.currentUser?.uid || null,
      listenerUid: uid,
      error
    }));
    state.personalNotificationsUnsubscribe = state.db.collection('userNotifications').doc(uid).collection('items').onSnapshot(snapshot => {
      if (state.user?.uid !== uid) return;
      state.personalNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _scope: 'private' }));
      window.renderNotificationCenter();
    }, error => { console.error('Legacy private notification listener failed:', error.code || error.message, error); state.personalNotifications = []; window.renderNotificationCenter(); });
    // Use two exact-equality queries rather than an "in" query. This makes
    // each query's security requirement explicit: own notifications and broadcasts.
    let ownFlatDocs = [];
    let broadcastFlatDocs = [];
    const publishFlatNotifications = () => {
      if (state.user?.uid !== uid) return;
      const byId = new Map();
      [...ownFlatDocs, ...broadcastFlatDocs].forEach(doc => {
        byId.set(doc.id, { id: doc.id, ...doc.data(), _scope: 'flat' });
      });
      state.flatNotifications = [...byId.values()].sort(
        (a, b) => notificationTime(b) - notificationTime(a)
      );
      window.renderNotificationCenter();
    };
    const onFlatQueryError = label => error => {
      console.error(label + ' failed. Verify Firebase project, signed-in UID, and published Firestore rules:', {
        code: error.code || 'unknown',
        projectId: state.db?.app?.options?.projectId || 'unknown',
        authUid: state.auth?.currentUser?.uid || null,
        listenerUid: uid,
        error
      });
      notify('सूचनाएँ लोड नहीं हुईं (' + (error.code || 'unknown') + ')। Firebase Rules और लॉगिन जाँचें।', 'error');
    };
    const ownFlatUnsubscribe = state.db.collection('userNotifications')
      .where('uid', '==', uid)
      .onSnapshot(snapshot => {
        ownFlatDocs = snapshot.docs;
        publishFlatNotifications();
      }, onFlatQueryError('Own flat notification listener'));
    const broadcastFlatUnsubscribe = state.db.collection('userNotifications')
      .where('uid', '==', 'ALL')
      .onSnapshot(snapshot => {
        broadcastFlatDocs = snapshot.docs;
        publishFlatNotifications();
      }, onFlatQueryError('Broadcast notification listener'));
    state.flatNotificationsUnsubscribe = () => {
      ownFlatUnsubscribe();
      broadcastFlatUnsubscribe();
    };
  }

  window.initPublicNotifications = function initPublicNotifications() {
    if (!state.db || state.publicNotificationsUnsubscribe) return;
    state.publicNotificationsUnsubscribe = state.db.collection('notifications')
      .onSnapshot(snapshot => {
        state.notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _scope: 'global' }));
        window.renderNotificationCenter();
      }, error => {
        console.warn('Notifications could not load:', error);
        state.notifications = [];
        window.renderNotificationCenter();
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
        if (state.profile?.gmailVerified !== true) {
          if (status) status.textContent = 'परीक्षा पंजीकरण के लिए Google सत्यापन पूरा करना ज़रूरी है।';
          notify('परीक्षा पंजीकरण के लिए Google सत्यापन पूरा करना ज़रूरी है।', 'error');
          return;
        }
        const fullName = (byId('enrollmentName')?.value || '').trim();
        const fatherName = String(byId('enrollmentFatherName')?.value || '').trim().slice(0, 100);
        const phone = normalizeStudentPhone(state.user.phoneNumber || state.profile?.verifiedPhone || state.profile?.mobile || '');
        const dateOfBirth = (byId('enrollmentDob')?.value || '').trim();
        const examName = (byId('enrollmentExam')?.value || 'मुख्य परीक्षा').trim();
        const location = (byId('enrollmentLocation')?.value || '').trim();
        if (fullName.length < 2 || !/^[6-9]\d{9}$/.test(phone) || !dateOfBirth || new Date(dateOfBirth).getTime() > Date.now()) {
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
            fatherName,
            phone,
            mobile: phone,
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

  window.renderMyResults = function renderMyResults() {
    const host = byId('myResultsList');
    if (!host) return;
    const rows = Array.isArray(state.myResults) ? state.myResults : [];
    const intro = byId('myResultsIntro');
    if (!rows.length) {
      if (intro) intro.textContent = state.user
        ? 'अभी आपके खाते के लिए कोई परिणाम प्रकाशित नहीं हुआ है। परिणाम परीक्षक द्वारा घोषित होने के बाद यहाँ दिखाई देंगे।'
        : 'अपने परिणाम देखने के लिए लॉगिन करें। प्रकाशित परिणाम ही यहाँ दिखाए जाते हैं।';
      host.innerHTML = '<div class="results-empty"><span class="results-empty-icon" aria-hidden="true">📘</span><p class="font-bold text-sm text-forest">अभी कोई घोषित परिणाम नहीं</p><p class="mt-1 text-xs leading-relaxed text-stone-500">जैसे ही परीक्षक आपका परिणाम प्रकाशित करेंगे, अंक और परिणाम का समय यहाँ दिखाई देगा।</p></div>';
      return;
    }
    if (intro) intro.textContent = 'नीचे केवल आपके लिए प्रकाशित परिणाम हैं। लंबित या जाँचाधीन प्रयासों के अंक यहाँ नहीं दिखाए जाते।';
    const modeNames = { quiz: 'दैनिक ज्ञान परीक्षा', mock1: 'मॉक परीक्षा 1', mock2: 'मॉक परीक्षा 2', main: 'मुख्य परीक्षा' };
    host.innerHTML = rows.map(row => {
      const scoreVisible = row.mode === 'quiz' || state.resultsIdentityVerified === true;
      const score = Number(row.score);
      const total = Number(row.total);
      const validScore = scoreVisible && row.score !== null && row.score !== '' && Number.isFinite(score) &&
        row.total !== null && row.total !== '' && Number.isFinite(total) && total > 0;
      const percentage = validScore ? Math.max(0, Math.min(100, Math.round((score / total) * 100))) : 0;
      const scoreText = validScore
        ? '<div class="results-score"><span class="results-score-value">' + escapeHtml(score) + '</span><span class="results-score-total">/ ' + escapeHtml(total) + ' अंक</span></div>'
        : '<p class="text-xs leading-relaxed text-stone-600">' + (scoreVisible ? 'अंक उपलब्ध नहीं हैं। कृपया परीक्षक से संपर्क करें।' : 'अंक देखने के लिए ऊपर रोल नंबर, पूरा नाम और जन्म तिथि सत्यापित करें।') + '</p>';
      const feedback = scoreVisible && row.feedback
        ? '<div class="results-feedback"><span aria-hidden="true">💬</span><p><strong>परीक्षक की टिप्पणी</strong><br>' + escapeHtml(row.feedback) + '</p></div>'
        : '';
      const dateValue = row.publishedAt;
      const publishedAt = dateValue?.toDate ? dateValue.toDate().toLocaleString('hi-IN') : (dateValue ? new Date(dateValue).toLocaleString('hi-IN') : '');
      const safeDate = publishedAt && publishedAt !== 'Invalid Date' ? escapeHtml(publishedAt) : '';
      const roll = row.rollNumber ? escapeHtml(row.rollNumber) : '';
      const mode = escapeHtml(modeNames[row.mode] || row.mode || 'परीक्षा');
      return '<article class="results-card"><div class="results-card-top"><div class="min-w-0"><p class="results-eyebrow">परीक्षा परिणाम</p><h4 class="results-exam-name">' + mode + '</h4></div><span class="results-published"><span class="results-status-dot" aria-hidden="true"></span> परिणाम घोषित</span></div>' +
        (validScore ? '<div class="results-score-row">' + scoreText + '<div class="results-score-side"><span>प्राप्तांक</span><strong>' + percentage + '%</strong></div></div><div class="results-progress" role="progressbar" aria-label="प्राप्त अंक प्रतिशत" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percentage + '"><span style="width:' + percentage + '%"></span></div>' : '<div class="results-score-locked">' + scoreText + '</div>') +
        feedback + '<div class="results-meta">' + (roll ? '<span><span aria-hidden="true">🎫</span> रोल नंबर: <strong>' + roll + '</strong></span>' : '') + (safeDate ? '<span><span aria-hidden="true">🕒</span> ' + safeDate + '</span>' : '') + '</div></article>';
    }).join('');
  };

  window.renderHistoryItems = function renderHistoryItems() {
    const historyHost = byId('historySubView');
    const kidsHost = byId('kidsSubView');
    const history = (state.historyItems || []).filter(x => x.category !== 'kids');
    const kids = (state.historyItems || []).filter(x => x.category === 'kids');
    const card = x => `<article class="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-2"><h3 class="font-yatra text-base text-forest">${escapeHtml(x.title || 'इतिहास व संस्कार')}</h3><p class="text-xs leading-relaxed text-stone-700 whitespace-pre-wrap">${escapeHtml(x.content || '')}</p><p class="text-[10px] text-stone-400">${escapeHtml(x.dateLabel || '')}</p></article>`;
    if (historyHost) historyHost.innerHTML = history.length ? history.map(card).join('') : '<div class="rounded-2xl border border-dashed border-stone-300 p-5 text-center text-xs text-stone-500">इतिहास की नई जानकारी Owner Studio से जोड़ी जा सकती है।</div>';
    if (kidsHost) kidsHost.innerHTML = kids.length ? kids.map(card).join('') : '<div class="rounded-2xl border border-dashed border-stone-300 p-5 text-center text-xs text-stone-500">बाल संस्कार की सामग्री जल्द यहाँ दिखाई जाएगी।</div>';
  }


window.renderExamVisibility = function renderExamVisibility() {
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
    ['mainDailyQuizCta', c.dailyQuizVisible !== false],
    ['mainDailyQuizResultsCta', c.dailyQuizResultsVisible !== false],
    ['examPortalCard', c.separateExamPortalVisible !== false && c.examPortalVisible !== false],
    ['myResultsPanel', c.resultsVisible !== false]
  ];

  // Apply the Owner Studio visibility settings to the main-site CTA cards as
  // well as the exam controls. Missing settings default to visible for
  // backward compatibility; only an explicit false hides a feature.
  features.forEach(([id, visible]) => setVisible(id, visible));

  // Also support future cards marked with data-owner-visibility without
  // requiring another bespoke visibility entry for every card.
  const visibilityByKey = {
    dailyQuizVisible: c.dailyQuizVisible !== false,
    dailyQuizResultsVisible: c.dailyQuizResultsVisible !== false,
    separateExamPortalVisible: c.separateExamPortalVisible !== false && c.examPortalVisible !== false
  };
  document.querySelectorAll('[data-owner-visibility]').forEach(el => {
    const key = el.getAttribute('data-owner-visibility');
    if (Object.prototype.hasOwnProperty.call(visibilityByKey, key)) {
      setVisible(el.id, visibilityByKey[key]);
    }
  });

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

    window.renderMala();
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

  window.renderMala = function renderMala() {
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
    window.renderMala();
  };

  window.resetMala = function () {
    if (!confirm('Reset this mala count?')) return;
    state.mala.count = 0;
    saveMala();
    window.renderMala();
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
    const audio = byId('audioElement') || byId('karaokeAudio') || byId('bhajanAudio');
    if (!audio || audio.dataset.karaokeBound === 'true') return;
    audio.dataset.karaokeBound = 'true';

    audio.addEventListener('timeupdate', () => {
      const lines = asArray(window.activeKaraokeLyrics);
      let active = -1;

      lines.forEach((l, i) => {
        if (l.time !== undefined && l.time !== null && l.time !== '' && Number.isFinite(Number(l.time)) && Number(l.time) <= audio.currentTime) active = i;
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

  initKaraokePlayer();

  window.toggleKaraokePlayback = function () {
    const audio = byId('karaokeAudio') || byId('bhajanAudio');
    if (!audio) return notify('Audio player is not on this page.');

    if (audio.paused) {
      audio.play().catch(() => notify('Tap play again to allow audio playback.'));
    } else {
      audio.pause();
    }
  };

  window.renderAudioList = function renderAudioList(items) {
    const host = byId('audioList') || byId('audioPlayerTrackList');
    if (!host) return;

    host.innerHTML = items.length ? items.map(a => {
      const audioUrl = a.audioUrl || a.link || a.url || '';
      return `
        <button type="button" class="audio-item rounded-full border border-amber-300/50 bg-white/10 px-3 py-2 text-left font-semibold text-white hover:bg-amber-400 hover:text-stone-950 focus-visible:outline focus-visible:outline-2" data-audio-id="${escapeHtml(a.id)}" ${audioUrl ? '' : 'disabled'}>
          ${escapeHtml(a.title || 'Bhajan')} ${audioUrl ? '▶ चलाएँ' : 'लिंक नहीं'}
        </button>
      `;
    }).join('') : '<span class="text-stone-300">अभी कोई भजन उपलब्ध नहीं है।</span>';

    host.querySelectorAll('[data-audio-id]').forEach(btn => {
      btn.onclick = () => {
        const a = items.find(x => x.id === btn.dataset.audioId);
        const audioUrl = a?.audioUrl || a?.link || a?.url;

        if (!audioUrl) return notify('Audio URL has not been uploaded yet.');

        const audio = byId('audioElement') || byId('karaokeAudio') || byId('bhajanAudio');

        if (audio) {
          audio.src = audioUrl;
          audio.load();
          setText('audioPlayerTitle', a.title || 'भजन एवं आरती');
          window.activeKaraokeLyrics = asArray(a.lyrics).map(line =>
            typeof line === 'string' ? { text: line } : line
          );

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

  window.renderPdfLibrary = function renderPdfLibrary(items) {
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

  window.renderCommunity = function renderCommunity(posts) {
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
    window.renderCommunity(communityPostsCache);
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

  // Owner Studio — exam visibility, schedule, question-set and maintenance controls.
  // Writes use the existing Firestore documents; server-side rules must restrict these
  // writes to the owner role. Controls are generated only for authenticated owners.
  function renderOwnerStudio() {
    const host = byId('ownerStudioContent') || byId('ownerStudio');
    if (!host || !state.isOwner) return;
    const c = state.examConfig || {};
    const maintenance = state.maintenance || {};
    const visibleChecks = [
      ['dailyQuizVisible', 'दैनिक ज्ञान परीक्षा'],
      ['mockVisible', 'मॉक परीक्षा अनुभाग'],
      ['mock1Visible', 'मॉक परीक्षा 1'],
      ['mock2Visible', 'मॉक परीक्षा 2'],
      ['mainExamVisible', 'मुख्य परीक्षा'],
      ['enrollmentVisible', 'विद्यार्थी पंजीकरण'],
      ['resultsVisible', 'परिणाम सत्यापन'],
      ['separateExamPortalVisible', 'अलग परीक्षा पोर्टल']
    ];
    const schedules = [
      ['quizStartAtMs', 'दैनिक परीक्षा शुरू होने का समय'],
      ['mock1StartAtMs', 'मॉक परीक्षा 1 शुरू होने का समय'],
      ['mock2StartAtMs', 'मॉक परीक्षा 2 शुरू होने का समय'],
      ['mainStartAtMs', 'मुख्य परीक्षा शुरू होने का समय']
    ];
    const toLocalInput = value => {
      const ms = Number(value);
      if (!Number.isFinite(ms) || ms <= 0) return '';
      const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
      return d.toISOString().slice(0, 16);
    };
    const checkbox = (key, label) => `<label class="flex min-h-12 items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 text-sm"><input class="h-5 w-5 accent-emerald-800" type="checkbox" data-exam-visibility="${key}" ${c[key] !== false ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`;
    host.innerHTML = `
      <section class="space-y-4 rounded-2xl border border-emerald-200 bg-stone-50 p-4 sm:p-5">
        <div><h2 class="text-xl font-extrabold text-emerald-950">Owner Studio — परीक्षा नियंत्रण</h2>
        <p class="mt-1 break-words text-xs text-stone-600">Signed in as ${escapeHtml(state.user?.email || state.user?.uid || 'Owner')}</p></div>
        <div><h3 class="mb-2 font-bold text-stone-900">विद्यार्थियों को दिखने वाले अनुभाग</h3>
          <div class="grid gap-2 sm:grid-cols-2">${visibleChecks.map(([key,label]) => checkbox(key,label)).join('')}</div>
        </div>
        <div><h3 class="mb-2 font-bold text-stone-900">परीक्षा का समय</h3>
          <div class="grid gap-3 sm:grid-cols-2">${schedules.map(([key,label]) => `<label class="block text-sm font-semibold text-stone-700">${escapeHtml(label)}<input type="datetime-local" data-exam-schedule="${key}" value="${toLocalInput(c[key])}" class="mt-1 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3"></label>`).join('')}</div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">${[['quizDurationMinutes','दैनिक क्विज़ अवधि'],['mock1DurationMinutes','Mock 1 अवधि'],['mock2DurationMinutes','Mock 2 अवधि'],['mainDurationMinutes','Main Exam अवधि']].map(([key,label]) => `<label class="block text-sm font-semibold text-stone-700">${label} (मिनट)<input type="number" min="1" max="360" data-exam-duration="${key}" value="${Math.max(1, Number(c[key] || c.durationMinutes) || CONFIG.defaultExamMinutes)}" class="mt-1 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3"></label>`).join('')}</div>
        </div>
        <div><h3 class="mb-2 font-bold text-stone-900">प्रश्न सेट</h3><div class="grid gap-3 sm:grid-cols-2">
          ${[['quizQuestionSet','दैनिक परीक्षा'],['mock1QuestionSet','मॉक परीक्षा 1'],['mock2QuestionSet','मॉक परीक्षा 2'],['mainQuestionSet','मुख्य परीक्षा']].map(([key,label]) => `<label class="text-sm font-semibold text-stone-700">${label}<select data-exam-set="${key}" class="mt-1 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3">${['set1','set2','set3','set4'].map(v => `<option value="${v}" ${(c[key] || 'set1') === v ? 'selected' : ''}>${v.toUpperCase()}</option>`).join('')}</select></label>`).join('')}
        </div></div>
        <div><h3 class="mb-2 font-bold text-stone-900">रखरखाव मोड</h3>
          <label class="block text-sm font-semibold text-stone-700">मोड<select data-maintenance-mode class="mt-1 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3">
            ${[['off','बंद'],['both','वेबसाइट और ऐप'],['web_only','केवल वेबसाइट'],['phone_only','केवल मोबाइल/ऐप']].map(([v,l]) => `<option value="${v}" ${(maintenance.globalMode || 'off') === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select></label>
          <label class="mt-3 block text-sm font-semibold text-stone-700">रखरखाव संदेश<textarea data-maintenance-message rows="2" class="mt-1 w-full rounded-xl border border-stone-300 bg-white p-3">${escapeHtml(maintenance.message || '')}</textarea></label>
        </div>
        <div class="flex flex-wrap gap-2"><button type="button" data-owner-save-exam class="min-h-12 rounded-xl bg-emerald-900 px-5 font-bold text-white">परीक्षा सेटिंग सेव करें</button>
        <button type="button" data-owner-save-maintenance class="min-h-12 rounded-xl border border-amber-400 bg-amber-50 px-5 font-bold text-amber-950">रखरखाव सेव करें</button>
        <button type="button" data-owner-refresh class="min-h-12 rounded-xl border border-stone-300 bg-white px-5 font-bold">डेटा रीफ़्रेश करें</button></div>
      </section>

      <section class="mt-5 space-y-4 rounded-2xl border border-amber-200 bg-white p-4 sm:p-5">
        <div>
          <h2 class="text-xl font-extrabold text-emerald-950">Question Studio — प्रश्न अपलोड एवं समीक्षा</h2>
          <p class="mt-1 text-sm text-stone-600">JSON, CSV या Excel फ़ाइल चुनें। पहले Preview में प्रश्न और Answer Key जाँचें; अपलोड किए गए प्रश्न Draft रहेंगे, जब तक आप उन्हें प्रकाशित न करें।</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="text-sm font-semibold text-stone-700">परीक्षा संग्रह
            <select data-question-target class="mt-1 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3">
              <option value="quiz">दैनिक क्विज़</option>
              <option value="mockExam_1">मॉक परीक्षा 1</option>
              <option value="mockExam_2">मॉक परीक्षा 2</option>
              <option value="mainExamQuestions">मुख्य परीक्षा</option>
            </select>
          </label>
          <label class="text-sm font-semibold text-stone-700">Question Set
            <select data-question-set class="mt-1 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3">
              <option value="set1">Set 1</option><option value="set2">Set 2</option>
              <option value="set3">Set 3</option><option value="set4">Set 4</option>
            </select>
          </label>
        </div>
        <label class="block text-sm font-semibold text-stone-700">Question file (.json, .csv, .xlsx, .xls)
          <input data-question-file type="file" accept=".json,.csv,.xlsx,.xls,application/json,text/csv" class="mt-1 block min-h-12 w-full rounded-xl border border-stone-300 bg-white p-2">
        </label>
        <div class="flex flex-wrap gap-2">
          <button type="button" data-question-preview class="min-h-12 rounded-xl border border-emerald-800 px-5 font-bold text-emerald-900">Preview & Validate</button>
          <button type="button" data-question-upload disabled class="min-h-12 rounded-xl bg-emerald-900 px-5 font-bold text-white disabled:opacity-40">Upload as Draft</button>
          <button type="button" data-question-template class="min-h-12 rounded-xl border border-stone-300 bg-stone-50 px-5 font-bold">Download CSV Template</button>
        </div>
        <div data-question-preview-output class="hidden rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm" aria-live="polite"></div>
        <p class="text-xs leading-relaxed text-stone-500">Required columns: question, A, B, C, D, correctAnswer. correctAnswer may be A/B/C/D or 0/1/2/3. Optional: marks, negativeMarks, explanation, id.</p>
      </section>

      <section class="mt-5 space-y-3 rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 class="text-xl font-extrabold text-emerald-950">Question Bank — Draft Review & Publish</h2>
          <p class="mt-1 text-sm text-stone-600">Uploaded questions are drafts. Review them and publish only after verifying the answer key.</p></div>
          <button type="button" data-owner-load-questions class="min-h-12 rounded-xl border border-emerald-800 px-5 font-bold text-emerald-900">प्रश्न सूची लोड करें</button>
        </div>
        <p data-owner-question-bank-status class="text-sm text-stone-600">पहले परीक्षा संग्रह और Set चुनें, फिर प्रश्न सूची लोड करें।</p>
        <div data-owner-question-bank-list class="space-y-3"></div>
      </section>

      <section class="mt-5 space-y-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 class="text-xl font-extrabold text-emerald-950">Exam Checking Desk — जाँच एवं परिणाम</h2>
          <p class="mt-1 text-sm text-stone-600">Mock/Main उत्तर-पत्र देखें, अंक जाँचें और परिणाम प्रकाशित करें। Daily Quiz के परिणाम स्वतः प्रकाशित होते हैं।</p></div>
         
<div class="flex flex-wrap gap-2">
  <button type="button" data-owner-load-submissions class="min-h-12 rounded-xl bg-emerald-900 px-4 font-bold text-white">उत्तर-पत्र लोड करें</button>
  <button type="button" data-export-results-csv class="min-h-12 rounded-xl border border-emerald-800 px-4 font-bold text-emerald-900">CSV Export</button>
  <button type="button" data-export-results-xlsx class="min-h-12 rounded-xl border border-emerald-800 px-4 font-bold text-emerald-900">Excel Export</button>
  <button type="button" data-export-results-pdf class="min-h-12 rounded-xl border border-amber-500 bg-amber-50 px-4 font-bold text-amber-900">PDF Export</button>
</div>

        <p data-owner-submission-status class="text-sm text-stone-600" aria-live="polite">उत्तर-पत्र देखने के लिए “उत्तर-पत्र लोड करें” दबाएँ।</p>
        <div data-owner-submission-list class="space-y-3"></div>
      </section> 
      <section class="mt-5 space-y-4 rounded-2xl border border-emerald-200 bg-stone-50 p-4 sm:p-5">
        <div>
          <h2 class="text-xl font-extrabold text-emerald-950">Assistant Editor — Invite & Permissions</h2>
          <p class="mt-1 text-sm text-stone-600">10-digit phone number is required. Email is optional.</p>
        </div>
        <label class="block text-sm font-semibold">Editor Name
          <input data-editor-name maxlength="100" class="mt-1 min-h-12 w-full rounded-xl border border-stone-300 bg-white p-3">
        </label>
        <label class="block text-sm font-semibold">Phone Number
          <input data-editor-phone inputmode="numeric" maxlength="10" placeholder="10-digit mobile number" class="mt-1 min-h-12 w-full rounded-xl border border-stone-300 bg-white p-3">
        </label>
        <label class="block text-sm font-semibold">Email (optional)
          <input data-editor-email type="email" class="mt-1 min-h-12 w-full rounded-xl border border-stone-300 bg-white p-3">
        </label>
        <div class="grid gap-2 sm:grid-cols-2">
          <label class="flex items-center gap-2"><input type="checkbox" data-editor-permission="media"> Media/PDF/Audio Editing</label>
          <label class="flex items-center gap-2"><input type="checkbox" data-editor-permission="quizDrafts"> Daily Quiz Drafts</label>
          <label class="flex items-center gap-2"><input type="checkbox" data-editor-permission="examReview"> Exam Checking & Results</label>
          <label class="flex items-center gap-2"><input type="checkbox" data-editor-permission="notifications"> Sending Notifications</label>
        </div>
        <button type="button" data-editor-invite class="min-h-12 rounded-xl bg-emerald-900 px-5 font-bold text-white">Invite Editor</button>
        <p data-editor-invite-status class="text-sm text-stone-600" aria-live="polite"></p>
        <div class="border-t border-stone-200 pt-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-bold text-emerald-950">Invitations & Acceptance Status</h3>
            <button type="button" data-editor-refresh class="min-h-10 rounded-lg border border-emerald-800 px-3 text-sm font-bold text-emerald-900">Refresh status</button>
          </div>
          <div data-editor-invite-list class="mt-3 space-y-2 text-sm" aria-live="polite">Invitation status लोड हो रहा है…</div>
        </div>
      </section>

      <section class="mt-5 space-y-3 rounded-2xl border border-amber-200 bg-white p-4 sm:p-5">
        <div>
          <h2 class="text-xl font-extrabold text-emerald-950">सुरक्षित डेटा डाउनलोड केंद्र</h2>
          <p class="mt-1 text-sm text-stone-600">पंजीकृत सदस्यों और प्रकाशित परिणामों को CSV, Excel या PDF में डाउनलोड करें। संवेदनशील डेटा केवल Owner access से पढ़ा जाता है।</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" data-export-members="csv" class="min-h-12 rounded-xl border border-emerald-800 px-4 font-bold text-emerald-900">Members CSV</button>
          <button type="button" data-export-members="xlsx" class="min-h-12 rounded-xl bg-emerald-900 px-4 font-bold text-white">Members Excel</button>
          <button type="button" data-export-members="pdf" class="min-h-12 rounded-xl border border-amber-500 bg-amber-50 px-4 font-bold text-amber-900">Members PDF</button>
        </div>
      </section>
 `;
    
    host.querySelector('[data-editor-invite]')?.addEventListener('click', async () => {
      if (!requireOwner()) return;

      const status = host.querySelector('[data-editor-invite-status]');
      const name = String(host.querySelector('[data-editor-name]')?.value || '').trim().slice(0, 100);
      const phone = String(host.querySelector('[data-editor-phone]')?.value || '').replace(/\D/g, '');
      const email = String(host.querySelector('[data-editor-email]')?.value || '').trim().toLowerCase();
      const permissions = {};

      host.querySelectorAll('[data-editor-permission]').forEach(el => {
        permissions[el.dataset.editorPermission] = el.checked;
      });

      if (phone.length !== 10) {
        if (status) status.textContent = 'सही 10-digit phone number दर्ज करें।';
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (status) status.textContent = 'Email सही नहीं है।';
        return;
      }

      if (!Object.values(permissions).some(Boolean)) {
        if (status) status.textContent = 'कम-से-कम एक permission चुनें।';
        return;
      }

      const button = host.querySelector('[data-editor-invite]');
      button.disabled = true;

      try {
        const phoneE164 = '+91' + phone;
        const invitationId = 'phone_' + phoneE164;
        const inviteRef = collection('pending_editors').doc(invitationId);
        const existing = await inviteRef.get();
        if (existing.exists && existing.data()?.status === 'pending') {
          if (status) status.textContent = 'इस फोन नंबर का pending invitation पहले से मौजूद है।';
          return;
        }
        if (existing.exists && existing.data()?.status === 'claimed') {
          if (status) status.textContent = 'यह invitation पहले स्वीकार हो चुका है। दोबारा invite करने से पहले पुरानी editor role हटाएँ।';
          return;
        }
        await inviteRef.set({
          fullName: name, phone, phoneE164, email: email || '', permissions,
          status: 'pending', createdBy: state.user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        if (status) status.textContent = 'Invitation सेव हो गया। संबंधित user को अगली बार इसी verified phone से login करने पर Accept/Decline सूचना दिखेगी।';
        host.querySelector('[data-editor-name]').value = '';
        host.querySelector('[data-editor-phone]').value = '';
        host.querySelector('[data-editor-email]').value = '';
        host.querySelectorAll('[data-editor-permission]').forEach(el => { el.checked = false; });
      } catch (error) {
        console.error('Editor invitation failed:', error);
        if (status) status.textContent = 'Invitation सेव नहीं हुआ। Firestore rules जाँचें।';
      } finally {
        button.disabled = false;
      }
    });

    host.querySelector('[data-editor-refresh]')?.addEventListener('click', async () => {
      if (!requireOwner()) return;
      const list = host.querySelector('[data-editor-invite-list]');
      if (list) list.textContent = 'Invitation status लोड हो रहा है…';
      try {
        const snap = await collection('pending_editors').limit(100).get();
        const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
        if (!list) return;
        list.innerHTML = rows.length ? rows.map(row => {
          const p = row.permissions || {};
          const labels = [
            p.media ? 'Media/PDF/Audio' : '',
            p.quizDrafts ? 'Daily Quiz Drafts' : '',
            p.examReview ? 'Exam Checking' : '',
            p.notifications ? 'Notifications' : ''
          ].filter(Boolean).join(' · ') || 'No permissions';
          const claimed = row.status === 'claimed';
          return '<article class="rounded-xl border p-3 ' + (claimed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50') + '">' +
            '<div class="flex flex-wrap items-start justify-between gap-2"><strong>' + escapeHtml(row.fullName || 'Assistant Editor') + '</strong>' +
            '<span class="rounded-full px-2 py-1 text-xs font-bold ' + (claimed ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-200 text-amber-950') + '">' +
            (claimed ? 'Accepted' : escapeHtml(row.status || 'pending')) + '</span></div>' +
            '<p class="mt-1 text-xs text-stone-600">Phone: ' + escapeHtml(row.phone || '') + (row.email ? ' · ' + escapeHtml(row.email) : '') + '</p>' +
            '<p class="mt-1 text-xs text-stone-600">' + escapeHtml(labels) + '</p>' +
            (row.claimedUid ? '<p class="mt-1 text-xs text-emerald-800">Role accepted and linked to the signed-in Firebase account.</p>' : '<p class="mt-1 text-xs text-stone-500">Awaiting acceptance on verified phone login.</p>') +
          '</article>';
        }).join('') : '<p class="text-sm text-stone-500">अभी कोई editor invitation नहीं है।</p>';
      } catch (error) {
        console.error('Editor invite status load failed:', error);
        if (list) list.textContent = 'Invitation status नहीं लोड हुआ। Firestore rules जाँचें।';
      }
    });

    host.querySelector('[data-owner-save-exam]')?.addEventListener('click', async () => {
      if (!requireOwner()) return;
      const update = {};
      host.querySelectorAll('[data-exam-visibility]').forEach(el => { update[el.dataset.examVisibility] = el.checked; });
      host.querySelectorAll('[data-exam-schedule]').forEach(el => {
        update[el.dataset.examSchedule] = el.value ? new Date(el.value).getTime() : 0;
      });
      host.querySelectorAll('[data-exam-set]').forEach(el => {
        update[el.dataset.examSet] = ['set1','set2','set3','set4'].includes(el.value) ? el.value : 'set1';
      });
      host.querySelectorAll('[data-exam-duration]').forEach(el => {
        const duration = Number(el.value);
        const key = el.dataset.examDuration;
        if (key) update[key] = Number.isFinite(duration) ? Math.min(360, Math.max(1, duration)) : CONFIG.defaultExamMinutes;
      });
      update.durationMinutes = update.mainDurationMinutes || CONFIG.defaultExamMinutes;
      update.updatedAt = serverTimestamp();
      update.updatedBy = state.user.uid;
      try {
        await collection('examConfig').doc('current').set(update, { merge: true });
        state.examConfig = { ...state.examConfig, ...update };
        window.renderExamVisibility();
        renderExamCountdowns();
        notify('परीक्षा सेटिंग सेव हो गईं।', 'success');
      } catch (error) {
        console.error('Exam settings save failed:', error);
        notify('सेटिंग सेव नहीं हुईं। Firestore rules में Owner write permission जाँचें।', 'error');
      }
    });
    host.querySelector('[data-owner-save-maintenance]')?.addEventListener('click', async () => {
      if (!requireOwner()) return;
      const update = {
        globalMode: host.querySelector('[data-maintenance-mode]')?.value || 'off',
        message: String(host.querySelector('[data-maintenance-message]')?.value || '').trim().slice(0, 500),
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid
      };
      try {
        await collection('settings').doc('maintenance').set(update, { merge: true });
        state.maintenance = { ...state.maintenance, ...update };
        applyMaintenanceSettings();
        notify('रखरखाव सेटिंग सेव हो गई।', 'success');
      } catch (error) {
        console.error('Maintenance settings save failed:', error);
        notify('रखरखाव सेटिंग सेव नहीं हुईं। Firestore rules जाँचें।', 'error');
      }
    });
    host.querySelector('[data-owner-refresh]')?.addEventListener('click', () => {
      clearSubscriptions();
      startLiveListeners();
      notify('Portal listeners refreshed.', 'success');
    });
    host.querySelector('[data-editor-refresh]')?.click();

    // Question upload workflow: validate first, then explicitly save as draft.
    let questionImportPreview = null;
    let questionImportFile = null;
    const previewOutput = host.querySelector('[data-question-preview-output]');
    const uploadButton = host.querySelector('[data-question-upload]');
    const getQuestionImportOptions = () => ({
      target: host.querySelector('[data-question-target]')?.value || 'mainExamQuestions',
      set: host.querySelector('[data-question-set]')?.value || 'set1'
    });

    host.querySelector('[data-question-file]')?.addEventListener('change', event => {
      questionImportFile = event.target.files?.[0] || null;
      questionImportPreview = null;
      if (uploadButton) uploadButton.disabled = true;
      if (previewOutput) {
        previewOutput.classList.add('hidden');
        previewOutput.textContent = '';
      }
    });
    
    // Invalidate an old preview whenever the exam or set changes.
    const invalidateQuestionPreview = () => {
      questionImportPreview = null;

      if (uploadButton) uploadButton.disabled = true;

      if (previewOutput) {
        previewOutput.classList.add('hidden');
        previewOutput.textContent = '';
      }
    };

    host.querySelector('[data-question-target]')
      ?.addEventListener('change', invalidateQuestionPreview);

    host.querySelector('[data-question-set]')
      ?.addEventListener('change', invalidateQuestionPreview);


    host.querySelector('[data-question-preview]')?.addEventListener('click', async () => {
      if (!requireOwner()) return;
      const file = host.querySelector('[data-question-file]')?.files?.[0];
      if (!file) {
        notify('पहले JSON, CSV या Excel फ़ाइल चुनें।', 'error');
        return;
      }
      const { target, set } = getQuestionImportOptions();
      const button = host.querySelector('[data-question-preview]');
      if (button) button.disabled = true;
      try {
        const result = await window.BishnoiApp.importExamQuestionFile(file, target, set, { previewOnly: true });
        questionImportPreview = result;
        questionImportFile = file;
        if (previewOutput) {
          previewOutput.classList.remove('hidden');
          previewOutput.innerHTML =
            '<p class="font-extrabold text-emerald-900">कुल: ' + result.total +
            ' · सही: ' + result.valid + ' · त्रुटि: ' + result.invalid + '</p>' +
            (result.rows.length ? '<ul class="mt-2 space-y-2">' + result.rows.slice(0, 12).map(row =>
              '<li class="rounded-lg border p-2 ' + (row.valid ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50') + '">' +
              '<strong>Row ' + row.row + '</strong> — ' + escapeHtml(row.question || '(खाली प्रश्न)') +
              (row.errors.length ? '<p class="mt-1 text-red-800">' + escapeHtml(row.errors.join(' · ')) + '</p>' : '<span class="ml-2 text-emerald-800">Valid</span>') +
              '</li>'
            ).join('') + '</ul>' : '<p class="mt-2 text-red-800">फ़ाइल में प्रश्न नहीं मिले।</p>') +
            (result.rows.length > 12 ? '<p class="mt-2 text-xs text-stone-500">पहले 12 rows दिखाए गए हैं।</p>' : '');
        }
        if (uploadButton) uploadButton.disabled = !result.total || result.invalid > 0;
        notify(result.invalid ? 'Preview में त्रुटियाँ हैं। Upload से पहले उन्हें ठीक करें।' : 'Preview सही है। अब Upload as Draft दबाएँ।', result.invalid ? 'error' : 'success');
      } catch (error) {
        console.error('Question import preview failed:', error);
        if (previewOutput) {
          previewOutput.classList.remove('hidden');
          previewOutput.textContent = error.message || 'Preview नहीं बन सका।';
        }
        notify(error.message || 'Question preview failed.', 'error');
      } finally {
        if (button) button.disabled = false;
      }
    });

    host.querySelector('[data-question-upload]')?.addEventListener('click', async () => {
      
      if (!requireOwner()) return;

      if (host.dataset.questionUploadInProgress === 'true') {
        notify('Question upload पहले से चल रहा है। कृपया प्रतीक्षा करें।', 'error');
        return;
      }

      if (!questionImportPreview || !questionImportFile || questionImportPreview.invalid) {
        notify('पहले valid Preview तैयार करें।', 'error');
        return;
      }

      host.dataset.questionUploadInProgress = 'true';

      const { target, set } = getQuestionImportOptions();
      const button = host.querySelector('[data-question-upload]');
      if (button) button.disabled = true;
      try {
        const result = await window.BishnoiApp.importExamQuestionFile(questionImportFile, target, set);
        questionImportPreview = null;
        if (previewOutput) {
          previewOutput.classList.remove('hidden');
          previewOutput.textContent = result.valid + ' प्रश्न Draft के रूप में अपलोड हुए। छात्रों को दिखाने से पहले Owner review और publish आवश्यक है।';
        }
        const fileInput = host.querySelector('[data-question-file]');
        if (fileInput) fileInput.value = '';
        questionImportFile = null;
        notify(result.valid + ' प्रश्न Draft के रूप में अपलोड हुए।', 'success');
      } catch (error) {
        console.error('Question upload failed:', error);
        if (error.preview && previewOutput) {
          previewOutput.classList.remove('hidden');
          previewOutput.textContent = error.message;
        }
        notify(error.message || 'Question upload failed.', 'error');
     
     } finally {
  if (button) {
    button.disabled =
      !questionImportPreview || questionImportPreview.invalid > 0;
  }
  host.dataset.questionUploadInProgress = 'false';
}

    });

    host.querySelector('[data-question-template]')?.addEventListener('click', () => {
      const csv = 'question,A,B,C,D,correctAnswer,marks,negativeMarks,explanation,id\r\n"उदाहरण प्रश्न","विकल्प A","विकल्प B","विकल्प C","विकल्प D","A",1,0,"व्याख्या","q_example"\r\n';
      const blob = new Blob(['\\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Bishnoism_Question_Template.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    host.querySelector('[data-owner-load-submissions]')?.addEventListener('click', async () => {
      if (!requireOwner()) return;
      const status = host.querySelector('[data-owner-submission-status]');
      const list = host.querySelector('[data-owner-submission-list]');
      if (status) status.textContent = 'उत्तर-पत्र लोड हो रहे हैं…';
      if (list) list.innerHTML = '';
      try {
        const sources = [
          ['main', CONFIG.submissionCollections.main],
          ['mock1', CONFIG.submissionCollections.mock1],
          ['mock2', CONFIG.submissionCollections.mock2]
        ];
        const groups = await Promise.all(sources.map(async ([mode, sourceCollection]) => {
          const snap = await collection(sourceCollection).limit(100).get();
          return snap.docs.map(doc => ({ ...doc.data(), id: doc.id, mode: doc.data()?.mode || mode, sourceCollection }));
        }));
        const rows = groups.flat().sort(
  (a, b) => timestampMillis(b.submittedAt) - timestampMillis(a.submittedAt)
);

// Load published answer keys from each relevant exam question collection.
// Keep manual checking available even if an answer-key query fails.
const answerKeyByQuestionId = new Map();

const questionCollections = [
  ...new Set(
    rows
      .map(row => CONFIG.examCollections[row.mode] || row.questionSetKey)
      .filter(Boolean)
  )
];

await Promise.all(questionCollections.map(async questionCollection => {
  try {
    const questionSnap = await collection(questionCollection)
      .where('published', '==', true)
      .get();

    questionSnap.docs.forEach(questionDoc => {
      const question = questionDoc.data() || {};
      const set = question.questionSet || question.questionSetKey || question.set || 'set1';

      if (!['set1', 'set2', 'set3', 'set4'].includes(set)) return;

     
const answerKey = {
  set,
  answer: question.correctAnswer ?? question.answerIndex ?? question.ans
};

// Match the Firestore document ID.
answerKeyByQuestionId.set(
  questionCollection + '::' + questionDoc.id,
  answerKey
);

// Also match the stored question ID for legacy records.
if (question.id !== undefined && question.id !== null) {
  answerKeyByQuestionId.set(
    questionCollection + '::' + String(question.id),
    answerKey
  );
}

    });
  } catch (error) {
    console.warn(
      'Could not load answer keys for ' + questionCollection,
      error.code || error.message
    );
  }
}));
        if (status) status.textContent = rows.length ? rows.length + ' उत्तर-पत्र मिले। जाँचकर अंक प्रकाशित करें।' : 'कोई Mock/Main उत्तर-पत्र नहीं मिला।';
        if (!list) return;
        list.innerHTML = rows.map(row => {
          const snapshots = Array.isArray(row.questionSnapshots) ? row.questionSnapshots : [];


          const snapshotTotal = snapshots.length
            ? snapshots.reduce((sum, question) => {
                const marks = Number(question.marks ?? question.points ?? 1);
                return sum + (
                  Number.isFinite(marks) && marks > 0 ? marks : 1
                );
              }, 0)
            : 0;

          const configuredTotal = Number(row.totalMarks ?? row.maxMarks);

          const total = Math.max(
            1,
            Number.isFinite(configuredTotal) && configuredTotal > 0
              ? configuredTotal
              : snapshotTotal > 0
                ? snapshotTotal
                : Number(row.total ?? row.totalQuestions ?? 1)
          );

          const modeLabel = ({ main: 'मुख्य परीक्षा', mock1: 'मॉक परीक्षा 1', mock2: 'मॉक परीक्षा 2' })[row.mode] || row.mode;
          const answers = row.answers && typeof row.answers === 'object' ? row.answers : {};
const questionCollection =
  CONFIG.examCollections[row.mode] || row.questionSetKey || '';

const rowSet = ['set1', 'set2', 'set3', 'set4'].includes(row.questionSet)
  ? row.questionSet
  : 'set1';

const questionHtml = snapshots.map((q, qi) => {
  const questionId = String(q.id || qi);
  const answer = answers[q.id] ?? answers[qi];
  const options = Array.isArray(q.options) ? q.options : [];

  const normalizeAnswerIndex = value => {
    if (value === undefined || value === null || value === '') return -1;

    const text = String(value).trim();

    if (/^\d+$/.test(text)) {
      const number = Number(text);
      return Number.isInteger(number) && number >= 0 && number < options.length
        ? number
        : -1;
    }

    if (/^[A-D]$/i.test(text)) {
      const index = text.toUpperCase().charCodeAt(0) - 65;
      return index < options.length ? index : -1;
    }

    return options.findIndex(option => {
      const optionText = typeof option === 'object'
        ? (option.text || option.label || option.value || '')
        : option;

      return String(optionText).trim().toLowerCase() === text.toLowerCase();
    });
  };

  const selectedIndex = normalizeAnswerIndex(answer);

  const keyRecord = answerKeyByQuestionId.get(
    questionCollection + '::' + questionId
  );

  const correctIndex = keyRecord && keyRecord.set === rowSet
    ? normalizeAnswerIndex(keyRecord.answer)
    : -1;

  const answerLabel = index => index >= 0
    ? String.fromCharCode(65 + index)
    : 'पहचान उपलब्ध नहीं';

  let checkingLabel = 'Answer key उपलब्ध नहीं';

  if (correctIndex >= 0) {
    checkingLabel = selectedIndex < 0
      ? 'उत्तर नहीं दिया'
      : selectedIndex === correctIndex
        ? 'सही उत्तर ✓'
        : 'गलत उत्तर';
  }

  return '<div class="rounded-lg border border-stone-200 bg-white p-3">' +
    '<p class="font-semibold">' +
    (qi + 1) + '. ' + escapeHtml(q.question || 'प्रश्न उपलब्ध नहीं') +
    '</p>' +
    '<p class="mt-1 text-xs text-stone-600">विद्यार्थी का उत्तर: <strong>' +
    escapeHtml(answerLabel(selectedIndex)) + '</strong></p>' +
    '<p class="mt-1 text-xs font-bold text-emerald-800">सही उत्तर: ' +
    escapeHtml(answerLabel(correctIndex)) + '</p>' +
    '<p class="mt-1 text-xs font-bold ' +
    (checkingLabel === 'सही उत्तर ✓'
      ? 'text-emerald-800'
      : checkingLabel === 'गलत उत्तर'
        ? 'text-red-700'
        : 'text-stone-600') +
    '">' + escapeHtml(checkingLabel) + '</p>' +
    (options.length
      ? '<ul class="mt-2 list-inside list-disc text-xs text-stone-600">' +
        options.map((option, index) =>
          '<li>' + String.fromCharCode(65 + index) + '. ' +
          escapeHtml(typeof option === 'object'
            ? (option.text || option.label || option.value || '')
            : option) +
          (index === correctIndex ? ' ✓ Answer Key' : '') +
          '</li>'
        ).join('') +
        '</ul>'
      : '') +
    '</div>';
}).join('');
          const isPublished = row.manualCheckStatus === 'published';
          return '<article class="rounded-2xl border border-stone-200 bg-white p-4" data-check-card="' + escapeHtml(row.id) + '">' +
            '<div class="flex flex-wrap items-start justify-between gap-3"><div><h3 class="font-extrabold text-emerald-950">' + escapeHtml(row.name || 'विद्यार्थी') +
            '</h3><p class="mt-1 text-xs text-stone-600">' + escapeHtml(modeLabel) + ' · ' + escapeHtml(String(row.questionSet || 'set1').toUpperCase()) +
            ' · रोल: ' + escapeHtml(row.rollNumber || '—') + '</p><p class="text-xs text-stone-600">फोन: ' + escapeHtml(row.studentPhone || '—') +
            ' · हल किए: ' + Number(row.attempted || 0) + '/' + total + '</p></div><span data-check-status class="rounded-full px-3 py-1 text-xs font-bold ' +
            (isPublished ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900') + '">' + (isPublished ? 'परिणाम प्रकाशित' : 'जाँच बाकी') +
            '</span></div><details class="mt-3"><summary class="cursor-pointer font-bold text-emerald-900">उत्तर-पत्र देखें (' + snapshots.length + ' प्रश्न)</summary><div class="mt-3 space-y-2">' +
            (questionHtml || '<p class="text-sm text-stone-500">इस उत्तर-पत्र में प्रश्नों का snapshot उपलब्ध नहीं है।</p>') + '</div></details>' +
            '<div class="mt-4 grid gap-3 sm:grid-cols-2"><label class="text-sm font-semibold">अंतिम अंक (अधिकतम ' + total + ')' +
            '<input type="number" min="0" max="' + total + '" step="0.5" data-check-score value="' + Math.min(total, Math.max(0, Number(row.checkedScore ?? 0))) +
            '" class="mt-1 min-h-12 w-full rounded-xl border border-stone-300 px-3"></label><label class="text-sm font-semibold">टिप्पणी' +
            '<textarea data-check-feedback rows="2" class="mt-1 w-full rounded-xl border border-stone-300 p-3">' + escapeHtml(row.feedback || '') +
            '</textarea></label></div><button type="button" data-publish-result data-submission-id="' + escapeHtml(row.id) +
            '" data-source-collection="' + escapeHtml(row.sourceCollection) + '" data-mode="' + escapeHtml(row.mode) +
'" data-uid="' + escapeHtml(row.uid || row.studentUid || row.userId || '') + '" data-total="' + total + '" data-name="' + escapeHtml(row.name || 'विद्यार्थी') +
            '" data-phone="' + escapeHtml(row.studentPhone || '') + '" data-roll="' + escapeHtml(row.rollNumber || '') +
            '" data-set="' + escapeHtml(row.questionSet || 'set1') + '" class="mt-3 min-h-12 w-full rounded-xl bg-emerald-900 px-4 font-bold text-white">' +
            (isPublished ? 'परिणाम अपडेट करें' : 'जाँच सेव करें और परिणाम प्रकाशित करें') + '</button></article>';
        }).join('');

        list.querySelectorAll('[data-publish-result]').forEach(button => {
          button.addEventListener('click', async () => {
            if (!requireOwner()) return;
            const card = button.closest('[data-check-card]');
            const score = Number(card?.querySelector('[data-check-score]')?.value);
            const total = Number(button.dataset.total);
            const uid = button.dataset.uid;
            if (!Number.isFinite(score) || score < 0 || score > total) return notify('अंक 0 से ' + total + ' के बीच दर्ज करें।', 'error');
          if (!uid) {
           return notify(
          'इस उत्तर-पत्र में Firebase UID नहीं मिला। विद्यार्थी की पहचान जाँचें; सुरक्षा के लिए परिणाम अभी प्रकाशित नहीं किया गया।',
          'error'
           );
           }

            button.disabled = true;
            try {
              const sourceCollection = button.dataset.sourceCollection;
              const submissionId = button.dataset.submissionId;
              const mode = button.dataset.mode;
              const feedback = String(card.querySelector('[data-check-feedback]')?.value || '').trim().slice(0, 1000);
              const publishedAt = serverTimestamp();
              
              const submissionRef = state.db
                .collection(sourceCollection)
                .doc(submissionId);

              const resultRef = collection('publishedResults')
                .doc('manual_' + mode + '_' + submissionId);

              const batch = state.db.batch();

              batch.set(submissionRef, {
                manualCheckStatus: 'published',
                checkedScore: score,
                feedback,
                checkedAt: publishedAt,
                checkedBy: state.user.uid
              }, { merge: true });

              batch.set(resultRef, {
                uid,
                studentPhone: button.dataset.phone || '',
                studentIdentityKey: button.dataset.phone || ('uid:' + uid),
                name: button.dataset.name || 'विद्यार्थी',
                rollNumber: button.dataset.roll || null,
                mode,
                questionSet: button.dataset.set || 'set1',
                score,
                total,
                status: 'published',
                feedback,
                sourceCollection,
                sourceSubmissionId: submissionId,
                publishedAt,
                publishedBy: state.user.uid
              }, { merge: true });

              await batch.commit();

notify('जाँच सेव हुई और परिणाम प्रकाशित हो गया।', 'success');
              const badge = card.querySelector('[data-check-status]');
              if (badge) { badge.textContent = 'परिणाम प्रकाशित'; badge.className = 'rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-900'; }
              button.textContent = 'परिणाम अपडेट करें';
            } catch (error) {
              console.error('Manual result publish failed:', error);
              notify('परिणाम प्रकाशित नहीं हुआ। Firestore rules में submission और publishedResults write permissions जाँचें।', 'error');
            } finally { button.disabled = false; }
          });
        });
      } catch (error) {
        console.error('Could not load exam submissions:', error);
        if (status) status.textContent = 'उत्तर-पत्र लोड नहीं हुए। Firestore rules में submission collections की read permission जाँचें।';
        notify('उत्तर-पत्र लोड नहीं हुए।', 'error');
      }
    });

    async function exportPublishedExamResults(format) {
      if (!requireOwner()) return;

      try {
        const snap = await collection('publishedResults').limit(500).get();

        const rows = snap.docs
          .map(doc => {
            const r = doc.data();
            return {
              'Roll Number': r.rollNumber || '',
              'Full Name': r.name || '',
              "Father's Name": r.fatherName || r.fathersName || '',
              'Phone Number': r.studentPhone || '',
              'Email': r.email || '',
              'Assigned Exam Set': r.questionSet || '',
              'Exam Mode': r.mode || '',
              'Status': r.status || '',
              'Score': r.score ?? '',
              'Total Marks': r.total ?? ''
            };
          });

        if (!rows.length) {
          notify('Export के लिए प्रकाशित परिणाम नहीं मिले।', 'error');
          return;
        }

        if (format === 'xlsx') {
          window.BishnoiApp.exportRowsXlsx(rows, 'exam-results.xlsx');
        } else if (format === 'pdf') {
          window.BishnoiApp.exportRowsPdf(rows, 'exam-results.pdf', 'Published Exam Results');
        } else {
          window.BishnoiApp.exportRowsCsv(rows, 'exam-results.csv');
        }

        notify(rows.length + ' परिणाम export किए गए।', 'success');
      } catch (error) {
        console.error('Results export failed:', error);
        notify('Export विफल हुआ। Owner access और Firestore rules जाँचें।', 'error');
      }
    }

    host.querySelector('[data-export-results-csv]')
      ?.addEventListener('click', () => exportPublishedExamResults('csv'));

    host.querySelector('[data-export-results-xlsx]')
      ?.addEventListener('click', () => exportPublishedExamResults('xlsx'));
    host.querySelector('[data-export-results-pdf]')
      ?.addEventListener('click', () => exportPublishedExamResults('pdf'));

    async function exportRegisteredMembers(format) {
      if (!requireOwner()) return;
      try {
        const snap = await collection('examEnrolledStudents').get();
        const rows = snap.docs.map(doc => {
          const d = doc.data() || {};
          return {
            'Roll Number': d.rollNumber || d.roll || d.admissionRollNumber || '',
            'Full Name': d.fullName || d.name || d.displayName || '',
            "Father's Name": d.fatherName || d.fathersName || '',
            'Phone Number': normalizeStudentPhone(d.phone || d.phoneNumber || d.mobile || d.studentPhone || ''),
            'Email': d.email || '',
            'Assigned Exam Set': d.questionSet || d.examSet || d.assignedExamSet || state.examConfig?.mainQuestionSet || 'set1',
            'Exam': d.examName || d.examTitle || 'मुख्य परीक्षा',
            'Status': d.verificationStatus || d.status || (d.verified === true ? 'verified' : 'pending')
          };
        });
        if (!rows.length) {
          notify('डाउनलोड के लिए पंजीकरण रिकॉर्ड नहीं मिले।', 'error');
          return;
        }
        const fileBase = 'Bishnoism_Registered_Members';
        if (format === 'xlsx') window.BishnoiApp.exportRowsXlsx(rows, fileBase + '.xlsx');
        else if (format === 'pdf') window.BishnoiApp.exportRowsPdf(rows, fileBase + '.pdf', 'Registered Members');
        else window.BishnoiApp.exportRowsCsv(rows, fileBase + '.csv');
        notify(rows.length + ' पंजीकरण रिकॉर्ड export किए गए।', 'success');
      } catch (error) {
        console.error('Registered member export failed:', error);
        notify('पंजीकरण डेटा export नहीं हुआ। Owner access और Firestore rules जाँचें।', 'error');
      }
    }

    host.querySelectorAll('[data-export-members]').forEach(button => {
      button.addEventListener('click', () => exportRegisteredMembers(button.dataset.exportMembers));
    });

    host.querySelector('[data-owner-load-questions]')?.addEventListener('click', async () => {
      if (!requireOwner()) return;
      const target = host.querySelector('[data-question-target]')?.value || 'mainExamQuestions';
      const set = host.querySelector('[data-question-set]')?.value || 'set1';
      const status = host.querySelector('[data-owner-question-bank-status]');
      const list = host.querySelector('[data-owner-question-bank-list]');
      if (status) status.textContent = 'प्रश्न लोड हो रहे हैं…';
      if (list) list.innerHTML = '';
      try {
        const snap = await collection(target).where('questionSet', '==', set).limit(100).get();
        const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (status) status.textContent = rows.length ? rows.length + ' प्रश्न मिले। Draft प्रश्नों की Answer Key जाँचकर प्रकाशित करें।' : 'इस संग्रह और Set में प्रश्न नहीं मिले।';
        if (!list) return;
        list.innerHTML = rows.map(row => {
          const options = Array.isArray(row.options) ? row.options : [];
          const correct = Number(row.correctAnswer ?? row.answerIndex ?? row.ans);
          return '<article class="rounded-xl border border-stone-200 bg-stone-50 p-3" data-question-card="' + escapeHtml(row.id) + '">' +
            '<div class="flex flex-wrap items-start justify-between gap-2"><p class="font-bold text-stone-900">' + escapeHtml(row.question || row.text || 'प्रश्न') +
            '</p><span class="rounded-full px-2 py-1 text-xs font-bold ' + (row.published === true ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900') +
            '">' + (row.published === true ? 'Published' : 'Draft') + '</span></div>' +
            '<ul class="mt-2 space-y-1 text-sm text-stone-700">' + options.map((option, index) =>
              '<li class="' + (index === correct ? 'font-bold text-emerald-800' : '') + '">' + String.fromCharCode(65 + index) + '. ' + escapeHtml(typeof option === 'object' ? (option.text || '') : option) +
              (index === correct ? ' ✓ Answer Key' : '') + '</li>'
            ).join('') + '</ul><label class="mt-3 block text-sm font-semibold text-stone-700">सही उत्तर बदलें<select data-answer-key-edit data-question-id="' + escapeHtml(row.id) + '" class="mt-1 min-h-10 w-full rounded-lg border border-stone-300 bg-white p-2">' +
            options.map((option, index) => '<option value="' + index + '"' + (index === correct ? ' selected' : '') + '>' + String.fromCharCode(65 + index) + ' — ' + escapeHtml(typeof option === 'object' ? (option.text || option.label || option.value || '') : option) + '</option>').join('') +
            '</select></label><button type="button" data-save-answer-key data-question-id="' + escapeHtml(row.id) + '" class="mt-2 min-h-10 rounded-lg border border-emerald-800 px-4 font-bold text-emerald-900">Answer Key सेव करें</button>' +
            '<p class="mt-2 text-xs text-stone-500">ID: ' + escapeHtml(row.id) + ' · Marks: ' + Number(row.marks || 1) + '</p>' +
            (row.published === true
              ? '<button type="button" data-unpublish-question data-question-id="' + escapeHtml(row.id) + '" class="mt-3 min-h-10 rounded-lg border border-amber-500 px-4 font-bold text-amber-900">Unpublish</button>'
              : '<button type="button" data-publish-question data-question-id="' + escapeHtml(row.id) + '" class="mt-3 min-h-10 rounded-lg bg-emerald-900 px-4 font-bold text-white">Answer Key सही है — Publish</button>') +
            '</article>';
        }).join('');
        list.querySelectorAll('[data-save-answer-key]').forEach(button => {
          button.addEventListener('click', async () => {
            if (!requireOwner()) return;
            const id = button.dataset.questionId;
            const select = [...list.querySelectorAll('[data-answer-key-edit]')].find(el => el.dataset.questionId === id);
            const answerIndex = Number(select?.value);
            if (!select || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= select.options.length) {
              notify('Answer Key के लिए valid विकल्प चुनें।', 'error'); return;
            }
            button.disabled = true;
            try {
              await collection(target).doc(id).set({
                correctAnswer: answerIndex, answerIndex, published: false, status: 'draft',
                publishedBy: null, publishedAt: null, updatedAt: serverTimestamp(), updatedBy: state.user.uid
              }, { merge: true });
              notify('Answer Key सेव हुआ। सुरक्षा के लिए प्रश्न Draft में रखा गया; जाँचकर फिर publish करें।', 'success');
              host.querySelector('[data-owner-load-questions]')?.click();
            } catch (error) {
              console.error('Answer key update failed:', error);
              notify('Answer Key सेव नहीं हुआ। Firestore rules जाँचें।', 'error');
              button.disabled = false;
            }
          });
        });
        list.querySelectorAll('[data-publish-question], [data-unpublish-question]').forEach(button => {
          button.addEventListener('click', async () => {
            if (!requireOwner()) return;
            const id = button.dataset.questionId;
            const publish = button.hasAttribute('data-publish-question');
            button.disabled = true;
            try {
              await collection(target).doc(id).set({
                published: publish,
                status: publish ? 'published' : 'draft',
                publishedBy: publish ? state.user.uid : null,
                publishedAt: publish ? serverTimestamp() : null,
                updatedAt: serverTimestamp(),
                updatedBy: state.user.uid
              }, { merge: true });
              notify(publish ? 'प्रश्न प्रकाशित हो गया।' : 'प्रश्न Draft में वापस कर दिया गया।', 'success');
              host.querySelector('[data-owner-load-questions]')?.click();
            } catch (error) {
              console.error('Question publish state update failed:', error);
              notify('प्रश्न की publish स्थिति सेव नहीं हुई। Firestore rules जाँचें।', 'error');
              button.disabled = false;
            }
          });
        });
      } catch (error) {
        console.error('Question bank load failed:', error);
        if (status) status.textContent = 'प्रश्न लोड नहीं हुए। Firestore rules में चुने गए question collection की read permission जाँचें।';
        notify('Question bank लोड नहीं हुई।', 'error');
      }
    });
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

  // Phone is the canonical student-facing identity; Firebase UID remains the
  // authorization key for existing Firestore rules and backward compatibility.
  // A phone-only document-key migration must be paired with matching rules/data migration.
  function normalizeStudentPhone(value) {
    
const digits = String(value || '').replace(/\D/g, '');

    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits.length === 10 ? digits : '';
  }

  function getStudentIdentity() {
    const profile = state.profile || {};
    const user = state.user || {};
    const phone = normalizeStudentPhone(
      user.phoneNumber || profile.verifiedPhone || profile.phone || profile.phoneNumber || profile.mobile || user.phone || ''
    );
    const name = String(profile.fullName || profile.displayName || profile.name || user.displayName || '').trim();
    const rollNumber = String(profile.rollNumber || profile.roll || profile.admissionRollNumber || '').trim();
    return {
      uid: user.uid || '',
      phone,
      identityKey: phone || (user.uid ? 'uid:' + user.uid : ''),
      name,
      rollNumber,
      email: user.email || profile.email || ''
    };
  }

  window.BishnoiApp = window.BishnoiApp || {};
  window.BishnoiApp.getStudentIdentity = getStudentIdentity;

  // Exam utilities
  const ACTIVE_EXAM_STORAGE_KEY = 'bishnoi_active_exam_v1';

  // Android WebView may destroy its renderer while the app is backgrounded.
  // Keep a local copy as well as the legacy sessionStorage copy; the deadline
  // remains the original endAt timestamp and is never extended on recovery.
  function readPersistedExam() {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      try {
        const raw = storage && storage.getItem(ACTIVE_EXAM_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (error) {
        console.warn('Could not read saved exam progress from browser storage.', error);
      }
    }
    return null;
  }

  function persistActiveExam() {
    const exam = state.exam;
    if (!state.user || !exam?.active || exam.submitted) return;
    const payload = JSON.stringify({
      uid: state.user.uid,
      studentPhone: getStudentIdentity().phone || '',
      studentIdentityKey: getStudentIdentity().identityKey || ('uid:' + state.user.uid),
      mode: exam.mode,
      questionSet: exam.questionSet || 'set1',
      questions: exam.questions,
      index: exam.index,
      answers: exam.answers,
      review: exam.review,
      endAt: exam.endAt,
      durationMinutes: exam.durationMinutes,
      tabSwitches: exam.tabSwitches || 0,
      kicked: exam.kicked === true
    });
    let saved = false;
    for (const storage of [window.localStorage, window.sessionStorage]) {
      try {
        if (storage) {
          storage.setItem(ACTIVE_EXAM_STORAGE_KEY, payload);
          saved = true;
        }
      } catch (error) {
        console.warn('Active exam progress could not be stored in browser storage.', error);
      }
    }
    if (!saved) console.warn('Exam progress could not be persisted; browser storage is unavailable.');
  }

  function clearPersistedExam() {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      try { storage?.removeItem(ACTIVE_EXAM_STORAGE_KEY); } catch (_) {}
    }
  }

  // pagehide fires more reliably than beforeunload in WebViews and when a
  // browser suspends a page. Persist locally only; do not depend on a network
  // request completing during teardown.
  if (!window.__bishnoiExamPageHideBound) {
    window.addEventListener('pagehide', () => {
      try { persistActiveExam(); } catch (error) {
        console.warn('Could not save exam progress on pagehide.', error);
      }
    });
    window.__bishnoiExamPageHideBound = true;
  }

  window.restoreActiveExamForUser = function restoreActiveExamForUser() {
    if (!state.user) return;
    const saved = readPersistedExam();
    if (!saved) return;
    if (saved.uid !== state.user.uid) {
      clearPersistedExam();
      return;
    }
    const currentIdentity = getStudentIdentity();
    if (saved.studentPhone && currentIdentity.phone && saved.studentPhone !== currentIdentity.phone) {
      clearPersistedExam();
      notify('इस डिवाइस पर सहेजी परीक्षा का पंजीकृत मोबाइल नंबर बदल गया है। Owner से जाँच करवाएँ।', 'error');
      return;
    }
    if (!saved.mode || !Array.isArray(saved.questions) || !saved.questions.length || !Number(saved.endAt)) {
      clearPersistedExam();
      return;
    }

    window.stopExamResources();
    state.exam = {
      active: true,
      mode: saved.mode,
      questionSet: saved.questionSet || 'set1',
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
        window.stopExamResources();
        setText('examResult', 'परीक्षा अस्थायी रूप से लॉक की गई है। आपके उत्तर इसी टैब में सुरक्षित हैं; व्यवस्थापक से अनुमति लें।');
        setVisible('submitExamBtn', false);
        setVisible('nextQuestionBtn', false);
        setVisible('previousQuestionBtn', false);
        setVisible('exitExamWorkspace', true);
      }
    };
    document.addEventListener('visibilitychange', state.exam.visibilityHandler);
   
    if (state.exam.kicked) {
      setText(
        'examResult',
        'परीक्षा अस्थायी रूप से लॉक है। Owner से पुनः प्रवेश की अनुमति की प्रतीक्षा करें।'
      );

      setVisible('submitExamBtn', false);
      setVisible('nextQuestionBtn', false);
      setVisible('previousQuestionBtn', false);
      setVisible('exitExamWorkspace', true);
    }

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
    const uid = state.user.uid;
    const mode = exam.mode;
    const payload = {
      uid,
      studentPhone: getStudentIdentity().phone || '',
      studentIdentityKey: getStudentIdentity().identityKey || ('uid:' + uid),
      rollNumber: getStudentIdentity().rollNumber || '',
      name: getStudentIdentity().name || state.user.displayName || state.user.email || 'विद्यार्थी',
      mode,
      status,
      currentQuestion: Number(exam.index || 0) + 1,
      totalQuestions: exam.questions?.length || 0,
      tabSwitches: Number(exam.tabSwitches || 0),
      endAtMs: Number(exam.endAt || 0),
      updatedAt: serverTimestamp(),
      ...extra
    };

    // Read first so progress updates never overwrite the original exam deadline.
    // A missing session may only be created at the beginning or as a late-entry request.
    return ref.get().then(snapshot => {
      if (!snapshot.exists && status !== 'active' && status !== 'late_request') {
        console.warn('Refusing to create a missing exam session with status:', status);
        return;
      }

      if (!snapshot.exists) {
        payload.endAt = Number(exam.endAt) > 0
          ? firebase.firestore.Timestamp.fromMillis(Number(exam.endAt))
          : null;
      } else {
        // Keep endAt immutable; Firestore rules intentionally reject student deadline changes.
        delete payload.endAt;
      }

      return ref.set(payload, { merge: true });
    }).catch(error => {
      console.error('Exam session status could not be saved:', status, error);
      // Session telemetry must not create unhandled rejections in timers/visibility callbacks.
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

  window.stopExamResources = function stopExamResources() {
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
        <div class="sticky top-0 z-20 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 flex flex-col gap-3 rounded-t-3xl border-b border-stone-200 bg-white/95 p-4 shadow-sm backdrop-blur sm:p-6">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-widest font-extrabold text-emerald-800">EXAM IN PROGRESS · CBT</p>
              <h2 id="portalExamTitle" class="font-yatra text-xl sm:text-2xl text-forest">परीक्षा</h2>
              <p id="examQuestionNumber" class="mt-1 text-xs font-semibold text-stone-500" aria-live="polite">प्रश्न 0/0</p>
            </div>
            <div class="shrink-0 rounded-xl bg-forest px-4 py-3 text-center text-white shadow">
              <span class="block text-[10px] uppercase tracking-wide text-emerald-100">शेष समय</span>
              <strong id="examTimer" class="font-mono text-xl tabular-nums">--:--</strong>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-lg bg-stone-50 p-2"><span class="block text-stone-500">विद्यार्थी</span><strong id="cbtStudentName" class="break-words text-forest">—</strong></div>
            <div class="rounded-lg bg-stone-50 p-2"><span class="block text-stone-500">रोल नंबर</span><strong id="cbtRollNumber" class="break-words text-forest">—</strong></div>
            <div class="rounded-lg bg-stone-50 p-2"><span class="block text-stone-500">सत्यापित फोन</span><strong id="cbtPhoneNumber" class="break-words text-forest">—</strong></div>
            <div class="rounded-lg bg-stone-50 p-2"><span class="block text-stone-500">परीक्षा सेट</span><strong id="cbtQuestionSet" class="break-words text-forest">—</strong></div>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div class="min-w-0 space-y-4">
            <div id="examQuestion" class="space-y-4 text-sm text-stone-800"></div>
            <button id="markReviewBtn" type="button" class="min-h-12 w-full rounded-xl border border-amber-500 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">⚑ समीक्षा के लिए चिह्नित करें</button>
          </div>
          <aside class="h-fit rounded-2xl border border-stone-200 bg-stone-50 p-3" aria-label="प्रश्न पैलेट">
            <h3 class="font-bold text-forest">प्रश्न पैलेट</h3>
            <p class="mt-1 text-[11px] text-stone-600">हरा: उत्तर दिया · धूसर: बाकी · पीला: समीक्षा</p>
            <div id="examQuestionPalette" class="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5"></div>
          </aside>
        </div>
        <p id="examResult" class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-semibold text-emerald-900" role="status" aria-live="polite"></p>
        <div class="grid grid-cols-2 gap-2">
          <button id="previousQuestionBtn" type="button" class="rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-700">← पिछला प्रश्न</button>
          <button id="nextQuestionBtn" type="button" class="rounded-xl bg-forest px-4 py-3 text-sm font-bold text-white">उत्तर सेव करें और अगला →</button>
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
      byId('markReviewBtn').addEventListener('click', () => {
        const exam = state.exam;
        if (!exam?.active || exam.kicked || exam.lockedAtDeadline) return;
        const question = exam.questions[exam.index];
        const key = String(question?.id || exam.index);
        exam.review = exam.review && typeof exam.review === 'object' ? exam.review : {};
        exam.review[key] = !exam.review[key];
        persistActiveExam();
        renderExamQuestion();
      });
      byId('exitExamWorkspace').addEventListener('click', () => {
        setVisible('portalExamWorkspace', false);
        window.renderExamVisibility();
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

  function renderExamQuestionPalette(exam = state.exam) {
    const palette = byId('examQuestionPalette');
    if (!palette || !exam || !Array.isArray(exam.questions)) return;
    palette.innerHTML = exam.questions.map((item, index) => {
      const key = String(item?.id || index);
      const answered = Object.prototype.hasOwnProperty.call(exam.answers || {}, key);
      const marked = !!(exam.review && exam.review[key]);
      const current = index === exam.index;
      const stateClass = marked
        ? 'border-amber-600 bg-amber-300 text-amber-950'
        : answered
          ? 'border-emerald-700 bg-emerald-700 text-white'
          : 'border-stone-300 bg-white text-stone-700';
      return `<button type="button" data-palette-index="${index}" aria-label="प्रश्न ${index + 1}${answered ? ', उत्तर दिया' : ', उत्तर नहीं दिया'}${marked ? ', समीक्षा के लिए चिह्नित' : ''}" aria-current="${current ? 'step' : 'false'}" class="min-h-12 rounded-lg border text-sm font-extrabold ${stateClass} ${current ? 'ring-2 ring-offset-2 ring-forest' : ''}" ${(exam.kicked || exam.lockedAtDeadline) ? 'disabled' : ''}>${index + 1}</button>`;
    }).join('');
    palette.querySelectorAll('[data-palette-index]').forEach(button => {
      button.addEventListener('click', () => {
        const nextIndex = Number(button.getAttribute('data-palette-index'));
        if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= exam.questions.length) return;
        exam.index = nextIndex;
        persistActiveExam();
        renderExamQuestion();
      });
    });
  }

  function renderExamQuestion(renderOptions = {}) {
    const exam = state.exam;
    const question = exam.questions[exam.index];
    const workspace = ensureExamWorkspace(exam.mode);
    const host = byId('examQuestion');

    if (!host || !question) return;

    const questionOptions = Array.isArray(question.options)
      ? question.options
      : Array.isArray(question.opts)
        ? question.opts
        : [question.optionA, question.optionB, question.optionC, question.optionD].filter(value => value !== undefined && value !== null && value !== '');

    const answerKey = question.id || exam.index;
    const selectedAnswer = exam.answers[answerKey];

    host.innerHTML = `
      <article class="space-y-4">
        <h3 class="text-base sm:text-lg font-bold leading-relaxed text-stone-900">${exam.index + 1}. ${escapeHtml(question.question || question.text || question.q || question.title || 'प्रश्न')}</h3>
        ${questionOptions.length ? `
          <div class="space-y-2">
            ${questionOptions.map((option, index) => `
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
        renderExamQuestionPalette(exam);
      });
    });

    const profile = state.profile || {};
    const identity = getStudentIdentity();
    setText('cbtStudentName', identity.name || 'पंजीकृत विद्यार्थी');
    setText('cbtRollNumber', identity.rollNumber || 'पंजीकरण रिकॉर्ड में उपलब्ध होने पर दिखेगा');
    const verifiedPhone = normalizeStudentPhone(state.user?.phoneNumber || '');
    setText('cbtPhoneNumber', verifiedPhone || 'Firebase verified phone उपलब्ध नहीं');
    setText('cbtQuestionSet', String(exam.questionSet || 'set1').toUpperCase());
    renderExamQuestionPalette(exam);

    if (workspace && !renderOptions.noScroll) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.startPortalExam = async function (mode = 'quiz') {
    if (!requireUser()) return;
    if (state.profile?.gmailVerified !== true) {
      notify('परीक्षा देने से पहले Google सत्यापन पूरा करना ज़रूरी है।', 'error');
      authApi.openAuthModal();
      return;
    }

    // Every exam mode requires an existing, owner-confirmed enrollment.
    // Firestore Rules must enforce the same check to prevent direct API bypasses.
    if (['quiz', 'mock1', 'mock2', 'main'].includes(mode)) {
      try {
        const enrollmentSnap = await collection('examEnrolledStudents').doc(state.user.uid).get();
        const enrollment = enrollmentSnap.exists ? enrollmentSnap.data() || {} : null;
        if (!enrollment || enrollment.verificationStatus !== 'confirmed') {
          notify('परीक्षा देने से पहले पंजीकरण कराएँ और Owner से पुष्टि करवाएँ। पंजीकरण फॉर्म खोल दिया गया है।', 'error');
          if (document.documentElement.hasAttribute('data-exam-embed')) {
            document.documentElement.setAttribute('data-exam-embed', 'enrollment');
          }
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
      const message = 'इस परीक्षा का शुरू होने का समय Owner Studio में सेट नहीं है। व्यवस्थापक से समय निर्धारित करने को कहें।';
      const countdownId = ({ quiz: 'quizCountdown', mock1: 'mock1Countdown', mock2: 'mock2Countdown', main: 'mainExamCountdown' })[mode];
      if (countdownId) setText(countdownId, '⚠️ ' + message);
      notify(message, 'error');
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
    const questionSetConfigKey = ({ quiz: 'quizQuestionSet', mock1: 'mock1QuestionSet', mock2: 'mock2QuestionSet', main: 'mainQuestionSet' })[mode];
    const selectedQuestionSet = ['set1','set2','set3','set4'].includes(config[questionSetConfigKey]) ? config[questionSetConfigKey] : 'set1';
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
          const docSet = ['set1','set2','set3','set4'].includes(data.questionSet || data.questionSetKey || data.set) ? (data.questionSet || data.questionSetKey || data.set) : 'set1';
          return data.published === true && data.status !== 'draft' && docSet === selectedQuestionSet;
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

      window.stopExamResources();

      state.exam = {
        active: true,
        mode,
        questionSet: selectedQuestionSet,
        questionSetKey: collectionName,
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

    if (!state.user || state.profile?.gmailVerified !== true) {
      notify('उत्तर जमा करने के लिए Google सत्यापन पूरा करना ज़रूरी है।', 'error');
      return;
    }
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
        const optionsForScoring = Array.isArray(question.options)
          ? question.options
          : Array.isArray(question.opts)
            ? question.opts
            : [question.optionA, question.optionB, question.optionC, question.optionD].filter(value => value !== undefined && value !== null && value !== '');
        const normalizeAnswerIndex = value => {
          if (value === undefined || value === null || value === '') return null;
          if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
            const number = Number(value);
            return Number.isInteger(number) ? number : null;
          }
          const letter = String(value).trim().toUpperCase().replace(/[.)]$/, '');
          if (/^[A-D]$/.test(letter)) return letter.charCodeAt(0) - 65;
          const optionIndex = optionsForScoring.findIndex(option => {
            const optionText = typeof option === 'object'
              ? (option.text || option.label || option.value || '')
              : option;
            return String(optionText).trim().toLowerCase() === String(value).trim().toLowerCase();
          });
          return optionIndex >= 0 ? optionIndex : null;
        };
        if (normalizeAnswerIndex(answer) !== null &&
            normalizeAnswerIndex(answer) === normalizeAnswerIndex(correctAnswer)) correct++;
      }
    });

    const instantResult = exam.mode === 'quiz';
    const result = {
      uid: state.user.uid,
      studentPhone: getStudentIdentity().phone || '',
      studentIdentityKey: getStudentIdentity().identityKey || ('uid:' + state.user.uid),
      name: getStudentIdentity().name || state.user.displayName || state.user.email || 'प्रतिभागी',
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
      questionSet: exam.questionSet || 'set1',
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
          studentPhone: getStudentIdentity().phone || '',
          studentIdentityKey: getStudentIdentity().identityKey || ('uid:' + state.user.uid),
          sourceCollection: CONFIG.submissionCollections[exam.mode],
          sourceSubmissionId: submissionRef.id,
          mode: exam.mode,
          questionSet: exam.questionSet || 'set1',
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
      window.stopExamResources();
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
    traceStartup('initPortal:called');
    if (state.initialized) {
      traceStartup('guard-return: state.initialized');
      console.error('[startup] initPortal skipped: already initialized');
      return;
    }
    traceStartup('initPortal:enter');
    state.initialized = true;

    // Firebase is initialized before any module that may use Auth or Firestore.
    const firebaseInitialized = safeStep('Firebase', () => {
      if (!firebaseReady()) {
        if (typeof firebase === 'undefined' || typeof firebase.initializeApp !== 'function') {
          throw new Error('Firebase compat SDK is not available.');
        }
        traceStartup('firebase:initializeApp:before');
        try {
          firebase.initializeApp(CONFIG.firebase);
          traceStartup('firebase:initializeApp:after');
        } catch (error) {
          traceStartup('firebase:initializeApp:ERROR ' + (error?.message || error));
          console.error('[startup] Firebase initializeApp failed:', error);
          throw error;
        }
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
    traceStartup('ready:set ' + window.__bishnoiReady);

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
      safeStep('सार्वजनिक सूचनाएँ', window.initPublicNotifications);
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

  if (!requireUser() || !state.db) {
    if (status) status.textContent = 'पहले लॉगिन करें।';
    return;
  }

  const uid = state.user.uid;
  const normalizeName = value =>
    String(value || '')
      .normalize('NFC')
      .trim()
      .toLocaleLowerCase()
      .replace(/\s+/g, ' ');

  const normalizeDob = value => {
    if (!value) return '';
    if (typeof value.toDate === 'function') {
      const date = value.toDate();
      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return [
        value.getFullYear(),
        String(value.getMonth() + 1).padStart(2, '0'),
        String(value.getDate()).padStart(2, '0')
      ].join('-');
    }
    return String(value).trim().slice(0, 10);
  };

  const roll = String(byId('resultLookupRoll')?.value || '')
    .trim()
    .toUpperCase();
  const name = normalizeName(byId('resultLookupName')?.value);
  const dob = normalizeDob(byId('resultLookupDob')?.value);

  state.resultsIdentityVerified = false;
  window.renderMyResults();

  if (!roll || !name || !dob) {
    if (status) {
      status.textContent = 'रोल नंबर, पूरा नाम और जन्म तिथि तीनों भरें।';
    }
    return;
  }

  if (status) status.textContent = 'पंजीकरण रिकॉर्ड जाँचा जा रहा है…';

  try {
    const snap = await state.db
      .collection('examEnrolledStudents')
      .doc(uid)
      .get();

    // Do not apply verification to a different account after an async read.
    if (state.user?.uid !== uid) return;

    if (!snap.exists) {
      if (status) {
        status.textContent = 'इस लॉगिन खाते से जुड़ा पंजीकरण रिकॉर्ड नहीं मिला।';
      }
      return;
    }

    const record = snap.data() || {};

    const expectedRoll = String(record.rollNumber || '')
      .trim()
      .toUpperCase();

    const expectedName = normalizeName(
      record.fullName || record.name || record.displayName
    );

    const expectedDob = normalizeDob(
      record.dateOfBirth || record.dob || record.birthDate
    );

    const matches =
      expectedRoll !== '' &&
      expectedName !== '' &&
      expectedDob !== '' &&
      roll === expectedRoll &&
      name === expectedName &&
      dob === expectedDob &&
      (!record.uid || record.uid === uid);

    if (!matches) {
      if (status) {
        status.textContent =
          'दर्ज विवरण पंजीकरण रिकॉर्ड से मेल नहीं खाते। नाम, रोल नंबर और जन्म तिथि जाँचें।';
      }
      return;
    }

    state.resultsIdentityVerified = true;
    window.renderMyResults();

    if (status) {
      status.textContent =
        'पहचान सत्यापित। आपके प्रकाशित परिणाम नीचे उपलब्ध हैं।';
    }

    byId('myResultsList')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  } catch (error) {
    state.resultsIdentityVerified = false;
    window.renderMyResults();

    if (status) {
      status.textContent =
        'पहचान सत्यापित नहीं हो सकी। लॉगिन और Firestore permissions जाँचें।';
    }

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
        const displayName = profile.displayName || profile.fullName || state.user.displayName || '';
        const googleProfile = (state.user.providerData || []).find(item => item && item.providerId === 'google.com');
        const email = profile.email || googleProfile?.email || state.user.email || 'Google / अन्य लॉगिन खाता';
        const nameInput = byId('profEditName');
        const locationInput = byId('profEditLocation');
        const phoneInput = byId('profEditPhone');
        if (nameInput) nameInput.value = displayName;
        if (locationInput) locationInput.value = profile.location || '';
        if (phoneInput) {
          phoneInput.value = maskMobile(profile.mobile || '');
          phoneInput.readOnly = true;
          phoneInput.setAttribute('aria-readonly', 'true');
        }
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
    window.renderMala();
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

  // The existing HTML and every inline click handler keep this namespace identity.
  window.BishnoiAuth = window.BishnoiAuth || {};
  const authApi = window.BishnoiAuth;
  let authMode = 'login';
  let forgotPasswordUser = null;
  let registrationRetry = null;
  let forgotRetryUsed = false;

  function normalizeMobile(value) {
    return String(value || '').trim().replace(/^\+91/, '').replace(/[\s()-]/g, '');
  }
  function validMobile(value) {
    return /^[6-9]\d{9}$/.test(value);
  }
  function hiddenEmail(mobile) {
    return '91' + mobile + '@jambh-login.app';
  }
  function googleProvider() {
    const provider = new firebase.auth.GoogleAuthProvider();
    if (typeof provider.setCustomParameters === 'function') provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }
  function googleEmailForUser(user, result) {
    const additionalEmail = result?.additionalUserInfo?.profile?.email;
    if (typeof additionalEmail === 'string' && additionalEmail.includes('@')) return additionalEmail;
    const googleData = (user?.providerData || []).find(item => item && item.providerId === 'google.com');
    return googleData?.email || (user?.providerData || []).some(item => item?.providerId === 'google.com' && item.email) ? (googleData?.email || user?.email || '') : '';
  }
  function setAuthMessage(message, kind = 'info') {
    const el = byId('authStatus');
    if (el) {
      el.textContent = message;
      el.dataset.kind = kind;
      el.hidden = !message;
    }
    if (message) notify(message, kind === 'error' ? 'error' : kind === 'success' ? 'success' : 'info');
  }
  function setAuthView(view) {
    ['authLoginView', 'authForgotView', 'authResetView', 'authLinkMobileView'].forEach(id => {
      const el = byId(id);
      if (el) el.classList.toggle('hidden', id !== view);
    });
  }
  function showAuthModal() {
    const modal = byId('authModal');
    if (modal) {
      modal.hidden = false;
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    } else {
      window.promptUserLogin();
    }
  }
  function isGoogleLinked(user) {
    return (user?.providerData || []).some(item => item && item.providerId === 'google.com');
  }
  async function cleanupUnverifiedAccount(user, details) {
    try {
      await user.delete();
      return { deleted: true };
    } catch (deleteError) {
      console.warn('Unverified account deletion failed; keeping it blocked:', deleteError?.code || deleteError?.message);
      try {
        await state.db.collection('users').doc(user.uid).set({
          fullName: details.fullName,
          mobile: details.mobile,
          email: user.email || hiddenEmail(details.mobile),
          gmailVerified: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (profileError) {
        console.error('Could not mark unverified registration:', profileError);
      }
      try { await state.auth.signOut(); } catch (_) {}
      return { deleted: false, error: deleteError };
    }
  }
  function showRetryVerification() {
    const retry = byId('authRetryGoogleButton');
    if (retry) retry.classList.remove('hidden');
  }

  authApi.openAuthModal = function () {
    showAuthModal();
    authApi.setLoginMethod('login');
  };
  authApi.closeAuthModal = function () {
    const modal = byId('authModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
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
  authApi.setLoginMethod = function (method) {
    authMode = method === 'register' ? 'register' : 'login';
    setAuthView('authLoginView');
    const title = byId('authTitle');
    const toggle = byId('authToggleBtn');
    const nameRow = byId('nameRow');
    const confirmRow = byId('registerConfirmRow');
    const password = byId('loginPass');
    const name = byId('loginName');
    const mobile = byId('loginIdentifier');
    const forgot = byId('forgotPasswordButton');
    const retry = byId('authRetryGoogleButton');
    if (title) title.textContent = authMode === 'register' ? 'नया पंजीकरण' : 'लॉगिन करें';
    const submit = byId('authSubmitBtn');
    const confirmPassword = byId('registerPasswordConfirm');
    if (submit) submit.textContent = authMode === 'register' ? 'रजिस्टर करें' : 'लॉगिन करें';
    if (confirmPassword) confirmPassword.required = authMode === 'register';
    if (toggle) toggle.textContent = authMode === 'register' ? 'पहले से सदस्य हैं? लॉगिन करें' : 'नए सदस्य हैं? पंजीकरण करें';
    if (nameRow) nameRow.classList.toggle('hidden', authMode !== 'register');
    if (confirmRow) confirmRow.classList.toggle('hidden', authMode !== 'register');
    if (name) name.required = authMode === 'register';
    if (password) {
      password.minLength = authMode === 'register' ? 8 : 1;
      password.autocomplete = authMode === 'register' ? 'new-password' : 'current-password';
    }
    if (mobile) mobile.autocomplete = 'tel';
    if (forgot) forgot.classList.toggle('hidden', authMode !== 'login');
    if (retry) retry.classList.add('hidden');
    setAuthMessage('');
  };
  authApi.toggleAuthMode = function () {
    authApi.setLoginMethod(authMode === 'login' ? 'register' : 'login');
  };
  authApi.handleAuthSubmit = async function (event) {
    event?.preventDefault?.();
    if (!state.auth || !state.db) return setAuthMessage('लॉगिन सेवा अभी उपलब्ध नहीं है। कृपया दोबारा प्रयास करें।', 'error');
    const mobile = normalizeMobile(byId('loginIdentifier')?.value);
    const password = String(byId('loginPass')?.value || '');
    if (!validMobile(mobile)) return setAuthMessage('कृपया +91 के बिना सही 10 अंकों का मोबाइल नंबर दर्ज करें, जो 6 से 9 से शुरू हो।', 'error');
    if (!password) return setAuthMessage('कृपया पासवर्ड दर्ज करें।', 'error');

    if (authMode === 'register') {
      const fullName = String(byId('loginName')?.value || '').trim();
      const confirm = String(byId('registerPasswordConfirm')?.value || '');
      if (fullName.length < 2) return setAuthMessage('कृपया अपना पूरा नाम दर्ज करें।', 'error');
      if (password.length < 8) return setAuthMessage('पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।', 'error');
      if (password !== confirm) return setAuthMessage('दोनों पासवर्ड एक जैसे नहीं हैं।', 'error');
      registrationRetry = { mobile, password, fullName };
      return authApi.registerWithMobile(registrationRetry);
    }

    try {
      const credential = await state.auth.signInWithEmailAndPassword(hiddenEmail(mobile), password);
      authApi.closeAuthModal();
      setAuthMessage('लॉगिन सफल हुआ।', 'success');
      const profile = await state.db.collection('users').doc(credential.user.uid).get();
      const data = profile.exists ? profile.data() || {} : {};
      if (data.gmailVerified !== true) setAuthMessage('Google सत्यापन पूरा नहीं है। परीक्षा पंजीकरण और परीक्षा देने से पहले Google से सत्यापन करें।', 'error');
    } catch (error) {
      console.error('मोबाइल लॉगिन विफल:', error);
      const messages = {
        'auth/wrong-password': 'पासवर्ड गलत है। दोबारा जाँचें।',
        'auth/invalid-credential': 'मोबाइल नंबर या पासवर्ड गलत है।',
        'auth/user-not-found': 'इस मोबाइल नंबर से कोई खाता नहीं मिला। पहले पंजीकरण करें।',
        'auth/too-many-requests': 'बहुत अधिक प्रयास हुए हैं। कुछ देर बाद दोबारा प्रयास करें।',
        'auth/network-request-failed': 'इंटरनेट कनेक्शन जाँचकर फिर प्रयास करें।',
        'auth/email-already-in-use': 'यह मोबाइल नंबर पहले से पंजीकृत है, कृपया लॉगिन करें।'
      };
      setAuthMessage(messages[error.code] || authErrorMessage(error), 'error');
    }
  };
  authApi.registerWithMobile = async function (details, existingUser = null) {
    if (!state.auth || !state.db) return setAuthMessage('पंजीकरण सेवा अभी उपलब्ध नहीं है।', 'error');
    window.__bishnoiRegistrationInProgress = true;
    let user = existingUser;
    let registrationStage = existingUser ? 'google-link' : 'create-account';
    try {
      if (!user) {
        const result = await state.auth.createUserWithEmailAndPassword(hiddenEmail(details.mobile), details.password);
        user = result.user;
      }
      registrationStage = 'google-link';
      const linked = await user.linkWithPopup(googleProvider());
      user = linked.user || user;
      const googleEmail = googleEmailForUser(user, linked);
      if (!googleEmail) throw Object.assign(new Error('Google खाते का ईमेल नहीं मिला।'), { code: 'auth/google-email-missing' });
      await user.getIdToken?.(true);
      await state.db.collection('users').doc(user.uid).set({
        fullName: details.fullName,
        mobile: details.mobile,
        email: googleEmail,
        gmailVerified: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await state.db.collection('mobileIndex').doc(details.mobile).set({ uid: user.uid });
      state.user = user;
      state.profile = { fullName: details.fullName, mobile: details.mobile, email: googleEmail, gmailVerified: true };
      registrationRetry = null;
      window.__bishnoiRegistrationInProgress = false;
      renderAuthState();
      authApi.closeAuthModal();
      setAuthMessage('पंजीकरण सफल हुआ। विश्नोई डिजिटल मंच में आपका स्वागत है।', 'success');
    } catch (error) {
      console.error('मोबाइल पंजीकरण/Google सत्यापन विफल:', error);
      let cleanup = { deleted: false };
      if (user) cleanup = await cleanupUnverifiedAccount(user, details);
      if (cleanup.deleted && registrationRetry) registrationRetry = { ...registrationRetry, needsRecreate: true };
      window.__bishnoiRegistrationInProgress = false;
      if (error.code === 'auth/email-already-in-use' && registrationStage === 'create-account') {
        return setAuthMessage('यह मोबाइल नंबर पहले से पंजीकृत है, कृपया लॉगिन करें', 'error');
      }
      if (error.code === 'auth/credential-already-in-use' ||
          (error.code === 'auth/email-already-in-use' && registrationStage === 'google-link')) {
        return setAuthMessage('यह Google ईमेल किसी दूसरे खाते से जुड़ा है। उस Google खाते से लॉगिन करें या Owner से सहायता लें।', 'error');
      }
      setAuthMessage('पंजीकरण पूरा करने के लिए Google से सत्यापन ज़रूरी है।', 'error');
      showRetryVerification();
    }
  };
  authApi.retryGoogleVerification = async function () {
    if (!registrationRetry || !state.auth) {
      setAuthMessage('दोबारा सत्यापन के लिए उसी मोबाइल नंबर और पासवर्ड से लॉगिन करके पंजीकरण फिर शुरू करें।', 'error');
      return;
    }
    if (registrationRetry.needsRecreate) {
      const details = { ...registrationRetry };
      delete details.needsRecreate;
      registrationRetry = details;
      await authApi.registerWithMobile(details);
      return;
    }
    try {
      const credential = await state.auth.signInWithEmailAndPassword(hiddenEmail(registrationRetry.mobile), registrationRetry.password);
      const details = { ...registrationRetry };
      delete details.needsRecreate;
      await authApi.registerWithMobile(details, credential.user);
    } catch (error) {
      setAuthMessage(error.code === 'auth/user-not-found'
        ? 'पिछला अस्थायी खाता हट चुका है। कृपया फिर से पंजीकरण करें।'
        : authErrorMessage(error), 'error');
    }
  };
  authApi.signInWithGoogle = async function () {
    if (!state.auth || !window.firebase?.auth) return setAuthMessage('Google लॉगिन अभी उपलब्ध नहीं है।', 'error');
    try {
      const result = await state.auth.signInWithPopup(googleProvider());
      const user = result?.user;
      if (!user) return setAuthMessage('Google लॉगिन पूरा नहीं हुआ। दोबारा प्रयास करें।', 'error');
      const email = googleEmailForUser(user, result) || user.email || '';
      const userRef = state.db.collection('users').doc(user.uid);
      const profileSnap = await userRef.get();
      const old = profileSnap.exists ? profileSnap.data() || {} : {};
      if (!profileSnap.exists || old.gmailVerified !== true || !old.email) {
        await user.getIdToken?.(true);
        await userRef.set({
          fullName: old.fullName || user.displayName || '',
          email,
          gmailVerified: true,
          ...(!profileSnap.exists ? { createdAt: firebase.firestore.FieldValue.serverTimestamp() } : {})
        }, { merge: true });
      }
      state.profile = { ...old, email, gmailVerified: true };
      authApi.closeAuthModal();
      if (!state.profile.mobile) {
        showAuthModal();
        setAuthView('authLinkMobileView');
        setAuthMessage('आप Google से लॉगिन हो गए हैं। चाहें तो अब मोबाइल नंबर और पासवर्ड जोड़ सकते हैं।', 'info');
      } else {
        setAuthMessage('Google लॉगिन सफल हुआ।', 'success');
      }
    } catch (error) {
      console.error('Google लॉगिन विफल:', error);
      const messages = {
        'auth/popup-blocked': 'Google पॉप-अप ब्लॉक हुआ है। इस वेबसाइट के लिए पॉप-अप अनुमति दें।',
        'auth/popup-closed-by-user': 'Google सत्यापन पूरा नहीं हुआ। दोबारा प्रयास करें।',
        'auth/cancelled-popup-request': 'Google लॉगिन रद्द हुआ। दोबारा प्रयास करें।',
        'auth/network-request-failed': 'इंटरनेट कनेक्शन जाँचकर फिर प्रयास करें।',
        'auth/credential-already-in-use': 'यह Google खाता किसी दूसरे खाते से जुड़ा है। उसी खाते से लॉगिन करें।'
      };
      setAuthMessage(messages[error.code] || authErrorMessage(error), 'error');
    }
  };
  authApi.startForgotPassword = function () {
    authMode = 'forgot';
    showAuthModal();
    setAuthView('authForgotView');
    setAuthMessage('पासवर्ड बदलने के लिए पहले उसी Google खाते से सत्यापन करें।', 'info');
  };
  authApi.verifyGoogleForPasswordReset = async function () {
    try {
      const result = await state.auth.signInWithPopup(googleProvider());
      const user = result?.user;
      if (!user) return setAuthMessage('Google सत्यापन पूरा नहीं हुआ।', 'error');
      if (result.additionalUserInfo?.isNewUser) {
        try { await user.delete(); } catch (_) { try { await state.auth.signOut(); } catch (_) {} }
        return setAuthMessage('इस Google खाते से कोई पंजीकरण नहीं मिला', 'error');
      }
      const snap = await state.db.collection('users').doc(user.uid).get();
      const profile = snap.exists ? snap.data() || {} : {};
      const hasPassword = (user.providerData || []).some(item => item?.providerId === 'password');
      if (!profile.mobile || profile.gmailVerified !== true || !hasPassword) {
        return setAuthMessage('इस Google खाते से कोई पंजीकरण नहीं मिला', 'error');
      }
      forgotPasswordUser = user;
      forgotRetryUsed = false;
      setAuthView('authResetView');
      setAuthMessage('Google सत्यापन सफल हुआ। अब नया पासवर्ड बनाएँ।', 'success');
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        return setAuthMessage('पासवर्ड बदलने के लिए Google सत्यापन पूरा करें।', 'error');
      }
      setAuthMessage(error.code === 'auth/network-request-failed' ? 'इंटरनेट कनेक्शन जाँचकर फिर प्रयास करें।' : 'इस Google खाते से कोई पंजीकरण नहीं मिला', 'error');
    }
  };
  authApi.updateForgottenPassword = async function () {
    const password = String(byId('newPassword')?.value || '');
    const confirm = String(byId('confirmNewPassword')?.value || '');
    if (password.length < 8) return setAuthMessage('नया पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।', 'error');
    if (password !== confirm) return setAuthMessage('दोनों नए पासवर्ड एक जैसे नहीं हैं।', 'error');
    if (!forgotPasswordUser) return setAuthMessage('पहले Google से सत्यापन करें।', 'error');
    try {
      await forgotPasswordUser.updatePassword(password);
      forgotPasswordUser = null;
      authApi.closeAuthModal();
      setAuthMessage('पासवर्ड सफलतापूर्वक बदल दिया गया।', 'success');
    } catch (error) {
      if (error.code === 'auth/requires-recent-login' && !forgotRetryUsed) {
        forgotRetryUsed = true;
        try {
          const result = await state.auth.signInWithPopup(googleProvider());
          if (!result?.user || result.user.uid !== forgotPasswordUser.uid) {
            return setAuthMessage('कृपया पहले वाले पंजीकृत Google खाते से ही सत्यापन करें।', 'error');
          }
          forgotPasswordUser = result.user;
          await forgotPasswordUser.updatePassword(password);
          forgotPasswordUser = null;
          authApi.closeAuthModal();
          return setAuthMessage('पासवर्ड सफलतापूर्वक बदल दिया गया।', 'success');
        } catch (retryError) {
          return setAuthMessage('Google से दोबारा सत्यापन नहीं हो सका। फिर प्रयास करें।', 'error');
        }
      }
      setAuthMessage(error.code === 'auth/network-request-failed' ? 'इंटरनेट कनेक्शन जाँचकर फिर प्रयास करें।' : 'पासवर्ड नहीं बदला जा सका। Google से दोबारा सत्यापन करें।', 'error');
    }
  };
  authApi.addMobilePassword = async function () {
    const user = state.auth?.currentUser || state.user;
    const mobile = normalizeMobile(byId('linkMobile')?.value);
    const password = String(byId('linkPassword')?.value || '');
    if (!user) return setAuthMessage('पहले Google से लॉगिन करें।', 'error');
    if (!validMobile(mobile)) return setAuthMessage('कृपया 6 से 9 से शुरू होने वाला सही 10 अंकों का मोबाइल नंबर दर्ज करें।', 'error');
    if (password.length < 8) return setAuthMessage('पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।', 'error');
    try {
      const credential = firebase.auth.EmailAuthProvider.credential(hiddenEmail(mobile), password);
      await user.linkWithCredential(credential);
      await user.getIdToken?.(true);
      const userRef = state.db.collection('users').doc(user.uid);
      const batch = state.db.batch();
      batch.set(userRef, { mobile, email: googleEmailForUser(user) || user.email || '', gmailVerified: true }, { merge: true });
      batch.set(state.db.collection('mobileIndex').doc(mobile), { uid: user.uid });
      await batch.commit();
      state.profile = { ...(state.profile || {}), mobile, gmailVerified: true };
      setAuthMessage('मोबाइल नंबर और पासवर्ड जोड़ दिए गए।', 'success');
      authApi.closeAuthModal();
    } catch (error) {
      console.error('मोबाइल/पासवर्ड जोड़ना विफल:', error);
      const messages = {
        'auth/email-already-in-use': 'यह मोबाइल नंबर पहले से पंजीकृत है।',
        'auth/credential-already-in-use': 'यह मोबाइल नंबर किसी दूसरे खाते से जुड़ा है।',
        'auth/weak-password': 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।',
        'auth/network-request-failed': 'इंटरनेट कनेक्शन जाँचकर फिर प्रयास करें।'
      };
      setAuthMessage(messages[error.code] || 'मोबाइल नंबर और पासवर्ड नहीं जोड़े जा सके।', 'error');
    }
  };
  authApi.skipMobilePassword = function () {
    authApi.closeAuthModal();
    setAuthMessage('आप Google से लॉगिन हैं। मोबाइल/पासवर्ड बाद में भी जोड़ सकते हैं।', 'info');
  };
  
authApi.changeProfilePassword = async function () {
  const user = state.auth?.currentUser || state.user;
  const status = byId('profilePasswordStatus');
  const setStatus = message => {
    if (status) status.textContent = message;
  };

  if (!user) return setStatus('पहले लॉगिन करें।');

  const currentPassword = String(byId('profileCurrentPassword')?.value || '');
  const newPassword = String(byId('profileNewPassword')?.value || '');
  const confirmPassword = String(byId('profileConfirmPassword')?.value || '');

  if (newPassword.length < 8) {
    return setStatus('नया पासवर्ड कम-से-कम 8 अक्षरों का होना चाहिए।');
  }

  if (newPassword !== confirmPassword) {
    return setStatus('दोनों नए पासवर्ड मेल नहीं खाते।');
  }

  const passwordProvider = (user.providerData || []).find(
    item => item && item.providerId === 'password'
  );

  if (!passwordProvider) {
    return setStatus('इस खाते में पासवर्ड लॉगिन सक्रिय नहीं है। Google खाते का पासवर्ड Google में बदलें।');
  }

  if (!currentPassword) {
    return setStatus('वर्तमान पासवर्ड दर्ज करें।');
  }

  try {
    const profile = state.profile || {};
    const mobile = normalizeMobile(profile.mobile || '');
    const loginEmail = user.email || (validMobile(mobile) ? hiddenEmail(mobile) : '');

    if (!loginEmail) {
      return setStatus('लॉगिन पहचान नहीं मिली। दोबारा लॉगिन करके प्रयास करें।');
    }

    const credential = firebase.auth.EmailAuthProvider.credential(
      loginEmail,
      currentPassword
    );

    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);

    ['profileCurrentPassword', 'profileNewPassword', 'profileConfirmPassword']
      .forEach(id => {
        const input = byId(id);
        if (input) input.value = '';
      });

    setStatus('पासवर्ड सफलतापूर्वक बदल दिया गया।');
  } catch (error) {
    console.error('Profile password change failed:', error);

    const messages = {
      'auth/wrong-password': 'वर्तमान पासवर्ड गलत है।',
      'auth/invalid-credential': 'वर्तमान पासवर्ड सही नहीं है।',
      'auth/weak-password': 'नया पासवर्ड अधिक मजबूत रखें।',
      'auth/requires-recent-login': 'दोबारा लॉगिन करके फिर प्रयास करें।',
      'auth/network-request-failed': 'इंटरनेट कनेक्शन जाँचें।'
    };

    setStatus(messages[error.code] || 'पासवर्ड नहीं बदला जा सका। कृपया दोबारा लॉगिन करके प्रयास करें।');
  }
};

authApi.changeProfileMobile = async function () {
  const user = state.auth?.currentUser || state.user;
  const status = byId('profileMobileStatus');

  const setStatus = message => {
    if (status) status.textContent = message;
  };

  if (!user || !state.db) {
    return setStatus('पहले लॉगिन करें।');
  }

  const oldMobile = normalizeMobile(state.profile?.mobile || '');
  const newMobile = normalizeMobile(byId('profileNewMobile')?.value || '');
  const currentPassword = String(
    byId('profileMobileCurrentPassword')?.value || ''
  );
  const newPassword = String(
    byId('profileMobileNewPassword')?.value || ''
  );

  if (!validMobile(newMobile)) {
    return setStatus('सही 10 अंकों का नया मोबाइल नंबर दर्ज करें।');
  }

  if (newMobile === oldMobile) {
    return setStatus('नया नंबर वर्तमान नंबर से अलग होना चाहिए।');
  }

  const hasPasswordProvider = (user.providerData || []).some(
    item => item?.providerId === 'password'
  );

  if (hasPasswordProvider && !currentPassword) {
    return setStatus('वर्तमान पासवर्ड दर्ज करें।');
  }

  if (!hasPasswordProvider && newPassword.length < 8) {
    return setStatus(
      'इस खाते में पासवर्ड लॉगिन नहीं है। मोबाइल लॉगिन जोड़ने के लिए कम-से-कम 8 अक्षरों का नया पासवर्ड दर्ज करें।'
    );
  }

  if (!oldMobile && newPassword.length < 8) {
    return setStatus('पहली बार मोबाइल जोड़ने के लिए नया पासवर्ड दर्ज करें।');
  }

  const oldEmail = user.email || (validMobile(oldMobile) ? hiddenEmail(oldMobile) : '');
  const newEmail = hiddenEmail(newMobile);
  let emailChanged = false;

  try {
    if (hasPasswordProvider) {
      const credential = firebase.auth.EmailAuthProvider.credential(
        oldEmail,
        currentPassword
      );
      await user.reauthenticateWithCredential(credential);
    }

    const newIndexRef = state.db.collection('mobileIndex').doc(newMobile);
    const oldIndexRef = oldMobile
      ? state.db.collection('mobileIndex').doc(oldMobile)
      : null;
    const userRef = state.db.collection('users').doc(user.uid);

    // Do not read the new mobile index before the batch.
// Firestore rules enforce ownership and uniqueness atomically.

    if (hasPasswordProvider) {
      await user.updateEmail(newEmail);
      emailChanged = true;
    } else {
      const credential = firebase.auth.EmailAuthProvider.credential(
        newEmail,
        newPassword
      );
      await user.linkWithCredential(credential);
      emailChanged = true;
    }

    try {
      const batch = state.db.batch();

      batch.set(newIndexRef, { uid: user.uid });

      if (oldIndexRef) {
        batch.delete(oldIndexRef);
      }

      batch.update(userRef, {
        mobile: newMobile,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();
    } catch (firestoreError) {
      // Try to restore the previous login identifier if Firestore rejects the update.
      try {
        if (hasPasswordProvider && oldEmail) {
          await user.updateEmail(oldEmail);
        } else if (!hasPasswordProvider) {
          const provider = user.providerData?.find(
            item => item?.providerId === 'password'
          );
          if (provider) {
            await user.unlink('password');
          }
        }
      } catch (rollbackError) {
        console.error('Mobile update rollback failed:', rollbackError);
      }
      throw firestoreError;
    }

    state.profile = { ...(state.profile || {}), mobile: newMobile };

    const phoneField = byId('profEditPhone');
    if (phoneField) phoneField.value = newMobile;

    ['profileNewMobile', 'profileMobileCurrentPassword', 'profileMobileNewPassword']
      .forEach(id => {
        const field = byId(id);
        if (field) field.value = '';
      });

    setStatus('मोबाइल नंबर सफलतापूर्वक बदल दिया गया।');
  } catch (error) {
    console.error('Profile mobile update failed:', error);

    const messages = {
      'auth/wrong-password': 'वर्तमान पासवर्ड गलत है।',
      'auth/invalid-credential': 'वर्तमान पासवर्ड सही नहीं है।',
      'auth/requires-recent-login': 'दोबारा लॉगिन करके फिर प्रयास करें।',
      'auth/email-already-in-use': 'यह मोबाइल नंबर पहले से किसी खाते से जुड़ा है।',
      'auth/credential-already-in-use': 'यह मोबाइल नंबर पहले से किसी दूसरे खाते से जुड़ा है।',
      'auth/weak-password': 'नया पासवर्ड कम-से-कम 8 अक्षरों का होना चाहिए।',
      'auth/network-request-failed': 'इंटरनेट कनेक्शन जाँचें।'
    };

    setStatus(
      messages[error.code] ||
      (error.code === 'permission-denied'
        ? 'Firestore rules ने बदलाव रोका। नीचे दिए गए rules बदलाव भी लागू करें।'
        : 'मोबाइल नंबर अपडेट नहीं हो सका। Console में error देखें।')
    );
  }
};
window.toggleProfileMobilePassword = function (id, button) {
  const field = document.getElementById(id);
  if (!field || !button) return;

  const showPassword = field.type === 'password';

  field.type = showPassword ? 'text' : 'password';
  button.textContent = showPassword
    ? 'Hide password'
    : 'Show password';

  button.setAttribute('aria-pressed', String(showPassword));
};
  authApi.saveProfile = async function () {
    if (!state.user || !state.db) return notify('पहले लॉगिन करें।', 'error');
    const name = (byId('profEditName')?.value || '').trim();
    const location = (byId('profEditLocation')?.value || '').trim();
    try {
      const displayName = name || state.profile?.displayName || state.profile?.fullName || state.user.displayName || '';
      const profileUpdate = {
        displayName, location,
        email: googleEmailForUser(state.user) || state.profile?.email || state.user.email || null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await state.db.collection('users').doc(state.user.uid).set(profileUpdate, { merge: true });
      state.profile = { ...(state.profile || {}), displayName, location };
      setText('profHeaderNameDisplay', displayName || 'मेरी प्रोफ़ाइल');
      notify('प्रोफ़ाइल सहेजी गई।', 'success');
    } catch (error) {
      console.error('Profile save failed:', error);
      notify('प्रोफ़ाइल सहेजी नहीं जा सकी।', 'error');
    }
  };
  authApi.logout = window.logoutPortalUser;


  // ===== Exam Portal master-prompt feature APIs =====
  // These helpers extend the existing static HTML + Firebase compat architecture.
  // Firestore rules must independently authorize every write; UI checks are not security.
  window.BishnoiApp = window.BishnoiApp || {};

  const EXAM_TARGETS = Object.freeze({
    quiz: 'quiz',
    mock1: 'mockExam_1',
    mock2: 'mockExam_2',
    main: 'mainExamQuestions'
  });
  const VALID_QUESTION_SETS = new Set(['set1', 'set2', 'set3', 'set4']);

 
  function hasEditorPermission(permission) {
    if (!state.user) return false;

    if (
      state.isOwner === true ||
      state.user.uid === CONFIG.ownerUid ||
      state.user.uid === CONFIG.legacyOwnerUid
    ) {
      return true;
    }

    return state.roles.includes('editor') &&
      state.profile?.role !== 'owner' &&
      state.editorPermissions?.[permission] === true;
  }

  function canManageExamContent() {
    return hasEditorPermission('examReview');
  }


  function normalizeImportedQuestion(row, index, setName) {
    const item = row && typeof row === 'object' ? row : {};
    const question = String(item.question ?? item.Question ?? item.q ?? item.Q ?? item.text ?? '').trim();
    const optionsRaw = item.options ?? item.Options ?? item.opts;
    const options = Array.isArray(optionsRaw)
      ? optionsRaw
      : [
          item.A ?? item.a ?? item.optionA,
          item.B ?? item.b ?? item.optionB,
          item.C ?? item.c ?? item.optionC,
          item.D ?? item.d ?? item.optionD
        ].filter(value => value !== undefined && value !== null && String(value).trim() !== '');
    const rawAnswer = item.correctAnswer ?? item.answer ?? item.Ans ?? item.ans ?? item.answerIndex;
    let correctAnswer = rawAnswer;
    if (typeof rawAnswer === 'string') {
      const letter = rawAnswer.trim().toUpperCase().replace(/[.)]$/, '');
      if (/^[A-D]$/.test(letter)) correctAnswer = letter.charCodeAt(0) - 65;
      else if (/^\d+$/.test(letter)) correctAnswer = Number(letter);
      else {
        const found = options.findIndex(option => String(typeof option === 'object' ? (option.text || option.label || option.value || '') : option).trim().toLowerCase() === rawAnswer.trim().toLowerCase());
        if (found >= 0) correctAnswer = found;
      }
    }
    const hasAnswer = rawAnswer !== undefined && rawAnswer !== null && String(rawAnswer).trim() !== '';
    const valid = question.length > 0 && options.length >= 2 && hasAnswer &&
      Number.isInteger(Number(correctAnswer)) && Number(correctAnswer) >= 0 && Number(correctAnswer) < options.length;
    return {
      valid,
      errors: [
        !question ? 'प्रश्न खाली है' : '',
        options.length < 2 ? 'कम से कम दो विकल्प चाहिए' : '',
        !hasAnswer || !(Number.isInteger(Number(correctAnswer)) && Number(correctAnswer) >= 0 && Number(correctAnswer) < options.length) ? 'सही उत्तर A/B/C/D या विकल्प संख्या में दें' : ''
      ].filter(Boolean),
      value: {
        id: String(item.id || item.questionId || ('q_' + (index + 1))),
        question,
        options: options.map(option => typeof option === 'object' ? String(option.text || option.label || option.value || '') : String(option)),
        correctAnswer: Number(correctAnswer),
        answerIndex: Number(correctAnswer),
        questionSet: VALID_QUESTION_SETS.has(String(item.questionSet || item.set || setName)) ? String(item.questionSet || item.set || setName) : setName,
        marks: Number(item.marks) > 0 ? Number(item.marks) : 1,
        negativeMarks: Number(item.negativeMarks) >= 0 ? Number(item.negativeMarks) : 0,
        explanation: String(item.explanation || item.solution || ''),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }
    };
  }

  function parseQuestionCsv(textValue) {
    // Supports escaped quotes, commas and quoted multiline fields.
    const source = String(textValue || '').replace(/^\uFEFF/, '');
    const records = [];
    let record = [], field = '', quoted = false;
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (ch === '"') {
        if (quoted && source[i + 1] === '"') { field += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === ',' && !quoted) {
        record.push(field.trim()); field = '';
      } else if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && source[i + 1] === '\n') i++;
        record.push(field.trim()); field = '';
        if (record.some(cell => cell !== '')) records.push(record);
        record = [];
      } else field += ch;
    }
    if (quoted) throw new Error('CSV में quote बंद नहीं हुआ है। फ़ाइल की quotes जाँचें।');
    record.push(field.trim());
    if (record.some(cell => cell !== '')) records.push(record);
    if (!records.length) return [];
    const headers = records.shift().map(value => value.trim());
    if (!headers.some(Boolean)) throw new Error('CSV header row खाली है।');
    return records.map(cells => {
      const row = {};
      headers.forEach((header, index) => { if (header) row[header] = cells[index] ?? ''; });
      return row;
    });
  }

  window.BishnoiApp.previewQuestionImport = function(rows, questionSet = 'set1') {
    const setName = VALID_QUESTION_SETS.has(String(questionSet)) ? String(questionSet) : 'set1';
    const list = Array.isArray(rows) ? rows : [];
    const normalized = list.map((row, index) => normalizeImportedQuestion(row, index, setName));
    const seenText = new Map();
    normalized.forEach((entry, index) => {
      const key = String(entry.value.question || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
      if (!key) return;
      if (seenText.has(key)) {
        const firstIndex = seenText.get(key);
        entry.valid = false;
        entry.errors.push('Duplicate question text (पहली बार Row ' + (firstIndex + 1) + ' पर)');
        normalized[firstIndex].valid = false;
        if (!normalized[firstIndex].errors.some(error => error.startsWith('Duplicate question text'))) {
          normalized[firstIndex].errors.push('Duplicate question text (दोबारा Row ' + (index + 1) + ' पर)');
        }
      } else seenText.set(key, index);
    });
    return {
      total: normalized.length,
      valid: normalized.filter(row => row.valid).length,
      invalid: normalized.filter(row => !row.valid).length,
      rows: normalized.map((row, index) => ({ row: index + 1, valid: row.valid, errors: row.errors, question: row.value.question })),
      questions: normalized.filter(row => row.valid).map(row => row.value)
    };
  };

 
window.BishnoiApp.importExamQuestions = async function (
  rows,
  target,
  questionSet = 'set1',
  options = {}
) {
  if (!state.user) {
    throw new Error('प्रश्न अपलोड करने के लिए पहले लॉगिन करें।');
  }

  const requestedTarget = String(target || '');
  const targetPermission = requestedTarget === 'quiz' ? 'quizDrafts' : 'examReview';
  if (!hasEditorPermission(targetPermission)) {
    throw new Error(targetPermission === 'quizDrafts'
      ? 'Daily Quiz draft बदलने के लिए quizDrafts permission आवश्यक है।'
      : 'परीक्षा प्रश्न बदलने के लिए Exam Checking permission आवश्यक है।');
  }

  const collectionName = examQuestionTarget(target);

  if (!collectionName) {
    throw new Error('अमान्य परीक्षा चुनी गई है।');
  }

  if (!VALID_QUESTION_SETS.has(String(questionSet))) {
    throw new Error('Set 1 से Set 4 में से सेट चुनें।');
  }

  const preview = window.BishnoiApp.previewQuestionImport(
    rows,
    questionSet
  );

  if (!preview.total || preview.invalid) {
    const error = new Error(
      'प्रश्न अपलोड नहीं हुए: ' +
      preview.invalid +
      ' त्रुटिपूर्ण प्रश्न। पहले Preview ठीक करें।'
    );
    error.preview = preview;
    throw error;
  }

  if (options.previewOnly === true) {
    return preview;
  }

  const db = state.db;

  if (!db) {
    throw new Error('Firebase database उपलब्ध नहीं है।');
  }

  // Validate document IDs before writing anything.
  const safeQuestions = [];
  const seenIds = new Set();

  for (const question of preview.questions) {
    const id = String(question.id || '')
      .trim()
      .replace(/[/.#\[\]$]/g, '_')
      .slice(0, 120);

    if (!id) {
      throw new Error('किसी प्रश्न की ID खाली है। Upload रोक दिया गया।');
    }

    if (seenIds.has(id)) {
      throw new Error(
        'फ़ाइल में duplicate Question ID मिली: ' + id +
        '. हर प्रश्न की ID अलग करें।'
      );
    }

    seenIds.add(id);
    safeQuestions.push({ ...question, id });
  }

  // Preflight: refuse to overwrite existing question documents.
  // Firestore batch writes are performed only after all IDs pass.
  const refs = safeQuestions.map(question =>
    db.collection(collectionName).doc(question.id)
  );

  for (let offset = 0; offset < refs.length; offset += 10) {
    const chunk = refs.slice(offset, offset + 10);
    const existing = await Promise.all(
      chunk.map(ref => ref.get())
    );

    const duplicateIndex = existing.findIndex(snap => snap.exists);

    if (duplicateIndex !== -1) {
      const duplicateId = chunk[duplicateIndex].id;

      throw new Error(
        'Upload रोक दिया गया: Question ID "' + duplicateId +
        '" पहले से मौजूद है। नई ID दें या पुराने प्रश्न की समीक्षा करें।'
      );
    }
  }

  // Write only after validation and duplicate checks succeed.
  for (let offset = 0; offset < safeQuestions.length; offset += 400) {
    const batch = db.batch();

    safeQuestions.slice(offset, offset + 400).forEach(question => {
      const ref = db.collection(collectionName).doc(question.id);

      batch.set(ref, {
        ...question,
        questionSet,
        active: true,
        published: false,
        status: 'draft',
        publishedBy: null,
        uploadedBy: state.user.uid,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
  }

  return {
    ...preview,
    collection: collectionName,
    questionSet,
    published: false
  };
};


  window.BishnoiApp.importExamQuestionFile = async function(file, target, questionSet = 'set1', options = {}) {
    if (!file) throw new Error('पहले JSON, CSV या Excel फ़ाइल चुनें।');
    const name = String(file.name || '').toLowerCase();
    let rows;
    if (name.endsWith('.json')) {
      const parsed = JSON.parse(await file.text());
      rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.questions) ? parsed.questions : []);
    } else if (name.endsWith('.csv')) {
      rows = parseQuestionCsv(await file.text());
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      if (!window.XLSX) throw new Error('Excel parser उपलब्ध नहीं है। फ़ाइल को CSV या JSON में बदलकर अपलोड करें।');
      const workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = firstSheet ? window.XLSX.utils.sheet_to_json(firstSheet, { defval: '' }) : [];
    } else {
      throw new Error('केवल JSON, CSV, XLSX या XLS फ़ाइल समर्थित है।');
    }
    return window.BishnoiApp.importExamQuestions(rows, target, questionSet, options);
  };

  window.BishnoiApp.getExamConfiguration = async function() {
    if (!state.db) throw new Error('Firebase database उपलब्ध नहीं है।');
    const snap = await state.db.collection('examConfig').doc('current').get();
    return snap.exists ? (snap.data() || {}) : {};
  };

  window.BishnoiApp.updateExamConfiguration = async function(patch) {
    if (!state.user || !canManageExamContent()) throw new Error('परीक्षा सेटिंग बदलने के लिए Owner अधिकार आवश्यक हैं।');
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('अमान्य सेटिंग डेटा।');
    const allowed = [
      'dailyQuizVisible','dailyQuizResultsVisible','mockVisible','mock1Visible','mock2Visible',
      'mainExamVisible','resultsVisible','enrollmentVisible','separateExamPortalVisible','examPortalVisible',
      'quizQuestionSet','mock1QuestionSet','mock2QuestionSet','mainQuestionSet',
      'quizStartAtMs','mock1StartAtMs','mock2StartAtMs','mainStartAtMs',
      'quizDurationMinutes','mock1DurationMinutes','mock2DurationMinutes','mainDurationMinutes',
      'broadcastEnabled','broadcastMessage','maintenanceMode','maintenanceMessage'
    ];
    const safePatch = {};
    allowed.forEach(key => { if (Object.prototype.hasOwnProperty.call(patch, key)) safePatch[key] = patch[key]; });
    Object.keys(safePatch).forEach(key => {
      if (key.endsWith('QuestionSet') && !VALID_QUESTION_SETS.has(String(safePatch[key]))) throw new Error(key + ' के लिए Set 1-4 चुनें।');
      if (key.endsWith('DurationMinutes') && (!Number.isFinite(Number(safePatch[key])) || Number(safePatch[key]) < 1 || Number(safePatch[key]) > 360)) throw new Error('परीक्षा अवधि 1 से 360 मिनट के बीच होनी चाहिए।');
    });
    safePatch.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    safePatch.updatedBy = state.user.uid;
    await state.db.collection('examConfig').doc('current').set(safePatch, { merge: true });
    state.examConfig = { ...(state.examConfig || {}), ...safePatch };
    window.renderExamVisibility?.();
    return state.examConfig;
  };

  window.BishnoiApp.exportRowsCsv = function(rows, filename = 'bishnoism-export.csv') {
    const data = Array.isArray(rows) ? rows : [];
    const headers = [...new Set(data.flatMap(row => Object.keys(row || {})))];
    const escapeCell = value => {
      const textValue = value == null ? '' : (typeof value === 'object' ? JSON.stringify(value) : String(value));
      return '"' + textValue.replace(/"/g, '""') + '"';
    };
    const csv = [headers.map(escapeCell).join(','), ...data.map(row => headers.map(key => escapeCell(row[key])).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.style.display = 'none';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return data.length;
  };

  window.BishnoiApp.exportRowsXlsx = function(
    rows,
    filename = 'bishnoism-export.xlsx'
  ) {
    if (!window.XLSX) {
      throw new Error('Excel library उपलब्ध नहीं है।');
    }

    const data = Array.isArray(rows) ? rows : [];
    if (!data.length) {
      throw new Error('Export करने के लिए कोई रिकॉर्ड नहीं है।');
    }

    const headers = [...new Set(
      data.flatMap(row => Object.keys(row || {}))
    )];

    const values = data.map(row =>
      headers.map(key => {
        const value = row?.[key];
        if (value == null) return '';
        return typeof value === 'object'
          ? JSON.stringify(value)
          : value;
      })
    );

    const worksheet = window.XLSX.utils.aoa_to_sheet([
      headers,
      ...values
    ]);

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Exam Records'
    );

    window.XLSX.writeFile(
      workbook,
      filename.endsWith('.xlsx') ? filename : filename + '.xlsx'
    );

    return data.length;
  };

  // PDF export helper shared by Owner Studio reporting buttons.
  window.BishnoiApp.exportRowsPdf = function(rows, filename = 'bishnoism-export.pdf', title = 'Bishnoism Report') {
    const data = Array.isArray(rows) ? rows : [];
    if (!data.length) throw new Error('PDF बनाने के लिए कोई रिकॉर्ड नहीं है।');
    const JsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!JsPDF) throw new Error('PDF library उपलब्ध नहीं है।');
    const pdf = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const headers = [...new Set(data.flatMap(row => Object.keys(row || {})))];
    const body = data.map(row => headers.map(key => {
      const value = row?.[key];
      if (value == null) return '';
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }));
    pdf.setFontSize(14);
    pdf.text(String(title).slice(0, 100), 36, 30);
    if (typeof pdf.autoTable === 'function') {
      pdf.autoTable({ head: [headers], body, startY: 42, margin: { left: 28, right: 28 },
        styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' }, headStyles: { fontSize: 7 },
        horizontalPageBreak: true, horizontalPageBreakRepeat: 0 });
    } else {
      // Fallback for deployments that load jsPDF but not jsPDF-AutoTable.
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 28, usableWidth = pageWidth - margin * 2;
      const maxCols = Math.max(1, Math.floor(usableWidth / 110));
      const chunks = [];
      for (let i = 0; i < headers.length; i += maxCols) chunks.push(headers.slice(i, i + maxCols));
      chunks.forEach((columnHeaders, chunkIndex) => {
        if (chunkIndex) pdf.addPage();
        let y = 48;
        pdf.setFontSize(8);
        pdf.text(String(title).slice(0, 100) + (chunks.length > 1 ? ' (' + (chunkIndex + 1) + '/' + chunks.length + ')' : ''), margin, 30);
        const start = chunkIndex * maxCols;
        body.forEach((row, rowIndex) => {
          const line = (rowIndex + 1) + '. ' + columnHeaders.map((h, i) =>
            String(h).slice(0, 24) + ': ' + String(row[start + i] ?? '').replace(/\s+/g, ' ').slice(0, 70)
          ).join(' | ');
          const wrapped = pdf.splitTextToSize(line, usableWidth);
          if (y + wrapped.length * 10 > pageHeight - margin) { pdf.addPage(); y = margin; }
          pdf.text(wrapped, margin, y);
          y += wrapped.length * 10 + 4;
        });
      });
    }
    const safeFilename = String(filename || 'bishnoism-export.pdf').endsWith('.pdf')
      ? String(filename || 'bishnoism-export.pdf')
      : String(filename || 'bishnoism-export') + '.pdf';
    pdf.save(safeFilename);
    return data.length;
  };

  // Use the same visible identity model in all student-facing exam UI.
  window.BishnoiApp.getExamIdentitySummary = function() {
    const identity = getStudentIdentity();
    return {
      name: identity.name || 'विद्यार्थी',
      rollNumber: identity.rollNumber || 'रोल नंबर जारी नहीं हुआ',
      phone: identity.phone || 'मोबाइल नंबर उपलब्ध नहीं',
      identityKey: identity.identityKey || ''
    };
  };
  // ===== End exam portal feature APIs =====

  // Keep the public aliases available to inline HTML event handlers.
  window.Bishnoi = window.Bishnoi || window.BishnoiPortal;

  // script.js is loaded after the page markup in index.html. Start now so
  // startup cannot be stranded if DOMContentLoaded already fired (e.g. a
  // cached/dynamically evaluated script); initPortal is idempotent.
  initPortal();

})();
} catch (error) {
  console.error('मुख्य पेज आरंभ नहीं हो सका:', error);
  showEarlyHindiToast();
}
