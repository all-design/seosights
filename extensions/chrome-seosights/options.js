/* ==========================================================================
   seosights — options page logic
   ========================================================================== */

const DEFAULTS = {
  apiKey: "",
  showOverlay: false,
  autoAnalyze: true,
};

const els = {
  apiKey: document.getElementById("api-key"),
  showOverlay: document.getElementById("show-overlay"),
  autoAnalyze: document.getElementById("auto-analyze"),
  saveBtn: document.getElementById("save-btn"),
  resetBtn: document.getElementById("reset-btn"),
  toast: document.getElementById("toast"),
};

function loadSettings() {
  chrome.storage.local.get(DEFAULTS, (s) => {
    els.apiKey.value = s.apiKey || "";
    els.showOverlay.checked = !!s.showOverlay;
    els.autoAnalyze.checked = s.autoAnalyze !== false; // default true
  });
}

function saveSettings() {
  const payload = {
    apiKey: els.apiKey.value.trim(),
    showOverlay: els.showOverlay.checked,
    autoAnalyze: els.autoAnalyze.checked,
    savedAt: new Date().toISOString(),
  };
  chrome.storage.local.set(payload, () => {
    showToast("Settings saved");
  });
}

function resetSettings() {
  if (!confirm("Reset all settings to defaults? This will clear your API key.")) return;
  chrome.storage.local.set({ ...DEFAULTS, savedAt: new Date().toISOString() }, () => {
    els.apiKey.value = "";
    els.showOverlay.checked = false;
    els.autoAnalyze.checked = true;
    showToast("Settings reset to defaults");
  });
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 1800);
}

els.saveBtn.addEventListener("click", saveSettings);
els.resetBtn.addEventListener("click", resetSettings);

// Save on Enter in API key field
els.apiKey.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    saveSettings();
  }
});

document.addEventListener("DOMContentLoaded", loadSettings);
