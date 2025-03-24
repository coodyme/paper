import * as THREE from 'three';
import { BillboardManager } from './billboard.js';
import { Jukebox } from './jukebox.js'; // Import Jukebox
import configLoader from '../utils/configLoader.js';

export class World {
    constructor(scene, networkManager) {
        this.scene = scene;
        this.networkManager = networkManager;
        this.billboardManager = new BillboardManager(scene);
        this.jukebox = null; // Will be initialized later when network is available
        
        this.createGrid();
        this.createLights();
        this.createEnvironment();
    }
    
    // Add method to initialize jukebox (after network is available)
    initJukebox() {
        if (!this.jukebox && this.networkManager) {
            this.jukebox = new Jukebox(this.scene, this.networkManager);
        }
    }
    
    createGrid() {
        // Get grid size from configuration
        const gridSize = configLoader.get('game.gridSize', 100);
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
        
        // Get wall height from configuration
        const wallHeight = configLoader.get('game.wallHeight', 30);
        ceiling.position.y = wallHeight; // Positioned high above
        this.scene.add(ceiling);
        
        // Create walls using the same material
        this.createWalls(gridSize, floorMaterial, wallHeight);
    }
    
    createWalls(size, material, height) {
        // Create four walls around the grid area
        const halfSize = size / 2;
        
        // Create wall geometries
        const wallGeometry = new THREE.PlaneGeometry(size, height);
        
        // North wall
        const northWall = new THREE.Mesh(wallGeometry, material.clone());
        northWall.position.set(0, height / 2, -halfSize);
        northWall.rotation.y = Math.PI;
        this.scene.add(northWall);
        
        // South wall
        const southWall = new THREE.Mesh(wallGeometry, material.clone());
        southWall.position.set(0, height / 2, halfSize);
        this.scene.add(southWall);
        
        // East wall
        const eastWall = new THREE.Mesh(wallGeometry, material.clone());
        eastWall.position.set(halfSize, height / 2, 0);
        eastWall.rotation.y = -Math.PI / 2;
        this.scene.add(eastWall);
        
        // West wall
        const westWall = new THREE.Mesh(wallGeometry, material.clone());
        westWall.position.set(-halfSize, height / 2, 0);
        westWall.rotation.y = Math.PI / 2;
        this.scene.add(westWall);
        
        // Add grid lines to walls for visual effect
        this.addGridToWalls(northWall, size, height);
        this.addGridToWalls(southWall, size, height);
        this.addGridToWalls(eastWall, size, height);
        this.addGridToWalls(westWall, size, height);
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
        // Use the billboard manager to create billboards
        this.billboardManager.createBillboards();
    }
    
    // Update the update method to include jukebox
    update(deltaTime) {
        if (this.billboardManager) {
            this.billboardManager.update(deltaTime);
        }
        
        if (this.jukebox) {
            this.jukebox.update(deltaTime);
        }
    }
    
    // Update cleanup method to include jukebox
    cleanup() {
        if (this.billboardManager) {
            this.billboardManager.cleanup();
        }
        
        if (this.jukebox) {
            this.jukebox.cleanup();
        }
    }
}