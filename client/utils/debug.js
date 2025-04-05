import * as THREE from 'three';
import { initDebugManager, getDebugManager } from '../ui/managers/DebugManager.js';

// For backward compatibility - wrapper class that delegates to DebugManager
export class Debug {
    constructor(scene, isInGameScene = false) {
        // Initialize the debug manager and store a reference
        this.manager = initDebugManager(scene, isInGameScene);
    }
    
    // Forward all methods to the debug manager
    toggleDebug(key, value) {
        this.manager.toggleDebug(key, value);
    }
    
    log(category, message, data = null) {
        this.manager.log(category, message, data);
    }
    
    getCategoryColor(category) {
        return this.manager.getCategoryColor(category);
    }
    
    visualizeRaycast(origin, direction, length = 50, duration = 1000) {
        return this.manager.visualizeRaycast(origin, direction, length, duration);
    }
    
    visualizePoint(position, color = 0xff0000, size = 0.2, duration = 1000) {
        return this.manager.visualizePoint(position, color, size, duration);
    }
    
    visualizeCollision(position, radius = 0.5, duration = 1000) {
        return this.manager.visualizeCollision(position, radius, duration);
    }
    
    logNetworkEvent(eventName, data) {
        this.manager.logNetworkEvent(eventName, data);
    }
    
    showVelocityVector(object, velocity, scaleFactor = 5) {
        return this.manager.showVelocityVector(object, velocity, scaleFactor);
    }
    
    // Set whether we're in a game scene
    setInGameScene(inGameScene) {
        this.manager.setInGameScene(inGameScene);
    }
    
    // Getter for the enabled state
    get enabled() {
        return this.manager.enabled;
    }
    
    // Getter for the scene
    get scene() {
        return this.manager.scene;
    }
    
    // Setter for the scene
    set scene(value) {
        this.manager.scene = value;
    }
}

// Create singleton instance
let debugInstance = null;

export function initDebug(scene, isInGameScene = false) {
    if (!debugInstance) {
        debugInstance = new Debug(scene, isInGameScene);
    } else {
        // Update existing instance with new scene and game scene status
        debugInstance.scene = scene;
        debugInstance.setInGameScene(isInGameScene);
    }
    return debugInstance;
}

export function getDebugger() {
    if (!debugInstance) {
        console.warn('Debug system not initialized. Call initDebug(scene, isInGameScene) first.');
    }
    return debugInstance;
}