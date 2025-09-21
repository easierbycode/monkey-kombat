import constants from '../config/constants.js';
import Monkey from '../sprites/monkey.js';
import Parabomb from '../sprites/parabomb.js';


export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  preload() {
    // Audio
    this.load.audio('bombExplosion', './assets/mk3-00500-explosion.wav');

    // Spritesheets and Images
    this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
    this.load.image('monkey', './assets/monkey.png');

    this.load.spritesheet('parabomb', './assets/parabomb.png', {
      frameWidth : 34,
      frameHeight: 42,
      endFrame   : 18
    });

    this.load.spritesheet('blood', './assets/blood.png', {
      frameWidth : 88,
      frameHeight: 71,
      endFrame   : 9
    });
    this.load.spritesheet('bone', './assets/bone.png', {
      frameWidth : 18,
      frameHeight: 18
    });
    this.load.spritesheet('muscle', './assets/muscle.png', {
      frameWidth : 23,
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

    this.parabomb = new Parabomb({
      scene: this,
      x: 53,
      y: 58
    });
  }

  update() {
    this.physics.overlap(this.parabomb, this.monkey, this.hitEnemy, this.checkBulletVsEnemy, this);
    this.parabomb.update();
  }

  render() {}

  checkBulletVsEnemy(bullet, enemy) {
    return bullet.active && enemy.active;
  }

  hitEnemy(bullet, enemy) {
    enemy.active = false;
    bullet.destroy(bullet, enemy);
  }
}
