<!--
Copyright 2025 Asher Buk
SPDX-License-Identifier: Apache-2.0
-->

## Keyboard

#### Layout
- **Layouts:** English QWERTY and Dvorak, Russian JCUKEN, German QWERTZ, French AZERTY, Spanish (Spain and Latin America), Traditional Chinese Bopomofo. Selected in Settings, one file per layout in `gui/src/js/layouts/`.
- **Input:** keystrokes are matched by `KeyboardEvent.key`, so the OS layout must match the selected one. Characters typed through dead keys or an IME arrive on `compositionend`; the target key is highlighted in two steps for dead keys.
- **Physical input:** a layout with `physicalInput: true` (Bopomofo) is typed on an English OS layout. FingerGo maps `KeyboardEvent.code` to the layout character, because these layouts otherwise need an IME.
- **Visual features:**
  - Current target key highlighted
  - Finger mapping color 
  - Real-time key press visualization

#### Finger Mapping (Color-coded)

Left Hand:
- Pinky:    Q A Z ` 1 (+ Shift, Tab, Caps Lock) (color: red)
- Ring:     W S X 2 (color: orange)
- Middle:   E D C 3 (color: yellow)
- Index:    R F V, T G B (4 5) (color: green)

Right Hand:
- Index:    Y H N, U J M (6 7) (color: blue)
- Middle:   I K , (8) (color: indigo)
- Ring:     O L . (9) (color: violet)
- Pinky:    P ; / [ ] ' \ - = (0) (+ Shift, Enter, Backspace) (color: pink)

Thumbs: Space

Note: Number row and symbols follow standard touch typing assignments.

**Color for each current key - Pastel Blue**

#### Statistics Features
- **Per-key tracking:** Count mistakes for each key
- **Heatmap:** Visual representation of problematic keys after session
- **Improvement suggestions:** Identify weakest keys for targeted practice
