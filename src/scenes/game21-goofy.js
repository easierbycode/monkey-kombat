const GLOBE_KEY = 'mario-globe';
const GOOFY_KEY = 'goofy-walk';
const GOOFY_WALK_ANIM = 'goofy-walk-loop';

const GLOBE_SCALE = 0.45;
const GOOFY_SCALE = 0.6;

const ANGULAR_SPEED_RAD_PER_SEC = 1.1;
const FRAMES_PER_REV = 12;

export default class Game21Goofy extends Phaser.Scene {
  constructor() {
    super({ key: 'Game21' });
  }

  preload() {
    this.load.atlas(GLOBE_KEY, './assets/mario-globe.png', './assets/mario-globe.json');
    this.load.atlas(GOOFY_KEY, './assets/goofy-walk.png', './assets/goofy-walk.json');
  }

  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    this.cameras.main.setBackgroundColor('#1a2238');

    this.globe = this.physics.add.sprite(w / 2, h / 2, GLOBE_KEY, 'atlas_s0');
    this.globe.setScale(GLOBE_SCALE);
    this.globe.setDepth(1);

    const radius = (this.globe.width * GLOBE_SCALE) / 2;
    this.globeRadius = radius;
    this.globe.body.setCircle(this.globe.width / 2);
    this.globe.body.setOffset(0, 0);
    this.globe.body.setImmovable(true);
    this.globe.body.setAllowGravity(false);

    if (!this.anims.exists(GOOFY_WALK_ANIM)) {
      this.anims.create({
        key: GOOFY_WALK_ANIM,
        frames: this.anims.generateFrameNames(GOOFY_KEY, {
          prefix: 'atlas_s',
          start: 0,
          end: 2
        }),
        frameRate: 8,
        repeat: -1
      });
    }

    this.goofy = this.add.sprite(0, 0, GOOFY_KEY, 'atlas_s0');
    this.goofy.setOrigin(0.5, 1);
    this.goofy.setScale(GOOFY_SCALE);
    this.goofy.setDepth(2);
    this.goofy.play(GOOFY_WALK_ANIM);

    this.goofyAngle = -Math.PI / 2;
    this.direction = 1;

    this.input.keyboard.on('keydown-LEFT', () => { this.direction = -1; });
    this.input.keyboard.on('keydown-RIGHT', () => { this.direction = 1; });

    this.positionGoofy();
  }

  update(_, deltaMs) {
    const dt = deltaMs / 1000;
    this.goofyAngle += this.direction * ANGULAR_SPEED_RAD_PER_SEC * dt;

    if (this.globe) {
      const surfaceArc = ANGULAR_SPEED_RAD_PER_SEC * dt;
      this.globe.rotation -= this.direction * surfaceArc;
    }

    this.positionGoofy();
  }

  positionGoofy() {
    if (!this.goofy || !this.globe) {
      return;
    }
    const cx = this.globe.x;
    const cy = this.globe.y;
    const r = this.globeRadius;
    this.goofy.x = cx + Math.cos(this.goofyAngle) * r;
    this.goofy.y = cy + Math.sin(this.goofyAngle) * r;
    this.goofy.rotation = this.goofyAngle + Math.PI / 2;
    this.goofy.setFlipX(this.direction < 0);
  }
}
