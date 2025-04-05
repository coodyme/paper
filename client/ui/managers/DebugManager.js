import * as THREE from 'three';

/**
 * Manages debug functionality and UI components
 */
export class DebugManager {
    constructor(scene) {
        this.scene = scene;
        this.enabled = {
            projectiles: false,
            physics: false,
            network: false
        };
        this.debugObjects = [];
        this.categoryColors = {
            projectiles: '#00ff00',
            physics: '#ffff00',
            network: '#00ffff',
            default: '#ffffff'
        };
        
        // Create debug controls
        this.controls = null;
    }
    
    /**
     * Initialize debug UI components
     */
    initDebugUI() {
        // Replace the call to non-existent showControls with createDebugControls
        this.createDebugControls();
    }
    
    /**
     * Create debug controls UI
     */
    createDebugControls() {
        // Return if debug controls already exist
        if (document.getElementById('debug-controls')) return;
        
        // Create the container
        const debugControls = document.createElement('div');
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
        
        // Add debug options
        this.addDebugOptions(debugControls);
        
        this.debugControls = debugControls;
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
            checkbox.checked = this.enabled[option.id] || false;
            
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
                this.toggleDebug(option.id, checkbox.checked);
            });
        });
        
        // Add a debug info panel for displaying real-time debug information
        this.debugInfo = document.createElement('div');
        this.debugInfo.id = 'debug-info';
        this.debugInfo.style.marginTop = '10px';
        this.debugInfo.style.padding = '5px';
        this.debugInfo.style.borderTop = '1px solid rgba(255, 255, 255, 0.3)';
        this.debugInfo.style.fontFamily = 'monospace';
        this.debugInfo.style.fontSize = '12px';
        this.debugInfo.style.whiteSpace = 'pre-wrap';
        this.debugInfo.style.maxHeight = '200px';
        this.debugInfo.style.overflowY = 'auto';
        this.debugInfo.style.display = 'none'; // Initially hidden
        container.appendChild(this.debugInfo);
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
        
        console.log(`Debug ${key}: ${value ? 'enabled' : 'disabled'}`);
        
        // Show/hide debug info panel based on any debug option being enabled
        const anyEnabled = Object.values(this.enabled).some(val => val);
        if (this.debugInfo) {
            this.debugInfo.style.display = anyEnabled ? 'block' : 'none';
        }
    }
    
    /**
     * Set admin status and update UI visibility
     */
    setAdminStatus() {
        // Admin status is no longer relevant as debug is shown for all users
        if (this.controls) {
            this.controls.setVisibility(true);
        }
    }
    
    /**
     * Log a debug message
     */
    log(category, message, data = null) {
        if (!this.enabled[category]) return;
        
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        const prefix = `[${timestamp}] [${category.toUpperCase()}]`;
        
        // Log to console
        if (data !== null) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
        
        // Only show in UI for admin users
        if (!this.isAdmin) return;
        
        // Append to debug info panel
        if (this.debugInfo) {
            const logLine = document.createElement('div');
            logLine.textContent = `${prefix} ${message}`;
            
            // Add a small color indicator based on category
            logLine.style.borderLeft = `3px solid ${this.getCategoryColor(category)}`;
            logLine.style.paddingLeft = '5px';
            logLine.style.marginBottom = '2px';
            
            // Prepend to have newest logs at the top
            if (this.debugInfo.firstChild) {
                this.debugInfo.insertBefore(logLine, this.debugInfo.firstChild);
            } else {
                this.debugInfo.appendChild(logLine);
            }
            
            // Limit log entries to prevent memory issues
            if (this.debugInfo.childNodes.length > 50) {
                this.debugInfo.removeChild(this.debugInfo.lastChild);
            }
        }
    }
    
    /**
     * Get color for a debug category
     */
    getCategoryColor(category) {
        const colors = {
            projectiles: '#ff00ff', // Magenta
            physics: '#00ffff',     // Cyan
            network: '#ffff00'      // Yellow
        };
        
        return colors[category] || '#ffffff';
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
        
        // Remove controls from DOM
        if (this.controls && this.controls.element && this.controls.element.parentNode) {
            this.controls.element.parentNode.removeChild(this.controls.element);
            this.controls = null;
        }
    }
}

// Create singleton instance
let debugManagerInstance = null;

/**
 * Initialize or get the DebugManager instance
 */
export function initDebugManager(scene, isAdmin = false) {
    if (!debugManagerInstance) {
        debugManagerInstance = new DebugManager(scene);
    } else {
        // Update existing instance with new scene and admin status
        debugManagerInstance.scene = scene;
        debugManagerInstance.setAdminStatus();
    }
    
    // Always initialize UI when this function is called
    debugManagerInstance.initDebugUI();
    
    return debugManagerInstance;
}

/**
 * Get the current DebugManager instance
 */
export function getDebugManager() {
    if (!debugManagerInstance) {
        console.warn('Debug manager not initialized. Call initDebugManager(scene, isAdmin) first.');
    }
    return debugManagerInstance;
}