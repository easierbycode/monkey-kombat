

export default class Cyrax extends Phaser.Physics.Arcade.Sprite {
    constructor({ scene, x, y }) {
        super(scene, x, y, 'cyrax');

        this.setOrigin( 0, 1 );

        scene.anims.create({
            frameRate   : 6,
            frames      : scene.anims.generateFrameNumbers('cyrax', {
                start : 1,
                end   : 3,
                first : 1
            }),
            key         : 'victoryDance',
            repeat      : -1
        });

        scene.add.existing( this );
    }

    victoryDance() {
        this.play( 'victoryDance' );
    }
}