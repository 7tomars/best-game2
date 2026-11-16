// Shardlight — keyboard and mouse. Tracks held keys and the pointer in canvas
// space; the game reads this each frame and never listens elsewhere.

const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 640, y: 300, down: false };
    this.pressed = new Set(); // keys pressed this frame, cleared by endFrame()
    this._onKeyDown = (event) => {
      if (MOVE_KEYS.has(event.code) || event.code === 'Space') event.preventDefault();
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
    };
    this._onKeyUp = (event) => this.keys.delete(event.code);
    this._onMouseMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
      this.mouse.y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
    };
    this._onMouseDown = (event) => {
      if (event.button === 0) this.mouse.down = true;
      this.pressed.add('Mouse0');
    };
    this._onMouseUp = (event) => {
      if (event.button === 0) this.mouse.down = false;
    };
    this._onContext = (event) => event.preventDefault();
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    this.canvas.addEventListener('contextmenu', this._onContext);
  }

  moveVector() {
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (k.has('KeyW') || k.has('ArrowUp')) y -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  endFrame() {
    this.pressed.clear();
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('contextmenu', this._onContext);
  }
}
