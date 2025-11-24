// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Color Settings module
 * Handles custom color overrides per theme
 */
(() => {
    const STORAGE_KEY = 'customColors';

    /**
     * Load custom colors from localStorage
     * @returns {Object} { dark: {...}, light: {...} }
     */
    function loadColors() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    }

    /**
     * Save colors to localStorage
     * @param {Object} colors - { dark: {...}, light: {...} }
     */
    function saveColors(colors) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
        } catch {
            console.warn('Failed to save custom colors');
        }
    }

    /**
     * Get colors for a specific theme
     * @param {string} theme - 'dark' or 'light'
     * @returns {Object} Color overrides
     */
    function getColors(theme) {
        const all = loadColors();
        return all[theme] || {};
    }

    /**
     * Apply custom colors via injected <style> tag
     * @param {string} theme - 'dark' or 'light'
     */
    function applyColors(theme) {
        const colors = getColors(theme);
        const styleId = 'custom-colors';

        // Remove existing custom style
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        // Build CSS for current theme
        const entries = Object.entries(colors);
        if (entries.length === 0) {
            styleEl.textContent = '';
            return;
        }

        let css = '';
        entries.forEach(([varName, value]) => {
            css += `${varName}: ${value}; `;
            if (varName === '--accent') {
                const rgb = hexToRgb(value);
                if (rgb) {
                    css += `--accent-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b}; `;
                }
            }
        });

        // Apply to specific theme class for proper specificity
        styleEl.textContent = `.theme-${theme} { ${css} }`;
    }

    /**
     * Remove custom colors (restore theme defaults)
     */
    function clearColors() {
        const styleEl = document.getElementById('custom-colors');
        if (styleEl) {
            styleEl.textContent = '';
        }
    }

    // Store preview state for live updates
    let previewColors = {};

    /**
     * Preview a single color change (without saving)
     * @param {string} varName - CSS variable name
     * @param {string} value - Color value
     */
    function preview(varName, value) {
        previewColors[varName] = value;

        const theme = document.body.classList.contains('theme-light') ? 'light' : 'dark';
        const styleId = 'custom-colors-preview';

        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        let css = '';
        Object.entries(previewColors).forEach(([name, val]) => {
            css += `${name}: ${val}; `;
            if (name === '--accent') {
                const rgb = hexToRgb(val);
                if (rgb) {
                    css += `--accent-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b}; `;
                }
            }
        });

        styleEl.textContent = `.theme-${theme} { ${css} }`;
    }

    /**
     * Clear preview styles
     */
    function clearPreview() {
        previewColors = {};
        const styleEl = document.getElementById('custom-colors-preview');
        if (styleEl) {
            styleEl.textContent = '';
        }
    }

    /**
     * Save colors for a theme
     * @param {string} theme - 'dark' or 'light'
     * @param {Object} colors - { '--bg': '#...', ... }
     */
    function save(theme, colors) {
        clearPreview();
        const all = loadColors();
        all[theme] = colors;
        saveColors(all);
        applyColors(theme);
    }

    /**
     * Reset theme to defaults (clear custom colors)
     * @param {string} theme - 'dark' or 'light'
     */
    function reset(theme) {
        clearPreview();
        clearColors();
        const all = loadColors();
        delete all[theme];
        saveColors(all);
    }

    /**
     * Convert hex color to RGB object
     * @param {string} hex - Hex color (#RRGGBB)
     * @returns {Object|null} { r, g, b } or null
     */
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : null;
    }

    /**
     * Initialize: apply saved colors on boot
     */
    function init() {
        // Listen for theme changes to reapply colors
        const observer = new MutationObserver(() => {
            const theme = document.body.classList.contains('theme-light') ? 'light' : 'dark';
            applyColors(theme);
        });
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
        });
        // Apply initial colors
        const initialTheme = document.body.classList.contains('theme-light') ? 'light' : 'dark';
        applyColors(initialTheme);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export API
    window.ColorSettings = {
        getColors,
        preview,
        clearPreview,
        save,
        reset,
        applyColors,
    };
})();
