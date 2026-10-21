const API_URL = "https://dummyjson.com/products?limit=0";

const SHOP_CATEGORIES = ["mens-shirts", "mens-shoes", "mens-watches", "sunglasses", "tops", "womens-bags", "womens-dresses", "womens-jewellery", "womens-shoes", "womens-watches"];

const loadingMessage = document.querySelector("#loading-message");
const errorMessage = document.querySelector("#error-message");
const productDetails = document.querySelector("#product-details");

const mainImage = document.querySelector("#main-image");
const productTitle = document.querySelector("#product-title");
const productCategory = document.querySelector("#product-category");
const productPrice = document.querySelector("#product-price");
const productDescription = document.querySelector("#product-description");

const sizeButtons = document.querySelectorAll(".size-button");
const sizeMessage = document.querySelector("#size-message");
const addToCartButton = document.querySelector("#add-to-cart");
const cartMessage = document.querySelector("#cart-message");

const recommendationsTrack = document.querySelector("#recommendations-track");
const previousButton = document.querySelector("#carousel-prev");
const nextButton = document.querySelector("#carousel-next");

let currentProduct = null;
let selectedSize = null;

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id"));
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

function getProductImage(product) {
  return product.thumbnail || product.images?.[0] || "";
}

function showError() {
  loadingMessage.hidden = true;
  productDetails.hidden = true;
  errorMessage.hidden = false;
}

function renderProduct(product) {
  currentProduct = product;

  document.title = `${product.title} | NORTH`;

  productTitle.textContent = product.title;
  productCategory.textContent = product.category.replaceAll("-", " ");
  productPrice.textContent = formatPrice(product.price);
  productDescription.textContent = product.description || "";

  mainImage.src = getProductImage(product);
  mainImage.alt = product.title;

  mainImage.onerror = () => {
    mainImage.alt = "Product image unavailable";
  };

  loadingMessage.hidden = true;
  errorMessage.hidden = true;
  productDetails.hidden = false;
}

function renderRecommendations(products) {
  const recommendations = products.filter((product) => product.id !== currentProduct.id).slice(0, 15);

  recommendationsTrack.innerHTML = recommendations
    .map((product) => {
      const image = getProductImage(product);

      return `
      <a
        href="productdetails.html?id=${encodeURIComponent(product.id)}"
        class="recommendation-card"
        aria-label="View ${escapeHTML(product.title)}"
      >
        <div class="recommendation-image">
          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(product.title)}"
            loading="lazy"
          >
        </div>

        <h3>${escapeHTML(product.title)}</h3>
        <p>${escapeHTML(product.category.replaceAll("-", " "))}</p>
        <p class="recommendation-price">
          ${formatPrice(product.price)}
        </p>
      </a>
    `;
    })
    .join("");
}

function setupSizeButtons() {
  sizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedSize = button.dataset.size;

      sizeButtons.forEach((sizeButton) => {
        const isSelected = sizeButton === button;
        sizeButton.classList.toggle("selected", isSelected);
        sizeButton.setAttribute("aria-pressed", String(isSelected));
      });

      sizeMessage.textContent = `Selected size: ${selectedSize}`;
      cartMessage.textContent = "";
    });
  });
}

function addToCart() {
  if (!currentProduct) return;

  if (!selectedSize) {
    sizeMessage.textContent = "Please select a size first.";
    return;
  }

  const cartItem = {
    id: currentProduct.id,
    title: currentProduct.title,
    price: currentProduct.price,
    image: getProductImage(currentProduct),
    size: selectedSize,
    quantity: 1,
  };

  let cart = [];

  try {
    cart = JSON.parse(localStorage.getItem("northCart") || "[]");

    if (!Array.isArray(cart)) {
      cart = [];
    }
  } catch {
    cart = [];
  }

  const existingItem = cart.find((item) => item.id === cartItem.id && item.size === cartItem.size);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push(cartItem);
  }

  try {
    localStorage.setItem("northCart", JSON.stringify(cart));
    cartMessage.textContent = `${currentProduct.title} — size ${selectedSize} added to cart.`;
    addToCartButton.textContent = "ADDED TO CART";

    setTimeout(() => {
      addToCartButton.textContent = "ADD TO CART";
    }, 1800);
  } catch {
    cartMessage.textContent = "Unable to save your cart in this browser.";
  }
}

function setupCarousel() {
  previousButton.addEventListener("click", () => {
    recommendationsTrack.scrollBy({
      left: -recommendationsTrack.clientWidth * 0.8,
      behavior: "smooth",
    });
  });

  nextButton.addEventListener("click", () => {
    recommendationsTrack.scrollBy({
      left: recommendationsTrack.clientWidth * 0.8,
      behavior: "smooth",
    });
  });
}

async function loadProductDetails() {
  const productId = getProductId();

  if (!Number.isInteger(productId) || productId < 1) {
    showError();
    return;
  }

  try {
    const [productResponse, productsResponse] = await Promise.all([fetch(`https://dummyjson.com/products/${productId}`), fetch(API_URL)]);

    if (!productResponse.ok || !productsResponse.ok) {
      throw new Error("Could not fetch products.");
    }

    const product = await productResponse.json();
    const productsData = await productsResponse.json();

    if (!product.id || !Array.isArray(productsData.products)) {
      throw new Error("Invalid product data.");
    }

    // Only show products from NORTH's chosen categories.
    const shopProducts = productsData.products.filter((product) => SHOP_CATEGORIES.includes(product.category));

    // Make sure the clicked product belongs to our shop.
    if (!SHOP_CATEGORIES.includes(product.category)) {
      throw new Error("This product is not part of the NORTH collection.");
    }

    renderProduct(product);
    renderRecommendations(shopProducts);
  } catch (error) {
    console.error("Product details error:", error);
    showError();
  }
}

setupSizeButtons();
setupCarousel();
addToCartButton.addEventListener("click", addToCart);

loadProductDetails();
