import Monkey from '../sprites/monkey.js';
import Beavis from '../sprites/beavis.js';

export default class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    preload() {
        this.load.atlas('explosion', './assets/explosion.png', './assets/explosion.json');
      
        this.load.image('monkey', './assets/monkey.png');

        this.load.spritesheet('beavis', './assets/beavis.png', {
            frameWidth : 61,
            frameHeight: 90
        });

        this.load.spritesheet('beavis2', './assets/beavis2.png', {
            frameWidth : 49,
            frameHeight: 91
        });

        this.load.spritesheet('blood', './assets/blood.png', {
            frameWidth : 88,
            frameHeight: 71,
            endFrame   : 9
        });

        this.load.spritesheet('bone', './assets/bone.png', {
            frameWidth : 18,
            frameHeight: 18
        });

        this.load.spritesheet('muscle', './assets/muscle.png', {
            frameWidth : 23,
            frameHeight: 22
        });
    }

    create() {
        this.monkey = new Monkey({
            scene: this,
            x: this.game.config.width,
            y: this.game.config.height
        });

        this.monkey.x -= this.monkey.displayWidth / 2;

        const beavis = new Beavis({
            scene: this,
            x: ((this.game.config.width - 30) + 13) - (this.monkey.displayWidth / 2),
            y: (this.game.config.height - 45),
            victim: this.monkey
        });
    }
}
