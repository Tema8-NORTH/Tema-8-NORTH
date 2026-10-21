const API_URL = "https://dummyjson.com/products?limit=0";

const SHOP_CATEGORIES = ["mens-shirts", "mens-shoes", "mens-watches", "sunglasses", "tops", "womens-bags", "womens-dresses", "womens-jewellery", "womens-shoes", "womens-watches"];
const CATEGORY_GROUPS = {
  clothing: ["mens-shirts", "tops", "womens-dresses"],
  footwear: ["mens-shoes", "womens-shoes"],
  accessories: ["mens-watches", "womens-watches", "sunglasses", "womens-bags", "womens-jewellery"],
};

const FEATURED_IDS = [174, 95, 158, 176];

const COLOR_NAMES = ["black", "white", "grey", "gray", "beige", "brown", "blue", "navy", "red", "green", "pink", "purple", "yellow", "orange", "gold", "silver"];

const COLOR_LABELS = {
  black: "Black",
  white: "White",
  grey: "Grey",
  gray: "Grey",
  beige: "Beige",
  brown: "Brown",
  blue: "Blue",
  navy: "Navy",
  red: "Red",
  green: "Green",
  pink: "Pink",
  purple: "Purple",
  yellow: "Yellow",
  orange: "Orange",
  gold: "Gold",
  silver: "Silver",
};

let allProducts = [];
let filteredProducts = [];
let selectedBrands = new Set();
let selectedColors = new Set();
let selectedGenders = new Set();

const productGrid = document.querySelector("#product-grid");
const productCount = document.querySelector("#product-count");
const pageTitle = document.querySelector("#page-title");
const brandFilters = document.querySelector("#brand-filters");
const colorFilters = document.querySelector("#color-filters");
const sortSelect = document.querySelector("#sort-products");
const clearFiltersButton = document.querySelector("#clear-filters");
const errorMessage = document.querySelector("#error-message");
const emptyMessage = document.querySelector("#empty-message");

const isProductListPage = Boolean(productGrid);
const isHomePage = Boolean(document.querySelector(".productlist")) && !isProductListPage;

function getCurrentCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get("category") || "all";
}

function getCategoryProducts(products, category) {
  if (category === "all") return products;

  const allowedCategories = CATEGORY_GROUPS[category];

  if (!allowedCategories) return products;

  return products.filter((product) => allowedCategories.includes(product.category));
}

function getGender(product) {
  const category = product.category || "";

  if (category.startsWith("mens-")) return "men";
  if (category.startsWith("womens-")) return "women";

  // DummyJSON doesn't provide a consistent gender field.
  // Treat tops as unisex when no gender is specified.
  if (category === "tops") return "unisex";

  return "unisex";
}

function getProductColors(product) {
  const text = [product.title || "", product.description || "", ...(product.tags || [])].join(" ").toLowerCase();

  const foundColors = new Set();

  COLOR_NAMES.forEach((color) => {
    const escapedColor = color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escapedColor}\\b`, "i");

    if (pattern.test(text)) {
      foundColors.add(color === "gray" ? "grey" : color);
    }
  });

  return [...foundColors];
}

function getProductImage(product) {
  return product.thumbnail || (product.images && product.images[0]) || "";
}

function formatPrice(price) {
  return `${Number(price).toFixed(2)} $`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function renderProducts(products, container) {
  if (!container) return;

  container.innerHTML = products
    .map((product) => {
      const image = getProductImage(product);

      return `
      <a
        href="productdetails.html?id=${encodeURIComponent(product.id)}"
        class="product-link"
        aria-label="View ${escapeHTML(product.title)}"
      >
        <article class="product">
          <div class="product-image-wrap">
            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(product.title)}"
              loading="lazy"
            >
          </div>

          <h2>${escapeHTML(product.title)}</h2>
          <p class="product-category">
            ${escapeHTML(product.category.replaceAll("-", " "))}
          </p>
          <p class="product-price">${formatPrice(product.price)}</p>
        </article>
      </a>
    `;
    })
    .join("");
}

function renderCheckboxFilters(container, values, groupName, labelFunction) {
  if (!container) return;

  if (values.length === 0) {
    container.innerHTML = '<p class="filter-note">No options available.</p>';
    return;
  }

  container.innerHTML = values
    .map(
      (value) => `
    <label>
      <input
        type="checkbox"
        name="${groupName}"
        value="${escapeHTML(value)}"
      >
      <span>${escapeHTML(labelFunction(value))}</span>
    </label>
  `,
    )
    .join("");

  container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", () => {
      const selectedSet = groupName === "brand" ? selectedBrands : selectedColors;

      if (input.checked) {
        selectedSet.add(input.value);
      } else {
        selectedSet.delete(input.value);
      }

      applyFilters();
    });
  });
}

function renderBrandFilters(products) {
  const brands = [...new Set(products.map((product) => product.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  renderCheckboxFilters(brandFilters, brands, "brand", (value) => value);
}

function renderColorFilters(products) {
  const colors = [...new Set(products.flatMap(getProductColors))].sort((a, b) => a.localeCompare(b));

  renderCheckboxFilters(colorFilters, colors, "color", (value) => COLOR_LABELS[value] || value);
}

function applyFilters() {
  const category = getCurrentCategory();
  let products = getCategoryProducts(allProducts, category);

  if (selectedGenders.size > 0) {
    products = products.filter((product) => selectedGenders.has(getGender(product)));
  }

  if (selectedBrands.size > 0) {
    products = products.filter((product) => selectedBrands.has(product.brand));
  }

  if (selectedColors.size > 0) {
    products = products.filter((product) => getProductColors(product).some((color) => selectedColors.has(color)));
  }

  const sortValue = sortSelect?.value || "featured";

  if (sortValue === "title-asc") {
    products.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortValue === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (sortValue === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  }

  filteredProducts = products;

  if (productCount) {
    productCount.textContent = `${products.length} products`;
  }

  if (emptyMessage) {
    emptyMessage.hidden = products.length !== 0;
  }

  renderProducts(products, productGrid);
}

function setPageTitle() {
  if (!pageTitle) return;

  const category = getCurrentCategory();

  const titles = {
    all: "ALL PRODUCTS",
    clothing: "ALL CLOTHING",
    footwear: "ALL FOOTWEAR",
    accessories: "ALL ACCESSORIES",
  };

  pageTitle.textContent = titles[category] || "ALL PRODUCTS";
}

function resetFilters() {
  selectedBrands.clear();
  selectedColors.clear();
  selectedGenders.clear();

  document.querySelectorAll('.filters input[type="checkbox"]').forEach((input) => {
    input.checked = false;
  });

  if (sortSelect) sortSelect.value = "featured";

  applyFilters();
}

async function loadProducts() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.products)) {
      throw new Error("The API response did not contain a products array.");
    }

    allProducts = data.products.filter((product) => SHOP_CATEGORIES.includes(product.category));

    if (isProductListPage) {
      setPageTitle();

      const categoryProducts = getCategoryProducts(allProducts, getCurrentCategory());

      renderBrandFilters(categoryProducts);
      renderColorFilters(categoryProducts);

      document.querySelectorAll('.filters input[name="gender"]').forEach((input) => {
        input.addEventListener("change", () => {
          if (input.checked) {
            selectedGenders.add(input.value);
          } else {
            selectedGenders.delete(input.value);
          }

          applyFilters();
        });
      });

      sortSelect?.addEventListener("change", applyFilters);
      clearFiltersButton?.addEventListener("click", resetFilters);

      applyFilters();
    } else if (isHomePage) {
      const featuredProducts = FEATURED_IDS.map((id) => allProducts.find((product) => product.id === id)).filter(Boolean);

      renderProducts(featuredProducts, document.querySelector(".productlist"));
    }
  } catch (error) {
    console.error("Could not load products:", error);

    if (productCount) {
      productCount.textContent = "Products could not be loaded.";
    }

    if (productGrid) {
      productGrid.innerHTML = "";
    }

    if (errorMessage) {
      errorMessage.hidden = false;
    } else if (isHomePage) {
      const homeGrid = document.querySelector(".productlist");
      if (homeGrid) {
        homeGrid.innerHTML = "<p>Products could not be loaded. Please refresh the page.</p>";
      }
    }
  }
}

loadProducts();
