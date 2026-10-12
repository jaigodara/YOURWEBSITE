/* ==========================================================================
   BISHNOI PORTAL COMMUNITY & MEDIA ENHANCEMENTS - PART 3
   ========================================================================== */

// 1. क्योराओकी-स्टाइल भजन लिरिक्स सिंक (Karaoke-style Lyrics Sync)
const bhajanTimeline = [
    { time: 0, text: "किस कारण जोग लिया रे, सुण गोपीचंद मेरा वीर..." },
    { time: 15, text: "माता मनावै थारी मैनावती रानी, जोग मत लेई रे..." },
    { time: 30, text: "अमर बेल थारे राज महल में, भोग तज्या क्यों वीर..." }
];

function initKaraokeAudioPlayer(audioElementId, lyricsContainerId) {
    const audio = document.getElementById(audioElementId);
    const container = document.getElementById(lyricsContainerId);
    if (!audio || !container) return;

    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        let activeLine = bhajanTimeline[0].text;

        for (let i = 0; i < bhajanTimeline.length; i++) {
            if (currentTime >= bhajanTimeline[i].time) {
                activeLine = bhajanTimeline[i].text;
            }
        }

        container.innerHTML = `
            <div class="p-4 bg-emerald-900 text-amber-300 text-center text-xl font-bold rounded-2xl shadow-inner animate-pulse">
                🎵 ${activeLine}
            </div>
        `;
    });
}

// 2. प्रतिदिन काउंट होने वाली जप माला स्ट्रीक (Daily Jaap Mala Streak & Counters)
function recordDailyJaapCompletion() {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('last_jaap_date');
    let currentStreak = parseInt(localStorage.getItem('jaap_streak_count') || '0');

    if (lastDate === todayStr) {
        alert('आज की जप माला पहले ही दर्ज हो चुकी है!');
        return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yestStr) {
        currentStreak += 1; // स्ट्रीक जारी है
    } else {
        currentStreak = 1; // स्ट्रीक रीसेट
    }

    localStorage.setItem('last_jaap_date', todayStr);
    localStorage.setItem('jaap_streak_count', currentStreak);

    // बैज अनलॉक लॉजिक
    if (currentStreak >= 7) localStorage.setItem('badge_nishth_sadhak', 'unlocked');
    if (currentStreak >= 21) localStorage.setItem('badge_harit_prahari', 'unlocked');

    alert(`अद्भुत! आपकी ${currentStreak} दिन की साधना स्ट्रीक दर्ज हो गई है।`);
}

// 3. सिंगल-बॉक्स ओनर इनपुट (Single-Box Structured Input for External Data)
function parseUnifiedOwnerBulkInput(rawText) {
    const lines = rawText.split('\n').filter(l => l.trim() !== '');
    const parsedItems = [];

    lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2) {
            parsedItems.push({
                title: parts[0],
                detail: parts[1],
                extra: parts[2] || ''
            });
        }
    });

    return parsedItems;
}

// 4. उन्नत मेंटेनेंस मोड (Custom Maintenance Mode Toggle)
function activatePortalMaintenanceMode(isMaintenanceOn, customMessage) {
    const overlay = document.getElementById('maintenanceOverlay');
    if (!overlay) return;

    if (isMaintenanceOn) {
        overlay.style.display = 'flex';
        document.getElementById('maintenanceMsg').innerText = customMessage || "पोर्टल पर तकनीकी उन्नयन कार्य चल रहा है। कृपया कुछ समय पश्चात पुनः प्रयास करें।";
    } else {
        overlay.style.display = 'none';
    }
}
/* ==========================================================================
   BISHNOI PORTAL EXAM & SECURITY ENGINE - PART 1 (Core Persistence & Proctoring)
   ========================================================================== */

const EXAM_SECURE_CONFIG = {
    maxTabSwitches: 3,
    snapshotIntervalMs: 180000, // हर 3 मिनट में वेबकैम स्नैपशॉट
    autoSaveKey: "bishnoi_active_exam_session_v2"
};

// 1. टाइमर स्थिरता (Absolute End-Time Anchor to prevent timer drift)
function initializeSecureTimer(durationMinutes, onTimeExpire) {
    const startTime = parseInt(localStorage.getItem('exam_start_epoch') || Date.now());
    const totalDurationMs = durationMinutes * 60 * 1000;
    const absoluteEndTime = startTime + totalDurationMs;

    const timerInterval = setInterval(() => {
        const now = Date.now();
        const timeLeftMs = absoluteEndTime - now;

        if (timeLeftMs <= 0) {
            clearInterval(timerInterval);
            document.getElementById('examTimerDisplay').innerText = "00:00:00";
            onTimeExpire();
            return;
        }

        const hours = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const timerElem = document.getElementById('examTimerDisplay');
        if (timerElem) timerElem.innerText = timeString;

        // हर सेकंड परीक्षा राज्य (State) को सुरक्षित रखना
        saveExamProgressToLocal();
    }, 1000);
}

// 2. परीक्षा रिफ्रेश होने पर होमपेज पर जाने से रोकना (Exam Refresh State Persistence)
function saveExamProgressToLocal() {
    const activeRoll = localStorage.getItem('current_exam_roll');
    if (!activeRoll) return;

    const answersState = {};
    document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked').forEach(input => {
        answersState[input.name] = input.value;
    });

    const sessionData = {
        rollNumber: activeRoll,
        answers: answersState,
        timestamp: Date.now()
    };
    localStorage.setItem(EXAM_SECURE_CONFIG.autoSaveKey, JSON.stringify(sessionData));
}

function restoreExamSessionOnLoad() {
    const savedDataStr = localStorage.getItem(EXAM_SECURE_CONFIG.autoSaveKey);
    if (!savedDataStr) return;

    try {
        const session = JSON.parse(savedDataStr);
        // यदि 2 घंटे के भीतर का सत्र है, तो उत्तर पुनः बहाल करें
        if (Date.now() - session.timestamp < 2 * 60 * 60 * 1000) {
            Object.keys(session.answers).forEach(qName => {
                const val = session.answers[qName];
                const input = document.querySelector(`input[name="${qName}"][value="${val}"]`);
                if (input) input.checked = true;
            });
        }
    } catch (e) {
        console.error("Session restore failed", e);
    }
}

// 3. वेबकैम स्नैपशॉट और क्लाउडफ्लैरे KV सिंक
let examWebcamInterval = null;
const CLOUDFLARE_WORKER_ENDPOINT = "https://exam-snapshot-api.your-username.workers.dev"; // अपना क्लाउडफ्लैरे वर्कर URL यहाँ डालें

async function startExamWebcamProctoring(rollNumber) {
    try {
        const video = document.getElementById('examWebcamStream');
        if (!video) return;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        video.srcObject = stream;

        examWebcamInterval = setInterval(() => {
            captureAndUploadSnapshot(rollNumber);
        }, EXAM_SECURE_CONFIG.snapshotIntervalMs);
    } catch (err) {
        console.warn("Webcam access warning:", err);
    }
}

function captureAndUploadSnapshot(rollNumber) {
    const video = document.getElementById('examWebcamStream');
    const canvas = document.getElementById('examSnapshotCanvas');
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.6);

    fetch(CLOUDFLARE_WORKER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: rollNumber, image: base64Image })
    }).catch(err => console.log("Background snapshot sync deferred"));
}

function stopExamWebcamProctoring() {
    if (examWebcamInterval) clearInterval(examWebcamInterval);
    const video = document.getElementById('examWebcamStream');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
}
/* ==========================================================================
   BISHNOI PORTAL EXAM, EVALUATION & COMMUNITY ENGINE - PART 2 & 3 (Final)
   ========================================================================== */

// 1. परीक्षा हाल में प्रवेश से पहले काउंटडाउन और समय की जाँच (Countdown & Entry Lock)
function checkExamHallAccess(examStartTimeEpoch) {
    const currentTime = Date.now();
    if (currentTime < examStartTimeEpoch) {
        const diffMins = Math.ceil((examStartTimeEpoch - currentTime) / (1000 * 60));
        alert(`परीक्षा अभी शुरू नहीं हुई है! परीक्षा प्रारंभ होने में ${diffMins} मिनट शेष हैं।`);
        return false;
    }
    return true;
}

// 2. परीक्षा सबमिशन और परिणाम स्क्रीन ग्लिच सुधार (Fixing Submission Infinite Loop)
function handleExamSubmissionSuccess(rollNumber, totalScore) {
    localStorage.removeItem(EXAM_SECURE_CONFIG.autoSaveKey);
    localStorage.removeItem('current_exam_roll');
    stopExamWebcamProctoring();

    const resultBox = document.getElementById('examActiveContainer');
    if (resultBox) {
        resultBox.innerHTML = `
            <div class="p-8 text-center bg-white rounded-2xl shadow-xl max-w-lg mx-auto mt-10 border border-emerald-200">
                <div class="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">✓</div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">उत्तर पुस्तिका सफलतापूर्वक जमा हो गई है!</h2>
                <p class="text-gray-600 mb-6">रोल नंबर: <span class="font-semibold text-gray-900">${rollNumber}</span></p>
                <div class="bg-gray-50 p-4 rounded-xl mb-6 text-left">
                    <p class="text-sm text-gray-700">• आपके उत्तर सुरक्षित रूप से सर्वर पर दर्ज हो चुके हैं।</p>
                    <p class="text-sm text-gray-700 mt-1">• परिणाम घोषित होने पर आप अपना रोल नंबर डालकर अंक तालिका डाउनलोड कर सकेंगे।</p>
                </div>
                <button onclick="location.reload()" class="w-full py-3 bg-emerald-700 text-white rounded-xl font-semibold shadow hover:bg-emerald-800 transition">मुखपृष्ठ पर लौटें</button>
            </div>
        `;
    }
}

// 3. ऑटो-रैंक्ड रिजल्ट Excel जनरेटर (Auto-Ranked Merit List Export for Owners)
function generateRankedResultExcel(submissionsArray) {
    submissionsArray.sort((a, b) => b.score - a.score);

    let csvContent = "data:text/csv;charset=utf-8,Rank,Roll Number,Student Name,District,Score,Status\r\n";
    submissionsArray.forEach((sub, index) => {
        const row = [index + 1, sub.rollNumber, sub.name, sub.district, sub.score, sub.status];
        csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bishnoi_Exam_Merit_Ranked_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 4. बुकमार्क और प्रोफाइल टेक्स्ट स्पष्टता सुधार
function renderBookmarkedQuestions(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const savedBookmarks = JSON.parse(localStorage.getItem('bishnoi_exam_bookmarks') || '[]');
    if (savedBookmarks.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-center py-4">कोई बुकमार्क किया गया प्रश्न उपलब्ध नहीं है।</p>`;
        return;
    }

    container.innerHTML = savedBookmarks.map((q, idx) => `
        <div class="p-4 bg-white rounded-xl shadow-sm border border-gray-200 mb-3">
            <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">प्रश्न ${idx + 1}</span>
            <p class="text-gray-900 font-medium mt-1 text-base">${q.questionText}</p>
            <div class="mt-2 text-sm text-emerald-600 font-semibold">सही उत्तर: ${q.correctAnswer}</div>
        </div>
    `).join('');
}

// 5. क्योराओकी-स्टाइल भजन लिरिक्स सिंक (Karaoke-style Lyrics Sync in Sahitya Section)
const bhajanTimeline = [
    { time: 0, text: "किस कारण जोग लिया रे, सुण गोपीचंद मेरा वीर..." },
    { time: 15, text: "माता मनावै थारी मैनावती रानी, जोग मत लेई रे..." },
    { time: 30, text: "अमर बेल थारे राज महल में, भोग तज्या क्यों वीर..." }
];

function initKaraokeAudioPlayer(audioId, containerId) {
    const audio = document.getElementById(audioId);
    const container = document.getElementById(containerId);
    if (!audio || !container) return;

    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        let activeLine = bhajanTimeline[0].text;

        for (let i = 0; i < bhajanTimeline.length; i++) {
            if (currentTime >= bhajanTimeline[i].time) {
                activeLine = bhajanTimeline[i].text;
            }
        }

        container.innerHTML = `
            <div class="p-4 bg-emerald-900 text-amber-300 text-center text-xl font-bold rounded-2xl shadow-inner animate-pulse">
                🎵 ${activeLine}
            </div>
        `;
    });
}

// 6. प्रतिदिन काउंट होने वाली जप माला स्ट्रीक (Daily Jaap Mala Streak & Counters)
function recordDailyJaapCompletion() {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('last_jaap_date');
    let currentStreak = parseInt(localStorage.getItem('jaap_streak_count') || '0');

    if (lastDate === todayStr) {
        alert('आज की जप माला पहले ही दर्ज हो चुकी है!');
        return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yestStr) {
        currentStreak += 1;
    } else {
        currentStreak = 1;
    }

    localStorage.setItem('last_jaap_date', todayStr);
    localStorage.setItem('jaap_streak_count', currentStreak);

    if (currentStreak >= 7) localStorage.setItem('badge_nishth_sadhak', 'unlocked');
    if (currentStreak >= 21) localStorage.setItem('badge_harit_prahari', 'unlocked');

    alert(`साधना दर्ज हुई! आपकी कुल स्ट्रीक: ${currentStreak} दिन`);
}

// 7. सिंगल-बॉक्स ओनर इनपुट पार्सर (Unified Single-Box Input)
function parseUnifiedOwnerBulkInput(rawText) {
    const lines = rawText.split('\n').filter(l => l.trim() !== '');
    const parsedItems = [];
    lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2) {
            parsedItems.push({ title: parts[0], detail: parts[1], extra: parts[2] || '' });
        }
    });
    return parsedItems;
}

// 8. उन्नत मेंटेनेंस मोड (Custom Maintenance Mode Toggle)
function activatePortalMaintenanceMode(isMaintenanceOn, customMessage) {
    const overlay = document.getElementById('maintenanceOverlay');
    if (!overlay) return;

    if (isMaintenanceOn) {
        overlay.style.display = 'flex';
        document.getElementById('maintenanceMsg').innerText = customMessage || "पोर्टल पर तकनीकी उन्नयन कार्य चल रहा है। कृपया कुछ समय पश्चात पुनः प्रयास करें।";
    } else {
        overlay.style.display = 'none';
    }
}
