const productIds = [174, 95, 158, 176];

const productlist = document.querySelector(".productlist");

Promise.all(
  productIds.map(id =>
    fetch(`https://dummyjson.com/products/${id}`)
      .then(response => response.json())
  )
).then(products => {
  productlist.innerHTML = products.map(product => `
    <a href="product.html?id=${product.id}" class="product-link">
    <article class="product">
      <img src="${product.thumbnail}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p>${product.category}</p>
      <p>${product.price} $</p>
    </article>
    </a>
  `).join("");
});