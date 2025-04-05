import { UIComponent } from './UIComponent.js';
import { UIStyles } from '../styles/UIStyles.js';
import { getDebugger } from '../../utils/debug.js';

/**
 * Chat input component for text communication
 */
export class ChatInput extends UIComponent {
    constructor(networkManager) {
        super();
        this.networkManager = networkManager;
        this.isInputActive = false;
        this.currentMessage = '';
        this.chatInstructions = null;
        this.messageDuration = 5000;
        this.instructionsDuration = 3000;
        this.instructionsShown = false;
        this.debug = getDebugger();
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    
    createElement() {
        // Create chat input element
        const chatInput = document.createElement('input');
        chatInput.id = 'chat-input';
        chatInput.type = 'text';
        chatInput.maxLength = 64; // Limit message length
        chatInput.placeholder = 'Type a message...';
        
        // Apply styles
        Object.assign(chatInput.style, UIStyles.chatInput);
        chatInput.style.display = 'none';
        
        // Add input event listener
        chatInput.addEventListener('input', (event) => {
            this.currentMessage = event.target.value;
        });
        
        // Prevent game controls while typing
        chatInput.addEventListener('keydown', (event) => {
            event.stopPropagation();
            
            // Handle Enter key in the input field itself
            if (event.code === 'Enter') {
                this.sendMessage();
                this.hideInput();
                event.preventDefault(); // Prevent new line in input
            } else if (event.code === 'Escape') {
                this.hideInput();
                event.preventDefault();
            }
        });
        
        // Add global keyboard listeners
        document.addEventListener('keydown', this.handleKeyDown);
        
        return chatInput;
    }
    
    /**
     * Handle keyboard events
     */
    handleKeyDown(event) {
        // Only handle Enter key when input is not active
        if (event.code === 'Enter' && !this.isInputActive) {
            this.showInput();
            event.preventDefault();
        }
    }
    
    /**
     * Show the chat instructions when player connects
     */
    showInstructions() {
        if (this.instructionsShown) return; // Show only once
        
        // Create chat instructions element
        if (!this.chatInstructions) {
            this.chatInstructions = document.createElement('div');
            this.chatInstructions.className = 'chat-instructions';
            this.chatInstructions.textContent = 'Press Enter to chat, Enter to send, Esc to cancel';
            
            // Apply styles
            Object.assign(this.chatInstructions.style, UIStyles.chatInstructions);
            document.body.appendChild(this.chatInstructions);
        } else {
            this.chatInstructions.style.display = 'block';
            this.chatInstructions.style.opacity = '0.7';
        }
        
        // Hide instructions after configured duration
        setTimeout(() => {
            if (this.chatInstructions) {
                this.chatInstructions.style.opacity = '0';
                
                // Remove from DOM after fade out
                setTimeout(() => {
                    if (this.chatInstructions) {
                        this.chatInstructions.style.display = 'none';
                    }
                }, 500); // Match transition duration
            }
        }, this.instructionsDuration);
        
        this.instructionsShown = true;
    }
    
    /**
     * Show the chat input
     */
    showInput() {
        if (!this.element) return;
        
        // If on mobile, move the chat input higher up to avoid the virtual keyboard
        const isMobile = this.isMobileDevice();
        
        if (isMobile) {
            this.element.style.bottom = '50%';
        }
        
        this.isInputActive = true;
        this.element.style.display = 'block';
        this.element.value = '';
        this.currentMessage = '';
        this.element.focus();
    }
    
    /**
     * Hide the chat input
     */
    hideInput() {
        if (!this.element) return;
        
        this.element.style.display = 'none';
        this.element.blur();
        
        // Reset position for mobile
        const isMobile = this.isMobileDevice();
        
        if (isMobile) {
            this.element.style.bottom = '80px';
        }
        
        this.isInputActive = false;
    }
    
    /**
     * Send the current message
     */
    sendMessage() {
        if (!this.currentMessage || !this.currentMessage.trim()) return;
        
        const message = this.currentMessage.trim();
        this.debug?.log('network', `Sending chat message: ${message}`);
        
        // Send message to network manager
        if (this.networkManager) {
            this.networkManager.sendChatMessage(message);
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
     * Clean up resources
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Remove chat instructions
        if (this.chatInstructions && this.chatInstructions.parentNode) {
            this.chatInstructions.parentNode.removeChild(this.chatInstructions);
            this.chatInstructions = null;
        }
        
        // Call parent cleanup
        super.cleanup();
    }
}