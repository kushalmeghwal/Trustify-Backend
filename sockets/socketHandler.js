import { saveMessage } from "../service/userService.js";

export function setupSocket(io, socket) {
    console.log('New socket connected:', socket.id);


    socket.on('register', (userId) => {
        socket.join(userId)
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
    socket.on('sendMessage', async (data) => {
        try {
            const { senderId, receiverId, text } = data;
            io.to(receiverId).emit("receiveMessage", {
                senderId: senderId,
                receiverId: receiverId,
                text: text,
                timestamp: new Date(),
            });
            await saveMessage(data);

        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('error', { message: 'Message not sent' });
        }
    });



}



