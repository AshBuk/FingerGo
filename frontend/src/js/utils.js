// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Utility functions for key and character normalization
 * Shared across keyboard.js, typing.js, and app.js
 */
(() => {
    const NAVIGATION_KEYS = new Set([
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
        'PageUp',
        'PageDown',
    ]);

    /**
     * Normalize keyboard event key for comparison
     * @param {string} key - Keyboard event key (e.g., 'a', 'A', 'Enter', 'Tab')
     * @returns {string} Normalized key representation
     */
    function normalizeKey(key) {
        if (key.length === 1) return key.toLowerCase();
        return key; // Backspace, Enter, Shift, Tab, Space (' ')
    }

    /**
     * Normalize character from text for key comparison
     * Handles special characters: space, newline, tab
     * @param {string} char - Character from text
     * @returns {string} Normalized key representation
     */
    function normalizeTextChar(char) {
        if (char === ' ') return ' ';
        if (char === '\n') return 'Enter';
        if (char === '\t') return 'Tab';
        return char.toLowerCase();
    }

    /**
     * Detect navigation keys (arrows, Home/End, PageUp/PageDown)
     * @param {string} key - Keyboard event key
     * @returns {boolean} Whether key is navigation control
     */
    function isNavigationKey(key) {
        return NAVIGATION_KEYS.has(key);
    }

    // Export API
    window.KeyUtils = {
        normalizeKey,
        normalizeTextChar,
        isNavigationKey,
    };
})();
