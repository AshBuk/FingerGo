// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Settings Manager
 * Manages application preferences: theme, zen mode, UI visibility
 * Persists settings to internal layer via Wails bridge
 */
(() => {
    let currentTheme = 'dark';
    let isZenMode = false;
    let isKeyboardVisible = true;
    let isStatsBarVisible = true;
    let isStrictMode = false;
    let currentKeyboardLayout = 'en-qwerty';
    let textZoom = 1.0;

    const ZOOM_MIN = 0.5;
    const ZOOM_MAX = 2.0;
    const ZOOM_STEP = 0.1;

    // DOM element references (cached on first use)
    const getEl = id => document.getElementById(id);

    // Lucide icon SVGs for dynamic button states
    const ICON = {
        moon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
        sun: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
        scan: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>`,
        crosshair: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>`,
        circle: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`,
    };

    /**
     * Update theme toggle button icon
     * @param {'dark'|'light'} theme
     */
    function setThemeToggleIcon(theme) {
        const btn = getEl('theme-toggle');
        if (!btn) return;
        btn.innerHTML = theme === 'dark' ? ICON.moon : ICON.sun;
        btn.setAttribute('aria-label', 'Toggle theme');
        btn.setAttribute('title', 'Toggle theme');
    }

    /**
     * Update zen mode toggle button state
     * @param {boolean} enabled
     */
    function setZenToggleState(enabled) {
        const btn = getEl('zen-toggle');
        if (!btn) return;
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.innerHTML = ICON.scan;
        btn.setAttribute(
            'title',
            enabled ? 'Exit Zen mode (Ctrl+Alt+Z)' : 'Enter Zen mode (Ctrl+Alt+Z)',
        );
        btn.setAttribute('aria-label', enabled ? 'Exit Zen mode' : 'Enter Zen mode');
    }

    /**
     * Update strict mode toggle button state
     * @param {boolean} enabled
     */
    function setStrictModeToggleState(enabled) {
        const btn = getEl('strict-mode-toggle');
        if (!btn) return;
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.innerHTML = enabled ? ICON.crosshair : ICON.circle;
        btn.setAttribute(
            'title',
            enabled ? 'Strict mode ON (requires backspace)' : 'Cheat mode ON (direct correction)',
        );
        btn.setAttribute('aria-label', enabled ? 'Disable strict mode' : 'Enable strict mode');
    }

    /**
     * Persist setting to internal layer
     * @param {string} key
     * @param {*} value
     */
    function persistSetting(key, value) {
        if (window.go?.app?.App?.UpdateSetting) {
            window.go.app.App.UpdateSetting(key, value).catch(err => {
                console.warn(`Failed to persist ${key}:`, err);
            });
        }
    }

    /**
     * Apply theme and optionally persist
     * @param {'dark'|'light'} theme
     * @param {boolean} [persist=true]
     */
    function applyTheme(theme, persist = true) {
        currentTheme = theme === 'light' ? 'light' : 'dark';
        const body = document.body;
        const app = getEl('app');
        // Update classes
        body.classList.remove('theme-dark', 'theme-light');
        app?.classList.remove('theme-dark', 'theme-light');
        body.classList.add(`theme-${currentTheme}`);
        app?.classList.add(`theme-${currentTheme}`);
        // Update stylesheet link
        const themeLink = getEl('theme-css');
        if (themeLink) {
            themeLink.setAttribute('href', `styles/theme-${currentTheme}.css`);
        }
        setThemeToggleIcon(currentTheme);
        if (persist) persistSetting('theme', currentTheme);
    }

    function toggleTheme() {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    /**
     * Apply zen mode and optionally persist
     * When disabled, restores keyboard/stats bar to their saved states
     * @param {boolean} enabled
     * @param {boolean} [persist=true]
     */
    function applyZenMode(enabled, persist = true) {
        isZenMode = Boolean(enabled);
        const body = document.body;
        const app = getEl('app');
        body?.classList.toggle('zen-mode', isZenMode);
        app?.classList.toggle('zen-mode', isZenMode);
        setZenToggleState(isZenMode);
        // Restore visibility when exiting Zen Mode
        if (!isZenMode) {
            getEl('keyboard-section')?.classList.toggle('hidden', !isKeyboardVisible);
            getEl('stats-bar')?.classList.toggle('hidden', !isStatsBarVisible);
        }
        window.EventBus?.emit('app:zen-mode', { enabled: isZenMode });
        if (persist) persistSetting('zenMode', isZenMode);
    }

    function toggleZenMode() {
        applyZenMode(!isZenMode);
    }

    /**
     * Apply keyboard visibility and optionally persist
     * @param {boolean} visible
     * @param {boolean} [persist=true]
     */
    function applyKeyboardVisibility(visible, persist = true) {
        isKeyboardVisible = Boolean(visible);
        getEl('keyboard-section')?.classList.toggle('hidden', !isKeyboardVisible);
        if (persist) persistSetting('showKeyboard', isKeyboardVisible);
    }

    function toggleKeyboard() {
        applyKeyboardVisibility(!isKeyboardVisible);
    }

    /**
     * Apply stats bar visibility and optionally persist
     * @param {boolean} visible
     * @param {boolean} [persist=true]
     */
    function applyStatsBarVisibility(visible, persist = true) {
        isStatsBarVisible = Boolean(visible);
        getEl('stats-bar')?.classList.toggle('hidden', !isStatsBarVisible);
        if (persist) persistSetting('showStatsBar', isStatsBarVisible);
    }

    function toggleStatsBar() {
        applyStatsBarVisibility(!isStatsBarVisible);
    }

    /**
     * Apply strict mode and optionally persist
     * @param {boolean} enabled
     * @param {boolean} [persist=true]
     */
    function applyStrictMode(enabled, persist = true) {
        isStrictMode = Boolean(enabled);
        setStrictModeToggleState(isStrictMode);
        // Update typing engine
        if (window.TypingEngine?.setStrictMode) {
            window.TypingEngine.setStrictMode(isStrictMode);
        }
        window.EventBus?.emit('app:strict-mode', { enabled: isStrictMode });
        if (persist) persistSetting('strictMode', isStrictMode);
    }

    function toggleStrictMode() {
        applyStrictMode(!isStrictMode);
    }

    /**
     * Apply keyboard layout and optionally persist
     * @param {string} layoutId - Layout identifier (e.g., 'en-qwerty', 'en-dvorak')
     * @param {boolean} [persist=true]
     * @returns {boolean} True if layout applied successfully
     */
    function applyKeyboardLayout(layoutId, persist = true) {
        if (!window.KeyboardUI?.setLayout(layoutId)) return false;
        currentKeyboardLayout = layoutId;
        if (persist) persistSetting('keyboardLayout', layoutId);
        return true;
    }

    /**
     * Apply text zoom level and optionally persist
     * @param {number} level - Zoom multiplier (0.5–2.0)
     * @param {boolean} [persist=true]
     */
    function applyTextZoom(level, persist = true) {
        textZoom = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, level)) * 10) / 10;
        const display = getEl('text-display');
        const input = getEl('text-input');
        if (display) display.style.setProperty('--text-zoom', textZoom);
        if (input) input.style.setProperty('--text-zoom', textZoom);
        if (persist) persistSetting('textZoom', textZoom);
    }

    function zoomIn() {
        applyTextZoom(textZoom + ZOOM_STEP);
    }

    function zoomOut() {
        applyTextZoom(textZoom - ZOOM_STEP);
    }

    function resetZoom() {
        applyTextZoom(1.0);
    }

    /**
     * Load settings from internal layer
     * @returns {Promise<{theme: string, zenMode: boolean, showKeyboard: boolean, showStatsBar: boolean, strictMode: boolean, keyboardLayout: string, textZoom: number}>}
     */
    async function load() {
        const defaults = {
            theme: 'dark',
            zenMode: false,
            showKeyboard: true,
            showStatsBar: true,
            strictMode: true,
            keyboardLayout: 'en-qwerty',
            textZoom: 1.0,
        };
        if (!window.go?.app?.App?.GetSettings) return defaults;
        try {
            return await window.go.app.App.GetSettings();
        } catch (err) {
            console.warn('Failed to load settings:', err);
            return defaults;
        }
    }

    // Export API
    window.SettingsManager = {
        load,
        applyTheme,
        toggleTheme,
        applyZenMode,
        toggleZenMode,
        applyKeyboardVisibility,
        toggleKeyboard,
        applyStatsBarVisibility,
        toggleStatsBar,
        applyStrictMode,
        toggleStrictMode,
        applyKeyboardLayout,
        applyTextZoom,
        zoomIn,
        zoomOut,
        resetZoom,
        getTheme: () => currentTheme,
        isZenMode: () => isZenMode,
        isKeyboardVisible: () => isKeyboardVisible,
        isStatsBarVisible: () => isStatsBarVisible,
        isStrictMode: () => isStrictMode,
        getKeyboardLayout: () => currentKeyboardLayout,
        getTextZoom: () => textZoom,
    };
})();
