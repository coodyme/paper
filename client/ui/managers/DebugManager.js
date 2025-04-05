import * as THREE from 'three';
import { DebugControls } from '../components/DebugControls.js';

/**
 * Manages debug functionality and UI components
 */
export class DebugManager {
    constructor(scene) {
        this.scene = scene;
        this.enabled = {
            projectiles: false,
            physics: false,
            network: false,
            consoleLog: false // Added option to control console logging
        };
        this.debugObjects = [];
        this.categoryColors = {
            projectiles: '#ff00ff', // Magenta
            physics: '#00ffff',     // Cyan
            network: '#ffff00',      // Yellow
            default: '#ffffff'
        };
        
        // Create debug controls
        this.controls = null;
        this.isInGameScene = false; // Flag to track if we're in a game scene
    }
    
    /**
     * Initialize debug UI components
     */
    initDebugUI() {
        this.createDebugControls();
    }
    
    /**
     * Create debug controls UI
     */
    createDebugControls() {
        // Return if debug controls already exist
        if (document.getElementById('debug-controls') || this.controls) return;
        
        // Use DebugControls component instead of manual DOM creation
        this.controls = new DebugControls(this);
        this.controls.render(document.body);
        
        // Set visibility based on whether we're in game scene
        this.setDebugVisibility(this.isInGameScene);
    }
    
    /**
     * Set the game scene state - only show debug UI in game scene
     * @param {boolean} inGameScene - Whether we're currently in a game scene
     */
    setInGameScene(inGameScene) {
        this.isInGameScene = inGameScene;
        this.setDebugVisibility(inGameScene);
    }
    
    /**
     * Set visibility of debug controls
     * @param {boolean} visible - Whether controls should be visible
     */
    setDebugVisibility(visible) {
        if (this.controls) {
            this.controls.setVisibility(visible);
        }
    }
    
    /**
     * Toggle debug category on/off
     */
    toggleDebug(key, value) {
        this.enabled[key] = value;
        
        // Update global debug settings for backward compatibility
        if (!window.debugSettings) {
            window.debugSettings = {};
        }
        window.debugSettings[key] = value;
        
        // Only log to console if console logging is enabled
        if (this.enabled.consoleLog) {
            console.log(`Debug ${key}: ${value ? 'enabled' : 'disabled'}`);
        }
        
        // Show/hide debug info panel based on any debug option being enabled
        const anyEnabled = Object.values(this.enabled).some(val => val && key !== 'consoleLog');
        if (this.controls && this.controls.debugInfo) {
            this.controls.debugInfo.style.display = anyEnabled ? 'block' : 'none';
        }
    }
    
    /**
     * Set admin status and update UI visibility
     */
    setAdminStatus() {
        // Admin status is no longer relevant as debug is shown for all users
        if (this.controls) {
            this.controls.setVisibility(this.isInGameScene);
        }
    }
    
    /**
     * Log a debug message
     */
    log(category, message, data = null) {
        if (!this.enabled[category]) return;
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        const prefix = `[${timestamp}] [${category.toUpperCase()}]`;
        
        // Log to console only if console logging is enabled
        if (this.enabled.consoleLog && data !== null) {
            console.log(`${prefix} ${message}`, data);
        } else if (this.enabled.consoleLog) {
            console.log(`${prefix} ${message}`);
        }
        
        // Append to debug info panel
        if (this.controls && this.controls.debugInfo) {
            const logLine = document.createElement('div');
            logLine.textContent = `${prefix} ${message}`;
            
            // Add a small color indicator based on category
            logLine.style.borderLeft = `3px solid ${this.getCategoryColor(category)}`;
            logLine.style.paddingLeft = '5px';
            logLine.style.marginBottom = '2px';
            
            // Prepend to have newest logs at the top
            if (this.controls.debugInfo.firstChild) {
                this.controls.debugInfo.insertBefore(logLine, this.controls.debugInfo.firstChild);
            } else {
                this.controls.debugInfo.appendChild(logLine);
            }
            
            // Limit log entries to prevent memory issues
            if (this.controls.debugInfo.childNodes.length > 50) {
                this.controls.debugInfo.removeChild(this.controls.debugInfo.lastChild);
            }
        }
    }
    
    /**
     * Get color for a debug category
     */
    getCategoryColor(category) {
        return this.categoryColors[category] || this.categoryColors.default;
    }
    
    // Visualization methods
    
    /**
     * Visualize a raycast in 3D space
     */
    visualizeRaycast(origin, direction, length = 50, duration = 1000) {
        if (!this.enabled.projectiles) return;
        
        // Calculate endpoint
        const endPoint = new THREE.Vector3()
            .copy(origin)
            .add(direction.clone().multiplyScalar(length));
        
        // Create line geometry
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([origin, endPoint]);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const rayLine = new THREE.Line(lineGeometry, lineMaterial);
        
        this.scene.add(rayLine);
        
        this.log('projectiles', `Visualizing raycast from (${origin.x.toFixed(2)}, ${origin.y.toFixed(2)}, ${origin.z.toFixed(2)}) along vector (${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)})`);
        
        // Remove after duration
        setTimeout(() => {
            this.scene.remove(rayLine);
            lineGeometry.dispose();
            lineMaterial.dispose();
        }, duration);
        
        return rayLine;
    }
    
    /**
     * Visualize a point in 3D space
     */
    visualizePoint(position, color = 0xff0000, size = 0.2, duration = 1000) {
        if (!this.enabled.projectiles) return;
        
        // Create a sphere marker
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        this.scene.add(marker);
        
        this.log('projectiles', `Visualizing point at (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        
        // Remove after duration
        setTimeout(() => {
            this.scene.remove(marker);
            geometry.dispose();
            material.dispose();
        }, duration);
        
        return marker;
    }
    
    /**
     * Visualize a collision in 3D space
     */
    visualizeCollision(position, radius = 0.5, duration = 1000) {
        if (!this.enabled.physics) return;
        
        // Create a wireframe sphere for collision visualization
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        
        const collisionSphere = new THREE.Mesh(geometry, material);
        collisionSphere.position.copy(position);
        this.scene.add(collisionSphere);
        
        // Animate the sphere (expand and fade)
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Scale up slightly
                collisionSphere.scale.set(
                    1 + progress * 0.5,
                    1 + progress * 0.5,
                    1 + progress * 0.5
                );
                
                // Fade out
                material.opacity = 0.5 * (1 - progress);
                
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(collisionSphere);
                geometry.dispose();
                material.dispose();
            }
        };
        
        animate();
        
        return collisionSphere;
    }
    
    /**
     * Log a network event
     */
    logNetworkEvent(eventName, data) {
        if (!this.enabled.network) return;
        
        this.log('network', `Event: ${eventName}`, data);
    }
    
    /**
     * Show velocity vector for an object
     */
    showVelocityVector(object, velocity, scaleFactor = 5) {
        if (!this.enabled.physics || !object) return;
        
        const position = object.position.clone();
        const direction = velocity.clone().normalize();
        const length = velocity.length() * scaleFactor;
        
        return this.visualizeRaycast(position, direction, length);
    }
    
    /**
     * Clean up debug UI and resources
     */
    cleanup() {
        // Remove all debug objects from scene
        this.debugObjects.forEach(obj => {
            if (obj.parent) {
                obj.parent.remove(obj);
            }
        });
        this.debugObjects = [];
        
        // Clean up controls
        if (this.controls) {
            this.controls.cleanup();
            this.controls = null;
        }
    }
}

// Create singleton instance
let debugManagerInstance = null;

/**
 * Initialize or get the DebugManager instance
 */
export function initDebugManager(scene, isInGameScene = false) {
    if (!debugManagerInstance) {
        debugManagerInstance = new DebugManager(scene);
    } else {
        // Update existing instance with new scene
        debugManagerInstance.scene = scene;
    }
    
    // Update game scene status
    debugManagerInstance.setInGameScene(isInGameScene);
    
    // Always initialize UI when this function is called
    debugManagerInstance.initDebugUI();
    
    return debugManagerInstance;
}

/**
 * Get the current DebugManager instance
 */
export function getDebugManager() {
    if (!debugManagerInstance) {
        console.warn('Debug manager not initialized. Call initDebugManager(scene, isInGameScene) first.');
    }
    return debugManagerInstance;
}