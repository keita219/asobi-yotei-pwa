/**
 * 遊び予定管理PWA - メインアプリケーション
 */

// ========================================
// グローバル変数
// ========================================

// GAS APIのURL (デプロイ後に設定してください)
const API_URL = 'https://script.google.com/macros/s/AKfycbwQW2jnxzSSFiSYCdYZggox-hp40sgxn4ruwJVZ9WwnShZQjHTh081YwBUTTcFDUnJXWQ/exec';

// 現在のユーザー
let currentUser = null;

// データキャッシュ
let membersCache = [];
let schedulesCache = [];
let eventsCache = [];

// ========================================
// 初期化
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Service Workerの登録
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered');
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    // ローカルストレージからユーザー情報を取得
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
        currentUser = savedUser;
        await loadApp();
    } else {
        await showUserSelect();
    }
});

// ========================================
// ユーザー選択
// ========================================

async function showUserSelect() {
    hideLoading();
    
    // メンバー一覧を取得
    const members = await fetchMembers();
    membersCache = members;
    
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    
    members.forEach(member => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.textContent = member.name;
        userItem.onclick = () => selectUser(member.name);
        userList.appendChild(userItem);
    });
    
    showScreen('user-select-screen');
}

function selectUser(userName) {
    currentUser = userName;
    localStorage.setItem('currentUser', userName);
    loadApp();
}

// ========================================
// アプリのロード
// ========================================

async function loadApp() {
    showLoading();
    
    // メンバー情報を取得
    if (membersCache.length === 0) {
        membersCache = await fetchMembers();
    }
    
    // データを取得
    await Promise.all([
        loadSchedules(),
        loadEvents(),
        loadPayments()
    ]);
    
    // ホーム画面を表示
    showHome();
    hideLoading();
}

// ========================================
// 画面遷移
// ========================================

function showScreen(screenId) {
    // すべての画面を非表示
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    
    // 指定された画面を表示
    document.getElementById(screenId).style.display = 'block';
    document.getElementById('app').style.display = 'block';
}

function showHome() {
    showScreen('home-screen');
    
    // 現在のユーザー名を表示
    document.getElementById('current-user').textContent = currentUser;
    
    // 予定調整一覧を表示
    renderSchedulesList();
    
    // 確定イベント一覧を表示
    renderEventsList();
    
    // 未払金額を表示
    updateUnpaidBanner();
}

// ========================================
// ローディング
// ========================================

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// ========================================
// API通信
// ========================================

async function fetchMembers() {
    try {
        const response = await fetch(`${API_URL}?action=getMembers`);
        const data = await response.json();
        
        if (data.success) {
            return data.members;
        } else {
            console.error('Failed to fetch members:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Error fetching members:', error);
        return [];
    }
}

async function loadSchedules() {
    try {
        const response = await fetch(`${API_URL}?action=getSchedules`);
        const data = await response.json();
        
        if (data.success) {
            schedulesCache = data.schedules.filter(s => s.status === '調整中');
        }
    } catch (error) {
        console.error('Error loading schedules:', error);
    }
}

async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}?action=getEvents`);
        const data = await response.json();
        
        if (data.success) {
            eventsCache = data.events;
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

async function loadPayments() {
    try {
        const response = await fetch(`${API_URL}?action=getPayments&memberName=${encodeURIComponent(currentUser)}`);
        const data = await response.json();
        
        if (data.success) {
            updateUnpaidBanner(data.totalUnpaid);
        }
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

// ========================================
// 予定調整一覧の表示
// ========================================

function renderSchedulesList() {
    const container = document.getElementById('schedules-list');
    container.innerHTML = '';
    
    if (schedulesCache.length === 0) {
        container.innerHTML = '<div class="empty-state">予定調整はありません</div>';
        return;
    }
    
    schedulesCache.forEach(schedule => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => showScheduleDetail(schedule.id);
        
        card.innerHTML = `
            <div class="card-title">${schedule.title}</div>
            <div class="card-meta">
                <span>作成者: ${schedule.creator}</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ========================================
// 確定イベント一覧の表示
// ========================================

function renderEventsList() {
    const container = document.getElementById('events-list');
    container.innerHTML = '';
    
    if (eventsCache.length === 0) {
        container.innerHTML = '<div class="empty-state">確定イベントはありません</div>';
        return;
    }
    
    eventsCache.forEach(event => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => showEventDetail(event.id);
        
        const datetime = new Date(event.datetime);
        const dateStr = `${datetime.getMonth() + 1}/${datetime.getDate()}(${['日','月','火','水','木','金','土'][datetime.getDay()]}) ${datetime.getHours()}:${String(datetime.getMinutes()).padStart(2, '0')}`;
        
        card.innerHTML = `
            <div class="card-title">${event.title}</div>
            <div class="card-meta">
                <span>${dateStr}</span>
                <span>参加: ${event.participants.length}人</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ========================================
// 未払金額バナーの更新
// ========================================

function updateUnpaidBanner(totalUnpaid = 0) {
    const banner = document.getElementById('unpaid-banner');
    const amountEl = document.getElementById('unpaid-amount');
    
    if (totalUnpaid > 0) {
        banner.style.display = 'block';
        amountEl.textContent = `¥${totalUnpaid.toLocaleString()}`;
        banner.onclick = () => showPaymentDialog(totalUnpaid);
    } else {
        banner.style.display = 'none';
    }
}

// ========================================
// 予定作成モーダル
// ========================================

document.getElementById('create-schedule-btn')?.addEventListener('click', () => {
    openCreateScheduleModal();
});

function openCreateScheduleModal() {
    const modal = document.getElementById('create-schedule-modal');
    const dateInputs = document.getElementById('date-inputs');
    
    // 初期候補日を3つ追加
    dateInputs.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        addDateInput();
    }
    
    modal.style.display = 'flex';
}

function closeCreateScheduleModal() {
    document.getElementById('create-schedule-modal').style.display = 'none';
    document.getElementById('create-schedule-form').reset();
}

function addDateInput() {
    const dateInputs = document.getElementById('date-inputs');
    const count = dateInputs.children.length;
    
    if (count >= 10) {
        alert('候補日は最大10個までです');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'date';
    input.className = 'date-input';
    input.required = count < 1; // 最初の1つは必須
    input.style.marginBottom = '8px';
    
    dateInputs.appendChild(input);
}

document.getElementById('add-date-btn')?.addEventListener('click', addDateInput);

document.getElementById('create-schedule-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('schedule-title-input').value;
    const dateInputs = document.querySelectorAll('#date-inputs input[type="date"]');
    const candidateDates = Array.from(dateInputs)
        .map(input => input.value)
        .filter(date => date);
    
    if (candidateDates.length === 0) {
        alert('候補日を最低1つ選択してください');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_URL}?action=createSchedule`, {
            method: 'POST',
            body: JSON.stringify({
                title,
                creator: currentUser,
                candidateDates
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeCreateScheduleModal();
            await loadSchedules();
            showHome();
        } else {
            alert('予定の作成に失敗しました');
        }
    } catch (error) {
        console.error('Error creating schedule:', error);
        alert('予定の作成に失敗しました');
    }
    
    hideLoading();
});

// ========================================
// ユーティリティ
// ========================================

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    
    return `${month}.${String(day).padStart(2, '0')}(${dayOfWeek})`;
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}/${month}/${day}(${dayOfWeek}) ${hours}:${minutes}`;
}
