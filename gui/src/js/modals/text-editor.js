// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Text Editor modal renderer
 * Provides UI for creating and editing typing texts
 */
(() => {
    if (!window.ModalManager) {
        console.error('ModalManager not available. Include modals/core.js first');
        return;
    }

    const esc = window.AppUtils?.escapeHtml || (s => String(s ?? ''));

    /**
     * Generate text editor HTML
     * @param {Object} data - Editor configuration
     * @returns {string} HTML content
     */
    function render(data) {
        const { mode, text, categories, selectedCategory } = data;
        const isEdit = mode === 'edit' && text;
        const title = esc(isEdit ? text.title : '');
        const content = esc(isEdit ? text.content : '');
        const language = esc(isEdit ? text.language || 'text' : 'text');
        const categoryId = isEdit ? text.categoryId : selectedCategory || '';

        // Find current category name for display
        const currentCat = (categories || []).find(c => c.id === categoryId);
        const categoryName = esc(currentCat?.name || '');

        // Build datalist options
        const categoryOptions = (categories || [])
            .map(c => `<option value="${esc(c.name)}" data-id="${esc(c.id)}">`)
            .join('');
        const languageKeys = window.SupportedLanguages?.keys() || [];
        const languageOptions = languageKeys.map(l => `<option value="${esc(l)}">`).join('');
        const textId = esc(isEdit ? text.id : '');

        return `
            <div class="text-editor" data-mode="${esc(mode)}" data-id="${textId}">
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
     * @param {Object} data - Original modal data
     * @param {HTMLElement} container - Modal content container
     */
    function bind(data, container) {
        const editor = container.querySelector('.text-editor');
        if (!editor) return;

        const isEdit = editor.dataset.mode === 'edit';
        const textId = editor.dataset.id || null;
        const categories = data.categories || [];

        // Save button
        const saveBtn = container.querySelector('#editor-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const titleInput = container.querySelector('#text-title');
                const contentInput = container.querySelector('#text-content');
                const categoryInput = container.querySelector('#text-category');
                const languageInput = container.querySelector('#text-language');

                const titleVal = titleInput?.value.trim();
                const contentVal = contentInput?.value;
                const categoryVal = categoryInput?.value.trim() || '';
                const languageVal = languageInput?.value.trim() || 'text';

                if (!titleVal) {
                    titleInput?.focus();
                    return;
                }
                if (!contentVal) {
                    contentInput?.focus();
                    return;
                }

                // Validate and sanitize language
                const language = window.SupportedLanguages?.sanitize?.(languageVal) || 'text';

                // Resolve category
                const existingCat = categories.find(
                    c => c.name.toLowerCase() === categoryVal.toLowerCase(),
                );

                const textData = {
                    id: isEdit ? textId : null,
                    title: titleVal,
                    content: contentVal,
                    categoryId: existingCat?.id || '',
                    categoryName: categoryVal,
                    language,
                    isFavorite: data.text?.isFavorite || false,
                    createdAt: data.text?.createdAt || null,
                };

                window.EventBus?.emit('text:save', textData);
            });
        }

        // Cancel button
        const cancelBtn = container.querySelector('#editor-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => window.ModalManager.hide());
        }
    }

    /**
     * Get title based on mode
     * @param {Object} data
     * @returns {string}
     */
    function getTitle(data) {
        return data?.mode === 'edit' ? 'Edit' : 'Add New';
    }

    // Register with ModalManager
    window.ModalManager.registerType('text-editor', {
        title: getTitle,
        render,
        bind,
    });
})();
