import { supabase } from '../shared/supabaseClient.js';

const PAGE_SIZE = 10;

export class ProductService {
  constructor() {
    this.page = 0;
    this.done = false;
    this.loading = false;
    this.observer = null;
  }

  async fetchNextPage(brandId) {
    if (this.done || this.loading) return;
    this.loading = true;
    const from = this.page * PAGE_SIZE;
    const { data, error } = await supabase.from('products').select('*')
      .eq('owner_id', brandId)
      .eq('is_hidden', false)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    this.loading = false;
    if (error) { console.error('[shop]', error); return; }
    const grid = document.getElementById('shop-grid');
    if (!data || data.length === 0) {
      if (this.page === 0) grid.innerHTML = '<p class="col-span-2 text-center text-gray-400 py-12">등록된 상품이 없습니다.</p>';
      this.done = true;
      return;
    }
    grid.insertAdjacentHTML('beforeend', data.map(p => this._card(p)).join(''));
    this.page++;
    if (data.length < PAGE_SIZE) this.done = true;
  }

  async getById(id, brandId) {
    const { data } = await supabase.from('products').select('*').eq('id', id).eq('owner_id', brandId).single();
    return data;
  }

  reset() {
    this.page = 0;
    this.done = false;
    this.loading = false;
    if (this.observer) { this.observer.disconnect(); this.observer = null; }
  }

  initInfiniteScroll(brandId) {
    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) this.fetchNextPage(brandId);
    }, { rootMargin: '200px' });
    this.observer.observe(document.getElementById('shop-sentinel'));
  }

  _card(p) {
    return `<div onclick="showProduct('${p.id}')" class="cursor-pointer">
      <div class="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2">
        ${p.images && p.images[0]
          ? `<img src="${p.images[0]}" class="w-full h-full object-cover">`
          : '<div class="w-full h-full flex items-center justify-center text-gray-300 text-sm">이미지 없음</div>'}
      </div>
      <p class="text-sm font-medium">${p.name || ''}</p>
      <p class="text-sm text-gray-500">${(p.price || 0).toLocaleString()}원</p>
    </div>`;
  }
}
