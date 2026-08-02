// ============================================
// PUTRA YUSUF LAUNDRY - Main Application
// ============================================

// Configuration
const CONFIG = {
    // Ganti dengan URL Google Apps Script Anda
    API_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    STORE_NAME: 'Putra Yusuf Laundry'
};

// Data Storage
let orders = [];
let currentOrderId = 1;

// ============================================
// PRICE CONFIGURATION
// ============================================

const PRICE_CONFIG = {
    kiloan: {
        label: 'Kiloan',
        minWeight: 3,
        packages: {
            regular: { label: 'Regular', price: 8000, duration: '3 Hari' },
            '2_hari': { label: 'Paket 2 Hari', price: 9000, duration: '2 Hari' },
            express: { label: 'Express', price: 11000, duration: '1 Hari' },
            kilat: { label: 'Kilat', price: 13000, duration: '6 Jam' }
        }
    },
    satuan: {
        label: 'Satuan',
        categories: {
            kaos: { label: 'Kaos / Kemeja', prices: { regular: 13000, '2_hari': 17000, express: 20000 } },
            jas: { label: 'Jas', prices: { regular: 25000, '2_hari': 30000, express: 35000 } },
            bedcover: { label: 'Bedcover', prices: { kecil: 15000, sedang: 20000, besar: 30000 } }
        }
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    document.getElementById('dateDisplay').textContent = formatDate(new Date());
    
    // Set today's date in form
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalMasuk').value = today;
    document.getElementById('tanggalMasuk').max = today;
    
    // Generate order ID
    generateOrderId();
    
    // Load orders from localStorage
    loadOrders();
    
    // Render orders
    renderOrders();
});

// ============================================
// ORDER ID GENERATION
// ============================================

function generateOrderId() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const id = `PY-${year}${month}${day}-${random}`;
    document.getElementById('orderId').value = id;
    return id;
}

// ============================================
// FORM HANDLING
// ============================================

function showForm() {
    document.getElementById('formSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    generateOrderId();
    document.getElementById('tanggalMasuk').value = new Date().toISOString().split('T')[0];
    document.getElementById('namaCustomer').focus();
}

function hideForm() {
    document.getElementById('formSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    document.getElementById('orderForm').reset();
    document.getElementById('totalHarga').value = 'Rp 0';
    document.getElementById('jenisLaundry').value = '';
    document.getElementById('paket').innerHTML = '<option value="">Pilih Paket</option>';
    document.getElementById('detailGroup').style.display = 'none';
}

function updatePaketOptions() {
    const jenis = document.getElementById('jenisLaundry').value;
    const paketSelect = document.getElementById('paket');
    const detailGroup = document.getElementById('detailGroup');
    const detailSelect = document.getElementById('detailItem');
    const qtyLabel = document.getElementById('qtyLabel');
    
    paketSelect.innerHTML = '<option value="">Pilih Paket</option>';
    detailSelect.innerHTML = '<option value="">Pilih Detail</option>';
    detailGroup.style.display = 'none';
    
    if (jenis === 'kiloan') {
        qtyLabel.textContent = 'Berat (Kg) *';
        const packages = PRICE_CONFIG.kiloan.packages;
        for (const [key, pkg] of Object.entries(packages)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${pkg.label} (${pkg.duration}) - Rp ${formatNumber(pkg.price)}/kg`;
            paketSelect.appendChild(option);
        }
        document.getElementById('qty').step = '0.1';
        document.getElementById('qty').min = '0';
    } else if (jenis === 'satuan') {
        qtyLabel.textContent = 'Jumlah (Qty) *';
        const categories = PRICE_CONFIG.satuan.categories;
        for (const [key, cat] of Object.entries(categories)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = cat.label;
            paketSelect.appendChild(option);
        }
        document.getElementById('qty').step = '1';
        document.getElementById('qty').min = '0';
        document.getElementById('qty').value = 1;
    }
}

function updateDetailOptions() {
    const jenis = document.getElementById('jenisLaundry').value;
    const paket = document.getElementById('paket').value;
    const detailSelect = document.getElementById('detailItem');
    const detailGroup = document.getElementById('detailGroup');
    
    detailSelect.innerHTML = '<option value="">Pilih Detail</option>';
    detailGroup.style.display = 'none';
    
    if (jenis === 'satuan' && paket) {
        const category = PRICE_CONFIG.satuan.categories[paket];
        if (category) {
            detailGroup.style.display = 'block';
            const prices = category.prices;
            for (const [key, price] of Object.entries(prices)) {
                const option = document.createElement('option');
                option.value = key;
                const label = key === 'regular' ? 'Regular' : 
                             key === '2_hari' ? '2 Hari' : 
                             key === 'express' ? 'Express' :
                             key === 'kecil' ? 'Kecil' :
                             key === 'sedang' ? 'Sedang' : 'Besar';
                option.textContent = `${label} - Rp ${formatNumber(price)}`;
                detailSelect.appendChild(option);
            }
        }
    }
}

// ============================================
// CALCULATION
// ============================================

function calculateTotal() {
    const jenis = document.getElementById('jenisLaundry').value;
    const paket = document.getElementById('paket').value;
    const detail = document.getElementById('detailItem').value;
    const qty = parseFloat(document.getElementById('qty').value) || 0;
    let total = 0;
    
    if (jenis === 'kiloan') {
        const pkg = PRICE_CONFIG.kiloan.packages[paket];
        if (pkg) {
            const weight = Math.max(qty, PRICE_CONFIG.kiloan.minWeight);
            total = weight * pkg.price;
        }
    } else if (jenis === 'satuan') {
        if (paket === 'bedcover') {
            const prices = PRICE_CONFIG.satuan.categories.bedcover.prices;
            total = (prices[detail] || 0) * Math.max(qty, 1);
        } else if (paket && detail) {
            const category = PRICE_CONFIG.satuan.categories[paket];
            if (category) {
                total = (category.prices[detail] || 0) * Math.max(qty, 1);
            }
        }
    }
    
    document.getElementById('totalHarga').value = `Rp ${formatNumber(total)}`;
    return total;
}

// ============================================
// SUBMIT ORDER
// ============================================

function submitOrder(event) {
    event.preventDefault();
    
    const order = {
        id: document.getElementById('orderId').value,
        tanggalMasuk: document.getElementById('tanggalMasuk').value,
        namaCustomer: document.getElementById('namaCustomer').value.trim(),
        noHp: document.getElementById('noHp').value.trim(),
        jenisLaundry: document.getElementById('jenisLaundry').value,
        paket: document.getElementById('paket').value,
        detailItem: document.getElementById('detailItem').value,
        qty: parseFloat(document.getElementById('qty').value) || 0,
        total: parseInt(calculateTotal()),
        status: document.getElementById('status').value,
        catatan: document.getElementById('catatan').value.trim(),
        createdAt: new Date().toISOString()
    };
    
    // Validation
    if (!order.namaCustomer) {
        showToast('Mohon isi nama customer', 'error');
        return;
    }
    if (!order.noHp) {
        showToast('Mohon isi nomor HP', 'error');
        return;
    }
    if (!order.jenisLaundry) {
        showToast('Pilih jenis laundry', 'error');
        return;
    }
    if (!order.paket) {
        showToast('Pilih paket', 'error');
        return;
    }
    if (order.qty <= 0) {
        showToast('Masukkan berat/jumlah yang valid', 'error');
        return;
    }
    if (order.total <= 0) {
        showToast('Total harga tidak valid', 'error');
        return;
    }
    
    // Add to orders
    order._id = Date.now().toString();
    orders.unshift(order);
    saveOrders();
    renderOrders();
    hideForm();
    showToast(`✅ Order ${order.id} berhasil disimpan!`, 'success');
    
    // Auto push after saving
    setTimeout(() => pushData(), 1000);
}

// ============================================
// RENDER ORDERS
// ============================================

function renderOrders() {
    const list = document.getElementById('orderList');
    const filtered = getFilteredOrders();
    
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>Belum ada order hari ini</p>
            </div>
        `;
        updateStats();
        return;
    }
    
    list.innerHTML = filtered.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-date">${formatDate(order.tanggalMasuk)}</span>
            </div>
            <div class="order-customer">${order.namaCustomer}</div>
            <div class="order-detail">
                ${getOrderDetailText(order)}
            </div>
            <div class="order-price">Rp ${formatNumber(order.total)}</div>
            <div class="order-footer">
                <span class="order-phone">📱 ${order.noHp}</span>
                <button class="status-badge status-${order.status.toLowerCase()}" 
                        onclick="updateStatus('${order._id}')">
                    ${order.status}
                </button>
            </div>
        </div>
    `).join('');
    
    updateStats();
}

function getOrderDetailText(order) {
    let text = '';
    const jenis = order.jenisLaundry;
    const paket = order.paket;
    
    if (jenis === 'kiloan') {
        const pkg = PRICE_CONFIG.kiloan.packages[paket];
        text = `${pkg ? pkg.label : paket} • ${order.qty} Kg`;
    } else if (jenis === 'satuan') {
        const category = PRICE_CONFIG.satuan.categories[paket];
        if (paket === 'bedcover') {
            const detailLabel = order.detailItem === 'kecil' ? 'Kecil' :
                               order.detailItem === 'sedang' ? 'Sedang' : 'Besar';
            text = `Bedcover ${detailLabel} • ${order.qty} pcs`;
        } else if (category) {
            const detailLabel = order.detailItem === 'regular' ? 'Regular' :
                               order.detailItem === '2_hari' ? '2 Hari' : 'Express';
            text = `${category.label} ${detailLabel} • ${order.qty} pcs`;
        } else {
            text = `${order.jenisLaundry} • ${order.qty}`;
        }
    }
    return text;
}

// ============================================
// FILTER & SEARCH
// ============================================

function filterOrders() {
    renderOrders();
}

function getFilteredOrders() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!search) return orders;
    
    return orders.filter(order => 
        order.namaCustomer.toLowerCase().includes(search) ||
        order.id.toLowerCase().includes(search) ||
        order.noHp.includes(search)
    );
}

// ============================================
// UPDATE STATUS
// ============================================

function updateStatus(orderId) {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    
    const statuses = ['Masuk', 'Selesai', 'Diambil'];
    const currentIndex = statuses.indexOf(order.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    order.status = statuses[nextIndex];
    
    saveOrders();
    renderOrders();
    showToast(`Status berubah menjadi ${order.status}`, 'success');
    
    // Auto push after status change
    setTimeout(() => pushData(), 1000);
}

// ============================================
// STATS UPDATE
// ============================================

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.tanggalMasuk === today);
    
    document.getElementById('totalOrders').textContent = todayOrders.length;
    document.getElementById('totalRevenue').textContent = `Rp ${formatNumber(
        todayOrders.reduce((sum, o) => sum + o.total, 0)
    )}`;
    
    document.getElementById('statusMasuk').textContent = 
        todayOrders.filter(o => o.status === 'Masuk').length;
    document.getElementById('statusSelesai').textContent = 
        todayOrders.filter(o => o.status === 'Selesai').length;
    document.getElementById('statusDiambil').textContent = 
        todayOrders.filter(o => o.status === 'Diambil').length;
}

// ============================================
// LOCAL STORAGE
// ============================================

function saveOrders() {
    try {
        localStorage.setItem('putraYusufOrders', JSON.stringify(orders));
        localStorage.setItem('putraYusufOrderId', String(currentOrderId));
    } catch (e) {
        console.error('Error saving orders:', e);
    }
}

function loadOrders() {
    try {
        const saved = localStorage.getItem('putraYusufOrders');
        if (saved) {
            orders = JSON.parse(saved);
            // Ensure each order has _id
            orders.forEach(o => {
                if (!o._id) o._id = Date.now().toString() + Math.random().toString(36);
            });
        }
        const savedId = localStorage.getItem('putraYusufOrderId');
        if (savedId) {
            currentOrderId = parseInt(savedId);
        }
    } catch (e) {
        console.error('Error loading orders:', e);
        orders = [];
    }
}

// ============================================
// PUSH & PULL DATA
// ============================================

async function pushData() {
    if (orders.length === 0) {
        showToast('Tidak ada data untuk di-push', 'error');
        return;
    }
    
    showToast('📤 Mengirim data...', '');
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'push',
                data: orders,
                store: CONFIG.STORE_NAME
            })
        });
        
        // Karena mode no-cors, response tidak bisa dibaca
        showToast('✅ Data berhasil dikirim!', 'success');
    } catch (error) {
        console.error('Push error:', error);
        showToast('⚠️ Gagal mengirim data. Coba lagi.', 'error');
    }
}

async function pullData() {
    showToast('📥 Mengambil data...', '');
    
    try {
        const response = await fetch(`${CONFIG.API_URL}?action=pull&store=${encodeURIComponent(CONFIG.STORE_NAME)}`);
        const data = await response.json();
        
        if (data && data.orders && data.orders.length > 0) {
            // Merge with local data (avoid duplicates)
            const existingIds = new Set(orders.map(o => o._id));
            const newOrders = data.orders.filter(o => !existingIds.has(o._id));
            
            if (newOrders.length > 0) {
                orders = [...newOrders, ...orders];
                saveOrders();
                renderOrders();
                showToast(`✅ Berhasil mengambil ${newOrders.length} data baru!`, 'success');
            } else {
                showToast('📋 Tidak ada data baru', '');
            }
        } else {
            showToast('📋 Tidak ada data di server', '');
        }
    } catch (error) {
        console.error('Pull error:', error);
        showToast('⚠️ Gagal mengambil data. Cek koneksi.', 'error');
    }
}

// ============================================
// TOAST NOTIFICATION
// ============================================

let toastTimeout;

function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';
    
    clearTimeout(toastTimeout);
    
    // Force reflow for animation
    void toast.offsetWidth;
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 3000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', function(e) {
    // Escape to close form
    if (e.key === 'Escape' && document.getElementById('formSection').style.display !== 'none') {
        hideForm();
    }
});

// ============================================
// EXPOSE TO CONSOLE FOR DEBUGGING
// ============================================

console.log('🧺 Putra Yusuf Laundry App loaded!');
console.log('📋 Total orders:', orders.length);
console.log('💡 Type "orders" in console to view all data');