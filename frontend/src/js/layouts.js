// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Keyboard layouts registry
 * Loads layout modules and provides unified API
 */
(() => {
    /**
     * Registry of all available layouts
     * Populated by individual layout modules (en-qwerty.js, etc.)
     */
    const registry = {};

    /**
     * Register a layout
     * @param {Object} layout - Layout definition
     */
    function register(layout) {
        if (!layout.id) {
            console.error('Layout must have an id');
            return;
        }
        registry[layout.id] = layout;
    }

    /**
     * Get layout by ID
     * @param {string} layoutId - Layout identifier (e.g., 'en-qwerty', 'ru-jcuken')
     * @returns {Object|null} Layout object or null if not found
     */
    function getLayout(layoutId) {
        return registry[layoutId] || null;
    }

    /**
     * Get all available layout IDs
     * @returns {string[]} Array of layout identifiers
     */
    function getAvailableLayouts() {
        return Object.keys(registry);
    }

    /**
     * Get default layout (EN QWERTY for MVP)
     * @returns {Object} Default layout
     */
    function getDefaultLayout() {
        return registry['en-qwerty'] || null;
    }

    // Auto-register layouts from window globals (set by layout modules)
    function autoRegister() {
        if (window.LAYOUT_EN_QWERTY) register(window.LAYOUT_EN_QWERTY);
        if (window.LAYOUT_RU_JCUKEN) register(window.LAYOUT_RU_JCUKEN);
    }

    // Export API
    window.KeyboardLayouts = {
        register,
        getLayout,
        getAvailableLayouts,
        getDefaultLayout,
        _autoRegister: autoRegister
    };
})();
