// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Session Manager
 * Manages text loading, typing session lifecycle, and stats display
 */
(() => {
    // Current text state
    let currentText = null;
    let currentTextMeta = null;
    let startHandlerRef = null;

    /**
     * Set keyboard target to first character of text
     * @param {string} text
     */
    function setInitialTarget(text) {
        if (text?.length > 0 && window.KeyboardUI) {
            window.KeyboardUI.setTargetKey(text[0]);
        }
    }

    /**
     * Build live session summary from TypingEngine
     * @returns {Object|null}
     */
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

    /**
     * Show stats modal for current session
     */
    function showStatsModal() {
        if (!window.UIManager) return;
        // Pause session while modal is open
        window.TypingEngine?.pause();
        const summary = window.StatsManager?.getSessionSummary?.() || buildLiveSummary();
        if (summary) {
            window.UIManager.showModal('session-summary', summary);
        }
    }

    /**
     * Get default text from internal layer
     * @returns {Promise<string>}
     */
    async function getDefaultText() {
        if (!window.go?.app?.App?.DefaultText) {
            console.error('Internal layer not available');
            return '';
        }
        try {
            const textObj = await window.go.app.App.DefaultText();
            if (textObj?.content?.length > 0) {
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
     * Load text by ID from internal layer
     * @param {string} textId
     */
    async function loadText(textId) {
        if (!window.go?.app?.App?.Text) {
            console.error('Internal layer not available');
            return;
        }
        try {
            const textObj = await window.go.app.App.Text(textId);
            if (!textObj?.content?.length) {
                console.error('Text not found:', textId);
                return;
            }
            currentTextMeta = {
                textId: textObj.id || '',
                textTitle: textObj.title || '',
                categoryId: textObj.categoryId || '',
            };
            currentText = textObj.content;
            window.TypingEngine?.reset();
            window.UIManager?.renderText(currentText);
            setInitialTarget(currentText);
            setupTypingStart();
        } catch (err) {
            console.error('Failed to load text:', err);
        }
    }

    /**
     * Check if key event should trigger session start
     * @param {KeyboardEvent} e
     * @returns {boolean}
     */
    function shouldStartSession(e) {
        if (['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) return false;
        if (e.ctrlKey || e.metaKey) return false;
        if (window.KeyUtils?.isNavigationKey?.(e.key)) return false;
        return true;
    }

    /**
     * Setup listener for first keystroke to start session
     */
    function setupTypingStart() {
        if (!window.TypingEngine) return;
        // Remove previous handler if exists
        if (startHandlerRef) {
            window.removeEventListener('keydown', startHandlerRef);
            startHandlerRef = null;
        }
        const startHandler = async e => {
            if (!shouldStartSession(e)) return;
            const session = window.TypingEngine.getSessionData();
            if (session.isActive) {
                window.removeEventListener('keydown', startHandler);
                startHandlerRef = null;
                return;
            }
            // Ensure text is loaded
            if (!currentText?.length) {
                currentText = await getDefaultText();
                if (!currentText?.length) return;
                window.UIManager?.renderText(currentText);
            }
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

    /**
     * Reset current typing session
     */
    function reset() {
        window.TypingEngine?.reset();
        window.UIManager?.updateStats(0, 0, 100, 0);
        window.StatsManager?.clearHeatmap();
        window.KeyboardUI?.clearAllErrors();
        // Rerender current text or load default
        if (currentText?.length) {
            window.UIManager?.renderText(currentText);
            setInitialTarget(currentText);
            setupTypingStart();
        } else {
            getDefaultText().then(text => {
                if (!text?.length) return;
                currentText = text;
                window.UIManager?.renderText(text);
                setInitialTarget(text);
                setupTypingStart();
            });
        }
    }

    /**
     * Load default text and initialize session
     * @returns {Promise<string>}
     */
    async function loadDefault() {
        const text = await getDefaultText();
        if (text?.length) {
            currentText = text;
            window.UIManager?.renderText(text);
            setInitialTarget(text);
        }
        return text;
    }

    /**
     * Get current text metadata
     * @returns {{textId: string, textTitle: string, categoryId: string}|null}
     */
    function getTextMeta() {
        return currentTextMeta ? { ...currentTextMeta } : null;
    }

    // Export API
    window.SessionManager = {
        loadDefault,
        loadText,
        reset,
        getTextMeta,
        showStatsModal,
        setupTypingStart,
    };
})();
