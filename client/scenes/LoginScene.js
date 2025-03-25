import { Scene } from '../utils/SceneManager.js';

export class LoginScene extends Scene {
    constructor(sceneManager, params = {}) {
        super(sceneManager);
        this.username = '';
        this.loginContainer = null;
    }
    
    async init() {
        // Create login UI
        this.createLoginUI();
    }
    
    createLoginUI() {
        // Create container
        this.loginContainer = document.createElement('div');
        this.loginContainer.style.position = 'fixed';
        this.loginContainer.style.top = '0';
        this.loginContainer.style.left = '0';
        this.loginContainer.style.width = '100%';
        this.loginContainer.style.height = '100%';
        this.loginContainer.style.display = 'flex';
        this.loginContainer.style.flexDirection = 'column';
        this.loginContainer.style.justifyContent = 'center';
        this.loginContainer.style.alignItems = 'center';
        this.loginContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.loginContainer.style.zIndex = '1000';
        
        // Create logo/title
        const title = document.createElement('h1');
        title.textContent = 'PAPER';
        title.style.color = '#00ffff';
        title.style.fontSize = '4rem';
        title.style.fontFamily = 'Arial, sans-serif';
        title.style.textShadow = '0 0 10px #00ffff';
        title.style.marginBottom = '2rem';
        
        // Create input container
        const inputContainer = document.createElement('div');
        inputContainer.style.width = '300px';
        inputContainer.style.padding = '1rem';
        inputContainer.style.backgroundColor = 'rgba(30, 30, 30, 0.7)';
        inputContainer.style.borderRadius = '5px';
        inputContainer.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.5)';
        
        // Create username input
        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.placeholder = 'Enter username';
        usernameInput.style.width = '100%';
        usernameInput.style.padding = '10px';
        usernameInput.style.margin = '10px 0';
        usernameInput.style.boxSizing = 'border-box';
        usernameInput.style.border = '2px solid #00ffff';
        usernameInput.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        usernameInput.style.color = 'white';
        usernameInput.style.outline = 'none';
        usernameInput.style.fontSize = '16px';
        
        // Create login button
        const loginButton = document.createElement('button');
        loginButton.textContent = 'ENTER';
        loginButton.style.width = '100%';
        loginButton.style.padding = '10px';
        loginButton.style.margin = '10px 0';
        loginButton.style.border = 'none';
        loginButton.style.backgroundColor = '#00ffff';
        loginButton.style.color = 'black';
        loginButton.style.fontSize = '16px';
        loginButton.style.fontWeight = 'bold';
        loginButton.style.cursor = 'pointer';
        loginButton.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
        
        // Add event listeners
        usernameInput.addEventListener('input', (e) => {
            this.username = e.target.value;
        });
        
        loginButton.addEventListener('click', () => this.handleLogin());
        usernameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        
        // Append elements
        inputContainer.appendChild(usernameInput);
        inputContainer.appendChild(loginButton);
        
        this.loginContainer.appendChild(title);
        this.loginContainer.appendChild(inputContainer);
        
        // Add to DOM
        this.sceneManager.container.appendChild(this.loginContainer);
        
        // Focus input
        setTimeout(() => usernameInput.focus(), 100);
    }
    
    handleLogin() {
        if (this.username.trim().length < 2) {
            alert('Please enter a username (at least 2 characters)');
            return;
        }
        
        // Transition to game scene and pass username
        this.sceneManager.changeScene('game', { username: this.username });
    }
    
    cleanup() {
        if (this.loginContainer && this.loginContainer.parentNode) {
            this.loginContainer.parentNode.removeChild(this.loginContainer);
        }
    }
}