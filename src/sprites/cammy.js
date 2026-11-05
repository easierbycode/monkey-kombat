// Cammy's Spinning Bird Kick. Art: `cammy` atlas from spriteX (atlas_s0..s12, 144x128).
// Mirrors sprites/sonic.js: the sprite drives the sequence and emits events the scene listens to
// ('spinningStarted', 'spinRateChange', 'preDash').
const SPIN_FRAMES = ['atlas_s4', 'atlas_s7', 'atlas_s8', 'atlas_s9', 'atlas_s11', 'atlas_s12'];

export default class Cammy extends Phaser.Physics.Arcade.Sprite {
    constructor({ scene, x, y }) {
        super(scene, x, y, 'cammy', 'atlas_s7');

        this.setOrigin(0.5, 0.5);
        this.scene = scene;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.setScale(2);

        this.isSpinning = false;

        if (!scene.anims.exists('cammy-spin')) {
            scene.anims.create({
                key: 'cammy-spin',
                frames: SPIN_FRAMES.map((frame) => ({ key: 'cammy', frame })),
                frameRate: 12,
                repeat: -1
            });
        }
    }

    idle() {
        this.isSpinning = false;
        this.anims.stop();
        this.setFrame('atlas_s7');
    }

    // Tornado dive: spin while descending (with a swaying funnel) until level with the monkey.
    descendToMonkey(monkey) {
        this.isSpinning = true;
        this.play('cammy-spin', true);
        this.anims.msPerFrame = 1000 / 18;

        const targetY = monkey.y - monkey.displayHeight / 2;
        const baseX = monkey.x;

        // Tornado sway: wide at the top, tightening as she reaches the monkey
        this.swayTween = this.scene.tweens.add({
            targets: this,
            x: { from: baseX - 140, to: baseX + 140 },
            duration: 450,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.scene.tweens.add({
            targets: this,
            y: targetY,
            duration: 1800,
            ease: 'Cubic.easeIn',
            onUpdate: (tween) => {
                // Speed the spin up as she falls
                this.anims.msPerFrame = 1000 / (18 + 30 * tween.progress);
            },
            onComplete: () => {
                this.swayTween.stop();
                this.scene.tweens.add({
                    targets: this,
                    x: baseX - 20,
                    duration: 150,
                    onComplete: () => this.startSpinOnMonkey()
                });
            }
        });
    }

    // Whirl against the monkey, ramping the spin rate like Sonic does, then hit.
    startSpinOnMonkey() {
        this.emit('spinningStarted'); // scene starts spinning the monkey
        this.anims.msPerFrame = 1000 / 18; // descent left her at ~48fps; restart the ramp in sync with the monkey
        this.emit('spinRateChange', 18);

        this.scene.time.delayedCall(1200, () => {
            this.anims.msPerFrame = 1000 / 30;
            this.emit('spinRateChange', 30);

            this.scene.time.delayedCall(1200, () => {
                this.anims.msPerFrame = 1000 / 48;
                this.emit('spinRateChange', 48);

                this.scene.time.delayedCall(900, () => {
                    this.emit('preDash');
                    this.scene.time.delayedCall(100, () => this.finish());
                });
            });
        });
    }

    // Monkey is gone: crouch slightly, then spring up and off the top of the screen, still spinning.
    finish() {
        this.scene.tweens.add({
            targets: this,
            y: this.y + 25,
            duration: 150,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this,
                    y: -this.displayHeight,
                    duration: 700,
                    ease: 'Cubic.easeIn',
                    onComplete: () => {
                        this.isSpinning = false;
                        this.anims.stop();
                        this.setVisible(false);
                    }
                });
            }
        });
    }
}
