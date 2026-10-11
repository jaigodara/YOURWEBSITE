/* ==========================================================================
   Bishnoi Community Portal - Ultimate Production Master Engine (script.js)
   Integrated Features:
   - Profile: Pure 2-box Spiritual Counter + Photo Upload + Details
   - Secure Exam & Mock Test Runtime Engine (1-by-1 Question Navigation, Jump Grid)
   - Unique Roll Number Generator (JAMBH-2026-XXXXX) & Enrollment Toggle
   - Delayed Result Publishing (No Leaderboard for Exam)
   - 7-Day Visitor Telemetry & Audit Logs (IP, Device, Location)
   - Granular RBAC Permissions for Sub-Admins in Owner Studio
   - Dynamic Amavasya Countdown, Auto-Panchang, PDF Exporter & Audio Player
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

// 2. OWNER & AI CREDENTIALS
const OWNER_PHONE = "9306894518";
const OWNER_PASS = "bishnoi29";
const DEFAULT_INTEGRATED_AI_KEY = "AQ.Ab8RN6LAySVquJ7wJYZ-Btp-LELOKKFIpsLHTooiv9L_4GEPLA";

// 3. GLOBAL APPLICATION STATE
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
let inactivityTimer = null;

// Samvad Manch, Editors, Drafts & Moderation State
let allChatPosts = [];
let activeReplyObj = null;
let blockedPhonesList = [];
let editorsPhoneList = [];
let scheduledItemsList = [];
let draftItemsList = [];

// Custom Audio Player State
let audioPlaylist = [
  { id: 'def_audio_1', title: 'श्री जम्भेश्वर भगवान आरती एवं भजन', link: './bhajan1.mp3' }
];
let currentTrackIndex = 0;
let isCustomPlaying = false;
let audioSpeeds = [1, 1.25, 1.5];
let currentSpeedIdx = 0;

// Page-by-Page Horizontal PDF Reader State
let activePdfDoc = null;
let currentPdfPage = 1;
let totalPdfPages = 1;
let isPdfLandscape = false;
let currentPdfUrl = '';
let touchStartX = 0;

// Custom Per-Section Soft Maintenance State + VIP Bypass
let maintenanceConfig = {
  globalMode: 'off',
  vipBypass: true,
  message: 'नए अपडेट जोड़े जा रहे हैं, जो शीघ्र ही उपलब्ध होंगे!',
  sections: { mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off' },
  customMessages: {
    quiz: '✨ नए ज्ञान परीक्षा प्रश्न जोड़े जा रहे हैं!',
    library: '📚 नई PDF पुस्तकें अपलोड हो रही हैं!',
    history: '📜 नए ऐतिहासिक तथ्य एवं कहानियाँ जोड़ी जा रही हैं!',
    niyams: '🌿 नियमों में नई व्याख्या जोड़ी जा रही है!',
    community: '💬 संवाद मंच अपडेट हो रहा है!',
    mala: '📿 जप माला अपडेट हो रही है!'
  }
};

// Progress & Mala State
let malaBeadCount = parseInt(localStorage.getItem('bishnoi_mala_beads') || '0');
let malaLapsCount = parseInt(localStorage.getItem('bishnoi_mala_laps') || '0');
let malaTotalCount = parseInt(localStorage.getItem('bishnoi_mala_total') || '0');
let readNiyamsSet = new Set(JSON.parse(localStorage.getItem('bishnoi_read_niyams') || '[]'));
let bestQuizPct = parseInt(localStorage.getItem('bishnoi_best_quiz_pct') || '0');

// Examination & Mock Test Runtime State
let examState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  timeRemainingSeconds: 0,
  timerInterval: null,
  tabSwitchCount: 0,
  activeMode: 'daily_quiz', // 'daily_quiz', 'mock_1', 'mock_2', 'main_exam'
  rollNumber: 'GUEST'
};

// 4. AUTHENTIC 29 NIYAMS DATA
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
    badge: '🦌 बाल कहानी १',
    title: 'नन्हे हिरण का सच्चा मित्र',
    content: 'एक बार थार के रेगिस्तान में एक नन्हा चिंकारा (हिरण का बच्चा) प्यास से भटक रहा था। तभी गाँव के बालक सोहन ने उसे देखा। सोहन ने दौड़कर अपने घर से छना हुआ ठंडा पानी पिलाया और अपनी माँ के साथ मिलकर उसकी देखभाल की। जब हिरण स्वस्थ हो गया, तो वह रोज़ आँगन में खेलने आने लगा।',
    moral: '🌟 सीख: मूक पशु-पक्षी हमारे परिवार की तरह हैं। घर के बाहर पक्षियों व जीवों के लिए पानी का परिंडा अवश्य रखें।'
  },
  {
    id: 'kids_2',
    type: 'kids',
    badge: '🌳 बाल कहानी २',
    title: 'अमृता देवी का साहस और खेजड़ी का पेड़',
    content: 'प्यारे बच्चों! जब राजा के सैनिक खेजड़ली गाँव में हरे पेड़ काटने आए, तो माता अमृता देवी ने डरने के बजाय पेड़ को अपनी बाहों में भर लिया और कहा कि जब तक हम जीवित हैं, पेड़ नहीं कटने देंगे। उनके साहस को देखकर राजा को भी क्षमा मांगनी पड़ी और पेड़ काटने पर हमेशा के लिए रोक लगा दी गई।',
    moral: '🌟 सीख: हमें अपने जन्मदिन पर कम से कम एक पौधा ज़रूर लगाना चाहिए और कभी भी हरी टहनी नहीं तोड़नी चाहिए।'
  }
];

// 5. ROLE HELPERS & INACTIVITY SESSION GUARD (20 MINS)
function isSuperOwner() {
  return Boolean(currentUser && (currentUser.isOwner === true || currentUser.phone === OWNER_PHONE));
}

function isEditorOrOwner() {
  if (!currentUser) return false;
  if (isSuperOwner()) return true;
  return Boolean(currentUser.isEditor === true || editorsPhoneList.includes(currentUser.phone));
}

function setupInactivitySessionGuard() {
  const resetTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (currentUser) {
      inactivityTimer = setTimeout(() => {
        logoutUser();
        showToast("🔒 सुरक्षा कारणों से २० मिनट की निष्क्रियता के बाद आपका सत्र लॉक कर दिया गया है।");
      }, 20 * 60 * 1000);
    }
  };
  ['click', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });
  resetTimer();
}

// 6. GLOBAL STYLES INJECTION
function injectCleanLayoutStyles() {
  let styleEl = document.getElementById('cleanPortalFixStyles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'cleanPortalFixStyles';
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `
    html, body {
      max-width: 100vw;
      overflow-x: hidden;
      padding-bottom: 84px !important;
      background-color: #FAF7EE !important;
    }
    header nav, #nav-home, #nav-niyams, #nav-mala, #nav-library, #nav-community, #nav-quiz, #nav-history, #nav-admin, #nav-admin-mobile {
      display: none !important;
    }
    .elevate-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease !important;
    }
    .elevate-card:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 12px 24px -8px rgba(20, 54, 34, 0.15) !important;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .bnav-item-active {
      color: #143622 !important;
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%) !important;
      border-color: #F59E0B !important;
      font-weight: 800 !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
    }
    .admin-subtab-active {
      background-color: #143622 !important;
      color: #ffffff !important;
      border-color: #143622 !important;
    }
  `;

  document.querySelectorAll('nav').forEach(n => {
    if (n.id !== 'standardMobileBottomNav') n.style.display = 'none';
  });
}

// 7. BOTTOM NAVIGATION BAR
function injectUnifiedBottomNavBar() {
  document.getElementById('standardMobileBottomNav')?.remove();
  const bottomNav = document.createElement('nav');
  bottomNav.id = 'standardMobileBottomNav';
  bottomNav.className = 'fixed bottom-0 left-0 right-0 z-[95] bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl px-3 py-1.5';
  bottomNav.innerHTML = `
    <div class="max-w-xl mx-auto grid grid-cols-5 gap-1.5">
      <button onclick="switchTab('home')" id="bnav-home" class="bnav-item-active flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-transparent text-[11px] text-stone-600 transition-all">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <span class="truncate">मुखपृष्ठ</span>
      </button>

      <button onclick="switchTab('library')" id="bnav-library" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition-all">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <span class="truncate">साहित्य</span>
      </button>

      <button onclick="switchTab('community')" id="bnav-community" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition-all">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg>
        <span class="truncate">संवाद</span>
      </button>

      <button onclick="switchTab('quiz')" id="bnav-quiz" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition-all">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        <span class="truncate">परीक्षा</span>
      </button>

      <button onclick="openProfileModal()" id="bnav-profile" class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition-all">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span id="bnavProfileLabel" class="truncate">प्रोफ़ाइल</span>
      </button>
    </div>
  `;
  document.body.appendChild(bottomNav);
}

// 8. SMART INSTANT SEARCH AUTOCOMPLETE
function setupSmartInstantSearch() {
  const searchInp = document.getElementById('globalSearchInput');
  if (!searchInp || document.getElementById('instantSearchDropdown')) return;

  const wrapper = searchInp.parentElement;
  wrapper.style.position = 'relative';

  const drop = document.createElement('div');
  drop.id = 'instantSearchDropdown';
  drop.className = 'hidden absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-stone-200 z-[999] max-h-64 overflow-y-auto divide-y divide-stone-100 text-xs';
  wrapper.appendChild(drop);

  searchInp.addEventListener('input', () => {
    const q = searchInp.value.toLowerCase().trim();
    if (!q) { drop.classList.add('hidden'); return; }

    let results = [];
    niyamsList.forEach(n => {
      if (`नियम ${n.num}`.includes(q) || n.title.toLowerCase().includes(q) || n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q)) {
        results.push({
          badge: `नियम ${n.num}`,
          title: `${n.title} — ${n.rule}`,
          action: () => { switchTab('niyams'); document.getElementById('niyamSearch').value = n.title; filterNiyams(); }
        });
      }
    });

    historyItemsList.forEach(h => {
      if (h.title.toLowerCase().includes(q) || h.content.toLowerCase().includes(q)) {
        results.push({
          badge: h.type === 'kids' ? 'बाल संस्कार' : 'इतिहास',
          title: h.title,
          action: () => { switchTab('history'); switchHistorySubTab(h.type === 'kids' ? 'kids' : 'full-history'); }
        });
      }
    });

    if ('सबदवाणी साहित्य ग्रंथ pdf'.includes(q)) {
      results.push({ badge: 'साहित्य', title: 'श्री सबदवाणी (१२० शब्द) एवं साहित्य कोष', action: () => switchTab('library') });
    }
    if ('जप माला मंत्र'.includes(q)) {
      results.push({ badge: 'साधना', title: 'डिजिटल जप माला (१०८ मनके)', action: () => switchTab('mala') });
    }
    if ('परीक्षा क्विज प्रश्न'.includes(q)) {
      results.push({ badge: 'परीक्षा', title: 'दैनिक ज्ञान परीक्षा एवं सम्मान-पत्र', action: () => switchTab('quiz') });
    }

    if (results.length === 0) {
      drop.innerHTML = `<div class="p-3 text-stone-400 text-center">कोई परिणाम नहीं मिला</div>`;
    } else {
      drop.innerHTML = results.slice(0, 6).map((r, idx) => `
        <button type="button" id="sres_item_${idx}" class="w-full text-left p-2.5 hover:bg-emerald-50 flex items-center justify-between gap-2 transition">
          <span class="font-semibold text-stone-800 truncate">${r.title}</span>
          <span class="px-2 py-0.5 rounded bg-emerald-100 text-forest font-bold text-[10px] shrink-0">${r.badge}</span>
        </button>
      `).join('');

      results.slice(0, 6).forEach((r, idx) => {
        document.getElementById(`sres_item_${idx}`)?.addEventListener('click', () => {
          r.action();
          drop.classList.add('hidden');
          searchInp.value = '';
        });
      });
    }
    drop.classList.remove('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) drop.classList.add('hidden');
  });
}

// 9. HOMEPAGE & AUDIO PLAYER UPGRADES
function upgradeHomepageAndAudioUI() {
  const homeTab = document.getElementById('tab-home');
  if (homeTab && !document.getElementById('cleanHeroLandingSection')) {
    const heroWrap = document.createElement('div');
    heroWrap.id = 'cleanHeroLandingSection';
    heroWrap.className = 'space-y-4 mb-5';
    heroWrap.innerHTML = `
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-3.5">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-extrabold text-white bg-[#143622] px-2.5 py-0.5 rounded-full">आधिकारिक पोर्टल</span>
            <h2 class="font-yatra text-base sm:text-lg text-forest">मुख्य अध्ययन एवं साधना केंद्र</h2>
          </div>
          <div class="flex items-center gap-2.5 text-xs font-semibold text-stone-600 bg-[#FAF7EE] px-3 py-1 rounded-xl border border-amber-300/60">
            <span>मंत्र जप: <strong id="progUserMantraCount" class="text-forest">${malaTotalCount}</strong></span>
            <span>•</span>
            <span>पूर्ण माला: <strong id="progUserMalaCount" class="text-emerald-700">${malaLapsCount}</strong></span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onclick="switchTab('niyams')" class="elevate-card p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-100/60 border border-amber-300 text-left flex items-start gap-3 shadow-sm">
            <div class="w-11 h-11 rounded-xl bg-[#143622] text-amber-300 flex items-center justify-center text-xl shrink-0 shadow">📜</div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">आचार संहिता</span>
              <h3 class="font-yatra text-base sm:text-lg text-forest mt-1">२९ नियम संहिता</h3>
              <p class="text-xs text-stone-600 mt-0.5">गुरु जम्भेश्वर भगवान के २९ नियमों का सरल हिंदी अर्थ पढ़ें।</p>
            </div>
          </button>

          <button onclick="switchTab('mala')" class="elevate-card p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 border border-emerald-300 text-left flex items-start gap-3 shadow-sm">
            <div class="w-11 h-11 rounded-xl bg-[#143622] text-emerald-300 flex items-center justify-center text-xl shrink-0 shadow">📿</div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded">दैनिक साधना</span>
              <h3 class="font-yatra text-base sm:text-lg text-forest mt-1">डिजिटल जप माला</h3>
              <p class="text-xs text-stone-600 mt-0.5">१०८ मनकों की डिजिटल माला के साथ ॐ विष्णवे नमः का जाप करें।</p>
            </div>
          </button>

          <button onclick="switchTab('history')" class="elevate-card p-4 rounded-2xl bg-gradient-to-br from-orange-50 via-white to-amber-50 border border-orange-300 text-left flex items-start gap-3 shadow-sm">
            <div class="w-11 h-11 rounded-xl bg-terracotta text-white flex items-center justify-center text-xl shrink-0 shadow">🌳</div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-orange-900 bg-orange-200/70 px-2 py-0.5 rounded">गौरवगाथा व संस्कार</span>
              <h3 class="font-yatra text-base sm:text-lg text-forest mt-1">इतिहास व बाल संस्कार</h3>
              <p class="text-xs text-stone-600 mt-0.5">खेजड़ली के ३६३ शहीदों का इतिहास एवं बच्चों की प्रेरक कहानियाँ।</p>
            </div>
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button onclick="switchTab('library')" class="elevate-card py-2.5 px-3 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 text-center"><span class="font-yatra text-xs sm:text-sm text-forest block">📚 सबदवाणी PDF</span></button>
          <button onclick="switchTab('quiz')" class="elevate-card py-2.5 px-3 rounded-xl bg-stone-50 hover:bg-amber-50 border border-stone-200 text-center"><span class="font-yatra text-xs sm:text-sm text-forest block">🏆 ज्ञान परीक्षा</span></button>
          <button onclick="switchTab('community')" class="elevate-card py-2.5 px-3 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 text-center"><span class="font-yatra text-xs sm:text-sm text-forest block">💬 संवाद ग्रुप</span></button>
          <button onclick="openFeedbackModal(false)" class="elevate-card py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-center"><span class="font-yatra text-xs sm:text-sm text-amber-900 block">⭐ सुझाव / फीडबैक</span></button>
        </div>
      </div>
    `;
    homeTab.insertBefore(heroWrap, homeTab.firstChild);
  }

  // Audio Box Customization
  const nativeAudio = document.getElementById('audioPlayer');
  const nativeSelect = document.getElementById('audioTrackSelect');
  if (nativeAudio && !document.getElementById('standardCustomMusicBox')) {
    const hostCard = nativeAudio.closest('div.bg-white') || nativeAudio.parentElement;
    nativeAudio.classList.add('hidden');
    if (nativeSelect) nativeSelect.classList.add('hidden');
    Array.from(hostCard.children).forEach(ch => { if (ch !== nativeAudio) ch.classList.add('hidden'); });

    hostCard.className = 'elevate-card bg-gradient-to-r from-[#143622] via-[#1b432c] to-[#143622] text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-amber-400/40';
    const musicUI = document.createElement('div');
    musicUI.id = 'standardCustomMusicBox';
    musicUI.className = 'space-y-3';
    musicUI.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2.5">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow-md">🎵</div>
          <div class="min-w-0">
            <span class="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">सबदवाणी, आरती एवं भजन स्ट्रीम</span>
            <h4 id="customNowPlayingTitle" class="font-yatra text-base sm:text-lg text-white truncate">श्री जम्भेश्वर आरती एवं भजन</h4>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <select id="customPlaylistDropdown" onchange="selectCustomTrackByIndex(this.value)" class="flex-1 sm:flex-initial p-2 rounded-xl bg-black/35 text-amber-200 border border-amber-400/40 text-xs font-bold max-w-full sm:max-w-[210px] truncate">
            <option value="0">1. श्री जम्भेश्वर आरती एवं भजन</option>
          </select>
          <button onclick="cycleCustomAudioSpeed()" id="customAudioSpeedBtn" class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 text-xs font-extrabold border border-amber-400/30">1x</button>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
        <div class="flex items-center justify-center gap-4 shrink-0">
          <button onclick="skipCustomTrack(-1)" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">⏮️</button>
          <button onclick="toggleCustomMusicPlay()" id="customPlayBtn" class="w-11 h-11 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg font-bold">▶</button>
          <button onclick="skipCustomTrack(1)" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">⏭️</button>
        </div>
        <div class="flex-1 flex items-center gap-2.5">
          <span id="customCurTime" class="text-xs font-mono text-amber-200 w-9 text-right">0:00</span>
          <input type="range" id="customSeekSlider" value="0" min="0" max="100" oninput="seekCustomMusic(this.value)" class="flex-1 h-2 bg-white/25 rounded-lg cursor-pointer accent-amber-400">
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

// 10. QUIZ LEADERBOARD PODIUM
function upgradeQuizLeaderboardToWidePodium() {
  const introCard = document.getElementById('quizIntroCard');
  if (!introCard || document.getElementById('widePodiumRestructured')) return;

  introCard.className = 'bg-gradient-to-br from-[#143622] via-[#19422a] to-[#0f291a] text-white p-5 sm:p-8 rounded-3xl shadow-2xl border-2 border-amber-400/40 space-y-5 relative overflow-hidden';

  introCard.innerHTML = `
    <span id="widePodiumRestructured" class="hidden"></span>
    <div class="text-center space-y-1">
      <span class="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
        दैनिक ज्ञान प्रतियोगिता
      </span>
      <h2 class="font-yatra text-2xl sm:text-3xl text-amber-300 drop-shadow pt-1">🏆 आज के शीर्ष प्रतिभागी</h2>
    </div>

    <div class="space-y-3 max-w-2xl mx-auto">
      <div class="bg-gradient-to-r from-amber-100 via-amber-200 to-yellow-100 text-stone-950 p-4 sm:p-5 rounded-2xl border-2 border-amber-400 shadow-xl flex items-center justify-between gap-3">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center text-2xl font-extrabold shrink-0 shadow">🥇</div>
          <div class="min-w-0 text-left">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-300/70 px-2 py-0.5 rounded">प्रथम स्थान (1st Rank)</span>
            <div id="winner1Name" class="font-extrabold text-base sm:text-xl text-[#143622] mt-0.5 break-words">—</div>
          </div>
        </div>
        <div id="winner1Score" class="px-3 py-1.5 rounded-xl bg-[#143622] text-amber-300 font-extrabold text-sm sm:text-base shrink-0">—</div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="bg-white/95 text-stone-900 p-3.5 rounded-2xl border border-slate-300 shadow flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="text-2xl shrink-0">🥈</span>
            <div class="min-w-0 text-left">
              <span class="text-[10px] font-bold text-stone-500 block">द्वितीय स्थान (2nd)</span>
              <div id="winner2Name" class="font-bold text-sm sm:text-base text-stone-800 break-words">—</div>
            </div>
          </div>
          <span id="winner2Score" class="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-bold text-xs shrink-0">—</span>
        </div>

        <div class="bg-orange-50/95 text-stone-900 p-3.5 rounded-2xl border border-orange-200 shadow flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="text-2xl shrink-0">🥉</span>
            <div class="min-w-0 text-left">
              <span class="text-[10px] font-bold text-orange-800 block">तृतीय स्थान (3rd)</span>
              <div id="winner3Name" class="font-bold text-sm sm:text-base text-stone-900 break-words">—</div>
            </div>
          </div>
          <span id="winner3Score" class="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-950 font-bold text-xs shrink-0">—</span>
        </div>
      </div>
    </div>

    <div class="pt-3 border-t border-white/15 text-center space-y-3">
      <p class="text-xs sm:text-sm text-emerald-100">समाज आचार संहिता, २९ नियम एवं इतिहास पर आधारित दैनिक ज्ञान परीक्षा में भाग लें और डिजिटल सम्मान-पत्र प्राप्त करें।</p>
      <button onclick="startQuizNow()" id="mainStartQuizBtn" class="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-lg transition transform active:scale-95">
        🎯 ज्ञान परीक्षा शुरू करें (Start Quiz)
      </button>

      <div id="softQuizComingSoonBanner" class="hidden p-4 rounded-2xl bg-amber-400/20 border border-amber-300 text-amber-200 text-center space-y-1">
        <div id="softQuizBannerHeading" class="font-yatra text-base sm:text-lg text-amber-300">✨ नए ज्ञान परीक्षा प्रश्न तैयार किए जा रहे हैं!</div>
        <p class="text-xs text-white/90">शीर्ष विजेता तालिका लाइव है। नए रोचक प्रश्न शीघ्र ही उपलब्ध होंगे।</p>
      </div>
    </div>
  `;
}

// 11. AUDIO PLAYER HELPERS
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
  if (player.paused) player.play().catch(() => {}); else player.pause();
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

function updateProgressIndicators() {
  const mTotal = document.getElementById('userTotalMantra');
  const mLaps = document.getElementById('userCompletedMala');
  const hmTotal = document.getElementById('progUserMantraCount');
  const hmLaps = document.getElementById('progUserMalaCount');
  if (mTotal) mTotal.innerText = malaTotalCount;
  if (mLaps) mLaps.innerText = malaLapsCount;
  if (hmTotal) hmTotal.innerText = malaTotalCount;
  if (hmLaps) hmLaps.innerText = malaLapsCount;
}

// 12. PER-SECTION MAINTENANCE & VIP BYPASS
function isPhoneOrInstalledApp() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isNarrowScreen = window.innerWidth <= 768;
  return isStandalone || isMobileUA || isNarrowScreen;
}

function isSectionSoftLocked(mode) {
  if (!mode || mode === 'off') return false;
  if (maintenanceConfig.vipBypass !== false && isEditorOrOwner()) return false;
  const onPhone = isPhoneOrInstalledApp();
  if (mode === 'both') return true;
  if (mode === 'phone_only' && onPhone) return true;
  if (mode === 'web_only' && !onPhone) return true;
  return false;
}

function listenMaintenanceConfig() {
  db.collection('settings').doc('maintenance').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      maintenanceConfig.globalMode = data.globalMode || 'off';
      maintenanceConfig.vipBypass = data.vipBypass !== false;
      maintenanceConfig.message = data.message || maintenanceConfig.message;
      maintenanceConfig.sections = Object.assign({
        mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off'
      }, data.sections || {});
      maintenanceConfig.customMessages = Object.assign(maintenanceConfig.customMessages, data.customMessages || {});

      const globalSel = document.getElementById('adminGlobalMaintMode');
      const msgInp = document.getElementById('adminMaintMessage');
      if (globalSel) globalSel.value = maintenanceConfig.globalMode;
      if (msgInp) msgInp.value = maintenanceConfig.message;

      ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
        const el = document.getElementById(`lock_${sec}`);
        if (el) el.value = maintenanceConfig.sections[sec] || 'off';
      });
    }
    applySoftMaintenanceBanners();
  });
}

function applySoftMaintenanceBanners() {
  document.getElementById('globalMaintenanceOverlay')?.remove();
  const quizLocked = isSectionSoftLocked(maintenanceConfig.sections.quiz) || isSectionSoftLocked(maintenanceConfig.globalMode);
  const softQuizBanner = document.getElementById('softQuizComingSoonBanner');
  const startQuizBtn = document.getElementById('mainStartQuizBtn');
  if (softQuizBanner) {
    softQuizBanner.classList.toggle('hidden', !quizLocked);
    const hEl = document.getElementById('softQuizBannerHeading');
    if (hEl) hEl.innerText = maintenanceConfig.customMessages.quiz || '✨ नए ज्ञान परीक्षा प्रश्न जोड़े जा रहे हैं!';
  }
  if (startQuizBtn) startQuizBtn.classList.toggle('hidden', quizLocked);

  ['history', 'library', 'niyams', 'community', 'mala'].forEach(sec => {
    const tabEl = document.getElementById(`tab-${sec}`);
    if (!tabEl) return;
    let banner = document.getElementById(`soft_banner_${sec}`);
    const locked = isSectionSoftLocked(maintenanceConfig.sections[sec]) || isSectionSoftLocked(maintenanceConfig.globalMode);

    if (locked) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = `soft_banner_${sec}`;
        banner.className = 'mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-100 to-emerald-50 border border-amber-300 text-forest flex items-center justify-between gap-3 shadow-sm';
        tabEl.insertBefore(banner, tabEl.firstChild);
      }
      banner.innerHTML = `
        <div>
          <h4 class="font-yatra text-sm sm:text-base text-forest">${maintenanceConfig.customMessages[sec] || maintenanceConfig.message}</h4>
          <p class="text-xs text-stone-600">${maintenanceConfig.message}</p>
        </div>
        <span class="px-2.5 py-1 bg-amber-400 text-stone-950 rounded-full text-[10px] font-extrabold shrink-0">अपडेट जारी</span>
      `;
      banner.classList.remove('hidden');
    } else if (banner) {
      banner.classList.add('hidden');
    }
  });
}

async function saveMaintenanceSettings() {
  if (!isSuperOwner()) return showToast("केवल मुख्य व्यवस्थापक (Owner) के लिए!");
  const globalMode = document.getElementById('adminGlobalMaintMode')?.value || 'off';
  const message = document.getElementById('adminMaintMessage')?.value.trim() || maintenanceConfig.message;
  const sections = {};
  ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
    sections[sec] = document.getElementById(`lock_${sec}`)?.value || 'off';
  });
  await db.collection('settings').doc('maintenance').set({
    globalMode, message, sections,
    vipBypass: true,
    customMessages: maintenanceConfig.customMessages
  }, { merge: true });
  showToast("✅ मेंटेनेंस सेटिंग्स लागू हो गईं!");
}

// 13. OWNER STUDIO & RBAC ROLE DISCOVERY
function checkEnrollmentStatus() {
  db.collection('examConfig').doc('settings').onSnapshot(doc => {
    const isEnabled = doc.exists && doc.data().enrollmentEnabled === true;
    const enrollBox = document.getElementById('examEnrollmentBox');
    if (enrollBox) {
      enrollBox.classList.toggle('hidden', !isEnabled);
    }
    const permEnrollChk = document.getElementById('permEnrollToggle');
    if (permEnrollChk) permEnrollChk.checked = isEnabled;
  });
}

async function handleExamEnrollment(e) {
  e.preventDefault();
  const name = document.getElementById('enrollName').value.trim();
  const phone = document.getElementById('enrollPhone').value.trim();
  const email = document.getElementById('enrollEmail').value.trim();
  const location = document.getElementById('enrollLocation').value.trim();

  if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया सही १० अंकों का फ़ोन नंबर भरें!");

  const studentDetails = { name, phone, email, location };
  const roll = await enrollStudentForExam(studentDetails);
  if (roll) {
    document.getElementById('enrollName').value = '';
    document.getElementById('enrollPhone').value = '';
    document.getElementById('enrollEmail').value = '';
    document.getElementById('enrollLocation').value = '';
  }
}

async function enrollStudentForExam(studentDetails) {
  try {
    const configSnap = await db.collection('examConfig').doc('settings').get();
    if (!configSnap.exists || !configSnap.data().enrollmentEnabled) {
      showToast("वर्तमान में परीक्षा नामांकन बंद है।");
      return null;
    }

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const rollNumber = `JAMBH-2026-${randomSuffix}`;

    const studentRecord = {
      ...studentDetails,
      rollNumber: rollNumber,
      enrolledAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('examEnrolledStudents').doc(rollNumber).set(studentRecord);
    alert(`🎉 नामांकन सफल!\nआपका रोल नंबर है: ${rollNumber}\n(कृपया इसे संभाल कर रखें)`);
    examState.rollNumber = rollNumber;
    return rollNumber;
  } catch (err) {
    showToast("नामांकन त्रुटि: " + err.message);
    return null;
  }
}

// RBAC Permissions Logic
const ROLE_PERMISSIONS = {
  OWNER: ['canManageAdmins', 'canPublishExam', 'canUploadQuestions', 'canToggleEnrollment', 'canViewAuditLogs'],
  MODERATOR: ['canUploadQuestions']
};

function renderAdminStudio(userRole, customPermissions = []) {
  const allowed = userRole === 'OWNER' ? ROLE_PERMISSIONS.OWNER : customPermissions;
  toggleElementVisibility('secManageAdmins', allowed.includes('canManageAdmins'));
  toggleElementVisibility('secPublishExam', allowed.includes('canPublishExam'));
  toggleElementVisibility('secUploadQuestions', allowed.includes('canUploadQuestions'));
  toggleElementVisibility('secEnrollmentToggle', allowed.includes('canToggleEnrollment'));
  toggleElementVisibility('secAuditLogs', allowed.includes('canViewAuditLogs'));
}

function toggleElementVisibility(elementId, isVisible) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (isVisible) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// 14. EXAM SCHEDULER & ZERO-LAG LOCAL STORAGE ENGINE
function initExamSecurity() {
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('copy', e => e.preventDefault());
  document.addEventListener('cut', e => e.preventDefault());

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && document.getElementById('quizActiveBox') && !document.getElementById('quizActiveBox').classList.contains('hidden')) {
      examState.tabSwitchCount++;
      alert(`⚠️ चेतावनी: आपने स्क्रीन या टैब बदली है! (चेतावनी: ${examState.tabSwitchCount}/3)`);
      if (examState.tabSwitchCount >= 3) {
        submitFinalExam(true);
      }
    }
  });
}

function startMockTestEngine(mockId) {
  examState.activeMode = `mock_${mockId}`;
  db.collection(`mockExam_${mockId}`).get().then(snap => {
    let list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    if (!list.length) {
      list = [
        { id: 'm1_1', title: 'विश्नोई समाज के कितने नियम हैं?', options: ['21', '29', '36', '108'], ans: 1 },
        { id: 'm1_2', title: 'खेजड़ली बलिदान किस वर्ष हुआ?', options: ['1730 ईस्वी', '1485 ईस्वी', '1857 ईस्वी', '1947 ईस्वी'], ans: 0 }
      ];
    }
    startExamEngine(list, 60);
  }).catch(() => {
    showToast("मॉक टेस्ट लोड नहीं हो सका।");
  });
}

function startExamEngine(questionList, durationMinutes) {
  examState.questions = questionList;
  examState.timeRemainingSeconds = durationMinutes * 60;
  examState.currentIndex = 0;
  examState.answers = JSON.parse(localStorage.getItem('cachedExamAnswers') || '{}');

  document.getElementById('mockTestsHub')?.classList.add('hidden');
  document.getElementById('quizIntroCard')?.classList.add('hidden');
  document.getElementById('quizActiveBox')?.classList.remove('hidden');

  const rollEl = document.getElementById('examCandidateRoll');
  if (rollEl) rollEl.innerText = `रोल: ${examState.rollNumber}`;

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

function buildQuestionGridPills() {
  const gridContainer = document.getElementById('questionGridPills');
  if (!gridContainer) return;
  gridContainer.innerHTML = '';
  examState.questions.forEach((q, idx) => {
    const pill = document.createElement('button');
    pill.id = `q_pill_${idx}`;
    pill.className = `w-8 h-8 rounded-lg text-xs font-bold border transition ${examState.answers[q.id] !== undefined ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-stone-700 border-stone-300'}`;
    pill.innerText = idx + 1;
    pill.onclick = () => jumpToQuestion(idx);
    gridContainer.appendChild(pill);
  });
}

function renderQuestion(index) {
  if (!examState.questions[index]) return;
  const q = examState.questions[index];
  const container = document.getElementById('examQuestionArea');
  if (!container) return;

  const currentSelection = examState.answers[q.id];

  container.innerHTML = `
    <div class="p-4 bg-white rounded-xl shadow-sm border border-stone-200">
      <div class="flex justify-between items-center mb-3">
        <span class="font-bold text-forest text-sm">प्रश्न क्रमांक: ${index + 1} / ${examState.questions.length}</span>
        <span class="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">अंक: 1</span>
      </div>
      <p class="text-base font-semibold text-stone-800 mb-4 leading-relaxed">${q.title || q.q}</p>
      <div class="space-y-2">
        ${(q.options || q.opts || []).map((opt, i) => `
          <label class="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-stone-50 transition ${currentSelection === i ? 'bg-amber-50 border-amber-400' : 'border-stone-200'}">
            <input type="radio" name="currentExamRadio" value="${i}" 
              ${currentSelection === i ? 'checked' : ''} 
              onchange="saveExamAnswer('${q.id}', ${i}, ${index})" class="accent-forest w-4 h-4 mr-3">
            <span class="text-xs sm:text-sm text-stone-800 font-medium">${opt}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

function saveExamAnswer(questionId, selectedOption, index) {
  examState.answers[questionId] = selectedOption;
  localStorage.setItem('cachedExamAnswers', JSON.stringify(examState.answers));
  const pill = document.getElementById(`q_pill_${index}`);
  if (pill) {
    pill.className = "w-8 h-8 rounded-lg text-xs font-bold border transition bg-emerald-600 text-white border-emerald-700";
  }
}

function navigateExam(direction) {
  const newIndex = examState.currentIndex + direction;
  if (newIndex >= 0 && newIndex < examState.questions.length) {
    examState.currentIndex = newIndex;
    renderQuestion(examState.currentIndex);
  }
}

function jumpToQuestion(targetIndex) {
  if (targetIndex >= 0 && targetIndex < examState.questions.length) {
    examState.currentIndex = targetIndex;
    renderQuestion(examState.currentIndex);
  }
}

function updateTimerDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const el = document.getElementById('examTimerClock');
  if (el) el.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function submitFinalExam(isForced = false) {
  clearInterval(examState.timerInterval);
  const user = firebase.auth().currentUser;
  
  // Single DB write to ensure zero lag for 3000 students
  const payload = {
    userId: user ? user.uid : (currentUser ? currentUser.phone : 'Guest'),
    rollNumber: examState.rollNumber,
    candidateName: currentUser ? currentUser.name : 'छात्र',
    answers: examState.answers,
    mode: examState.activeMode,
    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
    isForcedSubmission: isForced,
    isPublished: false // Strict delayed result workflow
  };

  try {
    await db.collection('examSubmissions').add(payload);
    localStorage.removeItem('cachedExamAnswers');
    
    document.getElementById('quizActiveBox').innerHTML = `
      <div class="text-center p-8 bg-green-50 rounded-2xl border border-green-200 space-y-3">
        <div class="text-4xl">📜</div>
        <h3 class="text-xl font-bold text-forest">उत्तर-पुस्तिका सफलतापूर्वक जमा हो गई है</h3>
        <p class="text-xs sm:text-sm text-stone-600">आपके सभी उत्तर सुरक्षित सहेज लिए गए हैं।</p>
        <div class="p-3 bg-white rounded-xl border border-green-300 text-xs font-semibold text-green-900">
          परिणाम (Result) की आधिकारिक घोषणा निर्धारित तिथि पर की जाएगी।
        </div>
        <button onclick="switchTab('home')" class="px-5 py-2 bg-forest text-white rounded-xl text-xs font-bold shadow">
          मुखपृष्ठ पर लौटें
        </button>
      </div>
    `;
  } catch (err) {
    showToast("सबमिशन त्रुटि: " + err.message);
  }
}

// 15. DRAFT & LIVE EXAM CONTROLS (OWNER STUDIO)
async function saveExamAsDraft() {
  if (!isEditorOrOwner()) return showToast("अनुमति नहीं है!");
  const target = document.getElementById('adminQuestionTarget')?.value || 'main_exam';
  const raw = document.getElementById('adminBulkQuizText')?.value.trim();
  if (!raw) return showToast("प्रश्न दर्ज करें!");

  await db.collection('examDrafts').doc(target).set({
    rawQuestions: raw,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast("✅ प्रश्न सफलतापूर्वक ड्राफ्ट में सुरक्षित हो गए!");
}

async function publishMainExamLive() {
  if (!isSuperOwner()) return showToast("केवल मुख्य व्यवस्थापक (Owner) के पास अधिकार है!");
  openConfirmModal("मुख्य परीक्षा लाइव करें?", "क्या आप मुख्य परीक्षा को सभी विद्यार्थियों के लिए लाइव करना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('examConfig').doc('liveStatus').set({
        isLive: true,
        startedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("🚀 मुख्य परीक्षा लाइव कर दी गई है!");
    }
  });
}

async function publishExamResultsOfficially() {
  if (!isSuperOwner()) return showToast("केवल मुख्य व्यवस्थापक (Owner) के पास अधिकार है!");
  openConfirmModal("परिणाम घोषित करें?", "क्या आप सभी परीक्षार्थियों के परिणाम सार्वजनिक करना चाहते हैं?", async (res) => {
    if (res) {
      const snap = await db.collection('examSubmissions').where('isPublished', '==', false).get();
      const batch = db.batch();
      snap.forEach(doc => {
        batch.update(doc.ref, { isPublished: true });
      });
      await batch.commit();
      showToast("📢 सभी परीक्षा परिणाम आधिकारिक रूप से घोषित कर दिए गए!");
    }
  });
}

// 16. 7-DAY AUDIT & VISITOR TELEMETRY TRACKER
async function trackUserLoginTelemetry(userData) {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const geo = await res.json();
    
    const ua = navigator.userAgent;
    let deviceCategory = "Laptop / Desktop";
    if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase())) {
      deviceCategory = /ipad|tablet/i.test(ua.toLowerCase()) ? "Tablet" : "Mobile Phone";
    }

    const auditEntry = {
      name: userData.name || 'Anonymous',
      phone: userData.phone || '-',
      email: userData.email || '-',
      statedLocation: userData.location || '-',
      detectedCity: geo.city || 'Unknown',
      detectedRegion: geo.region || 'Unknown',
      detectedCountry: geo.country_name || 'Unknown',
      ip: geo.ip || 'Unknown',
      network: geo.org || 'Unknown',
      deviceType: deviceCategory,
      timestamp: Date.now(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('userAccessLogs').add(auditEntry);
  } catch (err) {
    console.error("Telemetry failed:", err);
  }
}

async function refreshAuditLogs() {
  const tbody = document.getElementById('auditTableBody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-stone-400">लॉग्स लोड हो रहे हैं...</td></tr>`;

  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  try {
    const snap = await db.collection('userAccessLogs')
      .where('timestamp', '>=', sevenDaysAgo)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-stone-400">विगत ७ दिनों में कोई लॉग उपलब्ध नहीं है।</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const timeStr = d.createdAt ? d.createdAt.toDate().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
      tbody.innerHTML += `
        <tr class="hover:bg-stone-50 border-b border-stone-100">
          <td class="p-2.5 font-bold text-forest">${d.name}<br><span class="text-[10px] text-stone-400 font-normal">${d.phone}</span></td>
          <td class="p-2.5 text-stone-600">${d.email}</td>
          <td class="p-2.5 font-mono text-stone-700">${d.ip}</td>
          <td class="p-2.5 font-semibold text-stone-800">${d.deviceType}</td>
          <td class="p-2.5 text-stone-600">${d.detectedCity}, ${d.detectedRegion}</td>
          <td class="p-2.5 text-stone-400 text-[10px]">${timeStr}</td>
        </tr>
      `;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-rose-500">लॉग्स लोड करने में त्रुटि: ${e.message}</td></tr>`;
  }
}

// 17. INITIALIZATION & DATA SUBSCRIPTIONS
window.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('gemini_user_api_key')) {
    localStorage.setItem('gemini_user_api_key', DEFAULT_INTEGRATED_AI_KEY);
  }
  injectCleanLayoutStyles();
  upgradeHomepageAndAudioUI();
  upgradeQuizLeaderboardToWidePodium();
  injectUnifiedBottomNavBar();
  setupSmartInstantSearch();
  setupInactivitySessionGuard();
  setupOneTimeExitFeedbackPrompt();

  syncUserAutoRoleFromDB();
  listenTrustedEditors();
  listenDraftQueue();
  listenFeedbacksForAdmin();
  updateNavAuth();
  listenMaintenanceConfig();
  listenScheduledContent();
  listenCustomNiyams();
  listenHistoryAndKids();
  listenBanner();
  listenPdfs();
  listenBlockedUsers();
  listenPosts();
  listenPinnedChat();
  loadQuiz();
  listenTreeCounter();
  listenWinners();
  listenNotices();
  listenAudios();
  computeAutoPanchang();
  listenAmavasyaConfig();
  checkEnrollmentStatus();
  renderMalaCounters();
  updateProgressIndicators();

  // Visitor logging
  if (!sessionStorage.getItem('visitor_logged_session')) {
    sessionStorage.setItem('visitor_logged_session', 'true');
    trackUserLoginTelemetry(currentUser || { name: 'Visitor' });
  }
});

async function syncUserAutoRoleFromDB() {
  if (!currentUser || !currentUser.phone) {
    renderAdminStudio('GUEST');
    return;
  }
  try {
    const [uDoc, edDoc] = await Promise.all([
      db.collection('users').doc(currentUser.phone).get(),
      db.collection('settings').doc('editorRoles').get()
    ]);
    const edList = (edDoc.exists && Array.isArray(edDoc.data().phones)) ? edDoc.data().phones : [];
    editorsPhoneList = edList;

    if (uDoc.exists) {
      const d = uDoc.data();
      currentUser.name = d.name || currentUser.name;
      currentUser.location = d.location || currentUser.location || '';
      currentUser.email = d.email || currentUser.email || '';
      currentUser.photo = d.photo || currentUser.photo || '';
    }
    currentUser.isOwner = (currentUser.phone === OWNER_PHONE);
    currentUser.isEditor = currentUser.isOwner || edList.includes(currentUser.phone);
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();

    if (currentUser.isOwner) {
      renderAdminStudio('OWNER');
    } else if (currentUser.isEditor) {
      renderAdminStudio('MODERATOR', ['canUploadQuestions']);
    } else {
      renderAdminStudio('MEMBER');
    }
  } catch (e) {
    renderAdminStudio('MEMBER');
  }
}

function switchTab(id) {
  if (id === 'admin' && !isEditorOrOwner()) {
    return showToast("यह अनुभाग केवल व्यवस्थापक एवं अधिकृत संपादक के लिए है।");
  }
  currentActiveTab = id;
  ['home', 'mala', 'niyams', 'library', 'community', 'quiz', 'history', 'admin'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const bnav = document.getElementById(`bnav-${t}`);
    if (el) el.classList.add('hidden');
    if (bnav) bnav.classList.remove('bnav-item-active');
  });

  const target = document.getElementById(`tab-${id}`);
  const activeBnav = document.getElementById(
    (id === 'niyams' || id === 'mala' || id === 'history') ? 'bnav-home' : (id === 'admin' ? 'bnav-profile' : `bnav-${id}`)
  );
  if (target) {
    target.classList.remove('hidden');
  }
  if (activeBnav) activeBnav.classList.add('bnav-item-active');

  if (id === 'admin' && isEditorOrOwner()) {
    refreshOwnerAnalytics();
    refreshAuditLogs();
  }

  applySoftMaintenanceBanners();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchHistorySubTab(sub) {
  const histView = document.getElementById('historySubView');
  const kidsView = document.getElementById('kidsSubView');
  const histBtn = document.getElementById('sub-history-btn');
  const kidsBtn = document.getElementById('sub-kids-btn');

  if (sub === 'full-history') {
    histView.classList.remove('hidden'); kidsView.classList.add('hidden');
    histBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
    kidsBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600 hover:text-forest";
  } else {
    histView.classList.add('hidden'); kidsView.classList.remove('hidden');
    kidsBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
    histBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600 hover:text-forest";
  }
}

// 18. TOAST NOTIFICATION & CONFIRM MODALS
function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  document.getElementById('toastMsg').innerText = msg;
  toast.classList.remove('-translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('-translate-y-20', 'opacity-0');
  }, 3000);
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

// 19. AUTHENTICATION & PROFILE HANDLERS
function openAuthModal() { document.getElementById('authModal').classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('authModal').classList.add('hidden'); }

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
  const nameInput = document.getElementById('loginName')?.value.trim() || '';

  if (phone === OWNER_PHONE && pass === OWNER_PASS) {
    let ownerName = "व्यवस्थापक (Owner)";
    let ownerLoc = "";
    let ownerEmail = "";
    let ownerPhoto = "";
    try {
      const oDoc = await db.collection('users').doc(OWNER_PHONE).get();
      if (oDoc.exists) {
        ownerName = oDoc.data().name || ownerName;
        ownerLoc = oDoc.data().location || "";
        ownerEmail = oDoc.data().email || "";
        ownerPhoto = oDoc.data().photo || "";
      }
    } catch (err) {}

    currentUser = { name: ownerName, phone: OWNER_PHONE, isOwner: true, isEditor: true, location: ownerLoc, email: ownerEmail, photo: ownerPhoto };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    renderAdminStudio('OWNER');
    closeAuthModal();
    showToast(`🛡️ मुख्य व्यवस्थापक के रूप में स्वागत है, ${currentUser.name}!`);
    trackUserLoginTelemetry(currentUser);
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return showToast("कृपया सही १० अंकों का भारतीय मोबाइल नंबर दर्ज करें!");
  }

  const isTrustedEditor = editorsPhoneList.includes(phone);

  if (isRegisterMode) {
    if (!nameInput) return showToast("कृपया अपना पूरा नाम दर्ज करें!");
    try {
      const userDoc = await db.collection('users').doc(phone).get();
      if (userDoc.exists) return showToast("यह नंबर पहले से पंजीकृत है! कृपया लॉगिन करें।");

      await db.collection('users').doc(phone).set({
        name: nameInput, phone, pass, email: "", location: "",
        registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      currentUser = { name: nameInput, phone, isOwner: false, isEditor: isTrustedEditor, email: "", location: "" };
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      updateNavAuth();
      closeAuthModal();
      showToast(`पंजीकरण सफल! स्वागत है, ${currentUser.name}`);
      trackUserLoginTelemetry(currentUser);
    } catch (err) {
      showToast("त्रुटि: " + err.message);
    }
    return;
  }

  try {
    const userDoc = await db.collection('users').doc(phone).get();
    if (!userDoc.exists) return showToast("यह नंबर पंजीकृत नहीं है! कृपया पहले Register करें।");
    const userData = userDoc.data();
    if (userData.pass && userData.pass !== pass) return showToast("गलत पासवर्ड!");

    await db.collection('users').doc(phone).update({ lastLogin: firebase.firestore.FieldValue.serverTimestamp() });

    currentUser = {
      name: userData.name || "सदस्य",
      phone,
      isOwner: (phone === OWNER_PHONE && pass === OWNER_PASS),
      isEditor: isTrustedEditor,
      email: userData.email || "",
      location: userData.location || "",
      photo: userData.photo || ""
    };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    closeAuthModal();
    showToast(isTrustedEditor ? `✍️ संपादक (Editor) के रूप में स्वागत है, ${currentUser.name}!` : `स्वागत है, ${currentUser.name}!`);
    trackUserLoginTelemetry(currentUser);
  } catch (err) {
    showToast("लॉगिन त्रुटि: " + err.message);
  }
}

function logoutUser() {
  localStorage.removeItem('bishnoi_secure_user');
  currentUser = null;
  updateNavAuth();
  renderAdminStudio('GUEST');
  switchTab('home');
  showToast("सफलतापूर्वक लॉगआउट किया गया।");
}

function updateNavAuth() {
  const container = document.getElementById('authActionsContainer');
  const postPrompt = document.getElementById('postAuthPrompt');
  const postEditor = document.getElementById('postEditor');
  const bnavProfLbl = document.getElementById('bnavProfileLabel');

  if (container) {
    if (currentUser) {
      const badgeIcon = isSuperOwner() ? '🛡️' : (isEditorOrOwner() ? '✍️' : '👤');
      container.innerHTML = `
        <button onclick="openProfileModal()" class="text-xs font-bold text-forest bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 truncate max-w-[160px] shadow-sm">
          ${badgeIcon} ${currentUser.name}
        </button>
      `;
    } else {
      container.innerHTML = `
        <button onclick="openAuthModal()" class="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold shadow-sm">
          लॉगिन करें
        </button>
      `;
    }
  }

  if (bnavProfLbl) {
    bnavProfLbl.innerText = currentUser ? (isEditorOrOwner() ? 'स्टूडियो' : 'प्रोफ़ाइल') : 'लॉगिन';
  }

  if (currentUser) {
    if (postPrompt) postPrompt.classList.add('hidden');
    if (postEditor) postEditor.classList.remove('hidden');
  } else {
    if (postPrompt) postPrompt.classList.remove('hidden');
    if (postEditor) postEditor.classList.add('hidden');
  }
}

// 20. DIGITAL MALA LOGIC
function updateMantraName() {
  const selected = document.getElementById('malaMantraSelect')?.value;
  if (selected) document.getElementById('activeMantraDisplay').innerText = selected;
}

function tapMalaBead() {
  const isVibe = document.getElementById('vibrationToggle')?.checked;
  if (isVibe && navigator.vibrate) navigator.vibrate(35);
  malaBeadCount++;
  malaTotalCount++;
  if (malaBeadCount >= 108) {
    malaBeadCount = 0;
    malaLapsCount++;
    if (isVibe && navigator.vibrate) navigator.vibrate([80, 50, 100]);
    showToast("ॐ शांति! एक संपूर्ण माला (१०८ जप) पूर्ण हुई!");
  }
  localStorage.setItem('bishnoi_mala_beads', malaBeadCount.toString());
  localStorage.setItem('bishnoi_mala_laps', malaLapsCount.toString());
  localStorage.setItem('bishnoi_mala_total', malaTotalCount.toString());
  renderMalaCounters();
  updateProgressIndicators();
}

function renderMalaCounters() {
  const b = document.getElementById('currentBeadDisplay');
  const l = document.getElementById('malaLapsDisplay');
  const t = document.getElementById('malaTotalDisplay');
  if (b) b.innerText = malaBeadCount;
  if (l) l.innerText = malaLapsCount;
  if (t) t.innerText = malaTotalCount;
}

function resetMalaCounter() {
  openConfirmModal("माला शून्य करें?", "क्या आप जप माला काउंटर रीसेट करना चाहते हैं?", (res) => {
    if (res) {
      malaBeadCount = 0; malaLapsCount = 0; malaTotalCount = 0;
      localStorage.setItem('bishnoi_mala_beads', '0');
      localStorage.setItem('bishnoi_mala_laps', '0');
      localStorage.setItem('bishnoi_mala_total', '0');
      renderMalaCounters();
      updateProgressIndicators();
      showToast("जप माला रीसेट हो गई।");
    }
  });
}

// 21. PANCHANG & DYNAMIC AMAVASYA
function computeAutoPanchang() {
  const now = new Date();
  const vaars = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
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

  const dEl = document.getElementById('autoPanchangDate');
  const dtEl = document.getElementById('autoPanchangDetails');
  if (dEl) dEl.innerText = `${vaars[now.getDay()]} • विक्रम संवत ${samvat}`;
  if (dtEl) dtEl.innerText = `आज: ${now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })} | ${paksha}, ${tithiName}`;

  const daysUntilNextAmavasya = synodic - moonAge;
  const autoNextAmavasya = new Date(now.getTime() + daysUntilNextAmavasya * 24 * 60 * 60 * 1000);
  if (!amavasyaTargetDate || amavasyaTargetDate.getTime() < now.getTime()) {
    amavasyaTargetDate = autoNextAmavasya;
    startAmavasyaTimer();
  }
}

function listenAmavasyaConfig() {
  db.collection('settings').doc('amavasyaConfig').onSnapshot(doc => {
    if (doc.exists) {
      const cfg = doc.data();
      if (cfg.name && document.getElementById('amavasyaTitleDisplay')) {
        document.getElementById('amavasyaTitleDisplay').innerText = cfg.name;
      }
      if (cfg.desc && document.getElementById('amavasyaFastingNote')) {
        document.getElementById('amavasyaFastingNote').innerText = cfg.desc;
      }
      if (cfg.date) {
        const parsed = new Date(cfg.date + "T00:00:00");
        if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now() - 86400000) {
          amavasyaTargetDate = parsed;
        }
      }
    }
    startAmavasyaTimer();
  });
}

function startAmavasyaTimer() {
  if (amavasyaTimerInterval) clearInterval(amavasyaTimerInterval);
  function update() {
    if (!amavasyaTargetDate) return;
    const now = new Date();
    const diff = amavasyaTargetDate.getTime() - now.getTime();
    const box = document.getElementById('amavasyaCountdownBox');
    if (!box) return;

    const isToday = (
      now.getFullYear() === amavasyaTargetDate.getFullYear() &&
      now.getMonth() === amavasyaTargetDate.getMonth() &&
      now.getDate() === amavasyaTargetDate.getDate()
    );

    if (isToday) {
      box.className = "text-xs font-extrabold text-emerald-950 bg-amber-300 p-2.5 rounded-xl border border-amber-500 text-center";
      box.innerHTML = "🚩 आज पावन अमावस्या व्रत एवं हवन दिवस है!";
      return;
    }

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      box.className = "text-xs font-bold text-terracotta bg-white/95 p-2.5 rounded-xl border border-emerald-200 shadow-sm";
      box.innerHTML = `⏳ समय शेष: <b>${days} दिन : ${hours} घं : ${mins} मि : ${secs} से</b>`;
    } else {
      computeAutoPanchang();
    }
  }
  update();
  amavasyaTimerInterval = setInterval(update, 1000);
}

async function saveAmavasyaConfig() {
  if (!isEditorOrOwner()) return;
  const name = document.getElementById('adminAmavasyaName').value.trim();
  const date = document.getElementById('adminAmavasyaDate').value;
  const desc = document.getElementById('adminAmavasyaDesc').value.trim();
  if (!date) return showToast('तारीख चुनें');
  await db.collection('settings').doc('amavasyaConfig').set({ name: name || "पावन अमावस्या", date, desc: desc || "उपवास एवं हवन" });
  showToast('अमावस्या तिथि सहेजी गई!');
}

// 22. AI INTEGRATION
function getGeminiKey() {
  return localStorage.getItem('gemini_user_api_key') || DEFAULT_INTEGRATED_AI_KEY;
}

function resetGeminiKey() {
  const k = prompt("अपनी AI API Key यहाँ देखें या बदलें:", getGeminiKey());
  if (k !== null && k.trim()) {
    localStorage.setItem('gemini_user_api_key', k.trim());
    showToast("✅ AI API Key सहेज ली गई!");
  }
}

async function callGemini(promptText, type) {
  const apiKey = getGeminiKey();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    const data = await res.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) return data.candidates[0].content.parts[0].text;
  } catch (e) {}
  return "जीव दया पालणी, रूंख लीलो नी घावै — पर्यावरण एवं सभी जीवों की रक्षा करें।";
}

async function generateAiQuizQuestions() {
  if (!isEditorOrOwner()) return;
  const res = await callGemini(`विश्नोई समाज के २९ नियमों पर ५ MCQ हिंदी में बनाएं:\nQ: प्रश्न?\nA) 1\nB) 2\nC) 3\nD) 4\nAns: A`, 'quiz');
  document.getElementById('adminBulkQuizText').value = res.trim();
  showToast("🤖 AI ने प्रश्न तैयार कर दिए!");
}

async function generateAiDailySandesh() {
  if (!isEditorOrOwner()) return;
  const res = await callGemini(`Write a 1-line inspirational quote in Hindi for Bishnoi community.`, 'sandesh');
  document.getElementById('adminBannerInput').value = res.trim();
  showToast("🤖 AI ने सुविचार तैयार कर दिया!");
}

// 23. QUIZ & WINNERS
function startQuizNow() {
  if (isSectionSoftLocked(maintenanceConfig.sections.quiz) || isSectionSoftLocked(maintenanceConfig.globalMode)) {
    return showToast(maintenanceConfig.customMessages.quiz || "नए ज्ञान परीक्षा प्रश्न जोड़े जा रहे हैं!");
  }
  examState.activeMode = 'daily_quiz';
  startExamEngine(quizList, 15);
}

function loadQuiz() {
  db.collection('quiz').onSnapshot(snap => {
    if (!snap.empty) {
      quizList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      quizList = [
        { id: 'q1', q: "खेजड़ली गांव में ३६३ वीरों का महान बलिदान किस वर्ष हुआ था?", opts: ["1730 ईस्वी", "1485 ईस्वी", "1857 ईस्वी", "1947 ईस्वी"], ans: 0 },
        { id: 'q2', q: "गुरु जम्भेश्वर भगवान द्वारा २९ नियमों की घोषणा किस पवित्र स्थान पर हुई?", opts: ["मुकाम", "समराथल धोरा", "जांगलू", "लालासर"], ans: 1 },
        { id: 'q3', q: "अमृता देवी विश्नोई का अमर वचन क्या था?", opts: ["सत्यमेव जयते", "सिर साटै रूंख रहै, तो भी सस्तो जाण", "अहिंसा परमो धर्मः", "जय किसान"], ans: 1 }
      ];
    }
  });
}

function listenWinners() {
  db.collection('settings').doc('dailyWinners').onSnapshot(doc => {
    const w = doc.exists ? doc.data() : {};
    const cleanVal = (v) => (!v || v === 'प्रतीक्षारत' || v.trim() === '') ? '—' : v;
    if (document.getElementById('winner1Name')) document.getElementById('winner1Name').innerText = cleanVal(w.p1Name);
    if (document.getElementById('winner1Score')) document.getElementById('winner1Score').innerText = cleanVal(w.p1Score);
    if (document.getElementById('winner2Name')) document.getElementById('winner2Name').innerText = cleanVal(w.p2Name);
    if (document.getElementById('winner2Score')) document.getElementById('winner2Score').innerText = cleanVal(w.p2Score);
    if (document.getElementById('winner3Name')) document.getElementById('winner3Name').innerText = cleanVal(w.p3Name);
    if (document.getElementById('winner3Score')) document.getElementById('winner3Score').innerText = cleanVal(w.p3Score);
  });
}

async function saveDailyWinners() {
  if (!isSuperOwner()) return showToast("विजेता घोषित करने का अधिकार केवल मुख्य व्यवस्थापक (Owner) के पास है!");
  await db.collection('settings').doc('dailyWinners').set({
    p1Name: document.getElementById('win1InputName').value.trim() || '—',
    p1Score: document.getElementById('win1InputScore').value.trim() || '—',
    p2Name: document.getElementById('win2InputName').value.trim() || '—',
    p2Score: document.getElementById('win2InputScore').value.trim() || '—',
    p3Name: document.getElementById('win3InputName').value.trim() || '—',
    p3Score: document.getElementById('win3InputScore').value.trim() || '—'
  });
  showToast("✅ विजेता सूची अपडेट हो गई!");
}

async function importBulkQuiz() {
  if (!isEditorOrOwner()) return;
  const rawText = document.getElementById('adminBulkQuizText').value.trim();
  const targetCol = document.getElementById('adminQuestionTarget')?.value || 'daily_quiz';
  if (!rawText) return showToast('प्रश्न पेस्ट करें');

  const blocks = rawText.split(/\n\s*\n/);
  let parsed = [];
  for (let b of blocks) {
    const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
    let qText = '', opts = [], ansIdx = 0;
    for (let l of lines) {
      if (l.match(/^Q\s*:/i)) qText = l.replace(/^Q\s*:/i, '').trim();
      else if (l.match(/^[A-D]\s*\)/i)) opts.push(l.replace(/^[A-D]\s*\)/i, '').trim());
      else if (l.match(/^Ans\s*:/i)) {
        const letAns = l.replace(/^Ans\s*:/i, '').trim().toUpperCase();
        ansIdx = letAns === 'A' ? 0 : letAns === 'B' ? 1 : letAns === 'C' ? 2 : 3;
      }
    }
    if (qText && opts.length >= 2) parsed.push({ q: qText, opts, ans: ansIdx, title: qText, options: opts });
  }

  if (!parsed.length) return showToast('प्रारूप जाँचें');
  const collectionName = targetCol === 'daily_quiz' ? 'quiz' : (targetCol === 'mock_1' ? 'mockExam_1' : (targetCol === 'mock_2' ? 'mockExam_2' : 'mainExamQuestions'));
  const batch = db.batch();
  parsed.forEach(q => batch.set(db.collection(collectionName).doc(), q));
  await batch.commit();
  document.getElementById('adminBulkQuizText').value = '';
  showToast(`✅ ${parsed.length} प्रश्न (${targetCol}) में जोड़े गए!`);
}

// 24. DIRECT PDF EXPORTERS
function downloadQuizResultsPdf() {
  db.collection('quizAttempts').get().then(snap => {
    if (snap.empty) return showToast("कोई क्विज़ रिकॉर्ड नहीं मिला।");
    let records = [];
    snap.forEach(d => records.push(d.data()));
    records.sort((a, b) => b.score - a.score);
    
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.text("Bishnoi Portal - Quiz Results", 14, 18);
      doc.autoTable({
        startY: 25,
        head: [['Rank', 'Name', 'Phone', 'Score', 'Time']],
        body: records.map((r, i) => [i + 1, r.name || '', r.phone || '', `${r.score}/${r.total}`, `${r.timeTakenSeconds || 0}s`])
      });
      doc.save("Bishnoi_Quiz_Results.pdf");
    } else {
      showToast("PDF जनरेटर लोड हो रहा है, पुनः प्रयास करें।");
    }
  }).catch(err => {
    showToast("त्रुटि: " + err.message);
  });
}

function download7DaysUsersPdf() {
  db.collection('users').get().then(snap => {
    if (snap.empty) return showToast("कोई पंजीकृत सदस्य नहीं मिला।");
    let rows = [];
    snap.forEach(d => {
      const u = d.data();
      rows.push([u.name || '', u.phone || d.id, u.email || '-', u.location || '-']);
    });
    
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.text("Bishnoi Portal - Registered Members", 14, 18);
      doc.autoTable({ startY: 25, head: [['Name', 'Phone', 'Email', 'Location']], body: rows });
      doc.save("Bishnoi_Members.pdf");
    } else {
      showToast("PDF जनरेटर लोड हो रहा है, पुनः प्रयास करें।");
    }
  }).catch(err => {
    showToast("त्रुटि: " + err.message);
  });
}

// 25. CHAT STREAM, MEDIA, NIYAMS & HISTORY
function listenPosts() {
  db.collection('posts').orderBy('createdAt', 'desc').limit(80).onSnapshot(snap => {
    allChatPosts = [];
    snap.forEach(doc => allChatPosts.push({ id: doc.id, ...doc.data() }));
    renderFilteredChat();
  });
}

function renderFilteredChat() {
  const feed = document.getElementById('communityFeed');
  if (!feed) return;
  const selectedTopic = document.getElementById('chatTopicFilter')?.value || 'all';

  const filtered = selectedTopic === 'all'
    ? allChatPosts
    : allChatPosts.filter(p => (p.topic || 'सामान्य चर्चा') === selectedTopic);

  feed.className = 'divide-y divide-stone-200/80 bg-white rounded-2xl border border-stone-300 shadow-inner max-h-[62vh] overflow-y-auto';
  feed.innerHTML = `
    <div class="sticky top-0 z-10 bg-[#143622] text-white px-3.5 py-2 flex items-center justify-between text-xs font-bold shadow">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>समाज लाइव संवाद स्ट्रीम</span>
      </div>
      <span class="px-2 py-0.5 bg-white/15 rounded-full text-[10px] text-amber-300">${filtered.length} संदेश</span>
    </div>
  `;

  if (!filtered.length) {
    feed.innerHTML += `<div class="text-center py-8 text-xs text-stone-500">इस विषय पर अभी कोई संदेश नहीं है।</div>`;
    return;
  }

  filtered.forEach(p => {
    const isMyPost = Boolean(currentUser && (p.phone === currentUser.phone));
    const canDelete = Boolean(isMyPost || isSuperOwner());
    const timeStr = p.createdAt ? p.createdAt.toDate().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) : 'अभी';

    const itemRow = document.createElement('div');
    itemRow.className = `px-3 py-2.5 hover:bg-stone-50/90 transition flex items-start gap-2.5 ${p.isOwner ? 'bg-amber-50/50 border-l-4 border-l-amber-500' : ''}`;
    itemRow.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
        ${p.isOwner ? '🛡️' : (p.author || 'स').charAt(0).toUpperCase()}
      </div>
      <div class="flex-1 min-w-0 space-y-1">
        <div class="flex items-center justify-between gap-1 text-[11px]">
          <span class="font-extrabold text-forest">${p.author}</span>
          <span class="text-[10px] text-stone-400">${timeStr}</span>
        </div>
        <p class="text-xs sm:text-sm text-stone-900 leading-snug break-words">${p.content}</p>
        <div class="flex justify-end gap-2 text-[11px] text-stone-500">
          ${canDelete ? `<button onclick="confirmDeletePost('${p.id}')" class="text-red-600 font-bold">हटाएं</button>` : ''}
        </div>
      </div>
    `;
    feed.appendChild(itemRow);
  });
}

async function submitChaupalPost() {
  if (!currentUser) return openAuthModal();
  const txtEl = document.getElementById('postText');
  const txt = txtEl.value.trim();
  if (!txt) return showToast('कृपया अपना संदेश लिखें!');

  const topic = document.getElementById('postTopicSelect')?.value || 'सामान्य चर्चा';
  try {
    await db.collection('posts').add({
      author: currentUser.name,
      phone: currentUser.phone || 'Member',
      isOwner: isSuperOwner(),
      isEditor: isEditorOrOwner(),
      topic,
      content: txt,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    txtEl.value = '';
    updateCharCount();
  } catch (e) {
    showToast('त्रुटि: ' + e.message);
  }
}

function updateCharCount() {
  const el = document.getElementById('postText');
  const disp = document.getElementById('charCountDisplay');
  if (el && disp) disp.innerText = `${el.value.length} / 300`;
}

function confirmDeletePost(id) {
  openConfirmModal("संदेश हटाएं?", "क्या आप इस संदेश को हटाना चाहते हैं?", async (res) => {
    if (res) { await db.collection('posts').doc(id).delete(); showToast('संदेश हटा दिया गया।'); }
  });
}

function listenPinnedChat() {
  db.collection('settings').doc('pinnedChat').onSnapshot(doc => {
    const banner = document.getElementById('pinnedChatBanner');
    const txt = document.getElementById('pinnedChatText');
    const unpinBtn = document.getElementById('unpinChatBtn');
    if (!banner || !txt) return;

    if (doc.exists && doc.data().content) {
      txt.innerText = `📌 ${doc.data().author}: "${doc.data().content}"`;
      banner.classList.remove('hidden');
      if (unpinBtn) unpinBtn.classList.toggle('hidden', !isSuperOwner());
    } else {
      banner.classList.add('hidden');
    }
  });
}

function unpinChatMessage() {
  if (!isSuperOwner()) return;
  db.collection('settings').doc('pinnedChat').delete();
}

function listenBanner() {
  db.collection('settings').doc('dailySandesh').onSnapshot(doc => {
    if (doc.exists && doc.data().text) {
      currentBannerText = doc.data().text;
      document.getElementById('dailyBannerText').innerText = currentBannerText;
    }
  });
}

async function saveAdminBanner() {
  if (!isEditorOrOwner()) return;
  const txt = document.getElementById('adminBannerInput').value.trim();
  if (!txt) return;
  await db.collection('settings').doc('dailySandesh').set({ text: txt });
  showToast('✅ दैनिक संदेश अपडेट हुआ!');
  document.getElementById('adminBannerInput').value = '';
}

function shareBannerWhatsApp() {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🌿 पावन संदेश:\n${currentBannerText}\n${window.location.href}`)}`, '_blank');
}

function listenPdfs() {
  db.collection('pdfs').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const grid = document.getElementById('pdfGrid');
    if (!grid) return;
    grid.innerHTML = '';
    snap.forEach(doc => {
      const item = doc.data();
      grid.innerHTML += `
        <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 class="font-yatra text-forest text-base">${item.title}</h3>
            <p class="text-xs text-stone-500 mt-1">${item.desc || 'पवित्र ग्रंथ'}</p>
          </div>
          <div class="mt-4 pt-2 border-t border-stone-100 flex justify-between items-center">
            <a href="${item.link}" target="_blank" download class="px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg">डाउनलोड</a>
            ${isSuperOwner() ? `<button onclick="db.collection('pdfs').doc('${doc.id}').delete()" class="text-xs text-rose-600 font-bold">हटाएं</button>` : ''}
          </div>
        </div>
      `;
    });
  });
}

async function saveAdminPdf() {
  if (!isSuperOwner()) return showToast("केवल मुख्य व्यवस्थापक के लिए!");
  const title = document.getElementById('adminPdfTitle').value.trim();
  const link = document.getElementById('adminPdfLink').value.trim();
  if (!title || !link) return showToast('नाम और लिंक भरें');
  await db.collection('pdfs').add({ title, link, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  showToast('PDF जोड़ा गया!');
  document.getElementById('adminPdfTitle').value = '';
  document.getElementById('adminPdfLink').value = '';
}

function listenAudios() {
  db.collection('audios').orderBy('createdAt', 'desc').onSnapshot(snap => {
    if (!snap.empty) {
      audioPlaylist = [];
      snap.forEach(doc => audioPlaylist.push({ id: doc.id, ...doc.data() }));
      renderCustomMusicDropdown();
    }
  });
}

async function saveAdminAudio() {
  if (!isSuperOwner()) return showToast("केवल मुख्य व्यवस्थापक के लिए!");
  const title = document.getElementById('adminAudioTitle').value.trim();
  const link = document.getElementById('adminAudioLink').value.trim();
  if (!title || !link) return showToast('नाम और लिंक भरें');
  await db.collection('audios').add({ title, link, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  showToast('भजन जोड़ा गया!');
  document.getElementById('adminAudioTitle').value = '';
  document.getElementById('adminAudioLink').value = '';
}

function listenNotices() {
  db.collection('notices').orderBy('createdAt', 'desc').limit(5).onSnapshot(snap => {
    const list = document.getElementById('noticeBoardList');
    if (!snap.empty && list) {
      list.innerHTML = '';
      snap.forEach(doc => {
        const n = doc.data();
        list.innerHTML += `<div class="p-3 bg-stone-50 rounded-lg border border-stone-200"><span class="font-bold text-forest">${n.title}:</span> ${n.desc}</div>`;
      });
    }
  });
}

function listenTreeCounter() {
  db.collection('stats').doc('treePledges').onSnapshot(doc => {
    if (doc.exists && doc.data().count) document.getElementById('treeCounterDisplay').innerText = doc.data().count;
  });
}

async function pledgeTree() {
  if (localStorage.getItem('has_pledged_tree')) return showToast("संकल्प पहले से दर्ज है!");
  const display = document.getElementById('treeCounterDisplay');
  let nextVal = (parseInt(display.innerText) || 1485) + 1;
  display.innerText = nextVal;
  localStorage.setItem('has_pledged_tree', 'true');
  showToast("प्रकृति रक्षा संकल्प दर्ज हुआ!");
  try { await db.collection('stats').doc('treePledges').set({ count: nextVal }, { merge: true }); } catch (e) {}
}

function listenCustomNiyams() {
  db.collection('settings').doc('customNiyams').onSnapshot(doc => {
    if (doc.exists && Array.isArray(doc.data().list)) niyamsList = doc.data().list;
    renderNiyams(niyamsList);
  });
}

function renderNiyams(data) {
  const grid = document.getElementById('niyamGrid');
  if (!grid) return;
  grid.innerHTML = '';
  data.forEach(n => {
    grid.innerHTML += `
      <div class="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-forest w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">${n.num}</span>
          <span class="text-stone-500 font-semibold">${n.title}</span>
        </div>
        <h4 class="font-yatra text-base text-forest mt-1">${n.rule}</h4>
        <p class="text-xs text-stone-700 leading-relaxed">${n.desc}</p>
      </div>
    `;
  });
}

function filterNiyams() {
  const q = (document.getElementById('niyamSearch')?.value || '').toLowerCase();
  renderNiyams(niyamsList.filter(n => n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q) || n.title.toLowerCase().includes(q)));
}

function listenHistoryAndKids() {
  db.collection('settings').doc('customHistoryKids').onSnapshot(doc => {
    if (doc.exists && Array.isArray(doc.data().items) && doc.data().items.length > 0) historyItemsList = doc.data().items;
  });
}

function listenBlockedUsers() {
  db.collection('settings').doc('blockedUsers').onSnapshot(doc => {
    blockedPhonesList = (doc.exists && Array.isArray(doc.data().list)) ? doc.data().list : [];
  });
}

function listenTrustedEditors() {
  db.collection('settings').doc('editorRoles').onSnapshot(doc => {
    editorsPhoneList = (doc.exists && Array.isArray(doc.data().phones)) ? doc.data().phones : [];
  });
}

function listenDraftQueue() {
  db.collection('draftQueue').onSnapshot(snap => {
    draftItemsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });
}

function listenScheduledContent() {
  db.collection('scheduledTasks').onSnapshot(snap => {
    scheduledItemsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });
}

function listenFeedbacksForAdmin() {
  db.collection('feedbacks').limit(10).onSnapshot(snap => {});
}

function setupOneTimeExitFeedbackPrompt() {}
function openFeedbackModal() {}
function refreshOwnerAnalytics() {}
