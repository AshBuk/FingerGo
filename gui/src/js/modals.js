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
     * Return readable label for a key identifier
     * @param {string} key
     * @returns {string}
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
                return key.length === 1 ? key : key;
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
     * Generate text editor HTML
     * @param {Object} data - {mode, text, categories, selectedCategory}
     * @returns {string} HTML content
     */
    function generateTextEditor(data) {
        const { mode, text, categories, selectedCategory } = data;
        const isEdit = mode === 'edit' && text;
        const title = isEdit ? text.title : '';
        const content = isEdit ? text.content : '';
        const language = isEdit ? text.language : 'plain';
        const categoryId = isEdit ? text.categoryId : selectedCategory || '';
        const categoryOptions = (categories || [])
            .map(
                c =>
                    `<option value="${c.id}"${c.id === categoryId ? ' selected' : ''}>${c.name}</option>`,
            )
            .join('');
        return `
            <div class="text-editor" data-mode="${mode}" data-id="${isEdit ? text.id : ''}">
                <div class="editor-field">
                    <label for="text-title">Title</label>
                    <input type="text" id="text-title" value="${title}" placeholder="My typing text" required>
                </div>
                <div class="editor-row">
                    <div class="editor-field">
                        <label for="text-category">Category</label>
                        <select id="text-category">
                            <option value="">Uncategorized</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    <div class="editor-field">
                        <label for="text-language">Language</label>
                        <select id="text-language">
                            <option value="plain"${language === 'plain' ? ' selected' : ''}>Plain Text</option>
                            <option value="go"${language === 'go' ? ' selected' : ''}>Go</option>
                            <option value="js"${language === 'js' ? ' selected' : ''}>JavaScript</option>
                            <option value="py"${language === 'py' ? ' selected' : ''}>Python</option>
                        </select>
                    </div>
                </div>
                <div class="editor-field">
                    <label for="text-content">Content</label>
                    <textarea id="text-content" rows="12" placeholder="Enter the text to practice typing..." required>${content}</textarea>
                </div>
                <div class="editor-actions">
                    <button type="button" id="editor-delete">Delete</button>
                    <button type="button" id="editor-cancel">Cancel</button>
                    <button type="button" id="editor-save">Save</button>
                </div>
            </div>
        `;
    }

    /**
     * Bind text editor event handlers
     * @param {Object} data - Original modal data
     */
    function bindTextEditorHandlers(data) {
        const editor = modalContent.querySelector('.text-editor');
        if (!editor) return;
        const isEdit = editor.dataset.mode === 'edit';
        const textId = editor.dataset.id || null;
        // Save button
        const saveBtn = document.getElementById('editor-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const title = document.getElementById('text-title')?.value.trim();
                const content = document.getElementById('text-content')?.value;
                const categoryId = document.getElementById('text-category')?.value || '';
                const language = document.getElementById('text-language')?.value || 'plain';
                if (!title) {
                    document.getElementById('text-title')?.focus();
                    return;
                }
                if (!content) {
                    document.getElementById('text-content')?.focus();
                    return;
                }
                const textData = {
                    id: isEdit ? textId : null,
                    title,
                    content,
                    categoryId,
                    language,
                    isFavorite: data.text?.isFavorite || false,
                    createdAt: data.text?.createdAt || null,
                };
                window.EventBus?.emit('text:save', textData);
            });
        }
        // Cancel button
        document.getElementById('editor-cancel')?.addEventListener('click', hideModal);
        // Delete button
        const deleteBtn = document.getElementById('editor-delete');
        if (deleteBtn && isEdit && textId) {
            deleteBtn.addEventListener('click', () => {
                window.LibraryManager?.deleteText(textId);
                hideModal();
            });
        }
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
     * @param {string} type - Modal type ('session-summary', 'settings', 'color-settings', 'text-editor')
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
                case 'text-editor':
                    modalTitle.textContent = data?.mode === 'edit' ? 'Edit Text' : 'New Text';
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
            case 'text-editor':
                contentHTML = generateTextEditor(data);
                break;
            default:
                contentHTML = '<p>No content available</p>';
        }
        modalContent.innerHTML = contentHTML;
        modalOverlay.classList.remove('modal-hidden');
        // Bind type-specific handlers
        if (type === 'color-settings') {
            bindColorSettingsHandlers(data?.theme || 'dark');
        } else if (type === 'text-editor') {
            bindTextEditorHandlers(data);
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
