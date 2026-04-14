(function () {
  "use strict";

  const resultEl = document.getElementById("result");
  const expressionEl = document.getElementById("expression");
  const keysEl = document.getElementById("keys");

  let display = "0";
  let stored = null;
  let pendingOp = null;
  let freshInput = true;

  const OPS = new Set(["+", "-", "*", "/"]);

  function formatNumber(n) {
    if (!Number.isFinite(n)) return "오류";
    const s = String(n);
    if (s.includes("e") || s.length > 12) {
      const t = n.toPrecision(10).replace(/\.?0+e/, "e");
      return t.length > 14 ? n.toExponential(6) : t;
    }
    const rounded = Math.round(n * 1e10) / 1e10;
    const out = Object.is(rounded, -0) ? "0" : String(rounded);
    return out.length > 14 ? Number(out).toExponential(6) : out;
  }

  function applyOp(a, b, op) {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function commitPending() {
    if (stored === null || pendingOp === null) return;
    const cur = parseFloat(display);
    const next = applyOp(stored, cur, pendingOp);
    display = formatNumber(next);
    stored = Number.isFinite(next) ? next : null;
    pendingOp = null;
    freshInput = true;
  }

  function updateView(expr) {
    resultEl.textContent = display;
    expressionEl.textContent = expr ?? "";
  }

  function inputDigit(d) {
    if (freshInput) {
      display = d === "0" ? "0" : d;
      freshInput = false;
    } else {
      if (display === "0" && d !== ".") display = d;
      else if (display.replace(".", "").length < 14) display += d;
    }
    updateView(buildExpr());
  }

  function inputDot() {
    if (freshInput) {
      display = "0.";
      freshInput = false;
    } else if (!display.includes(".")) {
      display += ".";
    }
    updateView(buildExpr());
  }

  function buildExpr() {
    if (stored === null) return "";
    const sym = pendingOp === "*" ? "×" : pendingOp === "/" ? "÷" : pendingOp;
    return `${formatNumber(stored)} ${sym}`;
  }

  function inputOp(op) {
    const cur = parseFloat(display);
    if (Number.isNaN(cur)) return;

    if (pendingOp !== null && !freshInput) {
      commitPending();
    } else if (pendingOp === null) {
      stored = cur;
    }

    pendingOp = op;
    freshInput = true;
    updateView(buildExpr());
  }

  function percent() {
    const cur = parseFloat(display);
    if (Number.isNaN(cur)) return;
    display = formatNumber(cur / 100);
    freshInput = true;
    updateView(buildExpr());
  }

  function equals() {
    if (pendingOp !== null && stored !== null) {
      commitPending();
      stored = null;
      updateView("");
    } else {
      freshInput = true;
      updateView("");
    }
  }

  function clearAll() {
    display = "0";
    stored = null;
    pendingOp = null;
    freshInput = true;
    updateView("");
  }

  function backspace() {
    if (freshInput) return;
    if (display.length <= 1) {
      display = "0";
      freshInput = true;
    } else {
      display = display.slice(0, -1);
    }
    updateView(buildExpr());
  }

  keysEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-value], button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const value = btn.dataset.value;

    if (action === "clear") {
      clearAll();
      return;
    }
    if (action === "delete") {
      backspace();
      return;
    }
    if (action === "equals") {
      equals();
      return;
    }

    if (value === "%") {
      percent();
      return;
    }
    if (OPS.has(value)) {
      inputOp(value);
      return;
    }
    if (value === ".") {
      inputDot();
      return;
    }
    if (value !== undefined) {
      inputDigit(value);
    }
  });

  const keyMap = {
    Enter: "equals",
    "=": "equals",
    Escape: "clear",
    Backspace: "delete",
    "%": "%",
    "/": "/",
    "*": "*",
    "-": "-",
    "+": "+",
  };

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const k = e.key;
    if (k >= "0" && k <= "9") {
      e.preventDefault();
      inputDigit(k);
      return;
    }
    if (k === ".") {
      e.preventDefault();
      inputDot();
      return;
    }

    const mapped = keyMap[k];
    if (mapped === "equals") {
      e.preventDefault();
      equals();
      return;
    }
    if (mapped === "clear") {
      e.preventDefault();
      clearAll();
      return;
    }
    if (mapped === "delete") {
      e.preventDefault();
      backspace();
      return;
    }
    if (mapped && OPS.has(mapped)) {
      e.preventDefault();
      inputOp(mapped);
      return;
    }
    if (mapped === "%") {
      e.preventDefault();
      percent();
    }
  });

  updateView("");
})();
