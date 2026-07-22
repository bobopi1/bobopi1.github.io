(function () {
  function cloneCatalog(source) {
    return JSON.parse(JSON.stringify(source || { products: [], collections: [] }));
  }

  function createEmptyCatalog() {
    return { products: [], collections: [] };
  }

  function createEmptyCart() {
    return {
      id: "",
      checkoutUrl: "",
      totalQuantity: 0,
      lines: [],
      subtotal: { amount: 0, currencyCode: "CAD" },
      total: { amount: 0, currencyCode: "CAD" },
      cost: null
    };
  }

  const emptyCatalog = createEmptyCatalog();
  const shopifyConfig = window.LatelierShopifyConfig || {};
  const SHOPIFY_CART_ID_KEY = "latelier_shopify_cart_id_v1";
  const LEGACY_CART_STORAGE_KEY = "latelier_local_cart_v1";
  let catalog = cloneCatalog(emptyCatalog);
  let catalogSource = "empty";
  let catalogError = null;
  let shopifyCatalogLoaded = false;
  let cartCache = createEmptyCart();

  function formatMoney(price) {
    const amount = Number(price?.amount ?? price ?? 0);
    const currency = price?.currencyCode || "CAD";
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amount).replace(/[\u00A0\u202F]/g, " ");
  }

  function getCollections() {
    return [...catalog.collections];
  }

  function normalizeLineAttributes(attributes) {
    if (!attributes) return [];
    const source = Array.isArray(attributes)
      ? attributes
      : Object.entries(attributes).map(([key, value]) => ({ key, value }));

    return source
      .map((item) => ({
        key: String(item?.key ?? item?.name ?? "").trim(),
        value: String(item?.value ?? "").trim()
      }))
      .filter((item) => item.key && item.value);
  }

  function normalizeMoney(amount) {
    if (!amount) return { amount: 0, currencyCode: "CAD" };
    return {
      amount: Number(amount.amount ?? 0),
      currencyCode: amount.currencyCode || "CAD"
    };
  }

  function normalizeImage(image, fallbackAlt = "") {
    const src = String(image?.src || image?.url || "").trim();
    if (!src) return null;
    return {
      src,
      altText: String(image?.altText || image?.alt || fallbackAlt || "").trim()
    };
  }

  function parseSectionRows(value, defaultLabel) {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          if (Array.isArray(entry)) {
            const [label, raw] = entry;
            const textLabel = String(label || "").trim() || defaultLabel;
            const textValue = String(raw || "").trim();
            return textLabel && textValue ? [textLabel, textValue] : null;
          }

          if (entry && typeof entry === "object") {
            const textLabel = String(entry.label || entry.key || "").trim() || defaultLabel;
            const textValue = String(entry.value || "").trim();
            return textLabel && textValue ? [textLabel, textValue] : null;
          }

          const textValue = String(entry || "").trim();
          return textValue ? [defaultLabel, textValue] : null;
        })
        .filter(Boolean);
    }

    const source = String(value).trim();
    if (!source) return [];

    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed)) {
        return parseSectionRows(parsed, defaultLabel);
      }
    } catch (error) {
      // Fall through.
    }

    return source
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^\s*([^:\u2013-]+?)\s*[:\u2013-]\s*(.+)$/);
        if (match) {
          return [match[1].trim(), match[2].trim()];
        }
        return [defaultLabel, line];
      })
      .filter((entry) => entry[0] && entry[1]);
  }

  function isShopifyConfigured() {
    return Boolean(
      shopifyConfig.enabled
      || (String(shopifyConfig.shopDomain || "").trim() && String(shopifyConfig.storefrontAccessToken || "").trim())
    );
  }

  function mapShopifyCollection(node) {
    return {
      id: node.id,
      source: "shopify",
      handle: node.handle,
      title: node.title || "",
      description: node.description || "",
      image: node.image?.url || ""
    };
  }

  function mapShopifyProduct(node) {
    const collectionHandles = (node.collections?.edges || [])
      .map((edge) => edge?.node?.handle)
      .filter(Boolean);
    const images = (node.images?.edges || [])
      .map((edge) => normalizeImage(edge?.node, node.title))
      .filter(Boolean);
    if (!images.length && node.featuredImage?.url) {
      images.push(normalizeImage(node.featuredImage, node.title));
    }
    const variants = (node.variants?.edges || [])
      .map((edge) => edge?.node)
      .filter(Boolean)
      .map((variant) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku || "",
        availableForSale: Boolean(variant.availableForSale),
        price: normalizeMoney(variant.price),
        compareAtPrice: variant.compareAtPrice ? normalizeMoney(variant.compareAtPrice) : null,
        image: normalizeImage(variant.image, node.title),
        selectedOptions: (variant.selectedOptions || []).map((option) => ({
          name: option.name,
          value: option.value
        }))
      }));
    const options = (node.options || []).map((option) => ({
      name: option.name,
      values: Array.isArray(option.values) ? option.values.slice() : []
    }));
    const tags = Array.isArray(node.tags) ? node.tags.slice() : [];
    const dimensionsRows = parseSectionRows(node.dimensionsMetafield?.value, "Vanite");
    const countertopDimensionsRows = parseSectionRows(node.countertopDimensionsMetafield?.value, "Comptoir");
    const materialRows = parseSectionRows(node.materialMetafield?.value, "Vanite");
    const countertopMaterialRows = parseSectionRows(node.countertopMaterialMetafield?.value, "Comptoir");
    const noteValue = String(node.noteMetafield?.value || "").trim();
    const subtypeValue = String(node.subtypeMetafield?.value || "").trim();
    const showerTypeValue = String(node.showerTypeMetafield?.value || "").trim();
    const widthValue = String(node.widthMetafield?.value || "").trim();
    const lengthValue = String(node.lengthMetafield?.value || "").trim();
    const heightValue = String(node.heightMetafield?.value || "").trim();

    return {
      id: node.id,
      source: "shopify",
      handle: node.handle,
      title: node.title || "",
      description: node.description || "",
      productType: node.productType || "",
      subtype: subtypeValue,
      collection: collectionHandles[0] || "",
      collections: collectionHandles,
      tags,
      availableForSale: typeof node.availableForSale === "boolean" ? node.availableForSale : true,
      price: variants[0]?.price || { amount: 0, currencyCode: "CAD" },
      compareAtPrice: variants[0]?.compareAtPrice || null,
      images,
      options,
      variants,
      metafields: {
        width: widthValue,
        length: lengthValue,
        height: heightValue,
        dimensions: dimensionsRows,
        countertop_dimensions: countertopDimensionsRows,
        material: materialRows,
        countertop_material: countertopMaterialRows,
        note: noteValue,
        shower_product_type: showerTypeValue
      },
      recommendations: []
    };
  }

  function buildCatalogFromShopify(data) {
    const collections = (data?.collections?.edges || [])
      .map((edge) => edge?.node)
      .filter(Boolean)
      .map(mapShopifyCollection);
    const products = (data?.products?.edges || [])
      .map((edge) => edge?.node)
      .filter(Boolean)
      .map(mapShopifyProduct);
    return { collections, products };
  }

  async function shopifyFetch(query, variables = {}) {
    const shopDomain = String(shopifyConfig.shopDomain || "").trim();
    const accessToken = String(shopifyConfig.storefrontAccessToken || "").trim();
    const apiVersion = String(shopifyConfig.apiVersion || "2026-01").trim();
    if (!shopDomain || !accessToken) return null;

    const normalizedDomain = shopDomain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    const response = await fetch(`https://${normalizedDomain}/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": accessToken
      },
      body: JSON.stringify({ query, variables })
    });

    const payload = await response.json();
    if (!response.ok || payload.errors) {
      const message = payload.errors?.[0]?.message || `Shopify request failed with status ${response.status}`;
      throw new Error(message);
    }

    return payload.data;
  }

  async function loadShopifyCatalog() {
    shopifyCatalogLoaded = false;
    if (!isShopifyConfigured()) return cloneCatalog(emptyCatalog);
    if (!shopifyConfig.shopDomain || !shopifyConfig.storefrontAccessToken) {
      console.warn("[Latelier] Shopify config is incomplete. Using an empty catalog.");
      return cloneCatalog(emptyCatalog);
    }

    const query = `
      query LatelierCatalog($productsFirst: Int!, $collectionsFirst: Int!) {
        collections(first: $collectionsFirst) {
          edges {
            node {
              id
              handle
              title
              description
              image {
                url
                altText
              }
            }
          }
        }
        products(first: $productsFirst) {
          edges {
            node {
              id
              handle
              title
              description
              productType
              tags
              availableForSale
              featuredImage {
                url
                altText
              }
              images(first: 10) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              collections(first: 10) {
                edges {
                  node {
                    handle
                    title
                  }
                }
              }
              options {
                name
                values
              }
              dimensionsMetafield: metafield(namespace: "custom", key: "dimensions") {
                value
              }
              widthMetafield: metafield(namespace: "custom", key: "width") {
                value
              }
              lengthMetafield: metafield(namespace: "custom", key: "length") {
                value
              }
              heightMetafield: metafield(namespace: "custom", key: "height") {
                value
              }
              countertopDimensionsMetafield: metafield(namespace: "custom", key: "countertop_dimensions") {
                value
              }
              materialMetafield: metafield(namespace: "custom", key: "material") {
                value
              }
              countertopMaterialMetafield: metafield(namespace: "custom", key: "countertop_material") {
                value
              }
              noteMetafield: metafield(namespace: "custom", key: "note") {
                value
              }
              subtypeMetafield: metafield(namespace: "custom", key: "productType") {
                value
              }
              showerTypeMetafield: metafield(namespace: "custom", key: "type_de_produit_pour_douche") {
                value
              }
              variants(first: 100) {
                edges {
                  node {
                    id
                    title
                    sku
                    availableForSale
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    image {
                      url
                      altText
                    }
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyFetch(query, {
      productsFirst: 250,
      collectionsFirst: 50
    });
    shopifyCatalogLoaded = true;
    return buildCatalogFromShopify(data);
  }

  function getProductByHandle(handle) {
    return catalog.products.find((product) => product.handle === handle) || null;
  }

  function getProductByVariantId(variantId) {
    return catalog.products.find((product) => Array.isArray(product.variants) && product.variants.some((variant) => variant.id === variantId)) || null;
  }

  function getVariantById(variantId) {
    const product = getProductByVariantId(variantId);
    if (!product) return null;
    return product.variants.find((variant) => variant.id === variantId) || null;
  }

  function getProducts(filters = {}) {
    const { collection, query, maxPrice, productType, category } = filters;
    const normalizedQuery = String(query || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    return catalog.products.filter((product) => {
      const productCollections = Array.isArray(product.collections) && product.collections.length
        ? product.collections
        : [product.collection].filter(Boolean);
      const matchesCollection = !collection || collection === "all" || productCollections.includes(collection);
      const matchesType = !productType || product.productType === productType;
      const matchesCategory = !category || product.tags?.includes(category);
      const searchableText = [
        product.title,
        product.description,
        product.handle,
        product.productType,
        product.subtype,
        ...(product.tags || []),
        ...(product.options || []).flatMap((option) => [option?.name, ...(option?.values || [])]),
        ...(product.variants || []).flatMap((variant) => [
          variant?.title,
          ...(variant?.selectedOptions || []).flatMap((option) => [option?.name, option?.value])
        ])
      ]
        .filter(Boolean)
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesPrice = !maxPrice || Number(product.price.amount) <= Number(maxPrice);
      return matchesCollection && matchesType && matchesCategory && matchesQuery && matchesPrice;
    });
  }

  function getStoredCartId() {
    try {
      return String(localStorage.getItem(SHOPIFY_CART_ID_KEY) || "").trim();
    } catch (error) {
      return "";
    }
  }

  function setStoredCartId(cartId) {
    try {
      if (cartId) {
        localStorage.setItem(SHOPIFY_CART_ID_KEY, cartId);
      } else {
        localStorage.removeItem(SHOPIFY_CART_ID_KEY);
      }
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function clearLegacyCartStorage() {
    try {
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function publishCartUpdate() {
    window.dispatchEvent(new CustomEvent("latelier:cart-updated", { detail: getCart() }));
  }

  function mapShopifyCartLine(node) {
    const merchandise = node?.merchandise;
    if (!merchandise || merchandise.__typename !== "ProductVariant") return null;

    const productNode = merchandise.product || null;
    const product = productNode ? {
      id: productNode.id,
      source: "shopify",
      handle: productNode.handle || "",
      title: productNode.title || "",
      productType: productNode.productType || "",
      images: productNode.featuredImage?.url
        ? [normalizeImage(productNode.featuredImage, productNode.title)].filter(Boolean)
        : []
    } : null;

    const variant = {
      id: merchandise.id,
      title: merchandise.title || "",
      sku: merchandise.sku || "",
      availableForSale: Boolean(merchandise.availableForSale),
      price: normalizeMoney(merchandise.price),
      compareAtPrice: merchandise.compareAtPrice ? normalizeMoney(merchandise.compareAtPrice) : null,
      image: normalizeImage(merchandise.image, product?.title || ""),
      selectedOptions: (merchandise.selectedOptions || []).map((option) => ({
        name: option.name,
        value: option.value
      }))
    };

    const quantity = Number(node.quantity || 1);
    const image = variant.image || product?.images?.[0] || null;
    const lineTotal = {
      amount: Number(variant.price.amount || 0) * quantity,
      currencyCode: variant.price.currencyCode
    };

    return {
      lineId: node.id,
      variantId: variant.id,
      title: product?.title || variant.title || "",
      product,
      variant,
      image,
      quantity,
      attributes: normalizeLineAttributes(node.attributes || []),
      lineTotal
    };
  }

  function mapShopifyCart(node) {
    if (!node) return createEmptyCart();
    const lines = (node.lines?.edges || [])
      .map((edge) => mapShopifyCartLine(edge?.node))
      .filter(Boolean);
    const subtotal = normalizeMoney(node.cost?.subtotalAmount || { amount: 0, currencyCode: "CAD" });
    const total = normalizeMoney(node.cost?.totalAmount || node.cost?.subtotalAmount || { amount: 0, currencyCode: "CAD" });

    return {
      id: String(node.id || "").trim(),
      checkoutUrl: String(node.checkoutUrl || "").trim(),
      totalQuantity: Number(node.totalQuantity || 0),
      lines,
      subtotal,
      total,
      cost: node.cost || null
    };
  }

  function setCart(nextCart) {
    cartCache = nextCart || createEmptyCart();
    if (cartCache.id) {
      setStoredCartId(cartCache.id);
    } else {
      setStoredCartId("");
    }
    publishCartUpdate();
    return cartCache;
  }

  async function loadCartFromShopify() {
    const cartId = getStoredCartId();
    if (!cartId) {
      return setCart(createEmptyCart());
    }

    const query = `
      query LatelierCart($id: ID!) {
        cart(id: $id) {
          id
          checkoutUrl
          totalQuantity
          cost {
            subtotalAmount {
              amount
              currencyCode
            }
            totalAmount {
              amount
              currencyCode
            }
          }
          lines(first: 250) {
            edges {
              node {
                id
                quantity
                attributes {
                  key
                  value
                }
                merchandise {
                  __typename
                  ... on ProductVariant {
                    id
                    title
                    sku
                    availableForSale
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    image {
                      url
                      altText
                    }
                    selectedOptions {
                      name
                      value
                    }
                    product {
                      id
                      handle
                      title
                      productType
                      featuredImage {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await shopifyFetch(query, { id: cartId });
    if (!data?.cart) {
      setStoredCartId("");
      return setCart(createEmptyCart());
    }

    return setCart(mapShopifyCart(data.cart));
  }

  async function runCartMutation(query, variables, resultKey) {
    const data = await shopifyFetch(query, variables);
    const payload = data?.[resultKey];
    const userErrors = payload?.userErrors || [];
    if (userErrors.length) {
      const error = new Error(userErrors[0]?.message || "Shopify cart mutation failed.");
      error.userErrors = userErrors;
      throw error;
    }
    return payload?.cart ? mapShopifyCart(payload.cart) : null;
  }

  async function createShopifyCart(lines = []) {
    const mutation = `
      mutation LatelierCartCreate($input: CartInput) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              subtotalAmount {
                amount
                currencyCode
              }
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 250) {
              edges {
                node {
                  id
                  quantity
                  attributes {
                    key
                    value
                  }
                  merchandise {
                    __typename
                    ... on ProductVariant {
                      id
                      title
                      sku
                      availableForSale
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                      image {
                        url
                        altText
                      }
                      selectedOptions {
                        name
                        value
                      }
                      product {
                        id
                        handle
                        title
                        productType
                        featuredImage {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const cart = await runCartMutation(mutation, { input: { lines } }, "cartCreate");
    if (!cart) {
      throw new Error("Unable to create Shopify cart.");
    }
    return setCart(cart);
  }

  async function addShopifyCartLines(cartId, lines) {
    const mutation = `
      mutation LatelierCartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              subtotalAmount {
                amount
                currencyCode
              }
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 250) {
              edges {
                node {
                  id
                  quantity
                  attributes {
                    key
                    value
                  }
                  merchandise {
                    __typename
                    ... on ProductVariant {
                      id
                      title
                      sku
                      availableForSale
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                      image {
                        url
                        altText
                      }
                      selectedOptions {
                        name
                        value
                      }
                      product {
                        id
                        handle
                        title
                        productType
                        featuredImage {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const cart = await runCartMutation(mutation, { cartId, lines }, "cartLinesAdd");
    if (!cart) {
      throw new Error("Unable to add Shopify cart lines.");
    }
    return setCart(cart);
  }

  async function updateShopifyCartLines(cartId, lines) {
    const mutation = `
      mutation LatelierCartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              subtotalAmount {
                amount
                currencyCode
              }
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 250) {
              edges {
                node {
                  id
                  quantity
                  attributes {
                    key
                    value
                  }
                  merchandise {
                    __typename
                    ... on ProductVariant {
                      id
                      title
                      sku
                      availableForSale
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                      image {
                        url
                        altText
                      }
                      selectedOptions {
                        name
                        value
                      }
                      product {
                        id
                        handle
                        title
                        productType
                        featuredImage {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const cart = await runCartMutation(mutation, { cartId, lines }, "cartLinesUpdate");
    if (!cart) {
      throw new Error("Unable to update Shopify cart lines.");
    }
    return setCart(cart);
  }

  async function removeShopifyCartLines(cartId, lineIds) {
    const mutation = `
      mutation LatelierCartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              subtotalAmount {
                amount
                currencyCode
              }
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 250) {
              edges {
                node {
                  id
                  quantity
                  attributes {
                    key
                    value
                  }
                  merchandise {
                    __typename
                    ... on ProductVariant {
                      id
                      title
                      sku
                      availableForSale
                      price {
                        amount
                        currencyCode
                      }
                      compareAtPrice {
                        amount
                        currencyCode
                      }
                      image {
                        url
                        altText
                      }
                      selectedOptions {
                        name
                        value
                      }
                      product {
                        id
                        handle
                        title
                        productType
                        featuredImage {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const cart = await runCartMutation(mutation, { cartId, lineIds }, "cartLinesRemove");
    if (!cart) {
      throw new Error("Unable to remove Shopify cart lines.");
    }
    return setCart(cart);
  }

  async function initializeCatalog() {
    catalog = cloneCatalog(emptyCatalog);
    catalogSource = "empty";
    catalogError = null;
    clearLegacyCartStorage();

    try {
      const shopifyCatalog = await loadShopifyCatalog();
      if (shopifyCatalog) {
        catalog = shopifyCatalog;
        catalogSource = shopifyCatalogLoaded ? "shopify" : "empty";
      }
    } catch (error) {
      catalogError = error;
      console.warn("[Latelier] Using an empty catalog because Shopify data could not be loaded.", error);
    }

    return catalog;
  }

  async function initializeCart() {
    try {
      await loadCartFromShopify();
    } catch (error) {
      console.warn("[Latelier] Shopify cart could not be loaded.", error);
      setCart(createEmptyCart());
    }
  }

  const ready = (async () => {
    await initializeCatalog();
    await initializeCart();
    return catalog;
  })();

  function getCart() {
    return cartCache;
  }

  async function addToCart(variantId, quantity = 1, lineOptions = {}) {
    const variant = getVariantById(variantId);
    if (!variant || !variant.availableForSale) return getCart();

    const requestedQuantity = Math.max(1, Number(quantity || 1));
    const attributes = normalizeLineAttributes(Array.isArray(lineOptions) ? lineOptions : lineOptions.attributes);
    const lineInput = {
      merchandiseId: variant.id,
      quantity: requestedQuantity
    };
    if (attributes.length) {
      lineInput.attributes = attributes;
    }

    try {
      const cartId = getStoredCartId();
      if (!cartId) {
        return await createShopifyCart([lineInput]);
      }

      try {
        return await addShopifyCartLines(cartId, [lineInput]);
      } catch (error) {
        setStoredCartId("");
        return await createShopifyCart([lineInput]);
      }
    } catch (error) {
      console.warn("[Latelier] Failed to add item to Shopify cart.", error);
      throw error;
    }
  }

  async function updateCartLine(lineId, quantity) {
    const cartId = getStoredCartId();
    if (!cartId || !lineId) return getCart();

    const nextQuantity = Number(quantity);
    if (nextQuantity <= 0) {
      return removeCartLine(lineId);
    }

    try {
      return await updateShopifyCartLines(cartId, [
        {
          id: lineId,
          quantity: nextQuantity
        }
      ]);
    } catch (error) {
      console.warn("[Latelier] Failed to update Shopify cart line.", error);
      throw error;
    }
  }

  async function removeCartLine(lineId) {
    const cartId = getStoredCartId();
    if (!cartId || !lineId) return getCart();

    try {
      return await removeShopifyCartLines(cartId, [lineId]);
    } catch (error) {
      console.warn("[Latelier] Failed to remove Shopify cart line.", error);
      throw error;
    }
  }

  async function clearCart() {
    const cartId = getStoredCartId();
    if (!cartId || !cartCache.lines.length) {
      return setCart(createEmptyCart());
    }

    const lineIds = cartCache.lines.map((line) => line.lineId).filter(Boolean);
    if (!lineIds.length) {
      return setCart(createEmptyCart());
    }

    try {
      return await removeShopifyCartLines(cartId, lineIds);
    } catch (error) {
      console.warn("[Latelier] Failed to clear Shopify cart.", error);
      setStoredCartId("");
      return setCart(createEmptyCart());
    }
  }

  async function goToCheckout() {
    if (!cartCache.id || !cartCache.lines.length) return;
    if (!cartCache.checkoutUrl) {
      await loadCartFromShopify().catch(() => {});
    }

    if (cartCache.checkoutUrl) {
      window.location.assign(cartCache.checkoutUrl);
    }
  }

  window.LatelierCommerce = {
    formatMoney,
    getCollections,
    normalizeLineAttributes,
    getProducts,
    getProductByHandle,
    getProductByVariantId,
    getVariantById,
    getCart,
    addToCart,
    updateCartLine,
    removeCartLine,
    clearCart,
    goToCheckout,
    ready,
    get catalogSource() {
      return catalogSource;
    },
    get catalogError() {
      return catalogError;
    }
  };

  window.getProducts = getProducts;
  window.getProductByHandle = getProductByHandle;
  window.addToCart = addToCart;
  window.updateCartLine = updateCartLine;
  window.goToCheckout = goToCheckout;
})();
