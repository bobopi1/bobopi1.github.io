// Temporary mock product data.
// Shopify-ready shape: handles, images, options, variants, availability, collection, prices.
// TODO Shopify Storefront API: replace this file with product and collection queries from Shopify.
function createVanityProduct(spec) {
  const widthNumber = Number(String(spec.width).replace(/[^0-9]/g, "")) || 0;
  const colors = spec.colors || [];
  const variants = colors.map((color, index) => {
    const priceAmount = Number(spec.priceByColor?.[color] ?? spec.price ?? 0);
    const compareAtAmount = spec.compareAtByColor?.[color];
    return {
      id: `gid://shopify/ProductVariant/${spec.productNumber}${String(index + 1).padStart(2, "0")}`,
      title: `${spec.width} / ${color}`,
      sku: `LAT-${spec.handle.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${String(index + 1).padStart(2, "0")}`,
      availableForSale: true,
      price: { amount: priceAmount, currencyCode: "CAD" },
      compareAtPrice: compareAtAmount ? { amount: Number(compareAtAmount), currencyCode: "CAD" } : null,
      selectedOptions: [
        { name: "Dimension", value: spec.width },
        { name: "Comptoir", value: color }
      ]
    };
  });

  return {
    id: `gid://shopify/Product/${spec.productNumber}`,
    handle: spec.handle,
    title: spec.title,
    description: spec.description,
    productType: "VanitÃ©",
    collection: "vanites",
    tags: ["meubles-salle-de-bain", "vanites", "lavabos", "comptoirs"],
    availableForSale: true,
    price: variants[0]?.price || { amount: 0, currencyCode: "CAD" },
    compareAtPrice: variants[0]?.compareAtPrice || null,
    images: spec.images,
    options: [
      { name: "Dimension", values: [spec.width] },
      { name: "Comptoir", values: colors }
    ],
    variants,
    metafields: spec.metafields || {
      width: spec.width,
      length: spec.length || '21"',
      height: spec.height || '34"',
      dimensions: [
        ["VanitÃ©", `${spec.width} x 22" x 34"`],
        ["Comptoir", `${widthNumber + 1}" x 23" x 2"`]
      ],
      material: [
        ["VanitÃ©", "MDF fini bois"],
        ["Comptoir", "Marbre synthÃ©tique"]
      ],
      note: "*Comptoir inclus"
    },
    recommendations: spec.recommendations || ["lingerie-bois-naturel", "cabinet-mural-bois-naturel"]
  };
}

function decodeMojibake(value) {
  const source = String(value ?? "");
  const bytes = Uint8Array.from(source, (char) => char.charCodeAt(0) & 0xff);
  return new TextDecoder("utf-8").decode(bytes);
}

function normalizeVanityProduct(product) {
  return {
    ...product,
    title: decodeMojibake(product.title),
    description: decodeMojibake(product.description),
    productType: decodeMojibake(product.productType),
    images: (product.images || []).map((image) => ({
      ...image,
      altText: decodeMojibake(image.altText)
    })),
    options: (product.options || []).map((option) => ({
      ...option,
      name: decodeMojibake(option.name),
      values: (option.values || []).map((value) => decodeMojibake(value))
    })),
    variants: (product.variants || []).map((variant) => ({
      ...variant,
      title: decodeMojibake(variant.title),
      selectedOptions: (variant.selectedOptions || []).map((option) => ({
        ...option,
        name: decodeMojibake(option.name),
        value: decodeMojibake(option.value)
      }))
    })),
    metafields: product.metafields ? {
      ...product.metafields,
      dimensions: (product.metafields.dimensions || []).map(([label, value]) => [
        decodeMojibake(label),
        decodeMojibake(value)
      ]),
      material: (product.metafields.material || []).map(([label, value]) => [
        decodeMojibake(label),
        decodeMojibake(value)
      ]),
      note: decodeMojibake(product.metafields.note || "")
    } : product.metafields
  };
}

function createVanityProducts() {
  return [
    createVanityProduct({
      productNumber: 1010,
      handle: "vanite-rustique-36",
      title: "VanitÃ© Rustique 36\"",
      description: "VanitÃ© au fini bois rustique avec rangement ouvert, tiroirs larges et choix de comptoir blanc, noir ou gris.",
      width: "36\"",
      colors: ["Blanc", "Noir", "Gris"],
      priceByColor: {
        Blanc: 1375,
        Noir: 1425,
        Gris: 1400
      },
      images: [
        { src: "Assets/Relax_NA_3722_WhiteCT.jpg", altText: "VanitÃ© rustique 36 pouces avec comptoir blanc" },
        { src: "Assets/Relax_NA_3722_BlackCT.jpg", altText: "VanitÃ© rustique 36 pouces avec comptoir noir" },
        { src: "Assets/Lifestyle_Relax_NA_3722_WhiteCT.png", altText: "VanitÃ© rustique 36 pouces en contexte" }
      ]
    }),
    createVanityProduct({
      productNumber: 1011,
      handle: "vanite-moderne-36",
      title: "VanitÃ© Moderne 36\"",
      description: "VanitÃ© moderne au profil Ã©purÃ© et rangement intÃ©grÃ©, pensÃ©e pour les projets compacts.",
      width: "36\"",
      colors: ["Blanc", "Noir", "Gris"],
      priceByColor: {
        Blanc: 1395,
        Noir: 1445,
        Gris: 1420
      },
      images: [
        { src: "Assets/Nord_White_3722.jpg", altText: "VanitÃ© moderne 36 pouces avec comptoir blanc" },
        { src: "Assets/Nord_White_3122.jpg", altText: "VanitÃ© moderne 36 pouces vue secondaire" },
        { src: "Assets/Nord_3621_lifestyle.png", altText: "VanitÃ© moderne 36 pouces en contexte" }
      ]
    }),
    createVanityProduct({
      productNumber: 1012,
      handle: "vanite-rustique-48",
      title: "VanitÃ© Rustique 48\"",
      description: "VanitÃ© au fini bois rustique avec rangement ouvert, tiroirs larges et choix de comptoir blanc ou noir.",
      width: "48\"",
      colors: ["Blanc", "Noir", "Gris"],
      priceByColor: {
        Blanc: 1575,
        Noir: 1625,
        Gris: 1600
      },
      compareAtByColor: {
        Blanc: 1750
      },
      images: [
        { src: "Assets/Relax_NA_4922_WhiteCT.jpg", altText: "VanitÃ© rustique 48 pouces avec comptoir blanc" },
        { src: "Assets/Relax_NA_4922_BlackCT.jpg", altText: "VanitÃ© rustique 48 pouces avec comptoir noir" },
        { src: "Assets/Lifestyle_Relax_NA_6122_WhiteCT.png", altText: "VanitÃ© rustique 48 pouces en contexte" }
      ]
    }),
    createVanityProduct({
      productNumber: 1013,
      handle: "vanite-moderne-48",
      title: "VanitÃ© Moderne 48\"",
      description: "VanitÃ© moderne au design discret avec rangement intÃ©grÃ© et choix de comptoir adaptable.",
      width: "48\"",
      colors: ["Blanc", "Noir", "Gris"],
      priceByColor: {
        Blanc: 1595,
        Noir: 1645,
        Gris: 1620
      },
      images: [
        { src: "Assets/Nord_White_4922.jpg", altText: "VanitÃ© moderne 48 pouces avec comptoir blanc" },
        { src: "Assets/Nord_White_6122.jpg", altText: "VanitÃ© moderne 48 pouces vue secondaire" },
        { src: "Assets/Nord_3621_lifestyle.png", altText: "VanitÃ© moderne 48 pouces en contexte" }
      ]
    }),
    createVanityProduct({
      productNumber: 1014,
      handle: "vanite-intemporel-48",
      title: "VanitÃ© Intemporelle 48\"",
      description: "VanitÃ© intemporelle aux lignes sobres, facile Ã  harmoniser avec plusieurs styles de salle de bain.",
      width: "48\"",
      colors: ["Blanc", "Noir", "Gris"],
      priceByColor: {
        Blanc: 1675,
        Noir: 1725,
        Gris: 1700
      },
      images: [
        { src: "Assets/Nord_White_4922.jpg", altText: "VanitÃ© intemporelle 48 pouces avec comptoir blanc" },
        { src: "Assets/Nord_White_6122.jpg", altText: "VanitÃ© intemporelle 48 pouces vue secondaire" },
        { src: "Assets/Nord_3621_lifestyle.png", altText: "VanitÃ© intemporelle 48 pouces en contexte" }
      ]
    }),
    createVanityProduct({
      productNumber: 1015,
      handle: "vanite-moderne-60",
      title: "VanitÃ© Moderne 60\"",
      description: "VanitÃ© moderne grand format avec rangement pratique et silhouette contemporaine.",
      width: "60\"",
      colors: ["Blanc", "Noir"],
      priceByColor: {
        Blanc: 1895,
        Noir: 1945
      },
      images: [
        { src: "Assets/Nord_White_6122.jpg", altText: "VanitÃ© moderne 60 pouces avec comptoir blanc" },
        { src: "Assets/Nord_White_4922.jpg", altText: "VanitÃ© moderne 60 pouces vue secondaire" },
        { src: "Assets/Nord_3621_lifestyle.png", altText: "VanitÃ© moderne 60 pouces en contexte" }
      ]
    }),
    createVanityProduct({
      productNumber: 1016,
      handle: "vanite-intemporel-60",
      title: "VanitÃ© Intemporelle 60\"",
      description: "VanitÃ© grand format au style durable avec lignes classiques et finitions faciles Ã  vivre.",
      width: "60\"",
      colors: ["Blanc", "Noir"],
      priceByColor: {
        Blanc: 1995,
        Noir: 2045
      },
      images: [
        { src: "Assets/Nord_White_6122.jpg", altText: "VanitÃ© intemporelle 60 pouces avec comptoir blanc" },
        { src: "Assets/Nord_White_4922.jpg", altText: "VanitÃ© intemporelle 60 pouces vue secondaire" },
        { src: "Assets/Nord_3621_lifestyle.png", altText: "VanitÃ© intemporelle 60 pouces en contexte" }
      ]
    })
  ].map(normalizeVanityProduct);
}

window.LatelierMockCatalog = { collections: [], products: [] };
/*
  collections: [
    {
      handle: "vanites",
      title: "Vanités",
      description: "Vanités autoportantes et murales pour salle de bain.",
      image: "Assets/Lifestyle_Relax_NA_3722_WhiteCT.png"
    },
    {
      handle: "douches",
      title: "Douches",
      description: "Portes, bases et ensembles de douche.",
      image: "Assets/Placeholders/shower_01.png"
    },
    {
      handle: "baignoires",
      title: "Baignoires",
      description: "Baignoires autoportantes et alcôves.",
      image: "Assets/Freestanding_lifestyle.png"
    },
    {
      handle: "toilettes",
      title: "Toilettes",
      description: "Toilettes modernes, intelligentes et faciles à nettoyer.",
      image: "Assets/toilet_Placeholder.webp"
    }
  ],
  products: [
    {
      id: "gid://shopify/Product/1001",
      handle: "la-bois-naturel-30",
      title: "La Bois Naturel 30\"",
      description: "Vanité autoportante au fini bois naturel avec comptoir inclus. Une pièce compacte et chaleureuse pour créer une salle de bain simple, élégante et durable.",
      productType: "Vanité",
      collection: "vanites",
      tags: ["meubles-salle-de-bain", "vanites", "lavabos", "comptoirs"],
      availableForSale: true,
      price: { amount: 875, currencyCode: "CAD" },
      compareAtPrice: null,
      images: [
        { src: "Assets/Relax_NA_3122.jpg", altText: "Vanité bois naturel 30 pouces vue de face" },
        { src: "Assets/Relax_NA_3122_WhiteCT.jpg", altText: "Vanité bois naturel avec comptoir blanc" },
        { src: "Assets/Relax_NA_3122_BlackCT.jpg", altText: "Vanité bois naturel avec comptoir noir" }
      ],
      options: [
        { name: "Dimension", values: ["30\""] },
        { name: "Couleur", values: ["Bois naturel"] },
        { name: "Comptoir", values: ["Blanc", "Noir"] }
      ],
      variants: [
        {
          id: "gid://shopify/ProductVariant/100101",
          title: "30\" / Bois naturel / Blanc",
          sku: "LAT-VAN-BOIS-30-BL",
          availableForSale: true,
          price: { amount: 875, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Dimension", value: "30\"" },
            { name: "Couleur", value: "Bois naturel" },
            { name: "Comptoir", value: "Blanc" }
          ]
        },
        {
          id: "gid://shopify/ProductVariant/100102",
          title: "30\" / Bois naturel / Noir",
          sku: "LAT-VAN-BOIS-30-NR",
          availableForSale: true,
          price: { amount: 925, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Dimension", value: "30\"" },
            { name: "Couleur", value: "Bois naturel" },
            { name: "Comptoir", value: "Noir" }
          ]
        }
      ],
      metafields: {
        dimensions: [
          ["Vanité", "30\" x 21\" x 34\""],
          ["Comptoir", "31\" x 22\" x 2\""]
        ],
        material: [
          ["Vanité", "MDF"],
          ["Comptoir", "Marbre synthétique"]
        ],
        note: "*Comptoir inclus"
      },
      recommendations: ["lingerie-bois-naturel", "cabinet-mural-bois-naturel"]
    },
    {
      id: "gid://shopify/Product/1002",
      handle: "vanite-rustique-48",
      title: "Vanité Rustique 48\"",
      description: "Vanité au fini bois rustique avec rangement ouvert, tiroirs larges et choix de comptoir blanc ou noir.",
      productType: "Vanité",
      collection: "vanites",
      tags: ["meubles-salle-de-bain", "vanites", "lavabos", "comptoirs"],
      availableForSale: true,
      price: { amount: 1575, currencyCode: "CAD" },
      compareAtPrice: { amount: 1750, currencyCode: "CAD" },
      images: [
        { src: "Assets/Relax_NA_4922_WhiteCT.jpg", altText: "Vanité rustique 48 pouces avec comptoir blanc" },
        { src: "Assets/Relax_NA_4922_BlackCT.jpg", altText: "Vanité rustique 48 pouces avec comptoir noir" },
        { src: "Assets/Lifestyle_Relax_NA_6122_WhiteCT.png", altText: "Vanité rustique en contexte" }
      ],
      options: [
        { name: "Dimension", values: ["36\"", "48\"", "60\""] },
        { name: "Comptoir", values: ["Blanc", "Noir"] }
      ],
      variants: [
        {
          id: "gid://shopify/ProductVariant/100200",
          title: "36\" / Blanc",
          sku: "LAT-VAN-RUS-36-BL",
          availableForSale: true,
          price: { amount: 1375, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Dimension", value: "36\"" },
            { name: "Comptoir", value: "Blanc" }
          ]
        },
        {
          id: "gid://shopify/ProductVariant/100201",
          title: "48\" / Blanc",
          sku: "LAT-VAN-RUS-48-BL",
          availableForSale: true,
          price: { amount: 1575, currencyCode: "CAD" },
          compareAtPrice: { amount: 1750, currencyCode: "CAD" },
          selectedOptions: [
            { name: "Dimension", value: "48\"" },
            { name: "Comptoir", value: "Blanc" }
          ]
        },
        {
          id: "gid://shopify/ProductVariant/100202",
          title: "48\" / Noir",
          sku: "LAT-VAN-RUS-48-NR",
          availableForSale: true,
          price: { amount: 1625, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Dimension", value: "48\"" },
            { name: "Comptoir", value: "Noir" }
          ]
        },
        {
          id: "gid://shopify/ProductVariant/100203",
          title: "60\" / Blanc",
          sku: "LAT-VAN-RUS-60-BL",
          availableForSale: true,
          price: { amount: 1895, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Dimension", value: "60\"" },
            { name: "Comptoir", value: "Blanc" }
          ]
        }
      ],
      metafields: {
        dimensions: [
          ["Vanité", "48\" x 22\" x 34\""],
          ["Comptoir", "49\" x 23\" x 2\""]
        ],
        material: [
          ["Vanité", "MDF fini bois"],
          ["Comptoir", "Marbre synthétique"]
        ],
        note: "*Comptoir inclus"
      },
      recommendations: ["lingerie-bois-naturel", "cabinet-mural-bois-naturel"]
    },
    {
      id: "gid://shopify/Product/1003",
      handle: "la-porte-pivotante",
      title: "La Porte Pivotante",
      description: "Douche vitrée avec quincaillerie noire, porte pivotante et profil minimal pour une salle de bain nette et lumineuse.",
      productType: "Douche",
      collection: "douches",
      tags: ["douches", "portes", "ensemble-complet"],
      availableForSale: true,
      price: { amount: 1250, currencyCode: "CAD" },
      compareAtPrice: null,
      images: [
        { src: "Assets/Placeholders/shower_01.png", altText: "Douche porte pivotante avec cadre noir" },
        { src: "Assets/Placeholders/shower_02.png", altText: "Détail de douche vitrée" }
      ],
      options: [
        { name: "Dimension", values: ["36\"", "48\"", "60\""] },
        { name: "Couleur", values: ["Noir", "Chrome"] }
      ],
      variants: [
        {
          id: "gid://shopify/ProductVariant/100301",
          title: "36\" / Noir",
          sku: "LAT-DOU-PIV-36-NR",
          availableForSale: true,
          price: { amount: 1250, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Dimension", value: "36\"" },
            { name: "Couleur", value: "Noir" }
          ]
        },
        {
          id: "gid://shopify/ProductVariant/100302",
          title: "48\" / Noir",
          sku: "LAT-DOU-PIV-48-NR",
          availableForSale: true,
          price: { amount: 1395, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Dimension", value: "48\"" },
            { name: "Couleur", value: "Noir" }
          ]
        }
      ],
      metafields: {
        dimensions: [
          ["Largeur", "36\" à 60\""],
          ["Hauteur", "78\""]
        ],
        material: [
          ["Verre", "Trempé 8 mm"],
          ["Quincaillerie", "Aluminium noir mat"]
        ],
        note: "*Base vendue séparément"
      },
      recommendations: ["la-ronde", "indra-autoportante"]
    },
    {
      id: "gid://shopify/Product/1004",
      handle: "la-ronde",
      title: "La Ronde",
      description: "Douche arrondie vitrée avec profil noir, idéale pour les coins et les salles de bain compactes.",
      productType: "Douche",
      collection: "douches",
      tags: ["douches", "portes"],
      availableForSale: true,
      price: { amount: 875, currencyCode: "CAD" },
      compareAtPrice: null,
      images: [
        { src: "Assets/Placeholders/shower_02.png", altText: "Douche ronde avec portes vitrées" },
        { src: "Assets/Placeholders/shower_03.png", altText: "Douche ronde vue de côté" }
      ],
      options: [
        { name: "Dimension", values: ["36\"", "48\""] },
        { name: "Couleur", values: ["Noir", "Chrome"] }
      ],
      variants: [
        {
          id: "gid://shopify/ProductVariant/100401",
          title: "36\" / Noir",
          sku: "LAT-DOU-RON-36-NR",
          availableForSale: true,
          price: { amount: 875, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Dimension", value: "36\"" },
            { name: "Couleur", value: "Noir" }
          ]
        }
      ],
      metafields: {
        dimensions: [
          ["Largeur", "36\""],
          ["Hauteur", "78\""]
        ],
        material: [
          ["Verre", "Trempé"],
          ["Quincaillerie", "Noir mat"]
        ],
        note: "*Base vendue séparément"
      },
      recommendations: ["la-porte-pivotante", "signature-autoportante"]
    },
    {
      id: "gid://shopify/Product/1005",
      handle: "signature-autoportante",
      title: "Signature Autoportante",
      description: "Baignoire autoportante au profil doux pour créer une zone bain apaisante et contemporaine.",
      productType: "Baignoire",
      collection: "baignoires",
      tags: ["baignoires", "autoportante"],
      availableForSale: true,
      price: { amount: 1895, currencyCode: "CAD" },
      compareAtPrice: null,
      images: [
        { src: "Assets/Signature_lifestyle.png", altText: "Baignoire autoportante dans une salle de bain lumineuse" },
        { src: "Assets/Bathtub_placeholder.jpeg", altText: "Baignoire blanche autoportante" }
      ],
      options: [
        { name: "Dimension", values: ["60\"", "67\""] },
        { name: "Couleur", values: ["Blanc"] }
      ],
      variants: [
        {
          id: "gid://shopify/ProductVariant/100501",
          title: "67\" / Blanc",
          sku: "LAT-BAI-SIG-67-BL",
          availableForSale: true,
          price: { amount: 1895, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Dimension", value: "67\"" },
            { name: "Couleur", value: "Blanc" }
          ]
        }
      ],
      metafields: {
        dimensions: [
          ["Longueur", "67\""],
          ["Largeur", "31\""]
        ],
        material: [
          ["Baignoire", "Acrylique renforcé"],
          ["Drain", "Inclus"]
        ],
        note: "*Robinetterie vendue séparément"
      },
      recommendations: ["onai-baignoire", "la-porte-pivotante"]
    },
    {
      id: "gid://shopify/Product/1006",
      handle: "indra-autoportante",
      title: "Indra Autoportante",
      description: "Baignoire autoportante compacte au fini blanc brillant, parfaite pour les projets de rénovation rapides.",
      productType: "Baignoire",
      collection: "baignoires",
      tags: ["baignoires", "autoportante"],
      availableForSale: true,
      price: { amount: 1295, currencyCode: "CAD" },
      compareAtPrice: { amount: 1495, currencyCode: "CAD" },
      images: [
        { src: "Assets/Indra_placeholder.jpg", altText: "Baignoire Indra autoportante" },
        { src: "Assets/Freestanding_lifestyle.png", altText: "Baignoire autoportante en contexte" }
      ],
      options: [
        { name: "Dimension", values: ["59\""] },
        { name: "Couleur", values: ["Blanc"] }
      ],
      variants: [
        {
          id: "gid://shopify/ProductVariant/100601",
          title: "59\" / Blanc",
          sku: "LAT-BAI-IND-59-BL",
          availableForSale: true,
          price: { amount: 1295, currencyCode: "CAD" },
          compareAtPrice: { amount: 1495, currencyCode: "CAD" },
          selectedOptions: [
            { name: "Dimension", value: "59\"" },
            { name: "Couleur", value: "Blanc" }
          ]
        }
      ],
      metafields: {
        dimensions: [
          ["Longueur", "59\""],
          ["Largeur", "30\""]
        ],
        material: [
          ["Baignoire", "Acrylique"],
          ["Drain", "Inclus"]
        ],
        note: "*Robinetterie vendue séparément"
      },
      recommendations: ["signature-autoportante", "la-ronde"]
    },
    {
      id: "gid://shopify/Product/1007",
      handle: "toilette-intelligente-blanc",
      title: "Toilette Intelligente Blanc",
      description: "Toilette moderne avec silhouette compacte, chasse efficace et assise confortable.",
      productType: "Toilette",
      collection: "toilettes",
      tags: ["toilettes", "intelligente", "1-piece"],
      availableForSale: true,
      price: { amount: 695, currencyCode: "CAD" },
      compareAtPrice: null,
      images: [
        { src: "Assets/toilet_Placeholder.webp", altText: "Toilette moderne blanche" }
      ],
      options: [
        { name: "Couleur", values: ["Blanc"] }
      ],
      variants: [
        {
          id: "gid://shopify/ProductVariant/100701",
          title: "Blanc",
          sku: "LAT-TOI-INT-BL",
          availableForSale: true,
          price: { amount: 695, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Couleur", value: "Blanc" }
          ]
        }
      ],
      metafields: {
        dimensions: [
          ["Largeur", "15\""],
          ["Profondeur", "28\""]
        ],
        material: [
          ["Bol", "Céramique"],
          ["Siège", "Fermeture lente"]
        ],
        note: "*Certification WaterSense"
      },
      recommendations: ["la-ronde", "la-bois-naturel-30"]
    },
    {
      id: "gid://shopify/Product/1008",
      handle: "lingerie-bois-naturel",
      title: "Lingerie",
      description: "Colonne de rangement assortie au fini bois naturel.",
      productType: "Rangement",
      collection: "vanites",
      tags: ["meubles-salle-de-bain", "lingeries"],
      availableForSale: true,
      price: { amount: 150, currencyCode: "CAD" },
      compareAtPrice: null,
      images: [
        { src: "Assets/Relax_NA_Lingerie.jpg", altText: "Lingerie bois naturel" }
      ],
      options: [
        { name: "Couleur", values: ["Bois naturel"] }
      ],
      variants: [
        {
          id: "gid://shopify/ProductVariant/100801",
          title: "Bois naturel",
          sku: "LAT-RAN-LIN-BOIS",
          availableForSale: true,
          price: { amount: 150, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Couleur", value: "Bois naturel" }
          ]
        }
      ],
      metafields: {
        dimensions: [["Rangement", "15\"3/4 x 14\"1/4 x 75\""]],
        material: [["Rangement", "MDF fini bois"]],
        note: ""
      },
      recommendations: []
    },
    {
      id: "gid://shopify/Product/1009",
      handle: "cabinet-mural-bois-naturel",
      title: "Cabinet mural",
      description: "Cabinet mural assorti pour compléter l'ensemble de vanité.",
      productType: "Rangement",
      collection: "vanites",
      tags: ["meubles-salle-de-bain", "cabinets"],
      availableForSale: true,
      price: { amount: 125, currencyCode: "CAD" },
      compareAtPrice: null,
      images: [
        { src: "Assets/Relax_Na_WallCabinet.jpg", altText: "Cabinet mural bois naturel" }
      ],
      options: [
        { name: "Couleur", values: ["Bois naturel"] }
      ],
      variants: [
        {
          id: "gid://shopify/ProductVariant/100901",
          title: "Bois naturel",
          sku: "LAT-RAN-CAB-BOIS",
          availableForSale: true,
          price: { amount: 125, currencyCode: "CAD" },
          compareAtPrice: null,
          selectedOptions: [
            { name: "Couleur", value: "Bois naturel" }
          ]
        }
      ],
      metafields: {
        dimensions: [["Cabinet", "20\" x 7\" x 34\""]],
        material: [["Cabinet", "MDF fini bois"]],
        note: ""
      },
      recommendations: []
    },
    ...createVanityProducts()
  ]
};
*/
