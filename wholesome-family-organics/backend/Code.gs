// Wholesome Family Organics - inventory + order backend (Google Apps Script).
//
// WHAT IT DOES
//   GET  -> returns current inventory + pricing (read from the Sheet)
//   POST -> places an order: subtracts quarters from the chosen delivery
//           (Half = 2 quarters, Quarter = 1), logs the order, returns the
//           updated inventory. Uses a lock so two orders can't oversell.
//
// SETUP (see SETUP.md):
//   1. Sheet with an "Inventory" tab: readyDate | quartersTotal | quartersLeft | note
//   2. Extensions > Apps Script. Select all, delete, paste THIS file. Save.
//   3. Deploy > New deployment > Web app. Execute as: Me. Access: Anyone.
//      Authorize, then copy the Web app URL ending in /exec.
//   4. Paste that URL into config.js -> inventoryApiUrl: "...".

var INV_SHEET = "Inventory";   // tab the business edits (falls back to the first tab if not found)
var LOG_SHEET = "Orders";      // created automatically; the order log
var PRICE_SHEET = "Pricing";   // created automatically with the defaults below

// Where order emails are sent. Change this to the business address when ready
// to go live, then re-deploy (Manage deployments > Edit > New version).
var ORDER_EMAIL = "pksteichen@gmail.com";

// Spam protection: max orders allowed per email or phone in a rolling 24 hours.
// (Apps Script can't see the visitor's IP, so we limit by email/phone instead.)
var MAX_PER_DAY = 3;

// Default prices/settings - used to create the Pricing tab the first time.
// After that, the business edits the values in the Pricing tab, not here.
var PRICE_DEFAULTS = [
  ["key", "value", "what it controls"],
  ["halfPricePerLb",    5.48, "Half - price per lb (hanging weight)"],
  ["quarterPricePerLb", 5.68, "Quarter - price per lb (hanging weight)"],
  ["halfDeposit",        500, "Half - deposit due with order"],
  ["quarterDeposit",       0, "Quarter - deposit due with order (0 = none)"],
  ["halfWeightLow",      320, "Half - typical hanging weight low (lbs)"],
  ["halfWeightHigh",     430, "Half - typical hanging weight high (lbs)"],
  ["quarterWeightLow",   150, "Quarter - typical hanging weight low (lbs)"],
  ["quarterWeightHigh",  215, "Quarter - typical hanging weight high (lbs)"],
  ["yieldLowPct",         60, "Yield % of hanging weight, low"],
  ["yieldHighPct",        70, "Yield % of hanging weight, high"]
];

function invSheet_() {
  var ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(INV_SHEET) || ss.getSheets()[0];
}

function ensurePricing_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(PRICE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(PRICE_SHEET);
    sh.getRange(1, 1, PRICE_DEFAULTS.length, 3).setValues(PRICE_DEFAULTS);
    sh.setColumnWidth(1, 150); sh.setColumnWidth(3, 320);
  }
  return sh;
}

function readPricing_() {
  var sh = ensurePricing_();
  var rows = sh.getDataRange().getValues();
  var out = {};
  for (var i = 1; i < rows.length; i++) {            // skip header
    var k = String(rows[i][0]).trim();
    if (k) out[k] = Number(rows[i][1]) || 0;
  }
  return out;
}

function doGet(e) {
  return json_({ ok: true, inventory: readInventory_(), pricing: readPricing_() });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return json_({ ok: false, error: "busy" }); }
  try {
    var body = {};
    try { body = JSON.parse(e.postData.contents); } catch (err) {}
    if (body.action === "order") {
      if (body.botcheck) return json_({ ok: true, inventory: readInventory_() });   // honeypot: silently drop bots
      if (isRateLimited_(body)) return json_({ ok: false, error: "rate-limited", inventory: readInventory_() });
      var res = placeOrder_(body);
      res.emailError = sendOrderEmail_(body, res);   // null if the email sent OK
      return json_(res);
    }
    return json_({ ok: false, error: "unknown action", inventory: readInventory_() });
  } finally {
    lock.releaseLock();
  }
}

// True if this email or phone already placed MAX_PER_DAY orders in the last 24h.
function isRateLimited_(body) {
  var sh = SpreadsheetApp.getActive().getSheetByName(LOG_SHEET);
  if (!sh) return false;
  var rows = sh.getDataRange().getValues();
  var cutoff = Date.now() - 24 * 60 * 60 * 1000;
  var email = String(body.email || "").toLowerCase().trim();
  var phone = String(body.phone || "").replace(/\D/g, "");
  var count = 0;
  for (var i = 1; i < rows.length; i++) {
    var when = rows[i][0];
    var t = (when instanceof Date) ? when.getTime() : new Date(when).getTime();
    if (!t || t < cutoff) continue;
    var rEmail = String(rows[i][2] || "").toLowerCase().trim();
    var rPhone = String(rows[i][3] || "").replace(/\D/g, "");
    if ((email && rEmail === email) || (phone && rPhone === phone)) count++;
  }
  return count >= MAX_PER_DAY;
}

// Email the order to the business (with the PDF attached if provided).
function sendOrderEmail_(body, res) {
  try {
    var subject = "New Beef Order - " + (body.name || "") + " (" + (body.amount || "") + ")";
    var text = (body.cuts || "Beef order") + "\n";
    if (res && !res.ok) text += "\nNOTE: could not auto-reserve this delivery (sold out or date mismatch) - please confirm availability with the customer.\n";
    var opts = { name: "Wholesome Family Organics Website" };
    if (body.email) opts.replyTo = body.email;
    if (body.pdf) {
      try {
        var bytes = Utilities.base64Decode(body.pdf);
        opts.attachments = [Utilities.newBlob(bytes, "application/pdf", body.pdfname || "beef-order.pdf")];
      } catch (err) {}
    }
    MailApp.sendEmail(ORDER_EMAIL, subject, text, opts);
    return null;
  } catch (err) { return String(err); }
}

function readInventory_() {
  var sh = invSheet_();
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
  var sh = invSheet_();
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

// Run this ONCE from the editor to grant the "send email" permission and verify
// delivery: pick sendTestEmail in the function dropdown -> Run -> approve the
// prompt -> check your inbox for "WFO email test".
function sendTestEmail() {
  MailApp.sendEmail(ORDER_EMAIL, "WFO email test", "If you got this, order emails will work.");
}
