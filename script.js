// ExamMate & NotesMaker JavaScript Application

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
const storage = firebase.storage();

// Global State
let currentUser = null;
let currentPlan = 'basic';
let uploadedFiles = [];
let notesData = [];
let chatMessages = [];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadNotes();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    console.log('ExamMate & NotesMaker initialized! 🚀');
    
    // Initialize background settings
    initBackgroundSettings();
    
    // Initialize with empty notes data - no dummy data
    notesData = [];
    
    renderNotes();
}

// Background Customization Functions
function initBackgroundSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('backgroundSettings') || 'null');
    if (savedSettings) {
        applyBackgroundToWebsite(savedSettings);
    }
}

function applyBackgroundToWebsite(settings) {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    if (settings.type === 'gradient') {
        heroSection.style.background = `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.secondaryColor} 100%)`;
        // Update CSS variables
        document.documentElement.style.setProperty('--hero-bg-color', settings.primaryColor);
        document.documentElement.style.setProperty('--hero-bg-secondary', settings.secondaryColor);
    } else if (settings.type === 'image' && settings.imageUrl) {
        heroSection.style.background = `linear-gradient(135deg, ${settings.primaryColor || '#667eea'} 0%, ${settings.secondaryColor || '#764ba2'} 100%), url(${settings.imageUrl}) center/cover no-repeat`;
        heroSection.style.opacity = settings.imageOpacity || '1';
    } else if (settings.type === 'pattern') {
        // Apply pattern background
        let patternSVG = '';
        if (settings.patternType === 'dots') {
            patternSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="2" fill="${settings.patternColor}" opacity="${settings.patternOpacity}"/></svg>`;
        } else if (settings.patternType === 'lines') {
            patternSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><line x1="0" y1="0" x2="20" y2="20" stroke="${settings.patternColor}" stroke-width="2" opacity="${settings.patternOpacity}"/></svg>`;
        } else if (settings.patternType === 'waves') {
            patternSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M0,10 Q5,5 10,10 T20,10" stroke="${settings.patternColor}" stroke-width="2" fill="none" opacity="${settings.patternOpacity}"/></svg>`;
        }
        
        heroSection.style.background = `linear-gradient(135deg, ${settings.primaryColor || '#667eea'} 0%, ${settings.secondaryColor || '#764ba2'} 100%), url('data:image/svg+xml;utf8,${encodeURIComponent(patternSVG)}')`;
    }
}

function setupEventListeners() {
    // Form Submissions
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    // File Upload Previews
    setupFilePreviews();
    
    // Admin Chat
    const adminChatInput = document.getElementById('adminChatInput');
    if (adminChatInput) {
        adminChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendAdminMessage();
            }
        });
    }
    
    // PDF Protection
    setupPDFProtection();
}

// Firebase Authentication System - REMOVED FOR PUBLIC ACCESS
// The website now works without authentication for all users

function checkAuthStatus() {
    // No authentication required - website works for all users
    updateUIAfterAuth();
}

function updateUIAfterAuth() {
    const loginBtn = document.querySelector('.btn-primary[onclick*="openLoginModal"]');
    if (loginBtn) {
        loginBtn.textContent = 'Login/Register';
        loginBtn.onclick = openLoginModal;
    }
    renderNotes();
}

// File Upload System
function setupFilePreviews() {
    const questionFiles = document.getElementById('questionFiles');
    const imageFiles = document.getElementById('imageFiles');
    const videoFiles = document.getElementById('videoFiles');
    
    if (questionFiles) {
        questionFiles.addEventListener('change', (e) => {
            previewFiles(e.target.files, 'filePreview', 'file');
        });
    }
    
    if (imageFiles) {
        imageFiles.addEventListener('change', (e) => {
            previewFiles(e.target.files, 'imagePreview', 'image');
        });
    }
    
    if (videoFiles) {
        videoFiles.addEventListener('change', (e) => {
            previewFiles(e.target.files, 'videoPreview', 'video');
        });
    }
}

function previewFiles(files, containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    Array.from(files).forEach((file, index) => {
        const item = document.createElement('div');
        item.className = type === 'image' ? 'image-item' : 'file-item';
        
        if (type === 'image') {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            item.appendChild(img);
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.style.maxWidth = '200px';
            item.appendChild(video);
        }
        
        const name = document.createElement('span');
        name.textContent = file.name;
        item.appendChild(name);
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => {
            item.remove();
            // Remove from file input
            const dt = new DataTransfer();
            const input = document.getElementById(type === 'image' ? 'imageFiles' : type === 'video' ? 'videoFiles' : 'questionFiles');
            const { files: inputFiles } = input;
            for (let i = 0; i < inputFiles.length; i++) {
                const f = inputFiles[i];
                if (f !== file) dt.items.add(f);
            }
            input.files = dt.files;
        };
        item.appendChild(removeBtn);
        
        container.appendChild(item);
    });
}

function handleUpload(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const studentName = formData.get('studentName');
    const studentEmail = formData.get('studentEmail');
    const examName = formData.get('examName');
    const syllabus = formData.get('syllabus');
    const questionFiles = formData.getAll('questionFiles');
    const imageFiles = formData.getAll('imageFiles');
    const videoFiles = formData.getAll('videoFiles');
    
    // Simulate upload
    const uploadData = {
        id: Date.now(),
        studentName,
        studentEmail,
        examName,
        syllabus,
        files: {
            questions: questionFiles,
            images: imageFiles,
            videos: videoFiles
        },
        status: 'uploaded',
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    const uploads = JSON.parse(localStorage.getItem('uploads') || '[]');
    uploads.push(uploadData);
    localStorage.setItem('uploads', JSON.stringify(uploads));
    
    // Reset form
    e.target.reset();
    document.getElementById('filePreview').innerHTML = '';
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('videoPreview').innerHTML = '';
    
    showToast('Upload successful! Our team will process your materials.', 'success');
}

// Payment System
function initiatePayment(plan) {
    // Simulate payment gateway integration
    const paymentData = {
        amount: plan === 'basic' ? 499 : plan === 'standard' ? 999 : 1999,
        currency: 'INR',
        plan: plan,
        studentId: 'anonymous',
        timestamp: new Date().toISOString()
    };
    
    // Simulate payment processing
    setTimeout(() => {
        showToast(`Payment successful! You now have ${plan} access.`, 'success');
        
        // Simulate payment gateway modal
        showPaymentModal(paymentData);
    }, 1000);
}

function showPaymentModal(paymentData) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Payment Successful</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-check-circle" style="font-size: 4rem; color: #10b981; margin-bottom: 1rem;"></i>
                    <h3 style="color: #10b981;">Payment Successful!</h3>
                    <p>Amount: ₹${paymentData.amount}</p>
                    <p>Plan: ${paymentData.plan.toUpperCase()}</p>
                    <p>Transaction ID: ${Date.now()}</p>
                    <div style="margin-top: 2rem;">
                        <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Admin Chat System
function openAdminChat() {
    // Only allow admin access (simulated)
    const adminModal = document.getElementById('adminChatModal');
    if (adminModal) {
        adminModal.style.display = 'block';
    }
}

function closeAdminChat() {
    const adminModal = document.getElementById('adminChatModal');
    if (adminModal) {
        adminModal.style.display = 'none';
    }
}

function sendAdminMessage() {
    const input = document.getElementById('adminChatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatContainer = document.getElementById('adminChatContainer');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message user';
    messageElement.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="message-time">User • ${new Date().toLocaleTimeString()}</div>
    `;
    
    chatContainer.appendChild(messageElement);
    input.value = '';
    
    // Auto-scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Simulate admin response
    setTimeout(() => {
        const responseElement = document.createElement('div');
        responseElement.className = 'chat-message admin';
        responseElement.innerHTML = `
            <div class="message-content">Thank you for your message. Our team will get back to you shortly.</div>
            <div class="message-time">Admin • ${new Date().toLocaleTimeString()}</div>
        `;
        chatContainer.appendChild(responseElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 1000);
}

// WhatsApp Integration
function openWhatsAppChat() {
    const message = "Hello! I'm interested in ExamMate & NotesMaker services.";
    const whatsappUrl = `https://wa.me/917827587477?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Notes Management
function loadNotes() {
    // Load from localStorage or use default data
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        notesData = JSON.parse(savedNotes);
    }
    renderNotes();
}

function renderNotes() {
    const container = document.getElementById('notesGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    notesData.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        
        const statusClass = note.status === 'available' ? 'status-available' : 
                           note.status === 'pending' ? 'status-pending' : 'status-locked';
        
        noteCard.innerHTML = `
            <div class="note-header">
                <h3 class="note-title">${note.title}</h3>
                <div class="note-meta">
                    <span><i class="fas fa-graduation-cap"></i> ${note.exam}</span>
                    <span><i class="fas fa-book"></i> ${note.subject}</span>
                    <span><i class="fas fa-file-alt"></i> ${note.pages} pages</span>
                </div>
            </div>
            <div class="note-body">
                <span class="note-status ${statusClass}">${note.status.toUpperCase()}</span>
                <p class="note-description">${note.description}</p>
                <div class="note-actions">
                    ${note.status === 'available' ? `
                        <button class="btn btn-primary" onclick="viewNote(${note.id})">
                            Preview PDF
                        </button>
                        ${note.hardCopyAvailable ? `<button class="btn btn-secondary" onclick="orderHardCopy(${note.id})">Order Hard Copy</button>` : ''}
                    ` : `
                        <button class="btn btn-secondary" onclick="initiatePayment('${note.status === 'pending' ? 'standard' : 'basic'}')">
                            ${note.status === 'pending' ? 'Available with Payment' : 'Unlock with Payment'}
                        </button>
                    `}
                    ${note.videoSolutions ? `<button class="btn btn-secondary" onclick="viewVideoSolutions(${note.id})">Video Solutions</button>` : ''}
                </div>
            </div>
        `;
        
        container.appendChild(noteCard);
    });
}

function viewNote(noteId) {
    const note = notesData.find(n => n.id === noteId);
    if (!note) return;
    
    if (note.status !== 'available') {
        showToast('This note is not available yet.', 'error');
        return;
    }
    
    // Show PDF preview for all users
    showToast('Opening PDF preview...', 'success');
    showPDFPreview(note, note.pages);
}

function showPDFPreview(note, pages) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 80vh; overflow: auto;">
            <div class="modal-header">
                <h3>PDF Preview - ${note.title}</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="pdf-viewer no-screenshot">
                    <div class="pdf-container">
                        <div style="padding: 20px; text-align: center; background: #f8fafc;">
                            <h3>Preview Mode</h3>
                            <p>Showing first ${pages} pages only</p>
                            <div class="pdf-controls">
                                <button onclick="this.closest('.modal').remove()">Close</button>
                                <button onclick="initiatePayment('standard')">Upgrade for Full Access</button>
                            </div>
                        </div>
                        <div style="padding: 20px;">
                            <p style="color: #64748b; text-align: center;">
                                <i class="fas fa-file-pdf" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i><br>
                                PDF Preview Content<br>
                                <small>Page 1-${pages} of ${note.pages}</small>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showPDFViewer(note) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 80vh; overflow: auto;">
            <div class="modal-header">
                <h3>PDF Viewer - ${note.title}</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="pdf-viewer no-screenshot">
                    <div class="pdf-container">
                        <div class="pdf-controls">
                            <button onclick="downloadPDF(${note.id})"><i class="fas fa-download"></i> Download</button>
                            <button onclick="printPDF(${note.id})"><i class="fas fa-print"></i> Print</button>
                            <button onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i> Close</button>
                        </div>
                        <div style="padding: 20px;">
                            <p style="color: #64748b; text-align: center;">
                                <i class="fas fa-file-pdf" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i><br>
                                Complete PDF Content<br>
                                <small>${note.pages} pages</small>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function downloadPDF(noteId) {
    showToast('Downloading PDF file...', 'success');
    // Simulate download
    setTimeout(() => {
        showToast('PDF downloaded successfully!', 'success');
    }, 1000);
}

function printPDF(noteId) {
    window.print();
}

function orderHardCopy(noteId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Order Hard Copy</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #2563eb; margin-bottom: 1rem;"></i>
                    <h3>Hard Copy Order</h3>
                    <p>Delivery Address: Not set</p>
                    <p>Delivery Charge: ₹50</p>
                    <div style="margin-top: 2rem;">
                        <button class="btn btn-primary" onclick="processHardCopyOrder(${noteId})">Confirm Order</button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function processHardCopyOrder(noteId) {
    showToast('Hard copy order placed successfully!', 'success');
    this.closest('.modal').remove();
}

function viewVideoSolutions(noteId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Video Solutions</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div style="padding: 2rem; text-align: center;">
                    <i class="fas fa-video" style="font-size: 3rem; color: #2563eb; margin-bottom: 1rem;"></i>
                    <h3>Video Solutions Available</h3>
                    <p>Access detailed video explanations for complex questions.</p>
                    <div style="margin-top: 2rem;">
                        <button class="btn btn-primary" onclick="openVideoPlayer()">Watch Videos</button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function openVideoPlayer() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Video Player</h3>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div style="padding: 2rem;">
                    <video controls style="width: 100%; border-radius: 8px;">
                        <source src="#" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div style="margin-top: 1rem; text-align: center;">
                        <p>Video solutions for the selected notes.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// PDF Protection System
function setupPDFProtection() {
    // Disable right-click
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.no-screenshot')) {
            e.preventDefault();
            showToast('Right-click is disabled for security.', 'info');
        }
    });
    
    // Disable keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u')) {
            e.preventDefault();
            showToast('This action is not allowed.', 'info');
        }
    });
    
    // Watermark protection
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('no-screenshot')) {
                        addWatermark(node);
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

function addWatermark(element) {
    const watermark = document.createElement('div');
    watermark.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent);
        background-size: 50px 50px;
        pointer-events: none;
        z-index: 999;
        opacity: 0.1;
    `;
    watermark.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2rem; color: #000; opacity: 0.1; text-align: center;">
            ExamMate & NotesMaker<br>
            <small>Protected Content</small>
        </div>
    `;
    element.style.position = 'relative';
    element.appendChild(watermark);
}

// UI Helper Functions
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showTab(tabName) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.querySelector('.tab-btn[onclick*="login"]');
    const registerBtn = document.querySelector('.tab-btn[onclick*="register"]');
    
    if (tabName === 'login') {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        loginBtn.classList.remove('active');
        registerBtn.classList.add('active');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#64748b'};
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 3000;
        transform: translateY(100px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Navigation and Scroll Effects
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Admin Panel Integration
function openAdminPanel() {
    window.open('admin.html', '_blank');
}

// Legal Modal Functions
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
window.openWhatsAppChat = openWhatsAppChat;
window.openAdminChat = openAdminChat;
window.closeAdminChat = closeAdminChat;
window.sendAdminMessage = sendAdminMessage;
window.initiatePayment = initiatePayment;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.showTab = showTab;
window.viewNote = viewNote;
window.orderHardCopy = orderHardCopy;
window.viewVideoSolutions = viewVideoSolutions;
window.openAdminPanel = openAdminPanel;
window.showModal = showModal;
window.closeModal = closeModal;
window.checkAuthAndRedirect = checkAuthAndRedirect;
