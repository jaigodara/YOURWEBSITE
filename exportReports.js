/* Purpose-specific, privacy-conscious export formatting for Owner Studio. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BishnoismExportReports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const text = value => value == null ? '' : String(value).trim();
  const first = (row, keys, fallback = '') => {
    for (const key of keys) {
      const value = row && row[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
  };
  const dateText = value => {
    if (!value) return '—';
    let date = value;
    if (value && typeof value.toDate === 'function') date = value.toDate();
    else if (value && typeof value.toMillis === 'function') date = new Date(value.toMillis());
    else date = new Date(value);
    return Number.isNaN(date instanceof Date ? date.getTime() : NaN)
      ? '—'
      : date.toLocaleString('hi-IN', { dateStyle: 'short', timeStyle: 'short' });
  };
  const setLabels = {
    mainExamQuestions: 'मुख्य परीक्षा',
    mockExam_1: 'मॉक परीक्षा — सेट 1',
    mockExam_2: 'मॉक परीक्षा — सेट 2',
    quiz: 'दैनिक क्विज़',
    set1: 'सेट 1', set2: 'सेट 2', set3: 'सेट 3', set4: 'सेट 4',
    '1': 'सेट 1', '2': 'सेट 2', '3': 'सेट 3', '4': 'सेट 4'
  };
  const humanSet = value => setLabels[text(value)] || (text(value) ? text(value) : 'मुख्य परीक्षा');
  const shortQuestionId = row => {
    const id = text(first(row, ['questionId', 'questionID', 'questionRef', 'id', 'docId', 'keyId']));
    return id ? '#' + id.replace(/^#/, '').slice(0, 10) : '—';
  };
  const optionLetter = row => {
    const value = first(row, ['answerIndex', 'answerindex', 'correctAnswerIndex', 'correctOptionIndex', 'answer_index', 'correctIndex', 'correctAnswer', 'correctOption'], null);
    if (value === null) return 'लंबित';
    if (typeof value === 'number' || /^\d+$/.test(text(value))) {
      const n = Number(value);
      return n >= 0 && n <= 3 ? 'विकल्प ' + 'ABCD'[n] : 'लंबित';
    }
    const normalized = text(value).toUpperCase();
    const letter = normalized.match(/^(?:OPTION\s*)?([A-D])(?:\b|$)/);
    return letter ? 'विकल्प ' + letter[1] : 'लंबित';
  };
  const actorLabel = row => {
    const named = first(row, ['updatedByName', 'modifiedByName', 'editorName', 'updatedByDisplayName', 'modifiedByDisplayName'], '');
    if (named) return text(named);
    const role = text(first(row, ['updatedByRole', 'editorRole', 'modifiedByRole'], '')).toLowerCase();
    if (role.includes('editor')) return 'सहायक संपादक';
    if (role.includes('admin') || role.includes('owner')) return 'व्यवस्थापक';
    return first(row, ['updatedBy', 'modifiedBy', 'createdBy'], '') ? 'व्यवस्थापक' : '—';
  };
  const normalizePhone = value => {
    const digits = text(value).replace(/\D/g, '');
    const phone = digits.length === 12 && digits.startsWith('91') ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits;
    return phone.length === 10 ? phone.slice(0, 2) + '••••••' + phone.slice(-2) : '—';
  };
  const statusLabel = row => {
    const value = text(first(row, ['verificationStatus', 'manualCheckStatus', 'resultStatus', 'status'], '')).toLowerCase();
    if (row && (row.isApproved === true || row.verified === true || value === 'approved' || value === 'confirmed' || value === 'verified')) return 'स्वीकृत';
    if (value.includes('evaluat') || value.includes('checked')) return 'मूल्यांकन पूर्ण';
    if (value.includes('reject')) return 'अस्वीकृत';
    if (value.includes('publish') || value.includes('pass') || value.includes('merit')) return 'प्रकाशित / उत्तीर्ण';
    if (value.includes('fail')) return 'अनुत्तीर्ण';
    return value ? value : 'समीक्षाधीन';
  };
  const numberOrDash = value => value === 0 ? '0' : (value === undefined || value === null || value === '' ? '—' : text(value));

  function formatAnswerKeys(rawRows) {
    return (Array.isArray(rawRows) ? rawRows : []).map((row, index) => ({
      'क्र. सं.': index + 1,
      'प्रश्न सेट': humanSet(first(row, ['questionSet', 'questionSetKey', 'set', 'examSet'], '')),
      'प्रश्न संदर्भ': shortQuestionId(row),
      'सही विकल्प': optionLetter(row),
      'अंतिम संशोधनकर्ता': actorLabel(row),
      'संशोधन दिनांक': dateText(first(row, ['updatedAt', 'modifiedAt', 'lastUpdatedAt', 'createdAt'], null))
    }));
  }

  function formatStudentRoster(rawRows) {
    return (Array.isArray(rawRows) ? rawRows : []).map((row, index) => ({
      'क्र. सं.': index + 1,
      'आवंटित अनुक्रमांक': text(first(row, ['rollNumber', 'roll', 'roll_number', 'admitCardRollNumber'], '')) || 'लंबित',
      'विद्यार्थी का नाम': text(first(row, ['fullName', 'displayName', 'studentName', 'name'], '')) || '—',
      'पिता / अभिभावक': text(first(row, ['fatherName', 'fathersName', 'father_name', 'guardianName'], '')) || '—',
      'मोबाइल': normalizePhone(first(row, ['mobile', 'phone', 'phoneNumber', 'mobileNumber', 'studentPhone', 'verifiedPhone'], '')),
      'प्रवेश स्थिति': statusLabel(row)
    }));
  }

  function formatExamResults(rawRows) {
    const rows = (Array.isArray(rawRows) ? rawRows : []).map(row => ({
      source: row,
      score: Number(first(row, ['checkedScore', 'score', 'marksObtained', 'marks', 'finalMarks'], NaN))
    })).sort((a, b) => {
      const av = Number.isFinite(a.score) ? a.score : -Infinity;
      const bv = Number.isFinite(b.score) ? b.score : -Infinity;
      return bv - av;
    });
    let previousScore = null;
    let previousRank = 0;
    return rows.map(({ source: row, score }, index) => {
      const rank = first(row, ['rank', 'position'], '');
      let resolvedRank = rank;
      if (resolvedRank === '' || resolvedRank === null) {
        if (Number.isFinite(score)) {
          resolvedRank = score === previousScore ? previousRank : index + 1;
          previousScore = score;
          previousRank = Number(resolvedRank);
        } else resolvedRank = '—';
      }
      const answers = first(row, ['answers', 'responses', 'selectedAnswers'], {});
      const correct = first(row, ['correctCount', 'correctAnswers', 'correct', 'rightAnswers'], undefined);
      const incorrect = first(row, ['incorrectCount', 'wrongAnswers', 'incorrect', 'wrong'], undefined);
      const totalQuestions = first(row, ['totalQuestions', 'questionCount', 'totalQuestion', 'total'], undefined);
      const violationCount = first(row, ['tabSwitches', 'violationCount', 'violationsCount', 'proctorViolations'], undefined);
      const violationLabel = Array.isArray(row.violations) ? String(row.violations.length) : numberOrDash(violationCount);
      const marks = first(row, ['checkedScore', 'score', 'marksObtained', 'marks', 'finalMarks'], undefined);
      const totalMarks = first(row, ['totalMarks', 'maxMarks', 'maximumMarks', 'total'], undefined);
      return {
        'रैंक': resolvedRank === '—' ? '—' : '#' + resolvedRank,
        'अनुक्रमांक': text(first(row, ['rollNumber', 'roll', 'roll_number'], '')) || '—',
        'परीक्षार्थी का नाम': text(first(row, ['fullName', 'name', 'displayName', 'studentName'], '')) || '—',
        'कुल प्रश्न': numberOrDash(totalQuestions ?? (answers && typeof answers === 'object' ? Object.keys(answers).length : undefined)),
        'सही उत्तर': numberOrDash(correct),
        'गलत उत्तर': numberOrDash(incorrect),
        'उल्लंघन': violationLabel,
        'प्राप्तांक': numberOrDash(marks),
        'अधिकतम अंक': numberOrDash(totalMarks),
        'परिणाम': statusLabel(row)
      };
    });
  }

  function formatRows(dataType, rawRows) {
    if (dataType === 'examAnswerKeys') return formatAnswerKeys(rawRows);
    if (dataType === 'examEnrolledStudents') return formatStudentRoster(rawRows);
    if (['publishedResults', 'mainExamSubmissions', 'mockExamSubmissions', 'quizAttempts'].includes(dataType)) return formatExamResults(rawRows);
    return (Array.isArray(rawRows) ? rawRows : []).map(row => {
      const cleaned = {};
      for (const [key, value] of Object.entries(row || {})) {
        if (['updatedBy', 'modifiedBy', 'createdBy', 'uid', 'studentUid', 'userId'].includes(key)) continue;
        if (key === 'questionSetKey') continue;
        cleaned[key] = value && typeof value === 'object' ? JSON.stringify(value) : value;
      }
      if (cleaned.questionSet === undefined && row && (row.questionSetKey || row.questionSet)) cleaned.questionSet = row.questionSet || row.questionSetKey;
      return cleaned;
    });
  }

  function reportTitle(dataType) {
    return ({
      examAnswerKeys: 'बिश्नोई डिजिटल परीक्षा परिषद — मास्टर उत्तर कुंजी',
      examEnrolledStudents: 'विद्यार्थी नामांकन एवं रोल नंबर आवंटन रजिस्टर',
      publishedResults: 'परीक्षा परिणाम एवं मूल्यांकन लेजर',
      mainExamSubmissions: 'मुख्य परीक्षा उत्तर-पत्र मूल्यांकन लेजर',
      mockExamSubmissions: 'मॉक परीक्षा उत्तर-पत्र मूल्यांकन लेजर',
      quizAttempts: 'दैनिक क्विज़ परिणाम रिपोर्ट'
    })[dataType] || ('Bishnoism — ' + text(dataType));
  }

  return { formatRows, formatAnswerKeys, formatStudentRoster, formatExamResults, reportTitle, optionLetter, normalizePhone };
});
