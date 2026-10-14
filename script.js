/* ==========================================================================
   विश्नोई समाज डिजिटल मंच (Bishnoi Digital Platform)
   Complete Production Master Script (script.js) — Dedicated for index.html
   ========================================================================== */

(function() {
  'use strict';

  // 1. FIREBASE CONFIGURATION & INITIALIZATION
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
  const auth = firebase.auth();
  const SUPER_OWNER_UID = "8YRBWWMKG2OUW6cmzZkGbFgOqyp2";

  // 2. GLOBAL APPLICATION STATE
  let currentUser = null;
  let isRegisterMode = false;
  let currentActiveTab = 'home';
  let confirmCallback = null;
  let inactivityTimer = null;

  // Quiz State
  let quizList = [];
  let currentQ = 0;
  let qScore = 0;
  let isAnswering = false;

  // Mala State
  let malaBeadCount = parseInt(localStorage.getItem('bishnoi_mala_beads') || '0', 10);
  let malaLapsCount = parseInt(localStorage.getItem('bishnoi_mala_laps') || '0', 10);
  let malaTotalCount = parseInt(localStorage.getItem('bishnoi_mala_total') || '0', 10);
  let readNiyamsSet = new Set(JSON.parse(localStorage.getItem('bishnoi_read_niyams') || '[]'));

  // Amavasya & Panchang State
  let amavasyaTargetDate = null;
  let amavasyaTimer = null;

  // Audio State
  const audioSpeeds = [1, 1.25, 1.5];
  let speedIdx = 0;

  // Community Chat State
  let allPosts = [];
  let currentChatFilter = 'all';
  let lastPostTime = 0;

  // 3. AUTHENTIC 29 NIYAMS DATA
  const niyamsData = [
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

  const historyItemsList = [
    {
      type: 'history',
      badge: 'इतिहास अध्याय • १७३० ई.',
      title: 'खेजड़ली का अमर बलिदान — ३६३ हुतात्माओं की गौरवगाथा',
      content: 'सन् १७३० (विक्रम संवत १७८७, भाद्रपद शुक्ल दशमी) को जोधपुर के खेजड़ली गाँव में माता अमृता देवी बिश्नोई और उनकी तीन पुत्रियों (आसू, रतनी, भागू) सहित ३६३ बिश्नोई वीरों व वीरांगनाओं ने हरे खेजड़ी वृक्षों की रक्षा के लिए अपने शीश समर्पित कर दिए।',
      moral: 'सिर साटै रूंख रहै, तो भी सस्तो जाण — प्रकृति और धर्म की रक्षा प्राणों से भी बढ़कर है।'
    },
    {
      type: 'kids',
      badge: '🦌 बाल संस्कार कहानी',
      title: 'नन्हे हिरण का सच्चा मित्र',
      content: 'एक बार थार के रेगिस्तान में एक नन्हा चिंकारा प्यास से व्याकुल था। गाँव के बालकों ने उसे देखा, दौड़कर अपने घर से छना हुआ शीतल जल पिलाया और उसकी रक्षा की। वह नन्हा हिरण भयमुक्त होकर गाँव के आँगन में बच्चों के साथ खेलने लगा।',
      moral: '🌟 सीख: मूक पशु-पक्षी हमारे परिवार की तरह हैं। घर के बाहर पक्षियों व जीवों के लिए परिंडा अवश्य रखें।'
    }
  ];

  // 4. TOAST NOTIFICATIONS & CONFIRMATION MODALS
  function showToast(msg) {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;
    toastMsg.innerText = msg;
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

  // 5. NAVIGATION & TAB SWITCHING
  function switchTab(tabId) {
    currentActiveTab = tabId;
    const allTabs = ['home', 'library', 'quiz', 'community', 'mala', 'history'];
    allTabs.forEach(t => document.getElementById(`tab-${t}`)?.classList.add('hidden'));

    const bnavs = ['home', 'library', 'quiz', 'community', 'profile'];
    bnavs.forEach(b => document.getElementById(`bnav-${b}`)?.classList.remove('bnav-active'));

    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.remove('hidden');

    const activeNavKey = (tabId === 'mala' || tabId === 'history') ? 'home' : tabId;
    document.getElementById(`bnav-${activeNavKey}`)?.classList.add('bnav-active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchHistorySubTab(sub) {
    const hView = document.getElementById('historySubView');
    const kView = document.getElementById('kidsSubView');
    const hBtn = document.getElementById('sub-history-btn');
    const kBtn = document.getElementById('sub-kids-btn');

    if (sub === 'full-history') {
      hView?.classList.remove('hidden');
      kView?.classList.add('hidden');
      if (hBtn) hBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
      if (kBtn) kBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600";
    } else {
      hView?.classList.add('hidden');
      kView?.classList.remove('hidden');
      if (kBtn) kBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
      if (hBtn) hBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600";
    }
  }

  // 6. AUTHENTICATION & SESSION LIFECYCLE
  function initAuthEngine() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const doc = await db.collection('users').doc(user.uid).get();
          if (doc.exists) {
            currentUser = { uid: user.uid, ...doc.data() };
          } else {
            currentUser = {
              uid: user.uid,
              name: user.displayName || "धर्मप्रेमी सदस्य",
              email: user.email || "",
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('users').doc(user.uid).set(currentUser, { merge: true });
          }
          localStorage.setItem('bishnoi_active_user', JSON.stringify({ uid: user.uid, name: currentUser.name }));
        } catch (err) {
          console.error("Profile sync error:", err);
        }
      } else {
        currentUser = null;
        localStorage.removeItem('bishnoi_active_user');
      }
      updateAuthUI();
    });

    const resetInactivity = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (currentUser) {
        inactivityTimer = setTimeout(() => {
          logout();
          showToast("🔒 सुरक्षा कारणों से २० मिनट निष्क्रियता के बाद सत्र समाप्त हुआ।");
        }, 20 * 60 * 1000);
      }
    };
    ['click', 'touchstart', 'keydown'].forEach(evt => window.addEventListener(evt, resetInactivity, { passive: true }));
  }

  function updateAuthUI() {
    const container = document.getElementById('authActionsContainer');
    const studioBtn = document.getElementById('ownerStudioPortalBtn');
    const postPrompt = document.getElementById('postAuthPrompt');
    const postEditor = document.getElementById('postEditor');
    const navLabel = document.getElementById('bnavProfileLabel');

    if (currentUser) {
      if (container) {
        container.innerHTML = `
          <button onclick="window.BishnoiAuth.openProfileModal()" class="text-xs font-bold text-forest bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 truncate max-w-[140px] shadow-sm">
            👤 ${currentUser.name}
          </button>
        `;
      }
      if (navLabel) navLabel.innerText = "प्रोफ़ाइल";
      postPrompt?.classList.add('hidden');
      postEditor?.classList.remove('hidden');

      db.collection('roles').doc(currentUser.uid).get().then(doc => {
        const isOwner = currentUser.uid === SUPER_OWNER_UID || (doc.exists && (doc.data().role === 'owner' || doc.data().role === 'editor'));
        if (studioBtn) studioBtn.classList.toggle('hidden', !isOwner);
      }).catch(() => {
        if (studioBtn) studioBtn.classList.add('hidden');
      });

    } else {
      if (container) {
        container.innerHTML = `
          <button onclick="window.BishnoiAuth.openAuthModal()" class="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold shadow-sm">
            लॉगिन करें
          </button>
        `;
      }
      if (navLabel) navLabel.innerText = "लॉगिन";
      if (studioBtn) studioBtn.classList.add('hidden');
      postPrompt?.classList.remove('hidden');
      postEditor?.classList.add('hidden');
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier')?.value.trim();
    const pass = document.getElementById('loginPass')?.value.trim();
    const name = document.getElementById('loginName')?.value.trim();

    if (!identifier || !pass) return showToast("कृपया सभी विवरण भरें!");

    const email = /^[6-9]\d{9}$/.test(identifier) 
      ? `user_${identifier}@bishnoism.internal` 
      : identifier;

    try {
      if (isRegisterMode) {
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection('users').doc(cred.user.uid).set({
          name: name || "धर्मप्रेमी सदस्य",
          phone: /^[6-9]\d{9}$/.test(identifier) ? identifier : "",
          email: cred.user.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast("✅ पंजीकरण सफल हुआ!");
      } else {
        await auth.signInWithEmailAndPassword(email, pass);
        showToast("✅ स्वागत है!");
      }
      closeAuthModal();
    } catch (err) {
      showToast("प्रमाणीकरण त्रुटि: " + err.message);
    }
  }

  async function signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      closeAuthModal();
      showToast("Google लॉगिन सफल हुआ!");
    } catch (err) {
      showToast("Google त्रुटि: " + err.message);
    }
  }

  function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('nameRow')?.classList.toggle('hidden', !isRegisterMode);
    const title = document.getElementById('authTitle');
    const subBtn = document.getElementById('authSubmitBtn');
    const togBtn = document.getElementById('authToggleBtn');
    if (title) title.innerText = isRegisterMode ? "नया पंजीकरण" : "लॉगिन (Sign In)";
    if (subBtn) subBtn.innerText = isRegisterMode ? "खाता बनाएं" : "लॉगिन करें";
    if (togBtn) togBtn.innerText = isRegisterMode ? "पहले से पंजीकृत हैं? लॉगिन करें" : "नए सदस्य हैं? पंजीकरण करें";
  }

  function openAuthModal() {
    document.getElementById('authModal')?.classList.remove('hidden');
  }

  function closeAuthModal() {
    document.getElementById('authModal')?.classList.add('hidden');
  }

  function openProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (!modal || !currentUser) return;
    const nameDisp = document.getElementById('profHeaderNameDisplay');
    const nameEdit = document.getElementById('profEditName');
    const locEdit = document.getElementById('profEditLocation');
    if (nameDisp) nameDisp.innerText = currentUser.name || "सदस्य";
    if (nameEdit) nameEdit.value = currentUser.name || "";
    if (locEdit) locEdit.value = currentUser.location || "";
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeProfileModal() {
    const modal = document.getElementById('userProfileModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  async function saveProfile() {
    if (!currentUser) return;
    const newName = document.getElementById('profEditName')?.value.trim();
    const newLoc = document.getElementById('profEditLocation')?.value.trim();
    if (!newName) return showToast("कृपया नाम खाली न छोड़ें!");

    try {
      await db.collection('users').doc(currentUser.uid).set({
        name: newName,
        location: newLoc
      }, { merge: true });
      currentUser.name = newName;
      currentUser.location = newLoc;
      updateAuthUI();
      closeProfileModal();
      showToast("प्रोफ़ाइल सुरक्षित हो गई!");
    } catch (e) {
      showToast("त्रुटि: " + e.message);
    }
  }

  function logout() {
    auth.signOut().then(() => {
      closeProfileModal();
      switchTab('home');
      showToast("सफलतापूर्वक लॉगआउट हुआ।");
    });
  }

  function openProfileOrAuth() {
    if (currentUser) openProfileModal();
    else openAuthModal();
  }

  // 7. DAILY BANNER & WHATSAPP SHARING
  function listenBanner() {
    db.collection('settings').doc('dailySandesh').onSnapshot(doc => {
      if (doc.exists && doc.data().text) {
        const el = document.getElementById('dailyBannerText');
        if (el) el.innerText = doc.data().text;
      }
    });
  }

  function shareBannerWhatsApp() {
    const txt = document.getElementById('dailyBannerText')?.innerText || "";
    const text = `🌿 *विश्नोई समाज पावन विचार*\n\n"${txt}"\n\n२९ नियम एवं ज्ञान मंच से जुड़ें:\n${window.location.origin}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  }

  // 8. VEDIC PANCHANG & LIVE AMAVASYA COUNTDOWN
  function computeAutoPanchang() {
    const now = new Date();
    const vaars = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const samvat = now.getFullYear() + 57;

    const synodic = 29.530588;
    const refNewMoon = new Date('2026-01-18T00:00:00Z').getTime();
    const diffDays = (now.getTime() - refNewMoon) / 86400000;
    const moonAge = (diffDays % synodic + synodic) % synodic;
    const tithiNum = Math.floor(moonAge / (synodic / 30)) + 1;
    const paksha = tithiNum <= 15 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष';
    const tithiName = tithiNum === 15 ? 'पूर्णिमा' : (tithiNum === 30 || tithiNum === 0 ? 'अमावस्या' : `तिथि ${tithiNum <= 15 ? tithiNum : tithiNum - 15}`);

    const dEl = document.getElementById('autoPanchangDate');
    const dtEl = document.getElementById('autoPanchangDetails');
    if (dEl) dEl.innerText = `${vaars[now.getDay()]} • विक्रम संवत ${samvat}`;
    if (dtEl) dtEl.innerText = `आज: ${now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })} | ${paksha}, ${tithiName} (गणितीय पंचांग)`;

    const daysUntilNext = synodic - moonAge;
    amavasyaTargetDate = new Date(now.getTime() + daysUntilNext * 86400000);
    startAmavasyaTimer();
  }

  function listenAmavasyaConfig() {
    db.collection('settings').doc('amavasyaConfig').onSnapshot(doc => {
      if (doc.exists) {
        const d = doc.data();
        if (d.name && document.getElementById('amavasyaTitleDisplay')) {
          document.getElementById('amavasyaTitleDisplay').innerText = d.name;
        }
        if (d.desc && document.getElementById('amavasyaFastingNote')) {
          document.getElementById('amavasyaFastingNote').innerText = d.desc;
        }
        if (d.date) {
          const parsed = new Date(d.date + "T00:00:00");
          if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now() - 86400000) {
            amavasyaTargetDate = parsed;
          }
        }
      }
      startAmavasyaTimer();
    });
  }

  function startAmavasyaTimer() {
    if (amavasyaTimer) clearInterval(amavasyaTimer);
    function update() {
      if (!amavasyaTargetDate) return;
      const diff = amavasyaTargetDate.getTime() - Date.now();
      const box = document.getElementById('amavasyaCountdownBox');
      if (!box) return;

      if (diff <= 0) {
        box.innerText = "🚩 आज पावन अमावस्या व्रत एवं हवन दिवस है!";
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      box.innerHTML = `समय शेष: <b>${d} दिन : ${h} घं : ${m} मि : ${s} से</b>`;
    }
    update();
    amavasyaTimer = setInterval(update, 1000);
  }

  // 9. DIGITAL JAAP MALA
  function tapMalaBead() {
    if (navigator.vibrate) navigator.vibrate(35);
    malaBeadCount++;
    malaTotalCount++;

    if (malaBeadCount >= 108) {
      malaBeadCount = 0;
      malaLapsCount++;
      if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
      if (typeof confetti === 'function') confetti({ particleCount: 50, spread: 60 });
      showToast("ॐ शांति! एक संपूर्ण जप माला (१०८ मनके) पूर्ण हुई!");
    }

    localStorage.setItem('bishnoi_mala_beads', malaBeadCount.toString());
    localStorage.setItem('bishnoi_mala_laps', malaLapsCount.toString());
    localStorage.setItem('bishnoi_mala_total', malaTotalCount.toString());
    renderMalaCounters();
  }

  function resetMala() {
    openConfirmModal("माला शून्य करें?", "क्या आप जप माला गणना रीसेट करना चाहते हैं?", (confirmed) => {
      if (confirmed) {
        malaBeadCount = 0; malaLapsCount = 0; malaTotalCount = 0;
        localStorage.setItem('bishnoi_mala_beads', '0');
        localStorage.setItem('bishnoi_mala_laps', '0');
        localStorage.setItem('bishnoi_mala_total', '0');
        renderMalaCounters();
        showToast("जप माला रीसेट हो गई।");
      }
    });
  }

  function renderMalaCounters() {
    const b = document.getElementById('currentBeadDisplay');
    const l = document.getElementById('malaLapsDisplay');
    const t = document.getElementById('malaTotalDisplay');
    const statT = document.getElementById('statMalaTotal');
    const statL = document.getElementById('statMalaLaps');
    if (b) b.innerText = malaBeadCount;
    if (l) l.innerText = malaLapsCount;
    if (t) t.innerText = malaTotalCount;
    if (statT) statT.innerText = malaTotalCount;
    if (statL) statL.innerText = malaLapsCount;
  }

  // 10. TREE PLEDGE COUNTER
  function listenTreeCounter() {
    db.collection('stats').doc('treePledges').onSnapshot(doc => {
      if (doc.exists && doc.data().count) {
        const el = document.getElementById('treeCounterDisplay');
        if (el) el.innerText = doc.data().count;
      }
    });
  }

  function pledgeTree() {
    if (localStorage.getItem('bishnoi_tree_pledged')) {
      return showToast("आपका पौधा रोपण संकल्प पहले से दर्ज है। साधुवाद!");
    }
    const el = document.getElementById('treeCounterDisplay');
    const cnt = parseInt(el?.innerText || '1485', 10) + 1;
    if (el) el.innerText = cnt;
    localStorage.setItem('bishnoi_tree_pledged', '1');
    db.collection('stats').doc('treePledges').set({
      count: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });
    showToast("🌱 पौधरोपण संकल्प दर्ज हुआ!");
  }

  // 11. AUDIO PLAYER CONTROLLER
  function initAudioListeners() {
    const audio = document.getElementById('audioElement');
    const range = document.getElementById('audioRange');
    const cur = document.getElementById('audioCurTime');
    const dur = document.getElementById('audioDurTime');
    const btn = document.getElementById('audioPlayBtn');

    audio?.addEventListener('timeupdate', () => {
      if (audio.duration && range) {
        range.value = (audio.currentTime / audio.duration) * 100;
        if (cur) cur.innerText = formatTime(audio.currentTime);
        if (dur) dur.innerText = formatTime(audio.duration);
      }
    });

    audio?.addEventListener('play', () => { if (btn) btn.innerText = '⏸'; });
    audio?.addEventListener('pause', () => { if (btn) btn.innerText = '▶'; });
  }

  function toggleAudio() {
    const audio = document.getElementById('audioElement');
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(err => showToast("ऑडियो लोड नहीं हो सका: " + err.message));
    } else {
      audio.pause();
    }
  }

  function seekAudio(delta) {
    const audio = document.getElementById('audioElement');
    if (audio) audio.currentTime += delta;
  }

  function cycleAudioSpeed() {
    speedIdx = (speedIdx + 1) % audioSpeeds.length;
    const spd = audioSpeeds[speedIdx];
    const audio = document.getElementById('audioElement');
    const btn = document.getElementById('audioSpeedBtn');
    if (audio) audio.playbackRate = spd;
    if (btn) btn.innerText = `${spd}x`;
    showToast(`गति: ${spd}x`);
  }

  function handleAudioSeek(val) {
    const audio = document.getElementById('audioElement');
    if (audio && audio.duration) audio.currentTime = (val / 100) * audio.duration;
  }

  function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // 12. 29 NIYAMS & PDF LIBRARY
  function renderNiyams(list) {
    const grid = document.getElementById('niyamGrid');
    if (!grid) return;
    grid.innerHTML = '';

    list.forEach(n => {
      const isRead = readNiyamsSet.has(n.num);
      const card = document.createElement('div');
      card.className = `p-4 rounded-2xl border ${isRead ? 'border-emerald-400 bg-emerald-50/20' : 'border-stone-200 bg-white'} shadow-sm space-y-2 flex flex-col justify-between`;
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between text-xs">
            <span class="w-6 h-6 rounded-full bg-amber-100 text-forest font-bold flex items-center justify-center">${n.num}</span>
            <span class="text-stone-500 font-semibold">${n.title}</span>
          </div>
          <h4 class="font-yatra text-base text-forest mt-1">${n.rule}</h4>
          <p class="text-xs text-stone-700 leading-relaxed mt-0.5">${n.desc}</p>
        </div>
        <div class="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
          <button onclick="window.BishnoiApp.shareNiyam(${n.num}, '${encodeURIComponent(n.title)}', '${encodeURIComponent(n.rule)}')" class="text-emerald-700 font-bold hover:underline">साझा करें 📲</button>
          <button onclick="window.BishnoiApp.toggleNiyamRead(${n.num})" class="text-stone-500 font-semibold">${isRead ? '✓ पठित' : 'पढ़े'}</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function toggleNiyamRead(num) {
    if (readNiyamsSet.has(num)) readNiyamsSet.delete(num);
    else readNiyamsSet.add(num);
    localStorage.setItem('bishnoi_read_niyams', JSON.stringify(Array.from(readNiyamsSet)));
    renderNiyams(niyamsData);
  }

  function filterNiyams(q) {
    const query = (q || '').toLowerCase().trim();
    const filtered = niyamsData.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.rule.toLowerCase().includes(query) ||
      n.desc.toLowerCase().includes(query)
    );
    renderNiyams(filtered);
  }

  function shareNiyam(num, titleEnc, ruleEnc) {
    const title = decodeURIComponent(titleEnc);
    const rule = decodeURIComponent(ruleEnc);
    const text = `🌿 *विश्नोई धर्म नियम ${num} : ${title}*\n"${rule}"\n\nसंपूर्ण २९ नियम पढ़ें:\n${window.location.origin}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  }

  function listenPdfs() {
    db.collection('pdfs').orderBy('createdAt', 'desc').onSnapshot(snap => {
      const grid = document.getElementById('pdfGrid');
      if (!grid) return;
      grid.innerHTML = `
        <div class="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">पवित्र ग्रंथ</span>
            <h3 class="font-yatra text-forest text-lg mt-1">श्री सबदवाणी (१२० शब्द)</h3>
            <p class="text-xs text-stone-600 mt-1">गुरु जम्भेश्वर भगवान द्वारा उच्चरित पावन १२० शब्दों का संग्रह।</p>
          </div>
          <div class="pt-3 border-t border-stone-100 flex items-center justify-between">
            <button onclick="window.BishnoiApp.openPdf('श्री सबदवाणी (१२० शब्द)', './shabadwani.pdf')" class="px-3.5 py-1.5 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl shadow">📖 पढ़ें</button>
            <a href="./shabadwani.pdf" download class="px-3.5 py-1.5 bg-forest text-white text-xs font-semibold rounded-xl">डाउनलोड</a>
          </div>
        </div>
      `;

      snap.forEach(doc => {
        const d = doc.data();
        grid.innerHTML += `
          <div class="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">${d.tag || 'साहित्य'}</span>
              <h3 class="font-yatra text-forest text-lg mt-1">${d.title}</h3>
            </div>
            <div class="pt-3 border-t border-stone-100 flex items-center justify-between">
              <button onclick="window.BishnoiApp.openPdf('${encodeURIComponent(d.title)}', '${encodeURIComponent(d.link)}')" class="px-3.5 py-1.5 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl shadow">📖 पढ़ें</button>
              <a href="${d.link}" target="_blank" download class="px-3.5 py-1.5 bg-forest text-white text-xs font-semibold rounded-xl">डाउनलोड</a>
            </div>
          </div>
        `;
      });
    });
  }

  function openPdf(titleEnc, linkEnc) {
    const title = decodeURIComponent(titleEnc);
    const link = decodeURIComponent(linkEnc);
    const modal = document.getElementById('inbuiltPdfModal');
    const tEl = document.getElementById('pdfViewerTitle');
    const frame = document.getElementById('pdfEmbedFrame');
    const dlBtn = document.getElementById('pdfDirectDownloadLink');

    if (tEl) tEl.innerText = title;
    if (dlBtn) dlBtn.href = link;
    if (frame) frame.src = link;

    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  }

  function closePdfViewer() {
    const modal = document.getElementById('inbuiltPdfModal');
    const frame = document.getElementById('pdfEmbedFrame');
    if (frame) frame.src = "about:blank";
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  }

  // 13. QUIZ ARENA & ROYAL MERIT CERTIFICATE
  function initQuizEngine() {
    db.collection('quiz').onSnapshot(snap => {
      if (!snap.empty) {
        quizList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        quizList = [
          { q: "खेजड़ली गाँव में ३६३ वीरों का महान पर्यावरण बलिदान किस वर्ष हुआ था?", opts: ["1730 ईस्वी", "1485 ईस्वी", "1857 ईस्वी", "1947 ईस्वी"], ans: 0 },
          { q: "गुरु जम्भेश्वर भगवान द्वारा २९ नियमों का प्रतिपादन किस पवित्र स्थान पर हुआ?", opts: ["मुकाम", "समराथल धोरा", "जांगलू", "लालासर"], ans: 1 },
          { q: "अमृता देवी विश्नोई का अमर वचन क्या था?", opts: ["सत्यमेव जयते", "सिर साटै रूंख रहै, तो भी सस्तो जाण", "अहिंसा परमो धर्मः", "जय किसान"], ans: 1 }
        ];
      }
    });

    db.collection('settings').doc('dailyWinners').onSnapshot(doc => {
      if (doc.exists) {
        const d = doc.data();
        const setEl = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val || '—';
        };
        setEl('winner1Name', d.p1Name);
        setEl('winner1Score', d.p1Score);
        setEl('winner2Name', d.p2Name);
        setEl('winner2Score', d.p2Score);
        setEl('winner3Name', d.p3Name);
        setEl('winner3Score', d.p3Score);
      }
    });
  }

  function startQuiz() {
    document.getElementById('quizIntroCard')?.classList.add('hidden');
    document.getElementById('quizActiveBox')?.classList.remove('hidden');
    currentQ = 0;
    qScore = 0;
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const box = document.getElementById('quizActiveBox');
    if (!box || quizList.length === 0) return;

    if (currentQ >= quizList.length) {
      const percentage = Math.round((qScore / quizList.length) * 100);
      if (currentUser) {
        db.collection('quizAttempts').add({
          uid: currentUser.uid,
          name: currentUser.name,
          score: qScore,
          total: quizList.length,
          percentage: percentage,
          submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      if (typeof confetti === 'function') confetti({ particleCount: 60, spread: 70 });

      box.innerHTML = `
        <div class="text-center space-y-4 py-4">
          <div class="text-5xl">🏆</div>
          <h3 class="font-yatra text-2xl text-forest">परीक्षा पूर्ण हुई!</h3>
          <p class="text-sm text-stone-600">आपका स्कोर: <strong class="text-terracotta text-lg">${qScore} / ${quizList.length}</strong> (${percentage}%)</p>
          <div class="flex justify-center gap-2 pt-2">
            <button onclick="window.BishnoiQuiz.startQuiz()" class="px-4 py-2 bg-stone-200 text-stone-800 rounded-xl font-bold text-xs">पुनः अभ्यास</button>
            <button onclick="window.BishnoiQuiz.downloadCertificate('${currentUser ? currentUser.name : 'प्रतिभागी'}', ${percentage})" class="px-4 py-2 bg-terracotta text-white rounded-xl font-bold text-xs shadow">📜 सम्मान-पत्र</button>
          </div>
        </div>
      `;
      return;
    }

    const q = quizList[currentQ];
    isAnswering = false;

    box.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center text-xs font-bold text-forest">
          <span>प्रश्न ${currentQ + 1} / ${quizList.length}</span>
          <span class="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">प्राप्तांक: ${qScore}</span>
        </div>
        <h4 class="font-bold text-base text-forest">${q.q}</h4>
        <div class="space-y-2">
          ${q.opts.map((opt, i) => `
            <button onclick="window.BishnoiQuiz.chooseOption(${i})" class="opt-btn w-full text-left p-3 text-xs sm:text-sm rounded-xl border border-stone-200 hover:border-forest bg-white font-medium transition flex items-center justify-between">
              <span><strong>${['A','B','C','D'][i]}.</strong>${opt}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function chooseOption(idx) {
    if (isAnswering) return;
    isAnswering = true;

    const q = quizList[currentQ];
    const btns = document.querySelectorAll('.opt-btn');

    if (idx === q.ans) {
      qScore++;
      btns[idx]?.classList.add('bg-emerald-50', 'border-emerald-500', 'text-emerald-900');
      showToast("✓ सही उत्तर!");
    } else {
      btns[idx]?.classList.add('bg-rose-50', 'border-rose-500', 'text-rose-900');
      btns[q.ans]?.classList.add('bg-emerald-50', 'border-emerald-500');
      showToast("✕ उत्तर गलत है!");
    }

    setTimeout(() => {
      currentQ++;
      renderQuizQuestion();
    }, 1000);
  }

  function downloadCertificate(name, score) {
    const canvas = document.getElementById('certCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FAF6EE';
    ctx.fillRect(0, 0, 1000, 720);

    ctx.strokeStyle = '#143622';
    ctx.lineWidth = 16;
    ctx.strokeRect(20, 20, 960, 680);
    ctx.strokeStyle = '#B34A1B';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, 928, 648);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#B34A1B';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('॥ ॐ विष्णवे नमः • श्री जम्भेश्वराय नमः ॥', 500, 90);

    ctx.fillStyle = '#143622';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('विश्नोई समाज डिजिटल ज्ञान परीक्षा', 500, 160);

    ctx.fillStyle = '#B34A1B';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('★ योग्यता एवं धर्म-संस्कार सम्मान-पत्र ★', 500, 210);

    ctx.fillStyle = '#44403C';
    ctx.font = '18px sans-serif';
    ctx.fillText('यह सहर्ष प्रमाणित किया जाता है कि समाज प्रतिभागी', 500, 290);

    ctx.fillStyle = '#143622';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(name, 500, 350);

    ctx.fillStyle = '#292524';
    ctx.font = '18px sans-serif';
    ctx.fillText(`ने २९ नियम आचार संहिता एवं समाज इतिहास परीक्षा में ${score}% अंक प्राप्त किए हैं।`, 500, 420);

    ctx.fillStyle = '#143622';
    ctx.fillRect(200, 480, 600, 40);
    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('"जीव दया पालणी, रूंख लीलो नी घावै"', 500, 506);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#44403C';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`दिनांक: ${new Date().toLocaleDateString('hi-IN')}`, 80, 620);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#143622';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('विश्नोई समाज डिजिटल मंच', 920, 620);

    const link = document.createElement('a');
    link.download = `Certificate_${name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast("सम्मान-पत्र डाउनलोड हुआ!");
  }

  // 14. COMMUNITY CHAT STREAM (XSS PROTECTED)
  function initCommunityChat() {
    db.collection('posts').orderBy('createdAt', 'desc').limit(40).onSnapshot(snap => {
      allPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderCommunityFeed();
    });

    db.collection('settings').doc('pinnedChat').onSnapshot(doc => {
      const banner = document.getElementById('pinnedChatBanner');
      const txt = document.getElementById('pinnedChatText');
      if (doc.exists && doc.data().content) {
        if (txt) txt.textContent = `${doc.data().author || 'व्यवस्थापक'}: "${doc.data().content}"`;
        banner?.classList.remove('hidden');
      } else {
        banner?.classList.add('hidden');
      }
    });
  }

  function renderCommunityFeed() {
    const feed = document.getElementById('communityFeed');
    if (!feed) return;
    feed.innerHTML = '';

    const filtered = currentChatFilter === 'all'
      ? allPosts
      : allPosts.filter(p => (p.topic || 'सामान्य चर्चा') === currentChatFilter);

    if (filtered.length === 0) {
      feed.innerHTML = `<div class="text-center py-6 text-xs text-stone-500">कोई संदेश नहीं मिला। पहला विचार साझा करें!</div>`;
      return;
    }

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = "p-3 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1";

      const topRow = document.createElement('div');
      topRow.className = "flex items-center justify-between text-xs";

      const authorSpan = document.createElement('span');
      authorSpan.className = "font-bold text-forest";
      authorSpan.textContent = p.author || "धर्मप्रेमी";

      const timeSpan = document.createElement('span');
      timeSpan.className = "text-[10px] text-stone-400";
      timeSpan.textContent = p.createdAt ? new Date(p.createdAt.toDate()).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) : "हाल ही में";

      topRow.appendChild(authorSpan);
      topRow.appendChild(timeSpan);

      const contentP = document.createElement('p');
      contentP.className = "text-xs sm:text-sm text-stone-800 break-words leading-relaxed";
      contentP.textContent = p.content || "";

      card.appendChild(topRow);
      card.appendChild(contentP);
      feed.appendChild(card);
    });
  }

  async function submitPost() {
    if (!currentUser) return openAuthModal();

    const textEl = document.getElementById('postText');
    const content = textEl?.value.trim();
    if (!content) return showToast("कृपया संदेश लिखें!");

    if (/(http|www\.|\.com|\.xyz|[6-9]\d{9})/i.test(content)) {
      return showToast("सुरक्षा कारणों से बाहरी लिंक अथवा मोबाइल नंबर भेजना वर्जित है।");
    }

    const now = Date.now();
    if (now - lastPostTime < 8000) return showToast("कृपया अगले संदेश के लिए कुछ सेकंड प्रतीक्षा करें।");

    try {
      await db.collection('posts').add({
        author: currentUser.name || "धर्मप्रेमी",
        uid: currentUser.uid,
        content: content,
        topic: 'सामान्य चर्चा',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      lastPostTime = now;
      if (textEl) textEl.value = '';
      showToast("विचार प्रेषित हुआ!");
    } catch (err) {
      showToast("त्रुटि: " + err.message);
    }
  }

  function filterTopic(topic) {
    currentChatFilter = topic;
    renderCommunityFeed();
  }

  // 15. HISTORY & KIDS VIEWS
  function renderHistoryAndKids() {
    const hView = document.getElementById('historySubView');
    const kView = document.getElementById('kidsSubView');
    if (!hView || !kView) return;

    const hItems = historyItemsList.filter(x => x.type === 'history');
    const kItems = historyItemsList.filter(x => x.type === 'kids');

    hView.innerHTML = hItems.map(item => `
      <div class="p-5 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-2">
        <span class="px-2.5 py-0.5 bg-emerald-50 text-forest border border-emerald-200 rounded-full text-xs font-bold">${item.badge}</span>
        <h3 class="font-yatra text-lg text-forest">${item.title}</h3>
        <p class="text-xs text-stone-700 leading-relaxed">${item.content}</p>
        <div class="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold">${item.moral}</div>
      </div>
    `).join('');

    kView.innerHTML = kItems.map(item => `
      <div class="p-5 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 border border-amber-300 shadow-sm space-y-2">
        <span class="px-3 py-0.5 bg-amber-400 text-stone-950 rounded-full text-xs font-bold">${item.badge}</span>
        <h3 class="font-yatra text-lg text-forest">${item.title}</h3>
        <p class="text-xs text-stone-800 leading-relaxed">${item.content}</p>
        <div class="p-2.5 rounded-2xl bg-emerald-900 text-amber-200 text-xs font-bold">${item.moral}</div>
      </div>
    `).join('');
  }

  // 16. INITIALIZATION & DUAL-MOUNT NAMESPACE EXPORTS
  window.addEventListener('DOMContentLoaded', () => {
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

    const searchInp = document.getElementById('globalSearchInput');
    searchInp?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderNiyams(niyamsData);
        return;
      }
      const matched = niyamsData.filter(n => n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q) || n.title.toLowerCase().includes(q));
      if (matched.length) {
        switchTab('library');
        renderNiyams(matched);
      }
    });
  });

  // Namespace Exports (Matching index.html button bindings)
  window.BishnoiApp = {
    showToast, switchTab, switchHistorySubTab, tapMalaBead, resetMala,
    filterNiyams, shareNiyam, openPdf, closePdfViewer, toggleAudio,
    seekAudio, cycleAudioSpeed, handleAudioSeek, pledgeTree,
    shareBannerWhatsApp, openConfirmModal, closeConfirmModal, openProfileOrAuth,
    toggleNiyamRead
  };

  window.BishnoiAuth = {
    handleAuthSubmit, signInWithGoogle, toggleAuthMode, openAuthModal,
    closeAuthModal, openProfileModal, closeProfileModal, saveProfile, logout
  };

  window.BishnoiQuiz = {
    startQuiz, chooseOption, downloadCertificate
  };

  window.BishnoiCommunity = {
    submitPost, filterTopic
  };

  // Direct Global Fallbacks (Guarantees backward compatibility with older click events)
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
