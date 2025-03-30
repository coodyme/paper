import roleManager from './RoleManager.js';
import { getDebugger } from './debug.js';

/**
 * Manages all UI elements in the game
 */
export class UIManager {
    constructor() {
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
        
        this.showDebugControls();
    }

    /**
     * Create and show debug controls (admin only)
     */
    showDebugControls() {
        if (!roleManager.isAdmin()) return
        
        // Get existing debug controls or create them
        let debugControls = document.getElementById('debug-controls');
        if (!debugControls) {
            // Create the container
            debugControls = document.createElement('div');
            debugControls.id = 'debug-controls';
            debugControls.style.position = 'fixed';
            debugControls.style.top = '20px';
            debugControls.style.left = '20px';
            debugControls.style.color = 'white';
            debugControls.style.fontFamily = 'monospace';
            debugControls.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            debugControls.style.padding = '10px';
            debugControls.style.borderRadius = '5px';
            debugControls.style.fontSize = '14px';
            debugControls.style.zIndex = '1000';
            document.body.appendChild(debugControls);
            
            // Add debug options through the debugger
            this.addDebugOptions(debugControls);
        }
        
        this.elements.debugControls = debugControls;
    }

    /**
     * Add debug options to the debug controls panel
     */
    addDebugOptions(container) {
        const debugOptions = [
            { id: 'projectiles', label: 'Debug Projectiles' },
            { id: 'physics', label: 'Debug Physics' },
            { id: 'network', label: 'Debug Network' }
        ];
        
        // Create checkbox for each debug option
        debugOptions.forEach(option => {
            const optionContainer = document.createElement('div');
            optionContainer.style.marginBottom = '5px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `debug-${option.id}`;
            checkbox.className = 'debug-checkbox';
            checkbox.style.marginRight = '5px';
            checkbox.style.verticalAlign = 'middle';
            checkbox.checked = this.debugger?.enabled[option.id] || false;
            
            const label = document.createElement('label');
            label.htmlFor = `debug-${option.id}`;
            label.className = 'debug-label';
            label.textContent = option.label;
            label.style.cursor = 'pointer';
            label.style.userSelect = 'none';
            
            optionContainer.appendChild(checkbox);
            optionContainer.appendChild(label);
            container.appendChild(optionContainer);
            
            // Add event listener to checkbox
            checkbox.addEventListener('change', () => {
                if (this.debugger) {
                    this.debugger.toggleDebug(option.id, checkbox.checked);
                }
            });
        });
        
        // Add a debug info panel for displaying real-time debug information
        const debugInfo = document.createElement('div');
        debugInfo.id = 'debug-info';
        debugInfo.style.marginTop = '10px';
        debugInfo.style.padding = '5px';
        debugInfo.style.borderTop = '1px solid rgba(255, 255, 255, 0.3)';
        debugInfo.style.fontFamily = 'monospace';
        debugInfo.style.fontSize = '12px';
        debugInfo.style.whiteSpace = 'pre-wrap';
        debugInfo.style.maxHeight = '200px';
        debugInfo.style.overflowY = 'auto';
        debugInfo.style.display = 'none'; // Initially hidden
        container.appendChild(debugInfo);
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
        
        this.elements = {};
    }
}

// Create singleton instance
const uiManager = new UIManager();
export default uiManager;