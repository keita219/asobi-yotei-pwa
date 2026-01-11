/**
 * 遊び予定管理PWA - 予定調整機能
 */

// ========================================
// 予定調整詳細の表示
// ========================================

async function showScheduleDetail(scheduleId) {
    showLoading();

    try {
        // 予定調整の詳細を取得
        const scheduleResponse = await fetch(`${API_URL}?action=getSchedule&id=${scheduleId}`);
        const scheduleData = await scheduleResponse.json();

        if (!scheduleData.success) {
            alert('予定調整の取得に失敗しました');
            hideLoading();
            return;
        }

        const schedule = scheduleData.schedule;

        // 回答を取得
        const responsesResponse = await fetch(`${API_URL}?action=getScheduleResponses&scheduleId=${scheduleId}`);
        const responsesData = await responsesResponse.json();

        const responses = responsesData.success ? responsesData.responses : [];

        // 画面を表示
        showScreen('schedule-detail-screen');
        document.getElementById('schedule-title').textContent = schedule.title;

        // 回答を集計
        const summary = calculateResponseSummary(schedule.candidateDates, responses);

        // テーブルを表示
        renderScheduleTable(schedule, summary);

        // 編集ボタン
        document.getElementById('edit-schedule-btn').onclick = () => {
            showResponseScreen(schedule, responses);
        };

        // 確定ボタン
        document.getElementById('confirm-event-btn').onclick = () => {
            openConfirmEventModal(schedule);
        };

    } catch (error) {
        console.error('Error showing schedule detail:', error);
        alert('予定調整の表示に失敗しました');
    }

    hideLoading();
}

// ========================================
// 回答の集計
// ========================================

function calculateResponseSummary(candidateDates, responses) {
    const summary = {};

    candidateDates.forEach(date => {
        summary[date] = {
            ok: 0,
            maybe: 0,
            ng: 0,
            none: 0
        };
    });

    // メンバーごとの回答を集計
    const memberResponses = {};
    responses.forEach(response => {
        if (!memberResponses[response.memberName]) {
            memberResponses[response.memberName] = {};
        }
        memberResponses[response.memberName][response.candidateDate] = response.response;
    });

    // 各日程の集計
    membersCache.forEach(member => {
        candidateDates.forEach(date => {
            const response = memberResponses[member.name]?.[date];

            if (response === '○') {
                summary[date].ok++;
            } else if (response === '△') {
                summary[date].maybe++;
            } else if (response === '×') {
                summary[date].ng++;
            } else {
                summary[date].none++;
            }
        });
    });

    return summary;
}

// ========================================
// 予定調整テーブルの表示
// ========================================

function renderScheduleTable(schedule, summary) {
    const container = document.getElementById('schedule-detail-content');

    // 最多○の数を見つける
    let maxOk = 0;
    Object.values(summary).forEach(s => {
        if (s.ok > maxOk) maxOk = s.ok;
    });

    let html = '<div class="schedule-table">';

    schedule.candidateDates.forEach(date => {
        const s = summary[date];
        const isHighlight = s.ok === maxOk && maxOk > 0;

        html += `
            <div class="schedule-row">
                <div class="schedule-date ${isHighlight ? 'highlight' : ''}">
                    ${formatDate(date)}
                </div>
                <div class="schedule-counts">
                    <span class="count-item count-ok">○${s.ok}</span>
                    <span class="count-item count-maybe">△${s.maybe}</span>
                    <span class="count-item count-ng">×${s.ng}</span>
                    ${s.none > 0 ? `<span class="count-item count-none">-${s.none}</span>` : ''}
                </div>
            </div>
        `;
    });

    html += '</div>';

    container.innerHTML = html;
}

// ========================================
// 予定回答画面の表示
// ========================================

async function showResponseScreen(schedule, existingResponses) {
    showScreen('response-screen');

    // スケジュール情報を表示
    document.getElementById('schedule-info').innerHTML = `
        <h3>${schedule.title}</h3>
        <p>あなたの予定を選択してください</p>
    `;

    // 既存の回答を取得
    const userResponses = {};
    existingResponses.forEach(response => {
        if (response.memberName === currentUser) {
            userResponses[response.candidateDate] = response.response;
        }
    });

    // 回答フォームを表示
    const formContainer = document.getElementById('response-form');
    formContainer.innerHTML = '';

    schedule.candidateDates.forEach(date => {
        const currentResponse = userResponses[date] || '';

        const row = document.createElement('div');
        row.className = 'response-row';
        row.innerHTML = `
            <div class="response-date">${formatDate(date)}</div>
            <div class="response-buttons">
                <button class="response-btn ${currentResponse === '○' ? 'active-ok' : ''}" 
                        data-date="${date}" data-response="○">⭕</button>
                <button class="response-btn ${currentResponse === '△' ? 'active-maybe' : ''}" 
                        data-date="${date}" data-response="△">🔺</button>
                <button class="response-btn ${currentResponse === '×' ? 'active-ng' : ''}" 
                        data-date="${date}" data-response="×">❌</button>
            </div>
        `;

        formContainer.appendChild(row);
    });

    // ボタンのイベントリスナー
    document.querySelectorAll('.response-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const date = e.currentTarget.dataset.date;
            const response = e.currentTarget.dataset.response;

            // 同じ日程の他のボタンを非アクティブに
            document.querySelectorAll(`[data-date="${date}"]`).forEach(b => {
                b.classList.remove('active-ok', 'active-maybe', 'active-ng');
            });

            // クリックされたボタンをアクティブに
            if (response === '○') {
                e.currentTarget.classList.add('active-ok');
            } else if (response === '△') {
                e.currentTarget.classList.add('active-maybe');
            } else if (response === '×') {
                e.currentTarget.classList.add('active-ng');
            }
        });
    });

    // 完了ボタン
    document.getElementById('submit-response-btn').onclick = async () => {
        await submitResponses(schedule.id, schedule.candidateDates);
    };
}

function backToScheduleDetail() {
    const scheduleId = schedulesCache.find(s => s.status === '調整中')?.id;
    if (scheduleId) {
        showScheduleDetail(scheduleId);
    } else {
        showHome();
    }
}

// ========================================
// 回答の送信
// ========================================

async function submitResponses(scheduleId, candidateDates) {
    const responses = [];

    candidateDates.forEach(date => {
        const activeBtn = document.querySelector(`[data-date="${date}"].active-ok, [data-date="${date}"].active-maybe, [data-date="${date}"].active-ng`);

        if (activeBtn) {
            responses.push({
                candidateDate: date,
                response: activeBtn.dataset.response
            });
        }
    });

    if (responses.length === 0) {
        alert('最低1つの日程に回答してください');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_URL}?action=submitResponse`, {
            method: 'POST',
            body: JSON.stringify({
                scheduleId,
                memberName: currentUser,
                responses
            })
        });

        const data = await response.json();

        if (data.success) {
            // 予定調整詳細画面に戻る
            await showScheduleDetail(scheduleId);
        } else {
            alert('回答の送信に失敗しました');
        }
    } catch (error) {
        console.error('Error submitting responses:', error);
        alert('回答の送信に失敗しました');
    }

    hideLoading();
}
