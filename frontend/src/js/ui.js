// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * UI Manager module
 * Handles text rendering, stats updates, and modal management
 * Depends on: events.js (EventBus)
 */
(() => {
    if (!window.EventBus) {
        console.error('EventBus not available. Include events.js before ui.js');
        return;
    }

    const textDisplay = document.getElementById('text-display');
    const statsBar = {
        wpm: document.getElementById('wpm'),
        cpm: document.getElementById('cpm'),
        accuracy: document.getElementById('accuracy'),
        timer: document.getElementById('timer'),
    };

    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalClose = document.getElementById('modal-close');

    let characterElements = [];

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
     * Render text with character-level elements
     * @param {string} text - Text to render
     */
    function renderText(text) {
        if (!textDisplay) return;

        characterElements = [];

        // Clear existing content
        textDisplay.innerHTML = '';

        // Create character elements
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space for regular space
            span.dataset.index = i;
            characterElements.push(span);
            textDisplay.appendChild(span);
        }

        // Set first character as current
        if (characterElements.length > 0) {
            characterElements[0].classList.add('current');
        }
    }

    /**
     * Update character state at index
     * @param {number} index - Character index
     * @param {string} state - State: 'correct', 'error', 'current', 'fade-success'
     */
    function updateCharacter(index, state) {
        if (index < 0 || index >= characterElements.length) return;

        const charEl = characterElements[index];

        switch (state) {
            case 'correct':
                // Remove error and current, add typed and correct
                charEl.classList.remove('error', 'current');
                charEl.classList.add('typed', 'correct');
                break;
            case 'error':
                // Add error but keep current if present (don't remove it)
                charEl.classList.add('typed', 'error');
                // Don't remove 'current' class - error can occur on current character
                break;
            case 'current':
                // Remove error and typed/correct, add current
                charEl.classList.remove('error', 'typed', 'correct');
                charEl.classList.add('current');
                break;
            case 'fade-success':
                // Remove error and current, add typed, correct, and animation
                charEl.classList.remove('error', 'current');
                charEl.classList.add('typed', 'correct', 'fade-success');
                // Remove animation class after animation completes
                setTimeout(() => {
                    charEl.classList.remove('fade-success');
                }, 300);
                break;
        }
    }

    /**
     * Show error highlight at index
     * @param {number} index - Character index
     */
    function showError(index) {
        updateCharacter(index, 'error');
    }

    /**
     * Update statistics bar
     * @param {number} wpm - Words per minute
     * @param {number} cpm - Characters per minute
     * @param {number} accuracy - Accuracy percentage
     * @param {number} time - Time in seconds
     */
    function updateStats(wpm, cpm, accuracy, time) {
        if (statsBar.wpm) statsBar.wpm.textContent = Math.round(wpm);
        if (statsBar.cpm) statsBar.cpm.textContent = Math.round(cpm);
        if (statsBar.accuracy) statsBar.accuracy.textContent = `${accuracy.toFixed(1)}%`;
        if (statsBar.timer) statsBar.timer.textContent = formatTime(time);
    }

    /**
     * Show modal with content
     * @param {string} type - Modal type ('session-summary', 'settings', etc.)
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
        if (type === 'session-summary' && data) {
            contentHTML = `
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
        } else if (type === 'settings') {
            contentHTML = '<p>Settings panel coming soon...</p>';
        } else if (type === 'color-settings') {
            const theme = data?.theme || 'dark';
            const savedColors = window.ColorSettings?.getColors(theme) || {};

            // Read current CSS values (from theme or custom overrides)
            const styleTarget = document.body || document.documentElement;
            const style = getComputedStyle(styleTarget);
            const toHex = value => {
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
            };
            const getColor = varName => {
                const saved = savedColors[varName];
                if (saved) return saved;
                const computed = style.getPropertyValue(varName);
                return toHex(computed) || '#000000';
            };

            contentHTML = `
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
        } else {
            contentHTML = '<p>No content available</p>';
        }

        modalContent.innerHTML = contentHTML;
        modalOverlay.classList.remove('modal-hidden');

        // Bind color settings handlers after DOM is ready
        if (type === 'color-settings') {
            const theme = data?.theme || 'dark';
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
        if (
            e.key === 'Escape' &&
            modalOverlay &&
            !modalOverlay.classList.contains('modal-hidden')
        ) {
            hideModal();
        }
    });

    // Listen to typing events
    window.EventBus.on('typing:start', data => {
        if (data.text) {
            renderText(data.text);
        }
    });

    window.EventBus.on('typing:keystroke', data => {
        if (data.index !== undefined) {
            // Mark the character we just typed as correct
            updateCharacter(data.index, 'correct');
            // Set next character as current (if exists)
            if (data.index + 1 < characterElements.length) {
                updateCharacter(data.index + 1, 'current');
            }
        }
    });

    window.EventBus.on('typing:error', data => {
        if (data.index !== undefined) {
            showError(data.index);
        }
    });

    window.EventBus.on('stats:update', data => {
        updateStats(data.wpm, data.cpm, data.accuracy, data.time);
    });

    window.EventBus.on('typing:complete', data => {
        // Mark all remaining characters as correct
        const currentIndex = data.currentIndex || characterElements.length;
        for (let i = 0; i < currentIndex; i++) {
            if (!characterElements[i].classList.contains('typed')) {
                updateCharacter(i, 'correct');
            }
        }
        // Remove current highlight
        if (currentIndex < characterElements.length) {
            characterElements[currentIndex].classList.remove('current');
        }
        // Show summary modal
        showModal('session-summary', data);
    });

    // Export API
    window.UIManager = {
        renderText,
        updateCharacter,
        updateStats,
        showModal,
        hideModal,
        showError,
    };
})();
