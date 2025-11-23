// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Modal Manager module
 * Handles modal rendering, content generation, and user interactions
 * Depends on: events.js (EventBus)
 */
(() => {
    if (!window.EventBus) {
        console.error('EventBus not available. Include events.js before modals.js');
        return;
    }

    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalClose = document.getElementById('modal-close');

    /**
     * Format time in mm:ss format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Convert CSS color value to hex
     * @param {string} value - CSS color value
     * @returns {string|null} Hex color or null
     */
    function toHex(value) {
        if (!value) return null;
        const trimmed = value.trim();
        if (trimmed.startsWith('#')) return trimmed;
        const rgbMatch = trimmed.match(
            /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)$/i,
        );
        if (rgbMatch) {
            const hex = [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
                .map(x => Number(x).toString(16).padStart(2, '0'))
                .join('');
            return `#${hex}`;
        }
        return null;
    }

    /**
     * Generate session summary HTML
     * @param {Object} data - Session data
     * @returns {string} HTML content
     */
    function generateSessionSummary(data) {
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
                        <span class="summary-value">${formatTime(data.duration || 0)}</span>
                    </div>
                </div>
                ${
                    data.totalErrors > 0
                        ? `
                    <div class="summary-errors">
                        <h3>Errors: ${data.totalErrors}</h3>
                        <p>Total keystrokes: ${data.totalKeystrokes || 0}</p>
                    </div>
                `
                        : ''
                }
            </div>
        `;
    }

    /**
     * Generate color settings HTML
     * @param {Object} data - Settings data with theme
     * @returns {string} HTML content
     */
    function generateColorSettings(data) {
        const theme = data?.theme || 'dark';
        const savedColors = window.ColorSettings?.getColors(theme) || {};

        // Read current CSS values (from theme or custom overrides)
        const styleTarget = document.body || document.documentElement;
        const style = getComputedStyle(styleTarget);

        const getColor = varName => {
            const saved = savedColors[varName];
            if (saved) return saved;
            const computed = style.getPropertyValue(varName);
            return toHex(computed) || '#000000';
        };

        return `
            <div class="color-settings">
                <p class="color-theme-label">Editing: <strong>${theme}</strong> theme</p>
                <div class="color-group">
                    <label class="color-row">
                        <span>Background</span>
                        <input type="color" data-var="--bg" value="${getColor('--bg')}">
                    </label>
                    <label class="color-row">
                        <span>Text & Keys</span>
                        <input type="color" data-var="--accent" value="${getColor('--accent')}">
                    </label>
                    <label class="color-row">
                        <span>UI Text</span>
                        <input type="color" data-var="--text-default" value="${getColor('--text-default')}">
                    </label>
                    <label class="color-row">
                        <span>Error</span>
                        <input type="color" data-var="--error-text" value="${getColor('--error-text')}">
                    </label>
                </div>
                <div class="color-actions">
                    <button type="button" class="color-btn" id="color-reset">Reset</button>
                    <button type="button" class="color-btn color-btn-primary" id="color-save">Save</button>
                </div>
            </div>
        `;
    }

    /**
     * Bind color settings event handlers
     * @param {string} theme - Current theme name
     */
    function bindColorSettingsHandlers(theme) {
        const inputs = modalContent.querySelectorAll('input[type="color"]');

        // Live preview on change
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (window.ColorSettings) {
                    window.ColorSettings.preview(input.dataset.var, input.value);
                }
            });
        });

        // Save button
        const saveBtn = document.getElementById('color-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const colors = {};
                inputs.forEach(input => {
                    colors[input.dataset.var] = input.value;
                });
                if (window.ColorSettings) {
                    window.ColorSettings.save(theme, colors);
                }
                hideModal();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('color-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (window.ColorSettings) {
                    window.ColorSettings.reset(theme);
                }
                hideModal();
            });
        }
    }

    /**
     * Show modal with content
     * @param {string} type - Modal type ('session-summary', 'settings', 'color-settings')
     * @param {Object} data - Data to display
     */
    function showModal(type, data) {
        if (!modalOverlay || !modalContent) return;

        // Set title based on type
        if (modalTitle) {
            switch (type) {
                case 'session-summary':
                    modalTitle.textContent = 'Session Complete';
                    break;
                case 'settings':
                    modalTitle.textContent = 'Settings';
                    break;
                case 'color-settings':
                    modalTitle.textContent = 'Color Settings';
                    break;
                default:
                    modalTitle.textContent = 'Information';
            }
        }

        // Generate content based on type
        let contentHTML = '';
        switch (type) {
            case 'session-summary':
                contentHTML = data ? generateSessionSummary(data) : '<p>No session data</p>';
                break;
            case 'settings':
                contentHTML = '<p>Settings panel coming soon...</p>';
                break;
            case 'color-settings':
                contentHTML = generateColorSettings(data);
                break;
            default:
                contentHTML = '<p>No content available</p>';
        }

        modalContent.innerHTML = contentHTML;
        modalOverlay.classList.remove('modal-hidden');

        // Bind handlers for color settings
        if (type === 'color-settings') {
            bindColorSettingsHandlers(data?.theme || 'dark');
        }
    }

    /**
     * Hide modal
     */
    function hideModal() {
        if (modalOverlay) {
            modalOverlay.classList.add('modal-hidden');
            // Clear any unsaved color preview
            if (window.ColorSettings?.clearPreview) {
                window.ColorSettings.clearPreview();
            }
            window.EventBus.emit('modal:closed');
        }
    }

    /**
     * Check if modal is currently visible
     * @returns {boolean}
     */
    function isVisible() {
        return modalOverlay && !modalOverlay.classList.contains('modal-hidden');
    }

    // Modal close handlers
    if (modalClose) {
        modalClose.addEventListener('click', hideModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', e => {
            if (e.target === modalOverlay) {
                hideModal();
            }
        });
    }

    // Keyboard shortcut: Escape to close modal
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isVisible()) {
            hideModal();
        }
    });

    // Export API
    window.ModalManager = {
        show: showModal,
        hide: hideModal,
        isVisible,
    };
})();
