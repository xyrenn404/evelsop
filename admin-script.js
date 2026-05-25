let allProducts = [];
let currentProducts = [];
let sortAZ = true;
let orders = JSON.parse(localStorage.getItem('vlshop_orders')) || [];

let currentProductsData = [];
let productDeleteFilter = '';
let currentMode = 'varian';
let githubConfigured = false;
let GITHUB_TOKEN = '';
let GITHUB_USERNAME = '';
let GITHUB_REPO = '';

let adminOrders = [];
let currentFilter = 'all';
let searchKeyword = '';

function doLogin() {
    const username = document.getElementById('username').value.trim();
    const repo = document.getElementById('password').value.trim();
    const token = document.getElementById('githubToken').value.trim();
    
    if(!username || !repo || !token) {
        showAlertDialog('Login Gagal', 'Semua field harus diisi!', 'error');
        return;
    }
    
    GITHUB_USERNAME = username;
    GITHUB_REPO = repo;
    GITHUB_TOKEN = token;
    
    githubConfigured = true;
    window.repoInfo = { owner: GITHUB_USERNAME, repo: GITHUB_REPO, path: 'product.json' };
    
    const loginOverlay = document.getElementById('loginOverlay');
    const adminPanel = document.getElementById('adminPanel');
    if(loginOverlay) loginOverlay.style.display = 'none';
    if(adminPanel) adminPanel.style.display = 'block';
    
    loadOrders();
    setProductMode('varian');
    loadProductsFromGitHub();
    showToast('Login berhasil! Selamat datang Admin', 'success');
}

function logout() {
    const loginOverlay = document.getElementById('loginOverlay');
    const adminPanel = document.getElementById('adminPanel');
    if(loginOverlay) loginOverlay.style.display = 'flex';
    if(adminPanel) adminPanel.style.display = 'none';
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const tokenField = document.getElementById('githubToken');
    if(usernameField) usernameField.value = '';
    if(passwordField) passwordField.value = '';
    if(tokenField) tokenField.value = '';
    githubConfigured = false;
    GITHUB_TOKEN = '';
    GITHUB_USERNAME = '';
    GITHUB_REPO = '';
    showToast('Logout berhasil', 'info');
}

async function loadProductsFromGitHub() {
    if(!githubConfigured) return;
    
    const statusDiv = document.getElementById('addProductStatus');
    if(statusDiv) statusDiv.innerHTML = '<span style="color:#ffaa00;">Loading products from GitHub...</span>';
    
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/product.json`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if(response.ok) {
            const data = await response.json();
            window.fileSha = data.sha;
            const content = atob(data.content);
            currentProductsData = JSON.parse(content);
            displayProductList();
            if(statusDiv) statusDiv.innerHTML = '<span style="color:#4caf50;">✓ Products loaded from GitHub</span>';
            showToast('Berhasil load produk dari GitHub!', 'success');
            setTimeout(() => {
                if(statusDiv) statusDiv.innerHTML = '';
            }, 2000);
        } else if(response.status === 401) {
            if(statusDiv) statusDiv.innerHTML = '<span style="color:#ff4444;">Token GitHub salah!</span>';
            showAlertDialog('Error', 'Token GitHub tidak valid!', 'error');
        } else if(response.status === 404) {
            if(statusDiv) statusDiv.innerHTML = '<span style="color:#ff4444;">File product.json tidak ditemukan</span>';
            showAlertDialog('Error', 'File product.json tidak ditemukan di repository!', 'error');
        } else {
            if(statusDiv) statusDiv.innerHTML = '<span style="color:#ff4444;">Failed to load product.json</span>';
            showAlertDialog('Error', 'Gagal load product.json', 'error');
        }
    } catch(error) {
        if(statusDiv) statusDiv.innerHTML = '<span style="color:#ff4444;">Error: ' + error.message + '</span>';
        showAlertDialog('Error', error.message, 'error');
    }
}

async function saveProductsToGitHub() {
    const statusDiv = document.getElementById('addProductStatus');
    if(!githubConfigured) {
        if(statusDiv) statusDiv.innerHTML = '<span style="color:#ff4444;">Login dulu!</span>';
        return;
    }
    
    if(statusDiv) statusDiv.innerHTML = '<span style="color:#ffaa00;">Saving to GitHub...</span>';
    
    const content = JSON.stringify(currentProductsData, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/product.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update product.json - ${new Date().toLocaleString()}`,
                content: encodedContent,
                sha: window.fileSha
            })
        });
        
        if(response.ok) {
            const data = await response.json();
            window.fileSha = data.content.sha;
            if(statusDiv) statusDiv.innerHTML = '<span style="color:#4caf50;">✓ Product saved to GitHub successfully!</span>';
            displayProductList();
            showToast('Produk berhasil disimpan ke GitHub!', 'success');
            setTimeout(() => {
                if(statusDiv) statusDiv.innerHTML = '';
            }, 3000);
        } else {
            const error = await response.json();
            if(statusDiv) statusDiv.innerHTML = '<span style="color:#ff4444;">Failed to save: ' + error.message + '</span>';
            showAlertDialog('Error', 'Gagal save ke GitHub: ' + error.message, 'error');
        }
    } catch(error) {
        if(statusDiv) statusDiv.innerHTML = '<span style="color:#ff4444;">Error: ' + error.message + '</span>';
        showAlertDialog('Error', error.message, 'error');
    }
}

function displayProductList() {
    const container = document.getElementById('productListContainer');
    if(!container) return;
    
    if(!githubConfigured) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#777;">Silakan login terlebih dahulu</div>';
        return;
    }
    
    if(!currentProductsData || currentProductsData.length === 0){
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#777;">Belum ada produk. Tambah produk dulu!</div>';
        return;
    }
    
    let filtered = currentProductsData;
    if(productDeleteFilter) {
        filtered = currentProductsData.filter(p => 
            p.namaproduk.toLowerCase().includes(productDeleteFilter.toLowerCase())
        );
    }
    
    if(filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#777;">Produk tidak ditemukan</div>';
        return;
    }
    
    container.innerHTML = filtered.map((product, index) => {
        const originalIndex = currentProductsData.findIndex(p => p.namaproduk === product.namaproduk && p.deskripsi === product.deskripsi);
        return `
        <div class="product-delete-item">
            <div>
                <strong>${escapeHtml(product.namaproduk)}</strong>
                <div style="font-size:12px; color:#888;">${escapeHtml(product.produkmenu)} | ${escapeHtml(product.harga)}</div>
            </div>
            <button class="delete-product-btn" onclick="confirmDeleteProduct(${originalIndex})">Delete</button>
        </div>
    `}).join('');
}

function escapeHtml(str) {
    if(!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if(m === '&') return '&amp;';
        if(m === '<') return '&lt;';
        if(m === '>') return '&gt;';
        return m;
    });
}

function filterProductList() {
    productDeleteFilter = document.getElementById('searchProductDelete').value;
    displayProductList();
}

function confirmDeleteProduct(index) {
    if(!githubConfigured) {
        showAlertDialog('Akses Ditolak', 'Silakan login terlebih dahulu', 'warning');
        return;
    }
    const product = currentProductsData[index];
    showConfirmDialog('Hapus Produk', `Yakin hapus produk "${product.namaproduk}"?`, () => {
        currentProductsData.splice(index, 1);
        saveProductsToGitHub();
    });
}

function setProductMode(mode) {
    currentMode = mode;
    const varianBtn = document.getElementById('modeVarianBtn');
    const deskripsiBtn = document.getElementById('modeDeskripsiBtn');
    const varianContainer = document.getElementById('varianModeContainer');
    const deskripsiContainer = document.getElementById('deskripsi2ModeContainer');
    
    if(mode === 'varian') {
        if(varianBtn) {
            varianBtn.classList.add('mode-active');
            varianBtn.classList.remove('mode-inactive');
        }
        if(deskripsiBtn) {
            deskripsiBtn.classList.add('mode-inactive');
            deskripsiBtn.classList.remove('mode-active');
        }
        if(varianContainer) varianContainer.style.display = 'block';
        if(deskripsiContainer) deskripsiContainer.style.display = 'none';
    } else {
        if(deskripsiBtn) {
            deskripsiBtn.classList.add('mode-active');
            deskripsiBtn.classList.remove('mode-inactive');
        }
        if(varianBtn) {
            varianBtn.classList.add('mode-inactive');
            varianBtn.classList.remove('mode-active');
        }
        if(varianContainer) varianContainer.style.display = 'none';
        if(deskripsiContainer) deskripsiContainer.style.display = 'block';
    }
}

function addVariantField() {
    const variantList = document.getElementById('variantList');
    const newDiv = document.createElement('div');
    newDiv.className = 'variant-item';
    newDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
    newDiv.innerHTML = `
        <input type="text" placeholder="Nama varian" class="variant-name" style="flex:1; padding: 10px; background:#1d1d1d; border:none; border-radius:10px; color:white;">
        <input type="number" placeholder="Harga" class="variant-price" style="flex:1; padding: 10px; background:#1d1d1d; border:none; border-radius:10px; color:white;">
        <button type="button" onclick="removeVariant(this)" style="background:#ff4444; border:none; border-radius:10px; color:white; padding:0 12px; cursor:pointer;">✕</button>
    `;
    variantList.appendChild(newDiv);
}

function removeVariant(btn) {
    btn.parentElement.remove();
}

async function addProduct() {
    if(!githubConfigured) {
        showAlertDialog('Akses Ditolak', 'Silakan login terlebih dahulu', 'warning');
        return;
    }
    
    const produkmenu = document.getElementById('newProdukmenu').value.trim();
    const namaproduk = document.getElementById('newNamaproduk').value.trim();
    const deskripsi = document.getElementById('newDeskripsi').value.trim();
    const harga = document.getElementById('newHarga').value.trim();
    const gambar = document.getElementById('newGambar').value.trim();
    
    if(!namaproduk || !deskripsi || !harga || !gambar) {
        showAlertDialog('Validasi Gagal', 'Isi semua field wajib: Nama Produk, Deskripsi, Harga, Gambar', 'warning');
        return;
    }
    
    const newProduct = {
        produkmenu: produkmenu || "Uncategorized",
        namaproduk: namaproduk,
        deskripsi: deskripsi,
        harga: harga,
        gambar: gambar
    };
    
    if(currentMode === 'varian') {
        const variants = [];
        const variantItems = document.querySelectorAll('.variant-item');
        variantItems.forEach(item => {
            const nama = item.querySelector('.variant-name').value.trim();
            const price = parseInt(item.querySelector('.variant-price').value);
            if(nama && !isNaN(price) && price > 0) {
                variants.push({ nama: nama, harga: price });
            }
        });
        
        if(variants.length === 0) {
            showAlertDialog('Validasi Gagal', 'Mode Varian: Minimal 1 varian harus diisi!', 'warning');
            return;
        }
        
        newProduct.varian = variants;
    } 
    else {
        const deskripsi2 = document.getElementById('newDeskripsi2').value.trim();
        const url = document.getElementById('newUrl').value.trim();
        
        if(!url) {
            showAlertDialog('Validasi Gagal', 'Mode Deskripsi2: URL WhatsApp wajib diisi!', 'warning');
            return;
        }
        
        if(deskripsi2) {
            newProduct.deskripsi2 = deskripsi2;
        }
        newProduct.url = url;
    }
    
    currentProductsData.push(newProduct);
    await saveProductsToGitHub();
    
    document.getElementById('newProdukmenu').value = '';
    document.getElementById('newNamaproduk').value = '';
    document.getElementById('newDeskripsi').value = '';
    document.getElementById('newHarga').value = '';
    document.getElementById('newGambar').value = '';
    if(document.getElementById('newDeskripsi2')) document.getElementById('newDeskripsi2').value = '';
    if(document.getElementById('newUrl')) document.getElementById('newUrl').value = '';
    if(document.getElementById('variantList')) {
        document.getElementById('variantList').innerHTML = `
            <div class="variant-item" style="display: flex; gap: 10px; margin-bottom: 10px;">
                <input type="text" placeholder="Nama varian" class="variant-name" style="flex:1; padding: 10px; background:#1d1d1d; border:none; border-radius:10px; color:white;">
                <input type="number" placeholder="Harga" class="variant-price" style="flex:1; padding: 10px; background:#1d1d1d; border:none; border-radius:10px; color:white;">
                <button type="button" onclick="removeVariant(this)" style="background:#ff4444; border:none; border-radius:10px; color:white; padding:0 12px; cursor:pointer;">✕</button>
            </div>
        `;
    }
}

function loadOrders() {
    const stored = localStorage.getItem('vlshop_orders');
    adminOrders = stored ? JSON.parse(stored) : [];
    updateStats();
    renderOrders();
}

function updateStats() {
    const total = adminOrders.length;
    const pending = adminOrders.filter(o => o.status === 'pending').length;
    const paid = adminOrders.filter(o => o.status === 'paid').length;
    const revenue = adminOrders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total, 0);
    if(document.getElementById('totalOrders')) document.getElementById('totalOrders').innerText = total;
    if(document.getElementById('totalPending')) document.getElementById('totalPending').innerText = pending;
    if(document.getElementById('totalPaid')) document.getElementById('totalPaid').innerText = paid;
    if(document.getElementById('totalRevenue')) document.getElementById('totalRevenue').innerHTML = `Rp${revenue.toLocaleString('id-ID')}`;
}

function renderOrders() {
    let filtered = adminOrders;
    if(currentFilter !== 'all'){
        filtered = filtered.filter(o => o.status === currentFilter);
    }
    if(searchKeyword){
        filtered = filtered.filter(o => 
            o.invoice.toLowerCase().includes(searchKeyword) || 
            o.productName.toLowerCase().includes(searchKeyword) ||
            (o.customerWhatsapp && o.customerWhatsapp.includes(searchKeyword))
        );
    }
    const tbody = document.getElementById('ordersTableBody');
    if(!tbody) return;
    if(filtered.length === 0){
        tbody.innerHTML = `</tr><td colspan="7" class="empty-state">Belum ada pesanan</td></tr>`;
        return;
    }
    tbody.innerHTML = filtered.map((order) => `
        <tr>
            <td><strong>${order.invoice}</strong></td>
            <td>${order.productName}</td>
            <td>Rp${order.total.toLocaleString('id-ID')}</td>
            <td>${order.customerWhatsapp || '-'}</td>
            <td>${order.date}</td>
            <td><span class="status-badge status-${order.status}">${order.status === 'pending' ? 'Pending' : 'Selesai'}</span></td>
            <td><button class="edit-btn" onclick="toggleStatus('${order.invoice}')">${order.status === 'pending' ? 'Mark Selesai' : 'Mark Pending'}</button></td>
        </tr>
    `).join('');
}

function toggleStatus(invoice) {
    const orderIndex = adminOrders.findIndex(o => o.invoice === invoice);
    if(orderIndex !== -1){
        adminOrders[orderIndex].status = adminOrders[orderIndex].status === 'pending' ? 'paid' : 'pending';
        localStorage.setItem('vlshop_orders', JSON.stringify(adminOrders));
        orders = JSON.parse(localStorage.getItem('vlshop_orders')) || [];
        loadOrders();
        showToast('Status pesanan berhasil diubah!', 'success');
    }
}

function filterOrders(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
    if(activeBtn) activeBtn.classList.add('active');
    renderOrders();
}

function searchOrders() {
    searchKeyword = document.getElementById('searchInput').value.toLowerCase();
    renderOrders();
}

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast-notification');
    if(existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    let icon = '';
    if(type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
    else if(type === 'error') icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    else if(type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    else icon = '<i class="fa-solid fa-info-circle"></i>';
    toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-message">${message}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showConfirmDialog(title, message, onConfirm) {
    const existingModal = document.querySelector('.custom-modal-overlay');
    if(existingModal && !existingModal.id) existingModal.remove();
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.innerHTML = `
        <div class="custom-modal">
            <div class="custom-modal-icon warning"><i class="fa-solid fa-question"></i></div>
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="custom-modal-buttons">
                <button class="cancel-btn">Batal</button>
                <button class="confirm-btn">Ya</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);
    overlay.querySelector('.cancel-btn').onclick = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
    };
    overlay.querySelector('.confirm-btn').onclick = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
        onConfirm();
    };
    overlay.onclick = (e) => {
        if(e.target === overlay){
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        }
    };
}

function showAlertDialog(title, message, type = 'info') {
    const existingModal = document.querySelector('.custom-modal-overlay');
    if(existingModal && !existingModal.id) existingModal.remove();
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    let iconHtml = '';
    if(type === 'success') iconHtml = '<div class="custom-modal-icon success"><i class="fa-solid fa-circle-check"></i></div>';
    else if(type === 'error') iconHtml = '<div class="custom-modal-icon error"><i class="fa-solid fa-circle-exclamation"></i></div>';
    else if(type === 'warning') iconHtml = '<div class="custom-modal-icon warning"><i class="fa-solid fa-triangle-exclamation"></i></div>';
    else iconHtml = '<div class="custom-modal-icon info"><i class="fa-solid fa-info-circle"></i></div>';
    overlay.innerHTML = `
        <div class="custom-modal">
            ${iconHtml}
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="custom-modal-buttons">
                <button class="ok-btn">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);
    overlay.querySelector('.ok-btn').onclick = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
    };
    overlay.onclick = (e) => {
        if(e.target === overlay){
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        }
    };
}

window.doLogin = doLogin;
window.logout = logout;
window.toggleStatus = toggleStatus;
window.filterOrders = filterOrders;
window.searchOrders = searchOrders;
window.setProductMode = setProductMode;
window.addProduct = addProduct;
window.addVariantField = addVariantField;
window.removeVariant = removeVariant;
window.confirmDeleteProduct = confirmDeleteProduct;
window.filterProductList = filterProductList;