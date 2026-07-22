(function () {
  const commerce = window.LatelierCommerce;
  const ui = window.LatelierUI;
  const params = new URLSearchParams(window.location.search);

  const state = {
    topTypeKeys: new Set(),
    subtypeKeys: new Set(),
    category: params.get("category") || "",
    searchQuery: String(params.get("q") || params.get("query") || params.get("search") || "").trim(),
    saleOnly: ["sale", "promotions", "promotion", "1", "true"].includes(normalizeText(params.get("promotion") || params.get("sale"))),
    maxPrice: 0,
    dimensions: new Set(),
    colors: new Set(),
    toiletTypes: new Set(),
    showAllCategories: false,
    filterPanelOpen: false
  };

  const TOP_CATEGORY_ALIASES = {
    "meubles-de-salle-de-bain": ["meubles-de-salle-de-bain", "vanite", "vanites", "vanity"],
    lavabos: ["lavabo", "lavabos"],
    baignoires: ["baignoire", "baignoires"],
    douches: ["douche", "douches"],
    toilettes: ["toilette", "toilettes"]
  };

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeTopCategoryKey(value) {
    const slug = ui.slugifyTaxonomyValue(value);
    for (const [canonical, aliases] of Object.entries(TOP_CATEGORY_ALIASES)) {
      if (canonical === slug || aliases.some((alias) => ui.slugifyTaxonomyValue(alias) === slug)) {
        return canonical;
      }
    }
    return slug;
  }

  function isTopCategoryMatch(actualValue, expectedValue) {
    return normalizeTopCategoryKey(actualValue) === normalizeTopCategoryKey(expectedValue);
  }

  function findTopGroup(taxonomy, value) {
    const target = normalizeTopCategoryKey(value);
    return taxonomy.find((group) => isTopCategoryMatch(group.key, target) || isTopCategoryMatch(group.label, target)) || null;
  }

  function getTaxonomy() {
    return ui.buildProductTaxonomy(getVisibleProducts());
  }

  function isSaleProduct(product) {
    return Boolean(product?.compareAtPrice || (product?.variants || []).some((variant) => Boolean(variant?.compareAtPrice)));
  }

  function getVisibleProducts() {
    return commerce.getProducts({ query: state.searchQuery }).filter((product) => !state.saleOnly || isSaleProduct(product));
  }

  function getTaxonomyLookup(taxonomy) {
    const topByKey = new Map();
    const subtypeByKey = new Map();

    for (const group of taxonomy) {
      topByKey.set(group.key, group);
      for (const subtype of group.subtypes) {
        subtypeByKey.set(`${group.key}::${subtype.key}`, { group, subtype });
      }
    }

    return { topByKey, subtypeByKey };
  }

  function getRequestedTopKeys(taxonomy) {
    const collectionToTopKey = {
      vanites: "meubles-de-salle-de-bain",
      douches: "douches",
      baignoires: "baignoires",
      toilettes: "toilettes"
    };

    const requested = params.getAll("type")
      .map((value) => normalizeTopCategoryKey(value))
      .filter(Boolean);

    const fallbackCollectionKey = normalizeTopCategoryKey(collectionToTopKey[normalizeText(params.get("collection"))] || "");
    const allKeys = taxonomy.map((group) => group.key);
    const initial = requested.length ? requested : (fallbackCollectionKey ? [fallbackCollectionKey] : allKeys);
    const resolved = initial
      .map((key) => findTopGroup(taxonomy, key)?.key || key)
      .filter((key) => allKeys.some((groupKey) => isTopCategoryMatch(groupKey, key)));
    return resolved.length ? resolved : allKeys;
  }

  function setSelectedTopTypeKeys(keys, { syncUrl = true } = {}) {
    const nextKeys = keys.filter(Boolean);
    state.topTypeKeys = new Set(nextKeys);
    state.subtypeKeys = new Set();

    if (syncUrl) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("type");
      nextUrl.searchParams.delete("category");
      if (state.saleOnly) {
        nextUrl.searchParams.set("promotion", "sale");
      } else {
        nextUrl.searchParams.delete("promotion");
        nextUrl.searchParams.delete("sale");
      }
      if (state.searchQuery) {
        nextUrl.searchParams.set("q", state.searchQuery);
      } else {
        nextUrl.searchParams.delete("q");
        nextUrl.searchParams.delete("query");
        nextUrl.searchParams.delete("search");
      }
      nextKeys.forEach((key) => nextUrl.searchParams.append("type", key));
      window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    }
  }

  function setSelectedSubtypeKeys(keys) {
    state.subtypeKeys = new Set(keys.filter(Boolean));
  }

  function resetAllFilters({ syncUrl = true, clearSale = true } = {}) {
    state.topTypeKeys = new Set();
    state.subtypeKeys = new Set();
    state.dimensions = new Set();
    state.colors = new Set();
    state.toiletTypes = new Set();
    state.category = "";
    if (clearSale) {
      state.saleOnly = false;
    }
    const price = document.querySelector("[data-filter-price]");
    const priceValue = document.querySelector("[data-filter-price-value]");
    const resetPrice = Number(price?.max || 5000);
    state.maxPrice = resetPrice;
    if (price) price.value = String(resetPrice);
    if (priceValue) priceValue.textContent = `${resetPrice}$`;

    if (syncUrl) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("type");
      nextUrl.searchParams.delete("category");
      nextUrl.searchParams.delete("collection");
      if (clearSale) {
        nextUrl.searchParams.delete("promotion");
        nextUrl.searchParams.delete("sale");
      } else if (!state.saleOnly) {
        nextUrl.searchParams.delete("promotion");
        nextUrl.searchParams.delete("sale");
      } else {
        nextUrl.searchParams.set("promotion", "sale");
      }
      if (state.searchQuery) {
        nextUrl.searchParams.set("q", state.searchQuery);
      } else {
        nextUrl.searchParams.delete("q");
        nextUrl.searchParams.delete("query");
        nextUrl.searchParams.delete("search");
      }
      window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    }
  }

  function hydrateStateFromTaxonomy(taxonomy) {
    const { subtypeByKey } = getTaxonomyLookup(taxonomy);
    const requestedTopKeys = getRequestedTopKeys(taxonomy);
    setSelectedTopTypeKeys(requestedTopKeys, { syncUrl: false });

    const requestedSubtypeKey = ui.slugifyTaxonomyValue(params.get("category"));
    if (requestedSubtypeKey) {
      for (const group of taxonomy) {
        const matchingSubtype = group.subtypes.find((subtype) => subtype.key === requestedSubtypeKey);
        if (matchingSubtype) {
          setSelectedSubtypeKeys([`${group.key}::${matchingSubtype.key}`]);
          if (!state.topTypeKeys.has(group.key)) {
            state.topTypeKeys = new Set([group.key]);
          }
          break;
        }
      }
    } else if (subtypeByKey.size === 0) {
      setSelectedSubtypeKeys([]);
    }
  }

  function getSelectedTopGroups(taxonomy) {
    if (!state.topTypeKeys.size) return taxonomy;
    return taxonomy.filter((group) => [...state.topTypeKeys].some((key) => isTopCategoryMatch(group.key, key)));
  }

  function getSelectedTopKey() {
    return state.topTypeKeys.size === 1 ? [...state.topTypeKeys][0] : "";
  }

  function getSelectedSubtypeKey() {
    return state.subtypeKeys.size === 1 ? [...state.subtypeKeys][0] : "";
  }

  function getProductTopKey(product) {
    return ui.slugifyTaxonomyValue(ui.getProductTopTypeLabel(product) || product?.productType || "");
  }

  function getProductSubtypeKey(product) {
    return ui.slugifyTaxonomyValue(product?.subtype || product?.metafields?.productType || ui.getProductSubtypeLabel(product) || "");
  }

  function getCurrentProducts(taxonomy) {
    const selectedTopKeys = state.topTypeKeys.size ? [...state.topTypeKeys] : taxonomy.map((group) => group.key);
    return getVisibleProducts().filter((product) => selectedTopKeys.some((key) => isTopCategoryMatch(getProductTopKey(product), key)));
  }

  function productMatchesSubtypeSelection(product) {
    if (!state.subtypeKeys.size) return true;
    const productKey = `${getProductTopKey(product)}::${getProductSubtypeKey(product)}`;
    return state.subtypeKeys.has(productKey);
  }

  function getSubtypeFilterGroups(taxonomy) {
    const selectedGroups = getSelectedTopGroups(taxonomy);
    return selectedGroups.map((group) => ({
      ...group,
      subtypes: group.subtypes.filter((subtype) => subtype.count > 0)
    })).filter((group) => group.subtypes.length > 0);
  }

  function createCheckboxGroup(label, values, kind, selectedSet) {
    if (!values.length) return "";

    return `
      <div class="filter-group">
        <span class="filter-label">${escapeHtml(label)}</span>
        <div class="checkbox-list">
          ${values.map((item) => {
            const value = typeof item === "object" ? item.value : item;
            const display = typeof item === "object" ? item.label : item;
            return `
            <label class="checkbox-item">
              <input type="checkbox" value="${escapeHtml(value)}" data-filter-kind="${escapeHtml(kind)}" ${selectedSet.has(value) ? "checked" : ""}>
              ${escapeHtml(display)}
            </label>
          `;}).join("")}
        </div>
      </div>
    `;
  }

  function renderCollectionFilters(taxonomy) {
    const target = document.querySelector("[data-collection-filters]");
    if (!target) return;

    const showingAll = state.topTypeKeys.size === 0 && state.subtypeKeys.size === 0;
    const promotionCount = getVisibleProducts().filter((product) => isSaleProduct(product)).length;
    const promotionsActive = state.saleOnly;
    const topItems = taxonomy.map((group) => {
      const key = group.key;
      const label = group.label;
      const count = group.count || 0;
      const checked = [...state.topTypeKeys].some((value) => isTopCategoryMatch(value, key));
      return `
        <label class="collection-filter ${checked ? "is-active" : ""}">
          <input type="checkbox" value="${escapeHtml(key)}" data-collection-filter ${checked ? "checked" : ""}>
          <span class="collection-filter__label">${escapeHtml(label)}</span>
          <span class="collection-filter__count">${count}</span>
        </label>
      `;
    }).join("");

    const viewAllToggle = `
      <button class="collection-more-toggle" type="button" data-collection-more-toggle aria-expanded="${state.showAllCategories ? "true" : "false"}" aria-controls="collection-more-panel">
        ${state.showAllCategories ? "Masquer toutes les catégories" : "Voir toutes les catégories"}
      </button>
    `;

    const allCategoriesPanel = state.showAllCategories ? `
      <div class="collection-more is-open" data-collection-more id="collection-more-panel">
        ${taxonomy.map((group) => `
          <div class="collection-more__section">
            <h3><a href="${escapeHtml(group.href)}">${escapeHtml(group.label)}</a></h3>
            <div class="collection-more__links">
              ${group.subtypes.map((subtype) => `<a href="${escapeHtml(subtype.href)}">${escapeHtml(subtype.label)}</a>`).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    ` : "";

    target.innerHTML = `
      <a class="collection-filter collection-filter--promo ${promotionsActive ? "is-active" : ""}" href="shop.html?promotion=sale">
        <span class="collection-filter__spacer" aria-hidden="true"></span>
        <span class="collection-filter__label">Promotions</span>
        <span class="collection-filter__count">${promotionCount}</span>
      </a>
      <button class="collection-filter collection-filter--button ${showingAll ? "is-active" : ""}" type="button" data-collection-reset>
        <span class="collection-filter__label">Toutes les catégories</span>
        <span class="collection-filter__count">${taxonomy.reduce((sum, group) => sum + group.count, 0)}</span>
      </button>
      ${topItems}
      ${viewAllToggle}
      ${allCategoriesPanel}
    `;
  }

  function ensureFilterPanel() {
    const filters = document.querySelector(".filters");
    const filterBlock = document.querySelector(".filter-block");
    if (!filters || !filterBlock || filterBlock.querySelector("[data-filter-toggle]")) return;

    const heading = filterBlock.querySelector("h2");
    const collectionList = filters.querySelector("[data-collection-filters]");
    const filterGroups = filterBlock.querySelector("[data-shop-filter-options]");
    const priceGroup = filterBlock.querySelector(".filter-group:last-of-type");
    if (!heading || !collectionList || !filterGroups || !priceGroup) return;

    const header = document.createElement("div");
    header.className = "filter-block__header";
    filterBlock.insertBefore(header, heading);
    header.appendChild(heading);

    const toggle = document.createElement("button");
    toggle.className = "filter-toggle";
    toggle.type = "button";
    toggle.setAttribute("data-filter-toggle", "");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Afficher les filtres");
    toggle.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z"></path>
      </svg>
      <span>Afficher les filtres</span>
    `;
    header.appendChild(toggle);

    const panel = document.createElement("div");
    panel.className = "filter-block__panel";
    panel.id = "shop-filter-panel";
    panel.setAttribute("data-filter-panel", "");
    panel.hidden = true;

    const panelBar = document.createElement("div");
    panelBar.className = "filter-block__panel-bar";

    const panelTitle = document.createElement("span");
    panelTitle.className = "filter-block__panel-title";
    panelTitle.textContent = "Filtres";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "filter-close";
    closeButton.setAttribute("data-filter-close", "");
    closeButton.setAttribute("aria-label", "Fermer les filtres");
    closeButton.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 5l14 14M19 5 5 19"></path>
      </svg>
    `;

    panelBar.appendChild(panelTitle);
    panelBar.appendChild(closeButton);

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "filter-backdrop";
    backdrop.setAttribute("data-filter-backdrop", "");
    backdrop.setAttribute("aria-label", "Fermer les filtres");
    backdrop.hidden = true;

    filterBlock.appendChild(backdrop);
    filterBlock.appendChild(panel);
    panel.appendChild(panelBar);

    const panelContent = document.createElement("div");
    panelContent.className = "filter-block__panel-content";
    panel.appendChild(panelContent);
    panelContent.appendChild(collectionList);
    panelContent.appendChild(filterGroups);
    panelContent.appendChild(priceGroup);
  }

  function setFilterPanelOpen(open) {
    state.filterPanelOpen = Boolean(open);
    const toggle = document.querySelector("[data-filter-toggle]");
    const panel = document.querySelector("[data-filter-panel]");
    const backdrop = document.querySelector("[data-filter-backdrop]");
    const closeButton = document.querySelector("[data-filter-close]");
    if (toggle) {
      toggle.setAttribute("aria-expanded", state.filterPanelOpen ? "true" : "false");
      toggle.setAttribute("aria-label", state.filterPanelOpen ? "Masquer les filtres" : "Afficher les filtres");
      toggle.innerHTML = state.filterPanelOpen
        ? `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 5l14 14M19 5 5 19"></path>
          </svg>
          <span>Masquer les filtres</span>
        `
        : `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z"></path>
          </svg>
          <span>Afficher les filtres</span>
        `;
    }
    if (panel) panel.hidden = !state.filterPanelOpen;
    if (backdrop) backdrop.hidden = !state.filterPanelOpen;
    if (closeButton) closeButton.hidden = !state.filterPanelOpen;
    document.body.classList.toggle("shop-filters-open", state.filterPanelOpen);
  }

  function renderDynamicFilters(taxonomy) {
    const target = document.querySelector("[data-shop-filter-options]");
    if (!target) return;

    const products = getCurrentProducts(taxonomy);
    const selectedGroups = getSelectedTopGroups(taxonomy);
    const sections = [];

    for (const group of selectedGroups) {
      const groupKind = normalizeTopCategoryKey(group.key);
      if (groupKind === "meubles-de-salle-de-bain") {
        const widths = [...new Set(products
          .filter((product) => getProductTopKey(product) === group.key)
          .map((product) => String(product?.metafields?.width || "").trim())
          .filter(Boolean))].sort((a, b) => Number(String(a).match(/\d+/)?.[0] || 0) - Number(String(b).match(/\d+/)?.[0] || 0));
        sections.push(createCheckboxGroup(group.label, widths, `dimension:${group.key}`, state.dimensions));
      } else if (groupKind === "douches") {
        const variants = products.filter((product) => getProductTopKey(product) === group.key).flatMap((product) => getAvailableVariants(product));
        const dimensionOptionName = findOptionName(products.filter((product) => getProductTopKey(product) === group.key), (name) => {
          const key = normalizeText(name);
          return key.includes("dimension") || key.includes("size") || key.includes("format");
        });
        const colorOptionName = findOptionName(products.filter((product) => getProductTopKey(product) === group.key), (name) => {
          const key = normalizeText(name);
          return key.includes("couleur") || key.includes("color");
        });
        const dimensions = [...new Set(variants.map((variant) => getVariantOptionValue(variant, dimensionOptionName)).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "fr-CA"));
        const colors = [...new Set(variants.map((variant) => getVariantOptionValue(variant, colorOptionName)).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "fr-CA"));
        sections.push(createCheckboxGroup(group.label, dimensions, `dimension:${group.key}`, state.dimensions));
        sections.push(createCheckboxGroup("Couleur", colors, `color:${group.key}`, state.colors));
      } else if (groupKind === "toilettes") {
        const variants = products.filter((product) => getProductTopKey(product) === group.key).flatMap((product) => getAvailableVariants(product));
        const toiletTypeOptionName = findOptionName(products.filter((product) => getProductTopKey(product) === group.key), (name) => {
          const key = normalizeText(name);
          return key.includes("type de toilette") || key === "type";
        });
        const toiletTypes = [...new Set(variants.map((variant) => getVariantOptionValue(variant, toiletTypeOptionName)).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "fr-CA"));
        sections.push(createCheckboxGroup(group.label, toiletTypes, `toilet-type:${group.key}`, state.toiletTypes));
      } else {
        const subtypeValues = group.subtypes.map((subtype) => `${group.key}::${subtype.key}`);
        const subtypeOptions = group.subtypes.map((subtype) => ({
          value: `${group.key}::${subtype.key}`,
          label: subtype.label
        }));
        if (subtypeOptions.length) {
          sections.push(createCheckboxGroup(group.label, subtypeOptions, `subtype:${group.key}`, state.subtypeKeys));
        }
      }
    }

    target.innerHTML = sections.filter(Boolean).join("");
  }

  function getAvailableVariants(product) {
    return (product?.variants || []).filter((variant) => variant?.availableForSale);
  }

  function findOptionName(products, matcher) {
    for (const product of products) {
      for (const option of (product?.options || [])) {
        if (matcher(option?.name)) return option.name;
      }
      for (const variant of getAvailableVariants(product)) {
        for (const option of (variant.selectedOptions || [])) {
          if (matcher(option?.name)) return option.name;
        }
      }
    }
    return "";
  }

  function getVariantOptionValue(variant, optionName) {
    if (!variant || !optionName) return "";
    const targetKey = normalizeText(optionName);
    const entry = (variant.selectedOptions || []).find((option) => normalizeText(option.name) === targetKey);
    return String(entry?.value || "").trim();
  }

  function getProductPriceValue(product) {
    return Number(product?.price?.amount || 0);
  }

  function getProductWidthValue(product) {
    const width = String(product?.metafields?.width || "").trim();
    if (width) return width;

    const dimensionRows = product?.metafields?.dimensions || [];
    for (const row of dimensionRows) {
      const value = Array.isArray(row) ? row[1] : row?.value;
      const text = String(value || "").trim();
      const match = text.match(/^\s*([0-9]+(?:\.[0-9]+)?)\s*["]?\s*(?:[x×]|$)/i);
      if (match?.[1]) {
        return `${match[1]}"`;
      }
    }

    return "";
  }

  function productMatchesOptions(product, taxonomy) {
    const topKey = getProductTopKey(product);
    const subtypeKey = getProductSubtypeKey(product);

    if (state.topTypeKeys.size && ![...state.topTypeKeys].some((key) => isTopCategoryMatch(topKey, key))) return false;
    if (state.subtypeKeys.size && ![...state.subtypeKeys].some((key) => {
      const [selectedTopKey, selectedSubtypeKey] = String(key || "").split("::");
      return isTopCategoryMatch(topKey, selectedTopKey) && selectedSubtypeKey === subtypeKey;
    })) return false;

    if (isTopCategoryMatch(topKey, "douches")) {
      const products = taxonomy.flatMap((group) => group.products).filter((item) => getProductTopKey(item) === topKey);
      const dimensionOptionName = findOptionName(products, (name) => {
        const key = normalizeText(name);
        return key.includes("dimension") || key.includes("size") || key.includes("format");
      });
      const colorOptionName = findOptionName(products, (name) => {
        const key = normalizeText(name);
        return key.includes("couleur") || key.includes("color");
      });
      const selectedDimensions = [...state.dimensions];
      const selectedColors = [...state.colors];
      return getAvailableVariants(product).some((variant) => {
        const dimensionValue = getVariantOptionValue(variant, dimensionOptionName);
        const colorValue = getVariantOptionValue(variant, colorOptionName);
        const dimensionOk = !selectedDimensions.length || selectedDimensions.includes(dimensionValue);
        const colorOk = !selectedColors.length || selectedColors.includes(colorValue);
        return dimensionOk && colorOk;
      });
    }

    if (isTopCategoryMatch(topKey, "toilettes")) {
      const products = taxonomy.flatMap((group) => group.products).filter((item) => getProductTopKey(item) === topKey);
      const toiletTypeOptionName = findOptionName(products, (name) => {
        const key = normalizeText(name);
        return key.includes("type de toilette") || key === "type";
      });
      const selectedToiletTypes = [...state.toiletTypes];
      return getAvailableVariants(product).some((variant) => {
        const toiletTypeValue = getVariantOptionValue(variant, toiletTypeOptionName);
        return !selectedToiletTypes.length || selectedToiletTypes.includes(toiletTypeValue);
      });
    }

    if (isTopCategoryMatch(topKey, "meubles-de-salle-de-bain")) {
      const selectedDimensions = [...state.dimensions];
      const productWidth = getProductWidthValue(product);
      return !selectedDimensions.length || selectedDimensions.includes(productWidth);
    }

    return true;
  }

  function renderProducts(taxonomy) {
    const target = document.querySelector("[data-product-grid]");
    if (!target) return;

    const products = getCurrentProducts(taxonomy)
      .filter((product) => getProductPriceValue(product) <= state.maxPrice)
      .filter((product) => productMatchesSubtypeSelection(product))
      .filter((product) => productMatchesOptions(product, taxonomy));

    target.innerHTML = products.length
      ? products.map(ui.createProductCard).join("")
      : '<div class="empty-state">Aucun produit ne correspond aux filtres sélectionnés.</div>';
  }

  function renderShopHeading(taxonomy) {
    const title = document.querySelector("[data-shop-title]");
    const intro = document.querySelector("[data-shop-intro]");
    if (!title || !intro) return;

    const lookup = getTaxonomyLookup(taxonomy);
    const singleTopKey = getSelectedTopKey();
    const singleSubtypeKey = getSelectedSubtypeKey();
    let label = state.saleOnly ? "Promotions" : "Tout magasiner";

    if (state.searchQuery) {
      label = `Recherche pour "${state.searchQuery}"`;
    } else if (state.saleOnly && !state.category && !singleSubtypeKey && !singleTopKey && state.topTypeKeys.size <= 1) {
      label = "Promotions";
    } else if (state.category) {
      const categoryKey = ui.slugifyTaxonomyValue(state.category);
      for (const group of taxonomy) {
        const subtype = group.subtypes.find((item) => item.key === categoryKey);
        if (subtype) {
          label = subtype.label;
          break;
        }
      }
    } else if (singleSubtypeKey) {
      const entry = lookup.subtypeByKey.get(`${singleTopKey}::${singleSubtypeKey}`);
      label = entry?.subtype.label || label;
    } else if (singleTopKey) {
      label = lookup.topByKey.get(singleTopKey)?.label || label;
    } else if (state.topTypeKeys.size > 1) {
      label = "Produits sélectionnés";
    }

    title.textContent = label;
    intro.textContent = state.searchQuery
      ? `Voici les produits qui correspondent à "${state.searchQuery}".`
      : state.category
      ? (state.saleOnly
        ? "Découvrez les produits en promotion filtrés pour cette catégorie."
        : "Découvrez les produits filtrés pour cette catégorie.")
      : (state.saleOnly
        ? "Découvrez notre sélection de produits en promotion pour créer une salle de bain élégante, fonctionnelle et adaptée à votre style."
        : "Découvrez notre sélection complète de produits pour créer une salle de bain élégante, fonctionnelle et adaptée à votre style.");
  }

  function bindFilters(taxonomy) {
    ensureFilterPanel();
    const collectionFilters = document.querySelector("[data-collection-filters]");
    const dynamicFilters = document.querySelector("[data-shop-filter-options]");
    const price = document.querySelector("[data-filter-price]");
    const priceValue = document.querySelector("[data-filter-price-value]");
    const filterToggle = document.querySelector("[data-filter-toggle]");
    const catalogMaxPrice = Math.max(0, ...getVisibleProducts().map(getProductPriceValue));
    const sliderMax = Math.max(5000, Math.ceil(catalogMaxPrice));

    state.maxPrice = sliderMax;

    if (price) {
      price.max = String(sliderMax);
      price.value = String(sliderMax);
    }
    if (priceValue) {
      priceValue.textContent = `${sliderMax}$`;
    }

    if (collectionFilters) {
      collectionFilters.addEventListener("change", (event) => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement)) return;

        if (input.matches("[data-collection-filter]")) {
          const selectedKeys = new Set(state.topTypeKeys);
          if (input.checked) selectedKeys.add(input.value);
          else selectedKeys.delete(input.value);
          setSelectedTopTypeKeys([...selectedKeys]);
        } else {
          return;
        }

        renderCollectionFilters(taxonomy);
        renderDynamicFilters(taxonomy);
        renderProducts(taxonomy);
        renderShopHeading(taxonomy);
      });

      collectionFilters.addEventListener("click", (event) => {
        const reset = event.target.closest("[data-collection-reset]");
        if (reset) {
          resetAllFilters({ clearSale: true });
          const refreshedTaxonomy = getTaxonomy();
          renderCollectionFilters(refreshedTaxonomy);
          renderDynamicFilters(refreshedTaxonomy);
          renderProducts(refreshedTaxonomy);
          renderShopHeading(refreshedTaxonomy);
          return;
        }

        const toggle = event.target.closest("[data-collection-more-toggle]");
        if (!toggle) return;
        state.showAllCategories = !state.showAllCategories;
        renderCollectionFilters(taxonomy);
      });
    }

    if (filterToggle) {
      filterToggle.addEventListener("click", () => {
        setFilterPanelOpen(!state.filterPanelOpen);
      });
    }

    const backdrop = document.querySelector("[data-filter-backdrop]");
    if (backdrop) {
      backdrop.addEventListener("click", () => setFilterPanelOpen(false));
    }

    const closeButton = document.querySelector("[data-filter-close]");
    if (closeButton) {
      closeButton.addEventListener("click", () => setFilterPanelOpen(false));
    }

    if (dynamicFilters) {
      dynamicFilters.addEventListener("change", (event) => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement)) return;
        const kind = input.dataset.filterKind || "";
        const next = new Set(state.subtypeKeys);

        if (kind.startsWith("subtype:")) {
          if (input.checked) next.add(input.value);
          else next.delete(input.value);
          setSelectedSubtypeKeys([...next]);
        } else if (kind.startsWith("dimension:")) {
          if (input.checked) state.dimensions.add(input.value);
          else state.dimensions.delete(input.value);
        } else if (kind.startsWith("color:")) {
          if (input.checked) state.colors.add(input.value);
          else state.colors.delete(input.value);
        } else if (kind.startsWith("toilet-type:")) {
          if (input.checked) state.toiletTypes.add(input.value);
          else state.toiletTypes.delete(input.value);
        }

        renderProducts(taxonomy);
      });
    }

    if (price) {
      price.addEventListener("input", () => {
        state.maxPrice = Number(price.value);
        if (priceValue) priceValue.textContent = `${price.value}$`;
        renderProducts(taxonomy);
      });
    }
  }

  function syncFilterPanelForViewport() {
    if (window.innerWidth > 980) {
      setFilterPanelOpen(true);
      return;
    }

    setFilterPanelOpen(false);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    ensureFilterPanel();
    syncFilterPanelForViewport();

    await commerce.ready;
    const taxonomy = getTaxonomy();
    hydrateStateFromTaxonomy(taxonomy);
    bindFilters(taxonomy);
    renderShopHeading(taxonomy);
    renderCollectionFilters(taxonomy);
    renderDynamicFilters(taxonomy);
    renderProducts(taxonomy);
    ui.updateCartBadge();
  });

  window.addEventListener("resize", syncFilterPanelForViewport);
})();
