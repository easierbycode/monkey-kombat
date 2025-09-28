import Monkey from '../sprites/monkey.js';

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game12' });
  }

  preload() {
    this.load.atlas('cat-idle', './assets/cat-idle.png', './assets/cat-idle.json');
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
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;

    this.monkey = new Monkey({
      scene: this,
      x: gameWidth,
      y: gameHeight
    });
    this.monkey.x -= this.monkey.displayWidth / 2;

    if (!this.anims.exists('idle')) {
      this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNames('cat-idle', {
          prefix: 'atlas_s',
          start: 0,
          end: 15
        }),
        frameRate: 12,
        repeat: -1
      });
    }

    this.cat = this.add.sprite(0, gameHeight, 'cat-idle', 'atlas_s0');
    this.cat.setOrigin(1, 1);
    this.cat.setScale(6);
    this.cat.setX(this.cat.displayWidth);
    this.cat.play('idle');
  }
}
