import Phaser from "phaser";

export default class Player extends Phaser.GameObjects.Container {
    private shipBody: Phaser.GameObjects.Graphics;
    private thrusterGlow: Phaser.GameObjects.Graphics;
    private nameLabel: Phaser.GameObjects.Text;
    private levelLabel: Phaser.GameObjects.Text;
    private moveDir = { x: 0, y: 0 };
    speed = 160;

    constructor(scene: Phaser.Scene, x: number, y: number, name: string, level: number) {
        super(scene, x, y);

        this.thrusterGlow = scene.add.graphics();
        this.add(this.thrusterGlow);

        this.shipBody = scene.add.graphics();
        this.drawShipBody(false);
        this.add(this.shipBody);

        this.nameLabel = scene.add.text(0, -28, name, {
            fontSize: "9px",
            color: "#00C2A8",
            fontFamily: "Courier New, monospace",
            letterSpacing: 2,
        }).setOrigin(0.5);
        this.add(this.nameLabel);

        this.levelLabel = scene.add.text(0, 20, "EXPLORER", {
            fontSize: "7px",
            color: "#F59E0B",
            fontFamily: "Courier New, monospace",
            letterSpacing: 2,
        }).setOrigin(0.5);
        this.add(this.levelLabel);

        scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);

        scene.tweens.add({
            targets: this,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        });
    }

    private drawShipBody(moving: boolean) {
        this.shipBody.clear();
        this.shipBody.lineStyle(1, 0x00C2A8, moving ? 0.8 : 0.4);
        this.shipBody.strokeCircle(0, 0, 14);
        this.shipBody.fillStyle(0x00C2A8, moving ? 1 : 0.7);
        this.shipBody.fillPoints([
            { x: 0, y: -10 },
            { x: 8, y: 0 },
            { x: 0, y: 10 },
            { x: -8, y: 0 },
        ], true);
        this.shipBody.fillStyle(0xFFFFFF, 1);
        this.shipBody.fillCircle(0, 0, 2.5);
    }

    private drawThrusterGlow(moving: boolean) {
        this.thrusterGlow.clear();
        if (!moving) return;
        const angle = Math.atan2(-this.moveDir.y, -this.moveDir.x);
        const tx = Math.cos(angle) * 14;
        const ty = Math.sin(angle) * 14;
        this.thrusterGlow.fillStyle(0xF59E0B, 0.6);
        this.thrusterGlow.fillCircle(tx, ty, 5);
        this.thrusterGlow.fillStyle(0xF59E0B, 0.2);
        this.thrusterGlow.fillCircle(tx * 1.4, ty * 1.4, 8);
    }

    updateLevel(level: number) {
        this.levelLabel.setText(`LVL ${level}`);
    }

    updateName(name: string) {
        this.nameLabel.setText(name);
    }

    setMoving(vx: number, vy: number) {
        const moving = vx !== 0 || vy !== 0;
        this.moveDir = { x: vx, y: vy };
        this.drawShipBody(moving);
        this.drawThrusterGlow(moving);
    }
}