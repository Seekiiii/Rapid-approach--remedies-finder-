/* ============================================================
   RAPID APPROACH (Remedies Finder) — js/app.js
   Main Orchestrator: Data, Search wiring, Modes, Pages,
   Dark Mode, Mehfooz List, PWA registration
   ============================================================ */

/* ---------- 1. DOM REFERENCES ---------- */
const searchInputEl = document.getElementById("searchInput");
const clearBtnEl    = document.getElementById("clearBtn");
const resultsEl     = document.getElementById("results");
const darkToggleEl  = document.getElementById("darkModeToggle");

/* ---------- 2. APP STATE ---------- */
const APP = {
  mode: "general",   // "general" ya "doctor"
  page: "home",      // "home" | "saved" | "about"
  query: "",
  medicines: [],     // data/data.json se aayega
  saved: [],         // localStorage se (dawaon ke naam)
  dataReady: false
};

/* ---------- 3. STORAGE (localStorage helpers) ---------- */
const STORE = {
  savedKey: "ra_saved",
  themeKey: "ra_theme",

  loadSaved() {
    try { return JSON.parse(localStorage.getItem(this.savedKey)) || []; }
    catch (e) { return []; }
  },
  saveSaved() {
    try { localStorage.setItem(this.savedKey, JSON.stringify(APP.saved)); } catch (e) {}
  },
  loadTheme() { return localStorage.getItem(this.themeKey); },
  saveTheme(t) { try { localStorage.setItem(this.themeKey, t); } catch (e) {} }
};

/* ---------- 4. DEBOUNCE (har keystroke par search na chale) ---------- */
function debounce(fn, wait) {
  let t;
  return function () {
    const args = arguments, ctx = this;
    clearTimeout(t);
    t = setTimeout(() => fn.apply(ctx, args), wait || 250);
  };
}

/* ---------- 5. DATA LOAD ---------- */
async function loadData() {
  try {
    const res = await fetch("data/data.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    APP.medicines = await res.json();
    APP.dataReady = true;
    renderCurrentPage(); // data aate hi page refresh
  } catch (err) {
    resultsEl.innerHTML = `
      <div class="empty-state">
        <div class="icon">📂</div>
        <p><strong>Data file nahi mil saki</strong></p>
        <p>Check karein ke <b>data/data.json</b> repository mein maujood hai.</p>
      </div>`;
  }
}

/* ---------- 6. SEARCH EXECUTION ---------- */
function doSearch() {
  // Agar doosri page par hain to wapas home par le aayen
  if (APP.page !== "home") {
    APP.page = "home";
    document.querySelectorAll(".nav-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.page === "home"));
  }

  const q = searchInputEl.value.trim();
  APP.query = q;

  if (!q) { UIRenderer.renderWelcome(); return; }
  if (!APP.dataReady) return; // data load ho raha hai — aate hi search ho jayega

  const results = SearchEngine.search(q, APP.medicines, APP.mode);

  if (!results.length) {
    UIRenderer.renderEmpty(q, SearchEngine.similar(q, APP.medicines));
  } else {
    UIRenderer.renderResults(results, APP.mode);
    addSaveButtons();
  }
}
const debouncedSearch = debounce(doSearch, 250);

/* ---------- 7. MEHFOOZ LIST (⭐ Save system) ---------- */
function isSaved(name) { return APP.saved.indexOf(name) !== -1; }

function addSaveButtons() {
  document.querySelectorAll("#results .result-card").forEach(card => {
    const nameEl = card.querySelector(".medicine-name");
    const footer = card.querySelector(".card-footer");
    if (!nameEl || !footer || card.querySelector(".save-btn")) return;

    const name = nameEl.textContent;
    const btn = document.createElement("button");
    btn.className = "save-btn";
    updateSaveBtn(btn, name);

    // stopPropagation: card ke detail modal ko na khole
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSave(name);
    });

    footer.prepend(btn);
  });
}

function updateSaveBtn(btn, name) {
  btn.textContent = isSaved(name) ? "⭐ Mehfooz" : "☆ Mehfooz karein";
}

function toggleSave(name) {
  if (isSaved(name)) {
    APP.saved = APP.saved.filter(n => n !== name);
    UIRenderer.showToast("Mehfooz list se hata diya gaya");
  } else {
    APP.saved.push(name);
    UIRenderer.showToast("Mehfooz ho gaya! ⭐");
  }
  STORE.saveSaved();

  // Tamam dikhne wale cards ke buttons update karo
  document.querySelectorAll("#results .result-card").forEach(card => {
    const nameEl = card.querySelector(".medicine-name");
    const btn = card.querySelector(".save-btn");
    if (nameEl && btn && nameEl.textContent === name) updateSaveBtn(btn, name);
  });

  if (APP.page === "saved") renderSavedPage();
}

/* ---------- 8. PAGES (Home / Mehfooz / Maloomat) ---------- */
function renderCurrentPage() {
  if (APP.page === "home") {
    if (APP.query) doSearch();
    else UIRenderer.renderWelcome();
  } else if (APP.page === "saved") {
    renderSavedPage();
  } else {
    renderAboutPage();
  }
}

function renderSavedPage() {
  const savedMeds = APP.saved
    .map(name => APP.medicines.find(m => m.naam === name))
    .filter(Boolean);

  if (!savedMeds.length) {
    resultsEl.innerHTML = `
      <div class="empty-state">
        <div class="icon">⭐</div>
        <p><strong>Abhi koi dawa mehfooz nahi</strong></p>
        <p>Search karein aur "☆ Mehfooz karein" dabayen — dawa yahan save ho jayegi.</p>
      </div>`;
    return;
  }

  UIRenderer.renderResults(savedMeds, APP.mode);
  addSaveButtons();
}

function renderAboutPage() {
  resultsEl.innerHTML = `
    <div class="about-page">
      <div class="empty-state">
        <div class="icon">🌿</div>
        <h2>Rapid Approach</h2>
        <p><b>Remedies Finder</b> — Version 1.0</p>
      </div>
      <div class="about-card">
        <h3>📱 Yeh App Kya Karti Hai?</h3>
        <p>Alamat likhein — Rapid Approach behtareen homeopathic dawa dhoondh dega. Aam log Roman Urdu mein, doctors English rubrics mein search kar sakte hain.</p>
      </div>
      <div class="about-card">
        <h3>⚕️ Zaroori Disclaimer</h3>
        <p>Yeh app sirf talaash aur mashwara ke liye hai — qualified doctor ka mutabadil nahi. Ilaaj se pehle homeopathic doctor se rabta zaroori hai.</p>
      </div>
      <div class="about-card">
        <h3>🔒 Aapki Privacy</h3>
        <p>Yeh app aapki koi maloomat kahin nahi bhejti. Mehfooz list aur theme sirf aapke phone mein rehti hai.</p>
      </div>
      <p class="footer-brand" style="text-align:center">Rapid Approach (Remedies Finder) © 2026</p>
    </div>`;
}

function switchPage(page) {
  APP.page = page;
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.page === page));
  renderCurrentPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- 9. MODE TOGGLE (Aam Log / Doctor) ---------- */
function setMode(mode) {
  APP.mode = mode;
  document.querySelectorAll(".mode-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.mode === mode));

  searchInputEl.placeholder = mode === "doctor"
    ? "Rubric ya remedy likhein... fever, sudden, Bell"
    : "Alamat likhein... bukhaar, sardi, sar dard";

  if (APP.query) doSearch();
  UIRenderer.showToast(mode === "doctor" ? "🩺 Doctor Mode ON" : "🏠 Aam Log Mode ON");
}

/* ---------- 10. DARK MODE ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  darkToggleEl.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initTheme() {
  const saved = STORE.loadTheme();
  if (saved) { applyTheme(saved); return; }
  const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark"
    ? "light" : "dark";
  applyTheme(next);
  STORE.saveTheme(next);
}

/* ---------- 11. EVENTS WIRING ---------- */
function wireEvents() {
  UIRenderer.initUI(); // modal ke buttons

  // Search input
  searchInputEl.addEventListener("input", () => {
    clearBtnEl.classList.toggle("hidden", !searchInputEl.value);
    debouncedSearch();
  });

  // ✕ Clear button
  clearBtnEl.addEventListener("click", () => {
    searchInputEl.value = "";
    clearBtnEl.classList.add("hidden");
    APP.query = "";
    if (APP.page === "home") UIRenderer.renderWelcome();
    searchInputEl.focus();
  });

  // Chips (delegation — naye purane sab chips chalein)
  document.getElementById("chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    searchInputEl.value = chip.dataset.symptom;
    clearBtnEl.classList.remove("hidden");
    doSearch();
  });

  // Suggestions (empty state ke tags)
  resultsEl.addEventListener("click", (e) => {
    const sug = e.target.closest(".suggestion-tag");
    if (sug) {
      searchInputEl.value = sug.dataset.symptom;
      clearBtnEl.classList.remove("hidden");
      doSearch();
    }
  });

  // Mode buttons
  document.querySelectorAll(".mode-btn").forEach(b =>
    b.addEventListener("click", () => setMode(b.dataset.mode)));

  // Dark mode
  darkToggleEl.addEventListener("click", toggleTheme);

  // Bottom nav pages
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.addEventListener("click", () => switchPage(b.dataset.page)));
}

/* ---------- 12. PWA SERVICE WORKER (sw.js baad mein aayega) ---------- */
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* sw.js abhi nahi bana — koi masla nahi */
    });
  }
}

/* ---------- 13. INIT ---------- */
function initApp() {
  initTheme();
  APP.saved = STORE.loadSaved();
  wireEvents();
  UIRenderer.renderWelcome();
  loadData();
  registerSW();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
