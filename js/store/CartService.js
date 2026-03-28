import { fmt, itemLabel } from '../shared/format.js';

export class CartService {
  constructor(brandId) {
    this.key = `paylink_cart_${brandId || 'default'}`;
  }

  load() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; }
    catch { return []; }
  }

  save(cart) {
    localStorage.setItem(this.key, JSON.stringify(cart));
    this._updateBadge(cart);
  }

  clear() {
    localStorage.removeItem(this.key);
    this._updateBadge([]);
  }

  add(product, selectedSize, selectedColor, quantity) {
    const cart = this.load();
    const existing = cart.find(i =>
      i.productId === product.id &&
      i.size === (selectedSize || '') &&
      i.color === (selectedColor || '')
    );
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        productName: product.name,
        size: selectedSize || '',
        color: selectedColor || '',
        quantity,
        unitPrice: product.price,
        shippingFee: product.shipping_fee || 0,
      });
    }
    this.save(cart);
  }

  remove(idx) {
    const cart = this.load();
    cart.splice(idx, 1);
    this.save(cart);
  }

  getSubtotal(cart) {
    return cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  }

  getShipping(cart) {
    return cart.length > 0 ? Math.max(...cart.map(i => i.shippingFee || 0)) : 0;
  }

  _updateBadge(cart) {
    const total = cart.reduce((s, i) => s + i.quantity, 0);
    const btn = document.getElementById('cart-btn');
    document.getElementById('cart-badge').textContent = total;
    btn.classList.toggle('hidden', total === 0);
  }
}
