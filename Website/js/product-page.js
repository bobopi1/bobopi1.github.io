(function () {
  const commerce = window.LatelierCommerce;
  const ui = window.LatelierUI;
  const params = new URLSearchParams(window.location.search);
  const selectedHandle = params.get("handle") || "la-bois-naturel-30";
  const selectedVariantId = params.get("variant");
  let product = null;
  let selectedImageIndex = 0;
  let selectedVariant = null;
  let showerBaseSelected = false;
  let showerDimensionValue = "";
  let showerInstallationValue = "";
  let showerColorValue = "";

  function resolveSelectedProduct() {
    product = commerce.getProductByHandle(selectedHandle) || commerce.getProducts()[0] || null;
    selectedImageIndex = 0;
    selectedVariant = selectedVariantId
      ? product?.variants.find((variant) => variant.id === selectedVariantId && variant.availableForSale)
      : null;
    if (!selectedVariant) {
      selectedVariant = product?.variants.find((variant) => variant.availableForSale) || product?.variants[0] || null;
    }
  }

  function optionSummary(productVariant) {
    return productVariant.selectedOptions.map((option) => option.value).join(" / ");
  }

  function simplifyText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getAvailableVariants(productItem = product) {
    return Array.isArray(productItem?.variants)
      ? productItem.variants.filter((variant) => variant?.availableForSale)
      : [];
  }

  function getRenderableVariants(productItem = product) {
    const allVariants = Array.isArray(productItem?.variants)
      ? productItem.variants.filter(Boolean)
      : [];
    const availableVariants = allVariants.filter((variant) => variant.availableForSale);
    return availableVariants.length ? availableVariants : allVariants;
  }

  function isVariantInStock(variant) {
    return Boolean(variant && variant.availableForSale !== false);
  }

  function getOutOfStockMessage(showerState, activeVariant) {
    if (showerState) {
      if (!isVariantInStock(showerState.doorVariant)) return "Rupture de stock";
      if (showerState.needsSidePanel && !isVariantInStock(showerState.sidePanelVariant)) return "Rupture de stock";
      if (showerBaseSelected && !isVariantInStock(showerState.baseVariant)) return "Rupture de stock";
      return "";
    }

    if (!isVariantInStock(activeVariant)) return "Rupture de stock";
    return "";
  }

  function hasSelectableVariantOptions() {
    const options = Array.isArray(product?.options) ? product.options : [];
    return options.some((option) => {
      const name = simplifyText(option?.name);
      const values = Array.isArray(option?.values)
        ? [...new Set(option.values.map((value) => String(value || "").trim()).filter(Boolean))]
        : [];
      return name !== "title" && values.length > 1;
    });
  }

  function getVariantOptionValue(variant, optionName) {
    if (!variant || !optionName) return "";
    const targetName = simplifyText(optionName);
    const option = (variant.selectedOptions || []).find((entry) => simplifyText(entry.name) === targetName);
    return String(option?.value || "").trim();
  }

  function getOptionValuesForVariants(optionName, variants) {
    const seen = new Set();
    const values = [];
    (variants || []).forEach((variant) => {
      const value = getVariantOptionValue(variant, optionName);
      if (!value || seen.has(value)) return;
      seen.add(value);
      values.push(value);
    });
    return values;
  }

  function getOptionNameByPredicate(predicate, productItem = product) {
    return (productItem?.options || []).find((option) => predicate(option?.name))?.name || "";
  }

  function getShowerOptionNames(productItem = product) {
    const options = (Array.isArray(productItem?.options) ? productItem.options : [])
      .filter((option) => Array.isArray(option?.values) && option.values.length > 1)
      .filter((option) => simplifyText(option?.name) !== "title");
    if (!options.length) return { dimensionOptionName: "", installationOptionName: "", colorOptionName: "" };

    const pickOption = (predicate, fallbackIndex, usedNames = []) => {
      const matched = options.find((option) => !usedNames.includes(option.name) && predicate(option.name));
      if (matched) return matched.name;
      const fallback = options.find((option, index) => index === fallbackIndex && !usedNames.includes(option.name));
      if (fallback) return fallback.name;
      return options.find((option) => !usedNames.includes(option.name))?.name || "";
    };

    const dimensionOptionName = pickOption((name) => {
      const text = simplifyText(name);
      return text.includes("dimension") || text.includes("size") || text.includes("format");
    }, 0);
    const installationOptionName = pickOption((name) => {
      const text = simplifyText(name);
      return text.includes("installation") || text.includes("install");
    }, 1, [dimensionOptionName]);
    const colorOptionName = pickOption((name) => {
      const text = simplifyText(name);
      return text.includes("couleur") || text.includes("color") || text.includes("finition") || text.includes("finish");
    }, 2, [dimensionOptionName, installationOptionName]);

    return {
      dimensionOptionName,
      installationOptionName,
      colorOptionName
    };
  }

  function getCountertopOptionName() {
    return getOptionNameByPredicate((name) => {
      const text = simplifyText(name);
      return text.includes("comptoir") || text.includes("countertop") || text.includes("material") || text.includes("finish");
    });
  }

  function getColorOptionName() {
    return getOptionNameByPredicate((name) => {
      const text = simplifyText(name);
      return text.includes("couleur") || text.includes("color") || text.includes("colour");
    });
  }

  function findAvailableVariantBySelections(selections = {}, productItem = product) {
    return getAvailableVariants(productItem).find((variant) => {
      return Object.entries(selections).every(([optionName, optionValue]) => {
        if (!optionValue) return true;
        return getVariantOptionValue(variant, optionName) === optionValue;
      });
    }) || null;
  }

  function getBestVariantMatch(targetProduct, selections = {}) {
    const variants = getAvailableVariants(targetProduct);
    if (!variants.length) return null;

    const exactMatch = variants.find((variant) => {
      return Object.entries(selections).every(([optionName, optionValue]) => {
        if (!optionValue) return true;
        return getVariantOptionValue(variant, optionName) === optionValue;
      });
    });

    return exactMatch || variants[0] || null;
  }

  function getShowerCollectionHandle(productItem = product) {
    const collectionHandles = Array.isArray(productItem?.collections) && productItem.collections.length
      ? productItem.collections
      : [productItem?.collection].filter(Boolean);

    for (const handle of collectionHandles) {
      const relatedProducts = commerce.getProducts({ collection: handle });
      if (relatedProducts.some((item) => simplifyText(item?.metafields?.shower_product_type))) {
        return handle;
      }
    }

    return collectionHandles[0] || "";
  }

  function isShowerDoorProduct(productItem = product) {
    const showerType = simplifyText(productItem?.metafields?.shower_product_type);
    return showerType.includes("porte") || showerType.includes("door");
  }

  function isShowerCollectionProduct(productItem = product) {
    const collectionHandles = Array.isArray(productItem?.collections) && productItem.collections.length
      ? productItem.collections
      : [productItem?.collection].filter(Boolean);
    const productText = simplifyText(`${productItem?.title || ""} ${productItem?.productType || ""} ${productItem?.subtype || ""} ${productItem?.metafields?.shower_product_type || ""} ${(Array.isArray(productItem?.tags) ? productItem.tags.join(" ") : "")}`);
    return collectionHandles.some((handle) => {
      const relatedProducts = commerce.getProducts({ collection: handle });
      return relatedProducts.some((item) => simplifyText(item?.metafields?.shower_product_type)) || simplifyText(handle).includes("douche") || productText.includes("douche") || productText.includes("shower");
    });
  }

  function isShowerProduct(productItem = product) {
    const tagsText = Array.isArray(productItem?.tags) ? productItem.tags.join(" ") : "";
    const text = simplifyText(`${productItem?.title || ""} ${productItem?.productType || ""} ${productItem?.subtype || ""} ${productItem?.metafields?.shower_product_type || ""} ${tagsText}`);
    return isShowerDoorProduct(productItem) || isShowerCollectionProduct(productItem) || text.includes("douche") || text.includes("shower") || text.includes("shower-tag");
  }

  function getShowerCollectionProducts() {
    const handle = getShowerCollectionHandle();
    if (!handle) return [];
    return commerce.getProducts({ collection: handle });
  }

  function getShowerProductByType(typeLabel) {
    const targetType = simplifyText(typeLabel);
    if (!targetType) return null;
    return getShowerCollectionProducts().find((item) => simplifyText(item?.metafields?.shower_product_type) === targetType) || null;
  }

  function getShowerOptionState() {
    if (!isShowerProduct(product)) return null;

    const availableVariants = getAvailableVariants(product);
    if (!availableVariants.length) return null;

    const { dimensionOptionName, installationOptionName, colorOptionName } = getShowerOptionNames(product);

    if (!dimensionOptionName || !installationOptionName || !colorOptionName) return null;

    const dimensionValues = getOptionValuesForVariants(dimensionOptionName, availableVariants);
    const installationValues = getOptionValuesForVariants(installationOptionName, availableVariants);
    const colorValues = getOptionValuesForVariants(colorOptionName, availableVariants);
    if (!dimensionValues.length || !installationValues.length || !colorValues.length) return null;

    let selectedDimensionValue = showerDimensionValue || getVariantOptionValue(selectedVariant, dimensionOptionName);
    if (!selectedDimensionValue || !dimensionValues.includes(selectedDimensionValue)) {
      selectedDimensionValue = dimensionValues[0];
    }

    let selectedInstallationValue = showerInstallationValue || getVariantOptionValue(selectedVariant, installationOptionName);
    if (!selectedInstallationValue || !installationValues.includes(selectedInstallationValue)) {
      selectedInstallationValue = installationValues[0];
    }

    let selectedColorValue = showerColorValue || getVariantOptionValue(selectedVariant, colorOptionName);
    if (!selectedColorValue || !colorValues.includes(selectedColorValue)) {
      selectedColorValue = colorValues[0];
    }

    let doorVariant = findAvailableVariantBySelections({
      [dimensionOptionName]: selectedDimensionValue,
      [installationOptionName]: selectedInstallationValue,
      [colorOptionName]: selectedColorValue
    }, product);

    if (!doorVariant) {
      doorVariant = findAvailableVariantBySelections({
        [dimensionOptionName]: selectedDimensionValue,
        [installationOptionName]: selectedInstallationValue
      }, product) || availableVariants[0] || null;
    }

    if (doorVariant) {
      const resolvedDimension = getVariantOptionValue(doorVariant, dimensionOptionName);
      const resolvedInstallation = getVariantOptionValue(doorVariant, installationOptionName);
      const resolvedColor = getVariantOptionValue(doorVariant, colorOptionName);
      if (resolvedDimension) selectedDimensionValue = resolvedDimension;
      if (resolvedInstallation) selectedInstallationValue = resolvedInstallation;
      if (resolvedColor) selectedColorValue = resolvedColor;
    }

    const sidePanelProduct = getShowerProductByType("Panneau de douche");
    const baseProduct = getShowerProductByType("Base de douche");
    const needsSidePanel = /coin|corner/.test(simplifyText(selectedInstallationValue));
    const sidePanelVariant = needsSidePanel && sidePanelProduct
      ? getBestVariantMatch(sidePanelProduct, {
          [dimensionOptionName]: selectedDimensionValue,
          [colorOptionName]: selectedColorValue
        })
      : null;
    const baseVariant = showerBaseSelected && baseProduct
      ? getBestVariantMatch(baseProduct, {
          [dimensionOptionName]: selectedDimensionValue,
          [colorOptionName]: selectedColorValue
        })
      : null;

    const bundleVariants = [
      { key: "door", product, variant: doorVariant, label: "Porte de douche" },
      ...(needsSidePanel && sidePanelVariant ? [{ key: "panel", product: sidePanelProduct, variant: sidePanelVariant, label: "Panneau de douche" }] : []),
      ...(baseVariant ? [{ key: "base", product: baseProduct, variant: baseVariant, label: "Base de douche" }] : [])
    ].filter((entry) => entry.variant);

    const totalPrice = bundleVariants.reduce((sum, entry) => sum + Number(entry.variant?.price?.amount || 0), 0);

    return {
      dimensionOptionName,
      installationOptionName,
      colorOptionName,
      dimensionValues,
      installationValues,
      colorValues,
      selectedDimensionValue,
      selectedInstallationValue,
      selectedColorValue,
      doorVariant,
      sidePanelProduct,
      sidePanelVariant,
      baseProduct,
      baseVariant,
      needsSidePanel,
      bundleVariants,
      totalPrice: {
        amount: totalPrice,
        currencyCode: doorVariant?.price?.currencyCode || product.price?.currencyCode || "CAD"
      }
    };
  }

  function resolveSplitVariantState() {
    const countertopOptionName = getCountertopOptionName();
    const colorOptionName = getColorOptionName();
    if (!countertopOptionName || !colorOptionName) return null;

    const availableVariants = getRenderableVariants();
    const countertopValues = getOptionValuesForVariants(countertopOptionName, availableVariants);
    if (!countertopValues.length) return null;

    let selectedCountertopValue = getVariantOptionValue(selectedVariant, countertopOptionName);
    if (!selectedCountertopValue || !countertopValues.includes(selectedCountertopValue)) {
      selectedCountertopValue = countertopValues[0];
    }

    const countertopVariants = availableVariants.filter(
      (variant) => getVariantOptionValue(variant, countertopOptionName) === selectedCountertopValue
    );
    const colorValues = getOptionValuesForVariants(colorOptionName, countertopVariants);
    if (!colorValues.length) return null;

    let selectedColorValue = getVariantOptionValue(selectedVariant, colorOptionName);
    if (!selectedColorValue || !colorValues.includes(selectedColorValue)) {
      selectedColorValue = colorValues[0];
    }

    let resolvedVariant = findAvailableVariantBySelections({
      [countertopOptionName]: selectedCountertopValue,
      [colorOptionName]: selectedColorValue
    });

    if (!resolvedVariant) {
      resolvedVariant = findAvailableVariantBySelections({
        [countertopOptionName]: selectedCountertopValue
      }) || availableVariants[0] || null;
    }

    if (resolvedVariant) {
      const resolvedCountertop = getVariantOptionValue(resolvedVariant, countertopOptionName);
      const resolvedColor = getVariantOptionValue(resolvedVariant, colorOptionName);
      if (resolvedCountertop) selectedCountertopValue = resolvedCountertop;
      if (resolvedColor) selectedColorValue = resolvedColor;
    }

    return {
      countertopOptionName,
      colorOptionName,
      countertopValues,
      colorValues,
      selectedCountertopValue,
      selectedColorValue,
      resolvedVariant
    };
  }

  function resolveVariantFromSplitControls(countertopValue, colorValue) {
    const countertopOptionName = getCountertopOptionName();
    const colorOptionName = getColorOptionName();
    if (!countertopOptionName || !colorOptionName) return null;

    const availableVariants = getRenderableVariants();
    if (!availableVariants.length) return null;

    const exactMatch = findAvailableVariantBySelections({
      [countertopOptionName]: countertopValue,
      [colorOptionName]: colorValue
    });
    if (exactMatch) return exactMatch;

    const countertopMatch = findAvailableVariantBySelections({
      [countertopOptionName]: countertopValue
    }) || availableVariants[0] || null;
    if (!countertopMatch) return null;

    const colorValues = getOptionValuesForVariants(
      colorOptionName,
      availableVariants.filter((variant) => getVariantOptionValue(variant, countertopOptionName) === countertopValue)
    );
    const preferredColor = colorValues.includes(colorValue) ? colorValue : colorValues[0];
    if (preferredColor) {
      const matchedColorVariant = findAvailableVariantBySelections({
        [countertopOptionName]: countertopValue,
        [colorOptionName]: preferredColor
      });
      if (matchedColorVariant) return matchedColorVariant;
    }

    return countertopMatch;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getImageSrc(image) {
    return String(image?.src || image?.url || "").trim();
  }

  function normalizeSpecRows(rows) {
    return (rows || [])
      .map((row) => {
        if (Array.isArray(row)) {
          const [label, value] = row;
          const textLabel = String(label || "").trim();
          const textValue = String(value || "").trim();
          return textLabel && textValue ? [textLabel, textValue] : null;
        }

        if (row && typeof row === "object") {
          const textLabel = String(row.label || row.key || "").trim();
          const textValue = String(row.value || "").trim();
          return textLabel && textValue ? [textLabel, textValue] : null;
        }

        return null;
      })
      .filter(Boolean);
  }

  const defaultCollectionHandles = new Set(["all", "vanites", "douches", "baignoires", "toilettes"]);

  function getCollectionHandles(productItem) {
    const handles = Array.isArray(productItem?.collections) && productItem.collections.length
      ? productItem.collections
      : [productItem?.collection].filter(Boolean);
    return [...new Set(handles.filter(Boolean))];
  }

  function getCollectionSummary(item) {
    const dimensions = item?.metafields?.dimensions;
    if (Array.isArray(dimensions)) {
      const firstValue = dimensions.find((row) => Array.isArray(row) && String(row[1] || "").trim())?.[1];
      if (firstValue) return firstValue;
    }
    return ui.getProductTypeLabel(item);
  }

  function getRelatedProductsFromCollection(currentProduct) {
    const handles = getCollectionHandles(currentProduct);
    const orderedHandles = [
      ...handles.filter((handle) => !defaultCollectionHandles.has(handle)),
      ...handles.filter((handle) => defaultCollectionHandles.has(handle))
    ];

    for (const handle of orderedHandles) {
      const related = commerce.getProducts({ collection: handle })
        .filter((item) => item.handle !== currentProduct.handle);
      if (related.length) {
        return related;
      }
    }

    return [];
  }

  function renderSpecSection(groupSelector, targetSelector, rows) {
    const group = document.querySelector(groupSelector);
    const target = document.querySelector(targetSelector);
    if (!group || !target) return;

    const entries = normalizeSpecRows(rows);
    const hasRows = entries.length > 0;
    group.hidden = !hasRows;
    target.innerHTML = hasRows
      ? entries.map(([label, value]) => `
        <div class="spec-row">
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(value)}</span>
        </div>
      `).join("")
      : "";
  }

  function getGalleryImages() {
    if (!product) return [];

    const productImages = (product.images || []).filter(Boolean);
    const variantImageSources = new Set(
      (product.variants || [])
        .map((variant) => getImageSrc(variant?.image))
        .filter(Boolean)
    );
    const baseImages = productImages.filter((image) => !variantImageSources.has(getImageSrc(image)));
    const selectedVariantImage = selectedVariant?.image && getImageSrc(selectedVariant.image)
      ? [{
          src: getImageSrc(selectedVariant.image),
          altText: String(selectedVariant.image.altText || product.title || "").trim()
        }]
      : [];

    return [...selectedVariantImage, ...baseImages];
  }

  function renderGallery() {
    const thumbnails = document.querySelector("[data-product-thumbnails]");
    const mainImage = document.querySelector("[data-product-main-image]");
    if (!thumbnails || !mainImage || !product) return;
    const galleryImages = getGalleryImages();
    if (!galleryImages.length) return;
    if (selectedImageIndex >= galleryImages.length) {
      selectedImageIndex = 0;
    }
    const activeImage = galleryImages[selectedImageIndex] || galleryImages[0];

    thumbnails.innerHTML = galleryImages.map((image, index) => `
      <button class="thumb-button ${index === selectedImageIndex ? "is-active" : ""}" type="button" data-image-index="${index}" aria-label="Voir image ${index + 1}">
        <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.altText)}">
      </button>
    `).join("");

    mainImage.src = activeImage.src;
    mainImage.alt = activeImage.altText;

    thumbnails.querySelectorAll("[data-image-index]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedImageIndex = Number(button.dataset.imageIndex);
        renderGallery();
      });
    });
  }

  function renderProduct() {
    if (!product) return;

    const showerMode = isShowerProduct(product);
    const showerState = showerMode ? getShowerOptionState() : null;
    const splitState = !showerMode && !showerState ? resolveSplitVariantState() : null;
    const activeVariant = showerState?.doorVariant || splitState?.resolvedVariant || selectedVariant || getRenderableVariants()[0] || product.variants?.[0] || null;
    if (activeVariant && activeVariant !== selectedVariant) {
      selectedVariant = activeVariant;
    }

    document.title = `${product.title} - L'Atelier Salle de Bain`;
    document.querySelector("[data-product-title]").textContent = product.title;
    document.querySelector("[data-product-type]").textContent = ui.getProductTypeLabel(product);
    document.querySelector("[data-product-price]").textContent = commerce.formatMoney(showerState?.totalPrice || activeVariant?.price || product.price);
    document.querySelector("[data-product-description]").textContent = product.description;
    const noteSection = document.querySelector("[data-product-note]");
    const noteText = String(product.metafields.note || "").trim();
    if (noteSection) {
      noteSection.hidden = !noteText;
      noteSection.textContent = noteText;
    }

    const dimensionField = document.querySelector("[data-product-dimension-field]");
    const installationField = document.querySelector("[data-product-installation-field]");
    const countertopField = document.querySelector("[data-product-countertop-field]");
    const colorField = document.querySelector("[data-product-color-field]");
    const fallbackField = document.querySelector("[data-product-variant-field]");
    const baseField = document.querySelector("[data-product-base-field]");
    const dimensionSelect = document.querySelector("[data-product-dimension]");
    const installationSelect = document.querySelector("[data-product-installation]");
    const countertopSelect = document.querySelector("[data-product-countertop]");
    const colorSelect = document.querySelector("[data-product-color]");
    const variantSelect = document.querySelector("[data-product-variant]");
    const baseCheckbox = document.querySelector("[data-product-base]");
    const stockMessage = document.querySelector("[data-product-stock-message]");

    if (showerState) {
      showerDimensionValue = showerState.selectedDimensionValue;
      showerInstallationValue = showerState.selectedInstallationValue;
      showerColorValue = showerState.selectedColorValue;
      if (dimensionField) dimensionField.hidden = false;
      if (installationField) installationField.hidden = false;
      if (countertopField) countertopField.hidden = true;
      if (colorField) colorField.hidden = false;
      if (fallbackField) fallbackField.hidden = true;
      if (baseField) baseField.hidden = !showerState.baseProduct;
      if (!showerState.baseProduct) {
        showerBaseSelected = false;
      }

      if (dimensionSelect) {
        dimensionSelect.innerHTML = showerState.dimensionValues.map((value) => `
          <option value="${escapeHtml(value)}" ${value === showerState.selectedDimensionValue ? "selected" : ""}>${escapeHtml(value)}</option>
        `).join("");
        dimensionSelect.value = showerState.selectedDimensionValue;
      }

      if (installationSelect) {
        installationSelect.innerHTML = showerState.installationValues.map((value) => `
          <option value="${escapeHtml(value)}" ${value === showerState.selectedInstallationValue ? "selected" : ""}>${escapeHtml(value)}</option>
        `).join("");
        installationSelect.value = showerState.selectedInstallationValue;
      }

      if (colorSelect) {
        colorSelect.innerHTML = showerState.colorValues.map((value) => `
          <option value="${escapeHtml(value)}" ${value === showerState.selectedColorValue ? "selected" : ""}>${escapeHtml(value)}</option>
        `).join("");
        colorSelect.value = showerState.selectedColorValue;
      }

      if (baseCheckbox) {
        baseCheckbox.checked = showerBaseSelected;
        baseCheckbox.disabled = !showerState.baseProduct;
      }
    } else {
      const useSplitSelectors = Boolean(splitState);
      const showFallbackVariantSelector = !useSplitSelectors && hasSelectableVariantOptions();
      showerDimensionValue = "";
      showerInstallationValue = "";
      showerColorValue = "";
      if (dimensionField) dimensionField.hidden = true;
      if (installationField) installationField.hidden = true;
      if (countertopField) countertopField.hidden = !useSplitSelectors;
      if (colorField) colorField.hidden = !useSplitSelectors;
      if (fallbackField) fallbackField.hidden = showerMode || !showFallbackVariantSelector;
      if (baseField) baseField.hidden = true;

      if (useSplitSelectors && countertopSelect && colorSelect) {
        countertopSelect.innerHTML = splitState.countertopValues.map((value) => `
          <option value="${escapeHtml(value)}" ${value === splitState.selectedCountertopValue ? "selected" : ""}>${escapeHtml(value)}</option>
        `).join("");
        countertopSelect.value = splitState.selectedCountertopValue;

        colorSelect.innerHTML = splitState.colorValues.map((value) => `
          <option value="${escapeHtml(value)}" ${value === splitState.selectedColorValue ? "selected" : ""}>${escapeHtml(value)}</option>
        `).join("");
        colorSelect.value = splitState.selectedColorValue;
      } else if (variantSelect) {
        if (!showFallbackVariantSelector) {
          variantSelect.innerHTML = "";
        }
        const variantsToRender = getRenderableVariants();
        variantSelect.innerHTML = variantsToRender.map((variant) => `
          <option value="${escapeHtml(variant.id)}" ${variant.id === activeVariant?.id ? "selected" : ""} ${variant.availableForSale === false ? "disabled" : ""}>
            ${escapeHtml(optionSummary(variant))}${variant.availableForSale === false ? " (indisponible)" : ""}
          </option>
        `).join("");
        if (activeVariant?.id) {
          variantSelect.value = activeVariant.id;
        }
      }
    }

    const addButton = document.querySelector("[data-product-add]");
    const outOfStockMessage = getOutOfStockMessage(showerState, activeVariant);
    if (addButton) {
      if (showerState) {
        addButton.disabled = Boolean(outOfStockMessage);
      } else {
        addButton.disabled = Boolean(outOfStockMessage);
      }
    }

    if (stockMessage) {
      stockMessage.hidden = !outOfStockMessage;
      stockMessage.textContent = outOfStockMessage || "";
    }

    renderSpecSection(
      "[data-dimensions-group]",
      "[data-dimensions]",
      [
        ...(product.metafields.dimensions || []),
        ...(product.metafields.countertop_dimensions || [])
      ]
    );
    renderSpecSection(
      "[data-materials-group]",
      "[data-materials]",
      [
        ...(product.metafields.material || []),
        ...(product.metafields.countertop_material || [])
      ]
    );

    renderGallery();
    renderRecommendations();
  }

  function renderRecommendations() {
    const target = document.querySelector("[data-recommendations]");
    const section = target?.closest(".recommendations");
    if (!target) return;
    const collectionRecommendations = getRelatedProductsFromCollection(product);
    const fallbackRecommendations = (product.recommendations || [])
      .map((handle) => commerce.getProductByHandle(handle))
      .filter(Boolean);
    const recommendations = (collectionRecommendations.length ? collectionRecommendations : fallbackRecommendations)
      .filter((item, index, list) => index === list.findIndex((candidate) => candidate.handle === item.handle));

    if (!recommendations.length) {
      target.innerHTML = "";
      target.classList.remove("recommendation-grid--compact");
      if (section) section.hidden = true;
      return;
    }

    if (section) section.hidden = false;
    target.classList.toggle("recommendation-grid--compact", recommendations.length > 2);

    target.innerHTML = recommendations.map((item) => {
      const image = item.images?.[0] || { src: "", altText: item.title };
      const variantId = item.variants?.find?.((variant) => variant.availableForSale)?.id || item.variants?.[0]?.id;

      return `
      <article class="recommendation-card">
        <a class="recommendation-card__image" href="product.html?handle=${encodeURIComponent(item.handle)}">
          <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.altText)}">
        </a>
        <div class="recommendation-card__content">
          <h3>${escapeHtml(item.title)}</h3>
          <p class="recommendation-card__meta">${escapeHtml(getCollectionSummary(item))}</p>
          <p class="recommendation-card__price">${commerce.formatMoney(item.price)}</p>
          <button class="btn btn--sage recommendation-card__button" type="button" data-recommendation-add="${escapeHtml(variantId || "")}">Ajouter au panier</button>
        </div>
      </article>
    `;
    }).join("");

    target.querySelectorAll("[data-recommendation-add]").forEach((button) => {
      button.addEventListener("click", async () => {
        const variantId = button.dataset.recommendationAdd;
        if (!variantId) return;
        const originalText = button.textContent;
        button.disabled = true;
        try {
          await commerce.addToCart(variantId, 1);
          button.textContent = "Ajouté";
        } catch (error) {
          console.error(error);
          button.textContent = originalText || "Ajouter au panier";
        } finally {
          button.disabled = false;
        }
      });
    });
  }

  function bindProduct() {
    const showerMode = isShowerProduct(product);
    const dimensionSelect = document.querySelector("[data-product-dimension]");
    const installationSelect = document.querySelector("[data-product-installation]");
    const countertopSelect = document.querySelector("[data-product-countertop]");
    const colorSelect = document.querySelector("[data-product-color]");
    const variantSelect = document.querySelector("[data-product-variant]");
    const baseCheckbox = document.querySelector("[data-product-base]");
    const quantityInput = document.querySelector("[data-product-quantity]");
    const addButton = document.querySelector("[data-product-add]");
    const previous = document.querySelector("[data-gallery-prev]");
    const next = document.querySelector("[data-gallery-next]");

    if (showerMode && dimensionSelect && installationSelect && colorSelect) {
      const syncShowerSelection = () => {
        showerDimensionValue = dimensionSelect.value;
        showerInstallationValue = installationSelect.value;
        showerColorValue = colorSelect.value;
        const showerState = getShowerOptionState();
        if (showerState?.doorVariant) {
          selectedVariant = showerState.doorVariant;
        }
        selectedImageIndex = 0;
        renderProduct();
      };

      dimensionSelect.addEventListener("change", syncShowerSelection);
      installationSelect.addEventListener("change", syncShowerSelection);
      colorSelect.addEventListener("change", syncShowerSelection);
      if (baseCheckbox) {
        baseCheckbox.addEventListener("change", () => {
          showerBaseSelected = baseCheckbox.checked;
          renderProduct();
        });
      }
    } else if (countertopSelect && colorSelect) {
      const syncSplitSelection = () => {
        const nextVariant = resolveVariantFromSplitControls(countertopSelect.value, colorSelect.value);
        if (nextVariant) {
          selectedVariant = nextVariant;
        }
        selectedImageIndex = 0;
        renderProduct();
      };

      countertopSelect.addEventListener("change", syncSplitSelection);
      colorSelect.addEventListener("change", syncSplitSelection);
    } else if (variantSelect) {
      variantSelect.addEventListener("change", () => {
        selectedVariant = commerce.getVariantById(variantSelect.value);
        selectedImageIndex = 0;
        renderProduct();
      });
    }

    addButton.addEventListener("click", async () => {
      const originalText = addButton.textContent;
      addButton.disabled = true;
      try {
        const quantity = Number(quantityInput.value || 1);
        const showerState = getShowerOptionState();
        if (showerState) {
          for (const entry of showerState.bundleVariants) {
            await commerce.addToCart(entry.variant.id, quantity);
          }
        } else {
          if (!selectedVariant) return;
          await commerce.addToCart(selectedVariant.id, quantity);
        }
        addButton.textContent = "Ajouté au panier";
        window.setTimeout(() => {
          addButton.textContent = originalText || "Ajouter au panier";
        }, 1000);
      } catch (error) {
        console.error(error);
        addButton.textContent = originalText || "Ajouter au panier";
      } finally {
        addButton.disabled = false;
      }
    });

    previous.addEventListener("click", () => {
      const galleryImages = getGalleryImages();
      if (!galleryImages.length) return;
      selectedImageIndex = (selectedImageIndex - 1 + galleryImages.length) % galleryImages.length;
      renderGallery();
    });

    next.addEventListener("click", () => {
      const galleryImages = getGalleryImages();
      if (!galleryImages.length) return;
      selectedImageIndex = (selectedImageIndex + 1) % galleryImages.length;
      renderGallery();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await commerce.ready;
    resolveSelectedProduct();
    renderProduct();
    bindProduct();
    ui.updateCartBadge();
  });
})();

