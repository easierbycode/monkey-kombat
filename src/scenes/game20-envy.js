import Monkey from '../sprites/monkey.js';

const ENVY_IDLE_KEY = 'envy-idle';
const ENVY_WALK_KEY = 'envy-walk';
const ENVY_KICK_KEY = 'envy-kick';

const ENVY_IDLE_ANIM = 'envy-idle-loop';
const ENVY_WALK_ANIM = 'envy-walk-loop';
const ENVY_KICK_ANIM = 'envy-kick-once';

const IDLE_DURATION_MS = 3500;
const APPROACH_SPEED_PX_PER_SEC = 60;
const CHASE_SPEED_PX_PER_SEC = 130;

const KICK_INITIAL_FRAMERATE = 10;
const KICK_FRAMERATE_INCREMENT = 1;
const KICK_DAMAGE_PER_CYCLE = 1;

const KICK_LAUNCH_VX = 280;
const KICK_LAUNCH_VY = -360;
const KICK_GRAVITY = 900;
const KICK_BOUNCE = 0.55;
const KICK_REACH_PX = 6;

const FINISH_HIM_FREEZE_MS = 900;

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
    this.kickFrameRate = KICK_INITIAL_FRAMERATE;
    this.finishHimShown = false;

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

  beginApproach() {
    if (this.state !== STATE_IDLE || this.monkeyDestroyed) {
      return;
    }
    this.state = STATE_APPROACH;
    this.envy.play(ENVY_WALK_ANIM);
  }

  beginChase() {
    if (this.monkeyDestroyed) {
      return;
    }
    this.state = STATE_CHASING;
    if (this.envy.anims.currentAnim?.key !== ENVY_WALK_ANIM) {
      this.envy.play(ENVY_WALK_ANIM);
    }
  }

  update() {
    if (!this.envy?.active) {
      return;
    }

    this.envy.y = this.game.config.height;

    if (this.state === STATE_APPROACH) {
      this.stepEnvyTowardMonkey(APPROACH_SPEED_PX_PER_SEC);
    } else if (this.state === STATE_CHASING) {
      this.stepEnvyTowardMonkey(CHASE_SPEED_PX_PER_SEC);
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

    const willKill = (this.monkey.health - KICK_DAMAGE_PER_CYCLE) <= 0;

    if (willKill && !this.finishHimShown) {
      this.beginFinishHim();
      return;
    }

    this.performKick();
  }

  performKick() {
    this.state = STATE_KICKING;

    this.envy.anims.timeScale = this.kickFrameRate / KICK_INITIAL_FRAMERATE;
    this.envy.play(ENVY_KICK_ANIM);

    this.cameras.main?.shake(80, 0.006);
    this.cameras.main?.flash(40, 255, 240, 220, true);
    this.spawnKickBloodSplat();
    this.pulseMonkeyBarrel();
    this.hitStop();
    this.launchMonkey();

    this.monkey.damage({ damagePoints: KICK_DAMAGE_PER_CYCLE });
    this.refreshHpText();

    this.kickFrameRate += KICK_FRAMERATE_INCREMENT;
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
    this.monkey.body.setAllowGravity(true);
    this.monkey.body.setGravityY(KICK_GRAVITY);
    this.monkey.body.setVelocity(dir * KICK_LAUNCH_VX, KICK_LAUNCH_VY);
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

    const text = this.add.text(
      this.game.config.width / 2,
      this.game.config.height / 2,
      'FINISH HIM!',
      {
        fontFamily: '"Bangers", monospace',
        fontSize: '36px',
        color: '#ff2222',
        stroke: '#220000',
        strokeThickness: 5
      }
    ).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: text,
      scale: { from: 0.4, to: 1.1 },
      alpha: { from: 0, to: 1 },
      duration: 220,
      ease: 'Back.easeOut',
      yoyo: false
    });

    this.cameras.main?.flash(120, 255, 0, 0);

    this.time.delayedCall(FINISH_HIM_FREEZE_MS, () => {
      this.tweens.add({
        targets: text,
        alpha: 0,
        duration: 220,
        onComplete: () => text.destroy()
      });
      this.deliverFinisher();
    });
  }

  deliverFinisher() {
    if (this.monkeyDestroyed || !this.monkey?.active) {
      return;
    }

    this.state = STATE_KICKING;
    this.envy.anims.timeScale = (this.kickFrameRate + 4) / KICK_INITIAL_FRAMERATE;
    this.envy.play(ENVY_KICK_ANIM);

    this.cameras.main?.shake(220, 0.018);
    this.cameras.main?.flash(120, 255, 240, 220, true);
    this.spawnKickBloodSplat();
    this.pulseMonkeyBarrel();
    this.launchMonkey();

    this.monkey.damage({ damagePoints: this.monkey.health });
    this.refreshHpText();

    this.killMonkey();
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
    this.envy.anims.stop();
    this.envy.setTexture(ENVY_IDLE_KEY, 'atlas_s0');
    this.envy.y = this.game.config.height;

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
