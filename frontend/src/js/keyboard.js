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

    // Load default layout
    const layout = window.KeyboardLayouts.getDefaultLayout();
    if (!layout) {
        console.error('No keyboard layout available. Ensure at least one layout is loaded.');
        return;
    }

    const rows = layout.rows;
    const fingerForKey = layout.fingerMap;

    // Remove any static markup and rebuild from data
    container.innerHTML = '';

    const keyToEls = new Map();
    const fingerToEl = new Map();

    function render() {
        fingerToEl.clear();

        rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'keyboard-row';
            const isSpaceRow = row.length === 1 && row[0]?.key === ' ';
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
            if (isSpaceRow) {
                const wrapper = document.createElement('div');
                wrapper.className = 'keyboard-row keyboard-row-space';
                const leftHand = createHandElement('left');
                const rightHand = createHandElement('right');
                if (leftHand) wrapper.appendChild(leftHand);
                wrapper.appendChild(rowEl);
                if (rightHand) wrapper.appendChild(rightHand);
                container.appendChild(wrapper);
                return;
            }

            container.appendChild(rowEl);
        });
    }

    const fingerMeta = {
        'left-pinky': { label: 'P', type: 'pinky', title: 'Left pinky' },
        'left-ring': { label: 'R', type: 'ring', title: 'Left ring' },
        'left-middle': { label: 'M', type: 'middle', title: 'Left middle' },
        'left-index': { label: 'I', type: 'index', title: 'Left index' },
        'left-thumb': { label: 'T', type: 'thumb', title: 'Left thumb' },
        'right-thumb': { label: 'T', type: 'thumb', title: 'Right thumb' },
        'right-index': { label: 'I', type: 'index', title: 'Right index' },
        'right-middle': { label: 'M', type: 'middle', title: 'Right middle' },
        'right-ring': { label: 'R', type: 'ring', title: 'Right ring' },
        'right-pinky': { label: 'P', type: 'pinky', title: 'Right pinky' },
    };

    const handStructure = [
        {
            hand: 'left',
            fingers: ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'left-thumb'],
        },
        {
            hand: 'right',
            fingers: ['right-pinky', 'right-ring', 'right-middle', 'right-index', 'right-thumb'],
        },
    ];

    function createHandElement(hand) {
        const structure = handStructure.find(h => h.hand === hand);
        if (!structure) return null;

        const handEl = document.createElement('div');
        handEl.className = `hand hand-${hand}`;
        handEl.dataset.hand = hand;

        structure.fingers.forEach(fingerId => {
            const meta = fingerMeta[fingerId];
            if (!meta) return;
            const fingerEl = document.createElement('div');
            fingerEl.className = ['finger', meta.type].join(' ');
            fingerEl.dataset.finger = fingerId;
            fingerEl.title = meta.title;
            fingerEl.setAttribute('aria-label', meta.title);
            fingerEl.textContent = meta.label;
            handEl.appendChild(fingerEl);
            fingerToEl.set(fingerId, fingerEl);
        });

        return handEl;
    }

    let highlightedFingers = [];
    function toggleFingerActive(fingerId, active) {
        const el = fingerToEl.get(fingerId);
        if (el) el.classList.toggle('active', active);
    }

    function highlightFinger(fingerId) {
        highlightedFingers.forEach(id => toggleFingerActive(id, false));
        highlightedFingers = [];

        if (!fingerId) return;

        if (fingerId === 'thumb') {
            ['left-thumb', 'right-thumb'].forEach(id => {
                if (!fingerToEl.has(id)) return;
                toggleFingerActive(id, true);
                highlightedFingers.push(id);
            });
            return;
        }

        if (fingerToEl.has(fingerId)) {
            toggleFingerActive(fingerId, true);
            highlightedFingers.push(fingerId);
        }
    }

    // Key normalization utilities are now in utils.js (KeyUtils)
    if (!window.KeyUtils) {
        console.error('KeyUtils not available. Include utils.js before keyboard.js');
        return;
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
        highlightFinger(key ? fingerForKey[key] : null);
    }

    function setErrorState(key) {
        const els = keyToEls.get(key);
        if (!els) return;
        els.forEach(el => el.classList.add('error'));
    }

    function clearErrorState(key) {
        const els = keyToEls.get(key);
        if (!els) return;
        els.forEach(el => el.classList.remove('error'));
    }

    function clearAllErrors() {
        keyToEls.forEach(els => {
            els.forEach(el => el.classList.remove('error'));
        });
    }

    function onKeyDown(e) {
        const k = window.KeyUtils.normalizeKey(e.key);
        setPressed(k, true);
    }
    function onKeyUp(e) {
        const k = window.KeyUtils.normalizeKey(e.key);
        setPressed(k, false);
    }

    render();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Expose minimal API
    window.KeyboardUI = {
        setTargetKey: k => setTarget(window.KeyUtils.normalizeKey(k)),
        clearTarget: () => setTarget(null),
        setError: k => setErrorState(window.KeyUtils.normalizeKey(k)),
        clearError: k => clearErrorState(window.KeyUtils.normalizeKey(k)),
        clearAllErrors,
        getCurrentLayout: () => layout,
    };
})();
