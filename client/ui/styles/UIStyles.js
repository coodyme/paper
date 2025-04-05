/**
 * Centralized UI styles for components
 */
export const UIStyles = {
    // Debug Controls
    debugControls: {
        position: 'fixed',
        top: '20px',
        left: '20px',
        color: 'white',
        fontFamily: 'monospace',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        zIndex: '1000'
    },
    
    debugInfo: {
        marginTop: '10px',
        padding: '5px',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        fontFamily: 'monospace',
        fontSize: '12px',
        whiteSpace: 'pre-wrap',
        maxHeight: '200px',
        overflowY: 'auto',
        display: 'none' // Initially hidden
    },
    
    // Chat Input
    chatInput: {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        width: '60%',
        maxWidth: '500px',
        transform: 'translateX(-50%)',
        padding: '8px 15px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        border: '2px solid #00c3ff',
        borderRadius: '5px',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        zIndex: '1000',
        boxShadow: '0 0 10px rgba(0, 195, 255, 0.5)',
        outline: 'none',
        transition: 'all 0.3s ease'
    },
    
    chatInputFocus: {
        borderColor: '#ff00ff',
        boxShadow: '0 0 15px rgba(255, 0, 255, 0.7)'
    },
    
    chatInstructions: {
        position: 'fixed',
        bottom: '130px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '5px 10px',
        borderRadius: '3px',
        pointerEvents: 'none',
        opacity: '0.7',
        transition: 'opacity 0.5s ease'
    },
    
    // Touch Controls
    touchControls: {
        position: 'fixed',
        bottom: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '10',
        pointerEvents: 'none'
    },
    
    joystickContainer: {
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '150px',
        height: '150px',
        borderRadius: '75px',
        backgroundColor: 'rgba(127, 127, 127, 0.3)',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        pointerEvents: 'none'
    },
    
    joystickInnerCircle: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '75px',
        height: '75px',
        borderRadius: '50%',
        border: '1px dashed rgba(255, 255, 255, 0.3)',
        pointerEvents: 'none'
    },
    
    joystick: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '60px',
        height: '60px',
        borderRadius: '30px',
        backgroundColor: 'rgba(0, 195, 255, 0.7)',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 0 15px rgba(0, 195, 255, 0.7)',
        pointerEvents: 'none'
    },
    
    joystickArrow: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '0',
        height: '0',
        transform: 'translate(-50%, -50%)',
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderBottom: '15px solid rgba(255, 255, 255, 0.8)',
        pointerEvents: 'none',
        display: 'none' // Initially hidden
    },
    
    mobileInfo: {
        position: 'absolute',
        top: '20px',
        left: '0',
        width: '100%',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        textShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'none'
    },
    
    // Voice Controls
    voiceControls: {
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: '1000',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px',
        borderRadius: '5px',
        transition: 'all 0.3s ease'
    },
    
    voiceToggleButton: {
        padding: '8px 15px',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
        fontWeight: 'bold',
        backgroundColor: '#333',
        color: '#ccc'
    },
    
    // Login UI
    loginContainer: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: '1000'
    },
    
    loginTitle: {
        color: '#00ffff',
        fontSize: '4rem',
        fontFamily: 'Arial, sans-serif',
        textShadow: '0 0 10px #00ffff',
        marginBottom: '2rem'
    },
    
    loginInputContainer: {
        width: '300px',
        padding: '1rem',
        backgroundColor: 'rgba(30, 30, 30, 0.7)',
        borderRadius: '5px',
        boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)'
    },
    
    usernameInput: {
        width: '100%',
        padding: '10px',
        margin: '10px 0',
        boxSizing: 'border-box',
        border: '2px solid #00ffff',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        outline: 'none',
        fontSize: '16px'
    },
    
    loginButton: {
        width: '100%',
        padding: '10px',
        margin: '10px 0',
        border: 'none',
        backgroundColor: '#00ffff',
        color: 'black',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
    },
    
    // Responsive styles
    responsive: {
        mobile: {
            voiceControls: {
                bottom: '150px'
            },
            debugControls: {
                top: '10px',
                left: '10px',
                maxWidth: '120px',
                fontSize: '12px',
                padding: '5px'
            },
            chatInput: {
                bottom: '150px',
                width: '80%',
                fontSize: '14px'
            }
        }
    }
};