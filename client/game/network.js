import { io } from 'socket.io-client';
import * as THREE from 'three';
import { VoiceChat } from './voice.js';
import { ProjectileManager } from './projectile.js';

export class NetworkManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera; // Store the camera reference
        this.socket = null;
        this.players = {};
        this.playerData = {}; // Store player data including peerId
        this.localPlayer = null;
        this.voiceChat = null;
        this.projectileManager = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Initialize remote player materials
        this.playerMaterials = {};
        
        // Setup click event listener for throwing cubes
        document.addEventListener('click', this.onMouseClick.bind(this));
    }
    
    /**
     * Connect to the multiplayer server
     * @param {Object} localPlayer - Reference to the local player object
     */
    connect(localPlayer) {
        this.localPlayer = localPlayer;
        
        // Connect to server on same host but different port
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const serverUrl = `${protocol}//paper-server.coody.me`;
        
        this.socket = io(serverUrl);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize voice chat
        this.initializeVoiceChat();
        
        // Initialize projectile manager
        this.projectileManager = new ProjectileManager(this.scene, this);
    }
    
    setupEventListeners() {
        // Initialize players already in the game
        this.socket.on('players', (players) => {
            this.playerData = players; // Store all player data
            Object.keys(players).forEach(id => {
                if (id !== this.socket.id) {
                    this.addRemotePlayer(id, players[id]);
                }
            });
        });
        
        // Handle new player joining
        this.socket.on('playerJoined', (player) => {
            this.playerData[player.id] = player; // Store player data
            this.addRemotePlayer(player.id, player);
        });
        
        // Handle player movement
        this.socket.on('playerMoved', (data) => {
            this.playerData[data.id].position = data.position; // Update stored position
            this.playerData[data.id].rotation = data.rotation; // Update stored rotation
            this.updateRemotePlayer(data.id, data.position, data.rotation);
        });
        
        // Handle player leaving
        this.socket.on('playerLeft', (id) => {
            delete this.playerData[id]; // Remove player data
            this.removeRemotePlayer(id);
        });
        
        // Handle player peer ID registration
        this.socket.on('playerPeerIdRegistered', (data) => {
            if (this.playerData[data.id]) {
                this.playerData[data.id].peerId = data.peerId;
                
                // If voice chat is initialized, connect to this player
                if (this.voiceChat && this.voiceChat.enabled) {
                    this.voiceChat.callPlayer(data.id, data.peerId);
                }
            }
        });
        
        // Handle remote cube throws
        this.socket.on('remoteCubeThrow', (throwData) => {
            if (this.projectileManager) {
                this.projectileManager.createRemoteProjectile(throwData);
            }
        });
    }
    
    /**
     * Initialize voice chat
     */
    async initializeVoiceChat() {
        // Create voice chat manager
        this.voiceChat = new VoiceChat(this);
        await this.voiceChat.initialize();
    }
    
    /**
     * Handle mouse clicks for throwing cubes at players
     * @param {MouseEvent} event - Mouse click event
     */
    onMouseClick(event) {
        console.log("Mouse click detected at", event.clientX, event.clientY);
        
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        if (window.debugSettings?.projectiles) {
            console.log("Normalized coordinates:", this.mouse.x, this.mouse.y);
        }
        
        // Use the stored camera reference instead of searching in the scene
        if (!this.camera) {
            console.error("Camera reference not found");
            return;
        }
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Debug visualization only if debug is enabled
        if (window.debugSettings?.projectiles) {
            // Visualize the ray for debugging
            const rayOrigin = this.camera.position.clone();
            const rayDirection = new THREE.Vector3();
            this.raycaster.ray.direction.normalize();
            rayDirection.copy(this.raycaster.ray.direction);

            console.log("Ray origin:", rayOrigin.x, rayOrigin.y, rayOrigin.z);
            console.log("Ray direction:", rayDirection.x, rayDirection.y, rayDirection.z);

            // Create a debug line to visualize the ray
            const rayLength = 50;
            const rayEndpoint = new THREE.Vector3().copy(rayOrigin).add(rayDirection.multiplyScalar(rayLength));
            console.log("Ray endpoint:", rayEndpoint.x, rayEndpoint.y, rayEndpoint.z);

            // Create a line to visualize the ray
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([rayOrigin, rayEndpoint]);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
            const rayLine = new THREE.Line(lineGeometry, lineMaterial);
            this.scene.add(rayLine);

            // Remove the line after a short delay
            setTimeout(() => {
                this.scene.remove(rayLine);
                lineGeometry.dispose();
                lineMaterial.dispose();
            }, 1000);
        }
        
        // Create an array of objects to check for intersection
        const remotePlayerMeshes = Object.keys(this.players).map(id => {
            const mesh = this.players[id];
            mesh.userData.playerId = id; // Store player ID for identification
            return mesh;
        });
        
        if (window.debugSettings?.projectiles) {
            console.log("Checking intersections with", remotePlayerMeshes.length, "players");
        }
        
        // Check for intersections
        const intersects = this.raycaster.intersectObjects(remotePlayerMeshes);
        
        if (window.debugSettings?.projectiles) {
            console.log("Intersection results:", intersects.length > 0 ? "Hit" : "Miss", 
                       intersects.length > 0 ? `(Player: ${intersects[0].object.userData.playerId})` : "");
        }
        
        if (intersects.length > 0) {
            // Found a player to throw a cube at!
            const targetId = intersects[0].object.userData.playerId;
            const targetPosition = intersects[0].object.position.clone();
            
            if (window.debugSettings?.projectiles) {
                console.log(`Throwing cube at player ${targetId} at position:`, 
                           targetPosition.x, targetPosition.y, targetPosition.z);
                           
                // Add a visual indicator at the intersection point only in debug mode
                this.createClickVisualizer(intersects[0].point);
            }
            
            // Throw cube at this player
            if (this.projectileManager) {
                this.projectileManager.throwCubeAt(targetId, targetPosition);
            } else {
                console.error("ProjectileManager not initialized");
            }
        }
    }
    
    /**
     * Send local player movement to server
     */
    sendPlayerUpdate() {
        if (!this.socket || !this.localPlayer) return;
        
        this.socket.emit('playerMove', {
            position: {
                x: this.localPlayer.mesh.position.x,
                y: this.localPlayer.mesh.position.y,
                z: this.localPlayer.mesh.position.z
            },
            rotation: {
                y: this.localPlayer.mesh.rotation.y
            }
        });
        
        // Update voice volumes based on proximity
        if (this.voiceChat) {
            this.voiceChat.updateVoiceVolumes();
        }
    }
    
    /**
     * Add a remote player to the scene
     * @param {string} id - Player ID
     * @param {Object} data - Player data
     */
    addRemotePlayer(id, data) {
        // Create remote player cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Use player's color or default to magenta
        const color = data.color || 0xff00ff;
        
        // Create materials for each face with player's color
        const materials = [
            new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 })
        ];
        
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.position.set(
            data.position.x,
            data.position.y,
            data.position.z
        );
        
        if (data.rotation) {
            mesh.rotation.y = data.rotation.y;
        }
        
        // Add a point light to the remote player for glow effect
        const playerLight = new THREE.PointLight(color, 1, 3);
        playerLight.position.set(0, 0, 0);
        mesh.add(playerLight);
        
        // Store player mesh
        this.players[id] = mesh;
        this.playerMaterials[id] = materials;
        
        // Add to scene
        this.scene.add(mesh);
    }
    
    /**
     * Update remote player position and rotation
     * @param {string} id - Player ID
     * @param {Object} position - New position
     * @param {Object} rotation - New rotation
     */
    updateRemotePlayer(id, position, rotation) {
        if (!this.players[id]) return;
        
        // Get player mesh
        const playerMesh = this.players[id];
        
        // Target position
        const targetPosition = new THREE.Vector3(
            position.x,
            position.y,
            position.z
        );
        
        // Smoothly interpolate position
        playerMesh.position.lerp(targetPosition, 0.2);
        
        // Update rotation
        if (rotation) {
            playerMesh.rotation.y = rotation.y;
        }
        
        // Add floating animation for consistent visual style
        playerMesh.position.y = position.y + Math.sin(Date.now() * 0.002) * 0.1;
    }
    
    /**
     * Remove a remote player from the scene
     * @param {string} id - Player ID
     */
    removeRemotePlayer(id) {
        if (!this.players[id]) return;
        
        // Get player mesh
        const playerMesh = this.players[id];
        
        // Remove from scene
        this.scene.remove(playerMesh);
        
        // Delete references
        delete this.players[id];
        delete this.playerMaterials[id];
    }
    
    /**
     * Update function called from game loop
     */
    update(deltaTime) {
        // Send local player updates
        this.sendPlayerUpdate();
        
        // Update projectiles
        if (this.projectileManager) {
            this.projectileManager.update(deltaTime);
        }
    }

    /**
     * Create a visual marker at the click position
     * @param {THREE.Vector3} position - Position of the click
     */
    createClickVisualizer(position) {
        // Create a small sphere to show where the click happened
        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        this.scene.add(marker);
        
        // Remove after a short delay
        setTimeout(() => {
            this.scene.remove(marker);
            geometry.dispose();
            material.dispose();
        }, 1000);
    }
}