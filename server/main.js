import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv'; // Import dotenv
import { PlayerManager } from './managers/PlayerManager.js';
import configManager from './managers/ConfigManager.js';
import { AIBotManager } from './managers/AIBotManager.js'; // Add this import at the top
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

// Setup file paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const server = createServer(app);

// Add middleware to parse JSON requests
app.use(express.json());

// Verify API token at startup
if (!process.env.CLOUDFLARE_API_TOKEN) {
    console.warn('Warning: CLOUDFLARE_API_TOKEN not found in environment variables. AI bot will use fallback messages.');
}

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

// Initialize AIBotManager
const aiBot = new AIBotManager(io);
aiBot.initialize();

// Add jukebox state after player manager
const jukeboxState = {
    isPlaying: false,
    trackIndex: 0,
    tracks: []
};

// Function to load available audio tracks
function loadAudioTracks() {
    try {
        const audioDir = path.join(dirname(__dirname), 'client', 'public', 'audio');
        const files = fs.readdirSync(audioDir);
        jukeboxState.tracks = files.filter(file => 
            file.endsWith('.mp3') || 
            file.endsWith('.wav') || 
            file.endsWith('.ogg')
        );
        console.log(`Loaded ${jukeboxState.tracks.length} audio tracks`);
    } catch (error) {
        console.error('Error loading audio tracks:', error);
        jukeboxState.tracks = [];
    }
}

// Load audio tracks on startup
loadAudioTracks();

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
    
    // Send audio tracks to new player
    socket.emit('audioTracks', jukeboxState.tracks);
    
    // Send current jukebox state to new player
    socket.emit('jukeboxUpdate', {
        isPlaying: jukeboxState.isPlaying,
        trackIndex: jukeboxState.trackIndex
    });
    
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
    
    // Handle jukebox control
    socket.on('jukeboxControl', (data) => {
        console.log(`Jukebox control from ${socket.id}:`, data);
        
        switch(data.action) {
            case 'play':
                jukeboxState.isPlaying = true;
                jukeboxState.trackIndex = data.trackIndex;
                break;
            case 'pause':
                jukeboxState.isPlaying = false;
                break;
            case 'next':
                jukeboxState.trackIndex = data.trackIndex;
                jukeboxState.isPlaying = true; // Auto-play when changing tracks
                break;
        }
        
        // Broadcast jukebox state to all clients
        io.emit('jukeboxUpdate', {
            isPlaying: jukeboxState.isPlaying,
            trackIndex: jukeboxState.trackIndex
        });
    });
    
    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        playerManager.removePlayer(socket.id);
        
        // Broadcast player left to all other players
        io.emit('playerLeft', socket.id);
    });
});

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('Server shutting down...');
    if (aiBot) {
        aiBot.cleanup();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Server terminated...');
    if (aiBot) {
        aiBot.cleanup();
    }
    process.exit(0);
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Game configuration: ${configManager.get('game.gridSize')}x${configManager.get('game.gridSize')} grid`);
});