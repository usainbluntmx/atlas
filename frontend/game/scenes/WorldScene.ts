import Phaser from "phaser";
import Player from "../objects/Player";

export interface WorldSceneEvents {
    onCollectResource: (id: number) => void;
}

// Registro global del callback — persiste aunque Phaser reinicie la escena
let globalOnCollect: ((id: number) => void) | null = null;

export function setWorldCallback(cb: (id: number) => void) {
    globalOnCollect = cb;
}

export interface Resource {
    id: number;
    x: number;
    y: number;
    collected: boolean;
}

export default class WorldScene extends Phaser.Scene {
    private player: Player | null = null;
    private resources: Phaser.GameObjects.Rectangle[] = [];
    private resourceData: Resource[] = [];
    private collectCooldown = false;
    private playerName = "Explorer";
    private playerLevel = 1;

    constructor() {
        super({ key: "WorldScene" });
    }

    init(data: any) {
        if (data?.name) this.playerName = data.name;
        if (data?.level) this.playerLevel = data.level;
        if (data?.events?.onCollectResource) {
            globalOnCollect = data.events.onCollectResource;
        }
    }

    create() {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x080a0f);

        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x1a1f2e, 0.3);
        for (let x = 0; x < width; x += 40) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 40) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
        graphics.strokePath();

        this.add.text(24, height - 24, "ATLAS WORLD · DEVNET", {
            fontSize: "9px",
            color: "#1A1F2E",
            fontFamily: "Courier New",
            letterSpacing: 3,
        }).setOrigin(0, 1);

        this.add.text(width / 2, height - 24, "↑ ↓ ← → para mover · acércate a un cristal para recolectar", {
            fontSize: "9px",
            color: "#2A2A35",
            fontFamily: "Courier New",
            letterSpacing: 1,
        }).setOrigin(0.5, 1);

        this.resourceData = Array.from({ length: 10 }, (_, i) => ({
            id: i,
            x: Phaser.Math.Between(60, width - 60),
            y: Phaser.Math.Between(100, height - 80),
            collected: false,
        }));

        this.resources = [];
        this.resourceData.forEach((r) => {
            this.add.rectangle(r.x, r.y, 12, 12, 0xf59e0b, 0.2).setScale(2);
            const rect = this.add.rectangle(r.x, r.y, 12, 12, 0xf59e0b);
            this.tweens.add({
                targets: rect,
                angle: 45,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            });
            this.resources.push(rect);
        });

        this.player = new Player(this, width / 2, height / 2, this.playerName, this.playerLevel);
    }

    update() {
        if (!this.player) return;

        const cursors = this.input.keyboard!.createCursorKeys();
        let vx = 0;
        let vy = 0;

        if (cursors.left.isDown) vx = -160;
        else if (cursors.right.isDown) vx = 160;
        if (cursors.up.isDown) vy = -160;
        else if (cursors.down.isDown) vy = 160;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.x += vx * (1 / 60);
        this.player.y += vy * (1 / 60);

        this.checkResourceCollision();
    }

    checkResourceCollision() {
        if (this.collectCooldown || !this.player) return;

        this.resourceData.forEach((r, i) => {
            if (r.collected) return;

            const dx = this.player!.x - r.x;
            const dy = this.player!.y - r.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 30) {
                r.collected = true;
                this.resources[i].setVisible(false);

                const flash = this.add.rectangle(r.x, r.y, 40, 40, 0xf59e0b, 0.6);
                this.tweens.add({
                    targets: flash,
                    alpha: 0,
                    scaleX: 3,
                    scaleY: 3,
                    duration: 300,
                    onComplete: () => flash.destroy(),
                });

                this.collectCooldown = true;
                setTimeout(() => { this.collectCooldown = false; }, 1500);

                if (globalOnCollect) {
                    globalOnCollect(r.id);
                }
            }
        });
    }

    updatePlayerLevel(level: number) {
        this.player?.updateLevel(level);
    }
}