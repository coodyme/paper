export class InputManager {
    constructor(player) {
        this.player = player;
        this.touchControls = null;
        this.joystickActive = false;
        this.joystickOrigin = { x: 0, y: 0 };
        this.joystickPosition = { x: 0, y: 0 };
        this.touchId = null;
        this.isMobile = this.detectMobile();
        
        // Initialize inputs
        this.setupKeyboardInputs();
        
        // Setup mobile controls if on a mobile device
        if (this.isMobile) {
            this.setupMobileInputs();
        }
        
        // Add window resize handler
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    detectMobile() {
        return (
            navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i)
        );
    }
    
    setupKeyboardInputs() {
        // Setup keyboard event listeners
        document.addEventListener('keydown', this.onKeyDown.bind(this), false);
        document.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }
    
    setupMobileInputs() {
        // Create the touch controls container
        this.touchControls = document.createElement('div');
        this.touchControls.id = 'touch-controls';
        this.touchControls.style.position = 'fixed';
        this.touchControls.style.bottom = '0';
        this.touchControls.style.left = '0';
        this.touchControls.style.width = '100%';
        this.touchControls.style.height = '100%';
        this.touchControls.style.zIndex = '10';
        this.touchControls.style.pointerEvents = 'none'; // Allow clicks to pass through except on the joystick
        
        // Create the joystick container
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'joystick-container';
        joystickContainer.style.position = 'absolute';
        joystickContainer.style.bottom = '80px';
        joystickContainer.style.left = '50%';
        joystickContainer.style.transform = 'translateX(-50%)';
        joystickContainer.style.width = '150px';
        joystickContainer.style.height = '150px';
        joystickContainer.style.borderRadius = '75px';
        joystickContainer.style.backgroundColor = 'rgba(127, 127, 127, 0.3)';
        joystickContainer.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        joystickContainer.style.pointerEvents = 'none'; // Allow clicks to pass through
        
        // Create inner circle for the joystick (indicates direction zone)
        const innerCircle = document.createElement('div');
        innerCircle.id = 'joystick-inner-circle';
        innerCircle.style.position = 'absolute';
        innerCircle.style.top = '50%';
        innerCircle.style.left = '50%';
        innerCircle.style.transform = 'translate(-50%, -50%)';
        innerCircle.style.width = '75px';
        innerCircle.style.height = '75px';
        innerCircle.style.borderRadius = '50%';
        innerCircle.style.border = '1px dashed rgba(255, 255, 255, 0.3)';
        innerCircle.style.pointerEvents = 'none';
        
        // Create the joystick
        const joystick = document.createElement('div');
        joystick.id = 'joystick';
        joystick.style.position = 'absolute';
        joystick.style.top = '50%';
        joystick.style.left = '50%';
        joystick.style.width = '60px';
        joystick.style.height = '60px';
        joystick.style.borderRadius = '30px';
        joystick.style.backgroundColor = 'rgba(0, 195, 255, 0.7)';
        joystick.style.transform = 'translate(-50%, -50%)';
        joystick.style.boxShadow = '0 0 15px rgba(0, 195, 255, 0.7)';
        joystick.style.pointerEvents = 'none'; // Allow clicks to pass through
        
        // Create joystick arrow to indicate direction
        const arrow = document.createElement('div');
        arrow.id = 'joystick-arrow';
        arrow.style.position = 'absolute';
        arrow.style.top = '50%';
        arrow.style.left = '50%';
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.transform = 'translate(-50%, -50%)';
        arrow.style.borderLeft = '10px solid transparent';
        arrow.style.borderRight = '10px solid transparent';
        arrow.style.borderBottom = '15px solid rgba(255, 255, 255, 0.8)';
        arrow.style.pointerEvents = 'none';
        arrow.style.display = 'none'; // Initially hidden
        
        // Add info text
        const infoText = document.createElement('div');
        infoText.id = 'mobile-info';
        infoText.style.position = 'absolute';
        infoText.style.top = '20px';
        infoText.style.left = '0';
        infoText.style.width = '100%';
        infoText.style.textAlign = 'center';
        infoText.style.color = 'rgba(255, 255, 255, 0.7)';
        infoText.style.fontSize = '14px';
        infoText.style.fontFamily = 'Arial, sans-serif';
        infoText.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
        infoText.style.pointerEvents = 'none'; // Allow clicks to pass through
        infoText.innerHTML = 'JOYSTICK:<br>Inner zone = Move<br>Outer zone = Rotate<br>Tap elsewhere to throw cubes';
        
        // Fade out info text after 5 seconds
        setTimeout(() => {
            infoText.style.transition = 'opacity 1s ease';
            infoText.style.opacity = '0';
        }, 5000);
        
        // Add touch event listeners
        document.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onTouchEnd.bind(this), false);
        
        // Add elements to the DOM
        joystick.appendChild(arrow);
        joystickContainer.appendChild(innerCircle);
        joystickContainer.appendChild(joystick);
        this.touchControls.appendChild(joystickContainer);
        this.touchControls.appendChild(infoText);
        document.body.appendChild(this.touchControls);
        
        // Store references for later use
        this.joystickElement = joystick;
        this.joystickContainerElement = joystickContainer;
        this.joystickArrow = arrow;
        this.innerCircleElement = innerCircle;
    }
    
    onWindowResize() {
        // Update mobile controls on window resize if needed
    }
    
    // Keyboard input handlers
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
    
    // Touch input handlers
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
                
                // Update joystick position
                this.updateJoystickVisuals();
            }
        }
    }
    
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
    
    updateJoystickVisuals() {
        if (!this.joystickElement) return;
        
        // Calculate deltas from origin
        const deltaX = this.joystickPosition.x - this.joystickOrigin.x;
        const deltaY = this.joystickPosition.y - this.joystickOrigin.y;
        
        // Update joystick position
        this.joystickElement.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    }
    
    resetJoystickVisuals() {
        if (!this.joystickElement) return;
        
        // Reset joystick to center
        this.joystickElement.style.transform = 'translate(-50%, -50%)';
        this.joystickElement.style.backgroundColor = 'rgba(0, 195, 255, 0.7)';
        this.joystickElement.style.boxShadow = '0 0 15px rgba(0, 195, 255, 0.7)';
    }
    
    update() {
        // Any continuous updates needed for input processing
    }
    
    cleanup() {
        // Remove event listeners
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        
        if (this.isMobile) {
            document.removeEventListener('touchstart', this.onTouchStart);
            document.removeEventListener('touchmove', this.onTouchMove);
            document.removeEventListener('touchend', this.onTouchEnd);
            
            // Remove touch controls from DOM
            if (this.touchControls) {
                document.body.removeChild(this.touchControls);
            }
        }
    }
}