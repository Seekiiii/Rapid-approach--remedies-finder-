/* ============================================================
   RAPID APPROACH (Remedies Finder) — js/ui.js
   UI Renderer: Cards, Modal, Toast, Welcome & Empty states
   ============================================================ */

/* ---------- 1. DOM REFERENCES ---------- */
const UI = {
  results: document.getElementById("results"),
  modal: document.getElementById("detailModal"),
  modalContent: document.getElementById("modalContent"),
  modalClose: document.getElementById("modalClose"),
  toast: document.getElementById("toast"),
  chips: document.getElementById("chips"),
  searchInput: document.getElementById("searchInput"),
  clearBtn: document.getElementById("clearBtn")
};

/* ---------- 2. SECURITY: HTML ESCAPE ----------
   Data mein koi khaas character ho to page kharab na ho */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text || "");
  return div.innerHTML;
}

/* ---------- 3. SCORE STARS (Match ki shakal) ----------
   Score ko samajhne layak sitaron mein badalna */
function scoreStars(score) {
  if (score >= 100) return "⭐⭐⭐";
  if (score >= 50) return "⭐⭐";
  return "⭐";
}

/* ---------- 4. RESULT CARD BANANA ---------- */
function buildCard(med, mode) {
  const card = document.createElement("article");
  card.className = "result-card";

  // Match stars (sirf search ke waqt — saved list mein nahi)
  const scoreHtml = med._score
    ? `<span class="match-score">${scoreStars(med._score)}</span>`
    : "";

  // Urdu naam (Nastaliq)
  const urduHtml = med.urdu
    ? `<p class="medicine-urdu">${escapeHtml(med.urdu)}</p>`
    : "";

  // Alamatein tags (max 4 — card bharta nahi)
  const tagsHtml = (med.alamatein || [])
    .slice(0, 4)
    .map(s => `<span class="symptom-tag">${escapeHtml(s)}</span>`)
    .join("");

  // Doctor mode: Repertory rubric alag se dikhao
  const rubricHtml = (mode === "doctor" && med.rubric_english)
    ? `<p class="rubric">📋 ${escapeHtml(med.rubric_english)}</p>`
    : "";

  card.innerHTML = `
    ${scoreHtml}
    <h2 class="medicine-name">${escapeHtml(med.naam)}</h2>
    ${urduHtml}
    <div class="symptom-tags">${tagsHtml}</div>
    ${rubricHtml}
    <div class="card-footer">
      <span class="potency-badge">${escapeHtml(med.potency || "30")}</span>
      <button class="detail-btn">Tafseel dekhein →</button>
    </div>
  `;

  // Card par tap → poori tafseel khule
  card.addEventListener("click", () => showDetail(med));

  return card;
}

/* ---------- 5. RESULTS RENDER ---------- */
function renderResults(results, mode) {
  UI.results.innerHTML = "";

  // Kuch nahi mila → caller khud empty state dikhayega
  if (!results || !results.length) return false;

  const frag = document.createDocumentFragment();
  results.forEach(med => frag.appendChild(buildCard(med, mode)));
  UI.results.appendChild(frag);
  return true;
}

/* ---------- 6. WELCOME STATE (app khulte waqt) ---------- */
function renderWelcome() {
  UI.results.innerHTML = `
    <div class="empty-state">
      <div class="icon">🌿</div>
      <p><strong>Khamosh Farmayein!</strong></p>
      <p>Alamat likhein — jaise <b>bukhaar</b>, <b>sar dard</b>, <b>khansi</b> —
         aur Rapid Approach aapke liye behtareen homeopathic dawa dhoondh dega.</p>
    </div>`;
}

/* ---------- 7. EMPTY STATE (kuch na mile) ---------- */
function renderEmpty(query, suggestions) {
  // Milte-julte suggestions (search.js ki fuzzy help se)
  const sugHtml = suggestions && suggestions.length
    ? `<p style="margin-top:12px">Kya aap yeh dhoondh rahe thay?</p>
       <div class="suggestions">${suggestions
         .map(s => `<span class="symptom-tag suggestion-tag" data-symptom="${escapeHtml(s)}">${escapeHtml(s)}</span>`)
         .join("")}</div>`
    : "";

  UI.results.innerHTML = `
    <div class="empty-state">
      <div class="icon">🔍</div>
      <p><strong>"${escapeHtml(query)}" ke liye kuch nahi mila</strong></p>
      <p>Hijje check karein ya mukhtalif lafz try karein.</p>
      ${sugHtml}
    </div>`;
}

/* ---------- 8. DETAIL MODAL (Poori Tafseel) ---------- */
function showDetail(med) {
  const alamateinHtml = (med.alamatein || [])
    .map(s => `<span class="symptom-tag">${escapeHtml(s)}</span>`)
    .join(" ");

  const tafseelHtml = med.tafseel
    ? `<h3>📖 Tafseel</h3><p>${escapeHtml(med.tafseel)}</p>` : "";

  const dosageHtml = med.dosage
    ? `<h3>💊 Khurak / Potency</h3><p>${escapeHtml(med.dosage)}</p>` : "";

  const rubricHtml = med.rubric_english
    ? `<h3>📋 Repertory Rubric</h3><p>${escapeHtml(med.rubric_english)}</p>` : "";

  UI.modalContent.innerHTML = `
    <h2>${escapeHtml(med.naam)}</h2>
    ${med.urdu ? `<p class="medicine-urdu">${escapeHtml(med.urdu)}</p>` : ""}
    <h3>🩺 Alamatein</h3>
    <div class="symptom-tags">${alamateinHtml}</div>
    ${tafseelHtml}
    ${dosageHtml}
    ${rubricHtml}
    <div class="modal-warning">
      ⚕️ Khud-ilaaj se parhez karein — qualified doctor se mashwara zaroori hai.
    </div>
    <p class="modal-dua urdu-text" dir="rtl">اللہ کرے جلدی شفا ہو! 🤲</p>
  `;

  UI.modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Peeche scroll band
}

function closeDetail() {
  UI.modal.classList.add("hidden");
  document.body.style.overflow = "";
}

/* ---------- 9. TOAST (Peak-End Rule: warm paigham) ---------- */
let toastTimer = null;
function showToast(message, duration = 2600) {
  UI.toast.textContent = message;
  UI.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => UI.toast.classList.add("hidden"), duration);
}

/* ---------- 10. CHIPS RENDER ---------- */
function renderChips(list) {
  UI.chips.innerHTML = list
    .map(c => `<button class="chip" data-symptom="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
    .join("");
}

/* ---------- 11. INIT (Modal ke buttons wire karna) ---------- */
function initUI() {
  // ✕ button se band
  UI.modalClose.addEventListener("click", closeDetail);

  // Backdrop (andhera hissa) par tap → band
  UI.modal.addEventListener("click", (e) => {
    if (e.target === UI.modal) closeDetail();
  });

  // Escape key se band (desktop ke liye)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetail();
  });
}

/* ---------- 12. EXPORT (app.js use karega) ---------- */
const UIRenderer = {
  initUI,
  renderResults,
  renderWelcome,
  renderEmpty,
  showDetail,
  closeDetail,
  showToast,
  renderChips,
  escapeHtml
};
