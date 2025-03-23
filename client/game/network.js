import { io } from 'socket.io-client';
import * as THREE from 'three';
import { VoiceChat } from './voice.js';

export class NetworkManager {
    constructor(scene) {
        this.scene = scene;
        this.socket = null;
        this.players = {};
        this.playerData = {}; // Store player data including peerId
        this.localPlayer = null;
        this.voiceChat = null;
        
        // Initialize remote player materials
        this.playerMaterials = {};
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
    update() {
        // Send local player updates
        this.sendPlayerUpdate();
    }
}