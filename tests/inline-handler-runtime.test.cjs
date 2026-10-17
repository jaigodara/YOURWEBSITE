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
  const authState = { currentUser: null };
  const authInstance = Object.assign(authState, {
    onAuthStateChanged: callback => { window.__authStateListener = callback; return () => {}; },
    signOut: async () => { authState.currentUser = null; },
    signInWithPopup: async () => ({ user: null }),
    signInWithRedirect: async () => {},
    getRedirectResult: async () => ({ user: null })
  });
  const auth = Object.assign(() => authInstance, {
    GoogleAuthProvider: function GoogleAuthProvider() {},
    EmailAuthProvider: { credential: () => ({}) }
  });
  const emptySnapshot = () => ({ exists: false, id: "missing", data: () => ({}), docs: [], forEach: () => {} });
  const docRef = () => ({
    id: "missing", get: async () => emptySnapshot(), set: async () => {}, update: async () => {},
    delete: async () => {}, onSnapshot: callback => { if (callback) callback(emptySnapshot()); return () => {}; }
  });
  const query = () => {
    const q = {
      get: async () => emptySnapshot(),
      onSnapshot: callback => { if (callback) callback(emptySnapshot()); return () => {}; },
      where: () => q, orderBy: () => q, limit: () => q, startAfter: () => q,
      doc: () => docRef(), add: async () => ({ id: "new-doc" })
    };
    return q;
  };
  const firestore = () => ({
    collection: () => query(), doc: () => docRef(),
    batch: () => ({ set: () => {}, update: () => {}, delete: () => {}, commit: async () => {} }),
    runTransaction: async callback => callback({ get: async () => emptySnapshot(), set: () => {}, update: () => {}, delete: () => {} })
  });
  const storage = () => ({ ref: () => ({ put: async () => ({}), getDownloadURL: async () => "" }) });
  window.__firebaseInitializeCalls = 0;
  window.firebase = {
    apps: [],
    initializeApp: () => {
      window.__firebaseInitializeCalls += 1;
      const app = { name: "[DEFAULT]" };
      window.firebase.apps.push(app);
      return app;
    },
    app: () => window.firebase.apps[0],
    auth,
    firestore,
    storage,
    analytics: () => ({})
  };
  window.firebase.auth.GoogleAuthProvider = auth.GoogleAuthProvider;
  window.firebase.firestore.FieldValue = { serverTimestamp: () => ({}), increment: n => n, delete: () => ({}) };
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

test("early auth placeholders are safe before Firebase initialization", () => {
  const dom = makeDom();
  const { window } = dom;
  window.BishnoiAuth = {};
  window.BishnoiApp = {};
  window.firebase.apps.length = 0;
  const mainStartup = script.indexOf("\ntry {\n(() => {");
  assert.ok(mainStartup > 0, "early placeholder block should precede main startup");
  window.eval(script.slice(0, mainStartup));
  assert.equal(window.firebase.apps.length, 0, "early handlers must not initialize Firebase");
  assert.doesNotThrow(() => window.BishnoiApp.openProfileOrAuth());
  assert.doesNotThrow(() => window.BishnoiAuth.openAuthModal());
  assert.doesNotThrow(() => window.BishnoiAuth.signInWithGoogle());
  assert.equal(window.document.getElementById("authModal").classList.contains("hidden"), false, "auth modal should be visibly opened");
  dom.window.close();
});

test("full startup initializes Firebase once and publishes real auth/profile APIs without runtime reference/type errors", () => {
  const dom = makeDom();
  const { window } = dom;
  const errors = [];
  window.addEventListener("error", event => errors.push(event.error?.stack || event.message || "unknown window error"));
  Object.defineProperty(window.document, "readyState", { configurable: true, value: "complete" });
  const evalReadyState = window.document.readyState;
  window.console = Object.assign(Object.create(console), {
    error: (...args) => errors.push(args.map(value => value instanceof Error ? (value.stack || value.name + ": " + value.message) : String(value)).join(" "))
  });
  let diagnosticScript = script.replace("try {\n(() => {\n  const CONFIG", "try {\n(() => {\n  window.__mainIifeEntered = true;\n  const CONFIG");
  diagnosticScript = diagnosticScript.replace("  function initPortal() {", "  window.__beforeInitPortalDefinition = true;\n  function initPortal() { window.__initPortalRan = true;");
  diagnosticScript = diagnosticScript.replace("  // script.js is loaded after the page markup in index.html. Start now so", "  window.__beforeStartupCall = true;\n  // script.js is loaded after the page markup in index.html. Start now so");
  diagnosticScript = diagnosticScript.replace("  initPortal();", "  window.__bottomReached = true;\n  initPortal();");
  const sourceLines = diagnosticScript.split("\n");
  for (let lineIndex = sourceLines.length - 1; lineIndex >= 0; lineIndex--) {
    if (/^  (?:async )?function [A-Za-z_$][\w$]*\s*\(/.test(sourceLines[lineIndex])) {
      sourceLines.splice(lineIndex, 0, "  window.__lastFunctionCheckpoint = " + (lineIndex + 1) + ";");
    }
  }
  diagnosticScript = sourceLines.join("\n");

  diagnosticScript = diagnosticScript.replace("console.error('मुख्य पेज आरंभ नहीं हो सका:', error);", "window.__outerStartupError = error.stack || error.message || String(error);\n  console.error('मुख्य पेज आरंभ नहीं हो सका:', error);");
  console.log("T6 instrumentationApplied", diagnosticScript.includes("function initPortal() { window.__initPortalRan = true;"), diagnosticScript.includes("window.__bottomReached = true;"));
  window.eval(diagnosticScript);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  console.log("T6 DIAGNOSTICS", JSON.stringify({
    counterProperty: "__firebaseInitializeCalls",
    counterValue: window.__firebaseInitializeCalls,
    ready: window.__bishnoiReady,
    firebaseAppsLength: window.firebase.apps.length,
    consoleErrors: errors,
    signInWithGoogleType: typeof window.BishnoiAuth.signInWithGoogle,
    openProfileOrAuthType: typeof window.BishnoiApp.openProfileOrAuth,
    readyStateAtScriptEvaluation: evalReadyState,
    initPortalRan: window.__initPortalRan,
    mainIifeEntered: window.__mainIifeEntered,
    beforeInitPortalDefinition: window.__beforeInitPortalDefinition,
    beforeStartupCall: window.__beforeStartupCall,
    beforeInitPortalDefinition: window.__beforeInitPortalDefinition,
    beforeStartupCall: window.__beforeStartupCall,
    bottomReached: window.__bottomReached,
    lastFunctionCheckpoint: window.__lastFunctionCheckpoint,
    outerStartupError: window.__outerStartupError || null,
    profileHandlerName: window.BishnoiApp.openProfileOrAuth.name,
    googleHandlerName: window.BishnoiAuth.signInWithGoogle.name
  }, null, 2));
  assert.equal(window.__firebaseInitializeCalls, 1, "initializeApp should run exactly once; startup console errors: " + errors.join("\\n"));
  assert.equal(window.__bishnoiReady, true);
  assert.equal(typeof window.BishnoiApp.openProfileOrAuth, "function");
  assert.equal(typeof window.BishnoiAuth.signInWithGoogle, "function");
  assert.doesNotMatch(window.BishnoiApp.openProfileOrAuth.name, /earlyProfilePlaceholder/);
  assert.doesNotMatch(window.BishnoiAuth.signInWithGoogle.name, /earlyGoogleSignInPlaceholder/);
  assert.equal(errors.some(message => message.includes("आरंभ नहीं हो सका")), false, errors.join("\n"));
  assert.equal(errors.some(message => /ReferenceError|TypeError/.test(message)), false, errors.join("\\n"));
  dom.window.close();
});

test("script.js assigns window.switchTab exactly once", () => {
  assert.equal((script.match(/window\.switchTab\s*=/g) || []).length, 1);
});

test("inline handler paths in index.html and owner-studio.html resolve after runtime initialization", () => {
  const dom = makeDom();
  const { window } = dom;
  const authObjectBefore = window.BishnoiAuth;
  const appObjectBefore = window.BishnoiApp;
  const earlyAuth = authObjectBefore.openAuthModal;
  const earlyProfile = appObjectBefore.openProfileOrAuth;
  Object.defineProperty(window.document, "readyState", { configurable: true, value: "complete" });
  const startupErrors = [];
  window.addEventListener("error", event => startupErrors.push(event.error?.stack || event.message || "unknown window error"));
  window.console = Object.assign(Object.create(console), {
    error: (...args) => startupErrors.push(args.map(value => value instanceof Error ? (value.stack || value.name + ": " + value.message) : String(value)).join(" "))
  });
  let diagnosticScript = script.replace("try {\n(() => {\n  const CONFIG", "try {\n(() => {\n  window.__mainIifeEntered = true;\n  const CONFIG");
  diagnosticScript = diagnosticScript.replace("function initPortal() {", "function initPortal() { window.__initPortalRan = true;");
  diagnosticScript = diagnosticScript.replace("  initPortal();", "  window.__bottomReached = true;\n  initPortal();");
  diagnosticScript = diagnosticScript.replace("} catch (error) {\n  console.error('मुख्य पेज आरंभ नहीं हो सका:', error);", "} catch (error) {\n  window.__outerStartupError = error.stack || error.message || String(error);\n  console.error('मुख्य पेज आरंभ नहीं हो सका:', error);");
  window.eval(diagnosticScript);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  // Owner-only inline scripts also publish owner handlers; evaluate those scripts without loading remote SDKs.
  const ownerDom = new JSDOM(ownerHtml, { url: "https://bishnoism.test/owner-studio.html", runScripts: "outside-only" });
  makeFirebaseStub(ownerDom.window);
  ownerDom.window.alert = () => {};
  ownerDom.window.confirm = () => true;
  ownerDom.window.open = () => ({});
  for (const inline of [...ownerDom.window.document.querySelectorAll("script:not([src])")]) {
    ownerDom.window.eval(inline.textContent);
  }
  const pathsByWindow = [
    ...calledPaths(indexHtml).map(expression => ({ expression, target: window })),
    ...calledPaths(ownerHtml).map(expression => ({ expression, target: ownerDom.window }))
  ];
  const unresolved = pathsByWindow.filter(item => typeof resolvePath(item.target, item.expression) !== "function").map(item => item.expression);
  console.log("T8 DIAGNOSTICS", JSON.stringify({
    firstStartupError: startupErrors[0] || null,
    allStartupErrors: startupErrors,
    initPortalRan: window.__initPortalRan,
    mainIifeEntered: window.__mainIifeEntered,
    bottomReached: window.__bottomReached,
    outerStartupError: window.__outerStartupError || null,
    firebaseInitializeCalls: window.__firebaseInitializeCalls,
    firebaseAppsLength: window.firebase.apps.length,
    unresolvedPaths: unresolved
  }, null, 2));
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
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
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
