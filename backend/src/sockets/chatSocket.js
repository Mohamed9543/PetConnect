function registerChatSocket(io) {
  io.on("connection", (socket) => {
    socket.on("join", (userId) => {
      socket.join(userId);
    });

    socket.on("typing", ({ conversationId, receiverId }) => {
      io.to(receiverId).emit("typing", { conversationId });
    });

    socket.on("disconnect", () => {});
  });
}

module.exports = registerChatSocket;
