"use strict";

// ===== Config =====
var CURRENCY_SYMBOL = "$"; // Can change to "USD $", "€", etc.

// Discount tiers as NET multipliers after discount, in basis points (1 bp = 0.0001)
// e.g. 0.71 => 7100 (71.00%)
var DISCOUNT_BPS = {
    "TierA": 7100,  // 29% off
    "TierB": 7800,  // 22% off
    "TierC": 8500,  // 15% off
    "TierD": 9200,  // 8% off
    "None":  10000  // No discount
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

function addCommas(x) {
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
    var s = v.toFixed(2);
    return CURRENCY_SYMBOL + addCommas(s);
}

// Convert to cents safely
function toCents(n) {
    return Math.round(n * 100);
}

// Convert from cents to dollars float
function fromCents(c) {
    return c / 100;
}

// Get discount basis points from key
function getDiscountBps(key) {
    if (DISCOUNT_BPS.hasOwnProperty(key)) { 
        return DISCOUNT_BPS[key]; 
    }
    return NaN;
}

// ===== Core calculations =====
function calculate() {
    var list = parseFloat(listInput.value);
    if (isNaN(list)) {
        return { ok: false, message: "Enter a valid list price." };
    }

    var rawCyl = parseFloat(cylInput.value);
    var cyl = isNaN(rawCyl) ? 0 : rawCyl;

    var rateKey = "";
    if (tierSel && typeof tierSel.value === "string") {
        rateKey = tierSel.value;
    }
    var bps = getDiscountBps(rateKey);
    if (!isFiniteNumber(bps)) {
        return { ok: false, message: "Choose a discount tier." };
    }

    // Work in cents
    var listC = toCents(list);
    var cylC  = toCents(cyl);
    var subtotalC = listC + cylC;

    // Apply discount in basis points, then ceil to whole dollars
    // X = subtotalC * bps
    // We want ceil( X / 1,000,000 ) where denom = 10000 (bps) * 100 (cents per dollar)
    var X = subtotalC * bps;
    var denom = 1000000;
    var totalDollars = Math.floor((X + denom - 1) / denom);

    return { 
        ok: true, 
        subtotal: fromCents(subtotalC), 
        rate: bps / 10000, 
        total: totalDollars 
    };
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
// // Attach live updates to inputs (uncomment to enable live updates)
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

function onSubmit(e) {
    if (e && e.preventDefault) { 
        e.preventDefault(); 
    }
    if (!form) { 
        return; 
    }

    // Native constraint validation
    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        if (typeof form.reportValidity === 'function') {
            form.reportValidity();
        } else {
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
    setTimeout(function () {
        if (totalEl) { totalEl.textContent = fmtMoney(0); }
    }, 0);
}

// ===== Init =====
function init() {
    if (totalEl) { 
        totalEl.textContent = fmtMoney(0); 
    }
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
