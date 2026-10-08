/* ============================================================
   RAPID APPROACH (Remedies Finder) — js/search.js
   Search Engine: Spelling variations + Fuzzy matching + Scoring
   ============================================================ */

/* ---------- 1. SPELLING DICTIONARY (Roman Urdu Variations) ----------
   Log alag-alag tarah likhte hain — sab ko ek standard par lana.
   Yeh hamari Master Save File wali spelling standard ka dimagh hai! */

const SPELLING_MAP = {
  // Bukhaar
  "bukhar": "bukhaar", "bukhra": "bukhaar", "bukhaar": "bukhaar",
  "fever": "bukhaar", "tap": "bukhaar", "heat": "bukhaar",
  // Sardi / Zukam
  "sardi": "sardi", "cold": "sardi", "zukam": "zukam",
  "flu": "zukam", "runny": "zukam", "nose": "zukam",
  // Khansi
  "khansi": "khansi", "cough": "khansi", "khaansi": "khansi",
  // Sar dard
  "sardard": "sar dard", "sar dard": "sar dard", "headache": "sar dard",
  "sir dard": "sar dard", "migraine": "sar dard",
  // Pait
  "pait": "pait", "pet": "pait", "stomach": "pait", "tummy": "pait",
  "dast": "dast", "diarrhea": "dast", "diarrhoea": "dast", "loose motion": "dast",
  // Aam
  "dard": "dard", "pain": "dard", "ache": "dard",
  "kamzori": "kamzori", "weakness": "kamzori", "thakan": "thakan", "tired": "thakan",
  "neend": "neend", "sleep": "neend", "insomnia": "neend",
  "ghabrahat": "ghabrahat", "anxiety": "ghabrahat", "khauf": "khauf", "fear": "khauf",
  "zakhm": "zakhm", "wound": "zakhm", "injury": "zakhm",
  "jalan": "jalan", "burning": "jalan", "khujli": "khujli", "itching": "khujli",
  "qaet": "qaet", "periods": "qaet", "mahwari": "mahwari",
  "bal": "bal", "hair": "bal", "ganjapan": "ganjapan",
  "daant": "daant", "tooth": "daant", "teeth": "daant", "dant dard": "daant dard",
  "kaan": "kaan", "ear": "kaan", "aankh": "aankh", "eye": "aankh", "eyes": "aankh"
};

/* ---------- 2. NORMALIZE FUNCTION ----------
   Har lafz ko standard shakal mein lana:
   - Chote letters (lowercase)
   - Extra spaces saaf
   - Spelling dictionary se match */

function normalizeWord(word) {
  const clean = word.toLowerCase().trim().replace(/\s+/g, " ");
  return SPELLING_MAP[clean] || clean;
}

function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(normalizeWord)
    .join(" ");
}

/* ---------- 3. SEARCH ENGINE (Scoring System) ----------
   Score ka usool:
   - Naam match        = sabse zyada (100/80/60)
   - Alamat match      = darmiyana (50/30)
   - Tafseel match     = kam (10)
   - Doctor rubric     = 60 (doctor mode ke liye) */

function searchMedicines(query, medicines, mode) {
  const normalizedQuery = normalizeText(query);

  // Khali query → khaali nataij
  if (!normalizedQuery) return [];

  const queryWords = normalizedQuery.split(" ");
  const results = [];

  for (const med of medicines) {
    let score = 0;
    const matchedSymptoms = [];

    // Naam ka data (normalize karke)
    const medName = normalizeText(med.naam);
    const medUrdu = (med.urdu || "").trim();

    // --- Naam matching ---
    if (medName === normalizedQuery) {
      score += 100; // Poora naam match!
    } else if (medName.startsWith(normalizedQuery)) {
      score += 80;  // Naam query se shuru hota hai
    } else if (medName.includes(normalizedQuery)) {
      score += 60;  // Naam ke andar query hai
    }

    // Urdu naam mein direct dhoondo (Urdu script search)
    if (medUrdu && query.match(/[\u0600-\u06FF]/) && medUrdu.includes(query.trim())) {
      score += 70;
    }

    // --- Alamatein (symptoms) matching ---
    for (const symptom of (med.alamatein || [])) {
      const normSymptom = normalizeText(symptom);

      // Har query ka lafz alamat mein dhoondo
      for (const qWord of queryWords) {
        if (normSymptom === qWord) {
          score += 50;
          matchedSymptoms.push(symptom);
        } else if (normSymptom.includes(qWord)) {
          score += 30;
          matchedSymptoms.push(symptom);
        }
      }
    }

    // --- Tafseel matching (kam score — sirf extra help) ---
    const normDetail = normalizeText(med.tafseel || "");
    for (const qWord of queryWords) {
      if (normDetail.includes(qWord)) score += 10;
    }

    // --- Doctor Mode: English rubrics ---
    if (mode === "doctor" && med.rubric_english) {
      const normRubric = normalizeText(med.rubric_english);
      for (const qWord of queryWords) {
        if (normRubric.includes(qWord)) score += 60;
      }
      // English naam direct match
      if ((med.naam || "").toLowerCase().includes(query.toLowerCase().trim())) {
        score += 50;
      }
    }

    // Sirf woh medicines jo score paayen
    if (score > 0) {
      results.push({
        ...med,
        _score: score,
        _matched: [...new Set(matchedSymptoms)] // Duplicate hatao
      });
    }
  }

  // Sabse zyada score wali pehle
  results.sort((a, b) => b._score - a._score);

  return results;
}

/* ---------- 4. FUZZY HELPER (Choti Ghaltiyan Maaf) ----------
   Agar koi dawa na mile to milte-julte lafz dhoondhna */

function findSimilar(query, medicines) {
  const q = normalizeText(query);
  const allSymptoms = new Set();

  for (const med of medicines) {
    for (const s of (med.alamatein || [])) {
      allSymptoms.add(normalizeText(s));
    }
  }

  // Jis alamat mein query ka koi hissa ho
  const similar = [...allSymptoms].filter(s => {
    const qWords = q.split(" ");
    return qWords.some(w => w.length > 2 && s.includes(w.slice(0, Math.max(3, w.length - 1))));
  });

  return similar.slice(0, 5); // Max 5 suggestions
}

/* ---------- 5. EXPORT (app.js use karega) ---------- */
const SearchEngine = {
  search: searchMedicines,
  similar: findSimilar,
  normalize: normalizeText
};
