import { MonitorX, ScreenShare } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface ShareDockProps {
  onShare: () => void;
  sharing: boolean;
  onStop: () => void;
}

export function ShareDock({ onShare, sharing, onStop }: ShareDockProps) {
  return (
    <div
      className={cn(
        "absolute bottom-6 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-200",
        sharing ? "opacity-0 group-hover:opacity-100" : "opacity-40 group-hover:opacity-100",
      )}
    >
      <Button
        className={cn(
          "size-10 rounded-full shadow-lg backdrop-blur-sm",
          sharing && "bg-destructive hover:bg-destructive/90 border-destructive text-destructive-foreground",
        )}
        variant="outline"
        size="icon"
        onClick={sharing ? onStop : onShare}
      >
        {sharing ? <MonitorX className="size-4" /> : <ScreenShare className="size-4" />}
      </Button>
    </div>
  );
}
