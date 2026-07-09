lStorage.setItem(
        "coins_" + userAktifSesi,
        userCoins
    );

    updateCoinDisplay();

    showNotification(
        "✅ Berhasil membeli " + itemName,
        "#00ff88"
    );
}

// ========================================
// DAILY REWARD
// ========================================
function claimDailyReward() {

    const key =
        "daily_" + userAktifSesi;

    const today =
        new Date().toDateString();

    const lastClaim =
        localStorage.getItem(key);

    if (lastClaim === today) {
        showNotification(
            "🎁 Reward hari ini sudah diambil!",
            "#ff9500"
        );
        return;
    }

    userCoins += 50;

    localStorage.setItem(
        key,
        today
    );

    localStorage.setItem(
        "coins_" + userAktifSesi,
        userCoins
    );

    updateCoinDisplay();

    showNotification(
        "🎁 Daily Reward +50 Koin!",
        "#ffd700"
    );
}

// ========================================
// LEADERBOARD SEDERHANA
// ========================================
function lihatLeaderboard() {

    let data = [];

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (key.startsWith("coins_")) {

            const username =
                key.replace("coins_", "");

            const coins =
                parseInt(
                    localStorage.getItem(key)
                ) || 0;

            data.push({
                username,
                coins
            });
        }
    }

    data.sort((a, b) =>
        b.coins - a.coins
    );

    let text = "🏆 LEADERBOARD\n\n";

    data.slice(0, 10).forEach((p, i) => {
        text +=
            (i + 1) +
            ". " +
            p.username +
            " - " +
            p.coins +
            " Koin\n";
    });

    alert(text);
}

// ========================================
// LOADING SCREEN
// ========================================
window.addEventListener(
    "load",
    function () {

        const loading =
            document.getElementById(
                "loadingScreen"
            );

        if (loading) {
            setTimeout(() => {
                loading.style.display =
                    "none";
            }, 1500);
        }
    }
);

// ========================================
// ONLINE USER RANDOM
// ========================================
setInterval(() => {

    const online =
        100 +
        Math.floor(
            Math.random() * 300
        );

    const el =
        document.getElementById(
            "onlineUsers"
        );

    if (el) {
        el.textContent =
            "👤 " +
            online +
            " Online";
    }

}, 5000);
// ========================================
// VARIABEL GLOBAL
// ========================================
let modeDaftar = false;
let userAktifSesi = "";
let favoriteGames = [];
let playedGames = [];
let userCoins = 0;
let userXP = 0;
let userLevel = 1;
let currentFilter = 'all';

// ========================================
// DATA GAME
// ========================================
const gameDataBase = [
    { id: 1, name: "Cyber Strike", genre: "action", desc: "FPS Futuristik", coinReward: 1, xpReward: 5, link: "https://poki.com" },
    { id: 2, name: "Valorant", genre: "action", desc: "FPS Tactical", coinReward: 2, xpReward: 8, link: "https://poki.com" },
    { id: 3, name: "Genshin Impact", genre: "adventure", desc: "Open World RPG", coinReward: 3, xpReward: 10, link: "https://poki.com" },
    { id: 4, name: "Mobile Legends", genre: "action", desc: "MOBA 5v5", coinReward: 2, xpReward: 7, link: "https://poki.com" },
    { id: 5, name: "PUBG Mobile", genre: "action", desc: "Battle Royale", coinReward: 2, xpReward: 8, link: "https://poki.com" },
    { id: 6, name: "Minecraft", genre: "adventure", desc: "Sandbox Survival", coinReward: 3, xpReward: 10, link: "https://poki.com" },
    { id: 7, name: "FIFA 24", genre: "sport", desc: "Football Simulator", coinReward: 2, xpReward: 6, link: "https://poki.com" },
    { id: 8, name: "Clash of Clans", genre: "strategy", desc: "Base Building", coinReward: 2, xpReward: 7, link: "https://poki.com" },
    { id: 9, name: "Call of Duty", genre: "action", desc: "FPS Military", coinReward: 2, xpReward: 8, link: "https://poki.com" },
    { id: 10, name: "Among Us", genre: "strategy", desc: "Social Deduction", coinReward: 1, xpReward: 5, link: "https://poki.com" },
    { id: 11, name: "NBA 2K24", genre: "sport", desc: "Basketball Sim", coinReward: 2, xpReward: 6, link: "https://poki.com" },
    { id: 12, name: "The Witcher 3", genre: "adventure", desc: "Fantasy RPG", coinReward: 3, xpReward: 12, link: "https://poki.com" },
    { id: 13, name: "Dota 2", genre: "strategy", desc: "MOBA Complex", coinReward: 2, xpReward: 9, link: "https://poki.com" },
    { id: 14, name: "CS:GO", genre: "action", desc: "FPS Classic", coinReward: 2, xpReward: 7, link: "https://poki.com" },
    { id: 15, name: "Rocket League", genre: "sport", desc: "Car Football", coinReward: 2, xpReward: 6, link: "https://poki.com" },
    { id: 16, name: "Age of Empires", genre: "strategy", desc: "Historical RTS", coinReward: 3, xpReward: 10, link: "https://poki.com" }
];

// ========================================
// INISIALISASI AKUN DEMO
// ========================================
if (!localStorage.getItem('admin')) {
    localStorage.setItem('admin', 'game123');
}

// ========================================
// FUNGSI LOADING SCREEN
// ========================================
function startLoading() {
    const fill = document.getElementById('loadingFill');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        fill.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
            }, 300);
        }
    }, 30);
}

// ========================================
// FUNGSI LOGIN & REGISTER
// ========================================
function pindahMenu() {
    modeDaftar = !modeDaftar;
    document.getElementById('errMsg').style.display = 'none';
    if (modeDaftar) {
        document.getElementById('title').innerText = "BUAT AKUN";
        document.getElementById('mainBtn').innerText = "DAFTAR SEKARANG";
        document.getElementById('toggleBtn').innerText = "Sudah punya akun? Login";
    } else {
        document.getElementById('title').innerText = "PLAYER LOGIN";
        document.getElementById('mainBtn').innerText = "MASUK";
        document.getElementById('toggleBtn').innerText = "Belum punya akun? Daftar";
    }
}

function aksiUtama() {
    const u = document.getElementById('user').value.trim();
    const p = document.getElementById('pass').value;
    const err = document.getElementById('errMsg');

    if (!u || !p) {
        err.innerText = "Isi semua kotak!";
        err.style.display = 'block';
        return;
    }

    if (modeDaftar) {
        if (localStorage.getItem(u)) {
            err.innerText = "Username sudah terdaftar!";
            err.style.display = 'block';
        } else {
            localStorage.setItem(u, p);
            localStorage.setItem('coins_' + u, '0');
            localStorage.setItem('favorites_' + u, '[]');
            localStorage.setItem('played_' + u, '[]');
            localStorage.setItem('inventory_' + u, '[]');
            localStorage.setItem('xp_' + u, '0');
            localStorage.setItem('level_' + u, '1');
            showNotification("✅ Akun berhasil dibuat! Silakan login.", "#00f0ff");
            pindahMenu();
        }
    } else {
        if (localStorage.getItem(u) === p) {
            userAktifSesi = u;
            document.getElementById('authBox').classList.add('hidden');
            document.getElementById('dashBox').classList.add('active');
            loadUserData();
            showNotification("👋 Selamat datang, " + u + "!", "#00f0ff");
        } else {
            err.innerText = "Username atau Password salah!";
            err.style.display = 'block';
        }
    }
}

function logout() {
    userAktifSesi = "";
    document.getElementById('authBox').classList.remove('hidden');
    document.getElementById('dashBox').classList.remove('active');
    showNotification("👋 Logout berhasil!", "#ff3b30");
}

// ========================================
// FUNGSI LOAD DATA USER
// ========================================
function loadUserData() {
    favoriteGames = JSON.parse(localStorage.getItem('favorites_' + userAktifSesi) || '[]');
    playedGames = JSON.parse(localStorage.getItem('played_' + userAktifSesi) || '[]');
    userCoins = parseInt(localStorage.getItem('coins_' + userAktifSesi)) || 0;
    userXP = parseInt(localStorage.getItem('xp_' + userAktifSesi)) || 0;
    userLevel = parseInt(localStorage.getItem('level_' + userAktifSesi)) || 1;

    updateCoinDisplay();
    updateLevelDisplay();
    document.getElementById('favoriteCount').textContent = favoriteGames.length;
    document.getElementById('playedGames').textContent = playedGames.length;
    renderGames();
}

// ========================================
// FUNGSI UPDATE KOIN & LEVEL
// ========================================
function updateCoinDisplay() {
    document.getElementById('coinDisplay').textContent = userCoins;
    document.getElementById('coinStat').textContent = userCoins;
}

function updateLevelDisplay() {
    const xpNeeded = userLevel * 50;
    const xpProgress = Math.min((userXP / xpNeeded) * 100, 100);

    const levelNames = ['Beginner', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Legend'];
    const levelIndex = Math.min(Math.floor(userLevel / 3), levelNames.length - 1);
    const levelName = levelNames[levelIndex] || 'Legend';

    document.getElementById('levelDisplay').textContent = levelName + ' (Lv.' + userLevel + ')';
    document.getElementById('xpDisplay').textContent = userXP + '
// ========================================
// VARIABEL GLOBAL
// ========================================
let modeDaftar = false;
let userAktifSesi = "";
let favoriteGames = [];
let playedGames = [];
let userCoins = 0;
let userXP = 0;
let userLevel = 1;
let currentFilter = 'all';

// ========================================
// DATA GAME
// ========================================
const gameDataBase = [
    { id: 1, name: "Cyber Strike", genre: "action", desc: "FPS Futuristik", coinReward: 1, xpReward: 5, link: "https://poki.com" },
    { id: 2, name: "Valorant", genre: "action", desc: "FPS Tactical", coinReward: 2, xpReward: 8, link: "https://poki.com" },
    { id: 3, name: "Genshin Impact", genre: "adventure", desc: "Open World RPG", coinReward: 3, xpReward: 10, link: "https://poki.com" },
    { id: 4, name: "Mobile Legends", genre: "action", desc: "MOBA 5v5", coinReward: 2, xpReward: 7, link: "https://poki.com" },
    { id: 5, name: "PUBG Mobile", genre: "action", desc: "Battle Royale", coinReward: 2, xpReward: 8, link: "https://poki.com" },
    { id: 6, name: "Minecraft", genre: "adventure", desc: "Sandbox Survival", coinReward: 3, xpReward: 10, link: "https://poki.com" },
    { id: 7, name: "FIFA 24", genre: "sport", desc: "Football Simulator", coinReward: 2, xpReward: 6, link: "https://poki.com" },
    { id: 8, name: "Clash of Clans", genre: "strategy", desc: "Base Building", coinReward: 2, xpReward: 7, link: "https://poki.com" },
    { id: 9, name: "Call of Duty", genre: "action", desc: "FPS Military", coinReward: 2, xpReward: 8, link: "https://poki.com" },
    { id: 10, name: "Among Us", genre: "strategy", desc: "Social Deduction", coinReward: 1, xpReward: 5, link: "https://poki.com" },
    { id: 11, name: "NBA 2K24", genre: "sport", desc: "Basketball Sim", coinReward: 2, xpReward: 6, link: "https://poki.com" },
    { id: 12, name: "The Witcher 3", genre: "adventure", desc: "Fantasy RPG", coinReward: 3, xpReward: 12, link: "https://poki.com" },
    { id: 13, name: "Dota 2", genre: "strategy", desc: "MOBA Complex", coinReward: 2, xpReward: 9, link: "https://poki.com" },
    { id: 14, name: "CS:GO", genre: "action", desc: "FPS Classic", coinReward: 2, xpReward: 7, link: "https://poki.com" },
    { id: 15, name: "Rocket League", genre: "sport", desc: "Car Football", coinReward: 2, xpReward: 6, link: "https://poki.com" },
    { id: 16, name: "Age of Empires", genre: "strategy", desc: "Historical RTS", coinReward: 3, xpReward: 10, link: "https://poki.com" }
];

// ========================================
// INISIALISASI AKUN DEMO
// ========================================
if (!localStorage.getItem('admin')) {
    localStorage.setItem('admin', 'game123');
}

// ========================================
// FUNGSI LOADING SCREEN
// ========================================
function startLoading() {
    const fill = document.getElementById('loadingFill');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        fill.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
            }, 300);
        }
    }, 30);
}

// ========================================
// FUNGSI LOGIN & REGISTER
// ========================================
function pindahMenu() {
    modeDaftar = !modeDaftar;
    document.getElementById('errMsg').style.display = 'none';
    if (modeDaftar) {
        document.getElementById('title').innerText = "BUAT AKUN";
        document.getElementById('mainBtn').innerText = "DAFTAR SEKARANG";
        document.getElementById('toggleBtn').innerText = "Sudah punya akun? Login";
    } else {
        document.getElementById('title').innerText = "PLAYER LOGIN";
        document.getElementById('mainBtn').innerText = "MASUK";
        document.getElementById('toggleBtn').innerText = "Belum punya akun? Daftar";
    }
}

function aksiUtama() {
    const u = document.getElementById('user').value.trim();
    const p = document.getElementById('pass').value;
    const err = document.getElementById('errMsg');

    if (!u || !p) {
        err.innerText = "Isi semua kotak!";
        err.style.display = 'block';
        return;
    }

    if (modeDaftar) {
        if (localStorage.getItem(u)) {
            err.innerText = "Username sudah terdaftar!";
            err.style.display = 'block';
        } else {
            localStorage.setItem(u, p);
            localStorage.setItem('coins_' + u, '0');
            localStorage.setItem('favorites_' + u, '[]');
            localStorage.setItem('played_' + u, '[]');
            localStorage.setItem('inventory_' + u, '[]');
            localStorage.setItem('xp_' + u, '0');
            localStorage.setItem('level_' + u, '1');
            showNotification("✅ Akun berhasil dibuat! Silakan login.", "#00f0ff");
            pindahMenu();
        }
    } else {
        if (localStorage.getItem(u) === p) {
            userAktifSesi = u;
            document.getElementById('authBox').classList.add('hidden');
            document.getElementById('dashBox').classList.add('active');
            loadUserData();
            showNotification("👋 Selamat datang, " + u + "!", "#00f0ff");
        } else {
            err.innerText = "Username atau Password salah!";
            err.style.display = 'block';
        }
    }
}

function logout() {
    userAktifSesi = "";
    document.getElementById('authBox').classList.remove('hidden');
    document.getElementById('dashBox').classList.remove('active');
    showNotification("👋 Logout berhasil!", "#ff3b30");
}

// ========================================
// FUNGSI LOAD DATA USER
// ========================================
function loadUserData() {
    favoriteGames = JSON.parse(localStorage.getItem('favorites_' + userAktifSesi) || '[]');
    playedGames = JSON.parse(localStorage.getItem('played_' + userAktifSesi) || '[]');
    userCoins = parseInt(localStorage.getItem('coins_' + userAktifSesi)) || 0;
    userXP = parseInt(localStorage.getItem('xp_' + userAktifSesi)) || 0;
    userLevel = parseInt(localStorage.getItem('level_' + userAktifSesi)) || 1;

    updateCoinDisplay();
    updateLevelDisplay();
    document.getElementById('favoriteCount').textContent = favoriteGames.length;
    document.getElementById('playedGames').textContent = playedGames.length;
    renderGames();
}

// ========================================
// FUNGSI UPDATE KOIN & LEVEL
// ========================================
function updateCoinDisplay() {
    document.getElementById('coinDisplay').textContent = userCoins;
    document.getElementById('coinStat').textContent = userCoins;
}

function updateLevelDisplay() {
    const xpNeeded = userLevel * 50;
    const xpProgress = Math.min((userXP / xpNeeded) * 100, 100);
    const levelNames = ['Beginner', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Legend'];
    const levelIndex = Math.min(Math.floor(userLevel / 3), levelNames.length - 1);
    const levelName = levelNames[levelIndex] || 'Legend';
    document.getElementById('levelDisplay').textContent = levelName + ' (Lv.' + userLevel + ')';
    document.getElementById('xpDisplay').textContent = userXP + ' / ' + xpNeeded + ' XP';
    document.getElementById('xpProgress').style.width = xpProgress + '%';
}

function addXP(amount) {
    userXP += amount;
    const xpNeeded = userLevel * 50;
    while (userXP >= xpNeeded) {
        userXP -= xpNeeded;
        userLevel++;
        showNotification('🎉 LEVEL UP! Sekarang Level ' + userLevel + '!', '#ffd700');
    }
    localStorage.setItem('xp_' + userAktifSesi, userXP);
    localStorage.setItem('level_' + userAktifSesi, userLevel);
    updateLevelDisplay();
}

// ========================================
// FUNGSI RENDER GAME
// ========================================
function renderGames() {
    const grid = document.getElementById('gameGrid');
    const searchTerm = document.getElementById('searchGame').value.toLowerCase();
    let filtered = [...gameDataBase];
    if (currentFilter !== 'all') {
        filtered = filtered.filter(g => g.genre === currentFilter);
    }
    if (searchTerm) {
        filtered = filtered.filter(g => g.name.toLowerCase().includes(searchTerm) || g.desc.toLowerCase().includes(searchTerm));
    }
    grid.innerHTML = '';
    filtered.forEach(game => {
        const isFavorite = favoriteGames.includes(game.id);
        const isPlayed = playedGames.includes(game.id);
        grid.innerHTML += `
            <div class="card">
                <button class="favorite-btn" onclick="toggleFavorite(${game.id})">
                    ${isFavorite ? '⭐' : '☆'}
                </button>
                <h4 style="font-family:'Orbitron'; font-size:14px;">${game.name}</h4>
                <p style="color:#8e8e93; font-size:14px; margin-top:5px;">${game.desc}</p>
                <p style="color:#bc34fa; font-size:12px; margin-top:3px;">🎯 ${game.genre.toUpperCase()}</p>
                <p style="color:#ffd700; font-size:12px;">🪙 +${game.coinReward} Koin | ⚡ +${game.xpReward} XP</p>
                ${isPlayed ? '<span style="color:#00f0ff; font-size:12px;">✅ Dimainkan</span>' : ''}
                <button class="btn-play" onclick="playGame(${game.id})">PLAY NOW</button>
            </div>
        `;
    });
    document.getElementById('totalGames').textContent = filtered.length;
}

// ========================================
// FUNGSI GAME
// ========================================
function toggleFavorite(gameId) {
    const index = favoriteGames.indexOf(gameId);
    if (index > -1) {
        favoriteGames.splice(index, 1);
        showNotification("⭐ Dihapus dari favorit", "#ff6b6b");
    } else {
        favoriteGames.push(gameId);
        showNotification("⭐ Ditambahkan ke favorit!", "#ffd700");
    }
    localStorage.setItem('favorites_' + userAktifSesi, JSON.stringify(favoriteGames));
    document.getElementById('favoriteCount').textContent = favoriteGames.length;
    renderGames();
}

function playGame(gameId) {
    const game = gameDataBase.find(g => g.id === gameId);
    if (!game) return;
    const bonus = Math.floor(Math.random() * 5) + 1;
    const totalCoins = game.coinReward + bonus;
    const totalXP = game.xpReward + Math.floor(Math.random() * 3);
    userCoins += totalCoins;
    localStorage.setItem('coins_' + userAktifSesi, userCoins.toString());
    updateCoinDisplay();
    addXP(totalXP);
    if (!playedGames.includes(gameId)) {
        playedGames.push(gameId);
        localStorage.setItem('played_' + userAktifSesi, JSON.stringify(playedGames));
        document.getElementById('playedGames').textContent = playedGames.length;
    }
    showCoinAnimation(totalCoins);
    showNotification(`🎮 Memainkan ${game.name}\n🪙 +${totalCoins} Koin\n⚡ +${totalXP} XP`, "#ffd700");
    renderGames();
    window.open(game.link, '_blank');
}

// ========================================
// ANIMASI KOIN
// ========================================
function showCoinAnimation(amount) {
    const emoji = '🪙';
    for (let i = 0; i < Math.min(amount, 5); i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'coin-float';
            el.textContent = emoji;
            el.style.left = (Math.random() * 80 + 10) + '%';
            el.style.top = (Math.random() * 50 + 25) + '%';
            el.style.fontSize = (25 + Math.random() * 20) + 'px';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1500);
        }, i * 200);
    }
}

// ========================================
// FUNGSI FILTER & SEARCH
// ========================================
function filterGames(genre, element) {
    currentFilter = genre;
    document.querySelectorAll('.filter-tag').forEach(tag => tag.classList.remove('active'));
    if (element) element.classList.add('active');
    renderGames();
}

function searchGames() {
    renderGames();
}

// ========================================
// FUNGSI NOTIFIKASI
// ========================================
function showNotification(message, color = "#00f0ff") {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.style.borderColor = color;
    notif.classList.add('show');
    clearTimeout(notif.timeout);
    notif.timeout = setTimeout(() => {
        notif.classList.remove('show');
    }, 4000);
}

// ========================================
// FUNGSI MENU SIDEBAR
// ========================================
function aksiMenuTitik() {
    document.getElementById("sidebarMenu").classList.toggle("active");
    document.getElementById("menuOverlay").classList.toggle("active");
}

// ========================================
// PROFIL PLAYER
// ========================================
function bukaProfilPlayer() {
    aksiMenuTitik();
    alert(
        "👤 PROFIL PLAYER\n\n" +
        "Username: " + userAktifSesi +
        "\nLevel: " + userLevel +
        "\nXP: " + userXP +
        "\nKoin: " + userCoins +
        "\nFavorit: " + favoriteGames.length +
        "\nGame Dimainkan: " + playedGames.length
    );
}

// ========================================
// SETTINGS
// ========================================
function bukaSettings() {
    aksiMenuTitik();
    showNotification("⚙️ Settings - Fitur tersedia!", "#00f0ff");
}

// ========================================
// FAVORITE
// ========================================
function bukaFavorite() {
    aksiMenuTitik();
    const fav = gameDataBase.filter(g => favoriteGames.includes(g.id));
    if (fav.length === 0) {
        alert("Belum ada game favorit.");
        return;
    }
    let text = "⭐ GAME FAVORIT\n\n";
    fav.forEach(g => text += "• " + g.name + "\n");
    alert(text);
}

// ========================================
// INVENTORY
// ========================================
function bukaInventory() {
    aksiMenuTitik();
    const inventory = JSON.parse(localStorage.getItem("inventory_" + userAktifSesi) || "[]");
    if (inventory.length === 0) {
        alert("📦 Inventory kosong");
        return;
    }
    alert("📦 INVENTORY\n\n" + inventory.join("\n"));
}

// ========================================
// SHOP
// ========================================
function bukaShop() {
    aksiMenuTitik();
    document.querySelector(".shop-section").scrollIntoView({ behavior: "smooth" });
}

// ========================================
// BELI ITEM
// ========================================
function buyItem(itemName, price) {
    if (userCoins < price) {
        showNotification("❌ Koin tidak cukup!", "#ff3b30");
        return;
    }
    userCoins -= price;
    let inventory = JSON.parse(localStorage.getItem("inventory_" + userAktifSesi) || "[]");
    inventory.push(itemName);
    localStorage.setItem("inventory_" + userAktifSesi, JSON.stringify(inventory));
    localStorage.setItem("coins_" + userAktifSesi, userCoins);
    updateCoinDisplay();
    showNotification("✅ Berhasil membeli " + itemName, "#00ff88");
}

// ========================================
// DAILY REWARD
// ========================================
function claimDailyReward() {
    const key = "daily_" + userAktifSesi;
    const today = new Date().toDateString();
    const lastClaim = localStorage.getItem(key);
    if (lastClaim === today) {
        showNotification("🎁 Reward hari ini sudah diambil!", "#ff9500");
        return;
    }
    userCoins += 50;
    localStorage.setItem(key, today);
    localStorage.setItem("coins_" + userAktifSesi, userCoins);
    updateCoinDisplay();
    showNotification("🎁 Daily Reward +50 Koin!", "#ffd700");
}

// ========================================
// LEADERBOARD
// ========================================
function lihatLeaderboard() {
    aksiMenuTitik();
    let data = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("coins_")) {
            const username = key.replace("coins_", "");
            const coins = parseInt(localStorage.getItem(key)) || 0;
            data.push({ username, coins });
        }
    }
    data.sort((a, b) => b.coins - a.coins);
    let text = "🏆 LEADERBOARD\n\n";
    data.slice(0, 10).forEach((p, i) => {
        text += (i + 1) + ". " + p.username + " - " + p.coins + " Koin\n";
    });
    alert(text);
}

// ========================================
// ONLINE USER RANDOM
// ========================================
setInterval(() => {
    const online = 100 + Math.floor(Math.random() * 300);
    const el = document.getElementById("onlineUsers");
    if (el) el.textContent = "👤 " + online + " Online";
}, 5000);

// ========================================
// INIT
// ========================================
window.onload = function() {
    startLoading();
};
