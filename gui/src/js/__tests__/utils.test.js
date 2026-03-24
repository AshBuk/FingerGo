// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * KeyUtils/AppUtils unit tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {};
await import('../utils.js');

const { KeyUtils, AppUtils } = globalThis.window;

describe('KeyUtils', () => {
    describe('normalizeKey', () => {
        it('preserves case for single-character keys', () => {
            assert.equal(KeyUtils.normalizeKey('A'), 'A');
            assert.equal(KeyUtils.normalizeKey('Z'), 'Z');
            assert.equal(KeyUtils.normalizeKey('a'), 'a');
        });

        it('preserves special key names', () => {
            assert.equal(KeyUtils.normalizeKey('Enter'), 'Enter');
            assert.equal(KeyUtils.normalizeKey('Backspace'), 'Backspace');
            assert.equal(KeyUtils.normalizeKey('Tab'), 'Tab');
            assert.equal(KeyUtils.normalizeKey('Shift'), 'Shift');
        });

        it('normalizes decomposed Unicode input to NFC', () => {
            const decomposed = 'и\u0306';
            assert.equal(KeyUtils.normalizeKey(decomposed), 'й');
        });

        it('handles non-string values without throwing', () => {
            assert.equal(KeyUtils.normalizeKey(null), null);
            assert.equal(KeyUtils.normalizeKey(undefined), undefined);
        });
    });

    describe('normalizeTextChar', () => {
        it('maps newline and tab to their keyboard key names', () => {
            assert.equal(KeyUtils.normalizeTextChar('\n'), 'Enter');
            assert.equal(KeyUtils.normalizeTextChar('\t'), 'Tab');
        });

        it('preserves space as a space character', () => {
            assert.equal(KeyUtils.normalizeTextChar(' '), ' ');
        });

        it('normalizes regular Unicode characters to NFC', () => {
            const decomposed = 'и\u0306';
            assert.equal(KeyUtils.normalizeTextChar(decomposed), 'й');
        });

        it('preserves case for regular characters', () => {
            assert.equal(KeyUtils.normalizeTextChar('F'), 'F');
            assert.equal(KeyUtils.normalizeTextChar('u'), 'u');
            assert.equal(KeyUtils.normalizeTextChar('N'), 'N');
        });
    });

    describe('isNavigationKey', () => {
        it('returns true for navigation keys', () => {
            assert.equal(KeyUtils.isNavigationKey('ArrowLeft'), true);
            assert.equal(KeyUtils.isNavigationKey('ArrowRight'), true);
            assert.equal(KeyUtils.isNavigationKey('ArrowUp'), true);
            assert.equal(KeyUtils.isNavigationKey('ArrowDown'), true);
            assert.equal(KeyUtils.isNavigationKey('Home'), true);
            assert.equal(KeyUtils.isNavigationKey('End'), true);
            assert.equal(KeyUtils.isNavigationKey('PageUp'), true);
            assert.equal(KeyUtils.isNavigationKey('PageDown'), true);
        });

        it('returns false for non-navigation keys', () => {
            assert.equal(KeyUtils.isNavigationKey('Enter'), false);
            assert.equal(KeyUtils.isNavigationKey('a'), false);
            assert.equal(KeyUtils.isNavigationKey('Escape'), false);
        });
    });
});

describe('AppUtils', () => {
    describe('formatTime', () => {
        it('formats zero seconds', () => {
            assert.equal(AppUtils.formatTime(0), '00:00');
        });

        it('formats seconds only', () => {
            assert.equal(AppUtils.formatTime(5), '00:05');
            assert.equal(AppUtils.formatTime(45), '00:45');
        });

        it('formats minutes and seconds', () => {
            assert.equal(AppUtils.formatTime(60), '01:00');
            assert.equal(AppUtils.formatTime(90), '01:30');
            assert.equal(AppUtils.formatTime(125), '02:05');
        });

        it('clamps invalid values to zero', () => {
            assert.equal(AppUtils.formatTime(-5), '00:00');
            assert.equal(AppUtils.formatTime(NaN), '00:00');
            assert.equal(AppUtils.formatTime(Infinity), '00:00');
        });
    });

    describe('escapeHtml', () => {
        it('escapes HTML special characters', () => {
            assert.equal(
                AppUtils.escapeHtml(`<script>alert("x") & 'y'</script>`),
                '&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;',
            );
        });

        it('returns empty string for nullish input', () => {
            assert.equal(AppUtils.escapeHtml(null), '');
            assert.equal(AppUtils.escapeHtml(undefined), '');
        });
    });
});
