import { io, Socket } from "socket.io-client";
import { API_URL } from "./client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_URL.replace("/api", ""), { transports: ["websocket"] });
  }
  return socket;
}
