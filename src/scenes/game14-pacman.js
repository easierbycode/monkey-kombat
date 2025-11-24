import Monkey from '../sprites/monkey.js';

const TOTAL_BANANA_THROWS = 3;
const GHOST_RIGHT_ANIM = 'pac-ghost-right';
const GHOST_UP_ANIM = 'pac-ghost-up';
const GHOST_DOWN_ANIM = 'pac-ghost-down';
const MS_PAC_FLY_RIGHT = 'ms-pac-fly-right';
const MS_PAC_FLY_LEFT = 'ms-pac-fly-left';
const PAC_DELORIAN_ANIM = 'pac-delorian-default';
const MS_PAC_DIRECTIONS = ['left', 'right', 'left'];

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game14' });
  }

  preload() {
    this.load.atlas('pacman-ghost-right', './assets/pacman-ghost-right.png', './assets/pacman-ghost-right.json');
    this.load.atlas('pacman-ghost-up', './assets/pacman-ghost-up.png', './assets/pacman-ghost-up.json');
    this.load.atlas('pacman-ghost-down', './assets/pacman-ghost-down.png', './assets/pacman-ghost-down.json');

    this.load.atlas('ms-pacman-left', './assets/ms-pacman-left.png', './assets/ms-pacman-left.json');
    this.load.atlas('ms-pacman-right', './assets/ms-pacman-right.png', './assets/ms-pacman-right.json');

    this.load.image('pacman-pretzel', './assets/pacman-pretzel.png');
    this.load.image('pacman-cherry', './assets/pacman-cherry.png');
    this.load.image('pacman-banana', './assets/pacman-banana.png');

    this.load.atlas('pac-delorian', './assets/pac-delorian.png', './assets/pac-delorian.json');

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
    this.completedThrows = 0;
    this.dropStarted = false;
    this.isThrowRunning = false;

    this.createMonkey();
    this.createItems();
    this.createAnimations();
    this.createGhost();

    this.time.delayedCall(250, () => this.startGhostSequence());
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
    this.monkey.setDepth(5);

    this.groundY = this.monkey.y;
    this.monkeyHitY = this.monkey.y - (this.monkey.displayHeight * 0.65);
  }

  createItems() {
    const spacing = 70;
    const topY = this.monkey.y - (this.monkey.displayHeight * 1.5);
    const startX = this.monkey.x - spacing * 2.5;
    const itemScale = 4.8;

    this.itemSprites = {
      cherry: this.add.image(startX, topY, 'pacman-cherry'),
      pretzel: this.add.image(startX + spacing, topY - 10, 'pacman-pretzel'),
      banana: this.add.image(startX + spacing * 2, topY, 'pacman-banana')
    };

    Object.values(this.itemSprites).forEach((sprite) => {
      sprite.setOrigin(0.5, 1);
      sprite.setScale(itemScale);
      sprite.setDepth(this.monkey.depth + 1);
    });

    this.bananaHolder = this.itemSprites.banana;
    this.bananaHolderBaseY = this.bananaHolder.y;
    this.bananaHolderBaseX = this.bananaHolder.x;
    this.itemScale = itemScale;
  }

  createAnimations() {
    const ensureAnim = (key, config) => {
      if (!this.anims.exists(key)) {
        this.anims.create(config);
      }
    };

    ensureAnim(GHOST_RIGHT_ANIM, {
      key: GHOST_RIGHT_ANIM,
      frames: this.anims.generateFrameNames('pacman-ghost-right', {
        prefix: 'atlas_s',
        start: 0,
        end: 1
      }),
      frameRate: 8,
      repeat: -1
    });

    ensureAnim(GHOST_UP_ANIM, {
      key: GHOST_UP_ANIM,
      frames: this.anims.generateFrameNames('pacman-ghost-up', {
        prefix: 'atlas_s',
        start: 0,
        end: 1
      }),
      frameRate: 8,
      repeat: -1
    });

    ensureAnim(GHOST_DOWN_ANIM, {
      key: GHOST_DOWN_ANIM,
      frames: this.anims.generateFrameNames('pacman-ghost-down', {
        prefix: 'atlas_s',
        start: 0,
        end: 1
      }),
      frameRate: 8,
      repeat: -1
    });

    ensureAnim(MS_PAC_FLY_RIGHT, {
      key: MS_PAC_FLY_RIGHT,
      frames: this.anims.generateFrameNames('ms-pacman-right', {
        prefix: 'atlas_s',
        start: 0,
        end: 2
      }),
      frameRate: 12,
      repeat: -1
    });

    ensureAnim(MS_PAC_FLY_LEFT, {
      key: MS_PAC_FLY_LEFT,
      frames: this.anims.generateFrameNames('ms-pacman-left', {
        prefix: 'atlas_s',
        start: 0,
        end: 2
      }),
      frameRate: 12,
      repeat: -1
    });

    ensureAnim(PAC_DELORIAN_ANIM, {
      key: PAC_DELORIAN_ANIM,
      frames: this.anims.generateFrameNames('pac-delorian', {
        start: 0,
        end: 3
      }),
      frameRate: 10,
      repeat: -1
    });
  }

  createGhost() {
    const startX = -100;
    const ghostY = this.monkey.y - (this.monkey.displayHeight * 0.35);

    this.ghost = this.add.sprite(startX, ghostY, 'pacman-ghost-right', 'atlas_s0');
    this.ghost.setOrigin(0.5, 1);
    this.ghost.setScale(6);
    this.ghost.setDepth(this.monkey.depth + 2);
    this.ghostBaseY = ghostY;
    this.ghost.play(GHOST_RIGHT_ANIM);
  }

  startGhostSequence() {
    const sequence = [
      this.itemSprites.cherry.x,
      this.itemSprites.pretzel.x,
      this.bananaHolderBaseX
    ];

    this.runGhostPath(sequence, 0);
  }

  runGhostPath(sequence, index) {
    if (index >= sequence.length) {
      this.performGhostPickupAndThrow();
      return;
    }

    const targetX = sequence[index];
    const duration = 800 + index * 80;
    this.ghost.play(GHOST_RIGHT_ANIM, true);

    this.tweens.add({
      targets: this.ghost,
      x: targetX,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.time.delayedCall(200, () => this.runGhostPath(sequence, index + 1));
      }
    });
  }

  performGhostPickupAndThrow() {
    if (this.isThrowRunning || this.dropStarted) {
      return;
    }

    this.isThrowRunning = true;
    const throwIndex = this.completedThrows;
    const banana = this.createBananaProjectile();
    const pickupY = this.ghostBaseY - 40;
    const attachY = this.ghostBaseY - (this.ghost.displayHeight * 0.4);

    this.bananaHolder.setAlpha(0);

    this.tweens.add({
      targets: banana,
      x: this.ghost.x,
      y: pickupY - 10,
      duration: 320,
      ease: 'Sine.easeOut'
    });

    this.ghost.play(GHOST_UP_ANIM);
    this.tweens.add({
      targets: this.ghost,
      y: pickupY,
      duration: 320,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.ghost.play(GHOST_DOWN_ANIM);
        this.tweens.add({
          targets: banana,
          x: this.ghost.x,
          y: attachY,
          duration: 300,
          ease: 'Sine.easeIn'
        });
        this.tweens.add({
          targets: this.ghost,
          y: this.ghostBaseY,
          duration: 300,
          ease: 'Sine.easeIn',
          onComplete: () => {
            this.ghost.play(GHOST_RIGHT_ANIM);
            this.launchBanana(banana, throwIndex);
          }
        });
      }
    });
  }

  createBananaProjectile() {
    const banana = this.add.sprite(this.bananaHolderBaseX, this.bananaHolderBaseY, 'pacman-banana');
    banana.setScale(this.itemScale);
    banana.setDepth(this.monkey.depth + 3);
    banana.setOrigin(0.5, 1);
    return banana;
  }

  launchBanana(banana, throwIndex) {
    banana.setOrigin(0.5, 0.5);
    banana.setPosition(this.ghost.x, this.ghost.y - (this.ghost.displayHeight * 0.45));

    const targetX = this.monkey.x - (this.monkey.displayWidth * 0.2);
    const targetY = this.monkeyHitY;

    this.tweens.add({
      targets: banana,
      x: targetX,
      y: targetY,
      duration: 450,
      ease: 'Quad.easeOut',
      onComplete: () => this.handleBananaImpact(banana, throwIndex)
    });

    this.tweens.add({
      targets: banana,
      angle: 360,
      duration: 450,
      repeat: 0,
      ease: 'Linear'
    });

    this.time.delayedCall(120, () => this.scheduleMsPacmanPass(throwIndex));
  }

  handleBananaImpact(banana, throwIndex) {
    this.flashMonkeyDamage();

    const landX = this.monkey.x - (this.monkey.displayWidth * 0.75);
    const bounceY = this.monkeyHitY + 40;

    this.tweens.add({
      targets: banana,
      x: landX,
      y: bounceY,
      duration: 250,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.tweens.add({
          targets: banana,
          x: landX,
          y: this.groundY,
          duration: 350,
          ease: 'Bounce.easeOut',
          onComplete: () => {
            this.time.delayedCall(400, () => {
              banana.destroy();
              this.finishBananaSequence(throwIndex);
            });
          }
        });
      }
    });
  }

  finishBananaSequence(throwIndex) {
    this.isThrowRunning = false;
    if (this.completedThrows === throwIndex) {
      this.completedThrows += 1;
    }

    if (this.completedThrows >= TOTAL_BANANA_THROWS) {
      this.time.delayedCall(700, () => this.dropPacDelorian());
      return;
    }

    this.restockBananaForNextThrow();
  }

  restockBananaForNextThrow() {
    this.bananaHolder.setAlpha(0);
    this.bananaHolder.setPosition(this.bananaHolderBaseX, this.bananaHolderBaseY);

    this.tweens.add({
      targets: this.bananaHolder,
      alpha: 1,
      duration: 400,
      delay: 300,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.time.delayedCall(200, () => this.performGhostPickupAndThrow());
      }
    });
  }

  scheduleMsPacmanPass(throwIndex) {
    const direction = MS_PAC_DIRECTIONS[throwIndex] || 'left';
    const fromLeft = direction === 'left';
    const spriteKey = fromLeft ? 'ms-pacman-right' : 'ms-pacman-left';
    const animKey = fromLeft ? MS_PAC_FLY_RIGHT : MS_PAC_FLY_LEFT;

    const startX = fromLeft ? -100 : this.game.config.width + 100;
    const endX = fromLeft ? this.game.config.width + 120 : -120;
    const y = this.monkeyHitY;

    const msPacman = this.add.sprite(startX, y, spriteKey, 'atlas_s0');
    msPacman.setScale(5.5);
    msPacman.setDepth(this.monkey.depth + 6);
    msPacman.play(animKey);

    this.tweens.add({
      targets: msPacman,
      x: endX,
      duration: 900,
      ease: 'Linear',
      onComplete: () => msPacman.destroy()
    });
  }

  flashMonkeyDamage() {
    if (!this.monkey) {
      return;
    }
    this.monkey.setTintFill(0xff0000);
    this.time.delayedCall(120, () => this.monkey.clearTint());
  }

  dropPacDelorian() {
    if (this.dropStarted) {
      return;
    }

    this.dropStarted = true;
    const startX = this.monkey.x - (this.monkey.displayWidth * 0.2);
    const delorian = this.add.sprite(startX, -200, 'pac-delorian', '0');
    delorian.setDisplaySize(this.monkey.displayWidth * 1.5, this.monkey.displayHeight * 1.5);
    delorian.setDepth(this.monkey.depth + 10);
    delorian.play(PAC_DELORIAN_ANIM);

    this.tweens.add({
      targets: delorian,
      y: this.monkeyHitY,
      duration: 900,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.flashMonkeyDamage();
        this.cameras.main.shake(300, 0.01);
        this.time.delayedCall(800, () => {
          document.dispatchEvent(new CustomEvent('enemy-defeated'));
        });
      }
    });
  }
}
