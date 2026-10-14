
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

(() => {
  const CONFIG = Object.freeze({
    firebase: {
      apiKey: "AIzaSyDD58ybmm1bmmc5k5AwsxiaDiOXxLlp7APA",
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
    ownerEmailAllowlist: [] // Optional extra UI guard; Firestore role is authoritative.
  });

  const state = {
    db: null, auth: null, storage: null, user: null, profile: null,
    isOwner: false, roles: [], unsubscribers: [],
    exam: { active: false, mode: null, questions: [], index: 0, answers: {}, review: {}, endAt: 0, timer: null, tabSwitches: 0, submitted: false, stream: null, proctorTimer: null, beforeUnload: null },
    settings: {}, mala: { count: 0, laps: 0 }, fontSize: 16,
    quizQuestions: [],
    initialized: false
  };

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  const byId = id => document.getElementById(id);
  const safeText = value => String(value ?? '');
  const escapeHtml = value => safeText(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const now = () => Date.now();
  const localDateKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const randomId = (n=10) => Array.from(crypto.getRandomValues(new Uint8Array(n)), x => (x%36).toString(36)).join('').toUpperCase();
  const notify = (message, type='info') => {
    let box = byId('portalToast');
    if (!box) { box=document.createElement('div'); box.id='portalToast'; box.setAttribute('role','status'); box.style.cssText='position:fixed;z-index:99999;right:16px;bottom:90px;max-width:min(92vw,420px);padding:12px 16px;border-radius:12px;background:#143622;color:#fff;box-shadow:0 8px 30px #0002;font:500 14px system-ui'; document.body.appendChild(box); }
    box.textContent = message; box.style.background = type==='error' ? '#9f2d20' : type==='success' ? '#245b3e' : '#143622'; box.hidden=false;
    clearTimeout(box._hideTimer); box._hideTimer=setTimeout(()=>{box.hidden=true;},4500);
  };
  const setText = (id, value) => { const el=byId(id); if(el) el.textContent=safeText(value); };
  const setHTML = (id, value) => { const el=byId(id); if(el) el.innerHTML=value; };
  const setVisible = (id, visible) => { const el=byId(id); if(el) el.hidden=!visible; };
  const collection = name => { if(!state.db) throw new Error('Firebase is not ready.'); return state.db.collection(name); };
  const getDocData = async (name,id) => { const snap=await collection(name).doc(id).get(); return snap.exists ? {id:snap.id,...snap.data()} : null; };
  const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
  const deleteField = () => firebase.firestore.FieldValue.delete();
  const asArray = v => Array.isArray(v) ? v : [];
  const currentUid = () => state.user?.uid || null;
  const requireUser = () => { if(!state.user) { notify('Please sign in first.'); promptUserLogin(); return false; } return true; };
  const requireOwner = () => { if(!state.isOwner) { notify('This action requires Owner permission.','error'); return false; } return true; };

  function initFirebase() {
    if (!window.firebase) { console.error('Firebase compat SDK missing. Load firebase-app-compat, auth-compat, firestore-compat and storage-compat before script.js.'); notify('Firebase SDK is missing. Check script tags.','error'); return false; }
    if (!firebase.apps.length) firebase.initializeApp(CONFIG.firebase);
    state.auth=firebase.auth(); state.db=firebase.firestore();
    try { state.storage=firebase.storage(); } catch(_) { state.storage=null; }
    return true;
  }

  // Navigation supports both the old IDs and the five-tab portal naming.
  const TAB_ALIASES = {home:'tab-home',mala:'tab-mala',niyams:'tab-niyams',library:'tab-library',sahitya:'tab-library',community:'tab-community',quiz:'tab-quiz',pariksha:'tab-pariksha',history:'tab-history',admin:'tab-admin',profile:'tab-profile'};
  window.switchTab = function(id) {
    const raw=String(id||'').replace(/^tab-/,'');
    const target=TAB_ALIASES[raw] || (String(id).startsWith('tab-') ? id : `tab-${raw}`);
    const aliases = new Set([target, `tab-${raw}`]);
    const tabs=$$('[id^="tab-"]');
    tabs.forEach(el=>{ const active=aliases.has(el.id) || (raw==='sahitya'&&el.id==='tab-library') || (raw==='pariksha'&&el.id==='tab-quiz'); el.hidden=!active; el.classList.toggle('active',active); el.setAttribute('aria-hidden',String(!active)); });
    $$('.nav-btn, [data-tab]').forEach(btn=>{const key=(btn.dataset.tab||btn.getAttribute('onclick')||'').replace(/.*switchTab\(['"]?([^'")]+).*/, '$1').replace(/^tab-/,''); const active=key===raw || (raw==='library'&&key==='sahitya') || (raw==='quiz'&&key==='pariksha'); btn.classList.toggle('nav-btn-active',active); if(btn.hasAttribute('aria-current')) btn.setAttribute('aria-current',active?'page':'false');});
    window.scrollTo({top:0,behavior:'smooth'});
    if(['admin','profile'].includes(raw)) renderOwnerStudio();
  };
  window.switchPortalTab = window.switchTab;

  function subscribe(ref, next, errorLabel='Live data') {
    const unsub=ref.onSnapshot(next, err=>{ console.error(errorLabel,err); if(err.code==='permission-denied') notify(`${errorLabel}: permission denied. Check Firestore rules.`,'error'); });
    state.unsubscribers.push(unsub); return unsub;
  }
  function clearSubscriptions() { state.unsubscribers.forEach(fn=>{try{fn();}catch(_){}}); state.unsubscribers=[]; }

  async function loadUserProfile(user) {
    const snap=await collection('users').doc(user.uid).get();
    state.profile=snap.exists ? snap.data() : {};
    // Do not accept localStorage, query params, or client-provided role as authority.
    state.roles=asArray(state.profile.roles);
    state.isOwner=state.profile.role==='owner' || state.profile.isOwner===true || state.roles.includes('owner');
    if(CONFIG.ownerEmailAllowlist.length && CONFIG.ownerEmailAllowlist.includes((user.email||'').toLowerCase())) state.isOwner=true;
    if(state.profile.role==='owner' && !state.profile.isOwner) console.warn('Owner UI enabled by Firestore role; protect all writes in rules/backend.');
    setText('userDisplayName', state.profile.displayName || user.displayName || user.email || 'Account');
    setText('userEmail', user.email || '');
    setVisible('authButton',false); setVisible('profileButton',true);
    setVisible('ownerNavButton',state.isOwner || state.roles.includes('admin'));
    renderOwnerStudio();
  }

  function authErrorMessage(error) {
    const messages={
      'auth/invalid-email':'Enter a valid email address.',
      'auth/invalid-credential':'Email or password is incorrect.',
      'auth/user-not-found':'No account was found for that email.',
      'auth/wrong-password':'Email or password is incorrect.',
      'auth/email-already-in-use':'An account already exists with this email.',
      'auth/weak-password':'Choose a stronger password.',
      'auth/too-many-requests':'Too many attempts. Please wait and try again.',
      'auth/network-request-failed':'Network error. Check your internet connection.'
    };
    return messages[error?.code] || error?.message || 'Authentication failed. Please try again.';
  }
