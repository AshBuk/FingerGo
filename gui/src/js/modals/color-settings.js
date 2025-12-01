// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Color Settings modal renderer
 * Allows customization of theme colors with live preview
 */
(() => {
    if (!window.ModalManager) {
        console.error('ModalManager not available. Include modals/core.js first');
        return;
    }

    const esc = window.AppUtils?.escapeHtml || (s => String(s ?? ''));

    /**
     * Convert CSS color value to hex
     * @param {string} value - CSS color value
     * @returns {string|null} Hex color or null
     */
    function toHex(value) {
        if (!value) return null;
        const trimmed = value.trim();
        if (trimmed.startsWith('#')) return trimmed;
        const rgbMatch = trimmed.match(
            /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+(?:\.\d+)?))?\s*\)$/i,
        );
        if (rgbMatch) {
            const hex = [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
                .map(x => Number(x).toString(16).padStart(2, '0'))
                .join('');
            return `#${hex}`;
        }
        return null;
    }

    /**
     * Generate color settings HTML
     * @param {Object} data - Settings data with theme
     * @returns {string} HTML content
     */
    function render(data) {
        const theme = esc(data?.theme || 'dark');
        const savedColors = window.ColorSettings?.getColors(data?.theme || 'dark') || {};

        // Read current CSS values
        const styleTarget = document.body || document.documentElement;
        const style = getComputedStyle(styleTarget);

        const getColor = varName => {
            const saved = savedColors[varName];
            if (saved) return saved;
            const computed = style.getPropertyValue(varName);
            return toHex(computed) || '#000000';
        };

        return `
            <div class="color-settings">
                <p class="color-theme-label">Editing: <strong>${theme}</strong> theme</p>
                <div class="color-group">
                    <label class="color-row">
                        <span>Background</span>
                        <input type="color" data-var="--bg" value="${getColor('--bg')}">
                    </label>
                    <label class="color-row">
                        <span>Text & Keys</span>
                        <input type="color" data-var="--accent" value="${getColor('--accent')}">
                    </label>
                    <label class="color-row">
                        <span>UI Text</span>
                        <input type="color" data-var="--text-default" value="${getColor('--text-default')}">
                    </label>
                    <label class="color-row">
                        <span>Error</span>
                        <input type="color" data-var="--error-text" value="${getColor('--error-text')}">
                    </label>
                </div>
                <div class="color-actions">
                    <button type="button" class="color-btn" id="color-reset">Reset</button>
                    <button type="button" class="color-btn color-btn-primary" id="color-save">Save</button>
                </div>
            </div>
        `;
    }

    /**
     * Bind color settings event handlers
     * @param {Object} data - Modal data
     * @param {HTMLElement} container - Modal content container
     */
    function bind(data, container) {
        const theme = data?.theme || 'dark';
        const inputs = container.querySelectorAll('input[type="color"]');

        // Live preview on change
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (window.ColorSettings) {
                    window.ColorSettings.preview(input.dataset.var, input.value);
                }
            });
        });

        // Save button
        const saveBtn = container.querySelector('#color-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const colors = {};
                inputs.forEach(input => {
                    colors[input.dataset.var] = input.value;
                });
                if (window.ColorSettings) {
                    window.ColorSettings.save(theme, colors);
                }
                window.ModalManager.hide();
            });
        }

        // Reset button
        const resetBtn = container.querySelector('#color-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (window.ColorSettings) {
                    window.ColorSettings.reset(theme);
                }
                window.ModalManager.hide();
            });
        }
    }

    // Register with ModalManager
    window.ModalManager.registerType('color-settings', {
        title: 'Color Settings',
        render,
        bind,
    });
})();
