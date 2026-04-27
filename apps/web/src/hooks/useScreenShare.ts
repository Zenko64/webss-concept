import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectRoomNanoid } from "@/redux/selectors";
import { startBroadcast, stopBroadcast } from "@/socket/manager";
import { webrtcManager } from "@/lib/webrtc";
import { toast } from "sonner";

export function useScreenShare() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const roomNanoid = useSelector(selectRoomNanoid);
  const signaledRoomRef = useRef<string | null>(null);

  const stop = () => {
    stream?.getTracks().forEach((t) => t.stop());
    webrtcManager.setLocalStream(null);
    setStream(null);
  };

  const start = async () => {
    if (stream) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast.error("Screen sharing not supported.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      webrtcManager.setLocalStream(s);
      setStream(s);
      const track = s.getVideoTracks()[0];
      if (track) track.onended = stop;
    } catch (err) {
      if ((err as Error).name !== "NotAllowedError") toast.error("Failed to start screen share.");
    }
  };

  // Tie broadcast signaling to (stream, currentRoom). Stop on room change or stream end.
  useEffect(() => {
    if (!stream || !roomNanoid) {
      if (signaledRoomRef.current) {
        stopBroadcast();
        signaledRoomRef.current = null;
      }
      return;
    }
    if (signaledRoomRef.current === roomNanoid) return;
    if (signaledRoomRef.current) stopBroadcast();
    startBroadcast(crypto.randomUUID());
    signaledRoomRef.current = roomNanoid;
  }, [stream, roomNanoid]);

  useEffect(() => () => {
    stream?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  return { stream, broadcasting: stream !== null, start, stop };
}
