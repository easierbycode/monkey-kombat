const GLOBE_KEY = 'mario-globe';
const GOOFY_KEY = 'goofy-walk';
const BRICK_KEY = 'mario-brick';
const BRICK_PARTICLE_KEY = 'mario-brick-particle';
const BLOCK_KEY = 'mario-block';

const GOOFY_WALK_ANIM = 'goofy-walk-loop';
const BLOCK_PULSE_ANIM = 'mario-block-pulse';

const GLOBE_SCALE = 0.45;
const GOOFY_SCALE = 0.6;
const TILE_SCALE = 0.4;

const ANGULAR_SPEED_RAD_PER_SEC = 1.1;
const GLOBE_ROTATION_FACTOR = 0.18;

const CAMERA_ZOOM = 2.5;

const MESSAGE = "HAPPY MOTHER'S DAY";
const MESSAGE_ARC_DEG = 240;

const FONT_KEY = 'font-mkii';
const FONT_CHAR_SIZE = 16;

export default class Game21Goofy extends Phaser.Scene {
  constructor() {
    super({ key: 'Game21' });
  }

  preload() {
    this.load.atlas(GLOBE_KEY, './assets/mario-globe.png', './assets/mario-globe.json');
    this.load.atlas(GOOFY_KEY, './assets/goofy-walk.png', './assets/goofy-walk.json');
    this.load.atlas(BRICK_KEY, './assets/mario-brick.png', './assets/mario-brick.json');
    this.load.atlas(BRICK_PARTICLE_KEY, './assets/mario-brick-particle.png', './assets/mario-brick-particle.json');
    this.load.atlas(BLOCK_KEY, './assets/mario-block.png', './assets/mario-block.json');
    this.load.image(FONT_KEY, 'https://assets.codepen.io/11817390/font-mkii.png');
  }

  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    this.cameras.main.setBackgroundColor('#1a2238');

    this.registerBitmapFont();

    this.globe = this.physics.add.sprite(w / 2, h / 2, GLOBE_KEY, 'atlas_s0');
    this.globe.setScale(GLOBE_SCALE);
    this.globe.setDepth(1);

    this.globeRadius = (this.globe.width * GLOBE_SCALE) / 2;
    this.globe.body.setCircle(this.globe.width / 2);
    this.globe.body.setOffset(0, 0);
    this.globe.body.setImmovable(true);
    this.globe.body.setAllowGravity(false);

    this.createAnimations();
    this.createMessageArc();

    this.goofy = this.add.sprite(0, 0, GOOFY_KEY, 'atlas_s0');
    this.goofy.setOrigin(0.5, 1);
    this.goofy.setScale(GOOFY_SCALE);
    this.goofy.setDepth(3);
    this.goofy.play(GOOFY_WALK_ANIM);

    this.goofyAngle = -Math.PI / 2;
    this.direction = 1;

    this.input.keyboard.on('keydown-LEFT', () => { this.direction = -1; });
    this.input.keyboard.on('keydown-RIGHT', () => { this.direction = 1; });

    this.positionGoofy();

    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.goofy, true, 0.08, 0.08);
  }

  registerBitmapFont() {
    if (this.cache.bitmapFont.exists(FONT_KEY)) {
      return;
    }
    const fontConfig = {
      image: FONT_KEY,
      height: FONT_CHAR_SIZE,
      width: FONT_CHAR_SIZE,
      chars: Phaser.GameObjects.RetroFont.TEXT_SET3
    };
    this.cache.bitmapFont.add(FONT_KEY, Phaser.GameObjects.RetroFont.Parse(this, fontConfig));
  }

  createAnimations() {
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
    if (!this.anims.exists(BLOCK_PULSE_ANIM)) {
      this.anims.create({
        key: BLOCK_PULSE_ANIM,
        frames: this.anims.generateFrameNames(BLOCK_KEY, {
          prefix: 'atlas_s',
          start: 0,
          end: 3
        }),
        frameRate: 6,
        repeat: -1
      });
    }
  }

  createMessageArc() {
    const cx = this.globe.x;
    const cy = this.globe.y;
    const tileRadius = this.globeRadius + 22;
    const textRadius = this.globeRadius + 32;

    const chars = MESSAGE.split('');
    const stepDeg = MESSAGE_ARC_DEG / (chars.length - 1);
    const startDeg = -90 - MESSAGE_ARC_DEG / 2;

    chars.forEach((char, i) => {
      const deg = startDeg + i * stepDeg;
      const rad = Phaser.Math.DegToRad(deg);
      const tileX = cx + Math.cos(rad) * tileRadius;
      const tileY = cy + Math.sin(rad) * tileRadius;
      const textX = cx + Math.cos(rad) * textRadius;
      const textY = cy + Math.sin(rad) * textRadius;
      const upright = rad + Math.PI / 2;

      const isBlank = char === ' ';
      const tileKey = isBlank ? BLOCK_KEY : BRICK_KEY;
      const tile = this.add.image(tileX, tileY, tileKey, 'atlas_s0');
      tile.setScale(TILE_SCALE);
      tile.setRotation(upright);
      tile.setDepth(2);

      if (isBlank) {
        tile.play(BLOCK_PULSE_ANIM);
      }

      if (!isBlank) {
        const text = this.add.bitmapText(textX, textY, FONT_KEY, char)
          .setOrigin(0.5)
          .setDepth(4)
          .setTint(0xffe066);
        text.setScale(0.5);
        text.setRotation(upright);
      }
    });
  }

  update(_, deltaMs) {
    const dt = deltaMs / 1000;
    this.goofyAngle += this.direction * ANGULAR_SPEED_RAD_PER_SEC * dt;

    if (this.globe) {
      const surfaceArc = ANGULAR_SPEED_RAD_PER_SEC * GLOBE_ROTATION_FACTOR * dt;
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
