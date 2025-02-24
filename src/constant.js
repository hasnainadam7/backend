export const API_BYPASS_KEY = "674536e5-cbc9-46d2-9d7a-8b774b195a2c";

export const STATUS_CODE = {
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  SUCCESS: 200,
  NOT_FOUND: 404,
  NOT_ACCEPTABLE: 406,
  INTERNAL_SERVER: 500,
  CONFLICT_DATA: 409,
};


export const ChatEventEnum = Object.freeze({
  CONNECTION_EVENT: "connection",
  CONNECTED_EVENT: "connected",
  DISCONNECT_EVENT: "disconnect",
  JOIN_CHAT_EVENT: "joinChat",
  LEAVE_CHAT_EVENT: "leaveChat",
  UPDATE_GROUP_NAME_EVENT: "updateGroupName",
  MESSAGE: "message",
  NEW_CHAT_EVENT: "newChat",
  SOCKET_ERROR_EVENT: "socketError",
  STOP_TYPING_EVENT: "stopTyping",
  USER_ONLINE_STATUS_EVENT: "userOnlineStatus",
  START_TYPING_EVENT: "startTyping",
  MESSAGE_DELETE_EVENT: "messageDeleted",
  SERVER_MESSAGE: "serverMessage",
});

export const AvailableChatEvents = Object.values(ChatEventEnum);
