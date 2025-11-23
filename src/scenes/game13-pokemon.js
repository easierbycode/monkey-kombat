import Monkey from '../sprites/monkey.js';

const RED_ATLAS_KEY = 'red-walk-right';
const WALK_ANIM_KEY = 'pokemon-red-walk';

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game13' });
  }

  preload() {
    this.load.atlas(RED_ATLAS_KEY, './assets/red-walk-right.png', './assets/red-walk-right.json');
    this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
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
    const targetY = this.monkey.y - this.monkey.displayHeight + 30;

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
            pokeball.destroy();
          }
        });
      }
    });
  }

  computeRedTargetX() {
    const monkeyOriginOffset = this.monkey.displayWidth * this.monkey.originX;
    const monkeyLeftEdge = this.monkey.x - monkeyOriginOffset;
    const redOriginOffset = this.red.displayWidth * this.red.originX;
    return monkeyLeftEdge - 20 - redOriginOffset;
  }
}
