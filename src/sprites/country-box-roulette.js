const COUNTRY_BOX_ROULETTE_KEY = 'country-box-roulette';
const COUNTRY_BOX_ROULETTE_ANIM = 'country-box-roulette-spin';

export default class CountryBoxRoulette extends Phaser.GameObjects.Sprite {
  constructor({ scene, x, y }) {
    super(scene, x, y, COUNTRY_BOX_ROULETTE_KEY, 0);

    if (!scene.anims.exists(COUNTRY_BOX_ROULETTE_ANIM)) {
      scene.anims.create({
        key: COUNTRY_BOX_ROULETTE_ANIM,
        frames: scene.anims.generateFrameNumbers(COUNTRY_BOX_ROULETTE_KEY, {
          start: 0,
          end: 2
        }),
        frameRate: 3,
        repeat: -1
      });
    }

    scene.add.existing(this);

    this.play(COUNTRY_BOX_ROULETTE_ANIM);
  }
}
