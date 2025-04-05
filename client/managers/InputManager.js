/**
 * Handles player input (keyboard only)
 */
export class InputManager {
    constructor(player) {
        this.player = player;
        
        // Bind methods
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        
        // Initialize inputs
        this.setupKeyboardInputs();
    }
    
    /**
     * Set up keyboard event listeners
     */
    setupKeyboardInputs() {
        // Add keyboard event listeners
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
    }
    
    /**
     * Handle keydown events
     */
    onKeyDown(event) {
        if (this.player) {
            switch (event.code) {
                case 'KeyW':
                    this.player.moveForward = true;
                    break;
                case 'KeyS':
                    this.player.moveBackward = true;
                    break;
                case 'KeyA':
                    this.player.moveLeft = true;
                    break;
                case 'KeyD':
                    this.player.moveRight = true;
                    break;
            }
        }
    }
    
    /**
     * Handle keyup events
     */
    onKeyUp(event) {
        if (this.player) {
            switch (event.code) {
                case 'KeyW':
                    this.player.moveForward = false;
                    break;
                case 'KeyS':
                    this.player.moveBackward = false;
                    break;
                case 'KeyA':
                    this.player.moveLeft = false;
                    break;
                case 'KeyD':
                    this.player.moveRight = false;
                    break;
            }
        }
    }
    
    /**
     * Update method called each frame
     * This empty method ensures compatibility with the Player class
     * which expects InputManager to have an update method
     */
    update() {
        // No per-frame updates needed for keyboard input
        // This method exists for compatibility with the player update cycle
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }
}