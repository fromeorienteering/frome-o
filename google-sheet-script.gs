/**
 * Frome Orienteering: results inbox.
 * Paste this whole file into Extensions > Apps Script in a new Google Sheet,
 * then deploy it as a web app (see SETUP.md).
 * A row appears when a runner starts and is filled in when they finish.
 */
// Pick a password for publishing results, put it between the quotes, and enter
// the same one in the app (Events page, Results page section).
const PUBLISH_PASSWORD = "";

// Only needed if you made this script at script.google.com rather than from inside
// your Sheet (Extensions > Apps Script). Paste the Sheet's ID between the quotes:
// it's the long code in the Sheet's web address, between /d/ and /edit.
const SHEET_ID = "";

function book_() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID.trim());
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("This script isn't linked to a Sheet. Paste the Sheet's ID into SHEET_ID at the top.");
  return ss;
}

const TAB = "Results";
const PUB_TAB = "Published";
const MEM_TAB = "Members";
const PUB_HEADERS = ["eventId", "name", "date", "data", "published"];
const HEADERS = ["runId", "eventId", "name", "course", "type", "start", "finish", "data", "received"];

function tab_() {
  const ss = book_();
  let sh = ss.getSheetByName(TAB);
  if (!sh) { sh = ss.insertSheet(TAB); sh.appendRow(HEADERS); sh.setFrozenRows(1); }
  return sh;
}
function pubTab_() {
  const ss = book_();
  let sh = ss.getSheetByName(PUB_TAB);
  if (!sh) { sh = ss.insertSheet(PUB_TAB); sh.appendRow(PUB_HEADERS); sh.setFrozenRows(1); }
  return sh;
}
function memTab_() {
  const ss = book_();
  let sh = ss.getSheetByName(MEM_TAB);
  if (!sh) { sh = ss.insertSheet(MEM_TAB); sh.appendRow(["id", "name", "status"]); sh.setFrozenRows(1); }
  return sh;
}
// A wrong password waits a second before answering, which makes guessing slow.
function keyOk_(d) {
  if (PUBLISH_PASSWORD && String(d.key || "") === PUBLISH_PASSWORD) return true;
  Utilities.sleep(1000);
  return false;
}
function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
// stops a runner's name being read by Sheets as a formula
function text_(s) {
  s = String(s == null ? "" : s).slice(0, 60);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// A runner's phone sends its start, then its finished result, here.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action === "check") {
      if (!PUBLISH_PASSWORD) return out_({ ok: false, error: "no password set" });
      return out_(keyOk_(d) ? { ok: true } : { ok: false, error: "wrong password" });
    }
    if (d.action === "publish" || d.action === "unpublish") return publish_(d);
    if (d.action === "members") return setMembers_(d);
    if (d.action === "join") return join_(d);
    if (!d.runId || !d.eventId || !d.start) return out_({ ok: false, error: "missing fields" });
    const sh = tab_();
    const last = sh.getLastRow();
    const rows = last > 1 ? sh.getRange(2, 1, last - 1, 7).getValues() : [];
    const i = rows.findIndex(r => String(r[0]) === String(d.runId));
    // a late-arriving start must never wipe out a finish that's already in
    if (i >= 0 && rows[i][6] && !d.finish) return out_({ ok: true });
    const row = [String(d.runId), String(d.eventId), text_(d.name), String(d.course || "c1"), String(d.type || "solo"),
                 Number(d.start), d.finish ? Number(d.finish) : "",
                 JSON.stringify({ courseName: d.courseName || "", size: Number(d.size) || 1, members: (d.members || []).slice(0, 30).map(x => x ? String(x).slice(0, 12) : null), punches: d.punches || [] }).slice(0, 8000),
                 new Date()];
    if (i >= 0) sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// The organiser publishes (or removes) one event's results for the public page.
function publish_(d) {
  if (!PUBLISH_PASSWORD) return out_({ ok: false, error: "no password set" });
  if (!keyOk_(d)) return out_({ ok: false, error: "wrong password" });
  const sh = pubTab_();
  const last = sh.getLastRow();
  const ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0])) : [];
  if (d.action === "unpublish") {
    const i = ids.indexOf(String(d.eventId));
    if (i >= 0) sh.deleteRow(i + 2);
    return out_({ ok: true });
  }
  const ev = d.event || {};
  if (!ev.id) return out_({ ok: false, error: "missing event" });
  const rows = (d.rows || []).map(r => ({ course: String(r.course), pos: Number(r.pos), name: String(r.name || "").slice(0, 60),
    type: String(r.type || "solo"), size: Number(r.size) || 1, time: Number(r.time), pts: Number(r.pts), bonus: Number(r.bonus) || 0, pen: Number(r.pen),
    total: Number(r.total), controls: Number(r.controls) || 0,
    members: (r.members || []).slice(0, 30).map(x => x ? String(x).slice(0, 12) : null) }));
  const volunteers = (ev.volunteers || []).slice(0, 100).map(v => ({ id: v && v.id ? String(v.id).slice(0, 12) : null, name: String((v && v.name) || "").trim().slice(0, 60) })).filter(v => v.name);
  const data = JSON.stringify({ penaltyPerMin: Number(ev.penaltyPerMin) || 0, bonus: Number(ev.bonus) || 0, courses: ev.courses || [], rows: rows, volunteers: volunteers });
  const row = [String(ev.id), text_(ev.name), String(ev.date || ""), data, new Date()];
  const i = ids.indexOf(String(ev.id));
  if (i >= 0) sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
  return out_({ ok: true });
}

// Everyone's results page asks for all published events here.
function published_() {
  const sh = pubTab_();
  const last = sh.getLastRow();
  const rows = last > 1 ? sh.getRange(2, 1, last - 1, 5).getValues() : [];
  const events = rows.map(r => {
    let d = {};
    try { d = JSON.parse(r[3] || "{}"); } catch (x) {}
    const date = r[2] instanceof Date ? Utilities.formatDate(r[2], "Europe/London", "yyyy-MM-dd") : String(r[2]);
    return { id: String(r[0]), name: String(r[1]).replace(/^'/, ""), date: date, penaltyPerMin: d.penaltyPerMin || 0, bonus: d.bonus || 0,
             courses: d.courses || [], rows: d.rows || [], volunteers: d.volunteers || [], publishedAt: r[4] instanceof Date ? r[4].getTime() : 0 };
  });
  return out_({ ok: true, events: events });
}

// Club member list: names only. Runners pick from it; newcomers ask to join.
function readMembers_() {
  const sh = memTab_(), last = sh.getLastRow();
  const rows = last > 1 ? sh.getRange(2, 1, last - 1, 3).getValues() : [];
  const members = [], pending = [];
  rows.forEach(r => {
    const name = String(r[1]).replace(/^'/, "").trim(); if (!name) return;
    if (String(r[2]) === "pending") pending.push({ name: name }); else if (r[0]) members.push({ id: String(r[0]), name: name });
  });
  return { members: members, pending: pending };
}
function join_(d) {
  const name = String(d.name || "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (!name) return out_({ ok: false, error: "missing name" });
  const m = readMembers_(), lc = name.toLowerCase();
  if (m.members.some(x => x.name.toLowerCase() === lc) || m.pending.some(x => x.name.toLowerCase() === lc)) return out_({ ok: true });
  if (m.pending.length >= 200) return out_({ ok: false, error: "too many waiting" });
  memTab_().appendRow(["", text_(name), "pending"]);
  return out_({ ok: true });
}
function setMembers_(d) {
  if (!PUBLISH_PASSWORD) return out_({ ok: false, error: "no password set" });
  if (!keyOk_(d)) return out_({ ok: false, error: "wrong password" });
  const cur = readMembers_();
  const members = (d.members || []).filter(x => x && x.id && x.name)
    .map(x => ({ id: String(x.id).slice(0, 12), name: String(x.name).trim().replace(/\s+/g, " ").slice(0, 60) })).slice(0, 2000);
  const taken = new Set(members.map(x => x.name.toLowerCase()));
  const dismissed = new Set((d.dismissed || []).map(x => String(x).trim().toLowerCase()));
  // keep anyone who asked to join since the organiser's screen last loaded
  const pending = cur.pending.filter(p => !taken.has(p.name.toLowerCase()) && !dismissed.has(p.name.toLowerCase()));
  const sh = memTab_(), last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, 3).clearContent();
  const rows = members.map(m => [m.id, text_(m.name), "member"]).concat(pending.map(p => ["", text_(p.name), "pending"]));
  if (rows.length) sh.getRange(2, 1, rows.length, 3).setValues(rows);
  return out_({ ok: true, members: members, pending: pending });
}

// The organiser's screen asks for one event's starters and results here.
function doGet(e) {
  if (e.parameter && e.parameter.published) return published_();
  if (e.parameter && e.parameter.members) { const m = readMembers_(); return out_({ ok: true, members: m.members, pending: m.pending }); }
  const ev = String((e.parameter && e.parameter.event) || "").toLowerCase();
  const sh = tab_();
  const last = sh.getLastRow();
  const rows = last > 1 ? sh.getRange(2, 1, last - 1, 8).getValues() : [];
  const results = rows.filter(r => String(r[1]) === ev).map(r => {
    let d = {};
    try { d = JSON.parse(r[7] || "{}"); } catch (x) {}
    return { runId: String(r[0]), eventId: String(r[1]), name: String(r[2]).replace(/^'/, ""),
             course: String(r[3]), type: String(r[4]), size: d.size || 1,
             start: Number(r[5]), finish: r[6] ? Number(r[6]) : null, members: d.members || [], punches: d.punches || [] };
  });
  return out_({ ok: true, results: results });
}
