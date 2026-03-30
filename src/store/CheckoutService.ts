import { TOSS_CLIENT_KEY } from '../shared/supabaseClient';
import { fmt, itemLabel } from '../shared/format';
import type { CartService } from './CartService';
import type { PendingOrder } from '../types';

export class CheckoutService {
  constructor(private cart: CartService, private brandId: string | null) {}

  show(): void {
    const items = this.cart.load();
    if (items.length === 0) return;
    const subtotal = this.cart.getSubtotal(items);
    const shipping = this.cart.getShipping(items);
    document.getElementById('summary-items')!.innerHTML = items.map(item =>
      `<div class="flex justify-between"><span>${itemLabel(item)} × ${item.quantity}</span><span>${fmt(item.unitPrice * item.quantity)}</span></div>`
    ).join('');
    document.getElementById('summary-amount')!.textContent = `총 ${fmt(subtotal + shipping)} (배송비 ${fmt(shipping)} 포함)`;
  }

  openAddrSearch(): void {
    new daum.Postcode({
      oncomplete: (data) => {
        (document.getElementById('addr-zonecode') as HTMLInputElement).value = data.zonecode;
        (document.getElementById('addr-address') as HTMLInputElement).value = data.roadAddress || data.jibunAddress;
        (document.getElementById('addr-detail') as HTMLInputElement).focus();
      }
    }).open();
  }

  initPhoneFormat(): void {
    document.getElementById('buyer-phone')!.addEventListener('input', function(this: HTMLInputElement) {
      let v = this.value.replace(/\D/g, '');
      if (v.length <= 3) this.value = v;
      else if (v.length <= 7) this.value = `${v.slice(0,3)}-${v.slice(3)}`;
      else this.value = `${v.slice(0,3)}-${v.slice(3,7)}-${v.slice(7,11)}`;
    });
  }

  async requestPayment(): Promise<void> {
    const name = (document.getElementById('buyer-name') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('buyer-phone') as HTMLInputElement).value.trim();
    const zonecode = (document.getElementById('addr-zonecode') as HTMLInputElement).value.trim();
    const addrBase = (document.getElementById('addr-address') as HTMLInputElement).value.trim();
    const addrDetail = (document.getElementById('addr-detail') as HTMLInputElement).value.trim();
    const address = [zonecode, addrBase, addrDetail].filter(Boolean).join(' ');
    const memo = (document.getElementById('shipping-memo') as HTMLInputElement).value.trim();
    const method = (document.querySelector('input[name="payment-method"]:checked') as HTMLInputElement).value;
    const errEl = document.getElementById('checkout-error')!;
    const phoneErrEl = document.getElementById('phone-error')!;

    const phoneValid = /^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone);
    phoneErrEl.classList.toggle('hidden', phoneValid);

    if (!name || !phone || !addrBase) {
      errEl.textContent = '이름, 연락처, 주소는 필수입니다.';
      errEl.classList.remove('hidden');
      return;
    }
    if (!phoneValid) return;
    errEl.classList.add('hidden');

    const items = this.cart.load();
    const subtotal = this.cart.getSubtotal(items);
    const shipping = this.cart.getShipping(items);
    const amount = subtotal + shipping;
    const orderId = `order_${Date.now()}`;
    const firstProduct = items[0]?.productName || '주문';

    sessionStorage.setItem('pendingOrder', JSON.stringify({
      orderId, buyerName: name, buyerPhone: phone,
      shippingAddress: address, shippingMemo: memo,
      amount, paymentMethod: method, items, ownerId: this.brandId,
    }));

    TossPayments(TOSS_CLIENT_KEY).requestPayment(method, {
      amount, orderId,
      orderName: items.length > 1 ? `${firstProduct} 외 ${items.length - 1}건` : firstProduct,
      customerName: name,
      successUrl: `${location.origin}/?brand=${this.brandId}`,
      failUrl: `${location.origin}/?brand=${this.brandId}&fail=1`,
      ...(method === '가상계좌' && { validHours: 24 }),
    });
  }

  async handleRedirect(
    onSuccess: (result: { stored?: PendingOrder; resData?: Record<string, unknown>; error?: string }) => void,
    onFail: () => void,
  ): Promise<boolean> {
    const params = new URLSearchParams(location.search);

    if (params.get('fail')) {
      history.replaceState({}, '', `/?brand=${this.brandId}`);
      const stored: PendingOrder | null = JSON.parse(sessionStorage.getItem('pendingOrder') ?? 'null');
      if (stored) this._restoreForm(stored, params.get('message') ?? undefined);
      onFail();
      return true;
    }

    if (!params.get('paymentKey')) return false;

    const stored: PendingOrder | null = JSON.parse(sessionStorage.getItem('pendingOrder') ?? 'null');
    if (!stored) { onSuccess({ error: '주문 정보를 찾을 수 없습니다.' }); return true; }

    try {
      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...stored, paymentKey: params.get('paymentKey') }),
      });
      const resData = await res.json();
      if (!resData.success) throw new Error(resData.message || '결제 승인 실패');
      sessionStorage.removeItem('pendingOrder');
      this.cart.clear();
      history.replaceState({}, '', `/?brand=${this.brandId}`);
      onSuccess({ stored, resData });
    } catch (e) {
      onSuccess({ error: (e as Error).message });
    }
    return true;
  }

  private _restoreForm(stored: PendingOrder, message?: string): void {
    const items = stored.items || [];
    const subtotal = this.cart.getSubtotal(items);
    const shipping = this.cart.getShipping(items);
    document.getElementById('summary-items')!.innerHTML = items.map(item =>
      `<div class="flex justify-between"><span>${itemLabel(item)} × ${item.quantity}</span><span>${fmt(item.unitPrice * item.quantity)}</span></div>`
    ).join('');
    document.getElementById('summary-amount')!.textContent = `총 ${fmt(subtotal + shipping)} (배송비 ${fmt(shipping)} 포함)`;
    (document.getElementById('buyer-name') as HTMLInputElement).value = stored.buyerName || '';
    (document.getElementById('buyer-phone') as HTMLInputElement).value = stored.buyerPhone || '';
    const addrParts = (stored.shippingAddress || '').split(' ');
    (document.getElementById('addr-zonecode') as HTMLInputElement).value = addrParts[0] || '';
    (document.getElementById('addr-address') as HTMLInputElement).value = addrParts.slice(1, -1).join(' ') || '';
    (document.getElementById('addr-detail') as HTMLInputElement).value = addrParts[addrParts.length - 1] || '';
    (document.getElementById('shipping-memo') as HTMLInputElement).value = stored.shippingMemo || '';
    const methodRadio = document.querySelector(`input[name="payment-method"][value="${stored.paymentMethod}"]`) as HTMLInputElement;
    if (methodRadio) methodRadio.checked = true;
    const errEl = document.getElementById('checkout-error')!;
    errEl.textContent = message || '결제가 취소되었거나 실패했습니다. 다시 시도해주세요.';
    errEl.classList.remove('hidden');
  }
}
