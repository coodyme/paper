import { UIComponent } from './UIComponent.js';
import { UIStyles } from '../styles/UIStyles.js';

/**
 * Debug controls component for admin users
 */
export class DebugControls extends UIComponent {
    constructor(debugger) {
        super();
        this.debugger = debugger;
        this.debugInfo = null;
    }
    
    createElement() {
        const debugControls = document.createElement('div');
        debugControls.id = 'debug-controls';
        
        // Apply styles
        Object.assign(debugControls.style, UIStyles.debugControls);
        
        // Add debug options
        this.addDebugOptions(debugControls);
        
        return debugControls;
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
        this.debugInfo = document.createElement('div');
        this.debugInfo.id = 'debug-info';
        Object.assign(this.debugInfo.style, UIStyles.debugInfo);
        container.appendChild(this.debugInfo);
    }
}