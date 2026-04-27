import type { ClientToServer, ServerToClient } from "@webss/types";
import { io, Socket } from "socket.io-client";

const socket: Socket<ServerToClient, ClientToServer> = io({
  path: "/api/socket/",
  autoConnect: false,
});
export default socket;
