/**
 * Service for lobby-related API calls
 */
export class LobbyService {
    constructor(serverUrl) {
        this.serverUrl = serverUrl || this.getServerUrl();
    }
    
    /**
     * Get the server URL based on current location
     */
    getServerUrl() {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        return `${protocol}//paper-server.coody.me`;
    }
    
    /**
     * Get lobby statistics (players in lobby and game)
     * @returns {Promise<Object>} Lobby statistics
     */
    async getLobbyStats() {
        try {
            const response = await fetch(`${this.serverUrl}/api/lobby/stats`);
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching lobby stats:', error);
            // Return default structure in case of error
            return {
                playersInLobby: [],
                playersInGame: [],
                lobbyCount: 0,
                gameCount: 0
            };
        }
    }
    
    /**
     * Join the lobby with a username
     * @param {string} username - Player's username
     * @returns {Promise<Object>} Join result
     */
    async joinLobby(username) {
        try {
            const response = await fetch(`${this.serverUrl}/api/lobby/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error joining lobby:', error);
            throw error;
        }
    }
    
    /**
     * Leave the lobby
     * @param {string} playerId - Player's ID
     * @returns {Promise<Object>} Leave result
     */
    async leaveLobby(playerId) {
        try {
            const response = await fetch(`${this.serverUrl}/api/lobby/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ playerId })
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error leaving lobby:', error);
            throw error;
        }
    }
    
    /**
     * Player indicates they're ready to play
     * @param {string} playerId - Player's ID
     * @returns {Promise<Object>} Ready status
     */
    async readyToPlay(playerId) {
        try {
            const response = await fetch(`${this.serverUrl}/api/lobby/ready`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ playerId })
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error setting ready status:', error);
            throw error;
        }
    }
    
    /**
     * Player returns from game to lobby
     * @param {string} playerId - Player's ID
     * @returns {Promise<Object>} Return status
     */
    async returnToLobby(playerId) {
        try {
            const response = await fetch(`${this.serverUrl}/api/lobby/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ playerId })
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error returning to lobby:', error);
            throw error;
        }
    }
}

// Create singleton instance
const lobbyService = new LobbyService();
export default lobbyService;