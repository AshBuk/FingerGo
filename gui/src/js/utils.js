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
     *
     * Applies Unicode NFC normalization to ensure consistent comparison
     * across different input sources (keyboard vs text file).
     * Important for Cyrillic and other scripts where characters like "й"
     * can be represented as composed (U+0439) or decomposed (U+0438 + U+0306).
     *
     * @param {string} key - Keyboard event key (e.g., 'a', 'A', 'Enter', 'Tab')
     * @returns {string} Normalized key representation (preserves case)
     */
    function normalizeKey(key) {
        // NFC normalization for consistent Unicode comparison
        return typeof key === 'string' ? key.normalize('NFC') : key;
    }

    /**
     * Normalize text character for comparison with keyboard input
     * Applies Unicode NFC normalization and maps special characters to key names.
     *
     * @param {string} char - Character from text
     * @returns {string} Normalized character or key name
     */
    function normalizeTextChar(char) {
        if (char === ' ') return ' ';
        if (char === '\n') return 'Enter';
        if (char === '\t') return 'Tab';
        // NFC normalization for consistent Unicode comparison
        return typeof char === 'string' ? char.normalize('NFC') : char;
    }

    /**
     * Detect navigation keys (arrows, Home/End, PageUp/PageDown)
     * @param {string} key - Keyboard event key
     * @returns {boolean} Whether key is navigation control
     */
    function isNavigationKey(key) {
        return NAVIGATION_KEYS.has(key);
    }

    function formatTime(seconds) {
        const total = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
        const mins = Math.floor(total / 60);
        const secs = Math.floor(total % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Escape HTML special characters to prevent XSS
     * @param {string} str - Raw string to escape
     * @returns {string} HTML-safe string
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        const s = String(str);
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return s.replace(/[&<>"']/g, c => map[c]);
    }

    window.KeyUtils = {
        normalizeKey,
        normalizeTextChar,
        isNavigationKey,
    };

    window.AppUtils = {
        formatTime,
        escapeHtml,
    };
})();
