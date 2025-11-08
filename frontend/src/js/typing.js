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
    };

    let statsUpdateTimer = null;
    const STATS_UPDATE_THROTTLE = 100; // ms

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
        if (!session.startTime || session.currentIndex === 0) return 0;

        const elapsed = getElapsedTimeSeconds();
        if (elapsed === 0) return 0;

        const words = session.currentIndex / 5;
        const minutes = elapsed / 60;
        return words / minutes;
    }

    /**
     * Calculate CPM (Characters Per Minute)
     * CPM = characters_typed / elapsed_time_minutes
     */
    function calculateCPM() {
        if (!session.startTime || session.currentIndex === 0) return 0;

        const elapsed = getElapsedTimeSeconds();
        if (elapsed === 0) return 0;

        const minutes = elapsed / 60;
        return session.currentIndex / minutes;
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
     * Handle keydown event
     */
    function handleKeyDown(e) {
        // Ignore if session not active or paused
        if (!session.isActive || session.isPaused) return;

        // Ignore modifier keys
        if (['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) return;

        // Prevent default behavior for special keys during active session
        // to avoid browser navigation (Tab, Enter, etc.)
        if (['Tab', 'Enter'].includes(e.key)) {
            e.preventDefault();
        }

        const pressedKey = window.KeyUtils.normalizeKey(e.key);
        const expectedChar = session.text[session.currentIndex];

        if (expectedChar === undefined) {
            // Session already complete
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

            session.currentIndex++;

            // Check if session complete
            if (session.currentIndex >= session.text.length) {
                completeSession();
            } else {
                // Update target key
                const nextChar = session.text[session.currentIndex];
                const nextKey = window.KeyUtils.normalizeTextChar(nextChar);
                if (window.KeyboardUI) {
                    window.KeyboardUI.setTargetKey(nextKey);
                }
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
     */
    function start(text) {
        if (!text || text.length === 0) {
            console.error('TypingEngine.start: text cannot be empty');
            return;
        }

        reset();
        session.text = text;
        session.isActive = true;
        session.startTime = Date.now();

        // Set initial target key
        const firstChar = text[0];
        const firstKey = window.KeyUtils.normalizeTextChar(firstChar);
        if (window.KeyboardUI) {
            window.KeyboardUI.setTargetKey(firstKey);
        }

        window.EventBus.emit('typing:start', {
            text,
            timestamp: session.startTime,
        });

        // Attach keyboard listener
        window.addEventListener('keydown', handleKeyDown);
    }

    /**
     * Stop typing session
     */
    function stop() {
        if (!session.isActive) return;

        window.removeEventListener('keydown', handleKeyDown);

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

    // Export API
    window.TypingEngine = {
        start,
        stop,
        pause,
        resume,
        reset,
        getSessionData,
        getCurrentIndex,
        getMetrics,
    };
})();
