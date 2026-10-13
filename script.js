/* ============================================================================
   BISHNOI DIGITAL PLATFORM - MODULE 1: CONFIG & DATA (config-data.js)
   ============================================================================ */

"use strict";

const PORTAL_CONFIG = {
    cloudflareWorkerUrl: "https://exam-snapshot-api.your-username.workers.dev",
    examSessionKey: "bishnoi_active_exam_state_v5",
    bookmarksKey: "bishnoi_saved_bookmarks_v5",
    enrollmentsKey: "bishnoi_enrolled_students_v5",
    submissionsKeyPrefix: "bishnoi_submissions_",
    admitConfigKey: "bishnoi_admit_custom_config_v5",
    lateExceptionsKey: "bishnoi_late_entry_exceptions_v5",
    eliminatedKey: "bishnoi_eliminated_students_v5",
    reChanceKey: "bishnoi_rechance_grants_v5",
    maintenanceKey: "bishnoi_maintenance_state_v5",
    chaupalPostsKey: "bishnoi_chaupal_posts_v5",
    podhaGalleryKey: "bishnoi_mera_podha_gallery_v5",
    notificationsKey: "bishnoi_app_notifications_v5",
    sectionWeightsKey: "bishnoi_section_weights_v5",
    offlinePacketKey: "bishnoi_offline_exam_packet_v5",
    offlineQueueKey: "bishnoi_offline_pending_sync_queue_v5",
    ownerHashKey: "bishnoi_owner_secret_hash_v5",
    delegateHashKey: "bishnoi_delegate_evaluator_hash_v5",
    resultDeclaredKey: "bishnoi_main_result_declared_v5"
};

const PORTAL_SECTIONS = [
    "home", "sahitya", "shabadwani", "niyam", "pariksha", 
    "jaap", "chaupal", "profile", "prabandhan"
];

let examRuntime = {
    isActive: false,
    examType: "main",
    rollNumber: "",
    studentName: "",
    district: "",
    questions: [],
    currentIndex: 0,
    answers: {},
    reviewMarked: {},
    timeSpentPerQ: {},
    startTimeEpoch: 0,
    endTimeEpoch: 0,
    tabWarnings: 0,
    timerInterval: null,
    webcamInterval: null,
    lastQuestionSwitchTime: 0
};

// Safe storage utilities
function readStore(key, fallbackVal) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallbackVal;
    } catch (e) {
        return fallbackVal;
    }
}

function writeStore(key, val) {
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
        console.warn("Storage write error:", e);
    }
}

function valOr(value, fallback) {
    return (value !== undefined && value !== null && value !== "") ? value : fallback;
}

// 29 Niyam Archive
const TWENTY_NINE_NIYAMS = [
    { id: 1, title: "तीस दिन सूतक पालणा", desc: "जन्म के पश्चात ३० दिनों तक माता व शिशु की स्वच्छता और स्वास्थ्य हेतु सूतक का पालन करना।" },
    { id: 2, title: "पाँच दिन रजस्वला नारी को न्यारा रखना", desc: "मासिक धर्म के दौरान ५ दिनों तक स्त्री को गृह कार्यों से विश्राम देना।" },
    { id: 3, title: "नित्य प्रातः काल स्नान करना", desc: "प्रतिदिन सूर्योदय से पूर्व उठकर शुद्ध जल से स्नान करना।" },
    { id: 4, title: "शील का पालन करना", desc: "चरित्र एवं आचरण को सदैव पवित्र व मर्यादित रखना।" },
    { id: 5, title: "संतोष धारण करना", desc: "लोभ त्यागकर परिश्रम की कमाई में संतोष रखना।" },
    { id: 6, title: "बाह्य एवं आंतरिक पवित्रता रखना", desc: "शरीर के साथ-साथ मन को भी कपट और द्वेष से मुक्त रखना।" },
    { id: 7, title: "द्विकाल संध्या वंदना करना", desc: "प्रातः और सायं दोनों समय ईश्वर का स्मरण व संध्या उपासना करना।" },
    { id: 8, title: "संध्या समय आरती व हरि गुण गाना", desc: "संध्या काल में निष्काम भाव से भगवान के गुणों का गान व आरती करना।" },
    { id: 9, title: "प्रातः काल हवन करना", desc: "पर्यावरण शुद्धि एवं आत्मिक शांति हेतु प्रतिदिन प्रेमपूर्वक हवन करना।" },
    { id: 10, title: "पानी, दूध व ईंधन छानकर प्रयोग करना", desc: "सूक्ष्म जीवों की रक्षा हेतु जल व दूध को छानकर और लकड़ी को देखकर काम में लेना।" },
    { id: 11, title: "वाणी विचार कर बोलना", desc: "सदैव सत्य, मधुर और हितकारी वचन ही बोलना।" },
    { id: 12, title: "क्षमा दया धारण करना", desc: "हृदय में प्रत्येक प्राणी के प्रति क्षमा और करुणा का भाव रखना।" },
    { id: 13, title: "चोरी नहीं करना", desc: "किसी भी पराई वस्तु को बिना अनुमति के ग्रहण न करना।" },
    { id: 14, title: "निंदा नहीं करना", desc: "किसी की पीठ पीछे बुराई या अपमानजनक बात न करना।" },
    { id: 15, title: "झूठ नहीं बोलना", desc: "स्वार्थ या भय वश कभी भी असत्य का सहारा न लेना।" },
    { id: 16, title: "वाद-विवाद नहीं करना", desc: "व्यर्थ के कुतर्क और कलह से दूर रहना।" },
    { id: 17, title: "अमावस्या का व्रत रखना", desc: "प्रत्येक माह की अमावस्या को उपवास, आत्मचिंतन व पर्यावरण सेवा करना।" },
    { id: 18, title: "विष्णु (ईश्वर) का भजन करना", desc: "सर्वव्यापक परमात्मा श्री हरि का निरंतर स्मरण करना।" },
    { id: 19, title: "जीव दया पालणी", desc: "समस्त प्राणी मात्र और मूक पशु-पक्षियों पर दया रखना व उनकी रक्षा करना।" },
    { id: 20, title: "हरा वृक्ष नहीं काटना (रूंख लीलो नी घावै)", desc: "प्रकृति संरक्षण हेतु कभी भी हरे वृक्ष को न काटना।" },
    { id: 21, title: "काम, क्रोध, मोह, लोभ व अहंकार को वश में रखना", desc: "मन के विकारों (अजर) को संयम द्वारा जीतना।" },
    { id: 22, title: "रसोई अपने हाथ से पवित्रता से बनाना", desc: "शुद्ध एवं सात्विक विचारों के साथ स्वयं पवित्र भोजन तैयार करना।" },
    { id: 23, title: "थाट (अमरशाला) में बधिया न करवाना", desc: "पशुओं के प्रति क्रूरता का त्याग करना।" },
    { id: 24, title: "अमल (अफीम) नहीं खाना", desc: "अफीम जैसे नशीले पदार्थों से पूर्णतः दूर रहना।" },
    { id: 25, title: "तम्बाकू का सेवन नहीं करना", desc: "धूम्रपान व तम्बाकू का किसी भी रूप में प्रयोग न करना।" },
    { id: 26, title: "भांग नहीं पीना", desc: "बुद्धि को भ्रमित करने वाली भांग का त्याग करना।" },
    { id: 27, title: "मद्यपान (शराब) नहीं करना", desc: "शराब तथा किसी भी प्रकार के मद्य से कोसों दूर रहना।" },
    { id: 28, title: "मांस भक्षण नहीं करना", desc: "पूर्णतः शाकाहारी जीवन जीना और मांसाहार का त्याग करना।" },
    { id: 29, title: "नीले वस्त्र धारण नहीं करना", desc: "नील के पौधे (प्रकृति) के दोहन से बने रंग का त्याग और सादगी अपनाना।" }
];

// Shabadwani Core Archive
const SHABADWANI_CORE_ARCHIVE = [
    { num: 1, title: "सबद १ - गुरु चिन्हारि", text: "ॐ गुरु चिन्हारि चिन्हारि, चित्त चीन्हो रे भाई! साचा सतगुरु सिरजनहारा, जिन यह सृष्टि उपाई।", meaning: "उस सच्चे सृष्टिकर्ता सतगुरु को अपने अंतःकरण में पहचानो जिसने संपूर्ण चराचर जगत की रचना की है।" },
    { num: 2, title: "सबद २ - लोइया तूं क्यों भूला", text: "लोइया तूं क्यों भूला रे भाई, काया काचो कुंभ कहाई। बिन हरि नाम मुक्ति नहीं पावै, अंत काल पछताई।", meaning: "हे मनुष्य! तू सांसारिक मोह में क्यों भूल रहा है? यह शरीर कच्चे घड़े के समान नश्वर है, हरि स्मरण के बिना कल्याण संभव नहीं।" },
    { num: 3, title: "सबद ३ - शील संतोष एवं दया धर्म", text: "जीया पर दया पालणी, रूंख लीलो नहिं घावै। साचै शबद सूं रत रहै, सोई बिश्नोई कहावै।", meaning: "प्राणी मात्र पर दया रखना, हरे वृक्ष न काटना और सत्य वाणी में रमण करना ही सच्चे बिश्नोई का लक्षण है।" },
    { num: 4, title: "सबद ४ - अमावस्या आत्मचिंतन", text: "अमावस व्रत राखणो, हवन जप सूं नेह। पाखंड भरम ने त्यागी के, पावो अमर सनेह।", meaning: "प्रत्येक अमावस्या को व्रत व हवन कर बाह्य आडंबरों को त्यागें और परमात्मा का अमर प्रेम प्राप्त करें।" },
    { num: 5, title: "सबद ५ - उत्तम करनी व शुद्ध आचरण", text: "करनी बिना कथनी थोथी, साचा सोई जो पालै। उन्तीस धर्म की पाळ बांधी, कूड़ कपट ने टालै।", meaning: "आचरण के बिना केवल कोरी बातें व्यर्थ हैं। जो २९ नियमों का निष्ठा से पालन कर कपट त्यागता है वही सच्चा साधक है।" }
];

// Synchronized Karaoke Lyrics
const KARAOKE_BHAJAN_LIBRARY = [
    {
        id: "bhajan1",
        title: "किस कारण जोग लिया रे, सुण गोपीचंद मेरा वीर",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        lines: [
            { time: 0, text: "🎵 किस कारण जोग लिया रे, सुण गोपीचंद मेरा वीर..." },
            { time: 6, text: "माता मनावै थारी मैनावती रानी, जोग मत लेई रे..." },
            { time: 12, text: "अमर बेल थारे राज महल में, भोग तज्या क्यों वीर..." },
            { time: 18, text: "काया तो काचो कुंभ है माता, बिन भजन माटी होय..." },
            { time: 24, text: "सतगुरु शरण में जाय के माता, अमर काया सोई होय..." },
            { time: 30, text: "जम्भेश्वर भगवान की वाणी, साचो राह दिखावै रे..." }
        ]
    },
    {
        id: "bhajan2",
        title: "गुरु जम्भेश्वर आरती - जय जम्भेश्वर देवा",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        lines: [
            { time: 0, text: "🪔 ॐ जय जम्भेश्वर देवा, स्वामी जय जम्भेश्वर देवा..." },
            { time: 6, text: "पीपासर में प्रगटे, समराथल डेरा लगाया..." },
            { time: 12, text: "उन्तीस धर्म नियम दे, भवसागर से तारा..." },
            { time: 18, text: "जीव दया और रूंख रक्षा का, अमर संदेश सुनाया..." },
            { time: 24, text: "सबदवाणी अमृत रस बरसे, जो जन मन से ध्यावै..." }
        ]
    }
];

// Default Standard Questions
const DEFAULT_EXAM_QUESTIONS = [
    { id: 1, section: "A", topic: "२९ नियम", q: "गुरु जम्भेश्वर भगवान ने विश्नोई पंथ की स्थापना किस वर्ष (विक्रम संवत) में की थी?", options: ["संवत १५४२", "संवत १५०८", "संवत १५९३", "संवत १६००"], ans: 0, explanation: "गुरु जम्भेश्वर भगवान ने कार्तिक वदी अष्टमी विक्रम संवत १५४२ (सन् १४८५) को समराथल धोरा पर कलश स्थापना कर विश्नोई पंथ का प्रवर्तन किया।" },
    { id: 2, section: "A", topic: "खेजड़ली इतिहास", q: "खेजड़ली बलिदान विक्रम संवत १७८७ में किसके नेतृत्व में ३६३ हुतात्माओं ने वृक्षों की रक्षा हेतु प्राण न्योछावर किए?", options: ["माता अमृता देवी बिश्नोई", "रामोजी बिश्नोई", "गिरधारीदास जी", "ल्होजी बिश्नोई"], ans: 0, explanation: "माता अमृता देवी बिश्नोई और उनकी तीन पुत्रियों सहित ३६३ विश्नोइयों ने 'सिर साँटे रूंख रहे तो भी सस्तो जाण' कहते हुए खेजड़ी वृक्षों के लिए बलिदान दिया।" },
    { id: 3, section: "B", topic: "सबदवाणी", q: "सबदवाणी में कुल कितने सबद (अध्याय/वाणी) संकलित हैं?", options: ["१२० सबद", "१०८ सबद", "२९ सबद", "१५१ सबद"], ans: 0, explanation: "श्री गुरु जम्भेश्वर भगवान द्वारा उच्चारित पवित्र वाणी 'सबदवाणी' में कुल १२० सबद प्रमाणिक रूप से संकलित हैं।" },
    { id: 4, section: "B", topic: "२९ नियम", q: "२९ नियमों के अंतर्गत किस तिथि को व्रत रखने व पर्यावरण-आत्मचिंतन का विशेष विधान है?", options: ["प्रत्येक अमावस्या", "प्रत्येक पूर्णिमा", "एकादशी", "चतुर्दशी"], ans: 0, explanation: "नियम १७ के अनुसार प्रत्येक माह की अमावस्या को व्रत, हवन, जीव दया तथा वृक्ष रक्षा का संकल्प लेने का विधान है।" }
];

function getActiveQuestionBank(examType = "main") {
    const specific = readStore(`bishnoi_qbank_${examType}_v5`, null);
    if (Array.isArray(specific) && specific.length > 0) return specific;
    const fallback = readStore("bishnoi_custom_question_bank_v5", null);
    return (Array.isArray(fallback) && fallback.length > 0) ? fallback : DEFAULT_EXAM_QUESTIONS;
}

function getSectionWeightsConfig() {
    return readStore(PORTAL_CONFIG.sectionWeightsKey, {
        A: { plus: 2, minus: 0.5 },
        B: { plus: 4, minus: 1 }
    });
}
/* ============================================================================
   BISHNOI DIGITAL PLATFORM - MODULE 2: EXAM ENGINE (exam-engine.js)
   ============================================================================ */

"use strict";

window._isPageRefreshingOrUnloading = false;

window.addEventListener("beforeunload", () => {
    window._isPageRefreshingOrUnloading = true;
    if (examRuntime && examRuntime.isActive) {
        persistExamStateToStorage();
    }
});

function bindRefreshSafeAntiCheat() {
    if (window._antiCheatInitialized) return;
    window._antiCheatInitialized = true;

    document.addEventListener("visibilitychange", () => {
        if (window._isPageRefreshingOrUnloading) return;

        if (document.hidden && examRuntime && examRuntime.isActive) {
            examRuntime.tabWarnings = (examRuntime.tabWarnings ? examRuntime.tabWarnings : 0) + 1;
            persistExamStateToStorage();

            if (examRuntime.tabWarnings >= 3) {
                logEliminatedStudent(examRuntime.rollNumber, examRuntime.studentName, "३ बार टैब स्विच करने पर निष्कासित");
                finalizeAndSubmitExam(true, "३ बार टैब स्विच उल्लंघन (Auto-Submitted)");
            } else {
                alert(`⚠️ कड़ी चेतावनी (${examRuntime.tabWarnings}/3): परीक्षा के दौरान ऐप या टैब बदलना सख्त वर्जित है! ३ चेतावनियों के बाद परीक्षा स्वतः लॉक हो जाएगी।`);
            }
        }
    });
}

function startPortalExamSession(examType = "main", rollNumberInput = "", studentNameInput = "", districtInput = "") {
    const rawRoll = valOr(rollNumberInput, prompt("🔐 सुरक्षित परीक्षा प्रवेश:\nअपना पंजीकृत रोल नंबर दर्ज करें (उदा. JAMBH-2026-1001):"));
    const roll = valOr(rawRoll, "").trim().toUpperCase();
    if (!roll) return;

    const eligibility = verifyExamHallEntryEligibility(roll, examType);
    if (!eligibility.allowed) return;

    const allQuestions = getActiveQuestionBank(examType);
    const defaultDuration = (examType === "daily") ? 10 : 40;
    const durationMins = eligibility.customDurationMins ? eligibility.customDurationMins : defaultDuration;
    const now = Date.now();

    examRuntime = {
        isActive: true,
        examType: examType,
        rollNumber: roll,
        studentName: valOr(studentNameInput, "परीक्षार्थी"),
        district: valOr(districtInput, "हिसार"),
        questions: shuffleArrayWithSeed([...allQuestions], roll + "_" + examType),
        currentIndex: 0,
        answers: {},
        reviewMarked: {},
        timeSpentPerQ: {},
        startTimeEpoch: now,
        endTimeEpoch: now + (durationMins * 60 * 1000),
        tabWarnings: 0,
        timerInterval: null,
        webcamInterval: null,
        lastQuestionSwitchTime: now
    };

    persistExamStateToStorage();
    openParikshaTabUI();
    renderActiveExamInterface();
    startAbsoluteExamTimer();
    startExamWebcamProctoring(roll);
    bindRefreshSafeAntiCheat();
}

function persistExamStateToStorage() {
    if (!examRuntime.isActive) return;
    writeStore(PORTAL_CONFIG.examSessionKey, {
        isActive: examRuntime.isActive,
        examType: examRuntime.examType,
        rollNumber: examRuntime.rollNumber,
        studentName: examRuntime.studentName,
        district: examRuntime.district,
        questions: examRuntime.questions,
        currentIndex: examRuntime.currentIndex,
        answers: examRuntime.answers,
        reviewMarked: examRuntime.reviewMarked,
        timeSpentPerQ: examRuntime.timeSpentPerQ,
        startTimeEpoch: examRuntime.startTimeEpoch,
        endTimeEpoch: examRuntime.endTimeEpoch,
        tabWarnings: examRuntime.tabWarnings
    });
}

function restoreActiveExamAfterRefresh() {
    const saved = readStore(PORTAL_CONFIG.examSessionKey, null);
    if (!saved || !saved.isActive) return;

    if (Date.now() >= saved.endTimeEpoch) {
        examRuntime = { ...examRuntime, ...saved };
        finalizeAndSubmitExam(true, "समय समाप्त (Auto-Submit on Refresh)");
        return;
    }

    examRuntime = {
        ...examRuntime,
        ...saved,
        lastQuestionSwitchTime: Date.now()
    };

    openParikshaTabUI();
    renderActiveExamInterface();
    startAbsoluteExamTimer();
    startExamWebcamProctoring(examRuntime.rollNumber);
    bindRefreshSafeAntiCheat();
    showToast(`🔄 सत्र पुनः बहाल! रोल नंबर ${examRuntime.rollNumber} — प्रश्न ${examRuntime.currentIndex + 1}`);
}

function startAbsoluteExamTimer() {
    if (examRuntime.timerInterval) clearInterval(examRuntime.timerInterval);

    examRuntime.timerInterval = setInterval(() => {
        if (!examRuntime.isActive) {
            clearInterval(examRuntime.timerInterval);
            return;
        }

        const remainingMs = examRuntime.endTimeEpoch - Date.now();
        if (remainingMs <= 0) {
            clearInterval(examRuntime.timerInterval);
            finalizeAndSubmitExam(true, "निर्धारित समय पूर्ण");
            return;
        }

        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);
        const timerBadge = document.getElementById("liveExamTimerBadge");
        if (timerBadge) {
            timerBadge.innerText = `⏳ शेष समय: ${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        }
    }, 1000);
}

function recordTimeOnCurrentQuestion() {
    if (!examRuntime.isActive) return;
    const curQ = examRuntime.questions[examRuntime.currentIndex];
    if (!curQ) return;
    const now = Date.now();
    const lastSwitch = examRuntime.lastQuestionSwitchTime ? examRuntime.lastQuestionSwitchTime : now;
    const elapsedSec = Math.max(1, Math.round((now - lastSwitch) / 1000));
    const prevSpent = examRuntime.timeSpentPerQ[curQ.id] ? examRuntime.timeSpentPerQ[curQ.id] : 0;
    examRuntime.timeSpentPerQ[curQ.id] = prevSpent + elapsedSec;
    examRuntime.lastQuestionSwitchTime = now;
}

function selectExamOption(qId, optIndex) {
    examRuntime.answers[qId] = optIndex;
    persistExamStateToStorage();
    renderActiveExamInterface();
}

function clearCurrentExamResponse(qId) {
    delete examRuntime.answers[qId];
    persistExamStateToStorage();
    renderActiveExamInterface();
}

function toggleMarkForReview(qId) {
    examRuntime.reviewMarked[qId] = !examRuntime.reviewMarked[qId];
    persistExamStateToStorage();
    renderActiveExamInterface();
}

function navigateExamQuestion(delta) {
    recordTimeOnCurrentQuestion();
    const nextIdx = examRuntime.currentIndex + delta;
    if (nextIdx >= 0 && nextIdx < examRuntime.questions.length) {
        examRuntime.currentIndex = nextIdx;
        persistExamStateToStorage();
        renderActiveExamInterface();
    }
}

function jumpToExamQuestion(index) {
    recordTimeOnCurrentQuestion();
    examRuntime.currentIndex = index;
    persistExamStateToStorage();
    renderActiveExamInterface();
}

function openPreSubmitSummaryModal() {
    const total = examRuntime.questions.length;
    const answered = Object.keys(examRuntime.answers).length;
    const skipped = total - answered;
    const reviewed = Object.values(examRuntime.reviewMarked).filter(Boolean).length;

    const confirmSubmit = confirm(
        `📋 ओएमआर उत्तर पुस्तिका समीक्षा (OMR Summary):\n\n` +
        `• कुल प्रश्न: ${total}\n` +
        `• ✓ हल किए गए: ${answered}\n` +
        `• ⭕ छोड़े गए: ${skipped}\n` +
        `• 🟠 पुनर्विचार हेतु: ${reviewed}\n\n` +
        `क्या आप अपनी उत्तर पुस्तिका अंतिम रूप से जमा करना चाहते हैं?`
    );

    if (confirmSubmit) {
        finalizeAndSubmitExam(false, "परीक्षार्थी द्वारा सफलतापूर्वक सबमिट");
    }
}

function renderActiveExamInterface() {
    const container = document.getElementById("pariksha");
    if (!container || !examRuntime.isActive) return;

    const qObj = examRuntime.questions[examRuntime.currentIndex];
    if (!qObj) return;

    const selectedOpt = examRuntime.answers[qObj.id];
    const isReviewed = Boolean(examRuntime.reviewMarked[qObj.id]);
    const isBookmarked = isQuestionBookmarked(qObj.id);
    const weights = getSectionWeightsConfig();
    const secKey = valOr(qObj.section, "A");
    const secRule = weights[secKey] ? weights[secKey] : { plus: 2, minus: 0.5 };
    const topicLabel = valOr(qObj.topic, "जम्भवाणी साहित्य");

    const bookmarkBtnCls = isBookmarked ? "bg-amber-400 text-emerald-950 border-amber-500" : "bg-gray-50 text-gray-700 border-gray-300";
    const reviewBtnCls = isReviewed ? "bg-amber-500 text-white border-amber-600" : "bg-amber-50 text-amber-900 border-amber-300";

    const optionsHtml = qObj.options.map((optText, idx) => {
        const isChecked = (selectedOpt === idx);
        const cardCls = isChecked ? "border-emerald-700 bg-emerald-50/80 shadow-md" : "border-gray-200 bg-white hover:border-emerald-300";
        const badgeCls = isChecked ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-700";
        return `
            <label onclick="selectExamOption(${qObj.id}, ${idx})" class="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${cardCls}">
                <input type="radio" name="exam_q_${qObj.id}" value="${idx}" ${isChecked ? "checked" : ""} class="w-5 h-5 text-emerald-700" />
                <span class="font-bold text-sm px-2.5 py-0.5 rounded-lg ${badgeCls}">${String.fromCharCode(65 + idx)}</span>
                <span class="text-gray-900 font-semibold text-base flex-1">${optText}</span>
            </label>
        `;
    }).join("");

    const paletteHtml = examRuntime.questions.map((item, idx) => {
        const ans = (examRuntime.answers[item.id] !== undefined);
        const rev = Boolean(examRuntime.reviewMarked[item.id]);
        let colorCls = "bg-gray-100 text-gray-700 border-gray-300";
        if (rev) colorCls = "bg-amber-500 text-white border-amber-600";
        else if (ans) colorCls = "bg-emerald-600 text-white border-emerald-700";
        if (idx === examRuntime.currentIndex) colorCls += " ring-2 ring-offset-2 ring-emerald-950";
        return `<button onclick="jumpToExamQuestion(${idx})" class="w-9 h-9 rounded-xl font-bold text-xs border ${colorCls}">${idx + 1}</button>`;
    }).join("");

    container.innerHTML = `
        <div id="activeExamMasterCard" class="max-w-4xl mx-auto my-4 bg-white rounded-3xl shadow-2xl border-2 border-emerald-800 overflow-hidden">
            <div class="bg-emerald-950 text-white p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <span class="px-2.5 py-0.5 bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-full uppercase">सुरक्षित परीक्षा कक्ष (${examRuntime.examType.toUpperCase()})</span>
                    <h3 class="font-bold text-base mt-1">${examRuntime.studentName} <span class="text-amber-300 text-xs">(${examRuntime.rollNumber})</span></h3>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-xs bg-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-600">✓ रिफ्रेश-सेफ मोड</span>
                    <span id="liveExamTimerBadge" class="font-mono font-extrabold text-base bg-amber-500 text-emerald-950 px-4 py-1.5 rounded-xl shadow">⏳ गणना...</span>
                </div>
            </div>
            <div class="p-6">
                <div class="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-gray-200">
                    <div class="flex items-center gap-2">
                        <span class="px-3 py-1 bg-emerald-100 text-emerald-900 font-extrabold text-sm rounded-xl">प्रश्न ${examRuntime.currentIndex + 1} / ${examRuntime.questions.length}</span>
                        <span class="px-3 py-1 bg-gray-100 text-gray-800 font-bold text-xs rounded-xl">खंड ${secKey}: +${secRule.plus} / -${secRule.minus} अंक</span>
                        <span class="px-3 py-1 bg-amber-50 text-amber-900 font-semibold text-xs rounded-xl">${topicLabel}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="toggleQuestionBookmark(${qObj.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition ${bookmarkBtnCls}">
                            ${isBookmarked ? "⭐ सहेजा गया" : "☆ प्रश्न सहेजें"}
                        </button>
                        <button onclick="clearCurrentExamResponse(${qObj.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                            🧹 उत्तर साफ़ करें
                        </button>
                    </div>
                </div>
                <h2 class="text-lg md:text-xl font-extrabold text-gray-900 leading-relaxed mb-6">${qObj.q}</h2>
                <div class="space-y-3 mb-6">${optionsHtml}</div>
                <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                    <div class="flex items-center gap-2">
                        <button onclick="navigateExamQuestion(-1)" ${examRuntime.currentIndex === 0 ? "disabled" : ""} class="px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-800 disabled:opacity-40">⬅️ पिछला</button>
                        <button onclick="toggleMarkForReview(${qObj.id})" class="px-4 py-2.5 rounded-xl font-bold text-sm border ${reviewBtnCls}">
                            ${isReviewed ? "🟠 चिह्नित" : "पुनर्विचार हेतु रखें"}
                        </button>
                        <button onclick="navigateExamQuestion(1)" ${examRuntime.currentIndex === examRuntime.questions.length - 1 ? "disabled" : ""} class="px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-700 text-white disabled:opacity-40">अगला ➡️</button>
                    </div>
                    <button onclick="openPreSubmitSummaryModal()" class="px-6 py-2.5 rounded-xl font-extrabold text-sm bg-emerald-950 text-amber-300 border border-amber-400 shadow-lg hover:bg-emerald-900">
                        ✅ उत्तर पुस्तिका जमा करें (Final Submit)
                    </button>
                </div>
                <div class="mt-6 pt-4 border-t border-gray-100">
                    <p class="text-xs font-bold text-gray-500 uppercase mb-2">ओएमआर प्रश्न पैलेट:</p>
                    <div class="flex flex-wrap gap-2">${paletteHtml}</div>
                </div>
            </div>
            <div class="hidden">
                <video id="examWebcamStream" autoplay playsinline width="320" height="240"></video>
                <canvas id="examSnapshotCanvas" width="320" height="240"></canvas>
            </div>
        </div>
    `;
}

function finalizeAndSubmitExam(isForced = false, statusNote = "Submitted") {
    recordTimeOnCurrentQuestion();
    examRuntime.isActive = false;
    if (examRuntime.timerInterval) clearInterval(examRuntime.timerInterval);
    stopExamWebcamProctoring();

    localStorage.removeItem(PORTAL_CONFIG.examSessionKey);

    const weights = getSectionWeightsConfig();
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;

    examRuntime.questions.forEach(q => {
        const chosen = examRuntime.answers[q.id];
        const secKey = valOr(q.section, "A");
        const rule = weights[secKey] ? weights[secKey] : { plus: 2, minus: 0.5 };
        if (chosen !== undefined) {
            if (Number(chosen) === Number(q.ans)) {
                totalScore += Number(rule.plus);
                correctCount++;
            } else {
                totalScore -= Number(rule.minus);
                wrongCount++;
            }
        }
    });

    totalScore = Number(totalScore.toFixed(2));

    const submissionRecord = {
        rollNumber: examRuntime.rollNumber,
        studentName: examRuntime.studentName,
        district: examRuntime.district,
        examType: examRuntime.examType,
        score: totalScore,
        correctCount: correctCount,
        wrongCount: wrongCount,
        unansweredCount: examRuntime.questions.length - (correctCount + wrongCount),
        answers: examRuntime.answers,
        timeSpentPerQ: examRuntime.timeSpentPerQ,
        tabWarnings: examRuntime.tabWarnings,
        isForcedSubmission: isForced,
        statusNote: statusNote,
        manualEvaluated: false,
        submittedAt: new Date().toLocaleString("hi-IN")
    };

    saveSubmissionToSeparateSheet(examRuntime.examType, submissionRecord);

    const container = document.getElementById("pariksha") ? document.getElementById("pariksha") : document.body;
    container.innerHTML = `
        <div class="max-w-4xl mx-auto my-6 space-y-6">
            <div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-700 p-6 md:p-8 text-center">
                <div class="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-extrabold">✓</div>
                <span class="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full uppercase">${examRuntime.examType.toUpperCase()} उत्तर पुस्तिका जमा</span>
                <h2 class="text-2xl font-extrabold text-gray-900 mt-2">उत्तर पुस्तिका सफलतापूर्वक जमा हो गई है!</h2>
                <p class="text-sm text-gray-600 mt-1">रोल नंबर: <strong>${submissionRecord.rollNumber}</strong> | परीक्षार्थी: <strong>${submissionRecord.studentName}</strong></p>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
                    <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <div class="text-xs text-emerald-800 font-bold">प्राप्तांक</div>
                        <div class="text-xl font-extrabold text-emerald-950">${submissionRecord.score}</div>
                    </div>
                    <div class="p-3 bg-green-50 rounded-2xl border border-green-200">
                        <div class="text-xs text-green-800 font-bold">सही उत्तर</div>
                        <div class="text-xl font-extrabold text-green-900">${submissionRecord.correctCount}</div>
                    </div>
                    <div class="p-3 bg-red-50 rounded-2xl border border-red-200">
                        <div class="text-xs text-red-800 font-bold">गलत उत्तर</div>
                        <div class="text-xl font-extrabold text-red-900">${submissionRecord.wrongCount}</div>
                    </div>
                    <div class="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                        <div class="text-xs text-amber-800 font-bold">छोड़े गए</div>
                        <div class="text-xl font-extrabold text-amber-900">${submissionRecord.unansweredCount}</div>
                    </div>
                </div>
                <div class="flex flex-wrap justify-center gap-3">
                    <button onclick="openOfficialMarksheetAndCertificatePrintWindowByRoll('${submissionRecord.rollNumber}', '${examRuntime.examType}')" class="px-5 py-2.5 bg-amber-500 text-emerald-950 font-extrabold text-sm rounded-xl shadow hover:bg-amber-400">
                        📜 अंक-तालिका एवं प्रमाण-पत्र
                    </button>
                    <button onclick="unlockStuckParikshaScreenAndReset()" class="px-5 py-2.5 bg-emerald-800 text-white font-bold text-sm rounded-xl shadow hover:bg-emerald-900">
                        🔄 परीक्षा मुख्य पटल पर लौटें
                    </button>
                </div>
            </div>
            <!-- AI Sahayak Bottom Assistant -->
            <div id="aiSahayakBottomWidget" class="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white rounded-3xl p-6 shadow-xl border border-amber-400/40">
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2.5 py-1 bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-lg">🤖 AI सहायक</span>
                    <h4 class="font-bold text-base text-amber-300">जम्भवाणी एवं परीक्षा शंका समाधान</h4>
                </div>
                <p class="text-xs text-emerald-100 mb-4">किसी भी प्रश्न या ग्रंथ संदर्भ के विषय में पूछें:</p>
                <div class="flex flex-col sm:flex-row gap-2">
                    <input id="aiSahayakQueryInput" type="text" placeholder="उदा: खेजड़ली बलिदान संवत क्या है?" class="flex-1 px-4 py-2.5 rounded-xl text-gray-900 font-semibold text-sm focus:outline-none" />
                    <button onclick="askAiSahayakBottomEngine()" class="px-5 py-2.5 bg-amber-500 text-emerald-950 font-extrabold text-sm rounded-xl hover:bg-amber-400">उत्तर जानें ✨</button>
                </div>
                <div id="aiSahayakResponseOutput" class="mt-3 text-sm text-amber-200 font-medium hidden p-3 bg-emerald-950/60 rounded-xl border border-emerald-700"></div>
            </div>
        </div>
    `;
}

function askAiSahayakBottomEngine() {
    const input = document.getElementById("aiSahayakQueryInput");
    const out = document.getElementById("aiSahayakResponseOutput");
    if (!input || !out) return;
    const q = input.value.trim();
    if (!q) return;

    out.classList.remove("hidden");
    const match = getActiveQuestionBank().find(item => q.includes(item.topic) || item.q.includes(q.slice(0, 6)));
    if (match && match.explanation) {
        out.innerHTML = `<strong>📖 ग्रंथ संदर्भ स्पष्टीकरण:</strong> ${match.explanation}`;
    } else {
        out.innerHTML = `<strong>📖 AI सहायक उत्तर:</strong> गुरु जम्भेश्वर भगवान द्वारा प्रवर्तित २९ नियमों में जीव दया, हरे वृक्षों की रक्षा ('सिर साँटे रूंख रहे तो भी सस्तो जाण') और पवित्र आचरण को सर्वोच्च स्थान दिया गया है।`;
    }
}

function startExamWebcamProctoring(rollNumber) {
    const video = document.getElementById("examWebcamStream");
    if (!video || !navigator.mediaDevices) return;

    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } }).then(stream => {
        video.srcObject = stream;
        examRuntime.webcamInterval = setInterval(() => {
            const canvas = document.getElementById("examSnapshotCanvas");
            if (!canvas) return;
            canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
            const imgBase64 = canvas.toDataURL("image/jpeg", 0.5);
            fetch(PORTAL_CONFIG.cloudflareWorkerUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rollNumber: rollNumber, image: imgBase64 })
            }).catch(() => {});
        }, 180000);
    }).catch(() => {});
}

function stopExamWebcamProctoring() {
    if (examRuntime.webcamInterval) clearInterval(examRuntime.webcamInterval);
    const video = document.getElementById("examWebcamStream");
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
    }
}
/* ============================================================================
   BISHNOI DIGITAL PLATFORM - MODULE 3: ADMIN STUDIO (admin-studio.js)
   ============================================================================ */

"use strict";

function initOwnerAndDelegateSecurity() {
    if (!localStorage.getItem(PORTAL_CONFIG.ownerHashKey)) {
        localStorage.setItem(PORTAL_CONFIG.ownerHashKey, btoa("pin_2929_secure"));
    }
    if (!localStorage.getItem(PORTAL_CONFIG.delegateHashKey)) {
        localStorage.setItem(PORTAL_CONFIG.delegateHashKey, btoa("delegate_1929_eval"));
    }
}

function verifyOwnerSecretPin(onSuccess) {
    const entered = prompt("🔐 व्यवस्थापक सुरक्षा सत्यापन:\nकृपया अपना गुप्त व्यवस्थापक सुरक्षा पिन दर्ज करें:");
    if (!entered) return;
    const stored = localStorage.getItem(PORTAL_CONFIG.ownerHashKey);
    if (btoa("pin_" + entered.trim() + "_secure") === stored) {
        onSuccess();
    } else {
        alert("❌ अमान्य सुरक्षा पिन!");
    }
}

function verifyOwnerOrDelegatePin(onSuccess) {
    const entered = prompt("🔐 मूल्यांकन सत्यापन:\nव्यवस्थापक अथवा अधिकृत डेलिगेट पिन दर्ज करें:");
    if (!entered) return;
    const clean = entered.trim();
    const ownerHash = localStorage.getItem(PORTAL_CONFIG.ownerHashKey);
    const delegateHash = localStorage.getItem(PORTAL_CONFIG.delegateHashKey);

    if (btoa("pin_" + clean + "_secure") === ownerHash || btoa("delegate_" + clean + "_eval") === delegateHash) {
        onSuccess();
    } else {
        alert("❌ अमान्य पिन!");
    }
}

function renderOwnerAdminStudioCompleteUI() {
    const studioTarget = document.getElementById("prabandhan") ? document.getElementById("prabandhan") : document.getElementById("adminStudioContainer");
    if (!studioTarget || document.getElementById("ownerStudioFiveFolderMaster")) return;

    const studioBox = document.createElement("div");
    studioBox.id = "ownerStudioFiveFolderMaster";
    studioBox.className = "max-w-6xl mx-auto my-8 bg-white rounded-3xl shadow-2xl border-2 border-emerald-900 overflow-hidden";

    const cfg = getAdmitCardConfig();
    const weights = getSectionWeightsConfig();
    const singleBoxDefault = `${cfg.examTitle} | ${cfg.examDate} | ${cfg.examTime} | ${cfg.examStartISO} | ${cfg.venue} | ${cfg.lateCutoffMins} | ${cfg.instructions}`;

    studioBox.innerHTML = `
        <div class="bg-emerald-950 text-white p-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-amber-400">
            <div>
                <span class="px-3 py-1 bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-full uppercase">व्यवस्थापक नियंत्रण कक्ष (Owner Studio v6.0)</span>
                <h2 class="text-xl md:text-2xl font-extrabold text-amber-300 mt-1">🏛️ ५-फ़ोल्डर परीक्षा एवं पोर्टल प्रबंधन स्टूडियो</h2>
            </div>
            <div class="flex flex-wrap gap-2">
                <button onclick="changeOwnerSecretPinModal()" class="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold text-xs rounded-xl border border-emerald-600">🔐 पिन बदलें</button>
                <button onclick="setAuthorizedDelegatePinModal()" class="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl">🔑 डेलिगेट पिन</button>
                <button onclick="exportAutoRankedExcelSheet('main')" class="px-4 py-2 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-xl shadow">📊 मुख्य Excel डाउनलोड</button>
            </div>
        </div>
        <div class="bg-emerald-50 p-3 flex flex-wrap gap-2 border-b border-emerald-200">
            <button onclick="switchOwnerStudioFolder(1)" id="studioTabBtn1" class="px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-emerald-900 text-amber-300 shadow">📁 १. परीक्षा नियंत्रण व Excel</button>
            <button onclick="switchOwnerStudioFolder(2)" id="studioTabBtn2" class="px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-white text-emerald-950 border border-emerald-200">📁 २. बल्क प्रश्न बैंक</button>
            <button onclick="switchOwnerStudioFolder(3)" id="studioTabBtn3" class="px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-white text-emerald-950 border border-emerald-200">📁 ३. सिंगल-बॉक्स प्रवेश-पत्र</button>
            <button onclick="switchOwnerStudioFolder(4)" id="studioTabBtn4" class="px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-white text-emerald-950 border border-emerald-200">📁 ४. कॉपी चेकिंग व टेलीमेट्री</button>
            <button onclick="switchOwnerStudioFolder(5)" id="studioTabBtn5" class="px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-white text-emerald-950 border border-emerald-200">📁 ५. मेंटेनेंस मोड</button>
        </div>
        <div class="p-6">
            <!-- FOLDER 1 -->
            <div id="studioFolderPanel1" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                        <h3 class="font-extrabold text-base text-emerald-950 mb-1">📊 मेरिट एवं परिणाम शीट्स (.xlsx)</h3>
                        <div class="grid grid-cols-2 gap-2 mt-3">
                            <button onclick="exportAutoRankedExcelSheet('main')" class="p-2.5 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl">मुख्य परीक्षा (.xlsx)</button>
                            <button onclick="exportAutoRankedExcelSheet('mock1')" class="p-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl">मॉक टेस्ट १ (.xlsx)</button>
                            <button onclick="exportAutoRankedExcelSheet('mock2')" class="p-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl">मॉक टेस्ट २ (.xlsx)</button>
                            <button onclick="exportAutoRankedExcelSheet('daily')" class="p-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl">दैनिक क्विज़ (.xlsx)</button>
                            <button onclick="exportAutoRankedExcelSheet('enrolled')" class="p-2.5 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-xl">नामांकित छात्र (.xlsx)</button>
                            <button onclick="announceDailyQuizWinners()" class="p-2.5 bg-purple-800 text-white font-extrabold text-xs rounded-xl">🏆 विजेता घोषणा</button>
                        </div>
                        <div class="mt-4 pt-3 border-t flex flex-wrap gap-2">
                            <button onclick="exportStandardFormattedOwnerPDF('main')" class="px-3 py-2 bg-emerald-950 text-amber-300 font-extrabold text-xs rounded-xl">🖨️ मेरिट PDF</button>
                            <button onclick="exportStandardFormattedOwnerPDF('enrolled')" class="px-3 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl">🖨️ नामांकित PDF</button>
                            <button onclick="exportSevenDayMembersExcel()" class="px-3 py-2 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-xl">📥 ७ दिवसीय सदस्य Excel</button>
                        </div>
                    </div>
                    <div class="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-4">
                        <div>
                            <h3 class="font-extrabold text-base text-amber-950 mb-1">🔓 लेट-एंट्री अनुमति (Late Entry Override)</h3>
                            <div class="flex gap-2">
                                <input id="studioLateRollInput" type="text" placeholder="रोल नंबर" class="flex-1 px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold" />
                                <button onclick="grantOwnerLateEntryOverride(document.getElementById('studioLateRollInput').value)" class="px-4 py-2 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-xl">प्रवेश दें ✓</button>
                            </div>
                        </div>
                        <div class="pt-3 border-t border-amber-200">
                            <h3 class="font-extrabold text-base text-red-900 mb-1">⏳ निष्कासित छात्र को 'दूसरा मौका'</h3>
                            <div class="grid grid-cols-3 gap-2">
                                <input id="studioReChanceRoll" type="text" placeholder="रोल नंबर" class="px-3 py-2 rounded-xl border border-red-200 text-xs font-bold" />
                                <input id="studioReChanceMins" type="number" placeholder="मिनट" value="25" class="px-3 py-2 rounded-xl border border-red-200 text-xs font-bold" />
                                <button onclick="grantCustomReChanceToStudent()" class="px-3 py-2 bg-red-700 text-white font-extrabold text-xs rounded-xl">अनुमति दें</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="liveProctoringStatsWidget"></div>
                <div class="p-5 bg-white rounded-2xl border border-gray-200">
                    <h4 class="font-extrabold text-sm text-gray-900 mb-2">📈 लाइव ऑटो-रैंक्ड वरीयता तालिका</h4>
                    <div id="liveAutoRankedTableBody" class="overflow-x-auto"></div>
                </div>
            </div>

            <!-- FOLDER 2 -->
            <div id="studioFolderPanel2" class="hidden space-y-6">
                <div class="p-5 bg-white rounded-2xl border-2 border-emerald-700/30">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <label class="text-xs font-extrabold text-emerald-950">🎯 परीक्षा श्रेणी चुनें:</label>
                        <select id="bulkExamTypeTargetSelect" class="px-3 py-1.5 rounded-xl border border-emerald-600 text-xs font-extrabold">
                            <option value="main">मुख्य परीक्षा (Main Exam)</option>
                            <option value="mock1">मॉक टेस्ट १</option>
                            <option value="mock2">मॉक टेस्ट २</option>
                            <option value="daily">दैनिक प्रश्नोत्तरी</option>
                        </select>
                    </div>
                    <textarea id="bulkQuestionBankTextarea" rows="6" placeholder="प्रश्न | विकल्प A | विकल्प B | विकल्प C | विकल्प D | सही विकल्प (1-4) | खंड (A/B) | विषय" class="w-full p-3.5 rounded-2xl border border-gray-300 font-mono text-xs"></textarea>
                    <div id="bulkQuestionValidatorFeedback" class="my-2 text-xs font-bold"></div>
                    <div class="flex gap-3 mt-3">
                        <button onclick="validateBulkQuestionBankInput()" class="px-5 py-2.5 bg-amber-100 text-amber-950 border border-amber-400 font-extrabold text-xs rounded-xl">🔍 फॉर्मेट जाँचें</button>
                        <button onclick="uploadValidatedBulkQuestionBank()" class="px-6 py-2.5 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl shadow">🚀 पब्लिश करें</button>
                    </div>
                </div>
            </div>

            <!-- FOLDER 3 -->
            <div id="studioFolderPanel3" class="hidden space-y-6">
                <div class="p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <h3 class="font-extrabold text-base text-emerald-950 mb-1">🎫 सिंगल-बॉक्स प्रवेश-पत्र कस्टमाइज़र</h3>
                    <textarea id="singleBoxAdmitConfigInput" rows="3" class="w-full p-3 rounded-xl border border-emerald-300 text-xs font-semibold">${singleBoxDefault}</textarea>
                    <button onclick="saveSingleBoxAdmitCardConfig(document.getElementById('singleBoxAdmitConfigInput').value)" class="mt-3 px-6 py-2.5 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl shadow">✅ अपडेट करें</button>
                </div>
            </div>

            <!-- FOLDER 4 -->
            <div id="studioFolderPanel4" class="hidden space-y-6">
                <div class="p-5 bg-amber-50/60 rounded-2xl border border-amber-200">
                    <h3 class="font-extrabold text-base text-amber-950 mb-1">📝 मैनुअल कॉपी चेकिंग</h3>
                    <div class="flex gap-2">
                        <input id="manualEvalRollInput" type="text" placeholder="रोल नंबर" class="flex-1 px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold" />
                        <select id="manualEvalSheetSelect" class="px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold">
                            <option value="main">मुख्य परीक्षा</option>
                            <option value="mock1">मॉक १</option>
                            <option value="mock2">मॉक २</option>
                            <option value="daily">दैनिक क्विज़</option>
                        </select>
                        <button onclick="openDetailedManualEvaluationViewer()" class="px-5 py-2 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl">🔍 कॉपी खोलें</button>
                    </div>
                    <div id="manualEvalDetailedBox" class="mt-4"></div>
                </div>
                <div class="p-5 bg-white rounded-2xl border border-gray-200">
                    <h3 class="font-extrabold text-base text-gray-900 mb-2">🗺️ जिला टेलीमेट्री</h3>
                    <div id="districtTelemetryHeatmapGrid" class="grid grid-cols-2 sm:grid-cols-4 gap-3"></div>
                </div>
            </div>

            <!-- FOLDER 5 -->
            <div id="studioFolderPanel5" class="hidden space-y-6">
                <div class="p-5 bg-red-50/70 rounded-2xl border border-red-200">
                    <h3 class="font-extrabold text-base text-red-950 mb-2">🛠️ कस्टम मेंटेनेंस मोड</h3>
                    <div class="flex gap-3">
                        <button onclick="setPortalMaintenanceState(true)" class="px-5 py-2.5 bg-red-700 text-white font-extrabold text-xs rounded-xl">🔒 मेंटेनेंस चालू करें</button>
                        <button onclick="setPortalMaintenanceState(false)" class="px-5 py-2.5 bg-emerald-700 text-white font-extrabold text-xs rounded-xl">🟢 मेंटेनेंस बंद करें</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    studioTarget.appendChild(studioBox);
    renderDistrictTelemetryUI();
    loadLiveProctoringStats();
    renderLiveAutoRankedPreviewTable("main");
}

function switchOwnerStudioFolder(folderNum) {
    for (let i = 1; i <= 5; i++) {
        const panel = document.getElementById(`studioFolderPanel${i}`);
        const btn = document.getElementById(`studioTabBtn${i}`);
        if (panel) panel.classList.toggle("hidden", i !== folderNum);
        if (btn) {
            btn.className = (i === folderNum)
                ? "px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-emerald-900 text-amber-300 shadow"
                : "px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-white text-emerald-950 border border-emerald-200";
        }
    }
}
/* ============================================================================
   BISHNOI DIGITAL PLATFORM - MODULE 4: APP UI & INTEGRATION (app-ui.js)
   ============================================================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // Unregister legacy Service Workers
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).catch(() => {});
    }

    // Dynamic SheetJS loading
    if (!window.XLSX && !document.getElementById("sheetJsXlsxScript")) {
        const sc = document.createElement("script");
        sc.id = "sheetJsXlsxScript";
        sc.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
        document.head.appendChild(sc);
    }

    initOwnerAndDelegateSecurity();
    scrubDefaultPin2929FromDOM();
    checkMaintenanceOverlayOnLoad();
    initKaraokeSection();
    initShabadwaniReaderAndSearch();
    render29NiyamCards();
    injectInteractiveJaapMalaAndReminderUI();
    initJaapMalaAndStreakUI();
    injectInteractiveChaupalAndMeraPodhaForms();
    renderChaupalFeed();
    renderMeraPodhaGallery();
    renderNotificationsBell();
    updateAutoPanchangAndAmavasyaWidget();
    initExamCountdownWatcher();

    renderParikshaHubIfIdle();
    injectOfflinePacketLoaderAndSyncBar();
    renderDailyWinnerPublicBanner();
    renderOwnerAdminStudioCompleteUI();
    renderCompleteStudentProfileDashboard();

    restoreActiveExamAfterRefresh();
    flushOfflineExamQueue();
});

// Navigation Controller
function switchPortalSection(targetSectionId) {
    if (examRuntime && examRuntime.isActive && targetSectionId !== "pariksha") {
        alert("⚠️ आपकी परीक्षा अभी चल रही है! परीक्षा सबमिट किए बिना अन्य अनुभाग में जाना वर्जित है।");
        return;
    }
    const cleanId = valOr(targetSectionId, "home").replace("#", "").trim();
    PORTAL_SECTIONS.forEach(secId => {
        const el = document.getElementById(secId);
        if (el) {
            if (secId === cleanId) {
                el.classList.remove("hidden");
                el.style.display = "";
            } else if (el.hasAttribute("data-tab-section")) {
                el.classList.add("hidden");
            }
        }
    });

    const targetEl = document.getElementById(cleanId);
    if (targetEl) {
        targetEl.classList.remove("hidden");
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (cleanId === "profile") {
        renderCompleteStudentProfileDashboard();
    } else if (cleanId === "prabandhan") {
        renderDistrictTelemetryUI();
        loadLiveProctoringStats();
    }
}

function showToast(msg) {
    let toast = document.getElementById("portalGlobalToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "portalGlobalToast";
        toast.className = "fixed bottom-16 right-4 z-[9999] bg-emerald-950 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl border border-amber-400 text-xs font-extrabold";
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 4000);
}

// Complete Window Global Exports (Guarantees zero 'function not defined' errors)
Object.assign(window, {
    switchTab: switchPortalSection,
    switchPortalSection: switchPortalSection,
    startPortalExamSession: startPortalExamSession,
    triggerHubExamStart: triggerHubExamStart,
    selectExamOption: selectExamOption,
    clearCurrentExamResponse: clearCurrentExamResponse,
    toggleMarkForReview: toggleMarkForReview,
    navigateExamQuestion: navigateExamQuestion,
    jumpToExamQuestion: jumpToExamQuestion,
    openPreSubmitSummaryModal: openPreSubmitSummaryModal,
    finalizeAndSubmitExam: finalizeAndSubmitExam,
    toggleQuestionBookmark: toggleQuestionBookmark,
    renderClearBookmarksInProfile: renderClearBookmarksInProfile,
    renderCompleteStudentProfileDashboard: renderCompleteStudentProfileDashboard,
    enrollStudentWithPhotoAndGenerateAdmitCard: enrollStudentWithPhotoAndGenerateAdmitCard,
    handleHubStudentEnrollmentSubmit: handleHubStudentEnrollmentSubmit,
    openNationalStandardAdmitCardPrintWindow: openNationalStandardAdmitCardPrintWindow,
    downloadStudentCertificate: downloadStudentCertificate,
    render29NiyamCards: render29NiyamCards,
    initKaraokeSection: initKaraokeSection,
    loadKaraokeTrack: loadKaraokeTrack,
    incrementJaapMalaBead: incrementJaapMalaBead,
    recordDailyJaapMalaStreak: recordDailyJaapMalaStreak,
    saveCustomDailyReminderTime: saveCustomDailyReminderTime,
    renderChaupalFeed: renderChaupalFeed,
    upvoteChaupalPost: upvoteChaupalPost,
    reactSingleEmojiToPost: reactSingleEmojiToPost,
    addCommentToChaupalPost: addCommentToChaupalPost,
    reactSingleEmojiToComment: reactSingleEmojiToComment,
    submitNewChaupalPost: submitNewChaupalPost,
    uploadMeraPodhaPledgeWithPhoto: uploadMeraPodhaPledgeWithPhoto,
    renderMeraPodhaGallery: renderMeraPodhaGallery,
    pledgeTree: function() {
        const name = prompt("🌳 हरित संकल्प:\nअपना नाम दर्ज करें:");
        if (name) {
            uploadMeraPodhaPledgeWithPhoto(name, "विश्नोई क्षेत्र", "");
        }
    },
    switchOwnerStudioFolder: switchOwnerStudioFolder,
    verifyOwnerSecretPin: verifyOwnerSecretPin,
    verifyOwnerOrDelegatePin: verifyOwnerOrDelegatePin,
    changeOwnerSecretPinModal: changeOwnerSecretPinModal,
    setAuthorizedDelegatePinModal: setAuthorizedDelegatePinModal,
    exportAutoRankedExcelSheet: exportAutoRankedExcelSheet,
    exportSevenDayMembersExcel: exportSevenDayMembersExcel,
    exportStandardFormattedOwnerPDF: exportStandardFormattedOwnerPDF,
    announceDailyQuizWinners: announceDailyQuizWinners,
    grantOwnerLateEntryOverride: grantOwnerLateEntryOverride,
    grantCustomReChanceToStudent: grantCustomReChanceToStudent,
    ownerTerminateStudentSessionForCheating: ownerTerminateStudentSessionForCheating,
    validateBulkQuestionBankInput: validateBulkQuestionBankInput,
    uploadValidatedBulkQuestionBank: uploadValidatedBulkQuestionBank,
    saveSingleBoxAdmitCardConfig: saveSingleBoxAdmitCardConfig,
    openDetailedManualEvaluationViewer: openDetailedManualEvaluationViewer,
    setPortalMaintenanceState: setPortalMaintenanceState,
    ownerBypassMaintenancePrompt: ownerBypassMaintenancePrompt,
    sendOwnerBroadcastNotification: sendOwnerBroadcastNotification,
    toggleMainExamResultDeclaration: toggleMainExamResultDeclaration,
    unlockStuckParikshaScreenAndReset: unlockStuckParikshaScreenAndReset,
    checkStudentResultByRollNumber: checkStudentResultByRollNumber,
    downloadOfflineEncryptedExamPacket: downloadOfflineEncryptedExamPacket,
    importOfflineEncryptedExamPacket: importOfflineEncryptedExamPacket,
    manualTriggerOfflineSync: manualTriggerOfflineSync,
    askAiSahayakBottomEngine: askAiSahayakBottomEngine
});
