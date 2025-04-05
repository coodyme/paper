import { SceneManager } from './managers/SceneManager.js';
import { LoginScene } from './scenes/LoginScene.js';
import { GameScene } from './scenes/GameScene.js';
import { LobbyScene } from './scenes/LobbyScene.js';
import stateManager from './managers/StateManager.js';
import gameFeatureManager from './managers/GameFeatureManager.js';

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
    
    /* Logout button responsive style */
    @media (max-width: 768px) {
        button#logout-button {
            padding: 6px 12px;
            font-size: 14px;
            top: 10px;
            right: 10px;
        }
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

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Initializing Paper Game...");
    
    // Initialize the state machine
    console.log("Current state:", stateManager.getCurrentState());
    
    // Initialize game feature manager
    console.log("Game features initialized:", gameFeatureManager.features);
    
    // Create container for scenes
    const container = document.createElement('div');
    container.id = 'app-container';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.overflow = 'hidden';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    document.body.appendChild(container);
    
    // Initialize scene manager
    const sceneManager = new SceneManager(container);
    
    // Register scenes
    sceneManager.registerScene('login', LoginScene);
    sceneManager.registerScene('lobby', LobbyScene);
    sceneManager.registerScene('game', GameScene);
    
    // Start with login scene
    await sceneManager.changeScene('login');
    
    // Handle window resize
    window.addEventListener('resize', () => {
        sceneManager.resize();
    });
    
    // Store reference for debugging
    window.sceneManager = sceneManager;
    window.stateManager = stateManager;
});