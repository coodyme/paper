/**
 * Load configuration from the server and make it available to the client
 */
export class ConfigLoader {
    constructor() {
        this.loaded = false;
        this.config = {};
    }
    
    /**
     * Load configuration from the server
     * @returns {Promise} Promise that resolves when configuration is loaded
     */
    async loadConfig() {
        if (this.loaded) return this.config;
        
        try {
            // Get configuration from the server
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            
            const data = await response.json();
            
            // Store configuration
            this.config = data;
            
            // Add each config section to the window object for easy access
            Object.keys(data).forEach(section => {
                window[`CONFIG_${section.toUpperCase()}`] = data[section];
            });
            
            this.loaded = true;
            console.log('Configuration loaded successfully');
            
            return this.config;
        } catch (error) {
            console.error('Error loading configuration:', error);
            this.loaded = false; // Mark as failed
            
            return this.config;
        }
    }
    
    
    /**
     * Get a configuration value
     * @param {string} path - Dot-notation path to config value
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} - Configuration value or default
     */
    get(path, defaultValue = null) {
        if (!this.loaded) {
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
}

// Create a singleton instance
const configLoader = new ConfigLoader();
export default configLoader;