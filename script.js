/* ==========================================================================
   विश्नोई समाज डिजिटल मंच एवं परीक्षा पोर्टल (script.js)
   स्वच्छ, तीव्र एवं एकल मास्टर संस्करण (Clean Single-File Architecture)
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

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 2. CREDENTIALS & CONSTANTS
const OWNER_PHONE = "9306894518";
const OWNER_PASS = "bishnoi29";
const DEFAULT_INTEGRATED_AI_KEY = "AQ.Ab8RN6LAySVquJ7wJYZ-Btp-LELOKKFIpsLHTooiv9L_4GEPLA";

// 3. GLOBAL APPLICATION STATE
let currentUser = JSON.parse(localStorage.getItem('bishnoi_secure_user') || 'null');
let isRegisterMode = false;
let quizList = [];
let confirmCallback = null;
let currentBannerText = '"जीव दया पालणी, रूंख लीलो नी घावै" — प्रकृति एवं सभी मूक जीवों के प्रति करुणा रखें।';
let amavasyaTargetDate = null;
let amavasyaTimerInterval = null;
let currentActiveTab = 'home';
let inactivityTimer = null;
let examCountdownTimer = null;
let serverTimeOffsetMs = 0;

// Chat, Moderation & RBAC State
let allChatPosts = [];
let activeReplyObj = null;
let blockedPhonesList = [];
let editorsPhoneList = [];
let subAdminPermissionsMap = {};

// Custom Audio Player State
let audioPlaylist = [
  { id: 'def_audio_1', title: 'श्री जम्भेश्वर भगवान आरती एवं भजन', link: './bhajan1.mp3' }
];
let currentTrackIndex = 0;
let isCustomPlaying = false;
let audioSpeeds = [1, 1.25, 1.5];
let currentSpeedIdx = 0;

// PDF Reader State
let activePdfDoc = null;
let currentPdfPage = 1;
let totalPdfPages = 1;
let isPdfLandscape = false;

// Pariksha 5-Section Visibility State
let parikshaVisibility = {
  enrollment: false,
  mock: false,
  mainExam: false,
  dailyQuiz: false,
  resultsPublished: false,
  examScheduleTime: null,
  examEndTime: null,
  examDuration: 120
};

// Admit Card & Cutoff Configuration
let customAdmitConfig = JSON.parse(localStorage.getItem('bishnoi_admit_cfg') || JSON.stringify({
  examTitle: "जाम्भाणी साहित्य ज्ञान परीक्षा २०२६",
  examDateStr: "पोर्टल पर घोषित समयानुसार",
  examCenterStr: "ऑनलाइन डिजिटल परीक्षा कक्ष",
  instructionsStr: "१. अपना रोल नंबर गोपनीय रखें। २. परीक्षा के दौरान टैब बदलना वर्जित है।",
  lateCutoffMins: 5
}));

// Exam Runtime State & Security Closure
let encryptedAnswerKeyMap = {};
let markedForReviewSet = new Set();
let lastEnrolledStudentObj = JSON.parse(localStorage.getItem('bishnoi_last_enrolled_obj') || 'null');

let examState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  timeRemainingSeconds: 0,
  timerInterval: null,
  tabSwitchCount: 0,
  activeMode: 'daily_quiz',
  rollNumber: localStorage.getItem('bishnoi_saved_roll') || 'GUEST',
  isExamRunning: false,
  securityAttached: false,
  enrolledProfile: null
};

// Non-Blocking Soft Maintenance State
let maintenanceConfig = {
  globalMode: 'off',
  progressPct: 65,
  message: '',
  sections: { mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off' }
};

// Mala & Sadhana Streak Counters (Local-First)
let malaBeadCount = parseInt(localStorage.getItem('bishnoi_mala_beads') || '0');
let malaLapsCount = parseInt(localStorage.getItem('bishnoi_mala_laps') || '0');
let malaTotalCount = parseInt(localStorage.getItem('bishnoi_mala_total') || '0');

// 4. AUTHENTIC 29 NIYAMS & HISTORY DATA
let niyamsList = [
  { num: 1, title: "प्रसूति सूतक", rule: "तीस दिन सूतक पाळणा", desc: "सूतक काल में ३० दिन तक माता व शिशु की स्वच्छता और विश्राम रखें।" },
  { num: 2, title: "ऋतुवंती पृथक्करण", rule: "पांच दिन रजस्वला पृथक्करण", desc: "माहवारी के दौरान ५ दिन का गृह-कार्य से पूर्ण विश्राम एवं स्वास्थ्य रक्षा।" },
  { num: 3, title: "प्रातः स्नान", rule: "सेरो करो अस्नान", desc: "प्रतिदिन सूर्योदय से पूर्व प्रातःकाल स्नान कर तन-मन से पवित्र रहें।" },
  { num: 4, title: "शील व संतोष", rule: "शील संतोष सूच राखणा", desc: "सदाचारी, शांत, पवित्र और संतोषी स्वभाव बनाए रखें।" },
  { num: 5, title: "द्विकाल संध्या", rule: "द्वादश कर्म सांध", desc: "सुबह-शाम दोनों समय संध्या-वंदन और ईश्वर स्मरण करें।" },
  { num: 6, title: "सांझ आरती", rule: "सांझ आरती गुण गावै", desc: "संध्या समय आरती व भगवान के पावन गुणों का गायन करें।" },
  { num: 7, title: "प्रातः होम", rule: "प्रात: होम करणा", desc: "वातावरण शुद्धि एवं आत्मिक शांति हेतु प्रतिदिन प्रातःकाल घी से हवन करें।" },
  { num: 8, title: "पानी छानना", rule: "पाणी छान पीवणा", desc: "सूक्ष्म जीवों की रक्षा व स्वास्थ्य के लिए पानी सदा छानकर पियें और वाणी भी छानकर बोलें।" },
  { num: 9, title: "ईंधन जांच", rule: "ईंधन बीन बाळणा", desc: "चूल्हे में लकड़ी व गोबर के उपले कीट-पतंगों को देखकर व झाड़कर ही जलाएं।" },
  { num: 10, title: "क्षमा धारण", rule: "क्षमा दया मन आणणा", desc: "मन में सदा क्षमा और सहनशीलता का भाव बनाए रखें।" },
  { num: 11, title: "दया भाव", rule: "दया हिरदै राखणी", desc: "प्रत्येक प्राणी और मनुष्य के प्रति हृदय में करुणा व दयालुता रखें।" },
  { num: 12, title: "चोरी त्याग", rule: "चोरी नहीं करणी", desc: "पराई वस्तु कभी न चुराएं और ईमानदारी से जीवन यापन करें।" },
  { num: 13, title: "निंदा त्याग", rule: "निंदा नहीं करणी", desc: "किसी की पीठ पीछे बुराई या चुगली न करें।" },
  { num: 14, title: "झूठ त्याग", rule: "झूठ नहीं बोलना", desc: "सदा सत्य, हितकारी और मधुर वाणी बोलें।" },
  { num: 15, title: "वाद-विवाद त्याग", rule: "वाद विवाद नहीं करणा", desc: "व्यर्थ के झगड़े और अहंकार भरी बहस से दूर रहें।" },
  { num: 16, title: "अमावस्या व्रत", rule: "अमावस्या व्रत राखणा", desc: "प्रत्येक अमावस्या के दिन उपवास रखें, पर्यावरण चिंतन और हरि स्मरण करें।" },
  { num: 17, title: "विष्णु स्मरण", rule: "विष्णु नाम जपणा", desc: "हृदय में ॐ विष्णवे नमः का निरंतर स्मरण रखें।" },
  { num: 18, title: "जीव दया", rule: "जीव दया पालणी", desc: "सभी मूक पशु-पक्षियों की रक्षा करें, किसी जीव को कष्ट न दें।" },
  { num: 19, title: "हरा वृक्ष रक्षा", rule: "रूंख लीलो नी घावै", desc: "पर्यावरण संतुलन हेतु हरे-भरे पेड़ों को कभी न काटें।" },
  { num: 20, title: "काम-क्रोध संयम", rule: "अजर जरे सो सूर", desc: "काम, क्रोध, लोभ और अहंकार पर नियंत्रण रखें।" },
  { num: 21, title: "स्वहस्त आहार", rule: "आपने हाथे रांधणा", desc: "पवित्रता और सात्विकता के साथ शुद्ध बना भोजन ग्रहण करें।" },
  { num: 22, title: "पशु थापण", rule: "अमर रखावै थाट", desc: "निराश्रित और असहाय पशुओं को कटने से बचाएं और आश्रय दें।" },
  { num: 23, title: "बैल बधिया निषेध", rule: "बैल बधिया नहीं करणा", desc: "पशुओं पर क्रूरता न करें, बैलों का बंध्याकरण न करें।" },
  { num: 24, title: "अमल त्याग", rule: "अमल नहीं खाणा", desc: "अफीम और किसी भी प्रकार के नशे का पूर्ण त्याग करें।" },
  { num: 25, title: "तम्बाकू त्याग", rule: "तम्बाकू नहीं पीणा", desc: "तम्बाकू, बीड़ी, सिगरेट, गुटखा आदि का पूर्ण निषेध रखें।" },
  { num: 26, title: "भांग त्याग", rule: "भांग नहीं पीणी", desc: "भांग और गांजे जैसे मादक पदार्थों का सेवन कभी न करें।" },
  { num: 27, title: "मदिरा त्याग", rule: "मद्य नहीं पीणा", desc: "शराब का पूरी तरह त्याग करें।" },
  { num: 28, title: "मांस त्याग", rule: "मांस नहीं खाणा", desc: "पूर्णतः शाकाहारी रहें, मांस-अंडा कभी न छुएं।" },
  { num: 29, title: "नील त्याग", rule: "नील नहीं पहरणा", desc: "नील के पौधों व सूक्ष्म जीवों को नष्ट करके बनने वाले नीले रंग का त्याग।" }
];

let historyItemsList = [
  {
    id: 'hist_1',
    type: 'history',
    badge: 'इतिहास अध्याय • १७३० ई.',
    title: 'खेजड़ली का अमर बलिदान — ३६३ हुतात्माओं की गौरवगाथा',
    content: 'सन् १७३० (विक्रम संवत १७८७, भाद्रपद शुक्ल दशमी) को जोधपुर के खेजड़ली गाँव में माता अमृता देवी बिश्नोई और उनकी तीन पुत्रियों (आसू, रतनी, भागू) सहित ३६३ बिश्नोई वीरों व वीरांगनाओं ने हरे खेजड़ी वृक्षों की रक्षा के लिए अपने प्राणों की आहुति दे दी। विश्व इतिहास में वृक्षों के लिए दिया गया यह सबसे बड़ा बलिदान है।',
    moral: 'सिर साटै रूंख रहै, तो भी सस्तो जाण — प्रकृति और धर्म की रक्षा प्राणों से भी बढ़कर है।'
  },
  {
    id: 'hist_2',
    type: 'history',
    badge: 'पंथ स्थापना • १४८५ ई.',
    title: 'समराथल धोरा — बिश्नोई पंथ एवं २९ नियमों का प्रवर्तन',
    content: 'गुरु जम्भेश्वर भगवान का जन्म विक्रम संवत १५०८ (सन् १४५१) में पीपासर गाँव में पवार वंशीय ठाकुर लोहट जी एवं माता हंसा देवी के यहाँ हुआ। विक्रम संवत १५४२ (सन् १४८५) में कार्तिक वदी अष्टमी को समराथल धोरे पर गुरु जाम्भोजी ने पाहल बनाकर २९ नियमों के साथ बिश्नोई पंथ की स्थापना की।',
    moral: 'गुरु जाम्भोजी ने मध्यकाल में ही पर्यावरण संरक्षण, महिला सम्मान और नशामुक्त समाज का वैज्ञानिक मार्ग दिखाया।'
  },
  {
    id: 'kids_1',
    type: 'kids',
    badge: 'बाल संस्कार १',
    title: 'नन्हे हिरण का सच्चा मित्र',
    content: 'एक बार थार के रेगिस्तान में एक नन्हा चिंकारा प्यास से भटक रहा था। तभी गाँव के बालक सोहन ने उसे देखा। सोहन ने दौड़कर अपने घर से छना हुआ ठंडा पानी पिलाया और अपनी माँ के साथ मिलकर उसकी देखभाल की। जब हिरण स्वस्थ हो गया, तो वह रोज़ आँगन में खेलने आने लगा।',
    moral: 'सीख: मूक पशु-पक्षी हमारे परिवार की तरह हैं। घर के बाहर पक्षियों व जीवों के लिए पानी का परिंडा अवश्य रखें।'
  },
  {
    id: 'kids_2',
    type: 'kids',
    badge: 'बाल संस्कार २',
    title: 'अमृता देवी का साहस और खेजड़ी का पेड़',
    content: 'जब राजा के सैनिक खेजड़ली गाँव में हरे पेड़ काटने आए, तो माता अमृता देवी ने डरने के बजाय पेड़ को अपनी बाहों में भर लिया और कहा कि जब तक हम जीवित हैं, पेड़ नहीं कटने देंगे। उनके साहस को देखकर राजा को भी क्षमा मांगनी पड़ी और पेड़ काटने पर हमेशा के लिए रोक लगा दी गई।',
    moral: 'सीख: हमें अपने जन्मदिन पर कम से कम एक पौधा ज़रूर लगाना चाहिए और कभी भी हरी टहनी नहीं तोड़नी चाहिए।'
  }
];

// 5. SECURITY, ENCRYPTION, FINGERPRINTING & SERVER TIME SYNC
function isSuperOwner() {
  return Boolean(currentUser && (currentUser.isOwner === true || currentUser.phone === OWNER_PHONE));
}

function isEditorOrOwner() {
  if (!currentUser) return false;
  if (isSuperOwner()) return true;
  return Boolean(currentUser.isEditor === true || editorsPhoneList.includes(currentUser.phone));
}

function getDeviceFingerprint() {
  const raw = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency || 4,
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'IST'
  ].join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return 'DEV-' + Math.abs(hash).toString(36).toUpperCase();
}
const currentDeviceSignature = getDeviceFingerprint();

function encryptLocalData(obj) {
  try {
    const str = JSON.stringify(obj);
    const key = currentDeviceSignature || 'BISHNOI29';
    let out = '';
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(unescape(encodeURIComponent(out)));
  } catch (e) { return ''; }
}

function decryptLocalData(cipher) {
  try {
    if (!cipher) return {};
    const raw = decodeURIComponent(escape(atob(cipher)));
    const key = currentDeviceSignature || 'BISHNOI29';
    let out = '';
    for (let i = 0; i < raw.length; i++) {
      out += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return JSON.parse(out);
  } catch (e) { return {}; }
}

async function syncServerClock() {
  try {
    const res = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
    const dateHeader = res.headers.get('Date');
    if (dateHeader) {
      const srvTime = new Date(dateHeader).getTime();
      if (!isNaN(srvTime)) serverTimeOffsetMs = srvTime - Date.now();
    }
  } catch (e) {}
}

function getSyncedNow() {
  return Date.now() + (serverTimeOffsetMs || 0);
}

function setupInactivitySessionGuard() {
  const resetTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (currentUser) {
      inactivityTimer = setTimeout(() => {
        logoutUser();
        showToast("सुरक्षा कारणों से २० मिनट की निष्क्रियता के बाद सत्र लॉगआउट कर दिया गया है।");
      }, 20 * 60 * 1000);
    }
  };
  ['click', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });
  resetTimer();
}

function purgeSearchBarAutofillGlitch() {
  const sInp = document.getElementById('globalSearchInput');
  const nInp = document.getElementById('niyamSearch');
  [sInp, nInp].forEach(inp => {
    if (!inp) return;
    inp.value = '';
    inp.setAttribute('autocomplete', 'new-password');
    inp.setAttribute('autocorrect', 'off');
    inp.setAttribute('spellcheck', 'false');
    inp.setAttribute('readonly', 'readonly');
    const unlock = () => inp.removeAttribute('readonly');
    inp.addEventListener('focus', unlock);
    inp.addEventListener('mousedown', unlock);
    inp.addEventListener('touchstart', unlock, { passive: true });
  });
  [150, 500, 1200].forEach(delay => {
    setTimeout(() => {
      if (sInp && document.activeElement !== sInp) sInp.value = '';
      if (nInp && document.activeElement !== nInp) nInp.value = '';
    }, delay);
  });
}

// 6. BOTTOM NAVIGATION, HOMEPAGE & CUSTOM AUDIO PLAYER
function injectUnifiedBottomNavBar() {
  document.getElementById('standardMobileBottomNav')?.remove();
  const bottomNav = document.createElement('nav');
  bottomNav.id = 'standardMobileBottomNav';
  bottomNav.className = 'fixed bottom-0 left-0 right-0 z-[95] bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg px-3 py-1.5';
  bottomNav.innerHTML = `
    <div class="max-w-xl mx-auto grid grid-cols-5 gap-1.5">
      <button onclick="switchTab('home')" id="bnav-home" class="bnav-item-active flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-transparent text-[11px] text-stone-600 transition-all">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <span class="truncate">मुखपृष्ठ</span>
      </button>
      <button onclick="switchTab('library')" id="bnav-library" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition-all">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <span class="truncate">साहित्य</span>
      </button>
      <button onclick="switchTab('community')" id="bnav-community" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition-all">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg>
        <span class="truncate">संवाद</span>
      </button>
      <button onclick="switchTab('quiz')" id="bnav-quiz" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition-all">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <span class="truncate">परीक्षा</span>
      </button>
      <button onclick="openProfileModal()" id="bnav-profile" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition-all">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span id="bnavProfileLabel" class="truncate">प्रोफ़ाइल</span>
      </button>
    </div>
  `;
  document.body.appendChild(bottomNav);
}

function upgradeHomepageAndAudioUI() {
  const homeTab = document.getElementById('tab-home');
  if (homeTab && !document.getElementById('cleanHeroLandingSection')) {
    const heroWrap = document.createElement('div');
    heroWrap.id = 'cleanHeroLandingSection';
    heroWrap.className = 'space-y-4 mb-5';
    heroWrap.innerHTML = `
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="text-[11px] font-bold text-white bg-[#143622] px-2.5 py-0.5 rounded-md">आधिकारिक पोर्टल</span>
            <h2 class="font-yatra text-base sm:text-lg text-forest">अध्ययन एवं साधना केंद्र</h2>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button onclick="switchTab('niyams')" class="elevate-card p-4 rounded-xl bg-[#FAF8F3] hover:bg-white border border-stone-200/90 text-left flex items-start gap-3.5 transition">
            <div class="w-10 h-10 rounded-lg bg-[#143622] text-amber-200 flex items-center justify-center font-yatra text-base shrink-0">२९</div>
            <div>
              <span class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">आचार संहिता</span>
              <h3 class="font-yatra text-base text-forest mt-0.5">२९ नियम संहिता</h3>
              <p class="text-xs text-stone-600 mt-0.5 leading-relaxed">गुरु जम्भेश्वर भगवान के २९ नियमों का सरल हिंदी भावार्थ।</p>
            </div>
          </button>

          <button onclick="switchTab('mala')" class="elevate-card p-4 rounded-xl bg-[#FAF8F3] hover:bg-white border border-stone-200/90 text-left flex items-start gap-3.5 transition">
            <div class="w-10 h-10 rounded-lg bg-[#143622] text-amber-200 flex items-center justify-center font-yatra text-base shrink-0">१०८</div>
            <div>
              <span class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">दैनिक साधना</span>
              <h3 class="font-yatra text-base text-forest mt-0.5">डिजिटल जप माला</h3>
              <p class="text-xs text-stone-600 mt-0.5 leading-relaxed">१०८ मनकों की डिजिटल माला के साथ हरि स्मरण करें।</p>
            </div>
          </button>

          <button onclick="switchTab('history')" class="elevate-card p-4 rounded-xl bg-[#FAF8F3] hover:bg-white border border-stone-200/90 text-left flex items-start gap-3.5 transition">
            <div class="w-10 h-10 rounded-lg bg-[#8C3B1A] text-amber-100 flex items-center justify-center font-yatra text-sm shrink-0">१७३०</div>
            <div>
              <span class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">इतिहास व संस्कार</span>
              <h3 class="font-yatra text-base text-forest mt-0.5">गौरवगाथा एवं बाल संस्कार</h3>
              <p class="text-xs text-stone-600 mt-0.5 leading-relaxed">खेजड़ली के ३६३ हुतात्माओं का इतिहास व प्रेरक कहानियाँ।</p>
            </div>
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <button onclick="switchTab('library')" class="elevate-card py-2.5 px-3 rounded-lg bg-stone-100/80 hover:bg-stone-200/70 border border-stone-200 text-center"><span class="font-semibold text-xs text-forest block">सबदवाणी ग्रंथ</span></button>
          <button onclick="switchTab('quiz')" class="elevate-card py-2.5 px-3 rounded-lg bg-stone-100/80 hover:bg-stone-200/70 border border-stone-200 text-center"><span class="font-semibold text-xs text-forest block">साहित्य परीक्षा</span></button>
          <button onclick="switchTab('community')" class="elevate-card py-2.5 px-3 rounded-lg bg-stone-100/80 hover:bg-stone-200/70 border border-stone-200 text-center"><span class="font-semibold text-xs text-forest block">समाज संवाद मंच</span></button>
          <button onclick="openProfileModal()" class="elevate-card py-2.5 px-3 rounded-lg bg-stone-100/80 hover:bg-stone-200/70 border border-stone-200 text-center"><span class="font-semibold text-xs text-forest block">मेरी प्रोफ़ाइल</span></button>
        </div>
      </div>
    `;
    homeTab.insertBefore(heroWrap, homeTab.firstChild);
  }

  // Silence 404 Audio Link & Upgrade Audio Player
  const nativeAudio = document.getElementById('audioPlayer');
  const nativeSource = document.getElementById('audioSource');
  const nativeSelect = document.getElementById('audioTrackSelect');
  if (nativeSource && nativeSource.getAttribute('src') && nativeSource.getAttribute('src').includes('temple_bell')) {
    nativeSource.removeAttribute('src');
    if (nativeAudio) nativeAudio.load();
  }

  if (nativeAudio && !document.getElementById('standardCustomMusicBox')) {
    const hostCard = nativeAudio.closest('div.bg-white') || nativeAudio.parentElement;
    nativeAudio.classList.add('hidden');
    if (nativeSelect) nativeSelect.classList.add('hidden');
    Array.from(hostCard.children).forEach(ch => { if (ch !== nativeAudio) ch.classList.add('hidden'); });

    hostCard.className = 'bg-[#143622] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-stone-700';
    const musicUI = document.createElement('div');
    musicUI.id = 'standardCustomMusicBox';
    musicUI.className = 'space-y-3';
    musicUI.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-amber-400/20 border border-amber-300/30 text-amber-200 flex items-center justify-center shrink-0 font-bold text-xs">स्वर</div>
          <div class="min-w-0">
            <span class="text-[10px] uppercase tracking-wider text-amber-200/80 font-semibold block">सबदवाणी, आरती एवं भजन</span>
            <h4 id="customNowPlayingTitle" class="font-yatra text-base text-white truncate">श्री जम्भेश्वर भगवान आरती एवं भजन</h4>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <select id="customPlaylistDropdown" onchange="selectCustomTrackByIndex(this.value)" class="flex-1 sm:flex-initial p-2 rounded-lg bg-black/30 text-amber-100 border border-white/15 text-xs font-medium max-w-full sm:max-w-[210px] truncate">
            <option value="0">1. श्री जम्भेश्वर भगवान आरती एवं भजन</option>
          </select>
          <button onclick="cycleCustomAudioSpeed()" id="customAudioSpeedBtn" class="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 text-xs font-bold border border-white/15">1x</button>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
        <div class="flex items-center justify-center gap-3 shrink-0">
          <button onclick="skipCustomTrack(-1)" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold">पिछला</button>
          <button onclick="toggleCustomMusicPlay()" id="customPlayBtn" class="w-10 h-10 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow font-bold text-sm">▶</button>
          <button onclick="skipCustomTrack(1)" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold">अगला</button>
        </div>
        <div class="flex-1 flex items-center gap-2.5">
          <span id="customCurTime" class="text-xs font-mono text-amber-200 w-9 text-right">0:00</span>
          <input type="range" id="customSeekSlider" value="0" min="0" max="100" oninput="seekCustomMusic(this.value)" class="flex-1 h-1.5 bg-white/25 rounded-lg cursor-pointer accent-amber-400">
          <span id="customDurTime" class="text-xs font-mono text-stone-300 w-9">0:00</span>
        </div>
      </div>
    `;
    hostCard.appendChild(musicUI);

    nativeAudio.addEventListener('timeupdate', () => {
      const slider = document.getElementById('customSeekSlider');
      const curEl = document.getElementById('customCurTime');
      const durEl = document.getElementById('customDurTime');
      if (nativeAudio.duration && slider) {
        slider.value = (nativeAudio.currentTime / nativeAudio.duration) * 100;
        if (curEl) curEl.innerText = formatMusicTime(nativeAudio.currentTime);
        if (durEl) durEl.innerText = formatMusicTime(nativeAudio.duration);
      }
    });
    nativeAudio.addEventListener('ended', () => skipCustomTrack(1));
    nativeAudio.addEventListener('play', () => updatePlayPauseIcon(true));
    nativeAudio.addEventListener('pause', () => updatePlayPauseIcon(false));
  }
}

function formatMusicTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updatePlayPauseIcon(playing) {
  isCustomPlaying = playing;
  const btn = document.getElementById('customPlayBtn');
  if (btn) btn.innerText = playing ? '⏸' : '▶';
}

function renderCustomMusicDropdown() {
  const sel = document.getElementById('customPlaylistDropdown');
  const titleEl = document.getElementById('customNowPlayingTitle');
  if (!sel) return;
  sel.innerHTML = audioPlaylist.map((tr, i) => `<option value="${i}">${i + 1}. ${tr.title}</option>`).join('');
  sel.value = currentTrackIndex.toString();
  if (titleEl && audioPlaylist[currentTrackIndex]) titleEl.innerText = audioPlaylist[currentTrackIndex].title;
}

function selectCustomTrackByIndex(idxStr) {
  const idx = parseInt(idxStr);
  if (!audioPlaylist[idx]) return;
  currentTrackIndex = idx;
  const player = document.getElementById('audioPlayer');
  const source = document.getElementById('audioSource');
  if (player && source) { source.src = audioPlaylist[idx].link; player.load(); player.play().catch(() => {}); }
  renderCustomMusicDropdown();
}

function toggleCustomMusicPlay() {
  const player = document.getElementById('audioPlayer');
  const source = document.getElementById('audioSource');
  if (!player) return;
  if ((!source.src || source.src === window.location.href) && audioPlaylist[currentTrackIndex]) {
    source.src = audioPlaylist[currentTrackIndex].link; player.load();
  }
  if (player.paused) player.play().catch(() => showToast("कृपया व्यवस्थापक कक्ष से वैध भजन लिंक जोड़ें।")); else player.pause();
}

function skipCustomTrack(delta) {
  if (!audioPlaylist.length) return;
  currentTrackIndex = (currentTrackIndex + delta + audioPlaylist.length) % audioPlaylist.length;
  selectCustomTrackByIndex(currentTrackIndex);
}

function seekCustomMusic(val) {
  const player = document.getElementById('audioPlayer');
  if (player && player.duration) player.currentTime = (val / 100) * player.duration;
}

function cycleCustomAudioSpeed() {
  currentSpeedIdx = (currentSpeedIdx + 1) % audioSpeeds.length;
  const spd = audioSpeeds[currentSpeedIdx];
  const player = document.getElementById('audioPlayer');
  if (player) player.playbackRate = spd;
  const btn = document.getElementById('customAudioSpeedBtn');
  if (btn) btn.innerText = `${spd}x`;
  showToast(`ऑडियो गति: ${spd}x`);
}

// 7. MODALS: PDF READER, PROFILE MODAL, NOTIFICATION CENTER & FOOTER
function injectDynamicModalsAndUI() {
  upgradeHomepageAndAudioUI();
  injectUnifiedBottomNavBar();

  if (!window.pdfjsLib) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script);
  }

  // Inbuilt PDF Reader Modal
  if (!document.getElementById('inbuiltPdfModal')) {
    const pdfModal = document.createElement('div');
    pdfModal.id = 'inbuiltPdfModal';
    pdfModal.className = 'fixed inset-0 z-[9990] bg-stone-950 hidden flex-col select-none';
    pdfModal.innerHTML = `
      <div class="bg-[#143622] text-white px-4 py-2.5 flex items-center justify-between gap-2 border-b border-stone-700 shrink-0">
        <h3 id="pdfViewerTitle" class="font-yatra text-sm sm:text-base text-amber-200 truncate">साहित्य पाठक</h3>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="togglePdfLandscapeMode()" class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold">मोड बदलें</button>
          <a id="pdfModalDownloadBtn" href="#" download class="px-3 py-1.5 bg-amber-400 text-stone-950 rounded-lg text-xs font-bold">डाउनलोड</a>
          <button onclick="closeInbuiltPdfViewer()" class="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-bold">बंद करें</button>
        </div>
      </div>
      <div id="pdfSinglePageViewport" class="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-stone-900 relative">
        <div id="pdfLoadingSpinner" class="text-amber-200 text-sm font-semibold">पृष्ठ खुल रहा है...</div>
        <canvas id="pdfSinglePageCanvas" class="bg-white rounded shadow-2xl max-w-full h-auto hidden"></canvas>
        <iframe id="pdfDriveFallbackFrame" class="hidden w-full h-full border-0 bg-white rounded"></iframe>
      </div>
      <div id="pdfBottomNavBar" class="bg-[#143622] text-white px-4 py-2.5 border-t border-stone-700 flex items-center justify-between gap-3 shrink-0">
        <button onclick="changePdfPage(-1)" id="pdfPrevBtn" class="px-4 py-1.5 bg-amber-400 text-stone-950 font-bold text-xs rounded-lg">पिछला पृष्ठ</button>
        <div class="flex items-center gap-1.5 text-xs font-semibold">
          <span>पृष्ठ</span>
          <input type="number" id="pdfPageJumpInput" min="1" value="1" onchange="jumpToPdfPage(this.value)" class="w-14 text-center py-1 rounded bg-stone-800 text-amber-200 border border-stone-600 font-bold">
          <span id="pdfTotalPagesLabel">/ 1</span>
        </div>
        <button onclick="changePdfPage(1)" id="pdfNextBtn" class="px-4 py-1.5 bg-amber-400 text-stone-950 font-bold text-xs rounded-lg">अगला पृष्ठ</button>
      </div>
    `;
    document.body.appendChild(pdfModal);
  }

  // User Profile Modal (With Dynamic Roll No / Email Switch, Jaap Streak & Saved Bookmarks Hub)
  if (!document.getElementById('userProfileModal')) {
    const profModal = document.createElement('div');
    profModal.id = 'userProfileModal';
    profModal.className = 'fixed inset-0 z-[9980] bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4 overflow-y-auto';
    profModal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-stone-200 shadow-xl my-auto">
        <div class="bg-[#143622] text-white p-5 relative">
          <button onclick="closeProfileModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center">✕</button>
          <div class="flex items-center gap-3.5">
            <label class="relative cursor-pointer group shrink-0" title="प्रोफ़ाइल चित्र बदलें">
              <img id="profPhotoPreview" src="" class="hidden w-16 h-16 rounded-xl object-cover border border-amber-300 shadow">
              <div id="profAvatarCircle" class="w-16 h-16 rounded-xl bg-amber-400 text-stone-950 font-yatra text-2xl flex items-center justify-center shadow">बि</div>
              <span class="absolute -bottom-1 -right-1 bg-white text-forest text-[10px] font-bold px-1.5 py-0.5 rounded shadow">फोटो</span>
              <input type="file" accept="image/*" onchange="handleProfilePhotoUpload(event)" class="hidden">
            </label>
            <div>
              <span id="profileRoleBadge" class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30">सदस्य</span>
              <h3 id="profHeaderNameDisplay" class="font-yatra text-xl text-white mt-1">मेरी प्रोफ़ाइल</h3>
              <p class="text-xs text-stone-300">पर्यावरण एवं नियम साधक</p>
            </div>
          </div>
        </div>

        <div class="p-5 space-y-4">
          <div id="ownerStudioInsideProfile" class="hidden p-4 rounded-xl bg-stone-900 text-white space-y-2 border border-stone-700">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-amber-300">व्यवस्थापक एवं परीक्षा नियंत्रण कक्ष</span>
              <span class="text-[10px] bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded">व्यवस्थापक</span>
            </div>
            <p class="text-[11px] text-stone-300">परीक्षा अनुभाग, प्रश्न बैंक, प्रवेश-पत्र, सूचनाएं व लॉग्स यहाँ से संचालित करें:</p>
            <button onclick="closeProfileModal(); switchTab('admin');" class="w-full py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition">
              व्यवस्थापक नियंत्रण कक्ष खोलें
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="p-3 rounded-xl bg-[#FAF8F3] border border-stone-200">
              <div id="statMalaTotal" class="font-bold text-xl text-forest">0</div>
              <div class="text-xs text-stone-600">कुल मंत्र जप</div>
            </div>
            <div class="p-3 rounded-xl bg-[#FAF8F3] border border-stone-200">
              <div id="statMalaLaps" class="font-bold text-xl text-forest">0</div>
              <div class="text-xs text-stone-600">पूर्ण माला</div>
            </div>
          </div>

          <div class="space-y-2.5 text-xs">
            <div>
              <label class="font-semibold text-stone-700 block mb-1">आपका नाम:</label>
              <input type="text" id="profEditName" class="w-full p-2.5 rounded-lg border border-stone-300 font-medium" placeholder="अपना पूरा नाम लिखें">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="font-semibold text-stone-700 block mb-1">गाँव / ज़िला:</label>
                <input type="text" id="profEditLocation" class="w-full p-2.5 rounded-lg border border-stone-300" placeholder="उदा: हिसार, हरियाणा">
              </div>
              <div>
                <label class="font-semibold text-stone-700 block mb-1">ईमेल पता:</label>
                <input type="email" id="profEditEmail" class="w-full p-2.5 rounded-lg border border-stone-300" placeholder="example@mail.com">
              </div>
            </div>
            <div>
              <label class="font-semibold text-stone-700 block mb-1">नया पासवर्ड (यदि बदलना हो):</label>
              <input type="password" id="profEditPass" class="w-full p-2.5 rounded-lg border border-stone-300" placeholder="नया पासवर्ड लिखें">
            </div>

            <div class="grid grid-cols-2 gap-2.5 pt-1">
              <div class="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <span class="text-[10px] text-stone-500 block">पंजीकृत मोबाइल</span>
                <span id="profPhoneDisplay" class="font-bold text-stone-800 truncate block"></span>
              </div>
              <div class="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <span id="profDynamicSecondLabel" class="text-[10px] text-stone-500 block">पंजीकृत ईमेल</span>
                <span id="profRollDisplay" class="font-bold text-forest truncate block"></span>
              </div>
            </div>
          </div>

          <div id="profileBookmarkedQuestionsHub" class="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs"></div>

          <div class="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
            <button onclick="saveUserProfileChanges()" class="flex-1 py-2.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-lg transition">विवरण सहेजें</button>
            <button onclick="closeProfileModal(); logoutUser();" class="px-4 py-2.5 bg-stone-100 hover:bg-rose-50 text-rose-700 font-semibold text-xs rounded-lg border border-stone-200">लॉगआउट</button>
            <button onclick="closeProfileModal()" class="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-lg">बंद करें</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(profModal);
  }

  // Notification Modal (Public Announcements/Merit PDFs + Private Mock Scores)
  if (!document.getElementById('mockMeritNotificationModal')) {
    const mModal = document.createElement('div');
    mModal.id = 'mockMeritNotificationModal';
    mModal.className = 'fixed inset-0 z-[9995] bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4';
    mModal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-stone-200 shadow-xl flex flex-col max-h-[85vh]">
        <div class="bg-[#143622] text-white p-4 flex items-center justify-between">
          <div>
            <h3 class="font-yatra text-base sm:text-lg text-amber-200">सूचना केंद्र एवं परिणाम पट्ट</h3>
            <p class="text-[11px] text-stone-300">आधिकारिक सूचनाएं, मेरिट सूची एवं आपका व्यक्तिगत अभ्यास परिणाम</p>
          </div>
          <button onclick="closeMockMeritNotificationModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold">✕</button>
        </div>

        <div class="p-2.5 bg-stone-100 border-b border-stone-200 flex gap-2 text-xs">
          <button onclick="switchNotificationSubView('public_notices')" id="notif_tab_public" class="flex-1 py-2 px-3 rounded-lg bg-forest text-white font-semibold transition">
            आधिकारिक सूचनाएं व मेरिट सूची
          </button>
          <button onclick="switchNotificationSubView('my_mock_scores')" id="notif_tab_personal" class="flex-1 py-2 px-3 rounded-lg bg-white text-stone-700 font-semibold border border-stone-300 transition">
            मेरा अभ्यास परिणाम
          </button>
        </div>

        <div id="notifPublicBroadcastBox" class="p-4 overflow-y-auto space-y-3 text-xs flex-1"></div>
        <div id="notifPersonalMockBox" class="hidden p-4 overflow-y-auto space-y-2.5 text-xs flex-1"></div>
      </div>
    `;
    document.body.appendChild(mModal);
  }

  // Feedback Modal & Clean Compliance Footer (No Personal WhatsApp Number)
  if (!document.getElementById('userFeedbackModal')) {
    const fb = document.createElement('div');
    fb.id = 'userFeedbackModal';
    fb.className = 'fixed inset-0 z-[9992] bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4';
    fb.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 border border-stone-200 shadow-xl text-center">
        <h3 class="font-yatra text-lg text-forest">सुझाव एवं सहायता कक्ष</h3>
        <p class="text-xs text-stone-500">मंच या परीक्षा से संबंधित अपना सुझाव या प्रश्न यहाँ दर्ज करें:</p>
        <textarea id="fbCommentInput" rows="3" placeholder="अपना संदेश यहाँ लिखें..." class="w-full p-2.5 text-xs rounded-lg border border-stone-300"></textarea>
        <div class="flex gap-2">
          <button onclick="submitUserFeedback()" class="flex-1 py-2 bg-forest text-white font-semibold text-xs rounded-lg">संदेश भेजें</button>
          <button onclick="document.getElementById('userFeedbackModal').classList.add('hidden')" class="px-4 py-2 bg-stone-100 text-stone-600 font-semibold text-xs rounded-lg">बंद करें</button>
        </div>
      </div>
    `;
    document.body.appendChild(fb);
  }

  if (!document.getElementById('indusComplianceFooter')) {
    const footer = document.createElement('footer');
    footer.id = 'indusComplianceFooter';
    footer.className = 'max-w-5xl w-full mx-auto px-4 py-6 mt-8 border-t border-stone-200 text-center text-xs text-stone-500 space-y-2';
    footer.innerHTML = `
      <div class="flex flex-wrap justify-center gap-4 font-semibold text-forest">
        <button onclick="openPrivacyPolicyModal()" class="hover:underline">गोपनीयता नीति एवं नियम</button>
        <span>•</span>
        <button onclick="openFeedbackModal()" class="hover:underline">सुझाव एवं सहायता कक्ष</button>
      </div>
      <p class="text-[11px] text-stone-400">© २०२६ विश्नोई समाज डिजिटल मंच (bishnoism.vercel.app) • सर्वाधिकार सुरक्षित</p>
    `;
    document.body.appendChild(footer);
  }
}

// 8. PROFILE, BOOKMARKS & STREAK FUNCTIONS
function updateDailyJaapStreak() {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = localStorage.getItem('bishnoi_jaap_last_date') || '';
  let streak = parseInt(localStorage.getItem('bishnoi_jaap_streak') || '0');
  if (lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    streak = (lastDate === yesterday) ? streak + 1 : 1;
    localStorage.setItem('bishnoi_jaap_last_date', today);
    localStorage.setItem('bishnoi_jaap_streak', streak.toString());
  }
  return streak;
}

function openProfileModal() {
  if (!currentUser) return openAuthModal();
  const modal = document.getElementById('userProfileModal');
  if (!modal) return;

  const nm = currentUser.name || 'सदस्य';
  document.getElementById('profEditName').value = nm;
  document.getElementById('profHeaderNameDisplay').innerText = nm;
  document.getElementById('profEditLocation').value = currentUser.location || '';
  document.getElementById('profEditEmail').value = currentUser.email || '';
  document.getElementById('profEditPass').value = '';
  document.getElementById('profPhoneDisplay').innerText = currentUser.phone || '';

  // Show Roll Number ONLY during active Exam Season; otherwise show Email ID
  const isExamSeasonActive = Boolean(
    parikshaVisibility.enrollment ||
    parikshaVisibility.mainExam ||
    parikshaVisibility.resultsPublished
  );
  const labelEl = document.getElementById('profDynamicSecondLabel');
  const valEl = document.getElementById('profRollDisplay');
  if (labelEl && valEl) {
    if (isExamSeasonActive) {
      labelEl.innerText = 'परीक्षा रोल नंबर';
      valEl.innerText = examState.rollNumber !== 'GUEST' ? examState.rollNumber : (localStorage.getItem('bishnoi_saved_roll') || 'नामांकन शेष');
    } else {
      labelEl.innerText = 'पंजीकृत ईमेल';
      valEl.innerText = currentUser.email || 'दर्ज नहीं है';
    }
  }

  updateProfileAvatarUI();

  const studioBox = document.getElementById('ownerStudioInsideProfile');
  if (studioBox) studioBox.classList.toggle('hidden', !isEditorOrOwner());

  const roleBadge = document.getElementById('profileRoleBadge');
  const streakCount = parseInt(localStorage.getItem('bishnoi_jaap_streak') || '1');
  if (roleBadge) {
    const baseRole = isSuperOwner() ? 'मुख्य व्यवस्थापक' : (isEditorOrOwner() ? 'सह-व्यवस्थापक' : 'पंजीकृत सदस्य');
    roleBadge.innerText = `${baseRole} • ${streakCount} दिन साधना क्रम`;
  }

  document.getElementById('statMalaTotal').innerText = malaTotalCount;
  document.getElementById('statMalaLaps').innerText = malaLapsCount;
  renderProfileBookmarksList();

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeProfileModal() {
  const modal = document.getElementById('userProfileModal');
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

function handleProfilePhotoUpload(e) {
  const file = e.target.files?.[0];
  if (!file || !currentUser) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = async () => {
      const c = document.createElement('canvas');
      c.width = 160; c.height = 160;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 160, 160);
      const dataUrl = c.toDataURL('image/jpeg', 0.8);
      currentUser.photo = dataUrl;
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      updateProfileAvatarUI();
      try { await db.collection('users').doc(currentUser.phone).set({ photo: dataUrl }, { merge: true }); } catch (err) {}
      showToast("प्रोफ़ाइल फोटो अपडेट हो गई।");
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function updateProfileAvatarUI() {
  const imgEl = document.getElementById('profPhotoPreview');
  const circEl = document.getElementById('profAvatarCircle');
  if (!imgEl || !circEl) return;
  if (currentUser && currentUser.photo) {
    imgEl.src = currentUser.photo;
    imgEl.classList.remove('hidden');
    circEl.classList.add('hidden');
  } else {
    imgEl.classList.add('hidden');
    circEl.classList.remove('hidden');
    circEl.innerText = (currentUser?.name || 'बि').trim().charAt(0).toUpperCase();
  }
}

async function saveUserProfileChanges() {
  if (!currentUser) return;
  const newName = document.getElementById('profEditName').value.trim();
  const newLoc = document.getElementById('profEditLocation').value.trim();
  const newEmail = document.getElementById('profEditEmail')?.value.trim() || '';
  const newPass = document.getElementById('profEditPass').value.trim();
  if (!newName) return showToast("कृपया नाम खाली न छोड़ें।");

  currentUser.name = newName;
  currentUser.location = newLoc;
  currentUser.email = newEmail;
  localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));

  const updateData = { name: newName, location: newLoc, email: newEmail, phone: currentUser.phone };
  if (newPass) updateData.pass = newPass;

  try {
    await db.collection('users').doc(currentUser.phone).set(updateData, { merge: true });
  } catch (e) {}
  updateNavAuth();
  closeProfileModal();
  showToast("प्रोफ़ाइल विवरण सुरक्षित सहेज लिया गया।");
}

function toggleBookmarkCurrentQuestion() {
  const q = examState.questions[examState.currentIndex];
  if (!q) return;
  const saved = JSON.parse(localStorage.getItem('bishnoi_saved_bookmarks') || '[]');
  const qTitle = q.title || q.q || '';
  const existsIdx = saved.findIndex(item => item.title === qTitle);

  if (existsIdx > -1) {
    saved.splice(existsIdx, 1);
    showToast("प्रश्न अध्ययन सूची से हटाया गया।");
  } else {
    saved.unshift({ title: qTitle, options: q.options || q.opts || [], time: Date.now() });
    showToast("प्रश्न आपकी प्रोफ़ाइल की अध्ययन सूची में सहेजा गया।");
  }
  localStorage.setItem('bishnoi_saved_bookmarks', JSON.stringify(saved.slice(0, 50)));
}

function renderProfileBookmarksList() {
  const box = document.getElementById('profileBookmarkedQuestionsHub');
  if (!box) return;
  const saved = JSON.parse(localStorage.getItem('bishnoi_saved_bookmarks') || '[]');
  if (!saved.length) {
    box.innerHTML = `<div class="text-stone-400 text-center py-1">सहेजे गए प्रश्न (Revision Hub): अभी कोई प्रश्न चिह्नित नहीं है।</div>`;
    return;
  }
  box.innerHTML = `
    <div class="flex justify-between items-center font-bold text-forest border-b border-stone-200 pb-1">
      <span>सहेजे गए महत्वपूर्ण प्रश्न (${saved.length})</span>
      <button onclick="localStorage.removeItem('bishnoi_saved_bookmarks'); renderProfileBookmarksList();" class="text-[10px] text-rose-600">सूची साफ़ करें</button>
    </div>
    <div class="max-h-32 overflow-y-auto space-y-1.5 pt-1">
      ${saved.map((item, i) => `
        <div class="p-2 rounded bg-white border border-stone-200 text-[11px]">
          <div class="font-semibold text-stone-800">${i + 1}. ${item.title}</div>
          <div class="text-stone-500 mt-0.5">${(item.options || []).join(' • ')}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// 9. NOTIFICATION CENTER (PUBLIC BROADCASTS + PRIVATE MOCK SCORES)
function ensureBellIconMounted() {
  const container = document.getElementById('authActionsContainer');
  if (!container) return;
  container.className = "flex items-center gap-2 shrink-0";

  if (!document.getElementById('topMockMeritBellBtn')) {
    const bellBtn = document.createElement('button');
    bellBtn.id = 'topMockMeritBellBtn';
    bellBtn.type = 'button';
    bellBtn.onclick = openMockMeritNotificationModal;
    bellBtn.title = "सूचना केंद्र एवं परिणाम";
    bellBtn.className = "p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-forest border border-stone-300 transition flex items-center justify-center shrink-0";
    bellBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`;
    container.insertBefore(bellBtn, container.firstChild);
  }
}

function openMockMeritNotificationModal() {
  const m = document.getElementById('mockMeritNotificationModal');
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
    switchNotificationSubView('public_notices');
  }
}

function closeMockMeritNotificationModal() {
  const m = document.getElementById('mockMeritNotificationModal');
  if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
}

function switchNotificationSubView(view) {
  const bPub = document.getElementById('notif_tab_public');
  const bPer = document.getElementById('notif_tab_personal');
  const boxPub = document.getElementById('notifPublicBroadcastBox');
  const boxPer = document.getElementById('notifPersonalMockBox');

  if (view === 'public_notices') {
    if (bPub) bPub.className = "flex-1 py-2 px-3 rounded-lg bg-forest text-white font-semibold transition";
    if (bPer) bPer.className = "flex-1 py-2 px-3 rounded-lg bg-white text-stone-700 font-semibold border border-stone-300 transition";
    boxPub?.classList.remove('hidden');
    boxPer?.classList.add('hidden');
    loadPublicNotificationsFeed();
  } else {
    if (bPer) bPer.className = "flex-1 py-2 px-3 rounded-lg bg-forest text-white font-semibold transition";
    if (bPub) bPub.className = "flex-1 py-2 px-3 rounded-lg bg-white text-stone-700 font-semibold border border-stone-300 transition";
    boxPer?.classList.remove('hidden');
    boxPub?.classList.add('hidden');
    loadMyPrivateMockScores();
  }
}

async function loadPublicNotificationsFeed() {
  const box = document.getElementById('notifPublicBroadcastBox');
  if (!box) return;
  box.innerHTML = `<div class="p-6 text-center text-stone-400">सूचनाएं लोड हो रही हैं...</div>`;
  try {
    const snap = await db.collection('publicNotifications').orderBy('createdAt', 'desc').limit(20).get();
    if (snap.empty) {
      box.innerHTML = `<div class="p-6 text-center text-stone-400">अभी कोई नई सार्वजनिक सूचना या मेरिट PDF जारी नहीं हुई है।</div>`;
      return;
    }
    box.innerHTML = snap.docs.map(doc => {
      const n = doc.data();
      const dateStr = n.createdAt ? n.createdAt.toDate().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }) : 'नवीनतम';
      const safeTitle = (n.title || 'सूचना').replace(/'/g, "\\'");
      const safeLink = (n.link || '').replace(/'/g, "\\'");
      const isPdf = safeLink.toLowerCase().endsWith('.pdf') || safeLink.includes('drive.google.com');

      return `
        <div class="p-3.5 rounded-xl bg-[#FAF8F3] border border-stone-200 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="px-2 py-0.5 bg-forest text-amber-200 rounded text-[10px] font-semibold">${n.badge || 'आधिकारिक सूचना'}</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-stone-400">${dateStr}</span>
              ${isSuperOwner() ? `<button onclick="deletePublicNotification('${doc.id}')" class="text-rose-600 font-bold text-xs">हटाएं</button>` : ''}
            </div>
          </div>
          <h4 class="font-bold text-sm text-forest">${n.title || ''}</h4>
          ${n.message ? `<p class="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">${n.message}</p>` : ''}
          ${n.link ? `
            <div class="pt-1 flex flex-wrap gap-2">
              ${isPdf ? `<button onclick="closeMockMeritNotificationModal(); openInbuiltPdfViewer('${safeTitle}', '${safeLink}');" class="px-3 py-1.5 bg-amber-400 text-stone-950 font-bold rounded-lg text-xs">पीडीएफ पढ़ें</button>` : ''}
              <a href="${n.link}" target="_blank" class="px-3 py-1.5 bg-forest text-white font-semibold rounded-lg text-xs inline-flex items-center gap-1">
                ${n.linkLabel || 'दस्तावेज़ खोलें'} ↗
              </a>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  } catch (e) {
    box.innerHTML = `<div class="p-4 text-center text-rose-500">त्रुटि: ${e.message}</div>`;
  }
}

async function deletePublicNotification(id) {
  if (!isSuperOwner()) return;
  await db.collection('publicNotifications').doc(id).delete();
  loadPublicNotificationsFeed();
  showToast("सूचना हटा दी गई।");
}

function loadMyPrivateMockScores() {
  const box = document.getElementById('notifPersonalMockBox');
  if (!box) return;
  const localHistory = JSON.parse(localStorage.getItem('bishnoi_my_personal_mock_scores') || '[]');

  if (!localHistory.length) {
    box.innerHTML = `
      <div class="p-6 text-center space-y-1 text-stone-500">
        <p class="font-semibold text-forest">अभी तक आपने कोई अभ्यास या मॉक टेस्ट नहीं दिया है।</p>
        <p class="text-[11px] text-stone-400">यहाँ केवल आपके व्यक्तिगत मॉक प्राप्तांक सुरक्षित रहते हैं।</p>
      </div>
    `;
    return;
  }

  box.innerHTML = localHistory.map(r => {
    const mName = r.mode === 'mock_1' ? 'मॉक टेस्ट - ०१' : (r.mode === 'mock_2' ? 'मॉक टेस्ट - ०२' : 'दैनिक ज्ञान अभ्यास');
    const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
    const safeName = (r.candidateName || currentUser?.name || 'प्रतिभागी').replace(/'/g, "\\'");
    return `
      <div class="p-3.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between gap-3">
        <div>
          <span class="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">${mName}</span>
          <div class="font-bold text-stone-800 mt-1">${r.candidateName || currentUser?.name || 'प्रतिभागी'}</div>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-lg bg-forest text-white font-bold text-xs">${r.score} / ${r.total} (${pct}%)</span>
          <button onclick="closeMockMeritNotificationModal(); generateCertificate('${safeName}', ${pct});" class="px-2.5 py-1.5 bg-amber-400 text-stone-950 rounded-lg text-[11px] font-bold">प्रमाण-पत्र</button>
        </div>
      </div>
    `;
  }).join('');
}

// 10. PARIKSHA 5-SECTION VISIBILITY & SUB-ADMIN RBAC
function listenParikshaVisibility() {
  db.collection('examConfig').doc('visibility').onSnapshot(doc => {
    if (doc.exists) {
      parikshaVisibility = { ...parikshaVisibility, ...doc.data() };
    }
    applyParikshaVisibilityUI();
  });
}

function applyParikshaVisibilityUI() {
  const anyActive = Boolean(
    parikshaVisibility.enrollment ||
    parikshaVisibility.mock ||
    parikshaVisibility.mainExam ||
    parikshaVisibility.dailyQuiz ||
    parikshaVisibility.resultsPublished
  );

  document.getElementById('examClosedNoticeBox')?.classList.toggle('hidden', anyActive);
  document.getElementById('examEnrollmentBox')?.classList.toggle('hidden', !parikshaVisibility.enrollment);
  document.getElementById('mockTestsHub')?.classList.toggle('hidden', !parikshaVisibility.mock);
  document.getElementById('mainExamLaunchBox')?.classList.toggle('hidden', !parikshaVisibility.mainExam);
  document.getElementById('quizIntroCard')?.classList.toggle('hidden', !parikshaVisibility.dailyQuiz);
  document.getElementById('examResultCheckDesk')?.classList.toggle('hidden', !parikshaVisibility.resultsPublished);

  const syncCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };
  syncCheck('toggleEnrollmentSection', parikshaVisibility.enrollment);
  syncCheck('toggleMockSection', parikshaVisibility.mock);
  syncCheck('toggleMainExamSection', parikshaVisibility.mainExam);
  syncCheck('toggleDailyQuizSection', parikshaVisibility.dailyQuiz);
  syncCheck('toggleResultsPublishedSection', parikshaVisibility.resultsPublished);

  if (parikshaVisibility.mainExam && parikshaVisibility.examScheduleTime) {
    startExamCountdownClock(parikshaVisibility.examScheduleTime);
  }
}

async function updateParikshaVisibilitySettings() {
  if (!isSuperOwner() && !(subAdminPermissionsMap[currentUser?.phone]?.canPublishExam || subAdminPermissionsMap[currentUser?.phone]?.canToggleResults)) {
    return showToast("यह परिवर्तन करने का अधिकार केवल अधिकृत व्यवस्थापक के पास है।");
  }
  const enrollment = document.getElementById('toggleEnrollmentSection')?.checked || false;
  const mock = document.getElementById('toggleMockSection')?.checked || false;
  const mainExam = document.getElementById('toggleMainExamSection')?.checked || false;
  const dailyQuiz = document.getElementById('toggleDailyQuizSection')?.checked || false;
  const resultsPublished = document.getElementById('toggleResultsPublishedSection')?.checked || false;

  await db.collection('examConfig').doc('visibility').set({
    enrollment, mock, mainExam, dailyQuiz, resultsPublished
  }, { merge: true });

  showToast("परीक्षा अनुभाग दृश्यता सेटिंग्स अपडेट हो गईं।");
}

function startExamCountdownClock(targetIso) {
  if (examCountdownTimer) clearInterval(examCountdownTimer);
  const targetTime = new Date(targetIso).getTime();

  function update() {
    const now = getSyncedNow();
    const diff = targetTime - now;
    const disp = document.getElementById('examCountdownDisplay');
    const startBtn = document.getElementById('startMainExamBtn');
    if (!disp) return;

    if (diff <= 0) {
      disp.innerText = "00:00:00 (परीक्षा प्रारंभ)";
      if (startBtn) startBtn.classList.remove('opacity-50', 'pointer-events-none');
      clearInterval(examCountdownTimer);
      return;
    }

    if (startBtn && !isSuperOwner()) {
      startBtn.classList.add('opacity-50', 'pointer-events-none');
    }

    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    disp.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  update();
  examCountdownTimer = setInterval(update, 1000);
}

// 11. OWNER STUDIO DYNAMIC PANELS & RBAC
function mountOwnerStudioExtensions() {
  // 1. Add Admit Card Download Button inside Enrollment Box
  const enrollBox = document.getElementById('examEnrollmentBox');
  if (enrollBox && !document.getElementById('cleanAdmitCardDownloadBar')) {
    const bar = document.createElement('div');
    bar.id = 'cleanAdmitCardDownloadBar';
    bar.className = 'pt-3 mt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs';
    bar.innerHTML = `
      <span class="text-stone-600 font-medium">नामांकन के पश्चात अपना प्रवेश-पत्र यहाँ से डाउनलोड करें:</span>
      <button type="button" onclick="downloadStudentAdmitCardPdf()" class="px-4 py-2 bg-forest hover:bg-emerald-950 text-white font-semibold rounded-lg transition">
        प्रवेश-पत्र डाउनलोड करें
      </button>
    `;
    enrollBox.appendChild(bar);
  }

  // 2. Add Review & Bookmark Buttons inside Active Exam Box
  const activeBox = document.getElementById('quizActiveBox');
  if (activeBox && !document.getElementById('markForReviewExamBtn')) {
    const navBtnsRow = activeBox.querySelector('button[onclick="navigateExam(-1)"]')?.parentElement;
    if (navBtnsRow) {
      const revBtn = document.createElement('button');
      revBtn.type = 'button';
      revBtn.id = 'markForReviewExamBtn';
      revBtn.onclick = toggleMarkQuestionForReview;
      revBtn.className = "px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg text-xs font-semibold border border-purple-300 transition";
      revBtn.innerText = "पुनर्विचार चिह्न";
      navBtnsRow.appendChild(revBtn);

      const bmkBtn = document.createElement('button');
      bmkBtn.type = 'button';
      bmkBtn.id = 'bookmarkExamQBtn';
      bmkBtn.onclick = toggleBookmarkCurrentQuestion;
      bmkBtn.className = "px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition";
      bmkBtn.innerText = "प्रश्न सहेजें";
      navBtnsRow.appendChild(bmkBtn);
    }
  }

  const adminTab = document.getElementById('tab-admin');
  if (!adminTab) return;

  // 3. Ensure 5th Result Toggle in Visibility Controller
  const visCtrl = document.getElementById('secParikshaVisibilityController');
  if (visCtrl && !document.getElementById('toggleResultsPublishedSection')) {
    const grid = visCtrl.querySelector('.grid') || visCtrl;
    grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs";
    const lbl = document.createElement('label');
    lbl.className = "flex items-center p-2.5 rounded-xl bg-stone-50 border border-stone-300 cursor-pointer";
    lbl.innerHTML = `
      <input type="checkbox" id="toggleResultsPublishedSection" onchange="updateParikshaVisibilitySettings()" class="rounded text-forest mr-2 w-4 h-4">
      <span class="font-bold text-forest">5. परिणाम खोज कक्ष</span>
    `;
    grid.appendChild(lbl);
  }

  // 4. Sub-Admin Assignment Input Row
  const secAdmins = document.getElementById('secManageAdmins');
  if (secAdmins && !document.getElementById('subAdminPhoneAssignRow')) {
    const assignRow = document.createElement('div');
    assignRow.id = 'subAdminPhoneAssignRow';
    assignRow.className = 'pt-3 border-t border-stone-100 space-y-2.5 text-xs';
    assignRow.innerHTML = `
      <div class="flex flex-col sm:flex-row gap-2">
        <input type="tel" id="subAdminTargetPhone" maxlength="10" placeholder="सह-प्रबंधक का १० अंकों का मोबाइल नंबर" class="flex-1 p-2 border border-stone-300 rounded-lg font-medium">
        <button onclick="saveSubAdminGranularPermissions()" class="px-4 py-2 bg-forest text-white font-semibold rounded-lg hover:bg-emerald-950">
          अधिकार सहेजें
        </button>
      </div>
      <div id="activeSubAdminsList" class="space-y-1.5 pt-1"></div>
    `;
    secAdmins.appendChild(assignRow);
  }

  // 5. Additional Owner Studio Suite (Broadcasts, Admit Customizer, Soft Maintenance, Story Uploader)
  if (!document.getElementById('cleanOwnerExtendedSuite')) {
    const suite = document.createElement('div');
    suite.id = 'cleanOwnerExtendedSuite';
    suite.className = 'space-y-6 mt-6';
    suite.innerHTML = `
      <!-- PUBLIC NOTIFICATION & MERIT PDF BROADCASTER -->
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
          <div>
            <h3 class="font-bold text-forest text-sm">सार्वजनिक सूचना एवं मेरिट सूची प्रसारण (सूचना केंद्र)</h3>
            <p class="text-[11px] text-stone-500">यहाँ से प्रकाशित सूचना या मेरिट PDF सभी सदस्यों के शीर्ष सूचना आइकन में दिखाई देगी:</p>
          </div>
          <button type="button" onclick="downloadMockMeritPdfForOwner()" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-forest border border-stone-300 rounded-lg text-xs font-semibold">
            मॉक मेरिट PDF डाउनलोड करें
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <input type="text" id="notifBroadcastBadge" placeholder="श्रेणी (उदा: मेरिट सूची / सूचना)" class="p-2.5 rounded-lg border border-stone-300">
          <input type="text" id="notifBroadcastTitle" placeholder="सूचना का शीर्षक *" class="sm:col-span-2 p-2.5 rounded-lg border border-stone-300 font-semibold">
        </div>
        <textarea id="notifBroadcastMsg" rows="2" placeholder="सूचना का विवरण लिखें..." class="w-full p-2.5 text-xs rounded-lg border border-stone-300"></textarea>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <input type="text" id="notifBroadcastLink" placeholder="PDF या वेब लिंक (उदा: ./merit.pdf)" class="p-2.5 rounded-lg border border-stone-300">
          <input type="text" id="notifBroadcastLinkLabel" placeholder="बटन का नाम (उदा: मेरिट सूची देखें)" class="p-2.5 rounded-lg border border-stone-300">
        </div>
        <button onclick="publishOwnerNotificationBroadcast()" class="w-full py-2.5 bg-forest hover:bg-emerald-950 text-white font-semibold text-xs rounded-lg transition">
          सूचना केंद्र में प्रकाशित करें
        </button>
      </div>

      <!-- ADMIT CARD CUSTOMIZER, LATE ENTRY CUTOFF & CSV EXPORTS -->
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
          <div>
            <h3 class="font-bold text-forest text-sm">प्रवेश-पत्र प्रारूप, लेट-एंट्री समय एवं एक्सल (CSV) रिपोर्ट्स</h3>
            <p class="text-[11px] text-stone-500">आगामी परीक्षा हेतु प्रवेश-पत्र का विवरण एवं प्रवेश बंद होने का समय निर्धारित करें:</p>
          </div>
          <div class="flex gap-2">
            <button onclick="exportEnrolledCSV()" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-forest border border-stone-300 rounded-lg text-xs font-semibold">नामांकन CSV</button>
            <button onclick="exportMainExamResultsCSV()" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-forest border border-stone-300 rounded-lg text-xs font-semibold">मुख्य परिणाम CSV</button>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label class="font-semibold text-stone-600 block mb-1">परीक्षा का शीर्षक</label>
            <input type="text" id="cfgAdmitTitle" value="${customAdmitConfig.examTitle}" class="w-full p-2 border border-stone-300 rounded-lg">
          </div>
          <div>
            <label class="font-semibold text-stone-600 block mb-1">परीक्षा दिनांक व समय</label>
            <input type="text" id="cfgAdmitDate" value="${customAdmitConfig.examDateStr}" class="w-full p-2 border border-stone-300 rounded-lg">
          </div>
          <div>
            <label class="font-semibold text-stone-600 block mb-1">परीक्षा माध्यम / केंद्र</label>
            <input type="text" id="cfgAdmitCenter" value="${customAdmitConfig.examCenterStr}" class="w-full p-2 border border-stone-300 rounded-lg">
          </div>
          <div>
            <label class="font-semibold text-rose-700 block mb-1">लेट-एंट्री रोक (मिनट)</label>
            <input type="number" id="cfgLateCutoffMins" value="${customAdmitConfig.lateCutoffMins}" min="0" max="120" class="w-full p-2 border border-stone-300 rounded-lg font-bold">
          </div>
        </div>
        <div class="text-xs">
          <label class="font-semibold text-stone-600 block mb-1">प्रवेश-पत्र निर्देश</label>
          <input type="text" id="cfgAdmitInst" value="${customAdmitConfig.instructionsStr}" class="w-full p-2 border border-stone-300 rounded-lg">
        </div>
        <div class="flex flex-wrap gap-2">
          <button onclick="saveCustomAdmitAndCutoffConfig()" class="px-5 py-2 bg-forest text-white rounded-lg text-xs font-semibold">प्रवेश-पत्र सेटिंग्स सहेजें</button>
          <button onclick="loadLiveProctoringStats()" class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg text-xs font-semibold">परीक्षा सांख्यिकी एवं कट-ऑफ देखें</button>
        </div>
        <div id="liveProctoringStatsBox" class="hidden p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"></div>
      </div>

      <!-- EASY STORY & HISTORY UPLOADER -->
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-stone-100 pb-2">
          <div>
            <h3 class="font-bold text-forest text-sm">इतिहास अध्याय एवं बाल संस्कार कहानी अपलोडर</h3>
            <p class="text-[11px] text-stone-500">नया ऐतिहासिक तथ्य या बाल कहानी सीधे जोड़ें:</p>
          </div>
          <button type="button" onclick="generateAiStoryForUploader()" class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-forest border border-stone-300 rounded-lg text-xs font-semibold">
            AI से प्रारूप बनाएं
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <select id="easyStoryType" class="p-2.5 rounded-lg border border-stone-300 font-semibold text-forest bg-stone-50">
            <option value="kids">बाल संस्कार कहानी</option>
            <option value="history">इतिहास अध्याय</option>
          </select>
          <input type="text" id="easyStoryTitle" placeholder="शीर्षक लिखें *" class="p-2.5 rounded-lg border border-stone-300">
        </div>
        <textarea id="easyStoryContent" rows="3" placeholder="पूरा विवरण या कहानी यहाँ लिखें *" class="w-full p-2.5 text-xs rounded-lg border border-stone-300"></textarea>
        <input type="text" id="easyStoryMoral" placeholder="प्रमुख सीख या संदेश (ऐच्छिक)" class="w-full p-2.5 text-xs rounded-lg border border-stone-300">
        <button onclick="publishEasyStoryOrHistory()" class="w-full py-2.5 bg-forest hover:bg-emerald-950 text-white font-semibold text-xs rounded-lg">
          अध्याय प्रकाशित करें
        </button>
      </div>

      <!-- NON-BLOCKING SECTION UPDATE & PROGRESS BAR CONTROLLER -->
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-stone-100 pb-2">
          <div>
            <h3 class="font-bold text-forest text-sm">अनुभाग अपडेट सूचना एवं प्रोग्रेस बार नियंत्रण (Soft Maintenance)</h3>
            <p class="text-[11px] text-stone-500">ऐप को ब्लॉक किए बिना किसी विशेष अनुभाग में 'नए प्रश्न/PDF अपलोड हो रहे हैं' का संदेश व प्रोग्रेस बार दिखाएं:</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <input type="text" id="adminMaintMessage" placeholder="कस्टम अपडेट संदेश (खाली छोड़ने पर स्वतः सेक्शन अनुसार दिखेगा)" class="p-2.5 rounded-lg border border-stone-300">
          <div class="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center gap-3">
            <span class="font-semibold text-stone-700 shrink-0">प्रोग्रेस बार: <b id="adminMaintPctLabel">65%</b></span>
            <input type="range" id="adminMaintProgressPct" min="5" max="100" value="65" oninput="document.getElementById('adminMaintPctLabel').innerText = this.value + '%'" class="w-full accent-forest cursor-pointer">
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>जप माला</span><select id="lock_mala" class="border rounded p-1"><option value="off">सामान्य</option><option value="both">अपडेट मोड</option></select></div>
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>२९ नियम</span><select id="lock_niyams" class="border rounded p-1"><option value="off">सामान्य</option><option value="both">अपडेट मोड</option></select></div>
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>साहित्य</span><select id="lock_library" class="border rounded p-1"><option value="off">सामान्य</option><option value="both">अपडेट मोड</option></select></div>
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>संवाद मंच</span><select id="lock_community" class="border rounded p-1"><option value="off">सामान्य</option><option value="both">अपडेट मोड</option></select></div>
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>परीक्षा</span><select id="lock_quiz" class="border rounded p-1"><option value="off">सामान्य</option><option value="both">अपडेट मोड</option></select></div>
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>इतिहास</span><select id="lock_history" class="border rounded p-1"><option value="off">सामान्य</option><option value="both">अपडेट मोड</option></select></div>
        </div>
        <div class="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
          <span class="font-semibold text-stone-700">ओनर प्रीव्यू मोड (मेरी स्क्रीन पर भी अपडेट प्रोग्रेस कार्ड देखें):</span>
          <input type="checkbox" id="ownerMaintPreviewToggle" onchange="applyLiveMaintenanceLocks()" class="w-4 h-4 accent-forest cursor-pointer">
        </div>
        <button onclick="saveMaintenanceSettings()" class="w-full py-2.5 bg-forest hover:bg-emerald-950 text-white font-semibold text-xs rounded-lg">
          अपडेट मोड सेटिंग्स लागू करें
        </button>
      </div>

      <!-- DAILY WINNERS, PASSWORD RESET & FEEDBACK INBOX -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-forest text-sm">दैनिक विजेता एवं पासवर्ड रीसेट</h3>
            <button onclick="clearDailyWinnersToBlank()" class="text-[11px] text-rose-600 font-semibold">विजेता खाली करें</button>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex gap-2"><input type="text" id="win1InputName" placeholder="प्रथम विजेता नाम" class="w-2/3 p-2 border rounded-lg"><input type="text" id="win1InputScore" placeholder="अंक" class="w-1/3 p-2 border rounded-lg"></div>
            <div class="flex gap-2"><input type="text" id="win2InputName" placeholder="द्वितीय विजेता नाम" class="w-2/3 p-2 border rounded-lg"><input type="text" id="win2InputScore" placeholder="अंक" class="w-1/3 p-2 border rounded-lg"></div>
            <div class="flex gap-2"><input type="text" id="win3InputName" placeholder="तृतीय विजेता नाम" class="w-2/3 p-2 border rounded-lg"><input type="text" id="win3InputScore" placeholder="अंक" class="w-1/3 p-2 border rounded-lg"></div>
          </div>
          <button onclick="saveDailyWinners()" class="w-full py-2 bg-forest text-white rounded-lg text-xs font-semibold">विजेता अपडेट करें</button>
          <div class="pt-3 border-t border-stone-100 space-y-2 text-xs">
            <span class="font-semibold text-stone-700 block">सदस्य पासवर्ड रीसेट:</span>
            <div class="flex gap-2">
              <input type="tel" id="adminResetUserPhone" maxlength="10" placeholder="मोबाइल नंबर" class="w-1/2 p-2 border rounded-lg">
              <input type="text" id="adminResetUserNewPass" placeholder="नया पासवर्ड" class="w-1/2 p-2 border rounded-lg">
            </div>
            <button onclick="adminResetMemberPassword()" class="w-full py-2 bg-stone-800 text-white rounded-lg text-xs font-semibold">पासवर्ड बदलें</button>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 text-xs">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-forest text-sm">सुझाव इनबॉक्स एवं म्यूट सूची</h3>
            <button onclick="clearAllQuizQuestions()" class="text-rose-600 font-semibold">दैनिक प्रश्न रीसेट</button>
          </div>
          <div>
            <span class="font-semibold text-stone-600 block mb-1">प्राप्त सुझाव एवं सहायता संदेश:</span>
            <div id="adminFeedbackInboxList" class="space-y-1.5 max-h-36 overflow-y-auto border border-stone-100 p-2 rounded-lg"></div>
          </div>
          <div>
            <span class="font-semibold text-stone-600 block mb-1">म्यूट किए गए सदस्य:</span>
            <div id="adminBlockedUsersList" class="space-y-1"></div>
          </div>
        </div>
      </div>
    `;
    adminTab.appendChild(suite);
  }
}

function listenSubAdminPermissions() {
  db.collection('settings').doc('subAdminPermissions').onSnapshot(doc => {
    subAdminPermissionsMap = doc.exists ? (doc.data().map || {}) : {};
    editorsPhoneList = Object.keys(subAdminPermissionsMap);

    const listEl = document.getElementById('activeSubAdminsList');
    if (listEl) {
      if (editorsPhoneList.length === 0) {
        listEl.innerHTML = `<div class="text-stone-400">अभी कोई सह-प्रबंधक नियुक्त नहीं है।</div>`;
      } else {
        listEl.innerHTML = editorsPhoneList.map(ph => {
          const p = subAdminPermissionsMap[ph] || {};
          const badges = [
            p.canUploadQuestions ? 'प्रश्न ड्राफ्ट' : '',
            p.canPublishExam ? 'परीक्षा संचालन' : '',
            p.canToggleResults ? 'परिणाम घोषणा' : '',
            p.canViewAuditLogs ? 'ऑडिट लॉग्स' : ''
          ].filter(Boolean).join(' • ') || 'सीमित';
          return `
            <div class="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200">
              <div>
                <span class="font-bold text-forest">${ph}</span>
                <span class="text-[10px] text-stone-500 ml-2">(${badges})</span>
              </div>
              <button onclick="removeSubAdminRole('${ph}')" class="text-rose-600 font-bold text-[11px]">हटाएं</button>
            </div>
          `;
        }).join('');
      }
    }
    applyCurrentUserRBACView();
  });
}

async function saveSubAdminGranularPermissions() {
  if (!isSuperOwner()) return showToast("केवल मुख्य व्यवस्थापक ही अधिकार दे सकते हैं।");
  const ph = document.getElementById('subAdminTargetPhone')?.value.trim() || '';
  if (!/^[6-9]\d{9}$/.test(ph)) return showToast("कृपया सही १० अंकों का मोबाइल नंबर लिखें।");

  subAdminPermissionsMap[ph] = {
    canUploadQuestions: Boolean(document.getElementById('permUploadQ')?.checked),
    canPublishExam: Boolean(document.getElementById('permPublishExam')?.checked),
    canToggleResults: Boolean(document.getElementById('permToggleResults')?.checked),
    canViewAuditLogs: Boolean(document.getElementById('permViewAudit')?.checked)
  };
  await db.collection('settings').doc('subAdminPermissions').set({ map: subAdminPermissionsMap });
  document.getElementById('subAdminTargetPhone').value = '';
  showToast(`मोबाइल ${ph} के अधिकार अपडेट कर दिए गए।`);
}

async function removeSubAdminRole(ph) {
  if (!isSuperOwner()) return;
  delete subAdminPermissionsMap[ph];
  await db.collection('settings').doc('subAdminPermissions').set({ map: subAdminPermissionsMap });
  showToast("सह-प्रबंधक अधिकार हटा दिया गया।");
}

function applyCurrentUserRBACView() {
  if (isSuperOwner()) {
    renderAdminStudio('OWNER');
  } else if (currentUser && subAdminPermissionsMap[currentUser.phone]) {
    const p = subAdminPermissionsMap[currentUser.phone];
    const allowedList = [];
    if (p.canUploadQuestions) allowedList.push('canUploadQuestions');
    if (p.canPublishExam) allowedList.push('canPublishExam');
    if (p.canToggleResults) allowedList.push('canToggleResults');
    if (p.canViewAuditLogs) allowedList.push('canViewAuditLogs');
    currentUser.isEditor = true;
    renderAdminStudio('SUB_ADMIN', allowedList);
  } else {
    if (currentUser) currentUser.isEditor = false;
    renderAdminStudio('GUEST', []);
  }
  updateNavAuth();
}

function renderAdminStudio(userRole, customPermissions = []) {
  const isOwner = userRole === 'OWNER';
  const allowed = isOwner
    ? ['canManageAdmins', 'canPublishExam', 'canUploadQuestions', 'canToggleResults', 'canViewAuditLogs']
    : customPermissions;

  toggleElementVisibility('secManageAdmins', isOwner);
  toggleElementVisibility('secParikshaVisibilityController', isOwner || allowed.includes('canPublishExam') || allowed.includes('canToggleResults'));
  toggleElementVisibility('secPublishExam', isOwner || allowed.includes('canPublishExam') || allowed.includes('canToggleResults'));
  toggleElementVisibility('secUploadQuestions', isOwner || allowed.includes('canUploadQuestions'));
  toggleElementVisibility('secAuditLogs', isOwner || allowed.includes('canViewAuditLogs'));
  toggleElementVisibility('cleanOwnerExtendedSuite', isOwner);
}

function toggleElementVisibility(elementId, isVisible) {
  const el = document.getElementById(elementId);
  if (el) el.classList.toggle('hidden', !isVisible);
}

// 12. ENROLLMENT, ADMIT CARD PDF & PURE SEPARATED EXAM REPORTS
async function handleExamEnrollment(e) {
  e.preventDefault();
  const name = document.getElementById('enrollName').value.trim();
  const fatherName = document.getElementById('enrollFatherName').value.trim();
  const dob = document.getElementById('enrollDob').value;
  const phone = document.getElementById('enrollPhone').value.trim();
  const email = document.getElementById('enrollEmail').value.trim();
  const location = document.getElementById('enrollLocation').value.trim();

  if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया सही १० अंकों का फ़ोन नंबर भरें।");
  if (!name || !fatherName || !dob || !location) return showToast("कृपया सभी अनिवार्य प्रविष्टियाँ भरें।");

  try {
    const existingSnap = await db.collection('examEnrolledStudents').where('phone', '==', phone).limit(1).get();
    if (!existingSnap.empty) {
      const exData = existingSnap.docs[0].data();
      examState.rollNumber = exData.rollNumber || existingSnap.docs[0].id;
      lastEnrolledStudentObj = exData;
      localStorage.setItem('bishnoi_saved_roll', examState.rollNumber);
      localStorage.setItem('bishnoi_last_enrolled_obj', JSON.stringify(exData));
      alert(`आपका नामांकन पहले से पंजीकृत है।\n\nरोल नंबर: ${examState.rollNumber}`);
      return;
    }

    let rollNumber = '';
    let isUnique = false;
    while (!isUnique) {
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      rollNumber = `JAMBH-2026-${randomSuffix}`;
      const checkDoc = await db.collection('examEnrolledStudents').doc(rollNumber).get();
      if (!checkDoc.exists) isUnique = true;
    }

    const studentRecord = {
      rollNumber, name, fatherName, dob, phone,
      email: email || '-', location,
      enrolledAt: firebase.firestore.FieldValue.serverTimestamp(),
      timestamp: Date.now()
    };

    await db.collection('examEnrolledStudents').doc(rollNumber).set(studentRecord);
    examState.rollNumber = rollNumber;
    lastEnrolledStudentObj = studentRecord;
    localStorage.setItem('bishnoi_saved_roll', rollNumber);
    localStorage.setItem('bishnoi_last_enrolled_obj', JSON.stringify(studentRecord));

    alert(`आपका परीक्षा नामांकन सफलतापूर्वक संपन्न हुआ।\n\nरोल नंबर: ${rollNumber}\nआपका प्रवेश-पत्र डाउनलोड हो रहा है।`);
    downloadStudentAdmitCardPdf(studentRecord);
  } catch (err) {
    showToast("नामांकन त्रुटि: " + err.message);
  }
}

async function downloadStudentAdmitCardPdf(customObj) {
  let st = customObj || lastEnrolledStudentObj;
  if (!st) {
    const r = prompt("प्रवेश-पत्र डाउनलोड करने हेतु अपना रोल नंबर या पंजीकृत मोबाइल नंबर दर्ज करें:");
    if (!r) return;
    const clean = r.trim().toUpperCase();
    if (clean.startsWith('JAMBH')) {
      const d = await db.collection('examEnrolledStudents').doc(clean).get();
      if (d.exists) st = d.data();
    } else {
      const s = await db.collection('examEnrolledStudents').where('phone', '==', clean).limit(1).get();
      if (!s.empty) st = s.docs[0].data();
    }
    if (!st) return showToast("कोई नामांकन रिकॉर्ड नहीं मिला।");
    lastEnrolledStudentObj = st;
    localStorage.setItem('bishnoi_last_enrolled_obj', JSON.stringify(st));
  }

  if (!window.jspdf || !window.jspdf.jsPDF) return showToast("पीडीएफ इंजन लोड हो रहा है...");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setDrawColor(20, 54, 34);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, 190, 142);

  doc.setFontSize(15);
  doc.setTextColor(20, 54, 34);
  doc.text("BISHNOI SAMAJ DIGITAL PORTAL (bishnoism.vercel.app)", 105, 21, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(140, 59, 26);
  doc.text(customAdmitConfig.examTitle || "OFFICIAL EXAMINATION ADMIT CARD", 105, 29, { align: "center" });

  doc.autoTable({
    startY: 35,
    margin: { left: 16, right: 16 },
    theme: 'grid',
    head: [['Field', 'Candidate Information']],
    body: [
      ['Roll Number', st.rollNumber || '-'],
      ['Candidate Name', st.name || '-'],
      ['Father Name', st.fatherName || '-'],
      ['Date of Birth', st.dob || '-'],
      ['Registered Mobile', st.phone || '-'],
      ['District / State', st.location || '-'],
      ['Exam Date & Time', customAdmitConfig.examDateStr || 'As Announced'],
      ['Exam Mode / Center', customAdmitConfig.examCenterStr || 'Online Digital Hall']
    ],
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    headStyles: { fillColor: [20, 54, 34] }
  });

  doc.setFontSize(8.5);
  doc.setTextColor(20, 54, 34);
  doc.text(`VERIFICATION CODE: ${st.rollNumber} | HASH: ${btoa(st.rollNumber || '').substring(0, 10)}`, 16, 134);
  doc.setTextColor(90, 90, 90);
  doc.text(`Instructions: ${customAdmitConfig.instructionsStr}`, 16, 142);

  doc.save(`Admit_Card_${st.rollNumber}.pdf`);
  showToast("प्रवेश-पत्र डाउनलोड हो गया।");
}

function downloadEnrolledStudentsPdf() {
  db.collection('examEnrolledStudents').get().then(snap => {
    if (snap.empty) return showToast("अभी तक कोई नामांकित छात्र नहीं मिला।");
    let list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    let rows = list.map((s, i) => [
      i + 1, s.rollNumber || s.id, s.name || '', s.fatherName || '', s.dob || '', s.phone || '', s.email || '-', s.location || ''
    ]);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text("Jambhani Literature Examination - Enrolled Candidates Master List", 14, 15);
    doc.setFontSize(10);
    doc.text(`Total Enrolled: ${rows.length} | Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.autoTable({
      startY: 27,
      head: [['S.No', 'Roll Number', 'Candidate Name', 'Father Name', 'DOB', 'Phone', 'Email', 'Location']],
      body: rows,
      styles: { fontSize: 9 }
    });
    doc.save("Enrolled_Students_Master_List.pdf");
    showToast("नामांकित छात्रों की पीडीएफ डाउनलोड हो गई।");
  }).catch(err => showToast("त्रुटि: " + err.message));
}

// Pure Main Exam Merit PDF (Strictly separated from Mock & Daily Quiz)
async function downloadExamResultsMeritPdf() {
  try {
    let records = [];
    const snapMain = await db.collection('mainExamSubmissions').get();
    snapMain.forEach(d => records.push(d.data()));

    if (records.length === 0) {
      const snapFallback = await db.collection('examSubmissions').where('mode', '==', 'main_exam').get();
      snapFallback.forEach(d => records.push(d.data()));
    }

    if (!records.length) return showToast("मुख्य परीक्षा का कोई सबमिशन रिकॉर्ड उपलब्ध नहीं है।");
    records.sort((a, b) => (b.score || 0) - (a.score || 0));

    const rows = records.map((r, idx) => [
      idx + 1,
      r.rollNumber || '-',
      r.candidateName || '',
      r.fatherName || '-',
      `${r.score || 0} / ${r.total || 100}`,
      `${r.percentage || Math.round(((r.score || 0) / (r.total || 100)) * 100)}%`
    ]);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Jambhani Main Examination - Official Merit Result", 14, 15);
    doc.setFontSize(10);
    doc.text(`Total Main Exam Candidates: ${rows.length} | Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.autoTable({
      startY: 27,
      head: [['Rank', 'Roll Number', 'Candidate Name', 'Father Name', 'Marks', 'Percentage']],
      body: rows
    });
    doc.save("Main_Exam_Official_Merit_Result.pdf");
    showToast("मुख्य परीक्षा मेरिट पीडीएफ डाउनलोड हो गई।");
  } catch (e) {
    showToast("त्रुटि: " + e.message);
  }
}

function downloadQuizResultsPdf() {
  downloadExamResultsMeritPdf();
}

function download7DaysUsersPdf() {
  db.collection('users').get().then(snap => {
    if (snap.empty) return showToast("कोई पंजीकृत सदस्य नहीं मिला।");
    let rows = [];
    snap.forEach(d => {
      const u = d.data();
      rows.push([u.name || '', u.phone || d.id, u.email || '-', u.location || '-']);
    });
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Bishnoi Portal - Registered Members Report", 14, 18);
    doc.autoTable({ startY: 25, head: [['Name', 'Phone', 'Email', 'Location']], body: rows });
    doc.save("Bishnoi_Members_Report.pdf");
  }).catch(err => showToast("त्रुटि: " + err.message));
}

async function handleIndividualResultCheck(e) {
  e.preventDefault();
  const roll = document.getElementById('resCheckRoll').value.trim().toUpperCase();
  const name = document.getElementById('resCheckName').value.trim().toLowerCase();
  const dob = document.getElementById('resCheckDob').value;
  const resultBox = document.getElementById('studentPersonalResultDisplay');
  if (!resultBox) return;

  try {
    const enrolledDoc = await db.collection('examEnrolledStudents').doc(roll).get();
    if (!enrolledDoc.exists) return showToast("यह रोल नंबर रिकॉर्ड में नहीं मिला।");
    const studentData = enrolledDoc.data();
    if (studentData.dob !== dob || !studentData.name.toLowerCase().includes(name)) {
      return showToast("दर्ज किया गया नाम या जन्मतिथि रोल नंबर से मेल नहीं खाती।");
    }

    let subData = null;
    const mainSnap = await db.collection('mainExamSubmissions').where('rollNumber', '==', roll).limit(1).get();
    if (!mainSnap.empty) {
      subData = mainSnap.docs[0].data();
    } else {
      const fallbackSnap = await db.collection('examSubmissions').where('rollNumber', '==', roll).limit(1).get();
      if (!fallbackSnap.empty) subData = fallbackSnap.docs[0].data();
    }

    if (!subData) {
      resultBox.innerHTML = `<div class="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center text-xs text-stone-700 font-semibold">आपकी उत्तर-पुस्तिका प्राप्त नहीं हुई है अथवा परिणाम प्रक्रियाधीन है।</div>`;
      resultBox.classList.remove('hidden');
      return;
    }

    const score = subData.score || 0;
    const total = subData.total || 100;
    const percentage = Math.round((score / total) * 100);
    const safeName = studentData.name.replace(/'/g, "\\'");

    resultBox.innerHTML = `
      <div class="p-5 bg-[#FAF8F3] rounded-2xl border border-stone-300 shadow-sm space-y-3">
        <div class="flex justify-between items-center border-b border-stone-200 pb-2">
          <span class="font-yatra text-base text-forest">जाम्भाणी साहित्य परीक्षा - आधिकारिक अंकतालिका</span>
          <span class="px-2.5 py-0.5 rounded bg-emerald-100 text-forest font-bold text-xs">सत्यापित</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
          <div><b>परीक्षार्थी का नाम:</b> ${studentData.name}</div>
          <div><b>पिता का नाम:</b> ${studentData.fatherName}</div>
          <div><b>रोल नंबर:</b> ${roll}</div>
          <div><b>जन्मतिथि:</b> ${dob}</div>
          <div class="sm:col-span-2"><b>स्थान:</b> ${studentData.location}</div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
          <span class="font-bold text-xs text-stone-600">कुल प्राप्तांक:</span>
          <span class="text-xl font-extrabold text-forest">${score} / ${total} (${percentage}%)</span>
        </div>
        <button onclick="generateCertificate('${safeName}', ${percentage})" class="w-full py-2.5 bg-forest text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-950">
          डिजिटल प्रमाण-पत्र डाउनलोड करें
        </button>
      </div>
    `;
    resultBox.classList.remove('hidden');
  } catch (err) {
    showToast("परिणाम जाँच में त्रुटि: " + err.message);
  }
}

// 13. ZERO-LAG EXAM ENGINE (SINGLE-DOC READ, ENCRYPTED STORAGE, STRICT ANTI-CHEAT)
async function launchMainExamPortal() {
  if (parikshaVisibility.examScheduleTime && !isSuperOwner()) {
    const startMs = new Date(parikshaVisibility.examScheduleTime).getTime();
    const nowMs = getSyncedNow();
    const cutoffMins = customAdmitConfig.lateCutoffMins ?? 5;

    if (nowMs < startMs) {
      return showToast("परीक्षा अभी प्रारंभ नहीं हुई है। कृपया निर्धारित समय की प्रतीक्षा करें।");
    }
    if (cutoffMins > 0 && nowMs > startMs + (cutoffMins * 60 * 1000)) {
      return alert(`प्रवेश समय समाप्त!\n\nपरीक्षा प्रारंभ होने के ${cutoffMins} मिनट पश्चात परीक्षा कक्ष में प्रवेश की अनुमति नहीं है।`);
    }
  }

  let roll = examState.rollNumber;
  if (!roll || roll === 'GUEST') {
    const inputRoll = prompt("परीक्षा कक्ष में प्रवेश हेतु अपना रोल नंबर दर्ज करें (उदा: JAMBH-2026-12345):");
    if (!inputRoll) return;
    roll = inputRoll.trim().toUpperCase();
  }

  try {
    const rollDoc = await db.collection('examEnrolledStudents').doc(roll).get();
    if (!rollDoc.exists && !isSuperOwner()) {
      return showToast("अमान्य रोल नंबर। कृपया पहले नामांकन करें या सही रोल नंबर दर्ज करें।");
    }
    if (rollDoc.exists) examState.enrolledProfile = rollDoc.data();
    examState.rollNumber = roll;
    localStorage.setItem('bishnoi_saved_roll', roll);
    examState.activeMode = 'main_exam';
    markedForReviewSet.clear();

    // Single-Document Read First (Saves 99% Firestore Quota for 3,000+ students)
    const bundleDoc = await db.collection('examBundles').doc('main_exam').get();
    if (bundleDoc.exists && Array.isArray(bundleDoc.data().questions) && bundleDoc.data().questions.length > 0) {
      return startExamEngine(bundleDoc.data().questions, parikshaVisibility.examDuration || 120);
    }

    const snap = await db.collection('mainExamQuestions').get();
    let list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    if (!list.length) return showToast("मुख्य परीक्षा के प्रश्न अभी अपलोड या लाइव नहीं किए गए हैं।");
    startExamEngine(list, parikshaVisibility.examDuration || 120);
  } catch (e) {
    showToast("परीक्षा लोड करने में त्रुटि: " + e.message);
  }
}

async function startMockTestEngine(mockId) {
  const modeKey = `mock_${mockId}`;
  examState.activeMode = modeKey;
  markedForReviewSet.clear();
  try {
    const bundleDoc = await db.collection('examBundles').doc(modeKey).get();
    if (bundleDoc.exists && Array.isArray(bundleDoc.data().questions) && bundleDoc.data().questions.length > 0) {
      return startExamEngine(bundleDoc.data().questions, 60);
    }
    const snap = await db.collection(`mockExam_${mockId}`).get();
    let list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    if (!list.length) {
      list = [
        { id: 'm1_1', title: 'गुरु जम्भेश्वर भगवान द्वारा स्थापित विश्नोई समाज के कुल कितने नियम हैं?', options: ['21 नियम', '29 नियम', '36 नियम', '108 नियम'], ans: 1 },
        { id: 'm1_2', title: 'खेजड़ली में ३६३ पर्यावरण प्रेमियों का बलिदान किस वर्ष हुआ था?', options: ['1730 ईस्वी', '1485 ईस्वी', '1857 ईस्वी', '1947 ईस्वी'], ans: 0 },
        { id: 'm1_3', title: 'बिश्नोई पंथ की स्थापना किस पावन स्थल पर हुई?', options: ['पीपासर', 'समराथल धोरा', 'मुकाम', 'जांगलू'], ans: 1 }
      ];
    }
    startExamEngine(list, 60);
  } catch (e) {
    showToast("मॉक टेस्ट लोड नहीं हो सका।");
  }
}

function startQuizNow() {
  examState.activeMode = 'daily_quiz';
  markedForReviewSet.clear();
  startExamEngine(quizList, 15);
}

function startExamEngine(questionList, durationMinutes) {
  encryptedAnswerKeyMap = {};
  const sanitizedQuestions = (questionList || []).map((q, idx) => {
    const qId = q.id || `q_${idx}`;
    encryptedAnswerKeyMap[qId] = Number(q.ans ?? 0) ^ 79;
    const copy = { ...q, id: qId };
    delete copy.ans;
    return copy;
  });

  examState.questions = sanitizedQuestions;
  examState.timeRemainingSeconds = durationMinutes * 60;
  examState.currentIndex = 0;
  examState.tabSwitchCount = 0;
  examState.isExamRunning = true;

  const cacheKey = `encExam_${examState.activeMode}_${examState.rollNumber}`;
  examState.answers = decryptLocalData(localStorage.getItem(cacheKey));

  document.getElementById('examClosedNoticeBox')?.classList.add('hidden');
  document.getElementById('examEnrollmentBox')?.classList.add('hidden');
  document.getElementById('mockTestsHub')?.classList.add('hidden');
  document.getElementById('mainExamLaunchBox')?.classList.add('hidden');
  document.getElementById('examResultCheckDesk')?.classList.add('hidden');
  document.getElementById('quizIntroCard')?.classList.add('hidden');
  document.getElementById('quizActiveBox')?.classList.remove('hidden');

  const rollEl = document.getElementById('examCandidateRoll');
  if (rollEl) {
    rollEl.innerText = examState.activeMode === 'main_exam'
      ? `रोल नंबर: ${examState.rollNumber}`
      : `अभ्यास मोड (${examState.activeMode.toUpperCase()})`;
  }

  initExamSecurity();
  buildQuestionGridPills();
  renderQuestion(examState.currentIndex);

  if (examState.timerInterval) clearInterval(examState.timerInterval);
  examState.timerInterval = setInterval(() => {
    examState.timeRemainingSeconds--;
    updateTimerDisplay(examState.timeRemainingSeconds);
    if (examState.timeRemainingSeconds <= 0) {
      clearInterval(examState.timerInterval);
      submitFinalExam(false);
    }
  }, 1000);
}

function initExamSecurity() {
  if (examState.securityAttached) return;
  examState.securityAttached = true;

  document.addEventListener('visibilitychange', () => {
    if (!examState.isExamRunning) return;
    if (document.hidden) {
      examState.tabSwitchCount = (examState.tabSwitchCount || 0) + 1;
      alert(`सुरक्षा चेतावनी (${examState.tabSwitchCount}/3):\nपरीक्षा के दौरान स्क्रीन या टैब बदलना वर्जित है। ३ बार उल्लंघन होने पर उत्तर-पुस्तिका स्वतः जमा हो जाएगी।`);
      if (examState.tabSwitchCount >= 3) {
        submitFinalExam(true);
      }
    }
  });

  ['contextmenu', 'copy', 'cut', 'paste', 'selectstart', 'dragstart'].forEach(evtName => {
    document.addEventListener(evtName, e => {
      if (examState.isExamRunning) {
        e.preventDefault();
        return false;
      }
    });
  });
