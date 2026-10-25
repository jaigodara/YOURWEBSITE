(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BishnoiExportFormatter = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const LETTERS = ['A', 'B', 'C', 'D'];
  const SET_NAMES = {
    mainExamQuestions: 'मुख्य परीक्षा',
    mockExam_1: 'मॉक परीक्षा — सेट 1',
    mockExam_2: 'मॉक परीक्षा — सेट 2',
    quiz: 'दैनिक क्विज़',
    mainExamSubmissions: 'मुख्य परीक्षा',
    mockExamSubmissions: 'मॉक परीक्षा'
  };
  const valueOf = (row, keys) => {
    for (const key of keys) {
      const value = row && row[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return '';
  };
  const dateText = value => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString('en-IN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }) : '';
  };
  const optionText = value => {
    if (value === '' || value == null) return 'लंबित';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^[A-D]$/i.test(trimmed)) return 'विकल्प ' + trimmed.toUpperCase();
      if (/^[0-3]$/.test(trimmed)) return 'विकल्प ' + LETTERS[Number(trimmed)];
      if (/^[1-4]$/.test(trimmed)) return 'विकल्प ' + LETTERS[Number(trimmed) - 1];
      return trimmed;
    }
    if (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 3) {
      return 'विकल्प ' + LETTERS[Number(value)];
    }
    return String(value);
  };
  const setText = (row, fallback) => {
    const source = String(row && row._sourceCollection || fallback || '').trim();
    const raw = String(valueOf(row, ['questionSet', 'questionSetKey', 'set', 'setName']) || '').trim();
    if (source && SET_NAMES[source]) {
      const sourceName = SET_NAMES[source];
      if (!raw || raw === source || SET_NAMES[raw] || new RegExp(sourceName, 'i').test(raw)) return sourceName;
      const suffix = /^set[\s_-]*[1-4]$/i.test(raw)
        ? ' — Set ' + raw.match(/[1-4]/)[0]
        : ' — ' + raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
      return sourceName + suffix;
    }
    if (!raw) return source && SET_NAMES[source] ? SET_NAMES[source] : 'Unspecified';
    if (/^set[\s_-]*([1-4])$/i.test(raw)) return 'Set ' + raw.match(/[1-4]/)[0];
    if (SET_NAMES[raw]) return SET_NAMES[raw];
    return raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  };
  const cleanCell = value => {
    if (value == null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  const actorLabel = row => valueOf(row, ['updatedBy', 'createdBy', 'reviewedBy', 'approvedBy'])
    ? 'Authorized admin/editor' : '—';
  const roll = row => valueOf(row, ['rollNumber', 'roll_number', 'roll', 'admitCardRollNumber', 'Roll Number']) || 'Pending';
  const questionReference = (row, index) => {
    const publicRef = valueOf(row, ['questionNumber', 'displayId', 'publicId', 'questionCode', 'slug']);
    if (publicRef && String(publicRef).length <= 32 && !/^[a-z0-9_-]{18,}$/i.test(String(publicRef))) return String(publicRef);
    const id = valueOf(row, ['id', 'questionId', 'questionID', 'docId']);
    if (id) return '#' + String(id).replace(/^#/, '').slice(0, 8);
    return 'Q-' + String(index + 1).padStart(3, '0');
  };

  function formatOwnerExportReport(dataType, rawRows) {
    const rows = Array.isArray(rawRows) ? rawRows : [];
    const type = String(dataType || '');
    const date = new Date().toLocaleDateString('en-IN');
    if (type === 'examAnswerKeys') {
      return {
        title: 'बिश्नोई डिजिटल परीक्षा परिषद — मास्टर उत्तर कुंजी',
        subtitle: 'जारी तिथि: ' + date + ' | कुल प्रश्न: ' + rows.length,
        orientation: 'landscape',
        columns: ['क्र. सं.', 'प्रश्न सेट', 'प्रश्न संदर्भ', 'सही विकल्प', 'अंतिम संशोधनकर्ता', 'संशोधन दिनांक'],
        rows: rows.map((row, index) => ({
          'क्र. सं.': index + 1,
          'प्रश्न सेट': setText(row),
          'प्रश्न संदर्भ': questionReference(row, index),
          'सही विकल्प': optionText(valueOf(row, ['answerIndex', 'answerindex', 'correctAnswerIndex', 'correctOptionIndex', 'ans', 'answer', 'correctAnswer'])),
          'अंतिम संशोधनकर्ता': actorLabel(row) === '—' ? '—' : 'व्यवस्थापक / संपादक',
          'संशोधन दिनांक': dateText(valueOf(row, ['updatedAt', 'updated_at', 'modifiedAt'])) || '—'
        }))
      };
    }
    if (type === 'examEnrolledStudents' || type === 'studentRollNumbers' || type === 'admitCards') {
      const phoneText = value => {
        const digits = String(value || '').replace(/\D/g, '');
        const normalized = digits.length === 12 && digits.startsWith('91') ? digits.slice(2)
          : digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits;
        return normalized.length === 10 ? normalized.slice(0, 2) + '••••••' + normalized.slice(-2) : '—';
      };
      const formatted = rows.map(row => {
        const rawStatus = String(valueOf(row, ['Admission Status', 'verificationStatus', 'status']) || '').toLowerCase();
        const approved = row.isApproved === true || row.approved === true ||
          ['approved', 'confirmed', 'verified', 'स्वीकृत'].includes(rawStatus) ||
          Boolean(valueOf(row, ['rollNumber', 'roll_number', 'admitCardRollNumber', 'Roll Number']));
        return {
          'आवंटित अनुक्रमांक': valueOf(row, ['rollNumber', 'roll_number', 'roll', 'admitCardRollNumber', 'Roll Number']) || 'लंबित',
          'विद्यार्थी का नाम': valueOf(row, ['fullName', 'displayName', 'studentName', 'name', 'Student Name']) || '—',
          'पिता / अभिभावक': valueOf(row, ['fatherName', 'fathersName', 'father_name', 'guardianName', 'Father / Guardian']) || '—',
          'मोबाइल': phoneText(valueOf(row, ['phoneNumber', 'phone', 'mobileNumber', 'mobile', 'Mobile'])) ,
          'प्रवेश स्थिति': approved ? 'स्वीकृत' : 'समीक्षाधीन'
        };
      });
      return {
        title: 'विद्यार्थी नामांकन एवं रोल नंबर आवंटन रजिस्टर',
        subtitle: 'जारी तिथि: ' + date + ' | कुल पंजीकृत विद्यार्थी: ' + rows.length,
        orientation: 'portrait',
        columns: ['आवंटित अनुक्रमांक', 'विद्यार्थी का नाम', 'पिता / अभिभावक', 'मोबाइल', 'प्रवेश स्थिति'],
        rows: formatted
      };
    }
    if (type === 'reviews') {
      return {
        title: 'मैन्युअल उत्तर-पत्र जाँच एवं टिप्पणी रिपोर्ट',
        subtitle: 'जारी तिथि: ' + date + ' | कुल जाँचे / समीक्षाधीन रिकॉर्ड: ' + rows.length,
        orientation: 'landscape',
        columns: ['क्र. सं.', 'अनुक्रमांक', 'विद्यार्थी का नाम', 'परीक्षा', 'प्राप्तांक', 'जाँच स्थिति', 'जाँचकर्ता', 'जाँच टिप्पणी / कारण', 'जाँच दिनांक'],
        rows: rows.map((row, index) => ({
          'क्र. सं.': index + 1,
          'अनुक्रमांक': valueOf(row, ['rollNumber', 'roll_number', 'roll', 'Roll Number']) || '—',
          'विद्यार्थी का नाम': valueOf(row, ['fullName', 'displayName', 'studentName', 'name', 'Student Name']) || '—',
          'परीक्षा': setText(row),
          'प्राप्तांक': valueOf(row, ['checkedScore', 'finalMarks', 'score', 'marks', 'obtainedMarks', 'Marks']) || '—',
          'जाँच स्थिति': valueOf(row, ['manualCheckStatus', 'reviewStatus', 'status', 'resultStatus']) || 'समीक्षाधीन',
          'जाँचकर्ता': actorLabel(row) === '—' ? '—' : 'व्यवस्थापक / संपादक',
          'जाँच टिप्पणी / कारण': valueOf(row, ['checkingReason', 'reviewReason', 'feedback', 'remarks', 'reason', 'comment']) || '—',
          'जाँच दिनांक': dateText(valueOf(row, ['reviewedAt', 'checkedAt', 'updatedAt', 'createdAt'])) || '—'
        }))
      };
    }
    if (['mainExamSubmissions', 'mockExamSubmissions', 'quizAttempts', 'publishedResults'].includes(type)) {
      const ranked = rows.map(row => ({
        row,
        score: (() => { const rawScore = valueOf(row, ['finalMarks', 'checkedScore', 'score', 'marks', 'obtainedMarks', 'Marks']); return rawScore === '' ? NaN : Number(rawScore); })()
      })).sort((a, b) => (Number.isFinite(b.score) ? b.score : -Infinity) - (Number.isFinite(a.score) ? a.score : -Infinity));
      let priorScore = null;
      let priorRank = 0;
      const formatted = ranked.map(({ row, score }, index) => {
        const explicitRank = valueOf(row, ['rank', 'meritRank', 'Rank']);
        let rank = explicitRank || '—';
        if (!explicitRank && Number.isFinite(score)) {
          rank = score === priorScore ? priorRank : index + 1;
          priorScore = score;
          priorRank = Number(rank);
        }
        const violationValue = Array.isArray(row.violations) ? row.violations.length
          : valueOf(row, ['violationCount', 'violationsCount', 'tabSwitchCount', 'tabSwitches', 'liveViolationCount', 'Violations']);
        return {
          'रैंक': rank === '—' ? '—' : '#' + rank,
          'अनुक्रमांक': valueOf(row, ['rollNumber', 'roll_number', 'roll', 'admitCardRollNumber', 'Roll Number']) || '—',
          'परीक्षार्थी का नाम': valueOf(row, ['fullName', 'displayName', 'studentName', 'name', 'Student Name']) || '—',
          'कुल प्रश्न': valueOf(row, ['totalQuestions', 'questionCount', 'totalQuestion', 'Total Questions']) || '—',
          'सही उत्तर': valueOf(row, ['correctCount', 'correctAnswers', 'correct', 'Correct']) || 0,
          'गलत उत्तर': valueOf(row, ['wrongCount', 'incorrectCount', 'wrongAnswers', 'incorrect', 'Incorrect']) || 0,
          'उल्लंघन': violationValue === '' || violationValue == null ? 0 : violationValue,
          'प्राप्तांक': Number.isFinite(score) ? score : '—',
          'अधिकतम अंक': valueOf(row, ['maxMarks', 'maximumMarks', 'totalMarks', 'total', 'Total Marks']) || '—',
          'समय': valueOf(row, ['timeTakenText', 'timeTaken', 'durationText', 'durationMinutes', 'Time Taken']) || '—',
          'परिणाम': (() => {
            const status = String(valueOf(row, ['resultStatus', 'result', 'status', 'manualCheckStatus', 'Result']) || '').toLowerCase();
            if (/pass|merit|qualified|publish/.test(status)) return 'उत्तीर्ण / प्रकाशित';
            if (/fail|reject/.test(status)) return 'अनुत्तीर्ण / अस्वीकृत';
            if (/submit/.test(status)) return 'जमा';
            if (/pending|review/.test(status) || !status) return 'समीक्षाधीन';
            return valueOf(row, ['resultStatus', 'result', 'status', 'manualCheckStatus', 'Result']);
          })()
        };
      });
      return {
        title: type === 'publishedResults' ? 'परीक्षा परिणाम एवं अंकतालिका लेजर' : 'परीक्षा उत्तर-पत्र एवं मूल्यांकन लेजर',
        subtitle: 'जारी तिथि: ' + date + ' | कुल परीक्षार्थी: ' + rows.length,
        orientation: 'landscape',
        columns: ['रैंक', 'अनुक्रमांक', 'परीक्षार्थी का नाम', 'कुल प्रश्न', 'सही उत्तर', 'गलत उत्तर', 'उल्लंघन', 'प्राप्तांक', 'अधिकतम अंक', 'समय', 'परिणाम'],
        rows: formatted
      };
    }
    if (['mainExamQuestions', 'mockExam_1', 'mockExam_2', 'quiz'].includes(type)) {
      const formatted = rows.map((row, index) => {
        const opts = valueOf(row, ['options', 'opts']);
        const optionList = Array.isArray(opts) ? opts : [];
        const output = {
          'No.': index + 1,
          'Question': valueOf(row, ['question', 'q', 'text']) || '—',
          'Option A': optionList[0] || row.optionA || row.option_a || '',
          'Option B': optionList[1] || row.optionB || row.option_b || '',
          'Option C': optionList[2] || row.optionC || row.option_c || '',
          'Option D': optionList[3] || row.optionD || row.option_d || '',
          'Status': valueOf(row, ['status', 'published']) || '—'
        };
        if (type === 'quiz') output['Correct Option'] = optionText(valueOf(row, ['answerIndex', 'correctAnswer', 'ans', 'correctOption']));
        return output;
      });
      const columns = type === 'quiz'
        ? ['No.', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Option', 'Status']
        : ['No.', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Status'];
      return {
        title: (SET_NAMES[type] || type) + ' — Question Bank Report',
        subtitle: 'Generated ' + date + ' | Total questions: ' + rows.length,
        orientation: 'landscape',
        columns,
        rows: formatted
      };
    }

    if (type === 'roleAuditLogs') {
      const actionLabels = {
        invitation_created: 'संपादक आमंत्रण बनाया',
        editor_removed: 'संपादक भूमिका हटाई'
      };
      return {
        title: 'सहायक संपादक अनुमति ऑडिट रिपोर्ट',
        subtitle: 'जारी तिथि: ' + date + ' | कुल ऑडिट रिकॉर्ड: ' + rows.length,
        orientation: 'landscape',
        columns: ['क्र. सं.', 'कार्रवाई', 'संपादक का नाम', 'मोबाइल के अंतिम 4 अंक', 'अनुमतियाँ', 'परिवर्तनकर्ता', 'दिनांक / समय'],
        rows: rows.map((row, index) => {
          const p = row.permissions || {};
          return {
            'क्र. सं.': index + 1,
            'कार्रवाई': actionLabels[valueOf(row, ['action'])] || 'अनुमति परिवर्तन',
            'संपादक का नाम': valueOf(row, ['targetName']) || '—',
            'मोबाइल के अंतिम 4 अंक': valueOf(row, ['targetPhoneLast4']) || '—',
            'अनुमतियाँ': [
              p.media && 'मीडिया',
              p.quizDrafts && 'क्विज़ Draft',
              p.examReview && 'परीक्षा जाँच',
              p.notifications && 'सूचनाएँ'
            ].filter(Boolean).join(', ') || 'कोई अतिरिक्त अधिकार नहीं',
            'परिवर्तनकर्ता': valueOf(row, ['changedByName']) || 'व्यवस्थापक',
            'दिनांक / समय': dateText(valueOf(row, ['changedAt'])) || '—'
          };
        })
      };
    }
    if (type === 'live_violations') {
      const formatted = rows.map(row => ({
        'Time': dateText(valueOf(row, ['occurredAtMs', 'timestamp', 'createdAt', 'occurredAt'])),
        'Roll Number': roll(row),
        'Student Name': valueOf(row, ['fullName', 'displayName', 'studentName', 'name']) || '—',
        'Exam': valueOf(row, ['examName', 'examType', 'mode', 'sessionName']) || '—',
        'Violation': valueOf(row, ['violationType', 'type', 'event', 'reason', 'description']) || '—',
        'Strike': valueOf(row, ['strike', 'violationCount', 'count']) || '—',
        'Action': valueOf(row, ['action', 'status', 'result']) || 'Logged'
      }));
      return {
        title: 'Live Exam Integrity — Violation Log',
        subtitle: 'Generated ' + date + ' | Total logged violations: ' + rows.length,
        orientation: 'landscape',
        columns: ['Time', 'Roll Number', 'Student Name', 'Exam', 'Violation', 'Strike', 'Action'],
        rows: formatted
      };
    }
    if (type === 'users' || type === 'assistantEditors' || type === 'trustedEditors') {
      const formatted = rows.map(row => ({
        'Name': valueOf(row, ['fullName', 'displayName', 'name']) || '—',
        'Mobile': valueOf(row, ['phoneNumber', 'phone', 'mobileNumber', 'mobile']) || '—',
        'Email': valueOf(row, ['email']) || '—',
        'Role': valueOf(row, ['role', 'accessLevel', 'type']) || (type === 'users' ? 'Member' : 'Editor'),
        'Permissions': Array.isArray(row.permissions) ? row.permissions.join(', ') : [
          row.canCheckAnswers === true ? 'Check answers' : '',
          row.canPublishMedia === true ? 'Publish media' : '',
          row.canManageNotifications === true ? 'Notifications' : ''
        ].filter(Boolean).join(', ') || 'Assigned by Owner',
        'Status': row.disabled === true || row.active === false ? 'Inactive' : (row.active === true || row.accepted === true ? 'Active' : 'Pending')
      }));
      return {
        title: type === 'users' ? 'Member Directory' : 'Assistant Editor & Permissions Register',
        subtitle: 'Generated ' + date + ' | Total records: ' + rows.length,
        orientation: 'landscape',
        columns: ['Name', 'Mobile', 'Email', 'Role', 'Permissions', 'Status'],
        rows: formatted
      };
    }
    if (type === 'userNotifications' || type === 'notifications') {
      return {
        title: 'Notification Delivery Register',
        subtitle: 'Generated ' + date + ' | Total records: ' + rows.length,
        orientation: 'landscape',
        columns: ['No.', 'Title', 'Message', 'Audience', 'Status', 'Created'],
        rows: rows.map((row, index) => ({
          'No.': index + 1,
          'Title': valueOf(row, ['title', 'heading', 'subject']) || '—',
          'Message': valueOf(row, ['body', 'message', 'text']) || '—',
          'Audience': valueOf(row, ['audience', 'target', 'recipientType']) || '—',
          'Status': valueOf(row, ['status', 'deliveryStatus']) || (row.read === true ? 'Read' : 'Created'),
          'Created': dateText(valueOf(row, ['createdAt', 'timestamp', 'sentAt', 'publishedAt']))
        }))
      };
    }
    if (type === 'examConfig') {
      return {
        title: 'Exam Configuration & Release Settings',
        subtitle: 'Generated ' + date + ' | Total settings records: ' + rows.length,
        orientation: 'landscape',
        columns: ['Setting', 'Exam Title', 'Duration (min)', 'Total Marks', 'Passing Marks', 'Negative Marks', 'Results Published'],
        rows: rows.map((row, index) => ({
          'Setting': valueOf(row, ['_sourceCollection', 'settingName', 'id', 'key']) || 'Exam configuration ' + (index + 1),
          'Exam Title': valueOf(row, ['customExamTitle', 'examTitle', 'title']) || '—',
          'Duration (min)': valueOf(row, ['customExamDuration', 'durationMinutes']) || '—',
          'Total Marks': valueOf(row, ['customExamTotalMarks', 'totalMarks']) || '—',
          'Passing Marks': valueOf(row, ['customExamPassingMarks', 'passingMarks']) || '—',
          'Negative Marks': valueOf(row, ['customExamNegativeMarks', 'negativeMarks']) || '—',
          'Results Published': row.resultsPublished === true ? 'Yes' : 'No'
        }))
      };
    }

    const excluded = new Set([
      'id', 'uid', 'userId', 'updatedBy', 'createdBy', 'approvedBy', 'reviewedBy',
      'questionSetKey', 'question_set_key', 'question_set', 'questionSet',
      'createdAt', 'updatedAt', 'timestamp', 'metadata'
    ]);
    const candidates = [...new Set(rows.flatMap(row => Object.keys(row || {})))].filter(key =>
      !excluded.has(key) &&
      !/(^|_)(uid|user.?id|document.?id|session.?id|record.?id|token|updated.?by|created.?by|approved.?by|reviewed.?by)(_|$)/i.test(key) &&
      !/^(uid|userId|studentUid|sessionId|documentId|recordId|updatedBy|createdBy|approvedBy|reviewedBy)$/i.test(key)
    );
    const columns = candidates.filter(key => rows.some(row => row[key] !== '' && row[key] !== null && row[key] !== undefined))
      .slice(0, 10);
    const labels = columns.map(key => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    return {
      title: 'Bishnoism Owner Report — ' + type,
      subtitle: 'Generated ' + date + ' | Total records: ' + rows.length,
      orientation: 'landscape',
      columns: labels,
      rows: rows.map(row => Object.fromEntries(columns.map((key, index) => [
        labels[index],
        key === 'updatedBy' || key === 'createdBy' ? actorLabel(row) : cleanCell(row[key])
      ])))
    };
  }

  return { formatOwnerExportReport, optionText, setText };
});
