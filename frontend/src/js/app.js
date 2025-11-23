// Copyright 2025 Asher Buk
// SPDX-License-Identifier: Apache-2.0
// https://github.com/AshBuk/FingerGo

/**
 * Application Controller
 * Main orchestrator for FingerGo application
 * Initializes all modules and coordinates lifecycle
 */
(() => {
    // Single source of truth for current text displayed/used by TypingEngine
    let currentText = null;
    let currentTheme = 'dark';

    function setThemeToggleIcon(theme) {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        btn.textContent = theme === 'dark' ? '🌙' : '☀️';
        btn.setAttribute('aria-label', 'Toggle theme');
        btn.setAttribute('title', 'Toggle theme');
    }

    function isModalVisible() {
        return window.ModalManager?.isVisible() || false;
    }

    /**
     * Set keyboard target to first character of text
     * @param {string} text - Text to get first char from
     */
    function setInitialTarget(text) {
        if (text?.length > 0 && window.KeyboardUI) {
            // Pass original char for Shift detection
            window.KeyboardUI.setTargetKey(text[0]);
        }
    }

    function buildLiveSummary() {
        if (!window.TypingEngine) return null;
        const session = window.TypingEngine.getSessionData();
        if (!session || (session.totalKeystrokes === 0 && session.currentIndex === 0)) {
            return null;
        }
        const metrics = window.TypingEngine.getMetrics();
        return {
            ...session,
            wpm: metrics?.wpm ?? 0,
            cpm: metrics?.cpm ?? 0,
            accuracy: metrics?.accuracy ?? 100,
            duration: metrics?.time ?? session.duration ?? 0,
            totalErrors: session.totalErrors ?? 0,
            totalKeystrokes: session.totalKeystrokes ?? 0,
        };
    }

    function showStatsModal() {
        if (!window.UIManager) return;
        // Pause session while modal is open to prevent error accumulation
        if (window.TypingEngine) {
            window.TypingEngine.pause();
        }
        const summary =
            (window.StatsManager && window.StatsManager.getSessionSummary
                ? window.StatsManager.getSessionSummary()
                : null) || buildLiveSummary();
        if (summary) {
            window.UIManager.showModal('session-summary', summary);
        }
    }

    /**
     * Apply theme and persist preference
     * @param {'dark'|'light'} theme
     */
    function applyTheme(theme) {
        currentTheme = theme === 'light' ? 'light' : 'dark';
        try {
            const body = document.body;
            const app = document.getElementById('app');
            // Update classes
            body.classList.remove('theme-dark', 'theme-light');
            app?.classList.remove('theme-dark', 'theme-light');
            body.classList.add(`theme-${currentTheme}`);
            app?.classList.add(`theme-${currentTheme}`);
            // Update stylesheet link
            const themeLink = document.getElementById('theme-css');
            if (themeLink) {
                themeLink.setAttribute('href', `styles/theme-${currentTheme}.css`);
            }
            // Persist locally
            try {
                localStorage.setItem('theme', currentTheme);
            } catch {
                /* localStorage unavailable */
            }
            setThemeToggleIcon(currentTheme);
        } catch (err) {
            console.warn('Failed to apply theme:', err);
        }
    }

    function toggleTheme() {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }

    // Fallback default text for MVP (hardcoded)
    // Contains: uppercase, symbols, brackets, quotes for testing finger mapping
    const FALLBACK_TEXT = `// Go Programming Language - Quick Reference

package main

import (
	"fmt"
	"strings"
)

// Person represents a user in the system.
type Person struct {
	Name    string
	Age     int
	Email   string
	IsAdmin bool
}

// Greet returns a personalized greeting message.
func (p *Person) Greet() string {
	if p.IsAdmin {
		return fmt.Sprintf("Welcome, Admin %s!", p.Name)
	}
	return fmt.Sprintf("Hello, %s! You are %d years old.", p.Name, p.Age)
}

// FilterUsers returns users matching the query (case-insensitive).
func FilterUsers(users []Person, query string) []Person {
	result := make([]Person, 0)
	for _, user := range users {
		if strings.Contains(strings.ToLower(user.Name), strings.ToLower(query)) {
			result = append(result, user)
		}
	}
	return result
}

func main() {
	users := []Person{
		{Name: "Alice", Age: 28, Email: "alice@example.com", IsAdmin: true},
		{Name: "Bob", Age: 35, Email: "bob@test.org", IsAdmin: false},
		{Name: "Charlie", Age: 22, Email: "charlie@dev.io", IsAdmin: false},
	}

	// Print greetings for each user
	for i := 0; i < len(users); i++ {
		fmt.Println(users[i].Greet())
	}

	// Filter and display results
	filtered := FilterUsers(users, "al")
	fmt.Printf("Found %d user(s) matching 'al'\\n", len(filtered))

	// Special characters test: @#$%^&*(){}[]|\\:;"'<>,.?/~!
	total := (100 + 50) * 2 / 4 - 25 // = 50
	fmt.Printf("Calculation: %d\\n", total)
}`;

    /**
     * Get default text (try backend first, fallback to hardcoded)
     * @returns {Promise<string>} Text to type
     */
    async function getDefaultText() {
        // Try Wails backend first (if available)
        if (window.go?.app?.App) {
            try {
                const text = await window.go.app.App.GetDefaultText();
                if (text && text.length > 0) {
                    return text;
                }
            } catch (err) {
                console.warn('Backend unavailable, using hardcoded text:', err);
            }
        }
        // Fallback to hardcoded text
        return FALLBACK_TEXT;
    }

    /**
     * Initialize all modules
     */
    async function initialize() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Apply stored theme early
        try {
            const stored = localStorage.getItem('theme');
            applyTheme(stored || 'dark');
        } catch {
            applyTheme('dark');
        }
        // Bind theme toggle (blur after click to prevent Space/Enter activation)
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                toggleTheme();
                themeBtn.blur();
            });
        }
        const resetBtn = document.getElementById('reset-session');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                reset();
                resetBtn.blur();
            });
        }
        const colorBtn = document.getElementById('color-settings');
        if (colorBtn) {
            colorBtn.addEventListener('click', () => {
                openColorSettings();
                colorBtn.blur();
            });
        }

        // Check required modules
        if (!window.EventBus) {
            console.error('EventBus not available. Ensure events.js is loaded.');
            return;
        }
        if (!window.TypingEngine) {
            console.error('TypingEngine not available. Ensure typing.js is loaded.');
            return;
        }
        if (!window.UIManager) {
            console.error('UIManager not available. Ensure ui.js is loaded.');
            return;
        }
        if (!window.KeyboardUI) {
            console.error('KeyboardUI not available. Ensure keyboard.js is loaded.');
            return;
        }

        // Load default text
        const defaultText = await getDefaultText();
        currentText = defaultText;

        // Render text in UI
        if (window.UIManager) {
            window.UIManager.renderText(defaultText);
        }

        // Set initial keyboard target (typing engine will start on first keystroke)
        setInitialTarget(defaultText);

        // Listen for modal close to resume session
        window.EventBus.on('modal:closed', () => {
            if (window.TypingEngine) {
                window.TypingEngine.resume();
            }
        });

        // Emit app ready event
        window.EventBus.emit('app:ready', {
            text: defaultText,
            timestamp: Date.now(),
        });
        console.log('FingerGo initialized successfully');
    }

    /**
     * Reset current typing session
     */
    function reset() {
        if (window.TypingEngine) {
            window.TypingEngine.reset();
        }

        // Reset stats display
        if (window.UIManager) {
            window.UIManager.updateStats(0, 0, 100, 0);
        }

        // Clear keyboard heatmap and error states
        if (window.StatsManager) {
            window.StatsManager.clearHeatmap();
        }
        if (window.KeyboardUI) {
            window.KeyboardUI.clearAllErrors();
        }

        // Reload default text
        getDefaultText().then(text => {
            currentText = text;
            if (window.UIManager) {
                window.UIManager.renderText(text);
            }
            setInitialTarget(text);
        });

        // Re-setup typing start listener for next session
        setupTypingStart();
    }

    /**
     * Load new text
     * @param {string} textId - Text identifier (for future backend integration)
     */
    async function loadText(textId) {
        let text = '';

        // Try backend first
        if (window.go?.app?.App) {
            try {
                text = await window.go.app.App.GetText(textId);
            } catch (err) {
                console.error('Failed to load text from backend:', err);
                return;
            }
        } else {
            // Fallback to default
            text = await getDefaultText();
        }
        if (!text || text.length === 0) {
            console.error('No text available');
            return;
        }
        currentText = text;

        // Reset current session
        if (window.TypingEngine) {
            window.TypingEngine.reset();
        }

        // Render new text
        if (window.UIManager) {
            window.UIManager.renderText(text);
        }

        setInitialTarget(text);
    }

    /**
     * Open settings modal
     */
    function openSettings() {
        if (window.UIManager) {
            window.UIManager.showModal('settings', {});
        }
    }

    /**
     * Open color settings modal
     */
    function openColorSettings() {
        if (window.UIManager) {
            window.UIManager.showModal('color-settings', { theme: currentTheme });
        }
    }

    /**
     * Toggle keyboard visibility
     */
    function toggleKeyboard() {
        const keyboardSection = document.getElementById('keyboard-section');
        if (keyboardSection) {
            const isHidden = keyboardSection.style.display === 'none';
            keyboardSection.style.display = isHidden ? 'flex' : 'none';
        }
    }

    /**
     * Handle global keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        window.addEventListener('keydown', e => {
            // Esc - Show stats modal (do not reset session)
            if (e.key === 'Escape') {
                if (isModalVisible()) return;
                e.preventDefault();
                showStatsModal();
                return;
            }
            // Ctrl+, - Open settings
            if (e.key === ',' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                openSettings();
            }
            // Ctrl+H - Toggle keyboard
            if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                toggleKeyboard();
            }
        });
    }

    /**
     * Start typing session on first keystroke
     */
    function setupTypingStart() {
        if (!window.TypingEngine) return;

        // Listen for first keystroke to start session
        const startHandler = e => {
            // Ignore modifier keys and shortcuts
            if (['Control', 'Alt', 'Meta', 'Shift'].includes(e.key)) return;
            if (e.ctrlKey || e.metaKey) return; // Ignore shortcuts
            if (window.KeyUtils?.isNavigationKey?.(e.key)) return;
            // Ignore if session already active
            const session = window.TypingEngine.getSessionData();
            if (session.isActive) {
                // Remove listener if session is active
                window.removeEventListener('keydown', startHandler);
                return;
            }

            // Get current cursor position from textarea
            const textInput = document.getElementById('text-input');
            const cursorPos = textInput?.selectionStart ?? 0;

            // Ensure text is available
            const ensureStart = text => {
                if (text && text.length > 0) {
                    // Start session at current cursor position
                    window.TypingEngine.start(text, cursorPos);
                    // Remove this listener after start
                    window.removeEventListener('keydown', startHandler);
                    // Process the current keystroke event that triggered the start
                    if (window.TypingEngine.handleKeyDown) {
                        window.TypingEngine.handleKeyDown(e);
                    }
                }
            };

            if (!currentText) {
                // Load once if not ready yet, then start
                getDefaultText().then(text => {
                    currentText = text;
                    // Also render to keep UI in sync
                    if (window.UIManager) {
                        window.UIManager.renderText(text);
                    }
                    ensureStart(text);
                });
            } else {
                // Start session synchronously with currentText
                ensureStart(currentText);
                // Remove this listener after start
                // (removal is handled inside ensureStart)
            }
        };
        window.addEventListener('keydown', startHandler);
    }

    // Initialize application when DOM is ready
    const boot = () =>
        initialize().then(() => {
            setupKeyboardShortcuts();
            setupTypingStart();
        });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // Export API
    window.App = {
        reset,
        loadText,
        openSettings,
        openColorSettings,
        toggleKeyboard,
        toggleTheme,
        applyTheme,
    };
})();
