let onlineUsers = new Map();

// Setup socket connections and handle events
export function setupSocket(socket) {
    console.log('New socket connected:', socket.id);

    // Handle register event
    socket.on('register', (mobileNo) => {
        console.log(`User ${mobileNo} registered with socket ${socket.id}`);
        onlineUsers.set(mobileNo, socket.id);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        for (let [mobileNo, sockId] of onlineUsers.entries()) {
            if (sockId === socket.id) {
                onlineUsers.delete(mobileNo);
                break;
            }
        }
    });
}

export function getOnlineUsers() {
    return onlineUsers;
}
