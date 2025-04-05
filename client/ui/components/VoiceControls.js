import { UIComponent } from './UIComponent.js';
import { UIStyles } from '../styles/UIStyles.js';

/**
 * Voice controls component for in-game voice chat
 */
export class VoiceControls extends UIComponent {
    constructor(voiceChat) {
        super();
        this.voiceChat = voiceChat;
        this.toggleButton = null;
    }
    
    createElement() {
        // Create voice chat controls container
        const controls = document.createElement('div');
        controls.id = 'voice-controls';
        
        // Apply styles
        Object.assign(controls.style, UIStyles.voiceControls);
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'voice-toggle';
        toggleButton.textContent = 'Enable Voice';
        toggleButton.className = 'voice-inactive';
        
        // Apply styles
        Object.assign(toggleButton.style, UIStyles.voiceToggleButton);
        
        // Add click event
        toggleButton.addEventListener('click', () => this.toggleVoiceChat());
        
        controls.appendChild(toggleButton);
        this.toggleButton = toggleButton;
        
        return controls;
    }
    
    /**
     * Toggle voice chat on/off
     */
    toggleVoiceChat() {
        if (this.voiceChat) {
            const isActive = this.voiceChat.toggleVoiceChat();
            this.updateButtonState(isActive);
        }
    }
    
    /**
     * Update button appearance based on voice chat state
     */
    updateButtonState(isActive) {
        if (!this.toggleButton) return;
        
        if (isActive) {
            this.toggleButton.textContent = 'Voice Active';
            this.toggleButton.className = 'voice-active';
            this.toggleButton.style.backgroundColor = '#00c3ff';
            this.toggleButton.style.color = '#000';
            this.toggleButton.style.boxShadow = '0 0 10px #00c3ff';
        } else {
            this.toggleButton.textContent = 'Enable Voice';
            this.toggleButton.className = 'voice-inactive';
            this.toggleButton.style.backgroundColor = '#333';
            this.toggleButton.style.color = '#ccc';
            this.toggleButton.style.boxShadow = 'none';
        }
    }
    
    /**
     * Apply responsive styles for mobile devices
     */
    applyResponsiveStyles() {
        if (this.isMobileDevice() && this.element) {
            Object.assign(this.element.style, UIStyles.responsive.mobile.voiceControls);
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
     * Render the component with the parent's render plus responsive styling
     */
    render(parent) {
        const element = super.render(parent);
        this.applyResponsiveStyles();
        return element;
    }
}