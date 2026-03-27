import Monkey from '../sprites/monkey.js';

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game19' });
  }

  preload() {
    this.load.atlas('ms-pacman-right', './assets/ms-pacman-right.png', './assets/ms-pacman-right.json');
    this.load.atlas('ms-pacman-left', './assets/ms-pacman-left.png', './assets/ms-pacman-left.json');
    this.load.atlas('pacman-ghost-right', './assets/pacman-ghost-right.png', './assets/pacman-ghost-right.json');
    this.load.image('pacman-cherry', './assets/pacman-cherry.png');
    this.load.image('pacman-banana', './assets/pacman-banana.png');
    this.load.image('pacman-pretzel', './assets/pacman-pretzel.png');
    this.load.image('pacman-key', './assets/pacman-key.png');
    this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
    this.load.image('monkey', './assets/monkey.png');
    this.load.spritesheet('bone', './assets/bone.png', {
      frameWidth: 18,
      frameHeight: 18
    });
    this.load.spritesheet('muscle', './assets/muscle.png', {
      frameWidth: 23,
      frameHeight: 22
    });
    this.load.spritesheet('blood', './assets/blood.png', {
      frameWidth: 88,
      frameHeight: 71,
      endFrame: 9
    });
  }

  create() {
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;

    this.cameras.main.setBackgroundColor('#000000');

    this.monkey = new Monkey({
      scene: this,
      x: gameWidth,
      y: gameHeight
    });
    this.monkey.x -= this.monkey.displayWidth / 2;

    const monkeyCenterY = this.monkey.y - this.monkey.displayHeight / 2;

    // Pellet dots
    const dots = this.add.graphics();
    dots.fillStyle(0xffff00, 1);
    for (let px = 18; px < gameWidth; px += 18) {
      if (Math.abs(px - this.monkey.x) > 25) {
        dots.fillCircle(px, monkeyCenterY, 2);
      }
    }

    // Food items
    const foodKeys = ['pacman-cherry', 'pacman-banana', 'pacman-pretzel', 'pacman-key', 'pacman-cherry', 'pacman-banana'];
    for (let i = 0; i < 6; i++) {
      const fx = gameWidth * 0.10 + (gameWidth * 0.65) * (i / 5);
      this.add.image(fx, monkeyCenterY, foodKeys[i]).setScale(3);
    }

    // Animations
    if (!this.anims.exists('pacman-chomp-right')) {
      this.anims.create({
        key: 'pacman-chomp-right',
        frames: this.anims.generateFrameNames('ms-pacman-right', {
          prefix: 'atlas_s',
          start: 0,
          end: 2
        }),
        frameRate: 10,
        repeat: -1,
        yoyo: true
      });
    }

    if (!this.anims.exists('pacman-chomp-left')) {
      this.anims.create({
        key: 'pacman-chomp-left',
        frames: this.anims.generateFrameNames('ms-pacman-left', {
          prefix: 'atlas_s',
          start: 0,
          end: 2
        }),
        frameRate: 10,
        repeat: -1,
        yoyo: true
      });
    }

    if (!this.anims.exists('ghost-right')) {
      this.anims.create({
        key: 'ghost-right',
        frames: this.anims.generateFrameNames('pacman-ghost-right', {
          prefix: 'atlas_s',
          start: 0,
          end: 1
        }),
        frameRate: 6,
        repeat: -1
      });
    }

    // Ms. Pac-Man
    const pacman = this.add.sprite(-60, monkeyCenterY, 'ms-pacman-right', 'atlas_s0');
    pacman.setScale(6);
    pacman.play('pacman-chomp-right');

    // Ghosts
    const ghostTints = [0xff0000, 0xff69b4, 0x00ffff];
    const ghostStartXs = [-110, -180, -250];
    const ghosts = ghostStartXs.map((startX, i) => {
      const ghost = this.add.sprite(startX, monkeyCenterY, 'pacman-ghost-right', 'atlas_s0');
      ghost.setScale(6);
      ghost.setTint(ghostTints[i]);
      ghost.play('ghost-right');
      return ghost;
    });

    // Movement
    const speed = 80; // px/sec
    const pacmanTargetX = this.monkey.x - this.monkey.displayWidth / 2;
    const pacmanDistance = pacmanTargetX - (-60);
    const duration = (pacmanDistance / speed) * 1000;

    const ghostTargetXs = [
      pacmanTargetX - 60,
      pacmanTargetX - 130,
      pacmanTargetX - 200
    ];

    // Ms. Pac-Man tween
    this.tweens.add({
      targets: pacman,
      x: pacmanTargetX,
      ease: 'Linear',
      duration,
      onComplete: () => {
        this.monkey.destroy();
        document.dispatchEvent(new CustomEvent('enemy-defeated'));

        this.time.delayedCall(350, () => {
          pacman.play('pacman-chomp-left');
          this.tweens.add({
            targets: pacman,
            x: -100,
            ease: 'Linear',
            duration: duration * 0.8
          });
        });
      }
    });

    // Ghost tweens
    ghosts.forEach((ghost, i) => {
      this.tweens.add({
        targets: ghost,
        x: ghostTargetXs[i],
        ease: 'Linear',
        duration,
        onComplete: () => {
          this.time.delayedCall(400 + i * 100, () => {
            ghost.setFlipX(true);
            this.tweens.add({
              targets: ghost,
              x: -250,
              ease: 'Linear',
              duration: duration * 0.8,
              onComplete: () => {
                ghost.destroy();
              }
            });
          });
        }
      });
    });
  }
}
