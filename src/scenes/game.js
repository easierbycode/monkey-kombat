import constants from '../config/constants.js';
import Bomb from '../sprites/bomb.js';
import Cyrax from '../sprites/cyrax.js';
import Monkey from '../sprites/monkey.js';


export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  preload() {
    // Audio
    this.load.audio('bombDrop', './assets/mk3-00805-bomb-drop.wav');
    this.load.audio('bombEject', './assets/mk3-00695-bomb-eject.wav');
    this.load.audio('bombExplosion', './assets/mk3-00500-explosion.wav');

    // Spritesheets and Images
    this.load.spritesheet('bomb', './assets/bomb.png', {
      frameWidth: 10,
      frameHeight: 11,
      endFrame: 5
    });
    this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
    this.load.spritesheet('cyrax', './assets/cyrax.png', {
      frameWidth: 35,
      frameHeight: 100,
      endFrame: 3
    });
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

    this.cyrax = new Cyrax({
      scene: this,
      x: 0,
      y: gameHeight
    });

    this.bomb = new Bomb({
      scene: this,
      x: this.cyrax.x + (this.cyrax.width - 3),
      y: this.cyrax.y - (this.cyrax.height / 2) - 20
    });
  }

  update() {
    this.physics.overlap(this.bomb, this.monkey, this.hitEnemy, this.checkBulletVsEnemy, this);
    this.bomb.update();
  }

  render() {}

  checkBulletVsEnemy(bullet, enemy) {
    return bullet.active && enemy.active;
  }

  hitEnemy(bullet, enemy) {
    let isDead = enemy.damage(bullet);
    if (isDead) {
      this.cyrax.victoryDance();
      document.dispatchEvent(new CustomEvent('enemy-defeated'));
    }
    bullet.destroy();
  }
}
