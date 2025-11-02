// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

(() => {
    const container = document.getElementById('keyboard');
    if (!container) return;

    // Remove any static markup and rebuild from data
    container.innerHTML = '';

    // QWERTY EN layout (MVP)
    /** @type {{key:string,label?:string|string[],className?:string}[][]} */
    const rows = [
        [
            { key: '`', label: ['~', '`'] },
            { key: '1', label: ['!', '1'] },
            { key: '2', label: ['@', '2'] },
            { key: '3', label: ['#', '3'] },
            { key: '4', label: ['$', '4'] },
            { key: '5', label: ['%', '5'] },
            { key: '6', label: ['^', '6'] },
            { key: '7', label: ['&', '7'] },
            { key: '8', label: ['*', '8'] },
            { key: '9', label: ['(', '9'] },
            { key: '0', label: [')', '0'] },
            { key: '-', label: ['_', '-'] },
            { key: '=', label: ['+', '='] },
            { key: 'Backspace', label: 'Backspace', className: 'key-wide' },
        ],
        [
            { key: 'Tab', label: 'Tab', className: 'key-wide' },
            { key: 'q', label: 'Q' }, { key: 'w', label: 'W' }, { key: 'e', label: 'E' }, { key: 'r', label: 'R' }, { key: 't', label: 'T' },
            { key: 'y', label: 'Y' }, { key: 'u', label: 'U' }, { key: 'i', label: 'I' }, { key: 'o', label: 'O' }, { key: 'p', label: 'P' },
            { key: '[', label: ['{', '['] }, { key: ']', label: ['}', ']'] }, { key: '\\', label: ['|', '\\'], className: 'key-wide' },
        ],
        [
            { key: 'CapsLock', label: 'Caps', className: 'key-wider' },
            { key: 'a', label: 'A' }, { key: 's', label: 'S' }, { key: 'd', label: 'D' }, { key: 'f', label: 'F' }, { key: 'g', label: 'G' },
            { key: 'h', label: 'H' }, { key: 'j', label: 'J' }, { key: 'k', label: 'K' }, { key: 'l', label: 'L' },
            { key: ';', label: [':', ';'] }, { key: "'", label: ['"', "'"] },
            { key: 'Enter', label: 'Enter', className: 'key-wider' },
        ],
        [
            { key: 'Shift', label: 'Shift', className: 'key-widest' },
            { key: 'z', label: 'Z' }, { key: 'x', label: 'X' }, { key: 'c', label: 'C' }, { key: 'v', label: 'V' }, { key: 'b', label: 'B' },
            { key: 'n', label: 'N' }, { key: 'm', label: 'M' },
            { key: ',', label: ['<', ','] }, { key: '.', label: ['>', '.'] }, { key: '/', label: ['?', '/'] },
            { key: 'Shift', label: 'Shift', className: 'key-widest' },
        ],
        [
            { key: ' ', label: 'Space', className: 'key-space' },
        ],
    ];

    // Finger mapping (simplified)
    /** @type {Record<string,string>} */
    const fingerForKey = {
        '`':'left-pinky','1':'left-pinky','q':'left-pinky','a':'left-pinky','z':'left-pinky','Tab':'left-pinky','CapsLock':'left-pinky','Shift':'left-pinky',
        '2':'left-ring','w':'left-ring','s':'left-ring','x':'left-ring','-':'right-pinky','=':'right-pinky',
        '3':'left-middle','e':'left-middle','d':'left-middle','c':'left-middle',
        '4':'left-index','r':'left-index','f':'left-index','v':'left-index','5':'left-index','t':'left-index','g':'left-index','b':'left-index',
        '6':'right-index','y':'right-index','h':'right-index','n':'right-index','7':'right-index','u':'right-index','j':'right-index','m':'right-index',
        '8':'right-middle','i':'right-middle', 'k':'right-middle', ',':'right-middle',
        '9':'right-ring','o':'right-ring','l':'right-ring','.' :'right-ring',
        '0':'right-pinky','p':'right-pinky',';':'right-pinky','/':'right-pinky','[':'right-pinky',']':'right-pinky','\\':'right-pinky','Backspace':'right-pinky','Enter':'right-pinky',
        ' ':'thumb'
    };

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
        clearTarget: () => setTarget(null)
    };
})();
