import { Peer } from 'peerjs';

export class VoiceChat {
    constructor(networkManager) {
        this.networkManager = networkManager;
        this.peer = null;
        this.myPeerId = null;
        this.connections = {}; // Store active connections
        this.stream = null; // Local microphone stream
        this.enabled = false; // Voice chat enabled state
        this.maxDistance = 20; // Maximum distance for voice chat
        this.audioElements = {}; // Audio elements for remote peers
    }

    async initialize() {
        try {
            // Initialize peer connection
            this.peer = new Peer({
                // Use PeerJS cloud server
                debug: 1
            });

            // Set up event handlers
            this.setupPeerEvents();

            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: false, 
                audio: true 
            });

            // Create UI controls
            this.createVoiceControls();
            
            return true;
        } catch (error) {
            console.error("Voice chat initialization failed:", error);
            return false;
        }
    }

    setupPeerEvents() {
        // Handle successful connection to PeerJS server
        this.peer.on('open', (id) => {
            console.log('Voice chat connected with ID:', id);
            this.myPeerId = id;
            
            // Notify server about our PeerJS ID
            if (this.networkManager && this.networkManager.socket) {
                this.networkManager.socket.emit('registerPeerId', id);
            }
        });

        // Handle incoming calls
        this.peer.on('call', (call) => {
            // Answer the call with our audio stream
            if (this.stream && this.enabled) {
                call.answer(this.stream);
            } else {
                call.answer(null); // Answer with no stream if disabled
            }

            // Handle incoming audio
            call.on('stream', (remoteStream) => {
                const peerId = call.peer;
                this.setupRemoteAudio(peerId, remoteStream);
            });

            // Handle call close
            call.on('close', () => {
                const peerId = call.peer;
                this.removeRemoteAudio(peerId);
            });
        });

        // Handle errors
        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
        });
    }

    setupRemoteAudio(peerId, stream) {
        // If we already have an audio element for this peer, remove it
        this.removeRemoteAudio(peerId);

        // Create new audio element
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.volume = 0; // Start with volume 0, will be adjusted based on distance
        
        // Store the audio element
        this.audioElements[peerId] = audio;
    }

    removeRemoteAudio(peerId) {
        if (this.audioElements[peerId]) {
            this.audioElements[peerId].srcObject = null;
            this.audioElements[peerId] = null;
            delete this.audioElements[peerId];
        }
    }

    callPlayer(playerId, peerId) {
        // Skip if this player already has a connection
        if (this.connections[playerId]) return;
        
        // Skip self
        if (peerId === this.myPeerId) return;
        
        // Skip if voice chat is disabled
        if (!this.enabled) return;

        try {
            // Call the peer
            const call = this.peer.call(peerId, this.stream);
            
            // Store the connection
            this.connections[playerId] = call;
            
            // Handle remote stream
            call.on('stream', (remoteStream) => {
                this.setupRemoteAudio(peerId, remoteStream);
            });
            
            // Handle call close
            call.on('close', () => {
                delete this.connections[playerId];
                this.removeRemoteAudio(peerId);
            });
        } catch (error) {
            console.error('Failed to call peer', peerId, error);
        }
    }

    updateVoiceVolumes() {
        // Skip if voice chat is disabled
        if (!this.enabled) return;
        
        // Get local player position
        const localPlayer = this.networkManager.localPlayer;
        if (!localPlayer || !localPlayer.mesh) return;
        
        const localPos = localPlayer.mesh.position;
        
        // For each remote player, adjust audio volume based on distance
        Object.keys(this.networkManager.players).forEach(playerId => {
            const playerData = this.networkManager.playerData[playerId];
            const playerMesh = this.networkManager.players[playerId];
            
            // Skip if no peer ID or no audio element
            if (!playerData || !playerData.peerId || !this.audioElements[playerData.peerId]) return;
            
            // Calculate distance between players
            const playerPos = playerMesh.position;
            const distance = localPos.distanceTo(playerPos);
            
            // Adjust volume based on distance (linear falloff)
            const audio = this.audioElements[playerData.peerId];
            
            if (distance <= this.maxDistance) {
                // Calculate volume (1.0 at distance 0, 0.0 at maxDistance)
                audio.volume = Math.max(0, 1 - (distance / this.maxDistance));
            } else {
                audio.volume = 0;
            }
        });
    }

    toggleVoiceChat() {
        this.enabled = !this.enabled;
        
        // Update UI
        const button = document.getElementById('voice-toggle');
        if (button) {
            button.textContent = this.enabled ? 'Mute' : 'Unmute';
            button.className = this.enabled ? 'voice-active' : 'voice-inactive';
        }
        
        // Enable/disable all tracks in the stream
        if (this.stream) {
            this.stream.getAudioTracks().forEach(track => {
                track.enabled = this.enabled;
            });
        }
        
        // If disabled, close all connections
        if (!this.enabled) {
            Object.keys(this.connections).forEach(playerId => {
                if (this.connections[playerId]) {
                    this.connections[playerId].close();
                }
            });
            this.connections = {};
        } else {
            // If enabled, reconnect to all nearby players
            this.connectToNearbyPlayers();
        }
    }

    connectToNearbyPlayers() {
        // Get all players with peer IDs
        Object.keys(this.networkManager.playerData || {}).forEach(playerId => {
            const playerData = this.networkManager.playerData[playerId];
            if (playerData && playerData.peerId) {
                this.callPlayer(playerId, playerData.peerId);
            }
        });
    }

    createVoiceControls() {
        // Create voice chat controls
        const controls = document.createElement('div');
        controls.id = 'voice-controls';
        controls.style.position = 'fixed';
        controls.style.bottom = '20px';
        controls.style.left = '20px';
        controls.style.zIndex = '1000';
        controls.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        controls.style.padding = '10px';
        controls.style.borderRadius = '5px';
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'voice-toggle';
        toggleButton.textContent = 'Enable Voice';
        toggleButton.className = 'voice-inactive';
        toggleButton.style.padding = '8px 15px';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '3px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.fontWeight = 'bold';
        toggleButton.style.backgroundColor = '#333';
        toggleButton.style.color = '#ccc';
        
        // Add click event
        toggleButton.addEventListener('click', () => this.toggleVoiceChat());
        
        controls.appendChild(toggleButton);
        document.body.appendChild(controls);
    }

    cleanup() {
        // Close all connections
        Object.keys(this.connections).forEach(playerId => {
            if (this.connections[playerId]) {
                this.connections[playerId].close();
            }
        });
        
        // Close peer connection
        if (this.peer) {
            this.peer.destroy();
        }
        
        // Stop media stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        // Remove UI
        const controls = document.getElementById('voice-controls');
        if (controls) {
            controls.remove();
        }
    }
}