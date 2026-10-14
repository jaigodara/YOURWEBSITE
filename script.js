/* ==========================================================================
   विश्नोई समाज डिजिटल मंच (Bishnoi Digital Platform)
   Revised Master Script — index.html
   Preserves existing design classes and public namespaces.
   ========================================================================== */

(function () {
  'use strict';

  // 1. FIREBASE CONFIGURATION
  const firebaseConfig = {
    apiKey: "AIzaSyDD58ybmm1bmmc5k5AwsxiaDiOXxlp7APA",
    authDomain: "bishnoi-platform.firebaseapp.com",
    projectId: "bishnoi-platform",
    storageBucket: "bishnoi-platform.firebasestorage.app",
    messagingSenderId: "1001226124051",
    appId: "1:1001226124051:web:ad4dc69e04e6701024f8e6"
  };

  if (!window.firebase) {
    console.error("Firebase SDK नहीं मिला। index.html में Firebase SDK जोड़ें।");
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.firestore();
  const auth = firebase.auth();

  // This UID is a client-side display hint, NOT a security boundary.
  // Firestore rules must independently authorize all privileged operations.
  const SUPER_OWNER_UID = "8YRBWWMKG2OUW6cmzZkGbFgOqyp2";

  // 2. APPLICATION STATE
  let currentUser = null;
  let isRegisterMode = false;
  let currentActiveTab = "home";
  let confirmCallback = null;
  let inactivityTimer = null;

  let quizList = [];
  let currentQ = 0;
  let qScore = 0;
  let isAnswering = false;
  let quizFinished = false;

  let malaBeadCount = readNonNegativeInt("bishnoi_mala_beads");
  let malaLapsCount = readNonNegativeInt("bishnoi_mala_laps");
  let malaTotalCount = readNonNegativeInt("bishnoi_mala_total");
  let readNiyamsSet = readReadNiyams();

  let amavasyaTargetDate = null;
  let amavasyaTimer = null;

  const audioSpeeds = [1, 1.25, 1.5];
  let speedIdx = 0;

  let allPosts = [];
  let currentChatFilter = "all";
  let lastPostTime = 0;
  let authListenerStarted = false;
  let quizListenerStarted = false;
  let communityListenerStarted = false;
  let pdfListenerStarted = false;
  let bannerListenerStarted = false;
  let treeListenerStarted = false;
  let amavasyaListenerStarted = false;

  // 3. HELPERS
  function $(id) {
    return document.getElementById(id);
  }

  function readNonNegativeInt(key) {
    try {
      const value = Number.parseInt(localStorage.getItem(key) || "0", 10);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch (_) {
      return 0;
    }
  }

  function readReadNiyams() {
    try {
      const value = JSON.parse(
        localStorage.getItem("bishnoi_read_niyams") || "[]"
      );

      if (!Array.isArray(value)) return new Set();

      return new Set(
        value.filter(n => Number.isInteger(n) && n >= 1 && n <= 29)
      );
    } catch (_) {
      return new Set();
    }
  }

  function saveLocal(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn("स्थानीय सेटिंग सुरक्षित नहीं हो सकी।", err);
    }
  }

  // Escape all dynamic text before placing it into HTML.
  // Prefer textContent for new code wherever practical.
  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);
  }

  function safeText(value, maxLength = 500) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .trim()
      .slice(0, maxLength);
  }

  function safeHttpUrl(value) {
    if (typeof value !== "string") return null;

    const candidate = value.trim();
    if (!candidate || candidate.length > 2048) return null;

    try {
      const url = new URL(candidate, window.location.href);

      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return null;
      }

      // Reject embedded credentials in links.
      if (url.username || url.password) return null;

      return url.href;
    } catch (_) {
      return null;
    }
  }

  function showToast(message) {
    const toast = $("toastNotification");
    const toastMsg = $("toastMsg");

    if (!toast || !toastMsg) {
      console.info(safeText(message, 300));
      return;
    }

    toastMsg.textContent = safeText(message, 300);
    toast.classList.remove("-translate-y-20", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");

    setTimeout(() => {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("-translate-y-20", "opacity-0");
    }, 3200);
  }

  function openConfirmModal(title, message, callback) {
    const modal = $("customConfirmModal");
    if (!modal) {
      showToast("पुष्टिकरण विंडो उपलब्ध नहीं है।");
      return;
    }

    if ($("confirmTitle")) $("confirmTitle").textContent = safeText(title, 120);
    if ($("confirmMsg")) $("confirmMsg").textContent = safeText(message, 500);

    confirmCallback = typeof callback === "function" ? callback : null;
    modal.classList.remove("hidden");
  }

  function closeConfirmModal(result) {
    $("customConfirmModal")?.classList.add("hidden");

    const callback = confirmCallback;
    confirmCallback = null;

    if (callback) {
      try {
        callback(Boolean(result));
      } catch (err) {
        console.error("Confirmation callback error:", err);
      }
    }
  }

  function friendlyAuthError(error) {
    const code = error && error.code;

    const messages = {
      "auth/invalid-email": "ईमेल पता सही नहीं है।",
      "auth/user-not-found": "खाता नहीं मिला। विवरण जाँचें या पंजीकरण करें।",
      "auth/wrong-password": "लॉगिन विवरण सही नहीं हैं।",
      "auth/invalid-credential": "लॉगिन विवरण सही नहीं हैं।",
      "auth/email-already-in-use": "यह ईमेल पहले से पंजीकृत है।",
      "auth/weak-password": "कृपया अधिक मजबूत पासवर्ड चुनें।",
      "auth/too-many-requests": "बहुत अधिक प्रयास हुए हैं। कुछ देर बाद प्रयास करें।",
      "auth/popup-closed-by-user": "Google लॉगिन विंडो बंद कर दी गई।",
      "auth/popup-blocked": "ब्राउज़र ने लॉगिन विंडो रोक दी।",
      "auth/network-request-failed": "नेटवर्क की समस्या है। दोबारा प्रयास करें।",
      "auth/operation-not-allowed": "यह लॉगिन विधि Firebase में सक्षम नहीं है।"
    };

    return messages[code] || "अनुरोध पूरा नहीं हुआ। कृपया दोबारा प्रयास करें।";
  }

  function reportFirestoreError(action, error) {
    console.error(action, error);

    if (error && error.code === "permission-denied") {
      showToast("इस कार्य की अनुमति नहीं है।");
    } else if (error && error.code === "unavailable") {
      showToast("सेवा अभी उपलब्ध नहीं है। इंटरनेट जाँचें।");
    } else {
      showToast("अनुरोध पूरा नहीं हुआ। कृपया दोबारा प्रयास करें।");
    }
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function openExternal(url) {
    const safeUrl = safeHttpUrl(url);
    if (!safeUrl) {
      showToast("यह लिंक मान्य नहीं है।");
      return;
    }

    const opened = window.open(safeUrl, "_blank", "noopener,noreferrer");
    if (!opened) showToast("लिंक खोलने के लिए ब्राउज़र अनुमति दें।");
  }

  // 4. AUTHENTIC 29 NIYAMS
  const niyamsData = [
    { num: 1, title: "प्रसूति सूतक", rule: "तीस दिन सूतक पाळणा", desc: "सूतक काल में ३० दिन तक माता व शिशु की स्वच्छता और विश्राम रखें।" },
    { num: 2, title: "ऋतुवंती पृथक्करण", rule: "पांच दिन रजस्वला पृथक्करण", desc: "माहवारी के दौरान ५ दिन का गृह-कार्य से पूर्ण विश्राम एवं स्वास्थ्य रक्षा।" },
    { num: 3, title: "प्रातः स्नान", rule: "सेरो करो अस्नान", desc: "प्रतिदिन सूर्योदय से पूर्व प्रातःकाल स्नान कर तन-मन से पवित्र रहें।" },
    { num: 4, title: "शील व संतोष", rule: "शील संतोष सूच राखणा", desc: "सदाचारी, शांत, पवित्र और संतोषी स्वभाव बनाए रखें।" },
    { num: 5, title: "द्विकाल संध्या", rule: "द्वादश कर्म सांध", desc: "सुबह-शाम दोनों समय संध्या-वंदन और ईश्वर स्मरण करें।" },
    { num: 6, title: "सांझ आरती", rule: "सांझ आरती गुण गावै", desc: "संध्या समय आरती व भगवान के पावन गुणों का गायन करें।" },
    { num: 7, title: "प्रातः होम", rule: "प्रात: होम करणा", desc: "आत्मिक शांति हेतु प्रतिदिन प्रातःकाल हवन करें।" },
    { num: 8, title: "पानी छानना", rule: "पाणी छान पीवणा", desc: "सूक्ष्म जीवों की रक्षा व स्वास्थ्य के लिए पानी छानकर पियें और वाणी भी छानकर बोलें।" },
    { num: 9, title: "ईंधन जांच", rule: "ईंधन बीन बाळणा", desc: "ईंधन जलाने से पहले उसमें मौजूद जीव-जंतुओं की रक्षा का ध्यान रखें।" },
    { num: 10, title: "क्षमा धारण", rule: "क्षमा दया मन आणणा", desc: "मन में सदा क्षमा और सहनशीलता का भाव बनाए रखें।" },
    { num: 11, title: "दया भाव", rule: "दया हिरदै राखणी", desc: "प्रत्येक प्राणी और मनुष्य के प्रति हृदय में करुणा व दयालुता रखें।" },
    { num: 12, title: "चोरी त्याग", rule: "चोरी नहीं करणी", desc: "पराई वस्तु कभी न चुराएं और ईमानदारी से जीवन यापन करें।" },
    { num: 13, title: "निंदा त्याग", rule: "निंदा नहीं करणी", desc: "किसी की पीठ पीछे बुराई या चुगली न करें।" },
    { num: 14, title: "झूठ त्याग", rule: "झूठ नहीं बोलना", desc: "सदा सत्य, हितकारी और मधुर वाणी बोलें।" },
    { num: 15, title: "वाद-विवाद त्याग", rule: "वाद विवाद नहीं करणा", desc: "व्यर्थ के झगड़े और अहंकार भरी बहस से दूर रहें।" },
    { num: 16, title: "अमावस्या व्रत", rule: "अमावस्या व्रत राखणा", desc: "अमावस्या के दिन उपवास, पर्यावरण चिंतन और हरि स्मरण करें।" },
    { num: 17, title: "विष्णु स्मरण", rule: "विष्णु नाम जपणा", desc: "हृदय में ॐ विष्णवे नमः का निरंतर स्मरण रखें।" },
    { num: 18, title: "जीव दया", rule: "जीव दया पालणी", desc: "सभी मूक पशु-पक्षियों की रक्षा करें, किसी जीव को कष्ट न दें।" },
    { num: 19, title: "हरा वृक्ष रक्षा", rule: "रूंख लीलो नी घावै", desc: "पर्यावरण संतुलन हेतु हरे-भरे पेड़ों को न काटें।" },
    { num: 20, title: "काम-क्रोध संयम", rule: "अजर जरे सो सूर", desc: "काम, क्रोध, लोभ और अहंकार पर नियंत्रण रखें।" },
    { num: 21, title: "स्वहस्त आहार", rule: "आपने हाथे रांधणा", desc: "पवित्रता और सात्विकता के साथ शुद्ध बना भोजन ग्रहण करें।" },
    { num: 22, title: "पशु थापण", rule: "अमर रखावै थाट", desc: "निराश्रित और असहाय पशुओं को कटने से बचाएं और आश्रय दें।" },
    { num: 23, title: "बैल बधिया निषेध", rule: "बैल बधिया नहीं करणा", desc: "पशुओं पर क्रूरता न करें और उनकी देखभाल करें।" },
    { num: 24, title: "अमल त्याग", rule: "अमल नहीं खाणा", desc: "अफीम और अन्य नशीले पदार्थों का त्याग करें।" },
    { num: 25, title: "तम्बाकू त्याग", rule: "तम्बाकू नहीं पीणा", desc: "तम्बाकू, बीड़ी, सिगरेट, गुटखा आदि का त्याग करें।" },
    { num: 26, title: "भांग त्याग", rule: "भांग नहीं पीणी", desc: "भांग और गांजे जैसे मादक पदार्थों का सेवन न करें।" },
    { num: 27, title: "मदिरा त्याग", rule: "मद्य नहीं पीणा", desc: "शराब का त्याग करें।" },
    { num: 28, title: "मांस त्याग", rule: "मांस नहीं खाणा", desc: "समाज की परंपरा के अनुसार शाकाहार का पालन करें।" },
    { num: 29, title: "नील त्याग", rule: "नील नहीं पहरणा", desc: "नील के पौधों और सूक्ष्म जीवों की रक्षा के लिए नील के त्याग की परंपरा का पालन करें।" }
  ];

  const historyItemsList = [
    {
      type: "history",
      badge: "इतिहास अध्याय • १७३० ई.",
      title: "खेजड़ली का अमर बलिदान — ३६३ हुतात्माओं की गौरवगाथा",
      content: "सन् १७३० में जोधपुर के खेजड़ली गाँव में माता अमृता देवी बिश्नोई और उनकी तीन पुत्रियों सहित ३६३ बिश्नोई लोगों ने हरे खेजड़ी वृक्षों की रक्षा के लिए बलिदान दिया।",
      moral: "सिर साटै रूंख रहै, तो भी सस्तो जाण — प्रकृति और धर्म की रक्षा का संदेश।"
    },
    {
      type: "kids",
      badge: "🦌 बाल संस्कार कहानी",
      title: "नन्हे हिरण का सच्चा मित्र",
      content: "थार के रेगिस्तान में बच्चों ने एक प्यासे चिंकारे को देखा। उन्होंने उसके लिए पानी रखा और उसकी रक्षा की।",
      moral: "🌟 सीख: मूक पशु-पक्षियों की रक्षा करें और उनके लिए पानी की व्यवस्था करें।"
    }
  ];

  // 5. NAVIGATION
  function switchTab(tabId) {
    const allowedTabs = ["home", "library", "quiz", "community", "mala", "history"];

    if (!allowedTabs.includes(tabId)) {
      showToast("यह पृष्ठ उपलब्ध नहीं है।");
      return;
    }

    currentActiveTab = tabId;

    allowedTabs.forEach(tab => {
      $(`tab-${tab}`)?.classList.add("hidden");
    });

    ["home", "library", "quiz", "community", "profile"].forEach(key => {
      $(`bnav-${key}`)?.classList.remove("bnav-active");
    });

    $(`tab-${tabId}`)?.classList.remove("hidden");

    const navKey = (tabId === "mala" || tabId === "history") ? "home" : tabId;
    $(`bnav-${navKey}`)?.classList.add("bnav-active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function switchHistorySubTab(sub) {
    const historyView = $("historySubView");
    const kidsView = $("kidsSubView");
    const historyBtn = $("sub-history-btn");
    const kidsBtn = $("sub-kids-btn");

    if (sub === "full-history") {
      historyView?.classList.remove("hidden");
      kidsView?.classList.add("hidden");

      if (historyBtn) {
        historyBtn.className =
          "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
      }
      if (kidsBtn) {
        kidsBtn.className =
          "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600";
      }
    } else {
      historyView?.classList.add("hidden");
      kidsView?.classList.remove("hidden");

      if (kidsBtn) {
        kidsBtn.className =
          "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
      }
      if (historyBtn) {
        historyBtn.className =
          "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600";
      }
    }
  }

  // 6. AUTHENTICATION
  function initAuthEngine() {
    if (authListenerStarted) return;
    authListenerStarted = true;

    auth.onAuthStateChanged(async user => {
      if (!user) {
        currentUser = null;
        try {
          localStorage.removeItem("bishnoi_active_user");
        } catch (_) {}

        updateAuthUI();
        return;
      }

      try {
        const userRef = db.collection("users").doc(user.uid);
        const snapshot = await userRef.get();

        if (snapshot.exists) {
          currentUser = {
            uid: user.uid,
            name: safeText(snapshot.data().name || user.displayName || "धर्मप्रेमी सदस्य", 80),
            email: user.email || "",
            location: safeText(snapshot.data().location || "", 120)
          };
        } else {
          currentUser = {
            uid: user.uid,
            name: safeText(user.displayName || "धर्मप्रेमी सदस्य", 80),
            email: user.email || "",
            location: ""
          };

          await userRef.set({
            name: currentUser.name,
            email: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }

        try {
          localStorage.setItem("bishnoi_active_user", JSON.stringify({
            uid: user.uid,
            name: currentUser.name
          }));
        } catch (_) {}

      } catch (err) {
        console.error("Profile sync error:", err);
        // Keep authentication state, but do not invent a trusted profile.
        currentUser = {
          uid: user.uid,
          name: safeText(user.displayName || "सदस्य", 80),
          email: user.email || "",
          location: ""
        };
      }

      updateAuthUI();
    });

    const resetInactivity = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);

      if (auth.currentUser) {
        inactivityTimer = setTimeout(async () => {
          await logout(true);
          showToast("🔒 सुरक्षा कारणों से निष्क्रियता के बाद सत्र समाप्त हुआ।");
        }, 20 * 60 * 1000);
      }
    };

    ["click", "touchstart", "keydown"].forEach(eventName => {
      window.addEventListener(eventName, resetInactivity, { passive: true });
    });
  }

  function updateAuthUI() {
    const container = $("authActionsContainer");
    const studioBtn = $("ownerStudioPortalBtn");
    const postPrompt = $("postAuthPrompt");
    const postEditor = $("postEditor");
    const navLabel = $("bnavProfileLabel");

    if (currentUser) {
      if (container) {
        container.replaceChildren();

        const button = document.createElement("button");
        button.type = "button";
        button.className =
          "text-xs font-bold text-forest bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 truncate max-w-[140px] shadow-sm";
        button.textContent = `👤 ${currentUser.name}`;
        button.addEventListener("click", openProfileModal);
        container.appendChild(button);
      }

      if (navLabel) navLabel.textContent = "प्रोफ़ाइल";
      postPrompt?.classList.add("hidden");
      postEditor?.classList.remove("hidden");

      // Display-only check. Firestore rules must enforce owner permissions.
      db.collection("roles").doc(currentUser.uid).get()
        .then(doc => {
          const role = doc.exists ? doc.data().role : "";
          const canSeeStudio =
            currentUser.uid === SUPER_OWNER_UID ||
            role === "owner" ||
            role === "editor";

          if (studioBtn) {
            studioBtn.classList.toggle("hidden", !canSeeStudio);
          }
        })
        .catch(() => studioBtn?.classList.add("hidden"));

    } else {
      if (container) {
        container.replaceChildren();

        const button = document.createElement("button");
        button.type = "button";
        button.className =
          "px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold shadow-sm";
        button.textContent = "लॉगिन करें";
        button.addEventListener("click", openAuthModal);
        container.appendChild(button);
      }

      if (navLabel) navLabel.textContent = "लॉगिन";
      studioBtn?.classList.add("hidden");
      postPrompt?.classList.remove("hidden");
      postEditor?.classList.add("hidden");
    }
  }

  function normaliseLoginIdentifier(identifier) {
    const value = String(identifier || "").trim();

    // Preserve compatibility with the previous phone-number login pattern.
    // This only works if Firebase Auth accounts were created using this scheme.
    if (/^[6-9]\d{9}$/.test(value)) {
      return `user_${value}@bishnoism.internal`;
    }

    return value;
  }

  async function handleAuthSubmit(event) {
    event?.preventDefault();

    const identifier = $("loginIdentifier")?.value.trim();
    const password = $("loginPass")?.value || "";
    const name = $("loginName")?.value.trim() || "";

    if (!identifier || !password) {
      showToast("कृपया लॉगिन विवरण भरें।");
      return;
    }

    if (password.length < 6) {
      showToast("पासवर्ड कम से कम ६ अक्षरों का होना चाहिए।");
      return;
    }

    if (isRegisterMode && name.length > 80) {
      showToast("नाम बहुत लंबा है।");
      return;
    }

    const email = normaliseLoginIdentifier(identifier);

    try {
      if (isRegisterMode) {
        const credential = await auth.createUserWithEmailAndPassword(email, password);

        await db.collection("users").doc(credential.user.uid).set({
          name: safeText(name || "धर्मप्रेमी सदस्य", 80),
          phone: /^[6-9]\d{9}$/.test(identifier) ? identifier : "",
          email: credential.user.email || "",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        showToast("✅ पंजीकरण सफल हुआ!");
      } else {
        await auth.signInWithEmailAndPassword(email, password);
        showToast("✅ स्वागत है!");
      }

      closeAuthModal();
    } catch (err) {
      console.error("Authentication failed:", err);
      showToast(friendlyAuthError(err));
    }
  }

  async function signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      closeAuthModal();
      showToast("Google लॉगिन सफल हुआ!");
    } catch (err) {
      console.error("Google sign-in failed:", err);
      showToast(friendlyAuthError(err));
    }
  }

  function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;

    $("nameRow")?.classList.toggle("hidden", !isRegisterMode);

    if ($("authTitle")) {
      $("authTitle").textContent = isRegisterMode ? "नया पंजीकरण" : "लॉगिन (Sign In)";
    }
    if ($("authSubmitBtn")) {
      $("authSubmitBtn").textContent = isRegisterMode ? "खाता बनाएं" : "लॉगिन करें";
    }
    if ($("authToggleBtn")) {
      $("authToggleBtn").textContent = isRegisterMode
        ? "पहले से पंजीकृत हैं? लॉगिन करें"
        : "नए सदस्य हैं? पंजीकरण करें";
    }
  }

  function openAuthModal() {
    $("authModal")?.classList.remove("hidden");
  }

  function closeAuthModal() {
    $("authModal")?.classList.add("hidden");
  }

  function openProfileModal() {
    if (!currentUser) return openAuthModal();

    const modal = $("userProfileModal");
    if (!modal) return;

    if ($("profHeaderNameDisplay")) {
      $("profHeaderNameDisplay").textContent = currentUser.name || "सदस्य";
    }
    if ($("profEditName")) $("profEditName").value = currentUser.name || "";
    if ($("profEditLocation")) $("profEditLocation").value = currentUser.location || "";

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeProfileModal() {
    const modal = $("userProfileModal");
    modal?.classList.add("hidden");
    modal?.classList.remove("flex");
  }

  async function saveProfile() {
    if (!auth.currentUser || !currentUser) return openAuthModal();

    const newName = $("profEditName")?.value.trim() || "";
    const newLocation = $("profEditLocation")?.value.trim() || "";

    if (!newName) return showToast("कृपया नाम खाली न छोड़ें।");
    if (newName.length > 80 || newLocation.length > 120) {
      return showToast("नाम या स्थान की जानकारी बहुत लंबी है।");
    }

    try {
      await db.collection("users").doc(auth.currentUser.uid).set({
        name: safeText(newName, 80),
        location: safeText(newLocation, 120),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      currentUser.name = safeText(newName, 80);
      currentUser.location = safeText(newLocation, 120);

      updateAuthUI();
      closeProfileModal();
      showToast("प्रोफ़ाइल सुरक्षित हो गई!");
    } catch (err) {
      reportFirestoreError("Profile update failed:", err);
    }
  }

  async function logout(silent = false) {
    try {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = null;

      await auth.signOut();
      closeProfileModal();
      switchTab("home");

      if (!silent) showToast("सफलतापूर्वक लॉगआउट हुआ।");
    } catch (err) {
      console.error("Logout failed:", err);
      showToast("लॉगआउट पूरा नहीं हो सका।");
    }
  }

  function openProfileOrAuth() {
    if (currentUser) openProfileModal();
    else openAuthModal();
  }

  // 7. DAILY BANNER AND WHATSAPP
  function listenBanner() {
    if (bannerListenerStarted) return;
    bannerListenerStarted = true;

    db.collection("settings").doc("dailySandesh").onSnapshot(
      doc => {
        const element = $("dailyBannerText");
        if (!element) return;

        element.textContent =
          doc.exists ? safeText(doc.data().text || "", 1500) : "";
      },
      err => console.warn("Daily banner unavailable:", err)
    );
  }

  function shareBannerWhatsApp() {
    const bannerText = $("dailyBannerText")?.textContent || "";

    const text =
      `🌿 विश्नोई समाज पावन विचार\n\n"${bannerText}"\n\n` +
      `२९ नियम एवं ज्ञान मंच से जुड़ें:\n${window.location.origin}`;

    openExternal(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    );
  }

  // 8. PANCHANG AND AMAVASYA
  // This is an approximate lunar-cycle display, NOT a verified Panchang.
  function computeAutoPanchang() {
    const now = new Date();
    const weekdays = [
      "रविवार", "सोमवार", "मंगलवार", "बुधवार",
      "गुरुवार", "शुक्रवार", "शनिवार"
    ];

    const samvat = now.getFullYear() + (now.getMonth() >= 3 ? 57 : 56);

    const dateElement = $("autoPanchangDate");
    const detailsElement = $("autoPanchangDetails");

    if (dateElement) {
      dateElement.textContent = `${weekdays[now.getDay()]} • अनुमानित विक्रम संवत ${samvat}`;
    }

    if (detailsElement) {
      detailsElement.textContent =
        `आज: ${now.toLocaleDateString("hi-IN", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })} | चंद्र-चक्र का अनुमान। सटीक तिथि के लिए स्थानीय पंचांग देखें।`;
    }

    // Use a rough lunar cycle only as a fallback.
    const synodicDays = 29.530588;
    const referenceNewMoon = Date.parse("2026-01-18T00:00:00Z");
    const elapsedDays = (now.getTime() - referenceNewMoon) / 86400000;
    const age = ((elapsedDays % synodicDays) + synodicDays) % synodicDays;
    const daysUntil = synodicDays - age;

    if (!amavasyaTargetDate || amavasyaTargetDate.getTime() <= now.getTime()) {
      amavasyaTargetDate = new Date(now.getTime() + daysUntil * 86400000);
    }

    startAmavasyaTimer();
  }

  function listenAmavasyaConfig() {
    if (amavasyaListenerStarted) return;
    amavasyaListenerStarted = true;

    db.collection("settings").doc("amavasyaConfig").onSnapshot(
      doc => {
        if (doc.exists) {
          const data = doc.data();

          if ($("amavasyaTitleDisplay")) {
            $("amavasyaTitleDisplay").textContent =
              safeText(data.name || "अमावस्या", 120);
          }

          if ($("amavasyaFastingNote")) {
            $("amavasyaFastingNote").textContent =
              safeText(data.desc || "", 500);
          }

          if (typeof data.date === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
            const parsed = new Date(`${data.date}T00:00:00`);

            if (Number.isFinite(parsed.getTime()) &&
                parsed.getTime() > Date.now()) {
              amavasyaTargetDate = parsed;
            }
          }
        }

        startAmavasyaTimer();
      },
      err => console.warn("Amavasya configuration unavailable:", err)
    );
  }

  function startAmavasyaTimer() {
    if (amavasyaTimer) clearInterval(amavasyaTimer);

    function update() {
      const box = $("amavasyaCountdownBox");
      if (!box || !amavasyaTargetDate) return;

      const diff = amavasyaTargetDate.getTime() - Date.now();

      if (diff <= 0) {
        box.textContent = "🚩 अनुमानित अमावस्या समय आ गया है। स्थानीय पंचांग से पुष्टि करें।";
        clearInterval(amavasyaTimer);
        amavasyaTimer = null;
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff / 3600000) % 24);
      const minutes = Math.floor((diff / 60000) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      // Values are numeric; HTML is fixed and contains no user content.
      box.innerHTML =
        `समय शेष: <b>${days} दिन : ${hours} घं : ${minutes} मि : ${seconds} से</b>`;
    }

    update();
    amavasyaTimer = setInterval(update, 1000);
  }

  // 9. DIGITAL JAAP MALA
  function tapMalaBead() {
    malaBeadCount += 1;
    malaTotalCount += 1;

    if (malaBeadCount >= 108) {
      malaBeadCount = 0;
      malaLapsCount += 1;

      if (navigator.vibrate) navigator.vibrate([100, 50, 150]);

      if (typeof window.confetti === "function") {
        window.confetti({ particleCount: 50, spread: 60 });
      }

      showToast("ॐ शांति! एक संपूर्ण जप माला (१०८ मनके) पूर्ण हुई!");
    } else if (navigator.vibrate) {
      navigator.vibrate(35);
    }

    saveLocal("bishnoi_mala_beads", String(malaBeadCount));
    saveLocal("bishnoi_mala_laps", String(malaLapsCount));
    saveLocal("bishnoi_mala_total", String(malaTotalCount));

    renderMalaCounters();
  }

  function resetMala() {
    openConfirmModal(
      "माला शून्य करें?",
      "क्या आप जप माला गणना रीसेट करना चाहते हैं?",
      confirmed => {
        if (!confirmed) return;

        malaBeadCount = 0;
        malaLapsCount = 0;
        malaTotalCount = 0;

        saveLocal("bishnoi_mala_beads", "0");
        saveLocal("bishnoi_mala_laps", "0");
        saveLocal("bishnoi_mala_total", "0");

        renderMalaCounters();
        showToast("जप माला रीसेट हो गई।");
      }
    );
  }

  function renderMalaCounters() {
    if ($("currentBeadDisplay")) $("currentBeadDisplay").textContent = malaBeadCount;
    if ($("malaLapsDisplay")) $("malaLapsDisplay").textContent = malaLapsCount;
    if ($("malaTotalDisplay")) $("malaTotalDisplay").textContent = malaTotalCount;
    if ($("statMalaTotal")) $("statMalaTotal").textContent = malaTotalCount;
    if ($("statMalaLaps")) $("statMalaLaps").textContent = malaLapsCount;
  }

  // 10. TREE PLEDGE COUNTER
  function listenTreeCounter() {
    if (treeListenerStarted) return;
    treeListenerStarted = true;

    db.collection("stats").doc("treePledges").onSnapshot(
      doc => {
        const element = $("treeCounterDisplay");
        if (!element) return;

        const value = doc.exists ? Number(doc.data().count) : 0;
        element.textContent =
          Number.isFinite(value) && value >= 0 ? String(Math.floor(value)) : "0";
      },
      err => console.warn("Tree pledge count unavailable:", err)
    );
  }

  async function pledgeTree() {
    if (localStorage.getItem("bishnoi_tree_pledged")) {
      return showToast("आपका पौधरोपण संकल्प पहले से इस ब्राउज़र में दर्ज है।");
    }

    try {
      // A local-storage flag is only a convenience; it cannot prevent fraud.
      // Production deployments should use an authenticated, rate-limited backend.
      await db.collection("treePledgeEntries").add({
        uid: auth.currentUser ? auth.currentUser.uid : null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      saveLocal("bishnoi_tree_pledged", "1");
      showToast("🌱 पौधरोपण संकल्प दर्ज हुआ!");
    } catch (err) {
      reportFirestoreError("Tree pledge failed:", err);
    }
  }

  // 11. AUDIO PLAYER
  function initAudioListeners() {
    const audio = $("audioElement");
    const range = $("audioRange");
    const current = $("audioCurTime");
    const duration = $("audioDurTime");
    const button = $("audioPlayBtn");

    if (!audio || audio.dataset.bishnoiBound === "1") return;
    audio.dataset.bishnoiBound = "1";

    audio.addEventListener("timeupdate", () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        if (range) range.value = String((audio.currentTime / audio.duration) * 100);
        if (current) current.textContent = formatTime(audio.currentTime);
        if (duration) duration.textContent = formatTime(audio.duration);
      }
    });

    audio.addEventListener("loadedmetadata", () => {
      if (duration) duration.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("play", () => {
      if (button) button.textContent = "⏸";
    });

    audio.addEventListener("pause", () => {
      if (button) button.textContent = "▶";
    });

    audio.addEventListener("error", () => {
      showToast("ऑडियो लोड नहीं हो सका। लिंक और इंटरनेट जाँचें।");
    });
  }

  function toggleAudio() {
    const audio = $("audioElement");
    if (!audio) return showToast("ऑडियो प्लेयर उपलब्ध नहीं है।");

    if (audio.paused) {
      audio.play().catch(() => showToast("ऑडियो चलाने की अनुमति नहीं मिली।"));
    } else {
      audio.pause();
    }
  }

  function seekAudio(delta) {
    const audio = $("audioElement");
    if (!audio || !Number.isFinite(audio.duration)) return;

    audio.currentTime = Math.max(
      0,
      Math.min(audio.duration, audio.currentTime + Number(delta || 0))
    );
  }

  function cycleAudioSpeed() {
    speedIdx = (speedIdx + 1) % audioSpeeds.length;

    const speed = audioSpeeds[speedIdx];
    const audio = $("audioElement");

    if (audio) audio.playbackRate = speed;
    if ($("audioSpeedBtn")) $("audioSpeedBtn").textContent = `${speed}x`;

    showToast(`गति: ${speed}x`);
  }

  function handleAudioSeek(value) {
    const audio = $("audioElement");
    const percentage = Number(value);

    if (!audio || !Number.isFinite(audio.duration) ||
        !Number.isFinite(percentage)) return;

    audio.currentTime =
      Math.max(0, Math.min(100, percentage)) / 100 * audio.duration;
  }

  // 12. 29 NIYAMS
  function renderNiyams(list = niyamsData) {
    const grid = $("niyamGrid");
    if (!grid) return;

    grid.replaceChildren();

    if (!list.length) {
      const empty = document.createElement("p");
      empty.className = "text-sm text-stone-500 text-center py-6";
      empty.textContent = "कोई नियम नहीं मिला। कृपया दूसरा शब्द खोजें।";
      grid.appendChild(empty);
      return;
    }

    list.forEach(niyam => {
      const card = document.createElement("div");
      const isRead = readNiyamsSet.has(niyam.num);

      card.className =
        `p-4 rounded-2xl border ${
          isRead ? "border-emerald-400 bg-emerald-50/20" :
          "border-stone-200 bg-white"
        } shadow-sm space-y-2 flex flex-col justify-between`;

      const top = document.createElement("div");
      top.className = "flex items-center justify-between text-xs";

      const number = document.createElement("span");
      number.className =
        "w-6 h-6 rounded-full bg-amber-100 text-forest font-bold flex items-center justify-center";
      number.textContent = niyam.num;

      const title = document.createElement("span");
      title.className = "text-stone-500 font-semibold";
      title.textContent = niyam.title;

      top.append(number, title);

      const rule = document.createElement("h4");
      rule.className = "font-yatra text-base text-forest mt-1";
      rule.textContent = niyam.rule;

      const description = document.createElement("p");
      description.className = "text-xs text-stone-700 leading-relaxed mt-0.5";
      description.textContent = niyam.desc;

      const body = document.createElement("div");
      body.append(top, rule, description);

      const footer = document.createElement("div");
      footer.className =
        "pt-2 border-t border-stone-100 flex items-center justify-between text-xs";

      const shareButton = document.createElement("button");
      shareButton.type = "button";
      shareButton.className = "text-emerald-700 font-bold hover:underline";
      shareButton.textContent = "साझा करें 📲";
      shareButton.addEventListener("click", () => shareNiyam(niyam.num));

      const readButton = document.createElement("button");
      readButton.type = "button";
      readButton.className = "text-stone-500 font-semibold";
      readButton.textContent = isRead ? "✓ पठित" : "पढ़े";
      readButton.addEventListener("click", () => toggleNiyamRead(niyam.num));

      footer.append(shareButton, readButton);
      card.append(body, footer);
      grid.appendChild(card);
    });
  }

  function toggleNiyamRead(number) {
    if (!Number.isInteger(number) || number < 1 || number > 29) return;

    if (readNiyamsSet.has(number)) readNiyamsSet.delete(number);
    else readNiyamsSet.add(number);

    saveLocal("bishnoi_read_niyams", JSON.stringify([...readNiyamsSet]));
    renderNiyams(niyamsData);
  }

  function filterNiyams(query) {
    const q = safeText(query, 100).toLowerCase();

    const matches = niyamsData.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.rule.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q)
    );

    renderNiyams(matches);
  }

  function shareNiyam(number) {
    const item = niyamsData.find(n => n.num === Number(number));
    if (!item) return;

    const text =
      `🌿 विश्नोई धर्म नियम ${item.num}: ${item.title}\n` +
      `${item.rule}\n\nसंपूर्ण २९ नियम पढ़ें:\n${window.location.origin}`;

    openExternal(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    );
  }

  // 13. PDF LIBRARY
  function listenPdfs() {
    if (pdfListenerStarted) return;
    pdfListenerStarted = true;

    db.collection("pdfs").orderBy("createdAt", "desc").onSnapshot(
      snapshot => {
        const grid = $("pdfGrid");
        if (!grid) return;

        grid.replaceChildren();

        const builtInCard = document.createElement("div");
        builtInCard.className =
          "p-4 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between space-y-3";

        builtInCard.innerHTML = `
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">पवित्र ग्रंथ</span>
            <h3 class="font-yatra text-forest text-lg mt-1">श्री सबदवाणी (१२० शब्द)</h3>
            <p class="text-xs text-stone-600 mt-1">गुरु जम्भेश्वर भगवान द्वारा उच्चरित पावन १२० शब्दों का संग्रह।</p>
          </div>
          <div class="pt-3 border-t border-stone-100 flex items-center justify-between">
            <button type="button" data-action="read" class="px-3.5 py-1.5 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl shadow">📖 पढ़ें</button>
            <a href="./shabadwani.pdf" download class="px-3.5 py-1.5 bg-forest text-white text-xs font-semibold rounded-xl">डाउनलोड</a>
          </div>
        `;

        builtInCard.querySelector('[data-action="read"]').addEventListener(
          "click",
          () => openPdf("श्री सबदवाणी (१२० शब्द)", "./shabadwani.pdf")
        );

        grid.appendChild(builtInCard);

        snapshot.forEach(documentSnapshot => {
          const data = documentSnapshot.data() || {};
          const title = safeText(data.title || "साहित्य", 150);
          const tag = safeText(data.tag || "साहित्य", 50);
          const link = safeHttpUrl(data.link);

          const card = document.createElement("div");
          card.className =
            "p-4 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between space-y-3";

          const header = document.createElement("div");
          header.innerHTML = `
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">${escapeHTML(tag)}</span>
            <h3 class="font-yatra text-forest text-lg mt-1">${escapeHTML(title)}</h3>
          `;

          const footer = document.createElement("div");
          footer.className =
            "pt-3 border-t border-stone-100 flex items-center justify-between";

          const readButton = document.createElement("button");
          readButton.type = "button";
          readButton.className =
            "px-3.5 py-1.5 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl shadow";
          readButton.textContent = "📖 पढ़ें";
          readButton.disabled = !link;

          readButton.addEventListener("click", () => {
            if (link) openPdf(title, link);
          });

          const downloadLink = document.createElement("a");
          downloadLink.className =
            "px-3.5 py-1.5 bg-forest text-white text-xs font-semibold rounded-xl";
          downloadLink.textContent = "डाउनलोड";

          if (link) {
            downloadLink.href = link;
            downloadLink.target = "_blank";
            downloadLink.rel = "noopener noreferrer";
          } else {
            downloadLink.href = "#";
            downloadLink.setAttribute("aria-disabled", "true");
            downloadLink.addEventListener("click", e => e.preventDefault());
          }

          footer.append(readButton, downloadLink);
          card.append(header, footer);
          grid.appendChild(card);
        });
      },
      err => {
        reportFirestoreError("PDF library unavailable:", err);
      }
    );
  }

  function openPdf(title, link) {
    const safeUrl = safeHttpUrl(link);

    if (!safeUrl) {
      showToast("PDF का लिंक मान्य नहीं है।");
      return;
    }

    const modal = $("inbuiltPdfModal");
    const frame = $("pdfEmbedFrame");

    if ($("pdfViewerTitle")) {
      $("pdfViewerTitle").textContent = safeText(title, 150);
    }

    if ($("pdfDirectDownloadLink")) {
      $("pdfDirectDownloadLink").href = safeUrl;
      $("pdfDirectDownloadLink").target = "_blank";
      $("pdfDirectDownloadLink").rel = "noopener noreferrer";
    }

    if (frame) {
      // Prevent scripts inside an embedded PDF page from receiving
      // unnecessary access to the parent page.
      frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
      frame.src = safeUrl;
      frame.title = safeText(title, 150);
    }

    modal?.classList.remove("hidden");
    modal?.classList.add("flex");
  }

  function closePdfViewer() {
    const frame = $("pdfEmbedFrame");
    if (frame) frame.src = "about:blank";

    $("inbuiltPdfModal")?.classList.add("hidden");
    $("inbuiltPdfModal")?.classList.remove("flex");
  }

  // 14. QUIZ ENGINE
  function validQuestion(question) {
    return Boolean(
      question &&
      typeof question.q === "string" &&
      question.q.trim().length > 0 &&
      Array.isArray(question.opts) &&
      question.opts.length >= 2 &&
      question.opts.length <= 6 &&
      question.opts.every(option => typeof option === "string") &&
      Number.isInteger(question.ans) &&
      question.ans >= 0 &&
      question.ans < question.opts.length
    );
  }

  const fallbackQuestions = [
    {
      q: "खेजड़ली गाँव में ३६३ लोगों का पर्यावरण बलिदान किस वर्ष हुआ था?",
      opts: ["1730 ईस्वी", "1485 ईस्वी", "1857 ईस्वी", "1947 ईस्वी"],
      ans: 0
    },
    {
      q: "गुरु जम्भेश्वर भगवान ने २९ नियमों का उपदेश किस स्थान पर दिया?",
      opts: ["मुकाम", "समराथल धोरा", "जांगलू", "लालासर"],
      ans: 1
    },
    {
      q: "अमृता देवी बिश्नोई का प्रसिद्ध वचन किससे संबंधित है?",
      opts: ["व्यापार", "वृक्ष रक्षा", "युद्ध", "खेती"],
      ans: 1
    }
  ];

  function initQuizEngine() {
    if (quizListenerStarted) return;
    quizListenerStarted = true;

    db.collection("quiz").onSnapshot(
      snapshot => {
        if (snapshot.empty) {
          quizList = fallbackQuestions.slice();
        } else {
          quizList = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(validQuestion);

          if (!quizList.length) {
            quizList = fallbackQuestions.slice();
            showToast("प्रश्न बैंक में समस्या है। अभ्यास प्रश्न दिखाए जा रहे हैं।");
          }
        }
      },
      err => {
        console.error("Quiz bank unavailable:", err);
        quizList = fallbackQuestions.slice();
        showToast("ऑनलाइन प्रश्न नहीं मिले। अभ्यास प्रश्न उपलब्ध हैं।");
      }
    );

    db.collection("settings").doc("dailyWinners").onSnapshot(
      doc => {
        if (!doc.exists) return;

        const data = doc.data();

        [
          ["winner1Name", data.p1Name],
          ["winner1Score", data.p1Score],
          ["winner2Name", data.p2Name],
          ["winner2Score", data.p2Score],
          ["winner3Name", data.p3Name],
          ["winner3Score", data.p3Score]
        ].forEach(([id, value]) => {
          if ($(id)) $(id).textContent = safeText(value || "—", 100);
        });
      },
      err => console.warn("Quiz winners unavailable:", err)
    );
  }

  function startQuiz() {
    if (!quizList.length) {
      quizList = fallbackQuestions.slice();
    }

    currentQ = 0;
    qScore = 0;
    isAnswering = false;
    quizFinished = false;

    $("quizIntroCard")?.classList.add("hidden");
    $("quizActiveBox")?.classList.remove("hidden");

    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const box = $("quizActiveBox");
    if (!box) return;

    if (!quizList.length) {
      box.textContent = "प्रश्न अभी उपलब्ध नहीं हैं। कृपया बाद में प्रयास करें।";
      return;
    }

    if (currentQ >= quizList.length) {
      finishQuiz();
      return;
    }

    const question = quizList[currentQ];

    if (!validQuestion(question)) {
      currentQ++;
      renderQuizQuestion();
      return;
    }

    isAnswering = false;
    box.replaceChildren();

    const wrapper = document.createElement("div");
    wrapper.className = "space-y-4";

    const top = document.createElement("div");
    top.className = "flex justify-between items-center text-xs font-bold text-forest";

    const number = document.createElement("span");
    number.textContent = `प्रश्न ${currentQ + 1} / ${quizList.length}`;

    const score = document.createElement("span");
    score.className = "px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full";
    score.textContent = `प्राप्तांक: ${qScore}`;

    top.append(number, score);

    const heading = document.createElement("h4");
    heading.className = "font-bold text-base text-forest";
    heading.textContent = question.q;

    const options = document.createElement("div");
    options.className = "space-y-2";

    question.opts.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "opt-btn w-full text-left p-3 text-xs sm:text-sm rounded-xl border border-stone-200 hover:border-forest bg-white font-medium transition flex items-center justify-between";

      const label = document.createElement("span");
      label.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

      button.appendChild(label);
      button.addEventListener("click", () => chooseOption(index));
      options.appendChild(button);
    });

    wrapper.append(top, heading, options);
    box.appendChild(wrapper);
  }

  function chooseOption(index) {
    if (isAnswering || quizFinished) return;

    const question = quizList[currentQ];
    if (!validQuestion(question) || !Number.isInteger(index)) return;

    if (index < 0 || index >= question.opts.length) return;

    isAnswering = true;

    const buttons = document.querySelectorAll("#quizActiveBox .opt-btn");

    buttons.forEach(button => {
      button.disabled = true;
    });

    if (index === question.ans) {
      qScore++;
      buttons[index]?.classList.add(
        "bg-emerald-50", "border-emerald-500", "text-emerald-900"
      );
      showToast("✓ सही उत्तर!");
    } else {
      buttons[index]?.classList.add(
        "bg-rose-50", "border-rose-500", "text-rose-900"
      );
      buttons[question.ans]?.classList.add(
        "bg-emerald-50", "border-emerald-500"
      );
      showToast("✕ उत्तर गलत है!");
    }

    setTimeout(() => {
      currentQ++;
      renderQuizQuestion();
    }, 900);
  }

  async function finishQuiz() {
    if (quizFinished) return;
    quizFinished = true;

    const total = quizList.length;
    const percentage = total ? Math.round((qScore / total) * 100) : 0;
    const box = $("quizActiveBox");
    if (!box) return;

    box.innerHTML = `
      <div class="text-center space-y-4 py-4">
        <div class="text-5xl">🏆</div>
        <h3 class="font-yatra text-2xl text-forest">अभ्यास पूर्ण हुआ!</h3>
        <p class="text-sm text-stone-600">आपका अभ्यास स्कोर:
          <strong class="text-terracotta text-lg">${qScore} / ${total}</strong>
          (${percentage}%)
        </p>
        <p class="text-xs text-stone-500">
          यह अभ्यास स्कोर है; इसे सर्वर द्वारा सत्यापित आधिकारिक परीक्षा परिणाम न मानें।
        </p>
        <div class="flex justify-center gap-2 pt-2">
          <button type="button" id="quizRestartBtn"
            class="px-4 py-2 bg-stone-200 text-stone-800 rounded-xl font-bold text-xs">
            पुनः अभ्यास
          </button>
          <button type="button" id="quizCertificateBtn"
            class="px-4 py-2 bg-terracotta text-white rounded-xl font-bold text-xs shadow">
            📜 अभ्यास प्रमाण-पत्र
          </button>
        </div>
      </div>
    `;

    $("quizRestartBtn")?.addEventListener("click", startQuiz);
    $("quizCertificateBtn")?.addEventListener("click", () => {
      downloadCertificate(currentUser?.name || "प्रतिभागी", percentage);
    });

    if (typeof window.confetti === "function") {
      window.confetti({ particleCount: 60, spread: 70 });
    }

    if (currentUser && auth.currentUser) {
      try {
        // This record is for tracking practice only.
        // Do not use client-written results for official rankings.
        await db.collection("quizAttempts").add({
          uid: auth.currentUser.uid,
          name: safeText(currentUser.name, 80),
          score: qScore,
          total,
          percentage,
          type: "practice",
          submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (err) {
        console.warn("Practice result could not be saved:", err);
      }
    }
  }

  function downloadCertificate(name, score) {
    const canvas = $("certCanvas");
    if (!canvas) return showToast("प्रमाण-पत्र टेम्पलेट उपलब्ध नहीं है।");

    const safeName = safeText(name || "प्रतिभागी", 60);
    const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
    const context = canvas.getContext("2d");

    if (!context) return showToast("प्रमाण-पत्र तैयार नहीं हो सका।");

    canvas.width = 1000;
    canvas.height = 720;

    context.fillStyle = "#FAF6EE";
    context.fillRect(0, 0, 1000, 720);

    context.strokeStyle = "#143622";
    context.lineWidth = 16;
    context.strokeRect(20, 20, 960, 680);

    context.strokeStyle = "#B34A1B";
    context.lineWidth = 4;
    context.strokeRect(36, 36, 928, 648);

    context.textAlign = "center";
    context.fillStyle = "#B34A1B";
    context.font = "bold 20px sans-serif";
    context.fillText("॥ ॐ विष्णवे नमः • श्री जम्भेश्वराय नमः ॥", 500, 90);

    context.fillStyle = "#143622";
    context.font = "bold 36px sans-serif";
    context.fillText("विश्नोई समाज डिजिटल ज्ञान अभ्यास", 500, 160);

    context.fillStyle = "#B34A1B";
    context.font = "bold 22px sans-serif";
    context.fillText("★ अभ्यास सम्मान-पत्र ★", 500, 210);

    context.fillStyle = "#44403C";
    context.font = "18px sans-serif";
    context.fillText("यह अभ्यास प्रमाणित करता है कि", 500, 290);

    context.fillStyle = "#143622";
    context.font = "bold 34px sans-serif";
    context.fillText(safeName, 500, 350);

    context.fillStyle = "#292524";
    context.font = "18px sans-serif";
    context.fillText(`अभ्यास में ${safeScore}% अंक प्राप्त किए।`, 500, 420);

    context.fillStyle = "#143622";
    context.fillRect(200, 480, 600, 40);

    context.fillStyle = "#FDE68A";
    context.font = "bold 16px sans-serif";
    context.fillText('"जीव दया पालणी, रूंख लीलो नी घावै"', 500, 506);

    context.textAlign = "left";
    context.fillStyle = "#44403C";
    context.font = "bold 14px sans-serif";
    context.fillText(
      `दिनांक: ${new Date().toLocaleDateString("hi-IN")}`,
      80,
      620
    );

    context.textAlign = "right";
    context.fillStyle = "#143622";
    context.font = "bold 16px sans-serif";
    context.fillText("विश्नोई समाज डिजिटल मंच", 920, 620);

    try {
      const link = document.createElement("a");
      link.download = "Bishnoi_Practice_Certificate.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("अभ्यास प्रमाण-पत्र डाउनलोड हुआ!");
    } catch (err) {
      console.error("Certificate export failed:", err);
      showToast("प्रमाण-पत्र डाउनलोड नहीं हो सका।");
    }
  }

  // 15. COMMUNITY
  function initCommunityChat() {
    if (communityListenerStarted) return;
    communityListenerStarted = true;

    db.collection("posts").orderBy("createdAt", "desc").limit(40).onSnapshot(
      snapshot => {
        allPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        renderCommunityFeed();
      },
      err => reportFirestoreError("Community feed unavailable:", err)
    );

    db.collection("settings").doc("pinnedChat").onSnapshot(
      doc => {
        const banner = $("pinnedChatBanner");
        const text = $("pinnedChatText");

        if (doc.exists && doc.data().content) {
          if (text) {
            text.textContent =
              `${safeText(doc.data().author || "व्यवस्थापक", 80)}: ` +
              `"${safeText(doc.data().content, 500)}"`;
          }
          banner?.classList.remove("hidden");
        } else {
          banner?.classList.add("hidden");
        }
      },
      err => console.warn("Pinned message unavailable:", err)
    );
  }

  function renderCommunityFeed() {
    const feed = $("communityFeed");
    if (!feed) return;

    feed.replaceChildren();

    const filtered = currentChatFilter === "all"
      ? allPosts
      : allPosts.filter(post =>
          (post.topic || "सामान्य चर्चा") === currentChatFilter
        );

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "text-center py-6 text-xs text-stone-500";
      empty.textContent = "कोई संदेश नहीं मिला। पहला विचार साझा करें!";
      feed.appendChild(empty);
      return;
    }

    filtered.forEach(post => {
      const card = document.createElement("div");
      card.className =
        "p-3 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1";

      const top = document.createElement("div");
      top.className = "flex items-center justify-between text-xs";

      const author = document.createElement("span");
      author.className = "font-bold text-forest";
      author.textContent = safeText(post.author || "धर्मप्रेमी", 80);

      const time = document.createElement("span");
      time.className = "text-[10px] text-stone-400";

      let date = null;

      try {
        if (post.createdAt && typeof post.createdAt.toDate === "function") {
          date = post.createdAt.toDate();
        }
      } catch (_) {}

      time.textContent = date && Number.isFinite(date.getTime())
        ? date.toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" })
        : "हाल ही में";

      top.append(author, time);

      const content = document.createElement("p");
      content.className =
        "text-xs sm:text-sm text-stone-800 break-words leading-relaxed";
      content.textContent = safeText(post.content || "", 2000);

      card.append(top, content);
      feed.appendChild(card);
    });
  }

  async function submitPost() {
    if (!auth.currentUser || !currentUser) return openAuthModal();

    const input = $("postText");
    const content = safeText(input?.value || "", 2000);

    if (!content) return showToast("कृपया संदेश लिखें!");
    if (content.length < 2) return showToast("संदेश थोड़ा और स्पष्ट लिखें।");

    if (/(https?:\/\/|www\.|[\w.-]+\.(com|xyz|net|org|in)\b|[6-9]\d{9})/i.test(content)) {
      return showToast("सुरक्षा कारणों से बाहरी लिंक अथवा मोबाइल नंबर भेजना वर्जित है।");
    }

    if (Date.now() - lastPostTime < 8000) {
      return showToast("कृपया अगले संदेश के लिए कुछ सेकंड प्रतीक्षा करें।");
    }

    try {
      await db.collection("posts").add({
        uid: auth.currentUser.uid,
        author: safeText(currentUser.name || "धर्मप्रेमी", 80),
        content,
        topic: "सामान्य चर्चा",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      lastPostTime = Date.now();
      if (input) input.value = "";
      showToast("विचार प्रेषित हुआ!");
    } catch (err) {
      reportFirestoreError("Post submission failed:", err);
    }
  }

  function filterTopic(topic) {
    const allowed = ["all", "सामान्य चर्चा"];
    currentChatFilter = allowed.includes(topic) ? topic : "all";
    renderCommunityFeed();
  }

  // 16. HISTORY AND CHILDREN'S STORIES
  function renderHistoryAndKids() {
    const historyView = $("historySubView");
    const kidsView = $("kidsSubView");

    if (!historyView || !kidsView) return;

    function buildStory(item, isKids) {
      const card = document.createElement("div");
      card.className = isKids
        ? "p-5 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 border border-amber-300 shadow-sm space-y-2"
        : "p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2";

      const badge = document.createElement("span");
      badge.className = isKids
        ? "px-3 py-0.5 bg-amber-400 text-stone-950 rounded-full text-xs font-bold"
        : "px-2.5 py-0.5 bg-emerald-50 text-forest border border-emerald-200 rounded-full text-xs font-bold";
      badge.textContent = item.badge;

      const heading = document.createElement("h3");
      heading.className = "font-yatra text-lg text-forest";
      heading.textContent = item.title;

      const paragraph = document.createElement("p");
      paragraph.className = "text-xs text-stone-700 leading-relaxed";
      paragraph.textContent = item.content;

      const moral = document.createElement("div");
      moral.className = isKids
        ? "p-2.5 rounded-2xl bg-emerald-900 text-amber-200 text-xs font-bold"
        : "p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold";
      moral.textContent = item.moral;

      card.append(badge, heading, paragraph, moral);
      return card;
    }

    historyView.replaceChildren();
    kidsView.replaceChildren();

    historyItemsList.forEach(item => {
      if (item.type === "history") {
        historyView.appendChild(buildStory(item, false));
      } else if (item.type === "kids") {
        kidsView.appendChild(buildStory(item, true));
      }
    });
  }

  // 17. GLOBAL SEARCH
  function setupGlobalSearch() {
    const input = $("globalSearchInput");
    if (!input || input.dataset.bishnoiSearchBound === "1") return;

    input.dataset.bishnoiSearchBound = "1";

    input.addEventListener("input", () => {
      const query = safeText(input.value, 100).toLowerCase();

      if (!query) {
        renderNiyams(niyamsData);
        return;
      }

      const matchingNiyams = niyamsData.filter(item =>
        `${item.title} ${item.rule} ${item.desc}`.toLowerCase().includes(query)
      );

      const matchingHistory = historyItemsList.filter(item =>
        `${item.title} ${item.content} ${item.moral}`.toLowerCase().includes(query)
      );

      if (matchingNiyams.length) {
        switchTab("library");
        renderNiyams(matchingNiyams);
        return;
      }

      if (matchingHistory.length) {
        switchTab("history");
        switchHistorySubTab(
          matchingHistory.some(item => item.type === "kids")
            ? "kids"
            : "full-history"
        );
        showToast("इतिहास और बाल-कथा में परिणाम मिले।");
        return;
      }

      // Avoid leaving stale results visible.
      if (currentActiveTab === "library") renderNiyams([]);
    });
  }

  // 18. STARTUP
  function initializeApp() {
    initAuthEngine();
    computeAutoPanchang();
    listenAmavasyaConfig();
    listenBanner();
    listenTreeCounter();
    renderMalaCounters();
    renderNiyams(niyamsData);
    listenPdfs();
    initAudioListeners();
    initQuizEngine();
    initCommunityChat();
    renderHistoryAndKids();
    setupGlobalSearch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
  } else {
    initializeApp();
  }

  // 19. PUBLIC NAMESPACES — KEEP COMPATIBILITY WITH index.html
  window.BishnoiApp = {
    showToast,
    switchTab,
    switchHistorySubTab,
    tapMalaBead,
    resetMala,
    filterNiyams,
    shareNiyam,
    openPdf,
    closePdfViewer,
    toggleAudio,
    seekAudio,
    cycleAudioSpeed,
    handleAudioSeek,
    pledgeTree,
    shareBannerWhatsApp,
    openConfirmModal,
    closeConfirmModal,
    openProfileOrAuth,
    toggleNiyamRead
  };

  window.BishnoiAuth = {
    handleAuthSubmit,
    signInWithGoogle,
    toggleAuthMode,
    openAuthModal,
    closeAuthModal,
    openProfileModal,
    closeProfileModal,
    saveProfile,
    logout
  };

  window.BishnoiQuiz = {
    startQuiz,
    chooseOption,
    downloadCertificate
  };

  window.BishnoiCommunity = {
    submitPost,
    filterTopic
  };

  // Legacy handlers used by older HTML onclick attributes.
  window.switchTab = switchTab;
  window.tapMalaBead = tapMalaBead;
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.handleAuthSubmit = handleAuthSubmit;
  window.signInOrVerifyWithGoogle = signInWithGoogle;
  window.toggleAuthMode = toggleAuthMode;
  window.openProfileModal = openProfileModal;
  window.closeProfileModal = closeProfileModal;
  window.saveUserProfileChanges = saveProfile;
  window.logoutUser = logout;
  window.startQuizNow = startQuiz;
  window.pledgeTree = pledgeTree;
  window.shareBannerWhatsApp = shareBannerWhatsApp;

})();
