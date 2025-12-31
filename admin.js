// Admin Panel JavaScript Application

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
let adminUser = null;
let currentSection = 'dashboard';
let usersData = [];
let notesData = [];
let uploadsData = [];
let paymentsData = [];
let chatMessages = [];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupEventListeners();
});

function checkAdminAuth() {
    const savedAdmin = localStorage.getItem('adminUser');
    if (savedAdmin) {
        adminUser = JSON.parse(savedAdmin);
        showDashboard();
    } else {
        showLoginModal();
    }
}

function setupEventListeners() {
    // Admin Login Form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Form Submissions
    const adminInfoForm = document.getElementById('adminInfoForm');
    if (adminInfoForm) {
        adminInfoForm.addEventListener('submit', handleAdminInfoUpdate);
    }
    
    const heroForm = document.getElementById('heroForm');
    if (heroForm) {
        heroForm.addEventListener('submit', handleHeroUpdate);
    }
    
    const statsForm = document.getElementById('statsForm');
    if (statsForm) {
        statsForm.addEventListener('submit', handleStatsUpdate);
    }
    
    const noteForm = document.getElementById('noteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', handleNoteSubmit);
    }
    
    // Background Customization Form
    const backgroundForm = document.getElementById('backgroundForm');
    if (backgroundForm) {
        backgroundForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyBackground();
        });
    }
    
    // Background form inputs
    const backgroundType = document.getElementById('backgroundType');
    if (backgroundType) {
        backgroundType.addEventListener('change', toggleBackgroundOptions);
    }
    
    const primaryColor = document.getElementById('primaryColor');
    if (primaryColor) {
        primaryColor.addEventListener('input', updateBackgroundPreview);
    }
    
    const secondaryColor = document.getElementById('secondaryColor');
    if (secondaryColor) {
        secondaryColor.addEventListener('input', updateBackgroundPreview);
    }
    
    const imageOpacity = document.getElementById('imageOpacity');
    if (imageOpacity) {
        imageOpacity.addEventListener('input', updateBackgroundPreview);
    }
    
    const patternType = document.getElementById('patternType');
    if (patternType) {
        patternType.addEventListener('change', updateBackgroundPreview);
    }
    
    const patternColor = document.getElementById('patternColor');
    if (patternColor) {
        patternColor.addEventListener('input', updateBackgroundPreview);
    }
    
    const patternOpacity = document.getElementById('patternOpacity');
    if (patternOpacity) {
        patternOpacity.addEventListener('input', updateBackgroundPreview);
    }
    
    // Chat Input
    const adminChatInput = document.getElementById('adminChatInput');
    if (adminChatInput) {
        adminChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendAdminMessage();
            }
        });
    }
    
    // Initialize background settings
    initBackgroundSettings();
    
    // Search and Filter Functions
    setupSearchAndFilters();
}

// Authentication System
function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // Admin credentials check
    if (username === 'Pankaj Kumar' && password === 'pk88488848') {
        adminUser = {
            username: username,
            name: 'Pankaj Kumar',
            email: 'pkh99314930@gmail.com',
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('adminUser', JSON.stringify(adminUser));
        closeLoginModal();
        showDashboard();
        showToast('Admin login successful!', 'success');
    } else {
        showToast('Invalid admin credentials', 'error');
    }
}

function logoutAdmin() {
    adminUser = null;
    localStorage.removeItem('adminUser');
    showLoginModal();
    showToast('Logged out successfully', 'success');
}

function showLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    const dashboard = document.getElementById('adminDashboard');
    if (modal && dashboard) {
        modal.style.display = 'block';
        dashboard.style.display = 'none';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showDashboard() {
    const modal = document.getElementById('adminLoginModal');
    const dashboard = document.getElementById('adminDashboard');
    if (modal && dashboard) {
        modal.style.display = 'none';
        dashboard.style.display = 'flex';
    }
    loadInitialData();
    showSection('dashboard');
}

// Data Loading and Management
function loadInitialData() {
    // Load data from localStorage or use defaults
    usersData = JSON.parse(localStorage.getItem('users') || '[]');
    notesData = JSON.parse(localStorage.getItem('notes') || '[]');
    uploadsData = JSON.parse(localStorage.getItem('uploads') || '[]');
    paymentsData = JSON.parse(localStorage.getItem('payments') || '[]');
    chatMessages = JSON.parse(localStorage.getItem('adminChatMessages') || '[]');
    
    // Initialize with sample data if empty
    if (usersData.length === 0) {
        initializeSampleData();
    }
    
    updateDashboardStats();
    renderUsersTable();
    renderNotesTable();
    renderUploadsTable();
    renderPaymentsTable();
    renderChatMessages();
    renderPricingPlans();
}

function initializeSampleData() {
    // Initialize with empty arrays - no dummy data
    usersData = [];
    notesData = [];
    uploadsData = [];
    paymentsData = [];
    
    // Save empty arrays to localStorage
    localStorage.setItem('users', JSON.stringify(usersData));
    localStorage.setItem('notes', JSON.stringify(notesData));
    localStorage.setItem('uploads', JSON.stringify(uploadsData));
    localStorage.setItem('payments', JSON.stringify(paymentsData));
}

// Dashboard Functions
function updateDashboardStats() {
    document.getElementById('totalUsers').textContent = usersData.length;
    document.getElementById('totalNotes').textContent = notesData.length;
    document.getElementById('totalUploads').textContent = uploadsData.length;
    
    const totalRevenue = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue}`;
    
    // Update today's and this month's revenue
    const today = new Date();
    const todayRevenue = paymentsData
        .filter(p => new Date(p.timestamp).toDateString() === today.toDateString())
        .reduce((sum, p) => sum + p.amount, 0);
    
    const thisMonthRevenue = paymentsData
        .filter(p => {
            const date = new Date(p.timestamp);
            return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        })
        .reduce((sum, p) => sum + p.amount, 0);
    
    document.getElementById('todayRevenue').textContent = `₹${todayRevenue}`;
    document.getElementById('monthRevenue').textContent = `₹${thisMonthRevenue}`;
    document.getElementById('totalTransactions').textContent = paymentsData.length;
    
    renderRecentActivity();
}

function renderRecentActivity() {
    const container = document.getElementById('recentActivity');
    container.innerHTML = '';
    
    const activities = [];
    
    // Add user registrations
    usersData.forEach(user => {
        activities.push({
            type: 'user',
            icon: 'fas fa-user-plus',
            text: `${user.name} registered for ${user.plan} plan`,
            time: user.joinDate
        });
    });
    
    // Add payments
    paymentsData.forEach(payment => {
        activities.push({
            type: 'payment',
            icon: 'fas fa-credit-card',
            text: `Payment of ₹${payment.amount} received from ${payment.userEmail}`,
            time: payment.timestamp
        });
    });
    
    // Add uploads
    uploadsData.forEach(upload => {
        activities.push({
            type: 'upload',
            icon: 'fas fa-upload',
            text: `${upload.studentName} uploaded materials for ${upload.examName}`,
            time: upload.timestamp
        });
    });
    
    // Sort by time
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // Show last 10 activities
    activities.slice(0, 10).forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div>${activity.text}</div>
                <div class="activity-time">${new Date(activity.time).toLocaleString()}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Section Management
function showSection(sectionName) {
    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`.sidebar-nav a[href="#${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Show/hide sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    currentSection = sectionName;
}

// User Management
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    usersData.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge plan-${user.plan}">${user.plan.toUpperCase()}</span></td>
            <td><span class="badge status-${user.status}">${user.status.toUpperCase()}</span></td>
            <td>${user.joinDate}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const filteredUsers = usersData.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.plan.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge plan-${user.plan}">${user.plan.toUpperCase()}</span></td>
            <td><span class="badge status-${user.status}">${user.status.toUpperCase()}</span></td>
            <td>${user.joinDate}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterUsersByPlan() {
    const plan = document.getElementById('planFilter').value;
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    const filteredUsers = plan === 'all' ? usersData : usersData.filter(user => user.plan === plan);
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge plan-${user.plan}">${user.plan.toUpperCase()}</span></td>
            <td><span class="badge status-${user.status}">${user.status.toUpperCase()}</span></td>
            <td>${user.joinDate}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editUser(userId) {
    const user = usersData.find(u => u.id === userId);
    if (!user) return;
    
    const newName = prompt('Enter new name:', user.name);
    const newEmail = prompt('Enter new email:', user.email);
    const newPlan = prompt('Enter new plan (basic/standard/premium):', user.plan);
    
    if (newName && newEmail && newPlan) {
        user.name = newName;
        user.email = newEmail;
        user.plan = newPlan;
        
        localStorage.setItem('users', JSON.stringify(usersData));
        renderUsersTable();
        showToast('User updated successfully', 'success');
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        usersData = usersData.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(usersData));
        renderUsersTable();
        showToast('User deleted successfully', 'success');
    }
}

// Notes Management
function renderNotesTable() {
    const tbody = document.getElementById('notesTableBody');
    tbody.innerHTML = '';
    
    notesData.forEach(note => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${note.title}</td>
            <td>${note.exam}</td>
            <td>${note.subject}</td>
            <td><span class="badge status-${note.status}">${note.status.toUpperCase()}</span></td>
            <td>₹${note.price}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editNote(${note.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteNote(${note.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddNoteForm() {
    document.getElementById('noteFormTitle').textContent = 'Add New Note';
    document.getElementById('noteId').value = '';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteExam').value = '';
    document.getElementById('noteSubject').value = '';
    document.getElementById('notePages').value = '';
    document.getElementById('notePrice').value = '';
    document.getElementById('noteStatus').value = 'available';
    document.getElementById('noteDescription').value = '';
    document.getElementById('noteHardCopy').checked = false;
    document.getElementById('noteVideo').checked = false;
    
    const modal = document.getElementById('noteFormModal');
    modal.style.display = 'block';
}

function closeNoteForm() {
    const modal = document.getElementById('noteFormModal');
    modal.style.display = 'none';
}

function handleNoteSubmit(e) {
    e.preventDefault();
    
    const noteId = document.getElementById('noteId').value;
    const note = {
        id: noteId ? parseInt(noteId) : Date.now(),
        title: document.getElementById('noteTitle').value,
        exam: document.getElementById('noteExam').value,
        subject: document.getElementById('noteSubject').value,
        pages: parseInt(document.getElementById('notePages').value),
        price: parseInt(document.getElementById('notePrice').value),
        status: document.getElementById('noteStatus').value,
        description: document.getElementById('noteDescription').value,
        hardCopyAvailable: document.getElementById('noteHardCopy').checked,
        videoSolutions: document.getElementById('noteVideo').checked,
        uploadDate: new Date().toISOString().split('T')[0]
    };
    
    if (noteId) {
        // Edit existing note
        const index = notesData.findIndex(n => n.id === parseInt(noteId));
        if (index !== -1) {
            notesData[index] = note;
        }
    } else {
        // Add new note
        notesData.push(note);
    }
    
    localStorage.setItem('notes', JSON.stringify(notesData));
    closeNoteForm();
    renderNotesTable();
    showToast('Note saved successfully', 'success');
}

function editNote(noteId) {
    const note = notesData.find(n => n.id === noteId);
    if (!note) return;
    
    document.getElementById('noteFormTitle').textContent = 'Edit Note';
    document.getElementById('noteId').value = note.id;
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteExam').value = note.exam;
    document.getElementById('noteSubject').value = note.subject;
    document.getElementById('notePages').value = note.pages;
    document.getElementById('notePrice').value = note.price;
    document.getElementById('noteStatus').value = note.status;
    document.getElementById('noteDescription').value = note.description;
    document.getElementById('noteHardCopy').checked = note.hardCopyAvailable;
    document.getElementById('noteVideo').checked = note.videoSolutions;
    
    const modal = document.getElementById('noteFormModal');
    modal.style.display = 'block';
}

function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        notesData = notesData.filter(n => n.id !== noteId);
        localStorage.setItem('notes', JSON.stringify(notesData));
        renderNotesTable();
        showToast('Note deleted successfully', 'success');
    }
}

function searchNotes() {
    const searchTerm = document.getElementById('noteSearch').value.toLowerCase();
    const tbody = document.getElementById('notesTableBody');
    tbody.innerHTML = '';
    
    const filteredNotes = notesData.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.exam.toLowerCase().includes(searchTerm) ||
        note.subject.toLowerCase().includes(searchTerm)
    );
    
    filteredNotes.forEach(note => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${note.title}</td>
            <td>${note.exam}</td>
            <td>${note.subject}</td>
            <td><span class="badge status-${note.status}">${note.status.toUpperCase()}</span></td>
            <td>₹${note.price}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editNote(${note.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteNote(${note.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Uploads Management
function renderUploadsTable() {
    const tbody = document.getElementById('uploadsTableBody');
    tbody.innerHTML = '';
    
    uploadsData.forEach(upload => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${upload.studentName}</td>
            <td>${upload.examName}</td>
            <td>
                <div>Questions: ${upload.files.questions.length}</div>
                <div>Images: ${upload.files.images.length}</div>
                <div>Videos: ${upload.files.videos.length}</div>
            </td>
            <td><span class="badge status-${upload.status}">${upload.status.toUpperCase()}</span></td>
            <td>${new Date(upload.timestamp).toLocaleString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="updateUploadStatus(${upload.id}, 'processing')">Processing</button>
                <button class="btn btn-sm btn-success" onclick="updateUploadStatus(${upload.id}, 'completed')">Completed</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function searchUploads() {
    const searchTerm = document.getElementById('uploadSearch').value.toLowerCase();
    const tbody = document.getElementById('uploadsTableBody');
    tbody.innerHTML = '';
    
    const filteredUploads = uploadsData.filter(upload => 
        upload.studentName.toLowerCase().includes(searchTerm) ||
        upload.examName.toLowerCase().includes(searchTerm)
    );
    
    filteredUploads.forEach(upload => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${upload.studentName}</td>
            <td>${upload.examName}</td>
            <td>
                <div>Questions: ${upload.files.questions.length}</div>
                <div>Images: ${upload.files.images.length}</div>
                <div>Videos: ${upload.files.videos.length}</div>
            </td>
            <td><span class="badge status-${upload.status}">${upload.status.toUpperCase()}</span></td>
            <td>${new Date(upload.timestamp).toLocaleString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="updateUploadStatus(${upload.id}, 'processing')">Processing</button>
                <button class="btn btn-sm btn-success" onclick="updateUploadStatus(${upload.id}, 'completed')">Completed</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterUploadsByStatus() {
    const status = document.getElementById('statusFilter').value;
    const tbody = document.getElementById('uploadsTableBody');
    tbody.innerHTML = '';
    
    const filteredUploads = status === 'all' ? uploadsData : uploadsData.filter(upload => upload.status === status);
    
    filteredUploads.forEach(upload => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${upload.studentName}</td>
            <td>${upload.examName}</td>
            <td>
                <div>Questions: ${upload.files.questions.length}</div>
                <div>Images: ${upload.files.images.length}</div>
                <div>Videos: ${upload.files.videos.length}</div>
            </td>
            <td><span class="badge status-${upload.status}">${upload.status.toUpperCase()}</span></td>
            <td>${new Date(upload.timestamp).toLocaleString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="updateUploadStatus(${upload.id}, 'processing')">Processing</button>
                <button class="btn btn-sm btn-success" onclick="updateUploadStatus(${upload.id}, 'completed')">Completed</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateUploadStatus(uploadId, newStatus) {
    const upload = uploadsData.find(u => u.id === uploadId);
    if (upload) {
        upload.status = newStatus;
        localStorage.setItem('uploads', JSON.stringify(uploadsData));
        renderUploadsTable();
        showToast(`Upload status updated to ${newStatus}`, 'success');
    }
}

// Payments Management
function renderPaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    tbody.innerHTML = '';
    
    paymentsData.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.transactionId}</td>
            <td>${payment.userEmail}</td>
            <td><span class="badge plan-${payment.plan}">${payment.plan.toUpperCase()}</span></td>
            <td>₹${payment.amount}</td>
            <td>${new Date(payment.timestamp).toLocaleString()}</td>
            <td><span class="badge status-${payment.status}">${payment.status.toUpperCase()}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Website Settings
function renderPricingPlans() {
    const container = document.getElementById('pricingPlans');
    container.innerHTML = '';
    
    const plans = [
        { name: 'basic', price: 499, features: ['5-page preview', 'Basic support'] },
        { name: 'standard', price: 999, features: ['Full downloads', '5 hard copies', 'Video solutions', 'Priority support'] },
        { name: 'premium', price: 1999, features: ['Unlimited downloads', '15 hard copies', 'All video solutions', '24/7 premium support'] }
    ];
    
    plans.forEach(plan => {
        const planCard = document.createElement('div');
        planCard.className = 'setting-card';
        planCard.innerHTML = `
            <h3>${plan.name.toUpperCase()} Plan</h3>
            <form onsubmit="updatePricingPlan(event, '${plan.name}')">
                <div class="form-group">
                    <label>Price (₹)</label>
                    <input type="number" id="price-${plan.name}" value="${plan.price}" required>
                </div>
                <div class="form-group">
                    <label>Features</label>
                    <textarea id="features-${plan.name}" rows="4">${plan.features.join('\n')}</textarea>
                </div>
                <button type="submit" class="btn btn-primary">Update Plan</button>
            </form>
        `;
        container.appendChild(planCard);
    });
}

// Background Customization Functions
function toggleBackgroundOptions() {
    const backgroundType = document.getElementById('backgroundType').value;
    
    // Hide all option sections
    document.getElementById('gradientOptions').style.display = 'none';
    document.getElementById('imageOptions').style.display = 'none';
    document.getElementById('patternOptions').style.display = 'none';
    
    // Show selected option section
    if (backgroundType === 'gradient') {
        document.getElementById('gradientOptions').style.display = 'block';
        updateBackgroundPreview();
    } else if (backgroundType === 'image') {
        document.getElementById('imageOptions').style.display = 'block';
        updateBackgroundPreview();
    } else if (backgroundType === 'pattern') {
        document.getElementById('patternOptions').style.display = 'block';
        updateBackgroundPreview();
    }
}

function updateBackgroundPreview() {
    const preview = document.getElementById('backgroundPreview');
    const backgroundType = document.getElementById('backgroundType').value;
    
    if (backgroundType === 'gradient') {
        const primaryColor = document.getElementById('primaryColor').value;
        const secondaryColor = document.getElementById('secondaryColor').value;
        preview.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
    } else if (backgroundType === 'image') {
        const imageOpacity = document.getElementById('imageOpacity').value;
        // For image preview, we'll use a placeholder or the uploaded image
        preview.style.background = `linear-gradient(135deg, #667eea 0%, #764ba2 100%), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="white" opacity="0.1"/></svg>')`;
        preview.style.opacity = imageOpacity;
    } else if (backgroundType === 'pattern') {
        const patternType = document.getElementById('patternType').value;
        const patternColor = document.getElementById('patternColor').value;
        const patternOpacity = document.getElementById('patternOpacity').value;
        
        let patternSVG = '';
        if (patternType === 'dots') {
            patternSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="2" fill="${patternColor}" opacity="${patternOpacity}"/></svg>`;
        } else if (patternType === 'lines') {
            patternSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><line x1="0" y1="0" x2="20" y2="20" stroke="${patternColor}" stroke-width="2" opacity="${patternOpacity}"/></svg>`;
        } else if (patternType === 'waves') {
            patternSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M0,10 Q5,5 10,10 T20,10" stroke="${patternColor}" stroke-width="2" fill="none" opacity="${patternOpacity}"/></svg>`;
        }
        
        preview.style.background = `linear-gradient(135deg, #667eea 0%, #764ba2 100%), url('data:image/svg+xml;utf8,${encodeURIComponent(patternSVG)}')`;
    }
}

function applyBackground() {
    const backgroundType = document.getElementById('backgroundType').value;
    const settings = {
        type: backgroundType
    };
    
    if (backgroundType === 'gradient') {
        settings.primaryColor = document.getElementById('primaryColor').value;
        settings.secondaryColor = document.getElementById('secondaryColor').value;
    } else if (backgroundType === 'image') {
        settings.imageOpacity = document.getElementById('imageOpacity').value;
        // Handle image upload
        const fileInput = document.getElementById('backgroundImage');
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                settings.imageUrl = e.target.result;
                saveBackgroundSettings(settings);
                showToast('Background image applied successfully', 'success');
            };
            reader.readAsDataURL(file);
            return;
        }
    } else if (backgroundType === 'pattern') {
        settings.patternType = document.getElementById('patternType').value;
        settings.patternColor = document.getElementById('patternColor').value;
        settings.patternOpacity = document.getElementById('patternOpacity').value;
    }
    
    saveBackgroundSettings(settings);
    showToast('Background settings applied successfully', 'success');
}

function resetBackground() {
    const defaultSettings = {
        type: 'gradient',
        primaryColor: '#667eea',
        secondaryColor: '#764ba2'
    };
    
    saveBackgroundSettings(defaultSettings);
    
    // Reset form values
    document.getElementById('backgroundType').value = 'gradient';
    document.getElementById('primaryColor').value = '#667eea';
    document.getElementById('secondaryColor').value = '#764ba2';
    document.getElementById('imageOpacity').value = '0.5';
    document.getElementById('patternType').value = 'dots';
    document.getElementById('patternColor').value = '#ffffff';
    document.getElementById('patternOpacity').value = '0.2';
    
    // Show gradient options
    document.getElementById('gradientOptions').style.display = 'block';
    document.getElementById('imageOptions').style.display = 'none';
    document.getElementById('patternOptions').style.display = 'none';
    
    updateBackgroundPreview();
    showToast('Background reset to default', 'success');
}

function saveBackgroundSettings(settings) {
    localStorage.setItem('backgroundSettings', JSON.stringify(settings));
    applyBackgroundToWebsite(settings);
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

// Initialize background settings on page load
function initBackgroundSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('backgroundSettings') || 'null');
    if (savedSettings) {
        applyBackgroundToWebsite(savedSettings);
        
        // Update form values if in admin panel
        if (document.getElementById('backgroundType')) {
            document.getElementById('backgroundType').value = savedSettings.type;
            toggleBackgroundOptions();
            
            if (savedSettings.type === 'gradient') {
                document.getElementById('primaryColor').value = savedSettings.primaryColor;
                document.getElementById('secondaryColor').value = savedSettings.secondaryColor;
            } else if (savedSettings.type === 'image') {
                document.getElementById('imageOpacity').value = savedSettings.imageOpacity || '0.5';
            } else if (savedSettings.type === 'pattern') {
                document.getElementById('patternType').value = savedSettings.patternType;
                document.getElementById('patternColor').value = savedSettings.patternColor;
                document.getElementById('patternOpacity').value = savedSettings.patternOpacity;
            }
        }
    }
}

function handleAdminInfoUpdate(e) {
    e.preventDefault();
    const adminName = document.getElementById('adminName').value;
    const adminEmail = document.getElementById('adminEmail').value;
    const adminAddress = document.getElementById('adminAddress').value;
    const adminPhone = document.getElementById('adminPhone').value;
    
    // Update localStorage
    const adminInfo = {
        name: adminName,
        email: adminEmail,
        address: adminAddress,
        phone: adminPhone
    };
    
    localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
    showToast('Admin information updated', 'success');
}

function handleHeroUpdate(e) {
    e.preventDefault();
    const heroTitle = document.getElementById('heroTitle').value;
    const heroSubtitle = document.getElementById('heroSubtitle').value;
    const heroDescription = document.getElementById('heroDescription').value;
    
    // Update localStorage
    const heroInfo = {
        title: heroTitle,
        subtitle: heroSubtitle,
        description: heroDescription
    };
    
    localStorage.setItem('heroInfo', JSON.stringify(heroInfo));
    showToast('Hero section updated', 'success');
}

function handleStatsUpdate(e) {
    e.preventDefault();
    const students = document.getElementById('statStudents').value;
    const notes = document.getElementById('statNotes').value;
    const success = document.getElementById('statSuccess').value;
    
    // Update localStorage
    const statsInfo = {
        students: students,
        notes: notes,
        success: success
    };
    
    localStorage.setItem('statsInfo', JSON.stringify(statsInfo));
    showToast('Statistics updated', 'success');
}

function updatePricingPlan(e, planName) {
    e.preventDefault();
    const price = document.getElementById(`price-${planName}`).value;
    const features = document.getElementById(`features-${planName}`).value;
    
    // Update localStorage
    const pricingPlans = JSON.parse(localStorage.getItem('pricingPlans') || '{}');
    pricingPlans[planName] = {
        price: parseInt(price),
        features: features.split('\n')
    };
    
    localStorage.setItem('pricingPlans', JSON.stringify(pricingPlans));
    showToast(`${planName.toUpperCase()} plan updated`, 'success');
}

// Chat System
function renderChatMessages() {
    const container = document.getElementById('adminChatMessages');
    container.innerHTML = '';
    
    chatMessages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${message.sender}`;
        messageDiv.innerHTML = `
            <div class="message-content">${message.text}</div>
            <div class="message-time">${message.sender} • ${new Date(message.timestamp).toLocaleTimeString()}</div>
        `;
        container.appendChild(messageDiv);
    });
    
    container.scrollTop = container.scrollHeight;
}

function sendAdminMessage() {
    const input = document.getElementById('adminChatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const newMessage = {
        id: Date.now(),
        sender: 'admin',
        text: message,
        timestamp: new Date().toISOString()
    };
    
    chatMessages.push(newMessage);
    localStorage.setItem('adminChatMessages', JSON.stringify(chatMessages));
    
    renderChatMessages();
    input.value = '';
    
    // Auto-response simulation
    setTimeout(() => {
        const response = {
            id: Date.now() + 1,
            sender: 'admin',
            text: 'Message received. Team will respond shortly.',
            timestamp: new Date().toISOString()
        };
        
        chatMessages.push(response);
        localStorage.setItem('adminChatMessages', JSON.stringify(chatMessages));
        renderChatMessages();
    }, 1000);
}

// Search and Filter Setup
function setupSearchAndFilters() {
    // These functions are already defined above
}

// Utility Functions
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

// Export functions for global access
window.showSection = showSection;
window.logoutAdmin = logoutAdmin;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.showAddNoteForm = showAddNoteForm;
window.closeNoteForm = closeNoteForm;
window.editNote = editNote;
window.deleteNote = deleteNote;
window.sendAdminMessage = sendAdminMessage;
window.updateUploadStatus = updateUploadStatus;
