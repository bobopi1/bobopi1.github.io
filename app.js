const STORAGE_KEY = "budgetflow-web-data-v2";
const LEGACY_ENTRY_KEY = "budgetflow-web-entries-v1";

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

const frequencyLabels = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly"
};

const state = {
  view: "overview",
  entries: [],
  recurringItems: [],
  trendPeriod: "weekly",
  filter: "all",
  search: ""
};

const forms = {
  expense: {
    element: document.querySelector("#expense-form"),
    kind: "expense",
    title: document.querySelector("#expense-title"),
    amount: document.querySelector("#expense-amount"),
    category: document.querySelector("#expense-category"),
    date: document.querySelector("#expense-date"),
    time: document.querySelector("#expense-time"),
    notes: document.querySelector("#expense-notes")
  },
  income: {
    element: document.querySelector("#income-form"),
    kind: "income",
    title: document.querySelector("#income-title"),
    amount: document.querySelector("#income-amount"),
    category: document.querySelector("#income-category"),
    date: document.querySelector("#income-date"),
    time: document.querySelector("#income-time"),
    notes: document.querySelector("#income-notes")
  }
};

const recurringForms = {
  "expense-recurring": {
    element: document.querySelector("#expense-recurring-form"),
    kind: "expense",
    title: document.querySelector("#expense-recurring-title"),
    amount: document.querySelector("#expense-recurring-amount"),
    category: document.querySelector("#expense-recurring-category"),
    frequency: document.querySelector("#expense-recurring-frequency"),
    startDate: document.querySelector("#expense-recurring-start"),
    notes: document.querySelector("#expense-recurring-notes")
  },
  "income-recurring": {
    element: document.querySelector("#income-recurring-form"),
    kind: "income",
    title: document.querySelector("#income-recurring-title"),
    amount: document.querySelector("#income-recurring-amount"),
    category: document.querySelector("#income-recurring-category"),
    frequency: document.querySelector("#income-recurring-frequency"),
    startDate: document.querySelector("#income-recurring-start"),
    notes: document.querySelector("#income-recurring-notes")
  }
};

const elements = {
  pageTabs: Array.from(document.querySelectorAll(".page-tab")),
  views: {
    overview: document.querySelector("#view-overview"),
    spending: document.querySelector("#view-spending"),
    revenue: document.querySelector("#view-revenue")
  },
  resetButtons: Array.from(document.querySelectorAll("[data-reset-form]")),
  goOverview: document.querySelector("#go-overview"),
  installApp: document.querySelector("#install-app"),
  installDialog: document.querySelector("#install-dialog"),
  filter: document.querySelector("#history-filter"),
  search: document.querySelector("#search"),
  periodWeekly: document.querySelector("#period-weekly"),
  periodMonthly: document.querySelector("#period-monthly"),
  historyList: document.querySelector("#history-list"),
  recurringList: document.querySelector("#recurring-list"),
  recurringSummary: document.querySelector("#recurring-summary"),
  trendChart: document.querySelector("#trend-chart"),
  balanceValue: document.querySelector("#balance-value"),
  weekSpentValue: document.querySelector("#week-spent-value"),
  monthSpentValue: document.querySelector("#month-spent-value"),
  weekIncomeHint: document.querySelector("#week-income-hint"),
  monthIncomeHint: document.querySelector("#month-income-hint"),
  entryCountValue: document.querySelector("#entry-count-value"),
  lastEntryHint: document.querySelector("#last-entry-hint"),
  storageStatus: document.querySelector("#storage-status"),
  historyItemTemplate: document.querySelector("#history-item-template"),
  recurringItemTemplate: document.querySelector("#recurring-item-template")
};

bootstrap();

function bootstrap() {
  hydrateState();
  setDefaultFieldValues();
  bindEvents();
  render();
  registerServiceWorker();
}

function hydrateState() {
  const persistedData = loadData();
  state.entries = persistedData.entries;
  state.recurringItems = persistedData.recurringItems;
}

function bindEvents() {
  elements.pageTabs.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  elements.goOverview.addEventListener("click", () => setView("overview"));
  elements.installApp.addEventListener("click", () => {
    if (typeof elements.installDialog.showModal === "function") {
      elements.installDialog.showModal();
    } else {
      window.alert("Open this site in Safari on your iPhone, tap Share, then choose Add to Home Screen.");
    }
  });

  Object.values(forms).forEach((form) => {
    form.element.addEventListener("submit", (event) => handleEntrySubmit(event, form));
  });

  Object.values(recurringForms).forEach((form) => {
    form.element.addEventListener("submit", (event) => handleRecurringSubmit(event, form));
  });

  elements.resetButtons.forEach((button) => {
    button.addEventListener("click", () => resetNamedForm(button.dataset.resetForm));
  });

  elements.filter.addEventListener("change", (event) => {
    state.filter = event.target.value;
    renderHistory(getAllEntries());
  });

  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderHistory(getAllEntries());
  });

  elements.periodWeekly.addEventListener("click", () => setTrendPeriod("weekly"));
  elements.periodMonthly.addEventListener("click", () => setTrendPeriod("monthly"));
}

function handleEntrySubmit(event, form) {
  event.preventDefault();

  const title = form.title.value.trim();
  const amount = Number(form.amount.value);
  const category = form.category.value;
  const notes = form.notes.value.trim();
  const date = form.date.value;
  const time = form.time.value;

  if (!title || !Number.isFinite(amount) || amount <= 0 || !date || !time) {
    return;
  }

  state.entries.unshift({
    id: createId("entry"),
    kind: form.kind,
    title,
    amount,
    category,
    notes,
    createdAt: new Date(`${date}T${time}`).toISOString()
  });

  saveData();
  resetNamedForm(form.kind);
  setView("overview");
  render();
}

function handleRecurringSubmit(event, form) {
  event.preventDefault();

  const title = form.title.value.trim();
  const amount = Number(form.amount.value);
  const category = form.category.value;
  const notes = form.notes.value.trim();
  const frequency = form.frequency.value;
  const startDate = form.startDate.value;

  if (!title || !Number.isFinite(amount) || amount <= 0 || !startDate) {
    return;
  }

  state.recurringItems.unshift({
    id: createId("recurring"),
    kind: form.kind,
    title,
    amount,
    category,
    notes,
    frequency,
    startDate
  });

  saveData();
  resetNamedForm(`${form.kind}-recurring`);
  setView("overview");
  render();
}

function resetNamedForm(name) {
  const form = forms[name];
  if (form) {
    form.element.reset();
    populateCategorySelect(form.category, form.kind);
    setDefaultDateTime(form.date, form.time);
    form.title.focus();
    return;
  }

  const recurringForm = recurringForms[name];
  if (recurringForm) {
    recurringForm.element.reset();
    populateCategorySelect(recurringForm.category, recurringForm.kind);
    recurringForm.frequency.value = "monthly";
    recurringForm.startDate.value = formatDateInput(new Date());
    recurringForm.title.focus();
  }
}

function setDefaultFieldValues() {
  Object.values(forms).forEach((form) => {
    populateCategorySelect(form.category, form.kind);
    setDefaultDateTime(form.date, form.time);
  });

  Object.values(recurringForms).forEach((form) => {
    populateCategorySelect(form.category, form.kind);
    form.frequency.value = "monthly";
    form.startDate.value = formatDateInput(new Date());
  });
}

function populateCategorySelect(select, kind) {
  select.innerHTML = "";
  categories[kind].forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function setDefaultDateTime(dateField, timeField) {
  const now = new Date();
  dateField.value = formatDateInput(now);
  timeField.value = formatTimeInput(now);
}

function setView(view) {
  state.view = view;

  elements.pageTabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });

  Object.entries(elements.views).forEach(([name, element]) => {
    element.classList.toggle("is-active", name === view);
  });
}

function setTrendPeriod(period) {
  state.trendPeriod = period;
  renderTrend(getAllEntries());
}

function render() {
  const derivedEntries = getAllEntries();
  renderSummary(derivedEntries);
  renderTrend(derivedEntries);
  renderRecurring();
  renderHistory(derivedEntries);
  elements.storageStatus.textContent = "Saved locally on this device";
}

function renderSummary(entries) {
  const sortedEntries = getSortedEntries(entries);
  const now = new Date();
  const weekRange = getWeekRange(now);
  const monthRange = getMonthRange(now);

  const balance = sumAmount(entries, "income") - sumAmount(entries, "expense");
  const weekSpent = sumAmount(inRangeEntries(entries, weekRange), "expense");
  const monthSpent = sumAmount(inRangeEntries(entries, monthRange), "expense");
  const weekIncome = sumAmount(inRangeEntries(entries, weekRange), "income");
  const monthIncome = sumAmount(inRangeEntries(entries, monthRange), "income");

  elements.balanceValue.textContent = formatCurrency(balance);
  elements.weekSpentValue.textContent = formatCurrency(weekSpent);
  elements.monthSpentValue.textContent = formatCurrency(monthSpent);
  elements.weekIncomeHint.textContent = `Income this week: ${formatCurrency(weekIncome)}`;
  elements.monthIncomeHint.textContent = `Income this month: ${formatCurrency(monthIncome)}`;
  elements.entryCountValue.textContent = String(entries.length);
  elements.lastEntryHint.textContent = sortedEntries.length
    ? `Latest: ${sortedEntries[0].title} on ${formatShortDateTime(sortedEntries[0].createdAt)}`
    : "No entries yet";
}

function renderTrend(entries) {
  const points = state.trendPeriod === "weekly" ? getWeeklyTrend(entries) : getMonthlyTrend(entries);
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

function renderRecurring() {
  const items = getSortedRecurringItems();
  elements.recurringList.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No recurring items yet. Add a recurring salary, rent, or bill from the spending or revenue page.";
    elements.recurringList.appendChild(empty);
    elements.recurringSummary.textContent = "No recurring items yet";
    return;
  }

  const monthlyRecurringExpense = getProjectedMonthlyRecurringTotal("expense");
  const monthlyRecurringIncome = getProjectedMonthlyRecurringTotal("income");
  elements.recurringSummary.textContent = `Monthly recurring: ${formatCurrency(monthlyRecurringIncome)} in and ${formatCurrency(monthlyRecurringExpense)} out`;

  items.forEach((item) => {
    const fragment = elements.recurringItemTemplate.content.cloneNode(true);
    const article = fragment.querySelector(".recurring-item");
    article.dataset.kind = item.kind;

    fragment.querySelector(".recurring-title").textContent = item.title;
    fragment.querySelector(".recurring-amount").textContent = `${item.kind === "income" ? "+" : "-"}${formatCurrency(item.amount)}`;
    fragment.querySelector(".recurring-meta").textContent = `${frequencyLabels[item.frequency]} starting ${formatShortDate(item.startDate)} - next due ${formatShortDate(getNextOccurrenceDate(item).toISOString())}`;
    fragment.querySelector(".recurring-notes").textContent = item.notes || "No notes";

    fragment.querySelector(".delete-button").addEventListener("click", () => {
      state.recurringItems = state.recurringItems.filter((currentItem) => currentItem.id !== item.id);
      saveData();
      render();
    });

    elements.recurringList.appendChild(fragment);
  });
}

function renderHistory(entries) {
  const visibleEntries = getVisibleEntries(entries);
  elements.historyList.innerHTML = "";

  if (!visibleEntries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = entries.length
      ? "No entries match your current search or filter."
      : "No entries yet. Add your first spending or earning from the other pages.";
    elements.historyList.appendChild(empty);
    return;
  }

  visibleEntries.forEach((entry) => {
    const fragment = elements.historyItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".history-item");
    item.dataset.kind = entry.kind;
    item.dataset.source = entry.source;

    fragment.querySelector(".history-title").textContent = entry.title;
    fragment.querySelector(".history-amount").textContent = `${entry.kind === "income" ? "+" : "-"}${formatCurrency(entry.amount)}`;

    const sourceLabel = entry.source === "recurring" ? "Recurring" : "Manual";
    fragment.querySelector(".history-meta").textContent = `${entry.category} - ${sourceLabel} - ${formatLongDateTime(entry.createdAt)}`;
    fragment.querySelector(".history-notes").textContent = entry.notes || "No notes";

    const deleteButton = fragment.querySelector(".delete-button");
    if (entry.source === "recurring") {
      deleteButton.textContent = "Delete Rule";
      deleteButton.addEventListener("click", () => {
        state.recurringItems = state.recurringItems.filter((itemRule) => itemRule.id !== entry.scheduleId);
        saveData();
        render();
      });
    } else {
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        state.entries = state.entries.filter((currentEntry) => currentEntry.id !== entry.id);
        saveData();
        render();
      });
    }

    elements.historyList.appendChild(fragment);
  });
}

function getAllEntries() {
  return [
    ...state.entries.map((entry) => ({ ...entry, source: "manual" })),
    ...expandRecurringItems(state.recurringItems)
  ];
}

function getVisibleEntries(entries) {
  const normalizedSearch = state.search.toLowerCase();

  return getSortedEntries(entries).filter((entry) => {
    const matchesFilter = state.filter === "all" || entry.kind === state.filter;
    const haystack = [entry.title, entry.category, entry.notes].join(" ").toLowerCase();
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });
}

function getSortedEntries(entries) {
  return [...entries].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function getSortedRecurringItems() {
  return [...state.recurringItems].sort((left, right) => {
    return new Date(right.startDate) - new Date(left.startDate);
  });
}

function expandRecurringItems(items) {
  const now = new Date();
  const expanded = [];

  items.forEach((item) => {
    const occurrences = getOccurrenceDates(item, now);
    occurrences.forEach((date) => {
      expanded.push({
        id: `${item.id}-${date.toISOString()}`,
        scheduleId: item.id,
        kind: item.kind,
        title: item.title,
        amount: item.amount,
        category: item.category,
        notes: item.notes,
        createdAt: date.toISOString(),
        source: "recurring"
      });
    });
  });

  return expanded;
}

function getOccurrenceDates(item, untilDate) {
  const dates = [];
  let cursor = parseStartDate(item.startDate);
  const end = new Date(untilDate);

  if (cursor > end) {
    return dates;
  }

  while (cursor <= end && dates.length < 240) {
    dates.push(new Date(cursor));
    cursor = addFrequency(cursor, item.frequency);
  }

  return dates;
}

function getNextOccurrenceDate(item) {
  const now = startOfDay(new Date());
  let cursor = parseStartDate(item.startDate);
  let guard = 0;

  while (cursor < now && guard < 240) {
    cursor = addFrequency(cursor, item.frequency);
    guard += 1;
  }

  return cursor;
}

function getProjectedMonthlyRecurringTotal(kind) {
  return state.recurringItems
    .filter((item) => item.kind === kind)
    .reduce((total, item) => total + projectMonthlyAmount(item), 0);
}

function projectMonthlyAmount(item) {
  switch (item.frequency) {
    case "weekly":
      return item.amount * 52 / 12;
    case "biweekly":
      return item.amount * 26 / 12;
    case "monthly":
    default:
      return item.amount;
  }
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

function addFrequency(date, frequency) {
  const next = new Date(date);

  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      return next;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      return next;
    case "monthly":
    default:
      next.setMonth(next.getMonth() + 1);
      return next;
  }
}

function parseStartDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function startOfDay(date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
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

function formatShortDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function createId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadData() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        entries: Array.isArray(parsed.entries) ? parsed.entries.filter(isValidEntry) : [],
        recurringItems: Array.isArray(parsed.recurringItems) ? parsed.recurringItems.filter(isValidRecurringItem) : []
      };
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_ENTRY_KEY);
    const legacyEntries = legacyRaw ? JSON.parse(legacyRaw) : [];
    return {
      entries: Array.isArray(legacyEntries) ? legacyEntries.filter(isValidEntry) : [],
      recurringItems: []
    };
  } catch (error) {
    console.error("Failed to load data", error);
    return { entries: [], recurringItems: [] };
  }
}

function saveData() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    entries: state.entries,
    recurringItems: state.recurringItems
  }));
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

function isValidRecurringItem(item) {
  return item
    && typeof item.id === "string"
    && (item.kind === "expense" || item.kind === "income")
    && typeof item.title === "string"
    && Number.isFinite(Number(item.amount))
    && typeof item.category === "string"
    && typeof item.notes === "string"
    && typeof item.startDate === "string"
    && Object.prototype.hasOwnProperty.call(frequencyLabels, item.frequency);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }
}
