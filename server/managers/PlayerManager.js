import configManager from './ConfigManager.js';

export class PlayerManager {
    constructor() {
        this.players = {};
        this.spawnRadius = configManager.get('game.spawnRadius', 20);
    }
    
    /**
     * Add a new player
     * @param {string} id - Player socket ID
     * @returns {Object} - Player data
     */
    addPlayer(id) {
        // Generate random spawn position within configured radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.spawnRadius;
        
        const position = {
            x: Math.cos(angle) * distance,
            y: 0.5,
            z: Math.sin(angle) * distance
        };
        
        const rotation = {
            y: Math.random() * Math.PI * 2
        };
        
        // Create player data
        const player = {
            id,
            position,
            rotation,
            color: this.getRandomColor(),
            joinTime: Date.now(),
            peerId: null // Add field for PeerJS ID
        };
        
        // Store player
        this.players[id] = player;
        
        return player;
    }
    
    /**
     * Set a player's PeerJS ID
     * @param {string} id - Player socket ID
     * @param {string} peerId - PeerJS ID
     * @returns {boolean} - Success status
     */
    setPlayerPeerId(id, peerId) {
        if (this.players[id]) {
            this.players[id].peerId = peerId;
            return true;
        }
        return false;
    }
    
    /**
     * Remove a player
     * @param {string} id - Player socket ID
     */
    removePlayer(id) {
        if (this.players[id]) {
            delete this.players[id];
        }
    }
    
    /**
     * Update player position and rotation
     * @param {string} id - Player socket ID
     * @param {Object} position - Player position {x, y, z}
     * @param {Object} rotation - Player rotation {y}
     */
    updatePlayerPosition(id, position, rotation) {
        if (this.players[id]) {
            this.players[id].position = position;
            this.players[id].rotation = rotation;
        }
    }
    
    /**
     * Get all players' data
     * @returns {Object} - All players data
     */
    getPlayersData() {
        return this.players;
    }
    
    /**
     * Generate a random neon color
     * @returns {string} - Hex color
     */
    getRandomColor() {
        // Neon colors for cyberpunk theme
        const neonColors = [
            0xff00ff, // Magenta
            0x00ffff, // Cyan
            0xffff00, // Yellow
            0xff3399, // Pink
            0x33ccff  // Blue
        ];
        
        return neonColors[Math.floor(Math.random() * neonColors.length)];
    }
}