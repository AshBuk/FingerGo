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
     * Persist session to internal layer and cache summary locally.
     * @param {Object} sessionData - Session data from TypingEngine
     */
    async function recordSession(sessionData) {
        if (!sessionData) return;
        lastSessionSummary = { ...sessionData };

        // Persist via Wails bridge if available
        try {
            if (window.go?.app?.App?.SaveSession) {
                // Build payload matching SessionPayload struct
                const textMeta = window.App?.getTextMeta?.() || {};
                const payload = {
                    text: sessionData.text || '',
                    textId: textMeta.textId || '',
                    textTitle: textMeta.textTitle || '',
                    categoryId: textMeta.categoryId || '',
                    mistakes: sessionData.mistakes || {},
                    wpm: sessionData.wpm || 0,
                    cpm: sessionData.cpm || 0,
                    accuracy: sessionData.accuracy || 100,
                    duration: sessionData.duration || 0,
                    startTime: sessionData.startTime || 0,
                    endTime: sessionData.endTime || Date.now(),
                    totalErrors: sessionData.totalErrors || 0,
                    totalKeystrokes: sessionData.totalKeystrokes || 0,
                };
                await window.go.app.App.SaveSession(payload);
            }
        } catch (err) {
            console.warn('StatsManager: failed to save session:', err);
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
     * Build map of key elements (rebuilt each call: layout switch re-renders keys)
     * @returns {Map<string, HTMLElement[]>}
     */
    function getKeyElementsMap() {
        const keyElsMap = new Map();
        document.querySelectorAll('#keyboard .key').forEach(el => {
            const key = el.dataset?.key;
            if (!key) return;
            if (!keyElsMap.has(key)) keyElsMap.set(key, []);
            keyElsMap.get(key).push(el);
        });
        return keyElsMap;
    }

    /**
     * Apply keyboard heatmap overlay
     * @param {Record<string, number>} mistakes - Mistake count by text character
     */
    function renderHeatmap(mistakes) {
        if (!mistakes) return;
        const map = getKeyElementsMap();
        // Reset all keys
        map.forEach(els => els.forEach(el => el.style.removeProperty('--heatmap-color')));
        // Sum mistakes per physical key ("A" and "a" -> "a", "é" -> "´" + "e")
        const layout = window.KeyboardUI?.getCurrentLayout();
        const keyCounts = new Map();
        Object.entries(mistakes).forEach(([char, count]) => {
            if (!count) return;
            window.KeyUtils.keysForChar(char, layout).forEach(key => {
                keyCounts.set(key, (keyCounts.get(key) || 0) + count);
            });
        });
        keyCounts.forEach((count, key) => {
            const color = getHeatmapColor(count);
            map.get(key)?.forEach(el => el.style.setProperty('--heatmap-color', color));
        });
    }

    /**
     * Clear heatmap overlay from all keys
     */
    function clearHeatmap() {
        const map = getKeyElementsMap();
        map.forEach(els => els.forEach(el => el.style.removeProperty('--heatmap-color')));
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
