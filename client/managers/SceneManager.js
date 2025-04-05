/**
 * Base Scene class that all scenes will inherit from
 */
export class Scene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
    }
    
    init() {}
    update(deltaTime) {}
    resize() {}
    cleanup() {}
}

/**
 * Manages scene transitions and lifecycle
 */
export class SceneManager {
    constructor(container) {
        this.container = container;
        this.currentScene = null;
        this.scenes = {};
        this.transitioning = false;
    }
    
    /**
     * Register a scene with the scene manager
     * @param {string} name - Scene identifier
     * @param {Class} SceneClass - Scene class constructor
     */
    registerScene(name, SceneClass) {
        this.scenes[name] = SceneClass;
    }
    
    /**
     * Change to a different scene with transition
     * @param {string} sceneName - Name of scene to change to
     * @param {Object} params - Parameters to pass to the new scene
     */
    async changeScene(sceneName, params = {}) {
        // Prevent multiple scene changes at once
        if (this.transitioning) {
            console.warn('Scene transition already in progress, ignoring');
            return;
        }
        
        this.transitioning = true;
        
        // Cleanup current scene if it exists
        if (this.currentScene) {
            this.currentScene.cleanup();
            // Clear container
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
        }
        
        // Create and initialize new scene
        const SceneClass = this.scenes[sceneName];
        if (!SceneClass) {
            console.error(`Scene ${sceneName} not found`);
            this.transitioning = false;
            return;
        }
        
        console.log(`Changing scene to: ${sceneName}`);
        
        try {
            this.currentScene = new SceneClass(this, params);
            await this.currentScene.init();
            this.transitioning = false;
        } catch (error) {
            console.error(`Error initializing scene ${sceneName}:`, error);
            this.transitioning = false;
        }
    }
    
    /**
     * Get the current scene instance
     * @returns {Scene} - Current scene
     */
    getCurrentScene() {
        return this.currentScene;
    }
    
    /**
     * Update the current scene
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        if (this.currentScene && !this.transitioning) {
            this.currentScene.update(deltaTime);
        }
    }
    
    /**
     * Resize the current scene
     */
    resize() {
        if (this.currentScene && !this.transitioning) {
            this.currentScene.resize();
        }
    }
}