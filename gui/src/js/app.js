// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Application Controller
 * Main orchestrator for FingerGo application
 * Initializes all modules and coordinates lifecycle
 */
(() => {
    // Single source of truth for current text displayed/used by TypingEngine
    let currentText = null; // string content for typing
    let currentTextMeta = null; // {id, title, categoryId} for session persistence
    let currentTheme = 'dark';
    let isZenMode = false;
    let isKeyboardVisible = true;
    let isStatsBarVisible = true;

    function setThemeToggleIcon(theme) {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        btn.textContent = theme === 'dark' ? '🌙' : '☀️';
        btn.setAttribute('aria-label', 'Toggle theme');
        btn.setAttribute('title', 'Toggle theme');
    }

    function setZenToggleState(enabled) {
        const btn = document.getElementById('zen-toggle');
        if (!btn) return;
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.textContent = enabled ? '🧘‍♂️' : '🧘';
        btn.setAttribute('title', enabled ? 'Exit Zen mode' : 'Enter Zen mode');
        btn.setAttribute('aria-label', enabled ? 'Exit Zen mode' : 'Enter Zen mode');
    }

    function isModalVisible() {
        return window.ModalManager?.isVisible() || false;
    }

    /**
     * Set keyboard target to first character of text
     * @param {string} text - Text to get first char from
     */
    function setInitialTarget(text) {
        if (text?.length > 0 && window.KeyboardUI) {
            // Pass original char for Shift detection
            window.KeyboardUI.setTargetKey(text[0]);
        }
    }

    function buildLiveSummary() {
        if (!window.TypingEngine) return null;
        const session = window.TypingEngine.getSessionData();
        if (!session || (session.totalKeystrokes === 0 && session.currentIndex === 0)) {
            return null;
        }
        const metrics = window.TypingEngine.getMetrics();
        return {
            ...session,
            wpm: metrics?.wpm ?? 0,
            cpm: metrics?.cpm ?? 0,
            accuracy: metrics?.accuracy ?? 100,
            duration: metrics?.time ?? session.duration ?? 0,
            totalErrors: session.totalErrors ?? 0,
            totalKeystrokes: session.totalKeystrokes ?? 0,
        };
    }

    function showStatsModal() {
        if (!window.UIManager) return;
        // Pause session while modal is open to prevent error accumulation
        if (window.TypingEngine) {
            window.TypingEngine.pause();
        }
        const summary =
            (window.StatsManager && window.StatsManager.getSessionSummary
                ? window.StatsManager.getSessionSummary()
                : null) || buildLiveSummary();
        if (summary) {
            window.UIManager.showModal('session-summary', summary);
        }
    }

    /**
     * Apply theme and persist preference
     * @param {'dark'|'light'} theme
     * @param {boolean} [persist=true] - Whether to persist to backend
     */
    function applyTheme(theme, persist = true) {
        currentTheme = theme === 'light' ? 'light' : 'dark';
        const body = document.body;
        const app = document.getElementById('app');
        // Update classes
        body.classList.remove('theme-dark', 'theme-light');
        app?.classList.remove('theme-dark', 'theme-light');
        body.classList.add(`theme-${currentTheme}`);
        app?.classList.add(`theme-${currentTheme}`);
        // Update stylesheet link
        const themeLink = document.getElementById('theme-css');
        if (themeLink) {
            themeLink.setAttribute('href', `styles/theme-${currentTheme}.css`);
        }
        setThemeToggleIcon(currentTheme);
        // Persist to backend
        if (persist && window.go?.app?.App?.UpdateSetting) {
            window.go.app.App.UpdateSetting('theme', currentTheme).catch(err => {
                console.warn('Failed to persist theme:', err);
            });
        }
    }

    function toggleTheme() {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    /**
     * Apply zen mode and persist preference
     * When Zen Mode is disabled, restore keyboard/stats bar visibility
     * @param {boolean} enabled
     * @param {boolean} [persist=true] - Whether to persist to backend
     */
    function applyZenMode(enabled, persist = true) {
        const next = Boolean(enabled);
        isZenMode = next;
        const body = document.body;
        const app = document.getElementById('app');
        body?.classList.toggle('zen-mode', next);
        app?.classList.toggle('zen-mode', next);
        setZenToggleState(next);
        // When exiting Zen Mode, restore keyboard/stats bar to their saved states
        if (!next) {
            const keyboardSection = document.getElementById('keyboard-section');
            const statsBar = document.getElementById('stats-bar');
            keyboardSection?.classList.toggle('hidden', !isKeyboardVisible);
            statsBar?.classList.toggle('hidden', !isStatsBarVisible);
        }
        window.EventBus?.emit('app:zen-mode', { enabled: next });
        // Persist to backend
        if (persist && window.go?.app?.App?.UpdateSetting) {
            window.go.app.App.UpdateSetting('zenMode', next).catch(err => {
                console.warn('Failed to persist zenMode:', err);
            });
        }
    }

    function toggleZenMode() {
        applyZenMode(!isZenMode);
    }

    /**
     * Get default text from internal layer
     * @returns {Promise<string>} Text content to type
     */
    async function getDefaultText() {
        if (!window.go?.app?.App?.DefaultText) {
            console.error('Internal layer not available');
            return '';
        }
        try {
            const textObj = await window.go.app.App.DefaultText();
            // Returns Text struct: {id, title, content, categoryId, language, ...}
            if (textObj && textObj.content && textObj.content.length > 0) {
                currentTextMeta = {
                    textId: textObj.id || '',
                    textTitle: textObj.title || '',
                    categoryId: textObj.categoryId || '',
                };
                return textObj.content;
            }
            console.error('Internal layer returned empty text');
            return '';
        } catch (err) {
            console.error('Failed to load text:', err);
            return '';
        }
    }

    /**
     * Load settings from backend
     * @returns {Promise<{theme: string, zenMode: boolean, showKeyboard: boolean}>}
     */
    async function loadSettings() {
        const defaults = { theme: 'dark', zenMode: false, showKeyboard: true, showStatsBar: true };
        if (!window.go?.app?.App?.GetSettings) {
            return defaults;
        }
        try {
            return await window.go.app.App.GetSettings();
        } catch (err) {
            console.warn('Failed to load settings:', err);
            return defaults;
        }
    }

    /**
     * Initialize all modules
     */
    async function initialize() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Load and apply settings from backend
        const settings = await loadSettings();
        applyTheme(settings.theme, false);
        applyZenMode(settings.zenMode, false);
        applyKeyboardVisibility(settings.showKeyboard, false);
        applyStatsBarVisibility(settings.showStatsBar, false);

        // Bind theme toggle (blur after click to prevent Space/Enter activation)
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                toggleTheme();
                themeBtn.blur();
            });
        }
        const colorBtn = document.getElementById('color-settings');
        if (colorBtn) {
            colorBtn.addEventListener('click', () => {
                openColorSettings();
                colorBtn.blur();
            });
        }
        const zenBtn = document.getElementById('zen-toggle');
        if (zenBtn) {
            zenBtn.addEventListener('click', () => {
                toggleZenMode();
                zenBtn.blur();
            });
        }
        const statsBtn = document.getElementById('stats-toggle');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                toggleStatsBar();
                statsBtn.blur();
            });
        }
        const keyboardBtn = document.getElementById('keyboard-toggle');
        if (keyboardBtn) {
            keyboardBtn.addEventListener('click', () => {
                toggleKeyboard();
                keyboardBtn.blur();
            });
        }
        const resetBtn = document.getElementById('reset-session');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                reset();
                resetBtn.blur();
            });
        }

        // Check required modules
        if (!window.EventBus) {
            console.error('EventBus not available. Ensure events.js is loaded.');
            return;
        }
        if (!window.TypingEngine) {
            console.error('TypingEngine not available. Ensure typing.js is loaded.');
            return;
        }
        if (!window.UIManager) {
            console.error('UIManager not available. Ensure ui.js is loaded.');
            return;
        }
        if (!window.KeyboardUI) {
            console.error('KeyboardUI not available. Ensure keyboard.js is loaded.');
            return;
        }

        // Load default text from internal layer
        const defaultText = await getDefaultText();
        if (!defaultText || defaultText.length === 0) {
            console.error('No text available. Check internal layer connection.');
            return;
        }
        currentText = defaultText;

        // Render text in UI
        window.UIManager.renderText(defaultText);

        // Set initial keyboard target (typing engine will start on first keystroke)
        setInitialTarget(defaultText);

        // Listen for modal close to resume session or prepare restart
        window.EventBus.on('modal:closed', () => {
            if (!window.TypingEngine) return;
            const session = window.TypingEngine.getSessionData();
            if (session.isActive && session.isPaused) {
                window.TypingEngine.resume();
                return;
            }
            if (!session.isActive) {
                setupTypingStart();
            }
        });
        window.EventBus.on('typing:complete', () => {
            setupTypingStart();
        });
        // Emit app ready event
        window.EventBus.emit('app:ready', {
            text: defaultText,
            timestamp: Date.now(),
        });
        console.log('FingerGo initialized successfully');
    }

    /**
     * Reset current typing session
     */
    function reset() {
        if (window.TypingEngine) {
            window.TypingEngine.reset();
        }
        // Reset stats display
        if (window.UIManager) {
            window.UIManager.updateStats(0, 0, 100, 0);
        }
        // Clear keyboard heatmap and error states
        if (window.StatsManager) {
            window.StatsManager.clearHeatmap();
        }
        if (window.KeyboardUI) {
            window.KeyboardUI.clearAllErrors();
        }

        // Reload default text
        getDefaultText().then(text => {
            if (!text || text.length === 0) return;
            currentText = text;
            window.UIManager?.renderText(text);
            setInitialTarget(text);
        });

        // Re-setup typing start listener for next session
        setupTypingStart();
    }

    /**
     * Load text by ID from internal layer
     * @param {string} textId - Text identifier
     */
    async function loadText(textId) {
        if (!window.go?.app?.App?.Text) {
            console.error('Internal layer not available');
            return;
        }
        try {
            const textObj = await window.go.app.App.Text(textId);
            if (!textObj || !textObj.content || textObj.content.length === 0) {
                console.error('Text not found:', textId);
                return;
            }
            currentTextMeta = {
                textId: textObj.id || '',
                textTitle: textObj.title || '',
                categoryId: textObj.categoryId || '',
            };
            currentText = textObj.content;

            // Reset current session
            window.TypingEngine?.reset();
            // Render new text
            window.UIManager?.renderText(currentText);
            setInitialTarget(currentText);
        } catch (err) {
            console.error('Failed to load text:', err);
        }
    }

    /**
     * Open settings modal
     */
    function openSettings() {
        if (window.UIManager) {
            window.UIManager.showModal('settings', {});
        }
    }

    /**
     * Open color settings modal
     */
    function openColorSettings() {
        if (window.UIManager) {
            window.UIManager.showModal('color-settings', { theme: currentTheme });
        }
    }

    /**
     * Apply keyboard visibility and persist preference
     * @param {boolean} visible
     * @param {boolean} [persist=true] - Whether to persist to backend
     */
    function applyKeyboardVisibility(visible, persist = true) {
        const next = Boolean(visible);
        isKeyboardVisible = next;
        const keyboardSection = document.getElementById('keyboard-section');
        if (keyboardSection) {
            keyboardSection.classList.toggle('hidden', !next);
        }
        // Persist to backend
        if (persist && window.go?.app?.App?.UpdateSetting) {
            window.go.app.App.UpdateSetting('showKeyboard', next).catch(err => {
                console.warn('Failed to persist showKeyboard:', err);
            });
        }
    }

    function toggleKeyboard() {
        applyKeyboardVisibility(!isKeyboardVisible);
    }

    /**
     * Apply stats bar visibility and persist preference
     * @param {boolean} visible
     * @param {boolean} [persist=true] - Whether to persist to backend
     */
    function applyStatsBarVisibility(visible, persist = true) {
        const next = Boolean(visible);
        isStatsBarVisible = next;
        const statsBar = document.getElementById('stats-bar');
        if (statsBar) {
            statsBar.classList.toggle('hidden', !next);
        }
        // Persist to backend
        if (persist && window.go?.app?.App?.UpdateSetting) {
            window.go.app.App.UpdateSetting('showStatsBar', next).catch(err => {
                console.warn('Failed to persist showStatsBar:', err);
            });
        }
    }

    function toggleStatsBar() {
        applyStatsBarVisibility(!isStatsBarVisible);
    }

    /**
     * Check if key event should trigger session start
     */
    function shouldStartSession(e) {
        if (['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) return false;
        if (e.ctrlKey || e.metaKey) return false;
        if (window.KeyUtils?.isNavigationKey?.(e.key)) return false;
        return true;
    }

    /**
     * Start typing session on first keystroke
     */
    let startHandlerRef = null;

    /**
     * Handle global keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        window.addEventListener('keydown', e => {
            // Esc - Show stats modal (do not reset session)
            if (e.key === 'Escape') {
                if (isModalVisible()) return;
                e.preventDefault();
                showStatsModal();
                return;
            }
            // Ctrl+, - Open settings
            if (e.key === ',' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                openSettings();
            }
            // Ctrl+Alt+H - Toggle keyboard
            if (e.key === 'h' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                toggleKeyboard();
            }
            // Ctrl+Alt+J - Toggle stats bar
            if (e.key === 'j' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                toggleStatsBar();
            }
            // Ctrl+Alt+Z - Toggle Zen mode
            if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                toggleZenMode();
            }
        });
    }

    function setupTypingStart() {
        if (!window.TypingEngine) return;

        if (startHandlerRef) {
            window.removeEventListener('keydown', startHandlerRef);
            startHandlerRef = null;
        }

        const startHandler = async e => {
            if (!shouldStartSession(e)) return;

            // Remove listener early to prevent double-start
            const session = window.TypingEngine.getSessionData();
            if (session.isActive) {
                window.removeEventListener('keydown', startHandler);
                startHandlerRef = null;
                return;
            }

            // Ensure text is loaded
            if (!currentText || currentText.length === 0) {
                currentText = await getDefaultText();
                if (!currentText || currentText.length === 0) return;
                window.UIManager?.renderText(currentText);
            }

            // Get cursor position and start session
            const textInput = document.getElementById('text-input');
            const cursorPos = textInput?.selectionStart ?? 0;

            window.removeEventListener('keydown', startHandler);
            startHandlerRef = null;
            window.TypingEngine.start(currentText, cursorPos);
            window.TypingEngine.handleKeyDown?.(e);
        };
        startHandlerRef = startHandler;
        window.addEventListener('keydown', startHandler);
    }

    // Initialize application when DOM is ready
    const boot = () =>
        initialize().then(() => {
            setupKeyboardShortcuts();
            setupTypingStart();
        });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    /**
     * Get current text metadata for session persistence
     * @returns {{textId: string, textTitle: string, categoryId: string}|null}
     */
    function getTextMeta() {
        return currentTextMeta ? { ...currentTextMeta } : null;
    }

    // Export API
    window.App = {
        reset,
        loadText,
        openSettings,
        openColorSettings,
        toggleKeyboard,
        applyKeyboardVisibility,
        toggleStatsBar,
        applyStatsBarVisibility,
        toggleTheme,
        applyTheme,
        toggleZenMode,
        applyZenMode,
        getTextMeta,
    };
})();
