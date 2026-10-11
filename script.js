/* ==========================================================================
   Bishnoi Community Portal - Clean Standard App Engine (script.js)
   Redesigned per UI/UX Audit & Standard App Architecture (Jio / Swiggy / Amazon Style)
   Features:
   - Structured Hero Landing Page + 3 Core Pillar Cards + Progress Tracker
   - Clean, Simple White Bhajan Audio Bar (Removed dark Spotify box)
   - Sticky Mobile Bottom Navigation Bar (Home, Learn, Quiz, Chat, Profile)
   - 5-Tab Standard Owner Admin Console (Dashboard, Media, Content, Quiz/AI, System)
   - Strict Role-Based Admin Controls (100% Hidden from regular visitors)
   - 2-Line Preview Cards with "Read More" & Audio Storyteller for History/Kids
   - Page-by-Page Horizontal Book PDF Reader + Landscape Mode (Native Pinch-Zoom)
   - Owner Login (9306894518 / bishnoi29) + 1-Click Google Login + Forgot Password
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

// Default History & Kids Stories (2-Line Preview + Expandable)
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
    moral: 'सीख: मूक पशु-पक्षी हमारे परिवार की तरह हैं। घर के बाहर पक्षियों व जीवों के लिए पानी का परिंडा अवश्य रखें।'
  },
  {
    id: 'kids_2',
    type: 'kids',
    badge: '🌳 बाल कहानी २',
    title: 'अमृता देवी का साहस और खेजड़ी का पेड़',
    content: 'प्यारे बच्चों! जब राजा के सैनिक खेजड़ली गाँव में हरे पेड़ काटने आए, तो माता अमृता देवी ने डरने के बजाय पेड़ को अपनी बाहों में भर लिया और कहा कि जब तक हम जीवित हैं, पेड़ नहीं कटने देंगे। उनके साहस को देखकर राजा को भी क्षमा मांगनी पड़ी और पेड़ काटने पर हमेशा के लिए रोक लगा दी गई।',
    moral: 'सीख: हमें अपने जन्मदिन पर कम से कम एक पौधा ज़रूर लगाना चाहिए और कभी भी हरी टहनी नहीं तोड़नी चाहिए।'
  }
];

// 5. CLEAN STANDARD APP STYLES & SVG ICONS
const SVG_ICONS = {
  book: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  quiz: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>`,
  chat: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>`,
  home: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
  user: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`
};

function injectCleanLayoutStyles() {
  let styleEl = document.getElementById('cleanPortalFixStyles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'cleanPortalFixStyles';
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `
    html, body { max-width: 100vw; overflow-x: hidden; padding-bottom: 68px; }
    header > div, nav > div { flex-wrap: wrap !important; gap: 6px !important; }
    #authActionsContainer { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
    #winner1Name, #winner2Name, #winner3Name {
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: unset !important;
      word-break: break-word !important;
      line-height: 1.35 !important;
      display: block !important;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .admin-subtab-active {
      background-color: #143622 !important;
      color: #ffffff !important;
      border-color: #143622 !important;
    }
  `;
}

// 6. DEVICE DETECTION & MAINTENANCE ENGINE
function isPhoneOrInstalledApp() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isNarrowScreen = window.innerWidth <= 768;
  return isStandalone || isMobileUA || isNarrowScreen;
}

function shouldLockForCurrentDevice(mode) {
  if (!mode || mode === 'off') return false;
  if (currentUser && currentUser.isOwner) return false;
  const onPhone = isPhoneOrInstalledApp();
  if (mode === 'both') return true;
  if (mode === 'phone_only' && onPhone) return true;
  if (mode === 'web_only' && !onPhone) return true;
  return false;
}

// 7. CLEAN HOMEPAGE HERO, 3 PILLAR CARDS, PROGRESS TRACKER & STICKY BOTTOM NAV
function upgradeHomepageToCleanLayout() {
  const homeTab = document.getElementById('tab-home');
  if (!homeTab || document.getElementById('cleanHeroLandingSection')) return;

  // Remove any old Spotify dark card if present
  document.getElementById('jioSaavnPlayerCard')?.remove();
  const nativeAudio = document.getElementById('audioPlayer');
  const nativeSelect = document.getElementById('audioTrackSelect');
  if (nativeAudio) {
    nativeAudio.classList.remove('hidden');
    nativeAudio.className = 'w-full h-10 mt-2 rounded-lg';
  }
  if (nativeSelect) {
    nativeSelect.classList.remove('hidden');
    nativeSelect.className = 'w-full p-2 text-xs font-semibold rounded-lg border border-stone-300 bg-stone-50 text-forest';
  }

  const heroWrap = document.createElement('div');
  heroWrap.id = 'cleanHeroLandingSection';
  heroWrap.className = 'space-y-4 mb-5';
  heroWrap.innerHTML = `
    <!-- Clean Welcome Hero Banner -->
    <div class="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="space-y-1.5 max-w-2xl">
        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-forest border border-emerald-200">
          विश्नोई समाज डिजिटल मंच • अध्ययन • संरक्षण • संवाद
        </span>
        <h1 class="font-yatra text-xl sm:text-2xl text-forest">
          गुरु जम्भेश्वर भगवान के २९ नियम एवं सबदवाणी ज्ञान कोष
        </h1>
        <p class="text-xs sm:text-sm text-stone-600 leading-relaxed">
          सन् १४८५ में समराथल धोरा से प्रवर्तित पर्यावरण रक्षा, जीव दया और सदाचार की पावन जीवन-पद्धति को सरल हिंदी में पढ़ें, सुनें और दैनिक जीवन में अपनाएं।
        </p>
      </div>
      <div class="flex flex-wrap gap-2 shrink-0">
        <button onclick="switchTab('niyams')" class="px-4 py-2.5 bg-forest hover:bg-emerald-950 text-white text-xs font-bold rounded-xl shadow-sm transition">
          अध्ययन प्रारंभ करें →
        </button>
        <button onclick="switchTab('mala')" class="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 transition">
          डिजिटल जप माला
        </button>
      </div>
    </div>

    <!-- 3 Primary Pillar Cards (Literature, Quiz, Community) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button onclick="switchTab('library')" class="text-left bg-white hover:bg-emerald-50/40 p-4 rounded-2xl border border-stone-200 hover:border-forest shadow-sm transition group flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-100 text-forest flex items-center justify-center shrink-0 group-hover:bg-forest group-hover:text-white transition">
          ${SVG_ICONS.book}
        </div>
        <div>
          <h3 class="font-yatra text-base text-forest">साहित्य एवं ग्रंथ</h3>
          <p class="text-xs text-stone-500 mt-0.5">श्री सबदवाणी (१२० शब्द) व पावन साहित्य पुस्तक की तरह पढ़ें।</p>
        </div>
      </button>

      <button onclick="switchTab('quiz')" class="text-left bg-white hover:bg-amber-50/40 p-4 rounded-2xl border border-stone-200 hover:border-amber-500 shadow-sm transition group flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-stone-950 transition">
          ${SVG_ICONS.quiz}
        </div>
        <div>
          <h3 class="font-yatra text-base text-forest">दैनिक ज्ञान परीक्षा</h3>
          <p class="text-xs text-stone-500 mt-0.5">नियम व इतिहास पर प्रश्नोत्तरी खेलें और डिजिटल प्रमाण-पत्र पाएं।</p>
        </div>
      </button>

      <button onclick="switchTab('community')" class="text-left bg-white hover:bg-stone-50 p-4 rounded-2xl border border-stone-200 hover:border-stone-400 shadow-sm transition group flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 group-hover:bg-stone-800 group-hover:text-white transition">
          ${SVG_ICONS.chat}
        </div>
        <div>
          <h3 class="font-yatra text-base text-forest">समाज संवाद मंच</h3>
          <p class="text-xs text-stone-500 mt-0.5">समाज बंधुओं के साथ नियम, जीव रक्षा व संस्कारों पर चर्चा करें।</p>
        </div>
      </button>
    </div>

    <!-- User Learning Progress & Quick Explore Bar -->
    <div class="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="space-y-1">
        <span class="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">आपकी अध्ययन प्रगति (Your Progress)</span>
        <div class="flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-700">
          <span>२९ नियम पठन: <strong id="progNiyamsCount" class="text-forest">${readNiyamsSet.size}/29</strong></span>
          <span>•</span>
          <span>सर्वश्रेष्ठ परीक्षा अंक: <strong id="progQuizScore" class="text-terracotta">${bestQuizPct}%</strong></span>
          <span>•</span>
          <span>पूर्ण जप माला: <strong id="progMalaLaps" class="text-emerald-700">${malaLapsCount}</strong></span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button onclick="switchTab('history'); switchHistorySubTab('full-history');" class="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition">
          इतिहास दर्शन
        </button>
        <button onclick="switchTab('history'); switchHistorySubTab('kids');" class="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition">
          बाल संस्कार मंच
        </button>
      </div>
    </div>
  `;

  homeTab.insertBefore(heroWrap, homeTab.firstChild);

  // Enhance Search Bar with Quick Filter Chips
  const searchInp = document.getElementById('globalSearchInput');
  if (searchInp && searchInp.parentElement && !document.getElementById('quickSearchChips')) {
    const chips = document.createElement('div');
    chips.id = 'quickSearchChips';
    chips.className = 'flex items-center gap-1.5 flex-wrap mt-1.5 text-[11px]';
    chips.innerHTML = `
      <span class="text-stone-400">त्वरित खोज:</span>
      <button onclick="switchTab('niyams')" class="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium">२९ नियम</button>
      <button onclick="switchTab('library')" class="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium">सबदवाणी PDF</button>
      <button onclick="switchTab('history')" class="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium">खेजड़ली इतिहास</button>
      <button onclick="switchTab('quiz')" class="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium">ज्ञान परीक्षा</button>
    `;
    searchInp.parentElement.appendChild(chips);
  }
}

function updateProgressIndicators() {
  const nEl = document.getElementById('progNiyamsCount');
  const qEl = document.getElementById('progQuizScore');
  const mEl = document.getElementById('progMalaLaps');
  if (nEl) nEl.innerText = `${readNiyamsSet.size}/29`;
  if (qEl) qEl.innerText = `${bestQuizPct}%`;
  if (mEl) mEl.innerText = `${malaLapsCount}`;
}

function injectMobileBottomNavBar() {
  if (document.getElementById('standardMobileBottomNav')) return;
  const bottomNav = document.createElement('div');
  bottomNav.id = 'standardMobileBottomNav';
  bottomNav.className = 'fixed bottom-0 left-0 right-0 z-[95] bg-white border-t border-stone-200 shadow-lg flex sm:hidden items-center justify-around py-1.5 px-1 text-[11px] font-semibold text-stone-600';
  bottomNav.innerHTML = `
    <button onclick="switchTab('home')" id="bnav-home" class="flex flex-col items-center gap-0.5 py-1 px-2 text-forest font-bold">
      ${SVG_ICONS.home}
      <span>मुख्यपृष्ठ</span>
    </button>
    <button onclick="switchTab('library')" id="bnav-library" class="flex flex-col items-center gap-0.5 py-1 px-2">
      ${SVG_ICONS.book}
      <span>साहित्य</span>
    </button>
    <button onclick="switchTab('quiz')" id="bnav-quiz" class="flex flex-col items-center gap-0.5 py-1 px-2">
      ${SVG_ICONS.quiz}
      <span>परीक्षा</span>
    </button>
    <button onclick="switchTab('community')" id="bnav-community" class="flex flex-col items-center gap-0.5 py-1 px-2">
      ${SVG_ICONS.chat}
      <span>संवाद</span>
    </button>
    <button onclick="openProfileModal()" id="bnav-profile" class="flex flex-col items-center gap-0.5 py-1 px-2">
      ${SVG_ICONS.user}
      <span>प्रोफ़ाइल</span>
    </button>
  `;
  document.body.appendChild(bottomNav);
}

// 8. AMAZON / JIO / SWIGGY STYLE 5-TAB OWNER ADMIN CONSOLE
function organizeStandardOwnerConsole() {
  const adminTab = document.getElementById('tab-admin');
  if (!adminTab || document.getElementById('ownerStandardConsoleBar')) return;

  // Collect existing admin cards inside #tab-admin
  const existingChildren = Array.from(adminTab.children);

  // Create Top Analytics + 5 Sub-Tabs Navigation Bar
  const consoleHeader = document.createElement('div');
  consoleHeader.id = 'ownerStandardConsoleBar';
  consoleHeader.className = 'space-y-4 mb-4';
  consoleHeader.innerHTML = `
    <!-- Live Analytics Metrics Row -->
    <div class="bg-[#143622] text-white p-4 rounded-2xl shadow-md space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">OWNER COMMAND CENTER</span>
          <h2 class="font-yatra text-xl text-white">प्रबंधक नियंत्रण कक्ष (Admin Console)</h2>
        </div>
        <button onclick="refreshOwnerAnalytics()" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-amber-200 border border-white/15">
          ↻ डेटा रिफ्रेश करें
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div class="bg-white/10 p-3 rounded-xl border border-white/10">
          <span class="text-[11px] text-stone-300 block">कुल पंजीकृत सदस्य</span>
          <strong id="admStatUsers" class="text-xl font-bold text-amber-300">...</strong>
        </div>
        <div class="bg-white/10 p-3 rounded-xl border border-white/10">
          <span class="text-[11px] text-stone-300 block">कुल परीक्षा प्रयास</span>
          <strong id="admStatQuizzes" class="text-xl font-bold text-emerald-300">...</strong>
        </div>
        <div class="bg-white/10 p-3 rounded-xl border border-white/10">
          <span class="text-[11px] text-stone-300 block">संवाद मंच संदेश</span>
          <strong id="admStatPosts" class="text-xl font-bold text-white">...</strong>
        </div>
        <div class="bg-white/10 p-3 rounded-xl border border-white/10">
          <span class="text-[11px] text-stone-300 block">साहित्य व भजन</span>
          <strong id="admStatMedia" class="text-xl font-bold text-amber-200">...</strong>
        </div>
      </div>
    </div>

    <!-- 5 Clean Sub-Tab Buttons (Like Amazon/Swiggy Partner App) -->
    <div class="flex flex-wrap gap-1.5 bg-white p-2 rounded-xl border border-stone-200 shadow-sm">
      <button onclick="switchAdminSubTab('adm_overview')" id="admbtn_adm_overview" class="admin-subtab-active flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold border border-stone-200 transition">
        1. दैनिक संदेश व रिपोर्ट्स
      </button>
      <button onclick="switchAdminSubTab('adm_media')" id="admbtn_adm_media" class="flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition">
        2. साहित्य (PDF) व भजन
      </button>
      <button onclick="switchAdminSubTab('adm_content')" id="admbtn_adm_content" class="flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition">
        3. इतिहास व बाल संस्कार
      </button>
      <button onclick="switchAdminSubTab('adm_quiz')" id="admbtn_adm_quiz" class="flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition">
        4. ज्ञान परीक्षा व AI
      </button>
      <button onclick="switchAdminSubTab('adm_system')" id="admbtn_adm_system" class="flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition">
        5. मेंटेनेंस व सदस्य सुरक्षा
      </button>
    </div>
  `;

  // Create 5 Sub-Containers
  const panes = {
    adm_overview: document.createElement('div'),
    adm_media: document.createElement('div'),
    adm_content: document.createElement('div'),
    adm_quiz: document.createElement('div'),
    adm_system: document.createElement('div')
  };

  Object.keys(panes).forEach((k, idx) => {
    panes[k].id = k;
    panes[k].className = idx === 0 ? 'space-y-4' : 'hidden space-y-4';
  });

  // Sort existing HTML cards into the right sub-tab automatically so nothing is lost
  existingChildren.forEach(el => {
    const html = el.innerHTML || '';
    if (html.includes('adminPdfTitle') || html.includes('adminAudioTitle')) {
      panes.adm_media.appendChild(el);
    } else if (html.includes('adminBulkQuizText') || html.includes('win1InputName') || html.includes('aiQuizGenBtn')) {
      panes.adm_quiz.appendChild(el);
    } else if (html.includes('adminGlobalMaintMode') || html.includes('lock_mala')) {
      panes.adm_system.appendChild(el);
    } else {
      panes.adm_overview.appendChild(el);
    }
  });

  // Add History & Kids Manager into Pane 3 (adm_content)
  panes.adm_content.innerHTML = `
    <div class="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
      <h3 class="font-yatra text-base text-forest">इतिहास दर्शन एवं बाल संस्कार प्रबंधक (Add / Edit Content)</h3>
      <p class="text-xs text-stone-500">यहाँ से नया इतिहास अध्याय या बच्चों के लिए प्रेरक कहानी जोड़ें (२९ नियम या पुराने इतिहास कार्ड बदलने के लिए सीधे उस पेज पर जाकर 'Edit' दबाएं):</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <select id="adminHistType" class="p-2.5 rounded-lg border border-stone-300 font-bold text-forest bg-stone-50">
          <option value="history">इतिहास दर्शन (History Article)</option>
          <option value="kids">बाल संस्कार मंच (Kids Story)</option>
        </select>
        <input type="text" id="adminHistBadge" placeholder="छोटा टैग (उदा: इतिहास अध्याय या बाल कहानी)" class="p-2.5 rounded-lg border border-stone-300">
      </div>
      <input type="text" id="adminHistTitle" placeholder="मुख्य शीर्षक (Title)" class="w-full p-2.5 text-xs rounded-lg border border-stone-300 font-semibold">
      <textarea id="adminHistContent" rows="4" placeholder="पूरी जानकारी या कहानी यहाँ लिखें..." class="w-full p-2.5 text-xs rounded-lg border border-stone-300"></textarea>
      <input type="text" id="adminHistMoral" placeholder="मुख्य सीख / संदेश (Moral for Children & Youth)" class="w-full p-2.5 text-xs rounded-lg border border-stone-300">
      <button onclick="saveAdminHistoryOrKidsItem()" class="w-full py-2.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-lg shadow transition">
        प्रकाशित करें (Publish Content)
      </button>
    </div>
  `;

  // Add Audio Playlist Delete Manager into Pane 2 (adm_media)
  const audioListCard = document.createElement('div');
  audioListCard.className = 'bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2';
  audioListCard.innerHTML = `
    <h4 class="font-yatra text-base text-forest">वर्तमान भजन एवं ऑडियो सूची (Manage Audio)</h4>
    <div id="adminAudioManageList" class="space-y-1.5 text-xs"></div>
  `;
  panes.adm_media.appendChild(audioListCard);

  // Add Live Quiz Question Delete Manager into Pane 4 (adm_quiz)
  const quizListCard = document.createElement('div');
  quizListCard.className = 'bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2.5';
  quizListCard.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="font-yatra text-base text-forest">वर्तमान ज्ञान परीक्षा प्रश्न सूची (Manage Questions)</h3>
      <button onclick="clearAllQuizQuestions()" class="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200">सभी प्रश्न हटाएं</button>
    </div>
    <div id="adminQuizManageList" class="space-y-1.5 max-h-56 overflow-y-auto text-xs"></div>
  `;
  panes.adm_quiz.appendChild(quizListCard);

  // Add Member Password Reset & Blocked Users Moderation into Pane 5 (adm_system)
  const securityCard = document.createElement('div');
  securityCard.className = 'bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3';
  securityCard.innerHTML = `
    <h3 class="font-yatra text-base text-forest">सदस्य पासवर्ड रीसेट (Member Password Reset)</h3>
    <p class="text-xs text-stone-500">यदि कोई सदस्य अपना पासवर्ड भूल गया है, तो यहाँ उसका १०-अंकों का मोबाइल नंबर डालकर नया पासवर्ड सेट करें:</p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
      <input type="text" id="adminResetUserPhone" maxlength="10" placeholder="सदस्य का 10-अंकों का नंबर" class="p-2.5 rounded-lg border border-stone-300">
      <input type="text" id="adminResetUserNewPass" placeholder="नया पासवर्ड (उदा: 123456)" class="p-2.5 rounded-lg border border-stone-300">
      <button onclick="adminResetMemberPassword()" class="py-2.5 px-4 bg-terracotta hover:bg-orange-800 text-white font-bold rounded-lg shadow transition">
        पासवर्ड बदलें
      </button>
    </div>
  `;
  panes.adm_system.appendChild(securityCard);

  adminTab.innerHTML = '';
  adminTab.appendChild(consoleHeader);
  Object.values(panes).forEach(p => adminTab.appendChild(p));
}

function switchAdminSubTab(paneId) {
  ['adm_overview', 'adm_media', 'adm_content', 'adm_quiz', 'adm_system'].forEach(id => {
    const p = document.getElementById(id);
    const b = document.getElementById(`admbtn_${id}`);
    if (p) p.classList.toggle('hidden', id !== paneId);
    if (b) {
      if (id === paneId) {
        b.classList.add('admin-subtab-active');
      } else {
        b.classList.remove('admin-subtab-active');
      }
    }
  });
}

async function refreshOwnerAnalytics() {
  if (!currentUser || !currentUser.isOwner) return;
  try {
    const [uSnap, qSnap, pSnap, pdfSnap, audSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('quizAttempts').get(),
      db.collection('posts').get(),
      db.collection('pdfs').get(),
      db.collection('audios').get()
    ]);
    const uEl = document.getElementById('admStatUsers');
    const qEl = document.getElementById('admStatQuizzes');
    const pEl = document.getElementById('admStatPosts');
    const mEl = document.getElementById('admStatMedia');
    if (uEl) uEl.innerText = uSnap.size;
    if (qEl) qEl.innerText = qSnap.size;
    if (pEl) pEl.innerText = pSnap.size;
    if (mEl) mEl.innerText = `${pdfSnap.size + 1} PDF / ${audSnap.size} Audio`;
  } catch (e) {}
}

function injectDynamicModalsAndUI() {
  injectCleanLayoutStyles();
  upgradeHomepageToCleanLayout();
  injectMobileBottomNavBar();

  // Remove any old clutter bars
  document.getElementById('elderAccessibilityBar')?.remove();
  document.getElementById('statusCardGenBtn')?.remove();

  // Load PDF.js Library for Page-by-Page Horizontal Book Rendering
  if (!window.pdfjsLib) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script);
  }

  // 1. Global Maintenance Overlay
  if (!document.getElementById('globalMaintenanceOverlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'globalMaintenanceOverlay';
    overlay.className = 'fixed inset-0 z-[9999] bg-[#143622] text-white hidden flex-col items-center justify-center p-6 text-center';
    overlay.innerHTML = `
      <div class="max-w-md w-full bg-white/10 backdrop-blur-md border border-amber-400/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <h1 class="font-yatra text-2xl text-amber-300">सेवा अस्थायी रूप से रखरखाव में है</h1>
        <p id="globalMaintMsgText" class="text-sm text-stone-200 leading-relaxed"></p>
        <div class="p-3 rounded-xl bg-black/25 border border-white/10 text-xs text-amber-200">
          "जीव दया पालणी, रूंख लीलो नी घावै" — हम शीघ्र ही नए अपडेट के साथ लौटेंगे।
        </div>
        <div class="pt-4 border-t border-white/10 flex justify-center">
          <button onclick="ownerEmergencyUnlock()" class="text-xs text-stone-300 hover:text-amber-300 underline">
            व्यवस्थापक लॉगिन (Owner Bypass)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // 2. Section-Specific Maintenance Card
  if (!document.getElementById('sectionMaintenanceCard')) {
    const secCard = document.createElement('div');
    secCard.id = 'sectionMaintenanceCard';
    secCard.className = 'hidden max-w-xl mx-auto my-8 bg-white p-6 rounded-2xl border-2 border-amber-300 text-center space-y-3 shadow-md';
    secCard.innerHTML = `
      <h2 class="font-yatra text-xl text-forest">यह अनुभाग अभी मेंटेनेंस में है</h2>
      <p id="sectionMaintMsgText" class="text-sm text-stone-600 leading-relaxed">
        इस सेक्शन में सुधार एवं नए अपडेट जोड़े जा रहे हैं। कृपया अन्य सेक्शन का उपयोग करें या कुछ समय बाद पुनः प्रयास करें।
      </p>
      <button onclick="switchTab('home')" class="mt-2 px-4 py-2 bg-forest text-white rounded-lg text-xs font-semibold hover:bg-emerald-950 transition">
        मुख्य पृष्ठ पर जाएं
      </button>
    `;
    const mainEl = document.querySelector('main') || document.body;
    mainEl.appendChild(secCard);
  }

  // 3. PAGE-BY-PAGE HORIZONTAL BOOK PDF READER (With Landscape Mode & Native Hand Pinch-Zoom)
  if (!document.getElementById('inbuiltPdfModal')) {
    const pdfModal = document.createElement('div');
    pdfModal.id = 'inbuiltPdfModal';
    pdfModal.className = 'fixed inset-0 z-[9990] bg-stone-950 hidden flex-col select-none';
    pdfModal.innerHTML = `
      <div class="bg-[#143622] text-white px-3 py-2.5 flex items-center justify-between gap-2 border-b border-amber-500/40 shadow-md shrink-0">
        <div class="flex items-center gap-2 truncate">
          <h3 id="pdfViewerTitle" class="font-yatra text-sm sm:text-base text-amber-300 truncate">साहित्य पाठक</h3>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="togglePdfLandscapeMode()" id="landscapeModeBtn" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-extrabold shadow flex items-center gap-1">
            <span id="landscapeBtnText">लैंडस्केप (आड़ा मोड)</span>
          </button>
          <a id="pdfModalDownloadBtn" href="#" download class="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold border border-emerald-400">
            डाउनलोड
          </a>
          <button onclick="closeInbuiltPdfViewer()" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-extrabold">
            ✕ बंद करें
          </button>
        </div>
      </div>

      <div id="pdfSinglePageViewport" class="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-stone-900 relative" style="touch-action: pan-x pan-y pinch-zoom;">
        <div id="pdfLoadingSpinner" class="text-amber-300 text-sm font-bold animate-pulse">पृष्ठ खुल रहा है...</div>
        <canvas id="pdfSinglePageCanvas" class="bg-white rounded shadow-2xl max-w-full h-auto hidden"></canvas>
        <iframe id="pdfDriveFallbackFrame" class="hidden w-full h-full border-0 bg-white rounded"></iframe>
      </div>

      <div id="pdfBottomNavBar" class="bg-[#143622] text-white px-4 py-2.5 border-t border-amber-500/30 flex items-center justify-between gap-3 shrink-0">
        <button onclick="changePdfPage(-1)" id="pdfPrevBtn" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-extrabold text-xs sm:text-sm rounded-xl shadow transition">
          ← पिछला पन्ना
        </button>

        <div class="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
          <span>पृष्ठ</span>
          <input type="number" id="pdfPageJumpInput" min="1" value="1" onchange="jumpToPdfPage(this.value)" class="w-14 text-center py-1 rounded bg-stone-800 text-amber-300 border border-amber-400/40 font-extrabold">
          <span id="pdfTotalPagesLabel">/ 1</span>
        </div>

        <button onclick="changePdfPage(1)" id="pdfNextBtn" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-extrabold text-xs sm:text-sm rounded-xl shadow transition">
          अगला पन्ना →
        </button>
      </div>
    `;
    document.body.appendChild(pdfModal);

    const vp = document.getElementById('pdfSinglePageViewport');
    if (vp) {
      vp.addEventListener('touchstart', e => {
        if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
      }, { passive: true });
      vp.addEventListener('touchend', e => {
        if (e.changedTouches.length === 1 && touchStartX > 0) {
          const diffX = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(diffX) > 75) {
            if (diffX < 0) changePdfPage(1);
            else changePdfPage(-1);
          }
        }
        touchStartX = 0;
      }, { passive: true });
    }
  }

  // 4. User & Owner Profile Modal
  if (!document.getElementById('userProfileModal')) {
    const profModal = document.createElement('div');
    profModal.id = 'userProfileModal';
    profModal.className = 'fixed inset-0 z-[9980] bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4 overflow-y-auto';
    profModal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full p-5 space-y-3.5 border border-stone-200 shadow-2xl my-auto">
        <div class="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div>
            <h3 class="font-yatra text-lg text-forest">मेरी प्रोफ़ाइल (My Profile)</h3>
            <p id="profileRoleBadge" class="text-xs font-bold text-stone-500"></p>
          </div>
          <button onclick="closeProfileModal()" class="text-stone-400 hover:text-stone-700 text-lg font-bold">✕</button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div>
            <label class="font-bold text-stone-700 block mb-1">आपका नाम (Full Name):</label>
            <input type="text" id="profEditName" class="w-full p-2.5 rounded-lg border border-stone-300 font-semibold" placeholder="अपना नाम लिखें">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="font-bold text-stone-700 block mb-1">गाँव / ज़िला (Location):</label>
              <input type="text" id="profEditLocation" class="w-full p-2.5 rounded-lg border border-stone-300" placeholder="उदा: हिसार, हरियाणा">
            </div>
            <div>
              <label class="font-bold text-stone-700 block mb-1">नया पासवर्ड (ऐच्छिक):</label>
              <input type="password" id="profEditPass" class="w-full p-2.5 rounded-lg border border-stone-300" placeholder="बदलना हो तो लिखें">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="p-2 rounded-lg bg-stone-50 border border-stone-200">
              <span class="text-[10px] text-stone-400 block">मोबाइल / खाता आईडी</span>
              <span id="profPhoneDisplay" class="font-bold text-stone-800 truncate block"></span>
            </div>
            <div class="p-2 rounded-lg bg-stone-50 border border-stone-200">
              <span class="text-[10px] text-stone-400 block">Google ईमेल सत्यापन</span>
              <span id="profEmailDisplay" class="font-bold text-emerald-700 truncate block"></span>
            </div>
          </div>

          <div id="profGoogleLinkWrap" class="pt-1">
            <button type="button" onclick="linkGoogleAccount()" class="w-full py-2 px-3 border border-stone-300 hover:bg-stone-50 rounded-lg font-semibold flex items-center justify-center gap-2 text-stone-700 transition">
              <span id="profGoogleBtnText">Google अकाउंट जोड़ें (पासवर्ड रिकवरी हेतु)</span>
            </button>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-1 text-center">
            <div class="p-2 rounded-lg bg-amber-50 border border-amber-200">
              <div id="statMalaTotal" class="font-bold text-sm text-forest">0</div>
              <div class="text-[10px] text-stone-500">कुल मंत्र जप</div>
            </div>
            <div class="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <div id="statMalaLaps" class="font-bold text-sm text-forest">0</div>
              <div class="text-[10px] text-stone-500">पूर्ण माला</div>
            </div>
            <div class="p-2 rounded-lg bg-stone-100 border border-stone-200">
              <div id="statChatCount" class="font-bold text-sm text-forest">0</div>
              <div class="text-[10px] text-stone-500">संवाद संदेश</div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-2 border-t border-stone-100">
          <button onclick="saveUserProfileChanges()" class="flex-1 py-2.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-lg shadow transition">
            प्रोफ़ाइल सहेजें (Save)
          </button>
          <button onclick="closeProfileModal()" class="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-lg">
            बंद करें
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(profModal);
  }

  // 5. Forgot Password Modal
  if (!document.getElementById('forgotPassModal')) {
    const fpModal = document.createElement('div');
    fpModal.id = 'forgotPassModal';
    fpModal.className = 'fixed inset-0 z-[9985] bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4';
    fpModal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-stone-200 shadow-2xl">
        <div class="flex items-center justify-between border-b border-stone-100 pb-2">
          <h3 class="font-yatra text-lg text-forest">पासवर्ड रीसेट (Forgot Password)</h3>
          <button onclick="closeForgotPassModal()" class="text-stone-400 hover:text-stone-700 font-bold">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <p class="text-stone-600 leading-relaxed">
            अपना १०-अंकों का मोबाइल नंबर और नया पासवर्ड लिखें, फिर सुरक्षा सत्यापन के लिए अपने जुड़े हुए Google खाते से पुष्टि करें:
          </p>
          <div>
            <label class="font-bold text-stone-700 block mb-1">पंजीकृत मोबाइल नंबर:</label>
            <input type="text" id="fpPhoneInput" maxlength="10" placeholder="10 अंकों का मोबाइल नंबर" class="w-full p-2.5 rounded-lg border border-stone-300 font-semibold">
          </div>
          <div>
            <label class="font-bold text-stone-700 block mb-1">नया पासवर्ड (New Password):</label>
            <input type="password" id="fpNewPassInput" placeholder="नया पासवर्ड बनाएं" class="w-full p-2.5 rounded-lg border border-stone-300">
          </div>

          <button type="button" onclick="verifyGoogleAndResetPassword()" class="w-full py-2.5 px-3 bg-forest hover:bg-emerald-950 text-white rounded-xl font-bold shadow flex items-center justify-center gap-2 transition">
            <span>Google से सत्यापित कर पासवर्ड बदलें</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(fpModal);
  }

  // 6. Inject Forgot Password & Google Login into Auth Modal
  const authForm = document.querySelector('#authModal form');
  if (authForm && !document.getElementById('googleAuthModalBtn')) {
    const extraDiv = document.createElement('div');
    extraDiv.className = 'pt-2 border-t border-stone-200 space-y-2';
    extraDiv.innerHTML = `
      <div class="flex justify-end">
        <button type="button" onclick="openForgotPassModal()" class="text-xs font-bold text-terracotta hover:underline">
          पासवर्ड भूल गए? (Forgot Password)
        </button>
      </div>
      <button id="googleAuthModalBtn" type="button" onclick="signInOrVerifyWithGoogle()" class="w-full py-2.5 px-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition">
        <span>Google से 1-Click लॉगिन करें</span>
      </button>
    `;
    authForm.appendChild(extraDiv);
  }

  // 7. Upgrade PDF Upload Box in Admin Hub (Add Category Tag & Subtitle Inputs)
  const pdfTitleInp = document.getElementById('adminPdfTitle');
  if (pdfTitleInp && !document.getElementById('adminPdfTag')) {
    const tagInp = document.createElement('input');
    tagInp.type = 'text';
    tagInp.id = 'adminPdfTag';
    tagInp.placeholder = 'श्रेणी टैग (उदा: पवित्र ग्रंथ या साहित्य)';
    tagInp.className = pdfTitleInp.className;
    pdfTitleInp.parentElement.insertBefore(tagInp, pdfTitleInp);

    const descInp = document.createElement('input');
    descInp.type = 'text';
    descInp.id = 'adminPdfDesc';
    descInp.placeholder = 'छोटा विवरण (उदा: गुरु जम्भेश्वर भगवान द्वारा उच्चरित पावन वाणी)';
    descInp.className = pdfTitleInp.className;
    pdfTitleInp.insertAdjacentElement('afterend', descInp);
  }

  // 8. Organize Standard 5-Tab Owner Console
  organizeStandardOwnerConsole();
}

// 9. OWNER BYPASS & MAINTENANCE LISTENERS
function ownerEmergencyUnlock() {
  const phone = prompt("व्यवस्थापक मोबाइल नंबर (Owner Phone):");
  const pass = prompt("पासवर्ड (Owner Password):");
  if (phone && phone.trim() === OWNER_PHONE && pass && pass.trim() === OWNER_PASS) {
    currentUser = { name: "व्यवस्थापक (Owner)", phone: OWNER_PHONE, isOwner: true, location: "मुख्यालय" };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    syncOwnerCustomName();
    updateNavAuth();
    applyMaintenanceRules();
    showToast("व्यवस्थापक एक्सेस अनलॉक हो गया!");
    switchTab('admin');
  } else {
    alert("गलत व्यवस्थापक विवरण!");
  }
}

function listenMaintenanceConfig() {
  db.collection('settings').doc('maintenance').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      maintenanceConfig.globalMode = data.globalMode || 'off';
      maintenanceConfig.message = data.message || 'हम आपके अनुभव को बेहतर बनाने के लिए ऐप को अपडेट कर रहे हैं। कृपया कुछ समय बाद पुनः प्रयास करें।';
      maintenanceConfig.sections = Object.assign({
        mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off'
      }, data.sections || {});

      const globalSel = document.getElementById('adminGlobalMaintMode');
      const msgInp = document.getElementById('adminMaintMessage');
      if (globalSel) globalSel.value = maintenanceConfig.globalMode;
      if (msgInp) msgInp.value = maintenanceConfig.message;

      ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
        const el = document.getElementById(`lock_${sec}`);
        if (el) el.value = maintenanceConfig.sections[sec] || 'off';
      });
    }
    applyMaintenanceRules();
  });
}

function applyMaintenanceRules() {
  const overlay = document.getElementById('globalMaintenanceOverlay');
  if (!overlay) return;

  if (shouldLockForCurrentDevice(maintenanceConfig.globalMode)) {
    document.getElementById('globalMaintMsgText').innerText = maintenanceConfig.message;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    return;
  } else {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }
  enforceTabMaintenance(currentActiveTab);
}

function enforceTabMaintenance(tabId) {
  const secCard = document.getElementById('sectionMaintenanceCard');
  const target = document.getElementById(`tab-${tabId}`);
  if (!secCard || !target) return;

  const lockMode = maintenanceConfig.sections[tabId] || 'off';
  if (shouldLockForCurrentDevice(lockMode)) {
    target.classList.add('hidden');
    document.getElementById('sectionMaintMsgText').innerText = maintenanceConfig.message;
    secCard.classList.remove('hidden');
  } else {
    secCard.classList.add('hidden');
    target.classList.remove('hidden');
  }
}

async function saveMaintenanceSettings() {
  if (!currentUser || !currentUser.isOwner) return showToast("केवल व्यवस्थापक ही इसे बदल सकते हैं!");

  const globalMode = document.getElementById('adminGlobalMaintMode')?.value || 'off';
  const message = document.getElementById('adminMaintMessage')?.value.trim() || 'ऐप में नए अपडेट जोड़े जा रहे हैं, कृपया कुछ समय बाद प्रयास करें।';

  const sections = {};
  ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
    sections[sec] = document.getElementById(`lock_${sec}`)?.value || 'off';
  });

  await db.collection('settings').doc('maintenance').set({
    globalMode, message, sections,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast("मेंटेनेंस सेटिंग्स लाइव लागू हो गईं!");
}

// 10. TOAST & MODAL UTILITIES
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

// 11. APPLICATION INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  injectDynamicModalsAndUI();
  syncOwnerCustomName();
  updateNavAuth();
  listenMaintenanceConfig();
  listenCustomNiyams();
  listenHistoryAndKids();
  listenBanner();
  listenPdfs();
  listenPosts();
  listenPinnedChat();
  loadQuiz();
  listenTreeCounter();
  listenWinners();
  listenNotices();
  listenAudios();
  computeAutoPanchang();
  listenAmavasyaConfig();
  renderMalaCounters();
  updateProgressIndicators();
});

async function syncOwnerCustomName() {
  if (currentUser && (currentUser.isOwner === true && currentUser.phone === OWNER_PHONE)) {
    try {
      const doc = await db.collection('users').doc(OWNER_PHONE).get();
      if (doc.exists) {
        const d = doc.data();
        currentUser.name = d.name || currentUser.name;
        currentUser.location = d.location || '';
        currentUser.email = d.email || '';
        localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
        updateNavAuth();
      }
    } catch (e) {}
  }
}

// 12. NAVIGATION CONTROLS
function switchTab(id) {
  if (id === 'admin' && (!currentUser || !currentUser.isOwner)) {
    return showToast("यह अनुभाग केवल मुख्य व्यवस्थापक के लिए है।");
  }
  currentActiveTab = id;
  ['home', 'mala', 'niyams', 'library', 'community', 'quiz', 'history', 'admin'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const nav = document.getElementById(`nav-${t}`);
    const bnav = document.getElementById(`bnav-${t}`);
    if (el) el.classList.add('hidden');
    if (nav) nav.classList.remove('nav-btn-active');
    if (bnav) bnav.className = 'flex flex-col items-center gap-0.5 py-1 px-2 text-stone-500';
  });

  const target = document.getElementById(`tab-${id}`);
  const activeNav = document.getElementById(`nav-${id}`);
  const activeBnav = document.getElementById(`bnav-${id}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('view-panel');
  }
  if (activeNav) activeNav.classList.add('nav-btn-active');
  if (activeBnav) activeBnav.className = 'flex flex-col items-center gap-0.5 py-1 px-2 text-forest font-bold';

  if (id === 'admin' && currentUser && currentUser.isOwner) {
    refreshOwnerAnalytics();
  }

  enforceTabMaintenance(id);
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

// 13. AUTHENTICATION, 1-CLICK GOOGLE LOGIN & FORGOT PASSWORD
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
  const nameInput = document.getElementById('loginName')?.value.trim() || '';

  // 1. STRICT OWNER LOGIN CHECK (9306894518 / bishnoi29)
  if (phone === OWNER_PHONE && pass === OWNER_PASS) {
    let ownerName = "व्यवस्थापक (Owner)";
    let ownerLoc = "";
    let ownerEmail = "";
    try {
      const oDoc = await db.collection('users').doc(OWNER_PHONE).get();
      if (oDoc.exists) {
        ownerName = oDoc.data().name || ownerName;
        ownerLoc = oDoc.data().location || "";
        ownerEmail = oDoc.data().email || "";
      }
    } catch (err) {}

    currentUser = { name: ownerName, phone: OWNER_PHONE, isOwner: true, location: ownerLoc, email: ownerEmail };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    applyMaintenanceRules();
    renderNiyams(niyamsList);
    renderHistoryAndKidsViews();
    listenPdfs();
    closeAuthModal();
    showToast(`व्यवस्थापक के रूप में स्वागत है, ${currentUser.name}!`);
    switchTab('admin');
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return showToast("कृपया सही १० अंकों का भारतीय मोबाइल नंबर दर्ज करें!");
  }

  if (isRegisterMode) {
    if (!nameInput) return showToast("कृपया अपना पूरा नाम दर्ज करें!");
    try {
      const userDoc = await db.collection('users').doc(phone).get();
      if (userDoc.exists) {
        return showToast("यह नंबर पहले से पंजीकृत है! कृपया लॉगिन करें।");
      }
      await db.collection('users').doc(phone).set({
        name: nameInput,
        phone: phone,
        pass: pass,
        email: "",
        location: "",
        registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      currentUser = { name: nameInput, phone: phone, isOwner: false, email: "", location: "" };
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      updateNavAuth();
      closeAuthModal();
      showToast(`पंजीकरण सफल! स्वागत है, ${currentUser.name}`);
    } catch (err) {
      showToast("पंजीकरण में त्रुटि: " + err.message);
    }
    return;
  }

  try {
    const userDoc = await db.collection('users').doc(phone).get();
    if (!userDoc.exists) {
      return showToast("यह नंबर पंजीकृत नहीं है! कृपया पहले Register करें या Google से लॉगिन करें।");
    }

    const userData = userDoc.data();
    if (userData.pass && userData.pass !== pass) {
      return showToast("गलत पासवर्ड! यदि भूल गए हैं तो 'पासवर्ड भूल गए?' पर क्लिक करें।");
    }

    await db.collection('users').doc(phone).update({
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });

    currentUser = {
      name: userData.name || "सदस्य",
      phone: phone,
      isOwner: (phone === OWNER_PHONE && pass === OWNER_PASS),
      email: userData.email || "",
      location: userData.location || ""
    };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    renderNiyams(niyamsList);
    renderHistoryAndKidsViews();
    listenPdfs();
    closeAuthModal();
    showToast(`स्वागत है, ${currentUser.name}!`);
  } catch (err) {
    showToast("लॉगिन त्रुटि: " + err.message);
  }
}

async function signInOrVerifyWithGoogle() {
  if (!firebase.auth) {
    return showToast("कृपया पेज को रिफ्रेश (Ctrl+F5) करें!");
  }
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    const gUser = result.user;
    if (!gUser) return;

    const typedPhone = document.getElementById('loginPhone')?.value.trim() || '';
    let targetDocId = '';
    let existingData = null;

    const emailSnap = await db.collection('users').where('email', '==', gUser.email).limit(1).get();
    if (!emailSnap.empty) {
      targetDocId = emailSnap.docs[0].id;
      existingData = emailSnap.docs[0].data();
    } else if (/^[6-9]\d{9}$/.test(typedPhone)) {
      targetDocId = typedPhone;
      const pDoc = await db.collection('users').doc(targetDocId).get();
      if (pDoc.exists) existingData = pDoc.data();
    } else {
      targetDocId = `google_${gUser.uid.substring(0, 10)}`;
      const gDoc = await db.collection('users').doc(targetDocId).get();
      if (gDoc.exists) existingData = gDoc.data();
    }

    const finalName = (existingData && existingData.name) ? existingData.name : (gUser.displayName || "सदस्य");
    const finalLoc = (existingData && existingData.location) ? existingData.location : "";
    const finalPhone = (existingData && existingData.phone) ? existingData.phone : (/^[6-9]\d{9}$/.test(typedPhone) ? typedPhone : "Google Verified");
    const isOwnerAccount = (targetDocId === OWNER_PHONE) || (finalPhone === OWNER_PHONE);

    await db.collection('users').doc(targetDocId).set({
      name: finalName,
      phone: finalPhone,
      email: gUser.email || "",
      googleVerified: true,
      location: finalLoc,
      registeredAt: (existingData && existingData.registeredAt) ? existingData.registeredAt : firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    currentUser = {
      name: finalName,
      phone: targetDocId,
      email: gUser.email || "",
      location: finalLoc,
      isOwner: isOwnerAccount
    };

    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    applyMaintenanceRules();
    renderNiyams(niyamsList);
    renderHistoryAndKidsViews();
    listenPdfs();
    closeAuthModal();
    showToast(`Google लॉगिन सफल! स्वागत है, ${currentUser.name}`);
  } catch (err) {
    showToast("Google लॉगिन त्रुटि: " + err.message);
  }
}

function openForgotPassModal() {
  const typedPhone = document.getElementById('loginPhone')?.value.trim() || '';
  closeAuthModal();
  const modal = document.getElementById('forgotPassModal');
  if (!modal) return;
  if (typedPhone) document.getElementById('fpPhoneInput').value = typedPhone;
  document.getElementById('fpNewPassInput').value = '';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeForgotPassModal() {
  const modal = document.getElementById('forgotPassModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function verifyGoogleAndResetPassword() {
  const phone = document.getElementById('fpPhoneInput')?.value.trim() || '';
  const newPass = document.getElementById('fpNewPassInput')?.value.trim() || '';

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return showToast("कृपया अपना १०-अंकों का मोबाइल नंबर सही दर्ज करें!");
  }
  if (!newPass || newPass.length < 4) {
    return showToast("कृपया कम से कम ४ अक्षरों का नया पासवर्ड लिखें!");
  }

  try {
    const userRef = db.collection('users').doc(phone);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return showToast("यह मोबाइल नंबर पंजीकृत नहीं है!");

    const userData = userDoc.data();
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    const gUser = result.user;
    if (!gUser || !gUser.email) return;

    if (userData.email && userData.email.toLowerCase() !== gUser.email.toLowerCase()) {
      return showToast("यह Google खाता इस मोबाइल नंबर से मेल नहीं खाता!");
    }

    await userRef.set({
      pass: newPass,
      email: gUser.email,
      googleVerified: true,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    currentUser = {
      name: userData.name || gUser.displayName || "सदस्य",
      phone: phone,
      email: gUser.email,
      location: userData.location || "",
      isOwner: (phone === OWNER_PHONE)
    };

    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    closeForgotPassModal();
    showToast("पासवर्ड बदल गया और आप लॉगिन हो गए हैं!");
  } catch (err) {
    showToast("पासवर्ड रीसेट त्रुटि: " + err.message);
  }
}

async function adminResetMemberPassword() {
  if (!currentUser || !currentUser.isOwner) return showToast("केवल व्यवस्थापक के लिए!");
  const phone = document.getElementById('adminResetUserPhone')?.value.trim() || '';
  const newPass = document.getElementById('adminResetUserNewPass')?.value.trim() || '';

  if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया सदस्य का सही १०-अंकों का मोबाइल नंबर लिखें!");
  if (!newPass) return showToast("कृपया नया पासवर्ड लिखें!");

  try {
    const ref = db.collection('users').doc(phone);
    const doc = await ref.get();
    if (!doc.exists) return showToast("इस नंबर से कोई सदस्य पंजीकृत नहीं मिला!");

    await ref.update({
      pass: newPass,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('adminResetUserPhone').value = '';
    document.getElementById('adminResetUserNewPass').value = '';
    showToast(`सदस्य (${doc.data().name || phone}) का नया पासवर्ड सेट हो गया!`);
  } catch (err) {
    showToast("त्रुटि: " + err.message);
  }
}

async function linkGoogleAccount() {
  if (!currentUser) return;
  if (!firebase.auth) return showToast("कृपया पेज रिफ्रेश करें!");
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    const gUser = result.user;
    if (gUser && gUser.email) {
      currentUser.email = gUser.email;
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      await db.collection('users').doc(currentUser.phone).set({
        email: gUser.email,
        googleVerified: true
      }, { merge: true });
      openProfileModal();
      showToast(`Google ईमेल (${gUser.email}) जुड़ गया!`);
    }
  } catch (err) {
    showToast("Google खाता जोड़ने में त्रुटि: " + err.message);
  }
}

function openProfileModal() {
  if (!currentUser) return openAuthModal();
  const modal = document.getElementById('userProfileModal');
  if (!modal) return;

  document.getElementById('profEditName').value = currentUser.name || '';
  document.getElementById('profEditLocation').value = currentUser.location || '';
  document.getElementById('profEditPass').value = '';
  document.getElementById('profPhoneDisplay').innerText = currentUser.phone || '';
  document.getElementById('profEmailDisplay').innerText = currentUser.email ? `✓ ${currentUser.email}` : 'जुड़ा नहीं है';
  document.getElementById('profGoogleBtnText').innerText = currentUser.email ? 'Google अकाउंट बदलें' : 'Google अकाउंट जोड़ें (पासवर्ड रिकवरी हेतु)';

  const roleBadge = document.getElementById('profileRoleBadge');
  if (currentUser.isOwner) {
    roleBadge.innerText = 'मुख्य व्यवस्थापक (Owner)';
    roleBadge.className = 'text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded inline-block mt-0.5';
  } else {
    roleBadge.innerText = 'पंजीकृत सदस्य (Member)';
    roleBadge.className = 'text-xs font-semibold text-stone-500';
  }

  document.getElementById('statMalaTotal').innerText = malaTotalCount;
  document.getElementById('statMalaLaps').innerText = malaLapsCount;
  const myPostsCount = allChatPosts.filter(p => p.phone === currentUser.phone).length;
  document.getElementById('statChatCount').innerText = myPostsCount;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeProfileModal() {
  const modal = document.getElementById('userProfileModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
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

  const updateData = {
    name: newName,
    location: newLoc,
    phone: currentUser.phone,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (newPass) updateData.pass = newPass;

  try {
    await db.collection('users').doc(currentUser.phone).set(updateData, { merge: true });
    updateNavAuth();
    closeProfileModal();
    showToast(newPass ? "प्रोफ़ाइल और नया पासवर्ड सहेज लिए गए!" : "आपकी प्रोफ़ाइल अपडेट हो गई!");
  } catch (err) {
    showToast("प्रोफ़ाइल सहेजने में त्रुटि: " + err.message);
  }
}

function logoutUser() {
  localStorage.removeItem('bishnoi_secure_user');
  currentUser = null;
  updateNavAuth();
  applyMaintenanceRules();
  renderNiyams(niyamsList);
  renderHistoryAndKidsViews();
  listenPdfs();
  switchTab('home');
  showToast("सफलतापूर्वक लॉगआउट किया गया।");
}

function updateNavAuth() {
  const container = document.getElementById('authActionsContainer');
  const adminNav = document.getElementById('nav-admin');
  const adminNavMob = document.getElementById('nav-admin-mobile');
  const postPrompt = document.getElementById('postAuthPrompt');
  const postEditor = document.getElementById('postEditor');

  const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);

  if (currentUser) {
    container.innerHTML = `
      <button onclick="openProfileModal()" class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-forest border border-stone-300 transition inline-flex items-center gap-1.5 shadow-sm max-w-full" title="प्रोफ़ाइल व नाम बदलें">
        <span class="max-w-[115px] truncate">${currentUser.name}</span>
        <span class="text-[10px] text-stone-500">प्रोफ़ाइल</span>
      </button>
      <button onclick="logoutUser()" class="text-xs text-stone-600 hover:text-red-700 font-bold px-2 py-1 rounded bg-stone-100 hover:bg-red-50 transition">लॉगआउट</button>
    `;
    if (postPrompt) postPrompt.classList.add('hidden');
    if (postEditor) postEditor.classList.remove('hidden');

    if (isVerifiedOwner) {
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

// 14. DIGITAL JAAP MALA LOGIC
function updateMantraName() {
  const selected = document.getElementById('malaMantraSelect').value;
  document.getElementById('activeMantraDisplay').innerText = selected;
}

function tapMalaBead() {
  const isVibe = document.getElementById('vibrationToggle').checked;
  if (isVibe && navigator.vibrate) navigator.vibrate(35);

  malaBeadCount++;
  malaTotalCount++;

  if (malaBeadCount >= 108) {
    malaBeadCount = 0;
    malaLapsCount++;
    if (isVibe && navigator.vibrate) navigator.vibrate([80, 50, 100]);
    showToast("ॐ शांति! एक संपूर्ण माला (१०८ जप) पूर्ण हुई। साधुवाद!");
  }

  saveMalaState();
  renderMalaCounters();
  updateProgressIndicators();
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
      updateProgressIndicators();
      showToast("जप माला रीसेट हो गई।");
    }
  });
}

// 15. AUTOMATED DAILY PANCHANG & LOW-CPU AMAVASYA COUNTDOWN
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
    if (!box) return;

    const isToday = (
      now.getFullYear() === amavasyaTargetDate.getFullYear() &&
      now.getMonth() === amavasyaTargetDate.getMonth() &&
      now.getDate() === amavasyaTargetDate.getDate()
    );

    if (isToday) {
      box.className = "text-xs font-bold text-emerald-900 bg-amber-300 p-2.5 rounded-lg border border-amber-400 text-center";
      box.innerHTML = "आज पावन अमावस्या व्रत दिवस है — उपवास, ध्यान, हवन एवं पाहल साधना";
      return;
    }

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);

      box.className = "text-xs font-semibold text-terracotta bg-white/90 p-2 rounded-lg border border-emerald-200";
      box.innerHTML = `समय शेष: <b>${days} दिन : ${hours} घंटे : ${mins} मिनट</b>`;
    } else {
      box.className = "text-xs font-medium text-stone-500 bg-stone-100 p-2 rounded-lg border border-stone-200";
      box.innerHTML = "अमावस्या व्रत संपन्न हुआ — अगली तिथि की प्रतीक्षा";
    }
  }

  update();
  amavasyaTimerInterval = setInterval(update, 30000); // Optimized for low-end rural phones
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

// 16. GEMINI AI CLIENT
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
  const currentKey = localStorage.getItem('gemini_user_api_key') || '';
  const newKey = prompt("अपनी नई Gemini API Key यहाँ पेस्ट करें (या हटाने के लिए खाली छोड़कर OK दबाएं):", currentKey);
  if (newKey === null) return;

  if (newKey.trim() !== "") {
    localStorage.setItem('gemini_user_api_key', newKey.trim());
    showToast("नई Gemini API Key सफलतापूर्वक सहेज ली गई!");
  } else {
    localStorage.removeItem('gemini_user_api_key');
    showToast("पुरानी API Key हटा दी गई है।");
  }
}

const changeApiKey = resetGeminiKey;
const updateApiKey = resetGeminiKey;
const changeGeminiKey = resetGeminiKey;
const resetOpenAiKey = resetGeminiKey;

async function callGemini(promptText) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("वैध Gemini API Key दर्ज नहीं की गई।");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = { contents: [{ parts: [{ text: promptText }] }] };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  if (response.status === 400 || response.status === 401 || response.status === 403) {
    localStorage.removeItem('gemini_user_api_key');
  }
  throw new Error(data.error ? data.error.message : "Gemini AI से प्रतिक्रिया प्राप्त नहीं हुई");
}

async function generateAiQuizQuestions() {
  const btn = document.getElementById('aiQuizGenBtn');
  btn.innerText = "Gemini प्रश्न बना रहा है...";
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
    btn.innerHTML = `<span class="font-bold text-xs text-amber-200">Gemini से 5 नए प्रश्न बनवाएं</span><span class="text-[11px] text-stone-300 mt-1">AI स्वतः प्रश्न व विकल्प तैयार कर नीचे बल्क बॉक्स में दर्ज करेगा।</span>`;
    btn.disabled = false;
  }
}

async function generateAiDailySandesh() {
  const btn = document.getElementById('aiSandeshGenBtn');
  btn.innerText = "AI संदेश तैयार कर रहा है...";
  btn.disabled = true;

  const prompt = `Write a short, highly inspirational 1-line quote in Hindi for the Bishnoi community focusing on tree protection, kindness to all animals, or moral virtues. Do not add quotes or formatting.`;

  try {
    const result = await callGemini(prompt);
    document.getElementById('adminBannerInput').value = result.trim();
    showToast("Gemini ने नया सुविचार लिख दिया! 'Update Banner' दबाकर लाइव करें।");
  } catch (err) {
    showToast("AI Error: " + err.message);
  } finally {
    btn.innerHTML = `<span class="font-bold text-xs text-amber-200">Gemini से नया पावन सुविचार लिखवाएं</span><span class="text-[11px] text-stone-300 mt-1">जीव रक्षा व आचार संहिता पर सुविचार तैयार करें।</span>`;
    btn.disabled = false;
  }
}

// 17. DIRECT PDF EXPORTS
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
  showToast("७-दिवसीय सदस्य PDF (ईमेल सहित) तैयार हो रहा है...");
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
        u.phone || doc.id || 'N/A',
        u.email || 'Not Linked',
        u.location || '-',
        regDate.toLocaleDateString('en-GB')
      ]);
    }
  });

  if (rows.length === 0) return showToast("विगत ७ दिनों में कोई नया सदस्य नहीं जुड़ा।");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(15);
  doc.setTextColor(20, 54, 34);
  doc.text("Bishnoi Portal - New Registered Users (Last 7 Days)", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 25);

  doc.autoTable({
    startY: 30,
    head: [['Full Name', 'Mobile / ID', 'Verified Email ID', 'Location', 'Date']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [179, 74, 27] },
    styles: { fontSize: 8.5 }
  });

  doc.save("Bishnoi_Registered_Users_7Days.pdf");
}

// 18. CERTIFICATE GENERATOR
function generateCertificate(name, score) {
  const canvas = document.getElementById('certCanvas');
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FAF7EE';
  ctx.fillRect(0, 0, 800, 600);

  ctx.strokeStyle = '#143622';
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, 760, 560);

  ctx.strokeStyle = '#B34A1B';
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, 736, 536);

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

  ctx.fillStyle = '#4A3E37';
  ctx.font = '16px sans-serif';
  ctx.fillText(`ने विश्नोई समाज दैनिक ज्ञान एवं आचार संहिता परीक्षा में`, 400, 325);
  ctx.fillText(`सराहनीय प्रदर्शन करते हुए ${score}% अंक प्राप्त किए हैं।`, 400, 355);

  ctx.fillStyle = '#2D6A4F';
  ctx.font = 'italic 16px sans-serif';
  ctx.fillText('"जीव दया पालणी, रूंख लीलो नी घावै"', 400, 425);

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

// 19. QUIZ ARENA & QUESTION MANAGER
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
    const adminList = document.getElementById('adminQuizManageList');
    if (adminList) adminList.innerHTML = '';

    if (!snap.empty) {
      quizList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (adminList) {
        snap.docs.forEach((doc, idx) => {
          const qData = doc.data();
          adminList.innerHTML += `
            <div class="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200 gap-2">
              <span class="truncate font-medium">${idx + 1}. ${qData.q}</span>
              <button onclick="deleteSingleQuizQuestion('${doc.id}')" class="text-red-600 font-bold hover:underline shrink-0">हटाएं</button>
            </div>
          `;
        });
      }
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
      if (adminList) {
        adminList.innerHTML = `<div class="text-stone-400">डिफ़ॉल्ट ३ प्रश्न सक्रिय हैं।</div>`;
      }
    }
  });
}

async function deleteSingleQuizQuestion(id) {
  if (!currentUser || !currentUser.isOwner) return;
  await db.collection('quiz').doc(id).delete();
  showToast("प्रश्न हटा दिया गया!");
}

async function clearAllQuizQuestions() {
  if (!currentUser || !currentUser.isOwner) return;
  openConfirmModal("सभी प्रश्न हटाएं?", "क्या आप वर्तमान सभी परीक्षा प्रश्नों को हटाना चाहते हैं?", async (res) => {
    if (res) {
      const snap = await db.collection('quiz').get();
      const batch = db.batch();
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      showToast("सभी प्रश्न हटा दिए गए!");
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

    if (percentage > bestQuizPct) {
      bestQuizPct = percentage;
      localStorage.setItem('bishnoi_best_quiz_pct', bestQuizPct.toString());
      updateProgressIndicators();
    }

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
        <h3 class="font-yatra text-xl text-forest">परीक्षा पूर्ण हुई!</h3>
        <p class="text-sm text-stone-600">कुल प्राप्तांक: <strong class="text-terracotta text-base">${qScore} / ${quizList.length}</strong> (${percentage}%)</p>
        <p class="text-xs text-stone-400">समय: ${timeTakenSeconds} सेकंड</p>
        
        <div class="pt-3 flex flex-wrap justify-center gap-2">
          <button onclick="backToQuizIntro()" class="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-xs font-semibold text-stone-700">
            ← मुख्य पृष्ठ
          </button>
          <button onclick="startQuizNow()" class="px-4 py-2 bg-forest text-white rounded-lg text-xs font-semibold hover:bg-emerald-950">
            पुनः प्रयास करें
          </button>
          ${percentage >= 80 ? `
            <button onclick="generateCertificate('${currentUser ? currentUser.name : 'प्रतिभागी'}', ${percentage})" class="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold shadow">
              सम्मान पत्र डाउनलोड करें
            </button>
          ` : ''}
        </div>
      </div>
    `;
    return;
  }

  const q = quizList[currentQ];
  const progressPct = Math.round(((currentQ + 1) / quizList.length) * 100);

  box.innerHTML = `
    <div class="space-y-4">
      <div class="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
        <div class="h-full bg-forest transition-all duration-300" style="width: ${progressPct}%"></div>
      </div>
      <div class="flex justify-between items-center text-xs text-stone-500 border-b border-stone-100 pb-2">
        <span class="font-bold text-forest">प्रश्न ${currentQ + 1} / ${quizList.length}</span>
        <span class="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold">प्राप्तांक: ${qScore}</span>
      </div>
      <h3 class="font-bold text-sm sm:text-base text-forest leading-snug">${q.q}</h3>
      <div class="space-y-2 pt-1">
        ${q.opts.map((opt, i) => `
          <button onclick="checkAnswer(${i})" class="w-full text-left p-3 text-xs sm:text-sm rounded-xl border border-stone-200 hover:bg-amber-50 bg-white transition-all font-medium shadow-sm">
            <span class="font-bold text-terracotta mr-1">${['A','B','C','D'][i]}.</span> ${opt}
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
    feed.innerText = "✓ बिल्कुल सही उत्तर! साधुवाद!";
  } else {
    feed.className = "text-xs p-2.5 rounded-lg font-semibold bg-rose-100 text-rose-800 border border-rose-300";
    feed.innerText = `✕ गलत उत्तर! सही उत्तर है: ${q.opts[q.ans]}`;
  }

  setTimeout(() => {
    currentQ++;
    renderQuiz();
  }, 1100);
}

function backToQuizIntro() {
  document.getElementById('quizActiveBox').classList.add('hidden');
  document.getElementById('quizIntroCard').classList.remove('hidden');
}

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

function listenWinners() {
  ['winner1Name', 'winner2Name', 'winner3Name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('truncate', 'whitespace-nowrap');
      el.style.whiteSpace = 'normal';
      el.style.wordBreak = 'break-word';
    }
  });

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

// 20. SAMVAD MANCH (TEXT-ONLY CHAT)
const BAD_WORDS_LIST = ['गाली', 'मूर्ख', 'पागल', 'अभद्र', 'idiot', 'stupid', 'abuse'];

function containsBadWords(text) {
  const lower = text.toLowerCase();
  return BAD_WORDS_LIST.some(w => lower.includes(w));
}

function updateCharCount() {
  const el = document.getElementById('postText');
  const disp = document.getElementById('charCountDisplay');
  if (el && disp) disp.innerText = `${el.value.length} / 300`;
}

function setChatReply(id, author, snippet) {
  activeReplyObj = { id, author, snippet: snippet.substring(0, 70) };
  const bar = document.getElementById('replyPreviewBar');
  if (bar) {
    document.getElementById('replyToAuthor').innerText = author;
    document.getElementById('replyToText').innerText = activeReplyObj.snippet;
    bar.classList.remove('hidden');
  }
  document.getElementById('postText')?.focus();
}

function cancelChatReply() {
  activeReplyObj = null;
  document.getElementById('replyPreviewBar')?.classList.add('hidden');
}

async function submitChaupalPost() {
  if (!currentUser) return openAuthModal();
  const now = Date.now();
  if (!currentUser.isOwner && now - lastPostTime < 20000) {
    return showToast("कृपया अगले संदेश के लिए २० सेकंड प्रतीक्षा करें।");
  }

  const txtEl = document.getElementById('postText');
  const txt = txtEl.value.trim();
  if (!txt) return showToast('कृपया अपना संदेश लिखें!');

  if (containsBadWords(txt)) {
    return showToast('कृपया संवाद मंच की गरिमा बनाए रखें और सभ्य भाषा का प्रयोग करें।');
  }

  const topic = document.getElementById('postTopicSelect')?.value || 'सामान्य चर्चा';
  const btn = document.getElementById('postSubmitBtn');
  btn.disabled = true;

  try {
    await db.collection('posts').add({
      author: currentUser.name,
      phone: currentUser.phone || 'Member',
      isOwner: Boolean(currentUser.isOwner),
      location: currentUser.location || '',
      topic: topic,
      content: txt,
      replyTo: activeReplyObj || null,
      reactions: { pranam: 0, nature: 0, heart: 0 },
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    lastPostTime = now;
    txtEl.value = '';
    updateCharCount();
    cancelChatReply();
    showToast('संदेश प्रकाशित हुआ!');
  } catch (e) {
    showToast('संदेश भेजने में त्रुटि: ' + e.message);
  } finally {
    btn.disabled = false;
  }
}

function listenPinnedChat() {
  db.collection('settings').doc('pinnedChat').onSnapshot(doc => {
    const banner = document.getElementById('pinnedChatBanner');
    const txt = document.getElementById('pinnedChatText');
    const unpinBtn = document.getElementById('unpinChatBtn');
    if (!banner || !txt) return;

    if (doc.exists && doc.data().content) {
      const d = doc.data();
      txt.innerText = `${d.author}: "${d.content}"`;
      banner.classList.remove('hidden');
      if (unpinBtn) {
        unpinBtn.classList.toggle('hidden', !(currentUser && currentUser.isOwner === true));
      }
    } else {
      banner.classList.add('hidden');
    }
  });
}

async function pinChatMessage(author, content) {
  if (!currentUser || !currentUser.isOwner) return;
  await db.collection('settings').doc('pinnedChat').set({
    author, content, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast("संदेश शीर्ष पर पिन कर दिया गया!");
}

async function unpinChatMessage() {
  if (!currentUser || !currentUser.isOwner) return;
  await db.collection('settings').doc('pinnedChat').delete();
  showToast("पिन किया गया संदेश हटा दिया गया।");
}

async function reactToPost(postId, type) {
  const storageKey = `reacted_${postId}_${type}`;
  if (localStorage.getItem(storageKey)) return showToast("आप पहले ही प्रतिक्रिया दे चुके हैं!");
  localStorage.setItem(storageKey, '1');

  const fieldPath = `reactions.${type}`;
  try {
    await db.collection('posts').doc(postId).update({
      [fieldPath]: firebase.firestore.FieldValue.increment(1)
    });
  } catch (e) {}
}

function listenPosts() {
  db.collection('posts').orderBy('createdAt', 'desc').limit(40).onSnapshot(snap => {
    allChatPosts = [];
    snap.forEach(doc => {
      allChatPosts.push({ id: doc.id, ...doc.data() });
    });
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

  feed.innerHTML = '';
  if (filtered.length === 0) {
    feed.innerHTML = `<div class="text-center py-6 text-xs text-stone-500">इस विषय पर अभी कोई संदेश नहीं है। पहला संदेश लिखें!</div>`;
    return;
  }

  const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);

  filtered.forEach(p => {
    const isMyPost = Boolean(currentUser && (p.phone === currentUser.phone));
    const canDelete = Boolean(isMyPost || isVerifiedOwner);
    const timeStr = p.createdAt ? p.createdAt.toDate().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) : 'अभी';
    const dateStr = p.createdAt ? p.createdAt.toDate().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }) : '';

    const safeAuthor = (p.author || 'सदस्य').replace(/'/g, "\\'");
    const safeContent = (p.content || '').replace(/'/g, "\\'").replace(/\n/g, ' ');

    const pranamCnt = p.reactions?.pranam || 0;
    const natureCnt = p.reactions?.nature || 0;
    const heartCnt = p.reactions?.heart || 0;

    const card = document.createElement('div');
    card.className = `p-3.5 rounded-xl border ${p.isOwner ? 'bg-amber-50/70 border-amber-300' : (isMyPost ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-stone-200')} space-y-2 shadow-sm`;
    card.innerHTML = `
      <div class="flex flex-wrap justify-between items-center gap-1 text-xs">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="font-bold text-forest">${p.author}</span>
          ${p.isOwner ? `<span class="px-1.5 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 rounded">मुख्य व्यवस्थापक</span>` : ''}
          ${p.location ? `<span class="text-[10px] text-stone-500">• ${p.location}</span>` : ''}
          <span class="px-2 py-0.5 text-[10px] bg-stone-100 text-stone-600 rounded-full border border-stone-200">${p.topic || 'सामान्य चर्चा'}</span>
        </div>
        <span class="text-[10px] text-stone-400">${dateStr} ${timeStr}</span>
      </div>

      ${p.replyTo ? `
        <div class="p-2 rounded bg-stone-100 border-l-2 border-forest text-xs text-stone-600">
          <span class="font-bold text-forest">उत्तर (${p.replyTo.author}):</span> ${p.replyTo.snippet}
        </div>
      ` : ''}

      <p class="text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">${p.content}</p>

      <div class="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-1.5">
          <button onclick="reactToPost('${p.id}', 'pranam')" class="px-2.5 py-0.5 rounded-full bg-stone-100 hover:bg-amber-100 border border-stone-200 transition">
            🙏 ${pranamCnt || ''}
          </button>
          <button onclick="reactToPost('${p.id}', 'nature')" class="px-2.5 py-0.5 rounded-full bg-stone-100 hover:bg-emerald-100 border border-stone-200 transition">
            🌿 ${natureCnt || ''}
          </button>
          <button onclick="reactToPost('${p.id}', 'heart')" class="px-2.5 py-0.5 rounded-full bg-stone-100 hover:bg-rose-100 border border-stone-200 transition">
            ❤️ ${heartCnt || ''}
          </button>
        </div>

        <div class="flex items-center gap-3">
          <button onclick="setChatReply('${p.id}', '${safeAuthor}', '${safeContent}')" class="text-forest font-semibold hover:underline">उत्तर दें</button>
          <button onclick="sharePostWhatsApp('${safeAuthor}', '${safeContent}')" class="text-emerald-700 font-semibold hover:underline">साझा करें</button>
          ${isVerifiedOwner ? `<button onclick="pinChatMessage('${safeAuthor}', '${safeContent}')" class="text-amber-700 font-bold hover:underline">पिन करें</button>` : ''}
          ${canDelete ? `<button onclick="confirmDeletePost('${p.id}')" class="text-red-600 font-bold hover:underline">हटाएं</button>` : ''}
        </div>
      </div>
    `;
    feed.appendChild(card);
  });
}

function confirmDeletePost(id) {
  openConfirmModal("संदेश हटाएं?", "क्या आप इस संदेश को संवाद मंच से हटाना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('posts').doc(id).delete();
      showToast('संदेश हटा दिया गया।');
    }
  });
}

// 21. PAGE-BY-PAGE HORIZONTAL PDF READER + CARD-1 STYLE LIBRARY
async function openInbuiltPdfViewer(title, link) {
  const modal = document.getElementById('inbuiltPdfModal');
  const titleEl = document.getElementById('pdfViewerTitle');
  const dlBtn = document.getElementById('pdfModalDownloadBtn');
  const spinner = document.getElementById('pdfLoadingSpinner');
  const canvas = document.getElementById('pdfSinglePageCanvas');
  const driveFrame = document.getElementById('pdfDriveFallbackFrame');
  const bottomBar = document.getElementById('pdfBottomNavBar');
  if (!modal) return;

  titleEl.innerText = title;
  dlBtn.href = link;
  currentPdfUrl = link;
  isPdfLandscape = false;
  updateLandscapeButtonLabel();

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  if (link.includes('drive.google.com/file/d/')) {
    const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      spinner.classList.add('hidden');
      canvas.classList.add('hidden');
      bottomBar.classList.add('hidden');
      driveFrame.src = `https://drive.google.com/file/d/${match[1]}/preview`;
      driveFrame.classList.remove('hidden');
      return;
    }
  }

  driveFrame.classList.add('hidden');
  bottomBar.classList.remove('hidden');
  canvas.classList.add('hidden');
  spinner.classList.remove('hidden');
  spinner.innerText = 'पुस्तक का पृष्ठ स्पष्ट आकार में खुल रहा है...';

  try {
    if (!window.pdfjsLib) throw new Error("PDF.js लोड हो रहा है");
    const loadingTask = window.pdfjsLib.getDocument(link);
    activePdfDoc = await loadingTask.promise;
    totalPdfPages = activePdfDoc.numPages;
    currentPdfPage = 1;
    await renderSinglePdfPage(currentPdfPage);
  } catch (err) {
    spinner.classList.add('hidden');
    bottomBar.classList.add('hidden');
    const fullUrl = link.startsWith('http') ? link : (window.location.origin + '/' + link.replace(/^\.\//, ''));
    driveFrame.src = isPhoneOrInstalledApp()
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fullUrl)}`
      : fullUrl;
    driveFrame.classList.remove('hidden');
  }
}

async function renderSinglePdfPage(pageNum) {
  if (!activePdfDoc) return;
  const spinner = document.getElementById('pdfLoadingSpinner');
  const canvas = document.getElementById('pdfSinglePageCanvas');
  const jumpInp = document.getElementById('pdfPageJumpInput');
  const totalLbl = document.getElementById('pdfTotalPagesLabel');
  const prevBtn = document.getElementById('pdfPrevBtn');
  const nextBtn = document.getElementById('pdfNextBtn');

  spinner.classList.remove('hidden');
  const page = await activePdfDoc.getPage(pageNum);

  const viewport = page.getViewport({ scale: 2.2 });
  const ctx = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (isPdfLandscape) {
    canvas.style.width = '96vw';
    canvas.style.maxHeight = 'none';
  } else {
    canvas.style.width = 'auto';
    canvas.style.maxHeight = '78vh';
  }

  await page.render({ canvasContext: ctx, viewport: viewport }).promise;
  spinner.classList.add('hidden');
  canvas.classList.remove('hidden');

  if (jumpInp) {
    jumpInp.max = totalPdfPages;
    jumpInp.value = pageNum;
  }
  if (totalLbl) totalLbl.innerText = `/ ${totalPdfPages}`;
  if (prevBtn) prevBtn.disabled = (pageNum <= 1);
  if (nextBtn) nextBtn.disabled = (pageNum >= totalPdfPages);

  const vp = document.getElementById('pdfSinglePageViewport');
  if (vp) vp.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
}

function changePdfPage(delta) {
  if (!activePdfDoc) return;
  const next = currentPdfPage + delta;
  if (next >= 1 && next <= totalPdfPages) {
    currentPdfPage = next;
    renderSinglePdfPage(currentPdfPage);
  }
}

function jumpToPdfPage(val) {
  if (!activePdfDoc) return;
  const p = parseInt(val);
  if (p >= 1 && p <= totalPdfPages) {
    currentPdfPage = p;
    renderSinglePdfPage(currentPdfPage);
  }
}

async function togglePdfLandscapeMode() {
  isPdfLandscape = !isPdfLandscape;
  updateLandscapeButtonLabel();

  try {
    if (isPdfLandscape) {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }
      showToast("लैंडस्केप (आड़ा मोड) सक्रिय! आप दो उंगलियों से ज़ूम कर सकते हैं।");
    } else {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
    }
  } catch (e) {}

  if (activePdfDoc) renderSinglePdfPage(currentPdfPage);
}

function updateLandscapeButtonLabel() {
  const txt = document.getElementById('landscapeBtnText');
  if (txt) txt.innerText = isPdfLandscape ? 'पोर्ट्रेट (सीधा मोड)' : 'लैंडस्केप (आड़ा मोड)';
}

function closeInbuiltPdfViewer() {
  activePdfDoc = null;
  if (screen.orientation && screen.orientation.unlock) {
    try { screen.orientation.unlock(); } catch (e) {}
  }
  if (document.fullscreenElement && document.exitFullscreen) {
    try { document.exitFullscreen(); } catch (e) {}
  }
  const modal = document.getElementById('inbuiltPdfModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function listenPdfs() {
  db.collection('pdfs').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const grid = document.getElementById('pdfGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);
    const hideDefault = localStorage.getItem('hide_default_shabadwani_card') === '1';

    if (!hideDefault) {
      const defTag = localStorage.getItem('def_pdf_tag') || 'पवित्र ग्रंथ';
      const defTitle = localStorage.getItem('def_pdf_title') || 'श्री सबदवाणी (१२० शब्द)';
      const defDesc = localStorage.getItem('def_pdf_desc') || 'गुरु जम्भेश्वर भगवान द्वारा उच्चरित पावन वाणी।';
      const defLink = localStorage.getItem('def_pdf_link') || './shabadwani.pdf';

      const defaultCard = document.createElement('div');
      defaultCard.className = "bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm";
      defaultCard.innerHTML = `
        <div>
          <span class="text-[11px] font-bold text-terracotta uppercase tracking-wide">${defTag}</span>
          <h3 class="font-yatra text-forest text-lg mt-1">${defTitle}</h3>
          <p class="text-xs text-stone-500 mt-1 leading-relaxed">${defDesc}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <button onclick="openInbuiltPdfViewer('${defTitle.replace(/'/g, "\\'")}', '${defLink}')" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold rounded-lg shadow-sm transition">
              ऐप में पढ़ें
            </button>
            <a href="${defLink}" download class="inline-block px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-emerald-950">
              डाउनलोड
            </a>
          </div>
          <div class="flex items-center gap-2.5">
            <button onclick="sharePdfWhatsApp('${defTitle.replace(/'/g, "\\'")}', '${defLink}')" class="text-emerald-700 text-xs font-bold hover:underline">साझा करें</button>
            ${isVerifiedOwner ? `
              <button onclick="editDefaultPdfCard()" class="text-xs text-amber-700 font-bold hover:underline">Edit</button>
              <button onclick="deleteDefaultPdfCard()" class="text-xs text-red-600 font-bold hover:underline">Delete</button>
            ` : ''}
          </div>
        </div>
      `;
      grid.appendChild(defaultCard);
    }

    snap.forEach(doc => {
      const item = doc.data();
      const tag = item.tag || 'पवित्र साहित्य';
      const title = item.title || 'साहित्य ग्रंथ';
      const desc = item.desc || 'अध्ययन एवं डाउनलोड करने हेतु उपलब्ध पावन साहित्य।';
      const safeTitle = title.replace(/'/g, "\\'");
      const safeLink = (item.link || '').replace(/'/g, "\\'");

      const card = document.createElement('div');
      card.className = "bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm";
      card.innerHTML = `
        <div>
          <span class="text-[11px] font-bold text-terracotta uppercase tracking-wide">${tag}</span>
          <h3 class="font-yatra text-forest text-lg mt-1">${title}</h3>
          <p class="text-xs text-stone-500 mt-1 leading-relaxed">${desc}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <button onclick="openInbuiltPdfViewer('${safeTitle}', '${safeLink}')" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold rounded-lg shadow-sm transition">
              ऐप में पढ़ें
            </button>
            <a href="${item.link}" target="_blank" download class="inline-block px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-emerald-950">
              डाउनलोड
            </a>
          </div>
          <div class="flex items-center gap-2.5">
            <button onclick="sharePdfWhatsApp('${safeTitle}', '${safeLink}')" class="text-emerald-700 text-xs font-bold hover:underline">साझा करें</button>
            ${isVerifiedOwner ? `
              <button onclick="editUploadedPdf('${doc.id}', '${tag.replace(/'/g, "\\'")}', '${safeTitle}', '${desc.replace(/'/g, "\\'")}')" class="text-xs text-amber-700 font-bold hover:underline">Edit</button>
              <button onclick="confirmDeletePdf('${doc.id}')" class="text-xs text-red-600 font-bold hover:underline">Delete</button>
            ` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  });
}

function editDefaultPdfCard() {
  if (!currentUser || !currentUser.isOwner) return;
  const newTag = prompt("ऊपरी टैग (Tag):", localStorage.getItem('def_pdf_tag') || 'पवित्र ग्रंथ');
  if (newTag === null) return;
  const newTitle = prompt("पुस्तक का मुख्य नाम (Title):", localStorage.getItem('def_pdf_title') || 'श्री सबदवाणी (१२० शब्द)');
  if (!newTitle) return;
  const newDesc = prompt("छोटा विवरण (Subtitle):", localStorage.getItem('def_pdf_desc') || 'गुरु जम्भेश्वर भगवान द्वारा उच्चरित पावन वाणी।');
  const newLink = prompt("PDF फाइल लिंक:", localStorage.getItem('def_pdf_link') || './shabadwani.pdf');

  localStorage.setItem('def_pdf_tag', newTag.trim());
  localStorage.setItem('def_pdf_title', newTitle.trim());
  localStorage.setItem('def_pdf_desc', (newDesc || '').trim());
  localStorage.setItem('def_pdf_link', (newLink || './shabadwani.pdf').trim());
  listenPdfs();
  showToast("प्रथम PDF कार्ड अपडेट हो गया!");
}

function deleteDefaultPdfCard() {
  if (!currentUser || !currentUser.isOwner) return;
  openConfirmModal("प्रथम PDF हटाएं?", "क्या आप डिफ़ॉल्ट 'श्री सबदवाणी' कार्ड को हटाना चाहते हैं?", (res) => {
    if (res) {
      localStorage.setItem('hide_default_shabadwani_card', '1');
      listenPdfs();
      showToast("प्रथम PDF कार्ड हटा दिया गया।");
    }
  });
}

async function editUploadedPdf(id, oldTag, oldTitle, oldDesc) {
  if (!currentUser || !currentUser.isOwner) return;
  const tag = prompt("श्रेणी टैग बदलें:", oldTag);
  if (tag === null) return;
  const title = prompt("पुस्तक का मुख्य नाम बदलें:", oldTitle);
  if (!title) return;
  const desc = prompt("छोटा विवरण बदलें:", oldDesc);

  await db.collection('pdfs').doc(id).update({
    tag: tag.trim() || 'पवित्र साहित्य',
    title: title.trim(),
    desc: (desc || '').trim()
  });
  showToast("PDF कार्ड अपडेट हो गया!");
}

function sharePdfWhatsApp(title, link) {
  const url = link.startsWith('./') ? window.location.origin + '/' + link.replace('./','') : link;
  const text = encodeURIComponent(`विश्नोई साहित्य PDF: ${title}\nऑनलाइन पढ़ें या डाउनलोड करें: ${url}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

async function saveAdminPdf() {
  const tag = document.getElementById('adminPdfTag')?.value.trim() || 'पवित्र ग्रंथ';
  const title = document.getElementById('adminPdfTitle').value.trim();
  const desc = document.getElementById('adminPdfDesc')?.value.trim() || 'गुरु जम्भेश्वर भगवान की पावन शिक्षाएं एवं साहित्य।';
  const link = document.getElementById('adminPdfLink').value.trim();

  if (!title || !link) return showToast('कृपया पुस्तक का नाम और लिंक दर्ज करें');
  await db.collection('pdfs').add({
    tag, title, desc, link,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast('PDF साहित्य सफलतापूर्वक जोड़ा गया!');
  if (document.getElementById('adminPdfTag')) document.getElementById('adminPdfTag').value = '';
  document.getElementById('adminPdfTitle').value = '';
  if (document.getElementById('adminPdfDesc')) document.getElementById('adminPdfDesc').value = '';
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

// 22. CLEAN SIMPLE BHAJAN AUDIO PLAYER & NOTICES
function listenAudios() {
  db.collection('audios').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const select = document.getElementById('audioTrackSelect');
    const adminList = document.getElementById('adminAudioManageList');
    if (adminList) adminList.innerHTML = '';

    if (!snap.empty && select) {
      select.innerHTML = '';
      snap.forEach(doc => {
        const a = doc.data();
        select.innerHTML += `<option value="${a.link}">${a.title}</option>`;
        if (adminList) {
          adminList.innerHTML += `
            <div class="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200">
              <span class="font-semibold text-stone-800 truncate">${a.title}</span>
              <button onclick="deleteAdminAudio('${doc.id}')" class="text-red-600 font-bold hover:underline shrink-0 ml-2">हटाएं</button>
            </div>
          `;
        }
      });
      changeAudioTrack();
    }
  });
}

async function deleteAdminAudio(id) {
  if (!currentUser || !currentUser.isOwner) return;
  openConfirmModal("भजन हटाएं?", "क्या आप इस ऑडियो भजन को प्लेयर से हटाना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('audios').doc(id).delete();
      showToast("भजन हटा दिया गया।");
    }
  });
}

function changeAudioTrack() {
  const select = document.getElementById('audioTrackSelect');
  const player = document.getElementById('audioPlayer');
  const source = document.getElementById('audioSource');
  if (select && select.value && player && source) {
    source.src = select.value;
    player.load();
  }
}

async function saveAdminAudio() {
  const title = document.getElementById('adminAudioTitle').value.trim();
  const link = document.getElementById('adminAudioLink').value.trim();
  if (!title || !link) return showToast('कृपया भजन का नाम और ऑडियो लिंक दोनों भरें');
  await db.collection('audios').add({
    title, link, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast('भजन ऑडियो प्लेयर में जोड़ा गया!');
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

// 23. PLANTATION PLEDGE & BANNER
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
  try {
    await db.collection('stats').doc('treePledges').set({ count: nextVal }, { merge: true });
  } catch (e) {}
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
  const txt = document.getElementById('adminBannerInput').value.trim();
  if (!txt) return showToast('कृपया संदेश दर्ज करें');
  await db.collection('settings').doc('dailySandesh').set({ text: txt });
  showToast('दैनिक संदेश लाइव अपडेट हुआ!');
  document.getElementById('adminBannerInput').value = '';
}

function shareBannerWhatsApp() {
  const text = encodeURIComponent(`पावन संदेश:\n\n${currentBannerText}\n\nविस्तार से पढ़ें: ${window.location.href}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function shareNiyamWhatsApp(num, title, rule, desc) {
  markNiyamAsRead(num);
  const text = encodeURIComponent(`विश्नोई समाज नियम सं. ${num} - ${title}\n"${rule}"\n\nविवरण: ${desc}\n\nडिजिटल मंच: ${window.location.href}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function sharePostWhatsApp(author, content) {
  const text = encodeURIComponent(`समाज संवाद चर्चा (${author}):\n\n"${content}"\n\nपूर्ण चर्चा देखें: ${window.location.href}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

// 24. EDITABLE 29 NIYAMS WITH CATEGORY FILTERS & PROGRESS TRACKING
function markNiyamAsRead(num) {
  readNiyamsSet.add(num);
  localStorage.setItem('bishnoi_read_niyams', JSON.stringify(Array.from(readNiyamsSet)));
  updateProgressIndicators();
}

function listenCustomNiyams() {
  db.collection('settings').doc('customNiyams').onSnapshot(doc => {
    if (doc.exists && Array.isArray(doc.data().list)) {
      niyamsList = doc.data().list;
    }
    injectNiyamCategoryFilterBar();
    renderNiyams(niyamsList);
  });
}

function injectNiyamCategoryFilterBar() {
  const searchInput = document.getElementById('niyamSearch');
  if (!searchInput || document.getElementById('niyamCategoryBar')) return;

  const bar = document.createElement('div');
  bar.id = 'niyamCategoryBar';
  bar.className = 'flex flex-wrap gap-1.5 pt-2';
  bar.innerHTML = `
    <button onclick="setNiyamCategory('all')" id="ncat_all" class="px-3 py-1 rounded-full text-xs font-bold bg-forest text-white">सभी २९ नियम</button>
    <button onclick="setNiyamCategory('daily')" id="ncat_daily" class="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-amber-100">दैनिक साधना व स्वच्छता</button>
    <button onclick="setNiyamCategory('nature')" id="ncat_nature" class="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-emerald-100">जीव व पर्यावरण रक्षा</button>
    <button onclick="setNiyamCategory('conduct')" id="ncat_conduct" class="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-amber-100">सदाचार व नशा मुक्ति</button>
  `;
  searchInput.parentElement.appendChild(bar);
}

function setNiyamCategory(cat) {
  activeNiyamCategory = cat;
  ['all', 'daily', 'nature', 'conduct'].forEach(c => {
    const btn = document.getElementById(`ncat_${c}`);
    if (btn) {
      btn.className = (c === cat)
        ? 'px-3 py-1 rounded-full text-xs font-bold bg-forest text-white shadow-sm'
        : 'px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-amber-100';
    }
  });
  filterNiyams();
}

function renderNiyams(data) {
  const grid = document.getElementById('niyamGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);
  const filtered = activeNiyamCategory === 'all'
    ? data
    : data.filter(n => n.cat === activeNiyamCategory);

  filtered.forEach(n => {
    const safeTitle = (n.title || '').replace(/'/g, "\\'");
    const safeRule = (n.rule || '').replace(/'/g, "\\'");
    const safeDesc = (n.desc || '').replace(/'/g, "\\'");
    const isRead = readNiyamsSet.has(n.num);

    const card = document.createElement('div');
    card.onclick = () => markNiyamAsRead(n.num);
    card.className = `bg-white p-4 rounded-xl border ${isRead ? 'border-emerald-300 bg-emerald-50/20' : 'border-stone-200'} space-y-2 flex flex-col justify-between shadow-sm hover:border-forest transition cursor-pointer`;
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-forest w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">${n.num}</span>
          <span class="text-stone-500 font-semibold text-xs">${n.title}</span>
        </div>
        <h4 class="font-yatra text-base text-forest mt-1.5">${n.rule}</h4>
        <p class="text-xs text-stone-700 leading-relaxed mt-1">${n.desc}</p>
      </div>
      <div class="pt-2 border-t border-stone-100 flex items-center justify-between">
        ${isVerifiedOwner ? `
          <button onclick="event.stopPropagation(); editSingleNiyam(${n.num})" class="text-xs text-amber-700 font-bold hover:underline">Edit शब्द बदलें</button>
        ` : `<span class="text-[10px] text-emerald-700 font-semibold">${isRead ? '✓ पठित' : ''}</span>`}
        <button onclick="event.stopPropagation(); shareNiyamWhatsApp(${n.num}, '${safeTitle}', '${safeRule}', '${safeDesc}')" class="text-xs text-emerald-700 font-bold hover:underline">
          साझा करें
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function editSingleNiyam(num) {
  if (!currentUser || !currentUser.isOwner) return;
  const idx = niyamsList.findIndex(x => x.num === num);
  if (idx === -1) return;

  const item = niyamsList[idx];
  const newTitle = prompt(`नियम ${num} का शीर्षक (Title):`, item.title);
  if (newTitle === null) return;
  const newRule = prompt(`नियम ${num} की मूल वाणी (Rule):`, item.rule);
  if (newRule === null) return;
  const newDesc = prompt(`नियम ${num} का सरल अर्थ (Description):`, item.desc);
  if (newDesc === null) return;

  niyamsList[idx] = {
    ...item,
    title: newTitle.trim() || item.title,
    rule: newRule.trim() || item.rule,
    desc: newDesc.trim() || item.desc
  };

  await db.collection('settings').doc('customNiyams').set({ list: niyamsList });
  showToast(`नियम सं. ${num} सफलतापूर्वक अपडेट हो गया!`);
}

function filterNiyams() {
  const q = (document.getElementById('niyamSearch')?.value || '').toLowerCase();
  renderNiyams(niyamsList.filter(n =>
    n.rule.toLowerCase().includes(q) ||
    n.desc.toLowerCase().includes(q) ||
    n.title.toLowerCase().includes(q)
  ));
}

// 25. MODERN 2-LINE PREVIEW CARDS FOR HISTORY & KIDS CORNER
function listenHistoryAndKids() {
  db.collection('settings').doc('customHistoryKids').onSnapshot(doc => {
    if (doc.exists && Array.isArray(doc.data().items) && doc.data().items.length > 0) {
      historyItemsList = doc.data().items;
    }
    renderHistoryAndKidsViews();
  });
}

function toggleStoryReadMore(id) {
  const p = document.getElementById(`story_txt_${id}`);
  const btn = document.getElementById(`story_btn_${id}`);
  if (!p || !btn) return;
  if (p.classList.contains('line-clamp-2')) {
    p.classList.remove('line-clamp-2');
    btn.innerText = 'संक्षिप्त करें ↑';
  } else {
    p.classList.add('line-clamp-2');
    btn.innerText = 'पूरा पढ़ें (Read More) ↓';
  }
}

function renderHistoryAndKidsViews() {
  const histView = document.getElementById('historySubView');
  const kidsView = document.getElementById('kidsSubView');
  const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);

  if (histView) {
    let dynamicHistWrap = document.getElementById('dynamicHistoryCardsWrap');
    if (!dynamicHistWrap) {
      dynamicHistWrap = document.createElement('div');
      dynamicHistWrap.id = 'dynamicHistoryCardsWrap';
      dynamicHistWrap.className = 'space-y-4 mb-4';
      histView.insertBefore(dynamicHistWrap, histView.firstChild);
    }

    const histItems = historyItemsList.filter(x => x.type === 'history');
    dynamicHistWrap.innerHTML = histItems.map(item => {
      const safeSpeech = (item.title + '। ' + item.content + '। ' + (item.moral || '')).replace(/'/g, "\\'").replace(/\n/g, ' ');
      return `
        <div class="bg-white p-5 rounded-2xl border-l-4 border-forest border border-stone-200 shadow-sm space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 bg-emerald-50 text-forest border border-emerald-200 rounded-full text-xs font-bold">${item.badge || 'गौरवशाली इतिहास'}</span>
            <div class="flex items-center gap-2 text-xs">
              <button onclick="speakKidsStory('${safeSpeech}')" class="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-forest rounded-lg font-semibold">
                ऑडियो सुनें
              </button>
              ${isVerifiedOwner ? `
                <button onclick="editHistoryOrKidsItem('${item.id}')" class="text-amber-700 font-bold hover:underline">Edit</button>
                <button onclick="deleteHistoryOrKidsItem('${item.id}')" class="text-red-600 font-bold hover:underline">Delete</button>
              ` : ''}
            </div>
          </div>
          <h3 class="font-yatra text-lg sm:text-xl text-forest">${item.title}</h3>
          <p id="story_txt_${item.id}" class="line-clamp-2 text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">${item.content}</p>
          <button id="story_btn_${item.id}" onclick="toggleStoryReadMore('${item.id}')" class="text-xs font-bold text-forest hover:underline">
            पूरा पढ़ें (Read More) ↓
          </button>
          ${item.moral ? `
            <div class="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs font-semibold text-amber-900">
              ${item.moral}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  if (kidsView) {
    let dynamicKidsWrap = document.getElementById('dynamicKidsCardsWrap');
    if (!dynamicKidsWrap) {
      dynamicKidsWrap = document.createElement('div');
      dynamicKidsWrap.id = 'dynamicKidsCardsWrap';
      dynamicKidsWrap.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4';
      kidsView.insertBefore(dynamicKidsWrap, kidsView.firstChild);
    }

    const kidsItems = historyItemsList.filter(x => x.type === 'kids');
    dynamicKidsWrap.innerHTML = kidsItems.map(item => {
      const safeSpeech = (item.title + '। ' + item.content + '। ' + (item.moral || '')).replace(/'/g, "\\'").replace(/\n/g, ' ');
      return `
        <div class="bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/70 p-5 rounded-2xl border border-amber-300 shadow-sm flex flex-col justify-between space-y-3">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="px-3 py-1 bg-amber-400 text-stone-950 rounded-full text-xs font-extrabold">${item.badge || '🧸 बाल संस्कार कहानी'}</span>
              <button onclick="speakKidsStory('${safeSpeech}')" class="px-2.5 py-1 bg-forest text-white rounded-full text-xs font-bold hover:bg-emerald-900">
                🔊 कहानी सुनें
              </button>
            </div>
            <h3 class="font-yatra text-lg text-forest pt-1">${item.title}</h3>
            <p id="story_txt_${item.id}" class="line-clamp-2 text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">${item.content}</p>
            <button id="story_btn_${item.id}" onclick="toggleStoryReadMore('${item.id}')" class="text-xs font-bold text-forest hover:underline">
              पूरा पढ़ें (Read More) ↓
            </button>
          </div>
          <div class="space-y-2 pt-2">
            ${item.moral ? `
              <div class="p-3 rounded-xl bg-emerald-900 text-amber-200 text-xs font-bold">
                ${item.moral}
              </div>
            ` : ''}
            ${isVerifiedOwner ? `
              <div class="flex justify-end gap-3 text-xs pt-1 border-t border-amber-200">
                <button onclick="editHistoryOrKidsItem('${item.id}')" class="text-amber-800 font-bold hover:underline">Edit शब्द बदलें</button>
                <button onclick="deleteHistoryOrKidsItem('${item.id}')" class="text-red-600 font-bold hover:underline">Delete</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

function speakKidsStory(text) {
  if (!('speechSynthesis' in window)) return showToast("आपके डिवाइस में ऑडियो स्टोरी सुविधा उपलब्ध नहीं है।");
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    return showToast("ऑडियो रोका गया।");
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'hi-IN';
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
  showToast("ऑडियो सुनाया जा रहा है...");
}

async function saveAdminHistoryOrKidsItem() {
  if (!currentUser || !currentUser.isOwner) return showToast("केवल व्यवस्थापक के लिए!");
  const type = document.getElementById('adminHistType')?.value || 'history';
  const badge = document.getElementById('adminHistBadge')?.value.trim() || (type === 'kids' ? '🧸 बाल कहानी' : 'इतिहास अध्याय');
  const title = document.getElementById('adminHistTitle')?.value.trim() || '';
  const content = document.getElementById('adminHistContent')?.value.trim() || '';
  const moral = document.getElementById('adminHistMoral')?.value.trim() || '';

  if (!title || !content) return showToast("कृपया शीर्षक और विवरण दोनों लिखें!");

  historyItemsList.unshift({
    id: 'item_' + Date.now(),
    type, badge, title, content, moral
  });

  await db.collection('settings').doc('customHistoryKids').set({ items: historyItemsList });
  document.getElementById('adminHistTitle').value = '';
  document.getElementById('adminHistContent').value = '';
  document.getElementById('adminHistMoral').value = '';
  showToast("नया अध्याय सफलतापूर्वक प्रकाशित हो गया!");
}

async function editHistoryOrKidsItem(id) {
  if (!currentUser || !currentUser.isOwner) return;
  const idx = historyItemsList.findIndex(x => x.id === id);
  if (idx === -1) return;
  const item = historyItemsList[idx];

  const newTitle = prompt("शीर्षक बदलें:", item.title);
  if (newTitle === null) return;
  const newContent = prompt("कहानी / इतिहास का विवरण बदलें:", item.content);
  if (newContent === null) return;
  const newMoral = prompt("मुख्य सीख / संदेश बदलें:", item.moral || '');

  historyItemsList[idx] = {
    ...item,
    title: newTitle.trim() || item.title,
    content: newContent.trim() || item.content,
    moral: (newMoral || '').trim()
  };

  await db.collection('settings').doc('customHistoryKids').set({ items: historyItemsList });
  showToast("जानकारी सफलतापूर्वक अपडेट हो गई!");
}

async function deleteHistoryOrKidsItem(id) {
  if (!currentUser || !currentUser.isOwner) return;
  openConfirmModal("अध्याय हटाएं?", "क्या आप इस कार्ड को हटाना चाहते हैं?", async (res) => {
    if (res) {
      historyItemsList = historyItemsList.filter(x => x.id !== id);
      await db.collection('settings').doc('customHistoryKids').set({ items: historyItemsList });
      showToast("कार्ड हटा दिया गया।");
    }
  });
}

function handleGlobalSearch() {
  const q = document.getElementById('globalSearchInput').value.toLowerCase().trim();
  if (!q) return;

  const niyamMatch = niyamsList.some(n => n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q));
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
  } else if (q.includes('इतिहास') || q.includes('बाल') || q.includes('कहानी') || q.includes('खेजड़ली')) {
    switchTab('history');
  }
}

