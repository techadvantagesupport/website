# Live inventory setup (Google Sheet + Apps Script)

This makes inventory **live and automatic**: the website reads quantities from a
Google Sheet, and every order **auto-decrements** the right delivery. If an order
cancels, the business just edits the Sheet to add the quarters back.

You do this once. It takes about 10 minutes.

## 1. Create the Sheet
1. Go to <https://sheets.google.com> and create a new spreadsheet.
   Name it e.g. **Wholesome Family Organics — Inventory**.
2. Rename the first tab to exactly: **Inventory**
3. In row 1, type these four headers (one per cell, A1–D1):

   | readyDate | quartersTotal | quartersLeft | note |
   |-----------|---------------|--------------|------|

4. Add one row per delivery, for example:

   | readyDate  | quartersTotal | quartersLeft | note        |
   |------------|---------------|--------------|-------------|
   | 2026-07-15 | 6             | 4            |             |
   | 2026-08-01 | 4             | 3            |             |
   | 2026-10-01 | 4             | 4            | Fall batch  |

   - **readyDate** — delivery date, written `YYYY-MM-DD`.
   - **quartersTotal** — how many quarters this delivery has when full (a whole
     animal = 4). This is what the availability bar measures against.
   - **quartersLeft** — how many quarters are still available. **The site lowers
     this automatically on each order.** If an order cancels, raise it back here.
   - **note** — optional.

## 2. Add the script
1. In the Sheet: **Extensions → Apps Script**.
2. Delete the sample code, then paste the entire contents of **Code.gs** (in this
   folder). Click the **Save** icon.

## 3. Deploy it as a Web App
1. Click **Deploy → New deployment**.
2. Click the gear ⚙ → choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, then **Authorize access** and approve (it's your own script).
5. Copy the **Web app URL** — it ends in `/exec`.

## 4. Connect the website
1. Open **config.js** and paste the URL:
   ```js
   inventoryApiUrl: "https://script.google.com/macros/s/AKfy.../exec",
   ```
2. Save and publish. Done — the site now reads from the Sheet and decrements it
   on every order. (Leave `inventoryApiUrl` blank to go back to managing
   inventory by hand in `config.js`.)

## Day-to-day
- **A sale** decrements `quartersLeft` automatically (Half −2, Quarter −1).
- **A cancellation:** open the Sheet and add the quarters back to `quartersLeft`.
- **A new delivery:** add a new row.
- Every order is also logged on an **Orders** tab (created automatically) with the
  customer, delivery date, and cuts — a running record you can review.

## If you ever change the script
Re-deploy with **Deploy → Manage deployments → ✏️ Edit → Version: New version →
Deploy**. The `/exec` URL stays the same, so you don't need to update config.js.

## Notes
- The customer's order is still emailed to you (Web3Forms) regardless of the
  Sheet, so an order is never lost even if the Sheet is briefly unreachable.
- If the site can't reach the Sheet, it falls back to the `inventory` list in
  `config.js`, so the page always works.
