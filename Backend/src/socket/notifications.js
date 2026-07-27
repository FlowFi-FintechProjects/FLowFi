const userSockets = new Map();

export function registerNotificationHandlers(io, socket) {
  // Store the mapping of userId to socket.id when a user connects
  socket.on('register_user', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered for notifications on socket ${socket.id}`);
  });

  // Handle server/client emitting a notification to a specific user
  socket.on('send_notification', (data) => {
    const { userId, title, message, type } = data;
    const targetSocketId = userSockets.get(userId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('receive_notification', { title, message, type });
    } else {
      console.log(`User ${userId} is not currently connected.`);
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
}

// Export a helper function so other parts of the server can also push notifications
export function sendNotification(io, userId, { title, message, type }) {
  const targetSocketId = userSockets.get(userId);
  if (targetSocketId) {
    io.to(targetSocketId).emit('receive_notification', { title, message, type });
  }
}
