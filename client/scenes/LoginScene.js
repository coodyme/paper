import { Scene } from '../managers/SceneManager.js';
import { LoginForm } from '../ui/components/LoginForm.js';

export class LoginScene extends Scene {
    constructor(sceneManager, container) {
        super(sceneManager, container);
        this.username = 'Player';
        this.loginForm = null;
    }
    
    async init() {
        // Create the scene with a simple background
        this.createBackgroundScene();
        
        // Create login UI
        this.createLoginUI();
    }
    
    createBackgroundScene() {
        // Create a simple three.js scene for the background
        // This could include animated elements, particle effects, etc.
    }
    
    createLoginUI() {
        // Create and render the login form
        this.loginForm = new LoginForm(this.handleLogin.bind(this));
        this.loginForm.render(this.sceneManager.container);
    }
    
    /**
     * Handle login form submission
     */
    async handleLogin(username) {
        if (!username || !username.trim()) return;
        
        this.username = username.trim();
        console.log(`Logging in as: ${this.username}`);
        
        // Change to game scene with the username
        await this.sceneManager.changeScene('game', { username: this.username });
    }
    
    /**
     * Handle window resize
     */
    resize() {
        // Update camera aspect ratio, renderer size, etc.
    }
    
    /**
     * Update the scene
     */
    update(deltaTime) {
        // Update background animations, etc.
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Remove login form
        if (this.loginForm) {
            this.loginForm.cleanup();
            this.loginForm = null;
        }
        
        // Clean up three.js resources
        // Dispose of geometries, materials, etc.
    }
}