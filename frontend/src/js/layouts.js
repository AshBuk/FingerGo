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
    let defaultLayoutId = 'en-qwerty';

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
     * Get default layout
     * @returns {Object|null} Default layout or null if not available
     */
    function getDefaultLayout() {
        return registry[defaultLayoutId] || null;
    }

    /**
     * Set default layout by ID
     * @param {string} layoutId - Layout identifier to set as default
     * @returns {boolean} True if set successfully, false if layout not found
     */
    function setDefault(layoutId) {
        if (!registry[layoutId]) {
            console.warn(`Layout "${layoutId}" not found`);
            return false;
        }
        defaultLayoutId = layoutId;
        return true;
    }

    // Auto-register layouts from window globals (set by layout modules)
    function autoRegister() {
        if (window.LAYOUT_EN_QWERTY) register(window.LAYOUT_EN_QWERTY);
        if (window.LAYOUT_RU_JCUKEN) register(window.LAYOUT_RU_JCUKEN);

        // Warn if no default layout available
        if (!registry[defaultLayoutId]) {
            console.warn(
                `Default layout "${defaultLayoutId}" not registered. Available layouts:`,
                Object.keys(registry)
            );
        }
    }

    // Export API
    window.KeyboardLayouts = {
        register,
        getLayout,
        getAvailableLayouts,
        getDefaultLayout,
        setDefault,
        _autoRegister: autoRegister,
    };

    // Auto-register immediately after defining the API
    autoRegister();
})();
