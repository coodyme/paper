import * as THREE from 'three';
import { Scene } from '../managers/SceneManager.js';
import roleManager from '../managers/RoleManager.js';
import { World } from '../game/world.js';
import { Player } from '../game/player.js';
import { NetworkManager } from '../game/network.js';
import { ThirdPersonCamera } from '../game/camera.js';
import { initDebug } from '../utils/debug.js';
import configLoader from '../utils/configLoader.js';
import uiManager from '../managers/UIManager.js';
import { BillboardManager } from '../game/billboard.js';
import stateManager from '../managers/StateManager.js';
import gameFeatureManager from '../managers/GameFeatureManager.js';
import lobbyService from '../services/LobbyService.js';

export class GameScene extends Scene {
    constructor(sceneManager, params = {}) {
        super(sceneManager);
        this.username = params.username || 'Player';
        this.playerId = params.playerId || null;
        this.role = params.role || 'player';
        
        // Update role manager with current role
        if (params.role) {
            roleManager.currentRole = params.role;
        }
        
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
        this.world = null;
        this.player = null;
        this.thirdPersonCamera = null;
        this.networkManager = null;
        this.updateInterval = null;
        this.debugSystem = null;

        // Add back button to allow returning to lobby
        this.backButton = null;
        
        // Ensure networkManager gets cleaned up properly
        this.isCleanedUp = false;
    }
    
    async init() {
        // Set state to GAME
        stateManager.changeState(stateManager.states.GAME, {
            username: this.username,
            playerId: this.playerId
        });
        
        // Load configuration before initializing the game
        await configLoader.loadConfig();
        
        // Now create billboard manager after config is loaded
        this.billboardManager = new BillboardManager(this.scene);
        this.billboardManager.createBillboards();
        
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        this.sceneManager.container.appendChild(this.renderer.domElement);
        
        // Setup initial camera position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Add camera to scene - Needed for billboard labels
        this.scene.add(this.camera);
        
        // Initialize camera controller
        this.thirdPersonCamera = new ThirdPersonCamera(this.camera);
        
        // Initialize world - pass null for networkManager initially
        this.world = new World(this.scene, null);
        
        // Initialize player with config-based speeds
        this.player = new Player(this.scene);
        
        // Set player as camera target
        this.thirdPersonCamera.setTarget(this.player.mesh);
        
        // Initialize debug system with role awareness first
        const isAdmin = roleManager.isAdmin();
        this.debugSystem = initDebug(this.scene, isAdmin);
        
        // Then initialize UI Manager with the debug instance
        uiManager.init(this.debugSystem);
        
        // Initialize network manager with username and role
        this.networkManager = new NetworkManager(
            this.scene, 
            this.camera, 
            this.username,
            this.role
        );
        
        // Give network manager reference to world for jukebox interactions
        this.networkManager.world = this.world;
        
        // Now update world with network manager reference
        this.world.networkManager = this.networkManager;
        
        // Connect to network
        this.networkManager.connect(this.player);
        
        // Initialize jukebox now that we have network
        this.world.initJukebox();
        
        // Set network update rate from configuration
        const updateRate = configLoader.get('network.updateRate', 100);
        this.updateInterval = setInterval(() => {
            if (this.networkManager && gameFeatureManager.isEnabled('movement')) {
                this.networkManager.update(this.clock.getDelta());
            }
        }, updateRate);
        
        // Add back button to return to lobby
        this.addBackButton();
        
        // Start animation loop
        this.animate();
    }
    
    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        if (this.sceneManager.currentScene !== this) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Get delta time
        const deltaTime = this.clock.getDelta();
        
        // Only update player if movement is enabled
        if (this.player && gameFeatureManager.isEnabled('movement')) {
            this.player.update(deltaTime);
        }
        
        // Update camera to follow player
        if (this.thirdPersonCamera) {
            this.thirdPersonCamera.update();
        }
        
        // Update world and billboards
        if (this.world) {
            this.world.update(deltaTime);
        }
        
        // Update projectiles and other networked entities
        if (this.networkManager && gameFeatureManager.isEnabled('projectiles')) {
            this.networkManager.update(deltaTime);
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    // Add back button to return to lobby
    addBackButton() {
        this.backButton = document.createElement('button');
        this.backButton.textContent = 'BACK TO LOBBY';
        this.backButton.style.position = 'fixed';
        this.backButton.style.top = '20px';
        this.backButton.style.left = '20px';
        this.backButton.style.padding = '8px 16px';
        this.backButton.style.backgroundColor = '#00c3ff';
        this.backButton.style.color = '#000';
        this.backButton.style.border = 'none';
        this.backButton.style.borderRadius = '4px';
        this.backButton.style.cursor = 'pointer';
        this.backButton.style.fontWeight = 'bold';
        this.backButton.style.zIndex = '1000';
        this.backButton.style.boxShadow = '0 0 10px rgba(0, 195, 255, 0.5)';
        
        // Handle hover effects
        this.backButton.addEventListener('mouseover', () => {
            this.backButton.style.backgroundColor = '#33d6ff';
        });
        
        this.backButton.addEventListener('mouseout', () => {
            this.backButton.style.backgroundColor = '#00c3ff';
        });
        
        // Add click handler
        this.backButton.addEventListener('click', () => this.handleBackToLobby());
        
        // Add to the DOM
        document.body.appendChild(this.backButton);
    }
    
    // Handle back to lobby button click
    async handleBackToLobby() {
        try {
            // Notify server through the API
            await lobbyService.returnToLobby(this.playerId);
            
            // If we have network manager with socket connection, emit the event directly too
            if (this.networkManager && this.networkManager.socket) {
                this.networkManager.socket.emit('returnToLobby');
            }
            
            // Change state back to lobby
            stateManager.changeState(stateManager.states.LOBBY, {
                username: this.username,
                playerId: this.playerId
            });
            
            // Clean up network resources before switching scenes
            this.cleanup();
            
            // Return to lobby scene
            this.sceneManager.changeScene('lobby', {
                username: this.username,
                playerId: this.playerId
            });
        } catch (error) {
            console.error("Error returning to lobby:", error);
            // Still try to return to lobby even if there was an error
            stateManager.changeState(stateManager.states.LOBBY, {
                username: this.username,
                playerId: this.playerId
            });
            this.cleanup();
            this.sceneManager.changeScene('lobby', {
                username: this.username,
                playerId: this.playerId
            });
        }
    }
    
    cleanup() {
        if (this.isCleanedUp) return;
        
        // Mark as cleaned up to prevent duplicate cleanup
        this.isCleanedUp = true;
        
        // Clean up network manager which includes socket connections
        if (this.networkManager) {
            this.networkManager.cleanup();
            this.networkManager = null;
        }
        
        // Clean up any UI elements
        const backButton = document.getElementById('back-button');
        if (backButton && backButton.parentNode) {
            backButton.parentNode.removeChild(backButton);
        }
        
        // Remove renderer from DOM
        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
}