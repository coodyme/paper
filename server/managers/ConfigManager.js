import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Manages game configuration settings
 */
export class ConfigManager {
    constructor() {
        this.config = null;
        this.configPath = path.join(__dirname, '..', 'config.json');
        this.load();
    }

    /**
     * Load configuration from file
     */
    load() {
        try {
            // Read the file as a string
            const configData = fs.readFileSync(this.configPath, 'utf8');
            
            // Parse the JSON, handling potential issues
            try {
                this.config = JSON.parse(configData);
                console.log('Configuration loaded successfully');
            } catch (parseError) {
                console.error('Error parsing configuration JSON:', parseError.message);
                
                // Attempt to clean the JSON and try again (remove comments if present)
                try {
                    // Strip any potential comments (not standard in JSON)
                    const cleanedJson = this.stripJsonComments(configData);
                    this.config = JSON.parse(cleanedJson);
                    console.log('Configuration loaded successfully after cleaning');
                } catch (retryError) {
                    console.error('Failed to parse configuration even after cleaning:', retryError.message);
                }
            }
        } catch (error) {
            console.error('Error loading configuration file:', error.message);
        }
    }
    
    /**
     * Remove comments from JSON string (JSON doesn't officially support comments)
     * @param {string} jsonString - The JSON string with potential comments
     * @returns {string} Cleaned JSON string
     */
    stripJsonComments(jsonString) {
        // Remove single line comments (//...)
        let cleanedJson = jsonString.replace(/\/\/.*$/gm, '');
        
        // Remove multi-line comments (/* ... */)
        cleanedJson = cleanedJson.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove any filepath comments at the start of the file
        cleanedJson = cleanedJson.replace(/^\s*\/\/\s*filepath:.*$/m, '');
        
        return cleanedJson;
    }

    /**
     * Get a configuration value by path
     * @param {string} path - Dot-notation path to config value
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = null) {
        if (!this.config) {
            return defaultValue;
        }

        const parts = path.split('.');
        let current = this.config;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return defaultValue;
            }
        }

        return current;
    }

    /**
     * Get the entire configuration object
     * @returns {Object} Complete configuration
     */
    getAll() {
        return this.config;
    }

    /**
     * Get configuration for client exposure
     * @returns {Object} Client-safe configuration
     */
    getClientConfig() {
        // Only expose certain configuration sections to the client
        return {
            ui: this.config.ui,
            game: {
                gridSize: this.config.game.gridSize,
                wallHeight: this.config.game.wallHeight,
                spawnRadius: this.config.game.spawnRadius,
                physics: this.config.game.physics
            }
        };
    }
}

// Create singleton instance
const configManager = new ConfigManager();
export default configManager;