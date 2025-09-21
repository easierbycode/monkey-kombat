export default class Spear extends Phaser.Physics.Arcade.Sprite {

    constructor({scene, x, y}) {
        super(scene, x, y, 'game_asset', 'scorpion7.png');

        scene.physics.add.existing( this );

        this.dropSound      = scene.sound.add( 'bombDrop' );
        this.ejectSound     = scene.sound.add( 'bombEject' );
        this.explosionSound = scene.sound.add( 'bombExplosion' );

        scene.anims.create({
            frameRate   : 20,
            frames      : scene.anims.generateFrameNames('game_asset', {
                prefix: 'scorpion',
                suffix: '.png',
                start: 7,
                end: 10,
                zeroPad: 0
            }),
            key         : 'spearAnimation',
            repeat      : -1
        });

        this
            .play( 'spearAnimation' )
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

        // Set angle based on velocity
        this.angle = Phaser.Math.RadToDeg(Math.atan2(this.body.velocity.y, this.body.velocity.x));
    }
}