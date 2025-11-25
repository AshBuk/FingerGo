// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Library Manager
 * Manages text library sidebar: categories, text list, CRUD operations
 */
(() => {
    const state = {
        library: null,
        selectedCategory: null,
        isVisible: false,
    };

    const getEl = id => document.getElementById(id);

    /**
     * Load library from backend
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
        return lang || 'text';
    }

    /**
     * Get language icon
     * @param {string} lang
     * @returns {string}
     */
    function langIcon(lang) {
        const icons = { go: '🔵', js: '🟡', py: '🐍', text: '📄' };
        return icons[normalizeLanguage(lang)] || '📄';
    }

    /**
     * Render category tree
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
        // Build category items (flat for now, hierarchical later)
        const allCount = texts.length;
        let html = `<ul class="category-list">
            <li class="category-item${!state.selectedCategory ? ' active' : ''}" data-category="">
                <span class="icon">📚</span>
                <span>All</span>
                <span class="count">${allCount}</span>
            </li>`;
        categories.forEach(cat => {
            const isActive = state.selectedCategory === cat.id;
            const count = counts[cat.id] || 0;
            const icon = cat.icon || '📁';
            html += `<li class="category-item${isActive ? ' active' : ''}" data-category="${cat.id}">
                <span class="icon">${icon}</span>
                <span>${cat.name}</span>
                <span class="count">${count}</span>
            </li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
        // Bind click handlers
        container.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                state.selectedCategory = item.dataset.category || null;
                renderCategories();
                renderTextList();
            });
        });
    }

    /**
     * Render text list filtered by selected category
     */
    function renderTextList() {
        const container = getEl('text-list');
        if (!container || !state.library) return;
        let texts = state.library.texts || [];
        if (state.selectedCategory) {
            texts = texts.filter(t => t.categoryId === state.selectedCategory);
        }
        if (texts.length === 0) {
            container.innerHTML = `<div class="library-empty">
                <p>No texts in this category</p>
                <button id="empty-add-text">+ Add Text</button>
            </div>`;
            getEl('empty-add-text')?.addEventListener('click', () => openEditor(null));
            return;
        }
        let html = '';
        texts.forEach(text => {
            const fav = text.isFavorite ? '<span class="favorite">★</span>' : '';
            const cat = state.library.categories.find(c => c.id === text.categoryId);
            const catName = cat?.name || 'Uncategorized';
            const lang = normalizeLanguage(text.language);
            const langLabel = lang === 'text' ? 'Text' : lang;
            html += `<div class="text-item" data-id="${text.id}">
                <div class="text-item-title">${fav}${text.title}</div>
                <div class="text-item-meta">
                    <span>${langIcon(lang)} ${langLabel}</span>
                    <span>${catName}</span>
                </div>
                <div class="text-item-actions">
                    <button class="icon-btn edit-btn" data-id="${text.id}" title="Edit">✏️</button>
                    <button class="icon-btn delete-btn" data-id="${text.id}" title="Delete">🗑️</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
        // Bind handlers
        container.querySelectorAll('.text-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.closest('button')) return;
                selectText(item.dataset.id);
            });
        });
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                openEditor(btn.dataset.id);
            });
        });
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                deleteText(btn.dataset.id);
            });
        });
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
     * Save text (create or update)
     * @param {Object} textData
     * @returns {Promise<boolean>}
     */
    async function saveText(textData) {
        if (!window.go?.app?.App) return false;
        try {
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
            return false;
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
     * Refresh library from backend
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
    };
})();
