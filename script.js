/* ==========================================================================
   Bishnoi Community Portal - 100% Complete Master Engine (script.js)
   - Single Unified Bottom Navigation (PW / Amazon / Jio Style - No Duplicate Menus)
   - Owner Studio Inside Profile + 5-Tab Easy Admin Console
   - Premium Custom Audio Player Box (Prev, Play/Pause, Next, Speed, Seekbar)
   - WhatsApp / Telegram Group Style Samvad Manch + Safe User Moderation
   - Page-by-Page Horizontal PDF Reader + Landscape Mode (Hand Pinch-Zoom)
   - Pure 29 Niyams (No Extra Category Clutter) + Multi-line Quiz Winner Names
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

// 2. OWNER CREDENTIALS
const OWNER_PHONE = "9306894518";
const OWNER_PASS = "bishnoi29";

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

// Samvad Manch & Safety Moderation State
let allChatPosts = [];
let activeReplyObj = null;
let blockedPhonesList = [];

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

// Maintenance State
let maintenanceConfig = {
  globalMode: 'off',
  message: 'हम आपके अनुभव को बेहतर बनाने के लिए ऐप को अपडेट कर रहे हैं। कृपया कुछ समय बाद पुनः प्रयास करें।',
  sections: { mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off' }
};

// Progress & Mala State
let malaBeadCount = parseInt(localStorage.getItem('bishnoi_mala_beads') || '0');
let malaLapsCount = parseInt(localStorage.getItem('bishnoi_mala_laps') || '0');
let malaTotalCount = parseInt(localStorage.getItem('bishnoi_mala_total') || '0');
let readNiyamsSet = new Set(JSON.parse(localStorage.getItem('bishnoi_read_niyams') || '[]'));
let bestQuizPct = parseInt(localStorage.getItem('bishnoi_best_quiz_pct') || '0');

// 4. PURE 29 NIYAMS DATA (No Extra Category Clutter)
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

// History & Kids Stories
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

// 5. GLOBAL STYLES & SINGLE BOTTOM NAVIGATION BAR (NO DUPLICATE TOP MENU)
function injectCleanLayoutStyles() {
  let styleEl = document.getElementById('cleanPortalFixStyles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'cleanPortalFixStyles';
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `
    html, body { max-width: 100vw; overflow-x: hidden; padding-bottom: 84px !important; }
    /* Hide the old top navigation row so navigation appears ONLY ONCE at the bottom */
    #nav-home, #nav-niyams, #nav-mala, #nav-library, #nav-community, #nav-quiz, #nav-history, #nav-admin, #nav-admin-mobile {
      display: none !important;
    }
    /* Multi-line Quiz Winner Names so long names never cut */
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
    .bnav-item-active {
      color: #143622 !important;
      background-color: #FEF3C7 !important;
      border-color: #F59E0B !important;
      font-weight: 800 !important;
    }
    .admin-subtab-active {
      background-color: #143622 !important;
      color: #ffffff !important;
      border-color: #143622 !important;
    }
    /* Hide scrollbar for smooth bottom bar on narrow phones */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;

  // Also hide parent nav container if it only held top nav buttons
  const oldTopNavBtn = document.getElementById('nav-home');
  if (oldTopNavBtn && oldTopNavBtn.parentElement) {
    oldTopNavBtn.parentElement.style.display = 'none';
  }
}

// PW / Amazon / Jio Style Unified Bottom Navigation Bar (Visible on ALL Screens, Last item = Profile)
function injectUnifiedBottomNavBar() {
  document.getElementById('standardMobileBottomNav')?.remove();
  const bottomNav = document.createElement('nav');
  bottomNav.id = 'standardMobileBottomNav';
  bottomNav.className = 'fixed bottom-0 left-0 right-0 z-[95] bg-white/95 backdrop-blur-md border-t-2 border-stone-200 shadow-2xl px-2 py-1.5';
  bottomNav.innerHTML = `
    <div class="max-w-5xl mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
      <button onclick="switchTab('home')" id="bnav-home" class="bnav-item-active flex-1 min-w-[64px] flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border border-transparent text-[11px] text-stone-600 transition">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <span class="truncate">मुखपृष्ठ</span>
      </button>

      <button onclick="switchTab('niyams')" id="bnav-niyams" class="flex-1 min-w-[64px] flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <span class="truncate">२९ नियम</span>
      </button>

      <button onclick="switchTab('mala')" id="bnav-mala" class="flex-1 min-w-[64px] flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="3" r="1.5"/><circle cx="12" cy="21" r="1.5"/><circle cx="3" cy="12" r="1.5"/><circle cx="21" cy="12" r="1.5"/></svg>
        <span class="truncate">जप माला</span>
      </button>

      <button onclick="switchTab('library')" id="bnav-library" class="flex-1 min-w-[64px] flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <span class="truncate">साहित्य</span>
      </button>

      <button onclick="switchTab('community')" id="bnav-community" class="flex-1 min-w-[64px] flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        <span class="truncate">संवाद मंच</span>
      </button>

      <button onclick="switchTab('quiz')" id="bnav-quiz" class="flex-1 min-w-[64px] flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        <span class="truncate">परीक्षा</span>
      </button>

      <button onclick="switchTab('history')" id="bnav-history" class="flex-1 min-w-[64px] flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span class="truncate">इतिहास</span>
      </button>

      <button onclick="openProfileModal()" id="bnav-profile" class="flex-1 min-w-[64px] flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border border-transparent text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition relative">
        <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span id="bnavProfileLabel" class="truncate">प्रोफ़ाइल</span>
      </button>
    </div>
  `;
  document.body.appendChild(bottomNav);
}

// 6. HOMEPAGE EASY QUICK-CONTROL DASHBOARD & CUSTOM MUSIC PLAYER
function upgradeHomepageAndAudioUI() {
  const homeTab = document.getElementById('tab-home');
  if (homeTab && !document.getElementById('cleanHeroLandingSection')) {
    const heroWrap = document.createElement('div');
    heroWrap.id = 'cleanHeroLandingSection';
    heroWrap.className = 'space-y-4 mb-5';
    heroWrap.innerHTML = `
      <!-- Clean App Control & Progress Card -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
          <div>
            <span class="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              विश्नोई समाज डिजिटल मंच • त्वरित नेविगेशन
            </span>
            <h2 class="font-yatra text-lg sm:text-xl text-forest mt-1">ऐप के मुख्य अनुभाग (चुनने के लिए टैप करें)</h2>
          </div>
          <div class="flex items-center gap-3 text-xs font-semibold text-stone-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <span>नियम पठन: <strong id="progNiyamsCount" class="text-forest">${readNiyamsSet.size}/29</strong></span>
            <span>•</span>
            <span>परीक्षा अंक: <strong id="progQuizScore" class="text-terracotta">${bestQuizPct}%</strong></span>
            <span>•</span>
            <span>माला: <strong id="progMalaLaps" class="text-emerald-700">${malaLapsCount}</strong></span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button onclick="switchTab('library')" class="p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 text-left transition">
            <span class="font-yatra text-sm sm:text-base text-forest block">📚 सबदवाणी व साहित्य</span>
            <span class="text-[11px] text-stone-600">पुस्तक की तरह पन्ना पलटकर पढ़ें</span>
          </button>
          <button onclick="switchTab('niyams')" class="p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-200 text-left transition">
            <span class="font-yatra text-sm sm:text-base text-forest block">📜 २९ नियम संहिता</span>
            <span class="text-[11px] text-stone-600">सरल अर्थ सहित नियम पढ़ें</span>
          </button>
          <button onclick="switchTab('quiz')" class="p-3 rounded-xl bg-orange-50/70 hover:bg-orange-100 border border-orange-200 text-left transition">
            <span class="font-yatra text-sm sm:text-base text-forest block">🏆 दैनिक ज्ञान परीक्षा</span>
            <span class="text-[11px] text-stone-600">प्रश्नोत्तरी व सम्मान-पत्र</span>
          </button>
          <button onclick="switchTab('community')" class="p-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-left transition">
            <span class="font-yatra text-sm sm:text-base text-forest block">💬 समाज संवाद मंच</span>
            <span class="text-[11px] text-stone-600">ग्रुप चर्चा में भाग लें</span>
          </button>
        </div>
      </div>
    `;
    homeTab.insertBefore(heroWrap, homeTab.firstChild);
  }

  // Replace Rough Native Browser Audio Bar with Standard Custom Music Box
  const nativeAudio = document.getElementById('audioPlayer');
  const nativeSelect = document.getElementById('audioTrackSelect');
  if (nativeAudio && !document.getElementById('standardCustomMusicBox')) {
    const hostCard = nativeAudio.closest('div.bg-white') || nativeAudio.parentElement;
    nativeAudio.classList.add('hidden');
    if (nativeSelect) nativeSelect.classList.add('hidden');

    // Hide old duplicate title inside hostCard if present
    Array.from(hostCard.children).forEach(ch => {
      if (ch !== nativeAudio) ch.classList.add('hidden');
    });

    hostCard.className = 'bg-gradient-to-r from-[#143622] via-[#1b432c] to-[#143622] text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-amber-400/40';

    const musicUI = document.createElement('div');
    musicUI.id = 'standardCustomMusicBox';
    musicUI.className = 'space-y-3';
    musicUI.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2.5">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow-md">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
          <div class="min-w-0">
            <span class="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">सबदवाणी, आरती एवं भजन प्लेयर</span>
            <h4 id="customNowPlayingTitle" class="font-yatra text-base sm:text-lg text-white truncate">श्री जम्भेश्वर आरती एवं भजन</h4>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <select id="customPlaylistDropdown" onchange="selectCustomTrackByIndex(this.value)" class="flex-1 sm:flex-initial p-2 rounded-xl bg-black/35 text-amber-200 border border-amber-400/40 text-xs font-bold max-w-full sm:max-w-[210px] truncate">
            <option value="0">1. श्री जम्भेश्वर आरती एवं भजन</option>
          </select>
          <button onclick="cycleCustomAudioSpeed()" id="customAudioSpeedBtn" class="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 text-xs font-extrabold border border-amber-400/30">
            1x
          </button>
        </div>
      </div>

      <!-- Progress Seekbar & Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
        <div class="flex items-center justify-center gap-4 shrink-0">
          <button onclick="skipCustomTrack(-1)" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition" title="पिछला भजन">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button onclick="toggleCustomMusicPlay()" id="customPlayBtn" class="w-11 h-11 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center shadow-lg transition transform active:scale-95" title="चलाएं / रोकें">
            <svg id="playSvgIcon" class="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button onclick="skipCustomTrack(1)" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition" title="अगला भजन">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
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
  if (!btn) return;
  btn.innerHTML = playing
    ? `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
    : `<svg class="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
}

function renderCustomMusicDropdown() {
  const sel = document.getElementById('customPlaylistDropdown');
  const titleEl = document.getElementById('customNowPlayingTitle');
  if (!sel) return;
  sel.innerHTML = audioPlaylist.map((tr, i) => `<option value="${i}">${i + 1}. ${tr.title}</option>`).join('');
  sel.value = currentTrackIndex.toString();
  if (titleEl && audioPlaylist[currentTrackIndex]) {
    titleEl.innerText = audioPlaylist[currentTrackIndex].title;
  }
}

function selectCustomTrackByIndex(idxStr) {
  const idx = parseInt(idxStr);
  if (!audioPlaylist[idx]) return;
  currentTrackIndex = idx;
  const player = document.getElementById('audioPlayer');
  const source = document.getElementById('audioSource');
  if (player && source) {
    source.src = audioPlaylist[idx].link;
    player.load();
    player.play().catch(() => {});
  }
  renderCustomMusicDropdown();
}

function toggleCustomMusicPlay() {
  const player = document.getElementById('audioPlayer');
  const source = document.getElementById('audioSource');
  if (!player) return;

  if ((!source.src || source.src === window.location.href) && audioPlaylist[currentTrackIndex]) {
    source.src = audioPlaylist[currentTrackIndex].link;
    player.load();
  }

  if (player.paused) {
    player.play().catch(() => showToast("भजन लोड हो रहा है..."));
  } else {
    player.pause();
  }
}

function skipCustomTrack(delta) {
  if (!audioPlaylist.length) return;
  currentTrackIndex = (currentTrackIndex + delta + audioPlaylist.length) % audioPlaylist.length;
  selectCustomTrackByIndex(currentTrackIndex);
}

function seekCustomMusic(val) {
  const player = document.getElementById('audioPlayer');
  if (player && player.duration) {
    player.currentTime = (val / 100) * player.duration;
  }
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
  const nEl = document.getElementById('progNiyamsCount');
  const qEl = document.getElementById('progQuizScore');
  const mEl = document.getElementById('progMalaLaps');
  if (nEl) nEl.innerText = `${readNiyamsSet.size}/29`;
  if (qEl) qEl.innerText = `${bestQuizPct}%`;
  if (mEl) mEl.innerText = `${malaLapsCount}`;
}

// 7. DEVICE DETECTION & MAINTENANCE ENGINE
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

// 8. OWNER STUDIO (5-SUBSECTION EASY CONSOLE)
function organizeStandardOwnerConsole() {
  const adminTab = document.getElementById('tab-admin');
  if (!adminTab || document.getElementById('ownerStandardConsoleBar')) return;

  // Upgrade PDF Upload Box to include Tag & Subtitle so all PDFs look like Card 1
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

  const existingChildren = Array.from(adminTab.children);

  const consoleHeader = document.createElement('div');
  consoleHeader.id = 'ownerStandardConsoleBar';
  consoleHeader.className = 'space-y-4 mb-4';
  consoleHeader.innerHTML = `
    <div class="bg-[#143622] text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-3 border border-amber-400/30">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">🛡️ OWNER STUDIO & COMMAND CENTER</span>
          <h2 class="font-yatra text-xl text-white">व्यवस्थापक स्टूडियो (Owner Studio)</h2>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="refreshOwnerAnalytics()" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-amber-200 border border-white/15">
            ↻ रिफ्रेश
          </button>
          <button onclick="openProfileModal()" class="px-3 py-1.5 rounded-lg bg-amber-400 text-stone-950 text-xs font-extrabold">
            👤 प्रोफ़ाइल
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div class="bg-white/10 p-3 rounded-xl border border-white/10">
          <span class="text-[11px] text-stone-300 block">कुल सदस्य</span>
          <strong id="admStatUsers" class="text-xl font-bold text-amber-300">...</strong>
        </div>
        <div class="bg-white/10 p-3 rounded-xl border border-white/10">
          <span class="text-[11px] text-stone-300 block">परीक्षा प्रयास</span>
          <strong id="admStatQuizzes" class="text-xl font-bold text-emerald-300">...</strong>
        </div>
        <div class="bg-white/10 p-3 rounded-xl border border-white/10">
          <span class="text-[11px] text-stone-300 block">संवाद संदेश</span>
          <strong id="admStatPosts" class="text-xl font-bold text-white">...</strong>
        </div>
        <div class="bg-white/10 p-3 rounded-xl border border-white/10">
          <span class="text-[11px] text-stone-300 block">साहित्य व भजन</span>
          <strong id="admStatMedia" class="text-xl font-bold text-amber-200">...</strong>
        </div>
      </div>
    </div>

    <!-- 5 Easy Sub-Sections -->
    <div class="flex flex-wrap gap-1.5 bg-white p-2 rounded-xl border border-stone-200 shadow-sm">
      <button onclick="switchAdminSubTab('adm_overview')" id="admbtn_adm_overview" class="admin-subtab-active flex-1 min-w-[115px] py-2 px-2.5 rounded-lg text-xs font-bold border border-stone-200 transition">
        1. संदेश व रिपोर्ट्स
      </button>
      <button onclick="switchAdminSubTab('adm_media')" id="admbtn_adm_media" class="flex-1 min-w-[115px] py-2 px-2.5 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition">
        2. साहित्य व भजन
      </button>
      <button onclick="switchAdminSubTab('adm_content')" id="admbtn_adm_content" class="flex-1 min-w-[115px] py-2 px-2.5 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition">
        3. इतिहास व संस्कार
      </button>
      <button onclick="switchAdminSubTab('adm_quiz')" id="admbtn_adm_quiz" class="flex-1 min-w-[115px] py-2 px-2.5 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition">
        4. परीक्षा व AI
      </button>
      <button onclick="switchAdminSubTab('adm_system')" id="admbtn_adm_system" class="flex-1 min-w-[115px] py-2 px-2.5 rounded-lg text-xs font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition">
        5. सुरक्षा व मेंटेनेंस
      </button>
    </div>
  `;

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

  // Sub-Section 3: History & Kids Editor
  panes.adm_content.innerHTML = `
    <div class="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
      <h3 class="font-yatra text-base text-forest">📜 इतिहास दर्शन एवं 🧸 बाल संस्कार प्रबंधक</h3>
      <p class="text-xs text-stone-500">यहाँ से नया इतिहास अध्याय या बच्चों के लिए कहानी जोड़ें:</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <select id="adminHistType" class="p-2.5 rounded-lg border border-stone-300 font-bold text-forest bg-stone-50">
          <option value="history">📜 इतिहास दर्शन (History)</option>
          <option value="kids">🧸 बाल संस्कार मंच (Kids Story)</option>
        </select>
        <input type="text" id="adminHistBadge" placeholder="छोटा टैग (उदा: इतिहास अध्याय या बाल कहानी)" class="p-2.5 rounded-lg border border-stone-300">
      </div>
      <input type="text" id="adminHistTitle" placeholder="मुख्य शीर्षक (Title)" class="w-full p-2.5 text-xs rounded-lg border border-stone-300 font-semibold">
      <textarea id="adminHistContent" rows="4" placeholder="पूरी जानकारी या कहानी यहाँ लिखें..." class="w-full p-2.5 text-xs rounded-lg border border-stone-300"></textarea>
      <input type="text" id="adminHistMoral" placeholder="मुख्य सीख / संदेश (Moral)" class="w-full p-2.5 text-xs rounded-lg border border-stone-300">
      <button onclick="saveAdminHistoryOrKidsItem()" class="w-full py-2.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-lg shadow transition">
        ➕ प्रकाशित करें (Publish)
      </button>
    </div>
  `;

  // Sub-Section 2 Extra: Audio Playlist Delete List
  const audioListCard = document.createElement('div');
  audioListCard.className = 'bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2';
  audioListCard.innerHTML = `
    <h4 class="font-yatra text-base text-forest">🎵 अपलोड किए गए भजन प्रबंधक (Audio List)</h4>
    <div id="adminAudioManageList" class="space-y-1.5 text-xs"></div>
  `;
  panes.adm_media.appendChild(audioListCard);

  // Sub-Section 4 Extra: Quiz Questions Delete List
  const quizListCard = document.createElement('div');
  quizListCard.className = 'bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2.5';
  quizListCard.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="font-yatra text-base text-forest">🏆 वर्तमान ज्ञान परीक्षा प्रश्न सूची</h3>
      <button onclick="clearAllQuizQuestions()" class="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200">सभी प्रश्न हटाएं</button>
    </div>
    <div id="adminQuizManageList" class="space-y-1.5 max-h-56 overflow-y-auto text-xs"></div>
  `;
  panes.adm_quiz.appendChild(quizListCard);

  // Sub-Section 5 Extra: Member Password Reset & Safety Moderation
  const securityCard = document.createElement('div');
  securityCard.className = 'bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-4';
  securityCard.innerHTML = `
    <div class="space-y-2">
      <h3 class="font-yatra text-base text-forest">🔑 सदस्य पासवर्ड रीसेट (Password Reset)</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <input type="text" id="adminResetUserPhone" maxlength="10" placeholder="सदस्य का 10-अंकों का नंबर" class="p-2.5 rounded-lg border border-stone-300">
        <input type="text" id="adminResetUserNewPass" placeholder="नया पासवर्ड (उदा: 123456)" class="p-2.5 rounded-lg border border-stone-300">
        <button onclick="adminResetMemberPassword()" class="py-2.5 px-4 bg-terracotta hover:bg-orange-800 text-white font-bold rounded-lg shadow transition">
          पासवर्ड बदलें
        </button>
      </div>
    </div>

    <div class="pt-3 border-t border-stone-100 space-y-2">
      <h4 class="font-yatra text-sm text-forest">🛡️ संवाद मंच सुरक्षा (Blocked / Muted Users)</h4>
      <p class="text-[11px] text-stone-500">संवाद मंच में जिन सदस्यों को पोस्ट करने से रोका गया है उनकी सूची:</p>
      <div id="adminBlockedUsersList" class="space-y-1.5 text-xs"></div>
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
      if (id === paneId) b.classList.add('admin-subtab-active');
      else b.classList.remove('admin-subtab-active');
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
    if (mEl) mEl.innerText = `${pdfSnap.size + 1} PDF / ${audSnap.size} भजन`;
  } catch (e) {}
}

// 9. DYNAMIC MODALS (PDF READER, PROFILE + OWNER STUDIO, FORGOT PASSWORD, MAINTENANCE)
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

  // 1. Global Maintenance Overlay
  if (!document.getElementById('globalMaintenanceOverlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'globalMaintenanceOverlay';
    overlay.className = 'fixed inset-0 z-[9999] bg-[#143622] text-white hidden flex-col items-center justify-center p-6 text-center';
    overlay.innerHTML = `
      <div class="max-w-md w-full bg-white/10 backdrop-blur-md border border-amber-400/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <h1 class="font-yatra text-2xl text-amber-300">सेवा अस्थायी रूप से रखरखाव में है</h1>
        <p id="globalMaintMsgText" class="text-sm text-stone-200 leading-relaxed"></p>
        <div class="pt-4 border-t border-white/10 flex justify-center">
          <button onclick="ownerEmergencyUnlock()" class="text-xs text-stone-300 hover:text-amber-300 underline">
            व्यवस्थापक लॉगिन (Owner Bypass)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // 2. Section Maintenance Card
  if (!document.getElementById('sectionMaintenanceCard')) {
    const secCard = document.createElement('div');
    secCard.id = 'sectionMaintenanceCard';
    secCard.className = 'hidden max-w-xl mx-auto my-8 bg-white p-6 rounded-2xl border-2 border-amber-300 text-center space-y-3 shadow-md';
    secCard.innerHTML = `
      <h2 class="font-yatra text-xl text-forest">यह अनुभाग अभी मेंटेनेंस में है</h2>
      <p id="sectionMaintMsgText" class="text-sm text-stone-600 leading-relaxed"></p>
      <button onclick="switchTab('home')" class="mt-2 px-4 py-2 bg-forest text-white rounded-lg text-xs font-semibold">
        मुखपृष्ठ पर जाएं
      </button>
    `;
    const mainEl = document.querySelector('main') || document.body;
    mainEl.appendChild(secCard);
  }

  // 3. Page-by-Page Horizontal Book PDF Reader Modal (Hand Pinch-Zoom + Landscape Mode)
  if (!document.getElementById('inbuiltPdfModal')) {
    const pdfModal = document.createElement('div');
    pdfModal.id = 'inbuiltPdfModal';
    pdfModal.className = 'fixed inset-0 z-[9990] bg-stone-950 hidden flex-col select-none';
    pdfModal.innerHTML = `
      <div class="bg-[#143622] text-white px-3 py-2.5 flex items-center justify-between gap-2 border-b border-amber-500/40 shadow-md shrink-0">
        <h3 id="pdfViewerTitle" class="font-yatra text-sm sm:text-base text-amber-300 truncate">साहित्य पाठक</h3>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="togglePdfLandscapeMode()" id="landscapeModeBtn" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-extrabold shadow">
            <span id="landscapeBtnText">🔄 लैंडस्केप (आड़ा मोड)</span>
          </button>
          <a id="pdfModalDownloadBtn" href="#" download class="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold">
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
        <button onclick="changePdfPage(-1)" id="pdfPrevBtn" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-extrabold text-xs sm:text-sm rounded-xl shadow">
          ← पिछला पन्ना
        </button>
        <div class="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
          <span>पृष्ठ</span>
          <input type="number" id="pdfPageJumpInput" min="1" value="1" onchange="jumpToPdfPage(this.value)" class="w-14 text-center py-1 rounded bg-stone-800 text-amber-300 border border-amber-400/40 font-extrabold">
          <span id="pdfTotalPagesLabel">/ 1</span>
        </div>
        <button onclick="changePdfPage(1)" id="pdfNextBtn" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-extrabold text-xs sm:text-sm rounded-xl shadow">
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

  // 4. User Profile Modal + Owner Studio Hub Inside Profile
  if (!document.getElementById('userProfileModal')) {
    const profModal = document.createElement('div');
    profModal.id = 'userProfileModal';
    profModal.className = 'fixed inset-0 z-[9980] bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4 overflow-y-auto';
    profModal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 border border-stone-200 shadow-2xl my-auto">
        <div class="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div>
            <h3 class="font-yatra text-lg text-forest">👤 मेरी प्रोफ़ाइल (My Profile)</h3>
            <p id="profileRoleBadge" class="text-xs font-bold text-stone-500"></p>
          </div>
          <button onclick="closeProfileModal()" class="text-stone-400 hover:text-stone-700 text-lg font-bold">✕</button>
        </div>

        <!-- OWNER STUDIO HUB (100% Hidden for Normal Users, Shown ONLY to Owner) -->
        <div id="ownerStudioInsideProfile" class="hidden p-3.5 rounded-2xl bg-gradient-to-br from-[#143622] to-stone-900 text-white space-y-2.5 border border-amber-400/40 shadow-md">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-amber-300">🛡️ व्यवस्थापक स्टूडियो (Owner Studio)</span>
            <span class="text-[10px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full">Full Access</span>
          </div>
          <p class="text-[11px] text-stone-300">किसी भी अनुभाग को सीधे खोलने के लिए नीचे क्लिक करें:</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            <button onclick="openOwnerStudioSubTab('adm_overview')" class="p-2 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-stone-950 font-bold text-left transition">📊 1. संदेश व रिपोर्ट्स</button>
            <button onclick="openOwnerStudioSubTab('adm_media')" class="p-2 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-stone-950 font-bold text-left transition">📚 2. PDF व भजन</button>
            <button onclick="openOwnerStudioSubTab('adm_content')" class="p-2 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-stone-950 font-bold text-left transition">📜 3. इतिहास व संस्कार</button>
            <button onclick="openOwnerStudioSubTab('adm_quiz')" class="p-2 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-stone-950 font-bold text-left transition">🏆 4. परीक्षा व AI</button>
            <button onclick="openOwnerStudioSubTab('adm_system')" class="p-2 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-stone-950 font-bold text-left transition col-span-2 sm:col-span-1">🛠️ 5. मेंटेनेंस व सुरक्षा</button>
          </div>
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

          <button type="button" onclick="linkGoogleAccount()" class="w-full py-2 px-3 border border-stone-300 hover:bg-stone-50 rounded-lg font-semibold text-stone-700 transition">
            <span id="profGoogleBtnText">🌐 Google अकाउंट जोड़ें (पासवर्ड रिकवरी हेतु)</span>
          </button>

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

        <div class="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
          <button onclick="saveUserProfileChanges()" class="flex-1 py-2.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-lg shadow transition">
            💾 प्रोफ़ाइल सहेजें
          </button>
          <button onclick="closeProfileModal(); logoutUser();" class="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-lg border border-red-200">
            लॉगआउट
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
          <button onclick="closeForgotPassModal()" class="text-stone-400 font-bold">✕</button>
        </div>
        <div class="space-y-3 text-xs">
          <input type="text" id="fpPhoneInput" maxlength="10" placeholder="10 अंकों का पंजीकृत मोबाइल नंबर" class="w-full p-2.5 rounded-lg border border-stone-300 font-semibold">
          <input type="password" id="fpNewPassInput" placeholder="नया पासवर्ड बनाएं" class="w-full p-2.5 rounded-lg border border-stone-300">
          <button type="button" onclick="verifyGoogleAndResetPassword()" class="w-full py-2.5 px-3 bg-forest text-white rounded-xl font-bold shadow">
            🌐 Google से सत्यापित कर पासवर्ड बदलें
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(fpModal);
  }

  // 6. Auth Modal Google Button
  const authForm = document.querySelector('#authModal form');
  if (authForm && !document.getElementById('googleAuthModalBtn')) {
    const extraDiv = document.createElement('div');
    extraDiv.className = 'pt-2 border-t border-stone-200 space-y-2';
    extraDiv.innerHTML = `
      <div class="flex justify-end">
        <button type="button" onclick="openForgotPassModal()" class="text-xs font-bold text-terracotta hover:underline">
          पासवर्ड भूल गए?
        </button>
      </div>
      <button id="googleAuthModalBtn" type="button" onclick="signInOrVerifyWithGoogle()" class="w-full py-2.5 px-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold shadow-sm">
        🌐 Google से 1-Click लॉगिन करें
      </button>
    `;
    authForm.appendChild(extraDiv);
  }

  organizeStandardOwnerConsole();
}

function openOwnerStudioSubTab(subPaneId) {
  closeProfileModal();
  switchTab('admin');
  switchAdminSubTab(subPaneId);
}

// 10. INITIALIZATION & NAVIGATION
window.addEventListener('DOMContentLoaded', () => {
  injectDynamicModalsAndUI();
  syncOwnerCustomName();
  updateNavAuth();
  listenMaintenanceConfig();
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
  renderMalaCounters();
  updateProgressIndicators();
});

async function syncOwnerCustomName() {
  if (currentUser && currentUser.isOwner === true && currentUser.phone === OWNER_PHONE) {
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

function switchTab(id) {
  if (id === 'admin' && (!currentUser || !currentUser.isOwner)) {
    return showToast("यह अनुभाग केवल मुख्य व्यवस्थापक के लिए है।");
  }
  currentActiveTab = id;
  ['home', 'mala', 'niyams', 'library', 'community', 'quiz', 'history', 'admin'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const bnav = document.getElementById(`bnav-${t}`);
    if (el) el.classList.add('hidden');
    if (bnav) bnav.classList.remove('bnav-item-active');
  });

  const target = document.getElementById(`tab-${id}`);
  const activeBnav = document.getElementById(id === 'admin' ? 'bnav-profile' : `bnav-${id}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('view-panel');
  }
  if (activeBnav) activeBnav.classList.add('bnav-item-active');

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

// 11. TOAST & CONFIRM MODAL
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

// 12. AUTHENTICATION, PROFILE & OWNER STUDIO ACCESS
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

  // STRICT OWNER CHECK (9306894518 / bishnoi29)
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
    renderFilteredChat();
    closeAuthModal();
    showToast(`स्वागत है, ${currentUser.name}! प्रोफ़ाइल में Owner Studio सक्रिय है।`);
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return showToast("कृपया सही १० अंकों का भारतीय मोबाइल नंबर दर्ज करें!");
  }

  if (isRegisterMode) {
    if (!nameInput) return showToast("कृपया अपना पूरा नाम दर्ज करें!");
    try {
      const userDoc = await db.collection('users').doc(phone).get();
      if (userDoc.exists) return showToast("यह नंबर पहले से पंजीकृत है! कृपया लॉगिन करें।");

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
    if (!userDoc.exists) return showToast("यह नंबर पंजीकृत नहीं है! कृपया पहले Register करें।");
    const userData = userDoc.data();
    if (userData.pass && userData.pass !== pass) return showToast("गलत पासवर्ड!");

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
    renderFilteredChat();
    closeAuthModal();
    showToast(`स्वागत है, ${currentUser.name}!`);
  } catch (err) {
    showToast("लॉगिन त्रुटि: " + err.message);
  }
}

async function signInOrVerifyWithGoogle() {
  if (!firebase.auth) return showToast("कृपया पेज रिफ्रेश करें!");
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
    renderNiyams(niyamsList);
    renderHistoryAndKidsViews();
    listenPdfs();
    renderFilteredChat();
    closeAuthModal();
    showToast(`Google लॉगिन सफल! स्वागत है, ${currentUser.name}`);
  } catch (err) {
    showToast("Google लॉगिन त्रुटि: " + err.message);
  }
}

function openForgotPassModal() {
  closeAuthModal();
  const modal = document.getElementById('forgotPassModal');
  if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

function closeForgotPassModal() {
  const modal = document.getElementById('forgotPassModal');
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

async function verifyGoogleAndResetPassword() {
  const phone = document.getElementById('fpPhoneInput')?.value.trim() || '';
  const newPass = document.getElementById('fpNewPassInput')?.value.trim() || '';
  if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया १०-अंकों का मोबाइल नंबर सही लिखें!");
  if (!newPass || newPass.length < 4) return showToast("कम से कम ४ अक्षरों का पासवर्ड लिखें!");

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
      return showToast("यह Google खाता इस नंबर से मेल नहीं खाता!");
    }

    await userRef.set({ pass: newPass, email: gUser.email, googleVerified: true }, { merge: true });
    currentUser = { name: userData.name || "सदस्य", phone, email: gUser.email, location: userData.location || "", isOwner: (phone === OWNER_PHONE) };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    closeForgotPassModal();
    showToast("पासवर्ड बदल गया और आप लॉगिन हो गए हैं!");
  } catch (err) {
    showToast("त्रुटि: " + err.message);
  }
}

async function adminResetMemberPassword() {
  if (!currentUser || !currentUser.isOwner) return;
  const phone = document.getElementById('adminResetUserPhone')?.value.trim() || '';
  const newPass = document.getElementById('adminResetUserNewPass')?.value.trim() || '';
  if (!/^[6-9]\d{9}$/.test(phone) || !newPass) return showToast("नंबर और नया पासवर्ड सही भरें!");

  try {
    const ref = db.collection('users').doc(phone);
    const doc = await ref.get();
    if (!doc.exists) return showToast("इस नंबर से कोई सदस्य नहीं मिला!");
    await ref.update({ pass: newPass });
    document.getElementById('adminResetUserPhone').value = '';
    document.getElementById('adminResetUserNewPass').value = '';
    showToast(`सदस्य (${doc.data().name || phone}) का पासवर्ड बदल दिया गया!`);
  } catch (e) {
    showToast("त्रुटि: " + e.message);
  }
}

async function linkGoogleAccount() {
  if (!currentUser || !firebase.auth) return;
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    const gUser = result.user;
    if (gUser && gUser.email) {
      currentUser.email = gUser.email;
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      await db.collection('users').doc(currentUser.phone).set({ email: gUser.email, googleVerified: true }, { merge: true });
      openProfileModal();
      showToast(`Google खाता (${gUser.email}) जुड़ गया!`);
    }
  } catch (err) {
    showToast("त्रुटि: " + err.message);
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

  const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);
  const studioBox = document.getElementById('ownerStudioInsideProfile');
  if (studioBox) studioBox.classList.toggle('hidden', !isVerifiedOwner);

  const roleBadge = document.getElementById('profileRoleBadge');
  if (roleBadge) {
    roleBadge.innerText = isVerifiedOwner ? '🛡️ मुख्य व्यवस्थापक (Owner)' : '👤 पंजीकृत सदस्य (Member)';
  }

  document.getElementById('statMalaTotal').innerText = malaTotalCount;
  document.getElementById('statMalaLaps').innerText = malaLapsCount;
  document.getElementById('statChatCount').innerText = allChatPosts.filter(p => p.phone === currentUser.phone).length;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeProfileModal() {
  const modal = document.getElementById('userProfileModal');
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
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
    showToast("प्रोफ़ाइल सहेज ली गई!");
  } catch (e) {
    showToast("त्रुटि: " + e.message);
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
  renderFilteredChat();
  switchTab('home');
  showToast("सफलतापूर्वक लॉगआउट किया गया।");
}

function updateNavAuth() {
  const container = document.getElementById('authActionsContainer');
  const postPrompt = document.getElementById('postAuthPrompt');
  const postEditor = document.getElementById('postEditor');
  const bnavProfLbl = document.getElementById('bnavProfileLabel');

  // Keep Top Header Clean (No duplicate profile button since Profile is in Bottom Nav)
  if (container) {
    if (currentUser) {
      container.innerHTML = `
        <span class="text-xs font-bold text-forest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 truncate max-w-[140px]">
          ${currentUser.isOwner ? '🛡️ ' : ''}${currentUser.name}
        </span>
      `;
    } else {
      container.innerHTML = `
        <button onclick="openAuthModal()" class="px-3 py-1.5 rounded-xl bg-forest text-white text-xs font-bold shadow-sm">
          लॉगिन करें
        </button>
      `;
    }
  }

  if (bnavProfLbl) {
    bnavProfLbl.innerText = currentUser ? (currentUser.isOwner ? 'स्टूडियो' : 'प्रोफ़ाइल') : 'लॉगिन';
  }

  if (currentUser) {
    if (postPrompt) postPrompt.classList.add('hidden');
    if (postEditor) postEditor.classList.remove('hidden');
  } else {
    if (postPrompt) postPrompt.classList.remove('hidden');
    if (postEditor) postEditor.classList.add('hidden');
  }
}

// 13. MAINTENANCE RULES
function ownerEmergencyUnlock() {
  const phone = prompt("व्यवस्थापक मोबाइल नंबर:");
  const pass = prompt("पासवर्ड:");
  if (phone && phone.trim() === OWNER_PHONE && pass && pass.trim() === OWNER_PASS) {
    currentUser = { name: "व्यवस्थापक (Owner)", phone: OWNER_PHONE, isOwner: true, location: "मुख्यालय" };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    applyMaintenanceRules();
    switchTab('admin');
  } else {
    alert("गलत विवरण!");
  }
}

function listenMaintenanceConfig() {
  db.collection('settings').doc('maintenance').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      maintenanceConfig.globalMode = data.globalMode || 'off';
      maintenanceConfig.message = data.message || maintenanceConfig.message;
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
  if (!currentUser || !currentUser.isOwner) return;
  const globalMode = document.getElementById('adminGlobalMaintMode')?.value || 'off';
  const message = document.getElementById('adminMaintMessage')?.value.trim() || maintenanceConfig.message;
  const sections = {};
  ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
    sections[sec] = document.getElementById(`lock_${sec}`)?.value || 'off';
  });
  await db.collection('settings').doc('maintenance').set({ globalMode, message, sections });
  showToast("मेंटेनेंस सेटिंग्स लागू हो गईं!");
}

// 14. DIGITAL JAAP MALA
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

// 15. PANCHANG & AMAVASYA
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
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      box.innerHTML = `⏳ समय शेष: <b>${days} दिन : ${hours} घंटे : ${mins} मिनट</b>`;
    } else {
      box.innerHTML = "पावन अमावस्या व्रत दिवस";
    }
  }
  update();
  amavasyaTimerInterval = setInterval(update, 30000);
}

async function saveAmavasyaConfig() {
  if (!currentUser || !currentUser.isOwner) return;
  const name = document.getElementById('adminAmavasyaName').value.trim();
  const date = document.getElementById('adminAmavasyaDate').value;
  const desc = document.getElementById('adminAmavasyaDesc').value.trim();
  if (!date) return showToast('तारीख चुनें');
  await db.collection('settings').doc('amavasyaConfig').set({ name: name || "पावन अमावस्या", date, desc: desc || "उपवास एवं हवन" });
  showToast('अमावस्या तिथि सहेजी गई!');
}

// 16. GEMINI AI & PDF REPORTS
function getGeminiKey() {
  let key = localStorage.getItem('gemini_user_api_key');
  if (!key) {
    key = prompt("अपनी Gemini API Key पेस्ट करें:");
    if (key && key.trim()) localStorage.setItem('gemini_user_api_key', key.trim());
  }
  return key;
}

function resetGeminiKey() {
  const k = prompt("नई Gemini API Key पेस्ट करें:", localStorage.getItem('gemini_user_api_key') || '');
  if (k !== null) {
    if (k.trim()) localStorage.setItem('gemini_user_api_key', k.trim());
    else localStorage.removeItem('gemini_user_api_key');
    showToast("API Key अपडेट हो गई!");
  }
}
const changeApiKey = resetGeminiKey;
const updateApiKey = resetGeminiKey;
const changeGeminiKey = resetGeminiKey;
const resetOpenAiKey = resetGeminiKey;

async function callGemini(promptText) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("API Key आवश्यक है");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
  });
  const data = await res.json();
  if (data.candidates?.[0]?.content?.parts?.[0]?.text) return data.candidates[0].content.parts[0].text;
  throw new Error("AI त्रुटि");
}

async function generateAiQuizQuestions() {
  const btn = document.getElementById('aiQuizGenBtn');
  if (btn) btn.disabled = true;
  try {
    const res = await callGemini(`विश्नोई समाज के २९ नियमों व खेजड़ली इतिहास पर ५ MCQ हिंदी में बनाएं:\nQ: प्रश्न?\nA) 1\nB) 2\nC) 3\nD) 4\nAns: A`);
    document.getElementById('adminBulkQuizText').value = res.trim();
    showToast("५ नए प्रश्न तैयार हैं!");
  } catch (e) { showToast(e.message); }
  finally { if (btn) btn.disabled = false; }
}

async function generateAiDailySandesh() {
  try {
    const res = await callGemini(`Write a 1-line inspirational quote in Hindi for Bishnoi community on nature protection and kindness.`);
    document.getElementById('adminBannerInput').value = res.trim();
    showToast("नया सुविचार तैयार है!");
  } catch (e) { showToast(e.message); }
}

async function downloadQuizResultsPdf() {
  const snap = await db.collection('quizAttempts').get();
  if (snap.empty) return showToast("कोई रिकॉर्ड नहीं मिला।");
  let records = [];
  snap.forEach(d => records.push(d.data()));
  records.sort((a, b) => b.score - a.score);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Bishnoi Portal - Quiz Results", 14, 18);
  doc.autoTable({
    startY: 25,
    head: [['Rank', 'Name', 'Phone', 'Score', 'Time']],
    body: records.map((r, i) => [i + 1, r.name || '', r.phone || '', `${r.score}/${r.total}`, `${r.timeTakenSeconds || 0}s`])
  });
  doc.save("Bishnoi_Quiz_Results.pdf");
}

async function download7DaysUsersPdf() {
  const snap = await db.collection('users').get();
  if (snap.empty) return showToast("कोई सदस्य नहीं मिला।");
  let rows = [];
  snap.forEach(d => {
    const u = d.data();
    rows.push([u.name || '', u.phone || d.id, u.email || '-', u.location || '-']);
  });
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Bishnoi Portal - Registered Members", 14, 18);
  doc.autoTable({ startY: 25, head: [['Name', 'Phone', 'Email', 'Location']], body: rows });
  doc.save("Bishnoi_Members.pdf");
}

// 17. QUIZ ARENA & CERTIFICATE
function generateCertificate(name, score) {
  const canvas = document.getElementById('certCanvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FAF7EE'; ctx.fillRect(0, 0, 800, 600);
  ctx.strokeStyle = '#143622'; ctx.lineWidth = 14; ctx.strokeRect(20, 20, 760, 560);
  ctx.fillStyle = '#143622'; ctx.textAlign = 'center';
  ctx.font = 'bold 30px sans-serif'; ctx.fillText('विश्नोई समाज डिजिटल ज्ञान परीक्षा सम्मान-पत्र', 400, 120);
  ctx.font = 'bold 28px sans-serif'; ctx.fillText(name, 400, 260);
  ctx.font = '18px sans-serif'; ctx.fillText(`प्राप्तांक: ${score}% • "जीव दया पालणी, रूंख लीलो नी घावै"`, 400, 350);
  const link = document.createElement('a');
  link.download = `Samman_Patra_${name}.png`;
  link.href = canvas.toDataURL();
  link.click();
}

function startQuizNow() {
  document.getElementById('quizIntroCard').classList.add('hidden');
  document.getElementById('quizActiveBox').classList.remove('hidden');
  currentQ = 0; qScore = 0; quizStartTime = Date.now();
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
          adminList.innerHTML += `
            <div class="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200 gap-2">
              <span class="truncate font-medium">${idx + 1}. ${doc.data().q}</span>
              <button onclick="deleteSingleQuizQuestion('${doc.id}')" class="text-red-600 font-bold shrink-0">हटाएं</button>
            </div>
          `;
        });
      }
    } else {
      quizList = [
        { q: "खेजड़ली गांव में ३६३ वीरों का महान बलिदान किस वर्ष हुआ था?", opts: ["1730 ईस्वी", "1485 ईस्वी", "1857 ईस्वी", "1947 ईस्वी"], ans: 0 },
        { q: "गुरु जम्भेश्वर भगवान द्वारा २९ नियमों की घोषणा किस पवित्र स्थान पर हुई?", opts: ["मुकाम", "समराथल धोरा", "जांगलू", "लालासर"], ans: 1 },
        { q: "अमृता देवी विश्नोई का अमर वचन क्या था?", opts: ["सत्यमेव जयते", "सिर साटै रूंख रहै, तो भी सस्तो जाण", "अहिंसा परमो धर्मः", "जय किसान"], ans: 1 }
      ];
    }
  });
}

async function deleteSingleQuizQuestion(id) {
  if (!currentUser || !currentUser.isOwner) return;
  await db.collection('quiz').doc(id).delete();
  showToast("प्रश्न हटाया गया!");
}

async function clearAllQuizQuestions() {
  if (!currentUser || !currentUser.isOwner) return;
  openConfirmModal("सभी प्रश्न हटाएं?", "क्या आप सभी प्रश्न हटाना चाहते हैं?", async (res) => {
    if (res) {
      const snap = await db.collection('quiz').get();
      const batch = db.batch();
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
      showToast("सभी प्रश्न हटाए गए!");
    }
  });
}

function renderQuiz() {
  const box = document.getElementById('quizActiveBox');
  if (!box || !quizList.length) return;

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
        name: currentUser.name, phone: currentUser.phone || 'N/A',
        score: qScore, total: quizList.length, timeTakenSeconds, date: new Date().toISOString()
      });
    }
    box.innerHTML = `
      <div class="text-center space-y-3 py-4">
        <h3 class="font-yatra text-xl text-forest">परीक्षा पूर्ण हुई!</h3>
        <p class="text-sm text-stone-600">प्राप्तांक: <strong class="text-terracotta text-base">${qScore} / ${quizList.length}</strong> (${percentage}%)</p>
        <div class="pt-3 flex flex-wrap justify-center gap-2">
          <button onclick="backToQuizIntro()" class="px-4 py-2 bg-stone-200 rounded-lg text-xs font-semibold">← वापस</button>
          <button onclick="startQuizNow()" class="px-4 py-2 bg-forest text-white rounded-lg text-xs font-semibold">पुनः प्रयास करें</button>
          ${percentage >= 80 ? `<button onclick="generateCertificate('${currentUser ? currentUser.name : 'प्रतिभागी'}', ${percentage})" class="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold">सम्मान-पत्र डाउनलोड करें</button>` : ''}
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
        <div class="h-full bg-forest transition-all" style="width: ${progressPct}%"></div>
      </div>
      <div class="flex justify-between items-center text-xs text-stone-500 border-b border-stone-100 pb-2">
        <span class="font-bold text-forest">प्रश्न ${currentQ + 1} / ${quizList.length}</span>
        <span class="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold">अंक: ${qScore}</span>
      </div>
      <h3 class="font-bold text-sm sm:text-base text-forest leading-snug">${q.q}</h3>
      <div class="space-y-2">
        ${q.opts.map((opt, i) => `
          <button onclick="checkAnswer(${i})" class="w-full text-left p-3 text-xs sm:text-sm rounded-xl border border-stone-200 hover:bg-amber-50 bg-white font-medium shadow-sm">
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
    feed.innerText = "✓ सही उत्तर!";
  } else {
    feed.className = "text-xs p-2.5 rounded-lg font-semibold bg-rose-100 text-rose-800 border border-rose-300";
    feed.innerText = `✕ गलत उत्तर! सही उत्तर: ${q.opts[q.ans]}`;
  }
  setTimeout(() => { currentQ++; renderQuiz(); }, 1000);
}

function backToQuizIntro() {
  document.getElementById('quizActiveBox').classList.add('hidden');
  document.getElementById('quizIntroCard').classList.remove('hidden');
}

async function importBulkQuiz() {
  if (!currentUser || !currentUser.isOwner) return;
  const rawText = document.getElementById('adminBulkQuizText').value.trim();
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
    if (qText && opts.length >= 2) parsed.push({ q: qText, opts, ans: ansIdx });
  }
  if (!parsed.length) return showToast('प्रारूप जाँचें');
  const batch = db.batch();
  parsed.forEach(q => batch.set(db.collection('quiz').doc(), q));
  await batch.commit();
  document.getElementById('adminBulkQuizText').value = '';
  showToast(`${parsed.length} प्रश्न जोड़े गए!`);
}

function listenWinners() {
  db.collection('settings').doc('dailyWinners').onSnapshot(doc => {
    if (doc.exists) {
      const w = doc.data();
      if (w.p1Name) { document.getElementById('winner1Name').innerText = w.p1Name; document.getElementById('winner1Score').innerText = w.p1Score || ''; }
      if (w.p2Name) { document.getElementById('winner2Name').innerText = w.p2Name; document.getElementById('winner2Score').innerText = w.p2Score || ''; }
      if (w.p3Name) { document.getElementById('winner3Name').innerText = w.p3Name; document.getElementById('winner3Score').innerText = w.p3Score || ''; }
    }
  });
}

async function saveDailyWinners() {
  if (!currentUser || !currentUser.isOwner) return;
  await db.collection('settings').doc('dailyWinners').set({
    p1Name: document.getElementById('win1InputName').value.trim(),
    p1Score: document.getElementById('win1InputScore').value.trim(),
    p2Name: document.getElementById('win2InputName').value.trim(),
    p2Score: document.getElementById('win2InputScore').value.trim(),
    p3Name: document.getElementById('win3InputName').value.trim(),
    p3Score: document.getElementById('win3InputScore').value.trim()
  });
  showToast("विजेता सूची अपडेट हो गई!");
}

// 18. WHATSAPP / TELEGRAM GROUP STYLE SAMVAD MANCH + SAFE USER MODERATION
const BAD_WORDS_LIST = ['गाली', 'मूर्ख', 'पागल', 'अभद्र', 'idiot', 'stupid', 'abuse'];

function containsBadWords(text) {
  const lower = text.toLowerCase();
  return BAD_WORDS_LIST.some(w => lower.includes(w));
}

function listenBlockedUsers() {
  db.collection('settings').doc('blockedUsers').onSnapshot(doc => {
    blockedPhonesList = (doc.exists && Array.isArray(doc.data().list)) ? doc.data().list : [];
    const admList = document.getElementById('adminBlockedUsersList');
    if (admList) {
      admList.innerHTML = blockedPhonesList.length === 0
        ? `<div class="text-stone-400">कोई भी सदस्य ब्लॉक नहीं है।</div>`
        : blockedPhonesList.map(ph => `
            <div class="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200">
              <span class="font-bold text-stone-700">${ph}</span>
              <button onclick="unblockUserPhone('${ph}')" class="text-emerald-700 font-bold hover:underline">अनलॉक करें (Unblock)</button>
            </div>
          `).join('');
    }
  });
}

async function blockUserFromChat(phone, authorName) {
  if (!currentUser || !currentUser.isOwner || !phone || phone === OWNER_PHONE) return;
  openConfirmModal("सदस्य को म्यूट/ब्लॉक करें?", `क्या आप '${authorName}' को संवाद मंच पर संदेश भेजने से रोकना चाहते हैं?`, async (res) => {
    if (res) {
      if (!blockedPhonesList.includes(phone)) blockedPhonesList.push(phone);
      await db.collection('settings').doc('blockedUsers').set({ list: blockedPhonesList });
      showToast(`${authorName} को ब्लॉक कर दिया गया।`);
    }
  });
}

async function unblockUserPhone(phone) {
  if (!currentUser || !currentUser.isOwner) return;
  blockedPhonesList = blockedPhonesList.filter(p => p !== phone);
  await db.collection('settings').doc('blockedUsers').set({ list: blockedPhonesList });
  showToast("सदस्य को अनलॉक कर दिया गया!");
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
  if (blockedPhonesList.includes(currentUser.phone)) {
    return showToast("आपको व्यवस्थापक द्वारा संवाद मंच पर संदेश भेजने से रोका गया है।");
  }

  const now = Date.now();
  if (!currentUser.isOwner && now - lastPostTime < 15000) {
    return showToast("कृपया अगले संदेश के लिए १५ सेकंड प्रतीक्षा करें।");
  }

  const txtEl = document.getElementById('postText');
  const txt = txtEl.value.trim();
  if (!txt) return showToast('कृपया अपना संदेश लिखें!');
  if (containsBadWords(txt)) return showToast('कृपया मर्यादित और सभ्य भाषा का प्रयोग करें।');

  const topic = document.getElementById('postTopicSelect')?.value || 'सामान्य चर्चा';
  const btn = document.getElementById('postSubmitBtn');
  if (btn) btn.disabled = true;

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
  } catch (e) {
    showToast('त्रुटि: ' + e.message);
  } finally {
    if (btn) btn.disabled = false;
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
      txt.innerText = `📌 ${d.author}: "${d.content}"`;
      banner.classList.remove('hidden');
      if (unpinBtn) unpinBtn.classList.toggle('hidden', !(currentUser && currentUser.isOwner === true));
    } else {
      banner.classList.add('hidden');
    }
  });
}

async function pinChatMessage(author, content) {
  if (!currentUser || !currentUser.isOwner) return;
  await db.collection('settings').doc('pinnedChat').set({ author, content });
  showToast("संदेश पिन कर दिया गया!");
}

async function unpinChatMessage() {
  if (!currentUser || !currentUser.isOwner) return;
  await db.collection('settings').doc('pinnedChat').delete();
  showToast("पिन हटा दिया गया।");
}

async function reactToPost(postId, type) {
  const storageKey = `reacted_${postId}_${type}`;
  if (localStorage.getItem(storageKey)) return;
  localStorage.setItem(storageKey, '1');
  try {
    await db.collection('posts').doc(postId).update({
      [`reactions.${type}`]: firebase.firestore.FieldValue.increment(1)
    });
  } catch (e) {}
}

function listenPosts() {
  db.collection('posts').orderBy('createdAt', 'desc').limit(45).onSnapshot(snap => {
    allChatPosts = [];
    snap.forEach(doc => allChatPosts.push({ id: doc.id, ...doc.data() }));
    renderFilteredChat();
  });
}

// WhatsApp / Telegram Group Style Bubble Feed
function renderFilteredChat() {
  const feed = document.getElementById('communityFeed');
  if (!feed) return;
  const selectedTopic = document.getElementById('chatTopicFilter')?.value || 'all';

  const filtered = selectedTopic === 'all'
    ? allChatPosts
    : allChatPosts.filter(p => (p.topic || 'सामान्य चर्चा') === selectedTopic);

  feed.className = 'space-y-3 bg-[#EFEAE2] p-3 sm:p-4 rounded-2xl border border-stone-300 max-h-[65vh] overflow-y-auto';
  feed.innerHTML = '';

  if (filtered.length === 0) {
    feed.innerHTML = `<div class="text-center py-8 text-xs text-stone-600 bg-white/80 rounded-xl">इस विषय पर अभी कोई संदेश नहीं है। नीचे बॉक्स से पहला संदेश भेजें!</div>`;
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
    const initial = (p.author || 'स').trim().charAt(0).toUpperCase();

    const pranamCnt = p.reactions?.pranam || 0;
    const natureCnt = p.reactions?.nature || 0;
    const heartCnt = p.reactions?.heart || 0;

    const row = document.createElement('div');
    row.className = `flex items-start gap-2.5 ${isMyPost ? 'flex-row-reverse' : ''}`;
    row.innerHTML = `
      <!-- Avatar Circle -->
      <div class="w-8 h-8 rounded-full ${p.isOwner ? 'bg-amber-500 text-stone-950' : (isMyPost ? 'bg-forest text-white' : 'bg-stone-700 text-white')} flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
        ${p.isOwner ? '🛡️' : initial}
      </div>

      <!-- WhatsApp/Telegram Style Message Bubble -->
      <div class="max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm border ${p.isOwner ? 'bg-amber-50 border-amber-300' : (isMyPost ? 'bg-[#D9FDD3] border-emerald-300' : 'bg-white border-stone-200')} space-y-1.5">
        <div class="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-extrabold text-forest">${p.author}</span>
            ${p.isOwner ? `<span class="px-1.5 py-0.2 bg-amber-300 text-stone-950 rounded text-[10px] font-extrabold">व्यवस्थापक</span>` : ''}
            <span class="px-1.5 py-0.2 bg-black/5 text-stone-600 rounded text-[10px]">${p.topic || 'सामान्य चर्चा'}</span>
          </div>
          <span class="text-[10px] text-stone-400">${dateStr} ${timeStr}</span>
        </div>

        ${p.replyTo ? `
          <div class="p-1.5 rounded-lg bg-black/5 border-l-4 border-forest text-[11px] text-stone-700">
            <span class="font-bold text-forest">${p.replyTo.author}:</span> ${p.replyTo.snippet}
          </div>
        ` : ''}

        <p class="text-xs sm:text-sm text-stone-900 whitespace-pre-wrap leading-relaxed break-words">${p.content}</p>

        <div class="pt-1 border-t border-black/5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div class="flex items-center gap-1">
            <button onclick="reactToPost('${p.id}', 'pranam')" class="px-2 py-0.5 rounded-full bg-white/80 hover:bg-amber-100 border border-stone-200">🙏 ${pranamCnt || ''}</button>
            <button onclick="reactToPost('${p.id}', 'nature')" class="px-2 py-0.5 rounded-full bg-white/80 hover:bg-emerald-100 border border-stone-200">🌿 ${natureCnt || ''}</button>
            <button onclick="reactToPost('${p.id}', 'heart')" class="px-2 py-0.5 rounded-full bg-white/80 hover:bg-rose-100 border border-stone-200">❤️ ${heartCnt || ''}</button>
          </div>

          <div class="flex items-center gap-2 font-semibold">
            <button onclick="setChatReply('${p.id}', '${safeAuthor}', '${safeContent}')" class="text-forest hover:underline">उत्तर दें</button>
            <button onclick="sharePostWhatsApp('${safeAuthor}', '${safeContent}')" class="text-emerald-800 hover:underline">साझा</button>
            ${isVerifiedOwner ? `<button onclick="pinChatMessage('${safeAuthor}', '${safeContent}')" class="text-amber-800 font-bold hover:underline">पिन</button>` : ''}
            ${isVerifiedOwner && !p.isOwner ? `<button onclick="blockUserFromChat('${p.phone}', '${safeAuthor}')" class="text-orange-700 font-bold hover:underline">ब्लॉक</button>` : ''}
            ${canDelete ? `<button onclick="confirmDeletePost('${p.id}')" class="text-red-600 font-bold hover:underline">हटाएं</button>` : ''}
          </div>
        </div>
      </div>
    `;
    feed.appendChild(row);
  });
}

function confirmDeletePost(id) {
  openConfirmModal("संदेश हटाएं?", "क्या आप इस संदेश को हटाना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('posts').doc(id).delete();
      showToast('संदेश हटा दिया गया।');
    }
  });
}

// 19. PAGE-BY-PAGE HORIZONTAL PDF READER & CARD-1 STYLE LIBRARY
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

  if (jumpInp) { jumpInp.max = totalPdfPages; jumpInp.value = pageNum; }
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
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen().catch(() => {});
      if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape').catch(() => {});
      showToast("लैंडस्केप (आड़ा मोड) सक्रिय!");
    } else {
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
      if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen().catch(() => {});
    }
  } catch (e) {}
  if (activePdfDoc) renderSinglePdfPage(currentPdfPage);
}

function updateLandscapeButtonLabel() {
  const txt = document.getElementById('landscapeBtnText');
  if (txt) txt.innerText = isPdfLandscape ? '🔄 पोर्ट्रेट (सीधा मोड)' : '🔄 लैंडस्केप (आड़ा मोड)';
}

function closeInbuiltPdfViewer() {
  activePdfDoc = null;
  if (screen.orientation && screen.orientation.unlock) { try { screen.orientation.unlock(); } catch (e) {} }
  if (document.fullscreenElement && document.exitFullscreen) { try { document.exitFullscreen(); } catch (e) {} }
  const modal = document.getElementById('inbuiltPdfModal');
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
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
            <button onclick="openInbuiltPdfViewer('${defTitle.replace(/'/g, "\\'")}', '${defLink}')" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold rounded-lg shadow-sm">
              📖 ऐप में पढ़ें
            </button>
            <a href="${defLink}" download class="inline-block px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg">
              डाउनलोड
            </a>
          </div>
          <div class="flex items-center gap-2.5">
            <button onclick="sharePdfWhatsApp('${defTitle.replace(/'/g, "\\'")}', '${defLink}')" class="text-emerald-700 text-xs font-bold">साझा करें</button>
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
            <button onclick="openInbuiltPdfViewer('${safeTitle}', '${safeLink}')" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold rounded-lg shadow-sm">
              📖 ऐप में पढ़ें
            </button>
            <a href="${item.link}" target="_blank" download class="inline-block px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg">
              डाउनलोड
            </a>
          </div>
          <div class="flex items-center gap-2.5">
            <button onclick="sharePdfWhatsApp('${safeTitle}', '${safeLink}')" class="text-emerald-700 text-xs font-bold">साझा करें</button>
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
  const newTag = prompt("ऊपरी टैग:", localStorage.getItem('def_pdf_tag') || 'पवित्र ग्रंथ');
  if (newTag === null) return;
  const newTitle = prompt("पुस्तक का नाम:", localStorage.getItem('def_pdf_title') || 'श्री सबदवाणी (१२० शब्द)');
  if (!newTitle) return;
  const newDesc = prompt("छोटा विवरण:", localStorage.getItem('def_pdf_desc') || 'गुरु जम्भेश्वर भगवान द्वारा उच्चरित पावन वाणी।');
  const newLink = prompt("PDF लिंक:", localStorage.getItem('def_pdf_link') || './shabadwani.pdf');

  localStorage.setItem('def_pdf_tag', newTag.trim());
  localStorage.setItem('def_pdf_title', newTitle.trim());
  localStorage.setItem('def_pdf_desc', (newDesc || '').trim());
  localStorage.setItem('def_pdf_link', (newLink || './shabadwani.pdf').trim());
  listenPdfs();
  showToast("प्रथम PDF कार्ड अपडेट हो गया!");
}

function deleteDefaultPdfCard() {
  if (!currentUser || !currentUser.isOwner) return;
  openConfirmModal("प्रथम PDF हटाएं?", "क्या आप प्रथम 'श्री सबदवाणी' कार्ड को हटाना चाहते हैं?", (res) => {
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
  await db.collection('pdfs').doc(id).update({ tag: tag.trim(), title: title.trim(), desc: (desc || '').trim() });
  showToast("PDF कार्ड अपडेट हो गया!");
}

function sharePdfWhatsApp(title, link) {
  const url = link.startsWith('./') ? window.location.origin + '/' + link.replace('./','') : link;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`📖 ${title}:${url}`)}`, '_blank');
}

async function saveAdminPdf() {
  if (!currentUser || !currentUser.isOwner) return;
  const tag = document.getElementById('adminPdfTag')?.value.trim() || 'पवित्र ग्रंथ';
  const title = document.getElementById('adminPdfTitle').value.trim();
  const desc = document.getElementById('adminPdfDesc')?.value.trim() || 'गुरु जम्भेश्वर भगवान की पावन शिक्षाएं एवं साहित्य।';
  const link = document.getElementById('adminPdfLink').value.trim();
  if (!title || !link) return showToast('नाम और लिंक दर्ज करें');

  await db.collection('pdfs').add({ tag, title, desc, link, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  showToast('PDF साहित्य जोड़ा गया!');
  if (document.getElementById('adminPdfTag')) document.getElementById('adminPdfTag').value = '';
  document.getElementById('adminPdfTitle').value = '';
  if (document.getElementById('adminPdfDesc')) document.getElementById('adminPdfDesc').value = '';
  document.getElementById('adminPdfLink').value = '';
}

function confirmDeletePdf(id) {
  openConfirmModal("PDF हटाएं?", "क्या आप इस साहित्य को हटाना चाहते हैं?", async (res) => {
    if (res) { await db.collection('pdfs').doc(id).delete(); showToast('PDF हटा दी गई।'); }
  });
}

// 20. AUDIO LISTENERS & ADMIN TRACK MANAGER
function listenAudios() {
  db.collection('audios').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const adminList = document.getElementById('adminAudioManageList');
    if (adminList) adminList.innerHTML = '';

    if (!snap.empty) {
      audioPlaylist = [];
      snap.forEach(doc => {
        const a = doc.data();
        audioPlaylist.push({ id: doc.id, title: a.title, link: a.link });
        if (adminList) {
          adminList.innerHTML += `
            <div class="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200">
              <span class="font-semibold text-stone-800 truncate">${a.title}</span>
              <button onclick="deleteAdminAudio('${doc.id}')" class="text-red-600 font-bold shrink-0 ml-2">हटाएं</button>
            </div>
          `;
        }
      });
      currentTrackIndex = 0;
      const source = document.getElementById('audioSource');
      const player = document.getElementById('audioPlayer');
      if (source && player && audioPlaylist[0]) {
        source.src = audioPlaylist[0].link;
        player.load();
      }
      renderCustomMusicDropdown();
    } else {
      renderCustomMusicDropdown();
    }
  });
}

async function deleteAdminAudio(id) {
  if (!currentUser || !currentUser.isOwner) return;
  openConfirmModal("भजन हटाएं?", "क्या आप इस भजन को हटाना चाहते हैं?", async (res) => {
    if (res) { await db.collection('audios').doc(id).delete(); showToast("भजन हटाया गया।"); }
  });
}

function changeAudioTrack() {
  selectCustomTrackByIndex(0);
}

async function saveAdminAudio() {
  if (!currentUser || !currentUser.isOwner) return;
  const title = document.getElementById('adminAudioTitle').value.trim();
  const link = document.getElementById('adminAudioLink').value.trim();
  if (!title || !link) return showToast('नाम और लिंक भरें');
  await db.collection('audios').add({ title, link, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  showToast('भजन प्लेयर में जोड़ा गया!');
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

// 21. TREE PLEDGE & BANNER
function listenTreeCounter() {
  db.collection('stats').doc('treePledges').onSnapshot(doc => {
    if (doc.exists && doc.data().count) {
      document.getElementById('treeCounterDisplay').innerText = doc.data().count;
    }
  });
}

async function pledgeTree() {
  if (localStorage.getItem('has_pledged_tree')) return showToast("आपका संकल्प पहले से दर्ज है। साधुवाद!");
  const display = document.getElementById('treeCounterDisplay');
  let nextVal = (parseInt(display.innerText) || 1485) + 1;
  display.innerText = nextVal;
  localStorage.setItem('has_pledged_tree', 'true');
  showToast("प्रकृति रक्षा संकल्प दर्ज हुआ!");
  try { await db.collection('stats').doc('treePledges').set({ count: nextVal }, { merge: true }); } catch (e) {}
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
  if (!currentUser || !currentUser.isOwner) return;
  const txt = document.getElementById('adminBannerInput').value.trim();
  if (!txt) return;
  await db.collection('settings').doc('dailySandesh').set({ text: txt });
  showToast('दैनिक संदेश अपडेट हुआ!');
  document.getElementById('adminBannerInput').value = '';
}

function shareBannerWhatsApp() {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🌿 पावन संदेश:\n${currentBannerText}\n${window.location.href}`)}`, '_blank');
}

function shareNiyamWhatsApp(num, title, rule, desc) {
  markNiyamAsRead(num);
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🌿 नियम ${num} -${title}\n"${rule}"\nअर्थ: ${desc}`)}`, '_blank');
}

function sharePostWhatsApp(author, content) {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`💬 समाज संवाद (${author}):\n"${content}"`)}`, '_blank');
}

// 22. PURE 29 NIYAMS RENDER (NO EXTRA CATEGORY CHIPS)
function markNiyamAsRead(num) {
  readNiyamsSet.add(num);
  localStorage.setItem('bishnoi_read_niyams', JSON.stringify(Array.from(readNiyamsSet)));
  updateProgressIndicators();
}

function listenCustomNiyams() {
  // Remove any leftover category filter bar if present
  document.getElementById('niyamCategoryBar')?.remove();
  db.collection('settings').doc('customNiyams').onSnapshot(doc => {
    if (doc.exists && Array.isArray(doc.data().list)) {
      niyamsList = doc.data().list;
    }
    renderNiyams(niyamsList);
  });
}

function renderNiyams(data) {
  const grid = document.getElementById('niyamGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);

  data.forEach(n => {
    const safeTitle = (n.title || '').replace(/'/g, "\\'");
    const safeRule = (n.rule || '').replace(/'/g, "\\'");
    const safeDesc = (n.desc || '').replace(/'/g, "\\'");
    const isRead = readNiyamsSet.has(n.num);

    const card = document.createElement('div');
    card.onclick = () => markNiyamAsRead(n.num);
    card.className = `bg-white p-4 rounded-xl border ${isRead ? 'border-emerald-300 bg-emerald-50/15' : 'border-stone-200'} space-y-2 flex flex-col justify-between shadow-sm hover:border-forest transition cursor-pointer`;
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
  const newTitle = prompt(`नियम ${num} का शीर्षक:`, item.title);
  if (newTitle === null) return;
  const newRule = prompt(`नियम ${num} की मूल वाणी:`, item.rule);
  if (newRule === null) return;
  const newDesc = prompt(`नियम ${num} का अर्थ:`, item.desc);
  if (newDesc === null) return;

  niyamsList[idx] = { ...item, title: newTitle.trim() || item.title, rule: newRule.trim() || item.rule, desc: newDesc.trim() || item.desc };
  await db.collection('settings').doc('customNiyams').set({ list: niyamsList });
  showToast(`नियम ${num} अपडेट हो गया!`);
}

function filterNiyams() {
  const q = (document.getElementById('niyamSearch')?.value || '').toLowerCase();
  renderNiyams(niyamsList.filter(n =>
    n.rule.toLowerCase().includes(q) ||
    n.desc.toLowerCase().includes(q) ||
    n.title.toLowerCase().includes(q)
  ));
}

// 23. HISTORY & KIDS CORNER
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
            <span class="px-2.5 py-0.5 bg-emerald-50 text-forest border border-emerald-200 rounded-full text-xs font-bold">${item.badge || 'इतिहास अध्याय'}</span>
            <div class="flex items-center gap-2 text-xs">
              <button onclick="speakKidsStory('${safeSpeech}')" class="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-forest rounded-lg font-semibold">🔊 सुनें</button>
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
          ${item.moral ? `<div class="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs font-semibold text-amber-900">${item.moral}</div>` : ''}
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
              <span class="px-3 py-1 bg-amber-400 text-stone-950 rounded-full text-xs font-extrabold">${item.badge || '🧸 बाल कहानी'}</span>
              <button onclick="speakKidsStory('${safeSpeech}')" class="px-2.5 py-1 bg-forest text-white rounded-full text-xs font-bold">🔊 कहानी सुनें</button>
            </div>
            <h3 class="font-yatra text-lg text-forest pt-1">${item.title}</h3>
            <p id="story_txt_${item.id}" class="line-clamp-2 text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">${item.content}</p>
            <button id="story_btn_${item.id}" onclick="toggleStoryReadMore('${item.id}')" class="text-xs font-bold text-forest hover:underline">
              पूरा पढ़ें (Read More) ↓
            </button>
          </div>
          <div class="space-y-2 pt-2">
            ${item.moral ? `<div class="p-3 rounded-xl bg-emerald-900 text-amber-200 text-xs font-bold">${item.moral}</div>` : ''}
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
  if (!('speechSynthesis' in window)) return showToast("ऑडियो स्टोरी उपलब्ध नहीं है।");
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
  if (!currentUser || !currentUser.isOwner) return;
  const type = document.getElementById('adminHistType')?.value || 'history';
  const badge = document.getElementById('adminHistBadge')?.value.trim() || (type === 'kids' ? '🧸 बाल कहानी' : 'इतिहास अध्याय');
  const title = document.getElementById('adminHistTitle')?.value.trim() || '';
  const content = document.getElementById('adminHistContent')?.value.trim() || '';
  const moral = document.getElementById('adminHistMoral')?.value.trim() || '';
  if (!title || !content) return showToast("शीर्षक और विवरण दोनों लिखें!");

  historyItemsList.unshift({ id: 'item_' + Date.now(), type, badge, title, content, moral });
  await db.collection('settings').doc('customHistoryKids').set({ items: historyItemsList });
  document.getElementById('adminHistTitle').value = '';
  document.getElementById('adminHistContent').value = '';
  document.getElementById('adminHistMoral').value = '';
  showToast("नया अध्याय प्रकाशित हो गया!");
}

async function editHistoryOrKidsItem(id) {
  if (!currentUser || !currentUser.isOwner) return;
  const idx = historyItemsList.findIndex(x => x.id === id);
  if (idx === -1) return;
  const item = historyItemsList[idx];
  const newTitle = prompt("शीर्षक बदलें:", item.title);
  if (newTitle === null) return;
  const newContent = prompt("विवरण बदलें:", item.content);
  if (newContent === null) return;
  const newMoral = prompt("मुख्य सीख बदलें:", item.moral || '');

  historyItemsList[idx] = { ...item, title: newTitle.trim() || item.title, content: newContent.trim() || item.content, moral: (newMoral || '').trim() };
  await db.collection('settings').doc('customHistoryKids').set({ items: historyItemsList });
  showToast("जानकारी अपडेट हो गई!");
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
  } else if (q.includes('mala') || q.includes('माला') || q.includes('मंत्र')) {
    switchTab('mala');
  } else if (q.includes('pdf') || q.includes('सबद') || q.includes('साहित्य')) {
    switchTab('library');
  } else if (q.includes('quiz') || q.includes('परीक्षा')) {
    switchTab('quiz');
  } else if (q.includes('संवाद') || q.includes('मंच')) {
    switchTab('community');
  } else if (q.includes('इतिहास') || q.includes('बाल') || q.includes('खेजड़ली')) {
    switchTab('history');
  }
}
