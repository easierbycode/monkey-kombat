

export default class Animus extends Phaser.Physics.Arcade.Sprite {

    constructor({scene, x, y, victim}) {
        super(scene, x, y, 'animus');

        this.victim = victim;

        this.bladeHitSound  = scene.sound.add( 'bladeHitSound' );
        
        scene.physics.add.existing( this );

        scene.anims.create({
            frameRate   : 3,
            frames      : scene.anims.generateFrameNumbers('animus', {
                start : 0,
                end   : 1,
                first : 0
            }),
            key         : 'laugh',
            repeat      : 3
        });
        
        scene.anims.create({
            frameRate   : 4,
            frames      : scene.anims.generateFrameNumbers('animus', {
                start : 2,
                end   : 4,
                first : 2
            }),
            key         : 'pickUp'
        });

        scene.anims.create({
            frameRate   : 3,
            frames      : scene.anims.generateFrameNumbers('animus', {
                start : 5,
                end   : 7,
                first : 5
            }),
            key         : 'putDown'
        });

        scene.anims.create({
            frameRate   : 4,
            frames      : scene.anims.generateFrameNumbers('animus', {
                start : 10,
                end   : 13,
                first : 10
            }),
            key         : 'enjoyingBloodBath'
        });

        scene.anims.create({
            frameRate   : 2,
            frames      : scene.anims.generateFrameNumbers('animus', {
                start : 11,
                end   : 12,
                first : 11
            }),
            key         : 'bloodBathFlicker',
            repeat      : -1
        });

        scene.anims.create({
            frameRate   : 2,
            frames      : scene.anims.generateFrameNumbers('animus', {
                start : 14,
                end   : 15,
                first : 14
            }),
            key         : 'bloodyLaugh',
            repeat      : -1
        });

        scene.anims.create({
            frameRate   : 60,
            frames      : scene.anims.generateFrameNumbers('bloodSplat', {
                start : 0,
                end   : 9,
                first : 0
            }),
            key         : 'bloodSplatter',
            repeat      : -1
        });

        scene.anims.create({
            frameRate   : 30,
            frames      : scene.anims.generateFrameNumbers('bloodPuddle', {
                start : 0,
                end   : 4,
                first : 0
            }),
            key         : 'bloodPuddle',
            repeat      : -1
        });
        
        scene.add.existing( this );

        this.on('animationcomplete', (anim, frame) => this.emit('animationcomplete_' + anim.key, anim, frame));

        let blade   = this.scene.add.sprite(
                        (this.scene.game.config.width - 31),
                        (this.scene.game.config.height + 104),
                        'blade',
                        0
                    );
        
        this.on('animationcomplete_laugh', (anim) => {
            this.play( 'pickUp' );
        });

        var bloodPuddle;
        var bloodSplat;
        
        this.on('animationcomplete_pickUp', (anim) => {
            // put monkey in the air
            this.scene.tweens.add({
                targets     : this.victim,
                y           : (this.victim.y-40),
                duration    : 1000,
                ease        : 'Sine.easeInOut'
            });

            // pull blade up quickly
            this.scene.tweens.add({
                        targets     : blade,
                        y           : (blade.y - 208),
                        duration    : 250,
                        ease        : 'Sine.easeInOut',
                        delay       : 1000
                    })
            
            this.scene.time.delayedCall(
                1000,
                () => {

                    this.bladeHitSound.play();
                    
                    this.scene.cameras.main.shake( 250, 0.01 );

                    // monkey's blood animation
                    this.victim.bloodAnimation();

                    // add blood splat

                    console.log( this.victim );

                    bloodSplat   = this.scene.add.sprite(
                        this.victim.x,
                        ( this.victim.y - this.body.halfHeight ),
                        'bloodSplat',
                        0
                    );

                    bloodSplat.setOrigin( 1, 0 );

                    bloodSplat.play( 'bloodSplatter' );

                    // blood puddle
                    bloodPuddle   = this.scene.add.sprite(
                        (this.x - this.body.halfWidth),
                        ( this.scene.game.config.height - 93 ) + 10,
                        'bloodPuddle',
                        0
                    );

                    bloodPuddle.play( 'bloodPuddle' );

                    this.play( 'enjoyingBloodBath' );

                    this.scene.time.delayedCall( 1000, () =>  this.play( 'bloodBathFlicker' ) );
                }
            )
            
            this.scene.time.delayedCall(
                7750,
                () => {
                    this.play( 'putDown' );
                }
            )
            
        });

        this.on('animationcomplete_putDown', (anim) => {
            
            var destroyVictim = () => {
                this.victim.destroy();
            }
            
            this.play( 'bloodyLaugh' );
            
            // hide bloodSplat
            bloodPuddle.alpha   = 0;
            bloodSplat.alpha    = 0;
            
            // blade down
            this.scene.tweens.add({
                        targets     : blade,
                        y           : (blade.y + 208),
                        x           : (blade.x + 90),
                        duration    : 300,
                        ease        : 'Sine.easeInOut'
                    })
                    
                    this.scene.cameras.main.shake( 300, 0.01 );
                    
            this.victim.setOrigin( 1, 1 );
            this.victim.setGravityY( 800 );
            this.victim.setAngularVelocity( 600 );
            this.victim.setVelocityX( 600 );
            this.victim.setCollideWorldBounds( true );

            this.scene.time.delayedCall(
                500,
                destroyVictim
            );
        })

        this.play( 'laugh' );

        return this;
    }

    update() {
        if ( !this.victim.body )  return;
        if ( !this.victim.body.angularVelocity )  return;
        
        let touching = this.victim.body.checkWorldBounds();

        if ( touching ) {
            this.scene.time.delayedCall(
                150,
                function() {
                    this.victim.setAngularVelocity( 0 );
                },
                [],
                this
            )
        }
    }

}