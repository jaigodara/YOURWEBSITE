rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner() {
      return request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/settings/adminRoles).data.ownerUids;
    }

    match /mainExamQuestions/{qId} {
      allow read: if request.auth != null;
      allow write: if isOwner();
    }

    match /mainExamSubmissions/{subId} {
      allow create: if true;
      allow read, update, delete: if isOwner();
    }
  }
}
