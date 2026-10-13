/* ============================================================================
 * BISHNOISM DIGITAL PLATFORM — script.js
 * Compatible with Firebase v10 COMPAT SDK and the existing forest/cream UI.
 *
 * SECURITY NOTE: browser JavaScript is never a security boundary. Configure
 * Firestore/Storage rules and the Cloudflare Worker before production. This
 * file deliberately contains no owner password, Gemini key, or Cloudflare
 * secret. AI and proctor uploads must go through your own authenticated server.
 * ========================================================================== */
"use strict";

(() => {
  // --------------------------------------------------------------------------
  // 1. CONFIGURATION & STATE
  // --------------------------------------------------------------------------
  const CONFIG = Object.freeze({
    firebase: {
      apiKey: "AIzaSyDD58ybmm1bmmc5k5AwsxiaDiOXxlp7APA",
      authDomain: "bishnoi-platform.firebaseapp.com",
      projectId: "bishnoi-platform",
      storageBucket: "bishnoi-platform.firebasestorage.app",
      messagingSenderId: "1001226124051",
      appId: "1:1001226124051:web:ad4dc69e04e6701024f8e6",
      measurementId: "G-2RB41Z0JNK"
    },
    workerBaseUrl: "https://exam-proctor-api.bishnoism.workers.dev/upload",
    namespaceId: "48f2e42708a145c1b7617d3bba559b6e",
    examCollections: {
      main_exam: "mainExamQuestions",
      mock_1: "mockExam_1",
      mock_2: "mockExam_2",
      daily_quiz: "quiz"
    },
    submissionCollections: {
      main_exam: "mainExamSubmissions",
      mock_1: "mockExamSubmissions",
      mock_2: "mockExamSubmissions",
      daily_quiz: "quizAttempts"
    },
    defaultExamMinutes: 120,
    lateEntryMinutes: 5,
    maxTabSwitches: 3,
    proctorSnapshotSeconds: 60
  });

  const state = {
    db: null,
    auth: null,
    storage: null,
    currentUser: JSON.parse(localStorage.getItem("bishnoi_secure_user") || "null"),
    isCurrentUserOwner: false,
    isRegisterMode: false,
    examCountdownTimer: null,
    inactivityTimer: null,
    currentBannerText: '"जीव दया पालणी, रूंख लीलो नी घावै" — प्रकृति एवं सभी मूक जीवों के प्रति करुणा रखें।',
    exam: {
      attemptId: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      reviewFlags: {},
      timeRemainingSeconds: 0,
      endTimeMs: 0,
      timerInterval: null,
      tabSwitchCount: 0,
      activeMode: "daily_quiz",
      rollNumber: localStorage.getItem("bishnoi_saved_roll") || "GUEST",
      isExamRunning: false,
      proctorInterval: null,
      enrolledProfile: null
    },
    visibility: {
      enrollment: false,
      mock: false,
      mainExam: false,
      dailyQuiz: false,
      resultsPublished: false,
      examScheduleTime: null,
      examDuration: 120,
      enableCameraProctoring: false
    },
    admitConfig: JSON.parse(localStorage.getItem("bishnoi_unified_admit_cfg") || JSON.stringify({
      examTitle: "अखिल भारतीय जम्भवाणी साहित्य एवं ज्ञान परीक्षा २०२६",
      examDateStr: "25 October 2026",
      examTimeStr: "10:00 AM - 12:00 PM",
      examCenterStr: "आधिकारिक डिजिटल परीक्षा केंद्र",
      lateCutoffMins: 5,
      instructionsStr: "१. रोल नंबर गोपनीय रखें। २. परीक्षा के दौरान ३ बार टैब बदलने पर पेपर स्वतः सबमिट हो जाएगा।"
    })),
    lastEnrolledStudent: JSON.parse(localStorage.getItem("bishnoi_last_enrolled_obj") || "null"),
    mala: {
      beads: parseInt(localStorage.getItem("bishnoi_mala_beads") || "0", 10),
      laps: parseInt(localStorage.getItem("bishnoi_mala_laps") || "0", 10),
      total: parseInt(localStorage.getItem("bishnoi_mala_total") || "0", 10)
    },
    karaoke: {
      speeds: [1.0, 1.25, 1.5],
      speedIndex: 0
    }
  };

  // --------------------------------------------------------------------------
  // 2. DATA ARCHIVES
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

  const SHABADWANI_CATALOG = [
    { id: "sh1", num: 1, title: "सबद १: ॐ गुरु चिन्हारि", desc: "सृष्टिकर्ता सतगुरु की पहचान एवं अंतःकरण शुद्धि।" },
    { id: "sh2", num: 2, title: "सबद २: लोइया तूं क्यों भूला", desc: "सांसारिक मोह-माया का त्याग एवं नश्वर देह का सत्य।" },
    { id: "sh3", num: 3, title: "सबद ३: जीया पर दया पालणी", desc: "जीव दया, वृक्ष रक्षा एवं सत्य वचन का अमृत मार्ग।" },
    { id: "sh4", num: 4, title: "सबद ४: अमावस व्रत राखणो", desc: "अमावस्या व्रत, हवन एवं आत्मचिंतन का विधान।" },
    { id: "sh5", num: 5, title: "सबद ५: करनी बिना कथनी थोथी", desc: "आचरण की शुचिता एवं पाखंड निवारण।" }
  ];

  const KARAOKE_LYRICS = [
    { time: 0, text: "॥ ॐ श्री गुरु जम्भेश्वराय नमः ॥" },
    { time: 5, text: "आरती संत जन मिलकर गावै, प्रेम सहित गुरु चरण ध्यावै।" },
    { time: 14, text: "समराथल पर कलश स्थाप्यो, पाहल देकर पंथ चलायो।" },
    { time: 24, text: "उन्तीस धर्म की साखी सुनाई, जीव दया मन में अपनाई।" },
    { time: 35, text: "रूंख लीलो नी घावै भाई, हिरण फिरै गुरु के शरणाई।" },
    { time: 48, text: "विष्णु नाम जपो मन लाई, जम्भदेव भव पार लगाई।" }
  ];

  // --------------------------------------------------------------------------
  // 3. UTILITIES
  // --------------------------------------------------------------------------
  const byId = id => document.getElementById(id);
  const escapeHtml = str => String(str || "").replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
  
  window.showToast = function(msg) {
    const toast = byId("toastNotification");
    const txt = byId("toastMsg");
    if (!toast || !txt) return;
    txt.innerText = msg;
    toast.classList.remove("-translate-y-24", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");
    setTimeout(() => {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("-translate-y-24", "opacity-0");
    }, 3200);
  };

  // --------------------------------------------------------------------------
  // 4. FIREBASE INIT
  // --------------------------------------------------------------------------
  function initFirebase() {
    if (typeof firebase !== "undefined") {
      if (!firebase.apps.length) firebase.initializeApp(CONFIG.firebase);
      if (firebase.firestore) state.db = firebase.firestore();
      if (firebase.auth) state.auth = firebase.auth();
      if (firebase.storage) state.storage = firebase.storage();
    }
  }

  // --------------------------------------------------------------------------
  // 5. NAVIGATION
  // --------------------------------------------------------------------------
  window.switchPortalTab = function(targetTab) {
    ["home", "sahitya", "pariksha", "community", "profile"].forEach(t => {
      const el = byId("tab-" + t);
      const btn = byId("bnav-" + t);
      if (el) el.classList.toggle("hidden", t !== targetTab);
      if (btn) btn.classList.toggle("bnav-active", t === targetTab);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  window.switchTab = window.switchPortalTab;

  window.openNotificationModal = function() {
    alert("🔔 सूचना केंद्र: आगामी अखिल भारतीय जम्भवाणी ज्ञान परीक्षा हेतु आधिकारिक विवरण पटल सक्रिय है।");
  };

  // --------------------------------------------------------------------------
  // 6. AUTHENTICATION & ACCESS
  // --------------------------------------------------------------------------
  function initAuthUI() {
    const authCont = byId("authActionsContainer");
    if (!authCont || !state.auth) return;

    state.auth.onAuthStateChanged(async (user) => {
      if (user) {
        state.currentUser = {
          uid: user.uid,
          name: user.displayName || user.email || "साधक",
          email: user.email || "",
          phone: user.phoneNumber || localStorage.getItem("bishnoi_user_phone") || ""
        };
        localStorage.setItem("bishnoi_secure_user", JSON.stringify(state.currentUser));

        state.isCurrentUserOwner = false;
        if (state.db) {
          try {
            const adminDoc = await state.db.collection("settings").doc("adminRoles").get();
            if (adminDoc.exists) {
              const roles = adminDoc.data() || {};
              if (roles.ownerUids && Array.isArray(roles.ownerUids) && roles.ownerUids.includes(user.uid)) {
                state.isCurrentUserOwner = true;
              }
            }
          } catch (e) {
            console.warn("Security check deferred to Firestore Rules:", e.message);
          }
        }

        authCont.innerHTML = `<button onclick="switchPortalTab('profile')" class="text-xs font-extrabold text-forest bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300">👤 ${escapeHtml(state.currentUser.name)}</button>`;
        if (byId("profNameDisplay")) byId("profNameDisplay").innerText = state.currentUser.name;
        if (byId("profPhoneDisplay")) byId("profPhoneDisplay").innerText = state.currentUser.phone || state.currentUser.email;

        const roleBadge = byId("profRoleBadge");
        if (state.isCurrentUserOwner) {
          byId("ownerStudioSection")?.classList.remove("hidden");
          if (roleBadge) roleBadge.innerText = "🛡️ मुख्य व्यवस्थापक (Owner)";
          window.loadUnifiedConfigToStudio();
        } else {
          byId("ownerStudioSection")?.classList.add("hidden");
          if (roleBadge) roleBadge.innerText = "पंजीकृत साधक";
        }
      } else {
        state.currentUser = null;
        state.isCurrentUserOwner = false;
        localStorage.removeItem("bishnoi_secure_user");
        authCont.innerHTML = `<button onclick="openAuthModal()" class="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold shadow-sm">लॉगिन</button>`;
        byId("ownerStudioSection")?.classList.add("hidden");
      }
    });
  }

  window.openAuthModal = () => { byId("authModal")?.classList.remove("hidden"); byId("authModal")?.classList.add("flex"); };
  window.closeAuthModal = () => { byId("authModal")?.classList.add("hidden"); byId("authModal")?.classList.remove("flex"); };
  window.toggleAuthMode = () => {
    state.isRegisterMode = !state.isRegisterMode;
    byId("registerNameRow")?.classList.toggle("hidden", !state.isRegisterMode);
    byId("authModalTitle").innerText = state.isRegisterMode ? "नया साधक पंजीकरण" : "साधक लॉगिन";
    byId("authSubmitBtn").innerText = state.isRegisterMode ? "खाता बनाएं" : "लॉगिन करें";
    byId("authToggleModeBtn").innerText = state.isRegisterMode ? "पहले से खाता है? लॉगिन करें" : "खाता नहीं है? नया पंजीकरण करें";
  };

  window.handleAuthSubmit = async function(e) {
    e.preventDefault();
    if (!state.auth) return window.showToast("प्रमाणीकरण सेवा उपलब्ध नहीं है।");
    const email = byId("authEmailInput").value.trim();
    const password = byId("authPasswordInput").value;
    const name = byId("authNameInput")?.value.trim();

    try {
      if (state.isRegisterMode) {
        if (!name) return window.showToast("कृपया अपना पूरा नाम लिखें!");
        const cred = await state.auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        if (state.db) {
          await state.db.collection("users").doc(cred.user.uid).set({
            name: name, email: email, createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
        window.showToast("पंजीकरण सफल हुआ!");
      } else {
        await state.auth.signInWithEmailAndPassword(email, password);
        window.showToast("सफलतापूर्वक लॉगिन हुआ!");
      }
      window.closeAuthModal();
    } catch (err) {
      window.showToast("प्रमाणीकरण त्रुटि: " + err.message);
    }
  };

  window.handlePasswordReset = async function() {
    if (!state.auth) return;
    const email = prompt("पासवर्ड रीसेट लिंक हेतु अपना ईमेल दर्ज करें:");
    if (!email || !email.includes("@")) return window.showToast("वैध ईमेल दर्ज करें!");
    try {
      await state.auth.sendPasswordResetEmail(email.trim());
      window.showToast("पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है!");
    } catch (err) {
      window.showToast("त्रुटि: " + err.message);
    }
  };

  window.logoutPortalUser = function() {
    if (state.auth) {
      state.auth.signOut().then(() => {
        state.currentUser = null;
        state.isCurrentUserOwner = false;
        localStorage.removeItem("bishnoi_secure_user");
        window.showToast("सफलतापूर्वक लॉगआउट किया गया।");
        location.reload();
      });
    } else {
      localStorage.removeItem("bishnoi_secure_user");
      location.reload();
    }
  };

  function setupInactivityGuard() {
    const resetTimer = () => {
      if (state.inactivityTimer) clearTimeout(state.inactivityTimer);
      if (state.currentUser) {
        state.inactivityTimer = setTimeout(() => {
          window.logoutPortalUser();
          window.showToast("🔒 २० मिनट की निष्क्रियता के बाद आपका सत्र स्वतः बंद कर दिया गया।");
        }, 20 * 60 * 1000);
      }
    };
    ["click", "touchstart", "keydown", "scroll"].forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();
  }

  // --------------------------------------------------------------------------
  // 7. PANCHANG & DYNAMIC AMAVASYA
  // --------------------------------------------------------------------------
  function computeAutoPanchangAndAmavasya() {
    const now = new Date();
    const vaars = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
    if (byId("autoPanchangDate")) byId("autoPanchangDate").innerText = `${vaars[now.getDay()]} • विक्रम संवत ${now.getFullYear() + 57}`;
    if (byId("autoPanchangDetails")) byId("autoPanchangDetails").innerText = `आज: ${now.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" })}`;

    const box = byId("amavasyaCountdownBox");
    if (!box) return;

    if (state.db) {
      state.db.collection("settings").doc("amavasyaConfig").get().then(doc => {
        if (doc.exists && doc.data().date) {
          const target = new Date(doc.data().date).getTime();
          const days = Math.ceil((target - now.getTime()) / (1000 * 60 * 60 * 24));
          if (days >= 0) { box.innerText = `⏳ आगामी पावन अमावस्या: ${days} दिन शेष (सत्यापित पंचांग)`; return; }
        }
        applyAstronomicalAmavasyaFallback(now, box);
      }).catch(() => applyAstronomicalAmavasyaFallback(now, box));
    } else {
      applyAstronomicalAmavasyaFallback(now, box);
    }
  }

  function applyAstronomicalAmavasyaFallback(now, box) {
    const refNewMoon = new Date("2026-01-18T00:00:00Z").getTime();
    const synodic = 29.530588;
    const moonAge = (((now.getTime() - refNewMoon) / 86400000) % synodic + synodic) % synodic;
    box.innerText = `⏳ आगामी अमावस्या व्रत: ~${Math.max(1, Math.ceil(synodic - moonAge))} दिन शेष (खगोलीय अनुमान)`;
  }

  // --------------------------------------------------------------------------
  // 8. 29 NIYAMS CATALOG
  // --------------------------------------------------------------------------
  function renderNiyamsList() {
    const grid = byId("niyamsQuickGrid");
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
  // 9. JAAP MALA & STREAKS
  // --------------------------------------------------------------------------
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
    if (byId("streakCountDisp")) byId("streakCountDisp").innerText = `${streak} दिन`;
    const b = byId("streakBadgeDisp");
    if (b) b.innerText = streak >= 51 ? "जम्भ रत्न" : streak >= 21 ? "हरित प्रहरी" : streak >= 7 ? "निष्ठ साधक" : "आरंभिक साधक";
  }

  window.tapHomeMalaBead = function() {
    state.mala.beads++;
    state.mala.total++;
    const haptic = byId("malaHapticToggle")?.checked ?? true;
    if (state.mala.beads >= 108) {
      state.mala.beads = 0;
      state.mala.laps++;
      if (haptic && navigator.vibrate) navigator.vibrate([80, 50, 100]);
      window.showToast("ॐ विष्णवे नमः! एक संपूर्ण माला (१०८ जप) पूर्ण हुई!");
    } else {
      if (haptic && navigator.vibrate) navigator.vibrate(30);
    }
    localStorage.setItem("bishnoi_mala_beads", state.mala.beads.toString());
    localStorage.setItem("bishnoi_mala_laps", state.mala.laps.toString());
    localStorage.setItem("bishnoi_mala_total", state.mala.total.toString());
    updateMalaDisplays();
    updateDailyJaapStreak();
  };

  window.resetMalaCounterWithConfirm = function() {
    if (confirm("क्या आप जप माला गणना को शून्य (Reset) करना चाहते हैं?")) {
      state.mala.beads = 0;
      localStorage.setItem("bishnoi_mala_beads", "0");
      updateMalaDisplays();
      window.showToast("माला काउंटर रीसेट कर दिया गया।");
    }
  };

  function updateMalaDisplays() {
    if (byId("homeMalaBeadDisp")) byId("homeMalaBeadDisp").innerText = state.mala.beads;
    if (byId("homeMalaLapBadge")) byId("homeMalaLapBadge").innerText = `${state.mala.laps} माला पूर्ण`;
    if (byId("totalJaapDisp")) byId("totalJaapDisp").innerText = state.mala.total;
    if (byId("totalLapsDisp")) byId("totalLapsDisp").innerText = state.mala.laps;
    if (byId("homeMalaRemainingDisp")) byId("homeMalaRemainingDisp").innerText = 108 - state.mala.beads;
    if (byId("homeMalaProgressBar")) byId("homeMalaProgressBar").style.width = `${Math.round((state.mala.beads / 108) * 100)}%`;
  }

  // --------------------------------------------------------------------------
  // 10. TREE PLEDGE & WHATSAPP
  // --------------------------------------------------------------------------
  window.pledgeTree = function() {
    let count = parseInt(localStorage.getItem("bishnoi_tree_pledges") || "1485", 10);
    count++;
    localStorage.setItem("bishnoi_tree_pledges", count.toString());
    if (byId("treeCounterDisplay")) byId("treeCounterDisplay").innerText = count;
    if (state.db) {
      state.db.collection("stats").doc("treePledges").set({
        count: firebase.firestore.FieldValue.increment(1),
        lastPledgedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(() => {});
    }
    window.showToast("🌱 आपका प्रकृति रक्षा पौधरोपण संकल्प दर्ज हुआ!");
  };

  window.shareBannerWhatsApp = function() {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`🌿 पावन संदेश:\n${state.currentBannerText}\n${window.location.href}`)}`, "_blank");
  };

  // --------------------------------------------------------------------------
  // 11. KARAOKE BHAJAN ENGINE
  // --------------------------------------------------------------------------
  function initKaraokePlayer() {
    const audio = byId("karaokeAudioPlayer");
    const box = byId("karaokeLyricsBox");
    if (!audio || !box) return;

    box.innerHTML = KARAOKE_LYRICS.map((k, i) => `<p id="kline_${i}" class="transition-all duration-300 py-1 text-stone-300 opacity-60">${escapeHtml(k.text)}</p>`).join("");

    audio.addEventListener("timeupdate", () => {
      const cur = audio.currentTime;
      const dur = audio.duration || 0;
      if (byId("karaokeTimerDisp")) byId("karaokeTimerDisp").innerText = `${formatSec(cur)} / ${formatSec(dur)}`;
      if (byId("karaokeSeekBar") && dur > 0) byId("karaokeSeekBar").value = Math.round((cur / dur) * 100);

      let activeIdx = 0;
      for (let i = 0; i < KARAOKE_LYRICS.length; i++) { if (cur >= KARAOKE_LYRICS[i].time) activeIdx = i; }

      KARAOKE_LYRICS.forEach((_, i) => {
        const line = byId("kline_" + i);
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

    audio.addEventListener("ended", () => { if (byId("karaokePlayBtn")) byId("karaokePlayBtn").innerText = "▶ प्ले करें"; });
  }

  window.toggleKaraokePlayback = function() {
    const audio = byId("karaokeAudioPlayer");
    const btn = byId("karaokePlayBtn");
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => { if (btn) btn.innerText = "⏸ विराम दें"; }).catch(e => window.showToast("ऑडियो लोड नहीं हो सका: " + e.message));
    } else {
      audio.pause();
      if (btn) btn.innerText = "▶ प्ले करें";
    }
  };

  window.seekKaraokeBy = function(sec) {
    const audio = byId("karaokeAudioPlayer");
    if (audio) audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + sec));
  };

  window.handleKaraokeSeek = function(percent) {
    const audio = byId("karaokeAudioPlayer");
    if (audio && audio.duration) audio.currentTime = (percent / 100) * audio.duration;
  };

  window.cycleAudioPlaybackSpeed = function() {
    const audio = byId("karaokeAudioPlayer");
    const btn = byId("audioSpeedBtn");
    if (!audio || !btn) return;
    state.karaoke.speedIndex = (state.karaoke.speedIndex + 1) % state.karaoke.speeds.length;
    const spd = state.karaoke.speeds[state.karaoke.speedIndex];
    audio.playbackRate = spd;
    btn.innerText = `${spd.toFixed(2)}x`;
  };

  function formatSec(s) {
    if (isNaN(s) || s < 0) return "00:00";
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  // --------------------------------------------------------------------------
  // 12. SHABADWANI & LITERATURE
  // --------------------------------------------------------------------------
  window.renderShabadCards = function(items) {
    const grid = byId("pdfRepoGrid");
    if (!grid) return;
    grid.innerHTML = items.map(s => `
      <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between space-y-2">
        <div><span class="text-[10px] font-extrabold text-terracotta uppercase">सबद संख्या ${s.num}</span><h4 class="font-yatra text-base text-forest mt-0.5">${escapeHtml(s.title)}</h4><p class="text-xs text-stone-600 mt-1">${escapeHtml(s.desc)}</p></div>
        <button onclick="openShabadModal('${s.id}')" class="w-full py-1.5 bg-forest text-white font-bold text-xs rounded-xl">अमृत वाणी पढ़ें</button>
      </div>
    `).join("");
  };

  window.filterShabadRepo = function(query) {
    const clean = (query || "").trim().toLowerCase();
    window.renderShabadCards(clean ? SHABADWANI_CATALOG.filter(s => s.title.toLowerCase().includes(clean) || s.desc.toLowerCase().includes(clean) || s.num.toString().includes(clean)) : SHABADWANI_CATALOG);
  };

  window.openShabadModal = function(shabadId) {
    const shabad = SHABADWANI_CATALOG.find(x => x.id === shabadId);
    if (!shabad) return;
    let modal = byId("shabadReaderModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "shabadReaderModal";
      modal.className = "fixed inset-0 z-[9995] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4";
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border-2 border-forest shadow-2xl relative">
        <button onclick="document.getElementById('shabadReaderModal').remove()" class="absolute top-4 right-4 text-stone-400 font-bold">✕</button>
        <div class="border-b border-stone-100 pb-2"><span class="text-[10px] font-bold text-terracotta uppercase">सबद संख्या ${shabad.num}</span><h3 class="font-yatra text-xl text-forest mt-0.5">${escapeHtml(shabad.title)}</h3></div>
        <div class="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs sm:text-sm text-stone-800 font-medium whitespace-pre-wrap">${escapeHtml(shabad.desc)}<p class="mt-3 text-[11px] text-stone-500 italic">नोट: पूर्ण अधिकृत पाठ अध्ययन हेतु प्रमाणित ग्रंथ संदर्भ देखें।</p></div>
        <button onclick="document.getElementById('shabadReaderModal').remove()" class="w-full py-2.5 bg-forest text-white font-bold text-xs rounded-xl">बंद करें</button>
      </div>
    `;
  };

  // --------------------------------------------------------------------------
  // 13. PRIVACY & PROCTORING (CLOUD)
  // --------------------------------------------------------------------------
  function verifyPrivacyConsentStatus() {
    if (!localStorage.getItem("bishnoi_privacy_consent_accepted")) {
      byId("privacyConsentModal")?.classList.remove("hidden");
      byId("privacyConsentModal")?.classList.add("flex");
    }
  }

  window.acceptPrivacyConsent = function() {
    localStorage.setItem("bishnoi_privacy_consent_accepted", "true");
    byId("privacyConsentModal")?.classList.add("hidden");
    byId("privacyConsentModal")?.classList.remove("flex");
    window.showToast("✅ गोपनीयता सहमति दर्ज कर ली गई है।");
  };

  window.startCloudflareProctoring = function(rollNumber) {
    const video = byId("proctorWebcamVideo");
    const canvas = byId("proctorSnapshotCanvas");
    if (!navigator.mediaDevices || !video || !canvas) return;
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } }).then(stream => {
      video.srcObject = stream;
      state.exam.proctorInterval = setInterval(() => {
        if (!state.exam.isExamRunning) return;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, 320, 240);
        fetch(CONFIG.workerBaseUrl, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ namespaceId: CONFIG.namespaceId, rollNumber, image: canvas.toDataURL("image/jpeg", 0.5), timestamp: Date.now() })
        }).catch(() => {});
      }, CONFIG.proctorSnapshotSeconds * 1000);
    }).catch(e => console.warn("Camera proctoring denied/unavailable:", e.message));
  };

  window.stopCloudflareProctoring = function() {
    if (state.exam.proctorInterval) clearInterval(state.exam.proctorInterval);
    const video = byId("proctorWebcamVideo");
    if (video && video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
  };

  // --------------------------------------------------------------------------
  // 14. ENROLLMENT & ADMIT CARD
  // --------------------------------------------------------------------------
  window.handleCandidateEnrollment = async function(e) {
    e.preventDefault();
    const name = byId("enrollName").value.trim();
    const fatherName = byId("enrollFatherName").value.trim();
    const dob = byId("enrollDob").value;
    const phone = byId("enrollPhone").value.trim();
    const locationVal = byId("enrollLocation").value.trim();
    const photoFile = byId("enrollPhotoFile")?.files[0];

    if (!name || !fatherName || !dob || !phone || !locationVal) return window.showToast("कृपया सभी अनिवार्य फ़ील्ड्स भरें!");
    if (!photoFile) return window.showToast("कृपया पासपोर्ट साइज फोटो अपलोड करें!");
    if (!/^[6-9]\d{9}$/.test(phone)) return window.showToast("कृपया सही १० अंकों का भारतीय फ़ोन नंबर भरें!");

    if (state.db) {
      try {
        const snap = await state.db.collection("examEnrolledStudents").where("phone", "==", phone).limit(1).get();
        if (!snap.empty) {
          const ex = snap.docs[0].data();
          state.exam.rollNumber = ex.rollNumber;
          localStorage.setItem("bishnoi_saved_roll", ex.rollNumber);
          localStorage.setItem("bishnoi_last_enrolled_obj", JSON.stringify(ex));
          state.lastEnrolledStudent = ex;
          alert(`ℹ️ आपका नामांकन पहले से दर्ज है!\n\nरोल नंबर: ${ex.rollNumber}\nप्रवेश पत्र डाउनलोड किया जा रहा है...`);
          window.renderAdmitCardPDF(ex);
          return;
        }
      } catch (err) { console.warn("Pre-check warning:", err.message); }
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        const c = document.createElement("canvas"); c.width = 160; c.height = 200;
        c.getContext("2d").drawImage(img, 0, 0, 160, 200);
        const photoBase64 = c.toDataURL("image/jpeg", 0.75);

        let rollNumber = ""; let isUnique = false; let attempts = 0;
        while (!isUnique && attempts < 10) {
          attempts++; rollNumber = `JAMBH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
          if (state.db) { const d = await state.db.collection("examEnrolledStudents").doc(rollNumber).get(); if (!d.exists) isUnique = true; } else { isUnique = true; }
        }

        const candidateRecord = { rollNumber, name, fatherName, dob, phone, location: locationVal, photo: photoBase64, enrolledAt: Date.now() };

        if (state.db) {
          try { await state.db.collection("examEnrolledStudents").doc(rollNumber).set(candidateRecord); }
          catch (dbErr) { return window.showToast("सर्वर पर नामांकन सुरक्षित नहीं हो सका: " + dbErr.message); }
        }

        localStorage.setItem("bishnoi_saved_roll", rollNumber);
        localStorage.setItem("bishnoi_last_enrolled_obj", JSON.stringify(candidateRecord));
        state.lastEnrolledStudent = candidateRecord;
        state.exam.rollNumber = rollNumber;
        alert(`🎉 नामांकन सफल हुआ!\n\nअनुक्रमांक (Roll No): ${rollNumber}\nप्रवेश पत्र तैयार हो रहा है...`);
        window.renderAdmitCardPDF(candidateRecord);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(photoFile);
  };

  window.downloadCandidateAdmitCard = function() {
    if (!state.lastEnrolledStudent) return window.showToast("कोई नामांकन रिकॉर्ड नहीं मिला। पहले नामांकन फॉर्म भरें।");
    window.renderAdmitCardPDF(state.lastEnrolledStudent);
  };

  window.renderAdmitCardPDF = function(candidate) {
    if (!window.jspdf || !window.jspdf.jsPDF) return window.showToast("PDF इंजन लोड हो रहा है, कृपया पुनः प्रयास करें।");
    const doc = new window.jspdf.jsPDF("p", "mm", "a4");
    doc.setDrawColor(20, 54, 34); doc.setLineWidth(1.5); doc.rect(10, 10, 190, 277);
    doc.setFillColor(20, 54, 34); doc.rect(12, 12, 186, 28, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.text("अखिल भारतीय विश्नोई समाज डिजिटल परीक्षा परिषद", 105, 23, { align: "center" });
    doc.setFontSize(9.5); doc.setTextColor(253, 230, 138); doc.text((state.admitConfig.examTitle || "राष्ट्रीय ज्ञान परीक्षा").toUpperCase(), 105, 32, { align: "center" });
    doc.setTextColor(20, 54, 34); doc.setFontSize(12); doc.text("ई-प्रवेश पत्र (E-ADMIT CARD) - सत्र २०२६", 105, 48, { align: "center" });

    doc.autoTable({
      startY: 54, margin: { left: 16, right: 65 }, theme: "grid", styles: { fontSize: 8.5, cellPadding: 2.2 }, columnStyles: { 0: { fontStyle: "bold", fillColor: [248, 245, 238] } },
      body: [
        ["अनुक्रमांक (Roll Number)", candidate.rollNumber || "-"], ["परीक्षार्थी का नाम (Candidate Name)", candidate.name || "-"], ["पिता का नाम (Father Name)", candidate.fatherName || "-"],
        ["जन्मतिथि (Date of Birth)", candidate.dob || "-"], ["मोबाइल नंबर (Phone)", candidate.phone || "-"], ["परीक्षा केंद्र / माध्यम", state.admitConfig.examCenterStr || "डिजिटल परीक्षा केंद्र"],
        ["परीक्षा दिनांक व समय", `${state.admitConfig.examDateStr} (${state.admitConfig.examTimeStr || "10:00 AM"})`]
      ]
    });

    if (candidate.photo) { try { doc.addImage(candidate.photo, "JPEG", 148, 54, 38, 48); doc.setDrawColor(20, 54, 34); doc.rect(148, 54, 38, 48); doc.setFontSize(7.5); doc.text("परीक्षार्थी फोटो", 167, 106, { align: "center" }); } catch (e) {} }

    const qrDiv = byId("admitQrTempContainer");
    if (qrDiv && typeof QRCode !== "undefined") {
      qrDiv.innerHTML = "";
      new QRCode(qrDiv, { text: JSON.stringify({ portal: "bishnoism", roll: candidate.rollNumber, name: candidate.name, dob: candidate.dob }), width: 80, height: 80 });
      setTimeout(() => {
        const qrImg = qrDiv.querySelector("img")?.src;
        if (qrImg) { doc.addImage(qrImg, "PNG", 148, 114, 38, 38); doc.setFontSize(7); doc.text("परीक्षार्थी विवरण QR", 167, 156, { align: "center" }); }
        doc.setDrawColor(180, 180, 180); doc.line(20, 175, 75, 175); doc.line(135, 175, 190, 175); doc.setFontSize(8); doc.setTextColor(50, 50, 50); doc.text("परीक्षार्थी के हस्ताक्षर", 47, 181, { align: "center" }); doc.text("परीक्षा नियंत्रक", 162, 181, { align: "center" });
        doc.setFillColor(245, 245, 240); doc.rect(15, 190, 180, 85, "F"); doc.setFontSize(9); doc.setFont(undefined, "bold"); doc.setTextColor(179, 74, 27); doc.text("परीक्षार्थियों हेतु आवश्यक दिशा-निर्देश (Important Instructions):", 20, 200);
        doc.setFont(undefined, "normal"); doc.setFontSize(7.5); doc.setTextColor(30, 30, 30);
        const instLines = ["१. परीक्षा प्रारंभ होने के ५ मिनट बाद परीक्षा कक्ष में प्रवेश पूर्णतः प्रतिबंधित कर दिया जाएगा।", "२. परीक्षा के दौरान मोबाइल स्क्रीन बंद करना, मिनिमाइज करना या ३ बार टैब बदलना स्वतः निष्कासन का कारण बनेगा।", `३. विशेष निर्देश: ${state.admitConfig.instructionsStr || "नियमों का पालन करें।"}`];
        let y = 208; instLines.forEach(l => { doc.text(l, 20, y); y += 7; });
        doc.save(`Admit_Card_${candidate.rollNumber}.pdf`); window.showToast("🎫 प्रवेश पत्र डाउनलोड हो गया!");
      }, 400);
    } else { doc.save(`Admit_Card_${candidate.rollNumber}.pdf`); window.showToast("🎫 प्रवेश पत्र डाउनलोड हो गया!"); }
  };

  // --------------------------------------------------------------------------
  // 15. EXAM GATES & COUNTDOWN
  // --------------------------------------------------------------------------
  window.startExamCountdownClock = function(targetIso) {
    if (state.examCountdownTimer) clearInterval(state.examCountdownTimer);
    const targetTime = new Date(targetIso).getTime();
    function update() {
      const diff = targetTime - Date.now();
      const disp = byId("examCountdownDisplay"); const startBtn = byId("startMainExamBtn");
      if (!disp) return;
      if (diff <= 0) { disp.innerText = "00:00:00 (परीक्षा प्रारंभ हो चुकी है)"; if (startBtn) startBtn.classList.remove("opacity-50", "pointer-events-none"); clearInterval(state.examCountdownTimer); return; }
      if (startBtn && !state.isCurrentUserOwner) startBtn.classList.add("opacity-50", "pointer-events-none");
      const hrs = Math.floor(diff / 3600000); const mins = Math.floor((diff % 3600000) / 60000); const secs = Math.floor((diff % 60000) / 1000);
      disp.innerText = `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    update(); state.examCountdownTimer = setInterval(update, 1000);
  };

  window.triggerMainExamHallEntry = function() {
    if (state.visibility.examScheduleTime && !state.isCurrentUserOwner) {
      const startMs = new Date(state.visibility.examScheduleTime).getTime(); const nowMs = Date.now();
      if (nowMs < startMs) return alert("⏳ परीक्षा अभी प्रारंभ नहीं हुई है! कृपया निर्धारित समय तक प्रतीक्षा करें।");
      const overrides = JSON.parse(localStorage.getItem("bishnoi_late_overrides") || "[]");
      if (!overrides.includes(state.exam.rollNumber) && nowMs > startMs + ((state.admitConfig.lateCutoffMins || 5) * 60000)) { return alert("🚫 प्रवेश वर्जित (Late Entry Closed)!"); }
    }
    window.initiateExamSession("main_exam");
  };

  // --------------------------------------------------------------------------
  // 16. EXAM ENGINE, OMR & RECOVERY
  // --------------------------------------------------------------------------
  window.initiateExamSession = async function(mode) {
    state.exam.activeMode = mode;
    let questions = [];
    if (state.db) {
      try {
        const snap = await state.db.collection(CONFIG.examCollections[mode] || "mainExamQuestions").get();
        snap.forEach(doc => { const data = doc.data(); delete data.ans; questions.push({ id: doc.id, ...data }); });
      } catch (err) { console.warn("Firestore question fallback:", err.message); }
    }
    if (!questions.length) {
      questions = [
        { id: "q1", section: "A", q: "गुरु जम्भेश्वर भगवान ने २९ नियमों का उपदेश किस पावन स्थल पर दिया था?", opts: ["समराथल धोरा", "मुकाम", "पीपासर", "जांगलू"] },
        { id: "q2", section: "A", q: "खेजड़ली में ३६३ शहीदों का आत्मोत्सर्ग किस विक्रम संवत में हुआ था?", opts: ["संवत १७८७ (१७३० ई.)", "संवत १५४२", "संवत १८५७", "संवत १९४७"] }
      ];
    }
    const durationMins = (mode === "main_exam") ? (state.visibility.examDuration || 120) : 60;
    startExamCore(questions, durationMins);
  };

  function startExamCore(questions, durationMinutes) {
    const now = Date.now();
    state.exam.attemptId = "ATT-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    state.exam.questions = questions;
    state.exam.endTimeMs = now + (durationMinutes * 60000);
    state.exam.timeRemainingSeconds = durationMinutes * 60;
    state.exam.currentIndex = 0; state.exam.tabSwitchCount = 0; state.exam.isExamRunning = true; state.exam.answers = {}; state.exam.reviewFlags = {};

    ["examClosedNoticeBox", "examEnrollmentBox", "mockTestsHub", "mainExamLaunchBox", "examResultCheckDesk"].forEach(id => { if (byId(id)) byId(id).classList.add("hidden"); });
    if (byId("quizActiveBox")) byId("quizActiveBox").classList.remove("hidden");
    if (byId("examCandidateRoll")) byId("examCandidateRoll").innerText = `रोल नंबर: ${state.exam.rollNumber} (${state.exam.activeMode.toUpperCase()})`;

    buildOMRPalette(); renderActiveQuestion(0); startExamTimer(); bindAntiCheat(); persistExamSession();
    if (state.visibility.enableCameraProctoring && state.exam.activeMode === "main_exam") window.startCloudflareProctoring(state.exam.rollNumber);
  }

  function buildOMRPalette() {
    const container = byId("questionGridPills");
    if (container) container.innerHTML = state.exam.questions.map((_, i) => `<button type="button" onclick="jumpActiveQuestion(${i})" id="omr_pill_${i}" class="w-8 h-8 rounded-xl text-xs font-bold border border-stone-300 bg-white text-stone-700 transition">${i + 1}</button>`).join("");
  }

  function renderActiveQuestion(idx) {
    const q = state.exam.questions[idx]; const area = byId("examQuestionArea");
    if (!q || !area) return;
    const curSel = state.exam.answers[q.id];
    const qTitle = q.q || q.title || "प्रश्न विवरण अनुपलब्ध";
    const options = q.opts || q.options || [];

    area.innerHTML = `
      <div class="space-y-3">
        <div class="flex justify-between items-center text-xs"><span class="font-extrabold text-forest">प्रश्न क्रमांक: ${idx + 1} / ${state.exam.questions.length} (खंड ${q.section || "A"})</span><button type="button" onclick="bookmarkQuestion('${q.id}')" class="text-amber-800 font-bold hover:underline">⭐ बुकमार्क करें</button></div>
        <h3 class="text-sm sm:text-base font-bold text-stone-900 leading-relaxed">${escapeHtml(qTitle)}</h3>
        <div class="space-y-2 pt-1">${options.map((opt, i) => `<label class="flex items-center p-3 rounded-2xl border cursor-pointer transition ${curSel === i ? "bg-amber-50 border-amber-400 font-bold" : "border-stone-200 hover:bg-stone-50"}"><input type="radio" name="active_opt" value="${i}" ${curSel === i ? "checked" : ""} onchange="selectOption('${q.id}', ${i},${idx})" class="w-4 h-4 mr-3 accent-forest"><span class="text-xs sm:text-sm text-stone-800">${escapeHtml(opt)}</span></label>`).join("")}</div>
      </div>
    `;
    document.querySelectorAll("#questionGridPills button").forEach((btn, pIdx) => { btn.classList.toggle("ring-2", pIdx === idx); btn.classList.toggle("ring-forest", pIdx === idx); });
  }

  window.selectOption = function(qId, optIdx, qIdx) {
    state.exam.answers[qId] = optIdx;
    const pill = byId(`omr_pill_${qIdx}`);
    if (pill && !state.exam.reviewFlags[qId]) { pill.classList.remove("bg-white", "text-stone-700"); pill.classList.add("bg-emerald-600", "text-white"); }
    persistExamSession();
  };

  window.jumpActiveQuestion = function(i) { if (i >= 0 && i < state.exam.questions.length) { state.exam.currentIndex = i; renderActiveQuestion(i); } };
  window.navigateActiveExam = function(delta) { const t = state.exam.currentIndex + delta; if (t >= 0 && t < state.exam.questions.length) { state.exam.currentIndex = t; renderActiveQuestion(t); } };
  window.toggleMarkCurrentForReview = function() {
    const idx = state.exam.currentIndex; const q = state.exam.questions[idx]; if (!q) return;
    const pill = byId(`omr_pill_${idx}`); if (!pill) return;
    if (state.exam.reviewFlags[q.id]) {
      delete state.exam.reviewFlags[q.id]; pill.classList.remove("bg-purple-600", "text-white");
      if (state.exam.answers[q.id] !== undefined) { pill.classList.add("bg-emerald-600", "text-white"); } else { pill.classList.add("bg-white", "text-stone-700"); }
      window.showToast("समीक्षा चिह्न हटाया गया।");
    } else {
      state.exam.reviewFlags[q.id] = true; pill.classList.remove("bg-white", "bg-emerald-600", "text-stone-700"); pill.classList.add("bg-purple-600", "text-white");
      window.showToast("🟣 प्रश्न समीक्षा हेतु चिह्नित किया गया!");
    }
    persistExamSession();
  };

  function startExamTimer() {
    if (state.exam.timerInterval) clearInterval(state.exam.timerInterval);
    state.exam.timerInterval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((state.exam.endTimeMs - Date.now()) / 1000));
      state.exam.timeRemainingSeconds = remaining;
      const disp = byId("examTimerClock");
      if (disp) disp.innerText = `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;
      if (remaining % 10 === 0) persistExamSession();
      if (remaining <= 0) { clearInterval(state.exam.timerInterval); window.finalizeExamSubmission(true); }
    }, 1000);
  }

  function bindAntiCheat() {
    document.addEventListener("visibilitychange", () => {
      if (!state.exam.isExamRunning) return;
      if (document.hidden) {
        state.exam.tabSwitchCount++; alert(`⚠️ सुरक्षा चेतावनी (${state.exam.tabSwitchCount}/${CONFIG.maxTabSwitches}):\nपरीक्षा के दौरान अन्य विंडो या टैब पर जाना वर्जित है!`);
        if (state.exam.tabSwitchCount >= CONFIG.maxTabSwitches) window.finalizeExamSubmission(true);
      }
    });
    window.addEventListener("contextmenu", (e) => { if (state.exam.isExamRunning) e.preventDefault(); });
  }

  function persistExamSession() { localStorage.setItem("encExam_ActiveSession", JSON.stringify({ attemptId: state.exam.attemptId, answers: state.exam.answers, reviewFlags: state.exam.reviewFlags, currentIndex: state.exam.currentIndex, endTimeMs: state.exam.endTimeMs, activeMode: state.exam.activeMode, rollNumber: state.exam.rollNumber })); }

  window.restoreAccidentalExamRefreshState = function() {
    try {
      const saved = JSON.parse(localStorage.getItem("encExam_ActiveSession") || "null");
      if (saved && saved.endTimeMs - Date.now() > 5000 && saved.rollNumber) {
        state.exam.attemptId = saved.attemptId; state.exam.answers = saved.answers || {}; state.exam.reviewFlags = saved.reviewFlags || {}; state.exam.rollNumber = saved.rollNumber; state.exam.endTimeMs = saved.endTimeMs;
        window.initiateExamSession(saved.activeMode || "daily_quiz").then(() => {
          state.exam.currentIndex = saved.currentIndex || 0; renderActiveQuestion(state.exam.currentIndex);
          Object.keys(state.exam.answers).forEach(qId => { const idx = state.exam.questions.findIndex(q => q.id === qId); if (idx !== -1 && byId(`omr_pill_${idx}`)) { byId(`omr_pill_${idx}`).classList.remove("bg-white", "text-stone-700"); byId(`omr_pill_${idx}`).classList.add("bg-emerald-600", "text-white"); } });
          window.showToast("🔄 आपका पूर्व परीक्षा सत्र पुनः स्थापित कर दिया गया है।");
        });
      } else { localStorage.removeItem("encExam_ActiveSession"); }
    } catch (err) { localStorage.removeItem("encExam_ActiveSession"); }
  };

  window.confirmFinalExamSubmission = function() { if (confirm("क्या आप अपनी उत्तर-पुस्तिका अंतिम रूप से जमा करना चाहते हैं?")) window.finalizeExamSubmission(false); };

  // --------------------------------------------------------------------------
  // 17. SUBMISSION & SCORING
  // --------------------------------------------------------------------------
  window.finalizeExamSubmission = async function(isForced) {
    state.exam.isExamRunning = false; if (state.exam.timerInterval) clearInterval(state.exam.timerInterval);
    localStorage.removeItem("encExam_ActiveSession"); window.stopCloudflareProctoring();

    const tQ = state.exam.questions.length; const aQ = Object.keys(state.exam.answers).length; const uQ = Math.max(0, tQ - aQ);
    const candidateName = (state.currentUser && state.currentUser.name) ? state.currentUser.name : (state.exam.enrolledProfile?.name || state.lastEnrolledStudent?.name || "परीक्षार्थी");
    const fatherName = state.exam.enrolledProfile?.fatherName || state.lastEnrolledStudent?.fatherName || "-";

    const payload = {
      attemptId: state.exam.attemptId, rollNumber: state.exam.rollNumber, name: candidateName, fatherName: fatherName,
      mode: state.exam.activeMode, answers: state.exam.answers, totalQuestions: tQ, answeredCount: aQ, unattemptedCount: uQ,
      isForced: isForced, tabWarnings: state.exam.tabSwitchCount, timestamp: Date.now()
    };
    if (typeof firebase !== "undefined" && firebase.firestore) payload.submittedAt = firebase.firestore.FieldValue.serverTimestamp();

    let writeSuccess = false;
    if (state.db) {
      try { await state.db.collection(CONFIG.submissionCollections[state.exam.activeMode] || "examSubmissions").add(payload); writeSuccess = true; }
      catch (err) { console.warn("Firestore submission error:", err.message); }
    }

    const qBox = byId("quizActiveBox");
    if (qBox) {
      qBox.innerHTML = `
        <div class="text-center p-6 sm:p-8 bg-green-50 rounded-3xl border border-green-300 space-y-4 shadow-sm">
          <div class="text-4xl">📜</div><h3 class="font-yatra text-2xl text-forest">उत्तर-पुस्तिका सफलतापूर्वक जमा हो गई है!</h3>
          <p class="text-xs text-stone-600">रोल नंबर: <b>${escapeHtml(state.exam.rollNumber)}</b> | प्रयास आईडी: <b>${escapeHtml(state.exam.attemptId)}</b></p>
          <div class="p-4 bg-white rounded-2xl border border-green-300 text-xs font-semibold text-green-900 max-w-sm mx-auto space-y-1">
            <div>कुल प्रश्न: <b>${tQ}</b> | हल किए गए: <b>${aQ}</b></div><div class="text-[11px] text-stone-500">अनुत्तरित प्रश्न: <b>${uQ}</b></div>
            <div class="text-[10px] text-emerald-700 mt-1">${writeSuccess ? "✓ सर्वर पर सुरक्षित रूप से प्रविष्ट (अंतिम परिणाम पटल पर जारी होगा)" : "⚠️ स्थानीय रूप से सहेजा गया"}</div>
          </div>
          <div class="pt-2 flex flex-wrap justify-center gap-2"><button type="button" onclick="location.reload()" class="px-5 py-2.5 bg-forest text-white rounded-xl text-xs font-extrabold shadow transition">परीक्षा पटल पर लौटें</button></div>
        </div>
      `;
    }
  };

  // --------------------------------------------------------------------------
  // 18. BOOKMARKS & RESULTS
  // --------------------------------------------------------------------------
  window.bookmarkQuestion = function(qId) {
    const q = state.exam.questions.find(x => x.id === qId); if (!q) return;
    const list = JSON.parse(localStorage.getItem("bishnoi_user_bookmarks") || "[]");
    if (!list.some(x => x.id === q.id)) { list.unshift(q); localStorage.setItem("bishnoi_user_bookmarks", JSON.stringify(list)); window.showToast("⭐ प्रश्न प्रोफ़ाइल बुकमार्क में सुरक्षित हो गया!"); window.initBookmarksView(); } else { window.showToast("यह प्रश्न पहले से बुकमार्क सूची में है।"); }
  };

  window.initBookmarksView = function() {
    const box = byId("userBookmarksList"); if (!box) return;
    const list = JSON.parse(localStorage.getItem("bishnoi_user_bookmarks") || "[]");
    if (!list.length) { box.innerHTML = `<div class="p-3 bg-stone-50 rounded-xl text-stone-500 text-xs text-center font-medium">कोई सहेजा गया प्रश्न नहीं है।</div>`; return; }
    box.innerHTML = list.map((q, i) => `<div class="p-3 bg-stone-900 text-amber-200 rounded-xl text-xs space-y-1"><div class="font-bold flex justify-between text-white"><span>प्रश्न ${i + 1}: ${escapeHtml(q.q || q.title || "")}</span><span class="text-amber-400 text-[10px]">खंड ${escapeHtml(q.section || "A")}</span></div><div class="text-stone-300 text-[11px]">${(q.opts || q.options || []).map(o => escapeHtml(o)).join(" | ")}</div></div>`).join("");
  };

  window.clearUserBookmarks = function() { localStorage.removeItem("bishnoi_user_bookmarks"); window.initBookmarksView(); window.showToast("बुकमार्क सूची साफ़ कर दी गई।"); };

  window.handleResultLookup = async function(e) {
    e.preventDefault(); const roll = byId("resRollInput").value.trim().toUpperCase(); const dob = byId("resDobInput").value; const out = byId("studentPersonalResultDisplay");
    if (!out) return; out.classList.remove("hidden"); out.innerHTML = `<div class="p-4 text-center text-xs text-stone-500">परिणाम खोजा जा रहा है...</div>`;
    if (!state.db) return out.innerHTML = `<div class="p-4 bg-amber-50 rounded-xl text-xs text-amber-900">डेटाबेस सेवा अनुपलब्ध है। कृपया इंटरनेट जांचें।</div>`;
    try {
      const studentDoc = await state.db.collection("examEnrolledStudents").doc(roll).get();
      if (!studentDoc.exists || studentDoc.data().dob !== dob) return out.innerHTML = `<div class="p-4 bg-rose-50 rounded-xl text-xs text-rose-700">दर्ज किया गया रोल नंबर अथवा जन्मतिथि रिकॉर्ड से मेल नहीं खाती।</div>`;
      const subSnap = await state.db.collection("mainExamSubmissions").where("rollNumber", "==", roll).limit(1).get();
      if (subSnap.empty) return out.innerHTML = `<div class="p-4 bg-amber-50 rounded-xl text-xs text-amber-900">आपकी उत्तर-पुस्तिका प्रक्रियाधीन है अथवा मुख्य परीक्षा का परिणाम अभी प्रकाशित नहीं हुआ है।</div>`;
      const resData = subSnap.docs[0].data(); const stData = studentDoc.data();
      out.innerHTML = `
        <div class="p-5 bg-gradient-to-br from-emerald-50 via-white to-amber-50 rounded-2xl border-2 border-forest shadow-md space-y-3">
          <div class="flex justify-between items-center border-b border-stone-200 pb-2"><span class="font-yatra text-base text-forest">अखिल भारतीय जम्भवाणी ज्ञान परीक्षा २०२६ - अंकतालिका</span><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-forest font-bold text-xs">सत्यापित</span></div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700"><div><b>परीक्षार्थी:</b> ${escapeHtml(stData.name)}</div><div><b>पिता का नाम:</b> ${escapeHtml(stData.fatherName)}</div><div><b>रोल नंबर:</b> ${escapeHtml(roll)}</div><div><b>स्थान:</b> ${escapeHtml(stData.location)}</div></div>
          <div class="p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between"><span class="font-bold text-xs text-stone-600">कुल प्राप्तांक:</span><span class="text-xl font-extrabold text-terracotta">${resData.score ?? "प्रक्रियाधीन"} / ${resData.total ?? "100"}</span></div>
          <button type="button" onclick="generateCertificate('${escapeHtml(stData.name)}', ${resData.percentage || 0})" class="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs shadow transition">📜 डिजिटल सम्मान-पत्र (Certificate) डाउनलोड करें</button>
        </div>
      `;
    } catch (err) { out.innerHTML = `<div class="p-4 bg-rose-50 rounded-xl text-xs text-rose-700">खोज त्रुटि: ${escapeHtml(err.message)}</div>`; }
  };

  window.askAiSahayak = async function() {
    const inp = byId("aiSahayakQueryInput"); const out = byId("aiSahayakAnswerOut");
    if (!inp || !out) return; const q = inp.value.trim(); if (!q) return;
    out.classList.remove("hidden"); out.innerHTML = `<span class="animate-pulse">🤖 AI सहायक उत्तर तैयार कर रहा है...</span>`;
    try {
      const res = await fetch("/api/aiSahayak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
      if (res.ok) { const data = await res.json(); out.innerHTML = `<strong>📖 उत्तर:</strong> ${escapeHtml(data.answer)}`; } else { throw new Error("Endpoint unavailable"); }
    } catch (e) { out.innerHTML = `<strong>📖 संदर्भ उत्तर:</strong> "${escapeHtml(q)}" के संबंध में गुरु जम्भेश्वर भगवान के २९ नियमों में प्रकृति संवर्धन, शुचिता और मूक जीवों की रक्षा को सर्वोच्च कर्तव्य माना गया है। (सर्वरलेस AI फ़ंक्शन सेटअप हेतु /api/aiSahayak डिप्लॉय करें)।`; }
  };

  window.generateCertificate = function(name, score) {
    const canvas = byId("certCanvas"); if (!canvas) return;
    canvas.width = 1000; canvas.height = 720; const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFDF7"; ctx.fillRect(0, 0, 1000, 720); ctx.strokeStyle = "#143622"; ctx.lineWidth = 16; ctx.strokeRect(24, 24, 952, 672); ctx.strokeStyle = "#D97706"; ctx.lineWidth = 4; ctx.strokeRect(40, 40, 920, 640);
    ctx.fillStyle = "#B34A1B"; ctx.textAlign = "center"; ctx.font = "bold 20px sans-serif"; ctx.fillText("॥ ॐ विष्णवे नमः • गुरु जम्भेश्वराय नमः ॥", 500, 95);
    ctx.fillStyle = "#143622"; ctx.font = "bold 34px sans-serif"; ctx.fillText("विश्नोई समाज डिजिटल ज्ञान एवं साहित्य परीक्षा", 500, 160);
    ctx.fillStyle = "#B34A1B"; ctx.font = "bold 22px sans-serif"; ctx.fillText("★ योग्यता एवं गौरव सम्मान-पत्र (Certificate of Merit) ★", 500, 210);
    ctx.fillStyle = "#44403C"; ctx.font = "20px sans-serif"; ctx.fillText("सहर्ष प्रमाणित किया जाता है कि परीक्षार्थी", 500, 280);
    ctx.fillStyle = "#143622"; ctx.font = "bold 36px sans-serif"; ctx.fillText(name.toUpperCase(), 500, 340);
    ctx.fillStyle = "#292524"; ctx.font = "20px sans-serif"; ctx.fillText(`ने जाम्भाणी साहित्य एवं २९ नियम परीक्षा में ${score}% प्राप्तांक प्राप्त किए हैं।`, 500, 405);
    ctx.fillStyle = "#143622"; ctx.fillRect(200, 490, 600, 42); ctx.fillStyle = "#FDE68A"; ctx.font = "bold 18px sans-serif"; ctx.fillText('"जीव दया पालणी, रूंख लीलो नी घावै — सिर साटै रूंख रहै, तो भी सस्तो जाण"', 500, 517);
    ctx.fillStyle = "#44403C"; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "left"; ctx.fillText(`दिनांक: ${new Date().toLocaleDateString("hi-IN")}`, 80, 620); ctx.textAlign = "right"; ctx.fillText("मुख्य व्यवस्थापक (विश्नोई समाज डिजिटल मंच)", 920, 620);
    const link = document.createElement("a"); link.download = `Bishnoi_Exam_Certificate_${name}.png`; link.href = canvas.toDataURL("image/png"); link.click(); window.showToast("🎓 सम्मान-पत्र डाउनलोड हो गया!");
  };

  // --------------------------------------------------------------------------
  // 19. COMMUNITY FORUM & OWNER STUDIO
  // --------------------------------------------------------------------------
  window.submitChaupalPost = async function() {
    if (!state.currentUser) { window.showToast("कृपया संवाद मंच में विचार साझा करने हेतु लॉगिन करें!"); window.openAuthModal(); return; }
    const txtEl = byId("chaupalPostText"); const txt = txtEl ? txtEl.value.trim() : ""; if (!txt) return;
    if (state.db) { try { await state.db.collection("posts").add({ author: state.currentUser.name || "साधक", authorUid: state.currentUser.uid, content: txt, createdAt: firebase.firestore.FieldValue.serverTimestamp() }); txtEl.value = ""; window.showToast("विचार पोस्ट कर दिया गया!"); window.loadChaupalPosts(); } catch (err) { window.showToast("पोस्ट करने में त्रुटि: " + err.message); } }
  };

  window.loadChaupalPosts = function() {
    const feed = byId("communityFeed"); if (!feed || !state.db) return;
    state.db.collection("posts").orderBy("createdAt", "desc").limit(20).get().then(snap => {
      if (snap.empty) { feed.innerHTML = `<div class="p-4 text-center text-xs text-stone-400">अभी कोई विचार पोस्ट नहीं है। पहला विचार लिखें!</div>`; return; }
      feed.innerHTML = snap.docs.map(doc => { const p = doc.data(); return `<div class="p-3 bg-white rounded-2xl border border-stone-200 text-xs space-y-1"><div class="font-bold text-forest">${escapeHtml(p.author)}</div><p class="text-stone-800 leading-relaxed">${escapeHtml(p.content)}</p></div>`; }).join("");
    }).catch(() => {});
  };

  window.loadUnifiedConfigToStudio = function() {
    const area = byId("unifiedAdmitConfigInput");
    if (area) area.value = `${state.admitConfig.examTitle} | ${state.admitConfig.examDateStr} | ${state.admitConfig.examTimeStr} | ${state.admitConfig.examCenterStr} | ${state.admitConfig.lateCutoffMins} | ${state.admitConfig.instructionsStr}`;
  };

  window.saveUnifiedPortalConfig = async function() {
    const area = byId("unifiedAdmitConfigInput"); if (!area) return;
    const parts = area.value.split("|").map(s => s.trim());
    if (parts.length >= 6) {
      state.admitConfig = { examTitle: parts[0], examDateStr: parts[1], examTimeStr: parts[2], examCenterStr: parts[3], lateCutoffMins: parseInt(parts[4], 10) || 5, instructionsStr: parts[5] };
      localStorage.setItem("bishnoi_unified_admit_cfg", JSON.stringify(state.admitConfig));
      if (state.db) await state.db.collection("examConfig").doc("admitAndCutoff").set(state.admitConfig, { merge: true });
      window.showToast("✅ प्रवेश-पत्र एवं परीक्षा प्रारूप अद्यतन कर दिया गया!");
    } else { window.showToast("अमान्य प्रारूप! पाइप (|) द्वारा पृथक ६ भाग होने अनिवार्य हैं।"); }
  };

  window.exportResultExcelSheet = async function(type) {
    if (!state.isCurrentUserOwner) return window.showToast("यह सुविधा केवल अधिकृत व्यवस्थापक हेतु है!");
    let data = [];
    if (state.db) {
      const col = (type === "main") ? "mainExamSubmissions" : "examEnrolledStudents";
      const snap = await state.db.collection(col).get(); snap.forEach(d => data.push(d.data()));
    }
    if (type === "main") {
      data.sort((a, b) => (b.score || 0) - (a.score || 0));
      data = data.map((r, i) => ({ "रैंक (Rank)": i + 1, "रोल नंबर": r.rollNumber || "-", "परीक्षार्थी नाम": r.name || "-", "प्राप्तांक (Marks)": r.score || 0, "पूर्णांक (Total)": r.total || 100, "प्रतिशत (%)": `${r.percentage || 0}%`, "जमा समय": r.timestamp ? new Date(r.timestamp).toLocaleString("hi-IN") : "-" }));
    }
    if (typeof XLSX !== "undefined") { const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Records"); XLSX.writeFile(wb, `Bishnoi_Platform_${type}_Report.xlsx`); window.showToast("📊 Excel फ़ाइल डाउनलोड हो गई!"); } else { window.showToast("SheetJS लाइब्रेरी लोड नहीं हो सकी।"); }
  };

  window.grantOwnerLateOverride = function() {
    const inp = byId("overrideRollInput"); if (!inp) return;
    const roll = inp.value.trim().toUpperCase(); if (!roll) return window.showToast("रोल नंबर दर्ज करें!");
    const list = JSON.parse(localStorage.getItem("bishnoi_late_overrides") || "[]"); if (!list.includes(roll)) list.push(roll);
    localStorage.setItem("bishnoi_late_overrides", JSON.stringify(list)); inp.value = ""; window.showToast(`✅ रोल ${roll} को लेट-एंट्री प्रवेश की अनुमति दी गई!`);
  };

  window.declareDailyQuizWinners = async function() {
    if (!state.isCurrentUserOwner) return window.showToast("केवल व्यवस्थापक के लिए!");
    if (!state.db) return;
    try {
      const snap = await state.db.collection("quizAttempts").limit(50).get(); let attempts = []; snap.forEach(d => attempts.push(d.data())); attempts.sort((a, b) => (b.score || 0) - (a.score || 0));
      if (attempts.length >= 1) { await state.db.collection("settings").doc("dailyWinners").set({ p1Name: attempts[0]?.name || "—", p1Score: `${attempts[0]?.score || 0}`, p2Name: attempts[1]?.name || "—", p2Score: `${attempts[1]?.score || 0}`, p3Name: attempts[2]?.name || "—", p3Score: `${attempts[2]?.score || 0}` }, { merge: true }); window.showToast("🏆 दैनिक क्विज़ शीर्ष ३ विजेताओं की घोषणा हो गई!"); } else { window.showToast("क्विज़ में पर्याप्त प्रतिभागी नहीं मिले।"); }
    } catch (err) { window.showToast("विजेता घोषणा त्रुटि: " + err.message); }
  };

  window.uploadBulkQuestions = async function() {
    if (!state.isCurrentUserOwner || !state.db) return window.showToast("केवल व्यवस्थापक के लिए!");
    const targetCol = byId("targetQBankSelect")?.value || "mainExamQuestions"; const rawText = byId("bulkQBankInput")?.value.trim();
    if (!rawText) return window.showToast("कृपया प्रश्न टेक्स्ट बॉक्स में पेस्ट करें!");
    const blocks = rawText.split(/\n\s*\n/); let parsed = [];
    for (let b of blocks) {
      const lines = b.split("\n").map(l => l.trim()).filter(Boolean); let qText = "", opts = [], ansIdx = 0;
      for (let l of lines) {
        if (l.match(/^Q\s*:/i)) qText = l.replace(/^Q\s*:/i, "").trim();
        else if (l.match(/^[A-D]\s*\)/i)) opts.push(l.replace(/^[A-D]\s*\)/i, "").trim());
        else if (l.match(/^Ans\s*:/i)) { const letAns = l.replace(/^Ans\s*:/i, "").trim().toUpperCase(); ansIdx = (letAns === "A") ? 0 : ((letAns === "B") ? 1 : ((letAns === "C") ? 2 : 3)); }
      }
      if (qText && opts.length >= 2) parsed.push({ q: qText, opts: opts, ans: ansIdx, section: "A" });
    }
    if (!parsed.length) return window.showToast("प्रारूप सही नहीं है (Q:, A), B), Ans:)!");
    try { const batch = state.db.batch(); parsed.forEach(item => { const ref = state.db.collection(targetCol).doc(); batch.set(ref, item); }); await batch.commit(); byId("bulkQBankInput").value = ""; window.showToast(`✅ ${parsed.length} प्रश्न बैंक में सफलतापूर्वक जोड़े गए!`); } catch (err) { window.showToast("अपलोड त्रुटि: " + err.message); }
  };

  window.syncOwnerVisibilityConfig = async function() {
    if (!state.isCurrentUserOwner || !state.db) return;
    const cfg = { enrollment: byId("toggleEnrollmentSection")?.checked || false, mock: byId("toggleMockSection")?.checked || false, mainExam: byId("toggleMainExamSection")?.checked || false, dailyQuiz: byId("toggleDailyQuizSection")?.checked || false, resultsPublished: byId("toggleResultsPublishedSection")?.checked || false };
    await state.db.collection("examConfig").doc("visibility").set(cfg, { merge: true }); window.showToast("✅ परीक्षा अनुभाग सेटिंग्स लाइव अपडेट हो गईं!");
  };

  function listenRealtimeSettings() {
    if (!state.db) return;
    state.db.collection("examConfig").doc("visibility").onSnapshot(doc => { if (doc.exists) { state.visibility = Object.assign(state.visibility, doc.data()); syncDOMWithVisibility(); } });
    state.db.collection("settings").doc("dailySandesh").onSnapshot(doc => { if (doc.exists && doc.data().text) { state.currentBannerText = doc.data().text; if (byId("dailyBannerText")) byId("dailyBannerText").innerText = state.currentBannerText; } });
  }

  function syncDOMWithVisibility() {
    if (byId("toggleEnrollmentSection")) byId("toggleEnrollmentSection").checked = state.visibility.enrollment;
    if (byId("toggleMockSection")) byId("toggleMockSection").checked = state.visibility.mock;
    if (byId("toggleMainExamSection")) byId("toggleMainExamSection").checked = state.visibility.mainExam;
    if (byId("toggleDailyQuizSection")) byId("toggleDailyQuizSection").checked = state.visibility.dailyQuiz;
    if (byId("toggleResultsPublishedSection")) byId("toggleResultsPublishedSection").checked = state.visibility.resultsPublished;
    byId("examEnrollmentBox")?.classList.toggle("hidden", !state.visibility.enrollment);
    byId("mockTestsHub")?.classList.toggle("hidden", !state.visibility.mock);
    byId("mainExamLaunchBox")?.classList.toggle("hidden", !state.visibility.mainExam);
    byId("examResultCheckDesk")?.classList.toggle("hidden", !state.visibility.resultsPublished);
    if (state.visibility.mainExam && state.visibility.examScheduleTime) window.startExamCountdownClock(state.visibility.examScheduleTime);
  }

  function initDistrictTelemetry() {
    const container = byId("districtTelemetryHeatmap"); if (!container) return;
    const sampleDistricts = [{ name: "हिसार (HR)", count: 248 }, { name: "सिरसा (HR)", count: 182 }, { name: "फतेहाबाद (HR)", count: 96 }, { name: "बीकानेर (RJ)", count: 312 }, { name: "जोधपुर (RJ)", count: 420 }, { name: "नागौर (RJ)", count: 175 }, { name: "बाड़मेर (RJ)", count: 140 }, { name: "अन्य अंचल", count: 88 }];
    container.innerHTML = sampleDistricts.map(d => `<div class="p-2.5 bg-white rounded-xl border border-stone-200"><div class="font-extrabold text-forest text-sm">${d.count}</div><div class="text-[10px] text-stone-500 font-semibold">${escapeHtml(d.name)}</div></div>`).join("");
  }

  // --------------------------------------------------------------------------
  // 20. BOOTSTRAP INITIALIZATION
  // --------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    initFirebase();
    renderNiyamsList();
    computeAutoPanchangAndAmavasya();
    initKaraokePlayer();
    initAuthUI();
    initMalaState();
    window.initBookmarksView();
    verifyPrivacyConsentStatus();
    listenRealtimeSettings();
    window.restoreAccidentalExamRefreshState();
    initDistrictTelemetry();
    setupInactivityGuard();
    window.loadChaupalPosts();
    window.renderShabadCards(SHABADWANI_CATALOG);
  });

})();
