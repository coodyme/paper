import configManager from './ConfigManager.js';
import axios from 'axios'; // Replace node-fetch with axios
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class AIBotManager {
    constructor(io) {
        this.io = io;
        this.botId = 'ai-bot-' + Math.random().toString(36).substr(2, 9);
        this.botData = {
            id: this.botId,
            position: { x: 0, y: 0.7, z: 0 },
            rotation: { y: 0 },
            color: 0x3e64ff, // Special blue color for AI
            joinTime: Date.now(),
            peerId: null,
            isBot: true,
            name: 'CodeMind AI'
        };
        
        this.movementInterval = null;
        this.messageInterval = null;
        this.targetPosition = { x: 0, y: 0.7, z: 0 };
        this.movementSpeed = 0.05;
        this.gridSize = configManager.get('game.gridSize', 100) / 2 - 10; // Stay within boundaries
        
        // Message generation
        this.lastMessage = '';
        this.messagePrompts = [
            "What's an interesting insight about AI and programming?",
            "How will AI transform software development in the future?",
            "What's one way AI will help programmers in the next few years?",
            "Share a thought about pair programming with AI assistants.",
            "How might coding education change with AI?",
            "What programming tasks will AI handle best?",
            "How will human programmers and AI collaborate?",
            "What programming languages work best with AI assistance?",
            "Share a brief insight about the future of AI in code generation.",
            "How will debugging change with AI assistants?"
        ];
        
        // Conversation context
        this.conversationContext = [
            {
                role: "system",
                content: "You are 'CodeMind AI', an AI assistant that shares insights about the future of programming with AI. Keep your messages short (maximum 140 characters), optimistic, and thought-provoking. Focus on how AI will transform coding, development workflows, and software engineering."
            }
        ];
        
        // Fallback messages in case API fails
        this.fallbackMessages = [
            "AI will revolutionize debugging by finding patterns humans might miss.",
            "Future programming is a partnership between human creativity and AI assistance.",
            "Soon, AI will understand code context across entire repositories, not just single files.",
            "AI-powered pair programming will become the standard development workflow by 2025.",
            "Code review will be transformed by AI that understands intent, not just syntax.",
            "Low-code platforms with AI will democratize programming for everyone.",
            "AI will handle mundane coding tasks, freeing developers for creative problem-solving.",
            "The most valuable developer skill will soon be prompt engineering for coding assistants.",
            "Language models will eventually understand business logic, not just code patterns.",
            "AI will help bridge the gap between natural language requirements and working code."
        ];
    }

    initialize() {
        // Choose initial random position
        this.chooseNewDestination();
        
        // Start movement updates
        this.movementInterval = setInterval(() => this.updateMovement(), 50);
        
        // Start message generation with random interval (15-30 seconds)
        this.scheduleNextMessage();
        
        // Announce bot joining to all clients
        this.io.emit('playerJoined', this.botData);
        
        console.log(`AI Bot initialized with ID: ${this.botId}`);
        return this.botData;
    }
    
    updateMovement() {
        // Get current position
        const pos = this.botData.position;
        
        // Calculate direction to target
        const dx = this.targetPosition.x - pos.x;
        const dz = this.targetPosition.z - pos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // If we're close to the target, choose a new destination
        if (distance < 0.5) {
            this.chooseNewDestination();
            return;
        }
        
        // Calculate normalized direction
        const dirX = dx / distance;
        const dirZ = dz / distance;
        
        // Update position
        pos.x += dirX * this.movementSpeed;
        pos.z += dirZ * this.movementSpeed;
        pos.y = 0.7 + Math.sin(Date.now() * 0.001) * 0.1; // Floating effect
        
        // Update rotation to face movement direction
        this.botData.rotation.y = Math.atan2(dirX, dirZ);
        
        // Broadcast position update to all clients
        this.io.emit('playerMoved', {
            id: this.botId,
            position: pos,
            rotation: this.botData.rotation
        });
    }
    
    chooseNewDestination() {
        // Choose a random position within the grid boundaries
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.gridSize;
        
        this.targetPosition = {
            x: Math.cos(angle) * distance,
            y: 0.7,
            z: Math.sin(angle) * distance
        };
        
        // 20% chance to generate a message when changing direction
        if (Math.random() < 0.2) {
            this.generateAndSendMessage();
        }
    }
    
    scheduleNextMessage() {
        // Random interval between 15-30 seconds
        const interval = 15000 + Math.random() * 15000;
        this.messageInterval = setTimeout(() => {
            this.generateAndSendMessage();
            this.scheduleNextMessage();
        }, interval);
    }
    
    async generateAndSendMessage() {
        try {
            // Get a random prompt
            const prompt = this.messagePrompts[Math.floor(Math.random() * this.messagePrompts.length)];
            
            // Current context with limited history (keep it small)
            let currentContext = [...this.conversationContext];
            if (currentContext.length > 5) {
                // Keep system prompt and last few exchanges
                currentContext = [currentContext[0], ...currentContext.slice(-4)];
            }
            
            // Add user message
            currentContext.push({
                role: "user",
                content: prompt
            });
            
            // Call Cloudflare AI API
            const apiToken = process.env.CLOUDFLARE_API_TOKEN;
            
            if (!apiToken) {
                console.warn("No Cloudflare API token found, using fallback message");
                this.sendFallbackMessage();
                return;
            }
            
            // Make the API call using axios instead of fetch
            try {
                const response = await axios({
                    method: 'post',
                    url: 'https://api.cloudflare.com/client/v4/accounts/51a60f4777316c6bfd6b773b58a494e8/ai/run/@cf/meta/llama-3-8b-instruct',
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    data: { messages: currentContext }
                });
                
                // Process the response data
                const result = response.data;
                
                if (result && result.result && result.result.response) {
                    // Get the message text and truncate if needed
                    let message = result.result.response.trim();
                    
                    // If too long, truncate
                    if (message.length > 140) {
                        message = message.substring(0, 137) + "...";
                    }
                    
                    // Store in conversation history
                    this.conversationContext.push({
                        role: "user",
                        content: prompt
                    });
                    
                    this.conversationContext.push({
                        role: "assistant",
                        content: message
                    });
                    
                    // Broadcast chat message
                    this.broadcastMessage(message);
                    this.lastMessage = message;
                } else {
                    console.error("Invalid response format from Cloudflare API:", result);
                    this.sendFallbackMessage();
                }
            } catch (error) {
                // Better error handling with axios
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error(`Cloudflare API error: ${error.response.status}`);
                    console.error("Error data:", error.response.data);
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error("No response received from Cloudflare API");
                } else {
                    // Something happened in setting up the request
                    console.error("Error setting up API request:", error.message);
                }
                
                this.sendFallbackMessage();
            }
        } catch (error) {
            console.error("Error in generate message flow:", error);
            this.sendFallbackMessage();
        }
    }
    
    sendFallbackMessage() {
        // Choose a random fallback message (avoiding repetition if possible)
        let availableMessages = this.fallbackMessages.filter(msg => msg !== this.lastMessage);
        
        // If all messages were used, reset
        if (availableMessages.length === 0) {
            availableMessages = this.fallbackMessages;
        }
        
        // Choose a random message
        const message = availableMessages[Math.floor(Math.random() * availableMessages.length)];
        this.lastMessage = message;
        
        // Broadcast the message
        this.broadcastMessage(message);
    }
    
    broadcastMessage(message) {
        // Create a message object that looks like it came from a player
        const messageData = {
            message: message,
            senderId: this.botId,
            timestamp: Date.now(),
            isBot: true
        };
        
        // Broadcast to all clients
        this.io.emit('chatMessage', messageData);
        console.log(`AI Bot says: ${message}`);
    }
    
    cleanup() {
        // Clear intervals
        if (this.movementInterval) {
            clearInterval(this.movementInterval);
        }
        
        if (this.messageInterval) {
            clearTimeout(this.messageInterval);
        }
        
        // Notify clients that the bot has left
        this.io.emit('playerLeft', this.botId);
        console.log('AI Bot removed');
    }
}