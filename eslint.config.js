// ESLint flat config (v9+) for vanilla JavaScript ES6+ modules
export default [
  {
    files: ["frontend/src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
      },
    },
    rules: {
      // Best practices
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off", // Allow console for debugging
      "no-debugger": "warn",
      "no-alert": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // ES6+ features
      "arrow-body-style": ["error", "as-needed"],
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      "template-curly-spacing": ["error", "never"],
      "object-shorthand": ["error", "always"],

      // Code style
      "indent": ["error", 2],
      "quotes": ["error", "single", { avoidEscape: true }],
      "semi": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      "space-before-function-paren": ["error", {
        "anonymous": "always",
        "named": "never",
        "asyncArrow": "always"
      }],
      "brace-style": ["error", "1tbs"],
      "keyword-spacing": "error",
      "space-infix-ops": "error",
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
    },
  },
];
