// Minimal frontend logic for Techvilla
const productsEl = document.getElementById('products');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('categoryFilter');
const cartCountEl = document.getElementById('cartCount');
const yearEl = document.getElementById('year');

const modal = document.getElementById('productModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalPrice = document.getElementById('modalPrice');
const addToCartBtn = document.getElementById('addToCart');

let CART = [];
let currentProduct = null;

const PRODUCTS = [
  {id:1,name:'iPhone 17 Air',category:'phones',price:899,desc:'iPhone 17 Air • 128GB • A20 Neural Chip',imageLocal:'images/iphone17%20air.jpeg',imageFallback:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=iphone'},
  {id:2,name:'Echo Buds',category:'audio',price:129,desc:'True wireless earbuds with ANC',imageLocal:'images/earbuds.webp',imageFallback:'https://images.unsplash.com/photo-1585386959984-a415522c7c36?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=earbuds'},
  {id:3,name:'PowerGo 20W',category:'accessories',price:29,desc:'Fast USB-C charger',imageLocal:'images/chargers.jpg',imageFallback:'https://images.unsplash.com/photo-1585386959984-a415522c7c36?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=charger'},
  {id:4,name:'MacBook Air',category:'phones',price:1199,desc:'MacBook Air • M3 • 16GB • 512GB',imageLocal:'images/Macbook%20pro.jpg',imageFallback:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=macbook'},
  {id:5,name:'PlayStation 5',category:'audio',price:499,desc:'PlayStation 5 • Disc • 1TB',imageLocal:'images/playstation%205.webp',imageFallback:'https://images.unsplash.com/photo-1606813902805-36a1f0d6c3fd?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=ps5'},
  {id:6,name:'Tempered Glass',category:'accessories',price:19,desc:'Tempered glass screen protector',imageLocal:'images/glass%20protector.webp',imageFallback:'https://images.unsplash.com/photo-1551033406-611cf9a9cf72?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=protector'},
  {id:7,name:'HP 15 Laptop',category:'laptops',price:249,desc:'HP 15 — 4GB RAM • 128GB storage',imageLocal:'images/HP%2015%204gb%20ram%20128%20internal%20storage.jpeg',imageFallback:''},
  {id:8,name:'iPhone 11 Pro Max',category:'phones',price:249,desc:'iPhone 11 Pro Max • 64GB',imageLocal:'images/iphone%2011promax%2064gb.jpeg',imageFallback:''},
  {id:9,name:'iPhone 16 Plus',category:'phones',price:799,desc:'iPhone 16 Plus • 256GB',imageLocal:'images/Iphone%2016plus%20256gb.jpeg',imageFallback:''},
  {id:10,name:'Apple iPad 10th Gen',category:'tablets',price:449,desc:'iPad 10th Gen — 64GB',imageLocal:'images/Apple%20ipad%2010th%20Gen.jpeg',imageFallback:''},
  {id:11,name:'PS3 Super Slim',category:'consoles',price:89,desc:'PlayStation 3 Super Slim — used',imageLocal:'images/Ps3%20Super%20slim.jpeg',imageFallback:''},
  {id:12,name:'PS5 (Disk)',category:'consoles',price:549,desc:'PlayStation 5 with disk drive',imageLocal:'images/PS5%20with%20disk.jpeg',imageFallback:''},
  {id:13,name:'Mercedes-Benz C300',category:'vehicles',price:28000,desc:'Used Mercedes-Benz C300 — listing photo',imageLocal:'images/MERCEDES%20BENZ%20C300.jpeg',imageFallback:''},
  {id:14,name:'Mercedes-Benz CLA 250',category:'vehicles',price:26000,desc:'Used Mercedes-Benz CLA 250 — listing photo',imageLocal:'images/MERCEDES%20BENZ%20CLA%20250.jpeg',imageFallback:''},
  {id:15,name:'Toyota Venza (Unreg)',category:'vehicles',price:22000,desc:'Unregistered Toyota Venza — photo',imageLocal:'images/Unregistered%20Toyota%20Venza%20010.jpeg',imageFallback:''},
];

function formatPrice(p){return '$' + p.toFixed(2)}

function renderProducts(list){
  productsEl.innerHTML = '';
  if(list.length===0){productsEl.innerHTML = '<p class="muted">No products found.</p>';return}
  list.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="product-image"><img src="${p.imageLocal}" alt="${p.name}" loading="lazy" data-fallback="${p.imageFallback}"/></div>
      <div>
        <h4>${p.name}</h4>
        <p class="muted">${p.desc}</p>
      </div>
      <div class="card-footer">
        <div class="price">${formatPrice(p.price)}</div>
        <div>
          <button class="btn" data-id="${p.id}">View</button>
          <button class="btn primary" data-buy="${p.id}">Buy</button>
        </div>
      </div>
    `;
    productsEl.appendChild(card);
  })
}

function openModal(product){
  currentProduct = product;
  modalImage.src = product.imageLocal || product.imageFallback || '';
  modalImage.alt = product.name || '';
  // if local image fails to load, fall back to remote photo
  modalImage.onerror = () => { if(product.imageFallback) modalImage.src = product.imageFallback }
  modalTitle.textContent = product.name;
  modalDesc.textContent = product.desc;
  modalPrice.textContent = formatPrice(product.price);
  modal.setAttribute('aria-hidden','false');
}

function closeModal(){
  modal.setAttribute('aria-hidden','true');
}

function updateCart(){
  cartCountEl.textContent = CART.length;
}

function addToCart(product){
  CART.push(product);
  updateCart();
}

document.addEventListener('click',e=>{
  const viewBtn = e.target.closest('button[data-id]');
  const buyBtn = e.target.closest('button[data-buy]');
  if(viewBtn){
    const id = Number(viewBtn.dataset.id);
    const p = PRODUCTS.find(x=>x.id===id);
    openModal(p);
  }
  if(buyBtn){
    const id = Number(buyBtn.dataset.buy);
    const p = PRODUCTS.find(x=>x.id===id);
    addToCart(p);
  }
  if(e.target.id==='cartBtn'){
    alert('Cart contains ' + CART.length + ' item(s).');
  }
});

modalClose.addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
addToCartBtn.addEventListener('click',()=>{if(currentProduct){addToCart(currentProduct);closeModal()}});

searchInput.addEventListener('input',()=>applyFilters());
categoryFilter.addEventListener('change',()=>applyFilters());

function applyFilters(){
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const filtered = PRODUCTS.filter(p=>{
    if(cat!=='all' && p.category!==cat) return false;
    if(q && !(p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))) return false;
    return true;
  });
  renderProducts(filtered);
}

// Init
document.addEventListener('DOMContentLoaded',()=>{
  yearEl.textContent = new Date().getFullYear();
  renderProducts(PRODUCTS);
  updateCart();
});

// Attach error fallback for images in cards (for when local images are absent)
function attachImageFallbacks(){
  const imgs = document.querySelectorAll('.product-image img');
  imgs.forEach(img=>{
    const fallback = img.dataset.fallback;
    if(!fallback) return;
    img.onerror = () => { if(img.src !== fallback) img.src = fallback };
  })
}

// Observe product container to re-attach fallbacks after render
const observer = new MutationObserver(()=>attachImageFallbacks());
observer.observe(productsEl, {childList:true, subtree:true});

