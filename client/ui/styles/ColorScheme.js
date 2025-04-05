/**
 * Modern Neon Color Scheme
 * Centralized color palette for UI and 3D elements
 */
export const ColorScheme = {
    // Cyan Neon
    brightCyan: '#00FFFF',
    electricCyan: '#0FF0FC',
    neonAqua: '#00E5FF',
    
    // Purple Neon
    neonPurple: '#BF00FF',
    electricViolet: '#8F00FF',
    cyberpunkPink: '#FF00FF',
    cyberpunkPinkAlt: '#FF00CC',
    
    // Dark Backgrounds
    darkBg: '#0A0A1F',
    darkBgAlt: '#111111',
    darkBgLight: '#1C1C2D',
    
    // UI Elements with transparency
    uiDarkBg: 'rgba(10, 10, 31, 0.8)',
    uiDarkBgLight: 'rgba(28, 28, 45, 0.8)',
    
    // Glow Effects
    cyanGlow: '0 0 15px rgba(0, 255, 255, 0.7)',
    purpleGlow: '0 0 15px rgba(191, 0, 255, 0.7)',
    pinkGlow: '0 0 15px rgba(255, 0, 204, 0.7)',
    
    // Function to get a random neon color
    getRandomNeonColor() {
        const neonColors = [
            this.brightCyan,
            this.electricCyan, 
            this.neonAqua,
            this.neonPurple,
            this.electricViolet,
            this.cyberpunkPink,
            this.cyberpunkPinkAlt
        ];
        return neonColors[Math.floor(Math.random() * neonColors.length)];
    }
};

// Convert hex to THREE.js color integer
export const hexToThreeColor = (hex) => {
    return parseInt(hex.replace('#', '0x'));
};