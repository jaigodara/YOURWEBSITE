const assert = require('node:assert/strict');
const { test } = require('node:test');
const { formatOwnerExportReport } = require('../owner-export-format.js');

test('answer key report uses purpose-specific columns and human-readable option letters', () => {
  const report = formatOwnerExportReport('examAnswerKeys', [{
    id: 'rdP0ZXzSP9fGzm-private-document-id',
    answerIndex: 1,
    questionSet: 'set1',
    _sourceCollection: 'mainExamQuestions',
    updatedBy: 'private-firebase-uid',
    updatedAt: '2026-10-20T14:48:00.000Z',
    rollNumber: '',
    fullName: '',
    fatherName: '',
    mobile: ''
  }]);
  assert.deepEqual(report.columns, ['क्र. सं.', 'प्रश्न सेट', 'प्रश्न संदर्भ', 'सही विकल्प', 'अंतिम संशोधनकर्ता', 'संशोधन दिनांक']);
  assert.equal(report.rows[0]['प्रश्न सेट'], 'मुख्य परीक्षा — Set 1');
  assert.equal(report.rows[0]['सही विकल्प'], 'विकल्प B');
  assert.equal(report.rows[0]['प्रश्न संदर्भ'], '#rdP0ZXzS');
  assert.equal(report.rows[0]['अंतिम संशोधनकर्ता'], 'व्यवस्थापक / संपादक');
  assert.equal(JSON.stringify(report).includes('private-firebase-uid'), false);
  assert.equal(JSON.stringify(report).includes('rdP0ZXzSP9fGzm'), false);
  assert.equal(Object.keys(report.rows[0]).some(key => /अनुक्रमांक|नाम|पिता|मोबाइल/.test(key)), false);
});

test('student roster report only includes enrollment fields and approval status', () => {
  const report = formatOwnerExportReport('examEnrolledStudents', [
    { rollNumber: 'JAMBH-2026-0001', fullName: 'Student One', fatherName: 'Guardian One', mobile: '9812000000', isApproved: true, uid: 'private-uid' },
    { fullName: 'Student Two', fatherName: 'Guardian Two', mobile: '9812000001', isApproved: false }
  ]);
  assert.deepEqual(report.columns, ['आवंटित अनुक्रमांक', 'विद्यार्थी का नाम', 'पिता / अभिभावक', 'मोबाइल', 'प्रवेश स्थिति']);
  assert.equal(report.rows[0]['आवंटित अनुक्रमांक'], 'JAMBH-2026-0001');
  assert.equal(report.rows[0]['प्रवेश स्थिति'], 'स्वीकृत');
  assert.equal(report.rows[1]['आवंटित अनुक्रमांक'], 'लंबित');
  assert.equal(report.rows[1]['प्रवेश स्थिति'], 'समीक्षाधीन');
  assert.equal(JSON.stringify(report).includes('private-uid'), false);
});

test('exam result report exposes score and violations without raw database identifiers', () => {
  const report = formatOwnerExportReport('publishedResults', [{
    id: 'random-doc-id',
    rollNumber: 'JAMBH-2026-0042',
    studentName: 'Student Name',
    totalQuestions: 100,
    correctCount: 96,
    wrongCount: 4,
    violationCount: 1,
    score: 95,
    totalMarks: 100,
    resultStatus: 'Pass',
    updatedBy: 'private-uid'
  }]);
  assert.ok(report.columns.includes('प्राप्तांक'));
  assert.ok(report.columns.includes('उल्लंघन'));
  assert.equal(report.rows[0]['प्राप्तांक'], 95);
  assert.equal(report.rows[0]['उल्लंघन'], 1);
  assert.equal(JSON.stringify(report).includes('random-doc-id'), false);
  assert.equal(JSON.stringify(report).includes('private-uid'), false);
});

test('Owner Studio loads the formatter and renders paginated branded PDF pages', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const ownerHtml = fs.readFileSync(path.join(__dirname, '..', 'owner-studio.html'), 'utf8');
  assert.ok(ownerHtml.includes('<script src="./owner-export-format.js"></script>'));
  assert.ok(ownerHtml.includes('window.html2canvas'));
  assert.ok(ownerHtml.includes('OFFICIAL REPORT'));
  assert.ok(ownerHtml.includes('Page '));
  assert.ok(ownerHtml.includes("const formatter = window.BishnoiExportFormatter"));
  assert.ok(!ownerHtml.includes('function uploadIndividualAdmitCardPdf'), 'manual admit-card PDF upload handler should be removed');
  assert.ok(!ownerHtml.includes('id="individualAdmitCardPdf"'), 'manual admit-card file input should not return');
});


test('violation log export is purpose-specific and does not expose raw user IDs', () => {
  const report = formatOwnerExportReport('live_violations', [{
    id: 'private-doc-id',
    uid: 'private-uid',
    occurredAtMs: 1792900000000,
    rollNumber: 'JAMBH-2026-0004',
    violationType: 'tab-switch',
    strike: 2,
    action: 'auto-submit'
  }]);
  assert.deepEqual(report.columns, ['Time', 'Roll Number', 'Student Name', 'Exam', 'Violation', 'Strike', 'Action']);
  assert.equal(report.rows[0]['Roll Number'], 'JAMBH-2026-0004');
  assert.equal(report.rows[0].Violation, 'tab-switch');
  assert.equal(JSON.stringify(report).includes('private-uid'), false);
  assert.equal(JSON.stringify(report).includes('private-doc-id'), false);
});

test('assistant editor export shows permissions instead of Firebase identifiers', () => {
  const report = formatOwnerExportReport('assistantEditors', [{
    id: 'private-doc-id',
    uid: 'private-uid',
    fullName: 'Editor One',
    phoneNumber: '9812000000',
    canCheckAnswers: true,
    canPublishMedia: false,
    active: true
  }]);
  assert.deepEqual(report.columns, ['Name', 'Mobile', 'Email', 'Role', 'Permissions', 'Status']);
  assert.equal(report.rows[0].Permissions, 'Check answers');
  assert.equal(report.rows[0].Status, 'Active');
  assert.equal(JSON.stringify(report).includes('private-uid'), false);
});

test('custom exam configuration validates and exposes the saved grading fields in settings UI', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const ownerHtml = fs.readFileSync(path.join(__dirname, '..', 'owner-studio.html'), 'utf8');
  for (const id of ['ownerCustomExamTitle', 'ownerCustomExamDuration', 'ownerCustomExamTotalMarks', 'ownerCustomExamPassingMarks', 'ownerCustomExamNegativeMarks']) {
    assert.ok(ownerHtml.includes('id="' + id + '"'), 'missing custom exam field ' + id);
  }
  assert.ok(ownerHtml.includes('customExamNegativeMarks: customNegativeMarks'));
  assert.ok(ownerHtml.includes('customPassingMarks > customTotalMarks'));
});
