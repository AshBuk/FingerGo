// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * EventBus unit tests
 * Import the real browser module and assert.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

globalThis.window = {};
await import('../events.js');

const EventBus = globalThis.window.EventBus;

// Unique event names isolate tests from each other without resetting EventBus state.
function uniqueEvent(name) {
    return `${name}:${randomUUID()}`;
}

function withMockedConsoleError(run) {
    const original = console.error;
    const calls = [];
    console.error = (...args) => {
        calls.push(args);
    };

    try {
        return run(calls);
    } finally {
        console.error = original;
    }
}

describe('EventBus', () => {
    describe('on/emit', () => {
        it('calls subscriber when event is emitted', () => {
            const event = uniqueEvent('test:event');
            let received = null;

            EventBus.on(event, data => {
                received = data;
            });
            EventBus.emit(event, { value: 42 });

            assert.deepEqual(received, { value: 42 });
        });

        it('supports multiple subscribers for the same event', () => {
            const event = uniqueEvent('typing:keystroke');
            const calls = [];

            EventBus.on(event, () => calls.push('a'));
            EventBus.on(event, () => calls.push('b'));
            EventBus.emit(event, {});

            assert.deepEqual(calls, ['a', 'b']);
        });

        it('ignores non-function callbacks and logs an error', () => {
            const event = uniqueEvent('invalid:callback');

            withMockedConsoleError(calls => {
                EventBus.on(event, 'not-a-function');
                EventBus.emit(event, { value: 1 });

                assert.equal(calls.length, 1);
                assert.match(String(calls[0][0]), /callback must be a function/i);
            });
        });
    });

    describe('off', () => {
        it('unsubscribes callback from event', () => {
            const event = uniqueEvent('stats:update');
            let count = 0;
            const handler = () => count++;

            EventBus.on(event, handler);
            EventBus.emit(event, {});
            assert.equal(count, 1);

            EventBus.off(event, handler);
            EventBus.emit(event, {});
            assert.equal(count, 1);
        });

        it('does nothing when unsubscribing from an unknown event', () => {
            assert.doesNotThrow(() => {
                EventBus.off(uniqueEvent('missing:event'), () => {});
            });
        });
    });

    describe('once', () => {
        it('calls callback only once and auto-unsubscribes', () => {
            const event = uniqueEvent('typing:complete');
            let count = 0;

            EventBus.once(event, () => count++);

            EventBus.emit(event, {});
            EventBus.emit(event, {});
            EventBus.emit(event, {});

            assert.equal(count, 1);
        });
    });

    describe('error handling', () => {
        it('does not throw when emitting a non-existent event', () => {
            assert.doesNotThrow(() => {
                EventBus.emit(uniqueEvent('nonexistent:event'), { data: 'test' });
            });
        });

        it('continues calling other listeners if one throws', () => {
            const event = uniqueEvent('test:error');

            withMockedConsoleError(calls => {
                let secondCalled = false;

                EventBus.on(event, () => {
                    throw new Error('First handler error');
                });
                EventBus.on(event, () => {
                    secondCalled = true;
                });

                EventBus.emit(event, {});

                assert.equal(secondCalled, true);
                assert.equal(calls.length, 1);
                assert.match(String(calls[0][0]), /Error in event listener/);
            });
        });
    });
});
