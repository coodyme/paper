import { io } from 'socket.io-client';
import * as THREE from 'three';
import { VoiceChat } from './voice.js';
import { ProjectileManager } from './projectile.js';
import { ChatSystem } from './chat.js'; // Import the chat system
import { getDebugger } from '../utils/debug.js';
import roleManager from '../managers/RoleManager.js';

export class NetworkManager {
    constructor(scene, camera, username = null, role = null) {
        this.scene = scene;
        this.camera = camera;
        this.username = username;
        this.role = role || roleManager.getRole();
        this.socket = null;
        this.players = {};
        this.playerData = {}; // Store player data including username, role and peerId
        this.localPlayer = null;
        this.voiceChat = null;
        this.projectileManager = null;
        this.chatSystem = null; // Add chat system reference
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.debug = getDebugger();
        this.isMobile = this.detectMobile();
        
        // Initialize remote player materials
        this.playerMaterials = {};
        
        // Setup click event listener for throwing cubes
        document.addEventListener('click', this.onMouseClick.bind(this));
        
        // Add right-click event prevention (to allow right-click for jukebox)
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        // Add touch event for mobile devices
        if (this.isMobile) {
            document.addEventListener('touchend', this.onTouchEnd.bind(this), false);
        }
    }
    
    /**
     * Connect to the multiplayer server
     * @param {Object} localPlayer - Reference to the local player object
     */
    connect(localPlayer) {
        this.localPlayer = localPlayer;
        
        // Set local player's username and role
        if (this.username) {
            this.localPlayer.username = this.username;
            this.localPlayer.role = this.role;
            this.updateLocalPlayerLabel();
        }
        
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
        
        // Initialize chat system
        this.chatSystem = new ChatSystem(this);
        
        // Send both username and role to the server
        if (this.username) {
            this.socket.emit('setUserInfo', { 
                username: this.username,
                role: this.role
            });
        }
    }
    
    // Update the local player's label with username
    updateLocalPlayerLabel() {
        if (this.localPlayer && this.localPlayer.label) {
            this.localPlayer.updatePlayerLabel(this.username, this.role);
        }
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
            
            // Show chat instructions when player first connects
            if (this.chatSystem) {
                this.chatSystem.showInstructions();
            }
        });
        
        // Handle new player joining
        this.socket.on('playerJoined', (player) => {
            this.debug?.logNetworkEvent('playerJoined', player);
            this.playerData[player.id] = player; // Store player data
            this.addRemotePlayer(player.id, player);
        });
        
        // Handle player movement
        this.socket.on('playerMoved', (data) => {
            // Check if player data exists before updating
            if (!this.playerData[data.id]) {
                // Initialize player data if it doesn't exist yet
                this.playerData[data.id] = {
                    id: data.id,
                    position: data.position,
                    rotation: data.rotation,
                    color: 0xff00ff // Default color
                };
            } else {
                // Update stored position and rotation
                this.playerData[data.id].position = data.position;
                this.playerData[data.id].rotation = data.rotation;
            }
            
            // Update remote player visual representation
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

        // Handle chat message
        this.socket.on('chatMessage', (data) => {
            this.debug?.logNetworkEvent('chatMessage', data);
            if (this.chatSystem) {
                this.chatSystem.receiveMessage(data.senderId, data.message, data.isBot);
            }
        });

        // Handle player updates (including username)
        this.socket.on('playerUpdated', (data) => {
            this.debug?.logNetworkEvent('playerUpdated', data);
            
            // Update player data
            if (this.playerData[data.id]) {
                if (data.username) {
                    this.playerData[data.id].username = data.username;
                }
                
                // Update player label if the username changed
                if (data.username && this.players[data.id]) {
                    this.updatePlayerLabel(this.players[data.id], data.id, data.username);
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
     * Handle mouse clicks for throwing cubes at players
     * @param {MouseEvent} event - Mouse click event
     */
    onMouseClick(event) {
        this.debug?.log('projectiles', `Mouse click at (${event.clientX}, ${event.clientY})`);
        
        // Store right click state
        this.rightClickPressed = event.button === 2;
        
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.processClick();
    }

    /**
     * Add a shared method to process clicks and touches
     */
    processClick() {
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
        
        // Check for jukebox interaction first
        if (this.world && this.world.jukebox && this.world.jukebox.mesh) {
            const jukeboxIntersects = this.raycaster.intersectObject(this.world.jukebox.mesh);
            
            if (jukeboxIntersects.length > 0) {
                // Detected a click on the jukebox
                const rightClick = this.rightClickPressed || false;
                this.world.jukebox.handleClick(rightClick);
                return; // Stop processing after jukebox interaction
            }
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
     * Add touch handler method
     */
    onTouchEnd(event) {
        // Only handle taps (short touches), not control touches
        if (event.changedTouches.length === 0) return;
        
        // Get the first changed touch (end of touch)
        const touch = event.changedTouches[0];
        
        // Avoid handling control area touches (left and right sides of screen)
        const touchX = touch.clientX;
        const screenWidth = window.innerWidth;
        
        // Only throw cube if touch is in the middle 60% of the screen
        if (touchX > screenWidth * 0.2 && touchX < screenWidth * 0.8) {
            // Convert touch to normalized device coordinates
            this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            
            // Process the touch as a click to throw cube
            this.processClick();
        }
    }

    /**
     * Add mobile detection method
     */
    detectMobile() {
        return (
            navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i)
        );
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
        
        // Special handling for AI bots (use different mesh)
        let mesh;
        
        if (data.isBot) {
            // Create a distinctive bot avatar - a pyramid for AI
            const botGeometry = new THREE.ConeGeometry(0.7, 1.4, 4);
            
            // Create materials with AI-themed colors
            const botMaterial = new THREE.MeshStandardMaterial({ 
                color: color, 
                emissive: color, 
                emissiveIntensity: 0.5,
                metalness: 1.0, 
                roughness: 0.2 
            });
            
            mesh = new THREE.Mesh(botGeometry, botMaterial);
            
            // Add particle effect for the AI
            this.addBotParticleEffect(mesh, color);
        } else {
            // Regular player cube for normal players
            // Create materials for each face with player's color
            const materials = [
                new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 }),
                new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 }),
                new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 }),
                new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 }),
                new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 }),
                new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.2 })
            ];
            
            mesh = new THREE.Mesh(geometry, materials);
            this.playerMaterials[id] = materials;
        }
        
        // Set position
        mesh.position.set(
            data.position.x,
            data.position.y,
            data.position.z
        );
        
        if (data.rotation) {
            mesh.rotation.y = data.rotation.y;
        }
        
        // Add a point light for glow effect
        const playerLight = new THREE.PointLight(color, data.isBot ? 2 : 1, data.isBot ? 5 : 3);
        playerLight.position.set(0, 0, 0);
        mesh.add(playerLight);
        
        // Store the username in playerData if available
        if (data.username) {
            if (!this.playerData[id]) {
                this.playerData[id] = {};
            }
            this.playerData[id].username = data.username;
        }
        
        // Add player ID label above the player (will show username if available)
        this.addPlayerLabel(mesh, id, data.isBot ? data.name : data.username);
        
        // Store player mesh
        this.players[id] = mesh;
        
        // Add to scene
        this.scene.add(mesh);
    }

    // Add a new method for bot particle effects
    addBotParticleEffect(botMesh, color) {
        const particleGroup = new THREE.Group();
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            // Position particles in a circle around the bot
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 0.8;
            particle.position.set(
                Math.cos(angle) * radius,
                0.5,
                Math.sin(angle) * radius
            );
            
            // Store the original angle for animation
            particle.userData.angle = angle;
            particle.userData.radius = radius;
            particle.userData.speed = 0.001 + Math.random() * 0.002;
            particle.userData.yOffset = Math.random() * 0.5;
            
            particleGroup.add(particle);
        }
        
        botMesh.add(particleGroup);
        botMesh.userData.particleGroup = particleGroup;
    }
    
    /**
     * Create and add a text label above the player
     * @param {THREE.Mesh} playerMesh - The player's mesh
     * @param {string} id - Player ID to display
     * @param {string} customName - Custom name to display (optional)
     */
    addPlayerLabel(playerMesh, id, customName = null) {
        // Create a canvas for the text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Fill with transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Determine if this player is an admin
        const isAdmin = this.isUserAdmin(id);
        
        // Add border (different color for admins)
        context.strokeStyle = isAdmin ? '#ff0000' : '#ffffff';
        context.lineWidth = isAdmin ? 3 : 2;
        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Determine display text (prioritize username)
        let displayText = customName;
        
        // If no custom name provided, check for username in playerData
        if (!displayText && this.playerData[id] && this.playerData[id].username) {
            displayText = this.playerData[id].username;
        }
        
        // Fallback to ID if no username is available
        if (!displayText) {
            displayText = id.substring(0, 6);
        }
        
        // Add [ADMIN] prefix for admin users
        if (isAdmin) {
            displayText = `[ADMIN] ${displayText}`;
        }
        
        context.font = 'bold 30px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = isAdmin ? '#ff9999' : '#ffffff';
        context.fillText(displayText, canvas.width / 2, canvas.height / 2);
        
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
        
        // Position above player (with slight offset)
        label.position.set(0, 1.2, 0);
        
        // Ensure label is always facing the camera
        label.userData.isBillboard = true;
        
        // Add the label to the player mesh
        playerMesh.add(label);
        
        // Store label reference
        playerMesh.userData.label = label;
    }
    
    // Update a player's label with their username
    updatePlayerLabel(playerMesh, id, username) {
        if (playerMesh && playerMesh.userData.label) {
            // Remove the old label
            const oldLabel = playerMesh.userData.label;
            playerMesh.remove(oldLabel);
            
            // Create a new label with the username
            this.addPlayerLabel(playerMesh, id, username);
        }
    }
    
    /**
     * Update remote player position and rotation
     * @param {string} id - Player ID
     * @param {Object} position - New position
     * @param {Object} rotation - New rotation
     */
    updateRemotePlayer(id, position, rotation) {
        // Check if player exists, if not create it
        if (!this.players[id] && this.playerData[id]) {
            this.addRemotePlayer(id, this.playerData[id]);
        }
        
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
        
        // Update label billboard effect
        if (playerMesh.userData.label && this.camera) {
            // Make sure the label always faces the camera
            playerMesh.userData.label.lookAt(this.camera.position);
        }
        
        // Update particle effects for bots
        if (playerMesh.userData.particleGroup) {
            const particleGroup = playerMesh.userData.particleGroup;
            particleGroup.children.forEach(particle => {
                // Update particle position in a circular orbit
                particle.userData.angle += particle.userData.speed;
                particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
                particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;
                particle.position.y = 0.5 + Math.sin(Date.now() * 0.001 + particle.userData.yOffset) * 0.2;
            });
        }
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
        
        // Update billboard labels to face camera
        Object.values(this.players).forEach(playerMesh => {
            if (playerMesh.userData.label && this.camera) {
                playerMesh.userData.label.lookAt(this.camera.position);
            }
        });
        
        // Update projectiles
        if (this.projectileManager) {
            this.projectileManager.update(deltaTime);
        }
        
        // Update chat system
        if (this.chatSystem) {
            this.chatSystem.update();
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

    // Add cleanup method
    cleanup() {
        // Remove event listeners
        document.removeEventListener('click', this.onMouseClick.bind(this));
        document.removeEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        if (this.isMobile) {
            document.removeEventListener('touchend', this.onTouchEnd.bind(this));
        }
        
        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
        }
        
        // Clean up voice chat
        if (this.voiceChat) {
            this.voiceChat.cleanup();
        }
        
        // Clean up chat system
        if (this.chatSystem) {
            this.chatSystem.cleanup();
        }
        
        // Check if projectileManager exists before calling cleanup
        if (this.projectileManager) {
            if (typeof this.projectileManager.cleanup === 'function') {
                this.projectileManager.cleanup();
            } else {
                console.warn('ProjectileManager does not have a cleanup method');
                // Fallback cleanup if needed
                this.projectileManager = null;
            }
        }
    }

    // Add admin-specific methods
    isUserAdmin(userId) {
        // Check if a user is an admin (local user or remote)
        if (userId === this.socket?.id) {
            return this.role === 'admin';
        }
        return this.playerData[userId]?.role === 'admin';
    }

    /**
     * Initialize ChatSystem with the new UI components
     */
    initChatSystem() {
        // The chat system is now handled by UI components
        // We'll expose methods for the ChatInput component to call
    }
    
    /**
     * Send a chat message from the local player
     * @param {string} message - The message to send
     */
    sendChatMessage(message) {
        if (!message || !message.trim()) return;
        
        // Display message above local player
        this.displayLocalMessage(message);
        
        // Send message to all peers
        this.broadcastChatMessage(message);
    }
    
    /**
     * Display a message above the local player
     * @param {string} message - The message to display
     */
    displayLocalMessage(message) {
        // Find the local player mesh
        const localPlayer = this.getLocalPlayer();
        if (!localPlayer) return;
        
        // Create message display above player
        this.createMessageLabel(localPlayer, 'local-player', message);
    }
    
    /**
     * Broadcast chat message to all connected players
     * @param {string} message - The message to broadcast
     */
    broadcastChatMessage(message) {
        if (this.socket) {
            this.socket.emit('chatMessage', { message });
        }
    }
}