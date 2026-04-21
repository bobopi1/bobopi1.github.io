import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

window.__budgetflowReady = false;

const STORAGE_KEY = "budgetflow-web-data-v2";
const LEGACY_ENTRY_KEY = "budgetflow-web-entries-v1";
const LEGACY_IMPORT_PREFIX = "budgetflow-supabase-imported";

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
  filter: "all",
  search: "",
  overviewStartDate: "",
  overviewEndDate: "",
  supabase: null,
  user: null,
  configReady: false
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
  authShell: document.querySelector("#auth-shell"),
  userShell: document.querySelector("#user-shell"),
  configBanner: document.querySelector("#config-banner"),
  authForm: document.querySelector("#auth-form"),
  authEmail: document.querySelector("#auth-email"),
  authPassword: document.querySelector("#auth-password"),
  authStatus: document.querySelector("#auth-status"),
  signUpButton: document.querySelector("#sign-up-button"),
  signOutButtons: [
    document.querySelector("#sign-out-button"),
    document.querySelector("#overview-sign-out-button")
  ].filter(Boolean),
  userEmail: document.querySelector("#user-email"),
  syncStatus: document.querySelector("#sync-status"),
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
  overviewStartDate: document.querySelector("#overview-start-date"),
  overviewEndDate: document.querySelector("#overview-end-date"),
  clearOverviewDates: document.querySelector("#clear-overview-dates"),
  overviewFilterHint: document.querySelector("#overview-filter-hint"),
  historyList: document.querySelector("#history-list"),
  recurringList: document.querySelector("#recurring-list"),
  recurringSummary: document.querySelector("#recurring-summary"),
  trendChart: document.querySelector("#trend-chart"),
  chartIncomeTotal: document.querySelector("#chart-income-total"),
  chartExpenseTotal: document.querySelector("#chart-expense-total"),
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

bootstrap().catch((error) => {
  console.error("Startup failed", error);
  setSyncStatus("Startup failed. Check your config and try again.");
});

async function bootstrap() {
  setDefaultFieldValues();
  bindEvents();
  state.configReady = initializeSupabase();
  window.__budgetflowReady = true;
  renderShell();

  if (!state.configReady) {
    setSyncStatus("Supabase config missing");
    registerServiceWorker();
    return;
  }

  const {
    data: { session }
  } = await state.supabase.auth.getSession();

  await handleSessionChange(session);

  state.supabase.auth.onAuthStateChange(async (_event, sessionData) => {
    await handleSessionChange(sessionData);
  });

  registerServiceWorker();
}

function initializeSupabase() {
  const url = window.BUDGETFLOW_SUPABASE_URL;
  const key = window.BUDGETFLOW_SUPABASE_KEY;

  if (!url || !key || url.includes("YOUR_") || key.includes("YOUR_")) {
    elements.configBanner.classList.remove("hidden");
    return false;
  }

  state.supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  elements.configBanner.classList.add("hidden");
  return true;
}

function bindEvents() {
  elements.pageTabs.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  elements.goOverview.addEventListener("click", () => {
    if (state.user) {
      setView("overview");
    } else {
      elements.authEmail.focus();
    }
  });

  elements.installApp.addEventListener("click", () => {
    if (typeof elements.installDialog.showModal === "function") {
      elements.installDialog.showModal();
    } else {
      window.alert("Open this site in Safari on your iPhone, tap Share, then choose Add to Home Screen.");
    }
  });

  elements.authForm.addEventListener("submit", handleSignIn);
  elements.signUpButton.addEventListener("click", handleSignUp);
  elements.signOutButtons.forEach((button) => {
    button.addEventListener("click", handleSignOut);
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
    renderHistory(getOverviewEntries());
  });

  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderHistory(getOverviewEntries());
  });

  elements.overviewStartDate.addEventListener("change", (event) => {
    state.overviewStartDate = event.target.value;
    if (state.overviewEndDate && state.overviewStartDate && state.overviewStartDate > state.overviewEndDate) {
      state.overviewEndDate = state.overviewStartDate;
      elements.overviewEndDate.value = state.overviewEndDate;
    }
    render();
  });

  elements.overviewEndDate.addEventListener("change", (event) => {
    state.overviewEndDate = event.target.value;
    if (state.overviewStartDate && state.overviewEndDate && state.overviewEndDate < state.overviewStartDate) {
      state.overviewStartDate = state.overviewEndDate;
      elements.overviewStartDate.value = state.overviewStartDate;
    }
    render();
  });

  elements.clearOverviewDates.addEventListener("click", () => {
    state.overviewStartDate = "";
    state.overviewEndDate = "";
    elements.overviewStartDate.value = "";
    elements.overviewEndDate.value = "";
    render();
  });
}

async function handleSessionChange(session) {
  state.user = session?.user ?? null;
  renderShell();

  if (!state.user) {
    state.entries = [];
    state.recurringItems = [];
    render();
    setSyncStatus(state.configReady ? "Sign in to load your data" : "Supabase config missing");
    return;
  }

  elements.userEmail.textContent = state.user.email ?? "Signed in";
  setSyncStatus("Loading your data...");
  await refreshRemoteData(true);
}

async function handleSignIn(event) {
  event.preventDefault();

  if (!state.configReady) {
    return;
  }

  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;

  if (!email || !password) {
    setSyncStatus("Enter your email and password first.");
    return;
  }

  setSyncStatus("Signing in...");

  const { error } = await state.supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setSyncStatus(error.message);
  }
}

async function handleSignUp() {
  if (!state.configReady) {
    return;
  }

  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;

  if (!email || !password) {
    setSyncStatus("Enter an email and password to create an account.");
    return;
  }

  setSyncStatus("Creating account...");

  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { data, error } = await state.supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo
    }
  });

  if (error) {
    setSyncStatus(error.message);
    return;
  }

  if (!data.session) {
    setSyncStatus("Account created. Check your email to confirm, then sign in.");
  }
}

async function handleSignOut() {
  if (!state.supabase) {
    return;
  }

  setSyncStatus("Signing out...");
  const { error } = await state.supabase.auth.signOut();
  if (error) {
    setSyncStatus(error.message);
  }
}

async function refreshRemoteData(allowLegacyImport = false) {
  if (!state.user || !state.supabase) {
    return;
  }

  const entriesResult = await state.supabase
    .from("budget_entries")
    .select("*")
    .order("occurred_at", { ascending: false });

  const recurringResult = await state.supabase
    .from("recurring_items")
    .select("*")
    .order("start_date", { ascending: false });

  if (entriesResult.error || recurringResult.error) {
    setSyncStatus(entriesResult.error?.message || recurringResult.error?.message || "Could not load your data.");
    return;
  }

  state.entries = entriesResult.data.map(normalizeEntryRow);
  state.recurringItems = recurringResult.data.map(normalizeRecurringRow);

  if (
    allowLegacyImport &&
    state.entries.length === 0 &&
    state.recurringItems.length === 0 &&
    shouldImportLegacyData(state.user.id)
  ) {
    const imported = await importLegacyLocalData();
    if (imported) {
      await refreshRemoteData(false);
      setSyncStatus("Imported your existing local data into synced storage.");
      return;
    }
  }

  render();
  setSyncStatus("Synced");
}

async function importLegacyLocalData() {
  const legacyData = loadLegacyLocalData();

  if (!legacyData.entries.length && !legacyData.recurringItems.length) {
    markLegacyImported(state.user.id);
    return false;
  }

  if (legacyData.entries.length) {
    const { error } = await state.supabase.from("budget_entries").insert(
      legacyData.entries.map((entry) => ({
        user_id: state.user.id,
        kind: entry.kind,
        title: entry.title,
        amount: entry.amount,
        category: entry.category,
        notes: entry.notes,
        occurred_at: entry.createdAt
      }))
    );

    if (error) {
      setSyncStatus(`Import failed: ${error.message}`);
      return false;
    }
  }

  if (legacyData.recurringItems.length) {
    const { error } = await state.supabase.from("recurring_items").insert(
      legacyData.recurringItems.map((item) => ({
        user_id: state.user.id,
        kind: item.kind,
        title: item.title,
        amount: item.amount,
        category: item.category,
        notes: item.notes,
        frequency: item.frequency,
        start_date: item.startDate
      }))
    );

    if (error) {
      setSyncStatus(`Recurring import failed: ${error.message}`);
      return false;
    }
  }

  markLegacyImported(state.user.id);
  return true;
}

async function handleEntrySubmit(event, form) {
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

  setSyncStatus("Saving entry...");

  const occurredAt = new Date(`${date}T${time}`).toISOString();
  const { error } = await state.supabase.from("budget_entries").insert({
    user_id: state.user.id,
    kind: form.kind,
    title,
    amount,
    category,
    notes,
    occurred_at: occurredAt
  });

  if (error) {
    setSyncStatus(error.message);
    return;
  }

  resetNamedForm(form.kind);
  setView("overview");
  await refreshRemoteData(false);
}

async function handleRecurringSubmit(event, form) {
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

  setSyncStatus("Saving recurring item...");

  const { error } = await state.supabase.from("recurring_items").insert({
    user_id: state.user.id,
    kind: form.kind,
    title,
    amount,
    category,
    notes,
    frequency,
    start_date: startDate
  });

  if (error) {
    setSyncStatus(error.message);
    return;
  }

  resetNamedForm(`${form.kind}-recurring`);
  setView("overview");
  await refreshRemoteData(false);
}

async function deleteEntry(id) {
  setSyncStatus("Deleting entry...");
  const { error } = await state.supabase.from("budget_entries").delete().eq("id", id);
  if (error) {
    setSyncStatus(error.message);
    return;
  }
  await refreshRemoteData(false);
}

async function deleteRecurringRule(id) {
  setSyncStatus("Deleting recurring rule...");
  const { error } = await state.supabase.from("recurring_items").delete().eq("id", id);
  if (error) {
    setSyncStatus(error.message);
    return;
  }
  await refreshRemoteData(false);
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

function renderShell() {
  const signedIn = Boolean(state.user);
  elements.authShell.classList.toggle("hidden", signedIn || !state.configReady);
  elements.userShell.classList.toggle("hidden", !signedIn);
  elements.configBanner.classList.toggle("hidden", state.configReady);
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

function render() {
  const derivedEntries = getAllEntries();
  const overviewEntries = getOverviewEntries(derivedEntries);
  renderSummary(overviewEntries, derivedEntries);
  renderTrend(overviewEntries);
  renderRecurring();
  renderHistory(overviewEntries);
  elements.storageStatus.textContent = "Stored in Supabase for this account";
}

function renderSummary(entries, allEntries) {
  const balance = sumAmount(entries, "income") - sumAmount(entries, "expense");
  const spendingTotal = sumAmount(entries, "expense");
  const incomeTotal = sumAmount(entries, "income");
  const lastEntry = getSortedEntries(allEntries)[0];

  elements.balanceValue.textContent = formatCurrency(balance);
  elements.weekSpentValue.textContent = formatCurrency(spendingTotal);
  elements.monthSpentValue.textContent = formatCurrency(incomeTotal);
  elements.weekIncomeHint.textContent = `Income in range: ${formatCurrency(incomeTotal)}`;
  elements.monthIncomeHint.textContent = `Spending in range: ${formatCurrency(spendingTotal)}`;
  elements.entryCountValue.textContent = String(entries.length);
  elements.lastEntryHint.textContent = getOverviewHint(entries, lastEntry);
  elements.overviewFilterHint.textContent = getOverviewFilterLabel(entries.length);
}

function renderTrend(entries) {
  elements.trendChart.innerHTML = "";
  const incomeTotal = sumAmount(entries, "income");
  const expenseTotal = sumAmount(entries, "expense");
  const total = incomeTotal + expenseTotal;

  elements.chartIncomeTotal.textContent = `Income: ${formatCurrency(incomeTotal)}`;
  elements.chartExpenseTotal.textContent = `Spending: ${formatCurrency(expenseTotal)}`;

  if (total <= 0) {
    const empty = document.createElement("p");
    empty.className = "chart-empty";
    empty.textContent = "Add a few entries in this date range to see the breakdown here.";
    elements.trendChart.appendChild(empty);
    return;
  }

  const pieShell = document.createElement("div");
  pieShell.className = "pie-chart-shell";

  const pie = document.createElement("div");
  pie.className = "pie-chart";
  pie.style.setProperty("--income-angle", `${(incomeTotal / total) * 360}deg`);
  pie.setAttribute("role", "img");
  pie.setAttribute("aria-label", `Income ${formatCurrency(incomeTotal)} and spending ${formatCurrency(expenseTotal)}`);

  const center = document.createElement("div");
  center.className = "pie-center";
  center.innerHTML = `<div><strong>${formatCurrency(incomeTotal - expenseTotal)}</strong><span>Net</span></div>`;
  pie.appendChild(center);

  const legend = document.createElement("div");
  legend.className = "pie-legend";
  legend.append(
    createLegendItem("income", "Earnings", incomeTotal, total),
    createLegendItem("expense", "Spending", expenseTotal, total)
  );

  pieShell.append(pie, legend);
  elements.trendChart.appendChild(pieShell);
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

    fragment.querySelector(".delete-button").addEventListener("click", async () => {
      await deleteRecurringRule(item.id);
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
      deleteButton.addEventListener("click", async () => {
        await deleteRecurringRule(entry.scheduleId);
      });
    } else {
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", async () => {
        await deleteEntry(entry.id);
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

function getOverviewEntries(entries = getAllEntries()) {
  return filterEntriesByDateRange(entries, getSelectedDateRange());
}

function getSortedEntries(entries) {
  return [...entries].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function getSortedRecurringItems() {
  return [...state.recurringItems].sort((left, right) => new Date(right.startDate) - new Date(left.startDate));
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

function sumAmount(entries, kind) {
  return entries
    .filter((entry) => entry.kind === kind)
    .reduce((total, entry) => total + Number(entry.amount), 0);
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

function normalizeEntryRow(row) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    notes: row.notes ?? "",
    createdAt: row.occurred_at
  };
}

function normalizeRecurringRow(row) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    notes: row.notes ?? "",
    frequency: row.frequency,
    startDate: row.start_date
  };
}

function loadLegacyLocalData() {
  try {
    const currentRaw = window.localStorage.getItem(STORAGE_KEY);
    const currentParsed = currentRaw ? JSON.parse(currentRaw) : null;
    const legacyRaw = window.localStorage.getItem(LEGACY_ENTRY_KEY);
    const legacyEntries = legacyRaw ? JSON.parse(legacyRaw) : [];

    return {
      entries: currentParsed?.entries?.filter(isValidEntry) || (Array.isArray(legacyEntries) ? legacyEntries.filter(isValidEntry) : []),
      recurringItems: currentParsed?.recurringItems?.filter(isValidRecurringItem) || []
    };
  } catch (error) {
    console.error("Failed to load legacy data", error);
    return { entries: [], recurringItems: [] };
  }
}

function shouldImportLegacyData(userId) {
  return !window.localStorage.getItem(`${LEGACY_IMPORT_PREFIX}-${userId}`);
}

function markLegacyImported(userId) {
  window.localStorage.setItem(`${LEGACY_IMPORT_PREFIX}-${userId}`, "true");
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

function formatCurrency(amount) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
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

function getSelectedDateRange() {
  if (!state.overviewStartDate && !state.overviewEndDate) {
    return null;
  }

  const start = state.overviewStartDate ? parseDateOnly(state.overviewStartDate) : null;
  const end = state.overviewEndDate ? parseDateOnly(state.overviewEndDate) : null;

  return {
    start: start ? startOfDay(start) : null,
    end: end ? addDays(startOfDay(end), 1) : null
  };
}

function filterEntriesByDateRange(entries, range) {
  if (!range) {
    return entries;
  }

  return entries.filter((entry) => {
    const timestamp = new Date(entry.createdAt);
    const afterStart = !range.start || timestamp >= range.start;
    const beforeEnd = !range.end || timestamp < range.end;
    return afterStart && beforeEnd;
  });
}

function getOverviewFilterLabel(entryCount) {
  if (!state.overviewStartDate && !state.overviewEndDate) {
    return "Showing all tracked dates";
  }

  const fromLabel = state.overviewStartDate ? formatShortDate(state.overviewStartDate) : "the beginning";
  const toLabel = state.overviewEndDate ? formatShortDate(state.overviewEndDate) : "today";
  return `Showing ${entryCount} item${entryCount === 1 ? "" : "s"} from ${fromLabel} to ${toLabel}`;
}

function getOverviewHint(filteredEntries, latestOverallEntry) {
  if (filteredEntries.length) {
    return `Latest in range: ${filteredEntries[0].title} on ${formatShortDateTime(filteredEntries[0].createdAt)}`;
  }

  if (state.overviewStartDate || state.overviewEndDate) {
    return latestOverallEntry
      ? `No entries in this range. Latest overall: ${latestOverallEntry.title} on ${formatShortDateTime(latestOverallEntry.createdAt)}`
      : "No entries yet";
  }

  return "No entries yet";
}

function createLegendItem(kind, label, amount, total) {
  const item = document.createElement("div");
  item.className = "pie-legend-item";

  const copy = document.createElement("div");
  copy.className = "pie-legend-copy";

  const dot = document.createElement("span");
  dot.className = `pie-dot ${kind}-dot`;

  const text = document.createElement("span");
  text.textContent = label;

  const value = document.createElement("span");
  value.className = "pie-legend-value";
  value.textContent = `${formatCurrency(amount)} (${formatPercent(total ? amount / total : 0)})`;

  copy.append(dot, text);
  item.append(copy, value);
  return item;
}

function parseDateOnly(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatPercent(value) {
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function setSyncStatus(message) {
  if (elements.syncStatus) {
    elements.syncStatus.textContent = message;
  }

  if (elements.authStatus) {
    elements.authStatus.textContent = message;
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }
}
