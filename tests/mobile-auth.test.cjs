const { readFileSync } = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const source = readFileSync(path.join(root, "script.js"), "utf8");
const html = readFileSync(path.join(root, "index.html"), "utf8");

function error(code) {
  return Object.assign(new Error(code), { code: "auth/" + code });
}

function harness(options = {}) {
  const dom = new JSDOM(html, { url: "https://bishnoism.test/", runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  window.BishnoiAuth = { openAuthModal() {} };
  window.BishnoiApp = { openProfileOrAuth() {} };
  window.console = Object.assign(Object.create(console), { error() {}, warn() {}, debug() {} });
  window.scrollTo = () => {};
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  window.alert = () => {};
  window.confirm = () => true;
  window.open = () => ({});
  window.html2canvas = async () => ({ toDataURL: () => "" });
  window.jspdf = { jsPDF: function jsPDF() { this.save = () => {}; } };
  window.jsPDF = window.jspdf.jsPDF;

  const documents = new Map();
  const calls = { createdEmails: [], loginEmails: [], googlePopups: 0, linkedPopup: 0, linkedCredential: 0, deleted: 0, updatedPasswords: [] };
  const authState = { currentUser: null };
  let userSequence = 0;

  function makeUser(email, providers = []) {
    const user = {
      uid: "test-user-" + (++userSequence),
      email,
      displayName: "Test Student",
      providerData: providers.map(item => ({ ...item })),
      getIdToken: async () => "test-token",
      linkWithPopup: async () => {
        calls.linkedPopup++;
        if (options.linkError) throw options.linkError;
        const googleEmail = options.googleEmail || "student@gmail.com";
        if (!user.providerData.some(item => item.providerId === "google.com")) {
          user.providerData.push({ providerId: "google.com", email: googleEmail });
        }
        return { user, additionalUserInfo: { profile: { email: googleEmail }, isNewUser: false } };
      },
      linkWithCredential: async () => {
        calls.linkedCredential++;
        if (options.credentialError) throw options.credentialError;
        if (!user.providerData.some(item => item.providerId === "password")) {
          user.providerData.push({ providerId: "password", email: user.email });
        }
        return { user };
      },
      updatePassword: async password => {
        if (options.updatePasswordError) throw options.updatePasswordError;
        calls.updatedPasswords.push(password);
      },
      delete: async () => {
        calls.deleted++;
        if (options.deleteError) throw options.deleteError;
        authState.currentUser = null;
      },
      unlink: async () => ({ user })
    };
    return user;
  }

  const authInstance = Object.assign(authState, {
    onAuthStateChanged: callback => { window.__authStateListener = callback; return () => {}; },
    signOut: async () => { authState.currentUser = null; },
    createUserWithEmailAndPassword: async (email, password) => {
      calls.createdEmails.push({ email, password });
      if (options.createError) throw options.createError;
      const user = makeUser(email, [{ providerId: "password", email }]);
      authState.currentUser = user;
      return { user };
    },
    signInWithEmailAndPassword: async (email, password) => {
      calls.loginEmails.push({ email, password });
      if (options.loginError) throw options.loginError;
      const user = options.loginUser || makeUser(email, [{ providerId: "password", email }, { providerId: "google.com", email: options.googleEmail || "student@gmail.com" }]);
      authState.currentUser = user;
      return { user };
    },
    signInWithPopup: async () => {
      calls.googlePopups++;
      if (options.googleError) throw options.googleError;
      const result = typeof options.googleResult === "function"
        ? options.googleResult(makeUser("student@gmail.com", [{ providerId: "google.com", email: "student@gmail.com" }]))
        : options.googleResult;
      const resolved = result || (() => {
        const user = makeUser("student@gmail.com", [{ providerId: "google.com", email: "student@gmail.com" }]);
        return { user, additionalUserInfo: { isNewUser: false, profile: { email: "student@gmail.com" } } };
      })();
      authState.currentUser = resolved.user;
      return resolved;
    }
  });
  const auth = Object.assign(() => authInstance, {
    GoogleAuthProvider: function GoogleAuthProvider() { this.setCustomParameters = () => {}; },
    EmailAuthProvider: { credential: (email, password) => ({ email, password, providerId: "password" }) }
  });
  function snapshot(pathKey) {
    const value = documents.get(pathKey);
    return { exists: value !== undefined, id: pathKey.split("/").pop(), data: () => value ? { ...value } : {}, docs: [], forEach() {} };
  }
  function docRef(collectionName, id) {
    const pathKey = collectionName + "/" + id;
    return {
      id,
      get: async () => snapshot(pathKey),
      set: async (data, config = {}) => {
        documents.set(pathKey, config.merge ? { ...(documents.get(pathKey) || {}), ...data } : { ...data });
      },
      update: async data => {
        if (!documents.has(pathKey)) throw new Error("missing document");
        documents.set(pathKey, { ...documents.get(pathKey), ...data });
      },
      delete: async () => { documents.delete(pathKey); },
      onSnapshot: callback => { if (callback) callback(snapshot(pathKey)); return () => {}; }
    };
  }
  function collectionRef(name) {
    const q = {
      doc: id => docRef(name, id),
      where: () => q,
      orderBy: () => q,
      limit: () => q,
      startAfter: () => q,
      get: async () => ({ docs: [], forEach() {} }),
      onSnapshot: callback => { if (callback) callback({ docs: [], forEach() {} }); return () => {}; },
      add: async data => {
        const id = "auto-" + (++userSequence);
        documents.set(name + "/" + id, { ...data });
        return { id };
      }
    };
    return q;
  }
  const firestore = () => ({
    collection: collectionRef,
    doc: pathKey => ({ get: async () => snapshot(pathKey) }),
    batch: () => ({ set() {}, update() {}, delete() {}, commit: async () => {} }),
    runTransaction: async callback => callback({ get: async () => snapshot("missing"), set() {}, update() {}, delete() {} })
  });
  const storage = () => ({ ref: () => ({ put: async () => ({}), getDownloadURL: async () => "" }) });
  window.firebase = {
    apps: [],
    initializeApp() { const app = { name: "[DEFAULT]" }; window.firebase.apps.push(app); return app; },
    app: () => window.firebase.apps[0],
    auth,
    firestore,
    storage,
    analytics: () => ({})
  };
  window.firebase.auth.GoogleAuthProvider = auth.GoogleAuthProvider;
  window.firebase.auth.EmailAuthProvider = auth.EmailAuthProvider;
  window.firebase.firestore.FieldValue = { serverTimestamp: () => ({ serverTimestamp: true }), increment: n => n, delete: () => ({}) };
  window.firebase.firestore.Timestamp = { now: () => new Date() };
  window.firebase.storage = Object.assign(storage, { TaskEvent: {} });

  window.eval(source);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  return { dom, window, documents, calls, authInstance, makeUser };
}

function enterRegistration(window, mobile = "9876543210", password = "securepass8") {
  window.BishnoiAuth.setLoginMethod("register");
  window.document.getElementById("loginName").value = "Jai Godara";
  window.document.getElementById("loginIdentifier").value = mobile;
  window.document.getElementById("loginPass").value = password;
  window.document.getElementById("registerPasswordConfirm").value = password;
}

test("mobile registration creates hidden-email account, links Google, and writes verified profile plus index", async () => {
  const h = harness();
  enterRegistration(h.window);
  await h.window.BishnoiAuth.handleAuthSubmit({ preventDefault() {} });
  assert.deepEqual(h.calls.createdEmails[0], { email: "919876543210@jambh-login.app", password: "securepass8" });
  assert.equal(h.calls.linkedPopup, 1);
  const user = h.authInstance.currentUser;
  assert.equal(h.documents.get("users/" + user.uid).mobile, "9876543210");
  assert.equal(h.documents.get("users/" + user.uid).gmailVerified, true);
  assert.equal(h.documents.get("users/" + user.uid).email, "student@gmail.com");
  assert.deepEqual(h.documents.get("mobileIndex/9876543210"), { uid: user.uid });
  h.dom.window.close();
});

test("cancelled Google popup deletes the just-created account and leaves no profile", async () => {
  const h = harness({ linkError: error("popup-closed-by-user") });
  enterRegistration(h.window);
  await h.window.BishnoiAuth.handleAuthSubmit({ preventDefault() {} });
  assert.equal(h.calls.deleted, 1);
  assert.equal(h.documents.size, 0);
  assert.match(h.window.document.getElementById("authStatus").textContent, /Google से सत्यापन ज़रूरी है/);
  assert.equal(h.window.document.getElementById("authRetryGoogleButton").classList.contains("hidden"), false);
  h.dom.window.close();
});

test("duplicate hidden email reports the duplicate mobile message", async () => {
  const h = harness({ createError: error("email-already-in-use") });
  enterRegistration(h.window);
  await h.window.BishnoiAuth.handleAuthSubmit({ preventDefault() {} });
  assert.match(h.window.document.getElementById("authStatus").textContent, /यह मोबाइल नंबर पहले से पंजीकृत है, कृपया लॉगिन करें/);
  h.dom.window.close();
});

test("mobile login uses the deterministic hidden email and does not ask for a name", async () => {
  const h = harness();
  const user = h.makeUser("919876543210@jambh-login.app", [{ providerId: "password" }, { providerId: "google.com", email: "student@gmail.com" }]);
  h.documents.set("users/" + user.uid, { mobile: "9876543210", gmailVerified: true });
  h.authInstance.signInWithEmailAndPassword = async (email, password) => {
    h.calls.loginEmails.push({ email, password });
    h.authInstance.currentUser = user;
    return { user };
  };
  h.window.BishnoiAuth.setLoginMethod("login");
  h.window.document.getElementById("loginIdentifier").value = "+91 98765 43210";
  h.window.document.getElementById("loginPass").value = "securepass8";
  await h.window.BishnoiAuth.handleAuthSubmit({ preventDefault() {} });
  assert.equal(h.calls.loginEmails[0].email, "919876543210@jambh-login.app");
  assert.equal(h.window.document.getElementById("nameRow").classList.contains("hidden"), true);
  h.dom.window.close();
});

test("Google-only login opens the optional mobile/password linking prompt", async () => {
  const h = harness();
  const user = h.makeUser("student@gmail.com", [{ providerId: "google.com", email: "student@gmail.com" }]);
  h.authInstance.signInWithPopup = async () => {
    h.calls.googlePopups++;
    h.authInstance.currentUser = user;
    return { user, additionalUserInfo: { isNewUser: false, profile: { email: "student@gmail.com" } } };
  };
  await h.window.BishnoiAuth.signInWithGoogle();
  assert.equal(h.calls.googlePopups, 1);
  assert.equal(h.window.document.getElementById("authLinkMobileView").classList.contains("hidden"), false);
  assert.equal(h.documents.get("users/" + user.uid).gmailVerified, true);
  h.dom.window.close();
});

test("forgot-password Google verification updates the existing account password", async () => {
  const h = harness();
  const user = h.makeUser("student@gmail.com", [{ providerId: "password", email: "919876543210@jambh-login.app" }, { providerId: "google.com", email: "student@gmail.com" }]);
  h.documents.set("users/" + user.uid, { mobile: "9876543210", gmailVerified: true, email: "student@gmail.com" });
  h.authInstance.signInWithPopup = async () => {
    h.calls.googlePopups++;
    h.authInstance.currentUser = user;
    return { user, additionalUserInfo: { isNewUser: false, profile: { email: "student@gmail.com" } } };
  };
  h.window.BishnoiAuth.startForgotPassword();
  await h.window.BishnoiAuth.verifyGoogleForPasswordReset();
  assert.equal(h.window.document.getElementById("authResetView").classList.contains("hidden"), false);
  h.window.document.getElementById("newPassword").value = "anotherpass9";
  h.window.document.getElementById("confirmNewPassword").value = "anotherpass9";
  await h.window.BishnoiAuth.updateForgottenPassword();
  assert.deepEqual(h.calls.updatedPasswords, ["anotherpass9"]);
  h.dom.window.close();
});

test("all inline auth click handlers resolve to public BishnoiAuth functions", () => {
  const h = harness();
  const paths = [...html.matchAll(/onclick\s*=\s*["']([^"']+)["']/gi)]
    .map(match => match[1].match(/window\.BishnoiAuth\.([A-Za-z_$][\w$]*)\s*\(/)?.[1])
    .filter(Boolean);
  assert.ok(paths.length >= 8);
  for (const method of paths) assert.equal(typeof h.window.BishnoiAuth[method], "function", method + " must resolve");
  h.dom.window.close();
});
