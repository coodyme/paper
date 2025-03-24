import { getDebugger } from '../utils/debug.js';
import * as THREE from 'three';

export class ChatSystem {
    constructor(networkManager) {
        this.networkManager = networkManager;
        this.isInputActive = false;
        this.chatInput = null;
        this.chatInstructions = null;
        this.currentMessage = '';
        this.messages = {}; // Store messages by player ID
        this.messageDuration = 5000; // Messages display for 5 seconds
        this.debug = getDebugger();
        this.instructionsShown = false; // Track if instructions have been shown
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for Enter key to activate chat input
        document.addEventListener('keydown', (event) => {
            // Only handle Enter key when input is not active or when input is active and we're submitting
            if (event.code === 'Enter') {
                if (this.isInputActive) {
                    // Submit message
                    this.sendMessage();
                    this.hideInput();
                    event.preventDefault(); // Prevent default Enter behavior
                } else {
                    // Show input
                    this.showInput();
                    event.preventDefault(); // Prevent default Enter behavior
                }
            } else if (event.code === 'Escape' && this.isInputActive) {
                // Cancel message
                this.hideInput();
                event.preventDefault(); // Prevent default Escape behavior
            }
        });
    }
    
    createChatInput() {
        if (this.chatInput) return;
        
        // Create chat input element
        this.chatInput = document.createElement('input');
        this.chatInput.id = 'chat-input';
        this.chatInput.type = 'text';
        this.chatInput.maxLength = 64; // Limit message length
        this.chatInput.placeholder = 'Type a message...';
        
        // Style the input
        this.chatInput.style.position = 'fixed';
        this.chatInput.style.bottom = '80px';
        this.chatInput.style.left = '50%';
        this.chatInput.style.width = '60%';
        this.chatInput.style.maxWidth = '500px';
        this.chatInput.style.transform = 'translateX(-50%)';
        this.chatInput.style.padding = '8px 15px';
        this.chatInput.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.chatInput.style.color = '#fff';
        this.chatInput.style.border = '2px solid #00c3ff';
        this.chatInput.style.borderRadius = '5px';
        this.chatInput.style.fontSize = '16px';
        this.chatInput.style.fontFamily = 'Arial, sans-serif';
        this.chatInput.style.zIndex = '1000';
        this.chatInput.style.display = 'none';
        this.chatInput.style.boxShadow = '0 0 10px rgba(0, 195, 255, 0.5)';
        
        // Add input event listener
        this.chatInput.addEventListener('input', (event) => {
            this.currentMessage = event.target.value;
        });
        
        // Prevent game controls while typing
        this.chatInput.addEventListener('keydown', (event) => {
            event.stopPropagation();
            
            // Handle Enter key in the input field itself
            if (event.code === 'Enter') {
                this.sendMessage();
                this.hideInput();
                event.preventDefault(); // Prevent new line in input
            }
        });
        
        document.body.appendChild(this.chatInput);
    }
    
    // Show instructions when player connects - call this from NetworkManager after connection
    showInstructions() {
        if (this.instructionsShown) return; // Show only once
        
        // Create chat instructions element
        if (!this.chatInstructions) {
            this.chatInstructions = document.createElement('div');
            this.chatInstructions.className = 'chat-instructions';
            this.chatInstructions.textContent = 'Press Enter to chat, Enter to send, Esc to cancel';
            this.chatInstructions.style.position = 'fixed';
            this.chatInstructions.style.bottom = '130px';
            this.chatInstructions.style.left = '50%';
            this.chatInstructions.style.transform = 'translateX(-50%)';
            this.chatInstructions.style.color = '#fff';
            this.chatInstructions.style.fontFamily = 'Arial, sans-serif';
            this.chatInstructions.style.fontSize = '12px';
            this.chatInstructions.style.textAlign = 'center';
            this.chatInstructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            this.chatInstructions.style.padding = '5px 10px';
            this.chatInstructions.style.borderRadius = '3px';
            this.chatInstructions.style.pointerEvents = 'none';
            this.chatInstructions.style.opacity = '0.7';
            this.chatInstructions.style.transition = 'opacity 0.5s ease';
            document.body.appendChild(this.chatInstructions);
        } else {
            this.chatInstructions.style.display = 'block';
            this.chatInstructions.style.opacity = '0.7';
        }
        
        // Hide instructions after 3 seconds
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
        }, 3000);
        
        this.instructionsShown = true;
    }
    
    showInput() {
        if (!this.chatInput) {
            this.createChatInput();
        }
        
        this.isInputActive = true;
        this.chatInput.style.display = 'block';
        this.chatInput.value = '';
        this.currentMessage = '';
        this.chatInput.focus();
    }
    
    hideInput() {
        if (this.chatInput) {
            this.chatInput.style.display = 'none';
            this.chatInput.blur();
        }
        this.isInputActive = false;
    }
    
    sendMessage() {
        if (!this.currentMessage || !this.currentMessage.trim()) return;
        
        const message = this.currentMessage.trim();
        this.debug?.log('network', `Sending chat message: ${message}`);
        
        // Display message above local player
        this.displayLocalMessage(message);
        
        // Send message to all peers
        this.broadcastMessage(message);
    }
    
    displayLocalMessage(message) {
        if (!this.networkManager.localPlayer) return;
        
        // Create message text object
        this.createMessageLabel(this.networkManager.localPlayer.mesh, 'local', message);
    }
    
    broadcastMessage(message) {
        if (!this.networkManager.socket) return;
        
        // Send message through socket.io to all players
        this.networkManager.socket.emit('chatMessage', { 
            message: message,
            timestamp: Date.now()
        });
    }
    
    receiveMessage(senderId, message) {
        this.debug?.log('network', `Received chat message from ${senderId}: ${message}`);
        
        // Get player mesh
        const playerMesh = this.networkManager.players[senderId];
        if (!playerMesh) return;
        
        // Create message text above player
        this.createMessageLabel(playerMesh, senderId, message);
    }
    
    createMessageLabel(playerMesh, playerId, message) {
        // Remove existing message if one exists
        this.removeExistingMessage(playerId);
        
        // Create a canvas for the message
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size based on message length
        const fontSize = 18;
        context.font = `${fontSize}px Arial`;
        const messageWidth = context.measureText(message).width;
        const padding = 20;
        canvas.width = messageWidth + padding * 2;
        canvas.height = 40;
        
        // Fill with semi-transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add border
        context.strokeStyle = '#00c3ff';
        context.lineWidth = 2;
        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Add text
        context.font = `${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#ffffff';
        context.fillText(message, canvas.width / 2, canvas.height / 2);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create label mesh
        const labelWidth = canvas.width / 100;
        const labelHeight = canvas.height / 100;
        const labelGeometry = new THREE.PlaneGeometry(labelWidth, labelHeight);
        const label = new THREE.Mesh(labelGeometry, material);
        
        // Position above player's name label
        label.position.set(0, 1.7, 0);
        
        // Ensure label is always facing the camera
        label.userData.isBillboard = true;
        
        // Add to player mesh
        playerMesh.add(label);
        
        // Store in messages object with timestamp
        this.messages[playerId] = {
            mesh: label,
            timestamp: Date.now()
        };
        
        // Set timeout to remove message
        setTimeout(() => {
            this.removeExistingMessage(playerId);
        }, this.messageDuration);
    }
    
    removeExistingMessage(playerId) {
        if (this.messages[playerId]) {
            const messageMesh = this.messages[playerId].mesh;
            if (messageMesh.parent) {
                messageMesh.parent.remove(messageMesh);
            }
            
            // Clean up resources
            if (messageMesh.material && messageMesh.material.map) {
                messageMesh.material.map.dispose();
                messageMesh.material.dispose();
            }
            if (messageMesh.geometry) {
                messageMesh.geometry.dispose();
            }
            
            delete this.messages[playerId];
        }
    }
    
    update() {
        // Update chat message billboards to face camera
        for (const playerId in this.messages) {
            const messageData = this.messages[playerId];
            const messageMesh = messageData.mesh;
            
            if (this.networkManager.camera && messageMesh) {
                messageMesh.lookAt(this.networkManager.camera.position);
            }
            
            // Check if message has expired
            const elapsed = Date.now() - messageData.timestamp;
            if (elapsed >= this.messageDuration) {
                this.removeExistingMessage(playerId);
            }
        }
    }
    
    // Clean up resources when the chat system is destroyed
    cleanup() {
        // Remove DOM elements
        if (this.chatInput) {
            document.body.removeChild(this.chatInput);
            this.chatInput = null;
        }
        
        if (this.chatInstructions) {
            document.body.removeChild(this.chatInstructions);
            this.chatInstructions = null;
        }
        
        // Remove all message meshes
        Object.keys(this.messages).forEach(playerId => {
            this.removeExistingMessage(playerId);
        });
    }
}