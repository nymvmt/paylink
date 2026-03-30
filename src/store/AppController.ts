import { supabase } from '../shared/supabaseClient';
import { fmt, itemLabel, renderKVRows } from '../shared/format';
import { BrandService } from './BrandService';
import { CartService } from './CartService';
import { CartView } from './CartView';
import { SliderController } from './SliderController';
import { ProductService } from './ProductService';
import { ProductView } from './ProductView';
import { CheckoutService } from './CheckoutService';
import { OrderService } from './OrderService';
import type { PendingOrder } from '../types';

const SCREENS = ['shop', 'product', 'checkout', 'success', 'error', 'order'] as const;
type Screen = typeof SCREENS[number];

export class AppController {
  private brandId: string | null;
  private brandSvc: BrandService;
  private cartSvc: CartService;
  private cartView: CartView;
  private slider: SliderController;
  private productSvc: ProductService;
  private productView: ProductView;
  private checkout: CheckoutService;
  private orderSvc: OrderService;

  constructor() {
    this.brandId = new URLSearchParams(location.search).get('brand');
    this.brandSvc    = new BrandService();
    this.cartSvc     = new CartService(this.brandId);
    this.cartView    = new CartView(this.cartSvc);
    this.slider      = new SliderController();
    this.productSvc  = new ProductService();
    this.productView = new ProductView(this.slider, this.cartSvc, this.cartView);
    this.checkout    = new CheckoutService(this.cartSvc, this.brandId);
    this.orderSvc    = new OrderService();
  }

  showScreen(name: Screen): void {
    SCREENS.forEach(s => document.getElementById(`screen-${s}`)!.classList.add('hidden'));
    document.getElementById(`screen-${name}`)!.classList.remove('hidden');
  }

  async loadShop(): Promise<void> {
    this.showScreen('shop');
    document.getElementById('shop-title')!.textContent = this.brandId ? '상품 목록' : '브랜드 목록';
    if (!this.brandId) {
      const { data: brands } = await supabase.from('settings').select('owner_id, value').eq('key', 'brand_name');
      const grid = document.getElementById('shop-grid')!;
      if (!brands || brands.length === 0) {
        grid.innerHTML = '<p class="col-span-2 text-center text-gray-400 py-12">등록된 브랜드가 없습니다.</p>';
      } else {
        grid.innerHTML = brands.map((b: { owner_id: string; value: string }) =>
          `<a href="/?brand=${b.owner_id}" class="col-span-1 border border-gray-100 rounded-xl p-6 flex items-center justify-center text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors">${b.value}</a>`
        ).join('');
      }
      return;
    }
    this.productSvc.reset();
    document.getElementById('shop-grid')!.innerHTML = '';
    await this.productSvc.fetchNextPage(this.brandId);
    this.productSvc.initInfiniteScroll(this.brandId);
  }

  async showProduct(id: string): Promise<void> {
    history.pushState({}, '', `/?brand=${this.brandId}&id=${id}`);
    const data = await this.productSvc.getById(id, this.brandId!);
    if (!data) return;
    this.productView.show(data);
    this.showScreen('product');
  }

  private _bindGlobals(): void {
    window.showScreen    = (n: string) => this.showScreen(n as Screen);
    window.toggleCart    = () => this.cartView.toggle();
    window.openCart      = () => this.cartView.open();
    window.closeCart     = () => this.cartView.close();
    window.removeItem    = (idx: number) => this.cartView.removeItem(idx);
    window.showProduct   = (id: string) => this.showProduct(id);
    window.goBack        = () => { history.pushState({}, '', `/?brand=${this.brandId}`); this.loadShop(); };
    window.goSlide       = (i: number) => this.slider.goTo(i);
    window.prevSlide     = () => this.slider.prev();
    window.nextSlide     = () => this.slider.next();
    window.selectOption  = (t: 'size' | 'color', v: string) => this.productView.selectOption(t, v);
    window.changeQty     = (d: number) => this.productView.changeQty(d);
    window.addToCart     = () => this.productView.addToCart();
    window.goCheckout    = () => { this.checkout.show(); this.cartView.close(); this.showScreen('checkout'); };
    window.openAddrSearch = () => this.checkout.openAddrSearch();
    window.requestPayment = () => this.checkout.requestPayment();
    window.goToShop      = async () => { this.cartView.close(); await this.loadShop(); };
    window.goToOrderLookup = () => {
      const orderId = document.getElementById('success-order-id')!.textContent;
      if (orderId) (document.getElementById('order-id-input') as HTMLInputElement).value = orderId;
      this.showScreen('order');
    };
    window.copyVirtualAccount = (btn: HTMLButtonElement) => {
      const account = document.getElementById('va-account')!.textContent!;
      navigator.clipboard.writeText(account).then(() => { btn.textContent = '복사됨'; setTimeout(() => btn.textContent = '복사', 1500); });
    };
    window.copyOrderId = (btn: HTMLButtonElement) => {
      const id = document.getElementById('success-order-id')!.textContent!;
      navigator.clipboard.writeText(id).then(() => { btn.textContent = '복사됨'; setTimeout(() => btn.textContent = '복사', 1500); });
    };
    window.lookupOrder = async () => {
      const orderId = (document.getElementById('order-id-input') as HTMLInputElement).value.trim();
      const buyerPhone = (document.getElementById('order-phone-input') as HTMLInputElement).value.trim();
      const errEl = document.getElementById('order-error')!;
      const resultEl = document.getElementById('order-result')!;
      if (!orderId || !buyerPhone) {
        errEl.textContent = '주문번호와 연락처를 입력해주세요.';
        errEl.classList.remove('hidden');
        resultEl.classList.add('hidden');
        return;
      }
      errEl.classList.add('hidden');
      try {
        const order = await this.orderSvc.lookup(orderId, buyerPhone);
        resultEl.innerHTML = this.orderSvc.render(order);
        resultEl.classList.remove('hidden');
      } catch (e) {
        errEl.textContent = (e as Error).message;
        errEl.classList.remove('hidden');
        resultEl.classList.add('hidden');
      }
    };
  }

  async init(): Promise<void> {
    document.getElementById('app-loader')!.remove();
    this._bindGlobals();
    this.checkout.initPhoneFormat();

    const brandParam = this.brandId ? `?brand=${this.brandId}` : '/';
    document.getElementById('btn-home')!.onclick = () => { location.href = brandParam; };
    document.getElementById('btn-order-back')!.onclick = () => { location.href = brandParam; };
    document.getElementById('btn-retry')!.onclick = () => { location.href = brandParam; };

    this.cartSvc._updateBadge(this.cartSvc.load());
    if (this.brandId) this.brandSvc.load(this.brandId);

    const handled = await this.checkout.handleRedirect(
      ({ stored, resData, error }) => {
        if (error) { document.getElementById('error-msg')!.textContent = error; this.showScreen('error'); return; }
        document.getElementById('success-order-id')!.textContent = stored!.orderId;
        const vaInfo = document.getElementById('virtual-account-info')!;
        const va = (resData as Record<string, Record<string, string>>).virtualAccount;
        if (va) {
          document.getElementById('va-bank')!.textContent = va.bankName;
          document.getElementById('va-account')!.textContent = va.accountNumber;
          const due = va.dueDate ? new Date(va.dueDate).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '-';
          document.getElementById('va-due')!.textContent = due;
          vaInfo.classList.remove('hidden');
        } else {
          vaInfo.classList.add('hidden');
        }
        const rows: [string, string][] = [
          ['결제수단', stored!.paymentMethod],
          ['결제금액', fmt(stored!.amount)],
          ['받는 분', stored!.buyerName],
          ['연락처', stored!.buyerPhone],
          ['배송지', stored!.shippingAddress],
          ...(stored!.shippingMemo ? [['배송 메모', stored!.shippingMemo] as [string, string]] : []),
        ];
        const itemRows = (stored!.items || []).map((item: PendingOrder['items'][0]) =>
          `<div class="flex justify-between"><span class="text-gray-500">${itemLabel(item)} × ${item.quantity}</span><span class="font-medium">${fmt(item.unitPrice * item.quantity)}</span></div>`
        ).join('');
        document.getElementById('success-detail')!.innerHTML = renderKVRows(rows, itemRows);
        this.showScreen('success');
      },
      () => this.showScreen('checkout'),
    );
    if (handled) return;

    const params = new URLSearchParams(location.search);
    if (params.has('order')) {
      this.showScreen('order');
    } else if (params.get('id')) {
      await this.showProduct(params.get('id')!);
    } else {
      await this.loadShop();
    }
  }
}
