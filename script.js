/* ==========================================================================
   Bishnoi Community Portal - Elder-Friendly Master Engine (script.js)
   Includes:
   - Global Elder Font-Size Controller (A- / Normal / A+ / A++ Elder Mode)
   - Smart Shabadwani Digital Reader (Auto-Fit Text, No Pinch-Zoom, Read Aloud)
   - Full-Screen Auto-Fit PDF.js Canvas Viewer for all other PDFs
   - Multi-Line Quiz Leaderboard Winner Names (Fixes Long Name Cutting)
   - Owner Login (9306894518 / bishnoi29) + 1-Click Google Login + Forgot Pass
   - Text-Only Samvad Manch + User Profile + Live Maintenance Engine
   - Audio Manager with Admin Track Delete List
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
let currentBannerText = '"जीव दया पालणी, रूंख लीलो नी घावै" — प्रकृति एवं सभी मूक जीवों के प्रति करुणा रखें।';
let amavasyaTargetDate = null;
let amavasyaTimerInterval = null;
let currentActiveTab = 'home';

// Elder Font Scale State
let appFontZoom = parseInt(localStorage.getItem('bishnoi_elder_font_zoom') || '115');
let readerFontPx = parseInt(localStorage.getItem('bishnoi_reader_font_px') || '22');
let pdfCanvasScale = 1.3;
let currentPdfUrl = '';

// Samvad Manch Chat State
let allChatPosts = [];
let activeReplyObj = null;

// Maintenance State
let maintenanceConfig = {
  globalMode: 'off',
  message: 'हम आपके अनुभव को बेहतर बनाने के लिए ऐप को अपडेट कर रहे हैं। कृपया कुछ समय बाद पुनः प्रयास करें।',
  sections: {
    mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off'
  }
};

// Digital Jaap Mala State
let malaBeadCount = parseInt(localStorage.getItem('bishnoi_mala_beads') || '0');
let malaLapsCount = parseInt(localStorage.getItem('bishnoi_mala_laps') || '0');
let malaTotalCount = parseInt(localStorage.getItem('bishnoi_mala_total') || '0');

// 29 Niyams Static Data
const NIYAMS_DATA = [
  { num: 1, title: "प्रसूति सूतक", rule: "तीस दिन सूतक पाळणा", desc: "सूतक काल में ३० दिन तक स्वच्छता और विश्राम रखें।" },
  { num: 2, title: "ऋतुवंती पृथक्करण", rule: "पांच दिन रजस्वला पृथक्करण", desc: "माहवारी के दौरान ५ दिन का गृह-कार्य से विश्राम।" },
  { num: 3, title: "प्रातः स्नान", rule: "सेरो करो अस्नान", desc: "प्रतिदिन प्रातःकाल स्नान कर पवित्र रहें।" },
  { num: 4, title: "शील व संतोष", rule: "शील संतोष सूच राखणा", desc: "सदाचारी, शांत और संतोषी स्वभाव रखें।" },
  { num: 5, title: "द्विकाल संध्या", rule: "द्वादश कर्म सांध", desc: "सुबह-शाम दोनों समय संध्या और ईश्वर स्मरण करें।" },
  { num: 6, title: "सांझ आरती", rule: "सांझ आरती गुण गावै", desc: "संध्या समय आरती व भगवान के गुणों का गायन करें।" },
  { num: 7, title: "प्रातः होम", rule: "प्रात: होम करणा", desc: "प्रतिदिन प्रातःकाल घी और सामग्री से हवन करें।" },
  { num: 8, title: "पानी छानना", rule: "पाणी छान पीवणा", desc: "सूक्ष्म जीवों की रक्षा के लिए पानी सदा छानकर पियें।" },
  { num: 9, title: "ईंधन जांच", rule: "ईंधन बीन बाळणा", desc: "चूल्हे में लकड़ी कीट-पतंगों को देखकर व झाड़कर ही जलाएं।" },
  { num: 10, title: "क्षमा धारण", rule: "क्षमा दया मन आणणा", desc: "मन में सदा क्षमा और सहनशीलता बनाए रखें।" },
  { num: 11, title: "दया भाव", rule: "दया हिरदै राखणी", desc: "प्रत्येक जीव और मनुष्य के प्रति दयालु रहें।" },
  { num: 12, title: "चोरी त्याग", rule: "चोरी नहीं करणी", desc: "पराई वस्तु कभी न चुराएं।" },
  { num: 13, title: "निंदा त्याग", rule: "निंदा नहीं करणी", desc: "किसी की पीठ पीछे बुराई न करें।" },
  { num: 14, title: "झूठ त्याग", rule: "झूठ नहीं बोलना", desc: "सदा सत्य और मधुर वाणी बोलें।" },
  { num: 15, title: "वाद-विवाद त्याग", rule: "वाद विवाद नहीं करणा", desc: "व्यर्थ के झगड़े और अहंकार भरी बहस से बचें।" },
  { num: 16, title: "अमावस्या व्रत", rule: "अमावस्या व्रत राखणा", desc: "अमावस्या के दिन उपवास रखें और आत्म-चिंतन करें।" },
  { num: 17, title: "विष्णु स्मरण", rule: "विष्णु नाम जपणा", desc: "हृदय में ॐ विष्णवे नमः का निरंतर स्मरण रखें।" },
  { num: 18, title: "जीव दया", rule: "जीव दया पालणी", desc: "मूक जीवों की रक्षा करें, किसी जीव की हत्या न करें।" },
  { num: 19, title: "हरा वृक्ष रक्षा", rule: "रूंख लीलो नी घावै", desc: "हरे-भरे पेड़ों को कभी न काटें।" },
  { num: 20, title: "काम-क्रोध संयम", rule: "अजर जरे सो सूर", desc: "काम, क्रोध और वासनाओं पर नियंत्रण रखें।" },
  { num: 21, title: "स्वहस्त आहार", rule: "आपने हाथे रांधणा", desc: "पवित्रता के साथ अपने हाथों से बना शुद्ध भोजन करें।" },
  { num: 22, title: "पशु थापण", rule: "अमर रखावै थाट", desc: "निराश्रित और वृद्ध पशुओं को आश्रय दें।" },
  { num: 23, title: "बैल बधिया निषेध", rule: "बैल बधिया नहीं करणा", desc: "बैलों का बंध्याकरण न करें।" },
  { num: 24, title: "अमल त्याग", rule: "अमल नहीं खाणा", desc: "अफीम और नशे की वस्तुओं का पूर्ण त्याग करें।" },
  { num: 25, title: "तम्बाकू त्याग", rule: "तम्बाकू नहीं पीणा", desc: "तम्बाकू, बीड़ी, सिगरेट आदि का पूर्ण निषेध।" },
  { num: 26, title: "भांग त्याग", rule: "भांग नहीं पीणी", desc: "भांग और गांजे का सेवन कभी न करें।" },
  { num: 27, title: "मदिरा त्याग", rule: "मद्य नहीं पीणा", desc: "शराब का पूरी तरह त्याग करें।" },
  { num: 28, title: "मांस त्याग", rule: "मांस नहीं खाणा", desc: "पूर्णतः शाकाहारी रहें, मांस कभी न छुएं।" },
  { num: 29, title: "नील त्याग", rule: "नील नहीं पहरणा", desc: "नील के पौधों को काटकर बनने वाले नीले वस्त्रों का त्याग।" }
];

// श्री सबदवाणी डिजिटल पाठ (बुजुर्गों के लिए बिना ज़ूम किए स्क्रीन-फिट पढ़ने हेतु)
const SHABADWANI_DIGITAL_BOOK = [
  { id: 0, title: "प्रस्तावना एवं परिचय", text: "॥ श्री गुरु जम्भेश्वराय नमः ॥\nश्री गुरु जांभोजी (गुरु जम्भेश्वर) की सबद वाणी उनकी स्वयं की अनुभूत सत्य पर आधारित एक अद्वितीय ग्रंथ है[cite: 7, 8]। इसमें ज्ञान, कर्म और भक्ति का सुंदर समन्वय देखने को मिलता है[cite: 8]। गुरु जी ने कर्म पर विशेष बल देते हुए कहा था — 'खेत मुकति ले किसना अरथै, जै कंध हरै तो हरियां' अर्थात मोक्ष प्राप्त करने के लिए हमें उत्तम कर्म करने होंगे[cite: 8]।\n\nनीचे दिए गए बटनों से आप अक्षर बड़ा (अ+) कर सकते हैं, किसी भी सबद पर सीधे जा सकते हैं, या पूरा PDF पृष्ठ भी देख सकते हैं।" },
  { id: 1, title: "सबद - 1 (गुरु महिमा)", text: "ओ३म् गुरु चीन्हों गुरु चिन्ह पुरोहित, गुरु मुख धर्म बखांणी[cite: 10]। जो गुरु होयवा सहजै शीले शब्दे नादे वेदे, तिहिं गुरु का आलिंकार पिछाणी[cite: 10]। छव दरशण जिहिं के रुपण थापण, संसार बरतण निज कर थरप्या, सो गुरु प्रत्यक्ष जाणी[cite: 10]। जिहिं के खरतर गोठ निरोतर वाचा, रहिया रुद्र समाणी[cite: 10]। गुरु आप संतोषी अवरां पोषी, तत्त्व महारस बाणी[cite: 10]। के के अलिया बासण होत हुताषण तामै क्षीर दुहीजूं[cite: 10]। रसुवन गोरस घीय न लीयूं तहां दूध न पाणी[cite: 10]। गुरु ध्याइयेरे ज्ञानी[cite: 10]। तोड्त मोहा अति खुरसांणी, छीजत लोहा पाणी[cite: 10]। छल तेरी खाल पखाला, सतगुरु तोडे मन का साला[cite: 10]। सतगुरु है तो सहज पिछाणी, कृष्ण चरित्र बिन काचे करवे रह्यो न रहसी पाणी ॥1॥[cite: 10]" },
  { id: 2, title: "सबद - 2 (स्वरूप बोध)", text: "ओ३म् मोरे छाया न माया लोहू न मांसू रक्तुं न धातुं[cite: 10]। मोरे माई न बापूं आपण आपूं[cite: 10]। रोही न रापूं, कोपूं न कलापूं, दुःख न सरापूं[cite: 10]। लोई अलोई, त्यूं तृलोई, ऐसा न कोई जपां भी सोई[cite: 10]। जिहीं जपे आवागवण न होई[cite: 10]। मोरी आद न जाणत, महियल धूवां बखाणत[cite: 10]। उर्ध ठाकले तृसूलूं[cite: 10]। आद अनाद तो हम रचिलो[cite: 10]। हमें सिरजीलो सैकौण[cite: 10]। म्हे जोगी के भोगी के अल्प अहारी[cite: 10]। ज्ञानी के ध्यानी, के निज कर्म धारी[cite: 10]। सोषी के पोषी के जल बिंबधारी[cite: 10]। दया धर्म थापले निज बाला ब्रह्मचारी ॥2॥[cite: 10]" },
  { id: 3, title: "सबद - 3 (अहिंसा व दया)", text: "ओ३म् मोरे अंग न अलसी तेल न मलियो[cite: 10]। ना परमल पीसीयों[cite: 10]। जीमत पीवत भोगत बिलसत[cite: 10]। दीसां नाहीं महा पण को आधारुं[cite: 10]। अड़सठ तीरथ हिरदा भीतर, बाहर लोका चारुं[cite: 10]। नान्हीं मोटी जीया जूंणी[cite: 10]। एती सास फुरन्ते सारुं[cite: 10]। बासन्दर क्यूं एक भणिजै[cite: 10]। जिहिं के पावन पिराणों[cite: 10]। आला सूका मेल्हे नाहीं, जिहीं दिश करै मुहाणों[cite: 10]। पापै गुन्है वीहै नाहीं[cite: 10]। रीस करै रिसाणौं[cite: 10]। बहुली दौरे लावण हारुं[cite: 10, 11]। भावे जाण मैं जाणूं[cite: 11]। न तूं सुर नर न तूं शंकर[cite: 11]। न तूं रावन राणौं[cite: 11]। काचै पिंड अकाजे चलावें महा अधूरत दाणों[cite: 11]। मोरै छुरी न धारुं, लोह न सारुं, न हथियारुं[cite: 11]। सुरज का रिपु बिहंडा नाहीं, तातै कहा उठावत भारुं[cite: 11]। जिहीं हाकणड़ी बलद जूं हाके, न लोहे की आरु ॥3॥[cite: 11]" },
  { id: 4, title: "सबद - 4 (सृष्टि रचना)", text: "ओ३म् जद पवन न होता पाणी न होता[cite: 11]। न होता धर गैणारूं[cite: 11]। चन्द न होता सूर न होता, न होता गंगदर तारूं[cite: 11]। गउ न गोरुं माया जाल न होता[cite: 11]। न होता हेत पियारुं[cite: 11]। माय न बाप न बहण न भाई, साखण सैण न होता[cite: 11]। न होता पख परवारुं[cite: 11]। लख चौरासी जीया जूणी न होती[cite: 11]। न होती बणी अठारा भारुं[cite: 11]। सप्त पताल फुणीद न होता[cite: 11]। न होता सागर खारुं[cite: 11]। अजिया सजिया जीया जुणी न होती[cite: 11]। न होती कुड़ी भरतारुं[cite: 11]। अर्थ न गर्थ न गर्व न होता[cite: 11]। न होता तेजी तुरंग तुखारुं[cite: 11]। हाट पण बाजार न होता[cite: 11]। न होता राजदवारुं[cite: 11]। चाव न चहन न कोह का बाण न होता[cite: 11]। तद होता एक निरंजन शंभू[cite: 11]। के होता धंधुकारुं[cite: 11]। बात कदो की पुछे लोई[cite: 11]। जुग छतीसूं विचारुं[cite: 11]। ताह परै रे अवर छतीसूं[cite: 11]। पहला अन्त न पारुं[cite: 11]। म्हे तद पण होता अब पण आछै, बल-बल होयसां[cite: 11]। कह कद कद का करूं विचारु ॥4॥[cite: 11]" },
  { id: 5, title: "सबद - 5 (एक निरंजन शंभु)", text: "ओ३म् अइया लो अपरं पर बाणी[cite: 11]। म्हे जपां न जाया जीऊं[cite: 11]। नव अवतार नमो नारायण, तेपण रुप हमारा थीयूं[cite: 11]। जपी तपी तक पीर ऋषेश्वर कायं जपीजै तेपण जाया जीऊं[cite: 11]। खेचर भूचर षेत्रपाला परगट गुप्ता[cite: 11]। कायं जपीजै तेपण जाया जीऊं[cite: 11]। बासग शेष गुणिन्दा फुणिन्दा[cite: 11]। कायं जपीजै तेपण जाया जीऊं[cite: 11]। चौसट जोगनि बावन बीरुं[cite: 11]। कायं जपिजै तेपण जाया जीऊं[cite: 11]। जपां तो एक निरालंभ शंभु[cite: 11]। जिहीं के माई न पीऊं[cite: 11]। न तन रक्तुं न तन धातुं[cite: 11]। न तान ताव न सीऊं[cite: 11]। सर्व सिरजत मरत बिबरजात[cite: 11]। तासन मुलज लेणा कीयों[cite: 11]। अइया लो अपरं पर बाणी[cite: 11]। म्हे जपां न जाया जीऊं ॥5॥[cite: 11]" },
  { id: 6, title: "सबद - 6 (समभाव दर्शन)", text: "ओ३म् भवन भवन म्हे एका जोती[cite: 12]। चुन चुन लीया रतना मोती[cite: 12]। म्हे खोजी थापण होजी नाहीं, खोज लहां धुरुं खोजूं[cite: 12]। अलाह अलेख अडाल अजोनी स्वयंभू[cite: 12]। जिहिं का किसा बिनाणी[cite: 12]। म्हे शरै न बैठा सीख न पूछी, निरत सुरत सब जाणी[cite: 12]। उप्पत्ति हिन्दू जरणा जोगी, किया ब्राह्मण, दिल दरबेसां उन्मुन मुद्रा अकल मिसलमानी ॥6॥[cite: 12]" },
  { id: 7, title: "सबद - 7 (हरि स्मरण व वृक्ष रक्षा)", text: "ओ३म् हिन्दू होयके हर क्यूं ना जंप्यो[cite: 12]। कायं दह दिश दिल पसरायों[cite: 12]। सोम अमावस आदितवारी[cite: 12]। कायं काटी बनरायों[cite: 12]। गहण गहंते, बहण बहंते, निर्जल ग्यारस मूल बहंते[cite: 12]। कायं रे मुरखां तें पालंग सेज निहाल बिछाई[cite: 12]। जा दिन तेरे होम न जाप न तप न किया[cite: 12]। जाण के भागी कपिला गाई[cite: 12]। कूड़ तणों जे करतब कीयो, नातें लाव न सायों[cite: 12]। भूला प्राणी आल बखाणी[cite: 12]। न जंप्यो सुररायों[cite: 12]। छंदे कहां तो बहुता भावे[cite: 12]। खरतर को पतियायों[cite: 12]। हिव की बेलां हिव न जाग्यो, शंक रह्यो कदरायों[cite: 12]। ठाढी बेलां ठार न जाग्यो, ताती बैलां तायों[cite: 12]। बिम्बे बेलां विष्णु न जंप्यों, ताछे का चीन्हों कछु कमायों[cite: 12]। अति आलस भोला वे भूला, न चीन्हों सुर रायों[cite: 12]। पारब्रह्म की सुध न जाणीं, तो नागे जोग न पायो परशुराम के अर्थ न मुवा, ताकी निश्चय सरी न कायों ॥7॥[cite: 12]" },
  { id: 8, title: "सबद - 8 (जीव दया उपदेश)", text: "ओ३म् सुणरे काजी सुणरे मुल्लां[cite: 12]। सुणरे बकर कसाई[cite: 12]। किणरी थरपी छाली रोसो किणरी गाडर गाई[cite: 12]। सुल चुभीजै करक दुहेली तो है है जायो जीव न घाई[cite: 12]। थे तुर्की छुर्की भिस्ती दावो, खायवा खाज अखाजूं[cite: 12]। चर फिर आवे सहज दुहावे तिसका क्षीर हलाली[cite: 12]। जिसके गले करद क्यूं सारो थे पढ़ सुण रहिया खाली ॥8॥[cite: 12]" },
  { id: 9, title: "सबद - 9 (मूक जीव करुणा)", text: "ओ३म् दील साबत हज कोबा नड़ै[cite: 13]। क्या उलबंग पुकारो[cite: 13]। भाई नाऊं बलद पियारो[cite: 13]। ताके गले करद क्यूं सारो[cite: 13]। बिन चिन्हें खुदाय बिबरजत केहा मुसलमानों[cite: 13]। काफर मूकर होयकर राह गमायो[cite: 13]। जोय जोय गाफल करै धिगाणो[cite: 13]। ज्यूं थे पच्छिम दिशा उलबंग पुकारो, भलजे यों चीन्हों रहमाणों[cite: 13]। तो रुंह चलंते पिंड पडंते[cite: 13]। आवे भिस्त बिमाणों[cite: 13]। चढ-चढ भीते मड़ी मसीते क्या उलबंग पुकारो[cite: 13]। काहे काजे गऊ बिणासो[cite: 13]। तो करीम गऊ क्यूं चारी[cite: 13]। काहीं लीयूं दुधुं दहियूं, काहे लीयों घियूं महियूं[cite: 13]। काहे लीयूं हाडूं मासूं[cite: 13]। काहे लीयूं रक्तुं रुंहियूं[cite: 13]। सुणरे काजे सुणरे मुल्ला[cite: 13]। यामै कौन भया मुरदारुं[cite: 13]। जीवां ऊपर जोर करीजै[cite: 13]। अंतकाल होयसी भारू ॥9॥[cite: 13]" },
  { id: 10, title: "सबद - 10 (सच्चा ईमान)", text: "ओ३म् बिसमिल्ला रहमान रहीम[cite: 13]। जिहिं के सदके भीना भीन तो भेटीलो रहमान रहीम[cite: 13]। करीम काया दिल करणी[cite: 13]। कलमा करतब कौल कुराणों[cite: 13]। दिल खोजो दरवेश भईलो[cite: 13]। तइया मुसलमाणों[cite: 13]। पीरां पुरुषा जमी मुसल्लां[cite: 13]। कर्तब लेक सलामों[cite: 13]। हम दिल लिल्ला तुम दिल लिल्ला[cite: 13]। रहम करे रहमाणों[cite: 13]। इतने मिसले चालो मीयां[cite: 13]। तो पावो भिस्त इमाणों ॥10॥[cite: 13]" },
  { id: 15, title: "सबद - 15 (विष्णु नाम मूल)", text: "ओ३म् सुरमां लेणां झीणा शब्दूं, म्हे भूल न भाख्या थूलूं[cite: 15]। सो पति बिरषा सींच प्राणी, जिंहीं का मीठा मूल समूलूं[cite: 15]। पाते भूला मूल न खोजो, सींचों कांय कुमूलूं[cite: 15]। विष्णु विष्णु भण अजर जरीजे, यह जीवन का मूलूं[cite: 15]। खोज प्राणी ऐसा बिनाणी केवल ज्ञानी ज्ञान गहीरूं[cite: 15]। जिहिं के गुणै न लाभत छैहूं[cite: 15]। गुरु गेंवर गरवा शीतल नीरूं मेवा ही अति मेऊं[cite: 15]। हिरदै मुक्ता कमल सन्तोषी, टेवा ही अति टेऊं[cite: 15]। चढकर बोहिता भव जल पार लंघावै[cite: 15]। सो गुरु खेवट खेवा खेहूं ॥15॥[cite: 15]" },
  { id: 20, title: "सबद - 20 (दया धर्म विचार)", text: "ओ३म् जां जां दया न मया तां तां बिकरम कया[cite: 16]। जां जां आव न वैसूं[cite: 16]। तां तां स्वर्ग न जैसूं[cite: 16]। जां जां जीव न जोती[cite: 16]। तां तां मोक्ष न मुक्ति[cite: 16]। जां जां दया न धर्मू[cite: 16, 17]। तां तां बिकरम कर्मू[cite: 17]। जां जां पाले न शीलूं[cite: 17]। तां तां कर्म कुचीलूं[cite: 17]। जां जां खोज्या न मूलूं[cite: 17]। तां तां प्रत्यक्ष थूलूं[cite: 17]। जां जां भेद्यां न भेदूं[cite: 17]। तो स्वर्गे किसी उमेदूं[cite: 17]। जां जां घमण्डे स घमण्डूं[cite: 17]। ताकै ताव न छायों सूते सास नसायों ॥20॥[cite: 17]" },
  { id: 23, title: "सबद - 23 (सतपंथ व आचार)", text: "ओ३म् साल्हिया हुआ मरण भय भागा, गाफिल मरणे घणा डरे[cite: 18]। सतगुरु मिलियो सतपंथ बतायो, भ्रांत चुकाई, मरणे बहु उपकार करे[cite: 18]। रतन काया सोभंति लाभे, पार गिराये जीव तिरे[cite: 18]। पार गिरायें सनेही करणी[cite: 18]। जंपो विष्णु न दोय दिल करणी[cite: 18]। जंपो विष्णु न निन्दा करणी[cite: 18]। मांडो कांध विष्णु के सरणे[cite: 18]। अतरा बोल करो जे सांचा[cite: 18]। तो पार गिराये गुरु की वाचा[cite: 18]। रवणा ठवणा चवरा भवणा[cite: 18]। ताहि परेरै रतन काया छै, लाभे किसे बिचारे[cite: 18]। जे नवीये नवणी, खवीये खवणी, जरिये जरणी, करिये करणी, तो सीख हुआ घर जाइये[cite: 18]। रतन काया साचे की ढोली गुरु परसादे केवल ज्ञाने[cite: 18]। धर्म अचारे शीले संजमें सतगुरु तुठे पाइये ॥23॥[cite: 18]" },
  { id: 29, title: "सबद - 29 (इलोल सागर)", text: "ओ३म् गुरु के शब्द असंख्य प्रबोधी खार समन्द परीलो[cite: 20]। खार समन्द परे परे रै चैखण्ड खारूं, पहला अन्त न पारूं[cite: 20]। अनन्त क्रोड़ गुरु की दावण बिलंबी, करणी साच तरीलो[cite: 20]। सांझे जमों सवेरे थापण, गुरु की नाथ डरीलो[cite: 20]। भगवीं टोपी थल शिर आयो, हेत मिलाण करीलो[cite: 20]। अम्बाराय बधाई बाजे, हृदय हरि सिंवरीलो[cite: 20]। कृष्ण मया चैखण्ड कृषांणी, जम्बूदीप चरीलो[cite: 20]। म्हे अवधू निरपख जोगी, सहज नगर का रायों[cite: 20]। जो आवे सो त्यूं थरपां, साचा सूं सत भायों[cite: 20, 21]। म्हारे मन ही मुद्रा तन ही कंथा, जोग मारग सहलीयों[cite: 21]। डाकण साकण निद्रा खुद्या, ये मेरे मूल न थीयों ॥29॥[cite: 21]" },
  { id: 30, title: "सबद - 30 (कूंचीवाला)", text: "ओ३म् आयो हंकारो जीवड़ो बुलायो[cite: 21]। कह जीवड़ा क्या करण कमायो[cite: 21]। थरहर कंपै जीवड़ो डोलै, उतमाई पीव न कोई बोलै[cite: 21]। सुकरत साथ संगाई चालै, स्वामी पवणा पाणी नवण करंतो[cite: 21]। चन्दे सूरे शीस नवन्तो, विष्णु सुरां पोह पूछ लहन्तो[cite: 21]। इंहिं खोटे जन मन्तर स्वामी, अहनिश तेरो नाम जपन्तो[cite: 21]। पहले क्रिया आप कमाइये, तो औरां ने फरमाइये[cite: 21]। जो कुछ कीजै मरणे पहले, मत भल कहिं मर जाइये[cite: 21]। शौच स्नान करो क्यूं नाहीं, जिवड़ा काजै न्हाइये[cite: 21]। जे नविये नवणी, खविये खवणी, जरिये जरणी, करिये करणी[cite: 21]। तो सीख हुआं घर जाइये ॥30॥[cite: 21]" },
  { id: 67, title: "सबद - 67 (शुक्ल हंस)", text: "ओ३म् श्री गढ़ आल मोत पुर पाटण भुय नागोरी[cite: 34]। म्हे ऊंडे नीरे अवतार लियो[cite: 34]। होम करीलो दिन ठावीलो, सहस रचीलो[cite: 34]। राय विष्णु से बाद न कीजै[cite: 34]। कांय बधारों दैत्य कुलू[cite: 34]। मेरे मांय न बाप न बहण न भाई[cite: 34]। साख न सैण न लोक जणो[cite: 34]। बैकुण्ठे विश्वास बिलम्बण[cite: 34]। पार गिराये मात खिणूं[cite: 34]। विष्णु विष्णु तू भण रे प्राणी[cite: 34]। विष्णु भणन्ता अनन्त गुणूं[cite: 34]। दया रूप म्हे आप बखाणां[cite: 35]। संहार रूप म्हे आप हती ॥67॥[cite: 35]" },
  { id: 101, title: "सबद - 101 (नित ही मावस)", text: "ओ३म् नितही मावस नित संकरांति, नितही नवग्रह वैसे पांति[cite: 46]। नितही गंग हिलोरे जाय, सतगुरु चीन्है सहजै न्हाय[cite: 46]। निरमल पाणी निरमल घाट, निरमल धोबी पांड्यो पाट[cite: 46]। जे यो धोबी जाणै धोय, घर में मैला वस्त्र रहे न कोय[cite: 46]। एकमन एकचित साबण लावै पहरंतो गाहक अति सुख पावै[cite: 46]। तिल में तेल पहुप में वास, पांच तत्त्व में लियो प्रकाश[cite: 46]। सतगुरु ऐसा तत्त्व बतावै, जुग जुग जीवै बहुर न आव ॥101॥[cite: 46]" },
  { id: 102, title: "सबद - 102 (अजर जरीजै)", text: "ओ३म् विष्णु-विष्णु भण अजर जरीजै, धर्म हुवै पापां छूटीजै[cite: 46]। हरि पर हरि को नाम जपीजै, हरियालो हरि आण हरूं[cite: 46]। हरी नारायण देव नरूं[cite: 46]। आशा सास निराश भईलो, पाईलो मोक्ष द्वार खिणं ॥102॥[cite: 46]" },
  { id: 119, title: "सबद - 119 (रतन काया)", text: "ओ३म् विष्णु विष्णु तू भणरे प्राणी, पैंके लाख उपाजूं[cite: 51]। रतन काया बैकुण्ठे बासो, तेरा जरा मरण भय भाजूं ॥119॥[cite: 51]" },
  { id: 120, title: "सबद - 120 (अंतिम पावन वाणी)", text: "ओ३म् विष्णु विष्णु तू भणरे प्राणी, इस जीवन के हावैं क्षण क्षण आव घटंती जावै, मरण दिनों दिन आवै[cite: 51]। पालटीयो घट कांय न चेत्यो, घाती रोल भनावै[cite: 51]। गुरु मुख मुरखा चढै न पोहण, मन मुख भार उठावै[cite: 51]। ज्यूं लाज दुनी की लाजै, त्यूं त्यूं दाब्यो दाबै[cite: 51]। भलिया होय सो भली बुध आवै बुरिया बुरी कमावे ॥120॥[cite: 51]" }
];

// 4. ELDER-FRIENDLY FONT SIZE & ACCESSIBILITY ENGINE
function applyGlobalElderFont(zoomPercent) {
  appFontZoom = Math.min(150, Math.max(95, zoomPercent));
  localStorage.setItem('bishnoi_elder_font_zoom', appFontZoom.toString());

  let styleEl = document.getElementById('elderDynamicFontStyle');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'elderDynamicFontStyle';
    document.head.appendChild(styleEl);
  }

  const ratio = appFontZoom / 100;
  styleEl.innerHTML = `
    html { font-size: ${16 * ratio}px !important; }
    .text-\\[10px\\], .text-\\[11px\\] { font-size: ${Math.max(12, Math.round(12 * ratio))}px !important; line-height: 1.5 !important; }
    .text-xs { font-size: ${Math.max(13, Math.round(14 * ratio))}px !important; line-height: 1.55 !important; }
    .text-sm { font-size: ${Math.max(15, Math.round(16 * ratio))}px !important; line-height: 1.6 !important; }
    /* Fix Quiz Leaderboard Long Names Cutting */
    #winner1Name, #winner2Name, #winner3Name {
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: unset !important;
      word-break: break-word !important;
      line-height: 1.35 !important;
      display: block !important;
      min-height: 2.2em;
    }
  `;

  const badge = document.getElementById('elderFontStatusBadge');
  if (badge) badge.innerText = `${appFontZoom}%`;
}

function injectElderAccessibilityBar() {
  if (document.getElementById('elderAccessibilityBar')) return;
  const bar = document.createElement('div');
  bar.id = 'elderAccessibilityBar';
  bar.className = 'bg-[#0f291a] text-white px-3 py-1.5 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs sticky top-0 z-[90]';
  bar.innerHTML = `
    <div class="flex items-center gap-1.5 font-semibold text-amber-300">
      <span>👓</span>
      <span>अक्षर आकार (बुजुर्ग सुविधा):</span>
      <span id="elderFontStatusBadge" class="px-1.5 py-0.5 bg-black/40 rounded text-[11px] text-white">${appFontZoom}%</span>
    </div>
    <div class="flex items-center gap-1.5">
      <button onclick="applyGlobalElderFont(appFontZoom - 10)" class="px-2.5 py-1 rounded bg-stone-700 hover:bg-stone-600 text-white font-bold border border-stone-500">
        अ- छोटा
      </button>
      <button onclick="applyGlobalElderFont(105)" class="px-2.5 py-1 rounded bg-stone-700 hover:bg-stone-600 text-white font-semibold border border-stone-500">
        सामान्य
      </button>
      <button onclick="applyGlobalElderFont(appFontZoom + 10)" class="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold shadow">
        अ+ बड़ा करें
      </button>
      <button onclick="applyGlobalElderFont(135)" class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold border border-emerald-400">
        👴 बुजुर्ग मोड
      </button>
    </div>
  `;
  document.body.insertBefore(bar, document.body.firstChild);
  applyGlobalElderFont(appFontZoom);
}

// 5. DEVICE DETECTION & MAINTENANCE ENGINE
function isPhoneOrInstalledApp() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isNarrowScreen = window.innerWidth <= 768;
  return isStandalone || isMobileUA || isNarrowScreen;
}

function shouldLockForCurrentDevice(mode) {
  if (!mode || mode === 'off') return false;
  if (currentUser && currentUser.isOwner) return false;
  const onPhone = isPhoneOrInstalledApp();
  if (mode === 'both') return true;
  if (mode === 'phone_only' && onPhone) return true;
  if (mode === 'web_only' && !onPhone) return true;
  return false;
}

function injectDynamicModalsAndUI() {
  injectElderAccessibilityBar();

  // Load PDF.js Library dynamically for smooth full-width mobile PDF rendering
  if (!window.pdfjsLib) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };
    document.head.appendChild(script);
  }

  // 1. Global Maintenance Overlay
  if (!document.getElementById('globalMaintenanceOverlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'globalMaintenanceOverlay';
    overlay.className = 'fixed inset-0 z-[9999] bg-[#143622] text-white hidden flex-col items-center justify-center p-6 text-center';
    overlay.innerHTML = `
      <div class="max-w-md w-full bg-white/10 backdrop-blur-md border border-amber-400/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="text-5xl animate-bounce">🛠️</div>
        <h1 class="font-yatra text-2xl text-amber-300">सेवा अस्थायी रूप से रखरखाव में है</h1>
        <p id="globalMaintMsgText" class="text-sm text-stone-200 leading-relaxed"></p>
        <div class="p-3 rounded-xl bg-black/25 border border-white/10 text-xs text-amber-200">
          "जीव दया पालणी, रूंख लीलो नी घावै" — हम शीघ्र ही नए अपडेट के साथ लौटेंगे।
        </div>
        <div class="pt-4 border-t border-white/10 flex justify-center">
          <button onclick="ownerEmergencyUnlock()" class="text-xs text-stone-300 hover:text-amber-300 underline">
            🛡️ व्यवस्थापक लॉगिन (Owner Bypass)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // 2. Section-Specific Maintenance Card
  if (!document.getElementById('sectionMaintenanceCard')) {
    const secCard = document.createElement('div');
    secCard.id = 'sectionMaintenanceCard';
    secCard.className = 'hidden max-w-xl mx-auto my-8 bg-white p-6 rounded-2xl border-2 border-amber-300 text-center space-y-3 shadow-md';
    secCard.innerHTML = `
      <div class="text-4xl">🚧</div>
      <h2 class="font-yatra text-xl text-forest">यह अनुभाग अभी मेंटेनेंस में है</h2>
      <p id="sectionMaintMsgText" class="text-sm text-stone-600 leading-relaxed">
        इस सेक्शन में सुधार एवं नए अपडेट जोड़े जा रहे हैं। कृपया अन्य सेक्शन का उपयोग करें या कुछ समय बाद पुनः प्रयास करें।
      </p>
      <button onclick="switchTab('home')" class="mt-2 px-4 py-2 bg-forest text-white rounded-lg text-sm font-semibold hover:bg-emerald-950 transition">
        🏠 मुख्य पृष्ठ पर जाएं
      </button>
    `;
    const mainEl = document.querySelector('main') || document.body;
    mainEl.appendChild(secCard);
  }

  // 3. ELDER-FRIENDLY FULL-SCREEN SMART BOOK & PDF READER MODAL
  if (!document.getElementById('inbuiltPdfModal')) {
    const pdfModal = document.createElement('div');
    pdfModal.id = 'inbuiltPdfModal';
    pdfModal.className = 'fixed inset-0 z-[9990] bg-[#FAF7EE] hidden flex-col';
    pdfModal.innerHTML = `
      <!-- Top Control Header -->
      <div class="bg-[#143622] text-white px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-lg border-b-2 border-amber-500">
        <div class="flex items-center gap-2 truncate max-w-[60%]">
          <span class="text-xl">📖</span>
          <h3 id="pdfViewerTitle" class="font-yatra text-base sm:text-lg text-amber-300 truncate">साहित्य पाठक</h3>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a id="pdfModalDownloadBtn" href="#" download class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold border border-emerald-400">
            📥 डाउनलोड
          </a>
          <button onclick="closeInbuiltPdfViewer()" class="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-extrabold shadow">
            ✕ बंद करें
          </button>
        </div>
      </div>

      <!-- Elder Toolbar (Font Size, Mode Switch, Audio Speak) -->
      <div id="smartReaderToolbar" class="bg-amber-100 border-b border-amber-300 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div id="shabadSelectWrap" class="flex items-center gap-1.5">
          <label class="font-bold text-forest">चुनें:</label>
          <select id="shabadJumpSelect" onchange="renderSelectedShabadView()" class="p-1.5 rounded-lg border border-amber-400 bg-white font-bold text-forest">
            <option value="all">📜 सभी प्रमुख सबद एक साथ</option>
          </select>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <button onclick="adjustReaderFont(-3)" class="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-900 rounded-lg font-extrabold border border-stone-400 shadow-sm">
            अ- छोटा
          </button>
          <button onclick="adjustReaderFont(3)" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg font-extrabold border border-amber-600 shadow-sm">
            अ+ अक्षर बड़ा करें
          </button>
          <button id="speakShabadBtn" onclick="speakCurrentReaderText()" class="px-3 py-1.5 bg-forest hover:bg-emerald-900 text-white rounded-lg font-bold shadow-sm">
            🔊 सुनें
          </button>
          <button id="togglePdfModeBtn" onclick="switchToRawPdfCanvasMode()" class="px-2.5 py-1.5 bg-stone-700 hover:bg-stone-800 text-white rounded-lg font-semibold">
            📄 मूल PDF पृष्ठ देखें
          </button>
        </div>
      </div>

      <!-- Mode A: Elder-Friendly Auto-Fit Digital Text Container (Zero Horizontal Scroll) -->
      <div id="digitalBookContainer" class="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6"></div>

      <!-- Mode B: Full-Width Canvas PDF Renderer (Auto-Fits Mobile Width + Easy +/- Buttons) -->
      <div id="pdfCanvasContainer" class="hidden flex-1 overflow-y-auto bg-stone-800 p-2 sm:p-4 flex-col items-center gap-4">
        <div class="sticky top-2 z-20 bg-black/80 text-white px-4 py-2 rounded-full flex items-center gap-3 shadow-xl border border-white/20">
          <button onclick="zoomPdfCanvas(-0.25)" class="px-3 py-1 bg-stone-700 rounded-lg font-bold text-sm">➖ छोटा</button>
          <span id="pdfZoomLabel" class="text-xs font-bold text-amber-300">Auto-Fit</span>
          <button onclick="zoomPdfCanvas(0.25)" class="px-3 py-1 bg-amber-500 text-black rounded-lg font-extrabold text-sm">➕ बड़ा करें (Zoom)</button>
        </div>
        <div id="pdfPagesHolder" class="w-full max-w-4xl flex flex-col items-center gap-4"></div>
        <iframe id="pdfFallbackIframe" class="hidden w-full h-[82vh] bg-white rounded-xl border-0"></iframe>
      </div>
    `;
    document.body.appendChild(pdfModal);

    // Populate Shabad Dropdown
    const sel = document.getElementById('shabadJumpSelect');
    if (sel) {
      SHABADWANI_DIGITAL_BOOK.forEach((item, idx) => {
        const opt = document.createElement('option');
        opt.value = idx.toString();
        opt.innerText = item.title;
        sel.appendChild(opt);
      });
    }
  }

  // 4. User & Owner Profile Modal
  if (!document.getElementById('userProfileModal')) {
    const profModal = document.createElement('div');
    profModal.id = 'userProfileModal';
    profModal.className = 'fixed inset-0 z-[9980] bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4 overflow-y-auto';
    profModal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full p-5 space-y-3.5 border border-stone-200 shadow-2xl my-auto">
        <div class="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div>
            <h3 class="font-yatra text-lg text-forest">👤 मेरी प्रोफ़ाइल (My Profile)</h3>
            <p id="profileRoleBadge" class="text-xs font-bold text-stone-500"></p>
          </div>
          <button onclick="closeProfileModal()" class="text-stone-400 hover:text-stone-700 text-lg font-bold">✕</button>
        </div>

        <div class="space-y-2.5 text-xs">
          <div>
            <label class="font-bold text-stone-700 block mb-1">आपका नाम (Full Name):</label>
            <input type="text" id="profEditName" class="w-full p-2.5 rounded-lg border border-stone-300 font-semibold" placeholder="अपना नाम लिखें">
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="font-bold text-stone-700 block mb-1">गाँव / ज़िला (Location):</label>
              <input type="text" id="profEditLocation" class="w-full p-2.5 rounded-lg border border-stone-300" placeholder="उदा: हिसार, हरियाणा">
            </div>
            <div>
              <label class="font-bold text-stone-700 block mb-1">नया पासवर्ड (ऐच्छिक):</label>
              <input type="password" id="profEditPass" class="w-full p-2.5 rounded-lg border border-stone-300" placeholder="बदलना हो तो लिखें">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="p-2 rounded-lg bg-stone-50 border border-stone-200">
              <span class="text-[10px] text-stone-400 block">मोबाइल / खाता आईडी</span>
              <span id="profPhoneDisplay" class="font-bold text-stone-800 truncate block"></span>
            </div>
            <div class="p-2 rounded-lg bg-stone-50 border border-stone-200">
              <span class="text-[10px] text-stone-400 block">Google ईमेल सत्यापन</span>
              <span id="profEmailDisplay" class="font-bold text-emerald-700 truncate block"></span>
            </div>
          </div>

          <div id="profGoogleLinkWrap" class="pt-1">
            <button type="button" onclick="linkGoogleAccount()" class="w-full py-2 px-3 border border-stone-300 hover:bg-stone-50 rounded-lg font-semibold flex items-center justify-center gap-2 text-stone-700 transition">
              <span>🌐</span> <span id="profGoogleBtnText">Google अकाउंट जोड़ें (पासवर्ड रिकवरी हेतु)</span>
            </button>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-1 text-center">
            <div class="p-2 rounded-lg bg-amber-50 border border-amber-200">
              <div id="statMalaTotal" class="font-bold text-sm text-forest">0</div>
              <div class="text-[10px] text-stone-500">कुल मंत्र जप</div>
            </div>
            <div class="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <div id="statMalaLaps" class="font-bold text-sm text-forest">0</div>
              <div class="text-[10px] text-stone-500">पूर्ण माला</div>
            </div>
            <div class="p-2 rounded-lg bg-stone-100 border border-stone-200">
              <div id="statChatCount" class="font-bold text-sm text-forest">0</div>
              <div class="text-[10px] text-stone-500">संवाद संदेश</div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-2 border-t border-stone-100">
          <button onclick="saveUserProfileChanges()" class="flex-1 py-2.5 bg-forest hover:bg-emerald-950 text-white font-bold text-xs rounded-lg shadow transition">
            💾 प्रोफ़ाइल सहेजें (Save)
          </button>
          <button onclick="closeProfileModal()" class="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-lg">
            बंद करें
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(profModal);
  }

  // 5. Forgot Password Modal
  if (!document.getElementById('forgotPassModal')) {
    const fpModal = document.createElement('div');
    fpModal.id = 'forgotPassModal';
    fpModal.className = 'fixed inset-0 z-[9985] bg-black/60 backdrop-blur-sm hidden items-center justify-center p-4';
    fpModal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-stone-200 shadow-2xl">
        <div class="flex items-center justify-between border-b border-stone-100 pb-2">
          <h3 class="font-yatra text-lg text-forest">🔑 पासवर्ड रीसेट (Forgot Password)</h3>
          <button onclick="closeForgotPassModal()" class="text-stone-400 hover:text-stone-700 font-bold">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <p class="text-stone-600 leading-relaxed">
            अपना १०-अंकों का मोबाइल नंबर और नया पासवर्ड लिखें, फिर सुरक्षा सत्यापन के लिए अपने जुड़े हुए Google खाते से पुष्टि करें:
          </p>
          <div>
            <label class="font-bold text-stone-700 block mb-1">पंजीकृत मोबाइल नंबर:</label>
            <input type="text" id="fpPhoneInput" maxlength="10" placeholder="10 अंकों का मोबाइल नंबर" class="w-full p-2.5 rounded-lg border border-stone-300 font-semibold">
          </div>
          <div>
            <label class="font-bold text-stone-700 block mb-1">नया पासवर्ड (New Password):</label>
            <input type="password" id="fpNewPassInput" placeholder="नया पासवर्ड बनाएं" class="w-full p-2.5 rounded-lg border border-stone-300">
          </div>

          <button type="button" onclick="verifyGoogleAndResetPassword()" class="w-full py-2.5 px-3 bg-forest hover:bg-emerald-950 text-white rounded-xl font-bold shadow flex items-center justify-center gap-2 transition">
            <span>🌐</span> <span>Google से सत्यापित कर पासवर्ड बदलें</span>
          </button>

          <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-stone-600 space-y-1.5">
            <div class="font-bold text-amber-900">💡 Google लिंक नहीं किया था?</div>
            <p>१. आप बिना पासवर्ड के सीधे <b>"🌐 Google से 1-Click लॉगिन करें"</b> बटन दबाकर अंदर जा सकते हैं।</p>
            <p>२. अथवा व्यवस्थापक (Admin) से अपना पासवर्ड रीसेट करवा सकते हैं।</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(fpModal);
  }

  // 6. Inject Forgot Password & Google Login into Auth Modal
  const authForm = document.querySelector('#authModal form');
  if (authForm && !document.getElementById('googleAuthModalBtn')) {
    const extraDiv = document.createElement('div');
    extraDiv.className = 'pt-2 border-t border-stone-200 space-y-2';
    extraDiv.innerHTML = `
      <div class="flex justify-end">
        <button type="button" onclick="openForgotPassModal()" class="text-xs font-bold text-terracotta hover:underline">
          🔑 पासवर्ड भूल गए? (Forgot Password)
        </button>
      </div>
      <button id="googleAuthModalBtn" type="button" onclick="signInOrVerifyWithGoogle()" class="w-full py-2.5 px-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition">
        <span>🌐</span> <span>Google से 1-Click लॉगिन करें</span>
      </button>
    `;
    authForm.appendChild(extraDiv);
  }

  // 7. Inject Admin User Password Reset & Audio Delete Manager in #tab-admin
  const adminTab = document.getElementById('tab-admin');
  if (adminTab && !document.getElementById('adminUserPassResetCard')) {
    const resetCard = document.createElement('div');
    resetCard.id = 'adminUserPassResetCard';
    resetCard.className = 'bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3 mt-4';
    resetCard.innerHTML = `
      <h3 class="font-yatra text-base text-forest">🔑 सदस्य पासवर्ड रीसेट (Admin User Password Reset)</h3>
      <p class="text-xs text-stone-500">यदि कोई सदस्य अपना पासवर्ड भूल गया है, तो यहाँ से उसका नया पासवर्ड सेट करें:</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <input type="text" id="adminResetUserPhone" maxlength="10" placeholder="सदस्य का 10-अंकों का नंबर" class="p-2 rounded-lg border border-stone-300">
        <input type="text" id="adminResetUserNewPass" placeholder="नया पासवर्ड (उदा: 123456)" class="p-2 rounded-lg border border-stone-300">
        <button onclick="adminResetMemberPassword()" class="py-2 px-4 bg-terracotta hover:bg-orange-800 text-white font-bold rounded-lg shadow transition">
          पासवर्ड बदलें
        </button>
      </div>
      <div class="pt-3 border-t border-stone-100">
        <h4 class="font-bold text-xs text-forest mb-2">🎵 अपलोड किए गए भजन / ऑडियो सूची:</h4>
        <div id="adminAudioManageList" class="space-y-1.5 text-xs"></div>
      </div>
    `;
    adminTab.appendChild(resetCard);
  }

  // 8. Inject Status Card Download Button next to Banner
  const bannerTextEl = document.getElementById('dailyBannerText');
  if (bannerTextEl && bannerTextEl.parentElement && !document.getElementById('statusCardGenBtn')) {
    const btn = document.createElement('button');
    btn.id = 'statusCardGenBtn';
    btn.onclick = downloadSuvicharStatusCard;
    btn.className = 'mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-semibold border border-amber-300/30 transition';
    btn.innerHTML = '🖼️ स्टेटस कार्ड डाउनलोड करें';
    bannerTextEl.parentElement.appendChild(btn);
  }
}

function ownerEmergencyUnlock() {
  const phone = prompt("व्यवस्थापक मोबाइल नंबर (Owner Phone):");
  const pass = prompt("पासवर्ड (Owner Password):");
  if (phone && phone.trim() === OWNER_PHONE && pass && pass.trim() === OWNER_PASS) {
    currentUser = { name: "व्यवस्थापक (Owner)", phone: OWNER_PHONE, isOwner: true, location: "मुख्यालय" };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    syncOwnerCustomName();
    updateNavAuth();
    applyMaintenanceRules();
    showToast("व्यवस्थापक एक्सेस अनलॉक हो गया!");
    switchTab('admin');
  } else {
    alert("गलत व्यवस्थापक विवरण!");
  }
}

function listenMaintenanceConfig() {
  db.collection('settings').doc('maintenance').onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      maintenanceConfig.globalMode = data.globalMode || 'off';
      maintenanceConfig.message = data.message || 'हम आपके अनुभव को बेहतर बनाने के लिए ऐप को अपडेट कर रहे हैं। कृपया कुछ समय बाद पुनः प्रयास करें।';
      maintenanceConfig.sections = Object.assign({
        mala: 'off', niyams: 'off', library: 'off', community: 'off', quiz: 'off', history: 'off'
      }, data.sections || {});

      const globalSel = document.getElementById('adminGlobalMaintMode');
      const msgInp = document.getElementById('adminMaintMessage');
      if (globalSel) globalSel.value = maintenanceConfig.globalMode;
      if (msgInp) msgInp.value = maintenanceConfig.message;

      ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
        const el = document.getElementById(`lock_${sec}`);
        if (el) el.value = maintenanceConfig.sections[sec] || 'off';
      });
    }
    applyMaintenanceRules();
  });
}

function applyMaintenanceRules() {
  const overlay = document.getElementById('globalMaintenanceOverlay');
  if (!overlay) return;

  if (shouldLockForCurrentDevice(maintenanceConfig.globalMode)) {
    document.getElementById('globalMaintMsgText').innerText = maintenanceConfig.message;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    return;
  } else {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
  }
  enforceTabMaintenance(currentActiveTab);
}

function enforceTabMaintenance(tabId) {
  const secCard = document.getElementById('sectionMaintenanceCard');
  const target = document.getElementById(`tab-${tabId}`);
  if (!secCard || !target) return;

  const lockMode = maintenanceConfig.sections[tabId] || 'off';
  if (shouldLockForCurrentDevice(lockMode)) {
    target.classList.add('hidden');
    document.getElementById('sectionMaintMsgText').innerText = maintenanceConfig.message;
    secCard.classList.remove('hidden');
  } else {
    secCard.classList.add('hidden');
    target.classList.remove('hidden');
  }
}

async function saveMaintenanceSettings() {
  if (!currentUser || !currentUser.isOwner) return showToast("केवल व्यवस्थापक ही इसे बदल सकते हैं!");

  const globalMode = document.getElementById('adminGlobalMaintMode')?.value || 'off';
  const message = document.getElementById('adminMaintMessage')?.value.trim() || 'ऐप में नए अपडेट जोड़े जा रहे हैं, कृपया कुछ समय बाद प्रयास करें।';

  const sections = {};
  ['mala', 'niyams', 'library', 'community', 'quiz', 'history'].forEach(sec => {
    sections[sec] = document.getElementById(`lock_${sec}`)?.value || 'off';
  });

  await db.collection('settings').doc('maintenance').set({
    globalMode, message, sections,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast("🛠️ मेंटेनेंस सेटिंग्स लाइव लागू हो गईं!");
}

// 6. TOAST & MODAL UTILITIES
function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  document.getElementById('toastMsg').innerText = msg;
  toast.classList.remove('-translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('-translate-y-20', 'opacity-0');
  }, 3200);
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

// 7. APPLICATION INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
  injectDynamicModalsAndUI();
  syncOwnerCustomName();
  updateNavAuth();
  listenMaintenanceConfig();
  renderNiyams(NIYAMS_DATA);
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
  listenAmavasyaConfig();
  renderMalaCounters();
});

async function syncOwnerCustomName() {
  if (currentUser && (currentUser.isOwner || currentUser.phone === OWNER_PHONE)) {
    currentUser.isOwner = true;
    try {
      const doc = await db.collection('users').doc(OWNER_PHONE).get();
      if (doc.exists) {
        const d = doc.data();
        currentUser.name = d.name || currentUser.name;
        currentUser.location = d.location || '';
        currentUser.email = d.email || '';
        localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
        updateNavAuth();
      }
    } catch (e) {}
  }
}

// 8. NAVIGATION CONTROLS
function switchTab(id) {
  currentActiveTab = id;
  ['home', 'mala', 'niyams', 'library', 'community', 'quiz', 'history', 'admin'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const nav = document.getElementById(`nav-${t}`);
    if (el) el.classList.add('hidden');
    if (nav) nav.classList.remove('nav-btn-active');
  });

  const target = document.getElementById(`tab-${id}`);
  const activeNav = document.getElementById(`nav-${id}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('view-panel');
  }
  if (activeNav) activeNav.classList.add('nav-btn-active');

  enforceTabMaintenance(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchHistorySubTab(sub) {
  const histView = document.getElementById('historySubView');
  const kidsView = document.getElementById('kidsSubView');
  const histBtn = document.getElementById('sub-history-btn');
  const kidsBtn = document.getElementById('sub-kids-btn');

  if (sub === 'full-history') {
    histView.classList.remove('hidden');
    kidsView.classList.add('hidden');
    histBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
    kidsBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600 hover:text-forest";
  } else {
    histView.classList.add('hidden');
    kidsView.classList.remove('hidden');
    kidsBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-forest text-white shadow-sm";
    histBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-stone-600 hover:text-forest";
  }
}

// 9. AUTHENTICATION, 1-CLICK GOOGLE LOGIN & 3-LEVEL FORGOT PASSWORD
function openAuthModal() {
  document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  document.getElementById('nameRow').classList.toggle('hidden', !isRegisterMode);
  document.getElementById('authTitle').innerText = isRegisterMode ? "नया पंजीकरण (Register)" : "लॉगिन (Sign In)";
  document.getElementById('authSubmitBtn').innerText = isRegisterMode ? "खाता बनाएं (Register)" : "लॉगिन करें";
  document.getElementById('authToggleBtn').innerText = isRegisterMode 
    ? "पहले से पंजीकृत हैं? लॉगिन करें" 
    : "नए सदस्य हैं? पहले पंजीकरण (Register) करें";
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('loginPhone').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const nameInput = document.getElementById('loginName')?.value.trim() || '';

  // 1. OWNER LOGIN CHECK (9306894518 / bishnoi29)
  if (phone === OWNER_PHONE && pass === OWNER_PASS) {
    let ownerName = "व्यवस्थापक (Owner)";
    let ownerLoc = "";
    let ownerEmail = "";
    try {
      const oDoc = await db.collection('users').doc(OWNER_PHONE).get();
      if (oDoc.exists) {
        ownerName = oDoc.data().name || ownerName;
        ownerLoc = oDoc.data().location || "";
        ownerEmail = oDoc.data().email || "";
      }
    } catch (err) {}

    currentUser = { name: ownerName, phone: OWNER_PHONE, isOwner: true, location: ownerLoc, email: ownerEmail };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    applyMaintenanceRules();
    closeAuthModal();
    showToast(`🛡️ व्यवस्थापक के रूप में स्वागत है, ${currentUser.name}!`);
    switchTab('admin');
    return;
  }

  // 2. REGULAR 10-DIGIT MOBILE CHECK
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return showToast("कृपया सही १० अंकों का भारतीय मोबाइल नंबर दर्ज करें!");
  }

  // Registration Mode
  if (isRegisterMode) {
    if (!nameInput) return showToast("कृपया अपना पूरा नाम दर्ज करें!");
    try {
      const userDoc = await db.collection('users').doc(phone).get();
      if (userDoc.exists) {
        return showToast("यह नंबर पहले से पंजीकृत है! कृपया लॉगिन करें।");
      }
      const isOwnerNum = (phone === OWNER_PHONE);
      await db.collection('users').doc(phone).set({
        name: nameInput,
        phone: phone,
        pass: pass,
        email: "",
        location: "",
        registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      currentUser = { name: nameInput, phone: phone, isOwner: isOwnerNum, email: "", location: "" };
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      updateNavAuth();
      closeAuthModal();
      showToast(`पंजीकरण सफल! स्वागत है, ${currentUser.name}`);
    } catch (err) {
      showToast("पंजीकरण में त्रुटि: " + err.message);
    }
    return;
  }

  // Sign In Mode
  try {
    const userDoc = await db.collection('users').doc(phone).get();
    if (!userDoc.exists) {
      return showToast("यह नंबर पंजीकृत नहीं है! कृपया पहले Register करें या Google से लॉगिन करें।");
    }

    const userData = userDoc.data();
    if (userData.pass && userData.pass !== pass) {
      return showToast("गलत पासवर्ड! यदि भूल गए हैं तो 'पासवर्ड भूल गए?' पर क्लिक करें।");
    }

    await db.collection('users').doc(phone).update({
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    });

    currentUser = {
      name: userData.name || "सदस्य",
      phone: phone,
      isOwner: (phone === OWNER_PHONE),
      email: userData.email || "",
      location: userData.location || ""
    };
    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    closeAuthModal();
    showToast(`स्वागत है, ${currentUser.name}!`);
  } catch (err) {
    showToast("लॉगिन त्रुटि: " + err.message);
  }
}

async function signInOrVerifyWithGoogle() {
  if (!firebase.auth) {
    return showToast("कृपया पेज को रिफ्रेश (Ctrl+F5) करें!");
  }
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    const gUser = result.user;
    if (!gUser) return;

    const typedPhone = document.getElementById('loginPhone')?.value.trim() || '';
    let targetDocId = '';
    let existingData = null;

    const emailSnap = await db.collection('users').where('email', '==', gUser.email).limit(1).get();
    if (!emailSnap.empty) {
      targetDocId = emailSnap.docs[0].id;
      existingData = emailSnap.docs[0].data();
    } else if (/^[6-9]\d{9}$/.test(typedPhone)) {
      targetDocId = typedPhone;
      const pDoc = await db.collection('users').doc(targetDocId).get();
      if (pDoc.exists) existingData = pDoc.data();
    } else {
      targetDocId = `google_${gUser.uid.substring(0, 10)}`;
      const gDoc = await db.collection('users').doc(targetDocId).get();
      if (gDoc.exists) existingData = gDoc.data();
    }

    const finalName = (existingData && existingData.name) ? existingData.name : (gUser.displayName || "सदस्य");
    const finalLoc = (existingData && existingData.location) ? existingData.location : "";
    const finalPhone = (existingData && existingData.phone) ? existingData.phone : (/^[6-9]\d{9}$/.test(typedPhone) ? typedPhone : "Google Verified");
    const isOwnerAccount = (targetDocId === OWNER_PHONE) || (finalPhone === OWNER_PHONE);

    await db.collection('users').doc(targetDocId).set({
      name: finalName,
      phone: finalPhone,
      email: gUser.email || "",
      googleVerified: true,
      location: finalLoc,
      registeredAt: (existingData && existingData.registeredAt) ? existingData.registeredAt : firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    currentUser = {
      name: finalName,
      phone: targetDocId,
      email: gUser.email || "",
      location: finalLoc,
      isOwner: isOwnerAccount
    };

    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    applyMaintenanceRules();
    closeAuthModal();
    showToast(`✅ Google लॉगिन सफल! स्वागत है, ${currentUser.name}`);
  } catch (err) {
    showToast("Google लॉगिन त्रुटि: " + err.message);
  }
}

function openForgotPassModal() {
  const typedPhone = document.getElementById('loginPhone')?.value.trim() || '';
  closeAuthModal();
  const modal = document.getElementById('forgotPassModal');
  if (!modal) return;
  if (typedPhone) document.getElementById('fpPhoneInput').value = typedPhone;
  document.getElementById('fpNewPassInput').value = '';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeForgotPassModal() {
  const modal = document.getElementById('forgotPassModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function verifyGoogleAndResetPassword() {
  const phone = document.getElementById('fpPhoneInput')?.value.trim() || '';
  const newPass = document.getElementById('fpNewPassInput')?.value.trim() || '';

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return showToast("कृपया अपना १०-अंकों का मोबाइल नंबर सही दर्ज करें!");
  }
  if (!newPass || newPass.length < 4) {
    return showToast("कृपया कम से कम ४ अक्षरों का नया पासवर्ड लिखें!");
  }

  try {
    const userRef = db.collection('users').doc(phone);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return showToast("यह मोबाइल नंबर पंजीकृत नहीं है!");
    }

    const userData = userDoc.data();
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    const gUser = result.user;
    if (!gUser || !gUser.email) return;

    if (userData.email && userData.email.toLowerCase() !== gUser.email.toLowerCase()) {
      return showToast("⚠️ यह Google खाता इस मोबाइल नंबर से मेल नहीं खाता! कृपया सही Google खाता चुनें।");
    }

    await userRef.set({
      pass: newPass,
      email: gUser.email,
      googleVerified: true,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    currentUser = {
      name: userData.name || gUser.displayName || "सदस्य",
      phone: phone,
      email: gUser.email,
      location: userData.location || "",
      isOwner: (phone === OWNER_PHONE)
    };

    localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
    updateNavAuth();
    closeForgotPassModal();
    showToast("✅ पासवर्ड सफलतापूर्वक बदल गया और आप लॉगिन हो गए हैं!");
  } catch (err) {
    showToast("पासवर्ड रीसेट त्रुटि: " + err.message);
  }
}

async function adminResetMemberPassword() {
  if (!currentUser || !currentUser.isOwner) return showToast("केवल व्यवस्थापक के लिए!");
  const phone = document.getElementById('adminResetUserPhone')?.value.trim() || '';
  const newPass = document.getElementById('adminResetUserNewPass')?.value.trim() || '';

  if (!/^[6-9]\d{9}$/.test(phone)) return showToast("कृपया सदस्य का सही १०-अंकों का मोबाइल नंबर लिखें!");
  if (!newPass) return showToast("कृपया नया पासवर्ड लिखें!");

  try {
    const ref = db.collection('users').doc(phone);
    const doc = await ref.get();
    if (!doc.exists) return showToast("इस नंबर से कोई सदस्य पंजीकृत नहीं मिला!");

    await ref.update({
      pass: newPass,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('adminResetUserPhone').value = '';
    document.getElementById('adminResetUserNewPass').value = '';
    showToast(`✅ सदस्य (${doc.data().name || phone}) का नया पासवर्ड सेट हो गया!`);
  } catch (err) {
    showToast("त्रुटि: " + err.message);
  }
}

async function linkGoogleAccount() {
  if (!currentUser) return;
  if (!firebase.auth) return showToast("कृपया पेज रिफ्रेश करें!");
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    const gUser = result.user;
    if (gUser && gUser.email) {
      currentUser.email = gUser.email;
      localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));
      await db.collection('users').doc(currentUser.phone).set({
        email: gUser.email,
        googleVerified: true
      }, { merge: true });
      openProfileModal();
      showToast(`✅ Google ईमेल (${gUser.email}) सफलतापूर्वक जुड़ गया!`);
    }
  } catch (err) {
    showToast("Google खाता जोड़ने में त्रुटि: " + err.message);
  }
}

function openProfileModal() {
  if (!currentUser) return openAuthModal();
  const modal = document.getElementById('userProfileModal');
  if (!modal) return;

  document.getElementById('profEditName').value = currentUser.name || '';
  document.getElementById('profEditLocation').value = currentUser.location || '';
  document.getElementById('profEditPass').value = '';
  document.getElementById('profPhoneDisplay').innerText = currentUser.phone || '';
  document.getElementById('profEmailDisplay').innerText = currentUser.email ? `✓ ${currentUser.email}` : 'जुड़ा नहीं है';
  document.getElementById('profGoogleBtnText').innerText = currentUser.email ? 'Google अकाउंट बदलें' : 'Google अकाउंट जोड़ें (पासवर्ड रिकवरी हेतु)';

  const roleBadge = document.getElementById('profileRoleBadge');
  if (currentUser.isOwner) {
    roleBadge.innerText = '🛡️ मुख्य व्यवस्थापक (Owner)';
    roleBadge.className = 'text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded inline-block mt-0.5';
  } else {
    roleBadge.innerText = '👤 पंजीकृत सदस्य (Member)';
    roleBadge.className = 'text-xs font-semibold text-stone-500';
  }

  document.getElementById('statMalaTotal').innerText = malaTotalCount;
  document.getElementById('statMalaLaps').innerText = malaLapsCount;
  const myPostsCount = allChatPosts.filter(p => p.phone === currentUser.phone).length;
  document.getElementById('statChatCount').innerText = myPostsCount;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeProfileModal() {
  const modal = document.getElementById('userProfileModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function saveUserProfileChanges() {
  if (!currentUser) return;
  const newName = document.getElementById('profEditName').value.trim();
  const newLoc = document.getElementById('profEditLocation').value.trim();
  const newPass = document.getElementById('profEditPass').value.trim();

  if (!newName) return showToast("कृपया नाम खाली न छोड़ें!");

  currentUser.name = newName;
  currentUser.location = newLoc;
  localStorage.setItem('bishnoi_secure_user', JSON.stringify(currentUser));

  const updateData = {
    name: newName,
    location: newLoc,
    phone: currentUser.phone,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (newPass) updateData.pass = newPass;

  try {
    await db.collection('users').doc(currentUser.phone).set(updateData, { merge: true });
    updateNavAuth();
    closeProfileModal();
    showToast(newPass ? "✅ प्रोफ़ाइल और नया पासवर्ड सहेज लिए गए!" : "✅ आपकी प्रोफ़ाइल अपडेट हो गई!");
  } catch (err) {
    showToast("प्रोफ़ाइल सहेजने में त्रुटि: " + err.message);
  }
}

function logoutUser() {
  localStorage.removeItem('bishnoi_secure_user');
  currentUser = null;
  updateNavAuth();
  applyMaintenanceRules();
  switchTab('home');
  showToast("सफलतापूर्वक लॉगआउट किया गया।");
}

function updateNavAuth() {
  const container = document.getElementById('authActionsContainer');
  const adminNav = document.getElementById('nav-admin');
  const adminNavMob = document.getElementById('nav-admin-mobile');
  const postPrompt = document.getElementById('postAuthPrompt');
  const postEditor = document.getElementById('postEditor');

  if (currentUser) {
    container.innerHTML = `
      <button onclick="openProfileModal()" class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-forest border border-amber-300 transition flex items-center gap-1 shadow-sm" title="प्रोफ़ाइल व नाम बदलें">
        <span>${currentUser.isOwner ? '🛡️' : '👤'}</span>
        <span class="max-w-[140px] truncate">${currentUser.name}</span>
        <span class="text-[10px] text-stone-400">✎</span>
      </button>
      <button onclick="logoutUser()" class="text-xs text-stone-500 hover:text-red-700 font-semibold px-1 transition">लॉगआउट</button>
    `;
    if (postPrompt) postPrompt.classList.add('hidden');
    if (postEditor) postEditor.classList.remove('hidden');

    if (currentUser.isOwner) {
      if (adminNav) adminNav.classList.remove('hidden');
      if (adminNavMob) adminNavMob.classList.remove('hidden');
    } else {
      if (adminNav) adminNav.classList.add('hidden');
      if (adminNavMob) adminNavMob.classList.add('hidden');
    }
  } else {
    container.innerHTML = `
      <button onclick="openAuthModal()" class="px-3 py-1.5 rounded-lg bg-forest text-white text-xs font-semibold hover:bg-emerald-950 transition">
        लॉगिन / शामिल हों
      </button>
    `;
    if (postPrompt) postPrompt.classList.remove('hidden');
    if (postEditor) postEditor.classList.add('hidden');
    if (adminNav) adminNav.classList.add('hidden');
    if (adminNavMob) adminNavMob.classList.add('hidden');
  }
}

// 10. DIGITAL JAAP MALA LOGIC
function updateMantraName() {
  const selected = document.getElementById('malaMantraSelect').value;
  document.getElementById('activeMantraDisplay').innerText = selected;
}

function tapMalaBead() {
  const isVibe = document.getElementById('vibrationToggle').checked;
  if (isVibe && navigator.vibrate) navigator.vibrate(35);

  malaBeadCount++;
  malaTotalCount++;

  if (malaBeadCount >= 108) {
    malaBeadCount = 0;
    malaLapsCount++;
    if (isVibe && navigator.vibrate) navigator.vibrate([80, 50, 100]);
    showToast("ॐ शांति! एक संपूर्ण माला (१०८ जप) पूर्ण हुई। साधुवाद!");
    confetti({ particleCount: 35, spread: 50 });
  }

  saveMalaState();
  renderMalaCounters();
}

function renderMalaCounters() {
  document.getElementById('currentBeadDisplay').innerText = malaBeadCount;
  document.getElementById('malaLapsDisplay').innerText = malaLapsCount;
  document.getElementById('malaTotalDisplay').innerText = malaTotalCount;
}

function saveMalaState() {
  localStorage.setItem('bishnoi_mala_beads', malaBeadCount.toString());
  localStorage.setItem('bishnoi_mala_laps', malaLapsCount.toString());
  localStorage.setItem('bishnoi_mala_total', malaTotalCount.toString());
}

function resetMalaCounter() {
  openConfirmModal("माला शून्य करें?", "क्या आप जप माला का काउंटर पुनः ० से शुरू करना चाहते हैं?", (res) => {
    if (res) {
      malaBeadCount = 0;
      malaLapsCount = 0;
      malaTotalCount = 0;
      saveMalaState();
      renderMalaCounters();
      showToast("जप माला रीसेट हो गई।");
    }
  });
}

// 11. AUTOMATED DAILY PANCHANG & AMAVASYA
function computeAutoPanchang() {
  const now = new Date();
  const vaars = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const currentVaar = vaars[now.getDay()];
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

  document.getElementById('autoPanchangDate').innerText = `${currentVaar} • विक्रम संवत ${samvat}`;
  document.getElementById('autoPanchangDetails').innerText = `आज का दिन: ${now.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })} | ${paksha}, ${tithiName}। प्रातः होम एवं नाम स्मरण से दिन आरंभ करें।`;
}

function listenAmavasyaConfig() {
  db.collection('settings').doc('amavasyaConfig').onSnapshot(doc => {
    if (doc.exists) {
      const cfg = doc.data();
      if (cfg.name) document.getElementById('amavasyaTitleDisplay').innerText = cfg.name;
      if (cfg.desc) document.getElementById('amavasyaFastingNote').innerText = cfg.desc;
      if (cfg.date) {
        amavasyaTargetDate = new Date(cfg.date + "T00:00:00");
        startAmavasyaTimer();
      }
    }
  });
}

function startAmavasyaTimer() {
  if (amavasyaTimerInterval) clearInterval(amavasyaTimerInterval);

  function update() {
    if (!amavasyaTargetDate) return;
    const now = new Date();
    const diff = amavasyaTargetDate.getTime() - now.getTime();
    const box = document.getElementById('amavasyaCountdownBox');

    const isToday = (
      now.getFullYear() === amavasyaTargetDate.getFullYear() &&
      now.getMonth() === amavasyaTargetDate.getMonth() &&
      now.getDate() === amavasyaTargetDate.getDate()
    );

    if (isToday) {
      box.className = "text-xs font-bold text-emerald-900 bg-amber-300 p-2.5 rounded-lg border border-amber-400 text-center animate-pulse";
      box.innerHTML = "🚩 आज पावन अमावस्या व्रत दिवस है — उपवास, ध्यान, हवन एवं पाहल साधना";
      return;
    }

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      box.className = "text-xs font-semibold text-terracotta font-mono bg-white/90 p-2 rounded-lg border border-emerald-200";
      box.innerHTML = `⏳ समय शेष: <b>${days} दिन : ${hours} घंटे : ${mins} मिनट : ${secs} सेकंड</b>`;
    } else {
      box.className = "text-xs font-medium text-stone-500 bg-stone-100 p-2 rounded-lg border border-stone-200";
      box.innerHTML = "अमावस्या व्रत संपन्न हुआ — अगली तिथि की प्रतीक्षा";
    }
  }

  update();
  amavasyaTimerInterval = setInterval(update, 1000);
}

async function saveAmavasyaConfig() {
  const name = document.getElementById('adminAmavasyaName').value.trim();
  const date = document.getElementById('adminAmavasyaDate').value;
  const desc = document.getElementById('adminAmavasyaDesc').value.trim();

  if (!date) return showToast('कृपया अमावस्या की तारीख चुनें');
  await db.collection('settings').doc('amavasyaConfig').set({
    name: name || "पावन अमावस्या",
    date: date,
    desc: desc || "उपवास, ध्यान साधना, हवन एवं आत्म-चिंतन",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast('अमावस्या तिथि सफलतापूर्वक सहेजी गई!');
}

// 12. GEMINI AI CLIENT
function getGeminiKey() {
  let key = localStorage.getItem('gemini_user_api_key');
  if (!key) {
    key = prompt("कृपया अपनी Gemini API Key यहाँ पेस्ट करें:");
    if (key && key.trim()) {
      key = key.trim();
      localStorage.setItem('gemini_user_api_key', key);
    } else {
      return null;
    }
  }
  return key;
}

function resetGeminiKey() {
  const currentKey = localStorage.getItem('gemini_user_api_key') || '';
  const newKey = prompt("अपनी नई Gemini API Key यहाँ पेस्ट करें (या हटाने के लिए खाली छोड़कर OK दबाएं):", currentKey);
  if (newKey === null) return;

  if (newKey.trim() !== "") {
    localStorage.setItem('gemini_user_api_key', newKey.trim());
    showToast("✅ नई Gemini API Key सफलतापूर्वक सहेज ली गई!");
  } else {
    localStorage.removeItem('gemini_user_api_key');
    showToast("🗑️ पुरानी API Key हटा दी गई है।");
  }
}

const changeApiKey = resetGeminiKey;
const updateApiKey = resetGeminiKey;
const changeGeminiKey = resetGeminiKey;
const resetOpenAiKey = resetGeminiKey;

async function callGemini(promptText) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("वैध Gemini API Key दर्ज नहीं की गई।");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;
  const payload = { contents: [{ parts: [{ text: promptText }] }] };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  if (response.status === 400 || response.status === 401 || response.status === 403) {
    localStorage.removeItem('gemini_user_api_key');
  }
  throw new Error(data.error ? data.error.message : "Gemini AI से प्रतिक्रिया प्राप्त नहीं हुई");
}

async function generateAiQuizQuestions() {
  const btn = document.getElementById('aiQuizGenBtn');
  btn.innerText = "⏳ Gemini प्रश्न बना रहा है...";
  btn.disabled = true;

  const prompt = `विश्नोई समाज के २९ नियमों, पर्यावरण रक्षा, खेजड़ली बलिदान एवं नैतिक मूल्यों पर आधारित ५ प्रामाणिक वस्तुनिष्ठ (MCQ) प्रश्न हिंदी में बनाएं। 
प्रारूप strictly ऐसा होना चाहिए बिना किसी अतिरिक्त वार्तालाप के:

Q: प्रश्न यहाँ लिखें?
A) विकल्प 1
B) विकल्प 2
C) विकल्प 3
D) विकल्प 4
Ans: A`;

  try {
    const result = await callGemini(prompt);
    document.getElementById('adminBulkQuizText').value = result.trim();
    showToast("Gemini ने ५ नए प्रश्न तैयार कर दिए! नीचे 'Publish All' पर क्लिक करें।");
  } catch (err) {
    showToast("AI Error: " + err.message);
  } finally {
    btn.innerHTML = `<span class="font-bold text-xs text-amber-200">⚡ Gemini से 5 नए प्रश्न बनवाएं</span><span class="text-[11px] text-stone-300 mt-1">AI स्वतः प्रश्न व विकल्प तैयार कर नीचे बल्क बॉक्स में दर्ज करेगा।</span>`;
    btn.disabled = false;
  }
}

async function generateAiDailySandesh() {
  const btn = document.getElementById('aiSandeshGenBtn');
  btn.innerText = "⏳ AI संदेश तैयार कर रहा है...";
  btn.disabled = true;

  const prompt = `Write a short, highly inspirational 1-line quote in Hindi for the Bishnoi community focusing on tree protection, kindness to all animals, or moral virtues. Do not add quotes or formatting.`;

  try {
    const result = await callGemini(prompt);
    document.getElementById('adminBannerInput').value = result.trim();
    showToast("Gemini ने नया सुविचार लिख दिया! 'Update Banner' दबाकर लाइव करें।");
  } catch (err) {
    showToast("AI Error: " + err.message);
  } finally {
    btn.innerHTML = `<span class="font-bold text-xs text-amber-200">📢 Gemini से नया पावन सुविचार लिखवाएं</span><span class="text-[11px] text-stone-300 mt-1">जीव रक्षा व आचार संहिता पर सुविचार तैयार करें।</span>`;
    btn.disabled = false;
  }
}

// 13. DIRECT PDF EXPORTS
async function downloadQuizResultsPdf() {
  showToast("Quiz परिणाम PDF तैयार हो रहा है...");
  const snap = await db.collection('quizAttempts').get();
  if (snap.empty) return showToast("कोई परीक्षा रिकॉर्ड उपलब्ध नहीं है।");

  let records = [];
  snap.forEach(doc => records.push(doc.data()));

  records.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.timeTakenSeconds || 0) - (b.timeTakenSeconds || 0);
  });

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setTextColor(20, 54, 34);
  doc.text("Bishnoi Community Portal - Quiz Results", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 25);

  const tableRows = records.map((r, idx) => [
    idx + 1,
    r.name || 'Anonymous',
    r.phone || 'N/A',
    `${r.score} / ${r.total}`,
    `${r.timeTakenSeconds || 0}s`,
    r.date ? new Date(r.date).toLocaleDateString('en-GB') : ''
  ]);

  doc.autoTable({
    startY: 30,
    head: [['Rank', 'Participant', 'Mobile', 'Score', 'Time', 'Date']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [20, 54, 34] },
    styles: { fontSize: 9 }
  });

  doc.save("Bishnoi_Quiz_Results.pdf");
}

async function download7DaysUsersPdf() {
  showToast("७-दिवसीय सदस्य PDF (ईमेल सहित) तैयार हो रहा है...");
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const snap = await db.collection('users').get();
  if (snap.empty) return showToast("कोई सदस्य नहीं मिला।");

  let rows = [];
  snap.forEach(doc => {
    const u = doc.data();
    const regDate = u.registeredAt ? u.registeredAt.toDate() : new Date();
    if (regDate >= sevenDaysAgo) {
      rows.push([
        u.name || 'User',
        u.phone || doc.id || 'N/A',
        u.email || 'Not Linked',
        u.location || '-',
        regDate.toLocaleDateString('en-GB')
      ]);
    }
  });

  if (rows.length === 0) return showToast("विगत ७ दिनों में कोई नया सदस्य नहीं जुड़ा।");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(15);
  doc.setTextColor(20, 54, 34);
  doc.text("Bishnoi Portal - New Registered Users (Last 7 Days)", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 25);

  doc.autoTable({
    startY: 30,
    head: [['Full Name', 'Mobile / ID', 'Verified Email ID', 'Location', 'Date']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [179, 74, 27] },
    styles: { fontSize: 8.5 }
  });

  doc.save("Bishnoi_Registered_Users_7Days.pdf");
}

// 14. CERTIFICATE & SUVICHAR STATUS CARD
function generateCertificate(name, score) {
  const canvas = document.getElementById('certCanvas');
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FAF7EE';
  ctx.fillRect(0, 0, 800, 600);

  ctx.strokeStyle = '#143622';
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, 760, 560);

  ctx.strokeStyle = '#B34A1B';
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, 736, 536);

  ctx.fillStyle = '#143622';
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('विश्नोई समाज डिजिटल ज्ञान परीक्षा', 400, 105);

  ctx.fillStyle = '#B34A1B';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('योग्यता एवं सहभागिता सम्मान पत्र', 400, 150);

  ctx.fillStyle = '#4A3E37';
  ctx.font = '16px sans-serif';
  ctx.fillText('यह प्रमाणित किया जाता है कि प्रतिभागी', 400, 215);

  ctx.fillStyle = '#143622';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(name, 400, 265);

  ctx.fillStyle = '#4A3E37';
  ctx.font = '16px sans-serif';
  ctx.fillText(`ने विश्नोई समाज दैनिक ज्ञान एवं आचार संहिता परीक्षा में`, 400, 325);
  ctx.fillText(`सराहनीय प्रदर्शन करते हुए ${score}% अंक प्राप्त किए हैं।`, 400, 355);

  ctx.fillStyle = '#2D6A4F';
  ctx.font = 'italic 16px sans-serif';
  ctx.fillText('"जीव दया पालणी, रूंख लीलो नी घावै"', 400, 425);

  ctx.fillStyle = '#786A5E';
  ctx.font = '12px sans-serif';
  ctx.fillText(`दिनांक: ${new Date().toLocaleDateString('hi-IN')}`, 200, 505);
  ctx.fillText('डिजिटल प्रमाणन कोड: bishnoi-portal', 600, 505);

  const link = document.createElement('a');
  link.download = `Bishnoi_Samman_Patra_${name}.png`;
  link.href = canvas.toDataURL();
  link.click();
  showToast("सम्मान पत्र डाउनलोड हो गया!");
}

function downloadSuvicharStatusCard() {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, '#143622');
  grad.addColorStop(1, '#091c11');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 8;
  ctx.strokeRect(45, 45, 990, 990);

  ctx.fillStyle = '#FDE68A';
  ctx.textAlign = 'center';
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText('🌿 विश्नोई समाज डिजिटल मंच 🌿', 540, 160);

  ctx.fillStyle = '#D6D3D1';
  ctx.font = '28px sans-serif';
  ctx.fillText('आज का पावन संदेश एवं सुविचार', 540, 220);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 42px sans-serif';
  const words = currentBannerText.split(' ');
  let line = '';
  let lines = [];
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    if (ctx.measureText(testLine).width > 820 && i > 0) {
      lines.push(line);
      line = words[i] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  let startY = 500 - ((lines.length - 1) * 35);
  lines.forEach((l, idx) => {
    ctx.fillText(l.trim(), 540, startY + (idx * 70));
  });

  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('गुरु जम्भेश्वर भगवान की जय • २९ नियम धर्म संहिता', 540, 900);

  ctx.fillStyle = '#A8A29E';
  ctx.font = '24px sans-serif';
  ctx.fillText('bishnoism.vercel.app', 540, 960);

  const link = document.createElement('a');
  link.download = `Bishnoi_Suvichar_${new Date().toLocaleDateString('en-GB')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast("🖼️ WhatsApp स्टेटस कार्ड डाउनलोड हो गया!");
}

// 15. QUIZ ARENA & MULTI-LINE WINNER LEADERBOARD
function startQuizNow() {
  document.getElementById('quizIntroCard').classList.add('hidden');
  document.getElementById('quizActiveBox').classList.remove('hidden');
  currentQ = 0;
  qScore = 0;
  quizStartTime = Date.now();
  renderQuiz();
}

function loadQuiz() {
  db.collection('quiz').onSnapshot(snap => {
    if (!snap.empty) {
      quizList = snap.docs.map(d => d.data());
    } else {
      quizList = [
        {
          q: "खेजड़ली गांव में ३६३ वीरों का महान बलिदान किस वर्ष हुआ था?",
          opts: ["1730 ईस्वी (भाद्रपद शुक्ल दशमी)", "1485 ईस्वी", "1857 ईस्वी", "1947 ईस्वी"],
          ans: 0
        },
        {
          q: "गुरु जम्भेश्वर भगवान द्वारा २९ नियमों की घोषणा किस पवित्र स्थान पर हुई?",
          opts: ["मुकाम", "समराथल धोरा", "जांगलू", "लालासर"],
          ans: 1
        },
        {
          q: "अमृता देवी विश्नोई का अमर वचन क्या था?",
          opts: ["सत्यमेव जयते", "सिर साटै रूंख रहै, तो भी सस्तो जाण", "अहिंसा परमो धर्मः", "जय जवान जय किसान"],
          ans: 1
        }
      ];
    }
  });
}

function renderQuiz() {
  const box = document.getElementById('quizActiveBox');
  if (!quizList.length) {
    box.innerHTML = `<div class="text-center py-4 text-xs">कोई प्रश्न उपलब्ध नहीं हैं।</div>`;
    return;
  }

  if (currentQ >= quizList.length) {
    const timeTakenSeconds = Math.round((Date.now() - quizStartTime) / 1000);
    const percentage = Math.round((qScore / quizList.length) * 100);

    if (currentUser) {
      db.collection('quizAttempts').add({
        name: currentUser.name,
        phone: currentUser.phone || 'N/A',
        score: qScore,
        total: quizList.length,
        timeTakenSeconds: timeTakenSeconds,
        date: new Date().toISOString()
      });
    }

    box.innerHTML = `
      <div class="text-center space-y-3 py-4">
        <div class="text-4xl">🏆</div>
        <h3 class="font-yatra text-xl text-forest">परीक्षा पूर्ण हुई!</h3>
        <p class="text-sm text-stone-600">कुल प्राप्तांक: <strong class="text-terracotta text-base">${qScore} / ${quizList.length}</strong> (${percentage}%)</p>
        <p class="text-xs text-stone-400">समय: ${timeTakenSeconds} सेकंड</p>
        
        <div class="pt-3 flex flex-wrap justify-center gap-2">
          <button onclick="backToQuizIntro()" class="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-xs font-semibold text-stone-700">
            ← मुख्य पृष्ठ
          </button>
          <button onclick="startQuizNow()" class="px-4 py-2 bg-forest text-white rounded-lg text-xs font-semibold hover:bg-emerald-950">
            पुनः प्रयास करें
          </button>
          ${percentage >= 80 ? `
            <button onclick="generateCertificate('${currentUser ? currentUser.name : 'प्रतिभागी'}', ${percentage})" class="px-4 py-2 bg-terracotta text-white rounded-lg text-xs font-semibold shadow">
              📜 सम्मान पत्र डाउनलोड करें
            </button>
          ` : ''}
        </div>
      </div>
    `;
    confetti({ particleCount: 50, spread: 60 });
    return;
  }

  const q = quizList[currentQ];
  box.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center text-xs text-stone-500 border-b border-stone-100 pb-2">
        <span>प्रश्न ${currentQ + 1} / ${quizList.length}</span>
        <span>Score: ${qScore}</span>
      </div>
      <h3 class="font-bold text-base sm:text-lg text-forest leading-snug">${q.q}</h3>
      <div class="space-y-2.5 pt-1">
        ${q.opts.map((opt, i) => `
          <button onclick="checkAnswer(${i})" class="w-full text-left p-3.5 text-sm rounded-xl border border-stone-300 hover:bg-amber-50 bg-white transition-all font-semibold">
            ${opt}
          </button>
        `).join('')}
      </div>
      <div id="quizFeedbackBox" class="hidden text-xs p-2.5 rounded-lg font-semibold"></div>
    </div>
  `;
}

function checkAnswer(chosen) {
  const q = quizList[currentQ];
  const feed = document.getElementById('quizFeedbackBox');
  feed.classList.remove('hidden');

  if (chosen === q.ans) {
    qScore++;
    feed.className = "text-xs p-2.5 rounded-lg font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300";
    feed.innerText = "✓ सही उत्तर! (Correct)";
  } else {
    feed.className = "text-xs p-2.5 rounded-lg font-semibold bg-rose-100 text-rose-800 border border-rose-300";
    feed.innerText = `✕ गलत उत्तर! सही उत्तर था: ${q.opts[q.ans]}`;
  }

  setTimeout(() => {
    currentQ++;
    renderQuiz();
  }, 1200);
}

function backToQuizIntro() {
  document.getElementById('quizActiveBox').classList.add('hidden');
  document.getElementById('quizIntroCard').classList.remove('hidden');
}

async function importBulkQuiz() {
  const rawText = document.getElementById('adminBulkQuizText').value.trim();
  if (!rawText) return showToast('कृपया प्रश्न टेक्स्ट पेस्ट करें');

  const blocks = rawText.split(/\n\s*\n/);
  let parsedQuestions = [];

  for (let block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let qText = '';
    let opts = [];
    let ansIdx = 0;

    for (let line of lines) {
      if (line.match(/^Q\s*:/i)) {
        qText = line.replace(/^Q\s*:/i, '').trim();
      } else if (line.match(/^[A-D]\s*\)/i)) {
        opts.push(line.replace(/^[A-D]\s*\)/i, '').trim());
      } else if (line.match(/^Ans\s*:/i)) {
        const letter = line.replace(/^Ans\s*:/i, '').trim().toUpperCase();
        ansIdx = letter === 'A' ? 0 : letter === 'B' ? 1 : letter === 'C' ? 2 : 3;
      }
    }
    if (qText && opts.length >= 2) {
      parsedQuestions.push({ q: qText, opts: opts, ans: ansIdx });
    }
  }

  if (parsedQuestions.length === 0) return showToast('प्रारूप सही नहीं है। Q:, A), B)... Ans: का प्रयोग करें।');

  const batch = db.batch();
  parsedQuestions.forEach(q => {
    const ref = db.collection('quiz').doc();
    batch.set(ref, {
      q: q.q, opts: q.opts, ans: q.ans,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
  showToast(`कुल ${parsedQuestions.length} प्रश्न लाइव जोड़ दिए गए!`);
  document.getElementById('adminBulkQuizText').value = '';
}

function listenWinners() {
  // Ensure Winner Name Elements Never Truncate Long Names
  ['winner1Name', 'winner2Name', 'winner3Name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('truncate', 'whitespace-nowrap');
      el.style.whiteSpace = 'normal';
      el.style.wordBreak = 'break-word';
      el.style.overflow = 'visible';
    }
  });

  db.collection('settings').doc('dailyWinners').onSnapshot(doc => {
    if (doc.exists) {
      const w = doc.data();
      if (w.p1Name) {
        document.getElementById('winner1Name').innerText = w.p1Name;
        document.getElementById('winner1Score').innerText = w.p1Score || '';
      }
      if (w.p2Name) {
        document.getElementById('winner2Name').innerText = w.p2Name;
        document.getElementById('winner2Score').innerText = w.p2Score || '';
      }
      if (w.p3Name) {
        document.getElementById('winner3Name').innerText = w.p3Name;
        document.getElementById('winner3Score').innerText = w.p3Score || '';
      }
    }
  });
}

async function saveDailyWinners() {
  const p1Name = document.getElementById('win1InputName').value.trim();
  const p1Score = document.getElementById('win1InputScore').value.trim();
  const p2Name = document.getElementById('win2InputName').value.trim();
  const p2Score = document.getElementById('win2InputScore').value.trim();
  const p3Name = document.getElementById('win3InputName').value.trim();
  const p3Score = document.getElementById('win3InputScore').value.trim();

  await db.collection('settings').doc('dailyWinners').set({
    p1Name, p1Score, p2Name, p2Score, p3Name, p3Score,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast("शीर्ष विजेता सूची अपडेट हो गई!");
}

// 16. UPGRADED TEXT-ONLY SAMVAD MANCH
const BAD_WORDS_LIST = ['गाली', 'मूर्ख', 'पागल', 'अभद्र', 'idiot', 'stupid', 'abuse'];

function containsBadWords(text) {
  const lower = text.toLowerCase();
  return BAD_WORDS_LIST.some(w => lower.includes(w));
}

function updateCharCount() {
  const el = document.getElementById('postText');
  const disp = document.getElementById('charCountDisplay');
  if (el && disp) disp.innerText = `${el.value.length} / 300`;
}

function setChatReply(id, author, snippet) {
  activeReplyObj = { id, author, snippet: snippet.substring(0, 70) };
  const bar = document.getElementById('replyPreviewBar');
  if (bar) {
    document.getElementById('replyToAuthor').innerText = author;
    document.getElementById('replyToText').innerText = activeReplyObj.snippet;
    bar.classList.remove('hidden');
  }
  document.getElementById('postText')?.focus();
}

function cancelChatReply() {
  activeReplyObj = null;
  document.getElementById('replyPreviewBar')?.classList.add('hidden');
}

async function submitChaupalPost() {
  if (!currentUser) return openAuthModal();
  const now = Date.now();
  if (!currentUser.isOwner && now - lastPostTime < 20000) {
    return showToast("कृपया अगले संदेश के लिए २० सेकंड प्रतीक्षा करें।");
  }

  const txtEl = document.getElementById('postText');
  const txt = txtEl.value.trim();
  if (!txt) return showToast('कृपया अपना संदेश लिखें!');

  if (containsBadWords(txt)) {
    return showToast('⚠️ कृपया संवाद मंच की गरिमा बनाए रखें और सभ्य भाषा का प्रयोग करें।');
  }

  const topic = document.getElementById('postTopicSelect')?.value || 'सामान्य चर्चा';
  const btn = document.getElementById('postSubmitBtn');
  btn.disabled = true;

  try {
    await db.collection('posts').add({
      author: currentUser.name,
      phone: currentUser.phone || 'Member',
      isOwner: Boolean(currentUser.isOwner),
      location: currentUser.location || '',
      topic: topic,
      content: txt,
      replyTo: activeReplyObj || null,
      reactions: { pranam: 0, nature: 0, heart: 0 },
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    lastPostTime = now;
    txtEl.value = '';
    updateCharCount();
    cancelChatReply();
    showToast('संदेश प्रकाशित हुआ!');
  } catch (e) {
    showToast('संदेश भेजने में त्रुटि: ' + e.message);
  } finally {
    btn.disabled = false;
  }
}

function listenPinnedChat() {
  db.collection('settings').doc('pinnedChat').onSnapshot(doc => {
    const banner = document.getElementById('pinnedChatBanner');
    const txt = document.getElementById('pinnedChatText');
    const unpinBtn = document.getElementById('unpinChatBtn');
    if (!banner || !txt) return;

    if (doc.exists && doc.data().content) {
      const d = doc.data();
      txt.innerText = `${d.author}: "${d.content}"`;
      banner.classList.remove('hidden');
      if (unpinBtn) {
        unpinBtn.classList.toggle('hidden', !(currentUser && currentUser.isOwner));
      }
    } else {
      banner.classList.add('hidden');
    }
  });
}

async function pinChatMessage(author, content) {
  if (!currentUser || !currentUser.isOwner) return;
  await db.collection('settings').doc('pinnedChat').set({
    author, content, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast("📌 संदेश शीर्ष पर पिन कर दिया गया!");
}

async function unpinChatMessage() {
  if (!currentUser || !currentUser.isOwner) return;
  await db.collection('settings').doc('pinnedChat').delete();
  showToast("पिन किया गया संदेश हटा दिया गया।");
}

async function reactToPost(postId, type) {
  const storageKey = `reacted_${postId}_${type}`;
  if (localStorage.getItem(storageKey)) return showToast("आप पहले ही प्रतिक्रिया दे चुके हैं!");
  localStorage.setItem(storageKey, '1');

  const fieldPath = `reactions.${type}`;
  try {
    await db.collection('posts').doc(postId).update({
      [fieldPath]: firebase.firestore.FieldValue.increment(1)
    });
  } catch (e) {}
}

function listenPosts() {
  db.collection('posts').orderBy('createdAt', 'desc').limit(40).onSnapshot(snap => {
    allChatPosts = [];
    snap.forEach(doc => {
      allChatPosts.push({ id: doc.id, ...doc.data() });
    });
    renderFilteredChat();
  });
}

function renderFilteredChat() {
  const feed = document.getElementById('communityFeed');
  if (!feed) return;
  const selectedTopic = document.getElementById('chatTopicFilter')?.value || 'all';

  const filtered = selectedTopic === 'all'
    ? allChatPosts
    : allChatPosts.filter(p => (p.topic || 'सामान्य चर्चा') === selectedTopic);

  feed.innerHTML = '';
  if (filtered.length === 0) {
    feed.innerHTML = `<div class="text-center py-6 text-xs text-stone-500">इस विषय पर अभी कोई संदेश नहीं है। पहला संदेश लिखें!</div>`;
    return;
  }

  filtered.forEach(p => {
    const isMyPost = currentUser && (p.phone === currentUser.phone);
    const canDelete = Boolean(isMyPost || (currentUser && currentUser.isOwner));
    const timeStr = p.createdAt ? p.createdAt.toDate().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }) : 'अभी';
    const dateStr = p.createdAt ? p.createdAt.toDate().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }) : '';

    const safeAuthor = (p.author || 'सदस्य').replace(/'/g, "\\'");
    const safeContent = (p.content || '').replace(/'/g, "\\'").replace(/\n/g, ' ');

    const pranamCnt = p.reactions?.pranam || 0;
    const natureCnt = p.reactions?.nature || 0;
    const heartCnt = p.reactions?.heart || 0;

    const card = document.createElement('div');
    card.className = `p-3.5 rounded-xl border ${p.isOwner ? 'bg-amber-50/70 border-amber-300' : (isMyPost ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-stone-200')} space-y-2 shadow-sm`;
    card.innerHTML = `
      <div class="flex flex-wrap justify-between items-center gap-1 text-xs">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="font-bold text-forest">${p.isOwner ? '🛡️' : '👤'} ${p.author}</span>
          ${p.isOwner ? `<span class="px-1.5 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 rounded">मुख्य व्यवस्थापक</span>` : ''}
          ${p.location ? `<span class="text-[10px] text-stone-500">• ${p.location}</span>` : ''}
          <span class="px-2 py-0.5 text-[10px] bg-stone-100 text-stone-600 rounded-full border border-stone-200">${p.topic || 'सामान्य चर्चा'}</span>
        </div>
        <span class="text-[10px] text-stone-400">${dateStr} ${timeStr}</span>
      </div>

      ${p.replyTo ? `
        <div class="p-2 rounded bg-stone-100 border-l-2 border-forest text-xs text-stone-600">
          <span class="font-bold text-forest">↩️ ${p.replyTo.author}:</span>${p.replyTo.snippet}
        </div>
      ` : ''}

      <p class="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed font-medium">${p.content}</p>

      <div class="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-1.5">
          <button onclick="reactToPost('${p.id}', 'pranam')" class="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-amber-100 border border-stone-200 transition">
            🙏 ${pranamCnt || ''}
          </button>
          <button onclick="reactToPost('${p.id}', 'nature')" class="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-emerald-100 border border-stone-200 transition">
            🌿 ${natureCnt || ''}
          </button>
          <button onclick="reactToPost('${p.id}', 'heart')" class="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-rose-100 border border-stone-200 transition">
            ❤️ ${heartCnt || ''}
          </button>
        </div>

        <div class="flex items-center gap-2.5">
          <button onclick="setChatReply('${p.id}', '${safeAuthor}', '${safeContent}')" class="text-forest font-semibold hover:underline">↩️ उत्तर दें</button>
          <button onclick="sharePostWhatsApp('${safeAuthor}', '${safeContent}')" class="text-emerald-700 font-semibold hover:underline">Share 📲</button>
          ${currentUser && currentUser.isOwner ? `<button onclick="pinChatMessage('${safeAuthor}', '${safeContent}')" class="text-amber-700 font-bold hover:underline">📌 Pin</button>` : ''}
          ${canDelete ? `<button onclick="confirmDeletePost('${p.id}')" class="text-red-600 font-bold hover:underline">🗑️ हटाएं</button>` : ''}
        </div>
      </div>
    `;
    feed.appendChild(card);
  });
}

function confirmDeletePost(id) {
  openConfirmModal("संदेश हटाएं?", "क्या आप इस संदेश को संवाद मंच से हटाना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('posts').doc(id).delete();
      showToast('संदेश हटा दिया गया।');
    }
  });
}

// 17. ELDER-FRIENDLY SMART BOOK & AUTO-FIT PDF.JS READER
function openInbuiltPdfViewer(title, link) {
  const modal = document.getElementById('inbuiltPdfModal');
  const titleEl = document.getElementById('pdfViewerTitle');
  const dlBtn = document.getElementById('pdfModalDownloadBtn');
  if (!modal) return;

  titleEl.innerText = title;
  dlBtn.href = link;
  currentPdfUrl = link;

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // If opening Shabadwani, launch Elder-Friendly Smart Text Reader by default (No Pinch-Zoom needed!)
  if (link.includes('shabadwani') || title.includes('सबदवाणी')) {
    document.getElementById('shabadSelectWrap')?.classList.remove('hidden');
    document.getElementById('speakShabadBtn')?.classList.remove('hidden');
    document.getElementById('togglePdfModeBtn')?.classList.remove('hidden');
    document.getElementById('digitalBookContainer')?.classList.remove('hidden');
    document.getElementById('pdfCanvasContainer')?.classList.add('hidden');
    renderSelectedShabadView();
  } else {
    // For other PDFs, open directly in Full-Width Auto-Fit Canvas Mode
    document.getElementById('shabadSelectWrap')?.classList.add('hidden');
    document.getElementById('speakShabadBtn')?.classList.add('hidden');
    document.getElementById('togglePdfModeBtn')?.classList.add('hidden');
    switchToRawPdfCanvasMode();
  }
}

function renderSelectedShabadView() {
  const container = document.getElementById('digitalBookContainer');
  const sel = document.getElementById('shabadJumpSelect')?.value || 'all';
  if (!container) return;

  const items = sel === 'all'
    ? SHABADWANI_DIGITAL_BOOK
    : [SHABADWANI_DIGITAL_BOOK[parseInt(sel)]];

  container.innerHTML = items.map(item => `
    <div class="bg-white p-5 sm:p-7 rounded-2xl border-2 border-amber-300 shadow-md space-y-3">
      <div class="flex items-center justify-between border-b border-amber-200 pb-2">
        <h4 class="font-yatra text-xl sm:text-2xl text-forest">${item.title}</h4>
        <span class="px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">श्री सबदवाणी</span>
      </div>
      <p class="shabad-Elder-Text text-stone-900 font-semibold whitespace-pre-wrap" style="font-size: ${readerFontPx}px; line-height: 1.85; word-break: break-word;">${item.text}</p>
    </div>
  `).join('');
}

function adjustReaderFont(delta) {
  readerFontPx = Math.min(38, Math.max(16, readerFontPx + delta));
  localStorage.setItem('bishnoi_reader_font_px', readerFontPx.toString());
  document.querySelectorAll('.shabad-Elder-Text').forEach(el => {
    el.style.fontSize = `${readerFontPx}px`;
  });
  showToast(`अक्षर आकार: ${readerFontPx}px`);
}

function speakCurrentReaderText() {
  if (!('speechSynthesis' in window)) {
    return showToast("आपके फोन में वॉइस रीडर उपलब्ध नहीं है।");
  }
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    showToast("🔇 ऑडियो पाठ रोका गया।");
    return;
  }
  const sel = document.getElementById('shabadJumpSelect')?.value || '0';
  const targetIdx = sel === 'all' ? 1 : parseInt(sel);
  const textToRead = SHABADWANI_DIGITAL_BOOK[targetIdx]?.text || '';

  const utter = new SpeechSynthesisUtterance(textToRead);
  utter.lang = 'hi-IN';
  utter.rate = 0.85; // Slower & clearer for elders
  window.speechSynthesis.speak(utter);
  showToast("🔊 सबद पाठ सुनाया जा रहा है... (रोकने के लिए पुनः दबाएं)");
}

async function switchToRawPdfCanvasMode() {
  document.getElementById('digitalBookContainer')?.classList.add('hidden');
  const canvasWrap = document.getElementById('pdfCanvasContainer');
  const pagesHolder = document.getElementById('pdfPagesHolder');
  const fallbackFrame = document.getElementById('pdfFallbackIframe');
  if (!canvasWrap || !pagesHolder) return;

  canvasWrap.classList.remove('hidden');
  canvasWrap.classList.add('flex');
  pagesHolder.innerHTML = `<div class="text-white py-10 text-base font-bold animate-pulse">⏳ पुस्तक के पृष्ठ बड़े आकार में लोड हो रहे हैं...</div>`;

  // Handle Google Drive links
  if (currentPdfUrl.includes('drive.google.com/file/d/')) {
    const match = currentPdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      pagesHolder.innerHTML = '';
      fallbackFrame.src = `https://drive.google.com/file/d/${match[1]}/preview`;
      fallbackFrame.classList.remove('hidden');
      return;
    }
  }

  fallbackFrame.classList.add('hidden');
  try {
    if (!window.pdfjsLib) throw new Error("PDF.js loading");
    const loadingTask = window.pdfjsLib.getDocument(currentPdfUrl);
    const pdf = await loadingTask.promise;
    pagesHolder.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const containerWidth = Math.min(window.innerWidth - 24, 860);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const autoFitScale = (containerWidth / unscaledViewport.width) * pdfCanvasScale;
      const viewport = page.getViewport({ scale: autoFitScale });

      const canvas = document.createElement('canvas');
      canvas.className = 'bg-white rounded-lg shadow-lg max-w-full';
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      pagesHolder.appendChild(canvas);
      await page.render({ canvasContext: context, viewport: viewport }).promise;
    }
  } catch (err) {
    pagesHolder.innerHTML = '';
    const fullUrl = currentPdfUrl.startsWith('http') ? currentPdfUrl : (window.location.origin + '/' + currentPdfUrl.replace(/^\.\//, ''));
    fallbackFrame.src = isPhoneOrInstalledApp()
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fullUrl)}`
      : fullUrl;
    fallbackFrame.classList.remove('hidden');
  }
}

function zoomPdfCanvas(delta) {
  pdfCanvasScale = Math.min(2.5, Math.max(0.8, pdfCanvasScale + delta));
  document.getElementById('pdfZoomLabel').innerText = `${Math.round(pdfCanvasScale * 100)}%`;
  switchToRawPdfCanvasMode();
}

function closeInbuiltPdfViewer() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const modal = document.getElementById('inbuiltPdfModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function listenPdfs() {
  db.collection('pdfs').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const grid = document.getElementById('pdfGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const defaultCard = document.createElement('div');
    defaultCard.className = "bg-white p-4 rounded-xl border-2 border-amber-300 flex flex-col justify-between shadow-sm";
    defaultCard.innerHTML = `
      <div>
        <span class="text-xs font-bold text-terracotta uppercase">पवित्र ग्रंथ (बुजुर्ग-अनुकूल स्मार्ट पाठ)</span>
        <h3 class="font-yatra text-forest text-lg mt-1">श्री सबदवाणी (१२० शब्द)</h3>
        <p class="text-xs text-stone-600 mt-1">बिना ज़ूम किए बड़े अक्षरों में आराम से पढ़ें अथवा ऑडियो में सुनें।</p>
      </div>
      <div class="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <button onclick="openInbuiltPdfViewer('श्री सबदवाणी (१२० शब्द)', './shabadwani.pdf')" class="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold rounded-lg shadow transition">
            📖 बड़े अक्षरों में पढ़ें
          </button>
          <a href="./shabadwani.pdf" download class="inline-block px-3 py-2 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-emerald-950">
            📥 डाउनलोड
          </a>
        </div>
        <button onclick="sharePdfWhatsApp('श्री सबदवाणी', './shabadwani.pdf')" class="text-emerald-700 text-xs font-bold">Share 📲</button>
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
          <span class="text-xs font-bold text-terracotta uppercase">साहित्य</span>
          <h3 class="font-yatra text-forest text-lg mt-1">${item.title}</h3>
        </div>
        <div class="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <button onclick="openInbuiltPdfViewer('${safeTitle}', '${safeLink}')" class="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold rounded-lg shadow transition">
              📖 ऐप में पढ़ें
            </button>
            <a href="${item.link}" target="_blank" download class="inline-block px-3 py-2 bg-forest text-white text-xs font-semibold rounded-lg hover:bg-emerald-950">
              📥 डाउनलोड
            </a>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="sharePdfWhatsApp('${safeTitle}', '${safeLink}')" class="text-emerald-700 text-xs font-bold">Share 📲</button>
            ${currentUser && currentUser.isOwner ? `<button onclick="confirmDeletePdf('${doc.id}')" class="text-xs text-red-600 font-bold">Delete</button>` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  });
}

function sharePdfWhatsApp(title, link) {
  const url = link.startsWith('./') ? window.location.origin + '/' + link.replace('./','') : link;
  const text = encodeURIComponent(`📖 विश्नोई साहित्य PDF: ${title}\nऑनलाइन पढ़ें या डाउनलोड करें: ${url}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

async function saveAdminPdf() {
  const title = document.getElementById('adminPdfTitle').value.trim();
  const link = document.getElementById('adminPdfLink').value.trim();
  if (!title || !link) return showToast('कृपया शीर्षक और लिंक दर्ज करें');
  await db.collection('pdfs').add({
    title, link, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast('PDF साहित्य सफलतापूर्वक जोड़ा गया!');
  document.getElementById('adminPdfTitle').value = '';
  document.getElementById('adminPdfLink').value = '';
}

function confirmDeletePdf(id) {
  openConfirmModal("PDF हटाएं?", "क्या आप इस साहित्य को सूची से हटाना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('pdfs').doc(id).delete();
      showToast('PDF हटा दी गई।');
    }
  });
}

// 18. AUDIO PLAYER & ADMIN TRACK DELETE LIST
function listenAudios() {
  db.collection('audios').orderBy('createdAt', 'desc').onSnapshot(snap => {
    const select = document.getElementById('audioTrackSelect');
    const adminList = document.getElementById('adminAudioManageList');
    if (adminList) adminList.innerHTML = '';

    if (!snap.empty && select) {
      select.innerHTML = '';
      snap.forEach(doc => {
        const a = doc.data();
        select.innerHTML += `<option value="${a.link}">${a.title}</option>`;
        if (adminList) {
          adminList.innerHTML += `
            <div class="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200">
              <span class="font-semibold text-stone-800 truncate">${a.title}</span>
              <button onclick="deleteAdminAudio('${doc.id}')" class="text-red-600 font-bold hover:underline shrink-0 ml-2">🗑️ हटाएं</button>
            </div>
          `;
        }
      });
      changeAudioTrack();
    }
  });
}

async function deleteAdminAudio(id) {
  openConfirmModal("भजन हटाएं?", "क्या आप इस ऑडियो भजन को प्लेयर से हटाना चाहते हैं?", async (res) => {
    if (res) {
      await db.collection('audios').doc(id).delete();
      showToast("भजन हटा दिया गया।");
    }
  });
}

function changeAudioTrack() {
  const select = document.getElementById('audioTrackSelect');
  const player = document.getElementById('audioPlayer');
  const source = document.getElementById('audioSource');
  if (select && select.value) {
    source.src = select.value;
    player.load();
  }
}

async function saveAdminAudio() {
  const title = document.getElementById('adminAudioTitle').value.trim();
  const link = document.getElementById('adminAudioLink').value.trim();
  if (!title || !link) return showToast('कृपया शीर्षक और ऑडियो लिंक दोनों भरें');
  await db.collection('audios').add({
    title, link, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  showToast('ऑडियो ट्रैक लाइव प्लेयर में जोड़ा गया!');
  document.getElementById('adminAudioTitle').value = '';
  document.getElementById('adminAudioLink').value = '';
}

function listenNotices() {
  db.collection('notices').orderBy('createdAt', 'desc').limit(5).onSnapshot(snap => {
    if (!snap.empty) {
      const list = document.getElementById('noticeBoardList');
      list.innerHTML = '';
      snap.forEach(doc => {
        const n = doc.data();
        list.innerHTML += `
          <div class="p-3 bg-stone-50 rounded-lg border border-stone-200">
            <span class="font-bold text-forest">${n.title}:</span> ${n.desc}
          </div>
        `;
      });
    }
  });
}

// 19. PLANTATION PLEDGE COUNTER
function listenTreeCounter() {
  db.collection('stats').doc('treePledges').onSnapshot(doc => {
    if (doc.exists && doc.data().count) {
      document.getElementById('treeCounterDisplay').innerText = doc.data().count;
    }
  });
}

async function pledgeTree() {
  if (localStorage.getItem('has_pledged_tree')) {
    return showToast("आप पूर्व में पौधरोपण संकल्प दर्ज कर चुके हैं। साधुवाद!");
  }
  const display = document.getElementById('treeCounterDisplay');
  let currentVal = parseInt(display.innerText) || 1485;
  let nextVal = currentVal + 1;
  display.innerText = nextVal;
  localStorage.setItem('has_pledged_tree', 'true');
  showToast("प्रकृति रक्षा हेतु साधुवाद! संकल्प दर्ज हुआ।");
  confetti({ particleCount: 40, spread: 50 });
  try {
    await db.collection('stats').doc('treePledges').set({ count: nextVal }, { merge: true });
  } catch (e) {}
}

// 20. BANNER & WHATSAPP SHARING
function listenBanner() {
  db.collection('settings').doc('dailySandesh').onSnapshot(doc => {
    if (doc.exists && doc.data().text) {
      currentBannerText = doc.data().text;
      document.getElementById('dailyBannerText').innerText = currentBannerText;
    }
  });
}

async function saveAdminBanner() {
  const txt = document.getElementById('adminBannerInput').value.trim();
  if (!txt) return showToast('कृपया संदेश दर्ज करें');
  await db.collection('settings').doc('dailySandesh').set({ text: txt });
  showToast('दैनिक संदेश लाइव अपडेट हुआ!');
  document.getElementById('adminBannerInput').value = '';
}

function shareBannerWhatsApp() {
  const text = encodeURIComponent(`🌿 पावन संदेश:\n\n${currentBannerText}\n\nविस्तार से पढ़ें: ${window.location.href}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function shareNiyamWhatsApp(num, title, rule, desc) {
  const text = encodeURIComponent(`🌿 विश्नोई समाज नियम सं. ${num} - ${title}\n"${rule}"\n\nविवरण: ${desc}\n\nडिजिटल मंच: ${window.location.href}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function sharePostWhatsApp(author, content) {
  const text = encodeURIComponent(`🌿 समाज संवाद चर्चा (${author}):\n\n"${content}"\n\nपूर्ण चर्चा देखें: ${window.location.href}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

// 21. 29 NIYAMS RENDER & SEARCH
function renderNiyams(data) {
  const grid = document.getElementById('niyamGrid');
  if (!grid) return;
  grid.innerHTML = '';
  data.forEach(n => {
    const card = document.createElement('div');
    card.className = "bg-white p-4 rounded-xl border border-stone-200 space-y-2 flex flex-col justify-between shadow-sm";
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-forest w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">${n.num}</span>
          <span class="text-stone-500 font-semibold text-xs">${n.title}</span>
        </div>
        <h4 class="font-yatra text-base text-forest mt-1.5">${n.rule}</h4>
        <p class="text-xs text-stone-700 leading-relaxed mt-1 font-medium">${n.desc}</p>
      </div>
      <div class="pt-2 border-t border-stone-100 flex justify-end">
        <button onclick="shareNiyamWhatsApp(${n.num}, '${n.title}', '${n.rule}', '${n.desc}')" class="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline">
          <span>साझा करें</span> 📲
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterNiyams() {
  const q = document.getElementById('niyamSearch').value.toLowerCase();
  renderNiyams(NIYAMS_DATA.filter(n => n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q) || n.title.toLowerCase().includes(q)));
}

function handleGlobalSearch() {
  const q = document.getElementById('globalSearchInput').value.toLowerCase().trim();
  if (!q) return;

  const niyamMatch = NIYAMS_DATA.some(n => n.rule.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q));
  if (niyamMatch) {
    switchTab('niyams');
    document.getElementById('niyamSearch').value = q;
    filterNiyams();
  } else if (q.includes('mala') || q.includes('माला') || q.includes('मंत्र') || q.includes('जाप')) {
    switchTab('mala');
  } else if (q.includes('pdf') || q.includes('सबद') || q.includes('पुस्तक') || q.includes('ग्रंथ') || q.includes('साहित्य')) {
    switchTab('library');
  } else if (q.includes('quiz') || q.includes('परीक्षा') || q.includes('प्रश्न')) {
    switchTab('quiz');
  } else if (q.includes('संवाद') || q.includes('मंच') || q.includes('चर्चा')) {
    switchTab('community');
  }
}
