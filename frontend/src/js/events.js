// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Lightweight pub/sub event bus for module communication
 * Provides namespaced event system without external dependencies
 */
(() => {
    const listeners = {};

    /**
     * Subscribe to an event
     * @param {string} event - Event name (e.g., 'typing:keystroke', 'stats:update')
     * @param {Function} callback - Callback function to execute on event
     */
    function on(event, callback) {
        if (typeof callback !== 'function') {
            console.error(`EventBus.on: callback must be a function for event "${event}"`);
            return;
        }

        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    function off(event, callback) {
        if (!listeners[event]) return;

        const index = listeners[event].indexOf(callback);
        if (index > -1) {
            listeners[event].splice(index, 1);
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {*} data - Event payload
     */
    function emit(event, data) {
        if (!listeners[event]) return;

        listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        });
    }

    /**
     * Subscribe to an event once (auto-unsubscribe after first call)
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to execute once
     */
    function once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            off(event, wrapper);
        };
        on(event, wrapper);
    }

    // Export API
    window.EventBus = {
        on,
        off,
        emit,
        once
    };
})();

