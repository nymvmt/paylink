export class SliderController {
  constructor() {
    this.images = [];
    this.index = 0;
  }

  init(images) {
    this.images = images || [];
    this.index = 0;
    this._render();
  }

  prev() {
    if (!this.images.length) return;
    this.index = (this.index - 1 + this.images.length) % this.images.length;
    this._render();
  }

  next() {
    if (!this.images.length) return;
    this.index = (this.index + 1) % this.images.length;
    this._render();
  }

  goTo(i) {
    this.index = i;
    this._render();
  }

  _render() {
    document.getElementById('slider-img').src = this.images[this.index] || '';
    document.getElementById('slider-dots').innerHTML = this.images.map((_, i) =>
      `<button onclick="goSlide(${i})" class="w-3 h-3 rounded-full ${i === this.index ? 'bg-black' : 'bg-gray-300'} transition-colors"></button>`
    ).join('');
  }
}
