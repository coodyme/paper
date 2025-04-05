/**
 * Game state machine to manage different states of the application
 */
export class StateManager {
    constructor() {
        // Available states
        this.states = {
            LOGIN: 'login',
            LOBBY: 'lobby',
            GAME: 'game'
        };
        
        this.currentState = this.states.LOGIN;
        this.previousState = null;
        
        // Callbacks for state changes
        this.stateChangeCallbacks = {};
    }
    
    /**
     * Change to a new state
     * @param {string} newState - The new state to transition to
     * @param {Object} data - Optional data to pass with the state change
     * @returns {boolean} - Whether the state change was successful
     */
    changeState(newState, data = {}) {
        if (!Object.values(this.states).includes(newState)) {
            console.error(`Invalid state: ${newState}`);
            return false;
        }
        
        // Store previous state
        this.previousState = this.currentState;
        this.currentState = newState;
        
        console.log(`State changed: ${this.previousState} -> ${this.currentState}`);
        
        // Call registered callbacks for this state change
        if (this.stateChangeCallbacks[newState]) {
            this.stateChangeCallbacks[newState].forEach(callback => {
                callback(data);
            });
        }
        
        return true;
    }
    
    /**
     * Register a callback for a state change
     * @param {string} state - The state to register for
     * @param {Function} callback - Function to call when state changes
     */
    onStateChange(state, callback) {
        if (!this.stateChangeCallbacks[state]) {
            this.stateChangeCallbacks[state] = [];
        }
        
        this.stateChangeCallbacks[state].push(callback);
    }
    
    /**
     * Get the current state
     * @returns {string} - Current state
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * Check if we're in a specific state
     * @param {string} state - State to check
     * @returns {boolean} - Whether we're in the specified state
     */
    isInState(state) {
        return this.currentState === state;
    }
    
    /**
     * Get previous state
     * @returns {string|null} - Previous state or null if no previous state
     */
    getPreviousState() {
        return this.previousState;
    }
}

// Create singleton instance
const stateManager = new StateManager();
export default stateManager;