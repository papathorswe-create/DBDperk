// Perkele OBS overlay - PapaThorSwe

const PERKELE_SETTINGS = {
  perkLists: {
    survivor: {
      primary: "https://papathorswe.se/perks/survivor-perks.txt",
      fallback: "data/survivor-perks.txt"
    },
    killer: {
      primary: "https://papathorswe.se/perks/killer-perks.txt",
      fallback: "data/killer-perks.txt"
    }
  },

  imageFolders: {
    survivor: "https://papathorswe.se/perks/survivor/",
    killer: "https://papathorswe.se/perks/killer/"
  },

  noPerkImage: "https://papathorswe.se/perks/no-perk.png",

  betrayalChance: 0.55,

  firstStopDelay: 1750,
  delayBetweenStops: 470,
  spinInterval: 90,
  betrayalPause: 420,

  resultDisplayTime: 18000,

  emptyFooterText: "PERKELE! THE ENTITY TOOK A PERK."
};

const params = new URLSearchParams(window.location.search);

const CURRENT_ROLE =
  params.get("role") === "killer"
    ? "killer"
    : "survivor";

const POOL_HEX = params.get("pool") || "";

const EMPTY_CHANCE =
  Math.max(
    0,
    Math.min(50, Number(params.get("empty") || 12))
  ) / 100;

let perkeleRunId = 0;
let perkeleHideTimer = null;
let perkeleTimeouts = [];
let perkeleIntervals = [];

function clearPerkeleTimers() {
  perkeleTimeouts.forEach(timer => clearTimeout(timer));
  perkeleTimeouts = [];

  perkeleIntervals.forEach(timer => clearInterval(timer));
  perkeleIntervals = [];

  if (perkeleHideTimer) {
    clearTimeout(perkeleHideTimer);
    perkeleHideTimer = null;
  }
}

function schedulePerkele(callback, delay) {
  const timer = setTimeout(callback, delay);
  perkeleTimeouts.push(timer);
  return timer;
}

function parsePerkList(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"));
}

async function loadPerkList(role) {
  const sources = [
    PERKELE_SETTINGS.perkLists[role].primary,
    PERKELE_SETTINGS.perkLists[role].fallback
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: "no-store" });

      if (!response.ok) continue;

      const perks = parsePerkList(await response.text());

      if (perks.length >= 4) {
        return perks;
      }
    } catch (error) {
      console.warn("Could not load perk list from:", source);
    }
  }

  throw new Error("Could not load perk list.");
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

function getPerkImage(role, perkName) {
  return (
    PERKELE_SETTINGS.imageFolders[role] +
    perkToFilename(perkName)
  );
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function decodeSelection(allPerks) {
  if (!POOL_HEX) {
    return [...allPerks];
  }

  let bits = "";

  for (const char of POOL_HEX) {
    const value = parseInt(char, 16);

    if (Number.isNaN(value)) {
      return [...allPerks];
    }

    bits += value.toString(2).padStart(4, "0");
  }

  const selected = allPerks.filter(
    (perk, index) => bits[index] === "1"
  );

  return selected.length >= 4
    ? selected
    : [...allPerks];
}

function chooseFinalResults(perkPool) {
  const available = shuffle(perkPool);
  const results = [];

  for (let slot = 0; slot < 4; slot++) {
    const isEmpty = Math.random() < EMPTY_CHANCE;

    if (isEmpty) {
      results.push({
        name: "NO PERK",
        isEmpty: true
      });
    } else {
      results.push({
        name: available.pop(),
        isEmpty: false
      });
    }
  }

  return results;
}

function resetSlot(slot) {
  const image = slot.querySelector(".perk-image");
  const name = slot.querySelector(".perk-name");

  slot.classList.remove(
    "stopped",
    "empty-result",
    "betrayal-pause",
    "betrayal-drop",
    "spinning"
  );

  image.removeAttribute("src");
  image.alt = "";
  image.style.visibility = "hidden";

  name.textContent = "";
}

function setHeader(role) {
  const widget =
    document.getElementById("perkele-widget");

  const roleText =
    document.getElementById("perkele-role");

  const status =
    document.getElementById("perkele-status");

  const footer =
    document.getElementById("perkele-footer");

  widget.classList.remove(
    "hidden",
    "widget-exit"
  );

  widget.classList.remove("widget-enter");
  void widget.offsetWidth;
  widget.classList.add("widget-enter");

  roleText.textContent =
    role === "killer"
      ? "KILLER PERKELE"
      : "SURVIVOR PERKELE";

  status.textContent = "THE ENTITY IS CHOOSING...";
  footer.textContent = "";
}

function showPerkInSlot(slot, role, result) {
  const image = slot.querySelector(".perk-image");
  const name = slot.querySelector(".perk-name");

  image.style.visibility = "visible";
  image.alt = result.name;

  image.src = result.isEmpty
    ? PERKELE_SETTINGS.noPerkImage
    : getPerkImage(role, result.name);

  image.onerror = function () {
    console.warn(
      "Could not load perk image:",
      image.src,
      "for",
      result.name
    );
    image.style.visibility = "hidden";
  };

  name.textContent = result.name;
}

function startSlotSpinner(slot, role, perkPool, index) {
  slot.classList.add("spinning");

  let tick = index * 5;
  const shuffled = shuffle(perkPool);

  const interval = setInterval(() => {
    const perk =
      shuffled[tick % shuffled.length];

    showPerkInSlot(
      slot,
      role,
      {
        name: perk,
        isEmpty: false
      }
    );

    tick++;
  }, PERKELE_SETTINGS.spinInterval);

  perkeleIntervals.push(interval);
  return interval;
}

function stopInterval(interval) {
  clearInterval(interval);
  perkeleIntervals =
    perkeleIntervals.filter(item => item !== interval);
}

function finishSlot(
  slot,
  role,
  finalResult,
  runId,
  isLastSlot
) {
  if (runId !== perkeleRunId) {
    return;
  }

  slot.classList.remove("spinning");
  slot.classList.add("stopped");

  if (finalResult.isEmpty) {
    slot.classList.add("empty-result");
  }

  showPerkInSlot(
    slot,
    role,
    finalResult
  );

  if (isLastSlot) {
    finishPerkeleRound(runId);
  }
}

function animateSlot({
  slot,
  role,
  perkPool,
  finalResult,
  stopDelay,
  useBetrayal,
  runId,
  isLastSlot,
  index
}) {
  const interval =
    startSlotSpinner(
      slot,
      role,
      perkPool,
      index
    );

  if (useBetrayal) {
    schedulePerkele(() => {
      if (runId !== perkeleRunId) return;

      stopInterval(interval);

      const tease = {
        name: randomItem(perkPool),
        isEmpty: false
      };

      slot.classList.remove("spinning");
      slot.classList.add("betrayal-pause");

      showPerkInSlot(
        slot,
        role,
        tease
      );
    }, stopDelay);

    schedulePerkele(() => {
      if (runId !== perkeleRunId) return;

      slot.classList.remove("betrayal-pause");
      slot.classList.add("betrayal-drop");

      showPerkInSlot(
        slot,
        role,
        finalResult
      );
    }, stopDelay + PERKELE_SETTINGS.betrayalPause);

    schedulePerkele(() => {
      finishSlot(
        slot,
        role,
        finalResult,
        runId,
        isLastSlot
      );
    },
    stopDelay +
    PERKELE_SETTINGS.betrayalPause +
    320);
  } else {
    schedulePerkele(() => {
      if (runId !== perkeleRunId) return;

      stopInterval(interval);

      finishSlot(
        slot,
        role,
        finalResult,
        runId,
        isLastSlot
      );
    }, stopDelay);
  }
}

function finishPerkeleRound(runId) {
  if (runId !== perkeleRunId) {
    return;
  }

  const status =
    document.getElementById("perkele-status");

  const footer =
    document.getElementById("perkele-footer");

  const emptyCount =
    document.querySelectorAll(
      ".perk-slot.empty-result"
    ).length;

  if (emptyCount === 0) {
    status.textContent = "YOUR LOADOUT IS READY";
    footer.textContent =
      "THE ENTITY WAS STRANGELY GENEROUS.";
  } else if (emptyCount === 4) {
    status.textContent = "ABSOLUTELY PERKELE";
    footer.textContent =
      "NO PERKS. ONLY VIBES.";
  } else {
    status.textContent = "YOUR LOADOUT IS READY";

    footer.textContent =
      emptyCount === 1
        ? PERKELE_SETTINGS.emptyFooterText
        : "PERKELE! THE ENTITY TOOK " +
          emptyCount +
          " PERKS.";
  }

  perkeleHideTimer = setTimeout(() => {
    hidePerkeleWidget();
  }, PERKELE_SETTINGS.resultDisplayTime);
}

function hidePerkeleWidget() {
  clearPerkeleTimers();
  perkeleRunId++;

  const widget =
    document.getElementById("perkele-widget");

  if (!widget) return;

  widget.classList.remove("widget-enter");
  widget.classList.add("widget-exit");

  setTimeout(() => {
    widget.classList.add("hidden");
    widget.classList.remove("widget-exit");

    document
      .querySelectorAll(".perk-slot")
      .forEach(resetSlot);
  }, 390);
}

function showFatalError(error) {
  console.error("Perkele overlay error:", error);

  const widget =
    document.getElementById("perkele-widget");

  const roleText =
    document.getElementById("perkele-role");

  const status =
    document.getElementById("perkele-status");

  const footer =
    document.getElementById("perkele-footer");

  widget.classList.remove(
    "hidden",
    "widget-exit"
  );

  roleText.textContent = "PERKELE ERROR";
  status.textContent =
    "Something broke. Perkele is having a moment.";

  footer.textContent =
    error && error.message
      ? error.message
      : "Unknown error.";
}

async function runPerkele() {
  clearPerkeleTimers();
  perkeleRunId++;

  const runId = perkeleRunId;

  try {
    const allPerks =
      await loadPerkList(CURRENT_ROLE);

    const perkPool =
      decodeSelection(allPerks);

    if (perkPool.length < 4) {
      throw new Error(
        "Perkele requires at least four selected perks."
      );
    }

    const slots =
      Array.from(
        document.querySelectorAll(".perk-slot")
      );

    if (slots.length !== 4) {
      throw new Error(
        "Perkele requires exactly four perk slots."
      );
    }

    setHeader(CURRENT_ROLE);
    slots.forEach(resetSlot);

    const results =
      chooseFinalResults(perkPool);

    const betrayFinalSlot =
      results[3].isEmpty &&
      Math.random() <
        PERKELE_SETTINGS.betrayalChance;

    results.forEach((result, index) => {
      const stopDelay =
        PERKELE_SETTINGS.firstStopDelay +
        index *
        PERKELE_SETTINGS.delayBetweenStops;

      animateSlot({
        slot: slots[index],
        role: CURRENT_ROLE,
        perkPool,
        finalResult: result,
        stopDelay,
        useBetrayal:
          index === 3 &&
          betrayFinalSlot,
        runId,
        isLastSlot:
          index === 3,
        index
      });
    });
  } catch (error) {
    showFatalError(error);
  }
}

window.addEventListener(
  "error",
  event => {
    showFatalError(
      event.error ||
      new Error(event.message)
    );
  }
);

window.addEventListener(
  "unhandledrejection",
  event => {
    const reason =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    showFatalError(reason);
  }
);

runPerkele();
