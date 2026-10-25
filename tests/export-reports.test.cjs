const test = require('node:test');
const assert = require('node:assert/strict');
const reports = require('../exportReports.js');

test('answer key export contains only purpose-specific columns and maps numeric index to option letter', () => {
  const rows = reports.formatRows('examAnswerKeys', [{
    id: 'Ahn70cYYSECRET',
    questionSet: 'mainExamQuestions',
    questionSetKey: 'mainExamQuestions',
    answerindex: 1,
    updatedBy: 'rdP0ZXzSP9fGzmJshEVvbOfb31g2',
    updatedAt: '2026-10-17T13:16:00Z',
    rollNumber: '',
    fullName: ''
  }]);
  assert.deepEqual(Object.keys(rows[0]), ['क्र. सं.', 'प्रश्न सेट', 'प्रश्न संदर्भ', 'सही विकल्प', 'अंतिम संशोधनकर्ता', 'संशोधन दिनांक']);
  assert.equal(rows[0]['सही विकल्प'], 'विकल्प B');
  assert.equal(rows[0]['प्रश्न संदर्भ'], '#Ahn70cYYSE');
  assert.equal(rows[0]['अंतिम संशोधनकर्ता'], 'व्यवस्थापक');
  assert.equal(JSON.stringify(rows[0]).includes('rdP0ZXzSP9f'), false);
  assert.equal(JSON.stringify(rows[0]).includes('Full Name'), false);
});

test('answer key formatter maps A-D and keeps missing answers pending', () => {
  const rows = reports.formatAnswerKeys([
    { id: 'q1', answerIndex: 0 },
    { id: 'q2', answerIndex: 3 },
    { id: 'q3' }
  ]);
  assert.equal(rows[0]['सही विकल्प'], 'विकल्प A');
  assert.equal(rows[1]['सही विकल्प'], 'विकल्प D');
  assert.equal(rows[2]['सही विकल्प'], 'लंबित');
});

test('student roster export uses roster fields, masks mobile and translates approval status', () => {
  const [row] = reports.formatRows('examEnrolledStudents', [{
    'Roll Number': 'JAMBH-2026-0001',
    'Full Name': 'Test Student',
    "Father's Name": 'Parent Name',
    'Phone Number': '9812012345',
    Status: 'approved',
    uid: 'internal-user-id'
  }]);
  assert.equal(row['आवंटित अनुक्रमांक'], 'JAMBH-2026-0001');
  assert.equal(row['विद्यार्थी का नाम'], 'Test Student');
  assert.equal(row['पिता / अभिभावक'], 'Parent Name');
  assert.equal(row['मोबाइल'], '98••••••45');
  assert.equal(row['प्रवेश स्थिति'], 'स्वीकृत');
  assert.equal(JSON.stringify(row).includes('internal-user-id'), false);
});

test('exam result export has score and violation columns without raw UID', () => {
  const [row] = reports.formatRows('publishedResults', [{
    rollNumber: 'JAMBH-2026-0042',
    fullName: 'Candidate',
    totalQuestions: 100,
    correctCount: 96,
    incorrectCount: 4,
    tabSwitches: 1,
    score: 95,
    totalMarks: 100,
    status: 'published',
    studentUid: 'internal-user-id'
  }]);
  assert.equal(row['प्राप्तांक'], '95');
  assert.equal(row['सही उत्तर'], '96');
  assert.equal(row['गलत उत्तर'], '4');
  assert.equal(row['उल्लंघन'], '1');
  assert.equal(row['अनुक्रमांक'], 'JAMBH-2026-0042');
  assert.equal(JSON.stringify(row).includes('internal-user-id'), false);
});
