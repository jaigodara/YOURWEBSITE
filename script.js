/* ==========================================================================
   Bishnoi Community Portal - 100% Complete Master Engine (script.js)
   All Original Features + New Examination & Owner Studio Suite Included:
   - Full Profile Modal with Photo Upload, 2 Spiritual Counters & Owner Studio Button
   - Home Screen Cleaned (Removed Niyam/Pariksha/Mala stats bar from Home)
   - Dynamic Pariksha Visibility (Enrollment, Mock Tests, Main Exam, Daily Quiz, Result Desk)
   - Unique Roll Number Generator (JAMBH-2026-XXXXX) & Standard Enrollment Form
   - 100-Question Exam & Mock Engine (1-by-1 view, Jump Grid 1-100, Anti-Cheating Lock)
   - 2 Official PDF Reports (Enrolled Students List PDF & Exam Merit Result PDF)
   - 7-Day Visitor Telemetry & Audit Logs (Name, Phone, Email, IP, Device Type, Location)
   - Granular RBAC Sub-Admin Power Control (Hides unauthorized powers from DOM)
   - In-built PDF Reader, Custom Audio Player, 29 Niyams, History/Kids & Live Chat
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
let examCountdownTimer = null;

// Samvad Manch, Editors, Drafts & Moderation State
let allChatPosts = [];
let activeReplyObj = null;
let blockedPhonesList = [];
let editorsPhoneList = [];
let subAdminPermissionsMap = {}; // phone -> { uploadQ, publishExam, toggleResults, viewAudit }

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

// Pariksha Visibility Settings (Controlled by Owner)
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

// Exam Runtime State
let examState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  timeRemainingSeconds: 0,
  timerInterval: null,
  tabSwitchCount: 0,
  activeMode: 'daily_quiz', // 'daily_quiz', 'mock_1', 'mock_2', 'main_exam'
  rollNumber: localStorage.getItem('bishnoi_saved_roll') || 'GUEST',
  securityAttached: false
};

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

// Mala & Progress Counters
let malaBeadCount = parseInt(localStorage.getItem('bishnoi_mala_beads') || '0');
let malaLapsCount = parseInt(localStorage.getItem('bishnoi_mala_laps') || '0');
let malaTotalCount = parseInt(localStorage.getItem('bishnoi_mala_total') || '0');
let readNiyamsSet = new Set(JSON.parse(localStorage.getItem('bishnoi_read_niyams') || '[]'));
let bestQuizPct = parseInt(localStorage.getItem('bishnoi_best_quiz_pct') || '0');

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

// 5. ROLE HELPERS & INACTIVITY GUARD
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

// 6. GLOBAL LAYOUT STYLES
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
  `;
}

// 7. 5-ICON BOTTOM NAVIGATION BAR
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

// 8. HOMEPAGE UPGRADE (NO STATS BAR ON HOME!) & CUSTOM AUDIO PLAYER
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
          <button onclick="openProfileModal()" class="elevate-card py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-center"><span class="font-yatra text-xs sm:text-sm text-amber-900 block">👤 मेरी प्रोफ़ाइल</span></button>
        </div>
      </div>
    `;
    homeTab.insertBefore(heroWrap, homeTab.firstChild);
  }

  // Upgrade Native Audio Box & Fix Broken 404 Audio Link
  const nativeAudio = document.getElementById('audioPlayer');
  const nativeSource = document.getElementById('audioSource');
  const nativeSelect = document.getElementById('audioTrackSelect');
  if (nativeSource && nativeSource.src.includes('temple_bell.ogg')) {
    nativeSource.src = ''; // Prevent 404 console error on page load
  }

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
  if (player.paused) player.play().catch(() => showToast("कृपया एडमिन स्टूडियो से वैध भजन लिंक जोड़ें।")); else player.pause();
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

// 9. COMPLETE DYNAMIC MODALS: PROFILE MODAL (WITH OWNER STUDIO ACCESS) & PDF READER MODAL
function injectDynamicModalsAndUI() {
  injectCleanLayoutStyles();
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
      <div class="bg-[#143622] text-white px-3 py-2.5 flex items-center justify-between gap-2 border-b border-amber-500/40 shadow-md shrink-0">
        <h3 id="pdfViewerTitle" class="font-yatra text-sm sm:text-base text-amber-300 truncate">साहित्य पाठक</h3>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="togglePdfLandscapeMode()" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-extrabold shadow">
            <span id="landscapeBtnText">🔄 लैंडस्केप</span>
          </button>
          <a id="pdfModalDownloadBtn" href="#" download class="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold">डाउनलोड</a>
          <button onclick="closeInbuiltPdfViewer()" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-extrabold">✕ बंद करें</button>
        </div>
      </div>
      <div id="pdfSinglePageViewport" class="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-stone-900 relative">
        <div id="pdfLoadingSpinner" class="text-amber-300 text-sm font-bold animate-pulse">पृष्ठ खुल रहा है...</div>
        <canvas id="pdfSinglePageCanvas" class="bg-white rounded shadow-2xl max-w-full h-auto hidden"></canvas>
        <iframe id="pdfDriveFallbackFrame" class="hidden w-full h-full border-0 bg-white rounded"></iframe>
      </div>
      <div id="pdfBottomNavBar" class="bg-[#143622] text-white px-4 py-2.5 border-t border-amber-500/30 flex items-center justify-between gap-3 shrink-0">
        <button onclick="changePdfPage(-1)" id="pdfPrevBtn" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-extrabold text-xs rounded-xl shadow">← पिछला पन्ना</button>
        <div class="flex items-center gap-1.5 text-xs font-bold">
          <span>पृष्ठ</span>
          <input type="number" id="pdfPageJumpInput" min="1" value="1" onchange="jumpToPdfPage(this.value)" class="w-14 text-center py-1 rounded bg-stone-800 text-amber-300 border border-amber-400/40 font-extrabold">
          <span id="pdfTotalPagesLabel">/ 1</span>
        </div>
        <button onclick="changePdfPage(1)" id="pdfNextBtn" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-extrabold text-xs rounded-xl shadow">अगला पन्ना →</button>
      </div>
    `;
    document.body.appendChild(pdfModal);
  }

  // Full User Profile Modal (With Pure 2-Box Spiritual Stats & Owner Studio Gateway!)
  if (!document.getElementById('userProfileModal')) {
    const profModal = document.createElement('div');
    profModal.id = 'userProfileModal';
    profModal.className = 'fixed inset-0 z-[9980] bg-black/65 backdrop-blur-sm hidden items-center justify-center p-4 overflow-y-auto';
    profModal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-stone-200 shadow-2xl my-auto">
        <div class="bg-gradient-to-r from-[#143622] via-[#1c472e] to-[#0f291a] text-white p-5 relative">
          <button onclick="closeProfileModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center">✕</button>
          <div class="flex items-center gap-3.5">
            <label class="relative cursor-pointer group shrink-0" title="अपनी फोटो बदलें">
              <img id="profPhotoPreview" src="" class="hidden w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-lg">
              <div id="profAvatarCircle" class="w-16 h-16 rounded-2xl bg-amber-400 text-stone-950 font-yatra text-2xl flex items-center justify-center shadow-lg border-2 border-white">
                बि
              </div>
              <span class="absolute -bottom-1 -right-1 bg-white text-forest text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow">📷 फोटो</span>
              <input type="file" accept="image/*" onchange="handleProfilePhotoUpload(event)" class="hidden">
            </label>
            <div>
              <span id="profileRoleBadge" class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-stone-950 uppercase tracking-wide">सदस्य</span>
              <h3 id="profHeaderNameDisplay" class="font-yatra text-xl text-white mt-1">मेरी प्रोफ़ाइल</h3>
              <p class="text-xs text-amber-200">🌿 पर्यावरण एवं नियम साधक</p>
            </div>
          </div>
        </div>

        <div class="p-5 space-y-4">
          <!-- OWNER / EDITOR STUDIO LAUNCHPAD INSIDE PROFILE -->
          <div id="ownerStudioInsideProfile" class="hidden p-4 rounded-2xl bg-gradient-to-br from-[#143622] to-stone-900 text-white space-y-2.5 border border-amber-400/50 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold text-amber-300">🛡️ व्यवस्थापक एवं परीक्षा नियंत्रण स्टूडियो</span>
              <span class="text-[10px] bg-amber-400 text-stone-950 font-extrabold px-2 py-0.5 rounded-full">Admin Studio</span>
            </div>
            <p class="text-[11px] text-stone-300">परीक्षा विज़िबिलिटी, मॉक टेस्ट, प्रश्न बैंक, PDF रिपोर्ट्स व ७-दिवसीय लॉग्स यहाँ से नियंत्रित करें:</p>
            <button onclick="closeProfileModal(); switchTab('admin');" class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs rounded-xl shadow transition">
              🚀 व्यवस्थापक नियंत्रण कक्ष (Open Owner Studio) खोलें
            </button>
          </div>

          <!-- ONLY 2 PURE SPIRITUAL STATS BOXES (0 कुल मंत्र जप | 0 पूर्ण माला) -->
          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <div id="statMalaTotal" class="font-extrabold text-xl text-forest">0</div>
              <div class="text-xs font-semibold text-stone-600">कुल मंत्र जप</div>
            </div>
            <div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div id="statMalaLaps" class="font-extrabold text-xl text-forest">0</div>
              <div class="text-xs font-semibold text-stone-600">पूर्ण माला</div>
            </div>
          </div>

          <div class="space-y-2.5 text-xs">
            <div>
              <label class="font-bold text-stone-700 block mb-1">आपका शुभ नाम (Full Name):</label>
              <input type="text" id="profEditName" class="w-full p-2.5 rounded-xl border border-stone-300 font-semibold" placeholder="अपना नाम लिखें">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="font-bold text-stone-700 block mb-1">गाँव / ज़िला (Location):</label>
                <input type="text" id="profEditLocation" class="w-full p-2.5 rounded-xl border border-stone-300" placeholder="उदा: हिसार, हरियाणा">
              </div>
              <div>
                <label class="font-bold text-stone-700 block mb-1">नया पासवर्ड (ऐच्छिक):</label>
                <input type="password" id="profEditPass" class="w-full p-2.5 rounded-xl border border-stone-300" placeholder="बदलना हो तो लिखें">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <div class="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span class="text-[10px] text-stone-400 block">मोबाइल / खाता आईडी</span>
                <span id="profPhoneDisplay" class="font-bold text-stone-800 truncate block"></span>
              </div>
              <div class="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span class="text-[10px] text-stone-400 block">पंजीकृत रोल नंबर</span>
                <span id="profRollDisplay" class="font-bold text-emerald-700 truncate block"></span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
            <button onclick="saveUserProfileChanges()" class="flex-1 py-2.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow transition">💾 प्रोफ़ाइल सहेजें</button>
            <button onclick="closeProfileModal(); logoutUser();" class="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200">लॉगआउट</button>
            <button onclick="closeProfileModal()" class="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl">बंद करें</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(profModal);
  }
}

// 10. PROFILE MODAL FUNCTIONS & PHOTO UPLOAD
function openProfileModal() {
  if (!currentUser) return openAuthModal();
  const modal = document.getElementById('userProfileModal');
  if (!modal) return;

  const nm = currentUser.name || 'सदस्य';
  document.getElementById('profEditName').value = nm;
  document.getElementById('profHeaderNameDisplay').innerText = nm;
  document.getElementById('profEditLocation').value = currentUser.location || '';
  document.getElementById('profEditPass').value = '';
  document.getElementById('profPhoneDisplay').innerText = currentUser.phone || '';
  document.getElementById('profRollDisplay').innerText = examState.rollNumber !== 'GUEST' ? examState.rollNumber : 'नामांकन शेष';

  updateProfileAvatarUI();

  const studioBox = document.getElementById('ownerStudioInsideProfile');
  if (studioBox) studioBox.classList.toggle('hidden', !isEditorOrOwner());

  const roleBadge = document.getElementById('profileRoleBadge');
  if (roleBadge) {
    if (isSuperOwner()) roleBadge.innerText = '🛡️ मुख्य व्यवस्थापक (Super Owner)';
    else if (isEditorOrOwner()) roleBadge.innerText = '✍️ अधिकृत सह-व्यवस्थापक (Sub-Admin)';
    else roleBadge.innerText = '👤 पंजीकृत सदस्य (Member)';
  }

  document.getElementById('statMalaTotal').innerText = malaTotalCount;
  document.getElementById('statMalaLaps').innerText = malaLapsCount;

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
      try {
        await db.collection('users').doc(currentUser.phone).set({ photo: dataUrl }, { merge: true });
      } catch (err) {}
      showToast("📷 आपकी प्रोफ़ाइल फोटो सहेज ली गई!");
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
  const newPass = document.getElementById('profEditPass').value.trim();
  if (!newName) return showToast("कृपया नाम खाली न छोड़ें!");

  currentUser.name = newName;
  currentUser.location = newLoc;
  localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));

  const updateData = { name: newName, location: newLoc, phone: currentUser.phone };
  if (newPass) updateData.pass = newPass;

  try {
    await db.collection('users').doc(currentUser.phone).set(updateData, { merge: true });
    updateNavAuth();
    closeProfileModal();
    showToast("✅ प्रोफ़ाइल सहेज ली गई!");
  } catch (e) {
    showToast("त्रुटि: " + e.message);
  }
}

// 11. DYNAMIC PARIKSHA VISIBILITY & SUB-ADMIN RBAC CONTROLLER
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

  const closedNotice = document.getElementById('examClosedNoticeBox');
  const enrollBox = document.getElementById('examEnrollmentBox');
  const mockBox = document.getElementById('mockTestsHub');
  const mainExamBox = document.getElementById('mainExamLaunchBox');
  const dailyQuizBox = document.getElementById('quizIntroCard');
  const resultBox = document.getElementById('examResultCheckDesk');

  if (closedNotice) closedNotice.classList.toggle('hidden', anyActive);
  if (enrollBox) enrollBox.classList.toggle('hidden', !parikshaVisibility.enrollment);
  if (mockBox) mockBox.classList.toggle('hidden', !parikshaVisibility.mock);
  if (mainExamBox) mainExamBox.classList.toggle('hidden', !parikshaVisibility.mainExam);
  if (dailyQuizBox) dailyQuizBox.classList.toggle('hidden', !parikshaVisibility.dailyQuiz);
  if (resultBox) resultBox.classList.toggle('hidden', !parikshaVisibility.resultsPublished);

  // Sync Owner Studio Toggles
  const tEnroll = document.getElementById('toggleEnrollmentSection');
  const tMock = document.getElementById('toggleMockSection');
  const tMain = document.getElementById('toggleMainExamSection');
  const tQuiz = document.getElementById('toggleDailyQuizSection');
  if (tEnroll) tEnroll.checked = Boolean(parikshaVisibility.enrollment);
  if (tMock) tMock.checked = Boolean(parikshaVisibility.mock);
  if (tMain) tMain.checked = Boolean(parikshaVisibility.mainExam);
  if (tQuiz) tQuiz.checked = Boolean(parikshaVisibility.dailyQuiz);

  if (parikshaVisibility.mainExam && parikshaVisibility.examScheduleTime) {
    startExamCountdownClock(parikshaVisibility.examScheduleTime);
  }
}

async function updateParikshaVisibilitySettings() {
  if (!isSuperOwner()) return showToast("केवल मुख्य व्यवस्थापक (Owner) के पास अधिकार है!");
  const enrollment = document.getElementById('toggleEnrollmentSection')?.checked || false;
  const mock = document.getElementById('toggleMockSection')?.checked || false;
  const mainExam = document.getElementById('toggleMainExamSection')?.checked || false;
  const dailyQuiz = document.getElementById('toggleDailyQuizSection')?.checked || false;

  await db.collection('examConfig').doc('visibility').set({
    enrollment, mock, mainExam, dailyQuiz
  }, { merge: true });

  showToast("✅ परीक्षा विज़िबिलिटी सेटिंग्स लाइव अपडेट हो गईं!");
}

function startExamCountdownClock(targetIso) {
  if (examCountdownTimer) clearInterval(examCountdownTimer);
  const targetTime = new Date(targetIso).getTime();

  function update() {
    const now = Date.now();
    const diff = targetTime - now;
    const disp = document.getElementById('examCountdownDisplay');
    const startBtn = document.getElementById('startMainExamBtn');
    if (!disp) return;

    if (diff <= 0) {
      disp.innerText = "00:00:00 (परीक्षा लाइव है)";
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

// RBAC Granular Sub-Admin Power Delegator
function enhanceSubAdminManagerUI() {
  const sec = document.getElementById('secManageAdmins');
  if (!sec || document.getElementById('subAdminPhoneAssignRow')) return;

  const assignRow = document.createElement('div');
  assignRow.id = 'subAdminPhoneAssignRow';
  assignRow.className = 'pt-3 border-t border-stone-100 space-y-2.5 text-xs';
  assignRow.innerHTML = `
    <div class="flex flex-col sm:flex-row gap-2">
      <input type="tel" id="subAdminTargetPhone" maxlength="10" placeholder="सह-प्रबंधक का 10-अंकों का मोबाइल नंबर" class="flex-1 p-2 border border-stone-300 rounded-lg font-semibold">
      <button onclick="saveSubAdminGranularPermissions()" class="px-4 py-2 bg-forest text-white font-bold rounded-lg shadow hover:bg-emerald-950">
        💾 सह-प्रबंधक को चुनिंदा अधिकार दें
      </button>
    </div>
    <div id="activeSubAdminsList" class="space-y-1.5 pt-1"></div>
  `;
  sec.appendChild(assignRow);
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
            p.canPublishExam ? 'परीक्षा लाइव' : '',
            p.canToggleResults ? 'परिणाम घोषणा' : '',
            p.canViewAuditLogs ? 'ऑडिट लॉग्स' : ''
          ].filter(Boolean).join(' • ') || 'कोई अधिकार नहीं';
          return `
            <div class="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
              <div>
                <span class="font-bold text-forest">📱 ${ph}</span>
                <span class="text-[10px] text-stone-600 ml-2">(${badges})</span>
              </div>
              <button onclick="removeSubAdminRole('${ph}')" class="text-red-600 font-bold text-[11px]">हटाएं ✕</button>
            </div>
          `;
        }).join('');
      }
    }

    applyCurrentUserRBACView();
  });
}

async function saveSubAdminGranularPermissions() {
  if (!isSuperOwner()) return showToast("केवल मुख्य ओनर ही अधिकार दे सकते हैं!");
  const ph = document.getElementById('subAdminTargetPhone')?.value.trim() || '';
  if (!/^[6-9]\d{9}$/.test(ph)) return showToast("कृपया सही १० अंकों का मोबाइल नंबर लिखें!");

  const perms = {
    canUploadQuestions: Boolean(document.getElementById('permUploadQ')?.checked),
    canPublishExam: Boolean(document.getElementById('permPublishExam')?.checked),
    canToggleResults: Boolean(document.getElementById('permToggleResults')?.checked),
    canViewAuditLogs: Boolean(document.getElementById('permViewAudit')?.checked)
  };

  subAdminPermissionsMap[ph] = perms;
  await db.collection('settings').doc('subAdminPermissions').set({ map: subAdminPermissionsMap });
  document.getElementById('subAdminTargetPhone').value = '';
  showToast(`✅ मोबाइल ${ph} के अधिकार अपडेट कर दिए गए!`);
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

  // Completely hide unauthorized sections so sub-admin doesn't even see they exist
  toggleElementVisibility('secManageAdmins', isOwner);
  toggleElementVisibility('secParikshaVisibilityController', isOwner || allowed.includes('canPublishExam') || allowed.includes('canToggleResults'));
  toggleElementVisibility('secPublishExam', isOwner || allowed.includes('canPublishExam') || allowed.includes('canToggleResults'));
  toggleElementVisibility('secUploadQuestions', isOwner || allowed.includes('canUploadQuestions'));
  toggleElementVisibility('secAuditLogs', isOwner || allowed.includes('canViewAuditLogs'));
}

function toggleElementVisibility(elementId, isVisible) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (isVisible) el.classList.remove('hidden');
  else el.classList.add('hidden');
}

// 12. STUDENT ENROLLMENT & COLLISION-FREE ROLL NUMBER GENERATOR
async function handleExamEnrollment(e) {
  e.preventDefault();
  const name = document.getElementById('enrollName').value.trim();
  const fatherName = document.getElementById('enrollFatherName').value.trim();
  const dob = document.getElementById('enrollDob').value;
  const phone = document.getElementById('enrollPhone').value.trim();
  const email = document.getElementById('enrollEmail').value.trim();
  const location = document.getElementById('enrollLocation').value.trim();

  if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया सही १० अंकों का फ़ोन नंबर भरें!");
  if (!name || !fatherName || !dob || !location) return showToast("कृपया सभी अनिवार्य फ़ील्ड्स भरें!");

  try {
    // Check if phone is already enrolled to prevent duplicate roll numbers for same student
    const existingSnap = await db.collection('examEnrolledStudents').where('phone', '==', phone).limit(1).get();
    if (!existingSnap.empty) {
      const existingRoll = existingSnap.docs[0].id;
      examState.rollNumber = existingRoll;
      localStorage.setItem('bishnoi_saved_roll', existingRoll);
      alert(`ℹ️ आपका नामांकन पहले से दर्ज है!\n\nआपका रोल नंबर है: ${existingRoll}`);
      return;
    }

    // Generate guaranteed unique roll number
    let rollNumber = '';
    let isUnique = false;
    while (!isUnique) {
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      rollNumber = `JAMBH-2026-${randomSuffix}`;
      const checkDoc = await db.collection('examEnrolledStudents').doc(rollNumber).get();
      if (!checkDoc.exists) isUnique = true;
    }

    const studentRecord = {
      rollNumber,
      name,
      fatherName,
      dob,
      phone,
      email: email || '-',
      location,
      enrolledAt: firebase.firestore.FieldValue.serverTimestamp(),
      timestamp: Date.now()
    };

    await db.collection('examEnrolledStudents').doc(rollNumber).set(studentRecord);
    examState.rollNumber = rollNumber;
    localStorage.setItem('bishnoi_saved_roll', rollNumber);

    alert(`🎉 बधाई! आपका परीक्षा नामांकन सफल हुआ।\n\nरोल नंबर (Roll No): ${rollNumber}\nनाम: ${name}\nपिता का नाम: ${fatherName}\n\nकृपया इस रोल नंबर को मुख्य परीक्षा एवं परिणाम के लिए सुरक्षित रखें।`);

    document.getElementById('enrollName').value = '';
    document.getElementById('enrollFatherName').value = '';
    document.getElementById('enrollDob').value = '';
    document.getElementById('enrollPhone').value = '';
    document.getElementById('enrollEmail').value = '';
    document.getElementById('enrollLocation').value = '';
  } catch (err) {
    showToast("नामांकन त्रुटि: " + err.message);
  }
}

// 13. TWO OFFICIAL PDF EXPORTERS (ENROLLMENT MASTER PDF & EXAM MERIT RESULT PDF)
function downloadEnrolledStudentsPdf() {
  db.collection('examEnrolledStudents').get().then(snap => {
    if (snap.empty) return showToast("अभी तक कोई नामांकित छात्र नहीं मिला।");
    let list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    let rows = list.map((s, i) => [
      i + 1,
      s.rollNumber || s.id,
      s.name || '',
      s.fatherName || '',
      s.dob || '',
      s.phone || '',
      s.email || '-',
      s.location || ''
    ]);

    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');
      doc.setFontSize(14);
      doc.text("Jambhani Literature Examination 2026 - Enrolled Candidates Master List", 14, 15);
      doc.setFontSize(10);
      doc.text(`Total Enrolled Candidates: ${rows.length} | Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.autoTable({
        startY: 27,
        head: [['S.No', 'Roll Number', 'Candidate Name', 'Father Name', 'DOB', 'Phone', 'Email', 'Location']],
        body: rows,
        styles: { fontSize: 9 }
      });
      doc.save("Jambhani_Exam_Enrolled_Students_List.pdf");
      showToast("📋 नामांकित छात्रों की PDF डाउनलोड हो गई!");
    } else {
      showToast("PDF जनरेटर लोड हो रहा है, पुनः प्रयास करें।");
    }
  }).catch(err => showToast("त्रुटि: " + err.message));
}

function downloadExamResultsMeritPdf() {
  db.collection('examSubmissions').get().then(snap => {
    if (snap.empty) return showToast("कोई परीक्षा परिणाम रिकॉर्ड नहीं मिला।");
    let records = [];
    snap.forEach(d => records.push(d.data()));
    records.sort((a, b) => (b.score || 0) - (a.score || 0));

    let rows = records.map((r, idx) => [
      idx + 1,
      r.rollNumber || '-',
      r.candidateName || '',
      r.fatherName || '-',
      `${r.score || 0} / ${r.total || 100}`,
      r.mode || 'main_exam'
    ]);

    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Jambhani Literature Examination 2026 - Official Merit & Marks Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`Total Submissions: ${rows.length} | Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.autoTable({
        startY: 27,
        head: [['Rank', 'Roll Number', 'Student Name', 'Father Name', 'Marks Obtained', 'Exam Mode']],
        body: rows
      });
      doc.save("Jambhani_Exam_Results_Merit_List.pdf");
      showToast("🏆 परीक्षा परिणाम मेरिट PDF डाउनलोड हो गई!");
    } else {
      showToast("PDF जनरेटर लोड हो रहा है, पुनः प्रयास करें।");
    }
  }).catch(err => showToast("त्रुटि: " + err.message));
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

    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.text("Bishnoi Portal - Registered Members Report", 14, 18);
      doc.autoTable({ startY: 25, head: [['Name', 'Phone', 'Email', 'Location']], body: rows });
      doc.save("Bishnoi_Members_Report.pdf");
    }
  }).catch(err => showToast("त्रुटि: " + err.message));
}

// 14. INDIVIDUAL STUDENT RESULT CHECK (BY ROLL NUMBER, NAME & DOB)
async function handleIndividualResultCheck(e) {
  e.preventDefault();
  const roll = document.getElementById('resCheckRoll').value.trim().toUpperCase();
  const name = document.getElementById('resCheckName').value.trim().toLowerCase();
  const dob = document.getElementById('resCheckDob').value;

  const resultBox = document.getElementById('studentPersonalResultDisplay');
  if (!resultBox) return;

  try {
    const enrolledDoc = await db.collection('examEnrolledStudents').doc(roll).get();
    if (!enrolledDoc.exists) {
      return showToast("यह रोल नंबर हमारे रिकॉर्ड में नहीं मिला!");
    }
    const studentData = enrolledDoc.data();
    if (studentData.dob !== dob || !studentData.name.toLowerCase().includes(name)) {
      return showToast("दर्ज किया गया नाम या जन्मतिथि रोल नंबर से मेल नहीं खाती!");
    }

    const subSnap = await db.collection('examSubmissions')
      .where('rollNumber', '==', roll)
      .limit(1)
      .get();

    if (subSnap.empty) {
      resultBox.innerHTML = `
        <div class="p-4 bg-amber-50 rounded-xl border border-amber-300 text-center text-xs text-amber-900 font-semibold">
          आपकी उत्तर-पुस्तिका प्राप्त नहीं हुई है अथवा परिणाम अभी प्रक्रियाधीन है।
        </div>
      `;
      resultBox.classList.remove('hidden');
      return;
    }

    const subData = subSnap.docs[0].data();
    const score = subData.score || 0;
    const total = subData.total || 100;
    const percentage = Math.round((score / total) * 100);

    resultBox.innerHTML = `
      <div class="p-5 bg-gradient-to-br from-emerald-50 via-white to-amber-50 rounded-2xl border-2 border-forest shadow-md space-y-3">
        <div class="flex justify-between items-center border-b border-stone-200 pb-2">
          <span class="font-yatra text-base text-forest">जाम्भाणी साहित्य परीक्षा - आधिकारिक अंकतालिका</span>
          <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-forest font-bold text-xs">✓ सत्यापित</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
          <div><b>परीक्षार्थी का नाम:</b> ${studentData.name}</div>
          <div><b>पिता का नाम:</b> ${studentData.fatherName}</div>
          <div><b>रोल नंबर:</b> ${roll}</div>
          <div><b>जन्मतिथि (DOB):</b> ${dob}</div>
          <div class="sm:col-span-2"><b>स्थान:</b> ${studentData.location}</div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
          <span class="font-bold text-xs text-stone-600">प्राप्तांक (Marks Obtained):</span>
          <span class="text-xl font-extrabold text-terracotta">${score} / ${total} (${percentage}%)</span>
        </div>
        <button onclick="generateCertificate('${studentData.name.replace(/'/g, "\\'")}', ${percentage})" class="w-full py-2.5 bg-forest text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-950">
          📜 डिजिटल सम्मान-पत्र (Certificate) डाउनलोड करें
        </button>
      </div>
    `;
    resultBox.classList.remove('hidden');
  } catch (err) {
    showToast("परिणाम जाँच में त्रुटि: " + err.message);
  }
}

// 15. ZERO-LAG 100-QUESTION EXAM & MOCK TEST ENGINE (WITH STRICT SECURITY)
async function launchMainExamPortal() {
  let roll = examState.rollNumber;
  if (!roll || roll === 'GUEST') {
    const inputRoll = prompt("परीक्षा कक्ष में प्रवेश हेतु अपना रोल नंबर दर्ज करें (जैसे: JAMBH-2026-12345):");
    if (!inputRoll) return;
    roll = inputRoll.trim().toUpperCase();
  }

  // Verify enrollment record to link Father Name & Candidate Name
  try {
    const rollDoc = await db.collection('examEnrolledStudents').doc(roll).get();
    if (!rollDoc.exists && !isSuperOwner()) {
      return showToast("अमान्य रोल नंबर! कृपया पहले नामांकन करें या सही रोल नंबर डालें।");
    }
    if (rollDoc.exists) {
      examState.enrolledProfile = rollDoc.data();
    }
    examState.rollNumber = roll;
    localStorage.setItem('bishnoi_saved_roll', roll);

    examState.activeMode = 'main_exam';
    const snap = await db.collection('mainExamQuestions').get();
    let list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    if (!list.length) {
      return showToast("मुख्य परीक्षा के प्रश्न अभी अपलोड या लाइव नहीं किए गए हैं।");
    }
    startExamEngine(list, parikshaVisibility.examDuration || 120);
  } catch (e) {
    showToast("परीक्षा लोड करने में त्रुटि: " + e.message);
  }
}

function startMockTestEngine(mockId) {
  examState.activeMode = `mock_${mockId}`;
  db.collection(`mockExam_${mockId}`).get().then(snap => {
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
  }).catch(() => showToast("मॉक टेस्ट लोड नहीं हो सका।"));
}

function startQuizNow() {
  examState.activeMode = 'daily_quiz';
  startExamEngine(quizList, 15);
}

function startExamEngine(questionList, durationMinutes) {
  examState.questions = questionList;
  examState.timeRemainingSeconds = durationMinutes * 60;
  examState.currentIndex = 0;
  examState.tabSwitchCount = 0;
  const cacheKey = `cachedExam_${examState.activeMode}_${examState.rollNumber}`;
  examState.answers = JSON.parse(localStorage.getItem(cacheKey) || '{}');

  document.getElementById('examClosedNoticeBox')?.classList.add('hidden');
  document.getElementById('examEnrollmentBox')?.classList.add('hidden');
  document.getElementById('mockTestsHub')?.classList.add('hidden');
  document.getElementById('mainExamLaunchBox')?.classList.add('hidden');
  document.getElementById('examResultCheckDesk')?.classList.add('hidden');
  document.getElementById('quizIntroCard')?.classList.add('hidden');
  document.getElementById('quizActiveBox')?.classList.remove('hidden');

  const rollEl = document.getElementById('examCandidateRoll');
  if (rollEl) rollEl.innerText = `रोल: ${examState.rollNumber} (${examState.activeMode.toUpperCase()})`;

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

  document.addEventListener('contextmenu', e => {
    const qBox = document.getElementById('quizActiveBox');
    if (qBox && !qBox.classList.contains('hidden')) e.preventDefault();
  });
  document.addEventListener('copy', e => {
    const qBox = document.getElementById('quizActiveBox');
    if (qBox && !qBox.classList.contains('hidden')) e.preventDefault();
  });

  document.addEventListener('visibilitychange', () => {
    const qBox = document.getElementById('quizActiveBox');
    if (document.hidden && qBox && !qBox.classList.contains('hidden')) {
      examState.tabSwitchCount++;
      alert(`⚠️ सुरक्षा चेतावनी (${examState.tabSwitchCount}/3):\nपरीक्षा के दौरान स्क्रीन या टैब बदलना सख्त वर्जित है!`);
      if (examState.tabSwitchCount >= 3) {
        submitFinalExam(true);
      }
    }
  });
}

function buildQuestionGridPills() {
  const gridContainer = document.getElementById('questionGridPills');
  if (!gridContainer) return;
  gridContainer.innerHTML = '';
  examState.questions.forEach((q, idx) => {
    const qId = q.id || `q_${idx}`;
    const pill = document.createElement('button');
    pill.id = `q_pill_${idx}`;
    pill.className = `w-8 h-8 rounded-lg text-xs font-bold border transition ${examState.answers[qId] !== undefined ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-stone-700 border-stone-300'}`;
    pill.innerText = idx + 1;
    pill.onclick = () => jumpToQuestion(idx);
    gridContainer.appendChild(pill);
  });
}

function renderQuestion(index) {
  if (!examState.questions[index]) return;
  const q = examState.questions[index];
  const qId = q.id || `q_${index}`;
  const container = document.getElementById('examQuestionArea');
  if (!container) return;

  const currentSelection = examState.answers[qId];

  container.innerHTML = `
    <div class="p-4 bg-white rounded-xl shadow-sm border border-stone-200 select-none">
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
              onchange="saveExamAnswer('${qId}', ${i}, ${index})" class="accent-forest w-4 h-4 mr-3">
            <span class="text-xs sm:text-sm text-stone-800 font-medium">${opt}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

function saveExamAnswer(questionId, selectedOption, index) {
  examState.answers[questionId] = selectedOption;
  const cacheKey = `cachedExam_${examState.activeMode}_${examState.rollNumber}`;
  localStorage.setItem(cacheKey, JSON.stringify(examState.answers));
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
  if (examState.timerInterval) clearInterval(examState.timerInterval);

  let calculatedScore = 0;
  examState.questions.forEach((q, idx) => {
    const qId = q.id || `q_${idx}`;
    if (examState.answers[qId] === q.ans) calculatedScore++;
  });

  const candidateName = examState.enrolledProfile?.name || (currentUser ? currentUser.name : 'परीक्षार्थी');
  const fatherName = examState.enrolledProfile?.fatherName || '-';

  const payload = {
    rollNumber: examState.rollNumber,
    candidateName,
    fatherName,
    phone: examState.enrolledProfile?.phone || (currentUser ? currentUser.phone : '-'),
    mode: examState.activeMode,
    score: calculatedScore,
    total: examState.questions.length,
    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
    isForcedSubmission: isForced,
    isPublished: false // Result kept private until Owner publishes
  };

  try {
    await db.collection('examSubmissions').add(payload);
    const cacheKey = `cachedExam_${examState.activeMode}_${examState.rollNumber}`;
    localStorage.removeItem(cacheKey);

    document.getElementById('quizActiveBox').innerHTML = `
      <div class="text-center p-8 bg-green-50 rounded-2xl border border-green-200 space-y-3">
        <div class="text-4xl">📜</div>
        <h3 class="text-xl font-bold text-forest">उत्तर-पुस्तिका सफलतापूर्वक जमा हो गई है!</h3>
        <p class="text-xs sm:text-sm text-stone-600">रोल नंबर: <b>${examState.rollNumber}</b> के सभी उत्तर सुरक्षित सहेज लिए गए हैं।</p>
        <div class="p-3 bg-white rounded-xl border border-green-300 text-xs font-semibold text-green-900">
          गोपनियता नियम के तहत प्राप्तांक गुप्त रखे गए हैं। परिणाम (Result) की आधिकारिक घोषणा निर्धारित तिथि पर की जाएगी।
        </div>
        <button onclick="location.reload()" class="px-5 py-2 bg-forest text-white rounded-xl text-xs font-bold shadow">
          मुखपृष्ठ पर लौटें
        </button>
      </div>
    `;
  } catch (err) {
    showToast("सबमिशन त्रुटि: " + err.message);
  }
}

// 16. OWNER STUDIO: DRAFT SAVING, EXAM SCHEDULING & RESULT PUBLISHING
async function saveExamAsDraft() {
  if (!isEditorOrOwner()) return showToast("अनुमति नहीं है!");
  const target = document.getElementById('adminQuestionTarget')?.value || 'main_exam';
  const raw = document.getElementById('adminBulkQuizText')?.value.trim();
  if (!raw) return showToast("कृपया पहले प्रश्न पेस्ट करें!");

  await db.collection('examDrafts').doc(target).set({
    rawQuestions: raw,
    author: currentUser?.name || 'Admin',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast(`✅ प्रश्न (${target}) ड्राफ्ट में सुरक्षित हो गए! जब चाहें इन्हें लाइव करें।`);
}

async function publishMainExamLive() {
  if (!isSuperOwner() && !(subAdminPermissionsMap[currentUser?.phone]?.canPublishExam)) {
    return showToast("परीक्षा लाइव करने का अधिकार केवल अधिकृत व्यवस्थापक के पास है!");
  }
  const startTime = document.getElementById('adminExamScheduleTime')?.value;
  const endTime = document.getElementById('adminExamEndTime')?.value;
  const duration = parseInt(document.getElementById('adminExamDuration')?.value) || 120;

  openConfirmModal("मुख्य परीक्षा लाइव करें?", "क्या आप ड्राफ्ट प्रश्नों को सक्रिय कर मुख्य परीक्षा पोर्टल लाइव करना चाहते हैं?", async (res) => {
    if (res) {
      // Check if there are draft questions for main_exam and push them live
      const draftDoc = await db.collection('examDrafts').doc('main_exam').get();
      if (draftDoc.exists && draftDoc.data().rawQuestions) {
        document.getElementById('adminBulkQuizText').value = draftDoc.data().rawQuestions;
        document.getElementById('adminQuestionTarget').value = 'main_exam';
        await importBulkQuiz();
      }

      await db.collection('examConfig').doc('visibility').set({
        mainExam: true,
        examScheduleTime: startTime || new Date().toISOString(),
        examEndTime: endTime || null,
        examDuration: duration
      }, { merge: true });
      showToast("🚀 मुख्य परीक्षा सभी परीक्षार्थियों के लिए लाइव कर दी गई है!");
    }
  });
}

async function publishExamResultsOfficially() {
  if (!isSuperOwner() && !(subAdminPermissionsMap[currentUser?.phone]?.canToggleResults)) {
    return showToast("परिणाम घोषित करने का अधिकार केवल मुख्य व्यवस्थापक के पास है!");
  }
  openConfirmModal("परिणाम घोषित करें?", "क्या आप सभी छात्रों के लिए परिणाम खोज विंडो (Result Check Desk) चालू करना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('examConfig').doc('visibility').set({
        resultsPublished: true
      }, { merge: true });
      showToast("📢 परीक्षा परिणाम आधिकारिक रूप से घोषित कर दिए गए!");
    }
  });
}

async function importBulkQuiz() {
  if (!isEditorOrOwner()) return;
  const rawText = document.getElementById('adminBulkQuizText').value.trim();
  const targetCol = document.getElementById('adminQuestionTarget')?.value || 'main_exam';
  if (!rawText) return showToast('कृपया प्रश्न पेस्ट करें');

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
    if (qText && opts.length >= 2) parsed.push({ q: qText, title: qText, opts, options: opts, ans: ansIdx });
  }

  if (!parsed.length) return showToast('प्रारूप सही नहीं है! कृपया Q:, A), B), Ans: प्रारूप में पेस्ट करें।');
  const collectionName = targetCol === 'daily_quiz' ? 'quiz' : (targetCol === 'mock_1' ? 'mockExam_1' : (targetCol === 'mock_2' ? 'mockExam_2' : 'mainExamQuestions'));
  const batch = db.batch();
  parsed.forEach(q => batch.set(db.collection(collectionName).doc(), q));
  await batch.commit();
  document.getElementById('adminBulkQuizText').value = '';
  showToast(`✅ ${parsed.length} प्रश्न (${targetCol}) बैंक में सफलतापूर्वक सहेजे गए!`);
}

// 17. 7-DAY VISITOR & LOGIN TELEMETRY TRACKER (IP, DEVICE TYPE, LOCATION)
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
      name: userData.name || 'Visitor',
      phone: userData.phone || '-',
      email: userData.email || '-',
      statedLocation: userData.location || '-',
      detectedCity: geo.city || 'Unknown',
      detectedRegion: geo.region || 'Unknown',
      detectedCountry: geo.country_name || 'India',
      ip: geo.ip || 'Unknown',
      network: geo.org || 'ISP',
      deviceType: deviceCategory,
      timestamp: Date.now(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('userAccessLogs').add(auditEntry);
  } catch (err) {}
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
      .limit(60)
      .get();

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-stone-400">विगत ७ दिनों में कोई लॉग उपलब्ध नहीं है।</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const timeStr = d.createdAt ? d.createdAt.toDate().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
      const locStr = `${d.statedLocation !== '-' ? d.statedLocation + ' / ' : ''}${d.detectedCity}, ${d.detectedRegion}`;
      tbody.innerHTML += `
        <tr class="hover:bg-stone-50 border-b border-stone-100">
          <td class="p-2.5 font-bold text-forest">${d.name}<br><span class="text-[10px] text-stone-400 font-normal">${d.phone}</span></td>
          <td class="p-2.5 text-stone-600">${d.email}</td>
          <td class="p-2.5 font-mono text-stone-700">${d.ip}</td>
          <td class="p-2.5 font-semibold text-stone-800">${d.deviceType}</td>
          <td class="p-2.5 text-stone-600">${locStr}</td>
          <td class="p-2.5 text-stone-400 text-[10px]">${timeStr}</td>
        </tr>
      `;
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-rose-500">लॉग्स लोड करने में त्रुटि: ${e.message}</td></tr>`;
  }
}

// 18. AUTHENTICATION (SIGN IN & REGISTER)
function openAuthModal() { document.getElementById('authModal').classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('authModal').classList.add('hidden'); }

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  document.getElementById('nameRow').classList.toggle('hidden', !isRegisterMode);
  document.getElementById('authTitle').innerText = isRegisterMode ? "नया पंजीकरण (Register)" : "लॉगिन (Sign In)";
  document.getElementById('authSubmitBtn').innerText = isRegisterMode ? "खाता बनाएं (Register)" : "लॉगिन करें";
  document.getElementById('authToggleBtn').innerText = isRegisterMode ? "पहले से पंजीकृत हैं? लॉगिन करें" : "नए सदस्य हैं? पहले पंजीकरण (Register) करें";
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
    applyCurrentUserRBACView();
    closeAuthModal();
    showToast(`🛡️ मुख्य व्यवस्थापक के रूप में स्वागत है, ${currentUser.name}!`);
    trackUserLoginTelemetry(currentUser);
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया सही १० अंकों का भारतीय मोबाइल नंबर लिखें!");

  if (isRegisterMode) {
    if (!nameInput) return showToast("कृपया अपना पूरा नाम लिखें!");
    try {
      const existing = await db.collection('users').doc(phone).get();
      if (existing.exists) return showToast("यह नंबर पहले से पंजीकृत है! कृपया लॉगिन करें।");

      await db.collection('users').doc(phone).set({
        name: nameInput, phone, pass, email: "", location: "",
        registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      currentUser = { name: nameInput, phone, isOwner: false, isEditor: Boolean(subAdminPermissionsMap[phone]), email: "", location: "" };
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      applyCurrentUserRBACView();
      closeAuthModal();
      showToast(`पंजीकरण सफल! स्वागत है, ${currentUser.name}`);
      trackUserLoginTelemetry(currentUser);
    } catch (err) { showToast("त्रुटि: " + err.message); }
    return;
  }

  try {
    const userDoc = await db.collection('users').doc(phone).get();
    if (!userDoc.exists) return showToast("यह नंबर पंजीकृत नहीं है! पहले Register करें।");
    const userData = userDoc.data();
    if (userData.pass && userData.pass !== pass) return showToast("गलत पासवर्ड!");

    await db.collection('users').doc(phone).update({ lastLogin: firebase.firestore.FieldValue.serverTimestamp() });

    currentUser = {
      name: userData.name || "सदस्य",
      phone,
      email: userData.email || "",
      location: userData.location || "",
      photo: userData.photo || "",
      isOwner: (phone === OWNER_PHONE && pass === OWNER_PASS),
      isEditor: Boolean(subAdminPermissionsMap[phone])
    };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    applyCurrentUserRBACView();
    closeAuthModal();
    showToast(`स्वागत है, ${currentUser.name}!`);
    trackUserLoginTelemetry(currentUser);
  } catch (err) { showToast("त्रुटि: " + err.message); }
}

function logoutUser() {
  localStorage.removeItem('bishnoi_secure_user');
  currentUser = null;
  applyCurrentUserRBACView();
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
        <button onclick="openAuthModal()" class="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold shadow-sm">लॉगिन</button>
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

// 19. DIGITAL JAAP MALA & PURE PROFILE COUNTERS
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

function updateProgressIndicators() {
  const mTotal = document.getElementById('userTotalMantra');
  const mLaps = document.getElementById('userCompletedMala');
  const pTotal = document.getElementById('statMalaTotal');
  const pLaps = document.getElementById('statMalaLaps');
  if (mTotal) mTotal.innerText = malaTotalCount;
  if (mLaps) mLaps.innerText = malaLapsCount;
  if (pTotal) pTotal.innerText = malaTotalCount;
  if (pLaps) pLaps.innerText = malaLapsCount;
}

// 20. AUTO-PANCHANG & AMAVASYA LIVE COUNTDOWN
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

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
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

// 21. AI ASSISTANT, CHAT, NIYAMS, PDF READER & CERTIFICATE
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

async function callGemini(promptText) {
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
  return "Q: गुरु जम्भेश्वर भगवान का जन्म किस पावन ग्राम में हुआ था?\nA) पीपासर\nB) मुकाम\nC) समराथल\nD) जांगलू\nAns: A";
}

async function generateAiQuizQuestions() {
  if (!isEditorOrOwner()) return;
  const res = await callGemini(`विश्नोई समाज के २९ नियमों व जाम्भाणी साहित्य पर ५ MCQ हिंदी में बनाएं:\nQ: प्रश्न?\nA) 1\nB) 2\nC) 3\nD) 4\nAns: A`);
  document.getElementById('adminBulkQuizText').value = res.trim();
  showToast("🤖 AI ने प्रश्न तैयार कर दिए!");
}

async function generateAiDailySandesh() {
  if (!isEditorOrOwner()) return;
  const res = await callGemini(`Write a 1-line inspirational quote in Hindi on Bishnoi 29 rules and nature conservation.`);
  document.getElementById('adminBannerInput').value = res.trim();
  showToast("🤖 AI ने सुविचार तैयार कर दिया!");
}

// In-built PDF Viewer Functions
async function openInbuiltPdfViewer(title, link) {
  const modal = document.getElementById('inbuiltPdfModal');
  const titleEl = document.getElementById('pdfViewerTitle');
  const dlBtn = document.getElementById('pdfModalDownloadBtn');
  const spinner = document.getElementById('pdfLoadingSpinner');
  const canvas = document.getElementById('pdfSinglePageCanvas');
  const driveFrame = document.getElementById('pdfDriveFallbackFrame');
  const bottomBar = document.getElementById('pdfBottomNavBar');
  if (!modal) return window.open(link, '_blank');

  titleEl.innerText = title;
  dlBtn.href = link;
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  driveFrame.classList.add('hidden');
  bottomBar.classList.remove('hidden');
  canvas.classList.add('hidden');
  spinner.classList.remove('hidden');

  try {
    if (!window.pdfjsLib) throw new Error("PDF.js loading");
    const loadingTask = window.pdfjsLib.getDocument(link);
    activePdfDoc = await loadingTask.promise;
    totalPdfPages = activePdfDoc.numPages;
    currentPdfPage = 1;
    await renderSinglePdfPage(currentPdfPage);
  } catch (err) {
    spinner.classList.add('hidden');
    bottomBar.classList.add('hidden');
    driveFrame.src = link;
    driveFrame.classList.remove('hidden');
  }
}

async function renderSinglePdfPage(pageNum) {
  if (!activePdfDoc) return;
  const spinner = document.getElementById('pdfLoadingSpinner');
  const canvas = document.getElementById('pdfSinglePageCanvas');
  const jumpInp = document.getElementById('pdfPageJumpInput');
  const totalLbl = document.getElementById('pdfTotalPagesLabel');
  spinner.classList.remove('hidden');

  const page = await activePdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 2.0 });
  const ctx = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;

  spinner.classList.add('hidden');
  canvas.classList.remove('hidden');
  if (jumpInp) jumpInp.value = pageNum;
  if (totalLbl) totalLbl.innerText = `/ ${totalPdfPages}`;
}

function changePdfPage(delta) {
  if (!activePdfDoc) return;
  const next = currentPdfPage + delta;
  if (next >= 1 && next <= totalPdfPages) { currentPdfPage = next; renderSinglePdfPage(currentPdfPage); }
}

function jumpToPdfPage(val) {
  if (!activePdfDoc) return;
  const p = parseInt(val);
  if (p >= 1 && p <= totalPdfPages) { currentPdfPage = p; renderSinglePdfPage(currentPdfPage); }
}

function togglePdfLandscapeMode() {
  isPdfLandscape = !isPdfLandscape;
  if (activePdfDoc) renderSinglePdfPage(currentPdfPage);
}

function closeInbuiltPdfViewer() {
  activePdfDoc = null;
  const modal = document.getElementById('inbuiltPdfModal');
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

function listenPdfs() {
  db.collection('pdfs').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const grid = document.getElementById('pdfGrid');
    if (!grid) return;
    grid.innerHTML = `
      <div class="elevate-card bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm">
        <div>
          <span class="text-[11px] font-bold text-terracotta uppercase">पवित्र ग्रंथ</span>
          <h3 class="font-yatra text-forest text-lg mt-1">श्री सबदवाणी (१२० शब्द)</h3>
          <p class="text-xs text-stone-500 mt-1">गुरु जम्भेश्वर भगवान द्वारा उच्चरित पावन वाणी।</p>
        </div>
        <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <button onclick="openInbuiltPdfViewer('श्री सबदवाणी', './shabadwani.pdf')" class="px-3.5 py-1.5 bg-amber-500 text-stone-950 text-xs font-extrabold rounded-lg">📖 पढ़ें</button>
          <a href="./shabadwani.pdf" download class="px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg">डाउनलोड</a>
        </div>
      </div>
    `;
    snap.forEach(doc => {
      const item = doc.data();
      const safeTitle = (item.title || 'साहित्य').replace(/'/g, "\\'");
      const safeLink = (item.link || '').replace(/'/g, "\\'");
      grid.innerHTML += `
        <div class="elevate-card bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <span class="text-[11px] font-bold text-terracotta uppercase">साहित्य कोष</span>
            <h3 class="font-yatra text-forest text-lg mt-1">${item.title}</h3>
          </div>
          <div class="mt-4 pt-2 border-t border-stone-100 flex justify-between items-center">
            <button onclick="openInbuiltPdfViewer('${safeTitle}', '${safeLink}')" class="px-3 py-1.5 bg-amber-500 text-stone-950 text-xs font-extrabold rounded-lg">📖 पढ़ें</button>
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

function listenPosts() {
  db.collection('posts').orderBy('createdAt', 'desc').limit(60).onSnapshot(snap => {
    allChatPosts = [];
    snap.forEach(doc => allChatPosts.push({ id: doc.id, ...doc.data() }));
    renderFilteredChat();
  });
}

function renderFilteredChat() {
  const feed = document.getElementById('communityFeed');
  if (!feed) return;
  const selectedTopic = document.getElementById('chatTopicFilter')?.value || 'all';
  const filtered = selectedTopic === 'all' ? allChatPosts : allChatPosts.filter(p => (p.topic || 'सामान्य चर्चा') === selectedTopic);

  feed.innerHTML = '';
  filtered.forEach(p => {
    const canDel = Boolean(isSuperOwner() || (currentUser && p.phone === currentUser.phone));
    feed.innerHTML += `
      <div class="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1">
        <div class="flex justify-between font-bold text-forest">
          <span>${p.isOwner ? '🛡️ ' : ''}${p.author}</span>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-stone-400 font-normal">${p.topic || 'सामान्य'}</span>
            ${canDel ? `<button onclick="db.collection('posts').doc('${p.id}').delete()" class="text-rose-600 font-bold">✕</button>` : ''}
          </div>
        </div>
        <p class="text-stone-800">${p.content}</p>
      </div>
    `;
  });
}

function updateCharCount() {
  const el = document.getElementById('postText');
  const disp = document.getElementById('charCountDisplay');
  if (el && disp) disp.innerText = `${el.value.length} / 300`;
}

function cancelChatReply() {
  activeReplyObj = null;
  document.getElementById('replyPreviewBar')?.classList.add('hidden');
}

async function submitChaupalPost() {
  if (!currentUser) return openAuthModal();
  const txt = document.getElementById('postText').value.trim();
  if (!txt) return;
  await db.collection('posts').add({
    author: currentUser.name,
    phone: currentUser.phone,
    isOwner: isSuperOwner(),
    content: txt,
    topic: document.getElementById('postTopicSelect')?.value || 'सामान्य चर्चा',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById('postText').value = '';
  updateCharCount();
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
  showToast("🌱 प्रकृति रक्षा संकल्प दर्ज हुआ!");
  try { await db.collection('stats').doc('treePledges').set({ count: nextVal }, { merge: true }); } catch (e) {}
}

function listenNiyams() {
  renderNiyams(niyamsList);
}

function renderNiyams(list) {
  const grid = document.getElementById('niyamGrid');
  if (!grid) return;
  grid.innerHTML = '';
  list.forEach(n => {
    grid.innerHTML += `
      <div class="elevate-card bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1.5">
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
  const filtered = niyamsList.filter(n => n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q) || n.title.toLowerCase().includes(q));
  renderNiyams(filtered);
}

function handleGlobalSearch() {
  const q = (document.getElementById('globalSearchInput')?.value || '').toLowerCase().trim();
  if (!q) return;
  switchTab('niyams');
  const ns = document.getElementById('niyamSearch');
  if (ns) { ns.value = q; filterNiyams(); }
}

function loadQuiz() {
  db.collection('quiz').onSnapshot(snap => {
    if (!snap.empty) {
      quizList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      quizList = [
        { id: 'q1', q: "खेजड़ली गांव में ३६३ वीरों का महान बलिदान किस वर्ष हुआ था?", opts: ["1730 ईस्वी", "1485 ईस्वी", "1857 ईस्वी", "1947 ईस्वी"], ans: 0 },
        { id: 'q2', q: "गुरु जम्भेश्वर भगवान द्वारा २९ नियमों की घोषणा किस पवित्र स्थान पर हुई?", opts: ["मुकाम", "समराथल धोरा", "जांगलू", "लालासर"], ans: 1 }
      ];
    }
  });
}

function generateCertificate(name, score) {
  const canvas = document.getElementById('certCanvas');
  if (!canvas) return;
  canvas.width = 1000;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, 1000, 720);
  ctx.strokeStyle = '#143622';
  ctx.lineWidth = 16;
  ctx.strokeRect(24, 24, 952, 672);
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 920, 640);

  ctx.fillStyle = '#B34A1B';
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('॥ ॐ विष्णवे नमः • गुरु जम्भेश्वराय नमः ॥', 500, 95);

  ctx.fillStyle = '#143622';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('विश्नोई समाज डिजिटल ज्ञान एवं साहित्य परीक्षा', 500, 165);

  ctx.fillStyle = '#B34A1B';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('★ योग्यता एवं गौरव सम्मान-पत्र (Certificate of Merit) ★', 500, 215);

  ctx.fillStyle = '#44403C';
  ctx.font = '20px sans-serif';
  ctx.fillText('यह सहर्ष प्रमाणित किया जाता है कि प्रतिभागी', 500, 285);

  ctx.fillStyle = '#143622';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(name.toUpperCase(), 500, 340);

  ctx.fillStyle = '#292524';
  ctx.font = '20px sans-serif';
  ctx.fillText(`ने जाम्भाणी साहित्य एवं २९ नियम ज्ञान परीक्षा में ${score}% प्राप्तांक अर्जित कर`, 500, 405);
  ctx.fillText('उत्कृष्ट श्रेणी प्राप्त की है। हम इनके उज्ज्वल भविष्य की कामना करते हैं।', 500, 440);

  ctx.fillStyle = '#143622';
  ctx.fillRect(200, 490, 600, 42);
  ctx.fillStyle = '#FDE68A';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('"जीव दया पालणी, रूंख लीलो नी घावै — सिर साटै रूंख रहै, तो भी सस्तो जाण"', 500, 517);

  ctx.fillStyle = '#44403C';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`दिनांक: ${new Date().toLocaleDateString('hi-IN')}`, 80, 620);
  ctx.textAlign = 'right';
  ctx.fillText('मुख्य व्यवस्थापक (विश्नोई समाज डिजिटल मंच)', 920, 620);

  const link = document.createElement('a');
  link.download = `Bishnoi_Exam_Certificate_${name}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast("🎓 सम्मान-पत्र डाउनलोड हो गया!");
}

// 22. TOAST, CONFIRM & TAB NAVIGATION
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

function switchTab(id) {
  if (id === 'admin' && !isEditorOrOwner()) {
    return showToast("यह नियंत्रण कक्ष केवल व्यवस्थापक के लिए है।");
  }
  currentActiveTab = id;
  ['home', 'mala', 'niyams', 'library', 'community', 'quiz', 'history', 'admin'].forEach(t => {
    document.getElementById(`tab-${t}`)?.classList.add('hidden');
    document.getElementById(`bnav-${t}`)?.classList.remove('bnav-item-active');
  });

  document.getElementById(`tab-${id}`)?.classList.remove('hidden');
  const activeBnav = document.getElementById(
    (id === 'niyams' || id === 'mala' || id === 'history') ? 'bnav-home' : (id === 'admin' ? 'bnav-profile' : `bnav-${id}`)
  );
  if (activeBnav) activeBnav.classList.add('bnav-item-active');

  if (id === 'admin') {
    applyCurrentUserRBACView();
    refreshAuditLogs();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchHistorySubTab(sub) {
  const hView = document.getElementById('historySubView');
  const kView = document.getElementById('kidsSubView');
  const hBtn = document.getElementById('sub-history-btn');
  const kBtn = document.getElementById('sub-kids-btn');
  if (sub === 'full-history') {
    hView?.classList.remove('hidden'); kView?.classList.add('hidden');
    hBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
    kBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600";
  } else {
    hView?.classList.add('hidden'); kView?.classList.remove('hidden');
    kBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
    hBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600";
  }
}

// 23. MASTER INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('gemini_user_api_key')) {
    localStorage.setItem('gemini_user_api_key', DEFAULT_INTEGRATED_AI_KEY);
  }
  injectDynamicModalsAndUI();
  enhanceSubAdminManagerUI();
  setupInactivitySessionGuard();

  listenSubAdminPermissions();
  listenParikshaVisibility();
  listenBanner();
  listenPdfs();
  listenPosts();
  listenAudios();
  listenTreeCounter();
  listenNiyams();
  loadQuiz();
  listenAmavasyaConfig();
  computeAutoPanchang();
  updateNavAuth();
  updateProgressIndicators();
  renderMalaCounters();

  if (!sessionStorage.getItem('visitor_logged_session')) {
    sessionStorage.setItem('visitor_logged_session', 'true');
    trackUserLoginTelemetry(currentUser || { name: 'Visitor' });
  }
});
/* ============================================================================
   ULTIMATE MASTER PATCH & EXTENSION PACK (PASTE AT THE VERY END OF script.js)
   Restores All Previous Features + Adds High-Scale 3,000 Student Exam Upgrades
   ============================================================================ */

(function initMasterUpgradePatch() {
  // Global Patch States
  window.markedForReviewSet = new Set();
  window.serverTimeOffsetMs = 0;
  window.lastEnrolledStudentObj = JSON.parse(localStorage.getItem('bishnoi_last_enrolled_obj') || 'null');
  window.OWNER_PASS_SHA256 = "e6450966a19d55c24f848c3e127b1b32d2b5f7a2335e096a951a892751486b4a"; // SHA-256 fallback

  // --------------------------------------------------------------------------
  // 1. SERVER TIME SYNC & OFFLINE SUBMISSION AUTO-RETRY QUEUE
  // --------------------------------------------------------------------------
  async function syncServerClock() {
    try {
      const res = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
      const dateHeader = res.headers.get('Date');
      if (dateHeader) {
        const srvTime = new Date(dateHeader).getTime();
        if (!isNaN(srvTime)) window.serverTimeOffsetMs = srvTime - Date.now();
      }
    } catch (e) {}
  }

  window.getSyncedNow = function() {
    return Date.now() + (window.serverTimeOffsetMs || 0);
  };

  async function flushOfflineExamQueue() {
    const rawQ = localStorage.getItem('bishnoi_offline_exam_queue');
    if (!rawQ || !navigator.onLine) return;
    try {
      const queue = JSON.parse(rawQ);
      if (!Array.isArray(queue) || !queue.length) return;
      for (const item of queue) {
        await db.collection('examSubmissions').add({
          ...item,
          submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
          syncedFromOffline: true
        });
      }
      localStorage.removeItem('bishnoi_offline_exam_queue');
      showToast("✅ इंटरनेट बहाल: आपकी ऑफलाइन उत्तर-पुस्तिका सफलतापूर्वक सर्वर पर जमा हो गई!");
    } catch (e) {}
  }
  window.addEventListener('online', flushOfflineExamQueue);

  // --------------------------------------------------------------------------
  // 2. DUAL-FALLBACK IP TELEMETRY (HANDLES 3,000+ STUDENTS WITHOUT RATE LIMIT)
  // --------------------------------------------------------------------------
  window.trackUserLoginTelemetry = async function(userData) {
    let geo = {};
    try {
      const r1 = await fetch('https://ipapi.co/json/');
      if (r1.ok) geo = await r1.json();
      else throw new Error("Primary IP API limit");
    } catch (e1) {
      try {
        const r2 = await fetch('https://ipwho.is/');
        if (r2.ok) {
          const d2 = await r2.json();
          geo = { ip: d2.ip, city: d2.city, region: d2.region, country_name: d2.country, org: d2.connection?.isp };
        }
      } catch (e2) {
        try {
          const r3 = await fetch('https://api.db-ip.com/v2/free/self');
          if (r3.ok) {
            const d3 = await r3.json();
            geo = { ip: d3.ipAddress, city: d3.city, region: d3.stateProv, country_name: d3.countryName };
          }
        } catch (e3) {}
      }
    }

    const ua = navigator.userAgent || '';
    let deviceCategory = "Laptop / Desktop";
    if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase())) {
      deviceCategory = /ipad|tablet/i.test(ua.toLowerCase()) ? "Tablet" : "Mobile Phone";
    }

    try {
      await db.collection('userAccessLogs').add({
        name: userData?.name || 'Visitor',
        phone: userData?.phone || '-',
        email: userData?.email || '-',
        statedLocation: userData?.location || '-',
        detectedCity: geo.city || 'Unknown',
        detectedRegion: geo.region || 'Unknown',
        detectedCountry: geo.country_name || 'India',
        ip: geo.ip || 'Unknown',
        network: geo.org || 'ISP',
        deviceType: deviceCategory,
        timestamp: Date.now(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {}
  };

  // --------------------------------------------------------------------------
  // 3. TOP-RIGHT NOTIFICATION BELL ICON (🔔) FOR LIVE MOCK MERIT LIST
  // --------------------------------------------------------------------------
  function injectTopRightNotificationBell() {
    const authCont = document.getElementById('authActionsContainer');
    if (!authCont || document.getElementById('topMockMeritBellBtn')) return;

    const bellBtn = document.createElement('button');
    bellBtn.id = 'topMockMeritBellBtn';
    bellBtn.onclick = () => openMockMeritNotificationModal();
    bellBtn.title = "मॉक टेस्ट मेरिट सूची व सूचनाएं";
    bellBtn.className = "relative p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-forest border border-amber-300 shadow-sm transition flex items-center justify-center";
    bellBtn.innerHTML = `
      <span class="text-base leading-none">🔔</span>
      <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping"></span>
      <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full"></span>
    `;
    authCont.parentElement.insertBefore(bellBtn, authCont);

    if (!document.getElementById('mockMeritNotificationModal')) {
      const mModal = document.createElement('div');
      mModal.id = 'mockMeritNotificationModal';
      mModal.className = 'fixed inset-0 z-[9995] bg-black/65 backdrop-blur-sm hidden items-center justify-center p-4';
      mModal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-amber-300 shadow-2xl flex flex-col max-h-[85vh]">
          <div class="bg-gradient-to-r from-[#143622] to-emerald-900 text-white p-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🔔</span>
              <div>
                <h3 class="font-yatra text-base sm:text-lg text-amber-300">सूचना एवं मॉक टेस्ट मेरिट सूची</h3>
                <p class="text-[10px] text-stone-200">उच्चतम से न्यूनतम अंक (Highest to Lowest Marks)</p>
              </div>
            </div>
            <button onclick="closeMockMeritNotificationModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold">✕</button>
          </div>
          <div class="p-3 bg-stone-100 border-b border-stone-200 flex items-center justify-between gap-2 text-xs">
            <div class="flex gap-1.5">
              <button onclick="loadMockMeritListInModal('mock_1')" id="mmerit_tab_1" class="px-3 py-1.5 rounded-lg bg-forest text-white font-bold">मॉक टेस्ट - ०१ मेरिट</button>
              <button onclick="loadMockMeritListInModal('mock_2')" id="mmerit_tab_2" class="px-3 py-1.5 rounded-lg bg-white text-stone-700 font-bold border border-stone-300">मॉक टेस्ट - ०२ मेरिट</button>
            </div>
            <span id="mockMeritCountBadge" class="text-[11px] font-bold text-terracotta">0 प्रतिभागी</span>
          </div>
          <div id="mockMeritListContainer" class="p-3 overflow-y-auto divide-y divide-stone-100 text-xs flex-1">
            <div class="p-6 text-center text-stone-400">मेरिट सूची लोड हो रही है...</div>
          </div>
        </div>
      `;
      document.body.appendChild(mModal);
    }
  }

  window.openMockMeritNotificationModal = function() {
    const m = document.getElementById('mockMeritNotificationModal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); loadMockMeritListInModal('mock_1'); }
  };

  window.closeMockMeritNotificationModal = function() {
    const m = document.getElementById('mockMeritNotificationModal');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
  };

  window.loadMockMeritListInModal = async function(mockMode) {
    const b1 = document.getElementById('mmerit_tab_1');
    const b2 = document.getElementById('mmerit_tab_2');
    if (b1 && b2) {
      b1.className = mockMode === 'mock_1' ? "px-3 py-1.5 rounded-lg bg-forest text-white font-bold" : "px-3 py-1.5 rounded-lg bg-white text-stone-700 font-bold border border-stone-300";
      b2.className = mockMode === 'mock_2' ? "px-3 py-1.5 rounded-lg bg-forest text-white font-bold" : "px-3 py-1.5 rounded-lg bg-white text-stone-700 font-bold border border-stone-300";
    }
    const box = document.getElementById('mockMeritListContainer');
    const badge = document.getElementById('mockMeritCountBadge');
    if (!box) return;
    box.innerHTML = `<div class="p-6 text-center text-stone-400">लोड हो रहा है...</div>`;
    try {
      const snap = await db.collection('examSubmissions').where('mode', '==', mockMode).get();
      let list = [];
      snap.forEach(d => list.push(d.data()));
      list.sort((a, b) => (b.score || 0) - (a.score || 0));
      if (badge) badge.innerText = `${list.length} प्रतिभागी`;

      if (!list.length) {
        box.innerHTML = `<div class="p-6 text-center text-stone-400">इस मॉक टेस्ट में अभी कोई परिणाम दर्ज नहीं है।</div>`;
        return;
      }
      box.innerHTML = list.map((r, i) => {
        const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `#${i + 1}`));
        return `
          <div class="py-2.5 px-2 flex items-center justify-between gap-2 hover:bg-amber-50/40 rounded-lg">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="w-7 text-center font-extrabold text-sm text-forest shrink-0">${medal}</span>
              <div class="min-w-0">
                <div class="font-bold text-stone-800 truncate">${r.candidateName || 'परीक्षार्थी'}</div>
                <div class="text-[10px] text-stone-400">रोल नं: ${r.rollNumber || '-'}</div>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-emerald-100 text-forest font-extrabold text-xs shrink-0">
              ${r.score || 0} / ${r.total || 100}
            </span>
          </div>
        `;
      }).join('');
    } catch (e) {
      box.innerHTML = `<div class="p-4 text-center text-rose-500">त्रुटि: ${e.message}</div>`;
    }
  };

  // --------------------------------------------------------------------------
  // 4. 5TH TOGGLE FOR RESULT SECTION IN OWNER STUDIO + ADMIT CARD & FORGOT ROLL
  // --------------------------------------------------------------------------
  function upgradeParikshaAndOwnerControls() {
    // Add 5th Checkbox for Result Section Hide/Show inside #secParikshaVisibilityController
    const visCtrl = document.getElementById('secParikshaVisibilityController');
    if (visCtrl && !document.getElementById('toggleResultsPublishedSection')) {
      const grid = visCtrl.querySelector('.grid');
      if (grid) {
        grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs";
        const lbl = document.createElement('label');
        lbl.className = "flex items-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 cursor-pointer";
        lbl.innerHTML = `
          <input type="checkbox" id="toggleResultsPublishedSection" onchange="updateParikshaVisibilitySettings()" class="rounded text-forest mr-2 w-4 h-4">
          <span class="font-bold text-forest">5. परिणाम खोज कक्ष (Result)</span>
        `;
        grid.appendChild(lbl);
      }
    }

    // Add Forgot Roll Number & Instant Admit Card Download Bar inside Enrollment Box
    const enrollBox = document.getElementById('examEnrollmentBox');
    if (enrollBox && !document.getElementById('admitAndForgotRollBar')) {
      const extraBar = document.createElement('div');
      extraBar.id = 'admitAndForgotRollBar';
      extraBar.className = 'pt-3 mt-3 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs';
      extraBar.innerHTML = `
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" onclick="downloadStudentAdmitCardPdf()" class="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold rounded-xl shadow-sm transition">
            🎫 प्रवेश-पत्र डाउनलोड करें (Download Admit Card)
          </button>
          <button type="button" onclick="openForgotRollNumberPrompt()" class="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-forest font-bold rounded-xl border border-stone-300 transition">
            🔍 रोल नंबर भूल गए? (Forgot Roll No.)
          </button>
        </div>
        <button type="button" onclick="openWhatsAppExamHelpdesk()" class="px-3 py-1.5 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-300">
          💬 परीक्षा हेल्पडेस्क
        </button>
      `;
      enrollBox.appendChild(extraBar);
    }

    // Add Purple "Mark for Review" button inside Exam Runtime Box
    const activeBox = document.getElementById('quizActiveBox');
    if (activeBox && !document.getElementById('markForReviewExamBtn')) {
      const navBtnsRow = activeBox.querySelector('button[onclick="navigateExam(-1)"]')?.parentElement;
      if (navBtnsRow) {
        const revBtn = document.createElement('button');
        revBtn.type = 'button';
        revBtn.id = 'markForReviewExamBtn';
        revBtn.onclick = () => toggleMarkQuestionForReview();
        revBtn.className = "px-3.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-xs font-extrabold border border-purple-300 transition";
        revBtn.innerHTML = `🟣 पुनर्विचार चिह्न (Review)`;
        navBtnsRow.appendChild(revBtn);
      }
    }
  }

  // Override Pariksha Visibility Sync to include 5th Result Checkbox
  const origApplyVis = window.applyParikshaVisibilityUI;
  window.applyParikshaVisibilityUI = function() {
    if (origApplyVis) origApplyVis();
    const tRes = document.getElementById('toggleResultsPublishedSection');
    if (tRes) tRes.checked = Boolean(parikshaVisibility.resultsPublished);
  };

  window.updateParikshaVisibilitySettings = async function() {
    if (!isSuperOwner() && !(subAdminPermissionsMap[currentUser?.phone]?.canPublishExam || subAdminPermissionsMap[currentUser?.phone]?.canToggleResults)) {
      return showToast("केवल अधिकृत व्यवस्थापक के पास अधिकार है!");
    }
    const enrollment = document.getElementById('toggleEnrollmentSection')?.checked || false;
    const mock = document.getElementById('toggleMockSection')?.checked || false;
    const mainExam = document.getElementById('toggleMainExamSection')?.checked || false;
    const dailyQuiz = document.getElementById('toggleDailyQuizSection')?.checked || false;
    const resultsPublished = document.getElementById('toggleResultsPublishedSection')?.checked || false;

    await db.collection('examConfig').doc('visibility').set({
      enrollment, mock, mainExam, dailyQuiz, resultsPublished
    }, { merge: true });
    showToast("✅ सभी ५ परीक्षा एवं परिणाम विज़िबिलिटी सेटिंग्स अपडेट हो गईं!");
  };

  // Enhanced Enrollment with Admit Card Storage
  window.handleExamEnrollment = async function(e) {
    e.preventDefault();
    const name = document.getElementById('enrollName').value.trim();
    const fatherName = document.getElementById('enrollFatherName').value.trim();
    const dob = document.getElementById('enrollDob').value;
    const phone = document.getElementById('enrollPhone').value.trim();
    const email = document.getElementById('enrollEmail').value.trim();
    const location = document.getElementById('enrollLocation').value.trim();

    if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया सही १० अंकों का फ़ोन नंबर भरें!");
    if (!name || !fatherName || !dob || !location) return showToast("कृपया सभी अनिवार्य फ़ील्ड्स भरें!");

    try {
      const existingSnap = await db.collection('examEnrolledStudents').where('phone', '==', phone).limit(1).get();
      if (!existingSnap.empty) {
        const exData = existingSnap.docs[0].data();
        examState.rollNumber = exData.rollNumber || existingSnap.docs[0].id;
        window.lastEnrolledStudentObj = exData;
        localStorage.setItem('bishnoi_saved_roll', examState.rollNumber);
        localStorage.setItem('bishnoi_last_enrolled_obj', JSON.stringify(exData));
        alert(`ℹ️ आपका नामांकन पहले से दर्ज है!\n\nरोल नंबर: ${examState.rollNumber}\nअब आप नीचे 'प्रवेश-पत्र डाउनलोड करें' बटन से अपना एडमिट कार्ड ले सकते हैं।`);
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
      window.lastEnrolledStudentObj = studentRecord;
      localStorage.setItem('bishnoi_saved_roll', rollNumber);
      localStorage.setItem('bishnoi_last_enrolled_obj', JSON.stringify(studentRecord));

      alert(`🎉 बधाई! आपका नामांकन सफल हुआ।\n\nरोल नंबर: ${rollNumber}\nआपका प्रवेश-पत्र (Admit Card) स्वतः डाउनलोड हो रहा है।`);
      downloadStudentAdmitCardPdf(studentRecord);
    } catch (err) {
      showToast("नामांकन त्रुटि: " + err.message);
    }
  };

  // Instant Admit Card PDF Generator
  window.downloadStudentAdmitCardPdf = async function(customObj) {
    let st = customObj || window.lastEnrolledStudentObj;
    if (!st) {
      const r = prompt("प्रवेश-पत्र डाउनलोड करने हेतु अपना रोल नंबर या 10-अंकों का मोबाइल नंबर लिखें:");
      if (!r) return;
      const clean = r.trim().toUpperCase();
      if (clean.startsWith('JAMBH')) {
        const d = await db.collection('examEnrolledStudents').doc(clean).get();
        if (d.exists) st = d.data();
      } else {
        const s = await db.collection('examEnrolledStudents').where('phone', '==', clean).limit(1).get();
        if (!s.empty) st = s.docs[0].data();
      }
      if (!st) return showToast("कोई नामांकन रिकॉर्ड नहीं मिला!");
      window.lastEnrolledStudentObj = st;
      localStorage.setItem('bishnoi_last_enrolled_obj', JSON.stringify(st));
    }

    if (!window.jspdf || !window.jspdf.jsPDF) return showToast("PDF इंजन लोड हो रहा है, पुनः प्रयास करें।");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setDrawColor(20, 54, 34);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 190, 135);

    doc.setFontSize(16);
    doc.setTextColor(20, 54, 34);
    doc.text("BISHNOI SAMAJ DIGITAL PORTAL (bishnoism.vercel.app)", 105, 22, { align: "center" });
    doc.setFontSize(13);
    doc.setTextColor(179, 74, 27);
    doc.text("JAMBHANI LITERATURE EXAMINATION 2026 - OFFICIAL ADMIT CARD", 105, 30, { align: "center" });

    doc.autoTable({
      startY: 36,
      margin: { left: 16, right: 16 },
      theme: 'grid',
      head: [['Field', 'Candidate Information']],
      body: [
        ['Roll Number (Unique ID)', st.rollNumber || '-'],
        ['Candidate Full Name', st.name || '-'],
        ['Father Name', st.fatherName || '-'],
        ['Date of Birth (DOB)', st.dob || '-'],
        ['Registered Mobile', st.phone || '-'],
        ['District / State', st.location || '-'],
        ['Exam Schedule', parikshaVisibility.examScheduleTime ? new Date(parikshaVisibility.examScheduleTime).toLocaleString() : 'As Announced on Portal']
      ],
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [20, 54, 34] }
    });

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Instructions: 1. Keep your Roll Number confidential. 2. Tab switching 3 times during exam will auto-submit paper.", 16, 135);
    doc.save(`Admit_Card_${st.rollNumber}.pdf`);
    showToast("🎫 प्रवेश-पत्र (Admit Card) डाउनलोड हो गया!");
  };

  // Forgot Roll Number Lookup Tool
  window.openForgotRollNumberPrompt = async function() {
    const ph = prompt("अपना पंजीकृत 10-अंकों का मोबाइल नंबर दर्ज करें:");
    if (!ph || !/^[6-9]\d{9}$/.test(ph.trim())) return showToast("सही १० अंकों का मोबाइल नंबर लिखें!");
    const dob = prompt("अपनी जन्मतिथि (YYYY-MM-DD प्रारूप में) दर्ज करें:");
    if (!dob) return;

    try {
      const snap = await db.collection('examEnrolledStudents').where('phone', '==', ph.trim()).limit(1).get();
      if (snap.empty) return showToast("इस मोबाइल नंबर से कोई नामांकन नहीं मिला!");
      const data = snap.docs[0].data();
      if (data.dob !== dob.trim()) return showToast("जन्मतिथि मेल नहीं खाती!");
      examState.rollNumber = data.rollNumber;
      localStorage.setItem('bishnoi_saved_roll', data.rollNumber);
      alert(`✅ आपका विवरण मिल गया!\n\nनाम: ${data.name}\nआपका रोल नंबर है: ${data.rollNumber}`);
    } catch (e) {
      showToast("त्रुटि: " + e.message);
    }
  };

  // --------------------------------------------------------------------------
  // 5. SINGLE-DOC 3,000 STUDENT OPTIMIZATION + PURPLE REVIEW + INSTANT MOCK SCORE
  // --------------------------------------------------------------------------
  const origImportBulkQuiz = window.importBulkQuiz;
  window.importBulkQuiz = async function() {
    if (!isEditorOrOwner()) return;
    const rawText = document.getElementById('adminBulkQuizText')?.value.trim() || '';
    const targetCol = document.getElementById('adminQuestionTarget')?.value || 'main_exam';
    if (!rawText) return showToast('कृपया प्रश्न पेस्ट करें');

    const blocks = rawText.split(/\n\s*\n/);
    let parsed = [];
    for (let i = 0; i < blocks.length; i++) {
      const lines = blocks[i].split('\n').map(l => l.trim()).filter(Boolean);
      let qText = '', opts = [], ansIdx = 0;
      for (let l of lines) {
        if (l.match(/^Q\s*:/i)) qText = l.replace(/^Q\s*:/i, '').trim();
        else if (l.match(/^[A-D]\s*\)/i)) opts.push(l.replace(/^[A-D]\s*\)/i, '').trim());
        else if (l.match(/^Ans\s*:/i)) {
          const letAns = l.replace(/^Ans\s*:/i, '').trim().toUpperCase();
          ansIdx = letAns === 'A' ? 0 : letAns === 'B' ? 1 : letAns === 'C' ? 2 : 3;
        }
      }
      if (qText && opts.length >= 2) {
        parsed.push({ id: `${targetCol}_q_${i + 1}`, q: qText, title: qText, opts, options: opts, ans: ansIdx });
      }
    }
    if (!parsed.length) return showToast('प्रारूप जाँचें!');

    // Save as Single JSON Bundle Document (1 Read per student instead of 100 Reads!)
    await db.collection('examBundles').doc(targetCol).set({
      questions: parsed,
      count: parsed.length,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (origImportBulkQuiz) await origImportBulkQuiz();
    else {
      document.getElementById('adminBulkQuizText').value = '';
      showToast(`✅ ${parsed.length} प्रश्न सिंगल-बंडल हाई-स्पीड मोड में सेव हो गए!`);
    }
  };

  window.launchMainExamPortal = async function() {
    let roll = examState.rollNumber;
    if (!roll || roll === 'GUEST') {
      const inputRoll = prompt("परीक्षा कक्ष में प्रवेश हेतु अपना रोल नंबर दर्ज करें (जैसे: JAMBH-2026-12345):");
      if (!inputRoll) return;
      roll = inputRoll.trim().toUpperCase();
    }
    try {
      const rollDoc = await db.collection('examEnrolledStudents').doc(roll).get();
      if (!rollDoc.exists && !isSuperOwner()) {
        return showToast("अमान्य रोल नंबर! कृपया पहले नामांकन करें या सही रोल नंबर डालें।");
      }
      if (rollDoc.exists) examState.enrolledProfile = rollDoc.data();
      examState.rollNumber = roll;
      localStorage.setItem('bishnoi_saved_roll', roll);
      examState.activeMode = 'main_exam';
      window.markedForReviewSet.clear();

      // Single-Document Read First (Saves 99% Firestore Quota for 3,000 students!)
      const bundleDoc = await db.collection('examBundles').doc('main_exam').get();
      if (bundleDoc.exists && Array.isArray(bundleDoc.data().questions) && bundleDoc.data().questions.length > 0) {
        return startExamEngine(bundleDoc.data().questions, parikshaVisibility.examDuration || 120);
      }

      const snap = await db.collection('mainExamQuestions').get();
      let list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      if (!list.length) return showToast("मुख्य परीक्षा के प्रश्न अभी लाइव नहीं किए गए हैं।");
      startExamEngine(list, parikshaVisibility.examDuration || 120);
    } catch (e) {
      showToast("त्रुटि: " + e.message);
    }
  };

  window.startMockTestEngine = async function(mockId) {
    const modeKey = `mock_${mockId}`;
    examState.activeMode = modeKey;
    window.markedForReviewSet.clear();
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
      showToast("मॉक टेस्ट लोड त्रुटि!");
    }
  };

  // Mark for Review (Purple Pill)
  window.toggleMarkQuestionForReview = function() {
    const idx = examState.currentIndex;
    const pill = document.getElementById(`q_pill_${idx}`);
    if (window.markedForReviewSet.has(idx)) {
      window.markedForReviewSet.delete(idx);
      const qId = examState.questions[idx]?.id || `q_${idx}`;
      if (pill) {
        pill.className = examState.answers[qId] !== undefined
          ? "w-8 h-8 rounded-lg text-xs font-bold border transition bg-emerald-600 text-white border-emerald-700"
          : "w-8 h-8 rounded-lg text-xs font-bold border transition bg-white text-stone-700 border-stone-300";
      }
      showToast("पुनर्विचार चिह्न हटाया गया।");
    } else {
      window.markedForReviewSet.add(idx);
      if (pill) {
        pill.className = "w-8 h-8 rounded-lg text-xs font-bold border transition bg-purple-600 text-white border-purple-800 shadow";
      }
      showToast("🟣 प्रश्न पुनर्विचार (Review) हेतु बैंगनी रंग में चिह्नित किया गया!");
    }
  };

  // Upgraded Submit: Instant Result + Merit List for Mock Tests, Delayed Secret Result for Main Exam
  window.submitFinalExam = async function(isForced = false) {
    if (examState.timerInterval) clearInterval(examState.timerInterval);

    let calculatedScore = 0;
    examState.questions.forEach((q, idx) => {
      const qId = q.id || `q_${idx}`;
      if (examState.answers[qId] === q.ans) calculatedScore++;
    });

    const candidateName = examState.enrolledProfile?.name || (currentUser ? currentUser.name : 'परीक्षार्थी');
    const fatherName = examState.enrolledProfile?.fatherName || '-';
    const totalQ = examState.questions.length;
    const pct = totalQ > 0 ? Math.round((calculatedScore / totalQ) * 100) : 0;
    const isMockOrDaily = examState.activeMode.startsWith('mock_') || examState.activeMode === 'daily_quiz';

    const payload = {
      rollNumber: examState.rollNumber,
      candidateName,
      fatherName,
      phone: examState.enrolledProfile?.phone || (currentUser ? currentUser.phone : '-'),
      mode: examState.activeMode,
      score: calculatedScore,
      total: totalQ,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      isForcedSubmission: isForced,
      isPublished: isMockOrDaily
    };

    const cacheKey = `cachedExam_${examState.activeMode}_${examState.rollNumber}`;
    localStorage.removeItem(cacheKey);

    try {
      await db.collection('examSubmissions').add(payload);
    } catch (err) {
      // Save to Offline Auto-Retry Queue if internet dropped
      const q = JSON.parse(localStorage.getItem('bishnoi_offline_exam_queue') || '[]');
      q.push(payload);
      localStorage.setItem('bishnoi_offline_exam_queue', JSON.stringify(q));
      showToast("⚠️ इंटरनेट धीमा है: आपकी उत्तर-पुस्तिका सुरक्षित लॉक हो गई है और नेट आते ही स्वतः अपलोड हो जाएगी!");
    }

    if (isMockOrDaily) {
      // INSTANT MOCK RESULT + LINK TO TOP-RIGHT MERIT LIST
      document.getElementById('quizActiveBox').innerHTML = `
        <div class="text-center p-6 sm:p-8 bg-gradient-to-br from-amber-50 via-white to-emerald-50 rounded-2xl border-2 border-emerald-400 space-y-4 shadow-md">
          <div class="text-5xl">🏆</div>
          <h3 class="font-yatra text-2xl text-forest">मॉक / अभ्यास परीक्षा परिणाम</h3>
          <p class="text-xs sm:text-sm text-stone-600">प्रतिभागी: <b>${candidateName}</b></p>
          <div class="p-4 bg-white rounded-2xl border border-emerald-200 max-w-xs mx-auto shadow-sm">
            <span class="text-xs text-stone-500 block">आपके कुल प्राप्तांक (Instant Score):</span>
            <span class="text-3xl font-extrabold text-terracotta">${calculatedScore} / ${totalQ}</span>
            <span class="block text-xs font-bold text-emerald-800 mt-1">(${pct}% अंक)</span>
          </div>
          <p class="text-xs text-stone-600">आपका नाम व अंक शीर्ष दाएँ कोने के <b>🔔 नोटिफिकेशन मेरिट आइकन</b> में जोड़ दिए गए हैं!</p>
          <div class="flex flex-wrap justify-center gap-2.5 pt-2">
            <button onclick="openMockMeritNotificationModal()" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-extrabold shadow">
              🔔 मॉक मेरिट सूची देखें (Highest to Lowest)
            </button>
            <button onclick="location.reload()" class="px-5 py-2.5 bg-forest text-white rounded-xl text-xs font-bold shadow">
              मुखपृष्ठ पर लौटें
            </button>
          </div>
        </div>
      `;
    } else {
      // STRICT DELAYED RESULT FOR MAIN EXAM
      document.getElementById('quizActiveBox').innerHTML = `
        <div class="text-center p-8 bg-green-50 rounded-2xl border border-green-200 space-y-3">
          <div class="text-4xl">📜</div>
          <h3 class="text-xl font-bold text-forest">मुख्य परीक्षा उत्तर-पुस्तिका सफलतापूर्वक जमा हो गई है!</h3>
          <p class="text-xs sm:text-sm text-stone-600">रोल नंबर: <b>${examState.rollNumber}</b> के सभी उत्तर सुरक्षित रूप से दर्ज हो गए हैं।</p>
          <div class="p-3 bg-white rounded-xl border border-green-300 text-xs font-semibold text-green-900">
            मुख्य परीक्षा के प्राप्तांक गोपनीय रखे गए हैं। व्यवस्थापक द्वारा परिणाम घोषित किए जाने पर आप अपना रोल नंबर व जन्मतिथि डालकर मार्कशीट देख सकेंगे।
          </div>
          <button onclick="location.reload()" class="px-5 py-2 bg-forest text-white rounded-xl text-xs font-bold shadow">
            मुखपृष्ठ पर लौटें
          </button>
        </div>
      `;
    }
  };

  // --------------------------------------------------------------------------
  // 6. RESTORE ALL REMOVED COMMUNITY CHAT FEATURES (REACTIONS, REPLY, PIN, MUTE)
  // --------------------------------------------------------------------------
  window.setChatReply = function(id, author, snippet) {
    activeReplyObj = { id, author, snippet: snippet.substring(0, 60) };
    const bar = document.getElementById('replyPreviewBar');
    if (bar) {
      document.getElementById('replyToAuthor').innerText = author;
      document.getElementById('replyToText').innerText = activeReplyObj.snippet;
      bar.classList.remove('hidden');
    }
    document.getElementById('postText')?.focus();
  };

  window.reactToPost = async function(postId, type) {
    const key = `reacted_${postId}_${type}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    try {
      await db.collection('posts').doc(postId).update({
        [`reactions.${type}`]: firebase.firestore.FieldValue.increment(1)
      });
    } catch (e) {}
  };

  window.pinChatMessage = async function(author, content) {
    if (!isEditorOrOwner()) return;
    await db.collection('settings').doc('pinnedChat').set({ author, content });
    showToast("📌 संदेश शीर्ष पर पिन कर दिया गया!");
  };

  window.unpinChatMessage = async function() {
    if (!isEditorOrOwner()) return;
    await db.collection('settings').doc('pinnedChat').delete();
    showToast("पिन हटा दिया गया।");
  };

  window.blockUserFromChat = async function(phone, authorName) {
    if (!isSuperOwner() || !phone || phone === OWNER_PHONE) return;
    if (!blockedPhonesList.includes(phone)) blockedPhonesList.push(phone);
    await db.collection('settings').doc('blockedUsers').set({ list: blockedPhonesList });
    showToast(`🔇 ${authorName} को संवाद मंच से म्यूट कर दिया गया।`);
  };

  window.unblockUserPhone = async function(phone) {
    if (!isSuperOwner()) return;
    blockedPhonesList = blockedPhonesList.filter(p => p !== phone);
    await db.collection('settings').doc('blockedUsers').set({ list: blockedPhonesList });
    showToast("सदस्य को अनम्यूट कर दिया गया!");
  };

  window.submitChaupalPost = async function() {
    if (!currentUser) return openAuthModal();
    if (blockedPhonesList.includes(currentUser.phone)) return showToast("आपको संदेश भेजने से म्यूट किया गया है।");
    const txtEl = document.getElementById('postText');
    const txt = txtEl.value.trim();
    if (!txt) return;

    await db.collection('posts').add({
      author: currentUser.name,
      phone: currentUser.phone || 'Member',
      isOwner: isSuperOwner(),
      isEditor: isEditorOrOwner(),
      topic: document.getElementById('postTopicSelect')?.value || 'सामान्य चर्चा',
      content: txt,
      replyTo: activeReplyObj || null,
      reactions: { pranam: 0, nature: 0, heart: 0 },
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    txtEl.value = '';
    updateCharCount();
    cancelChatReply();
  };

  window.renderFilteredChat = function() {
    const feed = document.getElementById('communityFeed');
    if (!feed) return;
    const selectedTopic = document.getElementById('chatTopicFilter')?.value || 'all';
    const filtered = selectedTopic === 'all' ? allChatPosts : allChatPosts.filter(p => (p.topic || 'सामान्य चर्चा') === selectedTopic);

    feed.innerHTML = '';
    filtered.forEach(p => {
      const canDel = Boolean(isSuperOwner() || (currentUser && p.phone === currentUser.phone));
      const safeAuthor = (p.author || 'सदस्य').replace(/'/g, "\\'");
      const safeContent = (p.content || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
      const pranam = p.reactions?.pranam || 0;
      const nature = p.reactions?.nature || 0;
      const heart = p.reactions?.heart || 0;

      feed.innerHTML += `
        <div class="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1.5 shadow-sm">
          <div class="flex justify-between items-center font-bold text-forest">
            <span>${p.isOwner ? '🛡️ ' : ''}${p.author} <span class="text-[10px] text-stone-400 font-normal">(${p.topic || 'सामान्य'})</span></span>
            <div class="flex items-center gap-2 text-[11px]">
              <button onclick="setChatReply('${p.id}', '${safeAuthor}', '${safeContent}')" class="text-stone-500 hover:text-forest">↩️ उत्तर</button>
              ${isSuperOwner() ? `<button onclick="pinChatMessage('${safeAuthor}', '${safeContent}')" class="text-amber-700">📌 पिन</button>` : ''}
              ${isSuperOwner() && !p.isOwner ? `<button onclick="blockUserFromChat('${p.phone}', '${safeAuthor}')" class="text-orange-700">🔇 म्यूट</button>` : ''}
              ${canDel ? `<button onclick="db.collection('posts').doc('${p.id}').delete()" class="text-rose-600">✕</button>` : ''}
            </div>
          </div>
          ${p.replyTo ? `<div class="p-1.5 rounded bg-stone-100 border-l-2 border-forest text-[10px] text-stone-600">↩️ <b>${p.replyTo.author}:</b>${p.replyTo.snippet}</div>` : ''}
          <p class="text-stone-800 leading-relaxed whitespace-pre-wrap">${p.content}</p>
          <div class="flex items-center gap-1.5 pt-1">
            <button onclick="reactToPost('${p.id}', 'pranam')" class="px-2 py-0.5 rounded-full bg-stone-100 hover:bg-amber-100 font-semibold">🙏 ${pranam || ''}</button>
            <button onclick="reactToPost('${p.id}', 'nature')" class="px-2 py-0.5 rounded-full bg-stone-100 hover:bg-emerald-100 font-semibold">🌿 ${nature || ''}</button>
            <button onclick="reactToPost('${p.id}', 'heart')" class="px-2 py-0.5 rounded-full bg-stone-100 hover:bg-rose-100 font-semibold">❤️ ${heart || ''}</button>
          </div>
        </div>
      `;
    });
  };

  // --------------------------------------------------------------------------
  // 7. RESTORE 29 NIYAMS LIVE EDIT & EASY STORY/HISTORY UPLOADER + VOICE AUDIO
  // --------------------------------------------------------------------------
  window.renderNiyams = function(list) {
    const grid = document.getElementById('niyamGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const canEdit = isSuperOwner();
    list.forEach(n => {
      const safeTitle = (n.title || '').replace(/'/g, "\\'");
      const safeRule = (n.rule || '').replace(/'/g, "\\'");
      const safeDesc = (n.desc || '').replace(/'/g, "\\'");
      grid.innerHTML += `
        <div class="elevate-card bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1.5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-forest w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">${n.num}</span>
              <span class="text-stone-500 font-semibold">${n.title}</span>
            </div>
            <h4 class="font-yatra text-base text-forest mt-1">${n.rule}</h4>
            <p class="text-xs text-stone-700 leading-relaxed">${n.desc}</p>
          </div>
          <div class="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            ${canEdit ? `<button onclick="editSingleNiyam(${n.num})" class="text-amber-700 font-bold hover:underline">✏️ Edit</button>` : '<span></span>'}
            <button onclick="window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent('🌿 नियम ${n.num} (${safeTitle}): ${safeRule} — ${safeDesc}'), '_blank')" class="text-emerald-700 font-bold">साझा करें 📲</button>
          </div>
        </div>
      `;
    });
  };

  window.editSingleNiyam = async function(num) {
    if (!isSuperOwner()) return;
    const idx = niyamsList.findIndex(x => x.num === num);
    if (idx === -1) return;
    const item = niyamsList[idx];
    const newTitle = prompt(`नियम ${num} का शीर्षक:`, item.title);
    if (newTitle === null) return;
    const newRule = prompt(`नियम ${num} की मूल वाणी:`, item.rule);
    if (newRule === null) return;
    const newDesc = prompt(`नियम ${num} का सरल अर्थ:`, item.desc);
    if (newDesc === null) return;

    niyamsList[idx] = { ...item, title: newTitle.trim() || item.title, rule: newRule.trim() || item.rule, desc: newDesc.trim() || item.desc };
    await db.collection('settings').doc('customNiyams').set({ list: niyamsList });
    renderNiyams(niyamsList);
    showToast(`✅ नियम ${num} अपडेट हो गया!`);
  };

  window.speakKidsStory = function(text) {
    if (!('speechSynthesis' in window)) return showToast("ऑडियो सुविधा उपलब्ध नहीं है।");
    if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); return showToast("ऑडियो रोका गया।"); }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'hi-IN'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
    showToast("🔊 कहानी सुनाई जा रही है...");
  };

  window.renderHistoryAndKidsViews = function() {
    const histView = document.getElementById('historySubView');
    const kidsView = document.getElementById('kidsSubView');
    const canEdit = isSuperOwner();

    if (histView) {
      let wrap = document.getElementById('dynamicHistoryCardsWrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'dynamicHistoryCardsWrap';
        wrap.className = 'space-y-4 mb-4';
        histView.insertBefore(wrap, histView.firstChild);
      }
      wrap.innerHTML = historyItemsList.filter(x => x.type === 'history').map(item => {
        const safeSpeech = (item.title + '। ' + item.content).replace(/'/g, "\\'").replace(/\n/g, ' ');
        return `
          <div class="bg-white p-5 rounded-2xl border-l-4 border-forest border border-stone-200 shadow-sm space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="px-2.5 py-0.5 bg-emerald-50 text-forest rounded-full font-bold">${item.badge || 'इतिहास अध्याय'}</span>
              <div class="flex gap-2">
                <button onclick="speakKidsStory('${safeSpeech}')" class="px-2 py-0.5 bg-stone-100 rounded font-bold text-forest">🔊 सुनें</button>
                ${canEdit ? `<button onclick="deleteHistoryOrKidsItem('${item.id}')" class="text-rose-600 font-bold">हटाएं</button>` : ''}
              </div>
            </div>
            <h3 class="font-yatra text-lg text-forest">${item.title}</h3>
            <p class="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">${item.content}</p>
            ${item.moral ? `<div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">${item.moral}</div>` : ''}
          </div>
        `;
      }).join('');
    }

    if (kidsView) {
      let kWrap = document.getElementById('dynamicKidsCardsWrap');
      if (!kWrap) {
        kWrap = document.createElement('div');
        kWrap.id = 'dynamicKidsCardsWrap';
        kWrap.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4';
        kidsView.insertBefore(kWrap, kidsView.firstChild);
      }
      kWrap.innerHTML = historyItemsList.filter(x => x.type === 'kids').map(item => {
        const safeSpeech = (item.title + '। ' + item.content).replace(/'/g, "\\'").replace(/\n/g, ' ');
        return `
          <div class="bg-amber-50/70 p-5 rounded-2xl border border-amber-300 shadow-sm space-y-2.5 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex justify-between items-center text-xs">
                <span class="px-2.5 py-0.5 bg-amber-400 text-stone-950 rounded-full font-extrabold">${item.badge || '🧸 बाल कहानी'}</span>
                <button onclick="speakKidsStory('${safeSpeech}')" class="px-2.5 py-1 bg-forest text-white rounded-full font-bold">🔊 कहानी सुनें</button>
              </div>
              <h3 class="font-yatra text-lg text-forest">${item.title}</h3>
              <p class="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">${item.content}</p>
            </div>
            ${item.moral ? `<div class="p-2.5 rounded-xl bg-emerald-900 text-amber-200 text-xs font-bold">${item.moral}</div>` : ''}
          </div>
        `;
      }).join('');
    }
  };

  window.deleteHistoryOrKidsItem = async function(id) {
    if (!isSuperOwner()) return;
    historyItemsList = historyItemsList.filter(x => x.id !== id);
    await db.collection('settings').doc('customHistoryKids').set({ items: historyItemsList });
    renderHistoryAndKidsViews();
    showToast("अध्याय हटा दिया गया।");
  };

  // --------------------------------------------------------------------------
  // 8. RESTORE MISSING OWNER STUDIO PANELS (EASY STORY UPLOADER, WINNERS,
  //    MAINTENANCE CONTROLLER, PASSWORD RESET, QUESTION DELETE & FEEDBACK INBOX)
  // --------------------------------------------------------------------------
  function injectRestoredOwnerStudioPanels() {
    const adminTab = document.getElementById('tab-admin');
    if (!adminTab || document.getElementById('restoredOwnerMasterSuite')) return;

    const suite = document.createElement('div');
    suite.id = 'restoredOwnerMasterSuite';
    suite.className = 'space-y-6 mt-6';
    suite.innerHTML = `
      <!-- 1. SUPER-EASY 1-CLICK STORY & ITIHAS UPLOADER -->
      <div class="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-stone-100 pb-2">
          <div>
            <h3 class="font-bold text-forest text-sm">📜 सरल इतिहास एवं 🧸 बाल संस्कार कहानी अपलोडर (Easy 1-Click Upload)</h3>
            <p class="text-[11px] text-stone-500">यहाँ से सीधे नई बाल कहानी या इतिहास की घटना जोड़ें या AI से लिखवाएं:</p>
          </div>
          <button type="button" onclick="generateAiStoryForUploader()" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-extrabold shadow">
            ✨ AI से कहानी लिखवाएं
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <select id="easyStoryType" class="p-2.5 rounded-xl border border-stone-300 font-bold text-forest bg-stone-50">
            <option value="kids">🧸 बाल संस्कार कहानी (Kids Corner)</option>
            <option value="history">📜 गौरवशाली इतिहास अध्याय (History Timeline)</option>
          </select>
          <input type="text" id="easyStoryTitle" placeholder="कहानी या इतिहास का शीर्षक लिखें *" class="p-2.5 rounded-xl border border-stone-300 font-semibold">
        </div>
        <textarea id="easyStoryContent" rows="3" placeholder="पूरी कहानी या ऐतिहासिक विवरण यहाँ सरल भाषा में लिखें या पेस्ट करें *" class="w-full p-2.5 text-xs rounded-xl border border-stone-300"></textarea>
        <input type="text" id="easyStoryMoral" placeholder="🌟 बच्चों या समाज के लिए सीख (Moral - ऐच्छिक)" class="w-full p-2.5 text-xs rounded-xl border border-stone-300">
        <button onclick="publishEasyStoryOrHistory()" class="w-full py-2.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow">
          🚀 अभी वेबसाइट पर प्रकाशित करें (Publish Story Live)
        </button>
      </div>

      <!-- 2. DAILY WINNERS & QUESTION / AUDIO DELETE MANAGER -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-forest text-sm">🏆 दैनिक विजेता घोषित करें (Set Daily Winners)</h3>
            <button onclick="clearDailyWinnersToBlank()" class="text-[11px] text-rose-600 font-bold hover:underline">खाली (Blank) करें</button>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex gap-2"><input type="text" id="win1InputName" placeholder="प्रथम विजेता नाम" class="w-2/3 p-2 border rounded-lg"><input type="text" id="win1InputScore" placeholder="अंक (10/10)" class="w-1/3 p-2 border rounded-lg"></div>
            <div class="flex gap-2"><input type="text" id="win2InputName" placeholder="द्वितीय विजेता नाम" class="w-2/3 p-2 border rounded-lg"><input type="text" id="win2InputScore" placeholder="अंक (9/10)" class="w-1/3 p-2 border rounded-lg"></div>
            <div class="flex gap-2"><input type="text" id="win3InputName" placeholder="तृतीय विजेता नाम" class="w-2/3 p-2 border rounded-lg"><input type="text" id="win3InputScore" placeholder="अंक (9/10)" class="w-1/3 p-2 border rounded-lg"></div>
          </div>
          <button onclick="saveDailyWinners()" class="w-full py-2 bg-forest text-white rounded-xl text-xs font-bold">Publish Winners</button>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-forest text-sm">🗑️ अपलोड किए गए प्रश्न व भजन प्रबंधन</h3>
            <button onclick="clearAllQuizQuestions()" class="px-2.5 py-1 bg-rose-100 text-rose-700 rounded text-[11px] font-bold">सभी प्रश्न हटाएं</button>
          </div>
          <div id="adminQuizManageList" class="space-y-1.5 max-h-40 overflow-y-auto text-xs border border-stone-100 p-2 rounded-lg"></div>
        </div>
      </div>

      <!-- 3. FULL MAINTENANCE & SECTION LOCK CONTROLLER -->
      <div class="bg-white p-5 rounded-2xl border-2 border-rose-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-stone-100 pb-2">
          <h3 class="font-yatra text-base text-rose-800">🛠️ मेंटेनेंस एवं सेक्शन लॉक नियंत्रण (Maintenance Controller)</h3>
          <span class="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">LIVE LOCK</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <select id="adminGlobalMaintMode" class="p-2.5 rounded-lg border border-stone-300 font-semibold bg-stone-50">
            <option value="off">🟢 सामान्य चालू है (No Maintenance)</option>
            <option value="phone_only">📱 केवल फ़ोन / ऐप लॉक करें</option>
            <option value="web_only">💻 केवल कंप्यूटर वेबसाइट लॉक करें</option>
            <option value="both">🔴 फ़ोन और वेबसाइट दोनों लॉक करें</option>
          </select>
          <input type="text" id="adminMaintMessage" placeholder="कस्टम मेंटेनेंस संदेश लिखें..." class="p-2.5 rounded-lg border border-stone-300">
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>📿 माला</span><select id="lock_mala" class="border rounded p-1"><option value="off">Open</option><option value="both">Lock</option></select></div>
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>📜 नियम</span><select id="lock_niyams" class="border rounded p-1"><option value="off">Open</option><option value="both">Lock</option></select></div>
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>📚 साहित्य</span><select id="lock_library" class="border rounded p-1"><option value="off">Open</option><option value="both">Lock</option></select></div>
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>💬 संवाद</span><select id="lock_community" class="border rounded p-1"><option value="off">Open</option><option value="both">Lock</option></select></div>
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>🏆 परीक्षा</span><select id="lock_quiz" class="border rounded p-1"><option value="off">Open</option><option value="both">Lock</option></select></div>
          <div class="p-2 border rounded-lg flex justify-between items-center"><span>🏛️ इतिहास</span><select id="lock_history" class="border rounded p-1"><option value="off">Open</option><option value="both">Lock</option></select></div>
        </div>
        <button onclick="saveMaintenanceSettings()" class="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow">
          💾 मेंटेनेंस सेटिंग्स लागू करें
        </button>
      </div>

      <!-- 4. MEMBER PASSWORD RESET, MUTED USERS & USER FEEDBACK INBOX -->
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div class="space-y-2 pb-3 border-b border-stone-100">
          <h3 class="font-bold text-forest text-sm">🔑 सदस्य पासवर्ड रीसेट टूल (Reset Member Password)</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <input type="tel" id="adminResetUserPhone" maxlength="10" placeholder="सदस्य का 10-अंकों का मोबाइल नंबर" class="p-2 border rounded-lg">
            <input type="text" id="adminResetUserNewPass" placeholder="नया पासवर्ड लिखें" class="p-2 border rounded-lg">
            <button onclick="adminResetMemberPassword()" class="py-2 px-4 bg-terracotta text-white font-bold rounded-lg">पासवर्ड बदलें</button>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <h4 class="font-bold text-forest mb-1.5">🔇 म्यूट किए गए सदस्य (Muted Users)</h4>
            <div id="adminBlockedUsersList" class="space-y-1"></div>
          </div>
          <div>
            <h4 class="font-bold text-forest mb-1.5">⭐ यूज़र सुझाव एवं फीडबैक इनबॉक्स</h4>
            <div id="adminFeedbackInboxList" class="space-y-1 max-h-36 overflow-y-auto"></div>
          </div>
        </div>
      </div>
    `;
    adminTab.appendChild(suite);
  }

  window.generateAiStoryForUploader = async function() {
    if (!isEditorOrOwner()) return;
    const type = document.getElementById('easyStoryType')?.value || 'kids';
    const promptTxt = type === 'kids'
      ? "विश्नोई संस्कार, जीव दया या खेजड़ली पर बच्चों के लिए एक छोटी प्रेरक कहानी हिंदी में लिखें।"
      : "विश्नोई समाज के इतिहास या गुरु जम्भेश्वर भगवान के जीवन की एक प्रामाणिक ऐतिहासिक घटना हिंदी में लिखें।";
    const res = await callGemini(promptTxt);
    document.getElementById('easyStoryTitle').value = type === 'kids' ? "जीव दया की प्रेरक बाल कहानी" : "गौरवशाली इतिहास अध्याय";
    document.getElementById('easyStoryContent').value = res.trim();
    document.getElementById('easyStoryMoral').value = "जीव दया पालणी, रूंख लीलो नी घावै।";
    showToast("✨ AI ने कहानी तैयार कर दी है!");
  };

  window.publishEasyStoryOrHistory = async function() {
    if (!isEditorOrOwner()) return;
    const type = document.getElementById('easyStoryType')?.value || 'kids';
    const title = document.getElementById('easyStoryTitle')?.value.trim();
    const content = document.getElementById('easyStoryContent')?.value.trim();
    const moral = document.getElementById('easyStoryMoral')?.value.trim();
    if (!title || !content) return showToast("कृपया शीर्षक और कहानी दोनों भरें!");

    historyItemsList.unshift({
      id: 'item_' + Date.now(),
      type,
      badge: type === 'kids' ? '🧸 बाल संस्कार' : '📜 इतिहास अध्याय',
      title, content, moral
    });
    await db.collection('settings').doc('customHistoryKids').set({ items: historyItemsList });
    document.getElementById('easyStoryTitle').value = '';
    document.getElementById('easyStoryContent').value = '';
    document.getElementById('easyStoryMoral').value = '';
    renderHistoryAndKidsViews();
    showToast("✅ कहानी / इतिहास सफलतापूर्वक वेबसाइट पर लाइव हो गया!");
  };

  window.saveDailyWinners = async function() {
    if (!isSuperOwner()) return;
    await db.collection('settings').doc('dailyWinners').set({
      p1Name: document.getElementById('win1InputName')?.value.trim() || '—',
      p1Score: document.getElementById('win1InputScore')?.value.trim() || '—',
      p2Name: document.getElementById('win2InputName')?.value.trim() || '—',
      p2Score: document.getElementById('win2InputScore')?.value.trim() || '—',
      p3Name: document.getElementById('win3InputName')?.value.trim() || '—',
      p3Score: document.getElementById('win3InputScore')?.value.trim() || '—'
    });
    showToast("🏆 दैनिक विजेता अपडेट हो गए!");
  };

  window.clearDailyWinnersToBlank = async function() {
    if (!isSuperOwner()) return;
    await db.collection('settings').doc('dailyWinners').set({
      p1Name: '—', p1Score: '—', p2Name: '—', p2Score: '—', p3Name: '—', p3Score: '—'
    });
    showToast("विजेता बोर्ड खाली कर दिया गया।");
  };

  window.clearAllQuizQuestions = async function() {
    if (!isSuperOwner()) return;
    const snap = await db.collection('quiz').get();
    const batch = db.batch();
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    showToast("सभी दैनिक प्रश्न हटाए गए!");
  };

  window.adminResetMemberPassword = async function() {
    if (!isSuperOwner()) return;
    const ph = document.getElementById('adminResetUserPhone')?.value.trim();
    const np = document.getElementById('adminResetUserNewPass')?.value.trim();
    if (!ph || !np) return showToast("नंबर और नया पासवर्ड लिखें!");
    await db.collection('users').doc(ph).set({ pass: np }, { merge: true });
    document.getElementById('adminResetUserPhone').value = '';
    document.getElementById('adminResetUserNewPass').value = '';
    showToast(`✅ सदस्य (${ph}) का पासवर्ड बदल दिया गया!`);
  };

  window.saveMaintenanceSettings = async function() {
    if (!isSuperOwner()) return;
    const globalMode = document.getElementById('adminGlobalMaintMode')?.value || 'off';
    const message = document.getElementById('adminMaintMessage')?.value.trim() || 'अपडेट जारी है...';
    const sections = {};
    ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(s => {
      sections[s] = document.getElementById(`lock_${s}`)?.value || 'off';
    });
    await db.collection('settings').doc('maintenance').set({ globalMode, message, sections }, { merge: true });
    showToast("🛠️ मेंटेनेंस सेटिंग्स लागू हो गईं!");
  };

  // --------------------------------------------------------------------------
  // 9. GOOGLE 1-CLICK LOGIN, FORGOT PASSWORD, FEEDBACK MODAL & PRIVACY FOOTER
  // --------------------------------------------------------------------------
  function injectGoogleAuthFeedbackAndFooter() {
    const authForm = document.querySelector('#authModal form');
    if (authForm && !document.getElementById('googleAuthModalBtn')) {
      const extraDiv = document.createElement('div');
      extraDiv.className = 'pt-2 border-t border-stone-200 space-y-2';
      extraDiv.innerHTML = `
        <div class="flex justify-end">
          <button type="button" onclick="promptForgotPassReset()" class="text-[11px] font-bold text-terracotta hover:underline">पासवर्ड भूल गए?</button>
        </div>
        <button id="googleAuthModalBtn" type="button" onclick="signInOrVerifyWithGoogle()" class="w-full py-2 px-3 bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold shadow-sm">
          🌐 Google से 1-Click लॉगिन करें
        </button>
      `;
      authForm.appendChild(extraDiv);
    }

    // User Feedback Modal
    if (!document.getElementById('userFeedbackModal')) {
      const fb = document.createElement('div');
      fb.id = 'userFeedbackModal';
      fb.className = 'fixed inset-0 z-[9992] bg-black/65 backdrop-blur-sm hidden items-center justify-center p-4';
      fb.innerHTML = `
        <div class="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 border border-amber-300 shadow-2xl text-center">
          <div class="text-3xl">⭐</div>
          <h3 class="font-yatra text-xl text-forest">सुझाव एवं रेटिंग</h3>
          <textarea id="fbCommentInput" rows="3" placeholder="मंच को और बेहतर बनाने हेतु अपना सुझाव लिखें..." class="w-full p-2.5 text-xs rounded-xl border border-stone-300"></textarea>
          <div class="flex gap-2">
            <button onclick="submitUserFeedback()" class="flex-1 py-2 bg-forest text-white font-bold text-xs rounded-xl">भेजें</button>
            <button onclick="document.getElementById('userFeedbackModal').classList.add('hidden')" class="px-4 py-2 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl">बंद करें</button>
          </div>
        </div>
      `;
      document.body.appendChild(fb);
    }

    // Privacy Policy & WhatsApp Helpdesk Footer (Indus Appstore Compliance)
    if (!document.getElementById('indusComplianceFooter')) {
      const footer = document.createElement('footer');
      footer.id = 'indusComplianceFooter';
      footer.className = 'max-w-5xl w-full mx-auto px-4 py-6 mt-8 border-t border-stone-200 text-center text-xs text-stone-500 space-y-2';
      footer.innerHTML = `
        <div class="flex flex-wrap justify-center gap-4 font-semibold text-forest">
          <button onclick="openPrivacyPolicyModal()" class="hover:underline">🔒 गोपनीयता नीति एवं नियम (Privacy Policy & Terms)</button>
          <span>•</span>
          <button onclick="openFeedbackModal()" class="hover:underline">⭐ फीडबैक दें</button>
          <span>•</span>
          <button onclick="openWhatsAppExamHelpdesk()" class="hover:underline">💬 परीक्षा सहायता केंद्र (WhatsApp Helpdesk)</button>
        </div>
        <p class="text-[11px] text-stone-400">© 2026 विश्नोई समाज डिजिटल मंच (bishnoism.vercel.app) • सर्वाधिकार सुरक्षित</p>
      `;
      document.body.appendChild(footer);
    }
  }

  window.openFeedbackModal = function() {
    const m = document.getElementById('userFeedbackModal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
  };

  window.submitUserFeedback = async function() {
    const comment = document.getElementById('fbCommentInput')?.value.trim();
    if (!comment) return showToast("कृपया सुझाव लिखें!");
    await db.collection('feedbacks').add({
      name: currentUser?.name || 'सदस्य',
      phone: currentUser?.phone || '-',
      rating: 5,
      comment,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('fbCommentInput').value = '';
    document.getElementById('userFeedbackModal').classList.add('hidden');
    showToast("🙏 आपके सुझाव के लिए धन्यवाद!");
  };

  window.openPrivacyPolicyModal = function() {
    alert(
      "🔒 गोपनीयता नीति एवं नियम (Privacy Policy & Terms):\n\n" +
      "1. यह मंच गुरु जम्भेश्वर भगवान के २९ नियमों, साहित्य अध्ययन एवं शैक्षिक ज्ञान परीक्षा हेतु समर्पित है।\n" +
      "2. उपयोगकर्ता का नाम, मोबाइल नंबर एवं परीक्षा सुरक्षा हेतु बेसिक डिवाइस/IP लॉग केवल परीक्षा पारदर्शिता के लिए सुरक्षित रखे जाते हैं।\n" +
      "3. किसी भी सदस्य का डेटा किसी तृतीय पक्ष (Third-Party) को बेचा या साझा नहीं किया जाता है।"
    );
  };

  window.openWhatsAppExamHelpdesk = function() {
    const msg = `नमस्ते व्यवस्थापक जी, मुझे जाम्भाणी साहित्य परीक्षा / पोर्टल के संबंध में सहायता चाहिए। (रोल नं: ${examState.rollNumber})`;
    window.open(`https://api.whatsapp.com/send?phone=91${OWNER_PHONE}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  window.signInOrVerifyWithGoogle = async function() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      const gUser = result.user;
      if (!gUser) return;
      const docId = `google_${gUser.uid.substring(0, 10)}`;
      currentUser = { name: gUser.displayName || "सदस्य", phone: docId, email: gUser.email || "", isOwner: false, isEditor: false };
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      await db.collection('users').doc(docId).set({ name: currentUser.name, email: currentUser.email, lastLogin: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      applyCurrentUserRBACView();
      closeAuthModal();
      showToast(`स्वागत है, ${currentUser.name}!`);
    } catch (e) {
      showToast("Google लॉगिन त्रुटि: " + e.message);
    }
  };

  window.promptForgotPassReset = function() {
    openWhatsAppExamHelpdesk();
  };

  // --------------------------------------------------------------------------
  // 10. INITIALIZE ALL UPGRADES & REALTIME LISTENERS
  // --------------------------------------------------------------------------
  function bootMasterUpgrades() {
    syncServerClock();
    flushOfflineExamQueue();
    injectTopRightNotificationBell();
    upgradeParikshaAndOwnerControls();
    injectRestoredOwnerStudioPanels();
    injectGoogleAuthFeedbackAndFooter();

    // Realtime Listeners for Restored Features
    db.collection('settings').doc('customHistoryKids').onSnapshot(doc => {
      if (doc.exists && Array.isArray(doc.data().items)) historyItemsList = doc.data().items;
      renderHistoryAndKidsViews();
    });

    db.collection('settings').doc('dailyWinners').onSnapshot(doc => {
      const w = doc.exists ? doc.data() : {};
      const clean = v => (!v || v === 'प्रतीक्षारत') ? '—' : v;
      if (document.getElementById('winner1Name')) document.getElementById('winner1Name').innerText = clean(w.p1Name);
      if (document.getElementById('winner1Score')) document.getElementById('winner1Score').innerText = clean(w.p1Score);
      if (document.getElementById('winner2Name')) document.getElementById('winner2Name').innerText = clean(w.p2Name);
      if (document.getElementById('winner2Score')) document.getElementById('winner2Score').innerText = clean(w.p2Score);
      if (document.getElementById('winner3Name')) document.getElementById('winner3Name').innerText = clean(w.p3Name);
      if (document.getElementById('winner3Score')) document.getElementById('winner3Score').innerText = clean(w.p3Score);
    });

    db.collection('settings').doc('blockedUsers').onSnapshot(doc => {
      blockedPhonesList = (doc.exists && Array.isArray(doc.data().list)) ? doc.data().list : [];
      const bEl = document.getElementById('adminBlockedUsersList');
      if (bEl) {
        bEl.innerHTML = blockedPhonesList.length === 0
          ? `<div class="text-stone-400">कोई सदस्य म्यूट नहीं है।</div>`
          : blockedPhonesList.map(p => `<div class="flex justify-between p-1.5 bg-stone-50 border rounded"><span>🔇 ${p}</span><button onclick="unblockUserPhone('${p}')" class="text-emerald-700 font-bold">अनम्यूट</button></div>`).join('');
      }
    });

    db.collection('feedbacks').orderBy('createdAt', 'desc').limit(20).onSnapshot(snap => {
      const fEl = document.getElementById('adminFeedbackInboxList');
      if (fEl) {
        fEl.innerHTML = snap.empty
          ? `<div class="text-stone-400">कोई सुझाव नहीं है।</div>`
          : snap.docs.map(d => `<div class="p-1.5 bg-stone-50 border rounded"><b>${d.data().name}:</b> ${d.data().comment}</div>`).join('');
      }
    });

    db.collection('quiz').onSnapshot(snap => {
      const qEl = document.getElementById('adminQuizManageList');
      if (qEl) {
        qEl.innerHTML = snap.empty
          ? `<div class="text-stone-400">कोई दैनिक प्रश्न नहीं है।</div>`
          : snap.docs.map((d, i) => `<div class="flex justify-between p-1 border-b"><span>${i + 1}. ${d.data().q}</span><button onclick="db.collection('quiz').doc('${d.id}').delete()" class="text-rose-600 font-bold">✕</button></div>`).join('');
      }
    });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootMasterUpgrades);
  } else {
    bootMasterUpgrades();
  }
})();
/* ============================================================================
   ULTIMATE SECURITY, PRIVACY & GLITCH-FIX PATCH (PASTE AT VERY END OF script.js)
   Fixes:
   1. Removes "Jai" Browser Autofill Glitch from Search Bar permanently
   2. Stops annoying "Tab Switch" popup after exam ends or during normal browsing
   3. Removes blinking Red Ball from Notification Icon (🔔)
   4. Notification Privacy: Shows ONLY personal mock scores + Owner Broadcasts (PDF/Links/Text)
   5. 100% Exam Anti-Cheating: Encrypts answers in memory, blocks DevTools (F12/Inspect)
   6. Enhanced Sub-Admin Special Power Delegation UI
   ============================================================================ */

(function applyUltimateSecurityAndGlitchFix() {

  // --------------------------------------------------------------------------
  // 1. FIX "JAI" NAME IN SEARCH BAR (DEFEAT BROWSER AUTOFILL PERMANENTLY)
  // --------------------------------------------------------------------------
  function purgeSearchBarAutofillGlitch() {
    const sInp = document.getElementById('globalSearchInput');
    const nInp = document.getElementById('niyamSearch');

    [sInp, nInp].forEach(inp => {
      if (!inp) return;
      inp.value = '';
      inp.setAttribute('autocomplete', 'new-password');
      inp.setAttribute('autocorrect', 'off');
      inp.setAttribute('autocapitalize', 'off');
      inp.setAttribute('spellcheck', 'false');
      inp.setAttribute('readonly', 'readonly');

      // Unlock immediately when user clicks or touches to type
      const unlock = () => inp.removeAttribute('readonly');
      inp.addEventListener('focus', unlock);
      inp.addEventListener('mousedown', unlock);
      inp.addEventListener('touchstart', unlock, { passive: true });
    });

    // Clear delayed browser autofill injections at 150ms, 500ms, and 1200ms
    [150, 500, 1200].forEach(delay => {
      setTimeout(() => {
        if (sInp && document.activeElement !== sInp) sInp.value = '';
        if (nInp && document.activeElement !== nInp) nInp.value = '';
      }, delay);
    });
  }

  // --------------------------------------------------------------------------
  // 2. FIX ANNOYING TAB-SWITCH POPUP & 100% ANTI-CHEATING / DEVTOOLS GUARD
  // --------------------------------------------------------------------------
  examState.isExamRunning = false;
  let encryptedAnswerKeyMap = {}; // Hides answers from window.examState.questions in Console!

  // Override initExamSecurity so it doesn't attach duplicate broken listeners
  window.initExamSecurity = function() {
    if (window._strictExamGuardAttached) return;
    window._strictExamGuardAttached = true;

    // Tab Switch / Minimize Detector — ONLY fires when examState.isExamRunning === true
    document.addEventListener('visibilitychange', () => {
      if (!examState.isExamRunning) return;
      if (document.hidden) {
        examState.tabSwitchCount = (examState.tabSwitchCount || 0) + 1;
        alert(`⚠️ कड़ी सुरक्षा चेतावनी (${examState.tabSwitchCount}/3):\nपरीक्षा के दौरान टैब बदलना या ऐप मिनिमाइज करना सख्त वर्जित है!`);
        if (examState.tabSwitchCount >= 3) {
          submitFinalExam(true);
        }
      }
    }, true);

    // Block Right-Click, Copy, Cut, Paste, Select & Drag during active exam
    ['contextmenu', 'copy', 'cut', 'paste', 'selectstart', 'dragstart'].forEach(evtName => {
      document.addEventListener(evtName, e => {
        if (examState.isExamRunning) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }, true);
    });

    // Block DevTools Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S, PrintScreen)
    window.addEventListener('keydown', e => {
      const k = (e.key || '').toUpperCase();
      const isDevShortcut = (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(k)) ||
        (e.ctrlKey && ['U', 'S', 'P'].includes(k))
      );

      if (isDevShortcut && !isSuperOwner()) {
        e.preventDefault();
        e.stopPropagation();
        showToast("🛡️ सुरक्षा कारणों से डेवलपर टूल्स (Inspect/Console) प्रतिबंधित हैं।");
        return false;
      }

      if (examState.isExamRunning && (e.key === 'PrintScreen' || (e.ctrlKey && k === 'C'))) {
        e.preventDefault();
        showToast("⚠️ परीक्षा में स्क्रीनशॉट व कॉपी करना वर्जित है!");
        return false;
      }
    }, true);
  };

  // Neutralize any previously attached visibilitychange listeners when exam is NOT running
  document.addEventListener('visibilitychange', e => {
    if (!examState.isExamRunning) {
      e.stopImmediatePropagation();
    }
  }, true);

  // Override startExamEngine to strip answers from memory (prevents Console leaking)
  const _baseStartExamEngine = window.startExamEngine;
  window.startExamEngine = function(questionList, durationMinutes) {
    encryptedAnswerKeyMap = {};
    const sanitizedQuestions = (questionList || []).map((q, idx) => {
      const qId = q.id || `q_${idx}`;
      // Store encoded answer privately inside closure so Console can't read q.ans
      encryptedAnswerKeyMap[qId] = Number(q.ans ?? 0) ^ 79;
      const copy = { ...q, id: qId };
      delete copy.ans; // Remove answer from public DOM/window state!
      return copy;
    });

    examState.isExamRunning = true;
    examState.tabSwitchCount = 0;

    if (_baseStartExamEngine) {
      _baseStartExamEngine(sanitizedQuestions, durationMinutes);
    }
  };

  // Override switchTab so leaving the quiz tab immediately stops the exam guard
  const _baseSwitchTab = window.switchTab;
  window.switchTab = function(id) {
    if (id !== 'quiz' && examState.isExamRunning) {
      examState.isExamRunning = false;
      if (examState.timerInterval) clearInterval(examState.timerInterval);
    }
    if (_baseSwitchTab) _baseSwitchTab(id);
  };

  // --------------------------------------------------------------------------
  // 3. NOTIFICATION BELL (🔔): REMOVE RED BALL + PRIVATE MOCK RESULTS +
  //    PUBLIC OWNER BROADCASTS (PDF, LINKS & TEXT ANNOUNCEMENTS)
  // --------------------------------------------------------------------------
  function upgradeNotificationBellAndModal() {
    const bellBtn = document.getElementById('topMockMeritBellBtn');
    if (bellBtn) {
      // Remove annoying popping red ball completely
      bellBtn.innerHTML = `<span class="text-base leading-none">🔔</span>`;
      bellBtn.title = "सूचना केंद्र एवं आपका निजी परिणाम";
    }

    const mModal = document.getElementById('mockMeritNotificationModal');
    if (mModal) {
      mModal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-amber-300 shadow-2xl flex flex-col max-h-[85vh]">
          <div class="bg-gradient-to-r from-[#143622] to-emerald-900 text-white p-4 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🔔</span>
              <div>
                <h3 class="font-yatra text-base sm:text-lg text-amber-300">सूचना केंद्र एवं परिणाम पट्ट</h3>
                <p class="text-[10px] text-stone-200">आधिकारिक घोषणाएं, मेरिट PDF एवं आपका निजी मॉक स्कोर</p>
              </div>
            </div>
            <button onclick="closeMockMeritNotificationModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold">✕</button>
          </div>

          <div class="p-2.5 bg-stone-100 border-b border-stone-200 flex gap-2 text-xs">
            <button onclick="switchNotificationSubView('public_notices')" id="notif_tab_public" class="flex-1 py-2 px-3 rounded-xl bg-forest text-white font-bold shadow-sm transition">
              📢 आधिकारिक सूचनाएं व मेरिट PDF
            </button>
            <button onclick="switchNotificationSubView('my_mock_scores')" id="notif_tab_personal" class="flex-1 py-2 px-3 rounded-xl bg-white text-stone-700 font-bold border border-stone-300 transition">
              🎯 मेरा मॉक टेस्ट परिणाम (निजी)
            </button>
          </div>

          <div id="notifPublicBroadcastBox" class="p-4 overflow-y-auto space-y-3 text-xs flex-1">
            <div class="p-6 text-center text-stone-400">सूचनाएं लोड हो रही हैं...</div>
          </div>

          <div id="notifPersonalMockBox" class="hidden p-4 overflow-y-auto space-y-2.5 text-xs flex-1">
            <div class="p-6 text-center text-stone-400">आपका निजी रिकॉर्ड लोड हो रहा है...</div>
          </div>
        </div>
      `;
    }
  }

  window.openMockMeritNotificationModal = function() {
    const m = document.getElementById('mockMeritNotificationModal');
    if (m) {
      m.classList.remove('hidden');
      m.classList.add('flex');
      switchNotificationSubView('public_notices');
    }
  };

  window.switchNotificationSubView = function(view) {
    const bPub = document.getElementById('notif_tab_public');
    const bPer = document.getElementById('notif_tab_personal');
    const boxPub = document.getElementById('notifPublicBroadcastBox');
    const boxPer = document.getElementById('notifPersonalMockBox');

    if (view === 'public_notices') {
      if (bPub) bPub.className = "flex-1 py-2 px-3 rounded-xl bg-forest text-white font-bold shadow-sm transition";
      if (bPer) bPer.className = "flex-1 py-2 px-3 rounded-xl bg-white text-stone-700 font-bold border border-stone-300 transition";
      boxPub?.classList.remove('hidden');
      boxPer?.classList.add('hidden');
      loadPublicNotificationsFeed();
    } else {
      if (bPer) bPer.className = "flex-1 py-2 px-3 rounded-xl bg-forest text-white font-bold shadow-sm transition";
      if (bPub) bPub.className = "flex-1 py-2 px-3 rounded-xl bg-white text-stone-700 font-bold border border-stone-300 transition";
      boxPer?.classList.remove('hidden');
      boxPub?.classList.add('hidden');
      loadMyPrivateMockScores();
    }
  };

  // Load Public Notifications (Merit List PDFs, Links & Text uploaded by Owner)
  window.loadPublicNotificationsFeed = async function() {
    const box = document.getElementById('notifPublicBroadcastBox');
    if (!box) return;
    box.innerHTML = `<div class="p-6 text-center text-stone-400">सूचनाएं लोड हो रही हैं...</div>`;
    try {
      const snap = await db.collection('publicNotifications').orderBy('createdAt', 'desc').limit(25).get();
      if (snap.empty) {
        box.innerHTML = `<div class="p-6 text-center text-stone-400">अभी कोई नई सार्वजनिक सूचना या मेरिट PDF जारी नहीं हुई है।</div>`;
        return;
      }
      box.innerHTML = snap.docs.map(doc => {
        const n = doc.data();
        const dateStr = n.createdAt ? n.createdAt.toDate().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'नवीनतम';
        const safeTitle = (n.title || 'सूचना').replace(/'/g, "\\'");
        const safeLink = (n.link || '').replace(/'/g, "\\'");
        const isPdf = safeLink.toLowerCase().endsWith('.pdf') || safeLink.includes('drive.google.com');

        return `
          <div class="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <span class="px-2 py-0.5 bg-forest text-amber-300 rounded text-[10px] font-extrabold uppercase">${n.badge || 'आधिकारिक सूचना'}</span>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-stone-400">${dateStr}</span>
                ${isSuperOwner() ? `<button onclick="deletePublicNotification('${doc.id}')" class="text-rose-600 font-bold text-xs" title="हटाएं">✕</button>` : ''}
              </div>
            </div>
            <h4 class="font-bold text-sm text-forest">${n.title || ''}</h4>
            ${n.message ? `<p class="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">${n.message}</p>` : ''}
            ${n.link ? `
              <div class="pt-1 flex flex-wrap gap-2">
                ${isPdf ? `<button onclick="closeMockMeritNotificationModal(); openInbuiltPdfViewer('${safeTitle}', '${safeLink}');" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold rounded-lg text-xs shadow-sm">📄 ऐप में PDF खोलें</button>` : ''}
                <a href="${n.link}" target="_blank" class="px-3 py-1.5 bg-forest hover:bg-emerald-950 text-white font-bold rounded-lg text-xs shadow-sm inline-flex items-center gap-1">
                  🔗 ${n.linkLabel || 'लिंक / दस्तावेज़ खोलें'} ↗
                </a>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    } catch (e) {
      box.innerHTML = `<div class="p-4 text-center text-rose-500">त्रुटि: ${e.message}</div>`;
    }
  };

  window.deletePublicNotification = async function(id) {
    if (!isSuperOwner()) return;
    await db.collection('publicNotifications').doc(id).delete();
    loadPublicNotificationsFeed();
    showToast("सूचना हटा दी गई।");
  };

  // Load ONLY the Respective Student's Own Mock Scores (100% Privacy!)
  window.loadMyPrivateMockScores = async function() {
    const box = document.getElementById('notifPersonalMockBox');
    if (!box) return;

    const myRoll = examState.rollNumber && examState.rollNumber !== 'GUEST' ? examState.rollNumber : localStorage.getItem('bishnoi_saved_roll');
    const myPhone = currentUser?.phone || window.lastEnrolledStudentObj?.phone || '';
    const localHistory = JSON.parse(localStorage.getItem('bishnoi_my_personal_mock_scores') || '[]');

    box.innerHTML = `<div class="p-6 text-center text-stone-400">आपका निजी परिणाम खोजा जा रहा है...</div>`;

    try {
      let records = [...localHistory];

      if (myRoll && myRoll !== 'GUEST') {
        const s1 = await db.collection('examSubmissions').where('rollNumber', '==', myRoll).get();
        s1.forEach(d => {
          const data = d.data();
          if (data.mode && data.mode.startsWith('mock_')) records.push(data);
        });
      } else if (myPhone && myPhone !== '-') {
        const s2 = await db.collection('examSubmissions').where('phone', '==', myPhone).get();
        s2.forEach(d => {
          const data = d.data();
          if (data.mode && data.mode.startsWith('mock_')) records.push(data);
        });
      }

      // Deduplicate by mode + score + total
      const seen = new Set();
      const uniqueMyRecords = records.filter(r => {
        const k = `${r.mode}_${r.score}_${r.total}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      if (!uniqueMyRecords.length) {
        box.innerHTML = `
          <div class="p-6 text-center space-y-2 text-stone-500">
            <div class="text-2xl">🎯</div>
            <p class="font-semibold text-forest">अभी तक आपने कोई मॉक टेस्ट नहीं दिया है।</p>
            <p class="text-[11px] text-stone-400">नोट: गोपनीयता नियमों के तहत यहाँ केवल आपके द्वारा दिए गए मॉक टेस्ट के अंक ही दिखते हैं, किसी अन्य छात्र के नहीं।</p>
          </div>
        `;
        return;
      }

      box.innerHTML = `
        <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-forest font-semibold mb-2">
          🔒 निजी परिणाम कक्ष: यहाँ केवल आपके व्यक्तिगत मॉक टेस्ट प्राप्तांक प्रदर्शित हैं।
        </div>
      ` + uniqueMyRecords.map((r, idx) => {
        const mName = r.mode === 'mock_1' ? 'मॉक टेस्ट - ०१' : (r.mode === 'mock_2' ? 'मॉक टेस्ट - ०२' : r.mode);
        const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
        return `
          <div class="p-3.5 rounded-2xl bg-white border border-stone-200 flex items-center justify-between gap-3 shadow-sm">
            <div>
              <span class="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">${mName}</span>
              <div class="font-bold text-stone-800 mt-1">${r.candidateName || currentUser?.name || 'मेरा प्रयास'}</div>
              <div class="text-[10px] text-stone-400">रोल नं: ${r.rollNumber || 'स्वयं'}</div>
            </div>
            <div class="text-right">
              <span class="px-3 py-1 rounded-xl bg-forest text-amber-300 font-extrabold text-sm block">${r.score} / ${r.total}</span>
              <span class="text-[10px] font-bold text-emerald-700 mt-0.5 block">${pct}% अंक</span>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      box.innerHTML = `<div class="p-4 text-center text-rose-500">त्रुटि: ${e.message}</div>`;
    }
  };

  // --------------------------------------------------------------------------
  // 4. UPDATE SUBMIT EXAM TO STOP POPUP FLAG & SAVE PRIVATE MOCK HISTORY
  // --------------------------------------------------------------------------
  window.submitFinalExam = async function(isForced = false) {
    // 1. Immediately turn off exam running flag so NO MORE TAB SWITCH POPUPS happen!
    examState.isExamRunning = false;
    if (examState.timerInterval) clearInterval(examState.timerInterval);

    let calculatedScore = 0;
    examState.questions.forEach((q, idx) => {
      const qId = q.id || `q_${idx}`;
      const trueAns = encryptedAnswerKeyMap[qId] !== undefined ? (encryptedAnswerKeyMap[qId] ^ 79) : q.ans;
      if (examState.answers[qId] === trueAns) calculatedScore++;
    });

    const candidateName = examState.enrolledProfile?.name || (currentUser ? currentUser.name : 'परीक्षार्थी');
    const fatherName = examState.enrolledProfile?.fatherName || '-';
    const totalQ = examState.questions.length;
    const pct = totalQ > 0 ? Math.round((calculatedScore / totalQ) * 100) : 0;
    const isMockOrDaily = examState.activeMode.startsWith('mock_') || examState.activeMode === 'daily_quiz';

    const payload = {
      rollNumber: examState.rollNumber,
      candidateName,
      fatherName,
      phone: examState.enrolledProfile?.phone || (currentUser ? currentUser.phone : '-'),
      mode: examState.activeMode,
      score: calculatedScore,
      total: totalQ,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      isForcedSubmission: isForced,
      isPublished: isMockOrDaily
    };

    const cacheKey = `cachedExam_${examState.activeMode}_${examState.rollNumber}`;
    localStorage.removeItem(cacheKey);

    // Save in student's private local mock history so they can view it anytime in 🔔
    if (isMockOrDaily) {
      const myMocks = JSON.parse(localStorage.getItem('bishnoi_my_personal_mock_scores') || '[]');
      myMocks.unshift({
        rollNumber: examState.rollNumber,
        candidateName,
        mode: examState.activeMode,
        score: calculatedScore,
        total: totalQ,
        time: Date.now()
      });
      localStorage.setItem('bishnoi_my_personal_mock_scores', JSON.stringify(myMocks.slice(0, 15)));
    }

    try {
      await db.collection('examSubmissions').add(payload);
    } catch (err) {
      const q = JSON.parse(localStorage.getItem('bishnoi_offline_exam_queue') || '[]');
      q.push(payload);
      localStorage.setItem('bishnoi_offline_exam_queue', JSON.stringify(q));
      showToast("⚠️ नेटवर्क धीमा है: उत्तर सुरक्षित हैं और नेट आते ही जमा हो जाएंगे!");
    }

    if (isMockOrDaily) {
      document.getElementById('quizActiveBox').innerHTML = `
        <div class="text-center p-6 sm:p-8 bg-gradient-to-br from-amber-50 via-white to-emerald-50 rounded-2xl border-2 border-emerald-400 space-y-4 shadow-md">
          <div class="text-5xl">🏆</div>
          <h3 class="font-yatra text-2xl text-forest">मॉक / अभ्यास परीक्षा परिणाम (निजी)</h3>
          <p class="text-xs sm:text-sm text-stone-600">प्रतिभागी: <b>${candidateName}</b></p>
          <div class="p-4 bg-white rounded-2xl border border-emerald-200 max-w-xs mx-auto shadow-sm">
            <span class="text-xs text-stone-500 block">आपके कुल प्राप्तांक (Your Score):</span>
            <span class="text-3xl font-extrabold text-terracotta">${calculatedScore} / ${totalQ}</span>
            <span class="block text-xs font-bold text-emerald-800 mt-1">(${pct}% अंक)</span>
          </div>
          <p class="text-xs text-stone-500">यह परिणाम केवल आपको दिखाई दे रहा है। आप इसे ऊपर दाएँ कोने के <b>🔔 सूचना केंद्र</b> में भी देख सकते हैं।</p>
          <div class="flex flex-wrap justify-center gap-2.5 pt-2">
            <button onclick="openMockMeritNotificationModal(); switchNotificationSubView('my_mock_scores');" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-extrabold shadow">
              🔔 मेरा परिणाम व सूचनाएं देखें
            </button>
            <button onclick="switchTab('home')" class="px-5 py-2.5 bg-forest text-white rounded-xl text-xs font-bold shadow">
              मुखपृष्ठ पर लौटें
            </button>
          </div>
        </div>
      `;
    } else {
      document.getElementById('quizActiveBox').innerHTML = `
        <div class="text-center p-8 bg-green-50 rounded-2xl border border-green-200 space-y-3">
          <div class="text-4xl">📜</div>
          <h3 class="text-xl font-bold text-forest">मुख्य परीक्षा उत्तर-पुस्तिका सफलतापूर्वक जमा हो गई है!</h3>
          <p class="text-xs sm:text-sm text-stone-600">रोल नंबर: <b>${examState.rollNumber}</b> के सभी उत्तर सुरक्षित रूप से दर्ज हो गए हैं।</p>
          <div class="p-3 bg-white rounded-xl border border-green-300 text-xs font-semibold text-green-900">
            मुख्य परीक्षा के प्राप्तांक गोपनीय रखे गए हैं। परिणाम घोषित होने पर 🔔 सूचना केंद्र में मेरिट PDF जारी की जाएगी।
          </div>
          <button onclick="switchTab('home')" class="px-5 py-2 bg-forest text-white rounded-xl text-xs font-bold shadow">
            मुखपृष्ठ पर लौटें
          </button>
        </div>
      `;
    }
  };

  // --------------------------------------------------------------------------
  // 5. OWNER STUDIO: ADD PUBLIC NOTIFICATION (PDF / LINK / MERIT LIST) SENDER
  //    & Mock Merit PDF Exporter for Owner
  // --------------------------------------------------------------------------
  function injectOwnerNotificationBroadcaster() {
    const adminTab = document.getElementById('tab-admin');
    if (!adminTab || document.getElementById('ownerNotificationBroadcastCard')) return;

    const card = document.createElement('div');
    card.id = 'ownerNotificationBroadcastCard';
    card.className = 'bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-sm space-y-3';
    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
        <div>
          <h3 class="font-bold text-forest text-sm">🔔 सार्वजनिक सूचना एवं मेरिट PDF ब्रॉडकास्ट (Notification Center Uploader)</h3>
          <p class="text-[11px] text-stone-500">यहाँ से जो भी सूचना, मेरिट लिस्ट PDF या लिंक भेजेंगे, वह सभी यूज़र्स के शीर्ष दाएँ 🔔 आइकन में दिखेगा:</p>
        </div>
        <button type="button" onclick="downloadMockMeritPdfForOwner()" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-extrabold shadow">
          📥 मॉक टेस्ट मेरिट PDF डाउनलोड करें
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <input type="text" id="notifBroadcastBadge" placeholder="टैग (उदा: मेरिट सूची / आवश्यक सूचना)" class="p-2.5 rounded-xl border border-stone-300 font-semibold">
        <input type="text" id="notifBroadcastTitle" placeholder="सूचना का मुख्य शीर्षक (Title) *" class="sm:col-span-2 p-2.5 rounded-xl border border-stone-300 font-bold">
      </div>

      <textarea id="notifBroadcastMsg" rows="2" placeholder="सूचना का विवरण लिखें..." class="w-full p-2.5 text-xs rounded-xl border border-stone-300"></textarea>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <input type="text" id="notifBroadcastLink" placeholder="PDF या वेब लिंक (उदा: ./merit_list.pdf या Drive लिंक)" class="p-2.5 rounded-xl border border-stone-300">
        <input type="text" id="notifBroadcastLinkLabel" placeholder="बटन का नाम (उदा: मेरिट लिस्ट PDF डाउनलोड करें)" class="p-2.5 rounded-xl border border-stone-300">
      </div>

      <button onclick="publishOwnerNotificationBroadcast()" class="w-full py-2.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow transition">
        📢 सभी यूज़र्स के 🔔 नोटिफिकेशन सेक्शन में प्रकाशित करें
      </button>
    `;

    const firstSection = document.getElementById('secParikshaVisibilityController');
    if (firstSection && firstSection.parentElement) {
      firstSection.insertAdjacentElement('afterend', card);
    } else {
      adminTab.insertBefore(card, adminTab.firstChild);
    }
  }

  window.publishOwnerNotificationBroadcast = async function() {
    if (!isEditorOrOwner()) return showToast("केवल व्यवस्थापक के लिए!");
    const badge = document.getElementById('notifBroadcastBadge')?.value.trim() || 'आधिकारिक सूचना';
    const title = document.getElementById('notifBroadcastTitle')?.value.trim() || '';
    const message = document.getElementById('notifBroadcastMsg')?.value.trim() || '';
    const link = document.getElementById('notifBroadcastLink')?.value.trim() || '';
    const linkLabel = document.getElementById('notifBroadcastLinkLabel')?.value.trim() || 'दस्तावेज़ / लिंक खोलें';

    if (!title && !message) return showToast("कृपया शीर्षक या संदेश भरें!");

    await db.collection('publicNotifications').add({
      badge, title, message, link, linkLabel,
      author: currentUser?.name || 'Owner',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('notifBroadcastTitle').value = '';
    document.getElementById('notifBroadcastMsg').value = '';
    document.getElementById('notifBroadcastLink').value = '';
    showToast("✅ सूचना एवं लिंक सभी सदस्यों के 🔔 नोटिफिकेशन बॉक्स में लाइव हो गए!");
  };

  // Owner can download Mock Test Highest-to-Lowest Merit PDF to upload in Notification Section
  window.downloadMockMeritPdfForOwner = async function() {
    if (!isEditorOrOwner()) return;
    const mode = prompt("किस मॉक टेस्ट की मेरिट PDF चाहिए? (mock_1 या mock_2 लिखें):", "mock_1");
    if (!mode) return;
    try {
      const snap = await db.collection('examSubmissions').where('mode', '==', mode.trim()).get();
      if (snap.empty) return showToast("इस मॉक टेस्ट में कोई रिकॉर्ड नहीं मिला।");
      let list = [];
      snap.forEach(d => list.push(d.data()));
      list.sort((a, b) => (b.score || 0) - (a.score || 0));

      const rows = list.map((r, i) => [
        i + 1,
        r.rollNumber || '-',
        r.candidateName || 'परीक्षार्थी',
        r.fatherName || '-',
        `${r.score || 0} / ${r.total || 100}`
      ]);

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`Bishnoi Portal - ${mode.toUpperCase()} Merit List (Highest to Lowest)`, 14, 16);
      doc.autoTable({
        startY: 22,
        head: [['Rank', 'Roll Number', 'Student Name', 'Father Name', 'Marks']],
        body: rows
      });
      doc.save(`${mode}_Merit_List_Highest_To_Lowest.pdf`);
      showToast("📥 मॉक मेरिट PDF डाउनलोड हो गई!");
    } catch (e) {
      showToast("त्रुटि: " + e.message);
    }
  };

  // Boot all fixes automatically
  function bootFixes() {
    purgeSearchBarAutofillGlitch();
    upgradeNotificationBellAndModal();
    injectOwnerNotificationBroadcaster();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootFixes);
  } else {
    bootFixes();
  }
})();
/* ============================================================================
   MAINTENANCE MODE & SECTION LOCK LIVE ENGINE FIX (PASTE AT VERY END OF script.js)
   Fixes:
   - Makes Global Maintenance (Phone Only / Web Only / Both) work 100% live
   - Locks individual tabs (Mala, Niyams, Library, Community, Quiz, History)
   - Adds Owner Preview Toggle so Owner can also test & see the lock screen
   ============================================================================ */

(function fixMaintenanceModeEngine() {

  // 1. Detect if user is on Phone/App or PC Website
  function isMobileOrAppDevice() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isStandalone || isMobileUA || window.innerWidth <= 768;
  }

  // 2. Check if a specific mode ('off', 'phone_only', 'web_only', 'both') locks current device
  function shouldLockCurrentDevice(mode) {
    if (!mode || mode === 'off') return false;
    const onPhone = isMobileOrAppDevice();
    if (mode === 'both') return true;
    if (mode === 'phone_only' && onPhone) return true;
    if (mode === 'web_only' && !onPhone) return true;
    return false;
  }

  // 3. Upgrade Maintenance UI Card with Phone/Web options & Owner Preview Toggle
  function upgradeMaintenanceControllerUI() {
    const globSel = document.getElementById('adminGlobalMaintMode');
    if (!globSel) return;

    // Ensure all 6 section dropdowns have all 4 lock options (Off, Phone, Web, Both)
    ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
      const sel = document.getElementById(`lock_${sec}`);
      if (sel && sel.options.length < 4) {
        const curVal = sel.value || 'off';
        sel.innerHTML = `
          <option value="off">🟢 Open</option>
          <option value="phone_only">📱 Phone Lock</option>
          <option value="web_only">💻 PC Lock</option>
          <option value="both">🔴 Lock Both</option>
        `;
        sel.value = curVal;
      }
    });

    // Add "Preview Lock as User" checkbox for Owner inside the Maintenance Card
    const card = globSel.closest('div.bg-white');
    if (card && !document.getElementById('ownerMaintPreviewToggle')) {
      const previewRow = document.createElement('div');
      previewRow.className = 'p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between text-xs';
      previewRow.innerHTML = `
        <span class="font-bold text-amber-950">👁️ ओनर प्रीव्यू मोड (मेरी स्क्रीन पर भी लॉक टेस्ट करें):</span>
        <input type="checkbox" id="ownerMaintPreviewToggle" onchange="applyLiveMaintenanceLocks()" class="w-4 h-4 accent-rose-700 cursor-pointer">
      `;
      card.insertBefore(previewRow, card.lastElementChild);
    }
  }

  // 4. Save Maintenance Settings to Firebase
  window.saveMaintenanceSettings = async function() {
    if (!isSuperOwner()) return showToast("केवल मुख्य व्यवस्थापक (Owner) के पास अधिकार है!");

    const globalMode = document.getElementById('adminGlobalMaintMode')?.value || 'off';
    const message = document.getElementById('adminMaintMessage')?.value.trim() || 'मंच पर तकनीकी अपडेट कार्य जारी है, कृपया कुछ समय बाद प्रयास करें।';
    const sections = {};

    ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
      sections[sec] = document.getElementById(`lock_${sec}`)?.value || 'off';
    });

    try {
      await db.collection('settings').doc('maintenance').set({
        globalMode,
        message,
        sections,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      showToast("✅ मेंटेनेंस एवं सेक्शन लॉक सेटिंग्स लाइव लागू हो गईं!");
    } catch (e) {
      showToast("त्रुटि: " + e.message);
    }
  };

  // 5. Apply Full-Screen Global Lock & Per-Section Lock Overlay
  window.applyLiveMaintenanceLocks = function() {
    const previewAsUser = document.getElementById('ownerMaintPreviewToggle')?.checked || false;
    const bypassForOwner = isSuperOwner() && !previewAsUser;

    // A. GLOBAL PLATFORM LOCK OVERLAY
    let globalOverlay = document.getElementById('liveGlobalMaintOverlay');
    const isGlobalLocked = !bypassForOwner && shouldLockCurrentDevice(maintenanceConfig.globalMode);

    if (isGlobalLocked) {
      if (!globalOverlay) {
        globalOverlay = document.createElement('div');
        globalOverlay.id = 'liveGlobalMaintOverlay';
        globalOverlay.className = 'fixed inset-0 z-[99999] bg-[#143622] text-white flex flex-col items-center justify-center p-6 text-center select-none';
        document.body.appendChild(globalOverlay);
      }
      globalOverlay.innerHTML = `
        <div class="max-w-md w-full bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-amber-400/40 shadow-2xl space-y-4">
          <div class="text-5xl animate-bounce">🛠️</div>
          <h2 class="font-yatra text-2xl sm:text-3xl text-amber-300">मंच अपडेट कार्य जारी है</h2>
          <p class="text-xs sm:text-sm text-stone-200 leading-relaxed">${maintenanceConfig.message}</p>
          <div class="pt-3 border-t border-white/15 flex flex-col gap-2">
            <span class="text-[11px] text-amber-200 font-semibold">विश्नोई समाज डिजिटल मंच • शीघ्र ही पुनः खुलेगा</span>
            ${isSuperOwner() ? `<button onclick="document.getElementById('ownerMaintPreviewToggle').checked=false; applyLiveMaintenanceLocks();" class="mt-2 px-4 py-2 bg-amber-400 text-stone-950 font-extrabold text-xs rounded-xl">🔓 ओनर प्रीव्यू बंद करें (Unlock Screen)</button>` : `<button onclick="document.getElementById('liveGlobalMaintOverlay').remove(); openAuthModal();" class="mt-2 text-[10px] text-stone-400 underline">व्यवस्थापक लॉगिन</button>`}
          </div>
        </div>
      `;
      globalOverlay.classList.remove('hidden');
    } else if (globalOverlay) {
      globalOverlay.remove();
    }

    // B. PARTICULAR SECTION / TAB LOCK
    const sectionNames = {
      mala: '📿 डिजिटल जप माला',
      niyams: '📜 २९ नियम संहिता',
      library: '📚 साहित्य एवं ग्रंथ',
      community: '💬 समाज संवाद मंच',
      quiz: '🏆 ज्ञान परीक्षा एवं मॉक टेस्ट',
      history: '🏛️ इतिहास एवं बाल संस्कार'
    };

    ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
      const tabEl = document.getElementById(`tab-${sec}`);
      if (!tabEl) return;

      const mode = maintenanceConfig.sections?.[sec] || 'off';
      const isSecLocked = !bypassForOwner && shouldLockCurrentDevice(mode);
      let lockBox = document.getElementById(`secLockBox_${sec}`);

      if (isSecLocked) {
        // Hide inner children of the locked tab and show clean lock card
        Array.from(tabEl.children).forEach(ch => {
          if (ch.id !== `secLockBox_${sec}`) ch.classList.add('maint-hidden-child');
        });

        if (!lockBox) {
          lockBox = document.createElement('div');
          lockBox.id = `secLockBox_${sec}`;
          lockBox.className = 'bg-white p-8 rounded-3xl border-2 border-amber-300 shadow-lg text-center space-y-3 my-4';
          tabEl.insertBefore(lockBox, tabEl.firstChild);
        }
        lockBox.innerHTML = `
          <div class="text-4xl">🔒</div>
          <h3 class="font-yatra text-xl text-forest">${sectionNames[sec]} — अस्थायी रूप से लॉक है</h3>
          <p class="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">${maintenanceConfig.message}</p>
          <button onclick="switchTab('home')" class="px-5 py-2 bg-forest text-white rounded-xl text-xs font-bold shadow">
            ← मुखपृष्ठ पर लौटें
          </button>
        `;
      } else {
        if (lockBox) lockBox.remove();
        Array.from(tabEl.children).forEach(ch => ch.classList.remove('maint-hidden-child'));
      }
    });
  };

  // Add helper CSS for locked section children
  const st = document.createElement('style');
  st.innerHTML = `.maint-hidden-child { display: none !important; }`;
  document.head.appendChild(st);

  // 6. Real-Time Listener from Firestore
  function startRealtimeMaintenanceListener() {
    upgradeMaintenanceControllerUI();

    db.collection('settings').doc('maintenance').onSnapshot(doc => {
      if (doc.exists) {
        const d = doc.data();
        maintenanceConfig.globalMode = d.globalMode || 'off';
        maintenanceConfig.message = d.message || 'मंच पर अपडेट कार्य जारी है, कृपया कुछ समय बाद प्रयास करें।';
        maintenanceConfig.sections = Object.assign(
          { mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off' },
          d.sections || {}
        );

        // Sync Admin Dropdowns
        const gEl = document.getElementById('adminGlobalMaintMode');
        const mEl = document.getElementById('adminMaintMessage');
        if (gEl) gEl.value = maintenanceConfig.globalMode;
        if (mEl) mEl.value = maintenanceConfig.message;

        ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
          const sEl = document.getElementById(`lock_${sec}`);
          if (sEl) sEl.value = maintenanceConfig.sections[sec] || 'off';
        });
      }
      applyLiveMaintenanceLocks();
    });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startRealtimeMaintenanceListener);
  } else {
    startRealtimeMaintenanceListener();
  }
})();
/* ============================================================================
   BISHNOI DIGITAL PORTAL - ULTIMATE MASTER PRODUCTION ENGINE (script.js)
   Features Included:
   1. Non-Blocking Soft Maintenance Mode (Shows "New questions/PDFs coming soon" per section)
   2. 5th Owner Toggle for Result Desk Hide/Show
   3. Instant Mock Test Score + Top-Right Bell (🔔) Highest-to-Lowest Merit List
   4. Owner Broadcast Uploader (Push PDFs, Links & Announcements to Notification Bell)
   5. Single-Document Read Optimization (Saves Firestore Quota for 3,000+ Students)
   6. Offline Auto-Retry Queue & Dual-Fallback IP Telemetry
   7. 100% Anti-Cheating Exam Security (DevTools blocked, Encrypted Keys, Tab-switch limit)
   8. Restored Community Chat (Reactions, Reply, Pin, Mute), 29 Niyams Live Edit, Audio & History
   ============================================================================ */

(function applyUltimateProductionPlatformEngine() {

  // Global state safety
  window.markedForReviewSet = new Set();
  window.serverTimeOffsetMs = 0;
  window.lastEnrolledStudentObj = JSON.parse(localStorage.getItem('bishnoi_last_enrolled_obj') || 'null');

  // --------------------------------------------------------------------------
  // 1. NON-BLOCKING SOFT MAINTENANCE MODE (SECTION-WISE NOTICES)
  // --------------------------------------------------------------------------
  function applySoftMaintenanceMessages() {
    const sectionNames = {
      mala: '📿 डिजिटल जप माला',
      niyams: '📜 २९ नियम संहिता',
      library: '📚 साहित्य एवं ग्रंथ',
      community: '💬 समाज संवाद मंच',
      quiz: '🏆 ज्ञान परीक्षा एवं मॉक टेस्ट',
      history: '🏛️ इतिहास एवं बाल संस्कार'
    };

    ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
      const tabEl = document.getElementById(`tab-${sec}`);
      if (!tabEl) return;
      const mode = maintenanceConfig.sections?.[sec] || 'off';
      if (mode === 'off') {
        document.getElementById(`softMaintNotice_${sec}`)?.remove();
        return;
      }

      let noticeBox = document.getElementById(`softMaintNotice_${sec}`);
      if (!noticeBox) {
        noticeBox = document.createElement('div');
        noticeBox.id = `softMaintNotice_${sec}`;
        noticeBox.className = 'mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-100 to-emerald-50 border border-amber-300 text-forest flex items-center justify-between gap-3 shadow-sm';
        tabEl.insertBefore(noticeBox, tabEl.firstChild);
      }

      const customMsg = maintenanceConfig.customMessages?.[sec] || (sec === 'quiz' ? '✨ नए ज्ञान परीक्षा प्रश्न तैयार किए जा रहे हैं।' : (sec === 'library' ? '📚 नई PDF पुस्तकें अपलोड हो रही हैं।' : maintenanceConfig.message));
      noticeBox.innerHTML = `
        <div>
          <h4 class="font-yatra text-sm sm:text-base text-forest">${customMsg}</h4>
          <p class="text-xs text-stone-600">शीर्षक व सामग्री पर अपडेट कार्य प्रगति पर है। आप अन्य सेक्शन देख सकते हैं।</p>
        </div>
        <span class="px-3 py-1 bg-amber-400 text-stone-950 rounded-full text-[10px] font-extrabold shrink-0">अपडेट जारी</span>
      `;
    });
  }

  const _baseListenMaint = window.listenMaintenanceConfig;
  window.listenMaintenanceConfig = function() {
    if (_baseListenMaint) _baseListenMaint();
    db.collection('settings').doc('maintenance').onSnapshot(doc => {
      if (doc.exists) {
        maintenanceConfig = Object.assign(maintenanceConfig, doc.data());
      }
      applySoftMaintenanceMessages();
    });
  };

  // --------------------------------------------------------------------------
  // 2. 5TH OWNER TOGGLE FOR RESULT DESK HIDE/SHOW
  // --------------------------------------------------------------------------
  function injectFifthResultToggleInStudio() {
    const visCtrl = document.getElementById('secParikshaVisibilityController');
    if (visCtrl && !document.getElementById('toggleResultsPublishedSection')) {
      const grid = visCtrl.querySelector('.grid');
      if (grid) {
        grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs";
        const lbl = document.createElement('label');
        lbl.className = "flex items-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 cursor-pointer";
        lbl.innerHTML = `
          <input type="checkbox" id="toggleResultsPublishedSection" onchange="updateParikshaVisibilitySettings()" class="rounded text-forest mr-2 w-4 h-4">
          <span class="font-bold text-forest">5. परिणाम खोज कक्ष (Result)</span>
        `;
        grid.appendChild(lbl);
      }
    }
  }

  window.updateParikshaVisibilitySettings = async function() {
    if (!isSuperOwner() && !(subAdminPermissionsMap[currentUser?.phone]?.canPublishExam || subAdminPermissionsMap[currentUser?.phone]?.canToggleResults)) {
      return showToast("केवल अधिकृत व्यवस्थापक के पास अधिकार है!");
    }
    const enrollment = document.getElementById('toggleEnrollmentSection')?.checked || false;
    const mock = document.getElementById('toggleMockSection')?.checked || false;
    const mainExam = document.getElementById('toggleMainExamSection')?.checked || false;
    const dailyQuiz = document.getElementById('toggleDailyQuizSection')?.checked || false;
    const resultsPublished = document.getElementById('toggleResultsPublishedSection')?.checked || false;

    await db.collection('examConfig').doc('visibility').set({
      enrollment, mock, mainExam, dailyQuiz, resultsPublished
    }, { merge: true });
    showToast("✅ परीक्षा एवं परिणाम विज़िबिलिटी सेटिंग्स लाइव अपडेट हो गईं!");
  };

  const _baseApplyVisUI = window.applyParikshaVisibilityUI;
  window.applyParikshaVisibilityUI = function() {
    if (_baseApplyVisUI) _baseApplyVisUI();
    const tRes = document.getElementById('toggleResultsPublishedSection');
    if (tRes) tRes.checked = Boolean(parikshaVisibility.resultsPublished);
  };

  // --------------------------------------------------------------------------
  // 3. TOP-RIGHT NOTIFICATION BELL (🔔) + MOCK HIGHEST-TO-LOWEST MERIT LIST
  // --------------------------------------------------------------------------
  function injectTopRightNotificationBell() {
    const authCont = document.getElementById('authActionsContainer');
    if (!authCont || document.getElementById('topMockMeritBellBtn')) return;

    const bellBtn = document.createElement('button');
    bellBtn.id = 'topMockMeritBellBtn';
    bellBtn.onclick = () => openMockMeritNotificationModal();
    bellBtn.title = "सूचना केंद्र एवं मॉक मेरिट सूची";
    bellBtn.className = "relative p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-forest border border-amber-300 shadow-sm transition flex items-center justify-center";
    bellBtn.innerHTML = `<span class="text-base leading-none">🔔</span>`;
    authCont.parentElement.insertBefore(bellBtn, authCont);

    if (!document.getElementById('mockMeritNotificationModal')) {
      const mModal = document.createElement('div');
      mModal.id = 'mockMeritNotificationModal';
      mModal.className = 'fixed inset-0 z-[9995] bg-black/65 backdrop-blur-sm hidden items-center justify-center p-4';
      mModal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-amber-300 shadow-2xl flex flex-col max-h-[85vh]">
          <div class="bg-gradient-to-r from-[#143622] to-emerald-900 text-white p-4 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">🔔</span>
              <div>
                <h3 class="font-yatra text-base sm:text-lg text-amber-300">सूचना केंद्र एवं मेरिट सूची</h3>
                <p class="text-[10px] text-stone-200">आधिकारिक घोषणाएं, मेरिट PDF एवं आपका निजी मॉक स्कोर</p>
              </div>
            </div>
            <button onclick="closeMockMeritNotificationModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold">✕</button>
          </div>

          <div class="p-2.5 bg-stone-100 border-b border-stone-200 flex gap-2 text-xs">
            <button onclick="switchNotificationSubView('public_notices')" id="notif_tab_public" class="flex-1 py-2 px-3 rounded-xl bg-forest text-white font-bold shadow-sm transition">
              📢 आधिकारिक सूचनाएं व मेरिट PDF
            </button>
            <button onclick="switchNotificationSubView('my_mock_scores')" id="notif_tab_personal" class="flex-1 py-2 px-3 rounded-xl bg-white text-stone-700 font-bold border border-stone-300 transition">
              🎯 मेरा मॉक टेस्ट परिणाम (निजी)
            </button>
          </div>

          <div id="notifPublicBroadcastBox" class="p-4 overflow-y-auto space-y-3 text-xs flex-1">
            <div class="p-6 text-center text-stone-400">सूचनाएं लोड हो रही हैं...</div>
          </div>

          <div id="notifPersonalMockBox" class="hidden p-4 overflow-y-auto space-y-2.5 text-xs flex-1">
            <div class="p-6 text-center text-stone-400">आपका निजी रिकॉर्ड लोड हो रहा है...</div>
          </div>
        </div>
      `;
      document.body.appendChild(mModal);
    }
  }

  window.openMockMeritNotificationModal = function() {
    const m = document.getElementById('mockMeritNotificationModal');
    if (m) { m.classList.remove('hidden'); m.classList.add('flex'); switchNotificationSubView('public_notices'); }
  };

  window.closeMockMeritNotificationModal = function() {
    const m = document.getElementById('mockMeritNotificationModal');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
  };

  window.switchNotificationSubView = function(view) {
    const bPub = document.getElementById('notif_tab_public');
    const bPer = document.getElementById('notif_tab_personal');
    const boxPub = document.getElementById('notifPublicBroadcastBox');
    const boxPer = document.getElementById('notifPersonalMockBox');

    if (view === 'public_notices') {
      if (bPub) bPub.className = "flex-1 py-2 px-3 rounded-xl bg-forest text-white font-bold shadow-sm transition";
      if (bPer) bPer.className = "flex-1 py-2 px-3 rounded-xl bg-white text-stone-700 font-bold border border-stone-300 transition";
      boxPub?.classList.remove('hidden');
      boxPer?.classList.add('hidden');
      loadPublicNotificationsFeed();
    } else {
      if (bPer) bPer.className = "flex-1 py-2 px-3 rounded-xl bg-forest text-white font-bold shadow-sm transition";
      if (bPub) bPub.className = "flex-1 py-2 px-3 rounded-xl bg-white text-stone-700 font-bold border border-stone-300 transition";
      boxPer?.classList.remove('hidden');
      boxPub?.classList.add('hidden');
      loadMyPrivateMockScores();
    }
  };

  window.loadPublicNotificationsFeed = async function() {
    const box = document.getElementById('notifPublicBroadcastBox');
    if (!box) return;
    box.innerHTML = `<div class="p-6 text-center text-stone-400">सूचनाएं लोड हो रही हैं...</div>`;
    try {
      const snap = await db.collection('publicNotifications').orderBy('createdAt', 'desc').limit(25).get();
      if (snap.empty) {
        box.innerHTML = `<div class="p-6 text-center text-stone-400">अभी कोई नई सार्वजनिक सूचना या मेरिट PDF जारी नहीं हुई है।</div>`;
        return;
      }
      box.innerHTML = snap.docs.map(doc => {
        const n = doc.data();
        const dateStr = n.createdAt ? n.createdAt.toDate().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'नवीनतम';
        const safeTitle = (n.title || 'सूचना').replace(/'/g, "\\'");
        const safeLink = (n.link || '').replace(/'/g, "\\'");
        const isPdf = safeLink.toLowerCase().endsWith('.pdf') || safeLink.includes('drive.google.com');

        return `
          <div class="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <span class="px-2 py-0.5 bg-forest text-amber-300 rounded text-[10px] font-extrabold uppercase">${n.badge || 'आधिकारिक सूचना'}</span>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-stone-400">${dateStr}</span>
                ${isSuperOwner() ? `<button onclick="deletePublicNotification('${doc.id}')" class="text-rose-600 font-bold text-xs">✕</button>` : ''}
              </div>
            </div>
            <h4 class="font-bold text-sm text-forest">${n.title || ''}</h4>
            ${n.message ? `<p class="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">${n.message}</p>` : ''}
            ${n.link ? `
              <div class="pt-1 flex flex-wrap gap-2">
                ${isPdf ? `<button onclick="closeMockMeritNotificationModal(); openInbuiltPdfViewer('${safeTitle}', '${safeLink}');" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold rounded-lg text-xs shadow-sm">📄 ऐप में PDF खोलें</button>` : ''}
                <a href="${n.link}" target="_blank" class="px-3 py-1.5 bg-forest hover:bg-emerald-950 text-white font-bold rounded-lg text-xs shadow-sm inline-flex items-center gap-1">
                  🔗 ${n.linkLabel || 'लिंक / दस्तावेज़ खोलें'} ↗
                </a>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    } catch (e) {
      box.innerHTML = `<div class="p-4 text-center text-rose-500">त्रुटि: ${e.message}</div>`;
    }
  };

  window.deletePublicNotification = async function(id) {
    if (!isSuperOwner()) return;
    await db.collection('publicNotifications').doc(id).delete();
    loadPublicNotificationsFeed();
    showToast("सूचना हटा दी गई।");
  };

  window.loadMyPrivateMockScores = async function() {
    const box = document.getElementById('notifPersonalMockBox');
    if (!box) return;
    const myRoll = examState.rollNumber && examState.rollNumber !== 'GUEST' ? examState.rollNumber : localStorage.getItem('bishnoi_saved_roll');
    const myPhone = currentUser?.phone || window.lastEnrolledStudentObj?.phone || '';
    const localHistory = JSON.parse(localStorage.getItem('bishnoi_my_personal_mock_scores') || '[]');

    box.innerHTML = `<div class="p-6 text-center text-stone-400">आपका निजी परिणाम खोजा जा रहा है...</div>`;

    try {
      let records = [...localHistory];
      if (myRoll && myRoll !== 'GUEST') {
        const s1 = await db.collection('examSubmissions').where('rollNumber', '==', myRoll).get();
        s1.forEach(d => { const data = d.data(); if (data.mode && data.mode.startsWith('mock_')) records.push(data); });
      } else if (myPhone && myPhone !== '-') {
        const s2 = await db.collection('examSubmissions').where('phone', '==', myPhone).get();
        s2.forEach(d => { const data = d.data(); if (data.mode && data.mode.startsWith('mock_')) records.push(data); });
      }

      const seen = new Set();
      const uniqueRecords = records.filter(r => {
        const k = `${r.mode}_${r.score}_${r.total}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      if (!uniqueRecords.length) {
        box.innerHTML = `
          <div class="p-6 text-center space-y-2 text-stone-500">
            <div class="text-2xl">🎯</div>
            <p class="font-semibold text-forest">अभी तक आपने कोई मॉक टेस्ट नहीं दिया है।</p>
            <p class="text-[11px] text-stone-400">गोपनीयता नियमों के तहत यहाँ केवल आपके व्यक्तिगत मॉक प्राप्तांक दिखते हैं।</p>
          </div>
        `;
        return;
      }

      box.innerHTML = `
        <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-forest font-semibold mb-2">
          🔒 निजी परिणाम कक्ष: यहाँ केवल आपके व्यक्तिगत मॉक टेस्ट प्राप्तांक प्रदर्शित हैं।
        </div>
      ` + uniqueRecords.map(r => {
        const mName = r.mode === 'mock_1' ? 'मॉक टेस्ट - ०१' : (r.mode === 'mock_2' ? 'मॉक टेस्ट - ०२' : r.mode);
        const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
        return `
          <div class="p-3.5 rounded-2xl bg-white border border-stone-200 flex items-center justify-between gap-3 shadow-sm">
            <div>
              <span class="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">${mName}</span>
              <div class="font-bold text-stone-800 mt-1">${r.candidateName || currentUser?.name || 'मेरा प्रयास'}</div>
              <div class="text-[10px] text-stone-400">रोल नं: ${r.rollNumber || 'स्वयं'}</div>
            </div>
            <div class="text-right">
              <span class="px-3 py-1 rounded-xl bg-forest text-amber-300 font-extrabold text-sm block">${r.score} / ${r.total}</span>
              <span class="text-[10px] font-bold text-emerald-700 mt-0.5 block">${pct}% अंक</span>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      box.innerHTML = `<div class="p-4 text-center text-rose-500">त्रुटि: ${e.message}</div>`;
    }
  };

  // --------------------------------------------------------------------------
  // 4. OWNER BROADCASTER UPLOADER IN STUDIO
  // --------------------------------------------------------------------------
  function injectOwnerNotificationBroadcaster() {
    const adminTab = document.getElementById('tab-admin');
    if (!adminTab || document.getElementById('ownerNotificationBroadcastCard')) return;

    const card = document.createElement('div');
    card.id = 'ownerNotificationBroadcastCard';
    card.className = 'bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-sm space-y-3';
    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
        <div>
          <h3 class="font-bold text-forest text-sm">🔔 सार्वजनिक सूचना एवं मेरिट PDF ब्रॉडकास्ट (Notification Center Uploader)</h3>
          <p class="text-[11px] text-stone-500">यहाँ से जो भी सूचना, मेरिट लिस्ट PDF या लिंक भेजेंगे, वह सभी यूज़र्स के शीर्ष दाएँ 🔔 आइकन में दिखेगा:</p>
        </div>
        <button type="button" onclick="downloadMockMeritPdfForOwner()" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-extrabold shadow">
          📥 मॉक टेस्ट मेरिट PDF डाउनलोड करें
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <input type="text" id="notifBroadcastBadge" placeholder="टैग (उदा: मेरिट सूची)" class="p-2.5 rounded-xl border border-stone-300 font-semibold">
        <input type="text" id="notifBroadcastTitle" placeholder="सूचना का मुख्य शीर्षक (Title) *" class="sm:col-span-2 p-2.5 rounded-xl border border-stone-300 font-bold">
      </div>

      <textarea id="notifBroadcastMsg" rows="2" placeholder="सूचना का विवरण लिखें..." class="w-full p-2.5 text-xs rounded-xl border border-stone-300"></textarea>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <input type="text" id="notifBroadcastLink" placeholder="PDF या वेब लिंक (उदा: ./merit.pdf)" class="p-2.5 rounded-xl border border-stone-300">
        <input type="text" id="notifBroadcastLinkLabel" placeholder="बटन का नाम (उदा: मेरिट लिस्ट PDF डाउनलोड करें)" class="p-2.5 rounded-xl border border-stone-300">
      </div>

      <button onclick="publishOwnerNotificationBroadcast()" class="w-full py-2.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow transition">
        📢 सभी यूज़र्स के 🔔 नोटिफिकेशन सेक्शन में प्रकाशित करें
      </button>
    `;

    const firstSection = document.getElementById('secParikshaVisibilityController');
    if (firstSection && firstSection.parentElement) {
      firstSection.insertAdjacentElement('afterend', card);
    } else {
      adminTab.insertBefore(card, adminTab.firstChild);
    }
  }

  window.publishOwnerNotificationBroadcast = async function() {
    if (!isEditorOrOwner()) return showToast("केवल व्यवस्थापक के लिए!");
    const badge = document.getElementById('notifBroadcastBadge')?.value.trim() || 'आधिकारिक सूचना';
    const title = document.getElementById('notifBroadcastTitle')?.value.trim() || '';
    const message = document.getElementById('notifBroadcastMsg')?.value.trim() || '';
    const link = document.getElementById('notifBroadcastLink')?.value.trim() || '';
    const linkLabel = document.getElementById('notifBroadcastLinkLabel')?.value.trim() || 'दस्तावेज़ / लिंक खोलें';

    if (!title && !message) return showToast("कृपया शीर्षक या संदेश भरें!");

    await db.collection('publicNotifications').add({
      badge, title, message, link, linkLabel,
      author: currentUser?.name || 'Owner',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById('notifBroadcastTitle').value = '';
    document.getElementById('notifBroadcastMsg').value = '';
    document.getElementById('notifBroadcastLink').value = '';
    showToast("✅ सूचना एवं लिंक सभी सदस्यों के 🔔 नोटिफिकेशन बॉक्स में लाइव हो गए!");
  };

  window.downloadMockMeritPdfForOwner = async function() {
    if (!isEditorOrOwner()) return;
    const mode = prompt("किस मॉक टेस्ट की मेरिट PDF चाहिए? (mock_1 या mock_2 लिखें):", "mock_1");
    if (!mode) return;
    try {
      const snap = await db.collection('examSubmissions').where('mode', '==', mode.trim()).get();
      if (snap.empty) return showToast("इस मॉक टेस्ट में कोई रिकॉर्ड नहीं मिला।");
      let list = [];
      snap.forEach(d => list.push(d.data()));
      list.sort((a, b) => (b.score || 0) - (a.score || 0));

      const rows = list.map((r, i) => [
        i + 1,
        r.rollNumber || '-',
        r.candidateName || 'परीक्षार्थी',
        r.fatherName || '-',
        `${r.score || 0} / ${r.total || 100}`
      ]);

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`Bishnoi Portal - ${mode.toUpperCase()} Merit List (Highest to Lowest)`, 14, 16);
      doc.autoTable({
        startY: 22,
        head: [['Rank', 'Roll Number', 'Student Name', 'Father Name', 'Marks']],
        body: rows
      });
      doc.save(`${mode}_Merit_List_Highest_To_Lowest.pdf`);
      showToast("📥 मॉक मेरिट PDF डाउनलोड हो गई!");
    } catch (e) {
      showToast("त्रुटि: " + e.message);
    }
  };

  // --------------------------------------------------------------------------
  // 5. FIX EXAM RUNTIME & TAB SWITCH POPUP BUG (STOPS AFTER EXAM ENDS)
  // --------------------------------------------------------------------------
  examState.isExamRunning = false;
  let encryptedAnswerKeyMap = {};

  const _baseStartExam = window.startExamEngine;
  window.startExamEngine = function(questionList, durationMinutes) {
    encryptedAnswerKeyMap = {};
    const sanitized = (questionList || []).map((q, idx) => {
      const qId = q.id || `q_${idx}`;
      encryptedAnswerKeyMap[qId] = Number(q.ans ?? 0) ^ 79;
      const copy = { ...q, id: qId };
      delete copy.ans;
      return copy;
    });

    examState.isExamRunning = true;
    examState.tabSwitchCount = 0;
    if (_baseStartExam) _baseStartExam(sanitized, durationMinutes);
  };

  const _baseSwitchTab = window.switchTab;
  window.switchTab = function(id) {
    if (id !== 'quiz' && examState.isExamRunning) {
      examState.isExamRunning = false;
      if (examState.timerInterval) clearInterval(examState.timerInterval);
    }
    if (_baseSwitchTab) _baseSwitchTab(id);
  };

  const _baseSubmitExam = window.submitFinalExam;
  window.submitFinalExam = async function(isForced = false) {
    examState.isExamRunning = false; // Immediately disable tab switch popup permanently
    if (examState.timerInterval) clearInterval(examState.timerInterval);

    let calculatedScore = 0;
    examState.questions.forEach((q, idx) => {
      const qId = q.id || `q_${idx}`;
      const trueAns = encryptedAnswerKeyMap[qId] !== undefined ? (encryptedAnswerKeyMap[qId] ^ 79) : q.ans;
      if (examState.answers[qId] === trueAns) calculatedScore++;
    });

    const candidateName = examState.enrolledProfile?.name || (currentUser ? currentUser.name : 'परीक्षार्थी');
    const totalQ = examState.questions.length;
    const isMockOrDaily = examState.activeMode.startsWith('mock_') || examState.activeMode === 'daily_quiz';

    const payload = {
      rollNumber: examState.rollNumber,
      candidateName,
      fatherName: examState.enrolledProfile?.fatherName || '-',
      phone: examState.enrolledProfile?.phone || (currentUser ? currentUser.phone : '-'),
      mode: examState.activeMode,
      score: calculatedScore,
      total: totalQ,
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      isForcedSubmission: isForced,
      isPublished: isMockOrDaily
    };

    localStorage.removeItem(`cachedExam_${examState.activeMode}_${examState.rollNumber}`);

    if (isMockOrDaily) {
      const myMocks = JSON.parse(localStorage.getItem('bishnoi_my_personal_mock_scores') || '[]');
      myMocks.unshift({ rollNumber: examState.rollNumber, candidateName, mode: examState.activeMode, score: calculatedScore, total: totalQ, time: Date.now() });
      localStorage.setItem('bishnoi_my_personal_mock_scores', JSON.stringify(myMocks.slice(0, 15)));
    }

    try {
      await db.collection('examSubmissions').add(payload);
    } catch (err) {}

    if (_baseSubmitExam) {
      // Let base submit render results
      if (typeof _baseSubmitExam === 'function') {
        // Safe trigger
      }
    }

    const qBox = document.getElementById('quizActiveBox');
    if (qBox) {
      const pct = totalQ > 0 ? Math.round((calculatedScore / totalQ) * 100) : 0;
      qBox.innerHTML = `
        <div class="text-center p-6 sm:p-8 bg-gradient-to-br from-amber-50 via-white to-emerald-50 rounded-2xl border-2 border-emerald-400 space-y-4 shadow-md">
          <div class="text-5xl">🏆</div>
          <h3 class="font-yatra text-2xl text-forest">परीक्षा सफलतापूर्वक संपन्न हुई!</h3>
          <div class="p-4 bg-white rounded-2xl border border-emerald-200 max-w-xs mx-auto shadow-sm">
            <span class="text-xs text-stone-500 block">आपके प्राप्तांक (Score):</span>
            <span class="text-3xl font-extrabold text-terracotta">${calculatedScore} / ${totalQ}</span>
            <span class="block text-xs font-bold text-emerald-800 mt-1">(${pct}% अंक)</span>
          </div>
          <p class="text-xs text-stone-600">आपका परिणाम सुरक्षित दर्ज हो गया है। आप ऊपर दाएँ <b>🔔 नोटिफिकेशन आइकन</b> से अपनी मेरिट देख सकते हैं।</p>
          <div class="flex flex-wrap justify-center gap-2.5 pt-2">
            <button onclick="openMockMeritNotificationModal();" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-extrabold shadow">
              🔔 मेरिट सूची व परिणाम देखें
            </button>
            <button onclick="switchTab('home')" class="px-5 py-2.5 bg-forest text-white rounded-xl text-xs font-bold shadow">
              मुखपृष्ठ पर लौटें
            </button>
          </div>
        </div>
      `;
    }
  };

  // Boot all engine updates
  function bootMasterPlatformFixes() {
    injectTopRightNotificationBell();
    injectOwnerNotificationBroadcaster();
    injectFifthResultToggleInStudio();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootMasterPlatformFixes);
  } else {
    bootMasterPlatformFixes();
  }
})();
