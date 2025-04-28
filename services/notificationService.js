import { getOnlineUsers } from '../sockets/socketHandler.js';
import { getUserContacts } from '../services/userService.js'; // Just example

export async function createAndDispatchNotifications({ senderMobileNo, productId, io }) {
    const contacts = await getUserContacts(senderMobileNo);

    const onlineUsers = getOnlineUsers();

    contacts.forEach(mobileNo => {
        const socketId = onlineUsers.get(mobileNo);
        if (socketId) {
            io.to(socketId).emit('notification', {
                title: 'New Product Added!',
                message: `Your contact ${senderMobileNo} added a new product.`,
                productId,
            });
        }
    });
}
