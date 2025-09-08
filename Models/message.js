import mongoose from "../config/mongoDB.js";
const messageSchema = new mongoose.Schema(
    {
        senderId: { type: String, required: true },
        senderName: { type: String }, 
        receiverId: { type: String, required: true },
        receiverName: { type: String }, 
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },

    }
);
export default mongoose.model('Message', messageSchema, 'message');
