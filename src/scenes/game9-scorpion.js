import Spear from '../sprites/spear.js';
import Scorpion from '../sprites/scorpion.js';
import Monkey from '../sprites/monkey.js';


export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  preload() {
    // Audio
    this.load.audio('bombDrop', '../assets/mk3-00805-bomb-drop.wav');
    this.load.audio('bombEject', '../assets/mk3-00695-bomb-eject.wav');
    this.load.audio('bombExplosion', '../assets/mk3-00500-explosion.wav');

    // Spritesheets and Images
    this.load.atlas('game_asset', '../assets/game_asset.png', '../assets/game_asset.json');
    
    this.load.atlas('explosion', '../assets/explosion.png', '../assets/explosion.json');

    this.load.image('monkey', '../assets/monkey.png');
    this.load.spritesheet('blood', '../assets/blood.png', {
      frameWidth: 88,
      frameHeight: 71,
      endFrame: 9
    });
    this.load.spritesheet('bone', '../assets/bone.png', {
      frameWidth: 18,
      frameHeight: 18
    });
    this.load.spritesheet('muscle', '../assets/muscle.png', {
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
    this.monkey.health = 40;

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
    this.physics.overlap(this.spear, this.monkey, this.hitEnemy, this.checkBulletVsEnemy, this);
    this.spear.update();
  }

  checkBulletVsEnemy(bullet, enemy) {
    return bullet.active && enemy.active;
  }

  hitEnemy(bullet, enemy) {
    let isDead = enemy.damage(bullet);
    if (isDead) {
      this.scorpion.victoryDance();
      bullet.destroy();
    }
  }
}
