import * as THREE from 'three';
import { InputManager } from '../utils/inputManager.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.speed = 0.15;
        this.rotationSpeed = 0.05;
        this.velocity = 0;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        this.createPlayer();
        
        // Initialize input manager instead of direct keyboard handling
        this.inputManager = new InputManager(this);
    }
    
    createPlayer() {
        // Create a glowing cyberpunk cube for the player
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Create materials for each face with different neon colors
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0x550055, metalness: 0.9, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x005555, metalness: 0.9, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x555500, metalness: 0.9, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0x550055, metalness: 0.9, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x005555, metalness: 0.9, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x555500, metalness: 0.9, roughness: 0.2 })
        ];
        
        this.mesh = new THREE.Mesh(geometry, materials);
        this.mesh.position.set(0, 0.5, 0); // Position the cube on the grid
        
        // Add a point light to the player to create a glow effect
        const playerLight = new THREE.PointLight(0x00ffff, 1, 3);
        playerLight.position.set(0, 0, 0);
        this.mesh.add(playerLight);
        
        // Add a "YOU" label above the player
        this.addPlayerLabel();
        
        this.scene.add(this.mesh);
    }
    
    /**
     * Add a "YOU" label above the local player
     */
    addPlayerLabel() {
        // Create a canvas for the text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Fill with transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add glowing border
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#ff00ff');
        gradient.addColorStop(1, '#00ffff');
        
        context.strokeStyle = gradient;
        context.lineWidth = 3;
        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Add text
        context.font = 'bold 30px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#ffffff';
        context.fillText('YOU', canvas.width / 2, canvas.height / 2);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create label mesh
        const labelGeometry = new THREE.PlaneGeometry(1.2, 0.3);
        const label = new THREE.Mesh(labelGeometry, material);
        
        // Position above player
        label.position.set(0, 1.2, 0);
        
        // Store reference for billboard effect
        this.label = label;
        
        // Add the label to the player mesh
        this.mesh.add(label);
    }
    
    update(deltaTime) {
        // Update input manager
        if (this.inputManager) {
            this.inputManager.update();
        }
        
        // Calculate movement based on input flags
        let speed = 0;
        
        if (this.moveForward) speed = this.speed;
        else if (this.moveBackward) speed = -this.speed;
        
        // Apply acceleration/deceleration for smooth movement
        this.velocity += (speed - this.velocity) * 0.3;
        
        // Move player forward/backward
        this.mesh.translateZ(this.velocity);
        
        // Rotate player left/right
        if (this.moveLeft) this.mesh.rotateY(this.rotationSpeed);
        else if (this.moveRight) this.mesh.rotateY(-this.rotationSpeed);
        
        // Animate player (floating effect)
        this.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
        
        // Update label to always face the camera
        if (this.label) {
            // Find the camera in the scene
            const camera = this.scene.getObjectByProperty('type', 'PerspectiveCamera');
            if (camera) {
                this.label.lookAt(camera.position);
            }
        }
    }
    
    // Clean up resources when player is destroyed
    cleanup() {
        if (this.inputManager) {
            this.inputManager.cleanup();
        }
        
        if (this.mesh) {
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
            
            // Dispose of geometries and materials
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(material => {
                    if (material.map) material.map.dispose();
                    material.dispose();
                });
            } else if (this.mesh.material) {
                if (this.mesh.material.map) this.mesh.material.map.dispose();
                this.mesh.material.dispose();
            }
        }
    }
}