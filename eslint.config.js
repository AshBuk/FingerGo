// ESLint flat config (v9+) for vanilla JavaScript ES6+ modules
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      // Dependencies
      'node_modules/**',
      'vendor/**',
      // Build outputs
      'build/**',
      'dist/**',
      'gui/dist/**',
      // Wails auto-generated files (don't lint)
      'gui/src/wailsjs/**',
      'wails.json',
      // Git
      '.git/**',
      // IDE
      '.idea/**',
      '.vscode/**',
      '.cursor/**',
    ],
  },
  {
    files: ["gui/src/**/*.js"],
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
      // "curly": ["error", "all"], // Disabled - allow single-line if without braces
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // ES6+ features
      "arrow-body-style": ["error", "as-needed"],
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      "template-curly-spacing": ["error", "never"],
      "object-shorthand": ["error", "always"],

      // Code style - formatting rules disabled, Prettier handles them
      // "indent": ["error", 4], // Disabled - Prettier handles indentation
      "quotes": ["error", "single", { avoidEscape: true }],
      "semi": ["error", "always"],
      // "comma-dangle": ["error", "always-multiline"], // Disabled - Prettier handles trailing commas
      // "space-before-function-paren": ["error", {...}], // Disabled - Prettier handles spacing
      // "brace-style": ["error", "1tbs"], // Disabled - Prettier handles brace style
      "keyword-spacing": "error",
      "space-infix-ops": "error",
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
      // Merge prettier config to disable conflicting formatting rules
      ...prettierConfig.rules,
    },
  },
];
