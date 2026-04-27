import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./button";

export function Lightbox({
  src,
  onClose,
  borderRadius = 0,
}: {
  src: string | null;
  onClose: () => void;
  layoutId?: string;
  borderRadius?: number;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!src) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ background: "rgba(0,0,0,0.65)" }}
    >
      <div style={{ borderRadius, overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt=""
          style={{ maxWidth: "90vw", maxHeight: "90vh", display: "block" }}
        />
      </div>
      <Button size="icon" onClick={onClose} className="absolute top-6 right-6 scale-125">
        <X size={24} strokeWidth={2} />
      </Button>
    </div>,
    document.body,
  );
}
