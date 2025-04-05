import express from 'express';
import lobbyManager from '../managers/LobbyManager.js';

const router = express.Router();

/**
 * Get lobby statistics
 * GET /api/lobby/stats
 */
router.get('/stats', (req, res) => {
    const stats = lobbyManager.getLobbyStats();
    res.json(stats);
});

/**
 * Join the lobby
 * POST /api/lobby/join
 * Requires: { username: string }
 */
router.post('/join', (req, res) => {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    
    try {
        const player = lobbyManager.addToLobby({ username });
        res.status(201).json({
            success: true,
            playerId: player.id,
            message: `Player ${username} joined the lobby`
        });
    } catch (error) {
        console.error('Error joining lobby:', error);
        res.status(500).json({ error: 'Failed to join lobby' });
    }
});

/**
 * Leave the lobby
 * POST /api/lobby/leave
 * Requires: { playerId: string }
 */
router.post('/leave', (req, res) => {
    const { playerId } = req.body;
    
    if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
    }
    
    try {
        const success = lobbyManager.removeFromLobby(playerId);
        
        if (!success) {
            // Try removing from game if player wasn't found in lobby
            const player = lobbyManager.findPlayer(playerId);
            if (player && lobbyManager.isInGame(playerId)) {
                lobbyManager.moveToLobby(playerId);
                lobbyManager.removeFromLobby(playerId);
                return res.json({
                    success: true,
                    message: `Player ${playerId} left the game`
                });
            }
            
            return res.status(404).json({ error: 'Player not found in lobby' });
        }
        
        res.json({
            success: true,
            message: `Player ${playerId} left the lobby`
        });
    } catch (error) {
        console.error('Error leaving lobby:', error);
        res.status(500).json({ error: 'Failed to leave lobby' });
    }
});

/**
 * Ready to play (move from lobby to game)
 * POST /api/lobby/ready
 * Requires: { playerId: string }
 */
router.post('/ready', (req, res) => {
    const { playerId } = req.body;
    
    if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
    }
    
    try {
        const player = lobbyManager.moveToGame(playerId);
        
        if (!player) {
            return res.status(404).json({ error: 'Player not found in lobby' });
        }
        
        res.json({
            success: true,
            message: `Player ${player.username} moved to game`
        });
    } catch (error) {
        console.error('Error moving player to game:', error);
        res.status(500).json({ error: 'Failed to move player to game' });
    }
});

/**
 * Return to lobby (move from game back to lobby)
 * POST /api/lobby/return
 * Requires: { playerId: string }
 */
router.post('/return', (req, res) => {
    const { playerId } = req.body;
    
    if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
    }
    
    try {
        const player = lobbyManager.moveToLobby(playerId);
        
        if (!player) {
            return res.status(404).json({ error: 'Player not found in game' });
        }
        
        res.json({
            success: true,
            message: `Player ${player.username} moved back to lobby`
        });
    } catch (error) {
        console.error('Error moving player to lobby:', error);
        res.status(500).json({ error: 'Failed to move player to lobby' });
    }
});

export default router;