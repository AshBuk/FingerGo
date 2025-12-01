// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Modal Core module
 * Provides base infrastructure for modal rendering and lifecycle
 * Depends on: events.js (EventBus)
 */
(() => {
    if (!window.EventBus) {
        console.error('EventBus not available. Include events.js before modals/core.js');
        return;
    }

    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalClose = document.getElementById('modal-close');

    // Registry for modal type renderers
    const renderers = {};

    /**
     * Register a modal type renderer
     * @param {string} type - Modal type identifier
     * @param {Object} renderer - { title, render, bind? }
     */
    function registerType(type, renderer) {
        renderers[type] = renderer;
    }

    /**
     * Show modal with content
     * @param {string} type - Modal type
     * @param {Object} data - Data to display
     */
    function show(type, data) {
        if (!modalOverlay || !modalContent) return;

        const renderer = renderers[type];
        if (!renderer) {
            console.warn(`Unknown modal type: ${type}`);
            modalContent.innerHTML = '<p>No content available</p>';
            modalOverlay.classList.remove('modal-hidden');
            return;
        }

        // Set title
        if (modalTitle) {
            modalTitle.textContent =
                typeof renderer.title === 'function' ? renderer.title(data) : renderer.title;
        }

        // Render content
        modalContent.innerHTML = renderer.render(data);
        modalOverlay.classList.remove('modal-hidden');

        // Bind handlers if provided
        if (renderer.bind) {
            renderer.bind(data, modalContent);
        }
    }

    /**
     * Hide modal
     */
    function hide() {
        if (modalOverlay) {
            modalOverlay.classList.add('modal-hidden');
            // Clear any unsaved color preview
            if (window.ColorSettings?.clearPreview) {
                window.ColorSettings.clearPreview();
            }
            window.EventBus.emit('modal:closed');
        }
    }

    /**
     * Check if modal is currently visible
     * @returns {boolean}
     */
    function isVisible() {
        return modalOverlay && !modalOverlay.classList.contains('modal-hidden');
    }

    /**
     * Show confirmation dialog
     * @param {Object} options - Confirmation options
     * @returns {Promise<boolean>} true if confirmed
     */
    function confirm(options) {
        const esc = window.AppUtils?.escapeHtml || (s => String(s ?? ''));
        const {
            title = 'Confirm',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
        } = options;

        return new Promise(resolve => {
            if (modalTitle) modalTitle.textContent = title;
            modalContent.innerHTML = `
                <div class="confirm-dialog">
                    <p class="confirm-message">${esc(message)}</p>
                    <div class="confirm-actions">
                        <button type="button" class="btn-secondary" data-action="cancel">${esc(cancelText)}</button>
                        <button type="button" class="btn-danger" data-action="confirm">${esc(confirmText)}</button>
                    </div>
                </div>
            `;

            const handleClick = e => {
                const action = e.target.dataset?.action;
                if (action === 'confirm') {
                    resolve(true);
                    hide();
                } else if (action === 'cancel') {
                    resolve(false);
                    hide();
                }
            };

            modalContent.addEventListener('click', handleClick, { once: true });
            modalOverlay.classList.remove('modal-hidden');
        });
    }

    // Modal close handlers
    if (modalClose) {
        modalClose.addEventListener('click', hide);
    }

    // Export API
    window.ModalManager = {
        show,
        hide,
        isVisible,
        confirm,
        registerType,
    };
})();
