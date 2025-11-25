// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Typing engine core module
 * Tracks typing progress, validates keystrokes, calculates metrics
 * Depends on: events.js (EventBus), keyboard.js (KeyboardUI)
 */
(() => {
    if (!window.EventBus) {
        console.error('EventBus not available. Include events.js before typing.js');
        return;
    }

    // Internal session state
    const session = {
        text: '',
        currentIndex: 0,
        startTime: null,
        mistakes: {},
        keystrokes: [],
        isActive: false,
        isPaused: false,
        totalErrors: 0,
        totalKeystrokes: 0,
        pausedTime: 0,
        pauseStartTime: null,
        typedChars: new Set(), // Track which characters have been typed (by index)
    };

    const IGNORED_KEYS = new Set([
        'Escape',
        'CapsLock',
        'NumLock',
        'ScrollLock',
        'Insert',
        'ContextMenu',
        'Dead',
    ]);

    let statsUpdateTimer = null;
    const STATS_UPDATE_THROTTLE = 100; // ms
    let statsIntervalId = null; // 1s background tick for timer/stats

    // Key normalization utilities are now in utils.js (KeyUtils)
    if (!window.KeyUtils) {
        console.error('KeyUtils not available. Include utils.js before typing.js');
        return;
    }

    /**
     * Calculate WPM (Words Per Minute)
     * WPM = (characters_typed / 5) / (elapsed_time_minutes)
     */
    function calculateWPM() {
        const typedCount = session.typedChars.size;
        if (!session.startTime || typedCount === 0) return 0;
        const elapsed = getElapsedTimeSeconds();
        if (elapsed === 0) return 0;
        const words = typedCount / 5;
        const minutes = elapsed / 60;
        return words / minutes;
    }

    /**
     * Calculate CPM (Characters Per Minute)
     * CPM = characters_typed / elapsed_time_minutes
     */
    function calculateCPM() {
        const typedCount = session.typedChars.size;
        if (!session.startTime || typedCount === 0) return 0;
        const elapsed = getElapsedTimeSeconds();
        if (elapsed === 0) return 0;
        const minutes = elapsed / 60;
        return typedCount / minutes;
    }

    /**
     * Calculate accuracy percentage
     * Accuracy = ((total_keystrokes - total_errors) / total_keystrokes) * 100
     */
    function calculateAccuracy() {
        if (session.totalKeystrokes === 0) return 100;
        return ((session.totalKeystrokes - session.totalErrors) / session.totalKeystrokes) * 100;
    }

    /**
     * Get elapsed time in seconds (excluding paused time)
     */
    function getElapsedTimeSeconds() {
        if (!session.startTime) return 0;

        const now = Date.now();
        let elapsed = now - session.startTime;
        // Subtract paused time
        elapsed -= session.pausedTime;
        // If currently paused, subtract current pause duration
        if (session.isPaused && session.pauseStartTime) {
            elapsed -= now - session.pauseStartTime;
        }
        return elapsed / 1000; // Convert to seconds
    }

    /**
     * Throttled stats update emitter
     */
    function emitStatsUpdate() {
        if (statsUpdateTimer) return;

        statsUpdateTimer = setTimeout(() => {
            const wpm = calculateWPM();
            const cpm = calculateCPM();
            const accuracy = calculateAccuracy();
            const time = getElapsedTimeSeconds();

            window.EventBus.emit('stats:update', {
                wpm,
                cpm,
                accuracy,
                time,
            });
            statsUpdateTimer = null;
        }, STATS_UPDATE_THROTTLE);
    }

    /**
     * Move cursor to next untyped character (forward from current position)
     */
    function moveToNextUntyped() {
        // First, try to find next untyped character forward
        for (let i = session.currentIndex + 1; i < session.text.length; i++) {
            if (!session.typedChars.has(i)) {
                session.currentIndex = i;
                updateTargetKey();
                return;
            }
        }
        // If none found forward, check from beginning
        for (let i = 0; i < session.currentIndex; i++) {
            if (!session.typedChars.has(i)) {
                session.currentIndex = i;
                updateTargetKey();
                return;
            }
        }
        // All typed - session complete
    }

    /**
     * Update keyboard target key based on current index
     */
    function updateTargetKey() {
        const nextChar = session.text[session.currentIndex];
        if (window.KeyboardUI && nextChar) {
            window.KeyboardUI.setTargetKey(nextChar);
        }
        // Emit cursor position for UI sync
        window.EventBus.emit('cursor:sync', { index: session.currentIndex });
    }

    /**
     * Handle keydown event
     */
    function handleKeyDown(e) {
        if (!session.isActive) return;
        // Ignore navigation keys (with or without modifiers)
        if (window.KeyUtils.isNavigationKey?.(e.key)) {
            return;
        }
        // Ignore shortcuts using control/meta modifiers
        if (e.ctrlKey || e.metaKey) {
            return;
        }
        if (IGNORED_KEYS.has(e.key)) {
            return;
        }
        // Ignore modifier keys
        if (['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) return;
        // Auto-resume on first valid keystroke after pause
        if (session.isPaused) resume();
        // Prevent default behavior for special keys during active session
        // to avoid browser navigation (Tab, Enter) and scrolling (Space)
        if (['Tab', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
        }
        const pressedKey = window.KeyUtils.normalizeKey(e.key);
        const expectedChar = session.text[session.currentIndex];
        if (expectedChar === undefined) {
            // Session already complete
            return;
        }
        // Skip already typed characters
        if (session.typedChars.has(session.currentIndex)) {
            // Move to next untyped character
            moveToNextUntyped();
            return;
        }

        const expectedKey = window.KeyUtils.normalizeTextChar(expectedChar);
        const isCorrect = pressedKey === expectedKey;

        session.totalKeystrokes++;

        // Record keystroke
        session.keystrokes.push({
            key: pressedKey,
            expected: expectedKey,
            isCorrect,
            index: session.currentIndex,
            timestamp: Date.now(),
        });
        if (isCorrect) {
            // Mark this character as typed
            session.typedChars.add(session.currentIndex);
            // Correct key pressed
            window.EventBus.emit('typing:keystroke', {
                char: expectedChar,
                expected: expectedKey,
                isCorrect: true,
                index: session.currentIndex,
            });
            // Clear error state if it was set
            if (window.KeyboardUI) {
                window.KeyboardUI.clearError(expectedKey);
            }
            // Move to next untyped character
            moveToNextUntyped();
            // Check if session complete (all characters typed)
            if (session.typedChars.size >= session.text.length) {
                completeSession();
            }

            emitStatsUpdate();
        } else {
            // Wrong key pressed
            session.totalErrors++;
            // Track mistake by key
            if (!session.mistakes[expectedKey]) {
                session.mistakes[expectedKey] = 0;
            }
            session.mistakes[expectedKey]++;

            window.EventBus.emit('typing:error', {
                char: expectedChar,
                expected: expectedKey,
                pressed: pressedKey,
                index: session.currentIndex,
            });
            // Apply visual error feedback
            if (window.KeyboardUI) {
                window.KeyboardUI.setError(expectedKey);
            }
            emitStatsUpdate();
        }
    }

    /**
     * Complete typing session
     */
    function completeSession() {
        session.isActive = false;

        // Stop background stats timer
        if (statsIntervalId) {
            clearInterval(statsIntervalId);
            statsIntervalId = null;
        }
        const sessionData = {
            text: session.text,
            currentIndex: session.currentIndex,
            startTime: session.startTime,
            endTime: Date.now(),
            duration: getElapsedTimeSeconds(),
            mistakes: { ...session.mistakes },
            keystrokes: [...session.keystrokes],
            totalErrors: session.totalErrors,
            totalKeystrokes: session.totalKeystrokes,
            wpm: calculateWPM(),
            cpm: calculateCPM(),
            accuracy: calculateAccuracy(),
        };
        if (window.KeyboardUI) {
            window.KeyboardUI.clearTarget();
        }
        window.EventBus.emit('typing:complete', sessionData);
    }

    /**
     * Start typing session with text
     * @param {string} text - Text to type
     * @param {number} [startIndex=0] - Starting cursor position
     */
    function start(text, startIndex = 0) {
        if (!text || text.length === 0) {
            console.error('TypingEngine.start: text cannot be empty');
            return;
        }
        reset();
        session.text = text;
        session.isActive = true;
        session.startTime = Date.now();

        // Set initial cursor position (clamped to valid range)
        session.currentIndex = Math.max(0, Math.min(startIndex, text.length - 1));

        // Set initial target key at cursor position
        const targetChar = text[session.currentIndex];
        if (window.KeyboardUI && targetChar) {
            window.KeyboardUI.setTargetKey(targetChar);
        }
        window.EventBus.emit('typing:start', {
            text,
            timestamp: session.startTime,
        });

        // Sync cursor position with UI
        window.EventBus.emit('cursor:sync', { index: session.currentIndex });

        // Attach keyboard listener
        window.addEventListener('keydown', handleKeyDown);

        // Start background stats/timer tick (1s)
        if (statsIntervalId) {
            clearInterval(statsIntervalId);
        }
        statsIntervalId = setInterval(emitStatsUpdate, 1000);
    }

    /**
     * Stop typing session
     */
    function stop() {
        if (!session.isActive) return;

        window.removeEventListener('keydown', handleKeyDown);

        // Stop background stats timer
        if (statsIntervalId) {
            clearInterval(statsIntervalId);
            statsIntervalId = null;
        }
        if (session.currentIndex < session.text.length) {
            // Session incomplete
            session.isActive = false;
        } else {
            completeSession();
        }
    }

    /**
     * Pause typing session
     */
    function pause() {
        if (!session.isActive || session.isPaused) return;
        session.isPaused = true;
        session.pauseStartTime = Date.now();
    }

    /**
     * Resume typing session
     */
    function resume() {
        if (!session.isActive || !session.isPaused) return;

        if (session.pauseStartTime) {
            const pauseDuration = Date.now() - session.pauseStartTime;
            session.pausedTime += pauseDuration;
            session.pauseStartTime = null;
        }
        session.isPaused = false;
    }

    /**
     * Reset typing session
     */
    function reset() {
        window.removeEventListener('keydown', handleKeyDown);

        // Stop background stats timer
        if (statsIntervalId) {
            clearInterval(statsIntervalId);
            statsIntervalId = null;
        }

        session.text = '';
        session.currentIndex = 0;
        session.startTime = null;
        session.mistakes = {};
        session.keystrokes = [];
        session.isActive = false;
        session.isPaused = false;
        session.totalErrors = 0;
        session.totalKeystrokes = 0;
        session.pausedTime = 0;
        session.pauseStartTime = null;
        session.typedChars.clear();

        if (statsUpdateTimer) {
            clearTimeout(statsUpdateTimer);
            statsUpdateTimer = null;
        }
        if (window.KeyboardUI) {
            window.KeyboardUI.clearTarget();
        }
    }

    /**
     * Get current session data
     * @returns {Object} Session object
     */
    function getSessionData() {
        return {
            text: session.text,
            currentIndex: session.currentIndex,
            startTime: session.startTime,
            mistakes: { ...session.mistakes },
            keystrokes: [...session.keystrokes],
            isActive: session.isActive,
            isPaused: session.isPaused,
            totalErrors: session.totalErrors,
            totalKeystrokes: session.totalKeystrokes,
            duration: getElapsedTimeSeconds(),
        };
    }

    /**
     * Get current typing position index
     * @returns {number} Current index
     */
    function getCurrentIndex() {
        return session.currentIndex;
    }

    /**
     * Get current metrics
     * @returns {Object} Metrics object
     */
    function getMetrics() {
        return {
            wpm: calculateWPM(),
            cpm: calculateCPM(),
            accuracy: calculateAccuracy(),
            time: getElapsedTimeSeconds(),
        };
    }

    /**
     * Set current index (for cursor navigation)
     * @param {number} index - New cursor position
     */
    function setCurrentIndex(index) {
        if (index < 0 || index > session.text.length) return;
        session.currentIndex = index;
        updateTargetKey();
    }

    // Listen for cursor move events from UI
    window.EventBus.on('cursor:move', data => {
        if (data.index !== undefined) {
            // Clear keyboard error highlights on navigation
            if (window.KeyboardUI) {
                window.KeyboardUI.clearAllErrors();
            }
            setCurrentIndex(data.index);
        }
    });

    // Export API
    window.TypingEngine = {
        start,
        stop,
        pause,
        resume,
        reset,
        getSessionData,
        getCurrentIndex,
        setCurrentIndex,
        getMetrics,
        handleKeyDown, // Export for app.js to process first keystroke
    };
})();
