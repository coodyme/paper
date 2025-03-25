import * as THREE from 'three';
import { World } from '../game/world.js';
import { Player } from '../game/player.js';
import { ThirdPersonCamera } from '../game/camera.js';
import { NetworkManager } from '../game/network.js';
import { initDebug } from '../utils/debug.js';
import configLoader from '../utils/configLoader.js';
import { Scene } from '../utils/SceneManager.js';

export class GameScene extends Scene {
    constructor(sceneManager, params = {}) {
        super(sceneManager);
        this.username = params.username || 'Player';
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
        
        // Initialize debug system
        this.debugSystem = initDebug(this.scene);
        
        // Initialize network manager with username
        this.networkManager = new NetworkManager(this.scene, this.camera, this.username);
        
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
            if (this.networkManager) {
                this.networkManager.update(this.clock.getDelta());
            }
        }, updateRate);
        
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
        
        if (this.networkManager && this.networkManager.cleanup) {
            this.networkManager.cleanup();
        }
    }
}