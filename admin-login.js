// Admin Login JavaScript

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBqj_5NpbrxeVw7daBiuikVvzfUW4GpQ8s",
    authDomain: "exammate-and-notesmaker.firebaseapp.com",
    projectId: "exammate-and-notesmaker",
    storageBucket: "exammate-and-notesmaker.firebasestorage.app",
    messagingSenderId: "51513185604",
    appId: "1:51513185604:web:3440a6ee5039d315ad3311",
    measurementId: "G-EW7HYL6JJP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Admin credentials (In production, use proper authentication)
const ADMIN_CREDENTIALS = {
    username: "Pankaj kumar",
    password: "pk88488848"
};

// DOM Elements
const adminLoginForm = document.getElementById('adminLoginForm');
const adminUsername = document.getElementById('adminUsername');
const adminPassword = document.getElementById('adminPassword');
const loginError = document.getElementById('loginError');
const errorMessage = document.getElementById('errorMessage');
const loginBtn = document.getElementById('adminLoginForm').querySelector('.btn-login');

// Check if admin is already logged in
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
});

// Admin Login
adminLoginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    loginUser();
});

async function loginUser() {
    const username = adminUsername.value.trim();
    const password = adminPassword.value.trim();
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Check credentials
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            // Store admin session
            const adminSession = {
                username: username,
                loginTime: new Date().toISOString(),
                role: 'admin'
            };
            
            localStorage.setItem('adminSession', JSON.stringify(adminSession));
            
            // Redirect to dashboard
            showSuccessMessage('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1500);
            
        } else {
            showError('Invalid admin credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Login failed. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
        // Admin is already logged in, redirect to dashboard
        window.location.href = 'admin-dashboard.html';
    }
}

function setLoadingState(loading) {
    if (loading) {
        loginBtn.innerHTML = '<span class="loading-spinner"></span> Signing In...';
        loginBtn.disabled = true;
        adminUsername.disabled = true;
        adminPassword.disabled = true;
    } else {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        loginBtn.disabled = false;
        adminUsername.disabled = false;
        adminPassword.disabled = false;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    loginError.style.display = 'flex';
    loginBtn.classList.add('login-error-state');
    
    setTimeout(() => {
        loginError.style.display = 'none';
        loginBtn.classList.remove('login-error-state');
    }, 3000);
}

function showSuccessMessage(message) {
    errorMessage.textContent = message;
    loginError.style.display = 'flex';
    loginError.style.background = '#dcfce7';
    loginError.style.color = '#166534';
    loginError.style.borderColor = '#bbf7d0';
    loginError.querySelector('i').style.color = '#166534';
}

// Form validation
adminUsername.addEventListener('input', validateForm);
adminPassword.addEventListener('input', validateForm);

function validateForm() {
    const username = adminUsername.value.trim();
    const password = adminPassword.value.trim();
    
    if (username && password) {
        loginBtn.style.opacity = '1';
        loginBtn.style.cursor = 'pointer';
    } else {
        loginBtn.style.opacity = '0.5';
        loginBtn.style.cursor = 'not-allowed';
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !loginBtn.disabled) {
        loginUser();
    }
});

// Security measures
adminPassword.addEventListener('paste', function(e) {
    e.preventDefault();
    showError('Paste is not allowed for security reasons');
});

// Auto-hide error after 5 seconds
setInterval(() => {
    if (loginError.style.display === 'flex') {
        loginError.style.display = 'none';
    }
}, 5000);

// Accessibility improvements
document.addEventListener('focusin', function(e) {
    if (e.target.tagName === 'INPUT') {
        e.target.parentElement.classList.add('focused');
    }
});

document.addEventListener('focusout', function(e) {
    if (e.target.tagName === 'INPUT') {
        e.target.parentElement.classList.remove('focused');
    }
});

// Password visibility toggle
const passwordGroup = adminPassword.parentElement;
const togglePassword = document.createElement('button');
togglePassword.type = 'button';
togglePassword.className = 'password-toggle';
togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
togglePassword.onclick = togglePasswordVisibility;

passwordGroup.style.position = 'relative';
togglePassword.style.position = 'absolute';
togglePassword.style.right = '10px';
togglePassword.style.top = '50%';
togglePassword.style.transform = 'translateY(-50%)';
togglePassword.style.background = 'none';
togglePassword.style.border = 'none';
togglePassword.style.cursor = 'pointer';
togglePassword.style.color = '#64748b';
togglePassword.style.padding = '5px';

passwordGroup.appendChild(togglePassword);

function togglePasswordVisibility() {
    const type = adminPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    adminPassword.setAttribute('type', type);
    togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
}

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function checkSessionTimeout() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
        const session = JSON.parse(adminSession);
        const loginTime = new Date(session.loginTime).getTime();
        const currentTime = Date.now();
        
        if (currentTime - loginTime > SESSION_TIMEOUT) {
            logoutAdmin();
            alert('Session expired. Please login again.');
        }
    }
}

// Check session timeout every minute
setInterval(checkSessionTimeout, 60000);

function logoutAdmin() {
    localStorage.removeItem('adminSession');
    window.location.href = 'admin-login.html';
}

// Export functions for global access
window.logoutAdmin = logoutAdmin;
