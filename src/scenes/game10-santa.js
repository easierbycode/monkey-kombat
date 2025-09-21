import Monkey from '../sprites/monkey.js';

export default class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    preload() {
        this.load.atlas('explosion', '../assets/explosion.png', '../assets/explosion.json');
        this.load.atlas('santa', '../assets/santa.png', '../assets/santa.json');
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

        // Create monkey in bottom right
        this.monkey = new Monkey({
            scene: this,
            x: gameWidth,
            y: gameHeight
        });
        this.monkey.x -= this.monkey.displayWidth / 2;

        this.monkey.hp = 100;

        // Create santa container
        let santaContainer = this.add.container(
            gameWidth + 100, // Start off screen to the right
            gameHeight / 2
        );

        // Create santa body (using santa9.png as default frame)
        let santaBody = this.add.sprite(0, 0, 'santa', 'santa9.png');
        
        // Create santa head (using santa6.png as default frame)
        let santaHead = this.add.sprite(0, -santaBody.height/2 + -9, 'santa', 'santa6.png');

        // Add both sprites to container
        santaContainer.add([santaBody, santaHead]);

        // Create animation for santa body
        this.anims.create({
            frames: [
                { key: 'santa', frame: 'santa9.png' },
                { key: 'santa', frame: 'santa10.png' },
                { key: 'santa', frame: 'santa11.png' }
            ],
            frameRate: 8,
            repeat: -1,
            key: 'santaFloat'
        });

        // Create animation for santa head
        this.anims.create({
            frames: [
                { key: 'santa', frame: 'santa6.png' },
                { key: 'santa', frame: 'santa7.png' }
            ],
            frameRate: 4,
            repeat: -1,
            key: 'santaHeadBob'
        });

        // Play animations
        santaBody.play('santaFloat');
        santaHead.play('santaHeadBob');

        // Add floating movement tween
        this.tweens.add({
            targets: santaContainer,
            y: {
                from: gameHeight / 2 - 20,
                to: gameHeight / 2 + 20
            },
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Add bullet animation
        this.anims.create({
            key: 'santaBullet',
            frames: [
                { key: 'santa', frame: 'santa0.png' },
                { key: 'santa', frame: 'santa1.png' },
                { key: 'santa', frame: 'santa2.png' },
                { key: 'santa', frame: 'santa3.png' },
                { key: 'santa', frame: 'santa4.png' },
                { key: 'santa', frame: 'santa5.png' }
            ],
            frameRate: 12,
            repeat: -1
        });

        // Create bullet group
        this.bullets = this.add.group();

        // Replace the single movement tween with this new function
        this.moveSantaAcrossScreen(santaContainer, gameWidth);
    }

    fireBulletAtMonkey(santaContainer) {
        // Create bullet at santa's right side
        const bulletStartX = santaContainer.x + 50; // Adjust offset as needed
        const bulletStartY = santaContainer.y;
        
        const bullet = this.add.sprite(bulletStartX, bulletStartY, 'santa', 'santa0.png');
        this.bullets.add(bullet);
        bullet.play('santaBullet');

        // Calculate angle and velocity towards monkey
        const angle = Phaser.Math.Angle.Between(
            bulletStartX, bulletStartY,
            this.monkey.x, this.monkey.y
        );

        const speed = 400;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        // Set bullet rotation based on velocity
        bullet.rotation = angle;

        // Move bullet
        this.tweens.add({
            targets: bullet,
            x: this.monkey.x,
            y: this.monkey.y,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                bullet.destroy();
            }
        });

        // Check for overlap with monkey
        this.time.addEvent({
            delay: 16,
            callback: () => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(
                    bullet.getBounds(),
                    this.monkey.getBounds()
                )) {
                    this.monkey.damage(10);
                    bullet.destroy();
                }
            },
            repeat: 62  // Check for ~1 second
        });
    }

    moveSantaAcrossScreen(santaContainer, gameWidth) {
        // First movement: right to left
        this.tweens.add({
            targets: santaContainer,
            x: -100,
            duration: 6000,
            ease: 'Linear',
            onComplete: () => {
                santaContainer.setScale(-1, 1);
                
                this.time.delayedCall(2000, () => {
                    santaContainer.x = -100;
                    
                    // Modified return journey with stop and shoot
                    this.tweens.add({
                        targets: santaContainer,
                        x: gameWidth + 100,
                        duration: 6000,
                        ease: 'Linear',
                        onUpdate: (tween) => {
                            // Fire when santa is halfway across
                            if (tween.progress >= 0.5 && !tween.hasShot) {
                                tween.hasShot = true;
                                this.fireBulletAtMonkey(santaContainer);
                            }
                        },
                        onComplete: () => {
                            santaContainer.setScale(1, 1);
                            this.moveSantaAcrossScreen(santaContainer, gameWidth);
                        }
                    });
                });
            }
        });
    }
} 