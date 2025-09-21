

export default class Bomb extends Phaser.Physics.Arcade.Sprite {

    constructor({scene, x, y}) {
        super(scene, x, y, 'bomb');

        scene.physics.add.existing( this );

        this.dropSound      = scene.sound.add( 'bombDrop' );
        this.ejectSound     = scene.sound.add( 'bombEject' );
        this.explosionSound = scene.sound.add( 'bombExplosion' );

        scene.anims.create({
            frameRate   : 20,
            frames      : scene.anims.generateFrameNumbers('bomb', {
                start : 0,
                end   : 5,
                first : 0
            }),
            key         : 'bombAnimation',
            repeat      : -1
        });

        this
            .play( 'bombAnimation' )
            .setVelocity( 160, 140 )           
            .setBounce( 1, 1 )
            .setCollideWorldBounds( true );
        
        scene.add.existing( this );

        this.ejectSound.play();
        
        return this;
    }

    destroy() {
        this.explosionSound.play();
        super.destroy();
    }

    update() {
        if ( !this.active )  return;
        
        let touching = this.body.checkWorldBounds();

        if ( touching )   this.dropSound.play();
    }
}