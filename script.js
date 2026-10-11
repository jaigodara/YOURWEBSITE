
/* ==========================================================================
   Bishnoi Community Portal - Clean Standard App Engine (script.js)
   Redesigned per UI/UX Audit & Standard App Architecture (Jio / Swiggy / Amazon Style)
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

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

// 2. OWNER CREDENTIALS
const OWNER_PHONE = "9306894518";
const OWNER_PASS = "bishnoi29";

// 3. APPLICATION STATE
let currentUser = JSON.parse(localStorage.getItem('bishnoi_secure_user') || 'null');
let isRegisterMode = false;
let quizList = [];
let currentQ = 0;
let qScore = 0;
let quizStartTime = null;
let confirmCallback = null;
let lastPostTime = 0;
let currentBannerText = '"जीव दया पालणी, रूंख लीलो नी घावै" — प्रकृति एवं सभी मूक जीवों के प्रति करुणा रखें।';
let amavasyaTargetDate = null;
let amavasyaTimerInterval = null;
let currentActiveTab = 'home';

// Samvad Manch State
let allChatPosts = [];
let activeReplyObj = null;

// Page-by-Page Horizontal PDF Reader State
let activePdfDoc = null;
let currentPdfPage = 1;
let totalPdfPages = 1;
let isPdfLandscape = false;
let currentPdfUrl = '';
let touchStartX = 0;

// Maintenance State
let maintenanceConfig = {
  globalMode: 'off',
  message: 'हम आपके अनुभव को बेहतर बनाने के लिए ऐप को अपडेट कर रहे हैं। कृपया कुछ समय बाद पुनः प्रयास करें।',
  sections: {
    mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off'
  }
};

// User Progress & Digital Jaap Mala State
let malaBeadCount = parseInt(localStorage.getItem('bishnoi_mala_beads') || '0');
let malaLapsCount = parseInt(localStorage.getItem('bishnoi_mala_laps') || '0');
let malaTotalCount = parseInt(localStorage.getItem('bishnoi_mala_total') || '0');
let readNiyamsSet = new Set(JSON.parse(localStorage.getItem('bishnoi_read_niyams') || '[]'));
let bestQuizPct = parseInt(localStorage.getItem('bishnoi_best_quiz_pct') || '0');

// 4. DEFAULT 29 NIYAMS DATA (Editable by Owner)
let niyamsList = [
  { num: 1, cat: "daily", title: "प्रसूति सूतक", rule: "तीस दिन सूतक पाळणा", desc: "सूतक काल में ३० दिन तक माता व शिशु की स्वच्छता और विश्राम रखें।" },
  { num: 2, cat: "daily", title: "ऋतुवंती पृथक्करण", rule: "पांच दिन रजस्वला पृथक्करण", desc: "माहवारी के दौरान ५ दिन का गृह-कार्य से पूर्ण विश्राम एवं स्वास्थ्य रक्षा।" },
  { num: 3, cat: "daily", title: "प्रातः स्नान", rule: "सेरो करो अस्नान", desc: "प्रतिदिन सूर्योदय से पूर्व प्रातःकाल स्नान कर तन-मन से पवित्र रहें।" },
  { num: 4, cat: "conduct", title: "शील व संतोष", rule: "शील संतोष सूच राखणा", desc: "सदाचारी, शांत, पवित्र और संतोषी स्वभाव बनाए रखें।" },
  { num: 5, cat: "daily", title: "द्विकाल संध्या", rule: "द्वादश कर्म सांध", desc: "सुबह-शाम दोनों समय संध्या-वंदन और ईश्वर स्मरण करें।" },
  { num: 6, cat: "daily", title: "सांझ आरती", rule: "सांझ आरती गुण गावै", desc: "संध्या समय आरती व भगवान के पावन गुणों का गायन करें।" },
  { num: 7, cat: "daily", title: "प्रातः होम", rule: "प्रात: होम करणा", desc: "वातावरण शुद्धि एवं आत्मिक शांति हेतु प्रतिदिन प्रातःकाल घी से हवन करें।" },
  { num: 8, cat: "nature", title: "पानी छानना", rule: "पाणी छान पीवणा", desc: "सूक्ष्म जीवों की रक्षा व स्वास्थ्य के लिए पानी सदा छानकर पियें और वाणी भी छानकर बोलें।" },
  { num: 9, cat: "nature", title: "ईंधन जांच", rule: "ईंधन बीन बाळणा", desc: "चूल्हे में लकड़ी व गोबर के उपले कीट-पतंगों को देखकर व झाड़कर ही जलाएं।" },
  { num: 10, cat: "conduct", title: "क्षमा धारण", rule: "क्षमा दया मन आणणा", desc: "मन में सदा क्षमा और सहनशीलता का भाव बनाए रखें।" },
  { num: 11, cat: "conduct", title: "दया भाव", rule: "दया हिरदै राखणी", desc: "प्रत्येक प्राणी और मनुष्य के प्रति हृदय में करुणा व दयालुता रखें।" },
  { num: 12, cat: "conduct", title: "चोरी त्याग", rule: "चोरी नहीं करणी", desc: "पराई वस्तु कभी न चुराएं और ईमानदारी से जीवन यापन करें।" },
  { num: 13, cat: "conduct", title: "निंदा त्याग", rule: "निंदा नहीं करणी", desc: "किसी की पीठ पीछे बुराई या चुगली न करें।" },
  { num: 14, cat: "conduct", title: "झूठ त्याग", rule: "झूठ नहीं बोलना", desc: "सदा सत्य, हितकारी और मधुर वाणी बोलें।" },
  { num: 15, cat: "conduct", title: "वाद-विवाद त्याग", rule: "वाद विवाद नहीं करणा", desc: "व्यर्थ के झगड़े और अहंकार भरी बहस से दूर रहें।" },
  { num: 16, cat: "daily", title: "अमावस्या व्रत", rule: "अमावस्या व्रत राखणा", desc: "प्रत्येक अमावस्या के दिन उपवास रखें, पर्यावरण चिंतन और हरि स्मरण करें।" },
  { num: 17, cat: "daily", title: "विष्णु स्मरण", rule: "विष्णु नाम जपणा", desc: "हृदय में ॐ विष्णवे नमः का निरंतर स्मरण रखें।" },
  { num: 18, cat: "nature", title: "जीव दया", rule: "जीव दया पालणी", desc: "सभी मूक पशु-पक्षियों की रक्षा करें, किसी जीव को कष्ट न दें।" },
  { num: 19, cat: "nature", title: "हरा वृक्ष रक्षा", rule: "रूंख लीलो नी घावै", desc: "पर्यावरण संतुलन हेतु हरे-भरे पेड़ों को कभी न काटें।" },
  { num: 20, cat: "conduct", title: "काम-क्रोध संयम", rule: "अजर जरे सो सूर", desc: "काम, क्रोध, लोभ और अहंकार पर नियंत्रण रखें।" },
  { num: 21, cat: "daily", title: "स्वहस्त आहार", rule: "आपने हाथे रांधणा", desc: "पवित्रता और सात्विकता के साथ शुद्ध बना भोजन ग्रहण करें।" },
  { num: 22, cat: "nature", title: "पशु थापण", rule: "अमर रखावै थाट", desc: "निराश्रित और असहाय पशुओं को कटने से बचाएं और आश्रय दें।" },
  { num: 23, cat: "nature", title: "बैल बधिया निषेध", rule: "बैल बधिया नहीं करणा", desc: "पशुओं पर क्रूरता न करें, बैलों का बंध्याकरण न करें।" },
  { num: 24, cat: "conduct", title: "अमल त्याग", rule: "अमल नहीं खाणा", desc: "अफीम और किसी भी प्रकार के नशे का पूर्ण त्याग करें।" },
  { num: 25, cat: "conduct", title: "तम्बाकू त्याग", rule: "तम्बाकू नहीं पीणा", desc: "तम्बाकू, बीड़ी, सिगरेट, गुटखा आदि का पूर्ण निषेध रखें।" },
  { num: 26, cat: "conduct", title: "भांग त्याग", rule: "भांग नहीं पीणी", desc: "भांग और गांजे जैसे मादक पदार्थों का सेवन कभी न करें।" },
  { num: 27, cat: "conduct", title: "मदिरा त्याग", rule: "मद्य नहीं पीणा", desc: "शराब का पूरी तरह त्याग करें।" },
  { num: 28, cat: "conduct", title: "मांस त्याग", rule: "मांस नहीं खाणा", desc: "पूर्णतः शाकाहारी रहें, मांस-अंडा कभी न छुएं।" },
  { num: 29, cat: "nature", title: "नील त्याग", rule: "नील नहीं पहरणा", desc: "नील के पौधों व सूक्ष्म जीवों को नष्ट करके बनने वाले नीले रंग का त्याग।" }
];
let activeNiyamCategory = 'all';

// Default History & Kids Stories
let historyItemsList = [
  {
    id: 'hist_1',
    type: 'history',
    badge: 'इतिहास अध्याय • १७३० ई.',
    title: 'खेजड़ली का अमर बलिदान — ३६३ हुतात्माओं की गौरवगाथा',
    content: 'सन् १७३० (विक्रम संवत १७८७, भाद्रपद शुक्ल दशमी) को जोधपुर के खेजड़ली गाँव में माता अमृता देवी बिश्नोई और उनकी तीन पुत्रियों सहित ३६३ बिश्नोई वीरों व वीरांगनाओं ने हरे खेजड़ी वृक्षों की रक्षा के लिए अपने प्राणों की आहुति दे दी।',
    moral: 'सिर साटै रूंख रहै, तो भी सस्तो जाण — प्रकृति और धर्म की रक्षा प्राणों से भी बढ़कर है।'
  },
  {
    id: 'hist_2',
    type: 'history',
    badge: 'पंथ स्थापना • १४८५ ई.',
    title: 'समराथल धोरा — बिश्नोई पंथ एवं २९ नियमों का प्रवर्तन',
    content: 'गुरु जम्भेश्वर भगवान का जन्म विक्रम संवत १५०८ में पीपासर गाँव में हुआ। विक्रम संवत १५४२ में कार्तिक वदी अष्टमी को समराथल धोरे पर गुरु जाम्भोजी ने पाहल बनाकर २९ नियमों के साथ बिश्नोई पंथ की स्थापना की।',
    moral: 'गुरु जाम्भोजी ने पर्यावरण संरक्षण, महिला सम्मान और नशामुक्त समाज का वैज्ञानिक मार्ग दिखाया।'
  }
];

// SVG Icons Definition
const SVG_ICONS = {
  book: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  quiz: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>`,
  chat: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>`,
  home: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
  user: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`
};

// Application Startup Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderNiyams();
  updateMalaUI();
  updateAuthHeader();
  renderHistoryAndKidsViews();
  listenPosts();
});

// Tab Switching Navigation Function
function switchTab(tabId) {
  if (tabId === 'admin' && (!currentUser || !currentUser.isOwner)) {
    alert("यह अनुभाग केवल मुख्य व्यवस्थापक के लिए है।");
    return;
  }
  currentActiveTab = tabId;
  const tabs = ['home', 'niyams', 'mala', 'library', 'community', 'quiz', 'history', 'admin'];
  tabs.forEach(id => {
    const el = document.getElementById(`tab-${id}`);
    const navEl = document.getElementById(`navTab-${id}`);
    if (el) el.classList.add('hidden');
    if (navEl) navEl.className = 'px-3 py-1.5 rounded-lg text-stone-700 hover:bg-stone-100 transition';
  });

  const activeEl = document.getElementById(`tab-${tabId}`);
  const activeNav = document.getElementById(`navTab-${tabId}`);
  if (activeEl) activeEl.classList.remove('hidden');
  if (activeNav) activeNav.className = 'px-3 py-1.5 rounded-lg bg-forest text-white transition';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render 29 Niyams List (Clean & Standard)
function renderNiyams() {
  const container = document.getElementById('niyamsContainer');
  if (!container) return;
  container.innerHTML = niyamsList.map(n => `
    <div class="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-1 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-forest bg-emerald-100 px-2 py-0.5 rounded">नियम #${n.num}</span>
        <span class="text-xs font-bold text-stone-600">${n.rule}</span>
      </div>
      <h4 class="font-yatra text-sm text-forest">${n.title}</h4>
      <p class="text-xs text-stone-600">${n.desc}</p>
    </div>
  `).join('');
}

// Digital Jaap Mala Counters
function incrementMalaBead() {
  malaBeadCount++;
  malaTotalCount++;
  if (malaBeadCount >= 108) {
    malaBeadCount = 0;
    malaLapsCount++;
    alert('बधाई हो! आपकी १ माला पूर्ण हो गई है।');
  }
  localStorage.setItem('bishnoi_mala_beads', malaBeadCount);
  localStorage.setItem('bishnoi_mala_laps', malaLapsCount);
  localStorage.setItem('bishnoi_mala_total', malaTotalCount);
  updateMalaUI();
}

function resetMala() {
  if (confirm('क्या आप जप माला रीसेट करना चाहते हैं?')) {
    malaBeadCount = 0;
    malaLapsCount = 0;
    malaTotalCount = 0;
    localStorage.clear();
    updateMalaUI();
  }
}

function updateMalaUI() {
  const countDisp = document.getElementById('malaCountDisplay');
  const lapsDisp = document.getElementById('malaLapsDisplay');
  const totalDisp = document.getElementById('malaTotalDisplay');
  if (countDisp) countDisp.innerText = malaBeadCount;
  if (lapsDisp) lapsDisp.innerText = malaLapsCount;
  if (totalDisp) totalDisp.innerText = malaTotalCount;
}

// Audio Player Track Change
function changeAudioTrack(selectEl) {
  const player = document.getElementById('audioPlayer');
  if (player && selectEl) {
    player.src = selectEl.value;
    player.play();
  }
}

// Authentication & Profile / Owner Studio Management
function updateAuthHeader() {
  const container = document.getElementById('authActionsContainer');
  const adminNav = document.getElementById('navTab-admin');
  const bottomAdmin = document.getElementById('bottomAdminTabBtn');
  if (!container) return;

  if (currentUser) {
    container.innerHTML = `
      <button onclick="openProfileModal()" class="text-xs font-bold bg-stone-100 hover:bg-stone-200 text-forest px-3 py-1.5 rounded-lg border border-stone-300 shadow-sm flex items-center gap-1.5">
        <span>👤 ${currentUser.name || 'प्रोफ़ाइल'}</span>
      </button>
      <button onclick="logoutUser()" class="text-xs bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 font-bold px-2.5 py-1.5 rounded-lg">लॉगआउट</button>
    `;
    if (currentUser.phone === OWNER_PHONE || currentUser.isOwner) {
      if (adminNav) adminNav.classList.remove('hidden');
      if (bottomAdmin) bottomAdmin.classList.remove('hidden');
    }
  } else {
    container.innerHTML = `
      <button onclick="loginAsOwnerModal()" class="text-xs bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold px-3 py-1.5 rounded-lg shadow">ओनर लॉगिन</button>
    `;
    if (adminNav) adminNav.classList.add('hidden');
    if (bottomAdmin) bottomAdmin.classList.add('hidden');
  }
}

function loginAsOwnerModal() {
  const phone = prompt("मोबाइल नंबर दर्ज करें (उदा: 9306894518):");
  if (phone === OWNER_PHONE) {
    const pass = prompt("पासवर्ड दर्ज करें:");
    if (pass === OWNER_PASS) {
      currentUser = { name: "व्यवस्थापक", phone: OWNER_PHONE, isOwner: true };
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      updateAuthHeader();
      switchTab('admin');
      alert('सफल लॉगिन!');
    } else if (pass !== null) {
      alert('गलत पासवर्ड!');
    }
  } else if (phone !== null) {
    alert('अमान्य मोबाइल नंबर!');
  }
}

function logoutUser() {
  localStorage.removeItem('bishnoi_secure_user');
  currentUser = null;
  updateAuthHeader();
  switchTab('home');
}

function openProfileModal() {
  if (!currentUser) return loginAsOwnerModal();
  const name = prompt("अपना नया नाम दर्ज करें:", currentUser.name || '');
  if (name !== null && name.trim() !== '') {
    currentUser.name = name.trim();
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateAuthHeader();
    alert("प्रोफ़ाइल नाम अपडेट हो गया!");
  }
}

// Community Samvad Manch Posting
function postCommunityMessage() {
  if (!currentUser) {
    alert("कृपया पहले लॉगिन करें।");
    loginAsOwnerModal();
    return;
  }
  const textInp = document.getElementById('chatInputText');
  const feed = document.getElementById('chatMessagesFeed');
  if (!textInp || !textInp.value.trim()) {
    alert('कृपया संदेश में कुछ लिखें।');
    return;
  }

  const msgDiv = document.createElement('div');
  msgDiv.className = 'p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1 shadow-sm';
  msgDiv.innerHTML = `
    <div class="flex items-center justify-between text-[10px] text-stone-400 font-bold">
      <span>${currentUser.name || currentUser.phone}</span>
      <span>अभी</span>
    </div>
    <p class="text-stone-800">${textInp.value.trim()}</p>
  `;
  if (feed) {
    feed.prepend(msgDiv);
  }
  textInp.value = '';
}

function renderHistoryAndKidsViews() {
  const container = document.getElementById('historySubView');
  if (!container) return;
}

function listenPosts() {
  // Samvad Manch real-time listener implementation
}
