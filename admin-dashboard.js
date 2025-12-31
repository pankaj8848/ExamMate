// Admin Dashboard JavaScript

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
let adminSession = null;
let currentSection = 'dashboard';
let notesData = [];
let postersData = [];
let uploadsData = [];
let usersData = [];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupEventListeners();
});

function checkAdminAuth() {
    const session = localStorage.getItem('adminSession');
    if (!session) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    adminSession = JSON.parse(session);
    loadInitialData();
    showSection('dashboard');
    updateAdminInfo();
}

function updateAdminInfo() {
    const adminName = document.getElementById('adminName');
    if (adminName) {
        adminName.textContent = adminSession.username;
    }
}

function setupEventListeners() {
    // Form Submissions
    const noteForm = document.getElementById('noteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', handleNoteSubmit);
    }
    
    const posterForm = document.getElementById('posterForm');
    if (posterForm) {
        posterForm.addEventListener('submit', handlePosterSubmit);
    }
    
    // Search and Filter Functions
    setupSearchAndFilters();
}

// Authentication
function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminSession');
        window.location.href = 'admin-login.html';
    }
}

// Data Loading and Management
async function loadInitialData() {
    try {
        // Load data from Firestore
        const [notesSnapshot, postersSnapshot, uploadsSnapshot, usersSnapshot, questionUploadsSnapshot, hardCopyRequestsSnapshot] = await Promise.all([
            db.collection('notes').get(),
            db.collection('posters').get(),
            db.collection('studentUploads').get(),
            db.collection('users').get(),
            db.collection('questionUploads').get(),
            db.collection('hardCopyRequests').get()
        ]);
        
        // Process notes data
        notesData = notesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Process posters data
        postersData = postersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Process uploads data (student uploads)
        uploadsData = uploadsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Process users data
        usersData = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Process question uploads data
        const questionUploadsData = questionUploadsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Process hard copy requests data
        const hardCopyRequestsData = hardCopyRequestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Update UI
        updateDashboardStats();
        renderNotesTable();
        renderPostersGrid();
        renderUploadsTable();
        renderUsersTable();
        renderQuestionUploadsTable();
        renderHardCopyRequestsTable();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data. Please refresh the page.', 'error');
    }
}

// Dashboard Functions
function updateDashboardStats() {
    document.getElementById('totalUsers').textContent = usersData.length;
    document.getElementById('totalNotes').textContent = notesData.filter(n => n.status === 'active').length;
    document.getElementById('totalUploads').textContent = uploadsData.filter(u => u.status === 'pending').length;
    
    // Calculate revenue (simplified calculation)
    const totalRevenue = notesData.reduce((sum, note) => sum + (note.price || 0), 0);
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue}`;
    
    renderRecentActivity();
}

function renderRecentActivity() {
    const container = document.getElementById('recentActivity');
    container.innerHTML = '';
    
    const activities = [];
    
    // Add note uploads
    notesData.slice(0, 5).forEach(note => {
        activities.push({
            type: 'note',
            icon: 'fas fa-file-pdf',
            text: `New note uploaded: ${note.title}`,
            time: note.createdAt ? note.createdAt.toDate().toISOString() : new Date().toISOString()
        });
    });
    
    // Add uploads
    uploadsData.slice(0, 5).forEach(upload => {
        activities.push({
            type: 'upload',
            icon: 'fas fa-upload',
            text: `New student upload: ${upload.studentName}`,
            time: upload.createdAt ? upload.createdAt.toDate().toISOString() : new Date().toISOString()
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
                <h4>${activity.text}</h4>
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
    
    // Load data for specific sections
    switch(sectionName) {
        case 'pdf-notes':
            renderNotesTable();
            break;
        case 'posters':
            renderPostersGrid();
            break;
        case 'student-uploads':
            renderUploadsTable();
            break;
        case 'users':
            renderUsersTable();
            break;
        case 'analytics':
            initCharts();
            break;
    }
}

// PDF Notes Management
function renderNotesTable() {
    const tbody = document.getElementById('notesTableBody');
    tbody.innerHTML = '';
    
    const filteredNotes = notesData.filter(note => {
        const searchTerm = document.getElementById('noteSearch')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('noteStatusFilter')?.value || 'all';
        
        const matchesSearch = !searchTerm || 
            note.title.toLowerCase().includes(searchTerm) ||
            note.subject.toLowerCase().includes(searchTerm) ||
            note.exam.toLowerCase().includes(searchTerm);
        
        const matchesStatus = statusFilter === 'all' || note.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    filteredNotes.forEach(note => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${note.title}</td>
            <td>${note.subject}</td>
            <td>${note.exam}</td>
            <td>${note.pages}</td>
            <td>₹${note.price}</td>
            <td><span class="status-${note.status}">${note.status}</span></td>
            <td>
                <button class="btn-secondary" onclick="editNote('${note.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-secondary" onclick="toggleNoteStatus('${note.id}', '${note.status}')">
                    <i class="fas fa-power-off"></i> ${note.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn-danger" onclick="deleteNote('${note.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function handleNoteSubmit(e) {
    e.preventDefault();
    
    const noteId = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitle').value;
    const subject = document.getElementById('noteSubject').value;
    const exam = document.getElementById('noteExam').value;
    const pages = parseInt(document.getElementById('notePages').value);
    const price = parseInt(document.getElementById('notePrice').value);
    const status = document.getElementById('noteStatus').value;
    const pdfFile = document.getElementById('notePdfFile').files[0];
    const posterFile = document.getElementById('notePosterFile').files[0];
    
    try {
        let pdfUrl = '';
        let posterUrl = '';
        
        // Upload PDF file
        if (pdfFile) {
            const pdfRef = storage.ref(`notes/${Date.now()}_${pdfFile.name}`);
            await pdfRef.put(pdfFile);
            pdfUrl = await pdfRef.getDownloadURL();
        }
        
        // Upload poster image
        if (posterFile) {
            const posterRef = storage.ref(`posters/${Date.now()}_${posterFile.name}`);
            await posterRef.put(posterFile);
            posterUrl = await posterRef.getDownloadURL();
        }
        
        const noteData = {
            title,
            subject,
            exam,
            pages,
            price,
            status,
            pdfUrl,
            posterUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (noteId) {
            // Update existing note
            await db.collection('notes').doc(noteId).update(noteData);
            showToast('Note updated successfully!', 'success');
        } else {
            // Add new note
            await db.collection('notes').add(noteData);
            showToast('Note added successfully!', 'success');
        }
        
        closeNoteForm();
        loadInitialData();
        
    } catch (error) {
        console.error('Error saving note:', error);
        showToast('Error saving note. Please try again.', 'error');
    }
}

function showAddNoteForm() {
    document.getElementById('noteFormTitle').textContent = 'Add New Note';
    document.getElementById('noteId').value = '';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteSubject').value = '';
    document.getElementById('noteExam').value = '';
    document.getElementById('notePages').value = '';
    document.getElementById('notePrice').value = '';
    document.getElementById('noteStatus').value = 'active';
    document.getElementById('pdfPreview').innerHTML = '';
    document.getElementById('posterPreview').innerHTML = '';
    
    const modal = document.getElementById('noteFormModal');
    modal.style.display = 'block';
}

function closeNoteForm() {
    const modal = document.getElementById('noteFormModal');
    modal.style.display = 'none';
}

async function editNote(noteId) {
    const note = notesData.find(n => n.id === noteId);
    if (!note) return;
    
    document.getElementById('noteFormTitle').textContent = 'Edit Note';
    document.getElementById('noteId').value = note.id;
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteSubject').value = note.subject;
    document.getElementById('noteExam').value = note.exam;
    document.getElementById('notePages').value = note.pages;
    document.getElementById('notePrice').value = note.price;
    document.getElementById('noteStatus').value = note.status;
    
    const modal = document.getElementById('noteFormModal');
    modal.style.display = 'block';
}

async function toggleNoteStatus(noteId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
        await db.collection('notes').doc(noteId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`Note ${newStatus} successfully!`, 'success');
        loadInitialData();
        
    } catch (error) {
        console.error('Error updating note status:', error);
        showToast('Error updating note status. Please try again.', 'error');
    }
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
        await db.collection('notes').doc(noteId).delete();
        showToast('Note deleted successfully!', 'success');
        loadInitialData();
        
    } catch (error) {
        console.error('Error deleting note:', error);
        showToast('Error deleting note. Please try again.', 'error');
    }
}

// Poster/Banner Management
function renderPostersGrid() {
    const container = document.getElementById('postersGrid');
    container.innerHTML = '';
    
    postersData.forEach(poster => {
        const card = document.createElement('div');
        card.className = 'poster-card';
        card.innerHTML = `
            <div class="poster-image" style="background-image: url('${poster.imageUrl}')">
                ${!poster.imageUrl ? '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8;">No Image</div>' : ''}
            </div>
            <div class="poster-content">
                <div class="poster-header">
                    <h4>${poster.location}</h4>
                    <span class="status-${poster.status}">${poster.status}</span>
                </div>
                <div class="poster-actions">
                    <button class="btn-secondary" onclick="editPoster('${poster.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-secondary" onclick="togglePosterStatus('${poster.id}', '${poster.status}')">
                        <i class="fas fa-power-off"></i> ${poster.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn-danger" onclick="deletePoster('${poster.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function handlePosterSubmit(e) {
    e.preventDefault();
    
    const posterId = document.getElementById('posterId').value;
    const location = document.getElementById('posterLocation').value;
    const status = document.getElementById('posterStatus').value;
    const imageFile = document.getElementById('posterImageFile').files[0];
    
    try {
        let imageUrl = '';
        
        // Upload image file
        if (imageFile) {
            const imageRef = storage.ref(`posters/${Date.now()}_${imageFile.name}`);
            await imageRef.put(imageFile);
            imageUrl = await imageRef.getDownloadURL();
        }
        
        const posterData = {
            location,
            imageUrl: imageUrl || document.getElementById('posterImagePreview').dataset.currentUrl || '',
            status,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (posterId) {
            // Update existing poster
            await db.collection('posters').doc(posterId).update(posterData);
            showToast('Poster updated successfully!', 'success');
        } else {
            // Add new poster
            await db.collection('posters').add(posterData);
            showToast('Poster added successfully!', 'success');
        }
        
        closePosterForm();
        loadInitialData();
        
    } catch (error) {
        console.error('Error saving poster:', error);
        showToast('Error saving poster. Please try again.', 'error');
    }
}

function showAddPosterForm() {
    document.getElementById('posterFormTitle').textContent = 'Add New Poster';
    document.getElementById('posterId').value = '';
    document.getElementById('posterLocation').value = 'homepage';
    document.getElementById('posterStatus').value = 'active';
    document.getElementById('posterImagePreview').innerHTML = '';
    document.getElementById('posterImagePreview').dataset.currentUrl = '';
    
    const modal = document.getElementById('posterFormModal');
    modal.style.display = 'block';
}

function closePosterForm() {
    const modal = document.getElementById('posterFormModal');
    modal.style.display = 'none';
}

async function editPoster(posterId) {
    const poster = postersData.find(p => p.id === posterId);
    if (!poster) return;
    
    document.getElementById('posterFormTitle').textContent = 'Edit Poster';
    document.getElementById('posterId').value = poster.id;
    document.getElementById('posterLocation').value = poster.location;
    document.getElementById('posterStatus').value = poster.status;
    
    const modal = document.getElementById('posterFormModal');
    modal.style.display = 'block';
}

async function togglePosterStatus(posterId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
        await db.collection('posters').doc(posterId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`Poster ${newStatus} successfully!`, 'success');
        loadInitialData();
        
    } catch (error) {
        console.error('Error updating poster status:', error);
        showToast('Error updating poster status. Please try again.', 'error');
    }
}

async function deletePoster(posterId) {
    if (!confirm('Are you sure you want to delete this poster?')) return;
    
    try {
        await db.collection('posters').doc(posterId).delete();
        showToast('Poster deleted successfully!', 'success');
        loadInitialData();
        
    } catch (error) {
        console.error('Error deleting poster:', error);
        showToast('Error deleting poster. Please try again.', 'error');
    }
}

// Student Uploads Management
function renderUploadsTable() {
    const tbody = document.getElementById('uploadsTableBody');
    tbody.innerHTML = '';
    
    const filteredUploads = uploadsData.filter(upload => {
        const searchTerm = document.getElementById('uploadSearch')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('uploadStatusFilter')?.value || 'all';
        
        const matchesSearch = !searchTerm || 
            upload.studentName.toLowerCase().includes(searchTerm) ||
            upload.exam.toLowerCase().includes(searchTerm);
        
        const matchesStatus = statusFilter === 'all' || upload.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    filteredUploads.forEach(upload => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${upload.studentName}</td>
            <td>${upload.exam}</td>
            <td>
                <a href="${upload.pdfUrl}" target="_blank" class="btn-secondary">
                    <i class="fas fa-file-pdf"></i> View PDF
                </a>
            </td>
            <td><span class="status-${upload.status}">${upload.status}</span></td>
            <td>${upload.createdAt ? upload.createdAt.toDate().toLocaleString() : 'N/A'}</td>
            <td>
                <button class="btn-primary" onclick="reviewUpload('${upload.id}')">
                    <i class="fas fa-eye"></i> Review
                </button>
                <button class="btn-success" onclick="approveUpload('${upload.id}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-danger" onclick="rejectUpload('${upload.id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function reviewUpload(uploadId) {
    const upload = uploadsData.find(u => u.id === uploadId);
    if (!upload) return;
    
    const modal = document.getElementById('uploadReviewModal');
    const content = document.getElementById('uploadReviewContent');
    
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <h4>Student Information</h4>
                <p><strong>Name:</strong> ${upload.studentName}</p>
                <p><strong>Email:</strong> ${upload.studentEmail}</p>
                <p><strong>Exam:</strong> ${upload.exam}</p>
                <p><strong>Date:</strong> ${upload.createdAt ? upload.createdAt.toDate().toLocaleString() : 'N/A'}</p>
            </div>
            <div>
                <h4>Upload Details</h4>
                <p><strong>Status:</strong> <span class="status-${upload.status}">${upload.status}</span></p>
                <p><strong>File:</strong> <a href="${upload.pdfUrl}" target="_blank">View PDF</a></p>
                ${upload.adminComment ? `<p><strong>Admin Comment:</strong> ${upload.adminComment}</p>` : ''}
            </div>
        </div>
        <div style="margin-top: 2rem; text-align: center;">
            <button class="btn-success" onclick="approveUpload('${uploadId}')">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-danger" onclick="rejectUpload('${uploadId}')">
                <i class="fas fa-times"></i> Reject
            </button>
            <button class="btn-secondary" onclick="closeUploadReviewModal()">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeUploadReviewModal() {
    const modal = document.getElementById('uploadReviewModal');
    modal.style.display = 'none';
}

async function approveUpload(uploadId) {
    if (!confirm('Are you sure you want to approve this upload?')) return;
    
    try {
        await db.collection('studentUploads').doc(uploadId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Upload approved successfully!', 'success');
        loadInitialData();
        
    } catch (error) {
        console.error('Error approving upload:', error);
        showToast('Error approving upload. Please try again.', 'error');
    }
}

async function rejectUpload(uploadId) {
    const comment = prompt('Enter rejection reason (optional):');
    
    try {
        await db.collection('studentUploads').doc(uploadId).update({
            status: 'rejected',
            adminComment: comment || 'Rejected by admin',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Upload rejected successfully!', 'success');
        loadInitialData();
        
    } catch (error) {
        console.error('Error rejecting upload:', error);
        showToast('Error rejecting upload. Please try again.', 'error');
    }
}

// Question Uploads Management
function renderQuestionUploadsTable() {
    const tbody = document.getElementById('questionUploadsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Get question uploads from the loadInitialData function scope
    // For now, we'll need to fetch them again or store them globally
    db.collection('questionUploads').get().then((snapshot) => {
        const questionUploads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        questionUploads.forEach(upload => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${upload.studentName || 'Anonymous'}</td>
                <td>${upload.studentEmail || 'N/A'}</td>
                <td>${upload.examName || 'N/A'}</td>
                <td>${upload.subject || 'N/A'}</td>
                <td>${upload.year || 'N/A'}</td>
                <td>
                    ${upload.questionFiles && upload.questionFiles.length > 0 ? 
                        upload.questionFiles.map(url => `<a href="${url}" target="_blank" class="btn-secondary" style="margin: 2px;"><i class="fas fa-file-pdf"></i> View</a>`).join('') : 
                        'No files'}
                </td>
                <td>
                    ${upload.imageFiles && upload.imageFiles.length > 0 ? 
                        upload.imageFiles.map(url => `<a href="${url}" target="_blank" class="btn-secondary" style="margin: 2px;"><i class="fas fa-image"></i> View</a>`).join('') : 
                        'No images'}
                </td>
                <td><span class="status-${upload.status || 'pending'}">${upload.status || 'pending'}</span></td>
                <td>${upload.createdAt ? upload.createdAt.toDate().toLocaleString() : 'N/A'}</td>
                <td>
                    <button class="btn-success" onclick="approveQuestionUpload('${upload.id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-danger" onclick="rejectQuestionUpload('${upload.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn-secondary" onclick="convertToNote('${upload.id}')">
                        <i class="fas fa-plus"></i> Create Note
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }).catch(error => {
        console.error('Error loading question uploads:', error);
        showToast('Error loading question uploads.', 'error');
    });
}

async function approveQuestionUpload(uploadId) {
    if (!confirm('Are you sure you want to approve this question upload?')) return;
    
    try {
        await db.collection('questionUploads').doc(uploadId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Question upload approved successfully!', 'success');
        renderQuestionUploadsTable();
        
    } catch (error) {
        console.error('Error approving question upload:', error);
        showToast('Error approving question upload. Please try again.', 'error');
    }
}

async function rejectQuestionUpload(uploadId) {
    const comment = prompt('Enter rejection reason (optional):');
    
    try {
        await db.collection('questionUploads').doc(uploadId).update({
            status: 'rejected',
            adminComment: comment || 'Rejected by admin',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Question upload rejected successfully!', 'success');
        renderQuestionUploadsTable();
        
    } catch (error) {
        console.error('Error rejecting question upload:', error);
        showToast('Error rejecting question upload. Please try again.', 'error');
    }
}

async function convertToNote(uploadId) {
    const upload = await db.collection('questionUploads').doc(uploadId).get();
    if (!upload.exists) return;
    
    const data = upload.data();
    
    // Pre-fill the note form with upload data
    document.getElementById('noteFormTitle').textContent = 'Create Note from Upload';
    document.getElementById('noteId').value = '';
    document.getElementById('noteTitle').value = `${data.examName || 'Exam'} - ${data.subject || 'Subject'} - ${data.year || 'Year'}`;
    document.getElementById('noteSubject').value = data.subject || '';
    document.getElementById('noteExam').value = data.examName || '';
    document.getElementById('notePages').value = '50'; // Default estimate
    document.getElementById('notePrice').value = '499'; // Default price
    document.getElementById('noteStatus').value = 'active';
    
    // Store the upload ID for reference
    document.getElementById('noteForm').dataset.sourceUploadId = uploadId;
    
    const modal = document.getElementById('noteFormModal');
    modal.style.display = 'block';
}

// User Management
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    const filteredUsers = usersData.filter(user => {
        const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('userRoleFilter')?.value || 'all';
        
        const matchesSearch = !searchTerm || 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);
        
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
    });
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="status-${user.role}">${user.role}</span></td>
            <td><span class="status-${user.status || 'active'}">${user.status || 'active'}</span></td>
            <td>${user.createdAt ? user.createdAt.toDate().toLocaleString() : 'N/A'}</td>
            <td>
                <button class="btn-secondary" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-danger" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function editUser(userId) {
    const user = usersData.find(u => u.id === userId);
    if (!user) return;
    
    const newName = prompt('Enter new name:', user.name);
    const newEmail = prompt('Enter new email:', user.email);
    const newRole = prompt('Enter new role (student/admin):', user.role);
    
    if (newName && newEmail && newRole) {
        try {
            await db.collection('users').doc(userId).update({
                name: newName,
                email: newEmail,
                role: newRole,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('User updated successfully!', 'success');
            loadInitialData();
            
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('Error updating user. Please try again.', 'error');
        }
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        await db.collection('users').doc(userId).delete();
        showToast('User deleted successfully!', 'success');
        loadInitialData();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error deleting user. Please try again.', 'error');
    }
}

// Services Management
function editService(serviceType) {
    const services = {
        'expert-notes': 'Expert Notes',
        'hard-copy': 'Hard Copy Notes',
        'question-upload': 'Question Upload'
    };
    
    const serviceName = services[serviceType];
    const newStatus = prompt(`Update status for ${serviceName} (active/inactive):`, 'active');
    
    if (newStatus) {
        showToast(`${serviceName} status updated to ${newStatus}!`, 'success');
    }
}

// Analytics
function initCharts() {
    // Initialize charts using Chart.js or similar library
    // This is a placeholder for chart initialization
    console.log('Initializing charts...');
}

// Search and Filter Setup
function setupSearchAndFilters() {
    // These functions are already defined above
}

// Utility Functions
function searchNotes() {
    renderNotesTable();
}

function filterNotesByStatus() {
    renderNotesTable();
}

function searchUploads() {
    renderUploadsTable();
}

function filterUploadsByStatus() {
    renderUploadsTable();
}

function searchUsers() {
    renderUsersTable();
}

function filterUsersByRole() {
    renderUsersTable();
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

// Export functions for global access
window.showSection = showSection;
window.logoutAdmin = logoutAdmin;
window.showAddNoteForm = showAddNoteForm;
window.closeNoteForm = closeNoteForm;
window.editNote = editNote;
window.toggleNoteStatus = toggleNoteStatus;
window.deleteNote = deleteNote;
window.showAddPosterForm = showAddPosterForm;
window.closePosterForm = closePosterForm;
window.editPoster = editPoster;
window.togglePosterStatus = togglePosterStatus;
window.deletePoster = deletePoster;
window.reviewUpload = reviewUpload;
window.closeUploadReviewModal = closeUploadReviewModal;
window.approveUpload = approveUpload;
window.rejectUpload = rejectUpload;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.editService = editService;
