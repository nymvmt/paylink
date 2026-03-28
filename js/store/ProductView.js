export class ProductView {
  constructor(sliderController, cartService, cartView) {
    this.slider = sliderController;
    this.cart = cartService;
    this.cartView = cartView;
    this.product = null;
    this.selectedSize = null;
    this.selectedColor = null;
    this.quantity = 1;
  }

  show(product) {
    this.product = product;
    this.selectedSize = null;
    this.selectedColor = null;
    this.quantity = 1;
    document.getElementById('qty-display').textContent = '1';
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = `${product.price.toLocaleString()}원`;
    document.getElementById('product-shipping').textContent = `배송비 ${(product.shipping_fee || 0).toLocaleString()}원`;
    const descEl = document.getElementById('product-desc');
    if (product.description) {
      descEl.textContent = product.description;
      descEl.classList.remove('hidden');
    } else {
      descEl.classList.add('hidden');
    }
    this.slider.init(product.images || []);
    this._renderOptions();
  }

  selectOption(type, val) {
    if (type === 'size') this.selectedSize = val;
    else this.selectedColor = val;
    const list = type === 'size' ? (this.product.sizes || []) : (this.product.colors || []);
    list.forEach(v => {
      document.getElementById(`${type}-${v}`).className = v === val
        ? 'px-4 py-2 border-2 border-black rounded-lg text-sm font-medium'
        : 'px-4 py-2 border border-gray-200 rounded-lg text-sm hover:border-gray-400';
    });
  }

  changeQty(delta) {
    this.quantity = Math.max(1, this.quantity + delta);
    document.getElementById('qty-display').textContent = this.quantity;
  }

  addToCart() {
    if ((this.product.sizes || []).length > 0 && !this.selectedSize) { alert('사이즈를 선택해주세요.'); return; }
    if ((this.product.colors || []).length > 0 && !this.selectedColor) { alert('컬러를 선택해주세요.'); return; }
    this.cart.add(this.product, this.selectedSize, this.selectedColor, this.quantity);
    this.selectedSize = null;
    this.selectedColor = null;
    this.quantity = 1;
    document.getElementById('qty-display').textContent = '1';
    this._renderOptions();
    this.cartView.open();
  }

  _renderOptions() {
    const sizes = this.product.sizes || [];
    const colors = this.product.colors || [];
    document.getElementById('size-section').classList.toggle('hidden', sizes.length === 0);
    document.getElementById('color-section').classList.toggle('hidden', colors.length === 0);
    document.getElementById('size-buttons').innerHTML = sizes.map(s =>
      `<button onclick="selectOption('size','${s}')" id="size-${s}" class="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:border-gray-400">${s}</button>`
    ).join('');
    document.getElementById('color-buttons').innerHTML = colors.map(c =>
      `<button onclick="selectOption('color','${c}')" id="color-${c}" class="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:border-gray-400">${c}</button>`
    ).join('');
  }
}
