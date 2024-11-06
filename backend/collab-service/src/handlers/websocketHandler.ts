import { Socket } from "socket.io";
import { io } from "../server";
import redisClient from "../config/redis";
import { Doc, applyUpdateV2, encodeStateAsUpdateV2 } from "yjs";

enum CollabEvents {
  // Receive
  JOIN = "join",
  REJOIN = "rejoin",
  LEAVE = "leave",
  DISCONNECT = "disconnect",
  INIT_DOCUMENT = "init_document",
  UPDATE_REQUEST = "update_request",
  UPDATE_CURSOR_REQUEST = "update_cursor_request",
  RECONNECT_REQUEST = "reconnect_request",

  // Send
  ROOM_READY = "room_ready",
  UPDATE = "updateV2",
  UPDATE_CURSOR = "update_cursor",
  PARTNER_LEFT = "partner_left",
  PARTNER_DISCONNECTED = "partner_disconnected",
  REJOINED = "rejoined",
}

interface CollabSessionData {
  doc: Doc;
  questionId: string;
  language: string;
  isPartnerReady: boolean;
  startTime: number;
}

const EXPIRY_TIME = 3600;
const CONNECTION_DELAY = 3000; // time window to allow for page re-renders

const userConnections = new Map<string, NodeJS.Timeout | null>();
const collabSessions = new Map<string, CollabSessionData>();

export const handleWebsocketCollabEvents = (socket: Socket) => {
  socket.on(
    CollabEvents.JOIN,
    (uid: string, roomId: string, questionId: string, language: string) => {
      const connectionKey = `${uid}:${roomId}`;
      if (userConnections.has(connectionKey)) {
        clearTimeout(userConnections.get(connectionKey)!);
        return;
      }
      userConnections.set(connectionKey, null);

      const room = io.sockets.adapter.rooms.get(roomId);
      if (room && room?.size >= 2) {
        socket.emit(CollabEvents.ROOM_READY, false);
        return;
      }

      socket.join(roomId);
      socket.data.roomId = roomId;

      if (
        io.sockets.adapter.rooms.get(roomId)?.size === 2 &&
        !collabSessions.has(roomId)
      ) {
        createCollabSession(roomId, questionId, language);
        io.to(roomId).emit(CollabEvents.ROOM_READY, true);
      }
    }
  );

  socket.on(CollabEvents.REJOIN, (uid: string, roomId: string) => {
    const connectionKey = `${uid}:${roomId}`;
    if (userConnections.has(connectionKey)) {
      clearTimeout(userConnections.get(connectionKey)!);
    }
    userConnections.set(connectionKey, null);
    socket.join(roomId); // TODO: Check if session is still ongoing

    // TODO: if no session data
    const sessionData = collabSessions.get(roomId)!;
    const { questionId, language, startTime } = sessionData;
    socket.emit(CollabEvents.REJOINED, questionId, language, startTime);
  });

  socket.on(
    CollabEvents.INIT_DOCUMENT,
    (roomId: string, template: string, isRejoin: boolean) => {
      // TODO: if no session data
      const sessionData = collabSessions.get(roomId)!;
      const { doc, isPartnerReady } = sessionData;

      if (isRejoin) {
        // trigger an invisible update
        doc.transact(() => {
          doc.getText().insert(0, " ");
          doc.getText().delete(0, 1);
        });
        return;
      }

      if (isPartnerReady && doc.getText().length === 0) {
        doc.transact(() => {
          doc.getText().insert(0, template);
        });
      } else {
        collabSessions.set(roomId, {
          ...sessionData,
          isPartnerReady: true,
        });
      }
    }
  );

  socket.on(
    CollabEvents.UPDATE_REQUEST,
    (roomId: string, update: Uint8Array) => {
      // TODO: if no doc
      const { doc } = collabSessions.get(roomId)!;
      applyUpdateV2(doc, new Uint8Array(update));
    }
  );

  socket.on(
    CollabEvents.UPDATE_CURSOR_REQUEST,
    (
      roomId: string,
      cursor: { uid: string; username: string; from: number; to: number }
    ) => {
      socket.to(roomId).emit(CollabEvents.UPDATE_CURSOR, cursor);
    }
  );

  socket.on(
    CollabEvents.LEAVE,
    (uid: string, roomId: string, isImmediate: boolean) => {
      const connectionKey = `${uid}:${roomId}`;
      if (isImmediate || !userConnections.has(connectionKey)) {
        handleUserLeave(uid, roomId, socket);
        return;
      }

      clearTimeout(userConnections.get(connectionKey)!);

      const connectionTimeout = setTimeout(() => {
        socket.to(roomId).emit(CollabEvents.PARTNER_DISCONNECTED);
        // handleUserLeave(uid, roomId, socket);
      }, CONNECTION_DELAY);

      userConnections.set(connectionKey, connectionTimeout);
    }
  );

  socket.on(CollabEvents.RECONNECT_REQUEST, async (roomId: string) => {
    // TODO: Handle reconnection
    socket.join(roomId);
    const storeSessionData = await redisClient.get(`collaboration:${roomId}`);

    if (storeSessionData) {
      const sessionData = JSON.parse(storeSessionData);
      const doc = getDocument(
        roomId,
        sessionData.questionId,
        sessionData.language
      );

      const tempDoc = new Doc();
      const update = Buffer.from(sessionData.doc, "base64");
      applyUpdateV2(tempDoc, new Uint8Array(update));
      const tempText = tempDoc.getText().toString();

      const text = doc.getText();
      doc.transact(() => {
        text.delete(0, text.length);
        text.insert(0, tempText);
      });
    }
  });
};

const createCollabSession = (
  roomId: string,
  questionId: string,
  language: string
) => {
  getDocument(roomId, questionId, language);
};

const removeCollabSession = (roomId: string) => {
  collabSessions.get(roomId)?.doc.destroy();
  collabSessions.delete(roomId);
};

const getDocument = (roomId: string, questionId: string, language: string) => {
  const sessionData = collabSessions.get(roomId);
  let doc: Doc;

  if (sessionData) {
    doc = sessionData.doc;
  } else {
    doc = new Doc();
    doc.on(CollabEvents.UPDATE, () => {
      saveSessionData(roomId, doc, questionId, language);
      io.to(roomId).emit(CollabEvents.UPDATE, encodeStateAsUpdateV2(doc!));
    });
    collabSessions.set(roomId, {
      doc: doc,
      questionId: questionId,
      language: language,
      isPartnerReady: false,
      startTime: Date.now(),
    });
  }

  return doc;
};

const saveSessionData = async (
  roomId: string,
  doc: Doc,
  questionId: string,
  language: string
) => {
  const docState = encodeStateAsUpdateV2(doc);
  const docAsString = Buffer.from(docState).toString("base64");
  const sessionDataAsJson = JSON.stringify({
    doc: docAsString,
    questionId: questionId,
    language: language,
  });
  await redisClient.set(`collaboration:${roomId}`, sessionDataAsJson, {
    EX: EXPIRY_TIME,
  });
};

const handleUserLeave = (uid: string, roomId: string, socket: Socket) => {
  const connectionKey = `${uid}:${roomId}`;
  if (userConnections.has(connectionKey)) {
    clearTimeout(userConnections.get(connectionKey)!);
    userConnections.delete(connectionKey);
  }

  socket.leave(roomId);
  socket.disconnect();

  const room = io.sockets.adapter.rooms.get(roomId);
  if (!room || room.size === 0) {
    removeCollabSession(roomId);
  } else {
    io.to(roomId).emit(CollabEvents.PARTNER_LEFT);
  }
};
