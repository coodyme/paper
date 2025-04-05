import { ColorScheme } from './ColorScheme.js';

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
        backgroundColor: ColorScheme.uiDarkBg,
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        zIndex: '1000'
    },
    
    debugInfo: {
        marginTop: '10px',
        padding: '5px',
        borderTop: `1px solid ${ColorScheme.neonAqua}`,
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
        backgroundColor: ColorScheme.uiDarkBg,
        color: '#fff',
        border: `2px solid ${ColorScheme.electricCyan}`,
        borderRadius: '5px',
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        zIndex: '1000',
        boxShadow: ColorScheme.cyanGlow,
        outline: 'none',
        transition: 'all 0.3s ease'
    },
    
    chatInputFocus: {
        borderColor: ColorScheme.cyberpunkPink,
        boxShadow: ColorScheme.purpleGlow
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
        backgroundColor: ColorScheme.uiDarkBg,
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
        backgroundColor: 'rgba(28, 28, 45, 0.3)',
        border: `2px solid rgba(0, 229, 255, 0.5)`,
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
        border: `1px dashed rgba(15, 240, 252, 0.3)`,
        pointerEvents: 'none'
    },
    
    joystick: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '60px',
        height: '60px',
        borderRadius: '30px',
        backgroundColor: `rgba(0, 229, 255, 0.7)`,
        transform: 'translate(-50%, -50%)',
        boxShadow: ColorScheme.cyanGlow,
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
        borderBottom: `15px solid ${ColorScheme.electricCyan}`,
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
        backgroundColor: ColorScheme.uiDarkBg,
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
        backgroundColor: ColorScheme.darkBgLight,
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
        backgroundColor: 'rgba(10, 10, 31, 0.9)',
        zIndex: '1000'
    },
    
    loginTitle: {
        color: ColorScheme.electricCyan,
        fontSize: '4rem',
        fontFamily: 'Arial, sans-serif',
        textShadow: ColorScheme.cyanGlow,
        marginBottom: '2rem'
    },
    
    loginInputContainer: {
        width: '300px',
        padding: '1rem',
        backgroundColor: 'rgba(28, 28, 45, 0.7)',
        borderRadius: '5px',
        boxShadow: ColorScheme.cyanGlow
    },
    
    usernameInput: {
        width: '100%',
        padding: '10px',
        margin: '10px 0',
        boxSizing: 'border-box',
        border: `2px solid ${ColorScheme.brightCyan}`,
        backgroundColor: 'rgba(10, 10, 31, 0.5)',
        color: 'white',
        outline: 'none',
        fontSize: '16px'
    },
    
    loginButton: {
        width: '100%',
        padding: '10px',
        margin: '10px 0',
        border: 'none',
        backgroundColor: ColorScheme.brightCyan,
        color: 'black',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: ColorScheme.cyanGlow
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