/* ============================================================================
   WHOLESOME FAMILY ORGANICS — PRICES & INVENTORY
   ----------------------------------------------------------------------------
   This is the ONLY file you need to edit to keep the website up to date.
   You do NOT need to touch the website code.

   HOW TO EDIT:
     • Change the numbers, dates, and words inside the "quotes".
     • Keep every quote (") and comma (,) exactly where it is.
     • Dates are written as "YYYY-MM-DD"  (year-month-day).  e.g. "2026-07-15"
     • After editing, save the file. The website updates automatically.

   If something looks broken after an edit, you probably removed a quote or a
   comma. Undo your last change and try again.
   ========================================================================== */

const WFO_CONFIG = {

  /* --------------------------------------------------------------------------
     1) WHERE ORDERS GO
     --------------------------------------------------------------------------
     Orders are emailed AND logged by the Google Apps Script (set up in
     backend/SETUP.md). The script sends the email (with the order PDF attached)
     and records every order on the Sheet's "Orders" tab.
       • To change which inbox receives orders: edit ORDER_EMAIL in Code.gs and
         re-deploy (Manage deployments > Edit > New version).
       • Spam guard (max 3 orders per email/phone per day) lives in Code.gs too.
     The connection itself is the inventoryApiUrl below.
  -------------------------------------------------------------------------- */

  // Shown to the customer after they submit, and used in the email subject.
  businessName: "Wholesome Family Organics",
  businessEmail: "rdsteichen@yahoo.com",   // shown on the site (contact)
  businessPhone: "320-493-0877",
  businessAddress: "19925 County Rd. 141, Kimball, MN 55353",

  /* --------------------------------------------------------------------------
     LIVE INVENTORY (optional) — automatic decrement via a Google Sheet
     --------------------------------------------------------------------------
     Leave BLANK ("") to manage inventory by hand in the list further below.
     To turn on automatic inventory: follow backend/SETUP.md, then paste the
     Apps Script Web-App URL (ending in /exec) here. When set, the site reads
     live quantities from your Sheet and subtracts from them on every order.
  -------------------------------------------------------------------------- */
  inventoryApiUrl: "https://script.google.com/macros/s/AKfycbyhYDdIspKOYmLQuVgxnfC0DXwVEbSsIMoX1yAJ0jCmRenJV6juhsE66P_Uf0TDHk0B/exec",


  /* --------------------------------------------------------------------------
     2) PRICING  (per pound, hanging weight)
     --------------------------------------------------------------------------
     NOTE: if the Google Sheet is connected (inventoryApiUrl above), prices are
     managed in the Sheet's "Pricing" tab and these values are only a fallback.
     If you are NOT using the Sheet, edit the prices here.
  -------------------------------------------------------------------------- */
  pricing: {
    halfPricePerLb:    5.48,   // dollars per lb hanging weight for a HALF
    quarterPricePerLb: 5.68,   // dollars per lb hanging weight for a QUARTER

    halfDeposit:    500,       // deposit due with the order form for a HALF
    quarterDeposit: 0,         // deposit for a QUARTER (0 = no deposit)

    // Typical hanging-weight ranges (used for the price estimate the customer sees)
    halfWeightLow:    320,
    halfWeightHigh:   430,
    quarterWeightLow: 150,
    quarterWeightHigh:215,

    // Yield = roughly this share of hanging weight ends up as finished cuts.
    yieldLowPct:  60,
    yieldHighPct: 70,
  },


  /* --------------------------------------------------------------------------
     3) INVENTORY  — what you currently have available
     --------------------------------------------------------------------------
     You only track QUARTERS. Halves are figured out automatically:
        1 half = 2 quarters,  so  halves available = quarters ÷ 2 (rounded down).

     Each { ... } block below is ONE delivery date.
       readyDate     : when the meat will be ready  ("YYYY-MM-DD")
       quartersTotal : how many quarters this batch has when full (set once;
                       this is what the availability bar measures against).
                       A whole animal = 4 quarters.
       quartersLeft  : how many quarters are still available right now.
                       *** This is the only number you change as you sell. ***
       note          : optional short note (leave as "" for none)

     WHEN YOU CONFIRM A SALE, lower "quartersLeft":
        • a QUARTER sold  ->  subtract 1
        • a HALF sold     ->  subtract 2
     Example: quartersLeft is 3  ->  the site shows "3 quarters or 1 half".
     If that half sells, change quartersLeft from 3 to 1.

     To add another delivery: copy a whole { ... } block, paste it, add a comma.
     To temporarily hide all availability: set the list to  []
  -------------------------------------------------------------------------- */
  inventory: [
    { readyDate: "2026-07-15", quartersTotal: 6, quartersLeft: 4, note: "" },
    { readyDate: "2026-08-01", quartersTotal: 4, quartersLeft: 3, note: "" },
    { readyDate: "2026-10-01", quartersTotal: 4, quartersLeft: 4, note: "Fall batch" },
  ],

  // Message shown when a delivery is fully sold but more is coming.
  soldOutMessage: "Currently spoken for — more available soon. Send your order and we'll add you to the list for the next batch.",
};

// (Do not edit below this line)
if (typeof window !== "undefined") { window.WFO_CONFIG = WFO_CONFIG; }
