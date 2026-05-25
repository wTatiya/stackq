/**
 * StackQ survey backend
 * Deploy: Web app → Execute as Me → Who has access: Anyone
 * Then Deploy → Manage deployments → Edit → New version → Deploy
 *
 * Sheet row 1: Timestamp | Name | Google Doc | Google Sheet | ... (one column per app)
 */
var ADMIN_KEY = 'somdej2445';

function doPost(e) {
  try {
    var sheet = getSheet_();
    var body = JSON.parse(e.postData.contents);
    appendSubmissionRow_(sheet, body);
    return respond_({ ok: true }, e);
  } catch (err) {
    return respond_({ ok: false, error: String(err) }, e);
  }
}

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  var action = (params.action || '').toLowerCase();

  if (action !== 'list') {
    return respond_({ ok: false, error: 'Use ?action=list&key=...' }, e);
  }

  if ((params.key || '') !== ADMIN_KEY) {
    return respond_({ ok: false, error: 'Unauthorized' }, e);
  }

  try {
    return respond_(buildSessionsPayload_(), e);
  } catch (err) {
    return respond_({ ok: false, error: String(err) }, e);
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('Responses') || ss.getSheets()[0];
}

function getHeaders_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 2);
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || '').trim();
  });
}

function appendSubmissionRow_(sheet, body) {
  var headers = getHeaders_(sheet);
  var responses = body.responses || {};
  var ts = new Date();

  if (headers.length < 2 || headers[0] !== 'Timestamp') {
    ensureHeaders_(sheet, Object.keys(responses));
    headers = getHeaders_(sheet);
  }

  var row = headers.map(function (header, i) {
    if (header === 'Timestamp') return ts;
    if (header === 'Name') return body.name || '';
    if (responses[header] !== undefined && responses[header] !== '') {
      return responses[header];
    }
    return '';
  });

  sheet.appendRow(row);
}

function ensureHeaders_(sheet, responseKeys) {
  var existing = getHeaders_(sheet);
  if (existing.length >= 2 && existing[0] === 'Timestamp') {
    return;
  }
  var base = ['Timestamp', 'Name'];
  responseKeys.forEach(function (k) {
    if (base.indexOf(k) === -1) base.push(k);
  });
  sheet.getRange(1, 1, 1, base.length).setValues([base]);
}

function buildSessionsPayload_() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, sessions: [], totalSubmissions: 0 };
  }

  var headers = getHeaders_(sheet);
  var lastCol = headers.length;
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var submissions = [];

  values.forEach(function (row) {
    var sub = rowToSubmission_(headers, row);
    if (sub) submissions.push(sub);
  });

  return groupSubmissionsByDate_(submissions);
}

function rowToSubmission_(headers, row) {
  var timestamp = row[0];
  var name = String(row[1] || '').trim();
  if (!name) return null;

  var responses = {};
  var col2 = row[2];

  if (isJsonCell_(col2)) {
    try {
      responses = JSON.parse(String(col2));
    } catch (e) {
      responses = {};
    }
  } else {
    for (var c = 2; c < headers.length; c++) {
      var header = headers[c];
      if (!header) continue;
      var val = row[c];
      if (val === '' || val === null || val === undefined) continue;
      responses[header] = String(val).trim();
    }
  }

  var submittedAt = timestamp instanceof Date
    ? timestamp.toISOString()
    : new Date(timestamp).toISOString();

  if (isNaN(new Date(submittedAt).getTime())) {
    submittedAt = new Date().toISOString();
  }

  return {
    name: name,
    submittedAt: submittedAt,
    responses: responses
  };
}

function isJsonCell_(val) {
  if (val === null || val === undefined || val === '') return false;
  var s = String(val).trim();
  return s.charAt(0) === '{' || s.charAt(0) === '[';
}

function groupSubmissionsByDate_(submissions) {
  var byDate = {};

  submissions.forEach(function (sub) {
    var dayKey = sub.submittedAt.slice(0, 10);
    if (!byDate[dayKey]) {
      byDate[dayKey] = {
        id: dayKey,
        label: formatThaiDateLabel_(dayKey),
        submissions: []
      };
    }
    byDate[dayKey].submissions.push(sub);
  });

  var sessions = Object.keys(byDate)
    .sort(function (a, b) { return b.localeCompare(a); })
    .map(function (key) {
      var session = byDate[key];
      session.submissions.sort(function (a, b) {
        return b.submittedAt.localeCompare(a.submittedAt);
      });
      session.participantCount = session.submissions.length;
      return session;
    });

  return {
    ok: true,
    sessions: sessions,
    totalSubmissions: submissions.length,
    updatedAt: new Date().toISOString()
  };
}

function formatThaiDateLabel_(isoDay) {
  var parts = isoDay.split('-');
  if (parts.length !== 3) return isoDay;
  var y = parseInt(parts[0], 10) + 543;
  var months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  var m = months[parseInt(parts[1], 10) - 1] || parts[1];
  return parseInt(parts[2], 10) + ' ' + m + ' ' + y;
}

/** JSON for same-origin; JSONP when ?callback=... (fixes CORS from GitHub Pages). */
function respond_(obj, e) {
  var params = e && e.parameter ? e.parameter : {};
  var callback = params.callback;
  var json = JSON.stringify(obj);

  if (callback && /^[A-Za-z_$][\w.$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
