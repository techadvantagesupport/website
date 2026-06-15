/**
 * Wholesome Family Organics — inventory + order backend (Google Apps Script).
 *
 * WHAT IT DOES
 *   • GET  -> returns the current inventory (read from the "Inventory" sheet)
 *   • POST -> places an order: subtracts quarters from the chosen delivery
 *             (Half = 2 quarters, Quarter = 1), logs the order, returns the
 *             updated inventory. Uses a lock so two orders can't oversell.
 *
 * SETUP (see SETUP.md for the step-by-step):
 *   1. Make a Google Sheet with a tab named  Inventory  and this header row:
 *          readyDate | quartersTotal | quartersLeft | note
 *      (readyDate like 2026-07-15). One row per delivery.
 *   2. Extensions > Apps Script. Delete the sample, paste THIS file. Save.
 *   3. Deploy > New deployment > type "Web app":
 *          Execute as: Me      Who has access: Anyone
 *      Authorize when prompted. Copy the Web app URL that ends in /exec.
 *   4. Paste that URL into config.js  ->  inventoryApiUrl: "...".
 */

var INV_SHEET = "Inventory";   // tab the business edits
var LOG_SHEET = "Orders";      // created automatically; the order log

function doGet(e) {
  return json_({ ok: true, inventory: readInventory_() });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return json_({ ok: false, error: "busy" }); }
  try {
    var body = {};
    try { body = JSON.parse(e.postData.contents); } catch (err) {}
    if (body.action === "order") return json_(placeOrder_(body));
    return json_({ ok: false, error: "unknown action", inventory: readInventory_() });
  } finally {
    lock.releaseLock();
  }
}

function readInventory_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(INV_SHEET);
  if (!sh) return [];
  var rows = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {           // skip header row
    var r = rows[i];
    if (r[0] === "" && r[1] === "") continue;        // skip blank rows
    out.push({
      readyDate: formatDate_(r[0]),
      quartersTotal: Number(r[1]) || 0,
      quartersLeft: Number(r[2]) || 0,
      note: r[3] || ""
    });
  }
  return out;
}

function placeOrder_(body) {
  var sh = SpreadsheetApp.getActive().getSheetByName(INV_SHEET);
  if (!sh) return { ok: false, error: "no Inventory sheet" };
  var take = body.amount === "Half" ? 2 : 1;         // quarters to subtract
  var rows = sh.getDataRange().getValues();
  var rowIdx = -1;
  for (var i = 1; i < rows.length; i++) {
    if (formatDate_(rows[i][0]) === String(body.readyDate)) { rowIdx = i; break; }
  }
  if (rowIdx < 0) { logOrder_(body, take, "no-match"); return { ok: false, error: "delivery not found", inventory: readInventory_() }; }
  var left = Number(rows[rowIdx][2]) || 0;
  if (left < take) { logOrder_(body, take, "sold-out"); return { ok: false, error: "not enough left", inventory: readInventory_() }; }
  sh.getRange(rowIdx + 1, 3).setValue(left - take);  // column C = quartersLeft
  logOrder_(body, take, "decremented");
  return { ok: true, inventory: readInventory_() };
}

function logOrder_(body, take, status) {
  try {
    var ss = SpreadsheetApp.getActive();
    var sh = ss.getSheetByName(LOG_SHEET);
    if (!sh) { sh = ss.insertSheet(LOG_SHEET); sh.appendRow(["When", "Name", "Email", "Phone", "Amount", "Delivery", "QuartersTaken", "Status", "Cuts"]); }
    sh.appendRow([new Date(), body.name || "", body.email || "", body.phone || "", body.amount || "", body.readyDate || "", take, status, body.cuts || ""]);
  } catch (err) {}
}

function formatDate_(v) {
  if (v instanceof Date) {
    var y = v.getFullYear(), m = ("0" + (v.getMonth() + 1)).slice(-2), d = ("0" + v.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }
  return String(v).slice(0, 10);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
