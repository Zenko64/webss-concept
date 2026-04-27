import { useEffect, useRef } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import type { RootState } from "@/redux/store";
import { setupSocketListeners } from "@/socket/manager";
import socket from "@/lib/socket";
import { authClient } from "@/lib/auth-client";

export function useSocketRoom() {
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const room = useSelector((state: RootState) => state.room.data);
  const error = useSelector((state: RootState) => state.room.error);
  const { data: session } = authClient.useSession();
  const myUserIdRef = useRef<string | null>(null);
  myUserIdRef.current = session?.user?.id ?? null;
  const sessionId = session?.session?.id ?? null;

  useEffect(() => {
    if (!sessionId) {
      socket.disconnect();
      return;
    }
    socket.connect();
    const cleanup = setupSocketListeners(
      dispatch,
      store.getState,
      () => myUserIdRef.current,
    );
    return cleanup;
  }, [dispatch, store, sessionId]);

  return {
    room,
    error,
  };
}
