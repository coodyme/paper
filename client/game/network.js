import { io } from 'socket.io-client';
import * as THREE from 'three';
import { VoiceChat } from './voice.js';
import { ProjectileManager } from './projectile.js';
import { getDebugger } from '../utils/debug.js';

export class NetworkManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.socket = null;
        this.players = {};
        this.playerData = {}; // Store player data including peerId
        this.localPlayer = null;
        this.voiceChat = null;
        this.projectileManager = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.debug = getDebugger();
        
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
            this.debug?.logNetworkEvent('players', players);
            this.playerData = players; // Store all player data
            Object.keys(players).forEach(id => {
                if (id !== this.socket.id) {
                    this.addRemotePlayer(id, players[id]);
                }
            });
        });
        
        // Handle new player joining
        this.socket.on('playerJoined', (player) => {
            this.debug?.logNetworkEvent('playerJoined', player);
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
            this.debug?.logNetworkEvent('playerLeft', id);
            delete this.playerData[id]; // Remove player data
            this.removeRemotePlayer(id);
        });
        
        // Handle player peer ID registration
        this.socket.on('playerPeerIdRegistered', (data) => {
            this.debug?.logNetworkEvent('playerPeerIdRegistered', data);
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
            this.debug?.logNetworkEvent('remoteCubeThrow', throwData);
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
        this.debug?.log('projectiles', `Mouse click at (${event.clientX}, ${event.clientY})`);
        
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Use the stored camera reference
        if (!this.camera) {
            console.error("Camera reference not found");
            return;
        }
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Debug visualization if enabled
        if (this.debug?.enabled.projectiles) {
            const rayOrigin = this.camera.position.clone();
            const rayDirection = this.raycaster.ray.direction.clone().normalize();
            
            // Visualize the ray for debugging
            this.debug.visualizeRaycast(rayOrigin, rayDirection);
        }
        
        // Create an array of objects to check for intersection
        const remotePlayerMeshes = Object.keys(this.players).map(id => {
            const mesh = this.players[id];
            mesh.userData.playerId = id; // Store player ID for identification
            return mesh;
        });
        
        // Check for intersections
        const intersects = this.raycaster.intersectObjects(remotePlayerMeshes);
        
        this.debug?.log('projectiles', `Checking intersections with ${remotePlayerMeshes.length} players, found ${intersects.length} hits`);
        
        if (intersects.length > 0) {
            // Found a player to throw a cube at!
            const targetId = intersects[0].object.userData.playerId;
            const targetPosition = intersects[0].object.position.clone();
            const hitPoint = intersects[0].point;
            
            // Visualize intersection point if debugging is enabled
            if (this.debug?.enabled.projectiles) {
                this.debug.visualizePoint(hitPoint, 0xff0000, 0.2);
                this.debug.log('projectiles', `Hit player ${targetId} at position (${targetPosition.x.toFixed(2)}, ${targetPosition.y.toFixed(2)}, ${targetPosition.z.toFixed(2)})`);
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