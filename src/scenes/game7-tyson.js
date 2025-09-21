import Monkey from '../sprites/monkey.js'
import Tyson from '../sprites/tyson.js'

export default class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    preload() {
        // Load assets directly via Phaser loader methods
        this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
        this.load.image('monkey', './assets/monkey.png');
      
        this.load.spritesheet('blood', './assets/blood.png', {
            frameWidth: 88,
            frameHeight: 71,
            endFrame: 9
        });

        this.load.spritesheet('tyson', './assets/tyson.png', {
            frameWidth : 55,
            frameHeight: 122,
            endFrame   : 12
        });

        this.load.image('monkey-headless', './assets/monkey-headless.png');
        this.load.image('monkey-head', './assets/monkey-head.png');
    }

    create() {
        this.tyson = new Tyson({
            scene : this,
            x     : (this.game.config.width - 27) - 20,
            y     : (this.game.config.height - 61) - 50
        });

        this.monkey = new Monkey({
            scene: this,
            x    : this.game.config.width,
            y    : this.game.config.height
        });

        this.monkey.x -= this.monkey.displayWidth / 2;
        
        // Listen for uppercut event and play effect directly 
        // (instead of checking for collision)
        this.tyson.on('uppercut', this.playUppercutEffect, this);
    }

    playUppercutEffect() {
        // Create the head at monkey's position, adjusting for proper alignment
        const headX = this.monkey.x;
        
        // Adjust this multiplier to position the head lower on the monkey
        const headY = this.monkey.y - (this.monkey.displayHeight * 0.3); 
        
        // Play blood animation when the uppercut connects
        this.addBloodEffect(headX, headY);
        
        const head = this.add.image(headX, headY, 'monkey-head');
        
        // Set the origin to match how the head should attach to the body
        head.setOrigin(0.5, 1);
        
        // Set the head to the same scale as the monkey
        head.setScale(6);
        
        // Switch monkey to headless version
        this.monkey.setTexture('monkey-headless');
        
        // Create explosion flash particle emitter at head position
        const explosionFlash = this.add.particles(0, 0, 'explosion', {
            frame: 'muzzleflash2',
            lifespan: 200,
            scale: { start: 4, end: 0 },
            rotate: { start: 0, end: 180 },
            emitting: false
        });
        
        // Make explosion follow the head
        explosionFlash.startFollow(head);
        
        // Add spinning animation to the head as it flies toward screen
        this.tweens.add({
            targets: head,
            x: this.cameras.main.centerX,
            y: this.cameras.main.centerY,
            scale: 12.0,
            rotation: Math.PI * 6, // 3 full rotations (6π radians)
            duration: 700,
            ease: 'Power1',
            onComplete: () => {
                // Trigger explosion flash effect
                explosionFlash.explode(1);
                // Stop following before the head slides down
                explosionFlash.stopFollow();
                
                // Shake camera
                this.cameras.main.shake(200, 0.03);
                
                // Slide head down screen
                this.tweens.add({
                    targets: head,
                    y: this.game.config.height + head.height,
                    duration: 800,
                    delay: 100,
                    ease: 'Bounce.Out',
                    onComplete: () => {
                        explosionFlash.destroy();
                        head.destroy();
                    }
                });
            }
        });
    }

    // Helper method to create blood animation
    addBloodEffect(x, y) {
        const blood = this.add.sprite(x, y, 'blood')
            .setScale(2.5);
            
        blood.play('bloodAnimation');
        
        // Clean up the sprite when animation completes
        blood.on('animationcomplete', () => {
            blood.destroy();
        });
    }
}
