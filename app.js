const PERK_LISTS = {
  survivor: "data/survivor-perks.txt",
  killer: "data/killer-perks.txt"
};

const STORAGE_KEYS = {
  survivor: "perkele-selected-survivor",
  killer: "perkele-selected-killer",
  role: "perkele-role"
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

  // First visit: select every perk by default.
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
  updateRoleButtons();
  renderPerks();
}

function updateCounts() {
  const chosen = selected[currentRole].size;
  const total = perkData[currentRole].length;

  selectedCount.textContent = chosen;
  totalCount.textContent = total;

  rollBtn.disabled = chosen < 4;
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
  renderPerks();
}

function clearAllVisible() {
  const query = perkSearch.value.trim().toLowerCase();

  perkData[currentRole]
    .filter(perk => perk.toLowerCase().includes(query))
    .forEach(perk => selected[currentRole].delete(perk));

  saveSelections(currentRole);
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

  if (pool.length < 4) {
    return;
  }

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

async function initialise() {
  try {
    [perkData.survivor, perkData.killer] = await Promise.all([
      loadPerkList("survivor"),
      loadPerkList("killer")
    ]);

    loadSavedSelections("survivor");
    loadSavedSelections("killer");

    updateRoleButtons();
    renderPerks();
  } catch (error) {
    console.error(error);
    perkGrid.innerHTML =
      '<p class="empty-state">Could not load the perk files. Run this folder through a local web server rather than opening index.html directly.</p>';
    rollBtn.disabled = true;
  }
}

survivorBtn.addEventListener("click", () => setRole("survivor"));
killerBtn.addEventListener("click", () => setRole("killer"));
perkSearch.addEventListener("input", renderPerks);
selectAllBtn.addEventListener("click", selectAllVisible);
clearAllBtn.addEventListener("click", clearAllVisible);
rollBtn.addEventListener("click", rollPerkele);

initialise();
