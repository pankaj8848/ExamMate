// Login Page JavaScript Application

// Global Variables
let verificationId = null;
let recaptchaVerifier = null;

// Wait for Firebase to be available
let firebaseReady = false;

function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebase && window.firebase.auth) {
                firebaseReady = true;
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    await waitForFirebase();
    initializeApp();
    setupEventListeners();
    setupRecaptcha();
});

function initializeApp() {
    console.log('Login Page Initialized! 🚀');
    
    // Check if user is already logged in
    window.firebase.onAuthStateChanged(window.firebase.auth, (user) => {
        if (user) {
            // Redirect to main site or dashboard
            showToast('You are already logged in. Redirecting...', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    });
}

function setupEventListeners() {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Forgot Password Form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Phone Input Validation
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
        phoneInput.addEventListener('input', validatePhoneInput);
    }
    
    // OTP Input Validation
    const otpInput = document.getElementById('otpInput');
    if (otpInput) {
        otpInput.addEventListener('input', validateOTPInput);
    }
}

function setupRecaptcha() {
    // Initialize reCAPTCHA verifier
    try {
        recaptchaVerifier = new window.firebase.RecaptchaVerifier('sendOTPBtn', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
                console.log('reCAPTCHA verified');
            },
            'expired-callback': () => {
                // reCAPTCHA expired, ask user to solve it again
                console.log('reCAPTCHA expired');
                showMessage('Please try again', 'error');
            }
        }, window.firebase.auth);
        
        // Render the reCAPTCHA
        recaptchaVerifier.render().then((widgetId) => {
            console.log('reCAPTCHA widget ID:', widgetId);
        });
        
    } catch (error) {
        console.error('reCAPTCHA setup error:', error);
        showMessage('Failed to initialize security verification', 'error');
    }
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const userCredential = await window.firebase.signInWithEmailAndPassword(window.firebase.auth, email, password);
        const user = userCredential.user;
        
        // Check if user exists in Firestore
        const userDocRef = window.firebase.doc(window.firebase.db, 'users', user.uid);
        const userDoc = await window.firebase.getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Set persistence based on remember me
            const persistence = rememberMe ? window.firebase.browserLocalPersistence : window.firebase.browserSessionPersistence;
            await window.firebase.setPersistence(window.firebase.auth, persistence);
            
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            // Create user document if it doesn't exist
            await window.firebase.setDoc(userDocRef, {
                uid: user.uid,
                name: user.email.split('@')[0],
                email: user.email,
                phone: '',
                plan: 'basic',
                createdAt: window.firebase.serverTimestamp()
            });
            
            showMessage('Welcome! Account created successfully.', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(getErrorMessage(error.code), 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const termsAgreement = document.getElementById('termsAgreement').checked;
    
    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (!validatePhone(phone)) {
        showMessage('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (!termsAgreement) {
        showMessage('Please agree to the Terms & Conditions', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Create user with email and password
        const userCredential = await window.firebase.createUserWithEmailAndPassword(window.firebase.auth, email, password);
        const user = userCredential.user;
        
        // Save user data to Firestore
        const userData = {
            uid: user.uid,
            name: name,
            email: email,
            phone: phone,
            plan: 'basic',
            createdAt: window.firebase.serverTimestamp()
        };
        
        const userDocRef = window.firebase.doc(window.firebase.db, 'users', user.uid);
        await window.firebase.setDoc(userDocRef, userData);
        
        showMessage('Registration successful! Redirecting to login...', 'success');
        setTimeout(() => {
            closeRegisterModal();
            // Auto-fill login form with email
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = password;
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(getErrorMessage(error.code), 'error');
    } finally {
        showLoading(false);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    
    if (!email) {
        showMessage('Please enter your email address', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        await window.firebase.sendPasswordResetEmail(window.firebase.auth, email);
        showMessage('Password reset link sent to your email', 'success');
        setTimeout(() => {
            closeForgotPasswordModal();
        }, 2000);
    } catch (error) {
        console.error('Password reset error:', error);
        showMessage(getErrorMessage(error.code), 'error');
    } finally {
        showLoading(false);
    }
}

// Phone Authentication Functions
async function sendOTP() {
    const phoneInput = document.getElementById('phoneInput');
    const phone = phoneInput.value;
    
    if (!phone) {
        showMessage('Please enter your phone number', 'error');
        return;
    }
    
    if (!validatePhone(phone)) {
        showMessage('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    
    const phoneNumber = '+91' + phone;
    
    showLoading(true);
    
    try {
        const confirmationResult = await window.firebase.signInWithPhoneNumber(window.firebase.auth, phoneNumber, recaptchaVerifier);
        verificationId = confirmationResult.verificationId;
        
        // Show OTP input field
        document.getElementById('otpSection').style.display = 'block';
        document.getElementById('verifyOTPBtn').style.display = 'block';
        
        showMessage('OTP sent to your phone number', 'success');
        
    } catch (error) {
        console.error('OTP sending error:', error);
        showMessage('Failed to send OTP. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function verifyOTP() {
    const otpInput = document.getElementById('otpInput');
    const otp = otpInput.value;
    
    if (!otp || otp.length !== 6) {
        showMessage('Please enter a valid 6-digit OTP', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const credential = window.firebase.PhoneAuthProvider.credential(verificationId, otp);
        const result = await window.firebase.signInWithCredential(window.firebase.auth, credential);
        const user = result.user;
        
        // Check if user exists in Firestore
        const userDocRef = window.firebase.doc(window.firebase.db, 'users', user.uid);
        const userDoc = await window.firebase.getDoc(userDocRef);
        
        if (userDoc.exists()) {
            showMessage('Phone authentication successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            // Create user document for phone authentication
            await window.firebase.setDoc(userDocRef, {
                uid: user.uid,
                name: user.phoneNumber || 'User',
                email: '',
                phone: user.phoneNumber,
                plan: 'basic',
                createdAt: window.firebase.serverTimestamp()
            });
            
            showMessage('Welcome! Account created successfully.', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
        
    } catch (error) {
        console.error('OTP verification error:', error);
        showMessage('Invalid OTP. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Utility Functions
function validatePhoneInput(e) {
    const input = e.target;
    const value = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = value;
}

function validateOTPInput(e) {
    const input = e.target;
    const value = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = value;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
}

function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/email-already-in-use':
            return 'Email is already registered';
        case 'auth/weak-password':
            return 'Password is too weak';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection';
        default:
            return 'An error occurred. Please try again';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Modal Functions
function showRegisterForm() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showForgotPassword() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// UI Helper Functions
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
    
    // Disable buttons during loading
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.disabled = show;
        if (show) {
            btn.style.opacity = '0.7';
        } else {
            btn.style.opacity = '1';
        }
    });
}

function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    // Clear existing messages
    container.innerHTML = '';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    container.appendChild(messageDiv);
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Export functions for global access
window.showRegisterForm = showRegisterForm;
window.closeRegisterModal = closeRegisterModal;
window.showForgotPassword = showForgotPassword;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.showModal = showModal;
window.closeModal = closeModal;
window.togglePassword = togglePassword;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
