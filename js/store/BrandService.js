import { supabase } from '../shared/supabaseClient.js';

export class BrandService {
  async load(brandId) {
    if (!brandId) return;
    const { data } = await supabase.from('settings').select('key, value').eq('owner_id', brandId);
    const map = Object.fromEntries((data || []).map(r => [r.key, r.value]));

    const name = map['brand_name']?.trim();
    if (name) {
      document.getElementById('site-title').textContent = name;
      document.title = name;
    }

    const set = (id, prefix, val) => {
      if (val) document.getElementById(id).textContent = prefix + val;
    };
    set('footer-brand', '상호: ', name);
    set('footer-owner', '대표자: ', map['owner_name']);
    set('footer-business-number', '사업자등록번호: ', map['business_number']);
    set('footer-commerce-number', '통신판매업 신고번호: ', map['commerce_number']);
    set('footer-address', '주소: ', map['business_address']);
    set('footer-contact', '고객 문의: ', map['contact_phone']);

    const ig = map['instagram']?.replace(/^@/, '');
    const igEl = document.getElementById('footer-instagram');
    if (ig) {
      igEl.href = `https://instagram.com/${ig}`;
      igEl.textContent = `Instagram @${ig}`;
      igEl.classList.remove('hidden');
    }

    const lk = map['link'];
    const lkEl = document.getElementById('footer-link');
    if (lk) {
      lkEl.href = lk;
      lkEl.textContent = lk;
      lkEl.classList.remove('hidden');
    }

    const hasAny = ['brand_name','owner_name','business_number','commerce_number','business_address','contact_phone','instagram','link']
      .some(k => map[k]);
    if (hasAny) document.getElementById('site-footer').classList.remove('hidden');
  }
}
