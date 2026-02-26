const STORAGE_KEY = "packingChecklistStateV1";

const state = {
  data: null,
  nights: 1,
  activeTags: new Set(),
  checked: {}
};

const dom = {
  nightsRange: document.querySelector("#nights-range"),
  nightsValue: document.querySelector("#nights-value"),
  tagsContainer: document.querySelector("#tags-container"),
  checklistContainer: document.querySelector("#checklist-container"),
  emptyState: document.querySelector("#empty-state"),
  errorBox: document.querySelector("#error-box")
};

init();

async function init() {
  try {
    const data = await loadData();
    state.data = normalizeData(data);
    hydrateFromStorage();
    bindEvents();
    renderTagControls();
    renderAll();
  } catch (error) {
    showError(`Nepodarilo se nacist data.json: ${String(error.message || error)}`);
  }
}

async function loadData() {
  const response = await fetch("./data.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function normalizeData(raw) {
  const tags = Array.isArray(raw?.tags) ? raw.tags : [];
  const items = Array.isArray(raw?.items) ? raw.items : [];
  const groupPriorities = raw?.groupPriorities && typeof raw.groupPriorities === "object" ? raw.groupPriorities : {};
  return { tags, items, groupPriorities };
}

function hydrateFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const allowedTagIds = new Set(state.data.tags.map((tag) => tag.id));

    if (Number.isFinite(parsed.nights)) {
      state.nights = clampNights(parsed.nights);
    }
    if (Array.isArray(parsed.tags)) {
      state.activeTags = new Set(parsed.tags.filter((tagId) => allowedTagIds.has(tagId)));
    }
    if (parsed.checked && typeof parsed.checked === "object") {
      state.checked = parsed.checked;
    }
  } catch {
    state.nights = 1;
    state.activeTags = new Set();
    state.checked = {};
  }
}

function bindEvents() {
  dom.nightsRange.addEventListener("input", () => {
    state.nights = clampNights(Number(dom.nightsRange.value));
    renderAll();
  });

  dom.tagsContainer.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.name !== "trip-tag") {
      return;
    }
    if (target.checked) {
      state.activeTags.add(target.value);
    } else {
      state.activeTags.delete(target.value);
    }
    renderAll();
  });

  dom.checklistContainer.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.name !== "check-item") {
      return;
    }
    state.checked[target.value] = target.checked;
    persistState();
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const resetButton = target.closest("#reset-button");
    if (!resetButton) {
      return;
    }
    resetAppState();
  });
}

function resetAppState() {
  state.nights = 1;
  state.activeTags = new Set();
  state.checked = {};
  localStorage.removeItem(STORAGE_KEY);
  renderTagControls();
  renderAll();
}

function renderAll() {
  updateNightsUI();
  renderChecklist();
  persistState();
}

function updateNightsUI() {
  dom.nightsRange.value = String(state.nights);
  if (state.nights === 0) {
    dom.nightsValue.textContent = "bez přenocování";
    return;
  }
  dom.nightsValue.textContent = state.nights === 10 ? "10+" : String(state.nights);
}

function renderTagControls() {
  const fragment = document.createDocumentFragment();

  for (const tag of state.data.tags) {
    const wrapper = document.createElement("label");
    wrapper.className =
      "flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-amber-300";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "trip-tag";
    input.value = tag.id;
    input.className = "h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500";
    input.checked = state.activeTags.has(tag.id);

    const text = document.createElement("span");
    text.textContent = tag.label;

    wrapper.append(input, text);
    fragment.appendChild(wrapper);
  }

  dom.tagsContainer.innerHTML = "";
  dom.tagsContainer.appendChild(fragment);
}

function renderChecklist() {
  const computed = computeChecklist(state.data.items, state.nights, state.activeTags, state.checked);

  if (computed.length === 0) {
    dom.checklistContainer.innerHTML = "";
    dom.emptyState.classList.remove("hidden");
    return;
  }

  dom.emptyState.classList.add("hidden");
  const byGroup = groupBy(computed, (item) => item.group);
  const sortedGroups = Object.keys(byGroup).sort((a, b) => {
    const priorityA = getGroupPriority(a);
    const priorityB = getGroupPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return a.localeCompare(b, "cs");
  });
  const fragment = document.createDocumentFragment();

  for (const group of sortedGroups) {
    const section = document.createElement("section");
    section.className = "rounded-xl border border-slate-200 bg-slate-50/70 p-4";

    const heading = document.createElement("h3");
    heading.className = "text-sm font-semibold uppercase tracking-wide text-slate-700";
    heading.textContent = group;

    const list = document.createElement("ul");
    list.className = "mt-3 space-y-2";

    const sortedItems = byGroup[group].sort((a, b) => a.label.localeCompare(b.label, "cs"));
    for (const item of sortedItems) {
      const li = document.createElement("li");
      li.className = "rounded-md bg-white px-3 py-2";

      const label = document.createElement("label");
      label.className = "flex cursor-pointer items-center gap-3 text-sm";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "check-item";
      checkbox.value = item.id;
      checkbox.checked = item.checked;
      checkbox.className = "h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500";

      const text = document.createElement("span");
      text.textContent = item.qty > 1 ? `${item.label} × ${item.qty}` : item.label;

      label.append(checkbox, text);
      li.appendChild(label);
      list.appendChild(li);
    }

    section.append(heading, list);
    fragment.appendChild(section);
  }

  dom.checklistContainer.innerHTML = "";
  dom.checklistContainer.appendChild(fragment);
}

function computeChecklist(items, nights, activeTags, checkedState) {
  const merged = new Map();

  for (const item of items) {
    if (!matchesWhen(item.when, activeTags)) {
      continue;
    }

    const qty = computeQty(item.qty, nights);
    if (qty <= 0) {
      continue;
    }

    if (!merged.has(item.id)) {
      merged.set(item.id, {
        id: item.id,
        label: item.label,
        group: item.group,
        qty,
        checked: Boolean(checkedState[item.id])
      });
      continue;
    }

    const existing = merged.get(item.id);
    existing.qty += qty;
  }

  return Array.from(merged.values());
}

function matchesWhen(whenRule, activeTags) {
  if (!whenRule || typeof whenRule !== "object") {
    return true;
  }

  if (Array.isArray(whenRule.any)) {
    if (whenRule.any.includes("*")) {
      return true;
    }
    return whenRule.any.some((tag) => activeTags.has(tag));
  }

  if (Array.isArray(whenRule.all)) {
    return whenRule.all.every((tag) => activeTags.has(tag));
  }

  return true;
}

function computeQty(qtyRule, nights) {
  if (!qtyRule || typeof qtyRule !== "object") {
    return 1;
  }

  if (qtyRule.type === "fixed") {
    return Math.max(0, Number(qtyRule.value) || 0);
  }

  if (qtyRule.type === "perNight") {
    if (nights === 0) {
      return 0;
    }
    const value = Math.max(0, Number(qtyRule.value) || 0);
    let qty = nights * value;
    if (Number.isFinite(qtyRule.cap)) {
      qty = Math.min(qty, qtyRule.cap);
    }
    return qty;
  }

  return Math.max(0, Number(qtyRule.value) || 0);
}

function persistState() {
  const payload = {
    nights: state.nights,
    tags: Array.from(state.activeTags),
    checked: state.checked
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function groupBy(list, keyGetter) {
  const out = {};
  for (const item of list) {
    const key = keyGetter(item);
    if (!out[key]) {
      out[key] = [];
    }
    out[key].push(item);
  }
  return out;
}

function getGroupPriority(group) {
  const rawPriority = state.data.groupPriorities?.[group];
  return Number.isFinite(rawPriority) ? rawPriority : Number.POSITIVE_INFINITY;
}

function clampNights(value) {
  const num = Number.isFinite(value) ? value : 1;
  return Math.min(10, Math.max(0, Math.round(num)));
}

function showError(message) {
  dom.errorBox.textContent = message;
  dom.errorBox.classList.remove("hidden");
}
