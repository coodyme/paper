/**
 * Manages user roles and permissions within the application
 */
export class RoleManager {
    constructor() {
        this.roles = {
            PLAYER: 'player',
            ADMIN: 'admin'
        };
        this.currentRole = this.roles.PLAYER;
    }
    
    /**
     * Set user role based on username
     * @param {string} username - The username to evaluate
     * @returns {string} - The determined role
     */
    setRoleFromUsername(username) {
        if (username && username.toLowerCase() === 'admin') {
            this.currentRole = this.roles.ADMIN;
            console.log('Admin role granted');
        } else {
            this.currentRole = this.roles.PLAYER;
        }
        return this.currentRole;
    }
    
    /**
     * Check if current user has admin role
     * @returns {boolean} - True if user is admin
     */
    isAdmin() {
        return this.currentRole === this.roles.ADMIN;
    }
    
    /**
     * Get current user role
     * @returns {string} - Current role
     */
    getRole() {
        return this.currentRole;
    }
}

// Create singleton instance
const roleManager = new RoleManager();
export default roleManager;