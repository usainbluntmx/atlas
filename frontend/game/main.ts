import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import WorldScene from "./scenes/WorldScene";

export function createGame(containerId: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#080A0F",
    parent: containerId,
    scene: [BootScene, WorldScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: false, // FIX v1: era true — borraba el pixel art
      pixelArt: true,   // FIX v1: era false — sprites se veían borrosos
    },
  });
}
