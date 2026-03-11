'use client';

import { useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

// ─── ZEGOCLOUD credentials ────────────────────────────────────────────────────
// App ID from ZEGOCLOUD console (numeric)
const ZEGO_APP_ID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID ?? 0);
// Server secret — 32-char hex string
const ZEGO_SERVER_SECRET = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET ?? '2645473f2908eb2c303e7743fb51f4ee';

interface ZegoVideoCallProps {
    /** Room / case ID used as the Zego room identifier */
    roomID: string;
    /** Display name shown to other participants */
    displayName: string;
    /** Called when the local user leaves the call */
    onCallEnd?: () => void;
}

export default function ZegoVideoCall({ roomID, displayName, onCallEnd }: ZegoVideoCallProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const zegoRef = useRef<ZegoUIKitPrebuilt | null>(null);

    useEffect(() => {
        if (!containerRef.current || zegoRef.current) return;

        if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET || ZEGO_APP_ID === 0) {
            console.error('[Zego] Missing credentials. Please set NEXT_PUBLIC_ZEGO_APP_ID and NEXT_PUBLIC_ZEGO_SERVER_SECRET in .env.local');
            return;
        }

        // Sanitise room ID — Zego room IDs must be max 128 chars, alphanumeric + _-
        const safeRoomID = roomID.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || 'emergency';
        // Use a unique userID per session (could be tied to a real user ID in production)
        const userID = `user_${Math.floor(Math.random() * 100000)}`;

        // Generate a kit token on the client side using App ID + Server Secret
        // NOTE: In production, generate this token on your backend to protect the serverSecret.
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
            ZEGO_APP_ID,
            ZEGO_SERVER_SECRET,
            safeRoomID,
            userID,
            displayName,
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoRef.current = zp;

        zp.joinRoom({
            container: containerRef.current,
            sharedLinks: [],
            scenario: {
                mode: ZegoUIKitPrebuilt.VideoConference,
            },
            showScreenSharingButton: false,
            showPreJoinView: false,
            turnOnCameraWhenJoining: true,
            turnOnMicrophoneWhenJoining: true,
            showUserList: false,
            maxUsers: 10,
            layout: 'Grid',
            showLayoutButton: false,
            onLeaveRoom: () => {
                onCallEnd?.();
            },
        });

        return () => {
            // Cleanup handled by parent page unmount
            zegoRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', minHeight: 0 }}
        />
    );
}
