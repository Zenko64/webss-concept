"use client";
import { useEffect, useRef, useState } from "react";
import { webrtcManager } from "@/lib/webrtc";
import { startSpectate, stopSpectate } from "@/socket/manager";
import { ScreenTile } from "./ScreenTile";

const CONNECT_TIMEOUT_MS = 10_000;

export function ScreenViewer({ broadcasterId }: { broadcasterId: string }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [failed, setFailed] = useState(false);
  const gotStreamRef = useRef(false);

  useEffect(() => {
    gotStreamRef.current = false;
    setFailed(false);
    setStream(null);
    startSpectate(broadcasterId);
    const unsub = webrtcManager.onStream(broadcasterId, (s) => {
      if (s) gotStreamRef.current = true;
      setStream(s);
    });
    const timer = window.setTimeout(() => {
      if (!gotStreamRef.current) setFailed(true);
    }, CONNECT_TIMEOUT_MS);
    return () => {
      window.clearTimeout(timer);
      unsub();
      stopSpectate(broadcasterId);
      webrtcManager.closePeer(broadcasterId);
    };
  }, [broadcasterId]);

  return <ScreenTile stream={stream} connecting={!stream && !failed} failed={failed && !stream} />;
}
