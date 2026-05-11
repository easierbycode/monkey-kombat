const GLOBE_KEY = 'mario-globe';
const GOOFY_KEY = 'goofy-walk';
const GOOFY_JUMP_KEY = 'goofy-jump';
const BRICK_KEY = 'mario-brick';
const BRICK_PARTICLE_KEY = 'mario-brick-particle';
const BLOCK_KEY = 'mario-block';
const COIN_KEY = 'coin';

const GOOFY_WALK_ANIM = 'goofy-walk-loop';
const BLOCK_PULSE_ANIM = 'mario-block-pulse';
const COIN_SPIN_ANIM = 'mario-coin-spin';

const GLOBE_SCALE = 0.45;
const GOOFY_SCALE = 0.6;

const ANGULAR_SPEED_RAD_PER_SEC = 1.1;
const GLOBE_ROTATION_FACTOR = 0.25;

const CAMERA_ZOOM = 2.5;

const MESSAGE = "HAPPY MOTHER'S DAY";
const MESSAGE_ARC_DEG = 240;

const LETTER_CELL_SIZE = 4;
const LETTER_GRID_W = 3;
const LETTER_GRID_H = 5;
const BRICK_SOURCE_PX = 16;
const LETTER_RADIUS_OFFSET = 38;

const GOOFY_HEIGHT_PX = 24;

const JUMP_DURATION_SEC = 0.75;
const JUMP_PEAK_HEIGHT = 30;
const COLLISION_RADIUS_PX = 6;

const STATE_WALKING = 'walking';
const STATE_JUMPING = 'jumping';

const LETTER_PATTERNS = {
  'H': ['X.X', 'X.X', 'XXX', 'X.X', 'X.X'],
  'A': ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'],
  'P': ['XX.', 'X.X', 'XX.', 'X..', 'X..'],
  'Y': ['X.X', 'X.X', '.X.', '.X.', '.X.'],
  'M': ['X.X', 'X.X', 'X.X', 'X.X', 'X.X'],
  'O': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  'T': ['XXX', '.X.', '.X.', '.X.', '.X.'],
  'E': ['XXX', 'X..', 'XX.', 'X..', 'XXX'],
  'R': ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'],
  'S': ['.XX', 'X..', '.X.', '..X', 'XX.'],
  'D': ['XX.', 'X.X', 'X.X', 'X.X', 'XX.'],
  "'": ['.X.', '.X.', '...', '...', '...']
};

export default class Game21Goofy extends Phaser.Scene {
  constructor() {
    super({ key: 'Game21' });
  }

  preload() {
    this.load.atlas(GLOBE_KEY, './assets/mario-globe.png', './assets/mario-globe.json');
    this.load.atlas(GOOFY_KEY, './assets/goofy-walk.png', './assets/goofy-walk.json');
    this.load.atlas(GOOFY_JUMP_KEY, './assets/goofy-jump.png', './assets/goofy-jump.json');
    this.load.atlas(BRICK_KEY, './assets/mario-brick.png', './assets/mario-brick.json');
    this.load.atlas(BRICK_PARTICLE_KEY, './assets/mario-brick-particle.png', './assets/mario-brick-particle.json');
    this.load.atlas(BLOCK_KEY, './assets/mario-block.png', './assets/mario-block.json');
    this.load.atlas(COIN_KEY, './assets/coin.png', './assets/coin.json');
  }

  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    this.cameras.main.setBackgroundColor('#1a2238');

    this.globe = this.physics.add.sprite(w / 2, h / 2, GLOBE_KEY, 'atlas_s0');
    this.globe.setScale(GLOBE_SCALE);
    this.globe.setDepth(1);

    this.globeRadius = (this.globe.width * GLOBE_SCALE) / 2;
    this.globe.body.setCircle(this.globe.width / 2);
    this.globe.body.setOffset(0, 0);
    this.globe.body.setImmovable(true);
    this.globe.body.setAllowGravity(false);

    this.createAnimations();

    this.goofy = this.add.sprite(0, 0, GOOFY_KEY, 'atlas_s0');
    this.goofy.setOrigin(0.5, 1);
    this.goofy.setScale(GOOFY_SCALE);
    this.goofy.setDepth(3);
    this.goofy.play(GOOFY_WALK_ANIM);

    this.goofyAngle = -Math.PI / 2;
    this.direction = 1;
    this.state = STATE_WALKING;
    this.jumpElapsed = 0;
    this.jumpRadius = this.globeRadius;

    this.collidables = [];
    this.createMessageArc();

    this.input.keyboard.on('keydown-LEFT', () => { if (this.state === STATE_WALKING) this.direction = -1; });
    this.input.keyboard.on('keydown-RIGHT', () => { if (this.state === STATE_WALKING) this.direction = 1; });
    this.input.keyboard.on('keydown-SPACE', () => this.startJump());
    this.input.on('pointerdown', () => this.startJump());

    this.positionGoofy();

    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.goofy, true, 0.12, 0.12);
    this.cameras.main.centerOn(this.goofy.x, this.goofy.y);
  }

  createAnimations() {
    if (!this.anims.exists(GOOFY_WALK_ANIM)) {
      this.anims.create({
        key: GOOFY_WALK_ANIM,
        frames: this.anims.generateFrameNames(GOOFY_KEY, { prefix: 'atlas_s', start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (!this.anims.exists(BLOCK_PULSE_ANIM)) {
      this.anims.create({
        key: BLOCK_PULSE_ANIM,
        frames: this.anims.generateFrameNames(BLOCK_KEY, { prefix: 'atlas_s', start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }
    if (!this.anims.exists(COIN_SPIN_ANIM)) {
      this.anims.create({
        key: COIN_SPIN_ANIM,
        frames: this.anims.generateFrameNames(COIN_KEY, { prefix: 'atlas_s', start: 0, end: 11 }),
        frameRate: 16,
        repeat: -1
      });
    }
  }

  createMessageArc() {
    const cx = this.globe.x;
    const cy = this.globe.y;
    const letterRadius = this.globeRadius + LETTER_RADIUS_OFFSET;

    const chars = MESSAGE.split('');
    const stepDeg = MESSAGE_ARC_DEG / (chars.length - 1);
    const startDeg = -90 - MESSAGE_ARC_DEG / 2;

    chars.forEach((char, i) => {
      const deg = startDeg + i * stepDeg;
      const rad = Phaser.Math.DegToRad(deg);
      const x = cx + Math.cos(rad) * letterRadius;
      const y = cy + Math.sin(rad) * letterRadius;
      const upright = rad + Math.PI / 2;

      const container = this.add.container(x, y);
      container.setDepth(2);
      container.setRotation(upright);

      this.buildLetter(container, char, x, y, upright);
    });
  }

  buildLetter(container, char, containerX, containerY, rotation) {
    if (char === ' ') {
      const block = this.add.sprite(0, 0, BLOCK_KEY, 'atlas_s0');
      block.setScale(LETTER_CELL_SIZE / BRICK_SOURCE_PX * 1.5);
      block.play(BLOCK_PULSE_ANIM);
      container.add(block);
      this.collidables.push({
        type: 'block',
        worldX: containerX,
        worldY: containerY,
        sprite: block,
        container,
        consumed: false
      });
      return;
    }

    const pattern = LETTER_PATTERNS[char];
    if (!pattern) {
      return;
    }

    const brickScale = LETTER_CELL_SIZE / BRICK_SOURCE_PX;
    const colCenter = (LETTER_GRID_W - 1) / 2;
    const rowCenter = (LETTER_GRID_H - 1) / 2;
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    for (let row = 0; row < pattern.length; row++) {
      const line = pattern[row];
      for (let col = 0; col < line.length; col++) {
        if (line[col] !== 'X') {
          continue;
        }
        const localX = (col - colCenter) * LETTER_CELL_SIZE;
        const localY = (row - rowCenter) * LETTER_CELL_SIZE;
        const brick = this.add.image(localX, localY, BRICK_KEY, 'atlas_s0');
        brick.setScale(brickScale);
        container.add(brick);

        const worldX = containerX + localX * cosR - localY * sinR;
        const worldY = containerY + localX * sinR + localY * cosR;
        this.collidables.push({
          type: 'brick',
          worldX,
          worldY,
          sprite: brick,
          container,
          consumed: false
        });
      }
    }

    if (char === 'M') {
      this.addMDiagonals(container, containerX, containerY, cosR, sinR);
    }
  }

  addMDiagonals(container, containerX, containerY, cosR, sinR) {
    const particleScale = LETTER_CELL_SIZE / 8;
    const diagonals = [
      { localX: -2.2, localY: -5.5, flipX: false },
      { localX: -1.0, localY: -2.5, flipX: false },
      { localX:  0.0, localY: -0.5, flipX: false },
      { localX:  1.0, localY: -2.5, flipX: true  },
      { localX:  2.2, localY: -5.5, flipX: true  }
    ];

    for (const d of diagonals) {
      const p = this.add.image(d.localX, d.localY, BRICK_PARTICLE_KEY, 'atlas_s0');
      p.setScale(particleScale);
      if (d.flipX) {
        p.setFlipX(true);
      }
      container.add(p);

      const worldX = containerX + d.localX * cosR - d.localY * sinR;
      const worldY = containerY + d.localX * sinR + d.localY * cosR;
      this.collidables.push({
        type: 'brick',
        worldX,
        worldY,
        sprite: p,
        container,
        consumed: false
      });
    }
  }

  startJump() {
    if (this.state !== STATE_WALKING) {
      return;
    }
    this.state = STATE_JUMPING;
    this.jumpElapsed = 0;
    this.goofy.anims.stop();
    this.goofy.setTexture(GOOFY_JUMP_KEY, 'atlas_s0');
  }

  endJump() {
    this.state = STATE_WALKING;
    this.jumpRadius = this.globeRadius;
    this.direction *= -1;
    this.goofy.setTexture(GOOFY_KEY, 'atlas_s0');
    this.goofy.play(GOOFY_WALK_ANIM);
  }

  update(_, deltaMs) {
    const dt = deltaMs / 1000;

    if (this.state === STATE_WALKING) {
      this.goofyAngle += this.direction * ANGULAR_SPEED_RAD_PER_SEC * dt;
    } else if (this.state === STATE_JUMPING) {
      this.jumpElapsed += dt;
      const t = this.jumpElapsed / JUMP_DURATION_SEC;
      if (t >= 1) {
        this.endJump();
      } else {
        this.jumpRadius = this.globeRadius + JUMP_PEAK_HEIGHT * Math.sin(Math.PI * t);
        this.checkLetterCollisions();
      }
    }

    if (this.globe) {
      const surfaceArc = ANGULAR_SPEED_RAD_PER_SEC * GLOBE_ROTATION_FACTOR * dt;
      this.globe.rotation -= this.direction * surfaceArc;
    }

    this.positionGoofy();
  }

  checkLetterCollisions() {
    const cx = this.globe.x;
    const cy = this.globe.y;
    const outwardX = Math.cos(this.goofyAngle);
    const outwardY = Math.sin(this.goofyAngle);
    const collisionR = this.jumpRadius + GOOFY_HEIGHT_PX * 0.7;
    const probeX = cx + outwardX * collisionR;
    const probeY = cy + outwardY * collisionR;
    const thresholdSq = COLLISION_RADIUS_PX * COLLISION_RADIUS_PX;

    for (const c of this.collidables) {
      if (c.consumed) continue;
      const dx = c.worldX - probeX;
      const dy = c.worldY - probeY;
      if (dx * dx + dy * dy < thresholdSq) {
        c.consumed = true;
        if (c.type === 'brick') {
          this.explodeBrick(c);
        } else if (c.type === 'block') {
          this.popBlock(c);
        }
      }
    }
  }

  explodeBrick(c) {
    c.sprite.setVisible(false);

    const N = 5;
    for (let i = 0; i < N; i++) {
      const p = this.add.image(c.worldX, c.worldY, BRICK_PARTICLE_KEY, 'atlas_s0');
      p.setScale(0.5);
      p.setDepth(5);
      const angle = (i / N) * Math.PI * 2 + Math.random() * 0.6;
      const speed = 24 + Math.random() * 28;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 30;
      this.tweens.add({
        targets: p,
        x: c.worldX + vx * 0.7,
        y: c.worldY + vy * 0.7 + 80,
        angle: 360 * (Math.random() > 0.5 ? 1 : -1),
        alpha: { from: 1, to: 0 },
        duration: 800,
        ease: 'Quad.In',
        onComplete: () => p.destroy()
      });
    }
  }

  popBlock(c) {
    const radialAngle = Math.atan2(c.worldY - this.globe.y, c.worldX - this.globe.x);
    const outX = Math.cos(radialAngle);
    const outY = Math.sin(radialAngle);

    this.tweens.add({
      targets: c.sprite,
      scaleX: c.sprite.scaleX * 1.2,
      scaleY: c.sprite.scaleY * 1.2,
      duration: 80,
      yoyo: true
    });

    const N = 4;
    for (let i = 0; i < N; i++) {
      const coin = this.add.sprite(c.worldX, c.worldY, COIN_KEY, 'atlas_s0');
      coin.setScale(0.6);
      coin.setDepth(6);
      coin.play(COIN_SPIN_ANIM);

      const spread = (i - (N - 1) / 2) * 0.35;
      const angle = radialAngle + spread;
      const dist = 22 + Math.random() * 10;
      const peakX = c.worldX + Math.cos(angle) * dist;
      const peakY = c.worldY + Math.sin(angle) * dist;

      this.tweens.add({
        targets: coin,
        x: peakX,
        y: peakY,
        duration: 350,
        ease: 'Quad.Out',
        onComplete: () => {
          this.tweens.add({
            targets: coin,
            x: peakX + outX * 18,
            y: peakY + outY * 18,
            alpha: 0,
            duration: 450,
            ease: 'Quad.In',
            onComplete: () => coin.destroy()
          });
        }
      });
    }
  }

  positionGoofy() {
    if (!this.goofy || !this.globe) {
      return;
    }
    const cx = this.globe.x;
    const cy = this.globe.y;
    const r = (this.state === STATE_JUMPING) ? this.jumpRadius : this.globeRadius;
    this.goofy.x = cx + Math.cos(this.goofyAngle) * r;
    this.goofy.y = cy + Math.sin(this.goofyAngle) * r;
    this.goofy.rotation = this.goofyAngle + Math.PI / 2;
    this.goofy.setFlipX(this.direction < 0);
  }
}
