import { authClient } from "@/lib/auth-client";
import { useSelector } from "react-redux";
import { selectScreens } from "@/redux/selectors";
import { ScreenTile } from "@/components/blocks/ScreenTile";
import { ScreenViewer } from "@/components/blocks/ScreenViewer";
import { ShareDock } from "@/components/blocks/shareDock";
import { useScreenShare } from "@/hooks/useScreenShare";

export default function Home() {
  const { data: session } = authClient.useSession();
  const screens = useSelector(selectScreens);
  const myUserId = session?.user?.id;
  const { stream, broadcasting, start, stop } = useScreenShare();

  const otherBroadcasters = myUserId
    ? Object.keys(screens).filter((id) => id !== myUserId)
    : [];
  const empty = !stream && otherBroadcasters.length === 0;

  return (
    <div className="group bg-card m-5 flex-1 rounded-[50px] overflow-hidden relative">
      {empty ? (
        <div className="h-full grid place-items-center text-muted-foreground text-sm select-none">
          No screens are being shared
        </div>
      ) : (
        <div
          className="h-full p-8 gap-2 grid auto-rows-fr"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}
        >
          {stream && <ScreenTile key="local" stream={stream} muted />}
          {otherBroadcasters.map((id) => (
            <ScreenViewer key={id} broadcasterId={id} />
          ))}
        </div>
      )}
      <ShareDock onShare={start} sharing={broadcasting} onStop={stop} />
    </div>
  );
}
