export class SliderController {
  private images: string[] = [];
  private index: number = 0;

  init(images: string[]): void {
    this.images = images || [];
    this.index = 0;
    this._render();
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
