(function () {
  const commerce = window.LatelierCommerce;
  const ui = window.LatelierUI;
  const builderState = {
    type: "vanite",
    installation: "",
    width: "36\"",
    design: "Rustique",
    productHandle: "",
    material: "Marbre",
    countertopColor: "Blanc",
    addOns: new Set(["lingerie-bois-naturel"])
  };
  const builderSheetState = {
    open: false,
    imageIndex: 0,
    variantId: "",
    productHandle: ""
  };
  let builderMobileSummaryObserver = null;

  function decodeMojibake(value) {
    const source = String(value ?? "");
    const bytes = Uint8Array.from(source, (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function hasMojibake(value) {
    return /(?:Ã.|Â.|â.|ï¿½|\uFFFD)/.test(String(value ?? ""));
  }

  function normalizeDisplayText(value) {
    let text = String(value ?? "");

    const replacementMap = [
      [/Vanit(?:ï¿½|\uFFFD)/g, "Vanité"],
      [/vanit(?:ï¿½|\uFFFD)/g, "vanité"],
      [/Mat(?:ï¿½|\uFFFD)riel/g, "Matériel"],
      [/mat(?:ï¿½|\uFFFD)riel/g, "matériel"],
      [/Synth(?:ï¿½|\uFFFD)tique/g, "Synthétique"],
      [/synth(?:ï¿½|\uFFFD)tique/g, "synthétique"],
      [/Cr(?:ï¿½|\uFFFD)ez/g, "Créez"],
      [/S(?:ï¿½|\uFFFD)lectionnez/g, "Sélectionnez"],
      [/Compl(?:ï¿½|\uFFFD)tez/g, "Complétez"],
      [/Quantit(?:ï¿½|\uFFFD)/g, "Quantité"],
      [/Estim(?:ï¿½|\uFFFD)/g, "Estimé"],
      [/Cat(?:ï¿½|\uFFFD)gorie/g, "Catégorie"],
      [/cat(?:ï¿½|\uFFFD)gorie/g, "catégorie"],
      [/propos(?:ï¿½|\uFFFD)/g, "proposé"],
      [/compl(?:ï¿½|\uFFFD)ment/g, "complément"],
      [/Mat(?:ï¿½|\uFFFD)riau/g, "Matériau"],
      [/mat(?:ï¿½|\uFFFD)riau/g, "matériau"],
      [/(?:ï¿½|\uFFFD)\s+propos/g, "À propos"]
    ];

    replacementMap.forEach(([pattern, replacement]) => {
      text = text.replace(pattern, replacement);
    });

    let previous = "";
    let passCount = 0;

    while (hasMojibake(text) && text !== previous && passCount < 3) {
      previous = text;
      text = decodeMojibake(text);
      passCount += 1;
    }

    return text;
  }

  function normalizeTextTree(value) {
    if (typeof value === "string") {
      return normalizeDisplayText(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => normalizeTextTree(item));
    }

    if (value && typeof value === "object" && value.constructor === Object) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, normalizeTextTree(item)])
      );
    }

    return value;
  }

  function fixFrenchTextEncoding(root = document.body) {
    if (!root) return;

    const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parentTag = node.parentElement?.tagName;
        if (!node.nodeValue?.trim() || parentTag === "SCRIPT" || parentTag === "STYLE") {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let currentNode = textWalker.nextNode();
    while (currentNode) {
      currentNode.nodeValue = normalizeDisplayText(currentNode.nodeValue);
      currentNode = textWalker.nextNode();
    }

    root.querySelectorAll("*").forEach((element) => {
      ["alt", "aria-label", "title", "placeholder"].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (value) element.setAttribute(attribute, normalizeDisplayText(value));
      });
    });
  }

  const builderConfigs = normalizeTextTree({
    vanite: {
      label: "Meubles de salle de bain",
      typeAliases: ["vanité", "vanity"],
      preview: "Assets/Lifestyle_Hero_V4.png",
      previewAlt: "Meubles de salle de bain bois naturel avec miroir et rangement",
      previewByHandle: {
        "la-bois-naturel-30": "Assets/Lifestyle_Hero_V4.png",
        "vanite-rustique-36": "Assets/Lifestyle_Hero_V4.png",
        "vanite-moderne-36": "Assets/Lifestyle_Hero_V3.png",
        "vanite-rustique-48": "Assets/Lifestyle_Hero_V4.png",
        "vanite-moderne-48": "Assets/Lifestyle_Hero_V3.png",
        "vanite-intemporel-48": "Assets/Lifestyle_Hero_V2.png",
        "vanite-moderne-60": "Assets/Lifestyle_Hero_V3.png",
        "vanite-intemporel-60": "Assets/Lifestyle_Hero_V2.png"
      },
      sizeTitle: "Sélectionnez les dimensions",
      finishTitle: "Sélectionnez le type de comptoir",
      showFinishStep: true,
      showCountertopColorSelector: true,
      sizes: ["30\"", "36\"", "48\"", "60\""],
      defaultWidth: "36\"",
      widths: {
        "30\"": {
          designs: [
            { value: "Rustique", label: "Rustique", image: "Assets/Lifestyle_Hero_V4.png", alt: "Design rustique" }
          ],
          defaultDesign: "Rustique",
          finishes: [
            { type: "Marbre", colors: ["Blanc", "Noir"], defaultColor: "Blanc" }
          ],
          defaultFinish: "Marbre",
          defaultColor: "Blanc"
        },
        "36\"": {
          designs: [
            { value: "Rustique", label: "Rustique", image: "Assets/Lifestyle_Hero_V4.png", alt: "Design rustique" },
            { value: "Moderne", label: "Moderne", image: "Assets/Lifestyle_Hero_V3.png", alt: "Design moderne" }
          ],
          defaultDesign: "Rustique",
          finishes: [
            { type: "Marbre", colors: ["Blanc", "Noir"], defaultColor: "Blanc" },
            { type: "Quartz", colors: ["Blanc", "Gris"], defaultColor: "Blanc" }
          ],
          defaultFinish: "Marbre",
          defaultColor: "Blanc"
        },
        "48\"": {
          designs: [
            { value: "Rustique", label: "Rustique", image: "Assets/Lifestyle_Hero_V4.png", alt: "Design rustique" },
            { value: "Moderne", label: "Moderne", image: "Assets/Lifestyle_Hero_V3.png", alt: "Design moderne" },
            { value: "Intemporel", label: "Intemporel", image: "Assets/Lifestyle_Hero_V2.png", alt: "Design intemporel" }
          ],
          defaultDesign: "Rustique",
          finishes: [
            { type: "Marbre", colors: ["Blanc", "Noir"], defaultColor: "Blanc" },
            { type: "Quartz", colors: ["Blanc", "Gris"], defaultColor: "Blanc" },
            { type: "Porcelaine", colors: ["Blanc"], defaultColor: "Blanc" }
          ],
          defaultFinish: "Marbre",
          defaultColor: "Blanc"
        },
        "60\"": {
          designs: [
            { value: "Moderne", label: "Moderne", image: "Assets/Lifestyle_Hero_V3.png", alt: "Design moderne" },
            { value: "Intemporel", label: "Intemporel", image: "Assets/Lifestyle_Hero_V2.png", alt: "Design intemporel" }
          ],
          defaultDesign: "Moderne",
          finishes: [
            { type: "Marbre", colors: ["Blanc"], defaultColor: "Blanc" },
            { type: "Porcelaine", colors: ["Blanc", "Noir"], defaultColor: "Blanc" }
          ],
          defaultFinish: "Marbre",
          defaultColor: "Blanc"
        }
      },
      addonTitle: "Complétez votre ensemble",
      addons: [
        { handle: "cabinet-mural-bois-naturel", label: "Armoire murale", image: "Assets/Lifestyle_Hero_V3.png", alt: "Armoire murale" },
        { handle: "lingerie-bois-naturel", label: "Lingerie", image: "Assets/Lifestyle_Hero_V2.png", alt: "Lingerie" }
      ],
      defaultAddOns: ["lingerie-bois-naturel"],
      getProductHandle() {
        const vanityHandles = {
          "30\"": { Rustique: "la-bois-naturel-30" },
          "36\"": {
            Rustique: "vanite-rustique-36",
            Moderne: "vanite-moderne-36"
          },
          "48\"": {
            Rustique: "vanite-rustique-48",
            Moderne: "vanite-moderne-48",
            Intemporel: "vanite-intemporel-48"
          },
          "60\"": {
            Moderne: "vanite-moderne-60",
            Intemporel: "vanite-intemporel-60"
          }
        };
        const handlesForWidth = vanityHandles[builderState.width] || vanityHandles["48\""];
        return handlesForWidth[builderState.design] || handlesForWidth.Rustique || "vanite-rustique-48";
      }
    },
    douche: {
      label: "Douche",
      typeAliases: ["douche", "shower"],
      preview: "Assets/Freestanding_lifestyle.png",
      previewAlt: "Douche porte pivotante avec cadre noir",
      installationTitle: "Type d'installation",
      sizeTitle: "Sélectionnez les dimensions",
      finishTitle: "Sélectionnez la couleur",
      showFinishStep: true,
      showCountertopColorSelector: false,
      showInstallationStep: true,
      installations: [
        { value: "corner", label: "En coin", aliases: ["Coin", "En coin"] },
        { value: "alcove", label: "Alcove", aliases: ["Alcove"] }
      ],
      defaultInstallation: "alcove",
      sizes: [],
      defaultWidth: "",
      designs: [
        { value: "Porte pivotante", label: "Porte pivotante", image: "Assets/Freestanding_lifestyle.png", alt: "Douche porte pivotante" },
        { value: "Ronde", label: "Ronde", image: "Assets/Freestanding_lifestyle.png", alt: "Douche ronde" },
        { value: "Ensemble complet", label: "Ensemble complet", image: "Assets/Freestanding_lifestyle.png", alt: "Douche ensemble complet" }
      ],
      defaultDesign: "Porte pivotante",
      finishes: ["Noir", "Chrome"],
      defaultFinish: "Noir",
      addonTitle: "Complétez votre ensemble",
      addons: [],
      defaultAddOns: [],
      getProductHandle() {
        const widthToken = extractWidthToken(builderState.width) || builderState.width;
        return builderState.design === "Ronde" && widthToken === "36\"" ? "la-ronde" : "la-porte-pivotante";
      }
    },    baignoire: {
      label: "Baignoire",
      typeAliases: ["baignoire", "bathtub", "bath"],
      preview: "Assets/Freestanding_lifestyle.png",
      previewAlt: "Baignoire autoportante en ambiance chaleureuse",
      installationTitle: "Type d'installation",
      sizeTitle: "Sélectionnez les dimensions",
      showInstallationStep: true,
      showFinishStep: false,
      showCountertopColorSelector: false,
      installations: [
        {
          value: "auto-portant",
          label: "Auto-Portant",
          aliases: [
            "Auto-Portant",
            "Auto Portant",
            "Autoportant",
            "Auto-Portante",
            "Auto Portante",
            "Autoportante"
          ]
        },
        { value: "jupe", label: "À jupe", aliases: ["À jupe", "A jupe", "Jupe"] }
      ],
      defaultInstallation: "auto-portant",
      sizes: ["58\"", "66\""],
      defaultWidth: "58\"",
      designs: [
        { value: "Signature", label: "Signature", image: "Assets/Freestanding_lifestyle.png", alt: "Baignoire Signature" },
        { value: "Indra", label: "Indra", image: "Assets/Freestanding_lifestyle.png", alt: "Baignoire Indra" },
        { value: "Relax", label: "Relax", image: "Assets/Freestanding_lifestyle.png", alt: "Baignoire Relax" }
      ],
      defaultDesign: "Signature",
      finishTitle: "Sélectionnez la finition",
      finishes: ["Blanc"],
      defaultFinish: "Blanc",
      addonTitle: "Complétez votre ensemble",
      addons: [],
      defaultAddOns: [],
      getProductHandle() {
        return builderState.width === "58\"" || builderState.width === "59\""
          ? "indra-autoportante"
          : "signature-autoportante";
      }
    },
    toilette: {
      label: "Toilette",
      typeAliases: ["toilette", "toilet"],
      preview: "Assets/Lifestyle_Hero_V2.png",
      previewAlt: "Toilette intelligente blanche",
      sizeTitle: "Sélectionnez le type de toilette",
      showFinishStep: false,
      showCountertopColorSelector: false,
      sizes: ["Toilette intelligente", "Deux pièce", "Monopièce"],
      defaultWidth: "Toilette intelligente",
      designs: [
        { value: "Intelligente", label: "Intelligente", image: "Assets/Lifestyle_Hero_V2.png", alt: "Toilette intelligente" }
      ],
      defaultDesign: "Intelligente",
      finishTitle: "Sélectionnez la finition",
      finishes: ["Blanc"],
      defaultFinish: "Blanc",
      addonTitle: "Complétez votre ensemble",
      addons: [],
      defaultAddOns: [],
      getProductHandle() {
        return "toilette-intelligente-blanc";
      }
    }
  });

  function normalizeSearchText(value) {
    return String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function extractWidthToken(value) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!text) return "";

    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:["â€]|in)?\s*(?:[xÃ—]|$)/i);
    return match?.[1] ? `${match[1]}"` : "";
  }

  function flattenMetafieldRows(rows) {
    return (rows || []).flatMap((row) => (Array.isArray(row) ? row : [row?.label, row?.value]).filter(Boolean));
  }

  function extractWidthToken(value) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!text) return "";

    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:["”]|in)?\s*(?:[x×]|$)/i);
    return match?.[1] ? `${match[1]}"` : "";
  }

  function getProductMetafieldValue(product, key) {
    const metafields = product?.metafields;
    if (!metafields || typeof metafields !== "object") return "";

    const normalizedKey = normalizeSearchText(key);
    const entry = Object.entries(metafields).find(([fieldKey]) => normalizeSearchText(fieldKey) === normalizedKey);
    const value = entry?.[1];
    if (Array.isArray(value)) return "";
    return String(value ?? "").trim();
  }

  function getProductMetafieldRowValue(rows, pattern) {
    const normalizedPattern = pattern instanceof RegExp ? pattern : new RegExp(String(pattern), "i");
    const match = (rows || [])
      .map((row) => (Array.isArray(row) ? { label: row[0], value: row[1] } : row))
      .find((row) => normalizedPattern.test(normalizeSearchText(row?.label || "")));
    return String(match?.value || "").trim();
  }

  function getProductDimensionLabel(product) {
    const width = getProductMetafieldValue(product, "width");
    const length = getProductMetafieldValue(product, "length");
    if (width && length) return `${width} x ${length}`;

    const dimensionRows = product?.metafields?.dimensions || [];
    const rowWidth = getProductMetafieldRowValue(dimensionRows, /width|largeur/i) || width;
    const rowLength = getProductMetafieldRowValue(dimensionRows, /length|longueur/i) || length;
    if (rowWidth && rowLength) return `${rowWidth} x ${rowLength}`;

    const rawValues = flattenMetafieldRows(dimensionRows).map((value) => String(value).trim()).filter(Boolean);
    return rawValues.join(" x ") || rowWidth || rowLength || "";
  }

  function getBuilderWidthTokens(product) {
    const tokens = new Set();
    const widthText = getProductMetafieldValue(product, "width");
    const dimensionLabel = getProductDimensionLabel(product);
    const sources = widthText || dimensionLabel
      ? [
          widthText,
          dimensionLabel,
          product?.title,
          product?.handle,
          ...(product?.options || []).flatMap((option) => [option.name, ...(option.values || [])])
        ]
      : [
          ...flattenMetafieldRows(product?.metafields?.dimensions),
          product?.title,
          product?.handle,
          ...(product?.options || []).flatMap((option) => [option.name, ...(option.values || [])])
        ];

    sources.forEach((value) => {
      const token = extractWidthToken(value);
      if (token) tokens.add(token);
    });

    return [...tokens];
  }

  function getProductSearchText(product) {
    const optionValues = (product?.options || []).flatMap((option) => [option.name, ...(option.values || [])]);
    const metafieldRows = [
      ...(product?.metafields?.dimensions || []),
      ...(product?.metafields?.material || [])
    ].flatMap((row) => (Array.isArray(row) ? row : [row?.label, row?.value]).filter(Boolean));
    const dimensionLabel = getProductDimensionLabel(product);
    const widthTokens = getProductWidthTokens(product);

    return normalizeSearchText([
      ui.getProductTopTypeLabel(product),
      ui.getProductSubtypeLabel(product),
      product?.productType,
      ui.getProductTypeLabel(product),
      product?.title,
      product?.handle,
      ...(product?.tags || []),
      ...(product?.collections || []),
      ...optionValues,
      ...metafieldRows,
      dimensionLabel,
      ...widthTokens
    ].join(" "));
  }

  function getProductWidthTokens(product) {
    const dimensionsRows = product?.metafields?.dimensions || [];
    const tokens = [];

    dimensionsRows.forEach((row) => {
      const value = Array.isArray(row) ? row[1] : row?.value;
      const text = String(value || "").trim();
      if (!text) return;

      const match = text.match(/^\s*([0-9]+(?:\.[0-9]+)?)\s*"?\s*(?:[xÃ—]|$)/i);
      if (match?.[1]) {
        tokens.push(`${match[1]}"`);
      }
    });

    return [...new Set(tokens)];
  }

  function scoreBuilderProduct(product, config) {
    const searchText = getProductSearchText(product);
    const widthTokens = new Set(getBuilderWidthTokens(product).map(normalizeSearchText));
    const typeLabel = normalizeSearchText(config.label);
    const design = normalizeSearchText(builderState.design);
    const width = normalizeSearchText(builderState.width);
    const topType = normalizeSearchText(ui.getProductTopTypeLabel(product));
    const subtype = normalizeSearchText(ui.getProductSubtypeLabel(product));
    let score = 0;

    if (product.source === "shopify") score += 15;
    if (normalizeSearchText(ui.getProductTypeLabel(product)).includes(typeLabel)) score += 25;
    if (topType.includes(typeLabel)) score += 15;
    if (subtype.includes(typeLabel)) score += 10;
    if (normalizeSearchText(product.title).includes(typeLabel) || normalizeSearchText(product.handle).includes(typeLabel)) score += 5;
    if (width && widthTokens.has(width)) score += 80;
    else if (width && searchText.includes(width)) score += 45;
    if (design && searchText.includes(design)) score += 18;

    return score;
  }

  function resolveBuilderProduct(type = builderState.type) {
    const config = getBuilderConfig(type);
    const typeLabel = normalizeSearchText(config.label);
    const width = normalizeSearchText(builderState.width);
    let candidates = commerce.getProducts().filter((product) => {
      const searchText = getProductSearchText(product);
      return searchText.includes(typeLabel) || normalizeSearchText(ui.getProductTypeLabel(product)).includes(typeLabel);
    });

    if (width) {
      const widthMatches = candidates.filter((product) => getBuilderWidthTokens(product).some((token) => normalizeSearchText(token) === width));
      if (widthMatches.length) {
        candidates = widthMatches;
      }
    }

    const scoredCandidates = candidates
      .map((product) => ({ product, score: scoreBuilderProduct(product, config) }))
      .sort((a, b) => {
        const scoreDelta = b.score - a.score;
        if (scoreDelta) return scoreDelta;
        return Number(Boolean(b.product.source === "shopify")) - Number(Boolean(a.product.source === "shopify"));
      });

    return scoredCandidates[0]?.product || null;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getImageSrc(image, fallback = "") {
    if (typeof image === "string") {
      return image.trim() || fallback;
    }
    return String(image?.src || image?.url || fallback || "").trim();
  }

  function getBuilderPreviewAsset(selectedProduct, designOptions, config) {
    const { variant: selectedVariant } = getBuilderBaseSelection();
    const previewByHandle = config.previewByHandle || {};
    const selectedHandle = selectedProduct?.handle || builderState.productHandle || "";
    const selectedDesignOption = designOptions.find((option) => option.handle === selectedHandle) || null;
    const fallbackImage = getImageSrc(
      selectedProduct?.images?.[0],
      getImageSrc(
        selectedDesignOption?.images?.[0],
        getImageSrc(
          selectedDesignOption?.image || previewByHandle[selectedHandle],
          getImageSrc(designOptions?.[0]?.image, config.preview)
        )
      )
    );

    return {
      image: getImageSrc(selectedVariant?.image, fallbackImage),
      alt:
        selectedVariant?.image?.altText
        || selectedProduct?.images?.[0]?.altText
        || selectedProduct?.title
        || selectedDesignOption?.alt
        || designOptions?.[0]?.alt
        || config.previewAlt
    };
  }

  function normalizeProductSpecRows(rows) {
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

  function formatVariantLabel(variant) {
    if (!variant) return "";
    const title = String(variant.title || "").trim();
    if (title && title !== "Default Title") return title;
    return (variant.selectedOptions || [])
      .map((option) => option.value)
      .filter(Boolean)
      .join(" / ");
  }

  function getBuilderSheetSelectedProduct(productHandle = "") {
    return commerce.getProductByHandle(productHandle || builderSheetState.productHandle || getBuilderProductHandle()) || resolveBuilderProduct() || null;
  }

  function getBuilderSheetSelectedVariant(product) {
    const { variant } = getBuilderBaseSelection();
    const selected = builderSheetState.variantId
      ? commerce.getVariantById(builderSheetState.variantId)
      : variant;
    if (selected && product?.variants?.some((item) => item.id === selected.id)) {
      return selected;
    }
    return product?.variants?.find((item) => item.availableForSale) || product?.variants?.[0] || selected || null;
  }

  function getBuilderSheetGalleryImages(product, variant) {
    const productImages = (product?.images || []).filter(Boolean);
    const variantImageSources = new Set(
      (product?.variants || [])
        .map((item) => getImageSrc(item?.image))
        .filter(Boolean)
    );
    const baseImages = productImages.filter((image) => !variantImageSources.has(getImageSrc(image)));
    const selectedVariantImage = variant?.image && getImageSrc(variant.image)
      ? [{
          src: getImageSrc(variant.image),
          altText: String(variant.image.altText || product?.title || "").trim()
        }]
      : [];

    return [...selectedVariantImage, ...baseImages];
  }

  function getBuilderSheetProductImage(product, galleryImages, imageIndex = 0) {
    const fallbackImage = galleryImages[imageIndex] || galleryImages[0] || { src: "", altText: product?.title || "" };
    const image = fallbackImage;
    return {
      src: getImageSrc(image),
      alt: String(image?.altText || product?.title || "").trim()
    };
  }

  function closeBuilderProductSheet() {
    const sheet = document.querySelector("[data-builder-product-sheet]");
    if (!sheet) return;
    builderSheetState.open = false;
    sheet.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openBuilderProductSheet(productHandle = "") {
    const product = getBuilderSheetSelectedProduct(productHandle);
    if (!product) return;
    const variant = getBuilderSheetSelectedVariant(product);
    builderSheetState.open = true;
    builderSheetState.productHandle = product.handle || productHandle || builderSheetState.productHandle || "";
    builderSheetState.variantId = variant?.id || "";
    builderSheetState.imageIndex = 0;
    renderBuilderProductSheet();
    const sheet = document.querySelector("[data-builder-product-sheet]");
    if (!sheet) return;
    sheet.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => {
      sheet.querySelector(".builder-product-sheet__close")?.focus?.();
    }, 0);
  }

  function renderBuilderProductSheet() {
    const sheet = document.querySelector("[data-builder-product-sheet]");
    const content = document.querySelector("[data-builder-product-sheet-content]");
    if (!sheet || !content) return;

    const product = getBuilderSheetSelectedProduct(builderSheetState.productHandle);
    if (!product) {
      content.innerHTML = "";
      closeBuilderProductSheet();
      return;
    }

    const selectedVariant = getBuilderSheetSelectedVariant(product);
    const galleryImages = getBuilderSheetGalleryImages(product, selectedVariant);
    const activeImage = getBuilderSheetProductImage(product, galleryImages, builderSheetState.imageIndex);
    const dimensionsRows = normalizeProductSpecRows([
      ...(product.metafields?.dimensions || []),
      ...(product.metafields?.countertop_dimensions || [])
    ]);
    const materialsRows = normalizeProductSpecRows([
      ...(product.metafields?.material || []),
      ...(product.metafields?.countertop_material || [])
    ]);
    const note = String(product.metafields?.note || "").trim();

    content.innerHTML = normalizeDisplayText(`
      <div class="builder-product-sheet__gallery">
        <div class="builder-product-sheet__thumbs">
          ${galleryImages.map((image, index) => `
            <button class="builder-product-sheet__thumb${index === builderSheetState.imageIndex ? " is-active" : ""}" type="button" data-builder-sheet-thumb-index="${index}">
              <img src="${escapeHtml(getImageSrc(image))}" alt="${escapeHtml(image?.altText || product.title)}">
            </button>
          `).join("")}
        </div>
        <div class="builder-product-sheet__main">
          <img src="${escapeHtml(activeImage.src)}" alt="${escapeHtml(activeImage.alt)}">
          ${galleryImages.length > 1 ? `
            <div class="builder-product-sheet__arrows">
              <button class="round-button" type="button" data-builder-sheet-prev aria-label="Image précédente">&lt;</button>
              <button class="round-button" type="button" data-builder-sheet-next aria-label="Image suivante">&gt;</button>
            </div>
          ` : ""}
        </div>
      </div>
      <div class="builder-product-sheet__info">
        <span class="builder-product-sheet__eyebrow">${escapeHtml(ui.getProductTypeLabel(product) || product.productType || "")}</span>
        <h2 id="builder-product-sheet-title">${escapeHtml(product.title)}</h2>
        <div class="builder-product-sheet__price">${escapeHtml(commerce.formatMoney(selectedVariant?.price || product.price))}</div>
        <p class="builder-product-sheet__description">${escapeHtml(product.description || "")}</p>
        ${dimensionsRows.length ? `
          <div class="spec-group">
            <h3>Dimensions</h3>
            <div class="spec-table">
              ${dimensionsRows.map(([label, value]) => `
                <div class="spec-row">
                  <strong>${escapeHtml(label)}</strong>
                  <span>${escapeHtml(value)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}
        ${materialsRows.length ? `
          <div class="spec-group">
            <h3>Matériel</h3>
            <div class="spec-table">
              ${materialsRows.map(([label, value]) => `
                <div class="spec-row">
                  <strong>${escapeHtml(label)}</strong>
                  <span>${escapeHtml(value)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}
        ${note ? `<p class="included-note">${escapeHtml(note)}</p>` : ""}
      </div>
    `);
  }

  function getVanityVariantOptions(product) {
    const options = (Array.isArray(product?.options) ? product.options : [])
      .filter((option) => Array.isArray(option.values) && option.values.length)
      .filter((option) => !/dimension|width|size/i.test(String(option?.name || "")));
    const optionStats = options.map((option) => {
      const uniqueValues = new Set(
        (product?.variants || [])
          .map((variant) => getVariantOptionValue(variant, option.name))
          .filter(Boolean)
      );
      const normalizedName = normalizeSearchText(option.name);
      const materialNameScore = /type de comptoir|countertop type|material|finition|finish|comptoir/i.test(normalizedName) ? 2 : 0;
      const colorNameScore = /color|couleur/i.test(normalizedName) ? 2 : 0;
      return {
        option,
        uniqueCount: uniqueValues.size,
        materialNameScore,
        colorNameScore
      };
    });

    const materialOption =
      optionStats
        .filter((stat) => stat.materialNameScore > 0)
        .sort((a, b) => b.materialNameScore - a.materialNameScore || a.uniqueCount - b.uniqueCount)[0]?.option
      || optionStats
        .slice()
        .sort((a, b) => a.uniqueCount - b.uniqueCount || a.colorNameScore - b.colorNameScore)[0]?.option
      || null;

    const colorOption =
      optionStats
        .filter((stat) => stat.option !== materialOption)
        .filter((stat) => stat.colorNameScore > 0)
        .sort((a, b) => b.colorNameScore - a.colorNameScore || a.uniqueCount - b.uniqueCount)[0]?.option
      || optionStats.find((stat) => stat.option !== materialOption)?.option
      || null;

    return {
      primary: materialOption,
      secondary: colorOption,
      material: materialOption,
      color: colorOption
    };
  }

  function getVariantOptionValue(variant, optionName) {
    return variant?.selectedOptions?.find((option) => option.name === optionName)?.value || "";
  }

  function getVariantOptionValues(product, optionName, filters = {}) {
    if (!optionName) return [];

    return [...new Set((product?.variants || [])
      .filter((variant) => variant.availableForSale !== false)
      .filter((variant) => Object.entries(filters).every(([filterName, filterValue]) => {
        if (!filterValue) return true;
        const candidateValue = getVariantOptionValue(variant, filterName);
        return Array.isArray(filterValue)
          ? filterValue.some((value) => candidateValue === value)
          : candidateValue === filterValue;
      }))
      .map((variant) => getVariantOptionValue(variant, optionName))
      .filter(Boolean))];
  }

  function getInStockVariants(product) {
    return (product?.variants || []).filter((variant) => variant?.availableForSale !== false);
  }

  function hasInStockVariants(product) {
    return getInStockVariants(product).length > 0;
  }

  function isVariantDrivenVanityProduct(product) {
    return Boolean(product?.source === "shopify" && getVanityVariantOptions(product).secondary);
  }

  function getVanityProductVariantRichness(product) {
    if (!product) return 0;
    const { primary, secondary } = getVanityVariantOptions(product);
    const primaryValues = getVariantOptionValues(product, primary?.name);
    const secondaryValues = secondary
      ? getVariantOptionValues(product, secondary.name, primary?.name ? { [primary.name]: primaryValues[0] } : {})
      : [];

    let score = 0;
    if (isVariantDrivenVanityProduct(product)) score += 100;
    score += Math.min(primaryValues.length, 10) * 10;
    score += Math.min(secondaryValues.length, 10) * 5;
    score += Math.min((product.variants || []).length, 20);
    return score;
  }

  function getBuilderTypeKeyFromLabel(label) {
    const normalized = normalizeSearchText(label);
    if (normalized.includes("vanit") || normalized.includes("meubles de salle de bain")) return "vanite";
    if (normalized.includes("lavabo")) return "lavabo";
    if (normalized.includes("douche")) return "douche";
    if (normalized.includes("baignoire")) return "baignoire";
    if (normalized.includes("toilette")) return "toilette";
    return ui.slugifyTaxonomyValue(label);
  }

  function getAvailableBuilderTypeOptions() {
    const groups = ui.buildProductTaxonomy(commerce.getProducts().filter(hasInStockVariants));
    const options = [];
    const seenTypes = new Set();

    groups.forEach((group) => {
      const type = getBuilderTypeKeyFromLabel(group.label);
      if (!type || seenTypes.has(type)) return;
      seenTypes.add(type);
      options.push({
        type,
        label: group.label,
        key: group.key,
        products: group.products || []
      });
    });

    return options;
  }

  function getBuilderDynamicOption(type = builderState.type) {
    return getAvailableBuilderTypeOptions().find((option) => option.type === type) || null;
  }

  function ensureBuilderTypeSelection(preferredType = builderState.type) {
    const options = getAvailableBuilderTypeOptions();
    if (!options.length) return options;

    builderState.type = options.some((option) => option.type === preferredType)
      ? preferredType
      : options[0].type;
    return options;
  }

  function getBuilderConfig(type = builderState.type) {
    if (builderConfigs[type]) return builderConfigs[type];

    const dynamicOption = getBuilderDynamicOption(type);
    const label = dynamicOption?.label || type;
    return {
      label,
      typeAliases: [label],
      preview: getBuilderCategoryPlaceholder(label),
      previewAlt: label,
      sizeTitle: "Sélectionnez les dimensions",
      finishTitle: "Sélectionnez l'option",
      showFinishStep: true,
      showCountertopColorSelector: false,
      showInstallationStep: false,
      sizes: [],
      defaultWidth: "",
      defaultDesign: "",
      finishes: [],
      defaultFinish: "",
      addonTitle: "Complétez votre ensemble",
      addons: [],
      defaultAddOns: []
    };
  }

  function getVanityWidthConfig(width = builderState.width) {
    const config = builderConfigs.vanite;
    return config.widths[width] || config.widths[config.defaultWidth];
  }

  function normalizeSearchText(value) {
    return String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function extractWidthToken(value) {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!text) return "";

    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:["\u201d]|in)?/i);
    return match?.[1] ? `${match[1]}"` : "";
  }

  function flattenMetafieldRows(rows) {
    return (rows || []).flatMap((row) => (Array.isArray(row) ? row : [row?.label, row?.value]).filter(Boolean));
  }

  function collectTextValues(value) {
    if (Array.isArray(value)) {
      return flattenMetafieldRows(value);
    }

    const text = String(value ?? "").trim();
    return text ? [text] : [];
  }

  function isVanityProduct(product) {
    const topType = normalizeSearchText(ui.getProductTopTypeLabel(product));
    const subtype = normalizeSearchText(ui.getProductSubtypeLabel(product));
    return topType.includes("meubles de salle de bain") && subtype.includes("vanit");
  }

  function getProductWidthTokens(product) {
    const tokens = new Set();
    const optionValues = (product?.options || [])
      .filter((option) => /dimension|width|size/i.test(String(option?.name || "")))
      .flatMap((option) => option.values || []);
    const widthText = getProductMetafieldValue(product, "width");
    const dimensionLabel = getProductDimensionLabel(product);
    const sources = widthText || dimensionLabel
      ? [
          widthText,
          dimensionLabel,
          ...optionValues,
          product?.title,
          product?.handle
        ]
      : [
          ...optionValues,
          ...flattenMetafieldRows(product?.metafields?.dimensions),
          product?.title,
          product?.handle
        ];

    sources.forEach((value) => {
      const token = extractWidthToken(value);
      if (token) tokens.add(token);
    });

    return [...tokens];
  }

  function getVanityProducts() {
    return commerce.getProducts().filter(isVanityProduct).filter(hasInStockVariants);
  }

  function sortWidthTokens(widths) {
    return [...new Set(widths)].sort((a, b) => {
      const aValue = Number.parseFloat(String(a).replace(/[^0-9.]/g, "")) || Number.POSITIVE_INFINITY;
      const bValue = Number.parseFloat(String(b).replace(/[^0-9.]/g, "")) || Number.POSITIVE_INFINITY;
      if (aValue !== bValue) return aValue - bValue;
      return String(a).localeCompare(String(b));
    });
  }

  function getVanityWidths() {
    const widths = getVanityProducts().flatMap((product) => getProductWidthTokens(product));
    const sorted = sortWidthTokens(widths);
    return sorted.length ? sorted : (builderConfigs.vanite.sizes || []);
  }

  function getDefaultVanityWidth() {
    return getVanityWidths()[0] || builderConfigs.vanite.defaultWidth || builderState.width;
  }

  function getVanityProductsForWidth(width = builderState.width) {
    const normalizedWidth = normalizeSearchText(width);
    const products = getVanityProducts().filter((product) => (
      getProductWidthTokens(product).some((token) => normalizeSearchText(token) === normalizedWidth)
    ));

    return products.sort((a, b) => {
      const sourceDelta = Number(Boolean(b.source === "shopify")) - Number(Boolean(a.source === "shopify"));
      if (sourceDelta) return sourceDelta;
      const richnessDelta = getVanityProductVariantRichness(b) - getVanityProductVariantRichness(a);
      if (richnessDelta) return richnessDelta;
      return String(a.title).localeCompare(String(b.title));
    });
  }

  function getSelectedVanityProduct(width = builderState.width) {
    const current = builderState.productHandle ? commerce.getProductByHandle(builderState.productHandle) : null;
    const currentMatchesWidth = current
      && hasInStockVariants(current)
      && getProductWidthTokens(current).some((token) => normalizeSearchText(token) === normalizeSearchText(width));
    if (currentMatchesWidth) {
      return current;
    }

    const candidates = getVanityProductsForWidth(width);
    if (!candidates.length) return currentMatchesWidth ? current : null;

    const best = candidates[0];
    if (currentMatchesWidth && current && getVanityProductVariantRichness(current) >= getVanityProductVariantRichness(best)) {
      return current;
    }

    return best;
  }

  function getRelatedProductsFromCollection(currentProduct) {
    if (!currentProduct) return [];

    const defaultCollectionHandles = new Set(["all", "vanites", "douches", "baignoires", "toilettes"]);
    const handles = Array.isArray(currentProduct?.collections) && currentProduct.collections.length
      ? currentProduct.collections
      : [currentProduct?.collection].filter(Boolean);
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

  function ensureVanityProductSelection(width = builderState.width) {
    const selected = getSelectedVanityProduct(width);
    if (selected?.handle) {
      builderState.productHandle = selected.handle;
    }
    return selected;
  }

  function getBuilderTypeMeta(type = builderState.type) {
    const map = {
      vanite: { label: "Meubles de salle de bain", collection: "vanites" },
      lavabo: { label: "Lavabos", collection: "lavabos" },
      douche: { label: "Douche", collection: "douches" },
      baignoire: { label: "Baignoire", collection: "baignoires" },
      toilette: { label: "Toilette", collection: "toilettes" }
    };
    const dynamicOption = getBuilderDynamicOption(type);
    return map[type] || {
      label: dynamicOption?.label || type,
      collection: dynamicOption?.key || ui.slugifyTaxonomyValue(dynamicOption?.label || type)
    };
  }
  function getBuilderTypeAliases(type = builderState.type) {
    const config = getBuilderConfig(type);
    const aliases = [
      config.label,
      ...(config.typeAliases || []),
      getBuilderTypeMeta(type).label
    ];

    if (type === "vanite") {
      aliases.push("Vanité", "Vanite", "Meubles de salle de bain");
    }

    if (type === "lavabo") {
      aliases.push("Lavabo", "Lavabos");
    }

    return [...new Set([
      ...aliases
    ].map(normalizeSearchText).filter(Boolean))];
  }

  function getNormalizedProductCollections(product) {
    const handles = Array.isArray(product?.collections) && product.collections.length
      ? product.collections
      : [product?.collection].filter(Boolean);
    return handles.map(normalizeSearchText);
  }

  function matchesBuilderProductType(product, type = builderState.type) {
    const aliases = getBuilderTypeAliases(type);
    const label = normalizeSearchText(ui.getProductTypeLabel(product));
    const topType = normalizeSearchText(ui.getProductTopTypeLabel(product));
    const subtype = normalizeSearchText(ui.getProductSubtypeLabel(product));
    const tags = (product?.tags || []).map(normalizeSearchText);
    const collections = getNormalizedProductCollections(product);

    if (type === "vanite") {
      return (topType.includes("meubles de salle de bain") && subtype.includes("vanit"))
        || topType.includes("vanit")
        || label.includes("vanit");
    }

    if (type === "lavabo") {
      return topType.includes("lavabos");
    }

    return aliases.some((alias) => (
      label.includes(alias)
      || topType.includes(alias)
      || subtype.includes(alias)
      || tags.includes(alias)
      || collections.includes(alias)
    ));
  }

  function getBuilderTypeProducts(type = builderState.type) {
    if (!builderConfigs[type]) {
      const dynamicOption = getBuilderDynamicOption(type);
      return (dynamicOption?.products || [])
        .filter(hasInStockVariants)
        .sort((a, b) => {
          const sourceDelta = Number(Boolean(b.source === "shopify")) - Number(Boolean(a.source === "shopify"));
          if (sourceDelta) return sourceDelta;
          return String(a.title || "").localeCompare(String(b.title || ""), "fr-CA");
        });
    }

    return commerce.getProducts()
      .filter((product) => matchesBuilderProductType(product, type))
      .filter(hasInStockVariants)
      .sort((a, b) => {
        const sourceDelta = Number(Boolean(b.source === "shopify")) - Number(Boolean(a.source === "shopify"));
        if (sourceDelta) return sourceDelta;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });
  }
  function getBuilderProductWidthOption(product) {
    return (product?.options || []).find((option) => /dimension|dimensions|width|largeur|size|format/i.test(String(option?.name || ""))) || null;
  }

  function getBuilderProductDimensionOption(product) {
    return getBuilderProductWidthOption(product);
  }

  function getBuilderProductInstallationOption(product) {
    return (product?.options || []).find((option) => /installation|install/i.test(String(option?.name || ""))) || null;
  }

  function getBuilderProductVariantOption(product) {
    const options = product?.options || [];
    const preferred = options.find((option) => /type de comptoir|countertop|couleur|color|finish|finition|material|materiau/i.test(String(option?.name || "")));
    if (preferred) return preferred;

    return options.find((option) => !/dimension|dimensions|width|largeur|size|format|installation|install/i.test(String(option?.name || ""))) || null;
  }

  function getBuilderInstallationValues(installation = builderState.installation, type = builderState.type) {
    const config = getBuilderConfig(type);
    const match = (config.installations || []).find((item) => item.value === installation);
    if (!match) return installation ? [installation] : [];
    return [...new Set([match.label, ...(match.aliases || [])].map((value) => String(value || "").trim()).filter(Boolean))];
  }

  function getBuilderInstallationLabel(installation = builderState.installation, type = builderState.type) {
    const config = getBuilderConfig(type);
    return (config.installations || []).find((item) => item.value === installation)?.label || installation || "";
  }

  function getBuilderNumericTokens(value) {
    return String(value || "").match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  }

  function sortBuilderSizeLabels(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => {
      const aNumbers = getBuilderNumericTokens(a);
      const bNumbers = getBuilderNumericTokens(b);
      const maxLength = Math.max(aNumbers.length, bNumbers.length);
      for (let index = 0; index < maxLength; index += 1) {
        const aValue = aNumbers[index] ?? Number.POSITIVE_INFINITY;
        const bValue = bNumbers[index] ?? Number.POSITIVE_INFINITY;
        if (aValue !== bValue) return aValue - bValue;
      }
      return String(a).localeCompare(String(b));
    });
  }

  function getBuilderBathSizeLabel(product) {
    const width = getProductMetafieldValue(product, "width");
    const length = getProductMetafieldValue(product, "length");
    if (width && length) return `${width} x ${length}`;
    return getProductDimensionLabel(product);
  }

  function getBuilderProductSupportsInstallation(product, installation = builderState.installation, type = builderState.type) {
    const config = getBuilderConfig(type);
    if (!config.showInstallationStep) return true;

    const acceptedValues = getBuilderInstallationValues(installation, type).map(normalizeSearchText);
    if (!acceptedValues.length) return true;

    const installationOption = getBuilderProductInstallationOption(product);
    if (!installationOption?.name) return true;

    const optionValues = getVariantOptionValues(product, installationOption.name);
    const normalizedValues = optionValues.length ? optionValues.map(normalizeSearchText) : (installationOption.values || []).map(normalizeSearchText);
    return normalizedValues.some((value) => acceptedValues.includes(value));
  }

  function getBuilderProductSizeLabels(product, type = builderState.type, installation = builderState.installation) {
    if (!product) return [];

    if (type === "toilette") {
      const option = getBuilderProductVariantOption(product);
      return option?.values?.slice() || [];
    }

    if (type === "baignoire") {
      const sizeLabel = getBuilderBathSizeLabel(product);
      return sizeLabel ? [sizeLabel] : [];
    }

    const dimensionOption = getBuilderProductDimensionOption(product);
    if (dimensionOption?.name) {
      const filters = {};
      const installationOption = getBuilderProductInstallationOption(product);
      if (installationOption?.name && getBuilderConfig(type).showInstallationStep) {
        filters[installationOption.name] = getBuilderInstallationValues(installation, type);
      }
      const variantValues = getVariantOptionValues(product, dimensionOption.name, filters);
      if (variantValues.length) return variantValues;
      return dimensionOption.values?.slice() || [];
    }

    return getBuilderWidthTokens(product);
  }

  function getBuilderCategoryWidths(type = builderState.type) {
    const products = getBuilderTypeProducts(type).filter((product) => getBuilderProductSupportsInstallation(product, builderState.installation, type));
    const values = products.flatMap((product) => getBuilderProductSizeLabels(product, type, builderState.installation));
    return sortBuilderSizeLabels(values);
  }

  function getBuilderCategorySizeOptions(type = builderState.type) {
    return getBuilderCategoryWidths(type);
  }

  function getBuilderProductsForWidth(type = builderState.type, width = builderState.width) {
    const normalizedWidth = normalizeSearchText(width);
    const products = getBuilderTypeProducts(type).filter((product) => getBuilderProductSupportsInstallation(product, builderState.installation, type));

    return products
      .filter((product) => {
        if (!normalizedWidth) return true;
        const sizeLabels = getBuilderProductSizeLabels(product, type, builderState.installation);
        return sizeLabels.some((label) => normalizeSearchText(label) === normalizedWidth || normalizeSearchText(extractWidthToken(label)) === normalizedWidth);
      })
      .sort((a, b) => {
        const sourceDelta = Number(Boolean(b.source === "shopify")) - Number(Boolean(a.source === "shopify"));
        if (sourceDelta) return sourceDelta;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });
  }

  function getBuilderSelectedProduct(type = builderState.type, width = builderState.width) {
    const current = builderState.productHandle ? commerce.getProductByHandle(builderState.productHandle) : null;
    const candidates = getBuilderProductsForWidth(type, width);
    if (current && candidates.some((product) => product.handle === current.handle)) {
      return current;
    }

    const designMatch = candidates.find((product) => normalizeSearchText(product.title) === normalizeSearchText(builderState.design));
    return designMatch || candidates[0] || null;
  }

  function getBestMatchingVariant(product, desiredValues = []) {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (!variants.length) return null;

    const normalizedValues = desiredValues
      .map((value) => {
        if (Array.isArray(value)) {
          const values = value.map(normalizeSearchText).filter(Boolean);
          return values.length ? values : null;
        }
        const normalizedValue = normalizeSearchText(value);
        return normalizedValue ? normalizedValue : null;
      })
      .filter(Boolean);

    const scoredVariants = variants.map((variant) => {
      const optionValues = (variant.selectedOptions || []).map((option) => normalizeSearchText(option.value));
      let score = variant.availableForSale === false ? -1000 : 50;

      normalizedValues.forEach((expected) => {
        if (Array.isArray(expected)) {
          if (expected.some((value) => optionValues.includes(value))) score += 25;
        } else if (optionValues.includes(expected)) {
          score += 25;
        }
      });

      return { variant, score };
    }).sort((a, b) => b.score - a.score);

    return scoredVariants[0]?.variant || variants[0] || null;
  }

  function getBuilderCategoryPlaceholder(label) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 780">
        <rect width="640" height="780" fill="#d8d9d6"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6e7565" font-family="Nunito, Arial, sans-serif" font-size="44" font-weight="800">${label}</text>
      </svg>
    `)}`;
  }

  function renderCategories() {
    const target = document.querySelector("[data-home-categories]");
    if (!target) return;

    const categories = [
      { type: "vanite", label: "Meubles de salle de bain" },
      { type: "lavabo", label: "Lavabos" },
      { type: "toilette", label: "Toilettes" },
      { type: "douche", label: "Douches" },
      { type: "baignoire", label: "Baignoires" }
    ];

    target.innerHTML = categories.map(({ type, label }) => {
      const collection = getBuilderTypeMeta(type).collection;
      const product = getBuilderTypeProducts(type)[0] || null;
      const imageSrc = getImageSrc(product?.images?.[0], getBuilderCategoryPlaceholder(label));
      const imageAlt = product?.images?.[0]?.altText || label;

      return `
        <a class="category-card" href="shop.html?collection=${encodeURIComponent(collection)}">
          <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(imageAlt)}">
          <span class="category-card__footer">
            <span>${escapeHtml(label)}</span>
            <span class="category-card__arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M5 12h12"></path>
                <path d="m13 6 6 6-6 6"></path>
              </svg>
            </span>
          </span>
        </a>
      `;
    }).join("");
  }

  function bindCategoryCarousel() {
    const carousel = document.querySelector("[data-home-category-carousel]");
    const track = carousel?.querySelector("[data-home-categories]");
    const prevButton = carousel?.querySelector("[data-home-category-prev]");
    const nextButton = carousel?.querySelector("[data-home-category-next]");
    if (!carousel || !track || !prevButton || !nextButton) return;

    carousel.dataset.categoryCarouselIndex = "0";

    const getScrollStep = () => {
      const card = track.querySelector(".category-card");
      if (!card) return Math.round(track.clientWidth * 0.8);
      const cardStyle = window.getComputedStyle(track);
      const gap = Number.parseFloat(cardStyle.columnGap || cardStyle.gap || "0") || 0;
      return card.getBoundingClientRect().width + gap;
    };

    const cards = [...track.querySelectorAll(".category-card")];
    let currentIndex = 0;

    const scrollToIndex = (index) => {
      if (!cards.length) return;
      currentIndex = Math.max(0, Math.min(cards.length - 1, index));
      carousel.dataset.categoryCarouselIndex = String(currentIndex);
      const card = cards[currentIndex];
      if (card && typeof card.scrollIntoView === "function") {
        card.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      }
    };

    prevButton.addEventListener("click", () => scrollToIndex(currentIndex - 1));
    nextButton.addEventListener("click", () => scrollToIndex(currentIndex + 1));
  }

  function resolveBuilderProduct(type = builderState.type) {
    if (type === "vanite") {
      return ensureVanityProductSelection(builderState.width);
    }

    const current = builderState.productHandle ? commerce.getProductByHandle(builderState.productHandle) : null;
    const candidates = getBuilderProductsForWidth(type, builderState.width);
    if (current && candidates.some((product) => product.handle === current.handle)) {
      return current;
    }

    const selected = getBuilderSelectedProduct(type, builderState.width);
    if (selected?.handle) {
      builderState.productHandle = selected.handle;
      return selected;
    }

    return current || candidates[0] || null;
  }

  function getBuilderProductHandle() {
    const resolvedProduct = resolveBuilderProduct();
    return resolvedProduct?.handle || builderState.productHandle || "";
  }

  function getBuilderBaseSelection() {
    const product = commerce.getProductByHandle(getBuilderProductHandle());
    if (!product) return { product: null, variant: null };

    const desiredValues = [];
    if (builderState.type === "vanite" && isVariantDrivenVanityProduct(product)) {
      desiredValues.push(builderState.material, builderState.countertopColor);
    } else if (getBuilderConfig().showInstallationStep) {
      desiredValues.push(builderState.width, builderState.material, getBuilderInstallationValues());
    } else {
      desiredValues.push(builderState.width, builderState.material, builderState.countertopColor);
    }

    const variant = getBestMatchingVariant(product, desiredValues);
    return { product, variant };
  }

  function normalizeVanityState(product = getSelectedVanityProduct(builderState.width)) {
    if (builderState.type !== "vanite") return;

    const width = getVanityWidths().includes(builderState.width) ? builderState.width : getDefaultVanityWidth();
    builderState.width = width;

    if (isVariantDrivenVanityProduct(product)) {
      const { primary, secondary } = getVanityVariantOptions(product);
      const primaryValues = getVariantOptionValues(product, primary?.name);
      if (primaryValues.length && !primaryValues.includes(builderState.material)) {
        builderState.material = primaryValues[0];
      }

      const secondaryValues = secondary
        ? getVariantOptionValues(product, secondary.name, primary?.name ? { [primary.name]: builderState.material } : {})
        : [];
      if (secondaryValues.length && !secondaryValues.includes(builderState.countertopColor)) {
        builderState.countertopColor = secondaryValues[0];
      }

      if (product?.handle) {
        builderState.productHandle = product.handle;
      }
      return product;
    }

    const widthConfig = getVanityWidthConfig(width);
    if (widthConfig) {
      if (!widthConfig.designs.some((design) => design.value === builderState.design)) {
        builderState.design = widthConfig.defaultDesign || widthConfig.designs[0]?.value || builderState.design;
      }

      if (!widthConfig.finishes.some((finish) => finish.type === builderState.material)) {
        builderState.material = widthConfig.defaultFinish || widthConfig.finishes[0]?.type || builderState.material;
      }

      const activeFinish = widthConfig.finishes.find((finish) => finish.type === builderState.material) || widthConfig.finishes[0];
      if (activeFinish && !activeFinish.colors.includes(builderState.countertopColor)) {
        builderState.countertopColor = activeFinish.defaultColor || activeFinish.colors[0] || builderState.countertopColor;
      }
    }

    ensureVanityProductSelection(width);
  }

  function syncBuilderState(type) {
    const config = getBuilderConfig(type);
    builderState.type = type;
    if (type === "vanite") {
      builderState.width = getVanityWidths().includes(builderState.width) ? builderState.width : getDefaultVanityWidth();
      builderState.productHandle = "";
      const selectedProduct = ensureVanityProductSelection(builderState.width);
      builderState.productHandle = selectedProduct?.handle || builderState.productHandle;
      normalizeVanityState(selectedProduct);
      if (!selectedProduct) {
        builderState.design = "";
        builderState.material = "";
        builderState.countertopColor = "";
      } else if (isVariantDrivenVanityProduct(selectedProduct)) {
        builderState.design = selectedProduct?.title || builderState.design;
      } else {
        const widthConfig = getVanityWidthConfig(builderState.width);
        builderState.design = selectedProduct?.title || widthConfig.defaultDesign || widthConfig.designs[0]?.value || builderState.design;
        builderState.material = widthConfig.defaultFinish || widthConfig.finishes[0]?.type || builderState.material;
        builderState.countertopColor = widthConfig.defaultColor || widthConfig.finishes[0]?.defaultColor || widthConfig.finishes[0]?.colors[0] || builderState.countertopColor;
      }
    } else if (config.showInstallationStep) {
      const widths = getBuilderCategoryWidths(type);
      builderState.width = widths.includes(builderState.width) ? builderState.width : (widths[0] || config.defaultWidth || builderState.width || "");
      const installationValues = (config.installations || []).map((item) => item.value);
      builderState.installation = installationValues.includes(builderState.installation)
        ? builderState.installation
        : (config.defaultInstallation || installationValues[0] || builderState.installation || "");
      const selectedProduct = widths.length ? getBuilderSelectedProduct(type, builderState.width) : null;
      builderState.productHandle = selectedProduct?.handle || "";
      builderState.design = selectedProduct?.title || (widths.length ? config.defaultDesign || builderState.design : "");
      const dimensionOption = getBuilderProductDimensionOption(selectedProduct);
      const installationOption = getBuilderProductInstallationOption(selectedProduct);
      const filters = {};
      if (dimensionOption?.name) filters[dimensionOption.name] = builderState.width;
      if (installationOption?.name) filters[installationOption.name] = getBuilderInstallationValues(builderState.installation, type);
      const variantOption = getBuilderProductVariantOption(selectedProduct);
      const variantValues = variantOption ? getVariantOptionValues(selectedProduct, variantOption.name, filters) : [];
      const finishValues = variantValues.length ? variantValues : (variantOption?.values || []);
      builderState.material = config.showFinishStep === false ? "" : (finishValues[0] || config.defaultFinish || "");
      builderState.countertopColor = "";
    } else {
      const widths = getBuilderCategoryWidths(type);
      builderState.width = widths.includes(builderState.width)
        ? builderState.width
        : (type === "toilette"
          ? (widths[0] || config.defaultWidth || "")
          : (config.defaultWidth || widths[0] || ""));
      builderState.installation = "";
      const selectedProduct = getBuilderSelectedProduct(type, builderState.width);
      builderState.productHandle = selectedProduct?.handle || "";
      builderState.design = selectedProduct?.title || config.defaultDesign || builderState.design;
      const variantOption = getBuilderProductVariantOption(selectedProduct);
      const variantValues = variantOption ? getVariantOptionValues(selectedProduct, variantOption.name) : [];
      const finishValues = variantValues.length ? variantValues : (variantOption?.values || []);
      builderState.material = config.showFinishStep === false ? "" : (finishValues[0] || config.defaultFinish || builderState.material);
      builderState.countertopColor = "";
    }
    builderState.addOns = new Set(config.defaultAddOns || []);
  }

  function setActiveButtons(group, value) {
    document.querySelectorAll(`[data-builder-${group}]`).forEach((button) => {
      const buttonValue = group === "design" && button.dataset.builderProductHandle
        ? button.dataset.builderProductHandle
        : button.dataset[`builder${group[0].toUpperCase()}${group.slice(1)}`];
      button.classList.toggle("is-active", buttonValue === value);
    });
  }

  function renderBuilderControls() {
    const typeOptions = ensureBuilderTypeSelection(builderState.type);
    const config = getBuilderConfig();
    const preview = document.querySelector("[data-builder-preview]");
    const productLink = document.querySelector("[data-builder-product-link]");
    const mobileSummary = document.querySelector("[data-builder-mobile-summary]");
    const mobileSummaryImage = document.querySelector("[data-builder-mobile-summary-image]");
    const mobileSummaryLabel = document.querySelector("[data-builder-mobile-summary-label]");
    const sizeTitle = document.querySelector("[data-builder-size-title]");
    const installationTitle = document.querySelector("[data-builder-installation-title]");
    const finishTitle = document.querySelector("[data-builder-finish-title]");
    const addonTitle = document.querySelector("[data-builder-addon-title]");
    const installationStep = document.querySelector("[data-builder-installation-step]");
    const installationStepNumber = document.querySelector("[data-builder-installation-step-number]");
    const typeRow = document.querySelector("[data-builder-type-row]");
    const installationRow = document.querySelector("[data-builder-installation-row]");
    const widthStepNumber = document.querySelector("[data-builder-width-step-number]");
    const designStepNumber = document.querySelector("[data-builder-design-step-number]");
    const finishStepNumber = document.querySelector("[data-builder-finish-step-number]");
    const finishStep = document.querySelector("[data-builder-finish-step]");
    const addonStep = document.querySelector("[data-builder-addon-step]");
    const addonStepNumber = document.querySelector("[data-builder-addon-step-number]");
    const widthRow = document.querySelector("[data-builder-width-row]");
    const designRow = document.querySelector("[data-builder-design-row]");
    const materialRow = document.querySelector("[data-builder-material-row]");
    const colorRow = document.querySelector("[data-builder-countertop-color-row]");
    const colorSelect = document.querySelector("[data-builder-countertop-color-select]");
    const addonRow = document.querySelector("[data-builder-addon-row]");
    const addButton = document.querySelector("[data-builder-add]");

    let designOptions = [];
    let finishOptions = [];
    let selectedProduct = null;
    let addonProducts = [];
    let variantDrivenVanity = false;
    let vanityPrimaryOption = null;
    let vanitySecondaryOption = null;
    let vanityPrimaryValues = [];
    let vanitySecondaryValues = [];

    if (builderState.type === "vanite") {
      const vanityWidths = getVanityWidths();
      const resolvedWidth = vanityWidths.includes(builderState.width) ? builderState.width : getDefaultVanityWidth();
      builderState.width = resolvedWidth;
      designOptions = getVanityProductsForWidth(resolvedWidth);
      selectedProduct = ensureVanityProductSelection(resolvedWidth) || designOptions[0] || null;
      if (selectedProduct?.handle && builderState.productHandle !== selectedProduct.handle) {
        builderState.productHandle = selectedProduct.handle;
      }
      normalizeVanityState(selectedProduct);
      variantDrivenVanity = isVariantDrivenVanityProduct(selectedProduct);
      if (variantDrivenVanity) {
        const variantOptions = getVanityVariantOptions(selectedProduct);
        vanityPrimaryOption = variantOptions.primary;
        vanitySecondaryOption = variantOptions.secondary;
        vanityPrimaryValues = getVariantOptionValues(selectedProduct, vanityPrimaryOption?.name);
        if (vanityPrimaryValues.length && !vanityPrimaryValues.includes(builderState.material)) {
          builderState.material = vanityPrimaryValues[0];
        }
        vanitySecondaryValues = vanitySecondaryOption
          ? getVariantOptionValues(
              selectedProduct,
              vanitySecondaryOption.name,
              vanityPrimaryOption?.name ? { [vanityPrimaryOption.name]: builderState.material } : {}
            )
          : [];
        if (vanitySecondaryValues.length && !vanitySecondaryValues.includes(builderState.countertopColor)) {
          builderState.countertopColor = vanitySecondaryValues[0];
        }
      } else if (!selectedProduct) {
        builderState.design = "";
        builderState.material = "";
        builderState.countertopColor = "";
      }
      addonProducts = getRelatedProductsFromCollection(selectedProduct);
      if (!variantDrivenVanity && selectedProduct) {
        finishOptions = getVanityWidthConfig(resolvedWidth)?.finishes || finishOptions;
      } else if (!selectedProduct) {
        finishOptions = [];
      }
    } else if (config.showInstallationStep) {
      const widths = getBuilderCategoryWidths(builderState.type);
      const resolvedWidth = widths.includes(builderState.width) ? builderState.width : (widths[0] || config.defaultWidth || builderState.width);
      builderState.width = resolvedWidth;
      designOptions = getBuilderProductsForWidth(builderState.type, resolvedWidth);
      selectedProduct = getBuilderSelectedProduct(builderState.type, resolvedWidth) || designOptions[0] || null;
      if (selectedProduct?.handle && builderState.productHandle !== selectedProduct.handle) {
        builderState.productHandle = selectedProduct.handle;
      }

      const variantOption = getBuilderProductVariantOption(selectedProduct);
      const dimensionOption = getBuilderProductDimensionOption(selectedProduct);
      const installationOption = getBuilderProductInstallationOption(selectedProduct);
      const filters = {};
      if (dimensionOption?.name) filters[dimensionOption.name] = resolvedWidth;
      if (installationOption?.name) filters[installationOption.name] = getBuilderInstallationValues(builderState.installation, builderState.type);
      const variantValues = variantOption?.name
        ? getVariantOptionValues(selectedProduct, variantOption.name, filters)
        : [];
      const finishValues = variantValues.length ? variantValues : (variantOption?.values || []);

      if (finishValues.length && !finishValues.includes(builderState.material)) {
        builderState.material = finishValues[0];
      }

      finishOptions = finishValues.map((value) => ({ type: value, colors: [] }));
      addonProducts = [];
    } else {
      const widths = getBuilderCategoryWidths(builderState.type);
      const resolvedWidth = widths.includes(builderState.width)
        ? builderState.width
        : (builderState.type === "toilette"
          ? (widths[0] || config.defaultWidth || "")
          : (config.defaultWidth || widths[0] || ""));
      builderState.width = resolvedWidth;
      designOptions = getBuilderProductsForWidth(builderState.type, resolvedWidth);
      selectedProduct = getBuilderSelectedProduct(builderState.type, resolvedWidth) || designOptions[0] || null;
      if (selectedProduct?.handle && builderState.productHandle !== selectedProduct.handle) {
        builderState.productHandle = selectedProduct.handle;
      }

      const widthOption = getBuilderProductWidthOption(selectedProduct);
      const variantOption = getBuilderProductVariantOption(selectedProduct);
      const optionFilters = widthOption?.name ? { [widthOption.name]: builderState.width } : {};
      const variantValues = variantOption?.name
        ? getVariantOptionValues(selectedProduct, variantOption.name, optionFilters)
        : [];
      const finishValues = variantValues.length ? variantValues : (variantOption?.values || []);

      if (finishValues.length && !finishValues.includes(builderState.material)) {
        builderState.material = finishValues[0];
      }

      finishOptions = finishValues.map((value) => ({ type: value, colors: [] }));
      addonProducts = (config.addons || []).map((addon) => commerce.getProductByHandle(addon.handle)).filter(Boolean);
    }

    if (!selectedProduct && !(config.showInstallationStep && !designOptions.length)) {
      selectedProduct = resolveBuilderProduct();
    }

    if (preview) {
      const previewAsset = getBuilderPreviewAsset(selectedProduct, designOptions, config);
      preview.src = previewAsset.image;
      preview.alt = previewAsset.alt;
      if (mobileSummaryImage) {
        mobileSummaryImage.src = previewAsset.image;
        mobileSummaryImage.alt = previewAsset.alt;
      }
      if (mobileSummaryLabel) {
        mobileSummaryLabel.textContent = selectedProduct?.title || config.label;
      }
    }

    if (productLink) {
      const builderProductHandle = selectedProduct?.handle || builderState.productHandle || getBuilderProductHandle();
      productLink.dataset.builderProductHandle = builderProductHandle;
      productLink.onclick = (event) => {
        event.preventDefault();
        openBuilderProductSheet(builderProductHandle);
      };
    }

    if (finishStep) {
      finishStep.hidden = config.showFinishStep === false;
    }
    if (installationStep) {
      installationStep.hidden = !config.showInstallationStep;
    }
    if (config.showInstallationStep) {
      if (installationStepNumber) installationStepNumber.textContent = "2";
      if (widthStepNumber) widthStepNumber.textContent = "3";
      if (designStepNumber) designStepNumber.textContent = "4";
      if (finishStepNumber) finishStepNumber.textContent = "5";
      if (addonStepNumber) addonStepNumber.textContent = config.showFinishStep === false ? "5" : "6";
    } else {
      if (installationStepNumber) installationStepNumber.textContent = "2";
      if (widthStepNumber) widthStepNumber.textContent = "2";
      if (designStepNumber) designStepNumber.textContent = "3";
      if (finishStepNumber) finishStepNumber.textContent = "4";
      if (addonStepNumber) addonStepNumber.textContent = config.showFinishStep === false ? "4" : "5";
    }
    if (addonStep) {
      addonStep.hidden = false;
    }

    if (installationTitle) installationTitle.textContent = config.installationTitle || "Type d'installation";
    if (sizeTitle) sizeTitle.textContent = config.sizeTitle;
    if (finishTitle) finishTitle.textContent = normalizeDisplayText(config.finishTitle || finishTitle.textContent || "Sélectionnez la finition");
    if (addonTitle) addonTitle.textContent = config.addonTitle;

    if (typeRow) {
      typeRow.innerHTML = typeOptions.map((option) => `
        <button class="choice-button${builderState.type === option.type ? " is-active" : ""}" type="button" data-builder-type="${escapeHtml(option.type)}">${escapeHtml(option.label)}</button>
      `).join("");
    }

    if (installationRow) {
      if (config.showInstallationStep) {
        const installations = config.installations || [];
        if (!installations.some((item) => item.value === builderState.installation)) {
          builderState.installation = config.defaultInstallation || installations[0]?.value || "";
        }
        installationRow.innerHTML = installations.map((installation) => `
          <button class="option-button${builderState.installation === installation.value ? " is-active" : ""}" type="button" data-builder-installation="${escapeHtml(installation.value)}">${escapeHtml(installation.label)}</button>
        `).join("");
      } else {
        installationRow.innerHTML = "";
      }
    }
    if (widthRow) {
      const widthOptions = builderState.type === "vanite"
        ? getVanityWidths()
        : getBuilderCategorySizeOptions(builderState.type);
      widthRow.innerHTML = widthOptions.map((size) => `
        <button class="option-button${builderState.width === size ? " is-active" : ""}" type="button" data-builder-width="${escapeHtml(size)}">${escapeHtml(size)}</button>
      `).join("");
    }

    if (designRow) {
      designRow.hidden = builderState.type === "vanite" ? designOptions.length === 0 : false;
      if (builderState.type === "vanite") {
        designRow.innerHTML = designOptions.map((product) => `
          <button class="design-card${builderState.productHandle === product.handle ? " is-active" : ""}" type="button" data-builder-product-handle="${escapeHtml(product.handle)}">
            <img src="${escapeHtml(product.images?.[0]?.src || config.previewByHandle?.[product.handle] || config.preview)}" alt="${escapeHtml(product.images?.[0]?.altText || product.title)}">
            <span>${escapeHtml(product.title)}</span>
          </button>
        `).join("");
      } else {
        designRow.innerHTML = designOptions.map((product) => `
          <button class="design-card${builderState.productHandle === product.handle ? " is-active" : ""}" type="button" data-builder-product-handle="${escapeHtml(product.handle)}">
            <img src="${escapeHtml(product.images?.[0]?.src || config.previewByHandle?.[product.handle] || config.preview)}" alt="${escapeHtml(product.images?.[0]?.altText || product.title)}">
            <span>${escapeHtml(product.title)}</span>
          </button>
        `).join("");
      }
    }

    if (materialRow) {
      if (variantDrivenVanity) {
        materialRow.innerHTML = vanityPrimaryValues.map((value) => `
          <button class="option-button${builderState.material === value ? " is-active" : ""}" type="button" data-builder-material="${escapeHtml(value)}">${escapeHtml(value)}</button>
        `).join("");
      } else {
        materialRow.innerHTML = finishOptions.map((finish) => `
          <button class="option-button${builderState.material === finish.type ? " is-active" : ""}" type="button" data-builder-material="${escapeHtml(finish.type)}">${escapeHtml(finish.type)}</button>
        `).join("");
      }
    }

    if (colorRow && colorSelect) {
      if (builderState.type === "vanite" && ((variantDrivenVanity && vanitySecondaryValues.length) || (!variantDrivenVanity && config.showCountertopColorSelector && finishOptions.find((finish) => finish.type === builderState.material)?.colors?.length))) {
        const activeColors = variantDrivenVanity
          ? vanitySecondaryValues
          : (finishOptions.find((finish) => finish.type === builderState.material) || finishOptions[0])?.colors || [];
        colorRow.hidden = false;
        colorSelect.innerHTML = activeColors.map((color) => `
          <option value="${escapeHtml(color)}"${builderState.countertopColor === color ? " selected" : ""}>${escapeHtml(color)}</option>
        `).join("");
        colorSelect.value = builderState.countertopColor;
      } else {
        colorRow.hidden = true;
        colorSelect.innerHTML = "";
      }
    }

    const productAddonProducts = builderState.type === "vanite" && addonProducts.length
      ? addonProducts
      : (config.addons || []).map((addon) => commerce.getProductByHandle(addon.handle)).filter(Boolean);

    builderState.addOns = new Set([...builderState.addOns].filter((handle) => productAddonProducts.some((product) => product.handle === handle)));

    if (addonRow) {
      if (productAddonProducts.length) {
        addonRow.innerHTML = productAddonProducts.map((addon) => `
          <button class="addon-card${builderState.addOns.has(addon.handle) ? " is-active" : ""}" type="button" data-builder-addon="${escapeHtml(addon.handle)}">
            <img src="${escapeHtml(addon.images?.[0]?.src || config.previewByHandle?.[addon.handle] || config.preview)}" alt="${escapeHtml(addon.images?.[0]?.altText || addon.title)}">
            <span>${escapeHtml(addon.title)}</span>
          </button>
        `).join("");
      } else {
        addonRow.innerHTML = normalizeDisplayText(`<div class="builder-empty">Aucun complément n'est proposé pour cette catégorie.</div>`);
      }
    }

    if (addButton) {
      addButton.textContent = productAddonProducts.length ? "Ajouter l'ensemble au panier" : "Ajouter au panier";
    }

    setActiveButtons("type", builderState.type);
    setActiveButtons("installation", builderState.installation);
    setActiveButtons("width", builderState.width);
    setActiveButtons("design", builderState.productHandle || builderState.design);
    setActiveButtons("material", builderState.material);
    if (builderSheetState.open) {
      renderBuilderProductSheet();
    }
    updateBuilderTotal();
  }

  function updateBuilderTotal() {
    const total = document.querySelector("[data-builder-total]");
    const mobileSummaryPrice = document.querySelector("[data-builder-mobile-summary-price]");
    if (!total) return;
    const { variant } = getBuilderBaseSelection();
    const addonTotal = [...builderState.addOns].reduce((sum, handle) => {
      const product = commerce.getProductByHandle(handle);
      return sum + Number(product?.price.amount || 0);
    }, 0);
    const totalText = commerce.formatMoney({
      amount: Number(variant?.price.amount || 0) + addonTotal,
      currencyCode: "CAD"
    });
    total.textContent = totalText;
    if (mobileSummaryPrice) {
      mobileSummaryPrice.textContent = totalText;
    }
  }

  function bindBuilderMobileSummary() {
    const builderSection = document.getElementById("builder");
    const previewFrame = document.querySelector(".builder-preview-frame");
    const mobileSummary = document.querySelector("[data-builder-mobile-summary]");
    if (!builderSection || !previewFrame || !mobileSummary) return;
    let previewWasVisible = false;
    let builderWasVisible = false;

    const syncVisibility = (isVisible) => {
      if (isVisible) {
        previewWasVisible = true;
      }
      const shouldShow = window.matchMedia("(max-width: 640px)").matches && builderWasVisible && previewWasVisible && !isVisible;
      mobileSummary.hidden = !shouldShow;
      document.body.classList.toggle("builder-mobile-summary-visible", shouldShow);
    };

    const builderSectionObserver = new IntersectionObserver(
      ([entry]) => {
        builderWasVisible = Boolean(entry?.isIntersecting);
        syncVisibility(previewFrame.getBoundingClientRect().top < window.innerHeight && previewFrame.getBoundingClientRect().bottom > 0);
      },
      {
        threshold: 0.1
      }
    );

    if (builderMobileSummaryObserver) {
      builderMobileSummaryObserver.disconnect();
    }

    builderMobileSummaryObserver = new IntersectionObserver(
      ([entry]) => {
        syncVisibility(Boolean(entry?.isIntersecting));
      },
      {
        threshold: 0.2
      }
    );

    builderSectionObserver.observe(builderSection);
    builderMobileSummaryObserver.observe(previewFrame);
    syncVisibility(previewFrame.getBoundingClientRect().top < window.innerHeight && previewFrame.getBoundingClientRect().bottom > 0);

    mobileSummary.addEventListener("click", () => {
      const selectedProduct = getSelectedVanityProduct() || resolveBuilderProduct();
      const builderProductHandle = selectedProduct?.handle || builderState.productHandle || getBuilderProductHandle();
      if (builderProductHandle) {
        openBuilderProductSheet(builderProductHandle);
      }
    });

    window.addEventListener("resize", () => {
      const rect = previewFrame.getBoundingClientRect();
      syncVisibility(rect.top < window.innerHeight && rect.bottom > 0);
    });
  }

  function bindBuilder() {
    document.addEventListener("change", (event) => {

      const colorSelect = event.target.closest("[data-builder-countertop-color-select]");
      if (colorSelect) {
        builderState.countertopColor = colorSelect.value;
        renderBuilderControls();
        return;
      }
    });

    document.addEventListener("click", async (event) => {
      const sheetCloseButton = event.target.closest("[data-builder-product-sheet-close]");
      if (sheetCloseButton) {
        closeBuilderProductSheet();
        return;
      }

      const sheetPrevButton = event.target.closest("[data-builder-sheet-prev]");
      if (sheetPrevButton) {
        const product = getBuilderSheetSelectedProduct(builderSheetState.productHandle);
        const selectedVariant = getBuilderSheetSelectedVariant(product);
        const galleryImages = getBuilderSheetGalleryImages(product, selectedVariant);
        if (!galleryImages.length) return;
        builderSheetState.imageIndex = (builderSheetState.imageIndex - 1 + galleryImages.length) % galleryImages.length;
        renderBuilderProductSheet();
        return;
      }

      const sheetNextButton = event.target.closest("[data-builder-sheet-next]");
      if (sheetNextButton) {
        const product = getBuilderSheetSelectedProduct(builderSheetState.productHandle);
        const selectedVariant = getBuilderSheetSelectedVariant(product);
        const galleryImages = getBuilderSheetGalleryImages(product, selectedVariant);
        if (!galleryImages.length) return;
        builderSheetState.imageIndex = (builderSheetState.imageIndex + 1) % galleryImages.length;
        renderBuilderProductSheet();
        return;
      }


      const typeButton = event.target.closest("[data-builder-type]");
      if (typeButton) {
        const nextType = typeButton.dataset.builderType;
        if (nextType && nextType !== builderState.type) {
          syncBuilderState(nextType);
          if (builderState.type === "vanite") {
            normalizeVanityState();
          }
          renderBuilderControls();
        }
        return;
      }

      const installationButton = event.target.closest("[data-builder-installation]");
      if (installationButton) {
        builderState.installation = installationButton.dataset.builderInstallation || "";
        renderBuilderControls();
        return;
      }

      const widthButton = event.target.closest("[data-builder-width]");
      if (widthButton) {
        builderState.width = widthButton.dataset.builderWidth || builderState.width;
        if (builderState.type === "vanite") {
          normalizeVanityState();
        }
        renderBuilderControls();
        return;
      }

      const designButton = event.target.closest("[data-builder-design], [data-builder-product-handle]");
      if (designButton) {
        if (designButton.dataset.builderProductHandle) {
          builderState.productHandle = designButton.dataset.builderProductHandle;
          const selected = commerce.getProductByHandle(builderState.productHandle);
          builderState.design = selected?.title || builderState.design;
        } else if (designButton.dataset.builderDesign) {
          builderState.design = designButton.dataset.builderDesign;
        }
        if (builderState.type === "vanite") {
          normalizeVanityState();
        }
        renderBuilderControls();
        return;
      }

      const materialButton = event.target.closest("[data-builder-material]");
      if (materialButton) {
        builderState.material = materialButton.dataset.builderMaterial;
        if (builderState.type === "vanite") normalizeVanityState();
        renderBuilderControls();
        return;
      }

      const addonButton = event.target.closest("[data-builder-addon]");
      if (addonButton) {
        const handle = addonButton.dataset.builderAddon;
        if (builderState.addOns.has(handle)) {
          builderState.addOns.delete(handle);
        } else {
          builderState.addOns.add(handle);
        }
        renderBuilderControls();
        return;
      }

      const addButton = event.target.closest("[data-builder-add]");
      if (addButton) {
        const { variant } = getBuilderBaseSelection();
        const config = getBuilderConfig();
        const selectedProduct = builderState.type === "vanite"
          ? getSelectedVanityProduct()
          : commerce.getProductByHandle(getBuilderProductHandle());
        const originalText = addButton.textContent;
        addButton.disabled = true;
        try {
          if (variant) {
            const finishLabel = builderState.type === "vanite" ? builderState.material : "";
            const colorLabel = builderState.type === "vanite" ? builderState.countertopColor : "";
            await commerce.addToCart(variant.id, 1, {
              attributes: builderState.type === "vanite" ? {
                Design: selectedProduct?.title || builderState.design,
                "Countertop Type": finishLabel,
                "Countertop Color": colorLabel
              } : getBuilderConfig().showInstallationStep ? {
                Design: selectedProduct?.title || builderState.design,
                Installation: getBuilderInstallationLabel(),
                Couleur: builderState.material
              } : {
                Design: builderState.design
              }
            });
          }

          for (const handle of builderState.addOns) {
            const addon = commerce.getProductByHandle(handle);
            if (addon?.variants?.[0]?.id) {
              await commerce.addToCart(addon.variants[0].id, 1);
            }
          }

          addButton.textContent = normalizeDisplayText("Ajouté au panier");
          window.setTimeout(() => {
            addButton.textContent = getBuilderConfig().addons.length ? "Ajouter l'ensemble au panier" : "Ajouter au panier";
          }, 1000);
        } catch (error) {
          console.error(error);
          addButton.textContent = originalText || (getBuilderConfig().addons.length ? "Ajouter l'ensemble au panier" : "Ajouter au panier");
        } finally {
          addButton.disabled = false;
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && builderSheetState.open) {
        closeBuilderProductSheet();
      }
    });
  }

  function bindHomeHeader() {
    const header = document.querySelector(".site-header--home");
    const hero = document.querySelector(".hero");
    if (!header || !hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        header.classList.toggle("site-header--scrolled", !entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: `-${header.offsetHeight}px 0px 0px 0px`
      }
    );

    observer.observe(hero);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await commerce.ready;
    fixFrenchTextEncoding();
    renderCategories();
    bindCategoryCarousel();
    ensureBuilderTypeSelection(builderState.type);
    syncBuilderState(builderState.type);
    bindBuilder();
    bindHomeHeader();
    renderBuilderControls();
    bindBuilderMobileSummary();
    ui.updateCartBadge();
  });
})();
