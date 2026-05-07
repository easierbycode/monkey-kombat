import Monkey from '../sprites/monkey.js';

const ENVY_IDLE_KEY = 'envy-idle';
const ENVY_WALK_KEY = 'envy-walk';
const ENVY_KICK_KEY = 'envy-kick';

const ENVY_IDLE_ANIM = 'envy-idle-loop';
const ENVY_WALK_ANIM = 'envy-walk-loop';
const ENVY_KICK_ANIM = 'envy-kick-loop';

const IDLE_DURATION_MS = 3500;
const GAP_FROM_MONKEY = 4;
const WALK_SPEED_PX_PER_SEC = 50;

const KICK_INITIAL_FRAMERATE = 8;
const KICK_FRAMERATE_INCREMENT = 1;
const KICK_DAMAGE_PER_CYCLE = 1;

const MONKEY_START_HP = 99;

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game20' });
  }

  preload() {
    this.load.atlas(ENVY_IDLE_KEY, './assets/envy-idle.png', './assets/envy-idle.json');
    this.load.atlas(ENVY_WALK_KEY, './assets/envy-walk.png', './assets/envy-walk.json');
    this.load.atlas(ENVY_KICK_KEY, './assets/envy-kick.png', './assets/envy-kick.json');

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
    this.kicking = false;
    this.monkeyDestroyed = false;
    this.kickFrameRate = KICK_INITIAL_FRAMERATE;

    this.createAnimations();
    this.createMonkey();
    this.createEnvy();
    this.createHpText();

    this.time.delayedCall(IDLE_DURATION_MS, () => this.startWalking());

    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
  }

  createAnimations() {
    const ensureAnim = (config) => {
      if (!this.anims.exists(config.key)) {
        this.anims.create(config);
      }
    };

    ensureAnim({
      key: ENVY_IDLE_ANIM,
      frames: this.anims.generateFrameNames(ENVY_IDLE_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 3
      }),
      frameRate: 6,
      repeat: -1
    });

    ensureAnim({
      key: ENVY_WALK_ANIM,
      frames: this.anims.generateFrameNames(ENVY_WALK_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 5
      }),
      frameRate: 12,
      repeat: -1
    });

    ensureAnim({
      key: ENVY_KICK_ANIM,
      frames: this.anims.generateFrameNames(ENVY_KICK_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 7
      }),
      frameRate: KICK_INITIAL_FRAMERATE,
      repeat: -1
    });
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
    this.monkey.health = MONKEY_START_HP;
    this.monkey.setDepth(2);
    this.monkey.body.setAllowGravity(false);
    this.monkey.body.setImmovable(true);

    if (typeof this.monkey.enableFilters === 'function') {
      this.monkey.enableFilters();
      const filters = this.monkey.filters?.external;
      if (filters && typeof filters.addBarrel === 'function') {
        this.monkeyBarrel = filters.addBarrel(1);
      }
      if (filters && typeof filters.addBokeh === 'function') {
        this.monkeyBokeh = filters.addBokeh(0, 1, 0.5);
      }
    }
  }

  createEnvy() {
    const gameHeight = this.game.config.height;

    this.envy = this.physics.add.sprite(0, gameHeight, ENVY_IDLE_KEY, 'atlas_s0');
    this.envy.setOrigin(0.5, 1);

    const envyScale = (this.monkey.displayHeight * 0.95) / this.envy.height;
    this.envy.setScale(envyScale);
    this.envy.setDepth(3);
    this.envy.setX(this.envy.displayWidth / 2 + 4);

    this.envy.body.setAllowGravity(false);
    this.envy.body.setImmovable(true);

    this.envy.play(ENVY_IDLE_ANIM);
  }

  createHpText() {
    this.hpText = this.add.text(8, 8, this.formatHp(), {
      font: '16px monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.hpText.setDepth(10);
  }

  formatHp() {
    const hp = Math.max(0, this.monkey?.health ?? 0);
    return `MONKEY HP: ${hp}`;
  }

  refreshHpText() {
    if (this.hpText) {
      this.hpText.setText(this.formatHp());
    }
  }

  computeEnvyTargetX() {
    const monkeyLeftEdge = this.monkey.x - (this.monkey.displayWidth * this.monkey.originX);
    const envyRightWidth = this.envy.displayWidth * (1 - this.envy.originX);
    return monkeyLeftEdge - GAP_FROM_MONKEY - envyRightWidth;
  }

  startWalking() {
    if (!this.envy || !this.envy.active || this.monkeyDestroyed) {
      return;
    }

    this.envy.play(ENVY_WALK_ANIM);

    const targetX = this.computeEnvyTargetX();
    const distance = Math.max(0, targetX - this.envy.x);
    const duration = (distance / WALK_SPEED_PX_PER_SEC) * 1000;

    this.walkTween = this.tweens.add({
      targets: this.envy,
      x: targetX,
      duration,
      ease: 'Linear',
      onComplete: () => this.startKicking()
    });

    this.kickOverlap = this.physics.add.overlap(
      this.envy,
      this.monkey,
      () => this.startKicking(),
      null,
      this
    );
  }

  startKicking() {
    if (this.kicking || this.monkeyDestroyed) {
      return;
    }
    this.kicking = true;

    if (this.walkTween) {
      this.walkTween.stop();
      this.walkTween = null;
    }
    if (this.kickOverlap) {
      this.physics.world.removeCollider(this.kickOverlap);
      this.kickOverlap = null;
    }

    const targetX = this.computeEnvyTargetX();
    this.envy.x = Math.min(this.envy.x, targetX);

    this.envy.play(ENVY_KICK_ANIM);
    this.envy.on(Phaser.Animations.Events.ANIMATION_REPEAT, this.onKickCycle, this);
  }

  pulseMonkeyBokeh() {
    if (!this.monkeyBokeh) {
      return;
    }

    if (this.bokehTween) {
      this.bokehTween.stop();
      this.bokehTween = null;
    }

    this.monkeyBokeh.radius = 0;
    this.bokehTween = this.tweens.add({
      targets: this.monkeyBokeh,
      radius: 6,
      duration: 110,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.monkeyBokeh) {
          this.monkeyBokeh.radius = 0;
        }
        this.bokehTween = null;
      }
    });
  }

  pulseMonkeyBarrel() {
    if (!this.monkeyBarrel) {
      return;
    }

    if (this.barrelTween) {
      this.barrelTween.stop();
      this.barrelTween = null;
    }

    this.monkeyBarrel.amount = 1;
    this.barrelTween = this.tweens.add({
      targets: this.monkeyBarrel,
      amount: 1.5,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (this.monkeyBarrel) {
          this.monkeyBarrel.amount = 1;
        }
        this.barrelTween = null;
      }
    });
  }

  spawnKickBloodSplat() {
    if (!this.monkey || !this.monkey.active) {
      return;
    }

    const splatX = this.monkey.x;
    const splatY = this.monkey.y - (this.monkey.displayHeight * 0.55);

    const emitter = this.add.particles(splatX, splatY, 'blood', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      lifespan: { min: 350, max: 650 },
      gravityY: 300,
      speedY: { min: 40, max: 120 },
      speedX: { min: -90, max: 90 },
      scale: { start: 0.8, end: 0 },
      emitting: false
    });

    emitter.explode(10, splatX, splatY);

    this.time.delayedCall(900, () => {
      if (emitter && typeof emitter.destroy === 'function') {
        emitter.destroy();
      }
    });
  }

  onKickCycle() {
    if (this.monkeyDestroyed || !this.monkey || !this.monkey.active) {
      return;
    }

    this.cameras.main?.shake(80, 0.006);
    this.spawnKickBloodSplat();
    this.pulseMonkeyBarrel();
    this.pulseMonkeyBokeh();

    const isDead = this.monkey.damage({ damagePoints: KICK_DAMAGE_PER_CYCLE });
    this.refreshHpText();

    if (isDead) {
      this.killMonkey();
      return;
    }

    this.kickFrameRate += KICK_FRAMERATE_INCREMENT;
    if (this.envy?.anims) {
      this.envy.anims.timeScale = this.kickFrameRate / KICK_INITIAL_FRAMERATE;
    }
  }

  killMonkey() {
    if (this.monkeyDestroyed) {
      return;
    }
    this.monkeyDestroyed = true;

    this.envy.off(Phaser.Animations.Events.ANIMATION_REPEAT, this.onKickCycle, this);
    this.envy.stop();
    this.envy.setFrame('atlas_s0');

    this.refreshHpText();
    document.dispatchEvent(new CustomEvent('enemy-defeated'));
  }

  cleanup() {
    this.walkTween?.stop();
    this.walkTween = null;
    if (this.kickOverlap) {
      this.physics.world?.removeCollider(this.kickOverlap);
      this.kickOverlap = null;
    }
    if (this.envy) {
      this.envy.off(Phaser.Animations.Events.ANIMATION_REPEAT, this.onKickCycle, this);
    }
  }
}
