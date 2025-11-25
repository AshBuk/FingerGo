// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Shortcuts Manager
 * Handles global keyboard shortcuts for the application
 */
(() => {
    /**
     * Check if any modal is currently visible
     * @returns {boolean}
     */
    function isModalVisible() {
        return window.ModalManager?.isVisible() || false;
    }

    /**
     * Initialize global keyboard shortcuts
     */
    function init() {
        window.addEventListener('keydown', e => {
            // Escape - Show stats modal (skip if modal visible)
            if (e.key === 'Escape') {
                if (isModalVisible()) return;
                e.preventDefault();
                window.SessionManager?.showStatsModal();
                return;
            }
            // Ctrl+, - Open settings
            if (e.key === ',' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                window.UIManager?.showModal('settings', {});
                return;
            }
            // Ctrl+Alt+H - Toggle keyboard
            if (e.key === 'h' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                window.SettingsManager?.toggleKeyboard();
                return;
            }
            // Ctrl+Alt+J - Toggle stats bar
            if (e.key === 'j' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                window.SettingsManager?.toggleStatsBar();
                return;
            }
            // Ctrl+Alt+Z - Toggle Zen mode
            if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                window.SettingsManager?.toggleZenMode();
            }
        });
    }

    // Export API
    window.ShortcutsManager = { init };
})();
