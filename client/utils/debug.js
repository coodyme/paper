import * as THREE from 'three';

export class Debug {
    constructor(scene, isAdmin = false) {
        this.scene = scene;
        this.isAdmin = isAdmin;
        this.enabled = {
            projectiles: false,
            physics: false,
            network: false
        };
        
        // We no longer create debug UI elements here as UIManager will handle that
    }
    
    // This method is no longer needed as UIManager will handle it
    createDebugControls() {
        // Method left for compatibility but does nothing
        // UIManager will handle creation of debug controls
    }
    
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
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.style.display = anyEnabled ? 'block' : 'none';
        }
    }
    
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
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            const logLine = document.createElement('div');
            logLine.textContent = `${prefix} ${message}`;
            
            // Add a small color indicator based on category
            logLine.style.borderLeft = `3px solid ${this.getCategoryColor(category)}`;
            logLine.style.paddingLeft = '5px';
            logLine.style.marginBottom = '2px';
            
            // Prepend to have newest logs at the top
            if (debugInfo.firstChild) {
                debugInfo.insertBefore(logLine, debugInfo.firstChild);
            } else {
                debugInfo.appendChild(logLine);
            }
            
            // Limit log entries to prevent memory issues
            if (debugInfo.childNodes.length > 50) {
                debugInfo.removeChild(debugInfo.lastChild);
            }
        }
    }
    
    getCategoryColor(category) {
        const colors = {
            projectiles: '#ff00ff', // Magenta
            physics: '#00ffff',     // Cyan
            network: '#ffff00'      // Yellow
        };
        
        return colors[category] || '#ffffff';
    }
    
    // Visualization methods
    
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
    
    // Network debug helpers
    
    logNetworkEvent(eventName, data) {
        if (!this.enabled.network) return;
        
        this.log('network', `Event: ${eventName}`, data);
    }
    
    // Physics debug helpers
    
    showVelocityVector(object, velocity, scaleFactor = 5) {
        if (!this.enabled.physics || !object) return;
        
        const position = object.position.clone();
        const direction = velocity.clone().normalize();
        const length = velocity.length() * scaleFactor;
        
        return this.visualizeRaycast(position, direction, length);
    }
}

// Create singleton instance
let debugInstance = null;

export function initDebug(scene, isAdmin = false) {
    if (!debugInstance) {
        debugInstance = new Debug(scene, isAdmin);
    } else {
        // Update existing instance with new scene and admin status
        debugInstance.scene = scene;
        debugInstance.isAdmin = isAdmin;
    }
    return debugInstance;
}

export function getDebugger() {
    if (!debugInstance) {
        console.warn('Debug system not initialized. Call initDebug(scene) first.');
    }
    return debugInstance;
}