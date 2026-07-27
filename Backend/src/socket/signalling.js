export function registerSignallingHandlers(io, socket) {
  // 1. user joins a call room
  socket.on('join_call', (data) => {
    const { roomId, userId } = data;
    socket.join(roomId);
    // broadcast to everyone else in the room except the sender
    socket.to(roomId).emit('join_call', data);
    console.log(`User ${userId} (${socket.id}) joined call room ${roomId}`);
  });

  // 2. user sends WebRTC offer
  socket.on('offer', (data) => {
    const { roomId, offer } = data;
    socket.to(roomId).emit('offer', data);
  });

  // 3. user sends WebRTC answer
  socket.on('answer', (data) => {
    const { roomId, answer } = data;
    socket.to(roomId).emit('answer', data);
  });

  // 4. user sends ICE candidate
  socket.on('ice_candidate', (data) => {
    const { roomId, candidate } = data;
    socket.to(roomId).emit('ice_candidate', data);
  });
}
