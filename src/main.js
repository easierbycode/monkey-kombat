import constants from './config/constants.js';
import GameScene from './scenes/game.js';
import Parabomb from './scenes/game2-parabomb.js';
import Animus from './scenes/game3-animus.js';
import LiuKang from './scenes/game4-liu-kang.js';
import RainbowDash from './scenes/game4-rainbow-dash.js';
import BowserAndPeach from './scenes/game6-bowser-and-peach.js';
import MikeTyson from './scenes/game7-tyson.js'
import Beavis from './scenes/game8-beavis.js'
import Scorpion from './scenes/game9-scorpion.js'
import Santa from './scenes/game10-santa.js';
import Game11 from './scenes/game11-sonic.js';

window.Phaser = Phaser;

let w     = window.innerWidth;
let h     = window.innerHeight;
let scale = Math.min(w / constants.WIDTH, h / constants.HEIGHT);
let width   = w / scale;
let height  = h / scale;

const scenes = [
  GameScene,
    Parabomb,
    Animus,
    LiuKang,
    RainbowDash,
    BowserAndPeach,
    MikeTyson,
    Beavis,
    Scorpion,
    Santa,
    Game11
];

const selectedSceneIdx = new URL(window.location.href).searchParams.get("scene") || 9;

const config = {
  type: Phaser.AUTO,
  width,
  height,
  physics: {
    default: 'arcade',
    arcade: {
            debug: new URL(window.location.href).searchParams.get("debug") == "1"
    }
  },
  scene: scenes[selectedSceneIdx],
  pixelArt: true,
  antialias: false,
};

const game = new Phaser.Game(config);
window.game = game;

function initialize(game) {
  function resize() {
    game.canvas.setAttribute(
      'style',
      ` transform: scale(${scale});
      transform-origin: left top;`
    )
    
    // game.resize( width, height );
    game.scale.setGameSize(width, height);

    game.scene.scenes.forEach(function(scene) {
      scene.cameras.main.setViewport(0, 0, width, height);
    });
  }

  // Replace the non-working scene-create event with a proper scene event hook
  const originalSceneInit = Phaser.Scene.prototype.init;
  Phaser.Scene.prototype.init = function() {
    window.gameScene = this;
    console.log('Scene assigned to window.gameScene:', this.constructor.name);
    if (originalSceneInit) {
      originalSceneInit.apply(this, arguments);
    }
  };

  window.addEventListener('resize', resize);

  if (game.isBooted) resize();
  else game.events.once('boot', resize);
}

initialize(game);