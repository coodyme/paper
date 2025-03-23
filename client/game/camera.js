import * as THREE from 'three';

export class ThirdPersonCamera {
    constructor(camera) {
        this.camera = camera;
        this.target = null;
        this.followOffset = new THREE.Vector3(0, 2.5, -5); // Height and distance behind
        this.followPosition = new THREE.Vector3();
        this.lerpFactor = 0.05; // Camera smoothness
    }
    
    /**
     * Set the target the camera should follow
     * @param {THREE.Object3D} target - The object to follow (usually player)
     */
    setTarget(target) {
        this.target = target;
    }
    
    /**
     * Set camera follow offset relative to target
     * @param {number} x - X offset
     * @param {number} y - Y offset (height)
     * @param {number} z - Z offset (distance behind)
     */
    setOffset(x, y, z) {
        this.followOffset.set(x, y, z);
    }
    
    /**
     * Set camera smoothness (lower = smoother)
     * @param {number} factor - Lerp factor between 0 and 1
     */
    setSmoothness(factor) {
        this.lerpFactor = Math.max(0.01, Math.min(1, factor));
    }
    
    /**
     * Update camera position to follow target
     */
    update() {
        if (!this.target) return;
        
        // Calculate target world matrix
        const targetPosition = new THREE.Vector3();
        const targetQuaternion = new THREE.Quaternion();
        this.target.getWorldPosition(targetPosition);
        this.target.getWorldQuaternion(targetQuaternion);
        
        // Calculate camera position in target's local space
        const offsetVector = this.followOffset.clone();
        
        // Convert to world space by applying target's rotation
        offsetVector.applyQuaternion(targetQuaternion);
        
        // Calculate final world position
        this.followPosition.copy(targetPosition).add(offsetVector);
        
        // Smoothly move camera to follow position
        this.camera.position.lerp(this.followPosition, this.lerpFactor);
        
        // Make camera look at target
        this.camera.lookAt(targetPosition);
    }
}