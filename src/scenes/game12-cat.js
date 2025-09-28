import Monkey from '../sprites/monkey.js';

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game12' });
  }

  preload() {
    this.load.atlas('cat-idle', './assets/cat-idle.png', './assets/cat-idle.json');
    this.load.atlas('cat-teleport', './assets/cat-teleport.png', './assets/cat-teleport.json');
    this.load.atlas('cat-hat', './assets/cat-hat.png', './assets/cat-hat.json');
    this.load.atlas('cat-blow', './assets/cat-blow.png', './assets/cat-blow.json');
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

    const idleFrameRate = 12;
    const idleFrames = this.anims.generateFrameNames('cat-idle', {
      prefix: 'atlas_s',
      start: 0,
      end: 15
    });

    if (!this.anims.exists('idle')) {
      this.anims.create({
        key: 'idle',
        frames: idleFrames,
        frameRate: idleFrameRate,
        repeat: -1
      });
    }

    const idleLoopDuration = idleFrames.length / idleFrameRate;
    const idlePrepRepeat = Math.max(0, Math.ceil(4 / idleLoopDuration) - 1);

    if (!this.anims.exists('cat-idle-prep')) {
      this.anims.create({
        key: 'cat-idle-prep',
        frames: idleFrames,
        frameRate: idleFrameRate,
        repeat: idlePrepRepeat
      });
    }

    if (!this.anims.exists('cat-teleport-intro')) {
      this.anims.create({
        key: 'cat-teleport-intro',
        frames: this.anims.generateFrameNames('cat-teleport', {
          prefix: 'atlas_s',
          start: 0,
          end: 5
        }),
        frameRate: 12,
        repeat: 0,
        yoyo: true
      });
    }

    if (!this.anims.exists('cat-teleport')) {
      this.anims.create({
        key: 'cat-teleport',
        frames: this.anims.generateFrameNames('cat-teleport', {
          prefix: 'atlas_s',
          start: 0,
          end: 11
        }),
        frameRate: 12,
        repeat: 0
      });
    }

    if (!this.anims.exists('cat-hat-outro')) {
      this.anims.create({
        key: 'cat-hat-outro',
        frames: this.anims.generateFrameNames('cat-hat', {
          prefix: 'atlas_s',
          start: 9,
          end: 11
        }),
        frameRate: 12,
        repeat: 0
      });
    }

    if (!this.anims.exists('cat-hat-intro')) {
      this.anims.create({
        key: 'cat-hat-intro',
        frames: this.anims.generateFrameNames('cat-hat', {
          prefix: 'atlas_s',
          start: 0,
          end: 4
        }),
        frameRate: 12,
        repeat: 0
      });
    }

    if (!this.anims.exists('cat-blow-main')) {
      this.anims.create({
        key: 'cat-blow-main',
        frames: [
          { key: 'cat-blow', frame: 'atlas_s7' },
          { key: 'cat-blow', frame: 'atlas_s0' },
          { key: 'cat-blow', frame: 'atlas_s1' },
          { key: 'cat-blow', frame: 'atlas_s2' },
          { key: 'cat-blow', frame: 'atlas_s3' }
        ],
        frameRate: 3,
        repeat: -1
      });
    }

    this.cat = this.add.sprite(0, gameHeight, 'cat-idle', 'atlas_s0');
    this.cat.setScale(6);

    const collectFrameWidths = (textureKey, start, end) => {
      const texture = this.textures.get(textureKey);
      if (!texture || typeof texture.get !== 'function') {
        return [];
      }

      const widths = [];
      for (let index = start; index <= end; index += 1) {
        const frameName = `atlas_s${index}`;
        const frame = texture.get(frameName);
        if (frame && typeof frame.width === 'number') {
          widths.push(frame.width);
        }
      }
      return widths;
    };

    const frameWidths = [
      ...collectFrameWidths('cat-idle', 0, 15),
      ...collectFrameWidths('cat-teleport', 0, 11),
      ...collectFrameWidths('cat-blow', 0, 7)
    ];
    const maxFrameWidth = frameWidths.reduce((max, width) => Math.max(max, width), 0);
    const anchoredRightX = maxFrameWidth * this.cat.scaleX;

    const alignCat = () => {
      this.cat.setOrigin(1, 1);
      this.cat.setX(anchoredRightX);
      this.cat.setY(gameHeight);
    };
    alignCat();

    this.cat.on('animationupdate', alignCat);
    this.cat.on('animationcomplete', alignCat);
    this.cat.on('animationstart-cat-teleport', alignCat);
    this.cat.on('animationstart-cat-teleport-intro', alignCat);
    this.cat.on('animationstart-cat-idle-prep', alignCat);
    this.cat.on('animationstart-cat-blow-main', alignCat);
    this.cat.on('animationstart-idle', alignCat);

    this.hatSequenceStarted = false;

    const startHatSequence = () => {
      if (this.hatSequenceStarted) {
        return;
      }
      this.hatSequenceStarted = true;

      this.cat.play('cat-blow-main');

      const hatX = this.monkey.x;
      const hatY = this.monkey.y - this.monkey.displayHeight - 10;

      this.catHat = this.add.sprite(hatX, hatY, 'cat-hat', 'atlas_s0');
      this.catHat.setOrigin(0.5, 1);
      this.catHat.setScale(6);
      this.catHat.setDepth(5);

      this.catHat.play('cat-hat-intro');
      this.catHat.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (introAnimation) => {
        if (introAnimation.key !== 'cat-hat-intro') {
          return;
        }

        const hatFrames = ['atlas_s5', 'atlas_s6', 'atlas_s7'];
        let hatFrameIndex = 0;

        const onBlowCycle = (animation) => {
          if (animation.key !== 'cat-blow-main') {
            return;
          }

          this.catHat.setFrame(hatFrames[hatFrameIndex]);
          hatFrameIndex += 1;

          if (hatFrameIndex >= hatFrames.length) {
            this.cat.off(Phaser.Animations.Events.ANIMATION_REPEAT, onBlowCycle);
            this.time.delayedCall(100, () => {
              this.cat.stop();
              const y = this.game.config.height;
              this.tweens.add({
                targets: [this.catHat],
                y,
                ease: Phaser.Math.Easing.Cubic.In,
                duration: 500,
                onComplete: () => {
                  this.cameras.main.shake(200, 0.01);
                  this.time.delayedCall(250, () => {
                    this.monkey.destroy();
                    this.catHat.play('cat-hat-outro');
                    this.catHat.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (outroAnimation) => {
                      if (outroAnimation.key === 'cat-hat-outro') {
                        this.cat.play('idle');
                      }
                    });
                  });
                }
              });
            });
          }
        };

        this.cat.on(Phaser.Animations.Events.ANIMATION_REPEAT, onBlowCycle);
      });
    };

    this.cat.on('animationcomplete-cat-idle-prep', startHatSequence);

    this.cat.on('animationcomplete-cat-teleport-intro', () => {
      this.cat.play('cat-teleport');
    });
    this.cat.on('animationcomplete-cat-teleport', () => {
      this.cat.play('cat-idle-prep');
    });

    this.cat.play('cat-teleport-intro');
  }
}
