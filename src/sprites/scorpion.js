

export default class Scorpion extends Phaser.Physics.Arcade.Sprite {
    constructor({ scene, x, y }) {
        super(scene, x, y, 'game_asset', 'scorpion0.png');

        scene.physics.add.existing( this );

        this.setOrigin( 0, 1 );

        scene.anims.create({
            frameRate: 6,
            frames: scene.anims.generateFrameNames('game_asset', {
                prefix: 'scorpion',
                suffix: '.png',
                start: 1,
                end: 6,
                zeroPad: 0
            }),
            key: 'victoryDance',
            repeat: -1
        });

        scene.add.existing( this );
    }

    victoryDance() {
        this.play( 'victoryDance' );
    }
}