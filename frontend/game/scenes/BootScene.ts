import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: "BootScene" });
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x080a0f);

        // Grid lines
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x1a1f2e, 0.5);

        for (let x = 0; x < width; x += 40) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 40) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
        graphics.strokePath();

        // Logo
        this.add.text(width / 2, height / 2 - 40, "ATLAS", {
            fontSize: "48px",
            color: "#E8E8E0",
            fontFamily: "Georgia",
            fontStyle: "bold",
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 10, "WORLD PROTOCOL", {
            fontSize: "11px",
            color: "#00C2A8",
            fontFamily: "Courier New",
            letterSpacing: 6,
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 40, "Conecta tu wallet para continuar", {
            fontSize: "10px",
            color: "#4A4A55",
            fontFamily: "Courier New",
            letterSpacing: 2,
        }).setOrigin(0.5);

        // Blinking cursor
        const cursor = this.add.text(width / 2, height / 2 + 60, "▮", {
            fontSize: "12px",
            color: "#00C2A8",
            fontFamily: "Courier New",
        }).setOrigin(0.5);

        this.tweens.add({
            targets: cursor,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1,
        });
    }
}