import { Socket } from "socket.io";
import { UserConnection } from "../utils/types";

const userConnections: Map<string, UserConnection> = new Map();

const delay = 3000;

export const disconnectUser = (socket: Socket) => {
  const { username } = socket.data;
  const userConnection = userConnections.get(username);
  clearTimeout(userConnection?.timeout);
  const timeout = setTimeout(() => {
    console.log("DISCONNECTING: ", socket.data);
    userConnections.delete(username);
    socket.disconnect();
  }, delay);
  userConnections.set(username, { timeout });
};

export const connectUser = (username: string) => {
  console.log("CONNECTING: ", username);
  const userConnection = userConnections.get(username);
  clearTimeout(userConnection?.timeout);
  userConnections.set(username, {});
};
