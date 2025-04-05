import * as THREE from 'three';
import { InputManager } from '../managers/InputManager.js';
import configLoader from '../utils/configLoader.js';
import roleManager from '../managers/RoleManager.js';
import gameFeatureManager from '../managers/GameFeatureManager.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.label = null;
        this.username = 'Player'; // Default username
        this.role = roleManager.getRole(); // Default role
        this.inputManager = null;
        this.speed = configLoader.get('player.moveSpeed', 0.1);
        this.rotationSpeed = configLoader.get('player.rotationSpeed', 0.06);
        this.velocity = 0;
        
        // Movement flags
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        this.createPlayer();
        // Create input manager for keyboard controls only
        // Touch controls are now handled by TouchControls component
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
        
        // Add a username label above the player
        this.addPlayerLabel();
        
        this.scene.add(this.mesh);
    }
    
    /**
     * Add a label showing username above the local player
     */
    addPlayerLabel() {
        // Create a canvas for the label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 256;
        canvas.height = 64;
        
        // Fill with transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set text properties
        context.font = 'bold 24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Draw the username text
        context.fillText(this.username, canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create sprite material
        const material = new THREE.SpriteMaterial({ map: texture });
        
        // Create sprite
        this.label = new THREE.Sprite(material);
        this.label.scale.set(2, 0.5, 1);
        this.label.position.set(0, 1.5, 0); // Position above the player cube
        
        this.mesh.add(this.label);
    }
    
    /**
     * Update the player label with a new username and role
     * @param {string} username - The username to display
     * @param {string} role - The player's role (admin or player)
     */
    updatePlayerLabel(username, role = 'player') {
        if (!this.label) return;
        
        this.username = username;
        this.role = role;
        
        // Get the canvas context from the label's texture
        const texture = this.label.material.map;
        const canvas = texture.image;
        const context = canvas.getContext('2d');
        
        // Clear the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Fill with transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set text properties based on role
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Admin role gets a special color
        if (role === 'admin') {
            context.fillStyle = '#ff3366'; // Pink for admin
            
            // Add a border
            context.strokeStyle = '#ffffff';
            context.lineWidth = 2;
            context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        } else {
            context.fillStyle = 'white'; // White for regular players
        }
        
        // Draw the username text
        context.fillText(username, canvas.width / 2, canvas.height / 2);
        
        // Update texture
        texture.needsUpdate = true;
    }
    
    update(deltaTime) {
        // Skip processing if movement feature is disabled
        if (!gameFeatureManager.isEnabled('movement')) {
            return;
        }
        
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
        // Clean up input manager
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