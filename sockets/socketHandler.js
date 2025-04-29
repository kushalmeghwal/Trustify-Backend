
export function setupSocket(socket) {
    console.log('New socket connected:', socket.id);


    socket.on('register', (userId) => {
        socket.join(userId)
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
}


