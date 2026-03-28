import { supabase } from '../shared/supabaseClient.js';

const SETTING_KEYS = ['brand_name','owner_name','business_number','commerce_number','business_address','contact_phone','instagram','link','notify_email'];

export class BrandSettingsService {
  constructor(authService) {
    this.auth = authService;
  }

  async load() {
    const { data } = await supabase.from('settings').select('key, value').eq('owner_id', this.auth.currentUser.id);
    const map = Object.fromEntries((data || []).map(r => [r.key, r.value]));
    const name = map['brand_name']?.trim() || '';

    document.getElementById('admin-brand').textContent = name || '(브랜드명 없음)';
    document.getElementById('setup-brand').value = name;
    document.getElementById('setup-owner-name').value = map['owner_name']?.trim() || '';
    document.getElementById('setup-business-number').value = map['business_number']?.trim() || '';
    document.getElementById('setup-commerce-number').value = map['commerce_number']?.trim() || '';
    document.getElementById('setup-address').value = map['business_address']?.trim() || '';
    document.getElementById('setup-contact-phone').value = map['contact_phone']?.trim() || '';
    document.getElementById('setup-instagram').value = map['instagram']?.trim() || '';
    document.getElementById('setup-link').value = map['link']?.trim() || '';
    document.getElementById('setup-notify-email').value = map['notify_email']?.trim() || '';

    this._renderFooter(map, name);
    return name;
  }

  async save() {
    const name = document.getElementById('setup-brand').value.trim();
    const errEl = document.getElementById('setup-error');
    if (!name) {
      errEl.textContent = '브랜드명을 입력해주세요.';
      errEl.classList.remove('hidden');
      return false;
    }
    errEl.classList.add('hidden');

    const fieldMap = {
      brand_name:       name,
      owner_name:       document.getElementById('setup-owner-name').value.trim(),
      business_number:  document.getElementById('setup-business-number').value.trim(),
      commerce_number:  document.getElementById('setup-commerce-number').value.trim(),
      business_address: document.getElementById('setup-address').value.trim(),
      contact_phone:    document.getElementById('setup-contact-phone').value.trim(),
      instagram:        document.getElementById('setup-instagram').value.trim().replace(/^@/, ''),
      link:             document.getElementById('setup-link').value.trim(),
      notify_email:     document.getElementById('setup-notify-email').value.trim(),
    };

    const rows = Object.entries(fieldMap)
      .filter(([, v]) => v)
      .map(([key, value]) => ({ owner_id: this.auth.currentUser.id, key, value }));

    const { error } = await supabase.from('settings').upsert(rows);
    if (error) {
      errEl.textContent = error.message;
      errEl.classList.remove('hidden');
      return false;
    }
    document.getElementById('admin-brand').textContent = name;
    return true;
  }

  _renderFooter(map, name) {
    const set = (id, prefix, val) => { if (val) document.getElementById(id).textContent = prefix + val; };
    set('footer-brand', '상호: ', name);
    set('footer-owner', '대표자: ', map['owner_name']);
    set('footer-business-number', '사업자등록번호: ', map['business_number']);
    set('footer-commerce-number', '통신판매업 신고번호: ', map['commerce_number']);
    set('footer-address', '주소: ', map['business_address']);
    set('footer-contact', '고객 문의: ', map['contact_phone']);
    const ig = map['instagram']?.replace(/^@/, '');
    const igEl = document.getElementById('footer-instagram');
    if (ig) { igEl.href = `https://instagram.com/${ig}`; igEl.textContent = `Instagram @${ig}`; igEl.classList.remove('hidden'); }
    const lk = map['link'];
    const lkEl = document.getElementById('footer-link');
    if (lk) { lkEl.href = lk; lkEl.textContent = lk; lkEl.classList.remove('hidden'); }
    if (['brand_name','owner_name','business_number','commerce_number','business_address','contact_phone','instagram','link'].some(k => map[k])) {
      document.getElementById('site-footer').classList.remove('hidden');
    }
  }
}
