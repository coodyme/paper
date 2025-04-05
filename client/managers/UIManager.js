import roleManager from './RoleManager.js';
import { getDebugger } from '../utils/debug.js';
import { getDebugManager } from '../ui/managers/DebugManager.js';

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
}

// Create singleton instance
const uiManager = new UIManager();
export default uiManager;