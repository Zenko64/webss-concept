import type z from "zod";
import type {
  IncomingScreen,
  roomData,
  roomScreens,
  roomUsers,
} from "./schemas";

export type RoomData = z.infer<typeof roomData>;
export type RoomScreens = z.infer<typeof roomScreens>;
export type RoomUsers = z.infer<typeof roomUsers>;

export type RoomListItem = {
  nanoid: string;
  name: string;
  ownerId: string;
  users: {
    userId: string;
    name: string;
    image: string | null | undefined;
    connected: boolean;
  }[];
};

type WebRTCSdp = { type: string; sdp?: string };
type WebRTCIceCandidate = { candidate?: string; sdpMid?: string | null; sdpMLineIndex?: number | null; usernameFragment?: string | null };

export interface ServerToClient {
  "socket-error": (error: { message: string; status: number }) => void;
  "user-connected": (user: RoomUsers) => void;
  "user-disconnected": (user: RoomUsers) => void;
  "broadcast-started": (stream: IncomingScreen) => void;
  "broadcast-stopped": (stream: RoomUsers) => void;
  "user-started-spectating": (userId: string, broadcasterId: string) => void;
  "user-stopped-spectating": (userId: string, broadcasterId: string) => void;
  "rooms-fetched": (rooms: RoomListItem[]) => void;
  "room-updated": (room: RoomData) => void;
  "webrtc-offer": (payload: { from: string; sdp: WebRTCSdp }) => void;
  "webrtc-answer": (payload: { from: string; sdp: WebRTCSdp }) => void;
  "webrtc-ice-candidate": (payload: { from: string; candidate: WebRTCIceCandidate }) => void;
}

export interface ClientToServer {
  "join-room": (roomNanoid: string) => void;
  disconnect: () => void;
  "start-broadcast": (streamId: string) => void;
  "stop-broadcast": () => void;
  "start-spectate": (broadcasterId: string) => void;
  "stop-spectate": (broadcasterId: string) => void;
  "fetch-rooms": (query?: string) => void;
  "webrtc-offer": (payload: { to: string; sdp: WebRTCSdp }) => void;
  "webrtc-answer": (payload: { to: string; sdp: WebRTCSdp }) => void;
  "webrtc-ice-candidate": (payload: { to: string; candidate: WebRTCIceCandidate }) => void;
}
