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

    // DOM element references (cached on first use)
    const getEl = id => document.getElementById(id);

    /**
     * Update theme toggle button icon
     * @param {'dark'|'light'} theme
     */
    function setThemeToggleIcon(theme) {
        const btn = getEl('theme-toggle');
        if (!btn) return;
        btn.textContent = theme === 'dark' ? '🌙' : '☀️';
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
        btn.textContent = enabled ? '🧘‍♂️' : '🧘';
        btn.setAttribute(
            'title',
            enabled ? 'Exit Zen mode (Ctrl+Alt+Z)' : 'Enter Zen mode (Ctrl+Alt+Z)',
        );
        btn.setAttribute('aria-label', enabled ? 'Exit Zen mode' : 'Enter Zen mode');
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
     * Load settings from internal layer
     * @returns {Promise<{theme: string, zenMode: boolean, showKeyboard: boolean, showStatsBar: boolean}>}
     */
    async function load() {
        const defaults = { theme: 'dark', zenMode: false, showKeyboard: true, showStatsBar: true };
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
        getTheme: () => currentTheme,
        isZenMode: () => isZenMode,
        isKeyboardVisible: () => isKeyboardVisible,
        isStatsBarVisible: () => isStatsBarVisible,
    };
})();
