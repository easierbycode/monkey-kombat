import Spear from '../sprites/spear.js';
import Scorpion from '../sprites/scorpion.js';
import Suzie from '../sprites/suzie.js';


export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game17' });
  }

  preload() {
    this.load.audio('bombDrop', './assets/mk3-00805-bomb-drop.wav');
    this.load.audio('bombEject', './assets/mk3-00695-bomb-eject.wav');
    this.load.audio('bombExplosion', './assets/mk3-00500-explosion.wav');

    this.load.atlas('game_asset', './assets/game_asset.png', './assets/game_asset.json');
    this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');

    this.load.spritesheet('suzie-idle', './assets/suzie-idle.png', {
      frameWidth: 70,
      frameHeight: 244,
      endFrame: 0
    });

    this.load.spritesheet('suzie-idle2', './assets/suzie-idle2.png', {
      frameWidth: 117,
      frameHeight: 223,
      endFrame: 2
    });

    this.load.spritesheet('suzie-fall', './assets/suzie-fall.png', {
      frameWidth: 96,
      frameHeight: 113,
      endFrame: 2
    });

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

    this.suzie = new Suzie({
      scene: this,
      x: gameWidth,
      y: gameHeight
    });
    this.suzie.x -= this.suzie.displayWidth / 2;

    this.scorpion = new Scorpion({
      scene: this,
      x: 0,
      y: gameHeight
    });

    this.spear = new Spear({
      scene: this,
      x: 123 + (17 / 2),
      y: this.scorpion.y - (this.scorpion.displayHeight) + (10 / 2) + 24
    });
  }

  update() {
    this.physics.overlap(this.spear, this.suzie, this.hitEnemy, this.checkBulletVsEnemy, this);
    this.spear.update();
  }

  checkBulletVsEnemy(bullet, enemy) {
    return bullet.active && enemy.active;
  }

  hitEnemy(bullet, enemy) {
    const isDead = enemy.damage(bullet);
    if (isDead) {
      this.scorpion.victoryDance();
      document.dispatchEvent(new CustomEvent('enemy-defeated'));
      bullet.destroy();
    }
  }
}
