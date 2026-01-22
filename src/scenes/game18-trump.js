import CountryBoxRoulette from '../sprites/country-box-roulette.js';

const COUNTRY_BOX_ROULETTE_KEY = 'country-box-roulette';
const COUNTRY_BOX_ROULETTE_FRAME_SIZE = 32;

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game18' });
  }

  preload() {
    this.load.spritesheet(COUNTRY_BOX_ROULETTE_KEY, './assets/country-roulette-box.png', {
      frameWidth: COUNTRY_BOX_ROULETTE_FRAME_SIZE,
      frameHeight: COUNTRY_BOX_ROULETTE_FRAME_SIZE,
      endFrame: 2
    });
  }

  create() {
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;

    this.countryBoxRoulette = new CountryBoxRoulette({
      scene: this,
      x: gameWidth / 2,
      y: gameHeight / 2
    });
  }
}
