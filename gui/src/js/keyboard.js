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

    /**
     * Highlight fingers for a given character
     * @param {string|null} originalChar - Original character from text (not normalized)
     */
    function highlightFingers(originalChar) {
        // Clear previous highlights
        highlightedFingers.forEach(id => toggleFingerActive(id, false));
        highlightedFingers = [];
        // Clear Shift key highlight
        keyToEls.get('Shift')?.forEach(el => el.classList.remove('target'));

        if (!originalChar) return;

        // Normalize special text characters to key names
        let keyName = originalChar;
        if (originalChar === '\n') keyName = 'Enter';
        else if (originalChar === '\t') keyName = 'Tab';

        const normalizedKey = keyName.length === 1 ? keyName.toLowerCase() : keyName;
        const fingerId = fingerForKey[normalizedKey] || fingerForKey[keyName];

        if (!fingerId) return;

        // Handle thumb (space)
        if (fingerId === 'thumb') {
            ['left-thumb', 'right-thumb'].forEach(id => {
                if (!fingerToEl.has(id)) return;
                toggleFingerActive(id, true);
                highlightedFingers.push(id);
            });
            return;
        }

        // Check if Shift is needed
        const needsShift = requiresShift(originalChar);

        if (needsShift) {
            // Determine which Shift to use (opposite hand)
            const leftHandKeys = layout.leftHandKeys;
            const isLeftHandKey =
                leftHandKeys?.has(originalChar) || leftHandKeys?.has(normalizedKey);
            const shiftFinger = isLeftHandKey ? 'right-pinky' : 'left-pinky';

            // Highlight Shift finger
            if (fingerToEl.has(shiftFinger)) {
                toggleFingerActive(shiftFinger, true);
                highlightedFingers.push(shiftFinger);
            }

            // Highlight Shift key on keyboard
            keyToEls.get('Shift')?.forEach((el, idx) => {
                // Left Shift is first (idx 0), Right Shift is second (idx 1)
                if ((isLeftHandKey && idx === 1) || (!isLeftHandKey && idx === 0)) {
                    el.classList.add('target');
                }
            });
        }

        // Highlight main key finger
        if (fingerToEl.has(fingerId)) {
            toggleFingerActive(fingerId, true);
            highlightedFingers.push(fingerId);
        }
    }

    /**
     * Check if character requires Shift key
     */
    function requiresShift(char) {
        if (!char || char.length !== 1) return false;
        // Uppercase letters
        if (char >= 'A' && char <= 'Z') return true;
        // Shift symbols
        const shiftSymbols = '~!@#$%^&*()_+{}|:"<>?';
        return shiftSymbols.includes(char);
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

    /**
     * Set target key with original character for proper Shift handling
     * @param {string} key - Normalized key
     * @param {string} originalChar - Original character from text
     */
    function setTarget(key, originalChar) {
        // Clear previous target key
        if (targetKey && keyToEls.get(targetKey)) {
            keyToEls.get(targetKey).forEach(el => el.classList.remove('target'));
        }
        // Clear previous Shift highlight
        keyToEls.get('Shift')?.forEach(el => el.classList.remove('target'));

        // Normalize special text characters to key names
        let keyName = originalChar;
        if (originalChar === '\n') keyName = 'Enter';
        else if (originalChar === '\t') keyName = 'Tab';

        // For shift symbols, find the base key to highlight
        // For uppercase letters, use lowercase; for shift symbols, use the base key
        const shiftToBaseKey = layout.shiftToBaseKey;
        let baseKey = key;
        if (shiftToBaseKey?.[keyName]) {
            baseKey = shiftToBaseKey[keyName];
        } else if (keyName && keyName >= 'A' && keyName <= 'Z') {
            baseKey = keyName.toLowerCase();
        } else if (keyName === 'Enter' || keyName === 'Tab') {
            baseKey = keyName;
        }

        targetKey = baseKey;

        if (baseKey && keyToEls.get(baseKey)) {
            keyToEls.get(baseKey).forEach(el => el.classList.add('target'));
        }

        highlightFingers(originalChar);
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
        // For Shift, use location to determine which one
        if (e.key === 'Shift') {
            const shiftEls = keyToEls.get('Shift');
            if (shiftEls) {
                // e.location: 1 = left, 2 = right
                const idx = e.location === 1 ? 0 : 1;
                shiftEls[idx]?.classList.add('pressed');
            }
            return;
        }
        setPressed(k, true);
    }
    function onKeyUp(e) {
        const k = window.KeyUtils.normalizeKey(e.key);
        // For Shift, use location to determine which one
        if (e.key === 'Shift') {
            const shiftEls = keyToEls.get('Shift');
            if (shiftEls) {
                const idx = e.location === 1 ? 0 : 1;
                shiftEls[idx]?.classList.remove('pressed');
            }
            return;
        }
        setPressed(k, false);
    }

    render();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Expose minimal API
    window.KeyboardUI = {
        /**
         * Set target key for highlighting
         * @param {string} originalChar - Original character from text (for Shift detection)
         */
        setTargetKey: originalChar => {
            const normalizedKey = window.KeyUtils.normalizeKey(originalChar);
            setTarget(normalizedKey, originalChar);
        },
        clearTarget: () => setTarget(null, null),
        setError: k => setErrorState(window.KeyUtils.normalizeKey(k)),
        clearError: k => clearErrorState(window.KeyUtils.normalizeKey(k)),
        clearAllErrors,
        getCurrentLayout: () => layout,
    };
})();
