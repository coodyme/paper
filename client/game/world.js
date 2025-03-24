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
        
        // Create ceiling with the same material
        const ceilingGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
        const ceiling = new THREE.Mesh(ceilingGeometry, floorMaterial.clone());
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 30; // Positioned high above
        this.scene.add(ceiling);
        
        // Create walls using the same material
        this.createWalls(gridSize, floorMaterial);
    }
    
    createWalls(size, material) {
        // Create four walls around the grid area
        const wallHeight = 30;
        const halfSize = size / 2;
        
        // Create wall geometries
        const wallGeometry = new THREE.PlaneGeometry(size, wallHeight);
        
        // North wall
        const northWall = new THREE.Mesh(wallGeometry, material.clone());
        northWall.position.set(0, wallHeight / 2, -halfSize);
        northWall.rotation.y = Math.PI;
        this.scene.add(northWall);
        
        // South wall
        const southWall = new THREE.Mesh(wallGeometry, material.clone());
        southWall.position.set(0, wallHeight / 2, halfSize);
        this.scene.add(southWall);
        
        // East wall
        const eastWall = new THREE.Mesh(wallGeometry, material.clone());
        eastWall.position.set(halfSize, wallHeight / 2, 0);
        eastWall.rotation.y = -Math.PI / 2;
        this.scene.add(eastWall);
        
        // West wall
        const westWall = new THREE.Mesh(wallGeometry, material.clone());
        westWall.position.set(-halfSize, wallHeight / 2, 0);
        westWall.rotation.y = Math.PI / 2;
        this.scene.add(westWall);
        
        // Add grid lines to walls for visual effect
        this.addGridToWalls(northWall, size, wallHeight);
        this.addGridToWalls(southWall, size, wallHeight);
        this.addGridToWalls(eastWall, size, wallHeight);
        this.addGridToWalls(westWall, size, wallHeight);
    }
    
    addGridToWalls(wall, width, height) {
        // Create a grid of glowing lines on the walls
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3
        });
        
        // Horizontal lines
        const horizontalSpacing = 5;
        for (let y = 0; y <= height; y += horizontalSpacing) {
            const points = [
                new THREE.Vector3(-width/2, y - height/2, 0.01),
                new THREE.Vector3(width/2, y - height/2, 0.01)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, gridMaterial);
            wall.add(line);
        }
        
        // Vertical lines
        const verticalSpacing = 5;
        for (let x = 0; x <= width; x += verticalSpacing) {
            const points = [
                new THREE.Vector3(x - width/2, -height/2, 0.01),
                new THREE.Vector3(x - width/2, height/2, 0.01)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, gridMaterial);
            wall.add(line);
        }
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
        // Keep only the holographic billboards
        this.addHolographicBillboards();
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
            
            // Position in a circle around the play area, but closer to the walls
            const angle = (i / billboardTexts.length) * Math.PI * 2;
            const distance = 40; // Position closer to the walls
            billboard.position.set(
                Math.cos(angle) * distance,
                10 + Math.random() * 5,
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
}