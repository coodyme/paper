import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.createGrid();
        this.createLights();
        this.createEnvironment();
    }
    
    createGrid() {
        // Create grid
        const gridSize = 100;
        const gridDivisions = 100;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x00ffff, 0x00ffff);
        this.scene.add(gridHelper);
        
        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x000033,
        });
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.01; // Slightly below the grid
        this.scene.add(floor);
    }
    
    createLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x111111);
        this.scene.add(ambientLight);
        
        // Point lights with different colors
        const colors = [0xff00ff, 0x00ffff, 0xffff00];
        const positions = [
            new THREE.Vector3(10, 10, 10),
            new THREE.Vector3(-10, 8, -10),
            new THREE.Vector3(0, 15, 0)
        ];
        
        colors.forEach((color, i) => {
            const light = new THREE.PointLight(color, 1, 50);
            light.position.copy(positions[i]);
            this.scene.add(light);
            
            // Add subtle animation to lights
            this.animateLight(light);
        });
    }
    
    animateLight(light) {
        const initialY = light.position.y;
        const initialIntensity = light.intensity;
        
        // Random animation parameters
        const speedY = 0.001 + Math.random() * 0.002;
        const speedIntensity = 0.002 + Math.random() * 0.003;
        const rangeY = 0.5 + Math.random() * 1.0;
        const rangeIntensity = 0.2 + Math.random() * 0.3;
        
        // Animation function
        const animate = () => {
            light.position.y = initialY + Math.sin(Date.now() * speedY) * rangeY;
            light.intensity = initialIntensity + Math.sin(Date.now() * speedIntensity) * rangeIntensity;
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    createEnvironment() {
        // Add cyberpunk elements
        this.addHolographicBillboards();
        this.addCyberpunkBuildings();
    }
    
    addHolographicBillboards() {
        const billboardTexts = [
            "NEXUS CORP", 
            "NEURAL LINK", 
            "CYBER ENHANCE", 
            "DIGITAL DREAMS", 
            "NEON LIFE"
        ];
        
        billboardTexts.forEach((text, i) => {
            const billboard = this.createHolographicText(text);
            
            // Position in a circle around the play area
            const angle = (i / billboardTexts.length) * Math.PI * 2;
            const distance = 20;
            billboard.position.set(
                Math.cos(angle) * distance,
                5 + Math.random() * 5,
                Math.sin(angle) * distance
            );
            
            // Rotate to face center
            billboard.lookAt(0, billboard.position.y, 0);
            
            this.scene.add(billboard);
        });
    }
    
    createHolographicText(text) {
        // Create canvas for text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        // Fill with semi-transparent background
        context.fillStyle = 'rgba(0, 0, 50, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add glowing border
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#ff00ff');
        gradient.addColorStop(1, '#00ffff');
        
        context.strokeStyle = gradient;
        context.lineWidth = 8;
        context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        // Add text
        context.font = 'bold 72px "Courier New"';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#ffffff';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Add scanlines effect
        this.addScanlines(context, canvas.width, canvas.height);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        const geometry = new THREE.PlaneGeometry(10, 5);
        return new THREE.Mesh(geometry, material);
    }
    
    addScanlines(context, width, height) {
        context.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < height; i += 4) {
            context.fillRect(0, i, width, 2);
        }
    }
    
    addCyberpunkBuildings() {
        const buildingCount = 15;
        
        for (let i = 0; i < buildingCount; i++) {
            // Random position around the arena
            const angle = (i / buildingCount) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Random height
            const height = 10 + Math.random() * 30;
            
            // Create building
            this.createBuilding(x, z, height);
        }
    }
    
    createBuilding(x, z, height) {
        // Create geometry
        const width = 3 + Math.random() * 5;
        const depth = 3 + Math.random() * 5;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Create material with emissive windows
        const material = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.8,
            roughness: 0.2,
            emissive: new THREE.Color(0.1, 0.1, 0.2)
        });
        
        // Create mesh
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height / 2, z);
        
        // Add emissive windows
        this.addBuildingWindows(building, width, height, depth);
        
        this.scene.add(building);
    }
    
    addBuildingWindows(building, width, height, depth) {
        // Window colors
        const colors = [0x00ffff, 0xff00ff, 0xffff00];
        
        // Create windows on each face
        const sides = [
            { dir: 'x', size: width, sign: 1 },
            { dir: 'x', size: width, sign: -1 },
            { dir: 'z', size: depth, sign: 1 },
            { dir: 'z', size: depth, sign: -1 }
        ];
        
        sides.forEach(side => {
            const windowCount = Math.floor(height / 2); // Windows per column
            const windowSize = 0.3;
            
            for (let row = 0; row < windowCount; row++) {
                const windowsPerRow = side.dir === 'x' 
                    ? Math.floor(depth / 1.5) 
                    : Math.floor(width / 1.5);
                
                for (let col = 0; col < windowsPerRow; col++) {
                    // Don't create a window for every position (random pattern)
                    if (Math.random() > 0.7) continue;
                    
                    const windowGeometry = new THREE.BoxGeometry(
                        side.dir === 'x' ? 0.1 : windowSize,
                        windowSize,
                        side.dir === 'z' ? 0.1 : windowSize
                    );
                    
                    // Random color from palette
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const windowMaterial = new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.8
                    });
                    
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    
                    // Position window on building face
                    const offsetY = row * 2 - height / 2 + 1;
                    let offsetX, offsetZ;
                    
                    if (side.dir === 'x') {
                        offsetX = (side.size / 2) * side.sign;
                        offsetZ = (col * 1.5) - (depth / 2) + 0.75;
                    } else {
                        offsetZ = (side.size / 2) * side.sign;
                        offsetX = (col * 1.5) - (width / 2) + 0.75;
                    }
                    
                    window.position.set(offsetX, offsetY, offsetZ);
                    building.add(window);
                }
            }
        });
    }
}