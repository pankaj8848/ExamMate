// Login / Register JavaScript with Redirect Flow

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

// Global State
let currentUser = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    setupEventListeners();
});

// Authentication State Check
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            // User is signed in, redirect to upload page
            redirectToUploadPage();
        }
    });
}

// Event Listeners
function setupEventListeners() {
    // Form Submissions
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showTab(btn.getAttribute('onclick').match(/'([^']+)'/)[1]);
        });
    });
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    showLoading(true);
    
    try {
        // Set persistence
        const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        await auth.setPersistence(persistence);
        
        // Sign in
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check if user exists in database
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create user document
            await db.collection('users').doc(user.uid).set({
                name: user.email.split('@')[0],
                email: user.email,
                phone: user.phoneNumber || '',
                role: 'student',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Update last login
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        showMessage('Login successful! Redirecting...', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!agreeTerms) {
        showMessage('Please agree to the Terms & Conditions.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Create user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update display name
        await user.updateProfile({
            displayName: name
        });
        
        // Save user to database
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            phone: phone,
            role: 'student',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('Registration successful! Redirecting to login...', 'success');
        setTimeout(() => {
            showTab('login');
            // Auto-fill login form
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = password;
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle Forgot Password
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    showLoading(true);
    
    try {
        await auth.sendPasswordResetEmail(email);
        showMessage('Password reset email sent! Please check your inbox.', 'success');
        setTimeout(() => {
            showTab('login');
        }, 3000);
    } catch (error) {
        console.error('Password reset error:', error);
        showMessage(error.message || 'Failed to send reset email. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Redirect to Upload Page
function redirectToUploadPage() {
    // Get the redirect URL from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    
    if (redirectUrl) {
        // Decode the URL to handle special characters
        const decodedUrl = decodeURIComponent(redirectUrl);
        window.location.href = decodedUrl;
    } else {
        // Default redirect to question upload
        window.location.href = 'services/question-upload.html';
    }
}

// Tab Switching
function showTab(tabName) {
    // Hide all forms
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => form.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected form
    if (tabName === 'login') {
        document.getElementById('loginForm').classList.add('active');
        document.querySelector('.auth-tabs .tab-btn:first-child').classList.add('active');
    } else if (tabName === 'register') {
        document.getElementById('registerForm').classList.add('active');
        document.querySelector('.auth-tabs .tab-btn:last-child').classList.add('active');
    }
    
    // Hide error messages
    hideError();
}

// Show Forgot Password
function showForgotPassword() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('forgotPasswordForm').style.display = 'block';
    document.querySelector('.auth-tabs .tab-btn').classList.remove('active');
}

// Utility Functions
function showLoading(show) {
    const loadingSpinner = document.querySelector('.loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
}

function showMessage(message, type) {
    const errorDiv = document.getElementById('authError');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.style.display = 'flex';
        errorDiv.style.borderColor = type === 'success' ? '#10b981' : '#ef4444';
        errorDiv.style.backgroundColor = type === 'success' ? '#dcfce7' : '#fee2e2';
        errorDiv.style.color = type === 'success' ? '#166534' : '#991b1b';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                hideError();
            }, 2000);
        }
    }
}

function hideError() {
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Export functions for global access
window.showTab = showTab;
window.showForgotPassword = showForgotPassword;
