import { supabase } from '../shared/supabaseClient';
import type { AuthService } from './AuthService';
import type { BrandSettings } from '../types';

export class BrandSettingsService {
  constructor(private auth: AuthService) {}

  async load(): Promise<string> {
    const { data } = await supabase.from('settings').select('key, value').eq('owner_id', this.auth.currentUser!.id);
    const map: BrandSettings = Object.fromEntries((data || []).map((r: { key: string; value: string }) => [r.key, r.value]));
    const name = map.brand_name?.trim() || '';

    document.getElementById('admin-brand')!.textContent = name || '(브랜드명 없음)';
    (document.getElementById('setup-brand') as HTMLInputElement).value = name;
    (document.getElementById('setup-owner-name') as HTMLInputElement).value = map.owner_name?.trim() || '';
    (document.getElementById('setup-business-number') as HTMLInputElement).value = map.business_number?.trim() || '';
    (document.getElementById('setup-commerce-number') as HTMLInputElement).value = map.commerce_number?.trim() || '';
    (document.getElementById('setup-address') as HTMLInputElement).value = map.business_address?.trim() || '';
    (document.getElementById('setup-contact-phone') as HTMLInputElement).value = map.contact_phone?.trim() || '';
    (document.getElementById('setup-instagram') as HTMLInputElement).value = map.instagram?.trim() || '';
    (document.getElementById('setup-link') as HTMLInputElement).value = map.link?.trim() || '';
    (document.getElementById('setup-notify-email') as HTMLInputElement).value = map.notify_email?.trim() || '';

    this._renderFooter(map, name);
    return name;
  }

  async save(): Promise<boolean> {
    const name = (document.getElementById('setup-brand') as HTMLInputElement).value.trim();
    const errEl = document.getElementById('setup-error')!;
    if (!name) {
      errEl.textContent = '브랜드명을 입력해주세요.';
      errEl.classList.remove('hidden');
      return false;
    }
    errEl.classList.add('hidden');

    const fieldMap: BrandSettings = {
      brand_name:       name,
      owner_name:       (document.getElementById('setup-owner-name') as HTMLInputElement).value.trim(),
      business_number:  (document.getElementById('setup-business-number') as HTMLInputElement).value.trim(),
      commerce_number:  (document.getElementById('setup-commerce-number') as HTMLInputElement).value.trim(),
      business_address: (document.getElementById('setup-address') as HTMLInputElement).value.trim(),
      contact_phone:    (document.getElementById('setup-contact-phone') as HTMLInputElement).value.trim(),
      instagram:        (document.getElementById('setup-instagram') as HTMLInputElement).value.trim().replace(/^@/, ''),
      link:             (document.getElementById('setup-link') as HTMLInputElement).value.trim(),
      notify_email:     (document.getElementById('setup-notify-email') as HTMLInputElement).value.trim(),
    };

    const rows = Object.entries(fieldMap)
      .filter(([, v]) => v)
      .map(([key, value]) => ({ owner_id: this.auth.currentUser!.id, key, value }));

    const { error } = await supabase.from('settings').upsert(rows);
    if (error) {
      errEl.textContent = error.message;
      errEl.classList.remove('hidden');
      return false;
    }
    document.getElementById('admin-brand')!.textContent = name;
    return true;
  }

  private _renderFooter(map: BrandSettings, name: string): void {
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
    if (ig) { igEl.href = `https://instagram.com/${ig}`; igEl.textContent = `Instagram @${ig}`; igEl.classList.remove('hidden'); }
    const lk = map.link;
    const lkEl = document.getElementById('footer-link') as HTMLAnchorElement;
    if (lk) { lkEl.href = lk; lkEl.textContent = lk; lkEl.classList.remove('hidden'); }
    const keys: (keyof BrandSettings)[] = ['brand_name','owner_name','business_number','commerce_number','business_address','contact_phone','instagram','link'];
    if (keys.some(k => map[k])) document.getElementById('site-footer')!.classList.remove('hidden');
  }
}
