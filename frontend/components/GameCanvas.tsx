"use client";

import { FC, useEffect, useRef } from "react";
import type WorldScene from "@/game/scenes/WorldScene";

interface Props {
    characterName: string;
    characterLevel: number;
    onCollectResource: (id: number) => void;
}

const GameCanvas: FC<Props> = ({ characterName, characterLevel, onCollectResource }) => {
    const gameRef = useRef<any>(null);

    // Registrar callback globalmente cada vez que cambie
    useEffect(() => {
        const registerCallback = async () => {
            const { setWorldCallback } = await import("@/game/scenes/WorldScene");
            setWorldCallback(onCollectResource);
        };
        registerCallback();
    }, [onCollectResource]);

    useEffect(() => {
        if (gameRef.current) return;

        const initGame = async () => {
            const { createGame } = await import("@/game/main");
            const { setWorldCallback } = await import("@/game/scenes/WorldScene");

            setWorldCallback(onCollectResource);
            gameRef.current = createGame("game-container");
        };

        initGame();

        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!gameRef.current) return;
        const scene = gameRef.current.scene.getScene("WorldScene") as WorldScene | null;
        scene?.updatePlayerLevel(characterLevel);
    }, [characterLevel]);

    return (
        <div
            id="game-container"
            style={{ width: "100vw", height: "100vh" }}
        />
    );
};

export default GameCanvas;