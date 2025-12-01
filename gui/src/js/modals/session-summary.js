// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Session Summary modal renderer
 * Displays typing session results with stats and error analysis
 */
(() => {
    if (!window.ModalManager) {
        console.error('ModalManager not available. Include modals/core.js first');
        return;
    }

    const esc = window.AppUtils?.escapeHtml || (s => String(s ?? ''));

    /**
     * Return readable label for a key identifier
     * @param {string} key
     * @returns {string} HTML-escaped label
     */
    function formatKeyLabel(key) {
        if (!key) return 'Unknown';
        switch (key) {
            case ' ':
                return 'Space';
            case '\n':
            case 'Enter':
                return 'Enter';
            case '\t':
            case 'Tab':
                return 'Tab';
            case 'Backspace':
                return 'Backspace';
            default:
                return esc(key);
        }
    }

    /**
     * Render list of most frequent mistakes
     * @param {Record<string, number>} mistakes
     * @returns {string}
     */
    function renderMistakeList(mistakes) {
        if (!mistakes) return '';
        const entries = Object.entries(mistakes)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) return '';
        const items = entries
            .map(
                ([key, count]) =>
                    `<li><span class="mistake-key">${formatKeyLabel(key)}</span><span class="mistake-count">${count}</span></li>`,
            )
            .join('');
        return `<div class="summary-mistakes"><h4>Mistyped characters</h4><ul class="mistake-list">${items}</ul></div>`;
    }

    /**
     * Generate session summary HTML
     * @param {Object} data - Session data
     * @returns {string} HTML content
     */
    function render(data) {
        if (!data) return '<p>No session data</p>';
        return `
            <div class="session-summary">
                <div class="summary-stats">
                    <div class="summary-stat">
                        <span class="summary-label">WPM</span>
                        <span class="summary-value">${Math.round(data.wpm || 0)}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-label">CPM</span>
                        <span class="summary-value">${Math.round(data.cpm || 0)}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-label">Accuracy</span>
                        <span class="summary-value">${(data.accuracy || 0).toFixed(1)}%</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-label">Time</span>
                        <span class="summary-value">${window.AppUtils?.formatTime?.(data.duration || 0) ?? '00:00'}</span>
                    </div>
                </div>
                ${
                    data.totalErrors > 0
                        ? `
                    <div class="summary-errors">
                        <h3>Errors: ${data.totalErrors}</h3>
                        <p>Total keystrokes: ${data.totalKeystrokes || 0}</p>
                        ${renderMistakeList(data.mistakes)}
                    </div>
                `
                        : ''
                }
            </div>
        `;
    }

    /**
     * Get title based on session state
     * @param {Object} data
     * @returns {string}
     */
    function getTitle(data) {
        return data?.isCompleted ? 'Session Complete' : 'Session Paused';
    }

    // Register with ModalManager
    window.ModalManager.registerType('session-summary', {
        title: getTitle,
        render,
    });
})();
