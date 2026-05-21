/**
 * StackQ survey backend — deploy as Web App (Execute as: Me, Access: Anyone).
 * Sheet columns: Timestamp | Name | Responses (JSON) | SubmittedAt (ISO, optional)
 */
var ADMIN_KEY = 'somdej2445';

function doPost(e) {
  try {
    var sheet = getSheet_();
    var body = JSON.parse(e.postData.contents);
    var ts = new Date();
    var submittedAt = body.submittedAt || ts.toISOString();
    var responsesJson = JSON.stringify(body.responses || {});
    sheet.appendRow([ts, body.name || '', responsesJson, submittedAt]);
    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  var action = (params.action || '').toLowerCase();

  if (action !== 'list') {
    return jsonOut_({ ok: false, error: 'Use ?action=list&key=...' });
  }

  if ((params.key || '') !== ADMIN_KEY) {
    return jsonOut_({ ok: false, error: 'Unauthorized' });
  }

  try {
    return jsonOut_(buildSessionsPayload_());
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Responses') || ss.getSheets()[0];
  return sheet;
}

function buildSessionsPayload_() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, sessions: [], totalSubmissions: 0 };
  }

  var colCount = Math.max(sheet.getLastColumn(), 3);
  var values = sheet.getRange(2, 1, lastRow, colCount).getValues();
  var submissions = [];

  values.forEach(function (row) {
    var timestamp = row[0];
    var name = String(row[1] || '').trim();
    var responsesRaw = row[2];
    var submittedAtCell = colCount >= 4 ? row[3] : null;

    if (!name) return;

    var responses = {};
    try {
      if (typeof responsesRaw === 'string' && responsesRaw) {
        responses = JSON.parse(responsesRaw);
      } else if (responsesRaw && typeof responsesRaw === 'object') {
        responses = responsesRaw;
      }
    } catch (parseErr) {
      responses = {};
    }

    var submittedAt = submittedAtCell
      ? new Date(submittedAtCell).toISOString()
      : (timestamp instanceof Date ? timestamp.toISOString() : new Date().toISOString());

    submissions.push({
      name: name,
      submittedAt: submittedAt,
      responses: responses
    });
  });

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

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
