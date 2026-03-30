import { fmt, itemLabel } from '../shared/format';
import type { CartService } from './CartService';

export class CartView {
  constructor(private cart: CartService) {}

  open(): void {
    this._render();
    document.getElementById('cart-drawer')!.classList.replace('closed', 'open');
    document.getElementById('cart-overlay')!.classList.remove('hidden');
  }

  close(): void {
    document.getElementById('cart-drawer')!.classList.replace('open', 'closed');
    document.getElementById('cart-overlay')!.classList.add('hidden');
  }

  toggle(): void {
    const drawer = document.getElementById('cart-drawer')!;
    drawer.classList.contains('open') ? this.close() : this.open();
  }

  removeItem(idx: number): void {
    this.cart.remove(idx);
    this._render();
  }

  private _render(): void {
    const items = this.cart.load();
    const subtotal = this.cart.getSubtotal(items);
    const shipping = this.cart.getShipping(items);

    document.getElementById('drawer-items')!.innerHTML = items.length === 0
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

    document.getElementById('drawer-subtotal')!.textContent = fmt(subtotal);
    document.getElementById('drawer-shipping')!.textContent = fmt(shipping);
    document.getElementById('drawer-total')!.textContent = fmt(subtotal + shipping);
  }
}
