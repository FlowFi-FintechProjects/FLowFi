export function registerChatHandlers(io, socket) {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  socket.on('send_message', (data) => {
    const { roomId, message, sender } = data;
    io.to(roomId).emit('receive_message', {
      senderId: socket.id,
      sender,
      message,
      timestamp: new Date().toISOString()
    });
  });
}

