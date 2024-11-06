import { io } from "socket.io-client";

export enum CommunicationEvents {
  // send
  JOIN = "join",
  USER_DISCONNECT = "user_disconnect",
  SEND_TEXT_MESSAGE = "send_text_message",
  DISCONNECT = "disconnect",

  // receive
  USER_JOINED = "user_joined",
  ALREADY_JOINED = "already_joined",
  TEXT_MESSAGE_RECEIVED = "text_message_received",
  DISCONNECTED = "disconnected",
}

const COMMUNICATION_SOCKET_URL = "http://localhost:3005";

export const communicationSocket = io(COMMUNICATION_SOCKET_URL, {
  reconnectionAttempts: 3,
  autoConnect: false,
});
