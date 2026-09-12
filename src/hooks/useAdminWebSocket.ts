"use client";

import { useEffect, useRef, useState } from "react";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// ──────────────────────────────────────────────────────────────────────────────
// Types mirroring the backend DTOs
// ──────────────────────────────────────────────────────────────────────────────
export type WsAdminMetric = { label: string; value: number };
export type WsAdminTable = { name: string; rows: number; status: string };
export type WsAdminDashboard = { metrics: WsAdminMetric[]; tables: WsAdminTable[] };

export type WsAdminUser = {
    id: number;
    email: string;
    displayName: string;
    pictureUrl?: string | null;
    role: string;
    createdAt: string;
};

export type WsVisualItem = {
    id: number;
    title: string;
    category: string;
    imageUrl: string;
    imagePath?: string | null;
    width?: number;
    height?: number;
    aspectRatio?: number;
    fileSize?: number;
    mimeType?: string;
    description?: string | null;
    createdAt?: string;
    uploadedBy?: number | null;
    creatorName?: string | null;
    creatorUsername?: string | null;
    creatorPictureUrl?: string | null;
};

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

// ──────────────────────────────────────────────────────────────────────────────
// Callbacks the consumer can register
// ──────────────────────────────────────────────────────────────────────────────
export interface AdminWebSocketHandlers {
    onDashboardUpdate?: (dashboard: WsAdminDashboard) => void;
    onUsersUpdate?: (users: WsAdminUser[]) => void;
    onNewImage?: (item: WsVisualItem) => void;
    onImageDeleted?: (id: number) => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────────────────────────────────
export function useAdminWebSocket(handlers: AdminWebSocketHandlers): ConnectionStatus {
    const [status, setStatus] = useState<ConnectionStatus>("connecting");

    // Keep handlers in a ref so subscriptions don't need to be re-created
    // every time the parent component re-renders.
    const handlersRef = useRef(handlers);
    useEffect(() => { handlersRef.current = handlers; }, [handlers]);

    useEffect(() => {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api")
            .replace(/\/api\/?$/, "");

        const client = new Client({
            // SockJS factory gives STOMP its transport layer
            webSocketFactory: () => new SockJS(`${apiBase}/ws`) as WebSocket,
            reconnectDelay: 5_000,
            heartbeatIncoming: 10_000,
            heartbeatOutgoing: 10_000,

            onConnect: () => {
                setStatus("connected");
                const subs: StompSubscription[] = [];

                subs.push(
                    client.subscribe("/topic/admin/dashboard", (msg: IMessage) => {
                        try {
                            const data: WsAdminDashboard = JSON.parse(msg.body);
                            handlersRef.current.onDashboardUpdate?.(data);
                        } catch { /* malformed message — ignore */ }
                    })
                );

                subs.push(
                    client.subscribe("/topic/admin/users", (msg: IMessage) => {
                        try {
                            const data: WsAdminUser[] = JSON.parse(msg.body);
                            handlersRef.current.onUsersUpdate?.(data);
                        } catch { /* malformed message — ignore */ }
                    })
                );

                subs.push(
                    client.subscribe("/topic/admin/images/new", (msg: IMessage) => {
                        try {
                            const data: WsVisualItem = JSON.parse(msg.body);
                            handlersRef.current.onNewImage?.(data);
                        } catch { /* malformed message — ignore */ }
                    })
                );

                subs.push(
                    client.subscribe("/topic/admin/images/deleted", (msg: IMessage) => {
                        try {
                            const id: number = JSON.parse(msg.body);
                            handlersRef.current.onImageDeleted?.(id);
                        } catch { /* malformed message — ignore */ }
                    })
                );

                // Cleanup subscriptions on disconnect
                client.onDisconnect = () => subs.forEach((s) => { try { s.unsubscribe(); } catch { /* no-op */ } });
            },

            onDisconnect: () => setStatus("disconnected"),
            onStompError: () => setStatus("disconnected"),
            onWebSocketError: () => setStatus("disconnected"),
            onWebSocketClose: () => setStatus("disconnected"),
        });

        client.activate();

        return () => {
            client.deactivate().catch(() => { /* no-op during cleanup */ });
        };
    }, []); // Run once on mount

    return status;
}
