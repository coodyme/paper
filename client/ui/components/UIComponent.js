/**
 * Base class for UI components
 */
export class UIComponent {
    constructor() {
        this.element = null;
        this.parent = null;
    }
    
    /**
     * Create the DOM elements for this component
     * @returns {HTMLElement} The root element of the component
     */
    createElement() {
        // To be implemented by subclasses
        throw new Error('createElement method must be implemented by subclass');
    }
    
    /**
     * Render the component to the DOM
     * @param {HTMLElement} parent - The parent element to append this component to
     */
    render(parent) {
        if (!this.element) {
            this.element = this.createElement();
        }
        
        if (parent) {
            this.parent = parent;
            parent.appendChild(this.element);
        }
        
        return this.element;
    }
    
    /**
     * Clean up the component
     */
    cleanup() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
        this.parent = null;
    }
}