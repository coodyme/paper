import { Scene } from '../managers/SceneManager.js';
import { LoginForm } from '../ui/components/LoginForm.js';
import stateManager from '../managers/StateManager.js';
import * as THREE from 'three';

export class LoginScene extends Scene {
    constructor(sceneManager) {
        super(sceneManager);
        this.username = '';
        this.loginForm = null;
        
        // Setup THREE.js scene
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
    }
    
    async init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x050a19, 1);
        this.sceneManager.container.appendChild(this.renderer.domElement);
        
        // Setup initial camera position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Create the scene with a background
        this.createBackgroundScene();
        
        // Create login UI
        this.createLoginUI();
        
        // Ensure state is set to LOGIN
        stateManager.changeState(stateManager.states.LOGIN);
        
        // Start animation loop
        this.animate();
    }
    
    createBackgroundScene() {
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
        
        // Add a point light
        const pointLight = new THREE.PointLight(0x00c3ff, 1, 100);
        pointLight.position.set(0, 10, 10);
        this.scene.add(pointLight);
    }
    
    createLoginUI() {
        // Create and render the login form
        this.loginForm = new LoginForm(this.handleLogin.bind(this));
        this.loginForm.render(document.body);
    }
    
    /**
     * Handle login form submission
     */
    async handleLogin(username) {
        if (!username || !username.trim()) return;
        
        this.username = username.trim();
        console.log(`Logging in as: ${this.username}`);
        
        // Change state to lobby
        stateManager.changeState(stateManager.states.LOBBY, {
            username: this.username
        });
        
        // Navigate to lobby scene
        await this.sceneManager.changeScene('lobby', { 
            username: this.username 
        });
    }
    
    animate() {
        if (this.sceneManager.currentScene !== this) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Simple animation for background
        if (this.scene.children.length > 0) {
            const stars = this.scene.children[0];
            if (stars instanceof THREE.Points) {
                stars.rotation.y += 0.0001;
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
        // Remove login form
        if (this.loginForm) {
            this.loginForm.cleanup();
            this.loginForm = null;
        }
        
        // Remove renderer from DOM
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