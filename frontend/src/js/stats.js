// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Stats manager (Phase 2 skeleton)
 * Listens to typing completion and stores last session summary.
 * Provides minimal API for saving and retrieving summary data.
 */
(() => {
    if (!window.EventBus) {
        console.error('EventBus not available. Include events.js before stats.js');
        return;
    }

    let lastSessionSummary = null;

    /**
     * Persist session to backend (if available) and cache summary locally.
     * @param {Object} sessionData
     */
    async function recordSession(sessionData) {
        if (!sessionData) return;
        lastSessionSummary = { ...sessionData };

        // Persist to backend if Wails bridge is available
        try {
            if (window.go?.app?.App?.SaveSession) {
                await window.go.app.App.SaveSession(sessionData);
            }
        } catch (err) {
            console.warn('StatsManager: failed to save session to backend:', err);
        }
    }

    /**
     * Return the most recent session summary.
     * @returns {Object|null}
     */
    function getSessionSummary() {
        return lastSessionSummary;
    }

    // Listen for session completion to auto-record summary
    window.EventBus.on('typing:complete', async data => {
        await recordSession(data);
    });

    // Export minimal API
    window.StatsManager = {
        recordSession,
        getSessionSummary,
    };
})();
