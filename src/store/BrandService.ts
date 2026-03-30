import { supabase } from '../shared/supabaseClient';
import type { BrandSettings } from '../types';

export class BrandService {
  async load(brandId: string): Promise<void> {
    const { data } = await supabase.from('settings').select('key, value').eq('owner_id', brandId);
    const map: BrandSettings = Object.fromEntries((data || []).map((r: { key: string; value: string }) => [r.key, r.value]));

    const name = map.brand_name?.trim();
    if (name) {
      document.getElementById('site-title')!.textContent = name;
      document.title = name;
    }

    const set = (id: string, prefix: string, val?: string) => {
      if (val) document.getElementById(id)!.textContent = prefix + val;
    };
    set('footer-brand', '상호: ', name);
    set('footer-owner', '대표자: ', map.owner_name);
    set('footer-business-number', '사업자등록번호: ', map.business_number);
    set('footer-commerce-number', '통신판매업 신고번호: ', map.commerce_number);
    set('footer-address', '주소: ', map.business_address);
    set('footer-contact', '고객 문의: ', map.contact_phone);

    const ig = map.instagram?.replace(/^@/, '');
    const igEl = document.getElementById('footer-instagram') as HTMLAnchorElement;
    if (ig) {
      igEl.href = `https://instagram.com/${ig}`;
      igEl.textContent = `Instagram @${ig}`;
      igEl.classList.remove('hidden');
    }

    const lk = map.link;
    const lkEl = document.getElementById('footer-link') as HTMLAnchorElement;
    if (lk) {
      lkEl.href = lk;
      lkEl.textContent = lk;
      lkEl.classList.remove('hidden');
    }

    const keys: (keyof BrandSettings)[] = ['brand_name','owner_name','business_number','commerce_number','business_address','contact_phone','instagram','link'];
    if (keys.some(k => map[k])) {
      document.getElementById('site-footer')!.classList.remove('hidden');
    }
  }
}
