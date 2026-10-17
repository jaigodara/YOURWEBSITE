const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/**", "tailwind.generated.css", "tests/**"],
  },
  {
    files: ["script.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: { ...globals.browser, ...globals.node, firebase: "readonly", jspdf: "readonly", html2canvas: "readonly", confetti: "readonly", window: "readonly", document: "readonly" },
    },
    rules: {
      "no-undef": "error",
      "no-constant-condition": "error",
      "no-unreachable": "error",
      "valid-typeof": "error",
    },
  },
];
