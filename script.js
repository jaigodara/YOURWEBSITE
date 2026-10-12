/* ============================================================================
   BISHNOI SAMAJ DIGITAL PLATFORM & NATIONAL EXAM ENGINE (v6.0 PRODUCTION)
   Clean, Unified, Production-Ready Architecture | Single Complete File
   ============================================================================ */

"use strict";

// --- 1. UNIFIED GLOBAL CONFIGURATION & STORAGE KEYS ---
const PORTAL_CONFIG = {
    cloudflareWorkerUrl: "https://exam-snapshot-api.your-username.workers.dev",
    examSessionKey: "bishnoi_active_exam_state_v5",
    bookmarksKey: "bishnoi_saved_bookmarks_v5",
    enrollmentsKey: "bishnoi_enrolled_students_v5",
    submissionsKeyPrefix: "bishnoi_submissions_", // main, mock1, mock2, daily
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
    "jaap", "chaupal", "profile", "prabandhan", "ownerStudioSection"
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

let shabadReaderFontSize = 16;
if (typeof window !== "undefined") {
    window._isPageRefreshingOrUnloading = false;
}

// Safe helper to avoid null/undefined issues
function valOr(value, fallback) {
    return (value !== undefined && value !== null && value !== "") ? value : fallback;
}

function readStore(key, fallbackVal) {
    try {
        if (typeof localStorage === "undefined") return fallbackVal;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallbackVal;
    } catch (e) {
        return fallbackVal;
    }
}

function writeStore(key, val) {
    try {
        if (typeof localStorage === "undefined") return;
        localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
        console.warn("Storage write error:", e);
    }
}

// --- 2. CORE ARCHIVES: 29 NIYAMS, KARAOKE BHAJANS, SHABADWANI & DEFAULT QUESTIONS ---
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
    { id: 29, title: "नीले वस्त्र धारण नहीं करना", desc: "नील के पौधे के दोहन से बने रंग का त्याग और सादगी अपनाना।" }
];

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

const SHABADWANI_CORE_ARCHIVE = [
    { num: 1, title: "सबद १ - गुरु चिन्हारि", text: "ॐ गुरु चिन्हारि चिन्हारि, चित्त चीन्हो रे भाई! साचा सतगुरु सिरजनहारा, जिन यह सृष्टि उपाई।", meaning: "उस सच्चे सृष्टिकर्ता सतगुरु को अपने अंतःकरण में पहचानो जिसने संपूर्ण चराचर जगत की रचना की है।" },
    { num: 2, title: "सबद २ - लोइया तूं क्यों भूला", text: "लोइया तूं क्यों भूला रे भाई, काया काचो कुंभ कहाई। बिन हरि नाम मुक्ति नहीं पावै, अंत काल पछताई।", meaning: "हे मनुष्य! तू सांसारिक मोह में क्यों भूल रहा है? यह शरीर कच्चे घड़े के समान नश्वर है, हरि स्मरण के बिना कल्याण संभव नहीं।" },
    { num: 3, title: "सबद ३ - शील संतोष एवं दया धर्म", text: "जीया पर दया पालणी, रूंख लीलो नहिं घावै। साचै शबद सूं रत रहै, सोई बिश्नोई कहावै।", meaning: "प्राणी मात्र पर दया रखना, हरे वृक्ष न काटना और सत्य वाणी में रमण करना ही सच्चे बिश्नोई का लक्षण है।" },
    { num: 4, title: "सबद ४ - अमावस्या आत्मचिंतन", text: "अमावस व्रत राखणो, हवन जप सूं नेह। पाखंड भरम ने त्यागी के, पावो अमर सनेह।", meaning: "प्रत्येक अमावस्या को व्रत व हवन कर बाह्य आडंबरों को त्यागें और परमात्मा का अमर प्रेम प्राप्त करें।" },
    { num: 5, title: "सबद ५ - उत्तम करनी व शुद्ध आचरण", text: "करनी बिना कथनी थोथी, साचा सोई जो पालै। उन्तीस धर्म की पाळ बांधी, कूड़ कपट ने टालै।", meaning: "आचरण के बिना केवल कोरी बातें व्यर्थ हैं। जो २९ नियमों का निष्ठा से पालन कर कपट त्यागता है वही सच्चा साधक है।" }
];

const DEFAULT_EXAM_QUESTIONS = [
    { id: 1, section: "A", topic: "२९ नियम", q: "गुरु जम्भेश्वर भगवान ने विश्नोई पंथ की स्थापना किस वर्ष (विक्रम संवत) में की थी?", options: ["संवत १५४२", "संवत १५०८", "संवत १५९३", "संवत १६००"], ans: 0, explanation: "गुरु जम्भेश्वर भगवान ने कार्तिक वदी अष्टमी विक्रम संवत १५४२ (सन् १४८५) को समराथल धोरा पर कलश स्थापना कर विश्नोई पंथ का प्रवर्तन किया।" },
    { id: 2, section: "A", topic: "खेजड़ली इतिहास", q: "खेजड़ली बलिदान विक्रम संवत १७८७ में किसके नेतृत्व में ३६३ हुतात्माओं ने वृक्षों की रक्षा हेतु प्राण न्योछावर किए?", options: ["माता अमृता देवी बिश्नोई", "रामोजी बिश्नोई", "गिरधारीदास जी", "ल्होजी बिश्नोई"], ans: 0, explanation: "माता अमृता देवी बिश्नोई और उनकी तीन पुत्रियों सहित ३६३ विश्नोइयों ने 'सिर साँटे रूंख रहे तो भी सस्तो जाण' कहते हुए खेजड़ी वृक्षों के लिए बलिदान दिया।" },
    { id: 3, section: "B", topic: "सबदवाणी", q: "सबदवाणी में कुल कितने सबद (अध्याय/वाणी) संकलित हैं?", options: ["१२० सबद", "१०८ सबद", "२९ सबद", "१५१ सबद"], ans: 0, explanation: "श्री गुरु जम्भेश्वर भगवान द्वारा उच्चारित पवित्र वाणी 'सबदवाणी' में कुल १२० सबद प्रमाणिक रूप से संकलित हैं।" },
    { id: 4, section: "B", topic: "२९ नियम", q: "२९ नियमों के अंतर्गत किस तिथि को व्रत रखने व पर्यावरण-आत्मचिंतन का विशेष विधान है?", options: ["प्रत्येक अमावस्या", "प्रत्येक पूर्णिमा", "एकादशी", "चतुर्दशी"], ans: 0, explanation: "नियम १७ के अनुसार प्रत्येक माह की अमावस्या को व्रत, हवन, जीव दया तथा वृक्ष रक्षा का संकल्प लेने का विधान है।" }
];

// --- 3. MASTER BOOTLOADER & SERVICE WORKER CLEANUP ---
if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        // 1. Unregister stale Service Workers so cached errors never persist
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).catch(() => {});
        }

        // 2. Load SheetJS dynamically for authentic .xlsx Excel exports
        if (!window.XLSX && !document.getElementById("sheetJsXlsxScript")) {
            const sc = document.createElement("script");
            sc.id = "sheetJsXlsxScript";
            sc.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
            document.head.appendChild(sc);
        }

        // 3. Initialize Security & Core UI Modules
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
        bindRefreshSafeAntiCheatListeners();

        // 4. Render Exam Hub, Owner Studio & Profile Dashboard
        renderParikshaHubIfIdle();
        injectOfflinePacketLoaderAndSyncBar();
        renderDailyWinnerPublicBanner();
        renderOwnerAdminStudioCompleteUI();
        renderCompleteStudentProfileDashboard();
        fixStuckSubmissionMessageInHTML();
        injectSingleBoxDirectlyIntoVercelSection();
        bindExistingHTMLButtonsAutomatically();

        // 5. Restore Active Exam Session if Student Refreshed Page
        restoreActiveExamAfterRefresh();
        flushOfflineExamQueue();
        initDailySadhanaReminderScheduler();
    });
}

// --- 4. SECURITY & PIN VERIFICATION ---
function initOwnerAndDelegateSecurity() {
    if (typeof localStorage === "undefined") return;
    if (!localStorage.getItem(PORTAL_CONFIG.ownerHashKey)) {
        localStorage.setItem(PORTAL_CONFIG.ownerHashKey, btoa("pin_2929_secure"));
    }
    if (!localStorage.getItem(PORTAL_CONFIG.delegateHashKey)) {
        localStorage.setItem(PORTAL_CONFIG.delegateHashKey, btoa("delegate_1929_eval"));
    }
}

function verifyOwnerSecretPin(onSuccessCallback) {
    const entered = prompt("🔐 व्यवस्थापक सुरक्षा सत्यापन:\nकृपया अपना गुप्त व्यवस्थापक सुरक्षा पिन (Owner Security PIN) दर्ज करें:");
    if (!entered) return;
    const storedHash = localStorage.getItem(PORTAL_CONFIG.ownerHashKey);
    if (btoa("pin_" + entered.trim() + "_secure") === storedHash) {
        onSuccessCallback();
    } else {
        alert("❌ अमान्य सुरक्षा पिन! यह कार्य केवल अधिकृत व्यवस्थापक के लिए आरक्षित है।");
    }
}

function verifyOwnerOrDelegatePin(onSuccessCallback) {
    const entered = prompt("🔐 मूल्यांकन सुरक्षा सत्यापन:\nकृपया व्यवस्थापक (Owner) अथवा अधिकृत मूल्यांकनकर्ता (Authorized Delegate) पिन दर्ज करें:");
    if (!entered) return;
    const clean = entered.trim();
    const ownerHash = localStorage.getItem(PORTAL_CONFIG.ownerHashKey);
    const delegateHash = localStorage.getItem(PORTAL_CONFIG.delegateHashKey);

    if (btoa("pin_" + clean + "_secure") === ownerHash || btoa("delegate_" + clean + "_eval") === delegateHash) {
        onSuccessCallback();
    } else {
        alert("❌ अमान्य पिन! केवल व्यवस्थापक या अधिकृत मूल्यांकनकर्ता (Delegate) ही उत्तर पुस्तिका जाँच सकते हैं।");
    }
}

function changeOwnerSecretPinModal() {
    verifyOwnerSecretPin(() => {
        const newPin = prompt("नया गुप्त व्यवस्थापक सुरक्षा पिन (कम से कम 4 अंक/अक्षर) दर्ज करें:");
        if (newPin && newPin.trim().length >= 4) {
            localStorage.setItem(PORTAL_CONFIG.ownerHashKey, btoa("pin_" + newPin.trim() + "_secure"));
            showToast("🔐 आपका नया गुप्त सुरक्षा पिन सफलतापूर्वक सुरक्षित कर लिया गया है!");
        } else {
            alert("सुरक्षा पिन कम से कम ४ अंकों या अक्षरों का होना चाहिए।");
        }
    });
}

function setAuthorizedDelegatePinModal() {
    verifyOwnerSecretPin(() => {
        const dPin = prompt("अधिकृत शिक्षक / मूल्यांकनकर्ता (Authorized Delegate) के लिए नया पिन दर्ज करें:");
        if (dPin && dPin.trim().length >= 4) {
            localStorage.setItem(PORTAL_CONFIG.delegateHashKey, btoa("delegate_" + dPin.trim() + "_eval"));
            showToast("✅ अधिकृत मूल्यांकनकर्ता (Delegate) पिन सफलतापूर्वक अपडेट कर दिया गया है!");
        }
    });
}

function scrubDefaultPin2929FromDOM() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("input, p, span, div, label, small, button").forEach(el => {
        if (el.children.length === 0 && el.innerText && el.innerText.includes("2929")) {
            el.innerText = el.innerText.replace(/2929/g, "•••• (गुप्त पिन)");
        }
        if (el.placeholder && el.placeholder.includes("2929")) {
            el.placeholder = "गुप्त व्यवस्थापक सुरक्षा पिन दर्ज करें";
        }
        if (el.value === "2929") {
            el.value = "";
        }
    });
}

// --- 5. CUSTOM MAINTENANCE MODE ---
function checkMaintenanceOverlayOnLoad() {
    if (typeof document === "undefined") return;
    const mState = readStore(PORTAL_CONFIG.maintenanceKey, { enabled: false });
    let overlay = document.getElementById("customMaintenanceScreen");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "customMaintenanceScreen";
        overlay.className = "fixed inset-0 z-[9999] bg-emerald-950/95 text-white hidden flex-col items-center justify-center p-6 text-center backdrop-blur-md";
        document.body.appendChild(overlay);
    }

    if (mState.enabled) {
        const titleText = valOr(mState.title, "विश्नोई समाज डिजिटल पोर्टल रखरखाव");
        const msgText = valOr(mState.message, "पोर्टल पर परीक्षा सर्वर एवं नए फीचर्स का तकनीकी उन्नयन कार्य चल रहा है। कृपया कुछ समय पश्चात पुनः प्रयास करें।");
        const etaText = valOr(mState.eta, "शीघ्र");

        overlay.classList.remove("hidden");
        overlay.classList.add("flex");
        overlay.innerHTML = `
            <div class="max-w-lg w-full bg-emerald-900/90 border-2 border-amber-400/50 rounded-3xl p-8 shadow-2xl">
                <div class="text-5xl mb-4">🌿🛠️</div>
                <span class="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full uppercase tracking-widest">सिस्टम अपग्रेड मोड सक्रिय</span>
                <h1 class="text-2xl md:text-3xl font-extrabold text-amber-300 mt-3 mb-2">${titleText}</h1>
                <p class="text-emerald-100 text-sm md:text-base leading-relaxed mb-6">${msgText}</p>
                <div class="bg-emerald-950/70 rounded-2xl p-4 mb-6 text-xs text-emerald-200 flex justify-between">
                    <span>अनुमानित पुनः प्रारंभ: <strong>${etaText}</strong></span>
                    <span>संपर्क: <strong>व्यवस्थापक मंडल</strong></span>
                </div>
                <button onclick="ownerBypassMaintenancePrompt()" class="text-xs text-amber-300/80 underline hover:text-amber-200">व्यवस्थापक (Owner) आपातकालीन लॉगिन</button>
            </div>
        `;
    } else {
        overlay.classList.add("hidden");
        overlay.classList.remove("flex");
    }
}

function setPortalMaintenanceState(enable) {
    verifyOwnerSecretPin(() => {
        const state = {
            enabled: Boolean(enable),
            title: valOr(document.getElementById("maintTitleInput")?.value, "विश्नोई समाज डिजिटल पोर्टल रखरखाव"),
            eta: valOr(document.getElementById("maintEtaInput")?.value, "शीघ्र"),
            message: valOr(document.getElementById("maintMsgInput")?.value, "पोर्टल पर तकनीकी उन्नयन कार्य चल रहा है।")
        };
        writeStore(PORTAL_CONFIG.maintenanceKey, state);
        checkMaintenanceOverlayOnLoad();
        showToast(enable ? "🔒 मेंटेनेंस मोड सक्रिय कर दिया गया है!" : "🟢 पोर्टल सामान्य रूप से चालू कर दिया गया है!");
    });
}

function ownerBypassMaintenancePrompt() {
    verifyOwnerSecretPin(() => {
        const mState = readStore(PORTAL_CONFIG.maintenanceKey, {});
        mState.enabled = false;
        writeStore(PORTAL_CONFIG.maintenanceKey, mState);
        checkMaintenanceOverlayOnLoad();
        showToast("मेंटेनेंस मोड सफलतापूर्वक बंद कर दिया गया है!");
    });
}

// --- 6. KARAOKE AUTO-SCROLLING BHAJAN SYNC & SHABADWANI READER ---
function initKaraokeSection() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("#sahitya .static-lyrics, #sahitya pre, [data-static-bhajan]").forEach(el => {
        el.style.display = "none";
    });

    const audioEl = document.getElementById("mainBhajanAudio") || createKaraokeDOMIfMissing();
    if (!audioEl) return;

    const selectEl = document.getElementById("karaokeSongSelect");
    const lyricsBox = document.getElementById("karaokeLyricsLiveBox");

    if (selectEl && selectEl.options.length === 0) {
        KARAOKE_BHAJAN_LIBRARY.forEach((b, idx) => {
            const opt = document.createElement("option");
            opt.value = idx;
            opt.textContent = `${idx + 1}. ${b.title}`;
            selectEl.appendChild(opt);
        });
        selectEl.addEventListener("change", (e) => loadKaraokeTrack(parseInt(e.target.value, 10)));
    }

    loadKaraokeTrack(0);

    audioEl.addEventListener("timeupdate", () => {
        const currentTrackIdx = selectEl ? parseInt(valOr(selectEl.value, "0"), 10) : 0;
        const track = KARAOKE_BHAJAN_LIBRARY[currentTrackIdx] || KARAOKE_BHAJAN_LIBRARY[0];
        const cur = audioEl.currentTime;

        let activeIndex = 0;
        track.lines.forEach((line, i) => {
            if (cur >= line.time) activeIndex = i;
        });

        if (lyricsBox) {
            lyricsBox.innerHTML = track.lines.map((line, i) => {
                const isActive = (i === activeIndex);
                const cls = isActive
                    ? "bg-amber-400/20 text-amber-300 font-extrabold text-lg scale-105 shadow"
                    : "text-emerald-200/60 text-sm";
                return `<div class="transition-all duration-300 py-1.5 px-3 rounded-xl ${cls}">${line.text}</div>`;
            }).join("");

            const activeEl = lyricsBox.querySelector(".scale-105");
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    });
}

function createKaraokeDOMIfMissing() {
    if (typeof document === "undefined") return null;
    const target = document.getElementById("sahitya") || document.body;
    let wrapper = document.getElementById("karaokePlayerDynamicCard");
    if (!wrapper && target) {
        wrapper = document.createElement("div");
        wrapper.id = "karaokePlayerDynamicCard";
        wrapper.className = "my-4 p-5 bg-emerald-950 text-white rounded-2xl shadow-xl border border-emerald-800 max-w-5xl mx-auto";
        wrapper.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 bg-amber-500 text-emerald-950 font-bold text-xs rounded-lg">कराओके स्वर सिंक</span>
                    <h3 class="font-bold text-base text-amber-300">सबदवाणी, आरती एवं भजन (Real-Time Auto-Scroll Lyrics)</h3>
                </div>
                <select id="karaokeSongSelect" class="bg-emerald-900 text-white text-sm rounded-xl px-3 py-1.5 border border-emerald-700"></select>
            </div>
            <audio id="mainBhajanAudio" controls class="w-full h-10 mb-3 rounded-lg"></audio>
            <div id="karaokeLyricsLiveBox" class="max-h-40 overflow-y-auto text-center space-y-1 p-3 bg-emerald-900/60 rounded-xl border border-emerald-800/80"></div>
        `;
        target.prepend(wrapper);
    }
    return document.getElementById("mainBhajanAudio");
}

function loadKaraokeTrack(index) {
    const track = KARAOKE_BHAJAN_LIBRARY[index] || KARAOKE_BHAJAN_LIBRARY[0];
    const audioEl = document.getElementById("mainBhajanAudio");
    const lyricsBox = document.getElementById("karaokeLyricsLiveBox");
    if (audioEl) audioEl.src = track.audioUrl;
    if (lyricsBox) {
        lyricsBox.innerHTML = track.lines.map((l, i) => {
            const cls = (i === 0) ? "text-amber-300 font-bold text-base" : "text-emerald-200/60 text-sm";
            return `<div class="${cls} py-1">${l.text}</div>`;
        }).join("");
    }
}

function initShabadwaniReaderAndSearch() {
    if (typeof document === "undefined") return;
    const sahityaContainer = document.getElementById("shabadwaniReaderContainer") || document.getElementById("sahitya");
    if (!sahityaContainer || document.getElementById("shabadwaniSmartSearchBox")) return;

    const readerWidget = document.createElement("div");
    readerWidget.id = "shabadwaniSmartSearchBox";
    readerWidget.className = "max-w-5xl mx-auto my-6 bg-white rounded-3xl p-6 shadow-xl border border-emerald-200";
    readerWidget.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-200">
            <div>
                <span class="px-2.5 py-1 bg-emerald-100 text-emerald-950 font-extrabold text-xs rounded-lg">📖 जम्भवाणी ग्रंथ कोष</span>
                <h3 class="text-lg md:text-xl font-extrabold text-gray-900 mt-1">श्री गुरु जम्भेश्वर सबदवाणी (खोज एवं अर्थ सहित पाठ)</h3>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="adjustShabadFontSize(-2)" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-extrabold text-xs rounded-xl border">A-</button>
                <button onclick="adjustShabadFontSize(2)" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-extrabold text-xs rounded-xl border">A+</button>
            </div>
        </div>
        <div class="mb-4">
            <input id="shabadSearchInput" type="text" oninput="filterShabadwaniList()" placeholder="🔍 सबद संख्या, शब्द या भावार्थ खोजें (उदा: 'दया', 'रूंख', 'सबद १')..." class="w-full px-4 py-3 rounded-2xl border-2 border-emerald-600/40 font-semibold text-sm text-gray-900 focus:outline-none focus:border-emerald-700" />
        </div>
        <div id="shabadwaniDynamicCardsList" class="space-y-3"></div>
    `;
    sahityaContainer.appendChild(readerWidget);
    filterShabadwaniList();
}

function adjustShabadFontSize(delta) {
    shabadReaderFontSize = Math.min(26, Math.max(13, shabadReaderFontSize + delta));
    filterShabadwaniList();
}

function speakShabadByNum(num) {
    const item = SHABADWANI_CORE_ARCHIVE.find(s => s.num === num);
    if (item) speakHindiText(item.text);
}

function filterShabadwaniList() {
    const query = valOr(document.getElementById("shabadSearchInput")?.value, "").trim().toLowerCase();
    const listEl = document.getElementById("shabadwaniDynamicCardsList");
    if (!listEl) return;

    const filtered = SHABADWANI_CORE_ARCHIVE.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.text.toLowerCase().includes(query) ||
        s.meaning.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="p-4 text-center text-gray-500 font-bold text-sm">कोई मिलान नहीं मिला।</div>`;
        return;
    }

    listEl.innerHTML = filtered.map(item => `
        <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-sm">
            <div class="flex justify-between items-center mb-1.5">
                <span class="font-extrabold text-xs text-emerald-950 bg-amber-300/70 px-2.5 py-0.5 rounded-lg">${item.title}</span>
                <button onclick="speakShabadByNum(${item.num})" class="text-xs font-extrabold text-emerald-800 hover:underline">🔊 श्रवण करें</button>
            </div>
            <p style="font-size:${shabadReaderFontSize}px;" class="font-extrabold text-emerald-950 leading-relaxed my-2">${item.text}</p>
            <p class="text-xs md:text-sm text-gray-800 font-medium bg-white p-2.5 rounded-xl border border-amber-100"><strong>भावार्थ:</strong> ${item.meaning}</p>
        </div>
    `).join("");
}

function speakHindiText(text) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        showToast("आपके ब्राउज़र में ऑडियो रीडर समर्थित नहीं है।");
        return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "hi-IN";
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
}

// --- 7. DIGITAL JAAP MALA, DAILY STREAK & REMINDERS ---
function initJaapMalaAndStreakUI() {
    const streak = parseInt(valOr(localStorage.getItem("bishnoi_jaap_streak_days"), "0"), 10);
    const totalBeads = parseInt(valOr(localStorage.getItem("bishnoi_jaap_total_beads"), "0"), 10);
    const badgeEl = document.getElementById("jaapStreakBadgeDisplay");
    if (badgeEl) {
        badgeEl.innerHTML = renderStreakBadgesHTML(streak, totalBeads);
    }
}

function incrementJaapMalaBead() {
    let currentBead = parseInt(valOr(localStorage.getItem("bishnoi_current_mala_bead"), "0"), 10) + 1;
    let totalBeads = parseInt(valOr(localStorage.getItem("bishnoi_jaap_total_beads"), "0"), 10) + 1;

    recordDailyJaapMalaStreak();

    if (currentBead >= 108) {
        currentBead = 0;
        const totalMalas = parseInt(valOr(localStorage.getItem("bishnoi_total_completed_malas"), "0"), 10) + 1;
        localStorage.setItem("bishnoi_total_completed_malas", String(totalMalas));
        showToast(`📿 १ माला (१०८ मनके) पूर्ण! कुल पूर्ण मालाएं: ${totalMalas}`);
    }

    localStorage.setItem("bishnoi_current_mala_bead", String(currentBead));
    localStorage.setItem("bishnoi_jaap_total_beads", String(totalBeads));

    const beadCounterEl = document.getElementById("currentBeadCountDisplay");
    if (beadCounterEl) beadCounterEl.innerText = `${currentBead} / 108`;
    initJaapMalaAndStreakUI();
}

function recordDailyJaapMalaStreak() {
    const today = new Date().toISOString().split("T")[0];
    const lastDate = localStorage.getItem("bishnoi_last_jaap_date");
    let streak = parseInt(valOr(localStorage.getItem("bishnoi_jaap_streak_days"), "0"), 10);

    if (lastDate === today) return;

    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterday = yesterdayObj.toISOString().split("T")[0];

    streak = (lastDate === yesterday) ? (streak + 1) : 1;

    localStorage.setItem("bishnoi_last_jaap_date", today);
    localStorage.setItem("bishnoi_jaap_streak_days", String(streak));

    if (streak === 7 || streak === 21 || streak === 51) {
        pushPortalNotification(`🏅 बधाई! आपने ${streak} दिनों की निरंतर जप साधना स्ट्रीक पूरी कर विशेष साधक बैज प्राप्त किया है!`);
    }
}

function renderStreakBadgesHTML(streak, totalBeads) {
    const b7 = (streak >= 7) ? "bg-amber-100 text-amber-900 border-amber-400" : "bg-gray-100 text-gray-400 border-gray-200 opacity-60";
    const b21 = (streak >= 21) ? "bg-emerald-100 text-emerald-900 border-emerald-400" : "bg-gray-100 text-gray-400 border-gray-200 opacity-60";
    const b51 = (streak >= 51) ? "bg-purple-100 text-purple-900 border-purple-400" : "bg-gray-100 text-gray-400 border-gray-200 opacity-60";

    return `
        <div class="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm mt-3">
            <div class="flex flex-wrap justify-between items-center gap-2 mb-3">
                <span class="font-bold text-emerald-950 text-sm">🔥 दैनिक साधना स्ट्रीक: <strong class="text-amber-600 text-base">${streak} दिन</strong></span>
                <span class="text-xs font-semibold text-gray-600">कुल जप मनके: ${totalBeads}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div class="p-2 rounded-xl border ${b7}">🏅 निष्ठ साधक (7 दिन)</div>
                <div class="p-2 rounded-xl border ${b21}">🌿 हरित प्रहरी (21 दिन)</div>
                <div class="p-2 rounded-xl border ${b51}">👑 जम्भ रत्न (51 दिन)</div>
            </div>
        </div>
    `;
}

function injectInteractiveJaapMalaAndReminderUI() {
    if (typeof document === "undefined") return;
    const target = document.getElementById("jaap") || document.getElementById("jaapMalaSection");
    if (!target || document.getElementById("interactiveJaapMalaMasterCard")) return;

    const currentBead = parseInt(valOr(localStorage.getItem("bishnoi_current_mala_bead"), "0"), 10);
    const streak = parseInt(valOr(localStorage.getItem("bishnoi_jaap_streak_days"), "0"), 10);
    const totalBeads = parseInt(valOr(localStorage.getItem("bishnoi_jaap_total_beads"), "0"), 10);
    const savedReminderTime = valOr(localStorage.getItem("bishnoi_daily_reminder_time"), "06:30");

    const box = document.createElement("div");
    box.id = "interactiveJaapMalaMasterCard";
    box.className = "max-w-4xl mx-auto my-6 bg-white rounded-3xl p-6 shadow-xl border-2 border-amber-400";
    box.innerHTML = `
        <div class="text-center">
            <span class="px-3 py-1 bg-amber-100 text-amber-950 font-extrabold text-xs rounded-full">📿 डिजिटल जप माला एवं प्रतिदिन साधना स्ट्रीक</span>
            <h3 class="text-2xl font-extrabold text-emerald-950 mt-2">॥ ॐ विष्णु बे भण रे प्राणी ॥</h3>
            <p class="text-xs text-gray-600 mt-1">प्रतिदिन जप करने पर आपकी दैनिक साधना स्ट्रीक स्वतः जुड़ती है।</p>
            <div class="my-6 flex flex-col items-center">
                <div id="currentBeadCountDisplay" class="w-32 h-32 rounded-full border-8 border-amber-400 bg-emerald-950 text-amber-300 flex items-center justify-center text-3xl font-extrabold shadow-xl mb-4">
                    ${currentBead} / 108
                </div>
                <button onclick="incrementJaapMalaBead()" class="px-8 py-4 bg-gradient-to-r from-emerald-900 to-emerald-800 text-amber-300 font-extrabold text-base rounded-2xl shadow-lg hover:scale-105 transition active:scale-95">
                    📿 मनका फेरें (+1 जप करें)
                </button>
            </div>
            <div id="jaapStreakBadgeDisplay">${renderStreakBadgesHTML(streak, totalBeads)}</div>
            <div class="mt-5 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span class="font-bold text-gray-800">🔔 दैनिक जप माला एवं पंचांग रिमाइंडर समय (प्रातः/सायं):</span>
                <div class="flex items-center gap-2">
                    <input id="dailySadhanaTimeInput" type="time" value="${savedReminderTime}" class="px-3 py-1.5 rounded-xl border border-gray-300 font-bold text-gray-900" />
                    <button onclick="saveCustomDailyReminderTime()" class="px-4 py-2 bg-emerald-900 text-amber-300 font-extrabold rounded-xl">अलार्म सहेजें ✓</button>
                </div>
            </div>
        </div>
    `;
    target.prepend(box);
}

function saveCustomDailyReminderTime() {
    const val = valOr(document.getElementById("dailySadhanaTimeInput")?.value, "06:30");
    localStorage.setItem("bishnoi_daily_reminder_time", val);
    if (typeof window !== "undefined" && "Notification" in window) Notification.requestPermission();
    showToast(`🔔 आपका दैनिक साधना एवं पंचांग रिमाइंडर (${val}) पर सेट हो गया है!`);
}

// --- 8. COUNTDOWN, STRICT EARLY ENTRY LOCK & LATE OVERRIDE ---
function initExamCountdownWatcher() {
    if (typeof window === "undefined") return;
    setInterval(() => {
        const admitConfig = getAdmitCardConfig();
        const startEpoch = new Date(admitConfig.examStartISO).getTime();
        const now = Date.now();
        const countdownEl = document.getElementById("examStartCountdownDisplay");
        const enterBtn = document.getElementById("enterExamHallMainBtn");

        if (now < startEpoch) {
            const diff = startEpoch - now;
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);

            if (countdownEl) {
                countdownEl.innerText = `परीक्षा प्रारंभ होने में शेष समय: ${d} दिन : ${h} घं : ${m} मि : ${s} से`;
            }
            if (enterBtn) {
                enterBtn.disabled = true;
                enterBtn.classList.add("opacity-50", "cursor-not-allowed");
                enterBtn.innerText = "🔒 परीक्षा कक्ष अभी लॉक है (समय पूर्व प्रवेश वर्जित)";
            }
        } else {
            if (countdownEl) countdownEl.innerText = "🟢 मुख्य परीक्षा समय प्रारंभ हो चुका है!";
            if (enterBtn) {
                enterBtn.disabled = false;
                enterBtn.classList.remove("opacity-50", "cursor-not-allowed");
                enterBtn.innerText = "🛡️ मुख्य परीक्षा कक्ष में प्रवेश करें";
            }
        }
    }, 1000);
}

function verifyExamHallEntryEligibility(rollNumber, examType) {
    if (examType !== "main") return { allowed: true };

    const cleanRoll = valOr(rollNumber, "").trim().toUpperCase();
    const admitConfig = getAdmitCardConfig();
    const startEpoch = new Date(admitConfig.examStartISO).getTime();
    const now = Date.now();

    // 1. Strict Early Entry Lock
    if (now < startEpoch) {
        const waitMins = Math.ceil((startEpoch - now) / 60000);
        alert(`🔒 प्रवेश वर्जित! परीक्षा प्रारंभ होने में अभी ${waitMins} मिनट शेष हैं। काउंटडाउन समाप्त होने से पूर्व कोई भी छात्र परीक्षा कक्ष में प्रवेश नहीं कर सकता।`);
        return { allowed: false };
    }

    // 2. Check Owner Re-Chance Grant
    const reChances = readStore(PORTAL_CONFIG.reChanceKey, {});
    if (reChances[cleanRoll] && reChances[cleanRoll].granted) {
        return { allowed: true, customDurationMins: reChances[cleanRoll].minutes };
    }

    // 3. Check 5-Minute Late Cutoff & Owner Manual Override
    const cutoffMins = parseInt(valOr(admitConfig.lateCutoffMins, "5"), 10);
    const lateDeadline = startEpoch + cutoffMins * 60 * 1000;
    const lateExceptions = readStore(PORTAL_CONFIG.lateExceptionsKey, []);

    if (now > lateDeadline && !lateExceptions.includes(cleanRoll)) {
        alert(`🚫 लेट एंट्री लॉक! परीक्षा प्रारंभ हुए ${cutoffMins} मिनट से अधिक समय बीत चुका है। वास्तविक कारण होने पर व्यवस्थापक (Owner) से 'लेट एंट्री अनुमति' प्राप्त करें।`);
        return { allowed: false };
    }

    return { allowed: true };
}

// --- 9. EXAM ENGINE, REFRESH PERSISTENCE & ANTI-CHEAT ---
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
        endTimeEpoch: now + durationMins * 60 * 1000,
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
        finalizeAndSubmitExam(true, "निर्धारित समय पूर्ण (Auto-Submit on Refresh)");
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
    showToast(`🔄 सत्र पुनः बहाल! रोल नंबर ${examRuntime.rollNumber} — आप प्रश्न ${examRuntime.currentIndex + 1} पर हैं।`);
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

function bindRefreshSafeAntiCheatListeners() {
    if (typeof window === "undefined" || window._unifiedAntiCheatBound) return;
    window._unifiedAntiCheatBound = true;

    window.addEventListener("beforeunload", () => {
        window._isPageRefreshingOrUnloading = true;
        if (examRuntime && examRuntime.isActive) {
            persistExamStateToStorage();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (window._isPageRefreshingOrUnloading) return;

        if (document.hidden && examRuntime && examRuntime.isActive) {
            examRuntime.tabWarnings = (examRuntime.tabWarnings || 0) + 1;
            persistExamStateToStorage();

            if (examRuntime.tabWarnings >= 3) {
                logEliminatedStudent(
                    examRuntime.rollNumber,
                    examRuntime.studentName,
                    "जानबूझकर ३ बार परीक्षा छोड़कर टैब बदलने के कारण ऑटो-निष्कासित"
                );
                finalizeAndSubmitExam(true, "३ बार टैब स्विच उल्लंघन (Auto-Submitted)");
            } else {
                alert(`⚠️ सुरक्षा चेतावनी (${examRuntime.tabWarnings}/3): परीक्षा के दौरान जानबूझकर टैब या ऐप बदलना सख्त वर्जित है! ३ बार ऐसा करने पर परीक्षा लॉक हो जाएगी।`);
            }
        }
    });
}

// --- 10. ACTIVE EXAM INTERFACE & OMR CONTROLS ---
function renderActiveExamInterface() {
    const container = document.getElementById("pariksha") || createExamContainerIfMissing();
    if (!container || !examRuntime.isActive) return;

    const qObj = examRuntime.questions[examRuntime.currentIndex];
    if (!qObj) return;

    const selectedOpt = examRuntime.answers[qObj.id];
    const isReviewed = Boolean(examRuntime.reviewMarked[qObj.id]);
    const isBookmarked = isQuestionBookmarked(qObj.id);
    const weights = getSectionWeightsConfig();
    const secKey = valOr(qObj.section, "A");
    const secRule = weights[secKey] || { plus: 2, minus: 0.5 };
    const topicLabel = valOr(qObj.topic, "जम्भवाणी साहित्य");

    const bookmarkBtnCls = isBookmarked
        ? "bg-amber-400 text-emerald-950 border-amber-500"
        : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100";
    const bookmarkBtnText = isBookmarked ? "⭐ सहेजा गया (Bookmarked)" : "☆ प्रश्न सहेजें (Bookmark)";

    const reviewBtnCls = isReviewed
        ? "bg-amber-500 text-white border-amber-600"
        : "bg-amber-50 text-amber-900 border-amber-300";
    const reviewBtnText = isReviewed ? "🟠 पुनर्विचार चिह्नित" : "🟠 पुनर्विचार हेतु रखें";

    const optionsHtml = qObj.options.map((optText, idx) => {
        const isChecked = (selectedOpt === idx);
        const cardCls = isChecked
            ? "border-emerald-700 bg-emerald-50/80 shadow-md"
            : "border-gray-200 bg-white hover:border-emerald-300";
        const badgeCls = isChecked ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-700";
        const checkedAttr = isChecked ? "checked" : "";
        return `
            <label onclick="selectExamOption(${qObj.id}, ${idx})" class="flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${cardCls}">
                <input type="radio" name="exam_q_${qObj.id}" value="${idx}" ${checkedAttr} class="w-5 h-5 text-emerald-700" />
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

    const prevDisabled = (examRuntime.currentIndex === 0) ? "disabled" : "";
    const nextDisabled = (examRuntime.currentIndex === examRuntime.questions.length - 1) ? "disabled" : "";

    container.innerHTML = `
        <div id="activeExamMasterCard" class="max-w-4xl mx-auto my-4 bg-white rounded-3xl shadow-2xl border-2 border-emerald-800 overflow-hidden">
            <div class="bg-emerald-950 text-white p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <span class="px-2.5 py-0.5 bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-full uppercase">सुरक्षित परीक्षा कक्ष (${examRuntime.examType.toUpperCase()})</span>
                    <h3 class="font-bold text-base mt-1">${examRuntime.studentName} <span class="text-amber-300 text-xs">(${examRuntime.rollNumber})</span></h3>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-xs bg-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-600">✓ रिफ्रेश सेफ मोड</span>
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
                        <button onclick="toggleQuestionBookmark(${qObj.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition ${bookmarkBtnCls}">${bookmarkBtnText}</button>
                        <button onclick="clearCurrentExamResponse(${qObj.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">🧹 उत्तर साफ़ करें</button>
                    </div>
                </div>
                <h2 class="text-lg md:text-xl font-extrabold text-gray-900 leading-relaxed mb-6">${qObj.q}</h2>
                <div class="space-y-3 mb-6">${optionsHtml}</div>
                <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
                    <div class="flex items-center gap-2">
                        <button onclick="navigateExamQuestion(-1)" ${prevDisabled} class="px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-40">⬅️ पिछला प्रश्न</button>
                        <button onclick="toggleMarkForReview(${qObj.id})" class="px-4 py-2.5 rounded-xl font-bold text-sm border ${reviewBtnCls}">${reviewBtnText}</button>
                        <button onclick="navigateExamQuestion(1)" ${nextDisabled} class="px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40">अगला प्रश्न ➡️</button>
                    </div>
                    <button onclick="openPreSubmitSummaryModal()" class="px-6 py-2.5 rounded-xl font-extrabold text-sm bg-emerald-950 text-amber-300 border border-amber-400 shadow-lg hover:bg-emerald-900">
                        ✅ उत्तर पुस्तिका जमा करें (Final Submit)
                    </button>
                </div>
                <div class="mt-6 pt-4 border-t border-gray-100">
                    <p class="text-xs font-bold text-gray-500 uppercase mb-2">ओएमआर प्रश्न पैलेट (OMR Palette):</p>
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

function recordTimeOnCurrentQuestion() {
    if (!examRuntime.isActive) return;
    const curQ = examRuntime.questions[examRuntime.currentIndex];
    if (!curQ) return;
    const now = Date.now();
    const lastSwitch = examRuntime.lastQuestionSwitchTime || now;
    const elapsedSec = Math.max(1, Math.round((now - lastSwitch) / 1000));
    const prevSpent = examRuntime.timeSpentPerQ[curQ.id] || 0;
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
        `क्या आप अपनी उत्तर पुस्तिका अंतिम रूप से जमा (Final Submit) करना चाहते हैं?`
    );

    if (confirmSubmit) {
        finalizeAndSubmitExam(false, "परीक्षार्थी द्वारा सफलतापूर्वक सबमिट");
    }
}

// --- 11. RESULT SUBMISSION & POST-EXAM ANALYSIS ---
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
        const rule = weights[secKey] || { plus: 2, minus: 0.5 };
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

    const breakdownHtml = examRuntime.questions.map((q, idx) => {
        const userAns = submissionRecord.answers[q.id];
        const isCorrect = (Number(userAns) === Number(q.ans));
        const spent = submissionRecord.timeSpentPerQ[q.id] || 0;
        const topicName = valOr(q.topic, "सामान्य");
        const boxCls = isCorrect ? "bg-green-50/50 border-green-200" : "bg-red-50/40 border-red-200";
        const textCls = isCorrect ? "text-green-800" : "text-red-700";
        const userAnsText = (userAns !== undefined) ? q.options[userAns] : "छोड़ा गया";

        return `
            <div class="p-4 rounded-2xl border ${boxCls}">
                <div class="flex justify-between items-center text-xs font-bold mb-1">
                    <span class="text-emerald-950">प्रश्न ${idx + 1} (${topicName})</span>
                    <span class="text-gray-600">⏱️ समय: ${spent} सेकंड</span>
                </div>
                <p class="font-bold text-gray-900 text-sm mb-2">${q.q}</p>
                <p class="text-xs font-semibold ${textCls}">
                    आपका उत्तर: ${userAnsText} | सही उत्तर: <strong class="text-emerald-900">${q.options[q.ans]}</strong>
                </p>
            </div>
        `;
    }).join("");

    const container = document.getElementById("pariksha") || document.body;
    container.innerHTML = `
        <div class="max-w-4xl mx-auto my-6 space-y-6">
            <div class="bg-white rounded-3xl shadow-xl border-2 border-emerald-700 p-6 md:p-8 text-center">
                <div class="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-extrabold">✓</div>
                <span class="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full uppercase">${examRuntime.examType.toUpperCase()} उत्तर पुस्तिका जमा</span>
                <h2 class="text-2xl font-extrabold text-gray-900 mt-2">उत्तर पुस्तिका सफलतापूर्वक जमा हो गई है!</h2>
                <p class="text-sm text-gray-600 mt-1">रोल नंबर: <strong>${submissionRecord.rollNumber}</strong> | परीक्षार्थी: <strong>${submissionRecord.studentName}</strong> (${submissionRecord.district})</p>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
                    <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <div class="text-xs text-emerald-800 font-bold">प्राप्तांक (Score)</div>
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
                        📜 अंक-तालिका एवं प्रमाण-पत्र डाउनलोड करें
                    </button>
                    <button onclick="unlockStuckParikshaScreenAndReset()" class="px-5 py-2.5 bg-emerald-800 text-white font-bold text-sm rounded-xl shadow hover:bg-emerald-900">
                        🔄 परीक्षा मुख्य पटल पर लौटें (Return to Exam Hub)
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-3xl shadow-lg border border-gray-200 p-6">
                <h3 class="font-extrabold text-lg text-gray-900 mb-4">📊 विस्तृत प्रश्नोत्तर विश्लेषण एवं समय ट्रैकर</h3>
                <div class="space-y-3">${breakdownHtml}</div>
            </div>

            <div id="aiSahayakBottomWidget" class="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white rounded-3xl p-6 shadow-xl border border-amber-400/40">
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2.5 py-1 bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-lg">🤖 AI सहायक स्मार्ट इंजन</span>
                    <h4 class="font-bold text-base text-amber-300">जम्भवाणी एवं परीक्षा शंका समाधान (Pariksha Result Assistant)</h4>
                </div>
                <p class="text-xs text-emerald-100 mb-4">किसी भी प्रश्न के नियम, इतिहास या सबदवाणी संदर्भ को समझने के लिए नीचे अपना प्रश्न पूछें:</p>
                <div class="flex flex-col sm:flex-row gap-2">
                    <input id="aiSahayakQueryInput" type="text" placeholder="उदा: खेजड़ली बलिदान का संवत और नियम २० क्या है?" class="flex-1 px-4 py-2.5 rounded-xl text-gray-900 font-semibold text-sm focus:outline-none" />
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

function fixStuckSubmissionMessageInHTML() {
    if (typeof document === "undefined") return;
    const stuckPhrase = "मुख्य परीक्षा उत्तर पुस्तिका सफलतापूर्वक जमा हो गई है";
    document.querySelectorAll("div, section, p, h2, h3").forEach(el => {
        if (el.innerText && el.innerText.includes(stuckPhrase) && !el.querySelector("#unstuckActionToolbar")) {
            const toolbar = document.createElement("div");
            toolbar.id = "unstuckActionToolbar";
            toolbar.className = "mt-5 pt-4 border-t border-emerald-200 flex flex-wrap justify-center gap-3";
            toolbar.innerHTML = `
                <button onclick="unlockStuckParikshaScreenAndReset()" class="px-5 py-2.5 bg-emerald-900 text-amber-300 font-extrabold text-xs md:text-sm rounded-xl shadow hover:bg-emerald-950">
                    🔄 परीक्षा पटल रीसेट करें व नई परीक्षा / मॉक टेस्ट दें
                </button>
                <button onclick="checkStudentResultByRollNumber()" class="px-5 py-2.5 bg-amber-500 text-emerald-950 font-extrabold text-xs md:text-sm rounded-xl shadow hover:bg-amber-400">
                    🎓 रोल नंबर डालकर अंक-तालिका एवं प्रमाण-पत्र डाउनलोड करें
                </button>
            `;
            el.appendChild(toolbar);
        }
    });
}

function unlockStuckParikshaScreenAndReset() {
    localStorage.removeItem(PORTAL_CONFIG.examSessionKey);
    localStorage.removeItem("bishnoi_exam_submitted_lock");
    examRuntime.isActive = false;
    const parikshaEl = document.getElementById("pariksha");
    if (parikshaEl) {
        parikshaEl.innerHTML = "";
        renderParikshaHubIfIdle();
        injectOfflinePacketLoaderAndSyncBar();
        renderDailyWinnerPublicBanner();
        showToast("✅ परीक्षा पटल सफलतापूर्वक रीसेट हो गया है! अब आप कोई भी टेस्ट दे सकते हैं।");
    } else if (typeof location !== "undefined") {
        location.reload();
    }
}

// --- 12. BOOKMARK SYSTEM & SAVED QUESTIONS ---
function isQuestionBookmarked(qId) {
    const list = readStore(PORTAL_CONFIG.bookmarksKey, []);
    return list.some(item => Number(item.id) === Number(qId));
}

function toggleQuestionBookmark(qId) {
    let list = readStore(PORTAL_CONFIG.bookmarksKey, []);
    const exists = list.some(item => Number(item.id) === Number(qId));

    if (exists) {
        list = list.filter(item => Number(item.id) !== Number(qId));
        showToast("बुकमार्क से हटाया गया।");
    } else {
        const qObj = getActiveQuestionBank().find(item => Number(item.id) === Number(qId));
        if (qObj) {
            list.push({
                id: qObj.id,
                topic: valOr(qObj.topic, "२९ नियम व साहित्य"),
                q: qObj.q,
                correctAnswer: qObj.options[qObj.ans],
                explanation: valOr(qObj.explanation, "")
            });
            showToast("⭐ प्रश्न आपकी प्रोफ़ाइल में सहेज लिया गया है!");
        }
    }

    writeStore(PORTAL_CONFIG.bookmarksKey, list);
    if (examRuntime.isActive) renderActiveExamInterface();
    renderClearBookmarksInProfile("profileBookmarksContainer");
    renderClearBookmarksInProfile("profileDedicatedBookmarksBox");
}

function renderClearBookmarksInProfile(targetContainerId = "profileBookmarksContainer") {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    const list = readStore(PORTAL_CONFIG.bookmarksKey, []);
    if (list.length === 0) {
        container.innerHTML = `
            <div class="p-6 bg-white rounded-2xl border border-gray-200 text-center text-gray-800 font-semibold text-xs md:text-sm">
                ⭐ आपने अभी तक कोई प्रश्न सहेजा (Bookmark) नहीं है। परीक्षा के दौरान '☆ प्रश्न सहेजें' बटन दबाकर महत्वपूर्ण प्रश्न यहाँ सुरक्षित रखें।
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="space-y-3">
            ${list.map((item, idx) => {
                const expHtml = item.explanation ? `<p class="text-xs text-gray-800 font-medium mt-2">💡 व्याख्या: ${item.explanation}</p>` : "";
                return `
                    <div class="p-4 bg-white rounded-2xl border-2 border-emerald-700/30 shadow-sm">
                        <div class="flex justify-between items-center mb-1.5">
                            <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 font-extrabold text-xs rounded-lg">सहेजा गया प्रश्न #${idx + 1} • ${item.topic}</span>
                            <button onclick="toggleQuestionBookmark(${item.id})" class="text-xs text-red-600 font-bold hover:underline">हटाएं ✕</button>
                        </div>
                        <p class="text-gray-950 font-extrabold text-base leading-snug mb-2">${item.q}</p>
                        <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-bold text-sm">
                            ✓ सही उत्तर: <span class="underline">${item.correctAnswer}</span>
                        </div>
                        ${expHtml}
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

// --- 13. ADMIT CARD, PHOTO & QR GENERATOR ---
function getAdmitCardConfig() {
    const saved = readStore(PORTAL_CONFIG.admitConfigKey, null);
    return saved ? saved : {
        examTitle: "अखिल भारतीय विश्नोई जम्भवाणी एवं २९ नियम राष्ट्रीय ज्ञान परीक्षा - २०२६",
        examDate: "15 नवंबर 2026 (रविवार)",
        examTime: "प्रातः 10:00 बजे से 10:40 बजे तक",
        examStartISO: "2026-11-15T10:00:00",
        venue: "ऑनलाइन डिजिटल परीक्षा पोर्टल (bishnoi.vercel.app)",
        lateCutoffMins: 5,
        instructions: "1. परीक्षा प्रारंभ होने से 10 मिनट पूर्व लॉग इन करें। 2. परीक्षा के दौरान टैब बदलना वर्जित है। 3. वेबकैम एवं इंटरनेट चालू रखें।"
    };
}

function saveSingleBoxAdmitCardConfig(rawSingleBoxText) {
    verifyOwnerSecretPin(() => {
        const parts = valOr(rawSingleBoxText, "").split("|").map(s => s.trim());
        const current = getAdmitCardConfig();
        const updated = {
            examTitle: valOr(parts[0], current.examTitle),
            examDate: valOr(parts[1], current.examDate),
            examTime: valOr(parts[2], current.examTime),
            examStartISO: valOr(parts[3], current.examStartISO),
            venue: valOr(parts[4], current.venue),
            lateCutoffMins: parseInt(valOr(parts[5], "5"), 10),
            instructions: valOr(parts[6], current.instructions)
        };
        writeStore(PORTAL_CONFIG.admitConfigKey, updated);
        pushPortalNotification(`📢 प्रवेश-पत्र एवं परीक्षा समय सारणी अपडेट: ${updated.examDate} (${updated.examTime})`);
        showToast("✅ प्रवेश-पत्र कॉन्फ़िगरेशन सिंगल-बॉक्स से सफलतापूर्वक अपडेट हो गया!");
    });
}

function enrollStudentWithPhotoAndGenerateAdmitCard(name, fatherName, district, mobile, photoFileInputId) {
    if (!name || !district) {
        alert("कृपया परीक्षार्थी का नाम और जिला अनिवार्य रूप से भरें!");
        return;
    }

    const fileInput = document.getElementById(photoFileInputId);
    const file = (fileInput && fileInput.files) ? fileInput.files[0] : null;

    const processEnrollment = (photoDataUrl) => {
        const rollNumber = `JAMBH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        const studentObj = {
            rollNumber: rollNumber,
            name: name.trim(),
            fatherName: valOr(fatherName, "श्री —").trim(),
            district: district.trim(),
            mobile: valOr(mobile, "—").trim(),
            photoDataUrl: photoDataUrl ? photoDataUrl : createDefaultAvatarSVG(name),
            enrolledAt: new Date().toLocaleString("hi-IN")
        };

        const list = readStore(PORTAL_CONFIG.enrollmentsKey, []);
        list.push(studentObj);
        writeStore(PORTAL_CONFIG.enrollmentsKey, list);

        // Store active student profile for profile section
        writeStore("bishnoi_current_active_student", studentObj);
        renderCompleteStudentProfileDashboard();

        pushPortalNotification(`🎫 आपका प्रवेश-पत्र (रोल नं: ${rollNumber}) डाउनलोड के लिए तैयार है!`);
        openNationalStandardAdmitCardPrintWindow(studentObj);
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => processEnrollment(e.target.result);
        reader.readAsDataURL(file);
    } else {
        alert("📸 कृपया प्रवेश-पत्र के लिए अपनी पासपोर्ट साइज फोटो अपलोड करें!");
    }
}

function openNationalStandardAdmitCardPrintWindow(student) {
    const cfg = getAdmitCardConfig();
    const externalItems = readStore("bishnoi_external_portal_items_v5", []);
    const qrPayload = encodeURIComponent(`VERIFY|${student.rollNumber}|${student.name}|${student.district}|BISHNOI-EXAM-2026`);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${qrPayload}`;

    const externalPortalBlockHtml = (externalItems.length > 0) ? `
        <div style="border:1.5px solid #064e3b;border-radius:8px;padding:10px 14px;background:#f8fafc;margin-top:12px;font-size:12px;">
            <div style="font-weight:800;color:#064e3b;margin-bottom:4px;">🌐 संबद्ध पोर्टल (bishnoi.vercel.app) महत्वपूर्ण विवरण:</div>
            ${externalItems.map(it => {
                const extNote = it.extra ? ` (${it.extra})` : "";
                return `<div style="margin-top:2px;">• <strong>${it.title}:</strong> ${it.detail}${extNote}</div>`;
            }).join("")}
        </div>
    ` : "";

    const win = window.open("", "_blank", "width=900,height=1100");
    if (!win) {
        alert("कृपया एडमिट कार्ड डाउनलोड करने के लिए ब्राउज़र में Pop-ups की अनुमति दें।");
        return;
    }

    win.document.write(`
        <!DOCTYPE html>
        <html lang="hi">
        <head>
            <meta charset="UTF-8" />
            <title>प्रवेश-पत्र (Admit Card) - ${student.rollNumber}</title>
            <style>
                @page { size: A4 portrait; margin: 12mm; }
                body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; color: #111827; margin: 0; padding: 16px; background: #f9fafb; }
                .admit-sheet { max-width: 780px; margin: 0 auto; background: #fff; border: 3px double #064e3b; padding: 24px; border-radius: 12px; }
                .header { text-align: center; border-bottom: 2px solid #064e3b; padding-bottom: 12px; margin-bottom: 16px; }
                .badge { display: inline-block; background: #064e3b; color: #fde68a; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 99px; letter-spacing: 1px; }
                .title { font-size: 20px; font-weight: 800; color: #064e3b; margin: 8px 0 4px; }
                .sub { font-size: 13px; color: #374151; font-weight: 600; }
                .grid-top { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
                .info-table { flex: 1; border-collapse: collapse; width: 100%; }
                .info-table td { border: 1px solid #d1d5db; padding: 8px 10px; font-size: 13px; }
                .info-table td.lbl { background: #f3f4f6; font-weight: 700; width: 36%; color: #064e3b; }
                .info-table td.val { font-weight: 700; color: #111827; }
                .photo-qr-col { width: 155px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
                .photo-box { width: 135px; height: 160px; border: 2px solid #064e3b; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f9fafb; }
                .photo-box img { width: 100%; height: 100%; object-fit: cover; }
                .qr-box { width: 135px; padding: 6px; border: 1px solid #d1d5db; border-radius: 8px; text-align: center; font-size: 10px; font-weight: 700; }
                .qr-box img { width: 110px; height: 110px; }
                .inst-box { border: 1.5px solid #064e3b; border-radius: 8px; padding: 12px 16px; background: #ecfdf5; margin-top: 12px; font-size: 12.5px; line-height: 1.6; }
                .footer-sign { display: flex; justify-content: space-between; margin-top: 28px; padding-top: 12px; border-top: 1px dashed #9ca3af; font-size: 12px; font-weight: 700; }
                @media print { .no-print { display: none !important; } body { background: #fff; padding: 0; } }
            </style>
        </head>
        <body>
            <div class="no-print" style="text-align:center; margin-bottom:14px;">
                <button onclick="window.print()" style="background:#064e3b;color:#fde68a;border:none;padding:10px 24px;border-radius:8px;font-weight:800;cursor:pointer;font-size:14px;">🖨️ राष्ट्रीय मानक प्रवेश-पत्र प्रिंट / PDF सेव करें</button>
            </div>
            <div class="admit-sheet">
                <div class="header">
                    <span class="badge">आधिकारिक राष्ट्रीय परीक्षा प्रवेश-पत्र (NATIONAL STANDARD E-ADMIT CARD)</span>
                    <div class="title">${cfg.examTitle}</div>
                    <div class="sub">गुरु जम्भेश्वर भगवान के २९ नियम एवं सबदवाणी अध्ययन केंद्र (bishnoi.vercel.app)</div>
                </div>
                <div class="grid-top">
                    <table class="info-table">
                        <tr><td class="lbl">रोल नंबर (Roll No.)</td><td class="val" style="font-size:15px;color:#b45309;">${student.rollNumber}</td></tr>
                        <tr><td class="lbl">परीक्षार्थी का नाम</td><td class="val">${student.name}</td></tr>
                        <tr><td class="lbl">पिता / अभिभावक का नाम</td><td class="val">${student.fatherName}</td></tr>
                        <tr><td class="lbl">जिला / क्षेत्र (District)</td><td class="val">${student.district}</td></tr>
                        <tr><td class="lbl">परीक्षा तिथि (Exam Date)</td><td class="val">${cfg.examDate}</td></tr>
                        <tr><td class="lbl">परीक्षा समय (Timing)</td><td class="val">${cfg.examTime}</td></tr>
                        <tr><td class="lbl">परीक्षा केंद्र / माध्यम</td><td class="val">${cfg.venue}</td></tr>
                        <tr><td class="lbl">प्रवेश कट-ऑफ नियम</td><td class="val">परीक्षा प्रारंभ होने के ${cfg.lateCutoffMins} मिनट पश्चात प्रवेश स्वतः लॉक</td></tr>
                    </table>
                    <div class="photo-qr-col">
                        <div class="photo-box"><img src="${student.photoDataUrl}" alt="Student Photo" /></div>
                        <div class="qr-box"><img src="${qrImageUrl}" alt="Verification QR" /><div>आधिकारिक QR सत्यापन</div></div>
                    </div>
                </div>
                <div class="inst-box">
                    <div style="font-weight:800;color:#064e3b;margin-bottom:4px;">📋 परीक्षार्थियों के लिए अनिवार्य निर्देश (Mandatory Exam Instructions):</div>
                    <div>${cfg.instructions}</div>
                </div>
                ${externalPortalBlockHtml}
                <div class="footer-sign">
                    <div>परीक्षार्थी के हस्ताक्षर: ______________________</div>
                    <div>डिजिटल रूप से सत्यापित • मुख्य परीक्षा नियंत्रक (विश्नोई समाज पोर्टल)</div>
                </div>
            </div>
        </body>
        </html>
    `);
    win.document.close();
}

// --- 14. SEPARATE SUBMISSION SHEETS, REAL .XLSX & FORM-A4 PDF ---
function saveSubmissionToSeparateSheet(examType, record) {
    const reChances = readStore(PORTAL_CONFIG.reChanceKey, {});
    const hasReChance = Boolean(reChances[record.rollNumber] && reChances[record.rollNumber].granted);

    if (record.isForcedSubmission && (record.tabWarnings || 0) >= 3 && !hasReChance) {
        record.statusNote = "⚠️ ३ बार टैब बदलने के कारण निष्कासित (Disqualified)";
        record.disqualifiedByCheating = true;
    }

    const key = PORTAL_CONFIG.submissionsKeyPrefix + examType;
    const list = readStore(key, []);
    const existingIdx = list.findIndex(item => item.rollNumber === record.rollNumber);
    if (existingIdx >= 0) list[existingIdx] = record;
    else list.push(record);

    list.sort((a, b) => Number(b.score) - Number(a.score));
    list.forEach((item, idx) => { item.rank = idx + 1; });

    writeStore(key, list);
    syncSubmissionToFirebaseCloud(examType, record);
}

function getSeparateSheetSubmissions(examType = "main") {
    const key = PORTAL_CONFIG.submissionsKeyPrefix + examType;
    const list = readStore(key, []);
    list.sort((a, b) => Number(b.score) - Number(a.score));
    list.forEach((item, idx) => { item.rank = idx + 1; });
    return list;
}

function exportAutoRankedExcelSheet(sheetType = "main") {
    verifyOwnerSecretPin(() => {
        let dataRows = [];
        let fileName = "";

        if (sheetType === "enrolled") {
            fileName = `नामांकित_छात्र_सूची_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const enrolled = readStore(PORTAL_CONFIG.enrollmentsKey, []);
            dataRows = enrolled.map((s, idx) => ({
                "क्र.सं. (S.No.)": idx + 1,
                "रोल नंबर (Roll No.)": s.rollNumber,
                "परीक्षार्थी का नाम": s.name,
                "पिता का नाम": s.fatherName,
                "जिला (District)": s.district,
                "मोबाइल नंबर": s.mobile,
                "नामांकन समय": s.enrolledAt
            }));
        } else {
            fileName = `वरीयता_परिणाम_${sheetType.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const list = getSeparateSheetSubmissions(sheetType);
            dataRows = list.map((r, idx) => ({
                "रैंक (Rank)": idx + 1,
                "रोल नंबर (Roll No.)": r.rollNumber,
                "परीक्षार्थी का नाम": r.studentName,
                "जिला (District)": r.district,
                "प्राप्तांक (Score)": Number(r.score),
                "सही उत्तर": r.correctCount,
                "गलत उत्तर": r.wrongCount,
                "अनुत्तरित": r.unansweredCount || 0,
                "टैब चेतावनी": r.tabWarnings || 0,
                "मूल्यांकन स्थिति": r.manualEvaluated ? "मैनुअल सत्यापित ✓" : r.statusNote,
                "जमा समय": r.submittedAt
            }));
        }

        if (dataRows.length === 0) {
            dataRows = [{ "सूचना": "इस श्रेणी में अभी कोई डेटा दर्ज नहीं है।" }];
        }

        if (typeof window !== "undefined" && window.XLSX) {
            const ws = window.XLSX.utils.json_to_sheet(dataRows);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, sheetType.toUpperCase());
            window.XLSX.writeFile(wb, fileName);
            showToast(`📊 Excel फाइल (${fileName}) सफलतापूर्वक डाउनलोड हो गई है!`);
        } else {
            alert("Excel (.xlsx) इंजन लोड हो रहा है, कृपया २ सेकंड बाद पुनः क्लिक करें।");
        }
    });
}

function exportSevenDayMembersExcel() {
    verifyOwnerSecretPin(() => {
        const defaultMembers = [
            { name: "चौधरी सहीराम बिश्नोई", district: "हिसार", role: "आजीवन सदस्य", joinedDate: new Date().toLocaleDateString("hi-IN"), status: "सक्रिय ✓" },
            { name: "डॉ. प्रमिला गोदारा", district: "जोधपुर", role: "साहित्य संयोजक", joinedDate: new Date().toLocaleDateString("hi-IN"), status: "सक्रिय ✓" },
            { name: "सुभाष चंद्र खीचड़", district: "बीकानेर", role: "हरित प्रहरी", joinedDate: new Date().toLocaleDateString("hi-IN"), status: "सक्रिय ✓" }
        ];
        const members = readStore("bishnoi_community_members_v5", defaultMembers);
        const rows = members.map((m, i) => ({
            "क्र.सं.": i + 1,
            "सदस्य का नाम": m.name,
            "जिला / क्षेत्र": m.district,
            "दायित्व": m.role,
            "जुड़ने की तिथि": m.joinedDate,
            "स्थिति": m.status
        }));
        if (typeof window !== "undefined" && window.XLSX) {
            const ws = window.XLSX.utils.json_to_sheet(rows);
            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, "7_Day_Members");
            window.XLSX.writeFile(wb, `विगत_7_दिवसीय_सदस्य_सूची_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showToast("📊 विगत ७ दिवसीय सदस्य सूची (.xlsx) डाउनलोड हो गई है!");
        }
    });
}

function exportStandardFormattedOwnerPDF(reportType = "main") {
    verifyOwnerSecretPin(() => {
        let title = "";
        let subtitle = "";
        let tableHeaders = "";
        let tableRows = "";

        if (reportType === "enrolled") {
            title = "नामांकित परीक्षार्थियों की आधिकारिक सूची (Enrolled Students Report)";
            subtitle = "अखिल भारतीय विश्नोई जम्भवाणी एवं २९ नियम परीक्षा पोर्टल";
            const enrolled = readStore(PORTAL_CONFIG.enrollmentsKey, []);
            tableHeaders = `
                <tr>
                    <th style="width:8%;">क्र.सं.</th>
                    <th style="width:20%;">रोल नंबर</th>
                    <th style="width:24%;">परीक्षार्थी का नाम</th>
                    <th style="width:22%;">पिता का नाम</th>
                    <th style="width:14%;">जिला</th>
                    <th style="width:12%;">मोबाइल</th>
                </tr>
            `;
            tableRows = enrolled.map((s, i) => `
                <tr>
                    <td style="text-align:center;">${i + 1}</td>
                    <td style="font-weight:700;color:#064e3b;">${s.rollNumber}</td>
                    <td style="font-weight:600;">${s.name}</td>
                    <td>${s.fatherName}</td>
                    <td>${s.district}</td>
                    <td>${s.mobile}</td>
                </tr>
            `).join("");
        } else if (reportType === "members7day") {
            title = "विगत ७ दिवसीय सदस्य नामांकन सूची (7-Day Member Directory)";
            subtitle = "विश्नोई समाज आधिकारिक डिजिटल मंच";
            const defaultMembers = [
                { name: "चौधरी सहीराम बिश्नोई", district: "हिसार", role: "आजीवन सदस्य", joinedDate: new Date().toLocaleDateString("hi-IN"), status: "सक्रिय ✓" },
                { name: "डॉ. प्रमिला गोदारा", district: "जोधपुर", role: "साहित्य संयोजक", joinedDate: new Date().toLocaleDateString("hi-IN"), status: "सक्रिय ✓" },
                { name: "सुभाष चंद्र खीचड़", district: "बीकानेर", role: "हरित प्रहरी", joinedDate: new Date().toLocaleDateString("hi-IN"), status: "सक्रिय ✓" }
            ];
            const members = readStore("bishnoi_community_members_v5", defaultMembers);
            tableHeaders = `
                <tr>
                    <th style="width:10%;">क्र.सं.</th>
                    <th style="width:30%;">सदस्य का नाम</th>
                    <th style="width:20%;">जिला / क्षेत्र</th>
                    <th style="width:20%;">दायित्व</th>
                    <th style="width:20%;">पंजीकरण तिथि</th>
                </tr>
            `;
            tableRows = members.map((m, i) => `
                <tr>
                    <td style="text-align:center;">${i + 1}</td>
                    <td style="font-weight:700;">${m.name}</td>
                    <td>${m.district}</td>
                    <td>${m.role}</td>
                    <td style="text-align:center;">${m.joinedDate}</td>
                </tr>
            `).join("");
        } else {
            title = `मुख्य परिणाम वरीयता सूची (Official Merit List - ${reportType.toUpperCase()})`;
            subtitle = "उच्चतम से न्यूनतम अंकों के क्रम में स्वचालित रैंक (Descending Order Merit)";
            const list = getSeparateSheetSubmissions(reportType);
            tableHeaders = `
                <tr>
                    <th style="width:10%;">रैंक (Rank)</th>
                    <th style="width:20%;">रोल नंबर</th>
                    <th style="width:24%;">परीक्षार्थी का नाम</th>
                    <th style="width:14%;">जिला</th>
                    <th style="width:12%;">प्राप्तांक</th>
                    <th style="width:20%;">मूल्यांकन स्थिति</th>
                </tr>
            `;
            tableRows = list.map((r, i) => {
                const statusStr = r.manualEvaluated ? "मैनुअल सत्यापित ✓" : r.statusNote;
                return `
                    <tr>
                        <td style="text-align:center;font-weight:800;color:#064e3b;">#${i + 1}</td>
                        <td style="font-weight:700;">${r.rollNumber}</td>
                        <td style="font-weight:600;">${r.studentName}</td>
                        <td>${r.district}</td>
                        <td style="text-align:center;font-weight:800;color:#b45309;">${r.score}</td>
                        <td>${statusStr}</td>
                    </tr>
                `;
            }).join("");
        }

        const emptyRow = `<tr><td colspan="6" style="text-align:center;padding:16px;">कोई रिकॉर्ड उपलब्ध नहीं है।</td></tr>`;
        const finalBody = tableRows || emptyRow;

        const win = window.open("", "_blank", "width=950,height=1100");
        if (!win) {
            alert("कृपया PDF रिपोर्ट देखने के लिए ब्राउज़र में Pop-ups की अनुमति दें।");
            return;
        }

        win.document.write(`
            <!DOCTYPE html>
            <html lang="hi">
            <head>
                <meta charset="UTF-8" />
                <title>${title}</title>
                <style>
                    @page { size: A4 portrait; margin: 14mm; }
                    body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; color: #111827; margin: 0; padding: 20px; background: #ffffff; }
                    .report-box { max-width: 820px; margin: 0 auto; border: 2px solid #064e3b; padding: 20px; border-radius: 10px; }
                    .hdr { text-align: center; border-bottom: 2px solid #064e3b; padding-bottom: 12px; margin-bottom: 16px; }
                    .hdr h1 { font-size: 20px; font-weight: 800; color: #064e3b; margin: 4px 0; }
                    .hdr p { font-size: 12.5px; color: #374151; margin: 2px 0; font-weight: 600; }
                    .meta-bar { display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; color: #064e3b; margin-bottom: 12px; background: #ecfdf5; padding: 6px 12px; border-radius: 6px; }
                    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                    th { background: #064e3b; color: #ffffff; font-size: 12px; font-weight: 800; padding: 9px 8px; border: 1px solid #064e3b; text-align: left; }
                    td { font-size: 12px; padding: 8px; border: 1px solid #d1d5db; word-wrap: break-word; vertical-align: middle; }
                    tr:nth-child(even) td { background: #f9fafb; }
                    .ftr { margin-top: 24px; padding-top: 10px; border-top: 1px dashed #9ca3af; display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; color: #374151; }
                    @media print { .no-print { display: none !important; } body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="no-print" style="text-align:center;margin-bottom:14px;">
                    <button onclick="window.print()" style="background:#064e3b;color:#fde68a;border:none;padding:10px 22px;border-radius:8px;font-weight:800;cursor:pointer;">🖨️ मानक PDF प्रिंट / सेव करें</button>
                </div>
                <div class="report-box">
                    <div class="hdr">
                        <div style="font-size:11px;font-weight:800;color:#b45309;">॥ श्री गुरु जम्भेश्वराय नमः ॥</div>
                        <h1>${title}</h1>
                        <p>${subtitle}</p>
                    </div>
                    <div class="meta-bar">
                        <span>जारी करने की तिथि: ${new Date().toLocaleDateString("hi-IN")}</span>
                        <span>मानक संरेखण (ISO/A4 Standard Format)</span>
                    </div>
                    <table>
                        <thead>${tableHeaders}</thead>
                        <tbody>${finalBody}</tbody>
                    </table>
                    <div class="ftr">
                        <span>कंप्यूटर जनित आधिकारिक रिपोर्ट</span>
                        <span>हस्ताक्षर: मुख्य परीक्षा नियंत्रक (विश्नोई समाज पोर्टल)</span>
                    </div>
                </div>
            </body>
            </html>
        `);
        win.document.close();
    });
}

// --- 15. SEPARATE QUESTION BANKS & BULK UPLOADER ---
function getActiveQuestionBank(examType = "") {
    const activeType = valOr(examType, valOr(examRuntime && examRuntime.examType, "main"));
    const specificBank = readStore(`bishnoi_qbank_${activeType}_v5`, null);
    if (Array.isArray(specificBank) && specificBank.length > 0) return specificBank;

    const fallbackCustom = readStore("bishnoi_custom_question_bank_v5", null);
    return (Array.isArray(fallbackCustom) && fallbackCustom.length > 0) ? fallbackCustom : DEFAULT_EXAM_QUESTIONS;
}

function parseBulkQuestionBankLines(rawText) {
    const lines = valOr(rawText, "").split("\n").map(l => l.trim()).filter(Boolean);
    const parsed = [];
    const errors = [];

    lines.forEach((line, idx) => {
        const parts = line.split("|").map(p => p.trim());
        if (parts.length < 6) {
            errors.push(`पंक्ति ${idx + 1}: कम से कम ६ भाग (प्रश्न | 4 विकल्प | सही उत्तर संख्या) होने चाहिए।`);
            return;
        }
        const ansNum = parseInt(parts[5], 10);
        if (isNaN(ansNum) || ansNum < 1 || ansNum > 4) {
            errors.push(`पंक्ति ${idx + 1}: सही विकल्प संख्या 1 से 4 के बीच होनी चाहिए।`);
            return;
        }
        parsed.push({
            id: idx + 1,
            q: parts[0],
            options: [parts[1], parts[2], parts[3], parts[4]],
            ans: ansNum - 1,
            section: valOr(parts[6], "A").toUpperCase(),
            topic: valOr(parts[7], "जम्भवाणी साहित्य"),
            explanation: valOr(parts[8], "")
        });
    });

    return { parsed, errors };
}

function validateBulkQuestionBankInput() {
    const raw = valOr(document.getElementById("bulkQuestionBankTextarea")?.value, "");
    const feedback = document.getElementById("bulkQuestionValidatorFeedback");
    if (!feedback) return;

    const { parsed, errors } = parseBulkQuestionBankLines(raw);
    if (errors.length > 0) {
        feedback.className = "my-2 p-3 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs font-bold";
        feedback.innerHTML = `❌ त्रुटियाँ मिलीं:<br>${errors.join("<br>")}`;
    } else if (parsed.length === 0) {
        feedback.className = "my-2 p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold";
        feedback.innerText = "⚠️ कृपया जांचने के लिए कम से कम १ प्रश्न पेस्ट करें।";
    } else {
        feedback.className = "my-2 p-3 rounded-xl bg-green-50 text-green-900 border border-green-300 text-xs font-extrabold";
        feedback.innerText = `✅ प्रारूप १००% सही है! कुल ${parsed.length} प्रश्न अपलोड के लिए तैयार हैं।`;
    }
}

function uploadValidatedBulkQuestionBank() {
    verifyOwnerSecretPin(() => {
        const raw = valOr(document.getElementById("bulkQuestionBankTextarea")?.value, "");
        const targetType = valOr(document.getElementById("bulkExamTypeTargetSelect")?.value, "main");
        const { parsed, errors } = parseBulkQuestionBankLines(raw);

        if (errors.length > 0 || parsed.length === 0) {
            alert("कृपया पहले प्रश्न प्रारूप की त्रुटियाँ सुधारें!");
            return;
        }

        writeStore(`bishnoi_qbank_${targetType}_v5`, parsed);
        if (targetType === "main") {
            writeStore("bishnoi_custom_question_bank_v5", parsed);
        }
        pushPortalNotification(`📚 ${targetType.toUpperCase()} परीक्षा के लिए नया प्रश्न-बैंक (${parsed.length} प्रश्न) अपडेट कर दिया गया है!`);
        showToast(`🚀 ${targetType.toUpperCase()} हेतु ${parsed.length} प्रश्न सफलतापूर्वक सुरक्षित हो गए!`);
    });
}

// --- 16. MANUAL EVALUATION & DELEGATE EVALUATOR ---
function openDetailedManualEvaluationViewer() {
    verifyOwnerOrDelegatePin(() => {
        const roll = valOr(document.getElementById("manualEvalRollInput")?.value, "").trim().toUpperCase();
        const sheetType = valOr(document.getElementById("manualEvalSheetSelect")?.value, "main");
        const outBox = document.getElementById("manualEvalDetailedBox");
        if (!outBox || !roll) return;

        const list = getSeparateSheetSubmissions(sheetType);
        const sub = list.find(item => item.rollNumber.toUpperCase() === roll);
        if (!sub) {
            outBox.innerHTML = `<div class="p-3 bg-red-50 text-red-800 rounded-xl text-xs font-bold">❌ रोल नंबर ${roll} की उत्तर पुस्तिका (${sheetType}) में नहीं मिली।</div>`;
            return;
        }

        const qBank = getActiveQuestionBank(sheetType);
        const weights = getSectionWeightsConfig();

        outBox.innerHTML = `
            <div class="p-5 bg-white rounded-2xl border-2 border-emerald-700 space-y-4">
                <div class="flex flex-wrap justify-between items-center border-b pb-3">
                    <div>
                        <span class="font-extrabold text-base text-emerald-950">${sub.studentName} (${sub.rollNumber})</span>
                        <span class="ml-2 text-xs font-bold text-gray-700">जिला: ${sub.district}</span>
                    </div>
                    <span class="px-3 py-1 bg-amber-100 text-amber-950 font-extrabold text-xs rounded-xl">वर्तमान स्कोर: <strong id="liveManualScoreCounter">${sub.score}</strong></span>
                </div>
                <div class="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    ${qBank.map((q, i) => {
                        const ansIdx = sub.answers ? sub.answers[q.id] : undefined;
                        const isRight = (Number(ansIdx) === Number(q.ans));
                        const secKey = valOr(q.section, "A");
                        const secRule = weights[secKey] || { plus: 2, minus: 0.5 };
                        const userAnsText = (ansIdx !== undefined) ? q.options[ansIdx] : 'छोड़ा गया';
                        return `
                            <div class="p-3 rounded-xl border flex flex-wrap justify-between items-center gap-2 text-xs ${isRight ? 'bg-green-50/70 border-green-200' : 'bg-red-50/70 border-red-200'}">
                                <div class="flex-1">
                                    <div class="font-extrabold text-gray-900">प्र. ${i + 1} (खंड ${secKey}): ${q.q}</div>
                                    <div class="mt-1 text-gray-700">छात्र का उत्तर: <strong>${userAnsText}</strong> | सही: <strong class="text-emerald-900">${q.options[q.ans]}</strong></div>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <button onclick="adjustSingleQuestionManualMark(${secRule.plus})" class="px-2.5 py-1 bg-green-700 text-white font-extrabold rounded-lg hover:bg-green-800">✓ सही (+${secRule.plus})</button>
                                    <button onclick="adjustSingleQuestionManualMark(-${secRule.minus})" class="px-2.5 py-1 bg-red-700 text-white font-extrabold rounded-lg hover:bg-red-800">✕ गलत (-${secRule.minus})</button>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
                <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                    <div class="flex items-center gap-2">
                        <label class="text-xs font-extrabold text-gray-800">अंतिम अनुमोदित अंक:</label>
                        <input id="manualFinalApprovedMarksInput" type="number" step="0.25" value="${sub.score}" class="px-3 py-2 rounded-xl border-2 border-emerald-600 text-sm font-extrabold text-gray-900 w-32" />
                    </div>
                    <button onclick="approveFinalManualMarksAndRefreshTable('${sub.rollNumber}', '${sheetType}')" class="px-6 py-2.5 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl shadow hover:bg-emerald-950">
                        ✅ मूल्यांकन सबमिट करें व Excel रैंक शीट में लॉक करें
                    </button>
                </div>
            </div>
        `;
    });
}

function adjustSingleQuestionManualMark(delta) {
    const inp = document.getElementById("manualFinalApprovedMarksInput");
    const badge = document.getElementById("liveManualScoreCounter");
    if (!inp) return;
    const current = parseFloat(valOr(inp.value, "0"));
    const updated = Number((current + Number(delta)).toFixed(2));
    inp.value = String(updated);
    if (badge) badge.innerText = String(updated);
}

function approveFinalManualMarksAndRefreshTable(rollNumber, sheetType) {
    const newMarks = parseFloat(valOr(document.getElementById("manualFinalApprovedMarksInput")?.value, "0"));
    const list = getSeparateSheetSubmissions(sheetType);
    const target = list.find(item => item.rollNumber === rollNumber);
    if (!target) return;

    target.score = newMarks;
    target.manualEvaluated = true;
    target.statusNote = "व्यवस्थापक द्वारा मैनुअल सत्यापित ✓";
    saveSubmissionToSeparateSheet(sheetType, target);
    showToast(`✅ रोल नंबर ${rollNumber} के अंतिम अंक (${newMarks}) Excel मेरिट शीट में लॉक कर दिए गए हैं!`);
    renderLiveAutoRankedPreviewTable(sheetType);
}

// --- 17. COMMUNITY CHAUPAL & FORMS ---
function injectInteractiveChaupalAndMeraPodhaForms() {
    if (typeof document === "undefined") return;
    const chaupalSec = document.getElementById("chaupal");
    if (!chaupalSec || document.getElementById("chaupalAndMeraPodhaMasterHub")) return;

    const hubCard = document.createElement("div");
    hubCard.id = "chaupalAndMeraPodhaMasterHub";
    hubCard.className = "max-w-5xl mx-auto my-6 space-y-6 px-2";
    hubCard.innerHTML = `
        <div class="bg-white rounded-3xl p-6 shadow-xl border-2 border-emerald-800/30">
            <div class="flex items-center gap-2 mb-3">
                <span class="px-3 py-1 bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-full uppercase">समाज चौपाल</span>
                <h3 class="text-xl font-extrabold text-emerald-950">🌿 विश्नोई समाज संवाद मंच — अपने विचार साझा करें</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input id="chaupalAuthorInput" type="text" placeholder="आपका नाम *" class="px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-xs md:text-sm text-gray-900" />
                <input id="chaupalDistrictInput" type="text" placeholder="जिला / गाँव (उदा. हिसार, बीकानेर)" class="px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-xs md:text-sm text-gray-900" />
                <button onclick="submitNewChaupalPost('chaupalAuthorInput', 'chaupalDistrictInput', 'chaupalTextInput')" class="px-6 py-2.5 bg-emerald-900 text-amber-300 font-extrabold text-xs md:text-sm rounded-xl shadow hover:bg-emerald-950">
                    📢 विचार प्रकाशित करें
                </button>
            </div>
            <textarea id="chaupalTextInput" rows="3" placeholder="गुरु जम्भेश्वर भगवान के २९ नियम, खेजड़ली इतिहास या पर्यावरण चेतना पर अपने विचार यहाँ लिखें..." class="w-full p-3 rounded-xl border border-gray-300 font-semibold text-xs md:text-sm text-gray-900 focus:outline-none focus:border-emerald-700"></textarea>
            <div id="chaupalPostsContainer" class="mt-6 space-y-4"></div>
        </div>

        <div class="bg-gradient-to-br from-emerald-950 to-emerald-900 text-white rounded-3xl p-6 shadow-xl border-2 border-amber-400">
            <div class="flex items-center gap-2 mb-2">
                <span class="px-3 py-1 bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-full uppercase">मेरा पौधा महाभियान</span>
                <h3 class="text-xl font-extrabold text-amber-300">🌳 'एक पेड़ माँ के नाम' - पौधरोपण संकल्प एवं सम्मान</h3>
            </div>
            <p class="text-xs text-emerald-100 mb-4">पौधरोपण कर फोटो अपलोड करें और तुरंत 'हरित प्रहरी सम्मान प्रमाण-पत्र' प्राप्त करें।</p>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                    <label class="block text-xs font-bold text-emerald-200 mb-1">पर्यावरण प्रेमी का नाम *</label>
                    <input id="pledgerNameInput" type="text" placeholder="अपना नाम" class="w-full px-3 py-2 rounded-xl text-gray-900 font-bold text-xs" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-emerald-200 mb-1">जिला / क्षेत्र</label>
                    <input id="pledgerDistrictInput" type="text" placeholder="उदा. जोधपुर" class="w-full px-3 py-2 rounded-xl text-gray-900 font-bold text-xs" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-emerald-200 mb-1">📸 पौधे की फोटो</label>
                    <input id="pledgerPhotoFile" type="file" accept="image/*" class="w-full text-xs text-emerald-100 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-emerald-950" />
                </div>
                <div>
                    <button onclick="handlePodhaPledgeSubmit()" class="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-extrabold text-xs rounded-xl shadow">
                        🌱 संकल्प लें व प्रमाण-पत्र लें
                    </button>
                </div>
            </div>
            <div id="meraPodhaWallContainer" class="mt-6"></div>
        </div>
    `;
    chaupalSec.prepend(hubCard);
}

function handlePodhaPledgeSubmit() {
    const name = valOr(document.getElementById("pledgerNameInput")?.value, "").trim();
    const dist = valOr(document.getElementById("pledgerDistrictInput")?.value, "हिसार").trim();
    uploadMeraPodhaPledgeWithPhoto(name, dist, "pledgerPhotoFile");
}

function renderChaupalFeed(containerId = "chaupalPostsContainer") {
    const container = document.getElementById(containerId);
    if (!container) return;

    let posts = readStore(PORTAL_CONFIG.chaupalPostsKey, null);
    if (!posts) {
        posts = [
            {
                id: 101,
                author: "आचार्य डॉ. सत्यनारायण बिश्नोई",
                badge: "समाज रत्न",
                district: "जोधपुर",
                text: "गुरु जम्भेश्वर भगवान के २९ नियम आज के वैश्विक पर्यावरण संकट का एकमात्र सटीक समाधान हैं। प्रत्येक युवा प्रतिदिन सबदवाणी का पाठ अवश्य करे।",
                upvotes: 42,
                reactions: { "🙏": 28, "🌿": 19 },
                comments: [
                    { id: 9001, author: "रमेश गोदारा (हिसार)", text: "बिल्कुल सत्य वचन! युवाओं को प्रतिदिन सबदवाणी पढ़नी चाहिए।", reactions: { "🙏": 5 } }
                ]
            }
        ];
        writeStore(PORTAL_CONFIG.chaupalPostsKey, posts);
    }

    posts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

    container.innerHTML = posts.map(post => {
        const userPostEmoji = typeof localStorage !== "undefined" ? localStorage.getItem(`user_emoji_post_${post.id}`) : null;
        const comments = Array.isArray(post.comments) ? post.comments : [];

        const commentsHtml = comments.map(c => {
            const userCommentEmoji = typeof localStorage !== "undefined" ? localStorage.getItem(`user_emoji_comment_${c.id}`) : null;
            return `
                <div class="p-2.5 bg-gray-50 rounded-xl text-xs flex flex-wrap justify-between items-center gap-2">
                    <div><strong class="text-emerald-950">${c.author}:</strong> <span class="text-gray-800 font-medium">${c.text}</span></div>
                    <div class="flex items-center gap-1">
                        ${["🙏", "🌿", "❤️"].map(em => {
                            const cCnt = (c.reactions && c.reactions[em]) || 0;
                            const cCls = (userCommentEmoji === em) ? "bg-emerald-700 text-white" : "bg-white text-gray-700 border";
                            return `<button onclick="reactSingleEmojiToComment(${post.id}, ${c.id}, '${em}')" class="px-2 py-0.5 rounded-md text-[11px] font-bold ${cCls}">${em} ${cCnt}</button>`;
                        }).join("")}
                    </div>
                </div>
            `;
        }).join("");

        return `
            <div class="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm mb-4">
                <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <div>
                        <span class="font-extrabold text-gray-900 text-sm">${post.author}</span>
                        <span class="ml-2 px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full">🎖️ ${valOr(post.badge, 'सदस्य')} • ${post.district}</span>
                    </div>
                    <button onclick="upvoteChaupalPost(${post.id})" class="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold hover:bg-amber-100">
                        👍 समर्थन (Upvote: ${post.upvotes || 0})
                    </button>
                </div>
                <p class="text-gray-900 font-medium text-sm leading-relaxed mb-3">${post.text}</p>
                <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                    <div class="flex items-center gap-1.5">
                        <span class="text-gray-500 font-bold">प्रतिक्रिया (१ इमोजी):</span>
                        ${["🙏", "🌿", "❤️", "🙌"].map(emoji => {
                            const cnt = (post.reactions && post.reactions[emoji]) || 0;
                            const cls = (userPostEmoji === emoji) ? "bg-emerald-800 text-amber-300 border-emerald-900" : "bg-gray-100 text-gray-800 border-gray-200";
                            return `<button onclick="reactSingleEmojiToPost(${post.id}, '${emoji}')" class="px-2.5 py-1 rounded-lg border font-extrabold ${cls}">${emoji} ${cnt}</button>`;
                        }).join("")}
                    </div>
                </div>
                <div class="mt-3 space-y-2 pl-3 border-l-2 border-emerald-200">
                    ${commentsHtml}
                    <div class="flex gap-2 pt-1">
                        <input id="commentText_${post.id}" type="text" placeholder="इस विचार पर टिप्पणी (Comment) लिखें..." class="flex-1 px-3 py-1.5 rounded-xl border text-xs font-semibold text-gray-900" />
                        <button onclick="addCommentToChaupalPost(${post.id})" class="px-3 py-1.5 bg-emerald-800 text-white font-extrabold text-xs rounded-xl">टिप्पणी जोड़ें</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function upvoteChaupalPost(postId) {
    const voteKey = `user_upvoted_${postId}`;
    if (localStorage.getItem(voteKey)) {
        showToast("आप पहले ही इस विचार को समर्थन दे चुके हैं।");
        return;
    }
    const posts = readStore(PORTAL_CONFIG.chaupalPostsKey, []);
    const target = posts.find(p => p.id === postId);
    if (target) {
        target.upvotes = (target.upvotes || 0) + 1;
        localStorage.setItem(voteKey, "true");
        writeStore(PORTAL_CONFIG.chaupalPostsKey, posts);
        renderChaupalFeed();
    }
}

function reactSingleEmojiToPost(postId, chosenEmoji) {
    const reactKey = `user_emoji_post_${postId}`;
    const previousEmoji = localStorage.getItem(reactKey);
    const posts = readStore(PORTAL_CONFIG.chaupalPostsKey, []);
    const target = posts.find(p => p.id === postId);
    if (!target) return;

    target.reactions = valOr(target.reactions, {});
    if (previousEmoji && target.reactions[previousEmoji] > 0) {
        target.reactions[previousEmoji] -= 1;
    }
    target.reactions[chosenEmoji] = (target.reactions[chosenEmoji] || 0) + 1;

    localStorage.setItem(reactKey, chosenEmoji);
    writeStore(PORTAL_CONFIG.chaupalPostsKey, posts);
    renderChaupalFeed();
}

function addCommentToChaupalPost(postId) {
    const inp = document.getElementById(`commentText_${postId}`);
    const txt = valOr(inp?.value, "").trim();
    if (!txt) return;
    const author = valOr(prompt("अपना नाम व जिला लिखें:", "साधक (हिसार)"), "सदस्य");

    const posts = readStore(PORTAL_CONFIG.chaupalPostsKey, []);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    post.comments = Array.isArray(post.comments) ? post.comments : [];
    post.comments.push({ id: Date.now(), author: author.trim(), text: txt, reactions: { "🙏": 1 } });
    writeStore(PORTAL_CONFIG.chaupalPostsKey, posts);
    renderChaupalFeed();
}

function reactSingleEmojiToComment(postId, commentId, chosenEmoji) {
    const key = `user_emoji_comment_${commentId}`;
    const prev = localStorage.getItem(key);
    const posts = readStore(PORTAL_CONFIG.chaupalPostsKey, []);
    const post = posts.find(p => p.id === postId);
    if (!post || !Array.isArray(post.comments)) return;

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) return;

    comment.reactions = valOr(comment.reactions, {});
    if (prev && comment.reactions[prev] > 0) {
        comment.reactions[prev] -= 1;
    }
    comment.reactions[chosenEmoji] = (comment.reactions[chosenEmoji] || 0) + 1;

    localStorage.setItem(key, chosenEmoji);
    writeStore(PORTAL_CONFIG.chaupalPostsKey, posts);
    renderChaupalFeed();
}

function submitNewChaupalPost(authorInputId, districtInputId, textInputId) {
    const author = valOr(document.getElementById(authorInputId)?.value, prompt("अपना नाम लिखें:")).trim();
    const district = valOr(document.getElementById(districtInputId)?.value, "हिसार").trim();
    const text = valOr(document.getElementById(textInputId)?.value, prompt("समाज संवाद मंच के लिए अपना विचार लिखें:")).trim();

    if (!author || !text) {
        alert("कृपया अपना नाम और संदेश दोनों लिखें!");
        return;
    }

    const posts = readStore(PORTAL_CONFIG.chaupalPostsKey, []);
    posts.unshift({
        id: Date.now(),
        author: author,
        badge: "सक्रिय सदस्य",
        district: district,
        text: text,
        upvotes: 1,
        reactions: { "🙏": 1 }
    });

    writeStore(PORTAL_CONFIG.chaupalPostsKey, posts);
    const textEl = document.getElementById(textInputId);
    if (textEl) textEl.value = "";
    renderChaupalFeed();
    showToast("💬 आपका विचार समाज संवाद मंच पर प्रकाशित हो गया है!");
}

// --- 18. DISTRICT TELEMETRY & MERA PODHA GALLERY ---
function getDistrictParticipationTelemetry() {
    const enrolled = readStore(PORTAL_CONFIG.enrollmentsKey, []);
    const counts = { "हिसार": 14, "जोधपुर": 19, "बीकानेर": 16, "सिरसा": 11, "फतेहाबाद": 9, "बाड़मेर": 12, "श्रीगंगानगर": 10 };
    enrolled.forEach(s => {
        const d = valOr(s.district, "अन्य").trim();
        counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
}

function upgradeTelemetryWithDistrictStateFilter() {
    const grid = document.getElementById("districtTelemetryHeatmapGrid");
    if (!grid || document.getElementById("telemetryFilterToolbar")) return;

    const filterBar = document.createElement("div");
    filterBar.id = "telemetryFilterToolbar";
    filterBar.className = "flex flex-wrap items-center justify-between gap-2 mb-3";
    filterBar.innerHTML = `
        <input id="telemetryDistrictSearchInput" type="text" oninput="filterDistrictTelemetryGrid()" placeholder="🔍 जिला या राज्य खोजें (उदा. हिसार, जोधपुर, बीकानेर, सिरसा)..." class="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-900" />
        <select id="telemetryStateFilterSelect" onchange="filterDistrictTelemetryGrid()" class="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-900">
            <option value="ALL">सभी राज्य / जिले (All Regions)</option>
            <option value="HARYANA">हरियाणा (हिसार, सिरसा, फतेहाबाद)</option>
            <option value="RAJASTHAN">राजस्थान (जोधपुर, बीकानेर, बाड़मेर, श्रीगंगानगर)</option>
        </select>
    `;
    grid.parentNode.insertBefore(filterBar, grid);
    filterDistrictTelemetryGrid();
}

function filterDistrictTelemetryGrid() {
    const grid = document.getElementById("districtTelemetryHeatmapGrid");
    if (!grid) return;

    const q = valOr(document.getElementById("telemetryDistrictSearchInput")?.value, "").trim().toLowerCase();
    const stateFilter = valOr(document.getElementById("telemetryStateFilterSelect")?.value, "ALL");
    const haryanaDistricts = ["हिसार", "सिरसा", "फतेहाबाद", "भिवानी", "जींद"];
    const rajasthanDistricts = ["जोधपुर", "बीकानेर", "बाड़मेर", "श्रीगंगानगर", "हनुमानगढ़", "नागौर", "चूरू", "फलौदी"];

    const allData = getDistrictParticipationTelemetry();
    const filteredEntries = Object.entries(allData).filter(([dist]) => {
        const matchesQuery = !q || dist.toLowerCase().includes(q);
        if (!matchesQuery) return false;
        if (stateFilter === "HARYANA") return haryanaDistricts.some(d => dist.includes(d));
        if (stateFilter === "RAJASTHAN") return rajasthanDistricts.some(d => dist.includes(d));
        return true;
    });

    grid.innerHTML = filteredEntries.map(([dist, count]) => `
        <div class="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
            <span class="font-extrabold text-xs text-emerald-950">📍 ${dist}</span>
            <span class="px-2.5 py-1 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-lg">${count} छात्र</span>
        </div>
    `).join("");
}

function uploadMeraPodhaPledgeWithPhoto(pledgerName, district, photoInputId) {
    if (!pledgerName) {
        alert("कृपया अपना नाम दर्ज करें!");
        return;
    }
    const input = photoInputId ? document.getElementById(photoInputId) : null;
    const file = (input && input.files) ? input.files[0] : null;

    const savePledge = (imgData) => {
        const gallery = readStore(PORTAL_CONFIG.podhaGalleryKey, []);
        gallery.unshift({
            id: Date.now(),
            name: pledgerName.trim(),
            district: valOr(district, "विश्नोई क्षेत्र").trim(),
            photo: imgData || createDefaultAvatarSVG(pledgerName),
            date: new Date().toLocaleDateString("hi-IN")
        });
        writeStore(PORTAL_CONFIG.podhaGalleryKey, gallery);
        renderMeraPodhaGallery("meraPodhaWallContainer");
        downloadStudentCertificate(`PODHA-${Date.now().toString().slice(-4)}`, pledgerName, "हरित प्रहरी वृक्षारोपण सम्मान");
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => savePledge(e.target.result);
        reader.readAsDataURL(file);
    } else {
        savePledge(null);
    }
}

function renderMeraPodhaGallery(containerId = "meraPodhaWallContainer") {
    const container = document.getElementById(containerId);
    if (!container) return;
    const gallery = readStore(PORTAL_CONFIG.podhaGalleryKey, []);
    if (gallery.length === 0) return;

    container.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            ${gallery.slice(0, 8).map(item => `
                <div class="bg-white rounded-2xl p-3 border border-emerald-200 shadow-sm text-center">
                    <img src="${item.photo}" alt="${item.name}" class="w-full h-28 object-cover rounded-xl mb-2 border border-emerald-100" />
                    <div class="font-bold text-xs text-emerald-950">${item.name}</div>
                    <div class="text-[11px] text-gray-500">🌳 ${item.district} • ${item.date}</div>
                </div>
            `).join("")}
        </div>
    `;
}

function downloadStudentCertificate(certId, recipientName, achievementScoreOrTitle) {
    const win = window.open("", "_blank", "width=850,height=650");
    if (!win) return;
    win.document.write(`
        <!DOCTYPE html>
        <html lang="hi">
        <head><meta charset="UTF-8"><title>सम्मान प्रमाण-पत्र - ${recipientName}</title></head>
        <body style="font-family:'Noto Sans Devanagari',serif;background:#f3f4f6;padding:24px;text-align:center;">
            <div style="max-width:720px;margin:0 auto;background:#fffbeb;border:8px double #064e3b;padding:36px;border-radius:18px;">
                <div style="font-size:13px;font-weight:800;color:#b45309;letter-spacing:1.5px;">॥ श्री गुरु जम्भेश्वराय नमः ॥</div>
                <h1 style="color:#064e3b;font-size:28px;margin:10px 0;">विश्नोई समाज आधिकारिक गौरव प्रमाण-पत्र</h1>
                <p style="font-size:15px;color:#374151;">यह प्रमाणित किया जाता है कि</p>
                <h2 style="font-size:24px;color:#b45309;margin:8px 0;text-decoration:underline;">${recipientName}</h2>
                <p style="font-size:14px;color:#111827;line-height:1.7;">
                    ने जम्भवाणी साहित्य, २९ नियम एवं पर्यावरण संरक्षण महाअभियान के अंतर्गत उत्कृष्ट प्रदर्शन करते हुए
                    <strong>(${achievementScoreOrTitle})</strong> उपलब्धि अर्जित की है। (प्रमाण-पत्र क्र.: ${certId})
                </p>
                <div style="margin-top:32px;display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#064e3b;">
                    <span>दिनांक: ${new Date().toLocaleDateString("hi-IN")}</span>
                    <button onclick="window.print()" style="background:#064e3b;color:#fde68a;border:none;padding:8px 18px;border-radius:8px;cursor:pointer;font-weight:800;">🖨️ प्रमाण-पत्र डाउनलोड / प्रिंट करें</button>
                    <span>हस्ताक्षर: परीक्षा एवं पर्यावरण संयोजक</span>
                </div>
            </div>
        </body>
        </html>
    `);
    win.document.close();
}

// --- 19. FIREBASE CLOUD REAL-TIME SYNC & OFFLINE QUEUE ---
async function syncSubmissionToFirebaseCloud(examType, submissionRecord) {
    const firestoreDb = (typeof window !== "undefined" && window.db) || (typeof firebase !== "undefined" && firebase.firestore ? firebase.firestore() : null);
    const collectionName = (examType === "main") ? "mainExamSubmissions" : `mockExamSubmissions_${examType}`;

    if (typeof navigator !== "undefined" && (!navigator.onLine || !firestoreDb)) {
        queueSubmissionForOfflineSync(collectionName, submissionRecord);
        return false;
    }

    try {
        if (firestoreDb && typeof firestoreDb.collection === "function") {
            await firestoreDb.collection(collectionName).doc(submissionRecord.rollNumber).set(submissionRecord, { merge: true });
        }
        return true;
    } catch (err) {
        console.warn("Cloud sync deferred:", err);
        queueSubmissionForOfflineSync(collectionName, submissionRecord);
        return false;
    }
}

function queueSubmissionForOfflineSync(collectionName, record) {
    const queue = readStore(PORTAL_CONFIG.offlineQueueKey, []);
    queue.push({ collectionName: collectionName, record: record, queuedAt: Date.now() });
    writeStore(PORTAL_CONFIG.offlineQueueKey, queue);
}

async function flushOfflineExamQueue() {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const queue = readStore(PORTAL_CONFIG.offlineQueueKey, []);
    if (queue.length === 0) return;

    const firestoreDb = (typeof window !== "undefined" && window.db) || (typeof firebase !== "undefined" && firebase.firestore ? firebase.firestore() : null);
    if (!firestoreDb || typeof firestoreDb.collection !== "function") return;

    const remaining = [];
    for (const item of queue) {
        try {
            await firestoreDb.collection(item.collectionName).doc(item.record.rollNumber).set(item.record, { merge: true });
        } catch (e) {
            remaining.push(item);
        }
    }

    writeStore(PORTAL_CONFIG.offlineQueueKey, remaining);
    if (remaining.length === 0 && queue.length > 0) {
        showToast("☁️ ऑफलाइन उत्तर पुस्तिका सर्वर पर सुरक्षित सिंक हो गई है!");
    }
}

if (typeof window !== "undefined") {
    window.addEventListener("online", flushOfflineExamQueue);
}

function downloadOfflineEncryptedExamPacket() {
    const questions = getActiveQuestionBank("main");
    const payload = JSON.stringify({ generatedAt: Date.now(), questions: questions });
    const encrypted = btoa(unescape(encodeURIComponent(payload)));
    writeStore(PORTAL_CONFIG.offlinePacketKey, encrypted);

    const blob = new Blob([encrypted], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Bishnoi_Offline_Exam_Packet_2026.bpk`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("📶 ऑफलाइन एन्क्रिप्टेड परीक्षा पैकेट डाउनलोड हो गया है!");
}

function importOfflineEncryptedExamPacket(fileInputElement) {
    const file = (fileInputElement && fileInputElement.files) ? fileInputElement.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const encryptedStr = valOr(e.target.result, "").trim();
            const decodedJson = decodeURIComponent(escape(atob(encryptedStr)));
            const packet = JSON.parse(decodedJson);

            if (packet && Array.isArray(packet.questions) && packet.questions.length > 0) {
                writeStore("bishnoi_custom_question_bank_v5", packet.questions);
                writeStore(PORTAL_CONFIG.offlinePacketKey, encryptedStr);
                showToast(`✅ ऑफलाइन परीक्षा पैकेट (.bpk) लोड हो गया! (${packet.questions.length} प्रश्न)`);
            } else {
                alert("❌ अमान्य ऑफलाइन पैकेट फ़ाइल!");
            }
        } catch (err) {
            alert("❌ ऑफलाइन पैकेट पढ़ने में त्रुटि!");
        }
    };
    reader.readAsText(file);
}

function manualTriggerOfflineSync() {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
        alert("⚠️ अभी इंटरनेट कनेक्शन उपलब्ध नहीं है। उत्तर फ़ोन में सुरक्षित हैं; इंटरनेट आते ही सिंक हो जाएंगे।");
        return;
    }
    flushOfflineExamQueue();
    showToast("☁️ ऑफलाइन उत्तर पुस्तिका सर्वर के साथ सिंक कर दी गई है!");
}

function injectOfflinePacketLoaderAndSyncBar() {
    const hub = document.getElementById("parikshaMasterHubWrapper");
    if (!hub || document.getElementById("ruralOfflineExamControlCard")) return;

    const card = document.createElement("div");
    card.id = "ruralOfflineExamControlCard";
    card.className = "bg-emerald-50 rounded-3xl p-5 border-2 border-emerald-700/30 shadow-md my-4";
    card.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <span class="px-2.5 py-0.5 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-lg">📶 ग्रामीण ऑफलाइन परीक्षा मोड</span>
                <h4 class="font-extrabold text-sm md:text-base text-gray-900 mt-1">एन्क्रिप्टेड परीक्षा पैकेट (.bpk)</h4>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <button onclick="downloadOfflineEncryptedExamPacket()" class="px-4 py-2 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl shadow">📥 पैकेट डाउनलोड करें</button>
                <button onclick="manualTriggerOfflineSync()" class="px-4 py-2 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-xl shadow">☁️ उत्तर सिंक करें</button>
            </div>
        </div>
    `;
    hub.appendChild(card);
}

// --- 20. PROCTORING WEBCAM SYNC & LIVE STATS ---
function startExamWebcamProctoring(rollNumber) {
    const video = document.getElementById("examWebcamStream");
    if (!video || typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

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
    if (video && video.srcObject && typeof video.srcObject.getTracks === "function") {
        video.srcObject.getTracks().forEach(t => t.stop());
    }
}

function loadLiveProctoringStats() {
    const mainList = getSeparateSheetSubmissions("main");
    const eliminatedList = readStore(PORTAL_CONFIG.eliminatedKey, []);

    const totalSubmitted = mainList.length;
    const scores = mainList.map(s => Number(s.score) || 0);
    const highestScore = (scores.length > 0) ? Math.max(...scores) : 0;
    const avgScore = (scores.length > 0) ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;
    const totalFlagged = mainList.filter(s => (s.tabWarnings || 0) > 0 || s.isForcedSubmission).length;

    const statsHtml = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
            <div class="p-3.5 bg-emerald-900 text-white rounded-2xl">
                <div class="text-[11px] text-emerald-200 font-bold">कुल जमा कॉपियाँ</div>
                <div class="text-2xl font-extrabold text-amber-300">${totalSubmitted}</div>
            </div>
            <div class="p-3.5 bg-emerald-800 text-white rounded-2xl">
                <div class="text-[11px] text-emerald-200 font-bold">उच्चतम प्राप्तांक (Highest)</div>
                <div class="text-2xl font-extrabold text-amber-300">${highestScore}</div>
            </div>
            <div class="p-3.5 bg-teal-900 text-white rounded-2xl">
                <div class="text-[11px] text-teal-200 font-bold">औसत अंक (Average)</div>
                <div class="text-2xl font-extrabold text-white">${avgScore}</div>
            </div>
            <div class="p-3.5 bg-red-900 text-white rounded-2xl">
                <div class="text-[11px] text-red-200 font-bold">संदिग्ध / टैब चेतावनी</div>
                <div class="text-2xl font-extrabold text-amber-300">${totalFlagged} (निष्कासित: ${eliminatedList.length})</div>
            </div>
        </div>
    `;

    let statsContainer = document.getElementById("liveProctoringStatsWidget");
    if (!statsContainer) {
        const folder1 = document.getElementById("studioFolderPanel1");
        if (folder1) {
            statsContainer = document.createElement("div");
            statsContainer.id = "liveProctoringStatsWidget";
            folder1.prepend(statsContainer);
        }
    }
    if (statsContainer) statsContainer.innerHTML = statsHtml;
    return { totalSubmitted, highestScore, avgScore, totalFlagged };
}

// --- 21. PARIKSHA HUB, STUDENT ENROLLMENT & VERCEL INTEGRATION ---
function renderParikshaHubIfIdle() {
    if (examRuntime && examRuntime.isActive) return;

    const parikshaContainer = document.getElementById("pariksha");
    if (!parikshaContainer || document.getElementById("parikshaMasterHubWrapper")) return;

    const cfg = getAdmitCardConfig();
    const wrapper = document.createElement("div");
    wrapper.id = "parikshaMasterHubWrapper";
    wrapper.className = "max-w-5xl mx-auto my-6 space-y-6 px-2";

    wrapper.innerHTML = `
        <div class="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-amber-400/50">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span class="px-3 py-1 bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-full uppercase tracking-wider">
                    🛡️ राष्ट्रीय जम्भवाणी एवं २९ नियम ज्ञान परीक्षा पोर्टल
                </span>
                <span id="examStartCountdownDisplay" class="px-4 py-1.5 bg-emerald-950/90 text-amber-300 font-mono font-extrabold text-xs md:text-sm rounded-xl border border-amber-400/40">
                    ⏳ परीक्षा समय गणना...
                </span>
            </div>
            <h2 class="text-2xl md:text-3xl font-extrabold text-amber-300 mb-2">${cfg.examTitle}</h2>
            <p class="text-emerald-100 text-xs md:text-sm mb-5">
                📅 परीक्षा तिथि: <strong>${cfg.examDate}</strong> | ⏰ समय: <strong>${cfg.examTime}</strong> | 📍 माध्यम: <strong>${cfg.venue}</strong>
            </p>
            <div class="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-emerald-700/60 mb-5">
                <label class="block text-xs font-extrabold text-amber-300 uppercase mb-2">
                    🔑 परीक्षा कक्ष प्रवेश हेतु अपना रोल नंबर व नाम दर्ज करें:
                </label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input id="hubRollNumberInput" type="text" placeholder="रोल नंबर (उदा. JAMBH-2026-1001)" class="px-4 py-3 rounded-xl text-gray-900 font-extrabold text-sm border-2 border-emerald-600 focus:outline-none" />
                    <input id="hubStudentNameInput" type="text" placeholder="परीक्षार्थी का पूरा नाम" class="px-4 py-3 rounded-xl text-gray-900 font-bold text-sm border-2 border-emerald-600 focus:outline-none" />
                    <input id="hubStudentDistrictInput" type="text" placeholder="जिला (उदा. हिसार / जोधपुर)" class="px-4 py-3 rounded-xl text-gray-900 font-bold text-sm border-2 border-emerald-600 focus:outline-none" />
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button id="enterExamHallMainBtn" onclick="triggerHubExamStart('main')" class="py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2">
                    🛡️ मुख्य परीक्षा कक्ष में प्रवेश करें
                </button>
                <button onclick="triggerHubExamStart('mock1')" class="py-3.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-2xl shadow border border-emerald-500 transition">
                    📝 मॉक टेस्ट १ (अभ्यास परीक्षा)
                </button>
                <button onclick="triggerHubExamStart('mock2')" class="py-3.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow border border-emerald-600 transition">
                    📘 मॉक टेस्ट २ (मॉडल पेपर)
                </button>
                <button onclick="triggerHubExamStart('daily')" class="py-3.5 px-4 bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-sm rounded-2xl shadow border border-teal-400 transition">
                    ⚡ दैनिक प्रश्नोत्तरी (Daily Quiz)
                </button>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-emerald-800/80 text-xs">
                <button onclick="downloadOfflineEncryptedExamPacket()" class="px-4 py-2 bg-emerald-950 text-amber-300 font-bold rounded-xl border border-amber-400/40 hover:bg-emerald-900">
                    📶 कम नेटवर्क हेतु ऑफलाइन परीक्षा पैकेट डाउनलोड करें (.bpk)
                </button>
                <div class="flex items-center gap-2">
                    <input id="VerifyRollResultInput" type="text" placeholder="रोल नंबर से परिणाम खोजें..." class="px-3 py-2 rounded-xl text-gray-900 font-bold text-xs" />
                    <button onclick="checkStudentResultByRollNumber()" class="px-4 py-2 bg-amber-400 text-emerald-950 font-extrabold rounded-xl hover:bg-amber-300">
                        🎓 परिणाम व प्रमाण-पत्र देखें
                    </button>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-3xl p-6 shadow-xl border-2 border-emerald-800/20">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-200">
                <div>
                    <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-extrabold text-xs rounded-lg">नया पंजीकरण (New Registration)</span>
                    <h3 class="text-lg md:text-xl font-extrabold text-gray-900 mt-1">🎫 परीक्षा नामांकन एवं फोटोयुक्त राष्ट्रीय प्रवेश-पत्र (Admit Card)</h3>
                </div>
                <span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">✓ QR सत्यापन एवं पासपोर्ट फोटो सहित</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">परीक्षार्थी का नाम *</label>
                    <input id="enrollStudentName" type="text" placeholder="अपना पूरा नाम लिखें" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-900" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">पिता / अभिभावक का नाम *</label>
                    <input id="enrollFatherName" type="text" placeholder="पिताजी का नाम" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-900" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">जिला (District) *</label>
                    <input id="enrollDistrict" type="text" placeholder="उदा. हिसार / बीकानेर" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-900" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">मोबाइल नंबर</label>
                    <input id="enrollMobile" type="tel" placeholder="10 अंकों का नंबर" class="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-900" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-emerald-900 mb-1">📸 पासपोर्ट फोटो अपलोड *</label>
                    <input id="enrollPhotoFile" type="file" accept="image/*" class="w-full text-xs font-semibold text-gray-700 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-100 file:text-emerald-950 hover:file:bg-emerald-200" />
                </div>
            </div>
            <div class="mt-4 flex flex-wrap justify-between items-center gap-3">
                <p class="text-xs text-gray-600 font-medium">📌 नोट: नामांकन करते ही आपका यूनिक रोल नंबर और QR कोड वाला आधिकारिक प्रवेश-पत्र तुरंत जनरेट हो जाएगा।</p>
                <button onclick="handleHubStudentEnrollmentSubmit()" class="px-6 py-3 bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-extrabold text-sm rounded-2xl shadow-lg transition">
                    🎫 नामांकन करें व प्रवेश-पत्र डाउनलोड करें (Download Admit Card)
                </button>
            </div>
        </div>

        <div class="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
            <div class="flex justify-between items-center mb-3">
                <h3 class="font-extrabold text-lg text-gray-900">⭐ सहेजे गए महत्वपूर्ण प्रश्न (Saved Bookmarks & Revision Hub)</h3>
                <button onclick="renderClearBookmarksInProfile('profileBookmarksContainer')" class="text-xs font-bold text-emerald-800 underline">ताज़ा करें ⟳</button>
            </div>
            <div id="profileBookmarksContainer"></div>
        </div>
    `;

    parikshaContainer.prepend(wrapper);
    renderClearBookmarksInProfile("profileBookmarksContainer");
}

function triggerHubExamStart(examType) {
    const roll = valOr(document.getElementById("hubRollNumberInput")?.value, "").trim().toUpperCase();
    const name = valOr(document.getElementById("hubStudentNameInput")?.value, "परीक्षार्थी").trim();
    const dist = valOr(document.getElementById("hubStudentDistrictInput")?.value, "हिसार").trim();

    if (!roll) {
        const promptedRoll = prompt("कृपया अपना रोल नंबर दर्ज करें (उदा. JAMBH-2026-1001):");
        if (!promptedRoll) return;
        startPortalExamSession(examType, promptedRoll, name, dist);
    } else {
        startPortalExamSession(examType, roll, name, dist);
    }
}

function handleHubStudentEnrollmentSubmit() {
    const name = valOr(document.getElementById("enrollStudentName")?.value, "");
    const father = valOr(document.getElementById("enrollFatherName")?.value, "");
    const district = valOr(document.getElementById("enrollDistrict")?.value, "");
    const mobile = valOr(document.getElementById("enrollMobile")?.value, "");
    enrollStudentWithPhotoAndGenerateAdmitCard(name, father, district, mobile, "enrollPhotoFile");
}

function checkStudentResultByRollNumber() {
    const rollInput = valOr(document.getElementById("VerifyRollResultInput")?.value, prompt("अपना रोल नंबर दर्ज करें:")).trim().toUpperCase();
    if (!rollInput) return;

    const allTypes = ["main", "mock1", "mock2", "daily"];
    for (const t of allTypes) {
        const sheet = getSeparateSheetSubmissions(t);
        const found = sheet.find(s => s.rollNumber.toUpperCase() === rollInput);
        if (found) {
            openOfficialMarksheetAndCertificatePrintWindowByRoll(found.rollNumber, t);
            return;
        }
    }
    alert(`रोल नंबर ${rollInput} का परिणाम अभी किसी भी परीक्षा शीट में उपलब्ध नहीं है।`);
}

function openOfficialMarksheetAndCertificatePrintWindowByRoll(rollNumber, examType) {
    const sheet = getSeparateSheetSubmissions(examType);
    const found = sheet.find(s => s.rollNumber.toUpperCase() === rollNumber.toUpperCase());
    if (!found) {
        alert("परिणाम रिकॉर्ड नहीं मिला।");
        return;
    }
    openOfficialMarksheetAndCertificatePrintWindow(found, examType);
}

function openOfficialMarksheetAndCertificatePrintWindow(record, examType) {
    const win = window.open("", "_blank", "width=900,height=1050");
    if (!win) return;
    win.document.write(`
        <!DOCTYPE html>
        <html lang="hi">
        <head><meta charset="UTF-8"><title>अंक-तालिका एवं गौरव प्रमाण-पत्र - ${record.rollNumber}</title></head>
        <body style="font-family:'Noto Sans Devanagari',Arial,sans-serif;background:#f3f4f6;padding:18px;color:#111827;">
            <div style="max-width:780px;margin:0 auto;background:#fffbeb;border:6px double #064e3b;padding:28px;border-radius:16px;">
                <div style="text-align:center;border-bottom:2px solid #064e3b;padding-bottom:12px;margin-bottom:18px;">
                    <div style="font-size:12px;font-weight:800;color:#b45309;">॥ श्री गुरु जम्भेश्वराय नमः ॥</div>
                    <h1 style="color:#064e3b;font-size:22px;margin:6px 0;font-weight:800;">अखिल भारतीय विश्नोई जम्भवाणी परीक्षा — आधिकारिक अंक-तालिका</h1>
                    <div style="font-size:13px;font-weight:700;color:#374151;">परीक्षा श्रेणी: ${examType.toUpperCase()} • वरीयता रैंक: #${record.rank || 1}</div>
                </div>
                <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fff;">
                    <tr><th style="border:1px solid #064e3b;padding:10px;background:#064e3b;color:#fde68a;width:38%;">रोल नंबर</th><td style="border:1px solid #064e3b;padding:10px;"><strong>${record.rollNumber}</strong></td></tr>
                    <tr><th style="border:1px solid #064e3b;padding:10px;background:#064e3b;color:#fde68a;">परीक्षार्थी का नाम</th><td style="border:1px solid #064e3b;padding:10px;"><strong>${record.studentName}</strong></td></tr>
                    <tr><th style="border:1px solid #064e3b;padding:10px;background:#064e3b;color:#fde68a;">जिला</th><td style="border:1px solid #064e3b;padding:10px;">${record.district}</td></tr>
                    <tr><th style="border:1px solid #064e3b;padding:10px;background:#064e3b;color:#fde68a;">कुल प्राप्तांक</th><td style="border:1px solid #064e3b;padding:10px;font-size:16px;font-weight:800;color:#064e3b;">${record.score} अंक (Rank #${record.rank || 1})</td></tr>
                    <tr><th style="border:1px solid #064e3b;padding:10px;background:#064e3b;color:#fde68a;">सही / गलत</th><td style="border:1px solid #064e3b;padding:10px;">सही: ${record.correctCount} | गलत: ${record.wrongCount}</td></tr>
                </table>
                <div style="margin-top:22px;padding:20px;border:2px dashed #b45309;border-radius:12px;text-align:center;background:#fff;">
                    <h2 style="color:#064e3b;font-size:20px;margin:4px 0;">🏆 आधिकारिक योग्यता एवं सम्मान प्रमाण-पत्र</h2>
                    <p style="font-size:14px;line-height:1.7;margin:10px 0;">प्रमाणित किया जाता है कि <strong>${record.studentName}</strong> ने ${examType.toUpperCase()} परीक्षा में उत्कृष्ट प्रदर्शन किया है।</p>
                </div>
                <div style="text-align:center;margin-top:20px;" class="no-print">
                    <button onclick="window.print()" style="background:#064e3b;color:#fde68a;border:none;padding:10px 24px;border-radius:8px;font-weight:800;cursor:pointer;">🖨️ प्रिंट / PDF सेव करें</button>
                </div>
            </div>
        </body>
        </html>
    `);
    win.document.close();
}

function injectSingleBoxDirectlyIntoVercelSection() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("section, div").forEach(sec => {
        const text = valOr(sec.innerText, "").toLowerCase();
        if (text.includes("bishnoi.vercel.app") && !sec.querySelector("#onPageVercelSingleBox") && sec.id !== "ownerStudioFiveFolderMaster") {
            sec.querySelectorAll("i, svg, .icon-grid, .cluttered-icons").forEach(el => el.remove());

            const box = document.createElement("div");
            box.id = "onPageVercelSingleBox";
            box.className = "mt-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-300";
            box.innerHTML = `
                <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <span class="font-extrabold text-xs text-emerald-950">🌐 bishnoi.vercel.app एकीकृत सिंगल-बॉक्स विवरण:</span>
                    <button onclick="promptOwnerQuickVercelPaste()" class="px-3 py-1 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-lg">✏️ सिंगल-बॉक्स में विवरण पेस्ट करें (Owner)</button>
                </div>
                <div id="onPageVercelItemsDisplay" class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"></div>
            `;
            sec.appendChild(box);
        }
    });
    refreshOnPageVercelItems();
}

function promptOwnerQuickVercelPaste() {
    verifyOwnerSecretPin(() => {
        const raw = prompt("🌐 bishnoi.vercel.app एवं एडमिट कार्ड हेतु सिंगल-बॉक्स विवरण पेस्ट करें\n(प्रारूप: शीर्षक | विवरण | स्थान/लिंक):", "मुख्य परीक्षा केंद्र | ऑनलाइन पोर्टल bishnoi.vercel.app | संपूर्ण भारत");
        if (!raw) return;
        const items = raw.split("\n").map(l => l.trim()).filter(Boolean).map(line => {
            const p = line.split("|").map(s => s.trim());
            return { title: valOr(p[0], "विवरण"), detail: valOr(p[1], ""), extra: valOr(p[2], "") };
        });
        writeStore("bishnoi_external_portal_items_v5", items);
        refreshOnPageVercelItems();
        renderExternalPortalPreviewUI();
        showToast("✅ सिंगल-बॉक्स विवरण वेबसाइट एवं एडमिट कार्ड PDF दोनों के लिए अपडेट हो गया!");
    });
}

function refreshOnPageVercelItems() {
    if (typeof document === "undefined") return;
    const items = readStore("bishnoi_external_portal_items_v5", []);
    document.querySelectorAll("#onPageVercelItemsDisplay").forEach(el => {
        if (items.length === 0) {
            el.innerHTML = `<div class="text-gray-600 font-semibold">कोई अतिरिक्त पोर्टल विवरण दर्ज नहीं है।</div>`;
        } else {
            el.innerHTML = items.map(it => {
                const extraSpan = it.extra ? `<span class="text-amber-800 font-bold">(${it.extra})</span>` : "";
                return `<div class="p-2.5 bg-white rounded-xl border border-emerald-200"><strong class="text-emerald-950">${it.title}:</strong> ${it.detail} ${extraSpan}</div>`;
            }).join("");
        }
    });
}

// --- 22. COMPLETE STUDENT PROFILE DASHBOARD ---
function renderCompleteStudentProfileDashboard() {
    if (typeof document === "undefined") return;
    const profileSec = document.getElementById("profile");
    if (!profileSec) return;

    let dash = document.getElementById("studentCompleteProfileMaster");
    if (!dash) {
        dash = document.createElement("div");
        dash.id = "studentCompleteProfileMaster";
        dash.className = "max-w-5xl mx-auto my-6 space-y-6 px-2";
        profileSec.prepend(dash);
    }

    const currentStudent = readStore("bishnoi_current_active_student", null);
    const enrollments = readStore(PORTAL_CONFIG.enrollmentsKey, []);
    const student = currentStudent || (enrollments.length > 0 ? enrollments[enrollments.length - 1] : null);

    const streak = parseInt(valOr(localStorage.getItem("bishnoi_jaap_streak_days"), "0"), 10);
    const totalMalas = parseInt(valOr(localStorage.getItem("bishnoi_total_completed_malas"), "0"), 10);
    const totalBeads = parseInt(valOr(localStorage.getItem("bishnoi_jaap_total_beads"), "0"), 10);

    // Get submission history across tests
    const allTypes = ["main", "mock1", "mock2", "daily"];
    let attemptCardsHtml = "";

    if (student) {
        allTypes.forEach(t => {
            const list = getSeparateSheetSubmissions(t);
            const found = list.find(s => s.rollNumber.toUpperCase() === student.rollNumber.toUpperCase());
            if (found) {
                attemptCardsHtml += `
                    <div class="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-wrap justify-between items-center gap-2">
                        <div>
                            <span class="font-extrabold text-xs text-emerald-950 uppercase">${t} परीक्षा</span>
                            <div class="font-bold text-sm text-gray-900">स्कोर: ${found.score} | रैंक: #${found.rank || 1}</div>
                            <span class="text-[11px] text-gray-600">${found.submittedAt}</span>
                        </div>
                        <button onclick="openOfficialMarksheetAndCertificatePrintWindowByRoll('${found.rollNumber}', '${t}')" class="px-3 py-1.5 bg-amber-500 text-emerald-950 font-bold text-xs rounded-xl shadow">
                            📜 अंक-तालिका देखें
                        </button>
                    </div>
                `;
            }
        });
    }

    if (!attemptCardsHtml) {
        attemptCardsHtml = `<div class="p-4 bg-gray-50 rounded-xl text-xs text-gray-600 text-center font-bold">अभी तक कोई परीक्षा परिणाम दर्ज नहीं है। परीक्षा हब से टेस्ट दें।</div>`;
    }

    dash.innerHTML = `
        <div class="bg-white rounded-3xl p-6 shadow-xl border-2 border-emerald-800/30">
            <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div class="flex items-center gap-4">
                    <img src="${student ? student.photoDataUrl : createDefaultAvatarSVG('साधक')}" alt="Avatar" class="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-700 shadow" />
                    <div>
                        <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 font-bold text-xs rounded-full">साधक प्रोफ़ाइल (Student Dashboard)</span>
                        <h2 class="text-xl md:text-2xl font-extrabold text-gray-900 mt-1">${student ? student.name : "अतिथि साधक"}</h2>
                        <p class="text-xs text-gray-600 font-semibold">${student ? `रोल नंबर: ${student.rollNumber} | जिला: ${student.district}` : "परीक्षा हेतु पंजीकरण करें या रोल नंबर खोजें"}</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${student ? `<button onclick="openNationalStandardAdmitCardPrintWindow(${JSON.stringify(student).replace(/"/g, '&quot;')})" class="px-4 py-2 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl shadow">🎫 प्रवेश-पत्र डाउनलोड करें</button>` : ""}
                    <button onclick="promptStudentProfileRollSearch()" class="px-4 py-2 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-xl shadow">🔍 रोल नंबर से प्रोफ़ाइल लोड करें</button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <div class="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-300">
                    <span class="text-xs font-extrabold text-amber-900">🔥 साधना स्ट्रीक</span>
                    <div class="text-2xl font-extrabold text-amber-950 mt-1">${streak} दिन निरंतर</div>
                    <span class="text-[11px] font-semibold text-amber-800">कुल मालाएं: ${totalMalas} (${totalBeads} मनके)</span>
                </div>
                <div class="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-300">
                    <span class="text-xs font-extrabold text-emerald-900">🌿 हरित प्रहरी स्थिति</span>
                    <div class="text-2xl font-extrabold text-emerald-950 mt-1">सक्रिय सदस्य ✓</div>
                    <span class="text-[11px] font-semibold text-emerald-800">२९ नियम अध्येता</span>
                </div>
                <div class="p-4 bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-2xl border border-teal-300">
                    <span class="text-xs font-extrabold text-teal-900">⭐ सहेजे गए प्रश्न</span>
                    <div class="text-2xl font-extrabold text-teal-950 mt-1">${readStore(PORTAL_CONFIG.bookmarksKey, []).length} प्रश्न</div>
                    <span class="text-[11px] font-semibold text-teal-800">पुनरीक्षण हेतु सुरक्षित</span>
                </div>
            </div>

            <div class="space-y-3">
                <h3 class="font-extrabold text-base text-gray-900">📜 परीक्षा इतिहास एवं प्राप्तांक (My Exam History):</h3>
                ${attemptCardsHtml}
            </div>

            <div class="mt-6 pt-4 border-t border-gray-200">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-extrabold text-base text-gray-900">⭐ सहेजे गए प्रश्न संग्रह (Revision Bookmarks):</h3>
                    <button onclick="renderClearBookmarksInProfile('profileDedicatedBookmarksBox')" class="text-xs font-bold text-emerald-800 underline">ताज़ा करें ⟳</button>
                </div>
                <div id="profileDedicatedBookmarksBox"></div>
            </div>
        </div>
    `;

    renderClearBookmarksInProfile("profileDedicatedBookmarksBox");
}

function promptStudentProfileRollSearch() {
    const roll = prompt("अपना पंजीकृत रोल नंबर दर्ज करें (उदा. JAMBH-2026-1001):");
    if (!roll) return;
    const clean = roll.trim().toUpperCase();
    const enrollments = readStore(PORTAL_CONFIG.enrollmentsKey, []);
    const found = enrollments.find(e => e.rollNumber.toUpperCase() === clean);
    if (found) {
        writeStore("bishnoi_current_active_student", found);
        renderCompleteStudentProfileDashboard();
        showToast(`👤 साधक प्रोफ़ाइल (${found.name}) लोड हो गई!`);
    } else {
        alert(`रोल नंबर ${clean} का पंजीकरण रिकॉर्ड नहीं मिला। कृपया पहले परीक्षा हब से नामांकन करें।`);
    }
}

// --- 23. OWNER ADMIN STUDIO (5 FOLDERS) & CONTROL CENTER ---
function renderOwnerAdminStudioCompleteUI() {
    if (typeof document === "undefined") return;
    const studioTarget = document.getElementById("prabandhan") || document.getElementById("ownerStudioSection") || document.getElementById("adminStudioContainer");
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
                <h2 class="text-xl md:text-2xl font-extrabold text-amber-300 mt-1">🏛️ ५-फ़ोल्डर स्मार्ट परीक्षा एवं पोर्टल प्रबंधन स्टूडियो</h2>
            </div>
            <div class="flex flex-wrap gap-2">
                <button onclick="changeOwnerSecretPinModal()" class="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-amber-200 font-bold text-xs rounded-xl border border-emerald-600">🔐 सुरक्षा पिन बदलें</button>
                <button onclick="setAuthorizedDelegatePinModal()" class="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl">🔑 डेलिगेट पिन सेट करें</button>
                <button onclick="exportAutoRankedExcelSheet('main')" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold text-xs rounded-xl shadow">📊 मुख्य मेरिट Excel डाउनलोड</button>
            </div>
        </div>
        <div class="bg-emerald-50 p-3 flex flex-wrap gap-2 border-b border-emerald-200">
            <button onclick="switchOwnerStudioFolder(1)" id="studioTabBtn1" class="px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-emerald-900 text-amber-300 shadow">📁 १. परीक्षा नियंत्रण, शीट्स व टर्मिनेशन</button>
            <button onclick="switchOwnerStudioFolder(2)" id="studioTabBtn2" class="px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-white text-emerald-950 border border-emerald-200">📁 २. बल्क प्रश्न बैंक (अलग-अलग परीक्षा)</button>
            <button onclick="switchOwnerStudioFolder(3)" id="studioTabBtn3" class="px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-white text-emerald-950 border border-emerald-200">📁 ३. सिंगल-बॉक्स प्रवेश-पत्र इनपुट</button>
            <button onclick="switchOwnerStudioFolder(4)" id="studioTabBtn4" class="px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-white text-emerald-950 border border-emerald-200">📁 ४. मैनुअल कॉपी चेकिंग व टेलीमेट्री</button>
            <button onclick="switchOwnerStudioFolder(5)" id="studioTabBtn5" class="px-4 py-2.5 rounded-xl font-extrabold text-xs md:text-sm bg-white text-emerald-950 border border-emerald-200">📁 ५. मेंटेनेंस मोड व ब्रॉडकास्ट</button>
        </div>
        <div class="p-6">
            <!-- FOLDER 1 -->
            <div id="studioFolderPanel1" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                        <h3 class="font-extrabold text-base text-emerald-950 mb-1">📊 अलग-अलग ऑटो-रैंक्ड Excel (.xlsx) एवं PDF रिपोर्ट्स</h3>
                        <p class="text-xs text-gray-600 mb-4">रैंक सहित अलग-अलग फाइलें डाउनलोड करें:</p>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <button onclick="exportAutoRankedExcelSheet('main')" class="p-2.5 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl hover:bg-emerald-950">📥 मुख्य परीक्षा मेरिट (.xlsx)</button>
                            <button onclick="exportAutoRankedExcelSheet('mock1')" class="p-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl">📥 मॉक टेस्ट १ (.xlsx)</button>
                            <button onclick="exportAutoRankedExcelSheet('mock2')" class="p-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl">📥 मॉक टेस्ट २ (.xlsx)</button>
                            <button onclick="exportAutoRankedExcelSheet('daily')" class="p-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl">📥 दैनिक क्विज़ (.xlsx)</button>
                            <button onclick="exportAutoRankedExcelSheet('enrolled')" class="p-2.5 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-xl">📥 नामांकित सूची (.xlsx)</button>
                            <button onclick="announceDailyQuizWinners()" class="p-2.5 bg-purple-800 text-white font-extrabold text-xs rounded-xl">🏆 दैनिक विजेता घोषित करें</button>
                        </div>
                        <div class="mt-4 pt-3 border-t flex flex-wrap gap-2">
                            <button onclick="exportStandardFormattedOwnerPDF('main')" class="px-3 py-2 bg-emerald-950 text-amber-300 font-extrabold text-xs rounded-xl">🖨️ मेरिट PDF</button>
                            <button onclick="exportStandardFormattedOwnerPDF('enrolled')" class="px-3 py-2 bg-emerald-800 text-white font-bold text-xs rounded-xl">🖨️ नामांकित PDF</button>
                            <button onclick="exportStandardFormattedOwnerPDF('members7day')" class="px-3 py-2 bg-teal-800 text-white font-bold text-xs rounded-xl">🖨️ ७ दिवसीय सदस्य PDF</button>
                            <button onclick="exportSevenDayMembersExcel()" class="px-3 py-2 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-xl">📥 ७ दिवसीय सदस्य Excel</button>
                        </div>
                    </div>
                    <div class="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-4">
                        <div>
                            <h3 class="font-extrabold text-base text-amber-950 mb-1">🔓 ५-मिनट लेट एंट्री अनुमति (Owner Late Entry Override)</h3>
                            <div class="flex gap-2">
                                <input id="studioLateRollInput" type="text" placeholder="रोल नंबर (JAMBH-2026-...)" class="flex-1 px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-gray-900" />
                                <button onclick="grantOwnerLateEntryOverride(document.getElementById('studioLateRollInput').value)" class="px-4 py-2 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-xl">प्रवेश दें ✓</button>
                            </div>
                        </div>
                        <div class="pt-3 border-t border-amber-200">
                            <h3 class="font-extrabold text-base text-red-900 mb-1">⏳ निष्कासित छात्र को 'दूसरा मौका (Re-Chance)' दें</h3>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input id="studioReChanceRoll" type="text" placeholder="रोल नंबर" class="px-3 py-2 rounded-xl border border-red-200 text-xs font-bold text-gray-900" />
                                <input id="studioReChanceMins" type="number" placeholder="मिनट" value="25" class="px-3 py-2 rounded-xl border border-red-200 text-xs font-bold text-gray-900" />
                                <button onclick="grantCustomReChanceToStudent()" class="px-3 py-2 bg-red-700 text-white font-extrabold text-xs rounded-xl">दूसरा मौका दें ⟳</button>
                            </div>
                        </div>
                        <div class="pt-3 border-t border-amber-200">
                            <h4 class="font-extrabold text-xs text-red-950 mb-1">🚫 लाइव छात्र सेशन टर्मिनेट करें</h4>
                            <div class="flex gap-2">
                                <input id="terminateTargetRollInput" type="text" placeholder="रोल नंबर" class="flex-1 px-3 py-2 rounded-xl border border-red-300 text-xs font-bold text-gray-900" />
                                <button onclick="ownerTerminateStudentSessionForCheating()" class="px-3 py-2 bg-red-800 text-white font-extrabold text-xs rounded-xl">टर्मिनेट ✕</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="liveProctoringStatsWidget"></div>
                <div class="p-5 bg-white rounded-2xl border border-gray-200">
                    <div class="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <h4 class="font-extrabold text-sm text-gray-900">📈 लाइव ऑटो-रैंक्ड वरीयता तालिका (उच्चतम से न्यूनतम अंक)</h4>
                        <select id="liveRankTableSheetFilter" onchange="renderLiveAutoRankedPreviewTable(this.value)" class="px-3 py-1.5 rounded-xl border text-xs font-bold text-gray-900">
                            <option value="main">मुख्य परीक्षा (Main Exam)</option>
                            <option value="mock1">मॉक टेस्ट १</option>
                            <option value="mock2">मॉक टेस्ट २</option>
                            <option value="daily">दैनिक प्रश्नोत्तरी (Daily Quiz)</option>
                        </select>
                    </div>
                    <div id="liveAutoRankedTableBody" class="overflow-x-auto"></div>
                </div>
            </div>

            <!-- FOLDER 2 -->
            <div id="studioFolderPanel2" class="hidden space-y-6">
                <div class="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                    <h3 class="font-extrabold text-base text-gray-900 mb-2">⚖️ सेक्शनल वेटेज एवं नेगेटिव मार्किंग नियम</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                        <div><label class="block text-xs font-bold text-gray-700">खंड A सही (+)</label><input id="secAPlus" type="number" step="0.5" value="${weights.A?.plus || 2}" class="w-full px-3 py-2 rounded-xl border text-sm font-bold text-gray-900" /></div>
                        <div><label class="block text-xs font-bold text-gray-700">खंड A नेगेटिव (-)</label><input id="secAMinus" type="number" step="0.25" value="${weights.A?.minus || 0.5}" class="w-full px-3 py-2 rounded-xl border text-sm font-bold text-gray-900" /></div>
                        <div><label class="block text-xs font-bold text-gray-700">खंड B सही (+)</label><input id="secBPlus" type="number" step="0.5" value="${weights.B?.plus || 4}" class="w-full px-3 py-2 rounded-xl border text-sm font-bold text-gray-900" /></div>
                        <div><label class="block text-xs font-bold text-gray-700">खंड B नेगेटिव (-)</label><input id="secBMinus" type="number" step="0.25" value="${weights.B?.minus || 1}" class="w-full px-3 py-2 rounded-xl border text-sm font-bold text-gray-900" /></div>
                    </div>
                    <button onclick="saveSectionalMarkingConfig()" class="mt-3 px-5 py-2 bg-emerald-800 text-white font-extrabold text-xs rounded-xl">💾 सेक्शनल मार्किंग नियम सहेजें</button>
                </div>
                <div class="p-5 bg-white rounded-2xl border-2 border-emerald-700/30">
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <label class="text-xs font-extrabold text-emerald-950">🎯 किस परीक्षा हेतु प्रश्न-बैंक अपलोड करना चाहते हैं?</label>
                        <select id="bulkExamTypeTargetSelect" class="px-3 py-1.5 rounded-xl border border-emerald-600 text-xs font-extrabold text-gray-900 bg-white">
                            <option value="main">मुख्य परीक्षा (Main Exam Question Bank)</option>
                            <option value="mock1">मॉक टेस्ट १ (Mock Test 1)</option>
                            <option value="mock2">मॉक टेस्ट २ (Mock Test 2)</option>
                            <option value="daily">दैनिक प्रश्नोत्तरी (Daily Quiz)</option>
                        </select>
                    </div>
                    <textarea id="bulkQuestionBankTextarea" rows="6" placeholder="प्रश्न | विकल्प A | विकल्प B | विकल्प C | विकल्प D | सही विकल्प (1-4) | खंड (A/B) | विषय" class="w-full p-3.5 rounded-2xl border border-gray-300 font-mono text-xs text-gray-900"></textarea>
                    <div id="bulkQuestionValidatorFeedback" class="my-2 text-xs font-bold"></div>
                    <div class="flex flex-wrap gap-3 mt-3">
                        <button onclick="validateBulkQuestionBankInput()" class="px-5 py-2.5 bg-amber-100 text-amber-950 border border-amber-400 font-extrabold text-xs rounded-xl">🔍 फॉर्मेट जाँचें</button>
                        <button onclick="uploadValidatedBulkQuestionBank()" class="px-6 py-2.5 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl shadow">🚀 प्रश्न बैंक पब्लिश करें</button>
                    </div>
                </div>
            </div>

            <!-- FOLDER 3 -->
            <div id="studioFolderPanel3" class="hidden space-y-6">
                <div class="p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <h3 class="font-extrabold text-base text-emerald-950 mb-1">🎫 सिंगल-बॉक्स प्रवेश-पत्र कस्टमाइज़र</h3>
                    <textarea id="singleBoxAdmitConfigInput" rows="3" class="w-full p-3 rounded-xl border border-emerald-300 text-xs font-semibold text-gray-900">${singleBoxDefault}</textarea>
                    <button onclick="saveSingleBoxAdmitCardConfig(document.getElementById('singleBoxAdmitConfigInput').value)" class="mt-3 px-6 py-2.5 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl shadow">✅ प्रवेश-पत्र अपडेट करें</button>
                </div>
                <div class="p-5 bg-white rounded-2xl border border-gray-200">
                    <h3 class="font-extrabold text-base text-gray-900 mb-1">🌐 बाहरी पोर्टल (bishnoi.vercel.app) सिंगल-बॉक्स डेटा इनपुट</h3>
                    <textarea id="externalPortalSingleBoxTextarea" rows="4" placeholder="शीर्षक | विवरण | लिंक या स्थान" class="w-full p-3 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900"></textarea>
                    <button onclick="saveExternalPortalSingleBoxData()" class="mt-3 px-5 py-2.5 bg-emerald-800 text-white font-extrabold text-xs rounded-xl">📥 डेटा अपडेट करें</button>
                    <div id="externalPortalSavedPreview" class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2"></div>
                </div>
            </div>

            <!-- FOLDER 4 -->
            <div id="studioFolderPanel4" class="hidden space-y-6">
                <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                    <span class="text-xs font-extrabold text-emerald-950">👥 मूल्यांकनकर्ता (Delegate) एवं परिणाम घोषणा:</span>
                    <div class="flex flex-wrap gap-2">
                        <button onclick="toggleMainExamResultDeclaration()" class="px-4 py-2 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-xl shadow">📢 मुख्य परीक्षा परिणाम घोषित (Publish) करें</button>
                    </div>
                </div>
                <div class="p-5 bg-amber-50/60 rounded-2xl border border-amber-200">
                    <h3 class="font-extrabold text-base text-amber-950 mb-1">📝 मैनुअल उत्तर पुस्तिका निरीक्षण एवं अंक अनुमोदन</h3>
                    <div class="flex flex-wrap gap-2">
                        <input id="manualEvalRollInput" type="text" placeholder="रोल नंबर दर्ज करें" class="flex-1 px-3.5 py-2 rounded-xl border border-amber-300 text-xs font-bold text-gray-900" />
                        <select id="manualEvalSheetSelect" class="px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-gray-900">
                            <option value="main">मुख्य परीक्षा</option>
                            <option value="mock1">मॉक टेस्ट १</option>
                            <option value="mock2">मॉक टेस्ट २</option>
                            <option value="daily">दैनिक क्विज़</option>
                        </select>
                        <button onclick="openDetailedManualEvaluationViewer()" class="px-5 py-2 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl">🔍 कॉपी जाँचें</button>
                    </div>
                    <div id="manualEvalDetailedBox" class="mt-4"></div>
                </div>
                <div class="p-5 bg-white rounded-2xl border border-gray-200">
                    <h3 class="font-extrabold text-base text-gray-900 mb-3">🗺️ जिला-वार भागीदारी टेलीमेट्री हीटमैप</h3>
                    <div id="districtTelemetryHeatmapGrid" class="grid grid-cols-2 sm:grid-cols-4 gap-3"></div>
                </div>
            </div>

            <!-- FOLDER 5 -->
            <div id="studioFolderPanel5" class="hidden space-y-6">
                <div class="p-5 bg-red-50/70 rounded-2xl border border-red-200">
                    <h3 class="font-extrabold text-base text-red-950 mb-2">🛠️ कस्टम पोर्टल मेंटेनेंस मोड</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <input id="maintTitleInput" type="text" placeholder="शीर्षक" value="विश्नोई समाज डिजिटल पोर्टल रखरखाव" class="px-3 py-2 rounded-xl border text-xs font-bold text-gray-900" />
                        <input id="maintEtaInput" type="text" placeholder="अनुमानित समय" value="शीघ्र प्रारंभ" class="px-3 py-2 rounded-xl border text-xs font-bold text-gray-900" />
                        <input id="maintMsgInput" type="text" placeholder="संदेश" value="पोर्टल पर तकनीकी उन्नयन कार्य चल रहा है।" class="px-3 py-2 rounded-xl border text-xs font-bold text-gray-900" />
                    </div>
                    <div class="flex gap-3">
                        <button onclick="setPortalMaintenanceState(true)" class="px-5 py-2.5 bg-red-700 text-white font-extrabold text-xs rounded-xl">🔒 मेंटेनेंस चालू करें</button>
                        <button onclick="setPortalMaintenanceState(false)" class="px-5 py-2.5 bg-emerald-700 text-white font-extrabold text-xs rounded-xl">🟢 पोर्टल चालू करें</button>
                    </div>
                </div>
                <div class="p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <h3 class="font-extrabold text-base text-emerald-950 mb-2">🔔 ऐप पुश नोटिफिकेशन प्रसारक</h3>
                    <div class="flex gap-2">
                        <input id="ownerBroadcastMsgInput" type="text" placeholder="सभी छात्रों के लिए तत्काल सूचना..." class="flex-1 px-3.5 py-2 rounded-xl border border-emerald-300 text-xs font-bold text-gray-900" />
                        <button onclick="sendOwnerBroadcastNotification()" class="px-5 py-2 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-xl">📢 सूचना भेजें</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    studioTarget.appendChild(studioBox);
    renderDistrictTelemetryUI();
    upgradeTelemetryWithDistrictStateFilter();
    renderExternalPortalPreviewUI();
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
    if (folderNum === 4) {
        renderDistrictTelemetryUI();
        upgradeTelemetryWithDistrictStateFilter();
    }
}

function grantCustomReChanceToStudent() {
    verifyOwnerSecretPin(() => {
        const roll = valOr(document.getElementById("studioReChanceRoll")?.value, "").trim().toUpperCase();
        const mins = parseInt(valOr(document.getElementById("studioReChanceMins")?.value, "25"), 10);
        if (!roll) {
            alert("कृपया छात्र का रोल नंबर दर्ज करें!");
            return;
        }
        const map = readStore(PORTAL_CONFIG.reChanceKey, {});
        map[roll] = { granted: true, minutes: mins, grantedAt: Date.now() };
        writeStore(PORTAL_CONFIG.reChanceKey, map);
        pushPortalNotification(`⏳ रोल नंबर ${roll} को ${mins} मिनट के साथ परीक्षा का दूसरा अवसर (Re-Chance) प्रदान किया गया है।`);
        showToast(`✅ रोल नंबर ${roll} को ${mins} मिनट के लिए पुनः परीक्षा अनुमति दे दी गई है!`);
    });
}

function grantOwnerLateEntryOverride(rollNumberInput) {
    verifyOwnerSecretPin(() => {
        const cleanRoll = valOr(rollNumberInput, prompt("लेट एंट्री अनुमति देने के लिए छात्र का रोल नंबर दर्ज करें:")).trim().toUpperCase();
        if (!cleanRoll) return;
        const list = readStore(PORTAL_CONFIG.lateExceptionsKey, []);
        if (!list.includes(cleanRoll)) list.push(cleanRoll);
        writeStore(PORTAL_CONFIG.lateExceptionsKey, list);
        showToast(`✅ रोल नंबर ${cleanRoll} को परीक्षा कक्ष में प्रवेश की विशेष अनुमति दे दी गई है!`);
    });
}

function ownerTerminateStudentSessionForCheating() {
    verifyOwnerSecretPin(() => {
        const roll = valOr(document.getElementById("terminateTargetRollInput")?.value, prompt("टर्मिनेट करने के लिए रोल नंबर दर्ज करें:")).trim().toUpperCase();
        if (!roll) return;
        logEliminatedStudent(roll, "परीक्षार्थी", "व्यवस्थापक द्वारा अनुशासनहीनता के कारण मैनुअल टर्मिनेट");
        if (examRuntime && examRuntime.isActive && examRuntime.rollNumber.toUpperCase() === roll) {
            finalizeAndSubmitExam(true, "व्यवस्थापक द्वारा सेशन टर्मिनेट");
        }
        showToast(`🚫 रोल नंबर ${roll} का परीक्षा सत्र तत्काल प्रभाव से समाप्त कर दिया गया है!`);
        loadLiveProctoringStats();
    });
}

function saveSectionalMarkingConfig() {
    verifyOwnerSecretPin(() => {
        const cfg = {
            A: { plus: parseFloat(valOr(document.getElementById("secAPlus")?.value, "2")), minus: parseFloat(valOr(document.getElementById("secAMinus")?.value, "0.5")) },
            B: { plus: parseFloat(valOr(document.getElementById("secBPlus")?.value, "4")), minus: parseFloat(valOr(document.getElementById("secBMinus")?.value, "1")) }
        };
        writeStore(PORTAL_CONFIG.sectionWeightsKey, cfg);
        showToast("✅ सेक्शनल नेगेटिव मार्किंग नियम सफलतापूर्वक सहेजे गए!");
    });
}

function getSectionWeightsConfig() {
    return readStore(PORTAL_CONFIG.sectionWeightsKey, { A: { plus: 2, minus: 0.5 }, B: { plus: 4, minus: 1 } });
}

function saveExternalPortalSingleBoxData() {
    verifyOwnerSecretPin(() => {
        const raw = valOr(document.getElementById("externalPortalSingleBoxTextarea")?.value, "");
        const items = raw.split("\n").map(l => l.trim()).filter(Boolean).map(line => {
            const p = line.split("|").map(s => s.trim());
            return { title: valOr(p[0], "विवरण"), detail: valOr(p[1], ""), extra: valOr(p[2], "") };
        });
        writeStore("bishnoi_external_portal_items_v5", items);
        renderExternalPortalPreviewUI();
        refreshOnPageVercelItems();
        showToast("✅ बाहरी पोर्टल डेटा सफलतापूर्वक अपडेट हो गया!");
    });
}

function renderExternalPortalPreviewUI() {
    const box = document.getElementById("externalPortalSavedPreview");
    if (!box) return;
    const items = readStore("bishnoi_external_portal_items_v5", []);
    box.innerHTML = items.map(it => `
        <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <div class="font-extrabold text-emerald-950">${it.title}</div>
            <div class="text-gray-700 font-medium">${it.detail}</div>
            ${it.extra ? `<div class="text-[11px] text-amber-800 font-bold mt-0.5">📍 ${it.extra}</div>` : ""}
        </div>
    `).join("");
}

function renderDistrictTelemetryUI() {
    const grid = document.getElementById("districtTelemetryHeatmapGrid");
    if (!grid) return;
    const data = getDistrictParticipationTelemetry();
    grid.innerHTML = Object.entries(data).map(([dist, count]) => `
        <div class="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
            <span class="font-extrabold text-xs text-emerald-950">📍 ${dist}</span>
            <span class="px-2.5 py-1 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-lg">${count} छात्र</span>
        </div>
    `).join("");
}

function renderLiveAutoRankedPreviewTable(sheetType = "main") {
    const box = document.getElementById("liveAutoRankedTableBody");
    if (!box) return;
    const list = getSeparateSheetSubmissions(sheetType);

    if (list.length === 0) {
        box.innerHTML = `<div class="p-4 text-center text-xs font-bold text-gray-500">इस श्रेणी में अभी कोई परिणाम दर्ज नहीं है।</div>`;
        return;
    }

    box.innerHTML = `
        <table class="w-full text-left border-collapse text-xs">
            <thead>
                <tr class="bg-emerald-950 text-amber-300 font-extrabold">
                    <th class="p-2.5 border">रैंक</th>
                    <th class="p-2.5 border">रोल नंबर</th>
                    <th class="p-2.5 border">परीक्षार्थी का नाम</th>
                    <th class="p-2.5 border">जिला</th>
                    <th class="p-2.5 border">प्राप्तांक</th>
                    <th class="p-2.5 border">स्थिति</th>
                </tr>
            </thead>
            <tbody>
                ${list.map((r, idx) => {
                    const statusText = r.manualEvaluated ? '<span class="text-green-700 font-extrabold">मैनुअल सत्यापित ✓</span>' : valOr(r.statusNote, "Submitted");
                    return `
                        <tr class="border-b hover:bg-emerald-50/50 font-semibold text-gray-900">
                            <td class="p-2.5 border font-extrabold text-emerald-900">#${idx + 1}</td>
                            <td class="p-2.5 border">${r.rollNumber}</td>
                            <td class="p-2.5 border">${r.studentName}</td>
                            <td class="p-2.5 border">${r.district}</td>
                            <td class="p-2.5 border font-extrabold text-amber-800">${r.score}</td>
                            <td class="p-2.5 border">${statusText}</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;
}

function announceDailyQuizWinners() {
    verifyOwnerSecretPin(() => {
        const dailyList = getSeparateSheetSubmissions("daily").filter(s => !s.disqualifiedByCheating);
        if (dailyList.length === 0) {
            alert("आज की दैनिक प्रश्नोत्तरी में अभी तक कोई योग्य प्रविष्टि नहीं है।");
            return;
        }

        dailyList.sort((a, b) => {
            if (Number(b.score) !== Number(a.score)) return Number(b.score) - Number(a.score);
            const timeA = Object.values(a.timeSpentPerQ || {}).reduce((acc, v) => acc + Number(v), 0);
            const timeB = Object.values(b.timeSpentPerQ || {}).reduce((acc, v) => acc + Number(v), 0);
            if (timeA !== timeB) return timeA - timeB;
            return (a.tabWarnings || 0) - (b.tabWarnings || 0);
        });

        const top3 = dailyList.slice(0, 3);
        const explanationRule = "चयन नियम: १. सर्वाधिक प्राप्तांक • २. समान अंक होने पर सबसे कम समय • ३. शून्य अनुशासनहीनता";
        const winnerSummary = top3.map((w, idx) => {
            const totalSec = Object.values(w.timeSpentPerQ || {}).reduce((acc, v) => acc + Number(v), 0);
            return `🥇 रैंक #${idx + 1}: ${w.studentName} (${w.district}) — ${w.score} अंक (समय: ${totalSec} से.)`;
        }).join("\n");

        writeStore("bishnoi_latest_daily_winners_v5", {
            date: new Date().toLocaleDateString("hi-IN"),
            rule: explanationRule,
            winners: top3
        });

        pushPortalNotification(`🏆 दैनिक प्रश्नोत्तरी विजेता घोषित!\n${winnerSummary}`);
        renderDailyWinnerPublicBanner();
        alert(`🏆 दैनिक विजेता सफलतापूर्वक घोषित!\n(${explanationRule})\n\n${winnerSummary}`);
    });
}

function renderDailyWinnerPublicBanner() {
    const data = readStore("bishnoi_latest_daily_winners_v5", null);
    if (!data || !Array.isArray(data.winners) || data.winners.length === 0) return;

    const parikshaWrapper = document.getElementById("parikshaMasterHubWrapper");
    if (!parikshaWrapper) return;

    let banner = document.getElementById("dailyQuizWinnerPublicCard");
    if (!banner) {
        banner = document.createElement("div");
        banner.id = "dailyQuizWinnerPublicCard";
        banner.className = "bg-gradient-to-r from-amber-50 to-emerald-50 rounded-3xl p-5 border-2 border-amber-400 shadow-md mb-4";
        parikshaWrapper.prepend(banner);
    }

    banner.innerHTML = `
        <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
            <span class="px-3 py-1 bg-amber-500 text-emerald-950 font-extrabold text-xs rounded-full">🏆 आज के दैनिक प्रश्नोत्तरी विजेता (${data.date})</span>
            <span class="text-[11px] font-bold text-emerald-900">${data.rule}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            ${data.winners.map((w, i) => `
                <div class="p-3 bg-white rounded-2xl border border-amber-300 shadow-sm">
                    <div class="font-extrabold text-xs text-amber-800">स्थान #${i + 1} (${w.rollNumber})</div>
                    <div class="font-extrabold text-base text-gray-900">${w.studentName}</div>
                    <div class="text-xs font-bold text-emerald-800">📍 ${w.district} • प्राप्तांक: ${w.score}</div>
                </div>
            `).join("")}
        </div>
    `;
}

function sendOwnerBroadcastNotification() {
    verifyOwnerSecretPin(() => {
        const msg = valOr(document.getElementById("ownerBroadcastMsgInput")?.value, "").trim();
        if (!msg) return;
        pushPortalNotification(`📢 व्यवस्थापक संदेश: ${msg}`);
        const inp = document.getElementById("ownerBroadcastMsgInput");
        if (inp) inp.value = "";
        showToast("📢 पुश नोटिफिकेशन सभी छात्रों के लिए प्रसारित कर दिया गया है!");
    });
}

function toggleMainExamResultDeclaration() {
    verifyOwnerSecretPin(() => {
        const current = (localStorage.getItem(PORTAL_CONFIG.resultDeclaredKey) === "true");
        const nextState = !current;
        localStorage.setItem(PORTAL_CONFIG.resultDeclaredKey, String(nextState));
        if (nextState) {
            pushPortalNotification("🎓 मुख्य परीक्षा का आधिकारिक परिणाम घोषित कर दिया गया है! सभी छात्र अपना रोल नंबर डालकर अंक-तालिका एवं प्रमाण-पत्र डाउनलोड कर सकते हैं।");
            showToast("🎓 मुख्य परीक्षा परिणाम आधिकारिक रूप से घोषित कर दिया गया है!");
        } else {
            showToast("🔒 मुख्य परीक्षा परिणाम को पुनः होल्ड पर रखा गया है।");
        }
    });
}

// --- 24. GLOBAL HELPERS, ROUTING & UTILITIES ---
function pushPortalNotification(messageText) {
    const list = readStore(PORTAL_CONFIG.notificationsKey, []);
    list.unshift({ id: Date.now(), text: messageText, time: new Date().toLocaleTimeString("hi-IN") });
    writeStore(PORTAL_CONFIG.notificationsKey, list.slice(0, 25));
    renderNotificationsBell();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("विश्नोई समाज पोर्टल सूचना", { body: messageText });
    }
}

function renderNotificationsBell() {
    const badge = document.getElementById("notificationCountBadge");
    const list = readStore(PORTAL_CONFIG.notificationsKey, []);
    if (badge) badge.innerText = String(list.length);
}

function render29NiyamCards(containerId = "niyamCardsGrid") {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = TWENTY_NINE_NIYAMS.map(n => `
        <div class="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition">
            <span class="px-2.5 py-0.5 bg-emerald-900 text-amber-300 font-extrabold text-xs rounded-lg">नियम ${n.id}</span>
            <h4 class="font-extrabold text-gray-900 text-base mt-2">${n.title}</h4>
            <p class="text-xs text-gray-700 mt-1 leading-relaxed">${n.desc}</p>
        </div>
    `).join("");
}

function shuffleArrayWithSeed(arr, seedStr) {
    const list = [...arr];
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
    function pseudoRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRandom() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function logEliminatedStudent(rollNumber, studentName, reason) {
    const list = readStore(PORTAL_CONFIG.eliminatedKey, []);
    list.unshift({ rollNumber, studentName, reason, time: new Date().toLocaleTimeString("hi-IN") });
    writeStore(PORTAL_CONFIG.eliminatedKey, list);
}

function openParikshaTabUI() {
    const parikshaSec = document.getElementById("pariksha");
    if (parikshaSec) parikshaSec.scrollIntoView({ behavior: "smooth" });
}

function renderParikshaLandingDashboard() {
    localStorage.removeItem(PORTAL_CONFIG.examSessionKey);
    if (typeof location !== "undefined") location.reload();
}

function createExamContainerIfMissing() {
    let el = document.getElementById("pariksha");
    if (!el && typeof document !== "undefined") {
        el = document.createElement("section");
        el.id = "pariksha";
        document.body.appendChild(el);
    }
    return el;
}

function createDefaultAvatarSVG(name) {
    const initial = valOr(name, "वि").trim().charAt(0);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="160"><rect width="100%" height="100%" fill="#064e3b"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#fde68a" font-family="Arial" font-size="64" font-weight="bold">${initial}</text></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function showToast(msg) {
    if (typeof document === "undefined") return;
    let toast = document.getElementById("portalGlobalToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "portalGlobalToast";
        toast.className = "fixed bottom-16 right-4 z-[9999] bg-emerald-950 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl border border-amber-400 text-xs font-extrabold transition-all";
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => { if (toast) toast.style.display = "none"; }, 4000);
}

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
    } else if (cleanId === "prabandhan" || cleanId === "ownerStudioSection") {
        renderDistrictTelemetryUI();
        loadLiveProctoringStats();
    }
}

function updateAutoPanchangAndAmavasyaWidget() {
    if (typeof document === "undefined") return;
    const now = new Date();
    const daysHindi = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
    const dayName = daysHindi[now.getDay()];
    const formattedDate = now.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
    document.querySelectorAll("[data-panchang-date], #autoPanchangDateText").forEach(el => {
        el.innerText = `${dayName} • ${formattedDate} | विक्रम संवत २०८३`;
    });
}

function bindExistingHTMLButtonsAutomatically() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("button, a").forEach(btn => {
        const txt = valOr(btn.innerText, "").trim();
        if ((txt.includes("मैंने पौधरोपण किया") || txt.includes("Pledge")) && !btn.onclick) {
            btn.onclick = () => {
                const name = prompt("🌳 हरित धरोहर महासंकल्प:\nपौधरोपण करने वाले पर्यावरण प्रेमी का नाम दर्ज करें:");
                if (!name) return;
                const dist = prompt("अपना जिला / गाँव दर्ज करें:", "हिसार");
                uploadMeraPodhaPledgeWithPhoto(name, dist, "");
            };
        } else if (txt.includes("डिजिटल जप माला") && !btn.onclick) {
            btn.onclick = () => incrementJaapMalaBead();
        }
    });
}

function initDailySadhanaReminderScheduler() {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
        document.addEventListener("click", function askNotifOnce() {
            Notification.requestPermission();
            document.removeEventListener("click", askNotifOnce);
        }, { once: true });
    }
    setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        const todayKey = now.toISOString().split("T")[0];
        const lastJaap = localStorage.getItem("bishnoi_last_jaap_date");

        if (hour >= 6 && hour <= 8 && !sessionStorage.getItem(`morning_rem_${todayKey}`)) {
            sessionStorage.setItem(`morning_rem_${todayKey}`, "sent");
            pushPortalNotification("🌅 प्रातः संध्या वंदना एवं दैनिक पंचांग दर्शन का पावन समय! अपनी १०८ मनकों की डिजिटल जप माला पूर्ण करें।");
        } else if (hour >= 18 && hour <= 20 && lastJaap !== todayKey && !sessionStorage.getItem(`evening_rem_${todayKey}`)) {
            sessionStorage.setItem(`evening_rem_${todayKey}`, "sent");
            pushPortalNotification("🪔 सायं आरती एवं जप स्मरण: आपकी आज की दैनिक जप माला स्ट्रीक अभी अपूर्ण है, कृपया साधना पूर्ण करें।");
        }
    }, 30 * 60 * 1000);
}

// --- 25. GLOBAL WINDOW EXPORTS (ALL METHODS DEFINED & BOUND) ---
if (typeof window !== "undefined") {
    Object.assign(window, {
        switchTab: switchPortalSection,
        switchPortalSection: switchPortalSection,
        openParikshaTabUI: openParikshaTabUI,
        renderParikshaLandingDashboard: renderParikshaLandingDashboard,
        openNotificationsHistoryModal: () => {
            const list = readStore(PORTAL_CONFIG.notificationsKey, []);
            if (list.length === 0) { alert("🔔 अभी कोई नई अधिसूचना नहीं है।"); return; }
            alert(`🔔 आधिकारिक पोर्टल अधिसूचना केंद्र:\n\n` + list.slice(0, 10).map((n, i) => `${i + 1}. [${n.time}] ${n.text}`).join("\n\n"));
        },
        startPortalExamSession: startPortalExamSession,
        triggerHubExamStart: triggerHubExamStart,
        selectExamOption: selectExamOption,
        clearCurrentExamResponse: clearCurrentExamResponse,
        toggleMarkForReview: toggleMarkForReview,
        navigateExamQuestion: navigateExamQuestion,
        jumpToExamQuestion: jumpToExamQuestion,
        openPreSubmitSummaryModal: openPreSubmitSummaryModal,
        finalizeAndSubmitExam: finalizeAndSubmitExam,
        downloadOfflineEncryptedExamPacket: downloadOfflineEncryptedExamPacket,
        importOfflineEncryptedExamPacket: importOfflineEncryptedExamPacket,
        manualTriggerOfflineSync: manualTriggerOfflineSync,
        injectOfflinePacketLoaderAndSyncBar: injectOfflinePacketLoaderAndSyncBar,
        checkStudentResultByRollNumber: checkStudentResultByRollNumber,
        askAiSahayakBottomEngine: askAiSahayakBottomEngine,
        toggleQuestionBookmark: toggleQuestionBookmark,
        renderClearBookmarksInProfile: renderClearBookmarksInProfile,
        renderCompleteStudentProfileDashboard: renderCompleteStudentProfileDashboard,
        promptStudentProfileRollSearch: promptStudentProfileRollSearch,
        enrollStudentWithPhotoAndGenerateAdmitCard: enrollStudentWithPhotoAndGenerateAdmitCard,
        handleHubStudentEnrollmentSubmit: handleHubStudentEnrollmentSubmit,
        openNationalStandardAdmitCardPrintWindow: openNationalStandardAdmitCardPrintWindow,
        openOfficialMarksheetAndCertificatePrintWindowByRoll: openOfficialMarksheetAndCertificatePrintWindowByRoll,
        openOfficialMarksheetAndCertificatePrintWindow: openOfficialMarksheetAndCertificatePrintWindow,
        downloadStudentCertificate: downloadStudentCertificate,
        render29NiyamCards: render29NiyamCards,
        initKaraokeSection: initKaraokeSection,
        loadKaraokeTrack: loadKaraokeTrack,
        initShabadwaniReaderAndSearch: initShabadwaniReaderAndSearch,
        filterShabadwaniList: filterShabadwaniList,
        adjustShabadFontSize: adjustShabadFontSize,
        speakHindiText: speakHindiText,
        speakShabadByNum: speakShabadByNum,
        incrementJaapMalaBead: incrementJaapMalaBead,
        recordDailyJaapMalaStreak: recordDailyJaapMalaStreak,
        saveCustomDailyReminderTime: saveCustomDailyReminderTime,
        injectInteractiveChaupalAndMeraPodhaForms: injectInteractiveChaupalAndMeraPodhaForms,
        handlePodhaPledgeSubmit: handlePodhaPledgeSubmit,
        renderChaupalFeed: renderChaupalFeed,
        upvoteChaupalPost: upvoteChaupalPost,
        reactSingleEmojiToPost: reactSingleEmojiToPost,
        addCommentToChaupalPost: addCommentToChaupalPost,
        reactSingleEmojiToComment: reactSingleEmojiToComment,
        submitNewChaupalPost: submitNewChaupalPost,
        uploadMeraPodhaPledgeWithPhoto: uploadMeraPodhaPledgeWithPhoto,
        renderMeraPodhaGallery: renderMeraPodhaGallery,
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
        saveSectionalMarkingConfig: saveSectionalMarkingConfig,
        validateBulkQuestionBankInput: validateBulkQuestionBankInput,
        uploadValidatedBulkQuestionBank: uploadValidatedBulkQuestionBank,
        saveSingleBoxAdmitCardConfig: saveSingleBoxAdmitCardConfig,
        saveExternalPortalSingleBoxData: saveExternalPortalSingleBoxData,
        openDetailedManualEvaluationViewer: openDetailedManualEvaluationViewer,
        adjustSingleQuestionManualMark: adjustSingleQuestionManualMark,
        approveFinalManualMarksAndRefreshTable: approveFinalManualMarksAndRefreshTable,
        renderLiveAutoRankedPreviewTable: renderLiveAutoRankedPreviewTable,
        filterDistrictTelemetryGrid: filterDistrictTelemetryGrid,
        setPortalMaintenanceState: setPortalMaintenanceState,
        ownerBypassMaintenancePrompt: ownerBypassMaintenancePrompt,
        sendOwnerBroadcastNotification: sendOwnerBroadcastNotification,
        toggleMainExamResultDeclaration: toggleMainExamResultDeclaration,
        unlockStuckParikshaScreenAndReset: unlockStuckParikshaScreenAndReset,
        loadLiveProctoringStats: loadLiveProctoringStats,
        startExamEngine: (type, roll, name, dist) => startPortalExamSession(type || "main", roll, name, dist),
        submitFinalExam: (isForced) => finalizeAndSubmitExam(Boolean(isForced), isForced ? "Auto-Submitted" : "Submitted"),
        shuffleExamQuestionsAndOptions: (qList, seed) => shuffleArrayWithSeed(qList, valOr(seed, "BISHNOI")),
        requestExamFullScreen: () => { if (document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen().catch(() => {}); } },
        flushOfflineExamQueue: flushOfflineExamQueue,
        verifyOwnerPinAction: verifyOwnerSecretPin,
        exportEnrolledCSV: () => exportAutoRankedExcelSheet("enrolled"),
        exportMainExamResultsCSV: () => exportAutoRankedExcelSheet("main"),
        grantOneMoreChanceToStudent: grantCustomReChanceToStudent,
        saveCustomAdmitAndCutoffConfig: () => saveSingleBoxAdmitCardConfig(document.getElementById("singleBoxAdmitConfigInput")?.value),
        validateBulkQuestionFormat: validateBulkQuestionBankInput,
        promptOwnerQuickVercelPaste: promptOwnerQuickVercelPaste
    });
}
