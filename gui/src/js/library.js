// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Library Manager
 * Manages text library sidebar: categories, text list, CRUD operations
 */
(() => {
    const esc = window.AppUtils?.escapeHtml || (s => String(s ?? ''));

    const state = {
        library: null,
        selectedCategory: null, // null = All, string = category id
        isExpanded: false, // whether text list is visible (collapsed by default)
        isVisible: false,
    };

    const getEl = id => document.getElementById(id);

    /**
     * Load library from internal layer
     * @returns {Promise<Object|null>}
     */
    async function loadLibrary() {
        if (!window.go?.app?.App?.TextLibrary) return null;
        try {
            state.library = await window.go.app.App.TextLibrary();
            return state.library;
        } catch (err) {
            console.error('Failed to load library:', err);
            return null;
        }
    }

    /**
     * Normalize language value
     * @param {string} lang
     * @returns {string}
     */
    function normalizeLanguage(lang) {
        return window.SupportedLanguages?.sanitize?.(lang) || 'text';
    }

    /**
     * Get language icon
     * @param {string} lang
     * @returns {string}
     */
    function langIcon(lang) {
        return window.SupportedLanguages?.getIcon?.(normalizeLanguage(lang)) || '📄';
    }

    /**
     * Render category tree with nested text items
     */
    function renderCategories() {
        const container = getEl('category-tree');
        if (!container || !state.library) return;
        const { categories, texts } = state.library;
        // Count texts per category
        const counts = {};
        texts.forEach(t => {
            counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
        });
        // Build category items with nested text lists
        const allCount = texts.length;
        const isAllActive = !state.selectedCategory;
        const allExpanded = isAllActive && state.isExpanded;
        let html = '<ul class="category-list">';
        // "All" category
        html += `<li class="category-item${isAllActive ? ' active' : ''}${allExpanded ? ' expanded' : ''}" data-category="">
            <span class="icon">📚</span>
            <span>All</span>
            <span class="count">${allCount}</span>
        </li>`;
        if (allExpanded) {
            html += renderTextsForCategory(null);
        }
        // Regular categories
        categories.forEach(cat => {
            const isActive = state.selectedCategory === cat.id;
            const isExpanded = isActive && state.isExpanded;
            const count = counts[cat.id] || 0;
            const icon = esc(cat.icon || '📁');
            const catId = esc(cat.id);
            const catName = esc(cat.name);
            html += `<li class="category-item${isActive ? ' active' : ''}${isExpanded ? ' expanded' : ''}" data-category="${catId}">
                <span class="icon">${icon}</span>
                <span>${catName}</span>
                <span class="spacer"></span>
                <span class="count">${count}</span>
                <button class="delete-btn" data-id="${catId}" title="Delete category">🗑️</button>
            </li>`;
            if (isExpanded) {
                html += renderTextsForCategory(cat.id);
            }
        });

        html += '</ul>';
        container.innerHTML = html;

        // Bind category click handlers
        container.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.closest('.delete-btn')) return;
                const clickedCat = item.dataset.category || null;
                if (state.selectedCategory === clickedCat) {
                    state.isExpanded = !state.isExpanded;
                } else {
                    state.selectedCategory = clickedCat;
                    state.isExpanded = true;
                }
                renderCategories();
            });
        });

        // Bind category delete button handlers
        container.querySelectorAll('.category-item .delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                deleteCategory(btn.dataset.id);
            });
        });

        // Bind text item handlers
        bindTextItemHandlers(container);
    }

    /**
     * Render text items for a specific category
     * @param {string|null} categoryId - Category ID or null for all texts
     * @returns {string} HTML for text items
     */
    function renderTextsForCategory(categoryId) {
        const texts = state.library.texts.filter(t =>
            categoryId === null ? true : t.categoryId === categoryId,
        );

        if (texts.length === 0) {
            return `<div class="library-empty">
                <p>No texts in this category</p>
                <button class="empty-add-text" data-category="${esc(categoryId || '')}">+ Add</button>
            </div>`;
        }

        let html = '<div>';
        texts.forEach(text => {
            const fav = text.isFavorite ? '<span class="favorite">★</span>' : '';
            const lang = normalizeLanguage(text.language);
            const langLabel = lang === 'text' ? 'Text' : esc(lang);
            const textId = esc(text.id);
            const textTitle = esc(text.title);
            html += `<div class="text-item" data-id="${textId}">
                <div class="text-item-title">${fav}${textTitle}</div>
                <div class="text-item-meta">
                    <span>${langIcon(lang)} ${langLabel}</span>
                </div>
                <div class="text-item-actions">
                    <button class="icon-btn edit-btn" data-id="${textId}" title="Edit">✏️</button>
                    <button class="icon-btn delete-btn" data-id="${textId}" title="Delete">🗑️</button>
                </div>
            </div>`;
        });
        html += '</div>';
        return html;
    }

    /**
     * Bind event handlers for text items
     * @param {HTMLElement} container - Container element
     */
    function bindTextItemHandlers(container) {
        // Empty state add buttons
        container.querySelectorAll('.empty-add-text').forEach(btn => {
            btn.addEventListener('click', () => openEditor(null));
        });

        // Text item click
        container.querySelectorAll('.text-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.closest('button')) return;
                selectText(item.dataset.id);
            });
        });

        // Edit buttons
        container.querySelectorAll('.text-item .edit-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                openEditor(btn.dataset.id);
            });
        });

        // Delete buttons
        container.querySelectorAll('.text-item .delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                deleteText(btn.dataset.id);
            });
        });
    }

    /**
     * Render text list - now just calls renderCategories
     * @deprecated This function is kept for compatibility but delegates to renderCategories
     */
    function renderTextList() {
        // Text list is now rendered inline with categories
        // This function is kept for API compatibility
    }

    /**
     * Select text and load for typing
     * @param {string} textId
     */
    async function selectText(textId) {
        if (!textId) return;
        hide();
        await window.SessionManager?.loadText(textId);
    }

    /**
     * Open text editor modal
     * @param {string|null} textId - null for new text
     */
    async function openEditor(textId) {
        const mode = textId ? 'edit' : 'create';
        let textData = null;
        if (textId && window.go?.app?.App?.Text) {
            try {
                textData = await window.go.app.App.Text(textId);
            } catch (err) {
                console.error('Failed to load text:', err);
                return;
            }
        }
        window.ModalManager?.show('text-editor', {
            mode,
            text: textData,
            categories: state.library?.categories || [],
            selectedCategory: state.selectedCategory,
        });
    }

    /**
     * Save text (create or update) with automatic category creation
     *
     * Category creation logic:
     * - If textData.categoryName is provided and categoryId is empty:
     *   1. Creates new category with UUID, provided name, and default folder icon
     *   2. Calls internal layer SaveCategory() to persist
     *   3. Updates textData.categoryId with new category ID
     * - If SaveCategory() fails (duplicate name, validation error):
     *   - Shows error modal to user
     *   - Returns false without saving text
     *
     * Text save logic:
     * - If textData.id exists → UpdateText() (edit mode)
     * - If textData.id is null → SaveText() with new UUID (create mode)
     * - On success: refreshes library and returns true
     * - On failure: shows error modal and returns false
     *
     * @param {Object} textData - Text payload
     * @param {string|null} textData.id - Text ID (null for new texts)
     * @param {string} textData.title - Text title (required)
     * @param {string} textData.content - Text content (required)
     * @param {string} textData.categoryId - Category ID (empty for uncategorized)
     * @param {string} [textData.categoryName] - New category name to create (optional)
     * @param {string} textData.language - Language key (validated/sanitized)
     * @param {boolean} textData.isFavorite - Favorite flag
     * @param {string|null} textData.createdAt - Creation timestamp (ISO string)
     * @returns {Promise<boolean>} true on success, false on failure
     */
    async function saveText(textData) {
        if (!window.go?.app?.App) return false;
        try {
            // Handle new category creation if categoryName provided without existing categoryId
            if (textData.categoryName && !textData.categoryId) {
                const newCat = {
                    id: crypto.randomUUID(),
                    name: textData.categoryName,
                    icon: '📁',
                };
                await window.go.app.App.SaveCategory(newCat);
                textData.categoryId = newCat.id;
            }
            delete textData.categoryName; // clean up before sending to internal layer
            if (textData.id) {
                await window.go.app.App.UpdateText(textData);
            } else {
                textData.id = crypto.randomUUID();
                textData.createdAt = new Date().toISOString();
                await window.go.app.App.SaveText(textData);
            }
            await refresh();
            return true;
        } catch (err) {
            console.error('Failed to save text:', err);
            showErrorAlert(err.message || 'Failed to save text. Please try again.');
            return false;
        }
    }

    /**
     * Show error alert to user
     * @param {string} message - Error message
     */
    function showErrorAlert(message) {
        if (window.ModalManager?.show) {
            window.ModalManager.show('error', { message });
        } else {
            console.error('Error:', message);
        }
    }

    /**
     * Delete text with confirmation
     * @param {string} textId
     */
    async function deleteText(textId) {
        const text = state.library?.texts.find(t => t.id === textId);
        if (!text) return;

        const confirmed = await window.ModalManager.confirm({
            title: 'Delete Text',
            message: `Delete "${text.title}"?\nThis action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });
        if (!confirmed) return;

        try {
            await window.go.app.App.DeleteText(textId);
            await refresh();
        } catch (err) {
            console.error('Failed to delete text:', err);
        }
    }

    /**
     * Delete category with confirmation
     * @param {string} categoryId
     */
    async function deleteCategory(categoryId) {
        const category = state.library?.categories.find(c => c.id === categoryId);
        if (!category) return;

        // Check if category has texts
        const textsInCategory = state.library?.texts.filter(t => t.categoryId === categoryId) || [];
        const warningMsg =
            textsInCategory.length > 0
                ? `Category "${category.name}" contains ${textsInCategory.length} text(s).\nTexts will become uncategorized.\n\nDelete category?`
                : `Delete category "${category.name}"?`;

        const confirmed = await window.ModalManager.confirm({
            title: 'Delete Category',
            message: warningMsg,
            confirmText: 'Delete',
            cancelText: 'Cancel',
        });
        if (!confirmed) return;

        try {
            await window.go.app.App.DeleteCategory(categoryId);
            // Reset selection if deleted category was selected
            if (state.selectedCategory === categoryId) {
                state.selectedCategory = null;
                state.isExpanded = false;
            }
            await refresh();
        } catch (err) {
            console.error('Failed to delete category:', err);
            showErrorAlert(err.message || 'Failed to delete category. Please try again.');
        }
    }

    /**
     * Refresh library from internal layer
     */
    async function refresh() {
        await loadLibrary();
        renderCategories();
        renderTextList();
    }

    /**
     * Show sidebar
     */
    async function show() {
        const sidebar = getEl('library-sidebar');
        if (!sidebar) return;
        if (!state.library) await loadLibrary();
        renderCategories();
        renderTextList();
        sidebar.classList.add('visible');
        state.isVisible = true;
    }

    /**
     * Hide sidebar
     */
    function hide() {
        const sidebar = getEl('library-sidebar');
        if (sidebar) {
            sidebar.classList.remove('visible');
            state.isVisible = false;
        }
    }

    /**
     * Toggle sidebar
     */
    function toggle() {
        state.isVisible ? hide() : show();
    }

    /**
     * Check if sidebar is visible
     * @returns {boolean}
     */
    function isVisible() {
        return state.isVisible;
    }

    /**
     * Initialize library manager
     */
    function init() {
        // Bind control buttons
        getEl('library-toggle')?.addEventListener('click', e => {
            toggle();
            e.currentTarget.blur();
        });
        getEl('text-add')?.addEventListener('click', e => {
            openEditor(null);
            e.currentTarget.blur();
        });
        getEl('sidebar-close')?.addEventListener('click', hide);
        // Listen for text save from modal
        window.EventBus?.on('text:save', async data => {
            const success = await saveText(data);
            if (success) window.ModalManager?.hide();
        });
    }

    // Export API
    window.LibraryManager = {
        init,
        show,
        hide,
        toggle,
        isVisible,
        refresh,
        selectText,
        openEditor,
        saveText,
        deleteText,
        deleteCategory,
    };
})();
