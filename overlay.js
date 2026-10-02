const PERK_LISTS = {
  survivor: "data/survivor-perks.txt",
  killer: "data/killer-perks.txt"
};

const IMAGE_FOLDERS = {
  survivor: "https://papathorswe.se/perks/survivor/",
  killer: "https://papathorswe.se/perks/killer/"
};

const NO_PERK_IMAGE = "https://papathorswe.se/perks/no-perk.png";

const params = new URLSearchParams(window.location.search);

const role =
  params.get("role") === "killer"
    ? "killer"
    : "survivor";

const poolHex = params.get("pool") || "";
const emptyChance = Math.max(
  0,
  Math.min(50, Number(params.get("empty") || 12))
) / 100;

const widget = document.getElementById("perkeleWidget");
const roleTitle = document.getElementById("roleTitle");
const statusText = document.getElementById("statusText");
const slots = document.getElementById("slots");
const footerText = document.getElementById("footerText");

function parsePerkList(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"));
}

async function loadPerkList() {
  const response = await fetch(PERK_LISTS[role], { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not load perk list.");
  }

  return parsePerkList(await response.text());
}

function perkToFilename(perkName) {
  return String(perkName)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[’'!:]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    + ".png";
}

function decodeSelection(allPerks) {
  if (!poolHex) return [...allPerks];

  let bits = "";

  for (const char of poolHex) {
    bits += parseInt(char, 16).toString(2).padStart(4, "0");
  }

  const selected = allPerks.filter((perk, index) => bits[index] === "1");

  return selected.length >= 4 ? selected : [...allPerks];
}

function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function chooseResults(pool) {
  const available = shuffle(pool);
  const results = [];

  for (let i = 0; i < 4; i++) {
    const isEmpty = Math.random() < emptyChance;

    if (isEmpty) {
      results.push({
        name: "NO PERK",
        empty: true
      });
    } else {
      results.push({
        name: available.pop(),
        empty: false
      });
    }
  }

  return results;
}

function createSlot() {
  const slot = document.createElement("div");
  slot.className = "slot spinning";

  const img = document.createElement("img");
  img.className = "perk-image";
  img.alt = "";

  const name = document.createElement("div");
  name.className = "perk-name";
  name.textContent = "THE ENTITY...";

  slot.append(img, name);
  slots.appendChild(slot);

  return { slot, img, name };
}

function showResult(slotData, result) {
  const { slot, img, name } = slotData;

  slot.classList.remove("spinning");
  slot.classList.toggle("empty", result.empty);

  img.src = result.empty
    ? NO_PERK_IMAGE
    : IMAGE_FOLDERS[role] + perkToFilename(result.name);

  img.onerror = () => {
    img.style.visibility = "hidden";
  };

  name.textContent = result.name;
}

async function run() {
  try {
    const allPerks = await loadPerkList();
    const pool = decodeSelection(allPerks);
    const finalResults = chooseResults(pool);

    roleTitle.textContent =
      role === "killer"
        ? "KILLER PERKELE"
        : "SURVIVOR PERKELE";

    widget.classList.remove("hidden");
    widget.classList.add("enter");

    const slotElements = Array.from({ length: 4 }, createSlot);

    const filler = shuffle(pool);

    // Give each slot a short fake cycling effect before it lands.
    const spinTimers = slotElements.map((slotData, index) => {
      let tick = 0;

      const interval = setInterval(() => {
        const perk = filler[(tick + index * 7) % filler.length];

        slotData.img.style.visibility = "visible";
        slotData.img.src =
          IMAGE_FOLDERS[role] + perkToFilename(perk);
        slotData.name.textContent = perk;

        tick++;
      }, 95);

      return interval;
    });

    finalResults.forEach((result, index) => {
      setTimeout(() => {
        clearInterval(spinTimers[index]);
        showResult(slotElements[index], result);

        if (index === 3) {
          const emptyCount = finalResults.filter(x => x.empty).length;

          statusText.textContent = "YOUR LOADOUT IS READY";

          if (emptyCount === 0) {
            footerText.textContent = "THE ENTITY WAS STRANGELY GENEROUS.";
          } else if (emptyCount === 4) {
            statusText.textContent = "ABSOLUTELY PERKELE";
            footerText.textContent = "NO PERKS. ONLY VIBES.";
          } else if (emptyCount === 1) {
            footerText.textContent = "PERKELE! THE ENTITY TOOK A PERK.";
          } else {
            footerText.textContent =
              `PERKELE! THE ENTITY TOOK ${emptyCount} PERKS.`;
          }
        }
      }, 1500 + index * 480);
    });
  } catch (error) {
    console.error(error);
    widget.classList.remove("hidden");
    roleTitle.textContent = "PERKELE ERROR";
    statusText.textContent = "THE ENTITY ATE THE PERK LIST.";
  }
}

run();
