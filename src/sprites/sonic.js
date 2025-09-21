export default class Sonic extends Phaser.Physics.Arcade.Sprite {
    constructor({ scene, x, y }) {
        super(scene, x, y, 'sonic');

        this.setOrigin(0.5, 1);

        this.scene = scene;

        // Add sprite to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set appropriate scale
        this.setScale(3);

        // Initialize state
        this.isWalking = false;
        this.isSpinning = false;
        this.facingRight = true;

        // Listen for animation completion events
        this.on('animationcomplete', (anim, frame) =>
            this.emit('animationcomplete_' + anim.key, anim, frame)
        );

        // Handle spin-start animation completion
        this.on('animationcomplete_spin-start', () => {
            this.startSpin();
        });
    }

    idle() {
        this.isWalking = false;
        this.isSpinning = false;
        this.setVelocityX(0);
        this.play('idle', true);
    }

    walkToMonkey(monkey) {
        this.isWalking = true;
        this.facingRight = true;
        this.setFlipX(false);
        this.setVelocityX(200);
        this.play('walk', true);

        // Create a timer to check if we've reached the monkey
        this.reachMonkeyTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                // Get closer to the monkey before preparing spin attack (60px instead of 100px)
                if (this.x >= monkey.x - 60) {
                    this.reachMonkeyTimer.remove();
                    this.prepareSpinAttack();
                }
            },
            loop: true
        });
    }

    prepareSpinAttack() {
        console.log('!!! Prepare to spin attack!');
        // Stop walking
        this.isWalking = false;
        this.setVelocityX(0);

        // Turn around
        this.facingRight = false;
        this.setFlipX(true);

        // Wait a moment then start spin animation
        this.scene.time.delayedCall(500, () => {
            this.play('spin-start', true);
        });
    }

    startSpin() {
        this.isSpinning = true;

        // Emit event that spinning has started
        this.emit('spinningStarted');

        // Play spin animation at initial frame rate (6 fps)
        this.play('spin', true);

        // Create dust effect aligned to Sonic's feet
        this.dustEffect = this.scene.add.sprite(this.x, this.y, 'sonic-dust');
        // Match Sonic's scale initially
        this.dustEffect.setScale(this.scaleX);
        this.dustEffect.setDepth(this.depth - 1); // Position dust behind Sonic

        // Define the function to update dust position based on Sonic's facing direction
        this.updateDustPosition = () => {
            // Calculate offset based on Sonic's width and facing direction
            const sonicWidth = this.displayWidth;

            if (this.facingRight) {
                // When facing right, dust should be at bottom-right
                this.dustEffect.setOrigin(1, 1); // Bottom-right origin
                this.dustEffect.x = this.x + (sonicWidth / 2); // Right edge of Sonic
                this.dustEffect.setFlipX(false);
            } else {
                // When facing left, dust should be at bottom-left
                this.dustEffect.setOrigin(0, 1); // Bottom-left origin
                this.dustEffect.x = this.x - (sonicWidth / 2); // Left edge of Sonic
                this.dustEffect.setFlipX(true);
            }

            // Y position is the same regardless of direction (at Sonic's feet)
            this.dustEffect.y = this.y;
        };

        // Now call the function after it's defined
        this.updateDustPosition();

        // Create dust animation
        if (!this.scene.anims.exists('sonic-dust')) {
            this.scene.anims.createFromAseprite('sonic-dust');
            this.scene.anims.get('sonic-dust').repeat = -1;    // Infinite loop for sonic-dust
        }

        // Play dust animation at double the framerate (12 fps initially)
        this.dustEffect.play('sonic-dust', true);
        this.dustEffect.anims.msPerFrame = 1000 / 12; // Double Sonic's initial 6fps

        // After 2 seconds, increase to 18 fps
        this.scene.time.delayedCall(2000, () => {
            this.anims.msPerFrame = 1000 / 18; // Set to 18 fps

            // Increase dust speed and scale
            this.dustEffect.anims.msPerFrame = 1000 / 36; // Double Sonic's 18fps
            this.dustEffect.setScale(2.0); // Bigger dust effect

            // Add slight barrel effect
            this.scene.tweens.add({
                targets: this.dustEffect,
                angle: this.facingRight ? -15 : 15,
                duration: 300,
                yoyo: true,
                repeat: -1
            });

            // Sync monkey animation framerate
            this.emit('spinRateChange', 18);

            // After another 2 seconds, increase to 48 fps
            this.scene.time.delayedCall(2000, () => {
                this.anims.msPerFrame = 1000 / 48; // Set to 48 fps

                // Increase dust speed and scale again
                this.dustEffect.anims.msPerFrame = 1000 / 96; // Double Sonic's 48fps
                this.dustEffect.setScale(2.5); // Even bigger dust effect

                // Enhanced barrel effect
                this.scene.tweens.killTweensOf(this.dustEffect);
                this.scene.tweens.add({
                    targets: this.dustEffect,
                    angle: this.facingRight ? -30 : 30,
                    duration: 200,
                    yoyo: true,
                    repeat: -1
                });

                // Sync monkey animation framerate
                this.emit('spinRateChange', 48);

                // After spinning at max speed, dash toward monkey
                this.scene.time.delayedCall(900, () => {
                    // Emit pre-dash event 100ms before dashing
                    this.emit('preDash');

                    // Clean up dust effect
                    if (this.dustEffect) {
                        this.dustEffect.destroy();
                        this.dustEffect = null;
                    }

                    // Delay the actual dash slightly to give time for the monkey explosion to start
                    this.scene.time.delayedCall(100, () => {
                        this.dashAtMonkey();
                    });
                });
            });
        });
    }

    dashAtMonkey() {
        // Dash toward monkey with high velocity
        this.setVelocityX(-800);
    }

    update() {
        // Update dust position if it exists
        if (this.isSpinning && this.dustEffect) {
            this.updateDustPosition();
        }

        // Add any per-frame updates here
    }
}