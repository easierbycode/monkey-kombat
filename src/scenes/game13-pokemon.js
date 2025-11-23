import Monkey from '../sprites/monkey.js';

const RED_ATLAS_KEY = 'red-walk-right';
const WALK_ANIM_KEY = 'pokemon-red-walk';
const EXPLOSION_FLASH_FRAME = 'muzzleflash2';

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game13' });
  }

  preload() {
    this.load.atlas(RED_ATLAS_KEY, './assets/red-walk-right.png', './assets/red-walk-right.json');
    this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
    this.load.atlas('spin', './assets/spin.png', './assets/spin.json');
    this.load.image('monkey', './assets/monkey.png');
    this.load.image('pokeball', './assets/pokeball.png');

    this.load.spritesheet('blood', './assets/blood.png', {
      frameWidth: 88,
      frameHeight: 71,
      endFrame: 9
    });

    this.load.spritesheet('bone', './assets/bone.png', {
      frameWidth: 18,
      frameHeight: 18
    });

    this.load.spritesheet('muscle', './assets/muscle.png', {
      frameWidth: 23,
      frameHeight: 22
    });
  }

  create() {
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;

    this.monkey = new Monkey({
      scene: this,
      x: gameWidth,
      y: gameHeight
    });
    this.monkey.x -= this.monkey.displayWidth / 2;
    this.pokeballThrown = false;
    this.activePokeball = null;
    this.monkeySpinSprite = null;
    this.monkeyCaptureScale = this.monkey.scaleX;
    this.captureTween = null;
    this.explosionFlash = null;

    this.createAnimations();

    this.red = this.add.sprite(0, gameHeight, RED_ATLAS_KEY, 'atlas_s0');
    this.red.setOrigin(0.5, 1);
    this.red.setScale(6);
    this.red.setDepth(2);
    this.red.setX(-this.red.displayWidth / 2);

    this.red.play(WALK_ANIM_KEY);

    const targetX = this.computeRedTargetX();
    const distance = Math.abs(targetX - this.red.x);
    const walkDuration = Math.max(800, distance * 6);

    this.tweens.add({
      targets: this.red,
      x: targetX,
      duration: walkDuration,
      ease: 'Linear',
      onComplete: () => {
        this.red.stop();
        this.red.setFrame('atlas_s1');
        this.time.delayedCall(750, () => this.throwPokeballAtMonkey());
      }
    });
  }

  createAnimations() {
    if (!this.anims.exists(WALK_ANIM_KEY)) {
      this.anims.create({
        key: WALK_ANIM_KEY,
        frames: this.anims.generateFrameNames(RED_ATLAS_KEY, {
          prefix: 'atlas_s',
          start: 0,
          end: 2
        }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!this.anims.exists('monkey-spin')) {
      this.anims.create({
        key: 'monkey-spin',
        frames: this.anims.generateFrameNames('spin', {
          prefix: 'spin_',
          start: 0,
          end: 5
        }),
        frameRate: 15,
        repeat: -1
      });
    }
  }

  throwPokeballAtMonkey() {
    if (this.pokeballThrown) {
      return;
    }
    if (!this.monkey || !this.monkey.active || !this.red) {
      return;
    }

    this.pokeballThrown = true;

    const startX = this.red.x + (this.red.displayWidth * 0.25);
    const startY = this.red.y - (this.red.displayHeight * 0.7);
    const targetX = this.monkey.x - (this.monkey.displayWidth * 0.25);
    const targetY = this.monkey.y;

    const pokeball = this.add.image(startX, startY, 'pokeball');
    pokeball.setOrigin(0.5, 0.5);
    pokeball.setScale(4);
    pokeball.setDepth(4);

    const apexX = Phaser.Math.Linear(startX, targetX, 0.5);
    const apexY = Math.min(startY, targetY) - 80;

    this.tweens.add({
      targets: pokeball,
      angle: 720,
      duration: 700,
      ease: 'Linear'
    });

    this.tweens.add({
      targets: pokeball,
      x: apexX,
      y: apexY,
      duration: 350,
      ease: 'Quad.out',
      onComplete: () => {
        if (!pokeball.active) {
          return;
        }
        this.tweens.add({
          targets: pokeball,
          x: targetX,
          y: targetY,
          duration: 350,
          ease: 'Quad.in',
          onComplete: () => {
            this.handlePokeballLanding(pokeball);
          }
        });
      }
    });
  }

  handlePokeballLanding(pokeball) {
    if (!pokeball || !pokeball.active) {
      return;
    }

    const monkeyDepth = typeof this.monkey.depth === 'number' ? this.monkey.depth : 1;
    pokeball.setDepth(monkeyDepth - 1);
    this.activePokeball = pokeball;

    this.time.delayedCall(750, () => this.captureMonkeyIntoPokeball());
  }

  captureMonkeyIntoPokeball() {
    const pokeball = this.activePokeball;
    if (!pokeball || !pokeball.active || !this.monkey || !this.monkey.active) {
      return;
    }

    this.monkeyCaptureScale = pokeball.displayWidth / this.monkey.width;

    if (this.captureTween && this.captureTween.isPlaying()) {
      this.captureTween.stop();
    }

    this.captureTween = this.tweens.add({
      targets: this.monkey,
      x: pokeball.x,
      y: pokeball.y,
      scaleX: this.monkeyCaptureScale,
      scaleY: this.monkeyCaptureScale,
      angle: this.monkey.angle + 540,
      duration: 1200,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.startMonkeySpinSequence();
      }
    });
  }

  startMonkeySpinSequence() {
    const pokeball = this.activePokeball;
    if (!pokeball || !pokeball.active) {
      return;
    }

    this.monkey.setVisible(false);
    this.monkey.setActive(false);

    if (this.monkeySpinSprite) {
      this.monkeySpinSprite.destroy();
      this.monkeySpinSprite = null;
    }

    this.monkeySpinSprite = this.add.sprite(pokeball.x, pokeball.y, 'spin', 'spin_0');
    const spinScale = pokeball.displayWidth / this.monkeySpinSprite.width;
    this.monkeySpinSprite.setScale(spinScale);
    this.monkeySpinSprite.setDepth((this.monkey.depth || 1) + 2);
    this.monkeySpinSprite.play('monkey-spin');

    this.time.delayedCall(2500, () => this.finishMonkeyCapture());
  }

  finishMonkeyCapture() {
    if (this.monkeySpinSprite) {
      this.monkeySpinSprite.stop();
      this.monkeySpinSprite.destroy();
      this.monkeySpinSprite = null;
    }

    if (this.monkey) {
      const pokeball = this.activePokeball;
      if (pokeball && pokeball.active) {
        this.monkey.x = pokeball.x;
        this.monkey.y = pokeball.y;
      }
      this.monkey.setScale(this.monkeyCaptureScale);
      this.monkey.setVisible(true);
      this.monkey.setActive(true);
      this.playExplosionFlash(this.monkey.x, this.monkey.y);
      this.monkey.destroy();
    }

    if (this.activePokeball) {
      this.activePokeball.destroy();
      this.activePokeball = null;
    }
  }

  playExplosionFlash(x, y) {
    if (!this.explosionFlash || !this.explosionFlash.active) {
      this.explosionFlash = this.add.particles(0, 0, 'explosion', {
        frame: EXPLOSION_FLASH_FRAME,
        lifespan: 200,
        scale: { start: 4, end: 0 },
        rotate: { start: 0, end: 180 },
        emitting: false
      });
    }

    const emitter = this.explosionFlash;
    emitter.setDepth((this.monkey?.depth || 1) + 1);
    emitter.explode(1, x, y);
  }

  computeRedTargetX() {
    const monkeyOriginOffset = this.monkey.displayWidth * this.monkey.originX;
    const monkeyLeftEdge = this.monkey.x - monkeyOriginOffset;
    const redOriginOffset = this.red.displayWidth * this.red.originX;
    return monkeyLeftEdge - 20 - redOriginOffset;
  }
}
