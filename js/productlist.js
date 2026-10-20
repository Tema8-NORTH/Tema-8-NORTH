
const productlist = document.querySelector(".productlist");

// Categories we want from DummyJSON
const categories = [
  "mens-shirts",
  "mens-shoes",
  "mens-watches",
  "sunglasses",
  "tops",
  "womens-bags",
  "womens-dresses",
  "womens-jewellery",
  "womens-shoes",
  "womens-watches"
];

// Store products for future filtering
let allProducts = [];

// Fetch all products from our categories
async function fetchAllProducts() {
  const requests = categories.map(category =>
    fetch(`https://dummyjson.com/products/category/${category}?limit=0`)
      .then(response => {
        if (!response.ok) throw new Error("Failed to fetch products");
        return response.json();
      })
  );

  const results = await Promise.all(requests);

  allProducts = results.flatMap(result => result.products);

  displayProducts(allProducts);
}

// Fetch the 4 featured products for homepage
async function fetchFeaturedProducts() {
  const ids = [174, 95, 158, 176];

  const requests = ids.map(id =>
    fetch(`https://dummyjson.com/products/${id}`)
      .then(response => response.json())
  );

  const products = await Promise.all(requests);

  displayProducts(products);
}

// Display products
function displayProducts(products) {
  productlist.innerHTML = products.map(product => `
    <a href="productdetails.html?id=${product.id}" class="product-link">
      <article class="product">
        <img src="${product.thumbnail}" alt="${product.title}">
        <h3>${product.title}</h3>
        <p>${product.category}</p>
        <p>${product.price} $</p>
      </article>
    </a>
  `).join("");
}

// Decide which products to load
if (productlist) {
  if (window.location.pathname.endsWith("productlist.html")) {
    fetchAllProducts().catch(console.error);
  } else {
    fetchFeaturedProducts().catch(console.error);
  }
}
