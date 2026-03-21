import Phaser from "phaser";
import Player from "../objects/Player";

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
    type: number; // 0=common, 1=rare, 2=epic
}

const RESOURCE_CONFIG = [
    { color: 0x00C2A8, glowColor: 0x00C2A8, label: "COMMON", points: 1 },
    { color: 0x818CF8, glowColor: 0x818CF8, label: "RARE", points: 3 },
    { color: 0xF59E0B, glowColor: 0xF59E0B, label: "EPIC", points: 5 },
];

export default class WorldScene extends Phaser.Scene {
    private player: Player | null = null;
    private resources: Phaser.GameObjects.Container[] = [];
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

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x04060A);

        // Starfield
        const stars = this.add.graphics();
        for (let i = 0; i < 120; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.8);
            stars.fillStyle(0xE8E8E0, alpha);
            stars.fillCircle(x, y, size);
        }

        // Grid
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x0D1420, 0.6);
        for (let x = 0; x < width; x += 60) {
            grid.moveTo(x, 0);
            grid.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 60) {
            grid.moveTo(0, y);
            grid.lineTo(width, y);
        }
        grid.strokePath();

        // Ambient glows
        const glow1 = this.add.graphics();
        glow1.fillStyle(0x00C2A8, 0.03);
        glow1.fillCircle(width * 0.2, height * 0.3, 200);
        const glow2 = this.add.graphics();
        glow2.fillStyle(0xF59E0B, 0.03);
        glow2.fillCircle(width * 0.8, height * 0.7, 180);

        // Obstacles
        this.spawnObstacles(width, height);

        // Resources — distribution: 6 common, 3 rare, 1 epic
        const typeDistribution = [0, 0, 0, 0, 0, 0, 1, 1, 1, 2];
        this.resourceData = Array.from({ length: 10 }, (_, i) => ({
            id: i,
            x: Phaser.Math.Between(80, width - 80),
            y: Phaser.Math.Between(120, height - 80),
            collected: false,
            type: typeDistribution[i],
        }));

        this.resources = [];
        this.resourceData.forEach((r) => {
            const cfg = RESOURCE_CONFIG[r.type];
            const container = this.add.container(r.x, r.y);

            // Outer ring
            const ring = this.add.graphics();
            ring.lineStyle(1, cfg.color, 0.3);
            ring.strokeCircle(0, 0, r.type === 2 ? 24 : r.type === 1 ? 20 : 16);
            container.add(ring);

            // Diamond
            const size = r.type === 2 ? 10 : r.type === 1 ? 8 : 6;
            const diamond = this.add.graphics();
            diamond.fillStyle(cfg.color, 1);
            diamond.fillPoints([
                { x: 0, y: -size },
                { x: size, y: 0 },
                { x: 0, y: size },
                { x: -size, y: 0 },
            ], true);
            container.add(diamond);

            // Center dot
            const dot = this.add.graphics();
            dot.fillStyle(0xFFFFFF, 0.9);
            dot.fillCircle(0, 0, r.type === 2 ? 3 : 2);
            container.add(dot);

            // Type label for rare/epic
            if (r.type > 0) {
                const label = this.add.text(0, -28, cfg.label, {
                    fontSize: "7px",
                    color: `#${cfg.color.toString(16).padStart(6, '0')}`,
                    fontFamily: "Courier New, monospace",
                    letterSpacing: 2,
                }).setOrigin(0.5);
                container.add(label);
            }

            // Float animation
            this.tweens.add({
                targets: container,
                y: r.y - 6,
                duration: 1500 + Phaser.Math.Between(0, 500),
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            });

            // Pulse ring
            this.tweens.add({
                targets: ring,
                alpha: 0,
                scaleX: 2,
                scaleY: 2,
                duration: 1800 + r.type * 400,
                repeat: -1,
                ease: "Quad.easeOut",
            });

            this.resources.push(container);
        });

        // Player
        this.player = new Player(this, width / 2, height / 2, globalPlayerName, globalPlayerLevel);

        // World label
        this.add.text(24, height - 48, "ATLAS WORLD · DEVNET", {
            fontSize: "9px",
            color: "#1A2030",
            fontFamily: "Courier New, monospace",
            letterSpacing: 3,
        }).setOrigin(0, 1);

        // Legend
        this.add.text(width - 24, height - 48,
            "◆ COMMON +1   ◆ RARE +3   ◆ EPIC +5", {
            fontSize: "8px",
            color: "#1A2030",
            fontFamily: "Courier New, monospace",
            letterSpacing: 1,
        }).setOrigin(1, 1);
    }

    private spawnObstacles(width: number, height: number) {
        const positions = [
            { x: width * 0.25, y: height * 0.25 },
            { x: width * 0.75, y: height * 0.25 },
            { x: width * 0.25, y: height * 0.75 },
            { x: width * 0.75, y: height * 0.75 },
            { x: width * 0.5, y: height * 0.4 },
        ];

        positions.forEach((pos) => {
            const g = this.add.graphics();
            g.lineStyle(1, 0x1A2030, 0.8);
            g.fillStyle(0x0A0E16, 1);
            const size = Phaser.Math.Between(24, 40);
            g.fillRect(-size / 2, -size / 2, size, size);
            g.strokeRect(-size / 2, -size / 2, size, size);
            g.x = pos.x;
            g.y = pos.y;

            // Corner accents
            const accent = this.add.graphics();
            accent.lineStyle(1, 0x00C2A8, 0.2);
            accent.moveTo(-size / 2, -size / 2 + 6);
            accent.lineTo(-size / 2, -size / 2);
            accent.lineTo(-size / 2 + 6, -size / 2);
            accent.moveTo(size / 2 - 6, size / 2);
            accent.lineTo(size / 2, size / 2);
            accent.lineTo(size / 2, size / 2 - 6);
            accent.strokePath();
            accent.x = pos.x;
            accent.y = pos.y;
        });
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

        (this.player as any).setMoving(vx, vy);

        const { width, height } = this.scale;
        this.player.x = Phaser.Math.Clamp(this.player.x + vx * (1 / 60), 20, width - 20);
        this.player.y = Phaser.Math.Clamp(this.player.y + vy * (1 / 60), 60, height - 40);

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
                const container = this.resources[i];
                const cfg = RESOURCE_CONFIG[r.type];

                this.tweens.add({
                    targets: container,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 400,
                    ease: "Quad.easeOut",
                    onComplete: () => container.setVisible(false),
                });

                // Score popup
                const popup = this.add.text(r.x, r.y - 20, `+${cfg.points}`, {
                    fontSize: "14px",
                    fontStyle: "bold",
                    color: `#${cfg.color.toString(16).padStart(6, '0')}`,
                    fontFamily: "Courier New, monospace",
                }).setOrigin(0.5);
                this.tweens.add({
                    targets: popup,
                    y: r.y - 60,
                    alpha: 0,
                    duration: 800,
                    ease: "Quad.easeOut",
                    onComplete: () => popup.destroy(),
                });

                // Particle burst
                for (let p = 0; p < 6 + r.type * 2; p++) {
                    const angle = (p / (6 + r.type * 2)) * Math.PI * 2;
                    const particle = this.add.graphics();
                    particle.fillStyle(cfg.color, 1);
                    particle.fillCircle(0, 0, 2 + r.type);
                    particle.x = r.x;
                    particle.y = r.y;
                    this.tweens.add({
                        targets: particle,
                        x: r.x + Math.cos(angle) * (40 + r.type * 20),
                        y: r.y + Math.sin(angle) * (40 + r.type * 20),
                        alpha: 0,
                        duration: 500 + r.type * 100,
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
        this.player?.updateLevel(level);
    }

    updatePlayerName(name: string) {
        this.playerName = name;
        this.player?.updateName(name);
    }
}