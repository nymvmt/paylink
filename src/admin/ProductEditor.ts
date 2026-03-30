import { supabase } from '../shared/supabaseClient';
import type { AuthService } from './AuthService';

export class ProductEditor {
  productId: string | null = null;
  existingImages: string[] = [];

  constructor(private auth: AuthService) {}

  async open(id: string | null): Promise<void> {
    this.productId = id;
    this.existingImages = [];
    document.getElementById('editor-title')!.textContent = id ? '상품 편집' : '새 상품';
    (document.getElementById('f-name') as HTMLInputElement).value = '';
    (document.getElementById('f-price') as HTMLInputElement).value = '';
    (document.getElementById('f-shipping') as HTMLInputElement).value = '4000';
    (document.getElementById('f-desc') as HTMLTextAreaElement).value = '';
    (document.getElementById('f-sizes') as HTMLInputElement).value = '';
    (document.getElementById('f-colors') as HTMLInputElement).value = '';
    document.getElementById('image-preview')!.innerHTML = '';
    document.getElementById('existing-images')!.innerHTML = '';
    document.getElementById('save-error')!.classList.add('hidden');
    document.getElementById('save-ok')!.classList.add('hidden');

    if (id) {
      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) {
        this.existingImages = data.images || [];
        (document.getElementById('f-name') as HTMLInputElement).value = data.name || '';
        (document.getElementById('f-price') as HTMLInputElement).value = data.price || '';
        (document.getElementById('f-shipping') as HTMLInputElement).value = data.shipping_fee ?? 4000;
        (document.getElementById('f-desc') as HTMLTextAreaElement).value = data.description || '';
        (document.getElementById('f-sizes') as HTMLInputElement).value = (data.sizes || []).join(', ');
        (document.getElementById('f-colors') as HTMLInputElement).value = (data.colors || []).join(', ');
        this._renderExistingImages();
      }
    }
  }

  initImagePreview(): void {
    document.getElementById('f-images')!.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      const preview = document.getElementById('image-preview')!;
      preview.innerHTML = '';
      Array.from(input.files || []).slice(0, 10).forEach(file => {
        const url = URL.createObjectURL(file);
        preview.innerHTML += `<img src="${url}" class="w-16 h-16 object-cover rounded-lg border border-gray-200">`;
      });
    });
  }

  removeExistingImage(i: number): void {
    this.existingImages.splice(i, 1);
    this._renderExistingImages();
  }

  async save(): Promise<boolean> {
    const btn = document.getElementById('save-btn') as HTMLButtonElement;
    const errEl = document.getElementById('save-error')!;
    const okEl = document.getElementById('save-ok')!;
    errEl.classList.add('hidden');
    okEl.classList.add('hidden');
    btn.textContent = '저장 중...';
    btn.disabled = true;

    try {
      const fileInput = document.getElementById('f-images') as HTMLInputElement;
      const newUrls: string[] = [];
      for (const file of Array.from(fileInput.files || []).slice(0, 10 - this.existingImages.length)) {
        const fileData: string = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = e => resolve((e.target!.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        const upRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await this.auth.getToken()}` },
          body: JSON.stringify({ fileName: file.name, fileData, contentType: file.type }),
        });
        if (!upRes.ok) throw new Error((await upRes.json()).message || '업로드 실패');
        newUrls.push((await upRes.json()).url);
      }

      const images = [...this.existingImages, ...newUrls];
      const payload = {
        id: this.productId || undefined,
        name: (document.getElementById('f-name') as HTMLInputElement).value.trim(),
        price: parseInt((document.getElementById('f-price') as HTMLInputElement).value),
        shipping_fee: parseInt((document.getElementById('f-shipping') as HTMLInputElement).value),
        description: (document.getElementById('f-desc') as HTMLTextAreaElement).value.trim(),
        sizes: (document.getElementById('f-sizes') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean),
        colors: (document.getElementById('f-colors') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean),
        images,
      };

      const res = await fetch('/api/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await this.auth.getToken()}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).message || '저장 실패');

      const result = await res.json();
      if (!this.productId && result.id) this.productId = result.id;
      this.existingImages = images;
      fileInput.value = '';
      return true;
    } catch (e) {
      errEl.textContent = (e as Error).message;
      errEl.classList.remove('hidden');
      return false;
    } finally {
      btn.textContent = '저장';
      btn.disabled = false;
    }
  }

  private _renderExistingImages(): void {
    document.getElementById('existing-images')!.innerHTML = this.existingImages.map((url, i) =>
      `<div class="relative">
        <img src="${url}" class="w-16 h-16 object-cover rounded-lg border border-gray-200">
        <button onclick="removeExistingImage(${i})" class="absolute -top-1 -right-1 w-4 h-4 bg-black text-white rounded-full text-xs flex items-center justify-center">×</button>
      </div>`
    ).join('');
  }
}
