const PERKELE_SETTINGS = {
  perkLists: {
    survivor: "data/survivor-perks.txt",
    killer: "data/killer-perks.txt"
  },

  imageFolders: {
    survivor: "https://papathorswe.se/perks/survivor/",
    killer: "https://papathorswe.se/perks/killer/"
  },

  noPerkImage: "https://papathorswe.se/perks/no-perk.png",

  // Chance that slot 4 fake-outs on a real perk before dropping to NO PERK.
  betrayalChance: 0.55,

  firstStopDelay: 1750,
  delayBetweenStops: 470,
  spinItemCount: 20,
  betrayalPause: 330,

  // Overlay hides after the completed result has been shown for this long.
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

function clearPerkeleTimers() {
  perkeleTimeouts.forEach(timer => clearTimeout(timer));
  perkeleTimeouts = [];

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
  const response = await fetch(
    PERKELE_SETTINGS.perkLists[role],
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      "Could not load " + role + " perk list."
    );
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

function createReelItem(role, result) {
  const item = document.createElement("div");
  item.className = "reel-item";

  if (result.isEmpty) {
    item.classList.add("no-perk");
  }

  const image = document.createElement("img");
  image.alt = result.name;
  image.draggable = false;

  image.src = result.isEmpty
    ? PERKELE_SETTINGS.noPerkImage
    : getPerkImage(role, result.name);

  image.onerror = function () {
    console.error(
      "Could not load perk image:",
      image.src,
      "for",
      result.name
    );

    image.style.visibility = "hidden";
  };

  item.appendChild(image);
  return item;
}

function buildSpinSequence(
  role,
  perkPool,
  finalResult,
  useBetrayal
) {
  const sequence = [];
  const fillerPool = shuffle(perkPool);

  for (
    let i = 0;
    i < PERKELE_SETTINGS.spinItemCount;
    i++
  ) {
    sequence.push({
      name: fillerPool[i % fillerPool.length],
      isEmpty: false
    });
  }

  if (useBetrayal) {
    sequence.push({
      name: randomItem(perkPool),
      isEmpty: false,
      isTease: true
    });

    sequence.push(finalResult);
  } else {
    sequence.push(finalResult);
  }

  return sequence;
}

function resetSlot(slot) {
  const track = slot.querySelector(".reel-track");
  const name = slot.querySelector(".perk-name");

  slot.classList.remove(
    "stopped",
    "empty-result",
    "betrayal-pause",
    "betrayal-drop"
  );

  track.style.transition = "none";
  track.style.transform = "translateY(0)";
  track.innerHTML = "";
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

function animateReel({
  slot,
  role,
  perkPool,
  finalResult,
  stopDelay,
  useBetrayal,
  runId,
  isLastSlot
}) {
  const track = slot.querySelector(".reel-track");
  const nameLabel = slot.querySelector(".perk-name");

  const sequence = buildSpinSequence(
    role,
    perkPool,
    finalResult,
    useBetrayal
  );

  sequence.forEach(result => {
    track.appendChild(
      createReelItem(role, result)
    );
  });

  const reelItems =
    Array.from(
      track.querySelectorAll(".reel-item")
    );

  if (reelItems.length !== sequence.length) {
    console.error(
      "Could not measure all reel item positions."
    );
    return;
  }

  const finalIndex = sequence.length - 1;

  const teaseIndex = useBetrayal
    ? sequence.length - 2
    : finalIndex;

  const finalTarget =
    -reelItems[finalIndex].offsetTop;

  const teaseTarget =
    -reelItems[teaseIndex].offsetTop;

  track.style.transition = "none";
  track.style.transform = "translateY(0)";

  void track.offsetHeight;

  const baseSpinDuration = stopDelay;

  track.style.transition =
    "transform " +
    baseSpinDuration +
    "ms cubic-bezier(.08,.72,.18,1)";

  track.style.transform =
    "translateY(" + teaseTarget + "px)";

  if (useBetrayal) {
    schedulePerkele(() => {
      if (runId !== perkeleRunId) return;

      slot.classList.add("betrayal-pause");
    }, baseSpinDuration);

    schedulePerkele(() => {
      if (runId !== perkeleRunId) return;

      slot.classList.remove("betrayal-pause");

      track.style.transition =
        "transform 280ms cubic-bezier(.2,.8,.25,1.1)";

      track.style.transform =
        "translateY(" + finalTarget + "px)";

      slot.classList.add("betrayal-drop");
    }, baseSpinDuration + PERKELE_SETTINGS.betrayalPause);

    schedulePerkele(() => {
      finishSlot(
        slot,
        nameLabel,
        finalResult,
        runId,
        isLastSlot
      );
    },
    baseSpinDuration +
    PERKELE_SETTINGS.betrayalPause +
    300);
  } else {
    schedulePerkele(() => {
      finishSlot(
        slot,
        nameLabel,
        finalResult,
        runId,
        isLastSlot
      );
    }, baseSpinDuration + 30);
  }
}

function finishSlot(
  slot,
  nameLabel,
  finalResult,
  runId,
  isLastSlot
) {
  if (runId !== perkeleRunId) {
    return;
  }

  nameLabel.textContent = finalResult.name;
  slot.classList.add("stopped");

  if (finalResult.isEmpty) {
    slot.classList.add("empty-result");
  }

  if (isLastSlot) {
    finishPerkeleRound(runId);
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

      animateReel({
        slot: slots[index],
        role: CURRENT_ROLE,
        perkPool,
        finalResult: result,
        stopDelay,
        useBetrayal:
          index === 3 && betrayFinalSlot,
        runId,
        isLastSlot: index === 3
      });
    });
  } catch (error) {
    console.error(error);

    const widget =
      document.getElementById("perkele-widget");

    const roleText =
      document.getElementById("perkele-role");

    const status =
      document.getElementById("perkele-status");

    const footer =
      document.getElementById("perkele-footer");

    widget.classList.remove("hidden");
    roleText.textContent = "PERKELE ERROR";
    status.textContent =
      "THE ENTITY ATE THE PERK LIST.";
    footer.textContent =
      "Check the Browser Source URL and try again.";
  }
}

runPerkele();
