import Message from '../Models/message.js';

export const getIndividualMessage = async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        if (!receiverId || !senderId) return res.status(400).json({
            success: false,
            message: "Both currentUserId and otherUserId are required."
        });
        const messages = await Message.find({
            $or: [
                { senderId: senderId, receiverId: receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }).sort({ timestamp: 1 });
        if (!messages || messages.length == 0) {
            return res.status(200).json({
                success: true,
                message: "No messages found between these users.",
                messages: []
            });
        }
        const formattedMessages = messages.map((m) => ({
            senderId: m.senderId,
            senderName: m.senderName,
            receiverId: m.receiverId,
            receiverName: m.receiverName,
            text: m.text,
            timestamp: m.timestamp,
            read: m.read,
        }));

        res.status(200).json({ success: true, messages: formattedMessages });
    } catch (error) {
        console.error("Error fetching personal messages:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching messages."
        });
    }



}

export const getChatList = async (req, res) => {
    try {
        const { currentUserId } = req.params;

        if (!currentUserId) {
            return res.status(400).json({
                success: false,
                message: "currentUserId is required"
            });
        }

        const chatList = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: currentUserId },
                        { receiverId: currentUserId },
                    ],
                },
            },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$senderId", currentUserId] },
                            "$receiverId",
                            "$senderId",
                        ],
                    },
                    lastMessage: { $first: "$$ROOT" },
                    partnerName: { $first: "$senderName" }, // or receiverName based on condition
                },
            },
            {
                $project: {
                    partnerId: "$_id",
                    partnerName: {
                        $cond: [
                            { $eq: ["$lastMessage.senderId", currentUserId] },
                            "$lastMessage.receiverName",
                            "$lastMessage.senderName",
                        ],
                    },
                    lastMessage: 1,
                    _id: 0,
                },
            },
            { $sort: { "lastMessage.timestamp": -1 } },
        ]);


        return res.status(200).json({
            success: true,
            chatList
        });

    } catch (error) {
        console.error("Error fetching chat list:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

