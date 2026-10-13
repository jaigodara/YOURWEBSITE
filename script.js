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
    setText('profileName', state.profile.displayName || user.displayName || 'Student');
    setVisible('tab-admin', state.isOwner || state.roles.includes('admin'));
    setVisible('ownerStudio', state.isOwner || state.roles.includes('admin'));
    const loginBtn=byId('authButton')||byId('profileButton'); if(loginBtn) loginBtn.textContent=state.profile.displayName||'Profile';
    await writeAccessLog();
  }
  async function writeAccessLog() {
    if(!state.user) return;
    try { await collection('userAccessLogs').add({uid:state.user.uid, email:state.user.email||null, deviceCategory:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop', userAgent:navigator.userAgent.slice(0,240), createdAt:serverTimestamp(), dateKey:localDateKey()}); } catch(e) { if(e.code!=='permission-denied') console.warn('Access log not saved',e); }
  }
  function initAuthUI() {
    if(!state.auth) return;
    state.auth.onAuthStateChanged(async user=>{
      clearSubscriptions(); state.user=user; state.profile=null; state.isOwner=false; state.roles=[];
      if(user) {
        try { await loadUserProfile(user); startLiveListeners(); notify(`Welcome${state.profile?.displayName?' '+state.profile.displayName:''}!`,'success'); }
        catch(e) { console.error(e); notify('Signed in, but your profile could not load.','error'); }
      } else {
        setText('userDisplayName','Sign in'); setText('profileName','Guest'); setVisible('tab-admin',false); setVisible('ownerStudio',false);
      }
      renderAuthState();
    });
  }
  function renderAuthState() {
    const label=state.user ? (state.profile?.displayName||state.user.email||'Account') : 'Sign in';
    ['authButton','profileButton','loginBtn'].forEach(id=>{const el=byId(id); if(el) el.textContent=label;});
    $$('[data-owner-only]').forEach(el=>el.hidden=!state.isOwner);
  }
  window.promptUserLogin = async function() {
    if(!state.auth) return notify('Authentication is unavailable.','error');
    if(state.user) { switchTab('profile'); return; }
    const email=prompt('Enter your email address:'); if(!email) return;
    const password=prompt('Enter your password:'); if(!password) return;
    try { await state.auth.signInWithEmailAndPassword(email.trim(),password); notify('Signed in successfully.','success'); }
    catch(e) { console.error(e); notify(authErrorMessage(e),'error'); }
  };
  window.logoutPortalUser = async function() { try { stopExamResources(); if(state.auth) await state.auth.signOut(); notify('Signed out.','success'); } catch(e) { notify('Could not sign out.','error'); } };
  function authErrorMessage(e) { return ({'auth/invalid-email':'Please enter a valid email.','auth/user-not-found':'Account not found.','auth/wrong-password':'Incorrect email or password.','auth/invalid-credential':'Incorrect email or password.','auth/too-many-requests':'Too many attempts. Try again later.'})[e.code]||'Sign-in failed. Check your details and try again.'; }

  function startLiveListeners() {
    if(!state.db) return;
    // Settings are read from Firestore, never silently overwritten by stale local settings.
    subscribe(collection('settings').doc('portal'), snap=>{state.settings=snap.exists?snap.data():{}; applyPortalSettings();},'Portal settings');
    subscribe(collection('posts').orderBy('createdAt','desc').limit(50), snap=>renderCommunity(snap.docs.map(d=>({id:d.id,...d.data()}))),'Community');
    subscribe(collection('audios').orderBy('order','asc'), snap=>renderAudioList(snap.docs.map(d=>({id:d.id,...d.data()}))),'Audio library');
    subscribe(collection('pdfs').orderBy('createdAt','desc').limit(100), snap=>renderPdfLibrary(snap.docs.map(d=>({id:d.id,...d.data()}))),'PDF library');
    subscribe(collection('examConfig').doc('current'), snap=>{state.examConfig=snap.exists?snap.data():{}; renderExamVisibility();},'Exam configuration');
  }
  function applyPortalSettings() {
    const s=state.settings||{};
    setText('dailySandesh',s.dailySandesh||'जीव दया पालणी, रूंख लीलो नी घावै');
    setVisible('maintenanceBanner',!!s.maintenanceMode);
    setText('maintenanceProgress',`${Math.max(0,Math.min(100,Number(s.maintenanceProgress)||0))}%`);
    const bar=byId('maintenanceProgressBar'); if(bar) bar.style.width=`${Math.max(0,Math.min(100,Number(s.maintenanceProgress)||0))}%`;
    // Maintenance is a banner, not a blanket block: other portal tabs remain usable.
    renderExamVisibility();
  }
  function renderExamVisibility() {
    const c=state.examConfig||{};
    const map={enrollment:c.enrollmentVisible!==false?'enrollmentSection':'',mock:c.mockVisible!==false?'mockHub':'',main:c.mainExamVisible!==false?'mainExamSection':'',daily:c.dailyQuizVisible!==false?'dailyQuizSection':'',results:c.resultsVisible!==false?'resultsDesk':''};
    Object.entries(map).forEach(([k,id])=>{if(id) setVisible(id,c[`${k}Visible`]!==false);});
  }

  // 29 Niyam cards: use authored content if present in HTML or Firestore; never invent scripture.
  const NIYAMS_FALLBACK = [
    ['जीव दया पालणी','जीवों के प्रति दया और करुणा रखें।'],['रूंख लीलो नी घावै','हरे वृक्षों की रक्षा करें।'],['अजर पाळणो','अहिंसा और जीव रक्षा को जीवन में अपनाएँ।']
  ];
  async function renderNiyamsList() {
    const host=byId('niyamsList')||byId('niyamsGrid'); if(!host) return;
    try { const snap=await collection('settings').doc('niyams').get(); const items=snap.exists?asArray(snap.data().items):NIYAMS_FALLBACK; host.innerHTML=items.map((x,i)=>`<article class="niyam-card"><h3>${escapeHtml(x.title||x.name||`नियम ${i+1}`)}</h3><p>${escapeHtml(x.meaning||x.description||x.text||'')}</p></article>`).join(''); }
    catch(e) { host.innerHTML=NIYAMS_FALLBACK.map((x,i)=>`<article class="niyam-card"><h3>${i+1}. ${escapeHtml(x[0])}</h3><p>${escapeHtml(x[1])}</p></article>`).join(''); }
  }

  // Jaap Mala: local counters are personal convenience; signed-in sync is best-effort.
  function initMalaState() {
    try { const saved=JSON.parse(localStorage.getItem('bishnoi_mala_v2')||'{}'); state.mala.count=Math.min(108,Math.max(0,Number(saved.count)||0)); state.mala.laps=Math.max(0,Number(saved.laps)||0); } catch(_) {}
    renderMala();
  }
  function saveMala() { localStorage.setItem('bishnoi_mala_v2',JSON.stringify({...state.mala,date:localDateKey()})); if(state.user&&state.db) collection('users').doc(state.user.uid).set({mala:{...state.mala,dateKey:localDateKey(),updatedAt:serverTimestamp()}},{merge:true}).catch(()=>{}); }
  function renderMala() { setText('malaCount',state.mala.count); setText('malaLapCount',state.mala.laps); setText('malaProgress',`${Math.round(state.mala.count/108*100)}%`); const p=byId('malaProgressBar'); if(p) p.style.width=`${state.mala.count/108*100}%`; $$('.mala-bead').forEach((b,i)=>b.classList.toggle('bead-done',i<state.mala.count)); }
  window.tapHomeMalaBead = function() { state.mala.count++; if(state.mala.count>=108){state.mala.count=0;state.mala.laps++;notify(`One mala complete! Total laps: ${state.mala.laps}`,'success');} if(navigator.vibrate && byId('hapticToggle')?.checked) navigator.vibrate(25); saveMala(); renderMala(); };
  window.resetMala = function(){if(!confirm('Reset this mala count?'))return;state.mala.count=0;saveMala();renderMala();};
  window.pledgeTree = async function() { if(!requireUser()) return; try { const ref=collection('treePledges').doc(state.user.uid); await state.db.runTransaction(async tx=>{const s=await tx.get(ref); if(s.exists&&s.data().dateKey===localDateKey()) throw new Error('already'); tx.set(ref,{uid:state.user.uid,displayName:state.profile?.displayName||'Community member',dateKey:localDateKey(),createdAt:serverTimestamp()},{merge:true});}); notify('Thank you for pledging to plant and protect a tree.','success'); } catch(e) { notify(e.message==='already'?'You have already pledged today.':'Could not save your pledge.','error'); } };
  window.shareBannerWhatsApp = function() { const text='जीव दया पालणी, रूंख लीलो नी घावै — जीवों और वृक्षों की रक्षा करें।'; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer'); };
    // Literature repository expects actual content in Firestore collection "shabadwani".
  async function loadShabadRepository() {
    const host=byId('shabadGrid')||byId('shabadRepo')||byId('libraryGrid'); if(!host||!state.db) return;
    try { const snap=await collection('shabadwani').orderBy('num','asc').limit(200).get(); const rows=snap.docs.map(d=>({id:d.id,...d.data()})); renderShabadCards(rows); }
    catch(e) { console.warn('Shabad repository not available',e); }
  }
  window.renderShabadCards = function(items) { const host=byId('shabadGrid')||byId('shabadRepo')||byId('libraryGrid'); if(!host)return; host.innerHTML=asArray(items).map(s=>`<article class="shabad-card" data-search="${escapeHtml(`${s.title||''} ${s.desc||''} ${s.fullText||''}`.toLowerCase())}"><h3>${escapeHtml(s.title||'शब्दवाणी')}</h3><p>${escapeHtml(s.desc||'')}</p><button type="button" data-open-shabad="${escapeHtml(s.id||s.num||'')}">पढ़ें</button></article>`).join(''); host.querySelectorAll('[data-open-shabad]').forEach(btn=>btn.addEventListener('click',()=>{const s=asArray(items).find(x=>String(x.id||x.num)===btn.dataset.openShabad); if(s) window.openShabadModal(s);})); };
  window.filterShabadRepo = function(value) { const q=String(value??($('#shabadSearch')?.value||'')).toLowerCase().trim(); $$('.shabad-card').forEach(el=>el.hidden=!el.dataset.search.includes(q)); };
  window.openShabadModal = function(item) { let modal=byId('shabadReaderModal'); if(modal) modal.remove(); modal=document.createElement('div'); modal.id='shabadReaderModal'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.style.cssText='position:fixed;inset:0;z-index:99990;background:#0008;display:grid;place-items:center;padding:16px'; modal.innerHTML=`<section style="background:#fffdf7;color:#143622;border-radius:18px;padding:22px;max-width:720px;width:100%;max-height:85vh;overflow:auto"><button type="button" id="closeShabad" style="float:right">✕ Close</button><h2>${escapeHtml(item.title||'शब्दवाणी')}</h2><p style="white-space:pre-wrap;line-height:1.9">${escapeHtml(item.fullText||item.text||item.desc||'Text not yet uploaded.')}</p></section>`; document.body.appendChild(modal); $('#closeShabad',modal).onclick=()=>modal.remove(); modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();}); };
  window.changeLiteratureFont = function(delta) { state.fontSize=Math.max(12,Math.min(32,state.fontSize+Number(delta||0))); const reader=byId('shabadReaderModal')||byId('literatureReader'); if(reader) reader.style.fontSize=`${state.fontSize}px`; };

  // Karaoke: audio records can provide audioUrl and timed lyrics [{time,text}].
  let karaokeFrame=null;
  async function initKaraokePlayer() {
    const audio=byId('karaokeAudio')||byId('bhajanAudio'); if(!audio) return;
    audio.addEventListener('timeupdate',()=>{const lines=asArray(window.activeKaraokeLyrics); let active=-1; lines.forEach((l,i)=>{if(Number(l.time||0)<=audio.currentTime)active=i;}); const host=byId('karaokeLyrics'); if(host&&active>=0){const line=host.children[active]; if(line){$$('.karaoke-line',host).forEach(x=>x.classList.remove('karaoke-active'));line.classList.add('karaoke-active');line.scrollIntoView({block:'nearest',behavior:'smooth'});}}});
  }
  window.toggleKaraokePlayback = function() { const audio=byId('karaokeAudio')||byId('bhajanAudio'); if(!audio)return notify('Audio player is not on this page.'); if(audio.paused) audio.play().catch(()=>notify('Tap play again to allow audio playback.')); else audio.pause(); };
  function renderAudioList(items) { const host=byId('audioList'); if(!host)return; host.innerHTML=items.map(a=>`<button type="button" class="audio-item" data-audio-id="${escapeHtml(a.id)}">${escapeHtml(a.title||'Bhajan')} ${a.audioUrl?'▶':''}</button>`).join(''); host.querySelectorAll('[data-audio-id]').forEach(btn=>btn.onclick=()=>{const a=items.find(x=>x.id===btn.dataset.audioId); if(!a?.audioUrl)return notify('Audio URL has not been uploaded yet.'); const audio=byId('karaokeAudio')||byId('bhajanAudio'); if(audio){audio.src=a.audioUrl;window.activeKaraokeLyrics=asArray(a.lyrics); const lines=byId('karaokeLyrics'); if(lines)lines.innerHTML=window.activeKaraokeLyrics.map(l=>`<p class="karaoke-line">${escapeHtml(l.text||l)}</p>`).join(''); audio.play().catch(()=>{});}}); }
  function renderPdfLibrary(items) { const host=byId('pdfLibrary')||byId('literatureFiles'); if(!host)return; host.innerHTML=items.map(x=>`<article class="library-file"><strong>${escapeHtml(x.title||x.name||'Document')}</strong>${x.url?` <a href="${escapeHtml(x.url)}" target="_blank" rel="noopener noreferrer">Open</a>`:''}</article>`).join(''); }

  // Community posts: HTML is escaped; Firestore rules must enforce author/admin permissions.
  function renderCommunity(posts) { const host=byId('communityPosts')||byId('postsList'); if(!host)return; host.innerHTML=posts.map(p=>`<article class="community-post" data-post-id="${escapeHtml(p.id)}"><h3>${escapeHtml(p.title||'Community post')}</h3><p>${escapeHtml(p.body||p.text||'')}</p><small>${escapeHtml(p.authorName||'Community member')}</small><div><button type="button" data-upvote="${escapeHtml(p.id)}">▲ ${Number(p.upvotes)||0}</button><button type="button" data-react="${escapeHtml(p.id)}" data-emoji="🙏">🙏 ${Number(p.reactions?.pray)||0}</button></div></article>`).join(''); host.querySelectorAll('[data-upvote]').forEach(b=>b.onclick=()=>upvotePost(b.dataset.upvote)); host.querySelectorAll('[data-react]').forEach(b=>b.onclick=()=>reactToPost(b.dataset.react,b.dataset.emoji)); }
  window.createCommunityPost = async function() { if(!requireUser())return; const title=($('#postTitle')?.value||'').trim(); const body=($('#postBody')?.value||'').trim(); if(!body||body.length>3000||title.length>140)return notify('Enter a post (maximum 3,000 characters) and a short title.','error'); try{await collection('posts').add({title,body,uid:state.user.uid,authorName:state.profile?.displayName||'Community member',upvotes:0,reactions:{},createdAt:serverTimestamp(),topic:($('#postTopic')?.value||'general').slice(0,40)}); $('#postTitle').value='';$('#postBody').value='';notify('Post published.','success');}catch(e){notify('Post could not be published.','error');} };
  async function upvotePost(id) { if(!requireUser())return; try {const ref=collection('posts').doc(id);await state.db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)throw new Error('missing');const d=s.data();const voters=asArray(d.upvotedBy);if(voters.includes(state.user.uid))throw new Error('duplicate');tx.update(ref,{upvotes:(Number(d.upvotes)||0)+1,upvotedBy:firebase.firestore.FieldValue.arrayUnion(state.user.uid)});});}catch(e){notify(e.message==='duplicate'?'You already upvoted this post.':'Could not upvote.','error');} }
  async function reactToPost(id,emoji) { if(!requireUser())return; const allowed=['🙏','❤️','🌳','👏','💚'];if(!allowed.includes(emoji))return;try{const ref=collection('posts').doc(id);await state.db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)throw new Error('missing');const d=s.data(), reactions=d.reactions||{}, users=d.reactionUsers||{};if(asArray(users[state.user.uid]).includes(id))throw new Error('duplicate');tx.update(ref,{[`reactions.${emoji}`]:(Number(reactions[emoji])||0)+1, reactionUsers:{...users,[state.user.uid]:[id]}});});}catch(e){notify('Reaction was not saved (you may have reacted already).','error');} }

  // Daily quiz and mock/main exam engine.
  function normalizeQuestion(q,index) {
    const options=Array.isArray(q.options)?q.options:(['A','B','C','D'].map(k=>q[k]??q[`option${k}`]).filter(v=>v!==undefined));
    const answer=q.answerIndex!==undefined?Number(q.answerIndex):q.correctIndex!==undefined?Number(q.correctIndex):typeof q.answer==='number'?q.answer:['A','B','C','D'].indexOf(String(q.answer||q.correctAnswer||'').trim().toUpperCase());
    return {id:q.id||String(index),question:String(q.question||q.text||q.questionText||''),options:options.map(x=>String(typeof x==='object'?(x.text??x.value??''):x)),answerIndex:Number.isInteger(answer)?answer:-1,explanation:String(q.explanation||q.solution||''),section:String(q.section||'A'),marks:Number(q.marks)||((q.section==='B')?4:2),negativeMarks:q.negativeMarks!==undefined?Number(q.negativeMarks):((q.section==='B')?1:0.5)};
  }
  async function fetchQuestionBank(mode) {
    const name=CONFIG.examCollections[mode]; if(!name)throw new Error('Unknown exam type.');
    let query=collection(name);
    if(mode==='quiz') { const date=localDateKey(); try {const daily=await query.where('dateKey','==',date).get(); if(!daily.empty)return daily.docs.map(d=>normalizeQuestion({id:d.id,...d.data()},d.id));}catch(_){} }
    const snap=await query.orderBy('order','asc').limit(mode==='main'?300:150).get().catch(()=>query.limit(mode==='main'?300:150).get());
    return snap.docs.map((d,i)=>normalizeQuestion({id:d.id,...d.data()},i)).filter(q=>q.question&&q.options.length>=2);
  }
  window.startDailyQuiz = async function(){return startExamCore('quiz');};
  window.startMockExam = async function(which=1){return startExamCore(which===2?'mock2':'mock1');};
  window.triggerMainExamHallEntry = async function(override=false) {
    if(!requireUser())return;
    const c=state.examConfig||{}; const startAt=toMillis(c.examScheduleTime||c.startAt);
    if(startAt&&now()<startAt){notify(`The exam hall opens in ${formatDuration(Math.ceil((startAt-now())/1000))}.`);return;}
    if(startAt&&now()>startAt+CONFIG.lateEntryMinutes*60000&&!override){notify('Entry is closed. Contact the exam administrator.','error');return;}
    if(override&&!requireOwner())return;
    if(!await acceptPrivacyConsent())return;
    return startExamCore('main');
  };
  function toMillis(v) { if(!v)return 0; if(typeof v==='number')return v; if(v.toMillis)return v.toMillis(); const n=Date.parse(v);return Number.isFinite(n)?n:0; }
  function formatDuration(sec) { sec=Math.max(0,sec);const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?`${h}h ${m}m ${s}s`:`${m}m ${s}s`; }
  async function acceptPrivacyConsent() {
    const key='bishnoi_exam_privacy_consent_v1'; if(localStorage.getItem(key)==='yes')return true;
    const accepted=confirm('Exam privacy notice: during the exam, the site stores your answers and timing, records basic device/browser details for exam integrity, and may capture webcam snapshots only if camera proctoring is enabled and you grant camera permission. You may decline camera access. Continue?');
    if(accepted)localStorage.setItem(key,'yes'); return accepted;
  }
  async function startExamCore(mode) {
    if(!requireUser()||state.exam.active)return;
    try {
      const questions=await fetchQuestionBank(mode); if(!questions.length)throw new Error(`No questions found in Firestore collection "${CONFIG.examCollections[mode]}".`);
      const c=state.examConfig||{}; const minutes=mode==='quiz'?Number(c.dailyQuizMinutes)||10:mode==='main'?Number(c.examDuration)||CONFIG.defaultExamMinutes:Number(c.mockDuration)||60;
      const roll=state.profile?.rollNumber||`JAMBH-${new Date().getFullYear()}-${randomId(5)}`;
      state.exam={...state.exam,active:true,mode,questions,index:0,answers:{},review:{},endAt:now()+minutes*60000,tabSwitches:0,submitted:false,roll};
      saveExamDraft(); installExamGuards(); renderExamArena(); startExamTimer();
      if(mode==='main'&&c.enableCameraProctoring===true) await startCloudflareProctoring();
      switchTab('quiz');
    } catch(e) {console.error(e);notify(e.message||'Could not start exam.','error');}
  }
  function examDraftKey() { return `bishnoi_exam_draft_${state.user?.uid||'guest'}_${state.exam.mode||'none'}`; }
  function saveExamDraft() { if(!state.exam.active)return; const e=state.exam; try{sessionStorage.setItem(examDraftKey(),JSON.stringify({mode:e.mode,index:e.index,answers:e.answers,review:e.review,endAt:e.endAt,roll:e.roll,tabSwitches:e.tabSwitches,updatedAt:now()}));}catch(_){} }
  async function restoreAccidentalExamRefreshState() {
    if(!state.user||!state.db)return false;
    // Never resume after the absolute server-side deadline; do not trust a saved countdown.
    for(const mode of ['main','mock1','mock2','quiz']) {
      let raw;try{raw=sessionStorage.getItem(`bishnoi_exam_draft_${state.user.uid}_${mode}`);}catch(_){}
      if(!raw)continue;
      try {const d=JSON.parse(raw);if(d.endAt<=now()){sessionStorage.removeItem(`bishnoi_exam_draft_${state.user.uid}_${mode}`);continue;} const snap=await collection('examDrafts').doc(`${state.user.uid}_${mode}`).get().catch(()=>null);if(snap?.exists){const server=snap.data();if(Number(server.endAt)>0&&Number(server.endAt)<=now())continue;} const ok=confirm('An unfinished exam was found. Resume it with the original deadline?');if(!ok)continue;const questions=await fetchQuestionBank(mode);if(!questions.length)continue;state.exam={...state.exam,active:true,mode,questions,index:Math.min(Number(d.index)||0,questions.length-1),answers:d.answers||{},review:d.review||{},endAt:Number(d.endAt),roll:d.roll,tabSwitches:Number(d.tabSwitches)||0,submitted:false};installExamGuards();renderExamArena();startExamTimer();return true;}catch(e){console.warn('Exam restore failed',e);}
    } return false;
  }
  window.restoreAccidentalExamRefreshState=restoreAccidentalExamRefreshState;
  function installExamGuards() {
    removeExamGuards(); state.exam.beforeUnload=e=>{if(state.exam.active&&!state.exam.submitted){e.preventDefault();e.returnValue='Your exam is in progress.';}};window.addEventListener('beforeunload',state.exam.beforeUnload);
    document.addEventListener('visibilitychange',onVisibilityChange); document.addEventListener('contextmenu',blockContextMenu); document.addEventListener('copy',blockClipboard); document.addEventListener('cut',blockClipboard); document.addEventListener('paste',blockClipboard);
  }
  function removeExamGuards() { if(state.exam.beforeUnload)window.removeEventListener('beforeunload',state.exam.beforeUnload);document.removeEventListener('visibilitychange',onVisibilityChange);document.removeEventListener('contextmenu',blockContextMenu);document.removeEventListener('copy',blockClipboard);document.removeEventListener('cut',blockClipboard);document.removeEventListener('paste',blockClipboard); }
  function onVisibilityChange(){if(!state.exam.active||document.visibilityState!=='hidden')return;state.exam.tabSwitches++;saveExamDraft();notify(`Exam focus warning ${state.exam.tabSwitches}/${CONFIG.maxTabSwitches}.`,'error');if(state.exam.tabSwitches>=CONFIG.maxTabSwitches)finalizeExamSubmission('tab_switch_limit');}
  function blockContextMenu(e){if(state.exam.active)e.preventDefault();} function blockClipboard(e){if(state.exam.active)e.preventDefault();}
  function startExamTimer(){clearInterval(state.exam.timer);const tick=()=>{if(!state.exam.active)return;const sec=Math.ceil((state.exam.endAt-now())/1000);setText('examTimer',formatDuration(sec));if(sec<=0)finalizeExamSubmission('time_up');};tick();state.exam.timer=setInterval(tick,1000);}
  function renderExamArena() {
    let host=byId('examArena'); if(!host){host=document.createElement('section');host.id='examArena';host.hidden=true;host.className='exam-arena';document.body.appendChild(host);}
    const e=state.exam,q=e.questions[e.index]; if(!q)return;
    host.hidden=false;host.innerHTML=`<div class="exam-top"><span>Roll: ${escapeHtml(e.roll||'')}</span><span id="examTimer" aria-live="polite"></span><span>Question ${e.index+1}/${e.questions.length}</span></div><article class="exam-question"><h2>${escapeHtml(q.question)}</h2><div class="exam-options">${q.options.map((o,i)=>`<label class="exam-option"><input type="radio" name="examOption" value="${i}" ${Number(e.answers[q.id])===i?'checked':''}><span>${String.fromCharCode(65+i)}. ${escapeHtml(o)}</span></label>`).join('')}</div><div class="exam-actions"><button type="button" id="examPrev" ${e.index===0?'disabled':''}>Previous</button><button type="button" id="examReview">${e.review[q.id]?'Unmark review':'Mark for review'}</button><button type="button" id="examNext">${e.index===e.questions.length-1?'Finish questions':'Save & next'}</button><button type="button" id="examSubmit">Submit exam</button></div></article><div class="exam-palette" aria-label="Question palette">${e.questions.map((x,i)=>`<button type="button" data-q-index="${i}" class="${i===e.index?'current':''} ${e.answers[x.id]!==undefined?'answered':''} ${e.review[x.id]?'review':''}">${i+1}</button>`).join('')}</div>`;
    host.querySelectorAll('input[name="examOption"]').forEach(input=>input.onchange=()=>{e.answers[q.id]=Number(input.value);saveExamDraft();});
    byId('examPrev').onclick=()=>goQuestion(e.index-1);byId('examNext').onclick=()=>{saveExamDraft();if(e.index===e.questions.length-1){if(confirm('All questions reached. Submit now?'))finalizeExamSubmission('manual');}else goQuestion(e.index+1);};byId('examReview').onclick=()=>{e.review[q.id]=!e.review[q.id];saveExamDraft();renderExamArena();};byId('examSubmit').onclick=()=>{if(confirm('Submit your exam now? You cannot change answers afterwards.'))finalizeExamSubmission('manual');};host.querySelectorAll('[data-q-index]').forEach(b=>b.onclick=()=>goQuestion(Number(b.dataset.qIndex)));
  }
  function goQuestion(index){if(index<0||index>=state.exam.questions.length)return;state.exam.index=index;saveExamDraft();renderExamArena();}
  window.selectOption = function(index){const q=state.exam.questions[state.exam.index];if(q){state.exam.answers[q.id]=Number(index);saveExamDraft();renderExamArena();}};
  function scoreExam(e) {let correct=0,wrong=0,unanswered=0,marks=0;const detail=e.questions.map(q=>{const a=e.answers[q.id];let status='unanswered',earned=0;if(a===undefined||a===null){unanswered++;}else if(Number(a)===q.answerIndex&&q.answerIndex>=0){correct++;status='correct';earned=q.marks;}else{wrong++;status='wrong';earned=-q.negativeMarks;}marks+=earned;return {questionId:q.id,status,selectedIndex:a??null,correctIndex:q.answerIndex,earned};});return {correct,wrong,unanswered,score:Math.round(marks*100)/100,total:e.questions.reduce((s,q)=>s+q.marks,0),detail};}
    // Literature repository expects actual content in Firestore collection "shabadwani".
  async function loadShabadRepository() {
    const host=byId('shabadGrid')||byId('shabadRepo')||byId('libraryGrid'); if(!host||!state.db) return;
    try { const snap=await collection('shabadwani').orderBy('num','asc').limit(200).get(); const rows=snap.docs.map(d=>({id:d.id,...d.data()})); renderShabadCards(rows); }
    catch(e) { console.warn('Shabad repository not available',e); }
  }
  window.renderShabadCards = function(items) { const host=byId('shabadGrid')||byId('shabadRepo')||byId('libraryGrid'); if(!host)return; host.innerHTML=asArray(items).map(s=>`<article class="shabad-card" data-search="${escapeHtml(`${s.title||''} ${s.desc||''} ${s.fullText||''}`.toLowerCase())}"><h3>${escapeHtml(s.title||'शब्दवाणी')}</h3><p>${escapeHtml(s.desc||'')}</p><button type="button" data-open-shabad="${escapeHtml(s.id||s.num||'')}">पढ़ें</button></article>`).join(''); host.querySelectorAll('[data-open-shabad]').forEach(btn=>btn.addEventListener('click',()=>{const s=asArray(items).find(x=>String(x.id||x.num)===btn.dataset.openShabad); if(s) window.openShabadModal(s);})); };
  window.filterShabadRepo = function(value) { const q=String(value??($('#shabadSearch')?.value||'')).toLowerCase().trim(); $$('.shabad-card').forEach(el=>el.hidden=!el.dataset.search.includes(q)); };
  window.openShabadModal = function(item) { let modal=byId('shabadReaderModal'); if(modal) modal.remove(); modal=document.createElement('div'); modal.id='shabadReaderModal'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.style.cssText='position:fixed;inset:0;z-index:99990;background:#0008;display:grid;place-items:center;padding:16px'; modal.innerHTML=`<section style="background:#fffdf7;color:#143622;border-radius:18px;padding:22px;max-width:720px;width:100%;max-height:85vh;overflow:auto"><button type="button" id="closeShabad" style="float:right">✕ Close</button><h2>${escapeHtml(item.title||'शब्दवाणी')}</h2><p style="white-space:pre-wrap;line-height:1.9">${escapeHtml(item.fullText||item.text||item.desc||'Text not yet uploaded.')}</p></section>`; document.body.appendChild(modal); $('#closeShabad',modal).onclick=()=>modal.remove(); modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();}); };
  window.changeLiteratureFont = function(delta) { state.fontSize=Math.max(12,Math.min(32,state.fontSize+Number(delta||0))); const reader=byId('shabadReaderModal')||byId('literatureReader'); if(reader) reader.style.fontSize=`${state.fontSize}px`; };

  // Karaoke: audio records can provide audioUrl and timed lyrics [{time,text}].
  async function initKaraokePlayer() {
    const audio=byId('karaokeAudio')||byId('bhajanAudio'); if(!audio) return;
    audio.addEventListener('timeupdate',()=>{const lines=asArray(window.activeKaraokeLyrics); let active=-1; lines.forEach((l,i)=>{if(Number(l.time||0)<=audio.currentTime)active=i;}); const host=byId('karaokeLyrics'); if(host&&active>=0){const line=host.children[active]; if(line){$$('.karaoke-line',host).forEach(x=>x.classList.remove('karaoke-active'));line.classList.add('karaoke-active');line.scrollIntoView({block:'nearest',behavior:'smooth'});}}});
  }
  window.toggleKaraokePlayback = function() { const audio=byId('karaokeAudio')||byId('bhajanAudio'); if(!audio)return notify('Audio player is not on this page.'); if(audio.paused) audio.play().catch(()=>notify('Tap play again to allow audio playback.')); else audio.pause(); };
  function renderAudioList(items) { const host=byId('audioList'); if(!host)return; host.innerHTML=items.map(a=>`<button type="button" class="audio-item" data-audio-id="${escapeHtml(a.id)}">${escapeHtml(a.title||'Bhajan')} ${a.audioUrl?'▶':''}</button>`).join(''); host.querySelectorAll('[data-audio-id]').forEach(btn=>btn.onclick=()=>{const a=items.find(x=>x.id===btn.dataset.audioId); if(!a?.audioUrl)return notify('Audio URL has not been uploaded yet.'); const audio=byId('karaokeAudio')||byId('bhajanAudio'); if(audio){audio.src=a.audioUrl;window.activeKaraokeLyrics=asArray(a.lyrics); const lines=byId('karaokeLyrics'); if(lines)lines.innerHTML=window.activeKaraokeLyrics.map(l=>`<p class="karaoke-line">${escapeHtml(l.text||l)}</p>`).join(''); audio.play().catch(()=>{});}}); }
  function renderPdfLibrary(items) { const host=byId('pdfLibrary')||byId('literatureFiles'); if(!host)return; host.innerHTML=items.map(x=>`<article class="library-file"><strong>${escapeHtml(x.title||x.name||'Document')}</strong>${x.url?` <a href="${escapeHtml(x.url)}" target="_blank" rel="noopener noreferrer">Open</a>`:''}</article>`).join(''); }

  // Community posts: HTML is escaped; Firestore rules must enforce author/admin permissions.
  function renderCommunity(posts) { const host=byId('communityPosts')||byId('postsList'); if(!host)return; host.innerHTML=posts.map(p=>`<article class="community-post" data-post-id="${escapeHtml(p.id)}"><h3>${escapeHtml(p.title||'Community post')}</h3><p>${escapeHtml(p.body||p.text||'')}</p><small>${escapeHtml(p.authorName||'Community member')}</small><div><button type="button" data-upvote="${escapeHtml(p.id)}">▲ ${Number(p.upvotes)||0}</button><button type="button" data-react="${escapeHtml(p.id)}" data-emoji="🙏">🙏 ${Number(p.reactions?.pray)||0}</button></div></article>`).join(''); host.querySelectorAll('[data-upvote]').forEach(b=>b.onclick=()=>upvotePost(b.dataset.upvote)); host.querySelectorAll('[data-react]').forEach(b=>b.onclick=()=>reactToPost(b.dataset.react,b.dataset.emoji)); }
  window.createCommunityPost = async function() { if(!requireUser())return; const title=($('#postTitle')?.value||'').trim(); const body=($('#postBody')?.value||'').trim(); if(!body||body.length>3000||title.length>140)return notify('Enter a post (maximum 3,000 characters) and a short title.','error'); try{await collection('posts').add({title,body,uid:state.user.uid,authorName:state.profile?.displayName||'Community member',upvotes:0,reactions:{},createdAt:serverTimestamp(),topic:($('#postTopic')?.value||'general').slice(0,40)}); $('#postTitle').value='';$('#postBody').value='';notify('Post published.','success');}catch(e){notify('Post could not be published.','error');} };
  async function upvotePost(id) { if(!requireUser())return; try {const ref=collection('posts').doc(id);await state.db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)throw new Error('missing');const d=s.data();const voters=asArray(d.upvotedBy);if(voters.includes(state.user.uid))throw new Error('duplicate');tx.update(ref,{upvotes:(Number(d.upvotes)||0)+1,upvotedBy:firebase.firestore.FieldValue.arrayUnion(state.user.uid)});});}catch(e){notify(e.message==='duplicate'?'You already upvoted this post.':'Could not upvote.','error');} }
  async function reactToPost(id,emoji) { if(!requireUser())return; const allowed=['🙏','❤️','🌳','👏','💚'];if(!allowed.includes(emoji))return;try{const ref=collection('posts').doc(id);await state.db.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)throw new Error('missing');const d=s.data(), reactions=d.reactions||{}, users=d.reactionUsers||{};if(asArray(users[state.user.uid]).includes(id))throw new Error('duplicate');tx.update(ref,{[`reactions.${emoji}`]:(Number(reactions[emoji])||0)+1, reactionUsers:{...users,[state.user.uid]:[id]}});});}catch(e){notify('Reaction was not saved (you may have reacted already).','error');} }

  // Daily quiz and mock/main exam engine.
  function normalizeQuestion(q,index) {
    const options=Array.isArray(q.options)?q.options:(['A','B','C','D'].map(k=>q[k]??q[`option${k}`]).filter(v=>v!==undefined));
    const answer=q.answerIndex!==undefined?Number(q.answerIndex):q.correctIndex!==undefined?Number(q.correctIndex):typeof q.answer==='number'?q.answer:['A','B','C','D'].indexOf(String(q.answer||q.correctAnswer||'').trim().toUpperCase());
    return {id:q.id||String(index),question:String(q.question||q.text||q.questionText||''),options:options.map(x=>String(typeof x==='object'?(x.text??x.value??''):x)),answerIndex:Number.isInteger(answer)?answer:-1,explanation:String(q.explanation||q.solution||''),section:String(q.section||'A'),marks:Number(q.marks)||((q.section==='B')?4:2),negativeMarks:q.negativeMarks!==undefined?Number(q.negativeMarks):((q.section==='B')?1:0.5)};
  }
  async function fetchQuestionBank(mode) {
    const name=CONFIG.examCollections[mode]; if(!name)throw new Error('Unknown exam type.');
    let query=collection(name);
    if(mode==='quiz') { const date=localDateKey(); try {const daily=await query.where('dateKey','==',date).get(); if(!daily.empty)return daily.docs.map(d=>normalizeQuestion({id:d.id,...d.data()},d.id));}catch(_){} }
    const snap=await query.orderBy('order','asc').limit(mode==='main'?300:150).get().catch(()=>query.limit(mode==='main'?300:150).get());
    return snap.docs.map((d,i)=>normalizeQuestion({id:d.id,...d.data()},i)).filter(q=>q.question&&q.options.length>=2);
  }
  window.startDailyQuiz = async function(){return startExamCore('quiz');};
  window.startMockExam = async function(which=1){return startExamCore(which===2?'mock2':'mock1');};
  window.triggerMainExamHallEntry = async function(override=false) {
    if(!requireUser())return;
    const c=state.examConfig||{}; const startAt=toMillis(c.examScheduleTime||c.startAt);
    if(startAt&&now()<startAt){notify(`The exam hall opens in ${formatDuration(Math.ceil((startAt-now())/1000))}.`);return;}
    if(startAt&&now()>startAt+CONFIG.lateEntryMinutes*60000&&!override){notify('Entry is closed. Contact the exam administrator.','error');return;}
    if(override&&!requireOwner())return;
    if(!await acceptPrivacyConsent())return;
    return startExamCore('main');
  };
  function toMillis(v) { if(!v)return 0; if(typeof v==='number')return v; if(v.toMillis)return v.toMillis(); const n=Date.parse(v);return Number.isFinite(n)?n:0; }
  function formatDuration(sec) { sec=Math.max(0,sec);const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?`${h}h ${m}m ${s}s`:`${m}m ${s}s`; }
  async function acceptPrivacyConsent() {
    const key='bishnoi_exam_privacy_consent_v1'; if(localStorage.getItem(key)==='yes')return true;
    const accepted=confirm('Exam privacy notice: during the exam, the site stores your answers and timing, records basic device/browser details for exam integrity, and may capture webcam snapshots only if camera proctoring is enabled and you grant camera permission. You may decline camera access. Continue?');
    if(accepted)localStorage.setItem(key,'yes'); return accepted;
  }
  async function startExamCore(mode) {
    if(!requireUser()||state.exam.active)return;
    try {
      const questions=await fetchQuestionBank(mode); if(!questions.length)throw new Error(`No questions found in Firestore collection "${CONFIG.examCollections[mode]}".`);
      const c=state.examConfig||{}; const minutes=mode==='quiz'?Number(c.dailyQuizMinutes)||10:mode==='main'?Number(c.examDuration)||CONFIG.defaultExamMinutes:Number(c.mockDuration)||60;
      const roll=state.profile?.rollNumber||`JAMBH-${new Date().getFullYear()}-${randomId(5)}`;
      state.exam={...state.exam,active:true,mode,questions,index:0,answers:{},review:{},endAt:now()+minutes*60000,tabSwitches:0,submitted:false,roll};
      saveExamDraft(); installExamGuards(); renderExamArena(); startExamTimer();
      if(mode==='main'&&c.enableCameraProctoring===true) await startCloudflareProctoring();
      switchTab('quiz');
    } catch(e) {console.error(e);notify(e.message||'Could not start exam.','error');}
  }
  function examDraftKey() { return `bishnoi_exam_draft_${state.user?.uid||'guest'}_${state.exam.mode||'none'}`; }
  function saveExamDraft() { if(!state.exam.active)return; const e=state.exam; try{sessionStorage.setItem(examDraftKey(),JSON.stringify({mode:e.mode,index:e.index,answers:e.answers,review:e.review,endAt:e.endAt,roll:e.roll,tabSwitches:e.tabSwitches,updatedAt:now()}));}catch(_){} }
  async function restoreAccidentalExamRefreshState() {
    if(!state.user||!state.db)return false;
    // Never resume after the absolute server-side deadline; do not trust a saved countdown.
    for(const mode of ['main','mock1','mock2','quiz']) {
      let raw;try{raw=sessionStorage.getItem(`bishnoi_exam_draft_${state.user.uid}_${mode}`);}catch(_){}
      if(!raw)continue;
      try {const d=JSON.parse(raw);if(d.endAt<=now()){sessionStorage.removeItem(`bishnoi_exam_draft_${state.user.uid}_${mode}`);continue;} const snap=await collection('examDrafts').doc(`${state.user.uid}_${mode}`).get().catch(()=>null);if(snap?.exists){const server=snap.data();if(Number(server.endAt)>0&&Number(server.endAt)<=now())continue;} const ok=confirm('An unfinished exam was found. Resume it with the original deadline?');if(!ok)continue;const questions=await fetchQuestionBank(mode);if(!questions.length)continue;state.exam={...state.exam,active:true,mode,questions,index:Math.min(Number(d.index)||0,questions.length-1),answers:d.answers||{},review:d.review||{},endAt:Number(d.endAt),roll:d.roll,tabSwitches:Number(d.tabSwitches)||0,submitted:false};installExamGuards();renderExamArena();startExamTimer();return true;}catch(e){console.warn('Exam restore failed',e);}
    } return false;
  }
  window.restoreAccidentalExamRefreshState=restoreAccidentalExamRefreshState;
  function installExamGuards() {
    removeExamGuards(); state.exam.beforeUnload=e=>{if(state.exam.active&&!state.exam.submitted){e.preventDefault();e.returnValue='Your exam is in progress.';}};window.addEventListener('beforeunload',state.exam.beforeUnload);
    document.addEventListener('visibilitychange',onVisibilityChange); document.addEventListener('contextmenu',blockContextMenu); document.addEventListener('copy',blockClipboard); document.addEventListener('cut',blockClipboard); document.addEventListener('paste',blockClipboard);
  }
  function removeExamGuards() { if(state.exam.beforeUnload)window.removeEventListener('beforeunload',state.exam.beforeUnload);document.removeEventListener('visibilitychange',onVisibilityChange);document.removeEventListener('contextmenu',blockContextMenu);document.removeEventListener('copy',blockClipboard);document.removeEventListener('cut',blockClipboard);document.removeEventListener('paste',blockClipboard); }
  function onVisibilityChange(){if(!state.exam.active||document.visibilityState!=='hidden')return;state.exam.tabSwitches++;saveExamDraft();notify(`Exam focus warning ${state.exam.tabSwitches}/${CONFIG.maxTabSwitches}.`,'error');if(state.exam.tabSwitches>=CONFIG.maxTabSwitches)finalizeExamSubmission('tab_switch_limit');}
  function blockContextMenu(e){if(state.exam.active)e.preventDefault();} function blockClipboard(e){if(state.exam.active)e.preventDefault();}
  function startExamTimer(){clearInterval(state.exam.timer);const tick=()=>{if(!state.exam.active)return;const sec=Math.ceil((state.exam.endAt-now())/1000);setText('examTimer',formatDuration(sec));if(sec<=0)finalizeExamSubmission('time_up');};tick();state.exam.timer=setInterval(tick,1000);}
  function renderExamArena() {
    let host=byId('examArena'); if(!host){host=document.createElement('section');host.id='examArena';host.hidden=true;host.className='exam-arena';document.body.appendChild(host);}
    const e=state.exam,q=e.questions[e.index]; if(!q)return;
    host.hidden=false;host.innerHTML=`<div class="exam-top"><span>Roll: ${escapeHtml(e.roll||'')}</span><span id="examTimer" aria-live="polite"></span><span>Question ${e.index+1}/${e.questions.length}</span></div><article class="exam-question"><h2>${escapeHtml(q.question)}</h2><div class="exam-options">${q.options.map((o,i)=>`<label class="exam-option"><input type="radio" name="examOption" value="${i}" ${Number(e.answers[q.id])===i?'checked':''}><span>${String.fromCharCode(65+i)}. ${escapeHtml(o)}</span></label>`).join('')}</div><div class="exam-actions"><button type="button" id="examPrev" ${e.index===0?'disabled':''}>Previous</button><button type="button" id="examReview">${e.review[q.id]?'Unmark review':'Mark for review'}</button><button type="button" id="examNext">${e.index===e.questions.length-1?'Finish questions':'Save & next'}</button><button type="button" id="examSubmit">Submit exam</button></div></article><div class="exam-palette" aria-label="Question palette">${e.questions.map((x,i)=>`<button type="button" data-q-index="${i}" class="${i===e.index?'current':''} ${e.answers[x.id]!==undefined?'answered':''} ${e.review[x.id]?'review':''}">${i+1}</button>`).join('')}</div>`;
    host.querySelectorAll('input[name="examOption"]').forEach(input=>input.onchange=()=>{e.answers[q.id]=Number(input.value);saveExamDraft();});
    byId('examPrev').onclick=()=>goQuestion(e.index-1);byId('examNext').onclick=()=>{saveExamDraft();if(e.index===e.questions.length-1){if(confirm('All questions reached. Submit now?'))finalizeExamSubmission('manual');}else goQuestion(e.index+1);};byId('examReview').onclick=()=>{e.review[q.id]=!e.review[q.id];saveExamDraft();renderExamArena();};byId('examSubmit').onclick=()=>{if(confirm('Submit your exam now? You cannot change answers afterwards.'))finalizeExamSubmission('manual');};host.querySelectorAll('[data-q-index]').forEach(b=>b.onclick=()=>goQuestion(Number(b.dataset.qIndex)));
  }
  function goQuestion(index){if(index<0||index>=state.exam.questions.length)return;state.exam.index=index;saveExamDraft();renderExamArena();}
  window.selectOption = function(index){const q=state.exam.questions[state.exam.index];if(q){state.exam.answers[q.id]=Number(index);saveExamDraft();renderExamArena();}};
  function scoreExam(e) {let correct=0,wrong=0,unanswered=0,marks=0;const detail=e.questions.map(q=>{const a=e.answers[q.id];let status='unanswered',earned=0;if(a===undefined||a===null){unanswered++;}else if(Number(a)===q.answerIndex&&q.answerIndex>=0){correct++;status='correct';earned=q.marks;}else{wrong++;status='wrong';earned=-q.negativeMarks;}marks+=earned;return {questionId:q.id,status,selectedIndex:a??null,correctIndex:q.answerIndex,earned};});return {correct,wrong,unanswered,score:Math.round(marks*100)/100,total:e.questions.reduce((s,q)=>s+q.marks,0),detail};}
