const BRICK_KEY = 'mario-brick';
const BRICK_PARTICLE_KEY = 'mario-brick-particle';
const FIREWORK_KEY = 'mario-firework';

const FIREWORK_ANIM = 'mario-firework-anim';

const BG_COLOR = '#1a2238';

const BRICK_SOURCE_PX = 16;
const LETTER_GRID_W = 3;
const LETTER_GRID_H = 5;
const LETTER_CELL = 3;
const LETTER_GAP = 3;
const LETTER_SLOT = LETTER_GRID_W * LETTER_CELL + LETTER_GAP;
const LINE_HEIGHT = LETTER_GRID_H * LETTER_CELL + LETTER_CELL;
const WORD_AREA_TOP = 8;
const WORD_AREA_HEIGHT = 78;
const MAX_LINES = 3;

const DIGIT_Y = 96;

const BTN_W = 80;
const BTN_H = 16;
const BTN_GAP = 4;
const BTN_ROWS = 5;
const BTN_COLS = 4;
const BTN_TOP = 112;

const DEPTH_WORD = 2;
const DEPTH_DIGITS = 3;
const DEPTH_BUTTONS = 4;
const DEPTH_PARTICLES = 10;
const DEPTH_FIREWORKS = 11;

const LETTER_PATTERNS = {
  '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
  '2': ['XX.', '..X', '.X.', 'X..', 'XXX'],
  '3': ['XXX', '..X', '.XX', '..X', 'XXX'],
  '4': ['X.X', 'X.X', 'XXX', '..X', '..X'],
  '5': ['XXX', 'X..', 'XX.', '..X', 'XX.'],
  '6': ['.XX', 'X..', 'XXX', 'X.X', 'XXX'],
  '7': ['XXX', '..X', '.X.', '.X.', '.X.'],
  '8': ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'],
  '9': ['XXX', 'X.X', 'XXX', '..X', 'XX.'],
  'A': ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'],
  'B': ['XX.', 'X.X', 'XX.', 'X.X', 'XX.'],
  'C': ['.XX', 'X..', 'X..', 'X..', '.XX'],
  'D': ['XX.', 'X.X', 'X.X', 'X.X', 'XX.'],
  'E': ['XXX', 'X..', 'XX.', 'X..', 'XXX'],
  'F': ['XXX', 'X..', 'XX.', 'X..', 'X..'],
  'G': ['.XX', 'X..', 'X.X', 'X.X', '.XX'],
  'H': ['X.X', 'X.X', 'XXX', 'X.X', 'X.X'],
  'I': ['XXX', '.X.', '.X.', '.X.', 'XXX'],
  'J': ['..X', '..X', '..X', 'X.X', '.X.'],
  'K': ['X.X', 'X.X', 'XX.', 'X.X', 'X.X'],
  'L': ['X..', 'X..', 'X..', 'X..', 'XXX'],
  'M': ['X.X', 'XXX', 'XXX', 'X.X', 'X.X'],
  'N': ['X.X', 'XX.', 'X.X', '.XX', 'X.X'],
  'O': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  'P': ['XX.', 'X.X', 'XX.', 'X..', 'X..'],
  'Q': ['.XX', 'X.X', 'X.X', 'XX.', '.XX'],
  'R': ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'],
  'S': ['.XX', 'X..', '.X.', '..X', 'XX.'],
  'T': ['XXX', '.X.', '.X.', '.X.', '.X.'],
  'U': ['X.X', 'X.X', 'X.X', 'X.X', 'XXX'],
  'V': ['X.X', 'X.X', 'X.X', 'X.X', '.X.'],
  'W': ['X.X', 'X.X', 'X.X', 'XXX', 'X.X'],
  'X': ['X.X', 'X.X', '.X.', 'X.X', 'X.X'],
  'Y': ['X.X', 'X.X', '.X.', '.X.', '.X.'],
  'Z': ['XXX', '..X', '.X.', 'X..', 'XXX'],
  '.': ['...', '...', '...', '...', '.X.'],
  '-': ['...', '...', 'XXX', '...', '...'],
  ' ': ['...', '...', '...', '...', '...']
};

const ONES = [
  'ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
];
const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

function below1000(n) {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)];
    const o = n % 10;
    return o === 0 ? t : `${t} ${ONES[o]}`;
  }
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return rest === 0 ? `${ONES[h]} HUNDRED` : `${ONES[h]} HUNDRED ${below1000(rest)}`;
}

function numberToWords(n) {
  if (!Number.isFinite(n)) return 'ERROR';
  if (n < 0) return 'NEGATIVE ' + numberToWords(-n);
  if (n >= 1e12) return 'TOO BIG';

  if (Math.floor(n) !== n) {
    const s = n.toPrecision(10).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    const dotIdx = s.indexOf('.');
    if (dotIdx < 0) {
      return numberToWords(Number(s));
    }
    const wholeStr = s.slice(0, dotIdx);
    const fracStr = s.slice(dotIdx + 1);
    const wholeNum = Number(wholeStr);
    const wholeWords = numberToWords(wholeNum);
    const digits = fracStr.split('').map(d => ONES[Number(d)]).join(' ');
    return `${wholeWords} POINT ${digits}`;
  }

  if (n === 0) return 'ZERO';
  const billion = Math.floor(n / 1e9);
  const million = Math.floor(n / 1e6) % 1000;
  const thousand = Math.floor(n / 1000) % 1000;
  const rest = n % 1000;
  const parts = [];
  if (billion) parts.push(below1000(billion) + ' BILLION');
  if (million) parts.push(below1000(million) + ' MILLION');
  if (thousand) parts.push(below1000(thousand) + ' THOUSAND');
  if (rest) parts.push(below1000(rest));
  return parts.join(' ');
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return 'ERROR';
  if (Math.floor(n) === n && Math.abs(n) < 1e15) return String(n);
  const s = Number(n.toPrecision(10)).toString();
  return s;
}

export default class Game22Calculator extends Phaser.Scene {
  constructor() {
    super({ key: 'Game22' });
  }

  preload() {
    this.load.atlas(BRICK_KEY, './assets/mario-brick.png', './assets/mario-brick.json');
    this.load.atlas(BRICK_PARTICLE_KEY, './assets/mario-brick-particle.png', './assets/mario-brick-particle.json');
    this.load.atlas(FIREWORK_KEY, './assets/mario-firework.png', './assets/mario-firework.json');
  }

  create() {
    this.viewW = this.game.config.width;
    this.viewH = this.game.config.height;

    this.cameras.main.setBackgroundColor(BG_COLOR);

    if (!this.anims.exists(FIREWORK_ANIM)) {
      this.anims.create({
        key: FIREWORK_ANIM,
        frames: this.anims.generateFrameNames(FIREWORK_KEY, { prefix: 'atlas_s', start: 0, end: 1 }),
        frameRate: 14,
        repeat: -1
      });
    }

    this.wordSprites = [];
    this.lastDisplay = '';

    this.digitText = this.add.text(this.viewW / 2, DIGIT_Y, '0', {
      fontFamily: '"Orbitron", monospace',
      fontSize: '22px',
      fontStyle: '900',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(DEPTH_DIGITS);

    this.expression = '';
    this.current = '0';
    this.previous = null;
    this.operator = null;
    this.justComputed = false;
    this.afterOperator = false;

    this.buildButtons();
    this.bindKeyboard();

    this.renderSpelledWord(this.spelledForCurrent());
    this.lastDisplay = this.current;
  }

  bindKeyboard() {
    this.input.keyboard.on('keydown', (ev) => {
      const k = ev.key;
      if (/^[0-9]$/.test(k)) {
        this.onButton(k);
      } else if (k === '.') {
        this.onButton('.');
      } else if (k === '+' || k === '-' || k === '*' || k === '/') {
        this.onButton(k);
      } else if (k === 'Enter' || k === '=') {
        ev.preventDefault();
        this.onButton('=');
      } else if (k === 'Backspace') {
        this.onButton('CE');
      } else if (k === 'c' || k === 'C') {
        this.onButton('C');
      }
    });
  }

  buildButtons() {
    const layout = [
      ['C', 'CE', '%', '/'],
      ['7', '8', '9', '*'],
      ['4', '5', '6', '-'],
      ['1', '2', '3', '+'],
      ['+/-', '0', '.', '=']
    ];

    const gridWidth = BTN_COLS * BTN_W + (BTN_COLS - 1) * BTN_GAP;
    const startX = (this.viewW - gridWidth) / 2 + BTN_W / 2;

    layout.forEach((row, r) => {
      row.forEach((label, c) => {
        const x = startX + c * (BTN_W + BTN_GAP);
        const y = BTN_TOP + r * (BTN_H + BTN_GAP) + BTN_H / 2;
        const baseColor = this.buttonColor(label);
        const rect = this.add.rectangle(x, y, BTN_W, BTN_H, baseColor, 0.95)
          .setStrokeStyle(2, 0xffd700)
          .setDepth(DEPTH_BUTTONS)
          .setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, label, {
          fontFamily: '"Orbitron", monospace',
          fontSize: '11px',
          fontStyle: '700',
          color: '#ffffff',
          stroke: '#000',
          strokeThickness: 2
        }).setOrigin(0.5).setDepth(DEPTH_BUTTONS + 1);

        rect.on('pointerover', () => rect.setFillStyle(0xff8800, 0.95));
        rect.on('pointerout', () => {
          rect.setFillStyle(baseColor, 0.95);
          txt.setColor('#ffffff');
        });
        rect.on('pointerdown', () => {
          rect.setFillStyle(0xffffff, 0.95);
          txt.setColor('#000');
          this.onButton(label);
          this.time.delayedCall(80, () => {
            rect.setFillStyle(baseColor, 0.95);
            txt.setColor('#ffffff');
          });
        });
      });
    });
  }

  buttonColor(label) {
    if (label === '=') return 0xcc0000;
    if (['+', '-', '*', '/', '%'].includes(label)) return 0xff6600;
    if (label === 'C' || label === 'CE') return 0x444466;
    if (label === '+/-') return 0x555577;
    return 0x222244;
  }

  onButton(label) {
    if (label === 'C') {
      this.applyValueChange(() => {
        this.current = '0';
        this.previous = null;
        this.operator = null;
        this.justComputed = false;
        this.afterOperator = false;
      });
      return;
    }

    if (label === 'CE') {
      if (this.justComputed || this.afterOperator) {
        this.current = '0';
        this.afterOperator = false;
        this.justComputed = false;
      } else if (this.current.length > 1 && !(this.current.length === 2 && this.current.startsWith('-'))) {
        this.current = this.current.slice(0, -1);
      } else {
        this.current = '0';
      }
      this.updateDisplaySilent();
      return;
    }

    if (label === '+/-') {
      if (this.current.startsWith('-')) this.current = this.current.slice(1);
      else if (this.current !== '0') this.current = '-' + this.current;
      this.afterOperator = false;
      this.updateDisplaySilent();
      return;
    }

    if (/^[0-9]$/.test(label)) {
      if (this.justComputed) {
        this.current = label;
        this.previous = null;
        this.operator = null;
        this.justComputed = false;
      } else if (this.afterOperator || this.current === '0') {
        this.current = label;
        this.afterOperator = false;
      } else if (this.current === '-0') {
        this.current = '-' + label;
        this.afterOperator = false;
      } else {
        this.current += label;
      }
      this.updateDisplaySilent();
      return;
    }

    if (label === '.') {
      if (this.justComputed) {
        this.current = '0.';
        this.previous = null;
        this.operator = null;
        this.justComputed = false;
      } else if (this.afterOperator) {
        this.current = '0.';
        this.afterOperator = false;
      } else if (!this.current.includes('.')) {
        this.current += '.';
      }
      this.updateDisplaySilent();
      return;
    }

    if (['+', '-', '*', '/', '%'].includes(label)) {
      if (this.previous !== null && this.operator !== null && !this.afterOperator) {
        this.applyValueChange(() => {
          this.compute();
          this.previous = parseFloat(this.current);
          this.operator = label;
          this.afterOperator = true;
          this.justComputed = false;
        });
      } else {
        this.previous = parseFloat(this.current);
        this.operator = label;
        this.afterOperator = true;
        this.justComputed = false;
        this.updateDisplaySilent();
      }
      return;
    }

    if (label === '=') {
      if (this.previous !== null && this.operator !== null) {
        this.applyValueChange(() => {
          this.compute();
          this.operator = null;
          this.previous = null;
          this.justComputed = true;
          this.afterOperator = false;
        });
      }
      return;
    }
  }

  compute() {
    if (this.previous === null || this.operator === null) return;
    const a = this.previous;
    const b = parseFloat(this.current);
    let result;
    switch (this.operator) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b === 0 ? NaN : a / b; break;
      case '%': result = b === 0 ? NaN : a % b; break;
      default: result = b;
    }
    this.current = formatNumber(result);
  }

  applyValueChange(mutate) {
    const oldBounds = this.digitText.getBounds();
    const oldText = this.digitText.text;

    mutate();

    this.explodeWord();
    if (oldText) {
      this.fireworkTrace(oldBounds, oldText.length);
    }

    this.digitText.setText(this.current);
    this.renderSpelledWord(this.spelledForCurrent());
    this.lastDisplay = this.current;
  }

  updateDisplaySilent() {
    this.digitText.setText(this.current);
    this.clearWordSprites();
    this.renderSpelledWord(this.spelledForCurrent());
    this.lastDisplay = this.current;
  }

  spelledForCurrent() {
    if (this.current === 'ERROR') return 'ERROR';
    if (this.current === '-0' || this.current === '-') return 'NEGATIVE ZERO';
    if (this.current.endsWith('.')) {
      return numberToWords(parseFloat(this.current)) + ' POINT';
    }
    const n = parseFloat(this.current);
    if (Number.isNaN(n)) return 'ERROR';
    return numberToWords(n);
  }

  clearWordSprites() {
    if (!this.wordSprites) {
      this.wordSprites = [];
      return;
    }
    for (const s of this.wordSprites) {
      s.destroy();
    }
    this.wordSprites = [];
  }

  renderSpelledWord(text) {
    this.clearWordSprites();
    if (!text) return;

    const maxLetters = Math.floor((this.viewW - 12) / LETTER_SLOT);
    const words = text.split(' ').filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? line + ' ' + word : word;
      if (candidate.length <= maxLetters) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        if (word.length > maxLetters) {
          for (let i = 0; i < word.length; i += maxLetters) {
            lines.push(word.slice(i, i + maxLetters));
          }
          line = '';
        } else {
          line = word;
        }
      }
    }
    if (line) lines.push(line);

    const shown = lines.slice(0, MAX_LINES);
    const totalH = shown.length * LINE_HEIGHT - LETTER_CELL;
    const startY = WORD_AREA_TOP + (WORD_AREA_HEIGHT - totalH) / 2;

    shown.forEach((ln, i) => {
      const lineWidth = ln.length * LETTER_SLOT - LETTER_GAP;
      const startX = (this.viewW - lineWidth) / 2;
      const y = startY + i * LINE_HEIGHT;
      for (let j = 0; j < ln.length; j++) {
        this.placeLetter(ln[j], startX + j * LETTER_SLOT, y);
      }
    });
  }

  placeLetter(ch, baseX, baseY) {
    const pat = LETTER_PATTERNS[ch] || LETTER_PATTERNS[ch.toUpperCase()];
    if (!pat) return;
    const scale = LETTER_CELL / BRICK_SOURCE_PX;
    for (let r = 0; r < pat.length; r++) {
      const line = pat[r];
      for (let c = 0; c < line.length; c++) {
        if (line[c] !== 'X') continue;
        const x = baseX + (c + 0.5) * LETTER_CELL;
        const y = baseY + (r + 0.5) * LETTER_CELL;
        const brick = this.add.image(x, y, BRICK_KEY, 'atlas_s0');
        brick.setScale(scale);
        brick.setDepth(DEPTH_WORD);
        this.wordSprites.push(brick);
      }
    }
  }

  explodeWord() {
    if (!this.wordSprites || this.wordSprites.length === 0) return;
    const sprites = this.wordSprites;
    this.wordSprites = [];
    for (const s of sprites) {
      const x = s.x;
      const y = s.y;
      s.destroy();
      const p = this.add.image(x, y, BRICK_PARTICLE_KEY, 'atlas_s0');
      p.setDepth(DEPTH_PARTICLES);
      const angle = Math.random() * Math.PI * 2;
      const speed = 28 + Math.random() * 42;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 40;
      this.tweens.add({
        targets: p,
        x: x + vx * 0.9,
        y: y + vy * 0.9 + 80,
        angle: 360 * (Math.random() > 0.5 ? 1 : -1),
        alpha: { from: 1, to: 0 },
        duration: 700,
        ease: 'Quad.In',
        onComplete: () => p.destroy()
      });
    }
  }

  fireworkTrace(bounds, charCount) {
    if (!bounds) return;
    const width = bounds.right - bounds.left;
    const cy = (bounds.top + bounds.bottom) / 2;
    const steps = Math.max(4, Math.min(12, charCount * 2));
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const x = bounds.left + t * width;
      const y = cy + (Math.random() - 0.5) * (bounds.bottom - bounds.top) * 0.6;
      this.time.delayedCall(i * 35, () => this.fireworkBurst(x, y));
    }
  }

  fireworkBurst(x, y) {
    const center = this.add.sprite(x, y, FIREWORK_KEY, 'atlas_s0');
    center.setDepth(DEPTH_FIREWORKS);
    center.setScale(0.8);
    center.play(FIREWORK_ANIM);
    this.tweens.add({
      targets: center,
      scale: { from: 0.6, to: 1.6 },
      alpha: { from: 1, to: 0 },
      duration: 420,
      ease: 'Quad.Out',
      onComplete: () => center.destroy()
    });

    const N = 6;
    for (let i = 0; i < N; i++) {
      const f = this.add.sprite(x, y, FIREWORK_KEY, 'atlas_s0');
      f.setDepth(DEPTH_FIREWORKS);
      f.setScale(0.6);
      f.play(FIREWORK_ANIM);
      const angle = (i / N) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 14 + Math.random() * 14;
      this.tweens.add({
        targets: f,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: { from: 1, to: 0 },
        scale: { from: 0.7, to: 1.2 },
        duration: 500,
        ease: 'Cubic.Out',
        onComplete: () => f.destroy()
      });
    }
  }
}
