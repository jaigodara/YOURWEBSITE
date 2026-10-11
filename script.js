/* ==========================================================================
   Bishnoi Community Portal - Ultimate Clean Standard Master Engine (script.js)
   - PW / Amazon / Jio Style Bottom Navigation (Last section: Profile with Owner Studio)
   - Custom Modern Audio Player Bar for Bhajans & Aarti
   - Page-by-Page Horizontal Book PDF Reader + Landscape Mode
   - Strict Hidden Admin Controls (Only visible inside Profile for Owner)
   - Authentic 29 Niyams Reader with Read Progress & Share
   - Secure Owner Login (9306894518 / bishnoi29) + 1-Click Google Login
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
let currentBannerText = '"जीव दया पालणी, रूंख लीलो नी घावै" — प्रकृति एवं सभी मूक जीवों के प्रति करुणा रखें। तालिका एवं आचार संहिता।';
let currentActiveTab = 'home';

// Samvad Manch State
let allChatPosts = [];
let activeReplyObj = null;

// PDF Reader State
let activePdfDoc = null;
let currentPdfPage = 1;
let totalPdfPages = 1;
let isPdfLandscape = false;
let currentPdfUrl = '';
let touchStartX = 0;

// Audio Player State
let isCustomPlaying = false;

// Maintenance State
let maintenanceConfig = {
  globalMode: 'off',
  message: 'हम आपके अनुभव को बेहतर बनाने के लिए ऐप को अपडेट कर रहे हैं। कृपया कुछ समय बाद पुनः प्रयास करें।',
  sections: { mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off' }
};

// Progress State
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
  { num: 8, title: "पानी छानना", rule: "पाणी छान पीवणा", desc: "सूक्ष्म जीवों की रक्षा व स्वास्थ्य के लिए पानी सदा छानकर पियें।" },
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
  { id: 'hist_1', type: 'history', badge: 'इतिहास अध्याय • १७३० ई.', title: 'खेजड़ली का अमर बलिदान — ३६३ हुतात्माओं की गौरवगाथा', content: 'सन् १७३० (विक्रम संवत १७८७, भाद्रपद शुक्ल दशमी) को जोधपुर के खेजड़ली गाँव में माता अमृता देवी बिश्नोई और उनकी तीन पुत्रियों सहित ३६३ बिश्नोई वीरों व वीरांगनाओं ने हरे खेजड़ी वृक्षों की रक्षा के लिए अपने प्राणों की आहुति दे दी।' },
  { id: 'hist_2', type: 'history', badge: 'पंथ स्थापना • १४८५ ई.', title: 'समराथल धोरा — बिश्नोई पंथ एवं २९ नियमों का प्रवर्तन', content: 'गुरु जम्भेश्वर भगवान ने विक्रम संवत १५४२ (सन् १४८५) में कार्तिक वदी अष्टमी को समराथल धोरे पर पाहल बनाकर २९ नियमों के साथ बिश्नोई पंथ की स्थापना की।' },
  { id: 'kids_1', type: 'kids', badge: 'बाल कहानी', title: 'नन्हे हिरण का सच्चा मित्र', content: 'थार के रेगिस्तान में एक नन्हे चिंकारा की बालक सोहन ने पानी पिलाकर और अपनी माँ के साथ मिलकर जान बचाई।' }
];

// 5. STYLES & PW/AMAZON/JIO STYLE BOTTOM NAVIGATION
function injectCleanLayoutStyles() {
  let styleEl = document.getElementById('cleanPortalFixStyles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'cleanPortalFixStyles';
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `
    html, body { max-width: 100vw; overflow-x: hidden; padding-bottom: 72px; background-color: #FAF7EE; font-family: sans-serif; }
    header > div, nav > div { flex-wrap: wrap !important; gap: 6px !important; }
    #authActionsContainer { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `;
}

function upgradeHomepageToCleanLayout() {
  const homeTab = document.getElementById('tab-home');
  if (!homeTab || document.getElementById('cleanHeroLandingSection')) return;

  const heroWrap = document.createElement('div');
  heroWrap.id = 'cleanHeroLandingSection';
  heroWrap.className = 'space-y-4 mb-4';
  heroWrap.innerHTML = `
    <div class="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-2">
      <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-forest border border-emerald-300">
        विश्नोई समाज डिजिटल मंच • आधिकारिक ऐप
      </span>
      <h1 class="font-yatra text-xl sm:text-2xl text-forest">गुरु जम्भेश्वर भगवान के २९ नियम एवं सबदवाणी ज्ञान कोष</h1>
      <p class="text-xs sm:text-sm text-stone-600 leading-relaxed">
        पर्यावरण रक्षा, जीव दया और सदाचार की पावन जीवन-पद्धति को सरल हिंदी में पढ़ें, सुनें और अपने दैनिक जीवन में अपनाएं।
      </p>
    </div>
  `;
  homeTab.insertBefore(heroWrap, homeTab.firstChild);
}

function updateProgressIndicators() {
  const nEl = document.getElementById('progNiyamsCount');
  const qEl = document.getElementById('progQuizScore');
  const mEl = document.getElementById('progMalaLaps');
  if (nEl) nEl.innerText = `${readNiyamsSet.size}/29`;
  if (qEl) qEl.innerText = `${bestQuizPct}%`;
  if (mEl) mEl.innerText = `${malaLapsCount}`;
}

// PW / Amazon / Jio Style Bottom Navigation (Last section: Profile)
function injectMobileBottomNavBar() {
  if (document.getElementById('standardMobileBottomNav')) return;
  const bottomNav = document.createElement('div');
  bottomNav.id = 'standardMobileBottomNav';
  bottomNav.className = 'fixed bottom-0 left-0 right-0 z-[95] bg-white border-t border-stone-200 shadow-xl flex sm:hidden items-center justify-around py-2 px-1 text-xs font-semibold text-stone-700';
  bottomNav.innerHTML = `
    <button onclick="switchTab('home')" id="bnav-home" class="flex flex-col items-center gap-0.5 py-1 px-3 text-forest font-bold"><span>🏠 मुखपृष्ठ</span></button>
    <button onclick="switchTab('niyams')" id="bnav-niyams" class="flex flex-col items-center gap-0.5 py-1 px-3 text-stone-600"><span>📜 नियम</span></button>
    <button onclick="switchTab('library')" id="bnav-library" class="flex flex-col items-center gap-0.5 py-1 px-3 text-stone-600"><span>📚 साहित्य</span></button>
    <button onclick="switchTab('quiz')" id="bnav-quiz" class="flex flex-col items-center gap-0.5 py-1 px-3 text-stone-600"><span>🏆 परीक्षा</span></button>
    <button onclick="openProfileModal()" id="bnav-profile" class="flex flex-col items-center gap-0.5 py-1 px-3 text-stone-600"><span>👤 प्रोफ़ाइल</span></button>
  `;
  document.body.appendChild(bottomNav);
}

// 6. INITIALIZATION & CLEAN AUDIO BAR
function injectDynamicModalsAndUI() {
  injectCleanLayoutStyles();
  upgradeHomepageToCleanLayout();
  injectMobileBottomNavBar();

  const nativeAudio = document.getElementById('audioPlayer');
  const nativeSelect = document.getElementById('audioTrackSelect');
  if (nativeAudio && !document.getElementById('cleanCustomAudioBox')) {
    const parentBox = nativeAudio.parentElement;
    nativeAudio.classList.add('hidden');
    nativeSelect?.classList.add('hidden');

    const customAudioBar = document.createElement('div');
    customAudioBar.id = 'cleanCustomAudioBox';
    customAudioBar.className = 'bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3';
    customAudioBar.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🎵</span>
          <div>
            <h4 id="customAudioTitle" class="font-yatra text-base text-forest">श्री जम्भेश्वर आरती एवं भजन</h4>
            <p class="text-[11px] text-stone-500">पवित्र वाणी व आरती का श्रवण करें</p>
          </div>
        </div>
        <select id="customTrackSelector" onchange="switchCustomAudioTrack(this.value)" class="p-2 text-xs rounded-lg border border-stone-300 bg-stone-50 font-semibold text-stone-700 max-w-[160px] truncate">
          <option value="./bhajan1.mp3">श्री जम्भेश्वर भजन</option>
        </select>
      </div>
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <button onclick="toggleCustomAudioPlay()" id="customPlayPauseBtn" class="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center font-bold text-base shadow">
            ▶
          </button>
          <input type="range" id="customAudioSeek" value="0" min="0" max="100" oninput="seekCustomAudio(this.value)" class="flex-1 h-2 bg-stone-200 rounded-lg cursor-pointer accent-forest">
          <span id="customTimeDisplay" class="text-xs font-mono text-stone-500">0:00</span>
        </div>
      </div>
    `;
    parentBox.appendChild(customAudioBar);

    nativeAudio.addEventListener('timeupdate', () => {
      const seek = document.getElementById('customAudioSeek');
      const timeLbl = document.getElementById('customTimeDisplay');
      if (nativeAudio.duration && seek) {
        seek.value = (nativeAudio.currentTime / nativeAudio.duration) * 100;
        if (timeLbl) timeLbl.innerText = formatSec(nativeAudio.currentTime);
      }
    });
    nativeAudio.addEventListener('ended', () => {
      isCustomPlaying = false;
      document.getElementById('customPlayPauseBtn').innerText = '▶';
    });
  }

  if (!window.pdfjsLib) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script);
  }

  // PDF Modal
  if (!document.getElementById('inbuiltPdfModal')) {
    const pdfModal = document.createElement('div');
    pdfModal.id = 'inbuiltPdfModal';
    pdfModal.className = 'fixed inset-0 z-[9990] bg-stone-950 hidden flex-col select-none';
    pdfModal.innerHTML = `
      <div class="bg-[#143622] text-white px-3 py-2.5 flex items-center justify-between gap-2 border-b border-amber-500/40 shadow-md shrink-0">
        <h3 id="pdfViewerTitle" class="font-yatra text-sm sm:text-base text-amber-300 truncate">साहित्य पाठक</h3>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="togglePdfLandscapeMode()" class="px-2.5 py-1.5 bg-amber-500 text-stone-950 rounded-lg text-xs font-extrabold"><span id="landscapeBtnText">लैंडस्केप (आड़ा मोड)</span></button>
          <a id="pdfModalDownloadBtn" href="#" download class="px-2.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold">डाउनलोड</a>
          <button onclick="closeInbuiltPdfViewer()" class="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-extrabold">✕ बंद करें</button>
        </div>
      </div>
      <div id="pdfSinglePageViewport" class="flex-1 overflow-auto flex items-center justify-center p-2 bg-stone-900 relative" style="touch-action: pan-x pan-y pinch-zoom;">
        <div id="pdfLoadingSpinner" class="text-amber-300 text-sm font-bold animate-pulse">पृष्ठ खुल रहा है...</div>
        <canvas id="pdfSinglePageCanvas" class="bg-white rounded shadow-2xl max-w-full h-auto hidden"></canvas>
        <iframe id="pdfDriveFallbackFrame" class="hidden w-full h-full border-0 bg-white rounded"></iframe>
      </div>
      <div id="pdfBottomNavBar" class="bg-[#143622] text-white px-4 py-2.5 border-t border-amber-500/30 flex items-center justify-between gap-3 shrink-0">
        <button onclick="changePdfPage(-1)" class="px-4 py-2 bg-amber-500 text-stone-950 font-extrabold text-xs rounded-xl">← पिछला पन्ना</button>
        <div class="flex items-center gap-1.5 text-xs font-bold">
          <span>पृष्ठ</span>
          <input type="number" id="pdfPageJumpInput" min="1" value="1" onchange="jumpToPdfPage(this.value)" class="w-14 text-center py-1 rounded bg-stone-800 text-amber-300 font-extrabold">
          <span id="pdfTotalPagesLabel">/ 1</span>
        </div>
        <button onclick="changePdfPage(1)" class="px-4 py-2 bg-amber-500 text-stone-950 font-extrabold text-xs rounded-xl">अगला पन्ना →</button>
      </div>
    `;
    document.body.appendChild(pdfModal);
  }

  // Profile Modal (With Owner Studio Section Inside)
  if (!document.getElementById('userProfileModal')) {
    const profModal = document.createElement('div');
    profModal.id = 'userProfileModal';
    profModal.className = 'fixed inset-0 z-[9980] bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4 overflow-y-auto';
    profModal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 border border-stone-200 shadow-2xl my-auto">
        <div class="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 class="font-yatra text-lg text-forest">मेरी प्रोफ़ाइल एवं सेटिंग्स (Profile & Studio)</h3>
          <button onclick="closeProfileModal()" class="text-stone-400 font-bold text-lg">✕</button>
        </div>
        <div class="space-y-3 text-xs">
          <div>
            <label class="font-bold text-stone-700 block mb-1">आपका नाम:</label>
            <input type="text" id="profEditName" class="w-full p-2.5 rounded-lg border border-stone-300 font-semibold" placeholder="अपना नाम लिखें">
          </div>
          <div>
            <label class="font-bold text-stone-700 block mb-1">गाँव / ज़िला:</label>
            <input type="text" id="profEditLocation" class="w-full p-2.5 rounded-lg border border-stone-300" placeholder="उदा: हिसार, हरियाणा">
          </div>
          <div id="ownerStudioSectionModal" class="hidden pt-3 border-t border-dashed border-amber-300 space-y-2 bg-amber-50/50 p-3 rounded-xl">
            <h4 class="font-yatra text-sm text-amber-900 flex items-center gap-1">🛡️ व्यवस्थापक स्टूडियो (Owner Studio)</h4>
            <p class="text-[11px] text-stone-600">आप मुख्य व्यवस्थापक हैं। यहाँ से सीधे प्रबंध कक्ष (Admin Hub) में जा सकते हैं:</p>
            <button onclick="closeProfileModal(); switchTab('admin');" class="w-full py-2 bg-terracotta hover:bg-orange-800 text-white font-bold rounded-lg shadow text-xs">
              प्रबंधक कक्ष (Admin Dashboard) खोलें →
            </button>
          </div>
        </div>
        <div class="flex gap-2 pt-3 border-t border-stone-100">
          <button onclick="saveUserProfileChanges()" class="flex-1 py-2.5 bg-forest text-white font-bold text-xs rounded-lg shadow">प्रोफ़ाइल सहेजें</button>
          <button onclick="closeProfileModal()" class="px-4 py-2.5 bg-stone-100 text-stone-700 font-semibold text-xs rounded-lg">बंद करें</button>
        </div>
      </div>
    `;
    document.body.appendChild(profModal);
  }
}

function formatSec(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function toggleCustomAudioPlay() {
  const audio = document.getElementById('audioPlayer');
  const btn = document.getElementById('customPlayPauseBtn');
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    btn.innerText = '⏸';
    isCustomPlaying = true;
  } else {
    audio.pause();
    btn.innerText = '▶';
    isCustomPlaying = false;
  }
}

function seekCustomAudio(val) {
  const audio = document.getElementById('audioPlayer');
  if (audio && audio.duration) {
    audio.currentTime = (val / 100) * audio.duration;
  }
}

function switchCustomAudioTrack(url) {
  const audio = document.getElementById('audioPlayer');
  const source = document.getElementById('audioSource');
  if (audio && source) {
    source.src = url;
    audio.load();
    audio.play().catch(() => {});
    document.getElementById('customPlayPauseBtn').innerText = '⏸';
  }
}

// PDF Reader Logic
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
    driveFrame.src = link.startsWith('http') ? link : (window.location.origin + '/' + link.replace(/^\.\//, ''));
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

  canvas.style.width = isPdfLandscape ? '96vw' : 'auto';
  canvas.style.maxHeight = isPdfLandscape ? 'none' : '78vh';

  await page.render({ canvasContext: ctx, viewport: viewport }).promise;
  spinner.classList.add('hidden');
  canvas.classList.remove('hidden');

  if (jumpInp) { jumpInp.max = totalPdfPages; jumpInp.value = pageNum; }
  if (totalLbl) totalLbl.innerText = `/ ${totalPdfPages}`;
  if (prevBtn) prevBtn.disabled = (pageNum <= 1);
  if (nextBtn) nextBtn.disabled = (pageNum >= totalPdfPages);
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
  if (activePdfDoc) renderSinglePdfPage(currentPdfPage);
}

function closeInbuiltPdfViewer() {
  activePdfDoc = null;
  const modal = document.getElementById('inbuiltPdfModal');
  if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

// Toasts & Navigation
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

window.addEventListener('DOMContentLoaded', () => {
  injectDynamicModalsAndUI();
  updateNavAuth();
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
  renderMalaCounters();
  updateProgressIndicators();
});

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
    if (bnav) bnav.className = 'flex flex-col items-center gap-0.5 py-1 px-3 text-stone-600';
  });

  const target = document.getElementById(`tab-${id}`);
  const activeNav = document.getElementById(`nav-${id}`);
  if (target) { target.classList.remove('hidden'); target.classList.add('view-panel'); }
  if (activeNav) activeNav.classList.add('nav-btn-active');

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

// Authentication & Profile
function openAuthModal() { document.getElementById('authModal').classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('authModal').classList.add('hidden'); }

async function handleAuthSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('loginPhone').value.trim();
  const pass = document.getElementById('loginPass').value.trim();

  if (phone === OWNER_PHONE && pass === OWNER_PASS) {
    currentUser = { name: "व्यवस्थापक (Owner)", phone: OWNER_PHONE, isOwner: true, location: "मुख्यालय" };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    closeAuthModal();
    showToast("व्यवस्थापक के रूप में स्वागत है!");
    switchTab('admin');
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया सही १० अंकों का मोबाइल नंबर दर्ज करें!");

  try {
    const userDoc = await db.collection('users').doc(phone).get();
    if (!userDoc.exists) return showToast("नंबर पंजीकृत नहीं है! कृपया पहले Register करें।");
    const userData = userDoc.data();
    if (userData.pass && userData.pass !== pass) return showToast("गलत पासवर्ड!");

    currentUser = { name: userData.name || "सदस्य", phone: phone, isOwner: false, email: userData.email || "" };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
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

    const docId = `google_${gUser.uid.substring(0, 10)}`;
    currentUser = { name: gUser.displayName || "सदस्य", phone: docId, email: gUser.email, isOwner: false };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    closeAuthModal();
    showToast(`Google लॉगिन सफल! स्वागत है, ${currentUser.name}`);
  } catch (err) {
    showToast("Google लॉगिन त्रुटि: " + err.message);
  }
}

function openProfileModal() {
  if (!currentUser) return openAuthModal();
  document.getElementById('profEditName').value = currentUser.name || '';
  document.getElementById('profEditLocation').value = currentUser.location || '';
  
  const studioSec = document.getElementById('ownerStudioSectionModal');
  if (studioSec) {
    studioSec.classList.toggle('hidden', !(currentUser && currentUser.isOwner === true));
  }

  document.getElementById('userProfileModal').classList.remove('hidden');
  document.getElementById('userProfileModal').classList.add('flex');
}

function closeProfileModal() {
  document.getElementById('userProfileModal').classList.add('hidden');
  document.getElementById('userProfileModal').classList.remove('flex');
}

async function saveUserProfileChanges() {
  if (!currentUser) return;
  const newName = document.getElementById('profEditName').value.trim();
  const newLoc = document.getElementById('profEditLocation').value.trim();
  if (!newName) return showToast("नाम खाली न छोड़ें!");
  currentUser.name = newName;
  currentUser.location = newLoc;
  localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
  updateNavAuth();
  closeProfileModal();
  showToast("प्रोफ़ाइल अपडेट हो गई!");
}

function logoutUser() {
  localStorage.removeItem('bishnoi_secure_user');
  currentUser = null;
  updateNavAuth();
  switchTab('home');
  showToast("लॉगआउट किया गया।");
}

function updateNavAuth() {
  const container = document.getElementById('authActionsContainer');
  const adminNav = document.getElementById('nav-admin');
  const adminNavMob = document.getElementById('nav-admin-mobile');
  const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);

  if (currentUser) {
    container.innerHTML = `
      <button onclick="openProfileModal()" class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-forest border border-stone-300">
        ${currentUser.name} प्रोफ़ाइल
      </button>
      <button onclick="logoutUser()" class="text-xs text-stone-600 font-bold px-2 py-1 rounded bg-stone-100">लॉगआउट</button>
    `;
    if (isVerifiedOwner) {
      if (adminNav) adminNav.classList.remove('hidden');
      if (adminNavMob) adminNavMob.classList.remove('hidden');
    } else {
      if (adminNav) adminNav.classList.add('hidden');
      if (adminNavMob) adminNavMob.classList.add('hidden');
    }
  } else {
    container.innerHTML = `<button onclick="openAuthModal()" class="px-3 py-1.5 rounded-lg bg-forest text-white text-xs font-semibold">लॉगिन / शामिल हों</button>`;
    if (adminNav) adminNav.classList.add('hidden');
    if (adminNavMob) adminNavMob.classList.add('hidden');
  }
}

// Mala Logic
function updateMantraName() {
  document.getElementById('activeMantraDisplay').innerText = document.getElementById('malaMantraSelect').value;
}

function tapMalaBead() {
  malaBeadCount++;
  malaTotalCount++;
  if (malaBeadCount >= 108) {
    malaBeadCount = 0;
    malaLapsCount++;
    showToast("एक संपूर्ण माला (१०८ जप) पूर्ण हुई!");
  }
  localStorage.setItem('bishnoi_mala_beads', malaBeadCount.toString());
  localStorage.setItem('bishnoi_mala_laps', malaLapsCount.toString());
  localStorage.setItem('bishnoi_mala_total', malaTotalCount.toString());
  renderMalaCounters();
  updateProgressIndicators();
}

function renderMalaCounters() {
  document.getElementById('currentBeadDisplay').innerText = malaBeadCount;
  document.getElementById('malaLapsDisplay').innerText = malaLapsCount;
  document.getElementById('malaTotalDisplay').innerText = malaTotalCount;
}

function resetMalaCounter() {
  openConfirmModal("माला शून्य करें?", "क्या आप काउंटर रीसेट करना चाहते हैं?", (res) => {
    if (res) {
      malaBeadCount = 0; malaLapsCount = 0; malaTotalCount = 0;
      renderMalaCounters();
      updateProgressIndicators();
      showToast("रीसेट हो गया।");
    }
  });
}

// Panchang & Library
function computeAutoPanchang() {
  const now = new Date();
  const vaars = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  document.getElementById('autoPanchangDate').innerText = `${vaars[now.getDay()]} • विक्रम संवत ${now.getFullYear() + 57}`;
  document.getElementById('autoPanchangDetails').innerText = `आज का दिन: ${now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

function listenPdfs() {
  db.collection('pdfs').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const grid = document.getElementById('pdfGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);

    const defaultCard = document.createElement('div');
    defaultCard.className = "bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm";
    defaultCard.innerHTML = `
      <div>
        <span class="text-[11px] font-bold text-terracotta uppercase">पवित्र ग्रंथ</span>
        <h3 class="font-yatra text-forest text-lg mt-1">श्री सबदवाणी (१२० शब्द)</h3>
        <p class="text-xs text-stone-500 mt-1">गुरु जम्भेश्वर भगवान द्वारा उच्चरित पावन वाणी।</p>
      </div>
      <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
        <button onclick="openInbuiltPdfViewer('श्री सबदवाणी', './shabadwani.pdf')" class="px-3.5 py-1.5 bg-amber-500 text-stone-950 text-xs font-extrabold rounded-lg">ऐप में पढ़ें</button>
        <a href="./shabadwani.pdf" download class="px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg">डाउनलोड</a>
      </div>
    `;
    grid.appendChild(defaultCard);

    snap.forEach(doc => {
      const item = doc.data();
      const safeTitle = (item.title || 'साहित्य').replace(/'/g, "\\'");
      const safeLink = (item.link || '').replace(/'/g, "\\'");

      const card = document.createElement('div');
      card.className = "bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm";
      card.innerHTML = `
        <div>
          <span class="text-[11px] font-bold text-terracotta uppercase">${item.tag || 'साहित्य'}</span>
          <h3 class="font-yatra text-forest text-lg mt-1">${item.title}</h3>
          <p class="text-xs text-stone-500 mt-1">${item.desc || ''}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <button onclick="openInbuiltPdfViewer('${safeTitle}', '${safeLink}')" class="px-3.5 py-1.5 bg-amber-500 text-stone-950 text-xs font-extrabold rounded-lg">ऐप में पढ़ें</button>
          <div class="flex gap-2">
            <a href="${item.link}" target="_blank" download class="px-3 py-1.5 bg-forest text-white text-xs font-semibold rounded-lg">डाउनलोड</a>
            ${isVerifiedOwner ? `<button onclick="confirmDeletePdf('${doc.id}')" class="text-xs text-red-600 font-bold">हटाएं</button>` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  });
}

async function saveAdminPdf() {
  if (!currentUser || !currentUser.isOwner) return;
  const title = document.getElementById('adminPdfTitle').value.trim();
  const link = document.getElementById('adminPdfLink').value.trim();
  if (!title || !link) return showToast('कृपया शीर्षक और लिंक भरें');
  await db.collection('pdfs').add({ title, link, tag: 'साहित्य', desc: 'पावन साहित्य', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  showToast('PDF जोड़ी गई!');
  document.getElementById('adminPdfTitle').value = '';
  document.getElementById('adminPdfLink').value = '';
}

function confirmDeletePdf(id) {
  openConfirmModal("PDF हटाएं?", "क्या आप इसे हटाना चाहते हैं?", async (res) => {
    if (res) { await db.collection('pdfs').doc(id).delete(); showToast('हटा दिया गया।'); }
  });
}

// Audio Player & Notices
function listenAudios() {
  db.collection('audios').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const select = document.getElementById('customTrackSelector');
    if (!snap.empty && select) {
      select.innerHTML = '';
      snap.forEach(doc => {
        const a = doc.data();
        select.innerHTML += `<option value="${a.link}">${a.title}</option>`;
      });
      const first = select.value;
      const audio = document.getElementById('audioPlayer');
      const source = document.getElementById('audioSource');
      if (audio && source && first) { source.src = first; audio.load(); }
    }
  });
}

async function saveAdminAudio() {
  if (!currentUser || !currentUser.isOwner) return;
  const title = document.getElementById('adminAudioTitle').value.trim();
  const link = document.getElementById('adminAudioLink').value.trim();
  if (!title || !link) return showToast('शीर्षक और लिंक भरें');
  await db.collection('audios').add({ title, link, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  showToast('भजन जोड़ा गया!');
}

function listenNotices() {
  db.collection('notices').orderBy('createdAt', 'desc').limit(5).onSnapshot(snap => {
    if (!snap.empty) {
      const list = document.getElementById('noticeBoardList');
      if (list) {
        list.innerHTML = '';
        snap.forEach(doc => {
          const n = doc.data();
          list.innerHTML += `<div class="p-3 bg-stone-50 rounded-lg border border-stone-200"><span class="font-bold text-forest">${n.title}:</span> ${n.desc}</div>`;
        });
      }
    }
  });
}

function listenTreeCounter() {
  db.collection('stats').doc('treePledges').onSnapshot(doc => {
    if (doc.exists && doc.data().count) {
      document.getElementById('treeCounterDisplay').innerText = doc.data().count;
    }
  });
}

async function pledgeTree() {
  if (localStorage.getItem('has_pledged_tree')) return showToast("संकल्प पहले ही दर्ज है।");
  const display = document.getElementById('treeCounterDisplay');
  let nextVal = (parseInt(display.innerText) || 1485) + 1;
  display.innerText = nextVal;
  localStorage.setItem('has_pledged_tree', 'true');
  showToast("संकल्प दर्ज हुआ!");
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
  showToast('संदेश अपडेट हुआ!');
}

function shareBannerWhatsApp() {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(currentBannerText)}`, '_blank');
}

function shareNiyamWhatsApp(num, title, rule, desc) {
  readNiyamsSet.add(num);
  localStorage.setItem('bishnoi_read_niyams', JSON.stringify(Array.from(readNiyamsSet)));
  updateProgressIndicators();
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`नियम ${num} -${title}\n${rule}\n${desc}`)}`, '_blank');
}

function sharePostWhatsApp(author, content) {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${author}:${content}`)}`, '_blank');
}

// 29 Niyams Render
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
  const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);

  data.forEach(n => {
    const isRead = readNiyamsSet.has(n.num);
    const card = document.createElement('div');
    card.className = `bg-white p-4 rounded-xl border ${isRead ? 'border-emerald-300 bg-emerald-50/10' : 'border-stone-200'} space-y-2 flex flex-col justify-between shadow-sm`;
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
        ${isVerifiedOwner ? `<button onclick="editSingleNiyam(${n.num})" class="text-xs text-amber-700 font-bold hover:underline">Edit</button>` : '<span></span>'}
        <button onclick="shareNiyamWhatsApp(${n.num}, '${n.title}', '${n.rule}', '${n.desc}')" class="text-xs text-emerald-700 font-bold">साझा करें</button>
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
  const newTitle = prompt("शीर्षक:", item.title);
  if (newTitle === null) return;
  const newRule = prompt("मूल वाणी:", item.rule);
  if (newRule === null) return;
  const newDesc = prompt("विवरण:", item.desc);
  if (newDesc === null) return;

  niyamsList[idx] = { ...item, title: newTitle, rule: newRule, desc: newDesc };
  await db.collection('settings').doc('customNiyams').set({ list: niyamsList });
  showToast("नियम अपडेट हो गया!");
}

function filterNiyams() {
  const q = (document.getElementById('niyamSearch')?.value || '').toLowerCase();
  renderNiyams(niyamsList.filter(n => n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q) || n.title.toLowerCase().includes(q)));
}

// History & Kids
function listenHistoryAndKids() {
  db.collection('settings').doc('customHistoryKids').onSnapshot(doc => {
    if (doc.exists && Array.isArray(doc.data().items)) historyItemsList = doc.data().items;
    renderHistoryAndKidsViews();
  });
}

function toggleStoryReadMore(id) {
  const p = document.getElementById(`story_txt_${id}`);
  const btn = document.getElementById(`story_btn_${id}`);
  if (!p || !btn) return;
  if (p.classList.contains('line-clamp-2')) {
    p.classList.remove('line-clamp-2'); btn.innerText = 'संक्षिप्त करें ↑';
  } else {
    p.classList.add('line-clamp-2'); btn.innerText = 'पूरा पढ़ें (Read More) ↓';
  }
}

function renderHistoryAndKidsViews() {
  const histView = document.getElementById('historySubView');
  const kidsView = document.getElementById('kidsSubView');
  const isVerifiedOwner = Boolean(currentUser && currentUser.isOwner === true);

  if (histView) {
    let wrap = document.getElementById('dynamicHistoryCardsWrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'dynamicHistoryCardsWrap'; wrap.className = 'space-y-4 mb-4'; histView.insertBefore(wrap, histView.firstChild); }
    wrap.innerHTML = historyItemsList.filter(x => x.type === 'history').map(item => `
      <div class="bg-white p-5 rounded-2xl border-l-4 border-forest border border-stone-200 shadow-sm space-y-2">
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-0.5 bg-emerald-50 text-forest rounded-full text-xs font-bold">${item.badge}</span>
          ${isVerifiedOwner ? `<button onclick="deleteHistoryOrKidsItem('${item.id}')" class="text-xs text-red-600 font-bold">Delete</button>` : ''}
        </div>
        <h3 class="font-yatra text-lg text-forest">${item.title}</h3>
        <p id="story_txt_${item.id}" class="line-clamp-2 text-xs text-stone-700 leading-relaxed">${item.content}</p>
        <button id="story_btn_${item.id}" onclick="toggleStoryReadMore('${item.id}')" class="text-xs font-bold text-forest">पूरा पढ़ें ↓</button>
      </div>
    `).join('');
  }

  if (kidsView) {
    let wrap = document.getElementById('dynamicKidsCardsWrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'dynamicKidsCardsWrap'; wrap.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'; kidsView.insertBefore(wrap, kidsView.firstChild); }
    wrap.innerHTML = historyItemsList.filter(x => x.type === 'kids').map(item => `
      <div class="bg-amber-50/40 p-5 rounded-2xl border border-amber-300 shadow-sm space-y-2">
        <div class="flex items-center justify-between">
          <span class="px-3 py-1 bg-amber-400 text-stone-950 rounded-full text-xs font-extrabold">${item.badge}</span>
          ${isVerifiedOwner ? `<button onclick="deleteHistoryOrKidsItem('${item.id}')" class="text-xs text-red-600 font-bold">Delete</button>` : ''}
        </div>
        <h3 class="font-yatra text-lg text-forest">${item.title}</h3>
        <p id="story_txt_${item.id}" class="line-clamp-2 text-xs text-stone-800 leading-relaxed">${item.content}</p>
        <button id="story_btn_${item.id}" onclick="toggleStoryReadMore('${item.id}')" class="text-xs font-bold text-forest">पूरा पढ़ें ↓</button>
      </div>
    `).join('');
  }
}

async function saveAdminHistoryOrKidsItem() {
  if (!currentUser || !currentUser.isOwner) return;
  const type = document.getElementById('adminHistType')?.value || 'history';
  const badge = document.getElementById('adminHistBadge')?.value.trim() || 'अध्याय';
  const title = document.getElementById('adminHistTitle')?.value.trim();
  const content = document.getElementById('adminHistContent')?.value.trim();
  if (!title || !content) return showToast('शीर्षक और विवरण लिखें');
  historyItemsList.unshift({ id: 'item_' + Date.now(), type, badge, title, content, moral: '' });
  await db.collection('settings').doc('customHistoryKids').set({ items: historyItemsList });
  showToast('प्रकाशित हुआ!');
}

async function deleteHistoryOrKidsItem(id) {
  if (!currentUser || !currentUser.isOwner) return;
  openConfirmModal("हटाएं?", "क्या आप इसे हटाना चाहते हैं?", async (res) => {
    if (res) {
      historyItemsList = historyItemsList.filter(x => x.id !== id);
      await db.collection('settings').doc('customHistoryKids').set({ items: historyItemsList });
      showToast('हटा दिया गया।');
    }
  });
}
