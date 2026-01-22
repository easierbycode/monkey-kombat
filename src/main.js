import constants from './config/constants.js';
import GameScene from './scenes/game.js';
import Parabomb from './scenes/game2-parabomb.js';
import Animus from './scenes/game3-animus.js';
import LiuKang from './scenes/game4-liu-kang.js';
import RainbowDash from './scenes/game4-rainbow-dash.js';
import BowserAndPeach from './scenes/game6-bowser-and-peach.js';
import MikeTyson from './scenes/game7-tyson.js';
import Beavis from './scenes/game8-beavis.js';
import Scorpion from './scenes/game9-scorpion.js';
import Santa from './scenes/game10-santa.js';
import Game11 from './scenes/game11-sonic.js';
import Game12 from './scenes/game12-cat.js';
import Game13 from './scenes/game13-pokemon.js';
import Game14 from './scenes/game13-nemesis.js';
import Game15 from './scenes/game15-naruto.js';
import Game16 from './scenes/game16-sabin.js';
import Game17 from './scenes/game17-suzie.js';
import Game18 from './scenes/game18-trump.js';

window.Phaser = Phaser;

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
  Game11,
  Game12,
  Game13,
  Game14,
  Game15,
  Game16,
  Game17,
  Game18,
];

let gameInstance = null;
let resizeHandler = null;
let sceneInitPatched = false;

function resolveSceneIndex(preferredIndex) {
  const numberFromPreferred = Number.parseInt(preferredIndex, 10);

  if (!Number.isNaN(numberFromPreferred) && scenes[numberFromPreferred]) {
    return numberFromPreferred;
  }

  const params = new URL(window.location.href).searchParams;
  const fromParams = Number.parseInt(params.get('scene'), 10);

  if (!Number.isNaN(fromParams) && scenes[fromParams]) {
    return fromParams;
  }

  return 9;
}

function resolveDebugFlag(debugOverride) {
  if (typeof debugOverride === 'boolean') {
    return debugOverride;
  }

  const params = new URL(window.location.href).searchParams;
  return params.get('debug') === '1';
}

function computeDimensions() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = Math.min(w / constants.WIDTH, h / constants.HEIGHT);

  return {
    width: w / scale,
    height: h / scale,
    scale,
  };
}

function applyResize(game) {
  if (!game || !game.canvas) {
    return;
  }

  const { width, height, scale } = computeDimensions();

  game.canvas.style.transform = `scale(${scale})`;
  game.canvas.style.transformOrigin = 'left top';

  game.scale.setGameSize(width, height);

  game.scene.scenes.forEach((scene) => {
    scene.cameras.main.setViewport(0, 0, width, height);
  });
}

function patchSceneInitOnce() {
  if (sceneInitPatched) {
    return;
  }

  const originalSceneInit = Phaser.Scene.prototype.init;
  Phaser.Scene.prototype.init = function patchedSceneInit() {
    window.gameScene = this;
    console.log('Scene assigned to window.gameScene:', this.constructor.name);
    if (originalSceneInit) {
      originalSceneInit.apply(this, arguments);
    }
  };

  sceneInitPatched = true;
}

export function destroyGame() {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }

  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
    delete window.game;
  }
}

export function startGame({ sceneIndex, debug, parent } = {}) {
  patchSceneInitOnce();

  destroyGame();

  const resolvedSceneIndex = resolveSceneIndex(sceneIndex);
  const resolvedDebugFlag = resolveDebugFlag(debug);
  const { width, height } = computeDimensions();

  const config = {
    type: Phaser.WEBGL,
    width,
    height,
    physics: {
      default: 'arcade',
      arcade: {
        debug: resolvedDebugFlag,
      },
    },
    scene: scenes[resolvedSceneIndex],
    pixelArt: true,
    antialias: false,
  };

  if (parent) {
    config.parent = parent;
  }

  gameInstance = new Phaser.Game(config);
  window.game = globalThis.__PHASER_GAME__ = gameInstance;

  const handleResize = () => applyResize(gameInstance);
  resizeHandler = handleResize;

  if (gameInstance.isBooted) {
    handleResize();
  } else {
    gameInstance.events.once('boot', handleResize);
  }

  window.addEventListener('resize', handleResize, { passive: true });

  return gameInstance;
}
