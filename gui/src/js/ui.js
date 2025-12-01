// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * UI Manager module
 * Handles text rendering and stats updates
 * Depends on: events.js (EventBus), modals.js (ModalManager)
 */
(() => {
    if (!window.EventBus) {
        console.error('EventBus not available. Include events.js before ui.js');
        return;
    }

    const textDisplay = document.getElementById('text-display');
    const textInput = document.getElementById('text-input');
    const statsBar = {
        wpm: document.getElementById('wpm'),
        cpm: document.getElementById('cpm'),
        accuracy: document.getElementById('accuracy'),
        timer: document.getElementById('timer'),
    };

    let characterElements = [];
    let cursorIndex = 0;
    let suppressSelectionSync = false;

    /**
     * Ensure the cursor position is visible within the text container
     * @param {number} index - Character index (allows length for end-of-text)
     */
    function ensureCursorVisible(index) {
        if (!textDisplay || characterElements.length === 0) return;
        const lastIndex = characterElements.length - 1;
        const targetIndex = index <= lastIndex ? Math.max(index, 0) : lastIndex;
        if (targetIndex < 0 || targetIndex > lastIndex) return;

        const target = characterElements[targetIndex];
        const containerRect = textDisplay.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const padding = 12;

        const isAbove = targetRect.top < containerRect.top + padding;
        const isBelow = targetRect.bottom > containerRect.bottom - padding;
        if (!isAbove && !isBelow) return;

        requestAnimationFrame(() => {
            target.scrollIntoView({
                block: isAbove ? 'start' : 'end',
                inline: 'nearest',
                behavior: 'smooth',
            });
        });
    }

    /**
     * Render text with character-level elements
     * @param {string} text - Text to render
     */
    function renderText(text) {
        if (!textDisplay) return;

        characterElements = [];
        cursorIndex = -1;

        // Clear existing content
        textDisplay.innerHTML = '';

        const fragment = document.createDocumentFragment();
        let lineStartIndex = 0;

        // Create character elements
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const span = document.createElement('span');
            span.className = 'char';
            // Render character
            if (char === ' ') {
                const lockSpace = i === lineStartIndex + 1 && text[lineStartIndex] === '-';
                span.textContent = lockSpace ? '\u00A0' : ' ';
            } else if (char === '\r') {
                // Skip carriage returns (CRLF handling)
                span.textContent = '';
            } else {
                span.textContent = char;
            }

            span.dataset.index = i;
            characterElements.push(span);
            fragment.appendChild(span);

            // Track line boundaries
            if (char === '\n') {
                lineStartIndex = i + 1;
            }
        }
        textDisplay.appendChild(fragment);

        // Sync textarea with text content
        if (textInput) {
            textInput.value = text;
        }
        // Ensure caret starts at beginning
        setCursorPosition(0, { emit: false });

        // Focus textarea to enable keyboard navigation immediately
        if (textInput) {
            requestAnimationFrame(() => textInput.focus());
        }
    }

    /**
     * Update cursor position and notify typing engine
     * @param {number} index - Character index (allows length for end-of-text)
     * @param {Object} options - Control sync behavior
     * @param {boolean} [options.syncInput=true] - Sync textarea selection
     * @param {boolean} [options.emit=true] - Emit cursor move event
     */
    function setCursorPosition(index, options = {}) {
        const { syncInput = true, emit = true } = options;
        const length = characterElements.length;
        if (length === 0) {
            cursorIndex = 0;
            if (syncInput && textInput && textInput.selectionStart !== 0) {
                suppressSelectionSync = true;
                textInput.setSelectionRange(0, 0);
                suppressSelectionSync = false;
            }
            if (emit) {
                window.EventBus.emit('cursor:move', { index: 0 });
            }
            return;
        }

        const clamped = Math.max(0, Math.min(index, length));
        if (cursorIndex !== clamped) {
            if (cursorIndex >= 0 && cursorIndex < length) {
                characterElements[cursorIndex].classList.remove('current');
            }
            if (clamped < length) {
                characterElements[clamped].classList.add('current');
            }
            cursorIndex = clamped;
            ensureCursorVisible(clamped);
        }

        if (syncInput && textInput && textInput.selectionStart !== clamped) {
            suppressSelectionSync = true;
            textInput.setSelectionRange(clamped, clamped);
            suppressSelectionSync = false;
        }
        if (emit) {
            window.EventBus.emit('cursor:move', { index: clamped });
        }
    }
    // Handle textarea cursor changes (arrow keys)
    // Note: textarea has pointer-events: none, so mouse events go to textDisplay
    if (textInput) {
        const scheduleCursorSync = () => {
            requestAnimationFrame(() => {
                if (suppressSelectionSync) return;
                const pos = textInput.selectionStart;
                if (pos === null || pos === undefined) return;
                setCursorPosition(pos, { syncInput: false });
            });
        };
        textInput.addEventListener('select', () => {
            if (suppressSelectionSync) return;
            const pos = textInput.selectionStart;
            if (pos === null || pos === undefined) return;
            setCursorPosition(pos, { syncInput: false });
        });
        textInput.addEventListener('keydown', e => {
            if (window.KeyUtils?.isNavigationKey?.(e.key)) {
                scheduleCursorSync();
            }
            if (e.key === 'Tab') {
                e.preventDefault();
            }
        });
        // Prevent actual text input in textarea (typing engine handles input)
        textInput.addEventListener('beforeinput', e => {
            e.preventDefault();
        });
        // Prevent context menu on right-click
        textInput.addEventListener('contextmenu', e => {
            e.preventDefault();
        });
    }
    if (textDisplay) {
        textDisplay.addEventListener('mousedown', e => {
            const element = e.target instanceof Element ? e.target : null;
            const target = element?.closest('.char');
            if (!target) {
                textInput?.focus();
                setCursorPosition(characterElements.length, { syncInput: true });
                return;
            }
            e.preventDefault();
            const index = Number(target.dataset.index);
            textInput?.focus();
            if (!Number.isNaN(index)) {
                setCursorPosition(index, { syncInput: true });
            }
        });
        // Prevent context menu on right-click
        textDisplay.addEventListener('contextmenu', e => {
            e.preventDefault();
        });
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
        if (statsBar.timer) {
            const formatter = window.AppUtils?.formatTime;
            statsBar.timer.textContent = formatter ? formatter(time) : `${Math.floor(time ?? 0)}`;
        }
    }

    /**
     * Show modal with content (delegates to ModalManager)
     * @param {string} type - Modal type ('session-summary', 'settings', etc.)
     * @param {Object} data - Data to display
     */
    function showModal(type, data) {
        if (window.ModalManager) {
            window.ModalManager.show(type, data);
        }
    }

    /**
     * Hide modal (delegates to ModalManager)
     */
    function hideModal() {
        if (window.ModalManager) {
            window.ModalManager.hide();
        }
    }
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
        }
    });
    // Sync cursor position from typing engine
    window.EventBus.on('cursor:sync', data => {
        if (typeof data.index === 'number') {
            setCursorPosition(data.index, { syncInput: true, emit: false });
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
        data.isCompleted = true; // Session completed
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
