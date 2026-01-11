/**
 * 遊び予定管理PWA - イベント管理機能
 */

// ========================================
// イベント詳細の表示
// ========================================

async function showEventDetail(eventId) {
    showLoading();

    try {
        // イベント詳細を取得
        const eventResponse = await fetch(`${API_URL}?action=getEvent&id=${eventId}`);
        const eventData = await eventResponse.json();

        if (!eventData.success) {
            alert('イベントの取得に失敗しました');
            hideLoading();
            return;
        }

        const event = eventData.event;

        // 支払い情報を取得
        const paymentsResponse = await fetch(`${API_URL}?action=getAllPayments`);
        const paymentsData = await paymentsResponse.json();

        const payments = paymentsData.success ?
            paymentsData.payments.filter(p => p.eventId == eventId) : [];

        // 画面を表示
        showScreen('event-detail-screen');
        document.getElementById('event-title').textContent = event.title;

        // イベント情報を表示
        renderEventDetail(event, payments);

    } catch (error) {
        console.error('Error showing event detail:', error);
        alert('イベントの表示に失敗しました');
    }

    hideLoading();
}

// ========================================
// イベント詳細の表示
// ========================================

function renderEventDetail(event, payments) {
    const container = document.getElementById('event-detail-content');

    let html = `
        <div class="event-info">
            <div class="event-info-row">
                <span class="event-icon">📅</span>
                <span>${formatDateTime(event.datetime)}</span>
            </div>
            <div class="event-info-row">
                <span class="event-icon">📍</span>
                <span>${event.location}</span>
            </div>
        </div>
        
        <div class="participants-section">
            <h3>参加者(${event.participants.length}人)</h3>
            <div class="participant-list">
    `;

    event.participants.forEach(participant => {
        const payment = payments.find(p => p.memberName === participant);
        let statusIcon = '✅';

        if (payment) {
            if (payment.status === '立替') {
                statusIcon = '💰';
            } else if (payment.status === '未払') {
                statusIcon = '⏳';
            } else {
                statusIcon = '✅';
            }
        }

        html += `
            <div class="participant-item">
                <span class="participant-status">${statusIcon}</span>
                <span>${participant}</span>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// ========================================
// イベント確定モーダル
// ========================================

function openConfirmEventModal(schedule) {
    const modal = document.getElementById('confirm-event-modal');

    // タイトルを設定
    document.getElementById('event-title-input').value = schedule.title;

    // 立替者の選択肢を設定(けーたろーを最初に)
    const payerSelect = document.getElementById('event-payer-input');
    payerSelect.innerHTML = '';

    // けーたろーを最初に追加
    const keitaroMember = membersCache.find(m => m.name === 'けーたろー');
    if (keitaroMember) {
        const option = document.createElement('option');
        option.value = keitaroMember.name;
        option.textContent = keitaroMember.name;
        payerSelect.appendChild(option);
    }

    // 他のメンバーを追加
    membersCache.forEach(member => {
        if (member.name !== 'けーたろー') {
            const option = document.createElement('option');
            option.value = member.name;
            option.textContent = member.name;
            payerSelect.appendChild(option);
        }
    });

    // 参加者のチェックボックスを設定
    const participantsContainer = document.getElementById('participants-checkboxes');
    participantsContainer.innerHTML = '<div class="checkbox-group"></div>';
    const checkboxGroup = participantsContainer.querySelector('.checkbox-group');

    membersCache.forEach(member => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        checkboxItem.innerHTML = `
            <input type="checkbox" id="participant-${member.id}" value="${member.name}">
            <label for="participant-${member.id}">${member.name}</label>
        `;
        checkboxGroup.appendChild(checkboxItem);
    });

    // 一人当たりの金額を自動計算
    const totalInput = document.getElementById('event-total-input');
    const amountPerPersonEl = document.getElementById('amount-per-person');

    const updateAmountPerPerson = () => {
        const total = parseInt(totalInput.value) || 0;
        const participantCount = document.querySelectorAll('#participants-checkboxes input:checked').length;

        if (participantCount > 0) {
            const perPerson = Math.floor(total / participantCount);
            amountPerPersonEl.textContent = `¥${perPerson.toLocaleString()}`;
        } else {
            amountPerPersonEl.textContent = '¥0';
        }
    };

    totalInput.addEventListener('input', updateAmountPerPerson);
    document.querySelectorAll('#participants-checkboxes input').forEach(checkbox => {
        checkbox.addEventListener('change', updateAmountPerPerson);
    });

    modal.style.display = 'flex';
}

function closeConfirmEventModal() {
    document.getElementById('confirm-event-modal').style.display = 'none';
    document.getElementById('confirm-event-form').reset();
}

document.getElementById('confirm-event-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('event-title-input').value;
    const datetime = document.getElementById('event-datetime-input').value;
    const location = document.getElementById('event-location-input').value;
    const payer = document.getElementById('event-payer-input').value;
    const totalAmount = parseInt(document.getElementById('event-total-input').value);

    const participants = Array.from(document.querySelectorAll('#participants-checkboxes input:checked'))
        .map(checkbox => checkbox.value);

    if (participants.length === 0) {
        alert('参加者を最低1人選択してください');
        return;
    }

    const amountPerPerson = Math.floor(totalAmount / participants.length);

    showLoading();

    try {
        const response = await fetch(`${API_URL}?action=createEvent`, {
            method: 'POST',
            body: JSON.stringify({
                title,
                datetime,
                location,
                payer,
                totalAmount,
                amountPerPerson,
                participants
            })
        });

        const data = await response.json();

        if (data.success) {
            closeConfirmEventModal();
            await loadEvents();
            await loadPayments();
            showHome();
        } else {
            alert('イベントの確定に失敗しました');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        alert('イベントの確定に失敗しました');
    }

    hideLoading();
});
