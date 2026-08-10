(function () {
  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function slugifyTaxonomyValue(value) {
    return normalizeText(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function updateCartBadge() {
    const badge = document.querySelector("[data-cart-count]");
    if (!badge || !window.LatelierCommerce) return;
    badge.textContent = window.LatelierCommerce.getCart().totalQuantity;
  }

  function getCurrentSearchTerm() {
    const params = new URLSearchParams(window.location.search);
    return String(params.get("q") || params.get("query") || params.get("search") || "").trim();
  }

  function buildSearchUrl(term) {
    const query = String(term || "").trim();
    const nextUrl = new URL("shop.html", window.location.href);
    if (query) {
      nextUrl.searchParams.set("q", query);
    }
    return nextUrl.toString();
  }

  function getSearchableProducts(term) {
    const commerce = window.LatelierCommerce;
    if (!commerce) return [];
    const query = String(term || "").trim();
    const products = commerce.getProducts({ query });
    const normalizedQuery = normalizeText(query);
    return products
      .map((product) => {
        const parts = [
          product.title,
          product.description,
          product.productType,
          product.subtype,
          ...(product.tags || [])
        ]
          .filter(Boolean)
          .join(" ");
        const searchable = normalizeText(parts);
        const relevance = !normalizedQuery
          ? 0
          : searchable.startsWith(normalizedQuery)
            ? 3
            : searchable.includes(normalizedQuery)
              ? 2
              : 1;
        return { product, relevance };
      })
      .sort((left, right) => {
        if (right.relevance !== left.relevance) return right.relevance - left.relevance;
        return String(left.product.title).localeCompare(String(right.product.title), "fr-CA");
      })
      .map((entry) => entry.product);
  }

  function ensureSearchWidget() {
    const headerActions = document.querySelector(".header-actions");
    const trigger = headerActions?.querySelector('a.icon-button[aria-label="Rechercher"]');
    if (!headerActions || !trigger) return;

    let widget = trigger.closest("[data-site-search-widget]");
    if (!widget) {
      widget = document.createElement("div");
      widget.className = "site-search-widget";
      widget.setAttribute("data-site-search-widget", "");
      trigger.before(widget);
      widget.append(trigger);
    }

    if (widget.querySelector("[data-site-search-panel]")) return;

    const panel = document.createElement("div");
    panel.className = "site-search-panel";
    panel.hidden = true;
    panel.setAttribute("data-site-search-panel", "");
    panel.innerHTML = `
      <form class="site-search-form" data-site-search-form>
        <label class="site-search-field">
          <span class="sr-only">Rechercher</span>
          <input
            class="site-search-input"
            type="search"
            placeholder="Rechercher un produit, une catégorie ou une finition"
            autocomplete="off"
            data-site-search-input
          >
        </label>
        <div class="site-search-suggestions" data-site-search-suggestions></div>
        <div class="site-search-actions">
          <button class="btn btn--sage" type="submit">Rechercher</button>
          <button class="btn-outline" type="button" data-site-search-close>Fermer</button>
        </div>
      </form>
    `;
    widget.append(panel);

    const panelElement = widget.querySelector("[data-site-search-panel]");
    const form = widget.querySelector("[data-site-search-form]");
    const input = widget.querySelector("[data-site-search-input]");
    const suggestions = widget.querySelector("[data-site-search-suggestions]");

    const renderSuggestions = () => {
      if (!panelElement || !input || !suggestions) return;
      const term = String(input.value || "").trim();
      if (!term) {
        suggestions.innerHTML = "";
        return;
      }

      const products = getSearchableProducts(term).slice(0, 6);

      if (!products.length) {
        suggestions.innerHTML = `
          <div class="site-search-empty">
            Aucun produit trouvé pour "${escapeHtml(term)}".
          </div>
        `;
        return;
      }

      suggestions.innerHTML = `
        <div class="site-search-suggestions__label">Suggestions</div>
        ${products.map((product) => {
          const image = product.images?.[0] || { src: "", altText: product.title || "" };
          const price = window.LatelierCommerce?.formatMoney(product.price) || "";
          const typeLabel = getProductTypeLabel(product);
          return `
            <a class="site-search-suggestion" href="product.html?handle=${encodeURIComponent(product.handle)}">
              <span class="site-search-suggestion__image">
                <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.altText)}">
              </span>
              <span class="site-search-suggestion__content">
                <strong>${escapeHtml(product.title)}</strong>
                <span>${escapeHtml(typeLabel)}</span>
              </span>
              <span class="site-search-suggestion__price">${escapeHtml(price)}</span>
            </a>
          `;
        }).join("")}
        <a class="site-search-view-all" href="${buildSearchUrl(term)}">Voir tous les résultats</a>
      `;
    };

    const open = () => {
      panelElement.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      input.value = getCurrentSearchTerm();
      renderSuggestions();
      window.requestAnimationFrame(() => input.focus());
    };

    const close = () => {
      panelElement.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    };

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (panel.hidden) {
        open();
      } else {
        close();
      }
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const term = String(input?.value || "").trim();
      window.location.assign(buildSearchUrl(term));
    });

    input?.addEventListener("input", renderSuggestions);
    input?.addEventListener("focus", renderSuggestions);

    widget.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-site-search-close]");
      if (closeButton) {
        close();
        trigger.focus();
        return;
      }

      const suggestion = event.target.closest(".site-search-suggestion");
      if (suggestion) {
        close();
      }
    });

    document.addEventListener("click", (event) => {
      if (panelElement.hidden) return;
      if (widget.contains(event.target)) return;
      close();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panelElement.hidden) {
        close();
        trigger.focus();
      }
    });

    if (input) {
      input.value = getCurrentSearchTerm();
      renderSuggestions();
    }
  }

  function closeMobileNav() {
    const toggle = document.querySelector("[data-mobile-nav-toggle]");
    document.body.classList.remove("mobile-nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function ensureMobileNav() {
    const header = document.querySelector(".site-header");
    const headerInner = header?.querySelector(".header-inner");
    const actions = header?.querySelector(".header-actions");
    if (!header || !headerInner || !actions || header.querySelector("[data-mobile-nav-toggle]")) return;

    const toggle = document.createElement("button");
    toggle.className = "mobile-nav-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Ouvrir le menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "mobile-nav-panel");
    toggle.setAttribute("data-mobile-nav-toggle", "");
    toggle.innerHTML = '<span></span><span></span><span></span>';

    const panel = document.createElement("nav");
    panel.className = "mobile-nav-panel";
    panel.id = "mobile-nav-panel";
    panel.setAttribute("aria-label", "Navigation mobile");
    panel.setAttribute("data-mobile-nav-panel", "");

    actions.prepend(toggle);
    header.append(panel);
    renderMobileNav();

    toggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("mobile-nav-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
    });

    panel.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (link) closeMobileNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMobileNav();
    });
  }

  function renderMobileNav() {
    const commerce = window.LatelierCommerce;
    const panel = document.querySelector("[data-mobile-nav-panel]");
    if (!panel || !commerce) return;

    const taxonomy = buildProductTaxonomy(commerce.getProducts());
    const productLinks = taxonomy.map((group) => `
      <details class="mobile-nav-group">
        <summary>
          <span>${escapeHtml(group.label)}</span>
        </summary>
        <div class="mobile-nav-submenu">
          <a href="${group.href}">Voir tout</a>
          ${group.subtypes.map((subtype) => `<a href="${subtype.href}">${escapeHtml(subtype.label)}</a>`).join("")}
        </div>
      </details>
    `).join("");

    panel.innerHTML = `
      <div class="mobile-nav-links">
        <a href="index.html">Accueil</a>
        <a href="shop.html?collection=all">Tous les produits</a>
        <a href="shop.html?promotion=sale">Promotions</a>
        <a href="about.html">À propos</a>
        <a href="contact.html">Nous contacter</a>
      </div>
      <div class="mobile-nav-products" aria-label="Catégories de produits">
        ${productLinks}
      </div>
    `;
  }

  function syncProductsMenuArrow() {
    const navDropdown = document.querySelector(".nav-dropdown");
    const trigger = navDropdown?.querySelector(".nav-button");
    const menu = navDropdown?.querySelector(".products-menu");
    if (!navDropdown || !trigger || !menu || window.innerWidth <= 980) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    if (!menuRect.width) return;

    const arrowLeft = Math.round((triggerRect.left + (triggerRect.width / 2)) - menuRect.left);
    menu.style.setProperty("--products-menu-arrow-left", `${arrowLeft}px`);
  }

  function bindProductsMenuArrow() {
    const navDropdown = document.querySelector(".nav-dropdown");
    if (!navDropdown) return;

    const sync = () => syncProductsMenuArrow();
    navDropdown.addEventListener("mouseenter", sync);
    navDropdown.addEventListener("focusin", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("load", sync);
    window.addEventListener("scroll", sync, { passive: true });

    if (document.fonts?.ready) {
      document.fonts.ready.then(sync).catch(() => {});
    }

    sync();
  }

  function getProductTypeLabel(product) {
    return getProductSubtypeLabel(product) || getProductTopTypeLabel(product) || "";
  }

  function getProductTopTypeLabel(product) {
    const raw = String(product?.productType || "").trim();
    return raw;
  }

  function getProductSubtypeLabel(product) {
    const explicitSubtype = String(product?.subtype || product?.metafields?.productType || "").trim();
    if (explicitSubtype) return explicitSubtype;

    const candidates = [
      ...(product?.tags || []),
      product?.title,
      product?.handle
    ];

    for (const candidate of candidates) {
      const raw = String(candidate ?? "").trim();
      if (!raw) continue;
      const lower = raw.toLowerCase();
      if (lower.includes("vanit")) return "Vanité";
      if (lower.includes("cabinet")) return "Cabinet";
      if (lower.includes("lingerie")) return "Lingerie";
      if (lower.includes("miroir")) return "Miroir";
      if (lower.includes("comptoir")) return "Comptoir";
      if (lower.includes("vasque")) return "Vasque";
      if (lower.includes("intellig")) return "Intelligente";
      if (lower.includes("1-piece") || lower.includes("1 piece")) return "1 Pièce";
      if (lower.includes("2-pieces") || lower.includes("2 pieces")) return "2 Pièces";
      if (lower.includes("autoport")) return "Autoportante";
      if (lower.includes("alcove")) return "Alcove";
      if (lower.includes("coin")) return "En coin";
      if (lower.includes("porte")) return "Portes";
      if (lower.includes("ensemble")) return "Ensemble complet";
    }

    return "";
  }

  function getPreferredTopTypeOrder(label) {
    const preferred = [
      "Meubles de salle de bain",
      "Lavabos",
      "Toilettes",
      "Baignoires",
      "Douches"
    ];
    const index = preferred.findIndex((value) => normalizeText(value) === normalizeText(label));
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }

  function buildProductTaxonomy(products = []) {
    const topGroups = new Map();

    for (const product of products) {
      const topLabel = getProductTopTypeLabel(product) || getProductTypeLabel(product) || getProductSubtypeLabel(product);
      const topKey = slugifyTaxonomyValue(topLabel);
      if (!topKey) continue;

      if (!topGroups.has(topKey)) {
        topGroups.set(topKey, {
          key: topKey,
          label: topLabel,
          count: 0,
          subtypes: new Map(),
          products: []
        });
      }

      const group = topGroups.get(topKey);
      group.count += 1;
      group.products.push(product);

      const subtypeLabel = getProductSubtypeLabel(product);
      const subtypeKey = slugifyTaxonomyValue(subtypeLabel);
      if (!subtypeKey) continue;

      if (!group.subtypes.has(subtypeKey)) {
        group.subtypes.set(subtypeKey, {
          key: subtypeKey,
          label: subtypeLabel,
          count: 0,
          products: []
        });
      }

      const subtype = group.subtypes.get(subtypeKey);
      subtype.count += 1;
      subtype.products.push(product);
    }

    return [...topGroups.values()]
      .sort((a, b) => {
        const orderDelta = getPreferredTopTypeOrder(a.label) - getPreferredTopTypeOrder(b.label);
        if (orderDelta) return orderDelta;
        return String(a.label).localeCompare(String(b.label), "fr-CA");
      })
      .map((group) => ({
        ...group,
        href: `shop.html?type=${encodeURIComponent(group.key)}`,
        subtypes: [...group.subtypes.values()]
          .sort((a, b) => String(a.label).localeCompare(String(b.label), "fr-CA"))
          .map((subtype) => ({
            ...subtype,
            href: `shop.html?type=${encodeURIComponent(group.key)}&category=${encodeURIComponent(subtype.key)}`
          }))
      }));
  }

  function getImageSource(image) {
    return String(image?.src || image?.url || "").trim();
  }

  function getImageComparisonKey(image) {
    const source = typeof image === "string" ? image : getImageSource(image);
    return String(source || "")
      .split("?")[0]
      .split("#")[0]
      .trim()
      .toLowerCase();
  }

  function getProductCardHoverImage(product, primaryImage) {
    const productImages = Array.isArray(product?.images) ? product.images : [];
    if (productImages.length < 2) return null;

    const primaryKey = getImageComparisonKey(primaryImage);
    const variantImageKeys = new Set(
      (product?.variants || [])
        .map((variant) => getImageComparisonKey(variant?.image))
        .filter(Boolean)
    );

    return productImages.find((image, index) => {
      if (index === 0 || !getImageSource(image)) return false;
      const imageKey = getImageComparisonKey(image);
      if (!imageKey || imageKey === primaryKey) return false;
      return !variantImageKeys.has(imageKey);
    }) || null;
  }

  function createProductCard(product) {
    const commerce = window.LatelierCommerce;
    const image = product.images?.[0] || { src: "", altText: product.title || "" };
    const hoverImage = getProductCardHoverImage(product, image);

    return `
      <div class="product-card">
        <a class="product-card__link" href="product.html?handle=${encodeURIComponent(product.handle)}">
          <span class="product-card__image${hoverImage ? " product-card__image--has-hover" : ""}">
            <img class="product-card__image-primary" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.altText)}">
            ${hoverImage ? `<img class="product-card__image-hover" src="${escapeHtml(hoverImage.src)}" alt="" aria-hidden="true">` : ""}
          </span>
          <span class="product-card__body">
            <h2>${escapeHtml(product.title)}</h2>
            <span class="product-card__type">${escapeHtml(getProductTypeLabel(product))}</span>
            <span class="product-price">
              <span>${commerce.formatMoney(product.price)}</span>
              ${product.compareAtPrice ? `<span class="compare-price">${commerce.formatMoney(product.compareAtPrice)}</span>` : ""}
            </span>
          </span>
        </a>
      </div>
    `;
  }

  function getCollectionCount(collectionHandle) {
    const commerce = window.LatelierCommerce;
    if (collectionHandle === "all") return commerce.getProducts().length;
    return commerce.getProducts({ collection: collectionHandle }).length;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderProductsMenu() {
    const commerce = window.LatelierCommerce;
    const menus = document.querySelectorAll(".products-menu");
    if (!menus.length || !commerce) return;

    const taxonomy = buildProductTaxonomy(commerce.getProducts());
    const html = taxonomy.map((group) => `
      <div class="products-menu__column">
        <a class="products-menu__title" href="${group.href}">${escapeHtml(group.label)}</a>
        ${group.subtypes.map((subtype) => `<a href="${subtype.href}">${escapeHtml(subtype.label)}</a>`).join("")}
      </div>
    `).join("");

    menus.forEach((menu) => {
      menu.innerHTML = html;
    });

    syncProductsMenuArrow();
  }

  function renderFooterCollections() {
    const commerce = window.LatelierCommerce;
    const footers = document.querySelectorAll("[data-footer-collections]");
    if (!footers.length || !commerce) return;

    const taxonomy = buildProductTaxonomy(commerce.getProducts());
    const html = taxonomy.map((group) => `
      <a href="${group.href}">${escapeHtml(group.label)}</a>
    `).join("");

    footers.forEach((footer) => {
      footer.innerHTML = html;
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function bootProductsMenu() {
    const commerce = window.LatelierCommerce;
    if (!commerce?.ready) return;
    ensureMobileNav();
    commerce.ready.then(() => {
      renderProductsMenu();
      renderFooterCollections();
      renderMobileNav();
    }).catch(() => {
      renderProductsMenu();
      renderFooterCollections();
      renderMobileNav();
    });
  }

  document.addEventListener("DOMContentLoaded", updateCartBadge);
  document.addEventListener("DOMContentLoaded", bindProductsMenuArrow);
  document.addEventListener("DOMContentLoaded", ensureSearchWidget);
  document.addEventListener("DOMContentLoaded", ensureMobileNav);
  document.addEventListener("DOMContentLoaded", bootProductsMenu);
  window.addEventListener("latelier:cart-updated", updateCartBadge);

  window.LatelierUI = {
    updateCartBadge,
    createProductCard,
    getCollectionCount,
    getProductTypeLabel,
    getProductTopTypeLabel,
    getProductSubtypeLabel,
    buildProductTaxonomy,
    slugifyTaxonomyValue,
    renderProductsMenu,
    renderFooterCollections,
    renderMobileNav,
    syncProductsMenuArrow,
    buildSearchUrl
  };
})();
