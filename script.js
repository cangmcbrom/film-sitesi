/* ===================================================
   İZLEME LİSTEM — Application Logic
   =================================================== */

// ─── State ───
const STORAGE_KEY = 'izleme-listem-data';
let items = [];
let activeCategory = 'all';
let activeStatus = 'all';
let searchQuery = '';
let deleteTargetId = null;

// ─── DOM References ───
const cardsGrid = document.getElementById('cardsGrid');
const emptyState = document.getElementById('emptyState');
const modalOverlay = document.getElementById('modalOverlay');
const deleteOverlay = document.getElementById('deleteOverlay');
const modalForm = document.getElementById('modalForm');
const modalTitle = document.getElementById('modalTitle');
const btnSaveText = document.getElementById('btnSaveText');
const editIdField = document.getElementById('editId');
const searchInput = document.getElementById('searchInput');
const searchWrapper = document.getElementById('searchWrapper');
const searchToggle = document.getElementById('searchToggle');
const imagePreview = document.getElementById('imagePreview');
const toastContainer = document.getElementById('toastContainer');

// ─── LocalStorage ───
function loadItems() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        items = data ? JSON.parse(data) : [];
    } catch (e) {
        items = [];
    }
}

function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ─── Unique ID ───
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Toast Notifications ───
function showToast(message, type = 'success') {
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// ─── Status Label Map ───
const statusLabels = {
    izlenecek: 'İZLENECEK',
    izleniyor: 'İZLENİYOR',
    bitti: 'BİTTİ'
};

const categoryLabels = {
    film: '🎥 Film',
    dizi: '📺 Dizi',
    anime: '⛩️ Anime'
};

// ─── Render Cards ───
function renderCards() {
    const filtered = items.filter(item => {
        const matchCategory = activeCategory === 'all' || item.category === activeCategory;
        const matchStatus = activeStatus === 'all' || item.status === activeStatus;
        const matchSearch = searchQuery === '' ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchCategory && matchStatus && matchSearch;
    });

    if (filtered.length === 0) {
        cardsGrid.innerHTML = '';
        emptyState.style.display = 'block';
        if (items.length > 0 && (searchQuery || activeCategory !== 'all' || activeStatus !== 'all')) {
            emptyState.querySelector('.empty-icon').textContent = '🔍';
            emptyState.querySelector('h2').textContent = 'Sonuç bulunamadı';
            emptyState.querySelector('p').innerHTML = 'Filtrelerinizi değiştirerek tekrar deneyin.';
        } else {
            emptyState.querySelector('.empty-icon').textContent = '🍿';
            emptyState.querySelector('h2').textContent = 'Henüz içerik eklenmedi';
            emptyState.querySelector('p').innerHTML = 'Sağ üstteki <strong>"+ Ekle"</strong> butonuna tıklayarak ilk içeriğini ekle!';
        }
        return;
    }

    emptyState.style.display = 'none';

    cardsGrid.innerHTML = filtered.map((item, index) => `
        <div class="card" data-id="${item.id}" style="animation-delay: ${index * 0.05}s">
            <div class="card-image-wrapper">
                <img class="card-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22450%22 fill=%22%2316161f%22%3E%3Crect width=%22300%22 height=%22450%22/%3E%3Ctext x=%22150%22 y=%22225%22 fill=%22%2355556a%22 text-anchor=%22middle%22 font-size=%2224%22 font-family=%22Inter%22%3E🎬%3C/text%3E%3C/svg%3E'">
                <span class="card-badge ${item.status}">${statusLabels[item.status]}</span>
                <span class="card-category">${categoryLabels[item.category] || item.category}</span>
            </div>
            <div class="card-body">
                <h3 class="card-title">${escapeHtml(item.title)}</h3>
                ${item.desc ? `<p class="card-desc">${escapeHtml(item.desc)}</p>` : ''}
            </div>
            <div class="card-actions">
                <button class="card-action-btn edit" data-action="edit" data-id="${item.id}" title="Düzenle">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="card-action-btn delete" data-action="delete" data-id="${item.id}" title="Sil">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

// ─── Escape HTML for XSS Prevention ───
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ─── Modal Management ───
function openAddModal() {
    modalTitle.textContent = 'Yeni İçerik Ekle';
    btnSaveText.textContent = 'Kaydet';
    editIdField.value = '';
    modalForm.reset();
    hideImagePreview();
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('inputTitle').focus(), 300);
}

function openEditModal(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    modalTitle.textContent = 'İçeriği Düzenle';
    btnSaveText.textContent = 'Güncelle';
    editIdField.value = id;

    document.getElementById('inputTitle').value = item.title;
    document.getElementById('inputDesc').value = item.desc || '';
    document.getElementById('inputImage').value = item.image;
    document.getElementById('inputUrl').value = item.url || '';
    document.getElementById('inputCategory').value = item.category;
    document.getElementById('inputStatus').value = item.status;

    showImagePreview(item.image);
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

function closeDeleteModal() {
    deleteOverlay.classList.remove('open');
    document.body.style.overflow = '';
    deleteTargetId = null;
}

// ─── Image Preview ───
function showImagePreview(url) {
    if (!url) {
        hideImagePreview();
        return;
    }
    imagePreview.innerHTML = `<img src="${escapeHtml(url)}" alt="Önizleme" onerror="this.parentElement.classList.remove('show')">`;
    imagePreview.classList.add('show');
}

function hideImagePreview() {
    imagePreview.innerHTML = '';
    imagePreview.classList.remove('show');
}

// ─── Form Submit (Add / Edit) ───
function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('inputTitle').value.trim();
    const desc = document.getElementById('inputDesc').value.trim();
    const image = document.getElementById('inputImage').value.trim();
    const url = document.getElementById('inputUrl').value.trim();
    const category = document.getElementById('inputCategory').value;
    const status = document.getElementById('inputStatus').value;

    if (!title || !image) {
        showToast('Başlık ve görsel URL zorunludur!', 'error');
        return;
    }

    const editId = editIdField.value;

    if (editId) {
        // ─── Edit Mode ───
        const index = items.findIndex(i => i.id === editId);
        if (index !== -1) {
            items[index] = { ...items[index], title, desc, image, url, category, status };
            showToast('İçerik güncellendi!', 'success');
        }
    } else {
        // ─── Add Mode ───
        const newItem = {
            id: generateId(),
            title,
            desc,
            image,
            url,
            category,
            status,
            createdAt: Date.now()
        };
        items.unshift(newItem);
        showToast('İçerik eklendi!', 'success');
    }

    saveItems();
    renderCards();
    closeModal();
}

// ─── Delete Item ───
function confirmDelete(id) {
    deleteTargetId = id;
    deleteOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function executeDelete() {
    if (!deleteTargetId) return;
    items = items.filter(i => i.id !== deleteTargetId);
    saveItems();
    renderCards();
    closeDeleteModal();
    showToast('İçerik silindi', 'info');
}

// ─── Card Click Handler ───
function handleCardClick(e) {
    const actionBtn = e.target.closest('[data-action]');

    if (actionBtn) {
        e.stopPropagation();
        const id = actionBtn.dataset.id;
        const action = actionBtn.dataset.action;

        if (action === 'edit') {
            openEditModal(id);
        } else if (action === 'delete') {
            confirmDelete(id);
        }
        return;
    }

    const card = e.target.closest('.card');
    if (card) {
        const item = items.find(i => i.id === card.dataset.id);
        if (item && item.url) {
            window.open(item.url, '_blank', 'noopener,noreferrer');
        }
    }
}

// ─── Category Tabs ───
function handleTabClick(e) {
    const tab = e.target.closest('.tab');
    if (!tab) return;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.dataset.category;
    renderCards();
}

// ─── Status Filters ───
function handleStatusFilter(e) {
    const btn = e.target.closest('.status-btn');
    if (!btn) return;

    document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = btn.dataset.status;
    renderCards();
}

// ─── Search ───
function toggleSearch() {
    searchWrapper.classList.toggle('open');
    if (searchWrapper.classList.contains('open')) {
        searchInput.focus();
    } else {
        searchInput.value = '';
        searchQuery = '';
        renderCards();
    }
}

function handleSearch(e) {
    searchQuery = e.target.value;
    renderCards();
}

// ─── Image URL Preview (debounced) ───
let previewTimer = null;
function handleImageInput(e) {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
        showImagePreview(e.target.value.trim());
    }, 500);
}

// ─── Event Listeners ───
function init() {
    loadItems();

    // Header
    document.getElementById('btnAdd').addEventListener('click', openAddModal);
    searchToggle.addEventListener('click', toggleSearch);
    searchInput.addEventListener('input', handleSearch);

    // Tabs & Filters
    document.getElementById('tabs').addEventListener('click', handleTabClick);
    document.getElementById('statusFilters').addEventListener('click', handleStatusFilter);

    // Cards
    cardsGrid.addEventListener('click', handleCardClick);

    // Modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    modalForm.addEventListener('submit', handleFormSubmit);

    // Delete Modal
    document.getElementById('deleteCancel').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteConfirm').addEventListener('click', executeDelete);
    deleteOverlay.addEventListener('click', (e) => {
        if (e.target === deleteOverlay) closeDeleteModal();
    });

    // Image Preview
    document.getElementById('inputImage').addEventListener('input', handleImageInput);

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (deleteOverlay.classList.contains('open')) {
                closeDeleteModal();
            } else if (modalOverlay.classList.contains('open')) {
                closeModal();
            } else if (searchWrapper.classList.contains('open')) {
                toggleSearch();
            }
        }
    });

    // Initial Render
    renderCards();
}

// ─── Start ───
document.addEventListener('DOMContentLoaded', init);
