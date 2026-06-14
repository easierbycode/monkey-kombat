import Monkey from '../sprites/monkey.js';

const RYU_KEY = 'ryu';

const IDLE_ANIM = 'ryu-idle-loop';
const UPPERCUT_ANIM = 'ryu-uppercut';

const IDLE_FPS = 3;
const UPPERCUT_FPS = 18;

// Frame where the rising fist connects and the monkey is launched (the tall
// "leaping shoryuken" frame in atlas_s11..atlas_s17).
const UPPERCUT_IMPACT_FRAME = 'atlas_s13';

const IDLE_DURATION_MS = 3500;

const TRAIN_KEY = 'train';
const TRAIN_URL = 'https://easierbycode.com/assets/sprites/train.png';
const TRAIN_SPEED = 215;

// Monkey starts at full kombat scale (6). When it falls back down it is shrunk
// to sit "further in the background" on the train tracks.
const MONKEY_BG_SCALE = 3;

// Choreography timings for the uppercut flight arc.
const FLIGHT_ASCEND_MS = 600;
const FLIGHT_HANG_MS = 280;
const FLIGHT_DESCEND_MS = 720;

const STATE_IDLE = 'idle';
const STATE_UPPERCUT = 'uppercut';
const STATE_FLYING = 'flying';
const STATE_LANDED = 'landed';
const STATE_DONE = 'done';

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game24' });
  }

  preload() {
    this.load.atlas(RYU_KEY, './assets/ryu.png', './assets/ryu.json');
    this.load.image(TRAIN_KEY, TRAIN_URL);

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
    this.redLightTween = null;

    const width = this.game.config.width;
    const height = this.game.config.height;

    // Where the monkey will fall back down to: smaller and further up the
    // screen so it reads as the distant train tracks.
    this.bgX = Math.round(width * 0.46);
    this.bgFeetY = Math.round(height * 0.80);

    this.cameras.main.setBackgroundColor('#0b0b14');
    this.createScenery(width, height);
    this.createAnimations();
    this.createMonkey();
    this.createRyu();
    this.createRedLight(width, height);

    this.idleTimer = this.time.delayedCall(IDLE_DURATION_MS, () => this.startUppercut());

    this.events.once('shutdown', () => this.cleanup());
    this.events.once('destroy', () => this.cleanup());
  }

  createScenery(width, height) {
    // Distant rail line the monkey lands on / the train rides.
    this.add.rectangle(width / 2, this.bgFeetY, width, 2, 0x2a2a3a)
      .setOrigin(0.5, 0.5)
      .setDepth(0);
    this.add.rectangle(width / 2, this.bgFeetY + 3, width, 1, 0x16161f)
      .setOrigin(0.5, 0.5)
      .setDepth(0);

    // Sleepers / crossing ties for a touch of railroad texture.
    const tieColor = 0x1c1c26;
    for (let x = 6; x < width; x += 22) {
      this.add.rectangle(x, this.bgFeetY + 1, 10, 4, tieColor)
        .setOrigin(0.5, 0)
        .setDepth(0);
    }

    // Foreground ground the fighters stand on.
    this.add.rectangle(width / 2, height, width, Math.round(height * 0.16), 0x101019)
      .setOrigin(0.5, 1)
      .setDepth(0);
  }

  createAnimations() {
    const ensureAnim = (config) => {
      if (!this.anims.exists(config.key)) {
        this.anims.create(config);
      }
    };

    ensureAnim({
      key: IDLE_ANIM,
      frames: this.anims.generateFrameNames(RYU_KEY, {
        prefix: 'atlas_s',
        start: 0,
        end: 1
      }),
      frameRate: IDLE_FPS,
      repeat: -1
    });

    ensureAnim({
      key: UPPERCUT_ANIM,
      frames: this.anims.generateFrameNames(RYU_KEY, {
        prefix: 'atlas_s',
        start: 11,
        end: 17
      }),
      frameRate: UPPERCUT_FPS,
      repeat: 0
    });
  }

  createMonkey() {
    const width = this.game.config.width;
    const height = this.game.config.height;

    this.monkey = new Monkey({
      scene: this,
      x: width,
      y: height
    });
    this.monkey.x -= this.monkey.displayWidth / 2;
    this.monkey.health = 99;
    this.monkey.setDepth(2);

    if (this.monkey.body) {
      this.monkey.body.setAllowGravity(false);
      this.monkey.body.setImmovable(false);
    }
  }

  createRyu() {
    const height = this.game.config.height;

    this.ryu = this.add.sprite(0, height, RYU_KEY, 'atlas_s0');
    this.ryu.setOrigin(0.5, 1);

    // Match Ryu's standing height to the monkey so the uppercut connects.
    const ryuScale = (this.monkey.displayHeight * 1.05) / this.ryu.height;
    this.ryu.setScale(ryuScale);
    this.ryu.setDepth(6);

    // Stand just left of the monkey, fist within reach, facing right.
    const monkeyLeft = this.monkey.x - this.monkey.displayWidth / 2;
    this.ryu.x = monkeyLeft - this.ryu.displayWidth / 2 + 16;
    this.ryu.setFlipX(false);

    this.ryu.play(IDLE_ANIM);
  }

  createRedLight(width, height) {
    // A left-anchored red wash that mimics an off-screen railroad-crossing
    // light flashing into the scene. Additive + horizontal gradient so it is
    // strongest at the left and fades to nothing on the right.
    const g = this.add.graphics();
    g.fillGradientStyle(0xff1a1a, 0xff1a1a, 0xff1a1a, 0xff1a1a, 0.95, 0, 0.95, 0);
    g.fillRect(0, 0, width, height);
    g.setBlendMode(Phaser.BlendModes.ADD);
    g.setDepth(50);
    g.setAlpha(0);
    this.redLight = g;
  }

  // --- Uppercut -------------------------------------------------------------

  startUppercut() {
    if (this.state !== STATE_IDLE) {
      return;
    }
    this.state = STATE_UPPERCUT;
    this.ryu.setFlipX(false);

    const onUpdate = (anim, frame) => {
      if (!frame || frame.textureFrame !== UPPERCUT_IMPACT_FRAME) {
        return;
      }
      this.ryu.off(Phaser.Animations.Events.ANIMATION_UPDATE, onUpdate);
      this.onUppercutImpact();
    };
    this.ryu.on(Phaser.Animations.Events.ANIMATION_UPDATE, onUpdate);
    this.ryu.once(`animationcomplete-${UPPERCUT_ANIM}`, () => this.onUppercutComplete());

    this.ryu.play(UPPERCUT_ANIM);
  }

  onUppercutImpact() {
    this.cameras.main?.shake(120, 0.008);
    this.cameras.main?.flash(60, 255, 255, 245, true);
    this.triggerHaptic(40);

    if (this.monkey?.active) {
      const sparkX = this.monkey.x;
      const sparkY = this.monkey.y - this.monkey.displayHeight * 0.45;
      const spark = this.add.particles(0, 0, 'explosion', {
        frame: ['muzzleflash3', 'white-smoke'],
        lifespan: { min: 180, max: 320 },
        speed: { min: 60, max: 220 },
        angle: { min: -140, max: -40 },
        scale: { start: 2.4, end: 0 },
        rotate: { min: 0, max: 180 },
        emitting: false
      });
      spark.setDepth(7);
      spark.explode(8, sparkX, sparkY);
      this.time.delayedCall(500, () => spark.destroy());
    }

    this.launchMonkeyUp();
  }

  onUppercutComplete() {
    if (this.state === STATE_DONE) {
      return;
    }
    this.ryu.play(IDLE_ANIM);
  }

  launchMonkeyUp() {
    if (!this.monkey?.active) {
      return;
    }
    this.state = STATE_FLYING;

    // Drop the monkey behind Ryu and take manual control of its transform.
    this.monkey.setDepth(1);
    if (this.monkey.body) {
      this.monkey.body.enable = false;
    }

    const topOffscreenY = -Math.max(80, this.monkey.displayHeight);

    // Arc: rocket up off the top while shrinking + drifting toward the tracks,
    // hang in suspense, then accelerate back down into the background.
    this.tweens.chain({
      targets: this.monkey,
      tweens: [
        {
          x: this.bgX,
          y: topOffscreenY,
          scaleX: MONKEY_BG_SCALE,
          scaleY: MONKEY_BG_SCALE,
          duration: FLIGHT_ASCEND_MS,
          ease: 'Quad.easeOut'
        },
        {
          y: this.bgFeetY,
          duration: FLIGHT_DESCEND_MS,
          delay: FLIGHT_HANG_MS,
          ease: 'Quad.easeIn',
          onComplete: () => this.onMonkeyLandedBackground()
        }
      ]
    });
  }

  // --- Background landing + train crossing ---------------------------------

  onMonkeyLandedBackground() {
    if (this.state !== STATE_FLYING || !this.monkey?.active) {
      return;
    }
    this.state = STATE_LANDED;

    // Re-enable physics so the train can collide with and launch the monkey.
    if (this.monkey.body) {
      this.monkey.body.enable = true;
      this.monkey.body.reset(this.monkey.x, this.monkey.y);
      this.monkey.body.setAllowGravity(false);
      this.monkey.body.setImmovable(false);
    }

    // Landing squash + a puff of dust on the rails.
    this.tweens.add({
      targets: this.monkey,
      scaleY: MONKEY_BG_SCALE * 0.82,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    const dust = this.add.particles(0, 0, 'explosion', {
      frame: ['smoke-puff', 'white-smoke'],
      lifespan: { min: 250, max: 500 },
      speed: { min: 20, max: 70 },
      angle: { min: 200, max: 340 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.5, end: 0 },
      emitting: false
    });
    dust.setDepth(1);
    dust.explode(6, this.monkey.x, this.bgFeetY);
    this.time.delayedCall(700, () => dust.destroy());

    this.startCrossingSequence();
  }

  startCrossingSequence() {
    // A red flash or two of suspense, then the train arrives bathed in red.
    this.flashRedLight(0.5, 200, 140);
    this.crossingTimers = [
      this.time.delayedCall(820, () => this.flashRedLight(0.62, 200, 160)),
      this.time.delayedCall(1320, () => {
        this.setRedGlow(0.16);
        this.spawnTrain();
      })
    ];
  }

  spawnTrain() {
    if (this.state !== STATE_LANDED) {
      return;
    }

    this.train = this.physics.add.sprite(0, this.bgFeetY, TRAIN_KEY);
    this.train.setOrigin(0.5, 1);

    // Size the train to loom a little taller than the distant monkey.
    const trainScale = (this.monkey.displayHeight * 1.25) / this.train.height;
    this.train.setScale(trainScale);
    this.train.setDepth(3);

    // Start fully off-screen left with the leading (right) edge at the screen
    // edge, then barrel rightward toward the monkey.
    this.train.x = -this.train.displayWidth / 2;

    if (this.train.body) {
      this.train.body.setAllowGravity(false);
      this.train.body.setImmovable(true);
      this.train.body.setVelocityX(TRAIN_SPEED);
    }

    this.trainOverlap = this.physics.add.overlap(
      this.train,
      this.monkey,
      () => this.onTrainImpact(),
      () => this.canTrainHit(),
      this
    );
  }

  canTrainHit() {
    return this.state === STATE_LANDED
      && !this.monkeyDestroyed
      && !!this.monkey?.active;
  }

  onTrainImpact() {
    if (this.monkeyDestroyed || !this.monkey?.active) {
      return;
    }
    this.monkeyDestroyed = true;
    this.state = STATE_DONE;

    if (this.trainOverlap) {
      this.physics.world.removeCollider(this.trainOverlap);
      this.trainOverlap = null;
    }

    const trainVx = this.train?.body?.velocity.x || TRAIN_SPEED;
    const inertiaVx = trainVx * 1.3;
    const inertiaVy = -180;

    const impactX = this.monkey.x;
    const impactY = this.monkey.y - this.monkey.displayHeight * 0.5;

    // Physics: the train plows the monkey forward (its own direction) and up.
    if (this.monkey.body) {
      this.monkey.body.setAllowGravity(true);
      this.monkey.body.setGravityY(1500);
      this.monkey.body.setVelocity(inertiaVx, -460);
    }

    // Gibs that take on the train's inertia.
    this.spawnInertialGibs(impactX, impactY, inertiaVx, inertiaVy);

    this.cameras.main?.shake(360, 0.02);
    this.cameras.main?.flash(120, 255, 60, 40);
    this.flashRedLight(0.85, 60, 130);
    this.triggerHaptic([60, 30, 120]);

    // Destroy() handles the camera shake, blood splat, banner and removes the
    // sprite; the launched body lurches for a beat before it is cleared.
    this.monkey.destroy();
    document.dispatchEvent(new CustomEvent('enemy-defeated'));
  }

  spawnInertialGibs(x, y, inertiaVx, inertiaVy) {
    const applyInertia = (emitter, factor = 1) => {
      if (!emitter) {
        return;
      }
      emitter.forEachAlive((particle) => {
        particle.velocityX += inertiaVx * factor;
        particle.velocityY += inertiaVy * factor;
      });
    };

    const bones = this.add.particles(0, 0, 'bone', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7],
      speed: { min: 200, max: 700 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 700, max: 1200 },
      gravityY: 1400,
      scale: 2,
      rotate: { min: -360, max: 360 },
      emitting: false
    });
    bones.setDepth(5);
    bones.explode(20, x, y);
    applyInertia(bones);

    const muscles = this.add.particles(0, 0, 'muscle', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7],
      speed: { min: 250, max: 950 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 700, max: 1200 },
      gravityY: 1500,
      scale: 2.4,
      rotate: { min: -360, max: 360 },
      emitting: false
    });
    muscles.setDepth(5);
    muscles.explode(30, x, y);
    applyInertia(muscles);

    const blood = this.add.particles(0, 0, 'blood', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      speed: { min: 120, max: 520 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 400, max: 800 },
      gravityY: 900,
      scale: { start: 1.1, end: 0 },
      emitting: false
    });
    blood.setDepth(4);
    blood.explode(16, x, y);
    applyInertia(blood);

    const flash = this.add.particles(0, 0, 'explosion', {
      frame: ['muzzleflash2', 'red', 'smoke-puff'],
      lifespan: { min: 200, max: 420 },
      scale: { start: 3.5, end: 0 },
      rotate: { min: 0, max: 180 },
      emitting: false
    });
    flash.setDepth(6);
    flash.explode(4, x, y);
    applyInertia(flash, 0.5);

    this.gibEmitters = [bones, muscles, blood, flash];
    this.time.delayedCall(1500, () => {
      this.gibEmitters?.forEach((emitter) => emitter?.destroy());
      this.gibEmitters = null;
    });
  }

  // --- Red crossing light helpers ------------------------------------------

  flashRedLight(peak, inMs, holdMs) {
    if (!this.redLight) {
      return;
    }
    if (this.redLightTween) {
      this.redLightTween.stop();
    }
    this.redLightTween = this.tweens.add({
      targets: this.redLight,
      alpha: peak,
      duration: inMs,
      hold: holdMs,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.redLightTween = null;
      }
    });
  }

  setRedGlow(level) {
    if (!this.redLight) {
      return;
    }
    if (this.redLightTween) {
      this.redLightTween.stop();
    }
    this.redLightTween = this.tweens.add({
      targets: this.redLight,
      alpha: level,
      duration: 200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.redLightTween = null;
      }
    });
  }

  // --- Misc ----------------------------------------------------------------

  triggerHaptic(pattern) {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return;
    }
    try {
      navigator.vibrate(pattern);
    } catch (_) {
      /* noop */
    }
  }

  update() {
    if (this.train && this.train.active) {
      const leftEdge = this.train.x - this.train.displayWidth / 2;
      if (leftEdge > this.game.config.width + 40) {
        this.train.destroy();
        this.train = null;
        if (this.redLight) {
          this.setRedGlow(0);
        }
      }
    }
  }

  cleanup() {
    this.state = STATE_DONE;

    if (this.idleTimer) {
      this.idleTimer.remove(false);
      this.idleTimer = null;
    }
    this.crossingTimers?.forEach((timer) => timer?.remove?.(false));
    this.crossingTimers = null;

    if (this.trainOverlap) {
      this.physics.world?.removeCollider(this.trainOverlap);
      this.trainOverlap = null;
    }
    if (this.redLightTween) {
      this.redLightTween.stop();
      this.redLightTween = null;
    }
    this.gibEmitters?.forEach((emitter) => emitter?.destroy());
    this.gibEmitters = null;
  }
}
