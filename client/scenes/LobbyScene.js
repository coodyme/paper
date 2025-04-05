import { Scene } from '../managers/SceneManager.js';
import * as THREE from 'three';
import lobbyService from '../services/LobbyService.js';
import stateManager from '../managers/StateManager.js';

/**
 * Lobby scene showing players in lobby/game and providing game entry options
 */
export class LobbyScene extends Scene {
    constructor(sceneManager, params = {}) {
        super(sceneManager);
        
        this.username = params.username || 'Player';
        this.playerId = params.playerId || null;
        
        // Create scene 
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.clock = new THREE.Clock();
        
        // Lobby data
        this.lobbyStats = {
            playersInLobby: [],
            playersInGame: [],
            lobbyCount: 0,
            gameCount: 0
        };
        
        // UI elements
        this.lobbyContainer = null;
        this.playButton = null;
        this.disconnectButton = null;
        this.lobbyPlayersList = null;
        this.gamePlayersList = null;
        this.statsUpdateInterval = null;
    }
    
    async init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x111133, 1);
        this.sceneManager.container.appendChild(this.renderer.domElement);
        
        // Setup initial camera position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Create basic 3D background
        this.createBackground();
        
        // Create lobby UI
        this.createLobbyUI();
        
        // Join lobby with username
        if (this.username) {
            try {
                const joinResult = await lobbyService.joinLobby(this.username);
                this.playerId = joinResult.playerId;
                console.log(`Joined lobby with ID: ${this.playerId}`);
            } catch (error) {
                console.error("Failed to join lobby:", error);
            }
        }
        
        // Start stats refresh interval
        this.statsUpdateInterval = setInterval(() => this.updateLobbyStats(), 3000);
        
        // Initial lobby stats update
        this.updateLobbyStats();
        
        // Start animation loop
        this.animate();
    }
    
    createBackground() {
        // Create a starfield background
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
        });
        
        const starsVertices = [];
        for (let i = 0; i < 2000; i++) {
            const x = THREE.MathUtils.randFloatSpread(100);
            const y = THREE.MathUtils.randFloatSpread(100);
            const z = THREE.MathUtils.randFloatSpread(100) - 50; // Push stars back
            starsVertices.push(x, y, z);
        }
        
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
    }
    
    createLobbyUI() {
        // Create lobby container
        this.lobbyContainer = document.createElement('div');
        this.lobbyContainer.id = 'lobby-container';
        this.lobbyContainer.style.position = 'fixed';
        this.lobbyContainer.style.top = '50%';
        this.lobbyContainer.style.left = '50%';
        this.lobbyContainer.style.transform = 'translate(-50%, -50%)';
        this.lobbyContainer.style.width = '500px';
        this.lobbyContainer.style.backgroundColor = 'rgba(5, 10, 30, 0.85)';
        this.lobbyContainer.style.borderRadius = '10px';
        this.lobbyContainer.style.padding = '20px';
        this.lobbyContainer.style.color = 'white';
        this.lobbyContainer.style.fontFamily = 'Arial, sans-serif';
        this.lobbyContainer.style.boxShadow = '0 0 20px rgba(0, 195, 255, 0.5)';
        this.lobbyContainer.style.border = '1px solid rgba(0, 195, 255, 0.5)';
        
        // Welcome header
        const welcomeHeader = document.createElement('h2');
        welcomeHeader.textContent = `Welcome, ${this.username}!`;
        welcomeHeader.style.textAlign = 'center';
        welcomeHeader.style.color = '#00c3ff';
        welcomeHeader.style.marginBottom = '20px';
        
        // Create players lists containers
        const listsContainer = document.createElement('div');
        listsContainer.style.display = 'grid';
        listsContainer.style.gridTemplateColumns = '1fr 1fr';
        listsContainer.style.gap = '20px';
        listsContainer.style.marginBottom = '20px';
        
        // Lobby players section
        const lobbyPlayersSection = document.createElement('div');
        const lobbyHeader = document.createElement('h3');
        lobbyHeader.textContent = 'Players in Lobby';
        lobbyHeader.style.color = '#00c3ff';
        lobbyHeader.style.marginBottom = '10px';
        
        this.lobbyPlayersList = document.createElement('ul');
        this.lobbyPlayersList.style.listStyleType = 'none';
        this.lobbyPlayersList.style.padding = '0';
        this.lobbyPlayersList.style.margin = '0';
        this.lobbyPlayersList.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        this.lobbyPlayersList.style.borderRadius = '5px';
        this.lobbyPlayersList.style.padding = '10px';
        this.lobbyPlayersList.style.maxHeight = '150px';
        this.lobbyPlayersList.style.overflowY = 'auto';
        
        lobbyPlayersSection.appendChild(lobbyHeader);
        lobbyPlayersSection.appendChild(this.lobbyPlayersList);
        
        // Game players section
        const gamePlayersSection = document.createElement('div');
        const gameHeader = document.createElement('h3');
        gameHeader.textContent = 'Players in Game';
        gameHeader.style.color = '#ff3366';
        gameHeader.style.marginBottom = '10px';
        
        this.gamePlayersList = document.createElement('ul');
        this.gamePlayersList.style.listStyleType = 'none';
        this.gamePlayersList.style.padding = '0';
        this.gamePlayersList.style.margin = '0';
        this.gamePlayersList.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        this.gamePlayersList.style.borderRadius = '5px';
        this.gamePlayersList.style.padding = '10px';
        this.gamePlayersList.style.maxHeight = '150px';
        this.gamePlayersList.style.overflowY = 'auto';
        
        gamePlayersSection.appendChild(gameHeader);
        gamePlayersSection.appendChild(this.gamePlayersList);
        
        listsContainer.appendChild(lobbyPlayersSection);
        listsContainer.appendChild(gamePlayersSection);
        
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.justifyContent = 'space-between';
        buttonsContainer.style.marginTop = '20px';
        
        // Create play button
        this.playButton = document.createElement('button');
        this.playButton.textContent = 'PLAY';
        this.playButton.style.padding = '10px 30px';
        this.playButton.style.backgroundColor = '#00c3ff';
        this.playButton.style.color = '#000';
        this.playButton.style.border = 'none';
        this.playButton.style.borderRadius = '5px';
        this.playButton.style.cursor = 'pointer';
        this.playButton.style.fontWeight = 'bold';
        this.playButton.style.transition = 'all 0.2s';
        this.playButton.style.flex = '1';
        this.playButton.style.marginRight = '10px';
        this.playButton.style.fontSize = '16px';
        
        this.playButton.addEventListener('mouseover', () => {
            this.playButton.style.backgroundColor = '#33d6ff';
            this.playButton.style.boxShadow = '0 0 10px #00c3ff';
        });
        
        this.playButton.addEventListener('mouseout', () => {
            this.playButton.style.backgroundColor = '#00c3ff';
            this.playButton.style.boxShadow = 'none';
        });
        
        this.playButton.addEventListener('click', () => this.handlePlay());
        
        // Create disconnect button
        this.disconnectButton = document.createElement('button');
        this.disconnectButton.textContent = 'DISCONNECT';
        this.disconnectButton.style.padding = '10px 20px';
        this.disconnectButton.style.backgroundColor = '#ff3366';
        this.disconnectButton.style.color = 'white';
        this.disconnectButton.style.border = 'none';
        this.disconnectButton.style.borderRadius = '5px';
        this.disconnectButton.style.cursor = 'pointer';
        this.disconnectButton.style.fontWeight = 'bold';
        this.disconnectButton.style.transition = 'all 0.2s';
        this.disconnectButton.style.flex = '1';
        this.disconnectButton.style.marginLeft = '10px';
        this.disconnectButton.style.fontSize = '16px';
        
        this.disconnectButton.addEventListener('mouseover', () => {
            this.disconnectButton.style.backgroundColor = '#ff5c88';
            this.disconnectButton.style.boxShadow = '0 0 10px #ff3366';
        });
        
        this.disconnectButton.addEventListener('mouseout', () => {
            this.disconnectButton.style.backgroundColor = '#ff3366';
            this.disconnectButton.style.boxShadow = 'none';
        });
        
        this.disconnectButton.addEventListener('click', () => this.handleDisconnect());
        
        // Add buttons to container
        buttonsContainer.appendChild(this.playButton);
        buttonsContainer.appendChild(this.disconnectButton);
        
        // Add all elements to the lobby container
        this.lobbyContainer.appendChild(welcomeHeader);
        this.lobbyContainer.appendChild(listsContainer);
        this.lobbyContainer.appendChild(buttonsContainer);
        
        // Add lobby container to the document
        document.body.appendChild(this.lobbyContainer);
    }
    
    async updateLobbyStats() {
        try {
            const stats = await lobbyService.getLobbyStats();
            this.lobbyStats = stats;
            
            // Update UI
            this.updatePlayersList(this.lobbyPlayersList, stats.playersInLobby);
            this.updatePlayersList(this.gamePlayersList, stats.playersInGame);
            
        } catch (error) {
            console.error("Failed to update lobby stats:", error);
        }
    }
    
    updatePlayersList(listElement, players) {
        // Clear existing list
        while (listElement.firstChild) {
            listElement.removeChild(listElement.firstChild);
        }
        
        if (players.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = 'No players';
            emptyItem.style.padding = '5px';
            emptyItem.style.color = '#888';
            emptyItem.style.fontStyle = 'italic';
            listElement.appendChild(emptyItem);
        } else {
            // Add player items
            players.forEach(player => {
                const playerItem = document.createElement('li');
                playerItem.textContent = player.username;
                playerItem.style.padding = '5px';
                playerItem.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
                
                // Highlight current player
                if (player.id === this.playerId) {
                    playerItem.style.color = '#00c3ff';
                    playerItem.style.fontWeight = 'bold';
                }
                
                listElement.appendChild(playerItem);
            });
        }
    }
    
    async handlePlay() {
        // Notify server that player is ready to enter game
        try {
            if (this.playerId) {
                await lobbyService.readyToPlay(this.playerId);
            }
            
            // Change state to game
            stateManager.changeState(stateManager.states.GAME, {
                username: this.username,
                playerId: this.playerId
            });
            
            // Change scene
            this.sceneManager.changeScene('game', {
                username: this.username,
                playerId: this.playerId
            });
        } catch (error) {
            console.error("Error starting game:", error);
            // Show error message
            alert("Failed to start game. Please try again.");
        }
    }
    
    async handleDisconnect() {
        // Leave lobby if we have a player ID
        try {
            if (this.playerId) {
                await lobbyService.leaveLobby(this.playerId);
            }
            
            // Change state back to login
            stateManager.changeState(stateManager.states.LOGIN);
            
            // Return to login scene
            this.sceneManager.changeScene('login');
        } catch (error) {
            console.error("Error disconnecting:", error);
            
            // Even if there's an error, still go back to login
            stateManager.changeState(stateManager.states.LOGIN);
            this.sceneManager.changeScene('login');
        }
    }
    
    animate() {
        if (this.sceneManager.currentScene !== this) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Simple animation for background stars
        if (this.scene.children.length > 0) {
            const stars = this.scene.children[0];
            if (stars instanceof THREE.Points) {
                stars.rotation.y += 0.0001;
                stars.rotation.x += 0.0001;
            }
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    cleanup() {
        // Clear update interval
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
        }
        
        // Remove lobby UI
        if (this.lobbyContainer && this.lobbyContainer.parentNode) {
            this.lobbyContainer.parentNode.removeChild(this.lobbyContainer);
        }
        
        // Remove renderer element
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        
        // Dispose of THREE.js resources
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                } else {
                    if (object.material.map) object.material.map.dispose();
                    object.material.dispose();
                }
            }
        });
    }
}