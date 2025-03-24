import * as THREE from 'three';
import { getDebugger } from '../utils/debug.js';

export class Projectile {
    constructor(scene, position, direction, color = 0xff00ff) {
        this.scene = scene;
        this.position = position.clone();
        this.direction = direction.clone().normalize();
        this.speed = 0.3;
        this.mesh = null;
        this.active = true;
        this.lifeTime = 5000; // Projectile exists for 5 seconds
        this.creationTime = Date.now();
        this.color = color;
        
        this.createProjectile();
    }
    
    createProjectile() {
        // Create a small cube as projectile
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        
        // Use bright, glowing material
        const material = new THREE.MeshStandardMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.7,
            metalness: 1.0,
            roughness: 0.0
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Add a small point light for glow effect
        const light = new THREE.PointLight(this.color, 1, 2);
        light.position.set(0, 0, 0);
        this.mesh.add(light);
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Move in direction
        const movement = this.direction.clone().multiplyScalar(this.speed);
        this.mesh.position.add(movement);
        
        // Rotate the projectile for visual effect
        this.mesh.rotation.x += 0.05;
        this.mesh.rotation.y += 0.05;
        this.mesh.rotation.z += 0.05;
        
        // Check if projectile should be removed based on lifetime
        if (Date.now() - this.creationTime > this.lifeTime) {
            this.remove();
        }
    }
    
    // Check if this projectile hit a player
    checkCollision(playerId, playerMesh) {
        if (!this.active || !playerMesh) return false;
        
        // Simple sphere-based collision detection
        const projectilePos = this.mesh.position;
        const playerPos = playerMesh.position;
        
        // Distance between centers
        const distance = projectilePos.distanceTo(playerPos);
        
        // If distance is less than sum of radii, collision occurred
        // Using 0.6 for projectile (slightly larger than its size for better gameplay)
        // and 0.8 for player (slightly larger than player's box size)
        if (distance < (0.6 + 0.8)) {
            this.remove();
            return true;
        }
        
        return false;
    }
    
    remove() {
        if (!this.active) return;
        
        this.active = false;
        this.scene.remove(this.mesh);
        
        // Dispose of resources
        if (this.mesh) {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (Array.isArray(this.mesh.material)) {
                    this.mesh.material.forEach(material => material.dispose());
                } else {
                    this.mesh.material.dispose();
                }
            }
        }
    }
}

export class ProjectileManager {
    constructor(scene, networkManager) {
        this.scene = scene;
        this.networkManager = networkManager;
        this.projectiles = [];
        this.debug = getDebugger();
    }
    
    // Create a new projectile from the player towards a target
    throwCubeAt(targetId, targetPosition) {
        if (!this.networkManager || !this.networkManager.localPlayer) {
            console.error("Cannot throw cube - networkManager or localPlayer not initialized");
            return;
        }
        
        const player = this.networkManager.localPlayer;
        
        // Get starting position (player position)
        const startPos = player.mesh.position.clone();
        startPos.y += 0.5; // Start slightly above player center
        
        // Calculate direction towards target
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, startPos)
            .normalize();
        
        this.debug?.log('projectiles', `Throwing cube at player ${targetId} from (${startPos.x.toFixed(2)}, ${startPos.y.toFixed(2)}, ${startPos.z.toFixed(2)})`);
        
        // Visualize projectile path if debugging enabled
        if (this.debug?.enabled.projectiles) {
            this.debug.visualizeRaycast(startPos, direction, 20, 2000);
        }
        
        // Create projectile
        const projectile = new Projectile(this.scene, startPos, direction);
        this.projectiles.push(projectile);
        
        // Send throw event to server
        if (this.networkManager.socket) {
            const throwData = {
                targetId: targetId,
                position: {
                    x: startPos.x,
                    y: startPos.y,
                    z: startPos.z
                },
                direction: {
                    x: direction.x,
                    y: direction.y,
                    z: direction.z
                }
            };
            
            this.debug?.log('network', `Sending throwCube event`, throwData);
            this.networkManager.socket.emit('throwCube', throwData);
        } else {
            console.error("Socket not connected, cannot send throw event");
        }
    }
    
    // Create a projectile from remote player throw data
    createRemoteProjectile(throwData) {
        this.debug?.log('projectiles', `Creating remote projectile from player ${throwData.sourceId}`);
        
        // Get starting position
        const startPos = new THREE.Vector3(
            throwData.position.x,
            throwData.position.y,
            throwData.position.z
        );
        
        // Get direction
        const direction = new THREE.Vector3(
            throwData.direction.x,
            throwData.direction.y,
            throwData.direction.z
        );
        
        // Determine color based on source player
        let color = 0xff00ff; // Default magenta
        if (this.networkManager.playerData[throwData.sourceId]) {
            color = this.networkManager.playerData[throwData.sourceId].color;
        }
        
        // Create projectile
        const projectile = new Projectile(this.scene, startPos, direction, color);
        this.projectiles.push(projectile);
        
        // Visualize projectile path if debugging enabled
        if (this.debug?.enabled.projectiles) {
            this.debug.visualizeRaycast(startPos, direction, 20, 2000);
        }
        
        return projectile;
    }
    
    // Update all projectiles and check for collisions
    update(deltaTime) {
        // Filter out inactive projectiles
        this.projectiles = this.projectiles.filter(projectile => projectile.active);
        
        // Update remaining projectiles
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime);
            
            // Check collisions with players
            if (this.networkManager.localPlayer) {
                // Check if hit local player
                if (projectile.checkCollision('local', this.networkManager.localPlayer.mesh)) {
                    // Visual effect for being hit
                    this.showHitEffect(this.networkManager.localPlayer.mesh);
                    this.debug?.log('physics', `Local player hit by projectile`);
                    
                    // Show collision visualization if debugging enabled
                    if (this.debug?.enabled.physics) {
                        this.debug.visualizeCollision(this.networkManager.localPlayer.mesh.position);
                    }
                }
            }
            
            // Check collisions with remote players
            Object.keys(this.networkManager.players || {}).forEach(playerId => {
                const playerMesh = this.networkManager.players[playerId];
                if (projectile.checkCollision(playerId, playerMesh)) {
                    // Visual effect for being hit
                    this.showHitEffect(playerMesh);
                    this.debug?.log('physics', `Remote player ${playerId} hit by projectile`);
                    
                    // Show collision visualization if debugging enabled
                    if (this.debug?.enabled.physics) {
                        this.debug.visualizeCollision(playerMesh.position);
                    }
                }
            });
        });
    }
    
    // Create a visual effect when a player is hit
    showHitEffect(playerMesh) {
        if (!playerMesh) return;
        
        // Create a short-lived explosion particle effect
        const explosion = new THREE.Group();
        const particleCount = 10;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 6, 6),
                new THREE.MeshBasicMaterial({ 
                    color: 0xffff00,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            // Random position around center
            particle.position.set(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            
            // Random velocity
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            
            explosion.add(particle);
        }
        
        // Position explosion at player
        explosion.position.copy(playerMesh.position);
        this.scene.add(explosion);
        
        // Animate explosion
        const explosionAnimation = () => {
            explosion.children.forEach(particle => {
                particle.position.add(particle.userData.velocity);
                particle.material.opacity -= 0.02;
                particle.scale.multiplyScalar(0.95);
            });
            
            if (explosion.children[0].material.opacity <= 0) {
                this.scene.remove(explosion);
                explosion.children.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
                return;
            }
            
            requestAnimationFrame(explosionAnimation);
        };
        
        explosionAnimation();
    }
}