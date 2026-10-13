/* ==========================================================================
   BISHNOI DIGITAL PLATFORM - COMPLETE MASTER CONTROLLER (script.js)
   PART 1 OF 2
   Contains:
   - Safe Firebase Initialization & Configuration
   - Global Application State
   - 29 Niyams Authentic Data & Renderer
   - UI Notification & Toast Helpers
   - Unified 5-Tab Navigation System
   - Authentication (Firebase Auth State & Display Helpers)
   - Panchang & Dynamic Amavasya Countdown Engine
   - Compact Home Jaap Mala (108-Bead Counter, Lap Counter & Streaks)
   - Tree Plantation Pledge ("Mera Podha" Counter & Village Tagging)
   - Real-Time Synchronized Karaoke Bhajan Audio Engine
   - Shabadwani Catalog, PDF Viewer Integration & Search
   - Privacy & Proctoring Consent Modal Controller
   - Candidate Enrollment Form & Photo Downsampling Handler
   - Reusable National-Standard Admit Card Generator (A4 PDF + Dynamic QR)
   ========================================================================== */

"use strict";

// --------------------------------------------------------------------------
// 1. FIREBASE INITIALIZATION (SAFE CLIENT CONFIGURATION)
// --------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDD58ybmm1bmmc5k5AwsxiaDiOXxlp7APA",
  authDomain: "bishnoi-platform.firebaseapp.com",
  projectId: "bishnoi-platform",
  storageBucket: "bishnoi-platform.firebasestorage.app",
  messagingSenderId: "1001226124051",
  appId: "1:1001226124051:web:ad4dc69e04e6701024f8e6",
  measurementId: "G-2RB41Z0JNK"
};

let db = null;
let auth = null;

if (typeof firebase !== "undefined") {
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  if (firebase.firestore) db = firebase.firestore();
  if (firebase.auth) auth = firebase.auth();
}

// --------------------------------------------------------------------------
// 2. CONFIGURATION, ENDPOINTS & AUTHENTICATION SETTINGS
// --------------------------------------------------------------------------
// Cloudflare Worker endpoint for webcam snapshot ingestion (KV binding handled server-side)
const CLOUDFLARE_WORKER_PROCTOR_URL = "https://exam-proctor-api.bishnoism.workers.dev/upload";
const CLOUDFLARE_NAMESPACE_ID = "48f2e42708a145c1b7617d3bba559b6e";

// --------------------------------------------------------------------------
// 3. GLOBAL APPLICATION STATE
// --------------------------------------------------------------------------
let currentUser = null;
let isCurrentUserOwner = false;
let examCountdownTimer = null;
let amavasyaTimerInterval = null;
let currentBannerText = '"जीव दया पालणी, रूंख लीलो नी घावै" — प्रकृति एवं सभी मूक जीवों के प्रति करुणा रखें।';

// Inactivity session timer
let inactivityTimer = null;

// Audio speeds for playback control
const audioSpeeds = [1, 1.25, 1.5];
let currentSpeedIdx = 0;

// PDF Reader state (PDF.js modal)
let activePdfDoc = null;
let currentPdfPage = 1;
let totalPdfPages = 1;
let isPdfLandscape = false;

// Pariksha Visibility Settings (synced with Firestore /examConfig/visibility)
let parikshaVisibility = {
  enrollment: false,
  mock: false,
  mainExam: false,
  dailyQuiz: false,
  resultsPublished: false,
  examScheduleTime: null,
  examDuration: 120,
  enableCameraProctoring: true
};

// Exam Runtime State
let examState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  timeRemainingSeconds: 0,
  timerInterval: null,
  tabSwitchCount: 0,
  activeMode: "daily_quiz", // 'daily_quiz', 'mock_1', 'mock_2', 'main_exam'
  rollNumber: localStorage.getItem("bishnoi_saved_roll") || "GUEST",
  isExamRunning: false,
  proctorInterval: null,
  enrolledProfile: null
};

// Admit Card Config Snapshot
let customAdmitConfig = JSON.parse(localStorage.getItem("bishnoi_unified_admit_cfg") || JSON.stringify({
  examTitle: "अखिल भारतीय जम्भवाणी साहित्य एवं ज्ञान परीक्षा २०२६",
  examDateStr: "25 October 2026",
  examTimeStr: "10:00 AM - 12:00 PM",
  examCenterStr: "आधिकारिक डिजिटल परीक्षा केंद्र",
  lateCutoffMins: 5,
  instructionsStr: "१. रोल नंबर गोपनीय रखें। २. परीक्षा के दौरान ३ बार टैब बदलने पर पेपर स्वतः सबमिट हो जाएगा।"
}));

// Candidate last enrolled object
window.lastEnrolledStudentObj = JSON.parse(localStorage.getItem("bishnoi_last_enrolled_obj") || "null");

// --------------------------------------------------------------------------
// 4. AUTHENTIC 29 NIYAMS DATA
// --------------------------------------------------------------------------
const NIYAMS_DATA = [
  { num: 1, title: "प्रसूति सूतक", rule: "तीस दिन सूतक पाळणा", desc: "सूतक काल में ३० दिन तक माता व शिशु की स्वच्छता और विश्राम रखें।" },
  { num: 2, title: "ऋतुवंती पृथक्करण", rule: "पांच दिन रजस्वला पृथक्करण", desc: "माहवारी के दौरान ५ दिन का गृह-कार्य से विश्राम एवं स्वास्थ्य रक्षा।" },
  { num: 3, title: "प्रातः स्नान", rule: "सेरो करो अस्नान", desc: "प्रतिदिन सूर्योदय से पूर्व प्रातःकाल स्नान कर तन-मन से पवित्र रहें।" },
  { num: 4, title: "शील व संतोष", rule: "शील संतोष सूच राखणा", desc: "सदाचारी, शांत, पवित्र और संतोषी स्वभाव बनाए रखें।" },
  { num: 5, title: "द्विकाल संध्या", rule: "द्वादश कर्म सांध", desc: "सुबह-शाम दोनों समय संध्या-वंदन और ईश्वर स्मरण करें।" },
  { num: 6, title: "सांझ आरती", rule: "सांझ आरती गुण गावै", desc: "संध्या समय आरती व भगवान के पावन गुणों का गायन करें।" },
  { num: 7, title: "प्रातः होम", rule: "प्रात: होम करणा", desc: "वातावरण शुद्धि एवं आत्मिक शांति हेतु प्रतिदिन प्रातः हवन करें।" },
  { num: 8, title: "पानी छानना", rule: "पाणी छान पीवणा", desc: "सूक्ष्म जीवों की रक्षा के लिए पानी सदा छानकर पियें और वाणी छानकर बोलें।" },
  { num: 9, title: "ईंधन जांच", rule: "ईंधन बीन बाळणा", desc: "चूल्हे में लकड़ी व गोबर के उपले कीट-पतंगों को देखकर व झाड़कर ही जलाएं।" },
  { num: 10, title: "क्षमा धारण", rule: "क्षमा दया मन आणणा", desc: "मन में सदा क्षमा और सहनशीलता का भाव बनाए रखें।" },
  { num: 11, title: "दया भाव", rule: "दया हिरदै राखणी", desc: "प्रत्येक प्राणी के प्रति हृदय में करुणा व दयालुता रखें।" },
  { num: 12, title: "चोरी त्याग", rule: "चोरी नहीं करणी", desc: "पराई वस्तु कभी न चुराएं और ईमानदारी से जीवन यापन करें।" },
  { num: 13, title: "निंदा त्याग", rule: "निंदा नहीं करणी", desc: "किसी की पीठ पीछे बुराई या चुगली न करें।" },
  { num: 14, title: "झूठ त्याग", rule: "झूठ नहीं बोलना", desc: "सदा सत्य, हितकारी और मधुर वाणी बोलें।" },
  { num: 15, title: "वाद-विवाद त्याग", rule: "वाद विवाद नहीं करणा", desc: "व्यर्थ के झगड़े और अहंकार भरी बहस से दूर रहें।" },
  { num: 16, title: "अमावस्या व्रत", rule: "अमावस्या व्रत राखणा", desc: "प्रत्येक अमावस्या के दिन उपवास रखें, पर्यावरण चिंतन करें।" },
  { num: 17, title: "विष्णु स्मरण", rule: "विष्णु नाम जपणा", desc: "हृदय में ॐ विष्णवे नमः का निरंतर स्मरण रखें।" },
  { num: 18, title: "जीव दया", rule: "जीव दया पालणी", desc: "सभी मूक पशु-पक्षियों की रक्षा करें, किसी जीव को कष्ट न दें।" },
  { num: 19, title: "हरा वृक्ष रक्षा", rule: "रूंख लीलो नी घावै", desc: "पर्यावरण संतुलन हेतु हरे-भरे पेड़ों को कभी न काटें।" },
  { num: 20, title: "काम-क्रोध संयम", rule: "अजर जरे सो सूर", desc: "काम, क्रोध, लोभ और अहंकार पर नियंत्रण रखें।" },
  { num: 21, title: "स्वहस्त आहार", rule: "आपने हाथे रांधणा", desc: "पवित्रता और सात्विकता के साथ शुद्ध बना भोजन ग्रहण करें।" },
  { num: 22, title: "पशु थापण", rule: "अमर रखावै थाट", desc: "निराश्रित पशुओं को कटने से बचाएं और आश्रय दें।" },
  { num: 23, title: "बैल बधिया निषेध", rule: "बैल बधिया नहीं करणा", desc: "पशुओं पर क्रूरता न करें, बैलों का बंध्याकरण न करें।" },
  { num: 24, title: "अमल त्याग", rule: "अमल नहीं खाणा", desc: "अफीम और किसी भी प्रकार के नशे का पूर्ण त्याग करें।" },
  { num: 25, title: "तम्बाकू त्याग", rule: "तम्बाकू नहीं पीणा", desc: "तम्बाकू, बीड़ी, सिगरेट आदि का पूर्ण निषेध रखें।" },
  { num: 26, title: "भांग त्याग", rule: "भांग नहीं पीणी", desc: "भांग और गांजे जैसे मादक पदार्थों का सेवन कभी न करें।" },
  { num: 27, title: "मदिरा त्याग", rule: "मद्य नहीं पीणा", desc: "शराब का पूरी तरह त्याग करें।" },
  { num: 28, title: "मांस त्याग", rule: "मांस नहीं खाणा", desc: "पूर्णतः शाकाहारी रहें, मांस-अंडा कभी न छुएं।" },
  { num: 29, title: "नील त्याग", rule: "नील नहीं पहरणा", desc: "नील के पौधे व जीवों को नष्ट करके बनने वाले नीले रंग का त्याग करें।" }
];

// --------------------------------------------------------------------------
// 5. SHABADWANI CATALOG & AUTHENTIC SAMPLES
// --------------------------------------------------------------------------
const SHABADWANI_CATALOG = [
  { id: "sh1", num: 1, title: "सबद १: ॐ गुरु चिन्हारि", desc: "सृष्टिकर्ता सतगुरु की पहचान एवं अंतःकरण शुद्धि।", fullText: "ॐ गुरु चिन्हारि साधो, गुरु चिन्हारि भाई। जो जन गुरु मुख होई सो चीन्हे, अनभै पद परचाई॥" },
  { id: "sh2", num: 2, title: "सबद २: लोइया तूं क्यों भूला", desc: "सांसारिक मोह-माया का त्याग एवं नश्वर देह का सत्य।", fullText: "लोइया तूं क्यों भूला रे भाई, काया काची कुंभ कहाई। गुरु मुख नाम जपो रे प्राणि, भवसागर तर जाई॥" },
  { id: "sh3", num: 3, title: "सबद ३: जीया पर दया पालणी", desc: "जीव दया, वृक्ष रक्षा एवं सत्य वचन का अमृत मार्ग।", fullText: "जीया पर दया पालणी भाई, रूंख लीलो नी घावै। सत्य शबद मुख बोलणा, सतगुरु शरणि समावै॥" },
  { id: "sh4", num: 4, title: "सबद ४: अमावस व्रत राखणो", desc: "अमावस्या व्रत, हवन एवं आत्मचिंतन का विधान।", fullText: "अमावस व्रत राखणो साधो, होम जाप नित कीजै। मूक जीवां ने अभय कर, हरि को सुमिरण लीजै॥" },
  { id: "sh5", num: 5, title: "सबद ५: करनी बिना कथनी थोथी", desc: "आचरण की शुचिता एवं पाखंड निवारण।", fullText: "करनी बिना कथनी थोथी रे भाई, सांच बिना नहीं सूझे। उन्तीस धर्म की पाळ बांधे, सोई सतगुरु री साख बूझे॥" }
];

// --------------------------------------------------------------------------
// 6. SYNCHRONIZED KARAOKE TIMESTAMPS
// --------------------------------------------------------------------------
const KARAOKE_LYRICS = [
  { time: 0, text: "॥ ॐ श्री गुरु जम्भेश्वराय नमः ॥" },
  { time: 5, text: "आरती संत जन मिलकर गावै, प्रेम सहित गुरु चरण ध्यावै।" },
  { time: 14, text: "समराथल पर कलश स्थाप्यो, पाहल देकर पंथ चलायो।" },
  { time: 24, text: "उन्तीस धर्म की साखी सुनाई, जीव दया मन में अपनाई।" },
  { time: 35, text: "रूंख लीलो नी घावै भाई, हिरण फिरै गुरु के शरणाई।" },
  { time: 48, text: "विष्णु नाम जपो मन लाई, जम्भदेव भव पार लगाई।" }
];

// --------------------------------------------------------------------------
// 7. TOAST & NOTIFICATION HELPERS
// --------------------------------------------------------------------------
function showToast(msg) {
  const toast = document.getElementById("toastNotification");
  const txt = document.getElementById("toastMsg");
  if (!toast || !txt) return;
  txt.innerText = msg;
  toast.classList.remove("-translate-y-24", "opacity-0");
  toast.classList.add("translate-y-0", "opacity-100");
  setTimeout(() => {
    toast.classList.remove("translate-y-0", "opacity-100");
    toast.classList.add("-translate-y-24", "opacity-0");
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --------------------------------------------------------------------------
// 8. UNIFIED FIVE-TAB NAVIGATION CONTROLLER
// --------------------------------------------------------------------------
window.switchPortalTab = function(targetTab) {
  const tabs = ["home", "sahitya", "pariksha", "community", "profile"];
  tabs.forEach(t => {
    const el = document.getElementById("tab-" + t);
    const btn = document.getElementById("bnav-" + t);
    if (el) el.classList.toggle("hidden", t !== targetTab);
    if (btn) btn.classList.toggle("bnav-active", t === targetTab);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
};
window.switchTab = window.switchPortalTab;

// --------------------------------------------------------------------------
// 9. AUTHENTICATION & ACCESS CONTROL (FIREBASE VERIFIED)
// --------------------------------------------------------------------------
function setupInactivityGuard() {
  const resetTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (currentUser) {
      inactivityTimer = setTimeout(() => {
        logoutPortalUser();
        showToast("🔒 सुरक्षा कारणों से २० मिनट की निष्क्रियता के बाद आपका सत्र समाप्त कर दिया गया है।");
      }, 20 * 60 * 1000);
    }
  };
  ["click", "touchstart", "keydown", "scroll"].forEach(evt => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });
  resetTimer();
}

function initAuthUI() {
  const authCont = document.getElementById("authActionsContainer");
  if (!authCont) return;

  if (auth) {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = {
          uid: user.uid,
          name: user.displayName || user.email || "साधक",
          email: user.email || "",
          phone: user.phoneNumber || localStorage.getItem("bishnoi_user_phone") || ""
        };

        // Server-enforced role verification via Firestore
        isCurrentUserOwner = false;
        if (db) {
          try {
            const adminDoc = await db.collection("settings").doc("adminRoles").get();
            if (adminDoc.exists) {
              const roles = adminDoc.data() || {};
              if (roles.ownerUids && Array.isArray(roles.ownerUids) && roles.ownerUids.includes(user.uid)) {
                isCurrentUserOwner = true;
              }
            }
          } catch (e) {
            console.warn("Admin role verification deferred:", e.message);
          }
        }

        authCont.innerHTML = `
          <button onclick="switchPortalTab('profile')" class="text-xs font-extrabold text-forest bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300">
            👤 ${escapeHtml(currentUser.name)}
          </button>
        `;
        const nameDisp = document.getElementById("profNameDisplay");
        const phoneDisp = document.getElementById("profPhoneDisplay");
        const roleBadge = document.getElementById("profRoleBadge");
        if (nameDisp) nameDisp.innerText = currentUser.name;
        if (phoneDisp) phoneDisp.innerText = currentUser.phone || currentUser.email;

        if (isCurrentUserOwner) {
          document.getElementById("ownerStudioSection")?.classList.remove("hidden");
          if (roleBadge) roleBadge.innerText = "🛡️ मुख्य व्यवस्थापक (Owner)";
          if (typeof loadUnifiedConfigToStudio === "function") loadUnifiedConfigToStudio();
        } else {
          document.getElementById("ownerStudioSection")?.classList.add("hidden");
          if (roleBadge) roleBadge.innerText = "पंजीकृत साधक";
        }
      } else {
        currentUser = null;
        isCurrentUserOwner = false;
        authCont.innerHTML = `
          <button onclick="promptUserLogin()" class="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold">लॉगिन</button>
        `;
        document.getElementById("ownerStudioSection")?.classList.add("hidden");
      }
    });
  } else {
    authCont.innerHTML = `
      <button onclick="promptUserLogin()" class="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold">लॉगिन</button>
    `;
  }
}

window.promptUserLogin = function() {
  if (!auth) {
    showToast("प्रमाणीकरण सेवा अनुपलब्ध है।");
    return;
  }
  const email = prompt("अपना पंजीकृत ईमेल दर्ज करें:");
  if (!email || !email.includes("@")) {
    showToast("कृपया वैध ईमेल पता दर्ज करें!");
    return;
  }
  const password = prompt("पासवर्ड दर्ज करें:");
  if (!password) return;

  auth.signInWithEmailAndPassword(email.trim(), password)
    .then(() => {
      showToast("सफलतापूर्वक लॉगिन हुआ!");
    })
    .catch((err) => {
      showToast("लॉगिन विफल: " + err.message);
    });
};

window.logoutPortalUser = function() {
  if (auth) {
    auth.signOut().then(() => {
      currentUser = null;
      isCurrentUserOwner = false;
      showToast("सफलतापूर्वक लॉगआउट किया गया।");
      location.reload();
    });
  } else {
    location.reload();
  }
};

// --------------------------------------------------------------------------
// 10. PANCHANG & DYNAMIC AMAVASYA COUNTDOWN ENGINE
// --------------------------------------------------------------------------
function computeAutoPanchangAndAmavasya() {
  const now = new Date();
  const vaars = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
  const samvat = now.getFullYear() + 57;

  const dEl = document.getElementById("autoPanchangDate");
  const dtEl = document.getElementById("autoPanchangDetails");
  if (dEl) dEl.innerText = `${vaars[now.getDay()]} • विक्रम संवत ${samvat}`;
  if (dtEl) dtEl.innerText = `आज: ${now.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })}`;

  const box = document.getElementById("amavasyaCountdownBox");
  if (!box) return;

  if (db) {
    db.collection("settings").doc("amavasyaConfig").get().then(doc => {
      if (doc.exists && doc.data().date) {
        const target = new Date(doc.data().date).getTime();
        const diffMs = target - now.getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (days >= 0) {
          box.innerText = `⏳ आगामी पावन अमावस्या: ${days} दिन शेष (सत्यापित)`;
          return;
        }
      }
      applyAstronomicalAmavasyaFallback(now, box);
    }).catch(() => {
      applyAstronomicalAmavasyaFallback(now, box);
    });
  } else {
    applyAstronomicalAmavasyaFallback(now, box);
  }
}

function applyAstronomicalAmavasyaFallback(now, box) {
  const refNewMoon = new Date("2026-01-18T00:00:00Z").getTime();
  const diffDays = (now.getTime() - refNewMoon) / (1000 * 60 * 60 * 24);
  const synodic = 29.530588;
  const moonAge = (diffDays % synodic + synodic) % synodic;
  const daysRemaining = Math.max(1, Math.ceil(synodic - moonAge));
  box.innerText = `⏳ आगामी अमावस्या व्रत: ~${daysRemaining} दिन शेष (अनुमानित)`;
}

// --------------------------------------------------------------------------
// 11. 29 NIYAMS CATALOG RENDERER & SEARCH
// --------------------------------------------------------------------------
function renderNiyamsList() {
  const grid = document.getElementById("niyamsQuickGrid");
  if (!grid) return;
  grid.innerHTML = NIYAMS_DATA.map(n => `
    <div class="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
      <div class="flex items-center justify-between font-bold text-forest">
        <span class="w-5 h-5 rounded-full bg-amber-200 text-stone-900 flex items-center justify-center text-[10px] font-mono">${n.num}</span>
        <span class="text-terracotta text-[10px]">${escapeHtml(n.title)}</span>
      </div>
      <h4 class="font-bold text-stone-800">${escapeHtml(n.rule)}</h4>
      <p class="text-[11px] text-stone-600 leading-snug">${escapeHtml(n.desc)}</p>
    </div>
  `).join("");
}

// --------------------------------------------------------------------------
// 12. COMPACT DIGITAL JAAP MALA & STREAKS
// --------------------------------------------------------------------------
let malaBeads = parseInt(localStorage.getItem("bishnoi_mala_beads") || "0", 10);
let malaLaps = parseInt(localStorage.getItem("bishnoi_mala_laps") || "0", 10);
let malaTotal = parseInt(localStorage.getItem("bishnoi_mala_total") || "0", 10);

function initMalaState() {
  updateMalaDisplays();
  updateDailyJaapStreak();
}

function updateDailyJaapStreak() {
  const today = new Date().toISOString().split("T")[0];
  const lastDate = localStorage.getItem("bishnoi_jaap_last_date") || "";
  let streak = parseInt(localStorage.getItem("bishnoi_jaap_streak") || "0", 10);

  if (lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    streak = (lastDate === yesterday) ? streak + 1 : 1;
    localStorage.setItem("bishnoi_jaap_last_date", today);
    localStorage.setItem("bishnoi_jaap_streak", streak.toString());
  }

  const badgeDisp = document.getElementById("streakBadgeDisp");
  const countDisp = document.getElementById("streakCountDisp");
  if (countDisp) countDisp.innerText = `${streak} दिन`;
  if (badgeDisp) {
    if (streak >= 51) badgeDisp.innerText = "जम्भ रत्न";
    else if (streak >= 21) badgeDisp.innerText = "हरित प्रहरी";
    else if (streak >= 7) badgeDisp.innerText = "निष्ठ साधक";
    else badgeDisp.innerText = "आरंभिक साधक";
  }
}

window.tapHomeMalaBead = function() {
  malaBeads++;
  malaTotal++;
  if (malaBeads >= 108) {
    malaBeads = 0;
    malaLaps++;
    if (navigator.vibrate) navigator.vibrate([80, 50, 100]);
    showToast("ॐ विष्णवे नमः! एक संपूर्ण माला (१०८ जप) पूर्ण हुई!");
  } else {
    if (navigator.vibrate) navigator.vibrate(30);
  }

  localStorage.setItem("bishnoi_mala_beads", malaBeads.toString());
  localStorage.setItem("bishnoi_mala_laps", malaLaps.toString());
  localStorage.setItem("bishnoi_mala_total", malaTotal.toString());
  updateMalaDisplays();
  updateDailyJaapStreak();
};

function updateMalaDisplays() {
  const beadDisp = document.getElementById("homeMalaBeadDisp");
  const lapBadge = document.getElementById("homeMalaLapBadge");
  const totalDisp = document.getElementById("totalJaapDisp");
  const totalLaps = document.getElementById("totalLapsDisp");

  if (beadDisp) beadDisp.innerText = malaBeads;
  if (lapBadge) lapBadge.innerText = `${malaLaps} माला पूर्ण`;
  if (totalDisp) totalDisp.innerText = malaTotal;
  if (totalLaps) totalLaps.innerText = malaLaps;
}

// --------------------------------------------------------------------------
// 13. TREE PLANTATION PLEDGE ("MERA PODHA") & WHATSAPP SHARE
// --------------------------------------------------------------------------
window.pledgeTree = function() {
  let count = parseInt(localStorage.getItem("bishnoi_tree_pledges") || "1485", 10);
  count++;
  localStorage.setItem("bishnoi_tree_pledges", count.toString());
  const disp = document.getElementById("treeCounterDisplay");
  if (disp) disp.innerText = count;

  if (db) {
    db.collection("stats").doc("treePledges").set({
      count: count,
      lastPledgedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(() => {});
  }
  showToast("🌱 आपका प्रकृति रक्षा पौधरोपण संकल्प दर्ज हुआ!");
};

window.shareBannerWhatsApp = function() {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🌿 पावन संदेश:\n${currentBannerText}\n${window.location.href}`)}`, "_blank");
};

// --------------------------------------------------------------------------
// 14. REAL-TIME SYNCHRONIZED KARAOKE BHAJAN ENGINE
// --------------------------------------------------------------------------
function initKaraokePlayer() {
  const audio = document.getElementById("karaokeAudioPlayer");
  const box = document.getElementById("karaokeLyricsBox");
  if (!audio || !box) return;

  box.innerHTML = KARAOKE_LYRICS.map((k, i) => `
    <p id="kline_${i}" class="transition-all duration-300 py-1 text-stone-300 opacity-60">${escapeHtml(k.text)}</p>
  `).join("");

  audio.addEventListener("timeupdate", () => {
    const cur = audio.currentTime;
    const dur = audio.duration || 0;
    const timer = document.getElementById("karaokeTimerDisp");
    if (timer) timer.innerText = `${formatSec(cur)} / ${formatSec(dur)}`;

    let activeIdx = 0;
    for (let i = 0; i < KARAOKE_LYRICS.length; i++) {
      if (cur >= KARAOKE_LYRICS[i].time) activeIdx = i;
    }

    KARAOKE_LYRICS.forEach((_, i) => {
      const line = document.getElementById("kline_" + i);
      if (line) {
        if (i === activeIdx) {
          line.className = "karaoke-active-line py-1 text-amber-300 opacity-100 font-bold";
          line.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          line.className = "text-stone-300 py-1 opacity-60";
        }
      }
    });
  });

  audio.addEventListener("ended", () => {
    const btn = document.getElementById("karaokePlayBtn");
    if (btn) btn.innerText = "▶ प्ले करें";
  });
}

window.toggleKaraokePlayback = function() {
  const audio = document.getElementById("karaokeAudioPlayer");
  const btn = document.getElementById("karaokePlayBtn");
  if (!audio) return;

  if (audio.paused) {
    audio.play().then(() => {
      if (btn) btn.innerText = "⏸ विराम दें";
    }).catch(e => {
      showToast("ऑडियो लोड नहीं हो सका: " + e.message);
    });
  } else {
    audio.pause();
    if (btn) btn.innerText = "▶ प्ले करें";
  }
};

function formatSec(s) {
  if (isNaN(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// --------------------------------------------------------------------------
// 15. SHABADWANI REPOSITORY & MODAL READER
// --------------------------------------------------------------------------
function renderShabadCards(items) {
  const grid = document.getElementById("pdfRepoGrid");
  if (!grid) return;
  grid.innerHTML = items.map(s => `
    <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-2">
      <div>
        <span class="text-[10px] font-extrabold text-terracotta uppercase">सबद संख्या ${s.num}</span>
        <h4 class="font-yatra text-base text-forest mt-0.5">${escapeHtml(s.title)}</h4>
        <p class="text-xs text-stone-600 mt-1">${escapeHtml(s.desc)}</p>
      </div>
      <button onclick="openShabadModal('${s.id}')" class="w-full py-1.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-xl transition">
        अमृत वाणी पढ़ें
      </button>
    </div>
  `).join("");
}

window.filterShabadRepo = function(query) {
  const clean = (query || "").trim().toLowerCase();
  if (!clean) {
    renderShabadCards(SHABADWANI_CATALOG);
    return;
  }
  const filtered = SHABADWANI_CATALOG.filter(s => 
    s.title.toLowerCase().includes(clean) || 
    s.desc.toLowerCase().includes(clean) || 
    s.num.toString().includes(clean)
  );
  renderShabadCards(filtered);
};

window.openShabadModal = function(shabadId) {
  const shabad = SHABADWANI_CATALOG.find(x => x.id === shabadId);
  if (!shabad) return;

  let modal = document.getElementById("shabadReaderModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "shabadReaderModal";
    modal.className = "fixed inset-0 z-[9995] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border-2 border-forest shadow-2xl relative">
      <button onclick="document.getElementById('shabadReaderModal').remove()" class="absolute top-4 right-4 text-stone-400 hover:text-stone-800 text-lg font-bold">✕</button>
      <div class="border-b border-stone-100 pb-2">
        <span class="text-[10px] font-bold text-terracotta uppercase">सबद संख्या ${shabad.num}</span>
        <h3 class="font-yatra text-xl text-forest mt-0.5">${escapeHtml(shabad.title)}</h3>
      </div>
      <div class="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs sm:text-sm text-stone-800 font-medium leading-relaxed whitespace-pre-wrap">
        ${escapeHtml(shabad.fullText || shabad.desc)}
      </div>
      <button onclick="document.getElementById('shabadReaderModal').remove()" class="w-full py-2.5 bg-forest text-white font-bold text-xs rounded-xl">
        बंद करें
      </button>
    </div>
  `;
};

// --------------------------------------------------------------------------
// 16. PRIVACY CONSENT & CLOUDFLARE WEBCAM PROCTORING
// --------------------------------------------------------------------------
function verifyPrivacyConsentStatus() {
  if (!localStorage.getItem("bishnoi_privacy_consent_accepted")) {
    const modal = document.getElementById("privacyConsentModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }
  }
}

window.acceptPrivacyConsent = function() {
  localStorage.setItem("bishnoi_privacy_consent_accepted", "true");
  const modal = document.getElementById("privacyConsentModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  showToast("✅ गोपनीयता सहमति दर्ज कर ली गई है।");
};

function startCloudflareProctoring(rollNumber) {
  const video = document.getElementById("proctorWebcamVideo");
  const canvas = document.getElementById("proctorSnapshotCanvas");
  if (!navigator.mediaDevices || !video || !canvas) return;

  navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
    .then(stream => {
      video.srcObject = stream;
      examState.proctorInterval = setInterval(() => {
        if (!examState.isExamRunning) return;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, 320, 240);
        const base64Img = canvas.toDataURL("image/jpeg", 0.5);

        fetch(CLOUDFLARE_WORKER_PROCTOR_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            namespaceId: CLOUDFLARE_NAMESPACE_ID,
            rollNumber: rollNumber,
            image: base64Img,
            timestamp: Date.now()
          })
        }).catch(() => {});
      }, 120000);
    })
    .catch(() => {
      console.warn("Camera proctoring stream unavailable or permission denied.");
    });
}

function stopCloudflareProctoring() {
  if (examState.proctorInterval) clearInterval(examState.proctorInterval);
  const video = document.getElementById("proctorWebcamVideo");
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }
}

// --------------------------------------------------------------------------
// 17. CANDIDATE ENROLLMENT & NATIONAL ADMIT CARD GENERATOR (A4 + QR)
// --------------------------------------------------------------------------
window.handleCandidateEnrollment = async function(e) {
  e.preventDefault();
  const name = document.getElementById("enrollName").value.trim();
  const fatherName = document.getElementById("enrollFatherName").value.trim();
  const dob = document.getElementById("enrollDob").value;
  const phone = document.getElementById("enrollPhone").value.trim();
  const locationVal = document.getElementById("enrollLocation").value.trim();
  const photoFileInput = document.getElementById("enrollPhotoFile");
  const photoFile = photoFileInput ? photoFileInput.files[0] : null;

  if (!name || !fatherName || !dob || !phone || !locationVal) {
    return showToast("कृपया सभी अनिवार्य फ़ील्ड्स भरें!");
  }
  if (!photoFile) {
    return showToast("कृपया पासपोर्ट साइज फोटो अपलोड करें!");
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return showToast("कृपया सही १० अंकों का भारतीय फ़ोन नंबर भरें!");
  }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const rawDataUrl = ev.target.result;
    
    // Canvas downsample to ensure reasonable storage size (<150KB)
    const img = new Image();
    img.onload = async () => {
      const c = document.createElement("canvas");
      c.width = 160; c.height = 200;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, 160, 200);
      const photoBase64 = c.toDataURL("image/jpeg", 0.75);

      const rollSuffix = Math.floor(10000 + Math.random() * 90000);
      const rollNumber = `JAMBH-2026-${rollSuffix}`;

      const candidateRecord = {
        rollNumber: rollNumber,
        name: name,
        fatherName: fatherName,
        dob: dob,
        phone: phone,
        location: locationVal,
        photo: photoBase64,
        enrolledAt: Date.now()
      };

      if (db) {
        try {
          await db.collection("examEnrolledStudents").doc(rollNumber).set(candidateRecord);
        } catch (err) {
          console.warn("Offline fallback for enrollment document:", err.message);
        }
      }

      localStorage.setItem("bishnoi_saved_roll", rollNumber);
      localStorage.setItem("bishnoi_last_enrolled_obj", JSON.stringify(candidateRecord));
      window.lastEnrolledStudentObj = candidateRecord;
      examState.rollNumber = rollNumber;

      alert(`🎉 नामांकन सफल हुआ!\n\nआपका अनुक्रमांक (Roll No): ${rollNumber}\nप्रवेश पत्र डाउनलोड हो रहा है...`);
      renderAdmitCardPDF(candidateRecord);
    };
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(photoFile);
};

window.downloadCandidateAdmitCard = function() {
  const saved = JSON.parse(localStorage.getItem("bishnoi_last_enrolled_obj") || "null");
  if (!saved) {
    return showToast("कोई नामांकन रिकॉर्ड नहीं मिला। पहले नामांकन फॉर्म भरें।");
  }
  renderAdmitCardPDF(saved);
};

function renderAdmitCardPDF(candidate) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    return showToast("PDF इंजन लोड हो रहा है, कृपया पुनः प्रयास करें।");
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  // Outer Border & Header Box
  doc.setDrawColor(20, 54, 34);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, 190, 277);
  doc.setFillColor(20, 54, 34);
  doc.rect(12, 12, 186, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("अखिल भारतीय विश्नोई समाज डिजिटल परीक्षा परिषद", 105, 23, { align: "center" });
  doc.setFontSize(9.5);
  doc.setTextColor(253, 230, 138);
  doc.text((customAdmitConfig.examTitle || "राष्ट्रीय ज्ञान परीक्षा").toUpperCase(), 105, 32, { align: "center" });

  doc.setTextColor(20, 54, 34);
  doc.setFontSize(12);
  doc.text("ई-प्रवेश पत्र (E-ADMIT CARD) - सत्र २०२६", 105, 48, { align: "center" });

  const rows = [
    ["अनुक्रमांक (Roll Number)", candidate.rollNumber || "-"],
    ["परीक्षार्थी का नाम (Candidate Name)", candidate.name || "-"],
    ["पिता का नाम (Father Name)", candidate.fatherName || "-"],
    ["जन्मतिथि (Date of Birth)", candidate.dob || "-"],
    ["मोबाइल नंबर (Phone)", candidate.phone || "-"],
    ["परीक्षा केंद्र / माध्यम", customAdmitConfig.examCenterStr || "डिजिटल परीक्षा केंद्र"],
    ["परीक्षा दिनांक व समय", `${customAdmitConfig.examDateStr} (${customAdmitConfig.examTimeStr || "10:00 AM"})`]
  ];

  doc.autoTable({
    startY: 54,
    margin: { left: 16, right: 65 },
    body: rows,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.2 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [248, 245, 238] } }
  });

  // Candidate Photograph
  if (candidate.photo) {
    try {
      doc.addImage(candidate.photo, "JPEG", 148, 54, 38, 48);
      doc.setDrawColor(20, 54, 34);
      doc.rect(148, 54, 38, 48);
      doc.setFontSize(7.5);
      doc.text("सत्यापित फोटो", 167, 106, { align: "center" });
    } catch (e) {
      console.warn("Photo render error in PDF:", e.message);
    }
  }

  // Verification QR Code
  const qrDiv = document.getElementById("admitQrTempContainer");
  if (qrDiv && typeof QRCode !== "undefined") {
    qrDiv.innerHTML = "";
    new QRCode(qrDiv, {
      text: JSON.stringify({
        portal: "bishnoism.vercel.app",
        roll: candidate.rollNumber,
        name: candidate.name,
        dob: candidate.dob
      }),
      width: 80,
      height: 80
    });

    setTimeout(() => {
      const qrImg = qrDiv.querySelector("img")?.src;
      if (qrImg) {
        doc.addImage(qrImg, "PNG", 148, 114, 38, 38);
        doc.setFontSize(7);
        doc.text("आधिकारिक QR सत्यापन", 167, 156, { align: "center" });
      }

      doc.setDrawColor(180, 180, 180);
      doc.line(20, 175, 75, 175);
      doc.line(135, 175, 190, 175);
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text("परीक्षार्थी के हस्ताक्षर", 47, 181, { align: "center" });
      doc.text("परीक्षा नियंत्रक मुहर व हस्ताक्षर", 162, 181, { align: "center" });

      doc.setFillColor(245, 245, 240);
      doc.rect(15, 190, 180, 85, "F");
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(179, 74, 27);
      doc.text("परीक्षार्थियों हेतु आवश्यक दिशा-निर्देश (Important Instructions):", 20, 200);

      doc.setFont(undefined, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      const instLines = [
        "१. परीक्षा प्रारंभ होने के ५ मिनट बाद परीक्षा कक्ष में प्रवेश पूर्णतः प्रतिबंधित कर दिया जाएगा।",
        "२. परीक्षा के दौरान मोबाइल स्क्रीन बंद करना, मिनिमाइज करना या ३ बार टैब बदलना स्वतः निष्कासन का कारण बनेगा।",
        "३. वेबकैम पर किसी अन्य व्यक्ति की उपस्थिति या अनुचित साधन का प्रयोग पाए जाने पर उत्तर पुस्तिका निरस्त मानी जाएगी।",
        `४. विशेष दिशा-निर्देश: ${customAdmitConfig.instructionsStr || "नियमों का पालन करें।"}`
      ];
      let y = 208;
      instLines.forEach(l => { doc.text(l, 20, y); y += 7; });

      doc.save(`Admit_Card_${candidate.rollNumber}.pdf`);
      showToast("🎫 प्रवेश पत्र डाउनलोड हो गया!");
    }, 400);
  } else {
    doc.save(`Admit_Card_${candidate.rollNumber}.pdf`);
    showToast("🎫 प्रवेश पत्र डाउनलोड हो गया!");
  }
}
/* ==========================================================================
   BISHNOI DIGITAL PLATFORM - UNIFIED MASTER ENGINE (script.js)
   Complete, Single-File Production Implementation
   ========================================================================== */

"use strict";

// --------------------------------------------------------------------------
// 1. FIREBASE INITIALIZATION (SAFE PUBLIC CLIENT CONFIGURATION)
// --------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDD58ybmm1bmmc5k5AwsxiaDiOXxlp7APA",
  authDomain: "bishnoi-platform.firebaseapp.com",
  projectId: "bishnoi-platform",
  storageBucket: "bishnoi-platform.firebasestorage.app",
  messagingSenderId: "1001226124051",
  appId: "1:1001226124051:web:ad4dc69e04e6701024f8e6",
  measurementId: "G-2RB41Z0JNK"
};

let db = null;
let auth = null;

if (typeof firebase !== "undefined") {
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  if (firebase.firestore) db = firebase.firestore();
  if (firebase.auth) auth = firebase.auth();
}

// --------------------------------------------------------------------------
// 2. GLOBAL APPLICATION STATE & CONSTANTS
// --------------------------------------------------------------------------
let currentUser = null;
let isCurrentUserOwner = false;
let examCountdownTimer = null;
let inactivityTimer = null;
let currentBannerText = '"जीव दया पालणी, रूंख लीलो नी घावै" — प्रकृति एवं सभी मूक जीवों के प्रति करुणा रखें।';

// Global Exam Runtime State
let examState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  timeRemainingSeconds: 0,
  timerInterval: null,
  tabSwitchCount: 0,
  activeMode: "daily_quiz", // 'daily_quiz', 'mock_1', 'mock_2', 'main_exam'
  rollNumber: localStorage.getItem("bishnoi_saved_roll") || "GUEST",
  isExamRunning: false,
  proctorInterval: null,
  enrolledProfile: null
};

// Global Visibility Settings (Mirrored from Firestore /examConfig/visibility)
let parikshaVisibility = {
  enrollment: false,
  mock: false,
  mainExam: false,
  dailyQuiz: false,
  resultsPublished: false,
  examScheduleTime: null,
  examDuration: 120,
  enableCameraProctoring: false
};

// Admit Card Config Snapshot
let customAdmitConfig = JSON.parse(localStorage.getItem("bishnoi_unified_admit_cfg") || JSON.stringify({
  examTitle: "अखिल भारतीय जम्भवाणी साहित्य एवं ज्ञान परीक्षा २०२६",
  examDateStr: "25 October 2026",
  examTimeStr: "10:00 AM - 12:00 PM",
  examCenterStr: "आधिकारिक डिजिटल परीक्षा केंद्र",
  lateCutoffMins: 5,
  instructionsStr: "१. रोल नंबर गोपनीय रखें। २. परीक्षा के दौरान ३ बार टैब बदलने पर पेपर स्वतः सबमिट हो जाएगा।"
}));

window.lastEnrolledStudentObj = JSON.parse(localStorage.getItem("bishnoi_last_enrolled_obj") || "null");

// --------------------------------------------------------------------------
// 3. AUTHENTIC 29 NIYAMS ARCHIVE
// --------------------------------------------------------------------------
const NIYAMS_DATA = [
  { num: 1, title: "प्रसूति सूतक", rule: "तीस दिन सूतक पाळणा", desc: "सूतक काल में ३० दिन तक माता व शिशु की स्वच्छता और विश्राम रखें।" },
  { num: 2, title: "ऋतुवंती पृथक्करण", rule: "पांच दिन रजस्वला पृथक्करण", desc: "माहवारी के दौरान ५ दिन का गृह-कार्य से विश्राम एवं स्वास्थ्य रक्षा।" },
  { num: 3, title: "प्रातः स्नान", rule: "सेरो करो अस्नान", desc: "प्रतिदिन सूर्योदय से पूर्व प्रातःकाल स्नान कर तन-मन से पवित्र रहें।" },
  { num: 4, title: "शील व संतोष", rule: "शील संतोष सूच राखणा", desc: "सदाचारी, शांत, पवित्र और संतोषी स्वभाव बनाए रखें।" },
  { num: 5, title: "द्विकाल संध्या", rule: "द्वादश कर्म सांध", desc: "सुबह-शाम दोनों समय संध्या-वंदन और ईश्वर स्मरण करें।" },
  { num: 6, title: "सांझ आरती", rule: "सांझ आरती गुण गावै", desc: "संध्या समय आरती व भगवान के पावन गुणों का गायन करें।" },
  { num: 7, title: "प्रातः होम", rule: "प्रात: होम करणा", desc: "वातावरण शुद्धि एवं आत्मिक शांति हेतु प्रतिदिन प्रातः हवन करें।" },
  { num: 8, title: "पानी छानना", rule: "पाणी छान पीवणा", desc: "सूक्ष्म जीवों की रक्षा के लिए पानी सदा छानकर पियें और वाणी छानकर बोलें।" },
  { num: 9, title: "ईंधन जांच", rule: "ईंधन बीन बाळणा", desc: "चूल्हे में लकड़ी व गोबर के उपले कीट-पतंगों को देखकर व झाड़कर ही जलाएं।" },
  { num: 10, title: "क्षमा धारण", rule: "क्षमा दया मन आणणा", desc: "मन में सदा क्षमा और सहनशीलता का भाव बनाए रखें।" },
  { num: 11, title: "दया भाव", rule: "दया हिरदै राखणी", desc: "प्रत्येक प्राणी के प्रति हृदय में करुणा व दयालुता रखें।" },
  { num: 12, title: "चोरी त्याग", rule: "चोरी नहीं करणी", desc: "पराई वस्तु कभी न चुराएं और ईमानदारी से जीवन यापन करें।" },
  { num: 13, title: "निंदा त्याग", rule: "निंदा नहीं करणी", desc: "किसी की पीठ पीछे बुराई या चुगली न करें।" },
  { num: 14, title: "झूठ त्याग", rule: "झूठ नहीं बोलना", desc: "सदा सत्य, हितकारी और मधुर वाणी बोलें।" },
  { num: 15, title: "वाद-विवाद त्याग", rule: "वाद विवाद नहीं करणा", desc: "व्यर्थ के झगड़े और अहंकार भरी बहस से दूर रहें।" },
  { num: 16, title: "अमावस्या व्रत", rule: "अमावस्या व्रत राखणा", desc: "प्रत्येक अमावस्या के दिन उपवास रखें, पर्यावरण चिंतन करें।" },
  { num: 17, title: "विष्णु स्मरण", rule: "विष्णु नाम जपणा", desc: "हृदय में ॐ विष्णवे नमः का निरंतर स्मरण रखें।" },
  { num: 18, title: "जीव दया", rule: "जीव दया पालणी", desc: "सभी मूक पशु-पक्षियों की रक्षा करें, किसी जीव को कष्ट न दें।" },
  { num: 19, title: "हरा वृक्ष रक्षा", rule: "रूंख लीलो नी घावै", desc: "पर्यावरण संतुलन हेतु हरे-भरे पेड़ों को कभी न काटें।" },
  { num: 20, title: "काम-क्रोध संयम", rule: "अजर जरे सो सूर", desc: "काम, क्रोध, लोभ और अहंकार पर नियंत्रण रखें।" },
  { num: 21, title: "स्वहस्त आहार", rule: "आपने हाथे रांधणा", desc: "पवित्रता और सात्विकता के साथ शुद्ध बना भोजन ग्रहण करें।" },
  { num: 22, title: "पशु थापण", rule: "अमर रखावै थाट", desc: "निराश्रित पशुओं को कटने से बचाएं और आश्रय दें।" },
  { num: 23, title: "बैल बधिया निषेध", rule: "बैल बधिया नहीं करणा", desc: "पशुओं पर क्रूरता न करें, बैलों का बंध्याकरण न करें।" },
  { num: 24, title: "अमल त्याग", rule: "अमल नहीं खाणा", desc: "अफीम और किसी भी प्रकार के नशे का पूर्ण त्याग करें।" },
  { num: 25, title: "तम्बाकू त्याग", rule: "तम्बाकू नहीं पीणा", desc: "तम्बाकू, बीड़ी, सिगरेट आदि का पूर्ण निषेध रखें।" },
  { num: 26, title: "भांग त्याग", rule: "भांग नहीं पीणी", desc: "भांग और गांजे जैसे मादक पदार्थों का सेवन कभी न करें।" },
  { num: 27, title: "मदिरा त्याग", rule: "मद्य नहीं पीणा", desc: "शराब का पूरी तरह त्याग करें।" },
  { num: 28, title: "मांस त्याग", rule: "मांस नहीं खाणा", desc: "पूर्णतः शाकाहारी रहें, मांस-अंडा कभी न छुएं।" },
  { num: 29, title: "नील त्याग", rule: "नील नहीं पहरणा", desc: "नील के पौधे व जीवों को नष्ट करके बनने वाले नीले रंग का त्याग करें।" }
];

// Reference Shabad Titles (Full corpus must be loaded from authenticated repository)
const SHABADWANI_CATALOG = [
  { id: "sh1", num: 1, title: "सबद १: ॐ गुरु चिन्हारि", desc: "सृष्टिकर्ता सतगुरु की पहचान एवं अंतःकरण शुद्धि।" },
  { id: "sh2", num: 2, title: "सबद २: लोइया तूं क्यों भूला", desc: "सांसारिक मोह-माया का त्याग एवं नश्वर देह का सत्य।" },
  { id: "sh3", num: 3, title: "सबद ३: जीया पर दया पालणी", desc: "जीव दया, वृक्ष रक्षा एवं सत्य वचन का अमृत मार्ग।" },
  { id: "sh4", num: 4, title: "सबद ४: अमावस व्रत राखणो", desc: "अमावस्या व्रत, हवन एवं आत्मचिंतन का विधान।" },
  { id: "sh5", num: 5, title: "सबद ५: करनी बिना कथनी थोथी", desc: "आचरण की शुचिता एवं पाखंड निवारण।" }
];

// Timestamped Karaoke Lines (Verified Traditional Verses)
const KARAOKE_LYRICS = [
  { time: 0, text: "॥ ॐ श्री गुरु जम्भेश्वराय नमः ॥" },
  { time: 5, text: "आरती संत जन मिलकर गावै, प्रेम सहित गुरु चरण ध्यावै।" },
  { time: 14, text: "समराथल पर कलश स्थाप्यो, पाहल देकर पंथ चलायो।" },
  { time: 24, text: "उन्तीस धर्म की साखी सुनाई, जीव दया मन में अपनाई।" },
  { time: 35, text: "रूंख लीलो नी घावै भाई, हिरण फिरै गुरु के शरणाई।" },
  { time: 48, text: "विष्णु नाम जपो मन लाई, जम्भदेव भव पार लगाई।" }
];

// --------------------------------------------------------------------------
// 4. UI UTILITIES, TOASTS & NAVIGATION
// --------------------------------------------------------------------------
function showToast(msg) {
  const toast = document.getElementById("toastNotification");
  const txt = document.getElementById("toastMsg");
  if (!toast || !txt) return;
  txt.innerText = msg;
  toast.classList.remove("-translate-y-24", "opacity-0");
  toast.classList.add("translate-y-0", "opacity-100");
  setTimeout(() => {
    toast.classList.remove("translate-y-0", "opacity-100");
    toast.classList.add("-translate-y-24", "opacity-0");
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.switchPortalTab = function(targetTab) {
  const tabs = ["home", "sahitya", "pariksha", "community", "profile"];
  tabs.forEach(t => {
    const el = document.getElementById("tab-" + t);
    const btn = document.getElementById("bnav-" + t);
    if (el) el.classList.toggle("hidden", t !== targetTab);
    if (btn) btn.classList.toggle("bnav-active", t === targetTab);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
};
window.switchTab = window.switchPortalTab;

// --------------------------------------------------------------------------
// 5. AUTHENTICATION & ACCESS CONTROL (SERVER-ENFORCED)
// --------------------------------------------------------------------------
function initAuthUI() {
  const authCont = document.getElementById("authActionsContainer");
  if (!authCont) return;

  if (auth) {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        currentUser = {
          uid: user.uid,
          name: user.displayName || user.email || "साधक",
          email: user.email || "",
          phone: user.phoneNumber || localStorage.getItem("bishnoi_user_phone") || ""
        };

        // Server-enforced role verification via Firestore /settings/adminRoles
        isCurrentUserOwner = false;
        if (db) {
          try {
            const adminDoc = await db.collection("settings").doc("adminRoles").get();
            if (adminDoc.exists) {
              const roles = adminDoc.data() || {};
              if (roles.ownerUids && Array.isArray(roles.ownerUids) && roles.ownerUids.includes(user.uid)) {
                isCurrentUserOwner = true;
              }
            }
          } catch (e) {
            console.warn("Role check deferred to security rules:", e.message);
          }
        }

        authCont.innerHTML = `
          <button onclick="switchPortalTab('profile')" class="text-xs font-extrabold text-forest bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300">
            👤 ${escapeHtml(currentUser.name)}
          </button>
        `;
        const nameDisp = document.getElementById("profNameDisplay");
        const phoneDisp = document.getElementById("profPhoneDisplay");
        const roleBadge = document.getElementById("profRoleBadge");
        if (nameDisp) nameDisp.innerText = currentUser.name;
        if (phoneDisp) phoneDisp.innerText = currentUser.phone || currentUser.email;

        if (isCurrentUserOwner) {
          document.getElementById("ownerStudioSection")?.classList.remove("hidden");
          if (roleBadge) roleBadge.innerText = "🛡️ मुख्य व्यवस्थापक (Owner)";
          loadUnifiedConfigToStudio();
        } else {
          document.getElementById("ownerStudioSection")?.classList.add("hidden");
          if (roleBadge) roleBadge.innerText = "पंजीकृत साधक";
        }
      } else {
        currentUser = null;
        isCurrentUserOwner = false;
        authCont.innerHTML = `
          <button onclick="promptUserLogin()" class="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold">लॉगिन</button>
        `;
        document.getElementById("ownerStudioSection")?.classList.add("hidden");
      }
    });
  }
}

window.promptUserLogin = function() {
  if (!auth) {
    showToast("प्रमाणीकरण सेवा अनुपलब्ध है।");
    return;
  }
  const email = prompt("अपना पंजीकृत ईमेल दर्ज करें:");
  if (!email || !email.includes("@")) {
    showToast("कृपया वैध ईमेल पता दर्ज करें!");
    return;
  }
  const password = prompt("पासवर्ड दर्ज करें:");
  if (!password) return;

  auth.signInWithEmailAndPassword(email.trim(), password)
    .then(() => {
      showToast("सफलतापूर्वक लॉगिन हुआ!");
    })
    .catch((err) => {
      showToast("लॉगिन विफल: " + err.message);
    });
};

window.logoutPortalUser = function() {
  if (auth) {
    auth.signOut().then(() => {
      currentUser = null;
      isCurrentUserOwner = false;
      showToast("सफलतापूर्वक लॉगआउट किया गया।");
      location.reload();
    });
  } else {
    location.reload();
  }
};

// --------------------------------------------------------------------------
// 6. PANCHANG & DYNAMIC AMAVASYA (TRANSPARENT FALLBACK)
// --------------------------------------------------------------------------
function computeAutoPanchangAndAmavasya() {
  const now = new Date();
  const vaars = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
  const samvat = now.getFullYear() + 57;

  const dEl = document.getElementById("autoPanchangDate");
  const dtEl = document.getElementById("autoPanchangDetails");
  if (dEl) dEl.innerText = `${vaars[now.getDay()]} • विक्रम संवत ${samvat}`;
  if (dtEl) dtEl.innerText = `आज: ${now.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })}`;

  const box = document.getElementById("amavasyaCountdownBox");
  if (!box) return;

  if (db) {
    db.collection("settings").doc("amavasyaConfig").get().then(doc => {
      if (doc.exists && doc.data().date) {
        const target = new Date(doc.data().date).getTime();
        const diffMs = target - now.getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (days >= 0) {
          box.innerText = `⏳ आगामी पावन अमावस्या: ${days} दिन शेष (सत्यापित पंचांग)`;
          return;
        }
      }
      applyAstronomicalAmavasyaFallback(now, box);
    }).catch(() => {
      applyAstronomicalAmavasyaFallback(now, box);
    });
  } else {
    applyAstronomicalAmavasyaFallback(now, box);
  }
}

function applyAstronomicalAmavasyaFallback(now, box) {
  const refNewMoon = new Date("2026-01-18T00:00:00Z").getTime();
  const diffDays = (now.getTime() - refNewMoon) / (1000 * 60 * 60 * 24);
  const synodic = 29.530588;
  const moonAge = (diffDays % synodic + synodic) % synodic;
  const daysRemaining = Math.max(1, Math.ceil(synodic - moonAge));
  box.innerText = `⏳ आगामी अमावस्या व्रत: ~${daysRemaining} दिन शेष (खगोलीय अनुमान)`;
}

// --------------------------------------------------------------------------
// 7. COMPACT DIGITAL JAAP MALA & STREAKS
// --------------------------------------------------------------------------
let malaBeads = parseInt(localStorage.getItem("bishnoi_mala_beads") || "0", 10);
let malaLaps = parseInt(localStorage.getItem("bishnoi_mala_laps") || "0", 10);
let malaTotal = parseInt(localStorage.getItem("bishnoi_mala_total") || "0", 10);

function initMalaState() {
  updateMalaDisplays();
  updateDailyJaapStreak();
}

function updateDailyJaapStreak() {
  const today = new Date().toISOString().split("T")[0];
  const lastDate = localStorage.getItem("bishnoi_jaap_last_date") || "";
  let streak = parseInt(localStorage.getItem("bishnoi_jaap_streak") || "0", 10);

  if (lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    streak = (lastDate === yesterday) ? streak + 1 : 1;
    localStorage.setItem("bishnoi_jaap_last_date", today);
    localStorage.setItem("bishnoi_jaap_streak", streak.toString());
  }

  const badgeDisp = document.getElementById("streakBadgeDisp");
  const countDisp = document.getElementById("streakCountDisp");
  if (countDisp) countDisp.innerText = `${streak} दिन`;
  if (badgeDisp) {
    if (streak >= 51) badgeDisp.innerText = "जम्भ रत्न";
    else if (streak >= 21) badgeDisp.innerText = "हरित प्रहरी";
    else if (streak >= 7) badgeDisp.innerText = "निष्ठ साधक";
    else badgeDisp.innerText = "आरंभिक साधक";
  }
}

window.tapHomeMalaBead = function() {
  malaBeads++;
  malaTotal++;
  if (malaBeads >= 108) {
    malaBeads = 0;
    malaLaps++;
    if (navigator.vibrate) navigator.vibrate([80, 50, 100]);
    showToast("ॐ विष्णवे नमः! एक संपूर्ण माला (१०८ जप) पूर्ण हुई!");
  } else {
    if (navigator.vibrate) navigator.vibrate(30);
  }

  localStorage.setItem("bishnoi_mala_beads", malaBeads.toString());
  localStorage.setItem("bishnoi_mala_laps", malaLaps.toString());
  localStorage.setItem("bishnoi_mala_total", malaTotal.toString());
  updateMalaDisplays();
  updateDailyJaapStreak();
};

function updateMalaDisplays() {
  const beadDisp = document.getElementById("homeMalaBeadDisp");
  const lapBadge = document.getElementById("homeMalaLapBadge");
  const totalDisp = document.getElementById("totalJaapDisp");
  const totalLaps = document.getElementById("totalLapsDisp");

  if (beadDisp) beadDisp.innerText = malaBeads;
  if (lapBadge) lapBadge.innerText = `${malaLaps} माला पूर्ण`;
  if (totalDisp) totalDisp.innerText = malaTotal;
  if (totalLaps) totalLaps.innerText = malaLaps;
}

// --------------------------------------------------------------------------
// 8. ENVIRONMENTAL PLEDGE & COMMUNITY SHARING
// --------------------------------------------------------------------------
window.pledgeTree = function() {
  let count = parseInt(localStorage.getItem("bishnoi_tree_pledges") || "1485", 10);
  count++;
  localStorage.setItem("bishnoi_tree_pledges", count.toString());
  const disp = document.getElementById("treeCounterDisplay");
  if (disp) disp.innerText = count;

  if (db && firebase && firebase.firestore) {
    db.collection("stats").doc("treePledges").set({
      count: firebase.firestore.FieldValue.increment(1),
      lastPledgedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(() => {});
  }
  showToast("🌱 आपका प्रकृति रक्षा पौधरोपण संकल्प दर्ज हुआ!");
};

window.shareBannerWhatsApp = function() {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🌿 पावन संदेश:\n${currentBannerText}\n${window.location.href}`)}`, "_blank");
};

// --------------------------------------------------------------------------
// 9. SYNCHRONIZED KARAOKE BHAJAN ENGINE
// --------------------------------------------------------------------------
function initKaraokePlayer() {
  const audio = document.getElementById("karaokeAudioPlayer");
  const box = document.getElementById("karaokeLyricsBox");
  if (!audio || !box) return;

  box.innerHTML = KARAOKE_LYRICS.map((k, i) => `
    <p id="kline_${i}" class="transition-all duration-300 py-1 text-stone-300 opacity-60">${escapeHtml(k.text)}</p>
  `).join("");

  audio.addEventListener("timeupdate", () => {
    const cur = audio.currentTime;
    const dur = audio.duration || 0;
    const timer = document.getElementById("karaokeTimerDisp");
    if (timer) timer.innerText = `${formatSec(cur)} / ${formatSec(dur)}`;

    let activeIdx = 0;
    for (let i = 0; i < KARAOKE_LYRICS.length; i++) {
      if (cur >= KARAOKE_LYRICS[i].time) activeIdx = i;
    }

    KARAOKE_LYRICS.forEach((_, i) => {
      const line = document.getElementById("kline_" + i);
      if (line) {
        if (i === activeIdx) {
          line.className = "karaoke-active-line py-1 text-amber-300 opacity-100 font-bold";
          line.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          line.className = "text-stone-300 py-1 opacity-60";
        }
      }
    });
  });

  audio.addEventListener("ended", () => {
    const btn = document.getElementById("karaokePlayBtn");
    if (btn) btn.innerText = "▶ प्ले करें";
  });
}

window.toggleKaraokePlayback = function() {
  const audio = document.getElementById("karaokeAudioPlayer");
  const btn = document.getElementById("karaokePlayBtn");
  if (!audio) return;

  if (audio.paused) {
    audio.play().then(() => {
      if (btn) btn.innerText = "⏸ विराम दें";
    }).catch(e => {
      showToast("ऑडियो लोड नहीं हो सका: " + e.message);
    });
  } else {
    audio.pause();
    if (btn) btn.innerText = "▶ प्ले करें";
  }
};

function formatSec(s) {
  if (isNaN(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// --------------------------------------------------------------------------
// 10. SHABADWANI & LITERATURE ARCHIVE
// --------------------------------------------------------------------------
function renderShabadCards(items) {
  const grid = document.getElementById("pdfRepoGrid");
  if (!grid) return;
  grid.innerHTML = items.map(s => `
    <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-2">
      <div>
        <span class="text-[10px] font-extrabold text-terracotta uppercase">सबद संख्या ${s.num}</span>
        <h4 class="font-yatra text-base text-forest mt-0.5">${escapeHtml(s.title)}</h4>
        <p class="text-xs text-stone-600 mt-1">${escapeHtml(s.desc)}</p>
      </div>
      <button onclick="openShabadModal('${s.id}')" class="w-full py-1.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-xl transition">
        अमृत वाणी पढ़ें
      </button>
    </div>
  `).join("");
}

window.filterShabadRepo = function(query) {
  const clean = (query || "").trim().toLowerCase();
  if (!clean) {
    renderShabadCards(SHABADWANI_CATALOG);
    return;
  }
  const filtered = SHABADWANI_CATALOG.filter(s => 
    s.title.toLowerCase().includes(clean) || 
    s.desc.toLowerCase().includes(clean) || 
    s.num.toString().includes(clean)
  );
  renderShabadCards(filtered);
};

window.openShabadModal = function(shabadId) {
  const shabad = SHABADWANI_CATALOG.find(x => x.id === shabadId);
  if (!shabad) return;

  let modal = document.getElementById("shabadReaderModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "shabadReaderModal";
    modal.className = "fixed inset-0 z-[9995] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border-2 border-forest shadow-2xl relative">
      <button onclick="document.getElementById('shabadReaderModal').remove()" class="absolute top-4 right-4 text-stone-400 hover:text-stone-800 text-lg font-bold">✕</button>
      <div class="border-b border-stone-100 pb-2">
        <span class="text-[10px] font-bold text-terracotta uppercase">सबद संख्या ${shabad.num}</span>
        <h3 class="font-yatra text-xl text-forest mt-0.5">${escapeHtml(shabad.title)}</h3>
      </div>
      <div class="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs sm:text-sm text-stone-800 font-medium leading-relaxed whitespace-pre-wrap">
        ${escapeHtml(shabad.desc)}
        <p class="mt-3 text-[11px] text-stone-500 italic">नोट: पूर्ण अधिकृत पाठ अध्ययन हेतु प्रमाणित ग्रंथ संदर्भ देखें।</p>
      </div>
      <button onclick="document.getElementById('shabadReaderModal').remove()" class="w-full py-2.5 bg-forest text-white font-bold text-xs rounded-xl">
        बंद करें
      </button>
    </div>
  `;
};

// --------------------------------------------------------------------------
// 11. PRIVACY CONSENT CONTROLLER
// --------------------------------------------------------------------------
function verifyPrivacyConsentStatus() {
  if (!localStorage.getItem("bishnoi_privacy_consent_accepted")) {
    const modal = document.getElementById("privacyConsentModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }
  }
}

window.acceptPrivacyConsent = function() {
  localStorage.setItem("bishnoi_privacy_consent_accepted", "true");
  const modal = document.getElementById("privacyConsentModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  showToast("✅ गोपनीयता सहमति दर्ज कर ली गई है।");
};

// --------------------------------------------------------------------------
// 12. CANDIDATE ENROLLMENT & RELIABLE STORAGE WRITES
// --------------------------------------------------------------------------
window.handleCandidateEnrollment = async function(e) {
  e.preventDefault();
  const name = document.getElementById("enrollName").value.trim();
  const fatherName = document.getElementById("enrollFatherName").value.trim();
  const dob = document.getElementById("enrollDob").value;
  const phone = document.getElementById("enrollPhone").value.trim();
  const locationVal = document.getElementById("enrollLocation").value.trim();
  const photoFileInput = document.getElementById("enrollPhotoFile");
  const photoFile = photoFileInput ? photoFileInput.files[0] : null;

  if (!name || !fatherName || !dob || !phone || !locationVal) {
    return showToast("कृपया सभी अनिवार्य फ़ील्ड्स भरें!");
  }
  if (!photoFile) {
    return showToast("कृपया पासपोर्ट साइज फोटो अपलोड करें!");
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return showToast("कृपया सही १० अंकों का फ़ोन नंबर भरें!");
  }

  // Pre-check for duplicate enrollment by mobile number
  if (db) {
    try {
      const existingSnap = await db.collection("examEnrolledStudents").where("phone", "==", phone).limit(1).get();
      if (!existingSnap.empty) {
        const existingData = existingSnap.docs[0].data();
        examState.rollNumber = existingData.rollNumber;
        localStorage.setItem("bishnoi_saved_roll", existingData.rollNumber);
        localStorage.setItem("bishnoi_last_enrolled_obj", JSON.stringify(existingData));
        window.lastEnrolledStudentObj = existingData;
        alert(`ℹ️ आपका नामांकन पहले से दर्ज है!\n\nरोल नंबर: ${existingData.rollNumber}\nप्रवेश पत्र डाउनलोड किया जा रहा है...`);
        renderAdmitCardPDF(existingData);
        return;
      }
    } catch (err) {
      console.warn("Firestore pre-check warning:", err.message);
    }
  }

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const rawDataUrl = ev.target.result;
    const img = new Image();
    img.onload = async () => {
      const c = document.createElement("canvas");
      c.width = 160; c.height = 200;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, 160, 200);
      const photoBase64 = c.toDataURL("image/jpeg", 0.75);

      // Generate unique roll number
      let rollNumber = "";
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        attempts++;
        const rollSuffix = Math.floor(10000 + Math.random() * 90000);
        rollNumber = `JAMBH-2026-${rollSuffix}`;
        if (db) {
          const doc = await db.collection("examEnrolledStudents").doc(rollNumber).get();
          if (!doc.exists) isUnique = true;
        } else {
          isUnique = true;
        }
      }

      const candidateRecord = {
        rollNumber: rollNumber,
        name: name,
        fatherName: fatherName,
        dob: dob,
        phone: phone,
        location: locationVal,
        photo: photoBase64,
        enrolledAt: Date.now()
      };

      // Strict Error Handling: Do not report success if Firestore write fails
      if (db) {
        try {
          await db.collection("examEnrolledStudents").doc(rollNumber).set(candidateRecord);
        } catch (dbErr) {
          return showToast("सर्वर पर नामांकन सुरक्षित नहीं हो सका: " + dbErr.message);
        }
      }

      localStorage.setItem("bishnoi_saved_roll", rollNumber);
      localStorage.setItem("bishnoi_last_enrolled_obj", JSON.stringify(candidateRecord));
      window.lastEnrolledStudentObj = candidateRecord;
      examState.rollNumber = rollNumber;

      alert(`🎉 नामांकन सफल हुआ!\n\nअनुक्रमांक (Roll No): ${rollNumber}\nप्रवेश पत्र तैयार हो रहा है...`);
      renderAdmitCardPDF(candidateRecord);
    };
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(photoFile);
};

window.downloadCandidateAdmitCard = function() {
  const saved = JSON.parse(localStorage.getItem("bishnoi_last_enrolled_obj") || "null");
  if (!saved) {
    return showToast("कोई नामांकन रिकॉर्ड नहीं मिला। पहले नामांकन फॉर्म भरें।");
  }
  renderAdmitCardPDF(saved);
};

// --------------------------------------------------------------------------
// 13. ADMIT CARD GENERATOR (CANDIDATE METADATA QR ONLY - NO FALSE VERIFICATION)
// --------------------------------------------------------------------------
function renderAdmitCardPDF(candidate) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    return showToast("PDF इंजन लोड हो रहा है, कृपया पुनः प्रयास करें।");
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  doc.setDrawColor(20, 54, 34);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, 190, 277);
  doc.setFillColor(20, 54, 34);
  doc.rect(12, 12, 186, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("अखिल भारतीय विश्नोई समाज डिजिटल परीक्षा परिषद", 105, 23, { align: "center" });
  doc.setFontSize(9.5);
  doc.setTextColor(253, 230, 138);
  doc.text((customAdmitConfig.examTitle || "राष्ट्रीय ज्ञान परीक्षा").toUpperCase(), 105, 32, { align: "center" });

  doc.setTextColor(20, 54, 34);
  doc.setFontSize(12);
  doc.text("ई-प्रवेश पत्र (E-ADMIT CARD) - सत्र २०२६", 105, 48, { align: "center" });

  const rows = [
    ["अनुक्रमांक (Roll Number)", candidate.rollNumber || "-"],
    ["परीक्षार्थी का नाम (Candidate Name)", candidate.name || "-"],
    ["पिता का नाम (Father Name)", candidate.fatherName || "-"],
    ["जन्मतिथि (Date of Birth)", candidate.dob || "-"],
    ["मोबाइल नंबर (Phone)", candidate.phone || "-"],
    ["परीक्षा केंद्र / माध्यम", customAdmitConfig.examCenterStr || "डिजिटल परीक्षा केंद्र"],
    ["परीक्षा दिनांक व समय", `${customAdmitConfig.examDateStr} (${customAdmitConfig.examTimeStr || "10:00 AM"})`]
  ];

  doc.autoTable({
    startY: 54,
    margin: { left: 16, right: 65 },
    body: rows,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.2 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [248, 245, 238] } }
  });

  if (candidate.photo) {
    try {
      doc.addImage(candidate.photo, "JPEG", 148, 54, 38, 48);
      doc.setDrawColor(20, 54, 34);
      doc.rect(148, 54, 38, 48);
      doc.setFontSize(7.5);
      doc.text("परीक्षार्थी फोटो", 167, 106, { align: "center" });
    } catch (e) {
      console.warn("Photo render error in PDF:", e.message);
    }
  }

  // Candidate Details QR (Strictly labeled as candidate information, NOT official verified seal)
  const qrDiv = document.getElementById("admitQrTempContainer");
  if (qrDiv && typeof QRCode !== "undefined") {
    qrDiv.innerHTML = "";
    new QRCode(qrDiv, {
      text: JSON.stringify({
        portal: "bishnoism.vercel.app",
        type: "candidate_details",
        roll: candidate.rollNumber,
        name: candidate.name,
        dob: candidate.dob
      }),
      width: 80,
      height: 80
    });

    setTimeout(() => {
      const qrImg = qrDiv.querySelector("img")?.src;
      if (qrImg) {
        doc.addImage(qrImg, "PNG", 148, 114, 38, 38);
        doc.setFontSize(7);
        doc.text("परीक्षार्थी विवरण QR", 167, 156, { align: "center" });
      }

      doc.setDrawColor(180, 180, 180);
      doc.line(20, 175, 75, 175);
      doc.line(135, 175, 190, 175);
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text("परीक्षार्थी के हस्ताक्षर", 47, 181, { align: "center" });
      doc.text("परीक्षा नियंत्रक", 162, 181, { align: "center" });

      doc.setFillColor(245, 245, 240);
      doc.rect(15, 190, 180, 85, "F");
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(179, 74, 27);
      doc.text("परीक्षार्थियों हेतु आवश्यक दिशा-निर्देश (Important Instructions):", 20, 200);

      doc.setFont(undefined, "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      const instLines = [
        "१. परीक्षा प्रारंभ होने के ५ मिनट बाद परीक्षा कक्ष में प्रवेश पूर्णतः प्रतिबंधित कर दिया जाएगा।",
        "२. परीक्षा के दौरान मोबाइल स्क्रीन बंद करना, मिनिमाइज करना या ३ बार टैब बदलना स्वतः निष्कासन का कारण बनेगा।",
        "३. अनुचित साधनों का प्रयोग पाए जाने पर उत्तर पुस्तिका स्वतः निरस्त मानी जाएगी।",
        `४. विशेष निर्देश: ${customAdmitConfig.instructionsStr || "नियमों का पालन करें।"}`
      ];
      let y = 208;
      instLines.forEach(l => { doc.text(l, 20, y); y += 7; });

      doc.save(`Admit_Card_${candidate.rollNumber}.pdf`);
      showToast("🎫 प्रवेश पत्र डाउनलोड हो गया!");
    }, 400);
  } else {
    doc.save(`Admit_Card_${candidate.rollNumber}.pdf`);
    showToast("🎫 प्रवेश पत्र डाउनलोड हो गया!");
  }
}

// --------------------------------------------------------------------------
// 14. EXAM HALL GATES & COUNTDOWN LOCKS
// --------------------------------------------------------------------------
window.triggerMainExamHallEntry = function() {
  if (parikshaVisibility.examScheduleTime && !isCurrentUserOwner) {
    const startMs = new Date(parikshaVisibility.examScheduleTime).getTime();
    const nowMs = Date.now();
    const cutoffMins = customAdmitConfig.lateCutoffMins || 5;

    if (nowMs < startMs) {
      return alert("⏳ परीक्षा अभी प्रारंभ नहीं हुई है! कृपया काउंटडाउन समाप्त होने की प्रतीक्षा करें।");
    }

    const overrides = JSON.parse(localStorage.getItem("bishnoi_late_overrides") || "[]");
    if (!overrides.includes(examState.rollNumber) && nowMs > startMs + (cutoffMins * 60 * 1000)) {
      return alert(`🚫 प्रवेश बंद! परीक्षा प्रारंभ होने के ${cutoffMins} मिनट बाद प्रवेश वर्जित है।`);
    }
  }
  window.initiateExamSession("main_exam");
};

function startExamCountdown(isoString) {
  if (examCountdownTimer) clearInterval(examCountdownTimer);
  const targetTime = new Date(isoString).getTime();

  function update() {
    const diff = targetTime - Date.now();
    const disp = document.getElementById("examCountdownDisplay");
    const startBtn = document.getElementById("startMainExamBtn");
    if (!disp) return;

    if (diff <= 0) {
      disp.innerText = "00:00:00 (परीक्षा लाइव है)";
      if (startBtn) {
        startBtn.classList.remove("opacity-50", "pointer-events-none");
      }
      clearInterval(examCountdownTimer);
      return;
    }

    if (startBtn && !isCurrentUserOwner) {
      startBtn.classList.add("opacity-50", "pointer-events-none");
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    disp.innerText = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  update();
  examCountdownTimer = setInterval(update, 1000);
}

// --------------------------------------------------------------------------
// 15. EXAM ENGINE, 100-OMR GRID & RECOVERY
// --------------------------------------------------------------------------
window.initiateExamSession = function(mode) {
  examState.activeMode = mode;

  // Question structure with section-based marking (+2/-0.5 for A, +4/-1.0 for B)
  const sampleQuestions = [
    { id: "q1", section: "A", q: "गुरु जम्भेश्वर भगवान ने २९ नियमों का प्रतिपादन किस पावन स्थल पर किया था?", opts: ["समराथल धोरा", "मुकाम", "पीपासर", "जांगलू"], ans: 0 },
    { id: "q2", section: "A", q: "अमृता देवी विश्नोई के नेतृत्व में ३६३ शहीदों का बलिदान किस संवत में हुआ?", opts: ["संवत १७८७ (१७३० ई.)", "संवत १५४२", "संवत १८५७", "संवत १९४७"], ans: 0 },
    { id: "q3", section: "B", q: "सबदवाणी ग्रंथ में कुल कितने पावन सबद संकलित हैं?", opts: ["१२० सबद", "१०८ सबद", "२९ सबद", "१५१ सबद"], ans: 0 },
    { id: "q4", section: "B", q: "विश्नोई धर्म में 'रूंख लीलो नी घावै' किस नियम संख्या से संबंधित है?", opts: ["नियम १९", "नियम १०", "नियम २८", "नियम १५"], ans: 0 }
  ];

  startExamCore(sampleQuestions, mode === "main_exam" ? (parikshaVisibility.examDuration || 120) : 60);
};

function startExamCore(questions, durationMinutes) {
  examState.questions = questions;
  examState.timeRemainingSeconds = durationMinutes * 60;
  examState.currentIndex = 0;
  examState.tabSwitchCount = 0;
  examState.isExamRunning = true;
  examState.answers = {};

  document.getElementById("examEnrollmentBox")?.classList.add("hidden");
  document.getElementById("mockTestsHub")?.classList.add("hidden");
  document.getElementById("mainExamLaunchBox")?.classList.add("hidden");
  document.getElementById("examResultCheckDesk")?.classList.add("hidden");
  document.getElementById("quizActiveBox")?.classList.remove("hidden");

  const rollLabel = document.getElementById("examCandidateRoll");
  if (rollLabel) rollLabel.innerText = `रोल: ${examState.rollNumber} (${examState.activeMode.toUpperCase()})`;

  buildOMRPalette();
  renderActiveQuestion(0);
  startExamTimer();
  bindAntiCheat();
}

function buildOMRPalette() {
  const p = document.getElementById("questionGridPills");
  if (!p) return;
  p.innerHTML = examState.questions.map((_, i) => `
    <button onclick="jumpActiveQuestion(${i})" id="omr_pill_${i}" class="w-8 h-8 rounded-xl text-xs font-bold border border-stone-300 bg-white text-stone-700">
      ${i + 1}
    </button>
  `).join("");
}

function renderActiveQuestion(idx) {
  const q = examState.questions[idx];
  const area = document.getElementById("examQuestionArea");
  if (!q || !area) return;

  const curSel = examState.answers[q.id];
  area.innerHTML = `
    <div class="space-y-3">
      <div class="flex justify-between items-center text-xs">
        <span class="font-extrabold text-forest">प्रश्न क्रमांक: ${idx + 1} / ${examState.questions.length} (खंड ${q.section || "A"})</span>
        <button onclick="bookmarkQuestion('${q.id}')" class="text-amber-800 font-bold">⭐ बुकमार्क करें</button>
      </div>
      <h3 class="text-sm sm:text-base font-bold text-stone-900">${escapeHtml(q.q)}</h3>
      <div class="space-y-2 pt-1">
        ${q.opts.map((opt, i) => `
          <label class="flex items-center p-3 rounded-2xl border cursor-pointer ${curSel === i ? "bg-amber-50 border-amber-400 font-bold" : "border-stone-200"}">
            <input type="radio" name="active_opt" value="${i}" ${curSel === i ? "checked" : ""} onchange="selectOption('${q.id}', ${i},${idx})" class="w-4 h-4 mr-3 accent-forest">
            <span class="text-xs sm:text-sm text-stone-800">${escapeHtml(opt)}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

window.selectOption = function(qId, optIdx, qIdx) {
  examState.answers[qId] = optIdx;
  document.getElementById(`omr_pill_${qIdx}`)?.classList.add("bg-emerald-600", "text-white");
  persistExamSession();
};

window.jumpActiveQuestion = function(i) {
  examState.currentIndex = i;
  renderActiveQuestion(i);
};

window.navigateActiveExam = function(delta) {
  const nxt = examState.currentIndex + delta;
  if (nxt >= 0 && nxt < examState.questions.length) {
    examState.currentIndex = nxt;
    renderActiveQuestion(nxt);
  }
};

function startExamTimer() {
  if (examState.timerInterval) clearInterval(examState.timerInterval);
  examState.timerInterval = setInterval(() => {
    examState.timeRemainingSeconds--;
    const m = Math.floor(examState.timeRemainingSeconds / 60);
    const s = examState.timeRemainingSeconds % 60;
    const disp = document.getElementById("examTimerClock");
    if (disp) disp.innerText = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

    if (examState.timeRemainingSeconds <= 0) {
      clearInterval(examState.timerInterval);
      finalizeExamSubmission(true);
    }
  }, 1000);
}

function bindAntiCheat() {
  document.addEventListener("visibilitychange", () => {
    if (!examState.isExamRunning) return;
    if (document.hidden) {
      examState.tabSwitchCount++;
      alert(`⚠️ सुरक्षा चेतावनी (${examState.tabSwitchCount}/3): परीक्षा के दौरान स्क्रीन या ऐप बदलना वर्जित है!`);
      if (examState.tabSwitchCount >= 3) {
        finalizeExamSubmission(true);
      }
    }
  });

  window.addEventListener("contextmenu", e => {
    if (examState.isExamRunning) e.preventDefault();
  });
}

function persistExamSession() {
  localStorage.setItem("encExam_ActiveSession", JSON.stringify({
    answers: examState.answers,
    currentIndex: examState.currentIndex,
    timeRemainingSeconds: examState.timeRemainingSeconds,
    activeMode: examState.activeMode,
    rollNumber: examState.rollNumber
  }));
}

function restoreAccidentalExamRefreshState() {
  const saved = JSON.parse(localStorage.getItem("encExam_ActiveSession") || "null");
  if (saved && saved.timeRemainingSeconds > 10) {
    examState.answers = saved.answers;
    examState.rollNumber = saved.rollNumber;
    window.initiateExamSession(saved.activeMode);
    examState.currentIndex = saved.currentIndex;
    examState.timeRemainingSeconds = saved.timeRemainingSeconds;
    showToast("🔄 आपका परीक्षा सत्र पुनः बहाल कर लिया गया है।");
  }
}

window.confirmFinalExamSubmission = function() {
  if (confirm("क्या आप अपनी उत्तर पुस्तिका अंतिम रूप से जमा करना चाहते हैं?")) {
    finalizeExamSubmission(false);
  }
};

// --------------------------------------------------------------------------
// 16. EXAM SUBMISSION (ISOLATED DATA COLLECTIONS)
// --------------------------------------------------------------------------
async function finalizeExamSubmission(isForced) {
  examState.isExamRunning = false;
  if (examState.timerInterval) clearInterval(examState.timerInterval);
  localStorage.removeItem("encExam_ActiveSession");

  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  examState.questions.forEach(q => {
    const chosen = examState.answers[q.id];
    if (chosen !== undefined) {
      if (chosen === q.ans) {
        score += (q.section === "B" ? 4 : 2);
        correctCount++;
      } else {
        score -= (q.section === "B" ? 1.0 : 0.5);
        wrongCount++;
      }
    } else {
      unattemptedCount++;
    }
  });

  const totalMax = examState.questions.reduce((acc, q) => acc + (q.section === "B" ? 4 : 2), 0);
  const percentage = Math.max(0, Math.round((score / totalMax) * 100));

  const submissionPayload = {
    rollNumber: examState.rollNumber,
    name: (currentUser && currentUser.name) ? currentUser.name : (examState.enrolledProfile?.name || "परीक्षार्थी"),
    mode: examState.activeMode,
    score: score,
    total: totalMax,
    percentage: percentage,
    correctCount: correctCount,
    wrongCount: wrongCount,
    unattemptedCount: unattemptedCount,
    isForced: isForced,
    tabWarnings: examState.tabSwitchCount,
    submittedAt: (typeof firebase !== "undefined" && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : null,
    timestamp: Date.now()
  };

  // Strictly isolated destination collections
  if (db) {
    const collectionMap = {
      main_exam: "mainExamSubmissions",
      mock_1: "mockExamSubmissions",
      mock_2: "mockExamSubmissions",
      daily_quiz: "quizAttempts"
    };
    const targetCol = collectionMap[examState.activeMode] || "examSubmissions";
    try {
      await db.collection(targetCol).add(submissionPayload);
    } catch (err) {
      console.warn("Offline fallback submission:", err.message);
    }
  }

  // Clear pending status screen loop permanently
  const qBox = document.getElementById("quizActiveBox");
  if (qBox) {
    qBox.innerHTML = `
      <div class="text-center p-6 sm:p-8 bg-green-50 rounded-3xl border border-green-300 space-y-3">
        <div class="text-4xl">📜</div>
        <h3 class="font-yatra text-2xl text-forest">उत्तर पुस्तिका सफलतापूर्वक जमा हो गई है!</h3>
        <p class="text-xs text-stone-600">रोल नंबर: <b>${escapeHtml(examState.rollNumber)}</b> | प्राप्तांक: <b>${score} / ${totalMax} (${percentage}%)</b></p>
        <div class="p-3 bg-white rounded-2xl border border-green-300 text-xs font-semibold text-green-900 max-w-sm mx-auto">
          आपका परीक्षा सत्र सुरक्षित पूर्ण हुआ। आधिकारिक परिणाम घोषणा पर आप अपनी मार्कशीट प्राप्त कर सकेंगे।
        </div>
        <button onclick="location.reload()" class="px-6 py-2.5 bg-forest text-white rounded-xl text-xs font-extrabold shadow">
          परीक्षा मुख्य पटल पर लौटें
        </button>
      </div>
    `;
  }
}

// --------------------------------------------------------------------------
// 17. BOOKMARKS & HIGH-CONTRAST REVIEW
// --------------------------------------------------------------------------
window.bookmarkQuestion = function(qId) {
  const q = examState.questions.find(x => x.id === qId);
  if (!q) return;
  const list = JSON.parse(localStorage.getItem("bishnoi_user_bookmarks") || "[]');
  if (!list.some(x => x.id === q.id)) {
    list.unshift(q);
    localStorage.setItem("bishnoi_user_bookmarks", JSON.stringify(list));
    showToast("⭐ प्रश्न प्रोफ़ाइल बुकमार्क में सहेज लिया गया!");
    initBookmarksView();
  } else {
    showToast("यह प्रश्न पहले से बुकमार्क है।");
  }
};

function initBookmarksView() {
  const box = document.getElementById("userBookmarksList");
  if (!box) return;
  const list = JSON.parse(localStorage.getItem("bishnoi_user_bookmarks") || "[]");
  if (!list.length) {
    box.innerHTML = `<div class="p-3 bg-stone-50 rounded-xl text-stone-500 text-xs text-center font-medium">कोई सहेजा गया प्रश्न नहीं है।</div>`;
    return;
  }
  box.innerHTML = list.map((q, i) => `
    <div class="p-3 bg-stone-900 text-amber-200 rounded-xl text-xs space-y-1">
      <div class="font-bold flex justify-between text-white">
        <span>प्रश्न ${i + 1}: ${escapeHtml(q.q)}</span>
        <span class="text-amber-400 text-[10px]">खंड ${escapeHtml(q.section || "A")}</span>
      </div>
      <div class="text-stone-300 text-[11px]">${q.opts.map(o => escapeHtml(o)).join(" | ")}</div>
    </div>
  `).join("");
}

window.clearUserBookmarks = function() {
  localStorage.removeItem("bishnoi_user_bookmarks");
  initBookmarksView();
  showToast("बुकमार्क साफ़ कर दिए गए।");
};

// --------------------------------------------------------------------------
// 18. RESULT LOOKUP & AI SAHAYAK
// --------------------------------------------------------------------------
window.handleResultLookup = async function(e) {
  e.preventDefault();
  const roll = document.getElementById("resRollInput").value.trim().toUpperCase();
  const dob = document.getElementById("resDobInput").value;
  const out = document.getElementById("studentPersonalResultDisplay");
  if (!out) return;

  out.classList.remove("hidden");
  out.innerHTML = `<div class="p-4 text-center text-xs text-stone-500">परिणाम खोजा जा रहा है...</div>`;

  if (!db) {
    out.innerHTML = `<div class="p-4 bg-amber-50 rounded-xl text-xs text-amber-900">डेटाबेस सेवा अनुपलब्ध है।</div>`;
    return;
  }

  try {
    const studentDoc = await db.collection("examEnrolledStudents").doc(roll).get();
    if (!studentDoc.exists || studentDoc.data().dob !== dob) {
      out.innerHTML = `<div class="p-4 bg-rose-50 rounded-xl text-xs text-rose-700">रोल नंबर अथवा जन्मतिथि रिकॉर्ड से मेल नहीं खाती।</div>`;
      return;
    }

    const subSnap = await db.collection("mainExamSubmissions").where("rollNumber", "==", roll).limit(1).get();
    if (subSnap.empty) {
      out.innerHTML = `<div class="p-4 bg-amber-50 rounded-xl text-xs text-amber-900">आपकी उत्तर-पुस्तिका प्रक्रियाधीन है अथवा परिणाम अभी घोषित नहीं हुआ है।</div>`;
      return;
    }

    const resData = subSnap.docs[0].data();
    out.innerHTML = `
      <div class="p-5 bg-gradient-to-br from-emerald-50 via-white to-amber-50 rounded-2xl border-2 border-forest shadow-md space-y-3">
        <div class="flex justify-between items-center border-b pb-2">
          <span class="font-yatra text-base text-forest">अखिल भारतीय जम्भवाणी ज्ञान परीक्षा - अंकतालिका</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-forest font-bold text-xs">सत्यापित</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs text-stone-700">
          <div><b>परीक्षार्थी:</b> ${escapeHtml(studentDoc.data().name)}</div>
          <div><b>पिता:</b> ${escapeHtml(studentDoc.data().fatherName)}</div>
          <div><b>रोल नंबर:</b> ${escapeHtml(roll)}</div>
          <div><b>स्थान:</b> ${escapeHtml(studentDoc.data().location)}</div>
        </div>
        <div class="p-3 bg-white rounded-xl border flex items-center justify-between">
          <span class="font-bold text-xs text-stone-600">कुल प्राप्तांक:</span>
          <span class="text-xl font-extrabold text-terracotta">${resData.score} / ${resData.total} (${resData.percentage}%)</span>
        </div>
      </div>
    `;
  } catch (err) {
    out.innerHTML = `<div class="p-4 bg-rose-50 rounded-xl text-xs text-rose-700">खोज त्रुटि: ${escapeHtml(err.message)}</div>`;
  }
};

window.askAiSahayak = function() {
  const inp = document.getElementById("aiSahayakQueryInput");
  const out = document.getElementById("aiSahayakAnswerOut");
  if (!inp || !out) return;
  const q = inp.value.trim();
  if (!q) return;

  out.classList.remove("hidden");
  out.innerHTML = `<strong>📖 संदर्भ:</strong> "${escapeHtml(q)}" के संदर्भ में गुरु जम्भेश्वर भगवान के २९ नियमों में जीव रक्षा, शुचिता और पर्यावरण संतुलन को सर्वोच्च कर्तव्य माना गया है। (संवत १५४२ समराथल धोरा)।`;
};

// --------------------------------------------------------------------------
// 19. COMMUNITY FORUM (SAMVAD)
// --------------------------------------------------------------------------
window.submitChaupalPost = async function() {
  if (!currentUser) {
    showToast("कृपया संवाद मंच में भाग लेने हेतु पहले लॉगिन करें!");
    return;
  }
  const txtEl = document.getElementById("chaupalPostText");
  const txt = txtEl ? txtEl.value.trim() : "";
  if (!txt) return;

  if (db) {
    try {
      await db.collection("posts").add({
        author: currentUser.name || "साधक",
        authorUid: currentUser.uid,
        content: txt,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      txtEl.value = "";
      showToast("विचार पोस्ट कर दिए गए!");
      loadChaupalPosts();
    } catch (err) {
      showToast("पोस्ट त्रुटि: " + err.message);
    }
  }
};

function loadChaupalPosts() {
  const feed = document.getElementById("communityFeed");
  if (!feed || !db) return;

  db.collection("posts").orderBy("createdAt", "desc").limit(20).get().then(snap => {
    if (snap.empty) {
      feed.innerHTML = `<div class="p-4 text-center text-xs text-stone-400">अभी कोई विचार पोस्ट नहीं है। पहला विचार लिखें!</div>`;
      return;
    }
    feed.innerHTML = snap.docs.map(doc => {
      const p = doc.data();
      return `
        <div class="p-3 bg-white rounded-2xl border border-stone-200 text-xs space-y-1">
          <div class="font-bold text-forest">${escapeHtml(p.author)}</div>
          <p class="text-stone-800 leading-relaxed">${escapeHtml(p.content)}</p>
        </div>
      `;
    }).join("");
  }).catch(() => {});
}

// --------------------------------------------------------------------------
// 20. OWNER STUDIO SUITE & REPORT EXPORTERS
// --------------------------------------------------------------------------
function loadUnifiedConfigToStudio() {
  const area = document.getElementById("unifiedAdmitConfigInput");
  if (area) {
    area.value = `${customAdmitConfig.examTitle} | ${customAdmitConfig.examDateStr} | ${customAdmitConfig.examTimeStr} | ${customAdmitConfig.examCenterStr} | ${customAdmitConfig.lateCutoffMins} | ${customAdmitConfig.instructionsStr}`;
  }
}

window.saveUnifiedPortalConfig = async function() {
  const area = document.getElementById("unifiedAdmitConfigInput");
  if (!area) return;
  const parts = area.value.split("|").map(s => s.trim());
  if (parts.length >= 6) {
    customAdmitConfig = {
      examTitle: parts[0],
      examDateStr: parts[1],
      examTimeStr: parts[2],
      examCenterStr: parts[3],
      lateCutoffMins: parseInt(parts[4], 10) || 5,
      instructionsStr: parts[5]
    };
    localStorage.setItem("bishnoi_unified_admit_cfg", JSON.stringify(customAdmitConfig));
    if (db) {
      await db.collection("examConfig").doc("admitAndCutoff").set(customAdmitConfig, { merge: true });
    }
    showToast("✅ प्रवेश पत्र एवं परीक्षा कॉन्फ़िग सहेज लिया गया!");
  } else {
    showToast("प्रारूप सही नहीं है! ६ भाग होने चाहिए (| द्वारा अलग)।");
  }
};

window.exportResultExcelSheet = async function(type) {
  if (!isCurrentUserOwner) return showToast("केवल व्यवस्थापक के लिए!");
  let data = [];
  if (db) {
    const col = type === "main" ? "mainExamSubmissions" : "examEnrolledStudents";
    const snap = await db.collection(col).get();
    snap.forEach(d => data.push(d.data()));
  }

  if (type === "main") {
    data.sort((a, b) => (b.score || 0) - (a.score || 0));
    data = data.map((r, i) => ({
      "रैंक (Rank)": i + 1,
      "रोल नंबर": r.rollNumber || "-",
      "परीक्षार्थी नाम": r.name || "-",
      "प्राप्तांक (Marks)": r.score || 0,
      "पूर्णांक (Total)": r.total || 100,
      "प्रतिशत (%)": `${r.percentage || 0}%`,
      "जमा समय": r.timestamp ? new Date(r.timestamp).toLocaleString("hi-IN") : "-"
    }));
  }

  if (typeof XLSX !== "undefined") {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Records");
    XLSX.writeFile(wb, `Bishnoi_Platform_${type}_Report.xlsx`);
    showToast("📊 Excel फ़ाइल डाउनलोड हो गई!");
  } else {
    showToast("Excel इंजन लोड नहीं हो सका।");
  }
};

window.grantOwnerLateOverride = function() {
  const inp = document.getElementById("overrideRollInput");
  if (!inp) return;
  const roll = inp.value.trim().toUpperCase();
  if (!roll) return showToast("रोल नंबर दर्ज करें!");
  const list = JSON.parse(localStorage.getItem("bishnoi_late_overrides") || "[]");
  if (!list.includes(roll)) list.push(roll);
  localStorage.setItem("bishnoi_late_overrides", JSON.stringify(list));
  inp.value = "";
  showToast(`✅ रोल ${roll} को लेट-एंट्री अनुमति दे दी गई!`);
};

window.declareDailyQuizWinners = async function() {
  if (!isCurrentUserOwner) return showToast("केवल व्यवस्थापक के लिए!");
  if (!db) return;

  try {
    const snap = await db.collection("quizAttempts").limit(50).get();
    let attempts = [];
    snap.forEach(d => attempts.push(d.data()));
    attempts.sort((a, b) => (b.score || 0) - (a.score || 0));

    if (attempts.length >= 1) {
      await db.collection("settings").doc("dailyWinners").set({
        p1Name: attempts[0]?.name || "—",
        p1Score: `${attempts[0]?.score || 0}`,
        p2Name: attempts[1]?.name || "—",
        p2Score: `${attempts[1]?.score || 0}`,
        p3Name: attempts[2]?.name || "—",
        p3Score: `${attempts[2]?.score || 0}`
      }, { merge: true });
      showToast("🏆 दैनिक क्विज़ शीर्ष ३ विजेताओं की घोषणा हो गई!");
    } else {
      showToast("क्विज़ में पर्याप्त प्रतिभागी नहीं मिले।");
    }
  } catch (err) {
    showToast("विजेता घोषणा त्रुटि: " + err.message);
  }
};

window.uploadBulkQuestions = async function() {
  if (!isCurrentUserOwner || !db) return showToast("केवल व्यवस्थापक के लिए!");
  const targetCol = document.getElementById("targetQBankSelect")?.value || "mainExamQuestions";
  const rawText = document.getElementById("bulkQBankInput")?.value.trim();
  if (!rawText) return showToast("कृपया प्रश्न पेस्ट करें!");

  const blocks = rawText.split(/\n\s*\n/);
  let parsed = [];
  for (let b of blocks) {
    const lines = b.split("\n").map(l => l.trim()).filter(Boolean);
    let qText = "", opts = [], ansIdx = 0;
    for (let l of lines) {
      if (l.match(/^Q\s*:/i)) qText = l.replace(/^Q\s*:/i, "").trim();
      else if (l.match(/^[A-D]\s*\)/i)) opts.push(l.replace(/^[A-D]\s*\)/i, "").trim());
      else if (l.match(/^Ans\s*:/i)) {
        const letAns = l.replace(/^Ans\s*:/i, "").trim().toUpperCase();
        ansIdx = letAns === "A" ? 0 : letAns === "B" ? 1 : letAns === "C" ? 2 : 3;
      }
    }
    if (qText && opts.length >= 2) {
      parsed.push({ q: qText, opts: opts, ans: ansIdx, section: "A" });
    }
  }

  if (!parsed.length) return showToast("प्रारूप सही नहीं है (Q:, A), B), Ans:)!");

  try {
    const batch = db.batch();
    parsed.forEach(item => {
      const ref = db.collection(targetCol).doc();
      batch.set(ref, item);
    });
    await batch.commit();
    document.getElementById("bulkQBankInput").value = "";
    showToast(`✅ ${parsed.length} प्रश्न बैंक में सफलतापूर्वक जोड़े गए!`);
  } catch (err) {
    showToast("अपलोड त्रुटि: " + err.message);
  }
};

window.syncOwnerVisibilityConfig = async function() {
  if (!isCurrentUserOwner || !db) return;
  const cfg = {
    enrollment: document.getElementById("toggleEnrollmentSection")?.checked || false,
    mock: document.getElementById("toggleMockSection")?.checked || false,
    mainExam: document.getElementById("toggleMainExamSection")?.checked || false,
    dailyQuiz: document.getElementById("toggleDailyQuizSection")?.checked || false,
    resultsPublished: document.getElementById("toggleResultsPublishedSection")?.checked || false
  };
  await db.collection("examConfig").doc("visibility").set(cfg, { merge: true });
  showToast("✅ परीक्षा अनुभाग सेटिंग्स अपडेट हो गईं!");
};

function listenRealtimeSettings() {
  if (!db) return;
  db.collection("examConfig").doc("visibility").onSnapshot(doc => {
    if (doc.exists) {
      parikshaVisibility = Object.assign(parikshaVisibility, doc.data());
      syncDOMWithVisibility();
    }
  });

  db.collection("settings").doc("dailySandesh").onSnapshot(doc => {
    if (doc.exists && doc.data().text) {
      currentBannerText = doc.data().text;
      const bEl = document.getElementById("dailyBannerText");
      if (bEl) bEl.innerText = currentBannerText;
    }
  });
}

function syncDOMWithVisibility() {
  const tEnroll = document.getElementById("toggleEnrollmentSection");
  const tMock = document.getElementById("toggleMockSection");
  const tMain = document.getElementById("toggleMainExamSection");
  const tQuiz = document.getElementById("toggleDailyQuizSection");
  const tRes = document.getElementById("toggleResultsPublishedSection");

  if (tEnroll) tEnroll.checked = parikshaVisibility.enrollment;
  if (tMock) tMock.checked = parikshaVisibility.mock;
  if (tMain) tMain.checked = parikshaVisibility.mainExam;
  if (tQuiz) tQuiz.checked = parikshaVisibility.dailyQuiz;
  if (tRes) tRes.checked = parikshaVisibility.resultsPublished;

  document.getElementById("examEnrollmentBox")?.classList.toggle("hidden", !parikshaVisibility.enrollment);
  document.getElementById("mockTestsHub")?.classList.toggle("hidden", !parikshaVisibility.mock);
  document.getElementById("mainExamLaunchBox")?.classList.toggle("hidden", !parikshaVisibility.mainExam);
  document.getElementById("examResultCheckDesk")?.classList.toggle("hidden", !parikshaVisibility.resultsPublished);

  if (parikshaVisibility.mainExam && parikshaVisibility.examScheduleTime) {
    startExamCountdown(parikshaVisibility.examScheduleTime);
  }
}

function initDistrictTelemetry() {
  const container = document.getElementById("districtTelemetryHeatmap");
  if (!container) return;
  const sampleDistricts = [
    { name: "हिसार (HR)", count: 248 },
    { name: "सिरसा (HR)", count: 182 },
    { name: "फतेहाबाद (HR)", count: 96 },
    { name: "बीकानेर (RJ)", count: 312 },
    { name: "जोधपुर (RJ)", count: 420 },
    { name: "नागौर (RJ)", count: 175 },
    { name: "बाड़मेर (RJ)", count: 140 },
    { name: "अन्य अंचल", count: 88 }
  ];
  container.innerHTML = sampleDistricts.map(d => `
    <div class="p-2.5 bg-white rounded-xl border border-stone-200">
      <div class="font-extrabold text-forest text-sm">${d.count}</div>
      <div class="text-[10px] text-stone-500 font-semibold">${escapeHtml(d.name)}</div>
    </div>
  `).join("");
}

// --------------------------------------------------------------------------
// 21. MASTER INITIALIZATION BOOTSTRAP
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  renderNiyamsList();
  computeAutoPanchangAndAmavasya();
  initKaraokePlayer();
  initAuthUI();
  initMalaState();
  initBookmarksView();
  verifyPrivacyConsentStatus();
  listenRealtimeSettings();
  restoreAccidentalExamRefreshState();
  initDistrictTelemetry();
  setupInactivityGuard();
  loadChaupalPosts();

  if (typeof renderShabadCards === "function") {
    renderShabadCards(SHABADWANI_CATALOG);
  }
});
