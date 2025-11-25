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
     * Check if library sidebar is visible
     * @returns {boolean}
     */
    function isLibraryVisible() {
        return window.LibraryManager?.isVisible() || false;
    }

    /**
     * Initialize global keyboard shortcuts
     */
    function init() {
        window.addEventListener('keydown', e => {
            // Escape - Close sidebar/show stats (priority: sidebar > modal > stats)
            if (e.key === 'Escape') {
                if (isLibraryVisible()) {
                    e.preventDefault();
                    window.LibraryManager?.hide();
                    return;
                }
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
            // Ctrl+Alt+K - Toggle keyboard
            if (e.key === 'k' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                window.SettingsManager?.toggleKeyboard();
                return;
            }
            // Ctrl+Alt+S - Toggle stats bar
            if (e.key === 's' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                window.SettingsManager?.toggleStatsBar();
                return;
            }
            // Ctrl+Alt+Z - Toggle Zen mode
            if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                window.SettingsManager?.toggleZenMode();
                return;
            }
            // Ctrl+Alt+R - Reset session
            if (e.key === 'r' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                window.SessionManager?.reset();
                return;
            }
            // Ctrl+Alt+L - Toggle library sidebar
            if (e.key === 'l' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                window.LibraryManager?.toggle();
                return;
            }
            // Ctrl+Alt+N - Toggle text editor (new text or close if modal open)
            if (e.key === 'n' && (e.ctrlKey || e.metaKey) && e.altKey) {
                e.preventDefault();
                if (isModalVisible()) {
                    window.ModalManager?.hide();
                } else {
                    window.LibraryManager?.openEditor(null);
                }
            }
        });
    }

    // Export API
    window.ShortcutsManager = { init };
})();
