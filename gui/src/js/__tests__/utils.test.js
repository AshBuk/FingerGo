// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * KeyUtils unit tests
 * Tests key normalization functions for typing input matching
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Pure function implementations (mirror utils.js logic)
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

function normalizeKey(key) {
    if (key.length === 1) return key.toLowerCase();
    return key;
}

function normalizeTextChar(char) {
    if (char === ' ') return ' ';
    if (char === '\n') return 'Enter';
    if (char === '\t') return 'Tab';
    return char.toLowerCase();
}

function isNavigationKey(key) {
    return NAVIGATION_KEYS.has(key);
}

function formatTime(seconds) {
    const total = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
    const mins = Math.floor(total / 60);
    const secs = Math.floor(total % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

describe('KeyUtils', () => {
    describe('normalizeKey', () => {
        it('should lowercase single character keys', () => {
            assert.equal(normalizeKey('A'), 'a');
            assert.equal(normalizeKey('Z'), 'z');
            assert.equal(normalizeKey('a'), 'a');
        });

        it('should preserve special key names', () => {
            assert.equal(normalizeKey('Enter'), 'Enter');
            assert.equal(normalizeKey('Backspace'), 'Backspace');
            assert.equal(normalizeKey('Tab'), 'Tab');
            assert.equal(normalizeKey('Shift'), 'Shift');
        });

        it('should handle space key', () => {
            assert.equal(normalizeKey(' '), ' ');
        });
    });

    describe('normalizeTextChar', () => {
        it('should convert newline to Enter', () => {
            assert.equal(normalizeTextChar('\n'), 'Enter');
        });

        it('should convert tab to Tab', () => {
            assert.equal(normalizeTextChar('\t'), 'Tab');
        });

        it('should preserve space as space', () => {
            assert.equal(normalizeTextChar(' '), ' ');
        });

        it('should lowercase regular characters', () => {
            assert.equal(normalizeTextChar('F'), 'f');
            assert.equal(normalizeTextChar('u'), 'u');
            assert.equal(normalizeTextChar('N'), 'n');
        });

        it('should match keyboard input with text character', () => {
            // Critical: keyboard 'Enter' key should match text '\n'
            assert.equal(normalizeKey('Enter'), normalizeTextChar('\n'));
            // Space key matches space char
            assert.equal(normalizeKey(' '), normalizeTextChar(' '));
            // Regular chars match
            assert.equal(normalizeKey('a'), normalizeTextChar('A'));
        });
    });

    describe('isNavigationKey', () => {
        it('should return true for arrow keys', () => {
            assert.equal(isNavigationKey('ArrowLeft'), true);
            assert.equal(isNavigationKey('ArrowRight'), true);
            assert.equal(isNavigationKey('ArrowUp'), true);
            assert.equal(isNavigationKey('ArrowDown'), true);
        });

        it('should return true for Home/End/Page keys', () => {
            assert.equal(isNavigationKey('Home'), true);
            assert.equal(isNavigationKey('End'), true);
            assert.equal(isNavigationKey('PageUp'), true);
            assert.equal(isNavigationKey('PageDown'), true);
        });

        it('should return false for non-navigation keys', () => {
            assert.equal(isNavigationKey('Enter'), false);
            assert.equal(isNavigationKey('a'), false);
            assert.equal(isNavigationKey('Escape'), false);
        });
    });
});

describe('AppUtils', () => {
    describe('formatTime', () => {
        it('should format zero seconds', () => {
            assert.equal(formatTime(0), '00:00');
        });

        it('should format seconds only', () => {
            assert.equal(formatTime(5), '00:05');
            assert.equal(formatTime(45), '00:45');
        });

        it('should format minutes and seconds', () => {
            assert.equal(formatTime(60), '01:00');
            assert.equal(formatTime(90), '01:30');
            assert.equal(formatTime(125), '02:05');
        });

        it('should handle edge cases', () => {
            assert.equal(formatTime(-5), '00:00'); // Negative clamped to 0
            assert.equal(formatTime(NaN), '00:00');
            assert.equal(formatTime(Infinity), '00:00');
        });
    });
});
