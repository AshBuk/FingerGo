// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Stats manager
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

    /**
     * Map mistake count to heatmap color
     * @param {number} count
     * @returns {string} CSS color
     */
    function getHeatmapColor(count) {
        if (!count || count <= 0) return 'rgba(0, 0, 0, 0)';
        if (count <= 2) return 'rgba(255, 235, 59, 0.30)'; // Yellow
        if (count <= 5) return 'rgba(255, 152, 0, 0.50)'; // Orange
        if (count <= 9) return 'rgba(244, 67, 54, 0.70)'; // Red
        return 'rgba(183, 28, 28, 0.90)'; // Dark Red
    }

    /**
     * Apply keyboard heatmap overlay
     * @param {Record<string, number>} mistakes
     */
    function renderHeatmap(mistakes) {
        if (!mistakes) return;
        const keyEls = document.querySelectorAll('#keyboard .key');
        // Reset all first
        keyEls.forEach(el => el.style.removeProperty('--heatmap-color'));
        // Apply per key
        Object.keys(mistakes).forEach(key => {
            const count = mistakes[key] || 0;
            const color = getHeatmapColor(count);
            keyEls.forEach(el => {
                if (el.dataset && el.dataset.key === key) {
                    el.style.setProperty('--heatmap-color', color);
                }
            });
        });
    }

    /**
     * Clear heatmap overlay from all keys
     */
    function clearHeatmap() {
        const keyEls = document.querySelectorAll('#keyboard .key');
        keyEls.forEach(el => el.style.removeProperty('--heatmap-color'));
    }

    // Listen for session lifecycle
    window.EventBus.on('typing:start', () => {
        clearHeatmap();
    });

    // Auto-record and render heatmap on completion
    window.EventBus.on('typing:complete', async data => {
        await recordSession(data);
        renderHeatmap(data?.mistakes || {});
    });

    // Export minimal API
    window.StatsManager = {
        recordSession,
        getSessionSummary,
        renderHeatmap,
        clearHeatmap,
    };
})();
