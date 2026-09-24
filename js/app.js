"use strict";
/* =========================================================
   FENVA BEAUTY
   Frontend application
   GitHub Pages + API serveur
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

/*
 * En développement :
 *   http://localhost:3000
 *
 * En production :
 *   URL de ton serveur Render
 *
 * Exemple :
 *   https://fenva-beauty-api.onrender.com
 *
 * NE PAS mettre de mot de passe ou de clé secrète ici.
 */

const API_BASE_URL =
  window.FENVA_API_URL ||
  "https://fenva-beauty-api.onrender.com";


const API = {
  products: `${API_BASE_URL}/api/products`,
  orders: `${API_BASE_URL}/api/orders`,
  settings: `${API_BASE_URL}/api/settings`,
  promotion: `${API_BASE_URL}/api/promotion`,
  adminLogin: `${API_BASE_URL}/api/admin/login`
};


/* =========================================================
   ÉTAT DE L'APPLICATION
========================================================= */

const state = {

  products: [],

  filteredProducts: [],

  cart: [],

  search: "",

  category: "all",

  sort: "default",

  settings: {},

  promotion: null,

  isLoadingProducts: false,

  isSubmittingOrder: false

};


/* =========================================================
   SÉLECTEURS DOM
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => [
  ...document.querySelectorAll(selector)
];


/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeApp();

});


async function initializeApp() {

  setupYear();

  setupNavigation();

  setupModals();

  setupSearch();

  setupFilters();

  setupCategories();

  setupCartEvents();

  setupCheckout();

  setupAdminLogin();

  loadCart();

  renderCart();

  await loadStoreData();

}


/* =========================================================
   ANNÉE
========================================================= */

function setupYear() {

  const year = $("#currentYear");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

}


/* =========================================================
   API
========================================================= */

/*
 * Toutes les données importantes viennent du serveur.
 *
 * Le frontend ne contient aucune base de données.
 */

async function apiRequest(
  url,
  options = {}
) {

  const defaultOptions = {

    headers: {
      "Content-Type": "application/json"
    },

    ...options

  };


  const response = await fetch(
    url,
    defaultOptions
  );


  let data = null;


  try {

    data = await response.json();

  } catch {

    data = null;

  }


  if (!response.ok) {

    const message =
      data?.message ||
      data?.error ||
      `Erreur serveur (${response.status})`;

    throw new Error(message);

  }


  return data;

}


/* =========================================================
   CHARGEMENT DE LA BOUTIQUE
========================================================= */

async function loadStoreData() {

  state.isLoadingProducts = true;

  showProductsLoading();


  try {

    /*
     * Produits
     */

    const productResponse =
      await apiRequest(API.products);


    state.products =
      normalizeProducts(
        productResponse
      );


    /*
     * Paramètres de la boutique
     */

    try {

      const settingsResponse =
        await apiRequest(API.settings);

      state.settings =
        settingsResponse?.settings ||
        settingsResponse ||
        {};

      applyStoreSettings();

    } catch (error) {

      console.warn(
        "Paramètres non disponibles :",
        error.message
      );

    }


    /*
     * Promotions
     */

    try {

      const promotionResponse =
        await apiRequest(API.promotion);

      state.promotion =
        promotionResponse?.promotion ||
        promotionResponse ||
        null;

    } catch (error) {

      console.warn(
        "Promotions non disponibles :",
        error.message
      );

    }


    applyFilters();

  } catch (error) {

    console.error(
      "Erreur de chargement :",
      error
    );

    showProductsError();

  } finally {

    state.isLoadingProducts = false;

  }

}


/* =========================================================
   NORMALISATION DES PRODUITS
========================================================= */

function normalizeProducts(response) {

  let products = [];


  if (Array.isArray(response)) {

    products = response;

  } else if (
    Array.isArray(response?.products)
  ) {

    products = response.products;

  }


  return products.map(product => ({

    id:
      product.id,

    name:
      product.name ||
      "Produit sans nom",

    description:
      product.description ||
      "",

    category:
      String(
        product.category ||
        "autres"
      ).toLowerCase(),

    price:
      Number(
        product.price || 0
      ),

    oldPrice:
      product.old_price !== undefined
        ? Number(product.old_price)
        : product.oldPrice !== undefined
          ? Number(product.oldPrice)
          : null,

    image:
      product.image ||
      product.image_url ||
      "assets/images/product-placeholder.jpg",

    stock:
      Number(
        product.stock ?? 0
      ),

    active:
      product.active !== false,

    isNew:
      Boolean(
        product.is_new ??
        product.isNew ??
        false
      ),

    isPopular:
      Boolean(
        product.is_popular ??
        product.isPopular ??
        false
      ),

    isPromotion:
      Boolean(
        product.is_promotion ??
        product.isPromotion ??
        false
      ),

    createdAt:
      product.created_at ||
      product.createdAt ||
      null

  }));

}


/* =========================================================
   PARAMÈTRES DE LA BOUTIQUE
========================================================= */

function applyStoreSettings() {

  const settings =
    state.settings || {};


  if (settings.phone) {

    const phone =
      $("#footerPhone");

    if (phone) {

      phone.textContent =
        `Téléphone : ${settings.phone}`;

    }

  }


  if (settings.whatsapp) {

    const whatsapp =
      $("#footerWhatsapp");

    if (whatsapp) {

      whatsapp.textContent =
        `WhatsApp : ${settings.whatsapp}`;

    }

  }


  if (settings.address) {

    const address =
      $("#footerAddress");

    if (address) {

      address.textContent =
        settings.address;

    }

  }


  if (settings.store_name) {

    document.title =
      `${settings.store_name} — Beauté & soins`;

  }

}


/* =========================================================
   NAVIGATION MOBILE
========================================================= */

function setupNavigation() {

  const button =
    $("#mobileMenuButton");

  const navigation =
    $("#mainNavigation");


  if (!button || !navigation) {
    return;
  }


  button.addEventListener(
    "click",
    () => {

      navigation.classList.toggle(
        "open"
      );

    }
  );


  $$("#mainNavigation a")
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {

          navigation.classList.remove(
            "open"
          );

        }
      );

    });

}


/* =========================================================
   MODALES
========================================================= */

function setupModals() {

  /*
   * Boutons de fermeture
   */

  $$("[data-close-modal]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const modalId =
            button.dataset.closeModal;

          closeModal(modalId);

        }
      );

    });


  /*
   * Fermeture en cliquant sur
   * l'arrière-plan
   */

  $$(".modal-overlay")
    .forEach(overlay => {

      overlay.addEventListener(
        "click",
        event => {

          if (
            event.target === overlay
          ) {

            closeModal(
              overlay.id
            );

          }

        }
      );

    });


  /*
   * Touche Escape
   */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Escape"
      ) {

        return;

      }


      const openedModal =
        $(".modal-overlay.open");


      if (openedModal) {

        closeModal(
          openedModal.id
        );

      }

    }
  );

}


function openModal(id) {

  const modal =
    document.getElementById(id);


  if (!modal) {
    return;
  }


  modal.classList.add("open");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-open"
  );

}


function closeModal(id) {

  const modal =
    document.getElementById(id);


  if (!modal) {
    return;
  }


  modal.classList.remove("open");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  if (
    !$(".modal-overlay.open")
  ) {

    document.body.classList.remove(
      "modal-open"
    );

  }

}


/* =========================================================
   RECHERCHE
========================================================= */

function setupSearch() {

  const input =
    $("#searchInput");

  const button =
    $("#searchButton");


  if (!input) {
    return;
  }


  input.addEventListener(
    "input",
    () => {

      state.search =
        input.value
          .trim()
          .toLowerCase();

      applyFilters();

    }
  );


  if (button) {

    button.addEventListener(
      "click",
      () => {

        document
          .getElementById("boutique")
          ?.scrollIntoView({
            behavior: "smooth"
          });

      }
    );

  }


  input.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        document
          .getElementById("boutique")
          ?.scrollIntoView({
            behavior: "smooth"
          });

      }

    }
  );

}


/* =========================================================
   FILTRES
========================================================= */

function setupFilters() {

  const categoryFilter =
    $("#categoryFilter");

  const sortProducts =
    $("#sortProducts");

  const resetFilters =
    $("#resetFilters");


  if (categoryFilter) {

    categoryFilter.addEventListener(
      "change",
      () => {

        state.category =
          categoryFilter.value;

        applyFilters();

      }
    );

  }


  if (sortProducts) {

    sortProducts.addEventListener(
      "change",
      () => {

        state.sort =
          sortProducts.value;

        applyFilters();

      }
    );

  }


  if (resetFilters) {

    resetFilters.addEventListener(
      "click",
      resetAllFilters
    );

  }


  $$("[data-filter]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const filter =
            button.dataset.filter;

          if (
            filter === "new"
          ) {

            state.category =
              "all";

            state.search = "";

            const searchInput =
              $("#searchInput");

            if (searchInput) {
              searchInput.value = "";
            }

            state.sort =
              "newest";

            if (sortProducts) {
              sortProducts.value =
                "newest";
            }

          }


          if (
            filter === "promotion"
          ) {

            state.category =
              "all";

            state.search = "";

            const searchInput =
              $("#searchInput");

            if (searchInput) {
              searchInput.value = "";
            }

          }


          applyFilters();


          document
            .getElementById("boutique")
            ?.scrollIntoView({
              behavior: "smooth"
            });

        }
      );

    });

}


function resetAllFilters() {

  state.search = "";

  state.category = "all";

  state.sort = "default";


  const searchInput =
    $("#searchInput");

  const categoryFilter =
    $("#categoryFilter");

  const sortProducts =
    $("#sortProducts");


  if (searchInput) {
    searchInput.value = "";
  }


  if (categoryFilter) {
    categoryFilter.value = "all";
  }


  if (sortProducts) {
    sortProducts.value = "default";
  }


  applyFilters();

}


/* =========================================================
   CATÉGORIES
========================================================= */

function setupCategories() {

  $$(".category-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          const category =
            card.dataset.category;


          state.category =
            category;


          const filter =
            $("#categoryFilter");


          if (filter) {
            filter.value =
              category;
          }


          applyFilters();


          document
            .getElementById("boutique")
            ?.scrollIntoView({
              behavior: "smooth"
            });

        }
      );

    });

}


/* =========================================================
   APPLICATION DES FILTRES
========================================================= */

function applyFilters() {

  let products =
    state.products.filter(
      product =>
        product.active
    );


  /*
   * Recherche
   */

  if (state.search) {

    products =
      products.filter(
        product => {

          const searchable = [
            product.name,
            product.description,
            product.category
          ]
            .join(" ")
            .toLowerCase();


          return searchable.includes(
            state.search
          );

        }
      );

  }


  /*
   * Catégorie
   */

  if (
    state.category &&
    state.category !== "all"
  ) {

    products =
      products.filter(
        product =>
          product.category ===
          state.category
      );

  }


  /*
   * Tri
   */

  products =
    sortProductList(
      products,
      state.sort
    );


  state.filteredProducts =
    products;


  renderProducts();


  renderNewProducts();

  renderPromotionProducts();


  updateProductCount();

}


/* =========================================================
   TRI
========================================================= */

function sortProductList(
  products,
  sort
) {

  const result =
    [...products];


  switch (sort) {

    case "price-asc":

      return result.sort(
        (a, b) =>
          a.price - b.price
      );


    case "price-desc":

      return result.sort(
        (a, b) =>
          b.price - a.price
      );


    case "name":

      return result.sort(
        (a, b) =>
          a.name.localeCompare(
            b.name,
            "fr"
          )
      );


    case "newest":

      return result.sort(
        (a, b) =>
          new Date(
            b.createdAt || 0
          ) -
          new Date(
            a.createdAt || 0
          )
      );


    default:

      return result;

  }

}


/* =========================================================
   AFFICHAGE DES PRODUITS
========================================================= */

function renderProducts() {

  const container =
    $("#allProducts");

  const emptyState =
    $("#noProducts");


  if (!container) {
    return;
  }


  const products =
    state.filteredProducts;


  if (!products.length) {

    container.innerHTML = "";

    emptyState?.classList.remove(
      "hidden"
    );

    return;

  }


  emptyState?.classList.add(
    "hidden"
  );


  container.innerHTML =
    products
      .map(productCardTemplate)
      .join("");


  bindProductButtons(
    container
  );

}


function renderNewProducts() {

  const container =
    $("#newProducts");


  if (!container) {
    return;
  }


  const products =
    state.products
      .filter(
        product =>
          product.active &&
          product.isNew
      )
      .slice(0, 4);


  if (!products.length) {

    container.innerHTML =
      emptyProductsMessage(
        "Les nouveautés seront bientôt disponibles."
      );

    return;

  }


  container.innerHTML =
    products
      .map(productCardTemplate)
      .join("");


  bindProductButtons(
    container
  );

}


function renderPromotionProducts() {

  const container =
    $("#promotionProducts");


  if (!container) {
    return;
  }


  const products =
    state.products
      .filter(
        product =>
          product.active &&
          product.isPromotion
      )
      .slice(0, 4);


  if (!products.length) {

    container.innerHTML =
      emptyProductsMessage(
        "Aucune promotion disponible pour le moment."
      );

    return;

  }


  container.innerHTML =
    products
      .map(productCardTemplate)
      .join("");


  bindProductButtons(
    container
  );

}


/* =========================================================
   CARTE PRODUIT
========================================================= */

function productCardTemplate(
  product
) {

  const promotion =
    product.isPromotion &&
    product.oldPrice &&
    product.oldPrice > product.price;


  const badge =
    promotion
      ? `<span class="product-badge promotion">Promotion</span>`
      : product.isNew
        ? `<span class="product-badge">Nouveau</span>`
        : "";


  const stockText =
    product.stock > 0
      ? ""
      : `<span class="stock-empty">Rupture de stock</span>`;


  return `

    <article
      class="product-card"
      data-product-id="${escapeAttribute(product.id)}"
    >

      <div class="product-image">

        ${badge}

        <img
          src="${escapeAttribute(product.image)}"
          alt="${escapeAttribute(product.name)}"
          loading="lazy"
          onerror="this.src='assets/images/product-placeholder.jpg'"
        >

      </div>


      <div class="product-info">

        <div class="product-category">
          ${escapeHTML(
            formatCategory(product.category)
          )}
        </div>


        <h3 class="product-name">
          ${escapeHTML(product.name)}
        </h3>


        <p class="product-description">
          ${escapeHTML(
            product.description
          )}
        </p>


        <div class="product-price">

          <span class="product-price-current">
            ${formatPrice(product.price)}
          </span>

          ${
            promotion
              ? `
                <span class="product-price-old">
                  ${formatPrice(product.oldPrice)}
                </span>
              `
              : ""
          }

        </div>


        ${stockText}


        <div class="product-actions">

          <button
            type="button"
            class="view-product"
            data-product-id="${escapeAttribute(product.id)}"
          >
            Voir le produit
          </button>


          <button
            type="button"
            class="add-to-cart"
            data-product-id="${escapeAttribute(product.id)}"
            ${
              product.stock <= 0
                ? "disabled"
                : ""
            }
          >
            ${
              product.stock > 0
                ? "Ajouter au panier"
                : "Indisponible"
            }
          </button>

        </div>

      </div>

    </article>

  `;

}


/* =========================================================
   BOUTONS PRODUITS
========================================================= */

function bindProductButtons(
  container
) {

  container
    .querySelectorAll(
      ".add-to-cart"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.productId;

          addToCart(id);

        }
      );

    });


  container
    .querySelectorAll(
      ".view-product"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.productId;

          openProductModal(id);

        }
      );

    });

}


/* =========================================================
   MODAL PRODUIT
========================================================= */

function openProductModal(
  productId
) {

  const product =
    findProduct(productId);


  if (!product) {
    return;
  }


  const container =
    $("#productModalContent");


  if (!container) {
    return;
  }


  const promotion =
    product.isPromotion &&
    product.oldPrice &&
    product.oldPrice > product.price;


  container.innerHTML = `

    <div class="product-modal-content">

      <div class="product-modal-image">

        <img
          src="${escapeAttribute(product.image)}"
          alt="${escapeAttribute(product.name)}"
          onerror="this.src='assets/images/product-placeholder.jpg'"
        >

      </div>


      <div class="product-modal-details">

        <div class="product-category">
          ${escapeHTML(
            formatCategory(product.category)
          )}
        </div>


        <h2>
          ${escapeHTML(product.name)}
        </h2>


        <p class="description">
          ${escapeHTML(product.description)}
        </p>


        <div class="product-modal-price">

          ${formatPrice(product.price)}

          ${
            promotion
              ? `
                <span class="product-price-old">
                  ${formatPrice(product.oldPrice)}
                </span>
              `
              : ""
          }

        </div>


        <p>
          ${
            product.stock > 0
              ? `${product.stock} disponible(s)`
              : "Produit actuellement indisponible"
          }
        </p>


        <button
          type="button"
          class="button button-dark button-full"
          id="modalAddToCart"
          ${
            product.stock <= 0
              ? "disabled"
              : ""
          }
        >
          ${
            product.stock > 0
              ? "Ajouter au panier"
              : "Indisponible"
          }
        </button>

      </div>

    </div>

  `;


  const addButton =
    $("#modalAddToCart");


  if (addButton) {

    addButton.addEventListener(
      "click",
      () => {

        addToCart(product.id);

        closeModal(
          "productModal"
        );

      }
    );

  }


  openModal(
    "productModal"
  );

}


/* =========================================================
   PANIER
========================================================= */

function setupCartEvents() {

  const cartButton =
    $("#cartButton");


  if (cartButton) {

    cartButton.addEventListener(
      "click",
      () => {

        renderCart();

        openModal(
          "cartModal"
        );

      }
    );

  }


  const checkoutButton =
    $("#checkoutButton");


  if (checkoutButton) {

    checkoutButton.addEventListener(
      "click",
      openCheckout
    );

  }

}


/* =========================================================
   CHARGER LE PANIER
========================================================= */

function loadCart() {

  try {

    const saved =
      localStorage.getItem(
        "fenva_beauty_cart"
      );


    if (!saved) {
      state.cart = [];
      return;
    }


    const parsed =
      JSON.parse(saved);


    if (
      !Array.isArray(parsed)
    ) {

      state.cart = [];
      return;

    }


    state.cart =
      parsed.filter(
        item =>
          item &&
          item.id &&
          Number(item.quantity) > 0
      );

  } catch (error) {

    console.error(
      "Impossible de charger le panier :",
      error
    );

    state.cart = [];

  }

}


/* =========================================================
   SAUVEGARDER LE PANIER
========================================================= */

function saveCart() {

  try {

    localStorage.setItem(
      "fenva_beauty_cart",
      JSON.stringify(
        state.cart
      )
    );

  } catch (error) {

    console.error(
      "Impossible de sauvegarder le panier :",
      error
    );

  }

}


/* =========================================================
   AJOUTER AU PANIER
========================================================= */

function addToCart(
  productId
) {

  const product =
    findProduct(productId);


  if (!product) {

    showToast(
      "Produit introuvable."
    );

    return;

  }


  if (
    product.stock <= 0
  ) {

    showToast(
      "Ce produit est actuellement indisponible."
    );

    return;

  }


  const existing =
    state.cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );


  if (existing) {

    if (
      existing.quantity >=
      product.stock
    ) {

      showToast(
        "La quantité disponible a été atteinte."
      );

      return;

    }


    existing.quantity += 1;

  } else {

    state.cart.push({

      id:
        product.id,

      quantity:
        1

    });

  }


  saveCart();

  renderCart();

  showToast(
    "Produit ajouté au panier."
  );

}


/* =========================================================
   MODIFIER QUANTITÉ
========================================================= */

function changeCartQuantity(
  productId,
  change
) {

  const item =
    state.cart.find(
      cartItem =>
        String(cartItem.id) ===
        String(productId)
    );


  const product =
    findProduct(productId);


  if (!item || !product) {
    return;
  }


  const newQuantity =
    item.quantity + change;


  if (
    newQuantity <= 0
  ) {

    removeFromCart(
      productId
    );

    return;

  }


  if (
    newQuantity >
    product.stock
  ) {

    showToast(
      "Stock disponible insuffisant."
    );

    return;

  }


  item.quantity =
    newQuantity;


  saveCart();

  renderCart();

}


/* =========================================================
   SUPPRIMER DU PANIER
========================================================= */

function removeFromCart(
  productId
) {

  state.cart =
    state.cart.filter(
      item =>
        String(item.id) !==
        String(productId)
    );


  saveCart();

  renderCart();

}


/* =========================================================
   AFFICHER LE PANIER
========================================================= */

function renderCart() {

  const container =
    $("#cartItems");

  const count =
    $("#cartCount");

  const subtotalElement =
    $("#cartSubtotal");

  const totalElement =
    $("#cartTotal");

  const checkoutTotal =
    $("#checkoutTotal");


  if (!container) {
    return;
  }


  let itemCount = 0;

  let subtotal = 0;


  const validItems =
    state.cart
      .map(item => {

        const product =
          findProduct(item.id);

        if (!product) {
          return null;
        }

        const quantity =
          Math.min(
            Number(item.quantity),
            Math.max(
              product.stock,
              0
            )
          );


        if (
          quantity <= 0
        ) {
          return null;
        }


        item.quantity =
          quantity;


        itemCount +=
          quantity;


        subtotal +=
          product.price *
          quantity;


        return {
          item,
          product
        };

      })
      .filter(Boolean);


  state.cart =
    validItems.map(
      ({ item }) => item
    );


  if (!validItems.length) {

    container.innerHTML = `
      <div class="empty-cart">
        Votre panier est vide.
      </div>
    `;

  } else {

    container.innerHTML =
      validItems
        .map(
          ({
            item,
            product
          }) =>
            cartItemTemplate(
              item,
              product
            )
        )
        .join("");


    bindCartButtons(
      container
    );

  }


  if (count) {

    count.textContent =
      itemCount;

  }


  if (subtotalElement) {

    subtotalElement.textContent =
      formatPrice(subtotal);

  }


  if (totalElement) {

    totalElement.textContent =
      formatPrice(subtotal);

  }


  if (checkoutTotal) {

    checkoutTotal.textContent =
      formatPrice(subtotal);

  }


  saveCart();

}


function cartItemTemplate(
  item,
  product
) {

  return `

    <div class="cart-item">

      <div class="cart-item-image">

        <img
          src="${escapeAttribute(product.image)}"
          alt="${escapeAttribute(product.name)}"
          onerror="this.src='assets/images/product-placeholder.jpg'"
        >

      </div>


      <div>

        <h3 class="cart-item-name">
          ${escapeHTML(product.name)}
        </h3>

        <div class="cart-item-price">
          ${formatPrice(product.price)}
        </div>


        <div class="cart-item-controls">

          <button
            type="button"
            data-cart-action="decrease"
            data-product-id="${escapeAttribute(product.id)}"
          >
            −
          </button>

          <span>
            ${item.quantity}
          </span>

          <button
            type="button"
            data-cart-action="increase"
            data-product-id="${escapeAttribute(product.id)}"
          >
            +
          </button>

        </div>

      </div>


      <button
        type="button"
        class="cart-item-remove"
        data-cart-action="remove"
        data-product-id="${escapeAttribute(product.id)}"
        aria-label="Supprimer ${escapeAttribute(product.name)}"
      >
        ×
      </button>

    </div>

  `;

}


/* =========================================================
   BOUTONS PANIER
========================================================= */

function bindCartButtons(
  container
) {

  container
    .querySelectorAll(
      "[data-cart-action]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const action =
            button.dataset.cartAction;

          const productId =
            button.dataset.productId;


          if (
            action ===
            "increase"
          ) {

            changeCartQuantity(
              productId,
              1
            );

          }


          if (
            action ===
            "decrease"
          ) {

            changeCartQuantity(
              productId,
              -1
            );

          }


          if (
            action ===
            "remove"
          ) {

            removeFromCart(
              productId
            );

          }

        }
      );

    });

}


/* =========================================================
   CHECKOUT
========================================================= */

function setupCheckout() {

  const form =
    $("#checkoutForm");


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    handleCheckoutSubmit
  );

}


function openCheckout() {

  if (!state.cart.length) {

    showToast(
      "Votre panier est vide."
    );

    return;

  }


  renderCart();


  const total =
    calculateCartTotal();


  if (
    total <= 0
  ) {

    showToast(
      "Votre panier ne contient aucun produit disponible."
    );

    return;

  }


  closeModal(
    "cartModal"
  );


  openModal(
    "checkoutModal"
  );

}


async function handleCheckoutSubmit(
  event
) {

  event.preventDefault();


  if (
    state.isSubmittingOrder
  ) {
    return;
  }


  const form =
    event.currentTarget;


  const message =
    $("#checkoutMessage");


  const button =
    $("#submitOrderButton");


  const customerName =
    $("#customerName")?.value.trim();


  const customerPhone =
    $("#customerPhone")?.value.trim();


  const customerAddress =
    $("#customerAddress")?.value.trim();


  const paymentMethod =
    $("#paymentMethod")?.value;


  if (
    !customerName ||
    !customerPhone ||
    !customerAddress ||
    !paymentMethod
  ) {

    showFormMessage(
      message,
      "Veuillez remplir tous les champs."
    );

    return;

  }


  if (!state.cart.length) {

    showFormMessage(
      message,
      "Votre panier est vide."
    );

    return;

  }


  const items =
    state.cart
      .map(item => {

        const product =
          findProduct(item.id);


        if (!product) {
          return null;
        }


        return {

          product_id:
            product.id,

          quantity:
            item.quantity

        };

      })
      .filter(Boolean);


  if (!items.length) {

    showFormMessage(
      message,
      "Votre panier ne contient aucun produit valide."
    );

    return;

  }


  const orderData = {

    customer: {

      name:
        customerName,

      phone:
        customerPhone,

      address:
        customerAddress

    },

    payment_method:
      paymentMethod,

    items

  };


  state.isSubmittingOrder =
    true;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Envoi de la commande...";

  }


  clearFormMessage(
    message
  );


  try {

    /*
     * La commande est envoyée
     * au serveur.
     */

    const response =
      await apiRequest(
        API.orders,
        {

          method:
            "POST",

          body:
            JSON.stringify(
              orderData
            )

        }
      );


    /*
     * Succès
     */

    state.cart = [];

    saveCart();

    renderCart();


    form.reset();


    closeModal(
      "checkoutModal"
    );


    showToast(
      response?.message ||
      "Votre commande a été envoyée avec succès."
    );


    /*
     * Recharger les produits afin
     * d'obtenir les stocks actualisés.
     */

    await loadStoreData();


  } catch (error) {

    console.error(
      "Commande impossible :",
      error
    );


    showFormMessage(
      message,
      error.message ||
      "Impossible d'envoyer la commande. Veuillez réessayer."
    );

  } finally {

    state.isSubmittingOrder =
      false;


    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Confirmer la commande";

    }

  }

}


/* =========================================================
   ADMINISTRATION
========================================================= */

function setupAdminLogin() {

  const adminButton =
    $("#adminButton");

  const form =
    $("#adminLoginForm");


  /*
   * Le bouton Administration
   */

  if (adminButton) {

    adminButton.addEventListener(
      "click",
      () => {

        openModal(
          "adminLoginModal"
        );

      }
    );

  }


  /*
   * Connexion
   */

  if (form) {

    form.addEventListener(
      "submit",
      handleAdminLogin
    );

  }

}


async function handleAdminLogin(
  event
) {

  event.preventDefault();


  const form =
    event.currentTarget;


  const message =
    $("#adminLoginMessage");


  const button =
    $("#adminLoginButton");


  const username =
    $("#adminUsername")
      ?.value.trim();


  const password =
    $("#adminPassword")
      ?.value;


  if (
    !username ||
    !password
  ) {

    showFormMessage(
      message,
      "Veuillez saisir vos identifiants."
    );

    return;

  }


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Connexion...";

  }


  clearFormMessage(
    message
  );


  try {

    const response =
      await apiRequest(
        API.adminLogin,
        {

          method:
            "POST",

          body:
            JSON.stringify({

              username,

              password

            })

        }
      );


    /*
     * Le serveur décidera
     * comment gérer le token/session.
     *
     * Le frontend ne contient
     * aucun mot de passe.
     */

    if (
      response?.token
    ) {

      sessionStorage.setItem(
        "fenva_admin_token",
        response.token
      );

    }


    closeModal(
      "adminLoginModal"
    );


    form.reset();


    /*
     * La page d'administration
     * sera ajoutée ensuite.
     */

    if (
      response?.redirect
    ) {

      window.location.href =
        response.redirect;

    } else {

      window.location.href =
        "admin.html";

    }


  } catch (error) {

    console.error(
      "Connexion admin impossible :",
      error
    );


    showFormMessage(
      message,
      error.message ||
      "Identifiants incorrects."
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Se connecter";

    }

  }

}


/* =========================================================
   PRODUITS
========================================================= */

function findProduct(
  productId
) {

  return state.products.find(
    product =>
      String(product.id) ===
      String(productId)
  );

}


/* =========================================================
   TOTAL PANIER
========================================================= */

function calculateCartTotal() {

  return state.cart.reduce(
    (total, item) => {

      const product =
        findProduct(item.id);


      if (!product) {
        return total;
      }


      return (
        total +
        product.price *
        item.quantity
      );

    },
    0
  );

}


/* =========================================================
   COMPTEUR PRODUITS
========================================================= */

function updateProductCount() {

  const element =
    $("#productResultCount");


  if (!element) {
    return;
  }


  const count =
    state.filteredProducts.length;


  element.textContent =
    count === 1
      ? "1 produit"
      : `${count} produits`;

}


/* =========================================================
   CHARGEMENT
========================================================= */

function showProductsLoading() {

  [
    "#allProducts",
    "#newProducts",
    "#promotionProducts"
  ]
    .forEach(selector => {

      const container =
        $(selector);


      if (!container) {
        return;
      }


      container.innerHTML = `
        <div class="products-loading">
          Chargement des produits...
        </div>
      `;

    });

}


function showProductsError() {

  const message = `
    <div class="products-loading">
      Impossible de charger les produits pour le moment.
      <br>
      Vérifiez la connexion au serveur.
    </div>
  `;


  [
    "#allProducts",
    "#newProducts",
    "#promotionProducts"
  ]
    .forEach(selector => {

      const container =
        $(selector);


      if (container) {

        container.innerHTML =
          message;

      }

    });

}


function emptyProductsMessage(
  message
) {

  return `
    <div class="products-loading">
      ${escapeHTML(message)}
    </div>
  `;

}


/* =========================================================
   FORM MESSAGES
========================================================= */

function showFormMessage(
  element,
  message
) {

  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.classList.remove(
    "hidden"
  );

}


function clearFormMessage(
  element
) {

  if (!element) {
    return;
  }


  element.textContent =
    "";

  element.classList.add(
    "hidden"
  );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimeout = null;


function showToast(
  message
) {

  const toast =
    $("#toast");


  if (!toast) {
    return;
  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimeout
  );


  toastTimeout =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3000
    );

}


/* =========================================================
   FORMATAGE
========================================================= */

function formatPrice(
  value
) {

  const number =
    Number(value || 0);


  return `${new Intl.NumberFormat(
    "fr-FR"
  ).format(number)} HTG`;

}


function formatCategory(
  category
) {

  const categories = {

    visage:
      "Soins du visage",

    corps:
      "Soins du corps",

    cheveux:
      "Soins des cheveux",

    parfums:
      "Parfums",

    maquillage:
      "Maquillage",

    accessoires:
      "Accessoires beauté"

  };


  return (
    categories[category] ||
    category ||
    "Beauté"
  );

}


/* =========================================================
   SÉCURITÉ HTML
========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );

}


/* =========================================================
   EXPOSITION MINIMALE
   Pour permettre au futur admin.js
   de communiquer avec certaines
   fonctions si nécessaire.
========================================================= */

window.FenvaBeauty = {

  getProducts() {

    return [
      ...state.products
    ];

  },

  getCart() {

    return [
      ...state.cart
    ];

  },

  refreshProducts() {

    return loadStoreData();

  },

  openCart() {

    renderCart();

    openModal(
      "cartModal"
    );

  }

};
