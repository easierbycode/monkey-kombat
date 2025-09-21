import constants from '../config/constants.js';
import Animus from '../sprites/animus.js';
import Monkey from '../sprites/monkey.js';


export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  preload() {
    // Audio
    this.load.audio('bladeHitSound', '../assets/blade-hit.wav');

    // Spritesheets and Images
    this.load.atlas('explosion', '../assets/explosion.png', '../assets/explosion.json');
    this.load.image('monkey', '../assets/monkey.png');

    this.load.spritesheet('animus', '../assets/animus.png', {
      frameWidth : 110,
      frameHeight: 155,
      endFrame   : 15
    });

    this.load.spritesheet('blade', '../assets/blade.png', {
      frameWidth : 62,
      frameHeight: 208,
      endFrame   : 1
    });

    this.load.spritesheet('blood', '../assets/blood.png', {
      frameWidth : 88,
      frameHeight: 71,
      endFrame   : 9
    });

    this.load.spritesheet('bloodPuddle', '../assets/blood-puddle.png', {
      frameWidth : 185,
      frameHeight: 187,
      endFrame   : 4
    });

    this.load.spritesheet('bloodSplat', '../assets/blood-splat.png', {
      frameWidth : 158,
      frameHeight: 176,
      endFrame   : 9
    });

    this.load.spritesheet('bone', '../assets/bone.png', {
      frameWidth : 18,
      frameHeight: 18
    });

    this.load.spritesheet('muscle', '../assets/muscle.png', {
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
      y: gameHeight - 70
    });

    this.monkey.x -= this.monkey.displayWidth / 2;

    this.animus = new Animus({
      scene : this,
      x     : (gameWidth - 55),
      y     : (gameHeight - 77),
      victim: this.monkey
    });
  }

  update() {
    this.animus.update();
  }

  render() {}
}
