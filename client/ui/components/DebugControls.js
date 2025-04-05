import { UIComponent } from './UIComponent.js';
import { UIStyles } from '../styles/UIStyles.js';

/**
 * Debug controls component for all users (no longer admin-only)
 */
export class DebugControls extends UIComponent {
    constructor(debugManager) {
        super();
        this.debugManager = debugManager;
        this.debugInfo = null;
        this.visible = true; // Default to visible for everyone
    }
    
    /**
     * Set visibility of debug controls (no longer based on admin status)
     * @param {boolean} visible - Whether the controls should be visible
     */
    setVisibility(visible) {
        this.visible = visible;
        if (this.element) {
            this.element.style.display = this.visible ? 'block' : 'none';
        }
    }
    
    createElement() {
        const debugControls = document.createElement('div');
        debugControls.id = 'debug-controls';
        
        // Apply styles
        Object.assign(debugControls.style, UIStyles.debugControls);
        
        // Set initial visibility
        debugControls.style.display = this.visible ? 'block' : 'none';
        
        // Add debug options
        this.addDebugOptions(debugControls);
        
        this.element = debugControls;
        return debugControls;
    }
    
    /**
     * Add debug options to the debug controls panel
     */
    addDebugOptions(container) {
        const debugOptions = [
            { id: 'projectiles', label: 'Debug Projectiles' },
            { id: 'physics', label: 'Debug Physics' },
            { id: 'network', label: 'Debug Network' },
            { id: 'consoleLog', label: 'Log to Console' }
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
            checkbox.checked = this.debugManager?.enabled[option.id] || false;
            
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
                if (this.debugManager) {
                    this.debugManager.toggleDebug(option.id, checkbox.checked);
                }
            });
        });
        
        // Add title for the debug panel
        const titleElement = document.createElement('div');
        titleElement.textContent = 'Debug Panel';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.marginBottom = '10px';
        titleElement.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
        titleElement.style.paddingBottom = '5px';
        
        // Insert title at the beginning of container
        if (container.firstChild) {
            container.insertBefore(titleElement, container.firstChild);
        } else {
            container.appendChild(titleElement);
        }
        
        // Add a debug info panel for displaying real-time debug information
        this.debugInfo = document.createElement('div');
        this.debugInfo.id = 'debug-info';
        Object.assign(this.debugInfo.style, UIStyles.debugInfo);
        
        // Add header for debug info
        const infoHeader = document.createElement('div');
        infoHeader.textContent = 'Debug Output';
        infoHeader.style.fontWeight = 'bold';
        infoHeader.style.marginBottom = '5px';
        
        // Add clear button for debug info
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear';
        clearButton.style.fontSize = '10px';
        clearButton.style.padding = '2px 5px';
        clearButton.style.float = 'right';
        clearButton.style.cursor = 'pointer';
        clearButton.onclick = () => {
            if (this.debugInfo) {
                this.debugInfo.innerHTML = '';
            }
        };
        
        infoHeader.appendChild(clearButton);
        container.appendChild(infoHeader);
        container.appendChild(this.debugInfo);
    }
    
    /**
     * Update debug info panel with current debug information
     * @param {Object} info - Debug information to display
     */
    updateDebugInfo(info) {
        if (this.debugInfo && info) {
            this.debugInfo.innerHTML = '';
            
            for (const [key, value] of Object.entries(info)) {
                const line = document.createElement('div');
                line.textContent = `${key}: ${JSON.stringify(value)}`;
                this.debugInfo.appendChild(line);
            }
        }
    }
}