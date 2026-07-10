
// ======================== DATA STORE ========================
let users = JSON.parse(localStorage.getItem('tradingProUsers')) || [];
let transactions = JSON.parse(localStorage.getItem('tradingProTransactions')) || [];
let currentUser = JSON.parse(localStorage.getItem('tradingProCurrentUser')) || null;
let goldInvestments = JSON.parse(localStorage.getItem('tradingProGoldInvestments')) || [];
let pollingInterval = null;

// ======================== GOLD PACKAGES ========================
const goldPackages = [
    { id: 1, name: 'Emas Mini', price: 50000, profit: 10, duration: 15, icon: 'fa-coins', color: '#fbbf24' },
    { id: 2, name: 'Emas Kecil', price: 100000, profit: 10, duration: 15, icon: 'fa-coins', color: '#f59e0b' },
    { id: 3, name: 'Emas Sedang', price: 250000, profit: 10, duration: 15, icon: 'fa-coins', color: '#d97706' },
    { id: 4, name: 'Emas Standar', price: 500000, profit: 10, duration: 15, icon: 'fa-coins', color: '#b45309' },
    { id: 5, name: 'Emas Premium', price: 1000000, profit: 10, duration: 15, icon: 'fa-crown', color: '#92400e' },
    { id: 6, name: 'Emas Pro', price: 2500000, profit: 10, duration: 15, icon: 'fa-crown', color: '#78350f' },
    { id: 7, name: 'Emas Platinum', price: 5000000, profit: 10, duration: 15, icon: 'fa-crown', color: '#fbbf24' },
    { id: 8, name: 'Emas Gold', price: 7500000, profit: 12, duration: 15, icon: 'fa-crown', color: '#f59e0b' },
    { id: 9, name: 'Emas Exclusive', price: 10000000, profit: 12, duration: 15, icon: 'fa-crown', color: '#d97706' },
    { id: 10, name: 'Emas Ultimate', price: 15000000, profit: 15, duration: 15, icon: 'fa-crown', color: '#b45309' }
];

// ============================================================
// 1. AUTH FUNCTIONS
// ============================================================

async function loginUser() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!email || !password) {
        showNotification('Email dan password harus diisi!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('tradingProCurrentUser', JSON.stringify(currentUser));
            showDashboard();
            showNotification(`Selamat datang ${currentUser.name}!`, 'success');
        } else {
            showNotification(data.message || 'Login gagal!', 'error');
        }
    } catch (error) {
        showNotification('Gagal terhubung ke server!', 'error');
        console.error('Login error:', error);
    }
}

async function registerUser() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    
    if (!name || !email || !phone || !password) {
        showNotification('Semua field harus diisi!', 'error');
        return;
    }
    if (password.length < 6) {
        showNotification('Password minimal 6 karakter!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Akun berhasil didaftarkan! Silakan login.', 'success');
            showLogin();
            document.getElementById('regName').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPhone').value = '';
            document.getElementById('regPassword').value = '';
        } else {
            showNotification(data.message || 'Gagal daftar!', 'error');
        }
    } catch (error) {
        showNotification('Gagal terhubung ke server!', 'error');
        console.error('Register error:', error);
    }
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function logoutUser() {
    if (!confirm('Yakin ingin logout?')) return;
    currentUser = null;
    localStorage.removeItem('tradingProCurrentUser');
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('authPage').style.display = 'flex';
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    showNotification('Anda telah logout', 'info');
}

function showDashboard() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    const adminMenu = document.getElementById('adminMenu');
    if (adminMenu) {
        if (currentUser && currentUser.isAdmin === true) {
            adminMenu.style.display = 'flex';
            adminMenu.style.visibility = 'visible';
        } else {
            adminMenu.style.display = 'none';
            adminMenu.style.visibility = 'hidden';
        }
    }
    
    updateUI();
    initChart();
    loadTransactions();
    loadGoldInvestments();
    checkCompletedInvestments();
}

function isAdmin() {
    return currentUser && currentUser.isAdmin === true;
}

function checkAdminAccess() {
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu!', 'error');
        return false;
    }
    if (!isAdmin()) {
        showNotification('⛔ Akses Ditolak! Hanya untuk Administrator.', 'error');
        document.querySelector('[data-page="dashboard"]')?.click();
        return false;
    }
    return true;
}

// ============================================================
// 2. DEPOSIT (QRIS)
// ============================================================

function setDeposit(amount) {
    document.getElementById('depositAmount').value = amount;
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    const btns = document.querySelectorAll('.amount-btn');
    btns.forEach(b => {
        if (parseInt(b.textContent.replace(/[Rp,.]/g, '')) === amount) {
            b.classList.add('active');
        }
    });
}

function selectMethod(el, method) {
    document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
}

async function processDeposit() {
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu!', 'error');
        return;
    }
    
    const amount = parseInt(document.getElementById('depositAmount').value);
    if (!amount || amount < 1000) {
        showNotification('Minimal deposit Rp 1.000', 'error');
        return;
    }
    if (amount > 100000000) {
        showNotification('Maksimal deposit Rp 100.000.000', 'error');
        return;
    }
    
    showSpinner();
    
    try {
        const response = await fetch(`${API_URL}/create-qris`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                amount: amount,
                description: `Deposit ${currentUser.name} - Order #${Date.now()}`
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('qrisAmount').textContent = `Rp ${amount.toLocaleString()}`;
            document.getElementById('qrisModal').classList.add('active');
            document.getElementById('qrisStatus').innerHTML = `
                <div class="status-pulse"></div>
                <span>⏳ Menunggu pembayaran...</span>
            `;
            
            const qrContainer = document.getElementById('qrisCode');
            qrContainer.innerHTML = `
                <img src="${data.data.qrisCode}" alt="QRIS Code" style="max-width:100%;border-radius:8px;">
                <p style="margin-top:10px;font-size:12px;color:#6b85a3;">
                    📱 Scan QRIS dengan GoPay, OVO, DANA, ShopeePay, atau Bank
                </p>
                <p style="font-size:11px;color:#92400e;background:#fef3c7;padding:8px;border-radius:8px;">
                    ⏱ QRIS kadaluarsa dalam 30 menit
                </p>
            `;
            
            const orderId = data.data.orderId;
            startPolling(orderId, amount);
            
        } else {
            showNotification(data.message || 'Gagal membuat QRIS!', 'error');
        }
    } catch (error) {
        showNotification('Gagal terhubung ke server!', 'error');
        console.error('Deposit error:', error);
    }
    
    hideSpinner();
}

// ============================================================
// 3. POLLING CEK STATUS
// ============================================================

function startPolling(orderId, amount) {
    let attempts = 0;
    const maxAttempts = 60;
    
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    pollingInterval = setInterval(async () => {
        attempts++;
        console.log(`🔄 Cek status #${attempts}...`);
        
        try {
            const response = await fetch(`${API_URL}/check-payment/${orderId}`);
            const data = await response.json();
            
            if (data.success) {
                if (data.data.isPaid || data.data.dbStatus === 'success') {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    
                    document.getElementById('qrisStatus').innerHTML = `
                        <div class="status-pulse" style="background:#10b981;"></div>
                        <span style="color:#065f46;font-weight:600;">✅ Pembayaran berhasil!</span>
                    `;
                    
                    setTimeout(() => {
                        closeQRIS();
                        refreshUserData();
                        loadTransactions();
                        showNotification(`💰 Deposit Rp ${amount.toLocaleString()} berhasil!`, 'success');
                        updateUI();
                    }, 1500);
                    
                } else if (data.data.status === 'expired' || data.data.status === 'failed') {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    
                    document.getElementById('qrisStatus').innerHTML = `
                        <div class="status-pulse" style="background:#ef4444;"></div>
                        <span style="color:#991b1b;">❌ QRIS kadaluarsa atau gagal</span>
                    `;
                    showNotification('QRIS kadaluarsa! Silakan buat ulang.', 'error');
                    
                } else if (attempts >= maxAttempts) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    
                    document.getElementById('qrisStatus').innerHTML = `
                        <div class="status-pulse" style="background:#f59e0b;"></div>
                        <span>⏳ Waktu habis. Klik "Cek Status" jika sudah bayar</span>
                    `;
                    
                    const qrisBody = document.querySelector('.qris-body');
                    const existingBtn = qrisBody.querySelector('.manual-check-btn');
                    if (!existingBtn) {
                        const manualBtn = document.createElement('button');
                        manualBtn.className = 'btn-primary btn-block manual-check-btn';
                        manualBtn.innerHTML = '<i class="fas fa-sync"></i> Cek Status Pembayaran';
                        manualBtn.onclick = function() {
                            manualCheckPayment(orderId, amount);
                        };
                        qrisBody.appendChild(manualBtn);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Polling error:', error);
        }
    }, 5000);
}

async function manualCheckPayment(orderId, amount) {
    showSpinner();
    try {
        const response = await fetch(`${API_URL}/check-payment/${orderId}`);
        const data = await response.json();
        
        if (data.success && data.data.isPaid) {
            document.getElementById('qrisStatus').innerHTML = `
                <div class="status-pulse" style="background:#10b981;"></div>
                <span style="color:#065f46;font-weight:600;">✅ Pembayaran berhasil!</span>
            `;
            
            setTimeout(() => {
                closeQRIS();
                refreshUserData();
                loadTransactions();
                showNotification(`💰 Deposit berhasil!`, 'success');
                updateUI();
            }, 1500);
        } else {
            showNotification('Pembayaran belum terdeteksi. Silakan tunggu atau hubungi admin.', 'warning');
        }
    } catch (error) {
        showNotification('Gagal cek status!', 'error');
    }
    hideSpinner();
}

function closeQRIS() {
    document.getElementById('qrisModal').classList.remove('active');
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// ============================================================
// 4. WITHDRAW (PENARIKAN)
// ============================================================

async function processWithdraw() {
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu!', 'error');
        return;
    }
    
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    if (!amount || amount < 10000) {
        showNotification('Minimal penarikan Rp 10.000', 'error');
        return;
    }
    if (amount > currentUser.balance) {
        showNotification('Saldo tidak mencukupi!', 'error');
        return;
    }
    
    const bankName = prompt('Masukkan nama bank (contoh: BCA, GoPay, DANA):', 'BCA');
    if (!bankName) return;
    
    const bankAccount = prompt('Masukkan nomor rekening/HP:', '');
    if (!bankAccount) return;
    
    const bankHolder = prompt('Masukkan nama pemilik rekening:', currentUser.name);
    if (!bankHolder) return;
    
    if (!confirm(
        `💳 PENARIKAN\n\n` +
        `Jumlah: Rp ${amount.toLocaleString()}\n` +
        `Bank: ${bankName}\n` +
        `No Rekening: ${bankAccount}\n` +
        `Nama: ${bankHolder}\n\n` +
        `Yakin ingin menarik dana?`
    )) return;
    
    showSpinner();
    
    try {
        const response = await fetch(`${API_URL}/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                amount: amount,
                bankName: bankName,
                bankAccount: bankAccount,
                bankHolder: bankHolder
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`✅ ${data.message}`, 'success');
            refreshUserData();
            loadTransactions();
            updateUI();
            addActivity(`💳 Withdraw <strong>Rp ${amount.toLocaleString()}</strong> ke ${bankName} berhasil`);
        } else {
            showNotification(data.message || 'Gagal melakukan penarikan!', 'error');
        }
    } catch (error) {
        showNotification('Gagal terhubung ke server!', 'error');
        console.error('Withdraw error:', error);
    }
    
    hideSpinner();
}

// ============================================================
// 5. REFRESH DATA
// ============================================================

async function refreshUserData() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/user/${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('tradingProCurrentUser', JSON.stringify(currentUser));
            updateUI();
        }
    } catch (error) {
        console.error('Refresh user error:', error);
    }
}

async function loadTransactions() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/transactions/${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            transactions = data.transactions;
            localStorage.setItem('tradingProTransactions', JSON.stringify(transactions));
            updateHistory();
        }
    } catch (error) {
        console.error('Load transactions error:', error);
    }
}

// ============================================================
// 6. INVESTASI EMAS
// ============================================================

async function investGold(packageId) {
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu!', 'error');
        return;
    }
    
    const pkg = goldPackages.find(p => p.id === packageId);
    if (!pkg) return;
    
    const existingActive = goldInvestments.find(inv => 
        inv.userId === currentUser.id && 
        inv.packageId === packageId && 
        inv.status === 'active'
    );
    if (existingActive) {
        showNotification(`Anda sudah memiliki investasi ${pkg.name} yang aktif!`, 'warning');
        return;
    }
    
    if (!confirm(
        `💰 INVESTASI ${pkg.name}\n\n` +
        `Harga: Rp ${pkg.price.toLocaleString()}\n` +
        `Profit: ${pkg.profit}%\n` +
        `Durasi: ${pkg.duration} hari\n\n` +
        `Saldo Anda: Rp ${currentUser.balance.toLocaleString()}\n` +
        `Saldo setelah investasi: Rp ${(currentUser.balance - pkg.price).toLocaleString()}\n\n` +
        `Yakin ingin investasi?`
    )) return;
    
    showSpinner();
    
    try {
        const response = await fetch(`${API_URL}/invest-gold`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                packageId: packageId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            refreshUserData();
            loadGoldInvestments();
            updateUI();
            addActivity(`💰 Investasi <strong>${pkg.name}</strong> sebesar Rp ${pkg.price.toLocaleString()}`);
        } else {
            showNotification(data.message || 'Gagal investasi!', 'error');
        }
    } catch (error) {
        showNotification('Gagal terhubung ke server!', 'error');
        console.error('Invest gold error:', error);
    }
    
    hideSpinner();
}

async function loadGoldInvestments() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/gold-investments/${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            goldInvestments = data.investments;
            localStorage.setItem('tradingProGoldInvestments', JSON.stringify(goldInvestments));
            updateGoldInvestments();
        }
    } catch (error) {
        console.error('Load gold investments error:', error);
    }
}

async function checkCompletedInvestments() {
    try {
        const response = await fetch(`${API_URL}/check-gold-investments`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success && data.completed > 0) {
            refreshUserData();
            loadGoldInvestments();
            showNotification(`💰 ${data.message}`, 'success');
        }
    } catch (error) {
        console.error('Check completed investments error:', error);
    }
}

// ============================================================
// 7. UPDATE UI
// ============================================================

function updateUI() {
    if (!currentUser) return;
    
    const balance = currentUser.balance || 0;
    document.getElementById('userBalance').textContent = `Rp ${balance.toLocaleString()}`;
    document.getElementById('depositCurrentBalance').textContent = `Rp ${balance.toLocaleString()}`;
    document.getElementById('withdrawBalance').textContent = `Rp ${balance.toLocaleString()}`;
    document.getElementById('portfolioValue').textContent = `Rp ${balance.toLocaleString()}`;
    document.getElementById('goldBalance').textContent = `Rp ${balance.toLocaleString()}`;
    
    document.getElementById('displayName').textContent = currentUser.name;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profilePhone').textContent = currentUser.phone || '-';
    document.getElementById('memberSince').textContent = currentUser.joined || 'Baru';
    
    const userRole = document.getElementById('displayRole');
    const profileLevel = document.getElementById('profileLevel');
    if (userRole) {
        userRole.textContent = currentUser.isAdmin ? '👑 Administrator' : (currentUser.level || 'Member');
        userRole.style.color = currentUser.isAdmin ? '#fbbf24' : '#b0c4de';
    }
    if (profileLevel) {
        profileLevel.textContent = currentUser.isAdmin ? '👑 Admin' : (currentUser.level || 'Standard');
    }
    
    const avatarImg = document.getElementById('profileAvatar');
    if (avatarImg) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=3b82f6&color=fff&size=120`;
    }
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) {
        sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=3b82f6&color=fff&size=40`;
    }
    
    const userTxs = transactions.filter(t => t.userId === currentUser.id);
    const totalDeposit = userTxs.filter(t => t.type === 'deposit' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0);
    const totalWithdraw = userTxs.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0);
    
    document.getElementById('totalDepositDisplay').textContent = `Rp ${totalDeposit.toLocaleString()}`;
    document.getElementById('totalWithdrawDisplay').textContent = `Rp ${totalWithdraw.toLocaleString()}`;
    document.getElementById('totalTransactions').textContent = userTxs.length;
    document.getElementById('totalTrans').textContent = userTxs.length;
    document.getElementById('notifBadge').textContent = userTxs.filter(t => t.status === 'pending').length;
    
    if (isAdmin()) {
        document.getElementById('adminTotalUsers').textContent = users.length || '0';
        const allDeposit = transactions.filter(t => t.type === 'deposit' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0);
        const allWithdraw = transactions.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0);
        document.getElementById('adminTotalDeposit').textContent = `Rp ${allDeposit.toLocaleString()}`;
        document.getElementById('adminTotalWithdraw').textContent = `Rp ${allWithdraw.toLocaleString()}`;
        document.getElementById('adminPending').textContent = transactions.filter(t => t.status === 'pending').length;
        updateUserTable();
        updateAdminTransactionTable();
    }
    
    updateHistory();
    updateGoldInvestments();
}

// ============================================================
// 8. HISTORY
// ============================================================

function updateHistory() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    const userTxs = transactions.filter(t => t.userId === currentUser.id);
    const totalDeposit = userTxs.filter(t => t.type === 'deposit' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0);
    const totalWithdraw = userTxs.filter(t => t.type === 'withdraw' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0);
    
    document.getElementById('historyTotalDeposit').textContent = `Rp ${totalDeposit.toLocaleString()}`;
    document.getElementById('historyTotalWithdraw').textContent = `Rp ${totalWithdraw.toLocaleString()}`;
    document.getElementById('historyTotalCount').textContent = userTxs.length;
    
    if (userTxs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#6b85a3;padding:30px;"><i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;"></i>Belum ada transaksi</td></tr>`;
        return;
    }
    
    const typeFilter = document.getElementById('historyFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    let filtered = userTxs;
    if (typeFilter !== 'all') filtered = filtered.filter(t => t.type === typeFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter);
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#6b85a3;padding:30px;"><i class="fas fa-search" style="font-size:24px;display:block;margin-bottom:8px;"></i>Tidak ada transaksi dengan filter ini</td></tr>`;
        return;
    }
    
    tbody.innerHTML = '';
    filtered.slice().reverse().forEach((t, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${t.date || '-'}</td>
            <td><span class="type-badge ${t.type}">${t.type === 'deposit' ? '💰 Deposit' : '💳 Withdraw'}</span></td>
            <td>Rp ${t.amount.toLocaleString()}</td>
            <td>${t.method || 'QRIS'}</td>
            <td><span class="status-badge ${t.status}">${t.status === 'success' ? '✅ Sukses' : t.status === 'pending' ? '⏳ Pending' : '❌ Gagal'}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function filterHistory() { updateHistory(); }

function exportHistory() {
    const userTxs = transactions.filter(t => t.userId === currentUser.id);
    if (userTxs.length === 0) { showNotification('Belum ada transaksi!', 'error'); return; }
    showSpinner();
    setTimeout(() => {
        hideSpinner();
        const blob = new Blob([JSON.stringify(userTxs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `riwayat-transaksi-${currentUser.name}-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        showNotification('Riwayat berhasil diexport!', 'success');
    }, 1000);
}

// ============================================================
// 9. GOLD INVESTMENTS UI
// ============================================================

function updateGoldInvestments() {
    const container = document.getElementById('goldInvestmentsContainer');
    if (!container) return;
    
    const userInvestments = goldInvestments.filter(inv => inv.userId === currentUser?.id);
    
    if (userInvestments.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fas fa-box-open"></i>
                <p>Belum ada investasi emas</p>
                <p class="empty-sub">Pilih paket di bawah untuk mulai investasi</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    const sorted = [...userInvestments].reverse();
    
    sorted.forEach(inv => {
        const pkg = goldPackages.find(p => p.id === inv.packageId);
        const start = new Date(inv.startDate);
        const end = new Date(inv.endDate);
        const now = new Date();
        const totalDays = inv.duration || 15;
        const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        const remaining = Math.max(0, totalDays - elapsed);
        const progress = Math.min(100, (elapsed / totalDays) * 100);
        
        let statusText = '🟡 Aktif';
        let statusClass = 'active';
        let profitAmount = 0;
        let cardClass = '';
        
        if (inv.status === 'completed') {
            statusText = '✅ Selesai';
            statusClass = 'completed';
            cardClass = 'completed';
            profitAmount = inv.amount * (inv.profit / 100);
        } else if (inv.status === 'cancelled') {
            statusText = '❌ Dibatalkan';
            statusClass = 'cancelled';
            cardClass = 'cancelled';
        } else if (now >= end) {
            inv.status = 'completed';
            profitAmount = inv.amount * (inv.profit / 100);
            localStorage.setItem('tradingProGoldInvestments', JSON.stringify(goldInvestments));
            statusText = '✅ Selesai';
            statusClass = 'completed';
            cardClass = 'completed';
            showNotification(`💰 Investasi ${inv.packageName} selesai!`, 'success');
            refreshUserData();
        }
        
        const card = document.createElement('div');
        card.className = `gold-investment-card ${cardClass}`;
        card.innerHTML = `
            <div class="gold-investment-header">
                <div class="gold-investment-icon" style="background:${pkg?.color || '#fbbf24'}">
                    <i class="fas ${pkg?.icon || 'fa-coins'}"></i>
                </div>
                <div class="gold-investment-info">
                    <h4>${inv.packageName}</h4>
                    <span class="gold-investment-amount">Rp ${inv.amount.toLocaleString()}</span>
                </div>
                <span class="gold-investment-status ${statusClass}">${statusText}</span>
            </div>
            <div class="gold-investment-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${progress}%"></div>
                </div>
                <div class="progress-info">
                    <span>${Math.min(elapsed, totalDays)} hari / ${totalDays} hari</span>
                    <span>${Math.round(progress)}%</span>
                </div>
            </div>
            <div class="gold-investment-footer">
                <div class="gold-investment-timer">
                    <i class="fas fa-clock"></i>
                    <span id="timer-${inv.id}">${formatTime(remaining)}</span>
                </div>
                <div class="gold-investment-profit">
                    <span>Profit: <strong>${inv.profit}%</strong></span>
                    ${inv.status === 'completed' ? `<span class="profit-amount">+Rp ${profitAmount.toLocaleString()}</span>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
        
        if (inv.status === 'active') {
            const timerElement = document.getElementById(`timer-${inv.id}`);
            if (timerElement) {
                let remainingSeconds = remaining * 24 * 60 * 60;
                const timerInterval = setInterval(() => {
                    remainingSeconds--;
                    if (remainingSeconds <= 0) {
                        clearInterval(timerInterval);
                        loadGoldInvestments();
                        refreshUserData();
                        return;
                    }
                    const days = Math.floor(remainingSeconds / (24 * 60 * 60));
                    const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60));
                    const minutes = Math.floor((remainingSeconds % (60 * 60)) / 60);
                    const seconds = Math.floor(remainingSeconds % 60);
                    timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                }, 1000);
            }
        }
    });
}

function formatTime(days) {
    if (days <= 0) return '00:00:00';
    const totalHours = days * 24;
    const h = Math.floor(totalHours);
    const m = Math.floor((totalHours - h) * 60);
    const s = Math.floor(((totalHours - h) * 60 - m) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ============================================================
// 10. ADMIN FUNCTIONS
// ============================================================

document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        if (!checkAdminAccess()) return;
        const tabId = this.dataset.tab;
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});

function searchUsers() {
    if (!checkAdminAccess()) return;
    const search = document.getElementById('userSearch').value.toLowerCase();
    document.querySelectorAll('#userTableBody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
}

function addUser() {
    if (!checkAdminAccess()) return;
    const name = prompt('Masukkan nama pengguna:'); if (!name) return;
    const email = prompt('Masukkan email:'); if (!email) return;
    const phone = prompt('Masukkan nomor HP:'); if (!phone) return;
    const password = prompt('Masukkan password (min 6 karakter):'); 
    if (!password || password.length < 6) { showNotification('Password minimal 6 karakter!', 'error'); return; }
    
    showSpinner();
    fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
    })
    .then(res => res.json())
    .then(data => {
        hideSpinner();
        if (data.success) {
            showNotification(`Pengguna ${name} berhasil ditambahkan!`, 'success');
            refreshUserData();
            loadTransactions();
        } else {
            showNotification(data.message || 'Gagal menambah pengguna!', 'error');
        }
    })
    .catch(err => {
        hideSpinner();
        showNotification('Gagal terhubung ke server!', 'error');
    });
}

function editUser(id) {
    if (!checkAdminAccess()) return;
    const user = users.find(u => u.id === id);
    if (!user) return;
    if (user.id === currentUser.id) { showNotification('Tidak bisa edit akun sendiri!', 'error'); return; }
    const newName = prompt('Edit nama:', user.name);
    if (newName) {
        user.name = newName;
        localStorage.setItem('tradingProUsers', JSON.stringify(users));
        updateUI();
        showNotification('Data berhasil diupdate!', 'success');
    }
}

function deleteUser(id) {
    if (!checkAdminAccess()) return;
    const user = users.find(u => u.id === id);
    if (!user) return;
    if (user.id === currentUser.id) { showNotification('Tidak bisa hapus akun sendiri!', 'error'); return; }
    if (user.isAdmin) { showNotification('Tidak bisa menghapus Admin!', 'error'); return; }
    if (!confirm(`Hapus pengguna ${user.name}?`)) return;
    users = users.filter(u => u.id !== id);
    localStorage.setItem('tradingProUsers', JSON.stringify(users));
    updateUI();
    showNotification('Pengguna dihapus!', 'success');
}

function updateUserTable() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (!isAdmin()) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444;padding:20px;">⛔ Akses Ditolak!</td></tr>`;
        return;
    }
    
    const userList = users.length > 0 ? users : JSON.parse(localStorage.getItem('tradingProUsers')) || [];
    
    if (userList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#6b85a3;padding:20px;">Belum ada pengguna</td></tr>`;
        return;
    }
    
    userList.forEach((user, index) => {
        const isCurrentUser = user.id === currentUser?.id;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="user-cell">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${user.isAdmin ? 'fbbf24' : '3b82f6'}&color=fff&size=30" alt="">
                    ${user.name}
                    ${isCurrentUser ? ' <span style="color:#3b82f6;font-size:11px;">(Anda)</span>' : ''}
                </div>
            </td>
            <td>${user.email}</td>
            <td>Rp ${(user.balance || 0).toLocaleString()}</td>
            <td>
                <span class="status-badge ${user.isAdmin ? 'active' : 'pending'}" 
                      style="${user.isAdmin ? 'background:#fbbf24;color:#78350f;' : ''}">
                    ${user.isAdmin ? '👑 Admin' : (user.level || 'Standard')}
                </span>
            </td>
            <td>
                ${!isCurrentUser ? `
                    <button class="action-btn" onclick="editUser(${user.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${!user.isAdmin ? `
                        <button class="action-btn" onclick="deleteUser(${user.id})" title="Hapus" style="color:#ef4444;">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : `
                        <span style="color:#6b85a3;font-size:11px;">Admin</span>
                    `}
                ` : `
                    <span style="color:#6b85a3;font-size:11px;">Anda</span>
                `}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateAdminTransactionTable() {
    const tbody = document.getElementById('adminTransactionBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (!isAdmin()) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:20px;">⛔ Akses Ditolak!</td></tr>`;
        return;
    }
    
    const txList = transactions.length > 0 ? transactions : JSON.parse(localStorage.getItem('tradingProTransactions')) || [];
    
    if (txList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#6b85a3;padding:20px;">Belum ada transaksi</td></tr>`;
        return;
    }
    
    const typeFilter = document.getElementById('adminTxFilter')?.value || 'all';
    const statusFilter = document.getElementById('adminStatusFilter')?.value || 'all';
    
    let filtered = [...txList];
    if (typeFilter !== 'all') filtered = filtered.filter(t => t.type === typeFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter);
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#6b85a3;padding:20px;">Tidak ada transaksi dengan filter ini</td></tr>`;
        return;
    }
    
    filtered.slice().reverse().forEach((t, index) => {
        const user = users.find(u => u.id === t.userId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#TRX${String(index + 1).padStart(3, '0')}</td>
            <td>${user ? user.name : 'Unknown'}</td>
            <td><span class="status-badge ${t.type === 'deposit' ? 'active' : 'pending'}">${t.type}</span></td>
            <td>Rp ${t.amount.toLocaleString()}</td>
            <td>${t.method || 'QRIS'}</td>
            <td><span class="status-badge ${t.status}">${t.status}</span></td>
            <td>${t.date || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

function filterAdminTx() { updateAdminTransactionTable(); }

function exportAdminTx() {
    if (!checkAdminAccess()) return;
    if (transactions.length === 0) { showNotification('Belum ada transaksi!', 'error'); return; }
    showSpinner();
    setTimeout(() => {
        hideSpinner();
        const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all-transactions-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        showNotification('Semua transaksi diexport!', 'success');
    }, 1000);
}

function exportData() {
    if (!checkAdminAccess()) return;
    showSpinner();
    setTimeout(() => {
        hideSpinner();
        const data = { 
            users: JSON.parse(localStorage.getItem('tradingProUsers')) || [],
            transactions: JSON.parse(localStorage.getItem('tradingProTransactions')) || [],
            goldInvestments: JSON.parse(localStorage.getItem('tradingProGoldInvestments')) || []
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tradingpro-data-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        showNotification('Data berhasil diekspor!', 'success');
    }, 1000);
}

function refreshAdmin() {
    if (!checkAdminAccess()) return;
    showSpinner();
    setTimeout(() => {
        hideSpinner();
        refreshUserData();
        loadTransactions();
        loadGoldInvestments();
        updateUI();
        showNotification('Admin panel di-refresh!', 'success');
    }, 800);
}

function saveSettings() {
    if (!checkAdminAccess()) return;
    showSpinner();
    setTimeout(() => {
        hideSpinner();
        showNotification('Pengaturan disimpan!', 'success');
    }, 800);
}

function refreshPortfolio() {
    showSpinner();
    setTimeout(() => {
        hideSpinner();
        refreshUserData();
        showNotification('Portfolio di-refresh!', 'success');
    }, 800);
}

// ============================================================
// 11. PROFILE FUNCTIONS
// ============================================================

function changeAvatar() {
    const colors = ['3b82f6', '10b981', 'ef4444', 'f59e0b', '8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const avatarImg = document.getElementById('profileAvatar');
    if (avatarImg) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=${randomColor}&color=fff&size=120`;
    }
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) {
        sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=${randomColor}&color=fff&size=40`;
    }
    showNotification('Avatar berhasil diubah!', 'success');
}

function editProfile() {
    const name = prompt('Masukkan nama baru:', currentUser.name);
    if (name) {
        currentUser.name = name;
        localStorage.setItem('tradingProCurrentUser', JSON.stringify(currentUser));
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].name = name;
            localStorage.setItem('tradingProUsers', JSON.stringify(users));
        }
        updateUI();
        showNotification('Profil berhasil diupdate!', 'success');
    }
}

// ============================================================
// 12. COMMENTS FUNCTIONS
// ============================================================

function addComment() {
    document.getElementById('newComment').focus();
    document.getElementById('newComment').scrollIntoView({ behavior: 'smooth' });
}

function submitComment() {
    if (!currentUser) {
        showNotification('Silakan login terlebih dahulu!', 'error');
        return;
    }
    const text = document.getElementById('newComment').value.trim();
    if (!text) {
        showNotification('Tulis komentar terlebih dahulu!', 'error');
        return;
    }
    showSpinner();
    setTimeout(() => {
        hideSpinner();
        const list = document.getElementById('commentList');
        if (!list) return;
        const newComment = document.createElement('div');
        newComment.className = 'comment-item';
        newComment.innerHTML = `
            <div class="comment-avatar">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=3b82f6&color=fff&size=40" alt="${currentUser.name}">
            </div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${currentUser.name}</span>
                    <span class="comment-time">Baru saja</span>
                </div>
                <p class="comment-text">${text}</p>
                <div class="comment-actions">
                    <button onclick="likeComment(this)"><i class="fas fa-thumbs-up"></i> 0</button>
                    <button onclick="replyComment(this)"><i class="fas fa-reply"></i> Balas</button>
                </div>
            </div>
        `;
        list.prepend(newComment);
        document.getElementById('newComment').value = '';
        showNotification('Komentar berhasil dikirim!', 'success');
    }, 800);
}

function likeComment(btn) {
    const text = btn.textContent.trim();
    const match = text.match(/(\d+)/);
    const count = match ? parseInt(match[0]) : 0;
    btn.innerHTML = `<i class="fas fa-thumbs-up"></i> ${count + 1}`;
}

function replyComment(btn) {
    const author = btn.closest('.comment-item').querySelector('.comment-author').textContent;
    document.getElementById('newComment').value = `@${author} `;
    document.getElementById('newComment').focus();
}

// ============================================================
// 13. ACTIVITY
// ============================================================

function addActivity(text) {
    const list = document.getElementById('activityList');
    if (!list) return;
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
        <div class="activity-icon"><i class="fas fa-coins" style="color:#f59e0b;"></i></div>
        <div class="activity-detail">
            <span class="activity-text">${text}</span>
            <span class="activity-time">Baru saja</span>
        </div>
    `;
    list.prepend(item);
    while (list.children.length > 5) {
        list.removeChild(list.lastChild);
    }
}

// ============================================================
// 14. CHART
// ============================================================

let stockChart = null;

function initChart() {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return;
    if (stockChart) { stockChart.destroy(); }
    stockChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
            datasets: [{ 
                label: 'IDX Composite', 
                data: [6800, 7200, 6900, 7500, 7800, 8200, 7900, 8500, 8800, 9200, 9500, 9800],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false },
                x: { grid: { display: false } }
            }
        }
    });
}

// ============================================================
// 15. NOTIFICATION & SPINNER
// ============================================================

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.style.transform = 'translateX(0)', 50);
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 400);
        }
    }, 4000);
}

function showSpinner() {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideSpinner() {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================================
// 16. SIDEBAR NAVIGATION
// ============================================================

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.dataset.page;
        if (page === 'admin' && !isAdmin()) {
            showNotification('⛔ Akses Ditolak! Hanya untuk Administrator.', 'error');
            return;
        }
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) targetPage.classList.add('active');
        if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('active');
    });
});

document.getElementById('menuToggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
});

document.querySelector('.qris-close')?.addEventListener('click', closeQRIS);
document.getElementById('qrisModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeQRIS();
});

// ============================================================
// 17. INIT
// ============================================================

document.getElementById('authPage').style.display = 'flex';
document.getElementById('mainApp').style.display = 'none';

const savedUsers = localStorage.getItem('tradingProUsers');
if (savedUsers) {
    try { users = JSON.parse(savedUsers); } catch (e) {}
}

const savedTransactions = localStorage.getItem('tradingProTransactions');
if (savedTransactions) {
    try { transactions = JSON.parse(savedTransactions); } catch (e) {}
}

const savedGold = localStorage.getItem('tradingProGoldInvestments');
if (savedGold) {
    try { goldInvestments = JSON.parse(savedGold); } catch (e) {}
}

if (currentUser) {
    showDashboard();
}

document.getElementById('loginPassword')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') loginUser();
});
document.getElementById('loginEmail')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') loginUser();
});
document.getElementById('regPassword')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') registerUser();
});

console.log('🚀 TradingPro Dashboard loaded!');
console.log('👑 Admin: admin@tradingpro.com / admin123');
console.log('👤 User: user@tradingpro.com / password123');
console.log('📱 QRIS via buatqris.site');
console.log('💳 Withdraw via buatqris.site');
