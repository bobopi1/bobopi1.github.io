(function () {
  const STORAGE_KEY = "latelierLanguage";
  const SUPPORTED_LANGUAGES = new Set(["fr", "en"]);
  const BRAND_NAME = "L'Atelier Salle de Bain";
  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();

  const TRANSLATIONS = new Map();

  function add(fr, en) {
    TRANSLATIONS.set(normalizeKey(fr), en);
  }

  [
    ["Accueil", "Home"],
    ["Produits", "Products"],
    ["Tous les produits", "All products"],
    ["Promotions", "Promotions"],
    ["À propos", "About"],
    ["Nous contacter", "Contact us"],
    ["Rechercher", "Search"],
    ["Panier", "Cart"],
    ["Navigation principale", "Main navigation"],
    ["Navigation mobile", "Mobile navigation"],
    ["Catégories de produits", "Product categories"],
    ["Catégories", "Categories"],
    ["Collections", "Collections"],
    ["Aide", "Help"],
    ["Infolettre", "Newsletter"],
    ["Adresse courriel", "Email address"],
    ["S'inscrire", "Subscribe"],
    ["FAQ", "FAQ"],
    ["Politique de vente et Garantie", "Sales Policy and Warranty"],
    ["Guides d'installation", "Installation guides"],
    ["Meubles de salle de bain", "Bathroom furniture"],
    ["Meubles de salle de bain", "Bathroom furniture"],
    ["Meubles de\nsalle de bain", "Bathroom furniture"],
    ["Vanité", "Vanity"],
    ["Vanités", "Vanities"],
    ["Cabinets", "Cabinets"],
    ["Lingeries", "Linen cabinets"],
    ["Miroirs", "Mirrors"],
    ["Lavabos", "Sinks"],
    ["Comptoirs", "Countertops"],
    ["Vasques", "Vessel sinks"],
    ["Toilettes", "Toilets"],
    ["Intelligente", "Smart"],
    ["1 Pièce", "1 Piece"],
    ["2 Pièces", "2 Pieces"],
    ["Baignoires", "Bathtubs"],
    ["Autoportante", "Freestanding"],
    ["Alcove", "Alcove"],
    ["En coin", "Corner"],
    ["Douches", "Showers"],
    ["Portes", "Doors"],
    ["Ensemble complet", "Complete set"],
    ["Voir tout", "View all"],
    ["Voir toutes les catégories", "View all categories"],
    ["Masquer toutes les catégories", "Hide all categories"],
    ["Toutes les catégories", "All categories"],
    ["Filtres", "Filters"],
    ["Afficher les filtres", "Show filters"],
    ["Masquer les filtres", "Hide filters"],
    ["Fermer les filtres", "Close filters"],
    ["Ouvrir le menu", "Open menu"],
    ["Fermer le menu", "Close menu"],
    ["Fermer", "Close"],
    ["Suggestions", "Suggestions"],
    ["Prix", "Price"],
    ["Couleur", "Color"],
    ["Dimensions", "Dimensions"],
    ["Matériel", "Material"],
    ["Options", "Options"],
    ["Quantité", "Quantity"],
    ["Rupture de stock", "Out of stock"],
    ["Ajouter au panier", "Add to cart"],
    ["Ajouté au panier", "Added to cart"],
    ["Ajouté", "Added"],
    ["Ajouter l'ensemble au panier", "Add the set to cart"],
    ["Retirer", "Remove"],
    ["Sous-total", "Subtotal"],
    ["Livraison", "Shipping"],
    ["Taxes", "Taxes"],
    ["Total", "Total"],
    ["Calculée par Shopify", "Calculated by Shopify"],
    ["Calculées par Shopify", "Calculated by Shopify"],
    ["Passer à la caisse", "Checkout"],
    ["Votre panier", "Your cart"],
    ["Votre panier est vide. Explorez les produits pour commencer votre ensemble.", "Your cart is empty. Explore products to start your set."],
    ["Coordonnées", "Contact information"],
    ["Téléphone", "Phone"],
    ["Courriel", "Email"],
    ["Adresse", "Address"],
    ["Heures", "Hours"],
    ["Lun au ven, 9 h à 17 h", "Mon to Fri, 9 a.m. to 5 p.m."],
    ["Envoyez-nous un message", "Send us a message"],
    ["Nom", "Name"],
    ["Sujet", "Subject"],
    ["Message", "Message"],
    ["Votre nom", "Your name"],
    ["De quoi avez-vous besoin?", "What do you need?"],
    ["Dites-nous un peu plus sur votre projet...", "Tell us a little more about your project..."],
    ["Envoyer le message", "Send message"],
    ["Demande de contact", "Contact request"],
    ["Créer mon ensemble", "Build my set"],
    ["Voir tous nos produits", "View all products"],
    ["Voir le produit", "View product"],
    ["Total estimé", "Estimated total"],
    ["+ Tx", "+ Tax"],
    ["Choisissez votre produit", "Choose your product"],
    ["Type d'installation", "Installation type"],
    ["Sélectionnez la largeur", "Select the width"],
    ["Sélectionnez les dimensions", "Select dimensions"],
    ["Choisissez votre design", "Choose your design"],
    ["Sélectionnez le type de comptoir", "Select countertop type"],
    ["Sélectionnez la couleur", "Select color"],
    ["Sélectionnez la finition", "Select finish"],
    ["Complétez votre ensemble", "Complete your set"],
    ["Couleur :", "Color:"],
    ["Couleur du comptoir", "Countertop color"],
    ["Aucun complément n'est proposé pour cette catégorie.", "No add-on is offered for this category."],
    ["Rustique", "Rustic"],
    ["Moderne", "Modern"],
    ["Intemporel", "Timeless"],
    ["Marbre", "Marble"],
    ["Quartz", "Quartz"],
    ["Porcelaine", "Porcelain"],
    ["Blanc", "White"],
    ["Noir", "Black"],
    ["Gris", "Gray"],
    ["Chrome", "Chrome"],
    ["Armoire murale", "Wall cabinet"],
    ["Lingerie", "Linen cabinet"],
    ["Douche", "Shower"],
    ["Baignoire", "Bathtub"],
    ["Toilette", "Toilet"],
    ["Porte pivotante", "Pivot door"],
    ["Ronde", "Round"],
    ["Auto-Portant", "Freestanding"],
    ["À jupe", "Skirted"],
    ["Toilette intelligente", "Smart toilet"],
    ["Deux pièce", "Two-piece"],
    ["Monopièce", "One-piece"],
    ["Créez la salle de bain qui vous ressemble", "Create a bathroom that feels like you"],
    ["Magasinez tous les essentiels de la salle de bain", "Shop every bathroom essential"],
    ["Pourquoi magasiner chez L'Atelier?", "Why shop at L'Atelier?"],
    ["Choix varié", "A wide selection"],
    ["Plusieurs styles, dimensions et finis disponibles.", "Several styles, sizes, and finishes available."],
    ["Prix accessible", "Accessible pricing"],
    ["Des produits élégants et de qualité, offerts à des prix justes.", "Elegant, quality products offered at fair prices."],
    ["Ramassage à l'entrepôt", "Warehouse pickup"],
    ["Récupérez votre commande facilement, au moment qui vous convient.", "Pick up your order easily at a time that works for you."],
    ["Support personnalisé", "Personalized support"],
    ["Besoin d'aide? Appelez-nous pour des conseils adaptés.", "Need help? Call us for tailored advice."],
    ["Magasiner par catégorie", "Shop by category"],
    ["voir toutes les produits", "view all products"],
    ["Créez votre salle de bain idéale, simplement", "Create your ideal bathroom, simply"],
    ["Utilisez notre outil de design pour trouver facilement les produits qui correspondent à vos besoins et à votre style.", "Use our design tool to easily find products that match your needs and style."],
    ["Offres et promotions exclusives", "Exclusive offers and promotions"],
    ["Économisez sur une sélection de produits de qualité pour votre salle de bain.", "Save on a selection of quality products for your bathroom."],
    ["Voir les promotions", "View promotions"],
    ["Des produits élégants et durables pour une salle de bain qui vous ressemble.", "Elegant, durable products for a bathroom that feels like you."],
    ["Tout magasiner", "Shop all"],
    ["Produits sélectionnés", "Selected products"],
    ["Aucun produit ne correspond aux filtres sélectionnés.", "No products match the selected filters."],
    ["Découvrez notre sélection complète de produits pour créer une salle de bain élégante, fonctionnelle et adaptée à votre style.", "Discover our complete selection of products to create an elegant, functional bathroom tailored to your style."],
    ["Découvrez notre sélection de produits en promotion pour créer une salle de bain élégante, fonctionnelle et adaptée à votre style.", "Discover our selection of sale products to create an elegant, functional bathroom tailored to your style."],
    ["Découvrez les produits filtrés pour cette catégorie.", "Discover the products filtered for this category."],
    ["Découvrez les produits en promotion filtrés pour cette catégorie.", "Discover sale products filtered for this category."],
    ["Souvent achetés ensemble", "Frequently bought together"],
    ["Produit", "Product"],
    ["Type", "Type"],
    ["Comptoir :", "Countertop:"],
    ["Dimensions :", "Dimensions:"],
    ["Type d'installation :", "Installation type:"],
    ["Ajouter la base de douche", "Add the shower base"],
    ["Image précédente", "Previous image"],
    ["Image suivante", "Next image"],
    ["À propos - L'Atelier Salle de Bain", "About - L'Atelier Salle de Bain"],
    ["Nous contacter - L'Atelier Salle de Bain", "Contact us - L'Atelier Salle de Bain"],
    ["Panier - L'Atelier Salle de Bain", "Cart - L'Atelier Salle de Bain"],
    ["Produit - L'Atelier Salle de Bain", "Product - L'Atelier Salle de Bain"],
    ["Tout magasiner - L'Atelier Salle de Bain", "Shop all - L'Atelier Salle de Bain"],
    ["L'Atelier Salle de Bain", "L'Atelier Salle de Bain"],
    ["Parlez-nous de votre projet. On vous répond rapidement avec des conseils simples et adaptés à votre salle de bain.", "Tell us about your project. We will reply quickly with simple advice tailored to your bathroom."],
    ["Vous pouvez nous joindre par téléphone, courriel.", "You can reach us by phone or email."],
    ["À propos", "About"],
    ["L'Atelier - Solutions de salle de bain - L'ART et L'EXPERTISE", "L'Atelier - Bathroom solutions - ART and EXPERTISE"],
    ["Chez L'ATELIER, nous croyons que chaque projet d'aménagement commence par une vision, une inspiration, une idée à transformer en un espace qui vous ressemble. Inspiré de l'univers des ateliers d'artisans, notre nom évoque ce lieu de création où le savoir-faire, la réflexion et le souci du détail donnent naissance à des réalisations durables et harmonieuses.", "At L'ATELIER, we believe every design project begins with a vision, an inspiration, an idea to transform into a space that feels like you. Inspired by artisan workshops, our name evokes a creative place where skill, thoughtfulness, and attention to detail lead to lasting, harmonious results."],
    ["Notre mission est d'offrir des produits qui allient design, qualité et accessibilité, tout en simplifiant chaque étape de votre projet. Comme dans un atelier où chaque pièce est soigneusement façonnée, nous sélectionnons des collections aux lignes intemporelles et aux matériaux de qualité afin de créer des salles de bain élégantes, fonctionnelles et adaptées à votre mode de vie.", "Our mission is to offer products that combine design, quality, and accessibility while simplifying every step of your project. Like a workshop where every piece is carefully shaped, we select collections with timeless lines and quality materials to create elegant, functional bathrooms suited to your lifestyle."],
    ["À L'ATELIER, nous privilégions une approche humaine et personnalisée. Nous savons qu'un projet d'aménagement représente bien plus qu'un simple achat : c'est la création d'un espace de vie pensé pour le quotidien. C'est pourquoi nous mettons notre expertise à votre service afin de vous guider vers les solutions qui répondent le mieux à vos besoins, à votre style et à votre budget.", "At L'ATELIER, we prioritize a human, personalized approach. We know a design project is much more than a purchase: it is the creation of a living space planned for everyday life. That is why we put our expertise to work for you, guiding you toward solutions that best fit your needs, style, and budget."],
    ["Notre vision repose sur une expérience client moderne, fluide et efficace. Explorez nos collections en ligne à votre rythme, laissez-vous inspirer par nos créations et choisissez le moment qui vous convient pour récupérer votre commande. Nous avons repensé le processus d'achat afin de vous offrir une expérience simple, pratique et sans compromis sur la qualité du service.", "Our vision is built on a modern, smooth, and efficient customer experience. Explore our collections online at your own pace, get inspired by our creations, and choose the pickup time that works for you. We redesigned the buying process to offer a simple, practical experience without compromising service quality."],
    ["L'esprit de l'atelier se retrouve dans chacune de nos actions : écouter, concevoir, conseiller et accompagner. Notre engagement est de privilégier la proximité, l'efficacité et l'attention portée aux détails, depuis la sélection de vos produits de salle de bain jusqu'à leur cueillette.", "The workshop spirit is reflected in everything we do: listening, designing, advising, and supporting. Our commitment is to focus on closeness, efficiency, and attention to detail, from selecting your bathroom products through pickup."],
    ["Derrière L'ATELIER se trouve une équipe de passionnés qui partage les valeurs de l'artisanat : l'exigence du travail bien fait, la créativité, l'innovation et le respect du client. Forts de notre expérience et de notre compréhension des besoins des familles nord-américaines, nous imaginons des solutions à la fois esthétiques et fonctionnelles, conçues pour traverser le temps.", "Behind L'ATELIER is a passionate team that shares the values of craftsmanship: pride in well-made work, creativity, innovation, and respect for the customer. With our experience and understanding of North American families' needs, we imagine solutions that are both beautiful and functional, designed to stand the test of time."],
    ["L'ATELIER, c'est l'endroit où les idées prennent forme, où l'inspiration rencontre le savoir-faire et où chaque projet est façonné avec soin pour devenir un espace dont vous serez fier.", "L'ATELIER is where ideas take shape, where inspiration meets expertise, and where every project is carefully crafted into a space you will be proud of."],
    ["Réponses aux questions les plus fréquentes sur nos produits, les commandes, le ramassage, la garantie et l'entretien.", "Answers to the most common questions about our products, orders, pickup, warranty, and care."],
    ["Je veux acheter", "I want to buy"],
    ["Compatibilité et installation", "Compatibility and installation"],
    ["Disponibilité et commande", "Availability and ordering"],
    ["Paiement", "Payment"],
    ["Ramassage en entrepôt", "Warehouse pickup"],
    ["Garantie", "Warranty"],
    ["Retours et échanges", "Returns and exchanges"],
    ["L'entretien de mon produit", "Product care"],
    ["Spécifications techniques", "Technical specifications"],
    ["Oui.", "Yes."],
    ["Non.", "No."],
    ["Consultez les conditions de vente, les retours, les remboursements et les garanties applicables à vos achats chez L'Atelier.", "Review the sales terms, returns, refunds, and warranties that apply to your purchases at L'Atelier."],
    ["Résumé des politiques", "Policy summary"],
    ["Points importants", "Key points"],
    ["Conditions de vente", "Sales terms"],
    ["Retours et remboursements", "Returns and refunds"],
    ["Produits et information", "Products and information"],
    ["Prix affichés", "Displayed prices"],
    ["Les prix sont en dollars canadiens et excluent les taxes.", "Prices are in Canadian dollars and exclude taxes."],
    ["Inspection", "Inspection"],
    ["Toute anomalie visible doit être signalée rapidement après la prise de possession.", "Any visible issue must be reported promptly after taking possession."],
    ["Échange", "Exchange"],
    ["La demande d'échange doit être effectuée dans les 30 jours suivant la réception.", "Exchange requests must be made within 30 days of receipt."],
    ["Les vanités, lavabos et rangements sont garantis contre les défauts de fabrication.", "Vanities, sinks, and storage pieces are warranted against manufacturing defects."],
    ["L'Atelier : politique de vente", "L'Atelier: sales policy"],
    ["Termes de paiement", "Payment terms"],
    ["Le paiement complet est requis avant la préparation de la commande.", "Full payment is required before the order is prepared."],
    ["Vérification des paiements", "Payment verification"],
    ["Liste de prix", "Price list"],
    ["Produits retournés", "Returned products"],
    ["Droit de refus ou d'annulation de commande", "Right to refuse or cancel an order"],
    ["Inspection de la marchandise", "Merchandise inspection"],
    ["Service après-vente", "After-sales service"],
    ["Politique de retour et de remboursement", "Return and refund policy"],
    ["Avant l'achat", "Before purchase"],
    ["Protection des produits", "Product protection"],
    ["Produits couverts par la garantie", "Products covered by warranty"]
  ].forEach(([fr, en]) => add(fr, en));

  const REPLACEMENTS = [
    ["Couleur du comptoir", "Countertop color"],
    ["Comptoir inclus", "Countertop included"],
    ["salle de bain", "bathroom"],
    ["Salles de bain", "Bathrooms"],
    ["Salle de bain", "Bathroom"],
    ["vanité", "vanity"],
    ["Vanité", "Vanity"],
    ["comptoir", "countertop"],
    ["Comptoir", "Countertop"],
    ["couleur", "color"],
    ["Couleur", "Color"],
    ["matériau", "material"],
    ["Matériau", "Material"],
    ["matériel", "material"],
    ["Matériel", "Material"],
    ["largeur", "width"],
    ["Largeur", "Width"],
    ["hauteur", "height"],
    ["Hauteur", "Height"],
    ["longueur", "length"],
    ["Longueur", "Length"],
    ["profondeur", "depth"],
    ["Profondeur", "Depth"],
    ["bois naturel", "natural wood"],
    ["Bois naturel", "Natural wood"],
    ["bois", "wood"],
    ["Bois", "Wood"],
    ["marbre synthétique", "cultured marble"],
    ["Marbre synthétique", "Cultured marble"],
    ["céramique", "ceramic"],
    ["Céramique", "Ceramic"],
    ["acrylique", "acrylic"],
    ["Acrylique", "Acrylic"],
    ["verre", "glass"],
    ["Verre", "Glass"],
    ["quincaillerie", "hardware"],
    ["Quincaillerie", "Hardware"],
    ["noir mat", "matte black"],
    ["Noir mat", "Matte black"],
    ["blanc brillant", "glossy white"],
    ["Blanc brillant", "Glossy white"],
    ["inclus", "included"],
    ["Inclus", "Included"],
    ["vendue séparément", "sold separately"],
    ["vendu séparément", "sold separately"],
    ["fini", "finish"],
    ["Fini", "Finish"],
    ["rustique", "rustic"],
    ["Rustique", "Rustic"],
    ["moderne", "modern"],
    ["Moderne", "Modern"],
    ["intemporelle", "timeless"],
    ["Intemporelle", "Timeless"],
    ["intemporel", "timeless"],
    ["Intemporel", "Timeless"],
    ["autoportante", "freestanding"],
    ["Autoportante", "Freestanding"],
    ["autoportant", "freestanding"],
    ["Autoportant", "Freestanding"],
    ["intelligente", "smart"],
    ["Intelligente", "Smart"],
    ["porte pivotante", "pivot door"],
    ["Porte pivotante", "Pivot door"],
    ["panneau de douche", "shower panel"],
    ["Panneau de douche", "Shower panel"],
    ["base de douche", "shower base"],
    ["Base de douche", "Shower base"],
    ["porte de douche", "shower door"],
    ["Porte de douche", "Shower door"],
    ["vue secondaire", "secondary view"],
    ["Vue secondaire", "Secondary view"],
    ["en contexte", "in context"],
    ["En contexte", "In context"],
    ["avec comptoir blanc", "with white countertop"],
    ["avec comptoir noir", "with black countertop"],
    ["avec comptoir gris", "with gray countertop"],
    ["pouces", "inches"],
    ["Pouces", "Inches"]
  ];

  function getSavedLanguage() {
    const params = new URLSearchParams(window.location.search);
    const queryLanguage = params.get("lang");
    if (SUPPORTED_LANGUAGES.has(queryLanguage)) return queryLanguage;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED_LANGUAGES.has(saved)) return saved;
    } catch (error) {
      return "fr";
    }

    return "fr";
  }

  function saveLanguage(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // Local storage is optional; the page can still switch languages.
    }
  }

  function normalizeKey(value) {
    return String(value ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  function translateInterpolated(value) {
    const text = normalizeKey(value);
    let match = text.match(/^Aucun produit trouvé pour "(.+)"\.$/);
    if (match) return `No products found for "${match[1]}".`;

    match = text.match(/^Voir image ([0-9]+)$/);
    if (match) return `View image ${match[1]}`;

    match = text.match(/^Recherche pour "(.+)"$/);
    if (match) return `Search for "${match[1]}"`;

    match = text.match(/^Voici les produits qui correspondent à "(.+)"\.$/);
    if (match) return `Here are the products that match "${match[1]}".`;

    return "";
  }

  function translateWithReplacements(value) {
    let translated = normalizeKey(value);
    if (!translated || translated.length > 180) return "";

    let changed = false;
    REPLACEMENTS.forEach(([fr, en]) => {
      if (translated.includes(fr)) {
        translated = translated.split(fr).join(en);
        changed = true;
      }
    });

    return changed ? translated : "";
  }

  function translateValue(value) {
    const text = normalizeKey(value);
    if (!text) return value;

    const exact = TRANSLATIONS.get(text);
    if (exact) return exact;

    const interpolated = translateInterpolated(text);
    if (interpolated) return interpolated;

    const replaced = translateWithReplacements(text);
    if (replaced) return replaced;

    return value;
  }

  function withOriginalWhitespace(original, translated) {
    const source = String(original ?? "");
    const leading = source.match(/^\s*/)?.[0] || "";
    const trailing = source.match(/\s*$/)?.[0] || "";
    return `${leading}${translated}${trailing}`;
  }

  function shouldSkipNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    return Boolean(parent.closest("script, style, noscript, [data-i18n-skip]"));
  }

  function translateTextNode(node, language) {
    if (shouldSkipNode(node) || !node.nodeValue.trim()) return;
    if (!originalTextNodes.has(node)) {
      originalTextNodes.set(node, node.nodeValue);
    }

    const original = originalTextNodes.get(node);
    node.nodeValue = language === "fr"
      ? original
      : withOriginalWhitespace(original, translateValue(original));
  }

  function translateElementAttributes(element, language) {
    const attributes = ["aria-label", "alt", "placeholder", "title"];
    attributes.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;

      let store = originalAttributes.get(element);
      if (!store) {
        store = {};
        originalAttributes.set(element, store);
      }

      if (!Object.prototype.hasOwnProperty.call(store, attribute)) {
        store[attribute] = element.getAttribute(attribute);
      }

      const original = store[attribute] || "";
      element.setAttribute(attribute, language === "fr" ? original : translateValue(original));
    });
  }

  function translateTree(root, language) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, language);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

    if (root.nodeType === Node.ELEMENT_NODE) {
      translateElementAttributes(root, language);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldSkipNode(node) || !node.nodeValue.trim()
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    });

    let node = walker.nextNode();
    while (node) {
      translateTextNode(node, language);
      node = walker.nextNode();
    }

    if (root.querySelectorAll) {
      root.querySelectorAll("*").forEach((element) => translateElementAttributes(element, language));
    }
  }

  function translateDocumentTitle(language) {
    if (!document.title) return;

    if (!translateDocumentTitle.originalTitle || translateDocumentTitle.lastSeenTitle !== document.title) {
      translateDocumentTitle.originalTitle = document.title;
    }

    const original = translateDocumentTitle.originalTitle;
    translateDocumentTitle.lastSeenTitle = language === "fr" ? original : translateValue(original);
    document.title = translateDocumentTitle.lastSeenTitle;
  }

  function updateSwitcher(language) {
    document.querySelectorAll("[data-language-option]").forEach((button) => {
      const isActive = button.dataset.languageOption === language;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function setLanguage(language) {
    if (!SUPPORTED_LANGUAGES.has(language)) return;
    window.LatelierI18n.language = language;
    saveLanguage(language);
    document.documentElement.lang = language;
    translateTree(document.body, language);
    translateDocumentTitle(language);
    updateSwitcher(language);
    window.dispatchEvent(new CustomEvent("latelier:language-changed", { detail: { language } }));
  }

  function injectSwitcher() {
    const actions = document.querySelector(".header-actions");
    if (!actions || actions.querySelector("[data-language-switcher]")) return;

    const switcher = document.createElement("div");
    switcher.className = "language-switcher";
    switcher.setAttribute("data-language-switcher", "");
    switcher.setAttribute("role", "group");
    switcher.setAttribute("aria-label", "Language");
    switcher.setAttribute("data-i18n-skip", "");
    switcher.innerHTML = `
      <button type="button" data-language-option="en" aria-pressed="false">EN</button>
      <button type="button" data-language-option="fr" aria-pressed="true">FR</button>
    `;

    actions.prepend(switcher);
    switcher.addEventListener("click", (event) => {
      const button = event.target.closest("[data-language-option]");
      if (!button) return;
      setLanguage(button.dataset.languageOption);
    });
  }

  function observeDynamicContent() {
    const observer = new MutationObserver((mutations) => {
      const language = window.LatelierI18n.language;
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          const node = mutation.target;
          const original = originalTextNodes.get(node);
          const translated = original ? withOriginalWhitespace(original, translateValue(original)) : "";
          if (language === "en" && original && node.nodeValue === translated) return;
          originalTextNodes.set(node, node.nodeValue);
          translateTextNode(node, language);
          return;
        }

        mutation.addedNodes.forEach((node) => translateTree(node, language));

        if (mutation.type === "attributes" && mutation.target instanceof Element) {
          translateElementAttributes(mutation.target, language);
        }
      });
      translateDocumentTitle(language);
      updateSwitcher(language);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "alt", "placeholder", "title"]
    });
  }

  function boot() {
    injectSwitcher();
    setLanguage(getSavedLanguage());
    observeDynamicContent();
  }

  window.LatelierI18n = {
    language: getSavedLanguage(),
    setLanguage,
    translateText: translateValue,
    translatePage: () => setLanguage(window.LatelierI18n.language)
  };

  document.addEventListener("DOMContentLoaded", boot);
})();
