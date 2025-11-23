import Monkey from '../sprites/monkey.js';
import Sonic from '../sprites/sonic.js';

export default class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'Game11' });
    }

    preload() {
        // Load sonic sprite from Aseprite file
        this.load.aseprite('sonic', './assets/sonic.png', './assets/sonic.json');

        // Load sonic dust effect
        this.load.aseprite('sonic-dust', './assets/sonic-dust.png', './assets/sonic-dust.json');

        // Load spin animation atlas
        this.load.atlas('spin', './assets/spin.png', './assets/spin.json');

        // Load monkey image
        this.load.image('monkey', './assets/monkey.png');

        // Load blood animation sprites
        this.load.spritesheet('blood', './assets/blood.png', {
            frameWidth: 88,
            frameHeight: 71,
            endFrame: 9
        });

        // Load particle effects
        this.load.spritesheet('bone', './assets/bone.png', {
            frameWidth: 18,
            frameHeight: 18
        });

        this.load.spritesheet('muscle', './assets/muscle.png', {
            frameWidth: 23,
            frameHeight: 22
        });

        this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');

        // Load spin sound
        this.load.audio('spinSound', './assets/spin.wav');
        
        // Load explosion sound
        this.load.audio('explosionSound', './assets/mk3-00500-explosion.wav');
    }

    create() {
        this.currentShakeIntensity = 0;
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;

        // Create animations from the Aseprite file
        const sonicAnims = this.anims.createFromAseprite('sonic');

        this.anims.get('victory').repeat = -1;    // Infinite loop for walk
        this.anims.get('spin').repeat = -1;    // Infinite loop for walk
        this.anims.get('walk').repeat = -1;    // Infinite loop for walk

        // Get the frame rate of Sonic's spin animation for synchronization
        const sonicSpinAnim = this.anims.get('spin');
        const spinFrameRate = sonicSpinAnim ? sonicSpinAnim.frameRate : 15;

        // Create monkey spin animation from the atlas
        this.anims.create({
            key: 'monkey-spin',
            frames: this.anims.generateFrameNames('spin', {
                prefix: 'spin_',
                start: 0,
                end: 5
            }),
            frameRate: spinFrameRate,
            repeat: -1
        });

        // Create monkey in bottom right
        this.monkey = new Monkey({
            scene: this,
            x: gameWidth,  // Position monkey a bit more to the left
            y: gameHeight
        });

        this.monkey.health = 90000000;

        this.monkey.x -= this.monkey.displayWidth / 2;
        // this.monkey.y -= this.monkey.displayHeight / 2; // Position properly on y-axis
        this.monkey.health = 10;

        // Make sure monkey has physics body with larger collision area
        this.physics.world.enable(this.monkey);
        this.monkey.body.setSize(this.monkey.width, this.monkey.height);
        this.monkey.body.setOffset(0.5, 1);

        // Create Sonic on left side of screen
        this.sonic = new Sonic({
            scene: this,
            x: 50,
            y: gameHeight  // Make sure Sonic is at the right height
        });
        
        // Make sure Sonic has physics body with larger collision area
        this.physics.world.enable(this.sonic);
        this.sonic.body.setSize(this.sonic.width, this.sonic.height);
        this.sonic.body.setOffset(0.5, 1);
        this.sonic.setDepth(3); // Set Sonic to depth 3, higher than monkey and spin sprite
        
        // Create a separate spin animation sprite (initially hidden)
        this.spinSprite = this.add.sprite(0, 0, 'spin');
        this.spinSprite.setScale(1);
        this.spinSprite.setVisible(false);
        this.spinSprite.setDepth(1); // Set spin sprite to depth 1
        
        // Make sure the monkey is in front of the spin sprite
        this.monkey.setDepth(2); // Set monkey to depth 2, higher than spin sprite
        
        // Initialize spin sound BEFORE the event handlers
        this.spinSound = this.sound.add('spinSound', {
            loop: true,
            volume: 0.7,
            rate: 2.0  // Start at 2x speed (plays twice per second)
        });
        
        // Define a marker to use only a specific part of the sound
        this.spinSound.addMarker({
            name: 'spin_segment',
            start: 0.05,   // Start time in seconds (skip first 0.05s)
            duration: 0.5, // Changed from 0.75 to 0.5 seconds (500ms)
            config: {
                loop: true
            }
        });
        
        // Listen for when Sonic is spinning to show the spin animation
        this.sonic.on('spinningStarted', () => {
            console.log("Sonic started spinning, preparing spin animation");
            
            // Start playing the spin sound with the marker - make sure it's not already playing
            if (this.spinSound && !this.spinSound.isPlaying) {
                this.spinSound.play('spin_segment');
            }
            
            // Position the spin sprite closer to the monkey's actual position
            this.spinSprite.x = this.monkey.x;
            this.spinSprite.y = this.monkey.y - (this.monkey.displayHeight * 0.5); // Adjusted to be closer to the monkey
            
            // Initialize the spin sprite but keep it hidden until spin reaches higher speed
            this.spinSprite.setVisible(false);
            
            // Start continuous horizontal flipping tween to the monkey
            // Initial slow speed (matches the 6fps initial spin rate)
            this.monkeyTween = this.tweens.add({
                targets: this.monkey,
                scaleX: -this.monkey.scaleX, // Flip horizontally
                duration: 300, // Initial duration (slower)
                yoyo: true, // Go back to original scale
                repeat: -1,  // Repeat indefinitely
                ease: 'Cubic.easeInOut'
            });
            
            // Initial mild camera shake when spinning starts
            const initialIntensity = 0.001;
            this.currentShakeIntensity = initialIntensity;
            this.cameras.main.shake(2000, initialIntensity, true);
        });
        
        // Listen for framerate changes in Sonic's spin
        this.sonic.on('spinRateChange', (newFrameRate) => {
            console.log(`Sonic spin rate changed to ${newFrameRate}fps, updating spin animation`);
            
            // Adjust sound repetition rate based on framerate
            const minFps = 6;
            const maxFps = 30;
            const minRate = 1.5;  // Reduced starting rate from 2.0 to 1.5
            const maxRate = 4.0;  // Reduced maximum rate from 6.0 to 4.0 to avoid excessive pitch
            
            // Calculate playback rate using linear interpolation
            const playbackRate = minRate + ((newFrameRate - minFps) / (maxFps - minFps)) * (maxRate - minRate);
            
            // Apply rate and detune for more interesting sound effects
            if (this.spinSound && this.spinSound.isPlaying) {
                // Apply rate (speed and pitch together) but with a lower maximum
                this.spinSound.setRate(Math.max(minRate, Math.min(maxRate, playbackRate)));
                
                // Also add some detune that oscillates slightly based on current frame
                // This creates a subtle wobble effect as it spins faster
                const detuneAmount = Math.sin(this.time.now / 100) * (50 + (newFrameRate * 5));
                this.spinSound.setDetune(detuneAmount);
            }
            
            // Calculate shake intensity based on frame rate
            // Start subtle and increase non-linearly with spin speed
            const baseIntensity = 0.001;
            const maxIntensity = 0.015;
            let shakeIntensity = baseIntensity;
            
            if (newFrameRate >= 12) shakeIntensity = 0.004;
            if (newFrameRate >= 18) shakeIntensity = 0.008;
            if (newFrameRate >= 24) shakeIntensity = 0.012;
            if (newFrameRate >= 30) shakeIntensity = maxIntensity;
            
            // Only apply a new shake if this one is more intense than the current shake
            if (shakeIntensity > this.currentShakeIntensity) {
                this.currentShakeIntensity = shakeIntensity;
                
                // Calculate shake frequency - make it faster as spin speed increases
                // Base duration starts long (slower shake) and gets shorter (faster shake)
                const baseDuration = 500;
                let shakeDuration = Math.max(150, baseDuration - (newFrameRate * 10));
                
                // Stop any existing shake and start a new one
                this.cameras.main.resetFX();
                
                // Use a long duration to ensure it continues until the next shake
                const longDuration = 3000;
                
                // Apply increasingly intense AND faster camera shake as spin gets faster
                this.cameras.main.shake(longDuration, shakeIntensity, true);
            }
            
            // Only show and play the spin animation when reaching 18fps (second speed)
            if (newFrameRate >= 18) {
                // Make the spin sprite visible now that we're at higher speed
                this.spinSprite.setVisible(true);
                
                // Play the monkey spin animation
                if (this.sonic.anims.currentAnim) {
                    const currentFrame = this.sonic.anims.currentFrame.index;
                    
                    this.spinSprite.play('monkey-spin');
                    if (this.spinSprite.anims.currentAnim) {
                        this.spinSprite.anims.setCurrentFrame(
                            this.spinSprite.anims.currentAnim.frames[currentFrame % this.spinSprite.anims.currentAnim.frames.length]
                        );
                    }
                }
                
                // Update the spin sprite's animation framerate to match Sonic's
                if (this.spinSprite.anims.isPlaying && this.spinSprite.anims.currentAnim.key === 'monkey-spin') {
                    this.spinSprite.anims.msPerFrame = 1000 / newFrameRate;
                }
            }
            
            // Also adjust the monkey's flipping tween speed based on the new framerate
            if (this.monkeyTween && this.monkeyTween.isPlaying()) {
                // Stop the current tween
                this.monkeyTween.stop();
                
                // Calculate new duration based on frame rate (faster spin = faster flipping)
                // Scale inversely with framerate: higher fps = lower duration
                const newDuration = Math.max(50, 300 * (6 / newFrameRate));
                
                // Create a new tween with the updated duration
                this.monkeyTween = this.tweens.add({
                    targets: this.monkey,
                    scaleX: -this.monkey.scaleX, // Flip horizontally
                    duration: newDuration,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Cubic.easeInOut'
                });
            }
        });

        // Listen for when Sonic is about to dash
        this.sonic.on('preDash', () => {
            console.log("Sonic about to dash, damaging monkey");
            
            // Stop the spin sound
            if (this.spinSound && this.spinSound.isPlaying) {
                this.spinSound.stop();
            }
            
            // Stop the monkey flipping tween
            if (this.monkeyTween && this.monkeyTween.isPlaying()) {
                this.monkeyTween.stop();
            }
            
            // Hide the spin sprite
            this.spinSprite.setVisible(false);
            
            // Stop any ongoing camera shake
            this.cameras.main.resetFX();
            
            // Add one intense final shake for the dash impact
            // Much more intense than any previous shake for dramatic effect
            const finalShakeIntensity = 0.03;
            this.cameras.main.shake(400, finalShakeIntensity, false);
            
            // Now damage the monkey just before Sonic speeds off
            const isDead = this.monkey.damage({ damagePoints: 10 });
            if (isDead) {
                document.dispatchEvent(new CustomEvent('enemy-defeated'));
            }
        });

        // Initialize explosion sound
        this.explosionSound = this.sound.add('explosionSound', {
            volume: 1.0,
            rate: 1.0
        });
        
        // Add an event listener for the monkey's destruction
        this.monkey.on('destroy', () => {
            // Play explosion sound when monkey is destroyed
            this.explosionSound.play();
        });
        
        // Start Sonic's animation sequence
        this.startSonicSequence();
    }

    startSonicSequence() {
        // First play idle animation for a few seconds
        this.sonic.idle();

        // After 2 seconds, start walking toward monkey
        this.time.delayedCall(2000, () => {
            // Use Sonic's original walkToMonkey method
            this.sonic.walkToMonkey(this.monkey);
        });
    }

    update() {
        // Check if we need to end the scene
        if (this.monkey && this.monkey.active === false && this.monkeyWasActive !== false) {
            // Monkey was just destroyed, play explosion sound if not already played
            if (this.explosionSound && !this.explosionSound.isPlaying) {
                this.explosionSound.play();
            }
            this.monkeyWasActive = false;
        } else if (this.monkey && this.monkey.active) {
            this.monkeyWasActive = true;
        }

        // Update Sonic sprite
        if (this.sonic) {
            this.sonic.update();
        }
    }
}