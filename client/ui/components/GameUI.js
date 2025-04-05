import { UIComponent } from './UIComponent.js';
import { ChatInput } from './ChatInput.js';
import { TouchControls } from './TouchControls.js';
import { VoiceControls } from './VoiceControls.js';

/**
 * Game UI component that manages all in-game UI elements
 */
export class GameUI extends UIComponent {
    constructor() {
        super();
        this.components = {};
    }
    
    createElement() {
        // Create container for game UI
        const container = document.createElement('div');
        container.id = 'game-ui';
        return container;
    }
    
    /**
     * Initialize UI with game systems
     */
    init(networkManager, player, voiceChat) {
        this.networkManager = networkManager;
        this.player = player;
        this.voiceChat = voiceChat;
        
        // Create child components
        this.createComponents();
    }
    
    /**
     * Create all child components
     */
    createComponents() {
        if (!this.element) return;
        
        // Create chat input
        if (this.networkManager) {
            this.components.chatInput = new ChatInput(this.networkManager);
            this.components.chatInput.render(document.body); // Chat input is added directly to body
            
            // Show chat instructions
            this.components.chatInput.showInstructions();
        }
        
        // Create mobile touch controls if on a mobile device
        if (this.player && this.isMobileDevice()) {
            this.components.touchControls = new TouchControls(this.player);
            this.components.touchControls.render(document.body); // Touch controls are added directly to body
        }
        
        // Create voice controls if voice chat is available
        if (this.voiceChat) {
            this.components.voiceControls = new VoiceControls(this.voiceChat);
            this.components.voiceControls.render(document.body); // Voice controls are added directly to body
        }
    }
    
    /**
     * Check if the device is mobile
     */
    isMobileDevice() {
        return (
            navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i)
        );
    }
    
    /**
     * Clean up all child components
     */
    cleanup() {
        // Clean up all child components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.cleanup === 'function') {
                component.cleanup();
            }
        });
        
        this.components = {};
        
        // Call parent cleanup
        super.cleanup();
    }
}