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
        const player = {
            id,
            position: this.getRandomSpawnPosition(),
            rotation: { y: 0 },
            color: this.getRandomColor(),
            peerId: null,
            username: null,
            role: 'player' // Default role
        };
        
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
     * Set a player's username and role
     * @param {string} id - Player socket ID
     * @param {string} username - Player username
     * @param {string} role - Player role (admin or player)
     * @returns {boolean} - Success status
     */
    setUserInfo(id, username, role = 'player') {
        if (this.players[id]) {
            this.players[id].username = username;
            this.players[id].role = role;
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
        const playersData = {};
        
        for (const id in this.players) {
            playersData[id] = {
                id,
                position: this.players[id].position,
                rotation: this.players[id].rotation,
                color: this.players[id].color,
                peerId: this.players[id].peerId,
                username: this.players[id].username,
                role: this.players[id].role, // Include role in data
                isBot: !!this.players[id].isBot,
                name: this.players[id].name // For bots
            };
        }
        
        return playersData;
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

    getRandomSpawnPosition() {
        // Define spawn area boundaries
        const spawnAreaSize = 10;
        
        return {
            x: (Math.random() * spawnAreaSize * 2) - spawnAreaSize,
            y: 0, // Assuming y is height/vertical position
            z: (Math.random() * spawnAreaSize * 2) - spawnAreaSize
        };
    }
}