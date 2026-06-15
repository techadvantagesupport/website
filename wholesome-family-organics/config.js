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
     1) WHERE ORDERS ARE EMAILED
     --------------------------------------------------------------------------
     Orders are delivered using Web3Forms (free). Paste your Access Key below.
     Get one at https://web3forms.com  — enter the email address that should
     RECEIVE the orders, and they will email you a key that looks like:
         "a1b2c3d4-1234-5678-9abc-def012345678"

     During testing this is set to send to pksteichen@gmail.com.
     To send orders to a different inbox later: create a new key with that
     email at web3forms.com and paste it here.
  -------------------------------------------------------------------------- */
  web3formsAccessKey: "bce0ef79-b457-4132-b591-87ddae58d2a0",

  // Attach the order as a PDF file to the email?
  //   false = order is written into the email body (works on the FREE plan).
  //   true  = order PDF is attached to the email — but this ONLY works if your
  //           Web3Forms account is on a PAID (Pro) plan; on the free plan it
  //           causes sending to fail. Customers can always download the PDF
  //           themselves either way.
  attachPdf: false,

  // Shown to the customer after they submit, and used in the email subject.
  businessName: "Wholesome Family Organics",
  businessEmail: "rdsteichen@yahoo.com",   // shown on the site (contact)
  businessPhone: "320-493-0877",
  businessAddress: "19925 County Rd. 141, Kimball, MN 55353",


  /* --------------------------------------------------------------------------
     2) PRICING  (per pound, hanging weight)
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
     Each { ... } block below is ONE batch of beef.
       type      : "Half"  or  "Quarter"
       total     : how many shares this batch has
       claimed   : how many have been spoken for so far  (raise this number
                   each time you CONFIRM an order, so the site shows the
                   right availability)
       readyDate : when the meat will be ready for delivery  ("YYYY-MM-DD")
       note      : optional short note (leave as "" for none)

     To add another batch: copy a whole { ... } block, paste it, and add a
     comma between blocks.
     To temporarily hide all availability: set the list to  []
  -------------------------------------------------------------------------- */
  inventory: [
    { type: "Quarter", total: 6, claimed: 2, readyDate: "2026-07-15", note: "" },
    { type: "Half",    total: 4, claimed: 1, readyDate: "2026-08-01", note: "" },
    { type: "Quarter", total: 4, claimed: 0, readyDate: "2026-10-01", note: "Fall batch" },
  ],

  // Message shown when a beef type is fully claimed but more is coming.
  soldOutMessage: "Currently spoken for — more available soon. Send your order and we'll add you to the list for the next batch.",
};

// (Do not edit below this line)
if (typeof window !== "undefined") { window.WFO_CONFIG = WFO_CONFIG; }
