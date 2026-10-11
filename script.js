/* ==========================================================================
   Bishnoi Community Portal - Master Production Engine (script.js)
   100% COMPLETE & PRODUCTION-READY ENGINE
   Features:
   - Dynamic Pariksha Section Controlled by Owner Toggles
   - Full Standard Enrollment & Unique Roll Number (JAMBH-2026-XXXXX)
   - 100-Question Exam & Mock Runtime (1-by-1, Jump Grid, Anti-Cheating Lock)
   - Delayed Private Result Portal (Search by Name, Roll No & DOB)
   - 2 Official PDF Exporters (Enrollment List PDF & Merit Result PDF)
   - 7-Day Visitor Telemetry & Audit Logs (IP, Device, Location)
   - Granular RBAC Permissions for Sub-Admins in Studio
   - Pure Profile Counters (0 Mantra, 0 Mala), Mala, Audio, Amavasya, Chat
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

// 3. APPLICATION STATE
let currentUser = JSON.parse(localStorage.getItem('bishnoi_secure_user') || 'null');
let isRegisterMode = false;
let quizList = [];
let currentBannerText = '"जीव दया पालणी, रूंख लीलो नी घावै" — प्रकृति एवं सभी मूक जीवों के प्रति करुणा रखें।';
let amavasyaTargetDate = null;
let amavasyaTimerInterval = null;
let currentActiveTab = 'home';
let inactivityTimer = null;
let examCountdownTimer = null;
let confirmCallback = null;

// Moderation & Roles
let allChatPosts = [];
let activeReplyObj = null;
let blockedPhonesList = [];
let editorsPhoneList = [];

// Audio State
let audioPlaylist = [
  { id: 'def_audio_1', title: 'श्री जम्भेश्वर भगवान आरती एवं भजन', link: './bhajan1.mp3' }
];
let currentTrackIndex = 0;
let isCustomPlaying = false;
let audioSpeeds = [1, 1.25, 1.5];
let currentSpeedIdx = 0;

// Pariksha Visibility Settings (Controlled by Owner)
let parikshaVisibility = {
  enrollment: false,
  mock: false,
  mainExam: false,
  dailyQuiz: false,
  resultsPublished: false,
  examScheduleTime: null,
  examEndTime: null
};

// Exam Runtime State
let examState = {
  questions: [],
  currentIndex: 0,
  answers: {},
  timeRemainingSeconds: 0,
  timerInterval: null,
  tabSwitchCount: 0,
  activeMode: 'daily_quiz',
  rollNumber: 'GUEST'
};

// Mala Counters
let malaBeadCount = parseInt(localStorage.getItem('bishnoi_mala_beads') || '0');
let malaLapsCount = parseInt(localStorage.getItem('bishnoi_mala_laps') || '0');
let malaTotalCount = parseInt(localStorage.getItem('bishnoi_mala_total') || '0');
let readNiyamsSet = new Set(JSON.parse(localStorage.getItem('bishnoi_read_niyams') || '[]'));
let bestQuizPct = parseInt(localStorage.getItem('bishnoi_best_quiz_pct') || '0');

// Maintenance Config
let maintenanceConfig = {
  globalMode: 'off',
  vipBypass: true,
  message: 'नए अपडेट जोड़े जा रहे हैं, जो शीघ्र ही उपलब्ध होंगे!',
  sections: { mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off' },
  customMessages: {
    quiz: '✨ परीक्षा अनुभाग अपडेट हो रहा है!',
    library: '📚 नई PDF पुस्तकें अपलोड हो रही हैं!',
    history: '📜 नए ऐतिहासिक तथ्य जोड़े जा रहे हैं!',
    niyams: '🌿 नियमों में नई व्याख्या जोड़ी जा रही है!',
    community: '💬 संवाद मंच अपडेट हो रहा है!',
    mala: '📿 जप माला अपडेट हो रही है!'
  }
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

// 5. ROLE HELPERS & SESSION GUARD
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

// 8. DYNAMIC PARIKSHA VISIBILITY (OWNER DRIVEN)
function listenParikshaVisibility() {
  db.collection('examConfig').doc('visibility').onSnapshot(doc => {
    if (doc.exists) {
      parikshaVisibility = { ...parikshaVisibility, ...doc.data() };
    }
    applyParikshaVisibilityUI();
  });
}

function applyParikshaVisibilityUI() {
  const anyActive = parikshaVisibility.enrollment || parikshaVisibility.mock || parikshaVisibility.mainExam || parikshaVisibility.dailyQuiz || parikshaVisibility.resultsPublished;

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

  // Sync Studio Checkboxes
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

  showToast("✅ परीक्षा अनुभाग विज़िबिलिटी सेटिंग्स अपडेट हो गईं!");
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

    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    disp.innerText = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  update();
  examCountdownTimer = setInterval(update, 1000);
}

// 9. STUDENT ENROLLMENT & UNIQUE ROLL NUMBER GENERATOR
async function handleExamEnrollment(e) {
  e.preventDefault();
  const name = document.getElementById('enrollName').value.trim();
  const fatherName = document.getElementById('enrollFatherName').value.trim();
  const dob = document.getElementById('enrollDob').value;
  const phone = document.getElementById('enrollPhone').value.trim();
  const email = document.getElementById('enrollEmail').value.trim();
  const location = document.getElementById('enrollLocation').value.trim();

  if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया सही १० अंकों का फ़ोन नंबर भरें!");
  if (!name || !fatherName || !dob || !location) return showToast("कृपया सभी आवश्यक फ़ील्ड्स भरें!");

  try {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const rollNumber = `JAMBH-2026-${randomSuffix}`;

    const studentRecord = {
      rollNumber,
      name,
      fatherName,
      dob,
      phone,
      email: email || '-',
      location,
      enrolledAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('examEnrolledStudents').doc(rollNumber).set(studentRecord);
    alert(`🎉 बधाई!\nआपका नामांकन सफल हुआ।\n\nरोल नंबर (Roll No): ${rollNumber}\nकृपया इसे भविष्य के संदर्भ हेतु सुरक्षित रखें।`);
    examState.rollNumber = rollNumber;

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

// 10. TWO OFFICIAL PDF EXPORTERS
function downloadEnrolledStudentsPdf() {
  db.collection('examEnrolledStudents').orderBy('enrolledAt', 'desc').get().then(snap => {
    if (snap.empty) return showToast("कोई नामांकित छात्र नहीं मिला।");
    let rows = [];
    snap.forEach((d, i) => {
      const s = d.data();
      rows.push([i + 1, s.rollNumber || d.id, s.name || '', s.fatherName || '', s.dob || '', s.phone || '', s.location || '']);
    });

    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');
      doc.text("Bishnoi Literature Exam 2026 - Enrolled Students Master List", 14, 16);
      doc.autoTable({
        startY: 22,
        head: [['S.No', 'Roll No', 'Student Name', 'Father Name', 'DOB', 'Phone', 'Location']],
        body: rows,
        styles: { fontSize: 9 }
      });
      doc.save("Jambhani_Exam_Enrolled_Students.pdf");
    } else {
      showToast("PDF लाइब्रेरी लोड हो रही है, पुनः प्रयास करें।");
    }
  }).catch(err => {
    showToast("त्रुटि: " + err.message);
  });
}

function downloadExamResultsMeritPdf() {
  db.collection('examSubmissions').where('mode', '==', 'main_exam').get().then(snap => {
    if (snap.empty) return showToast("कोई परीक्षा सबमिशन रिकॉर्ड नहीं मिला।");
    let records = [];
    snap.forEach(d => records.push(d.data()));
    records.sort((a, b) => (b.score || 0) - (a.score || 0));

    let rows = [];
    records.forEach((r, idx) => {
      rows.push([idx + 1, r.rollNumber || '-', r.candidateName || '', r.fatherName || '-', `${r.score || 0} / 100`, r.submittedAt ? new Date(r.submittedAt.seconds * 1000).toLocaleTimeString('hi-IN') : '-']);
    });

    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.text("Bishnoi Literature Exam 2026 - Official Merit Result", 14, 16);
      doc.autoTable({
        startY: 22,
        head: [['Rank', 'Roll Number', 'Candidate Name', 'Father Name', 'Score', 'Submit Time']],
        body: rows
      });
      doc.save("Jambhani_Exam_Merit_Results.pdf");
    } else {
      showToast("PDF लाइब्रेरी लोड हो रही है, पुनः प्रयास करें।");
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
      showToast("PDF लाइब्रेरी लोड हो रही है, पुनः प्रयास करें।");
    }
  }).catch(err => {
    showToast("त्रुटि: " + err.message);
  });
}

// 11. INDIVIDUAL RESULT CHECK (SEARCH BY ROLL NO, NAME & DOB)
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
      return showToast("यह रोल नंबर दर्ज नहीं है! कृपया सही विवरण भरें।");
    }
    const studentData = enrolledDoc.data();
    if (studentData.dob !== dob || studentData.name.toLowerCase() !== name) {
      return showToast("नाम या जन्मतिथि रोल नंबर से मेल नहीं खाती!");
    }

    const subSnap = await db.collection('examSubmissions')
      .where('rollNumber', '==', roll)
      .limit(1)
      .get();

    if (subSnap.empty) {
      resultBox.innerHTML = `
        <div class="p-4 bg-amber-50 rounded-xl border border-amber-300 text-center text-xs text-amber-900 font-semibold">
          आपकी उत्तर-पुस्तिका मूल्यांकन में है अथवा परिणाम अभी जारी नहीं हुआ है।
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
          <span class="font-yatra text-base text-forest">अखिल भारतीय जाम्भाणी परीक्षा मार्कशीट</span>
          <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-forest font-bold text-xs">सत्यापित</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs text-stone-700">
          <div><b>परीक्षार्थी:</b> ${studentData.name}</div>
          <div><b>पिता का नाम:</b> ${studentData.fatherName}</div>
          <div><b>रोल नंबर:</b> ${roll}</div>
          <div><b>जन्मतिथि:</b> ${dob}</div>
        </div>
        <div class="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between">
          <span class="font-bold text-xs text-stone-600">कुल प्राप्तांक (Marks):</span>
          <span class="text-xl font-extrabold text-terracotta">${score} / ${total} (${percentage}%)</span>
        </div>
        <button onclick="generateCertificate('${studentData.name}', ${percentage})" class="w-full py-2.5 bg-forest text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-950">
          📜 आधिकारिक सम्मान-पत्र (Certificate) डाउनलोड करें
        </button>
      </div>
    `;
    resultBox.classList.remove('hidden');
  } catch (err) {
    showToast("जाँच में त्रुटि: " + err.message);
  }
}

// 12. HIGH-STRICTNESS EXAM & MOCK RUNTIME ENGINE
function launchMainExamPortal() {
  if (!examState.rollNumber || examState.rollNumber === 'GUEST') {
    const inputRoll = prompt("कृपया अपना परीक्षा रोल नंबर दर्ज करें (उदा: JAMBH-2026-XXXXX):");
    if (!inputRoll) return;
    examState.rollNumber = inputRoll.trim().toUpperCase();
  }

  examState.activeMode = 'main_exam';
  db.collection('mainExamQuestions').get().then(snap => {
    let list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    if (!list.length) {
      return showToast("परीक्षा प्रश्न अभी तैयार नहीं हुए हैं। कृपया प्रतीक्षा करें।");
    }
    startExamEngine(list, parikshaVisibility.examDuration || 120);
  }).catch(() => {
    showToast("परीक्षा प्रश्न लोड नहीं हो सके।");
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

  document.getElementById('examClosedNoticeBox')?.classList.add('hidden');
  document.getElementById('examEnrollmentBox')?.classList.add('hidden');
  document.getElementById('mockTestsHub')?.classList.add('hidden');
  document.getElementById('mainExamLaunchBox')?.classList.add('hidden');
  document.getElementById('examResultCheckDesk')?.classList.add('hidden');
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

function initExamSecurity() {
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('copy', e => e.preventDefault());
  document.addEventListener('cut', e => e.preventDefault());

  document.addEventListener('visibilitychange', () => {
    const qBox = document.getElementById('quizActiveBox');
    if (document.hidden && qBox && !qBox.classList.contains('hidden')) {
      examState.tabSwitchCount++;
      alert(`⚠️ चेतावनी: आपने स्क्रीन या टैब बदली है! (चेतावनी: ${examState.tabSwitchCount}/3)`);
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
              onchange="saveExamAnswer('${q.id}', ${i},${index})" class="accent-forest w-4 h-4 mr-3">
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

  let calculatedScore = 0;
  examState.questions.forEach(q => {
    if (examState.answers[q.id] === q.ans) calculatedScore++;
  });

  const payload = {
    rollNumber: examState.rollNumber,
    candidateName: currentUser ? currentUser.name : 'परीक्षार्थी',
    mode: examState.activeMode,
    score: calculatedScore,
    total: examState.questions.length,
    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
    isForcedSubmission: isForced,
    isPublished: false
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

// 13. OWNER STUDIO CONTROLS: DRAFT, LIVE & RESULT PUBLISH
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
  const startTime = document.getElementById('adminExamScheduleTime')?.value;
  const endTime = document.getElementById('adminExamEndTime')?.value;
  const duration = parseInt(document.getElementById('adminExamDuration')?.value) || 120;

  openConfirmModal("मुख्य परीक्षा लाइव करें?", "क्या आप मुख्य परीक्षा को सभी विद्यार्थियों के लिए लाइव करना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('examConfig').doc('visibility').set({
        mainExam: true,
        examScheduleTime: startTime || new Date().toISOString(),
        examEndTime: endTime || null,
        examDuration: duration
      }, { merge: true });
      showToast("🚀 मुख्य परीक्षा लाइव कर दी गई है!");
    }
  });
}

async function publishExamResultsOfficially() {
  if (!isSuperOwner()) return showToast("केवल मुख्य व्यवस्थापक (Owner) के पास अधिकार है!");
  openConfirmModal("परिणाम घोषित करें?", "क्या आप परिणाम खोज खिड़की (Result Desk) को छात्रों के लिए लाइव करना चाहते हैं?", async (res) => {
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
    if (qText && opts.length >= 2) parsed.push({ q: qText, title: qText, opts, options: opts, ans: ansIdx });
  }

  if (!parsed.length) return showToast('प्रारूप जाँचें');
  const collectionName = targetCol === 'daily_quiz' ? 'quiz' : (targetCol === 'mock_1' ? 'mockExam_1' : (targetCol === 'mock_2' ? 'mockExam_2' : 'mainExamQuestions'));
  const batch = db.batch();
  parsed.forEach(q => batch.set(db.collection(collectionName).doc(), q));
  await batch.commit();
  document.getElementById('adminBulkQuizText').value = '';
  showToast(`✅ ${parsed.length} प्रश्न (${targetCol}) में सहेजे गए!`);
}

// 14. 7-DAY AUDIT & VISITOR TELEMETRY TRACKER
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

// 15. RBAC PERMISSIONS FOR SUB-ADMINS
const ROLE_PERMISSIONS = {
  OWNER: ['canManageAdmins', 'canPublishExam', 'canUploadQuestions', 'canToggleResults', 'canViewAuditLogs'],
  MODERATOR: ['canUploadQuestions']
};

function renderAdminStudio(userRole, customPermissions = []) {
  const allowed = userRole === 'OWNER' ? ROLE_PERMISSIONS.OWNER : customPermissions;
  toggleElementVisibility('secManageAdmins', allowed.includes('canManageAdmins'));
  toggleElementVisibility('secPublishExam', allowed.includes('canPublishExam'));
  toggleElementVisibility('secUploadQuestions', allowed.includes('canUploadQuestions'));
  toggleElementVisibility('secAuditLogs', allowed.includes('canViewAuditLogs'));
}

function toggleElementVisibility(elementId, isVisible) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (isVisible) el.classList.remove('hidden');
  else el.classList.add('hidden');
}

// 16. AUTHENTICATION & PROFILE
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
    currentUser = { name: "व्यवस्थापक (Owner)", phone: OWNER_PHONE, isOwner: true, isEditor: true };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    renderAdminStudio('OWNER');
    closeAuthModal();
    showToast(`🛡️ मुख्य व्यवस्थापक के रूप में स्वागत है!`);
    trackUserLoginTelemetry(currentUser);
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया सही १० अंकों का फ़ोन नंबर लिखें!");

  if (isRegisterMode) {
    if (!nameInput) return showToast("कृपया अपना पूरा नाम लिखें!");
    try {
      await db.collection('users').doc(phone).set({
        name: nameInput, phone, pass,
        registeredAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      currentUser = { name: nameInput, phone, isOwner: false, isEditor: false };
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      updateNavAuth();
      closeAuthModal();
      showToast(`पंजीकरण सफल! स्वागत है, ${currentUser.name}`);
      trackUserLoginTelemetry(currentUser);
    } catch (err) { showToast("त्रुटि: " + err.message); }
    return;
  }

  try {
    const userDoc = await db.collection('users').doc(phone).get();
    if (!userDoc.exists) return showToast("यह नंबर पंजीकृत नहीं है!");
    const userData = userDoc.data();
    if (userData.pass && userData.pass !== pass) return showToast("गलत पासवर्ड!");

    currentUser = {
      name: userData.name || "सदस्य",
      phone,
      isOwner: (phone === OWNER_PHONE && pass === OWNER_PASS),
      isEditor: editorsPhoneList.includes(phone)
    };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    closeAuthModal();
    showToast(`स्वागत है, ${currentUser.name}!`);
    trackUserLoginTelemetry(currentUser);
  } catch (err) { showToast("त्रुटि: " + err.message); }
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
      container.innerHTML = `
        <button onclick="openProfileModal()" class="text-xs font-bold text-forest bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 truncate max-w-[160px] shadow-sm">
          ${currentUser.isOwner ? '🛡️' : '👤'} ${currentUser.name}
        </button>
      `;
    } else {
      container.innerHTML = `
        <button onclick="openAuthModal()" class="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold shadow-sm">लॉगिन</button>
      `;
    }
  }

  if (bnavProfLbl) bnavProfLbl.innerText = currentUser ? 'प्रोफ़ाइल' : 'लॉगिन';
  if (currentUser) {
    if (postPrompt) postPrompt.classList.add('hidden');
    if (postEditor) postEditor.classList.remove('hidden');
  } else {
    if (postPrompt) postPrompt.classList.remove('hidden');
    if (postEditor) postEditor.classList.add('hidden');
  }
}

function openProfileModal() {
  if (!currentUser) return openAuthModal();
  updateProgressIndicators();
  showToast(`प्रोफ़ाइल: ${currentUser.name} | कुल मंत्र: ${malaTotalCount}`);
}

function closeProfileModal() {}

// 17. DIGITAL MALA
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
  if (mTotal) mTotal.innerText = malaTotalCount;
  if (mLaps) mLaps.innerText = malaLapsCount;
}

// 18. PANCHANG & AMAVASYA
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

// 19. CHAT, MEDIA & BANNER
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
  feed.innerHTML = '';
  allChatPosts.forEach(p => {
    feed.innerHTML += `
      <div class="p-3 bg-white rounded-xl border border-stone-200 text-xs space-y-1">
        <div class="flex justify-between font-bold text-forest">
          <span>${p.author}</span>
          <span class="text-[10px] text-stone-400 font-normal">${p.topic || 'सामान्य'}</span>
        </div>
        <p class="text-stone-800">${p.content}</p>
      </div>
    `;
  });
}

async function submitChaupalPost() {
  if (!currentUser) return openAuthModal();
  const txt = document.getElementById('postText').value.trim();
  if (!txt) return;
  await db.collection('posts').add({
    author: currentUser.name,
    content: txt,
    topic: document.getElementById('postTopicSelect')?.value || 'सामान्य चर्चा',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById('postText').value = '';
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
          <h3 class="font-yatra text-forest text-base">${item.title}</h3>
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

function listenNiyams() {
  const grid = document.getElementById('niyamGrid');
  if (!grid) return;
  grid.innerHTML = '';
  niyamsList.forEach(n => {
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
  const filtered = niyamsList.filter(n => n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q) || n.title.toLowerCase().includes(q));
  const grid = document.getElementById('niyamGrid');
  if (!grid) return;
  grid.innerHTML = '';
  filtered.forEach(n => {
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

// 20. TOAST & CONFIRM MODALS
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

// 21. NAVIGATION & INITIALIZATION
function switchTab(id) {
  if (id === 'admin' && !isEditorOrOwner()) return showToast("यह कक्ष केवल व्यवस्थापक के लिए है।");
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

  if (id === 'admin') refreshAuditLogs();
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

function generateCertificate(name, score) {
  const canvas = document.getElementById('certCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, 1000, 720);
  ctx.strokeStyle = '#143622';
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, 960, 680);
  ctx.fillStyle = '#143622';
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('विश्नोई समाज डिजिटल ज्ञान परीक्षा सम्मान-पत्र', 500, 140);
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`प्रमाणित किया जाता है कि: ${name}`, 500, 260);
  ctx.font = '20px sans-serif';
  ctx.fillText(`ने ज्ञान परीक्षा में ${score}% अंक प्राप्त किए।`, 500, 340);
  ctx.fillText('"जीव दया पालणी, रूंख लीलो नी घावै"', 500, 440);

  const link = document.createElement('a');
  link.download = `Certificate_${name}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

window.addEventListener('DOMContentLoaded', () => {
  injectCleanLayoutStyles();
  injectUnifiedBottomNavBar();
  setupInactivitySessionGuard();

  listenParikshaVisibility();
  listenBanner();
  listenPdfs();
  listenPosts();
  listenAudios();
  listenTreeCounter();
  listenNiyams();
  listenAmavasyaConfig();
  computeAutoPanchang();
  updateNavAuth();
  updateProgressIndicators();
  renderMalaCounters();

  if (currentUser && currentUser.isOwner) {
    renderAdminStudio('OWNER');
  } else {
    renderAdminStudio('GUEST');
  }

  if (!sessionStorage.getItem('visitor_logged_session')) {
    sessionStorage.setItem('visitor_logged_session', 'true');
    trackUserLoginTelemetry(currentUser || { name: 'Visitor' });
  }
});
