import * as THREE from 'three';
import { getDebugger } from '../utils/debug.js';

export class Jukebox {
    constructor(scene, networkManager) {
        this.scene = scene;
        this.networkManager = networkManager;
        this.audioTracks = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.audio = new Audio();
        this.mesh = null;
        this.debug = getDebugger();
        
        // Load available audio tracks
        this.loadAudioTracks();
        
        // Create the jukebox 3D object
        this.createJukebox();
        
        // Set up event handlers
        this.setupEventHandlers();
    }
    
    loadAudioTracks() {
        // This will be populated via server message
        this.audioTracks = [];
    }
    
    createJukebox() {
        // Create a jukebox model - a stylized cube with glowing elements
        const geometry = new THREE.BoxGeometry(2, 1.5, 1);
        
        // Create materials for jukebox with cyberpunk aesthetic
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 }), // right
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 }), // left
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 }), // top
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 }), // bottom
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 })  // back
        ];
        
        // Create front face material with display screen texture
        const frontMaterial = this.createJukeboxDisplay();
        materials.push(frontMaterial);
        
        // Create mesh and add to scene
        this.mesh = new THREE.Mesh(geometry, materials);
        this.mesh.position.set(0, 0.75, 0); // Position it on the ground
        
        // Add glow effect
        const jukeboxLight = new THREE.PointLight(0xff00ff, 1, 5);
        jukeboxLight.position.set(0, 1, 0);
        this.mesh.add(jukeboxLight);
        
        // Add jukebox label
        this.addJukeboxLabel();
        
        // Add interaction data for raycasting
        this.mesh.userData.isJukebox = true;
        
        this.scene.add(this.mesh);
    }
    
    createJukeboxDisplay() {
        // Create a canvas for the jukebox display
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        // Fill with dark background
        context.fillStyle = 'rgba(0, 0, 20, 0.9)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add border
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.5, '#00ffff');
        gradient.addColorStop(1, '#ff00ff');
        
        context.strokeStyle = gradient;
        context.lineWidth = 8;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        // Add title
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillStyle = '#ffffff';
        context.fillText('CYBER-JUKEBOX', canvas.width / 2, 20);
        
        // Add control buttons text
        context.font = '24px Arial';
        context.fillText('CLICK TO PLAY/PAUSE', canvas.width / 2, 100);
        context.fillText('RIGHT-CLICK FOR NEXT TRACK', canvas.width / 2, 140);
        
        // Add status text
        context.font = 'bold 28px Arial';
        context.fillStyle = this.isPlaying ? '#00ff00' : '#ff0000';
        context.fillText(this.isPlaying ? 'PLAYING' : 'PAUSED', canvas.width / 2, 200);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        return new THREE.MeshBasicMaterial({ map: texture });
    }
    
    addJukeboxLabel() {
        // Create a canvas for the label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Fill with transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add glowing border
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.5, '#00ffff');
        gradient.addColorStop(1, '#ff00ff');
        
        context.strokeStyle = gradient;
        context.lineWidth = 3;
        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Add text
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#ffffff';
        context.fillText('JUKEBOX', canvas.width / 2, canvas.height / 2);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create label mesh
        const labelGeometry = new THREE.PlaneGeometry(1.5, 0.4);
        const label = new THREE.Mesh(labelGeometry, material);
        
        // Position above jukebox
        label.position.set(0, 1.5, 0);
        
        // Add the label to the jukebox mesh
        this.mesh.add(label);
    }
    
    setupEventHandlers() {
        if (this.networkManager && this.networkManager.socket) {
            // Listen for jukebox updates from server
            this.networkManager.socket.on('jukeboxUpdate', (data) => {
                this.debug?.log('network', `Received jukebox update: ${JSON.stringify(data)}`);
                this.handleJukeboxUpdate(data);
            });
            
            // Listen for audio track list
            this.networkManager.socket.on('audioTracks', (tracks) => {
                this.debug?.log('network', `Received audio tracks: ${JSON.stringify(tracks)}`);
                this.audioTracks = tracks;
                this.updateDisplay();
            });
        }
    }
    
    handleJukeboxUpdate(data) {
        this.isPlaying = data.isPlaying;
        this.currentTrackIndex = data.trackIndex;
        
        // Update the jukebox display
        this.updateDisplay();
        
        // Handle audio playback
        if (this.isPlaying) {
            this.playCurrentTrack();
        } else {
            this.pauseAudio();
        }
    }
    
    updateDisplay() {
        // Update the display material to reflect current state
        if (this.mesh && this.mesh.material && this.mesh.material[5]) {
            // Get the front face material
            const material = this.mesh.material[5];
            
            // Update the texture
            material.map = this.createJukeboxDisplay().map;
            material.map.needsUpdate = true;
        }
    }
    
    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        
        // Send update to server
        if (this.networkManager && this.networkManager.socket) {
            this.networkManager.socket.emit('jukeboxControl', {
                action: this.isPlaying ? 'play' : 'pause',
                trackIndex: this.currentTrackIndex
            });
        }
    }
    
    nextTrack() {
        if (this.audioTracks.length > 0) {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.audioTracks.length;
            
            // Send update to server
            if (this.networkManager && this.networkManager.socket) {
                this.networkManager.socket.emit('jukeboxControl', {
                    action: 'next',
                    trackIndex: this.currentTrackIndex
                });
            }
        }
    }
    
    playCurrentTrack() {
        if (this.audioTracks.length > 0 && this.currentTrackIndex < this.audioTracks.length) {
            const trackPath = `/audio/${this.audioTracks[this.currentTrackIndex]}`;
            
            // Only change source if it's different
            if (this.audio.src !== window.location.origin + trackPath) {
                this.audio.src = trackPath;
            }
            
            // Play the audio
            this.audio.volume = 0.3; // Set a moderate volume
            this.audio.loop = true;
            this.audio.play().catch(error => {
                console.error('Error playing audio:', error);
            });
        }
    }
    
    pauseAudio() {
        this.audio.pause();
    }
    
    handleClick(rightClick = false) {
        if (rightClick) {
            this.nextTrack();
        } else {
            this.togglePlayback();
        }
    }
    
    update(deltaTime) {
        // Add any animation or update logic here
        // For example, making the jukebox glow or pulse to the music
        if (this.mesh) {
            // Make it hover slightly
            this.mesh.position.y = 0.75 + Math.sin(Date.now() * 0.002) * 0.05;
            
            // Rotate slowly
            this.mesh.rotation.y += deltaTime * 0.1;
        }
    }
    
    cleanup() {
        // Stop and clean up audio
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
        
        // Remove mesh from scene
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        
        // Clean up materials and textures
        if (this.mesh && this.mesh.material) {
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(material => {
                    if (material.map) material.map.dispose();
                    material.dispose();
                });
            } else {
                if (this.mesh.material.map) this.mesh.material.map.dispose();
                this.mesh.material.dispose();
            }
        }
        
        // Clean up geometry
        if (this.mesh && this.mesh.geometry) {
            this.mesh.geometry.dispose();
        }
    }
}