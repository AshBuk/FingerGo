// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Settings modal renderer
 * Keyboard layout selection and other application settings
 */
(() => {
    if (!window.ModalManager) {
        console.error('ModalManager not available. Include modals/core.js first');
        return;
    }

    /**
     * Generate settings HTML
     * @returns {string} HTML content
     */
    function render() {
        const layouts = window.KeyboardUI?.getAvailableLayouts() || [];
        const currentLayout = window.SettingsManager?.getKeyboardLayout() || 'en-qwerty';

        const layoutOptions = layouts
            .map(id => {
                const layout = window.KeyboardLayouts?.getLayout(id);
                const name = layout?.name || id;
                const selected = id === currentLayout ? 'selected' : '';
                return `<option value="${id}" ${selected}>${name}</option>`;
            })
            .join('');

        return `
            <div class="modal-section">
                <label class="modal-label" for="keyboard-layout-select">
                    Keyboard Layout
                </label>
                <select id="keyboard-layout-select" class="modal-select">
                    ${layoutOptions}
                </select>
            </div>
        `;
    }

    /**
     * Bind event handlers after modal is rendered
     * @param {Object} _data - Modal data (unused)
     * @param {HTMLElement} container - Modal content container
     */
    function bind(_data, container) {
        const select = container.querySelector('#keyboard-layout-select');
        if (select) {
            select.addEventListener('change', e => {
                window.SettingsManager?.applyKeyboardLayout(e.target.value, true);
            });
        }
    }

    // Register with ModalManager
    window.ModalManager.registerType('settings', {
        title: 'Keyboard Layout',
        render,
        bind,
    });
})();
