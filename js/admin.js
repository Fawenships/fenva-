"use strict";

const API_BASE_URL = "";

const state = {
products: [],
orders: [],
promotion: null,
settings: null,
editingProductId: null
};

const $ = (selector) =>
document.querySelector(selector);

const $$ = (selector) =>
document.querySelectorAll(selector);

/* =========================================================
API
========================================================= */

const API = {

async request(endpoint, options = {}) {

```
const response = await fetch(
  `${API_BASE_URL}${endpoint}`,
  {
    method: options.method || "GET",

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },

    credentials: "include",

    body:
      options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined
  }
);


let data = null;

try {
  data = await response.json();
} catch {
  data = null;
}


if (!response.ok) {

  throw new Error(
    data?.message ||
    data?.error ||
    `Erreur serveur (${response.status})`
  );

}


return data;
```

},

getProducts() {
return this.request("/api/products");
},

getOrders() {
return this.request("/api/admin/orders");
},

getPromotion() {
return this.request("/api/promotion");
},

getSettings() {
return this.request("/api/settings");
},

createProduct(product) {
return this.request(
"/api/admin/products",
{
method: "POST",
body: product
}
);
},

updateProduct(id, product) {
return this.request(
`/api/admin/products/${id}`,
{
method: "PUT",
body: product
}
);
},

deleteProduct(id) {
return this.request(
`/api/admin/products/${id}`,
{
method: "DELETE"
}
);
},

updateOrderStatus(id, status) {
return this.request(
`/api/admin/orders/${id}/status`,
{
method: "PUT",
body: { status }
}
);
},

updatePromotion(data) {
return this.request(
"/api/admin/promotion",
{
method: "PUT",
body: data
}
);
},

updateSettings(data) {
return this.request(
"/api/admin/settings",
{
method: "PUT",
body: data
}
);
}

};

/* =========================================================
INIT
========================================================= */

document.addEventListener(
"DOMContentLoaded",
init
);

async function init() {

setupNavigation();
setupQuickNavigation();
setupProducts();
setupOrders();
setupPromotion();
setupSettings();
setupModals();
setupLogout();

showSection("dashboard");

await loadData();

}

/* =========================================================
NAVIGATION
========================================================= */

function setupNavigation() {

$$$(".nav-item").forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        showSection(
          button.dataset.section
        );

      }
    );

  }
);

}


function setupQuickNavigation() {

$$("[data-go-section]").forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        showSection(
          button.dataset.goSection
        );

      }
    );

  }
);

}


function showSection(section) {

$$(".admin-section").forEach(
  (item) =>
    item.classList.remove(
      "active"
    )
);


$$(".nav-item").forEach(
  (button) =>
    button.classList.toggle(
      "active",
      button.dataset.section ===
        section
    )
);


const target =
  $(`#${section}Section`);


if (target) {
  target.classList.add(
    "active"
  );
}


const titles = {
  dashboard: "Tableau de bord",
  products: "Produits",
  orders: "Commandes",
  promotions: "Promotions",
  settings: "Paramètres"
};


const pageTitle =
  $("#pageTitle");


if (pageTitle) {
  pageTitle.textContent =
    titles[section] ||
    "Administration";
}

}


/* =========================================================
 DATA
 ========================================================= */

async function loadData() {

try {

  const results =
    await Promise.all([
      API.getProducts(),
      API.getOrders(),
      API.getPromotion(),
      API.getSettings()
    ]);


  state.products =
    getArray(
      results[0],
      "products"
    );


  state.orders =
    getArray(
      results[1],
      "orders"
    );


  state.promotion =
    getObject(
      results[2]
    );


  state.settings =
    getObject(
      results[3]
    );


  renderAll();

} catch (error) {

  console.warn(
    "Serveur non connecté :",
    error.message
  );

  renderAll();

  showToast(
    "Le serveur n'est pas encore connecté.",
    "warning"
  );

}

}


function getArray(
response,
key
) {

if (Array.isArray(response)) {
  return response;
}

if (Array.isArray(response?.data)) {
  return response.data;
}

if (Array.isArray(response?.[key])) {
  return response[key];
}

return [];
}


function getObject(response) {

if (!response) {
  return null;
}

return (
  response.data ||
  response.settings ||
  response.promotion ||
  response
);

}


/* =========================================================
 RENDER
 ========================================================= */

function renderAll() {

renderStats();
renderRecentOrders();
renderLowStock();
renderProducts();
renderOrders();
renderPromotion();
renderSettings();

}


/* =========================================================
 STATS
 ========================================================= */

function renderStats() {

const activeProducts =
  state.products.filter(
    (product) =>
      product.active !== false
  ).length;


const pending =
  state.orders.filter(
    (order) =>
      normalizeStatus(
        order.status
      ) === "pending"
  ).length;


const revenue =
  state.orders.reduce(
    (sum, order) => {

      if (
        normalizeStatus(
          order.status
        ) === "cancelled"
      ) {
        return sum;
      }

      return (
        sum +
        getOrderTotal(order)
      );

    },
    0
  );


setText(
  "statProducts",
  formatNumber(
    activeProducts
  )
);


setText(
  "statOrders",
  formatNumber(
    state.orders.length
  )
);


setText(
  "statPending",
  formatNumber(
    pending
  )
);


setText(
  "statRevenue",
  `${formatMoney(revenue)} HTG`
);

}


/* =========================================================
 RECENT ORDERS
 ========================================================= */

function renderRecentOrders() {

const container =
  $("#recentOrders");


if (!container) return;


if (!state.orders.length) {

  container.innerHTML = `
    <div class="empty-state">
      Aucune commande récente.
    </div>
  `;

  return;

}


const orders =
  [...state.orders]
    .sort(
      (a, b) =>
        getDateValue(b) -
        getDateValue(a)
    )
    .slice(0, 7);


container.innerHTML =
  orders
    .map(
      (order) => {

        const status =
          normalizeStatus(
            order.status
          );


        return `
          <div
            class="order-item"
            data-order-id="${escapeAttribute(
              String(order.id ?? "")
            )}"
          >

            <div class="order-item-main">

              <strong>
                ${escapeHtml(
                  getOrderNumber(order)
                )}
              </strong>

              <span>
                ${escapeHtml(
                  getCustomerName(order)
                )}
              </span>

              <span
                class="status-badge ${getStatusClass(
                  status
                )}"
              >
                ${escapeHtml(
                  getStatusLabel(status)
                )}
              </span>

            </div>


            <div class="order-item-total">
              ${formatMoney(
                getOrderTotal(order)
              )} HTG
            </div>

          </div>
        `;

      }
    )
    .join("");


container
  .querySelectorAll(
    "[data-order-id]"
  )
  .forEach(
    (item) => {

      item.addEventListener(
        "click",
        () => {

          const order =
            state.orders.find(
              (entry) =>
                String(entry.id) ===
                String(
                  item.dataset.orderId
                )
            );


          if (order) {
            openOrderModal(
              order
            );
          }

        }
      );

    }
  );

}


/* =========================================================
 STOCK
 ========================================================= */

function renderLowStock() {

const container =
  $("#lowStockList");


if (!container) return;


const products =
  state.products
    .filter(
      (product) =>
        Number(
          product.stock ?? 0
        ) <= 5
    )
    .sort(
      (a, b) =>
        Number(a.stock ?? 0) -
        Number(b.stock ?? 0)
    )
    .slice(0, 8);


if (!products.length) {

  container.innerHTML = `
    <div class="empty-state">
      Aucun produit en stock faible.
    </div>
  `;

  return;

}


container.innerHTML =
  products
    .map(
      (product) => `
        <div class="low-stock-item">

          <div class="low-stock-name">
            ${escapeHtml(
              product.name ||
              "Produit"
            )}
          </div>

          <div class="low-stock-count">
            ${Number(
              product.stock ?? 0
            )} unité(s) restante(s)
          </div>

        </div>
      `
    )
    .join("");

}


/* =========================================================
 PRODUCTS
 ========================================================= */

function setupProducts() {

$("#addProductBtn")
  ?.addEventListener(
    "click",
    () =>
      openProductModal()
  );


$("#productSearch")
  ?.addEventListener(
    "input",
    renderProducts
  );


$("#productCategoryFilter")
  ?.addEventListener(
    "change",
    renderProducts
  );


$("#productForm")
  ?.addEventListener(
    "submit",
    saveProduct
  );

}


function renderProducts() {

const container =
  $("#productsGrid");


if (!container) return;


const search =
  String(
    $("#productSearch")?.value ||
    ""
  )
    .trim()
    .toLowerCase();


const category =
  $("#productCategoryFilter")
    ?.value ||
  "";


const products =
  state.products.filter(
    (product) => {

      const name =
        String(
          product.name ||
          ""
        )
          .toLowerCase();


      const productCategory =
        String(
          product.category ||
          ""
        )
          .toLowerCase();


      return (
        (!search ||
          name.includes(
            search
          )) &&

        (!category ||
          productCategory ===
            category.toLowerCase())
      );

    }
  );


if (!products.length) {

  container.innerHTML = `
    <div class="empty-state">
      Aucun produit trouvé.
    </div>
  `;

  return;
}


container.innerHTML =
  products
    .map(
      productCard
    )
    .join("");


container
  .querySelectorAll(
    "[data-action='edit']"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const product =
            state.products.find(
              (item) =>
                String(item.id) ===
                String(
                  button.dataset.id
                )
            );


          if (product) {
            openProductModal(
              product
            );
          }

        }
      );

    }
  );


container
  .querySelectorAll(
    "[data-action='delete']"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const product =
            state.products.find(
              (item) =>
                String(item.id) ===
                String(
                  button.dataset.id
                )
            );


          if (product) {
            deleteProduct(
              product
            );
          }

        }
      );

    }
  );

}


function productCard(product) {

const image =
  product.image_url ||
  product.image ||
  "https://placehold.co/700x500/f1e9e0/3a2a21?text=FENVA+BEAUTY";


return `
  <article class="product-card">

    <img
      class="product-card-image"
      src="${escapeAttribute(image)}"
      alt="${escapeAttribute(
        product.name ||
        "Produit"
      )}"
      onerror="this.src='https://placehold.co/700x500/f1e9e0/3a2a21?text=FENVA+BEAUTY'"
    >


    <div class="product-card-body">

      <div class="product-category">
        ${escapeHtml(
          categoryLabel(
            product.category
          )
        )}
      </div>

      <h3 class="product-name">
        ${escapeHtml(
          product.name ||
          "Sans nom"
        )}
      </h3>

      <div class="product-price">
        ${formatMoney(
          product.price
        )} HTG
      </div>

      <div class="product-stock">
        Stock :
        ${Number(
          product.stock ?? 0
        )}
      </div>

      <div class="product-actions">

        <button
          type="button"
          class="edit-btn"
          data-action="edit"
          data-id="${escapeAttribute(
            String(
              product.id ??
              ""
            )
          )}"
        >
          Modifier
        </button>

        <button
          type="button"
          class="delete-btn"
          data-action="delete"
          data-id="${escapeAttribute(
            String(
              product.id ??
              ""
            )
          )}"
        >
          Supprimer
        </button>

      </div>

    </div>

  </article>
`;

}


function openProductModal(
product = null
) {

state.editingProductId =
  product?.id ?? null;


$("#productModalTitle")
  && (
    $("#productModalTitle").textContent =
      product
        ? "Modifier le produit"
        : "Ajouter un produit"
  );


setValue(
  "productId",
  product?.id ?? ""
);


setValue(
  "productName",
  product?.name ?? ""
);


setValue(
  "productCategory",
  product?.category ?? ""
);


setValue(
  "productPrice",
  product?.price ?? ""
);


setValue(
  "productStock",
  product?.stock ?? 0
);


setValue(
  "productImage",
  product?.image_url ||
  product?.image ||
  ""
);


setValue(
  "productDescription",
  product?.description ||
  ""
);


setChecked(
  "productActive",
  product
    ? product.active !== false
    : true
);


setChecked(
  "productPopular",
  Boolean(
    product?.popular
  )
);


setChecked(
  "productNew",
  Boolean(
    product?.is_new ??
    product?.new
  )
);


setChecked(
  "productPromo",
  Boolean(
    product?.promo ??
    product?.promotion
  )
);


openModal(
  $("#productModal")
);

}


async function saveProduct(
event
) {

event.preventDefault();


const product = {

  name:
    getValue(
      "productName"
    ).trim(),

  category:
    getValue(
      "productCategory"
    ),

  price:
    Number(
      getValue(
        "productPrice"
      )
    ),

  stock:
    Number(
      getValue(
        "productStock"
      )
    ),

  image_url:
    getValue(
      "productImage"
    ).trim(),

  description:
    getValue(
      "productDescription"
    ).trim(),

  active:
    getChecked(
      "productActive"
    ),

  popular:
    getChecked(
      "productPopular"
    ),

  is_new:
    getChecked(
      "productNew"
    ),

  promo:
    getChecked(
      "productPromo"
    )

};


if (!product.name) {
  showToast(
    "Le nom du produit est obligatoire.",
    "error"
  );
  return;
}


if (!product.category) {
  showToast(
    "Sélectionne une catégorie.",
    "error"
  );
  return;
}


try {

  if (
    state.editingProductId !==
    null
  ) {

    const result =
      await API.updateProduct(
        state.editingProductId,
        product
      );


    const updated =
      result?.product ||
      result?.data ||
      result;


    const index =
      state.products.findIndex(
        (item) =>
          String(item.id) ===
          String(
            state.editingProductId
          )
      );


    if (
      index !== -1 &&
      updated
    ) {
      state.products[index] =
        updated;
    }


    showToast(
      "Produit modifié.",
      "success"
    );

  } else {

    const result =
      await API.createProduct(
        product
      );


    const created =
      result?.product ||
      result?.data ||
      result;


    if (created) {
      state.products.unshift(
        created
      );
    }


    showToast(
      "Produit ajouté.",
      "success"
    );

  }


  closeModal(
    "productModal"
  );


  renderAll();

} catch (error) {

  showToast(
    error.message ||
    "Impossible d'enregistrer le produit.",
    "error"
  );

}

}


async function deleteProduct(
product
) {

if (
  !window.confirm(
    `Supprimer « ${
      product.name ||
      "ce produit"
    } » ?`
  )
) {
  return;
}


try {

  await API.deleteProduct(
    product.id
  );


  state.products =
    state.products.filter(
      (item) =>
        String(item.id) !==
        String(
          product.id
        )
    );


  renderAll();


  showToast(
    "Produit supprimé.",
    "success"
  );

} catch (error) {

  showToast(
    error.message ||
    "Impossible de supprimer le produit.",
    "error"
  );

}

}


/* =========================================================
 ORDERS
 ========================================================= */

function setupOrders() {

$("#orderSearch")
  ?.addEventListener(
    "input",
    renderOrders
  );


$("#orderStatusFilter")
  ?.addEventListener(
    "change",
    renderOrders
  );

}


function renderOrders() {

const container =
  $("#ordersTableContainer");


if (!container) return;


const search =
  String(
    $("#orderSearch")?.value ||
    ""
  )
    .trim()
    .toLowerCase();


const statusFilter =
  $("#orderStatusFilter")
    ?.value ||
  "";


const orders =
  state.orders.filter(
    (order) => {

      const number =
        getOrderNumber(
          order
        ).toLowerCase();


      const customer =
        getCustomerName(
          order
        ).toLowerCase();


      const phone =
        String(
          order.phone ||
          order.customer_phone ||
          order.customerPhone ||
          ""
        ).toLowerCase();


      const status =
        normalizeStatus(
          order.status
        );


      return (

        (
          !search ||
          number.includes(search) ||
          customer.includes(search) ||
          phone.includes(search)
        )

        &&

        (
          !statusFilter ||
          status === statusFilter
        )

      );

    }
  );


if (!orders.length) {

  container.innerHTML = `
    <div class="empty-state">
      Aucune commande trouvée.
    </div>
  `;

  return;

}


container.innerHTML = `
  <table class="orders-table">

    <thead>

      <tr>
        <th>Commande</th>
        <th>Client</th>
        <th>Total</th>
        <th>Paiement</th>
        <th>Statut</th>
        <th>Date</th>
      </tr>

    </thead>

    <tbody>

      ${
        orders
          .map(
            renderOrderRow
          )
          .join("")
      }

    </tbody>

  </table>
`;


container
  .querySelectorAll(
    "[data-order-id]"
  )
  .forEach(
    (row) => {

      row.addEventListener(
        "click",
        () => {

          const order =
            state.orders.find(
              (item) =>
                String(item.id) ===
                String(
                  row.dataset.orderId
                )
            );


          if (order) {
            openOrderModal(
              order
            );
          }

        }
      );

    }
  );

}


function renderOrderRow(
order
) {

const status =
  normalizeStatus(
    order.status
  );


return `
  <tr
    data-order-id="${escapeAttribute(
      String(
        order.id ??
        ""
      )
    )}"
  >

    <td>
      <strong>
        ${escapeHtml(
          getOrderNumber(order)
        )}
      </strong>
    </td>

    <td>
      ${escapeHtml(
        getCustomerName(order)
      )}
    </td>

    <td>
      ${formatMoney(
        getOrderTotal(order)
      )} HTG
    </td>

    <td>
      ${escapeHtml(
        getPaymentLabel(
          order.payment_method ||
          order.paymentMethod
        )
      )}
    </td>

    <td>

      <span
        class="status-badge ${getStatusClass(
          status
        )}"
      >
        ${escapeHtml(
          getStatusLabel(status)
        )}
      </span>

    </td>

    <td>
      ${formatDate(
        order.created_at ||
        order.createdAt ||
        order.date
      )}
    </td>

  </tr>
`;

}


function openOrderModal(
order
) {

const container =
  $("#orderDetails");


if (!container) return;


const status =
  normalizeStatus(
    order.status
  );


const items =
  normalizeOrderItems(
    order
  );


container.innerHTML = `

  <div class="order-detail-top">

    <div>

      <span class="eyebrow">
        COMMANDE
      </span>

      <h3>
        ${escapeHtml(
          getOrderNumber(order)
        )}
      </h3>

    </div>

    <span
      class="status-badge ${getStatusClass(
        status
      )}"
    >
      ${escapeHtml(
        getStatusLabel(status)
      )}
    </span>

  </div>


  <div class="order-customer-block">

    <div>
      <strong>Client</strong>

      <p>
        ${escapeHtml(
          getCustomerName(order)
        )}
      </p>
    </div>

    <div>
      <strong>Téléphone</strong>

      <p>
        ${escapeHtml(
          order.phone ||
          order.customer_phone ||
          order.customerPhone ||
          "—"
        )}
      </p>
    </div>

    <div>
      <strong>Adresse</strong>

      <p>
        ${escapeHtml(
          order.address ||
          order.customer_address ||
          "—"
        )}
      </p>
    </div>

    <div>
      <strong>Paiement</strong>

      <p>
        ${escapeHtml(
          getPaymentLabel(
            order.payment_method ||
            order.paymentMethod
          )
        )}
      </p>
    </div>

  </div>


  <div class="order-items-block">

    <h4>Produits</h4>

    ${
      items.length
        ? items
            .map(
              (item) => {

                const name =
                  item.name ||
                  item.product_name ||
                  "Produit";


                const quantity =
                  Number(
                    item.quantity ??
                    1
                  );


                const price =
                  Number(
                    item.price ??
                    item.unit_price ??
                    0
                  );


                return `
                  <div class="order-line">

                    <div>

                      <strong>
                        ${escapeHtml(name)}
                      </strong>

                      <span>
                        × ${quantity}
                      </span>

                    </div>

                    <strong>
                      ${formatMoney(
                        price * quantity
                      )} HTG
                    </strong>

                  </div>
                `;

              }
            )
            .join("")
        : `
          <div class="empty-state">
            Aucun détail disponible.
          </div>
        `
    }

  </div>


  <div class="order-summary">

    <span>Total</span>

    <strong>
      ${formatMoney(
        getOrderTotal(order)
      )} HTG
    </strong>

  </div>


  <div class="order-status-editor">

    <label for="detailOrderStatus">
      Modifier le statut
    </label>

    <select id="detailOrderStatus">
      ${buildStatusOptions(status)}
    </select>

    <button
      type="button"
      class="primary-btn"
      id="saveOrderStatusBtn"
    >
      Enregistrer
    </button>

  </div>

`;


$("#saveOrderStatusBtn")
  ?.addEventListener(
    "click",
    () =>
      saveOrderStatus(order)
  );


openModal(
  $("#orderModal")
);

}


async function saveOrderStatus(
order
) {

const select =
  $("#detailOrderStatus");


if (!select) return;


try {

  await API.updateOrderStatus(
    order.id,
    select.value
  );


  order.status =
    select.value;


  renderAll();


  closeModal(
    "orderModal"
  );


  showToast(
    "Statut mis à jour.",
    "success"
  );

} catch (error) {

  showToast(
    error.message ||
    "Impossible de modifier le statut.",
    "error"
  );

}

}


/* =========================================================
 PROMOTION
 ========================================================= */

function setupPromotion() {

$("#promotionForm")
  ?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const data = {

        title:
          getValue(
            "promotionTitle"
          ).trim(),

        description:
          getValue(
            "promotionText"
          ).trim(),

        discount:
          Number(
            getValue(
              "promotionDiscount"
            ) || 0
          ),

        active:
          getValue(
            "promotionActive"
          ) === "true"

      };


      try {

        await API.updatePromotion(
          data
        );


        state.promotion =
          data;


        showToast(
          "Promotion enregistrée.",
          "success"
        );

      } catch (error) {

        showToast(
          error.message ||
          "Impossible d'enregistrer la promotion.",
          "error"
        );

      }

    }
  );

}


function renderPromotion() {

if (!state.promotion) {
  return;
}


setValue(
  "promotionTitle",
  state.promotion.title ||
  ""
);


setValue(
  "promotionText",
  state.promotion.description ||
  state.promotion.text ||
  ""
);


setValue(
  "promotionDiscount",
  state.promotion.discount ??
  0
);


setValue(
  "promotionActive",
  String(
    state.promotion.active !== false
  )
);

}


/* =========================================================
 SETTINGS
 ========================================================= */

function setupSettings() {

$("#settingsForm")
  ?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const data = {

        name:
          getValue(
            "storeName"
          ).trim(),

        phone:
          getValue(
            "storePhone"
          ).trim(),

        whatsapp:
          getValue(
            "storeWhatsapp"
          ).trim(),

        address:
          getValue(
            "storeAddress"
          ).trim(),

        description:
          getValue(
            "storeDescription"
          ).trim()

      };


      try {

        await API.updateSettings(
          data
        );


        state.settings =
          data;


        showToast(
          "Paramètres enregistrés.",
          "success"
        );

      } catch (error) {

        showToast(
          error.message ||
          "Impossible d'enregistrer les paramètres.",
          "error"
        );

      }

    }
  );

}


function renderSettings() {

if (!state.settings) {
  return;
}


setValue(
  "storeName",
  state.settings.name ||
  state.settings.store_name ||
  ""
);


setValue(
  "storePhone",
  state.settings.phone ||
  ""
);


setValue(
  "storeWhatsapp",
  state.settings.whatsapp ||
  ""
);


setValue(
  "storeAddress",
  state.settings.address ||
  ""
);


setValue(
  "storeDescription",
  state.settings.description ||
  ""
);

}


/* =========================================================
 MODALS
 ========================================================= */

function setupModals() {

$$("[data-close]").forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        closeModal(
          button.dataset.close
        );

      }
    );

  }
);


$$(".modal-overlay").forEach(
  (overlay) => {

    overlay.addEventListener(
      "click",
      () => {

        const modal =
          overlay.closest(
            ".modal"
          );


        if (modal) {
          closeModal(
            modal.id
          );
        }

      }
    );

  }
);


document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Escape"
    ) {

      $$(".modal.open")
        .forEach(
          (modal) =>
            closeModal(
              modal.id
            )
        );

    }

  }
);

}


function openModal(
modal
) {

if (!modal) return;

modal.classList.add(
  "open"
);

modal.setAttribute(
  "aria-hidden",
  "false"
);

document.body.style.overflow =
  "hidden";

}


function closeModal(
id
) {

const modal =
  document.getElementById(
    id
  );


if (!modal) return;

modal.classList.remove(
  "open"
);

modal.setAttribute(
  "aria-hidden",
  "true"
);

document.body.style.overflow =
  "";

}


/* =========================================================
 LOGOUT
 ========================================================= */

function setupLogout() {

$("#logoutBtn")
  ?.addEventListener(
    "click",
    async () => {

      try {

        await API.request(
          "/api/admin/logout",
          {
            method: "POST",
            body: {}
          }
        );

      } catch {
        /* Backend à venir */
      }


      window.location.href =
        "./index.html";

    }
  );

}


/* =========================================================
 HELPERS
 ========================================================= */

function setText(
id,
value
) {

const element =
  document.getElementById(
    id
  );


if (element) {
  element.textContent =
    value;
}

}


function getValue(
id
) {

return (
  document.getElementById(
    id
  )?.value ||
  ""
);

}


function setValue(
id,
value
) {

const element =
  document.getElementById(
    id
  );


if (element) {
  element.value =
    value;
}

}


function getChecked(
id
) {

return Boolean(
  document.getElementById(
    id
  )?.checked
);

}


function setChecked(
id,
value
) {

const element =
  document.getElementById(
    id
  );


if (element) {
  element.checked =
    Boolean(value);
}

}


/* =========================================================
 ORDER HELPERS
 ========================================================= */

function getOrderNumber(
order
) {

return (
  order.order_number ||
  order.orderNumber ||
  `#${order.id ?? ""}`
);

}


function getCustomerName(
order
) {

return (
  order.customer_name ||
  order.customerName ||
  order.name ||
  "Client"
);

}


function normalizeOrderItems(
order
) {

if (
  Array.isArray(
    order.items
  )
) {
  return order.items;
}


if (
  Array.isArray(
    order.order_items
  )
) {
  return order.order_items;
}


return [];

}


function getOrderTotal(
order
) {

if (
  order.total !== undefined
) {

  return (
    Number(
      order.total
    ) || 0
  );

}


if (
  order.total_amount !== undefined
) {

  return (
    Number(
      order.total_amount
    ) || 0
  );

}


return normalizeOrderItems(
  order
).reduce(
  (sum, item) => {

    return (
      sum +
      (
        Number(
          item.price ??
          item.unit_price ??
          0
        ) *
        Number(
          item.quantity ??
          1
        )
      )
    );

  },
  0
);

}


/* =========================================================
 STATUS
 ========================================================= */

function normalizeStatus(
status
) {

const value =
  String(
    status ||
    "pending"
  )
    .trim()
    .toLowerCase();


const map = {

  pending:
    "pending",

  "en attente":
    "pending",

  en_attente:
    "pending",

  confirmed:
    "confirmed",

  confirme:
    "confirmed",

  confirmée:
    "confirmed",

  processing:
    "processing",

  preparation:
    "processing",

  "en préparation":
    "processing",

  shipped:
    "shipped",

  expédiée:
    "shipped",

  expediee:
    "shipped",

  completed:
    "completed",

  terminée:
    "completed",

  terminee:
    "completed",

  cancelled:
    "cancelled",

  canceled:
    "cancelled",

  annulée:
    "cancelled",

  annulee:
    "cancelled"

};


return (
  map[value] ||
  "pending"
);

}


function getStatusLabel(
status
) {

const labels = {

  pending:
    "En attente",

  confirmed:
    "Confirmée",

  processing:
    "En préparation",

  shipped:
    "Expédiée",

  completed:
    "Terminée",

  cancelled:
    "Annulée"

};


return (
  labels[status] ||
  "En attente"
);

}


function getStatusClass(
status
) {

return `status-${status}`;

}


function buildStatusOptions(
current
) {

const statuses = [

  ["pending", "En attente"],
  ["confirmed", "Confirmée"],
  ["processing", "En préparation"],
  ["shipped", "Expédiée"],
  ["completed", "Terminée"],
  ["cancelled", "Annulée"]

];


return statuses
  .map(
    ([value, label]) => `
      <option
        value="${value}"
        ${
          current === value
            ? "selected"
            : ""
        }
      >
        ${label}
      </option>
    `
  )
  .join("");

}


/* =========================================================
 CATEGORY
 ========================================================= */

function categoryLabel(
category
) {

const labels = {

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
  labels[
    String(
      category ||
      ""
    ).toLowerCase()
  ] ||
  category ||
  "Sans catégorie"
);

}


/* =========================================================
 PAYMENT
 ========================================================= */

function getPaymentLabel(
payment
) {

const value =
  String(
    payment ||
    ""
  )
    .trim()
    .toLowerCase();


const labels = {

  moncash:
    "MonCash",

  natcash:
    "NatCash",

  livraison:
    "Paiement à la livraison",

  cash:
    "Espèces"

};


return (
  labels[value] ||
  payment ||
  "—"
);

}


/* =========================================================
 DATE / MONEY
 ========================================================= */

function getDateValue(
order
) {

const value =
  order.created_at ||
  order.createdAt ||
  order.date;


if (!value) {
  return 0;
}


const date =
  new Date(value);


return Number.isNaN(
  date.getTime()
)
  ? 0
  : date.getTime();

}


function formatDate(
value
) {

if (!value) {
  return "—";
}


const date =
  new Date(value);


if (
  Number.isNaN(
    date.getTime()
  )
) {
  return "—";
}


return new Intl.DateTimeFormat(
  "fr-FR",
  {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }
).format(date);

}


function formatNumber(
value
) {

return new Intl.NumberFormat(
  "fr-FR"
).format(
  Number(value) || 0
);

}


function formatMoney(
value
) {

return new Intl.NumberFormat(
  "fr-FR"
).format(
  Number(value) || 0
);

}


/* =========================================================
 SECURITY
 ========================================================= */

function escapeHtml(
value
) {

return String(
  value ?? ""
)
  .replaceAll(
    "&",
    "&amp;"
  )
  .replaceAll(
    "<",
    "&lt;"
  )
  .replaceAll(
    ">",
    "&gt;"
  )
  .replaceAll(
    '"',
    "&quot;"
  )
  .replaceAll(
    "'",
    "&#039;"
  );

}


function escapeAttribute(
value
) {

return escapeHtml(
  value
);

}


/* =========================================================
 TOAST
 ========================================================= */

let toastTimer = null;


function showToast(
message,
type = "info"
) {

const toast =
  $("#toast");


if (!toast) return;


toast.textContent =
  message;


toast.className =
  `toast show toast-${type}`;


clearTimeout(
  toastTimer
);


toastTimer =
  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

    },
    3200
  );

}
$$$
