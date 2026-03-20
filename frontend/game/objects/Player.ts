import Phaser from "phaser";

export default class Player extends Phaser.GameObjects.Container {
    private sprite: Phaser.GameObjects.Rectangle;
    private nameLabel: Phaser.GameObjects.Text;
    private levelLabel: Phaser.GameObjects.Text;
    speed = 160;

    constructor(scene: Phaser.Scene, x: number, y: number, name: string, level: number) {
        super(scene, x, y);

        this.sprite = scene.add.rectangle(0, 0, 20, 20, 0x00c2a8);
        this.add(this.sprite);

        this.nameLabel = scene.add.text(0, -22, name, {
            fontSize: "9px",
            color: "#E8E8E0",
            fontFamily: "Courier New",
            letterSpacing: 2,
        }).setOrigin(0.5);
        this.add(this.nameLabel);

        this.levelLabel = scene.add.text(0, 14, `LVL ${level}`, {
            fontSize: "8px",
            color: "#F59E0B",
            fontFamily: "Courier New",
        }).setOrigin(0.5);
        this.add(this.levelLabel);

        scene.add.existing(this);
    }

    updateLevel(level: number) {
        this.levelLabel.setText(`LVL ${level}`);
    }
}