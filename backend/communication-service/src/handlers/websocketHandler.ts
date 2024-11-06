import { Socket } from "socket.io";
import { CommunicationEvents, MessageTypes } from "../utils/types";
import { BOT_NAME } from "../utils/constants";
import { io } from "../server";
import { connectUser, disconnectUser } from "./userConnectionHandler";

export const handleWebsocketCommunicationEvents = (socket: Socket) => {
  socket.on(
    CommunicationEvents.JOIN,
    async ({ roomId, username }: { roomId: string; username: string }) => {
      connectUser(username);
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room?.has(socket.id)) {
        socket.emit(CommunicationEvents.ALREADY_JOINED);
        return;
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username;

      // send the message to all users (including the sender) in the room
      const createdTime = Date.now();
      io.to(roomId).emit(CommunicationEvents.USER_JOINED, {
        from: BOT_NAME,
        type: MessageTypes.BOT_GENERATED,
        message: `${username} has joined the chat`,
        createdTime,
      });
    }
  );

  socket.on(
    CommunicationEvents.SEND_TEXT_MESSAGE,
    ({
      roomId,
      message,
      username,
      createdTime,
    }: {
      roomId: string;
      message: string;
      username: string;
      createdTime: number;
    }) => {
      // send the message to all users (including the sender) in the room
      io.to(roomId).emit(CommunicationEvents.TEXT_MESSAGE_RECEIVED, {
        from: username,
        type: MessageTypes.USER_GENERATED,
        message,
        createdTime,
      });
    }
  );

  socket.on(CommunicationEvents.USER_DISCONNECT, () => {
    disconnectUser(socket);
  });

  socket.on(CommunicationEvents.DISCONNECT, () => {
    const { roomId } = socket.data;
    if (roomId) {
      const createdTime = Date.now();
      socket.to(roomId).emit(CommunicationEvents.DISCONNECTED, {
        from: BOT_NAME,
        type: MessageTypes.BOT_GENERATED,
        message: `${socket.data.username} has disconnected`,
        createdTime,
      });
    }
  });
};
