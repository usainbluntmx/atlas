"use client";

import { FC, useEffect, useRef } from "react";
import type WorldSceneType from "@/game/scenes/WorldScene";

interface Props {
    characterName: string;
    characterLevel: number;
    onCollectResource: (id: number, resourceType?: number) => void;
}

const GameCanvas: FC<Props> = ({ characterName, characterLevel, onCollectResource }) => {
    const gameRef = useRef<any>(null);
    const onCollectRef = useRef(onCollectResource);
    const levelRef = useRef(characterLevel);

    useEffect(() => {
        onCollectRef.current = onCollectResource;
    }, [onCollectResource]);

    useEffect(() => {
        levelRef.current = characterLevel;
        if (!gameRef.current) return;
        const scene = gameRef.current.scene.getScene("WorldScene") as WorldSceneType | null;
        scene?.updatePlayerLevel(characterLevel);
    }, [characterLevel]);

    useEffect(() => {
        if (gameRef.current) return;

        const initGame = async () => {
            const { createGame } = await import("@/game/main");
            const { setWorldCallback, setWorldPlayerData } = await import("@/game/scenes/WorldScene");
            setWorldCallback((id: number, resourceType: number) => onCollectRef.current(id, resourceType));
            setWorldPlayerData(characterName, characterLevel);
            gameRef.current = createGame("game-container");

            // Esperar a que WorldScene esté activa y pasar el nivel correcto
            const checkScene = setInterval(() => {
                if (!gameRef.current) return;
                const scene = gameRef.current.scene.getScene("WorldScene") as WorldSceneType | null;
                if (scene && scene.sys.isActive()) {
                    scene.updatePlayerLevel(levelRef.current);
                    scene.updatePlayerName(characterName);
                    clearInterval(checkScene);
                }
            }, 100);

            setTimeout(() => clearInterval(checkScene), 5000);
        };

        initGame();

        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []);

    return (
        <div
            id="game-container"
            style={{ width: "100vw", height: "100vh" }}
        />
    );
};

export default GameCanvas;