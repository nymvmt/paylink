export class SliderController {
  private images: string[] = [];
  private index: number = 0;
  private touchStartX: number = 0;

  init(images: string[]): void {
    this.images = images || [];
    this.index = 0;
    this._render();
    this._initSwipe();
  }

  private _initSwipe(): void {
    const el = document.getElementById('slider-img')!.parentElement!;
    el.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      if (Math.abs(dx) < 40) return;
      dx < 0 ? this.next() : this.prev();
    }, { passive: true });
  }

  prev(): void {
    if (!this.images.length) return;
    this.index = (this.index - 1 + this.images.length) % this.images.length;
    this._render();
  }

  next(): void {
    if (!this.images.length) return;
    this.index = (this.index + 1) % this.images.length;
    this._render();
  }

  goTo(i: number): void {
    this.index = i;
    this._render();
  }

  private _render(): void {
    (document.getElementById('slider-img') as HTMLImageElement).src = this.images[this.index] || '';
    document.getElementById('slider-dots')!.innerHTML = this.images.map((_, i) =>
      `<button onclick="goSlide(${i})" class="w-3 h-3 rounded-full ${i === this.index ? 'bg-black' : 'bg-gray-300'} transition-colors"></button>`
    ).join('');
  }
}
