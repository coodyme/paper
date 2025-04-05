/**
 * Manages the game lobby and player states
 */
export class LobbyManager {
    constructor() {
        // Players currently in the lobby
        this.playersInLobby = new Map();
        
        // Players currently in game
        this.playersInGame = new Map();
        
        // In-memory counter for generating player IDs
        // Only used for REST API calls without socket IDs
        this.playerIdCounter = 1000;
    }
    
    /**
     * Add a player to the lobby
     * @param {Object} playerData - Player data
     * @param {string} [playerData.id] - Optional player ID (if already set, e.g. socket ID)
     * @param {string} playerData.username - Player username
     * @returns {Object} Player data with assigned ID
     */
    addToLobby(playerData) {
        const playerId = playerData.id || `lobby_${this.playerIdCounter++}`;
        
        const player = {
            id: playerId,
            username: playerData.username,
            joinedAt: Date.now()
        };
        
        this.playersInLobby.set(playerId, player);
        console.log(`Player ${player.username} (${playerId}) joined the lobby`);
        
        return player;
    }
    
    /**
     * Remove a player from the lobby
     * @param {string} playerId - Player ID to remove
     * @returns {boolean} Whether player was successfully removed
     */
    removeFromLobby(playerId) {
        if (this.playersInLobby.has(playerId)) {
            const player = this.playersInLobby.get(playerId);
            this.playersInLobby.delete(playerId);
            console.log(`Player ${player.username} (${playerId}) left the lobby`);
            return true;
        }
        return false;
    }
    
    /**
     * Move a player from lobby to game
     * @param {string} playerId - Player ID to move
     * @returns {Object|null} Player data or null if player not found
     */
    moveToGame(playerId) {
        if (this.playersInLobby.has(playerId)) {
            const player = this.playersInLobby.get(playerId);
            
            // Remove from lobby
            this.playersInLobby.delete(playerId);
            
            // Add to game with timestamp
            player.gameStartedAt = Date.now();
            this.playersInGame.set(playerId, player);
            
            console.log(`Player ${player.username} (${playerId}) moved from lobby to game`);
            return player;
        }
        return null;
    }
    
    /**
     * Move a player from game back to lobby
     * @param {string} playerId - Player ID to move
     * @returns {Object|null} Player data or null if player not found
     */
    moveToLobby(playerId) {
        if (this.playersInGame.has(playerId)) {
            const player = this.playersInGame.get(playerId);
            
            // Remove from game
            this.playersInGame.delete(playerId);
            
            // Add back to lobby
            delete player.gameStartedAt;
            this.playersInLobby.set(playerId, player);
            
            console.log(`Player ${player.username} (${playerId}) moved from game to lobby`);
            return player;
        }
        return null;
    }
    
    /**
     * Get all players in lobby
     * @returns {Array} Array of player objects
     */
    getLobbyPlayers() {
        return Array.from(this.playersInLobby.values());
    }
    
    /**
     * Get all players in game
     * @returns {Array} Array of player objects
     */
    getGamePlayers() {
        return Array.from(this.playersInGame.values());
    }
    
    /**
     * Get lobby statistics
     * @returns {Object} Lobby stats
     */
    getLobbyStats() {
        return {
            playersInLobby: this.getLobbyPlayers(),
            playersInGame: this.getGamePlayers(),
            lobbyCount: this.playersInLobby.size,
            gameCount: this.playersInGame.size
        };
    }
    
    /**
     * Find a player by ID (in either lobby or game)
     * @param {string} playerId - Player ID to find
     * @returns {Object|null} Player data or null if not found
     */
    findPlayer(playerId) {
        if (this.playersInLobby.has(playerId)) {
            return this.playersInLobby.get(playerId);
        }
        
        if (this.playersInGame.has(playerId)) {
            return this.playersInGame.get(playerId);
        }
        
        return null;
    }
    
    /**
     * Check if player is in the lobby
     * @param {string} playerId - Player ID to check
     * @returns {boolean} Whether player is in lobby
     */
    isInLobby(playerId) {
        return this.playersInLobby.has(playerId);
    }
    
    /**
     * Check if player is in game
     * @param {string} playerId - Player ID to check
     * @returns {boolean} Whether player is in game
     */
    isInGame(playerId) {
        return this.playersInGame.has(playerId);
    }
}

// Create singleton instance
const lobbyManager = new LobbyManager();
export default lobbyManager;