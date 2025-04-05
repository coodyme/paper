import { UIComponent } from './UIComponent.js';
import { UIStyles } from '../styles/UIStyles.js';

/**
 * Login form component for user authentication
 */
export class LoginForm extends UIComponent {
    constructor(onLogin) {
        super();
        this.onLogin = onLogin;
        this.username = '';
    }
    
    createElement() {
        // Create container
        const loginContainer = document.createElement('div');
        loginContainer.id = 'login-container';
        
        // Apply styles
        Object.assign(loginContainer.style, UIStyles.loginContainer);
        
        // Create logo/title
        const title = document.createElement('h1');
        title.textContent = 'PAPER';
        Object.assign(title.style, UIStyles.loginTitle);
        
        // Create input container
        const inputContainer = document.createElement('div');
        Object.assign(inputContainer.style, UIStyles.loginInputContainer);
        
        // Create username input
        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.placeholder = 'Enter username';
        Object.assign(usernameInput.style, UIStyles.usernameInput);
        
        // Create login button
        const loginButton = document.createElement('button');
        loginButton.textContent = 'ENTER';
        Object.assign(loginButton.style, UIStyles.loginButton);
        
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
        loginContainer.appendChild(title);
        loginContainer.appendChild(inputContainer);
        
        // Focus input after a short delay to ensure DOM is ready
        setTimeout(() => usernameInput.focus(), 100);
        
        return loginContainer;
    }
    
    /**
     * Handle login button click
     */
    handleLogin() {
        if (this.username.trim() && typeof this.onLogin === 'function') {
            this.onLogin(this.username);
        }
    }
}