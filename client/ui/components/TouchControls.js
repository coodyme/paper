import { UIComponent } from './UIComponent.js';
import { UIStyles } from '../styles/UIStyles.js';

/**
 * Touch controls component for mobile gameplay
 */
export class TouchControls extends UIComponent {
    constructor(player) {
        super();
        this.player = player;
        this.joystickElement = null;
        this.joystickContainerElement = null;
        this.joystickArrow = null;
        this.innerCircleElement = null;
        this.joystickActive = false;
        this.joystickOrigin = { x: 0, y: 0 };
        this.joystickPosition = { x: 0, y: 0 };
        this.touchId = null;
        
        // Bind methods
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
    }
    
    createElement() {
        // Create the touch controls container
        const touchControls = document.createElement('div');
        touchControls.id = 'touch-controls';
        
        // Apply styles
        Object.assign(touchControls.style, UIStyles.touchControls);
        
        // Create the joystick container
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'joystick-container';
        Object.assign(joystickContainer.style, UIStyles.joystickContainer);
        
        // Create inner circle for the joystick (indicates direction zone)
        const innerCircle = document.createElement('div');
        innerCircle.id = 'joystick-inner-circle';
        Object.assign(innerCircle.style, UIStyles.joystickInnerCircle);
        
        // Create the joystick
        const joystick = document.createElement('div');
        joystick.id = 'joystick';
        Object.assign(joystick.style, UIStyles.joystick);
        
        // Create joystick arrow to indicate direction
        const arrow = document.createElement('div');
        arrow.id = 'joystick-arrow';
        Object.assign(arrow.style, UIStyles.joystickArrow);
        
        // Add info text
        const infoText = document.createElement('div');
        infoText.id = 'mobile-info';
        Object.assign(infoText.style, UIStyles.mobileInfo);
        infoText.innerHTML = 'JOYSTICK:<br>Inner zone = Move<br>Outer zone = Rotate<br>Tap elsewhere to throw cubes<br>Find the JUKEBOX for music!';
        
        // Fade out info text after 5 seconds
        setTimeout(() => {
            infoText.style.transition = 'opacity 1s ease';
            infoText.style.opacity = '0';
        }, 5000);
        
        // Add elements to DOM structure
        joystick.appendChild(arrow);
        joystickContainer.appendChild(innerCircle);
        joystickContainer.appendChild(joystick);
        touchControls.appendChild(joystickContainer);
        touchControls.appendChild(infoText);
        
        // Store references for later use
        this.joystickElement = joystick;
        this.joystickContainerElement = joystickContainer;
        this.joystickArrow = arrow;
        this.innerCircleElement = innerCircle;
        
        return touchControls;
    }
    
    /**
     * Set up event listeners after the component is rendered
     */
    onRender() {
        // Add touch event listeners
        document.addEventListener('touchstart', this.onTouchStart, false);
        document.addEventListener('touchmove', this.onTouchMove, { passive: false });
        document.addEventListener('touchend', this.onTouchEnd, false);
        
        // Add window resize handler
        window.addEventListener('resize', this.onWindowResize);
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        // Update mobile controls positions if needed
    }
    
    /**
     * Touch start event handler
     */
    onTouchStart(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            
            // If we don't have an active touch yet, use this one
            if (this.touchId === null) {
                const touchX = touch.clientX;
                const touchY = touch.clientY;
                
                this.touchId = touch.identifier;
                this.joystickActive = true;
                
                // Center the joystick where the touch occurred
                const containerRect = this.joystickContainerElement.getBoundingClientRect();
                const containerCenterX = containerRect.left + containerRect.width / 2;
                const containerCenterY = containerRect.top + containerRect.height / 2;
                
                this.joystickOrigin.x = containerCenterX;
                this.joystickOrigin.y = containerCenterY;
                this.joystickPosition.x = touchX;
                this.joystickPosition.y = touchY;
                
                // Update joystick visuals
                this.updateJoystickVisuals();
            }
        }
    }
    
    /**
     * Touch move event handler
     */
    onTouchMove(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            
            // Handle joystick movement
            if (touch.identifier === this.touchId) {
                this.joystickPosition.x = touch.clientX;
                this.joystickPosition.y = touch.clientY;
                
                // Calculate joystick offset from center
                let deltaX = this.joystickPosition.x - this.joystickOrigin.x;
                let deltaY = this.joystickPosition.y - this.joystickOrigin.y;
                
                // Calculate distance from center
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // Get the container dimensions
                const containerRect = this.joystickContainerElement.getBoundingClientRect();
                const containerRadius = containerRect.width / 2;
                
                // The inner circle radius (as a percentage of container radius)
                const innerRadius = containerRadius * 0.5;
                
                // Limit overall joystick movement radius
                const maxRadius = containerRadius;
                
                if (distance > maxRadius) {
                    deltaX = (deltaX / distance) * maxRadius;
                    deltaY = (deltaY / distance) * maxRadius;
                    this.joystickPosition.x = this.joystickOrigin.x + deltaX;
                    this.joystickPosition.y = this.joystickOrigin.y + deltaY;
                }
                
                // Determine if we're in the inner (movement) or outer (rotation) zone
                if (distance <= innerRadius) {
                    // Inner zone: MOVEMENT
                    // Reset rotation flags
                    this.player.moveLeft = false;
                    this.player.moveRight = false;
                    
                    // Set movement flags based on direction
                    this.player.moveForward = deltaY < -10;
                    this.player.moveBackward = deltaY > 10;
                    
                    // Hide the direction arrow in movement zone
                    if (this.joystickArrow) {
                        this.joystickArrow.style.display = 'none';
                    }
                    
                    // Set color for movement
                    if (this.joystickElement) {
                        this.joystickElement.style.backgroundColor = 'rgba(0, 255, 255, 0.7)';
                        this.joystickElement.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.7)';
                    }
                } else {
                    // Outer zone: ROTATION
                    // Reset movement flags
                    this.player.moveForward = false;
                    this.player.moveBackward = false;
                    
                    // Set rotation flags based on horizontal position
                    this.player.moveLeft = deltaX < -10;
                    this.player.moveRight = deltaX > 10;
                    
                    // Show and rotate the direction arrow for the rotation zone
                    if (this.joystickArrow) {
                        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                        this.joystickArrow.style.display = 'block';
                        this.joystickArrow.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;
                    }
                    
                    // Set color for rotation
                    if (this.joystickElement) {
                        this.joystickElement.style.backgroundColor = 'rgba(255, 0, 255, 0.7)';
                        this.joystickElement.style.boxShadow = '0 0 15px rgba(255, 0, 255, 0.7)';
                    }
                }
                
                // Update joystick visuals
                this.updateJoystickVisuals();
            }
        }
    }
    
    /**
     * Touch end event handler
     */
    onTouchEnd(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            
            // Handle joystick release
            if (touch.identifier === this.touchId) {
                this.touchId = null;
                this.joystickActive = false;
                
                // Reset movement and rotation flags
                this.player.moveForward = false;
                this.player.moveBackward = false;
                this.player.moveLeft = false;
                this.player.moveRight = false;
                
                // Reset joystick position
                this.resetJoystickVisuals();
                
                // Hide the direction arrow
                if (this.joystickArrow) {
                    this.joystickArrow.style.display = 'none';
                }
            }
        }
    }
    
    /**
     * Update joystick position visuals
     */
    updateJoystickVisuals() {
        if (!this.joystickElement) return;
        
        // Calculate deltas from origin
        const deltaX = this.joystickPosition.x - this.joystickOrigin.x;
        const deltaY = this.joystickPosition.y - this.joystickOrigin.y;
        
        // Update joystick position
        this.joystickElement.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    }
    
    /**
     * Reset joystick to center position
     */
    resetJoystickVisuals() {
        if (!this.joystickElement) return;
        
        // Reset joystick to center
        this.joystickElement.style.transform = 'translate(-50%, -50%)';
        this.joystickElement.style.backgroundColor = 'rgba(0, 195, 255, 0.7)';
        this.joystickElement.style.boxShadow = '0 0 15px rgba(0, 195, 255, 0.7)';
    }
    
    /**
     * Render the component with the parent's render plus event setup
     */
    render(parent) {
        const element = super.render(parent);
        this.onRender();
        return element;
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('touchstart', this.onTouchStart);
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);
        window.removeEventListener('resize', this.onWindowResize);
        
        // Call parent cleanup
        super.cleanup();
    }
}