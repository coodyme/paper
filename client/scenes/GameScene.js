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

export class GameScene extends Scene {
    constructor(sceneManager, params = {}) {
        super(sceneManager);
        this.username = params.username || 'Player';
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

        // Add logout button after initialization
        this.addLogoutButton();
    }
    
    async init() {
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
    
    // Add a new method to create a logout button
    addLogoutButton() {
        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'LOGOUT';
        logoutButton.style.position = 'fixed';
        logoutButton.style.top = '20px';
        logoutButton.style.right = '20px';
        logoutButton.style.padding = '8px 16px';
        logoutButton.style.backgroundColor = '#ff3366';
        logoutButton.style.color = 'white';
        logoutButton.style.border = 'none';
        logoutButton.style.borderRadius = '4px';
        logoutButton.style.cursor = 'pointer';
        logoutButton.style.fontWeight = 'bold';
        logoutButton.style.zIndex = '1000';
        logoutButton.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        
        // Check if on mobile device
        const isMobile = (
            navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i)
        );

        if (isMobile) {
            logoutButton.style.padding = '12px 20px';
            logoutButton.style.fontSize = '16px';
        }

        logoutButton.id = 'logout-button';

        // Add hover effect
        logoutButton.addEventListener('mouseover', () => {
            logoutButton.style.backgroundColor = '#ff5588';
        });
        
        logoutButton.addEventListener('mouseout', () => {
            logoutButton.style.backgroundColor = '#ff3366';
        });
        
        // Add click handler
        logoutButton.addEventListener('click', () => this.handleLogout());
        
        // Store reference for cleanup
        this.logoutButton = logoutButton;
        
        // Add to the DOM
        document.body.appendChild(logoutButton);
    }
    
    // Add a method to handle logout
    handleLogout() {
        // Clean up resources and transition back to login scene
        this.cleanup();
        this.sceneManager.changeScene('login');
    }
    
    // Update existing cleanup method to also remove the logout button
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
        
        // Clean up UI elements
        uiManager.cleanup();
        
        // Remove logout button
        if (this.logoutButton && this.logoutButton.parentNode) {
            this.logoutButton.parentNode.removeChild(this.logoutButton);
        }
    }
}