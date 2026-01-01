import Monkey from '../sprites/monkey.js';

export default class Nemesis extends Phaser.Scene {
  constructor() {
    super({ key: 'Game13' });
  }

  preload() {
    this.load.spritesheet('nemesis', './assets/nemesis-rocket.png', {
      frameWidth: 130,
      frameHeight: 98,
      endFrame: 6
    });
    this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
    this.load.image('monkey', './assets/monkey.png');
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

    this.anims.create({
      key: 'nemesis-idle',
      frames: this.anims.generateFrameNumbers('nemesis', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: 'nemesis-shoot',
      frames: this.anims.generateFrameNumbers('nemesis', { start: 1, end: 6 }),
      frameRate: 8,
      repeat: 0
    });

    this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNames('explosion', {
            prefix: 'explosion-',
            start: 0,
            end: 11,
            suffix: '.png'
        }),
        frameRate: 24,
        repeat: 0
    });

    this.nemesis = this.add.sprite(0, gameHeight, 'nemesis');
    this.nemesis.setOrigin(0, 1);
    this.nemesis.setScale(2.5);
    this.nemesis.play('nemesis-idle');

    this.time.delayedCall(1000, () => {
      this.nemesis.play('nemesis-shoot');
      this.nemesis.once('animationcomplete', () => {
        this.createRocket();
      });
    });
  }

  createRocket() {
    const rocket = this.add.graphics();
    rocket.fillStyle(0x808080, 1); // Grey
    rocket.fillRect(0, 0, 20, 8);
    rocket.fillStyle(0xff0000, 1); // Red
    rocket.fillTriangle(20, -2, 20, 10, 25, 4);
    const rocketTexture = rocket.generateTexture('rocket');
    rocket.destroy();

    const rocketSprite = this.physics.add.sprite(this.nemesis.x + this.nemesis.displayWidth - 20, this.nemesis.y - this.nemesis.displayHeight / 2 - 40, 'rocket');
    this.physics.moveTo(rocketSprite, this.monkey.x, this.monkey.y, 500);
    this.physics.add.overlap(rocketSprite, this.monkey, this.hitMonkey, null, this);
  }

  hitMonkey(rocket, monkey) {
    const explosion = this.add.sprite(monkey.x, monkey.y, 'explosion');
    explosion.setScale(4);
    explosion.play('explode');
    rocket.destroy();
    monkey.destroy();
    document.dispatchEvent(new CustomEvent('enemy-defeated'));
  }
}
