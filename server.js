require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== DATABASE ==========
const dbPath = path.join(__dirname, 'tradingpro.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password TEXT NOT NULL,
            balance INTEGER DEFAULT 0,
            level TEXT DEFAULT 'Standard',
            isAdmin INTEGER DEFAULT 0,
            joined TEXT,
            createdAt TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            type TEXT NOT NULL,
            amount INTEGER NOT NULL,
            method TEXT,
            status TEXT DEFAULT 'pending',
            transactionId TEXT,
            date TEXT,
            time TEXT,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS gold_investments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            packageId INTEGER NOT NULL,
            packageName TEXT NOT NULL,
            amount INTEGER NOT NULL,
            profit INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            startDate TEXT NOT NULL,
            endDate TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            createdAt TEXT,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

    db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
        if (row.count === 0) {
            const now = new Date().toISOString();
            const joined = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
            
            db.run(`
                INSERT INTO users (name, email, phone, password, balance, level, isAdmin, joined, createdAt)
                VALUES 
                ('Admin Trading', 'admin@tradingpro.com', '081234567890', 'admin123', 100000000, 'Admin', 1, '${joined}', '${now}'),
                ('User Trading', 'user@tradingpro.com', '081234567891', 'password123', 12500000, 'Premium', 0, '${joined}', '${now}')
            `);
            console.log('✅ Default users created!');
        }
    });
});

// ========== KONFIGURASI buatqris.site ==========
const QRIS_CONFIG = {
    account_id: process.env.QRIS_ACCOUNT_ID || 'YOUR_ACCOUNT_ID',
    secret_token: process.env.QRIS_SECRET_TOKEN || 'YOUR_SECRET_TOKEN',
    api_url: process.env.QRIS_API_URL || 'https://app.buatqris.site/api'
};

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== TELEGRAM BOT ==========
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramNotification(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('⚠️ Telegram bot tidak dikonfigurasi');
        return;
    }
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        if (response.data.ok) {
            console.log('✅ Telegram notifikasi terkirim!');
        }
    } catch (error) {
        console.error('❌ Telegram error:', error.message);
    }
}

// ========== 1. FUNGSI BUAT QRIS ==========
async function buatQris(amount, description) {
    try {
        const res = await axios.post(QRIS_CONFIG.api_url, 
            new URLSearchParams({
                action: 'api_create_qris',
                account_id: QRIS_CONFIG.account_id,
                secret_token: QRIS_CONFIG.secret_token,
                amount: amount,
                description: description || `Deposit Rp ${amount.toLocaleString()}`,
                qris_method: 'qris_two'
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        const json = res.data;
        if (!json.success) {
            throw new Error(json.message || 'Gagal membuat QRIS');
        }
        return {
            success: true,
            data: {
                payment_url: json.data.payment_url,
                transaction_id: json.data.transaction_id,
                qris_code: json.data.qris_code || json.data.payment_url,
                expired_at: json.data.expired_at,
                amount: json.data.amount
            }
        };
    } catch (error) {
        console.error('❌ buatqris.site Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || error.message };
    }
}

// ========== 2. FUNGSI CEK STATUS ==========
async function cekTransaksi(transactionId) {
    try {
        const res = await axios.post(QRIS_CONFIG.api_url,
            new URLSearchParams({
                action: 'api_check_status',
                account_id: QRIS_CONFIG.account_id,
                secret_token: QRIS_CONFIG.secret_token,
                transaction_id: transactionId
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        const json = res.data;
        if (!json.success) {
            throw new Error(json.message || 'Gagal cek status');
        }
        return {
            success: true,
            data: {
                status: json.data.status,
                paid_at: json.data.paid_at,
                customer_name: json.data.customer_name,
                payment_method: json.data.payment_method,
                amount: json.data.amount
            }
        };
    } catch (error) {
        console.error('❌ Cek QRIS Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || error.message };
    }
}

// ========== 3. FUNGSI BUAT PENARIKAN ==========
async function buatPenarikan(amount, bankName, bankAccount, bankHolder) {
    try {
        const res = await axios.post(QRIS_CONFIG.api_url,
            new URLSearchParams({
                action: 'api_withdraw',
                account_id: QRIS_CONFIG.account_id,
                secret_token: QRIS_CONFIG.secret_token,
                amount: amount,
                bank_name: bankName,
                bank_account: bankAccount,
                bank_holder: bankHolder
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        const json = res.data;
        if (!json.success) {
            throw new Error(json.message || 'Gagal melakukan penarikan');
        }
        return {
            success: true,
            data: {
                transaction_id: json.data.transaction_id,
                amount: json.data.amount,
                bank_name: json.data.bank_name,
                bank_account: json.data.bank_account,
                bank_holder: json.data.bank_holder,
                fee: json.data.fee || 0,
                status: json.data.status || 'pending'
            }
        };
    } catch (error) {
        console.error('❌ Withdraw Error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data?.message || error.message };
    }
}

// ============================================================
// API ROUTES
// ============================================================

// ===== LOGIN =====
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (!user) return res.status(401).json({ success: false, message: 'Email atau password salah!' });
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                balance: user.balance,
                level: user.level,
                isAdmin: user.isAdmin === 1,
                joined: user.joined
            }
        });
    });
});

// ===== REGISTER =====
app.post('/api/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    const now = new Date().toISOString();
    const joined = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    
    db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, existing) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (existing) return res.status(400).json({ success: false, message: 'Email sudah terdaftar!' });
        
        db.run(`
            INSERT INTO users (name, email, phone, password, balance, level, isAdmin, joined, createdAt)
            VALUES (?, ?, ?, ?, 0, 'Standard', 0, ?, ?)
        `, [name, email, phone, password, joined, now], function(err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            // Kirim notifikasi Telegram
            sendTelegramNotification(`
📝 <b>USER BARU REGISTER!</b>

👤 Nama: ${name}
📧 Email: ${email}
📱 No HP: ${phone}
🕐 Waktu: ${new Date().toLocaleString('id-ID')}
            `);
            res.json({ success: true, message: 'Akun berhasil didaftarkan!', userId: this.lastID });
        });
    });
});

// ===== GET USER =====
app.get('/api/user/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT id, name, email, phone, balance, level, isAdmin, joined FROM users WHERE id = ?`, [id], (err, user) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        res.json({ success: true, user: { ...user, isAdmin: user.isAdmin === 1 } });
    });
});

// ===== UPDATE USER =====
app.put('/api/user/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone } = req.body;
    db.run(`UPDATE users SET name = ?, phone = ? WHERE id = ?`, [name, phone, id], function(err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Profil berhasil diupdate!' });
    });
});

// ===== CREATE QRIS (DEPOSIT) =====
app.post('/api/create-qris', async (req, res) => {
    const { userId, amount, description } = req.body;
    if (!userId || !amount || amount < 1000) {
        return res.status(400).json({ success: false, message: 'Minimal deposit Rp 1.000' });
    }
    if (amount > 100000000) {
        return res.status(400).json({ success: false, message: 'Maksimal deposit Rp 100.000.000' });
    }
    try {
        const qrisResult = await buatQris(amount, description || `Deposit Order #${Date.now()}`);
        if (!qrisResult.success) {
            return res.status(500).json({ success: false, message: qrisResult.error || 'Gagal membuat QRIS' });
        }
        const now = new Date().toISOString();
        const date = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        db.run(`
            INSERT INTO transactions (userId, type, amount, method, status, transactionId, date, time)
            VALUES (?, 'deposit', ?, 'QRIS', 'pending', ?, ?, ?)
        `, [userId, amount, qrisResult.data.transaction_id, date, time]);
        res.json({
            success: true,
            data: {
                orderId: qrisResult.data.transaction_id,
                paymentUrl: qrisResult.data.payment_url,
                qrisCode: qrisResult.data.qris_code,
                expiredAt: qrisResult.data.expired_at,
                amount: amount
            }
        });
    } catch (error) {
        console.error('❌ Create QRIS Error:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat QRIS: ' + error.message });
    }
});

// ===== CHECK PAYMENT STATUS =====
app.get('/api/check-payment/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
        const statusResult = await cekTransaksi(orderId);
        if (!statusResult.success) {
            return res.status(500).json({ success: false, message: statusResult.error || 'Gagal cek status' });
        }
        let dbStatus = 'pending';
        let isPaid = false;
        if (statusResult.data.status === 'success' || statusResult.data.status === 'paid') {
            dbStatus = 'success';
            isPaid = true;
        } else if (statusResult.data.status === 'expired' || statusResult.data.status === 'failed') {
            dbStatus = 'failed';
        }
        if (isPaid) {
            db.get(`SELECT id, userId, amount FROM transactions WHERE transactionId = ? AND status != 'success'`, [orderId], (err, tx) => {
                if (tx) {
                    db.run(`UPDATE transactions SET status = 'success' WHERE transactionId = ?`, [orderId]);
                    db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [tx.amount, tx.userId], function(err) {
                        if (!err) {
                            // Ambil data user untuk notifikasi
                            db.get(`SELECT name FROM users WHERE id = ?`, [tx.userId], (err, user) => {
                                if (user) {
                                    sendTelegramNotification(`
💰 <b>DEPOSIT BERHASIL!</b>

👤 User: ${user.name}
💳 Jumlah: Rp ${tx.amount.toLocaleString()}
📱 Metode: QRIS
🕐 Waktu: ${new Date().toLocaleString('id-ID')}
                                    `);
                                }
                            });
                        }
                    });
                }
            });
        }
        res.json({
            success: true,
            data: {
                orderId: orderId,
                status: statusResult.data.status,
                dbStatus: dbStatus,
                isPaid: isPaid,
                paidAt: statusResult.data.paid_at,
                customerName: statusResult.data.customer_name,
                paymentMethod: statusResult.data.payment_method,
                amount: statusResult.data.amount
            }
        });
    } catch (error) {
        console.error('❌ Check Status Error:', error);
        res.status(500).json({ success: false, message: 'Gagal cek status: ' + error.message });
    }
});

// ===== GET TRANSACTIONS =====
app.get('/api/transactions/:userId', (req, res) => {
    const { userId } = req.params;
    db.all(`SELECT * FROM transactions WHERE userId = ? ORDER BY id DESC`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, transactions: rows });
    });
});

// ===== WITHDRAW =====
app.post('/api/withdraw', async (req, res) => {
    const { userId, amount, bankName, bankAccount, bankHolder } = req.body;
    if (!userId || !amount || amount < 10000) {
        return res.status(400).json({ success: false, message: 'Minimal penarikan Rp 10.000' });
    }
    if (!bankName || !bankAccount || !bankHolder) {
        return res.status(400).json({ success: false, message: 'Data bank/rekening harus diisi!' });
    }
    db.get(`SELECT balance, name FROM users WHERE id = ?`, [userId], async (err, user) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (!user || user.balance < amount) {
            return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi!' });
        }
        try {
            const withdrawResult = await buatPenarikan(amount, bankName, bankAccount, bankHolder);
            if (!withdrawResult.success) {
                return res.status(500).json({ success: false, message: withdrawResult.error || 'Gagal melakukan penarikan' });
            }
            db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [amount, userId]);
            const now = new Date().toISOString();
            const date = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            db.run(`
                INSERT INTO transactions (userId, type, amount, method, status, transactionId, date, time)
                VALUES (?, 'withdraw', ?, ?, 'success', ?, ?, ?)
            `, [userId, amount, bankName, 'WIT-' + Date.now(), date, time]);
            // Notifikasi Telegram
            sendTelegramNotification(`
💳 <b>WITHDRAW BERHASIL!</b>

👤 User: ${user.name}
💳 Jumlah: Rp ${amount.toLocaleString()}
🏦 Bank: ${bankName}
📱 No Rekening: ${bankAccount}
🕐 Waktu: ${new Date().toLocaleString('id-ID')}
            `);
            res.json({
                success: true,
                message: 'Penarikan berhasil!',
                data: {
                    amount: amount,
                    bankName: bankName,
                    bankAccount: bankAccount,
                    bankHolder: bankHolder,
                    fee: withdrawResult.data.fee || 0
                }
            });
        } catch (error) {
            console.error('❌ Withdraw Error:', error);
            res.status(500).json({ success: false, message: 'Gagal melakukan penarikan: ' + error.message });
        }
    });
});

// ===== ADMIN: GET ALL USERS =====
app.get('/api/admin/users', (req, res) => {
    db.all(`SELECT id, name, email, phone, balance, level, isAdmin, joined FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, users: rows });
    });
});

// ===== ADMIN: GET ALL TRANSACTIONS =====
app.get('/api/admin/transactions', (req, res) => {
    db.all(`SELECT t.*, u.name as userName FROM transactions t LEFT JOIN users u ON t.userId = u.id ORDER BY t.id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, transactions: rows });
    });
});

// ===== INVESTASI EMAS =====
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
    if (!pkg) return res.status(400).json({ success: false, message: 'Paket tidak ditemukan' });
    db.get(`SELECT balance, name FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (!user || user.balance < pkg.price) {
            return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi!' });
        }
        db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [pkg.price, userId]);
        const now = new Date().toISOString();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + pkg.duration);
        db.run(`
            INSERT INTO gold_investments (userId, packageId, packageName, amount, profit, duration, startDate, endDate, status, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        `, [userId, pkg.id, pkg.name, pkg.price, pkg.profit, pkg.duration, now, endDate.toISOString(), now], function(err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            // Notifikasi Telegram
            sendTelegramNotification(`
💰 <b>INVESTASI EMAS!</b>

👤 User: ${user.name}
📦 Paket: ${pkg.name}
💳 Jumlah: Rp ${pkg.price.toLocaleString()}
📈 Profit: ${pkg.profit}%
⏱ Durasi: ${pkg.duration} hari
🕐 Waktu: ${new Date().toLocaleString('id-ID')}
            `);
            res.json({ success: true, message: `Investasi ${pkg.name} berhasil!`, investmentId: this.lastID });
        });
    });
});

// ===== GET GOLD INVESTMENTS =====
app.get('/api/gold-investments/:userId', (req, res) => {
    const { userId } = req.params;
    db.all(`SELECT * FROM gold_investments WHERE userId = ? ORDER BY id DESC`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, investments: rows });
    });
});

// ===== CHECK COMPLETED INVESTMENTS =====
app.post('/api/check-gold-investments', (req, res) => {
    const now = new Date().toISOString();
    db.all(`SELECT * FROM gold_investments WHERE status = 'active' AND endDate <= datetime(?)`, [now], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        let completed = 0;
        rows.forEach(inv => {
            const profitAmount = inv.amount * (inv.profit / 100);
            db.run(`UPDATE gold_investments SET status = 'completed' WHERE id = ?`, [inv.id]);
            db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [profitAmount, inv.userId]);
            completed++;
        });
        res.json({ success: true, message: `${completed} investasi selesai`, completed: completed });
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints ready!`);
    console.log(`👑 Admin: admin@tradingpro.com / admin123`);
});
