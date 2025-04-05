import stateManager from './StateManager.js';

/**
 * Manages which game features are enabled based on the current game state
 */
export class GameFeatureManager {
    constructor() {
        this.features = {
            movement: false,
            chat: false,
            projectiles: false,
            voice: false,
            jukebox: false
        };
        
        this.setupStateChangeListeners();
    }
    
    /**
     * Listen for state changes to enable/disable features
     */
    setupStateChangeListeners() {
        // When entering game state, enable game features
        stateManager.onStateChange(stateManager.states.GAME, () => {
            this.enableGameFeatures();
        });
        
        // When entering lobby or login states, disable game features
        stateManager.onStateChange(stateManager.states.LOBBY, () => {
            this.disableGameFeatures();
        });
        
        stateManager.onStateChange(stateManager.states.LOGIN, () => {
            this.disableGameFeatures();
        });
    }
    
    /**
     * Enable all game features
     */
    enableGameFeatures() {
        this.setFeature('movement', true);
        this.setFeature('chat', true);
        this.setFeature('projectiles', true);
        this.setFeature('voice', true);
        this.setFeature('jukebox', true);
        
        console.log('Game features enabled');
    }
    
    /**
     * Disable all game features
     */
    disableGameFeatures() {
        this.setFeature('movement', false);
        this.setFeature('chat', false);
        this.setFeature('projectiles', false);
        this.setFeature('voice', false);
        this.setFeature('jukebox', false);
        
        console.log('Game features disabled');
    }
    
    /**
     * Enable or disable a specific feature
     * @param {string} feature - Feature name
     * @param {boolean} enabled - Whether the feature should be enabled
     */
    setFeature(feature, enabled) {
        if (this.features.hasOwnProperty(feature)) {
            this.features[feature] = enabled;
        }
    }
    
    /**
     * Check if a feature is enabled
     * @param {string} feature - Feature name
     * @returns {boolean} - Whether the feature is enabled
     */
    isEnabled(feature) {
        return this.features[feature] || false;
    }
}

// Create singleton instance
const gameFeatureManager = new GameFeatureManager();
export default gameFeatureManager;