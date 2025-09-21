

export default class Parabomb extends Phaser.Physics.Arcade.Sprite {

    constructor({scene, x, y}) {
        super(scene, x, y, 'parabomb');

        scene.physics.add.existing( this );

        this.explosionSound = scene.sound.add( 'bombExplosion' );

        scene.anims.create({
            frameRate   : 9,
            frames      : scene.anims.generateFrameNumbers('parabomb', {
                start : 0,
                end   : 4,
                first : 2
            }),
            key         : 'fall',
            repeat      : -1
        });

        scene.anims.create({
            frameRate   : 60,
            frames      : scene.anims.generateFrameNumbers('parabomb', {
                start : 5,
                end   : 8,
                first : 5
            }),
            key         : 'land'
        });

        scene.anims.create({
            frameRate   : 20,
            frames      : scene.anims.generateFrameNumbers('parabomb', {
                start : 9,
                end   : 13,
                first : 9
            }),
            key         : 'walk',
            repeat      : -1
        });

        scene.anims.create({
            frameRate   : 9,
            frames      : scene.anims.generateFrameNumbers('parabomb', {
                start : 14,
                end   : 15,
                first : 14
            }),
            key         : 'stop'
        });

        scene.anims.create({
            frameRate   : 60,
            frames      : scene.anims.generateFrameNumbers('parabomb', {
                start : 16,
                end   : 18,
                first : 16
            }),
            key         : 'aboutToExplode',
            repeat      : 6
        });

        this
            .play( 'fall' )
            .setGravityY( 80 )           
            .setCollideWorldBounds( true );
        
        scene.add.existing( this );

        this.on('animationcomplete_land', (anim) => {
            this.play( 'walk' );
            this.setVelocityX( 80 );
        })

        this.on('animationcomplete_stop', (anim) => {
            this.play( 'aboutToExplode' );
        })

        this.on('animationcomplete_aboutToExplode', (anim) => {
            this.explosionSound.play();
            this.victim.destroy();
            super.destroy();
        })

        return this;
    }

    destroy( bullet, enemy ) {
        this.victim = enemy;
        this.setVelocityX( 0 );
        this.play( 'stop' );
    }

    update() {
        if ( !this.active )  return;
        
        let touching = this.body.checkWorldBounds();

        if ( touching && (this.anims.getCurrentKey() == 'fall') ) {
            this.setOffset( -19, -16 );
            this.setGravityY( 800 );
            this.on('animationcomplete', (anim, frame) => this.emit('animationcomplete_' + anim.key, anim, frame));
            this.play( 'land' );
        }
    }

}