/**
 * 遊び予定管理PWA - 支払い管理機能
 */

// ========================================
// 支払い完了ダイアログ
// ========================================

function showPaymentDialog(totalUnpaid) {
    const dialog = document.getElementById('payment-dialog');
    const text = document.getElementById('payment-confirm-text');

    text.textContent = `¥${totalUnpaid.toLocaleString()}を支払い完了しましたか?`;
    dialog.style.display = 'flex';
}

function closePaymentDialog() {
    document.getElementById('payment-dialog').style.display = 'none';
}

async function confirmPayment() {
    showLoading();
    closePaymentDialog();

    try {
        // 現在のユーザーの未払い情報を取得
        const response = await fetch(`${API_URL}?action=getPayments&memberName=${encodeURIComponent(currentUser)}`);
        const data = await response.json();

        if (!data.success) {
            alert('支払い情報の取得に失敗しました');
            hideLoading();
            return;
        }

        // 未払いの支払いをすべて完了にする
        const unpaidPayments = data.payments.filter(p => p.status === '未払');

        for (const payment of unpaidPayments) {
            await updatePaymentStatus(payment.eventId, currentUser);
        }

        // 未払金額を更新
        await loadPayments();

        alert('支払いを完了しました');

    } catch (error) {
        console.error('Error confirming payment:', error);
        alert('支払いの完了に失敗しました');
    }

    hideLoading();
}

async function updatePaymentStatus(eventId, memberName) {
    try {
        const response = await fetch(`${API_URL}?action=updatePayment`, {
            method: 'POST',
            body: JSON.stringify({
                eventId,
                memberName
            })
        });

        const data = await response.json();
        return data.success;

    } catch (error) {
        console.error('Error updating payment:', error);
        return false;
    }
}
