// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Keyboard rendering and interaction module
 * Depends on: layouts.js (KeyboardLayouts global)
 */
(() => {
    const container = document.getElementById('keyboard');
    if (!container) return;

    // Get layout from KeyboardLayouts module
    if (!window.KeyboardLayouts) {
        console.error('KeyboardLayouts module not loaded. Include layouts.js before keyboard.js');
        return;
    }

    // Load default layout (EN QWERTY for MVP)
    const layout = window.KeyboardLayouts.getDefaultLayout();
    const rows = layout.rows;
    const fingerForKey = layout.fingerMap;

    // Remove any static markup and rebuild from data
    container.innerHTML = '';

    const keyToEls = new Map();

    function render() {
        rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'keyboard-row';
            row.forEach(def => {
                const el = document.createElement('div');
                el.className = ['key', def.className].filter(Boolean).join(' ');
                el.setAttribute('role', 'presentation');
                el.tabIndex = -1;
                el.dataset.key = def.key;

                const finger = fingerForKey[def.key];
                if (finger) el.dataset.finger = finger;

                const label = def.label ?? def.key.toUpperCase();
                if (Array.isArray(label)) {
                    el.innerHTML = `${label[0]}<br>${label[1]}`;
                } else {
                    el.textContent = label;
                }

                if (!keyToEls.has(def.key)) keyToEls.set(def.key, []);
                keyToEls.get(def.key).push(el);

                rowEl.appendChild(el);
            });
            container.appendChild(rowEl);
        });
    }

    function normalizeKey(k) {
        if (k.length === 1) return k.toLowerCase();
        return k; // Backspace, Enter, Shift, Tab, Space (' ')
    }

    function setPressed(key, pressed) {
        const els = keyToEls.get(key);
        if (!els) return;
        els.forEach(el => el.classList.toggle('pressed', pressed));
    }

    let targetKey = null;
    function setTarget(key) {
        if (targetKey && keyToEls.get(targetKey)) {
            keyToEls.get(targetKey).forEach(el => el.classList.remove('target'));
        }
        targetKey = key;
        if (key && keyToEls.get(key)) {
            keyToEls.get(key).forEach(el => el.classList.add('target'));
        }
    }

    function onKeyDown(e) {
        const k = normalizeKey(e.key);
        setPressed(k, true);
    }
    function onKeyUp(e) {
        const k = normalizeKey(e.key);
        setPressed(k, false);
    }

    render();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Expose minimal API
    window.KeyboardUI = {
        setTargetKey: (k) => setTarget(normalizeKey(k)),
        clearTarget: () => setTarget(null),
        getCurrentLayout: () => layout,
    };
})();
