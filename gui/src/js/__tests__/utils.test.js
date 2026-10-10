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
await import('../layouts/en-qwerty.js');
await import('../layouts/es-latam.js');
await import('../layouts/fr-azerty.js');

const { KeyUtils, AppUtils, LAYOUT_EN_QWERTY, LAYOUT_ES_LATAM, LAYOUT_FR_AZERTY } =
    globalThis.window;

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

    describe('deadKeySequence', () => {
        it('splits accented characters into dead key and base character', () => {
            assert.deepEqual(KeyUtils.deadKeySequence('é', LAYOUT_ES_LATAM), ['´', 'e']);
            assert.deepEqual(KeyUtils.deadKeySequence('Á', LAYOUT_ES_LATAM), ['´', 'A']);
            assert.deepEqual(KeyUtils.deadKeySequence('ü', LAYOUT_ES_LATAM), ['¨', 'u']);
            assert.deepEqual(KeyUtils.deadKeySequence('ê', LAYOUT_FR_AZERTY), ['^', 'e']);
        });

        it('returns null for characters with their own key', () => {
            assert.equal(KeyUtils.deadKeySequence('ñ', LAYOUT_ES_LATAM), null);
            assert.equal(KeyUtils.deadKeySequence('´', LAYOUT_ES_LATAM), null);
            assert.equal(KeyUtils.deadKeySequence('é', LAYOUT_FR_AZERTY), null);
            assert.equal(KeyUtils.deadKeySequence('a', LAYOUT_ES_LATAM), null);
        });

        it('returns null when the layout has no matching dead key', () => {
            assert.equal(KeyUtils.deadKeySequence('é', LAYOUT_EN_QWERTY), null);
            assert.equal(KeyUtils.deadKeySequence('è', LAYOUT_ES_LATAM), null);
            assert.equal(KeyUtils.deadKeySequence(null, LAYOUT_ES_LATAM), null);
        });
    });

    describe('baseKey', () => {
        it('maps shift symbols and uppercase letters to their key', () => {
            assert.equal(KeyUtils.baseKey('!', LAYOUT_EN_QWERTY), '1');
            assert.equal(KeyUtils.baseKey('A', LAYOUT_EN_QWERTY), 'a');
            assert.equal(KeyUtils.baseKey('¨', LAYOUT_ES_LATAM), '´');
            assert.equal(KeyUtils.baseKey('2', LAYOUT_FR_AZERTY), 'é');
        });

        it('keeps base characters and key names', () => {
            assert.equal(KeyUtils.baseKey('a', LAYOUT_EN_QWERTY), 'a');
            assert.equal(KeyUtils.baseKey(' ', LAYOUT_EN_QWERTY), ' ');
            assert.equal(KeyUtils.baseKey('Enter', LAYOUT_EN_QWERTY), 'Enter');
        });
    });

    describe('keysForChar', () => {
        it('resolves dead key characters to both keys', () => {
            assert.deepEqual(KeyUtils.keysForChar('é', LAYOUT_ES_LATAM), ['´', 'e']);
            assert.deepEqual(KeyUtils.keysForChar('Ü', LAYOUT_ES_LATAM), ['´', 'u']);
            assert.deepEqual(KeyUtils.keysForChar('ê', LAYOUT_FR_AZERTY), ['^', 'e']);
        });

        it('resolves other characters to a single key', () => {
            assert.deepEqual(KeyUtils.keysForChar('ñ', LAYOUT_ES_LATAM), ['ñ']);
            assert.deepEqual(KeyUtils.keysForChar('?', LAYOUT_ES_LATAM), ["'"]);
            assert.deepEqual(KeyUtils.keysForChar('Tab', LAYOUT_EN_QWERTY), ['Tab']);
            assert.deepEqual(KeyUtils.keysForChar('A', undefined), ['a']);
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
