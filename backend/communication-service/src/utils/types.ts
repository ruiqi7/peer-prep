export enum CommunicationEvents {
  // receive
  JOIN = "join",
  SEND_TEXT_MESSAGE = "send_text_message",
  USER_DISCONNECT = "user_disconnect",
  DISCONNECT = "disconnect",

  // send
  USER_JOINED = "user_joined",
  ALREADY_JOINED = "already_joined",
  TEXT_MESSAGE_RECEIVED = "text_message_received",
  USER_DISCONNECTED = "user_disconnected",
  DISCONNECTED = "disconnected",
}

export enum MessageTypes {
  USER_GENERATED = "user_generated",
  BOT_GENERATED = "bot_generated",
}

export type UserConnection = {
  timeout?: NodeJS.Timeout;
};
