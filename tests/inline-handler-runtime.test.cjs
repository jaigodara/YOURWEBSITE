const { readFileSync } = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const script = readFileSync(path.join(root, "script.js"), "utf8");
const indexHtml = readFileSync(path.join(root, "index.html"), "utf8");
const ownerHtml = readFileSync(path.join(root, "owner-studio.html"), "utf8");

function makeFirebaseStub(window) {
  const auth = Object.assign(() => ({ currentUser: null, onAuthStateChanged: () => () => {}, signOut: async () => {} }), {
    GoogleAuthProvider: function GoogleAuthProvider() {},
    EmailAuthProvider: { credential: () => ({}) }
  });
  const firestore = () => ({
    collection: () => ({ doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }), set: async () => {}, update: async () => {}, onSnapshot: () => () => {} }), where: () => ({ get: async () => ({ docs: [] }) }), get: async () => ({ docs: [] }) }),
    doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }), set: async () => {}, update: async () => {}, onSnapshot: () => () => {} }),
    runTransaction: async callback => callback({ get: async () => ({ exists: false, data: () => ({}) }), set: () => {}, update: () => {} })
  });
  const storage = () => ({ ref: () => ({ put: async () => ({}), getDownloadURL: async () => "" }) });
  window.firebase = {
    apps: [],
    initializeApp: () => { const app = { name: "[DEFAULT]" }; window.firebase.apps.push(app); return app; },
    app: () => window.firebase.apps[0],
    auth,
    firestore,
    storage,
    analytics: () => ({})
  };
  window.firebase.auth.GoogleAuthProvider = auth.GoogleAuthProvider;
  window.firebase.firestore.FieldValue = { serverTimestamp: () => ({}), increment: n => n };
  window.firebase.firestore.Timestamp = { now: () => new Date() };
  window.firebase.storage = Object.assign(storage, { TaskEvent: {} });
}

function makeDom() {
  const dom = new JSDOM(indexHtml, {
    url: "https://bishnoism.test/",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  window.BishnoiAuth = { openAuthModal: function earlyAuthPlaceholder() {} };
  window.BishnoiApp = { openProfileOrAuth: function earlyProfilePlaceholder() {} };
  window.console = console;
  window.scrollTo = () => {};
  window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
  window.alert = () => {};
  window.confirm = () => true;
  window.open = () => ({});
  window.html2canvas = async () => ({ toDataURL: () => "" });
  window.jspdf = { jsPDF: function jsPDF() { this.save = () => {}; } };
  window.jsPDF = window.jspdf.jsPDF;
  makeFirebaseStub(window);
  return dom;
}

function calledPaths(html) {
  const paths = new Set();
  for (const [, source] of html.matchAll(/onclick\s*=\s*["']([^"']+)["']/gi)) {
    const match = source.match(/((?:window\.)?[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(/);
    if (match) paths.add(match[1]);
  }
  return [...paths];
}

function resolvePath(window, expression) {
  const parts = expression.replace(/^window\./, "").split(".");
  let value = window;
  for (const part of parts) {
    if (value == null) return undefined;
    value = value[part];
  }
  return value;
}

test("script.js assigns window.switchTab exactly once", () => {
  assert.equal((script.match(/window\.switchTab\s*=/g) || []).length, 1);
});

test("profile/auth handlers are safe when Firebase has no initialized app", () => {
  const dom = makeDom();
  const { window } = dom;
  window.BishnoiAuth = {};
  window.BishnoiApp = {};
  window.firebase.apps.length = 0;
  const mainStartup = script.indexOf("\ntry {\n(() => {");
  assert.ok(mainStartup > 0, "early placeholder block should precede main startup");
  window.eval(script.slice(0, mainStartup));
  assert.equal(window.firebase.apps.length, 0, "the early block must not initialize Firebase");
  assert.doesNotThrow(() => window.BishnoiApp.openProfileOrAuth());
  assert.doesNotThrow(() => window.BishnoiAuth.openAuthModal());
  const auth = window.document.getElementById("authModal");
  const toast = window.document.getElementById("earlyHindiToast");
  assert.ok((auth && !auth.hidden) || (toast && !toast.hidden),
    "expected auth modal or Hindi loading toast");
  dom.window.close();
});

test("Firebase startup publishes readiness and replaces the profile placeholder", () => {
  const dom = makeDom();
  const { window } = dom;
  window.BishnoiAuth = {};
  window.BishnoiApp = {};
  const placeholder = function earlyProfilePlaceholder() {};
  window.BishnoiApp.openProfileOrAuth = placeholder;
  window.eval(script);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  assert.ok(window.firebase.apps.length > 0, "Firebase app should be initialized");
  assert.equal(window.__bishnoiReady, true);
  assert.notEqual(window.BishnoiApp.openProfileOrAuth, placeholder);
  dom.window.close();
});

test("inline handler paths in index.html and owner-studio.html resolve after runtime initialization", () => {
  const dom = makeDom();
  const { window } = dom;
  const authObjectBefore = window.BishnoiAuth;
  const appObjectBefore = window.BishnoiApp;
  const earlyAuth = authObjectBefore.openAuthModal;
  const earlyProfile = appObjectBefore.openProfileOrAuth;
  window.eval(script);
  // Owner-only inline scripts also publish owner handlers; evaluate those scripts without loading remote SDKs.
  const ownerDom = new JSDOM(ownerHtml, { url: "https://bishnoism.test/owner-studio.html", runScripts: "outside-only" });
  makeFirebaseStub(ownerDom.window);
  for (const inline of [...ownerDom.window.document.querySelectorAll("script:not([src])")]) {
    ownerDom.window.eval(inline.textContent);
  }
  const pathsByWindow = [
    ...calledPaths(indexHtml).map(expression => ({ expression, target: window })),
    ...calledPaths(ownerHtml).map(expression => ({ expression, target: ownerDom.window }))
  ];
  const unresolved = pathsByWindow.filter(item => typeof resolvePath(item.target, item.expression) !== "function").map(item => item.expression);
  assert.deepEqual(unresolved, [], "unresolved inline onclick paths: " + unresolved.join(", "));
  assert.equal(window.BishnoiAuth, authObjectBefore, "BishnoiAuth object identity must be preserved");
  assert.equal(window.BishnoiApp, appObjectBefore, "BishnoiApp object identity must be preserved");
  assert.notEqual(window.BishnoiAuth.openAuthModal, earlyAuth, "real auth implementation must replace the placeholder");
  assert.notEqual(window.BishnoiApp.openProfileOrAuth, earlyProfile, "real profile implementation must replace the placeholder");
  dom.window.close();
  ownerDom.window.close();
});

test("auth/profile handlers and all five navigation tabs run without throwing and reveal their targets", () => {
  const dom = makeDom();
  const { window } = dom;
  window.BishnoiAuth = { openAuthModal: function earlyAuthPlaceholder() {} };
  window.BishnoiApp = { openProfileOrAuth: function earlyProfilePlaceholder() {} };
  const authObject = window.BishnoiAuth;
  const appObject = window.BishnoiApp;
  const earlyAuth = authObject.openAuthModal;
  const earlyProfile = appObject.openProfileOrAuth;
  window.eval(script);
  assert.notEqual(authObject.openAuthModal, earlyAuth);
  assert.notEqual(appObject.openProfileOrAuth, earlyProfile);
  assert.equal(typeof authObject.openAuthModal, "function");
  assert.equal(typeof appObject.openProfileOrAuth, "function");
  assert.doesNotThrow(() => authObject.openAuthModal());
  assert.equal(window.document.getElementById("authModal").hidden, false);
  assert.doesNotThrow(() => appObject.openProfileOrAuth());
  assert.equal(window.document.getElementById("authModal").hidden, false);
  for (const tab of ["home", "sahitya", "pariksha", "community", "profile"]) {
    assert.doesNotThrow(() => window.switchTab(tab), tab);
    const expected = tab === "sahitya" ? ["tab-sahitya", "tab-library"] :
      tab === "pariksha" ? ["tab-pariksha", "tab-quiz"] : ["tab-" + tab];
    assert.ok(expected.some(id => {
      const panel = window.document.getElementById(id);
      return panel && !panel.hidden;
    }), "expected visible panel for tab " + tab);
  }
  assert.equal(window.BishnoiAuth, authObject);
  assert.equal(window.BishnoiApp, appObject);
  dom.window.close();
});
