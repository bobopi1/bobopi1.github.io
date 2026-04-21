const STORAGE_KEY = "budgetflow-web-entries-v1";

const categories = {
  expense: [
    "Food",
    "Transport",
    "Bills",
    "Shopping",
    "Health",
    "Entertainment",
    "Housing",
    "Other"
  ],
  income: [
    "Salary",
    "Freelance",
    "Gift",
    "Refund",
    "Investment",
    "Other"
  ]
};

const state = {
  entries: loadEntries(),
  trendPeriod: "weekly",
  filter: "all",
  search: ""
};

const elements = {
  entryForm: document.querySelector("#entry-form"),
  title: document.querySelector("#title"),
  amount: document.querySelector("#amount"),
  category: document.querySelector("#category"),
  date: document.querySelector("#date"),
  time: document.querySelector("#time"),
  notes: document.querySelector("#notes"),
  filter: document.querySelector("#history-filter"),
  search: document.querySelector("#search"),
  jumpToForm: document.querySelector("#jump-to-form"),
  resetForm: document.querySelector("#reset-form"),
  installApp: document.querySelector("#install-app"),
  installDialog: document.querySelector("#install-dialog"),
  periodWeekly: document.querySelector("#period-weekly"),
  periodMonthly: document.querySelector("#period-monthly"),
  historyList: document.querySelector("#history-list"),
  trendChart: document.querySelector("#trend-chart"),
  balanceValue: document.querySelector("#balance-value"),
  weekSpentValue: document.querySelector("#week-spent-value"),
  monthSpentValue: document.querySelector("#month-spent-value"),
  weekIncomeHint: document.querySelector("#week-income-hint"),
  monthIncomeHint: document.querySelector("#month-income-hint"),
  entryCountValue: document.querySelector("#entry-count-value"),
  lastEntryHint: document.querySelector("#last-entry-hint"),
  storageStatus: document.querySelector("#storage-status"),
  historyItemTemplate: document.querySelector("#history-item-template")
};

bootstrap();

function bootstrap() {
  setDefaultDateTime();
  syncCategoryOptions();
  bindEvents();
  render();
  registerServiceWorker();
}

function bindEvents() {
  elements.entryForm.addEventListener("submit", handleSubmit);
  elements.filter.addEventListener("change", (event) => {
    state.filter = event.target.value;
    renderHistory();
  });
  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderHistory();
  });
  elements.jumpToForm.addEventListener("click", () => {
    document.querySelector("#entry-form-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    elements.title.focus();
  });
  elements.resetForm.addEventListener("click", resetForm);
  elements.installApp.addEventListener("click", () => {
    if (typeof elements.installDialog.showModal === "function") {
      elements.installDialog.showModal();
    } else {
      window.alert("Open this site in Safari on your iPhone, tap Share, then choose Add to Home Screen.");
    }
  });
  elements.periodWeekly.addEventListener("click", () => setTrendPeriod("weekly"));
  elements.periodMonthly.addEventListener("click", () => setTrendPeriod("monthly"));

  document.querySelectorAll('input[name="kind"]').forEach((radio) => {
    radio.addEventListener("change", syncCategoryOptions);
  });
}

function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.entryForm);
  const kind = formData.get("kind");
  const title = String(formData.get("title") || "").trim();
  const amount = Number(formData.get("amount"));
  const category = String(formData.get("category") || "");
  const notes = String(formData.get("notes") || "").trim();
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");

  if (!title || !Number.isFinite(amount) || amount <= 0 || !date || !time) {
    return;
  }

  state.entries.unshift({
    id: createId(),
    kind,
    title,
    amount,
    category,
    notes,
    createdAt: new Date(`${date}T${time}`).toISOString()
  });

  saveEntries();
  resetForm();
  render();
}

function resetForm() {
  elements.entryForm.reset();
  document.querySelector("#kind-expense").checked = true;
  syncCategoryOptions();
  setDefaultDateTime();
  elements.title.focus();
}

function syncCategoryOptions() {
  const selectedKind = getSelectedKind();
  const options = categories[selectedKind];

  elements.category.innerHTML = "";

  options.forEach((option) => {
    const element = document.createElement("option");
    element.value = option;
    element.textContent = option;
    elements.category.appendChild(element);
  });
}

function getSelectedKind() {
  return document.querySelector('input[name="kind"]:checked').value;
}

function setDefaultDateTime() {
  const now = new Date();
  elements.date.value = formatDateInput(now);
  elements.time.value = formatTimeInput(now);
}

function render() {
  renderSummary();
  renderTrend();
  renderHistory();
  elements.storageStatus.textContent = "Saved locally on this device";
}

function renderSummary() {
  const sortedEntries = getSortedEntries();
  const now = new Date();
  const weekRange = getWeekRange(now);
  const monthRange = getMonthRange(now);

  const balance = sumAmount(state.entries, "income") - sumAmount(state.entries, "expense");
  const weekSpent = sumAmount(inRangeEntries(state.entries, weekRange), "expense");
  const monthSpent = sumAmount(inRangeEntries(state.entries, monthRange), "expense");
  const weekIncome = sumAmount(inRangeEntries(state.entries, weekRange), "income");
  const monthIncome = sumAmount(inRangeEntries(state.entries, monthRange), "income");

  elements.balanceValue.textContent = formatCurrency(balance);
  elements.weekSpentValue.textContent = formatCurrency(weekSpent);
  elements.monthSpentValue.textContent = formatCurrency(monthSpent);
  elements.weekIncomeHint.textContent = `Income this week: ${formatCurrency(weekIncome)}`;
  elements.monthIncomeHint.textContent = `Income this month: ${formatCurrency(monthIncome)}`;
  elements.entryCountValue.textContent = String(state.entries.length);
  elements.lastEntryHint.textContent = sortedEntries.length
    ? `Latest: ${sortedEntries[0].title} on ${formatShortDateTime(sortedEntries[0].createdAt)}`
    : "No entries yet";
}

function renderTrend() {
  const points = state.trendPeriod === "weekly" ? getWeeklyTrend(state.entries) : getMonthlyTrend(state.entries);
  elements.trendChart.innerHTML = "";

  elements.periodWeekly.classList.toggle("is-active", state.trendPeriod === "weekly");
  elements.periodMonthly.classList.toggle("is-active", state.trendPeriod === "monthly");

  if (!points.some((point) => point.total > 0)) {
    const empty = document.createElement("p");
    empty.className = "chart-empty";
    empty.textContent = "Add a few spending entries to see your trend here.";
    elements.trendChart.appendChild(empty);
    return;
  }

  const maxValue = Math.max(...points.map((point) => point.total), 1);

  points.forEach((point) => {
    const wrapper = document.createElement("div");
    wrapper.className = "chart-bar-wrap";

    const value = document.createElement("div");
    value.className = "chart-value";
    value.textContent = formatCurrency(point.total);

    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${Math.max((point.total / maxValue) * 180, 16)}px`;
    bar.title = `${point.label}: ${formatCurrency(point.total)}`;

    const label = document.createElement("div");
    label.className = "chart-label";
    label.textContent = point.label;

    wrapper.append(value, bar, label);
    elements.trendChart.appendChild(wrapper);
  });
}

function renderHistory() {
  const entries = getVisibleEntries();
  elements.historyList.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = state.entries.length
      ? "No entries match your current search or filter."
      : "No entries yet. Add your first spending or earning above.";
    elements.historyList.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const fragment = elements.historyItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".history-item");
    item.dataset.kind = entry.kind;

    fragment.querySelector(".history-title").textContent = entry.title;
    fragment.querySelector(".history-amount").textContent = `${entry.kind === "income" ? "+" : "-"}${formatCurrency(entry.amount)}`;
    fragment.querySelector(".history-meta").textContent = `${entry.category} - ${formatLongDateTime(entry.createdAt)}`;
    fragment.querySelector(".history-notes").textContent = entry.notes || "No notes";

    fragment.querySelector(".delete-button").addEventListener("click", () => {
      state.entries = state.entries.filter((currentEntry) => currentEntry.id !== entry.id);
      saveEntries();
      render();
    });

    elements.historyList.appendChild(fragment);
  });
}

function setTrendPeriod(period) {
  state.trendPeriod = period;
  renderTrend();
}

function getVisibleEntries() {
  const normalizedSearch = state.search.toLowerCase();

  return getSortedEntries().filter((entry) => {
    const matchesFilter = state.filter === "all" || entry.kind === state.filter;
    const haystack = [entry.title, entry.category, entry.notes].join(" ").toLowerCase();
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });
}

function getSortedEntries() {
  return [...state.entries].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function getWeeklyTrend(entries) {
  const now = new Date();
  const points = [];

  for (let offset = 7; offset >= 0; offset -= 1) {
    const anchor = new Date(now);
    anchor.setDate(now.getDate() - offset * 7);
    const range = getWeekRange(anchor);
    const total = sumAmount(inRangeEntries(entries, range), "expense");

    points.push({
      label: range.start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      total
    });
  }

  return points;
}

function getMonthlyTrend(entries) {
  const now = new Date();
  const points = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const anchor = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const range = getMonthRange(anchor);
    const total = sumAmount(inRangeEntries(entries, range), "expense");

    points.push({
      label: anchor.toLocaleDateString(undefined, { month: "short" }),
      total
    });
  }

  return points;
}

function inRangeEntries(entries, range) {
  return entries.filter((entry) => {
    const timestamp = new Date(entry.createdAt);
    return timestamp >= range.start && timestamp < range.end;
  });
}

function sumAmount(entries, kind) {
  return entries
    .filter((entry) => entry.kind === kind)
    .reduce((total, entry) => total + Number(entry.amount), 0);
}

function getWeekRange(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diff);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
}

function getMonthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(amount || 0);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeInput(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatShortDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatLongDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadEntries() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidEntry);
  } catch (error) {
    console.error("Failed to load entries", error);
    return [];
  }
}

function saveEntries() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function isValidEntry(entry) {
  return entry
    && typeof entry.id === "string"
    && (entry.kind === "expense" || entry.kind === "income")
    && typeof entry.title === "string"
    && Number.isFinite(Number(entry.amount))
    && typeof entry.category === "string"
    && typeof entry.notes === "string"
    && typeof entry.createdAt === "string";
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }
}
