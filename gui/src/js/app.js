// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Application Controller
 * Main orchestrator for FingerGo application
 * Initializes modules, binds UI handlers, coordinates lifecycle
 */
(() => {
    /**
     * Bind click handlers to action bar buttons
     */
    function bindButtonHandlers() {
        const bind = (id, handler) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    handler();
                    btn.blur();
                });
            }
        };
        bind('theme-toggle', () => window.SettingsManager.toggleTheme());
        bind('color-settings', openColorSettings);
        bind('zen-toggle', () => window.SettingsManager.toggleZenMode());
        bind('stats-toggle', () => window.SettingsManager.toggleStatsBar());
        bind('keyboard-toggle', () => window.SettingsManager.toggleKeyboard());
        bind('reset-session', () => window.SessionManager.reset());
    }

    /**
     * Open color settings modal
     */
    function openColorSettings() {
        window.UIManager?.showModal('color-settings', {
            theme: window.SettingsManager.getTheme(),
        });
    }

    /**
     * Check required modules are available
     * @returns {boolean}
     */
    function checkModules() {
        const required = [
            'EventBus',
            'TypingEngine',
            'UIManager',
            'KeyboardUI',
            'SettingsManager',
            'SessionManager',
        ];
        for (const name of required) {
            if (!window[name]) {
                console.error(`${name} not available. Ensure corresponding .js is loaded.`);
                return false;
            }
        }
        return true;
    }

    /**
     * Initialize all modules and start application
     */
    async function initialize() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            await new Promise(r => document.addEventListener('DOMContentLoaded', r));
        }
        // Load languages from internal layer (single source of truth)
        await window.SupportedLanguages?.load?.();
        // Load and apply settings
        const settings = await window.SettingsManager.load();
        window.SettingsManager.applyTheme(settings.theme, false);
        window.SettingsManager.applyZenMode(settings.zenMode, false);
        window.SettingsManager.applyKeyboardVisibility(settings.showKeyboard, false);
        window.SettingsManager.applyStatsBarVisibility(settings.showStatsBar, false);
        // Bind UI handlers
        bindButtonHandlers();
        // Check required modules
        if (!checkModules()) return;
        // Load default text
        const text = await window.SessionManager.loadDefault();
        if (!text?.length) {
            console.error('No text available. Check internal layer connection.');
            return;
        }
        // Listen for modal close to setup typing start handler if session is not active
        window.EventBus.on('modal:closed', () => {
            const session = window.TypingEngine?.getSessionData();
            // If session is not active, setup handler for first keystroke
            if (!session?.isActive) {
                window.SessionManager.setupTypingStart();
            }
        });
        window.EventBus.on('typing:complete', () => {
            window.SessionManager.setupTypingStart();
        });
        // Emit ready event
        window.EventBus.emit('app:ready', { text, timestamp: Date.now() });
        console.log('FingerGo initialized successfully');
    }

    /**
     * Boot application
     */
    function boot() {
        initialize().then(() => {
            window.ShortcutsManager?.init();
            window.LibraryManager?.init();
            window.SessionManager?.setupTypingStart();
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // Export minimal API (delegates to managers)
    window.App = {
        reset: () => window.SessionManager?.reset(),
        loadText: id => window.SessionManager?.loadText(id),
        openSettings: () => window.UIManager?.showModal('settings', {}),
        openColorSettings,
        toggleKeyboard: () => window.SettingsManager?.toggleKeyboard(),
        applyKeyboardVisibility: (v, p) => window.SettingsManager?.applyKeyboardVisibility(v, p),
        toggleStatsBar: () => window.SettingsManager?.toggleStatsBar(),
        applyStatsBarVisibility: (v, p) => window.SettingsManager?.applyStatsBarVisibility(v, p),
        toggleTheme: () => window.SettingsManager?.toggleTheme(),
        applyTheme: (t, p) => window.SettingsManager?.applyTheme(t, p),
        toggleZenMode: () => window.SettingsManager?.toggleZenMode(),
        applyZenMode: (e, p) => window.SettingsManager?.applyZenMode(e, p),
        getTextMeta: () => window.SessionManager?.getTextMeta(),
        toggleLibrary: () => window.LibraryManager?.toggle(),
        openTextEditor: id => window.LibraryManager?.openEditor(id),
    };

    // Create organized namespace to reduce global scope pollution
    // All modules are now accessible under window.FingerGo
    window.FingerGo = {
        // Core modules
        Events: window.EventBus,
        Keyboard: window.KeyboardUI,
        Typing: window.TypingEngine,
        UI: window.UIManager,
        Stats: window.StatsManager,
        Settings: window.SettingsManager,
        Session: window.SessionManager,
        Library: window.LibraryManager,
        Shortcuts: window.ShortcutsManager,
        Modal: window.ModalManager,
        App: window.App,

        // Utilities
        Utils: {
            Key: window.KeyUtils,
            App: window.AppUtils,
            Color: window.ColorUtils,
        },

        // Data
        Layouts: window.KeyboardLayouts,
        Languages: window.SupportedLanguages,
        Colors: window.ColorSchemes,
        Constants: window.AppConstants,
    };

    // Log successful initialization
    console.log(
        `%cFingerGo %cv${window.AppConstants?.VERSION || '1.0.0'}`,
        'font-weight: bold; font-size: 14px; color: #4A90E2',
        'font-weight: normal; color: #888',
    );
    console.log('Modules loaded:', Object.keys(window.FingerGo).join(', '));
})();
