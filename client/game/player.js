import * as THREE from 'three';

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
        this.setupControls();
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
        
        this.scene.add(this.mesh);
    }
    
    setupControls() {
        // Setup keyboard event listeners
        document.addEventListener('keydown', this.onKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }
    
    update(deltaTime) {
        // Calculate movement based on key presses
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
    }
}