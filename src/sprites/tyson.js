export default class Tyson extends Phaser.Physics.Arcade.Sprite {
    constructor({scene, x, y, victim}) {
        super(scene, x, y, 'tyson')

        this.victim = victim

        scene.physics.add.existing( this )

        scene.anims.create({
            frameRate   : 3,
            frames      : scene.anims.generateFrameNumbers('tyson', {
                start   : 0,
                end     : 2
            }),
            key         : 'shuffle',
            repeat      : 3
        })

        scene.anims.create({
            frameRate   : 9,
            frames      : scene.anims.generateFrameNumbers('tyson', {
                start   : 9,
                end     : 12
            }),
            key         : 'uppercut'
        })

        scene.anims.create({
            frameRate   : 6,
            frames      : scene.anims.generateFrameNumbers('tyson', {
                start   : 5,
                end     : 6
            }),
            key         : 'winkLeft'
        })

        scene.anims.create({
            frameRate   : 6,
            frames      : scene.anims.generateFrameNumbers('tyson', {
                start   : 3,
                end     : 4
            }),
            key         : 'winkRight',
            yoyo        : true
        })

        scene.anims.create({
            frameRate   : 6,
            frames      : scene.anims.generateFrameNumbers('tyson', {
                start   : 7,
                end     : 8
            }),
            key         : 'bodyBlow'
        })

        scene.add.existing( this )

        this.on('animationcomplete', (anim, frame) => this.emit('animationcomplete_' + anim.key, anim, frame))

        this.on('animationcomplete_winkLeft', (anim) => {
            // tween tyson to bottom of y axis
            scene.tweens.add({
                targets: this,
                y: "+=50",
                duration: 400,
                ease: 'sine.out',
                yoyo: true,
                callback: () => {
                    this.play( 'uppercut' )
                }
            })
            // this.play( 'uppercut' )
        })

        this.on('animationcomplete_bodyBlow', (anim) => {
            this.play( 'winkLeft' )
        })

        this.on('animationcomplete_winkRight', (anim) => {
            this.play( 'bodyBlow' )
        })
        
        this.on('animationcomplete_shuffle', (anim) => {
            this.play( 'winkRight' )
        })

        this.on('animationcomplete_uppercut', (anim) => {
            this.play('shuffle');
        });

        this.on('animationupdate', (animation, frame) => {
            // Check if this is the uppercut animation and frame index 3 (12th overall)
            if (animation.key === 'uppercut' && frame.index === 3) {
                this.emit('uppercut');
            }
        });

        this.play( 'shuffle' )

        return this
    }
}