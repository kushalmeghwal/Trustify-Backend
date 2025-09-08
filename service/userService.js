import neo4jDriver from "../config/database.js";
import Message from '../Models/message.js';

export async function getUserNameById(id) {
    const session = neo4jDriver.session();
    try {
        const result = await session.run(
            'MATCH(u:User{id:$id}) RETURN u',
            { id }
        );
        if (!result || result.records.length == 0) return "";
        const userNode = result.records[0].get('u');
        return userNode.properties.name;
    } catch (error) {
        console.error("Error fetching user names:", err);
        return "";
    } finally {
        await session.close();
    }
}
export async function saveMessage(data) {
    try {
        const { senderId, receiverId, text } = data;
        const senderName = await getUserNameById(senderId);
        const receiverName = await getUserNameById(receiverId);
        const message = new Message({ senderId, senderName, receiverId, receiverName, text });
        await message.save();

    } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Message not sent' });
    }

}