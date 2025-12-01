// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Error modal renderer
 * Displays error messages to the user
 */
(() => {
    if (!window.ModalManager) {
        console.error('ModalManager not available. Include modals/core.js first');
        return;
    }

    const esc = window.AppUtils?.escapeHtml || (s => String(s ?? ''));

    /**
     * Generate error message HTML
     * @param {Object} data - Error data
     * @returns {string} HTML content
     */
    function render(data) {
        return `<div class="error-message"><p>${esc(data?.message || 'An error occurred')}</p><button type="button" id="error-ok">OK</button></div>`;
    }

    /**
     * Bind error modal handlers
     * @param {Object} _data - Modal data (unused)
     * @param {HTMLElement} container - Modal content container
     */
    function bind(_data, container) {
        const okBtn = container.querySelector('#error-ok');
        if (okBtn) {
            okBtn.addEventListener('click', () => window.ModalManager.hide());
        }
    }

    // Register with ModalManager
    window.ModalManager.registerType('error', {
        title: 'Error',
        render,
        bind,
    });
})();
