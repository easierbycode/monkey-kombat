import Monkey from '../sprites/monkey.js';
import SonicBoom, { atlasFrameNames } from '../sprites/sonic-boom.js';

const SONIC_KEY = 'sonic-boom';

const IDLE_ANIM = 'sonic-boom-idle';
const THROW_ANIM = 'sonic-boom-throw';
const WAVE_ANIM = 'sonic-boom-wave';

// Positional slots inside the sonic-boom atlas. atlasFrameNames() maps these
// onto whatever the exporter actually named the frames.
const FRAME_IDLE = 0;
const FRAME_WAVE = [1, 2, 3, 4];
const FRAME_CHARGE = 5;
const FRAME_RELEASE = 6;

// First and last opaque rows of Sonic inside the padded 39px tall frame. Used
// to stand him on the floor and to size him against the monkey.
const SONIC_HEAD_ROW = 6;
const SONIC_FOOT_ROW = 33;
const SONIC_FRAME_HEIGHT = 39;

const IDLE_DURATION_MS = 1800;
const THROW_FPS = 6;
const WAVE_FPS = 16;
const WAVE_SPEED = 340;
const WAVE_SCALE = 3;
const RECOVER_MS = 500;

const MONKEY_HEALTH = 1;

export default class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'Game25' });
    }

    preload() {
        this.load.atlas(SONIC_KEY, './assets/sonic-boom.png', './assets/sonic-boom.json');

        this.load.image('monkey', './assets/monkey.png');
        this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
        this.load.spritesheet('blood', './assets/blood.png', {
            frameWidth: 88,
            frameHeight: 71,
            endFrame: 9
        });
        this.load.spritesheet('bone', './assets/bone.png', {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.spritesheet('muscle', './assets/muscle.png', {
            frameWidth: 23,
            frameHeight: 22
        });

        this.load.audio('boomThrow', './assets/sonic-boom.wav');
        this.load.audio('boomImpact', './assets/mk3-00500-explosion.wav');
    }

    create() {
        this.boomFired = false;
        this.monkeyDefeated = false;
        this.boom = null;
        this.boomOverlap = null;

        const width = this.game.config.width;
        const height = this.game.config.height;

        this.boomFrames = atlasFrameNames(this, SONIC_KEY);

        this.createScenery(width, height);
        this.createAnimations();
        this.createMonkey(width, height);
        this.createSonic(height);

        this.throwSound = this.sound.add('boomThrow', { volume: 0.6 });
        this.impactSound = this.sound.add('boomImpact', { volume: 1 });

        this.idleTimer = this.time.delayedCall(IDLE_DURATION_MS, () => this.throwSonicBoom());

        this.events.once('shutdown', () => this.cleanup());
        this.events.once('destroy', () => this.cleanup());
    }

    createScenery(width, height) {
        this.cameras.main.setBackgroundColor('#101820');

        // Shallow enough that the far edge sits below the fighters' knees.
        const floorHeight = Math.round(height * 0.09);

        this.add.rectangle(width / 2, height, width, floorHeight, 0x1c2733)
            .setOrigin(0.5, 1)
            .setDepth(0);
        this.add.rectangle(width / 2, height - floorHeight, width, 1, 0x33465a)
            .setOrigin(0.5, 0)
            .setDepth(0);
    }

    createAnimations() {
        // Slots are listed explicitly so a pose can be held for several beats.
        const framesFor = (slots) => slots.map((slot) => ({
            key: SONIC_KEY,
            frame: this.boomFrames[slot]
        }));

        const ensureAnim = (config) => {
            if (!this.anims.exists(config.key)) {
                this.anims.create(config);
            }
        };

        ensureAnim({
            key: IDLE_ANIM,
            frames: framesFor([FRAME_IDLE]),
            frameRate: 1,
            repeat: -1
        });

        // Hold the gathering pose for three beats, then snap to the release
        // pose — the wave leaves Sonic's hands on that last frame.
        ensureAnim({
            key: THROW_ANIM,
            frames: framesFor([FRAME_CHARGE, FRAME_CHARGE, FRAME_CHARGE, FRAME_RELEASE]),
            frameRate: THROW_FPS,
            repeat: 0
        });

        ensureAnim({
            key: WAVE_ANIM,
            frames: framesFor(FRAME_WAVE),
            frameRate: WAVE_FPS,
            repeat: -1
        });
    }

    createMonkey(width, height) {
        this.monkey = new Monkey({
            scene: this,
            x: width,
            y: height
        });

        this.monkey.x -= this.monkey.displayWidth / 2;
        this.monkey.health = MONKEY_HEALTH;
        this.monkey.setDepth(2);

        this.monkey.body.setSize(this.monkey.width, this.monkey.height);
        this.monkey.body.setOffset(0, 0);
        this.monkey.body.setAllowGravity(false);
        this.monkey.body.setImmovable(true);
    }

    createSonic(height) {
        this.sonic = this.add.sprite(0, height, SONIC_KEY, this.boomFrames[FRAME_IDLE]);
        this.sonic.setOrigin(0.5, 1);
        this.sonic.setDepth(5);

        // Match Sonic's drawn height (not the padded frame) to the monkey so
        // the two fighters read at the same scale.
        const drawnHeight = SONIC_FOOT_ROW - SONIC_HEAD_ROW;
        const scale = (this.monkey.displayHeight * 0.95) / drawnHeight;
        this.sonic.setScale(scale);

        // Push the frame's bottom padding below the floor so he stands on it
        // instead of hovering above it.
        this.sonic.y = height + ((SONIC_FRAME_HEIGHT - SONIC_FOOT_ROW) * scale);
        this.sonic.x = this.sonic.displayWidth / 2;

        this.sonic.play(IDLE_ANIM);
    }

    // --- Sonic boom -----------------------------------------------------------

    throwSonicBoom() {
        if (this.boomFired || !this.sonic) {
            return;
        }

        const onUpdate = (anim, frame) => {
            // The release pose is the last frame of the throw animation.
            if (anim.key !== THROW_ANIM || frame.index < anim.frames.length) {
                return;
            }

            this.sonic.off(Phaser.Animations.Events.ANIMATION_UPDATE, onUpdate);
            this.launchWave();
        };

        this.sonic.on(Phaser.Animations.Events.ANIMATION_UPDATE, onUpdate);
        this.sonic.once(`animationcomplete-${THROW_ANIM}`, () => {
            this.time.delayedCall(RECOVER_MS, () => {
                if (this.sonic && this.sonic.active) {
                    this.sonic.play(IDLE_ANIM);
                }
            });
        });

        this.sonic.play(THROW_ANIM);
    }

    launchWave() {
        if (this.boomFired) {
            return;
        }
        this.boomFired = true;

        // Leave from the energy swirl at Sonic's leading hand.
        const drawnHeight = SONIC_FOOT_ROW - SONIC_HEAD_ROW;
        const originY = this.sonic.y - ((SONIC_FRAME_HEIGHT - SONIC_FOOT_ROW) * this.sonic.scaleY);
        const startX = this.sonic.x + (this.sonic.displayWidth * 0.3);
        const startY = originY - (drawnHeight * this.sonic.scaleY * 0.45);

        this.boom = new SonicBoom({
            scene: this,
            x: startX,
            y: startY,
            texture: SONIC_KEY,
            frame: this.boomFrames[FRAME_WAVE[0]],
            animKey: WAVE_ANIM,
            scale: WAVE_SCALE,
            speed: WAVE_SPEED
        });
        this.boom.setDepth(this.sonic.depth + 1);

        this.throwSound.play();
        this.cameras.main.shake(140, 0.006);

        this.boomOverlap = this.physics.add.overlap(
            this.boom,
            this.monkey,
            () => this.onBoomHit(),
            () => this.canBoomHit(),
            this
        );
    }

    canBoomHit() {
        return !this.monkeyDefeated && !!this.monkey && this.monkey.active;
    }

    onBoomHit() {
        if (this.monkeyDefeated || !this.monkey || !this.monkey.active) {
            return;
        }
        this.monkeyDefeated = true;

        if (this.boomOverlap) {
            this.physics.world.removeCollider(this.boomOverlap);
            this.boomOverlap = null;
        }

        this.impactSound.play();
        this.cameras.main.shake(320, 0.02);
        this.cameras.main.flash(120, 255, 190, 90);
        this.triggerHaptic([50, 30, 90]);

        // The wave keeps going, so it looks like it blew straight through.
        const isDead = this.monkey.damage({ damagePoints: this.monkey.health });

        if (isDead) {
            document.dispatchEvent(new CustomEvent('enemy-defeated'));
        }
    }

    triggerHaptic(pattern) {
        if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
            return;
        }

        try {
            navigator.vibrate(pattern);
        } catch (_) {
            /* noop */
        }
    }

    update() {
        if (this.boom && this.boom.active) {
            this.boom.update();
        }
    }

    cleanup() {
        if (this.idleTimer) {
            this.idleTimer.remove(false);
            this.idleTimer = null;
        }

        if (this.boomOverlap) {
            this.physics.world?.removeCollider(this.boomOverlap);
            this.boomOverlap = null;
        }
    }
}
