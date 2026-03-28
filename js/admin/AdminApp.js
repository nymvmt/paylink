import { supabase } from '../shared/supabaseClient.js';
import { AuthService } from './AuthService.js';
import { BrandSettingsService } from './BrandSettingsService.js';
import { ProductEditor } from './ProductEditor.js';
import { OrderManager } from './OrderManager.js';

const SCREENS = ['login', 'setup', 'list', 'editor', 'orders'];

export class AdminApp {
  constructor() {
    this.auth     = new AuthService();
    this.brand    = new BrandSettingsService(this.auth);
    this.editor   = new ProductEditor(this.auth);
    this.orders   = new OrderManager(this.auth);
  }

  show(name) {
    SCREENS.forEach(s => document.getElementById(`screen-${s}`).classList.add('hidden'));
    document.getElementById(`screen-${name}`).classList.remove('hidden');
    document.getElementById('admin-header').classList.toggle('hidden', name === 'login');
  }

  async loadList() {
    this.show('list');
    const { data: unowned } = await supabase.from('products').select('id').is('owner_id', null);
    const claimBanner = document.getElementById('claim-banner');
    if (unowned?.length > 0) {
      document.getElementById('claim-count').textContent = unowned.length;
      claimBanner.classList.remove('hidden');
    } else {
      claimBanner.classList.add('hidden');
    }
    const { data } = await supabase.from('products').select('*').eq('owner_id', this.auth.currentUser.id).order('name');
    const el = document.getElementById('product-list');
    if (!data || data.length === 0) {
      el.innerHTML = '<p class="text-sm text-gray-400 text-center py-8">등록된 상품이 없습니다.</p>';
      return;
    }
    el.innerHTML = data.map(p => `
      <div class="bg-white rounded-xl p-4 flex items-center gap-4 ${p.is_hidden ? 'opacity-50' : ''}">
        <div class="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
          ${p.images?.[0]
            ? `<img src="${p.images[0]}" class="w-full h-full object-cover">`
            : '<div class="w-full h-full flex items-center justify-center text-gray-300 text-xs">없음</div>'}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm truncate">${p.name || '(이름 없음)'}${p.is_hidden ? ' <span class="text-xs text-gray-400 font-normal">(숨김)</span>' : ''}</p>
          <p class="text-xs text-gray-400 mt-0.5">${(p.price || 0).toLocaleString()}원 · 배송비 ${(p.shipping_fee || 0).toLocaleString()}원</p>
          ${p.description ? `<p class="text-xs text-gray-400 mt-0.5 truncate">${p.description}</p>` : ''}
          ${(p.sizes?.length || p.colors?.length) ? `<p class="text-xs text-gray-300 mt-0.5">${[p.sizes?.join(' · '), p.colors?.join(' · ')].filter(Boolean).join(' / ')}</p>` : ''}
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="copyLink('${p.id}')" class="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">링크 복사</button>
          <button onclick="toggleHidden('${p.id}', ${p.is_hidden})" class="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">${p.is_hidden ? '표시' : '숨김'}</button>
          <button onclick="openEditor('${p.id}')" class="text-xs bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800">편집</button>
          <button onclick="deleteProduct('${p.id}', '${(p.name || '').replace(/'/g, "\\'")}')" class="text-xs border border-red-200 text-red-500 rounded-lg px-3 py-1.5 hover:bg-red-50">삭제</button>
        </div>
      </div>
    `).join('');
  }

  _bindGlobals() {
    window.show              = n => this.show(n);
    window.login             = () => this.auth.login();
    window.logout            = async () => { await this.auth.logout(); this.show('login'); };
    window.saveBrandSettings = async () => { const ok = await this.brand.save(); if (ok) this.loadList(); };
    window.loadList          = () => this.loadList();
    window.loadOrders        = async () => { this.show('orders'); await this.orders.load(); };
    window.updateOrderStatus = async (id, status) => { const ok = await this.orders.updateStatus(id, status); if (ok) this.orders.load(); };
    window.openEditor        = async id => { await this.editor.open(id); this.show('editor'); };
    window.saveProduct       = async () => { const ok = await this.editor.save(); if (ok) this.loadList(); };
    window.removeExistingImage = i => this.editor.removeExistingImage(i);
    window.toggleHidden      = async (id, current) => {
      const res = await fetch('/api/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await this.auth.getToken()}` },
        body: JSON.stringify({ id, is_hidden: !current }),
      });
      if (!res.ok) { alert('실패했습니다.'); return; }
      this.loadList();
    };
    window.deleteProduct     = async (id, name) => {
      if (!confirm(`"${name}" 상품을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
      const res = await fetch('/api/product', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await this.auth.getToken()}` },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { alert('삭제에 실패했습니다.'); return; }
      this.loadList();
    };
    window.copyStoreLink     = () => {
      const url = `${location.origin}/?brand=${this.auth.currentUser.id}`;
      navigator.clipboard.writeText(url).then(() => alert('스토어 링크가 복사되었습니다.\n' + url));
    };
    window.copyLink          = id => {
      const url = `${location.origin}/?brand=${this.auth.currentUser.id}&id=${id}`;
      navigator.clipboard.writeText(url).then(() => alert('링크가 복사되었습니다.\n' + url));
    };
    window.claimProducts     = async () => {
      const { error } = await supabase.from('products').update({ owner_id: this.auth.currentUser.id }).is('owner_id', null);
      if (error) { alert('가져오기에 실패했습니다.'); return; }
      this.loadList();
    };
  }

  async init() {
    this._bindGlobals();
    this.editor.initImagePreview();

    const session = await this.auth.getSession();
    if (session) {
      document.getElementById('header-shop-link').href = `${location.origin}/?brand=${this.auth.currentUser.id}`;
      const brandName = await this.brand.load();
      if (!brandName) this.show('setup');
      else this.loadList();
    } else {
      this.show('login');
    }
  }
}
