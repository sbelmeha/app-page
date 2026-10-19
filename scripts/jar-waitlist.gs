/** @OnlyCurrentDoc */
/**
 * Waitlist: appends each signup from rflx.app/r1/ (and before it Jar's rflx.app/jar/) to the sheet this script is bound to.
 *
 * Setup: in the Google Sheet, Extensions > Apps Script, paste this file, then
 * Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.
 * The deployment URL goes in ENDPOINT in r1/r1.js. To update it, use Manage deployments > Edit > New version, which keeps the URL.
 *
 * The web app can only add rows. It has no doGet, so nobody can read the sheet through it;
 * the sheet itself stays private to its owner.
 */
const SHEET_NAME = 'Waitlist';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return reply({ ok: true }); // Filled only by bots.
  const email = String(p.email || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return reply({ ok: false, error: 'invalid' });
  const app = String(p.app || '').replace(/[^a-z0-9-]/g, '').slice(0, 20);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(['Email', 'Joined', 'App']);
    const rows = sheet.getLastRow() - 1;
    // An address is a repeat only on the same app's list: Jar's waitlist and R-1's wishlist share the sheet.
    const known = rows > 0 ? sheet.getRange(2, 1, rows, 3).getValues().map(r => String(r[0]).replace(/^'/, '') + ' ' + r[2]) : [];
    // A leading apostrophe keeps the sheet from reading an address as a formula.
    if (!known.includes(email + ' ' + app)) sheet.appendRow([/^[=+\-@]/.test(email) ? "'" + email : email, new Date(), app]);
  } finally {
    lock.releaseLock();
  }
  return reply({ ok: true });
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
