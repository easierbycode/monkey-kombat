import constants from '../config/constants.js';
import Monkey from '../sprites/monkey.js';


export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  preload() {
    // Load assets directly from file paths
    this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
    this.load.image('monkey', './assets/monkey.png');

    this.load.spritesheet('blood', './assets/blood.png', {
      frameWidth : 88,
      frameHeight: 71,
      endFrame   : 9
    });

    this.load.spritesheet('bone', './assets/bone.png', {
      frameWidth : 18,
      frameHeight: 18
    });

    this.load.spritesheet('rainbowDash', './assets/rainbow-super.png', {
      frameWidth : 69,
      frameHeight: 75,
      endFrame   : 13
    });

    this.load.spritesheet('rainbowCloud', './assets/rainbow-cloud.png', {
      frameWidth : 39,
      frameHeight: 40,
      endFrame   : 14
    });

    this.load.spritesheet('muscle', './assets/muscle.png', {
      frameWidth : 23,
      frameHeight: 22
    });

    // Include blade as well, even if not currently used:
    this.load.spritesheet('blade', './assets/blade.png', {
      frameWidth : 62,
      frameHeight: 208,
      endFrame   : 1
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

    // aboutToAttack animation
    this.anims.create({
      frameRate: 12,
      frames   : this.anims.generateFrameNumbers('rainbowDash', { start: 0, end: 9, first: 0 }),
      key      : 'aboutToAttack'
    });

    // attack animation
    this.anims.create({
      frameRate: 12,
      frames   : this.anims.generateFrameNumbers('rainbowDash', { start: 10, end: 13, first: 10 }),
      key      : 'attack',
      repeat   : -1
    });

    // chill animation
    this.anims.create({
      frameRate: 12,
      frames   : this.anims.generateFrameNumbers('rainbowDash', { start: 0, end: 0, first: 0 }),
      key      : 'chill'
    });

    // rainbowAttack animation
    this.anims.create({
      frameRate: 24,
      frames   : this.anims.generateFrameNumbers('rainbowCloud', { start: 0, end: 14, first: 0 }),
      key      : 'rainbowAttack',
      repeat   : 5
    });

    let rainbowDash = this.add.sprite(
      gameWidth / 2,
      (gameHeight - 37),
      'rainbowDash',
      0
    );

    rainbowDash.on('animationcomplete', (anim, frame) =>
      rainbowDash.emit('animationcomplete_' + anim.key, anim, frame)
    );

    rainbowDash.on('animationcomplete_aboutToAttack', () => {
      let rainbowCloud = this.add.sprite(
        this.monkey.x,
        (this.monkey.body.top - 20) + 5,
        'rainbowCloud',
        0
      );

      rainbowCloud.play('rainbowAttack');

      rainbowCloud.on('animationcomplete', (anim, frame) =>
        rainbowCloud.emit('animationcomplete_' + anim.key, anim, frame)
      );

      rainbowDash.play('attack');

      rainbowCloud.on('animationcomplete_rainbowAttack', () => {
        rainbowCloud.destroy();
        rainbowDash.play('chill');
        this.monkey.destroy();
      });

      this.rainbowCloud = rainbowCloud;
    });

    rainbowDash.play('aboutToAttack');
  }

  update() {
    // cloud lightning effect
    if (!this.rainbowCloud) return;

    let lightning = [0, 1, 3, 4, 9, 10];
    if (lightning.includes(this.rainbowCloud.frame.name)) {
      let color = Phaser.Math.RND.pick([0xe0332c, 0xfdf768, 0x0078c0]);

      this.monkey.setTint(color);
      this.cameras.main.setBackgroundColor(color);
    } else {
      this.monkey.clearTint();
      this.cameras.main.setBackgroundColor(0x000000);
    }
  }

  render() {}
}
