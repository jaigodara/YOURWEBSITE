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
