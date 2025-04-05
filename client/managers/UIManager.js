import roleManager from './RoleManager.js';
import { getDebugger } from '../utils/debug.js';
import { getDebugManager } from '../ui/managers/DebugManager.js';
import stateManager from './StateManager.js';

/**
 * Manages all UI elements in the game
 */
export class UIManager {
    constructor() {
        this.elements = {};
        this.debugger = null; // Initialize to null, will set later
        this.debugManager = null;
        this.currentScene = null;
    }

    /**
     * Initialize UI elements
     * @param {Debug} debugInstance - The debug instance
     * @param {string} sceneName - The current scene name
     */
    init(debugInstance, sceneName = null) {
        // Store the debugger instance
        this.debugger = debugInstance || getDebugger();
        
        // Get the debug manager
        this.debugManager = getDebugManager();
        
        // Store current scene
        this.currentScene = sceneName;
        
        // Set debug visibility based on scene
        const isGameScene = sceneName === 'game';
        if (this.debugger) {
            this.debugger.setInGameScene(isGameScene);
        }
        
        // Initialize key listeners
        this.initKeyListeners();
    }

    /**
     * Change the current scene
     * @param {string} sceneName - The new scene name
     */
    changeScene(sceneName) {
        this.currentScene = sceneName;
        
        // Update debug visibility based on new scene
        const isGameScene = sceneName === 'game';
        if (this.debugger) {
            this.debugger.setInGameScene(isGameScene);
        }
    }

    /**
     * Create and show debug controls (now for all users, not just admin)
     * @deprecated Use DebugManager instead
     */
    showDebugControls() {
        // This method is kept for backward compatibility
        // The debug UI is now managed by DebugManager
        if (this.debugManager) {
            this.debugManager.createDebugControls();
        }
    }

    /**
     * Add debug options to the debug controls panel
     * @deprecated Use DebugManager instead
     */
    addDebugOptions(container) {
        // This method is kept for backward compatibility
        // The debug options are now managed by DebugManager
        console.warn('UIManager.addDebugOptions is deprecated. Use DebugManager instead.');
    }

    /**
     * Create game UI elements like chat, controls, etc.
     */
    createGameUI() {
        // Additional UI elements can be created here
    }

    /**
     * Clean up all UI elements
     */
    cleanup() {
        // Remove all created UI elements
        Object.values(this.elements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Clean up debug UI
        if (this.debugManager) {
            this.debugManager.cleanup();
        }
        
        this.elements = {};
    }

    /**
     * Initialize global key listeners
     */
    initKeyListeners() {
        // Add keydown listener for chat and other global controls
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    /**
     * Remove global key listeners
     */
    removeKeyListeners() {
        document.removeEventListener('keydown', this.handleKeyPress.bind(this));
    }

    /**
     * Toggle chat input visibility
     */
    toggleChatInput() {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            if (chatInput.style.display === 'none' || chatInput.style.display === '') {
                chatInput.style.display = 'block';
                chatInput.focus();
            } else {
                chatInput.style.display = 'none';
            }
        }
    }

    // Add state checking for chat functionality
    handleKeyPress(event) {
        // Only enable chat in GAME state
        const currentState = stateManager.getCurrentState();
        
        // Check if Enter key is pressed and we're in game state
        if (event.key === 'Enter' && currentState === stateManager.states.GAME) {
            // Toggle chat UI
            this.toggleChatInput();
            event.preventDefault(); // Prevent default Enter behavior
        }
        // Other key handlers...
    }
}

// Create singleton instance
const uiManager = new UIManager();
export default uiManager;