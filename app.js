// Perkele setup page - PapaThorSwe

const PERK_LISTS = {
  survivor: "data/survivor-perks.txt",
  killer: "data/killer-perks.txt"
};

const STORAGE_KEYS = {
  survivor: "perkele-selected-survivor",
  killer: "perkele-selected-killer",
  role: "perkele-role",
  emptyChance: "perkele-empty-chance"
};

let currentRole = localStorage.getItem(STORAGE_KEYS.role) || "survivor";
let perkData = {
  survivor: [],
  killer: []
};

const selected = {
  survivor: new Set(),
  killer: new Set()
};

const survivorBtn = document.getElementById("survivorBtn");
const killerBtn = document.getElementById("killerBtn");
const perkSearch = document.getElementById("perkSearch");
const perkGrid = document.getElementById("perkGrid");
const selectedCount = document.getElementById("selectedCount");
const totalCount = document.getElementById("totalCount");
const selectAllBtn = document.getElementById("selectAllBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const rollBtn = document.getElementById("rollBtn");
const rollHint = document.getElementById("rollHint");
const emptyState = document.getElementById("emptyState");
const resultPanel = document.getElementById("resultPanel");
const results = document.getElementById("results");
const emptyChance = document.getElementById("emptyChance");
const emptyChanceValue = document.getElementById("emptyChanceValue");
const generateUrlBtn = document.getElementById("generateUrlBtn");
const previewBtn = document.getElementById("previewBtn");
const urlBox = document.getElementById("urlBox");
const obsUrl = document.getElementById("obsUrl");
const copyUrlBtn = document.getElementById("copyUrlBtn");

function parsePerkList(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"));
}

async function loadPerkList(role) {
  const response = await fetch(PERK_LISTS[role], { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Could not load ${role} perk list.`);
  }

  return parsePerkList(await response.text());
}

function loadSavedSelections(role) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS[role]));

    if (Array.isArray(saved)) {
      selected[role] = new Set(
        saved.filter(perk => perkData[role].includes(perk))
      );
      return;
    }
  } catch (error) {
    console.warn("Could not read saved perk selection.", error);
  }

  selected[role] = new Set(perkData[role]);
}

function saveSelections(role) {
  localStorage.setItem(
    STORAGE_KEYS[role],
    JSON.stringify([...selected[role]])
  );
}

function updateRoleButtons() {
  survivorBtn.classList.toggle("active", currentRole === "survivor");
  killerBtn.classList.toggle("active", currentRole === "killer");
}

function setRole(role) {
  currentRole = role;
  localStorage.setItem(STORAGE_KEYS.role, role);
  perkSearch.value = "";
  resultPanel.classList.add("hidden");
  urlBox.classList.add("hidden");
  updateRoleButtons();
  renderPerks();
}

function updateCounts() {
  const chosen = selected[currentRole].size;
  const total = perkData[currentRole].length;

  selectedCount.textContent = chosen;
  totalCount.textContent = total;

  rollBtn.disabled = chosen < 4;
  generateUrlBtn.disabled = chosen < 4;
  previewBtn.disabled = chosen < 4;

  rollHint.textContent =
    chosen < 4
      ? "Select at least 4 perks."
      : `${chosen} perks are in the roulette pool.`;
}

function renderPerks() {
  const query = perkSearch.value.trim().toLowerCase();
  const perks = perkData[currentRole].filter(perk =>
    perk.toLowerCase().includes(query)
  );

  perkGrid.innerHTML = "";

  perks.forEach(perk => {
    const label = document.createElement("label");
    label.className = "perk-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selected[currentRole].has(perk);

    const name = document.createElement("span");
    name.className = "perk-name";
    name.textContent = perk;

    label.classList.toggle("selected", checkbox.checked);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selected[currentRole].add(perk);
      } else {
        selected[currentRole].delete(perk);
      }

      label.classList.toggle("selected", checkbox.checked);
      saveSelections(currentRole);
      urlBox.classList.add("hidden");
      updateCounts();
    });

    label.append(checkbox, name);
    perkGrid.appendChild(label);
  });

  emptyState.classList.toggle("hidden", perks.length !== 0);
  updateCounts();
}

function selectAllVisible() {
  const query = perkSearch.value.trim().toLowerCase();

  perkData[currentRole]
    .filter(perk => perk.toLowerCase().includes(query))
    .forEach(perk => selected[currentRole].add(perk));

  saveSelections(currentRole);
  urlBox.classList.add("hidden");
  renderPerks();
}

function clearAllVisible() {
  const query = perkSearch.value.trim().toLowerCase();

  perkData[currentRole]
    .filter(perk => perk.toLowerCase().includes(query))
    .forEach(perk => selected[currentRole].delete(perk));

  saveSelections(currentRole);
  urlBox.classList.add("hidden");
  renderPerks();
}

function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function rollPerkele() {
  const pool = [...selected[currentRole]];

  if (pool.length < 4) return;

  const chosen = shuffle(pool).slice(0, 4);

  results.innerHTML = "";

  chosen.forEach(perk => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.textContent = perk;
    results.appendChild(card);
  });

  resultPanel.classList.remove("hidden");
}

function encodeSelection(role) {
  const all = perkData[role];
  const bits = all.map(perk => selected[role].has(perk) ? "1" : "0").join("");

  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = bits.slice(i, i + 4).padEnd(4, "0");
    hex += parseInt(nibble, 2).toString(16);
  }

  return hex;
}

function buildOverlayUrl() {
  const url = new URL("overlay.html", window.location.href);

  url.searchParams.set("role", currentRole);
  url.searchParams.set("pool", encodeSelection(currentRole));
  url.searchParams.set("empty", emptyChance.value);

  return url.toString();
}

function generateOverlayUrl() {
  if (selected[currentRole].size < 4) return;

  obsUrl.value = buildOverlayUrl();
  urlBox.classList.remove("hidden");
}

function previewOverlay() {
  if (selected[currentRole].size < 4) return;
  window.open(buildOverlayUrl(), "_blank", "noopener,noreferrer");
}

async function copyOverlayUrl() {
  if (!obsUrl.value) return;

  try {
    await navigator.clipboard.writeText(obsUrl.value);
    const previous = copyUrlBtn.textContent;
    copyUrlBtn.textContent = "Copied!";
    setTimeout(() => copyUrlBtn.textContent = previous, 1200);
  } catch {
    obsUrl.select();
    document.execCommand("copy");
  }
}

function setupEmptyChance() {
  const saved = localStorage.getItem(STORAGE_KEYS.emptyChance);
  if (saved !== null) {
    emptyChance.value = saved;
  }

  emptyChanceValue.textContent = emptyChance.value;

  emptyChance.addEventListener("input", () => {
    emptyChanceValue.textContent = emptyChance.value;
    localStorage.setItem(STORAGE_KEYS.emptyChance, emptyChance.value);
    urlBox.classList.add("hidden");
  });
}

async function initialise() {
  try {
    [perkData.survivor, perkData.killer] = await Promise.all([
      loadPerkList("survivor"),
      loadPerkList("killer")
    ]);

    loadSavedSelections("survivor");
    loadSavedSelections("killer");

    setupEmptyChance();
    updateRoleButtons();
    renderPerks();
  } catch (error) {
    console.error(error);
    perkGrid.innerHTML =
      '<p class="empty-state">Could not load the perk files.</p>';
    rollBtn.disabled = true;
    generateUrlBtn.disabled = true;
    previewBtn.disabled = true;
  }
}

survivorBtn.addEventListener("click", () => setRole("survivor"));
killerBtn.addEventListener("click", () => setRole("killer"));
perkSearch.addEventListener("input", renderPerks);
selectAllBtn.addEventListener("click", selectAllVisible);
clearAllBtn.addEventListener("click", clearAllVisible);
rollBtn.addEventListener("click", rollPerkele);
generateUrlBtn.addEventListener("click", generateOverlayUrl);
previewBtn.addEventListener("click", previewOverlay);
copyUrlBtn.addEventListener("click", copyOverlayUrl);

initialise();
