import constants from '../config/constants.js';
import Monkey from '../sprites/monkey.js';


export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  preload() {
    this.load.atlas('explosion', '../assets/explosion.png', '../assets/explosion.json');
    this.load.image('headlessMonkey', '../assets/monkey-headless.png');
    this.load.image('monkey', '../assets/monkey.png');

    this.load.spritesheet('blood', '../assets/blood.png', {
      frameWidth : 88,
      frameHeight: 71,
      endFrame   : 9
    });

    this.load.spritesheet('bone', '../assets/bone.png', {
      frameWidth : 18,
      frameHeight: 18
    });

    this.load.spritesheet('liuKang', '../assets/liu-kang.png', {
      frameWidth : 129,
      frameHeight: 169,
      endFrame   : 12
    });

    this.load.spritesheet('liuKangIdle', '../assets/liu-kang-idle.png', {
      frameWidth : 42,
      frameHeight: 100,
      endFrame   : 5
    });

    this.load.spritesheet('muscle', '../assets/muscle.png', {
      frameWidth : 23,
      frameHeight: 22
    });

    this.load.spritesheet('blade', '../assets/blade.png', {
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

    // chillin animation
    this.anims.create({
      frameRate      : 12,
      frames         : this.anims.generateFrameNumbers('liuKangIdle', {
        start : 0,
        end   : 5,
        first : 0
      }),
      hideOnComplete : true,
      key            : 'chillin',
      repeat         : -1
    });

    // dragon morph animation
    this.anims.create({
      frameRate : 12,
      frames    : this.anims.generateFrameNumbers('liuKang', {
        start : 0,
        end   : 9,
        first : 0
      }),
      key       : 'dragonMorph'
    });

    // dragon bite animation
    this.anims.create({
      frameRate : 12,
      frames    : this.anims.generateFrameNumbers('liuKang', {
        start : 10,
        end   : 12,
        first : 10
      }),
      key       : 'dragonBite'
    });

    let liuKang = this.add.sprite(
      gameWidth - 40,
      gameHeight,
      'liuKang',
      0
    );

    liuKang.setOrigin(1, 1);

    liuKang.on('animationcomplete', (anim, frame) => 
      liuKang.emit('animationcomplete_' + anim.key, anim, frame)
    );

    liuKang.play('dragonMorph');

    liuKang.once('animationcomplete_dragonMorph', () => {
      this.time.delayedCall(
        1000,
        () => {
          liuKang.play('dragonBite');
        }
      );
    });

    liuKang.on('animationcomplete_dragonBite', () => {
      this.monkey.setTexture('headlessMonkey');

      // This assumes monkey class has bloodAnimation method
      this.monkey.bloodAnimation();

      this.time.delayedCall(
        750,
        () => {
          this.monkey.destroy();
        }
      );

      liuKang.once('animationcomplete_dragonMorph', () => {
        liuKang.alpha = 0;

        let liuKangIdle = this.add.sprite(
          liuKang.getBottomLeft().x,
          liuKang.getBottomLeft().y,
          'liuKangIdle',
          0
        );

        liuKangIdle.setOrigin(0, 1);
        liuKangIdle.play('chillin');
      });

      this.time.delayedCall(
        500,
        () => {
          liuKang.anims.playReverse('dragonMorph');
        }
      );
    });
  }

  update() {}

  render() {}
}
