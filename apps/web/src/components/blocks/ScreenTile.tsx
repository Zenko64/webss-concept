"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScreenTileProps {
  stream: MediaStream | null;
  muted?: boolean;
  connecting?: boolean;
  failed?: boolean;
  overlay?: React.ReactNode;
}

function MediaVideo({ stream, muted, className, style }: {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} style={style} />;
}

export function ScreenTile({ stream, muted = false, connecting, failed, overlay }: ScreenTileProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <>
      <div
        className="screensContainer group"
        style={{ cursor: stream ? "pointer" : "default" }}
        onClick={() => stream && setExpanded(true)}
      >
        <MediaVideo stream={stream} muted={muted} className="h-full w-full object-contain" />
        {!stream && (connecting || failed) && (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">
            {failed ? "Failed to connect" : "Connecting…"}
          </div>
        )}
        {overlay && <div onClick={(e) => e.stopPropagation()}>{overlay}</div>}
      </div>

      {createPortal(
        expanded ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={() => setExpanded(false)}
          >
            <div
              style={{ borderRadius: 16, overflow: "hidden" }}
              onClick={(e) => e.stopPropagation()}
            >
              <MediaVideo
                stream={stream}
                muted={muted}
                style={{ maxWidth: "90vw", maxHeight: "90vh", display: "block" }}
              />
            </div>
            <Button
              size="icon"
              onClick={() => setExpanded(false)}
              className="absolute top-6 right-6 scale-125"
            >
              <X size={24} strokeWidth={2} />
            </Button>
          </div>
        ) : null,
        document.body,
      )}
    </>
  );
}
