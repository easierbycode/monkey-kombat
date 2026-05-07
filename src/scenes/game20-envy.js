import Monkey from '../sprites/monkey.js';

const ENVY_IDLE_KEY = 'envy-idle';
const ENVY_WALK_KEY = 'envy-walk';
const ENVY_KICK_KEY = 'envy-kick';

const ENVY_IDLE_ANIM = 'envy-idle-loop';
const ENVY_WALK_ANIM = 'envy-walk-loop';
const ENVY_KICK_ANIM = 'envy-kick-once';

const IDLE_DURATION_MS = 3500;
const APPROACH_SPEED_PX_PER_SEC = 60;
const CHASE_BASE_SPEED_PX_PER_SEC = 130;
const CHASE_SPEED_INCREMENT = 22;
const WALK_REF_SPEED_PX_PER_SEC = 60;

const KICK_INITIAL_FRAMERATE = 10;
const KICK_FRAMERATE_INCREMENT = 1;

const KICK_BASE_DAMAGE = 1;
const KICK_DAMAGE_INCREMENT = 1;

const KICK_BASE_LAUNCH_VX = 240;
const KICK_BASE_LAUNCH_VY = -340;
const KICK_LAUNCH_VX_INCREMENT = 28;
const KICK_LAUNCH_VY_INCREMENT = 22;

const KICK_GRAVITY = 900;
const KICK_BOUNCE = 0.55;
const KICK_REACH_PX = 6;

const MONKEY_BODY_WIDTH_FRACTION = 0.45;

const FINISHER_EXTENDED_FRAME = 'atlas_s5';
const FINISHER_ADVANCE_FRAME = 'atlas_s6';
const FINISHER_DRAMATIC_HOLD_MS = 900;
const FINISHER_ADVANCE_HOLD_MS = 350;

const FINISH_HIM_TEXT = 'FINISH HIM';
const FINISH_HIM_CHAR_DELAY_MS = 100;
const FINISH_HIM_CHAR_DURATION_MS = 400;
const FINISH_HIM_POST_TEXT_HOLD_MS = 600;
const FINISH_HIM_CHAR_WIDTH = 16;
const FONT_KEY = 'font-mkii';

const MONKEY_START_HP = 99;

const STATE_IDLE = 'idle';
const STATE_APPROACH = 'approach';
const STATE_KICKING = 'kicking';
const STATE_CHASING = 'chasing';
const STATE_FINISH_HIM = 'finish-him';
const STATE_DONE = 'done';

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game20' });
  }

  preload() {
    this.load.atlas(ENVY_IDLE_KEY, './assets/envy-idle.png', './assets/envy-idle.json');
    this.load.atlas(ENVY_WALK_KEY, './assets/envy-walk.png', './assets/envy-walk.json');
    this.load.atlas(ENVY_KICK_KEY, './assets/envy-kick.png', './assets/envy-kick.json');

    this.load.image(FONT_KEY, 'https://assets.codepen.io/11817390/font-mkii.png');

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
    this.state = STATE_IDLE;
    this.monkeyDestroyed = false;
    this.kicksDelivered = 0;
    this.finishHimShown = false;

    this.registerBitmapFont();
    this.createAnimations();
    this.createMonkey();
    this.createEnvy();
    this.createHpText();

    this.physics.world.setBounds(0, 0, this.game.config.width, this.game.config.height);

    this.kickOverlap = this.physics.add.overlap(
      this.envy,
      this.monkey,
      () => this.onContact(),
      () => this.canKick(),
      this
    );

    this.time.delayedCall(IDLE_DURATION_MS, () => this.beginApproach());

    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
  }

  registerBitmapFont() {
    if (this.cache.bitmapFont.exists(FONT_KEY)) {
      return;
    }
    const fontConfig = {
      image: FONT_KEY,
      height: FINISH_HIM_CHAR_WIDTH,
      width: FINISH_HIM_CHAR_WIDTH,
      chars: Phaser.GameObjects.RetroFont.TEXT_SET3
    };
    this.cache.bitmapFont.add(FONT_KEY, Phaser.GameObjects.RetroFont.Parse(this, fontConfig));
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
      repeat: 0
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
    this.monkey.body.setImmovable(false);
    this.monkey.body.setCollideWorldBounds(true);
    this.monkey.body.setBounce(KICK_BOUNCE, KICK_BOUNCE);
    this.monkey.body.setDragX(60);

    const fullW = this.monkey.width;
    const fullH = this.monkey.height;
    const trimmedW = Math.max(2, Math.round(fullW * MONKEY_BODY_WIDTH_FRACTION));
    const offsetX = Math.round((fullW - trimmedW) / 2);
    this.monkey.body.setSize(trimmedW, fullH);
    this.monkey.body.setOffset(offsetX, 0);

    if (typeof this.monkey.enableFilters === 'function') {
      this.monkey.enableFilters();
      const filters = this.monkey.filters?.external;
      if (filters && typeof filters.addBarrel === 'function') {
        this.monkeyBarrel = filters.addBarrel(1);
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

    this.envy.on(`animationcomplete-${ENVY_KICK_ANIM}`, this.onKickAnimComplete, this);
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

  canKick() {
    return (this.state === STATE_APPROACH || this.state === STATE_CHASING)
      && !!this.monkey?.active
      && !!this.envy?.active;
  }

  currentChaseSpeed() {
    return CHASE_BASE_SPEED_PX_PER_SEC + this.kicksDelivered * CHASE_SPEED_INCREMENT;
  }

  currentKickFrameRate() {
    return KICK_INITIAL_FRAMERATE + this.kicksDelivered * KICK_FRAMERATE_INCREMENT;
  }

  currentKickDamage() {
    return KICK_BASE_DAMAGE + this.kicksDelivered * KICK_DAMAGE_INCREMENT;
  }

  currentLaunchVelocity() {
    return {
      vx: KICK_BASE_LAUNCH_VX + this.kicksDelivered * KICK_LAUNCH_VX_INCREMENT,
      vy: KICK_BASE_LAUNCH_VY - this.kicksDelivered * KICK_LAUNCH_VY_INCREMENT
    };
  }

  syncWalkAnimToSpeed(speed) {
    if (!this.envy?.anims) {
      return;
    }
    if (this.envy.anims.currentAnim?.key !== ENVY_WALK_ANIM) {
      this.envy.play(ENVY_WALK_ANIM);
    }
    this.envy.anims.timeScale = Math.max(0.5, speed / WALK_REF_SPEED_PX_PER_SEC);
  }

  beginApproach() {
    if (this.state !== STATE_IDLE || this.monkeyDestroyed) {
      return;
    }
    this.state = STATE_APPROACH;
    this.syncWalkAnimToSpeed(APPROACH_SPEED_PX_PER_SEC);
  }

  beginChase() {
    if (this.monkeyDestroyed) {
      return;
    }
    this.state = STATE_CHASING;
    this.syncWalkAnimToSpeed(this.currentChaseSpeed());
  }

  update() {
    if (!this.envy?.active) {
      return;
    }

    this.envy.y = this.game.config.height;

    if (this.state === STATE_APPROACH) {
      this.stepEnvyTowardMonkey(APPROACH_SPEED_PX_PER_SEC);
    } else if (this.state === STATE_CHASING) {
      this.stepEnvyTowardMonkey(this.currentChaseSpeed());
    }
  }

  stepEnvyTowardMonkey(speed) {
    if (!this.monkey?.active) {
      return;
    }
    const dt = this.game.loop.delta / 1000;
    const dx = this.monkey.x - this.envy.x;
    const sign = Math.sign(dx);
    const step = speed * dt;
    const distance = Math.abs(dx);

    if (distance <= KICK_REACH_PX) {
      return;
    }

    this.envy.x += sign * Math.min(step, distance - KICK_REACH_PX);
    this.envy.setFlipX(sign < 0);
  }

  onContact() {
    if (!this.canKick()) {
      return;
    }

    const willKill = (this.monkey.health - this.currentKickDamage()) <= 0;

    if (willKill && !this.finishHimShown) {
      this.beginFinishHim();
      return;
    }

    this.performKick();
  }

  performKick() {
    this.state = STATE_KICKING;

    this.envy.anims.timeScale = this.currentKickFrameRate() / KICK_INITIAL_FRAMERATE;
    this.envy.play(ENVY_KICK_ANIM);

    this.cameras.main?.shake(80, 0.006);
    this.cameras.main?.flash(40, 255, 240, 220, true);
    this.spawnKickBloodSplat();
    this.spawnSuzieBloodDrip();
    this.pulseMonkeyBarrel();
    this.hitStop();
    this.launchMonkey();

    this.monkey.damage({ damagePoints: this.currentKickDamage() });
    this.refreshHpText();

    this.kicksDelivered += 1;
  }

  onKickAnimComplete() {
    if (this.state !== STATE_KICKING) {
      return;
    }
    if (this.monkeyDestroyed) {
      this.envy.stop();
      this.envy.setFrame('atlas_s0');
      return;
    }
    this.beginChase();
  }

  launchMonkey() {
    if (!this.monkey?.active || !this.monkey.body) {
      return;
    }

    const dir = this.envy.x <= this.monkey.x ? 1 : -1;
    const { vx, vy } = this.currentLaunchVelocity();
    this.monkey.body.setAllowGravity(true);
    this.monkey.body.setGravityY(KICK_GRAVITY);
    this.monkey.body.setVelocity(dir * vx, vy);
  }

  beginFinishHim() {
    if (this.finishHimShown) {
      return;
    }
    this.finishHimShown = true;
    this.state = STATE_FINISH_HIM;

    this.envy.stop();
    this.envy.setFrame('atlas_s0');

    if (this.monkey?.body) {
      this.monkey.body.setVelocity(0, 0);
    }

    this.cameras.main?.flash(120, 255, 0, 0);

    const chars = FINISH_HIM_TEXT.split('');
    const cx = this.game.config.width / 2;
    const cy = this.game.config.height / 2;
    const totalWidth = chars.length * FINISH_HIM_CHAR_WIDTH;

    this.finishHimChars = chars.map((char, index) => {
      const x = cx - (totalWidth / 2) + (index * FINISH_HIM_CHAR_WIDTH) + (FINISH_HIM_CHAR_WIDTH / 2);
      const charText = this.add.bitmapText(x, cy - 80, FONT_KEY, char)
        .setOrigin(0.5)
        .setAlpha(0)
        .setTint(0xff2222)
        .setDepth(20);

      this.tweens.add({
        targets: charText,
        y: cy,
        alpha: 1,
        scale: { from: 1.5, to: 1 },
        duration: FINISH_HIM_CHAR_DURATION_MS,
        ease: 'Bounce.easeOut',
        delay: index * FINISH_HIM_CHAR_DELAY_MS,
        onComplete: () => {
          this.cameras.main?.shake(80, 0.004);
        }
      });

      return charText;
    });

    const totalIntroMs = (chars.length - 1) * FINISH_HIM_CHAR_DELAY_MS + FINISH_HIM_CHAR_DURATION_MS;

    this.time.delayedCall(totalIntroMs + FINISH_HIM_POST_TEXT_HOLD_MS, () => {
      if (this.finishHimChars) {
        this.tweens.add({
          targets: this.finishHimChars,
          alpha: 0,
          duration: 220,
          onComplete: () => {
            this.finishHimChars?.forEach((c) => c.destroy());
            this.finishHimChars = null;
          }
        });
      }
      this.deliverFinisher();
    });
  }

  deliverFinisher() {
    if (this.monkeyDestroyed || !this.monkey?.active) {
      return;
    }

    this.state = STATE_KICKING;
    this.envy.anims.timeScale = (this.currentKickFrameRate() + 4) / KICK_INITIAL_FRAMERATE;

    const onUpdate = (anim, frame) => {
      if (!frame || frame.textureFrame !== FINISHER_EXTENDED_FRAME) {
        return;
      }
      this.envy.off(Phaser.Animations.Events.ANIMATION_UPDATE, onUpdate);
      this.onFinisherImpact();
    };
    this.envy.on(Phaser.Animations.Events.ANIMATION_UPDATE, onUpdate);

    this.envy.play(ENVY_KICK_ANIM);
  }

  onFinisherImpact() {
    if (this.monkeyDestroyed) {
      return;
    }

    this.cameras.main?.shake(220, 0.018);
    this.cameras.main?.flash(120, 255, 240, 220, true);
    this.spawnKickBloodSplat();
    this.spawnSuzieBloodDrip(1.6);
    this.pulseMonkeyBarrel();
    this.launchMonkey();

    if (this.monkey?.active) {
      this.monkey.damage({ damagePoints: this.monkey.health });
    }
    this.refreshHpText();
    this.killMonkey();

    this.envy.anims.pause();

    this.time.delayedCall(FINISHER_DRAMATIC_HOLD_MS, () => {
      if (!this.envy?.active) {
        return;
      }
      this.envy.setFrame(FINISHER_ADVANCE_FRAME);

      this.time.delayedCall(FINISHER_ADVANCE_HOLD_MS, () => {
        if (!this.envy?.active) {
          return;
        }
        this.envy.anims.stop();
        this.envy.anims.timeScale = 1;
        this.envy.play(ENVY_IDLE_ANIM);
      });
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
      amount: 1.12,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.monkeyBarrel) {
          this.monkeyBarrel.amount = 1;
        }
        this.barrelTween = null;
      }
    });
  }

  hitStop() {
    if (!this.envy?.anims || this.hitStopActive) {
      return;
    }
    this.hitStopActive = true;

    const envyAnims = this.envy.anims;
    const monkeyAnims = this.monkey?.anims;

    envyAnims.pause();
    monkeyAnims?.pause();

    this.time.delayedCall(70, () => {
      this.hitStopActive = false;
      if (this.envy?.active) {
        envyAnims.resume();
      }
      if (this.monkey?.active && monkeyAnims) {
        monkeyAnims.resume();
      }
    });
  }

  spawnSuzieBloodDrip(intensity = 1) {
    if (!this.monkey || !this.monkey.active) {
      return;
    }

    const w = this.monkey.displayWidth * 0.7;
    const h = this.monkey.displayHeight * 0.45;
    const x = this.monkey.x - (w / 2);
    const y = this.monkey.y - this.monkey.displayHeight + (this.monkey.displayHeight * 0.1);

    const emitter = this.add.particles(x, y, 'blood', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      emitZone: { source: new Phaser.Geom.Rectangle(0, 0, w, h) },
      lifespan: { min: 500, max: 900 },
      gravityY: 300,
      speedY: { min: 40, max: 120 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.8 * intensity, end: 0 },
      quantity: Math.max(1, Math.round(2 * intensity)),
      frequency: 90
    });

    this.time.delayedCall(280, () => {
      if (emitter && typeof emitter.stop === 'function') {
        emitter.stop();
      }
    });
    this.time.delayedCall(1500, () => {
      if (emitter && typeof emitter.destroy === 'function') {
        emitter.destroy();
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

  killMonkey() {
    if (this.monkeyDestroyed) {
      return;
    }
    this.monkeyDestroyed = true;
    this.state = STATE_DONE;

    if (this.kickOverlap) {
      this.physics.world.removeCollider(this.kickOverlap);
      this.kickOverlap = null;
    }

    this.envy.off(`animationcomplete-${ENVY_KICK_ANIM}`, this.onKickAnimComplete, this);

    this.refreshHpText();
    document.dispatchEvent(new CustomEvent('enemy-defeated'));
  }

  cleanup() {
    if (this.kickOverlap) {
      this.physics.world?.removeCollider(this.kickOverlap);
      this.kickOverlap = null;
    }
    if (this.envy) {
      this.envy.off(`animationcomplete-${ENVY_KICK_ANIM}`, this.onKickAnimComplete, this);
    }
    this.barrelTween?.stop();
  }
}
