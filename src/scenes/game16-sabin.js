import Monkey from '../sprites/monkey.js';

const SABIN_WALK_KEY = 'sabin-walk';
const SABIN_ATTACK_KEY = 'sabin-attack';
const SABIN_FISTS_KEY = 'sabin-fists';

const SABIN_WALK_ANIM = 'sabin-walk-loop';
const SABIN_ATTACK_ANIM = 'sabin-attack-loop';
const SABIN_FISTS_ANIM = 'sabin-fists-loop';

const IDLE_DURATION_MS = 3500;
const ATTACK_DURATION_MS = 2500;
const GAP_FROM_MONKEY = 6;

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game16' });
  }

  preload() {
    this.load.atlas(SABIN_WALK_KEY, './assets/sabin-walk.png', './assets/sabin-walk.json');
    this.load.atlas(SABIN_ATTACK_KEY, './assets/sabin-attack.png', './assets/sabin-attack.json');
    this.load.atlas(SABIN_FISTS_KEY, './assets/sabin-fists.png', './assets/sabin-fists.json');

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
    this.attackStarted = false;
    this.attackFinished = false;
    this.attackFlashEvent = null;

    this.createMonkey();
    this.createAnimations();
    this.createSabin();
    this.createFistsOverlay();

    this.walkSabinToMonkey();

    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
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
    this.monkey.setDepth(2);
  }

  createSabin() {
    const gameHeight = this.game.config.height;

    this.sabin = this.add.sprite(0, gameHeight, SABIN_WALK_KEY, 'atlas_s0');
    this.sabin.setOrigin(0.5, 1);
    const sabinScale = (this.monkey.displayHeight * 0.9) / this.sabin.height;
    this.sabin.setScale(sabinScale);
    this.sabin.setFlipX(true);
    this.sabin.setDepth(4);
    this.sabin.setX(-this.sabin.displayWidth);
  }

  createFistsOverlay() {
    this.sabinFists = this.add.sprite(0, 0, SABIN_FISTS_KEY, 'atlas_s0');
    this.sabinFists.setScale(this.sabin.scaleX);
    this.sabinFists.setOrigin(1, 0.5);
    this.sabinFists.setFlipX(true);
    this.sabinFists.setDepth(this.sabin.depth + 1);
    this.sabinFists.setVisible(false);
  }

  createAnimations() {
    const ensureAnim = (key, config) => {
      if (!this.anims.exists(key)) {
        this.anims.create(config);
      }
    };

    ensureAnim(SABIN_WALK_ANIM, {
      key: SABIN_WALK_ANIM,
      frames: this.anims.generateFrameNames(SABIN_WALK_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 2
      }),
      frameRate: 10,
      repeat: -1
    });

    ensureAnim(SABIN_ATTACK_ANIM, {
      key: SABIN_ATTACK_ANIM,
      frames: this.anims.generateFrameNames(SABIN_ATTACK_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 1
      }),
      frameRate: 12,
      repeat: -1
    });

    ensureAnim(SABIN_FISTS_ANIM, {
      key: SABIN_FISTS_ANIM,
      frames: this.anims.generateFrameNames(SABIN_FISTS_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 2
      }),
      frameRate: 14,
      repeat: -1
    });
  }

  computeSabinTargetX() {
    if (!this.monkey) {
      return 0;
    }

    const monkeyLeftEdge = this.monkey.x - (this.monkey.displayWidth * this.monkey.originX);
    const sabinRightWidth = this.sabin.displayWidth * (1 - this.sabin.originX);
    return monkeyLeftEdge - GAP_FROM_MONKEY - sabinRightWidth + 5;
  }

  walkSabinToMonkey() {
    if (!this.sabin || !this.monkey) {
      return;
    }

    const targetX = this.computeSabinTargetX();
    const distance = Math.abs(targetX - this.sabin.x);
    const duration = Math.max(900, distance * 5);

    this.sabin.play(SABIN_WALK_ANIM);
    this.walkTween = this.tweens.add({
      targets: this.sabin,
      x: targetX,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => this.startIdleHold()
    });
  }

  startIdleHold() {
    if (!this.sabin || this.attackStarted) {
      return;
    }

    this.sabin.stop();
    this.sabin.setFrame('atlas_s1');

    this.time.delayedCall(IDLE_DURATION_MS, () => this.startAttack());
  }

  startAttack() {
    if (this.attackStarted || this.attackFinished) {
      return;
    }
    this.attackStarted = true;

    this.sabin.play(SABIN_ATTACK_ANIM);
    this.startFistAnimation();
    this.startAttackCameraEffects();

    this.time.delayedCall(ATTACK_DURATION_MS, () => this.finishAttack());
  }

  startFistAnimation() {
    if (!this.sabinFists) {
      return;
    }

    this.positionFists();
    this.sabinFists.setVisible(true);
    this.sabinFists.play(SABIN_FISTS_ANIM);
  }

  startAttackCameraEffects() {
    const cam = this.cameras?.main;
    if (!cam) {
      return;
    }

    cam.shake(ATTACK_DURATION_MS, 0.0075, true);

    this.attackFlashEvent?.remove();
    this.attackFlashEvent = this.time.addEvent({
      delay: 220,
      callback: () => cam.flash(140, 255, 255, 255),
      callbackScope: this,
      repeat: Math.ceil(ATTACK_DURATION_MS / 220)
    });
  }

  finishAttack() {
    if (this.attackFinished) {
      return;
    }
    this.attackFinished = true;

    this.stopFistAnimation();
    this.stopAttackCameraEffects();

    if (this.monkey && this.monkey.active) {
      this.emitBonesAndMuscles(this.monkey.x, this.monkey.y);
      this.monkey.destroy();
      document.dispatchEvent(new CustomEvent('enemy-defeated'));
    }

    this.sabin.stop();
    this.sabin.setFrame('atlas_s1');
  }

  stopFistAnimation() {
    if (!this.sabinFists) {
      return;
    }
    this.sabinFists.anims.stop();
    this.sabinFists.setVisible(false);
  }

  stopAttackCameraEffects() {
    this.attackFlashEvent?.remove();
    this.attackFlashEvent = null;
  }

  emitBonesAndMuscles(emitX, emitY) {
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

    this.time.delayedCall(1200, () => {
      bones.destroy();
      muscles.destroy();
    });
  }

  positionFists() {
    if (!this.sabin || !this.sabinFists) {
      return;
    }

    const rightEdgeX = 21 + this.sabin.x + (this.sabin.displayWidth * (1 - this.sabin.originX));
    const midY = this.sabin.y - (this.sabin.displayHeight * 0.5);

    this.sabinFists.setPosition(rightEdgeX, midY);
  }

  update() {
    if (this.sabinFists && this.sabinFists.visible) {
      this.positionFists();
    }
  }

  cleanup() {
    this.stopAttackCameraEffects();
    this.walkTween?.stop();
  }
}
