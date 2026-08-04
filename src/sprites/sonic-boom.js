// The sonic-boom atlas ships with UTF-16 hex encoded frame keys — for example
// "k_00610074006c00610073005f00730030" is just "atlas_s0" — so frames are
// resolved by decoding the key and sorting on its trailing index. A cleanly
// exported atlas (atlas_s0, atlas_s1, ...) resolves to the same ordering.
const ENCODED_FRAME = /^k_((?:[0-9a-fA-F]{4})+)$/;
const TRAILING_INDEX = /(\d+)$/;

// The wave artwork only occupies a narrow band of the padded 31x39 frame, so
// the projectile body is trimmed to the pixels that are actually drawn.
export const WAVE_BOUNDS = { x: 3, y: 15, width: 24, height: 8 };

function decodeFrameName(name) {
    const match = ENCODED_FRAME.exec(name);

    if (!match) {
        return name;
    }

    let decoded = '';

    for (let i = 0; i < match[1].length; i += 4) {
        decoded += String.fromCharCode(Number.parseInt(match[1].slice(i, i + 4), 16));
    }

    return decoded;
}

// Returns the texture's frame names ordered by their trailing index, so a
// scene can address them positionally (0 = idle, 1..4 = wave, 5..6 = throw).
export function atlasFrameNames(scene, textureKey) {
    const texture = scene.textures.get(textureKey);

    if (!texture) {
        return [];
    }

    return texture.getFrameNames()
        .map((name) => {
            const match = TRAILING_INDEX.exec(decodeFrameName(name));

            return {
                name,
                index: match ? Number.parseInt(match[1], 10) : Number.NaN
            };
        })
        .filter((entry) => Number.isFinite(entry.index))
        .sort((a, b) => a.index - b.index)
        .map((entry) => entry.name);
}

export default class SonicBoom extends Phaser.Physics.Arcade.Sprite {
    constructor({ scene, x, y, texture, frame, animKey, scale = 3, speed = 340 }) {
        super(scene, x, y, texture, frame);

        this.setOrigin(0.5, 0.5);
        this.setScale(scale);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setAllowGravity(false);
        this.body.setSize(WAVE_BOUNDS.width, WAVE_BOUNDS.height);
        this.body.setOffset(WAVE_BOUNDS.x, WAVE_BOUNDS.y);
        this.body.setVelocityX(speed);

        this.play(animKey);

        // Breathe the wave vertically so it reads as churning air rather than
        // a rigid sprite sliding across the screen.
        this.pulseTween = scene.tweens.add({
            targets: this,
            scaleY: scale * 1.25,
            duration: 120,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update() {
        if (!this.active) {
            return;
        }

        // Nothing left to hit once the wave has cleared the right edge.
        const leftEdge = this.x - (this.displayWidth / 2);

        if (leftEdge > this.scene.game.config.width + 32) {
            this.destroy();
        }
    }

    destroy(fromScene) {
        if (this.pulseTween) {
            this.pulseTween.stop();
            this.pulseTween = null;
        }

        super.destroy(fromScene);
    }
}
