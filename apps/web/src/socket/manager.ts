import socket from "@/lib/socket";
import { webrtcManager } from "@/lib/webrtc";
import { store } from "@/redux/store";
import type {
  RoomData,
  RoomListItem,
  RoomUsers,
  ServerToClient,
} from "@webss/types";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  setRoom,
  clearRoom,
  requestRoom,
  setError,
} from "@/redux/slices/roomSlice";
import { setRooms, updateRoom } from "@/redux/slices/roomsSlice";

webrtcManager.emitOffer = (to, sdp) => socket.emit("webrtc-offer", { to, sdp });
webrtcManager.emitAnswer = (to, sdp) => socket.emit("webrtc-answer", { to, sdp });
webrtcManager.emitIceCandidate = (to, candidate) =>
  socket.emit("webrtc-ice-candidate", { to, candidate });

function firstUserId(payload: RoomUsers): string | null {
  return Object.keys(payload)[0] ?? null;
}

type WebRtcOfferPayload = Parameters<ServerToClient["webrtc-offer"]>[0];
type WebRtcAnswerPayload = Parameters<ServerToClient["webrtc-answer"]>[0];
type WebRtcIceCandidatePayload = Parameters<ServerToClient["webrtc-ice-candidate"]>[0];

export function setupSocketListeners(
  dispatch: AppDispatch,
  getState: () => RootState,
  getMyUserId: () => string | null,
) {
  const onRoomUpdated = (data: RoomData) => {
    dispatch(setRoom(data));
    dispatch(updateRoom({
      nanoid: data.nanoid,
      name: data.name,
      ownerId: data.ownerId,
      users: Object.entries(data.users).map(([userId, u]) => ({
        userId,
        name: u.name,
        image: u.image,
        connected: u.connected,
      })),
    }));
  };

  const onBroadcastStopped = (user: RoomUsers) => {
    const userId = firstUserId(user);
    if (userId) webrtcManager.closePeer(userId);
  };

  const onUserStartedSpectating = (userId: string, broadcasterId: string) => {
    if (broadcasterId === getMyUserId() && webrtcManager.hasLocalStream()) {
      webrtcManager.createOffer(userId);
    }
  };

  const onUserStoppedSpectating = (userId: string, broadcasterId: string) => {
    if (broadcasterId === getMyUserId()) webrtcManager.closePeer(userId);
  };

  const onWebRtcOffer = ({ from, sdp }: WebRtcOfferPayload) =>
    webrtcManager.handleOffer(from, sdp as RTCSessionDescriptionInit);
  const onWebRtcAnswer = ({ from, sdp }: WebRtcAnswerPayload) =>
    webrtcManager.handleAnswer(from, sdp as RTCSessionDescriptionInit);
  const onWebRtcIceCandidate = ({ from, candidate }: WebRtcIceCandidatePayload) =>
    webrtcManager.addIceCandidate(from, candidate as RTCIceCandidateInit);

  const onRoomsFetched = (rooms: RoomListItem[]) => dispatch(setRooms(rooms));
  const onConnect = () => socket.emit("fetch-rooms");
  const onSocketError = (err: { message: string }) => dispatch(setError(err.message));
  const onConnectError = (err: Error) => dispatch(setError(err.message));

  socket.on("room-updated", onRoomUpdated);
  socket.on("broadcast-stopped", onBroadcastStopped);
  socket.on("user-started-spectating", onUserStartedSpectating);
  socket.on("user-stopped-spectating", onUserStoppedSpectating);
  socket.on("webrtc-offer", onWebRtcOffer);
  socket.on("webrtc-answer", onWebRtcAnswer);
  socket.on("webrtc-ice-candidate", onWebRtcIceCandidate);
  socket.on("rooms-fetched", onRoomsFetched);
  socket.on("connect", onConnect);
  socket.on("socket-error", onSocketError);
  socket.on("connect_error", onConnectError);

  if (socket.connected) socket.emit("fetch-rooms");

  return () => {
    socket.off("room-updated", onRoomUpdated);
    socket.off("broadcast-stopped", onBroadcastStopped);
    socket.off("user-started-spectating", onUserStartedSpectating);
    socket.off("user-stopped-spectating", onUserStoppedSpectating);
    socket.off("webrtc-offer", onWebRtcOffer);
    socket.off("webrtc-answer", onWebRtcAnswer);
    socket.off("webrtc-ice-candidate", onWebRtcIceCandidate);
    socket.off("rooms-fetched", onRoomsFetched);
    socket.off("connect", onConnect);
    socket.off("socket-error", onSocketError);
    socket.off("connect_error", onConnectError);
  };
}

// Server actions
export const joinRoom = (roomNanoid: string) => {
  store.dispatch(requestRoom(roomNanoid));
  socket.emit("join-room", roomNanoid);
};

export const leaveRoom = () => {
  store.dispatch(clearRoom());
};

export const startBroadcast = (streamId: string) => socket.emit("start-broadcast", streamId);
export const stopBroadcast = () => socket.emit("stop-broadcast");
export const startSpectate = (id: string) => socket.emit("start-spectate", id);
export const stopSpectate = (id: string) => socket.emit("stop-spectate", id);
export const fetchRooms = (query?: string) => socket.emit("fetch-rooms", query);
