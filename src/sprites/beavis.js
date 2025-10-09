export default class Beavis extends Phaser.Physics.Arcade.Sprite {
    constructor({scene, x, y, victim}) {
        super(scene, x, y, 'beavis');

        this.victim = victim;

        scene.physics.add.existing(this);

        // Create animations
        scene.anims.create({
            frameRate : 3,
            frames    : scene.anims.generateFrameNumbers('beavis', {
                start : 2,
                end   : 4
            }),
            key       : 'saw',
            repeat    : 3
        });

        scene.anims.create({
            frameRate : 4,
            frames    : scene.anims.generateFrameNumbers('beavis2', {
                start : 2,
                end   : 3
            }),
            key       : 'headBang',
            repeat    : -1,
            yoyo      : true
        });

        scene.add.existing(this);

        this.on('animationcomplete', (anim, frame) => this.emit('animationcomplete_' + anim.key, anim, frame));
        
        // Once the 'saw' animation completes, destroy the victim and start the 'headBang' animation
        this.on('animationcomplete_saw', () => {
            this.victim.destroy();
            document.dispatchEvent(new CustomEvent('enemy-defeated'));
            this.play('headBang');
        });

        this.play('saw');

        return this;
    }
}
