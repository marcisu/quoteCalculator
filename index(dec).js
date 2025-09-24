"use strict";

// ===== Config =====
var CURRENCY_SYMBOL = "$"; // Can change to "USD $", "€", etc.

// Discount tiers as NET multipliers after discount (e.g., 29% off => 0.71)
var DISCOUNT_RATES = {
  "TierA": 0.71,  // 29% off
  "TierB": 0.78,  // 22% off
  "TierC": 0.85,  // 15% off
  "TierD": 0.92,  // 8% off
  "None":  1.00   // No discount
};

// ===== DOM =====
var form      = document.getElementById("quote-form");
var listInput = document.getElementById("list-price");
var cylInput  = document.getElementById("cylinder");
var tierSel   = document.getElementById("discount");
var totalEl   = document.getElementById("total");

// ===== Utility functions =====
function isFiniteNumber(n) {
    return typeof n === "number" && isFinite(n);
}

// Add thousands separators to number string
function addCommas(x) {
    // Adds thousands separators without using regex (avoids escaping issues)
    var parts = (x + "").split(".");
    var integer = parts[0];
    var fraction = "";
    if (parts.length > 1) {
        fraction = parts[1];
    }
    var sign = "";

    if (integer.charAt(0) === "-") { 
        sign = "-"; integer = integer.slice(1); 
    }
    var out = "";
    var count = 0;
    for (var i = integer.length - 1; i >= 0; i--) {
        out = integer.charAt(i) + out;
        count++;
        if (count % 3 === 0 && i !== 0) {
            out = "," + out;
        }
    }
    if (fraction !== "") { 
        out = out + "." + fraction; 
    }
    return sign + out;
}

// Format number as money string with 2 decimal places and currency symbol
function fmtMoney(n) {
    var v;
    if (isFiniteNumber(n)) { 
        v = n; 
    } else { 
        v = 0; 
    }
    var s = v.toFixed(2); // standard rounding
    return CURRENCY_SYMBOL + addCommas(s);
}

// Parse number from input element, return NaN if invalid/missing
function parseNumber(el) {
    // Return NaN if the element or value is missing/invalid
    if (!el || typeof el.value !== "string") { 
        return NaN; 
    }
    var n = parseFloat(el.value);
    if (isNaN(n)) { 
        return NaN; 
    }
    return n;
}

// Get discount rate from key, return NaN if invalid
function getDiscountRate(key) {
    if (DISCOUNT_RATES.hasOwnProperty(key)) { 
        return DISCOUNT_RATES[key]; 
    }
    return NaN;
}

// Always round up to the next dollar
function roundUpToDollar(v) { 
    return Math.ceil(v); 
}

// ===== Core calculations =====
function calculate() {
    var list = parseNumber(listInput); // required
    var rawCyl = parseNumber(cylInput);
    var cyl;
    if (isNaN(rawCyl)) { 
        cyl = 0; 
    } else { 
        cyl = rawCyl; } // optional => 0

    var rateKey = "";
    if (tierSel && typeof tierSel.value === "string") {
        rateKey = tierSel.value;
    }
    var rate = getDiscountRate(rateKey); // required

    if (!isFiniteNumber(list) || list < 0) {
        return { ok: false, message: "Enter a valid list price." };
    }
    if (!isFiniteNumber(rate)) {
        return { ok: false, message: "Choose a discount tier." };
    }

    var subtotal = list + cyl;
    console.log(subtotal)
    
    var total = subtotal * rate;
    console.log(total)

    total = roundUpToDollar(total);
    console.log(total)
   
    // Standard rounding via toFixed in fmtMoney(); //
    // total = roundUpToCent(total); // If you need to always round up to the next cent

    return { ok: true, subtotal: subtotal, rate: rate, total: total };
}

// Update total in the UI
function updateTotalUI(result) {
    if (!result || !result.ok) {
        if (result && result.message && window && window.console) {
            console.warn(result.message);
        }
        return;
    }
    if (totalEl) {
        totalEl.textContent = fmtMoney(result.total);
    }
}

// ===== Events =====
// Attach live updates to inputs (uncomment to enable live updates)
// function attachLiveUpdates() {
//     var inputs = [listInput, cylInput, tierSel];
//     for (var i = 0; i < inputs.length; i++) {
//         var el = inputs[i];
//         if (!el) { continue; }
//         var evt;
//         if (el.tagName && el.tagName.toUpperCase() === 'SELECT') {
//             evt = 'change';
//         } else {
//             evt = 'input';
//         }
//         el.addEventListener(evt, function () {
//         if (!form) { return; }
//         // Only compute when constraints pass (required fields present)
//         if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
//             return;
//         }
//         var res = calculate();
//         if (res.ok) { updateTotalUI(res); }
//         });
//     }
// }

// Handle form submission
function onSubmit(e) {
    if (e && e.preventDefault) { 
        e.preventDefault(); 
    }
    if (!form) { 
        return; 
    }

    // Native constraint validation (HTML5)
    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        if (typeof form.reportValidity === 'function') {
            form.reportValidity();
        } else {
            // Fallback when reportValidity is not supported
            var firstInvalid = null;
            if (form.querySelector) { firstInvalid = form.querySelector(':invalid'); }
            if (firstInvalid && typeof firstInvalid.focus === 'function') {
                firstInvalid.focus();
            }
            alert('Please fill in the required fields.');
        }
        return;
    }

    var res = calculate();
    if (!res.ok) {
        alert(res.message);
        return;
    }
    updateTotalUI(res);
}

// Clear total on form reset
function onReset() {
    // Allow the browser to clear fields first
    setTimeout(function () {
    if (totalEl) { totalEl.textContent = fmtMoney(0); }
    }, 0);
}

// Function to initialise the app
function init() {
    if (totalEl) { 
        totalEl.textContent = fmtMoney(0); }
    if (form) {
        form.addEventListener('submit', onSubmit);
        form.addEventListener('reset', onReset);
    }
    // Uncomment to enable live updates
    // attachLiveUpdates();
}

// Initialise on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}