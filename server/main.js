import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv'; // Import dotenv
import { PlayerManager } from './managers/PlayerManager.js';

// Load environment variables
config();

// Setup file paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Initialize player manager
const playerManager = new PlayerManager();

// API routes
app.get('/', (req, res) => {
    res.status(200).send('Paper Game Server');
});

// Server status endpoint
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        players: Object.keys(playerManager.players).length,
        uptime: process.uptime()
    });
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Add new player
    const player = playerManager.addPlayer(socket.id);
    
    // Send current players to new player
    socket.emit('players', playerManager.getPlayersData());
    
    // Broadcast new player to all other players
    socket.broadcast.emit('playerJoined', player);
    
    // Handle player movement
    socket.on('playerMove', (data) => {
        playerManager.updatePlayerPosition(socket.id, data.position, data.rotation);
        
        // Broadcast updated position to all other players
        socket.broadcast.emit('playerMoved', {
            id: socket.id,
            position: data.position,
            rotation: data.rotation
        });
    });
    
    // Handle PeerJS ID registration
    socket.on('registerPeerId', (peerId) => {
        if (playerManager.setPlayerPeerId(socket.id, peerId)) {
            // Broadcast peer ID to all players
            io.emit('playerPeerIdRegistered', {
                id: socket.id,
                peerId: peerId
            });
        }
    });
    
    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        playerManager.removePlayer(socket.id);
        
        // Broadcast player left to all other players
        io.emit('playerLeft', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});