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

    /**
     * Split a dead key character into [deadKey, baseChar], e.g. "é" -> ["´", "e"]
     * @param {string} char - Character from text
     * @param {Object} layout - Keyboard layout with optional deadKeys map
     * @returns {string[]|null} null if the character has its own key or no dead key
     */
    function deadKeySequence(char, layout) {
        if (!layout?.deadKeys || typeof char !== 'string' || char.length !== 1) return null;
        if (layout.fingerMap?.[char.toLowerCase()] || layout.shiftToBaseKey?.[char]) return null;
        const [base, mark, ...rest] = char.normalize('NFD');
        const deadKey = !rest.length && layout.deadKeys[mark];
        return deadKey ? [deadKey, base] : null;
    }

    /**
     * Resolve the layout key that types a character, e.g. "!" -> "1", "A" -> "a"
     * @param {string} char - Character or key name
     * @param {Object} layout - Keyboard layout with optional shiftToBaseKey map
     * @returns {string} Key as used in layout rows
     */
    function baseKey(char, layout) {
        if (layout?.shiftToBaseKey?.[char]) return layout.shiftToBaseKey[char];
        return char.length === 1 ? char.toLowerCase() : char;
    }

    /**
     * Resolve all layout keys pressed to type a character, e.g. "é" -> ["´", "e"]
     * @param {string} char - Character or key name
     * @param {Object} layout - Keyboard layout
     * @returns {string[]} Keys as used in layout rows
     */
    function keysForChar(char, layout) {
        return (deadKeySequence(char, layout) ?? [char]).map(c => baseKey(c, layout));
    }

    window.KeyUtils = {
        normalizeKey,
        normalizeTextChar,
        isNavigationKey,
        deadKeySequence,
        baseKey,
        keysForChar,
    };

    window.AppUtils = {
        formatTime,
        escapeHtml,
    };
})();
