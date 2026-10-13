/* ==========================================================================
   BISHNOI DIGITAL PLATFORM - MODULE 1: CONFIG & DATA (config-data.js)
   ========================================================================== */

"use strict";

// 1. FIREBASE INITIALIZATION
const firebaseConfig = {
  apiKey: "AIzaSyDD58ybmm1bmmc5k5AwsxiaDiOXxlp7APA",
  authDomain: "bishnoi-platform.firebaseapp.com",
  projectId: "bishnoi-platform",
  storageBucket: "bishnoi-platform.firebasestorage.app",
  messagingSenderId: "1001226124051",
  appId: "1:1001226124051:web:ad4dc69e04e6701024f8e6"
};

if (typeof firebase !== "undefined" && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== "undefined" && firebase.firestore) ? firebase.firestore() : null;

// 2. OWNER & AI CREDENTIALS
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

// Community Chat & RBAC Sub-Admin State
let allChatPosts = [];
let activeReplyObj = null;
let blockedPhonesList = [];
let editorsPhoneList = [];
let subAdminPermissionsMap = {};

// Custom Audio State
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

// Pariksha Visibility Settings
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

// Exam Engine State
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

// Maintenance Configuration
let maintenanceConfig = {
  globalMode: 'off',
  message: 'मंच पर तकनीकी अपडेट कार्य जारी है, कृपया कुछ समय बाद प्रयास करें।',
  progressPct: 65,
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

// Mala Counters
let malaBeadCount = parseInt(localStorage.getItem('bishnoi_mala_beads') || '0');
let malaLapsCount = parseInt(localStorage.getItem('bishnoi_mala_laps') || '0');
let malaTotalCount = parseInt(localStorage.getItem('bishnoi_mala_total') || '0');

// 4. AUTHENTIC 29 NIYAMS DATA
const niyamsList = [
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

// 5. HISTORY & KIDS STORIES
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
    content: 'गुरु जम्भेश्वर भगवान का जन्म विक्रम संवत १५०८ (सन् १४५१) में पीपासर गाँव में हुआ। विक्रम संवत १५४२ में कार्तिक वदी अष्टमी को समराथल धोरे पर २९ नियमों के साथ बिश्नोई पंथ की स्थापना की।',
    moral: 'गुरु जाम्भोजी ने पर्यावरण संरक्षण, महिला सम्मान और नशामुक्त समाज का वैज्ञानिक मार्ग दिखाया।'
  },
  {
    id: 'kids_1',
    type: 'kids',
    badge: '🦌 बाल कहानी १',
    title: 'नन्हे हिरण का सच्चा मित्र',
    content: 'एक बार थार के रेगिस्तान में एक नन्हा चिंकारा प्यास से भटक रहा था। तभी गाँव के बालक ने उसे देखा और छना हुआ पानी पिलाकर उसकी रक्षा की।',
    moral: 'मूक पशु-पक्षी हमारे परिवार की तरह हैं। घर के बाहर पक्षियों व जीवों के लिए पानी का परिंडा अवश्य रखें।'
  },
  {
    id: 'kids_2',
    type: 'kids',
    badge: '🌳 बाल कहानी २',
    title: 'अमृता देवी का साहस और खेजड़ी का पेड़',
    content: 'प्यारे बच्चों! जब राजा के सैनिक खेजड़ली गाँव में पेड़ काटने आए, तो माता अमृता देवी ने पेड़ को अपनी बाहों में भर लिया और पेड़ों के लिए प्राण न्योछावर कर दिए।',
    moral: 'हमें अपने जन्मदिन पर कम से कम एक पौधा ज़रूर लगाना चाहिए।'
  }
];

// Helper Functions
function isSuperOwner() {
  return Boolean(currentUser && (currentUser.isOwner === true || currentUser.phone === OWNER_PHONE));
}

function isEditorOrOwner() {
  if (!currentUser) return false;
  if (isSuperOwner()) return true;
  return Boolean(currentUser.isEditor === true || editorsPhoneList.includes(currentUser.phone));
}

function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMsg');
  if (!toast || !msgEl) return;
  msgEl.innerText = msg;
  toast.classList.remove('-translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('-translate-y-20', 'opacity-0');
  }, 3200);
}

function openConfirmModal(title, msg, callback) {
  const modal = document.getElementById('customConfirmModal');
  const tEl = document.getElementById('confirmTitle');
  const mEl = document.getElementById('confirmMsg');
  if (!modal) return;
  if (tEl) tEl.innerText = title;
  if (mEl) mEl.innerText = msg;
  confirmCallback = callback;
  modal.classList.remove('hidden');
}

function closeConfirmModal(result) {
  const modal = document.getElementById('customConfirmModal');
  if (modal) modal.classList.add('hidden');
  if (confirmCallback) confirmCallback(result);
  confirmCallback = null;
}
/* ==========================================================================
   BISHNOI DIGITAL PLATFORM - MODULE 2: EXAM ENGINE (exam-engine.js)
   ========================================================================== */

"use strict";

window.markedForReviewSet = new Set();
let encryptedAnswerKeyMap = {};

function initExamSecurity() {
  if (window._strictExamGuardAttached) return;
  window._strictExamGuardAttached = true;

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

  ['contextmenu', 'copy', 'cut', 'paste', 'selectstart', 'dragstart'].forEach(evt => {
    document.addEventListener(evt, e => {
      if (examState.isExamRunning) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  });

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
      showToast("🛡️ सुरक्षा कारणों से डेवलपर टूल्स प्रतिबंधित हैं।");
      return false;
    }
  }, true);
}

function startExamEngine(questionList, durationMinutes) {
  encryptedAnswerKeyMap = {};
  examState.questions = (questionList || []).map((q, idx) => {
    const qId = q.id || `q_${idx}`;
    encryptedAnswerKeyMap[qId] = Number(q.ans ?? 0) ^ 79;
    const copy = { ...q, id: qId };
    delete copy.ans;
    return copy;
  });

  examState.timeRemainingSeconds = durationMinutes * 60;
  examState.currentIndex = 0;
  examState.tabSwitchCount = 0;
  examState.isExamRunning = true;
  window.markedForReviewSet.clear();

  const cacheKey = `encExam_${examState.activeMode}_${examState.rollNumber}`;
  try {
    examState.answers = JSON.parse(localStorage.getItem(cacheKey) || '{}');
  } catch (e) {
    examState.answers = {};
  }

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

function buildQuestionGridPills() {
  const gridContainer = document.getElementById('questionGridPills');
  if (!gridContainer) return;
  gridContainer.innerHTML = '';
  examState.questions.forEach((q, idx) => {
    const qId = q.id || `q_${idx}`;
    const pill = document.createElement('button');
    pill.id = `q_pill_${idx}`;
    let cls = "w-8 h-8 rounded-lg text-xs font-bold border transition ";
    if (window.markedForReviewSet.has(idx)) {
      cls += "bg-purple-600 text-white border-purple-800 shadow";
    } else if (examState.answers[qId] !== undefined) {
      cls += "bg-emerald-600 text-white border-emerald-700";
    } else {
      cls += "bg-white text-stone-700 border-stone-300";
    }
    pill.className = cls;
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
    <div class="p-4 bg-white rounded-xl shadow-sm border border-stone-200 select-none space-y-4">
      <div class="flex justify-between items-center">
        <span class="font-bold text-forest text-sm">प्रश्न क्रमांक: ${index + 1} / ${examState.questions.length}</span>
        <div class="flex items-center gap-2">
          <button type="button" onclick="toggleBookmarkCurrentQuestion()" class="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold border border-amber-300">
            ⭐ सहेजें (Bookmark)
          </button>
          <button type="button" onclick="toggleMarkQuestionForReview()" class="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-xs font-bold border border-purple-300">
            🟣 पुनर्विचार (Review)
          </button>
        </div>
      </div>
      <p class="text-base font-semibold text-stone-800 leading-relaxed">${q.title || q.q}</p>
      <div class="space-y-2">
        ${(q.options || q.opts || []).map((opt, i) => `
          <label class="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-stone-50 transition ${currentSelection === i ? 'bg-amber-50 border-amber-400' : 'border-stone-200'}">
            <input type="radio" name="currentExamRadio" value="${i}" 
              ${currentSelection === i ? 'checked' : ''} 
              onchange="saveExamAnswer('${qId}', ${i},${index})" class="accent-forest w-4 h-4 mr-3">
            <span class="text-xs sm:text-sm text-stone-800 font-medium">${opt}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

function saveExamAnswer(questionId, selectedOption, index) {
  examState.answers[questionId] = selectedOption;
  const cacheKey = `encExam_${examState.activeMode}_${examState.rollNumber}`;
  localStorage.setItem(cacheKey, JSON.stringify(examState.answers));
  const pill = document.getElementById(`q_pill_${index}`);
  if (pill && !window.markedForReviewSet.has(index)) {
    pill.className = "w-8 h-8 rounded-lg text-xs font-bold border transition bg-emerald-600 text-white border-emerald-700";
  }
}

function toggleMarkQuestionForReview() {
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
    showToast("🟣 प्रश्न पुनर्विचार हेतु बैंगनी रंग में चिह्नित किया गया!");
  }
}

function toggleBookmarkCurrentQuestion() {
  const q = examState.questions[examState.currentIndex];
  if (!q) return;
  const saved = JSON.parse(localStorage.getItem('bishnoi_saved_bookmarks') || '[]');
  const qTitle = q.title || q.q || '';
  const existsIdx = saved.findIndex(item => item.title === qTitle);
  if (existsIdx > -1) {
    saved.splice(existsIdx, 1);
    showToast("⭐ प्रश्न बुकमार्क से हटाया गया।");
  } else {
    saved.unshift({ title: qTitle, options: q.options || q.opts || [], time: Date.now() });
    showToast("⭐ प्रश्न आपकी प्रोफ़ाइल में सहेज लिया गया!");
  }
  localStorage.setItem('bishnoi_saved_bookmarks', JSON.stringify(saved.slice(0, 50)));
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
  examState.isExamRunning = false;
  if (examState.timerInterval) clearInterval(examState.timerInterval);

  let calculatedScore = 0;
  examState.questions.forEach((q, idx) => {
    const qId = q.id || `q_${idx}`;
    const trueAns = encryptedAnswerKeyMap[qId] !== undefined ? (encryptedAnswerKeyMap[qId] ^ 79) : (q.ans ?? 0);
    if (examState.answers[qId] === trueAns) calculatedScore++;
  });

  const candidateName = examState.enrolledProfile?.name || (currentUser ? currentUser.name : 'परीक्षार्थी');
  const fatherName = examState.enrolledProfile?.fatherName || '-';
  const totalQ = examState.questions.length;
  const pct = totalQ > 0 ? Math.round((calculatedScore / totalQ) * 100) : 0;
  const isMainExam = examState.activeMode === 'main_exam';

  const payload = {
    rollNumber: examState.rollNumber,
    candidateName,
    fatherName,
    phone: examState.enrolledProfile?.phone || (currentUser ? currentUser.phone : '-'),
    mode: examState.activeMode,
    score: calculatedScore,
    total: totalQ,
    percentage: pct,
    tabWarnings: examState.tabSwitchCount || 0,
    submittedAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : null,
    timestamp: Date.now(),
    isForcedSubmission: isForced
  };

  localStorage.removeItem(`encExam_${examState.activeMode}_${examState.rollNumber}`);

  if (!isMainExam) {
    const myMocks = JSON.parse(localStorage.getItem('bishnoi_my_personal_mock_scores') || '[]');
    myMocks.unshift({ candidateName, mode: examState.activeMode, score: calculatedScore, total: totalQ, time: Date.now() });
    localStorage.setItem('bishnoi_my_personal_mock_scores', JSON.stringify(myMocks.slice(0, 20)));
  }

  try {
    if (db) {
      const col = isMainExam ? 'mainExamSubmissions' : 'mockExamSubmissions';
      await db.collection(col).add(payload);
    }
  } catch (err) {
    const q = JSON.parse(localStorage.getItem('bishnoi_offline_exam_queue') || '[]');
    q.push(payload);
    localStorage.setItem('bishnoi_offline_exam_queue', JSON.stringify(q));
  }

  const qBox = document.getElementById('quizActiveBox');
  if (!qBox) return;

  if (!isMainExam) {
    qBox.innerHTML = `
      <div class="text-center p-6 sm:p-8 bg-gradient-to-br from-amber-50 via-white to-emerald-50 rounded-2xl border-2 border-emerald-400 space-y-4 shadow-md">
        <div class="text-5xl">🏆</div>
        <h3 class="font-yatra text-2xl text-forest">अभ्यास / मॉक परीक्षा परिणाम</h3>
        <p class="text-xs sm:text-sm text-stone-600">प्रतिभागी: <b>${candidateName}</b></p>
        <div class="p-4 bg-white rounded-2xl border border-emerald-200 max-w-xs mx-auto shadow-sm">
          <span class="text-xs text-stone-500 block">आपके प्राप्तांक (Instant Score):</span>
          <span class="text-3xl font-extrabold text-terracotta">${calculatedScore} / ${totalQ}</span>
          <span class="block text-xs font-bold text-emerald-800 mt-1">(${pct}% अंक)</span>
        </div>
        <div class="flex flex-wrap justify-center gap-2.5 pt-2">
          <button onclick="generateCertificate('${candidateName.replace(/'/g, "\\'")}', ${pct})" class="px-5 py-2.5 bg-forest hover:bg-emerald-950 text-white rounded-xl text-xs font-extrabold shadow">
            🎓 सहभागिता प्रमाण-पत्र डाउनलोड करें (Certificate)
          </button>
          <button onclick="switchTab('home')" class="px-5 py-2.5 bg-stone-200 text-stone-800 rounded-xl text-xs font-bold">
            मुखपृष्ठ पर लौटें
          </button>
        </div>
      </div>
    `;
  } else {
    qBox.innerHTML = `
      <div class="text-center p-8 bg-green-50 rounded-2xl border border-green-200 space-y-3">
        <div class="text-4xl">📜</div>
        <h3 class="text-xl font-bold text-forest">मुख्य परीक्षा उत्तर-पुस्तिका सफलतापूर्वक जमा हो गई है!</h3>
        <p class="text-xs sm:text-sm text-stone-600">रोल नंबर: <b>${examState.rollNumber}</b> के उत्तर मुख्य परीक्षा डेटाबेस में सुरक्षित दर्ज हो गए हैं।</p>
        <div class="p-3 bg-white rounded-xl border border-green-300 text-xs font-semibold text-green-900">
          गोपनीयता नीति के तहत परिणाम निर्धारित तिथि पर घोषित किया जाएगा।
        </div>
        <button onclick="switchTab('home')" class="px-5 py-2 bg-forest text-white rounded-xl text-xs font-bold shadow">
          मुखपृष्ठ पर लौटें
        </button>
      </div>
    `;
  }
}

async function launchMainExamPortal() {
  let roll = examState.rollNumber;
  if (!roll || roll === 'GUEST') {
    const inputRoll = prompt("परीक्षा कक्ष में प्रवेश हेतु अपना रोल नंबर दर्ज करें (उदा: JAMBH-2026-10001):");
    if (!inputRoll) return;
    roll = inputRoll.trim().toUpperCase();
  }

  try {
    if (db) {
      const rollDoc = await db.collection('examEnrolledStudents').doc(roll).get();
      if (!rollDoc.exists && !isSuperOwner()) {
        return showToast("अमान्य रोल नंबर! कृपया पहले नामांकन फॉर्म भरें।");
      }
      if (rollDoc.exists) examState.enrolledProfile = rollDoc.data();
    }
    examState.rollNumber = roll;
    localStorage.setItem('bishnoi_saved_roll', roll);
    examState.activeMode = 'main_exam';

    let list = [];
    if (db) {
      const snap = await db.collection('mainExamQuestions').get();
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    }
    if (!list.length) {
      list = [
        { id: 'mq_1', q: "गुरु जम्भेश्वर भगवान ने विश्नोई पंथ की स्थापना किस संवत में की थी?", opts: ["संवत १५४२", "संवत १५०८", "संवत १६००", "संवत १७८७"], ans: 0 },
        { id: 'mq_2', q: "खेजड़ली का पावन बलिदान किस वृक्ष की रक्षा हेतु हुआ था?", opts: ["खेजड़ी", "नीम", "पीपल", "बरगद"], ans: 0 }
      ];
    }
    startExamEngine(list, parikshaVisibility.examDuration || 120);
  } catch (e) {
    showToast("त्रुटि: " + e.message);
  }
}

function startMockTestEngine(mockId) {
  examState.activeMode = `mock_${mockId}`;
  let list = [
    { id: 'mk_1', q: "विश्नोई समाज के कुल कितने पावन नियम हैं?", opts: ["२१ नियम", "२९ नियम", "३६ नियम", "१०८ नियम"], ans: 1 },
    { id: 'mk_2', q: "अमृता देवी विश्नोई का अमर बलिदान किस वर्ष हुआ था?", opts: ["१७३० ईस्वी", "१४८५ ईस्वी", "१८५७ ईस्वी", "१९४७ ईस्वी"], ans: 0 },
    { id: 'mk_3', q: "बिश्नोई पंथ की स्थापना किस पावन स्थल पर हुई थी?", opts: ["पीपासर", "समराथल धोरा", "मुकाम", "जांगलू"], ans: 1 }
  ];
  startExamEngine(list, 60);
}

function startQuizNow() {
  examState.activeMode = 'daily_quiz';
  let list = quizList.length ? quizList : [
    { id: 'dq_1', q: "नियम संख्या १९ के अंतर्गत किस वृक्ष को न काटने का निर्देश है?", opts: ["हरा वृक्ष (रूंख लीलो नी घावै)", "सूखा वृक्ष", "कांटेदार वृक्ष", "कोई नहीं"], ans: 0 },
    { id: 'dq_2', q: "सबदवाणी में कुल कितने सबद संकलित हैं?", opts: ["१२० सबद", "१०८ सबद", "२९ सबद", "१५१ सबद"], ans: 0 }
  ];
  startExamEngine(list, 15);
}
/* ==========================================================================
   BISHNOI DIGITAL PLATFORM - MODULE 3: ADMIN STUDIO (admin-studio.js)
   ========================================================================== */

"use strict";

let customAdmitConfig = JSON.parse(localStorage.getItem('bishnoi_admit_cfg') || JSON.stringify({
  examTitle: "JAMBHANI LITERATURE EXAMINATION 2026",
  examDateStr: "As Announced on Portal",
  examCenterStr: "Online Digital Examination Hall",
  instructionsStr: "1. Keep Roll Number confidential. 2. Tab switching 3 times auto-submits paper.",
  lateCutoffMins: 5
}));

async function updateParikshaVisibilitySettings() {
  if (!isSuperOwner() && !(subAdminPermissionsMap[currentUser?.phone]?.canPublishExam || subAdminPermissionsMap[currentUser?.phone]?.canToggleResults)) {
    return showToast("केवल अधिकृत व्यवस्थापक के पास अधिकार है!");
  }
  const enrollment = document.getElementById('toggleEnrollmentSection')?.checked || false;
  const mock = document.getElementById('toggleMockSection')?.checked || false;
  const mainExam = document.getElementById('toggleMainExamSection')?.checked || false;
  const dailyQuiz = document.getElementById('toggleDailyQuizSection')?.checked || false;
  const resultsPublished = document.getElementById('toggleResultsPublishedSection')?.checked || false;

  parikshaVisibility = { ...parikshaVisibility, enrollment, mock, mainExam, dailyQuiz, resultsPublished };

  if (db) {
    await db.collection('examConfig').doc('visibility').set({
      enrollment, mock, mainExam, dailyQuiz, resultsPublished
    }, { merge: true });
  }
  applyParikshaVisibilityUI();
  showToast("✅ सभी ५ परीक्षा अनुभाग विज़िबिलिटी सेटिंग्स अपडेट हो गईं!");
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

  const tEnroll = document.getElementById('toggleEnrollmentSection');
  const tMock = document.getElementById('toggleMockSection');
  const tMain = document.getElementById('toggleMainExamSection');
  const tQuiz = document.getElementById('toggleDailyQuizSection');
  const tRes = document.getElementById('toggleResultsPublishedSection');

  if (tEnroll) tEnroll.checked = Boolean(parikshaVisibility.enrollment);
  if (tMock) tMock.checked = Boolean(parikshaVisibility.mock);
  if (tMain) tMain.checked = Boolean(parikshaVisibility.mainExam);
  if (tQuiz) tQuiz.checked = Boolean(parikshaVisibility.dailyQuiz);
  if (tRes) tRes.checked = Boolean(parikshaVisibility.resultsPublished);
}

// Student Enrollment & Unique Collision-Free Roll Generator
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
    let rollNumber = '';
    let isUnique = false;
    while (!isUnique) {
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      rollNumber = `JAMBH-2026-${randomSuffix}`;
      if (db) {
        const checkDoc = await db.collection('examEnrolledStudents').doc(rollNumber).get();
        if (!checkDoc.exists) isUnique = true;
      } else {
        isUnique = true;
      }
    }

    const studentRecord = {
      rollNumber, name, fatherName, dob, phone,
      email: email || '-', location, timestamp: Date.now()
    };

    if (db) {
      await db.collection('examEnrolledStudents').doc(rollNumber).set(studentRecord);
    }
    examState.rollNumber = rollNumber;
    localStorage.setItem('bishnoi_saved_roll', rollNumber);
    localStorage.setItem('bishnoi_last_enrolled_obj', JSON.stringify(studentRecord));

    alert(`🎉 बधाई! आपका परीक्षा नामांकन सफल हुआ।\n\nरोल नंबर (Roll No): ${rollNumber}\nनाम: ${name}\nपिता का नाम: ${fatherName}\n\nआपका प्रवेश-पत्र (Admit Card) स्वतः डाउनलोड हो रहा है।`);
    downloadStudentAdmitCardPdf(studentRecord);
  } catch (err) {
    showToast("नामांकन त्रुटि: " + err.message);
  }
}

// Official Admit Card PDF Generator with Dynamic QR Hash
function downloadStudentAdmitCardPdf(customObj) {
  let st = customObj || JSON.parse(localStorage.getItem('bishnoi_last_enrolled_obj') || 'null');
  if (!st) {
    const r = prompt("प्रवेश-पत्र डाउनलोड करने हेतु अपना रोल नंबर लिखें (उदा: JAMBH-2026-10001):");
    if (!r) return;
    st = { rollNumber: r.trim().toUpperCase(), name: currentUser?.name || 'परीक्षार्थी', fatherName: '-', dob: '-', phone: '-', location: '-' };
  }

  if (!window.jspdf || !window.jspdf.jsPDF) return showToast("PDF इंजन लोड हो रहा है, पुनः प्रयास करें।");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setDrawColor(20, 54, 34);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, 190, 142);

  doc.setFontSize(15);
  doc.setTextColor(20, 54, 34);
  doc.text("BISHNOI SAMAJ DIGITAL PORTAL (bishnoism.vercel.app)", 105, 21, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(179, 74, 27);
  doc.text(customAdmitConfig.examTitle || "OFFICIAL EXAMINATION ADMIT CARD", 105, 29, { align: "center" });

  doc.autoTable({
    startY: 35,
    margin: { left: 16, right: 16 },
    theme: 'grid',
    head: [['Field', 'Candidate Verification Information']],
    body: [
      ['Roll Number (Unique ID)', st.rollNumber || '-'],
      ['Candidate Full Name', st.name || '-'],
      ['Father Name', st.fatherName || '-'],
      ['Date of Birth (DOB)', st.dob || '-'],
      ['District / State', st.location || '-'],
      ['Exam Date & Time', customAdmitConfig.examDateStr || 'As Announced'],
      ['Exam Venue / Mode', customAdmitConfig.examCenterStr || 'Online Digital Hall']
    ],
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    headStyles: { fillColor: [20, 54, 34] }
  });

  doc.setFontSize(8.5);
  doc.setTextColor(20, 54, 34);
  doc.text(`QR VERIFICATION ID: ${st.rollNumber} | HASH: ${btoa(st.rollNumber || '').substring(0, 10)}`, 16, 134);
  doc.setTextColor(90, 90, 90);
  doc.text(`Instructions: ${customAdmitConfig.instructionsStr}`, 16, 142);

  doc.save(`Admit_Card_${st.rollNumber}.pdf`);
  showToast("🎫 प्रवेश-पत्र डाउनलोड हो गया!");
}

// PDF Exporters
async function downloadEnrolledStudentsPdf() {
  if (!db) return;
  const snap = await db.collection('examEnrolledStudents').get();
  if (snap.empty) return showToast("कोई नामांकित छात्र नहीं मिला।");
  let rows = [];
  snap.forEach((d, i) => {
    const s = d.data();
    rows.push([i + 1, s.rollNumber || d.id, s.name || '', s.fatherName || '', s.dob || '', s.phone || '', s.location || '']);
  });
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');
  doc.text("Jambhani Exam 2026 - Enrolled Candidates Master List", 14, 15);
  doc.autoTable({ startY: 22, head: [['S.No', 'Roll Number', 'Candidate Name', 'Father Name', 'DOB', 'Phone', 'Location']], body: rows });
  doc.save("Enrolled_Students_List.pdf");
  showToast("📋 नामांकित छात्रों की PDF डाउनलोड हो गई!");
}

async function downloadExamResultsMeritPdf() {
  if (!db) return;
  const snap = await db.collection('mainExamSubmissions').get();
  let list = [];
  snap.forEach(d => list.push(d.data()));
  list.sort((a, b) => (b.score || 0) - (a.score || 0));
  if (!list.length) return showToast("मुख्य परीक्षा का कोई परिणाम रिकॉर्ड नहीं मिला।");

  const rows = list.map((r, i) => [i + 1, r.rollNumber || '-', r.candidateName || '', r.fatherName || '-', `${r.score || 0} / ${r.total || 100}`, `${r.percentage || 0}%`]);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Jambhani Main Exam 2026 - Official Merit List", 14, 15);
  doc.autoTable({ startY: 22, head: [['Rank', 'Roll Number', 'Student Name', 'Father Name', 'Marks', 'Percentage']], body: rows });
  doc.save("Main_Exam_Merit_List.pdf");
  showToast("🏆 मुख्य परीक्षा मेरिट PDF डाउनलोड हो गई!");
}

async function download7DaysUsersPdf() {
  if (!db) return;
  const snap = await db.collection('users').get();
  let rows = [];
  snap.forEach(d => {
    const u = d.data();
    rows.push([u.name || '', u.phone || d.id, u.email || '-', u.location || '-']);
  });
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Bishnoi Portal - Registered Members List", 14, 18);
  doc.autoTable({ startY: 25, head: [['Name', 'Phone', 'Email', 'Location']], body: rows });
  doc.save("Registered_Members_List.pdf");
  showToast("👥 सदस्यों की PDF डाउनलोड हो गई!");
}

// Bulk Question Importer
async function importBulkQuiz() {
  if (!isEditorOrOwner()) return;
  const rawText = document.getElementById('adminBulkQuizText')?.value.trim() || '';
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

  if (!parsed.length) return showToast('प्रारूप सही नहीं है!');
  if (db) {
    const colName = targetCol === 'daily_quiz' ? 'quiz' : (targetCol === 'mock_1' ? 'mockExam_1' : (targetCol === 'mock_2' ? 'mockExam_2' : 'mainExamQuestions'));
    const batch = db.batch();
    parsed.forEach(q => batch.set(db.collection(colName).doc(), q));
    await batch.commit();
  }
  document.getElementById('adminBulkQuizText').value = '';
  showToast(`✅ ${parsed.length} प्रश्न (${targetCol}) में सफलतापूर्वक जोड़े गए!`);
}

// Soft Maintenance Settings
async function saveMaintenanceSettings() {
  if (!isSuperOwner()) return showToast("केवल मुख्य व्यवस्थापक के पास अधिकार है!");
  const globalMode = document.getElementById('adminGlobalMaintMode')?.value || 'off';
  const message = document.getElementById('adminMaintMessage')?.value.trim() || 'मंच पर अपडेट कार्य जारी है...';
  const sections = {};
  ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
    sections[sec] = document.getElementById(`lock_${sec}`)?.value || 'off';
  });

  if (db) {
    await db.collection('settings').doc('maintenance').set({ globalMode, message, sections }, { merge: true });
  }
  showToast("🛠️ मेंटेनेंस सेटिंग्स लागू हो गईं!");
}

// Visitor Telemetry Tracking (IP & Device)
async function trackUserLoginTelemetry(userData) {
  try {
    let geo = {};
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) geo = await res.json();
    const ua = navigator.userAgent || '';
    let deviceCategory = /mobile|android|iphone/i.test(ua) ? "Mobile Phone" : "Laptop / Desktop";

    if (db) {
      await db.collection('userAccessLogs').add({
        name: userData?.name || 'Visitor',
        phone: userData?.phone || '-',
        email: userData?.email || '-',
        statedLocation: userData?.location || '-',
        city: geo.city || 'Unknown',
        ip: geo.ip || 'Unknown',
        deviceType: deviceCategory,
        timestamp: Date.now()
      });
    }
  } catch (e) {}
}

async function refreshAuditLogs() {
  const tbody = document.getElementById('auditTableBody');
  if (!tbody || !db) return;
  tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-stone-400">लॉग्स लोड हो रहे हैं...</td></tr>`;
  try {
    const snap = await db.collection('userAccessLogs').orderBy('timestamp', 'desc').limit(40).get();
    tbody.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      tbody.innerHTML += `
        <tr class="hover:bg-stone-50 border-b">
          <td class="p-2 font-bold">${d.name}<br><span class="text-[10px] text-stone-400">${d.phone}</span></td>
          <td class="p-2">${d.email}</td>
          <td class="p-2 font-mono">${d.ip}</td>
          <td class="p-2">${d.deviceType}</td>
          <td class="p-2">${d.statedLocation}</td>
          <td class="p-2 text-[10px]">${new Date(d.timestamp).toLocaleTimeString()}</td>
        </tr>
      `;
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-2 text-center text-rose-500">लॉग त्रुटि: ${err.message}</td></tr>`;
  }
}
/* ==========================================================================
   BISHNOI DIGITAL PLATFORM - MODULE 4: APP UI & INTEGRATION (app-ui.js)
   ========================================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  renderNiyams(niyamsList);
  computeAutoPanchang();
  renderCustomMusicDropdown();
  updateNavAuth();
  renderMalaCounters();
  injectUnifiedBottomNavBar();

  if (db) {
    listenRealtimeUpdates();
  }

  if (!sessionStorage.getItem('visitor_logged_session')) {
    sessionStorage.setItem('visitor_logged_session', 'true');
    trackUserLoginTelemetry(currentUser || { name: 'Visitor' });
  }
});

function switchTab(id) {
  if (id === 'admin' && !isEditorOrOwner()) {
    return showToast("यह नियंत्रण कक्ष केवल व्यवस्थापक के लिए है।");
  }

  currentActiveTab = id;
  ['home', 'mala', 'niyams', 'library', 'community', 'quiz', 'history', 'admin'].forEach(t => {
    document.getElementById(`tab-${t}`)?.classList.add('hidden');
    document.getElementById(`nav-${t}`)?.classList.remove('nav-btn-active');
  });

  document.getElementById(`tab-${id}`)?.classList.remove('hidden');
  document.getElementById(`nav-${id}`)?.classList.add('nav-btn-active');

  // Bottom Navigation Sync
  document.querySelectorAll('#standardMobileBottomNav button').forEach(b => b.classList.remove('bnav-item-active'));
  const activeBnav = document.getElementById(
    (id === 'niyams' || id === 'mala' || id === 'history') ? 'bnav-home' : (id === 'admin' ? 'bnav-profile' : `bnav-${id}`)
  );
  if (activeBnav) activeBnav.classList.add('bnav-item-active');

  if (id === 'admin') {
    refreshAuditLogs();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function injectUnifiedBottomNavBar() {
  document.getElementById('standardMobileBottomNav')?.remove();
  const bottomNav = document.createElement('nav');
  bottomNav.id = 'standardMobileBottomNav';
  bottomNav.className = 'fixed bottom-0 left-0 right-0 z-[95] bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl px-3 py-1.5 md:hidden';
  bottomNav.innerHTML = `
    <div class="max-w-xl mx-auto grid grid-cols-5 gap-1.5">
      <button onclick="switchTab('home')" id="bnav-home" class="bnav-item-active flex flex-col items-center justify-center py-1.5 text-[11px] text-stone-600">
        <span class="text-lg">🏠</span><span class="truncate">मुखपृष्ठ</span>
      </button>
      <button onclick="switchTab('library')" id="bnav-library" class="flex flex-col items-center justify-center py-1.5 text-[11px] text-stone-600">
        <span class="text-lg">📚</span><span class="truncate">साहित्य</span>
      </button>
      <button onclick="switchTab('community')" id="bnav-community" class="flex flex-col items-center justify-center py-1.5 text-[11px] text-stone-600">
        <span class="text-lg">💬</span><span class="truncate">संवाद</span>
      </button>
      <button onclick="switchTab('quiz')" id="bnav-quiz" class="flex flex-col items-center justify-center py-1.5 text-[11px] text-forest font-bold">
        <span class="text-xl">🏆</span><span class="truncate">परीक्षा</span>
      </button>
      <button onclick="openProfileModal()" id="bnav-profile" class="flex flex-col items-center justify-center py-1.5 text-[11px] text-stone-600">
        <span class="text-lg">👤</span><span class="truncate">प्रोफ़ाइल</span>
      </button>
    </div>
  `;
  document.body.appendChild(bottomNav);
}

// 29 Niyams Filter
function renderNiyams(list) {
  const grid = document.getElementById('niyamGrid');
  if (!grid) return;
  grid.innerHTML = '';
  list.forEach(n => {
    grid.innerHTML += `
      <div class="p-4 rounded-xl bg-white border border-stone-200 shadow-sm space-y-1.5 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-forest w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">${n.num}</span>
            <span class="text-stone-500 font-semibold">${n.title}</span>
          </div>
          <h4 class="font-yatra text-base text-forest mt-1">${n.rule}</h4>
          <p class="text-xs text-stone-700 leading-relaxed">${n.desc}</p>
        </div>
        <div class="pt-2 border-t border-stone-100 flex justify-end">
          <button onclick="window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent('🌿 नियम ${n.num}: ${n.rule} — ${n.desc}'), '_blank')" class="text-emerald-700 text-xs font-bold">
            WhatsApp साझा करें 📲
          </button>
        </div>
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

// Audio Player Functions
function renderCustomMusicDropdown() {
  const sel = document.getElementById('audioTrackSelect');
  if (!sel) return;
  sel.innerHTML = audioPlaylist.map((tr, i) => `<option value="${tr.link}">${i + 1}. ${tr.title}</option>`).join('');
}

function changeAudioTrack() {
  const sel = document.getElementById('audioTrackSelect');
  const player = document.getElementById('audioPlayer');
  const source = document.getElementById('audioSource');
  if (sel && player && source) {
    source.src = sel.value;
    player.load();
    player.play().catch(() => {});
  }
}

// Digital Jaap Mala
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
      showToast("जप माला रीसेट हो गई।");
    }
  });
}

function updateMantraName() {
  const selected = document.getElementById('malaMantraSelect')?.value;
  if (selected) document.getElementById('activeMantraDisplay').innerText = selected;
}

// Panchang & Tree Counter
function computeAutoPanchang() {
  const now = new Date();
  const vaars = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const samvat = now.getFullYear() + 57;
  const dEl = document.getElementById('autoPanchangDate');
  const dtEl = document.getElementById('autoPanchangDetails');
  if (dEl) dEl.innerText = `${vaars[now.getDay()]} • विक्रम संवत ${samvat}`;
  if (dtEl) dtEl.innerText = `आज: ${now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

async function pledgeTree() {
  if (localStorage.getItem('has_pledged_tree')) return showToast("🌱 आपका संकल्प पहले से दर्ज है!");
  const display = document.getElementById('treeCounterDisplay');
  let nextVal = (parseInt(display?.innerText) || 1485) + 1;
  if (display) display.innerText = nextVal;
  localStorage.setItem('has_pledged_tree', 'true');
  showToast("🌳 प्रकृति रक्षा संकल्प दर्ज हुआ!");
  try {
    if (db) await db.collection('stats').doc('treePledges').set({ count: nextVal }, { merge: true });
  } catch (e) {}
}

function shareBannerWhatsApp() {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🌿 पावन संदेश:\n${currentBannerText}\n${window.location.href}`)}`, '_blank');
}

// Profile Modal & Auth
function openAuthModal() { document.getElementById('authModal')?.classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('authModal')?.classList.add('hidden'); }

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  document.getElementById('nameRow')?.classList.toggle('hidden', !isRegisterMode);
  document.getElementById('authTitle').innerText = isRegisterMode ? "नया पंजीकरण (Register)" : "लॉगिन (Sign In)";
  document.getElementById('authSubmitBtn').innerText = isRegisterMode ? "खाता बनाएं" : "लॉगिन करें";
  document.getElementById('authToggleBtn').innerText = isRegisterMode ? "पहले से पंजीकृत हैं? लॉगिन करें" : "नए सदस्य हैं? पहले पंजीकरण करें";
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('loginPhone').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const nameInput = document.getElementById('loginName')?.value.trim() || '';

  if (phone === OWNER_PHONE && pass === OWNER_PASS) {
    currentUser = { name: "व्यवस्थापक (Owner)", phone: OWNER_PHONE, isOwner: true, isEditor: true };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    closeAuthModal();
    updateNavAuth();
    showToast(`🛡️ स्वागत है, व्यवस्थापक जी!`);
    return;
  }

  if (isRegisterMode) {
    if (!nameInput) return showToast("कृपया नाम दर्ज करें!");
    currentUser = { name: nameInput, phone, isOwner: false, isEditor: false };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    if (db) await db.collection('users').doc(phone).set(currentUser, { merge: true });
    closeAuthModal();
    updateNavAuth();
    showToast(`स्वागत है, ${currentUser.name}`);
    return;
  }

  currentUser = { name: "सदस्य", phone, isOwner: false, isEditor: false };
  localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
  closeAuthModal();
  updateNavAuth();
  showToast("लॉगिन सफल!");
}

function updateNavAuth() {
  const container = document.getElementById('authActionsContainer');
  const adminNav = document.getElementById('nav-admin');
  const adminNavMob = document.getElementById('nav-admin-mobile');

  if (container) {
    if (currentUser) {
      container.innerHTML = `
        <button onclick="openProfileModal()" class="text-xs font-bold text-forest bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300">
          👤 ${currentUser.name}
        </button>
      `;
    } else {
      container.innerHTML = `
        <button onclick="openAuthModal()" class="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold">लॉगिन</button>
      `;
    }
  }

  if (adminNav) adminNav.classList.toggle('hidden', !isEditorOrOwner());
  if (adminNavMob) adminNavMob.classList.toggle('hidden', !isEditorOrOwner());
}

function openProfileModal() {
  if (!currentUser) return openAuthModal();
  alert(`👤 साधक प्रोफ़ाइल:\n\nनाम: ${currentUser.name}\nमोबाइल: ${currentUser.phone}\nपंजीकृत रोल नंबर: ${examState.rollNumber}\nकुल मंत्र जप: ${malaTotalCount}\nपूर्ण माला: ${malaLapsCount}`);
}

// Real-time Listeners
function listenRealtimeUpdates() {
  db.collection('examConfig').doc('visibility').onSnapshot(doc => {
    if (doc.exists) {
      parikshaVisibility = { ...parikshaVisibility, ...doc.data() };
      applyParikshaVisibilityUI();
    }
  });

  db.collection('settings').doc('dailySandesh').onSnapshot(doc => {
    if (doc.exists && doc.data().text) {
      currentBannerText = doc.data().text;
      const bEl = document.getElementById('dailyBannerText');
      if (bEl) bEl.innerText = currentBannerText;
    }
  });
}

// Certificate Generator
function generateCertificate(name, score) {
  const canvas = document.getElementById('certCanvas');
  if (!canvas) return;
  canvas.width = 1000;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, 1000, 720);
  ctx.strokeStyle = '#143622';
  ctx.lineWidth = 14;
  ctx.strokeRect(24, 24, 952, 672);
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, 920, 640);

  ctx.fillStyle = '#B34A1B';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('॥ ॐ विष्णवे नमः • श्री गुरु जम्भेश्वराय नमः ॥', 500, 95);

  ctx.fillStyle = '#143622';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('विश्नोई समाज डिजिटल ज्ञान एवं साहित्य परीक्षा', 500, 165);

  ctx.fillStyle = '#B34A1B';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('★ योग्यता एवं गौरव सम्मान-पत्र ★', 500, 215);

  ctx.fillStyle = '#44403C';
  ctx.font = '20px sans-serif';
  ctx.fillText('प्रमाणित किया जाता है कि प्रतिभागी', 500, 285);

  ctx.fillStyle = '#143622';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(name.toUpperCase(), 500, 340);

  ctx.fillStyle = '#292524';
  ctx.font = '20px sans-serif';
  ctx.fillText(`ने जाम्भाणी साहित्य ज्ञान परीक्षा में ${score}% अंक अर्जित किए हैं।`, 500, 405);

  const link = document.createElement('a');
  link.download = `Certificate_${name}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast("🎓 सम्मान-पत्र डाउनलोड हो गया!");
}

// Global Window Exports (100% Error Proof)
Object.assign(window, {
  switchTab,
  filterNiyams,
  handleGlobalSearch,
  changeAudioTrack,
  tapMalaBead,
  resetMalaCounter,
  updateMantraName,
  pledgeTree,
  shareBannerWhatsApp,
  openAuthModal,
  closeAuthModal,
  toggleAuthMode,
  handleAuthSubmit,
  openProfileModal,
  closeConfirmModal,
  startMockTestEngine,
  startQuizNow,
  launchMainExamPortal,
  navigateExam,
  jumpToQuestion,
  saveExamAnswer,
  toggleMarkQuestionForReview,
  toggleBookmarkCurrentQuestion,
  submitFinalExam,
  handleExamEnrollment,
  downloadStudentAdmitCardPdf,
  updateParikshaVisibilitySettings,
  downloadEnrolledStudentsPdf,
  downloadExamResultsMeritPdf,
  download7DaysUsersPdf,
  importBulkQuiz,
  saveMaintenanceSettings,
  refreshAuditLogs,
  generateCertificate
});
