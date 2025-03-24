import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv'; // Import dotenv
import { PlayerManager } from './managers/PlayerManager.js';
import configManager from './managers/ConfigManager.js';

// Load environment variables
config();

// Setup file paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const server = createServer(app);

// Get server port from config
const PORT = configManager.get('server.port', 3000);

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

// API endpoint to expose configuration to the client
app.get('/api/config', (req, res) => {
    // Only expose safe configuration to the client
    res.json(configManager.getClientConfig());
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
    
    // Handle cube throws
    socket.on('throwCube', (data) => {
        console.log(`Player ${socket.id} threw a cube at player ${data.targetId}`);
        console.log('Throw data:', JSON.stringify(data));
        
        // Add the source player ID to the data
        const throwData = {
            ...data,
            sourceId: socket.id
        };
        
        console.log('Broadcasting throw to all other players');
        
        // Broadcast the throw to all other players
        socket.broadcast.emit('remoteCubeThrow', throwData);
    });
    
    // Handle chat messages
    socket.on('chatMessage', (data) => {
        console.log(`Chat message from ${socket.id}: ${data.message}`);
        
        // Add sender ID to the data
        const messageData = {
            ...data,
            senderId: socket.id
        };
        
        // Broadcast the message to all other players
        socket.broadcast.emit('chatMessage', messageData);
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
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Game configuration: ${configManager.get('game.gridSize')}x${configManager.get('game.gridSize')} grid`);
});