# बिश्नोइज़्म डिजिटल प्लेटफ़ॉर्म — मास्टर ब्लूप्रिंट

> उद्देश्य: बातचीत में माँगी गई सुविधाओं, उपलब्ध code evidence, ज्ञात bugs और प्रस्तावित विकास को एक ही संदर्भ दस्तावेज़ में रखना। यह दस्तावेज़ implementation की गारंटी नहीं है।

## Deliverable 1 — बातचीत की समीक्षा और सीमाएँ

### बातचीत से पुनः प्राप्त तथ्य
- वेबसाइट: https://bishnoism.vercel.app/
- GitHub repository: https://github.com/jaigodara/YOURWEBSITE
- Firebase project: bishnoi-platform; Auth domain: bishnoi-platform.firebaseapp.com; Firestore database: (default), location asia-south2.
- Hosting: Vercel. मुख्य files: index.html, script.js, owner-studio.html, package.json, vercel.json, src/tailwind.css.
- Firebase Auth में Google sign-in चालू होने की सूचना मिली थी; Google popup login पहले redirect/COOP समस्याओं के कारण बदला गया था।
- पहले fixes: tab visibility/aliases, renderAuthState में null पर forEach की समस्या, Firestore roles/{uid} से role पढ़ना, Tailwind production build setup.
- Firestore में देखे गए collections: roles, settings, userAccessLogs, users. userAccessLogs audit/access records के लिए है; owner role वहाँ नहीं बनाया जाता।
- Owner role document का उदाहरण: roles/{UID} में role: "owner". वास्तविक UID उसी Google account का होना चाहिए।
- Source review में Owner Studio में Overview, Media, Quiz, Exam और System panes, daily message, Amavasya settings, PDF/audio records, quiz question import, winners, proctoring toggle, submission viewer, maintenance settings, trusted-editor phone list, PDF/Excel exports और draft queue handlers मिले।
- Source review में exam collections config: mainExamQuestions, mockExam_1, mockExam_2, quiz; submission collections: mainExamSubmissions, mockExamSubmissions, quizAttempts.
- पहले बताए गए errors/issues: Google popup में COOP warnings; login का लौटकर भी signed-in न दिखना; script.js में null forEach crash; tab IDs/aliases mismatch; owner actions और परीक्षा controls का अधूरा होना।
- User की नई प्राथमिकता: Owner Studio में परीक्षा visibility toggles, Daily Quiz / Mock 1 / Mock 2 / Main Exam controls, manual result checking, ticket/admit-card/registration confirmation और सभी owner features को जोड़ना।
- रंग और fonts: forest #143622, terracotta #B34A1B, leaf #2D6A4F, warm sand #FAF6EE; Yatra One और Plus Jakarta Sans.

### अनिश्चित / अनुपलब्ध जानकारी
- पूरी पुरानी बातचीत और सभी पुराने uploads इस context में उपलब्ध होने की गारंटी नहीं; यह blueprint वर्तमान उपलब्ध context और अभी पढ़े गए source files पर आधारित है।
- Firebase Console के वास्तविक Firestore Security Rules, Storage Rules, Cloudflare Worker/backend और production logs यहाँ से सत्यापित नहीं हुए।
- सभी 120 Shabad, audio, verified religious sources, registration collection schema और QR/admit-card generation की वास्तविक उपलब्धता सत्यापित नहीं है।
- Firebase project में कौन-सी collections और fields वास्तव में मौजूद हैं, इसकी पूर्ण inventory उपलब्ध नहीं।
- Website का production runtime, Vercel build, Google sign-in, Firestore writes और सभी buttons end-to-end test नहीं हुए।
- owner-studio.html में SUPER_OWNER_UID hard-coded है और UI role check client-side है। Firestore rules file repository root में नहीं मिली; rules को अलग से सुरक्षित करना आवश्यक है।
- “Requested” का अर्थ माँगी गई सुविधा है, “Existing” का अर्थ केवल source evidence मिला, “Needs repair” का अर्थ ज्ञात issue या अधूरा व्यवहार, और “Unverified” का अर्थ runtime/डेटाबेस प्रमाण नहीं मिला।

---

## Deliverable 2 — Master Mind Map

~~~mermaid
mindmap
  root((बिश्नोइज़्म डिजिटल प्लेटफ़ॉर्म))
    उद्देश्य और संस्कृति
      गुरु जांभोजी भगवान की शिक्षाएँ
      29 नियम और सदाचार
      जीव-दया और प्रकृति संरक्षण
      धार्मिक ज्ञान और शिक्षा
      प्रामाणिक सामग्री का सत्यापन
    मुखपृष्ठ
      दैनिक सद्विचार और संदेश
      WhatsApp साझा करना
      पंचांग और अमावस्या अनुमान
      त्वरित सुविधाएँ
      घोषणाएँ और धार्मिक आयोजन
      परीक्षा और दैनिक क्विज़
      वृक्षारोपण संकल्प
    धार्मिक ज्ञान
      गुरु जांभोजी जीवन और दर्शन
      29 नियम अर्थ और व्यवहार
      खेजड़ली इतिहास
      खेजड़ी वृक्ष और वन्यजीव
      सत्य करुणा अनुशासन
      सत्यापित स्रोत
    साहित्य
      120 शब्दवाणी — स्रोत सत्यापन सहित
      खोज और क्रमवार पाठ
      अर्थ और भावार्थ
      भजन साखी उपदेश
      ऑडियो और karaoke
      पसंदीदा सामग्री और font size
    डिजिटल जपमाला
      108 मनके
      जप गणना और माला
      दैनिक प्रगति और streak
      वैकल्पिक vibration/sound
      इतिहास और reminders
    प्रकृति सेवा
      वृक्षारोपण pledges
      खेजड़ी जागरूकता
      जीव रक्षा
      जल और स्वच्छता
      सामुदायिक सेवा
    परीक्षा प्रणाली
      दैनिक क्विज़
      Mock 1 और Mock 2
      Main Exam 100 प्रश्न — आवश्यकता
      question bank और schedule
      timer और answer palette
      review flags और recovery
      tab visibility monitoring
      section-wise marking
    विद्यार्थी और परिणाम
      पंजीकरण और फोटो
      roll number
      admit card और QR
      ticket/registration confirmation
      auto evaluation
      manual checking
      result history और certificate
      PDF/Excel exports
    संवाद
      public feed और topic filters
      pinned message और reply
      authenticated posting
      reporting और moderation
      mute/delete admin controls
      spam/abuse protection
    प्रोफ़ाइल
      Google/email/phone login
      account details and photo
      quiz/exam history
      bookmarks
      jap progress
      logout and session timeout
    Owner Studio
      overview analytics
      daily quote and Amavasya
      media/PDF/audio manager
      question bank bulk import
      daily winners
      draft approval queue
      exam visibility and duration
      submission manual review
      registration/admit confirmation
      maintenance controls
      editor roles and permissions
      PDF/Excel exports
      history/kids manager
      error diagnostics
    Firebase and data
      Authentication
      Firestore
      Storage if configured
      users and roles
      settings and examConfig
      question collections
      submissions and registrations
      posts and media
      rules and validation
      private/public data separation
    Security and privacy
      trusted owner validation
      server-side authorization
      least-privilege rules
      private result access
      candidate PII protection
      rate limiting and moderation
      audit trail
    Design and accessibility
      five fixed navigation tabs
      forest/terracotta/leaf/sand palette
      Yatra One and Plus Jakarta Sans
      responsive mobile tablet desktop
      clear loading/error/empty states
      touch-friendly controls
    Reliability and deployment
      JavaScript syntax and runtime checks
      global function availability
      Firebase initialization
      tab and button regression tests
      Vercel build/deployment checks
      cache and browser diagnostics
      known-bug register
    Roadmap and verification
      critical bugs
      security first
      exam/admin core
      religious content
      community/profile
      automated tests
      optional enhancements
~~~

---

## Deliverable 3 — Detailed Mind Maps

### 3A. धार्मिक ज्ञान और शब्दवाणी

~~~mermaid
mindmap
  root((धार्मिक ज्ञान और साहित्य))
    गुरु जांभोजी भगवान
      जीवन परिचय
      शिक्षाएँ और दर्शन
      ऐतिहासिक संदर्भ
      सत्यापित स्रोत
      उद्धरण बिना प्रमाण प्रकाशित न हों
    29 नियम
      क्रमवार सूची
      सरल हिंदी अर्थ
      व्यवहारिक उदाहरण
      सत्य और सदाचार
      जीव-दया
      प्रकृति संरक्षण
      नियम-आधारित quiz
    इतिहास और प्रकृति
      खेजड़ली इतिहास
      खेजड़ी का महत्व
      वन्यजीव संरक्षण
      जल संरक्षण
      समाज सेवा
    शब्दवाणी
      120 शब्द — स्रोत से पुष्टि
      क्रमवार navigation
      खोज
      पाठ modal
      font-size controls
      अर्थ और भावार्थ
      पसंदीदा पाठ
    भजन और ऑडियो
      प्रामाणिक audio उपलब्धता
      play/pause
      seek slider
      10 सेकंड आगे/पीछे
      speed 1x 1.25x 1.5x
      karaoke lyrics
      auto-scroll highlight
      category और metadata
~~~

### 3B. जपमाला और पर्यावरण संरक्षण

~~~mermaid
mindmap
  root((जपमाला और प्रकृति सेवा))
    डिजिटल जपमाला
      108 beads
      tap-to-count
      पूर्ण माला counter
      total repetitions
      daily progress
      streak history
      साधक badges
      vibration toggle
      sound toggle
      optional reminders
      local/cloud persistence policy
    वृक्षारोपण
      pledge counter
      atomic Firestore increment
      duplicate prevention
      activity history
      tree-care follow-up
    पर्यावरण
      खेजड़ी जागरूकता
      जीव रक्षा
      जल संरक्षण
      स्वच्छ वातावरण
      प्रकृति सेवा campaigns
      community participation
    सत्यापन
      counters server-safe हों
      duplicate pledge रोकें
      personal activity private रखें
~~~

### 3C. परीक्षा, पंजीकरण और परिणाम

~~~mermaid
mindmap
  root((परीक्षा और परिणाम))
    Exam Hub
      Daily Quiz
      Mock Exam 1
      Mock Exam 2
      Main Exam
      instructions
      schedule and availability
      configurable duration
    Question bank
      mainExamQuestions
      mockExam_1
      mockExam_2
      quiz
      question text and options
      correct answer
      section and marks
      bulk upload and validation
    Candidate enrollment
      full name and father's name
      DOB and mobile
      location
      photograph down-sampling
      unique roll number
      registration status
      private personal data
    Admit card / ticket
      candidate details
      exam schedule
      instructions
      QR verification
      download/print PDF
      ticket confirmation
    Exam runtime
      timer using absolute end timestamp
      answer palette
      answered/unanswered/review
      save answer state
      refresh recovery
      visibility change warnings
      submit after configured violations
      clear network error handling
    Marking
      automatic MCQ evaluation
      section A +2/-0.5 requested example
      section B +4/-1 requested example
      manual checking
      reviewer note and audit
      score revision reason
    Result desk
      secure roll number + DOB lookup
      score breakdown
      correct/wrong/unanswered
      history
      certificate and photo
      QR verification
      export PDF/Excel
    Integrity
      do not expose answer keys to clients
      server-authoritative score
      immutable original submission
      manual override audit trail
~~~

### 3D. संवाद और उपयोगकर्ता प्रोफ़ाइल

~~~mermaid
mindmap
  root((संवाद और प्रोफ़ाइल))
    संवाद
      public read access
      login required to post
      topic filters
      reply preview
      pinned banner
      report content
      mute/unmute
      admin delete
      abusive words guard
      spam-link guard
      audit moderation
    प्रोफ़ाइल
      Google popup login
      email/password
      phone OTP optional
      account name and photo
      account linking
      jap history
      quiz and exam history
      bookmarks
      saved literature
      session persistence
      20-minute inactivity lock
      logout
    Privacy
      private fields only to owner
      user can read own results
      no public DOB/mobile/photo URLs
      rate-limit posting and sign-in
~~~

### 3E. Owner Studio, Firebase और सुरक्षा

~~~mermaid
mindmap
  root((Owner Studio और Firebase))
    Owner Studio
      Overview
        users analytics
        quiz attempts
        draft queue
        community post count
      Quick actions
        daily quote
        bulk question upload
        PDF/audio upload
        history/kids manager
      Content
        daily message
        Amavasya config
        PDFs and audios
        shabadwani content
        draft review queue
        owner approval only
      Exam manager
        daily quiz toggle
        mock 1 toggle
        mock 2 toggle
        main exam toggle
        enrollment and results toggle
        duration and schedule
        question bank management
        submission review
        manual score override
      Confirmation desk
        registration search
        roll number lookup
        admit/ticket status
        pending confirmed rejected
        reviewer and timestamp
      Reports
        quiz PDF
        quiz XLSX
        members PDF
        members XLSX
        exam results export
        candidate export
      Maintenance
        global mode
        per-section locks
        maintenance message
        owner/editor bypass
      Editors
        UID-based roles
        draft submission only
        owner-only approval
        revoke editor
    Firebase
      Authentication
      Firestore
      Storage if configured
      users
      roles
      settings
      examConfig/current
      mainExamQuestions
      mockExam_1
      mockExam_2
      quiz
      mainExamSubmissions
      mockExamSubmissions
      quizAttempts
      registrations actual name unverified
      posts
      audios
      pdfs
      draftQueue
      userAccessLogs
    Security
      owner role validated by trusted rules/backend
      no client-only authorization
      least privilege
      field validation
      candidate privacy
      result privacy
      rate limits
      audit logs
      secrets outside browser
~~~

### 3F. JavaScript, deployment, testing और maintenance

~~~mermaid
mindmap
  root((तकनीकी विश्वसनीयता))
    Current source
      index.html
      script.js
      owner-studio.html
      src/tailwind.css
      package.json
      vercel.json
    Deployment
      Vercel build command npm run build
      generated Tailwind CSS
      production deployment status verify
      cache refresh
      browser extension diagnostics
    Known function contracts
      window.switchTab
      window.promptUserLogin
      window.startDailyQuiz
      window.startMockExam
      window.toggleKaraokePlayback
      startMockExam1 and startMockExam2 found in code
      BishnoiQuiz.startQuiz in HTML
    Known issues
      prior null forEach crash
      tab alias and panel mismatch
      Google popup/COOP warnings
      Owner Studio missing requested controls
      submission review not yet full manual grading
      Firestore rules unavailable in repo root
    Tests
      syntax check
      all navigation tabs
      login/logout
      exam question load
      timer and submit
      answers persisted
      manual review saves
      registration status saves
      export files
      maintenance visibility
      role-denied user blocked
      mobile and desktop
      Firebase permission-denied
    Operations
      bug register
      release notes
      rollback plan
      backups
      security rules review
~~~

---

## Owner Studio के बटन — संक्षिप्त कार्य सूची

| बटन / नियंत्रण | अपेक्षित काम | स्रोत से स्थिति |
|---|---|---|
| Analytics refresh | users, quiz attempts, drafts और posts की गिनती | Source handler मिला; live data unverified |
| Daily quote save | आज का संदेश settings/dailySandesh में save | Source handler मिला |
| Amavasya save | नाम, तारीख और विवरण save | Source handler मिला |
| PDF save/delete | PDF metadata जोड़ना/हटाना | Source handler मिला; upload/storage flow unverified |
| Audio save/delete | audio metadata जोड़ना/हटाना | Source handler मिला; actual audio upload unverified |
| Bulk question import | text format से quiz में प्रश्न जोड़ना | Source handler मिला; validation/data format जाँचना है |
| Clear all quiz questions | quiz collection के प्रश्न हटाना | Source handler मिला; destructive action पर extra safeguards चाहिए |
| Daily winners save/clear | पहले/दूसरे/तीसरे स्थान का नाम और score | Source handler मिला; auto-calculation नहीं, manual values |
| Draft approve/reject | trusted editor drafts को approve या हटाना | Source handler मिला; rules में owner-only publish unverified |
| Camera proctoring toggle | settings/examConfig में proctoringEnabled बदलना | Source handler मिला; वास्तविक snapshot capture/consent unverified |
| Refresh submissions | submissions records लाना | पहले केवल list view था; manual-review विस्तार इस branch में प्रस्तावित |
| Exam visibility toggles | Daily/Mock/Main/Enrollment/Results show/hide | इस branch में नया प्रस्तावित code; runtime test बाकी |
| Exam duration save | examConfig/current में duration save | इस branch में नया प्रस्तावित code; exam runtime integration test बाकी |
| Manual score save | manual score, reviewer note, reviewer UID/time save | इस branch में नया प्रस्तावित code; server rules और audit design verify करना है |
| Registration confirmation | pending/confirmed/rejected status save | इस branch में नया प्रस्तावित code; actual collection schema verify करना है |
| Maintenance save | global mode, message, per-section lock save | Source handler मिला; main website enforcement पूरी तरह verify नहीं |
| VIP bypass checkbox | Admin/Editor bypass setting | UI मौजूद; secure authorization behavior unverified |
| Add/remove trusted editor | phone number की सूची save/remove | Source handler मिला; phone-number सूची सुरक्षित UID roles का विकल्प नहीं |
| Quiz PDF/XLSX export | quiz attempts की report download | Source handler मिला; privacy and actual data export test बाकी |
| Members PDF/XLSX export | users collection export | Source handler मिला; personal-data minimization आवश्यक |
| Logout | Owner Studio से sign out | Source handler मिला |

---

## Deliverable 4 — Feature Status Register

| Feature | Details | Status | Priority | Dependencies |
|---|---|---|---|---|
| Vercel website | bishnoism.vercel.app | Existing — URL/context confirmed; runtime unverified | P1 | Vercel |
| Five-tab navigation | Home, Sahitya, Pariksha, Samvad, Profile | Existing — HTML evidence; full navigation test needed | P1 | index.html, script.js |
| Forest/terracotta palette | brand colors and fonts | Existing — CSS classes/config evidence; visual audit needed | P2 | CSS/build |
| Google login | Firebase Auth popup flow | Existing — source/history evidence; user reported trouble | P1 | Firebase Auth |
| Email/password login | Auth modal controls | Existing — UI evidence; end-to-end unverified | P1 | Firebase Auth |
| Phone OTP | optional sign-in flow | Unverified — UI exists; SMS cost/config may apply | P3 | Firebase Auth / billing |
| Firestore user profile | users/{uid} | Existing — source evidence | P1 | Firestore rules |
| roles/{uid} owner role | role string owner | Existing — user confirmed document created | P1 | exact UID, rules |
| Owner Studio auth gate | role lookup in browser | Needs repair — client-side check alone is not a security boundary | P0 | Firestore rules/backend |
| Daily message editor | save dailySandesh | Existing — handler evidence | P2 | settings rules |
| Amavasya settings | save name/date/description | Existing — handler evidence | P3 | settings rules |
| PDF/audio metadata | add/delete records | Existing — handlers evidence; actual upload unverified | P2 | Firestore/Storage |
| Bulk quiz upload | import into quiz collection | Existing — handler evidence; data validation needed | P1 | quiz schema |
| Main exam questions | mainExamQuestions | Requested — collection configured in script | P1 | question bank, rules |
| Mock exam 1/2 | mockExam_1 and mockExam_2 | Requested — collection config exists | P1 | question bank, rules |
| Daily quiz | quiz | Existing — UI/handlers evidence; runtime unverified | P1 | quiz data |
| Owner exam visibility controls | Daily/Mock/Main/Enrollment/Results toggles | Requested; proposed code in branch | P1 | examConfig/current |
| Exam duration control | configurable minutes | Requested; proposed code in branch | P1 | examConfig/current, script.js |
| Manual result checking | manual score and reviewer note | Requested; proposed code in branch | P0 | submissions schema, secure rules |
| Registration/ticket confirmation | status pending/confirmed/rejected | Requested; proposed code in branch | P1 | actual registration collection |
| Admit card with QR | PDF and verification | Requested | P2 | registration schema, QR library |
| Secure server-side marking | protect answer keys and scores | Suggested / unverified | P0 | trusted backend/Cloud Functions/Worker |
| Anti-cheat visibility monitoring | submit after 3 tab changes | Requested; proposed code in branch | P2 | browser runtime |
| Refresh recovery | answers and timer restore | Requested; unverified | P1 | durable attempt model |
| Section-based scoring | positive/negative marks by section | Requested | P1 | question schema, grading engine |
| Result desk | roll number + DOB lookup | Requested | P1 | private results and verification |
| Certificate generation | canvas PNG, photo, QR | Requested | P2 | result verification |
| Community feed | posts/topic filter/pinned banner | Existing — UI/source evidence | P2 | posts rules |
| Moderation tools | report/mute/delete/spam guards | Requested / unverified | P2 | roles, moderation rules |
| Digital japmala | 108-bead UI and counters | Existing — HTML/source evidence; persistence/streak unverified | P2 | profile storage |
| Tree pledge | pledge UI | Existing — UI evidence; atomic counter unverified | P2 | transaction/backend |
| 120 Shabadwani catalogue | authentic source and content | Requested / unverified | P2 | verified content |
| Karaoke synchronized lyrics | highlighted lyrics and controls | Requested; some playback controls in HTML | P3 | lyrics/audio timing |
| Owner maintenance toggles | global and per-section settings | Existing — UI/handler evidence; enforcement unverified | P1 | portal config and rules |
| Trusted editors | phone list and draft workflow | Existing — UI/handler evidence; authorization unverified | P1 | secure roles |
| PDF/XLSX exports | quiz and members | Existing — handlers evidence; runtime/privacy unverified | P2 | jsPDF/XLSX and read rules |
| Firestore rules file in repo | complete production rules | Needs repair — root file not found in fetched repository | P0 | Firebase Console/repo |
| 20-minute inactivity lock | session auto-lock | Requested / unverified | P2 | auth/session management |
| AI Sahayak | server-side query input | Requested / unverified | P3 | secure backend/API |
| District telemetry/winners | district-wise analytics and automatic winners | Requested / unverified | P3 | clean enrollment/results data |
| Vercel build | Tailwind generated CSS | Existing — config evidence; production build unverified | P1 | package.json/Vercel |
| End-to-end tests | auth, exam, owner actions | Needs repair — no runtime test evidence available | P0 | test environment |

### Known technical function names to verify
- window.switchTab — present in source.
- window.promptUserLogin — present in source.
- window.startDailyQuiz — exact identifier not confirmed in inspected excerpt; HTML currently calls window.BishnoiQuiz.startQuiz().
- window.startMockExam — exact identifier not confirmed; window.startMockExam1 and window.startMockExam2 are present.
- window.toggleKaraokePlayback — present in source.
- Prior reported JavaScript error: Cannot read properties of null (reading 'forEach') in renderAuthState; a fix to use the all-elements selector was merged earlier, but live regression testing remains necessary.
- “Unexpected end of input” was mentioned in the requested master prompt as an issue to inspect; current inspected file is not claimed to have a production runtime syntax test.

---

## Deliverable 5 — Development Roadmap

### Phase 1 — P0: Reliability and security blockers
1. Retrieve and review actual Firestore and Storage rules from Firebase Console.
2. Enforce owner/editor authorization in rules or trusted backend; never trust client-side role checks alone.
3. Verify role document UID matches the signed-in account.
4. Test Vercel build and production console errors after each merge.
5. Confirm all data collections, fields and rules before enabling writes from new review controls.
6. Protect private candidate data, DOB, phone, photo and results.
7. Preserve original automatic score/submission and log every manual score override.

**Dependency:** Do not use a public-write rule as a workaround for Owner Studio permission errors.

### Phase 2 — P1: Core navigation and exam administration
1. Test all five navigation tabs and homepage shortcut buttons.
2. Verify question schemas and collection mapping for Daily Quiz, Mock 1, Mock 2 and Main Exam.
3. Add owner visibility/duration settings and ensure the student portal consumes the same examConfig/current document.
4. Add manual checking queue showing candidate, roll number, answers, auto score, manual score, notes and review status.
5. Add registration/admit-card confirmation after confirming the actual registration collection.
6. Add test cases for no data, permission denied, bad data, duplicate submission and network failure.
7. Verify every Owner Studio button has a real action and clear success/error feedback.

**Dependency:** Question schema and submission schema must be agreed before grading/reporting is considered complete.

### Phase 3 — P1/P2: Exam engine and results
1. Store answer snapshots and an absolute end timestamp per attempt.
2. Restore attempts after refresh without resetting timer.
3. Add answer palette, review flags and answered/unanswered status.
4. Add section-based marking rules and negative marks.
5. Move authoritative answer keys and score calculation to trusted backend.
6. Build private result lookup using verified roll number/DOB and avoid exposing bulk result data.
7. Add QR admit card and result certificate once candidate fields and branding assets are verified.
8. Add exports with personal-data minimization and access logging.

### Phase 4 — P2: Religious content and learning
1. Import verified 29-rule material and authentic Shabadwani sources.
2. Confirm which 120 Shabads are available; do not fabricate missing texts or meanings.
3. Organize PDFs/audio metadata and verify actual Storage upload/playback.
4. Improve karaoke timing only where timestamped lyrics/audio are available.
5. Verify Panchang/Amavasya calculation before labelling it guaranteed live.
6. Add japmala persistence/streaks and atomic pledge increments.

### Phase 5 — P2: Community and profile
1. Confirm authenticated post creation and public read policy.
2. Add reporting and moderation controls protected by server-side roles.
3. Add bookmarks, result history and japmala history to profile.
4. Implement inactivity lock with clear re-authentication and no accidental loss of active exam work.
5. Add accessible loading, empty and error states.

### Phase 6 — P3: Optional enhancements
1. AI Sahayak through a protected backend.
2. District-wise telemetry and automatic daily winners.
3. More detailed audio controls and reminders.
4. Advanced analytics and admin diagnostics.
5. Additional child-learning/history manager content after review.

### Release acceptance checklist
- [ ] Vercel build succeeds and deployed commit is identifiable.
- [ ] Signed-out visitor can read public content but cannot perform protected writes.
- [ ] Non-owner account cannot write owner settings or approve drafts.
- [ ] Owner can save each setting and sees it reflected on the student site.
- [ ] Daily Quiz, Mock 1, Mock 2 and Main Exam each load from the intended collection.
- [ ] Manual review saves score, reason, reviewer UID and timestamp without overwriting the original submission.
- [ ] Registration/ticket status changes are restricted and auditable.
- [ ] Firestore denies unauthorized writes even if browser code is modified.
- [ ] No console errors in the tested flows.
- [ ] Mobile, tablet and desktop interactions pass.
