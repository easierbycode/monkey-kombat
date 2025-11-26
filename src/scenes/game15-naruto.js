import Monkey from '../sprites/monkey.js';

const NARUTO_IDLE_KEY = 'naruto-idle';
const NARUTO_CHARGE_KEY = 'naruto-charge';
const NARUTO_SHOOT_KEY = 'naruto-shoot';
const NARUTO_SHURIKEN_KEY = 'naruto-shuriken';

const IDLE_ANIM = 'naruto-idle-loop';
const CHARGE_ANIM = 'naruto-charge-loop';
const SHOOT_ANIM = 'naruto-shoot-anim';
const SHURIKEN_SPIN_ANIM = 'naruto-shuriken-spin';

const CHARGE_DELAY_MS = 3500;
const CHARGE_DURATION_MS = 3000;
const CHARGE_FPS = 12;
const SHURIKEN_SPIN_FPS = 16;
const MONKEY_HEALTH = 5;
const SHURIKEN_STICK_MS = 2500;
const SHURIKEN_SPIN_ACCEL_SCALE = 3;

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game15' });
  }

  preload() {
    this.load.atlas(NARUTO_IDLE_KEY, './assets/naruto-idle.png', './assets/naruto-idle.json');
    this.load.atlas(NARUTO_CHARGE_KEY, './assets/naruto-charge.png', './assets/naruto-charge.json');
    this.load.atlas(NARUTO_SHOOT_KEY, './assets/naruto-shoot.png', './assets/naruto-shoot.json');
    this.load.atlas(NARUTO_SHURIKEN_KEY, './assets/naruto-shuriken.png', './assets/naruto-shuriken.json');

    this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
    this.load.image('monkey', './assets/monkey.png');
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
    this.chargeStarted = false;
    this.projectileLaunched = false;
    this.monkeyDefeated = false;
    this.pendingDamageEvents = [];
    this.shurikenImpactHandled = false;
    this.pokeballPartsEmitted = false;

    this.createMonkey();
    this.createAnimations();
    this.createNaruto();
    this.createChargeShuriken();

    this.time.delayedCall(CHARGE_DELAY_MS, () => this.startCharge());

    this.events.once('shutdown', () => this.cleanupDamageEvents());
    this.events.once('destroy', () => this.cleanupDamageEvents());
  }

  createMonkey() {
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;

    this.monkey = new Monkey({
      scene: this,
      x: gameWidth,
      y: gameHeight
    });

    this.monkey.x -= this.monkey.displayWidth / 2;
    this.monkey.health = MONKEY_HEALTH;
    this.monkey.setDepth(2);
  }

  createAnimations() {
    const ensureAnim = (key, config) => {
      if (!this.anims.exists(key)) {
        this.anims.create(config);
      }
    };

    ensureAnim(IDLE_ANIM, {
      key: IDLE_ANIM,
      frames: this.anims.generateFrameNames(NARUTO_IDLE_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 0
      }),
      frameRate: 1,
      repeat: -1
    });

    ensureAnim(CHARGE_ANIM, {
      key: CHARGE_ANIM,
      frames: this.anims.generateFrameNames(NARUTO_CHARGE_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 3
      }),
      frameRate: CHARGE_FPS,
      repeat: -1
    });

    ensureAnim(SHOOT_ANIM, {
      key: SHOOT_ANIM,
      frames: this.anims.generateFrameNames(NARUTO_SHOOT_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 2
      }),
      frameRate: 12,
      repeat: 0
    });

    ensureAnim(SHURIKEN_SPIN_ANIM, {
      key: SHURIKEN_SPIN_ANIM,
      frames: this.anims.generateFrameNames(NARUTO_SHURIKEN_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 2
      }),
      frameRate: SHURIKEN_SPIN_FPS,
      repeat: -1
    });
  }

  createNaruto() {
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;

    this.naruto = this.add.sprite(gameWidth * 0.25, gameHeight, NARUTO_IDLE_KEY, 'atlas_s0');
    this.naruto.setOrigin(0.5, 1);
    this.naruto.setScale(2);
    this.naruto.setDepth(5);
    this.naruto.play(IDLE_ANIM);
  }

  createChargeShuriken() {
    this.chargeShuriken = this.add.sprite(0, 0, NARUTO_SHURIKEN_KEY, 'atlas_s0');
    this.chargeShuriken.setScale(2);
    this.chargeShuriken.setVisible(false);
    this.chargeShuriken.setDepth(this.naruto.depth + 1);
  }

  startCharge() {
    if (this.chargeStarted) {
      return;
    }

    this.chargeStarted = true;
    this.naruto.play(CHARGE_ANIM);
    this.startChargeShurikenSpin();
    if (this.cameras?.main) {
      this.cameras.main.shake(CHARGE_DURATION_MS, 0.0035, true);
    }

    this.time.delayedCall(CHARGE_DURATION_MS, () => this.startShoot());
  }

  startChargeShurikenSpin() {
    this.positionChargeShuriken();
    this.chargeShuriken.setVisible(true);
    this.chargeShuriken.play(SHURIKEN_SPIN_ANIM);
  }

  positionChargeShuriken() {
    if (!this.chargeShuriken || !this.naruto) {
      return;
    }

    const offsetX = this.naruto.displayWidth * 0.35;
    const offsetY = this.naruto.displayHeight * 0.45;

    this.chargeShuriken.setPosition(
      this.naruto.x + offsetX,
      this.naruto.y - offsetY
    );
  }

  startShoot() {
    if (!this.naruto || !this.naruto.anims) {
      return;
    }

    this.chargeShuriken.setVisible(false);
    this.chargeShuriken.anims.stop();

    this.naruto.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
      if (anim && anim.key === SHOOT_ANIM) {
        this.fireShurikenProjectile();
      }
    });

    this.naruto.play(SHOOT_ANIM);
    if (this.cameras?.main) {
      this.cameras.main.flash(180, 255, 255, 255);
    }
  }

  fireShurikenProjectile() {
    if (this.projectileLaunched || !this.monkey || !this.monkey.active) {
      return;
    }

    const startX = this.naruto.x + (this.naruto.displayWidth * 0.35);
    const startY = this.naruto.y - (this.naruto.displayHeight * 0.45);

    this.shurikenProjectile = this.physics.add.sprite(startX, startY, NARUTO_SHURIKEN_KEY, 'atlas_s0');
    this.shurikenProjectile.setScale(2);
    this.shurikenProjectile.setDepth(this.naruto.depth + 1);
    this.shurikenProjectile.play(SHURIKEN_SPIN_ANIM);
    this.shurikenProjectile.body.setAllowGravity(false);

    const targetX = this.monkey.x - (this.monkey.displayWidth * 0.2);
    const targetY = this.monkey.y - (this.monkey.displayHeight * 0.6);
    const travelSpeed = 950;

    this.physics.moveTo(this.shurikenProjectile, targetX, targetY, travelSpeed);
    this.projectileLaunched = true;
  }

  onShurikenHit() {
    if (this.monkeyDefeated || this.shurikenImpactHandled) {
      return;
    }
    this.shurikenImpactHandled = true;

    if (this.shurikenProjectile) {
      this.shurikenProjectile.body?.stop();
      this.shurikenProjectile.body && (this.shurikenProjectile.body.enable = false);
      const alignedY = this.monkey.y - (this.monkey.displayHeight * 0.5);
      this.shurikenProjectile.setPosition(
        this.monkey.x - (this.monkey.displayWidth * 0.2),
        alignedY
      );
      this.shurikenProjectile.setDepth(this.monkey.depth + 3);
      this.shurikenProjectile.setActive(true);
      if (!this.shurikenProjectile.anims.isPlaying) {
        this.shurikenProjectile.play(SHURIKEN_SPIN_ANIM);
      }
      this.tweens.add({
        targets: this.shurikenProjectile.anims,
        timeScale: SHURIKEN_SPIN_ACCEL_SCALE,
        duration: SHURIKEN_STICK_MS,
        ease: 'Quad.easeIn'
      });
    }

    this.runMonkeyDamageSequence();
    this.startMonkeyHitSpin();
  }

  runMonkeyDamageSequence() {
    // Keep backward compatibility for callers; damage now handled in startMonkeyHitSpin
  }

  startMonkeyHitSpin() {
    if (!this.monkey || !this.monkey.active) {
      return;
    }

    const originalOriginX = this.monkey.originX;
    const originalOriginY = this.monkey.originY;
    const originalY = this.monkey.y;
    const centerAlignedY = originalY - (this.monkey.displayHeight * (originalOriginY - 0.5));
    this.monkey.setOrigin(0.5, 0.5);
    this.monkey.setY(centerAlignedY);

    const spinTween = this.tweens.add({
      targets: this.monkey,
      scaleY: -1,
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Ramp speed over stick duration
    this.tweens.add({
      targets: spinTween,
      timeScale: 4,
      duration: SHURIKEN_STICK_MS,
      ease: 'Quad.easeIn'
    });

    this.time.delayedCall(SHURIKEN_STICK_MS, () => {
      spinTween.stop();
      this.monkey.setScale(this.monkey.scaleX, 1);
       // restore origin/y before cleanup
      this.monkey.setOrigin(originalOriginX, originalOriginY);
      this.monkey.setY(originalY);

      if (this.shurikenProjectile) {
        this.shurikenProjectile.destroy();
        this.shurikenProjectile = null;
      }

      if (this.monkey && this.monkey.active && !this.monkeyDefeated) {
        this.monkeyDefeated = true;
        this.emitPokeballParts(originalY);
        this.monkey.safeExplode(this.monkey.muscles, 32);
        this.monkey.safeExplode(this.monkey.bones, 16);
        this.monkey.destroy();
        document.dispatchEvent(new CustomEvent('enemy-defeated'));
      }
    });
  }

  cleanupDamageEvents() {
    this.pendingDamageEvents.forEach((event) => {
      if (event && typeof event.remove === 'function') {
        event.remove();
      }
    });
    this.pendingDamageEvents = [];
  }

  update() {
    if (this.chargeShuriken.visible) {
      this.positionChargeShuriken();
    }

    if (this.shurikenProjectile && this.shurikenProjectile.active && this.monkey && this.monkey.active) {
      this.physics.overlap(this.shurikenProjectile, this.monkey, () => this.onShurikenHit());
    }

    if (this.shurikenProjectile && this.shurikenProjectile.active) {
      const { width, height } = this.game.config;
      const outOfBounds = this.shurikenProjectile.x > width + 200 || this.shurikenProjectile.y > height + 200;
      if (outOfBounds) {
        this.shurikenProjectile.destroy();
      }
    }
  }

  shutdown() {
    this.cleanupDamageEvents();
  }

  emitPokeballParts(groundY) {
    if (this.pokeballPartsEmitted) {
      return;
    }
    const source = this.monkey;
    if (!source || !source.active) {
      return;
    }

    this.pokeballPartsEmitted = true;
    const emitX = source.x;
    const emitY = groundY ?? source.y;

    const bones = this.add.particles(0, 0, 'bone', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7],
      speed: 900,
      lifespan: 900,
      gravityY: 1400,
      quantity: 16,
      scale: 2,
      rotate: { min: -180, max: 180 },
      emitting: false
    });
    bones.explode(16, emitX, emitY);

    const muscles = this.add.particles(0, 0, 'muscle', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7],
      speed: 1400,
      lifespan: 1000,
      gravityY: 1600,
      quantity: 24,
      scale: 2.5,
      rotate: { min: -180, max: 180 },
      emitting: false
    });
    muscles.explode(24, emitX, emitY);

    const cleanup = () => {
      bones.destroy();
      muscles.destroy();
    };
    this.time.delayedCall(1200, cleanup);
  }
}
