import Phaser from "phaser";

export interface WorldSceneEvents {
    onCollectResource: (id: number, resourceType: number) => void;
}

let globalOnCollect: ((id: number, resourceType: number) => void) | null = null;
let globalPlayerName = "Explorer";
let globalPlayerLevel = 1;

export function setWorldCallback(cb: (id: number, resourceType: number) => void) {
    globalOnCollect = cb;
}

export function setWorldPlayerData(name: string, level: number) {
    globalPlayerName = name;
    globalPlayerLevel = level;
}

export interface Resource {
    id: number;
    x: number;
    y: number;
    collected: boolean;
    type: number;
}

const RESOURCE_CONFIG = [
    { frame: 0, color: 0x00C2A8, label: "COMMON", points: 1 },
    { frame: 1, color: 0x818CF8, label: "RARE", points: 3 },
    { frame: 2, color: 0xF59E0B, label: "EPIC", points: 5 },
];

const TILE_SIZE = 16;
const SCALE = 3;

export default class WorldScene extends Phaser.Scene {
    private player: Phaser.GameObjects.Sprite | null = null;
    private nameLabel: Phaser.GameObjects.Text | null = null;
    private resourceSprites: Phaser.GameObjects.Sprite[] = [];
    private resourceData: Resource[] = [];
    private collectCooldown = false;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    private lastDir = "down";
    private treePositions: { x: number; y: number }[] = [];
    private rockPositions: { x: number; y: number }[] = [];

    constructor() {
        super({ key: "WorldScene" });
    }

    init(data: any) {
        if (data?.name) globalPlayerName = data.name;
        if (data?.level) globalPlayerLevel = data.level;
        if (data?.events?.onCollectResource) {
            globalOnCollect = data.events.onCollectResource;
        }
    }

    preload() {
        this.load.image("overworld", "/assets/Overworld.png");
        this.load.spritesheet("character", "/assets/character.png", {
            frameWidth: 17,
            frameHeight: 32,
        });
        this.load.spritesheet("objects", "/assets/objects.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
    }

    create() {
        const { width, height } = this.scale;

        this.createTileMap(width, height);
        this.createDecorations(width, height);

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        this.createAnimations();

        // Spawn resources en zonas seguras
        const typeDistribution = [0, 0, 0, 0, 0, 0, 1, 1, 1, 2];

        const isBlocked = (x: number, y: number): boolean => {
            const nearTree = this.treePositions.some(t =>
                Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2) < 60
            );
            const nearRock = this.rockPositions.some(r =>
                Math.sqrt((x - r.x) ** 2 + (y - r.y) ** 2) < 50
            );
            const nearEdge = x < 100 || x > width - 100 || y < 120 || y > height - 100;
            return nearTree || nearRock || nearEdge;
        };

        this.resourceData = Array.from({ length: 10 }, (_, i) => {
            let x = 0, y = 0;
            let attempts = 0;
            do {
                x = Phaser.Math.Between(100, width - 100);
                y = Phaser.Math.Between(120, height - 100);
                attempts++;
            } while (isBlocked(x, y) && attempts < 100);

            return { id: i, x, y, collected: false, type: typeDistribution[i] };
        });

        this.resourceSprites = [];
        this.resourceData.forEach((r) => {
            const cfg = RESOURCE_CONFIG[r.type];
            const sprite = this.add.sprite(r.x, r.y, "objects", cfg.frame);
            sprite.setScale(SCALE);
            sprite.setDepth(6);

            this.tweens.add({
                targets: sprite,
                y: r.y - 6,
                duration: 1200 + Phaser.Math.Between(0, 400),
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            });

            if (r.type > 0) {
                const label = this.add.text(r.x, r.y - 30, cfg.label, {
                    fontSize: "7px",
                    color: `#${cfg.color.toString(16).padStart(6, '0')}`,
                    fontFamily: "Courier New, monospace",
                    letterSpacing: 1,
                }).setOrigin(0.5).setDepth(7);
                this.tweens.add({
                    targets: label,
                    y: r.y - 36,
                    duration: 1200 + Phaser.Math.Between(0, 400),
                    yoyo: true,
                    repeat: -1,
                    ease: "Sine.easeInOut",
                });
            }

            this.resourceSprites.push(sprite);
        });

        // Player
        this.player = this.add.sprite(width / 2, height / 2, "character", 0);
        this.player.setScale(SCALE);
        this.player.setDepth(8);
        this.player.play("walk-down-idle");

        this.nameLabel = this.add.text(width / 2, height / 2 - 36, globalPlayerName, {
            fontSize: "9px",
            color: "#00C2A8",
            fontFamily: "Courier New, monospace",
            letterSpacing: 1,
        }).setOrigin(0.5).setDepth(9);

        this.add.text(24, height - 48, "ATLAS WORLD · DEVNET", {
            fontSize: "9px",
            color: "#3A5C28",
            fontFamily: "Courier New, monospace",
            letterSpacing: 3,
        }).setOrigin(0, 1).setDepth(10);

        this.add.text(width - 24, height - 48,
            "◆ COMMON +1   ◆ RARE +3   ◆ EPIC +5", {
            fontSize: "8px",
            color: "#3A5C28",
            fontFamily: "Courier New, monospace",
        }).setOrigin(1, 1).setDepth(10);
    }

    private createAnimations() {
        const dirs = [
            { key: "down", row: 0 },
            { key: "right", row: 1 },
            { key: "up", row: 2 },
            { key: "left", row: 3 },
        ];

        dirs.forEach(({ key, row }) => {
            const start = row * 16;
            if (!this.anims.exists(`walk-${key}`)) {
                this.anims.create({
                    key: `walk-${key}`,
                    frames: this.anims.generateFrameNumbers("character", { start, end: start + 2 }),
                    frameRate: 8,
                    repeat: -1,
                });
            }
            if (!this.anims.exists(`walk-${key}-idle`)) {
                this.anims.create({
                    key: `walk-${key}-idle`,
                    frames: this.anims.generateFrameNumbers("character", { start: start + 1, end: start + 1 }),
                    frameRate: 1,
                    repeat: 0,
                });
            }
        });
    }

    private createTileMap(width: number, height: number) {
        const tilesX = Math.ceil(width / (TILE_SIZE * SCALE)) + 1;
        const tilesY = Math.ceil(height / (TILE_SIZE * SCALE)) + 1;

        this.add.rectangle(width / 2, height / 2, width, height, 0x2D4A1E).setDepth(0);

        const g = this.add.graphics().setDepth(0);

        for (let ty = 0; ty < tilesY; ty++) {
            for (let tx = 0; tx < tilesX; tx++) {
                const px = tx * TILE_SIZE * SCALE;
                const py = ty * TILE_SIZE * SCALE;
                const variant = (tx + ty) % 3;
                const color = variant === 0 ? 0x2D4A1E : variant === 1 ? 0x3A5C28 : 0x2A4520;
                g.fillStyle(color, 1);
                g.fillRect(px, py, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
            }
        }

        const midX = Math.floor(tilesX / 2);
        const midY = Math.floor(tilesY / 2);
        g.fillStyle(0x7A6040, 1);
        for (let tx = 0; tx < tilesX; tx++) {
            g.fillRect(tx * TILE_SIZE * SCALE, midY * TILE_SIZE * SCALE, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
        }
        for (let ty = 0; ty < tilesY; ty++) {
            g.fillRect(midX * TILE_SIZE * SCALE, ty * TILE_SIZE * SCALE, TILE_SIZE * SCALE, TILE_SIZE * SCALE);
        }
    }

    private createDecorations(width: number, height: number) {
        this.treePositions = [
            { x: 60, y: 60 }, { x: width - 60, y: 60 },
            { x: 60, y: height - 60 }, { x: width - 60, y: height - 60 },
            { x: width * 0.25, y: 80 }, { x: width * 0.75, y: 80 },
            { x: width * 0.25, y: height - 80 }, { x: width * 0.75, y: height - 80 },
        ];

        this.treePositions.forEach(pos => {
            const g = this.add.graphics().setDepth(2);
            g.fillStyle(0x5C3A1E, 1);
            g.fillRect(pos.x - 6, pos.y - 4, 12, 20);
            g.fillStyle(0x2D6A1E, 1);
            g.fillCircle(pos.x, pos.y - 12, 18);
            g.fillStyle(0x3A8A28, 1);
            g.fillCircle(pos.x - 6, pos.y - 16, 12);
            g.fillCircle(pos.x + 6, pos.y - 16, 12);
        });

        this.rockPositions = [
            { x: width * 0.3, y: height * 0.3 },
            { x: width * 0.7, y: height * 0.3 },
            { x: width * 0.3, y: height * 0.7 },
            { x: width * 0.7, y: height * 0.7 },
        ];

        this.rockPositions.forEach(pos => {
            const g = this.add.graphics().setDepth(2);
            g.fillStyle(0x666870, 1);
            g.fillEllipse(pos.x, pos.y, 32, 22);
            g.fillStyle(0x888A92, 1);
            g.fillEllipse(pos.x - 4, pos.y - 4, 20, 14);
        });
    }

    update() {
        if (!this.player || !this.cursors) return;

        let vx = 0;
        let vy = 0;
        let moving = false;

        const speed = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT).isDown ? 240 : 120;

        if (this.cursors.left.isDown) { vx = -speed; this.lastDir = "left"; moving = true; }
        else if (this.cursors.right.isDown) { vx = speed; this.lastDir = "right"; moving = true; }
        if (this.cursors.up.isDown) { vy = -speed; this.lastDir = "up"; moving = true; }
        else if (this.cursors.down.isDown) { vy = speed; this.lastDir = "down"; moving = true; }

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        const { width, height } = this.scale;
        this.player.x = Phaser.Math.Clamp(this.player.x + vx * (1 / 60), 20, width - 20);
        this.player.y = Phaser.Math.Clamp(this.player.y + vy * (1 / 60), 60, height - 40);

        if (this.nameLabel) {
            this.nameLabel.x = this.player.x;
            this.nameLabel.y = this.player.y - 36;
        }

        if (moving) {
            const animKey = `walk-${this.lastDir}`;
            if (this.player.anims.currentAnim?.key !== animKey) {
                this.player.play(animKey);
            }
        } else {
            const idleKey = `walk-${this.lastDir}-idle`;
            if (this.player.anims.currentAnim?.key !== idleKey) {
                this.player.play(idleKey);
            }
        }

        this.checkResourceCollision();
    }

    checkResourceCollision() {
        if (this.collectCooldown || !this.player) return;

        this.resourceData.forEach((r, i) => {
            if (r.collected) return;

            const dx = this.player!.x - r.x;
            const dy = this.player!.y - r.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 32) {
                r.collected = true;
                const sprite = this.resourceSprites[i];
                const cfg = RESOURCE_CONFIG[r.type];

                this.tweens.add({
                    targets: sprite,
                    scaleX: 0, scaleY: 0, alpha: 0,
                    duration: 300,
                    ease: "Quad.easeIn",
                    onComplete: () => sprite.setVisible(false),
                });

                const popup = this.add.text(r.x, r.y - 20, `+${cfg.points}`, {
                    fontSize: "14px",
                    fontStyle: "bold",
                    color: `#${cfg.color.toString(16).padStart(6, '0')}`,
                    fontFamily: "Courier New, monospace",
                }).setOrigin(0.5).setDepth(10);

                this.tweens.add({
                    targets: popup,
                    y: r.y - 60, alpha: 0,
                    duration: 800,
                    ease: "Quad.easeOut",
                    onComplete: () => popup.destroy(),
                });

                for (let p = 0; p < 6 + r.type * 2; p++) {
                    const angle = (p / (6 + r.type * 2)) * Math.PI * 2;
                    const particle = this.add.graphics().setDepth(9);
                    particle.fillStyle(cfg.color, 1);
                    particle.fillCircle(0, 0, 3 + r.type);
                    particle.x = r.x;
                    particle.y = r.y;
                    this.tweens.add({
                        targets: particle,
                        x: r.x + Math.cos(angle) * (50 + r.type * 20),
                        y: r.y + Math.sin(angle) * (50 + r.type * 20),
                        alpha: 0,
                        duration: 600,
                        ease: "Quad.easeOut",
                        onComplete: () => particle.destroy(),
                    });
                }

                this.collectCooldown = true;
                setTimeout(() => { this.collectCooldown = false; }, 1500);

                if (globalOnCollect) {
                    globalOnCollect(r.id, r.type);
                }
            }
        });
    }

    updatePlayerLevel(level: number) {
        globalPlayerLevel = level;
    }

    updatePlayerName(name: string) {
        globalPlayerName = name;
        if (this.nameLabel) this.nameLabel.setText(name);
    }
}