import * as THREE from 'three';
import configLoader from '../utils/configLoader.js';

export class BillboardManager {
    constructor(scene) {
        this.scene = scene;
        this.billboards = [];
        this.defaultMessages = []
    }
    
    /**
     * Load billboard messages from config or use defaults
     * @returns {Array} Array of billboard messages
     */
    async loadBillboardMessages() {
        try {
            // If config isn't loaded, try to load it
            if (!window.CONFIG_UI) {
                await configLoader.loadConfig();
            }
            
            // Check if we have billboard messages in the config
            if (window.CONFIG_UI && window.CONFIG_UI.billboardMessages) {
                console.log("Loaded billboard messages from config:", window.CONFIG_UI.billboardMessages);
                return window.CONFIG_UI.billboardMessages;
            }
            
            console.warn("Billboard messages not found in config, using defaults");
            return this.defaultMessages;
        } catch (error) {
            console.error("Error loading billboard messages:", error);
            return this.defaultMessages;
        }
    }
    
    /**
     * Create billboards and position them around the environment
     */
    async createBillboards() {
        // Get billboard messages
        const billboardMessages = await this.loadBillboardMessages();
        
        // Create a billboard for each message
        billboardMessages.forEach((text, i) => {
            const billboard = this.createHolographicText(text);
            
            // Position in a circle around the play area, closer to the walls
            const angle = (i / billboardMessages.length) * Math.PI * 2;
            const distance = 40; // Position closer to the walls
            billboard.position.set(
                Math.cos(angle) * distance,
                10 + Math.random() * 5,
                Math.sin(angle) * distance
            );
            
            // Rotate to face center
            billboard.lookAt(0, billboard.position.y, 0);
            
            // Store reference and add to scene
            this.billboards.push(billboard);
            this.scene.add(billboard);
        });
    }
    
    /**
     * Create a holographic text billboard
     * @param {string} text - Text to display on the billboard
     * @returns {THREE.Mesh} - Billboard mesh
     */
    createHolographicText(text) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        // Fill with semi-transparent background
        context.fillStyle = 'rgba(0, 0, 50, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add glowing border
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#ff00ff');
        gradient.addColorStop(1, '#00ffff');
        
        context.strokeStyle = gradient;
        context.lineWidth = 8;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        // Add text
        context.font = 'bold 72px "Courier New"';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#ffffff';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Add scanlines effect
        this.addScanlines(context, canvas.width, canvas.height);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        const geometry = new THREE.PlaneGeometry(10, 5);
        return new THREE.Mesh(geometry, material);
    }
    
    /**
     * Add scanline effect to the billboard
     * @param {CanvasRenderingContext2D} context - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    addScanlines(context, width, height) {
        context.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < height; i += 4) {
            context.fillRect(0, i, width, 2);
        }
    }
    
    /**
     * Update billboards (for animations, etc.)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Add any animations or updates here
        this.billboards.forEach(billboard => {
            // Make billboards slowly rotate
            billboard.rotation.y += deltaTime * 0.05;
        });
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.billboards.forEach(billboard => {
            if (billboard.material && billboard.material.map) {
                billboard.material.map.dispose();
            }
            if (billboard.material) {
                billboard.material.dispose();
            }
            if (billboard.geometry) {
                billboard.geometry.dispose();
            }
            if (billboard.parent) {
                billboard.parent.remove(billboard);
            }
        });
        this.billboards = [];
    }
}