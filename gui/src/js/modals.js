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
     * Generate text editor HTML with editable category and language fields
     *
     * Category field behavior:
     * - Displays as <input> with <datalist> for autocomplete suggestions
     * - Shows existing category names in dropdown
     * - User can type a new category name to create it on save
     * - Case-insensitive matching against existing categories
     * - Empty value defaults to "Uncategorized"
     *
     * Language field behavior:
     * - Displays as <input> with <datalist> for autocomplete suggestions
     * - Supports: text, go, js, py, rust, java, c, cpp (from SupportedLanguages)
     * - User can type any value, but it will be sanitized to valid language on save
     * - Invalid values default to "text"
     *
     * @param {Object} data - Editor configuration
     * @param {string} data.mode - 'edit' or 'create'
     * @param {Object} [data.text] - Text object when editing (undefined for create)
     * @param {Array<Object>} data.categories - Available categories [{id, name, icon}, ...]
     * @param {string} [data.selectedCategory] - Pre-selected category ID for new texts
     * @returns {string} HTML content for text editor modal
     */
    function generateTextEditor(data) {
        const { mode, text, categories, selectedCategory } = data;
        const isEdit = mode === 'edit' && text;
        const title = isEdit ? text.title : '';
        const content = isEdit ? text.content : '';
        const language = isEdit ? text.language || 'text' : 'text';
        const categoryId = isEdit ? text.categoryId : selectedCategory || '';
        // Find current category name for display
        const currentCat = (categories || []).find(c => c.id === categoryId);
        const categoryName = currentCat?.name || '';
        // Build datalist options
        const categoryOptions = (categories || [])
            .map(c => `<option value="${c.name}" data-id="${c.id}">`)
            .join('');
        const languageKeys = window.SupportedLanguages?.keys() || [];
        const languageOptions = languageKeys.map(l => `<option value="${l}">`).join('');
        return `
            <div class="text-editor" data-mode="${mode}" data-id="${isEdit ? text.id : ''}">
                <div class="editor-field">
                    <label for="text-title">Title</label>
                    <input type="text" id="text-title" value="${title}" placeholder="My typing text" required>
                </div>
                <div class="editor-row">
                    <div class="editor-field">
                        <label for="text-category">Category</label>
                        <input type="text" id="text-category" list="category-list" value="${categoryName}" placeholder="Uncategorized">
                        <datalist id="category-list">${categoryOptions}</datalist>
                    </div>
                    <div class="editor-field">
                        <label for="text-language">Language</label>
                        <input type="text" id="text-language" list="language-list" value="${language}" placeholder="text">
                        <datalist id="language-list">${languageOptions}</datalist>
                    </div>
                </div>
                <div class="editor-field">
                    <label for="text-content">Content</label>
                    <textarea id="text-content" rows="12" placeholder="Enter the text to practice typing..." required>${content}</textarea>
                </div>
                <div class="editor-actions">
                    <button type="button" id="editor-cancel">Cancel</button>
                    <button type="button" id="editor-save">Save</button>
                </div>
            </div>
        `;
    }

    /**
     * Bind text editor event handlers
     *
     * Save handler behavior:
     * 1. Validates title and content (required fields)
     * 2. Sanitizes language input to valid language key
     * 3. Resolves category by name (case-insensitive):
     *    - If name matches existing category → use existing categoryId
     *    - If name is new → pass categoryName to create new category on internal layer
     * 4. Emits 'text:save' event with textData payload
     *
     * @param {Object} data - Original modal data
     * @param {Array<Object>} data.categories - Available categories for resolution
     * @param {Object} [data.text] - Existing text data when editing
     */
    function bindTextEditorHandlers(data) {
        const editor = modalContent.querySelector('.text-editor');
        if (!editor) return;
        const isEdit = editor.dataset.mode === 'edit';
        const textId = editor.dataset.id || null;
        const categories = data.categories || [];
        // Save button
        const saveBtn = document.getElementById('editor-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const title = document.getElementById('text-title')?.value.trim();
                const content = document.getElementById('text-content')?.value;
                const categoryInput = document.getElementById('text-category')?.value.trim() || '';
                const languageInput =
                    document.getElementById('text-language')?.value.trim() || 'text';
                if (!title) {
                    document.getElementById('text-title')?.focus();
                    return;
                }
                if (!content) {
                    document.getElementById('text-content')?.focus();
                    return;
                }
                // Validate and sanitize language input
                const language = window.SupportedLanguages?.sanitize?.(languageInput) || 'text';
                // Resolve category: find existing by name or pass new name
                const existingCat = categories.find(
                    c => c.name.toLowerCase() === categoryInput.toLowerCase(),
                );
                const textData = {
                    id: isEdit ? textId : null,
                    title,
                    content,
                    categoryId: existingCat?.id || '',
                    categoryName: categoryInput, // for creating new category if needed
                    language,
                    isFavorite: data.text?.isFavorite || false,
                    createdAt: data.text?.createdAt || null,
                };
                window.EventBus?.emit('text:save', textData);
            });
        }
        // Cancel button
        document.getElementById('editor-cancel')?.addEventListener('click', hideModal);
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
     * @param {string} type - Modal type ('session-summary', 'settings', 'color-settings', 'text-editor', 'error')
     * @param {Object} data - Data to display
     */
    function showModal(type, data) {
        if (!modalOverlay || !modalContent) return;
        // Set title based on type
        if (modalTitle) {
            switch (type) {
                case 'session-summary':
                    modalTitle.textContent = data?.isCompleted
                        ? 'Session Complete'
                        : 'Session Paused';
                    break;
                case 'settings':
                    modalTitle.textContent = 'Settings';
                    break;
                case 'color-settings':
                    modalTitle.textContent = 'Color Settings';
                    break;
                case 'text-editor':
                    modalTitle.textContent = data?.mode === 'edit' ? 'Edit' : 'Add New';
                    break;
                case 'error':
                    modalTitle.textContent = 'Error';
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
            case 'error':
                contentHTML = `<div class="error-message"><p>${data?.message || 'An error occurred'}</p><button type="button" id="error-ok">OK</button></div>`;
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
        } else if (type === 'error') {
            document.getElementById('error-ok')?.addEventListener('click', hideModal);
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

    /**
     * Show confirmation dialog
     * @param {Object} options - Confirmation options
     * @param {string} options.title - Dialog title
     * @param {string} options.message - Confirmation message
     * @param {string} options.confirmText - Confirm button text
     * @param {string} options.cancelText - Cancel button text
     * @returns {Promise<boolean>} true if confirmed, false if cancelled
     */
    function showConfirm(options) {
        const {
            title = 'Confirm',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
        } = options;

        return new Promise(resolve => {
            if (modalTitle) modalTitle.textContent = title;
            modalContent.innerHTML = `
                <div class="confirm-dialog">
                    <p class="confirm-message">${message}</p>
                    <div class="confirm-actions">
                        <button type="button" class="btn-secondary" data-action="cancel">${cancelText}</button>
                        <button type="button" class="btn-danger" data-action="confirm">${confirmText}</button>
                    </div>
                </div>
            `;

            const handleClick = e => {
                const action = e.target.dataset?.action;
                if (action === 'confirm') {
                    resolve(true);
                    hideModal();
                } else if (action === 'cancel') {
                    resolve(false);
                    hideModal();
                }
            };

            modalContent.addEventListener('click', handleClick, { once: true });
            modalOverlay.classList.remove('modal-hidden');
        });
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

    // Export API
    window.ModalManager = {
        show: showModal,
        hide: hideModal,
        isVisible,
        confirm: showConfirm,
    };
})();
