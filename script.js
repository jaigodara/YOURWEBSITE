/* ==========================================================================
   Bishnoi Community Portal - Application Logic Engine (script.js)
   ========================================================================== */

// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDD58ybmm1bmmc5k5AwsxiaDiOXxlp7APA",
  authDomain: "bishnoi-platform.firebaseapp.com",
  projectId: "bishnoi-platform",
  storageBucket: "bishnoi-platform.firebasestorage.app",
  messagingSenderId: "1001226124051",
  appId: "1:1001226124051:web:ad4dc69e04e6701024f8e6"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. OWNER CREDENTIALS
const OWNER_PHONE = "9898";
const OWNER_PASS = "bishnoi29";

// 3. APPLICATION STATE
let currentUser = JSON.parse(localStorage.getItem('bishnoi_secure_user') || 'null');
let isRegisterMode = false;
let selectedPostBase64 = null;
let quizList = [];
let currentQ = 0;
let qScore = 0;
let quizStartTime = null;
let confirmCallback = null;
let lastPostTime = 0;
let currentBannerText = '"जीव दया पालणी, रूंख लीलो नी घावै" — प्रकृति एवं सभी मूक जीवों के प्रति करुणा रखें।';
let amavasyaTargetDate = null;
let amavasyaTimerInterval = null;

// Digital Jaap Mala State
let malaBeadCount = parseInt(localStorage.getItem('bishnoi_mala_beads') || '0');
let malaLapsCount = parseInt(localStorage.getItem('bishnoi_mala_laps') || '0');
let malaTotalCount = parseInt(localStorage.getItem('bishnoi_mala_total') || '0');

// 29 Niyams Static Data
const NIYAMS_DATA = [
  { num: 1, title: "प्रसूति सूतक", rule: "तीस दिन सूतक पाळणा", desc: "सूतक काल में ३० दिन तक स्वच्छता और विश्राम रखें।" },
  { num: 2, title: "ऋतुवंती पृथक्करण", rule: "पांच दिन रजस्वला पृथक्करण", desc: "माहवारी के दौरान ५ दिन का गृह-कार्य से विश्राम।" },
  { num: 3, title: "प्रातः स्नान", rule: "सेरो करो अchnान", desc: "प्रतिदिन प्रातःकाल स्नान कर पवित्र रहें।" },
  { num: 4, title: "शील व संतोष", rule: "शील संतोष सूच राखणा", desc: "सदाचारी, शांत और संतोषी स्वभाव रखें।" },
  { num: 5, title: "द्विकाल संध्या", rule: "द्वादश कर्म सांध", desc: "सुबह-शाम दोनों समय संध्या और ईश्वर स्मरण करें।" },
  { num: 6, title: "सांझ आरती", rule: "सांझ आरती गुण गावै", desc: "संध्या समय आरती व भगवान के गुणों का गायन करें।" },
  { num: 7, title: "प्रातः होम", rule: "प्रात: होम करणा", desc: "प्रतिदिन प्रातःकाल घी और सामग्री से हवन करें।" },
  { num: 8, title: "पानी छानना", rule: "पाणी छान पीवणा", desc: "सूक्ष्म जीवों की रक्षा के लिए पानी सदा छानकर पियें।" },
  { num: 9, title: "ईंधन जांच", rule: "ईंधन बीन बाळणा", desc: "चूल्हे में लकड़ी कीट-पतंगों को देखकर व झाड़कर ही जलाएं।" },
  { num: 10, title: "क्षमा धारण", rule: "क्षमा दया मन आणणा", desc: "मन में सदा क्षमा और सहनशीलता बनाए रखें।" },
  { num: 11, title: "दया भाव", rule: "दया हिरदै राखणी", desc: "प्रत्येक जीव और मनुष्य के प्रति दयालु रहें।" },
  { num: 12, title: "चोरी त्याग", rule: "चोरी नहीं करणी", desc: "पराई वस्तु कभी न चुराएं।" },
  { num: 13, title: "निंदा त्याग", rule: "निंदा नहीं करणी", desc: "किसी की पीठ पीछे बुराई न करें।" },
  { num: 14, title: "झूठ त्याग", rule: "झूठ नहीं बोलना", desc: "सदा सत्य और मधुर वाणी बोलें।" },
  { num: 15, title: "वाद-विवाद त्याग", rule: "वाद विवाद नहीं करणा", desc: "व्यर्थ के झगड़े और अहंकार भरी बहस से बचें।" },
  { num: 16, title: "अमावस्या व्रत", rule: "अमावस्या व्रत राखणा", desc: "अमावस्या के दिन उपवास रखें और आत्म-चिंतन करें।" },
  { num: 17, title: "विष्णु स्मरण", rule: "विष्णु नाम जपणा", desc: "हृदय में ॐ विष्णवे नमः का निरंतर स्मरण रखें।" },
  { num: 18, title: "जीव दया", rule: "जीव दया पालणी", desc: "मूक जीवों की रक्षा करें, किसी जीव की हत्या न करें।" },
  { num: 19, title: "हरा वृक्ष रक्षा", rule: "रूंख लीलो नी घावै", desc: "हरे-भरे पेड़ों को कभी न काटें।" },
  { num: 20, title: "काम-क्रोध संयम", rule: "अजर जरे सो सूर", desc: "काम, क्रोध और वासनाओं पर नियंत्रण रखें।" },
  { num: 21, title: "स्वहस्त आहार", rule: "आपने हाथे रांधणा", desc: "पवित्रता के साथ अपने हाथों से बना शुद्ध भोजन करें।" },
  { num: 22, title: "पशु थापण", rule: "अमर रखावै थाट", desc: "निराश्रित और वृद्ध पशुओं को आश्रय दें।" },
  { num: 23, title: "बैल बधिया निषेध", rule: "बैल बधिया नहीं करणा", desc: "बैलों का बंध्याकरण न करें।" },
  { num: 24, title: "अमल त्याग", rule: "अमल नहीं खाणा", desc: "अफीम और नशे की वस्तुओं का पूर्ण त्याग करें।" },
  { num: 25, title: "तम्बाकू त्याग", rule: "तम्बाकू नहीं पीणा", desc: "तम्बाकू, बीड़ी, सिगरेट आदि का पूर्ण निषेध।" },
  { num: 26, title: "भांग त्याग", rule: "भांग नहीं पीणी", desc: "भांग और गांजे का सेवन कभी न करें।" },
  { num: 27, title: "मदिरा त्याग", rule: "मद्य नहीं पीणा", desc: "शराब का पूरी तरह त्याग करें।" },
  { num: 28, title: "मांस त्याग", rule: "मांस नहीं खाणा", desc: "पूर्णतः शाकाहारी रहें, मांस कभी न छुएं।" },
  { num: 29, title: "नील त्याग", rule: "नील नहीं पहरणा", desc: "नील के पौधों को काटकर बनने वाले नीले वस्त्रों का त्याग।" }
];

// 4. TOAST & MODAL UTILITIES
function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  document.getElementById('toastMsg').innerText = msg;
  toast.classList.remove('-translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('-translate-y-20', 'opacity-0');
  }, 3200);
}

function openConfirmModal(title, msg, callback) {
  document.getElementById('confirmTitle').innerText = title;
  document.getElementById('confirmMsg').innerText = msg;
  confirmCallback = callback;
  document.getElementById('customConfirmModal').classList.remove('hidden');
}

function closeConfirmModal(result) {
  document.getElementById('customConfirmModal').classList.add('hidden');
  if (confirmCallback) confirmCallback(result);
  confirmCallback = null;
}

// 5. APPLICATION INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  renderNiyams(NIYAMS_DATA);
  listenBanner();
  listenPdfs();
  listenPosts();
  loadQuiz();
  listenTreeCounter();
  listenWinners();
  listenNotices();
  listenAudios();
  computeAutoPanchang();
  listenAmavasyaConfig();
  renderMalaCounters();
});

// 6. NAVIGATION CONTROLS
function switchTab(id) {
  ['home', 'mala', 'niyams', 'library', 'community', 'quiz', 'history', 'admin'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const nav = document.getElementById(`nav-${t}`);
    if (el) el.classList.add('hidden');
    if (nav) nav.classList.remove('nav-btn-active');
  });

  const target = document.getElementById(`tab-${id}`);
  const activeNav = document.getElementById(`nav-${id}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('view-panel');
  }
  if (activeNav) activeNav.classList.add('nav-btn-active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchHistorySubTab(sub) {
  const histView = document.getElementById('historySubView');
  const kidsView = document.getElementById('kidsSubView');
  const histBtn = document.getElementById('sub-history-btn');
  const kidsBtn = document.getElementById('sub-kids-btn');

  if (sub === 'full-history') {
    histView.classList.remove('hidden');
    kidsView.classList.add('hidden');
    histBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
    kidsBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600 hover:text-forest";
  } else {
    histView.classList.add('hidden');
    kidsView.classList.remove('hidden');
    kidsBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
    histBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600 hover:text-forest";
  }
}

// 7. SECURE AUTHENTICATION ENGINE
function openAuthModal() {
  document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  document.getElementById('nameRow').classList.toggle('hidden', !isRegisterMode);
  document.getElementById('authTitle').innerText = isRegisterMode ? "नया पंजीकरण (Register)" : "लॉगिन (Sign In)";
  document.getElementById('authSubmitBtn').innerText = isRegisterMode ? "खाता बनाएं (Register)" : "लॉगिन करें";
  document.getElementById('authToggleBtn').innerText = isRegisterMode 
    ? "पहले से पंजीकृत हैं? लॉगिन करें" 
    : "नए सदस्य हैं? पहले पंजीकरण (Register) करें";
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('loginPhone').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const nameInput = document.getElementById('loginName').value.trim();

  // Owner Login
  if (phone === OWNER_PHONE && pass === OWNER_PASS) {
    currentUser = { name: "व्यवस्थापक (Owner)", phone: OWNER_PHONE, isOwner: true };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    closeAuthModal();
    showToast("व्यवस्थापक के रूप में स्वागत है!");
    switchTab('admin');
    return;
  }

  // Strict 10-Digit Mobile Check
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return showToast("कृपया सही १० अंकों का भारतीय मोबाइल नंबर दर्ज करें!");
  }

  // Registration Mode
  if (isRegisterMode) {
    if (!nameInput) {
      return showToast("कृपया अपना पूरा नाम दर्ज करें!");
    }
    try {
      const userDoc = await db.collection('users').doc(phone).get();
      if (userDoc.exists) {
        return showToast("यह नंबर पहले से पंजीकृत है! कृपया लॉगिन करें।");
      }
      await db.collection('users').doc(phone).set({
        name: nameInput,
        phone: phone,
        pass: pass,
        registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      currentUser = { name: nameInput, phone: phone, isOwner: false };
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      updateNavAuth();
      closeAuthModal();
      showToast(`पंजीकरण सफल! स्वागत है, ${currentUser.name}`);
    } catch (err) {
      showToast("पंजीकरण में त्रुटि: " + err.message);
    }
    return;
  }

  // Sign In Mode
  try {
    const userDoc = await db.collection('users').doc(phone).get();
    if (!userDoc.exists) {
      return showToast("यह नंबर पंजीकृत नहीं है! कृपया पहले Register करें।");
    }

    const userData = userDoc.data();
    if (userData.pass && userData.pass !== pass) {
      return showToast("गलत पासवर्ड! कृपया पुनः प्रयास करें।");
    }

    await db.collection('users').doc(phone).update({
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });

    currentUser = { name: userData.name || "भक्त", phone: phone, isOwner: false };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    closeAuthModal();
    showToast(`स्वागत है, ${currentUser.name}!`);
  } catch (err) {
    showToast("लॉगिन त्रुटि: " + err.message);
  }
}

function logoutUser() {
  localStorage.removeItem('bishnoi_secure_user');
  currentUser = null;
  updateNavAuth();
  switchTab('home');
  showToast("सफलतापूर्वक लॉगआउट किया गया।");
}

function updateNavAuth() {
  const container = document.getElementById('authActionsContainer');
  const adminNav = document.getElementById('nav-admin');
  const adminNavMob = document.getElementById('nav-admin-mobile');
  const postPrompt = document.getElementById('postAuthPrompt');
  const postEditor = document.getElementById('postEditor');

  if (currentUser) {
    container.innerHTML = `
      <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200">
        ${currentUser.isOwner ? '🛡️ व्यवस्थापक' : '👤 ' + currentUser.name}
      </span>
      <button onclick="logoutUser()" class="text-xs text-stone-500 hover:text-red-700 font-semibold px-1 transition">लॉगआउट</button>
    `;
    if (postPrompt) postPrompt.classList.add('hidden');
    if (postEditor) postEditor.classList.remove('hidden');

    if (currentUser.isOwner) {
      if (adminNav) adminNav.classList.remove('hidden');
      if (adminNavMob) adminNavMob.classList.remove('hidden');
    } else {
      if (adminNav) adminNav.classList.add('hidden');
      if (adminNavMob) adminNavMob.classList.add('hidden');
    }
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal()" class="px-3 py-1.5 rounded-lg bg-forest text-white text-xs font-semibold hover:bg-emerald-950 transition">
        लॉगिन / शामिल हों
      </button>
    `;
    if (postPrompt) postPrompt.classList.remove('hidden');
    if (postEditor) postEditor.classList.add('hidden');
    if (adminNav) adminNav.classList.add('hidden');
    if (adminNavMob) adminNavMob.classList.add('hidden');
  }
}

// 8. DIGITAL JAAP MALA LOGIC
function updateMantraName() {
  const selected = document.getElementById('malaMantraSelect').value;
  document.getElementById('activeMantraDisplay').innerText = selected;
}

function tapMalaBead() {
  const isVibe = document.getElementById('vibrationToggle').checked;
  if (isVibe && navigator.vibrate) {
    navigator.vibrate(35);
  }

  malaBeadCount++;
  malaTotalCount++;

  if (malaBeadCount >= 108) {
    malaBeadCount = 0;
    malaLapsCount++;
    if (isVibe && navigator.vibrate) {
      navigator.vibrate([80, 50, 100]);
    }
    showToast("ॐ शांति! एक संपूर्ण माला (१०८ जप) पूर्ण हुई। साधुवाद!");
    confetti({ particleCount: 35, spread: 50 });
  }

  saveMalaState();
  renderMalaCounters();
}

function renderMalaCounters() {
  document.getElementById('currentBeadDisplay').innerText = malaBeadCount;
  document.getElementById('malaLapsDisplay').innerText = malaLapsCount;
  document.getElementById('malaTotalDisplay').innerText = malaTotalCount;
}

function saveMalaState() {
  localStorage.setItem('bishnoi_mala_beads', malaBeadCount.toString());
  localStorage.setItem('bishnoi_mala_laps', malaLapsCount.toString());
  localStorage.setItem('bishnoi_mala_total', malaTotalCount.toString());
}

function resetMalaCounter() {
  openConfirmModal("माला शून्य करें?", "क्या आप जप माला का काउंटर पुनः ० से शुरू करना चाहते हैं?", (res) => {
    if (res) {
      malaBeadCount = 0;
      malaLapsCount = 0;
      malaTotalCount = 0;
      saveMalaState();
      renderMalaCounters();
      showToast("जप माला रीसेट हो गई।");
    }
  });
}

// 9. AUTOMATED DAILY PANCHANG CALCULATOR
function computeAutoPanchang() {
  const now = new Date();
  const vaars = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const currentVaar = vaars[now.getDay()];
  const samvat = now.getFullYear() + 57;

  const refNewMoon = new Date('2026-01-18T00:00:00Z').getTime();
  const diffDays = (now.getTime() - refNewMoon) / (1000 * 60 * 60 * 24);
  const synodic = 29.530588;
  const moonAge = (diffDays % synodic + synodic) % synodic;
  const tithiNum = Math.floor(moonAge / (synodic / 30)) + 1;

  let paksha = tithiNum <= 15 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष';
  let tithiName = tithiNum <= 15 ? `तिथि ${tithiNum}` : `तिथि ${tithiNum - 15}`;
  if (tithiNum === 15) tithiName = 'पूर्णिमा';
  if (tithiNum === 30 || tithiNum === 0) tithiName = 'अमावस्या';

  document.getElementById('autoPanchangDate').innerText = `${currentVaar} • विक्रम संवत ${samvat}`;
  document.getElementById('autoPanchangDetails').innerText = `आज का दिन: ${now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })} | ${paksha}, ${tithiName}। प्रातः होम एवं नाम स्मरण से दिन आरंभ करें।`;
}

// 10. DYNAMIC AMAVASYA & LIVE COUNTDOWN
function listenAmavasyaConfig() {
  db.collection('settings').doc('amavasyaConfig').onSnapshot(doc => {
    if (doc.exists) {
      const cfg = doc.data();
      if (cfg.name) document.getElementById('amavasyaTitleDisplay').innerText = cfg.name;
      if (cfg.desc) document.getElementById('amavasyaFastingNote').innerText = cfg.desc;
      if (cfg.date) {
        amavasyaTargetDate = new Date(cfg.date + "T00:00:00");
        startAmavasyaTimer();
      }
    }
  });
}

function startAmavasyaTimer() {
  if (amavasyaTimerInterval) clearInterval(amavasyaTimerInterval);

  function update() {
    if (!amavasyaTargetDate) return;
    const now = new Date();
    const diff = amavasyaTargetDate.getTime() - now.getTime();
    const box = document.getElementById('amavasyaCountdownBox');

    const isToday = (
      now.getFullYear() === amavasyaTargetDate.getFullYear() &&
      now.getMonth() === amavasyaTargetDate.getMonth() &&
      now.getDate() === amavasyaTargetDate.getDate()
    );

    if (isToday) {
      box.className = "text-xs font-bold text-emerald-900 bg-amber-300 p-2.5 rounded-lg border border-amber-400 text-center animate-pulse";
      box.innerHTML = "🚩 आज पावन अमावस्या व्रत दिवस है — उपवास, ध्यान, हवन एवं पाहल साधना";
      return;
    }

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      box.className = "text-xs font-semibold text-terracotta font-mono bg-white/90 p-2 rounded-lg border border-emerald-200";
      box.innerHTML = `⏳ समय शेष: <b>${days} दिन : ${hours} घंटे : ${mins} मिनट : ${secs} सेकंड</b>`;
    } else {
      box.className = "text-xs font-medium text-stone-500 bg-stone-100 p-2 rounded-lg border border-stone-200";
      box.innerHTML = "अमावस्या व्रत संपन्न हुआ — अगली तिथि की प्रतीक्षा";
    }
  }

  update();
  amavasyaTimerInterval = setInterval(update, 1000);
}

async function saveAmavasyaConfig() {
  const name = document.getElementById('adminAmavasyaName').value.trim();
  const date = document.getElementById('adminAmavasyaDate').value;
  const desc = document.getElementById('adminAmavasyaDesc').value.trim();

  if (!date) return showToast('कृपया अमावस्या की तारीख चुनें');
  await db.collection('settings').doc('amavasyaConfig').set({
    name: name || "पावन अमावस्या",
    date: date,
    desc: desc || "उपवास, ध्यान साधना, हवन एवं आत्म-चिंतन",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast('अमावस्या तिथि सफलतापूर्वक सहेजी गई!');
}

// 11. MANUAL GEMINI API ENGINE (STORED SAFELY IN BROWSER STORAGE)
function getGeminiKey() {
  let key = localStorage.getItem('gemini_user_api_key');
  if (!key) {
    key = prompt("कृपया अपनी Gemini API Key यहाँ पेस्ट करें:");
    if (key && key.trim()) {
      key = key.trim();
      localStorage.setItem('gemini_user_api_key', key);
    } else {
      return null;
    }
  }
  return key;
}

function resetGeminiKey() {
  localStorage.removeItem('gemini_user_api_key');
  showToast("Gemini API कुंजी हटा दी गई। अगली बार नई कुंजी पूछी जाएगी।");
}

async function callGemini(promptText) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error("वैध Gemini API Key दर्ज नहीं की गई।");
  }

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  const payload = {
    contents: [{ parts: [{ text: promptText }] }]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": apiKey
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
    return data.candidates[0].content.parts[0].text;
  }
  throw new Error(data.error ? data.error.message : "Gemini AI से प्रतिक्रिया प्राप्त नहीं हुई");
}

async function generateAiQuizQuestions() {
  const btn = document.getElementById('aiQuizGenBtn');
  btn.innerText = "⏳ Gemini प्रश्न बना रहा है...";
  btn.disabled = true;

  const prompt = `विश्नोई समाज के २९ नियमों, पर्यावरण रक्षा, खेजड़ली बलिदान एवं नैतिक मूल्यों पर आधारित ५ प्रामाणिक वस्तुनिष्ठ (MCQ) प्रश्न हिंदी में बनाएं। 
प्रारूप strictly ऐसा होना चाहिए बिना किसी अतिरिक्त वार्तालाप के:

Q: प्रश्न यहाँ लिखें?
A) विकल्प 1
B) विकल्प 2
C) विकल्प 3
D) विकल्प 4
Ans: A`;

  try {
    const result = await callGemini(prompt);
    document.getElementById('adminBulkQuizText').value = result.trim();
    showToast("Gemini ने ५ नए प्रश्न तैयार कर दिए! नीचे 'Publish All' पर क्लिक करें।");
  } catch (err) {
    showToast("AI Error: " + err.message);
  } finally {
    btn.innerHTML = `<span class="font-bold text-xs text-amber-200">⚡ Gemini से 5 नए प्रश्न बनवाएं</span><span class="text-[11px] text-stone-300 mt-1">AI स्वतः प्रश्न व विकल्प तैयार कर नीचे बल्क बॉक्स में दर्ज करेगा।</span>`;
    btn.disabled = false;
  }
}

async function generateAiDailySandesh() {
  const btn = document.getElementById('aiSandeshGenBtn');
  btn.innerText = "⏳ AI संदेश तैयार कर रहा है...";
  btn.disabled = true;

  const prompt = `Write a short, highly inspirational 1-line quote in Hindi for the Bishnoi community focusing on tree protection, kindness to all animals, or moral virtues. Do not add quotes or formatting.`;

  try {
    const result = await callGemini(prompt);
    document.getElementById('adminBannerInput').value = result.trim();
    showToast("Gemini ने नया सुविचार लिख दिया! 'Update Banner' दबाकर लाइव करें।");
  } catch (err) {
    showToast("AI Error: " + err.message);
  } finally {
    btn.innerHTML = `<span class="font-bold text-xs text-amber-200">📢 Gemini से नया पावन सुविचार लिखवाएं</span><span class="text-[11px] text-stone-300 mt-1">जीव रक्षा व आचार संहिता पर सुविचार तैयार करें।</span>`;
    btn.disabled = false;
  }
}

// 12. DIRECT PDF EXPORTS (jspdf INTEGRATION)
async function downloadQuizResultsPdf() {
  showToast("Quiz परिणाम PDF तैयार हो रहा है...");
  const snap = await db.collection('quizAttempts').get();
  if (snap.empty) return showToast("कोई परीक्षा रिकॉर्ड उपलब्ध नहीं है।");

  let records = [];
  snap.forEach(doc => records.push(doc.data()));

  records.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.timeTakenSeconds || 0) - (b.timeTakenSeconds || 0);
  });

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(20, 54, 34);
  doc.text("Bishnoi Community Portal - Quiz Results", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 25);

  const tableRows = records.map((r, idx) => [
    idx + 1,
    r.name || 'Anonymous',
    r.phone || 'N/A',
    `${r.score} / ${r.total}`,
    `${r.timeTakenSeconds || 0}s`,
    r.date ? new Date(r.date).toLocaleDateString('en-GB') : ''
  ]);

  doc.autoTable({
    startY: 30,
    head: [['Rank', 'Participant', 'Mobile', 'Score', 'Time', 'Date']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [20, 54, 34] },
    styles: { fontSize: 9 }
  });

  doc.save("Bishnoi_Quiz_Results.pdf");
}

async function download7DaysUsersPdf() {
  showToast("७-दिवसीय सदस्य PDF तैयार हो रहा है...");
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const snap = await db.collection('users').get();
  if (snap.empty) return showToast("कोई सदस्य नहीं मिला।");

  let rows = [];
  snap.forEach(doc => {
    const u = doc.data();
    const regDate = u.registeredAt ? u.registeredAt.toDate() : new Date();
    if (regDate >= sevenDaysAgo) {
      rows.push([
        u.name || 'User',
        u.phone || 'N/A',
        regDate.toLocaleDateString('en-GB')
      ]);
    }
  });

  if (rows.length === 0) return showToast("विगत ७ दिनों में कोई नया सदस्य नहीं जुड़ा।");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(20, 54, 34);
  doc.text("Bishnoi Community Portal - New Registered Users (7 Days)", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 25);

  doc.autoTable({
    startY: 30,
    head: [['Full Name', 'Mobile Number', 'Registration Date']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [179, 74, 27] },
    styles: { fontSize: 9 }
  });

  doc.save("Bishnoi_Registered_Users_7Days.pdf");
}

// 13. REDESIGNED LOGICAL CERTIFICATE
function generateCertificate(name, score) {
  const canvas = document.getElementById('certCanvas');
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FAF7EE';
  ctx.fillRect(0, 0, 800, 600);

  // Border Frame
  ctx.strokeStyle = '#143622';
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, 760, 560);

  ctx.strokeStyle = '#B34A1B';
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, 736, 536);

  // Logical Titles
  ctx.fillStyle = '#143622';
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('विश्नोई समाज डिजिटल ज्ञान परीक्षा', 400, 105);

  ctx.fillStyle = '#B34A1B';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('योग्यता एवं सहभागिता सम्मान पत्र', 400, 150);

  ctx.fillStyle = '#4A3E37';
  ctx.font = '16px sans-serif';
  ctx.fillText('यह प्रमाणित किया जाता है कि प्रतिभागी', 400, 215);

  ctx.fillStyle = '#143622';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(name, 400, 265);

  // Adaptable Body Text
  ctx.fillStyle = '#4A3E37';
  ctx.font = '16px sans-serif';
  ctx.fillText(`ने विश्नोई समाज दैनिक ज्ञान एवं आचार संहिता परीक्षा में`, 400, 325);
  ctx.fillText(`सराहनीय प्रदर्शन करते हुए ${score}% अंक प्राप्त किए हैं।`, 400, 355);

  ctx.fillStyle = '#2D6A4F';
  ctx.font = 'italic 16px sans-serif';
  ctx.fillText('"जीव दया पालणी, रूंख लीलो नी घावै"', 400, 425);

  // Verification & Date
  ctx.fillStyle = '#786A5E';
  ctx.font = '12px sans-serif';
  ctx.fillText(`दिनांक: ${new Date().toLocaleDateString('hi-IN')}`, 200, 505);
  ctx.fillText('डिजिटल प्रमाणन कोड: bishnoi-portal', 600, 505);

  const link = document.createElement('a');
  link.download = `Bishnoi_Samman_Patra_${name}.png`;
  link.href = canvas.toDataURL();
  link.click();
  showToast("सम्मान पत्र डाउनलोड हो गया!");
}

// 14. QUIZ ARENA FLOW
function startQuizNow() {
  document.getElementById('quizIntroCard').classList.add('hidden');
  document.getElementById('quizActiveBox').classList.remove('hidden');
  currentQ = 0;
  qScore = 0;
  quizStartTime = Date.now();
  renderQuiz();
}

function loadQuiz() {
  db.collection('quiz').onSnapshot(snap => {
    if (!snap.empty) {
      quizList = snap.docs.map(d => d.data());
    } else {
      quizList = [
        {
          q: "खेजड़ली गांव में ३६३ वीरों का महान बलिदान किस वर्ष हुआ था?",
          opts: ["1730 ईस्वी (भाद्रपद शुक्ल दशमी)", "1485 ईस्वी", "1857 ईस्वी", "1947 ईस्वी"],
          ans: 0
        },
        {
          q: "गुरु जम्भेश्वर भगवान द्वारा २९ नियमों की घोषणा किस पवित्र स्थान पर हुई?",
          opts: ["मुकाम", "समराथल धोरा", "जांगलू", "लालासर"],
          ans: 1
        },
        {
          q: "अमृता देवी विश्नोई का अमर वचन क्या था?",
          opts: ["सत्यमेव जयते", "सिर साटै रूंख रहै, तो भी सस्तो जाण", "अहिंसा परमो धर्मः", "जय जवान जय किसान"],
          ans: 1
        }
      ];
    }
  });
}

function renderQuiz() {
  const box = document.getElementById('quizActiveBox');
  if (!quizList.length) {
    box.innerHTML = `<div class="text-center py-4 text-xs">कोई प्रश्न उपलब्ध नहीं हैं।</div>`;
    return;
  }

  if (currentQ >= quizList.length) {
    const timeTakenSeconds = Math.round((Date.now() - quizStartTime) / 1000);
    const percentage = Math.round((qScore / quizList.length) * 100);

    if (currentUser) {
      db.collection('quizAttempts').add({
        name: currentUser.name,
        phone: currentUser.phone || 'N/A',
        score: qScore,
        total: quizList.length,
        timeTakenSeconds: timeTakenSeconds,
        date: new Date().toISOString()
      });
    }

    box.innerHTML = `
      <div class="text-center space-y-3 py-4">
        <div class="text-4xl">🏆</div>
        <h3 class="font-yatra text-xl text-forest">परीक्षा पूर्ण हुई!</h3>
        <p class="text-xs text-stone-600">कुल प्राप्तांक: <strong class="text-terracotta text-sm">${qScore} / ${quizList.length}</strong> (${percentage}%)</p>
        <p class="text-[11px] text-stone-400">समय: ${timeTakenSeconds} सेकंड</p>
        
        <div class="pt-3 flex flex-wrap justify-center gap-2">
          <button onclick="backToQuizIntro()" class="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-xs font-semibold text-stone-700">
            ← मुख्य पृष्ठ
          </button>
          <button onclick="startQuizNow()" class="px-4 py-2 bg-forest text-white rounded-lg text-xs font-semibold hover:bg-emerald-950">
            पुनः प्रयास करें
          </button>
          ${percentage >= 80 ? `
            <button onclick="generateCertificate('${currentUser ? currentUser.name : 'प्रतिभागी'}', ${percentage})" class="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold shadow">
              📜 सम्मान पत्र डाउनलोड करें
            </button>
          ` : ''}
        </div>
      </div>
    `;
    confetti({ particleCount: 50, spread: 60 });
    return;
  }

  const q = quizList[currentQ];
  box.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center text-xs text-stone-500 border-b border-stone-100 pb-2">
        <span>प्रश्न ${currentQ + 1} / ${quizList.length}</span>
        <span>Score: ${qScore}</span>
      </div>
      <h3 class="font-bold text-sm sm:text-base text-forest">${q.q}</h3>
      <div class="space-y-2 pt-1">
        ${q.opts.map((opt, i) => `
          <button onclick="checkAnswer(${i})" class="w-full text-left p-3 text-xs rounded-xl border border-stone-200 hover:bg-amber-50 bg-white transition-all font-medium">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="quizFeedbackBox" class="hidden text-xs p-2.5 rounded-lg font-semibold"></div>
    </div>
  `;
}

function checkAnswer(chosen) {
  const q = quizList[currentQ];
  const feed = document.getElementById('quizFeedbackBox');
  feed.classList.remove('hidden');

  if (chosen === q.ans) {
    qScore++;
    feed.className = "text-xs p-2.5 rounded-lg font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300";
    feed.innerText = "✓ सही उत्तर! (Correct)";
  } else {
    feed.className = "text-xs p-2.5 rounded-lg font-semibold bg-rose-100 text-rose-800 border border-rose-300";
    feed.innerText = `✕ गलत उत्तर! सही उत्तर था: ${q.opts[q.ans]}`;
  }

  setTimeout(() => {
    currentQ++;
    renderQuiz();
  }, 1200);
}

function backToQuizIntro() {
  document.getElementById('quizActiveBox').classList.add('hidden');
  document.getElementById('quizIntroCard').classList.remove('hidden');
}

// 15. BULK QUIZ IMPORTER
async function importBulkQuiz() {
  const rawText = document.getElementById('adminBulkQuizText').value.trim();
  if (!rawText) return showToast('कृपया प्रश्न टेक्स्ट पेस्ट करें');

  const blocks = rawText.split(/\n\s*\n/);
  let parsedQuestions = [];

  for (let block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let qText = '';
    let opts = [];
    let ansIdx = 0;

    for (let line of lines) {
      if (line.match(/^Q\s*:/i)) {
        qText = line.replace(/^Q\s*:/i, '').trim();
      } else if (line.match(/^[A-D]\s*\)/i)) {
        opts.push(line.replace(/^[A-D]\s*\)/i, '').trim());
      } else if (line.match(/^Ans\s*:/i)) {
        const letter = line.replace(/^Ans\s*:/i, '').trim().toUpperCase();
        ansIdx = letter === 'A' ? 0 : letter === 'B' ? 1 : letter === 'C' ? 2 : 3;
      }
    }
    if (qText && opts.length >= 2) {
      parsedQuestions.push({ q: qText, opts: opts, ans: ansIdx });
    }
  }

  if (parsedQuestions.length === 0) return showToast('प्रारूप सही नहीं है। Q:, A), B)... Ans: का प्रयोग करें।');

  const batch = db.batch();
  parsedQuestions.forEach(q => {
    const ref = db.collection('quiz').doc();
    batch.set(ref, {
      q: q.q, opts: q.opts, ans: q.ans,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
  showToast(`कुल ${parsedQuestions.length} प्रश्न लाइव जोड़ दिए गए!`);
  document.getElementById('adminBulkQuizText').value = '';
}

// 16. DAILY QUIZ WINNERS
function listenWinners() {
  db.collection('settings').doc('dailyWinners').onSnapshot(doc => {
    if (doc.exists) {
      const w = doc.data();
      if (w.p1Name) {
        document.getElementById('winner1Name').innerText = w.p1Name;
        document.getElementById('winner1Score').innerText = w.p1Score || '';
      }
      if (w.p2Name) {
        document.getElementById('winner2Name').innerText = w.p2Name;
        document.getElementById('winner2Score').innerText = w.p2Score || '';
      }
      if (w.p3Name) {
        document.getElementById('winner3Name').innerText = w.p3Name;
        document.getElementById('winner3Score').innerText = w.p3Score || '';
      }
    }
  });
}

async function saveDailyWinners() {
  const p1Name = document.getElementById('win1InputName').value.trim();
  const p1Score = document.getElementById('win1InputScore').value.trim();
  const p2Name = document.getElementById('win2InputName').value.trim();
  const p2Score = document.getElementById('win2InputScore').value.trim();
  const p3Name = document.getElementById('win3InputName').value.trim();
  const p3Score = document.getElementById('win3InputScore').value.trim();

  await db.collection('settings').doc('dailyWinners').set({
    p1Name, p1Score, p2Name, p2Score, p3Name, p3Score,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast("शीर्ष विजेता सूची अपडेट हो गई!");
}

// 17. COMMUNITY FORUM (संवाद मंच)
function updateCharCount() {
  const len = document.getElementById('postText').value.length;
  document.getElementById('charCountDisplay').innerText = `${len} / 300`;
}

function previewPostImg(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 500;
        const scale = maxW / img.width;
        canvas.width = (img.width > maxW) ? maxW : img.width;
        canvas.height = (img.width > maxW) ? (img.height * scale) : img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        selectedPostBase64 = canvas.toDataURL('image/jpeg', 0.6);
        document.getElementById('postImgPreview').src = selectedPostBase64;
        document.getElementById('postImgPreviewWrap').classList.remove('hidden');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function clearPostImg() {
  selectedPostBase64 = null;
  document.getElementById('postPhoto').value = '';
  document.getElementById('postImgPreviewWrap').classList.add('hidden');
}

async function submitChaupalPost() {
  if (!currentUser) return openAuthModal();
  const now = Date.now();
  if (now - lastPostTime < 60000) {
    return showToast("कृपया अगले संदेश के लिए १ मिनट प्रतीक्षा करें (Anti-Spam)");
  }

  const txt = document.getElementById('postText').value.trim();
  if (!txt && !selectedPostBase64) return showToast('कृपया टेक्स्ट या चित्र दर्ज करें');

  const btn = document.getElementById('postSubmitBtn');
  btn.disabled = true;

  try {
    await db.collection('posts').add({
      author: currentUser.name,
      phone: currentUser.phone || 'Devotee',
      content: txt,
      image: selectedPostBase64 || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    lastPostTime = now;
    document.getElementById('postText').value = '';
    updateCharCount();
    clearPostImg();
    showToast('संवाद मंच पर संदेश प्रकाशित हुआ!');
  } catch(e) {
    showToast('संदेश भेजने में त्रुटि: ' + e.message);
  } finally {
    btn.disabled = false;
  }
}

function listenPosts() {
  db.collection('posts').orderBy('createdAt', 'desc').limit(25).onSnapshot(snap => {
    const feed = document.getElementById('communityFeed');
    feed.innerHTML = '';
    if (snap.empty) {
      feed.innerHTML = `<div class="text-center py-6 text-xs text-stone-500">संवाद मंच पर अभी कोई चर्चा नहीं है। पहला संदेश लिखें!</div>`;
      return;
    }

    snap.forEach(doc => {
      const p = doc.data();
      const card = document.createElement('div');
      card.className = "bg-white p-4 rounded-xl border border-stone-200 space-y-2";
      card.innerHTML = `
        <div class="flex justify-between items-center text-xs">
          <span class="font-bold text-forest">👤 ${p.author}</span>
          <div class="flex items-center gap-2">
            <button onclick="sharePostWhatsApp('${p.author}', '${p.content}')" class="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">Share 📲</button>
            ${currentUser && currentUser.isOwner ? `<button onclick="confirmDeletePost('${doc.id}')" class="text-red-500 text-[11px]">Delete</button>` : ''}
          </div>
        </div>
        <p class="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed">${p.content}</p>
        ${p.image ? `<img src="${p.image}" class="max-h-72 rounded-lg border border-stone-100 object-cover" alt="Post Photo">` : ''}
      `;
      feed.appendChild(card);
    });
  });
}

function confirmDeletePost(id) {
  openConfirmModal("संदेश हटाएं?", "क्या आप इस संदेश को मंच से हटाना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('posts').doc(id).delete();
      showToast('संदेश हटा दिया गया।');
    }
  });
}

// 18. E-LIBRARY (PDFs)
function listenPdfs() {
  db.collection('pdfs').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const grid = document.getElementById('pdfGrid');
    grid.innerHTML = '';

    const defaultCard = document.createElement('div');
    defaultCard.className = "bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between";
    defaultCard.innerHTML = `
      <div>
        <span class="text-[10px] font-bold text-terracotta uppercase">पवित्र ग्रंथ</span>
        <h3 class="font-yatra text-forest text-base mt-1">श्री सबदवाणी (१२० शब्द)</h3>
        <p class="text-xs text-stone-500 mt-1">गुरु जम्भेश्वर भगवान द्वारा उच्चरित पावन वाणी।</p>
      </div>
      <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
        <a href="./shabadwani.pdf" download class="inline-block px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-emerald-950">
          PDF डाउनलोड
        </a>
        <button onclick="sharePdfWhatsApp('श्री सबदवाणी', './shabadwani.pdf')" class="text-emerald-700 text-xs font-semibold">Share 📲</button>
      </div>
    `;
    grid.appendChild(defaultCard);

    snap.forEach(doc => {
      const item = doc.data();
      const card = document.createElement('div');
      card.className = "bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between";
      card.innerHTML = `
        <div>
          <span class="text-[10px] font-bold text-terracotta uppercase">साहित्य</span>
          <h3 class="font-yatra text-forest text-base mt-1">${item.title}</h3>
        </div>
        <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <a href="${item.link}" target="_blank" download class="inline-block px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-emerald-950">
            PDF डाउनलोड
          </a>
          <div class="flex items-center gap-2">
            <button onclick="sharePdfWhatsApp('${item.title}', '${item.link}')" class="text-emerald-700 text-xs font-semibold">Share 📲</button>
            ${currentUser && currentUser.isOwner ? `<button onclick="confirmDeletePdf('${doc.id}')" class="text-xs text-red-600">Delete</button>` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  });
}

function sharePdfWhatsApp(title, link) {
  const url = link.startsWith('./') ? window.location.origin + '/' + link.replace('./','') : link;
  const text = encodeURIComponent(`📖 विश्नोई साहित्य PDF: ${title}\nडाउनलोड लिंक: ${url}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

async function saveAdminPdf() {
  const title = document.getElementById('adminPdfTitle').value.trim();
  const link = document.getElementById('adminPdfLink').value.trim();
  if (!title || !link) return showToast('कृपया शीर्षक और लिंक दर्ज करें');
  await db.collection('pdfs').add({
    title, link, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast('PDF साहित्य सफलतापूर्वक जोड़ा गया!');
  document.getElementById('adminPdfTitle').value = '';
  document.getElementById('adminPdfLink').value = '';
}

function confirmDeletePdf(id) {
  openConfirmModal("PDF हटाएं?", "क्या आप इस साहित्य को सूची से हटाना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('pdfs').doc(id).delete();
      showToast('PDF हटा दी गई।');
    }
  });
}

// 19. AUDIO PLAYER & NOTICES
function listenAudios() {
  db.collection('audios').orderBy('createdAt', 'desc').onSnapshot(snap => {
    if (!snap.empty) {
      const select = document.getElementById('audioTrackSelect');
      select.innerHTML = '';
      snap.forEach(doc => {
        const a = doc.data();
        select.innerHTML += `<option value="${a.link}">${a.title}</option>`;
      });
      changeAudioTrack();
    }
  });
}

function changeAudioTrack() {
  const select = document.getElementById('audioTrackSelect');
  const player = document.getElementById('audioPlayer');
  const source = document.getElementById('audioSource');
  if (select.value) {
    source.src = select.value;
    player.load();
  }
}

async function saveAdminAudio() {
  const title = document.getElementById('adminAudioTitle').value.trim();
  const link = document.getElementById('adminAudioLink').value.trim();
  if (!title || !link) return showToast('कृपया शीर्षक और ऑडियो लिंक दोनों भरें');
  await db.collection('audios').add({
    title, link, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast('ऑडियो ट्रैक लाइव प्लेयर में जोड़ा गया!');
  document.getElementById('adminAudioTitle').value = '';
  document.getElementById('adminAudioLink').value = '';
}

function listenNotices() {
  db.collection('notices').orderBy('createdAt', 'desc').limit(5).onSnapshot(snap => {
    if (!snap.empty) {
      const list = document.getElementById('noticeBoardList');
      list.innerHTML = '';
      snap.forEach(doc => {
        const n = doc.data();
        list.innerHTML += `
          <div class="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span class="font-bold text-forest">${n.title}:</span> ${n.desc}
          </div>
        `;
      });
    }
  });
}

// 20. PLANTATION PLEDGE COUNTER
function listenTreeCounter() {
  db.collection('stats').doc('treePledges').onSnapshot(doc => {
    if (doc.exists && doc.data().count) {
      document.getElementById('treeCounterDisplay').innerText = doc.data().count;
    }
  });
}

async function pledgeTree() {
  if (localStorage.getItem('has_pledged_tree')) {
    return showToast("आप पूर्व में पौधरोपण संकल्प दर्ज कर चुके हैं। साधुवाद!");
  }
  const display = document.getElementById('treeCounterDisplay');
  let currentVal = parseInt(display.innerText) || 1485;
  let nextVal = currentVal + 1;
  display.innerText = nextVal;
  localStorage.setItem('has_pledged_tree', 'true');
  showToast("प्रकृति रक्षा हेतु साधुवाद! संकल्प दर्ज हुआ।");
  confetti({ particleCount: 40, spread: 50 });
  try {
    await db.collection('stats').doc('treePledges').set({ count: nextVal }, { merge: true });
  } catch(e){}
}

// 21. BANNER & WHATSAPP SHARING
function listenBanner() {
  db.collection('settings').doc('dailySandesh').onSnapshot(doc => {
    if (doc.exists && doc.data().text) {
      currentBannerText = doc.data().text;
      document.getElementById('dailyBannerText').innerText = currentBannerText;
    }
  });
}

async function saveAdminBanner() {
  const txt = document.getElementById('adminBannerInput').value.trim();
  if (!txt) return showToast('कृपया संदेश दर्ज करें');
  await db.collection('settings').doc('dailySandesh').set({ text: txt });
  showToast('दैनिक संदेश लाइव अपडेट हुआ!');
  document.getElementById('adminBannerInput').value = '';
}

function shareBannerWhatsApp() {
  const text = encodeURIComponent(`🌿 पावन संदेश:\n\n${currentBannerText}\n\nविस्तार से पढ़ें: ${window.location.href}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function shareNiyamWhatsApp(num, title, rule, desc) {
  const text = encodeURIComponent(`🌿 विश्नोई समाज नियम सं. ${num} - ${title}\n"${rule}"\n\nविवरण: ${desc}\n\nडिजिटल मंच: ${window.location.href}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function sharePostWhatsApp(author, content) {
  const text = encodeURIComponent(`🌿 समाज संवाद चर्चा (${author}):\n\n"${content}"\n\nपूर्ण चर्चा देखें: ${window.location.href}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

// 22. 29 NIYAMS RENDER & SEARCH
function renderNiyams(data) {
  const grid = document.getElementById('niyamGrid');
  grid.innerHTML = '';
  data.forEach(n => {
    const card = document.createElement('div');
    card.className = "bg-white p-3.5 rounded-xl border border-stone-200 space-y-2 flex flex-col justify-between";
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-forest w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">${n.num}</span>
          <span class="text-stone-400 font-semibold text-[11px]">${n.title}</span>
        </div>
        <h4 class="font-yatra text-sm text-forest mt-1">${n.rule}</h4>
        <p class="text-[11px] text-stone-600 leading-snug mt-1">${n.desc}</p>
      </div>
      <div class="pt-2 border-t border-stone-100 flex justify-end">
        <button onclick="shareNiyamWhatsApp(${n.num}, '${n.title}', '${n.rule}', '${n.desc}')" class="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 hover:underline">
          <span>साझा करें</span> 📲
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterNiyams() {
  const q = document.getElementById('niyamSearch').value.toLowerCase();
  renderNiyams(NIYAMS_DATA.filter(n => n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q) || n.title.toLowerCase().includes(q)));
}

function handleGlobalSearch() {
  const q = document.getElementById('globalSearchInput').value.toLowerCase().trim();
  if (!q) return;

  const niyamMatch = NIYAMS_DATA.some(n => n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q));
  if (niyamMatch) {
    switchTab('niyams');
    document.getElementById('niyamSearch').value = q;
    filterNiyams();
  } else if (q.includes('mala') || q.includes('माला') || q.includes('मंत्र') || q.includes('जाप')) {
    switchTab('mala');
  } else if (q.includes('pdf') || q.includes('सबद') || q.includes('पुस्तक') || q.includes('ग्रंथ') || q.includes('साहित्य')) {
    switchTab('library');
  } else if (q.includes('quiz') || q.includes('परीक्षा') || q.includes('प्रश्न')) {
    switchTab('quiz');
  } else if (q.includes('संवाद') || q.includes('मंच') || q.includes('चर्चा')) {
    switchTab('community');
  }
}
