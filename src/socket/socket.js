// Mount event for user joining a chat room

let users = {};
//ye socket me users ko join kr ke track kry ga
const mountJoinChatEvent = (socket) => {
  socket.on("JOIN_CHAT_EVENT", ({ chatId, userId }) => {
    if (!chatId || !userId)
      return console.error("Invalid JOIN_CHAT_EVENT", { chatId, userId });
    console.log(`${userId} joined the chat 🤝. chatId: `, chatId);
    socket.join(chatId); // User joins the chat room
    socket.emit("SERVER_MESSAGE", `${userId} has joined room ${chatId}`);
  });
};
const mountJoinSocketEvent = (socket) => {
  socket.on("JOIN_SOCKET_EVENT", ({ userId }) => {
    if (!userId) return console.error("Invalid JOIN_SOCKET_EVENT", { userId });
    if (!users[userId]) {
      users[userId] = [];
    }
    if (!users[userId].includes(socket.id)) {
      users[userId].push(socket.id);
    }
  });
};

// Mount event for user starting to type
const mountParticipantTypingEvent = (socket) => {
  socket.on("START_TYPING_EVENT", ({ chatId }) => {
    if (!chatId)
      return console.error("Invalid START_TYPING_EVENT: chatId missing");
    console.log("🚀 ~ Typing started in chatId:", chatId);
    socket.to(chatId).emit("START_TYPING_EVENT", {
      userId: socket.data?.user?._id,
      name: socket.data?.user?.name,
      chatId,
    });
  });
};

// Mount event for user stopping typing
const mountParticipantStoppedTypingEvent = (socket) => {
  socket.on("STOP_TYPING_EVENT", ({ chatId }) => {
    if (!chatId)
      return console.error("Invalid STOP_TYPING_EVENT: chatId missing");
    console.log("🚀 ~ Typing stopped in chatId:", chatId);
    socket.to(chatId).emit("STOP_TYPING_EVENT", {
      userId: socket.data?.user?._id,
      name: socket.data?.user?.name,
      chatId,
    });
  });
};

const mountSendMessageToAllParticipantsEvent = (socket) => {
  socket.on("send_message", (data) => {
    console.log("send_message to all participants",users);
    // console.log("Message from Flutter: ", data);
    // Ensure user has joined the chat room before sending the message
    if (!data.groupId) {
      return console.error("No chatId provided with the message");
    }
  });
};

// Initialize socket connection and attach events
const initializeSocketIO = (ioClient) => {
  ioClient.use((socket, next) => {
    socket.data.user = { _id: socket.id, name: "shaheer" };
    next();
  });

  ioClient.on("connection", async (socket) => {
    console.log(users);
    const socketUser = socket.data?.user;
    try {
      socket.join(socketUser?._id); // Join the user to a unique room
      socket.emit("server_message", "Connected to server successfully! 🚀");
      

      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);
      mountSendMessageToAllParticipantsEvent(socket);
      mountJoinSocketEvent(socket);

      socket.on("disconnect", async () => {
        console.log(`User ${socketUser?._id} disconnected from socket ID: ${socket.id}`);
        if (socketUser?._id) {
          // print(socketUser?._id)
          for (const userId in users) {
            users[userId] = users[userId].filter((id) => id !== socket.id);
           
            if (users[userId].length === 0) {
              delete users[userId];
            }
          }
          console.log("User disconnected", users);
        
          socket.leave(socketUser?._id);
        }
      });

      socket.on("leave_chat_event", ({ chatId, userId }) => {
        if (!chatId || !userId)
          return console.error("Invalid LEAVE_CHAT_EVENT", { chatId, userId });
        socket.leave(chatId);
        console.log(`User ${userId} left room: ${chatId}`);
      });
    } catch (error) {
      console.log("🚀 ~ Error in Socket Connection:", error);
      socket.emit(
        "socket_error_event",
        error?.message || "Something went wrong with the socket connection."
      );
    }
  });

  return ioClient;
};

// Emit socket event function
const emitSocketEvent = (req, roomId, event, payload) => {

  if (!roomId || roomId.trim() === "" || !event) {
    console.error("Invalid emitSocketEvent params", { roomId, event });
    return;
  }

  try {
    let counter=0
    const io = req.app.get("ioClient");
   
    let toUser = payload.toUser;
    let toSocketId = users[toUser];
  
    if (toSocketId !== undefined && toSocketId.length > 0) {
  console.log(toSocketId);
      toSocketId.forEach((socketId) => {
        io.to(socketId).emit(event, payload);
        counter++;
      });
    }
    console.log(`Emitted ${event} to ${counter} users in room ${roomId}`);
  } catch (error) {
    console.error(
      `Failed to emit socket event '${event}' to room '${roomId}':`,
      error
    );
  } // Emit event to the specific room
};

export { initializeSocketIO, emitSocketEvent };
