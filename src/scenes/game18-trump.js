import CountryBoxRoulette from '../sprites/country-box-roulette.js';

const COUNTRY_BOX_ROULETTE_KEY = 'country-box-roulette';
const COUNTRY_BOX_ROULETTE_FRAME_SIZE = 32;

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game18' });
  }

  preload() {
    // 62x79
    this.load.image('oil-barrel', './assets/oil-barrel.png');
    this.load.image('particle', './assets/particle.png');
    this.load.spritesheet('clownCar', './assets/clownCar.png', { frameWidth: 64, frameHeight: 92 });
    this.load.spritesheet(COUNTRY_BOX_ROULETTE_KEY, './assets/country-roulette-box.png', {
      frameWidth: COUNTRY_BOX_ROULETTE_FRAME_SIZE,
      frameHeight: COUNTRY_BOX_ROULETTE_FRAME_SIZE,
      endFrame: 2
    });
    this.load.spritesheet('exxon', './assets/exxon.png', {
      frameWidth: 188,
      frameHeight: 210,
      endFrame: 2
    });
    this.load.spritesheet('oil-barrel-flame', './assets/oil-barrel-flame.png', {
      frameWidth: 30,
      frameHeight: 59,
      endFrame: 2
    });
    this.load.spritesheet('coin', './assets/coin.png', { frameWidth: 54, frameHeight: 54 });
    this.load.spritesheet('coin-impact', './assets/coin-impact.png', { frameWidth: 20, frameHeight: 16 });
    this.load.audio('coin-sound', './assets/coin.mp3');
  }

  popCoin() {
    const coin = this.coins.create(
      this.countryBoxRoulette.x,
      this.countryBoxRoulette.y,
      'coin'
    );
    coin.setScale(0.5);
    coin.play('coin-spin');
    coin.setCollideWorldBounds(true);
    coin.setBounce(0.6);

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.Between(80, 200);
    coin.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Grace period: ignore clown car overlap right after spawn
    coin._justSpawned = true;
    this.time.delayedCall(300, () => { if (coin.active) coin._justSpawned = false; });

    // Auto-destroy coins that fly off screen or are never collected
    this.time.delayedCall(4000, () => { if (coin.active) coin.destroy(); });

    this.sound.play('coin-sound');
  }

  onCoinHitClownCar(coin) {
    if (!coin.active || coin._justSpawned) return;
    const x = coin.x;
    const y = coin.y;
    coin.destroy();

    // Coin-impact sprite
    const impact = this.add.sprite(x, y, 'coin-impact').setScale(2);
    impact.play('coin-impact-anim');
    impact.once('animationcomplete', () => impact.destroy());

    // Barrel FX: apply a fading glow to the clown car (same effect as barrel flame)
    if (this.clownCar && this.clownCar.active) {
      if (!this.clownCar.filters) {
        this.clownCar.enableFilters();
      }
      const glow = this.clownCar.filters.external.addGlow(0xFBF236, 0.8, 0.5, 1, 0.0);
      this.tweens.add({
        targets: glow,
        outerStrength: 0,
        innerStrength: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          if (this.clownCar && this.clownCar.active && this.clownCar.filters) {
            this.clownCar.filters.external.remove(glow);
          }
        }
      });
    }
  }

  lightning() {
    // Ensure camera exists before applying effects
    if (!this.cameras.main) return;
    // Use hex color codes directly
    this.cameras.main.setBackgroundColor(0xabf2ea);
    this.cameras.main.flash(17, 0x000000);
    this.time.delayedCall(1, () => this.cameras.main?.setBackgroundColor(0xfefbff));
    this.time.delayedCall(16, () => this.cameras.main?.flash(34, 0xfefbff));
    this.time.delayedCall(16 * 2, () => this.cameras.main?.setBackgroundColor(0xfefbff));
    this.time.delayedCall(16 * 3, () => this.cameras.main?.setBackgroundColor(0x9fa3c4));
    this.time.delayedCall(64, () => this.cameras.main?.setBackgroundColor(0x7d81a2));
    this.time.delayedCall(64 + 80, () => {
      if (this.cameras.main) {
        this.cameras.main.setBackgroundColor(0x5d6081);
        this.cameras.main.flash(1, 0x000000, true, () => { this.cameras.main?.shake(17, 0.0035); });
      }
    });
    this.time.delayedCall(64 + (80 * 2), () => this.cameras.main?.setBackgroundColor(0x3c4061));
    this.time.delayedCall(64 + (80 * 3), () => this.cameras.main?.setBackgroundColor(0x000000));
  }

  create() {
    this.currentWidth = this.game.config.width;
    this.currentHeight = this.game.config.height;

    this.countryBoxRoulette = new CountryBoxRoulette({
      scene: this,
      x: this.currentWidth / 2,
      y: this.currentHeight * 0.45
    });

    this.barrel = this.physics.add.sprite(this.currentWidth * 0.75, this.currentHeight * 0.75, 'oil-barrel');
    this.barrelFlame = this.add.sprite(this.barrel.getTopRight().x - 3, this.barrel.getTopRight().y + 8, 'oil-barrel-flame').setOrigin(1, 1);
    this.barrelFlame.enableFilters();
    this.barrelFlame.anims.create({
      key: 'default',
      frames: this.anims.generateFrameNumbers('oil-barrel-flame', { start: 0, end: 2 }),
      frameRate: 19,
      repeat: -1
    });
    this.barrelFlame.play('default');

    if (this.barrelFlame.filters) {
      
      // addGlow(tint, outerStrength, innerStrength, scale, knockout)
      const glow = this.barrelFlame.filters.external.addGlow(0xFBF236, 0.0, 1, 1, 0.0)

      this.tweens.add({
        targets: glow,
        outerStrength: { from: 0.29, to: 0.66 },
        duration: 100,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }

    // Coin animations
    this.anims.create({
      key: 'coin-spin',
      frames: this.anims.generateFrameNumbers('coin'),
      frameRate: 20,
      repeat: -1
    });
    this.anims.create({
      key: 'coin-impact-anim',
      frames: this.anims.generateFrameNumbers('coin-impact'),
      duration: 500,
      hideOnComplete: true
    });

    // Coins physics group
    this.coins = this.physics.add.group();

    // Give the country box a static physics body for overlap detection
    this.physics.add.existing(this.countryBoxRoulette, true);

    this._boxCooldown = false;

    this.physics.world.setBounds(0, 0, this.currentWidth, this.currentHeight, true, true, false, false);
    const colors = [0xffbb33, 0xd4af37, 0xfcdb06, 0xeeaa00, 0xeecc66, 0xff0000];

    let emitterConfig = {
      speed: 50,
      scale: { start: 0.75, end: 0 },
      blendMode: 'ADD',
      tint: {
        onUpdate: (particle, key, value) => {
          return Phaser.Utils.Array.GetRandom(colors);
        }
      },
      frequency: 10
    };
    // Create emitter using the new syntax: scene.add.particles(x, y, texture, config)
    this.emitter = this.add.particles(0, 0, 'particle', emitterConfig);

    this.clownCar = this.physics.add.sprite(this.currentWidth / 2, this.currentHeight * 0.5, 'clownCar').setFlipX(true).setOrigin(0.5, 0.95);
    this.clownCar.anims.create({
      key: 'default',
      frames: this.anims.generateFrameNumbers('clownCar', { start: 1, end: 2 }),
      frameRate: 4,
      repeat: -1
    });
    this.clownCar.play('default');

    this.tweens.add({
      targets: this.clownCar,
      y: this.clownCar.y - 10,
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    this.clownCar.setVelocity(20, 0);
    this.clownCar.setBounce(1);
    this.clownCar.body.setCollideWorldBounds(true, -1, 0, true);

    // Use 'worldbounds' event from the physics world
    this.physics.world.on('worldbounds', (body, up, down, left, right) => {
      // Check if the colliding body is our logo's body
      if (body === this.clownCar.body) {
        if (left || right) {
          this.clownCar.flipX = !this.clownCar.flipX;
          // Ensure velocity exists before trying to access it
          if (this.clownCar.body.velocity) {
            this.clownCar.setVelocityX(-this.clownCar.body.velocity.x);
          }
        }
      }
    });


    // Clown car hits mushroom box → pop coin
    this.physics.add.overlap(this.clownCar, this.countryBoxRoulette, () => {
      if (this._boxCooldown) return;
      this._boxCooldown = true;
      this.popCoin();
      this.time.delayedCall(2000, () => { this._boxCooldown = false; });
    });

    // Coin hits clown car → coin-impact + barrel FX
    this.physics.add.overlap(this.coins, this.clownCar, (coin) => {
      this.onCoinHitClownCar(coin);
    });

    this.emitter.startFollow(this.clownCar);

    // Flash camera after 8 seconds
    this.time.addEvent({
      delay: 8000,
      callback: () => {
        this.lightning();
        this.time.delayedCall(1300, () => this.lightning());
      },
      loop: true // Use loop: true instead of repeat: -1
    });

    // Disable world bounds and make logo appear to move away from the camera after 21 seconds
    this.time.addEvent({
      delay: 21000,
      callback: () => {
        if (!this.physics.world) return; // Guard
        this.physics.world.setBoundsCollision(false, false, false, false);
        if (!this.clownCar || !this.clownCar.active) return; // Guard logo
        this.tweens.add({
          targets: this.clownCar,
          scale: 1.25,
          alpha: 0.8,
          duration: 3000,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            if (!this.clownCar || !this.clownCar.active) return; // Guard logo again
            this.tweens.add({
              targets: this.clownCar,
              scale: 8,
              alpha: 1,
              y: -400,
              duration: 3000,
              ease: 'Sine.easeInOut',
              onComplete: () => {
                if (this.emitter) this.emitter.destroy();
                if (this.clownCar) this.clownCar.destroy();
                this.emitter = null; // Clear reference
                document.dispatchEvent(new CustomEvent('enemy-defeated'));
              }
            });
          }
        });
      }
    });
  }
}
