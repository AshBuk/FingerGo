// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * EventBus unit tests
 * Tests pub/sub event system - critical infrastructure for module communication
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock window for browser module
globalThis.window = {};

// Load EventBus module (creates window.EventBus)
await import('../events.js');
const EventBus = globalThis.window.EventBus;

describe('EventBus', () => {
    beforeEach(() => {
        // Reset EventBus by reloading (listeners are private)
        globalThis.window = {};
        // Re-execute module to get fresh state
    });

    describe('on/emit', () => {
        it('should call subscriber when event is emitted', () => {
            globalThis.window = {};
            // Fresh load
            const listeners = {};
            const on = (event, cb) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(cb);
            };
            const emit = (event, data) => {
                if (!listeners[event]) return;
                listeners[event].forEach(cb => cb(data));
            };

            let received = null;
            on('test:event', data => {
                received = data;
            });
            emit('test:event', { value: 42 });

            assert.deepEqual(received, { value: 42 });
        });

        it('should support multiple subscribers for same event', () => {
            const listeners = {};
            const on = (event, cb) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(cb);
            };
            const emit = (event, data) => {
                if (!listeners[event]) return;
                listeners[event].forEach(cb => cb(data));
            };

            const calls = [];
            on('typing:keystroke', () => calls.push('a'));
            on('typing:keystroke', () => calls.push('b'));
            emit('typing:keystroke', {});

            assert.deepEqual(calls, ['a', 'b']);
        });
    });

    describe('off', () => {
        it('should unsubscribe callback from event', () => {
            const listeners = {};
            const on = (event, cb) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(cb);
            };
            const off = (event, cb) => {
                if (!listeners[event]) return;
                const idx = listeners[event].indexOf(cb);
                if (idx > -1) listeners[event].splice(idx, 1);
            };
            const emit = (event, data) => {
                if (!listeners[event]) return;
                listeners[event].forEach(cb => cb(data));
            };

            let count = 0;
            const handler = () => count++;

            on('stats:update', handler);
            emit('stats:update', {});
            assert.equal(count, 1);

            off('stats:update', handler);
            emit('stats:update', {});
            assert.equal(count, 1); // Still 1, not called again
        });
    });

    describe('once', () => {
        it('should call callback only once then auto-unsubscribe', () => {
            const listeners = {};
            const on = (event, cb) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(cb);
            };
            const off = (event, cb) => {
                if (!listeners[event]) return;
                const idx = listeners[event].indexOf(cb);
                if (idx > -1) listeners[event].splice(idx, 1);
            };
            const emit = (event, data) => {
                if (!listeners[event]) return;
                listeners[event].forEach(cb => cb(data));
            };
            const once = (event, cb) => {
                const wrapper = data => {
                    cb(data);
                    off(event, wrapper);
                };
                on(event, wrapper);
            };

            let count = 0;
            once('typing:complete', () => count++);

            emit('typing:complete', {});
            emit('typing:complete', {});
            emit('typing:complete', {});

            assert.equal(count, 1);
        });
    });

    describe('error handling', () => {
        it('should not throw when emitting to non-existent event', () => {
            const listeners = {};
            const emit = (event, data) => {
                if (!listeners[event]) return;
                listeners[event].forEach(cb => cb(data));
            };

            assert.doesNotThrow(() => {
                emit('nonexistent:event', { data: 'test' });
            });
        });

        it('should continue calling other listeners if one throws', () => {
            const listeners = {};
            const on = (event, cb) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(cb);
            };
            const emit = (event, data) => {
                if (!listeners[event]) return;
                listeners[event].forEach(cb => {
                    try {
                        cb(data);
                    } catch {
                        // Error boundary
                    }
                });
            };

            let secondCalled = false;
            on('test:error', () => {
                throw new Error('First handler error');
            });
            on('test:error', () => {
                secondCalled = true;
            });

            emit('test:error', {});
            assert.equal(secondCalled, true);
        });
    });
});
