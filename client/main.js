import * as THREE from 'three';
import { World } from './game/world.js';
import { Player } from './game/player.js';
import { ThirdPersonCamera } from './game/camera.js';
import { NetworkManager } from './game/network.js';

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
    #game-controls {
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
`;
document.head.appendChild(style);

// Create game controls div with debug checkbox
const gameControls = document.createElement('div');
gameControls.id = 'game-controls';
gameControls.innerHTML = `
    <div>
        <input type="checkbox" id="debug-projectiles" class="debug-checkbox">
        <label for="debug-projectiles" class="debug-label">Debug Projectiles</label>
    </div>
`;
document.body.appendChild(gameControls);

// Create global debug settings object
window.debugSettings = {
    projectiles: false
};

// Add event listener for the debug checkbox
document.addEventListener('DOMContentLoaded', () => {
    const debugCheckbox = document.getElementById('debug-projectiles');
    debugCheckbox.addEventListener('change', function() {
        window.debugSettings.projectiles = this.checked;
        console.log('Projectile debugging:', window.debugSettings.projectiles ? 'enabled' : 'disabled');
    });
});

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
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        document.body.appendChild(this.renderer.domElement);
        
        // Setup initial camera position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Initialize camera controller
        this.thirdPersonCamera = new ThirdPersonCamera(this.camera);
        
        // Initialize world
        this.world = new World(this.scene);
        
        // Initialize player
        this.player = new Player(this.scene);
        
        // Set player as camera target
        this.thirdPersonCamera.setTarget(this.player.mesh);
        
        // Initialize network manager
        this.networkManager = new NetworkManager(this.scene, this.camera);
        this.networkManager.connect(this.player);
        
        // Set a reasonable network update rate (10 updates per second)
        this.updateInterval = setInterval(() => {
            if (this.networkManager) {
                this.networkManager.update(this.clock.getDelta());
            }
        }, 100);
        
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
        
        // Update projectiles and other networked entities
        if (this.networkManager) {
            this.networkManager.update(deltaTime);
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});