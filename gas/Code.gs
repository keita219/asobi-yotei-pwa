/**
 * 遊び予定管理PWA - Google Apps Script バックエンド
 * 
 * このスクリプトはスプレッドシートとPWAを連携させるWeb APIを提供します。
 * 
 * セットアップ手順:
 * 1. このコードをスプレッドシートのApps Scriptエディタに貼り付け
 * 2. デプロイ > 新しいデプロイ > ウェブアプリ
 * 3. アクセス権限: 「全員」に設定
 * 4. デプロイURLをコピーしてPWAの設定に使用
 */

// スプレッドシートのシート名定数
const SHEET_NAMES = {
  MEMBERS: 'Members',
  SCHEDULES: 'Schedules',
  SCHEDULE_RESPONSES: 'ScheduleResponses',
  EVENTS: 'Events',
  PAYMENTS: 'Payments'
};

/**
 * GETリクエストのハンドラー
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    let result;
    
    switch(action) {
      case 'getMembers':
        result = getMembers();
        break;
      case 'getSchedules':
        result = getSchedules();
        break;
      case 'getSchedule':
        result = getSchedule(e.parameter.id);
        break;
      case 'getScheduleResponses':
        result = getScheduleResponses(e.parameter.scheduleId);
        break;
      case 'getEvents':
        result = getEvents();
        break;
      case 'getEvent':
        result = getEvent(e.parameter.id);
        break;
      case 'getPayments':
        result = getPayments(e.parameter.memberName);
        break;
      case 'getAllPayments':
        result = getAllPayments();
        break;
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POSTリクエストのハンドラー
 */
function doPost(e) {
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);
  
  try {
    let result;
    
    switch(action) {
      case 'createSchedule':
        result = createSchedule(data);
        break;
      case 'submitResponse':
        result = submitResponse(data);
        break;
      case 'createEvent':
        result = createEvent(data);
        break;
      case 'updatePayment':
        result = updatePayment(data);
        break;
      case 'addMember':
        result = addMember(data);
        break;
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// メンバー関連の関数
// ========================================

/**
 * メンバー一覧を取得
 */
function getMembers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  const data = sheet.getDataRange().getValues();
  
  // ヘッダー行を除外
  const headers = data[0];
  const members = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) { // IDが存在する行のみ
      members.push({
        id: data[i][0],
        name: data[i][1],
        bankName: data[i][2],
        branchName: data[i][3],
        accountType: data[i][4],
        accountNumber: data[i][5],
        accountHolder: data[i][6]
      });
    }
  }
  
  return { success: true, members: members };
}

/**
 * メンバーを追加
 */
function addMember(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.MEMBERS);
  const lastRow = sheet.getLastRow();
  const newId = lastRow; // 新しいIDは最終行番号
  
  sheet.appendRow([
    newId,
    data.name,
    data.bankName || '',
    data.branchName || '',
    data.accountType || '',
    data.accountNumber || '',
    data.accountHolder || ''
  ]);
  
  return { success: true, id: newId };
}

// ========================================
// 予定調整関連の関数
// ========================================

/**
 * 予定調整一覧を取得
 */
function getSchedules() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SCHEDULES);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: true, schedules: [] };
  }
  
  const schedules = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) { // IDが存在する行のみ
      const candidateDates = [];
      for (let j = 5; j < data[i].length; j++) {
        if (data[i][j]) {
          candidateDates.push(data[i][j]);
        }
      }
      
      schedules.push({
        id: data[i][0],
        title: data[i][1],
        creator: data[i][2],
        createdAt: data[i][3],
        status: data[i][4],
        candidateDates: candidateDates
      });
    }
  }
  
  return { success: true, schedules: schedules };
}

/**
 * 特定の予定調整を取得
 */
function getSchedule(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SCHEDULES);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      const candidateDates = [];
      for (let j = 5; j < data[i].length; j++) {
        if (data[i][j]) {
          candidateDates.push(data[i][j]);
        }
      }
      
      return {
        success: true,
        schedule: {
          id: data[i][0],
          title: data[i][1],
          creator: data[i][2],
          createdAt: data[i][3],
          status: data[i][4],
          candidateDates: candidateDates
        }
      };
    }
  }
  
  return { success: false, error: 'Schedule not found' };
}

/**
 * 予定調整を作成
 */
function createSchedule(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SCHEDULES);
  const lastRow = sheet.getLastRow();
  const newId = lastRow > 0 ? lastRow : 1;
  
  const now = new Date();
  const row = [
    newId,
    data.title,
    data.creator,
    now,
    '調整中'
  ];
  
  // 候補日を追加(最大10個)
  for (let i = 0; i < 10; i++) {
    row.push(data.candidateDates[i] || '');
  }
  
  sheet.appendRow(row);
  
  return { success: true, id: newId };
}

// ========================================
// 予定回答関連の関数
// ========================================

/**
 * 予定調整の回答を取得
 */
function getScheduleResponses(scheduleId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SCHEDULE_RESPONSES);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: true, responses: [] };
  }
  
  const responses = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == scheduleId) {
      responses.push({
        scheduleId: data[i][0],
        memberName: data[i][1],
        candidateDate: data[i][2],
        response: data[i][3],
        respondedAt: data[i][4]
      });
    }
  }
  
  return { success: true, responses: responses };
}

/**
 * 予定調整の回答を登録
 */
function submitResponse(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.SCHEDULE_RESPONSES);
  
  // 既存の回答を削除(同じメンバーの回答を上書き)
  const existingData = sheet.getDataRange().getValues();
  for (let i = existingData.length - 1; i >= 1; i--) {
    if (existingData[i][0] == data.scheduleId && existingData[i][1] == data.memberName) {
      sheet.deleteRow(i + 1);
    }
  }
  
  // 新しい回答を追加
  const now = new Date();
  data.responses.forEach(response => {
    sheet.appendRow([
      data.scheduleId,
      data.memberName,
      response.candidateDate,
      response.response,
      now
    ]);
  });
  
  return { success: true };
}

// ========================================
// 確定イベント関連の関数
// ========================================

/**
 * 確定イベント一覧を取得
 */
function getEvents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: true, events: [] };
  }
  
  const events = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      events.push({
        id: data[i][0],
        title: data[i][1],
        datetime: data[i][2],
        location: data[i][3],
        payer: data[i][4],
        totalAmount: data[i][5],
        amountPerPerson: data[i][6],
        participants: data[i][7] ? data[i][7].split(',') : [],
        memo: data[i][8]
      });
    }
  }
  
  return { success: true, events: events };
}

/**
 * 特定の確定イベントを取得
 */
function getEvent(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      return {
        success: true,
        event: {
          id: data[i][0],
          title: data[i][1],
          datetime: data[i][2],
          location: data[i][3],
          payer: data[i][4],
          totalAmount: data[i][5],
          amountPerPerson: data[i][6],
          participants: data[i][7] ? data[i][7].split(',') : [],
          memo: data[i][8]
        }
      };
    }
  }
  
  return { success: false, error: 'Event not found' };
}

/**
 * 確定イベントを作成
 */
function createEvent(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventSheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
  const paymentSheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);
  
  const lastRow = eventSheet.getLastRow();
  const newId = lastRow > 0 ? lastRow : 1;
  
  // イベントを追加
  eventSheet.appendRow([
    newId,
    data.title,
    data.datetime,
    data.location,
    data.payer,
    data.totalAmount,
    data.amountPerPerson,
    data.participants.join(','),
    data.memo || ''
  ]);
  
  // 支払い情報を追加
  data.participants.forEach(participant => {
    const status = participant === data.payer ? '立替' : '未払';
    paymentSheet.appendRow([
      newId,
      participant,
      data.amountPerPerson,
      status,
      ''
    ]);
  });
  
  return { success: true, id: newId };
}

// ========================================
// 支払い関連の関数
// ========================================

/**
 * 特定メンバーの支払い情報を取得
 */
function getPayments(memberName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: true, payments: [], totalUnpaid: 0 };
  }
  
  const payments = [];
  let totalUnpaid = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == memberName) {
      const payment = {
        eventId: data[i][0],
        memberName: data[i][1],
        amount: data[i][2],
        status: data[i][3],
        paidAt: data[i][4]
      };
      payments.push(payment);
      
      if (payment.status === '未払') {
        totalUnpaid += payment.amount;
      }
    }
  }
  
  return { success: true, payments: payments, totalUnpaid: totalUnpaid };
}

/**
 * 全メンバーの支払い情報を取得
 */
function getAllPayments() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: true, payments: [] };
  }
  
  const payments = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      payments.push({
        eventId: data[i][0],
        memberName: data[i][1],
        amount: data[i][2],
        status: data[i][3],
        paidAt: data[i][4]
      });
    }
  }
  
  return { success: true, payments: payments };
}

/**
 * 支払い状況を更新
 */
function updatePayment(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.PAYMENTS);
  const sheetData = sheet.getDataRange().getValues();
  
  const now = new Date();
  
  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] == data.eventId && sheetData[i][1] == data.memberName) {
      sheet.getRange(i + 1, 4).setValue('支払済');
      sheet.getRange(i + 1, 5).setValue(now);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Payment not found' };
}
