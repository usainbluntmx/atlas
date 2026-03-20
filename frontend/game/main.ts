import Phaser from "phaser";
import WorldScene from "./scenes/WorldScene";

export function createGame(containerId: string): Phaser.Game {
    return new Phaser.Game({
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: "#080A0F",
        parent: containerId,
        scene: [WorldScene],
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
            antialias: true,
            pixelArt: false,
        },
    });
}