export default class Suzie extends Phaser.Physics.Arcade.Sprite {
  constructor({ scene, x, y }) {
    super(scene, x, y, 'suzie-idle', 0);

    this.scene = scene;
    this.health = 40;
    this.state = 'idle';
    this.hasIdle2 = false;
    this.hasHighKick = false;
    this.hasFallen = false;
    this.dead = false;
    this.highKickTimer = null;
    this.fallTween = null;

    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setScale(0.7);
    this.setCollideWorldBounds(true);
    this.body.onWorldBounds = true;

    this.createAnimations(scene);
    this.createGoreEmitters(scene);

    scene.add.existing(this);

    this.on('animationcomplete-suzie-high-kick', this.onHighKickComplete, this);
    this.on('animationcomplete-suzie-hit', this.resumeLoopingAnimation, this);

    scene.physics.world.on('worldbounds', this.handleWorldBounds, this);

    this.play('suzie-idle');
  }

  createAnimations(scene) {
    if (!scene.anims.exists('bloodAnimation')) {
      scene.anims.create({
        frameRate: 20,
        frames: scene.anims.generateFrameNumbers('blood', {
          start: 0,
          end: 9,
          first: 0
        }),
        hideOnComplete: true,
        key: 'bloodAnimation',
        repeat: 0
      });
    }

    if (!scene.anims.exists('suzie-idle')) {
      scene.anims.create({
        key: 'suzie-idle',
        frames: scene.anims.generateFrameNumbers('suzie-idle', {
          start: 0,
          end: 0
        }),
        frameRate: 1,
        repeat: -1
      });
    }

    if (!scene.anims.exists('suzie-idle-2')) {
      scene.anims.create({
        key: 'suzie-idle-2',
        frames: scene.anims.generateFrameNumbers('suzie-idle2', {
          start: 0,
          end: 2
        }),
        frameRate: 6,
        yoyo: true,
        repeat: -1
      });
    }

    if (!scene.anims.exists('suzie-hit')) {
      scene.anims.create({
        key: 'suzie-hit',
        frames: scene.anims.generateFrameNumbers('suzie-idle2', {
          start: 0,
          end: 2
        }),
        frameRate: 14,
        repeat: 0,
        yoyo: true
      });
    }

    if (!scene.anims.exists('suzie-high-kick')) {
      scene.anims.create({
        key: 'suzie-high-kick',
        frames: scene.anims.generateFrameNumbers('suzie-idle2', {
          start: 0,
          end: 2
        }),
        frameRate: 12,
        repeat: 0,
        yoyo: true
      });
    }

    if (!scene.anims.exists('suzie-fall')) {
      scene.anims.create({
        key: 'suzie-fall',
        frames: scene.anims.generateFrameNumbers('suzie-fall', {
          start: 0,
          end: 0
        }),
        frameRate: 1,
        repeat: -1
      });
    }

    if (!scene.anims.exists('suzie-land')) {
      scene.anims.create({
        key: 'suzie-land',
        frames: scene.anims.generateFrameNumbers('suzie-fall', {
          start: 1,
          end: 2
        }),
        frameRate: 8,
        repeat: 0
      });
    }
  }

  createGoreEmitters(scene) {
    this.bones = scene.add.particles(0, 0, 'bone', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7],
      speed: 750,
      emitting: false
    });

    this.bones.startFollow(this);

    this.muscles = scene.add.particles(0, 0, 'muscle', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7],
      speed: 1400,
      emitting: false
    });

    this.muscles.startFollow(this);

    this.explosionFlash = scene.add.particles(0, 0, 'explosion', {
      frame: 'muzzleflash2',
      lifespan: 200,
      scale: { start: 4, end: 0 },
      rotate: { start: 0, end: 180 },
      emitting: false
    });

    this.explosionFlash.startFollow(this);
  }

  safeExplode(emitterManager, quantity) {
    if (!emitterManager) {
      return;
    }

    if (typeof emitterManager.explode === 'function') {
      emitterManager.explode(quantity, this.x, this.y);
      return;
    }

    const emitters = emitterManager.emitters?.list;

    if (!emitters || emitters.length === 0) {
      return;
    }

    for (let idx = 0; idx < emitters.length; idx++) {
      const emitter = emitters[idx];

      if (!emitter || emitter.manager !== emitterManager) {
        continue;
      }

      if (typeof emitter.explode === 'function') {
        emitter.explode(quantity, this.x, this.y);
      }
    }
  }

  flashRed() {
    if (typeof TweenMax === 'undefined') {
      this.setTintFill(0xff0000);
      this.scene.time.delayedCall(120, () => this.clearTint());
      return;
    }

    TweenMax.to(this, 0.1, {
      tint: 16711680
    });
    TweenMax.to(this, 0.1, {
      delay: 0.1,
      tint: 16777215
    });
  }

  bloodAnimation() {
    this.scene.add.sprite(this.x, this.y - (this.displayHeight / 2), 'blood')
      .setScale(2.1)
      .play('bloodAnimation');
  }

  spawnBloodMessage() {
    const scene = this.scene;
    if (!scene) {
      return;
    }

    const textY = Math.max(30, this.y - this.displayHeight - 10);
    const text = scene.add.text(scene.game.config.width / 2, textY, 'Bye Suzie', {
      fontFamily: '"Bangers"',
      fontSize: '32px',
      color: '#b30000',
      stroke: '#4d0000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 1);

    const emitterX = text.x - (text.displayWidth / 2);
    const emitterY = text.y - text.displayHeight;
    const emitter = scene.add.particles(emitterX, emitterY, 'blood', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      emitZone: { source: new Phaser.Geom.Rectangle(0, 0, text.displayWidth, text.displayHeight) },
      lifespan: { min: 500, max: 900 },
      gravityY: 300,
      speedY: { min: 40, max: 120 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.8, end: 0 },
      quantity: 2,
      frequency: 90
    });

    scene.time.delayedCall(1200, () => emitter.stop && emitter.stop());
    scene.time.delayedCall(2000, () => {
      if (emitter.manager && typeof emitter.manager.destroy === 'function') {
        emitter.manager.destroy();
      } else if (typeof emitter.destroy === 'function') {
        emitter.destroy();
      }
    });
  }

  stopHighKickTimer() {
    if (this.highKickTimer) {
      this.highKickTimer.remove(false);
      this.highKickTimer = null;
    }
  }

  scheduleHighKick() {
    if (this.dead || this.state !== 'highKick') {
      return;
    }

    this.stopHighKickTimer();

    const delay = Phaser.Math.Between(180, 950);
    this.highKickTimer = this.scene.time.delayedCall(delay, () => {
      if (this.dead || this.state !== 'highKick') {
        return;
      }
      this.play('suzie-high-kick', true);
    });
  }

  onHighKickComplete() {
    if (this.dead || this.state !== 'highKick') {
      return;
    }

    this.play('suzie-idle-2', true);
    this.scheduleHighKick();
  }

  startIdle2() {
    if (this.dead || this.hasIdle2 || this.state === 'falling') {
      return;
    }
    this.hasIdle2 = true;
    this.state = 'idle2';
    this.play('suzie-idle-2', true);
  }

  startHighKick() {
    if (this.dead || this.state === 'falling') {
      return;
    }

    this.hasHighKick = true;
    this.state = 'highKick';
    this.play('suzie-idle-2', true);
    this.scheduleHighKick();
  }

  startFall() {
    if (this.dead || this.hasFallen) {
      return;
    }

    this.hasFallen = true;
    this.state = 'falling';
    this.stopHighKickTimer();
    this.play('suzie-fall', true);

    if (this.body) {
      this.body.setAllowGravity(false);
      this.body.setVelocity(0, 0);
      this.body.setGravity(0, 0);
    }

    const lift = this.displayHeight * 0.35;
    this.y = Math.max(20, this.y - lift);

    this.fallTween = this.scene.tweens.add({
      targets: this,
      y: this.scene.game.config.height,
      duration: 750,
      ease: 'Quad.easeIn',
      onComplete: () => this.land()
    });
  }

  land() {
    if (this.dead || this.state === 'landed') {
      return;
    }

    this.state = 'landed';
    this.stopHighKickTimer();

    if (this.body) {
      this.body.setAllowGravity(false);
      this.body.setGravity(0, 0);
      this.body.setVelocity(0, 0);
    }

    if (this.fallTween) {
      this.fallTween.remove();
      this.fallTween = null;
    }

    this.play('suzie-land');
  }

  handleWorldBounds(body, up, down) {
    if (!body || body.gameObject !== this) {
      return;
    }

    if (this.state === 'falling' && down) {
      this.land();
    }
  }

  resumeLoopingAnimation() {
    if (this.dead || this.state === 'falling') {
      return;
    }

    if (this.state === 'landed') {
      this.play('suzie-land');
      return;
    }

    if (this.state === 'highKick') {
      this.play('suzie-idle-2', true);
      this.scheduleHighKick();
      return;
    }

    if (this.hasIdle2 || this.hasHighKick) {
      this.play('suzie-idle-2', true);
      this.state = this.state === 'landed' ? 'landed' : 'idle2';
      return;
    }

    this.play('suzie-idle', true);
    this.state = 'idle';
  }

  explodeAndDie() {
    if (this.dead) {
      return;
    }

    this.dead = true;
    this.state = 'dead';
    this.stopHighKickTimer();

    if (this.body) {
      this.body.enable = false;
    }

    const scene = this.scene;
    if (scene && scene.cameras && scene.cameras.main) {
      scene.cameras.main.shake(500, 0.02);
    }

    this.safeExplode(this.explosionFlash, 1);
    this.safeExplode(this.bones, 18);
    this.safeExplode(this.muscles, 60);
    this.bloodAnimation();
    this.spawnBloodMessage();

    if (scene && scene.time) {
      scene.time.delayedCall(120, () => this.safeExplode(this.muscles, 40));
      scene.time.delayedCall(260, () => this.safeExplode(this.bones, 12));
      scene.time.delayedCall(480, () => this.finishDestroy());
    } else {
      this.finishDestroy();
    }
  }

  finishDestroy() {
    this.scene?.physics?.world?.off('worldbounds', this.handleWorldBounds, this);
    super.destroy();
  }

  damage(bullet) {
    if (this.dead) {
      return true;
    }

    this.health -= (bullet?.damagePoints || 1);

    this.flashRed();
    this.play('suzie-hit', true);

    const isDead = this.health <= 0;

    if (isDead) {
      this.explodeAndDie();
      return true;
    }

    if (this.health < 10) {
      this.startFall();
    } else if (this.health < 20) {
      this.startHighKick();
    } else if (this.health < 30) {
      this.startIdle2();
    }

    return false;
  }
}
