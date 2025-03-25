import * as THREE from 'three';
import roleManager from './RoleManager.js';

export class Debug {
    constructor(scene, isAdmin = false) {
        this.scene = scene;
        this.isAdmin = isAdmin;
        this.enabled = {
            projectiles: false,
            physics: false,
            network: false
        };
        
        // Only create debug controls for admins
        if (this.isAdmin) {
            this.createDebugControls();
        }
    }
    
    createDebugControls() {
        // Check if debug controls already exist
        if (document.getElementById('debug-controls')) {
            return;
        }
        
        const debugControls = document.createElement('div');
        debugControls.id = 'debug-controls';
        debugControls.style.color = 'white';
        debugControls.style.fontFamily = 'monospace';
        debugControls.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        debugControls.style.padding = '10px';
        debugControls.style.borderRadius = '5px';
        debugControls.style.zIndex = '100';
        
        // Create debug toggle for projectiles
        const projectilesToggle = document.createElement('div');
        projectilesToggle.innerHTML = '<input type="checkbox" id="debug-projectiles"> <label for="debug-projectiles">Show Projectile Debug</label>';
        projectilesToggle.querySelector('input').addEventListener('change', (e) => {
            this.enabled.projectiles = e.target.checked;
            window.debugSettings.projectiles = e.target.checked;
        });
        
        // Create debug toggle for physics
        const physicsToggle = document.createElement('div');
        physicsToggle.innerHTML = '<input type="checkbox" id="debug-physics"> <label for="debug-physics">Show Physics Debug</label>';
        physicsToggle.querySelector('input').addEventListener('change', (e) => {
            this.enabled.physics = e.target.checked;
            window.debugSettings.physics = e.target.checked;
        });
        
        // Create debug toggle for network
        const networkToggle = document.createElement('div');
        networkToggle.innerHTML = '<input type="checkbox" id="debug-network"> <label for="debug-network">Show Network Debug</label>';
        networkToggle.querySelector('input').addEventListener('change', (e) => {
            this.enabled.network = e.target.checked;
            window.debugSettings.network = e.target.checked;
        });
        
        // Admin notice
        const adminNotice = document.createElement('div');
        adminNotice.style.marginTop = '10px';
        adminNotice.style.color = '#ff9999';
        adminNotice.textContent = 'ADMIN MODE ACTIVE';
        
        // Add toggles to debug controls
        debugControls.appendChild(projectilesToggle);
        debugControls.appendChild(physicsToggle);
        debugControls.appendChild(networkToggle);
        debugControls.appendChild(adminNotice);
        
        // Add debug controls to document body
        document.body.appendChild(debugControls);
    }
    
    log(category, message, data = null) {
        if (!this.enabled[category] || !this.isAdmin) return;
        
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
    
    drawDebugLine(start, end, color = 0xff0000, duration = 1) {
        if (!this.isAdmin) return;
        
        const material = new THREE.LineBasicMaterial({ color });
        const points = [];
        points.push(new THREE.Vector3(start.x, start.y, start.z));
        points.push(new THREE.Vector3(end.x, end.y, end.z));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        
        // Remove line after duration
        setTimeout(() => {
            this.scene.remove(line);
            geometry.dispose();
            material.dispose();
        }, duration * 1000);
    }
    
    drawDebugBox(position, size = 1, color = 0xff0000, duration = 1) {
        if (!this.isAdmin) return;
        
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshBasicMaterial({ 
            color, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.7 
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        this.scene.add(mesh);
        
        // Remove box after duration
        setTimeout(() => {
            this.scene.remove(mesh);
            geometry.dispose();
            material.dispose();
        }, duration * 1000);
    }
}

// Create singleton instance
let debugInstance = null;

export function initDebug(scene, isAdmin = false) {
    // If admin status is not provided explicitly, check roleManager
    if (isAdmin === undefined) {
        isAdmin = roleManager.isAdmin();
    }
    
    if (!debugInstance) {
        debugInstance = new Debug(scene, isAdmin);
    } else {
        // Update admin status if debug was already initialized
        debugInstance.isAdmin = isAdmin;
        
        // Create debug controls if user is admin and they don't exist yet
        if (isAdmin && !document.getElementById('debug-controls')) {
            debugInstance.createDebugControls();
        }
    }
    return debugInstance;
}

export function getDebugger() {
    return debugInstance;
}