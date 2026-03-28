import { fmt, itemLabel } from '../shared/format.js';

export class CartView {
  constructor(cartService) {
    this.cart = cartService;
  }

  open() {
    this._render();
    document.getElementById('cart-drawer').classList.replace('closed', 'open');
    document.getElementById('cart-overlay').classList.remove('hidden');
  }

  close() {
    document.getElementById('cart-drawer').classList.replace('open', 'closed');
    document.getElementById('cart-overlay').classList.add('hidden');
  }

  toggle() {
    const drawer = document.getElementById('cart-drawer');
    drawer.classList.contains('open') ? this.close() : this.open();
  }

  removeItem(idx) {
    this.cart.remove(idx);
    this._render();
  }

  _render() {
    const items = this.cart.load();
    const subtotal = this.cart.getSubtotal(items);
    const shipping = this.cart.getShipping(items);

    document.getElementById('drawer-items').innerHTML = items.length === 0
      ? '<p class="text-sm text-gray-400 text-center py-4">장바구니가 비어있습니다.</p>'
      : items.map((item, idx) =>
          `<div class="flex justify-between items-center text-sm">
            <span class="text-gray-700">${itemLabel(item)} × ${item.quantity}</span>
            <div class="flex items-center gap-2">
              <span class="font-medium">${fmt(item.unitPrice * item.quantity)}</span>
              <button onclick="removeItem(${idx})" class="text-gray-300 hover:text-gray-600 text-xs">✕</button>
            </div>
          </div>`
        ).join('');

    document.getElementById('drawer-subtotal').textContent = fmt(subtotal);
    document.getElementById('drawer-shipping').textContent = fmt(shipping);
    document.getElementById('drawer-total').textContent = fmt(subtotal + shipping);
  }
}
