// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Application-wide constants
 * Languages are loaded from Go internal layer (single source of truth)
 */
(() => {
    // Internal storage for language data (keyed by language key)
    let languageMap = {};
    let loaded = false;

    window.SupportedLanguages = {
        /**
         * Load languages from internal layer (called on app init)
         * @returns {Promise<boolean>} true if loaded successfully
         */
        async load() {
            if (!window.go?.app?.App?.SupportedLanguages) {
                console.error('SupportedLanguages: internal layer not available');
                return false;
            }
            try {
                const languages = await window.go.app.App.SupportedLanguages();
                languageMap = {};
                languages.forEach(lang => {
                    languageMap[lang.key] = { icon: lang.icon, label: lang.label };
                });
                loaded = true;
                return true;
            } catch (err) {
                console.error('SupportedLanguages: failed to load from internal layer:', err);
                return false;
            }
        },

        /**
         * Check if languages are loaded
         * @returns {boolean}
         */
        isLoaded() {
            return loaded;
        },

        /**
         * Get language icon by key
         * @param {string} lang - Language key
         * @returns {string} Icon emoji
         */
        getIcon(lang) {
            return languageMap[lang]?.icon || '📄';
        },

        /**
         * Get language label by key
         * @param {string} lang - Language key
         * @returns {string} Display label
         */
        getLabel(lang) {
            return languageMap[lang]?.label || lang || 'Text';
        },

        /**
         * Validate and sanitize language input
         * @param {string} input - User input
         * @returns {string} Valid language key (defaults to 'text')
         */
        sanitize(input) {
            if (!input) return 'text';
            const normalized = input.toLowerCase().trim();
            return languageMap[normalized] ? normalized : 'text';
        },

        /**
         * Get all language keys
         * @returns {string[]} Array of language keys
         */
        keys() {
            return Object.keys(languageMap);
        },
    };
})();
