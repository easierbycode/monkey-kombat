import Monkey from '../sprites/monkey.js';

const RED_ATLAS_KEY = 'red-walk-right';
const WALK_ANIM_KEY = 'pokemon-red-walk';
const EXPLOSION_FLASH_FRAME = 'muzzleflash2';
const BLOOD_SPLAT_ANIM = 'bloodSplatter';
const BLOOD_PUDDLE_ANIM = 'bloodPuddle';
const BLOOD_PUDDLE_GROUND_OFFSET = 83;

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

    this.load.spritesheet('bloodPuddle', './assets/blood-puddle.png', {
      frameWidth: 185,
      frameHeight: 187,
      endFrame: 4
    });

    this.load.spritesheet('bloodSplat', './assets/blood-splat.png', {
      frameWidth: 158,
      frameHeight: 176,
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
    this.monkeyHeight = this.monkey.displayHeight;
    this.pokeballThrown = false;
    this.activePokeball = null;
    this.monkeySpinSprite = null;
    this.monkeyCaptureScale = this.monkey.scaleX;
    this.captureTween = null;
    this.explosionFlash = null;
    this.bloodEffectsActive = false;
    this.bloodSplatSprite = null;
    this.bloodPuddleSprite = null;
    this.bloodSource = null;
    this.bloodSplatAnchor = null;
    this.bloodPuddleAnchor = null;
    this.pokeballFlipTween = null;
    this.pokeballBaseScaleX = null;
    this.pokeballBaseScaleY = null;
    this.pokeballDropped = false;

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

    if (!this.anims.exists(BLOOD_SPLAT_ANIM)) {
      this.anims.create({
        key: BLOOD_SPLAT_ANIM,
        frames: this.anims.generateFrameNumbers('bloodSplat', {
          start: 0,
          end: 9
        }),
        frameRate: 45,
        repeat: 0
      });
    }

    if (!this.anims.exists(BLOOD_PUDDLE_ANIM)) {
      this.anims.create({
        key: BLOOD_PUDDLE_ANIM,
        frames: this.anims.generateFrameNumbers('bloodPuddle', {
          start: 0,
          end: 4
        }),
        frameRate: 20,
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
    pokeball._baseScaleX = pokeball.scaleX;
    pokeball._baseScaleY = pokeball.scaleY;

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
            this.onPokeballImpact(pokeball);
          }
        });
      }
    });
  }

  onPokeballImpact(pokeball) {
    if (!pokeball || !pokeball.active || !this.monkey) {
      return;
    }

    const hoverX = this.monkey.x - (this.monkey.displayWidth * 0.25);
    const hoverY = this.monkey.y - this.monkey.displayHeight - 20;
    const bounceX = hoverX + 45;
    const bounceY = hoverY - 70;

    this.tweens.add({
      targets: pokeball,
      x: bounceX,
      y: bounceY,
      duration: 200,
      ease: 'Quad.out',
      onComplete: () => {
        this.tweens.add({
          targets: pokeball,
          x: hoverX,
          y: hoverY,
          duration: 220,
          ease: 'Quad.inOut',
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
    this.pokeballBaseScaleX = pokeball._baseScaleX ?? pokeball.scaleX;
    this.pokeballBaseScaleY = pokeball._baseScaleY ?? pokeball.scaleY;

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

    const originalOriginX = this.monkey.originX;
    const originalOriginY = this.monkey.originY;

    const alignMonkeyToCenter = () => {
      if (this.monkey && this.monkey.active) {
        this.monkey.setOrigin(0.5, 0.5);
      }
    };

    alignMonkeyToCenter();
    this.time.delayedCall(16, alignMonkeyToCenter);

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
        if (this.monkey && this.monkey.active) {
          this.monkey.setOrigin(originalOriginX, originalOriginY);
        }
        this.spawnBloodEffectsOnRed();
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
    const spinTargetHeight = this.getEffectTargetHeight();
    const spinScale = spinTargetHeight / this.monkeySpinSprite.height;
    this.monkeySpinSprite.setScale(spinScale);
    const spinDepth = (this.monkey.depth || 1) + 1;
    this.monkeySpinSprite.setDepth(spinDepth);
    pokeball.setDepth(spinDepth + 1);
    this.monkeySpinSprite.play('monkey-spin');
    this.startPokeballFlipTween(pokeball);

    this.time.delayedCall(2500, () => this.finishMonkeyCapture());
  }

  finishMonkeyCapture() {
    this.stopPokeballFlipTween();

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
      document.dispatchEvent(new CustomEvent('enemy-defeated'));
    }

    this.fadeOutBloodEffects();
    this.dropPokeballToGround();
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

  spawnBloodEffectsOnRed() {
    if (this.bloodEffectsActive) {
      return;
    }

    const source = this.activePokeball || this.red;
    if (!source) {
      return;
    }

    this.bloodEffectsActive = true;
    this.bloodSource = source;

    const halfHeight = source.displayHeight * 0.5;
    const monkeyCenter = this.getMonkeyCenter();
    const effectHeight = this.getEffectTargetHeight();

    const splatX = monkeyCenter?.x ?? source.x;
    const splatY = monkeyCenter?.y ?? (source.y - halfHeight - 10);
    this.bloodSplatAnchor = { x: splatX, y: splatY };
    this.bloodSplatSprite = this.add.sprite(splatX, splatY, 'bloodSplat', 0);
    this.bloodSplatSprite.setOrigin(1, 0);
    const bloodSplatScale = effectHeight / this.bloodSplatSprite.height;
    this.bloodSplatSprite.setScale(bloodSplatScale);
    this.bloodSplatSprite.setDepth((source.depth || 1) + 1);
    this.bloodSplatSprite.once('animationcomplete', () => this.playBloodPuddle());
    this.bloodSplatSprite.play(BLOOD_SPLAT_ANIM);

    const puddleGroundY = this.getPuddleGroundY();
    const puddleX = (monkeyCenter?.x ?? source.x) - ((this.monkey?.displayWidth || 0) * 0.5);
    const puddleY = puddleGroundY ?? (source.y + halfHeight);
    this.bloodPuddleAnchor = { x: puddleX, y: puddleY };
  }

  fadeOutBloodEffects() {
    const fadeSprite = (sprite) => {
      if (!sprite || !sprite.active) {
        return;
      }
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        duration: 400,
        ease: 'Quad.in',
        onComplete: () => sprite.destroy()
      });
    };

    fadeSprite(this.bloodSplatSprite);
    fadeSprite(this.bloodPuddleSprite);

    this.bloodEffectsActive = false;
    this.bloodSplatSprite = null;
    this.bloodPuddleSprite = null;
    this.bloodSource = null;
    this.bloodSplatAnchor = null;
    this.bloodPuddleAnchor = null;
  }

  dropPokeballToGround() {
    const pokeball = this.activePokeball;
    if (!pokeball || !pokeball.active || this.pokeballDropped) {
      return;
    }

    this.pokeballDropped = true;
    this.resetPokeballScale();
    const groundY = this.game.config.height - (pokeball.displayHeight * 0.5);

    this.tweens.add({
      targets: pokeball,
      y: groundY,
      duration: 500,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.tweens.add({
          targets: pokeball,
          y: groundY - 15,
          duration: 200,
          yoyo: true,
          ease: 'Quad.out',
          onComplete: () => this.rollPokeballLeft(groundY)
        });
      }
    });
  }

  rollPokeballLeft(groundY) {
    const pokeball = this.activePokeball;
    if (!pokeball || !pokeball.active) {
      return;
    }

    this.tweens.add({
      targets: pokeball,
      x: pokeball.x - 100,
      angle: pokeball.angle - 360,
      y: groundY,
      duration: 900,
      ease: 'Sine.easeOut'
    });
  }

  computeRedTargetX() {
    const monkeyOriginOffset = this.monkey.displayWidth * this.monkey.originX;
    const monkeyLeftEdge = this.monkey.x - monkeyOriginOffset;
    const redOriginOffset = this.red.displayWidth * this.red.originX;
    return monkeyLeftEdge - 20 - redOriginOffset;
  }

  getMonkeyCenter() {
    if (!this.monkey) {
      return null;
    }

    const centerX = this.monkey.x;
    const centerY = this.monkey.y - (this.monkey.displayHeight * (this.monkey.originY - 0.5));
    return { x: centerX, y: centerY };
  }

  getPuddleGroundY() {
    const height = this.game?.config?.height;
    if (typeof height !== 'number') {
      return null;
    }
    return height - BLOOD_PUDDLE_GROUND_OFFSET;
  }

  getEffectTargetHeight() {
    if (this.activePokeball && this.activePokeball.displayHeight) {
      return this.activePokeball.displayHeight;
    }
    return this.monkeyHeight;
  }

  startPokeballFlipTween(pokeball) {
    this.stopPokeballFlipTween();
    if (!pokeball || !pokeball.active) {
      return;
    }

    pokeball.setScale(Math.abs(pokeball.scaleX), pokeball.scaleY);
    this.pokeballFlipTween = this.tweens.add({
      targets: pokeball,
      scaleX: -Math.abs(pokeball.scaleX),
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Linear'
    });
  }

  stopPokeballFlipTween() {
    if (this.pokeballFlipTween) {
      this.pokeballFlipTween.stop();
      this.pokeballFlipTween.remove();
      this.pokeballFlipTween = null;
    }

    if (this.activePokeball && this.activePokeball.active) {
      this.resetPokeballScale();
    }
  }

  resetPokeballScale() {
    if (!this.activePokeball || !this.activePokeball.active) {
      return;
    }

    const baseX = this.pokeballBaseScaleX ?? this.activePokeball._baseScaleX ?? Math.abs(this.activePokeball.scaleX);
    const baseY = this.pokeballBaseScaleY ?? this.activePokeball._baseScaleY ?? this.activePokeball.scaleY;
    this.activePokeball.setScale(baseX, baseY);
  }

  playBloodPuddle() {
    if (this.bloodPuddleSprite || !this.bloodEffectsActive) {
      return;
    }

    const source = this.activePokeball || this.bloodSource || this.red;
    const puddleGroundY = this.getPuddleGroundY();
    const puddleX = this.bloodPuddleAnchor?.x ?? source?.x ?? 0;
    const puddleY = this.bloodPuddleAnchor?.y ?? puddleGroundY ?? (source?.y ?? 0);

    this.bloodPuddleSprite = this.add.sprite(puddleX, puddleY, 'bloodPuddle', 0);
    this.bloodPuddleSprite.setOrigin(0.5, 0.5);
    const effectHeight = this.getEffectTargetHeight();
    const bloodPuddleScale = effectHeight / this.bloodPuddleSprite.height;
    this.bloodPuddleSprite.setScale(bloodPuddleScale);
    this.bloodPuddleSprite.setDepth(source?.depth || 1);
    this.bloodPuddleSprite.play(BLOOD_PUDDLE_ANIM);
  }

  updateBloodEffectPositions() {
    if (!this.bloodEffectsActive) {
      return;
    }

    const source = this.activePokeball || this.bloodSource || this.red;
    if (!source) {
      return;
    }

    const halfHeight = source.displayHeight * 0.5;
    const puddleGroundY = this.getPuddleGroundY();

    if (this.bloodSplatSprite && this.bloodSplatSprite.active) {
      const splatX = this.bloodSplatAnchor?.x ?? source.x;
      const splatY = this.bloodSplatAnchor?.y ?? (source.y - halfHeight - 10);
      this.bloodSplatSprite.setPosition(splatX, splatY);
      this.bloodSplatSprite.setDepth((source.depth || 1) + 1);
    }

    if (this.bloodPuddleSprite && this.bloodPuddleSprite.active) {
      const puddleX = this.bloodPuddleAnchor?.x ?? source.x;
      const puddleY = this.bloodPuddleAnchor?.y ?? puddleGroundY ?? (source.y + halfHeight);
      this.bloodPuddleSprite.setPosition(puddleX, puddleY);
      this.bloodPuddleSprite.setDepth(source.depth || 1);
    }
  }

  update() {
    this.updateBloodEffectPositions();
  }
}
