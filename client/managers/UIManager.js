import { getDebugger } from '../utils/debug.js';
import { roleManager } from '../security/roleManager.js';
import { DebugControls } from '../ui/components/DebugControls.js';
import { GameUI } from '../ui/components/GameUI.js';
import { ChatInput } from '../ui/components/ChatInput.js';

/**
 * Manages all UI elements in the game
 */
export class UIManager {
    constructor() {
        this.components = {};
        this.elements = {};
        this.debugger = null; // Initialize to null, will set later
    }

    /**
     * Initialize UI elements
     * @param {Debug} debugger - The debug instance
     */
    init(debugInstance) {
        // Store the debugger instance
        this.debugger = debugInstance || getDebugger();
        
        if (roleManager.isAdmin()) {
            this.showDebugControls();
        }
    }

    /**
     * Create and show debug controls (admin only)
     */
    showDebugControls() {
        if (!roleManager.isAdmin()) return;
        
        this.components.debugControls = new DebugControls(this.debugger);
        this.components.debugControls.render(document.body);
        
        // For backwards compatibility with old code
        this.elements.debugControls = this.components.debugControls.element;
    }

    /**
     * Add debug options to the debug controls panel
     */
    addDebugOptions(container) {
        if (!this.components.debugControls) return;
        this.components.debugControls.addOptions(container);
    }

    /**
     * Create game UI elements like chat, controls, etc.
     */
    createGameUI() {
        this.components.gameUI = new GameUI();
        this.components.gameUI.render(document.body);
        
        // Create chat component
        this.components.chat = new ChatInput(this.networkManager);
        this.components.chat.render(document.body);
        
        // Additional UI elements can be created here
    }

    /**
     * Clean up all UI elements
     */
    cleanup() {
        // Remove all created UI components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.cleanup === 'function') {
                component.cleanup();
            }
        });
        
        // For backwards compatibility with old code
        Object.values(this.elements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        this.components = {};
        this.elements = {};
    }
}

// Create singleton instance
const uiManager = new UIManager();
export default uiManager;