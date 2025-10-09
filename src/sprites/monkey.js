
export default class Monkey extends Phaser.Physics.Arcade.Sprite {
    constructor({ scene, x, y }) {
        super(scene, x, y, 'monkey');

        this.setOrigin( 0.5, 1 );

        this.health = 1;
        
        this.scene  = scene;

        scene.physics.add.existing( this );

        this.setScale( 6 );

        this.setOffset( 4, 0 );

        // bloodAnimation
        scene.anims.create({
            frameRate   : 20,
            frames      : scene.anims.generateFrameNumbers('blood', {
                start : 0,
                end   : 9,
                first : 0
            }),
            hideOnComplete  : true,
            key         : 'bloodAnimation',
            repeat      : 0
        });

        this.bones      = scene.add.particles(0, 0, 'bone', {
            frame       : [0,1,2,3,4,5,6,7],
            speed       : 750,
            emitting    : false
        });

        this.bones.startFollow( this );

        this.muscles    = scene.add.particles(0, 0, 'muscle', {
            frame       : [0,1,2,3,4,5,6,7],
            speed       : 1500,
            emitting    : false
        });

        this.muscles.startFollow( this );
        
        this.explosionFlash     = scene.add.particles(0, 0, 'explosion', {
            frame       : 'muzzleflash2',
            lifespan    : 200,
            scale       : { start: 4, end: 0 },
            rotate      : { start: 0, end: 180 },
            emitting    : false
        });

        this.explosionFlash.startFollow( this );

        scene.add.existing( this );
    }

    safeExplode( emitterManager, quantity ) {
        if ( !emitterManager ) {
            return;
        }

        const emitters = emitterManager.emitters?.list;

        if ( !emitters || emitters.length === 0 ) {
            return;
        }

        for ( let idx = 0; idx < emitters.length; idx++ ) {
            const emitter = emitters[idx];

            if ( !emitter || emitter.manager !== emitterManager ) {
                continue;
            }

            if ( typeof emitter.explode === 'function' ) {
                emitter.explode( quantity, this.x, this.y );
            }
        }
    }

    getActiveScene() {
        const scene = this.scene;

        if ( !scene || !scene.sys ) {
            return null;
        }

        const systems = scene.sys;

        if ( typeof systems.isShutdown === 'function' && systems.isShutdown() ) {
            return null;
        }

        if ( typeof systems.isDestroyed === 'function' && systems.isDestroyed() ) {
            return null;
        }

        if ( typeof systems.isActive === 'function' && !systems.isActive() ) {
            return null;
        }

        return scene;
    }

    bloodAnimation() {
        const scene = this.getActiveScene();

        if ( !scene || !scene.add ) {
            return;
        }

        // blood
        scene.add.sprite( this.x, this.y - (this.displayHeight / 2), 'blood' )
            .setScale( 2.5 )
            .play( 'bloodAnimation' );
    }

    showCodeMonkeyBanner() {
        const scene = this.getActiveScene();

        if ( !scene || !scene.add ) {
            return;
        }

        // show CodeMonkey.Games text
        scene.add.text(this.x - (this.displayWidth + 10), this.y - (this.displayHeight / 2), 'CodeMonkey.Games', { font: '"Bangers"' });
    }

    destroy() {
        const scene = this.getActiveScene();

        this.safeExplode( this.bones, 16 );

        if ( !scene ) {
            this.safeExplode( this.muscles, 32 );
            this.safeExplode( this.explosionFlash, 1 );

            super.destroy();
            return;
        }

        if ( scene.cameras && scene.cameras.main ) {
            scene.cameras.main.shake( 500, 0.01 );
        }

        const canDelay = scene.time && typeof scene.time.delayedCall === 'function';

        if ( canDelay ) {
            scene.time.delayedCall( 25, () => {
                this.safeExplode( this.explosionFlash, 1 );

                this.bloodAnimation();

                this.safeExplode( this.muscles, 60 );

                this.showCodeMonkeyBanner();
            } );

            scene.time.delayedCall( 50, () => {
                this.safeExplode( this.muscles, 32 );

                super.destroy();
            } );

            return;
        }

        this.safeExplode( this.explosionFlash, 1 );

        this.bloodAnimation();

        this.safeExplode( this.muscles, 60 );
        this.safeExplode( this.muscles, 32 );

        this.showCodeMonkeyBanner();

        super.destroy();
    }

    damage( bullet ) {
        
        this.health -= (bullet.damagePoints || 1);

        let isDead  = this.health <= 0;

        if ( isDead ) {
            this.setActive( false );
            this.setVisible( false );
            this.destroy();
        } else {
            (TweenMax.to(this, 0.1, {
                tint: 16711680
              }),
              TweenMax.to(this, 0.1, {
                delay: 0.1,
                tint: 16777215
              }));
        }

        return isDead;
        
    }
}
