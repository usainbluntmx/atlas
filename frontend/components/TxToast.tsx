"use client";

import { FC, useEffect, useState } from "react";

interface Toast {
    id: number;
    signature: string;
    resourceType: number;
    points: number;
}

interface Props {
    toasts: Toast[];
    onRemove: (id: number) => void;
}

const RESOURCE_LABELS = ["COMMON", "RARE", "EPIC"];
const RESOURCE_COLORS = ["#00C2A8", "#818CF8", "#F59E0B"];

export type { Toast };

const TxToast: FC<Props> = ({ toasts, onRemove }) => {
    return (
        <div style={{
            position: "fixed",
            bottom: "40px",
            left: "24px",
            zIndex: 200,
            display: "flex",
            flexDirection: "column-reverse",
            gap: "8px",
        }}>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

const ToastItem: FC<{ toast: Toast; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
    const [visible, setVisible] = useState(false);
    const color = RESOURCE_COLORS[toast.resourceType] ?? "#00C2A8";
    const label = RESOURCE_LABELS[toast.resourceType] ?? "COMMON";
    const shortSig = `${toast.signature.slice(0, 8)}...${toast.signature.slice(-8)}`;
    const solscanUrl = `https://solscan.io/tx/${toast.signature}?cluster=devnet`;

    useEffect(() => {
        setTimeout(() => setVisible(true), 10);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 400);
        }, 10000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            background: "#0D1017",
            border: `1px solid ${color}44`,
            borderLeft: `3px solid ${color}`,
            fontFamily: "Courier New, monospace",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-20px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
            minWidth: "280px",
        }}>
            <div style={{
                fontSize: "8px",
                letterSpacing: "2px",
                color,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
            }}>
                +{toast.points} {label}
            </div>

            <div style={{ width: "1px", height: "16px", background: "#1A1F2E" }} />

            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: "8px",
                    color: "#4A4A55",
                    letterSpacing: "1px",
                    marginBottom: "2px",
                }}>TX ON-CHAIN</div>
                <div
                    onClick={() => window.open(solscanUrl, "_blank")}
                    style={{
                        fontSize: "9px",
                        color: "#E8E8E0",
                        letterSpacing: "1px",
                        cursor: "pointer",
                        textDecoration: "underline",
                        textDecorationColor: "#2A2F3E",
                    }}
                >
                    {shortSig} ↗
                </div>
            </div>

            <button
                onClick={() => onRemove(toast.id)}
                style={{
                    background: "transparent",
                    border: "none",
                    color: "#2A2F3E",
                    cursor: "pointer",
                    fontSize: "12px",
                    padding: "0",
                    lineHeight: 1,
                }}
            >
                ×
            </button>
        </div>
    );
};

export default TxToast;