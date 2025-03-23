export class PlayerManager {
    constructor() {
        this.players = {};
    }
    
    /**
     * Add a new player
     * @param {string} id - Player socket ID
     * @returns {Object} - Player data
     */
    addPlayer(id) {
        // Generate random spawn position
        const position = {
            x: (Math.random() - 0.5) * 20,
            y: 0.5,
            z: (Math.random() - 0.5) * 20
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
            joinTime: Date.now()
        };
        
        // Store player
        this.players[id] = player;
        
        return player;
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