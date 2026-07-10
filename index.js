const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ============================================================
// ========== TEST API ==========
// ============================================================
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: '✅ API TradingPro Online!',
        time: new Date().toISOString()
    });
});

// ============================================================
// ========== LOGIN ==========
// ============================================================
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Admin
    if (email === 'admin@tradingpro.com' && password === 'admin123') {
        return res.json({
            success: true,
            user: {
                id: 1,
                name: 'Admin Trading',
                email: 'admin@tradingpro.com',
                phone: '081234567890',
                balance: 100000000,
                level: 'Admin',
                isAdmin: true,
                joined: 'Jan 2025'
            }
        });
    }
    
    // User
    if (email === 'user@tradingpro.com' && password === 'password123') {
        return res.json({
            success: true,
            user: {
                id: 2,
                name: 'User Trading',
                email: 'user@tradingpro.com',
                phone: '081234567891',
                balance: 12500000,
                level: 'Premium',
                isAdmin: false,
                joined: 'Jan 2025'
            }
        });
    }
    
    // Email terdaftar tapi password salah
    if (email === 'admin@tradingpro.com' || email === 'user@tradingpro.com') {
        return res.status(401).json({ 
            success: false, 
            message: '❌ Password salah!' 
        });
    }
    
    // Email tidak terdaftar
    res.status(401).json({ 
        success: false, 
        message: '❌ Email tidak terdaftar! Silakan daftar dulu.' 
    });
});

// ============================================================
// ========== REGISTER ==========
// ============================================================
app.post('/api/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone || !password) {
        return res.status(400).json({
            success: false,
            message: '❌ Semua field harus diisi!'
        });
    }
    
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: '❌ Password minimal 6 karakter!'
        });
    }
    
    // Cek email sudah terdaftar (simulasi)
    if (email === 'admin@tradingpro.com' || email === 'user@tradingpro.com') {
        return res.status(400).json({
            success: false,
            message: '❌ Email sudah terdaftar!'
        });
    }
    
    res.json({
        success: true,
        message: '✅ Akun berhasil didaftarkan! Silakan login.',
        userId: Date.now()
    });
});

// ============================================================
// ========== GET USER ==========
// ============================================================
app.get('/api/user/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (id === 1) {
        return res.json({
            success: true,
            user: {
                id: 1,
                name: 'Admin Trading',
                email: 'admin@tradingpro.com',
                phone: '081234567890',
                balance: 100000000,
                level: 'Admin',
                isAdmin: true,
                joined: 'Jan 2025'
            }
        });
    }
    
    if (id === 2) {
        return res.json({
            success: true,
            user: {
                id: 2,
                name: 'User Trading',
                email: 'user@tradingpro.com',
                phone: '081234567891',
                balance: 12500000,
                level: 'Premium',
                isAdmin: false,
                joined: 'Jan 2025'
            }
        });
    }
    
    res.status(404).json({ 
        success: false, 
        message: 'User tidak ditemukan' 
    });
});

// ============================================================
// ========== UPDATE USER ==========
// ============================================================
app.put('/api/user/:id', (req, res) => {
    const { name, phone } = req.body;
    res.json({ 
        success: true, 
        message: '✅ Profil berhasil diupdate!' 
    });
});

// ============================================================
// ========== CREATE QRIS (DEPOSIT) ==========
// ============================================================
app.post('/api/create-qris', (req, res) => {
    const { userId, amount, description } = req.body;
    
    if (!userId || !amount || amount < 1000) {
        return res.status(400).json({
            success: false,
            message: '❌ Minimal deposit Rp 1.000'
        });
    }
    
    if (amount > 100000000) {
        return res.status(400).json({
            success: false,
            message: '❌ Maksimal deposit Rp 100.000.000'
        });
    }
    
    const orderId = 'QRIS-' + Date.now();
    
    res.json({
        success: true,
        data: {
            orderId: orderId,
            paymentUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TRADINGPRO-${amount}`,
            qrisCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TRADINGPRO-${amount}`,
            amount: amount,
            expiredAt: new Date(Date.now() + 30 * 60000).toISOString()
        }
    });
});

// ============================================================
// ========== CHECK PAYMENT ==========
// ============================================================
app.get('/api/check-payment/:orderId', (req, res) => {
    const { orderId } = req.params;
    
    // Simulasi: selalu success
    res.json({
        success: true,
        data: {
            orderId: orderId,
            status: 'success',
            isPaid: true,
            dbStatus: 'success',
            paidAt: new Date().toISOString(),
            customerName: 'User Trading',
            paymentMethod: 'QRIS'
        }
    });
});

// ============================================================
// ========== GET TRANSACTIONS ==========
// ============================================================
app.get('/api/transactions/:userId', (req, res) => {
    res.json({
        success: true,
        transactions: [
            {
                id: 1,
                userId: parseInt(req.params.userId),
                type: 'deposit',
                amount: 100000,
                method: 'QRIS',
                status: 'success',
                transactionId: 'QRIS-123456',
                date: '10 Jul 2026',
                time: '14:30'
            }
        ]
    });
});

// ============================================================
// ========== WITHDRAW ==========
// ============================================================
app.post('/api/withdraw', (req, res) => {
    const { userId, amount, bankName, bankAccount, bankHolder } = req.body;
    
    if (!amount || amount < 10000) {
        return res.status(400).json({
            success: false,
            message: '❌ Minimal penarikan Rp 10.000'
        });
    }
    
    res.json({
        success: true,
        message: '✅ Penarikan berhasil!',
        data: {
            amount: amount,
            bankName: bankName,
            bankAccount: bankAccount,
            bankHolder: bankHolder,
            fee: 0,
            transactionId: 'WIT-' + Date.now()
        }
    });
});

// ============================================================
// ========== INVESTASI EMAS ==========
// ============================================================
const goldPackages = [
    { id: 1, name: 'Emas Mini', price: 50000, profit: 10, duration: 15 },
    { id: 2, name: 'Emas Kecil', price: 100000, profit: 10, duration: 15 },
    { id: 3, name: 'Emas Sedang', price: 250000, profit: 10, duration: 15 },
    { id: 4, name: 'Emas Standar', price: 500000, profit: 10, duration: 15 },
    { id: 5, name: 'Emas Premium', price: 1000000, profit: 10, duration: 15 },
    { id: 6, name: 'Emas Pro', price: 2500000, profit: 10, duration: 15 },
    { id: 7, name: 'Emas Platinum', price: 5000000, profit: 10, duration: 15 },
    { id: 8, name: 'Emas Gold', price: 7500000, profit: 12, duration: 15 },
    { id: 9, name: 'Emas Exclusive', price: 10000000, profit: 12, duration: 15 },
    { id: 10, name: 'Emas Ultimate', price: 15000000, profit: 15, duration: 15 }
];

app.post('/api/invest-gold', (req, res) => {
    const { userId, packageId } = req.body;
    const pkg = goldPackages.find(p => p.id === packageId);
    
    if (!pkg) {
        return res.status(400).json({
            success: false,
            message: '❌ Paket tidak ditemukan'
        });
    }
    
    res.json({
        success: true,
        message: `✅ Investasi ${pkg.name} berhasil!`,
        investmentId: Date.now()
    });
});

// ============================================================
// ========== GET GOLD INVESTMENTS ==========
// ============================================================
app.get('/api/gold-investments/:userId', (req, res) => {
    res.json({
        success: true,
        investments: []
    });
});

// ============================================================
// ========== CHECK COMPLETED INVESTMENTS ==========
// ============================================================
app.post('/api/check-gold-investments', (req, res) => {
    res.json({
        success: true,
        message: '0 investasi selesai',
        completed: 0
    });
});

// ============================================================
// ========== ADMIN - GET ALL USERS ==========
// ============================================================
app.get('/api/admin/users', (req, res) => {
    res.json({
        success: true,
        users: [
            {
                id: 1,
                name: 'Admin Trading',
                email: 'admin@tradingpro.com',
                phone: '081234567890',
                balance: 100000000,
                level: 'Admin',
                isAdmin: 1,
                joined: 'Jan 2025'
            },
            {
                id: 2,
                name: 'User Trading',
                email: 'user@tradingpro.com',
                phone: '081234567891',
                balance: 12500000,
                level: 'Premium',
                isAdmin: 0,
                joined: 'Jan 2025'
            }
        ]
    });
});

// ============================================================
// ========== ADMIN - GET ALL TRANSACTIONS ==========
// ============================================================
app.get('/api/admin/transactions', (req, res) => {
    res.json({
        success: true,
        transactions: [
            {
                id: 1,
                userId: 2,
                userName: 'User Trading',
                type: 'deposit',
                amount: 100000,
                method: 'QRIS',
                status: 'success',
                date: '10 Jul 2026'
            }
        ]
    });
});

// ============================================================
// ========== EXPORT ==========
// ============================================================
module.exports = app;
