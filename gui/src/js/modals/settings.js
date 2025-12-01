// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Settings modal renderer (placeholder)
 * TODO: Implement full settings panel
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
        return '<p>Settings panel coming soon...</p>';
    }

    // Register with ModalManager
    window.ModalManager.registerType('settings', {
        title: 'Settings',
        render,
    });
})();
