import * as THREE from 'three';
import { World } from './game/world.js';
import { Player } from './game/player.js';
import { ThirdPersonCamera } from './game/camera.js';
import { NetworkManager } from './game/network.js';
import { initDebug } from './utils/debug.js';
import configLoader from './utils/configLoader.js';

// Add CSS for controls
const style = document.createElement('style');
style.textContent = `
    #voice-controls {
        transition: all 0.3s ease;
    }
    .voice-inactive {
        background-color: #333 !important;
        color: #ccc !important;
    }
    .voice-active {
        background-color: #00c3ff !important;
        color: #000 !important;
        box-shadow: 0 0 10px #00c3ff;
    }
    #debug-controls {
        position: fixed;
        top: 20px;
        left: 20px;
        color: white;
        font-family: monospace;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 10px;
        border-radius: 5px;
        font-size: 14px;
        z-index: 1000;
    }
    .debug-checkbox {
        margin-right: 5px;
        vertical-align: middle;
    }
    .debug-label {
        cursor: pointer;
        user-select: none;
    }
    #chat-input {
        outline: none;
        transition: all 0.3s ease;
    }
    #chat-input:focus {
        border-color: #ff00ff;
        box-shadow: 0 0 15px rgba(255, 0, 255, 0.7);
    }
    
    /* Mobile device styles */
    @media (max-width: 768px) {
        #voice-controls {
            bottom: 150px !important;
        }
        
        #debug-controls {
            top: 10px;
            left: 10px;
            max-width: 120px;
            font-size: 12px;
            padding: 5px;
        }
        
        #chat-input {
            bottom: 150px !important;
            width: 80% !important;
            font-size: 14px !important;
        }
    }
    
    /* Prevent pinch zoom on touch devices */
    body {
        touch-action: none;
    }
`;
document.head.appendChild(style);

// Add viewport meta tag to prevent zooming on mobile
const metaViewport = document.createElement('meta');
metaViewport.name = 'viewport';
metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
document.head.appendChild(metaViewport);

// Create global debug settings object for backward compatibility
window.debugSettings = {
    projectiles: false,
    physics: false,
    network: false
};

// Main game class
class Game {
    constructor() {
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
    }

    async init() {
        // Load configuration before initializing the game
        await configLoader.loadConfig();
        
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        document.body.appendChild(this.renderer.domElement);
        
        // Setup initial camera position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Add camera to scene - Needed for billboard labels
        this.scene.add(this.camera);
        
        // Initialize camera controller
        this.thirdPersonCamera = new ThirdPersonCamera(this.camera);
        
        // Initialize world
        this.world = new World(this.scene);
        
        // Initialize player with config-based speeds
        this.player = new Player(this.scene);
        
        // Set player as camera target
        this.thirdPersonCamera.setTarget(this.player.mesh);
        
        // Initialize debug system
        this.debugSystem = initDebug(this.scene);
        
        // Initialize network manager
        this.networkManager = new NetworkManager(this.scene, this.camera);
        this.networkManager.connect(this.player);
        
        // Set network update rate from configuration
        const updateRate = configLoader.get('network.updateRate', 100);
        this.updateInterval = setInterval(() => {
            if (this.networkManager) {
                this.networkManager.update(this.clock.getDelta());
            }
        }, updateRate);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start animation loop
        this.animate();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Get delta time
        const deltaTime = this.clock.getDelta();
        
        // Update player
        if (this.player) {
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
        if (this.networkManager) {
            this.networkManager.update(deltaTime);
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    // Clean up resources when game is destroyed
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.player) {
            this.player.cleanup();
        }
        
        if (this.world) {
            this.world.cleanup();
        }
        
        if (this.networkManager) {
            // Cleanup network resources if we add a cleanup method
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const game = new Game();
    await game.init();
    
    // Store game reference for potential cleanup
    window.gameInstance = game;
});