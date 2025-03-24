import * as THREE from 'three';

export class Debug {
    constructor(scene) {
        this.scene = scene;
        this.enabled = {
            projectiles: false,
            physics: false,
            network: false
        };
        
        // Create debug UI elements
        this.createDebugControls();
    }
    
    createDebugControls() {
        // Create debug controls container if it doesn't exist
        let debugControls = document.getElementById('debug-controls');
        if (!debugControls) {
            // Create the container
            debugControls = document.createElement('div');
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
        }
    }
    
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
            checkbox.checked = this.enabled[option.id];
            
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
        const debugInfo = document.createElement('div');
        debugInfo.id = 'debug-info';
        debugInfo.style.marginTop = '10px';
        debugInfo.style.padding = '5px';
        debugInfo.style.borderTop = '1px solid rgba(255, 255, 255, 0.3)';
        debugInfo.style.fontFamily = 'monospace';
        debugInfo.style.fontSize = '12px';
        debugInfo.style.whiteSpace = 'pre-wrap';
        debugInfo.style.maxHeight = '200px';
        debugInfo.style.overflowY = 'auto';
        debugInfo.style.display = 'none'; // Initially hidden
        container.appendChild(debugInfo);
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

export function initDebug(scene) {
    if (!debugInstance) {
        debugInstance = new Debug(scene);
    }
    return debugInstance;
}

export function getDebugger() {
    if (!debugInstance) {
        console.warn('Debug system not initialized. Call initDebug(scene) first.');
    }
    return debugInstance;
}