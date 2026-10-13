/* ==========================================================================
   BISHNOI DIGITAL PLATFORM - COMPLETE LOGICAL PRODUCTION ENGINE (app.js)
   Integrates Cloudflare KV, Firebase, Real-time Karaoke & Anti-Cheat
   ========================================================================== */

"use strict";

// 1. FIREBASE INITIALIZATION
const firebaseConfig = {
  apiKey: "AIzaSyDD58ybmm1bmmc5k5AwsxiaDiOXxlp7APA",
  authDomain: "bishnoi-platform.firebaseapp.com",
  projectId: "bishnoi-platform",
  storageBucket: "bishnoi-platform.firebasestorage.app",
  messagingSenderId: "1001226124051",
  appId: "1:1001226124051:web:ad4dc69e04e6701024f8e6",
  measurementId: "G-2RB41Z0JNK"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 2. CONSTANTS & CLOUDFLARE CONFIGURATION
const OWNER_PHONE = "9306894518";
const OWNER_PASS = "bishnoi29";
const CLOUDFLARE_WORKER_PROCTOR_URL = "https://exam-proctor-api.bishnoism.workers.dev/upload";
const CLOUDFLARE_NAMESPACE_ID = "48f2e42708a145c1b7617d3bba559b6e";

// 3. GLOBAL APPLICATION STATE
let currentUser = JSON.parse(localStorage.getItem('bishnoi_secure_user') || 'null');
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
  proctorInterval: null,
  enrolledProfile: null
};

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

let customAdmitConfig = JSON.parse(localStorage.getItem('bishnoi_unified_admit_cfg') || JSON.stringify({
  examTitle: "अखिल भारतीय जम्भवाणी साहित्य एवं ज्ञान परीक्षा २०२६",
  examDateStr: "25 October 2026",
  examTimeStr: "10:00 AM - 12:00 PM",
  examCenterStr: "आधिकारिक डिजिटल परीक्षा केंद्र",
  lateCutoffMins: 5,
  instructionsStr: "१. रोल नंबर गोपनीय रखें। २. परीक्षा के दौरान ३ बार टैब बदलने पर पेपर स्वतः सबमिट हो जाएगा।"
}));

// Synchronized Karaoke Lyrics
const karaokeBhajanData = [
  { time: 0, text: "॥ ॐ श्री गुरु जम्भेश्वराय नमः ॥" },
  { time: 5, text: "आरती संत जन मिलकर गावै, प्रेम सहित गुरु चरण ध्यावै।" },
  { time: 14, text: "समराथल पर कलश स्थाप्यो, पाहल देकर पंथ चलायो।" },
  { time: 24, text: "उन्तीस धर्म की साखी सुनाई, जीव दया मन में अपनाई।" },
  { time: 35, text: "रूंख लीलो नी घावै भाई, हिरण फिरै गुरु के शरणाई।" },
  { time: 48, text: "विष्णु नाम जपो मन लाई, जम्भदेव भव पार लगाई।" }
];

// 4. BOOTLOADER & EVENT ATTACHMENTS
document.addEventListener("DOMContentLoaded", () => {
  initUIBindings();
  computeAutoPanchangAndAmavasya();
  initKaraokePlayer();
  listenRealtimeFirebaseConfig();
  verifyPrivacyConsentStatus();
  restoreAccidentalExamRefreshState();
});

// Toast notification helper
function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  const txt = document.getElementById('toastMsg');
  if (!toast || !txt) return;
  txt.innerText = msg;
  toast.classList.remove('-translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('-translate-y-24', 'opacity-0');
  }, 3200);
}

// Tab switcher
function switchPortalTab(targetTab) {
  ['home', 'sahitya', 'pariksha', 'community', 'profile'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`bnav-${t}`);
    if (el) el.classList.toggle('hidden', t !== targetTab);
    if (btn) btn.classList.toggle('bnav-active', t === targetTab);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Authentication
function initUIBindings() {
  const authCont = document.getElementById('authActionsContainer');
  if (!authCont) return;
  if (currentUser) {
    authCont.innerHTML = `
      <button onclick="switchPortalTab('profile')" class="text-xs font-extrabold text-forest bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300">
        👤 ${currentUser.name}
      </button>
    `;
    document.getElementById('profNameDisplay').innerText = currentUser.name;
    document.getElementById('profPhoneDisplay').innerText = currentUser.phone;
    if (currentUser.isOwner) {
      document.getElementById('ownerStudioSection')?.classList.remove('hidden');
      document.getElementById('profRoleBadge').innerText = '🛡️ मुख्य व्यवस्थापक (Owner)';
    }
  } else {
    authCont.innerHTML = `
      <button onclick="promptUserLogin()" class="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold">लॉगिन</button>
    `;
  }
}

function promptUserLogin() {
  const ph = prompt("अपना १०-अंकों का मोबाइल नंबर दर्ज करें:");
  if (!ph || !/^[6-9]\d{9}$/.test(ph.trim())) return showToast("कृपया सही १० अंकों का फ़ोन नंबर लिखें!");
  const pass = prompt("पासवर्ड दर्ज करें:");
  if (ph.trim() === OWNER_PHONE && pass === OWNER_PASS) {
    currentUser = { name: "मुख्य व्यवस्थापक", phone: OWNER_PHONE, isOwner: true };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    location.reload();
    return;
  }
  currentUser = { name: "पंजीकृत साधक", phone: ph.trim(), isOwner: false };
  localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
  location.reload();
}

function logoutPortalUser() {
  localStorage.removeItem('bishnoi_secure_user');
  currentUser = null;
  location.reload();
}

// 5. PANCHANG & DYNAMIC AMAVASYA ENGINE
function computeAutoPanchangAndAmavasya() {
  const now = new Date();
  const vaars = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const samvat = now.getFullYear() + 57;
  const dEl = document.getElementById('autoPanchangDate');
  const dtEl = document.getElementById('autoPanchangDetails');
  if (dEl) dEl.innerText = `${vaars[now.getDay()]} • विक्रम संवत ${samvat}`;
  if (dtEl) dtEl.innerText = `आज: ${now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const refNewMoon = new Date('2026-01-18T00:00:00Z').getTime();
  const diffDays = (now.getTime() - refNewMoon) / (1000 * 60 * 60 * 24);
  const synodic = 29.530588;
  const moonAge = (diffDays % synodic + synodic) % synodic;
  const daysRemaining = Math.ceil(synodic - moonAge);

  const box = document.getElementById('amavasyaCountdownBox');
  if (box) {
    box.innerText = `⏳ आगामी अमावस्या व्रत: ${daysRemaining} दिन शेष`;
  }
}

// 6. SYNCHRONIZED KARAOKE BHAJAN ENGINE
function initKaraokePlayer() {
  const audio = document.getElementById('karaokeAudioPlayer');
  const box = document.getElementById('karaokeLyricsBox');
  if (!audio || !box) return;

  box.innerHTML = karaokeBhajanData.map((k, i) => `
    <p id="kline_${i}" class="transition-all duration-300 py-1">${k.text}</p>
  `).join('');

  audio.addEventListener('timeupdate', () => {
    const cur = audio.currentTime;
    const dur = audio.duration || 0;
    document.getElementById('karaokeTimerDisp').innerText = `${formatSeconds(cur)} / ${formatSeconds(dur)}`;

    let activeIdx = 0;
    for (let i = 0; i < karaokeBhajanData.length; i++) {
      if (cur >= karaokeBhajanData[i].time) activeIdx = i;
    }

    karaokeBhajanData.forEach((_, i) => {
      const line = document.getElementById(`kline_${i}`);
      if (line) {
        if (i === activeIdx) {
          line.className = "karaoke-active-line py-1";
          line.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          line.className = "text-stone-300 py-1 opacity-60";
        }
      }
    });
  });
}

function toggleKaraokePlayback() {
  const audio = document.getElementById('karaokeAudioPlayer');
  const btn = document.getElementById('karaokePlayBtn');
  if (!audio) return;
  if (audio.paused) {
    audio.play();
    btn.innerText = "⏸ विराम दें";
  } else {
    audio.pause();
    btn.innerText = "▶ प्ले करें";
  }
}

function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// 7. PRIVACY CONSENT & CLOUDFLARE PROCTORING
function verifyPrivacyConsentStatus() {
  if (!localStorage.getItem('bishnoi_privacy_consent_accepted')) {
    document.getElementById('privacyConsentModal')?.classList.remove('hidden');
    document.getElementById('privacyConsentModal')?.classList.add('flex');
  }
}

function acceptPrivacyConsent() {
  localStorage.setItem('bishnoi_privacy_consent_accepted', 'true');
  document.getElementById('privacyConsentModal')?.classList.add('hidden');
  document.getElementById('privacyConsentModal')?.classList.remove('flex');
  showToast("✅ सहमति दर्ज कर ली गई है।");
}

function startCloudflareWebcamProctoring(rollNumber) {
  const video = document.getElementById('proctorWebcamVideo');
  const canvas = document.getElementById('proctorSnapshotCanvas');
  if (!navigator.mediaDevices || !video || !canvas) return;

  navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
    .then(stream => {
      video.srcObject = stream;
      examState.proctorInterval = setInterval(() => {
        if (!examState.isExamRunning) return;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 320, 240);
        const base64Img = canvas.toDataURL('image/jpeg', 0.5);

        fetch(CLOUDFLARE_WORKER_PROCTOR_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      console.warn("Camera permissions not granted for proctoring.");
    });
}

function stopCloudflareWebcamProctoring() {
  if (examState.proctorInterval) clearInterval(examState.proctorInterval);
  const video = document.getElementById('proctorWebcamVideo');
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
}

// 8. ADMIT CARD GENERATOR (NATIONAL COMPETITIVE EXAM STANDARD WITH QR)
async function handleCandidateEnrollment(e) {
  e.preventDefault();
  const name = document.getElementById('enrollName').value.trim();
  const fatherName = document.getElementById('enrollFatherName').value.trim();
  const dob = document.getElementById('enrollDob').value;
  const phone = document.getElementById('enrollPhone').value.trim();
  const location = document.getElementById('enrollLocation').value.trim();
  const photoFile = document.getElementById('enrollPhotoFile').files[0];

  if (!photoFile) return showToast("कृपया पासपोर्ट साइज फोटो अपलोड करें!");

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const photoBase64 = ev.target.result;
    const rollSuffix = Math.floor(10000 + Math.random() * 90000);
    const rollNumber = `JAMBH-2026-${rollSuffix}`;

    const studentRecord = {
      rollNumber, name, fatherName, dob, phone, location,
      photo: photoBase64,
      enrolledAt: Date.now()
    };

    await db.collection('examEnrolledStudents').doc(rollNumber).set(studentRecord);
    localStorage.setItem('bishnoi_saved_roll', rollNumber);
    localStorage.setItem('bishnoi_last_enrolled_obj', JSON.stringify(studentRecord));
    examState.rollNumber = rollNumber;

    alert(`🎉 नामांकन सफल!\n\nआपका रोल नंबर: ${rollNumber}\nप्रवेश पत्र डाउनलोड हो रहा है...`);
    renderNationalStandardAdmitCardPDF(studentRecord);
  };
  reader.readAsDataURL(photoFile);
}

function downloadCandidateAdmitCard() {
  const saved = JSON.parse(localStorage.getItem('bishnoi_last_enrolled_obj') || 'null');
  if (!saved) return showToast("कोई नामांकन रिकॉर्ड नहीं मिला। कृपया पहले नामांकन फॉर्म भरें।");
  renderNationalStandardAdmitCardPDF(saved);
}

function renderNationalStandardAdmitCardPDF(candidate) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Outer Border & Header Box
  doc.setDrawColor(20, 54, 34);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, 190, 277);
  doc.setFillColor(20, 54, 34);
  doc.rect(12, 12, 186, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("अखिल भारतीय विश्नोई समाज डिजिटल परीक्षा परिषद", 105, 23, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(253, 230, 138);
  doc.text(customAdmitConfig.examTitle.toUpperCase(), 105, 32, { align: "center" });

  doc.setTextColor(20, 54, 34);
  doc.setFontSize(13);
  doc.text("ई-प्रवेश पत्र (E-ADMIT CARD) - सत्र २०२६", 105, 48, { align: "center" });

  // Metadata Table
  const rows = [
    ['अनुक्रमांक (Roll Number)', candidate.rollNumber],
    ['परीक्षार्थी का नाम (Candidate Name)', candidate.name],
    ['पिता का नाम (Father Name)', candidate.fatherName],
    ['जन्मतिथि (Date of Birth)', candidate.dob],
    ['मोबाइल नंबर (Phone)', candidate.phone],
    ['परीक्षा केंद्र / माध्यम', customAdmitConfig.examCenterStr],
    ['परीक्षा दिनांक व समय', `${customAdmitConfig.examDateStr} (${customAdmitConfig.examTimeStr})`]
  ];

  doc.autoTable({
    startY: 55,
    margin: { left: 16, right: 65 },
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 245, 238] } }
  });

  // Candidate Photograph
  if (candidate.photo) {
    try {
      doc.addImage(candidate.photo, 'JPEG', 148, 55, 38, 48);
      doc.setDrawColor(20, 54, 34);
      doc.rect(148, 55, 38, 48);
      doc.setFontSize(7.5);
      doc.text("सत्यापित फोटो", 167, 107, { align: "center" });
    } catch (e) {}
  }

  // Verification QR Code
  const qrDiv = document.getElementById('admitQrTempContainer');
  qrDiv.innerHTML = '';
  new QRCode(qrDiv, {
    text: JSON.stringify({ roll: candidate.rollNumber, name: candidate.name, dob: candidate.dob }),
    width: 80, height: 80
  });

  setTimeout(() => {
    const qrImg = qrDiv.querySelector('img')?.src;
    if (qrImg) {
      doc.addImage(qrImg, 'PNG', 148, 115, 38, 38);
      doc.setFontSize(7);
      doc.text("आधिकारिक QR सत्यापन", 167, 157, { align: "center" });
    }

    // Signatures
    doc.setDrawColor(180, 180, 180);
    doc.line(20, 175, 75, 175);
    doc.line(135, 175, 190, 175);
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text("परीक्षार्थी के हस्ताक्षर", 47, 181, { align: "center" });
    doc.text("परीक्षा नियंत्रक मुहर व हस्ताक्षर", 162, 181, { align: "center" });

    // Candidate Instructions
    doc.setFillColor(245, 245, 240);
    doc.rect(15, 190, 180, 85, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(179, 74, 27);
    doc.text("परीक्षार्थियों हेतु आवश्यक दिशा-निर्देश (Important Instructions):", 20, 200);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    const instLines = [
      "१. परीक्षा प्रारंभ होने के ५ मिनट बाद परीक्षा कक्ष में प्रवेश पूर्णतः प्रतिबंधित कर दिया जाएगा।",
      "२. परीक्षा के दौरान मोबाइल स्क्रीन बंद करना, मिनिमाइज करना या ३ बार टैब बदलना स्वतः निष्कासन का कारण बनेगा।",
      "३. वेबकैम पर किसी अन्य व्यक्ति की उपस्थिति या अनुचित साधन का प्रयोग पाए जाने पर उत्तर पुस्तिका निरस्त मानी जाएगी।",
      `४. विशेष दिशा-निर्देश: ${customAdmitConfig.instructionsStr}`
    ];
    let y = 208;
    instLines.forEach(l => { doc.text(l, 20, y); y += 7; });

    doc.save(`Admit_Card_${candidate.rollNumber}.pdf`);
    showToast("🎫 प्रवेश पत्र डाउनलोड हो गया!");
  }, 400);
}

// 9. EXAM ENGINE WITH ANTI-CHEAT & REFRESH RECOVERY
function initiateExamSession(mode) {
  examState.activeMode = mode;
  let qList = [
    { id: 'q1', section: 'A', q: "गुरु जम्भेश्वर भगवान ने २९ नियमों का प्रतिपादन किस पावन स्थल पर किया था?", opts: ["समराथल धोरा", "मुकाम", "पीपासर", "जांगलू"], ans: 0 },
    { id: 'q2', section: 'A', q: "अमृता देवी विश्नोई के नेतृत्व में ३६३ शहीदों का बलिदान किस वर्ष हुआ?", opts: ["संवत १७८७ (१७३० ई.)", "संवत १५४२", "संवत १८५७", "संवत १९४७"], ans: 0 },
    { id: 'q3', section: 'B', q: "सबदवाणी ग्रंथ में कुल कितने पावन सबद संकलित हैं?", opts: ["१२० सबद", "१०८ सबद", "२९ सबद", "१५१ सबद"], ans: 0 }
  ];
  startExamCore(qList, mode === 'main_exam' ? (parikshaVisibility.examDuration || 120) : 60);
}

function startExamCore(questions, durationMinutes) {
  examState.questions = questions;
  examState.timeRemainingSeconds = durationMinutes * 60;
  examState.currentIndex = 0;
  examState.tabSwitchCount = 0;
  examState.isExamRunning = true;
  examState.answers = {};

  document.getElementById('examEnrollmentBox')?.classList.add('hidden');
  document.getElementById('mockTestsHub')?.classList.add('hidden');
  document.getElementById('mainExamLaunchBox')?.classList.add('hidden');
  document.getElementById('quizActiveBox')?.classList.remove('hidden');

  document.getElementById('examCandidateRoll').innerText = `रोल: ${examState.rollNumber} (${examState.activeMode.toUpperCase()})`;

  buildOMRPalette();
  renderActiveExamQuestion(0);
  startExamTimer();
  attachStrictAntiCheatListeners();

  if (examState.activeMode === 'main_exam' && parikshaVisibility.enableCameraProctoring) {
    startCloudflareWebcamProctoring(examState.rollNumber);
  }
}

function buildOMRPalette() {
  const p = document.getElementById('questionGridPills');
  if (!p) return;
  p.innerHTML = examState.questions.map((_, i) => `
    <button onclick="jumpExamQuestion(${i})" id="omr_pill_${i}" class="w-8 h-8 rounded-xl text-xs font-bold border border-stone-300 bg-white text-stone-700">
      ${i + 1}
    </button>
  `).join('');
}

function renderActiveExamQuestion(idx) {
  const q = examState.questions[idx];
  const area = document.getElementById('examQuestionArea');
  if (!q || !area) return;

  const curSel = examState.answers[q.id];
  area.innerHTML = `
    <div class="space-y-3">
      <div class="flex justify-between items-center text-xs">
        <span class="font-extrabold text-forest">प्रश्न क्रमांक: ${idx + 1} / ${examState.questions.length}</span>
        <button onclick="bookmarkQuestion('${q.id}')" class="text-amber-800 font-bold">⭐ बुकमार्क करें</button>
      </div>
      <h3 class="text-sm sm:text-base font-bold text-stone-900">${q.q}</h3>
      <div class="space-y-2 pt-1">
        ${q.opts.map((opt, i) => `
          <label class="flex items-center p-3 rounded-2xl border cursor-pointer ${curSel === i ? 'bg-amber-50 border-amber-400 font-bold' : 'border-stone-200'}">
            <input type="radio" name="active_opt" value="${i}" ${curSel === i ? 'checked' : ''} onchange="selectExamOption('${q.id}', ${i},${idx})" class="w-4 h-4 mr-3">
            <span class="text-xs sm:text-sm text-stone-800">${opt}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

function selectExamOption(qId, optIdx, qIdx) {
  examState.answers[qId] = optIdx;
  document.getElementById(`omr_pill_${qIdx}`)?.classList.add('bg-emerald-600', 'text-white');
  persistExamSessionLocally();
}

function jumpExamQuestion(i) {
  examState.currentIndex = i;
  renderActiveExamQuestion(i);
}

function navigateActiveExam(delta) {
  const nxt = examState.currentIndex + delta;
  if (nxt >= 0 && nxt < examState.questions.length) {
    examState.currentIndex = nxt;
    renderActiveExamQuestion(nxt);
  }
}

function startExamTimer() {
  if (examState.timerInterval) clearInterval(examState.timerInterval);
  examState.timerInterval = setInterval(() => {
    examState.timeRemainingSeconds--;
    const m = Math.floor(examState.timeRemainingSeconds / 60);
    const s = examState.timeRemainingSeconds % 60;
    const disp = document.getElementById('examTimerClock');
    if (disp) disp.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    if (examState.timeRemainingSeconds <= 0) {
      clearInterval(examState.timerInterval);
      finalizeExamSubmission(true);
    }
  }, 1000);
}

function attachStrictAntiCheatListeners() {
  document.addEventListener('visibilitychange', () => {
    if (!examState.isExamRunning) return;
    if (document.hidden) {
      examState.tabSwitchCount++;
      alert(`⚠️ कड़ी चेतावनी (${examState.tabSwitchCount}/3): परीक्षा के दौरान स्क्रीन या ऐप बदलना वर्जित है!`);
      if (examState.tabSwitchCount >= 3) {
        finalizeExamSubmission(true);
      }
    }
  });
}

function persistExamSessionLocally() {
  localStorage.setItem('encExam_ActiveSession', JSON.stringify({
    answers: examState.answers,
    currentIndex: examState.currentIndex,
    timeRemainingSeconds: examState.timeRemainingSeconds,
    activeMode: examState.activeMode,
    rollNumber: examState.rollNumber
  }));
}

function restoreAccidentalExamRefreshState() {
  const saved = JSON.parse(localStorage.getItem('encExam_ActiveSession') || 'null');
  if (saved && saved.timeRemainingSeconds > 10) {
    examState.answers = saved.answers;
    examState.rollNumber = saved.rollNumber;
    initiateExamSession(saved.activeMode);
    examState.currentIndex = saved.currentIndex;
    examState.timeRemainingSeconds = saved.timeRemainingSeconds;
    showToast("🔄 आपका परीक्षा सत्र स्वतः पुनः बहाल कर लिया गया है।");
  }
}

function confirmFinalExamSubmission() {
  if (confirm("क्या आप अपनी उत्तर पुस्तिका अंतिम रूप से जमा करना चाहते हैं?")) {
    finalizeExamSubmission(false);
  }
}

async function finalizeExamSubmission(isForced) {
  examState.isExamRunning = false;
  if (examState.timerInterval) clearInterval(examState.timerInterval);
  stopCloudflareWebcamProctoring();
  localStorage.removeItem('encExam_ActiveSession');

  let score = 0;
  examState.questions.forEach(q => {
    if (examState.answers[q.id] === q.ans) score++;
  });

  const submission = {
    rollNumber: examState.rollNumber,
    name: currentUser?.name || 'परीक्षार्थी',
    mode: examState.activeMode,
    score: score,
    total: examState.questions.length,
    percentage: Math.round((score / examState.questions.length) * 100),
    isForced: isForced,
    timestamp: Date.now()
  };

  const col = examState.activeMode === 'main_exam' ? 'mainExamSubmissions' : 'mockExamSubmissions';
  await db.collection(col).add(submission);

  document.getElementById('quizActiveBox').innerHTML = `
    <div class="text-center p-8 bg-green-50 rounded-3xl border border-green-300 space-y-3">
      <div class="text-5xl">📜</div>
      <h3 class="font-yatra text-2xl text-forest">उत्तर पुस्तिका सफलतापूर्वक जमा हो गई है!</h3>
      <p class="text-xs text-stone-600">रोल नंबर: <b>${examState.rollNumber}</b> का परीक्षा रिकॉर्ड सुरक्षित सहेज लिया गया है।</p>
      <div class="p-3 bg-white rounded-2xl border border-green-300 text-xs font-semibold text-green-900 max-w-sm mx-auto">
        मुख्य परीक्षा परिणाम आधिकारिक रूप से घोषित होने पर आप अपना रोल नंबर डालकर अंक तालिका व प्रमाण पत्र प्राप्त कर सकेंगे।
      </div>
      <button onclick="location.reload()" class="px-6 py-2.5 bg-forest text-white rounded-xl text-xs font-extrabold shadow">
        मुख्य परीक्षा पटल पर लौटें
      </button>
    </div>
  `;
}

// 10. REAL-TIME EXCEL EXPORTERS FOR OWNER
async function exportResultExcelSheet(type) {
  if (!currentUser?.isOwner) return;
  const col = type === 'main' ? 'mainExamSubmissions' : 'examEnrolledStudents';
  const snap = await db.collection(col).get();
  let data = [];

  snap.forEach(d => data.push(d.data()));
  if (type === 'main') {
    data.sort((a, b) => (b.score || 0) - (a.score || 0));
    data = data.map((r, i) => ({
      "रैंक (Rank)": i + 1,
      "रोल नंबर": r.rollNumber,
      "परीक्षार्थी नाम": r.name,
      "प्राप्तांक (Marks)": r.score,
      "पूर्णांक (Total)": r.total,
      "प्रतिशत (%)": `${r.percentage}%`,
      "जमा समय": new Date(r.timestamp).toLocaleString()
    }));
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Records");
  XLSX.writeFile(wb, `Bishnoi_Portal_${type}_Export.xlsx`);
  showToast("📊 Excel फ़ाइल डाउनलोड हो गई!");
}

// 11. REAL-TIME LISTENER FOR OWNER STUDIO CONFIG
function listenRealtimeFirebaseConfig() {
  db.collection('examConfig').doc('visibility').onSnapshot(doc => {
    if (doc.exists) {
      parikshaVisibility = Object.assign(parikshaVisibility, doc.data());
      applyVisibilityToDOM();
    }
  });
}

function applyVisibilityToDOM() {
  document.getElementById('toggleEnrollmentSection').checked = parikshaVisibility.enrollment;
  document.getElementById('toggleMockSection').checked = parikshaVisibility.mock;
  document.getElementById('toggleMainExamSection').checked = parikshaVisibility.mainExam;
  document.getElementById('toggleDailyQuizSection').checked = parikshaVisibility.dailyQuiz;
  document.getElementById('toggleResultsPublishedSection').checked = parikshaVisibility.resultsPublished;

  document.getElementById('examEnrollmentBox')?.classList.toggle('hidden', !parikshaVisibility.enrollment);
  document.getElementById('mockTestsHub')?.classList.toggle('hidden', !parikshaVisibility.mock);
  document.getElementById('mainExamLaunchBox')?.classList.toggle('hidden', !parikshaVisibility.mainExam);
  document.getElementById('examResultCheckDesk')?.classList.toggle('hidden', !parikshaVisibility.resultsPublished);
}

async function syncOwnerVisibilityConfig() {
  if (!currentUser?.isOwner) return;
  const cfg = {
    enrollment: document.getElementById('toggleEnrollmentSection').checked,
    mock: document.getElementById('toggleMockSection').checked,
    mainExam: document.getElementById('toggleMainExamSection').checked,
    dailyQuiz: document.getElementById('toggleDailyQuizSection').checked,
    resultsPublished: document.getElementById('toggleResultsPublishedSection').checked
  };
  await db.collection('examConfig').doc('visibility').set(cfg, { merge: true });
  showToast("✅ परीक्षा विज़िबिलिटी सेटिंग्स अपडेट हो गईं!");
}

function saveUnifiedPortalConfig() {
  const raw = document.getElementById('unifiedAdmitConfigInput')?.value.trim();
  if (!raw) return;
  const parts = raw.split('|').map(s => s.trim());
  if (parts.length >= 4) {
    customAdmitConfig.examTitle = parts[0];
    customAdmitConfig.examDateStr = parts[1];
    customAdmitConfig.examTimeStr = parts[2];
    customAdmitConfig.examCenterStr = parts[3];
    if (parts[4]) customAdmitConfig.lateCutoffMins = parseInt(parts[4]);
    if (parts[5]) customAdmitConfig.instructionsStr = parts[5];
    localStorage.setItem('bishnoi_unified_admit_cfg', JSON.stringify(customAdmitConfig));
    showToast("✅ पोर्टल एवं प्रवेश पत्र सेटिंग्स सहेज ली गईं!");
  }
}
