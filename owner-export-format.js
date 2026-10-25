(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BishnoiExportFormatter = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const LETTERS = ['A', 'B', 'C', 'D'];
  const SET_NAMES = {
    mainExamQuestions: 'Main Exam',
    mockExam_1: 'Mock Exam 1',
    mockExam_2: 'Mock Exam 2',
    quiz: 'Daily Quiz',
    mainExamSubmissions: 'Main Exam',
    mockExamSubmissions: 'Mock Exam'
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
    if (value === '' || value == null) return 'Pending';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^[A-D]$/i.test(trimmed)) return 'Option ' + trimmed.toUpperCase();
      if (/^[0-3]$/.test(trimmed)) return 'Option ' + LETTERS[Number(trimmed)];
      if (/^[1-4]$/.test(trimmed)) return 'Option ' + LETTERS[Number(trimmed) - 1];
      return trimmed;
    }
    if (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 3) {
      return 'Option ' + LETTERS[Number(value)];
    }
    return String(value);
  };
  const setText = (row, fallback) => {
    const source = String(row && row._sourceCollection || fallback || '').trim();
    const raw = String(valueOf(row, ['questionSet', 'questionSetKey', 'set', 'setName']) || '').trim();
    if (source && SET_NAMES[source]) {
      const sourceName = SET_NAMES[source];
      const suffix = raw && !new RegExp(sourceName, 'i').test(raw) ? ' — ' + raw.replace(/^set[\s_-]*/i, 'Set ') : '';
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
  const roll = row => valueOf(row, ['rollNumber', 'roll_number', 'roll', 'admitCardRollNumber']) || 'Pending';

  function formatOwnerExportReport(dataType, rawRows) {
    const rows = Array.isArray(rawRows) ? rawRows : [];
    const type = String(dataType || '');
    const date = new Date().toLocaleDateString('en-IN');
    if (type === 'examAnswerKeys') {
      return {
        title: 'Bishnoism Digital Exam Council — Master Answer Key',
        subtitle: 'Generated ' + date + ' | Total questions: ' + rows.length,
        orientation: 'landscape',
        columns: ['No.', 'Exam / Set', 'Question Ref.', 'Correct Option', 'Last Edited By', 'Last Edited'],
        rows: rows.map((row, index) => ({
          'No.': index + 1,
          'Exam / Set': setText(row),
          'Question Ref.': 'Q-' + String(index + 1).padStart(3, '0'),
          'Correct Option': optionText(valueOf(row, ['answerIndex', 'answerindex', 'correctAnswer', 'correctOptionIndex', 'ans', 'answer'])),
          'Last Edited By': actorLabel(row),
          'Last Edited': dateText(valueOf(row, ['updatedAt', 'updated_at', 'modifiedAt']))
        }))
      };
    }
    if (type === 'examEnrolledStudents' || type === 'studentRollNumbers' || type === 'admitCards') {
      const formatted = rows.map(row => ({
        'Roll Number': roll(row),
        'Student Name': valueOf(row, ['fullName', 'displayName', 'studentName', 'name']) || '—',
        'Father / Guardian': valueOf(row, ['fatherName', 'fathersName', 'father_name', 'guardianName']) || '—',
        'Mobile': valueOf(row, ['phoneNumber', 'phone', 'mobileNumber', 'mobile']) || '—',
        'Admission Status': (row.isApproved === true || row.approved === true || Boolean(valueOf(row, ['rollNumber', 'roll_number', 'admitCardRollNumber']))) ? 'Approved' : 'Pending review'
      }));
      return {
        title: 'Student Enrollment & Roll Number Register',
        subtitle: 'Session 2026 | Generated ' + date + ' | Total records: ' + rows.length,
        orientation: 'landscape',
        columns: ['Roll Number', 'Student Name', 'Father / Guardian', 'Mobile', 'Admission Status'],
        rows: formatted
      };
    }
    if (['mainExamSubmissions', 'mockExamSubmissions', 'quizAttempts', 'publishedResults', 'reviews'].includes(type)) {
      const formatted = rows.map(row => ({
        'Rank': valueOf(row, ['rank', 'meritRank']) || '—',
        'Roll Number': roll(row),
        'Student Name': valueOf(row, ['fullName', 'displayName', 'studentName', 'name']) || '—',
        'Total Questions': valueOf(row, ['totalQuestions', 'questionCount', 'total']) || '—',
        'Correct': valueOf(row, ['correctCount', 'correctAnswers', 'correct']) || 0,
        'Incorrect': valueOf(row, ['wrongCount', 'incorrectCount', 'wrongAnswers', 'incorrect']) || 0,
        'Violations': valueOf(row, ['violationCount', 'violationsCount', 'tabSwitchCount', 'liveViolationCount']) || 0,
        'Marks': valueOf(row, ['finalMarks', 'totalMarks', 'score', 'marks', 'obtainedMarks']) || 0,
        'Time Taken': valueOf(row, ['timeTakenText', 'timeTaken', 'durationText', 'durationMinutes']) || '—',
        'Result': valueOf(row, ['resultStatus', 'result', 'status']) || 'Pending'
      }));
      return {
        title: type === 'publishedResults' ? 'Published Exam Results & Merit Ledger' : 'Exam Submission & Evaluation Ledger',
        subtitle: 'Generated ' + date + ' | Total candidates: ' + rows.length,
        orientation: 'landscape',
        columns: ['Rank', 'Roll Number', 'Student Name', 'Total Questions', 'Correct', 'Incorrect', 'Violations', 'Marks', 'Time Taken', 'Result'],
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
    const candidates = [...new Set(rows.flatMap(row => Object.keys(row || {})))].filter(key => !excluded.has(key));
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
